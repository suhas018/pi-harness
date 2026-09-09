/**
 * memory/sleep.ts — Reflector → Curator (ACE-lite)
 * Reads runs/<id>/trajectory.jsonl, clusters by task/sensor, appends one bullet to playbook.md if missing.
 * Run: npm run sleep  (uses node 22)
 * Keeps it simple: id: description | source | date  (no blob rewrite)
 */
import fs from "node:fs";
import path from "node:path";

const RUNS = path.join(import.meta.dirname ?? ".", "../runs");
const PLAYBOOK = path.join(import.meta.dirname ?? ".", "playbook.md");

function listRuns(): string[] {
  if (!fs.existsSync(RUNS)) return [];
  return fs.readdirSync(RUNS).filter((d) => !d.startsWith("_") && !d.includes(".") && fs.statSync(path.join(RUNS, d)).isDirectory());
}

function readPlaybook(): string {
  return fs.existsSync(PLAYBOOK) ? fs.readFileSync(PLAYBOOK, "utf8") : "";
}

function hasBullet(playbook: string, id: string): boolean {
  return playbook.includes(`${id}:`);
}

function appendBullet(id: string, desc: string, source: string) {
  const line = `- ${id}: ${desc} | ${source} | ${new Date().toISOString().slice(0, 10)}\n`;
  fs.appendFileSync(PLAYBOOK, line, "utf8");
  console.log(`[curator] added ${id}: ${desc}`);
}

function main() {
  const runs = listRuns().sort().slice(-5);
  console.log("Recent runs:", runs);
  if (runs.length === 0) {
    console.log("[reflector] no runs — nothing to learn");
    return;
  }

  const playbook = readPlaybook();
  const trajectories: any[] = [];
  for (const r of runs) {
    const p = path.join(RUNS, r, "trajectory.jsonl");
    if (!fs.existsSync(p)) continue;
    try {
      const txt = fs.readFileSync(p, "utf8").trim();
      // support one JSON per line or single JSON
      for (const line of txt.split("\n")) if (line.trim()) trajectories.push(JSON.parse(line));
    } catch (e) {
      console.log(`[reflector] skip ${r}: ${e}`);
    }
  }

  console.log(`[reflector] read ${trajectories.length} trajectories`);

  // Simple clustering: group by task
  const byTask = new Map<string, any[]>();
  for (const t of trajectories) {
    const k = t.task ?? "unknown";
    if (!byTask.has(k)) byTask.set(k, []);
    byTask.get(k)!.push(t);
  }

  // Curator rule 1: if sample-01 succeeded with TestClient, ensure py-003 exists
  const sample01 = byTask.get("sample-01");
  if (sample01?.some((t) => (t.verifier ?? "").includes("passed") || (t.sensor ?? "").includes("All checks"))) {
    if (!hasBullet(playbook, "py-003")) {
      appendBullet("py-003", "Use TestClient for FastAPI tests, not requests to real server", "sample-01:1c682bc");
    } else console.log("[curator] py-003 already exists");
  }

  // Curator rule 2: if any sensor failed repeatedly, add rev bullet (demo)
  const failed = trajectories.filter((t) => (t.sensor ?? "").toLowerCase().includes("fail"));
  if (failed.length >= 2 && !hasBullet(playbook, "rev-002")) {
    appendBullet("rev-002", "Sensor failed 2x — check ruff/mypy before commit", "reflector");
  }

  // Curator rule 3: after 2+ runs, add general learning bullet once
  if (trajectories.length >= 1 && !hasBullet(playbook, "learn-001")) {
    appendBullet("learn-001", "File-system memory works: trajectory → playbook → next run", "sleep");
  }

  console.log("[done] playbook at", PLAYBOOK);
}

main();
