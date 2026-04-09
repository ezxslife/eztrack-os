const baseTypography = {
  largeTitle: { fontSize: 34, fontWeight: "700" as const, lineHeight: 41, letterSpacing: 0.37 },
  title1: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34, letterSpacing: 0.36 },
  title2: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28, letterSpacing: 0.35 },
  title3: { fontSize: 20, fontWeight: "600" as const, lineHeight: 25, letterSpacing: 0.38 },
  headline: { fontSize: 17, fontWeight: "600" as const, lineHeight: 22, letterSpacing: -0.41 },
  body: { fontSize: 17, fontWeight: "400" as const, lineHeight: 22, letterSpacing: -0.41 },
  callout: { fontSize: 16, fontWeight: "400" as const, lineHeight: 21, letterSpacing: -0.32 },
  subheadline: { fontSize: 15, fontWeight: "400" as const, lineHeight: 20, letterSpacing: -0.24 },
  footnote: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18, letterSpacing: -0.08 },
  caption1: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16, letterSpacing: 0 },
  caption2: { fontSize: 11, fontWeight: "400" as const, lineHeight: 13, letterSpacing: 0.07 },
} as const;

export type ThemeTypography = typeof baseTypography;

function getScaledLineHeight(lineHeight: number, fontScale: number) {
  if (fontScale <= 1) {
    return lineHeight;
  }

  return Math.round(lineHeight * Math.min(fontScale, 1.45));
}

export function createTypography(fontScale: number): ThemeTypography {
  return Object.fromEntries(
    Object.entries(baseTypography).map(([key, value]) => [
      key,
      {
        ...value,
        lineHeight: getScaledLineHeight(value.lineHeight, fontScale),
      },
    ])
  ) as ThemeTypography;
}

export const typography = createTypography(1);

export const fontWeights = {
  light: "300" as const,
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  heavy: "800" as const,
} as const;
