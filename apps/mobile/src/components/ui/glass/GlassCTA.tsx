import { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassButton } from "@/components/ui/glass/GlassButton";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";

interface GlassCTAProps {
  disabled?: boolean;
  isLoading?: boolean;
  label: string;
  onPress: () => void;
  onSecondaryPress?: () => void;
  safeAreaBottom?: boolean;
  secondaryLabel?: string;
}

export function GlassCTA({
  disabled = false,
  isLoading = false,
  label,
  onPress,
  onSecondaryPress,
  safeAreaBottom = true,
  secondaryLabel,
}: GlassCTAProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const styles = StyleSheet.create({
    bar: {
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    button: {
      width: "100%",
    },
    secondaryButton: {
      paddingVertical: 10,
    },
    secondaryLabel: {
      ...typography.footnote,
      color: colors.brandText,
      fontWeight: "700",
      textAlign: "center",
    },
  });

  const handleSecondaryPress = () => {
    if (onSecondaryPress && !disabled) {
      triggerSelectionHaptic();
      onSecondaryPress();
    }
  };

  const cta = (
    <MaterialSurface style={styles.bar} variant="chrome">
      {secondaryLabel && onSecondaryPress ? (
        <Pressable
          disabled={disabled}
          onPress={handleSecondaryPress}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryLabel}>{secondaryLabel}</Text>
        </Pressable>
      ) : null}
      <GlassButton
        disabled={disabled}
        fullWidth
        isLoading={isLoading}
        label={label}
        onPress={onPress}
        style={styles.button}
        variant="primary"
      />
    </MaterialSurface>
  );

  if (safeAreaBottom) {
    return <SafeAreaView edges={["bottom"]}>{cta}</SafeAreaView>;
  }

  return cta;
}
