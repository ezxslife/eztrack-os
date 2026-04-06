"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface AddCaseFinancialModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FinancialFormData) => void | Promise<void>;
}

interface FinancialFormData {
  category: string;
  type: string;
  amount: string;
  description: string;
}

const CATEGORY_OPTIONS = [
  { value: "incidental", label: "Incidental" },
  { value: "time", label: "Time" },
  { value: "savings", label: "Savings" },
  { value: "losses", label: "Losses" },
];

export function AddCaseFinancialModal({
  open,
  onClose,
  onSubmit,
}: AddCaseFinancialModalProps) {
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = category !== "" && type.trim() !== "" && amount.trim() !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ category, type, amount, description });
      setCategory("");
      setType("");
      setAmount("");
      setDescription("");
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
      title="Add Financial Entry"
      subtitle="Record a financial item for this case"
      size="sm"
      submitLabel="Add Entry"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Select
        label="Category"
        options={CATEGORY_OPTIONS}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Select category..."
      />

      <Input
        label="Type"
        placeholder="e.g., Overtime, Equipment, Travel"
        value={type}
        onChange={(e) => setType(e.target.value)}
      />

      <Input
        label="Amount"
        type="number"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <Textarea
        label="Description"
        placeholder="Additional details..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
    </FormModal>
  );
}
