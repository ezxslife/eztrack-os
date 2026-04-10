import { StyleSheet, Text, View } from "react-native";

import { getPriorityStyle } from "@/theme/statusColors";

interface PriorityBadgeProps {
  priority: string;
}

function titleCase(priority: string) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const palette = getPriorityStyle(priority);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
        },
      ]}
    >
      <Text style={[styles.label, { color: palette.text }]}>{titleCase(priority)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
