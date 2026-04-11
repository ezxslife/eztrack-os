import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { ScreenTitleStrip } from "@/components/ui/glass/ScreenTitleStrip";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useThemeColors, useThemeTypography, useThemeSpacing } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerSelectionHaptic, triggerNotificationHaptic } from "@/lib/haptics";

// TODO: Replace with real data from state/API
interface OutstandingItem {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "urgent";
  briefed: boolean;
}

const MOCK_OUTSTANDING_ITEMS: OutstandingItem[] = [
  {
    id: "INC-042",
    title: "Unauthorized Access Attempt - Zone B",
    status: "urgent",
    briefed: false,
  },
  {
    id: "DISP-015",
    title: "Patrol Route Update - West Campus",
    status: "in_progress",
    briefed: false,
  },
  {
    id: "WORK-008",
    title: "HVAC Maintenance - Building 3",
    status: "pending",
    briefed: true,
  },
];

export default function ShiftHandoffScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();
  const layout = useAdaptiveLayout();
  const router = useRouter();

  const [handoffNotes, setHandoffNotes] = useState("");
  const [briefedItems, setBriefedItems] = useState<Set<string>>(
    new Set(MOCK_OUTSTANDING_ITEMS.filter((i) => i.briefed).map((i) => i.id))
  );
  const [loading, setLoading] = useState(false);

  // TODO: Replace with real data from shift context
  const shiftData = {
    name: "Evening Shift (4 PM - Midnight)",
    startTime: "16:00",
    endTime: "00:00",
    totalLogEntries: 24,
    incidentsReported: 3,
    dispatchesHandled: 5,
    outstandingCount: MOCK_OUTSTANDING_ITEMS.length,
  };

  const calculateDuration = () => {
    // Mock duration calculation
    const hours = 8;
    const minutes = 0;
    return `${hours}h ${minutes}m`;
  };

  const toggleBriefed = (itemId: string) => {
    triggerSelectionHaptic();
    setBriefedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleCompleteHandoff = () => {
    triggerNotificationHaptic("success");

    Alert.alert(
      "Complete Shift Handoff",
      `Are you sure you want to end your shift and sign out?\n\nHandoff notes: ${
        handoffNotes || "(none)"
      }`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Complete Handoff",
          onPress: async () => {
            setLoading(true);
            try {
              // TODO: Call API to complete handoff and sign out
              console.log("Completing handoff with:", {
                notes: handoffNotes,
                briefedItems: Array.from(briefedItems),
                timestamp: new Date(),
              });

              await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

              triggerNotificationHaptic("success");
              // TODO: Navigate to auth/sign-in or home
              router.replace("/");
            } catch (error) {
              triggerNotificationHaptic("warning");
              Alert.alert("Error", "Failed to complete handoff. Please try again.");
            } finally {
              setLoading(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Shift Handoff",
        }}
      />

      <ScreenContainer>
        <View style={[styles.container, { gap: spacing[4] }]}>
          {/* Title Strip */}
          <ScreenTitleStrip
            title="End of Shift"
            subtitle={`${shiftData.name} (${calculateDuration()})`}
          />

          {/* Summary Section */}
          <MaterialSurface
            variant="panel"
            style={{ marginHorizontal: spacing[4] }}
          >
            <View style={[styles.summaryGrid, { gap: spacing[3] }]}>
              <View style={styles.summaryItem}>
                <Text
                  style={[
                    typography.caption1,
                    { color: colors.textTertiary, fontWeight: "600" },
                  ]}
                >
                  LOG ENTRIES
                </Text>
                <Text
                  style={[
                    typography.title1,
                    { color: colors.text, marginTop: spacing[1] },
                  ]}
                >
                  {shiftData.totalLogEntries}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text
                  style={[
                    typography.caption1,
                    { color: colors.textTertiary, fontWeight: "600" },
                  ]}
                >
                  INCIDENTS REPORTED
                </Text>
                <Text
                  style={[
                    typography.title1,
                    { color: colors.text, marginTop: spacing[1] },
                  ]}
                >
                  {shiftData.incidentsReported}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text
                  style={[
                    typography.caption1,
                    { color: colors.textTertiary, fontWeight: "600" },
                  ]}
                >
                  DISPATCHES HANDLED
                </Text>
                <Text
                  style={[
                    typography.title1,
                    { color: colors.text, marginTop: spacing[1] },
                  ]}
                >
                  {shiftData.dispatchesHandled}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text
                  style={[
                    typography.caption1,
                    { color: colors.textTertiary, fontWeight: "600" },
                  ]}
                >
                  OUTSTANDING
                </Text>
                <Text
                  style={[
                    typography.title1,
                    {
                      color:
                        shiftData.outstandingCount > 0
                          ? colors.warning
                          : colors.text,
                      marginTop: spacing[1],
                    },
                  ]}
                >
                  {shiftData.outstandingCount}
                </Text>
              </View>
            </View>
          </MaterialSurface>

          {/* Handoff Notes */}
          <View style={{ paddingHorizontal: spacing[4] }}>
            <Text
              style={[
                typography.subheading,
                { color: colors.text, fontWeight: "600" },
              ]}
            >
              Notes for Incoming Shift
            </Text>
            <View
              style={[
                styles.notesInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  marginTop: spacing[2],
                },
              ]}
            >
              <Text
                style={[
                  typography.body,
                  {
                    color:
                      handoffNotes.length === 0 ? colors.textTertiary : colors.text,
                  },
                ]}
              >
                {handoffNotes || "Add notes about the shift..."}
              </Text>
            </View>
          </View>

          {/* Outstanding Items */}
          {MOCK_OUTSTANDING_ITEMS.length > 0 && (
            <View style={{ paddingHorizontal: spacing[4] }}>
              <Text
                style={[
                  typography.subheading,
                  { color: colors.text, fontWeight: "600", marginBottom: spacing[2] },
                ]}
              >
                Outstanding Items
              </Text>

              <FlatList
                data={MOCK_OUTSTANDING_ITEMS}
                scrollEnabled={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => toggleBriefed(item.id)}
                    style={({ pressed }) => [
                      styles.itemRow,
                      {
                        backgroundColor: pressed ? colors.overlay : "transparent",
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.itemCheckbox}>
                      {briefedItems.has(item.id) && (
                        <AppSymbol
                          name="checkmark"
                          size={16}
                          color={colors.primary}
                        />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          typography.body,
                          {
                            color: colors.text,
                            fontWeight: "600",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.id}
                      </Text>
                      <Text
                        style={[
                          typography.caption1,
                          {
                            color: colors.textTertiary,
                            marginTop: spacing[1],
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                    </View>

                    <View style={{ marginLeft: spacing[2] }}>
                      <StatusBadge status={item.status} />
                    </View>
                  </Pressable>
                )}
                ItemSeparatorComponent={() => (
                  <View style={{ height: 1, backgroundColor: colors.border }} />
                )}
              />
            </View>
          )}

          {/* Complete Handoff Button */}
          <View
            style={{
              paddingHorizontal: spacing[4],
              paddingBottom: spacing[4],
            }}
          >
            <Button
              onPress={handleCompleteHandoff}
              disabled={loading}
              loading={loading}
            >
              Complete Handoff & Sign Out
            </Button>
          </View>
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryItem: {
    flex: 1,
    minWidth: "48%",
  },
  notesInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    minHeight: 80,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  itemCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
