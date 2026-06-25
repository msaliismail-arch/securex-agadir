import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  size = 40,
  className,
  withText = true,
  textClassName,
}: {
  size?: number;
  className?: string;
  withText?: boolean;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo-securex.png"
        alt="SÉCUREX CONNECT — logo officiel"
        width={size}
        height={size}
        priority
        className="shrink-0"
      />
      {withText && (
        <span className={cn("flex flex-col leading-none", textClassName)}>
          <span className="font-bold tracking-tight text-[15px] text-navy">
            SÉCUREX <span className="text-emerald-brand">CONNECT</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Contrôle Technique Agréé
          </span>
        </span>
      )}
    </span>
  );
}
