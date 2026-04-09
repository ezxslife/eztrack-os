import { StyleSheet, View } from "react-native";

import { GlassPill } from "@/components/ui/glass/GlassPill";
import { MaterialSurface } from "@/components/ui/MaterialSurface";

interface GlassSegmentedControlProps {
  onSelect: (index: number) => void;
  segments: string[];
  selectedIndex: number;
}

export function GlassSegmentedControl({
  onSelect,
  segments,
  selectedIndex,
}: GlassSegmentedControlProps) {
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
        {segments.map((segment, index) => (
          <GlassPill
            key={segment}
            label={segment}
            onPress={() => onSelect(index)}
            selected={index === selectedIndex}
            size="md"
            style={styles.segment}
            variant={index === selectedIndex ? "tinted" : "outline"}
          />
        ))}
      </View>
    </MaterialSurface>
  );
}
