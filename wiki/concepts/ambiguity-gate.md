---
title: Ambiguity gate
description: The two inline checkpoints where jkz scans for ambiguity it should not resolve alone — how TRIVIAL, FIX, and DECIDE are classified, and why the gate fails open.
---

A pipeline that resolves every ambiguity by itself will, sooner or later, confidently build the wrong thing. The ambiguity gate exists to catch the moments where a decision belongs to you, not to a model — and to let everything else flow through untouched. It is a scan, not a wall: most ambiguities pass straight through, and only the ones that genuinely need a human stop the line.

## Two inline checkpoints

The gate runs twice, at the two seams where a wrong assumption would be most expensive to carry forward:

1. **Post-plan** — after the plan is drafted, before any code is built. An assumption baked into the plan here would propagate through the entire build.
2. **Post-QA** — after QA completes, before the work is handed to you for the final merge decision. This is the last scan before the human checkpoint.

At each point an Opus scan reads the work in context and classifies whatever ambiguity it finds. The checkpoints are *inline* — they are part of the phase transition, not a separate command you run. You see them as part of [the pipeline's](/concepts/pipeline/) flow between phases.

## TRIVIAL, FIX, DECIDE

Every ambiguity the scan surfaces is sorted into one of three classes, and the class determines what happens next:

| Class | Meaning | Action |
|-------|---------|--------|
| **TRIVIAL** | A non-decision — wording, a detail with one obvious reading | Noted, pipeline continues |
| **FIX** | An ambiguity the pipeline can resolve itself, correctly | Resolved inline, pipeline continues |
| **DECIDE** | A genuine fork where the choice is yours to make | **Stops — requires a human decision** |

The line that matters is between FIX and DECIDE. A FIX is something with a defensible right answer the pipeline can pick on its own. A DECIDE is a fork where reasonable choices diverge and the consequences are yours to own — a product trade-off, a scope boundary, an irreversible call. The gate does not guess on a DECIDE. It surfaces the fork and waits for you.

## Fail-open by design

The gate is **fail-open**: if the scan itself errors or cannot run, the pipeline continues rather than blocking. This is deliberate. The ambiguity gate is a safety net for decisions, not a load-bearing gate for correctness — those are the adversarial reviews and [the merge gate](/concepts/merge-gate/), which fail *closed*. An infrastructure hiccup in an advisory scan should not wedge a pipeline that is otherwise healthy.

The trade-off is honest: a failed scan means a DECIDE-class ambiguity might slip past unflagged. That residual risk is acceptable precisely because the gate is one of several human checkpoints, not the only one. You still approve the plan, and you still perform the merge — a missed flag narrows the safety margin, it does not open the door to `main`.

## What this is not

- **Not a quality gate.** The ambiguity gate decides *who chooses*, not *whether the code is correct*. Correctness is enforced by the adversarial reviews under the [evidence hierarchy](/concepts/evidence-hierarchy/).
- **Not a blocking wall by default.** Only a DECIDE stops the line. TRIVIAL and FIX pass through, and a scan failure passes through too.
- **Not the only human checkpoint.** It complements the plan approval and the human merge — three separate decisions, not one.

## Related

- [The pipeline](/concepts/pipeline/) — the phase transitions where the two checkpoints are wired in.
- [Merge gate](/concepts/merge-gate/) — the other gate between you and `main`, and the one that fails *closed*.
- [Evidence hierarchy](/concepts/evidence-hierarchy/) — how the pipeline keeps its autonomous decisions honest where the ambiguity gate keeps the human ones human.
