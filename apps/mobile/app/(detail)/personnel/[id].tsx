import { useLocalSearchParams } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RequireLiveSession } from "@/components/auth/RequireLiveSession";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatRelativeTimestamp,
  formatShortDateTime,
} from "@/lib/format";
import {
  usePersonnelActivity,
  usePersonnelDetail,
} from "@/lib/queries/personnel";
import { useThemeColors } from "@/theme";

function PersonnelDetailContent() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const params = useLocalSearchParams<{ id: string }>();
  const profileId = params.id ?? "";
  const detailQuery = usePersonnelDetail(profileId);
  const activityQuery = usePersonnelActivity(profileId);
  const person = detailQuery.data;

  if (!person) {
    return (
      <ScreenContainer subtitle="Loading detail" title="Personnel">
        <SectionCard title="Loading">
          <Text style={styles.copy}>The personnel detail is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      onRefresh={() => {
        void detailQuery.refetch();
        void activityQuery.refetch();
      }}
      refreshing={detailQuery.isRefetching || activityQuery.isRefetching}
      subtitle="Read-only personnel profile plus recent activity history."
      title={person.fullName}
    >
      <SectionCard title="Profile">
        <View style={styles.stack}>
          <StatusBadge status={person.status} />
          <Text style={styles.copy}>Role: {person.role}</Text>
          <Text style={styles.copy}>Email: {person.email ?? "Unavailable"}</Text>
          <Text style={styles.copy}>Phone: {person.phone ?? "Unavailable"}</Text>
          <Text style={styles.meta}>Created {formatShortDateTime(person.createdAt)}</Text>
          <Text style={styles.meta}>Updated {formatRelativeTimestamp(person.updatedAt)}</Text>
        </View>
      </SectionCard>

      <SectionCard
        subtitle={
          activityQuery.isLoading
            ? "Loading recent activity"
            : `${(activityQuery.data ?? []).length} recent events`
        }
        title="Activity"
      >
        <View style={styles.stack}>
          {(activityQuery.data ?? []).length ? (
            activityQuery.data?.map((entry) => (
              <View key={entry.id} style={styles.activityRow}>
                <Text style={styles.copy}>{entry.action}</Text>
                <Text style={styles.meta}>{formatRelativeTimestamp(entry.createdAt)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.meta}>
              Recent personnel actions and status changes will appear here.
            </Text>
          )}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

export default function PersonnelDetailScreen() {
  return (
    <RequireLiveSession
      detail="Personnel detail and activity history are live-only because they read profile and activity-log records directly."
      title="Personnel"
    >
      <PersonnelDetailContent />
    </RequireLiveSession>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    activityRow: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 6,
      padding: 14,
    },
    copy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    stack: {
      gap: 12,
    },
  });
}
