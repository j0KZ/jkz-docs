---
title: Mutation testing
description: How jkz measures whether its test suite catches real regressions — what mutation testing is, how to run it locally with Stryker, where the reports land, the current per-module scores, and how to read killed-versus-survived results.
---

Line coverage tells you which code ran during the tests. It says nothing about whether the tests would *notice* if that code started behaving differently. Mutation testing closes that gap: a runner generates small variants ("mutants") of the source under test — flipping operators, replacing literals, removing blocks — and reports which mutants the suite kills (a test fails) versus which survive (no test failed). A high line coverage with a low mutation score is the classic warning sign — tests that exercise the code without actually asserting on its behavior.

jkz uses Stryker Mutator for JavaScript mutation testing. The current scope is intentionally narrow: a spike to validate the workflow before any broader rollout, run locally rather than in CI.

## How to run

Each instrumented module has its own npm script, plus batch scripts that chain related modules:

```bash
# A single module
npm run mutation:atomic-write
npm run mutation:vote-resolver
npm run mutation:validators-run
# ... one mutation:<module> script per module in the scope table below

# Batches
npm run mutation:batch-a    # decision-logic core
npm run mutation:batch-b    # context-protection modules
npm run mutation:batch-c    # validators suite
npm run mutation:batch-de   # analysis & utility modules
npm run mutation:batch      # pipeline-validation modules
```

Runtime is roughly 10–20 seconds per module at the current scope. Stryker forks a worker process per mutant and runs the corresponding `node --test scripts/<module>.test.js` invocation under each mutation. The batch scripts chain modules with `&&`; because each config sets `thresholds.break: 0`, Stryker exits `0` on score-based results, so the chain only halts on a hard failure (config error, test-runner crash) rather than a low score.

## Where the report lives

After a run, two reports are written to `reports/mutation/<module>/` (git-ignored):

- `mutation.html` — an interactive report; open it in a browser to inspect surviving mutants line by line.
- `mutation.json` — machine-readable; useful for scripting follow-up issues or CI gates.

A `clear-text` summary (mutation score and killed / survived / timeout / no-coverage counts) is also printed to stdout at the end of each run.

## Current scope

Modules marked ✓ meet the 80% gate. Each module has a follow-up issue tracking its surviving mutants for triage; the spike infrastructure (configs, scripts, baseline runs) is complete for all batches.

| Module | Score | Gate |
|--------|-------|------|
| `scripts/saturation-check.js` | 95.77% | ✓ |
| `scripts/validators/rules/secrets.js` | 95.21% | ✓ |
| `scripts/parse-gemini-stream.js` | 88.14% | ✓ |
| `scripts/validators/rules/test-coverage.js` | 86.67% | ✓ |
| `scripts/circuit-breaker.js` | 83.82% | ✓ |
| `scripts/validators/rules/capabilities.js` | 83.09% | ✓ |
| `scripts/validators/rules/dry-check.js` | 83.06% | ✓ |
| `scripts/rollback-decision.js` | 81.97% | ✓ |
| `scripts/validators/run.js` | 81.37% | ✓ |
| `scripts/cluster-findings.js` | 81.32% | ✓ |
| `scripts/format-patterns.js` | 77.35% | |
| `scripts/step-gate.js` | 72.68% | |
| `scripts/error-grouping.js` | 66.09% | |
| `scripts/slo-check.js` | 64.75% | |
| `scripts/plan-digest.js` | 58.79% | |
| `scripts/normalize-judge-verdict.js` | 57.33% | |
| `scripts/rubric-score.js` | 56.25% | |
| `scripts/extract-findings.js` | 55.17% | |
| `scripts/compress-context.js` | 53.33% | |
| `scripts/parse-body-deps.js` | 51.69% | |
| `scripts/compress-git-output.js` | 48.21% | |
| `scripts/truncate-output.js` | 46.93% | |
| `scripts/loop-guard.js` | 42.56% | |
| `scripts/vote-resolver.js` | 37.58% | |
| `scripts/dependency-resolve.js` | 4.84% | |

A low score is not automatically a problem: many survivors are *equivalent* mutants — semantically identical to the original (dead-code branches, defensive catches, regex alternation variants) — and need no new test. The per-module follow-up issues record which survivors are equivalents and which are real coverage gaps.

## Configuration

Each module has its own `stryker.conf.<module>.json` at the repo root, all following the same pattern:

- `mutate` — the target source file.
- `testRunner: "command"` — wraps the existing `node --test ...` invocation, so no test-framework migration is required.
- `coverageAnalysis: "off"` — kept simple for the spike; revisit once the workflow is established.
- Reporters: `html`, `json`, `clear-text`.
- `concurrency: 2`, `timeoutMS: 60000`. Exception: `step-gate.js` uses `concurrency: 1`, because its tests share tmpdir state and concurrent workers would interfere.

## CI integration

CI integration — cadence, gate threshold, where it runs — is intentionally deferred to a separate follow-up issue. The current spike is local-only.

## Interpreting results

- **Killed** — a test failed when the mutant was active. Good signal: the suite catches this kind of regression.
- **Survived** — no test failed. Either the mutant is equivalent (semantically identical to the original) or the suite has a real gap. Triage each survivor in the HTML report.
- **Timeout** — the mutant made the test runner exceed `timeoutMS` (often a real bug, e.g. an infinite loop). Counts as killed in the score.
- **No coverage** — the line is not exercised by any test; the mutant could not even run.

The mutation score is `(killed + timeout) / (killed + timeout + survived + no-coverage)`.
