"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, FileText, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { CreateFormTemplateWizard } from "@/components/modals/settings";
import { useToast } from "@/components/ui/Toast";

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fieldCount: number;
  lastUpdated: string;
  active: boolean;
  builtIn: boolean;
}

const initialTemplates: FormTemplate[] = [
  { id: "1", name: "Incident Report", description: "Core incident report with narrative and involved parties", fieldCount: 24, lastUpdated: "Mar 28, 2026", active: true, builtIn: true },
  { id: "2", name: "Use of Force Report", description: "Detailed use of force documentation", fieldCount: 32, lastUpdated: "Mar 15, 2026", active: true, builtIn: true },
  { id: "3", name: "Arrest Report", description: "Arrest details, charges, and booking information", fieldCount: 28, lastUpdated: "Mar 10, 2026", active: true, builtIn: true },
  { id: "4", name: "Trespass Warning", description: "Trespass notice with photo and signature capture", fieldCount: 14, lastUpdated: "Feb 20, 2026", active: true, builtIn: true },
  { id: "5", name: "Lost & Found Form", description: "Item description, location found, and claim tracking", fieldCount: 16, lastUpdated: "Mar 5, 2026", active: true, builtIn: true },
  { id: "6", name: "Vehicle Incident", description: "Vehicle accident and damage reporting", fieldCount: 20, lastUpdated: "Jan 18, 2026", active: true, builtIn: true },
  { id: "7", name: "Injury / Medical", description: "Injury documentation and medical response details", fieldCount: 22, lastUpdated: "Feb 12, 2026", active: true, builtIn: true },
  { id: "8", name: "Evidence Log", description: "Evidence collection, chain of custody tracking", fieldCount: 12, lastUpdated: "Mar 1, 2026", active: true, builtIn: true },
  { id: "9", name: "Witness Statement", description: "Witness interview and signed statement", fieldCount: 10, lastUpdated: "Feb 25, 2026", active: true, builtIn: true },
  { id: "10", name: "Property Damage", description: "Property damage assessment and cost estimation", fieldCount: 18, lastUpdated: "Jan 30, 2026", active: false, builtIn: true },
];

export default function FormTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState(initialTemplates);
  const [createOpen, setCreateOpen] = useState(false);

  const toggleActive = (id: string, checked: boolean) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: checked } : t))
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Form Templates</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">Manage supplemental form templates and custom forms</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Create Custom Form
        </Button>
      </div>

      <Card>
        <CardContent className="!px-0 !pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th className="text-left font-medium text-[var(--text-secondary)] px-5 py-2.5">Template</th>
                  <th className="text-left font-medium text-[var(--text-secondary)] px-5 py-2.5">Fields</th>
                  <th className="text-left font-medium text-[var(--text-secondary)] px-5 py-2.5">Last Updated</th>
                  <th className="text-left font-medium text-[var(--text-secondary)] px-5 py-2.5">Type</th>
                  <th className="text-center font-medium text-[var(--text-secondary)] px-5 py-2.5">Active</th>
                  <th className="w-16 px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {templates.map((tpl) => (
                  <tr
                    key={tpl.id}
                    className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-[var(--text-secondary)]" />
                        </div>
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">{tpl.name}</div>
                          <div className="text-[12px] text-[var(--text-tertiary)]">{tpl.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{tpl.fieldCount} fields</td>
                    <td className="px-5 py-3 text-[var(--text-tertiary)]">{tpl.lastUpdated}</td>
                    <td className="px-5 py-3">
                      <Badge tone={tpl.builtIn ? "info" : "warning"}>
                        {tpl.builtIn ? "Built-in" : "Custom"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          checked={tpl.active}
                          onChange={(checked) => toggleActive(tpl.id, checked)}
                          size="sm"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CreateFormTemplateWizard
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (data) => {
          toast("Form template created successfully", { variant: "success" });
        }}
      />
    </div>
  );
}
