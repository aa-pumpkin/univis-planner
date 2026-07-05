import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("node", ["scripts/update-active-terms.mjs"]);
run("node", ["scripts/fetch-moduldb-electives.mjs"]);

const manifest = JSON.parse(
  await readFile("public/data/current-terms.json", "utf8"),
);
console.log(`Updated data for ${manifest.terms.odd}, ${manifest.terms.even}`);
