import type { Module } from "../core/models";
import { minorModules, minorPlan, type MinorId } from "./minors";

type Entry = {
  id: string;
  title: string;
  shortTitle: string;
  ects: number;
  semester: number;
  category?: "mandatory" | "elective";
  requiresGroup?: boolean;
};

export interface InformaticsElectiveRequirement {
  semester: number;
  ects: number;
  title: string;
  description: string;
}

const entries: Entry[] = [
  {
    id: "intro-cs",
    title: "Einführung in die Informatik",
    shortTitle: "EidI",
    ects: 10,
    semester: 1,
  },
  {
    id: "computer-systems",
    title: "Computersysteme",
    shortTitle: "CS",
    ects: 8,
    semester: 1,
  },
  {
    id: "math-a",
    title: "Mathematik für die Informatik A",
    shortTitle: "Math A",
    ects: 8,
    semester: 1,
  },

  {
    id: "algorithms-intro",
    title: "Einführung in die Algorithmik",
    shortTitle: "EinfAlgo",
    ects: 7,
    semester: 2,
  },
  {
    id: "computer-networks",
    title: "Computer Networks",
    shortTitle: "CN",
    ects: 7,
    semester: 2,
  },
  {
    id: "oop",
    title: "Objektorientierte Programmierung",
    shortTitle: "OOP",
    ects: 6,
    semester: 2,
  },
  {
    id: "math-b",
    title: "Mathematik für die Informatik B",
    shortTitle: "Math B",
    ects: 8,
    semester: 2,
  },

  {
    id: "declarative",
    title: "Deklarative Programmierung",
    shortTitle: "DP",
    ects: 7,
    semester: 3,
  },
  {
    id: "operating-systems",
    title: "Operating Systems",
    shortTitle: "OS",
    ects: 7,
    semester: 3,
  },
  {
    id: "logic",
    title: "Berechnungen und Logik",
    shortTitle: "BuL",
    ects: 8,
    semester: 3,
  },
  {
    id: "math-c",
    title: "Mathematik für die Informatik C",
    shortTitle: "Math C",
    ects: 8,
    semester: 3,
  },

  {
    id: "software-engineering",
    title: "Softwaretechnik",
    shortTitle: "SWT",
    ects: 7,
    semester: 4,
  },
  {
    id: "database-systems",
    title: "Database Systems",
    shortTitle: "DB",
    ects: 5,
    semester: 4,
  },
  {
    id: "complexity",
    title: "Analyse von Algorithmen und Komplexität",
    shortTitle: "AAK",
    ects: 8,
    semester: 4,
  },
  {
    id: "scientific-work",
    title: "Wissenschaftliches Arbeiten",
    shortTitle: "WA",
    ects: 2,
    semester: 4,
    requiresGroup: false,
  },
  {
    id: "ethics",
    title: "Ethik in der Informatik",
    shortTitle: "Ethik",
    ects: 2,
    semester: 4,
  },

  {
    id: "software-project",
    title: "Softwareprojekt",
    shortTitle: "SP",
    ects: 6,
    semester: 4,
    category: "elective",
    requiresGroup: false,
  },
  {
    id: "data-science-project",
    title: "Data Science Projekt",
    shortTitle: "DS-Proj",
    ects: 6,
    semester: 4,
    category: "elective",
    requiresGroup: false,
  },

  {
    id: "data-science",
    title: "Data Science",
    shortTitle: "DS",
    ects: 5,
    semester: 5,
  },
  {
    id: "bachelor-seminar",
    title: "Bachelorseminar",
    shortTitle: "Sem",
    ects: 5,
    semester: 5,
    requiresGroup: false,
  },

  {
    id: "thesis",
    title: "Bachelorarbeit",
    shortTitle: "BA",
    ects: 12,
    semester: 6,
    requiresGroup: false,
  },
];

const colors = [
  "#087f73",
  "#d66b45",
  "#3c927d",
  "#3e78a0",
  "#c1842f",
  "#a65757",
];

