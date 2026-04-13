import { useRouter, Stack } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { HeaderCancelButton, HeaderSaveButton } from "@/navigation/header-buttons";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { useCreateContactMutation } from "@/lib/queries/contacts";
import { useThemeColors } from "@/theme";

const categories = ["vendor", "law_enforcement", "emergency_services", "media", "other"];
const contactTypes = ["individual", "organization"];

export default function NewContactScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const createMutation = useCreateContactMutation();
  const [category, setCategory] = useState("vendor");
  const [contactType, setContactType] = useState("individual");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const handleSave = async () => {
    if (contactType === "organization" && !organizationName.trim()) {
      Alert.alert("Organization required", "Add an organization name before saving.");
      return;
    }

    if (contactType !== "organization" && !firstName.trim() && !lastName.trim()) {
      Alert.alert("Name required", "Add a first name or last name before saving.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        address: address || undefined,
        category,
        contactType,
        email: email || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        organizationName: organizationName || undefined,
        phone: phone || undefined,
        title: title || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Create failed",
        error instanceof Error ? error.message : "Could not create the contact."
      );
    }
  };

  return (
    <>
      <Stack.Screen options={{
        headerLeft: () => (
          <HeaderCancelButton onPress={() => router.back()} />
        ),
        headerRight: () => (
          <NativeHeaderActionGroup>
            <HeaderSaveButton
              loading={createMutation.isPending}
              onPress={() => {
                void handleSave();
              }}
            />
          </NativeHeaderActionGroup>
        ),
      }} />
      <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Create Contact</Text>
          <Text style={styles.heroCopy}>
            Add a real vendor, responder, or operational contact from mobile.
          </Text>
        </MaterialSurface>
      }
      subtitle="Create a live contact."
      title="New Contact"
    >
      <SectionCard title="Type">
        <View style={styles.stack}>
          <FilterChips onSelect={setCategory} options={categories} selected={category} />
          <FilterChips onSelect={setContactType} options={contactTypes} selected={contactType} />
        </View>
      </SectionCard>

      <SectionCard title="Identity">
        <View style={styles.stack}>
          <TextField label="First name" onChangeText={setFirstName} value={firstName} />
          <TextField label="Last name" onChangeText={setLastName} value={lastName} />
          <TextField label="Organization" onChangeText={setOrganizationName} value={organizationName} />
          <TextField label="Title" onChangeText={setTitle} value={title} />
        </View>
      </SectionCard>

      <SectionCard title="Contact">
        <View style={styles.stack}>
          <TextField label="Phone" keyboardType="phone-pad" onChangeText={setPhone} value={phone} />
          <TextField label="Email" keyboardType="email-address" onChangeText={setEmail} value={email} />
          <TextField label="Address" onChangeText={setAddress} value={address} />
          <View style={styles.actions} />
        </View>
      </SectionCard>
    </ScreenContainer>
    </>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    hero: { gap: 8 },
    heroCopy: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
    heroTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "700" },
    stack: { gap: 16 },
  });
}
