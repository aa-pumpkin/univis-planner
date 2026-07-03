import { describe,expect,it } from 'vitest'
import { normalizeUnivisModules, toPlannerModules } from './normalizer'
import type { ImportedCourse, UnivisDataset } from './univis'
import realDataset from '../../public/data/univis-2026s.json'
import winterDataset from '../../public/data/univis-2025w.json'
import realMappings from '../data/mappings/cau-informatik.json'
import officialChoices from '../data/generated/bsc-electives.json'
import { mergeCurriculumWithSchedule } from '../data/curriculum'
import { findConflicts, generateSchedules } from '../core/solver'
const course=(overrides:Partial<ImportedCourse>):ImportedCourse=>({sourceId:'1',sourceKey:'lecture-1',title:'infST-01a: Softwaretechnik',shortTitle:'infST-01a',number:'08001',type:'lecture',rawType:'V',lecturers:[],parentKey:'',organisation:'',sourceUrl:'',dates:[{weekday:4,startTime:'14:00',endTime:'15:30',startDate:'2026-04-01',endDate:'2026-07-01',repeat:'',room:'CAP'}],...overrides})
const mappingsFor=(semester:'2025w'|'2026s')=>({...realMappings,...Object.fromEntries(officialChoices.modules.map(module=>[module.code,{title:module.title,ects:module.ects,category:'elective' as const,semester:semester==='2025w'?5:6}]))})
describe('UnivIS normalizer',()=>{
  it('uses a sourced ModulDB catalog with complete ECTS',()=>{
    expect(officialChoices.modules.length).toBeGreaterThan(90)
    expect(officialChoices.modules.every(module=>module.code&&module.title&&module.ects>0)).toBe(true)
    expect(officialChoices.modules.find(module=>module.code==='infIoT-01a')?.ects).toBe(8)
  })
  it('groups a lecture and its exercises into one mapped module',()=>{
    const courses=[course({}),course({sourceId:'2',sourceKey:'exercise-1',title:'Übung zu: Softwaretechnik',shortTitle:'Übg.(infST-01a)',type:'exercise',rawType:'UE',parentKey:'lecture-1'})]
    const dataset={courses,stats:{courses:2,people:0,rooms:0}} as UnivisDataset
    const result=normalizeUnivisModules(dataset,{'infST-01a':{title:'Softwaretechnik',semester:4,category:'mandatory',ects:8}})
    expect(result).toHaveLength(1);expect(result[0].fixedEvents).toHaveLength(1);expect(result[0].selectableGroups[0].options).toHaveLength(1);expect(result[0].category).toBe('mandatory')
  })
  it('keeps unknown courses visible as unmapped',()=>{
    const dataset={courses:[course({shortTitle:'Special',title:'Special Topics'})],stats:{courses:1,people:0,rooms:0}} as UnivisDataset
    expect(normalizeUnivisModules(dataset,{})[0].category).toBe('unmapped')
  })
  it('does not expose unverified unmapped lectures as electives',()=>{
    const dataset={semester:'2026s',courses:[course({shortTitle:'Special',title:'Special Topics'})],stats:{courses:1,people:0,rooms:0}} as UnivisDataset
    const modules=toPlannerModules(normalizeUnivisModules(dataset,{}))
    expect(modules).toEqual([])
  })
  it('builds planner modules from the imported CAU dataset',()=>{
    const result=normalizeUnivisModules(realDataset as UnivisDataset,realMappings as any)
    const mapped=result.filter(module=>module.category!=='unmapped')
    expect(mapped.length).toBeGreaterThanOrEqual(4)
    expect(mapped.find(module=>module.code==='infST-01a')?.selectableGroups[0].options.length).toBeGreaterThan(0)
  })
  it('preserves official ECTS and loads complete real semester-2 data',()=>{
    const normalized=normalizeUnivisModules(realDataset as UnivisDataset,mappingsFor('2026s') as any)
    const modules=mergeCurriculumWithSchedule(toPlannerModules(normalized))
    const byTitle=(title:string)=>modules.find(module=>module.title===title)!
    expect(byTitle('Computer Networks').ects).toBe(7)
    expect(byTitle('Mathematik für die Informatik B').ects).toBe(8)
    expect(byTitle('Internet of Things and Wireless Networks').ects).toBe(8)
    expect(modules.filter(module=>module.ects===0).map(module=>module.title)).toEqual([])
    expect(byTitle('Einführung in die Algorithmik').fixedEvents.length).toBeGreaterThanOrEqual(2)
    expect(byTitle('Computer Networks').fixedEvents.length).toBeGreaterThanOrEqual(2)
    expect(byTitle('Objektorientierte Programmierung').selectableGroups[0].options.length).toBeGreaterThan(1)
    const semesterTwo=modules.filter(module=>module.semesterRecommendation===2&&module.category==='mandatory')
    const plans=generateSchedules(semesterTwo,{avoidBeforeTime:'08:00',avoidAfterTime:'20:00',avoidFriday:false,preferCompactWeek:true,preferFreeDays:true,avoidLongGaps:true,reserveLunchBreak:false})
    expect(plans.length).toBeGreaterThan(0)
  })
  it('keeps the real IoT exercise and practical exercise as separate required components',()=>{
    const modules=toPlannerModules(normalizeUnivisModules(realDataset as UnivisDataset,mappingsFor('2026s') as any))
    const iot=modules.find(module=>module.shortTitle==='infIoT-01a')!
    expect(iot.selectableGroups.length).toBeGreaterThanOrEqual(2)
    const plans=generateSchedules([iot],{avoidBeforeTime:'08:00',avoidAfterTime:'20:00',avoidFriday:false,preferCompactWeek:true,preferFreeDays:true,avoidLongGaps:true,reserveLunchBreak:false})
    expect(plans.length).toBeGreaterThan(0)
    expect(plans.every(plan=>plan.selectedEvents.some(event=>event.weekday===1&&event.startTime==='14:15'&&event.type==='exercise'))).toBe(true)
  })
  it('loads a usable real third-semester schedule from the winter dataset',()=>{
    const normalized=normalizeUnivisModules(winterDataset as UnivisDataset,realMappings as any)
    const modules=mergeCurriculumWithSchedule(toPlannerModules(normalized).filter(module=>module.semesterRecommendation%2===1))
    const semesterThree=modules.filter(module=>module.semesterRecommendation===3&&module.category==='mandatory')
    expect(semesterThree).toHaveLength(4)
    expect(semesterThree.every(module=>module.fixedEvents.length>0)).toBe(true)
    expect(semesterThree.every(module=>!module.requiresSelectableGroup||module.selectableGroups.length>0)).toBe(true)
    const plans=generateSchedules(semesterThree,{avoidBeforeTime:'08:00',avoidAfterTime:'20:00',avoidFriday:false,preferCompactWeek:true,preferFreeDays:true,avoidLongGaps:true,reserveLunchBreak:false})
    expect(plans.length).toBeGreaterThan(0)
  })
  it('has complete mapped timetable data for semesters 1, 4 and 5',()=>{
    const winter=toPlannerModules(normalizeUnivisModules(winterDataset as UnivisDataset,mappingsFor('2025w') as any)).filter(module=>module.category==='elective'||module.semesterRecommendation%2===1)
    const summer=toPlannerModules(normalizeUnivisModules(realDataset as UnivisDataset,mappingsFor('2026s') as any)).filter(module=>module.category==='elective'||module.semesterRecommendation%2===0)
    const modules=mergeCurriculumWithSchedule([...winter,...summer])
    expect(winter.filter(module=>module.category==='elective').length,'official WS electives found in UnivIS').toBeGreaterThan(5)
    expect(summer.filter(module=>module.category==='elective').length,'official SS electives found in UnivIS').toBeGreaterThan(5)
    expect([...winter,...summer].filter(module=>module.category==='elective').every(module=>module.ects!==null)).toBe(true)
    for(const semester of [1,4,5]){
      const required=modules.filter(module=>module.semesterRecommendation===semester&&module.category==='mandatory'&&module.title!=='Bachelorarbeit')
      expect(required.length,`semester ${semester} modules`).toBeGreaterThan(0)
      expect(required.filter(module=>module.fixedEvents.length===0).map(module=>module.title),`semester ${semester} lectures`).toEqual([])
      expect(required.filter(module=>module.requiresSelectableGroup&&module.selectableGroups.length===0).map(module=>module.title),`semester ${semester} groups`).toEqual([])
      expect(findConflicts(required.flatMap(module=>module.fixedEvents)).map(conflict=>`${conflict.first.title} <> ${conflict.second.title} @ ${conflict.first.weekday} ${conflict.first.startTime}`),`semester ${semester} fixed conflicts`).toEqual([])
      expect(generateSchedules(required,{avoidBeforeTime:'08:00',avoidAfterTime:'20:00',avoidFriday:false,preferCompactWeek:true,preferFreeDays:true,avoidLongGaps:true,reserveLunchBreak:false}).length,`semester ${semester} plans`).toBeGreaterThan(0)
    }
    expect(modules.filter(module=>module.semesterRecommendation===5&&module.category==='elective'&&module.title.includes('Bachelorseminar')).length).toBeGreaterThan(1)
    const semesterSixChoices=modules.filter(module=>module.category==='elective'&&module.semesterRecommendation%2===0&&module.fixedEvents.length>0)
    expect(semesterSixChoices.length).toBeGreaterThan(0)
    expect(semesterSixChoices.some(module=>generateSchedules([module],{avoidBeforeTime:'08:00',avoidAfterTime:'20:00',avoidFriday:false,preferCompactWeek:true,preferFreeDays:true,avoidLongGaps:true,reserveLunchBreak:false}).length>0)).toBe(true)
  })
})
