"use client";

import { createContext, useContext } from "react";

export interface RdvAdminInfo {
  adminName: string;
  adminEmail: string;
}

export const RdvAdminContext = createContext<RdvAdminInfo | null>(null);

export function useRdvAdmin(): RdvAdminInfo {
  const ctx = useContext(RdvAdminContext);
  // Fallback to a fetch-based default if used outside provider (shouldn't happen)
  return ctx ?? { adminName: "Validation", adminEmail: "" };
}
