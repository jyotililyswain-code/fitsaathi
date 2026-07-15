import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { isStrongPassword, normalizeEmail } from "../lib/auth/email";

test("email normalization trims, normalizes case, and preserves aliases", () => {
  assert.equal(normalizeEmail("  Person.Name+coach@EXAMPLE.COM  "), "person.name+coach@example.com");
  assert.equal(normalizeEmail("person name@example.com"), null);
  assert.equal(normalizeEmail("missing-domain@"), null);
  assert.equal(normalizeEmail("missing-at.example.com"), null);
});

test("registration password policy enforces length and character classes", () => {
  assert.equal(isStrongPassword("StrongPass1!"), true);
  assert.equal(isStrongPassword("short1A"), false);
  assert.equal(isStrongPassword("alllowercase1"), false);
  assert.equal(isStrongPassword("ALLUPPERCASE1"), false);
  assert.equal(isStrongPassword("NoNumberHere"), false);
  assert.equal(isStrongPassword("NoSymbol123"), false);
});

test("registration activates accounts directly without an OTP screen", () => {
  const signup = fs.readFileSync(path.join(process.cwd(), "app/signup/page.tsx"), "utf8");
  const authRoutes = fs.readFileSync(path.join(process.cwd(), "server/src/app.ts"), "utf8");
  assert.doesNotMatch(signup, /router\.(?:push|replace)\("\/auth\/verify-email"\)/);
  assert.match(authRoutes, /verificationRequired: false/);
  assert.match(authRoutes, /emailVerified: true/);
});

test("automatic activation preserves blocked account states", () => {
  const migration = fs.readFileSync(path.join(process.cwd(), "server/prisma/migrations/20260715123000_disable_email_otp/migration.sql"), "utf8");
  const authRoutes = fs.readFileSync(path.join(process.cwd(), "server/src/app.ts"), "utf8");
  assert.match(migration, /WHEN "accountStatus" = 'pending_email_verification' THEN 'active'/);
  assert.match(authRoutes, /\["banned", "suspended", "rejected", "deleted"\]/);
});
