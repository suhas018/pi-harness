# Harness

Minimal pi outer harness for learning.

See `PLAN.md` for the full plan (human-readable).

## Quick start (WSL)

```bash
npm install
npx pi "implement tasks/sample-01.yaml"  # pi reads AGENTS.md + skills + playbook.md
npm run sleep   # Reflector → Curator → playbook.md
```

## How it maps

- **Guides:** `AGENTS.md`, `skills/*/SKILL.md`, `memory/playbook.md`
- **Sensors:** `sensors/computational.ts` (fast), `sensors/judge.ts` (slow)
- **Memory:** `runs/` + `memory/` (files only)

Edit `PLAN.md` as we learn.
