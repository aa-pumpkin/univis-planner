import { describe,expect,it } from 'vitest'
import { exportIcs } from './export'
import type { CourseEvent } from './models'
const event:CourseEvent={id:'x',moduleId:'m',title:'Kurs',type:'lecture',weekday:1,startTime:'10:15',endTime:'11:45',startDate:'2026-04-13',endDate:'2026-07-17',room:'CAP'}
describe('calendar export',()=>{
  it('uses actual UnivIS semester dates',()=>{
    const ics=exportIcs([event]);expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20260413T101500');expect(ics).toContain('UNTIL=20260717T235959Z');expect(ics).not.toContain('COUNT=14')
  })
  it('refuses to invent dates',()=>expect(()=>exportIcs([{...event,startDate:undefined}])).toThrow('fehlen Semesterdaten'))
  it('exports excluded UnivIS dates',()=>expect(exportIcs([{...event,excludedDates:['2026-05-04']}])).toContain('EXDATE;TZID=Europe/Berlin:20260504T101500'))
})
