import { View } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";

const integrations = [
  { detail: "Project: eztrack-prod", name: "Supabase", status: "Connected" },
  { detail: "smtp.sendgrid.net:587", name: "Email (SMTP)", status: "Connected" },
  { detail: "Twilio account configured", name: "SMS", status: "Connected" },
  { detail: "Configured in admin tools", name: "Slack", status: "Disconnected" },
  { detail: "Configured in admin tools", name: "Webhooks", status: "Disconnected" },
];

export default function IntegrationsSettingsScreen() {
  return (
    <ScreenContainer
      subtitle="Connection status for messaging and operations tools."
      title="Integrations"
    >
      <View style={{ gap: 8 }}>
        <SectionHeader title="Overview" />
        <GroupedCard>
          {integrations.map((integration, index) => (
            <View key={integration.name}>
              {index > 0 ? <GroupedCardDivider /> : null}
              <SettingsListRow
                label={integration.name}
                subtitle={integration.detail}
                value={integration.status}
              />
            </View>
          ))}
        </GroupedCard>
      </View>
    </ScreenContainer>
  );
}
