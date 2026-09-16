"use client";

import * as React from "react";

import {
  COLOR_MAP,
  type AppointmentStatus,
} from "@/lib/constants";

export type {
  AppointmentStatus,
} from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  price: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}

/* -------------------------------------------------------------------------- */
/*                            Inspection results                              */
/* -------------------------------------------------------------------------- */

export type InspectionCheckStatus =
  | "PASS"
  | "FAIL";

export type InspectionOverallResult =
  | "PASS"
  | "FAIL";

export interface InspectionResultItem {
  id: string;

  overallResult: InspectionOverallResult;

  brakes: InspectionCheckStatus;
  lights: InspectionCheckStatus;
  tires: InspectionCheckStatus;
  emissions: InspectionCheckStatus;
  bodywork: InspectionCheckStatus;

  inspector: string | null;
  notes: string | null;

  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                Payment                                     */
/* -------------------------------------------------------------------------- */

export type PaymentStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "PAID"
  | "WAIVED"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED";

/* -------------------------------------------------------------------------- */
/*                              Notifications                                 */
/* -------------------------------------------------------------------------- */

export type NotificationChannel =
  | "SMS"
  | "EMAIL"
  | "WHATSAPP";

/* -------------------------------------------------------------------------- */
/*                               Appointment                                  */
/* -------------------------------------------------------------------------- */

export interface AppointmentItem {
  id: string;
  code: string;

  date: string;
  slot: string;

  status: AppointmentStatus;

  qrToken: string | null;
  queueNumber: number | null;
  notes: string | null;

  clientName: string;
  clientPhone: string;

  vehiclePlate: string;
  vehicleDesc: string;
  vehicleId: string | null;

  totalAmountCents: number;
  depositAmountCents: number;
  amountPaidCents: number;
  balanceDueCents: number;

  paymentStatus: PaymentStatus;

  category: CategoryItem;
  service: ServiceItem;

  result: InspectionResultItem | null;
}

/* -------------------------------------------------------------------------- */
/*                                  Vehicle                                   */
/* -------------------------------------------------------------------------- */

export interface VehicleItem {
  id: string;

  plate: string;
  brand: string;
  model: string;
  year: number;

  category: string;
  fuel: string | null;
}

/* -------------------------------------------------------------------------- */
/*                                   Client                                   */
/* -------------------------------------------------------------------------- */

export interface ClientData {
  id: string;

  phone: string;
  name: string;
  email: string | null;

  channel: NotificationChannel;

