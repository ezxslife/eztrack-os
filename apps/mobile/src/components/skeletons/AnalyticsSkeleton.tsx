/**
 * AnalyticsSkeleton — Page-level loading skeleton for the Analytics tab.
 *
 * Mirrors the real layout:
 *   1. 2×2 KPI stat grid
 *   2. Incident status section (header + rows)
 *   3. Breakdowns section (header + rows)
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { SkeletonRow } from '@/components/ui/loading/SkeletonRow';
import { useThemeColors } from '@/theme';
import { uiTokens } from '@/theme/uiTokens';

export function AnalyticsSkeleton() {
  const colors = useThemeColors();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      scrollEnabled={false}
      accessibilityLabel="Loading analytics"
      accessibilityRole="progressbar"
    >
      {/* ── KPI Grid: 2×2 ── */}
      <View style={styles.kpiGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.kpiCard,
              {
                backgroundColor: colors.surfaceFrosted,
                borderColor: colors.border,
              },
            ]}
          >
            <Skeleton height={12} width="60%" borderRadius={4} />
            <Skeleton height={24} width="45%" borderRadius={6} />
            <Skeleton height={10} width="35%" borderRadius={4} />
          </View>
        ))}
      </View>

      {/* ── Incident Status Section ── */}
      <Skeleton height={16} width={120} borderRadius={4} />
      <View
        style={[
          styles.groupedCard,
          {
            backgroundColor: colors.surfaceFrosted,
            borderColor: colors.border,
          },
        ]}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow
            key={`status-${i}`}
            hasAvatar={false}
            hasSecondaryText={false}
                      />
        ))}
      </View>

      {/* ── Breakdowns Section ── */}
      <Skeleton height={16} width={100} borderRadius={4} />
      <View
        style={[
          styles.groupedCard,
          {
            backgroundColor: colors.surfaceFrosted,
            borderColor: colors.border,
          },
        ]}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow
            key={`breakdown-${i}`}
            hasAvatar={false}
            hasSecondaryText={false}
                      />
        ))}
      </View>

      {/* ── Chart placeholder ── */}
      <Skeleton height={16} width={140} borderRadius={4} />
      <Skeleton height={160} width="100%" borderRadius={uiTokens.innerRadius} />
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '47%',
    flexGrow: 1,
    padding: 14,
    borderRadius: uiTokens.innerRadius,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  groupedCard: {
    borderRadius: uiTokens.sectionRadius,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingVertical: 4,
  },
});
