"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, Clock, CalendarCheck } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { PUBLIC_NAV, BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  // Gate Radix interactive components (Sheet) until after client mount.
  // This prevents the `aria-controls` hydration mismatch caused by Radix's
  // useId() generating different IDs on server vs client.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* subtle light utility bar — phone + hours */}
      <div className="hidden border-b border-border/60 bg-secondary/60 text-foreground/70 md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6 text-xs">
          <div className="flex items-center gap-5">
            <a
              href={`tel:${BRAND.phoneRaw}`}
              className="flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <Phone className="h-3.5 w-3.5 text-primary" /> {BRAND.phone}
            </a>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" /> {BRAND.hours}
            </span>
          </div>
          <span className="text-muted-foreground">{BRAND.address}</span>
        </div>
      </div>

      {/* main bar — clean white glassmorphism */}
      <div className="glass border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center" aria-label="Accueil SÉCUREX CONNECT">
            <Logo size={40} />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            {PUBLIC_NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild className="hidden bg-brand-gradient text-white shadow-soft hover:opacity-90 md:inline-flex">
              <Link href="/rendez-vous">
                <CalendarCheck className="mr-1.5 h-4 w-4" /> Prendre RDV
              </Link>
            </Button>

            {mounted ? (
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Ouvrir le menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] border-border bg-background p-0 sm:w-[340px]">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <div className="flex h-16 items-center justify-between border-b border-border px-4">
                    <Logo size={36} />
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" aria-label="Fermer le menu">
                        <X className="h-5 w-5" />
                      </Button>
                    </SheetClose>
                  </div>
                  <nav className="flex flex-col p-3" aria-label="Navigation mobile">
                  {PUBLIC_NAV.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={pathname === item.href ? "page" : undefined}
                        className={cn(
                          "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                          pathname === item.href
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/80 hover:bg-muted"
                        )}
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Button asChild className="mt-3 bg-brand-gradient text-white hover:opacity-90">
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
            ) : (
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Ouvrir le menu" disabled>
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
