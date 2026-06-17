import Image from "next/image";
import { cn } from "@/shared/utils";

interface BrandProps {
  className?: string;
  /**
   * Color context:
   * - "dark"   — dark surface (staff sidebar): white headline + primary-200 tagline.
   * - "header" — frosted white pill header (public + candidate nav): dark headline
   *              + muted tagline so text is legible against the near-white background.
   * - "light"  — light surface (login page): full SVG wordmark.
   */
  tone?: "light" | "dark" | "header";
  /** Hide the tagline. */
  compact?: boolean;
  /**
   * Override the tagline text shown below "Integrity Solutions".
   * Defaults to "Bolsa de Empleo" when tone is "dark"/"header" and compact is false.
   */
  subtitle?: string;
}

/** Corporate brand lockup using official SVG assets. */
export function Brand({ className, tone = "light", compact = false, subtitle = "Bolsa de Empleo" }: BrandProps) {
  if (tone === "dark") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <Image
          src="/brand/logo_integrity_icon.svg"
          alt="Integrity Solutions"
          width={30}
          height={30}
          priority
        />
        <span className="leading-tight">
          <span className="block text-sm font-bold text-white">
            Integrity Solutions
          </span>
          {!compact && (
            <span className="block text-xs text-primary-200">{subtitle}</span>
          )}
        </span>
      </div>
    );
  }

  // Frosted header — renders the full white/cyan wordmark logo on dark backgrounds.
  if (tone === "header") {
    return (
      <div className={cn("flex items-center", className)}>
        <Image
          src="/brand/LogoBlanco.svg"
          alt="Integrity Solutions"
          width={140}
          height={45}
          className="h-[30px] w-auto select-none"
          priority
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/brand/logo_integrity_full.svg"
        alt="Integrity Solutions"
        width={130}
        height={50}
        priority
      />
    </div>
  );
}

