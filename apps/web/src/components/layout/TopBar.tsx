"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import clsx from "clsx";
import { Bell, ChevronDown, Command, LogOut, Menu, Search, User } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

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
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Realtime subscription for notifications table
  useRealtimeSubscription<Record<string, unknown>>({
    table: "notifications",
    onInsert: useCallback(
      (record: Record<string, unknown>) => {
        setUnreadCount((c) => c + 1);
        const title = (record.title as string) || "New notification";
        toast(title, { variant: "info" });
      },
      [toast],
    ),
  });

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
        "min-h-[var(--topbar-height)] px-[var(--page-gutter-mobile)] sm:px-[var(--page-gutter-tablet)] lg:px-[var(--page-gutter-desktop)]",
        "bg-[var(--surface-primary)] border-b border-[var(--border-default)]",
        "dark:backdrop-blur-xl dark:bg-[var(--surface-primary)]/80",
        className
      )}
    >
      {/* Left: Hamburger + Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-2">
        <IconButton
          onClick={onMenuToggle}
          className="lg:hidden text-[var(--text-secondary)]"
          label="Open menu"
          size="md"
          type="button"
          variant="ghost"
        >
          <Menu size={20} />
        </IconButton>
        <Breadcrumbs items={[{ label: "Dashboard" }]} />
      </div>

      {/* Right: Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Command palette trigger */}
        <Button
          onClick={() => {
            const event = new KeyboardEvent("keydown", {
              key: "k",
              code: "KeyK",
              metaKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          }}
          className="gap-2 px-2.5 text-[var(--text-secondary)] shadow-none"
          size="md"
          type="button"
          variant="ghost"
        >
          <Search size={15} />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[11px] text-[var(--text-tertiary)] font-medium bg-[var(--surface-secondary)] border border-[var(--border-default)] rounded px-1 py-0.5">
            <Command size={10} />K
          </kbd>
        </Button>

        {/* Notification bell */}
        <IconButton
          onClick={() => {
            setUnreadCount(0);
            router.push("/alerts");
          }}
          badge={
            unreadCount > 0 ? (
              <span className="flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-[var(--surface-primary)]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null
          }
          className="text-[var(--text-secondary)]"
          label="Notifications"
          size="md"
          type="button"
          variant="ghost"
        >
          <Bell size={16} />
        </IconButton>

        {/* User dropdown */}
        <div className="relative" ref={menuRef}>
          <Button
            onClick={() => setMenuOpen(!menuOpen)}
            className={clsx(
              "ml-1 h-10 gap-2 rounded-[var(--btn-radius)] border-transparent px-2 text-[var(--text-primary)] shadow-none",
              menuOpen && "bg-[var(--surface-hover)] text-[var(--text-primary)]"
            )}
            size="md"
            type="button"
            variant="ghost"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--action-primary-surface)] text-[11px] font-semibold text-[var(--action-primary)]">
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
          </Button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div
              className={clsx(
                "absolute right-0 top-full mt-1 w-48 py-1 rounded-lg shadow-lg",
                "bg-[var(--surface-primary)] border border-[var(--border-default)]",
                "animate-fade-in z-50"
              )}
            >
              <Button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/settings");
                }}
                className="w-full justify-start border-transparent px-3 text-[13px] font-medium text-[var(--text-secondary)] shadow-none hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                size="md"
                type="button"
                variant="ghost"
              >
                <User size={15} />
                Profile & Settings
              </Button>
              <div className="my-1 h-px bg-[var(--border-default)]" />
              <Button
                onClick={handleSignOut}
                className="w-full justify-start border-transparent px-3 text-[13px] font-medium text-[var(--status-critical)] shadow-none hover:bg-[var(--status-critical-surface)] hover:text-[var(--status-critical)]"
                size="md"
                type="button"
                variant="ghost"
              >
                <LogOut size={15} />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
