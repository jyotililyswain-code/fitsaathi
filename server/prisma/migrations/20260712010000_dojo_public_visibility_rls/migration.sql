-- Dojo records are managed through the authenticated TheFitSaathi server.
-- Direct Supabase clients may read only the explicitly granted public columns
-- and only after both moderation fields indicate approval.
ALTER TABLE public.dojos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_approved_dojos" ON public.dojos;
CREATE POLICY "public_read_approved_dojos"
ON public.dojos
FOR SELECT
TO PUBLIC
USING (status = 'approved' AND approved = TRUE);

-- Verification requests contain private document references and must never be
-- available through Supabase's anon/authenticated PostgREST roles.
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

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
$$;
