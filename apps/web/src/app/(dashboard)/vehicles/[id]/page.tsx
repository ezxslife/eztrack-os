"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Car,
  User,
  FileText,
  StickyNote,
  ExternalLink,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/Badge";
import { EditVehicleModal, DeleteVehicleModal } from "@/components/modals/vehicles";

/* ── Vehicle type config ── */
type VehicleType = "car" | "truck" | "van" | "motorcycle";

const TYPE_CONFIG: Record<
  VehicleType,
  { label: string; tone: "info" | "default" | "warning" | "attention" }
> = {
  car: { label: "Car", tone: "info" },
  truck: { label: "Truck", tone: "default" },
  van: { label: "Van", tone: "warning" },
  motorcycle: { label: "Motorcycle", tone: "attention" },
};

/* ── Owner type config ── */
type OwnerType = "patron" | "staff" | "contact" | "event";

const OWNER_TYPE_CONFIG: Record<
  OwnerType,
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
};

/* ── Mock data ── */
interface VehicleDetail {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  type: VehicleType;
  vin: string;
  registrationState: string;
  ownerName: string;
  ownerType: OwnerType;
  ownerPhone: string;
  ownerEmail: string;
  ownerOrganization: string;
  notes: string;
}

interface LinkedIncident {
  number: string;
  type: string;
  date: string;
  status: string;
}

const MOCK_VEHICLES: Record<string, VehicleDetail> = {
  "1": {
    id: "1",
    plate: "7ABC123",
    make: "Toyota",
    model: "Camry",
    year: 2024,
    color: "White",
    type: "car",
    vin: "4T1BF1FK5EU123456",
    registrationState: "California",
    ownerName: "Marcus Johnson",
    ownerType: "patron",
    ownerPhone: "(555) 234-8901",
    ownerEmail: "m.johnson@email.com",
    ownerOrganization: "",
    notes: "Vehicle was found parked in a restricted zone near the south gate on Apr 4. Owner was contacted and moved the vehicle. No citation issued.",
  },
  "2": {
    id: "2",
    plate: "5XYZ789",
    make: "Ford",
    model: "F-150",
    year: 2022,
    color: "Black",
    type: "truck",
    vin: "1FTFW1E50NFA78901",
    registrationState: "California",
    ownerName: "Site Operations",
    ownerType: "event",
    ownerPhone: "(555) 100-0001",
    ownerEmail: "ops@eventco.com",
    ownerOrganization: "Event Co.",
    notes: "Event operations truck. Authorized for backstage and loading dock access.",
  },
  "3": {
    id: "3",
    plate: "3DEF456",
    make: "Mercedes",
    model: "Sprinter",
    year: 2023,
    color: "Silver",
    type: "van",
    vin: "W1Y4ECHY1PP234567",
    registrationState: "Nevada",
    ownerName: "Dana Mitchell",
    ownerType: "contact",
    ownerPhone: "(555) 234-5678",
    ownerEmail: "dana@apexsound.com",
    ownerOrganization: "Apex Sound & Staging",
    notes: "Vendor delivery van. Pre-approved for vendor lot access during load-in and load-out windows.",
  },
  "4": {
    id: "4",
    plate: "9GHI012",
    make: "Harley-Davidson",
    model: "Street Glide",
    year: 2021,
    color: "Red",
    type: "motorcycle",
    vin: "1HD1KTP17MB654321",
    registrationState: "California",
    ownerName: "Officer Rivera",
    ownerType: "staff",
    ownerPhone: "(555) 300-4567",
    ownerEmail: "rivera@security.com",
    ownerOrganization: "On-site Security",
    notes: "Staff personal vehicle. Parked in staff lot B.",
  },
  "5": {
    id: "5",
    plate: "2JKL345",
    make: "Honda",
    model: "Civic",
    year: 2023,
    color: "Blue",
    type: "car",
    vin: "2HGFC2F53PH345678",
    registrationState: "Oregon",
    ownerName: "Sarah Chen",
    ownerType: "patron",
    ownerPhone: "(555) 876-5432",
    ownerEmail: "s.chen@email.com",
    ownerOrganization: "",
    notes: "VIP patron vehicle. Assigned VIP parking spot #12.",
  },
};

