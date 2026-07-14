-- FitSaathi verified-email accounts and reliable booking notifications.
-- This migration is additive except for deleting legacy application password hashes;
-- Supabase Auth is the only password authority after this deployment.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.users
    GROUP BY lower(btrim(email))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add normalized email uniqueness: users contains case-insensitive duplicate emails.';
  END IF;
END $$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS "authUserId" uuid,
  ADD COLUMN IF NOT EXISTS "emailNormalized" text,
  ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "emailVerifiedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "registrationIntent" text NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS "notificationOnboardingCompleted" boolean NOT NULL DEFAULT false;

UPDATE public.users
SET "emailNormalized" = lower(btrim(email))
WHERE "emailNormalized" IS NULL OR "emailNormalized" <> lower(btrim(email));

UPDATE public.users AS app_user
SET
  "authUserId" = auth_user.id,
  "emailVerified" = auth_user.email_confirmed_at IS NOT NULL,
  "emailVerifiedAt" = auth_user.email_confirmed_at
FROM auth.users AS auth_user
WHERE lower(btrim(auth_user.email)) = app_user."emailNormalized";

UPDATE public.users
SET "accountStatus" = 'pending_email_verification'
WHERE NOT "emailVerified"
  AND "accountStatus" NOT IN ('banned', 'suspended', 'rejected', 'deleted');

UPDATE public.users
SET "accountStatus" = CASE
  WHEN "emailVerified" THEN 'active'
  ELSE 'pending_email_verification'
END
WHERE "accountStatus" NOT IN (
  'pending_email_verification',
  'pending_profile_completion',
  'pending_admin_review',
  'active',
  'banned',
  'suspended',
  'rejected',
  'deleted'
);

UPDATE public.users
SET "registrationIntent" = CASE
  WHEN role::text = 'coach' THEN 'coach'
  WHEN role::text = 'seller' THEN 'seller'
  WHEN role::text = 'dojo' AND EXISTS (
    SELECT 1 FROM public.dojos
    WHERE dojos."ownerId" = users.id AND dojos."establishmentType" = 'GYM'
  ) THEN 'gym'
  WHEN role::text = 'dojo' THEN 'dojo'
  ELSE 'customer'
END
WHERE "registrationIntent" = 'customer' AND role::text <> 'customer';

ALTER TABLE public.users
  ALTER COLUMN "emailNormalized" SET NOT NULL,
  ALTER COLUMN "accountStatus" SET DEFAULT 'pending_email_verification';

