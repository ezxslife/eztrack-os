import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  Easing,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { HeaderCancelButton } from "@/navigation/header-buttons";
import { useThemeColors, useThemeTypography, useThemeSpacing } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerSelectionHaptic, triggerNotificationHaptic } from "@/lib/haptics";

export default function ScannerScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();
  const layout = useAdaptiveLayout();
  const router = useRouter();

  const [manualEntry, setManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(true);
  const [flashlight, setFlashlight] = useState(false);
  const [borderAnim] = useState(new Animated.Value(0));

  // Animate border pulse when scanning
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(borderAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(borderAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isScanning, borderAnim]);

  const borderOpacity = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const handleManualEntry = () => {
    if (manualCode.trim()) {
      triggerNotificationHaptic("success");
      // TODO: Parse result and navigate to appropriate detail screen
      // Example: router.push(`/incidents/${manualCode}`);
      console.log("Scanned code:", manualCode);
      setManualCode("");
      setManualEntry(false);
    }
  };

  const handleToggleFlashlight = () => {
    triggerSelectionHaptic();
    setFlashlight(!flashlight);
    // TODO: Wire to expo-camera flashlight control
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => <HeaderCancelButton />,
          title: "Scanner",
        }}
      />

      <ScreenContainer>
        {!manualEntry ? (
          <View style={[styles.container, { gap: spacing[4] }]}>
            {/* Camera Placeholder */}
            <View
              style={[
                styles.cameraView,
                { backgroundColor: colors.surface, marginTop: spacing[4] },
              ]}
            >
              <AppSymbol name="camera.fill" size={48} color={colors.textTertiary} />
              <Text
                style={[
                  typography.caption1,
                  {
                    color: colors.textTertiary,
                    marginTop: spacing[2],
                    textAlign: "center",
                  },
                ]}
              >
                Camera will activate here
              </Text>
            </View>

            {/* Scanning Frame */}
            <View style={styles.frameWrapper}>
              <Animated.View
                style={[
                  styles.scanningFrame,
                  {
                    borderColor: colors.primary,
                    opacity: borderOpacity,
                  },
                ]}
              />
              <View style={[styles.cornerBracket, { borderColor: colors.primary }]} />
              <View
                style={[
                  styles.cornerBracket,
                  styles.cornerBracketTopRight,
                  { borderColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.cornerBracket,
                  styles.cornerBracketBottomLeft,
                  { borderColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.cornerBracket,
                  styles.cornerBracketBottomRight,
                  { borderColor: colors.primary },
                ]}
              />
            </View>

            {/* Instructions */}
            <Text
              style={[
                typography.body,
                {
                  color: colors.textPrimary,
                  textAlign: "center",
                  marginHorizontal: spacing[4],
                },
              ]}
            >
              Point your camera at a QR code or barcode
            </Text>

            {/* Flashlight Button */}
            <View style={{ paddingHorizontal: spacing[4] }}>
              <Button
                variant="secondary"
                onPress={handleToggleFlashlight}
                icon={flashlight ? "flashlight.off.fill" : "flashlight.fill"}
              >
                {flashlight ? "Flashlight Off" : "Flashlight On"}
              </Button>
            </View>

            {/* Manual Entry Button */}
            <View style={{ paddingHorizontal: spacing[4] }}>
              <Button
                variant="tertiary"
                onPress={() => {
                  triggerSelectionHaptic();
                  setManualEntry(true);
                }}
              >
                Enter Code Manually
              </Button>
            </View>
          </View>
        ) : (
          <View style={[styles.container, { gap: spacing[4] }]}>
            <Text
              style={[
                typography.title2,
                {
                  color: colors.text,
                  marginHorizontal: spacing[4],
                },
              ]}
            >
              Enter Code
            </Text>

            <View style={{ paddingHorizontal: spacing[4] }}>
              <TextField
                label="Code"
                placeholder="Scan or paste code"
                value={manualCode}
                onChangeText={setManualCode}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleManualEntry}
              />
            </View>

            <View style={{ paddingHorizontal: spacing[4], gap: spacing[2] }}>
              <Button
                onPress={handleManualEntry}
                disabled={!manualCode.trim()}
              >
                Process Code
              </Button>
              <Button
                variant="tertiary"
                onPress={() => {
                  triggerSelectionHaptic();
                  setManualEntry(false);
                  setManualCode("");
                }}
              >
                Back to Camera
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
    paddingVertical: 24,
  },
  cameraView: {
    height: 200,
    borderRadius: 12,
    marginHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  frameWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  scanningFrame: {
    width: 256,
    height: 256,
    borderRadius: 16,
    borderWidth: 3,
  },
  cornerBracket: {
    position: "absolute",
    width: 40,
    height: 40,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderRadius: 8,
  },
  cornerBracketTopRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  cornerBracketBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 3,
    borderTopWidth: 3,
  },
  cornerBracketBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 3,
    borderTopWidth: 3,
  },
});
