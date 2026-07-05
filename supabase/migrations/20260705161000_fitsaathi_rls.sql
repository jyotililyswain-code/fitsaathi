-- Run this in Supabase after the Prisma migrations have created/renamed the tables.
-- Prisma server connections normally use DATABASE_URL and bypass these policies as the database owner.
-- Direct Supabase client access uses these policies through authenticated JWT claims.

CREATE OR REPLACE FUNCTION public.app_uid()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(auth.uid()::text, '');
$$;

CREATE OR REPLACE FUNCTION public.app_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

CREATE OR REPLACE FUNCTION public.app_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(public.app_role() IN ('admin', 'super_admin', 'moderator', 'support_admin'), false)
    OR coalesce((
      SELECT u.role::text IN ('admin', 'super_admin', 'moderator', 'support_admin')
      FROM public.users u
      WHERE u.id = public.app_uid()
      LIMIT 1
    ), false);
$$;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users', 'coaches', 'dojos', 'bookings', 'products', 'categories', 'orders',
    'order_items', 'payments', 'seller_accounts', 'seller_products',
    'product_reviews', 'provider_reviews', 'coach_reviews', 'dojo_reviews',
    'notifications', 'attendance', 'attendance_logs', 'admin_users',
    'admin_logs', 'verification_requests', 'support_tickets', 'withdraw_requests',
    'transactions', 'commissions', 'wallets', 'wallet_transactions',
    'reward_levels', 'martial_art_levels', 'customer_addresses',
    'favorite_coaches', 'favorite_dojos', 'sessions', 'refresh_tokens',
    'user_profile_photos', 'social_verifications', 'user_interests',
    'user_achievements', 'user_social_links', 'connection_invites',
    'user_blocks', 'conversations', 'social_messages', 'typing_indicators',
    'daily_connection_charges', 'premium_subscriptions', 'profile_views',
    'social_reviews', 'push_subscriptions', 'moderation_cases',
    'emergency_requests', 'wishlists', 'cart_items', 'chat_requests',
    'platform_settings', 'reports', 'rate_limit_buckets',
    'razorpay_webhook_events', 'product_images'
  ]
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS admin_all ON public.%I', table_name);
    EXECUTE format('CREATE POLICY admin_all ON public.%I FOR ALL USING (public.app_is_admin()) WITH CHECK (public.app_is_admin())', table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS users_self ON public.users;
CREATE POLICY users_self ON public.users
FOR ALL USING (id = public.app_uid())
WITH CHECK (id = public.app_uid());

DROP POLICY IF EXISTS coaches_public_read ON public.coaches;
CREATE POLICY coaches_public_read ON public.coaches
FOR SELECT USING (status::text = 'approved' OR verified = true OR "ownerId" = public.app_uid());

DROP POLICY IF EXISTS coaches_owner_manage ON public.coaches;
CREATE POLICY coaches_owner_manage ON public.coaches
FOR ALL USING ("ownerId" = public.app_uid())
WITH CHECK ("ownerId" = public.app_uid());

DROP POLICY IF EXISTS dojos_public_read ON public.dojos;
CREATE POLICY dojos_public_read ON public.dojos
FOR SELECT USING (status::text = 'approved' OR approved = true OR "ownerId" = public.app_uid());

DROP POLICY IF EXISTS dojos_owner_manage ON public.dojos;
CREATE POLICY dojos_owner_manage ON public.dojos
FOR ALL USING ("ownerId" = public.app_uid())
WITH CHECK ("ownerId" = public.app_uid());

DROP POLICY IF EXISTS seller_accounts_public_read ON public.seller_accounts;
CREATE POLICY seller_accounts_public_read ON public.seller_accounts
FOR SELECT USING (status::text IN ('verified', 'trusted') OR "ownerId" = public.app_uid());

DROP POLICY IF EXISTS seller_accounts_owner_manage ON public.seller_accounts;
CREATE POLICY seller_accounts_owner_manage ON public.seller_accounts
FOR ALL USING ("ownerId" = public.app_uid())
WITH CHECK ("ownerId" = public.app_uid());

DROP POLICY IF EXISTS products_public_read ON public.products;
CREATE POLICY products_public_read ON public.products
FOR SELECT USING (status::text = 'approved' OR EXISTS (
  SELECT 1 FROM public.seller_accounts s WHERE s.id = products."sellerId" AND s."ownerId" = public.app_uid()
));

DROP POLICY IF EXISTS products_seller_manage ON public.products;
CREATE POLICY products_seller_manage ON public.products
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.seller_accounts s WHERE s.id = products."sellerId" AND s."ownerId" = public.app_uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.seller_accounts s WHERE s.id = products."sellerId" AND s."ownerId" = public.app_uid()
));

DROP POLICY IF EXISTS bookings_customer_provider ON public.bookings;
CREATE POLICY bookings_customer_provider ON public.bookings
FOR SELECT USING ("userId" = public.app_uid() OR "providerOwnerId" = public.app_uid());

