<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
</p>

# EZTrack OS

**Open-source incident management and event operations platform.**

EZTrack is a full-stack command center for security teams, event operators, and property managers. It replaces radio logs, paper reports, and scattered spreadsheets with a unified real-time platform — designed with Palantir-grade data architecture and Shopify-quality UX.

---

## Features

### Core Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time KPI cards, activity feed, and quick actions |
| **Incidents** | Full lifecycle management with narratives, participants, financials, and media |
| **Dispatch** | Priority-based call dispatch with officer assignment and status tracking |
| **Daily Log** | Rapid-entry event logging with escalation-to-incident workflow |
| **Cases** | Investigative case management with evidence chain-of-custody and task tracking |
| **Work Orders** | Maintenance and repair tracking with assignment, scheduling, and cost estimates |
| **Lost & Found** | Item intake, matching, claim/release, and disposal workflows |
| **Patrons** | Person-of-interest database with flags, bans, photos, and encounter history |
| **Visitors** | Pre-registration, sign-in/sign-out, NDA tracking, and badge management |
| **Vehicles** | Vehicle registry with plate lookups, owner linking, and incident association |
| **Contacts** | External contacts directory — vendors, law enforcement, emergency services |
| **Personnel** | Staff roster with roles, shifts, zones, certifications, and availability |
| **Briefings** | Shift briefings and operational bulletins with priority and recipient targeting |
| **Anonymous Reports** | Public-facing anonymous tip submission with admin review queue |
| **Analytics** | Module-specific charts and trend analysis |
| **Reports** | Exportable reports by module, date range, and custom filters |
| **Alerts & Notifications** | Configurable event-driven alerts via push, email, and SMS |

### Platform Capabilities

- **Real-time Supabase backend** — Row-level security, soft deletes, auto-generated record numbers
- **Zod-validated forms** — Every create/edit modal uses schema-driven validation with inline error messages
- **Responsive design** — iOS 26-grade design system with 13px base typography, 36px touch targets
- **Full dark mode** — CSS custom properties with seamless light/dark switching
- **Role-based access** — Organization-scoped data with profile-based permissions
- **Monorepo architecture** — Shared packages for UI, API, and business logic

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **UI** | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/) |
| **Backend** | [Supabase](https://supabase.com/) (Postgres, Auth, Realtime, Storage) |
| **Validation** | [Zod 3](https://zod.dev/) with custom `useFormState` hook |
| **State** | [Zustand 5](https://zustand.docs.pmnd.rs/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Dates** | [date-fns 4](https://date-fns.org/) |
| **Monorepo** | [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/) |
| **Language** | TypeScript 5.8 (strict mode) |

---

## Project Structure

```
eztrack-os/
├── apps/
│   ├── web/                    # Main Next.js dashboard app
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/     # Login, signup, forgot-password
│   │   │   │   └── (dashboard)/ # All authenticated routes
│   │   │   │       ├── dashboard/
│   │   │   │       ├── incidents/
│   │   │   │       ├── dispatch/
│   │   │   │       ├── daily-log/
│   │   │   │       ├── cases/
│   │   │   │       ├── work-orders/
│   │   │   │       ├── lost-found/
│   │   │   │       ├── patrons/
│   │   │   │       ├── visitors/
│   │   │   │       ├── vehicles/
│   │   │   │       ├── contacts/
│   │   │   │       ├── personnel/
│   │   │   │       ├── briefings/
│   │   │   │       ├── anonymous-reports/
│   │   │   │       ├── analytics/
│   │   │   │       ├── reports/
│   │   │   │       ├── alerts/
│   │   │   │       ├── notifications/
│   │   │   │       └── settings/
│   │   │   ├── components/
│   │   │   │   ├── ui/         # Design system primitives (Button, Input, Select, etc.)
│   │   │   │   ├── modals/     # FormModal, WizardModal, ConfirmModal + per-module modals
│   │   │   │   ├── layout/     # Sidebar, TopBar, MobileNav
│   │   │   │   └── data/       # DataGrid, DataCard, charts
│   │   │   ├── hooks/          # useFormState, useToast, useAuth, etc.
│   │   │   ├── lib/
│   │   │   │   ├── queries/    # Typed Supabase query functions per module
│   │   │   │   ├── validations/ # Zod schemas per module
│   │   │   │   ├── supabase/   # Client & server Supabase helpers
│   │   │   │   └── utils/      # Formatting, time, helpers
│   │   │   └── stores/         # Zustand stores
│   │   └── package.json
│   ├── mobile/                 # Expo React Native app (planned)
│   └── wall-display/           # Kiosk/wall display app (planned)
├── packages/
│   ├── api/                    # Shared API layer
│   ├── shared/                 # Business logic & types
│   └── ui/                     # Shared UI components
├── turbo.json                  # Turborepo pipeline config
├── pnpm-workspace.yaml         # Monorepo workspace config
└── .env.example                # Environment variable template
```

---

## Getting Started

### Prerequisites

- **Node.js** 18.17+ (recommended: 20+)
- **pnpm** 10+ (`npm install -g pnpm`)
- **Supabase** account (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/ezxslife/eztrack-os.git
cd eztrack-os
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Start development

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### 5. Build for production

```bash
pnpm build
```

---

## Database Schema

EZTrack uses Supabase (Postgres) with the following conventions:

- **Soft deletes** — All tables use a `deleted_at` timestamp column; queries filter with `.is("deleted_at", null)`
- **Auto record numbers** — `supabase.rpc("next_record_number", { p_org_id, p_prefix })` generates sequential IDs (e.g., `INC-0042`, `WO-0108`)
- **Organization scoping** — Every row belongs to an `org_id`; Row Level Security policies enforce tenant isolation
- **Enums** — `case_status`, `incident_status`, `incident_severity`, `dispatch_priority`, `dispatch_status`, `work_order_status`, `lost_found_status`, `daily_log_status`, `patron_flag`
- **Profile-based auth** — Supabase Auth with a `profiles` table extending user data (org, role, avatar)

---

## Architecture Patterns

### Query Layer
Each module has a typed query file in `lib/queries/`:
```typescript
// lib/queries/incidents.ts
export async function fetchIncidents(): Promise<IncidentRow[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("incidents")
    .select("*, reporter:profiles!reported_by(full_name, avatar_url)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  // ... camelCase mapping
}
```

### Form Validation
Every form modal uses `useFormState` + Zod schemas:
```typescript
const form = useFormState({
  initialValues: { title: "", priority: "medium" },
  schema: createIncidentSchema,  // Zod schema
});

// In JSX:
<Input
  value={form.values.title}
  onChange={(e) => form.setValue("title", e.target.value)}
  error={form.touched.title ? form.errors.title : undefined}
/>
```

### Component Architecture
- **FormModal** — Standard create/edit modal with validation-aware submit button
- **WizardModal** — Multi-step forms with per-step validation
- **ConfirmModal** — Destructive action confirmation
- **DataGrid** — Sortable, filterable data tables with row actions
- **StatusChangeModal** — Reusable status transition workflows

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps for production |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm clean` | Remove build artifacts and caches |

---

## Roadmap

- [ ] Realtime subscriptions (live dispatch board, activity feeds)
- [ ] Optimistic UI updates for create/edit operations
- [ ] Cross-module workflows (incident → case escalation, log → dispatch)
- [ ] Global search across all modules
- [ ] Mobile app (Expo React Native)
- [ ] Wall display mode for command centers
- [ ] File/media upload with Supabase Storage
- [ ] PDF report generation and export
- [ ] Webhook integrations and API endpoints
- [ ] Audit trail and activity logging

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with care by the EZTrack team.
</p>
