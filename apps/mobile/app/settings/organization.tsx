import {
  useEffect,
  useState,
} from "react";
import {
  Alert,
  StyleSheet,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import {
  useOrganization,
  useUpdateOrganizationMutation,
} from "@/lib/queries/settings";
import { useThemeColors } from "@/theme";

export default function OrganizationSettingsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const organizationQuery = useOrganization();
  const updateMutation = useUpdateOrganizationMutation();
  const organization = organizationQuery.data;
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    if (!organization) {
      return;
    }

    setName((current) => current || organization.name);
    setAddress((current) => current || organization.address || "");
    setPhone((current) => current || organization.phone || "");
    setEmail((current) => current || organization.email || "");
    setTimezone((current) => current || organization.timezone || "");
  }, [organization]);

  return (
    <ScreenContainer
      onRefresh={() => {
        void organizationQuery.refetch();
      }}
      refreshing={organizationQuery.isRefetching}
      subtitle="Real organization settings update path."
      title="Organization"
    >
      <SectionCard title="Organization profile">
        <View style={styles.stack}>
          <TextField label="Name" onChangeText={setName} value={name} />
          <TextField label="Address" onChangeText={setAddress} value={address} />
          <TextField label="Phone" onChangeText={setPhone} value={phone} />
          <TextField label="Email" onChangeText={setEmail} value={email} />
          <TextField label="Timezone" onChangeText={setTimezone} value={timezone} />
          <Button
            label="Save Organization"
            loading={updateMutation.isPending}
            onPress={() => {
              void updateMutation
                .mutateAsync({
                  address,
                  email,
                  name,
                  phone,
                  timezone,
                })
                .then(() => {
                  Alert.alert("Saved", "Organization settings were updated.");
                });
            }}
          />
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    stack: {
      gap: 16,
    },
  });
}
