import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlassButton } from "@/components/ui/glass/GlassButton";
import { GlassPill } from "@/components/ui/glass/GlassPill";
import { GlassSheetModal } from "@/components/ui/glass/GlassSheetModal";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";

interface DateRangePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (range: {
    start: Date;
    end: Date;
    preset?: string;
  }) => void;
  initialStart?: Date;
  initialEnd?: Date;
  title?: string;
}

interface PresetOption {
  label: string;
  value: string;
  getRange: () => { start: Date; end: Date };
}

function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getYesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

const PRESETS: PresetOption[] = [
  {
    label: "Today",
    value: "today",
    getRange: () => {
      const today = getToday();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { start: today, end: tomorrow };
    },
  },
  {
    label: "Yesterday",
    value: "yesterday",
    getRange: () => {
      const yesterday = getYesterday();
      const today = getToday();
      return { start: yesterday, end: today };
    },
  },
  {
    label: "This Week",
    value: "this-week",
    getRange: () => {
      const start = getStartOfWeek();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    label: "Last 7 Days",
    value: "last-7-days",
    getRange: () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = subtractDays(end, 7);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    label: "This Month",
    value: "this-month",
    getRange: () => {
      const start = getStartOfMonth();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    label: "Last 30 Days",
    value: "last-30-days",
    getRange: () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = subtractDays(end, 30);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
];

export function DateRangePickerSheet({
  isOpen,
  onClose,
  onApply,
  initialStart,
  initialEnd,
  title = "Select Date Range",
}: DateRangePickerSheetProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState<Date | null>(initialStart || null);
  const [customEnd, setCustomEnd] = useState<Date | null>(initialEnd || null);

  const isCustomMode = selectedPreset === "custom";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      gap: 16,
    },
    presetsContainer: {
      gap: 8,
    },
    presetsLabel: {
      ...typography.footnote,
      color: colors.textTertiary,
      fontWeight: "700",
      marginBottom: 4,
    },
    presetsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    customModeContainer: {
      gap: 12,
      paddingTop: 8,
    },
    dateFieldContainer: {
      gap: 6,
    },
    dateFieldLabel: {
      ...typography.footnote,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    dateField: {
      alignItems: "center",
      borderColor: colors.borderLight,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: 10,
      minHeight: 44,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    dateFieldText: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
    dateFieldPlaceholder: {
      color: colors.textTertiary,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
      paddingTop: 8,
    },
    cancelButton: {
      flex: 1,
    },
    applyButton: {
      flex: 1,
    },
  });

  const handlePresetSelect = (presetValue: string) => {
    triggerSelectionHaptic();
    setSelectedPreset(presetValue);
    if (presetValue !== "custom") {
      setCustomStart(null);
      setCustomEnd(null);
    }
  };

  const handleApply = () => {
    if (isCustomMode) {
      if (!customStart || !customEnd) {
        return;
      }
      onApply({
        start: customStart,
        end: customEnd,
      });
    } else if (selectedPreset) {
      const preset = PRESETS.find((p) => p.value === selectedPreset);
      if (preset) {
        const range = preset.getRange();
        onApply({
          start: range.start,
          end: range.end,
          preset: selectedPreset,
        });
      }
    }
    onClose();
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const canApply = isCustomMode
    ? customStart && customEnd
    : selectedPreset && selectedPreset !== "custom";

  return (
    <GlassSheetModal
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={["55%", "85%"]}
      title={title}
    >
      <View style={styles.container}>
        <View style={styles.presetsContainer}>
          <Text style={styles.presetsLabel}>Quick Presets</Text>
          <View style={styles.presetsGrid}>
            {PRESETS.map((preset) => (
              <GlassPill
                key={preset.value}
                label={preset.label}
                onPress={() => handlePresetSelect(preset.value)}
                selected={selectedPreset === preset.value}
                size="sm"
                variant="tinted"
              />
            ))}
            <GlassPill
              label="Custom"
              onPress={() => handlePresetSelect("custom")}
              selected={isCustomMode}
              size="sm"
              variant="tinted"
            />
          </View>
        </View>

        {isCustomMode && (
          <View style={styles.customModeContainer}>
            <View style={styles.dateFieldContainer}>
              <Text style={styles.dateFieldLabel}>From</Text>
              <Pressable
                onPress={() => {
                  // Date picker integration would go here
                  // For now, this is a placeholder for the UI structure
                }}
                style={styles.dateField}
              >
                <Text
                  style={[
                    styles.dateFieldText,
                    !customStart && styles.dateFieldPlaceholder,
                  ]}
                >
                  {customStart ? formatDate(customStart) : "Select start date"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.dateFieldContainer}>
              <Text style={styles.dateFieldLabel}>To</Text>
              <Pressable
                onPress={() => {
                  // Date picker integration would go here
                  // For now, this is a placeholder for the UI structure
                }}
                style={styles.dateField}
              >
                <Text
                  style={[
                    styles.dateFieldText,
                    !customEnd && styles.dateFieldPlaceholder,
                  ]}
                >
                  {customEnd ? formatDate(customEnd) : "Select end date"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <GlassButton
            label="Cancel"
            onPress={onClose}
            variant="secondary"
            size="md"
            style={styles.cancelButton}
          />
          <GlassButton
            label="Apply"
            onPress={handleApply}
            variant="primary"
            size="md"
            style={styles.applyButton}
            disabled={!canApply}
          />
        </View>
      </View>
    </GlassSheetModal>
  );
}
