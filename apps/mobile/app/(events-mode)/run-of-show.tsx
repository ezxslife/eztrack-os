import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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
  advanceRosSlot,
  classifyRosSlot,
  fetchActiveEvent,
  fetchChecklistItems,
  fetchCurrentEventDay,
  fetchEventDays,
  fetchOrCreateRunOfShow,
  fetchRosSlots,
  toggleChecklistItem,
  type ChecklistItemRow,
  type EventDayRow,
  type EventRow,
  type RosSlotRow,
  type RosSlotState,
  type RunOfShowRow,
} from '@/lib/events-queries';
import { getSupabase } from '@/lib/supabase';

const POLL_MS = 30_000;

export default function RunOfShowTabScreen() {
  const colors = useThemeColors();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [days, setDays] = useState<EventDayRow[]>([]);
  const [day, setDay] = useState<EventDayRow | null>(null);
  const [ros, setRos] = useState<RunOfShowRow | null>(null);
  const [slots, setSlots] = useState<RosSlotRow[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItemRow[]>([]);
  const [now, setNow] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async (eventId: string, eventDayId: string, orgId: string) => {
    const r = await fetchOrCreateRunOfShow(orgId, eventId, eventDayId);
    setRos(r);
    const [s, c] = await Promise.all([fetchRosSlots(r.id), fetchChecklistItems(r.id)]);
    setSlots(s);
    setChecklist(c);
  }, []);

  const load = useCallback(async () => {
    const ev = await fetchActiveEvent();
    setEvent(ev);
    if (!ev) return;
    const [allDays, currentDay] = await Promise.all([
      fetchEventDays(ev.id),
      fetchCurrentEventDay(ev.id),
    ]);
    setDays(allDays);
    const target = currentDay ?? allDays[0] ?? null;
    setDay(target);
    if (target) await refresh(ev.id, target.id, ev.org_id);
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (!cancelled) setLoading(false);
    })();
    const t = setInterval(() => {
      if (!cancelled) {
        setNow(new Date());
        void load();
      }
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setNow(new Date());
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  async function handleAdvance(slotId: string) {
    if (!event || !day || !ros || busy) return;
    setBusy(slotId);
    try {
      await advanceRosSlot({ ros_id: ros.id, current_slot_id: slotId });
      setNow(new Date());
      await refresh(event.id, day.id, event.org_id);
    } finally {
      setBusy(null);
    }
  }

  async function handleToggleChecklist(item: ChecklistItemRow) {
    if (busy) return;
    const next = !item.completed_at;
    setBusy(item.id);
    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();
      await toggleChecklistItem(item.id, next, userData?.user?.id ?? null);
      setChecklist((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? { ...c, completed_at: next ? new Date().toISOString() : null }
            : c,
        ),
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleSwitchDay(target: EventDayRow) {
    if (!event || busy) return;
    setBusy('day');
    try {
      setDay(target);
      await refresh(event.id, target.id, event.org_id);
    } finally {
      setBusy(null);
    }
  }

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

  if (!event || !day || !ros) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <Ionicons name="list-outline" size={26} color={colors.textTertiary} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>No active event</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Open the web app to set an event live, then come back.
        </Text>
      </SafeAreaView>
    );
  }

  const isMultiDay = days.length > 1;

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
          Run-of-show
        </Text>
        <Text style={[styles.subhead, { color: colors.textSecondary }]} numberOfLines={1}>
          {event.name} · {day.label}
          {isMultiDay ? ` · Day ${day.day_index} of ${days.length}` : ''}
          {ros.published_to_staff_at ? ' · published' : ' · draft'}
        </Text>

        {isMultiDay ? (
          <View style={styles.dayTabs}>
            {days.map((d) => {
              const active = d.id === day.id;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => handleSwitchDay(d)}
                  disabled={!!busy}
                  style={[
                    styles.dayTab,
                    {
                      backgroundColor: active ? colors.primaryInk : colors.surfaceElevated,
                      borderColor: active ? colors.primaryInk : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayTabText,
                      { color: active ? colors.background : colors.textSecondary },
                    ]}
                  >
                    Day {d.day_index} · {d.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View
          style={[
            styles.section,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TIMELINE</Text>
          {slots.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textTertiary }]}>
              No timeline yet. Add slots from the web app — load-in, sound check, doors,
              sets, last call, load-out.
            </Text>
          ) : (
            slots.map((s) => {
              const state: RosSlotState = classifyRosSlot(s, now);
              return (
                <View
                  key={s.id}
                  style={[
                    styles.slotRow,
                    {
                      borderTopColor: colors.divider,
                      opacity: state === 'past' ? 0.5 : 1,
                      backgroundColor:
                        state === 'current' ? 'rgba(52, 199, 89, 0.10)' : 'transparent',
                      borderLeftWidth: state === 'current' ? 3 : 0,
                      borderLeftColor: '#34C759',
                      paddingLeft: state === 'current' ? 9 : 0,
                    },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={state === 'current' ? '#34C759' : colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.slotTime,
                      {
                        color: state === 'current' ? colors.textPrimary : colors.textSecondary,
                      },
                    ]}
                  >
                    {formatTime(s.starts_at)} – {formatTime(s.ends_at)}
                  </Text>
                  <View style={styles.slotBody}>
                    <Text style={[styles.slotLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                      {s.label}
                    </Text>
                    {state === 'current' ? (
                      <View style={styles.nowPill}>
                        <Text style={styles.nowPillText}>NOW</Text>
                      </View>
                    ) : null}
                    {state === 'past' ? (
                      <Text style={[styles.pastLabel, { color: colors.textTertiary }]}>past</Text>
                    ) : null}
                  </View>
                  {state === 'current' ? (
                    <Pressable
                      onPress={() => handleAdvance(s.id)}
                      disabled={busy === s.id}
                      style={({ pressed }) => [
                        styles.advanceBtn,
                        { opacity: busy === s.id ? 0.5 : pressed ? 0.85 : 1 },
                      ]}
                    >
                      <Ionicons name="play-skip-forward" size={11} color="#fff" />
                      <Text style={styles.advanceText}>Advance</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            PRE-EVENT CHECKLIST
          </Text>
          {checklist.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textTertiary }]}>
              No checklist yet. Add radio test, ID-check training, bar setup from the web app.
            </Text>
          ) : (
            checklist.map((c) => {
              const done = !!c.completed_at;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => handleToggleChecklist(c)}
                  disabled={!!busy}
                  style={[styles.checkRow, { borderTopColor: colors.divider }]}
                >
                  <Ionicons
                    name={done ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={done ? '#34C759' : colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.checkLabel,
                      {
                        color: done ? colors.textTertiary : colors.textPrimary,
                        textDecorationLine: done ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: '700', marginTop: 8 },
  subtitle: { fontSize: 14, textAlign: 'center' },
  heading: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subhead: { fontSize: 13 },
  dayTabs: { flexDirection: 'row', gap: 6 },
  dayTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  dayTabText: { fontSize: 12, fontWeight: '700' },
  section: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  empty: { fontSize: 13, paddingVertical: 12 },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  slotTime: { width: 110, fontSize: 12, fontVariant: ['tabular-nums'] },
  slotBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  nowPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#34C759',
  },
  nowPillText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pastLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#34C759',
  },
  advanceText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  checkLabel: { flex: 1, fontSize: 14 },
});
