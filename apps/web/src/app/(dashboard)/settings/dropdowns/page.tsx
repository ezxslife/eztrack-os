"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, GripVertical, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AddDropdownValueModal } from "@/components/modals/settings";

interface DropdownCategory {
  id: string;
  name: string;
  description: string;
  values: string[];
}

const initialCategories: DropdownCategory[] = [
  {
    id: "incident-type",
    name: "Incident Type",
    description: "Types of incidents that can be reported",
    values: ["Theft", "Assault", "Trespass", "Vandalism", "Medical Emergency", "Disturbance", "Fraud", "Suspicious Activity", "Fire/Alarm", "Other"],
  },
  {
    id: "incident-priority",
    name: "Incident Priority",
    description: "Priority levels for incident triage",
    values: ["Critical", "High", "Medium", "Low"],
  },
  {
    id: "disposition",
    name: "Disposition",
    description: "Outcome or resolution of an incident",
    values: ["Resolved on Scene", "Report Filed", "Arrest Made", "Referred to Law Enforcement", "Trespassed", "Medical Transport", "No Action Needed", "Under Investigation"],
  },
  {
    id: "lost-item-category",
    name: "Lost Item Category",
    description: "Categories for lost & found items",
    values: ["Wallet/Purse", "Phone/Electronics", "Jewelry", "Clothing", "Keys", "ID/Documents", "Luggage", "Other"],
  },
  {
    id: "contact-type",
    name: "Field Contact Type",
    description: "Types of field contacts",
    values: ["Suspicious Person", "Welfare Check", "Verbal Warning", "Trespass Warning", "Information Gathering"],
  },
];

export default function DropdownConfigPage() {
  const [categories, setCategories] = useState(initialCategories);
  const [expandedId, setExpandedId] = useState<string | null>("incident-type");
  const [newValue, setNewValue] = useState("");
  const [addValueCategory, setAddValueCategory] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const addValue = (categoryId: string) => {
    if (!newValue.trim()) return;
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, values: [...cat.values, newValue.trim()] }
          : cat
      )
    );
    setNewValue("");
  };

  const removeValue = (categoryId: string, index: number) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, values: cat.values.filter((_, i) => i !== index) }
          : cat
      )
    );
  };

  const moveValue = (categoryId: string, index: number, direction: "up" | "down") => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        const newValues = [...cat.values];
        const swapIdx = direction === "up" ? index - 1 : index + 1;
        if (swapIdx < 0 || swapIdx >= newValues.length) return cat;
        [newValues[index], newValues[swapIdx]] = [newValues[swapIdx], newValues[index]];
        return { ...cat, values: newValues };
      })
    );
  };

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
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Dropdown Configuration</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Manage configurable dropdown values for forms and reports</p>
      </div>

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
                    {cat.values.map((val, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-[var(--surface-hover)] group transition-colors"
                      >
                        <GripVertical className="h-3.5 w-3.5 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />
                        <span className="text-[13px] text-[var(--text-primary)] flex-1">{val}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0.5 disabled:opacity-30"
                            disabled={idx === 0}
                            onClick={() => moveValue(cat.id, idx, "up")}
                            title="Move up"
                          >
                            <ChevronRight className="h-3 w-3 -rotate-90" />
                          </button>
                          <button
                            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0.5 disabled:opacity-30"
                            disabled={idx === cat.values.length - 1}
                            onClick={() => moveValue(cat.id, idx, "down")}
                            title="Move down"
                          >
                            <ChevronRight className="h-3 w-3 rotate-90" />
                          </button>
                          <button
                            className="text-[var(--text-tertiary)] hover:text-red-400 p-0.5"
                            onClick={() => removeValue(cat.id, idx)}
                            title="Remove"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
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
                        if (e.key === "Enter") addValue(cat.id);
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => addValue(cat.id)}>
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
            setCategories((prev) =>
              prev.map((cat) =>
                cat.id === addValueCategory
                  ? { ...cat, values: [...cat.values, data.displayLabel] }
                  : cat
              )
            );
          }
          setAddValueCategory(null);
        }}
        dropdownCategory={
          categories.find((c) => c.id === addValueCategory)?.name
        }
      />
    </div>
  );
}
