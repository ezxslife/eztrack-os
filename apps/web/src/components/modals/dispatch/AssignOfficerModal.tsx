"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { SelectionTile } from "@/components/ui/SelectionTile";

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
            <SelectionTile
              key={officer.id}
              onClick={() => setSelectedId(officer.id)}
              selected={isSelected}
              selectedLabel="Selected"
              title={officer.name}
              description={`${officer.badge} · ${dot.label}`}
              leading={<span className={`mt-1 h-2.5 w-2.5 rounded-full ${dot.color}`} />}
            />
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
