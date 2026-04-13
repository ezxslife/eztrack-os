import {
  Platform,
  Switch,
} from "react-native";

import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeControls } from "@/theme";

interface GlassSwitchProps {
  onToggle: (value: boolean) => void;
  value: boolean;
}

export function GlassSwitch({ onToggle, value }: GlassSwitchProps) {
  const controls = useThemeControls();
  const colors = useThemeColors();

  return (
    <Switch
      ios_backgroundColor={controls.switchTrackFalse}
      onValueChange={(nextValue) => {
        triggerSelectionHaptic();
        onToggle(nextValue);
      }}
      thumbColor={Platform.OS === "android" ? colors.surfaceElevated : undefined}
      trackColor={{ false: controls.switchTrackFalse, true: controls.switchTrackTrue }}
      value={value}
    />
  );
}
