"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Building, MapPin, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AddPropertyModal } from "@/components/modals/settings";
import { useToast } from "@/components/ui/Toast";

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  zones: number;
  status: "active" | "inactive";
}

const mockProperties: Property[] = [
  {
    id: "1",
    name: "Bellagio Resort & Casino",
    address: "3600 S Las Vegas Blvd, Las Vegas, NV 89109",
    type: "Casino & Resort",
    zones: 12,
    status: "active",
  },
  {
    id: "2",
    name: "Bellagio Convention Center",
    address: "3720 S Las Vegas Blvd, Las Vegas, NV 89109",
    type: "Convention Center",
    zones: 6,
    status: "active",
  },
];

export default function PropertiesSettingsPage() {
  const { toast } = useToast();
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);

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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Properties</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">Manage properties and venue sites</p>
        </div>
        <Button onClick={() => setAddPropertyOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Property
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {mockProperties.map((prop) => (
          <Card key={prop.id}>
            <CardHeader>
              <div className="flex items-start justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
                    <Building className="h-5 w-5 text-[var(--text-secondary)]" />
                  </div>
                  <div>
                    <CardTitle>{prop.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge tone="default">{prop.type}</Badge>
                      <Badge tone="success" dot>{prop.status === "active" ? "Active" : "Inactive"}</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-[13px]">
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                  <span className="text-[var(--text-secondary)]">{prop.address}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]">
                  <span className="text-[var(--text-tertiary)]">{prop.zones} zones configured</span>
                  <Link href="/settings/locations" className="text-[var(--action-primary)] hover:underline text-[12px]">
                    Manage Zones
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddPropertyModal
        open={addPropertyOpen}
        onClose={() => setAddPropertyOpen(false)}
        onSubmit={async (data) => {
          toast("Property created successfully", { variant: "success" });
        }}
      />
    </div>
  );
}
