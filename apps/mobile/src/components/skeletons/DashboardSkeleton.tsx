/**
 * DashboardSkeleton — Page-level loading skeleton for the Dashboard tab.
 *
 * Mirrors the real Dashboard layout:
 *   1. 2×2 stat card grid (shift overview)
 *   2. 2 quick-action buttons
 *   3. Recent activity section header + rows
 *   4. Module shortcuts section header + rows
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { SkeletonRow } from '@/components/ui/loading/SkeletonRow';
import { useThemeColors } from '@/theme';
import { uiTokens } from '@/theme/uiTokens';

export function DashboardSkeleton() {
  const colors = useThemeColors();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      scrollEnabled={false}
      accessibilityLabel="Loading dashboard"
      accessibilityRole="progressbar"
    >
      {/* ── Shift Overview: 2×2 stat grid ── */}
      <View style={styles.statsGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surfaceFrosted,
                borderColor: colors.border,
              },
            ]}
          >
            <Skeleton height={12} width="55%" borderRadius={4} />
            <Skeleton height={28} width="40%" borderRadius={6} />
          </View>
        ))}
      </View>

      {/* ── Quick Actions: 2 buttons ── */}
      <View style={styles.quickActions}>
        <Skeleton
          height={uiTokens.controlHeight}
          width="48%"
          borderRadius={uiTokens.controlRadius}
        />
        <Skeleton
          height={uiTokens.controlHeight}
          width="48%"
          borderRadius={uiTokens.controlRadius}
        />
      </View>

      {/* ── Recent Activity ── */}
      <Skeleton height={16} width={130} borderRadius={4} />
      <View style={styles.section}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow
            key={`activity-${i}`}
            hasAvatar
            hasSecondaryText
          />
        ))}
      </View>

      {/* ── Open Modules ── */}
      <Skeleton height={16} width={110} borderRadius={4} />
      <View style={styles.section}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRow
            key={`module-${i}`}
            hasAvatar={false}
            hasSecondaryText={false}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: uiTokens.screenGutter,
    gap: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    padding: 14,
    borderRadius: uiTokens.innerRadius,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  section: {
    gap: 2,
  },
});
