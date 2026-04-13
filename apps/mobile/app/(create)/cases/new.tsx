import { useRouter, Stack } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { HeaderCancelButton, HeaderSaveButton } from "@/navigation/header-buttons";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { useCreateCaseMutation } from "@/lib/queries/cases";
import { useThemeColors } from "@/theme";

const caseTypes = ["Credential Fraud", "Property Damage", "Trespass", "Theft", "Assault"];
const escalationOptions = ["low", "medium", "high", "critical"];

export default function NewCaseScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const createMutation = useCreateCaseMutation();
  const [caseType, setCaseType] = useState(caseTypes[0]);
  const [escalationLevel, setEscalationLevel] = useState("medium");
  const [synopsis, setSynopsis] = useState("");

  const handleSave = () => {
    void createMutation
      .mutateAsync({
        caseType,
        escalationLevel,
        synopsis,
      })
      .then(() => {
        router.back();
      })
      .catch((error) => {
        Alert.alert(
          "Create failed",
          error instanceof Error ? error.message : "The case could not be created."
        );
      });
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
              onPress={handleSave}
            />
          </NativeHeaderActionGroup>
        ),
      }} />
      <ScreenContainer subtitle="Real case create mutation." title="New Case">
      <SectionCard title="Case type">
        <FilterChips
          onSelect={setCaseType}
          options={caseTypes}
          selected={caseType}
        />
      </SectionCard>

      <SectionCard title="Escalation level">
        <FilterChips
          onSelect={setEscalationLevel}
          options={escalationOptions}
          selected={escalationLevel}
        />
      </SectionCard>

      <SectionCard title="Synopsis">
        <View style={styles.stack}>
          <TextField
            label="Synopsis"
            multiline
            numberOfLines={5}
            onChangeText={setSynopsis}
            value={synopsis}
          />
          <View style={styles.actions} />
        </View>
      </SectionCard>
    </ScreenContainer>
    </>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    stack: {
      gap: 16,
    },
  });
}
