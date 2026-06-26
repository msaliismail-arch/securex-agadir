import { getSession, type SessionPayload } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { AdminRole } from "@/lib/constants";

export async function apiSession(): Promise<SessionPayload | null> {
  return getSession();
}

export function unauthorized(msg = "Non authentifié") {
  return NextResponse.json({ error: msg }, { status: 401 });
}

export function forbidden(msg = "Accès refusé") {
  return NextResponse.json({ error: msg }, { status: 403 });
}

export async function requireAdminRole(allowed: AdminRole[]): Promise<{ session: SessionPayload; ok: true } | { ok: false; res: NextResponse }> {
  const session = await getSession();
  if (!session) return { ok: false, res: unauthorized() };
  if (session.role === "CLIENT") return { ok: false, res: forbidden("Accès administrateur requis") };
  if (!allowed.includes(session.role as AdminRole)) return { ok: false, res: forbidden("Rôle insuffisant") };
  return { session, ok: true };
}

export function clientIp(req: Request): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined;
}
