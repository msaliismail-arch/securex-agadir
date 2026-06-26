import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RdvShell } from "./_components/rdv-shell";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Gestion RDV — SÉCUREX CONNECT",
};

export default async function RdvLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // RDV Admin + Super Admin (full access) can view this space.
  if (!session || (session.role !== "RDV" && session.role !== "SUPER")) {
    redirect("/admin/login?role=RDV");
  }

  return (
    <RdvShell
      adminName={session.name || "RDV Admin"}
      adminEmail={session.email || ""}
      adminRole={session.role}
    >
      {children}
    </RdvShell>
  );
}
