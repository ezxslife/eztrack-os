import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import {
  useThemeColors,
  useThemeTypography,
} from "@/theme";

interface SettingsListRowProps {
  label: string;
  onPress?: () => void;
  subtitle?: string;
  trailing?: React.ReactNode;
  value?: string;
}

export function SettingsListRow({
  label,
  onPress,
  subtitle,
  trailing,
  value,
}: SettingsListRowProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const content = (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text
          style={[
            styles.label,
            typography.body,
            {
              color: colors.textPrimary,
            },
          ]}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              typography.footnote,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.trailing}>
        {value ? (
          <Text
            style={[
              styles.value,
              typography.subheadline,
              {
                color: colors.textTertiary,
              },
            ]}
          >
            {value}
          </Text>
        ) : null}
        {trailing}
        {onPress ? (
          <Ionicons color={colors.textTertiary} name="chevron-forward" size={18} />
        ) : null}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        pressed ? styles.pressed : null,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    paddingRight: 16,
  },
  label: {
    fontWeight: "600",
  },
  pressable: {
    minHeight: 44,
  },
  pressed: {
    opacity: 0.72,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
  } satisfies ViewStyle,
  subtitle: {
    marginTop: 3,
  },
  trailing: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  value: {
    fontWeight: "500",
  },
});
