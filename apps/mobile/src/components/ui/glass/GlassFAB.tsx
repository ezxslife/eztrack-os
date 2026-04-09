import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { triggerImpactHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";
import type { SFSymbol } from "expo-symbols";

interface GlassFABProps {
  icon: keyof typeof Ionicons.glyphMap;
  iosSymbol?: SFSymbol;
  label: string;
  onPress: () => void;
}

export function GlassFAB({ icon, iosSymbol, label, onPress }: GlassFABProps) {
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
        triggerImpactHaptic();
        onPress();
      }}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <MaterialSurface padding={0} variant="cta">
        <View style={styles.content}>
          <AppSymbol
            color={colors.primaryStrong}
            fallbackName={icon}
            iosName={iosSymbol}
            size={18}
            weight="semibold"
          />
          <Text style={styles.label}>{label}</Text>
        </View>
      </MaterialSurface>
    </Pressable>
  );
}
