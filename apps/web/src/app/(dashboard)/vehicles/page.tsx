"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  MoreHorizontal,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreateVehicleModal } from "@/components/modals/vehicles";

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

const TYPE_FILTERS: { value: VehicleType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "car", label: "Car" },
  { value: "truck", label: "Truck" },
  { value: "van", label: "Van" },
  { value: "motorcycle", label: "Motorcycle" },
];

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

/* ── Color dot ── */
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
interface Vehicle {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  type: VehicleType;
  ownerName: string;
  ownerType: OwnerType;
}

const MOCK_VEHICLES: Vehicle[] = [
  { id: "1", plate: "7ABC123", make: "Toyota", model: "Camry", year: 2024, color: "White", type: "car", ownerName: "Marcus Johnson", ownerType: "patron" },
  { id: "2", plate: "5XYZ789", make: "Ford", model: "F-150", year: 2022, color: "Black", type: "truck", ownerName: "Site Operations", ownerType: "event" },
  { id: "3", plate: "3DEF456", make: "Mercedes", model: "Sprinter", year: 2023, color: "Silver", type: "van", ownerName: "Apex Sound & Staging", ownerType: "contact" },
  { id: "4", plate: "9GHI012", make: "Harley-Davidson", model: "Street Glide", year: 2021, color: "Red", type: "motorcycle", ownerName: "Officer Rivera", ownerType: "staff" },
  { id: "5", plate: "2JKL345", make: "Honda", model: "Civic", year: 2023, color: "Blue", type: "car", ownerName: "Sarah Chen", ownerType: "patron" },
];

export default function VehiclesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<VehicleType | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_VEHICLES.filter((v) => {
      const matchesSearch =
        !search ||
        v.plate.toLowerCase().includes(search.toLowerCase()) ||
        `${v.make} ${v.model}`.toLowerCase().includes(search.toLowerCase()) ||
        v.ownerName.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || v.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [search, typeFilter]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Vehicles
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">
            Vehicle registry and tracking
          </p>
        </div>
        <Button variant="default" size="md" onClick={() => setCreateOpen(true)}>
          <Plus size={14} />
          Add Vehicle
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by plate, make/model, or owner..."
          className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {TYPE_FILTERS.map((f) => {
          const isActive = typeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium border transition-all duration-150 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[var(--action-primary)] text-white border-[var(--action-primary)]"
                  : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-[12px] text-[var(--text-tertiary)]">
        {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                License Plate
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Make / Model / Year
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden sm:table-cell">
                Color
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Type
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden md:table-cell">
                Owner
              </th>
              <th className="text-right px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((vehicle) => {
              const typeCfg = TYPE_CONFIG[vehicle.type];
              const ownerCfg = OWNER_TYPE_CONFIG[vehicle.ownerType];
              const colorHex = COLOR_MAP[vehicle.color] ?? "#6b7280";
              return (
                <Link
                  key={vehicle.id}
                  href={`/vehicles/${vehicle.id}`}
                  className="contents"
                >
                  <tr className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
                          <Car size={14} className="text-[var(--text-tertiary)]" />
                        </div>
                        <span className="font-mono font-semibold text-[var(--text-primary)]">
                          {vehicle.plate}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                      {vehicle.make} {vehicle.model} {vehicle.year}
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <span
                          className="inline-block w-3 h-3 rounded-full border border-[var(--border-default)] shrink-0"
                          style={{ backgroundColor: colorHex }}
                        />
                        {vehicle.color}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={typeCfg.tone}>
                        {typeCfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[var(--text-secondary)]">{vehicle.ownerName}</span>
                        <Badge tone={ownerCfg.tone}>
                          {ownerCfg.label}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={(e) => e.preventDefault()}
                        className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                </Link>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="surface-card p-8 text-center">
          <p className="text-[13px] text-[var(--text-tertiary)]">
            No vehicles match your search or filter.
          </p>
        </div>
      )}

      {/* ── Modals ── */}
      <CreateVehicleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (data) => {
          console.log("Create vehicle:", data);
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
