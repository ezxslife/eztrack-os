"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = getSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserName(profile.full_name || user.email || "User");
          setUserAvatar(profile.avatar_url);
        } else {
          setUserName(user.email || "User");
        }
      }
    }

    loadProfile();
  }, []);

  return (
    <div className="flex min-h-screen overflow-hidden bg-[var(--surface-bg)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[var(--action-primary-fill)] focus:text-[var(--text-on-brand)] focus:text-[13px] focus:font-medium"
        >
          Skip to main content
        </a>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          userName={userName}
          userAvatar={userAvatar}
          onMenuToggle={() => setMobileOpen(true)}
        />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-[var(--page-gutter-mobile)] py-4 sm:px-[var(--page-gutter-tablet)] sm:py-5 lg:px-[var(--page-gutter-desktop)] lg:py-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
