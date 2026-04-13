/**
 * IncidentListSkeleton — Page-level loading skeleton for the Incidents tab.
 *
 * Mirrors the real layout:
 *   1. Filter chip row (4 pills)
 *   2. List of incident card placeholders
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { SkeletonCard } from '@/components/ui/loading/SkeletonCard';
import { useThemeColors } from '@/theme';
import { uiTokens } from '@/theme/uiTokens';

export function IncidentListSkeleton() {
  const colors = useThemeColors();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      scrollEnabled={false}
      accessibilityLabel="Loading incidents"
      accessibilityRole="progressbar"
    >
      {/* ── Filter Chips ── */}
      <View style={styles.chipRow}>
        {[70, 55, 80, 65].map((w, i) => (
          <Skeleton
            key={i}
            height={32}
            width={w}
            borderRadius={uiTokens.pillRadius}
          />
        ))}
      </View>

      {/* ── Incident Cards ── */}
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonCard key={i} variant="incident" />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: uiTokens.screenGutter,
    gap: 12,
    paddingBottom: 40,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
});
