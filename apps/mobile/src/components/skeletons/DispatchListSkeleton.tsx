/**
 * DispatchListSkeleton — Page-level loading skeleton for the Dispatch tab.
 *
 * Mirrors the real layout:
 *   1. Filter chip row (4 pills + "New Dispatch" button)
 *   2. List of dispatch card placeholders with action button area
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { SkeletonCard } from '@/components/ui/loading/SkeletonCard';
import { useThemeColors } from '@/theme';
import { uiTokens } from '@/theme/uiTokens';

export function DispatchListSkeleton() {
  const colors = useThemeColors();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      scrollEnabled={false}
      accessibilityLabel="Loading dispatch board"
      accessibilityRole="progressbar"
    >
      {/* ── Filter Chips + New Dispatch button ── */}
      <View style={styles.chipRow}>
        {[50, 65, 75, 60].map((w, i) => (
          <Skeleton
            key={i}
            height={32}
            width={w}
            borderRadius={uiTokens.pillRadius}
          />
        ))}
        <View style={{ flex: 1 }} />
        <Skeleton
          height={32}
          width={110}
          borderRadius={uiTokens.pillRadius}
        />
      </View>

      {/* ── Dispatch Cards ── */}
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} variant="dispatch" />
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
    alignItems: 'center',
    marginBottom: 4,
  },
});
