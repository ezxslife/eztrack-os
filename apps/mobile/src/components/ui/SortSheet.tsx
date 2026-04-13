import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { GlassSheetModal } from "@/components/ui/glass/GlassSheetModal";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";
import type { SFSymbol } from "expo-symbols";

export interface SortOption {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iosIcon?: SFSymbol;
}

interface SortSheetProps {
  isOpen: boolean;
  onClose: () => void;
  options: SortOption[];
  value: string;
  onSelect: (value: string) => void;
  title?: string;
}

export function SortSheet({
  isOpen,
  onClose,
  options,
  value,
  onSelect,
  title = "Sort By",
}: SortSheetProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      gap: 8,
    },
    option: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    optionContent: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: 12,
    },
    optionLabel: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    optionLabelSelected: {
      color: colors.brandText,
      fontWeight: "700",
    },
    checkmark: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
  });

  const handleSelect = (selectedValue: string) => {
    triggerSelectionHaptic();
    onSelect(selectedValue);
    onClose();
  };

  return (
    <GlassSheetModal
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={["40%"]}
      title={title}
    >
      <View style={styles.container}>
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <Pressable
              key={option.value}
              onPress={() => handleSelect(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={styles.option}>
                <View style={styles.optionContent}>
                  {option.icon && (
                    <AppSymbol
                      color={
                        isSelected ? colors.brandText : colors.textSecondary
                      }
                      fallbackName={option.icon}
                      iosName={option.iosIcon}
                      size={18}
                      weight="medium"
                    />
                  )}
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <AppSymbol
                      color={colors.brandText}
                      fallbackName="checkmark"
                      iosName="checkmark"
                      size={18}
                      weight="bold"
                    />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </GlassSheetModal>
  );
}
