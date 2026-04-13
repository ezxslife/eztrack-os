import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useUIStore } from "@/stores/ui-store";

function canTriggerHaptics() {
  return Platform.OS !== "web" && useUIStore.getState().sensoryEnabled;
}

async function runHaptic(effect: () => Promise<void>) {
  if (!canTriggerHaptics()) {
    return;
  }

  try {
    await effect();
  } catch {
    // Ignore transient native haptics failures.
  }
}

export function triggerSelectionHaptic() {
  void runHaptic(() => Haptics.selectionAsync());
}

export function triggerImpactHaptic(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium
) {
  void runHaptic(() => Haptics.impactAsync(style));
}

export function triggerNotificationHaptic(
  type: "error" | "success" | "warning"
) {
  const mappedType =
    type === "error"
      ? Haptics.NotificationFeedbackType.Error
      : type === "warning"
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success;

  void runHaptic(() => Haptics.notificationAsync(mappedType));
}

export function triggerHaptic(
  type: "error" | "light" | "medium" | "selection" | "success" | "warning"
) {
  switch (type) {
    case "selection":
      triggerSelectionHaptic();
      return;
    case "light":
      triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Light);
      return;
    case "medium":
      triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium);
      return;
    case "success":
    case "warning":
    case "error":
      triggerNotificationHaptic(type);
      return;
  }
}

// ---------------------------------------------------------------------------
// Semantic haptics API — named methods for common UX actions.
// Mirrors EZXS-OS safeHaptics for consistency across apps.
// ---------------------------------------------------------------------------
export const haptics = {
  /** Soft selection feedback (tab change, toggle, picker scroll). */
  selection: () => triggerSelectionHaptic(),
  /** Light impact (button tap, chip press). */
  light: () => triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Light),
  /** Medium impact (confirmation, drag threshold). */
  medium: () => triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium),
  /** Heavy impact (destructive swipe commit). */
  heavy: () => triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Heavy),
  /** Button press feel — same as selection. */
  press: () => triggerSelectionHaptic(),
  /** Toggle switch or checkbox. */
  toggle: () => triggerSelectionHaptic(),
  /** Action confirmed (save, submit). */
  confirm: () => triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium),
  /** Pull-to-refresh trigger. */
  refresh: () => triggerSelectionHaptic(),
  /** Context menu opened (long-press). */
  contextMenu: () => triggerSelectionHaptic(),
  /** Sheet opened — no-op by default (visual is enough). */
  sheetOpen: () => {},
  /** Sheet closed — no-op by default. */
  sheetClose: () => {},
  /** Dismiss / cancel action. */
  dismiss: () => triggerSelectionHaptic(),
  /** Success notification. */
  success: () => triggerNotificationHaptic("success"),
  /** Warning notification. */
  warning: () => triggerNotificationHaptic("warning"),
  /** Error notification. */
  error: () => triggerNotificationHaptic("error"),
} as const;
