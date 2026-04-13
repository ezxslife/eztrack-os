import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import { GlassButton } from "@/components/ui/glass/GlassButton";
import { GlassPill } from "@/components/ui/glass/GlassPill";
import { GlassSheetBackground } from "@/components/ui/glass/GlassSheetBackground";
import { GlassSwitch } from "@/components/ui/glass/GlassSwitch";
import { triggerHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeSpacing, useThemeTypography } from "@/theme";

export interface FilterSection {
  key: string;
  label: string;
  type: "chips" | "date-range" | "toggle";
  options?: { label: string; value: string }[];
  value?: any;
}

export interface FilterSheetProps {
  isOpen: boolean;
  onApply: (values: Record<string, any>) => void;
  onClose: () => void;
  onReset: () => void;
  sections: FilterSection[];
  title?: string;
  values: Record<string, any>;
}

export function FilterSheet({
  isOpen,
  onApply,
  onClose,
  onReset,
  sections,
  title = "Filters",
  values,
}: FilterSheetProps) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();
  const modalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["60%", "88%"], []);
  const [localValues, setLocalValues] = useState<Record<string, any>>(values);

  useEffect(() => {
    if (isOpen) {
      setLocalValues(values);
      modalRef.current?.present();
      return;
    }

    modalRef.current?.dismiss();
  }, [isOpen, values]);

  const activeFilterCount = Object.values(localValues).filter((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "boolean") {
      return value;
    }

    return value !== null && value !== undefined && value !== "";
  }).length;

  return (
    <BottomSheetModal
      ref={modalRef}
      backdropComponent={(props) => <BottomSheetBackdrop {...props} opacity={0.35} />}
      backgroundComponent={() => <GlassSheetBackground />}
      onDismiss={onClose}
      snapPoints={snapPoints}
    >
      <BottomSheetView style={[styles.container, { paddingHorizontal: spacing[4] }]}>
        <View style={[styles.header, { marginBottom: spacing[4] }]}>
          <Text style={[typography.headline, { color: colors.textPrimary }]}>{title}</Text>
          {activeFilterCount > 0 ? (
            <Text style={[typography.caption1, { color: colors.textTertiary }]}>
              {activeFilterCount} active
            </Text>
          ) : null}
        </View>

        <BottomSheetScrollView showsVerticalScrollIndicator={false}>
          {sections.map((section) => {
            if (section.type === "chips") {
              const selectedValues: string[] = localValues[section.key] ?? [];

              return (
                <View key={section.key} style={[styles.section, { marginBottom: spacing[4] }]}>
                  <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: "600" }]}>
                    {section.label}
                  </Text>
                  <View style={[styles.wrapRow, { gap: spacing[2], marginTop: spacing[2] }]}>
                    {section.options?.map((option) => {
                      const isSelected = selectedValues.includes(option.value);

                      return (
                        <GlassPill
                          key={option.value}
                          label={option.label}
                          onPress={() => {
                            triggerHaptic("light");
                            setLocalValues((current) => {
                              const currentValues: string[] = current[section.key] ?? [];
                              return {
                                ...current,
                                [section.key]: isSelected
                                  ? currentValues.filter((value) => value !== option.value)
                                  : [...currentValues, option.value],
                              };
                            });
                          }}
                          selected={isSelected}
                          variant={isSelected ? "tinted" : "outline"}
                        />
                      );
                    })}
                  </View>
                </View>
              );
            }

            if (section.type === "date-range") {
              const dateRange = localValues[section.key] ?? {};

              return (
                <View key={section.key} style={[styles.section, { marginBottom: spacing[4] }]}>
                  <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: "600" }]}>
                    {section.label}
                  </Text>
                  <View style={[styles.row, { gap: spacing[2], marginTop: spacing[2] }]}>
                    <Pressable
                      style={[
                        styles.dateField,
                        {
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.borderLight,
                          paddingHorizontal: spacing[3],
                          paddingVertical: spacing[2],
                        },
                      ]}
                    >
                      <Text style={[typography.body, { color: colors.textPrimary }]}>
                        {dateRange.from ?? "From"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.dateField,
                        {
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.borderLight,
                          paddingHorizontal: spacing[3],
                          paddingVertical: spacing[2],
                        },
                      ]}
                    >
                      <Text style={[typography.body, { color: colors.textPrimary }]}>
                        {dateRange.to ?? "To"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            }

            const enabled = Boolean(localValues[section.key]);

            return (
              <View
                key={section.key}
                style={[
                  styles.row,
                  styles.section,
                  { justifyContent: "space-between", marginBottom: spacing[4] },
                ]}
              >
                <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: "600" }]}>
                  {section.label}
                </Text>
                <GlassSwitch
                  onToggle={(nextValue) => {
                    triggerHaptic("light");
                    setLocalValues((current) => ({ ...current, [section.key]: nextValue }));
                  }}
                  value={enabled}
                />
              </View>
            );
          })}
          <View style={{ height: spacing[4] }} />
        </BottomSheetScrollView>

        <View
          style={[
            styles.footer,
            {
              borderTopColor: colors.borderLight,
              gap: spacing[2],
              paddingBottom: spacing[4],
              paddingTop: spacing[3],
            },
          ]}
        >
          <Pressable
            onPress={() => {
              triggerHaptic("light");
              setLocalValues({});
              onReset();
            }}
          >
            <Text style={[typography.subheadline, { color: colors.primaryInk, fontWeight: "600" }]}>
              Reset
            </Text>
          </Pressable>
          <GlassButton
            label="Apply"
            onPress={() => {
              triggerHaptic("medium");
              onApply(localValues);
              onClose();
            }}
            variant="primary"
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateField: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
  },
  section: {},
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
