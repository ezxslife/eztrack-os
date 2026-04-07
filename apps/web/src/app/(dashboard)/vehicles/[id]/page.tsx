"use client";

import { use, useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import {
  ArrowLeft,
  Car,
  User,
  FileText,
  StickyNote,
  ExternalLink,
  Building2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EditVehicleModal, DeleteVehicleModal } from "@/components/modals/vehicles";
import { fetchVehicleById, type VehicleDetail } from "@/lib/queries/vehicles";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ── Vehicle type config ── */
type VehicleType = "car" | "truck" | "van" | "motorcycle";

const TYPE_CONFIG: Record<
  string,
  { label: string; tone: "info" | "default" | "warning" | "attention" }
> = {
  car: { label: "Car", tone: "info" },
  truck: { label: "Truck", tone: "default" },
  van: { label: "Van", tone: "warning" },
  motorcycle: { label: "Motorcycle", tone: "attention" },
};

/* ── Owner type config ── */
const OWNER_TYPE_CONFIG: Record<
  string,
  { label: string; tone: "default" | "info" | "attention" | "success" }
> = {
  patron: { label: "Patron", tone: "default" },
  staff: { label: "Staff", tone: "info" },
  contact: { label: "Contact", tone: "attention" },
  event: { label: "Event", tone: "success" },
};

/* ── Color hex map ── */
const COLOR_MAP: Record<string, string> = {
  White: "#ffffff",
  Black: "#1a1a1a",
  Silver: "#c0c0c0",
  Red: "#dc2626",
  Blue: "#2563eb",
  Green: "#16a34a",
  Gray: "#6b7280",
  Yellow: "#eab308",
  white: "#ffffff",
  black: "#1a1a1a",
  silver: "#c0c0c0",
  red: "#dc2626",
  blue: "#2563eb",
  green: "#16a34a",
  gray: "#6b7280",
  yellow: "#eab308",
};

interface LinkedIncident {
  id: string;
  recordNumber: string;
  type: string;
  date: string;
  status: string;
}

/* ── Field helper ── */
function Field({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
        {label}
      </dt>
      <dd className="text-[13px] text-[var(--text-primary)]">
        {children ?? value ?? "-"}
      </dd>
    </div>
  );
}

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [incidents, setIncidents] = useState<LinkedIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const v = await fetchVehicleById(id);
        setVehicle(v);

        // Fetch linked incidents via vehicle_incidents junction
        const supabase = getSupabaseBrowser();
        const { data: linkedData } = await supabase
          .from("vehicle_incidents")
          .select("incident:incidents(id, record_number, incident_type, status, created_at)")
          .eq("vehicle_id", id);

        if (linkedData) {
          setIncidents(
            linkedData
              .filter((r: any) => r.incident)
              .map((r: any) => ({
                id: r.incident.id,
                recordNumber: r.incident.record_number ?? "-",
                type: r.incident.incident_type ?? "-",
                date: r.incident.created_at
                  ? new Date(r.incident.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "-",
                status: r.incident.status ?? "open",
              }))
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load vehicle");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Skeleton className="h-16 w-96" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Car size={32} className="text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-secondary)]">{error || "Vehicle not found"}</p>
        <Link href="/vehicles">
          <Button variant="secondary" size="sm">Back to Vehicles</Button>
        </Link>
      </div>
    );
  }

  const typeCfg = TYPE_CONFIG[vehicle.vehicleType] ?? { label: vehicle.vehicleType, tone: "default" as const };
  const ownerCfg = OWNER_TYPE_CONFIG[vehicle.ownerType ?? "patron"] ?? { label: vehicle.ownerType ?? "Unknown", tone: "default" as const };
  const colorHex = COLOR_MAP[vehicle.color ?? "Gray"] ?? "#6b7280";

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/vehicles">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} />
            </Button>
          </Link>
          <div className="w-16 h-16 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
            <Car size={24} className="text-[var(--text-tertiary)]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight font-mono text-[var(--text-primary)]">
                {vehicle.licensePlate || "No Plate"}
              </h1>
              <Badge tone={typeCfg.tone} dot>
                {typeCfg.label}
              </Badge>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[13px] text-[var(--text-tertiary)]">
              <span>{vehicle.make} {vehicle.model} {vehicle.year ?? ""}</span>
              {vehicle.color && (
                <span className="inline-flex items-center gap-1">
                  <span
                    className="inline-block w-3 h-3 rounded-full border border-[var(--border-default)]"
                    style={{ backgroundColor: colorHex }}
                  />
                  {vehicle.color}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="md" onClick={() => setEditOpen(true)}>
          Edit
        </Button>
        <Button variant="destructive" size="md" onClick={() => setDeleteOpen(true)}>
          Delete
        </Button>
      </div>

      {/* Vehicle Details Card */}
      <div className="surface-card p-5">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
          <Car size={14} className="text-[var(--text-tertiary)]" />
          Vehicle Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <Field label="License Plate" value={vehicle.licensePlate} />
          <Field label="Type">
            <Badge tone={typeCfg.tone}>{typeCfg.label}</Badge>
          </Field>
          <Field label="Make" value={vehicle.make} />
          <Field label="Model" value={vehicle.model} />
          <Field label="Year" value={vehicle.year ? String(vehicle.year) : null} />
          <Field label="Color">
            {vehicle.color ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-full border border-[var(--border-default)]"
                  style={{ backgroundColor: colorHex }}
                />
                {vehicle.color}
              </span>
            ) : (
              "-"
            )}
          </Field>
          <Field label="VIN" value={vehicle.vin} />
          <Field label="Registration State" value={vehicle.licenseState} />
        </div>
      </div>

      {/* Owner Card */}
      <div className="surface-card p-5">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
          <User size={14} className="text-[var(--text-tertiary)]" />
          Owner
          {vehicle.ownerType && <Badge tone={ownerCfg.tone}>{ownerCfg.label}</Badge>}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <Field label="Owner Type" value={vehicle.ownerType} />
          <Field label="Owner ID" value={vehicle.ownerId} />
        </div>
      </div>

      {/* Notes */}
      <div className="surface-card p-5">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
          <StickyNote size={14} className="text-[var(--text-tertiary)]" />
          Notes
        </h3>
        {vehicle.notes ? (
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            {vehicle.notes}
          </p>
        ) : (
          <p className="text-[13px] text-[var(--text-tertiary)] italic">
            No notes for this vehicle.
          </p>
        )}
      </div>

      {/* Linked Incidents */}
      <div>
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
          <FileText size={14} className="text-[var(--text-tertiary)]" />
          Linked Incidents
        </h3>
        {incidents.length > 0 ? (
          <div className="space-y-2">
            {incidents.map((inc) => (
              <Link key={inc.id} href={`/incidents/${inc.id}`}>
                <div className="surface-card p-4 flex items-center justify-between hover:border-[var(--border-hover)] transition-all duration-150 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center">
                      <FileText size={14} className="text-[var(--text-tertiary)]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[var(--text-primary)] group-hover:text-[var(--action-primary)] transition-colors">
                        {inc.recordNumber}
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{inc.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-[var(--text-tertiary)]">{inc.date}</span>
                    <StatusBadge status={inc.status} dot />
                    <ExternalLink size={12} className="text-[var(--text-tertiary)]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="surface-card p-8 text-center">
            <FileText size={24} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
            <p className="text-[13px] text-[var(--text-tertiary)]">No linked incidents</p>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <EditVehicleModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={async () => {
          toast("Vehicle updated successfully", { variant: "success" });
          setEditOpen(false);
        }}
        vehicle={{
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year ? String(vehicle.year) : "",
          color: vehicle.color ?? "",
          licensePlate: vehicle.licensePlate ?? "",
          licenseState: vehicle.licenseState ?? "",
          vin: vehicle.vin ?? "",
          vehicleType: vehicle.vehicleType,
          ownerType: vehicle.ownerType ?? "",
          ownerId: vehicle.ownerId ?? "",
          notes: vehicle.notes ?? "",
        }}
      />
      <DeleteVehicleModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          toast("Vehicle deleted successfully", { variant: "success" });
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
