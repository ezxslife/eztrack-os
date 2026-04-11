import { View } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";

const templates = [
  "Incident Report",
  "Use of Force Report",
  "Arrest Report",
  "Trespass Warning",
  "Lost & Found Form",
];

export default function FormTemplatesSettingsScreen() {
  return (
    <ScreenContainer
      subtitle="Standard forms available to your team."
      title="Form Templates"
    >
      <View style={{ gap: 8 }}>
        <SectionHeader title="Availability" />
        <GroupedCard>
          <SettingsListRow
            label="Admin managed"
            subtitle="Templates are managed centrally and sync here for reference."
          />
        </GroupedCard>
      </View>

      <View style={{ gap: 8 }}>
        <SectionHeader title="Available templates" />
        <GroupedCard>
          {templates.map((template, index) => (
            <View key={template}>
              {index > 0 ? <GroupedCardDivider /> : null}
              <SettingsListRow label={template} />
            </View>
          ))}
        </GroupedCard>
      </View>
    </ScreenContainer>
  );
}
