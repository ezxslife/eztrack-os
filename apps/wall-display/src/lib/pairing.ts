import { appEnv } from "@/lib/env";

export interface DisplaySession {
  access_token: string;
  token_type: "bearer";
  expires_at: string;
  session_id: string;
  event: {
    id: string;
    name: string;
    status: string;
  };
}

interface PairingResponse extends Partial<DisplaySession> {
  ok: boolean;
  error?: string;
}

export async function redeemWallDisplayCode(
  pairingCode: string,
  deviceLabel: string,
): Promise<DisplaySession> {
  if (!appEnv.configured) {
    throw new Error("Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const response = await fetch(`${appEnv.supabaseUrl}/functions/v1/wall-display-pairing`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      action: "redeem",
      pairing_code: pairingCode,
      device_label: deviceLabel,
    }),
  });
  const payload = (await response.json().catch(() => null)) as PairingResponse | null;

  if (!response.ok || !payload?.ok || !payload.access_token || !payload.expires_at || !payload.session_id || !payload.event) {
    throw new Error(errorMessage(payload?.error ?? response.statusText));
  }

  return {
    access_token: payload.access_token,
    token_type: "bearer",
    expires_at: payload.expires_at,
    session_id: payload.session_id,
    event: payload.event,
  };
}

function errorMessage(error: string) {
  switch (error) {
    case "pairing_code_expired":
      return "That code expired or was already paired.";
    case "invalid_pairing_code":
      return "Enter the 6 digit pairing code.";
    case "event_not_found":
      return "The paired event no longer exists.";
    default:
      return "Unable to pair this display.";
  }
}
