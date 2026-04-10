import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import {
  triggerNotificationHaptic,
  triggerSelectionHaptic,
} from "@/lib/haptics";
import { useAdaptiveLayout } from "@/theme/layout";
import {
  useThemeColors,
  useThemeTypography,
} from "@/theme";

type ToastTone = "error" | "info" | "success" | "warning";

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastOptions {
  action?: ToastAction;
  durationMs?: number;
  message: string;
  title?: string;
  tone?: ToastTone;
}

interface ToastRecord extends ToastOptions {
  id: number;
  tone: ToastTone;
}

interface ToastContextValue {
  hideToast: () => void;
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

let toastIdCounter = 0;

function getToneSymbolName(tone: ToastTone) {
  switch (tone) {
    case "error":
      return "exclamationmark.triangle.fill";
    case "success":
      return "checkmark.circle.fill";
    case "warning":
      return "exclamationmark.circle.fill";
    case "info":
    default:
      return "info.circle.fill";
  }
}

function ToastViewport({
  toast,
  onDismiss,
}: {
  onDismiss: () => void;
  toast: ToastRecord | null;
}) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: toast ? 1 : 0,
        duration: toast ? 180 : 140,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: toast ? 0 : 24,
        duration: toast ? 180 : 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, toast, translateY]);

  if (!toast) {
    return null;
  }

  const toneColor =
    toast.tone === "error"
      ? colors.error
      : toast.tone === "success"
        ? colors.success
        : toast.tone === "warning"
          ? colors.warning
          : colors.info;

  const styles = StyleSheet.create({
    actionLabel: {
      ...typography.subheadline,
      color: colors.primaryStrong,
      fontWeight: "700",
    },
    body: {
      flex: 1,
      gap: 2,
    },
    closeButton: {
      borderRadius: 999,
      marginLeft: 4,
      padding: 6,
    },
    host: {
      bottom: Math.max(insets.bottom, 14) + 18,
      left: layout.horizontalPadding,
      position: "absolute",
      right: layout.horizontalPadding,
      zIndex: 50,
    },
    message: {
      ...typography.footnote,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
    },
    title: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    toneIcon: {
      alignItems: "center",
      justifyContent: "center",
      width: 22,
    },
    wrapper: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      padding: layout.cardPadding,
    },
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <MaterialSurface intensity={92} variant="sheet">
        <View style={styles.wrapper}>
          <View style={styles.toneIcon}>
            <AppSymbol
              color={toneColor}
              fallbackName="information-circle"
              iosName={getToneSymbolName(toast.tone)}
              size={18}
              weight="semibold"
            />
          </View>
          <View style={styles.body}>
            {toast.title ? <Text style={styles.title}>{toast.title}</Text> : null}
            <Text style={styles.message}>{toast.message}</Text>
          </View>
          {toast.action ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                toast.action?.onPress();
                onDismiss();
              }}
            >
              <Text style={styles.actionLabel}>{toast.action.label}</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={onDismiss}
            style={styles.closeButton}
          >
            <AppSymbol
              color={colors.textTertiary}
              fallbackName="close"
              iosName="xmark.circle.fill"
              size={18}
              weight="medium"
            />
          </Pressable>
        </View>
      </MaterialSurface>
    </Animated.View>
  );
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastRecord | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setToast(null);
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const tone = options.tone ?? "info";

      if (tone === "info") {
        triggerSelectionHaptic();
      } else {
        triggerNotificationHaptic(tone);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setToast({
        ...options,
        id: ++toastIdCounter,
        tone,
      });

      timeoutRef.current = setTimeout(() => {
        setToast(null);
        timeoutRef.current = null;
      }, options.durationMs ?? 3600);
    },
    []
  );

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      hideToast,
      showToast,
    }),
    [hideToast, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport onDismiss={hideToast} toast={toast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);

  if (!value) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return value;
}
