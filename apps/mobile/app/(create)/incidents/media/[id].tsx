import * as DocumentPicker from "expo-document-picker";
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
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import {
  useCreateIncidentMediaMutation,
  useIncidentDetail,
} from "@/lib/queries/incidents";
import { useNetworkStore } from "@/stores/network-store";
import { useThemeColors } from "@/theme";

const mediaTypes = ["image", "video", "audio", "document", "other"];

function inferMediaType(mimeType?: string | null) {
  if (!mimeType) {
    return "document";
  }

  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  return "document";
}

function formatBytes(value?: number | null) {
  if (!value) {
    return "Unknown size";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function IncidentMediaScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const incidentId = params.id ?? "";
  const detailQuery = useIncidentDetail(incidentId);
  const createMutation = useCreateIncidentMediaMutation();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const incident = detailQuery.data;
  const [selectedAsset, setSelectedAsset] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [mediaType, setMediaType] = useState("document");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: "*/*",
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      setSelectedAsset(asset);
      setMediaType(inferMediaType(asset.mimeType));
      if (!title.trim()) {
        setTitle(asset.name);
      }
    } catch (error) {
      Alert.alert(
        "Selection failed",
        error instanceof Error ? error.message : "Could not open the document picker."
      );
    }
  };

  const handleSubmit = async () => {
    if (!incident || !selectedAsset) {
      Alert.alert("File required", "Choose a file before uploading incident media.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        description: description.trim() || undefined,
        fileName: selectedAsset.name,
        fileSize: selectedAsset.size ?? undefined,
        fileUri: selectedAsset.uri,
        incidentId: incident.id,
        mediaType,
        mimeType: selectedAsset.mimeType ?? undefined,
        title: title.trim() || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Upload failed",
        error instanceof Error ? error.message : "Could not upload the incident media."
      );
    }
  };

  if (!incident) {
    return (
      <ScreenContainer subtitle="Loading incident" title="Add Media">
        <SectionCard title="Loading">
          <Text style={styles.heroCopy}>The incident is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={78} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Add Media</Text>
          <Text style={styles.heroCopy}>
            Upload evidence files into incident storage from the mobile app.
          </Text>
        </MaterialSurface>
      }
      subtitle={incident.recordNumber}
      title="Incident Media"
    >
      <SectionCard title="Attachment">
        <View style={styles.stack}>
          <Button
            disabled={!isOnline}
            label={selectedAsset ? "Choose a Different File" : "Choose File"}
            onPress={() => {
              void handlePickFile();
            }}
            variant="secondary"
          />
          {selectedAsset ? (
            <View style={styles.fileCard}>
              <Text style={styles.fileName}>{selectedAsset.name}</Text>
              <Text style={styles.meta}>
                {selectedAsset.mimeType ?? "Unknown type"} · {formatBytes(selectedAsset.size)}
              </Text>
            </View>
          ) : (
            <Text style={styles.meta}>No file selected yet.</Text>
          )}
          {!isOnline ? (
            <Text style={styles.meta}>
              Media upload is online-only and is disabled until connectivity returns.
            </Text>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard title="Media details">
        <View style={styles.stack}>
          <FilterChips onSelect={setMediaType} options={mediaTypes} selected={mediaType} />
          <TextField label="Title" onChangeText={setTitle} value={title} />
          <TextField
            label="Description"
            multiline
            onChangeText={setDescription}
            value={description}
          />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              disabled={!isOnline}
              label="Upload Media"
              loading={createMutation.isPending}
              onPress={handleSubmit}
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
    fileCard: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 16,
      gap: 6,
      padding: 14,
    },
    fileName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    hero: { gap: 8 },
    heroCopy: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
    heroTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "700" },
    meta: { color: colors.textTertiary, fontSize: 13 },
    stack: { gap: 16 },
  });
}
