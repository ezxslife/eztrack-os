import { ReactNode } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenTitleStrip } from "@/components/ui/glass/ScreenTitleStrip";
import { useAdaptiveLayout } from "@/theme/layout";
import {
  useThemeColors,
  useThemeSpacing,
} from "@/theme";

interface ScreenContainerProps {
  accessory?: ReactNode;
  children: ReactNode;
  iosNativeHeader?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
  refreshing?: boolean;
  title: string;
  subtitle?: string;
}

export function ScreenContainer({
  accessory,
  children,
  iosNativeHeader = false,
  onRefresh,
  padded = true,
  refreshing = false,
  title,
  subtitle,
}: ScreenContainerProps) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const layout = useAdaptiveLayout();
  const styles = StyleSheet.create({
    accessory: {
      marginBottom: spacing[4],
    },
    body: {
      gap: layout.bodyGap,
    },
    content: {
      paddingBottom: spacing[8],
      paddingHorizontal: layout.horizontalPadding,
    },
    contentInner: {
      alignSelf: "center",
      maxWidth: layout.contentMaxWidth,
      width: "100%",
    },
    contentCompact: {
      paddingTop:
        Platform.OS === "ios" && iosNativeHeader
          ? spacing[2]
          : layout.isRegularWidth
            ? spacing[4]
            : spacing[3],
    },
    contentPadded: {
      paddingTop:
        Platform.OS === "ios" && iosNativeHeader
          ? spacing[2]
          : layout.isRegularWidth
            ? spacing[6]
            : spacing[5],
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
          {Platform.OS === "ios" && iosNativeHeader ? null : (
            <ScreenTitleStrip subtitle={subtitle} title={title} />
          )}
          {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
          <View style={styles.body}>{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
