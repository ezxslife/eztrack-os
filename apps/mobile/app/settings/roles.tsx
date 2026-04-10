import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { useThemeColors } from "@/theme";

const roles = ["Super Admin", "Admin", "Manager", "Supervisor", "Officer", "Staff"];

export default function RolesSettingsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <ScreenContainer
      subtitle="Read-only parity. Role matrix is still managed on web."
      title="Roles & Permissions"
    >
      <SectionCard title="Managed on web">
        <Text style={styles.copy}>
          The current web app still treats roles and permissions as a prototype surface. Mobile keeps the screen visible but does not expose fake save actions.
        </Text>
      </SectionCard>
      <SectionCard title="Current roles">
        <View style={styles.stack}>
          {roles.map((role) => (
            <View key={role} style={styles.row}>
              <Text style={styles.title}>{role}</Text>
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
