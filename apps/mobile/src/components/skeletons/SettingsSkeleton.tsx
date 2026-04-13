/**
 * SettingsSkeleton — Page-level loading skeleton for the More/Settings tab.
 *
 * Mirrors the real layout:
 *   1. Operator profile card (avatar + name + email + role)
 *   2. Operational sync section (2 rows)
 *   3. Modules section (8 rows)
 *   4. Tools section (3 rows)
 *   5. Account section (3 rows)
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { SkeletonRow } from '@/components/ui/loading/SkeletonRow';
import { useThemeColors } from '@/theme';
import { uiTokens } from '@/theme/uiTokens';
import { settingsSectionGap } from '@/theme/settingsTokens';

function SectionHeader({ width = 80 }: { width?: number }) {
  return (
    <Skeleton
      height={11}
      width={width}
      borderRadius={4}
      style={{ marginLeft: 4 }}
    />
  );
}

function GroupedSection({
  rowCount,
  colors,
}: {
  rowCount: number;
  colors: { surfaceFrosted: string; border: string };
}) {
  return (
    <View
      style={[
        styles.groupedCard,
        {
          backgroundColor: colors.surfaceFrosted,
          borderColor: colors.border,
        },
      ]}
    >
      {Array.from({ length: rowCount }).map((_, i) => (
        <SkeletonRow
          key={i}
          hasAvatar={false}
          hasSecondaryText={false}
                  />
      ))}
    </View>
  );
}

export function SettingsSkeleton() {
  const colors = useThemeColors();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      scrollEnabled={false}
      accessibilityLabel="Loading settings"
      accessibilityRole="progressbar"
    >
      {/* ── Operator Profile ── */}
      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: colors.surfaceFrosted,
            borderColor: colors.border,
          },
        ]}
      >
        <Skeleton height={48} width={48} borderRadius={24} />
        <View style={styles.profileText}>
          <Skeleton height={18} width="65%" borderRadius={4} />
          <Skeleton height={13} width="80%" borderRadius={4} />
          <Skeleton height={11} width="40%" borderRadius={4} />
        </View>
      </View>

      {/* ── Operational Sync ── */}
      <SectionHeader width={120} />
      <GroupedSection rowCount={2} colors={colors} />

      {/* ── Modules ── */}
      <SectionHeader width={70} />
      <GroupedSection rowCount={8} colors={colors} />

      {/* ── Tools ── */}
      <SectionHeader width={45} />
      <GroupedSection rowCount={3} colors={colors} />

      {/* ── Account ── */}
      <SectionHeader width={65} />
      <GroupedSection rowCount={3} colors={colors} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: uiTokens.screenGutter,
    gap: settingsSectionGap,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: uiTokens.sectionRadius,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  profileText: {
    flex: 1,
    gap: 6,
  },
  groupedCard: {
    borderRadius: uiTokens.sectionRadius,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingVertical: 4,
  },
});
