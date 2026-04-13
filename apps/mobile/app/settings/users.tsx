import { useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  USER_ROLE_OPTIONS,
  formatRoleLabel,
  mapStaffRoleToUiRole,
  type InviteUserPayload,
} from "@eztrack/shared";

import { RequireLiveSession } from "@/components/auth/RequireLiveSession";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SearchField } from "@/components/ui/SearchField";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TextField } from "@/components/ui/TextField";
import {
  useDeactivateUserMutation,
  useInviteOrgUserMutation,
  useOrgUsers,
  useResendInviteMutation,
  useUpdateUserRoleMutation,
} from "@/lib/queries/settings";
import { useToast } from "@/providers/ToastProvider";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const roleLabels = USER_ROLE_OPTIONS.map((option) => option.label);

function getRoleLabel(value: string) {
  return USER_ROLE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function getRoleValue(label: string) {
  return USER_ROLE_OPTIONS.find((option) => option.label === label)?.value ?? label;
}

const emptyInviteDraft: InviteUserPayload = {
  email: "",
  firstName: "",
  lastName: "",
  role: USER_ROLE_OPTIONS[5]?.value ?? "staff",
  sendWelcomeEmail: true,
};

function UsersSettingsContent() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography);
  const { showToast } = useToast();
  const usersQuery = useOrgUsers();
  const updateRoleMutation = useUpdateUserRoleMutation();
  const deactivateMutation = useDeactivateUserMutation();
  const inviteMutation = useInviteOrgUserMutation();
  const resendInviteMutation = useResendInviteMutation();
  const [search, setSearch] = useState("");
  const [inviteDraft, setInviteDraft] = useState<InviteUserPayload>(emptyInviteDraft);
  const [inviteRoleLabel, setInviteRoleLabel] = useState(
    getRoleLabel(emptyInviteDraft.role)
  );
  const users = usersQuery.data ?? [];

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) =>
      [user.fullName, user.email, formatRoleLabel(user.role)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    );
  }, [search, users]);

  const handleInvite = async () => {
    if (!inviteDraft.email.trim() || !inviteDraft.firstName.trim()) {
      Alert.alert(
        "Invite details required",
        "Email and first name are required before sending an invite."
      );
      return;
    }

    try {
      await inviteMutation.mutateAsync({
        ...inviteDraft,
        email: inviteDraft.email.trim().toLowerCase(),
        firstName: inviteDraft.firstName.trim(),
        lastName: inviteDraft.lastName.trim(),
      });
      setInviteDraft(emptyInviteDraft);
      setInviteRoleLabel(getRoleLabel(emptyInviteDraft.role));
      showToast({
        message: "The invite request has been sent to the live user-management API.",
        title: "User invited",
        tone: "success",
      });
    } catch (error) {
      Alert.alert(
        "Invite failed",
        error instanceof Error ? error.message : "Could not invite the user."
      );
    }
  };

  return (
    <ScreenContainer
      gutter="none"
      onRefresh={() => {
        void usersQuery.refetch();
      }}
      refreshing={usersQuery.isRefetching}
      subtitle="Search, invite, role-edit, resend, and deactivate users from the live organization roster."
      title="Users"
    >
      <View style={[styles.section, { paddingHorizontal: layout.horizontalPadding }]}>
        <SectionHeader title="Invite User" />
        <GroupedCard>
          <View style={styles.stack}>
            <TextField
              autoCapitalize="words"
              label="First Name"
              onChangeText={(value) =>
                setInviteDraft((current) => ({ ...current, firstName: value }))
              }
              placeholder="Jamie"
              value={inviteDraft.firstName}
            />
            <TextField
              autoCapitalize="words"
              label="Last Name"
              onChangeText={(value) =>
                setInviteDraft((current) => ({ ...current, lastName: value }))
              }
              placeholder="Rivera"
              value={inviteDraft.lastName}
            />
            <TextField
              autoCapitalize="none"
              keyboardType="email-address"
              label="Email"
              onChangeText={(value) =>
                setInviteDraft((current) => ({ ...current, email: value }))
              }
              placeholder="jamie@example.com"
              value={inviteDraft.email}
            />
            <View style={styles.field}>
              <Text style={[styles.label, typography.caption1]}>Role</Text>
              <FilterChips
                onSelect={(label) => {
                  setInviteRoleLabel(label);
                  setInviteDraft((current) => ({
                    ...current,
                    role: getRoleValue(label),
                  }));
                }}
                options={roleLabels}
                selected={inviteRoleLabel}
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.meta, typography.footnote]}>
                Welcome email: {inviteDraft.sendWelcomeEmail ? "enabled" : "disabled"}
              </Text>
              <Button
                label={inviteDraft.sendWelcomeEmail ? "Send Welcome Email" : "Create Active User"}
                loading={inviteMutation.isPending}
                onPress={() => {
                  void handleInvite();
                }}
              />
              <Button
                label={
                  inviteDraft.sendWelcomeEmail
                    ? "Switch To Direct Create"
                    : "Switch To Email Invite"
                }
                onPress={() =>
                  setInviteDraft((current) => ({
                    ...current,
                    sendWelcomeEmail: !current.sendWelcomeEmail,
                  }))
                }
                variant="secondary"
              />
            </View>
          </View>
        </GroupedCard>
      </View>

      <View style={[styles.section, { paddingHorizontal: layout.horizontalPadding }]}>
        <SectionHeader
          title="Organization Users"
          count={usersQuery.isLoading ? undefined : filteredUsers.length}
        />
        <GroupedCard>
          <View style={styles.stack}>
            <View style={styles.searchWrapper}>
              <SearchField
                onChangeText={setSearch}
                placeholder="Search name, email, or role"
                value={search}
              />
            </View>
            {filteredUsers.length ? (
              filteredUsers.map((user, index) => {
                const uiRole = mapStaffRoleToUiRole(user.role);
                const selectedRoleLabel = getRoleLabel(uiRole);
                const isInvited = user.status === "invited";
                const isLastItem = index === filteredUsers.length - 1;

                return (
                  <View key={user.id}>
                    <View style={styles.userItem}>
                      <Text style={[styles.userName, typography.subheadline]}>
                        {user.fullName}
                      </Text>
                      <Text style={[styles.meta, typography.footnote]}>
                        {user.email}
                      </Text>
                      <Text style={[styles.meta, typography.footnote]}>
                        {formatRoleLabel(user.role)} · {user.status} · last login{" "}
                        {user.lastLogin ?? "unknown"}
                      </Text>
                      <FilterChips
                        onSelect={(label) => {
                          void updateRoleMutation.mutateAsync({
                            role: getRoleValue(label),
                            userId: user.id,
                          });
                        }}
                        options={roleLabels}
                        selected={selectedRoleLabel}
                      />
                      <View style={styles.actions}>
                        {isInvited ? (
                          <Button
                            label="Resend Invite"
                            loading={
                              resendInviteMutation.isPending &&
                              resendInviteMutation.variables?.email === user.email
                            }
                            onPress={() => {
                              const [firstName = "", ...rest] = user.fullName.split(" ");
                              void resendInviteMutation
                                .mutateAsync({
                                  email: user.email,
                                  firstName,
                                  lastName: rest.join(" "),
                                  role: uiRole,
                                  sendWelcomeEmail: true,
                                })
                                .then(() => {
                                  showToast({
                                    message: `A fresh invite email was requested for ${user.email}.`,
                                    title: "Invite resent",
                                    tone: "success",
                                  });
                                })
                                .catch((error) => {
                                  Alert.alert(
                                    "Resend failed",
                                    error instanceof Error
                                      ? error.message
                                      : "Could not resend the invitation."
                                  );
                                });
                            }}
                            variant="secondary"
                          />
                        ) : null}
                        {user.status !== "inactive" ? (
                          <Button
                            label="Deactivate"
                            loading={
                              deactivateMutation.isPending &&
                              deactivateMutation.variables === user.id
                            }
                            onPress={() => {
                              Alert.alert(
                                "Deactivate user",
                                `Set ${user.fullName} to inactive?`,
                                [
                                  { style: "cancel", text: "Cancel" },
                                  {
                                    style: "destructive",
                                    text: "Deactivate",
                                    onPress: () => {
                                      void deactivateMutation
                                        .mutateAsync(user.id)
                                        .then(() => {
                                          showToast({
                                            message: `${user.fullName} is now inactive.`,
                                            title: "User updated",
                                            tone: "success",
                                          });
                                        })
                                        .catch((error) => {
                                          Alert.alert(
                                            "Deactivate failed",
                                            error instanceof Error
                                              ? error.message
                                              : "Could not deactivate the user."
                                          );
                                        });
                                    },
                                  },
                                ]
                              );
                            }}
                            variant="plain"
                          />
                        ) : null}
                      </View>
                    </View>
                    {!isLastItem ? <GroupedCardDivider /> : null}
                  </View>
                );
              })
            ) : (
              <Text style={[styles.emptyState, typography.footnote]}>
                No users match the current search.
              </Text>
            )}
          </View>
        </GroupedCard>
      </View>
    </ScreenContainer>
  );
}

export default function UsersSettingsScreen() {
  return (
    <RequireLiveSession
      detail="User invite and roster management are live-only because mobile now talks to the authenticated settings API."
      title="Users"
    >
      <UsersSettingsContent />
    </RequireLiveSession>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>
) {
  return StyleSheet.create({
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    emptyState: {
      color: colors.textTertiary,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    field: {
      gap: 8,
    },
    label: {
      color: colors.textPrimary,
      fontWeight: "600",
    },
    meta: {
      color: colors.textTertiary,
      lineHeight: 18,
    },
    searchWrapper: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    section: {
      gap: 12,
    },
    stack: {
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    userName: {
      color: colors.textPrimary,
      fontWeight: "700",
    },
    userItem: {
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
  });
}
