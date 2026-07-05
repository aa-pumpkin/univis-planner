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
    notes: ["Offiziell nach FPO 2025 Anlage 3: 20 LP."],
  },
  {
    id: "etit",
    title: "Elektrotechnik",
    ectsRange: "20 oder 21 LP",
    description:
      "Grundgebiete der Elektrotechnik I/II plus ein weiteres ET-Modul.",
    notes: ["Offiziell nach FPO 2025 Anlage 3: 20 oder 21 LP."],
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
    notes: ["Offiziell nach FPO 2025 Anlage 3: 18 LP."],
  },
  {
    id: "vwl",
    title: "Volkswirtschaftslehre",
    ectsRange: "20 LP",
    description: "Drei offizielle Varianten mit jeweils 20 LP.",
    notes: ["Offiziell nach FPO 2025 Anlage 3: drei Varianten mit je 20 LP."],
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
    id: "bwl-ent",
    minorId: "bwl",
    title: "Decision Analysis I",
    shortTitle: "BWL-Ent",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-rdm",
    minorId: "bwl",
    title: "Decision Analysis II",
    shortTitle: "BWL-RDM",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-prodlog",
    minorId: "bwl",
    title: "Produktion und Logistik",
    shortTitle: "BWL-ProdLog",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-mark",
    minorId: "bwl",
    title: "Marketing",
    shortTitle: "BWL-Mark",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-business-analytics",
    minorId: "bwl",
    title: "Business Analytics",
    shortTitle: "bwlBusAnalytics-01a",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-ctrlg",
    minorId: "bwl",
    title: "Controlling",
    shortTitle: "BWL-Ctrlg",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-intrl",
    minorId: "bwl",
    title: "Internationale Rechnungslegung",
    shortTitle: "BWL-IntRL",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-gkap",
    minorId: "bwl",
    title: "Grundlagen der Kapitalmarkttheorie",
    shortTitle: "bwlGKapmarkttheo-01a",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-untbest",
    minorId: "bwl",
    title: "Unternehmensbesteuerung",
    shortTitle: "BWL-Untbest",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-service-science",
    minorId: "bwl",
    title: "Service Process Modeling",
    shortTitle: "bwlServiceScience-01a",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-or",
    minorId: "bwl",
    title: "Operations Research",
    shortTitle: "BWL-OR",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-orggest",
    minorId: "bwl",
    title: "Organisationsgestaltung",
    shortTitle: "BWL-OrgGest",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-projmgmt",
    minorId: "bwl",
    title: "Projektmanagement",
    shortTitle: "BWL-ProjMgmt",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-persfhrg",
    minorId: "bwl",
    title: "Leadership in Organizations",
    shortTitle: "BWL-PersFhrg",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-hrm",
    minorId: "bwl",
    title: "Human Resource Management",
    shortTitle: "bwlHRM-01a",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-entre",
    minorId: "bwl",
    title: "Grundlagen des Entrepreneurship",
    shortTitle: "BWL-ENTRE",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
  },
  {
    id: "bwl-innomproz",
    minorId: "bwl",
    title: "Innovationsmanagement: Prozesse & Methoden",
    shortTitle: "BWL-InnoMProz",
    ects: 5,
    semester: 5,
    choiceGroup: "bwl-wp",
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
    id: "math-num",
    minorId: "math",
    title: "Einführung in die numerische Mathematik",
    shortTitle: "math-num_math",
    ects: 9,
    semester: 5,
    choiceGroup: "math-extra",
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
    title: "Grundzüge der mikroökonomischen Theorie II",
    shortTitle: "VWLvwlMikro2-01a",
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
    title: "Grundzüge der makroökonomischen Theorie II",
    shortTitle: "VWLvwlMakro2-01a",
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
