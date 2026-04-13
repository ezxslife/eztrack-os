import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { SearchField } from "@/components/ui/SearchField";
import { GlassSheetModal } from "@/components/ui/glass/GlassSheetModal";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";
import type { SFSymbol } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";

export interface Location {
  id: string;
  name: string;
  address?: string;
  type?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iosIcon?: SFSymbol;
}

interface LocationPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: Location) => void;
  savedLocations?: Location[];
  title?: string;
  showCurrentLocation?: boolean;
}

export function LocationPickerSheet({
  isOpen,
  onClose,
  onSelect,
  savedLocations = [],
  title = "Select Location",
  showCurrentLocation = true,
}: LocationPickerSheetProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const [searchText, setSearchText] = useState("");

  // Filter locations based on search text
  const filteredLocations = useMemo(() => {
    if (!searchText.trim()) {
      return savedLocations;
    }

    const lowerSearch = searchText.toLowerCase();
    return savedLocations.filter(
      (location) =>
        location.name.toLowerCase().includes(lowerSearch) ||
        location.address?.toLowerCase().includes(lowerSearch) ||
        location.type?.toLowerCase().includes(lowerSearch)
    );
  }, [savedLocations, searchText]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      gap: 12,
    },
    searchContainer: {
      marginBottom: 4,
    },
    currentLocationRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    locationRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    locationContent: {
      flex: 1,
      gap: 2,
    },
    locationName: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    locationAddress: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    locationType: {
      ...typography.caption1,
      color: colors.textTertiary,
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
    divider: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginVertical: 8,
    },
  });

  const handleLocationPress = (location: Location) => {
    triggerSelectionHaptic();
    onSelect(location);
    onClose();
  };

  const currentLocation: Location = {
    id: "__current__",
    name: "Current Location",
    icon: "location",
    iosIcon: "location.fill",
  };

  const renderLocationRow = ({ item }: ListRenderItemInfo<Location>) => {
    const hasIcon = item.icon || item.iosIcon;

    return (
      <Pressable
        onPress={() => handleLocationPress(item)}
        accessibilityRole="button"
      >
        <View style={styles.locationRow}>
          {hasIcon && (
            <AppSymbol
              color={colors.brandText}
              fallbackName={item.icon || "location"}
              iosName={item.iosIcon}
              size={20}
              weight="medium"
            />
          )}
          <View style={styles.locationContent}>
            <Text style={styles.locationName}>{item.name}</Text>
            {item.address && (
              <Text style={styles.locationAddress} numberOfLines={1}>
                {item.address}
              </Text>
            )}
            {item.type && <Text style={styles.locationType}>{item.type}</Text>}
          </View>
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
      <Text style={styles.emptyStateText}>No locations found</Text>
    </View>
  );

  const displayLocations =
    filteredLocations.length > 0
      ? filteredLocations
      : savedLocations.length > 0 && !searchText.trim()
        ? savedLocations
        : [];

  return (
    <GlassSheetModal
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={["50%", "80%"]}
      title={title}
    >
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <SearchField
            placeholder="Search locations..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {showCurrentLocation && !searchText.trim() && (
          <>
            <Pressable
              onPress={() => handleLocationPress(currentLocation)}
              accessibilityRole="button"
            >
              <View style={styles.currentLocationRow}>
                <AppSymbol
                  color={colors.brandText}
                  fallbackName="location"
                  iosName="location.fill"
                  size={20}
                  weight="semibold"
                />
                <View style={styles.locationContent}>
                  <Text style={styles.locationName}>
                    {currentLocation.name}
                  </Text>
                </View>
              </View>
            </Pressable>
            {displayLocations.length > 0 && <View style={styles.divider} />}
          </>
        )}

        {displayLocations.length === 0 && !showCurrentLocation ? (
          renderEmpty()
        ) : (
          <FlatList
            data={displayLocations}
            renderItem={renderLocationRow}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            nestedScrollEnabled={false}
          />
        )}
      </View>
    </GlassSheetModal>
  );
}
