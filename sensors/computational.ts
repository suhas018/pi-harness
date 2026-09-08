/**
 * sensors/computational.ts — fast deterministic checks
 * Run: npx tsx sensors/computational.ts [file]
 * Pi calls this after every Write (extensions/index.ts)
 */
import { spawnSync } from "node:child_process";

const file = process.argv[2];
console.log(`[sensor] checking ${file ?? "all"}`);

// Placeholder — wire real tools as you add Python code:
// - ruff check <file> --output-format concise
// - mypy <file>
// - pytest -q

// Example: run ruff if available, otherwise pass
const ruff = spawnSync("ruff", ["check", file ?? "."], { encoding: "utf8" });
if (ruff.error) {
  console.log("[sensor] ruff not installed — skipping (install with: pip install ruff)");
  process.exit(0);
}
console.log(ruff.stdout);
process.exit(ruff.status ?? 0);
