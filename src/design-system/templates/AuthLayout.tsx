"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./AuthSnow.module.css";
import { useChristmasSeason } from "@/providers/SeasonalBrandingProvider";
import { getBrandAssets } from "@/shared/branding/christmasSeason";

const CAROUSEL_IMAGES = [
  "/brand/carousel_0_1.jpeg",
  "/brand/carousel_2_2.jpeg",
  "/brand/carousel_1_1.jpeg",
  "/brand/carousel_3_3.jpeg",
  "/brand/carousel_4_4.jpeg",
  "/brand/carousel5_5.jpeg",
  "/brand/carousel_6_6.jpeg",
  "/brand/carousel_7_7.jpeg",
  "/brand/carousel_9_9.jpeg",
];

interface AuthLayoutProps {
  children: React.ReactNode;
}

/** Split-screen auth shell: form column on the left, brand panel on the right. */
export function AuthLayout({ children }: AuthLayoutProps) {
  const christmas = useChristmasSeason();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="integrity-public-theme grid min-h-dvh lg:grid-cols-[minmax(0,520px)_1fr] bg-bg text-ink">
      {/* Form column */}
      <div className="flex flex-col gap-6 px-8 py-8 sm:px-14">
        {/* Back link */}
        <div className="flex items-center">
          <Link
            href="/empleos"
            className="text-[13px] font-medium text-ink-muted hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={16} />
            Volver a empleos
          </Link>
        </div>

        {/* Large centered logo */}
        <div className="flex justify-center mt-4 mb-0">
          <Link href="/empleos" className={christmas ? "block w-[280px] max-w-full transition-opacity hover:opacity-90 sm:w-[320px]" : "transition-opacity hover:opacity-90"}>
            <Image
              src={getBrandAssets(christmas).white}
              alt="Integrity Solutions"
              width={christmas ? 320 : 200}
              height={christmas ? 136 : 65}
              className={christmas ? "h-auto w-full select-none" : "h-[65px] w-auto select-none"}
              priority
            />
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-start pt-4">
          {children}
        </div>
        <p className="text-xs text-ink-muted">© 2026 Integrity Solutions</p>
      </div>

      {/* Brand panel with Photo Carousel.
          self-start + fixed viewport height keep the panel decoupled from the
          form column's height: when the password checklist grows the left
          column, the carousel no longer re-centers (object-contain) and stays put. */}
      <aside className="relative hidden overflow-hidden bg-[#060B24] lg:block lg:sticky lg:top-0 lg:h-dvh lg:self-start">
        {CAROUSEL_IMAGES.map((src, i) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === index ? "opacity-75" : "opacity-0"
              }`}
          >
            <Image
              src={src}
              alt="Talent and Collaboration"
              fill
              priority={i === 0}
              className="object-cover"
            />
          </div>
        ))}

        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />

        {christmas && <div className={styles.snow} aria-hidden="true">
          {Array.from({ length: 20 }, (_, i) => (
            <span
              key={i}
              className={styles.flake}
              style={{
                left: `${(i * 37 + 7) % 100}%`,
                width: `${3 + (i % 3)}px`,
                height: `${3 + (i % 3)}px`,
                opacity: 0.3 + (i % 4) * 0.08,
                animationDuration: `${14 + (i % 7) * 2}s`,
                animationDelay: `${-i * 3.7}s`,
                "--snow-drift": `${i % 2 ? -24 : 24}px`,
              } as CSSProperties}
            />
          ))}
        </div>}

        <div className="relative flex h-full flex-col justify-end p-12">
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white drop-shadow-md">
            Conectando el mejor talento con las mejores oportunidades
          </h2>
        </div>
      </aside>
    </div>
  );
}
