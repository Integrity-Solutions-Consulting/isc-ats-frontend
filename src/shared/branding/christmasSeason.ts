const ecuadorCalendar = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Guayaquil",
  month: "numeric",
  day: "numeric",
});

/** Recurs annually, from November 17 through January 4 in Ecuador. */
export function isChristmasSeason(date: Date = new Date()): boolean {
  const parts = ecuadorCalendar.formatToParts(date);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return month === 12 || (month === 11 && day >= 17) || (month === 1 && day <= 4);
}

export function getBrandAssets(christmas: boolean) {
  return christmas
    ? {
        icon: "/brand/logo_integrity_icon_nv.svg",
        white: "/brand/logoBlanco_nv.svg",
        full: "/brand/logo_integrity_full_nv.svg",
      }
    : {
        icon: "/brand/logo_integrity_icon.svg",
        white: "/brand/LogoBlanco.svg",
        full: "/brand/logo_integrity_full.svg",
      };
}
