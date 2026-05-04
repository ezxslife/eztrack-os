import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors } from '@/theme';
import {
  createPosSale,
  fetchActiveEvent,
  fetchCurrentEventDay,
  fetchLatestSnapshot,
  tierDefinitionsFor,
  type CapacitySnapshotRow,
  type EventDayRow,
  type EventRow,
  type PosTier,
} from '@/lib/events-queries';

const POLL_MS = 5000;

export default function PosTabScreen() {
  const colors = useThemeColors();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [day, setDay] = useState<EventDayRow | null>(null);
  const [snapshot, setSnapshot] = useState<CapacitySnapshotRow | null>(null);
  const [tiers, setTiers] = useState<PosTier[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [completion, setCompletion] = useState<{ tier: string; price: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const ev = await fetchActiveEvent();
    setEvent(ev);
    if (!ev) return;
    setTiers(tierDefinitionsFor(ev));
    const d = await fetchCurrentEventDay(ev.id);
    setDay(d);
    if (d) setSnapshot(await fetchLatestSnapshot(d.id));
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

  async function handleSell(tier: PosTier) {
    if (!event || submitting) return;
    setError(null);
    setCompletion(null);
    setSubmitting(tier.name);
    try {
      const res = await createPosSale({
        org_id: event.org_id,
        event_id: event.id,
        tier: tier.name,
        price_cents: tier.price_cents,
      });
      if (!res.ok) {
        setError(res.error ?? 'Sale failed.');
        return;
      }
      setCompletion({ tier: tier.name, price: tier.price_cents });
      await load();
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator color={colors.primaryInk} />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={['top']}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>No event live</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Open the web app to set an event live before taking sales.
        </Text>
      </SafeAreaView>
    );
  }

  const remaining = Math.max(0, (day?.capacity ?? 0) - (snapshot?.checked_in ?? 0));
  const noCap = remaining <= 0 && day != null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heading, { color: colors.textPrimary }]} numberOfLines={1}>
              Walk-up POS
            </Text>
            <Text style={[styles.subhead, { color: colors.textSecondary }]} numberOfLines={1}>
              {event.name} · {day?.label ?? 'No day'} · cash + auto check-in
            </Text>
          </View>
          <View
            style={[
              styles.remainingChip,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.remainingLabel, { color: colors.textTertiary }]}>REMAINING</Text>
            <Text style={[styles.remainingValue, { color: colors.textPrimary }]}>{remaining}</Text>
          </View>
        </View>

        <View style={styles.tiers}>
          {tiers.map((t) => {
            const isLoading = submitting === t.name;
            const disabled = !!submitting || noCap;
            return (
              <Pressable
                key={t.name}
                onPress={() => handleSell(t)}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.tier,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                    opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.tierName, { color: colors.textTertiary }]}>{t.name}</Text>
                <Text style={[styles.tierPrice, { color: colors.textPrimary }]}>
                  ${(t.price_cents / 100).toFixed(2)}
                </Text>
                <Text style={[styles.tierHint, { color: colors.textSecondary }]}>
                  {isLoading ? 'Selling…' : 'Tap to sell + auto check-in'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {completion ? (
          <View style={[styles.banner, { borderColor: '#34C759' }]}>
            <Text style={styles.bannerTitle}>Sold {completion.tier}</Text>
            <Text style={styles.bannerCopy}>
              ${(completion.price / 100).toFixed(2)} · Auto-checked in
            </Text>
          </View>
        ) : null}

        {error ? (
          <Text style={[styles.error, { color: '#EF4444' }]}>{error}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heading: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subhead: { fontSize: 12, marginTop: 2 },
  remainingChip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  remainingLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  remainingValue: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  tiers: { gap: 12 },
  tier: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    minHeight: 110,
    justifyContent: 'center',
  },
  tierName: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tierPrice: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  tierHint: { fontSize: 12, marginTop: 4 },
  banner: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
  },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: '#34C759' },
  bannerCopy: { fontSize: 13, marginTop: 2, color: '#155E29' },
  error: { fontSize: 13, fontWeight: '600' },
});
