import { ScrollView, StyleSheet } from "react-native";

import { GlassPill } from "@/components/ui/glass/GlassPill";
import { triggerSelectionHaptic } from "@/lib/haptics";

interface FilterChipsProps {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

export function FilterChips({
  options,
  selected,
  onSelect,
}: FilterChipsProps) {
  const styles = StyleSheet.create({
    content: {
      gap: 8,
      paddingRight: 4,
    },
  });

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {options.map((option) => {
        const isSelected = option === selected;

        return (
          <GlassPill
            key={option}
            label={option}
            onPress={() => {
              triggerSelectionHaptic();
              onSelect(option);
            }}
            selected={isSelected}
            size="sm"
            variant={isSelected ? "tinted" : "outline"}
          />
        );
      })}
    </ScrollView>
  );
}
