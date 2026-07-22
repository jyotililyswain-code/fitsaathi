import { expect, test, type Page } from "@playwright/test";

const dashboardViewports = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

test("authenticated customer dashboard keeps one stable header and responsive card grid", async ({ page }) => {
  await mockAuthenticatedApi(page, "customer");
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Customer dashboard" })).toBeVisible();
  await expect(page.getByText("dashboard.customer.with.a.long.email@example.com")).toBeVisible();
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("header").getByText("dashboard.customer.with.a.long.email@example.com")).toHaveCount(0);

  for (const viewport of dashboardViewports) {
    await page.setViewportSize(viewport);
    await expect(page.locator("body")).toBeVisible();

    const geometry = await page.evaluate(() => {
      const header = document.querySelector("header");
      const main = document.querySelector("main");
      const grid = document.querySelector<HTMLElement>("[data-dashboard-grid]");
      const headerBox = header?.getBoundingClientRect();
      const mainBox = main?.getBoundingClientRect();
      const cardBoxes = grid
        ? [...grid.children].map((element) => (element as HTMLElement).getBoundingClientRect())
        : [];
      const visibleHeaderControls = header
        ? [...header.querySelectorAll<HTMLElement>("a,button")].filter((element) => {
            const style = getComputedStyle(element);
            const box = element.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
          })
        : [];

      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        headerHeight: headerBox?.height || 0,
        headerBottom: headerBox?.bottom || 0,
        headerPosition: header ? getComputedStyle(header).position : "",
        headerBackground: header ? getComputedStyle(header).backgroundColor : "",
        mainTop: mainBox?.top || 0,
        columns: new Set(cardBoxes.map((box) => Math.round(box.x))).size,
        cardHeights: cardBoxes.map((box) => box.height),
        bottomPadding: main ? Number.parseFloat(getComputedStyle(main).paddingBottom) : 0,
        controlsInsideViewport: visibleHeaderControls.every((element) => {
          const box = element.getBoundingClientRect();
          return box.left >= -1 && box.right <= window.innerWidth + 1;
        }),
        controlsNotClipped: visibleHeaderControls.every(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
      };
    });

    expect(geometry.headerHeight).toBe(80);
    expect(geometry.headerPosition).toBe("sticky");
    expect(geometry.headerBackground).toBe("rgb(11, 11, 15)");
    expect(geometry.mainTop).toBeGreaterThanOrEqual(geometry.headerBottom);
    expect(Math.max(geometry.documentWidth, geometry.bodyWidth)).toBeLessThanOrEqual(
      geometry.viewportWidth + 1,
    );
    expect(geometry.controlsInsideViewport).toBe(true);
    expect(geometry.controlsNotClipped).toBe(true);
    expect(geometry.cardHeights.every((height) => height >= 144)).toBe(true);
    expect(geometry.bottomPadding).toBeGreaterThanOrEqual(viewport.width >= 768 ? 80 : 64);

    const expectedColumns = viewport.width >= 1280 ? 4 : viewport.width >= 640 ? 2 : 1;
    expect(geometry.columns).toBe(expectedColumns);

    const desktopNavigation = page.locator('[aria-label="Primary navigation"]');
    if (viewport.width >= 1280) await expect(desktopNavigation).toBeVisible();
    else await expect(desktopNavigation).toBeHidden();
  }

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1366, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    const menuButton = page.getByRole("button", { name: "Open navigation menu" });
    await menuButton.click();
    const menu = page.locator("#mobile-primary-navigation");
    await expect(menu).toBeVisible();
    const [headerBox, menuBox] = await Promise.all([
      page.locator("header").boundingBox(),
      menu.boundingBox(),
    ]);
    expect(headerBox).not.toBeNull();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 1);
    await expect(menu).toHaveCSS("background-color", "rgb(11, 11, 15)");
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(menuButton).toBeFocused();
  }

  await page.setViewportSize({ width: 320, height: 568 });
  await page.getByRole("button", { name: "Notifications", exact: true }).click();
  const notificationMenu = page.locator("#notification-menu");
  await expect(notificationMenu).toBeVisible();
  const notificationBox = await notificationMenu.boundingBox();
  expect(notificationBox).not.toBeNull();
  expect(notificationBox!.x).toBeGreaterThanOrEqual(0);
  expect(notificationBox!.x + notificationBox!.width).toBeLessThanOrEqual(320);
  expect(notificationBox!.y).toBeGreaterThanOrEqual(80);
  await page.keyboard.press("Escape");
  await expect(notificationMenu).toBeHidden();
});

