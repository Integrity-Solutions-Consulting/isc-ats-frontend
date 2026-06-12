import { differenceInYears, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatBirthDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    const age = differenceInYears(new Date(), d);
    return `${format(d, "d 'de' MMMM yyyy", { locale: es })} · ${age} años`;
  } catch {
    return dateStr;
  }
}
