<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import CandidateCards from "./components/CandidateCards.vue";
import TimetableGrid from "./components/TimetableGrid.vue";
import { PLANNER_STORAGE_KEY, usePlannerStore } from "./stores/planner";
import { download, exportIcs } from "./core/export";
import {
    loadActiveTerms,
    loadUnivisDataset,
    termsForDate,
    type UnivisDataset,
} from "./import/univis";
import {
    normalizeUnivisModules,
    toPlannerModules,
    type ModuleMapping,
} from "./import/normalizer";
import curriculumMappings from "./data/mappings/cau-informatik.json";
import officialChoices from "./data/generated/bsc-electives.json";
import {
    informaticsElectiveRequirementForSemester,
    mergeCurriculumWithSchedule,
    minorModulesForPlan,
    modulesForSemester,
    olderModulesForSemester,
} from "./data/curriculum";
import { minorModules } from "./data/minors";
import { minorPlans, minorPlan, type MinorId } from "./data/minors";
import type { Module } from "./core/models";
import type { Conflict, CourseEvent } from "./core/models";
import { findConflicts } from "./core/solver";

const store = usePlannerStore();
const screen = ref<"home" | "wizard" | "planner">("home");
const step = ref(1);
const studySemester = ref(4);
const selectedMinorId = ref<MinorId | "">("");
const draftIds = ref<string[]>([]);
const wantsRetakes = ref<boolean | null>(null);
const electiveSearch = ref("");
const retakeSearch = ref("");
const importedCourseCount = ref(0);
const dialog = ref<"feedback" | "thanks" | null>(null);
const feedbackText = ref("");
const feedbackUrl =
    import.meta.env.VITE_FEEDBACK_URL ||
    "https://github.com/aa-pumpkin/univis-planner/issues/new";
const githubUrl =
    import.meta.env.VITE_GITHUB_URL ||
    "https://github.com/aa-pumpkin/univis-planner";
const donateUrl =
    import.meta.env.VITE_DONATE_URL ||
    "https://www.donationalerts.com/r/pumpkin_aa";

store.setModules(mergeCurriculumWithSchedule([]));

const minorMappings = Object.fromEntries(
    minorModules.flatMap((module) => [
        [
            module.shortTitle,
            {
                title: module.title,
                ects: module.ects ?? 0,
                category: "minor" as const,
                semester: module.semesterRecommendation,
            },
        ],
        [
            module.title,
            {
                title: module.title,
                ects: module.ects ?? 0,
                category: "minor" as const,
                semester: module.semesterRecommendation,
            },
        ],
    ]),
);

const modulesFromDataset = (dataset: UnivisDataset, parity: 0 | 1) => {
    const offeredSemester = parity ? 5 : 6;
    const officialMappings = Object.fromEntries(
        officialChoices.modules.map((module) => [
            module.code,
            {
                title: module.title,
                ects: module.ects,
                category: "elective" as const,
                semester: offeredSemester,
            },
        ]),
    );
    return toPlannerModules(
        normalizeUnivisModules(dataset, {
            ...(curriculumMappings as Record<string, ModuleMapping>),
            ...officialMappings,
            ...minorMappings,
        }),
    ).filter(
        (module) =>
            module.category === "elective" ||
            module.category === "minor" ||
            module.semesterRecommendation % 2 === parity,
    );
};

onMounted(async () => {
    try {
        let terms = termsForDate();
        try {
            terms = (await loadActiveTerms()).terms;
        } catch {}
        const [winter, summer] = await Promise.allSettled([
            loadUnivisDataset(terms.odd),
            loadUnivisDataset(terms.even),
        ]);
        const datasets = [winter, summer]
            .filter(
                (result): result is PromiseFulfilledResult<UnivisDataset> =>
                    result.status === "fulfilled",
            )
            .map((result) => result.value);
        if (!datasets.length) return;
        importedCourseCount.value = datasets.reduce(
            (sum, dataset) => sum + dataset.stats.courses,
            0,
        );
        const winterModules =
            winter.status === "fulfilled"
                ? modulesFromDataset(winter.value, 1)
                : [];
        const summerModules =
            summer.status === "fulfilled"
                ? modulesFromDataset(summer.value, 0)
                : [];
        store.setModules(
            mergeCurriculumWithSchedule([...winterModules, ...summerModules]),
        );
    } catch {
        store.setModules(mergeCurriculumWithSchedule([]));
    }
});

