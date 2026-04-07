"use client";

import { use, useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, Shield, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { EditPersonnelModal, DeletePersonnelModal } from "@/components/modals/personnel";
import { Button } from "@/components/ui/Button";
import { fetchPersonnelById, type PersonnelDetail } from "@/lib/queries/personnel";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { formatRelativeTime } from "@/lib/utils/time";

const statusTone: Record<string, "success" | "warning" | "default" | "info" | "attention"> = {
  available: "success",
  on_break: "attention",
  off_duty: "default",
  dispatched: "info",
  on_scene: "warning",
};

const statusDisplay: Record<string, string> = {
  available: "Available",
  on_break: "On Break",
  off_duty: "Off Duty",
  dispatched: "Dispatched",
  on_scene: "On Scene",
};

const roleTone: Record<string, "info" | "warning" | "critical" | "default"> = {
  manager: "critical",
  dispatcher: "warning",
  supervisor: "info",
  staff: "default",
  org_admin: "critical",
  super_admin: "critical",
  viewer: "default",
};

const roleDisplay: Record<string, string> = {
  super_admin: "Super Admin",
  org_admin: "Org Admin",
  manager: "Manager",
  dispatcher: "Dispatcher",
  supervisor: "Supervisor",
  staff: "Staff",
  viewer: "Viewer",
};

interface ActivityEntry {
  action: string;
  time: string;
}

/* ── Tab definitions ── */
const TAB_LIST = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
];

export default function PersonnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();

  const [staff, setStaff] = useState<PersonnelDetail | null>(null);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchPersonnelById(id);
        setStaff(data);

        // Fetch recent activity from activity_log
        const supabase = getSupabaseBrowser();
        const { data: actData } = await supabase
          .from("activity_log")
          .select("action, created_at")
          .eq("actor_id", id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (actData?.length) {
          setActivities(
            actData.map((a: { action: string; created_at: string }) => ({
              action: a.action,
              time: formatRelativeTime(a.created_at),
            }))
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load personnel");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-5 max-w-3xl animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Shield size={32} className="text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-secondary)]">{error || "Staff member not found"}</p>
        <Link href="/personnel">
          <Button variant="secondary" size="sm">Back to Personnel</Button>
        </Link>
      </div>
    );
  }

  const nameParts = staff.fullName.split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || staff.fullName;
  const lastName = nameParts.slice(-1)[0] || "";
  const joinedDate = new Date(staff.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="space-y-5 max-w-3xl">
      {/* ── Back + Header ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/personnel"
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-[var(--text-secondary)]" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <Avatar name={staff.fullName} size="xl" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {staff.fullName}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge tone={roleTone[staff.role] ?? "default"}>
                {roleDisplay[staff.role] ?? staff.role}
              </Badge>
              <Badge tone={statusTone[staff.status] ?? "default"} dot>
                {statusDisplay[staff.status] ?? staff.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contact Quick Row ── */}
      <div className="flex flex-wrap gap-4">
        {staff.phone && (
          <a
            href={`tel:${staff.phone}`}
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--action-primary)]"
          >
            <Phone className="h-3.5 w-3.5" />
            {staff.phone}
          </a>
        )}
        {staff.email && (
          <a
            href={`mailto:${staff.email}`}
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--action-primary)]"
          >
            <Mail className="h-3.5 w-3.5" />
            {staff.email}
          </a>
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="md" onClick={() => setEditOpen(true)}>
          Edit
        </Button>
        <Button variant="destructive" size="md" onClick={() => setDeleteOpen(true)}>
          Deactivate
        </Button>
      </div>

      {/* ── Tabs ── */}
      <Tabs tabs={TAB_LIST} activeTab={activeTab} onChange={setActiveTab} />

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <Card>
            <CardContent>
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <p className="text-[13px] text-[var(--text-primary)]">{staff.fullName}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <p className="text-[13px] text-[var(--text-primary)]">
                    {roleDisplay[staff.role] ?? staff.role}
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <p className="text-[13px] text-[var(--text-primary)]">{staff.email ?? "-"}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Phone
                  </label>
                  <p className="text-[13px] text-[var(--text-primary)]">{staff.phone ?? "-"}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Member Since
                  </label>
                  <p className="text-[13px] text-[var(--text-primary)]">{joinedDate}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <Badge tone={statusTone[staff.status] ?? "default"} dot>
                    {statusDisplay[staff.status] ?? staff.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Activity Tab ── */}
      {activeTab === "activity" && (
        <Card>
          <CardContent>
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">
              Recent Activity
            </h3>
            {activities.length > 0 ? (
              <div className="space-y-0">
                {activities.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2.5 border-b border-[var(--border-default)] last:border-0"
                  >
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[var(--text-primary)]">{a.action}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock size={24} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
                <p className="text-[13px] text-[var(--text-tertiary)]">No activity recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Modals ── */}
      <EditPersonnelModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={async () => {
          toast("Personnel record updated successfully", { variant: "success" });
          setEditOpen(false);
        }}
        initialData={{
          firstName,
          lastName,
          role: staff.role,
          badgeNumber: "",
          phone: staff.phone ?? "",
          email: staff.email ?? "",
          shift: "",
          zone: "",
          certifications: "",
          startDate: joinedDate,
          emergencyContact: "",
          notes: "",
        }}
      />
      <DeletePersonnelModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          toast("Personnel record deactivated", { variant: "success" });
          setDeleteOpen(false);
        }}
        personnelName={staff.fullName}
        badgeNumber=""
      />
    </div>
  );
}
