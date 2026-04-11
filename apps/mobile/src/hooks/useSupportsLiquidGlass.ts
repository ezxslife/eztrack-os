import type { ComponentType } from "react";
import { Platform } from "react-native";

export type PlatformTier = "glass" | "blur" | "opaque";

type GlassViewComponent = ComponentType<any>;

let cachedGlassSupport: boolean | null = null;
let cachedGlassView: GlassViewComponent | null = null;

function getIOSVersionNumber() {
  if (typeof Platform.Version === "string") {
    const parsed = Number.parseInt(Platform.Version, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return Platform.Version;
}

function resolveGlassModule() {
  if (cachedGlassSupport !== null) {
    return;
  }

  try {
    const glassModule = require("expo-glass-effect");
    cachedGlassSupport = glassModule?.isGlassEffectAPIAvailable?.() ?? false;
    cachedGlassView = glassModule?.GlassView ?? null;
  } catch {
    cachedGlassSupport = false;
    cachedGlassView = null;
  }
}

export function getPlatformTier(): PlatformTier {
  if (Platform.OS !== "ios") {
    return "opaque";
  }

  const iosVersion = getIOSVersionNumber();
  if (iosVersion < 18) {
    return "opaque";
  }

  resolveGlassModule();
  if (iosVersion >= 26 && cachedGlassSupport) {
    return "glass";
  }

  return "blur";
}

export function getGlassView() {
  resolveGlassModule();
  return cachedGlassView;
}

export function useSupportsLiquidGlass() {
  const platformTier = getPlatformTier();

  return {
    platformTier,
    supportsGlass: platformTier === "glass",
    supportsBlur: platformTier !== "opaque",
    isAndroid: Platform.OS === "android",
  };
}
