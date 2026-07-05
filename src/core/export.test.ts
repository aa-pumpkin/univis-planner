import { describe, expect, it } from "vitest";
import { exportIcs } from "./export";
import type { CourseEvent } from "./models";

const event: CourseEvent = {
  id: "x",
  moduleId: "m",
  title: "Kurs",
  type: "lecture",
  weekday: 1,
  startTime: "10:15",
  endTime: "11:45",
  startDate: "2026-04-13",
  endDate: "2026-07-17",
  room: "CAP",
  repeat: "w1 1",
};

describe("calendar export", () => {
  it("exports all real UnivIS occurrences instead of using RRULE", () => {
    const ics = exportIcs([event]);

    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20260413T101500");
    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20260713T101500");
    expect(ics).not.toContain("RRULE:");
    expect(ics).not.toContain("UNTIL=");
    expect(ics).not.toContain("COUNT=");
  });

  it("refuses to invent dates", () => {
    expect(() => exportIcs([{ ...event, startDate: undefined }])).toThrow(
      "fehlen Semesterdaten",
    );
  });

  it("skips excluded UnivIS dates", () => {
    const ics = exportIcs([{ ...event, excludedDates: ["2026-05-04"] }]);

    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20260427T101500");
    expect(ics).not.toContain("DTSTART;TZID=Europe/Berlin:20260504T101500");
    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20260511T101500");
    expect(ics).not.toContain("EXDATE");
  });

  it("exports two-weekly events only in the correct parity", () => {
    const ics = exportIcs([
      {
        ...event,
        repeat: "w2 1",
        startDate: "2026-04-13",
        endDate: "2026-05-11",
      },
    ]);

    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20260413T101500");
    expect(ics).not.toContain("DTSTART;TZID=Europe/Berlin:20260420T101500");
    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20260427T101500");
    expect(ics).not.toContain("DTSTART;TZID=Europe/Berlin:20260504T101500");
    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20260511T101500");
  });

  it("exports block dates on their listed weekdays", () => {
    const ics = exportIcs([
      {
        ...event,
        repeat: "bd 1,2,3",
        startDate: "2026-08-17",
        endDate: "2026-08-21",
        startTime: "9:00",
        endTime: "16:00",
      },
    ]);

    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20260817T090000");
    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20260818T090000");
    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20260819T090000");
    expect(ics).not.toContain("DTSTART;TZID=Europe/Berlin:20260820T090000");
    expect(ics).not.toContain("DTSTART;TZID=Europe/Berlin:20260821T090000");
  });
});
