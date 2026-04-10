import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/hooks/useSessionContext";
import { getSupabase } from "@/lib/supabase";

export function RealtimeBridge() {
  const queryClient = useQueryClient();
  const { authEnabled, canAccessProtected, orgId, previewMode } = useSessionContext();

  useEffect(() => {
    if (!authEnabled || previewMode || !canAccessProtected || !orgId) {
      return;
    }

    const supabase = getSupabase();
    const channel = supabase
      .channel(`mobile-org-${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `org_id=eq.${orgId}`,
          schema: "public",
          table: "incidents",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          void queryClient.invalidateQueries({ queryKey: ["incidents"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `org_id=eq.${orgId}`,
          schema: "public",
          table: "dispatches",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          void queryClient.invalidateQueries({ queryKey: ["dispatches"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `org_id=eq.${orgId}`,
          schema: "public",
          table: "daily_logs",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          void queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `org_id=eq.${orgId}`,
          schema: "public",
          table: "activity_log",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "staff_status_records",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          void queryClient.invalidateQueries({ queryKey: ["dispatches", "officers"] });
        }
      );

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [authEnabled, canAccessProtected, orgId, previewMode, queryClient]);

  return null;
}
