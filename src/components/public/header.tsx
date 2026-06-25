"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, Clock, CalendarCheck } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { PUBLIC_NAV, BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
      {/* top utility bar */}
      <div className="hidden md:block border-b border-border/60 bg-navy text-white/90">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6 text-xs">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-emerald-brand" /> {BRAND.phone}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-brand" /> {BRAND.hours}
            </span>
          </div>
          <span className="text-white/70">{BRAND.address}</span>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center" aria-label="Accueil SÉCUREX CONNECT">
          <Logo size={40} />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {PUBLIC_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3.5 py-2 text-sm font-medium rounded-md transition-colors",
                  active
                    ? "text-emerald-brand bg-accent"
                    : "text-foreground/70 hover:text-navy hover:bg-muted/60"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild className="hidden md:inline-flex bg-emerald-brand hover:bg-emerald-brand/90">
            <Link href="/rendez-vous">
              <CalendarCheck className="mr-1.5 h-4 w-4" /> Prendre RDV
            </Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-16 items-center justify-between border-b px-4">
                <Logo size={36} />
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Fermer">
                    <X className="h-5 w-5" />
                  </Button>
                </SheetClose>
              </div>
              <nav className="flex flex-col p-3">
                {PUBLIC_NAV.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        pathname === item.href
                          ? "bg-accent text-emerald-brand"
                          : "text-foreground/80 hover:bg-muted"
                      )}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Button asChild className="mt-3 bg-emerald-brand hover:bg-emerald-brand/90">
                    <Link href="/rendez-vous">
                      <CalendarCheck className="mr-1.5 h-4 w-4" /> Prendre rendez-vous
                    </Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild variant="outline" className="mt-2">
                    <Link href="/espace-client">Espace Client</Link>
                  </Button>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
