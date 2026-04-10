import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  useDeactivateUserMutation,
  useOrgUsers,
  useUpdateUserRoleMutation,
} from "@/lib/queries/settings";
import { useThemeColors } from "@/theme";

const roleOptions = [
  "super_admin",
  "admin",
  "manager",
  "supervisor",
  "dispatcher",
  "officer",
  "staff",
];

export default function UsersSettingsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const usersQuery = useOrgUsers();
  const updateRoleMutation = useUpdateUserRoleMutation();
  const deactivateMutation = useDeactivateUserMutation();

  return (
    <ScreenContainer
      onRefresh={() => {
        void usersQuery.refetch();
      }}
      refreshing={usersQuery.isRefetching}
      subtitle="Real role edit and deactivate flows for organization users."
      title="Users"
    >
      <SectionCard
        subtitle={usersQuery.isLoading ? "Loading users" : `${(usersQuery.data ?? []).length} users`}
        title="Organization users"
      >
        <View style={styles.stack}>
          {(usersQuery.data ?? []).map((user) => (
            <View key={user.id} style={styles.row}>
              <Text style={styles.title}>{user.fullName}</Text>
              <Text style={styles.meta}>{user.email}</Text>
              <Text style={styles.meta}>
                {user.status} · last login {user.lastLogin ?? "unknown"}
              </Text>
              <FilterChips
                onSelect={(value) => {
                  void updateRoleMutation.mutateAsync({
                    role: value,
                    userId: user.id,
                  });
                }}
                options={roleOptions}
                selected={user.role}
              />
              {user.status !== "inactive" ? (
                <Button
                  label="Deactivate"
                  loading={deactivateMutation.isPending && deactivateMutation.variables === user.id}
                  onPress={() => {
                    void deactivateMutation.mutateAsync(user.id);
                  }}
                  variant="secondary"
                />
              ) : null}
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
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
    stack: {
      gap: 14,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
