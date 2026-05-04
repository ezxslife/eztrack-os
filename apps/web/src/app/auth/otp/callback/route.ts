/**
 * OTP Callback Route Handler.
 *
 * Used after client-side OTP verification to force a server hop that confirms
 * the session cookie is present before entering protected routes. This eliminates
 * the race between client-side `signInWithOtp` setting cookies and the next
 * server-side render reading them.
 *
 * Ported from ezxs-os.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function GET(request: NextRequest) {
  const nextParam = request.nextUrl.searchParams.get('next') ?? '/dashboard';
  const isValidNext = nextParam.startsWith('/') && !nextParam.startsWith('//');
  const safeNext = isValidNext ? nextParam : '/dashboard';

  const { supabase, response } = createClient(request);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (process.env.NODE_ENV === 'development') {
    console.log(`[otp/callback] session: ${!!session}`);
  }

  const targetUrl = session
    ? new URL(safeNext, request.url)
    : (() => {
        const welcomeUrl = new URL('/welcome', request.url);
        welcomeUrl.searchParams.set('error', 'session_not_ready');
        return welcomeUrl;
      })();

  const redirectResponse = NextResponse.redirect(targetUrl);

  // Preserve any cookie mutations from the supabase response.
  for (const c of response.cookies.getAll()) {
    redirectResponse.cookies.set(c);
  }
  redirectResponse.headers.set('Cache-Control', 'no-store');

  return redirectResponse;
}
