import { StyleSheet, View } from "react-native";

import { useThemeColors } from "@/theme";

export function GroupedCardDivider() {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.borderLight,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
});
