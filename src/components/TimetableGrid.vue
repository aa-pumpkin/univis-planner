<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlannerStore } from '../stores/planner'
import { isoWeek, minutes, occursInWeekParity, overlaps } from '../core/time'
import type { CourseEvent } from '../core/models'

const store = usePlannerStore()
const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']
const start = 8 * 60
const span = 10 * 60
const parity = ref<'even' | 'odd'>(isoWeek(new Date()) % 2 === 0 ? 'even' : 'odd')
const events = computed(() => store.current?.selectedEvents || [])
const visibleEvents = computed(() => events.value.filter(event => occursInWeekParity(event, parity.value)))
const conflictIds = computed(() => new Set((store.current?.hardConflicts || []).flatMap(conflict => [conflict.first.id, conflict.second.id])))
const eventsForDay = (day: number) => visibleEvents.value.filter(event => event.weekday === day)
const moduleFor = (event: CourseEvent) => store.modules.find(module => module.id === event.moduleId)
const eventType = (event: CourseEvent) => event.type === 'lecture' ? 'VL' : event.type === 'exercise' ? 'Ü' : event.type === 'tutorial' ? 'Tutorium' : event.type === 'seminar' ? 'Seminar' : 'PR'

function collisionGroup(event: CourseEvent, dayEvents: CourseEvent[]) {
  const group = new Set<CourseEvent>([event])
  let changed = true
  while (changed) {
    changed = false
    for (const candidate of dayEvents) {
      if (!group.has(candidate) && [...group].some(member => overlaps(member, candidate))) {
        group.add(candidate)
        changed = true
      }
    }
  }
  return [...group].sort((a, b) => minutes(a.startTime) - minutes(b.startTime) || minutes(a.endTime) - minutes(b.endTime) || a.id.localeCompare(b.id))
}

function eventStyle(event: CourseEvent, dayEvents: CourseEvent[]) {
  const group = collisionGroup(event, dayEvents)
  const column = group.findIndex(item => item.id === event.id)
  const count = group.length
  return {
    top: `${((minutes(event.startTime) - start) / span) * 100}%`,
    height: `${((minutes(event.endTime) - minutes(event.startTime)) / span) * 100}%`,
    left: `calc(${column * 100 / count}% + 5px)`,
    width: `calc(${100 / count}% - 10px)`,
    right: 'auto',
    background: moduleFor(event)?.color,
    zIndex: conflictIds.value.has(event.id) ? 3 : 1,
  }
}
</script>

<template>
  <section class="panel timetable-panel">
    <div class="section-head timetable-head">
      <div><span class="eyebrow">VORSCHAU</span><h2>{{ store.current ? 'Deine Woche' : 'Kein Plan verfügbar' }}</h2></div>
      <div class="week-switch" aria-label="Wochenansicht">
        <button :class="{ active: parity === 'even' }" @click="parity = 'even'">Gerade Woche</button>
        <button :class="{ active: parity === 'odd' }" @click="parity = 'odd'">Ungerade Woche</button>
      </div>
    </div>
    <div class="calendar">
      <div class="corner"></div><div v-for="day in days" :key="day" class="day-head">{{ day }}</div>
      <div class="times"><span v-for="hour in 11" :key="hour" :style="{ top: `${(hour - 1) * 10}%` }">{{ hour + 7 }}:00</span></div>
      <div v-for="day in 5" :key="day" class="day-column">
        <div v-for="hour in 10" :key="hour" class="hour-line" :style="{ top: `${(hour - 1) * 10}%` }"></div>
        <div
          v-for="event in eventsForDay(day)" :key="event.id" class="event"
          :class="{ conflict: conflictIds.has(event.id) }" :style="eventStyle(event, eventsForDay(day))"
          :title="[event.title, event.room, event.lecturer].filter(Boolean).join(' · ')"
        >
          <span class="event-time">{{ event.startTime }}—{{ event.endTime }}</span>
          <b>{{ moduleFor(event)?.shortTitle }} · {{ eventType(event) }}</b>
          <small v-if="event.room">{{ event.room }}</small>
          <small v-if="event.lecturer" class="event-lecturer">{{ event.lecturer }}</small>
          <em v-if="conflictIds.has(event.id)" class="conflict-badge">Konflikt</em>
        </div>
      </div>
    </div>
    <div class="mobile-agenda">
      <article v-for="event in visibleEvents" :key="event.id" :class="{ conflict: conflictIds.has(event.id) }" :style="{ '--color': moduleFor(event)?.color }">
        <span>{{ days[event.weekday - 1] }} · {{ event.startTime }}–{{ event.endTime }}</span><b>{{ event.title }}</b>
        <small>{{ [event.room, event.lecturer].filter(Boolean).join(' · ') }}</small>
      </article>
    </div>
  </section>
</template>
