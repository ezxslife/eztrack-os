"use client";

import {
  DrawerPanel,
  DrawerHeader,
  DrawerContent,
  DrawerFooter,
} from "@/components/modals/DrawerPanel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Clock, MapPin, Phone, User, Radio } from "lucide-react";
import clsx from "clsx";

interface TimelineEntry {
  id: string;
  time: string;
  label: string;
  actor?: string;
}

interface DispatchDetail {
  id: string;
  priority: string;
  status: string;
  dispatchCode: string;
  synopsis: string;
  location: string;
  sublocation?: string;
  reporterName?: string;
  reporterPhone?: string;
  anonymous: boolean;
  callSource: string;
  assignedOfficers: { id: string; name: string; badge: string }[];
  timeline: TimelineEntry[];
  createdAt: string;
}

interface DispatchDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  dispatch: DispatchDetail | null;
  onAssignOfficer?: () => void;
  onClear?: () => void;
  onEscalate?: () => void;
  onEdit?: () => void;
}

const PRIORITY_TONE: Record<string, "critical" | "warning" | "attention" | "info" | "default"> = {
  P1: "critical",
  P2: "warning",
  P3: "attention",
  P4: "info",
  P5: "default",
};

const STATUS_TONE: Record<string, "success" | "warning" | "info" | "default" | "critical"> = {
  active: "info",
  pending: "warning",
  cleared: "success",
  cancelled: "default",
  escalated: "critical",
};

export function DispatchDetailDrawer({
  open,
  onClose,
  dispatch,
  onAssignOfficer,
  onClear,
  onEscalate,
  onEdit,
}: DispatchDetailDrawerProps) {
  if (!dispatch) return null;

  return (
    <DrawerPanel open={open} onClose={onClose} size="lg">
      <DrawerHeader onClose={onClose}>
        Dispatch {dispatch.id}
      </DrawerHeader>

      <DrawerContent>
        {/* Priority & Status Header */}
        <div className="flex items-center gap-2 mb-5">
          <Badge tone={PRIORITY_TONE[dispatch.priority] ?? "default"} dot>
            {dispatch.priority}
          </Badge>
          <Badge tone={STATUS_TONE[dispatch.status] ?? "default"} dot>
            {dispatch.status.charAt(0).toUpperCase() + dispatch.status.slice(1)}
          </Badge>
          <Badge tone="default">{dispatch.dispatchCode}</Badge>
        </div>

        {/* Synopsis */}
        <section className="mb-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
            Synopsis
          </h3>
          <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">
            {dispatch.synopsis}
          </p>
        </section>

        {/* Location */}
        <section className="mb-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
            Location
          </h3>
          <div className="flex items-start gap-2 text-[13px] text-[var(--text-primary)]">
            <MapPin size={14} className="mt-0.5 text-[var(--text-tertiary)] shrink-0" />
            <div>
              <p>{dispatch.location}</p>
              {dispatch.sublocation && (
                <p className="text-[var(--text-tertiary)]">{dispatch.sublocation}</p>
              )}
            </div>
          </div>
        </section>

        {/* Reporter Info */}
        <section className="mb-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
            Reporter
          </h3>
          {dispatch.anonymous ? (
            <p className="text-[13px] text-[var(--text-tertiary)] italic">Anonymous reporter</p>
          ) : (
            <div className="space-y-1">
              {dispatch.reporterName && (
                <div className="flex items-center gap-2 text-[13px] text-[var(--text-primary)]">
                  <User size={14} className="text-[var(--text-tertiary)]" />
                  {dispatch.reporterName}
                </div>
              )}
              {dispatch.reporterPhone && (
                <div className="flex items-center gap-2 text-[13px] text-[var(--text-primary)]">
                  <Phone size={14} className="text-[var(--text-tertiary)]" />
                  {dispatch.reporterPhone}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-[13px] text-[var(--text-tertiary)] mt-1">
            <Radio size={14} />
            Source: {dispatch.callSource}
          </div>
        </section>

        {/* Assigned Officers */}
        <section className="mb-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
            Assigned Officers
          </h3>
          {dispatch.assignedOfficers.length === 0 ? (
            <p className="text-[12px] text-[var(--text-tertiary)] italic">No officers assigned</p>
          ) : (
            <div className="space-y-1.5">
              {dispatch.assignedOfficers.map((officer) => (
                <div
                  key={officer.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-secondary)]"
                >
                  <div className="h-6 w-6 rounded-full bg-[var(--eztrack-primary-500,#6366f1)]/10 flex items-center justify-center">
                    <User size={12} className="text-[var(--eztrack-primary-500,#6366f1)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                      {officer.name}
                    </p>
                  </div>
                  <span className="text-[11px] text-[var(--text-tertiary)]">{officer.badge}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Timeline */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            Timeline
          </h3>
          <div className="space-y-0">
            {dispatch.timeline.map((entry, idx) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={clsx(
                      "h-2 w-2 rounded-full mt-1.5 shrink-0",
                      idx === 0 ? "bg-[var(--eztrack-primary-500,#6366f1)]" : "bg-[var(--border-default)]"
                    )}
                  />
                  {idx < dispatch.timeline.length - 1 && (
                    <div className="w-px flex-1 bg-[var(--border-default)]" />
                  )}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2">
                    <Clock size={11} className="text-[var(--text-tertiary)]" />
                    <span className="text-[11px] text-[var(--text-tertiary)]">{entry.time}</span>
                  </div>
                  <p className="text-[13px] text-[var(--text-primary)]">{entry.label}</p>
                  {entry.actor && (
                    <p className="text-[11px] text-[var(--text-tertiary)]">by {entry.actor}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </DrawerContent>

      <DrawerFooter>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
        )}
        {onAssignOfficer && (
          <Button variant="outline" size="sm" onClick={onAssignOfficer}>
            Assign Officer
          </Button>
        )}
        {onEscalate && (
          <Button variant="outline" size="sm" onClick={onEscalate}>
            Escalate
          </Button>
        )}
        {onClear && (
          <Button size="sm" onClick={onClear}>
            Clear Dispatch
          </Button>
        )}
      </DrawerFooter>
    </DrawerPanel>
  );
}
