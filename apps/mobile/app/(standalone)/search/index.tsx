import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  SectionList,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SearchField } from "@/components/ui/SearchField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { HeaderCancelButton } from "@/navigation/header-buttons";
import { useThemeColors, useThemeTypography, useThemeSpacing } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerSelectionHaptic } from "@/lib/haptics";

// TODO: Replace with real search hook from API
const MOCK_INCIDENTS = [
  {
    id: "INC-001",
    title: "Unauthorized Access Attempt",
    timestamp: "10:30 AM",
    status: "active",
  },
  {
    id: "INC-002",
    title: "Property Damage Report",
    timestamp: "9:15 AM",
    status: "investigating",
  },
  {
    id: "INC-003",
    title: "Lost Item Report",
    timestamp: "8:45 AM",
    status: "resolved",
  },
];

// TODO: Replace with real search hook from API
const MOCK_DISPATCHES = [
  {
    id: "DISP-001",
    title: "Patrol Route Update",
    timestamp: "11:00 AM",
    status: "in_progress",
  },
  {
    id: "DISP-002",
    title: "Emergency Response",
    timestamp: "10:15 AM",
    status: "completed",
  },
];

// TODO: Replace with real search hook from API
const MOCK_PERSONNEL = [
  {
    id: "PERS-001",
    name: "Officer John Smith",
    title: "Security Officer",
    avatar: "JS",
  },
  {
    id: "PERS-002",
    name: "Supervisor Sarah Johnson",
    title: "Shift Supervisor",
    avatar: "SJ",
  },
];

// TODO: Replace with real search hook from API
const MOCK_CASES = [
  {
    id: "CASE-001",
    title: "Case #2024-001 - Investigation in Progress",
    timestamp: "2 days ago",
    status: "open",
  },
];

interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

type SearchItem =
  | { id: string; status: string; timestamp: string; title: string; type: "record" }
  | { avatar: string; id: string; name: string; title: string; type: "person" };

interface SearchSection {
  data: SearchItem[];
  title: string;
}

