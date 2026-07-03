export interface ImportedDate { weekday:number; startTime:string; endTime:string; startDate:string; endDate:string; repeat:string; room:string; excludedDates?:string[] }
export interface ImportedCourse { sourceId:string; sourceKey:string; title:string; shortTitle:string; number:string; type:string; rawType:string; lecturers:string[]; parentKey:string; organisation:string; sourceUrl:string; dates:ImportedDate[] }
export interface UnivisDataset { schemaVersion:1; semester:string; fetchedAt:string; sourceUrl:string; department:{id:string;name:string}; stats:{courses:number;people:number;rooms:number}; courses:ImportedCourse[] }
export interface ActiveTerms { schemaVersion:1; generatedAt:string; terms:{even:string;odd:string} }
export const termsForDate = (date = new Date()):ActiveTerms['terms'] => {
  const year=date.getFullYear(),month=date.getMonth()+1
  if(month>=4&&month<=9)return {even:`${year}s`,odd:`${year}w`}
  if(month>=10)return {odd:`${year}w`,even:`${year+1}s`}
  return {odd:`${year-1}w`,even:`${year}s`}
}
export const loadActiveTerms = async ():Promise<ActiveTerms> => {
  const response=await fetch('/data/current-terms.json',{cache:'no-store'})
  if(!response.ok)throw new Error('No active semester manifest')
  const value=await response.json()
  if(!value?.terms?.even||!value?.terms?.odd)throw new Error('Invalid active semester manifest')
  return value
}
export const loadUnivisDataset = async (semester:string):Promise<UnivisDataset> => {
  const response=await fetch(`/data/univis-${semester}.json?revision=official-catalog-v5`,{cache:'no-store'})
  if(!response.ok) throw new Error(`No imported UnivIS data for ${semester}`)
  return response.json()
}
