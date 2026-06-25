"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ScanLine } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CheckinShell({
  adminName,
  adminEmail,
  children,
}: {
  adminName: string;
  adminEmail: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Déconnecté");
      router.push("/admin/select-account");
    } catch {
      toast.error("Erreur lors de la déconnexion");
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-orange-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="[&_span.text-emerald-brand]:!text-[#F2994A]">
              <Logo size={36} withText={false} />
            </div>
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F2994A]">
                  Réception
                </span>
                <ScanLine className="h-3.5 w-3.5 text-[#F2994A]" />
              </div>
              <span className="text-[10px] text-muted-foreground">SÉCUREX CONNECT · Agadir</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-none">
              <span className="text-xs font-semibold text-navy">{adminName}</span>
              {adminEmail && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                  {adminEmail}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="border-orange-200 text-[#F2994A] hover:bg-orange-50 hover:text-[#F2994A]"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 sm:py-10 max-w-2xl mx-auto w-full">
        {children}
      </main>

      <footer className="mt-auto py-3 text-center text-[10px] text-muted-foreground border-t border-orange-200/40">
        Espace Réception · Vérification des réservations · SÉCUREX CONNECT
      </footer>
    </div>
  );
}
