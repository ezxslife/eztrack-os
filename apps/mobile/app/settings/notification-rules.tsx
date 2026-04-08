import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { GlassSwitch } from "@/components/ui/glass/GlassSwitch";
import {
  useCreateNotificationRuleMutation,
  useDeleteNotificationRuleMutation,
  useNotificationRules,
  useUpdateNotificationRuleMutation,
} from "@/lib/queries/settings";
import { useThemeColors } from "@/theme";

export default function NotificationRulesScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
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
      onRefresh={() => {
        void rulesQuery.refetch();
      }}
      refreshing={rulesQuery.isRefetching}
      subtitle="Real notification rule CRUD using the existing org-level table."
      title="Notification Rules"
    >
      <SectionCard title="New rule">
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
      </SectionCard>

      <SectionCard
        subtitle={rulesQuery.isLoading ? "Loading rules" : `${(rulesQuery.data ?? []).length} rules`}
        title="Current rules"
      >
        <View style={styles.stack}>
          {(rulesQuery.data ?? []).map((rule) => (
            <View key={rule.id} style={styles.row}>
              <Text style={styles.title}>{rule.event}</Text>
              <Text style={styles.meta}>{rule.description ?? "No description"}</Text>
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
          ))}
        </View>
      </SectionCard>
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
  const styles = StyleSheet.create({
    label: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
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

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 10,
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
