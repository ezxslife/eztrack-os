import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { useNetworkStore } from "@/stores/network-store";
import { useOfflineStore } from "@/stores/offline-store";
import { useAdaptiveLayout } from "@/theme/layout";
import {
  useThemeColors,
  useThemeTypography,
} from "@/theme";

export function AppStatusBanner() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const insets = useSafeAreaInsets();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const processing = useOfflineStore((state) => state.processing);
  const pendingCount = useOfflineStore(
    (state) =>
      state.pendingActions.filter((action) => action.syncState === "pending")
        .length
  );
  const deadLetterCount = useOfflineStore(
    (state) =>
      state.pendingActions.filter((action) => action.syncState === "dead_letter")
        .length
  );
  const visibility = useRef(new Animated.Value(0)).current;

  const banner = useMemo(() => {
    if (!isOnline) {
      return {
        message:
          pendingCount > 0
            ? `${pendingCount} queued change${pendingCount === 1 ? "" : "s"} will replay when the connection returns.`
            : "Changes that depend on live data may pause until the connection returns.",
        title: "Offline",
        tone: colors.warning,
      };
    }

    if (processing) {
      return {
        message: "Queued operational changes are replaying now.",
        title: "Syncing queue",
        tone: colors.info,
      };
    }

    if (deadLetterCount > 0) {
      return {
        message: `${deadLetterCount} action${deadLetterCount === 1 ? "" : "s"} need manual review in Sync Center.`,
        title: "Queue needs review",
        tone: colors.error,
      };
    }

    if (pendingCount > 0) {
      return {
        message: `${pendingCount} queued change${pendingCount === 1 ? "" : "s"} are waiting for automatic replay.`,
        title: "Queued changes",
        tone: colors.info,
      };
    }

    return null;
  }, [colors.error, colors.info, colors.warning, deadLetterCount, isOnline, pendingCount, processing]);

  useEffect(() => {
    Animated.timing(visibility, {
      toValue: banner ? 1 : 0,
      duration: banner ? 180 : 140,
      useNativeDriver: true,
    }).start();
  }, [banner, visibility]);

  if (!banner) {
    return null;
  }

  const styles = StyleSheet.create({
    body: {
      flex: 1,
      gap: 2,
    },
    dot: {
      backgroundColor: banner.tone,
      borderRadius: 999,
      height: 10,
      marginTop: 4,
      width: 10,
    },
    host: {
      left: layout.horizontalPadding,
      position: "absolute",
      right: layout.horizontalPadding,
      top: Math.max(insets.top, 10) + 8,
      zIndex: 40,
    },
    message: {
      ...typography.footnote,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    row: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 12,
    },
    title: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    wrapper: {
      gap: 4,
      paddingHorizontal: layout.cardPadding,
      paddingVertical: layout.listItemPadding,
    },
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.host,
        {
          opacity: visibility,
          transform: [
            {
              translateY: visibility.interpolate({
                inputRange: [0, 1],
                outputRange: [-10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <MaterialSurface intensity={88} variant="grouped">
        <View style={styles.row}>
          <View style={styles.dot} />
          <View style={styles.body}>
            <Text style={styles.title}>{banner.title}</Text>
            <Text style={styles.message}>{banner.message}</Text>
          </View>
        </View>
      </MaterialSurface>
    </Animated.View>
  );
}
