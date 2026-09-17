import { format, parseISO, isSameDay, isToday, isBefore, addDays, getDaysInMonth, getDate } from 'date-fns';
import { es } from 'date-fns/locale';

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Buenos días 👋';
  } else if (hour >= 12 && hour < 19) {
    return 'Buenas tardes 👋';
  } else {
    return 'Buenas noches 🌙';
  }
}

export function formatDateShort(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'd MMM', { locale: es }).toUpperCase();
  } catch {
    return dateString;
  }
}

export function formatDateFull(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  } catch {
    return dateString;
  }
}

export function formatMonthYear(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMMM yyyy', { locale: es });
  } catch {
    return dateString;
  }
}

export function getRemainingDaysInMonth(currentDate = new Date()): number {
  const totalDays = getDaysInMonth(currentDate);
  const currentDay = getDate(currentDate);
  return Math.max(1, totalDays - currentDay + 1);
}

export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getFormattedTodayLong(): string {
  try {
    return format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return 'hoy';
  }
}
