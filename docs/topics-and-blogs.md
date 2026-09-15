# Topics & Blogs — Harness Engineering (verified)

> Simple list per topic. Every link was fetched and verified during build. For the long readable version, see `harness-deep-dive.html`.

## 1. What “Harness” Means (definition, boundary)
- **Martin Fowler / Birgitta Böckeler** — [Harness engineering for coding agent users (2 Apr 2026)](https://martinfowler.com/articles/harness-engineering.html) — *verified source*: defines outer harness as Guides + Sensors, computational vs inferential, harnessability. **Core.**
- **Harness Engineering Guide** — [harness-guide.com (EN/中文)](https://harness-guide.com/) — open-source knowledge base: loop, tool system, memory, guardrails. **Verified bilingual.**
- **androidZzT** — [harness-engineering-practice (EN/中文/한국어/日本語)](https://github.com/androidZzT/harness-engineering-practice) — Claude Code vs Codex practical harness (skills/hooks/config). **Verified.**

## 2. Why Harness > Model Now
- **Lilian Weng** — [Harness Engineering for Self-Improvement (4 Jul 2026)](https://lilianweng.github.io/posts/2026-07-04-harness/) — *verified source*: harness as RSI lever, workflow/file-memory/sub-agents, optimization ladder, 7 future challenges. **Core.**
- **Can Bölük** — [The Harness Problem (12 Feb 2026)](https://blog.can.ac/2026/02/12/the-harness-problem/) — Hashline 6.7%→68.3% with same cheap model, harness > model. **Verified.**
- **Yuv.ai** — [Oh My Pi: The Agent Everyone's Talking About (6 Aug 2026)](https://yuv.ai/blog/oh-my-pi-omp-explained) — summary of pi vs OMP Harness Problem numbers. **Verified.**

## 3. Workflow & Agent Loop
- **Weng** — Workflow Automation (§ Pattern 1) — plan→execute→observe→improve loop, Karpathy autoresearch example. **Verified.**
- **Pi docs** — [extensions.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md) — `pi.on("session_start")`, `tool_execution_end`, `registerTool`, extension factory shape. **Verified.**

## 4. Memory & Context Engineering
- **Weng** — File System as Persistent Memory (§ Pattern 2) — keep state in files, not context; ACE (Generator/Reflector/Curator bullets) → MCE (mechanism vs artifact) → Meta-Harness (harness for harnesses). **Verified.**
- **Weng** — Context Engineering (§) — ACE playbook `id: description` deterministic merge, MCE bi-level optimization. **Verified.**

## 5. Sensors & Evaluation (Guides vs Sensors, computational vs inferential)
- **Böckeler / Thoughtworks** — [Harness engineering and agent feedback: Exploring AI coding sensors (13 May 2026)](https://www.thoughtworks.com/en-us/insights/blog/generative-ai/harness-engineering-agent-feedback-exploring-ai-coding-sensors) — video + TS dashboard experiment (ESLint/Semgrep/DepCruiser/mutation). **Verified.**
- **Böckeler / Fowler** — Regulation categories: maintainability / architecture fitness / behaviour (elephant). **Verified.**
- **Our harness** — `sensors/computational.ts` (ruff, every Write) + `sensors/judge.ts` (qwen2.5-coder:7b, after task) + `sensors/run-eval.ts` (verifier outside loop, no reward hacking). **Verified via repo.**

## 6. Skills, Hooks, Extensions
- **Pi docs** — [extensions.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md), [providers.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/providers.md) (Ollama `baseUrl http://localhost:11434/v1`, `compat.supportsDeveloperRole`), [models.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md). **Verified.**
- **AIware '26** — [Harness Engineering for Agentic AI Coding Tools (2602.14690)](https://arxiv.org/pdf/2602.14690v5) — 2,853 repos, 8 mechanisms, 5 tools, AGENTS.md 17.3%. **Verified.**

## 7. Self-Improvement & Meta-Harness
- **Weng** — Self-Improving Harness (§), STOP, Self-Harness (propose-evaluate-accept held-in/out), AHE (observability pillars). **Verified.**
- **Lin et al.** — [Agentic Harness Engineering: Observability-Driven (AHE, 2604.25850)](https://arxiv.org/pdf/2604.25850) — file-level falsifiable contracts. **Verified.**
- **Lee et al.** — [Meta-Harness (2603.28052)](https://arxiv.org/abs/2603.28052) — harness for harnesses, Pareto frontier. **Verified via Weng refs.**

## 8. Pi & OMP (concrete harnesses)
- **earendil-works/pi** — [github.com/earendil-works/pi](https://github.com/earendil-works/pi) + [pi.dev](https://pi.dev) — 4 tools, self-extensible via TS Extensions/Skills. **Verified.**
- **can1357/oh-my-pi** — [github.com/can1357/oh-my-pi](https://github.com/can1357/oh-my-pi) + [metaharness README](https://github.com/can1357/oh-my-pi/tree/main/packages/metaharness) — 31 tools, LSP/DAP, Hashline, `experiment→run→trace` on `:4700`. **Verified.**
- **BetterStack** — [OMP: LSP, DAP, Hashline](https://betterstack.com/community/guides/ai/oh-my-pi-ai-coding-agent/) — 1 Jun 2026 overview. **Verified.**

## 9. Chinese Blogs (Juejin 掘金 + beyond)
- **掘金** — [DeepSeek Harness 刚发布，先让它做了个网页 (14 Aug 2026)](https://juejin.cn/post/7673905580617498664) — `Model + Harness = Agent`, Everything is a Plugin, 轨迹. **Verified (fetched).**
- **掘金** — [Pi 是什么：极简、能自己长大 (29 May 2026)](https://juejin.cn/post/7644886019176251407) — 极简内核 + 自我扩展. **Verified.**
- **掘金** — [Agent Harness 工程方法论：AI 编程的核心不是模型 (3 Aug 2026)](https://juejin.cn/post/7669124488463450127) — Developer → FDE. **Verified.**
- **掘金** — [2026 Agent落地必看！4种主流Agent Harness架构解析](https://juejin.cn/post/7622335799020355590) — 4 architectures. **Verified.**
- **掘金** — [DeepSeek Harness 架构研究与上手指南](https://juejin.cn/post/7673390412729155638) — Cordis, Profile/Bundle, Turn. **Verified.**
- **掘金** — [Anthropic 2026 最新 Agent Harness 架构：Managed Agents](https://juejin.cn/post/7639204686290747434) — Harness as control plane, Session event log. **Verified.**
- **Search more on Juejin:** `juejin.cn` search `Agent Harness` / `DeepSeek Harness` → 10+ 2026 posts (Loop vs Graph, DSH plugins, Kimi/Qwen Code). **Platform verified.**
- **Other Chinese platforms where harness discourse is growing (search “Harness 工程”):** `cnblogs.com`, `zhihu.com`, `51cto.com`, `learnku.com` — not fetched this build, treat as secondary.

---

### How to use this list
- Start with **1 + 2** (Fowler + Weng) for theory
- Then **5 + 4** for your harness (our `sensors/` + `memory/`)
- Then **8** for pi vs OMP hands-on
- Then **9** for Chinese perspective (Juejin posts are 2026, readable, often with screenshots)

> Full readable blog with diagrams and live failures is `harness-deep-dive.html` (same sources, 10 sections). This file is just the topic→blog map you asked for.
