import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/theme";

interface SectionHeaderProps {
  /** Optional count displayed after the title */
  count?: number;
  title: string;
}

/**
 * Uppercase section label placed above a GroupedCard.
 *
 * Matches the EZXS-OS SectionHeader pattern:
 * 13px · 600 weight · uppercase · 0.6 letterSpacing · 24px top / 8px bottom.
 */
export function SectionHeader({ count, title }: SectionHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: colors.textTertiary }]}>
        {title}
        {count !== undefined ? ` (${count})` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  wrapper: {
    paddingBottom: 8,
    paddingTop: 24,
  },
});
