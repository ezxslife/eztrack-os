import React, { useCallback, useRef } from 'react';
import {
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { triggerHaptic } from '@/lib/haptics';

export interface UnsavedChangesAlertProps {
  visible: boolean;
  onDiscard: () => void;
  onKeepEditing: () => void;
  onSave?: () => void;
}

/**
 * Component that displays a native alert for unsaved changes.
 * Used when user attempts to navigate away from a form with pending changes.
 */
export const UnsavedChangesAlert = ({
  visible,
  onDiscard,
  onKeepEditing,
  onSave,
}: UnsavedChangesAlertProps) => {
  React.useEffect(() => {
    if (!visible) return;

    triggerHaptic('warning');

    const buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [
      {
        text: 'Keep Editing',
        style: 'cancel',
        onPress: onKeepEditing,
      },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: onDiscard,
      },
    ];

    if (onSave) {
      buttons.push({
        text: 'Save',
        style: 'default',
        onPress: onSave,
      });
    }

    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. What would you like to do?',
      buttons,
      { cancelable: false }
    );
  }, [visible, onDiscard, onKeepEditing, onSave]);

  return null;
};

/**
 * Hook for managing unsaved form state and navigation interception.
 * Automatically shows the unsaved changes alert when user tries to navigate away.
 *
 * @example
 * const { isDirty, setIsDirty } = useUnsavedChanges(true);
 * // Form fields update state:
 * // setIsDirty(true)
 *
 * // When form is submitted:
 * // setIsDirty(false)
 */
export interface UseUnsavedChangesReturn {
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  confirmNavigation: (callback: () => void) => void;
  showAlert: boolean;
  setShowAlert: (show: boolean) => void;
}

export const useUnsavedChanges = (
  initialDirty: boolean = false,
  options?: {
    onSave?: () => Promise<void> | void;
  }
): UseUnsavedChangesReturn => {
  const navigation = useNavigation();
  const [isDirty, setIsDirty] = React.useState(initialDirty);
  const [showAlert, setShowAlert] = React.useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  // Intercept back navigation
  React.useEffect(() => {
    if (!isDirty) return;

    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Check if this is a back navigation
      if (e.data.action.type !== 'GO_BACK') {
        return;
      }

      e.preventDefault();
      triggerHaptic('warning');
      pendingNavigationRef.current = () => {
        navigation.dispatch(e.data.action);
      };
      setShowAlert(true);
    });

    return unsubscribe;
  }, [navigation, isDirty]);

  const handleDiscard = useCallback(() => {
    setShowAlert(false);
    setIsDirty(false);
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
    triggerHaptic('success');
  }, []);

  const handleKeepEditing = useCallback(() => {
    setShowAlert(false);
    pendingNavigationRef.current = null;
  }, []);

  const handleSave = useCallback(async () => {
    triggerHaptic('medium');
    try {
      if (options?.onSave) {
        await options.onSave();
      }
      setShowAlert(false);
      setIsDirty(false);
      if (pendingNavigationRef.current) {
        pendingNavigationRef.current();
        pendingNavigationRef.current = null;
      }
      triggerHaptic('success');
    } catch (error) {
      triggerHaptic('error');
      console.error('Failed to save changes:', error);
      setShowAlert(false);
    }
  }, [options]);

  return {
    isDirty,
    setIsDirty,
    confirmNavigation: (callback: () => void) => {
      if (isDirty) {
        pendingNavigationRef.current = callback;
        setShowAlert(true);
      } else {
        callback();
      }
    },
    showAlert,
    setShowAlert,
  };
};

/**
 * Higher-order component to wrap screens with unsaved changes protection.
 * Automatically manages the alert and interception.
 *
 * @example
 * const ProtectedScreen = withUnsavedChangesProtection(MyFormScreen);
 */
export const withUnsavedChangesProtection = <P extends object>(
  Component: React.ComponentType<P & { isDirty: boolean; setIsDirty: (dirty: boolean) => void }>
) => {
  return (props: P) => {
    const { isDirty, setIsDirty, showAlert, setShowAlert } = useUnsavedChanges();
    const pendingActionRef = useRef<{
      onDiscard?: () => void;
      onSave?: () => void;
    }>({});

    return (
      <>
        <Component
          {...props}
          isDirty={isDirty}
          setIsDirty={setIsDirty}
        />
        <UnsavedChangesAlert
          visible={showAlert}
          onDiscard={() => {
            setShowAlert(false);
            setIsDirty(false);
            if (pendingActionRef.current.onDiscard) {
              pendingActionRef.current.onDiscard();
            }
            triggerHaptic('success');
          }}
          onKeepEditing={() => {
            setShowAlert(false);
          }}
          onSave={
            pendingActionRef.current.onSave
              ? () => {
                  if (pendingActionRef.current.onSave) {
                    pendingActionRef.current.onSave();
                  }
                  setShowAlert(false);
                  setIsDirty(false);
                  triggerHaptic('success');
                }
              : undefined
          }
        />
      </>
    );
  };
};
