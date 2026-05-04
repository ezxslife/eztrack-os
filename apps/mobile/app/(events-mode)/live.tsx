import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors } from '@/theme';
import {
  fetchActiveEvent,
  fetchCurrentEventDay,
  fetchLatestSnapshot,
  fetchRecentCheckIns,
  type CapacitySnapshotRow,
  type CheckInRow,
  type EventDayRow,
  type EventRow,
} from '@/lib/events-queries';

const POLL_MS = 5000;

function thresholdColor(snap: CapacitySnapshotRow | null): string {
  switch (snap?.threshold_breached) {
    case 'alert':
      return '#EF4444';
    case 'red':
      return '#F97316';
    case 'yellow':
      return '#F59E0B';
    default:
      return '#34C759';
  }
}

function thresholdLabel(snap: CapacitySnapshotRow | null): string {
  switch (snap?.threshold_breached) {
    case 'alert':
      return 'AT CAPACITY';
    case 'red':
      return 'CRITICAL';
    case 'yellow':
      return 'WARNING';
    default:
      return 'OK';
  }
}

export default function LiveTabScreen() {
  const colors = useThemeColors();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [day, setDay] = useState<EventDayRow | null>(null);
  const [snapshot, setSnapshot] = useState<CapacitySnapshotRow | null>(null);
  const [scans, setScans] = useState<CheckInRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const ev = await fetchActiveEvent();
    setEvent(ev);
    if (!ev) return;
    const d = await fetchCurrentEventDay(ev.id);
    setDay(d);
    if (d) {
      const [snap, recent] = await Promise.all([
        fetchLatestSnapshot(d.id),
        fetchRecentCheckIns(d.id, 10),
      ]);
      setSnapshot(snap);
      setScans(recent);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (!cancelled) setLoading(false);
    })();
    const t = setInterval(() => {
      if (!cancelled) void load();
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator color={colors.primaryInk} />
      </SafeAreaView>
    );
  }

  if (!event || !day) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={['top']}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>No event live right now</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Open the web app to create one or set status to live.
        </Text>
      </SafeAreaView>
    );
  }

  const checkedIn = snapshot?.checked_in ?? 0;
  const sold = snapshot?.sold ?? 0;
  const reentries = snapshot?.reentries ?? 0;
  const capacity = day.capacity || 1;
  const pct = Math.min(100, Math.round((checkedIn / capacity) * 100));
  const remaining = Math.max(0, capacity - checkedIn);
  const tone = thresholdColor(snapshot);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryInk}
          />
        }
      >
        <Text style={[styles.heading, { color: colors.textPrimary }]} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={[styles.subhead, { color: colors.textSecondary }]}>
          {day.label}
          {event.is_multi_day ? ` · Day ${day.day_index}` : ''}
        </Text>

        <View
          style={[
            styles.capacityCard,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
        >
          <View style={styles.capHeader}>
            <Text style={[styles.capLabel, { color: colors.textSecondary }]}>CAPACITY</Text>
            <View style={[styles.badge, { backgroundColor: tone }]}>
              <Text style={styles.badgeText}>{thresholdLabel(snapshot)}</Text>
            </View>
          </View>
          <Text style={[styles.bigNumber, { color: colors.textPrimary }]}>
            {checkedIn}
            <Text style={[styles.bigNumberSlash, { color: colors.textTertiary }]}>
              {' / '}
              {capacity}
            </Text>
          </Text>
          <Text style={[styles.pct, { color: tone }]}>{pct}%</Text>
          <View style={[styles.barTrack, { backgroundColor: colors.divider }]}>
            <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: tone }]} />
          </View>
        </View>

        <View style={styles.countsRow}>
          <CountCard label="Sold" value={sold} colors={colors} />
          <CountCard label="Re-entries" value={reentries} colors={colors} />
          <CountCard label="Remaining" value={remaining} colors={colors} />
        </View>

        <View
          style={[
            styles.feedCard,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.capLabel, { color: colors.textSecondary }]}>RECENT SCANS</Text>
          {scans.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textTertiary }]}>Waiting for scans…</Text>
          ) : (
            scans.map((s) => (
              <View
                key={s.id}
                style={[styles.scanRow, { borderTopColor: colors.divider }]}
              >
                <View
                  style={[
                    styles.scanDot,
                    { backgroundColor: s.result === 'success' ? '#34C759' : '#F59E0B' },
                  ]}
                />
                <Text style={[styles.scanLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                  {s.location ?? s.source.replace(/_/g, ' ')}
                </Text>
                <Text style={[styles.scanTime, { color: colors.textTertiary }]}>
                  {new Date(s.scanned_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CountCard({
  label,
  value,
  colors,
}: {
  label: string;
  value: number;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      style={[
        styles.countCard,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.countLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.countValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: 'center' },
  heading: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subhead: { fontSize: 13, marginBottom: 8 },
  capacityCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  capHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  capLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bigNumber: { fontSize: 44, fontWeight: '900', letterSpacing: -1 },
  bigNumberSlash: { fontSize: 22, fontWeight: '600' },
  pct: { fontSize: 24, fontWeight: '700', textAlign: 'right' },
  barTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%' },
  countsRow: { flexDirection: 'row', gap: 8 },
  countCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  countLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  countValue: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  feedCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  empty: { fontSize: 13, textAlign: 'center', paddingVertical: 18 },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  scanDot: { width: 10, height: 10, borderRadius: 5 },
  scanLabel: { flex: 1, fontSize: 13 },
  scanTime: { fontSize: 11, fontVariant: ['tabular-nums'] },
});
