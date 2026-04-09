import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  Appearance,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
} from "react-native";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";

import { createGlassTheme } from "@/hooks/useGlassTheme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { createThemeColors, type ResolvedThemeScheme, type ThemeColors } from "@/theme/colors";
import { createThemeControls, type ThemeControls } from "@/theme/controls";
import { spacing } from "@/theme/spacing";
import { createTypography, type ThemeTypography } from "@/theme/typography";
import { useUIStore } from "@/stores/ui-store";

interface ThemeValue {
  colors: ThemeColors;
  controls: ThemeControls;
  glass: ReturnType<typeof createGlassTheme>;
  isDark: boolean;
  scheme: ResolvedThemeScheme;
  spacing: typeof spacing;
  typography: ThemeTypography;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function resolveScheme(
  preference: "system" | "light" | "dark",
  osScheme: string | null | undefined
): ResolvedThemeScheme {
  if (preference === "light" || preference === "dark") {
    return preference;
  }

  return osScheme === "light" ? "light" : "dark";
}

function ThemeInner({ children }: { children: ReactNode }) {
  const osScheme = useColorScheme() ?? Appearance.getColorScheme();
  const { fontScale } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const preference = useUIStore((state) => state.colorSchemePreference);
  const scheme = resolveScheme(preference, osScheme);
  const colors = useMemo(() => createThemeColors(scheme), [scheme]);
  const controls = useMemo(() => createThemeControls(colors), [colors]);
  const typography = useMemo(
    () => createTypography(Math.max(1, Math.min(fontScale || 1, 1.45))),
    [fontScale]
  );
  const previousPreferenceRef = useRef<typeof preference>(preference);
  const previousSchemeRef = useRef<ResolvedThemeScheme>(scheme);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [overlayColor, setOverlayColor] = useState<string | null>(null);

  if (preference === "light" || preference === "dark") {
    Appearance.setColorScheme(preference);
  } else if (previousPreferenceRef.current !== "system") {
    Appearance.setColorScheme(undefined);
  }

  const glass = useMemo(() => createGlassTheme(scheme === "dark"), [scheme]);

  useEffect(() => {
    previousPreferenceRef.current = preference;
  }, [preference]);

  useEffect(() => {
    if (reduceMotion) {
      previousSchemeRef.current = scheme;
      overlayOpacity.setValue(0);
      setOverlayColor(null);
      return;
    }

    if (previousSchemeRef.current === scheme) {
      return;
    }

    const previousScheme = previousSchemeRef.current;
    previousSchemeRef.current = scheme;
    setOverlayColor(previousScheme === "dark" ? "#000000" : "#F2F2F7");
    overlayOpacity.setValue(0.32);
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setOverlayColor(null));
  }, [overlayOpacity, reduceMotion, scheme]);

  const value = useMemo<ThemeValue>(
    () => ({
      colors,
      controls,
      glass,
      isDark: scheme === "dark",
      scheme,
      spacing,
      typography,
    }),
    [colors, controls, glass, scheme, typography]
  );

  const navigationTheme = useMemo(
    () =>
      scheme === "dark"
        ? {
            ...DarkTheme,
            dark: true,
            colors: {
              ...DarkTheme.colors,
              primary: colors.primaryStrong,
              background: colors.background,
              card: colors.background,
              text: colors.textPrimary,
              border: colors.border,
              notification: colors.accent,
            },
          }
        : {
            ...DefaultTheme,
            dark: false,
            colors: {
              ...DefaultTheme.colors,
              primary: colors.primary,
              background: colors.background,
              card: colors.backgroundMuted,
              text: colors.textPrimary,
              border: colors.border,
              notification: colors.accent,
            },
          },
    [colors, scheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <NavigationThemeProvider value={navigationTheme}>
        {children}
        {overlayColor ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.overlay,
              {
                backgroundColor: overlayColor,
                opacity: overlayOpacity,
              },
            ]}
          />
        ) : null}
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeInner>{children}</ThemeInner>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return theme;
}

export function useThemeColors() {
  return useTheme().colors;
}

export function useIsDark() {
  return useTheme().isDark;
}

export function useThemeControls() {
  return useTheme().controls;
}

export function useThemeSpacing() {
  return useTheme().spacing;
}

export function useThemeTypography() {
  return useTheme().typography;
}

export function useGlassTheme() {
  return useTheme().glass;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});
