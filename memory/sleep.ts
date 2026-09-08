/**
 * memory/sleep.ts — Reflector → Curator (ACE-lite)
 * Reads recent runs/, clusters failures, proposes playbook bullets.
 * Run: npm run sleep
 */
import fs from "node:fs";
import path from "node:path";

const RUNS = path.join(import.meta.dirname, "../runs");
const PLAYBOOK = path.join(import.meta.dirname, "playbook.md");

function listRuns() {
  if (!fs.existsSync(RUNS)) return [];
  return fs.readdirSync(RUNS).filter((d) => !d.startsWith("_") && !d.includes(".")).slice(-5);
}

console.log("Recent runs:", listRuns());
console.log("Playbook:", PLAYBOOK);
console.log("TODO: read trajectory.jsonl, cluster failures, append id: description bullets via Edit tool");
// For v1, keep it manual: after 2 similar failures, add bullet to playbook.md yourself
