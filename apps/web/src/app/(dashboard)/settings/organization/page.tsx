"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Building2, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Berlin", label: "Central European Time (CET)" },
];

export default function OrganizationSettingsPage() {
  const [orgName, setOrgName] = useState("Bellagio Resort & Casino");
  const [address, setAddress] = useState("3600 S Las Vegas Blvd, Las Vegas, NV 89109");
  const [phone, setPhone] = useState("+1 (702) 693-7111");
  const [email, setEmail] = useState("security@bellagio.com");
  const [timezone, setTimezone] = useState("America/Los_Angeles");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Organization Settings</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Company profile, branding, and preferences</p>
      </div>

      {/* Subscription Tier */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[var(--action-primary)] flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Enterprise Plan</span>
                <Badge tone="success">Active</Badge>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
                Unlimited users, properties, and integrations. Renews Jan 15, 2027.
              </p>
            </div>
            <Button variant="outline" size="sm">Manage Plan</Button>
          </div>
        </CardContent>
      </Card>

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Organization Name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
            <Textarea
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Select
              label="Timezone"
              options={timezoneOptions}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-5">
            <div className="h-20 w-20 rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
              <Building2 className="h-8 w-8 text-[var(--text-tertiary)]" />
            </div>
            <div className="space-y-2">
              <p className="text-[13px] text-[var(--text-secondary)]">
                Upload your organization logo. Recommended size: 256x256px. PNG or SVG format.
              </p>
              <Button variant="outline" size="sm">
                <Upload className="h-3.5 w-3.5" />
                Upload Logo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end gap-2">
        <Button variant="secondary">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
