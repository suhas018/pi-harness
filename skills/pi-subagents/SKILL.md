# Skill: pi-subagents

> Gate 3: Long tasks split — isolated Contexts

## When to use
For any task >20 min or with 3+ files. Don't pollute main thread.

## Pattern (Chasen)
- `scout` — read-only: grep/find/read, no writes, isolated Context
- `worker` — writes: edit/write, isolated Context, parent only gets diff
- `reviewer` — read-only: runs sensors/judge in isolated Context, returns PASS/FAIL + evidence

Parent Agent only receives `result + artifact + verification evidence`, not full history.

Temporary questions → `pi-btw` (one-off sub-agent), not main thread.

Last insurance: `pi-auto-compact` — when Context near limit, auto-compacts history (like harness-pi `autoCompaction` + `compaction_boundary`).

## For the agent
- If task says "long", call `subagent` tool with `role: scout|worker|reviewer`
- Each sub-agent gets fresh Context, parent merges results
