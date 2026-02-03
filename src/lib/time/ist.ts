const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const TZ_SUFFIX_REGEX = /(Z|[+-]\d{2}:?\d{2})$/;

function hasTimezoneSuffix(value: string) {
  return TZ_SUFFIX_REGEX.test(value);
}

function toIST(date: Date) {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

export function parseTimestampAsIST(input: string | Date): Date {
  if (input instanceof Date) {
    return new Date(input.getTime());
  }

  if (typeof input === "string") {
    if (hasTimezoneSuffix(input)) {
      return new Date(input);
    }

    const match = input
      .trim()
      .match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/,
      );

    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const hour = Number(match[4] || 0);
      const minute = Number(match[5] || 0);
      const second = Number(match[6] || 0);
      const ms = Number((match[7] || "0").padEnd(3, "0"));

      const utcMs = Date.UTC(year, month - 1, day, hour, minute, second, ms);
      return new Date(utcMs - IST_OFFSET_MS);
    }
  }

  return new Date(input);
}

export function getISTParts(date: Date) {
  const ist = toIST(date);
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth() + 1,
    day: ist.getUTCDate(),
    hour: ist.getUTCHours(),
    minute: ist.getUTCMinutes(),
    second: ist.getUTCSeconds(),
  };
}

export function getISTMidnight(date: Date = new Date()) {
  const { year, month, day } = getISTParts(date);
  return new Date(Date.UTC(year, month - 1, day));
}

export function getISTDateString(date: Date = new Date()) {
  const { year, month, day } = getISTParts(date);
  return `${String(year)}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatISTTime(dateInput: Date | string, is24Hour: boolean) {
  const date = parseTimestampAsIST(dateInput);
  if (Number.isNaN(date.getTime())) return "--:--";

  const { hour, minute } = getISTParts(date);

  if (is24Hour) {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  let displayHour = hour % 12;
  displayHour = displayHour ? displayHour : 12;
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${displayHour}:${String(minute).padStart(2, "0")} ${ampm}`;
}

export function isSameISTDate(a: Date, b: Date) {
  const aParts = getISTParts(a);
  const bParts = getISTParts(b);
  return (
    aParts.year === bParts.year &&
    aParts.month === bParts.month &&
    aParts.day === bParts.day
  );
}

export function getISTDayOfWeek(date: Date) {
  const ist = toIST(date);
  return ist.getUTCDay();
}

export function getISTDateNumber(date: Date) {
  return getISTParts(date).day;
}

export function addISTDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export { IST_OFFSET_MS, DAY_MS };
