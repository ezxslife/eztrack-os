import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerImpactHaptic } from "@/lib/haptics";

type Shift = {
  id: string;
  startTime: string;
  endTime: string;
  type: "patrol" | "desk" | "training" | "off";
};

type Personnel = {
  id: string;
  name: string;
  badge: string;
  shifts: Record<string, Shift | null>; // day -> shift
};

const mockSchedule: Personnel[] = [
  {
    id: "P001",
    name: "Officer Smith",
    badge: "#2847",
    shifts: {
      monday: {
        id: "S1",
        startTime: "08:00",
        endTime: "16:00",
        type: "patrol",
      },
      tuesday: {
        id: "S2",
        startTime: "16:00",
        endTime: "00:00",
        type: "patrol",
      },
      wednesday: null,
      thursday: {
        id: "S3",
        startTime: "08:00",
        endTime: "16:00",
        type: "desk",
      },
      friday: {
        id: "S4",
        startTime: "16:00",
        endTime: "00:00",
        type: "patrol",
      },
      saturday: {
        id: "S5",
        startTime: "08:00",
        endTime: "16:00",
        type: "patrol",
      },
      sunday: null,
    },
  },
  {
    id: "P002",
    name: "Officer Johnson",
    badge: "#3451",
    shifts: {
      monday: null,
      tuesday: {
        id: "S6",
        startTime: "08:00",
        endTime: "16:00",
        type: "training",
      },
      wednesday: {
        id: "S7",
        startTime: "16:00",
        endTime: "00:00",
        type: "patrol",
      },
      thursday: {
        id: "S8",
        startTime: "16:00",
        endTime: "00:00",
        type: "patrol",
      },
      friday: {
        id: "S9",
        startTime: "08:00",
        endTime: "16:00",
        type: "desk",
      },
      saturday: null,
      sunday: {
        id: "S10",
        startTime: "08:00",
        endTime: "16:00",
        type: "patrol",
      },
    },
  },
  {
    id: "P003",
    name: "Officer Williams",
    badge: "#1928",
    shifts: {
      monday: {
        id: "S11",
        startTime: "16:00",
        endTime: "00:00",
        type: "patrol",
      },
      tuesday: {
        id: "S12",
        startTime: "16:00",
        endTime: "00:00",
        type: "patrol",
      },
      wednesday: {
        id: "S13",
        startTime: "08:00",
        endTime: "16:00",
        type: "desk",
      },
      thursday: null,
      friday: {
        id: "S14",
        startTime: "08:00",
        endTime: "16:00",
        type: "patrol",
      },
      saturday: {
        id: "S15",
        startTime: "16:00",
        endTime: "00:00",
        type: "patrol",
      },
      sunday: {
        id: "S16",
        startTime: "08:00",
        endTime: "16:00",
        type: "patrol",
      },
    },
  },
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export default function ShiftScheduleScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const [weekOffset, setWeekOffset] = useState(0);
  const styles = createStyles(colors, layout, typography);

  const handleShiftPress = (personnel: Personnel, shift: Shift) => {
    triggerImpactHaptic();
    Alert.alert(
      `${personnel.name} (${personnel.badge})`,
      `${shift.type.charAt(0).toUpperCase() + shift.type.slice(1)}\n${shift.startTime} - ${shift.endTime}`
    );
  };

  const getShiftColor = (shiftType: Shift["type"]): string => {
    switch (shiftType) {
      case "patrol":
        return "#0084FF";
      case "desk":
        return "#FF9500";
      case "training":
        return "#34C759";
      case "off":
        return colors.surfaceSecondary;
      default:
        return colors.primary;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Shift Schedule",
        }}
      />
      <ScreenContainer nativeHeader>
        {/* Week Navigator */}
        <View style={styles.weekNavigator}>
          <Pressable
            style={styles.navButton}
            onPress={() => {
              triggerImpactHaptic();
              setWeekOffset(weekOffset - 1);
            }}
          >
            <AppSymbol
              iosName="chevron.left"
              fallbackName="chevron-back"
              size={20}
              color={colors.primary}
            />
          </Pressable>
          <Text style={styles.weekLabel}>
            {weekOffset === 0 ? "This Week" : `Week ${Math.abs(weekOffset)}`}
          </Text>
          <Pressable
            style={styles.navButton}
            onPress={() => {
              triggerImpactHaptic();
              setWeekOffset(weekOffset + 1);
            }}
          >
            <AppSymbol
              iosName="chevron.right"
              fallbackName="chevron-forward"
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </View>

        {/* Schedule Grid */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.gridContainer}
        >
          <View>
            {/* Day Headers */}
            <View style={styles.headerRow}>
              <View style={styles.personelColumn} />
              {days.map((day) => (
                <View key={day} style={styles.dayColumn}>
                  <Text style={styles.dayLabel}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Personnel Rows */}
            {mockSchedule.map((person) => (
              <View key={person.id} style={styles.personRow}>
                <View style={styles.personelColumn}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personBadge}>{person.badge}</Text>
                </View>
                {dayKeys.map((dayKey) => {
                  const shift = person.shifts[dayKey];
                  return (
                    <View key={`${person.id}-${dayKey}`} style={styles.dayColumn}>
                      {shift ? (
                        <Pressable
                          style={[
                            styles.shiftBlock,
                            { backgroundColor: getShiftColor(shift.type) },
                          ]}
                          onPress={() => handleShiftPress(person, shift)}
                        >
                          <Text style={styles.shiftText}>
                            {shift.startTime.substring(0, 2)}
                          </Text>
                        </Pressable>
                      ) : (
                        <View style={styles.emptyBlock}>
                          <Text style={styles.emptyText}>Off</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#0084FF" }]}
            />
            <Text style={styles.legendLabel}>Patrol</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#FF9500" }]}
            />
            <Text style={styles.legendLabel}>Desk</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#34C759" }]}
            />
            <Text style={styles.legendLabel}>Training</Text>
          </View>
        </View>
      </ScreenContainer>
    </>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>,
  typography: ReturnType<typeof useThemeTypography>
) {
  return StyleSheet.create({
    weekNavigator: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: layout.gridGap,
      paddingHorizontal: layout.horizontalPadding,
    },
    navButton: {
      padding: 8,
      borderRadius: 8,
    },
    weekLabel: {
      ...typography.headline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    gridContainer: {
      marginHorizontal: -layout.horizontalPadding,
      paddingHorizontal: layout.horizontalPadding,
      marginBottom: layout.gridGap,
    },
    headerRow: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
    },
    personelColumn: {
      width: 100,
      paddingVertical: 10,
      paddingHorizontal: layout.cardPadding,
      justifyContent: "center",
    },
    dayColumn: {
      width: 60,
      paddingVertical: 10,
      alignItems: "center",
    },
    dayLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    personRow: {
      flexDirection: "row",
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
    },
    personName: {
      ...typography.footnote,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    personBadge: {
      ...typography.caption1,
      color: colors.textTertiary,
      marginTop: 2,
    },
    shiftBlock: {
      width: 48,
      height: 48,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      margin: 6,
    },
    shiftText: {
      ...typography.caption1,
      color: "#FFFFFF",
      fontWeight: "700",
    },
    emptyBlock: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
      margin: 6,
    },
    emptyText: {
      ...typography.caption1,
      color: colors.textTertiary,
      fontSize: 11,
    },
    legend: {
      flexDirection: "row",
      gap: layout.gridGap,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 3,
    },
    legendLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
  });
}
