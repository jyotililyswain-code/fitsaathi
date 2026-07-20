const fetchBase = (
  process.env.SEO_BASE_URL || process.argv[2] || "http://127.0.0.1:3000"
).replace(/\/$/, "");
const canonicalOrigin = "https://thefitsaathi.com";
const expectedTitle = "FitSaathi Official – Coaches, Dojos & Gyms in India";
const expectedDescription =
  "FitSaathi is the official website for discovering home fitness coaches, personal trainers, yoga instructors, martial arts teachers, dojos, gyms and sports training services across India.";
const expectedWebsiteDescription =
  "FitSaathi is a fitness and sports platform for discovering coaches, personal trainers, yoga instructors, martial arts teachers, dojos, gyms and sports training services across India.";
const expectedAlternateNames = [
  "The FitSaathi",
  "TheFitSaathi",
  "Fit Saathi",
  "thefitsaathi.com",
];
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match?.[1] || "";
}

function metaContent(html, attributeName, value) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const tag = tags.find(
    (item) => attribute(item, attributeName).toLowerCase() === value.toLowerCase(),
  );
  return tag ? attribute(tag, "content") : "";
}

function linkHrefs(html, rel) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  return tags
    .filter((item) =>
      attribute(item, "rel")
        .toLowerCase()
        .split(/\s+/)
        .includes(rel.toLowerCase()),
    )
    .map((item) => attribute(item, "href"))
    .filter(Boolean);
}

function linkHref(html, rel) {
  return linkHrefs(html, rel)[0] || "";
}

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function visibleText(html) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function normalizedUrl(value) {
  try {
    return new URL(value).href;
  } catch {
    return value;
  }
}

function localResourcePath(value) {
  try {
    const parsed = new URL(decodeHtml(value), fetchBase);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return "";
  }
}

