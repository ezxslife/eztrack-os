import type { DeviceRegistrationPayload } from "@eztrack/shared";
import * as Crypto from "expo-crypto";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { appEnv } from "@/lib/env";
import { requestServerApi } from "@/lib/server-api";
import { prefsStorage } from "@/lib/storage";

const INSTALLATION_ID_KEY = "eztrack-mobile-push-installation-id";

function getStoredInstallationId() {
  return prefsStorage.getItem(INSTALLATION_ID_KEY);
}

export function getAppVersion() {
  return Constants.expoConfig?.version ?? null;
}

export function getPushProjectId() {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;

  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

export async function getPushInstallationId(): Promise<string> {
  const existing = getStoredInstallationId();
  if (typeof existing === "string" && existing.length > 0) {
    return existing;
  }

  const next = Crypto.randomUUID();
  prefsStorage.setItem(INSTALLATION_ID_KEY, next);
  return next;
}

export async function upsertDeviceRegistration(expoPushToken: string) {
  if (!appEnv.apiConfigured) {
    return;
  }

  const installationId = await getPushInstallationId();
  const payload: DeviceRegistrationPayload = {
    appVersion: getAppVersion(),
    expoPushToken,
    installationId,
    platform: Platform.OS === "android" ? "android" : "ios",
  };

  await requestServerApi<{ ok: true }>("/api/mobile/device-registration", {
    body: payload,
    method: "POST",
  });
}

export async function deactivateDeviceRegistration() {
  if (!appEnv.apiConfigured) {
    return;
  }

  const installationId = await getPushInstallationId();
  await requestServerApi<{ ok: true }>("/api/mobile/device-registration", {
    body: { installationId },
    method: "DELETE",
  });
}
