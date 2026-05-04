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
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/theme';
import {
  fetchActiveEvent,
  fetchCurrentEventDay,
  fetchOpenDispatches,
  fetchPersonnel,
  fetchShiftAssignments,
  type DispatchLite,
  type EventDayRow,
  type EventRow,
  type PersonnelLite,
  type ShiftAssignmentRow,
} from '@/lib/events-queries';

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#3B82F6',
};

const STATUS_COLOR: Record<string, string> = {
  scheduled: '#94A3B8',
  en_route: '#F59E0B',
  on_shift: '#34C759',
  break: '#F97316',
  off_shift: '#64748B',
  no_show: '#EF4444',
};

export default function StaffTabScreen() {
  const colors = useThemeColors();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [day, setDay] = useState<EventDayRow | null>(null);
  const [personnel, setPersonnel] = useState<PersonnelLite[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignmentRow[]>([]);
  const [dispatches, setDispatches] = useState<DispatchLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const ev = await fetchActiveEvent();
    setEvent(ev);
    const [staff, openDispatches, currentDay] = await Promise.all([
      fetchPersonnel(),
      fetchOpenDispatches(),
      ev ? fetchCurrentEventDay(ev.id) : Promise.resolve(null),
    ]);
    setPersonnel(staff);
    setDispatches(openDispatches);
    setDay(currentDay);
    if (currentDay) {
      const sa = await fetchShiftAssignments(currentDay.id);
      setAssignments(sa);
    } else {
      setAssignments([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (!cancelled) setLoading(false);
    })();
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
      <SafeAreaView
        style={[styles.center, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <ActivityIndicator color={colors.primaryInk} />
      </SafeAreaView>
    );
  }

  const personnelById = new Map(personnel.map((p) => [p.id, p]));
  const onShift = assignments.filter((a) => a.status === 'on_shift' || a.status === 'en_route');
  const dispatchOpen = dispatches.filter((d) => d.status !== 'closed' && d.status !== 'completed');

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
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Staff</Text>
        <Text style={[styles.subhead, { color: colors.textSecondary }]} numberOfLines={1}>
          {event?.name ?? 'No event'} · {day?.label ?? 'No day'}
        </Text>

        <Section title="On shift now" count={onShift.length} colors={colors}>
          {onShift.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textTertiary }]}>
              No staff on shift. Schedule shifts via the eztrack-os Personnel module.
            </Text>
          ) : (
            onShift.map((a) => {
              const p = personnelById.get(a.personnel_id);
              return (
                <View
                  key={a.id}
                  style={[styles.row, { borderTopColor: colors.divider }]}
                >
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: STATUS_COLOR[a.status] ?? '#94A3B8' },
                    ]}
                  />
                  <Text style={[styles.rowMain, { color: colors.textPrimary }]} numberOfLines={1}>
                    {p?.full_name ?? 'Unknown'}{' '}
                    <Text style={{ color: colors.textSecondary }}>· {a.role}</Text>
                  </Text>
                  <Text style={[styles.rowMeta, { color: colors.textTertiary }]}>
                    {new Date(a.ends_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              );
            })
          )}
        </Section>

        <Section title="Open dispatches" count={dispatchOpen.length} colors={colors}>
          {dispatchOpen.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textTertiary }]}>No open dispatches.</Text>
          ) : (
            dispatchOpen.map((d) => (
              <View key={d.id} style={[styles.row, { borderTopColor: colors.divider }]}>
                <Ionicons name="radio-outline" size={14} color={colors.textTertiary} />
                <View
                  style={[
                    styles.priorityPill,
                    { backgroundColor: PRIORITY_COLOR[d.priority] ?? '#94A3B8' },
                  ]}
                >
                  <Text style={styles.priorityPillText}>{d.priority}</Text>
                </View>
                <Text style={[styles.rowMain, { color: colors.textPrimary }]} numberOfLines={1}>
                  {d.description ?? d.status}
                </Text>
                <Text style={[styles.rowMeta, { color: colors.textTertiary }]}>
                  {new Date(d.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))
          )}
        </Section>

        <Section title="Workspace roster" count={personnel.length} colors={colors}>
          {personnel.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textTertiary }]}>
              No personnel in this workspace.
            </Text>
          ) : (
            personnel.map((p) => (
              <View key={p.id} style={[styles.row, { borderTopColor: colors.divider }]}>
                <Ionicons name="person-circle-outline" size={16} color={colors.textTertiary} />
                <Text style={[styles.rowMain, { color: colors.textPrimary }]} numberOfLines={1}>
                  {p.full_name}
                </Text>
                <Text style={[styles.rowMeta, { color: colors.textTertiary }]}>{p.role}</Text>
              </View>
            ))
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  count,
  children,
  colors,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
        <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>{count}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subhead: { fontSize: 13, marginBottom: 4 },
  section: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionCount: { fontSize: 12, fontVariant: ['tabular-nums'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowMain: { flex: 1, fontSize: 13 },
  rowMeta: { fontSize: 11, fontVariant: ['tabular-nums'] },
  priorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  priorityPillText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: { fontSize: 13, paddingVertical: 14 },
});
