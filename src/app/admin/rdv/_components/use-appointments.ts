"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Appointment, CategoryRef, ServiceRef } from "./types";

export interface Filters {
  status?: string;
  date?: string;
  q?: string;
}

export function useAppointments(initial?: Filters) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(initial ?? {});
  const [refreshKey, setRefreshKey] = useState(0);
  const firstRunRef = useRef(true);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.date) params.set("date", filters.date);
    if (filters.q) params.set("q", filters.q);

    const run = async () => {
      try {
        const r = await fetch(`/api/appointments?${params.toString()}`, { cache: "no-store" });
        const data = r.ok ? await r.json() : [];
        if (!cancelled) setItems(data || []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
      firstRunRef.current = false;
    };
  }, [filters, refreshKey]);

  return { items, loading, filters, setFilters, refresh };
}

export function useCatalog() {
  const [categories, setCategories] = useState<CategoryRef[]>([]);
  const [services, setServices] = useState<ServiceRef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const [c, s] = await Promise.all([
          fetch("/api/categories?withServices=1").then((r) => r.json()),
          fetch("/api/services").then((r) => r.json()),
        ]);
        if (!cancelled) {
          setCategories(c || []);
          setServices(s || []);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, services, loading };
}

/** Build a quick lookup map for category + service by id. */
export function buildLookups(categories: CategoryRef[], services: ServiceRef[]) {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const svcMap = new Map(services.map((s) => [s.id, s]));
  return { catMap, svcMap };
}
