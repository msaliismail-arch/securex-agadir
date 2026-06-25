import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const withServices = searchParams.get("withServices") === "1";
  const cats = await db.category.findMany({
    orderBy: { sort: "asc" },
    include: withServices ? { services: { where: { active: true }, orderBy: { price: "asc" } } } : undefined,
  });
  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const body = await req.json();
  const { name, slug, description, icon, color, sort } = body;
  if (!name || !slug || !color) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }
  try {
    const cat = await db.category.create({
      data: { name, slug, description: description || "", icon: icon || "Car", color, sort: sort || 0 },
    });
    await audit({
      adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
      action: "CATEGORY_CREATE", target: cat.id, details: `Catégorie créée: ${name}`,
      ipAddress: clientIp(req),
    });
    return NextResponse.json(cat, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug déjà utilisé ou invalide" }, { status: 400 });
  }
}
