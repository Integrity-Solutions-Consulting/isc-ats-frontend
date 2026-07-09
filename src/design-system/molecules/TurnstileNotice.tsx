/**
 * Discreet attribution shown when the Turnstile widget runs invisibly
 * (appearance "interaction-only"). Cloudflare asks for this notice, linking to
 * its Privacy Policy and Terms, when the visible challenge box is hidden.
 * Pure UI: no logic, no fetching.
 */

interface TurnstileNoticeProps {
  className?: string;
}

export function TurnstileNotice({ className }: TurnstileNoticeProps) {
  return (
    <p className={`text-center text-xs text-ink-subtle ${className ?? ""}`}>
      Protegido por Cloudflare —{" "}
      <a
        href="https://www.cloudflare.com/privacypolicy/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-ink-muted"
      >
        Privacidad
      </a>{" "}
      ·{" "}
      <a
        href="https://www.cloudflare.com/website-terms/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-ink-muted"
      >
        Términos
      </a>
    </p>
  );
}
