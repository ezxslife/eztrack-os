"use client";

import {
  type ReactNode,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  AlertTriangle,
  FileText,
  Radio,
  Briefcase,
  Users,
  Wrench,
  Shield,
  Home,
  Calendar,
  MapPin,
  Settings,
  Moon,
  Menu,
  Zap,
  Clock,
  Book,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { globalSearch, type SearchResults } from "@/lib/queries/search";

// Module icons for search results
const MODULE_ICONS: Record<string, React.ElementType> = {
  incidents: AlertTriangle,
  dispatches: Radio,
  patrons: Users,
  contacts: Users,
  cases: Briefcase,
};

// Module badge colors
const MODULE_COLORS: Record<string, string> = {
  incidents: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  "daily-log": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  dispatch: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
  cases: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200",
  patrons: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  "work-orders":
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
  personnel: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200",
};

// Module display names
const MODULE_NAMES: Record<string, string> = {
  incidents: "Incidents",
  "daily-log": "Daily Log",
  dispatch: "Dispatch",
  cases: "Cases",
  patrons: "Patrons",
  "work-orders": "Work Orders",
  personnel: "Personnel",
};

interface SearchResult {
  id: string;
  module: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  searchText?: string;
}

interface QuickAction {
  id: string;
  category: "recent" | "create" | "navigate" | "system";
  label: string;
  subtitle?: string;
  icon: React.ElementType;
  onSelect: (callbacks: {
    onToggleDarkMode: () => void;
    onToggleSidebar: () => void;
  }) => void;
}

interface CommandPaletteProps {
  onToggleDarkMode?: () => void;
  onToggleSidebar?: () => void;
}

// Fuzzy search helper
const fuzzyMatch = (query: string, text: string): boolean => {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  let qIdx = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      qIdx++;
    }
  }
  return qIdx === q.length;
};

