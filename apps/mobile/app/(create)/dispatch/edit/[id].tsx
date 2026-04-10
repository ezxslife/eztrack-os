import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import {
  useDispatchDetail,
  useUpdateDispatchMutation,
} from "@/lib/queries/dispatches";
import { useThemeColors } from "@/theme";

const priorities = ["critical", "high", "medium", "low"];
const dispatchCodes = ["SEC", "MED", "C2", "OPS", "ALARM"];

export default function EditDispatchScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const dispatchId = params.id ?? "";
  const detailQuery = useDispatchDetail(dispatchId);
  const updateMutation = useUpdateDispatchMutation();
  const dispatch = detailQuery.data;
  const [dispatchCode, setDispatchCode] = useState("SEC");
  const [priority, setPriority] = useState("high");
  const [description, setDescription] = useState("");
  const [sublocation, setSublocation] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [callSource, setCallSource] = useState("radio");

  useEffect(() => {
    if (!dispatch) {
      return;
    }

    setCallSource(dispatch.callSource ?? "radio");
    setDescription(dispatch.description ?? "");
    setDispatchCode(dispatch.dispatchCode);
    setPriority(dispatch.priority);
    setReporterName(dispatch.reporterName ?? "");
    setReporterPhone(dispatch.reporterPhone ?? "");
    setSublocation(dispatch.sublocation ?? "");
  }, [dispatch]);

  const handleSubmit = async () => {
    try {
      await updateMutation.mutateAsync({
        callSource,
        description,
        dispatchCode,
        dispatchId,
        priority: priority as any,
        reporterName: reporterName || undefined,
        reporterPhone: reporterPhone || undefined,
        sublocation: sublocation || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Update failed",
        error instanceof Error ? error.message : "The dispatch could not be updated."
      );
    }
  };

  if (!dispatch) {
    return (
      <ScreenContainer subtitle="Loading detail" title="Edit Dispatch">
        <SectionCard title="Loading">
          <Text style={styles.copy}>The dispatch detail is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer subtitle="Real dispatch update mutation." title="Edit Dispatch">
      <SectionCard title="Dispatch code">
        <FilterChips
          onSelect={setDispatchCode}
          options={dispatchCodes}
          selected={dispatchCode}
        />
      </SectionCard>

      <SectionCard title="Priority">
        <FilterChips
          onSelect={setPriority}
          options={priorities}
          selected={priority}
        />
      </SectionCard>

      <SectionCard title="Dispatch details">
        <View style={styles.stack}>
          <TextField
            label="Description"
            multiline
            numberOfLines={4}
            onChangeText={setDescription}
            placeholder="Describe the call"
            value={description}
          />
          <TextField
            label="Sublocation"
            onChangeText={setSublocation}
            placeholder="Turnstiles"
            value={sublocation}
          />
          <TextField
            label="Reporter name"
            onChangeText={setReporterName}
            placeholder="Operations lead"
            value={reporterName}
          />
          <TextField
            label="Reporter phone"
            onChangeText={setReporterPhone}
            placeholder="555-0100"
            value={reporterPhone}
          />
          <TextField
            label="Call source"
            onChangeText={setCallSource}
            placeholder="radio"
            value={callSource}
          />
          <View style={styles.actions}>
            <Button
              label="Cancel"
              onPress={() => router.back()}
              variant="secondary"
            />
            <Button
              label="Save Changes"
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
    copy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    stack: {
      gap: 16,
    },
  });
}
