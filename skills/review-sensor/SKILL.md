# Skill: review-sensor

> Inferential sensor — feedback. Run after each task.

## How to review
1. Run `sensors/computational.ts` (deterministic)
2. Then LLM self-review:
   - duplicate code? over-engineering? missing tests?
   - brute-force fix vs proper fix?
3. If red, self-correct before human sees (Fowler sensor loop)

## Output
- `PASS` + 1 grounded sentence, or
- `FAIL: <reason> + fix hint` (optimized for LLM consumption)
