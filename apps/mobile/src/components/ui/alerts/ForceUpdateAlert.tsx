import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';

import { triggerImpactHaptic, triggerNotificationHaptic } from '@/lib/haptics';
import * as Haptics from 'expo-haptics';

export interface ForceUpdateAlertProps {
  visible: boolean;
  onUpdate: () => void;
}

/**
 * Alert shown when a mandatory app update is available.
 * Uses native Alert for reliability. No dismiss option - user must update.
 * Triggers onUpdate which typically opens the App Store.
 */
export const ForceUpdateAlert = ({
  visible,
  onUpdate,
}: ForceUpdateAlertProps) => {
  useEffect(() => {
    if (!visible) return;

    triggerNotificationHaptic('warning');

    Alert.alert(
      'Update Required',
      'A new version of EZTrack is available. Please update to continue.',
      [
        {
          text: 'Update Now',
          onPress: () => {
            triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium);
            onUpdate();
          },
        },
      ],
      { cancelable: false }
    );
  }, [visible, onUpdate]);

  return null;
};
