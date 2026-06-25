"use client";

import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2,
  Phone,
  ShieldCheck,
  CalendarDays,
  Award,
  Car,
  QrCode,
  ChevronRight,
  CalendarClock,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Plus,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { COLOR_MAP, DEMO_OTP } from "@/lib/constants";
import { cn, formatDate, isValidMaPhone, normalizePhone } from "@/lib/utils";
import {
  type AppointmentItem,
  type VehicleItem,
  useClientData,
  computeVehicleStatus,
  VEHICLE_STATUS_META,
} from "@/components/client/types";
import { StatusBadge } from "@/components/client/badges";
import { QrDialog } from "@/components/client/qr-dialog";

const phoneSchema = z.object({
  phone: z
    .string({ required_error: "Téléphone requis" })
    .refine(isValidMaPhone, "Numéro marocain invalide (format +212)"),
});
type PhoneValues = z.infer<typeof phoneSchema>;

export default function EspaceClientPage() {
  const [sessionChecked, setSessionChecked] = React.useState(false);
  const [hasSession, setHasSession] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!active) return;
        const data = await res.json();
        setHasSession(!!(data && data.role === "CLIENT"));
      } catch {
        if (active) setHasSession(false);
      } finally {
        if (active) setSessionChecked(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!sessionChecked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-brand" />
      </div>
    );
  }

  return hasSession ? <Dashboard /> : <LoginScreen />;
}

/* --------------------------------- Login ---------------------------------- */
function LoginScreen() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState("");
  const [clientName, setClientName] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  const form = useForm<PhoneValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "+212 " },
    mode: "onTouched",
  });

  const sendOtp = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/client-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: values.phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erreur lors de l'envoi du code");
      }
      setPhone(normalizePhone(values.phone));
      setClientName(data?.name ?? null);
      setStep("otp");
      toast.success("Code OTP envoyé par " + (data?.demoOtp ? "simulation" : "SMS"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'envoi du code");
    } finally {
      setSubmitting(false);
    }
  });

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Veuillez saisir les 6 chiffres du code.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/client-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Code OTP invalide ou expiré");
      }
      toast.success("Connexion réussie. Bienvenue !");
      // Full reload so the layout's session check re-runs and the shell appears.
      window.location.href = "/espace-client";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de vérification");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-10 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-brand/10">
            <ShieldCheck className="h-7 w-7 text-emerald-brand" />
          </div>
          <h1 className="text-2xl font-bold text-navy md:text-3xl">Espace Client</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {step === "phone"
              ? "Connectez-vous pour suivre vos rendez-vous et certificats."
              : `Bonjour${clientName ? `, ${clientName}` : ""}. Saisissez le code reçu par SMS.`}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {step === "phone" ? (
              <Form {...form}>
                <form onSubmit={sendOtp} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="+212 6 12 34 56 78"
                              className="pl-9"
                              inputMode="tel"
                              autoComplete="tel"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-emerald-brand hover:bg-emerald-brand/90" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Recevoir le code
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-navy">Code de vérification</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saisissez les 6 chiffres reçus au {phone}.
                  </p>
                </div>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    containerClassName="justify-center"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={verifyOtp} className="w-full bg-emerald-brand hover:bg-emerald-brand/90" disabled={submitting || otp.length !== 6}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Se connecter
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-xs text-muted-foreground hover:text-emerald-brand"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                  }}
                >
                  ← Modifier le numéro
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-info/30 bg-info/5 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-info" />
          <div>
            <p className="font-medium text-navy">Mode démonstration</p>
            <p className="mt-0.5">
              Code OTP de test : <span className="font-mono font-bold text-emerald-brand">{DEMO_OTP}</span>. Veuillez
              d&apos;abord prendre un rendez-vous pour qu&apos;un compte soit créé.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Pas encore de rendez-vous ?{" "}
          <a href="/rendez-vous" className="font-medium text-emerald-brand hover:underline">
            Prendre rendez-vous
          </a>
        </p>
      </motion.div>
    </div>
  );
}

