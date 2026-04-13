import { useRouter, Stack } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { useContacts } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { HeaderSearchButton } from "@/navigation/header-buttons";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";

const moduleKey = "contacts";

export default function ContactsScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const contactsQuery = useContacts();
  const rows = contactsQuery.data ?? [];
  const filtersState = useFilterStore(
    (state) => state.filters[moduleKey] ?? defaultFilterState
  );
  const setFilter = useFilterStore((state) => state.setFilter);
  const query = filtersState.search;
  const styles = createStyles(colors, typography, layout);

  const filtered = useMemo(
    () =>
      rows.filter((item) =>
        [
          item.firstName,
          item.lastName,
          item.organization,
          item.category,
          item.contactType,
          item.email,
          item.phone,
          item.title,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [rows, query]
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <NativeHeaderActionGroup>
              <HeaderSearchButton onPress={() => router.push("/search")} />
            </NativeHeaderActionGroup>
          ),
        }}
      />
      <ScreenContainer
        accessory={
          <View style={styles.accessory}>
            <Button
              label="New Contact"
              onPress={() => router.push("/contacts/new")}
              variant="secondary"
            />
          </View>
        }
        gutter="none"
        nativeHeader
        onRefresh={() => {
          void contactsQuery.refetch();
        }}
        refreshing={contactsQuery.isRefetching}
        subtitle="External, vendor, and operational contacts."
        title="Contacts"
      >
      <View style={styles.section}>
        <SectionHeader title="Contact directory" />
        {filtered.length ? (
          <GroupedCard>
            {filtered.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <GroupedCardDivider /> : null}
                <SettingsListRow
                  label={
                    [item.firstName, item.lastName].filter(Boolean).join(" ") ||
                    item.organization ||
                    "Unnamed contact"
                  }
                  onPress={() =>
                    router.push({
                      pathname: "/contacts/[id]",
                      params: { id: item.id },
                    })
                  }
                  subtitle={[
                    `${item.title ?? item.contactType} · ${item.organization || "No organization"}`,
                    [item.phone, item.email].filter(Boolean).join(" · ") ||
                      "No contact info",
                    `${item.category} · ${item.contactType}`,
                  ].join(" · ")}
                />
              </View>
            ))}
          </GroupedCard>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyCopy}>
              No contacts match the current search.
            </Text>
          </View>
        )}
      </View>
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
    accessory: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
      paddingHorizontal: layout.horizontalPadding,
    },
    emptyCopy: {
      ...typography.subheadline,
      color: colors.textTertiary,
    },
    emptyState: {
      backgroundColor: colors.surfaceTintSubtle,
      borderColor: colors.borderLight,
      borderRadius: 12,
      borderWidth: 1,
      marginHorizontal: layout.horizontalPadding,
      padding: 16,
    },
    section: {
      gap: 8,
    },
  });
}
