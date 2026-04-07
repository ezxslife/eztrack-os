"use client";

import { use, useState } from "react";
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
  MapPin,
  Users,
  Car,
  StickyNote,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  SignInVisitorModal,
  SignOutVisitorModal,
  AddVisitorToVisitModal,
  EditVisitModal,
  CancelVisitModal,
} from "@/components/modals/visitors";

/* ── Purpose Badge ── */
const PURPOSE_CONFIG: Record<string, { label: string; tone: "info" | "warning" | "success" | "critical" | "attention" }> = {
  vip_guest: { label: "VIP Guest", tone: "attention" },
  vendor_check_in: { label: "Vendor", tone: "info" },
  contractor: { label: "Contractor", tone: "warning" },
  media: { label: "Media", tone: "critical" },
  performer: { label: "Performer", tone: "success" },
};

/* ── Mock Data ── */
const MOCK_VISIT = {
  id: "1",
  visitNumber: "VIS-2026-0034",
  purpose: "vip_guest",
  status: "signed_in",
  host: "Sarah Chen, Event Director",
  hostEmail: "s.chen@eztrack.io",
  hostPhone: "(555) 234-5678",
  location: "VIP Lounge — Main Stage",
  building: "Main Arena Complex",
  scheduledDate: "Apr 5, 2026",
  scheduledTime: "10:00 AM — 6:00 PM",
  createdAt: "Apr 3, 2026 9:14 AM",
  createdBy: "Sarah Chen",
  visitors: [
    {
      id: "v1",
      name: "David Park",
      organization: "Horizon Media Group",
      signedInAt: "9:52 AM",
      signedOutAt: null,
      idType: "Driver License",
      badgeNumber: "VB-0412",
    },
    {
      id: "v2",
      name: "Lisa Wang",
      organization: "Horizon Media Group",
      signedInAt: "9:55 AM",
      signedOutAt: null,
      idType: "Passport",
      badgeNumber: "VB-0413",
    },
  ],
  vehicle: {
    make: "Tesla",
    model: "Model X",
    color: "Black",
    plate: "7ABC123",
    parkingSpot: "Reserved #12",
    parkingLot: "VIP Lot A",
  },
  notes:
    "Guests of the CEO for the annual sponsor preview. Reserved parking spot #12. Escort from main gate required. Dietary preference: vegetarian for lunch catering. Access level: VIP areas + backstage.",
};

