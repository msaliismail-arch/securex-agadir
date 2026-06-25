import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CheckinShell } from "./_components/checkin-shell";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Vérification QR — SÉCUREX CONNECT",
};

export default async function CheckinLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // QR verification is now Super-Admin-only (full access).
  if (!session || session.role !== "SUPER") {
    redirect("/admin/login?role=SUPER");
  }

  return (
    <CheckinShell adminName={session.name || "Admin"} adminEmail={session.email || ""}>
      {children}
    </CheckinShell>
  );
}