const MOCK_INCIDENTS: Record<string, LinkedIncident[]> = {
  "1": [
    { number: "INC-0055", type: "Parking Violation", date: "Apr 4, 2026", status: "closed" },
  ],
};

/* ── Field helper ── */
function Field({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
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

  const vehicle = MOCK_VEHICLES[id] ?? {
    id,
    plate: "UNKNOWN",
    make: "Unknown",
    model: "Unknown",
    year: 0,
    color: "Gray",
    type: "car" as VehicleType,
    vin: "-",
    registrationState: "-",
    ownerName: "Unknown",
    ownerType: "patron" as OwnerType,
    ownerPhone: "-",
    ownerEmail: "-",
    ownerOrganization: "",
    notes: "",
  };

  const typeCfg = TYPE_CONFIG[vehicle.type];
  const ownerCfg = OWNER_TYPE_CONFIG[vehicle.ownerType];
  const colorHex = COLOR_MAP[vehicle.color] ?? "#6b7280";
  const incidents = MOCK_INCIDENTS[id] ?? [];

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
                {vehicle.plate}
              </h1>
              <Badge tone={typeCfg.tone} dot>
                {typeCfg.label}
              </Badge>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[13px] text-[var(--text-tertiary)]">
              <span>{vehicle.make} {vehicle.model} {vehicle.year}</span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-block w-3 h-3 rounded-full border border-[var(--border-default)]"
                  style={{ backgroundColor: colorHex }}
                />
                {vehicle.color}
              </span>
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
          <Field label="License Plate" value={vehicle.plate} />
          <Field label="Type">
            <Badge tone={typeCfg.tone}>{typeCfg.label}</Badge>
          </Field>
          <Field label="Make" value={vehicle.make} />
          <Field label="Model" value={vehicle.model} />
          <Field label="Year" value={String(vehicle.year)} />
          <Field label="Color">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full border border-[var(--border-default)]"
                style={{ backgroundColor: colorHex }}
              />
              {vehicle.color}
            </span>
          </Field>
          <Field label="VIN" value={vehicle.vin} />
          <Field label="Registration State" value={vehicle.registrationState} />
        </div>
      </div>

      {/* Owner Card */}
      <div className="surface-card p-5">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
          <User size={14} className="text-[var(--text-tertiary)]" />
          Owner
          <Badge tone={ownerCfg.tone}>{ownerCfg.label}</Badge>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <Field label="Name" value={vehicle.ownerName} />
          {vehicle.ownerOrganization && (
            <Field label="Organization">
              <span className="inline-flex items-center gap-1">
                <Building2 size={12} className="text-[var(--text-tertiary)]" />
                {vehicle.ownerOrganization}
              </span>
            </Field>
          )}
          <Field label="Phone">
            <a href={`tel:${vehicle.ownerPhone}`} className="text-[var(--action-primary)] hover:underline">
              {vehicle.ownerPhone}
            </a>
          </Field>
          <Field label="Email">
            <a href={`mailto:${vehicle.ownerEmail}`} className="text-[var(--action-primary)] hover:underline">
              {vehicle.ownerEmail}
            </a>
          </Field>
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
              <Link key={inc.number} href={`/incidents`}>
                <div className="surface-card p-4 flex items-center justify-between hover:border-[var(--border-hover)] transition-all duration-150 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center">
                      <FileText size={14} className="text-[var(--text-tertiary)]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[var(--text-primary)] group-hover:text-[var(--action-primary)] transition-colors">
                        {inc.number}
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
        onSubmit={async (data) => {
          console.log("Edit vehicle:", data);
          setEditOpen(false);
        }}
        vehicle={{
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          licensePlate: vehicle.plate,
          licenseState: vehicle.registrationState,
          vin: vehicle.vin,
          vehicleType: vehicle.type,
          ownerType: vehicle.ownerType,
          ownerId: "",
          notes: vehicle.notes,
        }}
      />
      <DeleteVehicleModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          console.log("Delete vehicle:", id);
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
