import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { HeaderEditButton } from "@/navigation/header-buttons";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  useContactDetail,
  useDeleteContactMutation,
} from "@/lib/queries/contacts";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function ContactDetailScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const contactId = params.id ?? "";
  const detailQuery = useContactDetail(contactId);
  const deleteMutation = useDeleteContactMutation(contactId);
  const contact = detailQuery.data;

  if (!contact) {
    return (
      <ScreenContainer subtitle="Loading contact" title="Contact">
        <SectionCard title="Loading">
          <Text style={styles.copy}>The contact is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  const displayName =
    contact.contactType === "organization"
      ? contact.organizationName ?? "Unnamed organization"
      : [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unnamed contact";

  return (
    <>
      <Stack.Screen options={{
        headerRight: () => (
          <NativeHeaderActionGroup>
            <HeaderEditButton onPress={() => {
              router.push({
                pathname: "/(create)/contacts/edit/[id]",
                params: { id: contact.id },
              });
            }} />
          </NativeHeaderActionGroup>
        ),
      }} />
      <ScreenContainer
      onRefresh={() => {
        void detailQuery.refetch();
      }}
      refreshing={detailQuery.isRefetching}
      subtitle="Real contact detail with direct call, text, and email actions."
      title={displayName}
    >
      <SectionCard subtitle={contact.category} title="Overview">
        <View style={styles.stack}>
          <Text style={styles.copy}>{displayName}</Text>
          <Text style={styles.meta}>
            {contact.title ?? contact.contactType} · {contact.organizationName ?? "No organization"}
          </Text>
          <Text style={styles.meta}>{contact.address ?? "No address recorded"}</Text>
          <View style={styles.actions}>
            {contact.phone ? (
              <Button
                label="Call"
                onPress={() => {
                  void Linking.openURL(`tel:${contact.phone}`);
                }}
              />
            ) : null}
            {contact.phone ? (
              <Button
                label="Text"
                onPress={() => {
                  void Linking.openURL(`sms:${contact.phone}`);
                }}
                variant="secondary"
              />
            ) : null}
            {contact.email ? (
              <Button
                label="Email"
                onPress={() => {
                  void Linking.openURL(`mailto:${contact.email}`);
                }}
                variant="secondary"
              />
            ) : null}
            <Button
              label="Edit Contact"
              onPress={() =>
                router.push({
                  pathname: "/contacts/edit/[id]",
                  params: { id: contact.id },
                })
              }
              variant="secondary"
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard subtitle="Identity and notes." title="Record">
        <View style={styles.stack}>
          <Text style={styles.copy}>
            Primary {contact.phone ?? "No phone"} · Secondary {contact.secondaryPhone ?? "No secondary"}
          </Text>
          <Text style={styles.copy}>{contact.email ?? "No email recorded"}</Text>
          <Text style={styles.copy}>
            ID {contact.idType ?? "Not set"} · {contact.idNumber ?? "No number"}
          </Text>
          <Text style={styles.meta}>{contact.notes ?? "No secure notes recorded."}</Text>
        </View>
      </SectionCard>

      <SectionCard subtitle="This removes the record from active contact views." title="Record Control">
        <View style={styles.actions}>
          <Button
            label="Delete Contact"
            loading={deleteMutation.isPending}
            onPress={() => {
              Alert.alert("Delete contact", "Remove this contact from active views?", [
                { style: "cancel", text: "Cancel" },
                {
                  style: "destructive",
                  text: "Delete",
                  onPress: () => {
                    void deleteMutation.mutateAsync().then(() => {
                      router.back();
                    });
                  },
                },
              ]);
            }}
            variant="plain"
          />
        </View>
      </SectionCard>
    </ScreenContainer>
    </>
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
      gap: 12,
    },
    copy: {
      color: colors.textPrimary,
      ...typography.subheadline,
    },
    meta: {
      color: colors.textTertiary,
      ...typography.footnote,
    },
    stack: { gap: 12 },
  });
}
