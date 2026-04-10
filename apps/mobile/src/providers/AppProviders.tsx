import { useState, type ReactNode } from "react";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { AppStatusBanner } from "@/components/feedback/AppStatusBanner";
import { AuthBootstrap } from "@/providers/AuthBootstrap";
import { BottomSheetProvider } from "@/providers/BottomSheetProvider";
import { NetworkBridge } from "@/providers/NetworkBridge";
import { NotificationsBridge } from "@/providers/NotificationsBridge";
import { OfflineQueueBridge } from "@/providers/OfflineQueueBridge";
import { RealtimeBridge } from "@/providers/RealtimeBridge";
import { StorageHealthBootstrap } from "@/providers/StorageHealthBootstrap";
import { ToastProvider } from "@/providers/ToastProvider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: {
            retry: 0,
          },
          queries: {
            refetchOnReconnect: true,
            retry: 1,
            staleTime: 30_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <StorageHealthBootstrap />
      <NetworkBridge />
      <AuthBootstrap />
      <OfflineQueueBridge />
      <RealtimeBridge />
      <BottomSheetProvider>
        <ToastProvider>
          <NotificationsBridge />
          {children}
          <AppStatusBanner />
        </ToastProvider>
      </BottomSheetProvider>
    </QueryClientProvider>
  );
}
