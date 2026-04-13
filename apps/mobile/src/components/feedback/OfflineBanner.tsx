/**
 * OfflineBanner: Persistent banner shown when offline.
 * Displays network status, pending changes, and sync state.
 */

import { useCallback, useEffect } from 'react';
import { Animated, Platform, StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppSymbol } from '@/components/ui/AppSymbol';
import { MaterialSurface } from '@/components/ui/MaterialSurface';
import { useThemeColors, useThemeSpacing, useThemeTypography } from '@/theme';

interface OfflineBannerProps {
  isOffline: boolean;
  pendingCount?: number;
  isSyncing?: boolean;
}

const ANIMATION_DURATION = 300;
const AUTO_HIDE_DELAY = 3000; // Hide banner 3 seconds after reconnection

export function OfflineBanner({
  isOffline,
  pendingCount = 0,
  isSyncing = false,
}: OfflineBannerProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();

  // Animated values
  const slideAnim = new Animated.Value(isOffline ? 0 : -100);
  const opacityAnim = new Animated.Value(isOffline ? 1 : 0);

  const animateBanner = useCallback(
    (show: boolean) => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: show ? 0 : -100,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: show ? 1 : 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [slideAnim, opacityAnim]
  );

  useEffect(() => {
    if (isOffline) {
      animateBanner(true);
    } else {
      // Delay hide to show reconnection message
      const hideTimer = setTimeout(() => {
        animateBanner(false);
      }, AUTO_HIDE_DELAY);

      return () => clearTimeout(hideTimer);
    }
  }, [isOffline, animateBanner]);

  if (!isOffline && !isSyncing) {
    return null;
  }

  const pendingText =
    pendingCount > 0 ? `${pendingCount} change${pendingCount === 1 ? '' : 's'} pending` : null;
  const statusText = isSyncing
    ? 'Syncing...'
    : isOffline
      ? "You're offline"
      : 'Reconnected';
  const showSpinner = isSyncing;

  const animatedStyle = {
    transform: [{ translateY: slideAnim }],
    opacity: opacityAnim,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <MaterialSurface variant="chrome" padding={spacing[2]} style={styles.surface}>
        <View style={styles.content}>
          <View style={styles.iconAndText}>
            {showSpinner ? (
              <View style={[styles.spinner, { borderColor: colors.textSecondary }]}>
                <View
                  style={[
                    styles.spinnerInner,
                    { borderTopColor: colors.primary, borderRightColor: colors.primary },
                  ]}
                />
              </View>
            ) : (
              <AppSymbol
                iosName={isOffline ? 'wifi.slash' : 'wifi'}
                fallbackName={isOffline ? 'wifi' : 'wifi'}
                size={16}
                color={isOffline ? colors.warning : colors.success}
              />
            )}
            <View style={styles.textContainer}>
              <Text style={[typography.caption1, { color: colors.textPrimary, fontWeight: '500' }]}>
                {statusText}
              </Text>
              {pendingText && (
                <Text style={[typography.caption1, { color: colors.textSecondary }, styles.pendingText]}>
                  {pendingText}
                </Text>
              )}
            </View>
          </View>
        </View>
      </MaterialSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1050, // Below modal, above most UI
  },
  surface: {
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  iconAndText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  textContainer: {
    flex: 1,
  },
  pendingText: {
    fontSize: 11,
    marginTop: 2,
  },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});
