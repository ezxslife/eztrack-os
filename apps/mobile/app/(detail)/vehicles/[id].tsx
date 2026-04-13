import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { HeaderEditButton } from "@/navigation/header-buttons";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  useDeleteVehicleMutation,
  useVehicleDetail,
} from "@/lib/queries/vehicles";
import { useThemeColors } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function VehicleDetailScreen() {
  const colors = useThemeColors();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, layout);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const vehicleId = params.id ?? "";
  const detailQuery = useVehicleDetail(vehicleId);
  const deleteMutation = useDeleteVehicleMutation(vehicleId);
  const vehicle = detailQuery.data;

  if (!vehicle) {
    return (
      <ScreenContainer subtitle="Loading vehicle" title="Vehicle">
        <SectionCard title="Loading">
          <Text style={styles.copy}>The vehicle is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <>
      <Stack.Screen options={{
        headerRight: () => (
          <NativeHeaderActionGroup>
            <HeaderEditButton onPress={() => {
              router.push({
                pathname: "/(create)/vehicles/edit/[id]",
                params: { id: vehicle.id },
              });
            }} />
          </NativeHeaderActionGroup>
        ),
      }} />
      <ScreenContainer
        onRefresh={() => {
          void detailQuery.refetch();
        }}
        refreshing={detailQuery.isRefetching}
        subtitle="Vehicle registry detail and real edit/delete control."
        title={vehicle.licensePlate ?? "No Plate"}
      >
      <SectionCard subtitle={vehicle.vehicleType} title="Overview">
        <View style={styles.stack}>
          <Text style={styles.copy}>
            {vehicle.year ? `${vehicle.year} ` : ""}{vehicle.make} {vehicle.model}
          </Text>
          <Text style={styles.meta}>
            Color {vehicle.color ?? "Unknown"} · License state {vehicle.licenseState ?? "Unknown"}
          </Text>
          <Text style={styles.meta}>
            Owner {vehicle.ownerType ?? "Unknown"} · {vehicle.ownerId ?? "No owner linked"}
          </Text>
          <Text style={styles.meta}>VIN {vehicle.vin ?? "Not captured"}</Text>
          <Text style={styles.copy}>{vehicle.notes ?? "No notes recorded."}</Text>
          <View style={styles.actions}>
            <Button
              label="Edit Vehicle"
              onPress={() =>
                router.push({
                  pathname: "/vehicles/edit/[id]",
                  params: { id: vehicle.id },
                })
              }
              variant="secondary"
            />
            <Button
              label="Delete Vehicle"
              loading={deleteMutation.isPending}
              onPress={() => {
                Alert.alert("Delete vehicle", "Remove this vehicle from active views?", [
                  { style: "cancel", text: "Cancel" },
                  {
                    style: "destructive",
                    text: "Delete",
                    onPress: () => {
                      void deleteMutation.mutateAsync().then(() => {
                        router.back();
                      });
                    },
                  },
                ]);
              }}
              variant="plain"
            />
          </View>
        </View>
      </SectionCard>
    </ScreenContainer>
    </>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    copy: { color: colors.textPrimary, fontSize: 15, lineHeight: 22 },
    meta: { color: colors.textTertiary, fontSize: 13, lineHeight: 18 },
    stack: { gap: 12 },
  });
}
