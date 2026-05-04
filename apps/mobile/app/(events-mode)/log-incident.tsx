import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useThemeColors } from '@/theme';
import {
  createEventIncident,
  fetchActiveEvent,
  fetchCurrentEventDay,
  INCIDENT_TYPES,
  type EventDayRow,
  type EventRow,
  type IncidentSeverity,
} from '@/lib/events-queries';

const SEVERITIES: Array<{ value: IncidentSeverity; color: string }> = [
  { value: 'low', color: '#3B82F6' },
  { value: 'medium', color: '#F59E0B' },
  { value: 'high', color: '#F97316' },
  { value: 'critical', color: '#EF4444' },
];

export default function LogIncidentTabScreen() {
  const colors = useThemeColors();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [day, setDay] = useState<EventDayRow | null>(null);
  const [type, setType] = useState(INCIDENT_TYPES[0].value);
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [synopsis, setSynopsis] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ev = await fetchActiveEvent();
      if (cancelled) return;
      setEvent(ev);
      if (ev) {
        const d = await fetchCurrentEventDay(ev.id);
        if (!cancelled) setDay(d);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit() {
    if (!event) return setError('No active event.');
    if (!synopsis.trim()) return setError('Synopsis is required.');
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await createEventIncident({
        org_id: event.org_id,
        event_id: event.id,
        event_day_id: day?.id ?? null,
        incident_type: type,
        severity,
        synopsis: synopsis.trim(),
        reported_by: reportedBy.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error ?? 'Could not log incident.');
        return;
      }
      setSuccess(res.record_number ?? 'Logged');
      setSynopsis('');
      setReportedBy('');
      setSeverity('medium');
      // Bounce to /live tab after a beat
      setTimeout(() => router.push('/(events-mode)/live'), 1200);
    } finally {
      setSubmitting(false);
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Log incident</Text>
          <Text style={[styles.subhead, { color: colors.textSecondary }]} numberOfLines={1}>
            {event?.name ?? 'No event'} · {day?.label ?? 'No day'}
          </Text>

          <Field label="Type" colors={colors}>
            <View style={styles.chips}>
              {INCIDENT_TYPES.map((t) => {
                const active = type === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setType(t.value)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primaryInk : colors.surfaceElevated,
                        borderColor: active ? colors.primaryInk : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? colors.background : colors.textSecondary },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Severity" colors={colors}>
            <View style={styles.severityRow}>
              {SEVERITIES.map((s) => {
                const active = severity === s.value;
                return (
                  <Pressable
                    key={s.value}
                    onPress={() => setSeverity(s.value)}
                    style={[
                      styles.severityBtn,
                      {
                        backgroundColor: active ? s.color : colors.surfaceElevated,
                        borderColor: active ? s.color : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        { color: active ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      {s.value.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Synopsis" colors={colors}>
            <TextInput
              value={synopsis}
              onChangeText={setSynopsis}
              placeholder="Patron in distress at door 2"
              placeholderTextColor={colors.textTertiary}
              multiline
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  minHeight: 80,
                },
              ]}
            />
          </Field>

          <Field label="Reported by" colors={colors}>
            <TextInput
              value={reportedBy}
              onChangeText={setReportedBy}
              placeholder="Door staff name (optional)"
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
            />
          </Field>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#34C759" />
              <Text style={styles.successText}>Logged · {success}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting || !event}
            style={({ pressed }) => [
              styles.submit,
              {
                backgroundColor: '#EF4444',
                opacity: !event ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="warning" size={18} color="#fff" />
            <Text style={styles.submitText}>{submitting ? 'Logging…' : 'Log incident'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 16, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subhead: { fontSize: 13, marginBottom: 4 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  severityRow: { flexDirection: 'row', gap: 6 },
  severityBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  severityText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  error: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#34C759',
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
  },
  successText: { color: '#155E29', fontSize: 13, fontWeight: '700' },
  submit: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
