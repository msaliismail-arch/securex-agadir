"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  Tag,
  Megaphone,
  CalendarDays,
  Users,
  BarChart3,
  ScrollText,
  UserCog,
  Settings,
  LogOut,
  Menu,
  Loader2,
  Globe2,
  ExternalLink,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { toast } from "sonner";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  featured?: boolean;
};

const NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Gestion du site", href: "/admin/dashboard/website", icon: Globe2, featured: true },
  { label: "Catégories & Services", href: "/admin/dashboard/categories", icon: FolderTree },
  { label: "Tarifs", href: "/admin/dashboard/tarifs", icon: Tag },
  { label: "Annonces", href: "/admin/dashboard/annonces", icon: Megaphone },
  { label: "Rendez-vous", href: "/admin/dashboard/appointments", icon: CalendarDays },
  { label: "Clients", href: "/admin/dashboard/clients", icon: Users },
  { label: "Statistiques", href: "/admin/dashboard/analytics", icon: BarChart3 },
  { label: "Journal d'audit", href: "/admin/dashboard/audit", icon: ScrollText },
  { label: "Utilisateurs", href: "/admin/dashboard/users", icon: UserCog },
  { label: "Paramètres", href: "/admin/dashboard/settings", icon: Settings },
];

function pageTitle(pathname: string): string {
  const match = NAV.find((n) => n.href === pathname);
  return match?.label ?? "Administration";
}

function SidebarContent({
  adminName,
  onNavigate,
}: {
  adminName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Déconnexion réussie");
      startTransition(() => router.push("/admin/select-account"));
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="border-b border-sidebar-border px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-primary/20">
            <Logo size={26} withText={false} />
          </span>
          <div className="leading-tight">
            <p className="text-[14px] font-bold tracking-tight text-foreground">
              SÉCUREX <span className="text-primary">CONNECT</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Console Admin
            </p>
          </div>
        </div>
      </div>

      {/* Admin identity */}
      <div className="border-b border-sidebar-border px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-primary/30 ring-1 ring-primary/15">
            <AvatarFallback className="bg-primary/10 text-[12px] font-semibold text-primary">
              {initials(adminName || "Admin Général")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground">
              {adminName || "Admin Général"}
            </p>
            <Badge className="mt-1 gap-1 bg-primary/10 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary hover:bg-primary/20">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Super Admin
            </Badge>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="scroll-thin flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="truncate">{item.label}</span>
              {item.featured && !active && (
                <Badge className="ml-auto bg-primary/10 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary">
                  New
                </Badge>
              )}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          onClick={logout}
          disabled={pending}
          className="w-full justify-start gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Déconnexion
        </Button>
      </div>
    </div>
  );
}

export function DashboardShell({
  adminName,
  children,
}: {
  adminName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent adminName={adminName} />
      </aside>

      {/* Main area */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <SidebarContent
                  adminName={adminName}
                  onNavigate={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-[15px] font-semibold text-foreground sm:text-[17px]">
                {pageTitle(pathname)}
              </h1>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                Console Super Admin · SÉCUREX CONNECT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-primary sm:inline-flex"
            >
              Voir le site <ExternalLink className="h-3 w-3" />
            </Link>
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                {initials(adminName || "Admin Général")}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-background px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
