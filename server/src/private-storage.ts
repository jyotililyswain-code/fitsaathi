import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { del, get, put } from "@vercel/blob";
import { config } from "./config";

const key = crypto.createHash("sha256").update(config.jwtSecret).update(":fitsaathi-private-files:v1").digest();
const privateBlobPrefix = "blob-private:";
const blobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID));

export async function storeEncryptedFile(file: Express.Multer.File, folder: "verification" | "messages") {
  const target = path.join(config.privateRoot, folder);
  await fs.promises.mkdir(target, { recursive: true });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const source = await fs.promises.readFile(file.path);
  const encrypted = Buffer.concat([cipher.update(source), cipher.final()]);
  const tag = cipher.getAuthTag();
  const name = `${crypto.randomUUID()}.enc`;
  try {
    const payload = Buffer.concat([iv, tag, encrypted]);
    if (blobEnabled) {
      const blob = await put(`private/${folder}/${name}`, payload, { access: "private", contentType: "application/octet-stream" });
      return `${privateBlobPrefix}${blob.pathname}`;
    }
    if (config.vercelRuntime) throw new Error("Persistent private uploads on Vercel require a Vercel Blob store. Set BLOB_READ_WRITE_TOKEN in the project environment.");
    await fs.promises.writeFile(path.join(target, name), payload);
    return `${folder}/${name}`;
  } finally {
    await fs.promises.rm(file.path, { force: true });
  }
}

export async function readEncryptedFile(storedPath: string) {
  const payload = storedPath.startsWith(privateBlobPrefix)
    ? await readPrivateBlob(storedPath.slice(privateBlobPrefix.length))
    : await fs.promises.readFile(safePrivatePath(storedPath));
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]);
}

export function removePrivateFiles(paths: Array<string | null | undefined>) {
  const blobPaths = paths
    .filter((storedPath): storedPath is string => Boolean(storedPath?.startsWith(privateBlobPrefix)))
    .map(storedPath => storedPath.slice(privateBlobPrefix.length));
  if (blobPaths.length && blobEnabled) void del(blobPaths).catch(error => console.warn("blob.delete_failed", error));
  for (const storedPath of paths) {
    if (storedPath?.startsWith(privateBlobPrefix)) continue;
    if (!storedPath) continue;
    try { fs.rmSync(safePrivatePath(storedPath), { force: true }); } catch { /* Invalid paths are ignored safely. */ }
  }
}

async function readPrivateBlob(pathname: string) {
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200) throw new Error("Private file not found.");
  return streamToBuffer(result.stream);
}

async function streamToBuffer(stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream) {
  if ("getReader" in stream) {
    const reader = stream.getReader();
    const chunks: Buffer[] = [];
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of stream as NodeJS.ReadableStream) chunks.push(Buffer.from(chunk as Buffer));
  return Buffer.concat(chunks);
}

function safePrivatePath(storedPath: string) {
  const root = path.resolve(config.privateRoot);
  const absolute = path.resolve(root, storedPath.replaceAll("/", path.sep));
  if (!absolute.startsWith(`${root}${path.sep}`)) throw new Error("Invalid private file path.");
  return absolute;
}
