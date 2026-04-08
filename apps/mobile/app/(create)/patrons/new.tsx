import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { useCreatePatronMutation } from "@/lib/queries/patrons";
import { useThemeColors } from "@/theme";

const flags = ["none", "watch", "vip", "warning", "banned"];

export default function NewPatronScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const createMutation = useCreatePatronMutation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [flag, setFlag] = useState("none");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [ticketType, setTicketType] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Name required", "First and last name are required.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        dob: dob || undefined,
        email: email || undefined,
        firstName: firstName.trim(),
        flag,
        idNumber: idNumber || undefined,
        idType: idType || undefined,
        lastName: lastName.trim(),
        notes: notes || undefined,
        phone: phone || undefined,
        ticketType: ticketType || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Create failed",
        error instanceof Error ? error.message : "Could not create the patron."
      );
    }
  };

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Create Patron</Text>
          <Text style={styles.heroCopy}>
            Add a patron record with flag state and contact context.
          </Text>
        </MaterialSurface>
      }
      subtitle="Create a live patron."
      title="New Patron"
    >
      <SectionCard title="Flag">
        <FilterChips onSelect={setFlag} options={flags} selected={flag} />
      </SectionCard>

      <SectionCard title="Identity">
        <View style={styles.stack}>
          <TextField label="First name" onChangeText={setFirstName} value={firstName} />
          <TextField label="Last name" onChangeText={setLastName} value={lastName} />
          <TextField label="DOB" onChangeText={setDob} value={dob} />
          <TextField label="Ticket type" onChangeText={setTicketType} value={ticketType} />
          <TextField label="ID type" onChangeText={setIdType} value={idType} />
          <TextField label="ID number" onChangeText={setIdNumber} value={idNumber} />
        </View>
      </SectionCard>

      <SectionCard title="Contact and notes">
        <View style={styles.stack}>
          <TextField label="Email" onChangeText={setEmail} value={email} />
          <TextField label="Phone" onChangeText={setPhone} value={phone} />
          <TextField label="Notes" multiline onChangeText={setNotes} value={notes} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Create Patron"
              loading={createMutation.isPending}
              onPress={() => {
                void handleSubmit();
              }}
            />
          </View>
        </View>
      </SectionCard>
    </ScreenContainer>
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
