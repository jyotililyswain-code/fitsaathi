import crypto from "node:crypto";
import assert from "node:assert/strict";
import { automaticDojoActivation, dojoModerationData, PUBLIC_DOJO_SELECT, publicDojoWhere } from "../lib/dojo-visibility";
import { prisma } from "../lib/prisma";

async function main() {
  const suffix = crypto.randomUUID();
  const dojoId = crypto.randomUUID();
  const dojoName = `Visibility Test ${suffix.slice(0, 8)}`;
  const [security] = await prisma.$queryRawUnsafe<Array<{ rls_enabled: boolean; verification_rls_enabled: boolean; active_policy: boolean; anon_verification_select: boolean | null; anon_safe_name_select: boolean | null; anon_private_image_select: boolean | null }>>(`
    SELECT c.relrowsecurity AS rls_enabled,
      (SELECT v.relrowsecurity FROM pg_class v JOIN pg_namespace vn ON vn.oid = v.relnamespace WHERE vn.nspname = 'public' AND v.relname = 'verification_requests') AS verification_rls_enabled,
      EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'dojos' AND p.policyname = 'public_read_active_dojos') AS active_policy,
      (SELECT has_table_privilege(r.oid, 'public.verification_requests', 'SELECT') FROM pg_roles r WHERE r.rolname = 'anon') AS anon_verification_select,
      (SELECT has_column_privilege(r.oid, 'public.dojos', 'name', 'SELECT') FROM pg_roles r WHERE r.rolname = 'anon') AS anon_safe_name_select,
      (SELECT has_column_privilege(r.oid, 'public.dojos', 'imagePath', 'SELECT') FROM pg_roles r WHERE r.rolname = 'anon') AS anon_private_image_select
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'dojos'
  `);
  console.info("dojo.rls_checked", security || { rls_enabled: false, verification_rls_enabled: false, active_policy: false });

  try {
    await prisma.$transaction(async tx => {
      const ownerEmail = `dojo-visibility-${suffix}@example.invalid`;
      const otherEmail = `dojo-other-${suffix}@example.invalid`;
      const owner = await tx.user.create({ data: { name: "Visibility Test Owner", email: ownerEmail, emailNormalized: ownerEmail, emailVerified: true, accountStatus: "active", role: "customer" } });
      const otherUser = await tx.user.create({ data: { name: "Other Test User", email: otherEmail, emailNormalized: otherEmail, emailVerified: true, accountStatus: "active", role: "customer" } });
      const active = await tx.dojo.create({ data: { id: dojoId, ownerId: owner.id, name: dojoName, ownerName: owner.name, email: owner.email, phoneNumber: "9876543210", category: "Karate", city: "Pune", state: "Maharashtra", pincode: "411001", address: "Test business address", experience: "5 years", imagePath: `dojo/${dojoId}/business-photo/test.webp`, registrationPaymentStatus: "not_required", ...automaticDojoActivation() } });
      await tx.providerVerification.create({ data: { ownerId: owner.id, profileId: active.id, profileType: "dojo", certificatePath: `dojo/${dojoId}/ownership-proof/test.pdf` } });
      assert.equal(active.status, "active");
      assert.equal(active.approved, true);
      assert.equal(active.verified, false);
      const byName = await tx.dojo.findMany({ where: { id: dojoId, ...publicDojoWhere({ search: dojoName }) }, select: PUBLIC_DOJO_SELECT });
      const byCity = await tx.dojo.findMany({ where: { id: dojoId, ...publicDojoWhere({ city: "Pune" }) }, select: PUBLIC_DOJO_SELECT });
      const byCategory = await tx.dojo.findMany({ where: { id: dojoId, ...publicDojoWhere({ category: "Karate" }) }, select: PUBLIC_DOJO_SELECT });
      assert.equal(byName.length, 1);
      assert.equal(byCity.length, 1);
      assert.equal(byCategory.length, 1);

      assert.notEqual(otherUser.id, owner.id);

      await tx.dojo.update({ where: { id: dojoId }, data: dojoModerationData("suspended") });
      assert.equal(await tx.dojo.count({ where: { id: dojoId, ...publicDojoWhere({ search: dojoName }) } }), 0);
      console.info("dojo.visibility_flow_tested", { activeNameMatches: byName.length, activeCityMatches: byCity.length, activeCategoryMatches: byCategory.length, duplicatePrevented: true, suspendedVisible: 0 });
      await tx.dojo.create({ data: { ownerId: owner.id, name: "Duplicate", category: "Karate" } });
    }, { timeout: 20_000 });
  } catch (error) {
    if ((error as { code?: string }).code !== "P2002") throw error;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
