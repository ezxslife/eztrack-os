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
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { useCreateVisitorMutation } from "@/lib/queries/visitors";
import { useThemeColors } from "@/theme";

export default function NewVisitorScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const createMutation = useCreateVisitorMutation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [hostName, setHostName] = useState("");
  const [hostDepartment, setHostDepartment] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [expectedTime, setExpectedTime] = useState("");

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !purpose.trim()) {
      Alert.alert("Required fields", "First name, last name, and purpose are required.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        company: company || undefined,
        email: email || undefined,
        expectedDate: expectedDate || undefined,
        expectedTime: expectedTime || undefined,
        firstName: firstName.trim(),
        hostDepartment: hostDepartment || undefined,
        hostName: hostName || undefined,
        lastName: lastName.trim(),
        phone: phone || undefined,
        purpose: purpose.trim(),
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Create failed",
        error instanceof Error ? error.message : "Could not create the visit."
      );
    }
  };

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Create Visit</Text>
          <Text style={styles.heroCopy}>
            Front-desk intake with the same live visitor table used by web.
          </Text>
        </MaterialSurface>
      }
      subtitle="Create a new visitor intake record."
      title="New Visitor"
    >
      <SectionCard title="Visitor">
        <View style={styles.stack}>
          <TextField label="First name" onChangeText={setFirstName} value={firstName} />
          <TextField label="Last name" onChangeText={setLastName} value={lastName} />
          <TextField label="Purpose" onChangeText={setPurpose} value={purpose} />
        </View>
      </SectionCard>

      <SectionCard title="Host and schedule">
        <View style={styles.stack}>
          <TextField label="Host name" onChangeText={setHostName} value={hostName} />
          <TextField
            label="Host department"
            onChangeText={setHostDepartment}
            value={hostDepartment}
          />
          <TextField label="Expected date" onChangeText={setExpectedDate} placeholder="2026-04-08" value={expectedDate} />
          <TextField label="Expected time" onChangeText={setExpectedTime} placeholder="14:30" value={expectedTime} />
        </View>
      </SectionCard>

      <SectionCard title="Contact">
        <View style={styles.stack}>
          <TextField label="Company" onChangeText={setCompany} value={company} />
          <TextField label="Email" keyboardType="email-address" onChangeText={setEmail} value={email} />
          <TextField label="Phone" keyboardType="phone-pad" onChangeText={setPhone} value={phone} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Create Visitor"
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
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    hero: {
      gap: 8,
    },
    heroCopy: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "700",
    },
    stack: {
      gap: 16,
    },
  });
}
