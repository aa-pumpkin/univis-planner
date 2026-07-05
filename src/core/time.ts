import type { CourseEvent, Weekday } from "./models";

export const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const dateAtNoonUtc = (value: string) => new Date(`${value}T12:00:00Z`);
const addUtcDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};
const normalizeRepeat = (repeat?: string) =>
  (repeat || "").trim().toLowerCase();
const isSingleRepeat = (repeat?: string) =>
  /^s\d*/.test(normalizeRepeat(repeat));
const isBlockRepeat = (repeat?: string) => /^b/.test(normalizeRepeat(repeat));
const repeatInterval = (repeat?: string) =>
  normalizeRepeat(repeat).startsWith("w2") ? 2 : 1;

const firstMatchingWeekday = (startDate: string, weekday: Weekday) => {
  const start = dateAtNoonUtc(startDate);
  return addUtcDays(start, (weekday - start.getUTCDay() + 7) % 7);
};

const blockWeekdays = (event: CourseEvent): Weekday[] => {
  const repeat = normalizeRepeat(event.repeat);
  const match = repeat.match(/^bd\s+([1-5](?:\s*,\s*[1-5])*)/);
  if (match) {
    return [
      ...new Set(
        match[1]
          .split(",")
          .map((value) => Number(value.trim()) as Weekday)
          .filter((value) => value >= 1 && value <= 5),
      ),
    ];
  }
  return [1, 2, 3, 4, 5];
};

export const eventOccurrenceDates = (event: CourseEvent): string[] => {
  if (event.occurrenceDates?.length)
    return [...new Set(event.occurrenceDates)].sort();
  if (!event.startDate || !event.endDate) return [];

  const repeat = normalizeRepeat(event.repeat);
  const excluded = new Set(event.excludedDates || []);

  if (isSingleRepeat(repeat) || event.startDate === event.endDate) {
    return excluded.has(event.startDate) ? [] : [event.startDate];
  }

  if (isBlockRepeat(repeat)) {
    const allowedDays = new Set(blockWeekdays(event));
    const dates: string[] = [];
    for (
      let date = dateAtNoonUtc(event.startDate);
      isoDate(date) <= event.endDate;
      date = addUtcDays(date, 1)
    ) {
      const weekday = date.getUTCDay() as Weekday;
      const value = isoDate(date);
      if (allowedDays.has(weekday) && !excluded.has(value)) dates.push(value);
    }
    return dates;
  }

  const dates: string[] = [];
  for (
    let date = firstMatchingWeekday(event.startDate, event.weekday);
    isoDate(date) <= event.endDate;
    date = addUtcDays(date, 7 * repeatInterval(repeat))
  ) {
    const value = isoDate(date);
    if (!excluded.has(value)) dates.push(value);
  }
  return dates;
};

export const overlaps = (a: CourseEvent, b: CourseEvent) => {
  if (
    minutes(a.startTime) >= minutes(b.endTime) ||
    minutes(b.startTime) >= minutes(a.endTime)
  )
    return false;
  if (!a.startDate || !a.endDate || !b.startDate || !b.endDate)
    return a.weekday === b.weekday;

  const aDates = new Set(eventOccurrenceDates(a));
  if (!aDates.size) return false;
  return eventOccurrenceDates(b).some((date) => aDates.has(date));
};

export const duration = (event: CourseEvent) =>
  minutes(event.endTime) - minutes(event.startTime);

export const isoWeek = (value: string | Date) => {
  const date =
    typeof value === "string"
      ? new Date(`${value}T12:00:00Z`)
      : new Date(value);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export const occursInWeekParity = (
  event: CourseEvent,
  parity: "even" | "odd",
) => {
  const wanted = parity === "even" ? 0 : 1;
  return eventOccurrenceDates(event).some(
    (date) => isoWeek(date) % 2 === wanted,
  );
};
