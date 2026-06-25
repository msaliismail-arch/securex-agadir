"use client";

import { createContext, useContext } from "react";

export interface RdvAdminInfo {
  adminName: string;
  adminEmail: string;
  adminRole: string; // "RDV" | "SUPER"
}

export const RdvAdminContext = createContext<RdvAdminInfo | null>(null);

export function useRdvAdmin(): RdvAdminInfo {
  const ctx = useContext(RdvAdminContext);
  return ctx ?? { adminName: "Admin", adminEmail: "", adminRole: "RDV" };
}

/** True if the current admin can only change appointment status (RDV role). */
export function useIsStatusOnly(): boolean {
  const { adminRole } = useRdvAdmin();
  return adminRole === "RDV";
}

