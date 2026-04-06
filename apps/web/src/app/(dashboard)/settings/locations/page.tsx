"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, ChevronDown, Plus, Building, Layers, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AddLocationModal } from "@/components/modals/settings";
import { useToast } from "@/components/ui/Toast";

interface Location {
  id: string;
  name: string;
  type: "property" | "zone" | "location";
  children?: Location[];
}

const locationTree: Location[] = [
  {
    id: "p1",
    name: "Bellagio Resort & Casino",
    type: "property",
    children: [
      {
        id: "z1",
        name: "Casino Floor",
        type: "zone",
        children: [
          { id: "l1", name: "Main Gaming Hall", type: "location" },
          { id: "l2", name: "High Limit Room", type: "location" },
          { id: "l3", name: "Poker Room", type: "location" },
          { id: "l4", name: "Sportsbook", type: "location" },
        ],
      },
      {
        id: "z2",
        name: "Hotel Tower",
        type: "zone",
        children: [
          { id: "l5", name: "Lobby", type: "location" },
          { id: "l6", name: "Floors 1-10", type: "location" },
          { id: "l7", name: "Floors 11-20", type: "location" },
          { id: "l8", name: "Penthouse Level", type: "location" },
        ],
      },
      {
        id: "z3",
        name: "Exterior",
        type: "zone",
        children: [
          { id: "l9", name: "Front Entrance / Valet", type: "location" },
          { id: "l10", name: "Pool Deck", type: "location" },
          { id: "l11", name: "Parking Garage", type: "location" },
        ],
      },
    ],
  },
  {
    id: "p2",
    name: "Bellagio Convention Center",
    type: "property",
    children: [
      {
        id: "z4",
        name: "Exhibit Halls",
        type: "zone",
        children: [
          { id: "l12", name: "Hall A", type: "location" },
          { id: "l13", name: "Hall B", type: "location" },
        ],
      },
      {
        id: "z5",
        name: "Meeting Rooms",
        type: "zone",
        children: [
          { id: "l14", name: "Boardroom 1", type: "location" },
          { id: "l15", name: "Boardroom 2", type: "location" },
          { id: "l16", name: "Ballroom", type: "location" },
        ],
      },
    ],
  },
];

const typeIcons = {
  property: Building,
  zone: Layers,
  location: MapPin,
};

const typeBadgeTone: Record<string, "info" | "warning" | "default"> = {
  property: "info",
  zone: "warning",
  location: "default",
};

function LocationNode({ node, depth = 0 }: { node: Location; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const Icon = typeIcons[node.type];

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <Icon className="h-3.5 w-3.5 text-[var(--text-secondary)] shrink-0" />
        <span className="text-[13px] text-[var(--text-primary)] font-medium flex-1">{node.name}</span>
        <Badge tone={typeBadgeTone[node.type]}>
          {node.type}
        </Badge>
        {hasChildren && (
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {node.children!.length} {node.type === "property" ? "zones" : "locations"}
          </span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <LocationNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LocationsSettingsPage() {
  const { toast } = useToast();
  const [addLocationOpen, setAddLocationOpen] = useState(false);

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
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Locations</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">Manage hierarchical location structure: Property &gt; Zone &gt; Location</p>
        </div>
        <Button onClick={() => setAddLocationOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Location
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0.5">
            {locationTree.map((node) => (
              <LocationNode key={node.id} node={node} />
            ))}
          </div>
        </CardContent>
      </Card>

      <AddLocationModal
        open={addLocationOpen}
        onClose={() => setAddLocationOpen(false)}
        onSubmit={async (data) => {
          toast("Location created successfully", { variant: "success" });
        }}
      />
    </div>
  );
}
