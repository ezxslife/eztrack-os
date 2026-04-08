import { useEffect } from "react";

import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

import { useNetworkStore } from "@/stores/network-store";

export function NetworkBridge() {
  const setStatus = useNetworkStore((state) => state.setStatus);

  useEffect(() => {
    onlineManager.setEventListener((setOnline) => {
      return NetInfo.addEventListener((state) => {
        const isConnected = state.isConnected ?? false;
        const isInternetReachable = state.isInternetReachable;
        const isOnline = isConnected && isInternetReachable !== false;

        setStatus({
          isConnected,
          isInternetReachable,
        });
        setOnline(isOnline);
      });
    });

    void NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable;

      setStatus({
        isConnected,
        isInternetReachable,
      });
      onlineManager.setOnline(isConnected && isInternetReachable !== false);
    });
  }, [setStatus]);

  return null;
}
