import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { del, get, head } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import multer from "multer";
import {
  extensionForContentType,
  isOwnedProviderPath,
  isProviderFileKind,
  isProviderRegistrationType,
  providerBlobPathname,
  providerFileRule,
  type ProviderFileKind,
  type ProviderRegistrationType,
} from "../../lib/provider-upload-rules";
import type { AuthRequest, SessionUser } from "./auth";
import { config } from "./config";
import { prisma } from "./db";

const blobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID));
const allContentTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export const localProviderUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 3 },
  fileFilter: (_request, file, done) => {
    if (!allContentTypes.has(file.mimetype)) return done(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    done(null, true);
  },
});

export function providerStorageMode() {
  if (blobEnabled) return "vercel-blob" as const;
  if (!config.vercelRuntime) return "local-private" as const;
  return "unavailable" as const;
}

export async function handleProviderBlobUpload(request: AuthRequest, body: HandleUploadBody, user: SessionUser) {
  if (!blobEnabled) throw providerUploadError(503, "STORAGE_NOT_CONFIGURED", "File storage is not configured. Connect a Vercel Blob store and try again.");
  return handleUpload({
    request,
    body,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      const payload = parseClientPayload(clientPayload);
      const rule = providerFileRule(payload.registrationType, payload.kind);
      if (!rule || !isOwnedProviderPath(pathname, payload.registrationType, user.id, payload.kind)) {
        throw providerUploadError(403, "UPLOAD_PATH_NOT_ALLOWED", "This upload path is not allowed for your account.");
      }
      console.info("provider_upload.token_issued", {
        requestId: request.requestId,
        userId: user.id,
        registrationType: payload.registrationType,
        fileKind: payload.kind,
      });
      return {
        allowedContentTypes: [...rule.allowedContentTypes],
        maximumSizeInBytes: rule.maximumSizeInBytes,
        addRandomSuffix: false,
        allowOverwrite: false,
        cacheControlMaxAge: 60,
        tokenPayload: JSON.stringify({ userId: user.id, registrationType: payload.registrationType, kind: payload.kind }),
      };
    },
  });
}

export async function storeLocalProviderUpload(
  file: Express.Multer.File,
  registrationType: ProviderRegistrationType,
  kind: ProviderFileKind,
  userId: string,
) {
  if (config.vercelRuntime || blobEnabled) throw providerUploadError(404, "LOCAL_UPLOAD_DISABLED", "The local upload endpoint is disabled.");
  const rule = providerFileRule(registrationType, kind);
  if (!rule || !rule.allowedContentTypes.includes(file.mimetype)) {
    throw providerUploadError(422, "UNSUPPORTED_FILE_TYPE", `${rule?.label || "File"} has an unsupported file type.`);
  }
  const maximumSize = maximumSizeFor(rule.maximumSizeInBytes, kind, file.mimetype);
  if (!file.size || file.size > maximumSize) {
    throw providerUploadError(413, "FILE_TOO_LARGE", `${rule.label} must be ${formatMegabytes(maximumSize)} MB or smaller.`);
  }
  const pathname = providerBlobPathname(registrationType, userId, kind, crypto.randomUUID(), file.mimetype);
  const absolute = privatePath(pathname);
  await fs.promises.mkdir(path.dirname(absolute), { recursive: true });
  await fs.promises.writeFile(absolute, file.buffer, { flag: "wx" });
  return `local-private:${pathname}`;
}

export async function assertProviderUpload(
  storedPath: string,
  registrationType: ProviderRegistrationType,
  kind: ProviderFileKind,
  userId: string,
) {
  const rule = providerFileRule(registrationType, kind);
  if (!rule || !isOwnedProviderPath(storedPath, registrationType, userId, kind)) {
    throw providerUploadError(422, "INVALID_UPLOAD_PATH", `${rule?.label || "File"} was not uploaded for this account.`);
  }

  let contentType: string;
  let size: number;
  if (storedPath.startsWith("local-private:")) {
    if (config.vercelRuntime) throw providerUploadError(422, "INVALID_UPLOAD_PATH", "Local file paths cannot be used on this deployment.");
    const pathname = storedPath.slice("local-private:".length);
    const stat = await fs.promises.stat(privatePath(pathname)).catch(() => null);
    if (!stat?.isFile()) throw providerUploadError(422, "UPLOAD_NOT_FOUND", `${rule.label} upload could not be found. Please upload it again.`);
    size = stat.size;
    contentType = contentTypeFromPath(pathname);
  } else {
    if (!blobEnabled) throw providerUploadError(503, "STORAGE_NOT_CONFIGURED", "Vercel Blob storage is not configured.");
    const metadata = await head(storedPath).catch(() => null);
    if (!metadata) throw providerUploadError(422, "UPLOAD_NOT_FOUND", `${rule.label} upload could not be found. Please upload it again.`);
    size = metadata.size;
    contentType = metadata.contentType;
    if (metadata.pathname !== storedPath) throw providerUploadError(422, "INVALID_UPLOAD_PATH", `${rule.label} has an invalid storage path.`);
  }

  const maximumSize = maximumSizeFor(rule.maximumSizeInBytes, kind, contentType);
  if (!rule.allowedContentTypes.includes(contentType)) throw providerUploadError(422, "UNSUPPORTED_FILE_TYPE", `${rule.label} has an unsupported file type.`);
  if (!size || size > maximumSize) throw providerUploadError(413, "FILE_TOO_LARGE", `${rule.label} must be ${formatMegabytes(maximumSize)} MB or smaller.`);
  return { contentType, size };
}

