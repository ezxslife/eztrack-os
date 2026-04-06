"use client";

import {
  type ReactNode,
  useEffect,
  useRef,
  useCallback,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

type DrawerSize = "default" | "lg" | "xl";

const sizeMap: Record<DrawerSize, string> = {
  default: "w-full sm:w-[420px]",
  lg: "w-full sm:w-[640px]",
  xl: "w-full sm:w-[800px]",
};

interface DrawerPanelProps {
  open: boolean;
  onClose: () => void;
  size?: DrawerSize;
  children: ReactNode;
}

/**
 * Right-side sliding panel for detail-heavy views.
 * iOS 26 style: frosted glass backdrop, spring slide animation.
 *
 * Used for: dispatch detail, patron quick-view, evidence chain of custody.
 */
export function DrawerPanel({
  open,
  onClose,
  size = "default",
  children,
}: DrawerPanelProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animate in/out
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    []
  );

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Overlay */}
      <div
        className={clsx(
          "absolute inset-0 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        style={{
          backgroundColor: "var(--overlay, rgba(0,0,0,0.3))",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={clsx(
          "absolute right-0 top-0 h-full",
          sizeMap[size],
          "max-w-full sm:max-w-[90vw]",
          "bg-[var(--surface-primary)] border-l border-[var(--border-default)]",
          "shadow-2xl",
          "flex flex-col overflow-hidden",
          "transition-transform duration-300",
          visible ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ── Compound Sub-Components ── */

interface DrawerHeaderProps {
  children: ReactNode;
  onClose?: () => void;
}

export function DrawerHeader({ children, onClose }: DrawerHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)] shrink-0">
      <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
        {children}
      </h2>
      {onClose && (
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

interface DrawerContentProps {
  children: ReactNode;
  className?: string;
}

export function DrawerContent({ children, className }: DrawerContentProps) {
  return (
    <div className={clsx("px-5 py-4 overflow-y-auto flex-1", className)}>
      {children}
    </div>
  );
}

interface DrawerFooterProps {
  children: ReactNode;
  className?: string;
}

export function DrawerFooter({ children, className }: DrawerFooterProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)] shrink-0",
        className
      )}
    >
      {children}
    </div>
  );
}
