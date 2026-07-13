require("dotenv/config");

const assert = require("node:assert/strict");
const test = require("node:test");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

function json(body) {
  return { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

function cookieHeader(response) {
  const setCookie = response.headers.get("set-cookie") || "";
  return ["fitsaathi_access", "fitsaathi_refresh"].map(name => setCookie.match(new RegExp(`${name}=([^;,]+)`))?.[0]).filter(Boolean).join("; ");
}

function cookie(cookies, name) {
  return cookies.split("; ").find(value => value.startsWith(`${name}=`)) || "";
}

async function body(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

test("PostgreSQL is the sole signup, login, session, and live-stat source of truth", async () => {
  const stamp = Date.now();
  const email = `source-of-truth-${stamp}@example.test`;
  const password = "PostgresOnly123!";
  try {
    const [first, duplicate] = await Promise.all([
      fetch(`${baseUrl}/auth/register`, json({ name: "Source Truth Audit", email, password })),
      fetch(`${baseUrl}/auth/register`, json({ name: "Duplicate Audit", email: email.toUpperCase(), password }))
    ]);
    assert.deepEqual([first.status, duplicate.status].sort(), [201, 409], "concurrent signup must create exactly one account");
    assert.equal(await prisma.user.count({ where: { email } }), 1);

    const createdResponse = first.status === 201 ? first : duplicate;
    const created = await body(createdResponse);
    assert.equal(created.user.email, email);
    const record = await prisma.user.findUniqueOrThrow({ where: { email } });
    assert.notEqual(record.passwordHash, password);
    assert.equal(await bcrypt.compare(password, record.passwordHash), true);

    const statsWithUser = await (await fetch(`${baseUrl}/stats`, { cache: "no-store" })).json();
    const login = await fetch(`${baseUrl}/auth/login`, json({ email, password }));
    assert.equal(login.status, 200);
    const loginSetCookie = login.headers.get("set-cookie") || "";
    assert.match(loginSetCookie, /fitsaathi_refresh=.*Max-Age=2592000/i, "the refresh cookie must persist for 30 days across browser restarts");
    assert.match(loginSetCookie, /HttpOnly/i);
    assert.match(loginSetCookie, /SameSite=Lax/i);
    const cookies = cookieHeader(login);
    assert.match(cookies, /fitsaathi_access=/);
    assert.match(cookies, /fitsaathi_refresh=/);
    const me = await fetch(`${baseUrl}/auth/me`, { headers: { cookie: cookies } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).id, record.id);

    const persistedRefreshCookie = cookie(cookies, "fitsaathi_refresh");
    const recovered = await fetch(`${baseUrl}/auth/refresh`, { method: "POST", headers: { cookie: persistedRefreshCookie } });
    assert.equal(recovered.status, 200, "the persistent refresh cookie must recover a reopened browser session");
    const recoveredAccessCookie = cookie(cookieHeader(recovered), "fitsaathi_access");
    assert.ok(recoveredAccessCookie);
    const recoveredCookies = `${recoveredAccessCookie}; ${persistedRefreshCookie}`;
    const recoveredMe = await fetch(`${baseUrl}/auth/me`, { headers: { cookie: recoveredCookies } });
    assert.equal(recoveredMe.status, 200);
    assert.equal((await recoveredMe.json()).id, record.id);

    const logout = await fetch(`${baseUrl}/auth/logout`, { method: "POST", headers: { cookie: recoveredCookies } });
    assert.equal(logout.status, 204);
    assert.match(logout.headers.get("set-cookie") || "", /fitsaathi_access=;/);
    assert.match(logout.headers.get("set-cookie") || "", /fitsaathi_refresh=;/);
    const revokedRefresh = await fetch(`${baseUrl}/auth/refresh`, { method: "POST", headers: { cookie: persistedRefreshCookie } });
    assert.equal(revokedRefresh.status, 401, "manual logout must revoke the persisted refresh session");
    assert.match(revokedRefresh.headers.get("set-cookie") || "", /fitsaathi_refresh=;/, "an invalid session must clear its stale cookie");

    const relogin = await fetch(`${baseUrl}/auth/login`, json({ email, password }));
    assert.equal(relogin.status, 200);
    const reloginCookies = cookieHeader(relogin);

    await prisma.user.delete({ where: { id: record.id } });
    const statsAfterDelete = await (await fetch(`${baseUrl}/stats`, { cache: "no-store" })).json();
    assert.equal(statsAfterDelete.users, statsWithUser.users - 1, "live homepage user count must decrease after PostgreSQL deletion");
    assert.equal((await fetch(`${baseUrl}/auth/me`, { headers: { cookie: reloginCookies } })).status, 401, "a deleted PostgreSQL user must lose access immediately");
  } finally {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
});
