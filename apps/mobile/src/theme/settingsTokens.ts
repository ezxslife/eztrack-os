/**
 * Settings-specific layout tokens for EZTrack mobile.
 *
 * Provides consistent section header typography and spacing
 * across all settings / preferences screens.
 * Modeled after EZXS-OS settingsTokens.ts.
 */

/** Vertical gap between settings sections */
export const settingsSectionGap = 28;

/** Typography and padding for section headers (e.g. "GENERAL", "ACCOUNT") */
export const settingsSectionHeader = {
  fontSize: 13,
  fontWeight: "600" as const,
  textTransform: "uppercase" as const,
  letterSpacing: 0.5,
  paddingHorizontal: 16,
  paddingTop: 28,
  paddingBottom: 8,
};
