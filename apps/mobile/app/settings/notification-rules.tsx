import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TextField } from "@/components/ui/TextField";
import { GlassSwitch } from "@/components/ui/glass/GlassSwitch";
import {
  useCreateNotificationRuleMutation,
  useDeleteNotificationRuleMutation,
  useNotificationRules,
  useUpdateNotificationRuleMutation,
} from "@/lib/queries/settings";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function NotificationRulesScreen() {
  const colors = useThemeColors();
  const layout = useAdaptiveLayout();
  const typography = useThemeTypography();
  const styles = createStyles(colors, layout, typography);
  const rulesQuery = useNotificationRules();
  const createMutation = useCreateNotificationRuleMutation();
  const updateMutation = useUpdateNotificationRuleMutation();
  const deleteMutation = useDeleteNotificationRuleMutation();
  const [event, setEvent] = useState("");
  const [description, setDescription] = useState("");
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);
  const [sms, setSms] = useState(false);

  return (
    <ScreenContainer
      gutter="none"
      onRefresh={() => {
        void rulesQuery.refetch();
      }}
      refreshing={rulesQuery.isRefetching}
      subtitle="Real notification rule CRUD using the existing org-level table."
      title="Notification Rules"
    >
      <View style={[styles.section, { paddingHorizontal: layout.horizontalPadding }]}>
        <SectionHeader title="New rule" />
        <GroupedCard>
          <View style={styles.stack}>
            <TextField label="Event" onChangeText={setEvent} value={event} />
            <TextField
              label="Description"
              multiline
              numberOfLines={3}
              onChangeText={setDescription}
              value={description}
            />
            <SwitchRow label="Push" value={push} onToggle={setPush} />
            <SwitchRow label="Email" value={email} onToggle={setEmail} />
            <SwitchRow label="SMS" value={sms} onToggle={setSms} />
            <Button
              label="Create Rule"
              loading={createMutation.isPending}
              onPress={() => {
                void createMutation
                  .mutateAsync({
                    description,
                    email,
                    event,
                    push,
                    sms,
                  })
                  .then(() => {
                    setDescription("");
                    setEmail(false);
                    setEvent("");
                    setPush(true);
                    setSms(false);
                  });
              }}
            />
          </View>
        </GroupedCard>
      </View>

      <View style={[styles.section, { paddingHorizontal: layout.horizontalPadding }]}>
        <SectionHeader title="Current rules" />
        <GroupedCard>
          {(rulesQuery.data ?? []).map((rule, index) => (
            <View key={rule.id}>
              <View style={styles.ruleContainer}>
                <Text style={styles.ruleTitle}>{rule.event}</Text>
                <Text style={styles.ruleMeta}>{rule.description ?? "No description"}</Text>
                <SwitchRow
                  label="Push"
                  onToggle={(value) => {
                    void updateMutation.mutateAsync({
                      id: rule.id,
                      push: value,
                    });
                  }}
                  value={rule.push}
                />
                <SwitchRow
                  label="Email"
                  onToggle={(value) => {
                    void updateMutation.mutateAsync({
                      email: value,
                      id: rule.id,
                    });
                  }}
                  value={rule.email}
                />
                <SwitchRow
                  label="SMS"
                  onToggle={(value) => {
                    void updateMutation.mutateAsync({
                      id: rule.id,
                      sms: value,
                    });
                  }}
                  value={rule.sms}
                />
                <Button
                  label="Delete"
                  loading={deleteMutation.isPending && deleteMutation.variables === rule.id}
                  onPress={() => {
                    Alert.alert("Delete rule", "Remove this notification rule?", [
                      { style: "cancel", text: "Cancel" },
                      {
                        style: "destructive",
                        text: "Delete",
                        onPress: () => {
                          void deleteMutation.mutateAsync(rule.id);
                        },
                      },
                    ]);
                  }}
                  variant="plain"
                />
              </View>
              {index < (rulesQuery.data ?? []).length - 1 && <GroupedCardDivider />}
            </View>
          ))}
        </GroupedCard>
      </View>
    </ScreenContainer>
  );
}

function SwitchRow({
  label,
  onToggle,
  value,
}: {
  label: string;
  onToggle: (value: boolean) => void;
  value: boolean;
}) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = StyleSheet.create({
    label: {
      ...typography.subheadline,
      color: colors.textPrimary,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
  });

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <GlassSwitch onToggle={onToggle} value={value} />
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>,
  typography: ReturnType<typeof useThemeTypography>,
) {
  return StyleSheet.create({
    ruleContainer: {
      gap: 10,
      padding: 14,
    },
    ruleMeta: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
    ruleTitle: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    section: {
      gap: 10,
    },
    stack: {
      gap: 14,
    },
  });
}
