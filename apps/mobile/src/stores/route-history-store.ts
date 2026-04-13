/**
 * RouteHistoryStore: Zustand store for tracking navigation history.
 * Maintains recently viewed records (incidents, cases, dispatch, etc.)
 * persisted to device storage.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { USER_SCOPED_STORAGE_KEYS, appStorage } from '@/lib/storage';

export interface RouteHistoryEntry {
  type: string; // 'incident' | 'dispatch' | 'case' | 'briefing' | etc.
  id: string;
  title: string;
  timestamp: number;
}

interface RouteHistoryState {
  _hasHydrated: boolean;
  recentlyViewed: RouteHistoryEntry[];
  addEntry: (entry: Omit<RouteHistoryEntry, 'timestamp'>) => void;
  clearHistory: () => void;
  removeEntry: (type: string, id: string) => void;
  getRecentByType: (type: string) => RouteHistoryEntry[];
  setHasHydrated: (v: boolean) => void;
}

const MAX_ENTRIES = 20;

export const useRouteHistoryStore = create<RouteHistoryState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      recentlyViewed: [],

      addEntry: (entry) => {
        set((state) => {
          // Remove existing entry if present (re-add to top)
          const filtered = state.recentlyViewed.filter(
            (e) => !(e.type === entry.type && e.id === entry.id)
          );

          // Add new entry with current timestamp
          const newEntry: RouteHistoryEntry = {
            ...entry,
            timestamp: Date.now(),
          };

          // Keep only recent MAX_ENTRIES
          const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES);

          return {
            recentlyViewed: updated,
          };
        });
      },

      removeEntry: (type, id) => {
        set((state) => ({
          recentlyViewed: state.recentlyViewed.filter(
            (e) => !(e.type === type && e.id === id)
          ),
        }));
      },

      clearHistory: () => {
        set({ recentlyViewed: [] });
      },

      getRecentByType: (type) => {
        return get().recentlyViewed.filter((e) => e.type === type);
      },

      setHasHydrated: (v) => {
        set({ _hasHydrated: v });
      },
    }),
    {
      name: 'eztrack-route-history',
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        recentlyViewed: state.recentlyViewed,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('[RouteHistoryStore] Hydration error, using defaults', error);
        }

        queueMicrotask(() => {
          useRouteHistoryStore.setState({ _hasHydrated: true });
        });
      },
    }
  )
);
