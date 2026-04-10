# Phase 3: Auth & Data Layer — Supabase, Stores & Offline

> **Goal:** Wire up Supabase authentication, build the React Query data layer, implement Zustand stores with MMKV persistence, and lay groundwork for offline-first sync.
> **Duration:** 3–4 days
> **Prerequisites:** Phase 1 (Expo scaffold), Phase 2 (theme system)
> **Reference:** EZXS-OS `apps/mobile/src/lib/api/`, `apps/mobile/src/stores/`, `apps/mobile/src/providers/`

---

## 3.1 Supabase Client for React Native

### `src/lib/api/client.ts`

```typescript
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Secure storage adapter for auth tokens
const secureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: secureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Not needed for RN
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return _supabase;
}
```

### Key Differences from Web

| Web (`packages/api`) | Mobile |
|----------------------|--------|
| `@supabase/ssr` for cookies | `expo-secure-store` for encrypted token storage |
| `createBrowserClient()` | `createClient()` with custom storage adapter |
| `createServerClient()` for RSC | Not needed (no server components) |
| Session via cookies | Session via SecureStore (encrypted keychain) |

---

## 3.2 Auth Store (Zustand + MMKV)

### `src/stores/authStore.ts`

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { prefsStorage } from "@/lib/storage/mmkv";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile } from "@eztrack/shared";

// Auth lifecycle FSM (from EZXS-OS pattern)
export type AuthLifecycle =
  | "initializing"
  | "authenticating"
  | "active"
  | "signed_out"
  | "error";

const ALLOWED_TRANSITIONS: Record<AuthLifecycle, AuthLifecycle[]> = {
  initializing:   ["authenticating", "active", "signed_out", "error"],
  signed_out:     ["authenticating", "active", "error"],
  authenticating: ["active", "signed_out", "error"],
  active:         ["signed_out", "error"],
  error:          ["initializing", "authenticating", "signed_out"],
};

interface AuthState {
  // Session
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Lifecycle FSM
  authLifecycle: AuthLifecycle;

  // Hydration gate
  _hasHydrated: boolean;

  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  transitionLifecycle: (next: AuthLifecycle) => boolean;
  clearAuth: () => void;
}

export const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      authLifecycle: "initializing",
      _hasHydrated: false,

      setSession: (session) => {
        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
        });
      },

      setProfile: (profile) => set({ profile }),

      transitionLifecycle: (next) => {
        const current = get().authLifecycle;
        const allowed = ALLOWED_TRANSITIONS[current];
        if (!allowed?.includes(next)) {
          console.warn(`[AuthFSM] Invalid transition: ${current} → ${next}`);
          return false;
        }
        set({ authLifecycle: next });
        return true;
      },

      clearAuth: () => {
        set({
          session: null,
          user: null,
          profile: null,
          isAuthenticated: false,
          authLifecycle: "signed_out",
        });
      },
    }),
    {
      name: "eztrack-auth",
      storage: createJSONStorage(() => prefsStorage),
      partialize: (state) => ({
        // Only persist minimal data — session is in SecureStore
        _lastAuthLifecycle: state.authLifecycle,
      }),
      onRehydrateStorage: () => (_state, error) => {
        queueMicrotask(() => authStore.setState({ _hasHydrated: true }));
      },
    }
  )
);
```

---

## 3.3 MMKV Storage Setup

### `src/lib/storage/mmkv.ts`

```typescript
import { MMKV } from "react-native-mmkv";
import type { StateStorage } from "zustand/middleware";

// Separate MMKV instances for different concerns
const prefsMMKV = new MMKV({ id: "eztrack-prefs" });
const appMMKV = new MMKV({ id: "eztrack-app" });

// Fallback for environments where MMKV isn't available
const memoryStore = new Map<string, string>();

function createStorageAdapter(mmkv: MMKV): StateStorage {
  return {
    getItem: (name: string) => {
      try {
        return mmkv.getString(name) ?? null;
      } catch {
        return memoryStore.get(name) ?? null;
      }
    },
    setItem: (name: string, value: string) => {
      try {
        mmkv.set(name, value);
      } catch {
        memoryStore.set(name, value);
      }
    },
    removeItem: (name: string) => {
      try {
        mmkv.delete(name);
      } catch {
        memoryStore.delete(name);
      }
    },
  };
}

