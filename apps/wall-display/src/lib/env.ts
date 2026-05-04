const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ??
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ??
  "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
  "";

export const appEnv = {
  configured: Boolean(supabaseUrl && supabaseAnonKey),
  supabaseAnonKey,
  supabaseUrl,
} as const;