export default function SearchScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();
  const layout = useAdaptiveLayout();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([
    { id: "1", query: "Officer Smith", timestamp: Date.now() - 3600000 },
    { id: "2", query: "Patrol Route", timestamp: Date.now() - 7200000 },
  ]);

  // Filter results based on search query
  const filteredResults = useMemo<SearchSection[]>(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase();

    const incidents = MOCK_INCIDENTS.filter(
      (inc) =>
        inc.title.toLowerCase().includes(query) ||
        inc.id.toLowerCase().includes(query)
    );

    const dispatches = MOCK_DISPATCHES.filter(
      (disp) =>
        disp.title.toLowerCase().includes(query) ||
        disp.id.toLowerCase().includes(query)
    );

    const personnel = MOCK_PERSONNEL.filter(
      (pers) =>
        pers.name.toLowerCase().includes(query) ||
        pers.title.toLowerCase().includes(query)
    );

    const cases = MOCK_CASES.filter(
      (cas) =>
        cas.title.toLowerCase().includes(query) ||
        cas.id.toLowerCase().includes(query)
    );

    return [
      ...(incidents.length > 0
        ? [{ title: "Incidents", data: incidents.map((item) => ({ ...item, type: "record" as const })) }]
        : []),
      ...(dispatches.length > 0
        ? [{ title: "Dispatches", data: dispatches.map((item) => ({ ...item, type: "record" as const })) }]
        : []),
      ...(personnel.length > 0
        ? [{ title: "Personnel", data: personnel.map((item) => ({ ...item, type: "person" as const })) }]
        : []),
      ...(cases.length > 0
        ? [{ title: "Cases", data: cases.map((item) => ({ ...item, type: "record" as const })) }]
        : []),
    ];
  }, [searchQuery]);

  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      triggerSelectionHaptic();
      // Add to recent searches
      setRecentSearches((prev) => [
        { id: Date.now().toString(), query, timestamp: Date.now() },
        ...prev.slice(0, 9),
      ]);
      // TODO: Execute actual search query
    }
  };

  const handleClearRecent = () => {
    triggerSelectionHaptic();
    setRecentSearches([]);
  };

  const handleResultPress = (resultId: string, type: string) => {
    triggerSelectionHaptic();
    // TODO: Navigate to appropriate detail screen
    console.log("Tapped result:", { resultId, type });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => <HeaderCancelButton onPress={() => router.back()} />,
          title: "Search",
        }}
      />

      <ScreenContainer>
        <View style={[styles.container, { gap: spacing[3] }]}>
          {/* Full-width search field — cancel lives in the native header */}
          <View
            style={{
              paddingHorizontal: layout.horizontalPadding,
              paddingTop: spacing[3],
              paddingBottom: spacing[2],
            }}
          >
            <SearchField
              placeholder="Search incidents, personnel, cases..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={(e) => handleSearchSubmit(e.nativeEvent.text)}
              autoFocus
            />
          </View>

          {/* Recent searches header */}
          {searchQuery.trim().length === 0 && recentSearches.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: layout.horizontalPadding,
              }}
            >
              <Text
                style={[
                  typography.footnote,
                  { color: colors.textTertiary, fontWeight: "600" },
                ]}
              >
                RECENT SEARCHES
              </Text>
              <Pressable onPress={handleClearRecent}>
                <Text
                  style={[
                    typography.footnote,
                    { color: colors.primary, fontWeight: "600" },
                  ]}
                >
                  Clear
                </Text>
              </Pressable>
            </View>
          )}

          {filteredResults.length > 0 && searchQuery.trim().length > 0 ? (
            <SectionList<SearchItem, SearchSection>
              sections={filteredResults}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item, section }) => (
                <Pressable
                  onPress={() => handleResultPress(item.id, section.title)}
                  style={({ pressed }) => [
                    styles.resultItem,
                    {
                      backgroundColor: pressed ? colors.overlay : "transparent",
                    },
                  ]}
                >
                  <View style={styles.resultContent}>
                    {item.type === "person" ? (
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text
                          style={[
                            typography.caption1,
                            { color: colors.background, fontWeight: "700" },
                          ]}
                        >
                          {item.avatar}
                        </Text>
                      </View>
                    ) : (
                      <AppSymbol
                        name={
                          section.title === "Incidents"
                            ? "exclamationmark.circle"
                            : section.title === "Dispatches"
                              ? "paperplane"
                              : "folder"
                        }
                        size={24}
                        color={colors.primary}
                      />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          typography.body,
                          { color: colors.text, fontWeight: "600" },
                        ]}
                        numberOfLines={1}
                      >
                        {item.type === "person" ? item.name : item.title}
                      </Text>
                      {item.type === "record" ? (
                        <Text
                          style={[
                            typography.caption1,
                            { color: colors.textTertiary, marginTop: 2 },
                          ]}
                        >
                          {item.timestamp}
                        </Text>
                      ) : null}
                      {item.type === "record" ? (
                        <View style={{ marginTop: 4 }}>
                          <StatusBadge status={item.status} />
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              )}
              renderSectionHeader={({ section: { title } }) => (
                <Text
                  style={[
                    typography.footnote,
                    {
                      color: colors.textTertiary,
                      fontWeight: "600",
                      marginVertical: spacing[3],
                      marginHorizontal: spacing[4],
                    },
                  ]}
                >
                  {title}
                </Text>
              )}
            />
          ) : searchQuery.trim().length > 0 ? (
            <View
              style={[
                styles.emptyState,
                {
                  gap: spacing[3],
                  paddingHorizontal: layout.horizontalPadding,
                },
              ]}
            >
              <AppSymbol
                name="magnifyingglass"
                size={48}
                color={colors.textTertiary}
              />
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.text,
                    textAlign: "center",
                    fontWeight: "600",
                  },
                ]}
              >
                No results for "{searchQuery}"
              </Text>
              <Text
                style={[
                  typography.caption1,
                  {
                    color: colors.textTertiary,
                    textAlign: "center",
                  },
                ]}
              >
                Try a different search term
              </Text>
            </View>
          ) : (
            <View
              style={{
                flex: 1,
                paddingHorizontal: layout.horizontalPadding,
              }}
            >
              {recentSearches.length === 0 && (
                <View
                  style={[
                    styles.emptyState,
                    { gap: spacing[3], marginTop: spacing[8] },
                  ]}
                >
                  <AppSymbol
                    name="magnifyingglass"
                    size={48}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[
                      typography.body,
                      {
                        color: colors.textTertiary,
                        textAlign: "center",
                      },
                    ]}
                  >
                    No recent searches
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  resultItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resultContent: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
  },
});
