import { ScrollView, StyleSheet, Text, View } from "react-native";

import { GlassPill } from "@/components/ui/glass/GlassPill";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";

interface FilterChipsProps {
  multiSelect?: boolean;
  onSelect: (value: string) => void;
  options: string[];
  selected: string | string[];
  showActiveCount?: boolean;
}

export function FilterChips({
  multiSelect = false,
  onSelect,
  options,
  selected,
  showActiveCount = false,
}: FilterChipsProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const selectedArray = multiSelect
    ? Array.isArray(selected)
      ? selected
      : [selected]
    : Array.isArray(selected)
      ? selected
      : [selected];

  const activeCount = selectedArray.length;

  const styles = StyleSheet.create({
    badge: {
      alignItems: "center",
      backgroundColor: colors.error,
      borderRadius: 999,
      height: 16,
      justifyContent: "center",
      minWidth: 16,
      paddingHorizontal: 4,
      position: "absolute",
      right: -4,
      top: -4,
    },
    badgeText: {
      ...typography.caption2,
      color: "#FFFFFF",
      fontWeight: "700",
    },
    content: {
      gap: 8,
      paddingRight: 4,
    },
    countContainer: {
      alignItems: "center",
      alignSelf: "center",
      justifyContent: "center",
    },
  });

  const handleSelect = (option: string) => {
    triggerSelectionHaptic();

    if (multiSelect) {
      const newSelected = Array.isArray(selected)
        ? selected.includes(option)
          ? selected.filter((s) => s !== option)
          : [...selected, option]
        : [option];
      onSelect(newSelected as any);
    } else {
      onSelect(option);
    }
  };

  return (
    <View>
      <ScrollView
        contentContainerStyle={styles.content}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {options.map((option) => {
          const isSelected = selectedArray.includes(option);

          return (
            <View key={option} style={styles.countContainer}>
              <GlassPill
                label={option}
                onPress={() => handleSelect(option)}
                selected={isSelected}
                size="sm"
                variant={isSelected ? "tinted" : "outline"}
              />
              {showActiveCount && isSelected && activeCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeCount}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
