import { NextResponse } from "next/server";
import {
  formatRoleLabel,
  normalizeFormTemplates,
  normalizeIntegrations,
  normalizePermissionMap,
  ROLE_ORDER,
  type PermissionLevel,
  type RolePermissionsRow,
} from "@/lib/settings-shared";
import { canManageSettings, getRequestContext, readOrgSettings, writeOrgSettings } from "@/lib/server/settings";

type SettingsSection = "roles" | "form-templates" | "integrations";

function isSettingsSection(section: string): section is SettingsSection {
  return section === "roles" || section === "form-templates" || section === "integrations";
}

function sortRoles(rows: RolePermissionsRow[]) {
  const order = new Map(ROLE_ORDER.map((name, index) => [name.toLowerCase(), index]));
  return [...rows].sort((a, b) => {
    const left = order.get(formatRoleLabel(a.name).toLowerCase());
    const right = order.get(formatRoleLabel(b.name).toLowerCase());
    if (left !== undefined && right !== undefined) return left - right;
    if (left !== undefined) return -1;
    if (right !== undefined) return 1;
    return formatRoleLabel(a.name).localeCompare(formatRoleLabel(b.name));
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ section: string }> },
) {
  const { section } = await params;
  if (!isSettingsSection(section)) {
    return NextResponse.json({ error: "Unknown settings section" }, { status: 404 });
  }

  try {
    const { supabase, orgId } = await getRequestContext();

    if (section === "roles") {
      const { data, error } = await supabase
        .from("roles")
        .select("id, name, is_system, permissions")
        .eq("org_id", orgId)
        .order("name");

      if (error) {
        throw error;
      }

      const roles = sortRoles(
        (data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          isSystem: Boolean(row.is_system),
          permissions: normalizePermissionMap(row.permissions, row.name),
        })),
      );

      return NextResponse.json({ roles });
    }

    const settings = await readOrgSettings<Record<string, unknown>>(supabase, orgId);
    if (section === "form-templates") {
      return NextResponse.json({
        templates: normalizeFormTemplates(settings.formTemplates),
      });
    }

    return NextResponse.json({
      integrations: normalizeIntegrations(settings.integrations),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load settings" },
      { status: error?.message === "Not authenticated" ? 401 : 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ section: string }> },
) {
  const { section } = await params;
  if (!isSettingsSection(section)) {
    return NextResponse.json({ error: "Unknown settings section" }, { status: 404 });
  }

  try {
    const { supabase, orgId, role } = await getRequestContext();
    if (!canManageSettings(role)) {
      return NextResponse.json({ error: "You do not have permission to update settings" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    if (section === "roles") {
      const roleId = typeof body.roleId === "string" ? body.roleId : "";
      const permissions = body.permissions;

      if (!roleId) {
        return NextResponse.json({ error: "roleId is required" }, { status: 400 });
      }

      const normalizedPermissions = normalizePermissionMap(permissions as Record<string, PermissionLevel> | undefined);
      const { error } = await supabase
        .from("roles")
        .update({ permissions: normalizedPermissions })
        .eq("id", roleId)
        .eq("org_id", orgId);

      if (error) {
        throw error;
      }

      return NextResponse.json({ ok: true });
    }

    const settings = await readOrgSettings<Record<string, unknown>>(supabase, orgId);
    if (section === "form-templates") {
      const templates = body.templates;
      if (!Array.isArray(templates)) {
        return NextResponse.json({ error: "templates is required" }, { status: 400 });
      }

      await writeOrgSettings(supabase, orgId, {
        ...settings,
        formTemplates: normalizeFormTemplates(templates),
      });
      return NextResponse.json({ ok: true });
    }

    const integrations = body.integrations;
    if (!Array.isArray(integrations)) {
      return NextResponse.json({ error: "integrations is required" }, { status: 400 });
    }

    await writeOrgSettings(supabase, orgId, {
      ...settings,
      integrations: normalizeIntegrations(integrations),
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save settings" },
      { status: error?.message === "Not authenticated" ? 401 : 500 },
    );
  }
}