/* ------------------------------- Dashboard -------------------------------- */
function Dashboard() {
  const { data, loading, error, unauthorized } = useClientData();
  const [qrAppt, setQrAppt] = React.useState<AppointmentItem | null>(null);

  React.useEffect(() => {
    if (unauthorized) {
      // Session expired — force a full reload to show the login screen.
      window.location.reload();
    }
  }, [unauthorized]);

  if (loading || unauthorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-brand" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {error || "Impossible de charger vos données."}
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const upcoming = data.appointments
    .filter((a) => (a.status === "PENDING" || a.status === "APPROVED") && new Date(a.date) >= new Date(now.setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const validated = data.appointments.filter((a) => a.status === "COMPLETED" && a.result?.overallResult === "PASS");

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-brand">
            Tableau de bord
          </p>
          <h1 className="mt-1 text-2xl font-bold text-navy md:text-3xl">
            Bonjour, {data.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Voici l&apos;état de vos rendez-vous et de vos véhicules.
          </p>
        </div>
        <Button asChild className="bg-emerald-brand hover:bg-emerald-brand/90">
          <a href="/rendez-vous">
            <Plus className="mr-1.5 h-4 w-4" /> Nouveau RDV
          </a>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="RDV à venir"
          value={upcoming.length}
          tone="emerald"
        />
        <StatCard
          icon={<Award className="h-5 w-5" />}
          label="Contrôles validés"
          value={validated.length}
          tone="navy"
        />
        <StatCard
          icon={<Car className="h-5 w-5" />}
          label="Véhicules enregistrés"
          value={data.vehicles.length}
          tone="info"
        />
      </div>

      {/* Vehicles */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-navy">
          <span className="h-5 w-1 rounded bg-emerald-brand" /> Mes véhicules
        </h2>
        {data.vehicles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Aucun véhicule enregistré pour le moment.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.vehicles.map((v) => (
              <VehicleStatusCard key={v.id} vehicle={v} appointments={data.appointments} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming appointments */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-navy">
            <span className="h-5 w-1 rounded bg-emerald-brand" /> Prochains rendez-vous
          </h2>
          <a
            href="/espace-client/rdv"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-brand hover:underline"
          >
            Tout voir <ChevronRight className="h-4 w-4" />
          </a>
        </div>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Aucun rendez-vous à venir.{" "}
              <a href="/rendez-vous" className="font-medium text-emerald-brand hover:underline">
                Prendre rendez-vous
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 3).map((appt) => (
              <UpcomingRow key={appt.id} appt={appt} onShowQr={() => setQrAppt(appt)} />
            ))}
          </div>
        )}
      </section>

      <QrDialog appointment={qrAppt} open={!!qrAppt} onOpenChange={(v) => !v && setQrAppt(null)} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "emerald" | "navy" | "info";
}) {
  const toneClasses = {
    emerald: "bg-emerald-brand/10 text-emerald-brand",
    navy: "bg-navy/10 text-navy",
    info: "bg-info/10 text-info",
  } as const;
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", toneClasses[tone])}>
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold leading-none text-navy">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function VehicleStatusCard({
  vehicle,
  appointments,
}: {
  vehicle: VehicleItem;
  appointments: AppointmentItem[];
}) {
  const { status, lastInspection, expiry } = computeVehicleStatus(vehicle, appointments);
  const meta = VEHICLE_STATUS_META[status];
  const color = COLOR_MAP[meta.color];
  const Icon =
    meta.icon === "CheckCircle2"
      ? CheckCircle2
      : meta.icon === "AlertTriangle"
      ? AlertTriangle
      : meta.icon === "XCircle"
      ? XCircle
      : CalendarClock;
  return (
    <Card className={cn("border-l-4", color.border)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold uppercase text-navy">{vehicle.plate}</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {vehicle.brand} {vehicle.model} · {vehicle.year}
            </p>
          </div>
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", color.soft, color.fg)}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <div className={cn("mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", color.soft, color.fg)}>
          {meta.label}
        </div>
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          {lastInspection ? (
            <>
              <p>Dernier contrôle : <span className="font-medium text-navy">{formatDate(lastInspection)}</span></p>
              <p>Expiration : <span className="font-medium text-navy">{formatDate(expiry!)}</span></p>
            </>
          ) : (
            <p>Aucun contrôle technique enregistré pour ce véhicule.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingRow({ appt, onShowQr }: { appt: AppointmentItem; onShowQr: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-brand/10 text-center text-emerald-brand">
            <span className="text-sm font-bold leading-none">
              {new Date(appt.date).toLocaleDateString("fr-FR", { day: "2-digit" })}
            </span>
            <span className="text-[10px] uppercase">
              {new Date(appt.date).toLocaleDateString("fr-FR", { month: "short" })}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold tracking-wider text-navy">{appt.code}</span>
              <StatusBadge status={appt.status} />
            </div>
            <p className="mt-0.5 text-sm text-navy">{appt.service.name}</p>
            <p className="text-xs text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" />
              {appt.slot} · {appt.vehiclePlate} · {appt.vehicleDesc}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          {appt.status === "APPROVED" && appt.qrToken ? (
            <Button size="sm" variant="outline" onClick={onShowQr} className="border-emerald-brand/30 text-emerald-brand">
              <QrCode className="mr-1.5 h-4 w-4" /> Voir le QR
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              {appt.status === "PENDING" ? "En attente de validation" : ""}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
