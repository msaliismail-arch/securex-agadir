# Task 12+13 — Validation Admin (Gestion RDV) + QR Verification (Réception)

**Agent:** full-stack-developer (Validation + Checkin)
**Task ID:** 12+13
**Scope:** Build `/admin/rdv` (level 2, blue accent) and `/admin/checkin` (level 1, orange accent) + new `POST /api/appointments/[id]/result` endpoint.

## Files created (all under allowed paths)

### New API route
- `src/app/api/appointments/[id]/result/route.ts` — POST creates/updates InspectionResult (upsert by appointmentId), sets appointment.status="COMPLETED", audit-logs `APPOINTMENT_COMPLETED` + `INSPECTION_RESULT`. Guard: SUPER + VALIDATION. Auto-computes overall = FAIL if any sub-result is FAIL. Also exposes GET to fetch the inspection result for an appointment.

### Validation Admin (`src/app/admin/rdv/`)
- `layout.tsx` — server component, `getSession()` guard → redirect `/admin/login?role=VALIDATION` if no session or wrong role. Renders `<RdvShell>` (own navy sidebar, blue accent). metadata: `robots noindex,nofollow`, title "Gestion RDV — SÉCUREX CONNECT".
- `page.tsx` — Planning (table view): filters bar (status / date / search / Aujourd'hui quick), 5 mini-stats, full table with code/client/vehicle/category/service/date·slot/status/actions. Row click → detail sheet. Per-row actions depend on status (PENDING→Valider/Rejeter/Voir; APPROVED→QR généré+Terminer; COMPLETED→Résultat/QR). Empty state + loading skeletons. "Nouveau RDV" button.
- `calendar/page.tsx` — Month grid built from scratch (Monday-first), each day shows count + colored status dots. Click day → side panel below with that day's appointments. Prev/Next/Today nav. Legend.
- `pending/page.tsx` — Work queue of PENDING appointments as numbered cards. Sort (soonest/oldest). Per-card Valider/Rejeter/Voir.
- `approved/page.tsx` — Grid of APPROVED appointments with their QR codes visible (generated client-side via `generateQrDataUrl`). "Marquer terminé" action.

### Shared RDV components (`src/app/admin/rdv/_components/`)
- `rdv-shell.tsx` — own navy sidebar (NOT shared with super admin), 4 nav items (Planning, Vue calendrier, En attente, Validés), Déconnexion (POST /api/auth/logout → /admin/select-account). Mobile Sheet. Top bar with page title + "Gestion RDV" badge. Provides RdvAdminContext.
- `rdv-context.tsx` — React Context exposing adminName/adminEmail to pages.
- `rdv-dialogs.tsx` — `useRdvDialogs()` hook + `<RdvDialogHost>` mounting all dialogs based on state.
- `validation-dialog.tsx` — KEY feature: confirm phase (inspector name + notes) → "Approuver & générer le QR" → PATCH /api/appointments/[id] {status:"APPROVED", notes} → success phase with QR displayed (generateQrDataUrl), 6-char code highlighted, framer-motion spring reveal.
- `reject-dialog.tsx` — reason textarea (required) → PATCH {status:"REJECTED", notes}.
- `complete-dialog.tsx` — 5 sub-results (brakes/lights/tires/emissions/bodywork) as PASS/FAIL radios, auto-computed overall, inspector + notes → POST /api/appointments/[id]/result.
- `new-rdv-dialog.tsx` — full booking form (client + vehicle + prestation + créneau) → POST /api/appointments (uses existing public booking route). Validates MA phone + plate.
- `detail-sheet.tsx` — right Sheet with full appointment info, QR (if any), inspection result (if any), system dates, contextual footer actions (Valider/Rejeter for PENDING, Marquer terminé for APPROVED).
- `qr-display.tsx` — async QR generator (uses generateQrDataUrl from @/lib/qr) with skeleton.
- `badges.tsx` — `<StatusBadge>` (STATUS_META + COLOR_MAP) + `<CategoryBadge>`.
- `use-appointments.ts` — `useAppointments` (filters + refresh), `useCatalog` (categories+services), `buildLookups` helpers. Avoids setState-in-effect lint rule.
- `types.ts` — Appointment / Category / Service / InspectionResult TS interfaces.

### Reception (`src/app/admin/checkin/`)
- `layout.tsx` — server component, `getSession()` guard → redirect `/admin/login?role=RECEPTION` if no session or wrong role. Renders `<CheckinShell>` (minimal top bar, NO sidebar, orange accent, max-w-2xl, sticky footer). metadata: `robots noindex,nofollow`, title "Réception — SÉCUREX CONNECT".
- `_components/checkin-shell.tsx` — minimal top bar (Logo + "RÉCEPTION" label orange + admin name + Déconnexion), centered content, sticky footer.
- `page.tsx` — the check-in screen:
  - Counter at top: "Validations aujourd'hui" from /api/stats (todayCheckins). Gracefully shows "—" if /api/stats fails.
  - Tabs: "Scan QR" + "Code manuel".
  - Scan mode: html5-qrcode (`new Html5Qrcode("reader")`, `start({ facingMode: "environment" })`). Scanning frame overlay with orange corners + animated scan line. Camera permission errors → fallback message + "Saisie manuelle" button. Stops camera on unmount, on result show, and after a successful scan (3s debounce on same token).
  - Manual mode: 6 large input boxes (h-14 w-12 sm:h-16 sm:w-14, font-mono text-2xl/3xl), auto-uppercase + filter to A-Z0-9, auto-focus next, backspace-to-previous, paste support.
  - Result view (full screen, framer-motion spring reveal): SUCCESS (emerald banner + huge queue number text-7xl/8xl in orange + details + counter footer + "Nouvelle vérification"), NOT-APPROVED (amber warning banner explaining PENDING/REJECTED/CANCELLED), NOT-FOUND (red banner + retry tips). All results have "Réessayer"/"Nouvelle vérification" reset button.

## Key decisions
- **Strict separation**: `/admin/rdv` and `/admin/checkin` share ZERO components with `/admin/dashboard`. Each has its own shell, sidebar (or lack thereof), and accent color.
- **Color discipline**: blue (#2D9CDB) primary accent for the rdv space; purple specifically for the approve/validate/complete actions; orange (#F2994A) for the reception space; emerald for the success banner. No indigo.
- **API contract respected**: PATCH /api/appointments/[id] auto-generates qrToken on APPROVED (already in foundation); my validation dialog relies on this and displays the returned qrToken client-side via generateQrDataUrl.
- **New endpoint created (not modifying existing)**: POST /api/appointments/[id]/result — does NOT touch /api/appointments/[id]/route.ts. Upserts InspectionResult + sets COMPLETED + double audit-log.
- **Camera lifecycle**: scanner.stop().then(clear()) on unmount, on result show, and after a successful scan. 3s debounce on the same decoded token to avoid double-firing.
- **Stats graceful degradation**: /api/stats has a pre-existing Prisma aggregate bug (not mine to fix per rules). My checkin page handles r.ok === false by showing "—". When the bug is fixed elsewhere, the counter will populate automatically.
- **Lint clean**: 0 errors in my files. Fixed `react-hooks/static-components` (moved SidebarInner out of component body) and `react-hooks/set-state-in-effect` (removed synchronous setLoading(true) in effect; loading is set false only in finally — better stale-while-revalidate UX on filter change).

## Verification (curl, authenticated)
- POST /api/appointments/{id}/result → 201, sets COMPLETED, returns updated appt + result ✓
- GET /admin/rdv (authed VALIDATION) → 200, renders "Planning" + "Gestion RDV" ✓
- GET /admin/rdv/{calendar,pending,approved} (authed) → 200 ✓
- GET /admin/checkin (authed RECEPTION) → 200, renders "Vérification de réservation" + "Validations aujourd" ✓
- POST /api/verify {code:"WYAR82"} (authed RECEPTION) → 200 found:true with COMPLETED appointment ✓
- POST /api/verify {code:"ZZZZZZ"} → 200 found:false with message ✓
- All guards redirect unauthenticated users to /admin/login?role=… (307) ✓
- `bun run lint` — 0 errors in my files (1 pre-existing warning in another agent's file).
