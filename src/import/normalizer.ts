import type { ImportedCourse, ImportedDate, UnivisDataset } from "./univis";
import type { CourseEvent, EventType, Module, Weekday } from "../core/models";

export interface ModuleMapping {
  title?: string;
  semester: number;
  category: "mandatory" | "elective";
  ects: number;
}
export interface ImportedEventOption {
  id: string;
  title: string;
  type: string;
  lecturers: string[];
  dates: ImportedDate[];
  sourceUrl: string;
}
export interface NormalizedModule {
  id: string;
  code: string;
  title: string;
  category: "mandatory" | "elective" | "unmapped";
  semester: number | null;
  ects: number | null;
  fixedEvents: ImportedEventOption[];
  selectableGroups: {
    id: string;
    title: string;
    options: ImportedEventOption[];
  }[];
  warnings: string[];
}

const codePatterns = [
  /(inf[A-Za-z]+-\d+[a-z]?)/i,
  /(Inf-Math-[A-Za-z])/i,
  /(Inf-[A-Za-z]+)/,
];
export function moduleCode(course: ImportedCourse, parent?: ImportedCourse) {
  const values = [
    course.shortTitle,
    parent?.shortTitle,
    course.title,
    parent?.title,
  ].filter(Boolean) as string[];
  const joined = values.join(" ");
  if (/(?:Mathematik für die Informatik B|InfMathB|MathInfB)/i.test(joined))
    return "Inf-Math-B";
  if (/(?:Mathematik für die Informatik C|InfMathC|MathInfC)/i.test(joined))
    return "Inf-Math-C";
  if (
    /(?:Mathematik für die Informatik A|InfMathA|MathInfA)/i.test(joined) &&
    !/2F/i.test(joined)
  )
    return "Inf-Math-A";
  if (/Einführung in die Informatik/i.test(joined)) return "infEInf-02a";
  if (/Computersysteme|CompSys/i.test(joined)) return "Inf-CompSys";
  if (/Wissenschaftliches Arbeiten/i.test(joined)) return "inf-wissArb";
  if (/Data Science Projekt/i.test(joined)) return "infDSProj-01a";
  if (/Einführung in die Algorithmik|EinfAlgo/i.test(joined))
    return "infEAlg-01a";
  for (const value of values)
    for (const pattern of codePatterns) {
      const match = value.match(pattern);
      if (match) return match[1];
    }
  return (parent?.title || course.title)
    .replace(
      /^(Übung|Exercise|Tutorien?|Practical Exercise)\s+(zu|zur)?:?\s*/i,
      "",
    )
    .split(":")[0]
    .trim();
}
const signature = (course: ImportedCourse) =>
  JSON.stringify([course.type, course.title, course.dates]);
const option = (course: ImportedCourse): ImportedEventOption => ({
  id: course.sourceId,
  title: course.title,
  type: course.type,
  lecturers: course.lecturers,
  dates: course.dates,
  sourceUrl: course.sourceUrl,
});
const isFixedCourse = (course: ImportedCourse) =>
  course.type === "lecture" ||
  course.type === "seminar" ||
  course.type === "practical" ||
  /^v(?:-ue)?$/i.test(course.rawType);

