# Skill: python-conventions

> Inferential guide — feedforward. Pi reads this before coding.

## When to use
Any Python/FastAPI task.

## Rules
- FastAPI + Pydantic v2, `src/` layout, `tests/test_*.py` with pytest
- One file = one concern, <200 lines
- Type hints + ruff formatting (line 100)
- Every endpoint needs a test; no `any` without reason

## Check
After Write, `sensors/computational.ts` will verify. If it fails, fix before next step.
