-- Free bookings are confirmed at creation time, so their persisted access
-- flag must not wait for a provider acceptance transition.
UPDATE public.bookings
SET "contactVisible" = TRUE
WHERE "status" IN ('confirmed', 'accepted', 'completed')
  AND ("packageType" = 'trial' OR "amount" = 0);