const baseCurriculumModules: Module[] = entries.map((entry, index) => ({
  id: `curriculum-${entry.id}`,
  title: entry.title,
  shortTitle: entry.shortTitle,
  ects: entry.ects,
  category: entry.category || "mandatory",
  semesterRecommendation: entry.semester,
  lecturer: "",
  color: colors[index % colors.length],
  requiresSelectableGroup: entry.requiresGroup !== false,
  fixedEvents: [],
  selectableGroups: [],
}));

export const curriculumModules: Module[] = [
  ...baseCurriculumModules,
  ...minorModules,
];

export const informaticsElectiveRequirements: InformaticsElectiveRequirement[] =
  [
    {
      semester: 5,
      ects: 8,
      title: "Informatik-Wahlpflicht",
      description: "Informatik-Wahlpflichtmodule",
    },
    {
      semester: 6,
      ects: 13,
      title: "Informatik-Wahlpflicht",
      description: "Informatik-Wahlpflichtmodule",
    },
  ];

const key = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9äöüß]/g, "");

const matchesOfficialModule = (scheduled: Module, official: Module) => {
  const scheduledKeys = [scheduled.title, scheduled.shortTitle].map(key);
  const officialKeys = [official.title, official.shortTitle].map(key);
  return scheduledKeys.some((value) => officialKeys.includes(value));
};

export function informaticsElectiveRequirementForSemester(semester: number) {
  return (
    informaticsElectiveRequirements.find(
      (requirement) => requirement.semester === semester,
    ) || null
  );
}

export function isReplacedByMathMinor(module: Module, selectedMinorId: string) {
  return (
    selectedMinorId === "math" &&
    [
      "Mathematik für die Informatik A",
      "Mathematik für die Informatik B",
      "Mathematik für die Informatik C",
    ].includes(module.title)
  );
}

export function modulesForSemester(
  modules: Module[],
  semester: number,
  selectedMinorId: MinorId | "",
) {
  const selectedMinor = minorPlan(selectedMinorId);

  return modules.filter((module) => {
    if (module.semesterRecommendation !== semester) return false;

    if (module.category === "minor") {
      return false;
    }

    if (
      selectedMinor?.replacesInformatikMath &&
      isReplacedByMathMinor(module, selectedMinorId)
    ) {
      return false;
    }

    return module.category === "mandatory";
  });
}

export function minorModulesForPlan(
  modules: Module[],
  selectedMinorId: MinorId | "",
) {
  if (!selectedMinorId) return [];

  return modules
    .filter(
      (module) =>
        module.category === "minor" && module.minorId === selectedMinorId,
    )
    .sort(
      (a, b) =>
        a.semesterRecommendation - b.semesterRecommendation ||
        a.title.localeCompare(b.title, "de"),
    );
}

export function olderModulesForSemester(
  modules: Module[],
  semester: number,
  selectedMinorId: MinorId | "",
) {
  const selectedMinor = minorPlan(selectedMinorId);

  return modules.filter((module) => {
    if (module.semesterRecommendation >= semester) return false;

    if (module.category === "minor") {
      return module.minorId === selectedMinorId;
    }

    if (
      selectedMinor?.replacesInformatikMath &&
      isReplacedByMathMinor(module, selectedMinorId)
    ) {
      return false;
    }

    return module.category !== "elective";
  });
}

export function mergeCurriculumWithSchedule(scheduled: Module[]): Module[] {
  const used = new Set<string>();

  const curriculum = curriculumModules.map((module) => {
    const match = scheduled.find((real) => matchesOfficialModule(real, module));
    if (!match) return module;

    used.add(match.id);

    return {
      ...module,
      lecturer: match.lecturer,
      fixedEvents: match.fixedEvents.map((event) => ({
        ...event,
        moduleId: module.id,
      })),
      selectableGroups: match.selectableGroups.map((group) => ({
        ...group,
        id: `${module.id}-${group.id}`,
        options: group.options.map((event) => ({
          ...event,
          moduleId: module.id,
        })),
      })),
    };
  });

  return [
    ...curriculum,
    ...scheduled.filter(
      (module) =>
        !used.has(module.id) &&
        module.category === "elective" &&
        module.title !== "Wahlpflichtmodule Informatik",
    ),
  ];
}
