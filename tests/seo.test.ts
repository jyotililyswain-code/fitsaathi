import assert from "node:assert/strict";
import test from "node:test";
import robots from "../app/robots";
import { isPublicSeoRoute } from "../lib/auth-client";
import {
  canonicalUrl,
  generateSeoMetadata,
  seoConfig,
  siteUrl,
} from "../lib/seo";

test("SEO URLs are permanently pinned to the FitSaathi production origin", () => {
  assert.equal(siteUrl, "https://fitsaathi.com");
  assert.equal(
    canonicalUrl("https://fitsaathi-git-preview.vercel.app/find-coach?q=yoga"),
    "https://fitsaathi.com/find-coach",
  );
});

test("homepage metadata has the required title, description and social cards", () => {
  const metadata = generateSeoMetadata();
  assert.equal(
    metadata.title,
    "FitSaathi – Find Fitness Coaches, Gyms and Sports Academies",
  );
  assert.equal(metadata.description, seoConfig.defaultDescription);
  assert.deepEqual(metadata.alternates, { canonical: "https://fitsaathi.com/" });
  assert.equal(metadata.openGraph?.url, "https://fitsaathi.com/");
  assert.equal(metadata.openGraph?.siteName, "FitSaathi");
  assert.equal(
    (metadata.twitter as { card?: string } | undefined)?.card,
    "summary_large_image",
  );
});

test("robots advertises the production sitemap and blocks private route groups", () => {
  const result = robots();
  assert.equal(result.host, "https://fitsaathi.com");
  assert.equal(result.sitemap, "https://fitsaathi.com/sitemap.xml");
  const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
  const blocked = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
  for (const path of ["/admin", "/dashboard", "/auth", "/api", "/setup"]) {
    assert.ok(blocked.includes(path), `${path} should be blocked`);
  }
});

test("public SEO pages render while private pages retain the session guard", () => {
  for (const path of ["/", "/home", "/coaches/coach-id", "/dojos/dojo-id", "/policies/refunds"]) {
    assert.equal(isPublicSeoRoute(path), true, `${path} should render publicly`);
  }
  for (const path of ["/dashboard", "/seller/register", "/auth/verify-email", "/api/stats"]) {
    assert.equal(isPublicSeoRoute(path), false, `${path} should remain guarded`);
  }
});
