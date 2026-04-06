"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    visitorSearch: string;
    badgeNumber: string;
    parkingSpot: string;
    notes: string;
  }) => void | Promise<void>;
}

export function SignInModal({
  open,
  onClose,
  onSubmit,
}: SignInModalProps) {
  const [visitorSearch, setVisitorSearch] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [parkingSpot, setParkingSpot] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid =
    visitorSearch.trim().length > 0 && badgeNumber.trim().length > 0;

  const resetForm = () => {
    setVisitorSearch("");
    setBadgeNumber("");
    setParkingSpot("");
    setNotes("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        visitorSearch: visitorSearch.trim(),
        badgeNumber: badgeNumber.trim(),
        parkingSpot: parkingSpot.trim(),
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
      title="Sign In Visitor"
      size="sm"
      submitLabel="Sign In"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Visitor"
        placeholder="Search by name or company..."
        value={visitorSearch}
        onChange={(e) => setVisitorSearch(e.target.value)}
      />

      <Input
        label="Badge Number"
        placeholder="Assign a badge number"
        value={badgeNumber}
        onChange={(e) => setBadgeNumber(e.target.value)}
      />

      <Input
        label="Parking Spot (Optional)"
        placeholder="e.g., Lot A - Space 12"
        value={parkingSpot}
        onChange={(e) => setParkingSpot(e.target.value)}
      />

      <Textarea
        label="Notes (Optional)"
        placeholder="Additional notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
    </FormModal>
  );
}
