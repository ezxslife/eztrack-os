"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface ClaimItemModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    claimantName: string;
    claimantPhone: string;
    claimantEmail: string;
    identificationProvided: string;
    proofDescription: string;
    notes: string;
  }) => void | Promise<void>;
}

const ID_OPTIONS = [
  { value: "drivers_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "student_id", label: "Student ID" },
  { value: "other", label: "Other" },
];

export function ClaimItemModal({
  open,
  onClose,
  onSubmit,
}: ClaimItemModalProps) {
  const [claimantName, setClaimantName] = useState("");
  const [claimantPhone, setClaimantPhone] = useState("");
  const [claimantEmail, setClaimantEmail] = useState("");
  const [identificationProvided, setIdentificationProvided] = useState("");
  const [proofDescription, setProofDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid =
    claimantName.trim().length > 0 &&
    identificationProvided !== "" &&
    proofDescription.trim().length > 0;

  const resetForm = () => {
    setClaimantName("");
    setClaimantPhone("");
    setClaimantEmail("");
    setIdentificationProvided("");
    setProofDescription("");
    setNotes("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        claimantName: claimantName.trim(),
        claimantPhone: claimantPhone.trim(),
        claimantEmail: claimantEmail.trim(),
        identificationProvided,
        proofDescription: proofDescription.trim(),
        notes: notes.trim(),
      });
      resetForm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Process Claim"
      size="md"
      submitLabel="Process Claim"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Claimant Name"
        placeholder="Full name of the claimant"
        value={claimantName}
        onChange={(e) => setClaimantName(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Phone"
          placeholder="+1 (555) 000-0000"
          type="tel"
          value={claimantPhone}
          onChange={(e) => setClaimantPhone(e.target.value)}
        />
        <Input
          label="Email"
          placeholder="email@example.com"
          type="email"
          value={claimantEmail}
          onChange={(e) => setClaimantEmail(e.target.value)}
        />
      </div>

      <Select
        label="Identification Provided"
        options={ID_OPTIONS}
        value={identificationProvided}
        onChange={(e) => setIdentificationProvided(e.target.value)}
        placeholder="Select ID type"
      />

      <Textarea
        label="Proof of Ownership"
        placeholder="Describe how the claimant proves ownership of the item..."
        value={proofDescription}
        onChange={(e) => setProofDescription(e.target.value)}
        rows={3}
      />

      <Textarea
        label="Notes"
        placeholder="Additional notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
    </FormModal>
  );
}
