import {
  ROLE_ORDER,
  formatRoleLabel,
  mapStaffRoleToUiRole,
  mapUiRoleToStaffRole,
  type InviteUserPayload,
} from "@eztrack/shared";

export {
  ROLE_ORDER,
  formatRoleLabel,
  mapStaffRoleToUiRole,
  mapUiRoleToStaffRole,
};
export type { InviteUserPayload };

export type PermissionLevel = "full" | "edit" | "view" | "none";

export interface RolePermissionsRow {
  id: string;
  name: string;
  isSystem: boolean;
  permissions: Record<string, PermissionLevel>;
}

export interface FormTemplateField {
  id: string;
  label: string;
  fieldType: string;
  required: boolean;
}

export interface FormTemplateRecord {
  id: string;
  name: string;
  description: string;
  fieldCount: number;
  lastUpdated: string;
  active: boolean;
  builtIn: boolean;
  autoAttachTypes?: string;
  fields?: FormTemplateField[];
}

export interface IntegrationRecord {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  status: "connected" | "disconnected";
  detail?: string;
  apiKey?: string;
  apiUrl?: string;
  enabled: boolean;
  updatedAt?: string;
}

export const SETTINGS_MODULES = [
  "Incidents",
  "Dispatches",
  "Cases",
  "Daily Log",
  "Lost & Found",
  "BOLO",
  "Field Contacts",
  "Arrests",
  "Use of Force",
  "Reports",
  "Analytics",
  "Settings",
] as const;

const DEFAULT_ROLE_PERMISSION_PRESETS: Record<string, Record<string, PermissionLevel>> = {
  "super admin": Object.fromEntries(SETTINGS_MODULES.map((module) => [module, "full"] as const)),
  admin: Object.fromEntries(
    SETTINGS_MODULES.map((module) => [module, module === "Settings" ? "edit" : "full"] as const),
  ),
  manager: Object.fromEntries(
    SETTINGS_MODULES.map((module) => [module, ["Settings", "Analytics"].includes(module) ? "view" : "full"] as const),
  ),
  supervisor: Object.fromEntries(
    SETTINGS_MODULES.map((module) => [module, ["Settings", "Analytics", "Reports"].includes(module) ? "view" : "edit"] as const),
  ),
  officer: Object.fromEntries(
    SETTINGS_MODULES.map((module) => [module, ["Settings", "Analytics"].includes(module) ? "none" : ["Reports", "Cases"].includes(module) ? "view" : "edit"] as const),
  ),
  staff: Object.fromEntries(
    SETTINGS_MODULES.map((module) => [module, ["Incidents", "Daily Log", "Lost & Found"].includes(module) ? "view" : "none"] as const),
  ),
};

export const DEFAULT_FORM_TEMPLATES: FormTemplateRecord[] = [
  {
    id: "incident_report",
    name: "Incident Report",
    description: "Core incident report with narrative and involved parties",
    fieldCount: 24,
    lastUpdated: "2026-03-28T00:00:00.000Z",
    active: true,
    builtIn: true,
  },
  {
    id: "use_of_force_report",
    name: "Use of Force Report",
    description: "Detailed use of force documentation",
    fieldCount: 32,
    lastUpdated: "2026-03-15T00:00:00.000Z",
    active: true,
    builtIn: true,
  },
  {
    id: "arrest_report",
    name: "Arrest Report",
    description: "Arrest details, charges, and booking information",
    fieldCount: 28,
    lastUpdated: "2026-03-10T00:00:00.000Z",
    active: true,
    builtIn: true,
  },
  {
    id: "trespass_warning",
    name: "Trespass Warning",
    description: "Trespass notice with photo and signature capture",
    fieldCount: 14,
    lastUpdated: "2026-02-20T00:00:00.000Z",
    active: true,
    builtIn: true,
  },
  {
    id: "lost_and_found_form",
    name: "Lost & Found Form",
    description: "Item description, location found, and claim tracking",
    fieldCount: 16,
    lastUpdated: "2026-03-05T00:00:00.000Z",
    active: true,
    builtIn: true,
  },
  {
    id: "vehicle_incident",
    name: "Vehicle Incident",
    description: "Vehicle accident and damage reporting",
    fieldCount: 20,
    lastUpdated: "2026-01-18T00:00:00.000Z",
    active: true,
    builtIn: true,
  },
  {
    id: "injury_medical",
    name: "Injury / Medical",
    description: "Injury documentation and medical response details",
    fieldCount: 22,
    lastUpdated: "2026-02-12T00:00:00.000Z",
    active: true,
    builtIn: true,
  },
  {
    id: "evidence_log",
    name: "Evidence Log",
    description: "Evidence collection, chain of custody tracking",
    fieldCount: 12,
    lastUpdated: "2026-03-01T00:00:00.000Z",
    active: true,
    builtIn: true,
  },
  {
    id: "witness_statement",
    name: "Witness Statement",
    description: "Witness interview and signed statement",
    fieldCount: 10,
    lastUpdated: "2026-02-25T00:00:00.000Z",
    active: true,
    builtIn: true,
  },
  {
    id: "property_damage",
    name: "Property Damage",
    description: "Property damage assessment and cost estimation",
    fieldCount: 18,
    lastUpdated: "2026-01-30T00:00:00.000Z",
    active: false,
    builtIn: true,
  },
];

