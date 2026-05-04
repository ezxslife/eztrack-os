import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";

import { appEnv } from "@/lib/env";
import { type DisplaySession, redeemWallDisplayCode } from "@/lib/pairing";
import { createWallDisplayClient } from "@/lib/supabase";
import {
  fetchWallBoard,
  findActiveDay,
  type EventDayRow,
  type WallBoardData,
} from "@/lib/live";

const STORAGE_KEY = "ezxs.track.wall-display.session";

export default function WallDisplayScreen() {
  const [storedSession, setStoredSession] = useState<DisplaySession | null>(() => readStoredSession());
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [board, setBoard] = useState<WallBoardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [pairing, setPairing] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("Production display");
  const [error, setError] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    if (!storedSession || isExpired(storedSession.expires_at)) {
      clearStoredSession();
      setStoredSession(null);
      setClient(null);
      return;
    }

    try {
      setClient(createWallDisplayClient(storedSession.access_token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create Supabase client.");
    }
  }, [storedSession]);

  const loadBoard = useCallback(async () => {
    if (!client || !storedSession) return;

    try {
      setLoading(true);
      setError(null);
      const nextBoard = await fetchWallBoard(client, storedSession.event.id);
      setBoard(nextBoard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load wall display.");
    } finally {
      setLoading(false);
    }
  }, [client, storedSession]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!client || !storedSession) return;

    const channel = client
      .channel(`wall-display:${storedSession.event.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "capacity_snapshots",
          filter: `event_id=eq.${storedSession.event.id}`,
        },
        () => void loadBoard(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "check_ins",
          filter: `event_id=eq.${storedSession.event.id}`,
        },
        () => void loadBoard(),
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [client, loadBoard, storedSession]);

  useEffect(() => {
    if (!board || board.days.length < 2) return;
    const id = setInterval(() => {
      setDayIndex((current) => (current + 1) % board.days.length);
    }, 20_000);
    return () => clearInterval(id);
  }, [board]);

  const activeDay = useMemo(() => {
    if (!board?.days.length) return null;
    const current = findActiveDay(board.days);
    return current ?? board.days[dayIndex % board.days.length];
  }, [board, dayIndex]);

  const pairDisplay = async () => {
    try {
      setPairing(true);
      setError(null);
      const session = await redeemWallDisplayCode(pairingCode, deviceLabel);
      writeStoredSession(session);
      setStoredSession(session);
      setPairingCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to pair this display.");
    } finally {
      setPairing(false);
    }
  };

  const resetPairing = () => {
    clearStoredSession();
    setStoredSession(null);
    setClient(null);
    setBoard(null);
    setError(null);
  };

  if (!storedSession) {
    return (
      <View style={styles.pairingScreen}>
        <View style={styles.pairingPanel}>
          <Text style={styles.kicker}>EZXS Track</Text>
          <Text style={styles.pairingTitle}>Pair Wall Display</Text>
          <Text style={styles.pairingCopy}>
            Open Settings on a logged-in manager device, choose Wall Display, then enter the six digit code here.
          </Text>

          {!appEnv.configured ? (
            <Text style={styles.errorText}>Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.</Text>
          ) : null}

          <TextInput
            accessibilityLabel="Pairing code"
            value={pairingCode}
            onChangeText={(text) => setPairingCode(text.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor="#5b6472"
            style={styles.codeInput}
          />
          <TextInput
            accessibilityLabel="Display label"
            value={deviceLabel}
            onChangeText={setDeviceLabel}
            placeholder="Production trailer iPad"
            placeholderTextColor="#5b6472"
            style={styles.labelInput}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={pairing || pairingCode.length !== 6 || !appEnv.configured}
            onPress={pairDisplay}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              (pairing || pairingCode.length !== 6 || !appEnv.configured) && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.primaryButtonText}>{pairing ? "Pairing..." : "Pair Display"}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!board || !activeDay) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>{loading ? "Loading live board..." : error ?? "Waiting for event data..."}</Text>
        {error ? (
          <Pressable accessibilityRole="button" onPress={resetPairing} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Pair again</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const snapshot = board.snapshots[activeDay.id];
  const checkedIn = snapshot?.checked_in ?? 0;
  const sold = snapshot?.sold ?? 0;
  const reentries = snapshot?.reentries ?? 0;
  const pct = activeDay.capacity > 0
    ? Math.min(100, Math.round((checkedIn / activeDay.capacity) * 100))
    : Math.round(Number(snapshot?.capacity_pct ?? 0) * 100);
  const remaining = Math.max(0, activeDay.capacity - checkedIn);
  const peakFlow = Math.max(1, ...board.doorFlow.map((point) => point.count));

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Live Capacity</Text>
          <Text numberOfLines={1} style={styles.eventName}>{board.event.name}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.clock}>{formatClock(clock)}</Text>
          <Pressable accessibilityRole="button" onPress={resetPairing} style={styles.smallButton}>
            <Text style={styles.smallButtonText}>Re-pair</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.mainColumn}>
          <DayTabs days={board.days} activeDay={activeDay} onSelect={setDayIndex} />
          <View style={styles.capacityPanel}>
            <View style={styles.capacityNumbers}>
              <Text style={styles.capacityPercent}>{pct}%</Text>
              <View style={styles.capacitySide}>
                <Text style={styles.capacityLabel}>{activeDay.label}</Text>
                <Text style={styles.capacitySubcopy}>
                  {checkedIn.toLocaleString()} in / {activeDay.capacity.toLocaleString()} cap
                </Text>
              </View>
            </View>
            <View style={styles.capacityTrack}>
              <View
                style={[
                  styles.capacityFill,
                  { width: `${pct}%`, backgroundColor: capacityColor(snapshot?.threshold_breached, pct) },
                ]}
              />
            </View>
            <View style={styles.metricGrid}>
              <Metric label="Remaining" value={remaining.toLocaleString()} />
              <Metric label="Sold" value={sold.toLocaleString()} />
              <Metric label="Re-entry" value={reentries.toLocaleString()} />
            </View>
          </View>

          <View style={styles.flowPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Door Flow</Text>
              <Text style={styles.panelMeta}>Last 60 min</Text>
            </View>
            <View style={styles.flowChart}>
              {board.doorFlow.map((point) => (
                <View key={point.minute} style={styles.flowBarWrap}>
                  <View
                    style={[
                      styles.flowBar,
                      { height: `${Math.max(8, (point.count / peakFlow) * 100)}%` },
                    ]}
                  />
                  <Text style={styles.flowLabel}>{point.minute}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.sideColumn}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Recent Scans</Text>
            <Text style={styles.panelMeta}>{loading ? "Syncing" : "Live"}</Text>
          </View>
          <ScrollView style={styles.scanList} contentContainerStyle={styles.scanListContent}>
            {board.recentScans.length === 0 ? (
              <Text style={styles.emptyText}>No scans yet.</Text>
            ) : (
              board.recentScans.map((scan) => (
                <View key={scan.id} style={styles.scanRow}>
                  <View style={[styles.scanDot, { backgroundColor: scanColor(scan.result) }]} />
                  <View style={styles.scanBody}>
                    <Text style={styles.scanResult}>{scanLabel(scan.result)}</Text>
                    <Text style={styles.scanMeta}>
                      {formatScanTime(scan.created_at)} · {scan.source.replace(/_/g, " ")}
                    </Text>
                  </View>
                  <Text style={styles.scanEntry}>#{scan.entry_number}</Text>
                </View>
              ))
            )}
          </ScrollView>
          {error ? <Text style={styles.inlineError}>{error}</Text> : null}
        </View>
      </View>
    </View>
  );
}

function DayTabs({
  days,
  activeDay,
  onSelect,
}: {
  days: EventDayRow[];
  activeDay: EventDayRow;
  onSelect: (index: number) => void;
}) {
  if (days.length <= 1) {
    return <Text style={styles.singleDay}>{activeDay.label}</Text>;
  }

  return (
    <View style={styles.dayTabs}>
      {days.map((day, index) => {
        const active = day.id === activeDay.id;
        return (
          <Pressable
            accessibilityRole="button"
            key={day.id}
            onPress={() => onSelect(index)}
            style={[styles.dayTab, active && styles.dayTabActive]}
          >
            <Text style={[styles.dayTabText, active && styles.dayTabTextActive]}>{day.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function readStoredSession(): DisplaySession | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as DisplaySession;
    return isExpired(session.expires_at) ? null : session;
  } catch {
    return null;
  }
}

function writeStoredSession(session: DisplaySession) {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession() {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now() + 30_000;
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatScanTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function capacityColor(breach: string | null | undefined, pct: number) {
  if (breach === "alert" || pct >= 100) return "#EF4444";
  if (breach === "red" || pct >= 90) return "#F97316";
  if (breach === "yellow" || pct >= 75) return "#FACC15";
  return "#34C759";
}

function scanColor(result: string) {
  if (result === "success") return "#34C759";
  if (result === "already_scanned") return "#FACC15";
  return "#EF4444";
}

function scanLabel(result: string) {
  return result.replace(/_/g, " ");
}

const styles = StyleSheet.create({
  pairingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07100f",
    padding: 32,
  },
  pairingPanel: {
    width: "100%",
    maxWidth: 520,
    gap: 18,
    borderWidth: 1,
    borderColor: "#1f2f31",
    borderRadius: 8,
    backgroundColor: "#111819",
    padding: 28,
  },
  kicker: {
    color: "#34C759",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  pairingTitle: {
    color: "#f8fafc",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 0,
  },
  pairingCopy: {
    color: "#aeb8c4",
    fontSize: 16,
    lineHeight: 23,
  },
  codeInput: {
    minHeight: 68,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2b3a3d",
    backgroundColor: "#07100f",
    color: "#f8fafc",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 0,
    paddingHorizontal: 18,
    textAlign: "center",
  },
  labelInput: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2b3a3d",
    backgroundColor: "#07100f",
    color: "#f8fafc",
    fontSize: 17,
    paddingHorizontal: 16,
  },
  primaryButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#34C759",
  },
  primaryButtonText: {
    color: "#06110c",
    fontSize: 17,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 48,
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2b3a3d",
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.78,
  },
  buttonDisabled: {
    opacity: 0.42,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 14,
    lineHeight: 20,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    backgroundColor: "#07100f",
  },
  loadingText: {
    color: "#aeb8c4",
    fontSize: 17,
  },
  screen: {
    flex: 1,
    backgroundColor: "#07100f",
    padding: 22,
    gap: 20,
  },
  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  eventName: {
    maxWidth: 860,
    color: "#f8fafc",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 0,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  clock: {
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0,
  },
  smallButton: {
    minHeight: 36,
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2b3a3d",
    paddingHorizontal: 12,
  },
  smallButtonText: {
    color: "#aeb8c4",
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    gap: 18,
  },
  mainColumn: {
    flex: 1.8,
    gap: 18,
  },
  sideColumn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1f2f31",
    borderRadius: 8,
    backgroundColor: "#111819",
    padding: 18,
  },
  singleDay: {
    color: "#aeb8c4",
    fontSize: 18,
    fontWeight: "800",
  },
  dayTabs: {
    minHeight: 48,
    flexDirection: "row",
    gap: 10,
  },
  dayTab: {
    minHeight: 48,
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1f2f31",
    backgroundColor: "#111819",
    paddingHorizontal: 18,
  },
  dayTabActive: {
    borderColor: "#34C759",
    backgroundColor: "#14301f",
  },
  dayTabText: {
    color: "#aeb8c4",
    fontSize: 15,
    fontWeight: "800",
  },
  dayTabTextActive: {
    color: "#f8fafc",
  },
  capacityPanel: {
    flex: 1.1,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#1f2f31",
    borderRadius: 8,
    backgroundColor: "#111819",
    padding: 24,
    gap: 18,
  },
  capacityNumbers: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 24,
  },
  capacityPercent: {
    color: "#f8fafc",
    fontSize: 116,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 122,
  },
  capacitySide: {
    paddingBottom: 18,
  },
  capacityLabel: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0,
  },
  capacitySubcopy: {
    color: "#aeb8c4",
    fontSize: 19,
    marginTop: 5,
  },
  capacityTrack: {
    height: 44,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#243033",
  },
  capacityFill: {
    height: "100%",
    minWidth: 4,
  },
  metricGrid: {
    flexDirection: "row",
    gap: 12,
  },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1f2f31",
    borderRadius: 8,
    backgroundColor: "#07100f",
    padding: 16,
  },
  metricValue: {
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
  },
  metricLabel: {
    color: "#aeb8c4",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
  },
  flowPanel: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1f2f31",
    borderRadius: 8,
    backgroundColor: "#111819",
    padding: 18,
  },
  panelHeader: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  panelTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0,
  },
  panelMeta: {
    color: "#34C759",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  flowChart: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 18,
  },
  flowBarWrap: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  flowBar: {
    width: "100%",
    maxWidth: 42,
    minHeight: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: "#5DDCFF",
  },
  flowLabel: {
    color: "#778391",
    fontSize: 10,
    fontWeight: "700",
  },
  scanList: {
    flex: 1,
    marginTop: 12,
  },
  scanListContent: {
    gap: 10,
    paddingBottom: 6,
  },
  scanRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    backgroundColor: "#07100f",
    padding: 12,
  },
  scanDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  scanBody: {
    flex: 1,
    minWidth: 0,
  },
  scanResult: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  scanMeta: {
    color: "#778391",
    fontSize: 12,
    marginTop: 2,
    textTransform: "capitalize",
  },
  scanEntry: {
    color: "#aeb8c4",
    fontSize: 13,
    fontWeight: "800",
  },
  emptyText: {
    color: "#778391",
    fontSize: 15,
  },
  inlineError: {
    color: "#fca5a5",
    fontSize: 12,
    marginTop: 8,
  },
});
