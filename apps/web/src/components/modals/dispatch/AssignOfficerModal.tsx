"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import clsx from "clsx";

interface AssignOfficerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (officerId: string) => void | Promise<void>;
}

interface MockOfficer {
  id: string;
  name: string;
  badge: string;
  status: "available" | "on-scene" | "en-route" | "on-break";
}

const STATUS_DOTS: Record<MockOfficer["status"], { color: string; label: string }> = {
  available: { color: "bg-green-500", label: "Available" },
  "on-scene": { color: "bg-blue-500", label: "On Scene" },
  "en-route": { color: "bg-yellow-500", label: "En Route" },
  "on-break": { color: "bg-gray-400", label: "On Break" },
};

const MOCK_OFFICERS: MockOfficer[] = [
  { id: "off-1", name: "Officer J. Martinez", badge: "#1042", status: "available" },
  { id: "off-2", name: "Officer R. Chen", badge: "#1088", status: "on-scene" },
  { id: "off-3", name: "Officer L. Thompson", badge: "#1015", status: "en-route" },
  { id: "off-4", name: "Officer K. Williams", badge: "#1063", status: "on-break" },
];

export function AssignOfficerModal({
  open,
  onClose,
  onSubmit,
}: AssignOfficerModalProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = MOCK_OFFICERS.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.badge.includes(search)
  );

  const handleSubmit = async () => {
    if (!selectedId) return;
    setIsSubmitting(true);
    try {
      await onSubmit(selectedId);
      setSearch("");
      setSelectedId(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Assign Officer"
      size="sm"
      submitLabel="Assign"
      isSubmitting={isSubmitting}
      isValid={selectedId !== null}
    >
      <Input
        label="Search Officers"
        placeholder="Name or badge number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-1">
        {filtered.map((officer) => {
          const dot = STATUS_DOTS[officer.status];
          const isSelected = selectedId === officer.id;

          return (
            <button
              key={officer.id}
              type="button"
              onClick={() => setSelectedId(officer.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer",
                isSelected
                  ? "bg-[var(--eztrack-primary-500,#6366f1)]/10 border border-[var(--eztrack-primary-500,#6366f1)]/30"
                  : "hover:bg-[var(--surface-hover)] border border-transparent"
              )}
            >
              <span
                className={clsx("h-2 w-2 rounded-full shrink-0", dot.color)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                  {officer.name}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  {officer.badge} &middot; {dot.label}
                </p>
              </div>
              {isSelected && (
                <span className="text-[11px] font-medium text-[var(--eztrack-primary-500,#6366f1)]">
                  Selected
                </span>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-[12px] text-[var(--text-tertiary)] text-center py-4">
            No officers match your search.
          </p>
        )}
      </div>
    </FormModal>
  );
}
