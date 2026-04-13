import { useCallback } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { uiTokens } from "@/theme/uiTokens";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { FormField } from "@/components/forms/FormField";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";

interface ImagePickerFieldImage {
  id: string;
  uri: string;
}

interface ImagePickerFieldProps {
  disabled?: boolean;
  error?: string;
  images: ImagePickerFieldImage[];
  label: string;
  maxImages?: number;
  onAdd: () => void;
  onRemove: (id: string) => void;
  required?: boolean;
}

export function ImagePickerField({
  disabled = false,
  error,
  images,
  label,
  maxImages = 5,
  onAdd,
  onRemove,
  required = false,
}: ImagePickerFieldProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const canAddMore = images.length < maxImages;
  const imageCount = images.length;

  const styles = StyleSheet.create({
    addButton: {
      alignItems: "center",
      backgroundColor: colors.surfaceContainerLow,
      borderColor: colors.border,
      borderRadius: uiTokens.innerRadius,
      borderWidth: uiTokens.surfaceBorderWidth,
      flexShrink: 0,
      height: 100,
      justifyContent: "center",
      width: 100,
    },
    addButtonDisabled: {
      opacity: 0.5,
    },
    addButtonFocused: {
      backgroundColor: colors.surface,
      borderColor: colors.focusBorder,
    },
    addIcon: {
      marginBottom: 4,
    },
    addLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
      marginTop: 4,
    },
    container: {
      gap: 8,
    },
    counter: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    imageRemoveButton: {
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.4)",
      borderRadius: 20,
      height: 28,
      justifyContent: "center",
      position: "absolute" as const,
      right: 4,
      top: 4,
      width: 28,
    },
    imageThumbnail: {
      borderRadius: uiTokens.innerRadius,
      flexShrink: 0,
      height: 100,
      overflow: "hidden" as const,
      width: 100,
    },
    scrollView: {
      gap: 8,
    },
    statsContainer: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
  });

  const handleAdd = useCallback(() => {
    if (disabled || !canAddMore) return;
    triggerSelectionHaptic();
    onAdd();
  }, [disabled, canAddMore, onAdd]);

  const handleRemove = useCallback(
    (id: string) => {
      triggerSelectionHaptic();
      onRemove(id);
    },
    [onRemove]
  );

  return (
    <FormField error={error} label={label} required={required}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {images.map((image) => (
            <View key={image.id} style={styles.imageThumbnail}>
              <Image
                source={{ uri: image.uri }}
                style={StyleSheet.absoluteFillObject}
              />
              <Pressable
                onPress={() => handleRemove(image.id)}
                style={styles.imageRemoveButton}
              >
                <AppSymbol
                  color="#FFFFFF"
                  fallbackName="close"
                  iosName="xmark"
                  size={14}
                />
              </Pressable>
            </View>
          ))}

          {canAddMore && (
            <Pressable
              disabled={disabled}
              onPress={handleAdd}
              style={({ pressed }) => [
                styles.addButton,
                disabled && styles.addButtonDisabled,
                pressed && !disabled && styles.addButtonFocused,
              ]}
            >
              <View style={styles.addIcon}>
                <AppSymbol
                  color={colors.textSecondary}
                  fallbackName="add"
                  iosName="plus"
                  size={20}
                />
              </View>
              <Text style={styles.addLabel}>Add</Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={styles.statsContainer}>
          <Text style={styles.counter}>
            {imageCount}/{maxImages} photos
          </Text>
        </View>
      </View>
    </FormField>
  );
}
