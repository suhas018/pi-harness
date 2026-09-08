# AGENTS.md — Guides for pi

> Feedforward guide: read before acting. Keep edits small, verifiable, file-backed.

## Conventions
- Write plans to `memory/short.json`, not todos
- Every Write → run `sensors/computational.ts` (ruff/mypy/pytest style checks)
- Every run → append to `runs/<id>/trajectory.jsonl`
- Learnings → `memory/playbook.md` bullets with `id: description`

## How to use skills
- `skills/python-conventions/SKILL.md` — Python/FastAPI style
- `skills/review-sensor/SKILL.md` — how to self-review

## Sensors
- Fast: `sensors/computational.ts` (deterministic, every Write)
- Slow: `sensors/judge.ts` (LLM judge, after run)

If a failure repeats 2x, propose a new bullet for `playbook.md` (steering loop).
