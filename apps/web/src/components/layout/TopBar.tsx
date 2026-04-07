"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { Bell, ChevronDown, Command, LogOut, Menu, Search, User } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

interface TopBarProps {
  userName?: string;
  userAvatar?: string | null;
  className?: string;
  onMenuToggle?: () => void;
}

export function TopBar({
  userName = "User",
  userAvatar,
  className,
  onMenuToggle,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  async function handleSignOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className={clsx(
        "sticky top-0 z-30 flex items-center justify-between",
        "h-14 px-6",
        "bg-[var(--surface-primary)] border-b border-[var(--border-default)]",
        "dark:backdrop-blur-xl dark:bg-[var(--surface-primary)]/80",
        className
      )}
    >
      {/* Left: Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuToggle}
          className={clsx(
            "lg:hidden flex items-center justify-center h-8 w-8 rounded-md",
            "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
            "transition-colors duration-[var(--duration-fast)]"
          )}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <Breadcrumbs items={[{ label: "Dashboard" }]} />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Command palette trigger */}
        <button
          onClick={() => {
            const event = new KeyboardEvent("keydown", {
              key: "k",
              code: "KeyK",
              metaKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          }}
          className={clsx(
            "flex items-center justify-center gap-1.5 h-8 rounded-md px-2",
            "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
            "transition-colors duration-[var(--duration-fast)]"
          )}
          aria-label="Command palette"
        >
          <Search size={15} />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[11px] text-[var(--text-tertiary)] font-medium bg-[var(--surface-secondary)] border border-[var(--border-default)] rounded px-1 py-0.5">
            <Command size={10} />K
          </kbd>
        </button>

        {/* Notification bell */}
        <button
          className={clsx(
            "relative flex items-center justify-center h-8 w-8 rounded-md",
            "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
            "transition-colors duration-[var(--duration-fast)]"
          )}
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--surface-primary)]" />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={clsx(
              "flex items-center gap-2 ml-1 h-8 pl-1.5 pr-2 rounded-md",
              "hover:bg-[var(--surface-hover)]",
              "transition-colors duration-[var(--duration-fast)]",
              menuOpen && "bg-[var(--surface-hover)]"
            )}
          >
            <div className="h-6 w-6 rounded-full bg-[var(--eztrack-primary-500)]/15 flex items-center justify-center text-[11px] font-semibold text-[var(--eztrack-primary-500)] shrink-0">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-[13px] font-medium text-[var(--text-primary)] hidden sm:block max-w-[120px] truncate">
              {userName}
            </span>
            <ChevronDown
              size={14}
              className={clsx(
                "text-[var(--text-tertiary)] transition-transform duration-150",
                menuOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div
              className={clsx(
                "absolute right-0 top-full mt-1 w-48 py-1 rounded-lg shadow-lg",
                "bg-[var(--surface-primary)] border border-[var(--border-default)]",
                "animate-fade-in z-50"
              )}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/settings");
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
              >
                <User size={15} />
                Profile & Settings
              </button>
              <div className="my-1 h-px bg-[var(--border-default)]" />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-[var(--status-error)] hover:bg-[var(--red-50,#fef2f2)] dark:hover:bg-[var(--red-900,#7f1d1d)]/10 transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
