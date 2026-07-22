import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

const fetchBase = (
  process.env.SEO_BASE_URL || process.argv[2] || "http://127.0.0.1:3000"
).replace(/\/$/, "");
const canonicalOrigin = "https://thefitsaathi.com";
const productionAliasOrigin = "https://fitsaathi.vercel.app";
const expectedTitle = "TheFitSaathi | Find Coaches, Gyms, Dojos and Fitness Services";
const expectedDescription =
  "TheFitSaathi is an Indian fitness and sports platform owned and founded by Priyanshu Swain and administered by Parthsaarthi.";
const expectedWebsiteDescription =
  "TheFitSaathi is an Indian fitness and sports platform for discovering coaches, personal trainers, yoga instructors, martial arts teachers, dojos, gyms and sports training services.";
const expectedAlternateNames = [
  "The FitSaathi",
  "TheFitSaathi Fitness and Sports Platform",
];
const indexableStaticPaths = [
  "/",
  "/find-coach",
  "/coaches",
  "/dojos",
  "/shop",
  "/products",
  "/seller",
  "/become-a-coach",
  "/register-dojo",
  "/register-seller",
  "/about",
  "/fitsaathi-owner",
  "/faq",
  "/contact",
  "/policies",
  "/privacy",
  "/terms",
  "/policies/refunds",
  "/policies/coach-conduct",
  "/policies/customer-conduct",
  "/policies/cancellations",
  "/policies/payments",
  "/policies/fitness-safety",
  "/policies/attendance-reliability",
  "/policies/coach-badges",
  "/policies/community-guidelines",
  "/policies/medical-consent",
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

function getWithHost(path, host) {
  return new Promise((resolve, reject) => {
    const target = new URL(path, `${fetchBase}/`);
    const request = (target.protocol === "https:" ? httpsRequest : httpRequest)(
      target,
      {
        headers: {
          host,
          "user-agent": "FitSaathi SEO verification",
        },
      },
      (response) => {
        const headers = new Headers();
        for (const [name, value] of Object.entries(response.headers)) {
          if (Array.isArray(value)) {
            for (const item of value) headers.append(name, item);
          } else if (value !== undefined) {
            headers.set(name, value);
          }
        }
        response.resume();
        resolve(
          new Response(null, {
            status: response.statusCode || 500,
            headers,
          }),
        );
      },
    );
    request.setTimeout(20_000, () => {
      request.destroy(new Error("Timed out while testing host-based redirect."));
    });
    request.on("error", reject);
    request.end();
  });
}

async function getFromProductionAlias(path) {
  if (fetchBase === canonicalOrigin) {
    return fetch(`${productionAliasOrigin}${path}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      headers: { "user-agent": "FitSaathi SEO verification" },
    });
  }

  return getWithHost(path, new URL(productionAliasOrigin).host);
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

function schemasFromHtml(html, label) {
  const blocks = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  const schemas = [];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]);
      if (Array.isArray(parsed)) schemas.push(...parsed);
      else if (Array.isArray(parsed?.["@graph"])) schemas.push(...parsed["@graph"]);
      else schemas.push(parsed);
    } catch {
      failures.push(label + " contains invalid JSON-LD.");
    }
  }
  return schemas;
}

try {
  const aliasPath =
    "/fitsaathi-owner?ref=google&utm_source=seo-redirect-check";
  const aliasResponse = await getFromProductionAlias(aliasPath);
  const aliasLocation = aliasResponse.headers.get("location") || "";
  check(
    aliasResponse.status === 308,
    `Production Vercel alias returned ${aliasResponse.status}, expected 308.`,
  );
  check(
    aliasLocation === `${canonicalOrigin}${aliasPath}`,
    `Production Vercel alias redirects to ${aliasLocation || "nothing"}.`,
  );
  const canonicalHostResponse =
    fetchBase === canonicalOrigin
      ? await get("/about")
      : await getWithHost("/about", new URL(canonicalOrigin).host);
  check(
    canonicalHostResponse.status === 200 &&
      !canonicalHostResponse.headers.has("location"),
    "The canonical host redirects instead of returning 200.",
  );

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

  check(title.startsWith("TheFitSaathi"), "Homepage title does not start with TheFitSaathi.");
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
  check(ogSiteName === "TheFitSaathi", `Open Graph site name is ${ogSiteName || "missing"}.`);
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
  check(h1Text.includes("TheFitSaathi"), "Homepage H1 does not contain TheFitSaathi.");
  check(
    h1Text === "TheFitSaathi: Find Fitness Coaches, Dojos and Gyms Near You",
    `Unexpected homepage H1: ${h1Text || "missing"}`,
  );
  check(
    text.includes(
      "TheFitSaathi helps people discover home fitness coaches, personal trainers, yoga instructors, martial arts teachers, dojos, gyms and sports training services across India.",
    ),
    "Essential FitSaathi homepage introduction is absent from initial HTML.",
  );
  check(text.includes("About TheFitSaathi"), "Homepage About TheFitSaathi section is absent.");
  check(
    text.includes(
      "TheFitSaathi is an Indian fitness, sports and coaching platform available at thefitsaathi.com. The platform helps users discover coaches, gyms, dojos, academies and sports-related services. Priyanshu Swain is the founder and owner of TheFitSaathi. Parthsaarthi is the administrator of the platform.",
    ),
    "Homepage entity summary is absent from initial HTML.",
  );
  check(
    text.includes(
      "TheFitSaathi is an independent fitness and sports platform and is not affiliated with other nutrition, healthcare or wellness applications using similar names.",
    ),
    "Homepage independence clarification is absent from initial HTML.",
  );
  check(!text.includes("Loading page..."), "Homepage exposes loading-only text.");
  check(
    html.includes('href="/about"') && html.includes('href="/fitsaathi-owner"'),
    "Homepage does not link to both ownership information pages.",
  );
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

  const schemas = schemasFromHtml(html, "Homepage");
  check(
    !/localhost|127\.0\.0\.1|\.vercel\.app/i.test(JSON.stringify(schemas)),
    "Homepage JSON-LD contains a non-production host.",
  );

  const websiteNodes = schemas.filter((item) => schemaTypeIs(item, "WebSite"));
  const organizationNodes = schemas.filter((item) => schemaTypeIs(item, "Organization"));
  const webPageNodes = schemas.filter((item) => schemaTypeIs(item, "WebPage"));
  const website = websiteNodes[0];
  const organization = organizationNodes[0];
  const webPage = webPageNodes[0];

  check(
    organization?.founder?.["@id"] ===
      canonicalOrigin + "/fitsaathi-owner#person" &&
      organization?.founder?.name === "Priyanshu Swain" &&
      organization?.founder?.jobTitle ===
        "Founder and Owner of TheFitSaathi",
    "Organization JSON-LD is not connected to the TheFitSaathi founder.",
  );
  check(
    organization?.member?.name === "Parthsaarthi" &&
      organization?.member?.jobTitle === "Administrator of TheFitSaathi",
    "Organization JSON-LD is not connected to the TheFitSaathi administrator.",
  );
  check(
    !("sameAs" in (organization || {})),
    "Organization JSON-LD contains unverified social-profile URLs.",
  );
  check(
    organization?.description ===
      "TheFitSaathi is an Indian fitness, sports and coaching platform founded and owned by Priyanshu Swain.",
    "Organization JSON-LD description is missing or inconsistent.",
  );

  check(websiteNodes.length === 1, `Found ${websiteNodes.length} WebSite JSON-LD nodes, expected one.`);
  check(website?.name === "TheFitSaathi", "WebSite JSON-LD name is not TheFitSaathi.");
  check(website?.url === canonicalOrigin, "WebSite JSON-LD URL is not the canonical origin.");
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
  check(organization?.name === "TheFitSaathi", "Organization JSON-LD name is not TheFitSaathi.");
  check(
    JSON.stringify(organization?.alternateName) ===
      JSON.stringify(expectedAlternateNames),
    "Organization JSON-LD alternate names are missing or out of order.",
  );
  check(
    organization?.url === canonicalOrigin,
    "Organization JSON-LD URL is not the canonical origin.",
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
    check(manifest.name === "TheFitSaathi", "Web manifest name is not TheFitSaathi.");
    check(manifest.short_name === "TheFitSaathi", "Web manifest short name is not TheFitSaathi.");
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
  for (const publicPath of ["/", "/about", "/fitsaathi-owner", "/faq", "/contact"]) {
    check(
      robotsText.includes("Allow: " + publicPath),
      "robots.txt does not explicitly allow " + publicPath + ".",
    );
  }

  const sitemapResponse = await get("/sitemap.xml");
  const sitemapText = await sitemapResponse.text();
  for (const publicPath of indexableStaticPaths) {
    const loc = publicPath === "/" ? canonicalOrigin + "/" : canonicalOrigin + publicPath;
    check(
      sitemapText.includes("<loc>" + loc + "</loc>"),
      "Sitemap is missing " + loc + ".",
    );
  }
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
  const publicDescriptions = new Map();
  for (const publicPath of indexableStaticPaths.filter((path) => path !== "/")) {
    const publicResponse = await get(publicPath);
    const publicHtml = await publicResponse.text();
    const publicRobots = metaContent(publicHtml, "name", "robots").toLowerCase();
    const publicCanonical = decodeHtml(linkHref(publicHtml, "canonical"));
    const publicTitle = decodeHtml(
      publicHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "",
    );
    const publicDescription = decodeHtml(
      metaContent(publicHtml, "name", "description"),
    );
    check(publicResponse.status === 200, `${publicPath} returned ${publicResponse.status}.`);
    check(!publicRobots.includes("noindex"), `${publicPath} has an unexpected noindex directive.`);
    check(
      normalizedUrl(publicCanonical) === `${canonicalOrigin}${publicPath}`,
      `${publicPath} has an unexpected canonical: ${publicCanonical || "missing"}.`,
    );
    check(
      linkHrefs(publicHtml, "canonical").length === 1,
      `${publicPath} should contain exactly one canonical link.`,
    );
    check(Boolean(publicTitle), `${publicPath} is missing a title.`);
    check(Boolean(publicDescription), `${publicPath} is missing a meta description.`);
    check(
      !/\bFitSaathi\b/.test(publicTitle + " " + publicDescription),
      `${publicPath} metadata uses an inconsistent brand spelling.`,
    );
    if (publicTitles.has(publicTitle)) {
      failures.push(
        `${publicPath} duplicates the title used by ${publicTitles.get(publicTitle)}: ${publicTitle}`,
      );
    } else {
      publicTitles.set(publicTitle, publicPath);
    }
    if (publicDescriptions.has(publicDescription)) {
      failures.push(
        `${publicPath} duplicates the description used by ${publicDescriptions.get(publicDescription)}: ${publicDescription}`,
      );
    } else {
      publicDescriptions.set(publicDescription, publicPath);
    }
  }

  const ownershipPageChecks = [
    {
      path: "/about",
      title:
        "About TheFitSaathi | Indian Fitness and Sports Platform",
      description:
        "Learn about TheFitSaathi, an Indian fitness and sports platform founded and owned by Priyanshu Swain and administered by Parthsaarthi.",
      openGraphTitle:
        "About TheFitSaathi | Indian Fitness and Sports Platform",
      openGraphDescription:
        "Learn about TheFitSaathi, an Indian fitness and sports platform founded and owned by Priyanshu Swain and administered by Parthsaarthi.",
      h1: "About TheFitSaathi",
      breadcrumbLabel: "About TheFitSaathi",
      hasFaq: false,
      people: 0,
      requiredSentences: [
        "Priyanshu Swain founded TheFitSaathi.",
        "Priyanshu Swain is the owner of TheFitSaathi.",
        "Parthsaarthi is the administrator of TheFitSaathi.",
        "The official website of TheFitSaathi is https://thefitsaathi.com.",
      ],
    },
    {
      path: "/fitsaathi-owner",
      title: "Who Is the Owner of TheFitSaathi? | Priyanshu Swain",
      description:
        "Priyanshu Swain is the founder and owner of TheFitSaathi, the Indian fitness, sports and coaching platform available at thefitsaathi.com.",
      openGraphTitle:
        "Who Is the Owner of TheFitSaathi? | Priyanshu Swain",
      openGraphDescription:
        "Priyanshu Swain is the founder and owner of TheFitSaathi, the Indian fitness, sports and coaching platform available at thefitsaathi.com.",
      h1: "Priyanshu Swain — Founder and Owner of TheFitSaathi",
      breadcrumbLabel: "Priyanshu Swain",
      hasFaq: true,
      people: 1,
      requiredSentences: [
        "Priyanshu Swain is the founder and owner of TheFitSaathi.",
        "TheFitSaathi is an Indian fitness, sports and coaching platform operating through the official domain thefitsaathi.com.",
        "Parthsaarthi is the administrator of TheFitSaathi.",
        "The official website of TheFitSaathi is https://thefitsaathi.com.",
      ],
    },
  ];
  const expectedFaqs = [
    {
      question: "Who is the owner of TheFitSaathi?",
      answer: "Priyanshu Swain is the owner and founder of TheFitSaathi.",
    },
    {
      question: "Who founded TheFitSaathi?",
      answer: "TheFitSaathi was founded by Priyanshu Swain.",
    },
    {
      question: "Who is the administrator of TheFitSaathi?",
      answer: "Parthsaarthi is the administrator of TheFitSaathi.",
    },
    {
      question: "What is the official website of TheFitSaathi?",
      answer: "The official website is https://thefitsaathi.com.",
    },
  ];

  for (const page of ownershipPageChecks) {
    const response = await get(page.path);
    const pageHtml = await response.text();
    const pageText = visibleText(pageHtml);
    const pageTitle = decodeHtml(
      pageHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "",
    );
    const pageDescription = decodeHtml(
      metaContent(pageHtml, "name", "description"),
    );
    const pageOpenGraphTitle = decodeHtml(
      metaContent(pageHtml, "property", "og:title"),
    );
    const pageOpenGraphDescription = decodeHtml(
      metaContent(pageHtml, "property", "og:description"),
    );
    const h1Matches = [
      ...pageHtml.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi),
    ];
    const schemas = schemasFromHtml(pageHtml, page.path);
    check(
      !/localhost|127\.0\.0\.1|\.vercel\.app/i.test(JSON.stringify(schemas)),
      page.path + " JSON-LD contains a non-production host.",
    );
    const people = schemas.filter((item) => schemaTypeIs(item, "Person"));
    const breadcrumbs = schemas.filter((item) =>
      schemaTypeIs(item, "BreadcrumbList"),
    );
    const faqs = schemas.filter((item) => schemaTypeIs(item, "FAQPage"));

    check(response.status === 200, page.path + " did not return 200.");
    check(pageTitle === page.title, page.path + " has an unexpected title.");
    check(
      pageDescription === page.description,
      page.path + " has an unexpected meta description.",
    );
    check(
      pageOpenGraphTitle === page.openGraphTitle,
      page.path + " has an unexpected Open Graph title.",
    );
    check(
      pageOpenGraphDescription === page.openGraphDescription,
      page.path + " has an unexpected Open Graph description.",
    );
    check(
      !(response.headers.get("x-robots-tag") || "").includes("noindex"),
      page.path + " has an unexpected X-Robots-Tag noindex directive.",
    );
    check(
      h1Matches.length === 1 && visibleText(h1Matches[0][1]) === page.h1,
      page.path + " does not have the expected single H1.",
    );
    check(
      pageText.includes("Home") && pageText.includes(page.breadcrumbLabel),
      page.path + " does not display its breadcrumb.",
    );
    for (const sentence of page.requiredSentences) {
      check(
        pageText.includes(sentence),
        page.path + " initial HTML is missing the exact sentence: " + sentence,
      );
    }
    check(
      !pageText.includes("Loading page..."),
      page.path + " exposes loading-only text.",
    );
    check(
      people.length === page.people,
      page.path + " has an unexpected Person node count.",
    );
    check(
      breadcrumbs.length === 1,
      page.path + " should contain exactly one BreadcrumbList node.",
    );
    check(
      faqs.length === (page.hasFaq ? 1 : 0),
      page.path + " has an unexpected FAQPage node count.",
    );

    if (page.hasFaq) {
      const founder = people.find(
        (person) => person["@id"] === canonicalOrigin + "/fitsaathi-owner#person",
      );
      check(
        founder?.name === "Priyanshu Swain" &&
          founder?.jobTitle === "Founder and Owner of TheFitSaathi" &&
          founder?.url === canonicalOrigin + "/fitsaathi-owner" &&
          founder?.worksFor?.["@id"] === canonicalOrigin + "/#organization" &&
          !("sameAs" in (founder || {})),
        page.path + " has missing or inconsistent Person JSON-LD.",
      );
      const faqEntities = faqs[0]?.mainEntity || [];
      check(
        faqEntities.length === expectedFaqs.length,
        page.path + " has an incomplete FAQPage schema.",
      );
      for (const item of expectedFaqs) {
        check(
          pageText.includes(item.question) && pageText.includes(item.answer),
          page.path + " does not visibly display an FAQ schema answer.",
        );
        check(
          faqEntities.some(
            (entity) =>
              entity.name === item.question &&
              entity.acceptedAnswer?.text === item.answer,
          ),
          page.path + " has FAQ JSON-LD that differs from the visible answer.",
        );
      }
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
