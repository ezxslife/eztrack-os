import { cookies } from "next/headers";
import { createServerClient } from "@eztrack/api";

/**
 * Create a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads auth session from cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient({
    getAll() {
      return cookieStore.getAll();
    },
    set(name, value, options) {
      try {
        cookieStore.set(name, value, options);
      } catch {
        // Called from a Server Component — ignore.
        // Middleware handles session refresh.
      }
    },
  });
}
