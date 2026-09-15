# Skill: review-sensor

> Inferential sensor — feedback. Auto-runs after each task via `sensors/judge.ts` (qwen2.5-coder:7b local, fallback heuristic).
> Triggered by `sensors/run-eval.ts` on FAIL, and by `extensions/index.ts` hint after `run:end`.

## How to review (Fowler: sensor optimized for LLM)
1. **Fast:** `npm run sensor -- <file>` → ruff (computational, every Write)
   - If FAIL, output is `<sensor type="computational">` with fix hint — LLM self-corrects before human sees
2. **Slow:** `npm run judge -- <file|runs/<id>>` → qwen2.5-coder:7b via Ollama `http://localhost:11434/v1` (inferential, after task)
   - Checks: duplicate code, over-engineering, missing tests, brute-force fix, >200 lines
   - Falls back to heuristic if Ollama down (dup-line check, length)
3. If red, self-correct and propose new `memory/playbook.md` bullet (steering loop)

## Output (LLM-consumable)
- `PASS: <1 grounded sentence>` — e.g. `PASS: clean, 38 lines, no dup`
- `FAIL: <reason> + fix hint` — e.g. `FAIL: duplicate code 3 lines — dedupe, keep <50 lines`

## Auto-run
- `run-eval.ts` calls `judge.ts` on any FAIL and appends `judge: PASS/FAIL` to `report.md`
- `judge` is outside the generation loop — verifier stays independent (no reward hacking, Weng)

## Example
```bash
npx tsx sensors/judge.ts src/app.py
# [judge] PASS: clean, concise...

npx tsx sensors/judge.ts runs/2026-09-15-yucz
# [judge] FAIL: over-engineered — fix hint: simplify...
```