export default function VisitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const visit = MOCK_VISIT; // In production, fetch by id
  const purposeConfig = PURPOSE_CONFIG[visit.purpose] ?? { label: visit.purpose, tone: "default" as const };

  const { toast } = useToast();
  const [signInOpen, setSignInOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [addVisitorOpen, setAddVisitorOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

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
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {visit.visitNumber}
            </h1>
            <Badge tone={purposeConfig.tone}>
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3" />
                {purposeConfig.label}
              </span>
            </Badge>
            <StatusBadge status={visit.status} dot />
          </div>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            Created {visit.createdAt} by {visit.createdBy}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {visit.status === "signed_in" && (
            <Button size="md" variant="secondary" onClick={() => setSignOutOpen(true)}>
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          )}
          {visit.status === "pending" && (
            <Button size="md" onClick={() => setSignInOpen(true)}>
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Button>
          )}
          <Button size="md" variant="secondary" onClick={() => setAddVisitorOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" />
            Add Visitor
          </Button>
          <Button size="md" variant="outline" onClick={() => setEditOpen(true)}>
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button size="md" variant="destructive" onClick={() => setCancelOpen(true)}>
            <XCircle className="h-3.5 w-3.5" />
            Cancel Visit
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
                  <p className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-0.5">
                    Scheduled Date
                  </p>
                  <p className="text-[13px] text-[var(--text-primary)]">{visit.scheduledDate}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-0.5">
                    Scheduled Time
                  </p>
                  <p className="text-[13px] text-[var(--text-primary)]">{visit.scheduledTime}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-0.5">
                    Host
                  </p>
                  <p className="text-[13px] text-[var(--text-primary)]">{visit.host}</p>
                  <p className="text-[12px] text-[var(--text-tertiary)]">
                    {visit.hostEmail} &middot; {visit.hostPhone}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-0.5">
                    Location
                  </p>
                  <p className="text-[13px] text-[var(--text-primary)]">{visit.location}</p>
                  <p className="text-[12px] text-[var(--text-tertiary)]">{visit.building}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visitor List */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[var(--text-tertiary)]" />
                  Visitor List ({visit.visitors.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] bg-[var(--surface-secondary)]">
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">Name</th>
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">Organization</th>
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">Signed In</th>
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">Signed Out</th>
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">ID Type</th>
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">Badge #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visit.visitors.map((visitor) => (
                      <tr
                        key={visitor.id}
                        className="border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">
                          {visitor.name}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                          {visitor.organization}
                        </td>
                        <td className="px-4 py-2.5">
                          {visitor.signedInAt ? (
                            <span className="inline-flex items-center gap-1 text-[var(--status-success, #059669)]">
                              <LogIn className="h-3 w-3" />
                              {visitor.signedInAt}
                            </span>
                          ) : (
                            <span className="text-[var(--text-tertiary)]">--</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {visitor.signedOutAt ? (
                            <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]">
                              <LogOut className="h-3 w-3" />
                              {visitor.signedOutAt}
                            </span>
                          ) : (
                            <span className="text-[var(--text-tertiary)]">--</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                          {visitor.idType}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge tone="default">{visitor.badgeNumber}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  Vehicle / Parking
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-0.5">
                    Vehicle
                  </p>
                  <p className="text-[13px] text-[var(--text-primary)]">
                    {visit.vehicle.color} {visit.vehicle.make} {visit.vehicle.model}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-0.5">
                    License Plate
                  </p>
                  <p className="text-[13px] text-[var(--text-primary)] font-mono">
                    {visit.vehicle.plate}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-0.5">
                    Parking
                  </p>
                  <p className="text-[13px] text-[var(--text-primary)]">
                    {visit.vehicle.parkingSpot}
                  </p>
                  <p className="text-[12px] text-[var(--text-tertiary)]">
                    {visit.vehicle.parkingLot}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-1.5">
                  <StickyNote className="h-4 w-4 text-[var(--text-tertiary)]" />
                  Notes
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {visit.notes}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Modals ── */}
      <SignInVisitorModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSubmit={async (data) => {
          toast("Visitor signed in successfully", { variant: "success" });
          setSignInOpen(false);
        }}
        visitorName={visit.visitors[0]?.name}
        badgeNumber={visit.visitors[0]?.badgeNumber}
      />
      <SignOutVisitorModal
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={async () => {
          toast("Visitor signed out successfully", { variant: "success" });
          setSignOutOpen(false);
        }}
        visitorName={visit.visitors[0]?.name}
      />
      <AddVisitorToVisitModal
        open={addVisitorOpen}
        onClose={() => setAddVisitorOpen(false)}
        onSubmit={async (data) => {
          toast("Visitor added to visit successfully", { variant: "success" });
          setAddVisitorOpen(false);
        }}
      />
      <EditVisitModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={async (data) => {
          toast("Visit updated successfully", { variant: "success" });
          setEditOpen(false);
        }}
        initialData={{
          purpose: visit.purpose,
          hostName: visit.host,
          hostDepartment: "",
          expectedDate: visit.scheduledDate,
          expectedTime: visit.scheduledTime,
          firstName: visit.visitors[0]?.name.split(" ")[0] ?? "",
          lastName: visit.visitors[0]?.name.split(" ").slice(1).join(" ") ?? "",
          company: visit.visitors[0]?.organization ?? "",
          phone: "",
          email: "",
          idType: visit.visitors[0]?.idType ?? "",
          idNumber: "",
          vehiclePlate: visit.vehicle?.plate ?? "",
        }}
      />
      <CancelVisitModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={async (reason) => {
          toast("Visit cancelled successfully", { variant: "success" });
          setCancelOpen(false);
        }}
      />
    </div>
  );
}
