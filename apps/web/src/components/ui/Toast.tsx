"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import clsx from "clsx";
import { IconButton } from "@/components/ui/IconButton";

type ToastVariant = "default" | "success" | "error" | "warning" | "info";

interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: (
    message: string,
    options?: { variant?: ToastVariant; duration?: number }
  ) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

const variantIcon: Record<ToastVariant, ReactNode> = {
  default: null,
  success: <CheckCircle2 size={16} style={{ color: "var(--status-success, #22c55e)" }} />,
  error: <AlertCircle size={16} style={{ color: "var(--status-critical, #ef4444)" }} />,
  warning: <AlertTriangle size={16} style={{ color: "var(--status-warning, #f59e0b)" }} />,
  info: <Info size={16} style={{ color: "var(--action-primary, #6366f1)" }} />,
};

const variantBorder: Record<ToastVariant, string> = {
  default: "border-[var(--border-default)]",
  success: "border-[var(--status-success,#22c55e)]/30",
  error: "border-[var(--status-critical,#ef4444)]/30",
  warning: "border-[var(--status-warning,#f59e0b)]/30",
  info: "border-[var(--action-primary,#6366f1)]/30",
};

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback(
    (
      message: string,
      options?: { variant?: ToastVariant; duration?: number }
    ) => {
      const id = String(++toastId);
      const newToast: ToastData = {
        id,
        message,
        variant: options?.variant ?? "default",
        duration: options?.duration ?? 5000,
      };
      setToasts((prev) => {
        const next = [...prev, newToast];
        // Keep max 3
        return next.length > 3 ? next.slice(-3) : next;
      });
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div aria-live="assertive" role="log" aria-label="Notifications" className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} data={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  data: ToastData;
  onDismiss: (id: string) => void;
}

function ToastItem({ data, onDismiss }: ToastItemProps) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
    }, data.duration);
    return () => clearTimeout(timerRef.current);
  }, [data.duration]);

  useEffect(() => {
    if (!exiting) return;
    const timer = setTimeout(() => {
      onDismiss(data.id);
    }, 200);
    return () => clearTimeout(timer);
  }, [exiting, data.id, onDismiss]);

  return (
    <div
      role="alert"
      className={clsx(
        "pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 min-w-[280px] max-w-[400px]",
        "bg-[var(--surface-primary)] border rounded-xl shadow-lg",
        variantBorder[data.variant],
        exiting
          ? "animate-[toastOut_200ms_ease-in_forwards]"
          : "animate-[toastIn_250ms_cubic-bezier(0.34,1.56,0.64,1)]"
      )}
    >
      {variantIcon[data.variant] && (
        <span className="flex-shrink-0">{variantIcon[data.variant]}</span>
      )}
      <span className="text-[13px] text-[var(--text-primary)] flex-1">
        {data.message}
      </span>
      <IconButton
        onClick={() => setExiting(true)}
        className="h-6 w-6 rounded-md text-[var(--text-secondary)] shadow-none"
        label="Dismiss"
        size="sm"
        type="button"
        variant="ghost"
      >
        <X size={12} />
      </IconButton>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
