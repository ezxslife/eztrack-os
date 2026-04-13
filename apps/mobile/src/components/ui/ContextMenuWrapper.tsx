/**
 * ContextMenuWrapper — Native iOS context menu with haptic feedback.
 *
 * Wraps children in a native context menu (long-press on iOS, fallback
 * to no-op on Android/web). Each action can have an optional confirmation
 * flow before executing.
 *
 * Usage:
 *   <ContextMenuWrapper actions={[{ title: 'Delete', destructive: true, onPress: del }]}>
 *     <IncidentCard ... />
 *   </ContextMenuWrapper>
 */
import React, { useCallback, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import { haptics } from '@/lib/haptics';

// Attempt to load native context menu — not available on all platforms.
let NativeContextMenu: React.ComponentType<any> | null = null;
try {
  if (Platform.OS === 'ios') {
    NativeContextMenu = require('react-native-context-menu-view').default;
  }
} catch {
  NativeContextMenu = null;
}

interface ContextMenuConfirmation {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export interface ContextMenuAction {
  title: string;
  subtitle?: string;
  systemIcon?: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress?: () => void | Promise<void>;
  /** Show a confirmation alert before executing. */
  confirmation?: ContextMenuConfirmation;
}

export interface ContextMenuWrapperProps {
  title?: string;
  actions: ContextMenuAction[];
  disabled?: boolean;
  children: ReactElement;
}

function mapToNativeActions(actions: ContextMenuAction[]) {
  return actions.map((a) => ({
    title: a.title,
    subtitle: a.subtitle,
    systemIcon: a.systemIcon,
    destructive: a.destructive,
    disabled: a.disabled,
  }));
}

export function ContextMenuWrapper({
  title,
  actions,
  disabled = false,
  children,
}: ContextMenuWrapperProps) {
  const [loading, setLoading] = useState(false);

  const available = useMemo(
    () => actions.filter((a) => a.title.trim().length > 0),
    [actions],
  );
  const nativeActions = useMemo(() => mapToNativeActions(available), [available]);

  const runAction = useCallback(async (action: ContextMenuAction) => {
    if (action.disabled || !action.onPress) return;
    setLoading(true);
    action.destructive ? haptics.warning() : haptics.selection();
    try {
      await action.onPress();
    } finally {
      setLoading(false);
    }
  }, []);

  const selectAction = useCallback(
    (action: ContextMenuAction | undefined) => {
      if (!action || action.disabled) return;
      if (action.confirmation) {
        Alert.alert(
          action.confirmation.title,
          action.confirmation.description,
          [
            {
              text: action.confirmation.cancelLabel ?? 'Cancel',
              style: 'cancel',
            },
            {
              text: action.confirmation.confirmLabel,
              style: action.confirmation.destructive ? 'destructive' : 'default',
              onPress: () => void runAction(action),
            },
          ],
        );
        return;
      }
      void runAction(action);
    },
    [runAction],
  );

  const handlePress = useCallback(
    (event: any) => {
      const match =
        available.find((a) => a.title === event.nativeEvent?.name) ??
        available[event.nativeEvent?.index];
      selectAction(match);
    },
    [available, selectAction],
  );

  // No actions or no native support — render children as-is.
  if (available.length === 0 || !NativeContextMenu) {
    return children;
  }

  return (
    <NativeContextMenu
      title={title}
      actions={nativeActions}
      disabled={disabled || loading}
      onPress={handlePress}
    >
      {React.cloneElement(children, {
        onLongPress: (e: unknown) => {
          haptics.contextMenu();
          const childProps = children.props as { onLongPress?: (e: unknown) => void };
          childProps.onLongPress?.(e);
        },
      } as Record<string, unknown>)}
    </NativeContextMenu>
  );
}
