import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ColorValue,
} from "react-native";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { triggerImpactHaptic } from "@/lib/haptics";
import { useThemeColors } from "@/theme";

interface NativeHeaderActionButtonProps {
  icon: string;
  onPress: () => void;
  badge?: number;
  tintColor?: string;
  destructive?: boolean;
  disabled?: boolean;
  accessibilityLabel: string;
  testID?: string;
  isLoading?: boolean;
  renderContent?: (color: string) => React.ReactNode;
}

export function NativeHeaderActionButton({
  icon,
  onPress,
  badge,
  tintColor,
  destructive,
  disabled,
  accessibilityLabel,
  testID,
  isLoading,
  renderContent,
}: NativeHeaderActionButtonProps) {
  const colors = useThemeColors();

  const resolvedTintColor = tintColor || (destructive ? colors.error : colors.textPrimary);
  const isDisabled = disabled || isLoading;

  const handlePress = () => {
    if (!isDisabled) {
      triggerImpactHaptic();
      onPress();
    }
  };

  return (
    <Pressable
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={isDisabled}
      hitSlop={8}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        pressed && !isDisabled && { opacity: 0.7 },
        isDisabled && { opacity: 0.4 },
      ]}
      testID={testID}
    >
      <View style={styles.iconContainer}>
        {isLoading && renderContent ? (
          renderContent(resolvedTintColor)
        ) : (
          <AppSymbol
            color={resolvedTintColor as ColorValue}
            fallbackName={icon as any}
            iosName={icon as any}
            size={22}
          />
        )}

        {badge !== undefined && badge > 0 && (
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.error },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: colors.surface },
              ]}
            >
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    position: "relative",
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
});
