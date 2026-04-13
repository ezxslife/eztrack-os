import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useRouter,
  useSegments,
} from "expo-router";

import { useAdaptiveLayout } from "@/theme/layout";
import {
  useThemeColors,
  useThemeSpacing,
  useThemeTypography,
} from "@/theme";

interface ScreenTitleStripProps {
  subtitle?: string;
  title: string;
}

export function ScreenTitleStrip({
  subtitle,
  title,
}: ScreenTitleStripProps) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const segments = useSegments();
  const showBackButton = segments[0] === "settings";

  const styles = StyleSheet.create({
    backButton: {
      alignItems: "center",
      alignSelf: "flex-start",
      flexDirection: "row",
      gap: spacing[1],
      marginBottom: spacing[1],
      paddingVertical: spacing[0.5],
    },
    backLabel: {
      ...typography.headline,
      color: colors.primaryInk,
    },
    container: {
      gap: spacing[0.5],
      paddingBottom: layout.isRegularWidth ? spacing[4] : spacing[3],
      paddingTop: spacing[1],
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
      lineHeight: 21,
      maxWidth: layout.contentMaxWidth,
    },
    title: {
      ...(Platform.OS === "ios" ? typography.largeTitle : typography.title1),
      color: colors.textPrimary,
      maxWidth: layout.contentMaxWidth,
    },
  });

  return (
    <View style={styles.container}>
      {showBackButton ? (
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            color={colors.primaryInk}
            name="chevron-back"
            size={20}
          />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
