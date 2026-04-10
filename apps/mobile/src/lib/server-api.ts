import { appEnv } from "@/lib/env";
import { getCurrentSession } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";

function getApiBaseUrl() {
  if (!appEnv.apiConfigured || !appEnv.apiUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_URL must be configured to use mobile server-backed admin workflows."
    );
  }

  return appEnv.apiUrl.replace(/\/+$/, "");
}

async function getAccessToken() {
  const inMemoryToken = useAuthStore.getState().session?.access_token;
  if (inMemoryToken) {
    return inMemoryToken;
  }

  const session = await getCurrentSession();
  if (!session?.access_token) {
    throw new Error("A live session is required to call the mobile admin API.");
  }

  return session.access_token;
}

export async function requestServerApi<T>(
  path: string,
  init?: Omit<RequestInit, "body"> & {
    body?: unknown;
  }
): Promise<T> {
  const accessToken = await getAccessToken();
  const headers = new Headers(init?.headers);
  const rawBody = init?.body;
  let body: BodyInit | undefined;

  if (rawBody == null) {
    body = undefined;
  } else if (
    typeof rawBody === "string" ||
    rawBody instanceof FormData ||
    rawBody instanceof URLSearchParams ||
    rawBody instanceof Blob ||
    rawBody instanceof ArrayBuffer
  ) {
    body = rawBody;
  } else {
    body = JSON.stringify(rawBody);
  }

  headers.set("Authorization", `Bearer ${accessToken}`);

  if (!(body instanceof FormData) && body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    body,
    headers,
  });

  const payload = await response
    .json()
    .catch(() => ({} as { error?: string }));

  if (!response.ok) {
    throw new Error(payload?.error || "Request failed");
  }

  return payload as T;
}
