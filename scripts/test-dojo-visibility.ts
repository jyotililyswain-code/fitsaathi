import crypto from "node:crypto";
import assert from "node:assert/strict";
import { dojoModerationData, PUBLIC_DOJO_SELECT, publicDojoWhere } from "../lib/dojo-visibility";
import { prisma } from "../lib/prisma";

class ExpectedRollback extends Error {}

async function main() {
  const suffix = crypto.randomUUID();
  const dojoId = crypto.randomUUID();
  const dojoName = `Visibility Test ${suffix.slice(0, 8)}`;
  const [security] = await prisma.$queryRawUnsafe<Array<{ rls_enabled: boolean; verification_rls_enabled: boolean; approved_policy: boolean; anon_verification_select: boolean | null; anon_safe_name_select: boolean | null; anon_private_image_select: boolean | null }>>(`
    SELECT c.relrowsecurity AS rls_enabled,
      (SELECT v.relrowsecurity FROM pg_class v JOIN pg_namespace vn ON vn.oid = v.relnamespace WHERE vn.nspname = 'public' AND v.relname = 'verification_requests') AS verification_rls_enabled,
      EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'dojos' AND p.policyname = 'public_read_approved_dojos') AS approved_policy,
      (SELECT has_table_privilege(r.oid, 'public.verification_requests', 'SELECT') FROM pg_roles r WHERE r.rolname = 'anon') AS anon_verification_select,
      (SELECT has_column_privilege(r.oid, 'public.dojos', 'name', 'SELECT') FROM pg_roles r WHERE r.rolname = 'anon') AS anon_safe_name_select,
      (SELECT has_column_privilege(r.oid, 'public.dojos', 'imagePath', 'SELECT') FROM pg_roles r WHERE r.rolname = 'anon') AS anon_private_image_select
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'dojos'
  `);
  console.info("dojo.rls_checked", security || { rls_enabled: false, verification_rls_enabled: false, approved_policy: false });

  try {
    await prisma.$transaction(async tx => {
      const owner = await tx.user.create({ data: { name: "Visibility Test Owner", email: `dojo-visibility-${suffix}@example.invalid`, passwordHash: "rollback-only-test", role: "customer" } });
      const pending = await tx.dojo.create({ data: { id: dojoId, ownerId: owner.id, name: dojoName, category: "Karate", city: "Pune", address: "Test business address", status: "pending", approved: false } });
      assert.equal(pending.status, "pending");
      assert.equal(await tx.dojo.count({ where: { id: dojoId, ...publicDojoWhere({ search: dojoName }) } }), 0);

      await tx.dojo.update({ where: { id: dojoId }, data: dojoModerationData("approved") });
      const byName = await tx.dojo.findMany({ where: { id: dojoId, ...publicDojoWhere({ search: dojoName }) }, select: PUBLIC_DOJO_SELECT });
      const byCity = await tx.dojo.findMany({ where: { id: dojoId, ...publicDojoWhere({ city: "Pune" }) }, select: PUBLIC_DOJO_SELECT });
      const byCategory = await tx.dojo.findMany({ where: { id: dojoId, ...publicDojoWhere({ category: "Karate" }) }, select: PUBLIC_DOJO_SELECT });
      assert.equal(byName.length, 1);
      assert.equal(byCity.length, 1);
      assert.equal(byCategory.length, 1);

      await tx.dojo.update({ where: { id: dojoId }, data: dojoModerationData("rejected") });
      assert.equal(await tx.dojo.count({ where: { id: dojoId, ...publicDojoWhere({ search: dojoName }) } }), 0);
      console.info("dojo.visibility_flow_tested", { pendingVisible: 0, approvedNameMatches: byName.length, approvedCityMatches: byCity.length, approvedCategoryMatches: byCategory.length, rejectedVisible: 0 });
      throw new ExpectedRollback("Rollback test records");
    }, { timeout: 20_000 });
  } catch (error) {
    if (!(error instanceof ExpectedRollback)) throw error;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
