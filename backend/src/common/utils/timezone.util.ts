export const DEFAULT_TIMEZONE = 'UTC';

export const DEFAULT_SETTINGS = {
  workStart: '09:00',
  workEnd: '18:00',
  freeStart: '18:00',
  freeEnd: '22:00',
  timezone: DEFAULT_TIMEZONE,
};

// Parse "HH:mm" into minutes since midnight. Returns NaN for invalid input.
export function toMinutes(hhmm: string): number {
  if (typeof hhmm !== 'string') return NaN;
  const [h, m] = hhmm.split(':').map(Number);
  if (h == null || m == null || Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

// Formats the wall-clock components of `date` in the given IANA timezone.
export function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  // Some environments report midnight as "24"
  const hour = map.hour === '24' ? '00' : map.hour;

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(hour),
    minute: Number(map.minute),
  };
}

// "YYYY-MM-DD" of `date` in the given timezone.
export function toLocalDateStr(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

// Computes the exact instant (server time) at which a reminder should fire for
// the user's current local day, based on their free-time window. Returns null
// when the window is invalid (e.g. crosses midnight).
//
// The reminder is scheduled roughly 1 hour into the free-time window so it lands
// comfortably inside free time (e.g. free 6 PM - 10 PM -> reminder ~7 PM).
export function computeReminderInstant(
  now: Date,
  settings: { freeStart: string; freeEnd: string; timezone?: string },
): Date | null {
  const timeZone = settings?.timezone || DEFAULT_TIMEZONE;

  const freeStart = toMinutes(settings.freeStart);
  const freeEnd = toMinutes(settings.freeEnd);

  if (!Number.isFinite(freeStart) || !Number.isFinite(freeEnd)) return null;
  if (freeEnd <= freeStart) return null; // overnight / invalid free-time window

  const duration = freeEnd - freeStart;
  const offset = Math.min(60, Math.floor(duration / 2));
  const reminderMinute = freeStart + offset;

  // Wall-clock (year/month/day/time) as currently read in the user's timezone.
  const parts = zonedParts(now, timeZone);

  // Offset of the user's timezone from UTC at this moment.
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    0,
  );
  const offsetMs = asUtc - now.getTime();

  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      Math.floor(reminderMinute / 60),
      reminderMinute % 60,
      0,
    ) - offsetMs,
  );
}
