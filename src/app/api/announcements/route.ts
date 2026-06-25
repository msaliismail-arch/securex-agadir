import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const items = await db.announcement.findMany({
    where: { visible: true },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const guard = await (await import("@/lib/api-auth")).requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const body = await req.json();
  const { title, content, pinned, visible, category } = body;
  if (!title || !content) {
    return NextResponse.json({ error: "Titre et contenu requis" }, { status: 400 });
  }
  const item = await db.announcement.create({
    data: { title, content, pinned: pinned ?? false, visible: visible ?? true, category: category || "INFO" },
  });
  const { audit } = await import("@/lib/audit");
  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: "ANNOUNCEMENT_CREATE", target: item.id, details: `Annonce créée: ${title}`,
  });
  return NextResponse.json(item, { status: 201 });
}
