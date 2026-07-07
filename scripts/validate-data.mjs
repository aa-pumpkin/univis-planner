import { readFile } from "node:fs/promises";

const MIN_UNIVIS_COURSES = 100;
const MIN_UNIVIS_SOURCES = 10;
const MIN_DATED_COURSES = 25;
const MIN_ELECTIVES = 20;

const requiredTitles = [
  "Einführung in die Informatik",
  "Mathematik für die Informatik",
  "Computer Networks",
  "Softwaretechnik",
];

const readJson = async (path) => {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read ${path}: ${error.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const validateUnivisTerm = async (semester) => {
  const path = `public/data/univis-${semester}.json`;
  const data = await readJson(path);

  assert(data.schemaVersion === 1, `${path}: wrong or missing schemaVersion`);
  assert(
    data.semester === semester,
    `${path}: semester field does not match file name`,
  );
  assert(Array.isArray(data.sources), `${path}: sources must be an array`);
  assert(Array.isArray(data.courses), `${path}: courses must be an array`);
  assert(
    data.sources.length >= MIN_UNIVIS_SOURCES,
    `${path}: only ${data.sources.length} successful UnivIS searches`,
  );
  assert(
    data.courses.length >= MIN_UNIVIS_COURSES,
    `${path}: only ${data.courses.length} courses`,
  );

  const coursesWithDates = data.courses.filter(
    (course) => Array.isArray(course.dates) && course.dates.length > 0,
  );
  assert(
    coursesWithDates.length >= MIN_DATED_COURSES,
    `${path}: only ${coursesWithDates.length} courses have dates`,
  );

  for (const course of coursesWithDates) {
    assert(course.title, `${path}: course with dates is missing title`);
    for (const date of course.dates) {
      assert(
        date.weekday >= 1 && date.weekday <= 7,
        `${path}: invalid weekday in ${course.title}`,
      );
      assert(
        /^\d{1,2}:\d{2}/.test(date.startTime),
        `${path}: invalid startTime in ${course.title}`,
      );
      assert(
        /^\d{1,2}:\d{2}/.test(date.endTime),
        `${path}: invalid endTime in ${course.title}`,
      );
      assert(
        /^20\d{2}-\d{2}-\d{2}$/.test(date.startDate),
        `${path}: invalid startDate in ${course.title}`,
      );
    }
  }

  const titleText = data.courses.map((course) => course.title || "").join("\n");
  const matchedRequiredTitles = requiredTitles.filter((title) =>
    titleText.includes(title),
  );
  assert(
    matchedRequiredTitles.length >= 2,
    `${path}: too few key Informatik modules found (${matchedRequiredTitles.join(", ") || "none"})`,
  );

  console.log(
    `Validated ${path}: ${data.courses.length} courses, ${coursesWithDates.length} with dates, ${data.sources.length} sources`,
  );
};

const manifest = await readJson("public/data/current-terms.json");
assert(
  manifest.schemaVersion === 1,
  "current-terms.json: wrong or missing schemaVersion",
);
assert(manifest.terms?.even, "current-terms.json: missing even term");
assert(manifest.terms?.odd, "current-terms.json: missing odd term");

for (const semester of new Set(Object.values(manifest.terms))) {
  assert(
    /^20\d{2}[sw]$/.test(semester),
    `current-terms.json: invalid semester ${semester}`,
  );
  await validateUnivisTerm(semester);
}

const electiveData = await readJson("src/data/generated/bsc-electives.json");
assert(
  Array.isArray(electiveData.modules),
  "bsc-electives.json: modules must be an array",
);
assert(
  electiveData.modules.length >= MIN_ELECTIVES,
  `bsc-electives.json: only ${electiveData.modules.length} modules`,
);

console.log(
  `Validated bsc-electives.json: ${electiveData.modules.length} modules`,
);
