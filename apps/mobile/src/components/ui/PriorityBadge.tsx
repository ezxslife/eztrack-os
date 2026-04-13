import { StyleSheet, Text, View } from "react-native";

import { getPriorityStyle } from "@/theme/statusColors";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { uiTokens } from "@/theme/uiTokens";

interface PriorityBadgeProps {
  compact?: boolean;
  priority: string;
  size?: "sm" | "md";
}

function titleCase(priority: string) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

const priorityIcons: Record<string, string> = {
  low: "chevron.down",
  medium: "equal",
  high: "chevron.up",
  critical: "exclamationmark.2",
};

export function PriorityBadge({
  compact = false,
  priority,
  size = "md",
}: PriorityBadgeProps) {
  const palette = getPriorityStyle(priority);
  const icon = priorityIcons[priority.toLowerCase()] || "circle.fill";
  const isCompact = compact || size === "sm";

  return (
    <View
      style={[
        styles.badge,
        isCompact ? styles.compact : null,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
      ]}
    >
      <AppSymbol
        name={icon}
        size={isCompact ? 14 : 16}
        color={palette.text}
      />
      {!isCompact ? (
        <Text style={[styles.label, { color: palette.text }]}>
          {titleCase(priority)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: uiTokens.pillRadius,
    borderWidth: uiTokens.surfaceBorderWidth,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compact: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
