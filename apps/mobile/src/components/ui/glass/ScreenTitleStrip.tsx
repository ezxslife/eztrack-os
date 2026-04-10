import { Platform, StyleSheet, Text, View } from "react-native";

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

  const styles = StyleSheet.create({
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
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
