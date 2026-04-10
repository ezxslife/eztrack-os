"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, GripVertical, Trash2, ChevronDown, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { AppPage, PageSection } from "@/components/layout/AppPage";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { AddDropdownValueModal } from "@/components/modals/settings";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  fetchDropdownCategories,
  createDropdownValue,
  deleteDropdownValue,
  type DropdownCategoryRow,
} from "@/lib/queries/settings";

interface DropdownCategory {
  id: string;
  name: string;
  description: string;
  values: { id: string; label: string }[];
}

export default function DropdownConfigPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<DropdownCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newValue, setNewValue] = useState("");
  const [addValueCategory, setAddValueCategory] = useState<string | null>(null);

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
      const data = await fetchDropdownCategories(profile.org_id);
      const mapped = data.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description ?? "",
        values: cat.values.map((v) => ({ id: v.id, label: v.displayLabel })),
      }));
      setCategories(mapped);
      if (mapped.length > 0 && !expandedId) setExpandedId(mapped[0].id);
    } catch (err: any) {
      setError(err.message || "Failed to load dropdown categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const addValueInline = async (categoryId: string) => {
    if (!newValue.trim()) return;
    try {
      await createDropdownValue({ displayLabel: newValue.trim(), categoryId });
      toast("Value added", { variant: "success" });
      setNewValue("");
      load();
    } catch (err: any) {
      toast(err.message || "Failed to add value", { variant: "error" });
    }
  };

  const removeValue = async (valueId: string) => {
    try {
      await deleteDropdownValue(valueId);
      toast("Value removed", { variant: "success" });
      load();
    } catch (err: any) {
      toast(err.message || "Failed to remove value", { variant: "error" });
    }
  };

  if (loading) {
    return (
      <AppPage width="wide">
        <PageSection className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
        </PageSection>
      </AppPage>
    );
  }

  if (error) {
    return (
      <AppPage width="wide">
        <PageSection className="flex flex-col items-center justify-center gap-3 py-20">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <p className="text-[13px] text-[var(--text-secondary)]">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>Retry</Button>
        </PageSection>
      </AppPage>
    );
  }

  return (
    <SettingsLayout
      title="Dropdown Configuration"
      subtitle="Manage configurable dropdown values for forms and reports."
      asideTitle="Shared lists"
      asideDescription="Dropdowns should stay predictable and lightweight. Categories expand inline so admins can adjust lists without leaving the main settings flow."
      secondaryActions={(
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Settings
          </Button>
        </Link>
      )}
    >
      <div className="space-y-3">
        {categories.map((cat) => {
          const isExpanded = expandedId === cat.id;
          return (
            <Card key={cat.id}>
              <div
                className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors rounded-xl"
                onClick={() => toggleExpand(cat.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">{cat.name}</span>
                  <span className="text-[12px] text-[var(--text-tertiary)] ml-2">{cat.description}</span>
                </div>
                <Badge tone="default">{cat.values.length} values</Badge>
              </div>
              {isExpanded && (
                <CardContent className="!pt-0 border-t border-[var(--border-default)]">
                  <div className="space-y-1 mt-3">
                    {cat.values.map((val) => (
                      <div
                        key={val.id}
                        className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-[var(--surface-hover)] group transition-colors"
                      >
                        <GripVertical className="h-3.5 w-3.5 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />
                        <span className="text-[13px] text-[var(--text-primary)] flex-1">{val.label}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <IconButton
                            className="h-7 w-7 rounded-lg text-[var(--text-secondary)] shadow-none hover:bg-[var(--status-critical-surface)] hover:text-[var(--status-critical)]"
                            label={`Remove ${val.label}`}
                            onClick={() => removeValue(val.id)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="h-3 w-3" />
                          </IconButton>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border-default)]">
                    <Input
                      placeholder="New value..."
                      value={expandedId === cat.id ? newValue : ""}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addValueInline(cat.id);
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => addValueInline(cat.id)}>
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setAddValueCategory(cat.id)}>
                      <Plus className="h-3.5 w-3.5" />
                      Add Value
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <AddDropdownValueModal
        open={addValueCategory !== null}
        onClose={() => setAddValueCategory(null)}
        onSubmit={async (data) => {
          if (addValueCategory) {
            try {
              await createDropdownValue({
                displayLabel: data.displayLabel,
                categoryId: addValueCategory,
                sortOrder: data.sortOrder,
              });
              toast("Value added", { variant: "success" });
              load();
            } catch (err: any) {
              toast(err.message || "Failed to add value", { variant: "error" });
            }
          }
          setAddValueCategory(null);
        }}
        dropdownCategory={
          categories.find((c) => c.id === addValueCategory)?.name
        }
      />
    </SettingsLayout>
  );
}
