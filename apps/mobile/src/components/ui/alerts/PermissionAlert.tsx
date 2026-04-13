import React from 'react';
import { StyleSheet, View } from 'react-native';

import { GlassAlert } from '@/components/ui/glass/GlassAlert';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { useThemeSpacing } from '@/theme';

export interface PermissionAlertProps {
  visible: boolean;
  permission: 'camera' | 'location' | 'notifications' | 'photos';
  onAllow: () => void;
  onDeny: () => void;
}

const PERMISSION_TEXT = {
  camera: {
    title: 'Camera Access',
    description: 'Allow access to your camera to capture photos and videos of incidents.',
  },
  location: {
    title: 'Location Access',
    description: 'Allow access to your location to track incident locations and dispatch routes.',
  },
  notifications: {
    title: 'Notifications',
    description: 'Allow notifications to receive real-time updates about incidents and orders.',
  },
  photos: {
    title: 'Photo Library Access',
    description: 'Allow access to your photo library to attach photos to incident reports.',
  },
};

/**
 * Alert for requesting specific permissions from the user.
 * Uses GlassAlert with info tone for clear permission requests.
 */
export const PermissionAlert = ({
  visible,
  permission,
  onAllow,
  onDeny,
}: PermissionAlertProps) => {
  const spacing = useThemeSpacing();

  const permissionInfo = PERMISSION_TEXT[permission];

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    actions: {
      flexDirection: 'row',
      gap: spacing[2],
      justifyContent: 'flex-end',
    },
  });

  if (!visible) return null;

  const handleAllow = () => {
    triggerSelectionHaptic();
    onAllow();
  };

  const handleDeny = () => {
    triggerSelectionHaptic();
    onDeny();
  };

  return (
    <View style={styles.container}>
      <GlassAlert
        tone="info"
        title={permissionInfo.title}
        message={permissionInfo.description}
        actions={[
          {
            label: 'Not Now',
            onPress: handleDeny,
          },
          {
            label: 'Allow',
            onPress: handleAllow,
          },
        ]}
      />
    </View>
  );
};
