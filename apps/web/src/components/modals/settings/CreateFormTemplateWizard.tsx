"use client";

import { useEffect, useState } from "react";
import { WizardModal } from "@/components/modals/WizardModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";

interface FormField {
  id: string;
  label: string;
  fieldType: string;
  required: boolean;
}

interface FormTemplateData {
  name: string;
  description: string;
  autoAttachTypes: string;
  fields: FormField[];
}

interface CreateFormTemplateWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormTemplateData) => void | Promise<void>;
  incidentTypes?: { value: string; label: string }[];
  initialData?: Partial<FormTemplateData> | null;
  title?: string;
  submitLabel?: string;
}

const WIZARD_STEPS = [
  { id: "basics", label: "Basics" },
  { id: "fields", label: "Add Fields" },
  { id: "review", label: "Review" },
];

const FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "checkbox", label: "Checkbox" },
  { value: "signature", label: "Signature" },
];

export function CreateFormTemplateWizard({
  open,
  onClose,
  onSubmit,
  incidentTypes = [],
  initialData = null,
  title = "Create Form Template",
  submitLabel = "Create Template",
}: CreateFormTemplateWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [autoAttachTypes, setAutoAttachTypes] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);

  // Field builder state
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState("");
  const [fieldRequired, setFieldRequired] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentIndex(0);
    setName(initialData?.name ?? "");
    setDescription(initialData?.description ?? "");
    setAutoAttachTypes(initialData?.autoAttachTypes ?? "");
    setFields(initialData?.fields ?? []);
    setFieldLabel("");
    setFieldType("");
    setFieldRequired(false);
  }, [open, initialData]);

  const isStepValid = (): boolean => {
    switch (currentIndex) {
      case 0:
        return name.trim().length > 0;
      case 1:
        return true;
      case 2:
        return fields.length > 0;
      default:
        return false;
    }
  };

  const addField = () => {
    if (fieldLabel.trim() && fieldType) {
      setFields((prev) => [
        ...prev,
        {
          id: `field_${Date.now()}`,
          label: fieldLabel.trim(),
          fieldType,
          required: fieldRequired,
        },
      ]);
      setFieldLabel("");
      setFieldType("");
      setFieldRequired(false);
    }
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleBack = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = async () => {
    if (currentIndex === WIZARD_STEPS.length - 1) {
      setIsSubmitting(true);
      try {
        await onSubmit({
          name: name.trim(),
          description: description.trim(),
          autoAttachTypes,
          fields,
        });
        handleReset();
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setName("");
    setDescription("");
    setAutoAttachTypes("");
    setFields([]);
    setFieldLabel("");
    setFieldType("");
    setFieldRequired(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <WizardModal
      open={open}
      onClose={handleClose}
      title={title}
      steps={WIZARD_STEPS}
      currentIndex={currentIndex}
      onBack={handleBack}
      onNext={handleNext}
      isSubmitting={isSubmitting}
      isStepValid={isStepValid()}
      submitLabel={submitLabel}
    >
      <div className="mt-6">
        {/* Step 1: Basics */}
        {currentIndex === 0 && (
          <div className="space-y-4">
            <Input
              label="Template Name"
              placeholder="e.g. Incident Report Form"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Textarea
              label="Description"
              placeholder="What is this template for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <Select
              label="Auto-attach to Incident Types"
              options={incidentTypes}
              value={autoAttachTypes}
              onChange={(e) => setAutoAttachTypes(e.target.value)}
              placeholder="Select incident types (optional)"
            />
          </div>
        )}

        {/* Step 2: Add Fields */}
        {currentIndex === 1 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border-default)] p-4 space-y-3">
              <p className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                Add a Field
              </p>

              <Input
                label="Field Label"
                placeholder="e.g. Description of Event"
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
              />

              <Select
                label="Field Type"
                options={FIELD_TYPE_OPTIONS}
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value)}
                placeholder="Select type"
              />

              <Toggle
                label="Required"
                checked={fieldRequired}
                onChange={setFieldRequired}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addField}
                disabled={!fieldLabel.trim() || !fieldType}
              >
                Add Field
              </Button>
            </div>

            {fields.length > 0 && (
              <div className="space-y-2">
                <p className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                  Fields ({fields.length})
                </p>
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border-default)] px-3 py-2"
                  >
                    <div>
                      <p className="text-[13px] text-[var(--text-primary)] font-medium">
                        {field.label}
                        {field.required && (
                          <span className="text-[var(--status-critical)] ml-1">*</span>
                        )}
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{field.fieldType}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {fields.length === 0 && (
              <p className="text-[12px] text-[var(--text-tertiary)] text-center py-4">
                No fields added yet. Add at least one field before proceeding.
              </p>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {currentIndex === 2 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border-default)] p-4 space-y-2">
              <p className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                Template Details
              </p>
              <p className="text-[13px] text-[var(--text-primary)] font-medium">{name}</p>
              {description && (
                <p className="text-[12px] text-[var(--text-tertiary)]">{description}</p>
              )}
            </div>

            <div className="rounded-lg border border-[var(--border-default)] p-4 space-y-2">
              <p className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                Fields ({fields.length})
              </p>
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2 text-[13px]">
                  <span className="text-[var(--text-tertiary)]">{idx + 1}.</span>
                  <span className="text-[var(--text-primary)]">{field.label}</span>
                  <span className="text-[var(--text-tertiary)]">({field.fieldType})</span>
                  {field.required && (
                    <span className="text-[10px] text-[var(--status-critical)] font-medium">
                      Required
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </WizardModal>
  );
}