test("protected-page session loading reserves the final header height", async ({ page }) => {
  await mockAuthenticatedApi(page, "customer", 1_200);
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  const loadingHeader = page.locator("[data-session-loading-header]");
  await expect(loadingHeader).toBeVisible();
  await expect(loadingHeader).toHaveCSS("height", "80px");
  await expect(page.getByRole("heading", { name: "Customer dashboard" })).toBeVisible();
  await expect(page.locator("header")).toHaveCSS("height", "80px");
});

test("shared header changes keep every dashboard type and profile page overflow-safe", async ({ browser }) => {
  const routes = [
    ["/dashboard", "customer"],
    ["/coach-dashboard", "coach"],
    ["/dojo-dashboard", "dojo"],
    ["/seller-dashboard", "seller"],
    ["/super-admin-dashboard", "admin"],
    ["/profile", "customer"],
  ] as const;

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1366, height: 768 },
  ]) {
    for (const [route, role] of routes) {
      const page = await browser.newPage({ viewport });
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await mockAuthenticatedApi(page, role);
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status() ?? 200, route).toBeLessThan(500);
      await expect(page.locator("main").first()).toBeVisible();
      await page.waitForTimeout(150);
      const width = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(Math.max(width.document, width.body), `${route} at ${viewport.width}px`).toBeLessThanOrEqual(
        width.viewport + 1,
      );
      expect(pageErrors, `${route} emitted a browser error`).toEqual([]);
      await page.close();
    }
  }
});

async function mockAuthenticatedApi(
  page: Page,
  role: "customer" | "coach" | "dojo" | "seller" | "admin",
  authDelay = 0,
) {
  await page.context().addCookies([
    {
      name: "fitsaathi_access",
      value: "dashboard-layout-test-session",
      domain: "localhost",
      path: "/",
    },
  ]);

  await page.route("**/api/**", async (route) => {
    const requestUrl = new URL(route.request().url());
    const path = requestUrl.pathname;
    let payload: unknown = {};

    if (path === "/api/auth/me") {
      if (authDelay) await new Promise((resolve) => setTimeout(resolve, authDelay));
      payload = {
        id: `${role}-layout-test`,
        name: role === "customer" ? "Dashboard Customer" : `${role} layout test`,
        email:
          role === "customer"
            ? "dashboard.customer.with.a.long.email@example.com"
            : `${role}@example.com`,
        role,
        accountStatus: "active",
      };
    } else if (path === "/api/notifications") {
      payload = { items: [], unreadCount: 0 };
    } else if (path === "/api/dashboard/summary") {
      payload = { favorites: 2, reviews: 1, attendance: 3, students: 4, memberships: 1 };
    } else if (["/api/bookings", "/api/reviews"].includes(path)) {
      payload = [];
    } else if (path === "/api/dojos/me") {
      payload = {
        id: "dojo-layout-test",
        name: "Layout Test Dojo",
        establishmentType: "DOJO",
        status: "active",
        approved: true,
        verified: true,
      };
    } else if (path === "/api/seller/dashboard") {
      payload = {
        seller: {
          id: "seller-layout-test",
          ownerId: "seller-layout-test",
          owner: { name: "Seller Layout Test" },
          storeName: "Layout Test Store",
          status: "verified",
          verified: true,
          trusted: false,
          rating: 0,
          salesCount: 0,
        },
        products: [],
        orders: [],
      };
    } else if (path === "/api/admin/snapshot") {
      payload = {
        users: [],
        dojos: [],
        sellers: [],
        verifications: [],
        products: [],
        orders: [],
        payments: [],
        reports: [],
        audit: [],
        settings: {},
        counts: { users: 0, coaches: 0, dojos: 0, sellers: 0, bookings: 0, products: 0, orders: 0 },
      };
    } else if (path === "/api/social/me") {
      payload = {
        id: "customer-layout-test",
        name: "Dashboard Customer",
        age: 25,
        city: "Bhubaneswar",
        fitnessLevel: "Intermediate",
        photos: [],
        interests: ["Running", "Yoga"],
        verified: true,
        online: true,
        profileCompletion: { percent: 80 },
      };
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}
