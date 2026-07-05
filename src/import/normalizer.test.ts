import { describe, expect, it } from "vitest";
import { normalizeUnivisModules, toPlannerModules } from "./normalizer";
import type { UnivisDataset } from "./univis";

const baseDataset: UnivisDataset = {
  schemaVersion: 1,
  semester: "2026s",
  fetchedAt: "2026-01-01T00:00:00.000Z",
  sourceUrl: "test",
  department: {
    id: "informatik",
    name: "Informatik",
  },
  stats: {
    courses: 0,
    people: 0,
    rooms: 0,
  },
  courses: [],
};

describe("normalizer", () => {
  it("normalizes an empty UnivIS dataset", () => {
    expect(normalizeUnivisModules(baseDataset, {})).toEqual([]);
  });

  it("keeps repeat and excluded dates when converting to planner modules", () => {
    const dataset: UnivisDataset = {
      ...baseDataset,
      courses: [
        {
          sourceId: "course-1",
          sourceKey: "course-1",
          parentKey: "",
          title: "Einführung in die Informatik",
          shortTitle: "infEInf-02a",
          number: "",
          type: "lecture",
          rawType: "Vorlesung",
          lecturers: ["Prof Test"],
          organisation: "",
          sourceUrl: "test",
          dates: [
            {
              repeat: "w2 1",
              weekday: 1,
              startTime: "10:15",
              endTime: "11:45",
              room: "CAP",
              startDate: "2026-04-13",
              endDate: "2026-07-17",
              excludedDates: ["2026-05-04"],
            },
          ],
        },
      ],
    };

    const normalized = normalizeUnivisModules(dataset, {
      "infEInf-02a": {
        title: "Einführung in die Informatik",
        semester: 1,
        category: "mandatory",
        ects: 10,
      },
    });

    const modules = toPlannerModules(normalized);

    expect(modules).toHaveLength(1);
    expect(modules[0].fixedEvents[0].repeat).toBe("w2 1");
    expect(modules[0].fixedEvents[0].excludedDates).toEqual(["2026-05-04"]);
  });
});
