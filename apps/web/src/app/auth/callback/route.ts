/**
 * OAuth Callback Handler — Google / Apple OAuth return path.
 *
 * Ported from ezxs-os, adapted to eztrack-os profile schema:
 *   - profile_completed_at timestamptz (instead of is_profile_complete boolean)
 *   - phone column on profiles is `phone` (instead of `phone_number`)
 *
 * Routing decisions on return:
 *   - Missing phone OR email   → redirect to welcome with oauth=true to finish linking
 *   - Profile not complete     → redirect to profile-completion step
 *   - Profile complete         → redirect to dashboard (or `next` query param)
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next') ?? '/dashboard';
  const safeNext = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard';
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/welcome?error=missing_code`);
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[OAuth Callback] Exchange failed:', {
        message: error.message,
        status: error.status,
      });
      return NextResponse.redirect(
        `${origin}/welcome?error=oauth_failed&reason=${encodeURIComponent(error.message)}`,
      );
    }

    // Fetch profile state to decide where to send the user next.
    type ProfileRow = {
      profile_completed_at: string | null;
      phone: string | null;
      first_name: string | null;
      last_name: string | null;
    };
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_completed_at, phone, first_name, last_name')
      .eq('id', data.user.id)
      .single<ProfileRow>();

    const hasPhone = !!profile?.phone || !!data.user.phone;
    const hasEmail = !!data.user.email;
    const isComplete = !!profile?.profile_completed_at;

    // Backfill names from Google metadata if our profile row is empty.
    const metadata = data.user.user_metadata ?? {};
    const updates: Record<string, string> = {};

    const metaFirst = metadata.first_name ?? metadata.given_name ?? '';
    const metaLast = metadata.last_name ?? metadata.family_name ?? '';
    const fullName = metadata.full_name ?? metadata.name ?? '';

    if (!profile?.first_name && (metaFirst || fullName)) {
      updates.first_name = metaFirst || fullName.split(' ')[0] || '';
    }
    if (!profile?.last_name && (metaLast || fullName)) {
      updates.last_name = metaLast || fullName.split(' ').slice(1).join(' ') || '';
    }
    if (Object.keys(updates).length > 0 && profile) {
      await supabase.from('profiles').update(updates).eq('id', data.user.id);
    }

    if (!hasPhone || !hasEmail) {
      return NextResponse.redirect(
        `${origin}/welcome?oauth=true&step=link-${!hasPhone ? 'phone' : 'email'}`,
      );
    }
    if (!isComplete) {
      return NextResponse.redirect(`${origin}/welcome?oauth=true&step=complete-profile`);
    }
    return NextResponse.redirect(`${origin}${safeNext}`);
  } catch (error) {
    console.error('[OAuth Callback] Unexpected error:', error);
    return NextResponse.redirect(`${origin}/welcome?error=oauth_failed`);
  }
}
