"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";

const LOCATION_OPTIONS = [
  { value: "main-stage", label: "Main Stage" },
  { value: "north-gate", label: "North Gate" },
  { value: "south-gate", label: "South Gate" },
  { value: "vip-lot-a", label: "VIP Lot A" },
  { value: "vip-lot-b", label: "VIP Lot B" },
  { value: "family-zone", label: "Family Zone" },
  { value: "west-field", label: "West Field" },
  { value: "east-perimeter", label: "East Perimeter" },
  { value: "command-post", label: "Command Post" },
  { value: "vendor-row", label: "Vendor Row" },
  { value: "main-entrance", label: "Main Entrance" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function NewDailyLogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("medium");
  const [synopsis, setSynopsis] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const data = { topic, location, priority, synopsis };
    toast("Daily log entry created successfully", { variant: "success" });
    setSubmitted(true);
    setTimeout(() => {
      router.push("/daily-log");
    }, 1500);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-scale-in">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[var(--green-500,#10b981)]/12 mb-4">
          <CheckCircle size={24} className="text-[var(--green-500,#10b981)]" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Entry Created
        </h2>
        <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
          Redirecting to Daily Log...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/daily-log">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={14} />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            New Daily Log Entry
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">
            Create a new daily log entry
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="surface-card max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Topic"
            placeholder="Brief description of the log entry..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Location"
              options={LOCATION_OPTIONS}
              placeholder="Select zone..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <Select
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </div>

          <Textarea
            label="Synopsis"
            placeholder="Detailed notes about the event or observation..."
            rows={5}
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-subdued)]">
            <Link href="/daily-log">
              <Button variant="secondary" size="md" type="button">
                Cancel
              </Button>
            </Link>
            <Button variant="default" size="md" type="submit">
              Submit Entry
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
