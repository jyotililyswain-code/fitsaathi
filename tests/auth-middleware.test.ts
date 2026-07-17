import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";

test("logged-out visitors are redirected away from protected pages", () => {
  const response = middleware(new NextRequest("https://fitsaathi.test/dashboard"));
  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get("location"),
    "https://fitsaathi.test/login?next=%2Fdashboard",
  );
});

test("a persisted refresh cookie allows the client to recover before rendering a protected page", () => {
  const response = middleware(
    new NextRequest("https://fitsaathi.test/dashboard", {
      headers: { cookie: "fitsaathi_refresh=persisted-session" },
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
});

test("the public homepage never redirects an authenticated or logged-out visitor", () => {
  for (const headers of [undefined, { cookie: "fitsaathi_refresh=persisted-session" }]) {
    const response = middleware(
      new NextRequest("https://fitsaathi.test/", headers ? { headers } : undefined),
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("location"), null);
  }
});

test("public discovery and information pages remain available with a session", () => {
  const publicPaths = [
    "/find-coach",
    "/coaches/coach-id",
    "/dojos/dojo-id",
    "/about",
    "/contact",
    "/policies/refunds",
  ];

  for (const path of publicPaths) {
    const response = middleware(
      new NextRequest(`https://fitsaathi.test${path}`, {
        headers: { cookie: "fitsaathi_refresh=persisted-session" },
      }),
    );
    assert.equal(response.status, 200, `${path} should be public`);
    assert.equal(response.headers.get("location"), null);
  }
});

test("role dashboards stay protected without creating homepage or login loops", () => {
  const dashboardPaths = [
    "/dashboard",
    "/owner/dojos/dojo-id/edit",
    "/coach-dashboard",
    "/dojo-dashboard",
    "/seller-dashboard",
    "/admin",
    "/super-admin-dashboard",
  ];

  for (const path of dashboardPaths) {
    const loggedOut = middleware(new NextRequest(`https://fitsaathi.test${path}`));
    assert.equal(loggedOut.status, 307, `${path} should require a session`);
    assert.match(loggedOut.headers.get("location") || "", /\/login\?next=/);

    const authenticated = middleware(
      new NextRequest(`https://fitsaathi.test${path}`, {
        headers: { cookie: "fitsaathi_refresh=persisted-session" },
      }),
    );
    assert.equal(authenticated.status, 200, `${path} should accept a session`);
    assert.equal(authenticated.headers.get("location"), null);
  }

  for (const path of ["/login", "/auth/callback?next=%2Fdashboard"]) {
    const response = middleware(
      new NextRequest(`https://fitsaathi.test${path}`, {
        headers: { cookie: "fitsaathi_refresh=persisted-session" },
      }),
    );
    assert.equal(response.status, 200, `${path} should not loop in middleware`);
    assert.equal(response.headers.get("location"), null);
  }
});
