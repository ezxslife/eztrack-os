import type { DeviceRegistrationRecord } from "@eztrack/shared";
import { NextResponse } from "next/server";

import {
  getRequestContext,
  readOrgSettings,
  writeOrgSettings,
} from "@/lib/server/settings";

const DEVICE_REGISTRATIONS_KEY = "mobileDeviceRegistrations";

function normalizeRegistrations(value: unknown): DeviceRegistrationRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is DeviceRegistrationRecord => {
    return Boolean(
      entry &&
        typeof entry === "object" &&
        typeof (entry as DeviceRegistrationRecord).installationId === "string" &&
        typeof (entry as DeviceRegistrationRecord).expoPushToken === "string" &&
        typeof (entry as DeviceRegistrationRecord).platform === "string" &&
        typeof (entry as DeviceRegistrationRecord).userId === "string" &&
        typeof (entry as DeviceRegistrationRecord).orgId === "string"
    );
  });
}

export async function POST(request: Request) {
  try {
    const { orgId, supabase, userId } = await getRequestContext(request);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const installationId =
      typeof body.installationId === "string" ? body.installationId.trim() : "";
    const expoPushToken =
      typeof body.expoPushToken === "string" ? body.expoPushToken.trim() : "";
    const appVersion =
      typeof body.appVersion === "string" ? body.appVersion.trim() : null;
    const platform =
      body.platform === "android" || body.platform === "ios" ? body.platform : null;

    if (!installationId || !expoPushToken || !platform) {
      return NextResponse.json(
        { error: "installationId, expoPushToken, and platform are required" },
        { status: 400 }
      );
    }

    const settings = await readOrgSettings<Record<string, unknown>>(supabase, orgId);
    const registrations = normalizeRegistrations(settings[DEVICE_REGISTRATIONS_KEY]);
    const now = new Date().toISOString();
    const next: DeviceRegistrationRecord = {
      active: true,
      appVersion,
      expoPushToken,
      installationId,
      lastSeenAt: now,
      orgId,
      platform,
      userId,
    };

    const updatedRegistrations = [
      next,
      ...registrations.filter((entry) => entry.installationId !== installationId),
    ];

    await writeOrgSettings(supabase, orgId, {
      ...settings,
      [DEVICE_REGISTRATIONS_KEY]: updatedRegistrations,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save device registration" },
      { status: error?.message === "Not authenticated" ? 401 : 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { orgId, supabase, userId } = await getRequestContext(request);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const installationId =
      typeof body.installationId === "string" ? body.installationId.trim() : "";

    if (!installationId) {
      return NextResponse.json({ error: "installationId is required" }, { status: 400 });
    }

    const settings = await readOrgSettings<Record<string, unknown>>(supabase, orgId);
    const registrations = normalizeRegistrations(settings[DEVICE_REGISTRATIONS_KEY]);
    const now = new Date().toISOString();
    const updatedRegistrations = registrations.map((entry) =>
      entry.installationId === installationId && entry.userId === userId
        ? {
            ...entry,
            active: false,
            lastSeenAt: now,
          }
        : entry
    );

    await writeOrgSettings(supabase, orgId, {
      ...settings,
      [DEVICE_REGISTRATIONS_KEY]: updatedRegistrations,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to deactivate device registration" },
      { status: error?.message === "Not authenticated" ? 401 : 500 }
    );
  }
}
