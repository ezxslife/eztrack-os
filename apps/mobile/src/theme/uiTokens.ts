import { spacing } from "./spacing";

/**
 * Centralized UI tokens for EZTrack mobile.
 *
 * Modeled after EZXS-OS organizerUi.ts — a single source of truth
 * for radius hierarchy, gutter sizes, section gaps, and control dimensions.
 * Components should import from here instead of hardcoding values.
 */
export const uiTokens = {
  // ─── Radius hierarchy (matches EZXS-OS) ────────────────────────
  /** Full-screen surfaces, bottom sheets */
  surfaceRadius: 28,
  /** Panel cards (SectionCard, hero accessory) */
  sectionRadius: 16,
  /** Buttons, inputs, controls, chrome surfaces */
  controlRadius: 14,
  /** Grouped cards, inner list cards, rows */
  innerRadius: 12,
  /** Pill shape (badges, chips) */
  pillRadius: 999,

  // ─── Surface constraints ────────────────────────────────────────
  /** Max content width for tablet / landscape layouts */
  shellMaxWidth: 720,
  /** Hero image / immersive header corner radius */
  heroRadius: 32,
  /** Default surface border width (hairline on most devices) */
  surfaceBorderWidth: 1,
  /** Padding above shell content */
  shellPaddingTop: spacing[2], // 8
  /** Padding below shell content */
  shellPaddingBottom: spacing[5], // 20

  // ─── Gutters ────────────────────────────────────────────────────
  /** Default screen-edge horizontal padding */
  screenGutter: spacing[4], // 16
  /** Compact horizontal padding (modal content, nested sections) */
  compactGutter: spacing[3], // 12
  /** Chip row / badge row horizontal gap */
  chipGutter: spacing[2], // 8

  // ─── Section spacing ────────────────────────────────────────────
  /** Gap between major content sections */
  sectionGap: spacing[4], // 16
  /** Gap between a floating footer and content above */
  floatingFooterGap: spacing[2], // 8

  // ─── Control dimensions ─────────────────────────────────────────
  /** Standard control height (buttons, inputs, rows) — iOS HIG 44pt */
  controlHeight: 44,
  /** Large control height (primary CTA buttons, form selects) */
  controlHeightLg: 54,
  /** Compact control height (secondary actions, chips) */
  controlHeightSm: 36,
  /** Header close / back button touch target */
  closeButtonSize: 44,
  /** Native header bar height (excluding safe area) */
  headerHeight: 60,

  // ─── Icon sizes ─────────────────────────────────────────────────
  iconXs: 12,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 32,

  // ─── Empty state sizes ──────────────────────────────────────────
  /** Icon badge size for empty/error states */
  emptyIconBadge: 64,
  emptyIconBadgeCompact: 46,
  /** Icon size inside empty state badge */
  emptyIconSize: 24,
  emptyIconSizeCompact: 18,

  // ─── Skeleton ───────────────────────────────────────────────────
  /** Shimmer animation half-cycle duration in ms (Apple-like ~1400ms) */
  skeletonShimmerDuration: 1400,

  // ─── Sticky action bar ──────────────────────────────────────────
  /** Button height inside sticky footer bars */
  actionBarButtonHeight: 54,
  /** Border radius for sticky footer buttons */
  actionBarButtonRadius: 14,
  /** Minimum width for secondary (cancel) button */
  actionBarSecondaryMinWidth: 112,
} as const;

export type UITokens = typeof uiTokens;
