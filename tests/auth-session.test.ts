import assert from "node:assert/strict";
import test from "node:test";
import { localApi } from "../lib/local-api";

const jsonHeaders = { "content-type": "application/json" };

test("session bootstrap refreshes an expired access cookie before treating the user as logged out", async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  let meRequests = 0;

  globalThis.fetch = async (input) => {
    const url = String(input);
    requests.push(url);

    if (url.endsWith("/auth/refresh")) {
      return new Response(JSON.stringify({ user: { id: "user-1" } }), {
        status: 200,
        headers: jsonHeaders,
      });
    }
    if (url.endsWith("/auth/me")) {
      meRequests += 1;
      return meRequests === 1
        ? new Response(JSON.stringify({ error: "Authentication required." }), {
            status: 401,
            headers: jsonHeaders,
          })
        : new Response(
            JSON.stringify({
              id: "user-1",
              name: "Persistent User",
              email: "persistent@example.test",
              role: "customer",
            }),
            { status: 200, headers: jsonHeaders },
          );
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const user = await localApi<{ id: string }>("/auth/me");
    assert.equal(user.id, "user-1");
    assert.deepEqual(
      requests.map((url) => url.replace(/^.*\/api/, "/api")),
      ["/api/auth/me", "/api/auth/refresh", "/api/auth/me"],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("an invalid login does not attempt to refresh another session", async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];

  globalThis.fetch = async (input) => {
    const url = String(input);
    requests.push(url);
    return new Response(JSON.stringify({ error: "Invalid email or password." }), {
      status: 401,
      headers: jsonHeaders,
    });
  };

  try {
    await assert.rejects(
      localApi("/auth/login", { method: "POST", body: "{}" }),
      /Invalid email or password/,
    );
    assert.equal(requests.length, 1);
    assert.match(requests[0], /\/auth\/login$/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