export const DEFAULT_INTEGRATIONS: IntegrationRecord[] = [
  {
    id: "supabase",
    name: "Supabase",
    description: "PostgreSQL database, auth, and real-time subscriptions",
    iconKey: "database",
    status: "connected",
    detail: "Project: eztrack-prod | Region: us-west-1",
    enabled: true,
  },
  {
    id: "email",
    name: "Email (SMTP)",
    description: "Outbound email notifications via SMTP relay",
    iconKey: "mail",
    status: "connected",
    detail: "smtp.sendgrid.net:587 | Verified sender",
    enabled: true,
  },
  {
    id: "sms",
    name: "SMS (Twilio)",
    description: "SMS notifications and two-factor authentication",
    iconKey: "message",
    status: "connected",
    detail: "Account SID: AC...7f3d | Phone: +1 (702) 555-0199",
    enabled: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Post incident alerts and dispatch updates to Slack channels",
    iconKey: "hash",
    status: "disconnected",
    enabled: false,
  },
  {
    id: "webhook",
    name: "Webhooks",
    description: "Send event payloads to external URLs for custom integrations",
    iconKey: "webhook",
    status: "disconnected",
    enabled: false,
  },
];

export function createDefaultRolePermissions(roleName: string): Record<string, PermissionLevel> {
  const preset = DEFAULT_ROLE_PERMISSION_PRESETS[roleName.trim().toLowerCase()];
  if (preset) {
    return { ...preset };
  }
  return Object.fromEntries(SETTINGS_MODULES.map((module) => [module, "none"] as const));
}

function isPermissionLevel(value: unknown): value is PermissionLevel {
  return value === "full" || value === "edit" || value === "view" || value === "none";
}

export function normalizePermissionMap(
  rawPermissions: unknown,
  roleName = "",
): Record<string, PermissionLevel> {
  const source =
    rawPermissions && typeof rawPermissions === "object" && !Array.isArray(rawPermissions)
      ? (rawPermissions as Record<string, unknown>)
      : {};
  const candidate =
    source.permissions && typeof source.permissions === "object" && !Array.isArray(source.permissions)
      ? (source.permissions as Record<string, unknown>)
      : source.modules && typeof source.modules === "object" && !Array.isArray(source.modules)
        ? (source.modules as Record<string, unknown>)
        : source;
  const defaults = createDefaultRolePermissions(roleName);
  const normalized: Record<string, PermissionLevel> = { ...defaults };

  for (const module of SETTINGS_MODULES) {
    const raw = candidate[module];
    if (isPermissionLevel(raw)) {
      normalized[module] = raw;
    }
  }

  return normalized;
}

export function normalizeFormTemplates(rawTemplates: unknown): FormTemplateRecord[] {
  if (!Array.isArray(rawTemplates) || rawTemplates.length === 0) {
    return DEFAULT_FORM_TEMPLATES.map((template) => ({ ...template }));
  }

  return rawTemplates
    .filter((template): template is Partial<FormTemplateRecord> & { id: string; name: string } => {
      return Boolean(template && typeof template === "object" && !Array.isArray(template) && typeof (template as { id?: unknown }).id === "string" && typeof (template as { name?: unknown }).name === "string");
    })
    .map((template) => ({
      id: template.id,
      name: template.name,
      description: typeof template.description === "string" ? template.description : "",
      fieldCount: typeof template.fieldCount === "number" ? template.fieldCount : Array.isArray(template.fields) ? template.fields.length : 0,
      lastUpdated: typeof template.lastUpdated === "string" ? template.lastUpdated : new Date().toISOString(),
      active: typeof template.active === "boolean" ? template.active : true,
      builtIn: typeof template.builtIn === "boolean" ? template.builtIn : false,
      autoAttachTypes: typeof template.autoAttachTypes === "string" ? template.autoAttachTypes : "",
      fields: Array.isArray(template.fields)
        ? template.fields
            .filter((field): field is FormTemplateField => Boolean(field && typeof field === "object" && typeof field.id === "string" && typeof field.label === "string" && typeof field.fieldType === "string"))
            .map((field) => ({
              id: field.id,
              label: field.label,
              fieldType: field.fieldType,
              required: Boolean(field.required),
            }))
        : [],
    }))
    .sort((a, b) => Number(b.builtIn) - Number(a.builtIn) || a.name.localeCompare(b.name));
}

export function normalizeIntegrations(rawIntegrations: unknown): IntegrationRecord[] {
  if (!Array.isArray(rawIntegrations) || rawIntegrations.length === 0) {
    return DEFAULT_INTEGRATIONS.map((integration) => ({ ...integration }));
  }

  return rawIntegrations
    .filter((integration): integration is Partial<IntegrationRecord> & { id: string; name: string } => {
      return Boolean(integration && typeof integration === "object" && !Array.isArray(integration) && typeof (integration as { id?: unknown }).id === "string" && typeof (integration as { name?: unknown }).name === "string");
    })
    .map((integration): IntegrationRecord => ({
      id: integration.id,
      name: integration.name,
      description: typeof integration.description === "string" ? integration.description : "",
      iconKey: typeof integration.iconKey === "string" ? integration.iconKey : "webhook",
      status: integration.status === "connected" ? "connected" : "disconnected",
      detail: typeof integration.detail === "string" ? integration.detail : undefined,
      apiKey: typeof integration.apiKey === "string" ? integration.apiKey : undefined,
      apiUrl: typeof integration.apiUrl === "string" ? integration.apiUrl : undefined,
      enabled: Boolean(integration.enabled),
      updatedAt: typeof integration.updatedAt === "string" ? integration.updatedAt : undefined,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
