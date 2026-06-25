"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  History,
  UserCircle,
  LogOut,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";

interface SessionInfo {
  sub: string;
  role: string;
  name: string;
  phone?: string;
  email?: string;
}

const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/espace-client", icon: LayoutDashboard, exact: true },
  { label: "Mes RDV", href: "/espace-client/rdv", icon: CalendarDays },
  { label: "Historique", href: "/espace-client/historique", icon: History },
  { label: "Profil", href: "/espace-client/profil", icon: UserCircle },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function ClientSpaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!active) return;
        if (!res.ok) {
          setSession(null);
          return;
        }
        const data = await res.json();
        if (data && data.role === "CLIENT") {
          setSession(data);
        } else {
          setSession(null);
        }
      } catch {
        if (active) setSession(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pathname]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setSession(null);
      router.push("/");
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-brand" />
      </div>
    );
  }

  const isLoginScreen = !session && pathname === "/espace-client";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-sidebar-border bg-navy text-white">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {isLoginScreen ? (
              <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/">
                  <ChevronLeft className="mr-1 h-4 w-4" /> Accueil
                </Link>
              </Button>
            ) : null}
            <Link href="/espace-client" className="flex items-center gap-2.5" aria-label="Espace client SÉCUREX CONNECT">
              <Logo size={36} textClassName="text-white" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <div className="hidden items-center gap-2.5 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-brand text-sm font-bold text-white">
                    {initials(session.name) || "CL"}
                  </div>
                  <div className="text-right leading-tight">
                    <p className="text-sm font-semibold">{session.name}</p>
                    <p className="text-[11px] text-white/60">Espace client</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </Button>
              </>
            ) : (
              <Badge label="Espace Client" />
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        {!isLoginScreen && (
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-sidebar-border bg-navy lg:flex">
            <SidebarNav pathname={pathname} />
            <div className="mt-auto border-t border-sidebar-border p-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-xs text-white/50 transition-colors hover:text-emerald-brand"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Retour au site
              </Link>
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className={cn("flex-1 min-w-0", !isLoginScreen && "pb-24 lg:pb-8")}>
          <div className={cn(!isLoginScreen && "mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8")}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      {!isLoginScreen && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-navy lg:hidden">
          <div className="grid grid-cols-4">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                    active ? "text-emerald-brand" : "text-white/60"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="leading-none">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 p-4">
      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
        Navigation
      </p>
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-emerald-brand text-white shadow-sm"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-emerald-brand/15 px-3 py-1 text-xs font-medium text-emerald-300">
      {label}
    </span>
  );
}