  vehicles: VehicleItem[];
  appointments: AppointmentItem[];

  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                              Vehicle statuses                              */
/* -------------------------------------------------------------------------- */

export type VehicleStatus =
  | "valid"
  | "expiring"
  | "expired"
  | "never";

export const VEHICLE_STATUS_META: Record<
  VehicleStatus,
  {
    label: string;

    color:
      | "green"
      | "orange"
      | "red";

    icon:
      | "CheckCircle2"
      | "AlertTriangle"
      | "XCircle"
      | "CalendarClock";

    description: string;
  }
> = {
  valid: {
    label: "Valide",
    color: "green",
    icon: "CheckCircle2",
    description: "Contrôle à jour",
  },

  expiring: {
    label: "Bientôt à renouveler",
    color: "orange",
    icon: "AlertTriangle",
    description:
      "Expire dans moins de 30 jours",
  },

  expired: {
    label: "Expiré",
    color: "red",
    icon: "XCircle",
    description:
      "Contrôle technique à refaire",
  },

  never: {
    label: "Non contrôlé",
    color: "red",
    icon: "CalendarClock",
    description:
      "Aucun contrôle valide enregistré",
  },
};

/* -------------------------------------------------------------------------- */
/*                       Vehicle inspection computation                       */
/* -------------------------------------------------------------------------- */

const THIRTY_DAYS_MS =
  30 *
  24 *
  60 *
  60 *
  1000;

/**
 * Calcule l'état du contrôle technique d'un véhicule.
 *
 * Règle:
 * - seul un contrôle COMPLETED + PASS peut être valide;
 * - un contrôle FAIL ne donne jamais un véhicule "valid";
 * - validité calculée sur une année civile.
 */
export function computeVehicleStatus(
  vehicle: VehicleItem,
  appointments: AppointmentItem[],
): {
  status: VehicleStatus;
  lastInspection: Date | null;
  expiry: Date | null;
} {
  const completedInspections =
    appointments
      .filter(
        (appointment) =>
          appointment.vehicleId === vehicle.id &&
          appointment.status === "COMPLETED" &&
          appointment.result !== null,
      )
      .map((appointment) => ({
        appointment,
        date: new Date(
          appointment.date,
        ),
      }))
      .filter(
        ({ date }) =>
          !Number.isNaN(
            date.getTime(),
          ),
      )
      .sort(
        (a, b) =>
          b.date.getTime() -
          a.date.getTime(),
      );

  /*
   * Aucun contrôle terminé.
   */
  if (
    completedInspections.length === 0
  ) {
    return {
      status: "never",
      lastInspection: null,
      expiry: null,
    };
  }

  const latest =
    completedInspections[0];

  /*
   * Le dernier contrôle a été refusé.
   *
   * On ne doit surtout pas considérer
   * un ancien PASS comme encore valide.
   */
  if (
    latest.appointment.result
      ?.overallResult !== "PASS"
  ) {
    return {
      status: "expired",
      lastInspection:
        latest.date,
      expiry: null,
    };
  }

  const lastInspection =
    latest.date;

  /*
   * +1 année civile.
   */
  const expiry =
    new Date(
      lastInspection,
    );

  expiry.setFullYear(
    expiry.getFullYear() +
      1,
  );

  const now =
    Date.now();

  const expiryTime =
    expiry.getTime();

  /*
   * Expiré.
   */
  if (
    now >
    expiryTime
  ) {
    return {
      status: "expired",
      lastInspection,
      expiry,
    };
  }

  /*
   * Expire dans moins de 30 jours.
   */
  if (
    now >=
    expiryTime -
      THIRTY_DAYS_MS
  ) {
    return {
      status: "expiring",
      lastInspection,
      expiry,
    };
  }

  /*
   * Toujours valide.
   */
  return {
    status: "valid",
    lastInspection,
    expiry,
  };
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
/*                             useClientData hook                             */
/* -------------------------------------------------------------------------- */

/**
 * Charge le profil du client connecté.
 *
 * GET /api/clients/me
 *
 * Auth:
 * Clerk côté client
 * +
 * profil Client PostgreSQL côté serveur.
 */
export function useClientData() {
  const [
    data,
    setData,
  ] =
    React.useState<ClientData | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    React.useState(true);

  const [
    error,
    setError,
  ] =
    React.useState<string | null>(
      null,
    );

  const [
    unauthorized,
    setUnauthorized,
  ] =
    React.useState(false);

  const refresh =
    React.useCallback(
      async () => {
        setLoading(true);
        setError(null);
        setUnauthorized(false);

        try {
          const response =
            await fetch(
              "/api/clients/me",
              {
                method: "GET",
                cache: "no-store",
              },
            );

          /* -------------------------------------------------------------- */
          /*                        Non authentifié                          */
          /* -------------------------------------------------------------- */

          if (
            response.status ===
            401
          ) {
            setData(null);

            setUnauthorized(
              true,
            );

            return;
          }

          /* -------------------------------------------------------------- */
          /*                  Clerk OK mais profil DB absent                 */
          /* -------------------------------------------------------------- */

          if (
            response.status ===
            404
          ) {
            const body =
              await readJsonSafely<{
                error?: string;
                code?: string;
                needsOnboarding?: boolean;
              }>(
                response,
              );

            setData(null);

            setError(
              body?.error ||
                "Profil client introuvable.",
            );

            return;
          }

          /* -------------------------------------------------------------- */
          /*                             Erreur                              */
          /* -------------------------------------------------------------- */

          if (
            !response.ok
          ) {
            const body =
              await readJsonSafely<{
                error?: string;
              }>(
                response,
              );

            throw new Error(
              body?.error ||
                `Impossible de charger vos données (${response.status}).`,
            );
          }

          /* -------------------------------------------------------------- */
          /*                            Succès                               */
          /* -------------------------------------------------------------- */

          const json =
            await readJsonSafely<ClientData>(
              response,
            );

          if (!json) {
            throw new Error(
              "Le serveur a retourné une réponse invalide.",
            );
          }

          setData(
            json,
          );

          setError(
            null,
          );

          setUnauthorized(
            false,
          );
        } catch (error) {
          setData(
            null,
          );

          setUnauthorized(
            false,
          );

          setError(
            error instanceof Error
              ? error.message
              : "Erreur inattendue.",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [],
    );

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    unauthorized,
    refresh,
  };
}

/* -------------------------------------------------------------------------- */
/*                              Category colors                               */
/* -------------------------------------------------------------------------- */

export function categoryColor(
  color: string,
) {
  return (
    COLOR_MAP[
      color as keyof typeof COLOR_MAP
    ] ??
    COLOR_MAP.blue
  );
}