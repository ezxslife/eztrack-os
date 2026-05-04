/**
 * ezxs-track Authentication Module
 *
 * Ported from ezxs-os/apps/web/src/lib/supabase/auth.ts.
 *
 * Adaptations to eztrack-os:
 *   - profile-completion is tracked via `profiles.profile_completed_at` (timestamptz)
 *     instead of `profiles.is_profile_complete` (boolean). Helper functions translate.
 *   - phone column on profiles is `phone` (E.164) per migration 0002.
 *   - Avatar upload uses `images` storage bucket. **Create this bucket** in your
 *     Supabase project before deploying — the bucket must exist and have an RLS
 *     policy that lets the authenticated user write to `profiles/{auth.uid()}/...`.
 *
 * Public surface (callable from client components or server actions):
 *   - sendPrimaryOTP / verifyPrimaryOTP        — login + signup flow
 *   - sendSecondaryOTP / verifySecondaryOTP    — link a second contact (phone or email) to an existing user
 *   - completeProfile / uploadAvatar           — finish onboarding
 *   - signInWithGoogle / signInWithApple       — OAuth handshakes
 *   - getSession / getUser / getAccessToken    — session access
 *   - signOut                                  — clears Supabase + cache
 *   - needsOnboarding                          — gate for the onboarding redirect
 */

import { createClient } from './client';
import { clearAllApiCache } from '@/lib/api/cache/sessionApiCache';
import type { User, Session } from '@supabase/supabase-js';

export type AuthMethod = 'email' | 'phone';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Retry a metadata update with exponential backoff. Logs after exhaustion but
 * does not throw — the core operation (OTP verification, session creation) has
 * already succeeded by the time we're updating metadata.
 */
async function retryMetadataUpdate(
  updateFn: () => Promise<{ error: { message: string } | null }>,
  label: string,
  maxAttempts = 3,
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { error } = await updateFn();
    if (!error) {
      if (attempt > 0) console.log(`[Auth] ${label} succeeded (attempt ${attempt + 1})`);
      return;
    }
    console.warn(`[Auth] ${label} failed (attempt ${attempt + 1}/${maxAttempts}):`, error);
    if (attempt < maxAttempts - 1) {
      const delay = 500 * Math.pow(3, attempt); // 500ms, 1500ms
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  console.error(`[Auth] ${label} failed after ${maxAttempts} attempts — user may need to re-verify later`);
}

// ============================================================================
// 1. PRIMARY AUTHENTICATION (Signup / Login)
// ============================================================================

/**
 * Send OTP for primary authentication (email or phone).
 * Rate limit: 3/hour for email (Supabase default), 2/hour for phone via Twilio.
 */
export async function sendPrimaryOTP(method: AuthMethod, contact: string): Promise<void> {
  const supabase = createClient();

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('OTP request timed out. Please try again.')), 15000),
    );

    if (method === 'email') {
      const { error } = await Promise.race([
        supabase.auth.signInWithOtp({
          email: contact,
          options: { shouldCreateUser: true },
        }),
        timeoutPromise,
      ]);
      if (error) throw error;
    } else {
      const { error } = await Promise.race([
        supabase.auth.signInWithOtp({
          phone: contact,
          options: { shouldCreateUser: true },
        }),
        timeoutPromise,
      ]);
      if (error) throw error;
    }
  } catch (error: unknown) {
    throw mapPrimaryOTPError(error, method);
  }
}

