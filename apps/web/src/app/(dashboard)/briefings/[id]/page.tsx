"use client";

import { use } from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EditBriefingModal, DeleteBriefingModal } from "@/components/modals/briefings";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

/* ── Mock Briefing ── */
const BRIEFING = {
  id: "1",
  title: "Evening Shift Handoff",
  priority: "high" as const,
  author: "Sgt. Maria Patel",
  timestamp: "April 5, 2026 at 5:48 PM",
  content: [
    "Gate B experienced two unresolved disturbance calls during the day shift. Both incidents involved verbal altercations near the beer garden entrance. Subjects were separated but not ejected. Evening patrol should maintain increased presence in this area through at least 9 PM.",
    "The VIP section requires additional patrol coverage due to the headliner arrival scheduled for 7 PM. Artist management has requested a secure corridor from the north entrance to the backstage area. Credential verification has been upgraded to photo-match for all backstage access points.",
    "Medical tent reported critically low supply of cold packs and ACE bandages. A resupply request has been submitted but may not arrive until tomorrow morning. Prioritize directing minor injury cases to the secondary medical station at Gate D, which has full stock.",
    "Radio channel 3 has been reassigned from logistics to security operations for the evening. All security staff should switch to Channel 3 by 6 PM. Dispatch will monitor both Channel 3 and Channel 5 (medical) simultaneously.",
  ],
  totalStaff: 12,
  acknowledgedBy: [
    { name: "Officer James Rivera", time: "6 min ago" },
    { name: "Officer Lisa Chen", time: "12 min ago" },
    { name: "Capt. Sarah Kim", time: "18 min ago" },
    { name: "Officer David Park", time: "24 min ago" },
  ],
  replies: [
    {
      id: "r1",
      author: "Officer James Rivera",
      time: "5 min ago",
      text: "Copy that on Channel 3 reassignment. Already switched over. Will increase patrol near Gate B beer garden starting at 6 PM.",
    },
    {
      id: "r2",
      author: "Capt. Sarah Kim",
      time: "15 min ago",
      text: "Confirmed VIP corridor setup. I've assigned Officers Park and Martinez to the north entrance for the headliner arrival. ETA on-position is 6:30 PM.",
    },
  ],
};

const priorityTone: Record<string, "critical" | "warning" | "info"> = {
  high: "critical",
  medium: "warning",
  low: "info",
};

export default function BriefingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [replyText, setReplyText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const ackCount = BRIEFING.acknowledgedBy.length + (acknowledged ? 1 : 0);
  const ackPercent = (ackCount / BRIEFING.totalStaff) * 100;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* ── Back + Title ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/briefings"
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-[var(--text-secondary)]" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {BRIEFING.title}
          </h1>
        </div>
      </div>

      {/* ── Meta ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={priorityTone[BRIEFING.priority]} dot>
          {BRIEFING.priority.charAt(0).toUpperCase() +
            BRIEFING.priority.slice(1)}{" "}
          Priority
        </Badge>
        <div className="flex items-center gap-2">
          <Avatar name={BRIEFING.author} size="xs" />
          <span className="text-[13px] text-[var(--text-secondary)]">
            {BRIEFING.author}
          </span>
        </div>
        <span className="text-[12px] text-[var(--text-tertiary)]">
          {BRIEFING.timestamp}
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

      {/* ── Content ── */}
      <Card>
        <CardContent>
          <div className="space-y-3">
            {BRIEFING.content.map((p, i) => (
              <p
                key={i}
                className="text-[13px] text-[var(--text-secondary)] leading-relaxed"
              >
                {p}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Acknowledgment Section ── */}
      <Card>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
                Acknowledgments
              </h3>
              <span className="text-[12px] text-[var(--text-tertiary)]">
                {ackCount} of {BRIEFING.totalStaff} acknowledged
              </span>
            </div>

            <ProgressBar value={ackPercent} size="md" />

            <div className="space-y-2">
              {acknowledged && (
                <div className="flex items-center gap-3 py-2">
                  <Avatar name="You" size="sm" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">
                      You
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    Just now
                  </span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-success,#059669)]" />
                </div>
              )}
              {BRIEFING.acknowledgedBy.map((ack) => (
                <div key={ack.name} className="flex items-center gap-3 py-2">
                  <Avatar name={ack.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">
                      {ack.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    {ack.time}
                  </span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-success,#059669)]" />
                </div>
              ))}
            </div>

            {!acknowledged && (
              <Button size="md" onClick={() => setAcknowledged(true)}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Acknowledge
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Replies Section ── */}
      <Card>
        <CardContent>
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-4">
            Replies
          </h3>

          <div className="space-y-4">
            {BRIEFING.replies.map((reply) => (
              <div
                key={reply.id}
                className="flex gap-3 pb-4 border-b border-[var(--border-default)] last:border-0 last:pb-0"
              >
                <Avatar name={reply.author} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">
                      {reply.author}
                    </span>
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                      {reply.time}
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                    {reply.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Reply Input ── */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-default)]">
            <Avatar name="You" size="sm" />
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-3 pr-10 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--action-primary)] disabled:opacity-40"
                disabled={!replyText.trim()}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Modals ── */}
      <EditBriefingModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={async (data) => {
          console.log("Edit briefing:", data);
          setEditOpen(false);
        }}
        briefing={{
          title: BRIEFING.title,
          content: BRIEFING.content.join("\n\n"),
          priority: BRIEFING.priority,
          recipients: "all_staff",
          sourceModule: "manual",
          linkUrl: "",
        }}
      />
      <DeleteBriefingModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          console.log("Delete briefing:", id);
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
