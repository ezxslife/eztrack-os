import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { SearchField } from "@/components/ui/SearchField";
import { SectionCard } from "@/components/ui/SectionCard";
import { useContacts } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors } from "@/theme";

const moduleKey = "contacts";

export default function ContactsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const contactsQuery = useContacts();
  const rows = contactsQuery.data ?? [];
  const filtersState = useFilterStore(
    (state) => state.filters[moduleKey] ?? defaultFilterState
  );
  const setFilter = useFilterStore((state) => state.setFilter);
  const query = filtersState.search;

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
          <SearchField
            onChangeText={(value) => setFilter(moduleKey, { search: value })}
            placeholder="Search names, organizations, categories, or contact info"
            value={query}
          />
          <Button
            label="New Contact"
            onPress={() => router.push("/contacts/new")}
            variant="secondary"
          />
        </View>
      }
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

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    accessory: {
      gap: 12,
    },
    card: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 6,
      padding: 14,
    },
    copy: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    emptyCopy: {
      color: colors.textTertiary,
      fontSize: 14,
      lineHeight: 20,
    },
    list: {
      gap: 12,
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
