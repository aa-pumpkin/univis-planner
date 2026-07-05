import type { CourseEvent, Module, Preferences } from "./models";
import { eventOccurrenceDates } from "./time";

const escapeIcs = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
const compactDate = (value: string) => value.replaceAll("-", "");
const compactTime = (value: string) => {
  const [hours, minutes] = value.split(":");
  return `${hours.padStart(2, "0")}${minutes.padStart(2, "0")}00`;
};
const eventDescription = (event: CourseEvent) =>
  escapeIcs(
    `${event.type}${event.lecturer ? ` · ${event.lecturer}` : ""}${event.repeat ? ` · UnivIS repeat: ${event.repeat}` : ""}`,
  );

function pushSingleOccurrence(
  lines: string[],
  event: CourseEvent,
  date: string,
  index: number,
) {
  const start = compactTime(event.startTime);
  const end = compactTime(event.endTime);
  lines.push(
    "BEGIN:VEVENT",
    `UID:${event.id}-${index + 1}@univis-planner`,
    `DTSTART;TZID=Europe/Berlin:${compactDate(date)}T${start}`,
    `DTEND;TZID=Europe/Berlin:${compactDate(date)}T${end}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `LOCATION:${escapeIcs(event.room)}`,
    `DESCRIPTION:${eventDescription(event)}`,
    "END:VEVENT",
  );
}

export function exportIcs(events: CourseEvent[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UnivIS Planner//DE",
    "CALSCALE:GREGORIAN",
    "X-WR-TIMEZONE:Europe/Berlin",
  ];
  for (const event of events) {
    if (!event.startDate || !event.endDate)
      throw new Error(`Für ${event.title} fehlen Semesterdaten`);
    const occurrenceDates = eventOccurrenceDates(event);
    occurrenceDates.forEach((date, index) =>
      pushSingleOccurrence(lines, event, date, index),
    );
  }
  return lines.concat("END:VCALENDAR").join("\r\n");
}

export const download = (name: string, content: string, type: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
};
export const exportPlan = (
  semester: string,
  moduleIds: string[],
  choices: Record<string, string>,
  preferences: Preferences,
) =>
  JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      semester,
      moduleIds,
      choices,
      preferences,
    },
    null,
    2,
  );
export type PlanFile = {
  version: number;
  semester: string;
  moduleIds: string[];
  choices: Record<string, string>;
  preferences: Preferences;
};
export const moduleName = (event: CourseEvent, modules: Module[]) =>
  modules.find((m) => m.id === event.moduleId)?.title ?? event.title;
