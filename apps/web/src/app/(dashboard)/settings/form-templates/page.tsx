"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, FileText, Pencil, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import { Card, CardContent } from "@/components/ui/Card";
import { CreateFormTemplateWizard } from "@/components/modals/settings";
import { useToast } from "@/components/ui/Toast";
import {
  fetchFormTemplates,
  saveFormTemplates,
} from "@/lib/queries/settings";
import type { FormTemplateRecord } from "@/lib/settings-shared";

function formatTemplateDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

export default function FormTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<FormTemplateRecord[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFormTemplates();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persistTemplates = async (nextTemplates: FormTemplateRecord[]) => {
    await saveFormTemplates(nextTemplates);
    setTemplates(nextTemplates);
  };

  const toggleActive = async (id: string, checked: boolean) => {
    const nextTemplates = templates.map((t) =>
      t.id === id ? { ...t, active: checked, lastUpdated: new Date().toISOString() } : t,
    );
    try {
      await persistTemplates(nextTemplates);
    } catch (err: any) {
      toast(err.message || "Failed to update template", { variant: "error" });
      load();
    }
  };

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
        <Button variant="outline" size="sm" onClick={load}>
          Retry
        </Button>
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
                    <td className="px-5 py-3 text-[var(--text-tertiary)]">{formatTemplateDate(tpl.lastUpdated)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={tpl.builtIn ? "info" : "warning"}>
                        {tpl.builtIn ? "Built-in" : "Custom"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          checked={tpl.active}
                          onChange={(checked) => void toggleActive(tpl.id, checked)}
                          size="sm"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCreateOpen(false);
                          setEditingTemplate(tpl);
                        }}
                      >
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
        open={createOpen || editingTemplate !== null}
        onClose={() => {
          setCreateOpen(false);
          setEditingTemplate(null);
        }}
        initialData={editingTemplate}
        title={editingTemplate ? "Edit Form Template" : "Create Form Template"}
        submitLabel={editingTemplate ? "Save Template" : "Create Template"}
        onSubmit={async (data) => {
          try {
            const timestamp = new Date().toISOString();
            const nextTemplate: FormTemplateRecord = editingTemplate
              ? {
                  ...editingTemplate,
                  name: data.name,
                  description: data.description,
                  fieldCount: data.fields.length,
                  lastUpdated: timestamp,
                  autoAttachTypes: data.autoAttachTypes,
                  fields: data.fields,
                }
              : {
                  id: crypto.randomUUID(),
                  name: data.name,
                  description: data.description,
                  fieldCount: data.fields.length,
                  lastUpdated: timestamp,
                  active: true,
                  builtIn: false,
                  autoAttachTypes: data.autoAttachTypes,
                  fields: data.fields,
                };

            const nextTemplates = editingTemplate
              ? templates.map((template) =>
                  template.id === editingTemplate.id ? nextTemplate : template,
                )
              : [...templates, nextTemplate];

            await persistTemplates(nextTemplates);
            toast(
              editingTemplate
                ? "Form template updated successfully"
                : "Form template created successfully",
              { variant: "success" },
            );
            setEditingTemplate(null);
            setCreateOpen(false);
          } catch (err: any) {
            toast(
              err.message ||
                (editingTemplate
                  ? "Failed to update template"
                  : "Failed to create template"),
              { variant: "error" },
            );
            throw err;
          }
        }}
      />
    </div>
  );
}
