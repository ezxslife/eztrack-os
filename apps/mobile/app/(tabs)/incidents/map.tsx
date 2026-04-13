import { useRouter, Stack } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { FilterChips } from "@/components/ui/FilterChips";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerImpactHaptic } from "@/lib/haptics";
import { useIncidents } from "@/lib/queries/incidents";

const severityFilters = ["All", "Critical", "High", "Medium", "Low"] as const;

// Mock incident data for map view
const mockIncidents = [
  {
    id: "INC-001",
    recordNumber: "INC-001",
    severity: "critical" as const,
    location: "5th & Main",
    description: "Traffic collision",
  },
  {
    id: "INC-002",
    recordNumber: "INC-002",
    severity: "high" as const,
    location: "Park Ave & 12th",
    description: "Welfare check",
  },
  {
    id: "INC-003",
    recordNumber: "INC-003",
    severity: "medium" as const,
    location: "Downtown Station",
    description: "Disturbance report",
  },
  {
    id: "INC-004",
    recordNumber: "INC-004",
    severity: "low" as const,
    location: "Central Park",
    description: "Lost item report",
  },
];

export default function IncidentMapScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const [selectedSeverity, setSelectedSeverity] =
    React.useState<typeof severityFilters[number]>("All");

  const styles = createStyles(colors, layout, typography);

  const filteredIncidents =
    selectedSeverity === "All"
      ? mockIncidents
      : mockIncidents.filter(
          (inc) =>
            inc.severity.toLowerCase() ===
            selectedSeverity.toLowerCase()
        );

  const incidentCount = filteredIncidents.length;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Incident Map",
        }}
      />
      <View style={styles.container}>
        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <AppSymbol
              iosName="map.fill"
              fallbackName="map"
              size={56}
              color={colors.textTertiary}
            />
            <Text style={styles.mapText}>Map View</Text>
            <Text style={styles.mapSubtext}>
              {incidentCount} incident{incidentCount !== 1 ? "s" : ""} shown
            </Text>
          </View>
        </View>

        {/* Bottom Overlay Panel */}
        <View style={styles.bottomPanel}>
          <MaterialSurface variant="chrome" style={styles.panelContent}>
            {/* Header Row */}
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelTitle}>Incident Map</Text>
                <Text style={styles.panelSubtitle}>
                  {incidentCount} incident{incidentCount !== 1 ? "s" : ""} visible
                </Text>
              </View>
              <Pressable
                style={styles.toggleButton}
                onPress={() => {
                  triggerImpactHaptic();
                  router.push("/incidents");
                }}
              >
                <AppSymbol
                  iosName="list.bullet"
                  fallbackName="list"
                  size={20}
                  color={colors.primary}
                />
              </Pressable>
            </View>

            {/* Filter Chips */}
            <FilterChips
              onSelect={(value) => {
                triggerImpactHaptic();
                setSelectedSeverity(value as typeof severityFilters[number]);
              }}
              options={severityFilters as unknown as string[]}
              selected={selectedSeverity}
            />

            {/* Incident List */}
            <View style={styles.incidentList}>
              {filteredIncidents.map((incident) => (
                <Pressable
                  key={incident.id}
                  style={styles.incidentItem}
                  onPress={() => {
                    triggerImpactHaptic();
                    router.push(`/incidents/${incident.id}`);
                  }}
                >
                  <View style={styles.incidentRow}>
                    <View style={styles.incidentContent}>
                      <Text style={styles.incidentId}>
                        {incident.recordNumber}
                      </Text>
                      <Text style={styles.incidentLocation}>
                        {incident.location}
                      </Text>
                    </View>
                    <PriorityBadge priority={incident.severity} />
                  </View>
                  <Text style={styles.incidentDescription}>
                    {incident.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </MaterialSurface>
        </View>
      </View>
    </>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>,
  typography: ReturnType<typeof useThemeTypography>
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    mapContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    mapPlaceholder: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.surface,
      gap: 12,
    },
    mapText: {
      ...typography.headline,
      color: colors.textSecondary,
    },
    mapSubtext: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
    bottomPanel: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: "50%",
    },
    panelContent: {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      gap: 14,
      paddingBottom: layout.horizontalPadding,
    },
    panelHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    panelTitle: {
      ...typography.headline,
      color: colors.textPrimary,
    },
    panelSubtitle: {
      ...typography.caption1,
      color: colors.textTertiary,
      marginTop: 2,
    },
    toggleButton: {
      padding: 8,
    },
    incidentList: {
      gap: 10,
      maxHeight: 250,
    },
    incidentItem: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      padding: 12,
      gap: 6,
    },
    incidentRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    incidentContent: {
      flex: 1,
      gap: 2,
    },
    incidentId: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    incidentLocation: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    incidentDescription: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
  });
}

import * as React from "react";
