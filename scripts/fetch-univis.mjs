import { XMLParser } from "fast-xml-parser";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const semester = process.argv[2] || "2026s";
if (!/^20\d{2}[sw]$/.test(semester))
  throw new Error("Semester must look like 2026s or 2026w");

const sources = [
  {
    label: "Institut für Informatik",
    url: `https://univis.uni-kiel.de/prg?search=lectures&department=080110000&show=xml&sem=${semester}`,
  },

  // Informatik math special cases
  ...[
    "Mathematik für die Informatik A",
    "Mathematik für die Informatik B",
    "Mathematik für die Informatik C",
  ].map((name) => ({
    label: name,
    url: `https://univis.uni-kiel.de/prg?search=lectures&name=${encodeURIComponent(name)}&show=xml&sem=${semester}`,
  })),

  // Nebenfach BWL
  ...[
    "BWL-EinfBWL",
    "Einführung in die Betriebswirtschaftslehre",
    "BWL-ERW",
    "Externes Rechnungswesen",
    "BWL-ER",
    "Entscheidungsrechnungen",
    "Decision Analysis I",
    "Decision Analysis II",
    "Produktion und Logistik",
    "Marketing",
    "Business Analytics",
    "Controlling",
    "Internationale Rechnungslegung",
    "Grundlagen der Kapitalmarkttheorie",
    "Unternehmensbesteuerung",
    "Service Process Modeling",
    "Operations Research",
    "Organisationsgestaltung",
    "Projektmanagement",
    "Leadership in Organizations",
    "Human Resource Management",
    "Grundlagen des Entrepreneurship",
    "Innovationsmanagement",
  ].map((name) => ({
    label: `BWL: ${name}`,
    url: `https://univis.uni-kiel.de/prg?search=lectures&name=${encodeURIComponent(name)}&show=xml&sem=${semester}`,
  })),

  // Nebenfach Elektrotechnik
  ...[
    "etit1001-01a",
    "Grundgebiete der Elektrotechnik I",
    "etit1003-01a",
    "Grundgebiete der Elektrotechnik II",
    "etit0008-01a",
    "Theoretische Grundlagen der Informationstechnik",
    "etit0002-01a",
    "Signale und Systeme I",
    "etit1004-01a",
    "Grundlagen der Schaltungstechnik",
    "etit0004-01a",
    "Elektrische Energietechnik",
  ].map((name) => ({
    label: `ET: ${name}`,
    url: `https://univis.uni-kiel.de/prg?search=lectures&name=${encodeURIComponent(name)}&show=xml&sem=${semester}`,
  })),

  // Nebenfach Mathematik
  ...[
    "math-linalg1.1",
    "Lineare Algebra I",
    "math-linalg2.1",
    "Lineare Algebra II",
    "math-an1.1",
    "Analysis I",
    "math-an2.1",
    "Analysis II",
    "Einführung in die numerische Mathematik",
  ].map((name) => ({
    label: `Mathe: ${name}`,
    url: `https://univis.uni-kiel.de/prg?search=lectures&name=${encodeURIComponent(name)}&show=xml&sem=${semester}`,
  })),

  // Nebenfach Recht
  ...[
    "BWL-JuOeff",
    "Einführung in das öffentliche Recht",
    "BWL-JuPriv",
    "Privatrecht",
    "Inf-InfRecht",
    "Informatikrecht",
    "Inf-DatSchutz",
    "Datenschutz",
    "Urheberrecht",
  ].map((name) => ({
    label: `Recht: ${name}`,
    url: `https://univis.uni-kiel.de/prg?search=lectures&name=${encodeURIComponent(name)}&show=xml&sem=${semester}`,
  })),

  // Nebenfach VWL
  ...[
    "VWL-EVWL",
    "Einführung in die Volkswirtschaftslehre",
    "VWLvwlMikro1-01a",
    "Grundzüge der mikroökonomischen Theorie I",
    "VWLvwlMikro2-01a",
    "Grundzüge der mikroökonomischen Theorie II",
    "VWLvwlMakro1-01a",
    "Grundzüge der makroökonomischen Theorie I",
    "VWLvwlMakro2-01a",
    "Grundzüge der makroökonomischen Theorie II",
  ].map((name) => ({
    label: `VWL: ${name}`,
    url: `https://univis.uni-kiel.de/prg?search=lectures&name=${encodeURIComponent(name)}&show=xml&sem=${semester}`,
  })),
];

const arrayTags = new Set([
  "Lecture",
  "Person",
  "Room",
  "Event",
  "term",
  "doz",
]);
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (tag) => arrayTags.has(tag),
  processEntities: true,
  parseTagValue: false,
});

const roots = [];
const successfulSources = [];

for (const source of sources) {
  try {
    const response = await fetch(source.url);
    if (!response.ok) {
      console.warn(`Skipping ${source.label}: HTTP ${response.status}`);
      continue;
    }

    const xml = await response.text();
    if (!xml.trimStart().startsWith("<?xml")) {
      console.warn(`Skipping ${source.label}: UnivIS did not return XML`);
      continue;
    }

    roots.push(parser.parse(xml).UnivIS);
    successfulSources.push(source.label);
  } catch (error) {
    console.warn(`Skipping ${source.label}: ${error.message}`);
  }
}

