import type { QueryClient } from "@tanstack/react-query";

import { processPendingActions } from "@/lib/offline/queue";
import type { MutationProfile } from "@/lib/services/mutation-profile";

export async function invalidateOperationalQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["dispatches"] }),
    queryClient.invalidateQueries({ queryKey: ["daily-logs"] }),
    queryClient.invalidateQueries({ queryKey: ["incidents"] }),
  ]);
}

export async function syncOfflineQueueNow(
  queryClient: QueryClient,
  profile: MutationProfile
) {
  const result = await processPendingActions(profile);

  if (result.processedCount > 0) {
    await invalidateOperationalQueries(queryClient);
  }

  return result;
}
