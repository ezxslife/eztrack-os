export function useGlassTheme() {
  // Imported lazily to avoid a static cycle while the theme module builds its context value.
  const themeModule = require("../theme") as { useTheme: () => { glass: ReturnType<typeof createGlassTheme> } };
  return themeModule.useTheme().glass;
}

export function createGlassTheme(isDark: boolean) {

  return {
    glassEffect: isDark ? "prominent" : "regular",
    blurIntensity: isDark ? 70 : 50,
    blurTint: isDark ? "systemChromeMaterialDark" : "systemChromeMaterialLight",
    specularColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.4)",
    isDark,
  } as const;
}
