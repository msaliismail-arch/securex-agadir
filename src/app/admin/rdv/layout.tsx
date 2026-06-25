import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/shared/logo";
import { RdvShell } from "./_components/rdv-shell";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Gestion RDV — SÉCUREX CONNECT",
};

export default async function RdvLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "VALIDATION") {
    redirect("/admin/login?role=VALIDATION");
  }

  return (
    <RdvShell
      adminName={session.name || "Validation"}
      adminEmail={session.email || ""}
    >
      {children}
    </RdvShell>
  );
}
