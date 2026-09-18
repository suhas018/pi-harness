# Skill: pi-ask

> Gate 4: Rework as Context cost — pause when unclear

## When to use
Before any `write/edit` if goal, file, or acceptance is vague.

## Rule
If prompt has no explicit `file` AND no `tests/` acceptance, don't code — ask first:
- What file?
- What should test assert?
- What is done?

This saves Context burn on failed rework (Chasen: rework is Context cost).

## Example
User: "add feature"
→ Ask: "Which file? What should `tests/test_*.py` assert for PASS?"

User: "Read tasks/sample-02.yaml and implement it"
→ Don't ask — file + verifier are explicit, proceed.
