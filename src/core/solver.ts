import type {
  Conflict,
  CourseEvent,
  Module,
  Preferences,
  ScheduleCandidate,
} from "./models";
import { minutes, overlaps } from "./time";

export const findConflicts = (events: CourseEvent[]): Conflict[] => {
  const conflicts: Conflict[] = [];
  for (let i = 0; i < events.length; i++)
    for (let j = i + 1; j < events.length; j++)
      if (overlaps(events[i], events[j]))
        conflicts.push({ first: events[i], second: events[j] });
  return conflicts;
};

const conflictMinutes = (conflict: Conflict) =>
  Math.max(
    0,
    Math.min(
      minutes(conflict.first.endTime),
      minutes(conflict.second.endTime),
    ) -
      Math.max(
        minutes(conflict.first.startTime),
        minutes(conflict.second.startTime),
      ),
  );
const conflictLoad = (conflicts: Conflict[]) =>
  conflicts.reduce((sum, conflict) => sum + conflictMinutes(conflict), 0);
type SolverState = {
  events: CourseEvent[];
  choices: Record<string, string>;
  conflicts: number;
  conflictLoad: number;
};
export type ConflictPriority = "balanced" | "lectures" | "exercises";
const priorityLoad = (conflicts: Conflict[], priority: ConflictPriority) =>
  conflicts.reduce((sum, conflict) => {
    const types = [conflict.first.type, conflict.second.type];
    const weighted =
      (priority === "lectures" && types.includes("lecture")) ||
      (priority === "exercises" && types.includes("exercise"));
    return sum + conflictMinutes(conflict) * (weighted ? 3 : 1);
  }, 0);
const stateRank = (state: SolverState) =>
  state.conflicts * 1000 + state.conflictLoad;
const addedConflicts = (events: CourseEvent[], option: CourseEvent) =>
  events
    .filter((event) => overlaps(event, option))
    .map((first) => ({ first, second: option }));
const lunchOverlapMinutes = (event: CourseEvent) =>
  Math.max(
    0,
    Math.min(minutes(event.endTime), minutes("14:00")) -
      Math.max(minutes(event.startTime), minutes("12:00")),
  );
const candidateId = (state: SolverState) => {
  const choices = Object.entries(state.choices)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupId, optionId]) => `${groupId}:${optionId}`);
  const fixed = state.events
    .filter((event) => event.isFixed)
    .map((event) => event.id)
    .sort();
  return `plan-${[...fixed, ...choices].join("|") || "fixed-only"}`;
};

const scoreEvents = (events: CourseEvent[], p: Preferences) => {
  let penalty = 0;
  const reasons: string[] = [];
  const days = new Set(events.map((e) => e.weekday));
  const earlyMinutes = events.reduce(
    (sum, e) =>
      sum + Math.max(0, minutes(p.avoidBeforeTime) - minutes(e.startTime)),
    0,
  );
  const lateMinutes = events.reduce(
    (sum, e) =>
      sum + Math.max(0, minutes(e.endTime) - minutes(p.avoidAfterTime)),
    0,
  );
  const lunchMinutes = p.reserveLunchBreak
    ? events.reduce((sum, e) => sum + lunchOverlapMinutes(e), 0)
    : 0;
  if (earlyMinutes) {
    penalty += Math.ceil(earlyMinutes / 30) * 6;
    reasons.push(`ранний старт до ${p.avoidBeforeTime}`);
  }
  if (lateMinutes) {
    penalty += Math.ceil(lateMinutes / 30) * 5;
    reasons.push(`позднее окончание после ${p.avoidAfterTime}`);
  }
  if (lunchMinutes) {
    penalty += Math.ceil(lunchMinutes / 30) * 5;
    reasons.push("занята Mittagspause 12:00–14:00");
  }
  if (p.avoidFriday && days.has(5)) {
    penalty += 18;
    reasons.push("занятие в пятницу");
  }
  if (p.preferFreeDays) penalty += days.size * 5;
  let gaps = 0;
  for (const day of days) {
    const sorted = events
      .filter((e) => e.weekday === day)
      .sort((a, b) => minutes(a.startTime) - minutes(b.startTime));
    for (let i = 1; i < sorted.length; i++)
      gaps += Math.max(
        0,
        minutes(sorted[i].startTime) - minutes(sorted[i - 1].endTime),
      );
  }
  if (p.avoidLongGaps) penalty += Math.floor(gaps / 30) * 2;
  if (p.preferCompactWeek) penalty += Math.floor(gaps / 30);
  if (gaps >= 120) reasons.push(`${Math.round(gaps / 60)} ч окон за неделю`);
  if (!reasons.length) reasons.push("без ранних занятий и длинных окон");
  return { score: Math.max(0, 100 - penalty), reasons, days: days.size };
};

export function generateSchedules(
  modules: Module[],
  preferences: Preferences,
  locked: Record<string, string> = {},
  conflictPriority: ConflictPriority = "balanced",
): ScheduleCandidate[] {
  const fixed = modules.flatMap((m) => m.fixedEvents);
  const fixedConflicts = findConflicts(fixed);
  const groups = modules.flatMap((m) => m.selectableGroups);
  let states: SolverState[] = [
    {
      events: fixed,
      choices: {},
      conflicts: fixedConflicts.length,
      conflictLoad: priorityLoad(fixedConflicts, conflictPriority),
    },
  ];
  for (const group of groups) {
    const options = locked[group.id]
      ? group.options.filter((o) => o.id === locked[group.id])
      : group.options;
    states = states.flatMap((state) => {
      const expanded = options.map((option) => {
        const conflicts = addedConflicts(state.events, option);
        return {
          events: [...state.events, option],
          choices: { ...state.choices, [group.id]: option.id },
          conflicts: state.conflicts + conflicts.length,
          conflictLoad:
            state.conflictLoad + priorityLoad(conflicts, conflictPriority),
        };
      });
      const clean = expanded.filter(
        (next) => next.conflicts === state.conflicts,
      );
      if (clean.length) return clean;
      const bestRank = Math.min(...expanded.map(stateRank));
      return expanded.filter((next) => stateRank(next) === bestRank);
    });
    if (states.length > 300)
      states = states.sort((a, b) => stateRank(a) - stateRank(b)).slice(0, 300);
  }
  return states
    .map((state) => {
      const hardConflicts = findConflicts(state.events);
      const rated = scoreEvents(state.events, preferences);
      const freeFriday = !state.events.some((e) => e.weekday === 5);
      const load = conflictLoad(hardConflicts);
      const conflictPenalty =
        hardConflicts.length * 120 + Math.ceil(load / 30) * 10;
      const tags = [
        hardConflicts.length
          ? `${hardConflicts.length} Konflikt${hardConflicts.length === 1 ? "" : "e"} · ${load} Min.`
          : "Ohne Konflikte",
        freeFriday ? "Freitag frei" : `${rated.days} Studientage`,
      ];
      const conflictReasons = hardConflicts.map(
        (conflict) =>
          `Konflikt: ${conflict.first.title} ↔ ${conflict.second.title}`,
      );
      return {
        id: candidateId(state),
        selectedEvents: state.events,
        choices: state.choices,
        hardConflicts,
        score: rated.score - conflictPenalty,
        tags,
        explanations: [...conflictReasons, ...rated.reasons],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}
