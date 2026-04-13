import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { Avatar } from "@/components/ui/Avatar";
import { GlassPill } from "@/components/ui/glass/GlassPill";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeSpacing, useThemeTypography } from "@/theme";
import { getStatusStyle, getPriorityStyle } from "@/theme/statusColors";

export interface WorkOrderCardProps {
  id: string;
  title: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "critical";
  assignedTo?: string;
  location?: string;
  createdAt: string | Date;
  noteCount?: number;
  onPress?: () => void;
}

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
}

export function WorkOrderCard({
  id,
  title,
  status,
  priority,
  assignedTo,
  location,
  createdAt,
  noteCount,
  onPress,
}: WorkOrderCardProps) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();

  const statusStyle = getStatusStyle(status);
  const priorityStyle = priority ? getPriorityStyle(priority) : null;

  const handlePress = () => {
    if (!onPress) return;
    triggerSelectionHaptic();
    onPress();
  };

  const styles = StyleSheet.create({
    container: {
      gap: spacing[3],
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing[2],
    },
    titleSection: {
      flex: 1,
    },
    title: {
      ...typography.headline,
      color: colors.textPrimary,
    },
    statusBadge: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[0.5],
      borderRadius: 6,
      backgroundColor: statusStyle.bg,
      borderColor: statusStyle.border,
      borderWidth: 1,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "600",
      color: statusStyle.text,
    },
    priorityBadge: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[0.5],
      borderRadius: 6,
      backgroundColor: priorityStyle?.bg,
      borderColor: priorityStyle?.border,
      borderWidth: 1,
    },
    priorityText: {
      fontSize: 11,
      fontWeight: "600",
      color: priorityStyle?.text,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      paddingTop: spacing[2],
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
      flexWrap: "wrap",
    },
    footerItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
    },
    footerText: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    pressable: {
      opacity: 0.7,
    },
  });

  const priorityLabel =
    priority === "critical"
      ? "Critical"
      : priority === "high"
        ? "High"
        : priority === "medium"
          ? "Medium"
          : "Low";

  const statusLabel = status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const content = (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: spacing[2], flexWrap: "wrap" }}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
        {priority && (
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>{priorityLabel}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {assignedTo && (
          <View style={styles.footerItem}>
            <Avatar name={assignedTo} size="xs" />
            <Text style={styles.footerText}>{assignedTo}</Text>
          </View>
        )}

        {location && (
          <View style={styles.footerItem}>
            <AppSymbol
              iosName="location.fill"
              fallbackName="location"
              size={12}
              color={colors.textTertiary}
            />
            <Text style={styles.footerText}>{location}</Text>
          </View>
        )}

        <Text style={styles.footerText}>{formatDate(createdAt)}</Text>

        {noteCount ? (
          <View style={styles.footerItem}>
            <AppSymbol
              iosName="note.text"
              fallbackName="list"
              size={12}
              color={colors.textTertiary}
            />
            <Text style={styles.footerText}>{noteCount} note{noteCount !== 1 ? "s" : ""}</Text>
          </View>
        ) : null}
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
