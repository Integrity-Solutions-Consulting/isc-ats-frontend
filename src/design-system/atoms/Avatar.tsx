'use client';

import { useState } from 'react';
import { cn } from "@/shared/utils";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-9 text-sm",
  lg: "size-10 text-sm",
};

const IMG_SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "size-8",
  md: "size-9",
  lg: "size-10",
};

interface AvatarProps {
  /** Up to two uppercase initials — shown when no src or when image fails to load. */
  initials: string;
  /**
   * Optional image URL. When provided, renders an <img> with a fallback to
   * initials if the image fails to load.
   */
  src?: string;
  /**
   * Size variant: sm=32px, md=36px (default), lg=40px.
   */
  size?: AvatarSize;
  /**
   * Additional classes. Used to supply a custom background color when falling
   * back to initials (e.g. candidate avatars use a color derived from their id).
   */
  className?: string;
}

export function Avatar({ initials, src, size = "md", className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={initials}
        onError={() => setImgError(true)}
        className={cn("shrink-0 rounded-full object-cover", IMG_SIZE_CLASSES[size])}
      />
    );
  }

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
