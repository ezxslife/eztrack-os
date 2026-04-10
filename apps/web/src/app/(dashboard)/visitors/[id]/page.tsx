"use client";

import { use, useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  LogIn,
  LogOut,
  UserPlus,
  XCircle,
  Clock,
  Users,
  Car,
  StickyNote,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  SignInVisitorModal,
  SignOutVisitorModal,
  AddVisitorToVisitModal,
  EditVisitModal,
  CancelVisitModal,
} from "@/components/modals/visitors";
import { fetchVisitorById, updateVisitorStatus, updateVisitor, createVisitor, type VisitorDetail } from "@/lib/queries/visitors";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ── Purpose Badge ── */
const PURPOSE_CONFIG: Record<string, { label: string; tone: "info" | "warning" | "success" | "critical" | "attention" }> = {
  vip_guest: { label: "VIP Guest", tone: "attention" },
  vendor_check_in: { label: "Vendor", tone: "info" },
  contractor: { label: "Contractor", tone: "warning" },
  media: { label: "Media", tone: "critical" },
  performer: { label: "Performer", tone: "success" },
};

/* ── Field helper ── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-0.5">
      {children}
    </p>
  );
}

export default function VisitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();

  const [visitor, setVisitor] = useState<VisitorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [addVisitorOpen, setAddVisitorOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const loadVisitor = async () => {
    try {
      setLoading(true);
      const data = await fetchVisitorById(id);
      setVisitor(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load visitor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitor();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !visitor) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Users size={32} className="text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-secondary)]">{error || "Visitor not found"}</p>
        <Link href="/visitors">
          <Button variant="secondary" size="sm">Back to Visitors</Button>
        </Link>
      </div>
    );
  }

  const purposeConfig = PURPOSE_CONFIG[visitor.purpose] ?? { label: visitor.purpose, tone: "default" as const };
  const displayName = `${visitor.firstName} ${visitor.lastName}`.trim();
  const createdDate = new Date(visitor.createdAt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
  const scheduledDate = visitor.expectedDate
    ? new Date(visitor.expectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "-";

  return (
    <div className="space-y-5">
      {/* ── Back Link ── */}
      <Link
        href="/visitors"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Visitors
      </Link>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {displayName}
            </h1>
            <Badge tone={purposeConfig.tone}>
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3" />
                {purposeConfig.label}
              </span>
            </Badge>
            <StatusBadge status={visitor.status} dot />
          </div>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            Created {createdDate}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {visitor.status === "signed_in" && (
            <Button size="md" variant="secondary" onClick={() => setSignOutOpen(true)}>
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          )}
          {(visitor.status === "pending" || visitor.status === "expected") && (
            <Button size="md" onClick={() => setSignInOpen(true)}>
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Button>
          )}
          <Button size="md" variant="outline" onClick={() => setEditOpen(true)}>
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button size="md" variant="destructive" onClick={() => setCancelOpen(true)}>
            <XCircle className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Visit Info */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
                  Visit Information
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <FieldLabel>Scheduled Date</FieldLabel>
                  <p className="text-[13px] text-[var(--text-primary)]">{scheduledDate}</p>
                </div>
                <div>
                  <FieldLabel>Scheduled Time</FieldLabel>
                  <p className="text-[13px] text-[var(--text-primary)]">{visitor.expectedTime ?? "-"}</p>
                </div>
                <div>
                  <FieldLabel>Host</FieldLabel>
                  <p className="text-[13px] text-[var(--text-primary)]">{visitor.hostName ?? "-"}</p>
                  {visitor.hostDepartment && (
                    <p className="text-[12px] text-[var(--text-tertiary)]">{visitor.hostDepartment}</p>
                  )}
                </div>
                <div>
                  <FieldLabel>Company</FieldLabel>
                  <p className="text-[13px] text-[var(--text-primary)]">{visitor.company ?? "-"}</p>
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  {visitor.email ? (
                    <a href={`mailto:${visitor.email}`} className="text-[13px] text-[var(--action-primary)] hover:underline">
                      {visitor.email}
                    </a>
                  ) : (
                    <p className="text-[13px] text-[var(--text-primary)]">-</p>
                  )}
                </div>
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  {visitor.phone ? (
                    <a href={`tel:${visitor.phone}`} className="text-[13px] text-[var(--action-primary)] hover:underline">
                      {visitor.phone}
                    </a>
                  ) : (
                    <p className="text-[13px] text-[var(--text-primary)]">-</p>
                  )}
                </div>
                <div>
                  <FieldLabel>Checked In</FieldLabel>
                  <p className="text-[13px] text-[var(--text-primary)]">
                    {visitor.checkedInAt
                      ? new Date(visitor.checkedInAt).toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })
                      : "-"}
                  </p>
                </div>
                <div>
                  <FieldLabel>Checked Out</FieldLabel>
                  <p className="text-[13px] text-[var(--text-primary)]">
                    {visitor.checkedOutAt
                      ? new Date(visitor.checkedOutAt).toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })
                      : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ID Information */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[var(--text-tertiary)]" />
                  Identification
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <FieldLabel>ID Type</FieldLabel>
                  <p className="text-[13px] text-[var(--text-primary)]">{visitor.idType ?? "-"}</p>
                </div>
                <div>
                  <FieldLabel>ID Number</FieldLabel>
                  <p className="text-[13px] text-[var(--text-primary)]">{visitor.idNumber ?? "-"}</p>
                </div>
                <div>
                  <FieldLabel>NDA Required</FieldLabel>
                  <p className="text-[13px] text-[var(--text-primary)]">{visitor.ndaRequired ? "Yes" : "No"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column (1/3) ── */}
        <div className="space-y-5">
          {/* Vehicle / Parking */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-1.5">
                  <Car className="h-4 w-4 text-[var(--text-tertiary)]" />
                  Vehicle
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visitor.vehiclePlate ? (
                <div className="space-y-3">
                  <div>
                    <FieldLabel>License Plate</FieldLabel>
                    <p className="text-[13px] text-[var(--text-primary)] font-mono">{visitor.vehiclePlate}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-[var(--text-tertiary)] italic">No vehicle on record</p>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-1.5">
                  <StickyNote className="h-4 w-4 text-[var(--text-tertiary)]" />
                  Status
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBadge status={visitor.status} dot />
              <p className="text-[12px] text-[var(--text-tertiary)] mt-2">
                Last updated: {new Date(visitor.updatedAt).toLocaleString("en-US", {
                  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Modals ── */}
      <SignInVisitorModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSubmit={async () => {
          await updateVisitorStatus(id, "signed_in");
          toast("Visitor signed in successfully", { variant: "success" });
          setSignInOpen(false);
          loadVisitor();
        }}
        visitorName={displayName}
        badgeNumber=""
      />
      <SignOutVisitorModal
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={async () => {
          await updateVisitorStatus(id, "signed_out");
          toast("Visitor signed out successfully", { variant: "success" });
          setSignOutOpen(false);
          loadVisitor();
        }}
        visitorName={displayName}
      />
      <AddVisitorToVisitModal
        open={addVisitorOpen}
        onClose={() => setAddVisitorOpen(false)}
        onSubmit={async (data) => {
          try {
            // Create a new visitor record linked to the same org/property
            await createVisitor({
              orgId: visitor.orgId,
              propertyId: visitor.propertyId,
              firstName: (data as any).firstName || "",
              lastName: (data as any).lastName || "",
              purpose: visitor.purpose,
              hostName: visitor.hostName || undefined,
              hostDepartment: visitor.hostDepartment || undefined,
              company: (data as any).organization,
              email: (data as any).email,
              phone: (data as any).phone,
            });
            toast("Visitor added to visit successfully", { variant: "success" });
            setAddVisitorOpen(false);
            loadVisitor();
          } catch (err: any) {
            toast(err.message || "Failed to add visitor", { variant: "error" });
          }
        }}
      />
      <EditVisitModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={async (data) => {
          try {
            await updateVisitor(id, {
              purpose: (data as any).purpose,
              hostName: (data as any).hostName,
              hostDepartment: (data as any).hostDepartment,
              expectedDate: (data as any).expectedDate,
              expectedTime: (data as any).expectedTime,
              firstName: (data as any).firstName,
              lastName: (data as any).lastName,
              company: (data as any).company,
              phone: (data as any).phone,
              email: (data as any).email,
              idType: (data as any).idType,
              idNumber: (data as any).idNumber,
              vehiclePlate: (data as any).vehiclePlate,
            });
            toast("Visit updated successfully", { variant: "success" });
            setEditOpen(false);
            loadVisitor();
          } catch (err: any) {
            toast(err.message || "Failed to update visit", { variant: "error" });
          }
        }}
        initialData={{
          purpose: visitor.purpose,
          hostName: visitor.hostName ?? "",
          hostDepartment: visitor.hostDepartment ?? "",
          expectedDate: visitor.expectedDate ?? "",
          expectedTime: visitor.expectedTime ?? "",
          firstName: visitor.firstName,
          lastName: visitor.lastName,
          company: visitor.company ?? "",
          phone: visitor.phone ?? "",
          email: visitor.email ?? "",
          idType: visitor.idType ?? "",
          idNumber: visitor.idNumber ?? "",
          vehiclePlate: visitor.vehiclePlate ?? "",
        }}
      />
      <CancelVisitModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={async () => {
          await updateVisitorStatus(id, "cancelled");
          toast("Visit cancelled successfully", { variant: "success" });
          setCancelOpen(false);
          loadVisitor();
        }}
      />
    </div>
  );
}
