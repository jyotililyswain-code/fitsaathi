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
