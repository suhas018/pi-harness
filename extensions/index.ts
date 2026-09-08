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

  // Feedback: after every Write, run computational sensor
  pi.on("tool:write:after", async (evt: any) => {
    const { spawnSync } = await import("node:child_process");
    const res = spawnSync("npx", ["tsx", "sensors/computational.ts", evt.file], { encoding: "utf8" });
    if (res.status !== 0) {
      // feed sensor output back as LLM-consumable signal (Fowler: sensor optimized for LLM)
      pi.injectContext(`<sensor type="computational" file="${evt.file}">\n${res.stdout}\nFix this before continuing.\n</sensor>`);
      return { block: false }; // don't block, let LLM self-correct
    }
  });

  // After run, append to trajectory (file-system as memory — Weng Pattern 2)
  pi.on("run:end", async (evt: any) => {
    const id = new Date().toISOString().slice(0, 10) + "-" + Math.random().toString(36).slice(2, 6);
    const dir = path.join(RUNS_DIR, id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "trajectory.jsonl"), JSON.stringify({ evt, at: new Date().toISOString() }) + "\n");
  });
}

export default { activate };