const selectedMinor = computed(() => minorPlan(selectedMinorId.value));
const mandatory = computed(() =>
    modulesForSemester(
        store.modules,
        studySemester.value,
        selectedMinorId.value,
    ),
);
const selectedMinorModules = computed(() =>
    minorModulesForPlan(store.modules, selectedMinorId.value),
);
const informaticsElectiveRequirement = computed(() =>
    informaticsElectiveRequirementForSemester(studySemester.value),
);

const electives = computed(() => {
    if (studySemester.value === 4) {
        return store.modules.filter(
            (module) =>
                module.category === "elective" &&
                ["Softwareprojekt", "Data Science Projekt"].includes(
                    module.title,
                ),
        );
    }

    if (studySemester.value < 5) return [];

    return store.modules.filter(
        (module) =>
            module.category === "elective" &&
            module.title !== "Wahlpflichtmodule Informatik" &&
            !["Softwareprojekt", "Data Science Projekt"].includes(module.title),
    );
});

const olderModules = computed(() =>
    olderModulesForSemester(
        store.modules,
        studySemester.value,
        selectedMinorId.value,
    ).filter((m) => !mandatory.value.some((x) => x.id === m.id)),
);
const matchesModuleSearch = (module: Module, query: string) =>
    `${module.title} ${module.shortTitle} ${module.lecturer}`
        .toLocaleLowerCase("de")
        .includes(query.trim().toLocaleLowerCase("de"));
const filteredElectives = computed(() =>
    electives.value.filter((module) =>
        matchesModuleSearch(module, electiveSearch.value),
    ),
);
const filteredOlderModules = computed(() =>
    olderModules.value.filter((module) =>
        matchesModuleSearch(module, retakeSearch.value),
    ),
);

const selectedElectiveModules = computed(() =>
    store.modules.filter(
        (module) =>
            draftIds.value.includes(module.id) &&
            module.category === "elective",
    ),
);
const selectedElectives = computed(() => selectedElectiveModules.value.length);
const selectedElectiveEcts = computed(() =>
    selectedElectiveModules.value.reduce(
        (sum, module) => sum + (module.ects ?? 0),
        0,
    ),
);

const noTimetableNeeded = ["Bachelorarbeit", "Bachelorseminar"];
const missingScheduleModules = computed(() =>
    store.selectedModules.filter(
        (module) =>
            module.category === "mandatory" &&
            !noTimetableNeeded.includes(module.title) &&
            module.fixedEvents.length === 0,
    ),
);
const emptyScheduleSelection = computed(() =>
    store.selectedModules.every(
        (module) =>
            module.fixedEvents.length === 0 &&
            module.selectableGroups.length === 0,
    ),
);
const fixedConflicts = computed(() =>
    findConflicts(
        store.selectedModules.flatMap((module) => module.fixedEvents),
    ),
);
const selectedEcts = computed(() =>
    store.selectedModules.reduce((sum, module) => sum + (module.ects ?? 0), 0),
);
const selectedUnknownEcts = computed(
    () => store.selectedModules.filter((module) => module.ects === null).length,
);
const currentConflicts = computed(() => store.current?.hardConflicts || []);
const weekdays = ["", "Mo", "Di", "Mi", "Do", "Fr"];
const ectsLabel = (ects: number | null) =>
    ects === null ? "ECTS unbekannt" : `${ects} ECTS`;
