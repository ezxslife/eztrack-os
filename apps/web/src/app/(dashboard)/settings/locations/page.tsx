"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, ChevronDown, Plus, Building, Layers, MapPin, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AddLocationModal } from "@/components/modals/settings";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  fetchProperties,
  fetchLocations,
  createLocation,
  type PropertyRow,
  type LocationRow,
} from "@/lib/queries/settings";

interface TreeNode {
  id: string;
  name: string;
  type: "property" | "zone" | "location";
  children?: TreeNode[];
}

/** Build a tree from flat properties + locations */
function buildTree(properties: PropertyRow[], locationsByProperty: Record<string, LocationRow[]>): TreeNode[] {
  return properties.map((p) => {
    const locs = locationsByProperty[p.id] || [];
    // Group locations by parentId for hierarchy
    const roots = locs.filter((l) => !l.parentId);
    const childMap = new Map<string, LocationRow[]>();
    locs.forEach((l) => {
      if (l.parentId) {
        const arr = childMap.get(l.parentId) || [];
        arr.push(l);
        childMap.set(l.parentId, arr);
      }
    });

    const toNode = (loc: LocationRow, depth: number): TreeNode => ({
      id: loc.id,
      name: loc.name,
      type: depth === 0 ? "zone" : "location",
      children: (childMap.get(loc.id) || []).map((c) => toNode(c, depth + 1)),
    });

    return {
      id: p.id,
      name: p.name,
      type: "property" as const,
      children: roots.map((r) => toNode(r, 0)),
    };
  });
}

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

function LocationNode({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [properties, setProperties] = useState<PropertyRow[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();
      if (!profile?.org_id) throw new Error("Organization not found");
      const props = await fetchProperties(profile.org_id);
      setProperties(props);
      const locsByProp: Record<string, LocationRow[]> = {};
      await Promise.all(
        props.map(async (p) => {
          locsByProp[p.id] = await fetchLocations(p.id);
        }),
      );
      setTree(buildTree(props, locsByProp));
    } catch (err: any) {
      setError(err.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="text-[13px] text-[var(--text-secondary)]">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>Retry</Button>
      </div>
    );
  }

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
            {tree.length === 0 ? (
              <p className="text-center py-8 text-[var(--text-tertiary)] text-[13px]">No locations yet. Add a property first, then create locations.</p>
            ) : (
              tree.map((node) => (
                <LocationNode key={node.id} node={node} />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AddLocationModal
        open={addLocationOpen}
        onClose={() => setAddLocationOpen(false)}
        onSubmit={async (data) => {
          try {
            const propId = data.parentPropertyId || properties[0]?.id;
            if (!propId) throw new Error("No property available");
            await createLocation({
              name: data.name,
              locationType: data.locationType || undefined,
              parentId: data.zone || undefined,
              propertyId: propId,
            });
            toast("Location created successfully", { variant: "success" });
            load();
          } catch (err: any) {
            toast(err.message || "Failed to create location", { variant: "error" });
          }
        }}
        properties={properties.map((p) => ({ value: p.id, label: p.name }))}
      />
    </div>
  );
}
