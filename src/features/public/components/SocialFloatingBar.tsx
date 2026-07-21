import { SOCIAL_LINKS } from '../constants/socialLinks';

export function SocialFloatingBar() {
  return (
    <div className="fixed bottom-6 right-6 z-40 hidden flex-row gap-2 sm:flex">
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.name}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.name}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-ink-muted shadow-sm transition-colors hover:border-primary hover:text-primary"
        >
          {social.icon}
        </a>
      ))}
    </div>
  );
}
