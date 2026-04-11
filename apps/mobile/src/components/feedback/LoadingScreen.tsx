import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import {
  useThemeColors,
  useThemeTypography,
} from "@/theme";

interface LoadingScreenProps {
  label?: string;
}

export function LoadingScreen({
  label = "Loading",
}: LoadingScreenProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      backgroundColor: colors.background,
      flex: 1,
      gap: 14,
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    label: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primaryStrong} size="small" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
