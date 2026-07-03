import { XMLParser } from 'fast-xml-parser'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const semester = process.argv[2] || '2026s'
if (!/^20\d{2}[sw]$/.test(semester)) throw new Error('Semester must look like 2026s or 2026w')

const department = '080110000'
const sourceUrl = `https://univis.uni-kiel.de/prg?search=lectures&department=${department}&show=xml&sem=${semester}`
const arrayTags = new Set(['Lecture','Person','Room','Event','term','doz'])
const parser = new XMLParser({ ignoreAttributes:false, attributeNamePrefix:'', isArray:tag=>arrayTags.has(tag), processEntities:true, parseTagValue:false })
const urls=[sourceUrl,...['A','B','C'].map(part=>`https://univis.uni-kiel.de/prg?search=lectures&name=Mathematik%20f%FCr%20die%20Informatik%20${part}&show=xml&sem=${semester}`)]
const roots=[]
for(const url of urls){const response=await fetch(url);if(!response.ok)throw new Error(`UnivIS returned HTTP ${response.status}`);const xml=await response.text();if(!xml.trimStart().startsWith('<?xml'))throw new Error('UnivIS did not return XML');roots.push(parser.parse(xml).UnivIS)}
const lectures=roots.flatMap(root=>root.Lecture||[]),people=roots.flatMap(root=>root.Person||[]),rooms=roots.flatMap(root=>root.Room||[])
const text = value => String(value || '').replace(/&#x([0-9a-f]+);/gi,(_,hex)=>String.fromCodePoint(parseInt(hex,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
const refs = value => value?.UnivISRef?.key || ''
const peopleByKey = Object.fromEntries(people.map(p => [p.key,[p.title,p.firstname,p.lastname].filter(Boolean).map(text).join(' ')]))
const roomsByKey = Object.fromEntries(rooms.map(r => [r.key,text(r.short || r.name || 'Raum offen')]))
const typeMap = { V:'lecture',VL:'lecture',UE:'exercise',TU:'tutorial',S:'seminar',SE:'seminar',P:'practical',PR:'practical',PRUE:'practical','V-UE':'lecture' }
const repeatWeekday = repeat => { const match=String(repeat||'').match(/^w\d+\s+([1-7])$/);return match?Number(match[1]):0 }
const weekdayOf = date => date ? new Date(`${date}T12:00:00Z`).getUTCDay() : 0
const firstOccurrence = (start,weekday) => { if(!start||!weekday)return '';const date=new Date(`${start}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+((weekday-date.getUTCDay()+7)%7));return date.toISOString().slice(0,10) }

const parsedCourses = lectures.map(lecture => ({
  sourceId:String(lecture.id), sourceKey:lecture.key, title:text(lecture.name), shortTitle:text(lecture.short),
  number:String(lecture.number || ''), type:typeMap[lecture.type] || 'other', rawType:lecture.type || '',
  lecturers:(lecture.dozs?.doz || []).map(refs).map(key => peopleByKey[key] || key).filter(Boolean),
  parentKey:refs(lecture['parent-lv']), organisation:text(lecture.orgname), sourceUrl:`https://univis.uni-kiel.de/go/lecture/${lecture.key}`,
  dates:(lecture.terms?.term || []).map(term => { const weekday=weekdayOf(term.startdate)||repeatWeekday(term.repeat); return ({
    weekday, startTime:term.starttime || '', endTime:term.endtime || '',
    startDate:term.startdate || firstOccurrence(lecture.startdate,weekday), endDate:term.enddate || lecture.enddate || term.startdate || '', repeat:term.repeat || '',
    excludedDates:String(term.exclude||'').split(',').filter(value=>/^20\d{2}-\d{2}-\d{2}$/.test(value)),
    room:roomsByKey[refs(term.room)] || refs(term.room) || 'Raum offen'
  })}).filter(date => date.weekday&&date.startDate&&date.startTime&&date.endTime)
}))
const courses=[...new Map(parsedCourses.map(course=>[course.sourceId,course])).values()]

const output = { schemaVersion:1, semester, fetchedAt:new Date().toISOString(), sourceUrl, department:{id:department,name:'Institut für Informatik'}, stats:{courses:courses.length,people:people.length,rooms:rooms.length}, courses }
await mkdir('public/data',{recursive:true})
const outputPath=`public/data/univis-${semester}.json`
let previous=null
try{previous=JSON.parse(await readFile(outputPath,'utf8'))}catch{}
const comparable=value=>JSON.stringify({...value,fetchedAt:undefined})
if(previous&&comparable(previous)===comparable(output))console.log(`UnivIS ${semester} unchanged (${courses.length} courses)`)
else{await writeFile(outputPath,JSON.stringify(output,null,2));console.log(`Imported ${courses.length} courses, ${people.length} people and ${rooms.length} rooms for ${semester}`)}
