# settle/ — events-mode chrome stylesheets

This directory holds a verbatim copy of the ezxs-settle stylesheet bundle. It is the canonical visual language for **events mode** in ezxs-track per `CLAUDE.md` → "Theme — split by mode".

## Files (copied from `ezxs-settle/app/src/styles/`)

| File           | Provides                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| `tokens.css`   | Settle iOS 26 + Laylo-inspired CSS variables (light + dark)              |
| `laylo.css`    | Layout primitives — `.app`, `.main`, `.btn`, `.card`, `.stat-card`, `.chip`, `.tabs`, `.table`, `.toggle`, `.banner`, `.status`, `.input`, `.empty`, `.drop-tile`, `.card-glass`, etc. |
| `sidebar.css`  | Desktop sidebar chrome — `.sidebar`, `.brand`, `.nav-item`, `.cta-quickadd`, `.workspace-card`, `.upgrade-card` |
| `mobile.css`   | Mobile bottom-bar + slide-up drawer + Quick Add sheet                    |
| `drilldown.css`| Right-rail drilldown panel                                                |
| `assistant.css`| AI assistant floating panel                                               |
| `public.css`   | Public-facing pages (login, OAuth landing)                                |

## Import contract

**ONLY** import `./index.css` from `apps/web/src/app/(events-mode)/layout.tsx`. Never:

- Import from `apps/web/src/app/layout.tsx` (root) — would leak into security mode.
- Import from `apps/web/src/app/globals.css` — same leakage problem.
- Import from any `(dashboard)/*` layout or page — that's security mode, hands off.

Next.js App Router scopes CSS imports made inside a route segment to that segment only. Putting the import in `(events-mode)/layout.tsx` ensures security-mode pages never load these stylesheets, so the existing eztrack-os design system stays authoritative there.

## Anchor attribute

The `(events-mode)` layout root **must** set `data-venue-mode="events"`:

```tsx
// apps/web/src/app/(events-mode)/layout.tsx
import "@/styles/settle/index.css";

export default function EventsModeLayout({ children }: { children: React.ReactNode }) {
  return <div data-venue-mode="events">{children}</div>;
}
```

This gives future overrides a stable selector hook (`[data-venue-mode="events"] .something { ... }`) without affecting security mode.

## Refresh from settle

When ezxs-settle bumps its tokens or primitives, re-copy:

```bash
cp ezxs-settle/app/src/styles/{tokens,laylo,sidebar,mobile,drilldown,public,assistant}.css \
   ezxs-track/apps/web/src/styles/settle/
```

Do **not** edit these files in place — the diff back to settle is the only thing keeping the two products in visual sync.
