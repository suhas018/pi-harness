/**
 * sensors/judge.ts — inferential sensor (LLM-as-judge)
 * Expensive, run after task, not every Write.
 * Run: npx tsx sensors/judge.ts runs/<id>
 */
console.log("[judge] TODO: call pi-ai with prompt: review diff + tests for duplicate/over-engineering");
// Keep outside the loop — verifier must be independent (no reward hacking)
