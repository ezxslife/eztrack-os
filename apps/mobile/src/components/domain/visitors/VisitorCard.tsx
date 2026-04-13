import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeSpacing, useThemeTypography } from "@/theme";

export interface VisitorCardProps {
  id: string;
  name: string;
  host?: string;
  purpose?: string;
  checkedInAt?: string | Date;
  checkedOutAt?: string | Date;
  status: "checked_in" | "checked_out" | "expected";
  onPress?: () => void;
}

function formatTime(date?: string | Date): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
}

export function VisitorCard({
  id,
  name,
  host,
  purpose,
  checkedInAt,
  checkedOutAt,
  status,
  onPress,
}: VisitorCardProps) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();

  const statusColor =
    status === "checked_in"
      ? colors.success
      : status === "expected"
        ? colors.accent
        : colors.textTertiary;

  const statusLabel =
    status === "checked_in" ? "Checked In" : status === "expected" ? "Expected" : "Checked Out";

  const handlePress = () => {
    if (!onPress) return;
    triggerSelectionHaptic();
    onPress();
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    content: {
      flex: 1,
      gap: spacing[1],
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    name: {
      ...typography.headline,
      color: colors.textPrimary,
    },
    statusBadge: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[0.5],
      borderRadius: 6,
      backgroundColor: `${statusColor}20`,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "600",
      color: statusColor,
    },
    hostPurposeText: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    timeText: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    pressable: {
      opacity: 0.7,
    },
  });

  const timeDisplay =
    status === "checked_in" && checkedInAt
      ? formatTime(checkedInAt)
      : status === "checked_out" && checkedOutAt
        ? formatTime(checkedOutAt)
        : "";

  const content = (
    <View style={styles.container}>
      <Avatar name={name} size="md" />

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        {host && <Text style={styles.hostPurposeText}>Visiting: {host}</Text>}
        {purpose && <Text style={styles.hostPurposeText}>{purpose}</Text>}

        {timeDisplay && <View style={styles.footerRow}>
          <Text style={styles.timeText}>{timeDisplay}</Text>
        </View>}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => (pressed ? styles.pressable : {})}
      >
        <MaterialSurface variant="grouped" padding={spacing[3]}>
          {content}
        </MaterialSurface>
      </Pressable>
    );
  }

  return (
    <MaterialSurface variant="grouped" padding={spacing[3]}>
      {content}
    </MaterialSurface>
  );
}
