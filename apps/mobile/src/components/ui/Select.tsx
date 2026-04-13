import { ActionSheetIOS, Platform, Pressable, StyleSheet, Text, View, ViewStyle, type StyleProp } from "react-native";
import { useRef } from "react";

import { useThemeColors, useThemeTypography } from "@/theme";
import { uiTokens } from "@/theme/uiTokens";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { AppSymbol } from "./AppSymbol";

export interface SelectOption {
  label: string;
  value: string;
  icon?: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: "default" | "ghost" | "chip";
  style?: StyleProp<ViewStyle>;
}

export function Select({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  disabled = false,
  variant = "default",
  style,
}: SelectProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const actionSheetRef = useRef<any>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      borderRadius: variant === "chip" ? uiTokens.pillRadius : variant === "default" ? uiTokens.innerRadius : 0,
      paddingHorizontal: variant === "chip" ? 12 : variant === "default" ? 12 : 0,
      paddingVertical: variant === "chip" ? 6 : variant === "default" ? 10 : 0,
      backgroundColor:
        variant === "default"
          ? colors.surfaceContainerLow
          : variant === "chip"
            ? colors.surfaceContainerHigh
            : "transparent",
      borderWidth: variant === "default" ? 1 : 0,
      borderColor: colors.border,
      minHeight: variant === "chip" ? uiTokens.controlHeightSm - 4 : variant === "default" ? uiTokens.controlHeight : "auto",
    },
    containerGhost: {
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    containerDisabled: {
      opacity: 0.5,
    },
    contentContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    label: {
      ...typography[variant === "chip" ? "caption1" : "body"],
      color: colors.textPrimary,
      fontWeight: variant === "chip" ? "600" : "500",
    },
    placeholderLabel: {
      color: colors.textTertiary,
    },
    chevron: {
      width: 20,
      height: 20,
    },
  });

  const handlePress = () => {
    if (disabled) return;
    triggerSelectionHaptic();

    if (Platform.OS === "ios") {
      const cancelIndex = options.length;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options.map((opt) => opt.label), "Cancel"],
          cancelButtonIndex: cancelIndex,
          userInterfaceStyle: colors.textPrimary === "#FAFAFA" ? "dark" : "light",
        },
        (selectedIndex: number) => {
          if (selectedIndex !== cancelIndex && selectedIndex >= 0) {
            onValueChange(options[selectedIndex].value);
          }
        }
      );
    } else {
      // Android: Would use BottomSheet or dialog in production
      // For now, just handle iOS
      console.warn("Select component: Android implementation pending");
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="combobox"
      accessibilityState={{
        disabled,
        expanded: false,
      }}
      style={({ pressed }) => [
        styles.container,
        variant === "ghost" && styles.containerGhost,
        disabled && styles.containerDisabled,
        pressed && !disabled && { opacity: 0.7 },
        style,
      ]}
    >
      <View style={styles.contentContainer}>
        {selectedOption?.icon && (
          <AppSymbol
            color={colors.textPrimary}
            fallbackName={selectedOption.icon as any}
            size={16}
          />
        )}
        <Text
          style={[
            styles.label,
            !selectedOption && styles.placeholderLabel,
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
      </View>

      <AppSymbol
        color={colors.textTertiary}
        fallbackName="chevron-down"
        iosName="chevron.down"
        size={16}
        style={styles.chevron}
      />
    </Pressable>
  );
}
