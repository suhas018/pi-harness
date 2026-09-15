/**
 * Minimal pi extension — outer harness hooks.
 * Pi loads this via: pi --extension extensions/index.ts
 * Keep it tiny and file-backed for learning.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const PLAYBOOK = path.join(process.cwd(), "memory", "playbook.md");
const RUNS_DIR = path.join(process.cwd(), "runs");

export default function (pi: ExtensionAPI) {
  // Feedforward: inject playbook at session start (if available, log it)
  pi.on("session_start", async (_event, _ctx) => {
    if (fs.existsSync(PLAYBOOK)) {
      const playbook = fs.readFileSync(PLAYBOOK, "utf8").slice(0, 3000);
      // For now just log — pi doesn't have injectContext in this API, so we use notification
      // In interactive mode this shows; in print mode it's silent but proves hook ran
      console.log(`[harness] playbook loaded (${playbook.length} chars)`);
    }
  });

  // Feedback: after every write/edit tool execution, run computational sensor
  pi.on("tool_execution_end", async (event: any, _ctx) => {
    const toolName = event.toolName ?? event.name ?? "";
    const result = event.result ?? {};
    // Only for write/edit
    if (toolName !== "write" && toolName !== "edit") return;
    const file = event.args?.path ?? event.params?.path ?? "unknown";
    // Run ruff sensor (with uv fallback)
    const target = file && file !== "unknown" ? file : ".";
    let r = spawnSync("ruff", ["check", target, "--output-format", "concise"], { encoding: "utf8" });
    if (r.error) {
      r = spawnSync("uv", ["run", "--with", "ruff", "--", "ruff", "check", target, "--output-format", "concise"], { encoding: "utf8" });
    }
    const out = (r.stdout ?? "") + (r.stderr ?? "");
    if (r.status !== 0 && out.trim()) {
      console.log(`[harness sensor] FAIL for ${file}: ${out.slice(0, 500)}`);
    } else if (out.trim()) {
      console.log(`[harness sensor] ok for ${file}`);
    }
  });

  // After session ends, append trajectory (file-system memory — Weng Pattern 2)
  pi.on("session_shutdown", async (_event, ctx) => {
    try {
      const id = new Date().toISOString().slice(0, 10) + "-" + Math.random().toString(36).slice(2, 6);
      const dir = path.join(RUNS_DIR, id);
      fs.mkdirSync(dir, { recursive: true });
      // Try to get last entries for trajectory
      let entries: any[] = [];
      try { entries = (ctx as any).sessionManager?.getEntries?.() ?? []; } catch {}
      const traj = { at: new Date().toISOString(), entries: entries.slice(-5), playbookExists: fs.existsSync(PLAYBOOK) };
      fs.writeFileSync(path.join(dir, "trajectory.jsonl"), JSON.stringify(traj) + "\n");
      console.log(`[harness] trajectory logged to ${dir}/trajectory.jsonl`);
    } catch (e) {
      console.log(`[harness] trajectory log failed: ${e}`);
    }
  });
}
