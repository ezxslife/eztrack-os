# L0b — Auth port sprint notes

> Status: **scaffolded — needs Supabase Auth provider config + your hands on a Mac to test.**
>
> Builds on L0a (the schema baseline + VENUE_MODE flag + auth shims). L0b ports
> the canonical Google/Apple/phone-OTP/profile-completion flow from ezxs-os into
> eztrack-os. Existing email+password (`/login`) keeps working — the new flow
> lives at `/welcome` alongside it.

---

## What landed in L0b

### Web (`apps/web/src/`)

| File | Purpose |
|---|---|
| `lib/supabase/auth.ts` | Full ezxs-os auth helper port (~530 lines): `sendPrimaryOTP`, `verifyPrimaryOTP`, `sendSecondaryOTP`, `verifySecondaryOTP`, `completeProfile`, `uploadAvatar`, `uploadAvatarFromUrl`, `signInWithGoogle`, `signInWithApple`, `getSession`, `getUser`, `getAccessToken`, `signOut`, `needsOnboarding`, `isProfileComplete`, `getUserProfile`. Adapted to eztrack-os schema: `profile_completed_at` timestamptz instead of `is_profile_complete` boolean; `phone` column on profiles. |
| `lib/supabase/middleware.ts` | Now exports BOTH `createClient(request)` (for route handlers) AND `updateSession(request)` (for the root middleware). |
| `lib/api/cache/sessionApiCache.ts` | Minimal `getCached`/`setCached`/`clearAllApiCache` over `sessionStorage`. Used by `signOut` to wipe response cache on logout. |
| `app/auth/callback/route.ts` | OAuth callback — Google/Apple return path. Routes new users to profile-completion, returning users to `/dashboard`. |
| `app/auth/otp/callback/route.ts` | OTP server-hop after client-side `verifyOtp` — eliminates the cookie race. |
| `app/(auth)/welcome/page.tsx` | New entry point with Google · Apple · Phone · Email-fallback buttons. |
| `app/(auth)/welcome/phone-signin/page.tsx` | Phone OTP entry (E.164 text input). |
| `app/(auth)/welcome/phone-verify/page.tsx` | 6-digit OTP entry with resend. |
| `app/(auth)/welcome/profile-completion/page.tsx` | First/last name capture for new users. |

### Mobile (`apps/mobile/src/`, `apps/mobile/app/`)

| File | Purpose |
|---|---|
| `src/lib/auth/otp.ts` | Mobile-side OTP adapter — `sendPrimaryOTP`, `verifyPrimaryOTP`, `completeProfile`, `needsOnboarding`. Calls Supabase directly via the existing `@/lib/supabase` client. Error mapping mirrors the web port. |
| `src/components/auth/OTPInput.tsx` | Verbatim port of ezxs-os 6-digit OTP input — auto-advance, paste, shake on error, ResendTimer subcomponent. Adapted to eztrack-os theme (`useThemeColors`, `BRAND` from `@eztrack/ui`). |
| `app/(auth)/phone-signin.tsx` | Phone entry screen using `useThemeColors` + `useThemeTypography`. Plain TextInput with E.164 placeholder; `CountryPhoneInput` port deferred. |
| `app/(auth)/phone-verify.tsx` | OTP entry screen using `OTPInput` + `ResendTimer`. |
| `app/(auth)/profile-completion.tsx` | First/last name capture for new users. |
| `app/(auth)/_layout.tsx` | **Edited** — registers `phone-signin`, `phone-verify`, `profile-completion` Stack screens alongside the existing email+password screens. |

### Updated docs

| File | Change |
|---|---|
| `TASKS.md` | L0b items checked off + L0b-3-tail / L0b-4 items added. |
| `L0b-NOTES.md` | This file. |

---

## What's intentionally NOT in L0b (deferred)

### L0b-3-tail (next session)
- **Mobile `CountryPhoneInput.tsx`** — full country picker with flag/dial-code dropdown. Plain text entry works in v1; port from ezxs-os when the picker UX is needed.
- **Mobile `(auth)/welcome.tsx`** — provider picker screen. Operator can reach phone OTP via the new `/login` link or by deeplinking to `/(auth)/phone-signin`.
- **Wire mobile auth flow into the existing `useAuthStore`.** The new screens call Supabase directly and rely on `RouteGate` / `RequireGuest` to detect session changes. This works but doesn't fire the `setAuthenticating`/`setAuthError` actions that the rest of the mobile app expects. Integration is straightforward; do it before shipping mobile to staff.

### L0b-4 (deploy time — needs your secrets)
- Configure Google OAuth: create OAuth client in Google Cloud Console, add the Supabase OAuth callback URL, paste client-id/secret into Supabase Dashboard → Authentication → Providers → Google.
- Configure Apple Sign-In: create Apple Service ID in Apple Developer, configure return URL, paste creds into Supabase Dashboard → Apple provider.
- Configure Twilio (or Vonage / MessageBird) in Supabase → Auth → Providers → Phone for SMS OTP.
- Customize Supabase email template "Change Email Address" to use `{{ .Token }}` instead of `{{ .ConfirmationURL }}` so `sendSecondaryOTP` for email linking works (currently sends a magic link — the UI expects a 6-digit code).
- Create `images` Supabase Storage bucket. RLS policy:
  ```sql
  CREATE POLICY "Authenticated owner can write avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'images'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
  ```

