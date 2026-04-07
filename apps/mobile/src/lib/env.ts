const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
const disableAuth = process.env.EXPO_PUBLIC_DISABLE_AUTH === "true";

export const appEnv = {
  disableAuth,
  authConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  authEnabled: !disableAuth && Boolean(supabaseUrl && supabaseAnonKey),
  supabaseAnonKey,
  supabaseUrl,
} as const;

export function getPreviewMessage() {
  if (appEnv.disableAuth) {
    return "Preview mode is enabled because EXPO_PUBLIC_DISABLE_AUTH=true.";
  }

  if (!appEnv.authConfigured) {
    return "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable live mobile auth.";
  }

  return null;
}
