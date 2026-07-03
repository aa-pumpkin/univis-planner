import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { modules as demoModules } from '../data/demo'
import type { Module } from '../core/models'
import { generateSchedules } from '../core/solver'
import type { Preferences, ScheduleCandidate } from '../core/models'
import { minutes } from '../core/time'
import type { PlanFile } from '../core/export'

const defaults: Preferences = { avoidBeforeTime:'10:00',avoidAfterTime:'18:00',avoidFriday:true,preferCompactWeek:true,preferFreeDays:true,avoidLongGaps:true,reserveLunchBreak:false }
export const PLANNER_STORAGE_KEY='univis-plan-v5'
type Saved = {semester:string; selectedIds:string[]; preferences:Preferences; locks:Record<string,string>; candidateId?:string}
type CandidateProfile = {title:string; description:string; preferences:Preferences; sort?:(a:ScheduleCandidate,b:ScheduleCandidate)=>number}
const dailyValues=(plan:ScheduleCandidate,select:(values:number[])=>number)=>[...new Set(plan.selectedEvents.map(event=>event.weekday))].map(day=>select(plan.selectedEvents.filter(event=>event.weekday===day).map(event=>minutes(event.startTime))));
const averageStart=(plan:ScheduleCandidate)=>dailyValues(plan,values=>Math.min(...values)).reduce((sum,value)=>sum+value,0)/Math.max(1,dailyValues(plan,values=>Math.min(...values)).length)
const dailyEndValues=(plan:ScheduleCandidate)=>[...new Set(plan.selectedEvents.map(event=>event.weekday))].map(day=>Math.max(...plan.selectedEvents.filter(event=>event.weekday===day).map(event=>minutes(event.endTime))))
const averageDailyEnd=(plan:ScheduleCandidate)=>dailyEndValues(plan).reduce((sum,value)=>sum+value,0)/Math.max(1,dailyEndValues(plan).length)
const dayCount = (plan:ScheduleCandidate) => new Set(plan.selectedEvents.map(event=>event.weekday)).size
const formatTime=(value:number)=>`${String(Math.floor(value/60)).padStart(2,'0')}:${String(Math.round(value%60)).padStart(2,'0')}`
const labelCandidate = (plan:ScheduleCandidate, profile:CandidateProfile):ScheduleCandidate => ({...plan,title:profile.title,description:profile.title==='Später starten'?`Ø Tagesstart ${formatTime(averageStart(plan))}`:profile.title==='Früher fertig'?`Ø Tagesende ${formatTime(averageDailyEnd(plan))}`:profile.description})
export const usePlannerStore = defineStore('planner',()=>{
  const saved = (() => { try{return JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)||'null') as Saved|null}catch{return null} })()
  const modules=ref<Module[]>(demoModules)
  const semester=ref(saved?.semester||'SS 2027'), selectedIds=ref(saved?.selectedIds||['alg','db','se']), preferences=ref(saved?.preferences||defaults), locks=ref<Record<string,string>>(saved?.locks||{})
  const selectedCandidateId=ref(saved?.candidateId||'')
  const selectedModules=computed(()=>modules.value.filter(m=>selectedIds.value.includes(m.id)))
  const candidates=computed(()=>{
    const profiles: CandidateProfile[] = [
      {title:'Ausgewogen',description:'Guter Mix aus freien Tagen und kurzen Pausen',preferences:preferences.value},
      {title:'Später starten',description:'Späterer durchschnittlicher Tagesbeginn',preferences:{...defaults,avoidBeforeTime:'11:00',avoidFriday:false,preferFreeDays:false},sort:(a,b)=>averageStart(b)-averageStart(a)||b.score-a.score},
      {title:'Früher fertig',description:'Früheres durchschnittliches Tagesende',preferences:{...defaults,avoidBeforeTime:'08:00',avoidAfterTime:'17:00',avoidFriday:false},sort:(a,b)=>averageDailyEnd(a)-averageDailyEnd(b)||b.score-a.score},
      {title:'Kompakte Woche',description:'Weniger Tage und möglichst kleine Lücken',preferences:{...defaults,avoidBeforeTime:'08:00',avoidAfterTime:'20:00',preferCompactWeek:true,preferFreeDays:true,avoidLongGaps:true},sort:(a,b)=>dayCount(a)-dayCount(b)||b.score-a.score}
    ]
    const pools=profiles.map(profile=>profile.sort?[...generateSchedules(selectedModules.value,profile.preferences,locks.value)].sort(profile.sort):generateSchedules(selectedModules.value,profile.preferences,locks.value))
    const picked: ScheduleCandidate[]=[]
    for(let i=0;i<pools.length;i++){const best=pools[i][0];if(best&&!picked.some(plan=>plan.id===best.id))picked.push(labelCandidate(best,profiles[i]))}
    return picked.slice(0,4)
  })
  const current=computed<ScheduleCandidate|undefined>(()=>candidates.value.find(c=>c.id===selectedCandidateId.value)||candidates.value[0])
  const toggleModule=(id:string)=>{ selectedIds.value=selectedIds.value.includes(id)?selectedIds.value.filter(x=>x!==id):[...selectedIds.value,id]; selectedCandidateId.value='' }
  const selectCandidate=(id:string)=>selectedCandidateId.value=id
  const lockChoice=(groupId:string,eventId:string)=>{ locks.value={...locks.value,[groupId]:eventId}; selectedCandidateId.value='' }
  const unlockChoice=(groupId:string)=>{ const n={...locks.value};delete n[groupId];locks.value=n }
  const importPlan=(p:PlanFile)=>{if(p.version!==1)throw new Error('Неподдерживаемая версия');semester.value=p.semester;selectedIds.value=p.moduleIds;preferences.value=p.preferences;locks.value=p.choices||{}}
  const setModules=(next:Module[])=>{modules.value=next;selectedIds.value=selectedIds.value.filter(id=>next.some(module=>module.id===id));const validGroups=next.flatMap(module=>module.selectableGroups);locks.value=Object.fromEntries(Object.entries(locks.value).filter(([groupId,eventId])=>validGroups.some(group=>group.id===groupId&&group.options.some(option=>option.id===eventId))));selectedCandidateId.value=''}
  watch([semester,selectedIds,preferences,locks,selectedCandidateId],()=>localStorage.setItem(PLANNER_STORAGE_KEY,JSON.stringify({semester:semester.value,selectedIds:selectedIds.value,preferences:preferences.value,locks:locks.value,candidateId:selectedCandidateId.value})),{deep:true})
  return {semester,modules,selectedIds,preferences,locks,selectedModules,candidates,current,toggleModule,selectCandidate,lockChoice,unlockChoice,importPlan,setModules}
})
