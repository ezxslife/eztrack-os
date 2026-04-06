"use client";

import { useState } from "react";
import clsx from "clsx";
import { FormModal } from "@/components/modals/FormModal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

type EntryKind = "loss" | "saving";

const TYPE_OPTIONS = [
  { value: "property_damage", label: "Property Damage" },
  { value: "theft", label: "Theft" },
  { value: "medical_cost", label: "Medical Cost" },
  { value: "liability", label: "Liability" },
  { value: "recovery", label: "Recovery" },
  { value: "prevention", label: "Prevention" },
  { value: "restitution", label: "Restitution" },
];

interface AddFinancialEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    kind: EntryKind;
    type: string;
    amount: number;
    description: string;
  }) => void | Promise<void>;
}

export function AddFinancialEntryModal({
  open,
  onClose,
  onSubmit,
}: AddFinancialEntryModalProps) {
  const [kind, setKind] = useState<EntryKind>("loss");
  const [type, setType] = useState("property_damage");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = parseFloat(amount) > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        kind,
        type,
        amount: parseFloat(amount),
        description: description.trim(),
      });
      handleReset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setKind("loss");
    setType("property_damage");
    setAmount("");
    setDescription("");
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
      title="Add Financial Entry"
      size="sm"
      submitLabel="Add Entry"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      {/* Loss / Saving radio group */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">
          Entry Type
        </label>
        <div className="flex gap-2">
          {(["loss", "saving"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setKind(option)}
              className={clsx(
                "flex-1 py-2 rounded-lg border text-[13px] font-medium transition-all duration-150",
                kind === option
                  ? option === "loss"
                    ? "border-red-500 bg-red-500/10 text-red-600"
                    : "border-green-500 bg-green-500/10 text-green-600"
                  : "border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
              )}
            >
              {option === "loss" ? "Loss" : "Saving"}
            </button>
          ))}
        </div>
      </div>

      <Select
        label="Category"
        options={TYPE_OPTIONS}
        value={type}
        onChange={(e) => setType(e.target.value)}
      />

      {/* Amount with $ prefix */}
      <div className="w-full">
        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--text-tertiary)]">
            $
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-7 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          />
        </div>
      </div>

      <Textarea
        label="Description"
        placeholder="Describe this financial entry..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
    </FormModal>
  );
}