export const prefsStorage = createStorageAdapter(prefsMMKV);
export const appStorage = createStorageAdapter(appMMKV);
```

---

## 3.4 Auth Provider

### `src/providers/AuthProvider.tsx`

```typescript
import React, { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { getSupabase } from "@/lib/api/client";
import { authStore } from "@/stores/authStore";
import { focusManager } from "@tanstack/react-query";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const previousAuth = useRef({ isAuthenticated: false, userId: null as string | null });

  useEffect(() => {
    const supabase = getSupabase();

    // Cold boot: restore session
    supabase.auth.getSession().then(({ data: { session } }) => {
      authStore.getState().setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        authStore.getState().transitionLifecycle("active");
      } else {
        authStore.getState().transitionLifecycle("signed_out");
      }
      authStore.setState({ isLoading: false });
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        authStore.getState().setSession(session);

        if (event === "SIGNED_IN" && session) {
          await fetchProfile(session.user.id);
          authStore.getState().transitionLifecycle("active");
        }

        if (event === "SIGNED_OUT") {
          authStore.getState().clearAuth();
        }

        if (event === "TOKEN_REFRESHED" && session) {
          authStore.getState().setSession(session);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // App state: pause/resume auto-refresh
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      const supabase = getSupabase();
      if (state === "active") {
        focusManager.setFocused(true);
        supabase.auth.startAutoRefresh();
      } else {
        focusManager.setFocused(false);
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => sub.remove();
  }, []);

  return <>{children}</>;
}

async function fetchProfile(userId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (data) {
    authStore.getState().setProfile(data);
  }
}
```

---

## 3.5 Organization Store

### `src/stores/organizationStore.ts`

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { appStorage } from "@/lib/storage/mmkv";
import type { Organization, Property, Location } from "@eztrack/shared";

interface OrgState {
  currentOrg: Organization | null;
  currentProperty: Property | null;
  locations: Location[];
  _hasHydrated: boolean;

  setOrg: (org: Organization) => void;
  setProperty: (property: Property) => void;
  setLocations: (locations: Location[]) => void;
  clear: () => void;
}

export const organizationStore = create<OrgState>()(
  persist(
    (set) => ({
      currentOrg: null,
      currentProperty: null,
      locations: [],
      _hasHydrated: false,

      setOrg: (org) => set({ currentOrg: org }),
      setProperty: (property) => set({ currentProperty: property }),
      setLocations: (locations) => set({ locations }),
      clear: () => set({ currentOrg: null, currentProperty: null, locations: [] }),
    }),
    {
      name: "eztrack-org",
      storage: createJSONStorage(() => appStorage),
      onRehydrateStorage: () => () => {
        organizationStore.setState({ _hasHydrated: true });
      },
    }
  )
);
```

---

## 3.6 UI Store

### `src/stores/uiStore.ts`

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { prefsStorage } from "@/lib/storage/mmkv";

type ColorSchemePreference = "light" | "dark" | "system";

interface UiState {
  colorScheme: ColorSchemePreference;
  sensoryEnabled: boolean; // Haptics
  _hasHydrated: boolean;

  setColorScheme: (scheme: ColorSchemePreference) => void;
  setSensoryEnabled: (enabled: boolean) => void;
}

export const uiStore = create<UiState>()(
  persist(
    (set) => ({
      colorScheme: "dark", // Default dark for security ops
      sensoryEnabled: true,
      _hasHydrated: false,

      setColorScheme: (scheme) => set({ colorScheme: scheme }),
      setSensoryEnabled: (enabled) => set({ sensoryEnabled: enabled }),
    }),
    {
      name: "eztrack-ui",
      storage: createJSONStorage(() => prefsStorage),
      onRehydrateStorage: () => () => {
        uiStore.setState({ _hasHydrated: true });
      },
    }
  )
);

export function resolveColorSchemePreference(state: UiState): ColorSchemePreference {
  return state.colorScheme;
}
```

---

## 3.7 React Query Setup

### `src/lib/api/queryClient.ts`

```typescript
import { QueryClient } from "@tanstack/react-query";
import { onlineManager } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";

// Online detection via NetInfo
onlineManager.setEventListener((setOnline) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected && !!state.isInternetReachable);
  });
  return () => unsubscribe();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry auth errors
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 30 * 60 * 1000,      // 30 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
```

---

## 3.8 Query Hook Pattern

Every module gets a dedicated hooks file. Example for incidents:

### `src/lib/api/hooks/useIncidents.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/api/client";
import { organizationStore } from "@/stores/organizationStore";
import type { Incident } from "@eztrack/shared";

// ── Query Keys ───────────────────────────────────────────────
export const incidentKeys = {
  all: ["incidents"] as const,
  list: (orgId: string) => ["incidents", "list", orgId] as const,
  detail: (id: string) => ["incidents", "detail", id] as const,
};

// ── Fetch Functions (mirror web lib/queries/incidents.ts) ────
async function fetchIncidents(orgId: string): Promise<Incident[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incidents")
    .select(`
      id,
      record_number,
      incident_type,
      severity,
      status,
      synopsis,
      created_at,
      updated_at,
      location:locations!location_id(id, name),
      creator:profiles!created_by(id, full_name, avatar_url)
    `)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as Incident[];
}

async function fetchIncidentDetail(id: string): Promise<Incident> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incidents")
    .select(`
      *,
      location:locations!location_id(id, name),
      creator:profiles!created_by(id, full_name, avatar_url)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as unknown as Incident;
}

// ── React Query Hooks ────────────────────────────────────────
export function useIncidents() {
  const orgId = organizationStore((s) => s.currentOrg?.id);

  return useQuery({
    queryKey: incidentKeys.list(orgId ?? ""),
    queryFn: () => fetchIncidents(orgId!),
    enabled: !!orgId,
  });
}

export function useIncidentDetail(id: string) {
  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: () => fetchIncidentDetail(id),
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  const orgId = organizationStore.getState().currentOrg?.id;

  return useMutation({
    mutationFn: async (input: Partial<Incident>) => {
      const supabase = getSupabase();

      // Get next record number
      const { data: recNum } = await supabase.rpc("next_record_number", {
        p_org_id: orgId,
        p_prefix: "INC",
      });

      const { data, error } = await supabase
        .from("incidents")
        .insert({ ...input, org_id: orgId, record_number: recNum })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.list(orgId ?? "") });
    },
  });
}
```

### Module Hook Index

Build similar hooks for every module:

| Hook File | Queries | Mutations |
|-----------|---------|-----------|
| `useIncidents.ts` | list, detail | create, update, updateStatus |
| `useDailyLogs.ts` | list, detail | create, update |
| `useDispatches.ts` | list, detail, active | create, assign, clear, escalate |
| `useCases.ts` | list, detail | create, update, addEvidence |
| `usePatrons.ts` | list, detail, search | create, update, updateFlag |
| `usePersonnel.ts` | list, detail, available | create, update, updateStatus |
| `useLostFound.ts` | list, detail | create, update, markReturned |
| `useVisitors.ts` | list, detail | create, signIn, signOut |
| `useVehicles.ts` | list, detail | create, update |
| `useWorkOrders.ts` | list, detail | create, update, assign |
| `useContacts.ts` | list, detail | create, update |
| `useBriefings.ts` | list, detail | create |
| `useAlerts.ts` | list, active | acknowledge, resolve |
| `useNotifications.ts` | list, unreadCount | markRead |
| `useDashboard.ts` | kpis, recentActivity | — |
| `useAnalytics.ts` | byModule, trends | — |
| `useProfile.ts` | current | update, uploadAvatar |
| `useLocations.ts` | tree, flat | — |

---

## 3.9 Offline Queue (Foundation)

### `src/lib/offline/syncQueue.ts`

```typescript
import { MMKV } from "react-native-mmkv";

const offlineMMKV = new MMKV({ id: "eztrack-offline" });

export interface OfflineAction {
  id: string;
  table: string;
  operation: "insert" | "update" | "delete";
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
}

const QUEUE_KEY = "offline-queue";

export function enqueueOfflineAction(action: Omit<OfflineAction, "id" | "createdAt" | "retryCount">) {
  const queue = getQueue();
  queue.push({
    ...action,
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  });
  offlineMMKV.set(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueue(): OfflineAction[] {
  const raw = offlineMMKV.getString(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function removeFromQueue(id: string) {
  const queue = getQueue().filter((a) => a.id !== id);
  offlineMMKV.set(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  offlineMMKV.delete(QUEUE_KEY);
}
```

Full offline sync implementation is in Phase 9. This establishes the storage layer.

---

## 3.10 Realtime Subscription Hook

### `src/hooks/useRealtimeSubscription.ts`

```typescript
import { useEffect, useRef } from "react";
import { getSupabase } from "@/lib/api/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeOptions<T> {
  table: string;
  filter?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  onInsert?: (record: T) => void;
  onUpdate?: (record: T) => void;
  onDelete?: (record: T) => void;
  enabled?: boolean;
}

export function useRealtimeSubscription<T = any>({
  table,
  filter,
  event = "*",
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: RealtimeOptions<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const supabase = getSupabase();
    const channelName = `realtime:${table}:${filter ?? "all"}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: event === "*" ? undefined : event,
          schema: "public",
          table,
          filter,
        } as any,
        (payload: any) => {
          const record = (payload.new ?? payload.old) as T;
          if (payload.eventType === "INSERT") onInsert?.(record);
          if (payload.eventType === "UPDATE") onUpdate?.(record);
          if (payload.eventType === "DELETE") onDelete?.(record);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, event, enabled]);
}
```

---

## 3.11 Role-Based Access Hook

### `src/hooks/useRoleGate.ts`

```typescript
import { authStore } from "@/stores/authStore";
import { StaffRole } from "@eztrack/shared";

