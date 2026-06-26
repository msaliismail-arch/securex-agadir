import { db } from "@/lib/db";

export async function audit(params: {
  adminId?: string;
  adminName: string;
  adminRole: string;
  action: string;
  target?: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await db.auditLog.create({ data: params });
  } catch (e) {
    console.error("audit log failed", e);
  }
}
