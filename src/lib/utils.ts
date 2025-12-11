import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse date string as local time to avoid timezone shifts.
 * Date-only strings like "2026-01-13" are parsed as UTC by default,
 * which can shift to the previous day in local timezones behind UTC.
 */
export function parseLocalDate(dateString: string): Date {
  // If it's a date-only string (YYYY-MM-DD), append time to force local parsing
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString + "T00:00:00");
  }
  return new Date(dateString);
}
