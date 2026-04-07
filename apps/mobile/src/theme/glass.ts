import type { BlurTint } from "expo-blur";

export interface GlassRecipe {
  blurIntensity: number;
  darkTint: BlurTint;
  lightTint: BlurTint;
  fallbackColor: {
    dark: string;
    light: string;
  };
  borderAlpha: number;
}

export const glassRecipes = {
  subtle: {
    blurIntensity: 28,
    darkTint: "systemUltraThinMaterialDark",
    lightTint: "systemUltraThinMaterialLight",
    fallbackColor: {
      dark: "rgba(17, 19, 25, 0.78)",
      light: "rgba(255, 255, 255, 0.72)",
    },
    borderAlpha: 0.12,
  },
  cta: {
    blurIntensity: 42,
    darkTint: "systemChromeMaterialDark",
    lightTint: "systemChromeMaterialLight",
    fallbackColor: {
      dark: "rgba(8, 11, 17, 0.78)",
      light: "rgba(249, 250, 251, 0.8)",
    },
    borderAlpha: 0.16,
  },
  card: {
    blurIntensity: 52,
    darkTint: "systemChromeMaterialDark",
    lightTint: "systemChromeMaterialLight",
    fallbackColor: {
      dark: "rgba(10, 12, 17, 0.84)",
      light: "rgba(255, 255, 255, 0.84)",
    },
    borderAlpha: 0.14,
  },
  panel: {
    blurIntensity: 70,
    darkTint: "systemMaterialDark",
    lightTint: "systemMaterialLight",
    fallbackColor: {
      dark: "rgba(7, 8, 11, 0.9)",
      light: "rgba(255, 255, 255, 0.92)",
    },
    borderAlpha: 0.18,
  },
  sheet: {
    blurIntensity: 90,
    darkTint: "systemUltraThinMaterialDark",
    lightTint: "systemUltraThinMaterialLight",
    fallbackColor: {
      dark: "rgba(0, 0, 0, 0.92)",
      light: "rgba(255, 255, 255, 0.94)",
    },
    borderAlpha: 0.18,
  },
  header: {
    blurIntensity: 80,
    darkTint: "systemChromeMaterialDark",
    lightTint: "systemChromeMaterialLight",
    fallbackColor: {
      dark: "rgba(0, 0, 0, 0.9)",
      light: "rgba(242, 242, 247, 0.94)",
    },
    borderAlpha: 0.12,
  },
} as const satisfies Record<string, GlassRecipe>;

export type GlassRecipeName = keyof typeof glassRecipes;

export function getGlassFallbackColor(recipe: GlassRecipeName, isDark: boolean) {
  return isDark ? glassRecipes[recipe].fallbackColor.dark : glassRecipes[recipe].fallbackColor.light;
}

export function getGlassTint(recipe: GlassRecipeName, isDark: boolean) {
  return isDark ? glassRecipes[recipe].darkTint : glassRecipes[recipe].lightTint;
}