export async function removeUnreferencedProviderUploads(paths: Array<string | null | undefined>) {
  const candidates = [...new Set(paths.filter((value): value is string => Boolean(value)))];
  if (!candidates.length) return;
  const [coaches, dojos, verifications] = await Promise.all([
    prisma.coach.findMany({ where: { photoPath: { in: candidates } }, select: { photoPath: true } }),
    prisma.dojo.findMany({ where: { imagePath: { in: candidates } }, select: { imagePath: true } }),
    prisma.providerVerification.findMany({
      where: { OR: [{ aadhaarFrontPath: { in: candidates } }, { aadhaarBackPath: { in: candidates } }, { certificatePath: { in: candidates } }] },
      select: { aadhaarFrontPath: true, aadhaarBackPath: true, certificatePath: true },
    }),
  ]);
  const referenced = new Set<string>();
  for (const record of coaches) if (record.photoPath) referenced.add(record.photoPath);
  for (const record of dojos) if (record.imagePath) referenced.add(record.imagePath);
  for (const record of verifications) {
    if (record.aadhaarFrontPath) referenced.add(record.aadhaarFrontPath);
    if (record.aadhaarBackPath) referenced.add(record.aadhaarBackPath);
    if (record.certificatePath) referenced.add(record.certificatePath);
  }
  await removeProviderUploads(candidates.filter(candidate => !referenced.has(candidate)));
}

export async function removeProviderUploads(paths: Array<string | null | undefined>) {
  const blobPaths: string[] = [];
  for (const storedPath of new Set(paths.filter((value): value is string => Boolean(value)))) {
    if (storedPath.startsWith("local-private:")) {
      const pathname = storedPath.slice("local-private:".length);
      try { await fs.promises.rm(privatePath(pathname), { force: true }); } catch { /* Invalid local paths are ignored safely. */ }
    } else if (isProviderStoragePath(storedPath)) {
      blobPaths.push(storedPath);
    }
  }
  if (blobPaths.length && blobEnabled) await del(blobPaths).catch(error => console.warn("provider_upload.cleanup_failed", { count: blobPaths.length, error: error instanceof Error ? error.name : "unknown" }));
}

export async function readProviderUpload(storedPath: string) {
  if (storedPath.startsWith("local-private:")) {
    const pathname = storedPath.slice("local-private:".length);
    const absolute = privatePath(pathname);
    const stat = await fs.promises.stat(absolute).catch(() => null);
    if (!stat?.isFile()) return null;
    return { stream: fs.createReadStream(absolute), contentType: contentTypeFromPath(pathname), size: stat.size };
  }
  if (storedPath.startsWith("/uploads/")) {
    const relative = storedPath.slice("/uploads/".length).replaceAll("/", path.sep);
    const root = path.resolve(config.uploadRoot);
    const absolute = path.resolve(root, relative);
    if (!absolute.startsWith(`${root}${path.sep}`)) return null;
    const stat = await fs.promises.stat(absolute).catch(() => null);
    if (!stat?.isFile()) return null;
    return { stream: fs.createReadStream(absolute), contentType: contentTypeFromPath(storedPath), size: stat.size };
  }
  if (!blobEnabled || (!isProviderStoragePath(storedPath) && !/^(?:uploads\/(?:providers|aadhaar)\/|dojo\/)/.test(storedPath))) return null;
  const result = await get(storedPath, { access: "private" }).catch(() => null);
  if (!result || result.statusCode === 304 || !result.stream) return null;
  return { stream: Readable.fromWeb(result.stream as any), contentType: result.blob.contentType, size: result.blob.size };
}

export function providerUploadError(status: number, code: string, message: string) {
  return Object.assign(new Error(message), { status, code });
}

function parseClientPayload(clientPayload: string | null) {
  let value: unknown;
  try { value = JSON.parse(clientPayload || ""); } catch { throw providerUploadError(400, "INVALID_UPLOAD_REQUEST", "Upload metadata is invalid."); }
  const registrationType = (value as any)?.registrationType;
  const kind = (value as any)?.kind;
  if (!isProviderRegistrationType(registrationType) || !isProviderFileKind(kind) || !providerFileRule(registrationType, kind)) {
    throw providerUploadError(400, "INVALID_UPLOAD_REQUEST", "Upload metadata is invalid.");
  }
  return { registrationType, kind };
}

function maximumSizeFor(defaultMaximum: number, kind: ProviderFileKind, contentType: string) {
  return kind === "certificate" && contentType !== "application/pdf" ? 3 * 1024 * 1024 : defaultMaximum;
}

function privatePath(pathname: string) {
  const root = path.resolve(config.privateRoot, "provider-registration");
  const absolute = path.resolve(root, pathname.replaceAll("/", path.sep));
  if (!absolute.startsWith(`${root}${path.sep}`)) throw providerUploadError(422, "INVALID_UPLOAD_PATH", "The private upload path is invalid.");
  return absolute;
}

function contentTypeFromPath(pathname: string) {
  const extension = path.extname(pathname).toLowerCase();
  return ({ ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".pdf": "application/pdf" } as Record<string, string>)[extension] || "application/octet-stream";
}

function isProviderStoragePath(storedPath: string) {
  return /^(?:coach|dojo)\/[^/]+\/(?:profile|logo|certificate|aadhaar-front|aadhaar-back|gallery)\//.test(storedPath);
}

function formatMegabytes(bytes: number) {
  return Math.round(bytes / (1024 * 1024));
}
