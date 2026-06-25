import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/shared/logo";
import { CheckinShell } from "./_components/checkin-shell";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Réception — SÉCUREX CONNECT",
};

export default async function CheckinLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "RECEPTION") {
    redirect("/admin/login?role=RECEPTION");
  }

  return (
    <CheckinShell adminName={session.name || "Réception"} adminEmail={session.email || ""}>
      {children}
    </CheckinShell>
  );
}
