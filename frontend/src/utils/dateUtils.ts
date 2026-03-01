import { format, formatDistanceToNow, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string, timeStr?: string): string {
  try {
    const base = format(parseISO(dateStr), 'dd MMM yyyy', { locale: es });
    return timeStr ? `${base} a las ${timeStr}` : base;
  } catch {
    return dateStr;
  }
}

export function formatRelative(date: Date | null): string {
  if (!date) return 'Nunca';
  try {
    return formatDistanceToNow(date, { locale: es, addSuffix: true });
  } catch {
    return '';
  }
}

export function formatDateFriendly(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Hoy';
    if (isTomorrow(d)) return 'Mañana';
    if (isYesterday(d)) return 'Ayer';
    return format(d, 'EEEE dd/MM/yyyy', { locale: es });
  } catch {
    return dateStr;
  }
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function calcAge(dob: string): number {
  if (!dob) return 0;
  try {
    const birth = parseISO(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  } catch {
    return 0;
  }
}

export function formatAge(dob: string): string {
  if (!dob) return '';
  const age = calcAge(dob);
  return `${age} años`;
}
