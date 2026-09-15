/**
 * Minimal pi extension — outer harness hooks.
 * Pi loads extensions from this file (see pi docs: Extensions).
 * Keep it tiny and file-backed for learning.
 */

import fs from "node:fs";
import path from "node:path";

const RUNS_DIR = path.join(import.meta.dirname ?? ".", "../runs");
const PLAYBOOK = path.join(import.meta.dirname ?? ".", "../memory/playbook.md");

// Called by pi when extension loads — register tool wrappers
export function activate(pi: any) {
  // Feedforward: inject playbook into context at session start
  pi.on("session:start", async () => {
    if (fs.existsSync(PLAYBOOK)) {
      const playbook = fs.readFileSync(PLAYBOOK, "utf8").slice(0, 4000);
      pi.injectContext(`<playbook>\n${playbook}\n</playbook>`);
    }
  });

  // Feedback: after every Write, run computational sensor (tight — Fowler: sensor optimized for LLM)
  pi.on("tool:write:after", async (evt: any) => {
    const { spawnSync } = await import("node:child_process");
    // Ensure ruff is found via uv fallback — pass enriched PATH
    const res = spawnSync("npx", ["tsx", "sensors/computational.ts", evt.file ?? "."], {
      encoding: "utf8",
      timeout: 15000,
      env: { ...process.env, PATH: process.env.PATH ?? "" },
    });
    const out = (res.stdout ?? "") + (res.stderr ?? "");
    if (res.status !== 0) {
      // feed sensor output back as LLM-consumable signal
      pi.injectContext(`<sensor type="computational" file="${evt.file ?? ""}">\n${out.slice(0, 4000)}\nFix this before continuing (run ruff --fix if needed).\n</sensor>`);
      // don't block — let LLM self-correct (steering loop)
      return { block: false };
    }
    if (out.trim()) pi.injectContext(`<sensor type="computational" ok file="${evt.file ?? ""}">${out.slice(0, 1000)}</sensor>`);
  });

  // After run, append to trajectory (file-system as memory — Weng Pattern 2)
  // Also runs sensor/judge heuristic for quick feedback
  pi.on("run:end", async (evt: any) => {
    const id = new Date().toISOString().slice(0, 10) + "-" + Math.random().toString(36).slice(2, 6);
    const dir = path.join(RUNS_DIR, id);
    fs.mkdirSync(dir, { recursive: true });
    const traj = { evt, at: new Date().toISOString(), playbook: fs.existsSync(PLAYBOOK) ? fs.readFileSync(PLAYBOOK, "utf8").slice(0, 2000) : "" };
    fs.writeFileSync(path.join(dir, "trajectory.jsonl"), JSON.stringify(traj) + "\n");
    // Fire-and-forget: log hint to run judge after (don't block)
    pi.injectContext(`<hint>Run judge: npx tsx sensors/judge.ts ${dir} — then npm run sleep if FAIL repeats</hint>`);
  });
}

export default { activate };
