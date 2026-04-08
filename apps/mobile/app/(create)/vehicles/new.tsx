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
import { useCreateVehicleMutation } from "@/lib/queries/vehicles";
import { useThemeColors } from "@/theme";

const vehicleTypes = ["car", "truck", "van", "motorcycle"];
const ownerTypes = ["patron", "staff", "contact", "event"];

export default function NewVehicleScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const createMutation = useCreateVehicleMutation();
  const [vehicleType, setVehicleType] = useState("car");
  const [ownerType, setOwnerType] = useState("patron");
  const [licensePlate, setLicensePlate] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [vin, setVin] = useState("");
  const [ownerId, setOwnerId] = useState("");

  const handleSubmit = async () => {
    if (!make.trim() || !model.trim()) {
      Alert.alert("Vehicle required", "Make and model are required.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        color: color || undefined,
        licensePlate: licensePlate || undefined,
        licenseState: licenseState || undefined,
        make: make.trim(),
        model: model.trim(),
        ownerId: ownerId || undefined,
        ownerType,
        vehicleType,
        vin: vin || undefined,
        year: year ? Number(year) : null,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Create failed",
        error instanceof Error ? error.message : "Could not create the vehicle."
      );
    }
  };

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Create Vehicle</Text>
          <Text style={styles.heroCopy}>
            Register a staff, vendor, or patron vehicle from mobile.
          </Text>
        </MaterialSurface>
      }
      subtitle="Create a live vehicle record."
      title="New Vehicle"
    >
      <SectionCard title="Type">
        <View style={styles.stack}>
          <FilterChips onSelect={setVehicleType} options={vehicleTypes} selected={vehicleType} />
          <FilterChips onSelect={setOwnerType} options={ownerTypes} selected={ownerType} />
        </View>
      </SectionCard>

      <SectionCard title="Vehicle">
        <View style={styles.stack}>
          <TextField label="License plate" onChangeText={setLicensePlate} value={licensePlate} />
          <TextField label="License state" onChangeText={setLicenseState} value={licenseState} />
          <TextField label="Make" onChangeText={setMake} value={make} />
          <TextField label="Model" onChangeText={setModel} value={model} />
          <TextField label="Year" keyboardType="numeric" onChangeText={setYear} value={year} />
          <TextField label="Color" onChangeText={setColor} value={color} />
          <TextField label="VIN" onChangeText={setVin} value={vin} />
          <TextField label="Owner ID" onChangeText={setOwnerId} value={ownerId} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Create Vehicle"
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
