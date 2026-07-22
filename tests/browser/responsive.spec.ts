import { expect, test, type Page } from "@playwright/test";

const requiredViewports = [
  { name: "320x568", width: 320, height: 568 },
  { name: "360x800", width: 360, height: 800 },
  { name: "375x667", width: 375, height: 667 },
  { name: "390x844", width: 390, height: 844 },
  { name: "412x915", width: 412, height: 915 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "820x1180", width: 820, height: 1180 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x720", width: 1280, height: 720 },
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
] as const;

const majorTemplates = [
  "/",
  "/home",
  "/find-coach",
  "/dojos",
  "/signup",
  "/booking",
  "/shop",
  "/pamphlet",
] as const;

const publicRouteSmoke = [
  "/about",
  "/fitsaathi-owner",
  "/contact",
  "/faq",
  "/coaches",
  "/products",
  "/cart",
  "/login",
  "/forgot-password",
  "/become-a-coach",
  "/register-dojo",
  "/register-seller",
  "/policies",
  "/privacy",
  "/terms",
  "/policies/refunds",
  "/policies/community-guidelines",
] as const;

for (const viewport of requiredViewports) {
  test(`major templates fit ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const route of majorTemplates) await assertRouteFits(page, route);
  });
}

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1366, height: 768 },
]) {
  test(`public route smoke on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const route of publicRouteSmoke) await assertRouteFits(page, route);
  });
}

test("mobile navigation and support dialog remain keyboard and landscape safe", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/home", { waitUntil: "domcontentloaded" });

  const menuButton = page.getByRole("button", { name: "Open navigation menu" });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  const menu = page.locator("#mobile-primary-navigation");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("overflow-y", "auto");
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(menuButton).toBeFocused();

  await page.locator("header").getByRole("button", { name: "Customer Care" }).click();
  const dialog = page.getByRole("dialog", { name: "Customer Care" });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box, "support dialog should have a measurable box").not.toBeNull();
  expect(box!.height).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("protected pages preserve the requested path through login", async ({ page }) => {
  for (const route of ["/dashboard", "/coach-dashboard", "/dojo-dashboard", "/seller-dashboard", "/chat"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(route).replace(/%/g, "%")}`));
  }
});

async function assertRouteFits(page: Page, route: string) {
  const pageErrors: string[] = [];
  const onPageError = (error: Error) => pageErrors.push(error.message);
  page.on("pageerror", onPageError);
  try {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status() ?? 200, `${route} should not return a server error`).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
    await page.waitForTimeout(100);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(
      Math.max(dimensions.page, dimensions.body),
      `${route} has document-level horizontal overflow: ${JSON.stringify(dimensions)}`,
    ).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(pageErrors, `${route} emitted an uncaught browser error`).toEqual([]);
  } finally {
    page.off("pageerror", onPageError);
  }
}
