import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

/** Public read of all website content blocks (merged into a key→value map). */
export async function GET() {
  const blocks = await db.websiteContent.findMany();
  const obj: Record<string, string> = {};
  for (const b of blocks) obj[b.id] = b.value;
  return NextResponse.json(obj);
}

/** Super Admin bulk-upserts content blocks. */
export async function PUT(req: Request) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const body = (await req.json()) as Record<string, string>;
  let count = 0;
  for (const [k, v] of Object.entries(body)) {
    await db.websiteContent.upsert({
      where: { id: k },
      update: { value: String(v) },
      create: { id: k, value: String(v) },
    });
    count++;
  }
  await audit({
    adminId: guard.session.sub,
    adminName: guard.session.name,
    adminRole: guard.session.role,
    action: "WEBSITE_CONTENT_UPDATE",
    details: `${count} bloc(s) de contenu modifiés: ${Object.keys(body).slice(0, 6).join(", ")}${Object.keys(body).length > 6 ? "…" : ""}`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true, updated: count });
}
