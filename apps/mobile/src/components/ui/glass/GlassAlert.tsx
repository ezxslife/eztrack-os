import { StyleSheet, Text, View } from "react-native";

import { GlassActionGroup } from "@/components/ui/glass/GlassActionGroup";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { useThemeColors, useThemeTypography } from "@/theme";

interface GlassAlertProps {
  actions?: Array<{
    icon?: "checkmark" | "close" | "information-circle-outline" | "warning-outline";
    label: string;
    onPress: () => void;
  }>;
  message: string;
  title: string;
  tone?: "error" | "info" | "success" | "warning";
}

export function GlassAlert({
  actions,
  message,
  title,
  tone = "info",
}: GlassAlertProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const toneColor =
    tone === "error"
      ? colors.error
      : tone === "success"
        ? colors.success
        : tone === "warning"
          ? colors.warning
          : colors.info;

  const styles = StyleSheet.create({
    body: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    dot: {
      backgroundColor: toneColor,
      borderRadius: 999,
      height: 10,
      marginTop: 4,
      width: 10,
    },
    header: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 12,
    },
    stack: {
      flex: 1,
      gap: 4,
    },
    title: {
      ...typography.headline,
      color: colors.textPrimary,
    },
    wrapper: {
      gap: 14,
    },
  });

  return (
    <MaterialSurface style={styles.wrapper} variant="panel">
      <View style={styles.header}>
        <View style={styles.dot} />
        <View style={styles.stack}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{message}</Text>
        </View>
      </View>
      {actions?.length ? <GlassActionGroup actions={actions} /> : null}
    </MaterialSurface>
  );
}
