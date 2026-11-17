import Image from "next/image";
import { cn } from "@/shared/utils";

interface BrandProps {
  className?: string;
  logoSize?: "default" | "large";
  /**
   * Color context:
   * - "dark"   — dark surface (staff sidebar): white headline + primary-200 tagline.
   * - "header" — frosted navy pill header (public + candidate nav): renders the
   *              white/cyan wordmark (LogoBlanco.svg) so it reads on the dark pill.
   * - "light"  — light surface: full color SVG wordmark.
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
export function Brand({ className, logoSize = "default", tone = "light", compact = false, subtitle = "Bolsa de Empleo" }: BrandProps) {
  if (tone === "dark") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <Image
          src="/brand/logo_integrity_icon_nv.svg"
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
      <div className={cn("flex items-center", logoSize === "large" && "relative h-[30px] w-[94px] shrink-0", className)}>
        <Image
          src="/brand/logoBlanco_nv.svg"
          alt="Integrity Solutions"
          width={logoSize === "large" ? 200 : 140}
          height={logoSize === "large" ? 85 : 45}
          className={cn("w-auto select-none", logoSize === "large" ? "absolute left-1/2 top-1/2 h-[36px] max-w-none -translate-x-1/2 -translate-y-1/2" : "h-[30px]")}
          priority
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/brand/logo_integrity_full_nv.svg"
        alt="Integrity Solutions"
        width={130}
        height={50}
        priority
      />
    </div>
  );
}

