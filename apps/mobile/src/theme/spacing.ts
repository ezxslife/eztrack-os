export const spacing = {
  0: 0,
  "0.5": 2,
  1: 4,
  "1.5": 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  space: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
  },
} as const;

// ---------------------------------------------------------------------------
// Semantic helpers — named aliases for common layout patterns.
// Mirrors EZXS-OS spacing helpers for cross-app consistency.
// ---------------------------------------------------------------------------
export const spacingHelpers = {
  /** Default screen-edge padding (16). */
  paddingBase: spacing[4],
  /** Compact padding for nested content (12). */
  paddingCompact: spacing[3],
  /** Large padding for hero sections (24). */
  paddingLarge: spacing[6],
  /** Default gap between list items / sections (16). */
  gapBase: spacing[4],
  /** Compact gap inside grouped cards (8). */
  gapCompact: spacing[2],
  /** Small gap between inline elements (4). */
  gapSmall: spacing[1],
  /** Default margin around standalone elements (16). */
  marginBase: spacing[4],
  /** Small margin between related items (8). */
  marginSmall: spacing[2],
} as const;
