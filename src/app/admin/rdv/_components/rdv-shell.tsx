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
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
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
  onLogout,
  onNavigate,
}: {
  pathname: string;
  adminName: string;
  adminEmail: string;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-navy text-sidebar-foreground">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link href="/admin/rdv" onClick={onNavigate} className="block">
          <Logo
            size={36}
            textClassName="[&_span]:!text-white [&_span.text-emerald-brand]:!text-[#2D9CDB]"
          />
        </Link>
      </div>

      <div className="px-5 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2D9CDB]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Gestion RDV
        </div>
        <div className="mt-2 text-sm font-medium text-white truncate">{adminName}</div>
        {adminEmail && (
          <div className="text-[11px] text-sidebar-foreground/70 truncate">{adminEmail}</div>
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
                  ? "bg-[#2D9CDB]/15 text-white border-l-2 border-[#2D9CDB] pl-[10px]"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white border-l-2 border-transparent",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#2D9CDB]" : "")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
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
  children,
}: {
  adminName: string;
  adminEmail: string;
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
    <RdvAdminContext.Provider value={{ adminName, adminEmail }}>
      <div className="min-h-screen flex bg-surface">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col sticky top-0 h-screen">
          <SidebarInner
            pathname={pathname}
            adminName={adminName}
            adminEmail={adminEmail}
            onLogout={handleLogout}
          />
        </aside>

        {/* Mobile sheet */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-navy text-white px-4 py-3 flex items-center justify-between border-b border-sidebar-border">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-sidebar-accent">
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
                onLogout={handleLogout}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="text-sm font-semibold tracking-wide">
            SÉCUREX <span className="text-[#2D9CDB]">CONNECT</span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#2D9CDB]">RDV</div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 bg-white border-b border-border lg:static">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between lg:mt-0 mt-14">
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-bold text-navy tracking-tight"
                >
                  {pageTitle}
                </motion.h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Validation & gestion des rendez-vous · SÉCUREX CONNECT
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2D9CDB]/10 px-3 py-1 text-xs font-semibold text-[#2D9CDB]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Gestion RDV
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </RdvAdminContext.Provider>
  );
}
