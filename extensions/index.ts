/**
 * Minimal pi extension — outer harness hooks.
 * Pi loads this via: pi --extension extensions/index.ts
 * Keep it tiny and file-backed for learning.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const PLAYBOOK = path.join(process.cwd(), "memory", "playbook.md");
const VECTORS = path.join(process.cwd(), "memory", "vectors.json");
const RUNS_DIR = path.join(process.cwd(), "runs");

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

function recallTopK(query: string, k = 3): string[] {
  // Synchronous vector recall — uses vectors.json if exists, else falls back to keyword on playbook.md
  try {
    if (fs.existsSync(VECTORS)) {
      const entries: any[] = JSON.parse(fs.readFileSync(VECTORS, "utf8"));
      if (entries[0]?.vector) {
        // vectors exist but we don't have query vector without fastembed (async) — fallback to FTS for sync hook
        // Do FTS here for speed; async fastembed recall is available via `npm run vector:recall`
      }
    }
    // FTS fallback: keyword overlap on playbook bullets
    if (!fs.existsSync(PLAYBOOK)) return [];
    const lines = fs.readFileSync(PLAYBOOK, "utf8").split("\n").filter((l) => l.startsWith("- "));
    const q = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
    const scored = lines.map((line) => {
      const lower = line.toLowerCase();
      const score = q.filter((w) => lower.includes(w)).length;
      // boost if query mentions POST/PUT/items
      let boost = 0;
      if (query.toLowerCase().includes("post") && lower.includes("post")) boost += 2;
      if (query.toLowerCase().includes("put") && lower.includes("put")) boost += 2;
      if (query.toLowerCase().includes("pydantic") && lower.includes("pydantic")) boost += 2;
      return { line, score: score + boost };
    }).sort((a, b) => b.score - a.score);
    // Return top-k with score >0, else top 2
    const top = scored.filter((s) => s.score > 0).slice(0, k).map((s) => s.line);
    return top.length > 0 ? top : scored.slice(0, 2).map((s) => s.line);
  } catch { return []; }
}

export default function (pi: ExtensionAPI) {
  // Gate 1: input handler for on-demand skills via $ (Chasen: rules resident, capabilities on-demand)
  pi.on("input", async (event: any, _ctx) => {
    const text: string = event.text ?? "";
    if (!text.trim().startsWith("$")) return;
    const match = text.trim().match(/^\$([a-z0-9_-]+)\b(.*)/i);
    if (!match) return;
    const skill = match[1];
    const rest = (match[2] ?? "").trim();
    const skillPath = path.join(process.cwd(), "skills", skill, "SKILL.md");
    if (!fs.existsSync(skillPath)) {
      console.log(`[harness] $ skill not found: ${skill}`);
      return { action: "handled" as const };
    }
    const content = fs.readFileSync(skillPath, "utf8").slice(0, 4000);
    const transformed = `[Skill: ${skill}]\n${content}\n\n[User request]\n${rest || "(no extra prompt)"}`;
    console.log(`[harness] $ loaded skill ${skill} (${content.length} chars)`);
    return { action: "transform" as const, text: transformed };
  });

  // Feedforward: inject playbook at session start (thin — only log length, not full content, Gate 1)
  pi.on("session_start", async (_event, _ctx) => {
    if (fs.existsSync(PLAYBOOK)) {
      const playbook = fs.readFileSync(PLAYBOOK, "utf8");
      console.log(`[harness] playbook thin: ${playbook.length} chars, will inject top 3 via vector on before_agent_start`);
    }
  });

  // Vector recall: inject relevant playbook bullets before each agent turn (semantic, not whole file)
  pi.on("before_agent_start", async (event: any, _ctx) => {
    const prompt: string = event.prompt ?? event.text ?? "";
    if (!prompt) return;
    const top = recallTopK(prompt, 3);
    if (top.length === 0) return;
    const injected = `\n\n[playbook recall for: "${prompt.slice(0, 80)}"]\n${top.join("\n")}\n`;
    // Return systemPrompt augmentation — pi chains these
    return { systemPrompt: (event.systemPrompt ?? "") + injected };
  });

  // Gate 2: Tool output filtered before Context (Chasen: sandbox + summary)
  // Large bash/read/grep/find/ls outputs (>10KB) are saved to runs/<id>/tool-output/ and only summary enters Context
  pi.on("tool_execution_end", async (event: any, ctx) => {
    const toolName: string = event.toolName ?? event.name ?? "";
    const result: any = event.result ?? {};
    const text: string = (() => {
      try {
        const c = result.content;
        if (Array.isArray(c)) return c.map((x: any) => x.text ?? "").join("\n");
        if (typeof c === "string") return c;
        return JSON.stringify(c).slice(0, 20000);
      } catch { return ""; }
    })();
    const largeTools = new Set(["bash", "powershell", "read", "grep", "find", "ls"]);
    if (largeTools.has(toolName) && text.length > 10000) {
      const id = new Date().toISOString().slice(0, 10) + "-" + Math.random().toString(36).slice(2, 6);
      const dir = path.join(RUNS_DIR, `tool-output-${id}`);
      try { fs.mkdirSync(dir, { recursive: true }); } catch {}
      const outPath = path.join(dir, `${toolName}-${Date.now()}.txt`);
      try { fs.writeFileSync(outPath, text, "utf8"); } catch {}
      const summary = text.slice(0, 2000) + `\n\n[truncated ${text.length} chars → saved to ${outPath}, ${Math.ceil(text.length/4000)}k tokens saved. Use read with line range for details.]`;
      console.log(`[harness Gate2] ${toolName} large output ${text.length} chars → sandboxed to ${outPath}, Context gets summary (${summary.length} chars)`);
      // Try to mutate result content to summary so Context stays thin — if immutable, at least log
      try {
        if (Array.isArray(result.content) && result.content[0]) result.content[0].text = summary;
      } catch {}
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

  // Gate 3: Long tasks split — subagents + auto-compact
  // Register subagent tool: scout/worker/reviewer in isolated Context, parent only gets result
  try {
    pi.registerTool({
      name: "subagent",
      label: "Subagent",
      description: "Spawn isolated sub-agent (scout/worker/reviewer) — parent only gets result, not history (Gate 3)",
      parameters: Type.Object({
        role: Type.String({ description: "scout (read-only grep), worker (writes), reviewer (judge)" }),
        task: Type.String({ description: "task for sub-agent, e.g. 'scout src for FastAPI routes'" }),
      }),
      async execute(_id: string, params: any) {
        const role = params.role ?? "worker";
        const task = params.task ?? "";
        console.log(`[harness Gate3] subagent ${role}: ${task.slice(0, 80)}`);
        return {
          content: [{ type: "text", text: `[subagent ${role} queued: ${task.slice(0, 100)} — in full harness-pi this spawns isolated Context, parent only gets result]` }],
          details: { role, task },
        };
      },
    });
  } catch (e) { console.log(`[harness Gate3] subagent tool register failed: ${e}`); }

  // Auto-compact as last insurance: when context near limit, trim history
  pi.on("session_shutdown", async (_event, _ctx) => {
    // This is also Gate 3 insurance — actual auto-compact would hook onContextOverflow
    // We log that it would run
    console.log(`[harness Gate3] auto-compact check: would trim if near limit (like harness-pi autoCompaction)`);
  });

  // Gate 4: Rework as cost — pi-ask when goal/file/acceptance unclear
  pi.on("before_agent_start", async (event: any, ctx) => {
    const prompt: string = event.prompt ?? "";
    const hasFile = /src\/|\.py|\.ts|\.md|tasks\//i.test(prompt);
    const hasTest = /test|verifier|acceptance|PASS/i.test(prompt);
    const isVague = prompt.trim().length < 20 || (!hasFile && !hasTest);
    // Don't block skill loads ($...) or explicit tasks
    if (isVague && !prompt.trim().startsWith("$") && !prompt.includes("tasks/")) {
      console.log(`[harness Gate4] pi-ask: vague prompt "${prompt.slice(0, 60)}" — would ask for file/acceptance, not burn Context`);
      // In interactive mode, we could prompt via ctx.ui.confirm — in print mode, just inject ask
      // For now, inject ask as system prompt addition
      const ask = `\n\n[pi-ask Gate4] Goal/file/acceptance unclear. Ask first: What file? What should tests assert? Don't code yet.\n`;
      return { systemPrompt: (event.systemPrompt ?? "") + ask };
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
