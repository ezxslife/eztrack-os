import { ReactNode } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenTitleStrip } from "@/components/ui/glass/ScreenTitleStrip";
import {
  useThemeColors,
  useThemeSpacing,
} from "@/theme";

interface ScreenContainerProps {
  accessory?: ReactNode;
  children: ReactNode;
  onRefresh?: () => void;
  padded?: boolean;
  refreshing?: boolean;
  title: string;
  subtitle?: string;
}

export function ScreenContainer({
  accessory,
  children,
  onRefresh,
  padded = true,
  refreshing = false,
  title,
  subtitle,
}: ScreenContainerProps) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const styles = StyleSheet.create({
    accessory: {
      marginBottom: spacing[4],
    },
    body: {
      gap: spacing[4],
    },
    content: {
      paddingBottom: spacing[8],
      paddingHorizontal: spacing[4],
    },
    contentCompact: {
      paddingTop: spacing[3],
    },
    contentPadded: {
      paddingTop: spacing[5],
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
        <ScreenTitleStrip subtitle={subtitle} title={title} />
        {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
