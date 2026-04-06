"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const roles = ["Super Admin", "Admin", "Manager", "Supervisor", "Officer", "Staff"] as const;

const modules = [
  "Incidents",
  "Dispatches",
  "Cases",
  "Daily Log",
  "Lost & Found",
  "BOLO",
  "Field Contacts",
  "Arrests",
  "Use of Force",
  "Reports",
  "Analytics",
  "Settings",
] as const;

type Permission = "full" | "edit" | "view" | "none";

const initialPermissions: Record<string, Record<string, Permission>> = {
  "Super Admin": Object.fromEntries(modules.map((m) => [m, "full"])),
  Admin: Object.fromEntries(
    modules.map((m) => [m, m === "Settings" ? "edit" : "full"])
  ),
  Manager: Object.fromEntries(
    modules.map((m) => [m, ["Settings", "Analytics"].includes(m) ? "view" : "full"])
  ),
  Supervisor: Object.fromEntries(
    modules.map((m) => [m, ["Settings", "Analytics", "Reports"].includes(m) ? "view" : "edit"])
  ),
  Officer: Object.fromEntries(
    modules.map((m) => [m, ["Settings", "Analytics"].includes(m) ? "none" : ["Reports", "Cases"].includes(m) ? "view" : "edit"])
  ),
  Staff: Object.fromEntries(
    modules.map((m) => [m, ["Incidents", "Daily Log", "Lost & Found"].includes(m) ? "view" : "none"])
  ),
};

const permColors: Record<Permission, string> = {
  full: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  edit: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  view: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  none: "bg-transparent text-[var(--text-tertiary)] border-[var(--border-default)]",
};

const permCycle: Permission[] = ["none", "view", "edit", "full"];

export default function RolesSettingsPage() {
  const [permissions, setPermissions] = useState(initialPermissions);

  const cyclePermission = (role: string, mod: string) => {
    setPermissions((prev) => {
      const current = prev[role][mod];
      const idx = permCycle.indexOf(current);
      const next = permCycle[(idx + 1) % permCycle.length];
      return {
        ...prev,
        [role]: { ...prev[role], [mod]: next },
      };
    });
  };

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
                    <th key={role} className="text-center font-medium text-[var(--text-secondary)] px-3 py-3 min-w-[100px]">
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => (
                  <tr key={mod} className="border-b border-[var(--border-default)] last:border-0">
                    <td className="px-4 py-2.5 font-medium text-[var(--text-primary)] sticky left-0 bg-[var(--surface-primary)]">
                      {mod}
                    </td>
                    {roles.map((role) => {
                      const perm = permissions[role][mod];
                      return (
                        <td key={role} className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => cyclePermission(role, mod)}
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
    </div>
  );
}
