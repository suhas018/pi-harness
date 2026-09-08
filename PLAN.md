# Harness Project — Plan

> Goal: Build a harness you understand end-to-end. Learn, not just use.

## Why this stack

- **Base: minimal `earendil-works/pi` (TS)** — 4 tools only: Read, Write, Edit, Bash. Small enough to read fully, you build the rest.
- **Not OMP for v1** — OMP has 31 tools + LSP + DAP + 80k Rust. Powerful but hides learning. We’ll use OMP later (week 5) just to compare Hashline vs vanilla edit.
- **Language:** TS for pi extensions (required). You said any language ok. Python outer harness optional later, but v1 stays TS-native so you stay close to pi.
- **Memory: pure files** — no SQLite. All state in files you can `cat` and `git diff`. Easy to debug and explain in interviews.

## What a harness is (simple)

Think of it like this:
- **Inner loop** = pi (calls LLM, uses tools, edits files)
- **Outer harness** = your code around pi that makes it better:

```
Your Guides (before) → pi tries → Your Sensors (after) → fix loop → save learning to files
```

From the two articles:
- **Guides** = instructions to prevent mistakes (AGENTS.md, Skills)
- **Sensors** = checks to catch mistakes (linters, tests, LLM judge)
- **Memory** = files, not chat context (so it works across long tasks)

## Architecture

```
skills/ + AGENTS.md  ──┐
                       ▼
                 pi Agent Loop ──→  Sensors ──┐
                       │          (lint/test/judge) │
                       ▼                            │
            runs/<id>/trajectory.jsonl              │
            memory/playbook.md  ←── Curator ←───────┘
                       │
                 evals (prove it works)
```

- **Inner:** pi stays untouched
- **Outer:** your extensions hook at the tool boundary (before/after each Write/Bash)
- **Memory:** `runs/` (what happened) + `memory/playbook.md` (what we learned)
- **Evals:** verifier lives OUTSIDE the loop (so agent can’t cheat)

## Memory — pure files

Two layers, both files:

1.  **Episodic:** `runs/<id>/trajectory.jsonl` + `logs/` + `diffs/` — raw history, one file per run
2.  **Semantic:** `memory/playbook.md` — bullet list with `id: description` (e.g., `py-001: always run ruff before commit`)

**Loop:** Run task → Reflector finds patterns in failures → Curator adds/updates bullets (item by item, not rewriting whole file) → next run uses updated playbook.

Start with no embeddings. Just keyword search over files. Add `fastembed` later only if needed.

## Skills (2 starters)

Each skill = folder `skills/<name>/SKILL.md + tools.ts`

1.  `python-conventions` — guide: how to write FastAPI + pytest code
2.  `review-sensor` — sensor: fast lint + LLM judge after each Write

Skills are versioned and can be shared as pi packages via npm/git.

## Sensors

- **Fast & cheap (every Write):** ruff, mypy, pytest — deterministic
- **Slow & smart (after run):** LLM-as-judge — checks style, redundancy, over-engineering

Every repeated failure → promote to a new Guide rule. That’s the steering loop.

## Evals — prove harness > model

- **Weeks 2-4:** Custom 10-task suite `tasks/*.yaml` (each: prompt + expected + verifier script). Cheap, fast iteration. Split held-in / held-out to catch regressions.
- **Week 5-6:** Optional `pi-metaharness` (`:4700` dashboard) on WSL+Docker. Run `edit` benchmark to compare vanilla edit vs Hashline. You have WSL+Docker, so this is possible but not required for v1.

Success = same model scores higher with your harness than vanilla pi, with traces to show it.

## Timeline (4-6 weeks)

**Week 1 — Setup**
- Install pi in WSL: `npm i -g @earendil-works/pi-coding-agent`, run `pi`, test `/login` for hybrid models
- Create `C:/Users/suhas/PROJECTS/harness` structure, 1 baseline run → `runs/`

**Week 2 — Memory**
- File read/write helpers + `sleep` script: Reflector → Curator → `playbook.md`
- Prove memory survives across sessions (recall without stuffing context)

**Week 3 — Skills + Sensors**
- Build 2 skills, hook linter sensor on Write, judge sensor after run

**Week 4 — Evals**
- Build 10-task YAML suite + runner, show vanilla < harness

**Week 5 — Self-improve**
- Loop: find weakness → propose tiny edit → test held-in/out → keep if no regression
- Stretch: swap Hashline edit, measure lift (that 6.7% → 68.3% story)

**Week 6 — Polish**
- Dashboard traces, README with Fowler/Weng map, publish pi package, demo video

## Risks & how we avoid them

- **Pi moves fast:** pin version in `package.json` (`save-exact=true`)
- **Windows quirks:** do all pi runs in WSL; Harbor needs Docker but we delay it to week 5 (custom suite works without Docker)
- **Two memories drifting:** we only have files — single source of truth
- **Reward hacking:** verifier never inside agent loop

## Folder we’ll create

```
harness/
  PLAN.md                # this file
  extensions/            # TS hook at pi tool boundary
  skills/<name>/         # SKILL.md + tools
  memory/playbook.md     # learned bullets
  memory/short.json      # current session
  runs/<id>/             # trajectories
  sensors/               # linters + judge
  tasks/*.yaml           # eval tasks
```

## Next step

Say “scaffold week 1” and I’ll create the folders + minimal `extensions/` + `playbook.md` + 1 sample task.

---
*Teams review this plan before building. Edit this file as we learn.*
