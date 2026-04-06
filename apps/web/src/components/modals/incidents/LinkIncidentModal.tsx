"use client";

import { useState } from "react";
import { Search, FileText, Clock, ArrowRight } from "lucide-react";
import clsx from "clsx";
import { FormModal } from "@/components/modals/FormModal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

const RELATIONSHIP_OPTIONS = [
  { value: "related", label: "Related" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "duplicate", label: "Duplicate" },
];

interface MockResult {
  id: string;
  number: string;
  title: string;
  status: string;
  date: string;
}

const MOCK_RESULTS: MockResult[] = [
  {
    id: "1",
    number: "INC-2024-0412",
    title: "Unauthorized access attempt - West Entrance",
    status: "Open",
    date: "2024-12-15",
  },
  {
    id: "2",
    number: "INC-2024-0398",
    title: "Suspicious package found in lobby",
    status: "Under Investigation",
    date: "2024-12-10",
  },
  {
    id: "3",
    number: "INC-2024-0385",
    title: "CCTV equipment malfunction - Zone B",
    status: "Resolved",
    date: "2024-12-08",
  },
];

interface LinkIncidentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    linkedIncidentId: string;
    relationship: string;
    notes: string;
  }) => void | Promise<void>;
}

export function LinkIncidentModal({
  open,
  onClose,
  onSubmit,
}: LinkIncidentModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [relationship, setRelationship] = useState("related");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = selectedId.length > 0;

  const filteredResults = searchQuery.trim()
    ? MOCK_RESULTS.filter(
        (r) =>
          r.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : MOCK_RESULTS;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        linkedIncidentId: selectedId,
        relationship,
        notes: notes.trim(),
      });
      handleReset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedId("");
    setRelationship("related");
    setNotes("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Link Incident"
      subtitle="Create a relationship between incidents"
      size="md"
      submitLabel="Link"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search by incident number or title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        />
      </div>

      {/* Search results list */}
      <div className="border border-[var(--border-default)] rounded-xl overflow-hidden divide-y divide-[var(--border-default)]">
        {filteredResults.map((result) => (
          <button
            key={result.id}
            type="button"
            onClick={() => setSelectedId(result.id)}
            className={clsx(
              "w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors",
              selectedId === result.id
                ? "bg-[var(--eztrack-primary-500,#6366f1)]/5"
                : "hover:bg-[var(--surface-secondary)]"
            )}
          >
            <div
              className={clsx(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                selectedId === result.id
                  ? "bg-[var(--eztrack-primary-500,#6366f1)] text-white"
                  : "bg-[var(--surface-tertiary)] text-[var(--text-tertiary)]"
              )}
            >
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-[var(--text-primary)]">
                  {result.number}
                </p>
                <span
                  className={clsx(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    result.status === "Open" &&
                      "bg-blue-500/10 text-blue-600",
                    result.status === "Under Investigation" &&
                      "bg-yellow-500/10 text-yellow-600",
                    result.status === "Resolved" &&
                      "bg-green-500/10 text-green-600"
                  )}
                >
                  {result.status}
                </span>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] truncate mt-0.5">
                {result.title}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--text-tertiary)]">
                <Clock className="h-3 w-3" />
                <span>{result.date}</span>
              </div>
            </div>
            {selectedId === result.id && (
              <ArrowRight className="h-4 w-4 text-[var(--eztrack-primary-500,#6366f1)] mt-1 shrink-0" />
            )}
          </button>
        ))}
      </div>

      <Select
        label="Relationship Type"
        options={RELATIONSHIP_OPTIONS}
        value={relationship}
        onChange={(e) => setRelationship(e.target.value)}
      />

      <Textarea
        label="Notes (optional)"
        placeholder="Describe the relationship between these incidents..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />
    </FormModal>
  );
}
