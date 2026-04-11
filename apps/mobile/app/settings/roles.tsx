import { View } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";

const roles = ["Super Admin", "Admin", "Manager", "Supervisor", "Officer", "Staff"];

export default function RolesSettingsScreen() {
  return (
    <ScreenContainer
      subtitle="Review the roles available to your organization."
      title="Roles & Permissions"
    >
      <View style={{ gap: 8 }}>
        <SectionHeader title="Admin managed" />
        <GroupedCard>
          <SettingsListRow
            label="Role changes"
            subtitle="Permissions are managed by your admin team."
          />
        </GroupedCard>
      </View>

      <View style={{ gap: 8 }}>
        <SectionHeader title="Available roles" />
        <GroupedCard>
          {roles.map((role, index) => (
            <View key={role}>
              {index > 0 ? <GroupedCardDivider /> : null}
              <SettingsListRow label={role} />
            </View>
          ))}
        </GroupedCard>
      </View>
    </ScreenContainer>
  );
}
