"use client";

import * as React from "react";
import { COLOR_MAP } from "@/lib/constants";

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

export interface InspectionResultItem {
  id: string;
  overallResult: string; // PASS | FAIL
  brakes: string;
  lights: string;
  tires: string;
  emissions: string;
  bodywork: string;
  inspector: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AppointmentItem {
  id: string;
  code: string;
  date: string;
  slot: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED";
  qrToken: string | null;
  queueNumber: number | null;
  notes: string | null;
  clientName: string;
  clientPhone: string;
  vehiclePlate: string;
  vehicleDesc: string;
  vehicleId: string | null;
  category: CategoryItem;
  service: ServiceItem;
  result: InspectionResultItem | null;
}

export interface VehicleItem {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  fuel: string | null;
}

export interface ClientData {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  channel: "SMS" | "EMAIL" | "WHATSAPP";
  vehicles: VehicleItem[];
  appointments: AppointmentItem[];
  createdAt: string;
}

export type VehicleStatus = "valid" | "expiring" | "expired" | "never";

export const VEHICLE_STATUS_META: Record<
  VehicleStatus,
  { label: string; color: "green" | "orange" | "red"; icon: "CheckCircle2" | "AlertTriangle" | "XCircle" | "CalendarClock"; description: string }
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
    description: "Expire dans moins de 30 jours",
  },
  expired: {
    label: "Expiré",
    color: "red",
    icon: "XCircle",
    description: "Contrôle technique à refaire",
  },
  never: {
    label: "Non contrôlé",
    color: "red",
    icon: "CalendarClock",
    description: "Aucun contrôle enregistré",
  },
};

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Compute the status of a vehicle based on the most recent COMPLETED appointment.
 * - never inspected → "never"
 * - last inspection > 1 year ago → "expired"
 * - within 30 days of expiry → "expiring"
 * - else → "valid"
 *
 * Also returns the last inspection date and computed expiry date.
 */
export function computeVehicleStatus(
  vehicle: VehicleItem,
  appointments: AppointmentItem[]
): { status: VehicleStatus; lastInspection: Date | null; expiry: Date | null } {
  const completed = appointments
    .filter((a) => a.vehicleId === vehicle.id && a.status === "COMPLETED")
    .map((a) => new Date(a.date))
    .sort((a, b) => b.getTime() - a.getTime());
  const last = completed[0] ?? null;
  if (!last) {
    return { status: "never", lastInspection: null, expiry: null };
  }
  const expiry = new Date(last.getTime() + ONE_YEAR_MS);
  const now = Date.now();
  if (now > expiry.getTime()) return { status: "expired", lastInspection: last, expiry };
  if (now > expiry.getTime() - THIRTY_DAYS_MS) return { status: "expiring", lastInspection: last, expiry };
  return { status: "valid", lastInspection: last, expiry };
}

/** Use the client's own data — fetches from /api/clients/me on mount and on demand. */
export function useClientData() {
  const [data, setData] = React.useState<ClientData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [unauthorized, setUnauthorized] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clients/me", { cache: "no-store" });
      if (res.status === 401) {
        setData(null);
        setUnauthorized(true);
        return;
      }
      setUnauthorized(false);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Impossible de charger vos données.");
      }
      const json = (await res.json()) as ClientData;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, unauthorized, refresh };
}

/** Map a category color key to its COLOR_MAP entry (safe). */
export function categoryColor(color: string) {
  return COLOR_MAP[color as keyof typeof COLOR_MAP] ?? COLOR_MAP.blue;
}
