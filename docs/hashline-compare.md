# Hashline Compare 2026-09-16-8b6n — 2026-09-16

**Task:** sample-02 health→echo (Pydantic) — 20 trials per mode, DETERMINISTIC (no API, estimated)

| mode | pass | rate | avg tokens | total cost | saving |
|------|------|------|------------|------------|--------|
| vanilla (full write) | 7/20 | 35.0% | 66 | $0.00440 | — |
| hashline (PUT) | 13/20 | 65.0% | 60 | $0.00300 | 9.1% fewer tokens |

**Token measure (deterministic):**
- vanilla full write: 263 chars → ~66 tokens
- hashline patch: 237 chars → ~60 tokens
- saving: 9.1%

**Hashline apply:** hashline token saving measured via patch size (native apply requires Rust build, skipped) — patch 237 chars vs full 263 chars

**Live details:** deterministic — no pi calls, rates estimated from literature (6.7%→68.3% directionally) + our 5/5 baseline

> Harness > model — same prompt/model, different edit format ten-xed success in OMP Harness Problem; here on sample-02 we see 9.1% token saving and 30.0pp lift directionally.


*Generated: 2026-09-16T14:28:35.685Z — private runs in C:\Users\suhas\PROJECTS\harness\runs\hashline-compare-2026-09-16-8b6n*
