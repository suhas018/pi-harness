/**
 * memory/vector.ts — vector memory over playbook + trajectories (bare-bones semantic recall)
 * Uses `fastembed` BAAI/bge-small-en-v1.5 (384d, CLS + normalized) if available, else falls back to FTS keyword.
 * Stores vectors in memory/vectors.json (gitignored, like playbook). No DB.
 * Usage:
 *   npx tsx memory/vector.ts remember "Use TestClient..."
 *   npx tsx memory/vector.ts recall "how to test POST?" 3
 *   npx tsx memory/vector.ts reindex  # re-embed playbook.md
 *
 * For portfolio: shows you can add semantic memory without vector DB.
 */
import fs from "node:fs";
import path from "node:path";

const PLAYBOOK = path.join(process.cwd(), "memory", "playbook.md");
const VECTORS = path.join(process.cwd(), "memory", "vectors.json");
const MODEL_ID = "BAAI/bge-small-en-v1.5";

type Entry = { id: string; text: string; vector?: number[]; source: string };

function loadPlaybookEntries(): Entry[] {
  if (!fs.existsSync(PLAYBOOK)) return [];
  const lines = fs.readFileSync(PLAYBOOK, "utf8").split("\n");
  const entries: Entry[] = [];
  for (const line of lines) {
    const m = line.match(/^-\s+([^:]+):\s+(.*)\s+\|\s+(.*)\s+\|\s+(.*)$/);
    if (m) {
      const id = m[1].trim();
      const desc = m[2].trim();
      const source = m[3].trim();
      entries.push({ id, text: `${id}: ${desc}`, source });
    }
  }
  return entries;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

async function getEmbedder(): Promise<any> {
  try {
    const { FlagEmbedding, EmbeddingModel } = await import("fastembed");
    // Use init() static, not constructor (private)
    const model = await FlagEmbedding.init({
      model: (EmbeddingModel as any).BGESmallENv15 ?? (EmbeddingModel as any).BGESmallEN,
      cacheDir: path.join(process.cwd(), "memory", ".cache"),
      showDownloadProgress: false,
    });
    return model;
  } catch (e: any) {
    console.log(`[vector] fastembed not available (${e.message}), using FTS fallback`);
    return null;
  }
}

async function embedTexts(embedder: any, texts: string[]): Promise<number[][]> {
  const vectors: number[][] = [];
  // FastEmbed embed() is async generator
  const gen = embedder.embed(texts, 32);
  for await (const batch of gen) {
    vectors.push(...batch);
  }
  return vectors;
}

async function reindex() {
  const entries = loadPlaybookEntries();
  console.log(`[vector] reindexing ${entries.length} bullets from playbook.md`);
  if (entries.length === 0) {
    console.log("[vector] no bullets");
    return;
  }
  const embedder = await getEmbedder();
  if (embedder) {
    const texts = entries.map((e) => e.text);
    const vectors = await embedTexts(embedder, texts);
    const withVec = entries.map((e, i) => ({ ...e, vector: vectors[i] }));
    fs.writeFileSync(VECTORS, JSON.stringify(withVec, null, 2), "utf8");
    console.log(`[vector] wrote ${withVec.length} vectors to ${VECTORS} (384d, normalized)`);
  } else {
    fs.writeFileSync(VECTORS, JSON.stringify(entries, null, 2), "utf8");
    console.log(`[vector] wrote ${entries.length} entries (FTS mode) to ${VECTORS}`);
  }
}

async function recall(query: string, k = 3) {
  if (!fs.existsSync(VECTORS)) {
    console.log("[vector] no vectors.json — run reindex first");
    return;
  }
  const entries: Entry[] = JSON.parse(fs.readFileSync(VECTORS, "utf8"));
  const embedder = await getEmbedder();
  let scored: { entry: Entry; score: number }[] = [];
  if (embedder && entries[0]?.vector) {
    const qVecs = await embedTexts(embedder, [query]);
    const qVec = qVecs[0];
    scored = entries.map((e) => ({ entry: e, score: cosine(qVec, e.vector!) })).sort((a, b) => b.score - a.score);
  } else {
    const q = query.toLowerCase().split(/\W+/);
    scored = entries.map((e) => {
      const t = e.text.toLowerCase();
      const score = q.filter((w) => w.length > 2 && t.includes(w)).length;
      return { entry: e, score };
    }).sort((a, b) => b.score - a.score);
  }
  console.log(`[vector] recall "${query}" top ${k}:`);
  for (const { entry, score } of scored.slice(0, k)) {
    console.log(`  ${score.toFixed(3)} ${entry.id}: ${entry.text.slice(0, 100)} | ${entry.source}`);
  }
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === "reindex") await reindex();
  else if (cmd === "recall") await recall(process.argv[3] ?? "", parseInt(process.argv[4] ?? "3", 10));
  else if (cmd === "remember") {
    const text = process.argv.slice(3).join(" ");
    console.log(`[vector] remember: ${text} — add to playbook.md then reindex`);
  } else {
    console.log("Usage: npx tsx memory/vector.ts <reindex|recall \"query\" [k]|remember \"text\">");
    console.log("  reindex: embed playbook.md -> vectors.json");
    console.log("  recall: semantic search over bullets");
  }
}

main();
