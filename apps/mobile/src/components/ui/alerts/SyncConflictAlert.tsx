import React from 'react';
import { StyleSheet, View } from 'react-native';

import { GlassAlert } from '@/components/ui/glass/GlassAlert';
import { triggerImpactHaptic, triggerSelectionHaptic } from '@/lib/haptics';
import * as Haptics from 'expo-haptics';
import { useThemeSpacing } from '@/theme';

export interface SyncConflictAlertProps {
  visible: boolean;
  recordType: string;
  onKeepLocal: () => void;
  onKeepRemote: () => void;
  onDismiss: () => void;
}

/**
 * Alert shown when a sync conflict is detected.
 * User can choose to keep their local changes or the remote changes.
 */
export const SyncConflictAlert = ({
  visible,
  recordType,
  onKeepLocal,
  onKeepRemote,
  onDismiss,
}: SyncConflictAlertProps) => {
  const spacing = useThemeSpacing();

  if (!visible) return null;

  const handleKeepLocal = () => {
    triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium);
    onKeepLocal();
  };

  const handleKeepRemote = () => {
    triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium);
    onKeepRemote();
  };

  const handleDismiss = () => {
    triggerSelectionHaptic();
    onDismiss();
  };

  const message = `This ${recordType} was modified on another device. Which version would you like to keep?`;

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
        title="Sync Conflict"
        message={message}
        actions={[
          {
            label: 'Cancel',
            onPress: handleDismiss,
          },
          {
            label: 'Keep Mine',
            onPress: handleKeepLocal,
          },
          {
            label: 'Keep Theirs',
            onPress: handleKeepRemote,
          },
        ]}
      />
    </View>
  );
};
