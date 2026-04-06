"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeleteIncidentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  incidentNumber?: string;
  isLoading?: boolean;
}

export function DeleteIncidentModal({
  open,
  onClose,
  onConfirm,
  incidentNumber,
  isLoading,
}: DeleteIncidentModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={
        incidentNumber
          ? `Delete Incident ${incidentNumber}`
          : "Delete Incident"
      }
      description="This action cannot be undone. The incident and all associated records will be permanently deleted."
      confirmLabel="Delete Incident"
      variant="destructive"
      isLoading={isLoading}
    />
  );
}
