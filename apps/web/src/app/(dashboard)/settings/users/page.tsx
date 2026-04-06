"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, MoreHorizontal, Mail } from "lucide-react";
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

type UserStatus = "active" | "inactive" | "invited";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  lastLogin: string;
}

const mockUsers: MockUser[] = [
  { id: "1", name: "James Rodriguez", email: "j.rodriguez@bellagio.com", role: "Super Admin", status: "active", lastLogin: "Apr 5, 2026 9:12 AM" },
  { id: "2", name: "Sarah Chen", email: "s.chen@bellagio.com", role: "Admin", status: "active", lastLogin: "Apr 4, 2026 11:45 PM" },
  { id: "3", name: "Marcus Williams", email: "m.williams@bellagio.com", role: "Manager", status: "active", lastLogin: "Apr 5, 2026 7:30 AM" },
  { id: "4", name: "Emily Park", email: "e.park@bellagio.com", role: "Supervisor", status: "inactive", lastLogin: "Mar 20, 2026 2:15 PM" },
  { id: "5", name: "David Thompson", email: "d.thompson@bellagio.com", role: "Officer", status: "active", lastLogin: "Apr 5, 2026 6:00 AM" },
  { id: "6", name: "Lisa Martinez", email: "l.martinez@bellagio.com", role: "Staff", status: "invited", lastLogin: "---" },
];

const statusTone: Record<UserStatus, "success" | "default" | "info"> = {
  active: "success",
  inactive: "default",
  invited: "info",
};

export default function UserManagementPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editRoleUser, setEditRoleUser] = useState<MockUser | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<MockUser | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const filtered = mockUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

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
            <CardTitle>{mockUsers.length} Users</CardTitle>
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
          toast("User role updated successfully", { variant: "success" });
          setEditRoleUser(null);
        }}
        currentRole={editRoleUser?.role?.toLowerCase().replace(/\s+/g, "_")}
        userName={editRoleUser?.name}
      />

      <DeactivateUserModal
        open={deactivateUser !== null}
        onClose={() => setDeactivateUser(null)}
        onConfirm={async (reason) => {
          setIsDeactivating(true);
          toast("User deactivated", { variant: "success" });
          setIsDeactivating(false);
          setDeactivateUser(null);
        }}
        userName={deactivateUser?.name}
        currentRole={deactivateUser?.role}
        isLoading={isDeactivating}
      />
    </div>
  );
}
