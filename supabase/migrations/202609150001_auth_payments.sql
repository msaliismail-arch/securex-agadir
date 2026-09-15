-- SÉCUREX CONNECT: Supabase Auth linkage, deposits, promo waivers and Stripe ledger.
-- Run this once in the Supabase SQL editor before deploying the application.

alter table public."Client"
  add column if not exists "supabaseUserId" text unique,
  alter column "passwordHash" drop not null;

alter table public."Appointment"
  add column if not exists "totalAmountCents" integer not null default 0,
  add column if not exists "depositAmountCents" integer not null default 0,
  add column if not exists "amountPaidCents" integer not null default 0,
  add column if not exists "balanceDueCents" integer not null default 0,
  add column if not exists "paymentStatus" text not null default 'NOT_REQUIRED',
  add column if not exists "promoCodeId" text;

create table if not exists public."PromoCode" (
  "id" text primary key,
  "code" text not null unique,
  "description" text,
  "active" boolean not null default true,
  "maxUses" integer,
  "usageCount" integer not null default 0,
  "validFrom" timestamp(3) not null default current_timestamp,
  "expiresAt" timestamp(3),
  "createdById" text not null,
  "createdByName" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp
);

create index if not exists "PromoCode_active_validFrom_expiresAt_idx"
  on public."PromoCode" ("active", "validFrom", "expiresAt");

do $$ begin
  alter table public."Appointment"
    add constraint "Appointment_promoCodeId_fkey"
    foreign key ("promoCodeId") references public."PromoCode"("id") on delete set null;
exception when duplicate_object then null;
end $$;

create table if not exists public."Payment" (
  "id" text primary key,
  "appointmentId" text not null references public."Appointment"("id") on delete cascade,
  "stripeCheckoutSessionId" text not null unique,
  "stripePaymentIntentId" text unique,
  "amountCents" integer not null,
  "currency" text not null default 'mad',
  "status" text not null default 'PENDING',
  "paidAt" timestamp(3),
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp
);

create index if not exists "Payment_appointmentId_status_idx"
  on public."Payment" ("appointmentId", "status");

create table if not exists public."StripeWebhookEvent" (
  "id" text primary key,
  "stripeEventId" text not null unique,
  "type" text not null,
  "processedAt" timestamp(3) not null default current_timestamp
);

create index if not exists "Appointment_clientId_paymentStatus_idx"
  on public."Appointment" ("clientId", "paymentStatus");

-- Browser clients must never receive broad table access. Prisma uses the server-side
-- database role; authenticated clients only get the narrow ownership policies below.
alter table public."Client" enable row level security;
alter table public."Vehicle" enable row level security;
alter table public."Appointment" enable row level security;
alter table public."InspectionResult" enable row level security;
alter table public."Payment" enable row level security;
alter table public."PromoCode" enable row level security;
alter table public."StripeWebhookEvent" enable row level security;
alter table public."AdminUser" enable row level security;
alter table public."AuditLog" enable row level security;
alter table public."OtpRequest" enable row level security;
alter table public."Setting" enable row level security;
alter table public."Category" enable row level security;
alter table public."Service" enable row level security;
alter table public."Announcement" enable row level security;
alter table public."WebsiteContent" enable row level security;
alter table public."DailyCapacity" enable row level security;

drop policy if exists "clients_select_own" on public."Client";
create policy "clients_select_own" on public."Client" for select to authenticated
  using ("supabaseUserId" = auth.uid()::text);

drop policy if exists "clients_update_own" on public."Client";
create policy "clients_update_own" on public."Client" for update to authenticated
  using ("supabaseUserId" = auth.uid()::text)
  with check ("supabaseUserId" = auth.uid()::text);

drop policy if exists "vehicles_select_own" on public."Vehicle";
create policy "vehicles_select_own" on public."Vehicle" for select to authenticated
  using (exists (
    select 1 from public."Client" c
    where c."id" = "Vehicle"."clientId" and c."supabaseUserId" = auth.uid()::text
  ));

drop policy if exists "appointments_select_own" on public."Appointment";
create policy "appointments_select_own" on public."Appointment" for select to authenticated
  using (exists (
    select 1 from public."Client" c
    where c."id" = "Appointment"."clientId" and c."supabaseUserId" = auth.uid()::text
  ));

drop policy if exists "inspection_results_select_own" on public."InspectionResult";
create policy "inspection_results_select_own" on public."InspectionResult" for select to authenticated
  using (exists (
    select 1
    from public."Appointment" a
    join public."Client" c on c."id" = a."clientId"
    where a."id" = "InspectionResult"."appointmentId"
      and c."supabaseUserId" = auth.uid()::text
  ));

drop policy if exists "payments_select_own" on public."Payment";
create policy "payments_select_own" on public."Payment" for select to authenticated
  using (exists (
    select 1
    from public."Appointment" a
    join public."Client" c on c."id" = a."clientId"
    where a."id" = "Payment"."appointmentId"
      and c."supabaseUserId" = auth.uid()::text
  ));

revoke all on public."PromoCode", public."StripeWebhookEvent", public."AdminUser", public."AuditLog" from anon, authenticated;
revoke all on public."OtpRequest", public."Setting" from anon, authenticated;

drop policy if exists "categories_public_read" on public."Category";
create policy "categories_public_read" on public."Category" for select to anon, authenticated using (true);

drop policy if exists "services_public_read" on public."Service";
create policy "services_public_read" on public."Service" for select to anon, authenticated using ("active" = true);

drop policy if exists "announcements_public_read" on public."Announcement";
create policy "announcements_public_read" on public."Announcement" for select to anon, authenticated using ("visible" = true);

drop policy if exists "website_content_public_read" on public."WebsiteContent";
create policy "website_content_public_read" on public."WebsiteContent" for select to anon, authenticated using (true);

drop policy if exists "capacity_public_read" on public."DailyCapacity";
create policy "capacity_public_read" on public."DailyCapacity" for select to anon, authenticated using (true);
