import { describe, expect, it } from 'vitest'
import { findConflicts, generateSchedules } from './solver'
import { modules } from '../data/demo'
import type { Preferences } from './models'
import { occursInWeekParity } from './time'
const preferences:Preferences={avoidBeforeTime:'10:00',avoidAfterTime:'18:00',avoidFriday:true,preferCompactWeek:true,preferFreeDays:true,avoidLongGaps:true,reserveLunchBreak:false}
describe('schedule solver',()=>{
  it('detects overlapping events',()=>{
    const events=[modules[0].selectableGroups[0].options[0],modules[1].selectableGroups[0].options[0]]
    expect(findConflicts(events)).toHaveLength(1)
  })
  it('does not report conflicts for disjoint date ranges',()=>{
    const first={...modules[0].fixedEvents[0],startDate:'2026-04-01',endDate:'2026-05-01'}
    const second={...first,id:'later',startDate:'2026-06-01',endDate:'2026-07-01'}
    expect(findConflicts([first,second])).toHaveLength(0)
  })
  it('does not conflict when alternating events exclude opposite weeks',()=>{
    const first={...modules[0].fixedEvents[0],weekday:5 as const,startDate:'2026-04-17',endDate:'2026-05-08',excludedDates:['2026-04-24','2026-05-08']}
    const second={...first,id:'alternating',excludedDates:['2026-04-17','2026-05-01']}
    expect(findConflicts([first,second])).toHaveLength(0)
    expect(occursInWeekParity(first,'even')).toBe(true)
    expect(occursInWeekParity(first,'odd')).toBe(false)
    expect(occursInWeekParity(second,'even')).toBe(false)
    expect(occursInWeekParity(second,'odd')).toBe(true)
  })
  it('returns ranked conflict-free combinations',()=>{
    const plans=generateSchedules(modules.slice(0,3),preferences)
    expect(plans.length).toBeGreaterThan(1)
    expect(plans.every(p=>p.hardConflicts.length===0)).toBe(true)
    expect(plans[0].score).toBeGreaterThanOrEqual(plans.at(-1)!.score)
  })
  it('still returns the best possible schedules when a conflict is unavoidable',()=>{
    const conflictingModules=[
      {...modules[0],fixedEvents:[modules[0].fixedEvents[0]],selectableGroups:[]},
      {...modules[1],fixedEvents:[{...modules[1].fixedEvents[0],weekday:1 as const,startTime:'10:45',endTime:'12:15'}],selectableGroups:[]}
    ]
    const plans=generateSchedules(conflictingModules,preferences)
    expect(plans).toHaveLength(1)
    expect(plans[0].selectedEvents).toHaveLength(2)
    expect(plans[0].hardConflicts).toHaveLength(1)
    expect(plans[0].tags[0]).toContain('Konflikt')
  })
  it('prefers smaller collisions when every selectable group overlaps',()=>{
    const conflictModules=[{...modules[0],fixedEvents:[modules[0].fixedEvents[0]],selectableGroups:[{id:'only-conflicts',title:'Only conflicts',options:[
      {...modules[0].selectableGroups[0].options[0],id:'big',weekday:1 as const,startTime:'10:15',endTime:'11:45'},
      {...modules[0].selectableGroups[0].options[0],id:'small',weekday:1 as const,startTime:'11:15',endTime:'12:45'}
    ]}]}]
    const plans=generateSchedules(conflictModules,preferences)
    expect(plans[0].choices['only-conflicts']).toBe('small')
  })
  it('prefers the latest real start when late starts are requested',()=>{
    const lateStartModules=[{...modules[0],fixedEvents:[],selectableGroups:[{id:'start',title:'Start',options:[
      {...modules[0].selectableGroups[0].options[0],id:'early',startTime:'08:00',endTime:'09:30'},
      {...modules[0].selectableGroups[0].options[0],id:'late',startTime:'10:30',endTime:'12:00'}
    ]}]}]
    const plans=generateSchedules(lateStartModules,{...preferences,avoidBeforeTime:'11:00',avoidFriday:false,preferFreeDays:false})
    expect(plans[0].selectedEvents[0].id).toBe('late')
  })
  it('honours locked group choices',()=>{
    const locked=modules[0].selectableGroups[0].options[2]
    const plans=generateSchedules(modules.slice(0,2),preferences,{'alg-ex':locked.id})
    expect(plans.every(p=>p.choices['alg-ex']===locked.id)).toBe(true)
  })
  it('can protect lectures or exercises when a conflict is unavoidable',()=>{
    const lecture={...modules[0].fixedEvents[0],id:'lecture',weekday:1 as const,startTime:'10:00',endTime:'11:00',type:'lecture' as const}
    const exercise={...lecture,id:'fixed-exercise',weekday:2 as const,startTime:'10:00',endTime:'11:00',type:'exercise' as const}
    const base={...modules[0].selectableGroups[0].options[0],type:'exercise' as const}
    const priorityModules=[{...modules[0],fixedEvents:[lecture,exercise],selectableGroups:[{id:'priority',title:'Priority',options:[
      {...base,id:'hits-lecture',weekday:1 as const,startTime:'10:30',endTime:'11:30'},
      {...base,id:'hits-exercise',weekday:2 as const,startTime:'10:00',endTime:'11:00'}
    ]}]}]
    expect(generateSchedules(priorityModules,preferences,{},'lectures')[0].choices.priority).toBe('hits-exercise')
    expect(generateSchedules(priorityModules,preferences,{},'exercises')[0].choices.priority).toBe('hits-lecture')
  })
})
