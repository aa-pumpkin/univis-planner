export type Weekday = 1 | 2 | 3 | 4 | 5
export type EventType = 'lecture' | 'exercise' | 'tutorial' | 'seminar' | 'practical' | 'study-block'
export type ModuleCategory = 'mandatory' | 'elective' | 'seminar' | 'practical' | 'retake'

export interface CourseEvent {
  id: string; moduleId: string; title: string; type: EventType; weekday: Weekday
  startTime: string; endTime: string; room: string; lecturer?: string; sourceUrl?: string
  startDate?: string; endDate?: string
  excludedDates?: string[]
  isFixed?: boolean; isOptional?: boolean; isLocked?: boolean; isRetakeRelated?: boolean
}

export interface SelectableGroup { id: string; title: string; options: CourseEvent[] }
export interface Module {
  id: string; title: string; shortTitle: string; ects: number | null; category: ModuleCategory
  semesterRecommendation: number; lecturer: string; color: string
  requiresSelectableGroup?: boolean
  fixedEvents: CourseEvent[]; selectableGroups: SelectableGroup[]; optionalEvents?: CourseEvent[]
}
export interface Preferences {
  avoidBeforeTime: string; avoidAfterTime: string; avoidFriday: boolean
  preferCompactWeek: boolean; preferFreeDays: boolean; avoidLongGaps: boolean; reserveLunchBreak: boolean
}
export interface Conflict { first: CourseEvent; second: CourseEvent }
export interface ScheduleCandidate {
  id: string; selectedEvents: CourseEvent[]; choices: Record<string, string>
  hardConflicts: Conflict[]; score: number; tags: string[]; explanations: string[]
  title?: string; description?: string
}
