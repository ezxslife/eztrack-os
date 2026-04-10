import { create } from "zustand";

interface NetworkStore {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  isOnline: boolean;
  setStatus: (input: {
    isConnected: boolean;
    isInternetReachable: boolean | null;
  }) => void;
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  isConnected: true,
  isInternetReachable: null,
  isOnline: true,
  setStatus: ({ isConnected, isInternetReachable }) =>
    set({
      isConnected,
      isInternetReachable,
      isOnline: isConnected && isInternetReachable !== false,
    }),
}));
