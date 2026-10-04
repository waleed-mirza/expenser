import { format, isToday, isYesterday } from "date-fns";

export const DEFAULT_CURRENCY = "PKR";

/** "PKR 1,250" for whole amounts, "PKR 1,250.50" when there are paisa. */
export function formatMoney(cents: number, currency: string = DEFAULT_CURRENCY) {
  const hasFraction = Math.abs(cents) % 100 !== 0;
  const digits = hasFraction ? 2 : 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "code",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
      .format(cents / 100)
      .replace(/ /g, " ");
  } catch {
    return `${currency} ${(cents / 100).toFixed(digits)}`;
  }
}

/** Short axis labels: 1.2K, 3.4M. */
export function formatCompact(cents: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

export function dayLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return format(date, sameYear ? "EEE, MMM d" : "EEE, MMM d, yyyy");
}
