"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { AppPage, PageHeader, PageSection } from "@/components/layout/AppPage";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { EditBriefingModal, DeleteBriefingModal } from "@/components/modals/briefings";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useRouter } from "next/navigation";
import {
  fetchBriefingById,
  acknowledgeBriefing,
  addBriefingReply,
  updateBriefing,
  deleteBriefing,
  type BriefingDetail,
} from "@/lib/queries/briefings";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { formatRelativeTime } from "@/lib/utils/time";

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
  const { toast } = useToast();
  const router = useRouter();

  const [briefing, setBriefing] = useState<BriefingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string; fullName: string | null } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        setCurrentUser({ id: user.id, fullName: profile?.full_name ?? null });
      } else {
        setCurrentUser(null);
      }

      const data = await fetchBriefingById(id);
      setBriefing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load briefing");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <AppPage width="base" className="animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 w-full" />
      </AppPage>
    );
  }

  if (error || !briefing) {
    return (
      <AppPage width="base">
        <PageSection className="flex h-64 flex-col items-center justify-center gap-3">
          <p className="text-[var(--text-secondary)]">{error || "Briefing not found"}</p>
          <Link href="/briefings">
            <Button variant="secondary" size="sm">Back to Briefings</Button>
          </Link>
        </PageSection>
      </AppPage>
    );
  }

  const contentParagraphs = briefing.content.split(/\n{2,}/).filter(Boolean);
  const authorName = briefing.creator?.fullName ?? "Unknown";
  const timestamp = new Date(briefing.createdAt).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  // Recipients — the briefing.recipients field may be a JSON array or string
  const recipientsList = briefing.recipients.targets;
  const totalStaff = recipientsList.length || 1;
  const ackCount = briefing.recipients.acknowledgments.length;
  const ackPercent = (ackCount / totalStaff) * 100;
  const yourAcknowledgement = currentUser
    ? briefing.recipients.acknowledgments.find((entry) => entry.userId === currentUser.id)
    : null;
  const acknowledged = Boolean(yourAcknowledgement);

  return (
    <AppPage width="base">
      <PageHeader
        breadcrumbs={
          <Link
            href="/briefings"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--action-primary)] transition-colors hover:text-[var(--action-primary-hover)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Briefings
          </Link>
        }
        title={briefing.title}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={priorityTone[briefing.priority] ?? "info"} dot>
          {briefing.priority.charAt(0).toUpperCase() + briefing.priority.slice(1)} Priority
        </Badge>
        <div className="flex items-center gap-2">
          <Avatar name={authorName} size="xs" />
          <span className="text-[13px] text-[var(--text-secondary)]">
            {authorName}
          </span>
        </div>
        <span className="text-[12px] text-[var(--text-tertiary)]">
          {timestamp}
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button variant="outline" size="md" onClick={() => setEditOpen(true)} className="w-full sm:w-auto">
          Edit
        </Button>
        <Button variant="destructive" size="md" onClick={() => setDeleteOpen(true)} className="w-full sm:w-auto">
          Delete
        </Button>
      </div>

      <Card>
        <CardContent>
          <div className="space-y-3">
            {contentParagraphs.map((p, i) => (
              <p
                key={i}
                className="text-[13px] text-[var(--text-secondary)] leading-relaxed"
              >
                {p}
              </p>
            ))}
          </div>
          {briefing.linkUrl && (
            <div className="mt-4 pt-3 border-t border-[var(--border-default)]">
              <a
                href={briefing.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-[var(--action-primary)] hover:underline"
              >
                {briefing.linkUrl}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
                Acknowledgments
              </h3>
              <span className="text-[12px] text-[var(--text-tertiary)]">
                {ackCount} acknowledged
              </span>
            </div>

            <ProgressBar value={ackPercent} size="md" />

            {acknowledged && (
              <div className="flex items-center gap-3 py-2">
                <Avatar name={yourAcknowledgement?.userName ?? "You"} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">
                    {yourAcknowledgement?.userName ?? "You"}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {yourAcknowledgement
                    ? formatRelativeTime(yourAcknowledgement.acknowledgedAt)
                    : "Just now"}
                </span>
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-success,#059669)]" />
              </div>
            )}

            {!acknowledged && (
              <Button
                size="md"
                onClick={async () => {
                  try {
                    if (!briefing) throw new Error("Briefing not loaded");
                    if (!currentUser) throw new Error("User profile not loaded");
                    await acknowledgeBriefing(briefing.id, currentUser.id, currentUser.fullName ?? "You");
                    await loadData();
                    toast("Briefing acknowledged", { variant: "success" });
                  } catch (err: any) {
                    toast(err.message || "Failed to acknowledge briefing", { variant: "error" });
                  }
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Acknowledge
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-4">
            Replies
          </h3>
          {briefing.recipients.replies.length === 0 ? (
            <div className="mb-4">
              <EmptyState
                icon={<Send className="h-5 w-5" />}
                title="No replies yet"
                description="Replies from recipients will appear here once the discussion starts."
              />
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {briefing.recipients.replies.map((reply) => (
                <div key={reply.id} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={reply.userName} size="xs" />
                      <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                        {reply.userName}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap">
                      {formatRelativeTime(reply.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] text-[var(--text-secondary)] leading-relaxed">
                    {reply.content}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border-default)] sm:flex-row sm:items-center">
            <Avatar name="You" size="sm" />
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-3 pr-10 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
              />
              <IconButton
                className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg text-[var(--action-primary)] shadow-none hover:bg-[var(--action-primary-surface)]"
                disabled={!replyText.trim()}
                label="Send reply"
                onClick={async () => {
                  try {
                    if (!briefing) throw new Error("Briefing not loaded");
                    if (!currentUser) throw new Error("User profile not loaded");
                    await addBriefingReply(briefing.id, {
                      userId: currentUser.id,
                      userName: currentUser.fullName ?? "You",
                      content: replyText,
                    });
                    setReplyText("");
                    await loadData();
                    toast("Reply saved", { variant: "success" });
                  } catch (err: any) {
                    toast(err.message || "Failed to save reply", { variant: "error" });
                  }
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                <Send className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditBriefingModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={async (data: any) => {
          try {
            await updateBriefing(id, {
              title: data.title,
              content: data.content,
              priority: data.priority,
              recipients: data.recipients,
              linkUrl: data.linkUrl,
              sourceModule: data.sourceModule,
            });
            toast("Briefing updated successfully", { variant: "success" });
            setEditOpen(false);
            loadData();
          } catch (err: any) {
            toast(err.message || "Failed to update briefing", { variant: "error" });
          }
        }}
        briefing={{
          title: briefing.title,
          content: briefing.content,
          priority: briefing.priority,
          recipients: briefing.recipients.targetValue || "all_staff",
          sourceModule: briefing.sourceModule ?? "manual",
          linkUrl: briefing.linkUrl ?? "",
        }}
      />
      <DeleteBriefingModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await deleteBriefing(id);
            toast("Briefing deleted successfully", { variant: "success" });
            setDeleteOpen(false);
            router.push("/briefings");
          } catch (err: any) {
            toast(err.message || "Failed to delete briefing", { variant: "error" });
          }
        }}
      />
    </AppPage>
  );
}