const lectures = roots.flatMap((root) => root.Lecture || []);
const people = roots.flatMap((root) => root.Person || []);
const rooms = roots.flatMap((root) => root.Room || []);

const text = (value) =>
  String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();

const refs = (value) => value?.UnivISRef?.key || "";
const peopleByKey = Object.fromEntries(
  people.map((p) => [
    p.key,
    [p.title, p.firstname, p.lastname].filter(Boolean).map(text).join(" "),
  ]),
);
const roomsByKey = Object.fromEntries(
  rooms.map((r) => [r.key, text(r.short || r.name || "Raum offen")]),
);

const typeMap = {
  V: "lecture",
  VL: "lecture",
  UE: "exercise",
  U: "exercise",
  TU: "tutorial",
  T: "tutorial",
  S: "seminar",
  SE: "seminar",
  P: "practical",
  PR: "practical",
  PRUE: "practical",
  "V-UE": "lecture",
  "V/UE": "lecture",
};

const repeatWeekday = (repeat) => {
  const match = String(repeat || "").match(/^w\d+\s+([1-7])$/);
  return match ? Number(match[1]) : 0;
};
const weekdayOf = (date) =>
  date ? new Date(`${date}T12:00:00Z`).getUTCDay() : 0;
const firstOccurrence = (start, weekday) => {
  if (!start || !weekday) return "";
  const date = new Date(`${start}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + ((weekday - date.getUTCDay() + 7) % 7));
  return date.toISOString().slice(0, 10);
};

const parsedCourses = lectures.map((lecture) => ({
  sourceId: String(lecture.id || lecture.key),
  sourceKey: lecture.key,
  title: text(lecture.name),
  shortTitle: text(lecture.short),
  number: String(lecture.number || ""),
  type: typeMap[lecture.type] || "other",
  rawType: lecture.type || "",
  lecturers: (lecture.dozs?.doz || [])
    .map(refs)
    .map((key) => peopleByKey[key] || key)
    .filter(Boolean),
  parentKey: refs(lecture["parent-lv"]),
  organisation: text(lecture.orgname),
  sourceUrl: `https://univis.uni-kiel.de/go/lecture/${lecture.key}`,
  dates: (lecture.terms?.term || [])
    .map((term) => {
      const weekday = weekdayOf(term.startdate) || repeatWeekday(term.repeat);
      return {
        weekday,
        startTime: term.starttime || "",
        endTime: term.endtime || "",
        startDate:
          term.startdate || firstOccurrence(lecture.startdate, weekday),
        endDate: term.enddate || lecture.enddate || term.startdate || "",
        repeat: term.repeat || "",
        excludedDates: String(term.exclude || "")
          .split(",")
          .filter((value) => /^20\d{2}-\d{2}-\d{2}$/.test(value)),
        room: roomsByKey[refs(term.room)] || refs(term.room) || "Raum offen",
      };
    })
    .filter(
      (date) =>
        date.weekday && date.startDate && date.startTime && date.endTime,
    ),
}));

const courses = [
  ...new Map(parsedCourses.map((course) => [course.sourceId, course])).values(),
];

const MIN_SUCCESSFUL_SOURCES = 10;
const MIN_IMPORTED_COURSES = 100;
const MIN_COURSES_WITH_DATES = 25;

const assertCompleteEnoughImport = () => {
  const coursesWithDates = courses.filter(
    (course) => course.dates.length > 0,
  ).length;

  if (successfulSources.length < MIN_SUCCESSFUL_SOURCES) {
    throw new Error(
      `Refusing incomplete UnivIS import for ${semester}: only ${successfulSources.length} successful searches`,
    );
  }

  if (courses.length < MIN_IMPORTED_COURSES) {
    throw new Error(
      `Refusing incomplete UnivIS import for ${semester}: only ${courses.length} courses parsed`,
    );
  }

  if (coursesWithDates < MIN_COURSES_WITH_DATES) {
    throw new Error(
      `Refusing incomplete UnivIS import for ${semester}: only ${coursesWithDates} courses have usable dates`,
    );
  }
};

assertCompleteEnoughImport();

const output = {
  schemaVersion: 1,
  semester,
  fetchedAt: new Date().toISOString(),
  sourceUrl: "https://univis.uni-kiel.de",
  department: { id: "multi", name: "Informatik + Nebenfach search imports" },
  stats: {
    courses: courses.length,
    people: people.length,
    rooms: rooms.length,
  },
  sources: successfulSources,
  courses,
};

await mkdir("public/data", { recursive: true });
const outputPath = `public/data/univis-${semester}.json`;

let previous = null;
try {
  previous = JSON.parse(await readFile(outputPath, "utf8"));
} catch {}

const comparable = (value) =>
  JSON.stringify({ ...value, fetchedAt: undefined });
if (previous && comparable(previous) === comparable(output)) {
  console.log(`UnivIS ${semester} unchanged (${courses.length} courses)`);
} else {
  await writeFile(outputPath, JSON.stringify(output, null, 2));
  console.log(
    `Imported ${courses.length} courses from ${successfulSources.length} UnivIS searches for ${semester}`,
  );
}
