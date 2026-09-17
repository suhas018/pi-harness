/**
 * sensors/run-edit-benchmark.ts — meta-harness edit benchmark (cheap, local, no KVM)
 * Formal wrapper around hashline compare, shaped like pi-metaharness edit benchmark.
 * Runs sample-02 health→echo edit 20 trials via vanilla vs hashline, reports like Harbor.
 * Usage: npm run edit:benchmark  or  npx tsx sensors/run-edit-benchmark.ts --trials 20
 * Output: runs/edit-benchmark-<id>/report.md + report.json (mirrors pi-metaharness experiment→run→trace)
 */
import { spawnSync } from "node:child_process";

const trials = parseInt(process.argv[process.argv.indexOf("--trials") + 1] ?? "20", 10);
const isLive = process.argv.includes("--live");
console.log(`[edit-benchmark] meta-harness edit — ${trials} trials per mode (hashline vs vanilla) — sample-02 ${isLive ? "(LIVE)" : "(deterministic)"}`);
// Delegate to hashline compare (deterministic, no API cost by default; add --live for OpenRouter)
const isWin = process.platform === "win32";
const cmd = `npx tsx sensors/run-hashline-compare.ts --trials ${trials}${isLive ? " --live" : ""}`;
const shell = isWin ? "powershell.exe" : "bash";
const args = isWin ? ["-Command", cmd] : ["-c", cmd];
const r = spawnSync(shell, args, { encoding: "utf8", timeout: 120000, stdio: "inherit", env: process.env });
process.exit(r.status ?? 0);
