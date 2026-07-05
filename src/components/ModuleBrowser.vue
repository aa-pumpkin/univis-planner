<script setup lang="ts">
import { modules } from "../data/demo";
import { usePlannerStore } from "../stores/planner";
const store = usePlannerStore();
const labels = {
    mandatory: "Pflicht",
    elective: "Wahlpflicht",
    minor: "Nebenfach",
    seminar: "Seminar",
    practical: "Praxis",
    retake: "Wiederholung",
};
const ectsLabel = (ects: number | null) =>
    ects === null ? "ECTS unbekannt" : `${ects} ECTS`;
</script>
<template>
    <section class="panel modules-panel">
        <div class="section-head">
            <div>
                <span class="eyebrow">SCHRITT 1</span>
                <h2>Welche Module belegst du?</h2>
                <p class="help">Klicke auf ein Modul, um es hinzuzufügen.</p>
            </div>
            <span class="count">{{ store.selectedIds.length }} gewählt</span>
        </div>
        <div class="module-list">
            <button
                v-for="m in modules"
                :key="m.id"
                class="module-card"
                :class="{ active: store.selectedIds.includes(m.id) }"
                @click="store.toggleModule(m.id)"
            >
                <span class="module-mark" :style="{ background: m.color }">{{
                    m.shortTitle
                }}</span>
                <span class="module-copy"
                    ><b>{{ m.title }}</b
                    ><small
                        >{{ labels[m.category] }} · {{ ectsLabel(m.ects) }} ·
                        {{ m.fixedEvents.length }} VL<span
                            v-if="m.selectableGroups.length"
                        >
                            ·
                            {{
                                m.selectableGroups[0].options.length
                            }}
                            Gruppen</span
                        ></small
                    ></span
                >
                <span class="check">{{
                    store.selectedIds.includes(m.id) ? "✓" : "+"
                }}</span>
            </button>
        </div>
    </section>
</template>
