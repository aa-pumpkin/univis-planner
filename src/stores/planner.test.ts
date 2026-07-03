import { beforeEach,describe,expect,it,vi } from 'vitest'
import { createPinia,setActivePinia } from 'pinia'
import { usePlannerStore } from './planner'
import type { CourseEvent,Module } from '../core/models'
import { minutes } from '../core/time'

const event=(id:string,startTime:string,endTime:string):CourseEvent=>({id,moduleId:'m',title:id,type:'exercise',weekday:1,startTime,endTime,room:'R'})
const module:Module={id:'m',title:'Test',shortTitle:'T',ects:5,category:'mandatory',semesterRecommendation:1,lecturer:'',color:'#000',fixedEvents:[],selectableGroups:[{id:'g',title:'Gruppe',options:[event('balanced','10:00','14:00'),event('late','12:00','18:00'),event('early','08:00','10:00')]}]}

describe('candidate profiles',()=>{
  beforeEach(()=>{vi.stubGlobal('localStorage',{getItem:()=>null,setItem:()=>{}});setActivePinia(createPinia())})
  it('labels only genuinely optimal distinct variants',()=>{
    const store=usePlannerStore();store.setModules([module]);store.selectedIds=['m']
    const late=store.candidates.find(candidate=>candidate.title==='Später starten')
    const early=store.candidates.find(candidate=>candidate.title==='Früher fertig')
    expect(late?.selectedEvents[0].startTime).toBe('12:00')
    expect(early?.selectedEvents[0].endTime).toBe('10:00')
    expect(minutes(early!.selectedEvents[0].endTime)).toBeLessThan(minutes(late!.selectedEvents[0].endTime))
    expect(new Set(store.candidates.map(candidate=>candidate.id)).size).toBe(store.candidates.length)
  })
})
