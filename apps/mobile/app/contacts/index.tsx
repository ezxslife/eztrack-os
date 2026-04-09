import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { useIOSNativeSearchHeader } from "@/navigation/useIOSNativeSearchHeader";
import { Button } from "@/components/ui/Button";
import { SearchField } from "@/components/ui/SearchField";
import { SectionCard } from "@/components/ui/SectionCard";
import { useContacts } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

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
  const { nativeIOSHeader } = useIOSNativeSearchHeader({
    placeholder: "Search names, organizations, categories, or contact info",
    query,
    setQuery: (value) => setFilter(moduleKey, { search: value }),
    title: "Contacts",
  });
  const styles = createStyles(colors, layout, typography);

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
    <ScreenContainer
      accessory={
        <View style={styles.accessory}>
          {!nativeIOSHeader ? (
            <SearchField
              onChangeText={(value) => setFilter(moduleKey, { search: value })}
              placeholder="Search names, organizations, categories, or contact info"
              style={styles.searchField}
              value={query}
            />
          ) : null}
          <Button
            label="New Contact"
            onPress={() => router.push("/contacts/new")}
            variant="secondary"
          />
        </View>
      }
      iosNativeHeader={nativeIOSHeader}
      onRefresh={() => {
        void contactsQuery.refetch();
      }}
      refreshing={contactsQuery.isRefetching}
      subtitle="External, vendor, and operational contacts in a compact mobile directory."
      title="Contacts"
    >
      <SectionCard
        subtitle={
          contactsQuery.isLoading
            ? "Loading contacts"
            : `${filtered.length} contacts visible`
        }
        title="Contact directory"
      >
        <View style={styles.list}>
          {filtered.length ? (
            filtered.map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  router.push({
                    pathname: "/contacts/[id]",
                    params: { id: item.id },
                  })
                }
                style={styles.card}
              >
                <Text style={styles.title}>
                  {[item.firstName, item.lastName].filter(Boolean).join(" ") ||
                    item.organization ||
                    "Unnamed contact"}
                </Text>
                <Text style={styles.copy}>
                  {item.title ?? item.contactType} · {item.organization || "No organization"}
                </Text>
                <Text style={styles.meta}>
                  {[item.phone, item.email].filter(Boolean).join(" · ") || "No contact info"}
                </Text>
                <Text style={styles.meta}>
                  {item.category} · {item.contactType}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyCopy}>
              No contacts match the current search.
            </Text>
          )}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>,
  typography: ReturnType<typeof useThemeTypography>
) {
  return StyleSheet.create({
    accessory: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
    },
    card: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 6,
      padding: layout.listItemPadding,
    },
    copy: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    emptyCopy: {
      ...typography.subheadline,
      color: colors.textTertiary,
    },
    list: {
      gap: layout.gridGap,
    },
    meta: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
    searchField: {
      width: "100%",
    },
    title: {
      ...typography.headline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
  });
}
