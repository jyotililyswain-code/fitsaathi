import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import { del, get, put } from "@vercel/blob";
import multer from "multer";
import sharp from "sharp";
import { config } from "./config";

const incoming = path.join(config.uploadRoot, ".incoming");
fs.mkdirSync(incoming, { recursive: true });
const blobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID));
const dojoFileTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const imageFileTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const upload = multer({ dest: incoming, limits: { fileSize: 8 * 1024 * 1024, files: 6 }, fileFilter: (_request, file, done) => done(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) });
export const dojoRegistrationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 5 },
  fileFilter: (_request, file, done) => {
    const allowed = file.fieldname === "certificate" ? dojoFileTypes : imageFileTypes;
    if (!allowed.has(file.mimetype)) return done(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    done(null, true);
  }
});
export const socialUpload = multer({
  dest: incoming,
  limits: { fileSize: 30 * 1024 * 1024, files: 8 },
  fileFilter: (_request, file, done) => done(null, ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "audio/mpeg", "audio/webm", "audio/ogg"].includes(file.mimetype))
});

export async function optimizeUploads(files: Express.Multer.File[], folder: "products" | "sellers" | "providers" | "aadhaar" | "social" | "payments") {
  const target = path.join(config.uploadRoot, folder); fs.mkdirSync(target, { recursive: true });
  return Promise.all(files.map(async (file, index) => {
    const name = `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}.webp`;
    const thumb = `thumb-${name}`;
    const source = file.buffer || await fs.promises.readFile(file.path);
    try {
      const image = await sharp(source).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      const thumbnail = folder === "products" ? await sharp(source).rotate().resize(320, 320, { fit: "cover" }).webp({ quality: 72 }).toBuffer() : undefined;
      if (blobEnabled) {
        const blob = await put(`uploads/${folder}/${name}`, image, { access: "private", contentType: "image/webp", addRandomSuffix: true });
        const thumbnailBlob = thumbnail ? await put(`uploads/${folder}/${thumb}`, thumbnail, { access: "private", contentType: "image/webp", addRandomSuffix: true }) : undefined;
        return { path: blob.pathname, thumbnail: thumbnailBlob?.pathname };
      }
      if (config.vercelRuntime) throw new Error("Persistent uploads on Vercel require a Vercel Blob store. Set BLOB_READ_WRITE_TOKEN in the project environment.");
      await fs.promises.writeFile(path.join(target, name), image);
      if (thumbnail) await fs.promises.writeFile(path.join(target, thumb), thumbnail);
      return { path: `/uploads/${folder}/${name}`, thumbnail: folder === "products" ? `/uploads/${folder}/${thumb}` : undefined };
    } finally {
      if (file.path) await fs.promises.rm(file.path, { force: true });
    }
  }));
}

function extensionFor(mimeType: string) {
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" } as Record<string, string>)[mimeType];
}

export async function uploadDojoRegistrationFiles(photo: Express.Multer.File, certificate: Express.Multer.File) {
  if (!blobEnabled) throw Object.assign(new Error("File storage is not configured. Connect a Vercel Blob store to this project and try again."), { status: 503 });
  const registrationId = crypto.randomUUID();
  const photoPathname = `dojo/${registrationId}/business-photo/photo.${extensionFor(photo.mimetype)}`;
  const certificatePathname = `dojo/${registrationId}/ownership-proof/document.${extensionFor(certificate.mimetype)}`;
  const created: string[] = [];
  try {
    const businessPhoto = await put(photoPathname, photo.buffer, { access: "private", contentType: photo.mimetype, addRandomSuffix: true });
    created.push(businessPhoto.url);
    const verificationDocument = await put(certificatePathname, certificate.buffer, { access: "private", contentType: certificate.mimetype, addRandomSuffix: true });
    created.push(verificationDocument.url);
    return { registrationId, businessPhotoPathname: businessPhoto.pathname, verificationDocumentPathname: verificationDocument.pathname, created };
  } catch (error) {
    if (created.length) await del(created).catch(() => undefined);
    throw error;
  }
}

export async function removeBlobUploads(urls: string[]) {
  if (urls.length && blobEnabled) await del(urls).catch(error => console.warn("blob.rollback_failed", { count: urls.length, error: error instanceof Error ? error.name : "unknown" }));
}

export async function readPrivateBlob(pathname: string) {
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode === 304 || !result.stream) return null;
  return { stream: Readable.fromWeb(result.stream as any), contentType: result.blob.contentType, size: result.blob.size };
}

export function removeUploads(paths: Array<string | null | undefined>) {
  const blobPaths = paths.filter((storedPath): storedPath is string => Boolean(storedPath && (storedPath.startsWith("http") || storedPath.startsWith("uploads/") || storedPath.startsWith("dojo/") || storedPath.startsWith("private/") || storedPath.startsWith("payments/"))));
  if (blobPaths.length && blobEnabled) void del(blobPaths).catch(error => console.warn("blob.delete_failed", error));
  const uploadRoot = path.resolve(config.uploadRoot);
  for (const storedPath of paths) {
    if (!storedPath?.startsWith("/uploads/")) continue;
    const relativePath = storedPath.slice("/uploads/".length).replaceAll("/", path.sep);
    const absolutePath = path.resolve(uploadRoot, relativePath);
    if (!absolutePath.startsWith(`${uploadRoot}${path.sep}`)) continue;
    fs.rmSync(absolutePath, { force: true });
  }
}

export function discardIncomingUploads(files: Express.Multer.File[] = []) {
  for (const file of files) if (file.path) fs.rmSync(file.path, { force: true });
}
