"use client";

import { use } from "react";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, Shield, CheckCircle2, Clock, CalendarDays, Timer, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { StatusBadge } from "@/components/ui/Badge";
import { EditPersonnelModal, DeletePersonnelModal } from "@/components/modals/personnel";
import { Button } from "@/components/ui/Button";

/* ── Mock Staff Member ── */
const STAFF = {
  id: "1",
  name: "Sgt. Maria Patel",
  role: "Supervisor",
  status: "available",
  email: "m.patel@eztrack-security.com",
  phone: "(555) 234-5678",
  badge: "SGT-0042",
  hireDate: "March 15, 2023",
  emergencyContact: "Raj Patel — (555) 111-2233",
  certifications: ["CPR/AED Certified", "Crowd Management", "First Aid Level 3"],
  training: [
    { name: "Active Threat Response", date: "Mar 12, 2026", status: "completed" },
    { name: "De-Escalation Techniques", date: "Jan 20, 2026", status: "completed" },
    { name: "Emergency Evacuation Procedures", date: "Apr 15, 2026", status: "pending" },
  ],
  activities: [
    { action: "Responded to Dispatch DSP-2026-0089", time: "25 min ago" },
    { action: "Logged Daily Entry DL-2026-00412", time: "1 hr ago" },
    { action: "Acknowledged Briefing: Evening Shift Handoff", time: "2 hr ago" },
    { action: "Completed patrol route — North Perimeter", time: "3 hr ago" },
    { action: "Submitted Incident Report INC-2026-00007", time: "4 hr ago" },
  ],
};

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
  Manager: "critical",
  Dispatcher: "warning",
  Supervisor: "info",
  Staff: "default",
};

/* ── Tab definitions ── */
const TAB_LIST = [
  { id: "overview", label: "Overview" },
  { id: "schedule", label: "Schedule" },
  { id: "training", label: "Training" },
  { id: "activity", label: "Activity" },
];

