import type { Module } from "../core/models";

export type MinorId = "bwl" | "etit" | "math" | "law" | "vwl";

export interface MinorPlan {
  id: MinorId;
  title: string;
  ectsRange: string;
  description: string;
  replacesInformatikMath?: boolean;
  notes: string[];
}

type MinorModuleEntry = {
  id: string;
  minorId: MinorId;
  title: string;
  shortTitle: string;
  ects: number | null;
  semester: number;
  choiceGroup?: string;
  note?: string;
};

export const minorPlans: MinorPlan[] = [
  {
    id: "bwl",
    title: "Betriebswirtschaftslehre",
    ectsRange: "20 LP",
    description: "Drei Pflichtmodule plus ein BWL-Wahlpflichtmodul.",
    notes: [
      "Offiziell nach FPO 2025 Anlage 3: 20 LP.",
      "Der BWL-Wahlpflichtbereich umfasst ein Modul mit 5 LP.",
    ],
  },
  {
    id: "etit",
    title: "Elektrotechnik",
    ectsRange: "20 oder 21 LP",
    description:
      "Grundgebiete der Elektrotechnik I/II plus ein weiteres ET-Modul.",
    notes: [
      "Offiziell nach FPO 2025 Anlage 3: 20 oder 21 LP.",
      "Wenn 21 LP erreicht werden, wird der überschüssige Leistungspunkt des am schlechtesten bewerteten Moduls nicht in die Gesamtnote eingerechnet.",
    ],
  },
  {
    id: "math",
    title: "Mathematik",
    ectsRange: "41 LP",
    description:
      "Ersetzt Mathematik für Informatik A/B/C durch reguläre Mathematikmodule.",
    replacesInformatikMath: true,
    notes: [
      "Bei Nebenfach Mathematik entfallen Inf-Math-A, Inf-Math-B und Inf-Math-C.",
      "Zusätzlich müssen Mathematikmodule im Umfang von 41 LP erbracht werden.",
      "Im Wahlpflichtbereich Informatik müssen dann 27 LP erreicht werden.",
    ],
  },
  {
    id: "law",
    title: "Rechtswissenschaften",
    ectsRange: "18 LP",
    description:
      "Öffentliches Recht, Privatrecht, Informatikrecht, Datenschutz und Urheberrecht.",
    notes: [
      "Offiziell nach FPO 2025 Anlage 3: 18 LP.",
      "Datenschutz kann unter bestimmten Bedingungen auch im Rahmen von IT-Sicherheit eingebracht werden; dann umfasst das Nebenfach 16 statt 18 LP.",
    ],
  },
  {
    id: "vwl",
    title: "Volkswirtschaftslehre",
    ectsRange: "20 LP",
    description: "Drei offizielle Varianten mit jeweils 20 LP.",
    notes: [
      "Offiziell nach FPO 2025 Anlage 3: drei Varianten mit je 20 LP.",
      "Die konkreten Module der Wahlbereiche Mikroökonomik/Finanzwissenschaft bzw. Makroökonomik/Arbeitsmärkte kommen aus dem VWL-Modulhandbuch bzw. der VWL-FPO.",
    ],
  },
];

