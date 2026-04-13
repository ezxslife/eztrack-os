import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassAlert } from '@/components/ui/glass/GlassAlert';
import { triggerSelectionHaptic } from '@/lib/haptics';
import {
  useThemeColors,
  useThemeTypography,
  useThemeSpacing,
} from '@/theme';

export interface OfflineModeAlertProps {
  visible: boolean;
  pendingCount?: number;
  onDismiss: () => void;
}

/**
 * Alert shown when user is offline.
 * Informs them that changes will be synced when reconnected.
 * Displays count of pending changes if available.
 */
export const OfflineModeAlert = ({
  visible,
  pendingCount,
  onDismiss,
}: OfflineModeAlertProps) => {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();

  if (!visible) return null;

  const handleDismiss = () => {
    triggerSelectionHaptic();
    onDismiss();
  };

  let message = 'Changes will be saved locally and synced when you reconnect.';
  if (pendingCount && pendingCount > 0) {
    message += ` You have ${pendingCount} pending change${pendingCount > 1 ? 's' : ''}.`;
  }

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
  });

  return (
    <View style={styles.container}>
      <GlassAlert
        tone="warning"
        title="You're Offline"
        message={message}
        actions={[
          {
            label: 'Got It',
            onPress: handleDismiss,
          },
        ]}
      />
    </View>
  );
};
