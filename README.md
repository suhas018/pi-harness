# pi-harness — minimal pi outer harness (file-memory + sensors) — v2.0

![eval](https://img.shields.io/badge/eval-5%2F5-brightgreen) ![sensors](https://img.shields.io/badge/sensors-ruff%20%2B%20qwen-blue) ![memory](https://img.shields.io/badge/memory-file%20%2B%20vector-orange) ![v2](https://img.shields.io/badge/v2-context--efficiency-blueviolet)

Learn harness engineering by building the outer harness around `earendil-works/pi`. **v2.0** — Context-efficiency (Chasen 4 gates): thin resident + filtered tool output + subagents + pi-ask. `v1.1` meta-harness + `v1.0` bare-bones frozen.

**Inner:** `pi` (Read/Write/Edit/Bash + 60+ providers via `pi-ai`)
**Outer:** your guides + sensors + file-memory that make the inner better.

Based on:
- **Fowler** — Guides (feedforward) + Sensors (feedback), computational vs inferential, steering loop
- **Weng** — workflow loop + file-system as memory + sub-agents, harness > model (Hashline 6.7%→68.3%)

## Quick start

```bash
# 1. Node 22+
fnm use 22.19.0
npm install

# 2. Providers — pick one
# Local (free): ollama + qwen2.5-coder:7b
ollama pull qwen2.5-coder:7b
npx pi --provider ollama --model qwen2.5-coder:7b -p "say hi"
# Cloud (cheap): OpenRouter — add key to .env (gitignored) or ~/.pi/agent/auth.json
echo "OPENROUTER_API_KEY=sk-or-..." > .env
npx pi --provider openrouter --model openai/gpt-4o-mini -p "say hi"

# 3. Run harness
npx pi --provider openrouter --model openai/gpt-4o-mini --extension extensions/index.ts -p "Read tasks/sample-01.yaml and implement it"
npm run sensor -- src/app.py          # fast: ruff via uv
npm run judge -- src/app.py           # slow: qwen2.5-coder:7b via ollama (12s)
npm run sleep                         # Reflector → Curator → memory/playbook.md
```

## What's where

- `AGENTS.md:1` — feedforward guide pi reads every run
- `skills/python-conventions/SKILL.md:1` — guide: FastAPI + pytest style
- `skills/review-sensor/SKILL.md:1` — sensor: how to review
- `extensions/index.ts:1` — hooks: `session_start` inject playbook, `tool_execution_end` run `computational.ts`, `session_shutdown` log `runs/<id>/trajectory.jsonl`
- `sensors/computational.ts:1` — fast deterministic (ruff, falls back to `uv run --with ruff`)
- `sensors/judge.ts:1` — slow inferential (qwen2.5-coder:7b via `http://localhost:11434/v1`, fallback heuristic)
- `memory/playbook.md` — private ACE bullets `id: description | source | date` (see `playbook.example.md`)
- `memory/sleep.ts:1` — Reflector → Curator (idempotent, 3 runs logged)
- `tasks/sample-0{1,2,3,4,5}.yaml:1` — evals (verifier outside loop, no reward hacking, 5/5)
- `src/app.py:1` + `tests/test_*.py:1` — sample app (health/echo/items + create/update, 6 tests pass via `uv run pytest`)
- `memory/vector.ts:1` — vector recall (fastembed BGE-small 384d) + `extensions/index.ts:1` vector `before_agent_start`
- `sensors/run-hashline-compare.ts:1` + `docs/hashline-compare.md:1` — meta-harness edit benchmark (20 trials, 9.1% token saving, 35%→65%)
- `sensors/run-harbor-subset.ts:1` — Harbor subset 20-task runner via Docker on WSL (`:4700` dashboard when Docker available)

## Demo (proven)

```bash
# 1. Sensor pass
npx tsx sensors/computational.ts src/app.py
# [sensor] All checks passed!

# 2. Judge pass (local)
npx tsx sensors/judge.ts src/app.py
# [judge] PASS: clean, concise...

# 3. Live pi write with auto sensor
npx pi --provider openrouter --model openai/gpt-4o-mini --extension extensions/index.ts -p "Create file src/live_test.py with def add(a,b): return a+b"
# [harness] playbook loaded
# [harness sensor] ok
# trajectory logged to runs/<id>/trajectory.jsonl (cost $0.00022)

# 4. Memory learns
npx tsx memory/sleep.ts
# [curator] added py-003: Use TestClient...
```

See `PLAN.md` (private) for 4-6 week plan. Private state is gitignored: `PLAN.md`, `memory/playbook.md`, `memory/vectors.json`, `runs/*/`, `.env`.
Docs: `docs/harness-deep-dive.html` (10 sections, verified) + `docs/topics-and-blogs.md` (9 topics) + `docs/hashline-compare.md` (edit benchmark).

## Why minimal pi?

`earendil-works/pi` is 4 tools (Read/Write/Edit/Bash) — small enough to read fully. You build Guides/Sensors/Memory yourself and see the steering loop. OMP (`can1357/oh-my-pi`) is powerful (LSP+DAP+Hashline) but hides learning — use it Week 5 to compare.
