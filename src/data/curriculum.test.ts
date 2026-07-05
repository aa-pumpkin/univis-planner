import { describe, expect, it } from "vitest";
import {
  curriculumModules,
  informaticsElectiveRequirementForSemester,
  mergeCurriculumWithSchedule,
  minorModulesForPlan,
  modulesForSemester,
  olderModulesForSemester,
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

  it("does not model Informatik-Wahlpflicht as a fake module", () => {
    expect(
      curriculumModules.some((m) => m.title === "Wahlpflichtmodule Informatik"),
    ).toBe(false);
    expect(informaticsElectiveRequirementForSemester(5)?.ects).toBe(8);
    expect(informaticsElectiveRequirementForSemester(6)?.ects).toBe(13);
  });

  it("models project modules as real elective modules", () => {
    expect(mandatory(4).some((m) => m.title === "Softwareprojekt")).toBe(false);
    expect(
      curriculumModules.find((m) => m.title === "Softwareprojekt")?.category,
    ).toBe("elective");
    expect(
      curriculumModules.find((m) => m.title === "Data Science Projekt")
        ?.category,
    ).toBe("elective");
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

  it("includes real BWL Wahlpflicht options from the FPO catalog", () => {
    const bwl = minorModulesForPlan(curriculumModules, "bwl");

    expect(bwl.map((m) => m.shortTitle)).toContain("BWL-EinfBWL");
    expect(bwl.map((m) => m.shortTitle)).toContain("BWL-Ent");
    expect(bwl.map((m) => m.shortTitle)).toContain("bwlHRM-01a");
    expect(bwl.every((m) => m.category === "minor")).toBe(true);
  });

  it("replaces Informatik math modules and keeps math minor modules separate", () => {
    expect(
      modulesForSemester(curriculumModules, 1, "math").map((m) => m.title),
    ).toEqual(["Einführung in die Informatik", "Computersysteme"]);

    expect(
      modulesForSemester(curriculumModules, 2, "math").map((m) => m.title),
    ).toEqual([
      "Einführung in die Algorithmik",
      "Computer Networks",
      "Objektorientierte Programmierung",
    ]);

    expect(
      modulesForSemester(curriculumModules, 3, "math").map((m) => m.title),
    ).toEqual([
      "Deklarative Programmierung",
      "Operating Systems",
      "Berechnungen und Logik",
    ]);

    expect(
      minorModulesForPlan(curriculumModules, "math").map((m) => m.title),
    ).toEqual([
      "Lineare Algebra I",
      "Lineare Algebra II",
      "Analysis I",
      "Analysis II",
      "Einführung in die numerische Mathematik",
    ]);
  });

  it("shows all selected minor modules as plan options, independent of current semester", () => {
    expect(
      minorModulesForPlan(curriculumModules, "law").map((m) => m.title),
    ).toEqual([
      "Einführung in das öffentliche Recht",
      "Privatrecht",
      "Informatikrecht",
      "Datenschutz",
      "Urheberrecht",
    ]);

    expect(
      minorModulesForPlan(curriculumModules, "etit").map((m) => m.title),
    ).toContain("Theoretische Grundlagen der Informationstechnik");
  });

  it("shows selected minor modules in retake selection for later semesters", () => {
    expect(
      olderModulesForSemester(curriculumModules, 6, "law").map((m) => m.title),
    ).toContain("Datenschutz");
    expect(
      olderModulesForSemester(curriculumModules, 6, "law").map((m) => m.title),
    ).toContain("Urheberrecht");
    expect(
      olderModulesForSemester(curriculumModules, 6, "law").map((m) => m.title),
    ).not.toContain("Grundgebiete der Elektrotechnik I");
  });

  it("does not show future minor modules in retake selection", () => {
    expect(
      olderModulesForSemester(curriculumModules, 2, "law").map((m) => m.title),
    ).toEqual([
      "Einführung in die Informatik",
      "Computersysteme",
      "Mathematik für die Informatik A",
      "Einführung in das öffentliche Recht",
      "Privatrecht",
    ]);
  });

  it("shows VWL variants as official modules", () => {
    expect(
      minorModulesForPlan(curriculumModules, "vwl").map(
        (option) => option.shortTitle,
      ),
    ).toEqual([
      "VWL-EVWL",
      "VWLvwlMakro1-01a",
      "VWLvwlMikro1-01a",
      "VWLvwlMakro2-01a",
      "VWLvwlMikro2-01a",
    ]);
  });
});