CREATE UNIQUE INDEX IF NOT EXISTS "users_authUserId_key"
  ON public.users ("authUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "users_emailNormalized_key"
  ON public.users ("emailNormalized");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_auth_user_id_fkey'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_auth_user_id_fkey
      FOREIGN KEY ("authUserId") REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_account_status_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_account_status_check CHECK ("accountStatus" IN (
    'pending_email_verification',
    'pending_profile_completion',
    'pending_admin_review',
    'active',
    'banned',
    'suspended',
    'rejected',
    'deleted'
  ));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_registration_intent_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_registration_intent_check CHECK ("registrationIntent" IN (
    'customer', 'coach', 'dojo', 'gym', 'seller'
  ));

-- Password verification and hashing now live exclusively in Supabase Auth.
ALTER TABLE public.users DROP COLUMN IF EXISTS "passwordHash";

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS "idempotencyKey" text;
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_idempotencyKey_key"
  ON public.bookings ("idempotencyKey");

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS "actorUserId" text,
  ADD COLUMN IF NOT EXISTS "relatedEntityType" text,
  ADD COLUMN IF NOT EXISTS "relatedEntityId" text,
  ADD COLUMN IF NOT EXISTS "actionUrl" text,
  ADD COLUMN IF NOT EXISTS "readAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "deduplicationKey" text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "expiresAt" timestamptz;

UPDATE public.notifications
SET title = 'FitSaathi update'
WHERE title IS NULL OR btrim(title) = '';
ALTER TABLE public.notifications ALTER COLUMN title SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_actorUserId_fkey'
      AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT "notifications_actorUserId_fkey"
      FOREIGN KEY ("actorUserId") REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_action_url_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_action_url_check CHECK (
    "actionUrl" IS NULL OR (
      "actionUrl" LIKE '/%'
      AND "actionUrl" NOT LIKE '//%'
      AND position(E'\\' in "actionUrl") = 0
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS "notifications_deduplicationKey_key"
  ON public.notifications ("deduplicationKey");
CREATE INDEX IF NOT EXISTS "notifications_bookingId_createdAt_idx"
  ON public.notifications ("bookingId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx"
  ON public.notifications ("createdAt" DESC);

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS "endpointHash" text,
  ADD COLUMN IF NOT EXISTS "userAgent" text,
  ADD COLUMN IF NOT EXISTS "deviceName" text,
  ADD COLUMN IF NOT EXISTS "browserName" text,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "failureCount" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastSuccessAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "lastFailureAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "lastFailureReason" text,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE public.push_subscriptions
SET "endpointHash" = md5(endpoint)
WHERE "endpointHash" IS NULL;
ALTER TABLE public.push_subscriptions ALTER COLUMN "endpointHash" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpointHash_key"
  ON public.push_subscriptions ("endpointHash");
CREATE INDEX IF NOT EXISTS "push_subscriptions_userId_isActive_idx"
  ON public.push_subscriptions ("userId", "isActive");

ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_payload_check;
ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_payload_check CHECK (
    btrim(endpoint) <> ''
    AND endpoint LIKE 'https://%'
    AND btrim(p256dh) <> ''
    AND btrim(auth) <> ''
    AND "failureCount" >= 0
  );

CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "notificationId" text NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  "recipientUserId" text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'web_push',
  status text NOT NULL DEFAULT 'pending',
  "attemptCount" integer NOT NULL DEFAULT 0,
  "nextAttemptAt" timestamptz,
  "lastAttemptAt" timestamptz,
  "lastError" text,
  "deduplicationKey" text NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" timestamptz,
  CONSTRAINT notification_outbox_channel_check CHECK (channel IN ('web_push', 'email', 'in_app')),
  CONSTRAINT notification_outbox_status_check CHECK (status IN ('pending', 'processing', 'delivered', 'failed', 'cancelled')),
  CONSTRAINT notification_outbox_attempt_count_check CHECK ("attemptCount" >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS "notification_outbox_deduplicationKey_key"
  ON public.notification_outbox ("deduplicationKey");
CREATE INDEX IF NOT EXISTS "notification_outbox_status_nextAttemptAt_createdAt_idx"
  ON public.notification_outbox (status, "nextAttemptAt", "createdAt");
CREATE INDEX IF NOT EXISTS "notification_outbox_recipientUserId_createdAt_idx"
  ON public.notification_outbox ("recipientUserId", "createdAt" DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS push_subscriptions_set_updated_at ON public.push_subscriptions;
CREATE TRIGGER push_subscriptions_set_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS users_set_updated_at ON public.users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_read_own_profile ON public.users;
CREATE POLICY users_read_own_profile ON public.users
FOR SELECT TO authenticated
USING ("authUserId" = auth.uid());

DROP POLICY IF EXISTS users_update_own_profile ON public.users;
CREATE POLICY users_update_own_profile ON public.users
FOR UPDATE TO authenticated
USING ("authUserId" = auth.uid())
WITH CHECK ("authUserId" = auth.uid());

DROP POLICY IF EXISTS notifications_read_own ON public.notifications;
CREATE POLICY notifications_read_own ON public.notifications
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = notifications."userId"
    AND users."authUserId" = auth.uid()
));

DROP POLICY IF EXISTS notifications_mark_own_read ON public.notifications;
CREATE POLICY notifications_mark_own_read ON public.notifications
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = notifications."userId"
    AND users."authUserId" = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = notifications."userId"
    AND users."authUserId" = auth.uid()
));

DROP POLICY IF EXISTS push_subscriptions_read_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_read_own ON public.push_subscriptions
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = push_subscriptions."userId"
    AND users."authUserId" = auth.uid()
));

DROP POLICY IF EXISTS push_subscriptions_insert_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_insert_own ON public.push_subscriptions
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = push_subscriptions."userId"
    AND users."authUserId" = auth.uid()
));

DROP POLICY IF EXISTS push_subscriptions_delete_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_delete_own ON public.push_subscriptions
FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = push_subscriptions."userId"
    AND users."authUserId" = auth.uid()
));

REVOKE ALL ON public.users FROM anon, authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE (
  name, phone, address, gender, "birthDate", city, state, country,
  "heightCm", "weightKg", "fitnessGoal", "relationshipPreference",
  "profileBio", "fitnessLevel", "preferredAgeMin", "preferredAgeMax",
  latitude, longitude, "onboardingCompleted", "acceptedPolicies",
  "acceptedPolicyVersion", "acceptedAt"
) ON public.users TO authenticated;

REVOKE ALL ON public.notifications FROM anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read, "readAt") ON public.notifications TO authenticated;

REVOKE ALL ON public.push_subscriptions FROM anon, authenticated;
GRANT SELECT (
  id, "userId", "endpointHash", "isActive", "failureCount",
  "lastSuccessAt", "lastFailureAt", "lastFailureReason", "createdAt", "updatedAt"
) ON public.push_subscriptions TO authenticated;
REVOKE ALL ON public.notification_outbox FROM anon, authenticated;

-- Tighten public listing policies so unverified or inactive owners cannot publish.
CREATE OR REPLACE FUNCTION public.is_active_verified_user(app_user_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = app_user_id
      AND users."emailVerified" = true
      AND users."accountStatus" = 'active'
  );
$$;
REVOKE ALL ON FUNCTION public.is_active_verified_user(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_verified_user(text) TO anon, authenticated;

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_approved_coaches ON public.coaches;
CREATE POLICY public_read_approved_coaches ON public.coaches
FOR SELECT TO anon, authenticated
USING (
  status = 'approved'::"ProviderStatus"
  AND verified = true
  AND public.is_active_verified_user(coaches."ownerId")
);

DROP POLICY IF EXISTS public_read_active_dojos ON public.dojos;
CREATE POLICY public_read_active_dojos ON public.dojos
FOR SELECT TO anon, authenticated
USING (
  status = 'active'::"ProviderStatus"
  AND approved = true
  AND public.is_active_verified_user(dojos."ownerId")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
