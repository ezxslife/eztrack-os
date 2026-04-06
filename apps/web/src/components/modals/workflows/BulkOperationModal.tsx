"use client";

import { useState } from "react";
import clsx from "clsx";
import { AlertTriangle } from "lucide-react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";

interface BulkOperationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: BulkOperationData) => void | Promise<void>;
  operation: "delete" | "assign" | "status_change" | "export" | "archive";
  selectedCount: number;
  selectedItems: Array<{ id: string; title: string }>;
  entityType: string;
}

interface BulkOperationData {
  reason?: string;
  assignee?: string;
  status?: string;
  format?: string;
}

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

const OFFICER_OPTIONS = [
  { value: "officer-001", label: "Officer John Smith" },
  { value: "officer-002", label: "Officer Jane Doe" },
  { value: "officer-003", label: "Officer Mike Johnson" },
  { value: "officer-004", label: "Officer Sarah Williams" },
];

const EXPORT_FORMAT_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
  { value: "excel", label: "Excel" },
];

export function BulkOperationModal({
  open,
  onClose,
  onConfirm,
  operation,
  selectedCount,
  selectedItems,
  entityType,
}: BulkOperationModalProps) {
  const [reason, setReason] = useState("");
  const [assignee, setAssignee] = useState("");
  const [status, setStatus] = useState("");
  const [format, setFormat] = useState("pdf");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDestructive = operation === "delete" || operation === "archive";
  const isValid =
    (operation === "delete" && reason.trim()) ||
    (operation === "assign" && assignee) ||
    (operation === "status_change" && status) ||
    (operation === "export") ||
    (operation === "archive" && reason.trim());

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const data: BulkOperationData = {};
      if (operation === "delete" || operation === "archive") {
        data.reason = reason;
      } else if (operation === "assign") {
        data.assignee = assignee;
      } else if (operation === "status_change") {
        data.status = status;
        data.reason = reason;
      } else if (operation === "export") {
        data.format = format;
      }

      await onConfirm(data);
      handleReset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setReason("");
    setAssignee("");
    setStatus("");
    setFormat("pdf");
  };

  const getTitle = () => {
    switch (operation) {
      case "delete":
        return "Delete Records";
      case "assign":
        return "Assign Records";
      case "status_change":
        return "Change Status";
      case "export":
        return "Export Records";
      case "archive":
        return "Archive Records";
      default:
        return "Bulk Operation";
    }
  };

  const getDescription = () => {
    return `This will affect ${selectedCount} ${entityType}${selectedCount > 1 ? "s" : ""}`;
  };

  return (
    <Modal open={open} onClose={onClose} size="md">
      <ModalHeader onClose={onClose}>{getTitle()}</ModalHeader>

      <ModalContent className="space-y-4">
        {/* Impact Summary */}
        <div
          className={clsx(
            "p-3 rounded-lg border",
            isDestructive
              ? "bg-[var(--status-critical-surface)] border-[var(--status-critical-border)]"
              : "bg-[var(--status-info-surface)] border-[var(--status-info-border)]"
          )}
        >
          <div className="flex items-start gap-2">
            {isDestructive && (
              <AlertTriangle
                size={16}
                className="text-[var(--status-critical)] shrink-0 mt-0.5"
              />
            )}
            <p
              className={clsx(
                "text-[12px] font-medium",
                isDestructive
                  ? "text-[var(--status-critical)]"
                  : "text-[var(--status-info)]"
              )}
            >
              {getDescription()}
            </p>
          </div>
        </div>

        {/* Selected Items List */}
        <div>
          <p className="text-[12px] font-medium text-[var(--text-secondary)] mb-2">
            Selected Items
          </p>
          <div
            className="max-h-[200px] overflow-y-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)]"
          >
            <div className="divide-y divide-[var(--border-default)]">
              {selectedItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="px-3 py-2 text-[12px] text-[var(--text-primary)]"
                >
                  {item.title}
                </div>
              ))}
              {selectedItems.length > 5 && (
                <div className="px-3 py-2 text-[12px] text-[var(--text-tertiary)] italic">
                  +{selectedItems.length - 5} more
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Operation-specific form content */}
        {(operation === "delete" || operation === "archive") && (
          <Textarea
            label={
              operation === "delete"
                ? "Reason for Deletion"
                : "Reason for Archival"
            }
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Provide reason for ${operation}`}
            rows={2}
            required
          />
        )}

        {operation === "assign" && (
          <Select
            label="Assign To"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            options={OFFICER_OPTIONS}
            placeholder="Select officer"
            required
          />
        )}

        {operation === "status_change" && (
          <>
            <Select
              label="New Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={STATUS_OPTIONS}
              placeholder="Select status"
              required
            />
            <Textarea
              label="Reason (Optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide context for status change"
              rows={2}
            />
          </>
        )}

        {operation === "export" && (
          <Select
            label="Export Format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            options={EXPORT_FORMAT_OPTIONS}
          />
        )}
      </ModalContent>

      <ModalFooter>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant={isDestructive ? "destructive" : "default"}
          size="sm"
          onClick={handleConfirm}
          isLoading={isSubmitting}
          disabled={!isValid || isSubmitting}
        >
          {operation === "export" ? "Export" : "Confirm"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
