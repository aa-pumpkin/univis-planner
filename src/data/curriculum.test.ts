import { describe, expect, it } from "vitest";
import {
  curriculumModules,
  mergeCurriculumWithSchedule,
  modulesForSemester,
} from "./curriculum";
import type { Module } from "../core/models";

const mandatory = (semester: number) =>
  curriculumModules.filter(
    (m) => m.semesterRecommendation === semester && m.category === "mandatory",
  );
describe("official CAU Informatik curriculum", () => {
  it("matches the mandatory modules and ECTS for semesters 1 and 2", () => {
    expect(mandatory(1).map((m) => [m.title, m.ects])).toEqual([
      ["Einführung in die Informatik", 10],
      ["Computersysteme", 8],
      ["Mathematik für die Informatik A", 8],
    ]);
    expect(mandatory(2).map((m) => [m.title, m.ects])).toEqual([
      ["Einführung in die Algorithmik", 7],
      ["Computer Networks", 7],
      ["Objektorientierte Programmierung", 6],
      ["Mathematik für die Informatik B", 8],
    ]);
    expect(
      curriculumModules.filter(
        (m) => m.semesterRecommendation === 2 && m.category === "elective",
      ),
    ).toHaveLength(0);
  });
  it("models project alternatives as choices instead of mandatory modules", () => {
    expect(mandatory(4).some((m) => m.title === "Softwareprojekt")).toBe(false);
    expect(
      curriculumModules.find((m) => m.title === "Softwareprojekt")?.category,
    ).toBe("elective");
    expect(mandatory(5).some((m) => m.title === "Data Science Projekt")).toBe(
      false,
    );
  });
  it("keeps stable curriculum ids and ECTS when schedule data is merged", () => {
    const scheduled = {
      ...curriculumModules[0],
      id: "univis-changing-id",
      ects: 99,
      fixedEvents: [
        {
          id: "e",
          moduleId: "univis-changing-id",
          title: "x",
          type: "lecture",
          weekday: 1,
          startTime: "10:00",
          endTime: "11:00",
          room: "R",
        },
      ],
    } as Module;
    const merged = mergeCurriculumWithSchedule([scheduled]).find(
      (m) => m.title === "Einführung in die Informatik",
    )!;
    expect(merged.id).toBe("curriculum-intro-cs");
    expect(merged.ects).toBe(10);
    expect(merged.fixedEvents[0].moduleId).toBe(merged.id);
  });
  it("includes official minor modules but does not invent schedule events", () => {
    const bwl = curriculumModules.filter((m) => m.minorId === "bwl");
    expect(bwl.map((m) => [m.shortTitle, m.ects])).toContainEqual([
      "BWL-EinfBWL",
      5,
    ]);
    expect(bwl.every((m) => m.category === "minor")).toBe(true);
    expect(bwl.every((m) => m.fixedEvents.length === 0)).toBe(true);
  });
  it("replaces Informatik math modules when Nebenfach Mathematik is selected", () => {
    expect(
      modulesForSemester(curriculumModules, 1, "math").map((m) => m.title),
    ).toEqual([
      "Einführung in die Informatik",
      "Computersysteme",
      "Lineare Algebra I",
    ]);
    expect(
      modulesForSemester(curriculumModules, 2, "math").map((m) => m.title),
    ).toEqual([
      "Einführung in die Algorithmik",
      "Computer Networks",
      "Objektorientierte Programmierung",
      "Lineare Algebra II",
    ]);
    expect(
      modulesForSemester(curriculumModules, 3, "math").map((m) => m.title),
    ).toEqual([
      "Deklarative Programmierung",
      "Operating Systems",
      "Berechnungen und Logik",
      "Analysis I",
    ]);
  });
});
