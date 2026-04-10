# Phase 9: Real-time, Push Notifications & Offline Sync

> **Goal:** Make EZTrack a truly live operations tool — real-time data updates, native push notifications for critical alerts, and offline-first capability for field staff in low-connectivity areas.
> **Duration:** 3–4 days
> **Prerequisites:** Phase 3 (data layer foundation), Phase 5–8 (all modules built)

---

## 9.1 Supabase Realtime Strategy

### Channel Architecture

Each org gets dedicated realtime channels. Subscribe per-screen to minimize bandwidth.

```typescript
// Channel naming convention:
`org:${orgId}:incidents`       // Incident changes
`org:${orgId}:dispatches`      // Dispatch board (highest priority)
`org:${orgId}:daily_logs`      // Daily log updates
`org:${orgId}:alerts`          // System alerts
`org:${orgId}:staff_status`    // Officer availability
`org:${orgId}:notifications`   // User-specific notifications
`org:${orgId}:briefings`       // Briefing posts
`org:${orgId}:anonymous`       // Anonymous report submissions
```

### Subscription Management

```typescript
// src/providers/RealtimeProvider.tsx
import React, { useEffect } from "react";
import { getSupabase } from "@/lib/api/client";
import { organizationStore } from "@/stores/organizationStore";
import { authStore } from "@/stores/authStore";
import { queryClient } from "@/lib/api/queryClient";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const orgId = organizationStore((s) => s.currentOrg?.id);
  const isAuthenticated = authStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!orgId || !isAuthenticated) return;

    const supabase = getSupabase();

    // Critical: Dispatch board — always subscribed when authenticated
    const dispatchChannel = supabase
      .channel(`org:${orgId}:dispatches`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "dispatches",
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["dispatches"] });
      })
      .subscribe();

    // Alerts — always subscribed for critical notifications
    const alertChannel = supabase
      .channel(`org:${orgId}:alerts`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "alerts",
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
        // Trigger local notification for critical alerts
        if (payload.new.severity === "critical") {
          showCriticalAlertNotification(payload.new);
        }
      })
      .subscribe();

    // Staff status — for dispatch board officer availability
    const staffChannel = supabase
      .channel(`org:${orgId}:staff_status`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "staff_status",
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["personnel"] });
      })
      .subscribe();

    // User-specific notifications
    const userId = authStore.getState().user?.id;
    const notifChannel = supabase
      .channel(`org:${orgId}:notifications:${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dispatchChannel);
      supabase.removeChannel(alertChannel);
      supabase.removeChannel(staffChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [orgId, isAuthenticated]);

  return <>{children}</>;
}
```

### Per-Screen Subscriptions

Modules that aren't always visible use screen-level subscriptions:

```typescript
// In incidents list screen:
useFocusEffect(
  useCallback(() => {
    const sub = subscribeToTable("incidents", orgId, () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.list(orgId) });
    });
    return () => sub.unsubscribe();
  }, [orgId])
);
```

---

## 9.2 Push Notifications

### Setup

```typescript
// src/lib/notifications/setup.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { getSupabase } from "@/lib/api/client";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications require physical device");
    return null;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: "your-eas-project-id",
  });

  // Store token in Supabase profile for server-side sending
  const supabase = getSupabase();
  await supabase
    .from("profiles")
    .update({ push_token: tokenData.data })
    .eq("id", authStore.getState().user?.id);

  // iOS: configure notification categories (actionable notifications)
  if (Platform.OS === "ios") {
    await Notifications.setNotificationCategoryAsync("DISPATCH", [
      { identifier: "ACCEPT", buttonTitle: "Accept", options: { opensAppToForeground: true } },
      { identifier: "DECLINE", buttonTitle: "Decline", options: { isDestructive: true } },
    ]);

    await Notifications.setNotificationCategoryAsync("ALERT", [
      { identifier: "ACKNOWLEDGE", buttonTitle: "Acknowledge", options: { opensAppToForeground: true } },
      { identifier: "VIEW", buttonTitle: "View Details", options: { opensAppToForeground: true } },
    ]);
  }

  return tokenData.data;
}
```

### Notification Types

| Type | Trigger | Sound | Badge | Action |
|------|---------|-------|-------|--------|
| Critical Alert | New critical alert created | Urgent sound | +1 | Navigate to alert |
| Dispatch Assigned | Dispatch assigned to you | Default sound | +1 | Navigate to dispatch |
| Incident Update | Incident you're assigned to changes | Default sound | +1 | Navigate to incident |
| Briefing Posted | New high-priority briefing | Default sound | +1 | Navigate to briefing |
| Status Change | Record you created changes status | Silent | +1 | Navigate to record |

### Deep Link Handling

```typescript
// In root _layout.tsx:
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

