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

const sizeMap = {
  sm: "max-w-[400px]",
  md: "max-w-[560px]",
  lg: "max-w-[800px]",
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
          "max-h-[90vh] overflow-hidden flex flex-col"
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
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
      <h2 id="modal-title" className="text-[15px] font-semibold text-[var(--text-primary)]">
        {children}
      </h2>
      {onClose && (
        <button
          onClick={onClose}
          className={clsx(
            "w-7 h-7 rounded-md flex items-center justify-center",
            "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
            "hover:bg-[var(--surface-hover)] active:bg-[var(--surface-pressed)]",
            "transition-colors duration-100 cursor-pointer"
          )}
          aria-label="Close"
        >
          <X size={16} />
        </button>
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
    <div className={clsx("px-5 py-4 overflow-y-auto flex-1", className)}>
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
        "flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]",
        className
      )}
    >
      {children}
    </div>
  );
}
