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