const ROLE_HIERARCHY: Record<StaffRole, number> = {
  [StaffRole.SuperAdmin]: 7,
  [StaffRole.OrgAdmin]: 6,
  [StaffRole.Manager]: 5,
  [StaffRole.Dispatcher]: 4,
  [StaffRole.Supervisor]: 3,
  [StaffRole.Staff]: 2,
  [StaffRole.Viewer]: 1,
};

export function useRoleGate() {
  const profile = authStore((s) => s.profile);
  const role = profile?.role as StaffRole | undefined;
  const level = role ? ROLE_HIERARCHY[role] ?? 0 : 0;

  return {
    role,
    level,
    isAtLeast: (minRole: StaffRole) => level >= ROLE_HIERARCHY[minRole],
    canCreate: level >= ROLE_HIERARCHY[StaffRole.Staff],
    canAssign: level >= ROLE_HIERARCHY[StaffRole.Dispatcher],
    canManage: level >= ROLE_HIERARCHY[StaffRole.Manager],
    canAdmin: level >= ROLE_HIERARCHY[StaffRole.OrgAdmin],
    isSuperAdmin: role === StaffRole.SuperAdmin,
  };
}
```

---

## 3.12 Verification Checklist

- [ ] Supabase client connects and authenticates via email/password
- [ ] Auth tokens stored securely in SecureStore (not AsyncStorage)
- [ ] Auth lifecycle transitions correctly: initializing → active / signed_out
- [ ] Profile fetched after sign-in and stored in authStore
- [ ] MMKV persists UI preferences across app restarts
- [ ] Organization store hydrates from MMKV on cold boot
- [ ] React Query fetches incidents list when org is set
- [ ] Realtime subscription receives INSERT events on incidents table
- [ ] Offline queue enqueues and persists actions
- [ ] Role gate correctly identifies permission levels
- [ ] App backgrounding stops auto-refresh; foregrounding resumes
- [ ] Theme hydration gate prevents rendering before `_hasHydrated`

---

**Previous:** [← Phase 2 — Design System](./02-DESIGN-SYSTEM.md)
**Next:** [Phase 4 — Navigation Shell →](./04-NAVIGATION-SHELL.md)
