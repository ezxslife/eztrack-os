import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  type AccessibilityActionEvent,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import { useThemeColors } from "@/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { triggerHaptic } from "@/lib/haptics";
import { AppSymbol } from "./AppSymbol";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SwipeAction {
  id: string;
  label: string;
  /** SF Symbol name or React node */
  icon: React.ReactNode | string;
  color: string;
  destructive?: boolean;
}

export interface SwipeableRowProps {
  id: string;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onActionPress: (action: string, itemId: string) => void | Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  peekThreshold?: number;
}

// ---------------------------------------------------------------------------
// Haptic helpers (must run on JS thread)
// ---------------------------------------------------------------------------

function hapticLight() {
  triggerHaptic("light");
}

function hapticMedium() {
  triggerHaptic("medium");
}

function hapticHeavy() {
  triggerHaptic("medium");
}

// ---------------------------------------------------------------------------
// Spring config
// ---------------------------------------------------------------------------

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
};

// ---------------------------------------------------------------------------
// Action slot renderer
// ---------------------------------------------------------------------------

function ActionSlot({
  actions,
  side,
}: {
  actions: SwipeAction[];
  side: "left" | "right";
}) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.actionContainer,
        side === "left"
          ? styles.actionContainerLeft
          : styles.actionContainerRight,
        { backgroundColor: actions[0]?.color ?? colors.iconChromeBg },
      ]}
    >
      {actions.map((action) => (
        <View key={action.id} style={styles.actionSlot}>
          {typeof action.icon === "string" ? (
            <AppSymbol name={action.icon} size={18} color="#FFFFFF" />
          ) : (
            <View style={styles.actionIconNode}>{action.icon}</View>
          )}
          <Text style={styles.actionLabel} numberOfLines={1}>
            {action.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// SwipeableRow
// ---------------------------------------------------------------------------

/**
 * Gesture-driven swipeable list row with left/right action panels.
 *
 * Swipe past threshold to trigger the first action on that side.
 * Includes peek haptics, rubber-banding, reduced-motion support,
 * and VoiceOver accessibility actions.
 *
 * Ported from EZXS-OS SwipeableRow.
 */
export function SwipeableRow({
  id,
  leftActions = [],
  rightActions = [],
  onActionPress,
  children,
  threshold = 80,
  peekThreshold = 40,
}: SwipeableRowProps) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  const translateX = useSharedValue(0);
  const hasPeekedLeft = useRef(false);
  const hasPeekedRight = useRef(false);
  const isProcessing = useRef(false);

  // Action trigger (runs on JS thread)
  const triggerAction = useCallback(
    async (actions: SwipeAction[], _direction: "left" | "right") => {
      if (isProcessing.current || actions.length === 0) return;
      isProcessing.current = true;

      const action = actions[0];
      if (action.destructive) {
        hapticHeavy();
      } else {
        hapticMedium();
      }

      try {
        await onActionPress(action.id, id);
      } finally {
        isProcessing.current = false;
      }
    },
    [id, onActionPress]
  );

  // Gesture
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      const tx = event.translationX;

      if (tx > 0 && leftActions.length === 0) return;
      if (tx < 0 && rightActions.length === 0) return;

      // Rubber-band beyond threshold
      const clampedAbs = Math.min(Math.abs(tx), threshold * 1.2);
      translateX.value = tx > 0 ? clampedAbs : -clampedAbs;

      // Peek haptic (right swipe reveals left actions)
      if (tx > peekThreshold && !hasPeekedLeft.current) {
        hasPeekedLeft.current = true;
        runOnJS(hapticLight)();
      } else if (tx < peekThreshold && tx > 0) {
        hasPeekedLeft.current = false;
      }

      // Peek haptic (left swipe reveals right actions)
      if (tx < -peekThreshold && !hasPeekedRight.current) {
        hasPeekedRight.current = true;
        runOnJS(hapticLight)();
      } else if (tx > -peekThreshold && tx < 0) {
        hasPeekedRight.current = false;
      }
    })
    .onEnd((event) => {
      const tx = event.translationX;
      const snapBack = reducedMotion
        ? withTiming(0, { duration: 0 })
        : withSpring(0, SPRING_CONFIG);

      if (tx > threshold && leftActions.length > 0) {
        translateX.value = threshold;
        runOnJS(triggerAction)(leftActions, "left");
        translateX.value = snapBack;
      } else if (tx < -threshold && rightActions.length > 0) {
        translateX.value = -threshold;
        runOnJS(triggerAction)(rightActions, "right");
        translateX.value = snapBack;
      } else {
        translateX.value = snapBack;
      }

      hasPeekedLeft.current = false;
      hasPeekedRight.current = false;
    });

  // Animated styles
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Accessibility actions
  const accessibilityActions = [
    ...leftActions.map((a) => ({ name: a.id, label: a.label })),
    ...rightActions.map((a) => ({ name: a.id, label: a.label })),
  ];

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      const actionName = event.nativeEvent.actionName;
      onActionPress(actionName, id);
    },
    [id, onActionPress]
  );

  return (
    <View
      style={styles.container}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={handleAccessibilityAction}
      accessibilityRole="button"
    >
      {leftActions.length > 0 && (
        <ActionSlot actions={leftActions} side="left" />
      )}
      {rightActions.length > 0 && (
        <ActionSlot actions={rightActions} side="right" />
      )}

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.content,
            { backgroundColor: colors.surface },
            contentStyle,
          ]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  content: {
    zIndex: 1,
  },
  actionContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 0,
  },
  actionContainerLeft: {
    justifyContent: "flex-start",
    paddingLeft: 16,
  },
  actionContainerRight: {
    justifyContent: "flex-end",
    paddingRight: 16,
  },
  actionSlot: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  actionIconNode: {
    marginBottom: 2,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
