import { useLocalSearchParams, useRouter } from "expo-router";
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
import { useUpdateFoundItemStatusMutation } from "@/lib/queries/lost-found";
import { useThemeColors } from "@/theme";

export default function ClaimFoundItemScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const itemId = params.id ?? "";
  const claimMutation = useUpdateFoundItemStatusMutation(itemId);
  const [claimantName, setClaimantName] = useState("");

  const handleSubmit = async () => {
    if (!claimantName.trim()) {
      Alert.alert("Claimant required", "Enter the claimant name before saving.");
      return;
    }

    try {
      await claimMutation.mutateAsync({
        returnedTo: claimantName.trim(),
        status: "pending_return",
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Claim failed",
        error instanceof Error ? error.message : "Could not claim the item."
      );
    }
  };

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Claim Found Item</Text>
          <Text style={styles.heroCopy}>
            Capture the claimant name and move the item into pending return.
          </Text>
        </MaterialSurface>
      }
      subtitle="Claim a found item."
      title="Claim Item"
    >
      <SectionCard title="Claimant">
        <View style={styles.stack}>
          <TextField label="Claimant name" onChangeText={setClaimantName} value={claimantName} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Save Claim"
              loading={claimMutation.isPending}
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
