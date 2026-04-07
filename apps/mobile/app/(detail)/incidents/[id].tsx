import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatCurrency,
  formatRelativeTimestamp,
  formatShortDateTime,
} from "@/lib/format";
import {
  useIncidentDetail,
  useIncidentFinancials,
  useIncidentNarratives,
  useIncidentParticipants,
} from "@/lib/queries/incidents";
import { useThemeColors } from "@/theme";

export default function IncidentDetailScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const incidentId = params.id ?? "";
  const detailQuery = useIncidentDetail(incidentId);
  const narrativesQuery = useIncidentNarratives(incidentId);
  const participantsQuery = useIncidentParticipants(incidentId);
  const financialsQuery = useIncidentFinancials(incidentId);
  const incident = detailQuery.data;

  if (!incident) {
    return (
      <ScreenContainer subtitle="Loading incident detail" title="Incident">
        <SectionCard title="Loading">
          <Text style={styles.copy}>The incident detail is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroType}>{incident.type}</Text>
          <Text style={styles.heroSynopsis}>{incident.synopsis}</Text>
          <View style={styles.badges}>
            <PriorityBadge priority={incident.severity} />
            <StatusBadge status={incident.status} />
          </View>
        </MaterialSurface>
      }
      onRefresh={() => {
        void Promise.all([
          detailQuery.refetch(),
          narrativesQuery.refetch(),
          participantsQuery.refetch(),
          financialsQuery.refetch(),
        ]);
      }}
      refreshing={
        detailQuery.isRefetching ||
        narrativesQuery.isRefetching ||
        participantsQuery.isRefetching ||
        financialsQuery.isRefetching
      }
      subtitle="Incident detail synced from the same Supabase records as the web app."
      title={incident.recordNumber}
    >
      <SectionCard subtitle={incident.location} title={incident.type}>
        <View style={styles.stack}>
          <Text style={styles.copy}>{incident.description ?? incident.synopsis}</Text>
          <Text style={styles.meta}>Assigned to {incident.creatorName ?? "Unassigned"}</Text>
          <Text style={styles.meta}>Reported by {incident.reportedBy ?? "Unknown"}</Text>
          <Text style={styles.meta}>Created {formatShortDateTime(incident.createdAt)}</Text>
          <Text style={styles.meta}>Updated {formatRelativeTimestamp(incident.updatedAt)}</Text>
        </View>
      </SectionCard>

      <SectionCard subtitle={`${(narrativesQuery.data ?? []).length} entries`} title="Narratives">
        <View style={styles.stack}>
          {(narrativesQuery.data ?? []).length ? (
            (narrativesQuery.data ?? []).map((narrative) => (
              <View key={narrative.id} style={styles.row}>
                <Text style={styles.rowTitle}>{narrative.title}</Text>
                <Text style={styles.copy}>{narrative.content}</Text>
                <Text style={styles.meta}>
                  {narrative.authorName ?? "Unknown"} · {formatShortDateTime(narrative.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No narratives have been logged yet.</Text>
          )}
        </View>
      </SectionCard>

      <SectionCard subtitle={`${(participantsQuery.data ?? []).length} linked records`} title="Participants">
        <View style={styles.stack}>
          {(participantsQuery.data ?? []).length ? (
            (participantsQuery.data ?? []).map((participant) => (
              <View key={participant.id} style={styles.row}>
                <Text style={styles.rowTitle}>
                  {participant.firstName} {participant.lastName}
                </Text>
                <Text style={styles.meta}>
                  {participant.personType} · {participant.primaryRole}
                </Text>
                {participant.description ? <Text style={styles.copy}>{participant.description}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No participants are attached yet.</Text>
          )}
        </View>
      </SectionCard>

      <SectionCard subtitle={`${(financialsQuery.data ?? []).length} entries`} title="Financials">
        <View style={styles.stack}>
          {(financialsQuery.data ?? []).length ? (
            (financialsQuery.data ?? []).map((entry) => (
              <View key={entry.id} style={styles.row}>
                <View style={styles.rowBetween}>
                  <Text style={styles.rowTitle}>{entry.entryType.replace(/_/g, " ")}</Text>
                  <Text style={styles.amount}>{formatCurrency(entry.amount)}</Text>
                </View>
                {entry.description ? <Text style={styles.copy}>{entry.description}</Text> : null}
                <Text style={styles.meta}>
                  {entry.createdBy ?? "Unknown"} · {formatShortDateTime(entry.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No financial impact has been recorded.</Text>
          )}
          <Button label="Back to incidents" onPress={() => router.back()} variant="secondary" />
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    amount: {
      color: colors.accentSoft,
      fontSize: 14,
      fontWeight: "700",
    },
    badges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    copy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    hero: {
      gap: 10,
    },
    heroSynopsis: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "600",
      lineHeight: 24,
    },
    heroType: {
      color: colors.accentSoft,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 8,
      padding: 14,
    },
    rowBetween: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    rowTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    stack: {
      gap: 12,
    },
  });
}