const entries: MinorModuleEntry[] = [
  {
    id: "bwl-einf",
    minorId: "bwl",
    title: "Einführung in die Betriebswirtschaftslehre",
    shortTitle: "BWL-EinfBWL",
    ects: 5,
    semester: 1,
  },
  {
    id: "bwl-erw",
    minorId: "bwl",
    title: "Externes Rechnungswesen",
    shortTitle: "BWL-ERW",
    ects: 5,
    semester: 3,
  },
  {
    id: "bwl-er",
    minorId: "bwl",
    title: "Entscheidungsrechnungen",
    shortTitle: "BWL-ER",
    ects: 5,
    semester: 4,
  },
  {
    id: "bwl-wp",
    minorId: "bwl",
    title: "BWL-Wahlpflichtbereich",
    shortTitle: "BWL-WP",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
    note: "Ein Modul aus dem offiziellen BWL-Wahlpflichtkatalog wählen.",
  },

  {
    id: "etit-gde1",
    minorId: "etit",
    title: "Grundgebiete der Elektrotechnik I",
    shortTitle: "etit1001-01a",
    ects: 7,
    semester: 1,
  },
  {
    id: "etit-gde2",
    minorId: "etit",
    title: "Grundgebiete der Elektrotechnik II",
    shortTitle: "etit1003-01a",
    ects: 7,
    semester: 2,
  },
  {
    id: "etit-tgit",
    minorId: "etit",
    title: "Theoretische Grundlagen der Informationstechnik",
    shortTitle: "etit2002-01a",
    ects: 6,
    semester: 2,
    choiceGroup: "etit-third-module",
  },
  {
    id: "etit-energie",
    minorId: "etit",
    title: "Elektrische Energietechnik",
    shortTitle: "etit1007-01a",
    ects: 6,
    semester: 2,
    choiceGroup: "etit-third-module",
  },
  {
    id: "etit-signale",
    minorId: "etit",
    title: "Signale und Systeme I",
    shortTitle: "etit1005-01a",
    ects: 7,
    semester: 2,
    choiceGroup: "etit-third-module",
  },
  {
    id: "etit-schaltung",
    minorId: "etit",
    title: "Grundlagen der Schaltungstechnik",
    shortTitle: "etit1004-01a",
    ects: 7,
    semester: 3,
    choiceGroup: "etit-third-module",
  },

  {
    id: "math-la1",
    minorId: "math",
    title: "Lineare Algebra I",
    shortTitle: "math-linalg1.1",
    ects: 8,
    semester: 1,
  },
  {
    id: "math-la2",
    minorId: "math",
    title: "Lineare Algebra II",
    shortTitle: "math-linalg2.1",
    ects: 8,
    semester: 2,
  },
  {
    id: "math-an1",
    minorId: "math",
    title: "Analysis I",
    shortTitle: "math-an1.1",
    ects: 8,
    semester: 3,
  },
  {
    id: "math-an2",
    minorId: "math",
    title: "Analysis II",
    shortTitle: "math-an2.1",
    ects: 8,
    semester: 4,
  },
  {
    id: "math-wp9",
    minorId: "math",
    title: "Weiteres Mathematikmodul",
    shortTitle: "Math-WP-9",
    ects: 9,
    semester: 5,
    choiceGroup: "math-extra",
    note: "Ein weiteres Modul des Bachelorstudiengangs Mathematik im Umfang von 9 LP, z.B. Einführung in die numerische Mathematik.",
  },

  {
    id: "law-public",
    minorId: "law",
    title: "Einführung in das öffentliche Recht",
    shortTitle: "BWL-JuOeff",
    ects: 5,
    semester: 1,
  },
  {
    id: "law-private",
    minorId: "law",
    title: "Privatrecht",
    shortTitle: "BWL-JuPriv",
    ects: 5,
    semester: 1,
  },
  {
    id: "law-informatikrecht",
    minorId: "law",
    title: "Informatikrecht",
    shortTitle: "Inf-InfRecht",
    ects: 2,
    semester: 3,
  },
  {
    id: "law-datenschutz",
    minorId: "law",
    title: "Datenschutz",
    shortTitle: "Inf-DatSchutz",
    ects: 2,
    semester: 4,
  },
  {
    id: "law-urheberrecht",
    minorId: "law",
    title: "Urheberrecht",
    shortTitle: "Urheberrecht",
    ects: 4,
    semester: 5,
  },

  {
    id: "vwl-evwl",
    minorId: "vwl",
    title: "Einführung in die Volkswirtschaftslehre",
    shortTitle: "VWL-EVWL",
    ects: 10,
    semester: 1,
  },
  {
    id: "vwl-mikro1",
    minorId: "vwl",
    title: "Grundzüge der mikroökonomischen Theorie I",
    shortTitle: "VWLvwlMikro1-01a",
    ects: 5,
    semester: 2,
    choiceGroup: "vwl-variant-1",
  },
  {
    id: "vwl-mikro2",
    minorId: "vwl",
    title:
      "Grundzüge der mikroökonomischen Theorie II oder Wahlbereich Mikroökonomik/Finanzwissenschaft",
    shortTitle: "VWL-Mikro-WP",
    ects: 5,
    semester: 3,
    choiceGroup: "vwl-variant-1",
  },
  {
    id: "vwl-makro1",
    minorId: "vwl",
    title: "Grundzüge der makroökonomischen Theorie I",
    shortTitle: "VWLvwlMakro1-01a",
    ects: 5,
    semester: 2,
    choiceGroup: "vwl-variant-2",
  },
  {
    id: "vwl-makro2",
    minorId: "vwl",
    title:
      "Grundzüge der makroökonomischen Theorie II oder Wahlbereich Makroökonomik/Arbeitsmärkte",
    shortTitle: "VWL-Makro-WP",
    ects: 5,
    semester: 3,
    choiceGroup: "vwl-variant-2",
  },
];

const colors: Record<MinorId, string> = {
  bwl: "#8a6f2a",
  etit: "#7a4f91",
  math: "#2d6a9f",
  law: "#8b4a3f",
  vwl: "#5f7f3f",
};

export const minorModules: Module[] = entries.map((entry) => ({
  id: `minor-${entry.id}`,
  title: entry.title,
  shortTitle: entry.shortTitle,
  ects: entry.ects,
  category: "minor",
  semesterRecommendation: entry.semester,
  lecturer: "",
  color: colors[entry.minorId],
  requiresSelectableGroup: false,
  minorId: entry.minorId,
  minorChoiceGroup: entry.choiceGroup,
  officialNote: entry.note,
  fixedEvents: [],
  selectableGroups: [],
}));

export function modulesForMinor(minorId: MinorId, semester?: number) {
  return minorModules.filter(
    (module) =>
      module.minorId === minorId &&
      (semester === undefined || module.semesterRecommendation === semester),
  );
}

export function minorPlan(minorId: MinorId | "") {
  return minorPlans.find((plan) => plan.id === minorId);
}
