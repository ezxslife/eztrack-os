import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { useThemeColors, useThemeTypography } from "@/theme";

interface GlassFABProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

export function GlassFAB({ icon, label, onPress }: GlassFABProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const styles = StyleSheet.create({
    content: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      minHeight: 52,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    label: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.97 }],
    },
  });

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (Platform.OS !== "web") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        onPress();
      }}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <MaterialSurface padding={0} variant="cta">
        <View style={styles.content}>
          <Ionicons color={colors.primaryStrong} name={icon} size={18} />
          <Text style={styles.label}>{label}</Text>
        </View>
      </MaterialSurface>
    </Pressable>
  );
}
