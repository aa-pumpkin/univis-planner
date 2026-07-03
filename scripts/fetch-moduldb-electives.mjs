import { mkdir,writeFile } from 'node:fs/promises'

const categories=[{id:131,kind:'elective'},{id:147,kind:'seminar'}]
const sourceUrl='https://moduldb.informatik.uni-kiel.de/show.cgi?Category/studyprogram/StudyProgram18'
const decode=value=>value.replace(/&Uuml;/g,'Ü').replace(/&Auml;/g,'Ä').replace(/&Ouml;/g,'Ö').replace(/&uuml;/g,'ü').replace(/&auml;/g,'ä').replace(/&ouml;/g,'ö').replace(/&szlig;/g,'ß').replace(/&amp;/g,'&').replace(/&#(\d+);/g,(_,number)=>String.fromCodePoint(Number(number)))
const rowPattern=/<a href="\?ModData\/show\/ModData\d+"[^>]*><span class="type_string">\s*([^:<]+(?:-[^:<]+)*)\s*:\s*([^<]+)<\/span><\/a>[\s\S]*?<td>\s*<span class="type_string">\s*([0-9.,]+)\s*<\/span>/g
const modules=[]
for(const category of categories){const url=`https://moduldb.informatik.uni-kiel.de/show.cgi?Category/show/Category${category.id}`;const response=await fetch(url);if(!response.ok)throw new Error(`ModulDB returned HTTP ${response.status}`);const html=await response.text();modules.push(...[...html.matchAll(rowPattern)].map(match=>({code:decode(match[1]).trim(),title:decode(match[2]).trim(),ects:Number(match[3].replace(',','.')),category:'elective',selectionKind:category.kind,sourceUrl:url})))}
if(modules.length<20)throw new Error(`Only ${modules.length} BSc electives parsed; refusing incomplete catalog`)
await mkdir('src/data/generated',{recursive:true})
await writeFile('src/data/generated/bsc-electives.json',JSON.stringify({fetchedAt:new Date().toISOString(),sourceUrl,modules},null,2))
console.log(`Imported ${modules.length} officially eligible BSc electives`)
