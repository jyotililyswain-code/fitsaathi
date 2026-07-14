"use client";

import { upload } from "@vercel/blob/client";
import {
  extensionForContentType,
  providerBlobPathname,
  providerFileRule,
  validateProviderFileSelection,
  type ProviderFileKind,
  type ProviderRegistrationType,
} from "@/lib/provider-upload-rules";
import { API_URL, localApi } from "@/lib/local-api";

type UploadConfiguration = {
  success: true;
  data: { mode: "vercel-blob" | "local-private"; userId: string };
};

type UploadResult = {
  success: true;
  data: { path: string };
};

export async function getProviderUploadConfiguration(registrationType: ProviderRegistrationType, profileId?: string) {
  const query = new URLSearchParams({ registrationType });
  if (profileId) query.set("profileId", profileId);
  return localApi<UploadConfiguration>(`/provider-uploads/config?${query}`);
}

export async function prepareProviderFile(file: File, registrationType: ProviderRegistrationType, kind: ProviderFileKind) {
  const rule = providerFileRule(registrationType, kind);
  if (!rule) throw new Error("This file is not valid for the selected registration.");
  const selectionError = validateProviderFileSelection(file, registrationType, kind);
  if (selectionError) throw new Error(selectionError);
  if (file.type === "application/pdf") {
    if (file.size > rule.maximumSizeInBytes) throw new Error(`${rule.label} PDF must be 5 MB or smaller.`);
    return file;
  }
  try {
    const compressed = await compressImage(file, rule.label, rule.maximumImageDimension, rule.quality, finalImageLimit(kind, rule.maximumSizeInBytes));
    return compressed;
  } catch (error) {
    if (error instanceof Error && error.message.includes("must be")) throw error;
    throw new Error(`${rule.label} could not be compressed. Try a different JPG, PNG, or WebP image.`);
  }
}

export async function uploadProviderFile(options: {
  configuration: UploadConfiguration["data"];
  registrationType: ProviderRegistrationType;
  kind: ProviderFileKind;
  file: File;
  profileId?: string;
  onProgress?: (percentage: number) => void;
}) {
  const { configuration, registrationType, kind, file, profileId, onProgress } = options;
  const rule = providerFileRule(registrationType, kind);
  if (!rule) throw new Error("This file is not valid for the selected registration.");

  try {
    if (configuration.mode === "vercel-blob") {
      const pathname = providerBlobPathname(registrationType, configuration.userId, kind, uniqueId(), file.type);
      const result = await upload(pathname, file, {
        access: "private",
        handleUploadUrl: `${API_URL}/provider-uploads`,
        clientPayload: JSON.stringify({ registrationType, kind, profileId }),
        contentType: file.type,
        multipart: false,
        onUploadProgress: progress => onProgress?.(progress.percentage),
      });
      return result.pathname;
    }

    const body = new FormData();
    body.set("registrationType", registrationType);
    body.set("kind", kind);
    if (profileId) body.set("profileId", profileId);
    body.set("file", file, file.name || `upload.${extensionForContentType(file.type)}`);
    onProgress?.(5);
    const result = await localApi<UploadResult>("/provider-uploads/local", { method: "POST", body });
    onProgress?.(100);
    return result.data.path;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    if (/authentication|session|already has|storage is not configured/i.test(message)) throw error;
    throw new Error(`${rule.label} upload failed. Check your connection and try again.`);
  }
}

export async function cleanupProviderUploads(paths: string[]) {
  if (!paths.length) return;
  await localApi("/provider-uploads/cleanup", { method: "POST", body: JSON.stringify({ paths }) }).catch(() => undefined);
}

export function selectedFile(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);
  return value instanceof File && value.size > 0 ? value : null;
}

async function compressImage(file: File, label: string, maximumDimension: number, quality: number, maximumBytes: number) {
  const loaded = await loadImage(file);
  try {
    let scale = Math.min(1, maximumDimension / Math.max(loaded.width, loaded.height));
    let best: Blob | null = null;
    const minimumQuality = quality >= 0.82 ? 0.75 : 0.7;

    for (let dimensionAttempt = 0; dimensionAttempt < 3; dimensionAttempt += 1) {
      const width = Math.max(1, Math.round(loaded.width * scale));
      const height = Math.max(1, Math.round(loaded.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Image compression is unavailable in this browser.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(loaded.source, 0, 0, width, height);

      for (const currentQuality of [quality, Math.max(minimumQuality, quality - 0.06), minimumQuality]) {
        const blob = await canvasBlob(canvas, "image/webp", currentQuality);
        if (!best || blob.size < best.size) best = blob;
        if (blob.size <= maximumBytes) {
          if (file.size <= maximumBytes && file.size <= blob.size) return file;
          return new File([blob], replaceExtension(file.name, extensionForContentType(blob.type)), { type: blob.type, lastModified: Date.now() });
        }
      }
      scale *= 0.82;
    }

    if (file.size <= maximumBytes && (!best || file.size <= best.size)) return file;
    throw new Error(`${label} must be ${Math.round(maximumBytes / (1024 * 1024))} MB or smaller after compression.`);
  } finally {
    loaded.cleanup();
  }
}

async function loadImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; cleanup: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close() };
    } catch { /* Older mobile browsers use the image element fallback below. */ }
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("The selected image could not be decoded."));
    image.src = url;
  });
  return { source: image, width: image.naturalWidth, height: image.naturalHeight, cleanup: () => URL.revokeObjectURL(url) };
}

async function canvasBlob(canvas: HTMLCanvasElement, contentType: string, quality: number) {
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, contentType, quality));
  if (!blob) throw new Error("Image compression failed.");
  if (blob.type === contentType) return blob;
  const fallback = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!fallback) throw new Error("Image compression failed.");
  return fallback;
}

function finalImageLimit(kind: ProviderFileKind, defaultMaximum: number) {
  return kind === "certificate" ? 3 * 1024 * 1024 : defaultMaximum;
}

function replaceExtension(name: string, extension: string) {
  const base = name.replace(/\.[^.]+$/, "") || "upload";
  return `${base}.${extension}`;
}

function uniqueId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
