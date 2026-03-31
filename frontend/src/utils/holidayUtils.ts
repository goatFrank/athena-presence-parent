/**
 * Utility to check for Italian public holidays.
 */

/**
 * Calculates Easter Sunday for a given year using the Meeus/Jones/Butcher algorithm.
 * @param year The year to calculate Easter for.
 * @returns A Date object representing Easter Sunday.
 */
export const getEaster = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

/**
 * Calculates Easter Monday for a given year.
 * @param year The year to calculate Easter Monday for.
 * @returns A Date object representing Easter Monday.
 */
export const getEasterMonday = (year: number): Date => {
  const easter = getEaster(year);
  easter.setDate(easter.getDate() + 1);
  return easter;
};

/**
 * Checks if a date is a public holiday in Italy.
 * @param date The date to check.
 * @returns True if the date is a holiday, false otherwise.
 */
export const isHoliday = (date: Date): boolean => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // Fixed holidays
  if (month === 0 && day === 1) return true;  // New Year's Day
  if (month === 0 && day === 6) return true;  // Epiphany
  if (month === 3 && day === 25) return true; // Liberation Day
  if (month === 4 && day === 1) return true;  // Labour Day
  if (month === 5 && day === 2) return true;  // Republic Day
  if (month === 7 && day === 15) return true; // Assumption Day (Ferragosto)
  if (month === 10 && day === 1) return true; // All Saints' Day
  if (month === 11 && day === 8) return true; // Immaculate Conception
  if (month === 11 && day === 25) return true; // Christmas Day
  if (month === 11 && day === 26) return true; // St. Stephen's Day

  // Variable holidays (Easter Sunday and Easter Monday)
  const easter = getEaster(year);
  if (
    month === easter.getMonth() &&
    day === easter.getDate()
  ) {
    return true; // Easter Sunday
  }

  const easterMonday = getEasterMonday(year);
  if (
    month === easterMonday.getMonth() &&
    day === easterMonday.getDate()
  ) {
    return true; // Easter Monday
  }

  return false;
};

/**
 * Formats a date to ISO string (YYYY-MM-DD) taking local timezone into account.
 */
export const formatToIso = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
