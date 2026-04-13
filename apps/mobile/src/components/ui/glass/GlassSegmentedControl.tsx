import { StyleSheet, View } from "react-native";

import { GlassPill } from "@/components/ui/glass/GlassPill";
import { MaterialSurface } from "@/components/ui/MaterialSurface";

interface GlassSegmentedControlProps {
  onSelect?: (index: number) => void;
  onValueChange?: (value: string) => void;
  options?: Array<{ label: string; value: string }>;
  selectedValue?: string;
  segments?: string[];
  selectedIndex?: number;
}

export function GlassSegmentedControl({
  onSelect,
  onValueChange,
  options,
  segments = [],
  selectedIndex = 0,
  selectedValue,
}: GlassSegmentedControlProps) {
  const resolvedSegments = options?.map((option) => option.label) ?? segments;
  const resolvedSelectedIndex =
    options && selectedValue
      ? Math.max(
          options.findIndex((option) => option.value === selectedValue),
          0
        )
      : selectedIndex;

  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    segment: {
      flexGrow: 1,
    },
  });

  return (
    <MaterialSurface variant="grouped">
      <View style={styles.row}>
        {resolvedSegments.map((segment, index) => (
          <GlassPill
            key={segment}
            label={segment}
            onPress={() => {
              onSelect?.(index);
              if (options?.[index] && onValueChange) {
                onValueChange(options[index].value);
              }
            }}
            selected={index === resolvedSelectedIndex}
            size="md"
            style={styles.segment}
            variant={index === resolvedSelectedIndex ? "tinted" : "outline"}
          />
        ))}
      </View>
    </MaterialSurface>
  );
}
