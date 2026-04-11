import { create } from "zustand";

interface NetworkStore {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isOnline: boolean;
  setStatus: (input: {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
  }) => void;
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  isConnected: null,
  isInternetReachable: null,
  isOnline: true,
  setStatus: ({ isConnected, isInternetReachable }) =>
    set({
      isConnected,
      isInternetReachable,
      // Treat unresolved reachability as online until the device is definitively offline.
      isOnline: isConnected !== false && isInternetReachable !== false,
    }),
}));
