import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, writeFile } from 'node:fs/promises'

const run = promisify(execFile)
const now = new Date()
const year = now.getUTCFullYear()
const month = now.getUTCMonth() + 1

// CAU: summer semester runs Apr–Sep, winter semester Oct–Mar.
// Keep one relevant term for each Fachsemester parity: current + next.
const terms = month >= 4 && month <= 9
  ? { even: `${year}s`, odd: `${year}w` }
  : month >= 10
    ? { odd: `${year}w`, even: `${year + 1}s` }
    : { odd: `${year - 1}w`, even: `${year}s` }

const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds))
for (const semester of [...new Set(Object.values(terms))]) {
  let lastError
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const {stdout,stderr}=await run(process.execPath,['scripts/fetch-univis.mjs',semester])
      if(stdout)process.stdout.write(stdout)
      if(stderr)process.stderr.write(stderr)
      lastError=null
      break
    }catch(error){lastError=error;if(attempt<3){console.warn(`UnivIS ${semester} failed (attempt ${attempt}/3), retrying…`);await wait(attempt*5000)}}
  }
  if(lastError)throw lastError
}

const manifestPath='public/data/current-terms.json'
let previous=null
try{previous=JSON.parse(await readFile(manifestPath,'utf8'))}catch{}
if(!previous||JSON.stringify(previous.terms)!==JSON.stringify(terms))await writeFile(manifestPath, JSON.stringify({schemaVersion:1,generatedAt:now.toISOString(),terms},null,2)+'\n')

console.log(`Active terms: even=${terms.even}, odd=${terms.odd}`)
