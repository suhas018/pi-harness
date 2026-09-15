/**
 * sensors/run-eval.ts — eval harness runner (Weng: file-system as memory + verifier outside loop)
 * Runs tasks/*.yaml verifiers, scores, writes runs/<id>/report.md + report.json
 * Usage: npm run eval  or  npx tsx sensors/run-eval.ts [--tasks sample-01]
 * Keeps verifier independent — no LLM, just deterministic checks (Fowler computational sensor)
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const TASKS_DIR = path.join(process.cwd(), "tasks");
const RUNS_DIR = path.join(process.cwd(), "runs");

function parseYamlSimple(text: string): any {
  // Minimal YAML parser for our task files (id, goal, files, verifier, notes)
  const lines = text.split("\n");
  const out: any = { verifier: [], files: [] };
  let currentKey = "";
  let inList = false;
  let listKey = "";
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      const val = kv[2].trim();
      // If previous was list and new key starts, close list
      if (inList && key !== listKey && val !== "") {
        inList = false;
        listKey = "";
      }
      currentKey = key;
      if (val === "") {
        // Start of list (files: or verifier: on its own line)
        out[currentKey] = out[currentKey] ?? [];
        inList = true;
        listKey = currentKey;
      } else {
        if (inList && currentKey !== listKey) {
          inList = false;
          listKey = "";
        }
        out[currentKey] = val;
        // verifier with inline value not expected, but handle
        if (currentKey === "verifier" && val) {
          out.verifier = [val];
          inList = true;
          listKey = "verifier";
        }
      }
      continue;
    }
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && inList) {
      out[listKey].push(item[1].trim());
    }
  }
  return out;
}

function runCommand(cmd: string): { ok: boolean; out: string; code: number | null } {
  // Normalize for broken py launcher + ensure src on PYTHONPATH via python -m
  let finalCmd = cmd;
  if (cmd.startsWith("python ")) finalCmd = cmd.replace(/^python /, "uv run --with fastapi --with httpx -- python ");
  if (cmd.startsWith("pytest")) {
    // Use python -m pytest so src/ is found (pytest script loses cwd)
    finalCmd = cmd.replace(/^pytest/, "uv run --with fastapi --with httpx --with pytest -- python -m pytest");
  }
  const isWin = process.platform === "win32";
  const shell = isWin ? "powershell.exe" : "bash";
  const args = isWin ? ["-Command", finalCmd] : ["-c", finalCmd];
  const r = spawnSync(shell, args, { encoding: "utf8", timeout: 30000 });
  const out = (r.stdout ?? "") + (r.stderr ?? "");
  return { ok: r.status === 0, out: out.slice(0, 4000), code: r.status };
}

function main() {
  const filter = process.argv[2]?.startsWith("--tasks") ? process.argv[3] : process.argv[2];
  const files = fs.readdirSync(TASKS_DIR).filter((f) => f.endsWith(".yaml")).sort();
  const selected = filter ? files.filter((f) => f.includes(filter)) : files;

  console.log(`[eval] tasks: ${selected.join(", ")}`);
  const results: any[] = [];
  let passed = 0;

  for (const file of selected) {
    const yaml = fs.readFileSync(path.join(TASKS_DIR, file), "utf8");
    const task = parseYamlSimple(yaml);
    const id = task.id ?? file.replace(".yaml", "");
    console.log(`\n[eval] ${id}: ${task.goal?.slice(0, 80)}`);
    let ok = true;
    const logs: string[] = [];
    for (const cmd of task.verifier ?? []) {
      console.log(`  $ ${cmd}`);
      const r = runCommand(cmd);
      logs.push(`$ ${cmd}\n${r.out.slice(0, 1000)}`);
      console.log(r.out.slice(0, 500));
      if (!r.ok) {
        ok = false;
        console.log(`  → FAIL (${r.code})`);
        break;
      } else console.log(`  → ok`);
    }
    // Inferential sensor: auto-run judge on FAIL (outside generation loop, Weng)
    let judgeOut = "";
    if (!ok) {
      const target = task.files?.[0] ?? "src/app.py";
      const isWin = process.platform === "win32";
      const shell = isWin ? "powershell.exe" : "bash";
      const cmd = `npx tsx sensors/judge.ts ${target}`;
      const r = spawnSync(shell, isWin ? ["-Command", cmd] : ["-c", cmd], { encoding: "utf8", timeout: 35000 });
      judgeOut = ((r.stdout ?? "") + (r.stderr ?? "")).slice(0, 2000);
      console.log(`  [judge] ${judgeOut.slice(0, 300)}`);
      logs.push(`\n[judge] ${judgeOut.slice(0, 1000)}`);
    }
    if (ok) passed++;
    results.push({ id, goal: task.goal, ok, logs, judge: judgeOut.slice(0, 500) });
  }

  const id = new Date().toISOString().slice(0, 10) + "-" + Math.random().toString(36).slice(2, 6);
  const dir = path.join(RUNS_DIR, `eval-${id}`);
  fs.mkdirSync(dir, { recursive: true });
  const report = {
    at: new Date().toISOString(),
    total: results.length,
    passed,
    failed: results.length - passed,
    score: `${passed}/${results.length}`,
    results,
  };
  fs.writeFileSync(path.join(dir, "report.json"), JSON.stringify(report, null, 2), "utf8");
  const md = `# Eval ${id} — ${new Date().toISOString().slice(0, 10)}\n\n**Score: ${passed}/${results.length}**\n\n` +
    results.map((r) => `## ${r.id} — ${r.ok ? "PASS" : "FAIL"}\n${r.goal}\n\n\`\`\`\n${r.logs.join("\n")}\n\`\`\`\n`).join("\n");
  fs.writeFileSync(path.join(dir, "report.md"), md, "utf8");
  console.log(`\n[eval] ${passed}/${results.length} passed — report at ${dir}/report.md`);
  console.log(md.slice(0, 2000));
  process.exit(passed === results.length ? 0 : 1);
}

main();