const selectedEctsLabel = computed(() =>
    selectedUnknownEcts.value
        ? `${selectedEcts.value} bekannte ECTS · ${selectedUnknownEcts.value} ohne ECTS-Angabe`
        : `${selectedEcts.value} ECTS`,
);
const shortEventLabel = (event: CourseEvent) =>
    store.modules.find((module) => module.id === event.moduleId)?.shortTitle ||
    event.title;
const conflictWhen = (conflict: Conflict) =>
    `${weekdays[conflict.first.weekday]} ${conflict.first.startTime > conflict.second.startTime ? conflict.first.startTime : conflict.second.startTime}–${conflict.first.endTime < conflict.second.endTime ? conflict.first.endTime : conflict.second.endTime}`;

function start() {
    step.value = 1;
    draftIds.value = [];
    selectedMinorId.value = "";
    wantsRetakes.value = null;
    electiveSearch.value = "";
    retakeSearch.value = "";
    screen.value = "wizard";
}

function caretToEnd(event: FocusEvent) {
    const input = event.currentTarget as HTMLInputElement;
    requestAnimationFrame(() =>
        input.setSelectionRange(input.value.length, input.value.length),
    );
}

function chooseSemester(value: number) {
    studySemester.value = value;
    selectedMinorId.value = "";
    draftIds.value = [];
    step.value = 2;
}

function chooseMinor(value: MinorId) {
    selectedMinorId.value = value;
    draftIds.value = [];
    step.value = 3;
}

function toggleDraft(id: string) {
    draftIds.value = draftIds.value.includes(id)
        ? draftIds.value.filter((x) => x !== id)
        : [...draftIds.value, id];
}

function moduleScheduleStatus(module: Module) {
    if (module.category === "minor")
        return module.fixedEvents.length || module.selectableGroups.length
            ? "Termine geladen"
            : "Nebenfach";
    if (
        module.fixedEvents.length &&
        (!module.requiresSelectableGroup || module.selectableGroups.length)
    )
        return "Termine geladen";
    if (module.fixedEvents.length) return "Vorlesung geladen";
    if (module.selectableGroups.length) return "Übung geladen";
    return "ohne Termine";
}

function finish() {
    store.selectedIds = [...draftIds.value];
    store.locks = {};
    screen.value = "planner";
}

function saveIcs() {
    if (store.current) {
        download(
            `stundenplan-semester-${studySemester.value}.ics`,
            exportIcs(store.current.selectedEvents),
            "text/calendar",
        );
        dialog.value = "thanks";
    }
}

function sendFeedback() {
    const body = `${feedbackText.value.trim()}\n\n---\nSemester: ${studySemester.value}\nNebenfach: ${selectedMinor.value?.title || "nicht gewählt"}\nModule: ${store.selectedModules.map((module) => module.shortTitle).join(", ") || "noch keine"}\nKonflikte: ${currentConflicts.value.length}`;
    const separator = feedbackUrl.includes("?") ? "&" : "?";
    window.open(
        `${feedbackUrl}${separator}title=${encodeURIComponent("Feedback zum UnivIS Planner")}&body=${encodeURIComponent(body)}`,
        "_blank",
        "noopener,noreferrer",
    );
}

function reloadPlannerData() {
    localStorage.removeItem(PLANNER_STORAGE_KEY);
    location.reload();
}
</script>

