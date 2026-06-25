"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  Clock,
  CheckCircle2,
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle,
  X,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { RdvAdminContext } from "./rdv-context";

const NAV_ITEMS = [
  { href: "/admin/rdv", label: "Planning", icon: CalendarDays, exact: true },
  { href: "/admin/rdv/calendar", label: "Vue calendrier", icon: CalendarRange },
  { href: "/admin/rdv/pending", label: "En attente", icon: Clock },
  { href: "/admin/rdv/approved", label: "Validés", icon: CheckCircle2 },
];

function isActivePath(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function SidebarInner({
  pathname,
  adminName,
  adminEmail,
  adminRole,
  onLogout,
  onNavigate,
}: {
  pathname: string;
  adminName: string;
  adminEmail: string;
  adminRole: string;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link href="/admin/rdv" onClick={onNavigate} className="block">
          <Logo size={36} />
        </Link>
      </div>

      <div className="px-5 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-info">
          <ShieldCheck className="h-3.5 w-3.5" />
          {adminRole === "SUPER" ? "Super Admin" : "RDV Admin"}
        </div>
        <div className="mt-2 text-sm font-medium text-foreground truncate">{adminName}</div>
        {adminEmail && (
          <div className="text-[11px] text-muted-foreground truncate">{adminEmail}</div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 scroll-thin overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-brand-gradient text-white shadow-soft"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <Link
          href="/admin/profile"
          onClick={onNavigate}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <UserCircle className="h-4 w-4" />
          Mon profil
        </Link>
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}

export function RdvShell({
  adminName,
  adminEmail,
  adminRole = "RDV",
  children,
}: {
  adminName: string;
  adminEmail: string;
  adminRole?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Déconnecté");
      router.push("/admin/select-account");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  // Derive page title from pathname
  const currentItem = NAV_ITEMS.find((i) => isActivePath(pathname, i.href, i.exact));
  const pageTitle = currentItem?.label ?? "Gestion RDV";

  return (
    <RdvAdminContext.Provider value={{ adminName, adminEmail, adminRole }}>
      <div className="min-h-screen flex bg-mesh">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col sticky top-0 h-screen border-r border-sidebar-border">
          <SidebarInner
            pathname={pathname}
            adminName={adminName}
            adminEmail={adminEmail}
            adminRole={adminRole}
            onLogout={handleLogout}
          />
        </aside>

        {/* Mobile sheet */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-strong border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground hover:bg-sidebar-accent">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 border-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Gestion RDV</SheetTitle>
              </SheetHeader>
              <SidebarInner
                pathname={pathname}
                adminName={adminName}
                adminEmail={adminEmail}
                adminRole={adminRole}
                onLogout={handleLogout}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="text-sm font-semibold tracking-wide">
            <span className="text-foreground">SÉCUREX <span className="text-primary">CONNECT</span></span>
          </div>
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
            adminRole === "SUPER"
              ? "bg-primary/10 text-primary"
              : "bg-info/10 text-info"
          )}>
            {adminRole === "SUPER" ? "SUPER" : "RDV"}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 glass-strong border-b border-border lg:static">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between lg:mt-0 mt-14 gap-3">
              <div className="min-w-0">
                <motion.h1
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-bold text-foreground tracking-tight truncate"
                >
                  {pageTitle}
                </motion.h1>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Gestion des rendez-vous · SÉCUREX CONNECT
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <span className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border",
                  adminRole === "SUPER"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-info/10 text-info border-info/20"
                )}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {adminRole === "SUPER" ? "Super Admin" : "RDV Admin"}
                </span>
                <ThemeToggle />
              </div>
              <div className="sm:hidden shrink-0">
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </RdvAdminContext.Provider>
  );
}