function mapPrimaryOTPError(error: unknown, method: AuthMethod): Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = error as any;
  const msg = (e?.message ?? '').toLowerCase();
  const status = e?.status ?? e?.statusCode ?? 0;
  const code = e?.code ?? '';

  if (status === 429) {
    const wait = method === 'email' ? '60' : '30';
    return new Error(`Rate limit exceeded. Please wait ${wait} minutes before trying again.`);
  }

  if (method === 'email') {
    if (
      msg.includes('not authorized') ||
      msg.includes('email address not authorized') ||
      msg.includes('unauthorized email')
    ) {
      return new Error(
        'This email address is not authorized. For testing, add your email to the Supabase project team, or configure custom SMTP in Supabase Dashboard.',
      );
    }
    if (
      msg.includes('rate limit') ||
      msg.includes('too many requests') ||
      msg.includes('over_email_send_rate_limit') ||
      code === 'over_email_send_rate_limit'
    ) {
      return new Error(
        'Email rate limit exceeded. Default Supabase SMTP allows ~3-4 emails/hour. Configure custom SMTP for higher limits.',
      );
    }
    if (msg.includes('email')) {
      return new Error(`Email error: ${e?.message}. Check Supabase email configuration.`);
    }
  }

  if (method === 'phone') {
    if (
      msg.includes('sms') ||
      msg.includes('phone') ||
      msg.includes('provider') ||
      msg.includes('twilio') ||
      msg.includes('messaging') ||
      msg.includes('sms service not configured')
    ) {
      return new Error(
        'Phone authentication is not configured. Enable Phone provider and configure Twilio (or another SMS provider) in Supabase Dashboard → Auth → Providers → Phone.',
      );
    }
    if (
      msg.includes('rate limit') ||
      msg.includes('too many requests') ||
      msg.includes('over_sms_send_rate_limit') ||
      code === 'over_sms_send_rate_limit'
    ) {
      return new Error('SMS rate limit exceeded. Please wait 30 minutes before trying again.');
    }
    if (msg.includes('invalid')) {
      return new Error('Invalid phone number format. Please include your country code (e.g., +1234567890).');
    }
  }

  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
    return new Error('Network error. Please check your connection and try again.');
  }

  return new Error(e?.message ?? `Failed to send ${method} verification code. Please try again.`);
}

/**
 * Verify primary OTP. Authenticates the user and creates a session.
 * Returns { userId, session, isNewUser, hasBothContacts } so the caller can
 * decide where to route the user next (profile-completion vs main app).
 */
export async function verifyPrimaryOTP(
  method: AuthMethod,
  contact: string,
  token: string,
): Promise<{
  userId: string;
  session: Session;
  isNewUser: boolean;
  hasBothContacts: boolean;
}> {
  const supabase = createClient();

  try {
    const verifyParams =
      method === 'email'
        ? ({ email: contact, token, type: 'email' } as const)
        : ({ phone: contact, token, type: 'sms' } as const);

    const { data, error } = await supabase.auth.verifyOtp(verifyParams);
    if (error) throw error;
    if (!data.user || !data.session) {
      throw new Error('Verification failed - no user or session returned');
    }

    // Set the verified flag in user_metadata so the backend can consult it.
    const verifiedField = method === 'phone' ? 'phone_verified' : 'email_verified';
    await retryMetadataUpdate(
      () => supabase.auth.updateUser({ data: { [verifiedField]: true } }),
      `Set ${verifiedField} in user metadata`,
    );

    // Refresh session to get a JWT containing the updated metadata.
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn('[Auth] Failed to refresh session after metadata update:', refreshError);
    } else if (refreshData.session) {
      data.session = refreshData.session;
    }

    // Wait for the profile row to exist (DB trigger creates it asynchronously).
    type ProfileRow = {
      profile_completed_at: string | null;
      first_name: string | null;
      phone: string | null;
    };
    let profile: ProfileRow | null = null;
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('profile_completed_at, first_name, phone')
        .eq('id', data.user.id)
        .single<ProfileRow>();

      if (profileData) {
        profile = profileData;
        break;
      }
      if (attempt < maxRetries - 1) {
        const delay = 300 * Math.pow(2, attempt); // 300, 600, 1200, 2400, 4800
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    const isNewUser = !profile || !profile.profile_completed_at;
    const hasEmail = !!data.user.email;
    const hasPhone = !!data.user.phone;
    const hasBothContacts = hasEmail && hasPhone;

    return {
      userId: data.user.id,
      session: data.session,
      isNewUser,
      hasBothContacts,
    };
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = error as any;
    const msg = (e?.message ?? '').toLowerCase();

    if (msg.includes('invalid') || msg.includes('expired') || msg.includes('token')) {
      throw new Error('Invalid or expired code. Please request a new code and try again.');
    }
    if (msg.includes('rate limit') || msg.includes('too many')) {
      throw new Error('Too many verification attempts. Please wait a few minutes before trying again.');
    }
    if (msg.includes('database') || msg.includes('profiles') || msg.includes('permission')) {
      throw new Error('Authentication successful, but there was an issue creating your profile. Please contact support.');
    }
    throw new Error(e?.message ?? 'Verification failed. Please try again.');
  }
}

