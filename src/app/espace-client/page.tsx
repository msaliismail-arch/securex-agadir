"use client";

import * as React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2,
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
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { COLOR_MAP } from "@/lib/constants";
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
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return hasSession ? <Dashboard /> : <LoginScreen />;
}

/* --------------------------------- Login ---------------------------------- */
function LoginScreen() {
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-10 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Espace Client</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Connectez-vous pour suivre vos rendez-vous et certificats.
          </p>
        </div>

        <Card className="glass-card border-primary/20 shadow-card">
          <CardContent className="p-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
              <TabsList className="mb-5 grid w-full grid-cols-2">
                <TabsTrigger value="login" className="gap-1.5">
                  <LogIn className="h-4 w-4" /> Connexion
                </TabsTrigger>
                <TabsTrigger value="register" className="gap-1.5">
                  <UserPlus className="h-4 w-4" /> Inscription
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-info/30 bg-info/5 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-info" />
          <div>
            <p className="font-medium text-foreground">Espace sécurisé</p>
            <p className="mt-0.5">
              Vos données personnelles et l&apos;historique de vos contrôles sont protégés
              et accessibles uniquement avec votre compte.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Pas encore de compte ?{" "}
          <a href="/rendez-vous" className="font-medium text-primary hover:underline">
            Créez-en un lors de votre premier rendez-vous
          </a>
          .
        </p>
      </motion.div>
    </div>
  );
}

/* ------------------------------ Login Form -------------------------------- */
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Veuillez saisir votre email et votre mot de passe.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/client-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Identifiants incorrects");
      }
      toast.success(`Bienvenue${data?.name ? `, ${data.name}` : ""} !`);
      // Full reload so the layout's session check re-runs and the shell appears.
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            className="pl-9"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Mot de passe</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="pl-9 pr-9"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-brand-gradient text-white hover:opacity-90"
        disabled={submitting}
      >
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Se connecter
      </Button>
    </form>
  );
}

/* ----------------------------- Register Form ------------------------------ */
function RegisterForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+212 ");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      toast.error("Veuillez saisir votre nom complet.");
      return;
    }
    if (!isValidMaPhone(phone)) {
      toast.error("Numéro marocain invalide (format +212).");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Adresse email invalide.");
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/client-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone: normalizePhone(phone),
          email: trimmedEmail,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("Email ou téléphone déjà utilisé");
        }
        throw new Error(data?.error || "Inscription impossible");
      }
      toast.success(`Compte créé. Bienvenue${data?.name ? `, ${data.name}` : ""} !`);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'inscription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reg-name">Nom complet</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reg-name"
            type="text"
            autoComplete="name"
            placeholder="Mehdi Tazi"
            className="pl-9"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-phone">Téléphone</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reg-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+212 6 12 34 56 78"
            className="pl-9"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={submitting}
          />
        </div>
        <p className="text-xs text-muted-foreground">Format marocain : +212 6/7 XX XX XX XX.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            className="pl-9"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-password">Mot de passe</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="6 caractères minimum"
            className="pl-9 pr-9"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">6 caractères minimum.</p>
      </div>

      <Button
        type="submit"
        className="w-full bg-brand-gradient text-white hover:opacity-90"
        disabled={submitting}
      >
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Créer mon compte
      </Button>
    </form>
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
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Tableau de bord
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
            Bonjour, {data.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Voici l&apos;état de vos rendez-vous et de vos véhicules.
          </p>
        </div>
        <Button asChild className="bg-brand-gradient text-white hover:opacity-90">
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
          tone="primary"
        />
        <StatCard
          icon={<Award className="h-5 w-5" />}
          label="Contrôles validés"
          value={validated.length}
          tone="info"
        />
        <StatCard
          icon={<Car className="h-5 w-5" />}
          label="Véhicules enregistrés"
          value={data.vehicles.length}
          tone="purple"
        />
      </div>

      {/* Vehicles */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
          <span className="h-5 w-1 rounded bg-brand-gradient" /> Mes véhicules
        </h2>
        {data.vehicles.length === 0 ? (
          <Card className="glass-card">
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
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="h-5 w-1 rounded bg-brand-gradient" /> Prochains rendez-vous
          </h2>
          <a
            href="/espace-client/rdv"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Tout voir <ChevronRight className="h-4 w-4" />
          </a>
        </div>
        {upcoming.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Aucun rendez-vous à venir.{" "}
              <a href="/rendez-vous" className="font-medium text-primary hover:underline">
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
  tone: "primary" | "info" | "purple";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/10 text-info",
    purple: "bg-purple-100 text-purple-700",
  } as const;
  return (
    <Card className="glass-card">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", toneClasses[tone])}>
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold leading-none text-foreground">{value}</p>
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
    <Card className={cn("glass-card border-l-4", color.border)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold uppercase text-foreground">{vehicle.plate}</p>
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
              <p>Dernier contrôle : <span className="font-medium text-foreground">{formatDate(lastInspection)}</span></p>
              <p>Expiration : <span className="font-medium text-foreground">{formatDate(expiry!)}</span></p>
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
    <Card className="glass-card">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-center text-primary">
            <span className="text-sm font-bold leading-none">
              {new Date(appt.date).toLocaleDateString("fr-FR", { day: "2-digit" })}
            </span>
            <span className="text-[10px] uppercase">
              {new Date(appt.date).toLocaleDateString("fr-FR", { month: "short" })}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold tracking-wider text-foreground">{appt.code}</span>
              <StatusBadge status={appt.status} />
            </div>
            <p className="mt-0.5 text-sm text-foreground">{appt.service.name}</p>
            <p className="text-xs text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" />
              {appt.slot} · {appt.vehiclePlate} · {appt.vehicleDesc}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          {appt.status === "APPROVED" && appt.qrToken ? (
            <Button size="sm" variant="outline" onClick={onShowQr} className="border-primary/30 text-primary hover:bg-primary/10">
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
