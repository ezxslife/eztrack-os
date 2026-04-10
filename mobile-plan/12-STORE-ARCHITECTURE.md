# Phase 12: Complete Store Architecture — Zustand + MMKV Deep Reference

> **Goal:** Full specification of every Zustand store needed for EZTrack mobile, with persistence strategy, computed selectors, and inter-store dependencies. Based on EZXS-OS's 26-store production architecture.
> **Reference:** EZXS-OS `apps/mobile/src/stores/` (26 stores, multiple persistence tiers)

---

## 12.1 Storage Tiers

From EZXS-OS, two tiers of persistence plus ephemeral:

| Tier | Storage | Use Case | Survives |
|------|---------|----------|----------|
| **Prefs** | `prefsMMKV` | User preferences (theme, haptics, biometric) | App reinstall (iCloud backup) |
| **App** | `appMMKV` | App state (org, filters, drafts) | App restart, not reinstall |
| **Memory** | None | Transient UI (active sheet, scanner state) | Nothing — lost on background kill |

### Decision Matrix

| Data | Tier | Reason |
|------|------|--------|
| Color scheme, haptic toggle | Prefs | Tiny, rarely changes, user expects to survive |
| Current org, filters, draft forms | App | Medium, needs fast restore on cold boot |
| Active modal/sheet, search input | Memory | Ephemeral, no point persisting |
| Offline queue | Dedicated MMKV | Critical, must survive crash |
| Auth tokens | SecureStore | Encrypted, not MMKV |

---

## 12.2 Complete Store Inventory for EZTrack

### Persistent Stores (App tier)

| Store | Key | Persisted Fields | Purpose |
|-------|-----|-----------------|---------|
| `authStore` | `eztrack-auth` | `lastLogoutReason` only | Auth lifecycle FSM, session, profile |
| `organizationStore` | `eztrack-org` | `currentOrgId`, `currentPropertyId`, `myOrgs` | Multi-org context |
| `filterStore` | `eztrack-filters` | Per-module filter state | Remembered search/filter per module |
| `draftStore` | `eztrack-drafts` | All draft forms | Unsaved create/edit forms |
| `recentSearchStore` | `eztrack-search` | `recentQueries`, `recentResults` | Global search history |
| `coachMarkStore` | `eztrack-coach` | `completedTours[]` | Which onboarding tours are done |
| `scannerSettingsStore` | `eztrack-scanner` | Per-event scanner config | QR scanner preferences |
| `checkInStore` | `eztrack-checkin` | `cachedGuests`, `offlineQueue`, `sessionScanCounts` | Offline check-in data |

### Persistent Stores (Prefs tier)

| Store | Key | Persisted Fields | Purpose |
|-------|-----|-----------------|---------|
| `uiStore` | `eztrack-ui` | `colorScheme`, `sensoryEnabled`, `biometricLockEnabled`, `biometricTimeout` | UI preferences |

### Ephemeral Stores (Memory only)

| Store | Purpose |
|-------|---------|
| `activeSheetStore` | Which bottom sheet/modal is currently open |
| `dispatchBoardStore` | Expanded/collapsed sections, selected dispatch |
| `personnelBoardStore` | Status board view state |
| `mapStore` | Map camera position, selected markers |
| `formStateStore` | In-progress form field values (separate from drafts) |

---

## 12.3 Key Store Implementations

### Draft Store (Survives App Kill)

Critical for field operations — if a user is filling out an incident report and gets interrupted, it must survive.

```typescript
// src/stores/draftStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { appStorage } from "@/lib/storage/mmkv";

interface Draft {
  id: string;
  module: string;       // "incident", "daily-log", "dispatch", etc.
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface DraftState {
  drafts: Record<string, Draft>;  // keyed by `${module}:${draftId}`

  saveDraft: (module: string, data: Record<string, any>, draftId?: string) => string;
  getDraft: (module: string, draftId?: string) => Draft | null;
  deleteDraft: (key: string) => void;
  clearModuleDrafts: (module: string) => void;
  clearAllDrafts: () => void;
  hasDraft: (module: string) => boolean;
}

export const draftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: {},

      saveDraft: (module, data, draftId) => {
        const key = `${module}:${draftId ?? "new"}`;
        const now = new Date().toISOString();
        const existing = get().drafts[key];

        set((state) => ({
          drafts: {
            ...state.drafts,
            [key]: {
              id: draftId ?? "new",
              module,
              data,
              createdAt: existing?.createdAt ?? now,
              updatedAt: now,
            },
          },
        }));
        return key;
      },

      getDraft: (module, draftId) => {
        return get().drafts[`${module}:${draftId ?? "new"}`] ?? null;
      },

      deleteDraft: (key) => {
        set((state) => {
          const { [key]: _, ...rest } = state.drafts;
          return { drafts: rest };
        });
      },

      clearModuleDrafts: (module) => {
        set((state) => ({
          drafts: Object.fromEntries(
            Object.entries(state.drafts).filter(([k]) => !k.startsWith(`${module}:`))
          ),
        }));
      },

      clearAllDrafts: () => set({ drafts: {} }),

      hasDraft: (module) => {
        return Object.keys(get().drafts).some(k => k.startsWith(`${module}:`));
      },
    }),
    {
      name: "eztrack-drafts",
      storage: createJSONStorage(() => appStorage),
    }
  )
);
```

### Filter Store (Per-Module Remembered Filters)

