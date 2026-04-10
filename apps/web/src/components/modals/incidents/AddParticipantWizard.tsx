"use client";

import { useState } from "react";
import { Search, User, Briefcase, Phone, Globe } from "lucide-react";
import { WizardModal } from "@/components/modals/WizardModal";
import { Input } from "@/components/ui/Input";
import { SelectionTile } from "@/components/ui/SelectionTile";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";

type PersonType = "patron" | "staff" | "contact" | "external";

type ParticipantRole =
  | "witness"
  | "victim"
  | "complainant"
  | "offender"
  | "suspect"
  | "respondent"
  | "reporting_party"
  | "involved_party"
  | "other";

interface ParticipantData {
  personType: PersonType;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  searchQuery: string;
  primaryRole: ParticipantRole;
  secondaryRole: string;
  description: string;
  policeContacted: boolean;
  policeResult: string;
  medicalAttention: boolean;
  medicalDetails: string;
}

interface AddParticipantWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ParticipantData) => void | Promise<void>;
}

const WIZARD_STEPS = [
  { id: "type", label: "Person Type" },
  { id: "identity", label: "Identity" },
  { id: "role", label: "Role & Details" },
];

const PERSON_TYPES: { value: PersonType; label: string; icon: typeof User; description: string }[] = [
  { value: "patron", label: "Patron", icon: User, description: "Customer or visitor" },
  { value: "staff", label: "Staff", icon: Briefcase, description: "Employee or contractor" },
  { value: "contact", label: "Contact", icon: Phone, description: "Known contact on file" },
  { value: "external", label: "External", icon: Globe, description: "External individual" },
];

const ROLE_OPTIONS: { value: ParticipantRole; label: string }[] = [
  { value: "witness", label: "Witness" },
  { value: "victim", label: "Victim" },
  { value: "complainant", label: "Complainant" },
  { value: "offender", label: "Offender" },
  { value: "suspect", label: "Suspect" },
  { value: "respondent", label: "Respondent" },
  { value: "reporting_party", label: "Reporting Party" },
  { value: "involved_party", label: "Involved Party" },
  { value: "other", label: "Other" },
];

const SECONDARY_ROLE_OPTIONS = [
  { value: "", label: "None" },
  ...ROLE_OPTIONS,
];

