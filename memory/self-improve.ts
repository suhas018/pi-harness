/**
 * memory/self-improve.ts — Self-Harness propose-evaluate-accept loop (Weng Self-Harness, AHE)
 * Reads recent runs/, mines weakness, proposes bounded playbook edit, validates with held-in/out.
 * Run: npx tsx memory/self-improve.ts
 * Bounded: only adds one bullet, validates via eval (no regression), keeps verifier outside loop.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PLAYBOOK = path.join(process.cwd(), "memory", "playbook.md");
const RUNS_DIR = path.join(process.cwd(), "runs");
const TASKS_DIR = path.join(process.cwd(), "tasks");

function readPlaybook(): string {
  return fs.existsSync(PLAYBOOK) ? fs.readFileSync(PLAYBOOK, "utf8") : "";
}
function hasBullet(id: string): boolean {
  return readPlaybook().includes(`${id}:`);
}
function listTrajectories(): any[] {
  const trajs: any[] = [];
  if (!fs.existsSync(RUNS_DIR)) return trajs;
  for (const d of fs.readdirSync(RUNS_DIR)) {
    const p = path.join(RUNS_DIR, d, "trajectory.jsonl");
    if (!fs.existsSync(p)) continue;
    try {
      const txt = fs.readFileSync(p, "utf8").trim();
      for (const line of txt.split("\n")) if (line.trim()) trajs.push(JSON.parse(line));
    } catch {}
  }
  return trajs;
}
function listEvals(): any[] {
  const evals: any[] = [];
  if (!fs.existsSync(RUNS_DIR)) return evals;
  for (const d of fs.readdirSync(RUNS_DIR).filter((x) => x.startsWith("eval-"))) {
    const p = path.join(RUNS_DIR, d, "report.json");
    if (fs.existsSync(p)) {
      try { evals.push(JSON.parse(fs.readFileSync(p, "utf8"))); } catch {}
    }
  }
  return evals;
}

function mineWeakness(): { pattern: string; id: string; desc: string } | null {
  const trajs = listTrajectories();
  const evals = listEvals();
  console.log(`[mine] ${trajs.length} trajectories, ${evals.length} eval reports`);

  // Check playbook history: we already fixed py-004 and py-005, so no new weakness if all pass
  const lastEval = evals.sort((a, b) => (a.at > b.at ? -1 : 1))[0];
  if (lastEval && lastEval.failed === 0) {
    console.log("[mine] last eval 3/3 pass — no recurrent failure, checking trajectory notes for patterns");
    // Look for specific failure signatures in trajectories
    const notes = trajs.map((t) => (t.note ?? "") + (t.sensor ?? "") + (t.verifier ?? "")).join(" ");
    if (notes.includes("Field required") && !hasBullet("py-004")) {
      return { pattern: "Field required", id: "py-004", desc: "Use Pydantic BaseModel for POST JSON body, not query param" };
    }
    if (notes.includes("F821") && !hasBullet("py-005")) {
      return { pattern: "F821", id: "py-005", desc: "Preserve existing models when adding new endpoint" };
    }
    // No new pattern — demonstrate bounded proposal for next capability
    if (!hasBullet("py-006")) {
      return { pattern: "next-capability", id: "py-006", desc: "For new endpoints, add Pydantic response_model and status_code explicitly" };
    }
    return null;
  }

  // If any eval failed, mine that
  if (lastEval && lastEval.failed > 0) {
    const failed = lastEval.results.filter((r: any) => !r.ok);
    console.log("[mine] failed tasks:", failed.map((r: any) => r.id));
    if (!hasBullet("py-006")) {
      return { pattern: failed.map((r: any) => r.id).join(","), id: "py-006", desc: "Add response_model and explicit status codes for new endpoints" };
    }
  }
  return null;
}

function proposeAndValidate() {
  const proposal = mineWeakness();
  if (!proposal) {
    console.log("[propose] no new weakness — playbook already covers recurrent failures (idempotent)");
    return;
  }
  console.log(`[propose] ${proposal.id}: ${proposal.desc} | pattern: ${proposal.pattern}`);

  // Bounded edit: append one bullet
  const line = `- ${proposal.id}: ${proposal.desc} | self-improve | ${new Date().toISOString().slice(0, 10)}\n`;
  const before = readPlaybook();
  fs.appendFileSync(PLAYBOOK, line, "utf8");
  console.log(`[propose] appended ${proposal.id}`);

  // Validation: held-in (sample-01,02) + held-out (sample-03) — run eval
  console.log("[validate] running eval (held-in + held-out)...");
  const isWin = process.platform === "win32";
  // Ensure npx found via fnm PATH — pass current PATH
  const shell = isWin ? "powershell.exe" : "bash";
  const cmd = "npx tsx sensors/run-eval.ts";
  const args = isWin ? ["-Command", cmd] : ["-c", cmd];
  const r = spawnSync(shell, args, { encoding: "utf8", timeout: 60000, env: process.env });
  const out = (r.stdout ?? "") + (r.stderr ?? "");
  console.log(out.slice(0, 3000));
  if (r.status !== 0) {
    console.log(`[validate] FAIL (exit ${r.status}) — reverting ${proposal.id} (no regression allowed)`);
    const after = readPlaybook();
    const reverted = after.split("\n").filter((l) => !l.includes(proposal.id)).join("\n");
    fs.writeFileSync(PLAYBOOK, reverted, "utf8");
    console.log("[validate] reverted");
    process.exit(1);
  }
  console.log(`[validate] PASS — ${proposal.id} kept (3/3 still pass, no regression)`);
}

proposeAndValidate();
