-- 0002_profiles_phone_oauth.sql
-- Extends `profiles` with phone + OAuth provider tracking so the ezxs-os
-- richer auth flow (Google · Apple · phone OTP · profile-completion) can
-- replace eztrack-os's email+password-only flow.
--
-- Existing profiles continue to work unchanged. New columns are nullable.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS oauth_providers text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS welcome_seen_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON public.profiles (phone)
  WHERE phone IS NOT NULL;

COMMENT ON COLUMN public.profiles.phone IS
  'E.164 phone (+15555550100). Required when oauth_providers includes ''phone''.';

COMMENT ON COLUMN public.profiles.oauth_providers IS
  'Array of providers used to authenticate this profile (google, apple, phone, email).';

COMMENT ON COLUMN public.profiles.profile_completed_at IS
  'Set when the user finishes the profile-completion step in the ezxs-os auth flow.';
