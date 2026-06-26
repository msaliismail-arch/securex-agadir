import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function GET() {
  const settings = await db.setting.findMany();
  const obj: Record<string, string> = {};
  for (const s of settings) obj[s.id] = s.value;
  return NextResponse.json(obj);
}

export async function PUT(req: Request) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const body = (await req.json()) as Record<string, string>;
  for (const [k, v] of Object.entries(body)) {
    await db.setting.upsert({ where: { id: k }, update: { value: String(v) }, create: { id: k, value: String(v) } });
  }
  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: "SETTINGS_UPDATE", details: `Paramètres mis à jour: ${Object.keys(body).join(", ")}`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
