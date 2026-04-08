import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { useThemeColors } from "@/theme";

const templates = [
  "Incident Report",
  "Use of Force Report",
  "Arrest Report",
  "Trespass Warning",
  "Lost & Found Form",
];

export default function FormTemplatesSettingsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <ScreenContainer
      subtitle="Read-only parity. Form template management is still web-owned."
      title="Form Templates"
    >
      <SectionCard title="Managed on web">
        <Text style={styles.copy}>
          Mobile exposes the form template catalog without pretending those templates can be edited locally before backend support exists.
        </Text>
      </SectionCard>
      <SectionCard title="Current templates">
        <View style={styles.stack}>
          {templates.map((template) => (
            <View key={template} style={styles.row}>
              <Text style={styles.title}>{template}</Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    copy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      padding: 14,
    },
    stack: {
      gap: 12,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
