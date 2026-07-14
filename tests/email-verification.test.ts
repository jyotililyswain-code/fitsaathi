import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { isStrongPassword, maskEmail, normalizeEmail } from "../lib/auth/email";

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

test("verification UI masks the mailbox and never persists the OTP", () => {
  assert.equal(maskEmail("person@example.com"), "pe••••@example.com");
  const page = fs.readFileSync(path.join(process.cwd(), "app/auth/verify-email/page.tsx"), "utf8");
  assert.doesNotMatch(page, /setItem\([^\n]*otp/i);
  assert.doesNotMatch(page, /searchParams[^\n]*token/i);
  assert.match(page, /\/auth\/verify-email/);
});

test("migration and auth routes preserve blocked account states", () => {
  const migration = fs.readFileSync(path.join(process.cwd(), "server/prisma/migrations/20260714160000_email_verification_booking_notifications/migration.sql"), "utf8");
  const authRoutes = fs.readFileSync(path.join(process.cwd(), "server/src/app.ts"), "utf8");
  assert.match(migration, /accountStatus" NOT IN \('banned', 'suspended', 'rejected', 'deleted'\)/);
  assert.match(migration, /'banned',[\s\S]*'suspended'/);
  assert.match(authRoutes, /\["banned", "suspended", "rejected", "deleted"\]/);
});
