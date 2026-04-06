"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";

interface ClaimReleaseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    claimantName: string;
    idVerified: boolean;
    releaseMethod: string;
    releaseNotes: string;
    signatureConfirmed: boolean;
  }) => void | Promise<void>;
}

const RELEASE_METHOD_OPTIONS = [
  { value: "in-person", label: "In Person" },
  { value: "shipping", label: "Shipping" },
];

export function ClaimReleaseModal({
  open,
  onClose,
  onSubmit,
}: ClaimReleaseModalProps) {
  const [claimantName, setClaimantName] = useState("");
  const [idVerified, setIdVerified] = useState(false);
  const [releaseMethod, setReleaseMethod] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = claimantName.trim().length > 0 && releaseMethod !== "";

  const resetForm = () => {
    setClaimantName("");
    setIdVerified(false);
    setReleaseMethod("");
    setReleaseNotes("");
    setSignatureConfirmed(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        claimantName: claimantName.trim(),
        idVerified,
        releaseMethod,
        releaseNotes: releaseNotes.trim(),
        signatureConfirmed,
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
      title="Release Item to Claimant"
      size="md"
      submitLabel="Release Item"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Claimant Name"
        placeholder="Full name of the claimant"
        value={claimantName}
        onChange={(e) => setClaimantName(e.target.value)}
      />

      <Toggle
        label="ID Verified"
        checked={idVerified}
        onChange={setIdVerified}
      />

      <Select
        label="Release Method"
        options={RELEASE_METHOD_OPTIONS}
        value={releaseMethod}
        onChange={(e) => setReleaseMethod(e.target.value)}
        placeholder="Select release method"
      />

      <Textarea
        label="Release Notes"
        placeholder="Any notes about the release..."
        value={releaseNotes}
        onChange={(e) => setReleaseNotes(e.target.value)}
        rows={2}
      />

      <Toggle
        label="Signature Confirmed"
        checked={signatureConfirmed}
        onChange={setSignatureConfirmed}
      />
    </FormModal>
  );
}