async function get(path) {
  return fetch(`${fetchBase}${path}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
    headers: { "user-agent": "FitSaathi SEO verification" },
  });
}

async function getResource(url) {
  const path = localResourcePath(url);
  if (!path) throw new Error(`Invalid resource URL: ${url}`);
  return get(path);
}

function schemaTypeIs(item, type) {
  const value = item?.["@type"];
  return Array.isArray(value) ? value.includes(type) : value === type;
}

try {
  const homepageResponse = await get("/");
  check(
    homepageResponse.status === 200,
    `Homepage returned ${homepageResponse.status}, expected 200.`,
  );
  const html = await homepageResponse.text();
  const title = decodeHtml(
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "",
  );
  const description = decodeHtml(metaContent(html, "name", "description"));
  const canonicalLinks = linkHrefs(html, "canonical").map(decodeHtml);
  const canonical = canonicalLinks[0] || "";
  const robots = metaContent(html, "name", "robots").toLowerCase();
  const ogSiteName = decodeHtml(metaContent(html, "property", "og:site_name"));
  const ogTitle = decodeHtml(metaContent(html, "property", "og:title"));
  const ogDescription = decodeHtml(metaContent(html, "property", "og:description"));
  const ogImage = decodeHtml(metaContent(html, "property", "og:image"));
  const ogUrl = decodeHtml(metaContent(html, "property", "og:url"));
  const faviconLinks = [
    ...linkHrefs(html, "icon"),
    ...linkHrefs(html, "shortcut"),
  ];
  const h1Matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1Text = h1Matches[0] ? visibleText(h1Matches[0][1]) : "";
  const text = visibleText(html);

  check(title.startsWith("FitSaathi"), "Homepage title does not start with FitSaathi.");
  check(
    title === expectedTitle,
    `Unexpected homepage title: ${title || "missing"}`,
  );
  check(
    description === expectedDescription,
    `Unexpected homepage meta description: ${description || "missing"}`,
  );
  check(
    canonicalLinks.length === 1,
    `Homepage contains ${canonicalLinks.length} canonical links, expected exactly one.`,
  );
  check(
    normalizedUrl(canonical) === `${canonicalOrigin}/`,
    `Homepage canonical is ${canonical || "missing"}.`,
  );
  check(!robots.includes("noindex"), "Homepage has an accidental noindex directive.");
  check(ogSiteName === "FitSaathi", `Open Graph site name is ${ogSiteName || "missing"}.`);
  check(Boolean(ogTitle), "Open Graph title is missing.");
  check(Boolean(ogDescription), "Open Graph description is missing.");
  check(Boolean(ogImage), "Open Graph image is missing.");
  check(
    normalizedUrl(ogUrl) === `${canonicalOrigin}/`,
    `Open Graph URL is ${ogUrl || "missing"}.`,
  );
  check(faviconLinks.length > 0, "Homepage does not contain a favicon link.");
  check(
    h1Matches.length === 1,
    `Homepage initial HTML contains ${h1Matches.length} H1 elements, expected one.`,
  );
  check(h1Text.includes("FitSaathi"), "Homepage H1 does not contain FitSaathi.");
  check(
    h1Text === "FitSaathi: Find Fitness Coaches, Dojos and Gyms Near You",
    `Unexpected homepage H1: ${h1Text || "missing"}`,
  );
  check(
    text.includes(
      "FitSaathi helps people discover home fitness coaches, personal trainers, yoga instructors, martial arts teachers, dojos, gyms and sports training services across India.",
    ),
    "Essential FitSaathi homepage introduction is absent from initial HTML.",
  );
  check(text.includes("About FitSaathi"), "Homepage About FitSaathi section is absent.");
  check(
    text.includes("thefitsaathi.com"),
    "The official domain is absent from visible homepage content.",
  );
  check(
    !/localhost|127\.0\.0\.1/i.test(html),
    "Homepage initial HTML contains a local-host reference.",
  );
  check(
    !/\.vercel\.app/i.test(canonical),
    "Homepage canonical contains a Vercel deployment host.",
  );

  const jsonLdBlocks = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  const schemas = [];
  for (const block of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(block[1]);
      if (Array.isArray(parsed?.["@graph"])) schemas.push(...parsed["@graph"]);
      else schemas.push(parsed);
    } catch {
      failures.push("Homepage contains invalid JSON-LD.");
    }
  }

  const websiteNodes = schemas.filter((item) => schemaTypeIs(item, "WebSite"));
  const organizationNodes = schemas.filter((item) => schemaTypeIs(item, "Organization"));
  const webPageNodes = schemas.filter((item) => schemaTypeIs(item, "WebPage"));
  const website = websiteNodes[0];
  const organization = organizationNodes[0];
  const webPage = webPageNodes[0];

  check(websiteNodes.length === 1, `Found ${websiteNodes.length} WebSite JSON-LD nodes, expected one.`);
  check(website?.name === "FitSaathi", "WebSite JSON-LD name is not FitSaathi.");
  check(website?.url === `${canonicalOrigin}/`, "WebSite JSON-LD URL is not the canonical homepage.");
  check(
    JSON.stringify(website?.alternateName) === JSON.stringify(expectedAlternateNames),
    "WebSite JSON-LD alternate names are missing or out of priority order.",
  );
  check(
    website?.description === expectedWebsiteDescription,
    "WebSite JSON-LD brand definition is missing or unexpected.",
  );
  check(
    website?.["@id"] === `${canonicalOrigin}/#website`,
    "WebSite JSON-LD has an unexpected stable ID.",
  );
  check(
    website?.publisher?.["@id"] === `${canonicalOrigin}/#organization`,
    "WebSite JSON-LD is not connected to the Organization node.",
  );
  check(
    organizationNodes.length === 1,
    `Found ${organizationNodes.length} Organization JSON-LD nodes, expected one.`,
  );
  check(organization?.name === "FitSaathi", "Organization JSON-LD name is not FitSaathi.");
  check(
    organization?.url === `${canonicalOrigin}/`,
    "Organization JSON-LD URL is not the canonical homepage.",
  );
  check(
    webPageNodes.length === 1 && webPage?.isPartOf?.["@id"] === website?.["@id"],
    "Homepage WebPage JSON-LD is missing or disconnected from WebSite.",
  );

  const logoUrl =
    typeof organization?.logo === "string"
      ? organization.logo
      : organization?.logo?.contentUrl || organization?.logo?.url || "";
  check(Boolean(logoUrl), "Organization JSON-LD logo URL is missing.");
  check(
    normalizedUrl(logoUrl) === `${canonicalOrigin}/favicon-512x512.png`,
    `Organization logo URL is ${logoUrl || "missing"}.`,
  );
  check(
    !/localhost|127\.0\.0\.1|\.vercel\.app/i.test(logoUrl),
    "Organization logo URL is not a production URL.",
  );
  check(
    organization?.logo?.width === 512 && organization?.logo?.height === 512,
    "Organization JSON-LD logo is not declared as 512 by 512 pixels.",
  );
  check(
    organization?.logo?.caption === "FitSaathi",
    "Organization JSON-LD logo caption is not FitSaathi.",
  );

  if (faviconLinks[0]) {
    const faviconResponse = await getResource(faviconLinks[0]);
    check(faviconResponse.status === 200, `Favicon returned ${faviconResponse.status}.`);
    check(
      (faviconResponse.headers.get("content-type") || "").startsWith("image/"),
      "Favicon is not served as an image.",
    );
  }

  if (logoUrl) {
    const logoResponse = await getResource(logoUrl);
    check(
      logoResponse.status === 200,
      `Structured-data logo returned ${logoResponse.status}.`,
    );
    check(
      (logoResponse.headers.get("content-type") || "").startsWith("image/"),
      "Structured-data logo is not served as an image.",
    );
  }

  if (ogImage) {
    const ogImageResponse = await getResource(ogImage);
    check(ogImageResponse.status === 200, `Open Graph image returned ${ogImageResponse.status}.`);
    check(
      (ogImageResponse.headers.get("content-type") || "").startsWith("image/"),
      "Open Graph image is not served as an image.",
    );
  }

  const requiredIconPaths = [
    "/favicon.ico",
    "/favicon-16x16.png",
    "/favicon-32x32.png",
    "/favicon-48x48.png",
    "/favicon-192x192.png",
    "/favicon-512x512.png",
    "/apple-touch-icon.png",
  ];
  for (const iconPath of requiredIconPaths) {
    const iconResponse = await get(iconPath);
    check(iconResponse.status === 200, `${iconPath} returned ${iconResponse.status}.`);
    check(
      (iconResponse.headers.get("content-type") || "").startsWith("image/"),
      `${iconPath} is not served as an image.`,
    );
  }

  const manifestResponse = await get("/manifest.webmanifest");
  check(
    manifestResponse.status === 200,
    `Web manifest returned ${manifestResponse.status}.`,
  );
  if (manifestResponse.status === 200) {
    const manifest = await manifestResponse.json();
    check(manifest.name === "FitSaathi", "Web manifest name is not FitSaathi.");
    check(manifest.short_name === "FitSaathi", "Web manifest short name is not FitSaathi.");
    for (const iconPath of ["/favicon-192x192.png", "/favicon-512x512.png"]) {
      check(
        manifest.icons?.some((icon) => icon.src === iconPath && icon.purpose === "any"),
        `Web manifest does not declare ${iconPath} with purpose any.`,
      );
    }
  }

  const robotsResponse = await get("/robots.txt");
  const robotsText = await robotsResponse.text();
  check(robotsResponse.status === 200, `robots.txt returned ${robotsResponse.status}.`);
  check(
    robotsText.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`),
    "robots.txt does not reference the canonical sitemap.",
  );
  check(!/^Disallow:\s*\/$/im.test(robotsText), "robots.txt blocks the entire site.");

  const sitemapResponse = await get("/sitemap.xml");
  const sitemapText = await sitemapResponse.text();
  check(sitemapResponse.status === 200, `sitemap.xml returned ${sitemapResponse.status}.`);
  check(
    sitemapText.includes(`<loc>${canonicalOrigin}/</loc>`),
    "Sitemap is missing the canonical homepage.",
  );
  check(
    !/localhost|127\.0\.0\.1|\.vercel\.app/i.test(sitemapText),
    "Sitemap contains a non-production host.",
  );
  for (const privatePath of [
    "/admin",
    "/owner",
    "/super-admin-dashboard",
    "/dashboard",
    "/seller-dashboard",
    "/coach-dashboard",
    "/dojo-dashboard",
    "/login",
    "/signup",
    "/chat",
    "/booking",
    "/checkout",
    "/cart",
    "/orders",
    "/wallet",
    "/profile",
    "/auth",
    "/home",
  ]) {
    check(
      !sitemapText.includes(`<loc>${canonicalOrigin}${privatePath}`),
      `Sitemap contains excluded path ${privatePath}.`,
    );
  }

  for (const [source, destination] of [
    ["/home", "/"],
    ["/marketplace", "/shop"],
    ["/seller/register", "/register-seller"],
  ]) {
    const redirectResponse = await get(source);
    const location = redirectResponse.headers.get("location") || "";
    check(
      redirectResponse.status === 308,
      `${source} returned ${redirectResponse.status}, expected permanent redirect.`,
    );
    check(
      new URL(location, fetchBase).pathname === destination,
      `${source} does not redirect to ${destination}.`,
    );
  }

  const publicTitles = new Map();
  for (const publicPath of [
    "/about",
    "/faq",
    "/contact",
    "/find-coach",
    "/coaches",
    "/dojos",
    "/shop",
    "/become-a-coach",
    "/register-dojo",
    "/register-seller",
    "/privacy",
    "/terms",
    "/policies/refunds",
  ]) {
    const publicResponse = await get(publicPath);
    const publicHtml = await publicResponse.text();
    const publicRobots = metaContent(publicHtml, "name", "robots").toLowerCase();
    const publicCanonical = decodeHtml(linkHref(publicHtml, "canonical"));
    const publicTitle = decodeHtml(
      publicHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "",
    );
    check(publicResponse.status === 200, `${publicPath} returned ${publicResponse.status}.`);
    check(!publicRobots.includes("noindex"), `${publicPath} has an unexpected noindex directive.`);
    check(
      normalizedUrl(publicCanonical) === `${canonicalOrigin}${publicPath}`,
      `${publicPath} has an unexpected canonical: ${publicCanonical || "missing"}.`,
    );
    check(Boolean(publicTitle), `${publicPath} is missing a title.`);
    if (publicTitles.has(publicTitle)) {
      failures.push(
        `${publicPath} duplicates the title used by ${publicTitles.get(publicTitle)}: ${publicTitle}`,
      );
    } else {
      publicTitles.set(publicTitle, publicPath);
    }
  }

  const filteredResponse = await get("/coaches?q=yoga");
  const filteredHtml = await filteredResponse.text();
  const filteredRobots = metaContent(filteredHtml, "name", "robots").toLowerCase();
  check(
    filteredResponse.status === 200,
    `Filtered coach directory returned ${filteredResponse.status}.`,
  );
  check(
    filteredRobots.includes("noindex") && filteredRobots.includes("follow"),
    "Filtered coach directory is not noindex, follow.",
  );

  const loginResponse = await get("/login");
  const loginHtml = await loginResponse.text();
  check(
    (loginResponse.headers.get("x-robots-tag") || "").includes("noindex"),
    "Login response is missing its X-Robots-Tag noindex control.",
  );
  check(
    metaContent(loginHtml, "name", "robots").toLowerCase().includes("noindex"),
    "Login HTML is missing its noindex metadata.",
  );

  const missingResponse = await get(`/seo-check-missing-${Date.now()}`);
  check(
    missingResponse.status === 404,
    `Missing page returned ${missingResponse.status}, expected 404.`,
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  console.error("SEO verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`SEO verification passed all branded-search checks for ${fetchBase}`);
}
