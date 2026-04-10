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
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import {
  useUpdateVehicleMutation,
  useVehicleDetail,
} from "@/lib/queries/vehicles";
import { useThemeColors } from "@/theme";

const vehicleTypes = ["car", "truck", "van", "motorcycle"];
const ownerTypes = ["patron", "staff", "contact", "event"];

export default function EditVehicleScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const vehicleId = params.id ?? "";
  const detailQuery = useVehicleDetail(vehicleId);
  const updateMutation = useUpdateVehicleMutation(vehicleId);
  const vehicle = detailQuery.data;
  const [bootstrapped, setBootstrapped] = useState(false);
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
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!vehicle || bootstrapped) {
      return;
    }

    setVehicleType(vehicle.vehicleType);
    setOwnerType(vehicle.ownerType ?? "patron");
    setLicensePlate(vehicle.licensePlate ?? "");
    setLicenseState(vehicle.licenseState ?? "");
    setMake(vehicle.make);
    setModel(vehicle.model);
    setYear(vehicle.year === null ? "" : String(vehicle.year));
    setColor(vehicle.color ?? "");
    setVin(vehicle.vin ?? "");
    setOwnerId(vehicle.ownerId ?? "");
    setNotes(vehicle.notes ?? "");
    setBootstrapped(true);
  }, [bootstrapped, vehicle]);

  const handleSubmit = async () => {
    try {
      await updateMutation.mutateAsync({
        color: color || undefined,
        licensePlate: licensePlate || undefined,
        licenseState: licenseState || undefined,
        make: make.trim(),
        model: model.trim(),
        notes: notes || undefined,
        ownerId: ownerId || undefined,
        ownerType,
        vehicleType,
        vin: vin || undefined,
        year: year ? Number(year) : null,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not update the vehicle."
      );
    }
  };

  if (!vehicle) {
    return (
      <ScreenContainer subtitle="Loading vehicle" title="Edit Vehicle">
        <SectionCard title="Loading">
          <Text style={styles.heroCopy}>The vehicle is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Edit Vehicle</Text>
          <Text style={styles.heroCopy}>
            Update vehicle ownership, plate, and note context from mobile.
          </Text>
        </MaterialSurface>
      }
      subtitle={vehicle.vehicleType}
      title="Vehicle Update"
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
          <TextField label="Year" onChangeText={setYear} value={year} />
          <TextField label="Color" onChangeText={setColor} value={color} />
          <TextField label="VIN" onChangeText={setVin} value={vin} />
          <TextField label="Owner ID" onChangeText={setOwnerId} value={ownerId} />
          <TextField label="Notes" multiline onChangeText={setNotes} value={notes} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Save Vehicle"
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
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    hero: { gap: 8 },
    heroCopy: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
    heroTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "700" },
    stack: { gap: 16 },
  });
}
