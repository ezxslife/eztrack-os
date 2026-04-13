import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { SearchField } from "@/components/ui/SearchField";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import { GlassSheetModal } from "@/components/ui/glass/GlassSheetModal";
import { Divider } from "@/components/ui/Divider";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";

export interface Person {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
}

interface PersonPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (person: Person) => void;
  people: Person[];
  title?: string;
  recentPeople?: Person[];
  multiSelect?: boolean;
  selectedIds?: string[];
  onMultiSelect?: (people: Person[]) => void;
}

export function PersonPickerSheet({
  isOpen,
  onClose,
  onSelect,
  people,
  title = "Select Person",
  recentPeople,
  multiSelect = false,
  selectedIds = [],
  onMultiSelect,
}: PersonPickerSheetProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const [searchText, setSearchText] = useState("");
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);

  // Filter people based on search text
  const filteredPeople = useMemo(() => {
    if (!searchText.trim()) {
      return people;
    }

    const lowerSearch = searchText.toLowerCase();
    return people.filter(
      (person) =>
        person.name.toLowerCase().includes(lowerSearch) ||
        person.role?.toLowerCase().includes(lowerSearch)
    );
  }, [people, searchText]);

  // Filter recent people for display
  const displayRecentPeople = useMemo(() => {
    if (!recentPeople || searchText.trim()) {
      return [];
    }
    return recentPeople.slice(0, 3);
  }, [recentPeople, searchText]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      gap: 12,
    },
    searchContainer: {
      marginBottom: 4,
    },
    sectionHeader: {
      ...typography.footnote,
      color: colors.textTertiary,
      fontWeight: "700",
      marginLeft: 16,
      marginTop: 12,
      marginBottom: 8,
    },
    personRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    personInfo: {
      flex: 1,
      gap: 2,
    },
    personName: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    personRole: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    checkmark: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      gap: 8,
    },
    emptyStateText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    footerContainer: {
      flexDirection: "row",
      gap: 12,
      paddingTop: 12,
    },
    doneButton: {
      flex: 1,
    },
  });

  const handlePersonPress = (person: Person) => {
    triggerSelectionHaptic();

    if (multiSelect) {
      setLocalSelectedIds((prev) =>
        prev.includes(person.id)
          ? prev.filter((id) => id !== person.id)
          : [...prev, person.id]
      );
    } else {
      onSelect(person);
      onClose();
    }
  };

  const handleDone = () => {
    const selectedPeople = people.filter((p) =>
      localSelectedIds.includes(p.id)
    );
    onMultiSelect?.(selectedPeople);
    onClose();
  };

  const renderPersonRow = ({ item }: ListRenderItemInfo<Person>) => {
    const isSelected = localSelectedIds.includes(item.id);

    return (
      <Pressable
        onPress={() => handlePersonPress(item)}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.personRow}>
          <Avatar
            name={item.name}
            imageUrl={item.avatarUrl}
            size="md"
          />
          <View style={styles.personInfo}>
            <Text style={styles.personName}>{item.name}</Text>
            {item.role && <Text style={styles.personRole}>{item.role}</Text>}
          </View>
          {multiSelect && isSelected && (
            <View style={styles.checkmark}>
              <AppSymbol
                color={colors.brandText}
                fallbackName="checkmark"
                iosName="checkmark"
                size={18}
                weight="bold"
              />
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <AppSymbol
        color={colors.textTertiary}
        fallbackName="search"
        iosName="magnifyingglass"
        size={32}
      />
      <Text style={styles.emptyStateText}>No people found</Text>
    </View>
  );

  const sections = [];

  if (displayRecentPeople.length > 0 && !searchText.trim()) {
    sections.push({
      title: "Recent",
      data: displayRecentPeople,
      key: "recent",
    });
  }

  sections.push({
    title: searchText.trim() ? undefined : "All People",
    data: filteredPeople,
    key: "all",
  });

  const allData = sections.flatMap((section) =>
    section.data.map((item) => ({ ...item, __section: section.title }))
  );

  const renderSectionHeader = (title: string | undefined) =>
    title ? <Text style={styles.sectionHeader}>{title}</Text> : null;

  return (
    <GlassSheetModal
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={["60%", "90%"]}
      title={title}
    >
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <SearchField
            placeholder="Search people..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {filteredPeople.length === 0 && displayRecentPeople.length === 0 ? (
          renderEmpty()
        ) : (
          <>
            {displayRecentPeople.length > 0 && !searchText.trim() && (
              <>
                {renderSectionHeader("Recent")}
                {displayRecentPeople.map((person) => (
                  <Pressable
                    key={person.id}
                    onPress={() => handlePersonPress(person)}
                    accessibilityRole="button"
                  >
                    <View style={styles.personRow}>
                      <Avatar
                        name={person.name}
                        imageUrl={person.avatarUrl}
                        size="md"
                      />
                      <View style={styles.personInfo}>
                        <Text style={styles.personName}>{person.name}</Text>
                        {person.role && (
                          <Text style={styles.personRole}>{person.role}</Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                ))}
                <Divider />
              </>
            )}

            {renderSectionHeader(
              searchText.trim() ? undefined : "All People"
            )}
            <FlatList
              data={filteredPeople}
              renderItem={renderPersonRow}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              nestedScrollEnabled={false}
            />
          </>
        )}

        {multiSelect && (
          <View style={styles.footerContainer}>
            <GlassButton
              label="Cancel"
              onPress={onClose}
              variant="secondary"
              size="md"
            />
            <GlassButton
              label="Done"
              onPress={handleDone}
              variant="primary"
              size="md"
              style={styles.doneButton}
            />
          </View>
        )}
      </View>
    </GlassSheetModal>
  );
}
