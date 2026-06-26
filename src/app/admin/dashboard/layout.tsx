import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "./_components/dashboard-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Console Super Admin — SÉCUREX CONNECT",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "SUPER") {
    redirect("/admin/login?role=SUPER");
  }

  return (
    <DashboardShell adminName={session.name || "Admin Général"}>
      {children}
    </DashboardShell>
  );
}