<template>
    <div class="app-shell">
        <header class="simple-header">
            <button class="brand plain" @click="screen = 'home'">
                <span>U</span><b>UnivIS <i>Planner</i></b>
            </button>
            <div v-if="screen === 'planner'" class="header-actions">
                <button class="feedback-button" @click="dialog = 'feedback'">
                    Feedback
                </button>
                <button class="quiet-button" @click="start">
                    Neuen Plan erstellen
                </button>
            </div>
        </header>

        <main v-if="screen === 'home'" class="welcome">
            <div class="welcome-copy">
                <span class="kicker">CAU KIEL · INFORMATIK</span>
                <h1>Dein Stundenplan,<br /><em>ohne Tabellenchaos.</em></h1>
                <p>
                    Beantworte ein paar kurze Fragen. Danach erstellt UnivIS
                    Planner automatisch passende Stundenpläne für dich.
                </p>
                <button class="primary-action" @click="start">
                    Stundenplan erstellen <span>→</span>
                </button>
                <small>Keine Anmeldung · Deine Daten bleiben im Browser</small>
                <div class="alpha-note">
                    <b>Alpha-Version</b
                    ><span
                        >UnivIS Planner wird noch getestet. Daten oder
                        Berechnungen können Fehler enthalten. Feedback hilft,
                        das Tool zuverlässiger zu machen.</span
                    ><button @click="dialog = 'feedback'">
                        Feedback geben
                    </button>
                </div>
                <span v-if="importedCourseCount" class="data-status"
                    ><i></i> UnivIS verbunden · {{ importedCourseCount }} Kurse
                    importiert</span
                >
            </div>
            <div class="welcome-preview" aria-hidden="true">
                <div
                    class="mini-day"
                    v-for="day in ['MO', 'DI', 'MI', 'DO', 'FR']"
                    :key="day"
                >
                    <b>{{ day }}</b
                    ><i></i><i></i>
                </div>
                <span class="mini-event one">AuD · Vorlesung</span
                ><span class="mini-event two">Datenbanken</span
                ><span class="mini-event three">Softwaretechnik</span>
            </div>
        </main>

        <main v-else-if="screen === 'wizard'" class="wizard-page">
            <section class="wizard-card">
                <div class="wizard-top">
                    <button v-if="step > 1" class="back" @click="step--">
                        ← Zurück</button
                    ><span>Schritt {{ step }} von 5</span
                    ><button class="close" @click="screen = 'home'">×</button>
                </div>
                <div class="progress">
                    <i :style="{ width: `${step * 20}%` }"></i>
                </div>

                <div v-if="step === 1" class="wizard-content">
                    <span class="eyebrow">1-FACH BACHELOR INFORMATIK</span>
                    <h2>In welchem Semester bist du?</h2>
                    <p>Wir laden damit die passende Modulauswahl.</p>
                    <div class="semester-grid">
                        <button
                            v-for="n in 6"
                            :key="n"
                            @click="chooseSemester(n)"
                        >
                            <strong>{{ n }}.</strong><span>Semester</span>
                        </button>
                    </div>
                </div>

                <div v-else-if="step === 2" class="wizard-content">
                    <span class="eyebrow">NEBENFACH</span>
                    <h2>Welches Nebenfach belegst du?</h2>
                    <p>Wähle dein Nebenfach.</p>
                    <div class="wizard-list">
                        <label v-for="minor in minorPlans" :key="minor.id">
                            <span class="module-mark">{{
                                minor.title.slice(0, 2)
                            }}</span>
                            <span>
                                <b>{{ minor.title }}</b>
                                <small>{{ minor.ectsRange }}</small>
                            </span>
                            <input
                                type="radio"
                                name="minor"
                                :checked="selectedMinorId === minor.id"
                                @change="chooseMinor(minor.id)"
                            />
                            <i>✓</i>
                        </label>
                    </div>
                </div>

                <div v-else-if="step === 3" class="wizard-content">
                    <span class="eyebrow">MODULE</span>
                    <h2>Module für dein {{ studySemester }}. Semester</h2>

                    <div v-if="mandatory.length" class="wizard-list">
                        <label v-for="m in mandatory" :key="m.id">
                            <span
                                class="module-mark"
                                :style="{ background: m.color }"
                                >{{ m.shortTitle }}</span
                            >
                            <span
                                ><b>{{ m.title }}</b
                                ><small
                                    >{{ ectsLabel(m.ects) }} ·
                                    {{ moduleScheduleStatus(m) }}</small
                                ></span
                            >
                            <input
                                type="checkbox"
                                :checked="draftIds.includes(m.id)"
                                @change="toggleDraft(m.id)"
                            />
                            <i>✓</i>
                        </label>
                    </div>

                    <template v-if="selectedMinorModules.length">
                        <span class="eyebrow minor-heading">NEBENFACH</span>
                        <div class="wizard-list">
                            <label
                                v-for="m in selectedMinorModules"
                                :key="m.id"
                            >
                                <span
                                    class="module-mark"
                                    :style="{ background: m.color }"
                                    >{{ m.shortTitle }}</span
                                >
                                <span
                                    ><b>{{ m.title }}</b
                                    ><small
                                        >{{ ectsLabel(m.ects) }} ·
                                        {{ moduleScheduleStatus(m) }}</small
                                    ></span
                                >
                                <input
                                    type="checkbox"
                                    :checked="draftIds.includes(m.id)"
                                    @change="toggleDraft(m.id)"
                                />
                                <i>✓</i>
                            </label>
                        </div>
                    </template>

                    <button class="primary-action full" @click="step = 4">
                        Weiter
                    </button>
                </div>

                <div v-else-if="step === 4" class="wizard-content">
                    <span class="eyebrow">WAHLBEREICH</span>
                    <h2>
                        {{
                            studySemester === 4
                                ? "Projektoptionen"
                                : informaticsElectiveRequirement
                                  ? "Informatik-Wahlpflicht"
                                  : "Zusätzliche Module"
                        }}
                    </h2>

                    <p v-if="studySemester === 4">Wähle ein Projektmodul.</p>
                    <p v-else-if="informaticsElectiveRequirement">
                        {{ informaticsElectiveRequirement.description }}
                    </p>

                    <label v-if="electives.length" class="module-search"
                        ><span>⌕</span
                        ><input
                            v-model="electiveSearch"
                            type="search"
                            placeholder="Modul suchen…"
                            @focus="caretToEnd"
                    /></label>

                    <div
                        v-if="filteredElectives.length"
                        class="wizard-list searchable-list"
                    >
                        <label v-for="m in filteredElectives" :key="m.id">
                            <span
                                class="module-mark"
                                :style="{ background: m.color }"
                                >{{ m.shortTitle }}</span
                            >
                            <span
                                ><b>{{ m.title }}</b
                                ><small
                                    >{{ ectsLabel(m.ects) }} ·
                                    Wahlpflicht</small
                                ></span
                            >
                            <input
                                type="checkbox"
                                :checked="draftIds.includes(m.id)"
                                @change="toggleDraft(m.id)"
                            />
                            <i>✓</i>
                        </label>
                    </div>

                    <div v-else class="notice">
                        Keine passenden Module geladen.
                    </div>

                    <button class="primary-action full" @click="step = 5">
                        Weiter
                    </button>
                </div>

                <div v-else class="wizard-content">
                    <span class="eyebrow">WIEDERHOLUNGEN</span>
                    <h2>
                        Möchtest du etwas aus einem früheren Semester
                        wiederholen?
                    </h2>
                    <div class="yes-no">
                        <button
                            :class="{ active: wantsRetakes === false }"
                            @click="wantsRetakes = false"
                        >
                            Nein</button
                        ><button
                            :class="{ active: wantsRetakes === true }"
                            @click="wantsRetakes = true"
                        >
                            Ja
                        </button>
                    </div>
                    <template v-if="wantsRetakes">
                        <label class="module-search retake-search"
                            ><span>⌕</span
                            ><input
                                v-model="retakeSearch"
                                type="search"
                                placeholder="Modul suchen…"
                                @focus="caretToEnd"
                        /></label>
                        <div
                            v-if="filteredOlderModules.length"
                            class="wizard-list compact"
                        >
                            <label
                                v-for="m in filteredOlderModules"
                                :key="m.id"
                            >
                                <span
                                    ><b>{{ m.title }}</b
                                    ><small
                                        >{{ m.semesterRecommendation }}.
                                        Semester · {{ ectsLabel(m.ects) }} ·
                                        {{ moduleScheduleStatus(m) }}</small
                                    ></span
                                >
                                <input
                                    type="checkbox"
                                    :checked="draftIds.includes(m.id)"
                                    @change="toggleDraft(m.id)"
                                />
                                <i>✓</i>
                            </label>
                        </div>
                        <div v-else class="search-empty">
                            Kein passendes Modul gefunden.
                        </div>
                    </template>
                    <button
                        class="primary-action full"
                        :disabled="wantsRetakes === null"
                        @click="finish"
                    >
                        Stundenpläne erstellen
                    </button>
                </div>
            </section>
        </main>

        <main v-else class="plan-page">
            <section class="plan-heading">
                <div>
                    <span class="kicker"
                        >{{ studySemester }}. SEMESTER<span
                            v-if="selectedMinor"
                        >
                            · {{ selectedMinor.title.toUpperCase() }}</span
                        >
                        · {{ store.selectedIds.length }} MODULE ·
                        {{ selectedEctsLabel }}</span
                    >
                    <h1>
                        {{
                            missingScheduleModules.length
                                ? "Stundenplan noch nicht verfügbar"
                                : emptyScheduleSelection
                                  ? "Keine Veranstaltungen ausgewählt"
                                  : "Deine Stundenpläne"
                        }}
                    </h1>
                </div>
                <button
                    v-if="
                        !missingScheduleModules.length &&
                        !emptyScheduleSelection
                    "
                    class="primary-action"
                    :disabled="!store.current"
                    @click="saveIcs"
                >
                    Kalender herunterladen
                </button>
            </section>

            <section
                v-if="missingScheduleModules.length"
                class="incomplete-panel"
            >
                <b>Der Plan wäre unvollständig</b>
                <p>
                    Für diese Pflichtmodule fehlt aktuell die
                    Hauptveranstaltung:
                </p>
                <ul>
                    <li
                        v-for="module in missingScheduleModules"
                        :key="module.id"
                    >
                        {{ module.title }} <span>Vorlesung fehlt</span>
                    </li>
                </ul>
            </section>

            <section
                v-else-if="emptyScheduleSelection"
                class="incomplete-panel"
            >
                <b>Noch kein Wochenplan</b>
                <p>
                    Module ohne geladene Termine erzeugen keinen
                    Kalendereintrag.
                </p>
            </section>

            <template v-else-if="store.candidates.length">
                <div class="plan-workspace">
                    <aside class="plan-sidebar">
                        <CandidateCards />
                        <section
                            v-if="currentConflicts.length"
                            class="incomplete-panel diagnostic"
                        >
                            <b><span>!</span> Überschneidung</b>
                            <ul>
                                <li
                                    v-for="(
                                        conflict, index
                                    ) in currentConflicts"
                                    :key="index"
                                >
                                    <strong
                                        >{{ shortEventLabel(conflict.first) }} ↔
                                        {{
                                            shortEventLabel(conflict.second)
                                        }}</strong
                                    ><span>{{ conflictWhen(conflict) }}</span>
                                </li>
                            </ul>
                        </section>
                    </aside>
                    <TimetableGrid />
                    <aside class="module-sidebar">
                        <div class="module-sidebar-title">
                            <span class="kicker">{{ selectedEctsLabel }}</span>
                            <h2>Module</h2>
                        </div>
                        <div class="module-sidebar-list">
                            <article
                                v-for="m in store.selectedModules"
                                :key="m.id"
                            >
                                <i :style="{ background: m.color }"></i>
                                <div>
                                    <b>{{ m.title }}</b
                                    ><span
                                        >{{ m.shortTitle }} ·
                                        {{ ectsLabel(m.ects) }}</span
                                    ><small v-if="m.lecturer">{{
                                        m.lecturer
                                    }}</small
                                    ><small v-if="m.officialNote">{{
                                        m.officialNote
                                    }}</small>
                                </div>
                            </article>
                        </div>
                    </aside>
                </div>
            </template>

            <section v-else class="incomplete-panel diagnostic">
                <b>Die Berechnung hat keine Variante geliefert</b>
                <p v-if="fixedConflicts.length">
                    Diese festen Termine überschneiden sich laut geladenem
                    Datensatz:
                </p>
                <ul v-if="fixedConflicts.length">
                    <li
                        v-for="(conflict, index) in fixedConflicts"
                        :key="index"
                    >
                        {{ conflict.first.title }} ↔ {{ conflict.second.title }}
                        <span
                            >{{
                                ["", "Mo", "Di", "Mi", "Do", "Fr"][
                                    conflict.first.weekday
                                ]
                            }}
                            {{ conflict.first.startTime }}</span
                        >
                    </li>
                </ul>
                <p v-else>
                    Die festen Vorlesungen sind konfliktfrei. Der lokale
                    Datenstand ist wahrscheinlich veraltet.
                </p>
                <button class="button primary" @click="reloadPlannerData">
                    Daten neu laden
                </button>
            </section>

            <section
                v-if="
                    missingScheduleModules.length ||
                    emptyScheduleSelection ||
                    !store.candidates.length
                "
                class="selected-modules"
            >
                <div class="selected-title">
                    <span class="kicker"
                        >DEINE AUSWAHL · {{ selectedEctsLabel }}</span
                    >
                    <h2>Module im Stundenplan</h2>
                </div>
                <div class="selected-grid">
                    <article v-for="m in store.selectedModules" :key="m.id">
                        <span
                            class="module-mark"
                            :style="{ background: m.color }"
                            >{{ m.shortTitle }}</span
                        >
                        <div>
                            <b>{{ m.title }}</b
                            ><small
                                >{{ ectsLabel(m.ects) }} ·
                                {{
                                    m.category === "minor"
                                        ? "Nebenfach"
                                        : `${m.fixedEvents.length} Vorlesung${m.fixedEvents.length === 1 ? "" : "en"}`
                                }}</small
                            ><small v-if="m.lecturer" class="module-lecturer">{{
                                m.lecturer
                            }}</small
                            ><small
                                v-if="m.officialNote"
                                class="module-lecturer"
                                >{{ m.officialNote }}</small
                            >
                        </div>
                    </article>
                </div>
            </section>
        </main>

        <div v-if="dialog" class="dialog-backdrop" @click.self="dialog = null">
            <section class="app-dialog" role="dialog" aria-modal="true">
                <button
                    class="dialog-close"
                    aria-label="Schließen"
                    @click="dialog = null"
                >
                    ×
                </button>
                <template v-if="dialog === 'feedback'">
                    <span class="eyebrow">FEEDBACK</span>
                    <h2>Was funktioniert noch nicht?</h2>
                    <textarea
                        v-model="feedbackText"
                        placeholder="Zum Beispiel: Eine Übungsgruppe fehlt…"
                    ></textarea>
                    <div class="dialog-actions">
                        <button
                            class="primary-action"
                            :disabled="!feedbackText.trim()"
                            @click="sendFeedback"
                        >
                            Auf GitHub senden ↗
                        </button>
                    </div>
                </template>
                <template v-else>
                    <span class="eyebrow">FERTIG</span>
                    <h2>Kalender heruntergeladen</h2>
                    <div class="dialog-actions">
                        <button
                            class="primary-action"
                            @click="dialog = 'feedback'"
                        >
                            Feedback geben</button
                        ><a
                            v-if="githubUrl"
                            class="dialog-link"
                            :href="githubUrl"
                            target="_blank"
                            rel="noreferrer"
                            >GitHub-Star geben ☆</a
                        ><a
                            v-if="donateUrl"
                            class="dialog-link subtle"
                            :href="donateUrl"
                            target="_blank"
                            rel="noreferrer"
                            >Freiwillig unterstützen</a
                        >
                    </div>
                </template>
            </section>
        </div>
    </div>
</template>
