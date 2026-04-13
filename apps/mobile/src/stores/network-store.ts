import { create } from "zustand";

interface NetworkStore {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isOnline: boolean;
  setStatus: (input: {
    forceOnline?: boolean;
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
  }) => void;
}

export function resolveNetworkOnlineState(input: {
  forceOnline?: boolean;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}) {
  const {
    forceOnline = false,
    isConnected,
    isInternetReachable,
  } = input;

  if (forceOnline) {
    return true;
  }

  // Treat unresolved reachability as online until the device is definitively offline.
  return isConnected !== false && isInternetReachable !== false;
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  isConnected: null,
  isInternetReachable: null,
  isOnline: true,
  setStatus: ({ forceOnline, isConnected, isInternetReachable }) =>
    set({
      isConnected,
      isInternetReachable,
      isOnline: resolveNetworkOnlineState({
        forceOnline,
        isConnected,
        isInternetReachable,
      }),
    }),
}));
