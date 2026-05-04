import type { ConfigContext, ExpoConfig } from "expo/config";

const bundleIdentifier =
  process.env.EXPO_PUBLIC_WALL_DISPLAY_BUNDLE_ID?.trim() ||
  "events.ezxs.track.wall";
const owner = process.env.EXPO_OWNER?.trim();
const slug = process.env.EXPO_WALL_DISPLAY_SLUG?.trim() || "ezxs-track-wall";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "EZXS Track Wall",
  slug,
  ...(owner ? { owner } : {}),
  version: "1.0.0",
  orientation: "landscape",
  scheme: "ezxstrackwall",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier,
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    edgeToEdgeEnabled: true,
    package: bundleIdentifier,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: "metro",
    output: "static",
  },
  plugins: ["expo-router"],
  experiments: {
    typedRoutes: true,
    autolinkingModuleResolution: true,
  },
  extra: {
    supabaseAnonKey:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrl:
      process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  },
});
