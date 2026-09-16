"use client";

import * as React from "react";
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  useUser,
} from "@clerk/nextjs";
import { toast } from "sonner";

import {
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  History,
  Loader2,
  LogIn,
  Plus,
  QrCode,
  ShieldCheck,
  UserCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  computeVehicleStatus,
  VEHICLE_STATUS_META,
  useClientData,
  type AppointmentItem,
  type VehicleStatus,
} from "@/components/client/types";

import {
  CategoryBadge,
  StatusBadge,
} from "@/components/client/badges";

import {
  QrDialog,
} from "@/components/client/qr-dialog";

import {
  cn,
  formatDate,
  formatMAD,
} from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type GateState =
  | "loading"
  | "ready"
  | "onboarding"
  | "error";

interface ApiErrorBody {
  error?: string;
  code?: string;
  needsOnboarding?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                               JSON helper                                  */
/* -------------------------------------------------------------------------- */

async function readJsonSafely<T>(
  response: Response,
): Promise<T | null> {
  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(
      text,
    ) as T;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default function EspaceClientPage() {
  return (
    <>
      <SignedOut>
        <LoginScreen />
      </SignedOut>

      <SignedIn>
        <ClientGate />
      </SignedIn>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Signed-out view                               */
/* -------------------------------------------------------------------------- */

function LoginScreen() {
  return (
    <main className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <Card className="glass-card w-full max-w-md border-primary/20 shadow-card">
        <CardContent className="p-7 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle className="h-9 w-9" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-foreground">
            Espace client
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous pour consulter vos rendez-vous,
            véhicules, QR codes et résultats de contrôle.
          </p>

          <div className="mt-6 space-y-3">
            <Button
              asChild
              className="w-full bg-brand-gradient text-white hover:opacity-90"
            >
              <Link href="/sign-in">
                <LogIn className="mr-2 h-4 w-4" />

                Se connecter
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <Link href="/sign-up">
                Créer un compte
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Client gate                                 */
/* -------------------------------------------------------------------------- */

function ClientGate() {
  const {
    user,
    isLoaded,
  } = useUser();

  const [
    state,
    setState,
  ] =
    React.useState<GateState>(
      "loading",
    );

  const [
    error,
    setError,
  ] =
    React.useState<string | null>(
      null,
    );

  const checkProfile =
    React.useCallback(
      async () => {
        if (
          !isLoaded ||
          !user
        ) {
          return;
        }

        setState(
          "loading",
        );

        setError(
          null,
        );

        try {
          const response =
            await fetch(
              "/api/clients/me",
              {
                method: "GET",
                cache: "no-store",
              },
            );

          if (
            response.ok
          ) {
            setState(
              "ready",
            );

            return;
          }

          const body =
            await readJsonSafely<ApiErrorBody>(
              response,
            );

          if (
            response.status ===
            404
          ) {
            setState(
              "onboarding",
            );

            return;
          }

          if (
            response.status ===
            401
          ) {
            setError(
              "Votre session n’est plus valide. Reconnectez-vous.",
            );

            setState(
              "error",
            );

            return;
          }

          throw new Error(
            body?.error ||
              `Impossible de charger votre profil (${response.status}).`,
          );
        } catch (
          error
        ) {
          setError(
            error instanceof Error
              ? error.message
              : "Impossible de charger votre profil.",
          );

          setState(
            "error",
          );
        }
      },
      [
        isLoaded,
        user,
      ],
    );

  React.useEffect(() => {
    void checkProfile();
  }, [
    checkProfile,
  ]);

  /*
   * IMPORTANT:
   *
   * TypeScript sait maintenant que "user"
   * n'est pas null après cette condition.
   */
  if (
    !isLoaded ||
    !user
  ) {
    return (
      <ClientLoading />
    );
  }

  if (
    state ===
    "loading"
  ) {
    return (
      <ClientLoading />
    );
  }

  if (
    state ===
    "error"
  ) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <Card className="glass-card">
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {error ||
                "Impossible de charger votre compte."}
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void checkProfile();
              }}
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (
    state ===
    "onboarding"
  ) {
    return (
      <ProfileSetup
        defaultName={
          user.fullName ??
          ""
        }
        email={
          user.primaryEmailAddress
            ?.emailAddress ??
          ""
        }
        onComplete={() => {
          setState(
            "ready",
          );
        }}
      />
    );
  }

  return (
    <Dashboard />
  );
}

/* -------------------------------------------------------------------------- */
/*                              Loading screen                                */
/* -------------------------------------------------------------------------- */

function ClientLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Profile setup                                */
/* -------------------------------------------------------------------------- */

function ProfileSetup({
  defaultName,
  email,
  onComplete,
}: {
  defaultName: string;
  email: string;
  onComplete: () => void;
}) {
  const [
    name,
    setName,
  ] =
    React.useState(
      defaultName,
    );

  const [
    phone,
    setPhone,
  ] =
    React.useState("");

  const [
    saving,
    setSaving,
  ] =
    React.useState(false);

  async function submitProfile(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanName =
      name.trim();

    const cleanPhone =
      phone.trim();

    if (
      cleanName.length <
      3
    ) {
      toast.error(
        "Veuillez saisir votre nom complet.",
      );

      return;
    }

    /*
     * Validation volontairement souple:
     * +212..., 06..., 07...
     */
    const phoneDigits =
      cleanPhone.replace(
        /\D/g,
        "",
      );

    if (
      phoneDigits.length <
        9 ||
      phoneDigits.length >
        15
    ) {
      toast.error(
        "Numéro de téléphone invalide.",
      );

      return;
    }

    setSaving(
      true,
    );

    try {
      const response =
        await fetch(
          "/api/clients/me",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  cleanName,

                phone:
                  cleanPhone,
              }),
          },
        );

      const body =
        await readJsonSafely<{
          error?: string;
        }>(
          response,
        );

      if (
        !response.ok
      ) {
        throw new Error(
          body?.error ||
            `Impossible de créer votre profil (${response.status}).`,
        );
      }

      toast.success(
        "Votre espace client est prêt.",
      );

      onComplete();
    } catch (
      error
    ) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de créer votre profil.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12">
      <Card className="glass-card w-full border-primary/20 shadow-card">
        <CardContent className="p-6 md:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserCircle className="h-8 w-8" />
            </div>

            <h1 className="mt-4 text-2xl font-bold text-foreground">
              Finaliser votre profil
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Quelques informations sont nécessaires avant votre
              première réservation.
            </p>
          </div>

          <form
            onSubmit={
              submitProfile
            }
            className="mt-7 space-y-4"
          >
            <div className="space-y-2">
              <label
                htmlFor="client-name"
                className="text-sm font-medium text-foreground"
              >
                Nom complet
              </label>

              <Input
                id="client-name"
                value={
                  name
                }
                onChange={(
                  event,
                ) =>
                  setName(
                    event.target.value,
                  )
                }
                placeholder="Votre nom complet"
                autoComplete="name"
                disabled={
                  saving
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="client-email"
                className="text-sm font-medium text-foreground"
              >
                E-mail vérifié
              </label>

              <Input
                id="client-email"
                value={
                  email
                }
                type="email"
                readOnly
                className="bg-muted/40"
              />

              <p className="text-xs text-muted-foreground">
                Cette adresse provient de votre compte sécurisé Clerk.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="client-phone"
                className="text-sm font-medium text-foreground"
              >
                Téléphone
              </label>

              <Input
                id="client-phone"
                value={
                  phone
                }
                onChange={(
                  event,
                ) =>
                  setPhone(
                    event.target.value,
                  )
                }
                placeholder="+212 6 00 00 00 00"
                autoComplete="tel"
                disabled={
                  saving
                }
                required
              />
            </div>

            <Button
              type="submit"
              disabled={
                saving
              }
              className="w-full bg-brand-gradient text-white hover:opacity-90"
            >
              {saving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {saving
                ? "Création..."
                : "Accéder à mon espace"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Dashboard                                  */
/* -------------------------------------------------------------------------- */

function Dashboard() {
  const {
    data,
    loading,
    error,
    unauthorized,
    refresh,
  } =
    useClientData();

  const [
    qrAppointment,
    setQrAppointment,
  ] =
    React.useState<AppointmentItem | null>(
      null,
    );

  if (
    loading
  ) {
    return (
      <ClientLoading />
    );
  }

  if (
    unauthorized
  ) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <Card className="glass-card">
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Votre session a expiré.
            </p>

            <Button
              asChild
              className="bg-brand-gradient text-white"
            >
              <Link href="/sign-in">
                Se reconnecter
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <Card className="glass-card">
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {error ||
                "Impossible de charger votre espace client."}
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void refresh();
              }}
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  const upcomingAppointments =
    data.appointments
      .filter(
        (
          appointment,
        ) => {
          const date =
            new Date(
              appointment.date,
            );

          if (
            Number.isNaN(
              date.getTime(),
            )
          ) {
            return false;
          }

          return (
            date >= today &&
            (
              appointment.status ===
                "PENDING" ||
              appointment.status ===
                "APPROVED"
            )
          );
        },
      )
      .sort(
        (
          a,
          b,
        ) => {
          const aDate =
            new Date(
              a.date,
            ).getTime();

          const bDate =
            new Date(
              b.date,
            ).getTime();

          if (
            aDate !==
            bDate
          ) {
            return (
              aDate -
              bDate
            );
          }

          return a.slot.localeCompare(
            b.slot,
          );
        },
      );

  const nextAppointment =
    upcomingAppointments[0] ??
    null;

  const completedCount =
    data.appointments.filter(
      (
        appointment,
      ) =>
        appointment.status ===
        "COMPLETED",
    ).length;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <div className="space-y-7">
        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              SÉCUREX CONNECT
            </p>

            <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
              Bonjour {data.name}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Retrouvez vos rendez-vous, véhicules et contrôles techniques.
            </p>
          </div>

          <Button
            asChild
            className="bg-brand-gradient text-white hover:opacity-90"
          >
            <Link href="/rendez-vous">
              <Plus className="mr-2 h-4 w-4" />

              Nouveau rendez-vous
            </Link>
          </Button>
        </div>

        {/* Summary */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStat
            icon={
              <CalendarDays className="h-5 w-5" />
            }
            label="À venir"
            value={
              upcomingAppointments.length
            }
          />

          <DashboardStat
            icon={
              <Car className="h-5 w-5" />
            }
            label="Véhicules"
            value={
              data.vehicles.length
            }
          />

          <DashboardStat
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            label="Contrôles réalisés"
            value={
              completedCount
            }
          />

          <DashboardStat
            icon={
              <ShieldCheck className="h-5 w-5" />
            }
            label="Compte"
            value="Vérifié"
          />
        </div>

        {/* Quick links */}

        <div className="grid gap-3 sm:grid-cols-3">
          <QuickLink
            href="/espace-client/rdv"
            icon={
              <CalendarDays className="h-5 w-5" />
            }
            title="Mes rendez-vous"
            description="À venir et passés"
          />

          <QuickLink
            href="/espace-client/historique"
            icon={
              <History className="h-5 w-5" />
            }
            title="Historique"
            description="Résultats et certificats"
          />

          <QuickLink
            href="/espace-client/profil"
            icon={
              <UserCircle className="h-5 w-5" />
            }
            title="Mon profil"
            description="Informations personnelles"
          />
        </div>

        {/* Next appointment */}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Prochain rendez-vous
            </h2>

            <Link
              href="/espace-client/rdv"
              className="text-xs font-medium text-primary hover:underline"
            >
              Voir tous
            </Link>
          </div>

          {nextAppointment ? (
            <NextAppointmentCard
              appointment={
                nextAppointment
              }
              onShowQr={() =>
                setQrAppointment(
                  nextAppointment,
                )
              }
            />
          ) : (
            <Card className="glass-card">
              <CardContent className="py-9 text-center">
                <CalendarDays className="mx-auto h-9 w-9 text-muted-foreground/40" />

                <p className="mt-3 text-sm text-muted-foreground">
                  Aucun rendez-vous à venir.
                </p>

                <Button
                  asChild
                  size="sm"
                  className="mt-4 bg-brand-gradient text-white"
                >
                  <Link href="/rendez-vous">
                    Prendre rendez-vous
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Vehicles */}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Mes véhicules
            </h2>

            <Badge
              variant="outline"
            >
              {data.vehicles.length}
            </Badge>
          </div>

          {data.vehicles.length ===
          0 ? (
            <Card className="glass-card">
              <CardContent className="py-9 text-center">
                <Car className="mx-auto h-9 w-9 text-muted-foreground/40" />

                <p className="mt-3 text-sm text-muted-foreground">
                  Aucun véhicule enregistré.
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Votre premier véhicule sera enregistré lors d&apos;une réservation.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.vehicles.map(
                (
                  vehicle,
                ) => {
                  const vehicleState =
                    computeVehicleStatus(
                      vehicle,
                      data.appointments,
                    );

                  return (
                    <VehicleCard
                      key={
                        vehicle.id
                      }
                      plate={
                        vehicle.plate
                      }
                      description={`${vehicle.brand} ${vehicle.model} · ${vehicle.year}`}
                      status={
                        vehicleState.status
                      }
                      expiry={
                        vehicleState.expiry
                      }
                    />
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>

      <QrDialog
        appointment={
          qrAppointment
        }
        open={Boolean(
          qrAppointment,
        )}
        onOpenChange={(
          open,
        ) => {
          if (
            !open
          ) {
            setQrAppointment(
              null,
            );
          }
        }}
      />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Dashboard stat                                */
/* -------------------------------------------------------------------------- */

function DashboardStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="glass-card">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>

        <div>
          <p className="text-xl font-bold text-foreground">
            {value}
          </p>

          <p className="text-xs text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Quick link                                 */
/* -------------------------------------------------------------------------- */

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="glass-card h-full transition-all hover:-translate-y-0.5 hover:border-primary/30">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">
              {title}
            </p>

            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Next appointment card                              */
/* -------------------------------------------------------------------------- */

function NextAppointmentCard({
  appointment,
  onShowQr,
}: {
  appointment: AppointmentItem;
  onShowQr: () => void;
}) {
  const canShowQr =
    appointment.status ===
      "APPROVED" &&
    Boolean(
      appointment.qrToken,
    );

  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-wider text-foreground">
                {appointment.code}
              </span>

              <StatusBadge
                status={
                  appointment.status
                }
              />

              <CategoryBadge
                name={
                  appointment.category.name
                }
                color={
                  appointment.category.color
                }
              />
            </div>

            <p className="mt-2 font-medium text-foreground">
              {appointment.service.name}
            </p>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" />

                {formatDate(
                  appointment.date,
                )}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />

                {appointment.slot}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Car className="h-4 w-4 text-primary" />

                {appointment.vehiclePlate}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="text-primary"
              >
                {formatMAD(
                  appointment.service.price,
                )}
              </Badge>

              {appointment.paymentStatus ===
              "PAID" ? (
                <Badge
                  variant="outline"
                  className="border-primary/30 text-primary"
                >
                  Acompte payé
                </Badge>
              ) : appointment.paymentStatus ===
                "WAIVED" ? (
                <Badge
                  variant="outline"
                  className="border-primary/30 text-primary"
                >
                  Acompte exempté
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-300 text-amber-700"
                >
                  Acompte en attente
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canShowQr && (
              <Button
                type="button"
                variant="outline"
                onClick={
                  onShowQr
                }
                className="border-primary/30 text-primary"
              >
                <QrCode className="mr-2 h-4 w-4" />

                Voir QR
              </Button>
            )}

            <Button
              asChild
              variant="outline"
            >
              <Link href="/espace-client/rdv">
                Détails
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Vehicle card                                 */
/* -------------------------------------------------------------------------- */

function VehicleCard({
  plate,
  description,
  status,
  expiry,
}: {
  plate: string;
  description: string;
  status: VehicleStatus;
  expiry: Date | null;
}) {
  const meta =
    VEHICLE_STATUS_META[
      status
    ];

  const statusClass =
    status ===
    "valid"
      ? "border-primary/30 bg-primary/5 text-primary"
      : status ===
          "expiring"
        ? "border-orange-300 bg-orange-50 text-orange-700"
        : "border-destructive/30 bg-destructive/5 text-destructive";

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Car className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-mono font-bold uppercase text-foreground">
              {plate}
            </p>

            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {description}
            </p>

            <Badge
              variant="outline"
              className={cn(
                "mt-3",
                statusClass,
              )}
            >
              {meta.label}
            </Badge>

            {expiry ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Échéance :{" "}
                {expiry.toLocaleDateString(
                  "fr-FR",
                )}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}