export function normalizeUnivisModules(
  dataset: UnivisDataset,
  mappings: Record<string, ModuleMapping>,
): NormalizedModule[] {
  const unique = [
    ...new Map(
      dataset.courses.map((course) => [signature(course), course]),
    ).values(),
  ];
  const byKey = new Map(
    dataset.courses.map((course) => [course.sourceKey, course]),
  );
  const grouped = new Map<string, ImportedCourse[]>();
  for (const course of unique) {
    const code = moduleCode(course, byKey.get(course.parentKey));
    grouped.set(code, [...(grouped.get(code) || []), course]);
  }
  return [...grouped]
    .map(([code, courses]) => {
      const mapping = mappings[code];
      const fixed = courses.filter(isFixedCourse);
      // Tutorials are optional in UnivIS and must never be forced as the module's exercise choice.
      const selectable = courses.filter((course) => course.type === "exercise");
      // Different UnivIS components of one module are cumulative requirements, not alternatives.
      // Example: EinfIoT-01a (exercise) and PEinfIoT-01a (practical exercise).
      const components = new Map<string, ImportedCourse[]>();
      for (const course of selectable) {
        const key = (course.shortTitle || course.title.replace(/:.*/, ""))
          .trim()
          .toLocaleLowerCase("de");
        components.set(key, [...(components.get(key) || []), course]);
      }
      const selectableGroups = [...components.entries()]
        .map(([component, courses]) => {
          const options = [
            ...new Map(
              courses
                .flatMap((course) =>
                  course.dates
                    .filter(
                      (date) =>
                        /^w\d+\s/.test(date.repeat) ||
                        date.startDate !== date.endDate,
                    )
                    .map((date, index) => {
                      const value = option(course);
                      return {
                        ...value,
                        id: `${value.id}-${index}`,
                        dates: [date],
                      };
                    }),
                )
                .map((value) => [JSON.stringify(value.dates), value]),
            ).values(),
          ];
          return {
            id: `${code}-${component}-groups`,
            title: courses[0]?.title || "Übung / Gruppe",
            options,
          };
        })
        .filter((group) => group.options.length);
      const title =
        mapping?.title ||
        fixed[0]?.title?.replace(/^[^:]+:\s*/, "") ||
        courses[0].title;
      return {
        id: `univis-${code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        code,
        title,
        category: mapping?.category || "unmapped",
        semester: mapping?.semester ?? null,
        ects: mapping?.ects ?? null,
        fixedEvents: fixed.map(option),
        selectableGroups,
        warnings: [
          ...(!mapping ? ["Keine offizielle BSc-Zuordnung vorhanden"] : []),
          ...(!fixed.length ? ["Keine Hauptveranstaltung erkannt"] : []),
        ],
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, "de"));
}

const colors = [
  "#087f73",
  "#d66b45",
  "#3c927d",
  "#3e78a0",
  "#c1842f",
  "#a65757",
  "#4f7393",
  "#607b70",
];
const colorFor = (value: string) =>
  colors[
    [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
      colors.length
  ];
const normalizeRepeat = (repeat?: string) =>
  (repeat || "").trim().toLowerCase();
const dateGroupKey = (date: ImportedDate) => {
  const repeat = normalizeRepeat(date.repeat);
  if (/^s\d*/.test(repeat))
    return `single-${date.startDate}-${date.startTime}-${date.endTime}-${date.room}`;
  if (/^b/.test(repeat))
    return `block-${repeat}-${date.startDate}-${date.endDate}-${date.startTime}-${date.endTime}-${date.room}`;
  return `weekly-${repeat || "w1"}-${date.weekday}-${date.startTime}-${date.endTime}-${date.room}`;
};
const groupedDates = (dates: ImportedDate[]) => [
  ...dates
    .reduce((groups, date) => {
      const key = dateGroupKey(date);
      groups.set(key, [...(groups.get(key) || []), date]);
      return groups;
    }, new Map<string, ImportedDate[]>())
    .values(),
];
const mergeRooms = (a: string, b: string) =>
  a === b ? a : [...new Set([a, b].filter(Boolean))].join(" / ");
const mergeExcludedDates = (a: ImportedDate, b: ImportedDate) =>
  [...new Set([...(a.excludedDates || []), ...(b.excludedDates || [])])].sort();
const eventFrom = (
  item: ImportedEventOption,
  moduleId: string,
  index: number,
  dateIndex = 0,
): CourseEvent | null => {
  const merged = new Map<string, ImportedDate>();
  for (const date of item.dates.filter(
    (d) =>
      d.weekday >= 1 &&
      d.weekday <= 5 &&
      d.startTime &&
      d.endTime &&
      d.startDate &&
      d.endDate,
  )) {
    const key = dateGroupKey(date),
      previous = merged.get(key);
    if (!previous)
      merged.set(key, {
        ...date,
        excludedDates: [...(date.excludedDates || [])],
      });
    else
      merged.set(key, {
        ...previous,
        startDate:
          previous.startDate < date.startDate
            ? previous.startDate
            : date.startDate,
        endDate:
          previous.endDate > date.endDate ? previous.endDate : date.endDate,
        room: mergeRooms(previous.room, date.room),
        excludedDates: mergeExcludedDates(previous, date),
      });
  }
  const dates = [...merged.values()];
  const date = dates[dateIndex];
  if (!date) return null;
  return {
    id: `${moduleId}-${item.id}-${index}-${dateIndex}`,
    moduleId,
    title: item.title,
    type: item.type as EventType,
    weekday: date.weekday as Weekday,
    startTime: date.startTime,
    endTime: date.endTime,
    startDate: date.startDate,
    endDate: date.endDate,
    repeat: date.repeat,
    excludedDates: date.excludedDates || [],
    room: date.room,
    lecturer: item.lecturers.join(", "),
    sourceUrl: item.sourceUrl,
  };
};
export function toPlannerModules(normalized: NormalizedModule[]): Module[] {
  return normalized
    .filter((item) => item.semester !== null && item.category !== "unmapped")
    .map((item) => {
      const fixedEvents = item.fixedEvents
        .flatMap((event, index) =>
          groupedDates(
            event.dates.filter((date) => date.startTime && date.endTime),
          ).map((dates, dateIndex) =>
            eventFrom({ ...event, dates }, item.id, index * 100 + dateIndex, 0),
          ),
        )
        .filter((event): event is CourseEvent => Boolean(event))
        .map((event) => ({ ...event, isFixed: true }));
      const selectableGroups = item.selectableGroups
        .map((group) => ({
          id: `${item.id}-${group.id}`,
          title: group.title,
          options: group.options
            .map((event, index) => eventFrom(event, item.id, index))
            .filter((event): event is CourseEvent => Boolean(event)),
        }))
        .filter((group) => group.options.length);
      const lecturers = [
        ...new Set(
          [
            ...item.fixedEvents,
            ...item.selectableGroups.flatMap((group) => group.options),
          ]
            .flatMap((event) => event.lecturers)
            .filter(Boolean),
        ),
      ].join(", ");
      return {
        id: item.id,
        title: item.title,
        shortTitle: item.code,
        ects: item.ects,
        category: item.category as "mandatory" | "elective",
        semesterRecommendation: item.semester!,
        lecturer: lecturers,
        color: colorFor(item.code),
        fixedEvents,
        selectableGroups,
      };
    })
    .filter(
      (module) => module.fixedEvents.length || module.selectableGroups.length,
    );
}