// ============================================================================
// 2. SECONDARY CONTACT LINKING
// ============================================================================

/**
 * Link a secondary contact to an already-authenticated user.
 *
 * IMPORTANT: For email linking, this triggers Supabase's "Change Email Address"
 * email template. The default template is a magic link, but our UI expects a
 * 6-digit OTP. You MUST customize the template in
 *   Supabase Dashboard → Authentication → Email Templates → "Change Email Address"
 * to use {{ .Token }} instead of {{ .ConfirmationURL }}.
 */
export async function sendSecondaryOTP(method: AuthMethod, contact: string): Promise<void> {
  const supabase = createClient();
  try {
    if (method === 'email') {
      const { error } = await supabase.auth.updateUser({ email: contact });
      if (error) throw error;
    } else {
      const { error } = await supabase.auth.updateUser({ phone: contact });
      if (error) throw error;
    }
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = error as any;
    const msg = (e?.message ?? '').toLowerCase();

    if (msg.includes('rate limit') || msg.includes('too many')) {
      throw new Error('Too many attempts. Please wait before trying again.');
    }
    if (
      msg.includes('already') ||
      msg.includes('exists') ||
      msg.includes('duplicate') ||
      msg.includes('identity already exists')
    ) {
      throw new Error(
        method === 'email'
          ? 'This email is already associated with another account. Please use a different email.'
          : 'This phone number is already associated with another account. Please use a different number.',
      );
    }
    if (msg.includes('signups not allowed')) {
      throw new Error(`Unable to link ${method}. Please try a different ${method === 'email' ? 'email address' : 'phone number'}.`);
    }
    throw new Error(e?.message ?? `Failed to link ${method}`);
  }
}

/**
 * Verify a secondary contact OTP and persist the link.
 */
export async function verifySecondaryOTP(method: AuthMethod, contact: string, token: string): Promise<void> {
  const supabase = createClient();
  try {
    if (method === 'email') {
      const { error } = await supabase.auth.verifyOtp({
        email: contact,
        token,
        type: 'email_change' as const,
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('already') || msg.includes('exists') || msg.includes('duplicate')) {
          throw new Error('This email is already associated with another account.');
        }
        throw error;
      }
      await retryMetadataUpdate(
        () => supabase.auth.updateUser({ data: { email_verified: true } }),
        'Set email_verified in user metadata',
      );
      await supabase.auth.refreshSession().catch(() => undefined);
    } else {
      const { error } = await supabase.auth.verifyOtp({
        phone: contact,
        token,
        type: 'phone_change' as const,
      });
      if (error) throw error;
      await retryMetadataUpdate(
        () => supabase.auth.updateUser({ data: { phone_verified: true } }),
        'Set phone_verified in user metadata',
      );
      await supabase.auth.refreshSession().catch(() => undefined);
    }
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = error as any;
    const msg = (e?.message ?? '').toLowerCase();
    if (msg.includes('invalid') || msg.includes('expired')) {
      throw new Error('Invalid or expired code. Please try again.');
    }
    if (msg.includes('rate limit')) {
      throw new Error('Too many attempts. Please wait before trying again.');
    }
    throw new Error(e?.message ?? 'Verification failed. Please try again.');
  }
}

