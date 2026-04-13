import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { triggerSelectionHaptic } from "@/lib/haptics";

interface QuickAction {
  id: string;
  label: string;
  symbol: string;
  href: string;
  tintColor: "red" | "blue" | "green" | "purple";
}

const actions: QuickAction[] = [
  {
    id: "incident",
    label: "New Incident",
    symbol: "exclamationmark.triangle",
    href: "/incidents/new",
    tintColor: "red",
  },
  {
    id: "dispatch",
    label: "New Dispatch",
    symbol: "antenna.radiowaves.left.and.right",
    href: "/dispatch/new",
    tintColor: "blue",
  },
  {
    id: "log",
    label: "Log Entry",
    symbol: "note.text",
    href: "/daily-log/new",
    tintColor: "green",
  },
  {
    id: "scanner",
    label: "Scanner",
    symbol: "qrcode.viewfinder",
    href: "/scanner",
    tintColor: "purple",
  },
];

export function QuickActions() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const styles = createStyles(colors, typography, layout);

  const getTintColor = (tint: QuickAction["tintColor"]) => {
    const colorMap = {
      red: colors.error,
      blue: colors.info,
      green: colors.success,
      purple: colors.accent,
    };
    return colorMap[tint];
  };

  const handlePress = (href: string) => {
    triggerSelectionHaptic();
    router.push(href as never);
  };

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          onPress={() => handlePress(action.href)}
          style={({ pressed }) => [
            styles.button,
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getTintColor(action.tintColor) },
            ]}
          >
            <AppSymbol
              iosName={action.symbol as any}
              fallbackName="alert"
              size={24}
              color={colors.textInverse}
              weight="semibold"
            />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      paddingHorizontal: layout.horizontalPadding,
    },
    button: {
      flex: 1,
      minWidth: "45%",
      alignItems: "center",
      gap: 8,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    label: {
      ...typography.caption1,
      color: colors.textPrimary,
      fontWeight: "600",
      textAlign: "center",
    },
  });
}

export default QuickActions;
