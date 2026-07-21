import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import robots from "../app/robots";
import { isPublicSeoRoute } from "../lib/auth-client";
import { middleware } from "../middleware";
import {
  administratorPersonJsonLd,
  breadcrumbJsonLd,
  canonicalUrl,
  founderPersonJsonLd,
  generateSeoMetadata,
  hasSearchParameters,
  homePageJsonLd,
  organizationJsonLd,
  ownershipFaqItems,
  ownershipFaqJsonLd,
  seoConfig,
  seoImageUrl,
  siteUrl,
  websiteJsonLd,
} from "../lib/seo";

test("SEO URLs are permanently pinned to the FitSaathi production origin", () => {
  assert.equal(siteUrl, "https://thefitsaathi.com");
  assert.equal(
    canonicalUrl("https://preview-project.vercel.app/find-coach?q=yoga"),
    "https://thefitsaathi.com/find-coach",
  );
  assert.equal(
    seoImageUrl("https://preview-project.vercel.app/uploads/coach.jpg"),
    "https://thefitsaathi.com/uploads/coach.jpg",
  );
  assert.equal(
    seoImageUrl("data:image/png;base64,private-data"),
    "https://thefitsaathi.com/opengraph-image",
  );
});

test("homepage metadata has the required title, description and social cards", () => {
  const metadata = generateSeoMetadata();
  assert.deepEqual(metadata.title, { absolute: seoConfig.defaultTitle });
  assert.equal(metadata.description, seoConfig.defaultDescription);
  assert.deepEqual(metadata.alternates, { canonical: "https://thefitsaathi.com/" });
  assert.equal(metadata.openGraph?.url, "https://thefitsaathi.com/");
  assert.equal(metadata.openGraph?.siteName, "FitSaathi");
  assert.equal(
    (metadata.twitter as { card?: string } | undefined)?.card,
    "summary_large_image",
  );
});

test("homepage brand entity nodes use one connected production identity", () => {
  assert.equal(
    seoConfig.defaultTitle,
    "FitSaathi | Find Coaches, Gyms, Dojos and Fitness Services",
  );
  assert.equal(organizationJsonLd.name, "FitSaathi");
  assert.equal(organizationJsonLd.url, "https://thefitsaathi.com/");
  assert.deepEqual(organizationJsonLd.founder, {
    "@id": "https://thefitsaathi.com/#priyanshu-swain",
  });
  assert.deepEqual(organizationJsonLd.employee, {
    "@id": "https://thefitsaathi.com/#parthsaarthi",
  });
  assert.equal(
    organizationJsonLd.logo.contentUrl,
    "https://thefitsaathi.com/favicon-512x512.png",
  );
  assert.equal(websiteJsonLd.name, "FitSaathi");
  assert.equal(websiteJsonLd.url, "https://thefitsaathi.com/");
  assert.deepEqual(websiteJsonLd.publisher, {
    "@id": "https://thefitsaathi.com/#organization",
  });
  assert.deepEqual(homePageJsonLd.isPartOf, {
    "@id": "https://thefitsaathi.com/#website",
  });
});

test("official people and ownership FAQ use consistent linked entities", () => {
  assert.equal(founderPersonJsonLd.name, "Priyanshu Swain");
  assert.equal(
    founderPersonJsonLd.jobTitle,
    "Owner and Founder of FitSaathi",
  );
  assert.deepEqual(founderPersonJsonLd.worksFor, {
    "@id": organizationJsonLd["@id"],
  });
  assert.equal(founderPersonJsonLd.url, "https://thefitsaathi.com/about");

  assert.equal(administratorPersonJsonLd.name, "Parthsaarthi");
  assert.equal(
    administratorPersonJsonLd.jobTitle,
    "Administrator of FitSaathi",
  );
  assert.deepEqual(administratorPersonJsonLd.worksFor, {
    "@id": organizationJsonLd["@id"],
  });
  assert.equal(
    ownershipFaqJsonLd.mainEntity.length,
    ownershipFaqItems.length,
  );
  assert.deepEqual(
    ownershipFaqJsonLd.mainEntity.map((item) => ({
      question: item.name,
      answer: item.acceptedAnswer.text,
    })),
    ownershipFaqItems,
  );
});

