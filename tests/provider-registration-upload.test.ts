import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  containsInlineFileData,
  isOwnedProviderPath,
  providerBlobPathname,
  providerFileRule,
} from "../lib/provider-upload-rules";

test("provider upload paths are unique, scoped to the authenticated owner, and cannot be URLs", () => {
  const pathname = providerBlobPathname("coach", "user-123", "aadhaar-front", "file-456", "image/webp");
  assert.equal(pathname, "coach/user-123/aadhaar-front/file-456.webp");
  assert.equal(isOwnedProviderPath(pathname, "coach", "user-123", "aadhaar-front"), true);
  assert.equal(isOwnedProviderPath(pathname, "coach", "another-user", "aadhaar-front"), false);
  assert.equal(isOwnedProviderPath("https://public.example/aadhaar.webp", "coach", "user-123"), false);
  assert.equal(isOwnedProviderPath("data:image/png;base64,abc", "coach", "user-123"), false);
  assert.equal(isOwnedProviderPath("local-private:dojo/user-123/logo/file.webp", "dojo", "user-123", "logo"), true);
});

test("provider file rules keep identity images private-sized and permit PDF only for certificates", () => {
  const aadhaar = providerFileRule("coach", "aadhaar-front");
  const certificate = providerFileRule("dojo", "certificate");
  assert.equal(aadhaar?.maximumSizeInBytes, 2 * 1024 * 1024);
  assert.equal(aadhaar?.allowedContentTypes.includes("application/pdf"), false);
  assert.equal(certificate?.maximumSizeInBytes, 5 * 1024 * 1024);
  assert.equal(certificate?.allowedContentTypes.includes("application/pdf"), true);
  assert.equal(providerFileRule("coach", "logo"), null);
});

test("registration payload guard rejects Base64 and data URLs but accepts storage paths", () => {
  assert.equal(containsInlineFileData({ aadhaarFrontPath: "data:image/webp;base64,AAAA" }), true);
  assert.equal(containsInlineFileData({ image: "A".repeat(9000) }), true);
  assert.equal(containsInlineFileData({ aadhaarFrontPath: "coach/user/aadhaar-front/file.webp" }), false);
});

test("coach and dojo registration forms submit JSON paths instead of multipart files", () => {
  const root = process.cwd();
  const coach = fs.readFileSync(path.join(root, "app", "become-a-coach", "page.tsx"), "utf8");
  const dojo = fs.readFileSync(path.join(root, "app", "register-dojo", "page.tsx"), "utf8");
  const server = fs.readFileSync(path.join(root, "server", "src", "app.ts"), "utf8");

  for (const source of [coach, dojo]) {
    assert.match(source, /body:\s*JSON\.stringify\(/);
    assert.match(source, /uploadProviderFile/);
    assert.doesNotMatch(source, /request\.send\(body\)|body:\s*formData/);
  }
  assert.match(server, /app\.post\("\/api\/coaches", authenticate, asyncRoute/);
  assert.match(server, /app\.post\("\/api\/dojos", authenticate, asyncRoute/);
  assert.doesNotMatch(server, /app\.post\("\/api\/coaches"[^\n]+upload\.fields/);
  assert.doesNotMatch(server, /app\.post\("\/api\/dojos"[^\n]+Upload\.fields/);
});
