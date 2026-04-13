import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View, Image, Pressable } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { HeaderCancelButton } from "@/navigation/header-buttons";
import { useThemeColors, useThemeTypography, useThemeSpacing } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerSelectionHaptic, triggerNotificationHaptic } from "@/lib/haptics";

type CaptureMode = "camera" | "preview";

export default function PhotoCaptureScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [mode, setMode] = useState<CaptureMode>("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [frontCamera, setFrontCamera] = useState(false);

  const handleCapture = () => {
    triggerSelectionHaptic();
    // TODO: Wire to expo-camera to capture actual image
    // For now, simulate a captured image
    setCapturedImage("mock-image-uri");
    setMode("preview");
  };

  const handleGalleryPick = () => {
    triggerSelectionHaptic();
    // TODO: Wire to expo-image-picker
    // For now, simulate a picked image
    setCapturedImage("mock-gallery-uri");
    setMode("preview");
  };

  const handleSwitchCamera = () => {
    triggerSelectionHaptic();
    setFrontCamera(!frontCamera);
    // TODO: Wire to expo-camera camera flip
  };

  const handleRetake = () => {
    triggerSelectionHaptic();
    setCapturedImage(null);
    setCaption("");
    setMode("camera");
  };

  const handleUsePhoto = () => {
    if (!capturedImage) return;

    triggerNotificationHaptic("success");

    // TODO: Return photo data to calling screen via router params
    // Example: router.push({
    //   pathname: params.returnRoute as string,
    //   params: {
    //     photo: capturedImage,
    //     caption: caption,
    //   }
    // });

    console.log("Using photo:", { capturedImage, caption });

    // For now, just go back
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => <HeaderCancelButton />,
          title: "Capture Photo",
        }}
      />

      <ScreenContainer>
        {mode === "camera" ? (
          <View style={[styles.container, { gap: spacing[4] }]}>
            {/* Camera Placeholder */}
            <View
              style={[
                styles.cameraPreview,
                { backgroundColor: colors.surface },
              ]}
            >
              <AppSymbol name="camera.fill" size={64} color={colors.textTertiary} />
              <Text
                style={[
                  typography.caption1,
                  {
                    color: colors.textTertiary,
                    marginTop: spacing[2],
                  },
                ]}
              >
                Camera {frontCamera ? "(Front)" : "(Back)"}
              </Text>
            </View>

            {/* Bottom Controls */}
            <View
              style={[
                styles.controlBar,
                {
                  gap: spacing[4],
                  paddingHorizontal: layout.horizontalPadding,
                  paddingBottom: spacing[4],
                },
              ]}
            >
              {/* Gallery Button */}
              <Pressable
                onPress={handleGalleryPick}
                style={({ pressed }) => [
                  styles.sideButton,
                  {
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <AppSymbol
                  name="photo.stack"
                  size={28}
                  color={colors.primary}
                />
              </Pressable>

              {/* Capture Button */}
              <Pressable
                onPress={handleCapture}
                style={({ pressed }) => [
                  styles.captureButton,
                  {
                    opacity: pressed ? 0.8 : 1,
                    backgroundColor: colors.primary,
                    borderColor: colors.primaryLight,
                  },
                ]}
              >
                <View
                  style={[
                    styles.captureButtonInner,
                    { backgroundColor: colors.primary },
                  ]}
                />
              </Pressable>

              {/* Switch Camera Button */}
              <Pressable
                onPress={handleSwitchCamera}
                style={({ pressed }) => [
                  styles.sideButton,
                  {
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <AppSymbol
                  name="camera.rotate"
                  size={28}
                  color={colors.primary}
                />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.container, { gap: spacing[4] }]}>
            {/* Preview Image */}
            {capturedImage && (
              <View
                style={[
                  styles.previewImage,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Image
                  source={{ uri: capturedImage }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Caption Input */}
            <View style={{ paddingHorizontal: layout.horizontalPadding }}>
              <TextField
                label="Caption (Optional)"
                placeholder="Add notes about this photo..."
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Action Buttons */}
            <View
              style={{
                paddingHorizontal: layout.horizontalPadding,
                gap: spacing[2],
                paddingBottom: spacing[4],
              }}
            >
              <Button onPress={handleUsePhoto}>Use Photo</Button>
              <Button variant="tertiary" onPress={handleRetake}>
                Retake Photo
              </Button>
            </View>
          </View>
        )}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraPreview: {
    flex: 1,
    borderRadius: 12,
    margin: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    flex: 1,
    borderRadius: 12,
    margin: 16,
    overflow: "hidden",
  },
  controlBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});
