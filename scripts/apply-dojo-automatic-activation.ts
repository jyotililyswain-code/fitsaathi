import { prisma } from "../lib/prisma";

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TYPE "ProviderStatus" ADD VALUE IF NOT EXISTS 'active'`);
  await prisma.$executeRawUnsafe(`ALTER TYPE "ProviderStatus" ADD VALUE IF NOT EXISTS 'inactive'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.dojos ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3)`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.dojos ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE`);
  await prisma.$executeRawUnsafe(`UPDATE public.dojos SET status='active', "approvedAt"=COALESCE("approvedAt", CURRENT_TIMESTAMP) WHERE status='approved' AND approved=TRUE`);
  const activated = await prisma.$executeRawUnsafe(`
    UPDATE public.dojos AS dojo
    SET status='active', approved=TRUE, "approvedAt"=COALESCE(dojo."approvedAt", CURRENT_TIMESTAMP), verified=FALSE
    WHERE dojo.status='pending' AND dojo.approved=FALSE
      AND dojo."registrationPaymentStatus" IN ('paid', 'not_required')
      AND NULLIF(BTRIM(dojo.name), '') IS NOT NULL
      AND NULLIF(BTRIM(dojo.category), '') IS NOT NULL
      AND NULLIF(BTRIM(dojo."phoneNumber"), '') IS NOT NULL
      AND NULLIF(BTRIM(dojo.email), '') IS NOT NULL
      AND NULLIF(BTRIM(dojo.address), '') IS NOT NULL
      AND NULLIF(BTRIM(dojo.city), '') IS NOT NULL
      AND NULLIF(BTRIM(dojo.state), '') IS NOT NULL
      AND NULLIF(BTRIM(dojo.pincode), '') IS NOT NULL
      AND NULLIF(BTRIM(dojo.experience), '') IS NOT NULL
      AND NULLIF(BTRIM(dojo."imagePath"), '') IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.verification_requests verification
        WHERE verification."profileType"='dojo'
          AND verification."profileId"=dojo.id
          AND verification."ownerId"=dojo."ownerId"
          AND NULLIF(BTRIM(verification."certificatePath"), '') IS NOT NULL
      )
  `);
  await prisma.$executeRawUnsafe(`UPDATE public.dojos SET approved=FALSE WHERE status<>'active' AND approved=TRUE`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.dojos DROP CONSTRAINT IF EXISTS "Dojo_active_approved_consistency"`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.dojos ADD CONSTRAINT "Dojo_active_approved_consistency" CHECK ((status='active' AND approved=TRUE) OR (status<>'active' AND approved=FALSE))`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "dojos_status_approved_verified_category_idx" ON public.dojos(status, approved, verified, category)`);
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "public_read_approved_dojos" ON public.dojos`);
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "public_read_active_dojos" ON public.dojos`);
  await prisma.$executeRawUnsafe(`CREATE POLICY "public_read_active_dojos" ON public.dojos FOR SELECT TO PUBLIC USING (status='active' AND approved=TRUE)`);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
        EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.dojos FROM anon';
        EXECUTE 'GRANT SELECT (id, name, description, category, address, city, experience, "originalPrice", "finalPrice", rating, status, approved, verified) ON TABLE public.dojos TO anon';
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
        EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.dojos FROM authenticated';
        EXECUTE 'GRANT SELECT (id, name, description, category, address, city, experience, "originalPrice", "finalPrice", rating, status, approved, verified) ON TABLE public.dojos TO authenticated';
      END IF;
    END $$
  `);
  console.info("dojo.automatic_activation_migration_applied", { legacyRegistrationsActivated: activated, publicStatus: "active" });
}

main().finally(() => prisma.$disconnect());