export default function PersonnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="space-y-5 max-w-3xl">
      {/* ── Back ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/personnel"
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-[var(--text-secondary)]" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <Avatar name={STAFF.name} size="xl" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {STAFF.name}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge tone={roleTone[STAFF.role] ?? "default"}>{STAFF.role}</Badge>
              <Badge tone={statusTone[STAFF.status] ?? "default"} dot>
                {statusDisplay[STAFF.status] ?? STAFF.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contact Quick Row ── */}
      <div className="flex flex-wrap gap-4">
        <a
          href={`tel:${STAFF.phone}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--action-primary)]"
        >
          <Phone className="h-3.5 w-3.5" />
          {STAFF.phone}
        </a>
        <a
          href={`mailto:${STAFF.email}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--action-primary)]"
        >
          <Mail className="h-3.5 w-3.5" />
          {STAFF.email}
        </a>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)]">
          <Shield className="h-3.5 w-3.5" />
          Badge {STAFF.badge}
        </span>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="md" onClick={() => setEditOpen(true)}>
          Edit
        </Button>
        <Button variant="destructive" size="md" onClick={() => setDeleteOpen(true)}>
          Delete
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <p className="text-[13px] text-[var(--text-primary)]">{STAFF.name}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <p className="text-[13px] text-[var(--text-primary)]">{STAFF.role}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <p className="text-[13px] text-[var(--text-primary)]">{STAFF.email}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Phone
                  </label>
                  <p className="text-[13px] text-[var(--text-primary)]">{STAFF.phone}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Hire Date
                  </label>
                  <p className="text-[13px] text-[var(--text-primary)]">{STAFF.hireDate}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Emergency Contact
                  </label>
                  <p className="text-[13px] text-[var(--text-primary)]">{STAFF.emergencyContact}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">
                Certifications
              </h3>
              <div className="flex flex-wrap gap-2">
                {STAFF.certifications.map((cert) => (
                  <Badge key={cert} tone="success">
                    <CheckCircle2 className="h-3 w-3" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Schedule Tab ── */}
      {activeTab === "schedule" && (() => {
        const SHIFT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
          Day: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
          Swing: { bg: "#ffedd5", border: "#f97316", text: "#9a3412" },
          Night: { bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6" },
        };

        const SCHEDULE: (null | { type: "Day" | "Swing" | "Night"; zone: string; start: number; end: number })[] = [
          { type: "Day", zone: "Zone A", start: 6, end: 14 },       // Mon
          { type: "Day", zone: "Zone A", start: 6, end: 14 },       // Tue
          null,                                                        // Wed OFF
          { type: "Swing", zone: "Zone B", start: 14, end: 22 },    // Thu
          { type: "Swing", zone: "Zone B", start: 14, end: 22 },    // Fri
          { type: "Day", zone: "Main Stage", start: 6, end: 14 },   // Sat
          null,                                                        // Sun OFF
        ];

        const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const TIME_SLOTS = [6, 8, 10, 12, 14, 16, 18, 20, 22];

        const formatTime = (h: number) => {
          const suffix = h >= 12 ? "PM" : "AM";
          const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
          return `${hour}${suffix}`;
        };

        return (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Hours This Week</span>
                  </div>
                  <span className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">40h</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Next Shift</span>
                  </div>
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">Thu 2:00 PM</span>
                  <span className="text-[11px] text-[var(--text-tertiary)] ml-1">Zone B</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Overtime</span>
                  </div>
                  <span className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">0h</span>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Calendar Grid */}
            <Card>
              <CardContent>
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">Weekly Schedule</h3>
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    {/* Day Headers */}
                    <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-px mb-1">
                      <div />
                      {DAYS.map((day, i) => (
                        <div key={day} className="text-center">
                          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">{day}</span>
                          {SCHEDULE[i] === null && (
                            <div className="text-[10px] text-[var(--text-tertiary)] opacity-60">OFF</div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Time Grid */}
                    <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-px border border-[var(--border-default)] rounded-lg overflow-hidden bg-[var(--border-default)]">
                      {TIME_SLOTS.map((hour, rowIdx) => (
                        <div key={hour} className="contents">
                          {/* Time label */}
                          <div className="bg-[var(--surface-primary)] px-1.5 py-2 flex items-start justify-end">
                            <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums leading-none">{formatTime(hour)}</span>
                          </div>
                          {/* Day cells */}
                          {DAYS.map((day, colIdx) => {
                            const shift = SCHEDULE[colIdx];
                            const isInShift = shift && hour >= shift.start && hour < shift.end;
                            const isShiftStart = shift && hour === shift.start;
                            const colors = shift ? SHIFT_COLORS[shift.type] : null;

                            return (
                              <div
                                key={`${day}-${hour}`}
                                className="bg-[var(--surface-primary)] min-h-[36px] relative"
                                style={isInShift && colors ? {
                                  backgroundColor: colors.bg,
                                  borderLeft: `2px solid ${colors.border}`,
                                } : undefined}
                              >
                                {isShiftStart && shift && colors && (
                                  <div className="px-1.5 py-1">
                                    <span
                                      className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                      style={{ backgroundColor: colors.border, color: "#fff" }}
                                    >
                                      {shift.type}
                                    </span>
                                    <div className="text-[10px] mt-0.5 leading-tight" style={{ color: colors.text }}>
                                      {shift.zone}
                                    </div>
                                    <div className="text-[9px] mt-0.5 opacity-70" style={{ color: colors.text }}>
                                      {formatTime(shift.start)}–{formatTime(shift.end)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3">
                  {Object.entries(SHIFT_COLORS).map(([type, colors]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colors.border }} />
                      <span className="text-[11px] text-[var(--text-tertiary)]">{type}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[var(--surface-primary)] border border-[var(--border-default)]" />
                    <span className="text-[11px] text-[var(--text-tertiary)]">Off</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* ── Training Tab ── */}
      {activeTab === "training" && (
        <Card>
          <CardContent>
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">
              Training Records
            </h3>
            <div className="space-y-3">
              {STAFF.training.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center justify-between py-2.5 border-b border-[var(--border-default)] last:border-0"
                >
                  <div>
                    <p className="text-[13px] font-medium text-[var(--text-primary)]">
                      {t.name}
                    </p>
                    <p className="text-[12px] text-[var(--text-tertiary)]">{t.date}</p>
                  </div>
                  <StatusBadge status={t.status} dot />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Activity Tab ── */}
      {activeTab === "activity" && (
        <Card>
          <CardContent>
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">
              Recent Activity
            </h3>
            <div className="space-y-0">
              {STAFF.activities.map((a, i) => (
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
          </CardContent>
        </Card>
      )}

      {/* ── Modals ── */}
      <EditPersonnelModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={async (data) => {
          toast("Personnel record updated successfully", { variant: "success" });
          setEditOpen(false);
        }}
        initialData={{
          firstName: STAFF.name.split(" ").slice(0, -1).join(" "),
          lastName: STAFF.name.split(" ").slice(-1)[0],
          role: STAFF.role.toLowerCase(),
          badgeNumber: STAFF.badge,
          phone: STAFF.phone,
          email: STAFF.email,
          shift: "",
          zone: "",
          certifications: STAFF.certifications.join(", "),
          startDate: STAFF.hireDate,
          emergencyContact: STAFF.emergencyContact,
          notes: "",
        }}
      />
      <DeletePersonnelModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async (reason) => {
          toast("Personnel record deleted successfully", { variant: "success" });
          setDeleteOpen(false);
        }}
        personnelName={STAFF.name}
        badgeNumber={STAFF.badge}
      />
    </div>
  );
}