useEffect(() => {
  // Handle notification tap (app in background)
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;

      // Route to appropriate screen
      switch (data.type) {
        case "dispatch":
          router.push(`/(detail)/dispatch/${data.id}`);
          break;
        case "incident":
          router.push(`/(detail)/incidents/${data.id}`);
          break;
        case "alert":
          router.push("/alerts");
          break;
        case "briefing":
          router.push(`/(detail)/briefings/${data.id}`);
          break;
      }
    }
  );

  return () => subscription.remove();
}, []);
```

---

## 9.3 Offline-First Sync

### Architecture

EZTrack operates at live events where connectivity can be spotty (large crowds, remote venues). Critical operations must work offline.

```
┌─────────────────────────────────────────────┐
│                 App Layer                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
│  │ UI/Hooks │  │ Queries │  │  Mutations  │ │
│  └────┬─────┘  └────┬─────┘  └──────┬──────┘ │
│       │              │               │        │
│  ┌────┴──────────────┴───────────────┴──────┐ │
│  │           Offline Sync Layer              │ │
│  │  ┌──────────┐  ┌───────────┐  ┌────────┐ │ │
│  │  │  Read    │  │  Write    │  │  Sync  │ │ │
│  │  │  Cache   │  │  Queue    │  │ Engine │ │ │
│  │  └────┬─────┘  └─────┬─────┘  └────┬───┘ │ │
│  └───────┼───────────────┼─────────────┼─────┘ │
│          │               │             │        │
│  ┌───────┴───────────────┴─────────────┴──────┐ │
│  │              MMKV / SQLite                  │ │
│  └─────────────────────┬───────────────────────┘ │
│                        │                          │
└────────────────────────┼──────────────────────────┘
                         │ (when online)
                    ┌────┴────┐
                    │ Supabase │
                    └──────────┘
```

### Read Cache (SQLite)

Cache query results locally so screens load instantly even offline:

```typescript
// src/lib/storage/sqliteCache.ts
import * as SQLite from "expo-sqlite";

const DB_NAME = "eztrack-cache.db";

let db: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
  }
  return db;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string; expires_at: number }>(
    "SELECT value, expires_at FROM cache WHERE key = ?",
    [key]
  );

  if (!row) return null;
  if (Date.now() > row.expires_at) {
    await db.runAsync("DELETE FROM cache WHERE key = ?", [key]);
    return null;
  }

  return JSON.parse(row.value) as T;
}

export async function setCache(key: string, value: any, ttlMs: number = 5 * 60 * 1000) {
  const db = await getDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO cache (key, value, expires_at, created_at) VALUES (?, ?, ?, ?)",
    [key, JSON.stringify(value), Date.now() + ttlMs, Date.now()]
  );
}

export async function invalidateCache(keyPrefix: string) {
  const db = await getDb();
  await db.runAsync("DELETE FROM cache WHERE key LIKE ?", [`${keyPrefix}%`]);
}
```

### Write Queue (MMKV)

Queue mutations when offline and replay when connection returns:

```typescript
// src/lib/offline/syncEngine.ts
import NetInfo from "@react-native-community/netinfo";
import { getQueue, removeFromQueue, type OfflineAction } from "./syncQueue";
import { getSupabase } from "@/lib/api/client";
import { queryClient } from "@/lib/api/queryClient";

const MAX_RETRIES = 5;

export function startSyncEngine() {
  // Listen for connectivity changes
  const unsubscribe = NetInfo.addEventListener(async (state) => {
    if (state.isConnected && state.isInternetReachable) {
      await flushQueue();
    }
  });

  return unsubscribe;
}

