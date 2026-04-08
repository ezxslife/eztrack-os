"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { fetchRoles, updateRolePermissions } from "@/lib/queries/settings";
import {
  formatRoleLabel,
  ROLE_ORDER,
  SETTINGS_MODULES,
  type PermissionLevel,
  type RolePermissionsRow,
} from "@/lib/settings-shared";

const permColors: Record<PermissionLevel, string> = {
  full: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  edit: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  view: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  none: "bg-transparent text-[var(--text-tertiary)] border-[var(--border-default)]",
};

const permCycle: PermissionLevel[] = ["none", "view", "edit", "full"];

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

export default function RolesSettingsPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RolePermissionsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRoles();
      setRoles(sortRoles(data));
    } catch (err: any) {
      setError(err.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cyclePermission = (role: string, mod: string) => {
    setRoles((prev) => {
      const currentRow = prev.find((row) => row.id === role);
      if (!currentRow) return prev;
      const current = currentRow.permissions[mod] ?? "none";
      const idx = permCycle.indexOf(current);
      const next = permCycle[(idx + 1) % permCycle.length];
      const nextRows = prev.map((row) =>
        row.id === role
          ? { ...row, permissions: { ...row.permissions, [mod]: next } }
          : row,
      );

      void updateRolePermissions(role, {
        ...currentRow.permissions,
        [mod]: next,
      }).catch((err: any) => {
        toast(err.message || "Failed to update role permissions", { variant: "error" });
        load();
      });

      return nextRows;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="text-[13px] text-[var(--text-secondary)]">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Roles &amp; Permissions</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Configure role-based access control. Click a cell to cycle permissions.</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[12px]">
        {permCycle.map((p) => (
          <div key={p} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm border ${permColors[p]}`} />
            <span className="text-[var(--text-secondary)] capitalize">{p === "none" ? "No access" : p === "full" ? "Full access" : p === "edit" ? "Create & edit" : "View only"}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th className="text-left font-medium text-[var(--text-secondary)] px-4 py-3 sticky left-0 bg-[var(--surface-primary)] min-w-[140px]">
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      Module / Role
                    </div>
                  </th>
                  {roles.map((role) => (
                    <th key={role.id} className="text-center font-medium text-[var(--text-secondary)] px-3 py-3 min-w-[100px]">
                      {formatRoleLabel(role.name)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SETTINGS_MODULES.map((mod) => (
                  <tr key={mod} className="border-b border-[var(--border-default)] last:border-0">
                    <td className="px-4 py-2.5 font-medium text-[var(--text-primary)] sticky left-0 bg-[var(--surface-primary)]">
                      {mod}
                    </td>
                    {roles.map((role) => {
                      const perm = role.permissions[mod] ?? "none";
                      return (
                        <td key={role.id} className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => cyclePermission(role.id, mod)}
                            className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize transition-colors hover:opacity-80 cursor-pointer ${permColors[perm]}`}
                          >
                            {perm}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {roles.length === 0 && (
        <div className="text-center text-[13px] text-[var(--text-tertiary)]">
          No roles found for this organization.
        </div>
      )}
    </div>
  );
}
