import { StyleSheet, Text, View } from "react-native";

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

  const styles = StyleSheet.create({
    container: {
      gap: spacing[0.5],
      paddingBottom: spacing[3],
      paddingTop: spacing[2],
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
      maxWidth: 640,
    },
    title: {
      ...typography.title1,
      color: colors.textPrimary,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
