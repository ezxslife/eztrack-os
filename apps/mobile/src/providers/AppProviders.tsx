import { useState, type ReactNode } from "react";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { AuthBootstrap } from "@/providers/AuthBootstrap";
import { RealtimeBridge } from "@/providers/RealtimeBridge";

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
      <AuthBootstrap />
      <RealtimeBridge />
      {children}
    </QueryClientProvider>
  );
}
