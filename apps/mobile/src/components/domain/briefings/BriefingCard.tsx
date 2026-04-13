import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { GlassPill } from "@/components/ui/glass/GlassPill";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeSpacing, useThemeTypography } from "@/theme";

export interface BriefingCardProps {
  id: string;
  title: string;
  summary?: string;
  author: string;
  createdAt: string | Date;
  isRead?: boolean;
  priority?: "normal" | "important" | "urgent";
  acknowledgedCount?: number;
  totalCount?: number;
  onPress?: () => void;
}

function formatDate(date: string | Date): string {
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

export function BriefingCard({
  id,
  title,
  summary,
  author,
  createdAt,
  isRead = true,
  priority = "normal",
  acknowledgedCount,
  totalCount,
  onPress,
}: BriefingCardProps) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();

  const priorityColor =
    priority === "urgent"
      ? colors.error
      : priority === "important"
        ? colors.accent
        : colors.textTertiary;

  const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);

  const handlePress = () => {
    if (!onPress) return;
    triggerSelectionHaptic();
    onPress();
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      gap: spacing[3],
    },
    unreadIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.brandText,
      marginTop: spacing[1],
    },
    content: {
      flex: 1,
      gap: spacing[1.5],
    },
    titleText: {
      ...typography.headline,
      color: colors.textPrimary,
      fontWeight: isRead ? "600" : "700",
    },
    summary: {
      ...typography.body,
      color: colors.textSecondary,
      display: "flex",
      lineHeight: 20,
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      flexWrap: "wrap",
      paddingTop: spacing[1],
    },
    footerText: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    priorityBadge: {
      paddingHorizontal: spacing[1.5],
      paddingVertical: spacing[0.5],
      borderRadius: 4,
      backgroundColor: `${priorityColor}20`,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: "600",
      color: priorityColor,
    },
    acknowledgedText: {
      ...typography.caption1,
      color: colors.textTertiary,
      fontWeight: "500",
    },
    pressable: {
      opacity: 0.7,
    },
  });

  const content = (
    <View style={styles.container}>
      {!isRead && <View style={styles.unreadIndicator} />}

      <View style={styles.content}>
        <Text style={styles.titleText}>{title}</Text>

        {summary && (
          <Text
            style={styles.summary}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {summary}
          </Text>
        )}

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{author}</Text>
          <Text style={styles.footerText}>•</Text>
          <Text style={styles.footerText}>{formatDate(createdAt)}</Text>

          {priority !== "normal" && (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>{priorityLabel}</Text>
            </View>
          )}

          {acknowledgedCount !== undefined && totalCount !== undefined && (
            <Text style={styles.acknowledgedText}>
              {acknowledgedCount}/{totalCount} acknowledged
            </Text>
          )}
        </View>
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