async function flushQueue() {
  const queue = getQueue();
  if (queue.length === 0) return;

  const supabase = getSupabase();

  for (const action of queue) {
    if (action.retryCount >= MAX_RETRIES) {
      // Dead letter — remove and log
      removeFromQueue(action.id);
      console.error(`[Offline] Gave up on action ${action.id} after ${MAX_RETRIES} retries`);
      continue;
    }

    try {
      switch (action.operation) {
        case "insert":
          await supabase.from(action.table).insert(action.payload);
          break;
        case "update":
          await supabase.from(action.table).update(action.payload).eq("id", action.payload.id);
          break;
        case "delete":
          await supabase.from(action.table)
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", action.payload.id);
          break;
      }

      removeFromQueue(action.id);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [action.table] });
    } catch (error) {
      // Increment retry count
      action.retryCount++;
      // Will be retried on next connectivity event
    }
  }
}
```

### Offline-Aware Mutations

Wrap mutations to queue when offline:

```typescript
// src/lib/offline/offlineMutation.ts
import { onlineManager } from "@tanstack/react-query";
import { enqueueOfflineAction } from "./syncQueue";

export function createOfflineAwareMutation(
  table: string,
  operation: "insert" | "update",
  onlineFn: (input: any) => Promise<any>,
) {
  return async (input: any) => {
    if (onlineManager.isOnline()) {
      return onlineFn(input);
    }

    // Offline: queue for later sync
    enqueueOfflineAction({
      table,
      operation,
      payload: {
        ...input,
        id: input.id ?? `offline-${Date.now()}`,
      },
    });

    // Return optimistic result
    return { ...input, _offline: true };
  };
}
```

### Critical Offline Operations

These must work without network:

| Operation | Offline Behavior |
|-----------|-----------------|
| Create daily log | Queued, appears in local list with "pending sync" badge |
| Create incident | Queued with local ID, syncs to server ID when online |
| Update dispatch status | Queued, local state updated immediately |
| Change officer status | Queued, local state updated |
| Acknowledge briefing | Queued |
| View cached data | All recently-fetched lists available offline |

### Sync Status Indicator

Show a banner when the app is offline or has queued actions:

```
┌──────────────────────────────┐
│ ⚡ Offline · 3 actions queued │  ← Yellow banner at top
└──────────────────────────────┘
```

```typescript
// src/components/ui/OfflineBanner.tsx
export function OfflineBanner() {
  const isOnline = useIsOnline();
  const queueCount = useOfflineQueueCount();

  if (isOnline && queueCount === 0) return null;

  return (
    <Animated.View entering={FadeInDown} style={styles.banner}>
      <Text>
        {!isOnline ? "📡 Offline" : ""}
        {queueCount > 0 ? ` · ${queueCount} actions queued` : ""}
      </Text>
    </Animated.View>
  );
}
```

---

## 9.4 Background Refresh

When the app returns to foreground, refresh critical data:

```typescript
// In AuthProvider or a dedicated BackgroundProvider:
useEffect(() => {
  const sub = AppState.addEventListener("change", async (state) => {
    if (state === "active") {
      // Refresh critical queries
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      // Flush offline queue
      await flushQueue();
    }
  });
  return () => sub.remove();
}, []);
```

---

## 9.5 Verification Checklist

### Real-time
- [ ] Dispatch board updates within 2 seconds of server change
- [ ] New incidents appear in list without manual refresh
- [ ] Officer status changes reflect immediately
- [ ] Alert banner appears for critical alerts
- [ ] Channels clean up on screen unmount

### Push Notifications
- [ ] Permission request shows on first launch
- [ ] Push token stored in Supabase profile
- [ ] Critical alerts trigger push notification with sound
- [ ] Dispatch assignment notification received
- [ ] Tapping notification deep-links to correct screen
- [ ] Badge count updates correctly
- [ ] Actionable notifications work (Accept/Decline dispatch)

### Offline Sync
- [ ] App loads cached data when offline
- [ ] Creating daily log works offline (queued)
- [ ] Creating incident works offline (queued)
- [ ] Offline banner shows with queue count
- [ ] Queue flushes automatically when connectivity returns
- [ ] Optimistic updates show immediately
- [ ] Synced records get proper server IDs
- [ ] Failed syncs retry up to MAX_RETRIES
- [ ] Dead-lettered actions are logged

---

**Previous:** [← Phase 8 — Analytics, Reports & Settings](./08-ANALYTICS-REPORTS-SETTINGS.md)
**Next:** [Phase 10 — Polish, Testing & Release →](./10-POLISH-TESTING-RELEASE.md)
