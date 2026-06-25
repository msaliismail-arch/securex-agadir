import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CheckinShell } from "./_components/checkin-shell";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Vérification QR — SÉCUREX CONNECT",
};

export default async function CheckinLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // Accessible to Agent Réception (QR/Code verification) + Super Admin.
  if (!session || (session.role !== "RECEPTION" && session.role !== "SUPER")) {
    redirect("/admin/login?role=RECEPTION");
  }

  return (
    <CheckinShell adminName={session.name || "Réception"} adminEmail={session.email || ""}>
      {children}
    </CheckinShell>
  );
}
