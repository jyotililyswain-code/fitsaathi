import { prisma } from "../lib/prisma";

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE public.dojos ENABLE ROW LEVEL SECURITY`);
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "public_read_approved_dojos" ON public.dojos`);
  await prisma.$executeRawUnsafe(`CREATE POLICY "public_read_approved_dojos" ON public.dojos FOR SELECT TO PUBLIC USING (status = 'approved' AND approved = TRUE)`);
  await prisma.$executeRawUnsafe(`ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY`);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.dojos FROM anon';
        EXECUTE 'GRANT SELECT (id, name, description, category, address, city, experience, "originalPrice", "finalPrice", rating, status, approved) ON TABLE public.dojos TO anon';
        EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.verification_requests FROM anon';
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.dojos FROM authenticated';
        EXECUTE 'GRANT SELECT (id, name, description, category, address, city, experience, "originalPrice", "finalPrice", rating, status, approved) ON TABLE public.dojos TO authenticated';
        EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.verification_requests FROM authenticated';
      END IF;
    END
    $$
  `);
  console.info("dojo.rls_applied", { approvedOnlyPolicy: true, verificationDocumentsPublic: false });
}

main().finally(() => prisma.$disconnect());
