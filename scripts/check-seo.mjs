const fetchBase = (
  process.env.SEO_BASE_URL || process.argv[2] || "http://127.0.0.1:3000"
).replace(/\/$/, "");
const canonicalOrigin = "https://thefitsaathi.com";
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

function linkHref(html, rel) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  const tag = tags.find((item) =>
    attribute(item, "rel")
      .toLowerCase()
      .split(/\s+/)
      .includes(rel.toLowerCase()),
  );
  return tag ? attribute(tag, "href") : "";
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

function normalizedUrl(value) {
  try {
    return new URL(value).href;
  } catch {
    return value;
  }
}

async function get(path) {
  return fetch(`${fetchBase}${path}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
    headers: { "user-agent": "FitSaathi SEO verification" },
  });
}

try {
  const homepageResponse = await get("/");
  check(homepageResponse.status === 200, `Homepage returned ${homepageResponse.status}, expected 200.`);
  const html = await homepageResponse.text();
  const title = decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const description = decodeHtml(metaContent(html, "name", "description"));
  const canonical = decodeHtml(linkHref(html, "canonical"));
  const robots = metaContent(html, "name", "robots").toLowerCase();
  const ogTitle = decodeHtml(metaContent(html, "property", "og:title"));
  const ogDescription = decodeHtml(metaContent(html, "property", "og:description"));
  const ogImage = decodeHtml(metaContent(html, "property", "og:image"));
  const ogUrl = decodeHtml(metaContent(html, "property", "og:url"));
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const visibleText = decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));

  check(title.includes("FitSaathi"), "Homepage title does not contain FitSaathi.");
  check(title === "FitSaathi – Find Fitness Coaches, Gyms and Sports Academies", `Unexpected homepage title: ${title || "missing"}`);
  check(description.length >= 100, "Homepage meta description is missing or too short.");
  check(normalizedUrl(canonical) === `${canonicalOrigin}/`, `Homepage canonical is ${canonical || "missing"}.`);
  check(!robots.includes("noindex"), "Homepage has an accidental noindex directive.");
  check(ogTitle.includes("FitSaathi"), "Open Graph title is missing FitSaathi.");
  check(Boolean(ogDescription), "Open Graph description is missing.");
  check(Boolean(ogImage), "Open Graph image is missing.");
  check(normalizedUrl(ogUrl) === `${canonicalOrigin}/`, `Open Graph URL is ${ogUrl || "missing"}.`);
  check(h1Count === 1, `Homepage initial HTML contains ${h1Count} H1 elements, expected 1.`);
  check(
    visibleText.includes("FitSaathi is an Indian fitness and sports platform"),
    "Essential FitSaathi homepage introduction is absent from initial HTML.",
  );

  const jsonLdBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
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
  check(schemas.some((item) => item?.["@type"] === "WebSite" && item?.name === "FitSaathi"), "FitSaathi WebSite JSON-LD is missing.");
  check(schemas.some((item) => item?.["@type"] === "Organization" && item?.name === "FitSaathi"), "FitSaathi Organization JSON-LD is missing.");

  const seoUrls = [canonical, ogUrl, ogImage].filter(Boolean).join("\n");
  check(!/localhost|127\.0\.0\.1/i.test(seoUrls), "Homepage SEO URLs contain a local host.");
  check(!/\.vercel\.app/i.test(seoUrls), "Homepage SEO URLs contain a Vercel deployment host.");

  const robotsResponse = await get("/robots.txt");
  const robotsText = await robotsResponse.text();
  check(robotsResponse.status === 200, `robots.txt returned ${robotsResponse.status}.`);
  check(robotsText.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`), "robots.txt does not reference the canonical sitemap.");
  check(!/^Disallow:\s*\/$/im.test(robotsText), "robots.txt blocks the entire site.");

  const sitemapResponse = await get("/sitemap.xml");
  const sitemapText = await sitemapResponse.text();
  check(sitemapResponse.status === 200, `sitemap.xml returned ${sitemapResponse.status}.`);
  check(sitemapText.includes(`<loc>${canonicalOrigin}/</loc>`), "Sitemap is missing the canonical homepage.");
  check(!/localhost|127\.0\.0\.1|\.vercel\.app/i.test(sitemapText), "Sitemap contains a non-production host.");
  for (const privatePath of ["/admin", "/dashboard", "/login", "/signup", "/chat", "/booking", "/home"]) {
    check(!sitemapText.includes(`<loc>${canonicalOrigin}${privatePath}`), `Sitemap contains excluded path ${privatePath}.`);
  }

  const logoResponse = await get("/favicon-512x512.png");
  check(logoResponse.status === 200, `Structured-data logo returned ${logoResponse.status}.`);
  check((logoResponse.headers.get("content-type") || "").startsWith("image/"), "Structured-data logo is not served as an image.");

  for (const [source, destination] of [
    ["/home", "/"],
    ["/marketplace", "/shop"],
    ["/seller/register", "/register-seller"],
  ]) {
    const redirectResponse = await get(source);
    const location = redirectResponse.headers.get("location") || "";
    check(redirectResponse.status === 308, `${source} returned ${redirectResponse.status}, expected permanent redirect.`);
    check(new URL(location, fetchBase).pathname === destination, `${source} does not redirect to ${destination}.`);
  }

  for (const publicPath of ["/about", "/find-coach", "/dojos", "/shop", "/become-a-coach", "/register-dojo", "/register-seller"]) {
    const publicResponse = await get(publicPath);
    const publicHtml = await publicResponse.text();
    const publicRobots = metaContent(publicHtml, "name", "robots").toLowerCase();
    check(publicResponse.status === 200, `${publicPath} returned ${publicResponse.status}.`);
    check(!publicRobots.includes("noindex"), `${publicPath} has an unexpected noindex directive.`);
    check(Boolean(linkHref(publicHtml, "canonical")), `${publicPath} is missing a canonical link.`);
  }

  const filteredResponse = await get("/coaches?q=yoga");
  const filteredHtml = await filteredResponse.text();
  const filteredRobots = metaContent(filteredHtml, "name", "robots").toLowerCase();
  check(filteredResponse.status === 200, `Filtered coach directory returned ${filteredResponse.status}.`);
  check(filteredRobots.includes("noindex") && filteredRobots.includes("follow"), "Filtered coach directory is not noindex, follow.");

  const loginResponse = await get("/login");
  const loginHtml = await loginResponse.text();
  check((loginResponse.headers.get("x-robots-tag") || "").includes("noindex"), "Login response is missing its X-Robots-Tag noindex control.");
  check(metaContent(loginHtml, "name", "robots").toLowerCase().includes("noindex"), "Login HTML is missing its noindex metadata.");

  const missingResponse = await get(`/seo-check-missing-${Date.now()}`);
  check(missingResponse.status === 404, `Missing page returned ${missingResponse.status}, expected 404.`);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  console.error("SEO verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`SEO verification passed for ${fetchBase}`);
}