DROP POLICY IF EXISTS bookings_customer_insert ON public.bookings;
CREATE POLICY bookings_customer_insert ON public.bookings
FOR INSERT WITH CHECK ("userId" = public.app_uid());

DROP POLICY IF EXISTS bookings_provider_update ON public.bookings;
CREATE POLICY bookings_provider_update ON public.bookings
FOR UPDATE USING ("providerOwnerId" = public.app_uid() OR "userId" = public.app_uid())
WITH CHECK ("providerOwnerId" = public.app_uid() OR "userId" = public.app_uid());

DROP POLICY IF EXISTS orders_customer_access ON public.orders;
CREATE POLICY orders_customer_access ON public.orders
FOR ALL USING ("userId" = public.app_uid())
WITH CHECK ("userId" = public.app_uid());

DROP POLICY IF EXISTS order_items_customer_read ON public.order_items;
CREATE POLICY order_items_customer_read ON public.order_items
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.orders o WHERE o.id = order_items."orderId" AND o."userId" = public.app_uid()
) OR EXISTS (
  SELECT 1 FROM public.seller_accounts s WHERE s.id = order_items."sellerId" AND s."ownerId" = public.app_uid()
));

DROP POLICY IF EXISTS payments_customer_read ON public.payments;
CREATE POLICY payments_customer_read ON public.payments
FOR SELECT USING ("userId" = public.app_uid() OR EXISTS (
  SELECT 1 FROM public.seller_accounts s WHERE s.id = payments."sellerId" AND s."ownerId" = public.app_uid()
));

DROP POLICY IF EXISTS payments_customer_insert ON public.payments;
CREATE POLICY payments_customer_insert ON public.payments
FOR INSERT WITH CHECK ("userId" = public.app_uid());

DROP POLICY IF EXISTS notifications_owner_access ON public.notifications;
CREATE POLICY notifications_owner_access ON public.notifications
FOR ALL USING ("userId" = public.app_uid())
WITH CHECK ("userId" = public.app_uid());

DROP POLICY IF EXISTS attendance_participant_read ON public.attendance;
CREATE POLICY attendance_participant_read ON public.attendance
FOR SELECT USING ("customerId" = public.app_uid() OR "scannedById" = public.app_uid());

DROP POLICY IF EXISTS attendance_scanner_insert ON public.attendance;
CREATE POLICY attendance_scanner_insert ON public.attendance
FOR INSERT WITH CHECK ("customerId" = public.app_uid() OR "scannedById" = public.app_uid());

DROP POLICY IF EXISTS wallets_owner_read ON public.wallets;
CREATE POLICY wallets_owner_read ON public.wallets
FOR SELECT USING ("userId" = public.app_uid());

DROP POLICY IF EXISTS wallet_transactions_owner_read ON public.wallet_transactions;
CREATE POLICY wallet_transactions_owner_read ON public.wallet_transactions
FOR SELECT USING ("userId" = public.app_uid());

DROP POLICY IF EXISTS verification_requests_owner_read ON public.verification_requests;
CREATE POLICY verification_requests_owner_read ON public.verification_requests
FOR SELECT USING ("ownerId" = public.app_uid() OR "reviewedById" = public.app_uid());

DROP POLICY IF EXISTS verification_requests_owner_insert ON public.verification_requests;
CREATE POLICY verification_requests_owner_insert ON public.verification_requests
FOR INSERT WITH CHECK ("ownerId" = public.app_uid());

DROP POLICY IF EXISTS refresh_tokens_owner_access ON public.refresh_tokens;
CREATE POLICY refresh_tokens_owner_access ON public.refresh_tokens
FOR ALL USING ("userId" = public.app_uid())
WITH CHECK ("userId" = public.app_uid());

DROP POLICY IF EXISTS sessions_owner_access ON public.sessions;
CREATE POLICY sessions_owner_access ON public.sessions
FOR ALL USING (user_id = public.app_uid())
WITH CHECK (user_id = public.app_uid());

DROP POLICY IF EXISTS customer_addresses_owner_access ON public.customer_addresses;
CREATE POLICY customer_addresses_owner_access ON public.customer_addresses
FOR ALL USING (user_id = public.app_uid())
WITH CHECK (user_id = public.app_uid());

DROP POLICY IF EXISTS favorite_coaches_owner_access ON public.favorite_coaches;
CREATE POLICY favorite_coaches_owner_access ON public.favorite_coaches
FOR ALL USING (user_id = public.app_uid())
WITH CHECK (user_id = public.app_uid());

DROP POLICY IF EXISTS favorite_dojos_owner_access ON public.favorite_dojos;
CREATE POLICY favorite_dojos_owner_access ON public.favorite_dojos
FOR ALL USING (user_id = public.app_uid())
WITH CHECK (user_id = public.app_uid());

DROP POLICY IF EXISTS reviews_owner_insert ON public.product_reviews;
CREATE POLICY reviews_owner_insert ON public.product_reviews
FOR INSERT WITH CHECK ("userId" = public.app_uid());

