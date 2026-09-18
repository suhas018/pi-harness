# Skill: search-fff

> Gate 2: Tool output filtered before Context — search via FFF (frecency + pagination)

## When to use
For any repo search (grep, find, read large files). Don't dump whole repo into Context.

## How it works (Chasen gate 2)
- Uses persistent index + frecency (frequency + recency) + pagination, not `grep -r` whole codebase.
- Returns `5` hits per page with `hit locations`, not raw output.
- Large outputs (>10KB) are sandboxed: full text saved to `runs/<id>/tool-output/<toolCallId>.txt`, Context gets summary.

## For the agent
- Use `grep` with `limit 5` and `glob` filter, not unfiltered `grep "pattern"`
- If you need big file, read 20 lines + hit location, then pull full from sandbox if needed
- Example: `grep " FastAPI " --glob "src/*.py" --limit 5` → 5 hits with file:line, not 200KB dump

## Fallback if @ff-labs/pi-fff not installed
Emulated via `grep` + `git log --follow --format=%ad` frecency sort + `limit` — same effect, no extra dep.
