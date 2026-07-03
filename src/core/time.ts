import type { CourseEvent } from './models'
export const minutes = (time: string) => { const [h, m] = time.split(':').map(Number); return h * 60 + m }
export const overlaps = (a: CourseEvent, b: CourseEvent) => {
  if(a.weekday !== b.weekday||minutes(a.startTime)>=minutes(b.endTime)||minutes(b.startTime)>=minutes(a.endTime))return false
  if(!a.startDate||!a.endDate||!b.startDate||!b.endDate)return true
  const start=a.startDate>b.startDate?a.startDate:b.startDate,end=a.endDate<b.endDate?a.endDate:b.endDate
  if(start>end)return false
  const date=new Date(`${start}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+((a.weekday-date.getUTCDay()+7)%7))
  const excludedA=new Set(a.excludedDates||[]),excludedB=new Set(b.excludedDates||[])
  while(date.toISOString().slice(0,10)<=end){const day=date.toISOString().slice(0,10);if(!excludedA.has(day)&&!excludedB.has(day))return true;date.setUTCDate(date.getUTCDate()+7)}
  return false
}
export const duration = (event: CourseEvent) => minutes(event.endTime) - minutes(event.startTime)
export const isoWeek = (value:string|Date) => { const date=typeof value==='string'?new Date(`${value}T12:00:00Z`):new Date(value);const day=date.getUTCDay()||7;date.setUTCDate(date.getUTCDate()+4-day);const yearStart=new Date(Date.UTC(date.getUTCFullYear(),0,1));return Math.ceil((((date.getTime()-yearStart.getTime())/86400000)+1)/7) }
export const occursInWeekParity = (event:CourseEvent,parity:'even'|'odd') => {
  if(!event.startDate||!event.endDate)return true
  const date=new Date(`${event.startDate}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+((event.weekday-date.getUTCDay()+7)%7))
  const excluded=new Set(event.excludedDates||[]),wanted=parity==='even'?0:1
  while(date.toISOString().slice(0,10)<=event.endDate){const value=date.toISOString().slice(0,10);if(!excluded.has(value)&&isoWeek(date)%2===wanted)return true;date.setUTCDate(date.getUTCDate()+7)}
  return false
}
