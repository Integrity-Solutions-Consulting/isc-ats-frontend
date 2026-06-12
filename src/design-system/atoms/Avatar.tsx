import { cn } from "@/shared/utils";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-9 text-sm",
  lg: "size-10 text-sm",
};

interface AvatarProps {
  /** Up to two uppercase initials. */
  initials: string;
  /**
   * Size variant: sm=32px, md=36px (default), lg=40px.
   * Override individual dimensions via className if needed.
   */
  size?: AvatarSize;
  /**
   * Additional classes. Use to supply a custom background color and text color
   * when the default brand blue is not appropriate (e.g. candidate avatars).
   * twMerge resolves conflicts, so passing `bg-red-400 text-white` correctly
   * overrides the default `bg-primary-100 text-primary-700`.
   */
  className?: string;
}

/** Initials avatar. The portal uses initials-in-a-circle, not uploaded photos. */
export function Avatar({ initials, size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-primary-100 font-semibold text-primary-700",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}
