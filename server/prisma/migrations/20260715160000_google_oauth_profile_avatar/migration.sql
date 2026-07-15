-- Google identities are linked to application users by authUserId and normalized email.
-- Profile provisioning remains server-side so OAuth metadata cannot assign privileged roles.
ALTER TABLE public.users ADD COLUMN "avatarUrl" TEXT;
