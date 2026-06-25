"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ScanLine } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
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
    <div className="min-h-screen flex flex-col bg-mesh">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass-strong border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={36} withText={false} />
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary border border-primary/20">
                  <ScanLine className="h-3.5 w-3.5" />
                  Vérification QR
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-info border border-info/20">
                  Super Admin
                </span>
              </div>
              <span className="mt-1 text-[10px] text-muted-foreground">SÉCUREX CONNECT · Agadir</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-none">
              <span className="text-xs font-semibold text-foreground">{adminName}</span>
              {adminEmail && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                  {adminEmail}
                </span>
              )}
            </div>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
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

      <footer className="mt-auto py-3 text-center text-[10px] text-muted-foreground border-t border-border">
        Vérification QR des passages véhicule · Super Admin · SÉCUREX CONNECT
      </footer>
    </div>
  );
}
