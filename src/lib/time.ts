import {
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

export const DEFAULT_TZ = "Asia/Karachi";

export function toZoned(date: Date | string, tz: string = DEFAULT_TZ) {
  return utcToZonedTime(typeof date === "string" ? new Date(date) : date, tz);
}

export function toUtc(date: Date | string, tz: string = DEFAULT_TZ) {
  const dt = typeof date === "string" ? new Date(date) : date;
  return zonedTimeToUtc(dt, tz);
}

export function dayRange(date: Date, tz: string = DEFAULT_TZ) {
  const zoned = toZoned(date, tz);
  const start = startOfDay(zoned);
  const end = endOfDay(zoned);
  return { start, end };
}

/** UTC instants at which the current day / Monday-based week / month began in `tz`. */
export function periodStarts(now: Date, tz: string = DEFAULT_TZ) {
  const zoned = toZoned(now, tz);
  return {
    day: toUtc(startOfDay(zoned), tz),
    week: toUtc(startOfWeek(zoned, { weekStartsOn: 1 }), tz),
    month: toUtc(startOfMonth(zoned), tz),
  };
}

export function weekRange(anchor: Date, tz: string = DEFAULT_TZ) {
  const zoned = toZoned(anchor, tz);
  const start = startOfWeek(zoned, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(zoned, { weekStartsOn: 1 }); // Sunday end
  return { start, end };
}
