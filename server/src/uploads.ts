import fs from "node:fs";
import path from "node:path";
import { del, put } from "@vercel/blob";
import multer from "multer";
import sharp from "sharp";
import { config } from "./config";

const incoming = path.join(config.uploadRoot, ".incoming");
fs.mkdirSync(incoming, { recursive: true });
const blobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID));

export const upload = multer({ dest: incoming, limits: { fileSize: 8 * 1024 * 1024, files: 6 }, fileFilter: (_request, file, done) => done(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) });
export const socialUpload = multer({
  dest: incoming,
  limits: { fileSize: 30 * 1024 * 1024, files: 8 },
  fileFilter: (_request, file, done) => done(null, ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "audio/mpeg", "audio/webm", "audio/ogg"].includes(file.mimetype))
});

export async function optimizeUploads(files: Express.Multer.File[], folder: "products" | "sellers" | "providers" | "aadhaar" | "social") {
  const target = path.join(config.uploadRoot, folder); fs.mkdirSync(target, { recursive: true });
  return Promise.all(files.map(async (file, index) => {
    const name = `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}.webp`;
    const thumb = `thumb-${name}`;
    const source = await fs.promises.readFile(file.path);
    try {
      const image = await sharp(source).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      const thumbnail = folder === "products" ? await sharp(source).rotate().resize(320, 320, { fit: "cover" }).webp({ quality: 72 }).toBuffer() : undefined;
      if (blobEnabled) {
        const blob = await put(`uploads/${folder}/${name}`, image, { access: "public", contentType: "image/webp" });
        const thumbnailBlob = thumbnail ? await put(`uploads/${folder}/${thumb}`, thumbnail, { access: "public", contentType: "image/webp" }) : undefined;
        return { path: blob.url, thumbnail: thumbnailBlob?.url };
      }
      if (config.vercelRuntime) throw new Error("Persistent uploads on Vercel require a Vercel Blob store. Set BLOB_READ_WRITE_TOKEN in the project environment.");
      await fs.promises.writeFile(path.join(target, name), image);
      if (thumbnail) await fs.promises.writeFile(path.join(target, thumb), thumbnail);
      return { path: `/uploads/${folder}/${name}`, thumbnail: folder === "products" ? `/uploads/${folder}/${thumb}` : undefined };
    } finally {
      await fs.promises.rm(file.path, { force: true });
    }
  }));
}

export function removeUploads(paths: Array<string | null | undefined>) {
  const blobPaths = paths.filter((storedPath): storedPath is string => Boolean(storedPath?.startsWith("http")));
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
  for (const file of files) fs.rmSync(file.path, { force: true });
}
