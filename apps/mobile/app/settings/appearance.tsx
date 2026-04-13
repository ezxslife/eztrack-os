import { StyleSheet, View } from "react-native";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { RadioGroup, type RadioOption } from "@/components/ui/RadioGroup";
import { useUIStore } from "@/stores/ui-store";

export default function AppearanceScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);

  const colorSchemePreference = useUIStore((state: any) => state.colorSchemePreference);
  const setColorSchemePreference = useUIStore(
    (state: any) => state.setColorSchemePreference
  );

  const options: RadioOption[] = [
    {
      label: "Light",
      value: "light",
      sublabel: "Always use light theme",
    },
    {
      label: "Dark",
      value: "dark",
      sublabel: "Always use dark theme",
    },
    {
      label: "System Default",
      value: "system",
      sublabel: "Match device settings",
    },
  ];

  return (
    <ScreenContainer
      gutter="none"
      title="Appearance"
    >

      <View style={styles.section}>
        <SectionCard title="Theme">
          <RadioGroup
            options={options}
            value={colorSchemePreference}
            onValueChange={(value: any) => {
              setColorSchemePreference(value as any);
            }}
          />
        </SectionCard>
      </View>

      <View style={styles.section}>
        <SectionCard title="Preview">
          <View style={[styles.previewCard, { backgroundColor: colors.surfaceFrosted }]}>
            <View
              style={[
                styles.previewSwatch,
                { backgroundColor: colors.primaryInk },
              ]}
            />
            <View style={styles.previewText}>
              <View
                style={[
                  styles.previewLine,
                  { backgroundColor: colors.textPrimary },
                ]}
              />
              <View
                style={[
                  styles.previewLine,
                  { backgroundColor: colors.textSecondary },
                  styles.previewLineSmall,
                ]}
              />
            </View>
          </View>
        </SectionCard>
      </View>
    </ScreenContainer>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    section: {
      paddingHorizontal: layout.horizontalPadding,
      marginBottom: 16,
    },
    previewCard: {
      borderRadius: 12,
      borderColor: colors.borderLight,
      borderWidth: 1,
      padding: 16,
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
    },
    previewSwatch: {
      width: 56,
      height: 56,
      borderRadius: 12,
      flexShrink: 0,
    },
    previewText: {
      flex: 1,
      gap: 8,
    },
    previewLine: {
      height: 8,
      borderRadius: 4,
    },
    previewLineSmall: {
      width: "70%",
    },
  });
}
