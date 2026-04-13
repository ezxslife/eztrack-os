import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { GlassPill } from "@/components/ui/glass/GlassPill";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeSpacing, useThemeTypography } from "@/theme";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onExpand?: () => void;
  timeRange?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  onExpand,
  timeRange,
}: ChartCardProps) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();

  const handleExpand = () => {
    if (!onExpand) return;
    triggerSelectionHaptic();
    onExpand();
  };

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingBottom: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      gap: spacing[2],
    },
    titleSection: {
      flex: 1,
      gap: spacing[0.5],
    },
    title: {
      ...typography.headline,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    expandButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundMuted,
    },
    content: {
      marginTop: spacing[4],
    },
  });

  return (
    <MaterialSurface variant="panel" padding={spacing[4]}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.headerRight}>
          {timeRange && <GlassPill label={timeRange} size="sm" variant="tinted" />}

          {onExpand && (
            <Pressable
              onPress={handleExpand}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={styles.expandButton}>
                <AppSymbol
                  iosName="arrow.up.left.and.arrow.down.right"
                  fallbackName="expand"
                  size={16}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.content}>{children}</View>
    </MaterialSurface>
  );
}
