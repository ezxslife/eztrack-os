import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { useThemeColors } from "@/theme";

const integrations = [
  { detail: "Project: eztrack-prod", name: "Supabase", status: "Connected" },
  { detail: "smtp.sendgrid.net:587", name: "Email (SMTP)", status: "Connected" },
  { detail: "Twilio account configured", name: "SMS", status: "Connected" },
  { detail: "Managed on web", name: "Slack", status: "Disconnected" },
  { detail: "Managed on web", name: "Webhooks", status: "Disconnected" },
];

export default function IntegrationsSettingsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <ScreenContainer
      subtitle="Read-only parity. Integration configuration remains web-owned."
      title="Integrations"
    >
      <SectionCard title="Managed on web">
        <Text style={styles.copy}>
          Mobile shows current integration posture but does not expose fake connect or configure actions where backend workflows are not yet mobile-safe.
        </Text>
      </SectionCard>
      <SectionCard title="Integration status">
        <View style={styles.stack}>
          {integrations.map((integration) => (
            <View key={integration.name} style={styles.row}>
              <Text style={styles.title}>{integration.name}</Text>
              <Text style={styles.meta}>{integration.status}</Text>
              <Text style={styles.meta}>{integration.detail}</Text>
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
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 4,
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
