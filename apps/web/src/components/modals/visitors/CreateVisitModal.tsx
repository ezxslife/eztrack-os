"use client";

import { useState } from "react";
import { WizardModal } from "@/components/modals/WizardModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";

interface VisitData {
  purpose: string;
  hostName: string;
  hostDepartment: string;
  expectedDate: string;
  expectedTime: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  email: string;
  idType: string;
  idNumber: string;
  vehiclePlate: string;
  ndaRequired: boolean;
}

interface CreateVisitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VisitData) => void | Promise<void>;
}

const WIZARD_STEPS = [
  { id: "details", label: "Visit Details" },
  { id: "visitor", label: "Visitor Info" },
  { id: "review", label: "Review" },
];

const PURPOSE_OPTIONS = [
  { value: "meeting", label: "Meeting" },
  { value: "delivery", label: "Delivery" },
  { value: "contractor", label: "Contractor" },
  { value: "interview", label: "Interview" },
  { value: "tour", label: "Tour" },
  { value: "other", label: "Other" },
];

const ID_TYPE_OPTIONS = [
  { value: "drivers_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "badge", label: "Badge" },
  { value: "other", label: "Other" },
];

export function CreateVisitModal({
  open,
  onClose,
  onSubmit,
}: CreateVisitModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [data, setData] = useState<VisitData>({
    purpose: "",
    hostName: "",
    hostDepartment: "",
    expectedDate: "",
    expectedTime: "",
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
    email: "",
    idType: "",
    idNumber: "",
    vehiclePlate: "",
    ndaRequired: false,
  });

  const update = <K extends keyof VisitData>(field: K, value: VisitData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const isStepValid = (): boolean => {
    switch (currentIndex) {
      case 0:
        return (
          data.purpose !== "" &&
          data.hostName.trim().length > 0 &&
          data.expectedDate.trim().length > 0
        );
      case 1:
        return (
          data.firstName.trim().length > 0 &&
          data.lastName.trim().length > 0
        );
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleBack = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = async () => {
    if (currentIndex === WIZARD_STEPS.length - 1) {
      setIsSubmitting(true);
      try {
        await onSubmit(data);
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
    setData({
      purpose: "",
      hostName: "",
      hostDepartment: "",
      expectedDate: "",
      expectedTime: "",
      firstName: "",
      lastName: "",
      company: "",
      phone: "",
      email: "",
      idType: "",
      idNumber: "",
      vehiclePlate: "",
      ndaRequired: false,
    });
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <WizardModal
      open={open}
      onClose={handleClose}
      title="Create Visit"
      steps={WIZARD_STEPS}
      currentIndex={currentIndex}
      onBack={handleBack}
      onNext={handleNext}
      isSubmitting={isSubmitting}
      isStepValid={isStepValid()}
      submitLabel="Create Visit"
    >
      <div className="mt-6">
        {currentIndex === 0 && (
          <StepVisitDetails data={data} onUpdate={update} />
        )}

        {currentIndex === 1 && (
          <StepVisitorInfo data={data} onUpdate={update} />
        )}

        {currentIndex === 2 && (
          <StepReview data={data} onUpdate={update} />
        )}
      </div>
    </WizardModal>
  );
}

/* -- Step 1: Visit Details -- */

function StepVisitDetails({
  data,
  onUpdate,
}: {
  data: VisitData;
  onUpdate: <K extends keyof VisitData>(field: K, value: VisitData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[var(--text-secondary)]">
        Enter the visit details and host information.
      </p>

      <Select
        label="Purpose of Visit"
        options={PURPOSE_OPTIONS}
        value={data.purpose}
        onChange={(e) => onUpdate("purpose", e.target.value)}
        placeholder="Select purpose"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Host Name"
          placeholder="Who are they visiting?"
          value={data.hostName}
          onChange={(e) => onUpdate("hostName", e.target.value)}
        />
        <Input
          label="Host Department"
          placeholder="Department"
          value={data.hostDepartment}
          onChange={(e) => onUpdate("hostDepartment", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Expected Date"
          type="date"
          value={data.expectedDate}
          onChange={(e) => onUpdate("expectedDate", e.target.value)}
        />
        <Input
          label="Expected Time"
          type="time"
          value={data.expectedTime}
          onChange={(e) => onUpdate("expectedTime", e.target.value)}
        />
      </div>
    </div>
  );
}

/* -- Step 2: Visitor Info -- */

function StepVisitorInfo({
  data,
  onUpdate,
}: {
  data: VisitData;
  onUpdate: <K extends keyof VisitData>(field: K, value: VisitData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[var(--text-secondary)]">
        Enter the visitor&apos;s personal information.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="First Name"
          placeholder="First name"
          value={data.firstName}
          onChange={(e) => onUpdate("firstName", e.target.value)}
        />
        <Input
          label="Last Name"
          placeholder="Last name"
          value={data.lastName}
          onChange={(e) => onUpdate("lastName", e.target.value)}
        />
      </div>

      <Input
        label="Company"
        placeholder="Company or organization"
        value={data.company}
        onChange={(e) => onUpdate("company", e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Phone"
          placeholder="+1 (555) 000-0000"
          type="tel"
          value={data.phone}
          onChange={(e) => onUpdate("phone", e.target.value)}
        />
        <Input
          label="Email"
          placeholder="email@example.com"
          type="email"
          value={data.email}
          onChange={(e) => onUpdate("email", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="ID Type"
          options={ID_TYPE_OPTIONS}
          value={data.idType}
          onChange={(e) => onUpdate("idType", e.target.value)}
          placeholder="Select ID type"
        />
        <Input
          label="ID Number"
          placeholder="ID number"
          value={data.idNumber}
          onChange={(e) => onUpdate("idNumber", e.target.value)}
        />
      </div>

      <Input
        label="Vehicle Plate (Optional)"
        placeholder="License plate number"
        value={data.vehiclePlate}
        onChange={(e) => onUpdate("vehiclePlate", e.target.value)}
      />
    </div>
  );
}

/* -- Step 3: Review -- */

function StepReview({
  data,
  onUpdate,
}: {
  data: VisitData;
  onUpdate: <K extends keyof VisitData>(field: K, value: VisitData[K]) => void;
}) {
  const purposeLabel =
    PURPOSE_OPTIONS.find((o) => o.value === data.purpose)?.label ?? data.purpose;
  const idTypeLabel =
    ID_TYPE_OPTIONS.find((o) => o.value === data.idType)?.label ?? data.idType;

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[var(--text-secondary)]">
        Review the visit details before submitting.
      </p>

      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-secondary)] divide-y divide-[var(--border-default)]">
        {/* Visit Details Section */}
        <div className="p-3 space-y-2">
          <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
            Visit Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <ReviewField label="Purpose" value={purposeLabel} />
            <ReviewField label="Host" value={data.hostName} />
            <ReviewField label="Department" value={data.hostDepartment} />
            <ReviewField label="Date" value={data.expectedDate} />
            <ReviewField label="Time" value={data.expectedTime} />
          </div>
        </div>

        {/* Visitor Info Section */}
        <div className="p-3 space-y-2">
          <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
            Visitor Information
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <ReviewField
              label="Name"
              value={`${data.firstName} ${data.lastName}`}
            />
            <ReviewField label="Company" value={data.company} />
            <ReviewField label="Phone" value={data.phone} />
            <ReviewField label="Email" value={data.email} />
            <ReviewField label="ID Type" value={idTypeLabel} />
            <ReviewField label="ID Number" value={data.idNumber} />
            {data.vehiclePlate && (
              <ReviewField label="Vehicle" value={data.vehiclePlate} />
            )}
          </div>
        </div>
      </div>

      <div className="pt-1">
        <Toggle
          checked={data.ndaRequired}
          onChange={(checked) => onUpdate("ndaRequired", checked)}
          label="NDA / Waiver required"
        />
      </div>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-[var(--text-tertiary)]">{label}</p>
      <p className="text-[13px] text-[var(--text-primary)]">
        {value || "\u2014"}
      </p>
    </div>
  );
}
