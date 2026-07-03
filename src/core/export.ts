import type { CourseEvent, Module, Preferences } from './models'

const escapeIcs = (value: string) => value.replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\n/g,'\\n')
export function exportIcs(events: CourseEvent[]) {
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//UnivIS Planner//DE','CALSCALE:GREGORIAN']
  for (const e of events) {
    if(!e.startDate||!e.endDate)throw new Error(`Für ${e.title} fehlen Semesterdaten`)
    const date=e.startDate.replaceAll('-',''), until=e.endDate.replaceAll('-',''), start=e.startTime.replace(':','')+'00', end=e.endTime.replace(':','')+'00'
    lines.push('BEGIN:VEVENT',`UID:${e.id}@univis-planner`,`DTSTART;TZID=Europe/Berlin:${date}T${start}`,`DTEND;TZID=Europe/Berlin:${date}T${end}`,`RRULE:FREQ=WEEKLY;UNTIL=${until}T235959Z`,...(e.excludedDates?.length?[`EXDATE;TZID=Europe/Berlin:${e.excludedDates.map(value=>value.replaceAll('-','')+'T'+start).join(',')}`]:[]),`SUMMARY:${escapeIcs(e.title)}`,`LOCATION:${escapeIcs(e.room)}`,`DESCRIPTION:${escapeIcs(`${e.type}${e.lecturer ? ` · ${e.lecturer}` : ''}`)}`,'END:VEVENT')
  }
  return lines.concat('END:VCALENDAR').join('\r\n')
}
export const download = (name:string, content:string, type:string) => { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500) }
export const exportPlan = (semester:string, moduleIds:string[], choices:Record<string,string>, preferences:Preferences) => JSON.stringify({version:1, exportedAt:new Date().toISOString(),semester,moduleIds,choices,preferences},null,2)
export type PlanFile = { version: number; semester: string; moduleIds: string[]; choices: Record<string,string>; preferences: Preferences }
export const moduleName = (event:CourseEvent, modules:Module[]) => modules.find(m=>m.id===event.moduleId)?.title ?? event.title
