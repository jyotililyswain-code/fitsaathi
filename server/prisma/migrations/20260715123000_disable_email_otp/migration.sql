-- Restore immediate account activation. Email OTP is intentionally disabled.

UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL;

UPDATE public.users
SET
  "emailVerified" = true,
  "emailVerifiedAt" = COALESCE("emailVerifiedAt", NOW()),
  "accountStatus" = CASE
    WHEN "accountStatus" = 'pending_email_verification' THEN 'active'
    ELSE "accountStatus"
  END;

ALTER TABLE public.users
  ALTER COLUMN "emailVerified" SET DEFAULT true,
  ALTER COLUMN "accountStatus" SET DEFAULT 'active';

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
      AND users."accountStatus" = 'active'
  );
$$;