export function CommandPalette({
  onToggleDarkMode,
  onToggleSidebar,
}: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [searching, setSearching] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [liveResults, setLiveResults] = useState<SearchResult[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [recentPages, setRecentPages] = useState<string[]>([
    "Dashboard",
    "Incidents",
    "Dispatch Board",
    "Daily Log",
    "Patrons",
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch orgId once on mount
  useEffect(() => {
    setMounted(true);
    (async () => {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("org_id")
          .eq("id", user.id)
          .single();
        if (profile) setOrgId(profile.org_id);
      }
    })();
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!query || query.length < 2 || !orgId) {
      setLiveResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await globalSearch(orgId, query);
        const mapped: SearchResult[] = [];

        results.incidents.forEach((r) => {
          mapped.push({
            id: r.id,
            module: "incidents",
            title: `${r.record_number ?? "INC"} — ${r.synopsis ?? "Incident"}`,
            subtitle: r.status ?? "",
            icon: AlertTriangle,
          });
        });
        results.dispatches.forEach((r) => {
          mapped.push({
            id: r.id,
            module: "dispatch",
            title: `${r.record_number ?? "DSP"} — ${r.description ?? "Dispatch"}`,
            subtitle: r.status ?? "",
            icon: Radio,
          });
        });
        results.patrons.forEach((r) => {
          mapped.push({
            id: r.id,
            module: "patrons",
            title: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "Patron",
            subtitle: r.flag ? `Flag: ${r.flag}` : "",
            icon: Users,
          });
        });
        results.contacts.forEach((r) => {
          mapped.push({
            id: r.id,
            module: "personnel",
            title: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "Contact",
            subtitle: r.organization_name ?? "",
            icon: Shield,
          });
        });
        results.cases.forEach((r) => {
          mapped.push({
            id: r.id,
            module: "cases",
            title: `${r.record_number ?? "CASE"} — ${r.case_type ?? "Case"}`,
            subtitle: r.status ?? "",
            icon: Briefcase,
          });
        });

        setLiveResults(mapped);
      } catch {
        setLiveResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, orgId]);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build quick actions
  const quickActions = useMemo<QuickAction[]>(() => {
    return [
      {
        id: "recent-dashboard",
        category: "recent",
        label: "Dashboard",
        subtitle: "Recent",
        icon: Clock,
        onSelect: () => {
          router.push("/dashboard");
          setOpen(false);
        },
      },
      {
        id: "recent-incidents",
        category: "recent",
        label: "Incidents",
        subtitle: "Recent",
        icon: Clock,
        onSelect: () => {
          router.push("/incidents");
          setOpen(false);
        },
      },
      {
        id: "recent-dispatch",
        category: "recent",
        label: "Dispatch Board",
        subtitle: "Recent",
        icon: Clock,
        onSelect: () => {
          router.push("/dispatch");
          setOpen(false);
        },
      },
      {
        id: "recent-daily-log",
        category: "recent",
        label: "Daily Log",
        subtitle: "Recent",
        icon: Clock,
        onSelect: () => {
          router.push("/daily-log");
          setOpen(false);
        },
      },
      {
        id: "recent-patrons",
        category: "recent",
        label: "Patrons",
        subtitle: "Recent",
        icon: Clock,
        onSelect: () => {
          router.push("/patrons");
          setOpen(false);
        },
      },
      {
        id: "create-incident",
        category: "create",
        label: "New Incident",
        icon: Zap,
        onSelect: () => {
          router.push("/incidents/new");
          setOpen(false);
        },
      },
      {
        id: "create-report",
        category: "create",
        label: "Quick Report",
        icon: Zap,
        onSelect: () => {
          router.push("/daily-log/new");
          setOpen(false);
        },
      },
      {
        id: "create-dispatch",
        category: "create",
        label: "New Dispatch",
        icon: Zap,
        onSelect: () => {
          router.push("/dispatch/new");
          setOpen(false);
        },
      },
      {
        id: "create-case",
        category: "create",
        label: "New Case",
        icon: Zap,
        onSelect: () => {
          router.push("/cases/new");
          setOpen(false);
        },
      },
      {
        id: "create-work-order",
        category: "create",
        label: "New Work Order",
        icon: Zap,
        onSelect: () => {
          router.push("/work-orders/new");
          setOpen(false);
        },
      },
      {
        id: "create-briefing",
        category: "create",
        label: "New Briefing",
        icon: Zap,
        onSelect: () => {
          router.push("/briefings/new");
          setOpen(false);
        },
      },
      {
        id: "nav-dashboard",
        category: "navigate",
        label: "Dashboard",
        icon: Home,
        onSelect: () => {
          router.push("/dashboard");
          setOpen(false);
        },
      },
      {
        id: "nav-daily-log",
        category: "navigate",
        label: "Daily Log",
        icon: FileText,
        onSelect: () => {
          router.push("/daily-log");
          setOpen(false);
        },
      },
      {
        id: "nav-incidents",
        category: "navigate",
        label: "Incidents",
        icon: AlertTriangle,
        onSelect: () => {
          router.push("/incidents");
          setOpen(false);
        },
      },
      {
        id: "nav-dispatch",
        category: "navigate",
        label: "Dispatch Board",
        icon: Radio,
        onSelect: () => {
          router.push("/dispatch");
          setOpen(false);
        },
      },
      {
        id: "nav-patrons",
        category: "navigate",
        label: "Patrons",
        icon: Users,
        onSelect: () => {
          router.push("/patrons");
          setOpen(false);
        },
      },
      {
        id: "nav-cases",
        category: "navigate",
        label: "Cases",
        icon: Briefcase,
        onSelect: () => {
          router.push("/cases");
          setOpen(false);
        },
      },
      {
        id: "nav-lost-found",
        category: "navigate",
        label: "Lost & Found",
        icon: MapPin,
        onSelect: () => {
          router.push("/lost-and-found");
          setOpen(false);
        },
      },
      {
        id: "nav-personnel",
        category: "navigate",
        label: "Personnel",
        icon: Shield,
        onSelect: () => {
          router.push("/personnel");
          setOpen(false);
        },
      },
      {
        id: "nav-settings",
        category: "navigate",
        label: "Settings",
        icon: Settings,
        onSelect: () => {
          router.push("/settings");
          setOpen(false);
        },
      },
      {
        id: "sys-dark-mode",
        category: "system",
        label: "Toggle Dark Mode",
        icon: Moon,
        onSelect: ({ onToggleDarkMode }) => {
          onToggleDarkMode?.();
        },
      },
      {
        id: "sys-sidebar",
        category: "system",
        label: "Toggle Sidebar",
        icon: Menu,
        onSelect: ({ onToggleSidebar }) => {
          onToggleSidebar?.();
        },
      },
      {
        id: "sys-shortcuts",
        category: "system",
        label: "View Keyboard Shortcuts",
        icon: Book,
        onSelect: () => {
          // Open shortcuts modal or documentation
          setOpen(false);
        },
      },
    ];
  }, [router]);

  // Use live Supabase results
  const searchResults = liveResults;

  // Build display list
  const displayList = useMemo(() => {
    if (query) {
      // When searching: group results by module
      const grouped: Record<string, SearchResult[]> = {};
      searchResults.forEach((result) => {
        if (!grouped[result.module]) {
          grouped[result.module] = [];
        }
        grouped[result.module].push(result);
      });

      const flattened: Array<SearchResult | { type: "group-header"; module: string }> = [];
      Object.entries(grouped).forEach(([module, results]) => {
        flattened.push({ type: "group-header", module });
        flattened.push(...results);
      });

      return flattened;
    } else {
      // When empty: show quick actions grouped by category
      const grouped: Record<string, QuickAction[]> = {
        recent: [],
        create: [],
        navigate: [],
        system: [],
      };

      quickActions.forEach((action) => {
        grouped[action.category].push(action);
      });

      const flattened: Array<QuickAction | { type: "group-header"; category: string }> = [];
      Object.entries(grouped).forEach(([category, actions]) => {
        if (actions.length > 0) {
          flattened.push({ type: "group-header", category });
          flattened.push(...actions);
        }
      });

      return flattened;
    }
  }, [query, searchResults, quickActions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev + 1;
          let idx = next;
          // Skip group headers
          while (
            idx < displayList.length &&
            "type" in displayList[idx] &&
            (displayList[idx] as { type: string }).type === "group-header"
          ) {
            idx++;
          }
          return idx < displayList.length ? idx : prev;
        });
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => {
          let idx = prev - 1;
          // Skip group headers
          while (idx >= 0 && "type" in displayList[idx] && (displayList[idx] as { type: string }).type === "group-header") {
            idx--;
          }
          return idx >= 0 ? idx : prev;
        });
        break;

      case "Enter":
        e.preventDefault();
        const item = displayList[activeIndex];
        if (item && !("type" in item)) {
          if ("category" in item) {
            // It's a QuickAction
            (item as QuickAction).onSelect({
              onToggleDarkMode: onToggleDarkMode || (() => {}),
              onToggleSidebar: onToggleSidebar || (() => {}),
            });
          } else {
            // It's a SearchResult - navigate
            const result = item as SearchResult;
            navigateToResult(result);
          }
          setOpen(false);
        }
        break;

      case "Escape":
        setOpen(false);
        break;
    }
  };

  const navigateToResult = (result: SearchResult) => {
    const routes: Record<string, string> = {
      incidents: `/incidents/${result.id}`,
      "daily-log": `/daily-log/${result.id}`,
      dispatch: `/dispatch/${result.id}`,
      cases: `/cases/${result.id}`,
      patrons: `/patrons/${result.id}`,
      "work-orders": `/work-orders/${result.id}`,
      personnel: `/contacts/${result.id}`,
    };

    router.push(routes[result.module] || "/");
    setOpen(false);
  };

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(
      `[data-index="${activeIndex}"]`
    );
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Reset active index on query change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />

      {/* Palette Panel */}
      <div
        className={clsx(
          "relative w-full max-w-2xl mx-4 rounded-xl shadow-2xl overflow-hidden",
          "border border-[var(--border-default)]"
        )}
        style={{
          backgroundColor: "var(--surface-primary)",
          backdropFilter: "blur(24px) saturate(1.5)",
          WebkitBackdropFilter: "blur(24px) saturate(1.5)",
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div
          className="flex items-center gap-3 px-4 border-b"
          style={{ borderColor: "var(--border-default)", height: "40px" }}
        >
          <Search
            size={20}
            className="flex-shrink-0"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all modules..."
            className="w-full h-full bg-transparent text-[13px] font-medium outline-none border-none"
            style={{
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[480px] overflow-y-auto"
          role="listbox"
        >
          {displayList.length === 0 ? (
            <div
              className="px-4 py-8 text-center text-[13px] flex flex-col items-center gap-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : query && query.length >= 2 ? (
                "No results found"
              ) : query ? (
                "Type at least 2 characters to search"
              ) : (
                "Start typing or select an action"
              )}
            </div>
          ) : (
            displayList.map((item, idx) => {
              if ("type" in item && item.type === "group-header") {
                const header = item as { type: "group-header"; module?: string; category?: string };
                const label = header.module
                  ? MODULE_NAMES[header.module]
                  : header.category === "recent"
                    ? "Recent"
                    : header.category === "create"
                      ? "Create"
                      : header.category === "navigate"
                        ? "Navigate"
                        : "System";

                return (
                  <div
                    key={`${header.module || header.category}-header`}
                    className="px-4 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {label}
                  </div>
                );
              }

              const isSearchResult = !("category" in item);
              const result = item as SearchResult;
              const action = item as QuickAction;

              return (
                <div
                  key={`${isSearchResult ? result.id : action.id}`}
                  role="option"
                  aria-selected={idx === activeIndex}
                  data-index={idx}
                  onClick={() => {
                    if (isSearchResult) {
                      navigateToResult(result);
                    } else {
                      action.onSelect({
                        onToggleDarkMode: onToggleDarkMode || (() => {}),
                        onToggleSidebar: onToggleSidebar || (() => {}),
                      });
                    }
                    setOpen(false);
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors duration-75"
                  )}
                  style={{
                    backgroundColor:
                      idx === activeIndex
                        ? "var(--surface-selected, var(--surface-hover))"
                        : "transparent",
                    height: "36px",
                  }}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {isSearchResult ? (
                      <result.icon size={20} style={{ color: "var(--text-tertiary)" }} />
                    ) : (
                      <action.icon size={20} style={{ color: "var(--text-tertiary)" }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[13px] font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {isSearchResult ? result.title : action.label}
                    </div>
                    {(isSearchResult ? result.subtitle : action.subtitle) && (
                      <div
                        className="text-[12px] truncate"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {isSearchResult ? result.subtitle : action.subtitle}
                      </div>
                    )}
                  </div>

                  {/* Badge */}
                  {isSearchResult && (
                    <div
                      className={clsx(
                        "flex-shrink-0 px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap",
                        MODULE_COLORS[result.module] || "bg-gray-100 text-gray-700"
                      )}
                    >
                      {MODULE_NAMES[result.module]}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2 border-t flex items-center justify-center gap-4 text-[11px]"
          style={{
            borderColor: "var(--border-default)",
            color: "var(--text-tertiary)",
          }}
        >
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>esc Close</span>
        </div>

        <style>{`
          @keyframes commandPaletteEnter {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-4px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          div[role="listbox"] {
            scrollbar-width: thin;
            scrollbar-color: var(--border-default) transparent;
          }

          div[role="listbox"]::-webkit-scrollbar {
            width: 6px;
          }

          div[role="listbox"]::-webkit-scrollbar-track {
            background: transparent;
          }

          div[role="listbox"]::-webkit-scrollbar-thumb {
            background: var(--border-default);
            border-radius: 3px;
          }

          div[role="listbox"]::-webkit-scrollbar-thumb:hover {
            background: var(--text-tertiary);
          }
        `}</style>
      </div>

      <style>{`
        @keyframes commandPaletteEnter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        div[style*="backdropFilter"] {
          animation: commandPaletteEnter 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>,
    document.body
  );
}

// Hook for external control
export function useCommandPalette(onOpenChange?: (open: boolean) => void) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  return { open, setOpen };
}
