/**
 * Session-refresh middleware + edge-route factory.
 * Ported from ezxs-os/apps/web/src/lib/supabase/middleware.ts.
 *
 * Two exports:
 *   - createClient(request)  — for use inside Route Handlers (e.g. /auth/otp/callback)
 *                              that need to read or refresh session cookies. Returns
 *                              both the Supabase client and the cookie-bearing response.
 *   - updateSession(request) — for use inside the Next.js root middleware to refresh
 *                              the session on every request.
 */

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Edge-route factory. Use inside Route Handlers that need to read or refresh
 * the Supabase session via cookies.
 *
 * Returns both the supabase client AND the response, so route handlers can
 * copy any cookie mutations from `response.cookies` onto their final response.
 */
export function createClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return { supabase, response: supabaseResponse };
}

/**
 * Root-middleware helper. Refreshes the Supabase session if needed and
 * returns the response with any updated session cookies attached.
 */
export async function updateSession(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Touching getUser refreshes the session if the JWT is close to expiring.
  await supabase.auth.getUser();

  return response;
}
