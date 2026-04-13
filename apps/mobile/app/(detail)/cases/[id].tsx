import { CASE_STAGES } from "@eztrack/shared";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RequireLiveSession } from "@/components/auth/RequireLiveSession";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { HeaderEditButton, HeaderShareButton, HeaderMoreButton } from "@/navigation/header-buttons";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatCurrency,
  formatRelativeTimestamp,
  formatShortDateTime,
} from "@/lib/format";
import {
  useCaseAudit,
  useCaseCosts,
  useCaseDetail,
  useCaseEvidence,
  useCaseEvidenceTransfers,
  useCaseNarratives,
  useCaseRelatedRecords,
  useCaseResources,
  useCaseTasks,
  useDeleteCaseMutation,
  useUpdateCaseMutation,
  useUpdateCaseStatusMutation,
} from "@/lib/queries/cases";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const escalationOptions = ["none", "low", "medium", "high", "critical"];
const statuses = ["open", "on_hold", "closed"];

function CaseDetailContent({ caseId }: { caseId: string }) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);
  const router = useRouter();
  const detailQuery = useCaseDetail(caseId);
  const evidenceQuery = useCaseEvidence(caseId);
  const tasksQuery = useCaseTasks(caseId);
  const narrativesQuery = useCaseNarratives(caseId);
  const costsQuery = useCaseCosts(caseId);
  const relatedQuery = useCaseRelatedRecords(caseId);
  const transfersQuery = useCaseEvidenceTransfers(caseId);
  const auditQuery = useCaseAudit(caseId);
  const resourcesQuery = useCaseResources(caseId);
  const updateCaseMutation = useUpdateCaseMutation();
  const updateStatusMutation = useUpdateCaseStatusMutation();
  const deleteMutation = useDeleteCaseMutation();
  const record = detailQuery.data;

  if (!record) {
    return (
      <ScreenContainer subtitle="Loading detail" title="Case">
        <SectionCard title="Loading">
          <Text style={styles.copy}>The case detail is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  const currentStageIndex = Math.max(
    CASE_STAGES.findIndex((stage) => stage.key === record.stage),
    0
  );
  const currentStage = CASE_STAGES[currentStageIndex] ?? CASE_STAGES[0];
  const nextStage = CASE_STAGES[currentStageIndex + 1] ?? null;
  const selectedEscalation = record.escalationLevel ?? "none";

  return (
    <>
      <Stack.Screen options={{
        headerRight: () => (
          <NativeHeaderActionGroup>
            <HeaderEditButton onPress={() => {
              router.push({
                pathname: "/(create)/cases/new",
              });
            }} />
            <HeaderShareButton onPress={() => {
              router.push({
                pathname: "/(create)/cases/task/[id]",
                params: { id: record.id },
              });
            }} />
            <HeaderMoreButton onPress={() => {
              // TODO: wire to action menu
            }} />
          </NativeHeaderActionGroup>
        ),
      }} />
      <ScreenContainer
        onRefresh={() => {
          void Promise.all([
            detailQuery.refetch(),
            evidenceQuery.refetch(),
            tasksQuery.refetch(),
            narrativesQuery.refetch(),
            costsQuery.refetch(),
            relatedQuery.refetch(),
            transfersQuery.refetch(),
            auditQuery.refetch(),
            resourcesQuery.refetch(),
          ]);
        }}
      refreshing={
        detailQuery.isRefetching ||
        evidenceQuery.isRefetching ||
        tasksQuery.isRefetching ||
        narrativesQuery.isRefetching ||
        costsQuery.isRefetching ||
        relatedQuery.isRefetching ||
        transfersQuery.isRefetching ||
        auditQuery.isRefetching ||
        resourcesQuery.isRefetching
      }
      subtitle="Case detail backed by the same case, evidence, task, and audit tables as web."
      title={record.recordNumber}
    >
      <SectionCard subtitle={record.caseType} title="Overview">
        <View style={styles.stack}>
          <View style={styles.badges}>
            <StatusBadge status={record.status} />
            <PriorityBadge priority={record.escalationLevel ?? "none"} />
          </View>
          <Text style={styles.copy}>{record.synopsis ?? "No synopsis recorded."}</Text>
          <Text style={styles.meta}>
            Lead investigator {record.leadInvestigator?.fullName ?? "Unassigned"}
          </Text>
          <Text style={styles.meta}>
            Stage {currentStage.number}: {currentStage.label}
          </Text>
          <Text style={styles.meta}>Created {formatShortDateTime(record.createdAt)}</Text>
          <Text style={styles.meta}>Updated {formatRelativeTimestamp(record.updatedAt)}</Text>
          <View style={styles.actions}>
            {statuses.map((status) => (
              <Button
                key={status}
                label={status.replace(/_/g, " ")}
                loading={
                  updateStatusMutation.isPending &&
                  updateStatusMutation.variables?.status === status
                }
                onPress={() => {
                  void updateStatusMutation.mutateAsync({
                    id: record.id,
                    status,
                  });
                }}
                variant={record.status === status ? "primary" : "secondary"}
              />
            ))}
          </View>
          <View style={styles.actions}>
            <Button
              label="Create Briefing"
              onPress={() =>
                router.push({
                  pathname: "/briefings/new",
                  params: {
                    content: record.synopsis ?? "",
                    sourceModule: "cases",
                    title: `${record.recordNumber} briefing`,
                  },
                })
              }
              variant="secondary"
            />
            <Button
              label="Create Work Order"
              onPress={() =>
                router.push({
                  pathname: "/work-orders/new",
                  params: {
                    category: "security",
                    description: record.synopsis ?? "",
                    title: `Follow-up for ${record.recordNumber}`,
                  },
                })
              }
              variant="secondary"
            />
            <Button
              label="Delete Case"
              loading={deleteMutation.isPending}
              onPress={() => {
                Alert.alert("Delete case", "Remove this case from active views?", [
                  { style: "cancel", text: "Cancel" },
                  {
                    style: "destructive",
                    text: "Delete",
                    onPress: () => {
                      void deleteMutation.mutateAsync(record.id).then(() => {
                        router.back();
                      });
                    },
                  },
                ]);
              }}
              variant="plain"
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard
        subtitle={`Stage ${currentStage.number} of ${CASE_STAGES.length}`}
        title="Workflow"
      >
        <View style={styles.stack}>
          <Text style={styles.copy}>
            Current stage: {currentStage.label}
            {nextStage ? ` · Next: ${nextStage.label}` : " · Final stage reached"}
          </Text>
          <Button
            disabled={!nextStage}
            label={nextStage ? `Advance to ${nextStage.label}` : "Final Stage Reached"}
            loading={
              updateCaseMutation.isPending &&
              updateCaseMutation.variables?.fields.stage === nextStage?.key
            }
            onPress={() => {
              if (!nextStage) {
                return;
              }

              void updateCaseMutation.mutateAsync({
                fields: { stage: nextStage.key },
                id: record.id,
              });
            }}
            variant="secondary"
          />
          <View style={styles.field}>
            <Text style={styles.label}>Escalation level</Text>
            <FilterChips
              onSelect={(value) => {
                void updateCaseMutation.mutateAsync({
                  fields: {
                    escalation_level: value === "none" ? null : value,
                  },
                  id: record.id,
                });
              }}
              options={escalationOptions}
              selected={selectedEscalation}
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard subtitle={`${(resourcesQuery.data ?? []).length} resources`} title="Resources">
        <View style={styles.stack}>
          {(resourcesQuery.data ?? []).length ? (
            (resourcesQuery.data ?? []).map((resource) => (
              <View key={resource.id} style={styles.row}>
                <Text style={styles.rowTitle}>{resource.name}</Text>
                <Text style={styles.meta}>
                  {resource.role} · {resource.status} · {resource.hoursLogged}h
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No case resources have been added yet.</Text>
          )}
          <Button
            label="Add Resource"
            onPress={() =>
              router.push({
                pathname: "/cases/resource/[id]",
                params: { id: record.id },
              })
            }
            variant="secondary"
          />
        </View>
      </SectionCard>

      <SectionCard subtitle={`${(evidenceQuery.data ?? []).length} items`} title="Evidence">
        <View style={styles.stack}>
          {(evidenceQuery.data ?? []).map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.type} · {item.status} · {item.itemNumber ?? "No item #"}
              </Text>
              {item.description ? <Text style={styles.copy}>{item.description}</Text> : null}
              <Button
                label="Transfer Custody"
                onPress={() =>
                  router.push({
                    pathname: "/cases/transfer/[id]",
                    params: {
                      evidenceId: item.id,
                      evidenceTitle: item.title,
                      id: record.id,
                    },
                  })
                }
                variant="secondary"
              />
            </View>
          ))}
        </View>
        <Button
          label="Add Evidence"
          onPress={() =>
            router.push({
              pathname: "/cases/evidence/[id]",
              params: { id: record.id },
            })
          }
          variant="secondary"
        />
      </SectionCard>

      <SectionCard
        subtitle={`${(transfersQuery.data ?? []).length} transfer records`}
        title="Chain of Custody"
      >
        <View style={styles.stack}>
          {(transfersQuery.data ?? []).length ? (
            (transfersQuery.data ?? []).map((transfer) => (
              <View key={transfer.id} style={styles.row}>
                <Text style={styles.rowTitle}>{transfer.evidenceTitle}</Text>
                <Text style={styles.meta}>
                  {transfer.transferReason} · {transfer.evidenceItemNumber ?? "No item #"}
                </Text>
                <Text style={styles.copy}>
                  {transfer.transferredFromName ?? "Unknown"} →{" "}
                  {transfer.transferredToName ?? "Unknown"}
                </Text>
                {transfer.notes ? <Text style={styles.copy}>{transfer.notes}</Text> : null}
                <Text style={styles.meta}>{formatShortDateTime(transfer.transferDate)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No custody transfers have been recorded yet.</Text>
          )}
          <Button
            label="New Transfer"
            onPress={() =>
              router.push({
                pathname: "/cases/transfer/[id]",
                params: { id: record.id },
              })
            }
            variant="secondary"
          />
        </View>
      </SectionCard>

      <SectionCard subtitle={`${(tasksQuery.data ?? []).length} tasks`} title="Tasks">
        <View style={styles.stack}>
          {(tasksQuery.data ?? []).map((task) => (
            <View key={task.id} style={styles.row}>
              <Text style={styles.rowTitle}>{task.title}</Text>
              <Text style={styles.meta}>
                {task.priority} · {task.status} · {task.assignedToName ?? "Unassigned"}
              </Text>
              {task.description ? <Text style={styles.copy}>{task.description}</Text> : null}
            </View>
          ))}
        </View>
        <Button
          label="Add Task"
          onPress={() =>
            router.push({
              pathname: "/cases/task/[id]",
              params: { id: record.id },
            })
          }
          variant="secondary"
        />
      </SectionCard>

      <SectionCard subtitle={`${(narrativesQuery.data ?? []).length} entries`} title="Narratives">
        <View style={styles.stack}>
          {(narrativesQuery.data ?? []).map((entry) => (
            <View key={entry.id} style={styles.row}>
              <Text style={styles.rowTitle}>{entry.title}</Text>
              <Text style={styles.copy}>{entry.content}</Text>
              <Text style={styles.meta}>
                {entry.authorName ?? "Unknown"} · {formatShortDateTime(entry.createdAt)}
              </Text>
            </View>
          ))}
        </View>
        <Button
          label="Add Narrative"
          onPress={() =>
            router.push({
              pathname: "/cases/narrative/[id]",
              params: { id: record.id },
            })
          }
          variant="secondary"
        />
      </SectionCard>

      <SectionCard subtitle={`${(costsQuery.data ?? []).length} entries`} title="Financials">
        <View style={styles.stack}>
          {(costsQuery.data ?? []).map((entry) => (
            <View key={entry.id} style={styles.row}>
              <Text style={styles.rowTitle}>{entry.costType}</Text>
              <Text style={styles.meta}>{formatCurrency(entry.amount)}</Text>
              <Text style={styles.copy}>{entry.description}</Text>
            </View>
          ))}
        </View>
        <Button
          label="Add Cost"
          onPress={() =>
            router.push({
              pathname: "/cases/cost/[id]",
              params: { id: record.id },
            })
          }
          variant="secondary"
        />
      </SectionCard>

      <SectionCard subtitle={`${(relatedQuery.data ?? []).length} links`} title="Related Records">
        <View style={styles.stack}>
          {(relatedQuery.data ?? []).map((entry) => (
            <View key={entry.id} style={styles.row}>
              <Text style={styles.rowTitle}>{entry.relatedRecordType}</Text>
              <Text style={styles.meta}>{entry.relatedRecordId}</Text>
              {entry.relationshipDescription ? (
                <Text style={styles.copy}>{entry.relationshipDescription}</Text>
              ) : null}
            </View>
          ))}
        </View>
        <Button
          label="Link Record"
          onPress={() =>
            router.push({
              pathname: "/cases/related/[id]",
              params: { id: record.id },
            })
          }
          variant="secondary"
        />
      </SectionCard>

      <SectionCard subtitle={`${(auditQuery.data ?? []).length} events`} title="Audit Trail">
        <View style={styles.stack}>
          {(auditQuery.data ?? []).map((entry) => (
            <View key={entry.id} style={styles.row}>
              <Text style={styles.rowTitle}>{entry.action.replace(/_/g, " ")}</Text>
              {entry.details ? <Text style={styles.copy}>{entry.details}</Text> : null}
              <Text style={styles.meta}>
                {entry.actorName ?? "System"} · {formatShortDateTime(entry.createdAt)}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenContainer>
    </>
  );
}

export default function CaseDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const caseId = params.id ?? "";

  return (
    <RequireLiveSession
      detail="Case detail writes and subresources remain live-only until preview-safe hooks exist."
      title="Case"
    >
      <CaseDetailContent caseId={caseId} />
    </RequireLiveSession>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    badges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    copy: {
      color: colors.textSecondary,
      ...typography.subheadline,
    },
    field: {
      gap: 8,
    },
    label: {
      color: colors.textPrimary,
      ...typography.caption1,
      fontWeight: "600",
    },
    meta: {
      color: colors.textTertiary,
      ...typography.footnote,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      gap: 8,
      padding: layout.listItemPadding,
    },
    rowTitle: {
      color: colors.textPrimary,
      ...typography.subheadline,
      fontWeight: "700",
    },
    stack: {
      gap: 12,
    },
  });
}
