"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { addFinancialEntrySchema, type AddFinancialEntryValues } from "@/lib/validations/incidents";

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
    kind: string;
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
  const form = useFormState({
    initialValues: {
      kind: "loss",
      type: "property_damage",
      amount: "",
      description: "",
    },
    schema: addFinancialEntrySchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        kind: form.values.kind,
        type: form.values.type,
        amount: parseFloat(form.values.amount),
        description: form.values.description ?? "",
      });
      form.reset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
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
      isValid={form.isValid}
    >
      {/* Loss / Saving radio group */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">
          Entry Type
        </label>
        <SegmentedControl
          ariaLabel="Financial entry type"
          stretch
          value={form.values.kind}
          onChange={(value) => form.setValue("kind", value)}
          options={[
            { value: "loss", label: "Loss" },
            { value: "saving", label: "Saving" },
          ]}
        />
      </div>

      <Select
        label="Category"
        options={TYPE_OPTIONS}
        value={form.values.type}
        onChange={(e) => form.setValue("type", e.target.value)}
        error={form.touched.type ? form.errors.type : undefined}
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
            value={form.values.amount}
            onChange={(e) => form.setValue("amount", e.target.value)}
            className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-7 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          />
        </div>
        {form.touched.amount && form.errors.amount && (
          <p className="text-[11px] text-red-500 mt-1">{form.errors.amount}</p>
        )}
      </div>

      <Textarea
        label="Description"
        placeholder="Describe this financial entry..."
        value={form.values.description}
        onChange={(e) => form.setValue("description", e.target.value)}
        rows={3}
      />
    </FormModal>
  );
}
