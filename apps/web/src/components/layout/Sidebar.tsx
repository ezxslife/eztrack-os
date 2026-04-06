"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_ITEMS, NAV_BOTTOM_ITEMS } from "@eztrack/shared";
import {
  LayoutDashboard,
  ClipboardList,
  ShieldAlert,
  Radio,
  Users,
  Package,
  MessageSquare,
  FolderSearch,
  UserCog,
  Wrench,
  UserCheck,
  BarChart3,
  TrendingUp,
  Settings,
  Bell,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  LayoutDashboard,
  ClipboardList,
  ShieldAlert,
  Radio,
  Users,
  Package,
  MessageSquare,
  FolderSearch,
  UserCog,
  Wrench,
  UserCheck,
  BarChart3,
  TrendingUp,
  Settings,
  Bell,
  AlertTriangle,
};

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  userName?: string;
  userRole?: string;
  userAvatar?: string | null;
}

export function Sidebar({
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose,
  userName = "Marcus Chen",
  userRole = "Manager",
  userAvatar,
}: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToggle?.();
  };

  const renderNavItem = (
    item: { label: string; href: string; icon: string },
    index: number
  ) => {
    const Icon = ICON_MAP[item.icon];
    const isActive =
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(item.href));

    return (
      <Link
        key={`${item.href}-${index}`}
        href={item.href}
        className={clsx(
          "group relative flex items-center gap-2.5 h-9 px-3 rounded-lg text-[13px] font-medium",
          "transition-all duration-[var(--duration-fast)] ease-[var(--ease-default)]",
          isActive
            ? "bg-[var(--surface-selected)] text-[var(--interactive)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        )}
        aria-current={isActive ? "page" : undefined}
        title={isCollapsed ? item.label : undefined}
      >
        {/* Active accent bar */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-[var(--interactive)]" />
        )}
        {Icon && (
          <Icon
            size={18}
            className={clsx(
              "shrink-0 transition-colors duration-[var(--duration-fast)]",
              isActive
                ? "text-[var(--interactive)]"
                : "text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]"
            )}
          />
        )}
        {!isCollapsed && (
          <span
            className={clsx(
              "truncate transition-opacity duration-[var(--duration-normal)]",
              isCollapsed ? "opacity-0" : "opacity-100"
            )}
          >
            {item.label}
          </span>
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <aside
      className={clsx(
        "flex flex-col h-screen shrink-0",
        "bg-[var(--surface-primary)] border-r border-[var(--border-default)]",
        "transition-[width] duration-[var(--duration-normal)] ease-[var(--ease-default)]",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div
        className={clsx(
          "flex items-center gap-2.5 h-14 shrink-0 border-b border-[var(--border-subdued)]",
          isCollapsed ? "justify-center px-0" : "px-4"
        )}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--eztrack-primary-500)] shrink-0">
          <Shield size={18} className="text-white" />
        </div>
        {!isCollapsed && (
          <span className="text-[15px] font-bold text-[var(--text-primary)] tracking-tight">
            EZTrack
          </span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {NAV_ITEMS.map((item, i) => renderNavItem(item, i))}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-[var(--border-subdued)]" />

      {/* Bottom nav */}
      <div className="px-2 py-2 space-y-0.5">
        {NAV_BOTTOM_ITEMS.map((item, i) => renderNavItem(item, i + 100))}
      </div>

      {/* User profile */}
      <div
        className={clsx(
          "border-t border-[var(--border-subdued)] px-3 py-3",
          isCollapsed && "flex justify-center px-0"
        )}
      >
        <div className={clsx("flex items-center", isCollapsed ? "justify-center" : "gap-2.5")}>
          <div className="h-8 w-8 rounded-full bg-[var(--eztrack-primary-500)]/15 flex items-center justify-center shrink-0 text-[13px] font-semibold text-[var(--eztrack-primary-500)]">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[var(--text-primary)] truncate leading-tight">
                {userName}
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)] truncate leading-tight">
                {userRole}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={handleToggle}
        className={clsx(
          "flex items-center justify-center h-9 border-t border-[var(--border-subdued)]",
          "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
          "transition-colors duration-[var(--duration-fast)]"
        )}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight size={16} />
        ) : (
          <ChevronLeft size={16} />
        )}
      </button>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">{sidebarContent}</div>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div
            className={clsx(
              "relative z-10 transition-transform duration-300",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