// ============================================================================
// 3. PROFILE MANAGEMENT
// ============================================================================

export async function completeProfile(input: {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}): Promise<void> {
  const supabase = createClient();
  try {
    await supabase.auth.updateUser({
      data: {
        first_name: input.firstName,
        last_name: input.lastName,
        avatar_url: input.avatarUrl,
      },
    });

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: input.firstName,
        last_name: input.lastName,
        avatar_url: input.avatarUrl,
        profile_completed_at: new Date().toISOString(),
      })
      .eq('id', input.userId);

    if (profileError) throw profileError;
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = error as any;
    throw new Error(e?.message ?? 'Failed to complete profile');
  }
}

/**
 * Upload an avatar image to the `images` Supabase storage bucket.
 * Returns the public URL with a cache-busting query string.
 *
 * Bucket setup: create an `images` bucket in Supabase Storage with this RLS:
 *   bucket: images
 *   policy: 'profiles owner write'
 *     CREATE POLICY ... USING (
 *       bucket_id = 'images'
 *       AND (storage.foldername(name))[1] = 'profiles'
 *       AND (storage.foldername(name))[2] = auth.uid()::text
 *     )
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();

  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    throw new Error('SVG files are not supported. Please use JPG, PNG, GIF, or WebP format.');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  const fileExt = file.name.split('.').pop();
  const filePath = `profiles/${userId}/avatar-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return `${data.publicUrl}?t=${Date.now()}`;
}

/**
 * Mirror an external avatar (e.g. Google profile picture) into our own bucket
 * so the URL doesn't expire. Returns null on failure rather than throwing.
 */
export async function uploadAvatarFromUrl(userId: string, imageUrl: string): Promise<string | null> {
  const supabase = createClient();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(imageUrl, { signal: controller.signal });
    if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);

    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error('Downloaded content is not an image');
    if (blob.type === 'image/svg+xml') throw new Error('SVG files are not supported for security reasons');
    if (blob.size > 5 * 1024 * 1024) throw new Error('Image too large (max 5MB)');

    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    const ext = extMap[blob.type] || 'jpg';
    const filePath = `profiles/${userId}/avatar-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('images')
      .upload(filePath, blob, { upsert: true, contentType: blob.type });
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (error: unknown) {
    console.error('[Auth] Upload avatar from URL error:', error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// 4. OAUTH (Google / Apple)
// ============================================================================

export async function signInWithGoogle(): Promise<void> {
  const supabase = createClient();
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) throw error;
    // Supabase will redirect; nothing else to do here.
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = error as any;
    throw new Error(e?.message ?? 'Failed to sign in with Google');
  }
}

export async function signInWithApple(): Promise<void> {
  const supabase = createClient();
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = error as any;
    throw new Error(e?.message ?? 'Failed to sign in with Apple');
  }
}

// ============================================================================
// 5. SESSION UTILITIES
// ============================================================================

export async function getSession(): Promise<Session | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session ?? null;
}

export async function getUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

const AUTH_FLOW_STORAGE_KEY = 'eztrack-auth-flow-v1';

export async function signOut(): Promise<void> {
  const supabase = createClient();

  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(AUTH_FLOW_STORAGE_KEY);
      clearAllApiCache();
    } catch (e) {
      console.warn('[Auth] Failed to clear auth flow state:', e);
    }
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);

  if (typeof window !== 'undefined') {
    clearAllApiCache();
  }
}

/**
 * Returns true if the user has not yet completed their profile.
 */
export async function needsOnboarding(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_completed_at')
    .eq('id', userId)
    .single<{ profile_completed_at: string | null }>();

  return !profile || !profile.profile_completed_at;
}

export async function isProfileComplete(userId: string): Promise<boolean> {
  return !(await needsOnboarding(userId));
}

export async function getUserProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('[Auth] Failed to fetch profile:', error);
    return null;
  }
  return data;
}
