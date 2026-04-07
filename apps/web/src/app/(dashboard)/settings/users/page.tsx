"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, MoreHorizontal, Mail, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  InviteUserModal,
  EditUserRoleModal,
  DeactivateUserModal,
} from "@/components/modals/settings";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  fetchOrgUsers,
  updateUserRole,
  deactivateUser as deactivateUserApi,
  type OrgUserRow,
} from "@/lib/queries/settings";

type UserStatus = "active" | "inactive" | "invited";

const statusTone: Record<UserStatus, "success" | "default" | "info"> = {
  active: "success",
  inactive: "default",
  invited: "info",
};

interface UserDisplay {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  lastLogin: string;
}

export default function UserManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editRoleUser, setEditRoleUser] = useState<UserDisplay | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<UserDisplay | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();
      if (!profile?.org_id) throw new Error("Organization not found");
      const data = await fetchOrgUsers(profile.org_id);
      setUsers(
        data.map((u) => ({
          id: u.id,
          name: u.fullName,
          email: u.email,
          role: u.role,
          status: (u.status as UserStatus) || "active",
          lastLogin: u.lastLogin
            ? new Date(u.lastLogin).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "---",
        })),
      );
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

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
        <Button variant="outline" size="sm" onClick={load}>Retry</Button>
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">User Management</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">Manage team members and their access</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Invite User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>{users.length} Users</CardTitle>
            <div className="w-64">
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="!px-0 !pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th className="text-left font-medium text-[var(--text-secondary)] px-5 py-2.5">Name</th>
                  <th className="text-left font-medium text-[var(--text-secondary)] px-5 py-2.5">Email</th>
                  <th className="text-left font-medium text-[var(--text-secondary)] px-5 py-2.5">Role</th>
                  <th className="text-left font-medium text-[var(--text-secondary)] px-5 py-2.5">Status</th>
                  <th className="text-left font-medium text-[var(--text-secondary)] px-5 py-2.5">Last Login</th>
                  <th className="w-16 px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{user.name}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{user.email}</td>
                    <td className="px-5 py-3">
                      <Badge tone="default">{user.role}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone[user.status]} dot>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-tertiary)]">{user.lastLogin}</td>
                    <td className="px-5 py-3 text-right">
                      {user.status === "invited" ? (
                        <Button variant="ghost" size="sm">
                          <Mail className="h-3.5 w-3.5" />
                          Resend
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setEditRoleUser(user)}>
                            Edit Role
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeactivateUser(user)}>
                            Deactivate
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[var(--text-tertiary)]">
                      No users match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={async (data) => {
          toast("User invited successfully", { variant: "success" });
        }}
      />

      <EditUserRoleModal
        open={editRoleUser !== null}
        onClose={() => setEditRoleUser(null)}
        onSubmit={async (data) => {
          if (!editRoleUser) return;
          try {
            await updateUserRole(editRoleUser.id, data.newRole);
            toast("User role updated successfully", { variant: "success" });
            setEditRoleUser(null);
            load();
          } catch (err: any) {
            toast(err.message || "Failed to update role", { variant: "error" });
          }
        }}
        currentRole={editRoleUser?.role?.toLowerCase().replace(/\s+/g, "_")}
        userName={editRoleUser?.name}
      />

      <DeactivateUserModal
        open={deactivateUser !== null}
        onClose={() => setDeactivateUser(null)}
        onConfirm={async (reason) => {
          if (!deactivateUser) return;
          setIsDeactivating(true);
          try {
            await deactivateUserApi(deactivateUser.id);
            toast("User deactivated", { variant: "success" });
            setDeactivateUser(null);
            load();
          } catch (err: any) {
            toast(err.message || "Failed to deactivate user", { variant: "error" });
          } finally {
            setIsDeactivating(false);
          }
        }}
        userName={deactivateUser?.name}
        currentRole={deactivateUser?.role}
        isLoading={isDeactivating}
      />
    </div>
  );
}
