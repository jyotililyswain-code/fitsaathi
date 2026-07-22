-- Booking access is scoped to the authenticated Supabase user, the provider
-- that owns the booking, or an authorized admin. The server uses the service
-- connection for normal application writes; these policies protect direct
-- anon/authenticated PostgREST access as well.
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bookings_customer_insert ON public.bookings;
CREATE POLICY bookings_customer_insert ON public.bookings
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = bookings."userId"
    AND users."authUserId" = auth.uid()
    AND users.role::text = 'customer'
));

DROP POLICY IF EXISTS bookings_customer_read ON public.bookings;
CREATE POLICY bookings_customer_read ON public.bookings
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = bookings."userId"
    AND users."authUserId" = auth.uid()
));

DROP POLICY IF EXISTS bookings_provider_read ON public.bookings;
CREATE POLICY bookings_provider_read ON public.bookings
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = bookings."providerOwnerId"
    AND users."authUserId" = auth.uid()
    AND users.role::text IN ('coach', 'dojo')
));

DROP POLICY IF EXISTS bookings_admin_manage ON public.bookings;
CREATE POLICY bookings_admin_manage ON public.bookings
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE users."authUserId" = auth.uid()
    AND users.role::text IN ('admin', 'super_admin', 'moderator', 'support_admin')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.users
  WHERE users."authUserId" = auth.uid()
    AND users.role::text IN ('admin', 'super_admin', 'moderator', 'support_admin')
));

REVOKE ALL ON public.bookings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
