import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useEffect,
  useState,
} from "react";
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
import {
  useUpdateVisitorMutation,
  useVisitorDetail,
} from "@/lib/queries/visitors";
import { useThemeColors } from "@/theme";

export default function EditVisitorScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const visitorId = params.id ?? "";
  const detailQuery = useVisitorDetail(visitorId);
  const updateMutation = useUpdateVisitorMutation(visitorId);
  const visitor = detailQuery.data;
  const [bootstrapped, setBootstrapped] = useState(false);
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
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");

  useEffect(() => {
    if (!visitor || bootstrapped) {
      return;
    }

    setFirstName(visitor.firstName);
    setLastName(visitor.lastName);
    setPurpose(visitor.purpose);
    setHostName(visitor.hostName ?? "");
    setHostDepartment(visitor.hostDepartment ?? "");
    setCompany(visitor.company ?? "");
    setEmail(visitor.email ?? "");
    setPhone(visitor.phone ?? "");
    setExpectedDate(visitor.expectedDate ?? "");
    setExpectedTime(visitor.expectedTime ?? "");
    setIdType(visitor.idType ?? "");
    setIdNumber(visitor.idNumber ?? "");
    setVehiclePlate(visitor.vehiclePlate ?? "");
    setBootstrapped(true);
  }, [bootstrapped, visitor]);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !purpose.trim()) {
      Alert.alert("Required fields", "First name, last name, and purpose are required.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        company: company || undefined,
        email: email || undefined,
        expectedDate: expectedDate || undefined,
        expectedTime: expectedTime || undefined,
        firstName: firstName.trim(),
        hostDepartment: hostDepartment || undefined,
        hostName: hostName || undefined,
        idNumber: idNumber || undefined,
        idType: idType || undefined,
        lastName: lastName.trim(),
        phone: phone || undefined,
        purpose: purpose.trim(),
        vehiclePlate: vehiclePlate || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not update the visitor."
      );
    }
  };

  if (!visitor) {
    return (
      <ScreenContainer subtitle="Loading visit" title="Edit Visitor">
        <SectionCard title="Loading">
          <Text style={styles.heroCopy}>The visit is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Edit Visit</Text>
          <Text style={styles.heroCopy}>
            Correct host, contact, and identity details without leaving the visit flow.
          </Text>
        </MaterialSurface>
      }
      subtitle={visitor.status}
      title="Visitor Update"
    >
      <SectionCard title="Visitor">
        <View style={styles.stack}>
          <TextField label="First name" onChangeText={setFirstName} value={firstName} />
          <TextField label="Last name" onChangeText={setLastName} value={lastName} />
          <TextField label="Purpose" onChangeText={setPurpose} value={purpose} />
        </View>
      </SectionCard>

      <SectionCard title="Host and contact">
        <View style={styles.stack}>
          <TextField label="Host name" onChangeText={setHostName} value={hostName} />
          <TextField label="Host department" onChangeText={setHostDepartment} value={hostDepartment} />
          <TextField label="Company" onChangeText={setCompany} value={company} />
          <TextField label="Email" keyboardType="email-address" onChangeText={setEmail} value={email} />
          <TextField label="Phone" keyboardType="phone-pad" onChangeText={setPhone} value={phone} />
        </View>
      </SectionCard>

      <SectionCard title="Schedule and identity">
        <View style={styles.stack}>
          <TextField label="Expected date" onChangeText={setExpectedDate} value={expectedDate} />
          <TextField label="Expected time" onChangeText={setExpectedTime} value={expectedTime} />
          <TextField label="ID type" onChangeText={setIdType} value={idType} />
          <TextField label="ID number" onChangeText={setIdNumber} value={idNumber} />
          <TextField label="Vehicle plate" onChangeText={setVehiclePlate} value={vehiclePlate} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Save Visitor"
              loading={updateMutation.isPending}
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