test("ownership pages receive exact canonical metadata", () => {
  const about = generateSeoMetadata({
    title: "About FitSaathi | Owner Priyanshu Swain and Admin Parthsaarthi",
    description:
      "Learn about FitSaathi, also known as The FitSaathi. FitSaathi is owned and founded by Priyanshu Swain, and Parthsaarthi serves as its administrator.",
    path: "/about",
  });
  const owner = generateSeoMetadata({
    title: "FitSaathi Owner: Priyanshu Swain | The FitSaathi",
    description:
      "Priyanshu Swain is the owner and founder of FitSaathi. Parthsaarthi is the administrator of The FitSaathi platform.",
    path: "/fitsaathi-owner",
  });

  assert.deepEqual(about.alternates, {
    canonical: "https://thefitsaathi.com/about",
  });
  assert.deepEqual(owner.alternates, {
    canonical: "https://thefitsaathi.com/fitsaathi-owner",
  });
  assert.equal(
    about.title && typeof about.title === "object" && "absolute" in about.title
      ? about.title.absolute
      : about.title,
    "About FitSaathi | Owner Priyanshu Swain and Admin Parthsaarthi",
  );
  assert.equal(
    owner.title && typeof owner.title === "object" && "absolute" in owner.title
      ? owner.title.absolute
      : owner.title,
    "FitSaathi Owner: Priyanshu Swain | The FitSaathi",
  );
});

test("filtered directory URLs are noindex and breadcrumbs use canonical URLs", () => {
  assert.equal(hasSearchParameters({ q: "yoga" }), true);
  assert.equal(hasSearchParameters({}), false);
  const metadata = generateSeoMetadata({
    path: "/coaches?q=yoga",
    noIndex: true,
  });
  assert.deepEqual(metadata.alternates, {
    canonical: "https://thefitsaathi.com/coaches",
  });
  assert.equal((metadata.robots as { index?: boolean }).index, false);

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Coaches", path: "/coaches" },
  ]);
  assert.deepEqual(
    breadcrumbs.itemListElement.map((item) => item.item),
    ["https://thefitsaathi.com/", "https://thefitsaathi.com/coaches"],
  );
});

test("robots advertises the production sitemap and blocks private route groups", () => {
  const result = robots();
  assert.equal(result.host, "https://thefitsaathi.com");
  assert.equal(result.sitemap, "https://thefitsaathi.com/sitemap.xml");
  const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
  const blocked = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
  const allowed = Array.isArray(rule.allow) ? rule.allow : [rule.allow];
  for (const path of ["/", "/about", "/fitsaathi-owner"]) {
    assert.ok(allowed.includes(path), path + " should be explicitly allowed");
  }
  for (const path of ["/admin", "/dashboard", "/auth", "/api", "/setup"]) {
    assert.ok(blocked.includes(path), `${path} should be blocked`);
  }
});

test("production aliases redirect permanently and previews are noindex", () => {
  const previousVercelEnv = process.env.VERCEL_ENV;
  try {
    process.env.VERCEL_ENV = "production";
    const canonicalRedirect = middleware(
      new NextRequest("https://fitsaathi.com/find-coach?q=yoga"),
    );
    assert.equal(canonicalRedirect.status, 308);
    assert.equal(
      canonicalRedirect.headers.get("location"),
      "https://thefitsaathi.com/find-coach?q=yoga",
    );

    process.env.VERCEL_ENV = "preview";
    const previewResponse = middleware(
      new NextRequest("https://preview-project.vercel.app/find-coach"),
    );
    assert.equal(previewResponse.status, 200);
    assert.equal(
      previewResponse.headers.get("x-robots-tag"),
      "noindex, nofollow, noarchive",
    );
  } finally {
    if (previousVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previousVercelEnv;
  }
});

test("public SEO pages render while private pages retain the session guard", () => {
  for (const path of ["/", "/home", "/about", "/fitsaathi-owner", "/coaches/coach-id", "/dojos/dojo-id", "/policies/refunds", "/become-a-coach", "/register-dojo", "/register-seller"]) {
    assert.equal(isPublicSeoRoute(path), true, `${path} should render publicly`);
  }
  for (const path of ["/dashboard", "/seller/register", "/auth/verify-email", "/api/stats"]) {
    assert.equal(isPublicSeoRoute(path), false, `${path} should remain guarded`);
  }
});
