"use client";

import { useEffect, useRef } from "react";

/**
 * Thin wrapper around the Cloudflare Turnstile widget (explicit rendering).
 * Pure UI: it takes a site key and reports the solved token upward — it holds no
 * business logic and does no fetching. The token is verified server-side.
 */

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  action?: string;
}

interface TurnstileApi {
  render: (el: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Load the Turnstile api.js once and resolve when window.turnstile is ready.
 * api.js sets window.turnstile asynchronously after the script's onload, so we
 * poll briefly rather than resolving on load alone.
 */
function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("error", () =>
        reject(new Error("Turnstile script failed to load")),
      );
      document.head.appendChild(script);
    }

    const start = Date.now();
    const waitForApi = () => {
      if (window.turnstile) return resolve();
      if (Date.now() - start > 10_000)
        return reject(new Error("Turnstile load timed out"));
      window.setTimeout(waitForApi, 50);
    };
    waitForApi();
  });
}

interface TurnstileProps {
  siteKey: string;
  /** Called with the token once the challenge is solved. */
  onVerify: (token: string) => void;
  /** Called when the token expires (client must re-solve). */
  onExpire?: () => void;
  /** Called when the widget errors (network, config). */
  onError?: () => void;
  className?: string;
}

export function Turnstile({
  siteKey,
  onVerify,
  onExpire,
  onError,
  className,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Keep callbacks in refs so changing their identity (inline handlers) doesn't
  // tear down and re-render the widget — the effect depends only on the site key.
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  // Sync the latest callbacks after each render (refs must not be mutated during
  // render). The widget callbacks fire later, so they always see the current one.
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        if (widgetIdRef.current) return; // guard double render (strict mode)
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onVerifyRef.current(token),
          "expired-callback": () => onExpireRef.current?.(),
          "error-callback": () => onErrorRef.current?.(),
        });
      })
      .catch(() => onErrorRef.current?.());

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return <div ref={containerRef} className={className} />;
}
