import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { canManageSettings, getRequestContext } from "@/lib/server/settings";
import { mapUiRoleToStaffRole } from "@/lib/settings-shared";
import type { Database } from "@/types/database";

export async function POST(request: Request) {
  try {
    const { orgId, role } = await getRequestContext(request);
    if (!canManageSettings(role)) {
      return NextResponse.json({ error: "You do not have permission to invite users" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const uiRole = typeof body.role === "string" ? body.role : "";
    const sendWelcomeEmail = Boolean(body.sendWelcomeEmail);

    if (!email || !firstName || !uiRole) {
      return NextResponse.json(
        { error: "email, firstName, and role are required" },
        { status: 400 },
      );
    }

    const mappedRole = mapUiRoleToStaffRole(uiRole);
    const adminClient = createSupabaseAdminClient();
    const metadata = {
      first_name: firstName,
      last_name: lastName,
      org_id: orgId,
      requested_role: uiRole,
      role: mappedRole,
    };

    const authResult = sendWelcomeEmail
      ? await adminClient.auth.admin.inviteUserByEmail(email, {
          data: metadata,
        })
      : await adminClient.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: metadata,
          app_metadata: { requested_role: uiRole },
        });

    if (authResult.error) {
      throw authResult.error;
    }

    const invitedUser = authResult.data.user;
    if (!invitedUser?.id) {
      throw new Error("User record was not created");
    }

    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: invitedUser.id,
        org_id: orgId,
        full_name: fullName || email,
        email,
        role: mappedRole as Database["public"]["Enums"]["staff_role"],
        status: sendWelcomeEmail ? "invited" : "active",
      },
      { onConflict: "id" },
    );

    if (profileError) {
      throw profileError;
    }

    return NextResponse.json({
      user: {
        id: invitedUser.id,
        email,
        fullName: fullName || email,
        role: mappedRole,
        status: sendWelcomeEmail ? "invited" : "active",
      },
    });
  } catch (error: any) {
    const message = error?.message || "Failed to invite user";
    const status =
      message.includes("SUPABASE_SERVICE_ROLE_KEY") ? 500 : message === "Not authenticated" ? 401 : message.includes("permission") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
