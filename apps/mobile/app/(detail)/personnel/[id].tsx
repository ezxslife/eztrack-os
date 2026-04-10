import { useLocalSearchParams } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatRelativeTimestamp,
  formatShortDateTime,
} from "@/lib/format";
import { usePersonnelDetail } from "@/lib/queries/personnel";
import { useThemeColors } from "@/theme";

export default function PersonnelDetailScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const params = useLocalSearchParams<{ id: string }>();
  const profileId = params.id ?? "";
  const detailQuery = usePersonnelDetail(profileId);
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
      }}
      refreshing={detailQuery.isRefetching}
      subtitle="Read-only personnel detail backed by the profiles table."
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
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
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
