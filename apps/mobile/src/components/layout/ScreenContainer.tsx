import { ReactNode } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useHasNativeHeader } from "@/navigation/NativeHeaderContext";
import { ScreenTitleStrip } from "@/components/ui/glass/ScreenTitleStrip";
import { useAdaptiveLayout } from "@/theme/layout";
import {
  useThemeColors,
  useThemeSpacing,
} from "@/theme";

interface ScreenContainerProps {
  accessory?: ReactNode;
  children: ReactNode;
  gutter?: "compact" | "none" | "standard";
  iosNativeHeader?: boolean;
  nativeHeader?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
  refreshing?: boolean;
  title: string;
  subtitle?: string;
}

export function ScreenContainer({
  accessory,
  children,
  gutter = "standard",
  iosNativeHeader = false,
  nativeHeader,
  onRefresh,
  padded = true,
  refreshing = false,
  title,
  subtitle,
}: ScreenContainerProps) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const layout = useAdaptiveLayout();
  const inheritedNativeHeader = useHasNativeHeader();
  const headerManaged =
    nativeHeader ??
    (Platform.OS === "ios" ? iosNativeHeader : undefined) ??
    inheritedNativeHeader;
  const styles = StyleSheet.create({
    accessory: {
      marginBottom: spacing[5],
    },
    body: {
      gap: layout.bodyGap,
    },
    content: {
      paddingBottom: spacing[10],
      paddingHorizontal:
        gutter === "none"
          ? 0
          : gutter === "compact"
            ? spacing[3]
            : layout.horizontalPadding,
    },
    contentInner: {
      alignSelf: "center",
      maxWidth: layout.contentMaxWidth,
      width: "100%",
    },
    contentCompact: {
      paddingTop:
        headerManaged
          ? spacing[2]
          : layout.isRegularWidth
            ? spacing[5]
            : spacing[4],
    },
    contentPadded: {
      paddingTop:
        headerManaged
          ? spacing[2]
          : layout.isRegularWidth
            ? spacing[7]
            : spacing[6],
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
  });

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          padded ? styles.contentPadded : styles.contentCompact,
        ]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              onRefresh={onRefresh}
              refreshing={refreshing}
              tintColor={colors.primaryStrong}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentInner}>
          {headerManaged ? null : (
            <ScreenTitleStrip subtitle={subtitle} title={title} />
          )}
          {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
          <View style={styles.body}>{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
