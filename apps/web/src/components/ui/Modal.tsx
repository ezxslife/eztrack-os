"use client";

import {
  type ReactNode,
  useEffect,
  useRef,
  useCallback,
  useState,
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

const sizeMap = {
  sm: "sm:max-w-[var(--modal-width-sm)]",
  md: "sm:max-w-[var(--modal-width-md)]",
  lg: "sm:max-w-[var(--modal-width-lg)]",
} as const;

type ModalSize = keyof typeof sizeMap;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  children: ReactNode;
}

export function Modal({ open, onClose, size = "md", children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      if (e.key !== "Tab" || !contentRef.current) return;
      const focusable = contentRef.current.querySelectorAll<HTMLElement>(
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

  // Auto-focus first focusable on open
  useEffect(() => {
    if (!open || !contentRef.current) return;
    const timer = setTimeout(() => {
      const focusable = contentRef.current?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={clsx(
        "fixed inset-0 z-50 flex items-end sm:items-center justify-center",
        "animate-[fadeIn_150ms_ease-out]"
      )}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "var(--overlay, rgba(0,0,0,0.4))",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Content */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={clsx(
          "relative w-full",
          sizeMap[size],
          "bg-[var(--surface-primary)] border border-[var(--border-default)]",
          "rounded-t-2xl sm:rounded-2xl",
          "shadow-2xl",
          "sm:animate-[scaleIn_200ms_cubic-bezier(0.34,1.56,0.64,1)]",
          "animate-[slideUp_250ms_cubic-bezier(0.34,1.56,0.64,1)]",
          "max-h-[calc(100dvh-0.75rem)] sm:max-h-[90vh] overflow-hidden flex flex-col",
          "mx-[var(--page-gutter-mobile)] sm:mx-[var(--page-gutter-tablet)]"
        )}
      >
        {children}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}

interface ModalHeaderProps {
  children: ReactNode;
  onClose?: () => void;
}

export function ModalHeader({ children, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border-default)] px-[var(--card-padding-sm)] py-3.5 sm:px-[var(--card-padding-md)]">
      <h2 id="modal-title" className="min-w-0 flex-1 text-[15px] font-semibold text-[var(--text-primary)]">
        {children}
      </h2>
      {onClose && (
        <IconButton
          onClick={onClose}
          className="h-8 w-8 rounded-lg text-[var(--text-secondary)] shadow-none"
          label="Close"
          size="sm"
          type="button"
          variant="ghost"
        >
          <X size={16} />
        </IconButton>
      )}
    </div>
  );
}

interface ModalContentProps {
  children: ReactNode;
  className?: string;
}

export function ModalContent({ children, className }: ModalContentProps) {
  return (
    <div className={clsx("flex-1 overflow-y-auto px-[var(--card-padding-sm)] py-[var(--card-padding-sm)] sm:px-[var(--card-padding-md)] sm:py-[var(--card-padding-md)]", className)}>
      {children}
    </div>
  );
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={clsx(
        "flex flex-col-reverse items-stretch gap-2 border-t border-[var(--border-default)] px-[var(--card-padding-sm)] py-3 sm:flex-row sm:items-center sm:justify-end sm:px-[var(--card-padding-md)]",
        className
      )}
    >
      {children}
    </div>
  );
}
