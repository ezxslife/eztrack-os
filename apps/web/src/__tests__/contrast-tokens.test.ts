import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  compositeColor,
  getContrastRatio,
  PRIORITY_COLORS,
} from "@eztrack/shared";
import { darkColors, lightColors } from "../../../mobile/src/theme/colors";
import { IOS_CONTROL_TOKENS } from "../../../mobile/src/theme/controlTokens";

type PriorityPalette = {
  bg: string;
  border?: string;
  text: string;
};

const globalsCss = fs.readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../app/globals.css"),
  "utf8"
);

function getCssVarValues(name: string) {
  const pattern = new RegExp(`--${name}:\\s*([^;]+);`, "g");
  return Array.from(globalsCss.matchAll(pattern), (match) => match[1].trim());
}

function resolveCssVar(name: string, theme: "light" | "dark"): string {
  const matches = getCssVarValues(name);
  if (matches.length === 0) {
    throw new Error(`Missing CSS variable --${name}`);
  }

  const raw =
    theme === "light" || matches.length === 1
      ? matches[0]
      : matches[matches.length - 1];

  const reference = raw.match(/^var\(--([^)]+)\)$/);
  return reference ? resolveCssVar(reference[1], theme) : raw;
}

describe("shared priority contrast", () => {
  it("keeps all shared priority pairs at AA contrast", () => {
    const palettes = Object.values(PRIORITY_COLORS as Record<string, PriorityPalette>);

    for (const palette of palettes) {
      expect(getContrastRatio(palette.bg, palette.text)).toBeGreaterThanOrEqual(4.5);
      expect(palette.border).toBeTruthy();
      expect(
        getContrastRatio(palette.bg, palette.border ?? palette.text)
      ).toBeGreaterThanOrEqual(1.1);
    }
  });
});

describe("web semantic action contrast", () => {
  it("keeps action ink legible on light and dark surfaces", () => {
    const lightSurface = resolveCssVar("surface-primary", "light");
    const darkSurface = resolveCssVar("surface-primary", "dark");

    const lightTintSurface = compositeColor(
      resolveCssVar("action-primary-surface", "light"),
      lightSurface
    );
    const darkTintSurface = compositeColor(
      resolveCssVar("action-primary-surface", "dark"),
      darkSurface
    );

    expect(
      getContrastRatio(resolveCssVar("action-primary", "light"), lightSurface)
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(resolveCssVar("action-primary", "dark"), darkSurface)
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(resolveCssVar("action-primary", "light"), lightTintSurface)
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(resolveCssVar("action-primary", "dark"), darkTintSurface)
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps filled action and destructive buttons at AA contrast", () => {
    for (const theme of ["light", "dark"] as const) {
      expect(
        getContrastRatio(
          resolveCssVar("action-primary-fill", theme),
          resolveCssVar("text-on-brand", theme)
        )
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        getContrastRatio(
          resolveCssVar("action-destructive", theme),
          resolveCssVar("text-on-critical", theme)
        )
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("mobile semantic action contrast", () => {
  it("keeps brand fills readable in both themes", () => {
    expect(getContrastRatio(lightColors.primary, lightColors.primaryText)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(lightColors.primaryStrong, lightColors.primaryText)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(lightColors.accent, lightColors.accentText)).toBeGreaterThanOrEqual(4.5);

    expect(getContrastRatio(darkColors.primary, darkColors.primaryText)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(darkColors.primaryStrong, darkColors.primaryText)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(darkColors.accent, darkColors.accentText)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps iOS secondary button labels readable on grouped surfaces", () => {
    const lightSecondaryFill = compositeColor(
      IOS_CONTROL_TOKENS.secondaryButtonFill.light,
      lightColors.surface
    );
    const darkSecondaryFill = compositeColor(
      IOS_CONTROL_TOKENS.secondaryButtonFill.dark,
      "#1C1C1E"
    );

    expect(
      getContrastRatio(IOS_CONTROL_TOKENS.secondaryButtonLabel.light, lightSecondaryFill)
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(IOS_CONTROL_TOKENS.secondaryButtonLabel.dark, darkSecondaryFill)
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the selected iOS switch track visible against a white thumb", () => {
    const lightTrack = compositeColor(
      IOS_CONTROL_TOKENS.switchTrackTrue.light,
      lightColors.surface
    );
    const darkTrack = compositeColor(
      IOS_CONTROL_TOKENS.switchTrackTrue.dark,
      "#1C1C1E"
    );

    expect(getContrastRatio(lightTrack, "#FFFFFF")).toBeGreaterThanOrEqual(3);
    expect(getContrastRatio(darkTrack, "#FFFFFF")).toBeGreaterThanOrEqual(3);
  });
});
