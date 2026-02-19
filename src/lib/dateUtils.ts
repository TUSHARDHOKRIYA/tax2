/**
 * Format dates/times in Indian Standard Time (IST, Asia/Kolkata).
 * Use these helpers so all timestamps display correctly for users in India.
 *
 * Supabase returns timestamps like "2026-02-19T14:30:00" WITHOUT a timezone
 * suffix. JavaScript's `new Date()` treats those as local time, which causes
 * incorrect IST conversion. The `toDate()` helper below appends "Z" (UTC)
 * when the string has no timezone info so the conversion works correctly.
 */

const IST_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
};

const IST_DATE_ONLY: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  year: "numeric",
};

const IST_TIME_ONLY: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
};

/**
 * Parse a date value into a Date object.
 * If the input is a string without timezone info (e.g. from Supabase),
 * append "Z" so it is treated as UTC before converting to IST.
 */
function toDate(date: Date | string): Date {
  if (date instanceof Date) return date;
  const s = date.trim();
  // If the string already contains timezone info (Z, +, or - after time part), use as-is
  if (/Z$/i.test(s) || /[+-]\d{2}:\d{2}$/.test(s) || /[+-]\d{4}$/.test(s)) {
    return new Date(s);
  }
  // Supabase timestamps: "2026-02-19T14:30:00" or "2026-02-19 14:30:00"
  // Append Z to treat as UTC
  return new Date(s.includes("T") ? s + "Z" : s.replace(" ", "T") + "Z");
}

/** Format as date + time in IST (e.g. "19 Feb 2026, 03:45:30 pm") */
export function formatIST(date: Date | string | null | undefined): string {
  if (date == null) return "—";
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", IST_OPTIONS);
}

/** Format as date only in IST (e.g. "19 Feb 2026") */
export function formatISTDate(date: Date | string | null | undefined): string {
  if (date == null) return "—";
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", IST_DATE_ONLY);
}

/** Format as time only in IST (e.g. "03:45:30 pm") */
export function formatISTTime(date: Date | string | null | undefined): string {
  if (date == null) return "—";
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", IST_TIME_ONLY);
}

/** Short date for lists (e.g. "19 Feb '26") */
export function formatISTShort(date: Date | string | null | undefined): string {
  if (date == null) return "—";
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

/** Month and year in IST for grouping (e.g. "February 2026") */
export function formatISTMonthYear(date: Date | string | null | undefined): string {
  if (date == null) return "—";
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "long",
    year: "numeric",
  });
}
