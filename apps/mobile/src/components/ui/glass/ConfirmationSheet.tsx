import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import { GlassSheetModal } from "@/components/ui/glass/GlassSheetModal";
import { triggerNotificationHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";
import type { SFSymbol } from "expo-symbols";

interface ConfirmationSheetProps {
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: "destructive" | "warning" | "primary";
  description: string;
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

export function ConfirmationSheet({
  cancelLabel = "Cancel",
  confirmLabel = "Delete",
  confirmVariant = "destructive",
  description,
  isLoading = false,
  isOpen,
  onClose,
  onConfirm,
  title,
}: ConfirmationSheetProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const styles = StyleSheet.create({
    buttons: {
      flexDirection: "row",
      gap: 12,
    },
    cancelButton: {
      flex: 1,
    },
    confirmButton: {
      flex: 1,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    icon: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    title: {
      ...typography.headline,
      color: colors.textPrimary,
      fontWeight: "700",
      marginBottom: 8,
    },
    wrapper: {
      flex: 1,
      gap: 0,
    },
  });

  const iconColor =
    confirmVariant === "destructive"
      ? colors.error
      : confirmVariant === "warning"
        ? colors.warning
        : colors.info;

  const iconName =
    confirmVariant === "destructive" || confirmVariant === "warning"
      ? "exclamationmark.triangle"
      : "info.circle";

  const iconIonName =
    confirmVariant === "destructive" || confirmVariant === "warning"
      ? "warning-outline"
      : "information-circle-outline";

  const handleConfirm = () => {
    if (!isLoading) {
      triggerNotificationHaptic(confirmVariant === "primary" ? "success" : "warning");
      onConfirm();
    }
  };

  return (
    <GlassSheetModal
      enableDismissOnBackdropPress={!isLoading}
      enablePanDownToClose={!isLoading}
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={["35%"]}
    >
      <View style={styles.wrapper}>
        <View style={styles.icon}>
          <AppSymbol
            color={iconColor}
            fallbackName={iconIonName as keyof typeof Ionicons.glyphMap}
            iosName={iconName as SFSymbol}
            size={40}
            weight="semibold"
          />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.buttons}>
          <GlassButton
            disabled={isLoading}
            label={cancelLabel}
            onPress={onClose}
            size="md"
            style={styles.cancelButton}
            variant="secondary"
          />
          <GlassButton
            disabled={isLoading}
            isLoading={isLoading}
            label={confirmLabel}
            onPress={handleConfirm}
            size="md"
            style={styles.confirmButton}
            variant={confirmVariant === "primary" ? "primary" : "destructive"}
          />
        </View>
      </View>
    </GlassSheetModal>
  );
}
