import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { useThemeColors } from "@/theme";

interface GlassSwitchProps {
  onToggle: (value: boolean) => void;
  value: boolean;
}

export function GlassSwitch({ onToggle, value }: GlassSwitchProps) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    thumb: {
      backgroundColor: "#FFFFFF",
      borderRadius: 14,
      height: 28,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 10,
      transform: [{ translateX: value ? 24 : 0 }],
      width: 28,
    },
    track: {
      backgroundColor: value ? "rgba(6, 182, 212, 0.3)" : colors.surfaceSecondary,
      borderColor: value ? colors.primaryStrong : colors.borderSubtle,
      borderRadius: 20,
      borderWidth: 1,
      padding: 4,
      width: 60,
    },
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => {
        if (Platform.OS !== "web") {
          void Haptics.selectionAsync();
        }

        onToggle(!value);
      }}
    >
      <View style={styles.track}>
        <View style={styles.thumb} />
      </View>
    </Pressable>
  );
}
