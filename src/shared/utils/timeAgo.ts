/**
 * Formats an ISO-8601 timestamp into a Spanish relative-time label.
 * Granularity escalates with age: minutes under an hour, hours under a day,
 * days beyond that. Always prefixed with "hace" (e.g. "hace 5 minutos").
 */
export function formatTimeAgoEs(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} minuto${minutes !== 1 ? "s" : ""}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} hora${hours !== 1 ? "s" : ""}`;

  const days = Math.floor(hours / 24);
  return `hace ${days} día${days !== 1 ? "s" : ""}`;
}
