# Task 10+11 — Admin Terminal + Super Admin Dashboard

Agent: full-stack-developer (Admin Terminal + Super Admin)
Scope: `/admin/select-account`, `/admin/login`, `/admin/dashboard/**`

## Files created
- `src/app/admin/select-account/page.tsx` — Cyberpunk terminal role picker (black bg, terminal-grid + scanlines + scan-line-anim, typewriter boot sequence, 3 hexagon role cards with per-role accent glow, framer-motion staggered reveal).
- `src/app/admin/login/page.tsx` — OTP login (dark navy bg, accent border per role, pre-filled readonly email, 2-step OTP via shadcn InputOTP, demo hint 123456, redirect to role route on success).
- `src/app/admin/dashboard/layout.tsx` — Server component auth guard (SUPER role) + metadata noindex.
- `src/app/admin/dashboard/_components/dashboard-shell.tsx` — Client shell (navy sidebar, emerald active state, mobile Sheet, top bar with page title + avatar, logout).
- `src/app/admin/dashboard/page.tsx` — Dashboard home: 8 stat KPI cards, 3 recharts (area trend / status donut / category bar), today's RDV list, recent audit.
- `src/app/admin/dashboard/categories/page.tsx` — Collapsible categories with nested services table, create/edit dialogs (icon + color + slug + sort), AlertDialog delete confirm.
- `src/app/admin/dashboard/tarifs/page.tsx` — Inline editable price/duration table grouped by category, per-row save + bulk "Tout enregistrer".
- `src/app/admin/dashboard/annonces/page.tsx` — Announcements CRUD with pinned/visible toggles, category select (INFO/PROMO/MAINTENANCE/ALERT), orange accent.
- `src/app/admin/dashboard/appointments/page.tsx` — Full RDV management: status/date/search filters, table, detail dialog with inspection result, create/edit form, status dropdown, delete confirm, green accent.
- `src/app/admin/dashboard/clients/page.tsx` — Clients list + detail dialog (contact, vehicles, appointment history), blue accent.
- `src/app/admin/dashboard/analytics/page.tsx` — 4 KPI cards + monthly trend line, revenue area, pass/fail donut, busiest slots bar, category bar. Indigo accent.
- `src/app/admin/dashboard/audit/page.tsx` — Read-only audit log table with role/action/search filters, color-coded action badges, gray accent.
- `src/app/admin/dashboard/users/page.tsx` — Admin users CRUD (role select, active toggle, cannot delete self), emerald accent.
- `src/app/admin/dashboard/settings/page.tsx` — Contact / hours / slot duration settings forms, PUT /api/settings, gray accent.

## Key decisions
- **No shared shell with other admin spaces** — the dashboard has its own `_components/dashboard-shell.tsx`; does NOT import from `/admin/rdv` or `/admin/checkin`.
- **Stats resilience** — discovered `/api/stats` 500s (foundation bug: `_sum: { _count: true }` is invalid Prisma). Per the constraint "Do NOT modify API routes", I added a client-side `computeStats()` fallback in the dashboard home and analytics pages that derives the same shape from `/api/appointments` + `/api/clients` + `/api/announcements`. The dashboard tries `/api/stats` first; on failure it computes locally. Result: dashboard fully functional.
- **Announcements visibility note** — `/api/announcements` GET filters `visible: true`, so hidden ones disappear from the admin list. Added an info banner explaining this; toggling visible off works but removes the row (cannot be re-shown from this UI per API limitation).
- **Auth guard** — `layout.tsx` is a server component using `getSession()` + `redirect()` for clean SSR guard; `metadata.robots = { index: false, follow: false }` for noindex.
- **Color coding per spec** — Appointments→green, Announcements→orange, Analytics→indigo, Audit→gray, Users→emerald, Settings→gray, Tarifs→emerald, Categories→emerald, Clients→blue.
- **Mobile** — sidebar collapses via shadcn Sheet on `<lg`; all tables wrapped in `scroll-thin max-h-* overflow-auto`; grids reflow to single column.

## Verified
- All 13 routes return 200 (server-rendered shell + client hydration).
- `bun run lint` clean (no errors, no warnings).
- All admin API endpoints respond correctly with SUPER session (stats 500 handled by fallback; appointments/audit/clients/users/settings/announcements all 200).