### L0b-5 (cosmetic, defer to L1+)
- Welcome-animation screen (the gradient "Welcome back" intro).
- Get-notified screen (the post-signup "stay in the loop" upsell).

---

## What you need to do on your Mac

```bash
cd /Users/rostam/Desktop/Projects/Sauce/ezxs-track

# 1. Verify the new files compile
cd apps/web
pnpm typecheck             # or: tsc --noEmit
cd ../mobile
pnpm typecheck
cd ../..

# 2. If on the events-mode/L0-foundation branch, stage everything new
git add apps/web/src/lib/supabase/auth.ts \
        apps/web/src/lib/supabase/middleware.ts \
        apps/web/src/lib/api/cache/ \
        apps/web/src/app/auth/ \
        apps/web/src/app/\(auth\)/welcome/ \
        apps/mobile/src/lib/auth/ \
        apps/mobile/src/components/auth/OTPInput.tsx \
        apps/mobile/app/\(auth\)/phone-signin.tsx \
        apps/mobile/app/\(auth\)/phone-verify.tsx \
        apps/mobile/app/\(auth\)/profile-completion.tsx \
        apps/mobile/app/\(auth\)/_layout.tsx \
        L0b-NOTES.md TASKS.md

git status

# 3. Run the existing test suite to make sure nothing broke
cd apps/web && pnpm test --run && cd ../..
cd apps/mobile && pnpm test --run && cd ../..

# 4. Local smoke test (web)
cd apps/web && pnpm dev
# Visit http://localhost:3000/welcome → click "Continue with phone"
# Type a real number you can receive SMS on (Twilio must be configured)
# Type the 6-digit code → expect either /welcome/profile-completion or /dashboard

# 5. Commit
git commit -m "L0b: port ezxs-os auth (phone OTP, OAuth callbacks, profile-completion)"
git push
```

---

## Risks + watch items

1. **eztrack-os `Database` type doesn't include the new events-domain tables yet.**
   The auth.ts port uses generic `<unknown, T>` casts to read `profiles.profile_completed_at`. Once you've run `supabase db push` and regenerated types via `supabase gen types typescript`, the explicit casts will resolve naturally.

2. **`@eztrack/api` package may need `@supabase/ssr` re-exposed.** The new web middleware imports `createServerClient` from `@supabase/ssr` directly. Existing code likely goes through `@eztrack/api`'s wrapper. Either route is fine — but if a build fails on `@supabase/ssr` resolution, add it to `apps/web/package.json` directly:
   ```json
   "@supabase/ssr": "^0.5.0"
   ```

3. **Existing eztrack-os `auth-actions.ts` is unchanged.** `/login` (email+password) keeps working. The new `/welcome` is the canonical path going forward, but you can leave `/login` accessible for legacy demo accounts indefinitely.

4. **Mobile `useAuthStore` not yet integrated.** The new mobile auth screens bypass the existing authStore. Symptoms: after a successful phone-OTP sign-in, the app may re-render properly thanks to RouteGate, but any code that listens to `useAuthStore` actions (`setAuthenticating`, `setAuthError`, `lastLogoutReason`) won't see the OTP flow. Wire it in L0b-3-tail before letting staff use it on real events.

5. **OAuth callback redirect target is `/dashboard`.** Confirm that route exists and is wired to either Security Mode or Events Mode landing per `VENUE_MODE`. If it 404s, change `nextParam ?? '/dashboard'` in `app/auth/callback/route.ts` to your real default.

6. **`sendSecondaryOTP` for email** depends on Supabase Dashboard email template customization (see L0b-4 above). Without that, the user receives a magic link, not the OTP they're waiting on.

7. **`(auth)/login/error.tsx` exists in eztrack-os**; the new welcome flow doesn't have its own error.tsx. Errors render inline within each form. If you want a route-level error boundary for `/welcome/*`, add `app/(auth)/welcome/error.tsx`.

---

## Verifying L0b end-to-end

Once Supabase Twilio is configured:

```
1. Open /welcome
2. Click "Continue with phone"
3. Type your real phone number with country code (e.g. +14155550100)
4. Click "Send code"  → Twilio SMS arrives within 10–30s
5. Type the 6-digit code in /welcome/phone-verify
6. New users → /welcome/profile-completion → fill name → /dashboard
   Returning users → /auth/otp/callback?next=/dashboard → /dashboard
7. Sign out → confirm sessionStorage cache is cleared (DevTools → Application → Session Storage)
```

For OAuth (after L0b-4 config):

```
1. Open /welcome
2. Click "Continue with Google" or "Continue with Apple"
3. Complete provider consent
4. Land on /auth/callback?code=...
5. Server resolves session, checks profile completeness:
   - missing phone → /welcome?oauth=true&step=link-phone
   - missing email (rare for Google) → /welcome?oauth=true&step=link-email
   - profile not complete → /welcome?oauth=true&step=complete-profile
   - all set → /dashboard
```

For mobile:

```
1. Open the eztrack-mobile Expo dev build
2. Deeplink to /(auth)/phone-signin or navigate from /login
3. Type phone, get OTP, type 6 digits → land in tabs (or profile-completion if new)
```
