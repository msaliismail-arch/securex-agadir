import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

function generatedCode() {
  return `SX-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function GET() {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  return NextResponse.json(await db.promoCode.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const body = (await request.json()) as { code?: string; description?: string; maxUses?: number | null; expiresAt?: string | null };
  const code = (body.code?.trim().toUpperCase() || generatedCode()).replace(/[^A-Z0-9-]/g, "");
  if (code.length < 4 || code.length > 32) return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  const maxUses = body.maxUses == null ? null : Math.max(1, Math.floor(Number(body.maxUses)));
  try {
    const promo = await db.promoCode.create({
      data: {
        code,
        description: body.description?.trim() || null,
        maxUses,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        createdById: guard.session.sub,
        createdByName: guard.session.name,
      },
    });
    await audit({ adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role, action: "PROMO_CODE_CREATE", target: promo.id, details: `Code d’exemption ${promo.code} créé`, ipAddress: clientIp(request) });
    return NextResponse.json(promo, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ce code existe déjà" }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const body = (await request.json()) as { id?: string; active?: boolean; description?: string; maxUses?: number | null; expiresAt?: string | null };
  if (!body.id) return NextResponse.json({ error: "Identifiant requis" }, { status: 400 });
  const promo = await db.promoCode.update({
    where: { id: body.id },
    data: {
      ...(typeof body.active === "boolean" ? { active: body.active } : {}),
      ...(body.description !== undefined ? { description: body.description.trim() || null } : {}),
      ...(body.maxUses !== undefined ? { maxUses: body.maxUses == null ? null : Math.max(1, Math.floor(Number(body.maxUses))) } : {}),
      ...(body.expiresAt !== undefined ? { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null } : {}),
    },
  });
  await audit({ adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role, action: "PROMO_CODE_UPDATE", target: promo.id, details: `Code ${promo.code} mis à jour`, ipAddress: clientIp(request) });
  return NextResponse.json(promo);
}

export async function DELETE(request: Request) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Identifiant requis" }, { status: 400 });
  const promo = await db.promoCode.findUnique({ where: { id } });
  if (!promo) return NextResponse.json({ error: "Code introuvable" }, { status: 404 });
  await db.promoCode.update({ where: { id }, data: { active: false } });
  await audit({ adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role, action: "PROMO_CODE_DISABLE", target: id, details: `Code ${promo.code} désactivé`, ipAddress: clientIp(request) });
  return NextResponse.json({ ok: true });
}
