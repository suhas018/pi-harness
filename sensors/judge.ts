/**
 * sensors/judge.ts — inferential sensor (LLM-as-judge) via local Ollama
 * Expensive, run after task — not every Write.
 * Usage:
 *   npx tsx sensors/judge.ts src/app.py
 *   npx tsx sensors/judge.ts runs/2026-09-08-yucz
 *   npm run judge -- src/app.py
 *
 * Uses qwen2.5-coder:7b via Ollama OpenAI-compat (http://localhost:11434/v1).
 * Falls back to heuristic if Ollama not running.
 * Output is LLM-optimized: `PASS: <1 grounded sentence>` or `FAIL: <reason> + fix hint`
 * Keep outside the loop — verifier must be independent (no reward hacking) — Weng pattern.
 */

import fs from "node:fs";
import path from "node:path";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434/v1/chat/completions";
const MODEL = process.env.JUDGE_MODEL ?? "qwen2.5-coder:7b";
const TIMEOUT_MS = 30000;

async function callOllama(prompt: string): Promise<string> {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a strict code-review judge. Be concise. Output exactly PASS or FAIL." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      stream: false,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function heuristicJudge(content: string, file: string): string {
  // Fast deterministic fallback when Ollama down
  const lines = content.split("\n");
  const checks: string[] = [];
  if (lines.length > 200) checks.push("over-engineered: file >200 lines");
  if ((content.match(/def /g) ?? []).length > 10) checks.push("too many functions for simple task");
  if (file.endsWith("app.py") && !content.includes("@app.get") && !content.includes("@app.post")) checks.push("missing FastAPI route");
  // duplicate check: same 30-char line repeated
  const seen = new Set<string>();
  let dup = 0;
  for (const l of lines) {
    const t = l.trim();
    if (t.length > 30) {
      if (seen.has(t)) dup++;
      seen.add(t);
    }
  }
  if (dup > 2) checks.push(`duplicate code: ${dup} repeated lines`);
  if (checks.length === 0) return `PASS: ${file} looks clean (${lines.length} lines, no dup/over-engineer)`;
  return `FAIL: ${checks.join("; ")} — fix hint: simplify, dedupe, keep <50 lines for sample tasks`;
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: npx tsx sensors/judge.ts <file|runs/<id>>");
    process.exit(1);
  }

  let content = "";
  let fileLabel = target;

  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    // runs/<id> — read trajectory + referenced files
    const trajPath = path.join(target, "trajectory.jsonl");
    let traj = "";
    if (fs.existsSync(trajPath)) traj = fs.readFileSync(trajPath, "utf8").slice(0, 4000);
    // also read src/app.py as representative
    const appPath = path.join(process.cwd(), "src/app.py");
    const app = fs.existsSync(appPath) ? fs.readFileSync(appPath, "utf8").slice(0, 6000) : "";
    content = `Trajectory:\n${traj}\n\nsrc/app.py:\n${app}`;
    fileLabel = target;
  } else if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    content = fs.readFileSync(target, "utf8").slice(0, 8000);
  } else {
    console.error(`[judge] not found: ${target}`);
    process.exit(1);
  }

  const prompt = `Review this file/run for the harness. Check:
- duplicate code / redundant tests
- over-engineering or brute-force fix
- missing tests / wrong abstraction
- file >200 lines for simple CRUD

File/Run: ${fileLabel}
Content:
\`\`\`
${content.slice(0, 7000)}
\`\`\`

Output exactly:
- "PASS: <1 grounded sentence>" if ok, or
- "FAIL: <reason> + fix hint" if issues. Keep fix hint LLM-consumable.`;

  try {
    console.log(`[judge] calling ${MODEL} via ${OLLAMA_URL}...`);
    const t0 = Date.now();
    const answer = await callOllama(prompt);
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`[judge] (${dt}s) ${answer.trim()}`);
    // Exit 0 on PASS, 1 on FAIL
    process.exit(answer.trim().startsWith("PASS") ? 0 : 1);
  } catch (e: any) {
    console.log(`[judge] Ollama unavailable (${e.message}), using heuristic fallback`);
    const fallback = heuristicJudge(content, fileLabel);
    console.log(`[judge] ${fallback}`);
    process.exit(fallback.startsWith("PASS") ? 0 : 1);
  }
}

main();