DROP POLICY IF EXISTS reviews_owner_read ON public.product_reviews;
CREATE POLICY reviews_owner_read ON public.product_reviews
FOR SELECT USING ("userId" = public.app_uid());

DROP POLICY IF EXISTS provider_reviews_owner_access ON public.provider_reviews;
CREATE POLICY provider_reviews_owner_access ON public.provider_reviews
FOR ALL USING ("userId" = public.app_uid())
WITH CHECK ("userId" = public.app_uid());

DROP POLICY IF EXISTS coach_reviews_owner_access ON public.coach_reviews;
CREATE POLICY coach_reviews_owner_access ON public.coach_reviews
FOR ALL USING (user_id = public.app_uid() OR EXISTS (
  SELECT 1 FROM public.coaches c WHERE c.id = coach_reviews.coach_id AND c."ownerId" = public.app_uid()
))
WITH CHECK (user_id = public.app_uid());

DROP POLICY IF EXISTS dojo_reviews_owner_access ON public.dojo_reviews;
CREATE POLICY dojo_reviews_owner_access ON public.dojo_reviews
FOR ALL USING (user_id = public.app_uid() OR EXISTS (
  SELECT 1 FROM public.dojos d WHERE d.id = dojo_reviews.dojo_id AND d."ownerId" = public.app_uid()
))
WITH CHECK (user_id = public.app_uid());

DROP POLICY IF EXISTS categories_public_read ON public.categories;
CREATE POLICY categories_public_read ON public.categories
FOR SELECT USING (active = true);

DROP POLICY IF EXISTS reward_levels_public_read ON public.reward_levels;
CREATE POLICY reward_levels_public_read ON public.reward_levels
FOR SELECT USING (active = true);

DROP POLICY IF EXISTS martial_art_levels_public_read ON public.martial_art_levels;
CREATE POLICY martial_art_levels_public_read ON public.martial_art_levels
FOR SELECT USING (active = true);

DROP POLICY IF EXISTS support_tickets_auth_insert ON public.support_tickets;
CREATE POLICY support_tickets_auth_insert ON public.support_tickets
FOR INSERT WITH CHECK (public.app_uid() IS NOT NULL);

DROP POLICY IF EXISTS withdraw_requests_owner_access ON public.withdraw_requests;
CREATE POLICY withdraw_requests_owner_access ON public.withdraw_requests
FOR ALL USING (user_id = public.app_uid())
WITH CHECK (user_id = public.app_uid());

DROP POLICY IF EXISTS transactions_owner_read ON public.transactions;
CREATE POLICY transactions_owner_read ON public.transactions
FOR SELECT USING (user_id = public.app_uid());

DROP POLICY IF EXISTS attendance_logs_participant_read ON public.attendance_logs;
CREATE POLICY attendance_logs_participant_read ON public.attendance_logs
FOR SELECT USING (actor_id = public.app_uid() OR EXISTS (
  SELECT 1 FROM public.bookings b
  WHERE b.id = attendance_logs.booking_id
    AND (b."userId" = public.app_uid() OR b."providerOwnerId" = public.app_uid())
));

DROP POLICY IF EXISTS user_profile_photos_owner_access ON public.user_profile_photos;
CREATE POLICY user_profile_photos_owner_access ON public.user_profile_photos
FOR ALL USING ("userId" = public.app_uid())
WITH CHECK ("userId" = public.app_uid());

DROP POLICY IF EXISTS social_verifications_owner_read ON public.social_verifications;
CREATE POLICY social_verifications_owner_read ON public.social_verifications
FOR SELECT USING ("userId" = public.app_uid() OR "reviewedById" = public.app_uid());

DROP POLICY IF EXISTS social_verifications_owner_insert ON public.social_verifications;
CREATE POLICY social_verifications_owner_insert ON public.social_verifications
FOR INSERT WITH CHECK ("userId" = public.app_uid());

DROP POLICY IF EXISTS user_interests_owner_access ON public.user_interests;
CREATE POLICY user_interests_owner_access ON public.user_interests
FOR ALL USING ("userId" = public.app_uid())
WITH CHECK ("userId" = public.app_uid());

DROP POLICY IF EXISTS conversations_member_read ON public.conversations;
CREATE POLICY conversations_member_read ON public.conversations
FOR SELECT USING ("userOneId" = public.app_uid() OR "userTwoId" = public.app_uid());

DROP POLICY IF EXISTS social_messages_member_read ON public.social_messages;
CREATE POLICY social_messages_member_read ON public.social_messages
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = social_messages."conversationId"
    AND (c."userOneId" = public.app_uid() OR c."userTwoId" = public.app_uid())
));

DROP POLICY IF EXISTS social_messages_sender_insert ON public.social_messages;
CREATE POLICY social_messages_sender_insert ON public.social_messages
FOR INSERT WITH CHECK ("senderId" = public.app_uid());
