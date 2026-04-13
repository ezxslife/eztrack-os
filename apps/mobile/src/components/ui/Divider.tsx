import { StyleSheet, View, type ViewStyle, type StyleProp } from "react-native";

import { useThemeColors } from "@/theme";

interface DividerProps {
  orientation?: "horizontal" | "vertical";
  thickness?: number;
  color?: string;
  spacing?: number;
  inset?: number;
  style?: StyleProp<ViewStyle>;
}

export function Divider({
  orientation = "horizontal",
  thickness = 1,
  color,
  spacing = 0,
  inset = 0,
  style,
}: DividerProps) {
  const colors = useThemeColors();
  const dividerColor = color || colors.divider;

  const styles = StyleSheet.create({
    horizontal: {
      height: thickness,
      backgroundColor: dividerColor,
      marginTop: spacing,
      marginBottom: spacing,
      marginLeft: inset,
      width: "100%",
    },
    vertical: {
      width: thickness,
      backgroundColor: dividerColor,
      marginLeft: spacing,
      marginRight: spacing,
      height: "100%",
    },
  });

  const dividerStyle =
    orientation === "vertical" ? styles.vertical : styles.horizontal;

  return <View style={[dividerStyle, style]} />;
}
