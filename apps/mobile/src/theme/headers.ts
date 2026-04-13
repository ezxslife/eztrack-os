import { Platform } from "react-native";

import { getPlatformTier } from "@/hooks/useSupportsLiquidGlass";

export type HeaderMode = "immersive" | "modal" | "seamless" | "tab-root";

function getSupportFlags() {
  const tier = getPlatformTier();
  return {
    supportsGlass: tier === "glass",
    supportsBlur: tier === "glass" || tier === "blur",
  };
}

export function getHeaderModeOptions(
  mode: HeaderMode,
  backgroundColor: string
) {
  switch (mode) {
    case "immersive":
      return getTransparentBlurHeaderOptions(backgroundColor);
    case "modal":
      return getGlassHeaderOptions(backgroundColor);
    case "tab-root":
      return getBlurTabHeaderOptions(backgroundColor);
    case "seamless":
    default:
      return getSeamlessHeaderOptions(backgroundColor);
  }
}

export function getBlurTabHeaderOptions(backgroundColor: string) {
  const { supportsGlass } = getSupportFlags();

  if (Platform.OS === "ios") {
    if (supportsGlass) {
      return {
        headerTransparent: true,
        headerStyle: { backgroundColor: "transparent" },
        scrollEdgeEffects: { top: "automatic" as const },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal" as const,
        contentStyle: { backgroundColor },
      };
    }

    return {
      headerTransparent: true,
      headerStyle: { backgroundColor: "transparent" },
      headerBlurEffect: "systemChromeMaterial" as const,
      headerShadowVisible: false,
      headerBackButtonDisplayMode: "minimal" as const,
      contentStyle: { backgroundColor },
    };
  }

  return {
    headerStyle: { backgroundColor, elevation: 4 },
    headerShadowVisible: true,
    headerBackButtonDisplayMode: "minimal" as const,
    contentStyle: { backgroundColor },
  };
}

export function getSeamlessHeaderOptions(backgroundColor: string) {
  const { supportsBlur, supportsGlass } = getSupportFlags();

  if (Platform.OS === "ios") {
    // iOS 26+ liquid glass — transparent header with native scroll-edge effects
    if (supportsGlass) {
      return {
        headerTransparent: true,
        headerStyle: { backgroundColor: "transparent" },
        scrollEdgeEffects: { top: "automatic" as const },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal" as const,
        contentStyle: { backgroundColor },
      };
    }

    // Older iOS — blur fallback
    if (supportsBlur) {
      return {
        headerTransparent: true,
        headerStyle: { backgroundColor: "transparent" },
        headerBlurEffect: "systemChromeMaterial" as const,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal" as const,
        contentStyle: { backgroundColor },
      };
    }
  }

  // Android / fallback
  return {
    contentStyle: { backgroundColor },
    headerStyle: { backgroundColor },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: "minimal" as const,
  };
}

export function getTransparentBlurHeaderOptions(backgroundColor: string) {
  const { supportsGlass } = getSupportFlags();

  if (Platform.OS === "ios") {
    if (supportsGlass) {
      return {
        headerTransparent: true,
        headerStyle: { backgroundColor: "transparent" },
        scrollEdgeEffects: { top: "automatic" as const },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal" as const,
        contentStyle: { backgroundColor },
      };
    }

    return {
      headerTransparent: true,
      headerStyle: { backgroundColor: "transparent" },
      headerBlurEffect: "systemChromeMaterial" as const,
      headerShadowVisible: false,
      headerBackButtonDisplayMode: "minimal" as const,
      contentStyle: { backgroundColor },
    };
  }

  return {
    headerStyle: { backgroundColor, elevation: 4 },
    headerShadowVisible: true,
    headerBackButtonDisplayMode: "minimal" as const,
    contentStyle: { backgroundColor },
  };
}

export function getGlassHeaderOptions(backgroundColor: string) {
  const { supportsGlass, supportsBlur } = getSupportFlags();

  if (Platform.OS === "ios") {
    // iOS 26+ liquid glass
    if (supportsGlass) {
      return {
        headerTransparent: true,
        headerStyle: { backgroundColor: "transparent" },
        scrollEdgeEffects: { top: "automatic" as const },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal" as const,
        contentStyle: { backgroundColor },
      };
    }

    // Older iOS — blur
    if (supportsBlur) {
      return {
        headerTransparent: true,
        headerStyle: { backgroundColor: "transparent" },
        headerBlurEffect: "systemChromeMaterial" as const,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal" as const,
        contentStyle: { backgroundColor },
      };
    }
  }

  // Android / fallback
  return {
    contentStyle: { backgroundColor },
    headerStyle: { backgroundColor },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: "minimal" as const,
  };
}
