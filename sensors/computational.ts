/**
 * sensors/computational.ts — fast deterministic checks (Fowler: computational sensor)
 * Run: npx tsx sensors/computational.ts [file]
 * Pi calls this after every Write (extensions/index.ts:24)
 * Tries `ruff` directly, then `uv run --with ruff` fallback (for broken py launcher).
 */
import { spawnSync } from "node:child_process";

const file = process.argv[2] ?? ".";
console.log(`[sensor] checking ${file}`);

function runRuff(target: string) {
  // Try direct ruff (in PATH via pip)
  let r = spawnSync("ruff", ["check", target, "--output-format", "concise"], { encoding: "utf8" });
  if (!r.error) return r;
  // Fallback via uv (always works on this machine)
  console.log("[sensor] ruff not in PATH, trying uv run...");
  r = spawnSync("uv", ["run", "--with", "ruff", "--", "ruff", "check", target, "--output-format", "concise"], { encoding: "utf8" });
  return r;
}

const ruff = runRuff(file);
if (ruff.error) {
  console.log("[sensor] ruff unavailable — skipping");
  console.log(ruff.error.message);
  process.exit(0); // don't block — Fowler: sensor should not fail closed for missing tool
}
if (ruff.stdout) console.log(ruff.stdout.trim());
if (ruff.stderr) console.error(ruff.stderr.trim());

// Exit 0 = PASS, non-zero = FAIL (LLM should self-correct)
process.exit(ruff.status ?? 0);
