"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import clsx from "clsx";

interface DropdownContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
}

const DropdownContext = createContext<DropdownContextValue>({
  open: false,
  setOpen: () => {},
  activeIndex: -1,
  setActiveIndex: () => {},
});

interface DropdownProps {
  children: ReactNode;
}

export function Dropdown({ children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Reset active index when menu closes
  useEffect(() => {
    if (!open) setActiveIndex(-1);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, activeIndex, setActiveIndex }}>
      <div ref={containerRef} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

interface DropdownTriggerProps {
  children: ReactNode;
}

export function DropdownTrigger({ children }: DropdownTriggerProps) {
  const { open, setOpen } = useContext(DropdownContext);

  return (
    <div
      onClick={() => setOpen(!open)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(!open);
        }
        if (e.key === "Escape" && open) setOpen(false);
      }}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-haspopup="menu"
    >
      {children}
    </div>
  );
}

interface DropdownMenuProps {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function DropdownMenu({
  children,
  align = "left",
  className,
}: DropdownMenuProps) {
  const { open, setOpen, activeIndex, setActiveIndex } =
    useContext(DropdownContext);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLElement[]>([]);

  const collectItems = useCallback(() => {
    if (!menuRef.current) return [];
    return Array.from(
      menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]')
    );
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = collectItems();
    if (!items.length) return;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
        setActiveIndex(next);
        items[next]?.focus();
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = activeIndex > 0 ? activeIndex - 1 : items.length - 1;
        setActiveIndex(prev);
        items[prev]?.focus();
        break;
      }
      case "Escape":
        setOpen(false);
        break;
      case "Enter":
      case " ":
        if (activeIndex >= 0) {
          e.preventDefault();
          items[activeIndex]?.click();
        }
        break;
    }
  };

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={clsx(
        "absolute z-50 mt-1 min-w-[180px] py-1",
        "bg-[var(--surface-primary)] border border-[var(--border-default)]",
        "rounded-lg shadow-lg",
        "animate-[slideDown_150ms_ease-out]",
        align === "right" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  disabled = false,
  icon,
  className,
}: DropdownItemProps) {
  const { setOpen } = useContext(DropdownContext);

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    setOpen(false);
  };

  return (
    <div
      role="menuitem"
      tabIndex={-1}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={clsx(
        "flex items-center gap-2 px-3 py-1.5 text-[13px] cursor-pointer select-none",
        "text-[var(--text-primary)]",
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-[var(--surface-hover)] active:bg-[var(--surface-pressed)]",
        "transition-colors duration-75",
        "focus:outline-none focus:bg-[var(--surface-hover)]",
        className
      )}
      aria-disabled={disabled}
    >
      {icon && (
        <span className="w-4 h-4 flex items-center justify-center text-[var(--text-tertiary)]">
          {icon}
        </span>
      )}
      {children}
    </div>
  );
}

export function DropdownSeparator() {
  return (
    <div className="my-1 border-t border-[var(--border-subdued,var(--border-default))]" />
  );
}
