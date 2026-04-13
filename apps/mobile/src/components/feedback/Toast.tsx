import React, { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  PanResponder,
  PanResponderInstance,
  ViewStyle,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemeTypography, useThemeSpacing } from '@/theme';
import { triggerHaptic } from '@/lib/haptics';
import { AppSymbol } from '../ui/AppSymbol';
import { MaterialSurface } from '../ui/MaterialSurface';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'undo';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: (id: string) => void;
}

function getIconName(type: ToastData['type']): string {
  switch (type) {
    case 'success':
      return 'checkmark.circle.fill';
    case 'error':
      return 'xmark.circle.fill';
    case 'info':
      return 'info.circle.fill';
    case 'warning':
      return 'exclamationmark.circle.fill';
    case 'undo':
      return 'arrow.uturn.backward';
    default:
      return 'info.circle.fill';
  }
}

function getIndicatorColor(
  type: ToastData['type'],
  colors: ReturnType<typeof useThemeColors>
): string {
  switch (type) {
    case 'success':
      return colors.success;
    case 'error':
      return colors.error;
    case 'warning':
      return colors.warning;
    case 'info':
      return colors.info;
    case 'undo':
      return colors.primary;
    default:
      return colors.primary;
  }
}

function getHapticType(type: ToastData['type']): 'success' | 'error' | 'warning' | 'light' | 'medium' {
  switch (type) {
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    default:
      return 'light';
  }
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();
  const insets = useSafeAreaInsets();
  const [isVisible, setIsVisible] = useState(!!toast);

  const slideAnim = React.useRef(new Animated.Value(-200)).current;
  const panResponder = React.useRef<PanResponderInstance | null>(null);

  useEffect(() => {
    if (toast) {
      setIsVisible(true);
      triggerHaptic(getHapticType(toast.type));

      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 10,
        mass: 0.5,
        useNativeDriver: true,
      }).start();

      const timeoutDuration = toast.duration || (toast.type === 'error' ? 5000 : 3000);
      const timer = setTimeout(() => {
        dismiss();
      }, timeoutDuration);

      return () => clearTimeout(timer);
    }
  }, [toast?.id]);

  const dismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      if (toast) {
        onDismiss(toast.id);
      }
    });
  };

  useEffect(() => {
    panResponder.current = PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy }) => dy < -10,
      onPanResponderMove: (_, { dy }) => {
        if (dy < 0) {
          slideAnim.setValue(dy);
        }
      },
      onPanResponderRelease: (_, { dy }) => {
        if (dy < -50) {
          dismiss();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    });
  }, []);

  if (!isVisible || !toast) return null;

  const indicatorColor = getIndicatorColor(toast.type, colors);
  const iconName = getIconName(toast.type);

  return (
    <Animated.View
      {...panResponder.current?.panHandlers}
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          paddingTop: insets.top + spacing[2],
        },
      ]}
    >
      <MaterialSurface variant="chrome" style={styles.surface}>
        {/* Indicator bar */}
        <View
          style={[
            styles.indicatorBar,
            { backgroundColor: indicatorColor },
          ]}
        />

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Icon */}
          <View style={styles.iconWrapper}>
            <AppSymbol
              name={iconName}
              size={24}
              color={indicatorColor}
            />
          </View>

          {/* Text content */}
          <View style={styles.textContent}>
            <Text
              style={{
                fontSize: typography.callout.fontSize,
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: toast.message ? spacing[0.5] : 0,
              }}
            >
              {toast.title}
            </Text>

            {toast.message && (
              <Text
                style={{
                  fontSize: typography.footnote.fontSize,
                  color: colors.textSecondary,
                }}
              >
                {toast.message}
              </Text>
            )}
          </View>

          {/* Action or Close button */}
          {toast.actionLabel && toast.onAction ? (
            <Pressable
              onPress={() => {
                toast.onAction?.();
                dismiss();
              }}
              style={[
                styles.actionButton,
                { marginLeft: spacing[2] },
              ]}
            >
              <Text
                style={{
                  fontSize: typography.callout.fontSize,
                  fontWeight: '600',
                  color: indicatorColor,
                }}
              >
                {toast.actionLabel}
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={dismiss} style={styles.closeButton}>
              <AppSymbol
                name="xmark"
                size={16}
                color={colors.textTertiary}
              />
            </Pressable>
          )}
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
    zIndex: 1600,
    paddingHorizontal: 12,
  },
  surface: {
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  indicatorBar: {
    height: 4,
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  iconWrapper: {
    flexShrink: 0,
  },
  textContent: {
    flex: 1,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeButton: {
    padding: 4,
  },
});
