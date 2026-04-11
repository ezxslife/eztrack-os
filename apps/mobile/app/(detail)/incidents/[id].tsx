import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
  useDeleteIncidentShareMutation,
  useDeleteIncidentMediaMutation,
  useDeleteIncidentMutation,
  useIncidentDetail,
  useIncidentFinancials,
  useIncidentForms,
  useIncidentMedia,
  useIncidentNarratives,
  useIncidentParticipants,
  useIncidentDocLog,
  useIncidentRelatedIncidents,
  useIncidentShares,
  useDeleteRelatedIncidentMutation,
  useSetIncidentLockStateMutation,
} from "@/lib/queries/incidents";
import { useNetworkStore } from "@/stores/network-store";
import { useThemeColors } from "@/theme";

function formatBytes(value?: number | null) {
  if (!value) {
    return "Unknown size";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function describeFormPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "No form payload stored.";
  }

  const record = payload as Record<string, unknown>;
  const summary = typeof record.summary === "string" ? record.summary : "";
  const details = typeof record.details === "string" ? record.details : "";

  return [summary, details].filter(Boolean).join(" ").trim() || "No form payload stored.";
}

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
  const relatedQuery = useIncidentRelatedIncidents(incidentId);
  const sharesQuery = useIncidentShares(incidentId);
  const mediaQuery = useIncidentMedia(incidentId);
  const formsQuery = useIncidentForms(incidentId);
  const docLogQuery = useIncidentDocLog(incidentId);
  const deleteMediaMutation = useDeleteIncidentMediaMutation();
  const deleteShareMutation = useDeleteIncidentShareMutation();
  const deleteRelatedMutation = useDeleteRelatedIncidentMutation();
  const lockMutation = useSetIncidentLockStateMutation();
  const deleteMutation = useDeleteIncidentMutation();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const incident = detailQuery.data;
  const canUseLiveActions = incident?.status !== "queued" && isOnline;

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
          relatedQuery.refetch(),
          sharesQuery.refetch(),
          mediaQuery.refetch(),
          formsQuery.refetch(),
          docLogQuery.refetch(),
        ]);
      }}
      refreshing={
        detailQuery.isRefetching ||
        narrativesQuery.isRefetching ||
        participantsQuery.isRefetching ||
        financialsQuery.isRefetching ||
        relatedQuery.isRefetching ||
        sharesQuery.isRefetching ||
        mediaQuery.isRefetching ||
        formsQuery.isRefetching ||
        docLogQuery.isRefetching
      }
      subtitle="Incident details, activity, and supporting records."
      title={incident.recordNumber}
    >
      <SectionCard subtitle={incident.location} title={incident.type}>
        <View style={styles.stack}>
          <Text style={styles.copy}>{incident.description ?? incident.synopsis}</Text>
          <Text style={styles.meta}>Assigned to {incident.creatorName ?? "Unassigned"}</Text>
          <Text style={styles.meta}>Reported by {incident.reportedBy ?? "Unknown"}</Text>
          <Text style={styles.meta}>Created {formatShortDateTime(incident.createdAt)}</Text>
          <Text style={styles.meta}>Updated {formatRelativeTimestamp(incident.updatedAt)}</Text>
          {incident.status !== "queued" ? (
            <Button
              label="Edit Incident"
              onPress={() =>
                router.push({
                  pathname: "/incidents/edit/[id]",
                  params: { id: incident.id },
                })
              }
              variant="secondary"
            />
          ) : (
            <Text style={styles.meta}>
              Queued incidents can be edited after the initial sync completes.
            </Text>
          )}
          <View style={styles.actions}>
            <Button
              disabled={!canUseLiveActions}
              label="Transfer Ownership"
              onPress={() =>
                router.push({
                  pathname: "/incidents/transfer/[id]",
                  params: { id: incident.id },
                })
              }
              variant="secondary"
            />
            <Button
              disabled={!canUseLiveActions}
              label={incident.status === "closed" ? "Unlock Incident" : "Lock Incident"}
              loading={lockMutation.isPending}
              onPress={() => {
                Alert.alert(
                  incident.status === "closed" ? "Unlock incident" : "Lock incident",
                  incident.status === "closed"
                    ? "Re-open this incident for active work?"
                    : "Lock this incident by moving it to closed status?",
                  [
                    { style: "cancel", text: "Cancel" },
                    {
                      text: incident.status === "closed" ? "Unlock" : "Lock",
                      onPress: () => {
                        void lockMutation.mutateAsync({
                          id: incident.id,
                          locked: incident.status !== "closed",
                        });
                      },
                    },
                  ]
                );
              }}
              variant="secondary"
            />
            <Button
              disabled={!canUseLiveActions}
              label="Delete Incident"
              loading={deleteMutation.isPending}
              onPress={() => {
                Alert.alert(
                  "Delete incident",
                  "Remove this incident from active views?",
                  [
                    { style: "cancel", text: "Cancel" },
                    {
                      style: "destructive",
                      text: "Delete",
                      onPress: () => {
                        void deleteMutation.mutateAsync(incident.id).then(() => {
                          router.replace("/incidents");
                        });
                      },
                    },
                  ]
                );
              }}
              variant="plain"
            />
          </View>
          {!isOnline ? (
            <Text style={styles.meta}>
              Sharing, linking, media, transfer, lock, and delete controls require connectivity.
            </Text>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard
        footer={
          incident.status !== "queued" ? (
            <Button
              label="Add Narrative"
              onPress={() =>
                router.push({
                  pathname: "/incidents/narrative/[id]",
                  params: { id: incident.id },
                })
              }
              variant="secondary"
            />
          ) : undefined
        }
        subtitle={`${(narrativesQuery.data ?? []).length} entries`}
        title="Narratives"
      >
        <View style={styles.stack}>
          {(narrativesQuery.data ?? []).length ? (
            (narrativesQuery.data ?? []).map((narrative) => (
              <View key={narrative.id} style={styles.row}>
                <Text style={styles.rowTitle}>{narrative.title}</Text>
                <Text style={styles.copy}>{narrative.content}</Text>
                <Text style={styles.meta}>
                  {narrative.authorName ?? "Unknown"} · {formatShortDateTime(narrative.createdAt)}
                </Text>
                {narrative.authorName === "Queued for sync" ? (
                  <Text style={styles.queuedMeta}>Queued narrative pending sync</Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.copy}>
              {incident.status === "queued"
                ? "Narratives can be added after the incident syncs for the first time."
                : "No narratives have been logged yet."}
            </Text>
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
          {incident.status !== "queued" ? (
            <Button
              label="Add Participant"
              disabled={!isOnline}
              onPress={() =>
                router.push({
                  pathname: "/incidents/participant/[id]",
                  params: { id: incident.id },
                })
              }
              variant="secondary"
            />
          ) : null}
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
          {incident.status !== "queued" ? (
            <Button
              label="Add Financial Entry"
              disabled={!isOnline}
              onPress={() =>
                router.push({
                  pathname: "/incidents/financial/[id]",
                  params: { id: incident.id },
                })
              }
              variant="secondary"
            />
          ) : null}
        </View>
      </SectionCard>

      <SectionCard
        subtitle={`${(mediaQuery.data ?? []).length} files`}
        title="Media"
      >
        <View style={styles.stack}>
          {(mediaQuery.data ?? []).length ? (
            (mediaQuery.data ?? []).map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowBetween}>
                  <Text style={styles.rowTitle}>{item.title ?? item.fileName}</Text>
                  <Button
                    disabled={!isOnline}
                    label="Delete"
                    loading={
                      deleteMediaMutation.isPending &&
                      deleteMediaMutation.variables?.id === item.id
                    }
                    onPress={() => {
                      Alert.alert("Delete media", "Remove this file from the incident?", [
                        { style: "cancel", text: "Cancel" },
                        {
                          style: "destructive",
                          text: "Delete",
                          onPress: () => {
                            void deleteMediaMutation.mutateAsync({
                              id: item.id,
                              incidentId: incident.id,
                            });
                          },
                        },
                      ]);
                    }}
                    variant="plain"
                  />
                </View>
                <Text style={styles.meta}>
                  {item.mediaType ?? "document"} · {item.fileName} · {formatBytes(item.fileSize)}
                </Text>
                {item.description ? <Text style={styles.copy}>{item.description}</Text> : null}
                <Text style={styles.meta}>
                  {item.uploadedByName ?? "Unknown"} · {formatShortDateTime(item.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No media is attached to this incident yet.</Text>
          )}
          <Button
            disabled={!canUseLiveActions}
            label="Add Media"
            onPress={() =>
              router.push({
                pathname: "/incidents/media/[id]",
                params: { id: incident.id },
              })
            }
            variant="secondary"
          />
        </View>
      </SectionCard>

      <SectionCard
        subtitle={`${(relatedQuery.data ?? []).length} linked incidents`}
        title="Related Incidents"
      >
        <View style={styles.stack}>
          {(relatedQuery.data ?? []).length ? (
            (relatedQuery.data ?? []).map((entry) => (
              <View key={entry.id} style={styles.row}>
                <View style={styles.rowBetween}>
                  <Text style={styles.rowTitle}>{entry.recordNumber}</Text>
                  <Button
                    disabled={!isOnline}
                    label="Unlink"
                    loading={
                      deleteRelatedMutation.isPending &&
                      deleteRelatedMutation.variables?.id === entry.id
                    }
                    onPress={() => {
                      Alert.alert(
                        "Unlink incident",
                        "Remove this related-incident connection?",
                        [
                          { style: "cancel", text: "Cancel" },
                          {
                            style: "destructive",
                            text: "Unlink",
                            onPress: () => {
                              void deleteRelatedMutation.mutateAsync({
                                id: entry.id,
                                incidentId: incident.id,
                              });
                            },
                          },
                        ]
                      );
                    }}
                    variant="plain"
                  />
                </View>
                <Text style={styles.meta}>
                  {entry.relationshipType} · {entry.type} · {entry.status}
                </Text>
                {entry.reason ? <Text style={styles.copy}>{entry.reason}</Text> : null}
                <Text style={styles.meta}>
                  {entry.linkedBy ?? "Unknown"} · {formatShortDateTime(entry.linkedAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No related incidents are linked yet.</Text>
          )}
          <Button
            disabled={!canUseLiveActions}
            label="Link Incident"
            onPress={() =>
              router.push({
                pathname: "/incidents/link/[id]",
                params: { id: incident.id },
              })
            }
            variant="secondary"
          />
        </View>
      </SectionCard>

      <SectionCard
        subtitle={`${(sharesQuery.data ?? []).length} access grants`}
        title="Sharing"
      >
        <View style={styles.stack}>
          {(sharesQuery.data ?? []).length ? (
            (sharesQuery.data ?? []).map((share) => (
              <View key={share.id} style={styles.row}>
                <View style={styles.rowBetween}>
                  <Text style={styles.rowTitle}>{share.sharedWithName ?? "Unknown"}</Text>
                  <Button
                    disabled={!isOnline}
                    label="Revoke"
                    loading={
                      deleteShareMutation.isPending &&
                      deleteShareMutation.variables?.id === share.id
                    }
                    onPress={() => {
                      Alert.alert("Revoke share", "Remove this access grant?", [
                        { style: "cancel", text: "Cancel" },
                        {
                          style: "destructive",
                          text: "Revoke",
                          onPress: () => {
                            void deleteShareMutation.mutateAsync({
                              id: share.id,
                              incidentId: incident.id,
                            });
                          },
                        },
                      ]);
                    }}
                    variant="plain"
                  />
                </View>
                <Text style={styles.meta}>
                  {share.permissionLevel} · {share.sharedWithRole ?? "direct user access"}
                </Text>
                <Text style={styles.meta}>
                  Shared by {share.sharedByName ?? "Unknown"} · {formatShortDateTime(share.sharedAt)}
                </Text>
                <Text style={share.isExpired ? styles.expiredMeta : styles.meta}>
                  {share.isExpired
                    ? `Expired ${share.expiresAt ? formatShortDateTime(share.expiresAt) : ""}`
                    : `Expires ${share.expiresAt ? formatShortDateTime(share.expiresAt) : "never"}`}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No access grants are attached to this incident.</Text>
          )}
          <Button
            disabled={!canUseLiveActions}
            label="Share Access"
            onPress={() =>
              router.push({
                pathname: "/incidents/share/[id]",
                params: { id: incident.id },
              })
            }
            variant="secondary"
          />
          <Button
            label="Back to incidents"
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>
      </SectionCard>

      <SectionCard
        subtitle={`${(formsQuery.data ?? []).length} supplemental forms`}
        title="Forms"
      >
        <View style={styles.stack}>
          {(formsQuery.data ?? []).length ? (
            (formsQuery.data ?? []).map((form) => (
              <View key={form.id} style={styles.row}>
                <View style={styles.rowBetween}>
                  <Text style={styles.rowTitle}>{form.formType.replace(/_/g, " ")}</Text>
                  <Button
                    disabled={!canUseLiveActions}
                    label={form.completedAt ? "Edit" : "Complete"}
                    onPress={() =>
                      router.push({
                        pathname: "/incidents/form/[id]",
                        params: {
                          formId: form.id,
                          id: incident.id,
                        },
                      })
                    }
                    variant="plain"
                  />
                </View>
                <Text style={styles.meta}>
                  {form.isOfficial ? "Official" : "Supplemental"} ·{" "}
                  {form.completedAt
                    ? `Completed ${formatShortDateTime(form.completedAt)}`
                    : `Created ${formatShortDateTime(form.createdAt)}`}
                </Text>
                {form.completedByName ? (
                  <Text style={styles.meta}>Completed by {form.completedByName}</Text>
                ) : null}
                <Text style={styles.copy}>{describeFormPayload(form.formData).slice(0, 180)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No supplemental forms are attached yet.</Text>
          )}
          <Button
            disabled={!canUseLiveActions}
            label="Add Form"
            onPress={() =>
              router.push({
                pathname: "/incidents/form/[id]",
                params: { id: incident.id },
              })
            }
            variant="secondary"
          />
          <Text style={styles.meta}>
            Add or complete the forms your team needs for this incident. Updates stay in sync
            across the case record.
          </Text>
        </View>
      </SectionCard>

      <SectionCard
        subtitle={`${(docLogQuery.data ?? []).length} activity events`}
        title="Document Log"
      >
        <View style={styles.stack}>
          {(docLogQuery.data ?? []).length ? (
            (docLogQuery.data ?? []).map((entry) => (
              <View key={entry.id} style={styles.row}>
                <Text style={styles.rowTitle}>{entry.action.replace(/_/g, " ")}</Text>
                {entry.details ? <Text style={styles.copy}>{entry.details}</Text> : null}
                <Text style={styles.meta}>
                  {entry.actorName ?? "System"} · {formatShortDateTime(entry.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No document-log activity has been recorded yet.</Text>
          )}
        </View>
      </SectionCard>

      <SectionCard subtitle="Related records linked to this incident." title="Attached Records">
        <View style={styles.stack}>
          <Text style={styles.copy}>Additional linked records will appear here as they are attached.</Text>
          <Text style={styles.meta}>
            Check back here to review everything connected to this incident in one place.
          </Text>
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
    expiredMeta: {
      color: colors.warning,
      fontSize: 13,
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
      backgroundColor: colors.surfaceTintMedium,
      borderColor: colors.borderLight,
      borderRadius: 18,
      borderWidth: 1,
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
    queuedMeta: {
      color: colors.accentSoft,
      fontSize: 12,
      fontWeight: "600",
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    stack: {
      gap: 12,
    },
  });
}
