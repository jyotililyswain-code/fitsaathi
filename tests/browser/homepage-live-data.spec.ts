import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Authentication required." }),
    });
  });
  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Refresh session expired." }),
    });
  });
});

test("homepage replaces the old stats panel with authenticated join actions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Join TheFitSaathi" }),
  ).toBeVisible();
  await expect(page.getByText("Live from Supabase")).toHaveCount(0);

  const dojo = page.getByRole("link", {
    name: /Register Dojo or Gym:/,
  });
  const coach = page.getByRole("link", { name: /Become a Coach:/ });
  const seller = page.getByRole("link", {
    name: /Register as a Seller:/,
  });

  await expect(dojo).toHaveAttribute(
    "href",
    "/login?next=%2Fregister-dojo",
  );
  await expect(coach).toHaveAttribute(
    "href",
    "/login?next=%2Fbecome-a-coach",
  );
  await expect(seller).toHaveAttribute(
    "href",
    "/login?next=%2Fregister-seller",
  );
  await expect(
    page.locator("header").getByRole("link", { name: "Check Live Data" }),
  ).toBeVisible();

  await coach.click();
  await expect(page).toHaveURL(/\/login\?next=%2Fbecome-a-coach$/);
});

test("authenticated join actions open every form and stop duplicate registrations", async ({
  page,
}) => {
  await page.unroute("**/api/auth/me");
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "4f1ba09b-b8fb-44bb-9d07-c5652bfa8314",
        name: "FitSaathi Test User",
        email: "member@example.com",
        role: "customer",
        accountStatus: "active",
      }),
    });
  });

  let existingCoach = false;
  await page.route("**/api/registration-status?type=*", async (route) => {
    const type = new URL(route.request().url()).searchParams.get("type");
    if (type === "coach" && existingCoach) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          exists: true,
          canRegister: false,
          status: "pending",
          message: "You have already submitted a coach registration.",
          manageHref: "/coach-dashboard",
          manageLabel: "Open coach dashboard",
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        exists: false,
        canRegister: true,
        manageHref: "/dashboard",
        manageLabel: "Open my dashboard",
      }),
    });
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const coachAction = page.getByRole("link", { name: /Become a Coach:/ });
  await expect(coachAction).toHaveAttribute("href", "/become-a-coach");
  await coachAction.click();
  await expect(
    page.getByRole("heading", { name: /Register with real profile details/ }),
  ).toBeVisible({ timeout: 30_000 });

  await page.goto("/");
  await page.getByRole("link", { name: /Register Dojo or Gym:/ }).click();
  await expect(
    page.getByRole("heading", { name: /Register Your Dojo or Gym/ }),
  ).toBeVisible({ timeout: 30_000 });

  await page.goto("/");
  await page.getByRole("link", { name: /Register as a Seller:/ }).click();
  await expect(
    page.getByRole("heading", { name: /Open your fitness store/ }),
  ).toBeVisible({ timeout: 30_000 });

  existingCoach = true;
  await page.goto("/become-a-coach");
  await expect(
    page.getByRole("heading", { name: "Registration already submitted" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open coach dashboard" }),
  ).toHaveAttribute("href", "/coach-dashboard");
});

test("live data renders real API values and refreshes without fake fallbacks", async ({
  page,
}) => {
  let requestCount = 0;
  await page.route("**/api/stats", async (route) => {
    requestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        users: requestCount === 1 ? 101 : 102,
        coaches: 12,
        dojos: 8,
        sellers: 6,
        bookings: 44,
        products: 9,
      }),
    });
  });

  await page.goto("/live-data", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "FitSaathi activity" }),
  ).toBeVisible();
  await expect(page.getByText("101", { exact: true })).toBeVisible();
  await expect(page.getByText("Total registered coaches")).toBeVisible();
  await expect(page.getByText(/Last updated/)).toBeVisible();

  await page.getByRole("button", { name: "Refresh live data" }).click();
  await expect(page.getByText("102", { exact: true })).toBeVisible();
  expect(requestCount).toBe(2);
});

test("live data exposes an error state and a working retry action", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/stats", async (route) => {
    if (fail) {
      fail = false;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Live Supabase stats are unavailable right now.",
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        users: 7,
        coaches: 5,
        dojos: 3,
        sellers: 2,
        bookings: 11,
        products: 4,
      }),
    });
  });

  await page.goto("/live-data", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", {
      name: "Live data is temporarily unavailable",
    }),
  ).toBeVisible();
  await expect(page.getByText("7", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("7", { exact: true })).toBeVisible();
});

test("mobile menu owns the live-data link and releases scroll after navigation", async ({
  page,
}) => {
  await page.route("**/api/stats", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        users: 1,
        coaches: 1,
        dojos: 1,
        sellers: 1,
        bookings: 1,
        products: 1,
      }),
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const header = page.locator("header");
  await expect(
    header.getByRole("link", { name: "Check Live Data" }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  const menu = page.locator("#mobile-primary-navigation");
  await expect(menu.getByRole("link", { name: "Check Live Data" })).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  await menu.getByRole("link", { name: "Check Live Data" }).click();
  await expect(page).toHaveURL("/live-data");
  await expect(menu).toBeHidden();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});
