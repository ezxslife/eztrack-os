import { StyleSheet, View } from "react-native";

import { GlassAlert } from "@/components/ui/glass/GlassAlert";
import { useThemeSpacing } from "@/theme";

export interface NetworkErrorAlertProps {
  visible: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  message?: string;
}

export function NetworkErrorAlert({
  visible,
  onRetry,
  onDismiss,
  message = "Unable to connect. Check your internet connection and try again.",
}: NetworkErrorAlertProps) {
  const spacing = useThemeSpacing();

  if (!visible) {
    return null;
  }

  const actions = [
    ...(onDismiss
      ? [{ label: "Dismiss", onPress: onDismiss, icon: "close" as const }]
      : []),
    ...(onRetry
      ? [{ label: "Retry", onPress: onRetry, icon: "checkmark" as const }]
      : []),
  ];

  return (
    <View style={[styles.container, { paddingHorizontal: spacing[4], paddingTop: spacing[3] }]}>
      <GlassAlert
        actions={actions}
        message={message}
        title="Connection Error"
        tone="error"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1000,
  },
});
