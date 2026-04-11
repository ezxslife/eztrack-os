import { StyleSheet, Text, View } from "react-native";

import { useThemeColors, useThemeTypography } from "@/theme";

export function SectionHeader({ title }: { title: string }) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  return (
    <View style={styles.wrapper}>
      <Text
        style={[
          styles.title,
          typography.footnote,
          {
            color: colors.textTertiary,
          },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  wrapper: {
    marginBottom: 8,
    marginTop: 8,
  },
});
