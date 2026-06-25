# SÉCUREX CONNECT — PROJECT MAP

> Source of truth for the entire codebase. Updated continuously under the
> Execution Engine & Surgical Editing protocols.

## TECH_STACK

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons + Framer Motion
- **Database**: Prisma ORM (SQLite) — `prisma/schema.prisma`, client at `src/lib/db.ts`
- **Auth**: Custom JWT sessions (`jose`) in httpOnly cookies + simulated OTP (demo code `123456`)
- **State**: Zustand (client) + TanStack Query (server) + react-hook-form + zod
- **QR**: `qrcode` (generation) + `html5-qrcode` (camera scan)
- **PDF**: `jspdf` (client-side certificate generation)
- **Charts**: `recharts`
- **Fonts**: Inter (UI) + JetBrains Mono (admin terminal)

### Folder structure
```
src/
  app/
    (public)/            # public marketing pages (home, tarifs, documents, faq, contact)
    rendez-vous/         # booking wizard
    espace-client/       # client space
    admin/
      select-account/    # cyberpunk terminal role picker
      login/             # admin OTP login
      dashboard/         # Super Admin (level 3, green) — full
      rdv/               # Validation Admin (level 2, blue) — appointments + validation
      checkin/           # QR Verification / Reception (level 1, orange) — mobile-first
    api/                 # REST API routes
  components/
    ui/                  # shadcn/ui primitives
    public/              # public site sections (header, footer, hero…)
    admin/               # admin shells + widgets
    client/              # client space components
    shared/              # cross-cutting (logo, theme, color helpers)
  lib/
    auth.ts              # JWT sessions + RBAC guards
    db.ts                # Prisma client
    constants.ts         # brand, colors, nav, demo data
    qr.ts                # QR generation
    pdf.ts               # certificate generation
    utils.ts             # cn + helpers
  hooks/
```

## SYSTEM_FLOW

### Public → Client
1. Public home (`/`) → browse services / pricing / announcements / contact
2. Book appointment (`/rendez-vous`) → 4-step wizard:
   category → service → date/time → client+vehicle info + confirm
3. **Success screen**: generates a **6-character reference code** (e.g. `SX-7K2Q9`).
   The QR code is **NOT** shown here (per spec — QR is only generated after validation).
4. Client space (`/espace-client`) — phone + OTP login → dashboard shows upcoming
   RDV with reference code; after validation, shows the validation QR + downloadable
   certificate PDF.

### Admin access
- Discreet "Espace Administrateur" link in public footer → `/admin/select-account`
- Cyberpunk terminal: 3 role cards → `/admin/login?role=…` (email pre-filled, readonly)
  → OTP `123456` → redirect to the role's space.

### Three SEPARATE admin spaces (no shared sidebar, no cross-role UI bleed)
| Role | Route | Level | Accent | Scope |
|------|-------|-------|--------|-------|
| Super Admin (Admin Général) | `/admin/dashboard` | 3 | emerald | Full: dashboard, categories, services, pricing, schedules, announcements, users, appointments, analytics, audit log, settings |
| Validation Admin (Gestion RDV) | `/admin/rdv` | 2 | blue | Appointments table + calendar, create/edit/cancel, **review → approve/reject → generate validation QR** on approval |
| QR Verification (Réception) | `/admin/checkin` | 1 | orange | Mobile-first. Camera QR scan OR 6-char manual entry. Fullscreen success/fail. Validations-today counter. Audit-logged silently. |

### Appointment lifecycle (status)
`PENDING` (booked) → `APPROVED` (validation admin approves, **QR token + QR generated here**)
→ `COMPLETED` (inspection done) → client downloads certificate.
Or `REJECTED` / `CANCELLED`.

> **Resolved ambiguity**: the two input specs conflict on when the QR is shown.
> The English "UI/UX & Features Requirements" is treated as authoritative and more
> specific: **QR is NOT shown at booking**. Booking emits only a 6-char reference
> code. The validation QR (inspection certificate) is generated only after the
> Validation Admin approves the completed inspection. Reception check-in uses the
> 6-char manual code (primary) and the camera QR scanner (for verifying post-
> validation certificate QRs). Both resolve to the same appointment.

## COLOR SYSTEM (token-based, applied everywhere)

Brand: navy `#1A2332`, emerald `#1F7A4D`, info blue `#2D9CDB`, bg `#FAF9F6`,
surface `#FFFFFF`/`#E8E6E1`, text-2 `#6B7280`, warning `#F2994A`, danger `#EB5757`.

Category color coding (consistent app-wide):
- Inspection Services → Blue
- Appointments → Green
- Announcements → Orange
- Validation & Approval → Purple
- QR Verification → Cyan
- Statistics & Analytics → Indigo
- Settings → Gray
- Pricing → Emerald
- Contact & Location → Red

Admin terminal accent (select-account): Super=green `#00FF88`, Validation=blue `#2D9CDB`, Reception=orange `#F2994A`.

## DEMO DATA
- Address: 14 rue Cadi Ayad, Q.I., Agadir
- Hours: Lun–Ven 8h–18h / Sam 8h–13h
- Currency: MAD
- Phone: +212 528 84 12 34 · Email: contact@securex-connect.ma
- Social: facebook.com/securexconnect · instagram.com/securexconnect · linkedin.com/company/securexconnect

## ORPHANS
_(none)_

## PENDING
_(none — see TODO list in main session)_