```typescript
// src/stores/filterStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { appStorage } from "@/lib/storage/mmkv";
import type { FilterState } from "@eztrack/shared";

const defaultFilter: FilterState = {
  search: "",
  status: "",
  priority: "",
  dateRange: { from: null, to: null },
  location_id: null,
};

interface FilterStoreState {
  filters: Record<string, FilterState>;

  getFilter: (module: string) => FilterState;
  setFilter: (module: string, updates: Partial<FilterState>) => void;
  clearFilter: (module: string) => void;
  clearAllFilters: () => void;
  hasActiveFilter: (module: string) => boolean;
}

export const filterStore = create<FilterStoreState>()(
  persist(
    (set, get) => ({
      filters: {},

      getFilter: (module) => get().filters[module] ?? defaultFilter,

      setFilter: (module, updates) => {
        set((state) => ({
          filters: {
            ...state.filters,
            [module]: { ...(state.filters[module] ?? defaultFilter), ...updates },
          },
        }));
      },

      clearFilter: (module) => {
        set((state) => ({
          filters: { ...state.filters, [module]: defaultFilter },
        }));
      },

      clearAllFilters: () => set({ filters: {} }),

      hasActiveFilter: (module) => {
        const f = get().filters[module];
        if (!f) return false;
        return !!(f.search || f.status || f.priority || f.dateRange.from || f.location_id);
      },
    }),
    {
      name: "eztrack-filters",
      storage: createJSONStorage(() => appStorage),
    }
  )
);
```

### Dispatch Board Store (Ephemeral)

```typescript
// src/stores/dispatchBoardStore.ts
import { create } from "zustand";

interface DispatchBoardState {
  expandedSections: Record<string, boolean>;  // "active", "pending", "cleared"
  selectedDispatchId: string | null;
  viewMode: "board" | "map";  // Toggle between list and map view
  showOfficerPanel: boolean;

  toggleSection: (section: string) => void;
  selectDispatch: (id: string | null) => void;
  setViewMode: (mode: "board" | "map") => void;
  toggleOfficerPanel: () => void;
}

export const dispatchBoardStore = create<DispatchBoardState>((set) => ({
  expandedSections: { active: true, pending: true, cleared: false },
  selectedDispatchId: null,
  viewMode: "board",
  showOfficerPanel: true,

  toggleSection: (section) =>
    set((s) => ({
      expandedSections: { ...s.expandedSections, [section]: !s.expandedSections[section] },
    })),
  selectDispatch: (id) => set({ selectedDispatchId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleOfficerPanel: () => set((s) => ({ showOfficerPanel: !s.showOfficerPanel })),
}));
```

---

## 12.4 Store Cleanup on Auth Boundaries

From EZXS-OS: clear user-scoped data on sign-out to prevent data leakage between users.

```typescript
// src/lib/storage/cleanup.ts
import { organizationStore } from "@/stores/organizationStore";
import { filterStore } from "@/stores/filterStore";
import { draftStore } from "@/stores/draftStore";
import { recentSearchStore } from "@/stores/recentSearchStore";
import { checkInStore } from "@/stores/checkInStore";
import { queryClient } from "@/lib/api/queryClient";

export function clearUserScopedData() {
  // Clear stores
  organizationStore.getState().clear();
  filterStore.getState().clearAllFilters();
  draftStore.getState().clearAllDrafts();
  recentSearchStore.getState().clear();
  checkInStore.getState().clearAll();

  // Clear React Query cache
  queryClient.clear();

  // Clear offline queue
  clearQueue();

  // Clear SQLite cache
  invalidateAllCache();
}
```

Call `clearUserScopedData()` on:
- Sign out
- Auth error → forced logout
- User switch (if multi-user support added later)

---

## 12.5 Inter-Store Dependencies

```
authStore
  ├── organizationStore (clears on auth change)
  ├── uiStore (reads _hasHydrated before rendering)
  └── all query hooks (gated by authLifecycle)

organizationStore
  ├── filterStore (uses currentOrg.id for scoping)
  ├── all query hooks (use currentOrg.id)
  └── checkInStore (scoped by userId + orgId)

uiStore
  ├── ThemeProvider (reads colorScheme)
  ├── safeHaptics (reads sensoryEnabled)
  └── root layout (reads _hasHydrated)

draftStore
  └── create/edit screens (read/write drafts)

filterStore
  └── all list screens (read/write per-module filters)
```

---

## 12.6 Hydration Gate Pattern

From EZXS-OS: never render UI before stores hydrate from MMKV.

```typescript
// In root _layout.tsx:
const authHydrated = authStore((s) => s._hasHydrated);
const uiHydrated = uiStore((s) => s._hasHydrated);
const orgHydrated = organizationStore((s) => s._hasHydrated);

if (!authHydrated || !uiHydrated || !orgHydrated) {
  return null; // Native splash screen stays visible
}
```

### Hydration Callback

```typescript
// In each persisted store:
onRehydrateStorage: () => (_state, error) => {
  if (error) {
    console.warn("[Store] Hydration error, using defaults");
  }
  queueMicrotask(() => {
    storeRef.setState({ _hasHydrated: true });
  });
},
```

The `queueMicrotask` ensures `_hasHydrated` is set after the full rehydration completes.

---

## 12.7 Verification Checklist

- [ ] All persistent stores survive app kill and cold restart
- [ ] UI preferences (theme, haptics) survive app reinstall (prefs tier)
- [ ] Draft forms survive app backgrounding and return
- [ ] Filters remembered per-module across sessions
- [ ] Sign-out clears all user-scoped data
- [ ] Hydration gate prevents white flash on cold start
- [ ] Offline queue persists across crashes
- [ ] No store circular dependencies (check import graph)
- [ ] Memory-only stores don't cause memory leaks (no unbounded growth)

---

**Back to Index:** [00-INDEX.md](./00-INDEX.md)
