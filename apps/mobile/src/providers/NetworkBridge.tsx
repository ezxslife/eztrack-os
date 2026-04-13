import { useEffect } from "react";

import Constants from "expo-constants";
import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

import {
  resolveNetworkOnlineState,
  useNetworkStore,
} from "@/stores/network-store";

export function NetworkBridge() {
  const setStatus = useNetworkStore((state) => state.setStatus);
  const forceOnline =
    __DEV__ || Constants.executionEnvironment === "storeClient";

  useEffect(() => {
    onlineManager.setEventListener((setOnline) => {
      return NetInfo.addEventListener((state) => {
        const isConnected = state.isConnected;
        const isInternetReachable = state.isInternetReachable;
        const isOnline = resolveNetworkOnlineState({
          forceOnline,
          isConnected,
          isInternetReachable,
        });

        setStatus({
          forceOnline,
          isConnected,
          isInternetReachable,
        });
        setOnline(isOnline);
      });
    });

    void NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected;
      const isInternetReachable = state.isInternetReachable;
      const isOnline = resolveNetworkOnlineState({
        forceOnline,
        isConnected,
        isInternetReachable,
      });

      setStatus({
        forceOnline,
        isConnected,
        isInternetReachable,
      });
      onlineManager.setOnline(isOnline);
    });
  }, [forceOnline, setStatus]);

  return null;
}
