import React, { useEffect } from 'react';
import { Alert } from 'react-native';

import { triggerImpactHaptic, triggerNotificationHaptic } from '@/lib/haptics';
import * as Haptics from 'expo-haptics';

export interface AuthExpiredAlertProps {
  visible: boolean;
  onReLogin: () => void;
}

/**
 * Alert shown when user's authentication session has expired.
 * Uses native Alert for reliability during auth issues.
 * No dismiss option - user must re-login.
 */
export const AuthExpiredAlert = ({
  visible,
  onReLogin,
}: AuthExpiredAlertProps) => {
  useEffect(() => {
    if (!visible) return;

    triggerNotificationHaptic('warning');

    Alert.alert(
      'Session Expired',
      'Your session has expired. Please sign in again.',
      [
        {
          text: 'Sign In',
          onPress: () => {
            triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium);
            onReLogin();
          },
        },
      ],
      { cancelable: false }
    );
  }, [visible, onReLogin]);

  return null;
};
