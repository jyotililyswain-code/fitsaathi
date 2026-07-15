import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { NextRequest } from "next/server";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { GET } from "../app/auth/callback/route";
import {
  callbackErrorCode,
  GOOGLE_OAUTH_ERRORS,
  googleOAuthErrorMessage,
  oauthDestination,
  safeOAuthRedirect
} from "../lib/google-oauth";
import {
  provisionGoogleProfile,
  type GoogleProfileRecord,
  type GoogleProfileStore
} from "../lib/google-oauth-profile";

test("the Google starter uses the real callback and locks duplicate submissions", () => {
  const source = fs.readFileSync("components/auth/GoogleOAuthButton.tsx", "utf8");
  assert.match(source, /type="button"/);
  assert.match(source, /if \(loading\) return/);
  assert.match(source, /disabled=\{loading\}/);
  assert.match(source, /aria-busy=\{loading\}/);
  assert.match(source, /redirectTo: `\$\{window\.location\.origin\}\/auth\/callback\?next=\/dashboard`/);
  assert.match(source, /prompt: "select_account"/);
});

test("OAuth next paths stay on the current origin", () => {
  assert.equal(safeOAuthRedirect("/dashboard?tab=bookings"), "/dashboard?tab=bookings");
  assert.equal(safeOAuthRedirect("https://evil.example/path"), "/dashboard");
  assert.equal(safeOAuthRedirect("//evil.example/path"), "/dashboard");
  assert.equal(safeOAuthRedirect("/\\evil.example/path"), "/dashboard");
});

test("OAuth destinations preserve trusted database role routing", () => {
  assert.equal(oauthDestination("customer", "/dashboard"), "/dashboard");
  assert.equal(oauthDestination("coach", "/dashboard"), "/coach-dashboard");
  assert.equal(oauthDestination("admin", "/dashboard"), "/super-admin-dashboard");
});

test("cancelled and malformed callbacks use safe public error codes", async () => {
  assert.equal(callbackErrorCode(new URLSearchParams("error=access_denied")), GOOGLE_OAUTH_ERRORS.cancelled);
  assert.equal(callbackErrorCode(new URLSearchParams("error=access_blocked")), GOOGLE_OAUTH_ERRORS.providerAccess);
  assert.equal(callbackErrorCode(new URLSearchParams("error=server_error")), GOOGLE_OAUTH_ERRORS.failed);
  assert.equal(callbackErrorCode(new URLSearchParams()), GOOGLE_OAUTH_ERRORS.invalidCallback);
  assert.match(googleOAuthErrorMessage(GOOGLE_OAUTH_ERRORS.failed), /failed/i);
  assert.match(googleOAuthErrorMessage(GOOGLE_OAUTH_ERRORS.providerAccess), /not currently allowed/i);

  const cancelled = await GET(new NextRequest("https://thefitsaathi.com/auth/callback?error=access_denied"));
  assert.equal(cancelled.status, 307);
  assert.equal(cancelled.headers.get("location"), "https://thefitsaathi.com/login?error=google_cancelled");

  const missingCode = await GET(new NextRequest("http://localhost:3000/auth/callback?next=/dashboard"));
  assert.equal(missingCode.status, 307);
  assert.equal(missingCode.headers.get("location"), "http://localhost:3000/login?error=google_callback_invalid");
});

test("a callback code that cannot be exchanged returns a safe login error", async () => {
  const response = await GET(new NextRequest("http://localhost:3000/auth/callback?code=invalid-code&next=/dashboard"));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "http://localhost:3000/login?error=google_signin_failed");
});

test("new Google users get one customer profile and repeated login is idempotent", async () => {
  const { records, store } = memoryProfileStore();
  const authUser = googleUser({
    user_metadata: {
      full_name: "Google Member",
      avatar_url: "https://lh3.googleusercontent.com/avatar",
      role: "admin"
    }
  });

  const created = await provisionGoogleProfile(authUser, store);
  const repeated = await provisionGoogleProfile(authUser, store);

  assert.equal(records.length, 1);
  assert.equal(created.id, authUser.id);
  assert.equal(created.authUserId, authUser.id);
  assert.equal(created.role, "customer");
  assert.equal(created.avatarUrl, "https://lh3.googleusercontent.com/avatar");
  assert.equal(repeated.id, created.id);
});

test("matching email profiles are linked without overwriting edited fields", async () => {
  const editedAvatar = "https://cdn.thefitsaathi.com/edited-avatar.jpg";
  const existing: GoogleProfileRecord = {
    id: "existing-profile",
    authUserId: null,
    name: "Edited Name",
    email: "member@example.com",
    emailVerifiedAt: null,
    avatarUrl: editedAvatar,
    role: "customer",
    accountStatus: "active"
  };
  const { records, store } = memoryProfileStore([existing]);

  const linked = await provisionGoogleProfile(googleUser(), store);

  assert.equal(records.length, 1);
  assert.equal(linked.id, existing.id);
  assert.equal(linked.authUserId, "google-user-id");
  assert.equal(linked.name, "Edited Name");
  assert.equal(linked.avatarUrl, editedAvatar);
  assert.equal(linked.role, "customer");
});

test("Google metadata is never applied to an existing profile with no avatar", async () => {
  const existing: GoogleProfileRecord = {
    id: "existing-profile",
    authUserId: "google-user-id",
    name: "Existing Name",
    email: "member@example.com",
    emailVerifiedAt: new Date("2026-07-14T12:00:00.000Z"),
    avatarUrl: null,
    role: "customer",
    accountStatus: "active"
  };
  const { store } = memoryProfileStore([existing]);

  const linked = await provisionGoogleProfile(googleUser(), store);

  assert.equal(linked.name, "Existing Name");
  assert.equal(linked.avatarUrl, null);
});

function googleUser(overrides: Partial<SupabaseUser> = {}) {
  return {
    id: "google-user-id",
    aud: "authenticated",
    role: "authenticated",
    email: "member@example.com",
    email_confirmed_at: "2026-07-15T12:00:00.000Z",
    confirmed_at: "2026-07-15T12:00:00.000Z",
    created_at: "2026-07-15T12:00:00.000Z",
    app_metadata: { provider: "google", providers: ["google"] },
    user_metadata: {
      full_name: "Google Name",
      avatar_url: "https://lh3.googleusercontent.com/new-avatar"
    },
    ...overrides
  } as SupabaseUser;
}

function memoryProfileStore(seed: GoogleProfileRecord[] = []) {
  const records = seed.map((record) => ({ ...record }));
  const store: GoogleProfileStore = {
    findByAuthUserId: async (authUserId) => records.find((record) => record.authUserId === authUserId) || null,
    findByEmail: async (email) => records.find((record) => record.email.toLowerCase() === email) || null,
    create: async (data) => {
      const record = { ...data };
      records.push(record);
      return record;
    },
    update: async (id, data) => {
      const index = records.findIndex((record) => record.id === id);
      assert.notEqual(index, -1);
      records[index] = { ...records[index], ...data };
      return records[index];
    }
  };
  return { records, store };
}
