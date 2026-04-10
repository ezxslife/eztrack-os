import type { ConfigContext, ExpoConfig } from "expo/config";

const bundleIdentifier =
  process.env.EXPO_PUBLIC_APP_BUNDLE_ID?.trim() || "com.eztrack.mobile";
const owner = process.env.EXPO_OWNER?.trim();
const slug = process.env.EXPO_SLUG?.trim() || "eztrack-mobile";
const easProjectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ||
  process.env.EAS_PROJECT_ID?.trim() ||
  "613ba789-448d-4da9-8d70-475f4ada4231";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "EZTrack Mobile",
  slug,
  ...(owner ? { owner } : {}),
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "eztrack",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#121212",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier,
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#121212",
    },
    edgeToEdgeEnabled: true,
    package: bundleIdentifier,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: "metro",
    favicon: "./assets/images/favicon.png",
    output: "static",
  },
  plugins: [
    "expo-router",
    "expo-notifications",
    "expo-secure-store",
    [
      "expo-sqlite",
      {
        useSQLCipher: true,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    autolinkingModuleResolution: true,
  },
  extra: {
    ...(easProjectId
      ? {
          eas: {
            projectId: easProjectId,
          },
        }
      : {}),
    supabaseAnonKey:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrl:
      process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  },
});
