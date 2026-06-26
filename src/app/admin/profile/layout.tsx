import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Mon profil — SÉCUREX CONNECT",
};

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // Any admin role can access their own profile
  if (!session || session.role === "CLIENT") {
    redirect("/admin/select-account");
  }
  return <>{children}</>;
}
