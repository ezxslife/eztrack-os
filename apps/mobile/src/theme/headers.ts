import { Platform } from "react-native";

import { getPlatformTier } from "@/hooks/useSupportsLiquidGlass";

function getSupportFlags() {
  const tier = getPlatformTier();
  return {
    supportsGlass: tier === "glass",
    supportsBlur: tier === "glass" || tier === "blur",
  };
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
  };
}

export function getSeamlessHeaderOptions(backgroundColor: string) {
  const { supportsBlur, supportsGlass } = getSupportFlags();

  if (Platform.OS === "ios" && supportsBlur && !supportsGlass) {
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
    headerTransparent: true,
    headerStyle: { backgroundColor: "transparent" },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: "minimal" as const,
    headerTintColor: "#FFFFFF",
    contentStyle: { backgroundColor },
  };
}

export function getGlassHeaderOptions(backgroundColor: string) {
  return {
    headerStyle: { backgroundColor },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: "minimal" as const,
  };
}
