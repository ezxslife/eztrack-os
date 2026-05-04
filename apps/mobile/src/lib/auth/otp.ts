/**
 * Mobile OTP auth adapter. Mirrors the public surface of
 * `apps/web/src/lib/supabase/auth.ts` but consumes the mobile Supabase client.
 *
 * Caller-facing surface:
 *   - sendPrimaryOTP(method, contact)
 *   - verifyPrimaryOTP(method, contact, token) → { userId, session, isNewUser, hasBothContacts }
 *   - completeProfile({ userId, firstName, lastName, avatarUrl? })
 *   - needsOnboarding(userId)
 *
 * Errors are mapped to user-friendly messages identical to the web port so
 * UI copy stays consistent across surfaces.
 */

import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export type AuthMethod = 'email' | 'phone';

export async function sendPrimaryOTP(method: AuthMethod, contact: string): Promise<void> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('OTP request timed out. Please try again.')), 15000),
  );

  try {
    if (method === 'email') {
      const { error } = await Promise.race([
        supabase.auth.signInWithOtp({ email: contact, options: { shouldCreateUser: true } }),
        timeout,
      ]);
      if (error) throw error;
    } else {
      const { error } = await Promise.race([
        supabase.auth.signInWithOtp({ phone: contact, options: { shouldCreateUser: true } }),
        timeout,
      ]);
      if (error) throw error;
    }
  } catch (error: unknown) {
    throw mapOTPError(error, method);
  }
}

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

    const verifiedField = method === 'phone' ? 'phone_verified' : 'email_verified';
    await retryMetadataUpdate(
      () => supabase.auth.updateUser({ data: { [verifiedField]: true } }),
      `Set ${verifiedField}`,
    );

    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.session) data.session = refreshed.session;

    let profile: { profile_completed_at: string | null } | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: row } = await supabase
        .from('profiles')
        .select('profile_completed_at')
        .eq('id', data.user.id)
        .single<{ profile_completed_at: string | null }>();
      if (row) {
        profile = row;
        break;
      }
      const delay = 300 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }

    return {
      userId: data.user.id,
      session: data.session,
      isNewUser: !profile || !profile.profile_completed_at,
      hasBothContacts: !!data.user.email && !!data.user.phone,
    };
  } catch (error: unknown) {
    throw mapVerifyError(error);
  }
}

export async function completeProfile(input: {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}): Promise<void> {
  await supabase.auth.updateUser({
    data: {
      first_name: input.firstName,
      last_name: input.lastName,
      avatar_url: input.avatarUrl,
    },
  });

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      avatar_url: input.avatarUrl,
      profile_completed_at: new Date().toISOString(),
    })
    .eq('id', input.userId);

  if (error) throw new Error(error.message);
}

export async function needsOnboarding(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('profile_completed_at')
    .eq('id', userId)
    .single<{ profile_completed_at: string | null }>();
  return !data || !data.profile_completed_at;
}

// ---------------------------------------------------------------------------

async function retryMetadataUpdate(
  updateFn: () => Promise<{ error: { message: string } | null }>,
  label: string,
  maxAttempts = 3,
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { error } = await updateFn();
    if (!error) return;
    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, 500 * Math.pow(3, attempt)));
    } else {
      console.warn(`[Auth] ${label} failed after ${maxAttempts} attempts`);
    }
  }
}

function mapOTPError(error: unknown, method: AuthMethod): Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = error as any;
  const msg = (e?.message ?? '').toLowerCase();
  const status = e?.status ?? e?.statusCode ?? 0;

  if (status === 429) {
    const wait = method === 'email' ? '60' : '30';
    return new Error(`Rate limit exceeded. Please wait ${wait} minutes before trying again.`);
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return new Error('Too many requests. Please wait a few minutes and try again.');
  }
  if (
    method === 'phone' &&
    (msg.includes('sms') || msg.includes('twilio') || msg.includes('messaging') || msg.includes('provider'))
  ) {
    return new Error('Phone authentication is not configured. Enable Twilio in Supabase → Auth → Providers → Phone.');
  }
  if (method === 'phone' && msg.includes('invalid')) {
    return new Error('Invalid phone number format. Include the country code (e.g., +14155550100).');
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
    return new Error('Network error. Please check your connection and try again.');
  }
  return new Error(e?.message ?? `Failed to send ${method} code. Please try again.`);
}

function mapVerifyError(error: unknown): Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = error as any;
  const msg = (e?.message ?? '').toLowerCase();
  if (msg.includes('invalid') || msg.includes('expired') || msg.includes('token')) {
    return new Error('Invalid or expired code. Please request a new code and try again.');
  }
  if (msg.includes('rate limit')) {
    return new Error('Too many verification attempts. Please wait a few minutes.');
  }
  return new Error(e?.message ?? 'Verification failed. Please try again.');
}
