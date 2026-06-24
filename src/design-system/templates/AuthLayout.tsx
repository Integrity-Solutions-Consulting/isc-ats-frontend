"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/shared/utils";

const CAROUSEL_IMAGES = [
  "/brand/carousel_1.jpeg",
  "/brand/carousel_2.jpeg",
  "/brand/carousel_3.jpeg",
  "/brand/carousel_4.jpeg",
  "/brand/carousel_5.jpeg",
];

interface AuthLayoutProps {
  children: React.ReactNode;
}

/** Split-screen auth shell: form column on the left, brand panel on the right. */
export function AuthLayout({ children }: AuthLayoutProps) {
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
          <Link href="/empleos" className="transition-opacity hover:opacity-90">
            <Image
              src="/brand/LogoBlanco.svg"
              alt="Integrity Solutions"
              width={200}
              height={65}
              className="h-[65px] w-auto select-none"
              priority
            />
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-start pt-4">
          {children}
        </div>
        <p className="text-xs text-ink-muted">© 2026 Integrity Solutions</p>
      </div>

      {/* Brand panel with Photo Carousel */}
      <aside className="relative hidden overflow-hidden bg-[#060B24] lg:block">
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
              className="object-contain"
            />
          </div>
        ))}

        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />

        <div className="relative flex h-full flex-col justify-end p-12">
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white drop-shadow-md">
            Conectando el mejor talento con las mejores oportunidades
          </h2>
        </div>
      </aside>
    </div>
  );
}
