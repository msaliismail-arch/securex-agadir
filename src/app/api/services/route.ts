import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const services = await db.service.findMany({
    where: categoryId ? { categoryId } : undefined,
    include: { category: true },
    orderBy: { price: "asc" },
  });
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const body = await req.json();
  const { name, slug, description, durationMin, price, categoryId, active } = body;
  if (!name || !slug || !categoryId || price == null) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }
  try {
    const svc = await db.service.create({
      data: { name, slug, description: description || "", durationMin: durationMin || 30, price: Number(price), categoryId, active: active ?? true },
    });
    await audit({
      adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
      action: "SERVICE_CREATE", target: svc.id, details: `Service créé: ${name} (${price} MAD)`,
      ipAddress: clientIp(req),
    });
    return NextResponse.json(svc, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug déjà utilisé ou invalide" }, { status: 400 });
  }
}
