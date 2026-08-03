import type { Metadata } from "next";
import { Inter } from "next/font/google";
// Design tokens live in frontend/globals.css (single source of truth, Tailwind v4 CSS-first).
import "../../globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { CookieConsentBanner } from "@/features/cookies/CookieConsentBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  // Root fallback, inherited by the internal staff portal — its pages define no
  // metadata of their own. Candidate routes override it with "· Mi Chamba".
  // "Bolsa de Empleo" is the internal portal's name on purpose, not a leftover
  // from the Mi Chamba rebrand.
  title: "Bolsa de Empleo · Integrity Solutions",
  description: "Portal interno de Bolsa de Empleo de Integrity Solutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <QueryProvider>{children}</QueryProvider>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
