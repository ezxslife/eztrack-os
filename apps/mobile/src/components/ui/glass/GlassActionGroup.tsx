import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { GlassPill } from "@/components/ui/glass/GlassPill";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { useThemeColors, useThemeTypography } from "@/theme";

interface ActionItem {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

interface GlassActionGroupProps {
  actions: ActionItem[];
}

export function GlassActionGroup({ actions }: GlassActionGroupProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const styles = StyleSheet.create({
    action: {
      flex: 1,
    },
    container: {
      gap: 8,
    },
    iconLabel: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
    },
    label: {
      ...typography.footnote,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
  });

  return (
    <MaterialSurface style={styles.container} variant="cta">
      <View style={styles.row}>
        {actions.map((action) => (
          <GlassPill
            key={action.label}
            onPress={action.onPress}
            size="md"
            style={styles.action}
            variant="outline"
          >
            <View style={styles.iconLabel}>
              {action.icon ? (
                <Ionicons color={colors.textPrimary} name={action.icon} size={16} />
              ) : null}
              <Text style={styles.label}>{action.label}</Text>
            </View>
          </GlassPill>
        ))}
      </View>
    </MaterialSurface>
  );
}
