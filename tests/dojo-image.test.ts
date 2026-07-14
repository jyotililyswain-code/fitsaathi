import assert from "node:assert/strict";
import test from "node:test";
import { DOJO_FALLBACK_IMAGE, resolveDojoImageUrl } from "../lib/dojo-image";
import { validateProviderFileSelection } from "../lib/provider-upload-rules";

test("dojo image URLs support fallbacks, private paths, and legacy full URLs", () => {
  assert.equal(resolveDojoImageUrl(null, "dojo-id"), DOJO_FALLBACK_IMAGE);
  assert.equal(
    resolveDojoImageUrl("dojo/owner/logo/photo.webp", "dojo-id", "https://api.example.test"),
    "https://api.example.test/api/dojos/dojo-id/business-photo",
  );
  assert.equal(
    resolveDojoImageUrl("/api/dojos/dojo-id/business-photo", "dojo-id", "https://api.example.test"),
    "https://api.example.test/api/dojos/dojo-id/business-photo",
  );
  assert.equal(
    resolveDojoImageUrl("https://example.supabase.co/storage/v1/object/public/dojo/photo.webp", "dojo-id", "https://api.example.test"),
    "https://example.supabase.co/storage/v1/object/public/dojo/photo.webp",
  );
});

test("dojo profile photo selection accepts supported images up to 5 MB", () => {
  assert.equal(validateProviderFileSelection({ name: "dojo.jpg", size: 5 * 1024 * 1024, type: "image/jpeg" }, "dojo", "logo"), null);
  assert.match(validateProviderFileSelection({ name: "dojo.gif", size: 100, type: "image/gif" }, "dojo", "logo") || "", /JPG, PNG, or WebP/);
  assert.match(validateProviderFileSelection({ name: "dojo.webp", size: 5 * 1024 * 1024 + 1, type: "image/webp" }, "dojo", "logo") || "", /5 MB or smaller/);
});