export function AddParticipantWizard({
  open,
  onClose,
  onSubmit,
}: AddParticipantWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [data, setData] = useState<ParticipantData>({
    personType: "patron",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    searchQuery: "",
    primaryRole: "witness",
    secondaryRole: "",
    description: "",
    policeContacted: false,
    policeResult: "",
    medicalAttention: false,
    medicalDetails: "",
  });

  const update = <K extends keyof ParticipantData>(field: K, value: ParticipantData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const isStepValid = (): boolean => {
    switch (currentIndex) {
      case 0:
        return !!data.personType;
      case 1:
        if (data.personType === "external") {
          return data.firstName.trim().length > 0 && data.lastName.trim().length > 0;
        }
        return true; // search-based steps are optional
      case 2:
        return !!data.primaryRole;
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
      personType: "patron",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      searchQuery: "",
      primaryRole: "witness",
      secondaryRole: "",
      description: "",
      policeContacted: false,
      policeResult: "",
      medicalAttention: false,
      medicalDetails: "",
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
      title="Add Participant"
      steps={WIZARD_STEPS}
      currentIndex={currentIndex}
      onBack={handleBack}
      onNext={handleNext}
      isSubmitting={isSubmitting}
      isStepValid={isStepValid()}
      submitLabel="Add Participant"
    >
      <div className="mt-6">
        {currentIndex === 0 && (
          <StepPersonType
            selected={data.personType}
            onSelect={(type) => update("personType", type)}
          />
        )}

        {currentIndex === 1 && (
          <StepIdentity
            personType={data.personType}
            data={data}
            onUpdate={update}
          />
        )}

        {currentIndex === 2 && (
          <StepRoleDetails data={data} onUpdate={update} />
        )}
      </div>
    </WizardModal>
  );
}

/* ── Step 1: Person Type ── */

function StepPersonType({
  selected,
  onSelect,
}: {
  selected: PersonType;
  onSelect: (type: PersonType) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] text-[var(--text-secondary)] mb-3">
        Select the type of person to add as a participant.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PERSON_TYPES.map(({ value, label, icon: Icon, description }) => (
          <SelectionTile
            key={value}
            onClick={() => onSelect(value)}
            selected={selected === value}
            selectedLabel="Selected"
            title={label}
            description={description}
            leading={
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  selected === value
                    ? "bg-[var(--action-primary-fill)] text-[var(--text-on-brand)]"
                    : "bg-[var(--surface-secondary)] text-[var(--text-tertiary)]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}

/* ── Step 2: Identity ── */

function StepIdentity({
  personType,
  data,
  onUpdate,
}: {
  personType: PersonType;
  data: ParticipantData;
  onUpdate: <K extends keyof ParticipantData>(field: K, value: ParticipantData[K]) => void;
}) {
  if (personType === "external") {
    return (
      <div className="space-y-4">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Enter the external person&apos;s details.
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
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[var(--text-secondary)]">
        Search for an existing {personType} record.
      </p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder={`Search ${personType}s by name or ID...`}
          value={data.searchQuery}
          onChange={(e) => onUpdate("searchQuery", e.target.value)}
          className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        />
      </div>

      {/* Mock search results */}
      <div className="border border-[var(--border-default)] rounded-xl overflow-hidden divide-y divide-[var(--border-default)]">
        {[
          { name: "John Smith", id: "P-1042", dept: "Operations" },
          { name: "Sarah Johnson", id: "P-2318", dept: "Security" },
          { name: "Michael Chen", id: "P-0891", dept: "Front Desk" },
        ].map((person) => (
          <SelectionTile
            key={person.id}
            className="rounded-none border-0 shadow-none first:rounded-t-xl last:rounded-b-xl"
            onClick={() => onUpdate("searchQuery", person.name)}
            selected={data.searchQuery === person.name}
            selectedLabel="Selected"
            title={person.name}
            description={`${person.id} · ${person.dept}`}
            leading={
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-tertiary)] text-[11px] font-medium text-[var(--text-secondary)]">
                {person.name.split(" ").map((n) => n[0]).join("")}
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}

/* ── Step 3: Role & Details ── */

function StepRoleDetails({
  data,
  onUpdate,
}: {
  data: ParticipantData;
  onUpdate: <K extends keyof ParticipantData>(field: K, value: ParticipantData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Primary Role"
          options={ROLE_OPTIONS}
          value={data.primaryRole}
          onChange={(e) => onUpdate("primaryRole", e.target.value as ParticipantRole)}
        />
        <Select
          label="Secondary Role"
          options={SECONDARY_ROLE_OPTIONS}
          value={data.secondaryRole}
          onChange={(e) => onUpdate("secondaryRole", e.target.value)}
          placeholder="Select secondary role..."
        />
      </div>

      <Textarea
        label="Description"
        placeholder="Additional details about this participant's involvement..."
        value={data.description}
        onChange={(e) => onUpdate("description", e.target.value)}
        rows={3}
      />

      <div className="space-y-3 pt-1">
        <div className="space-y-2">
          <Toggle
            checked={data.policeContacted}
            onChange={(checked) => onUpdate("policeContacted", checked)}
            label="Police contacted"
          />
          {data.policeContacted && (
            <Input
              label="Police Result"
              placeholder="e.g. Report filed, Case # assigned..."
              value={data.policeResult}
              onChange={(e) => onUpdate("policeResult", e.target.value)}
            />
          )}
        </div>

        <div className="space-y-2">
          <Toggle
            checked={data.medicalAttention}
            onChange={(checked) => onUpdate("medicalAttention", checked)}
            label="Medical attention required"
          />
          {data.medicalAttention && (
            <Input
              label="Medical Details"
              placeholder="e.g. Paramedics called, transported to hospital..."
              value={data.medicalDetails}
              onChange={(e) => onUpdate("medicalDetails", e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
