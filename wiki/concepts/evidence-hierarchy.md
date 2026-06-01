---
title: Evidence hierarchy
description: Why an adversarial verdict in jkz must rest on execution output or a file citation, never on reasoning alone — the three levels, and the gotchas that disguise level 3 as level 1.
---

When a jkz agent says a change is correct, the question that matters is not *how confident is it* but *what is the claim made of*. A model can argue persuasively for a wrong answer. So jkz ranks evidence, and the adversarial roles are forbidden from approving on the weakest kind. Confidence is not evidence. A reason is not a result.

## The three levels

Every claim an agent makes is one of three kinds, ranked by how hard it is to fake:

1. **Execution** — the output of actually running something: a test result, a command's stdout, a screenshot. The code was run and *this* is what happened.
2. **File citations** — a verbatim quote from a repository file at a specific line: `file.ts:42` with the relevant fragment. The claim points at code that demonstrably exists.
3. **Reasoning** — a logical argument with no direct evidence behind it. "This should work because…" is level 3, however sound the logic sounds.

The order is the whole point. Execution beats citation beats reasoning, because each level is harder to produce without the underlying fact being true. You can reason your way to a wrong conclusion effortlessly; you cannot paste passing test output for code that fails.

## Why adversarial roles require level 1 or 2

The adversarial roles (**Auditor** in Plan, **Judge** in Build, **Sentinel** in QA) exist to break the work, and their verdicts gate the pipeline. So their verdicts carry a strict rule: **reasoning alone is never sufficient for approval.** An adversarial PASS must rest on level 1 or level 2 evidence. If the only thing supporting a claim is an argument, the claim does not clear the gate.

This is what makes the [create → challenge → confirm rhythm](/concepts/pipeline/) more than theatre. The challenger is not asked whether the work *seems* right; it is asked to show, by execution or citation, that it *is*. A validator then checks that the evidence is real and on point. The discipline is what lets the pipeline iterate autonomously without quietly approving plausible-but-wrong work.

## The gotchas

Level 3 evidence often arrives wearing a level 1 costume. These are the disguises the validator roles are trained to strip away:

- **"I ran it and it works" — with no output.** Claiming execution is not execution. Without the concrete result pasted in — the stdout, the test summary, the screenshot — the claim is reasoning, level 3. Execution evidence requires the execution's actual output.
- **A citation from the wrong file.** Quoting code that is not in the PR diff proves nothing about the change under review. The citation must come from modified or directly affected code; an unrelated file is not evidence about *this* change.
- **A citation without a line.** Naming `file.ts` is not a level 2 citation. Level 2 requires `file.ts:line` together with the relevant textual fragment — enough that a reviewer can open the file and see the same thing.

Each of these collapses to level 3 once examined. The hierarchy is not just a ranking; it is a checklist for catching arguments that are pretending to be facts.

## What this is not

- **Not a confidence score.** A high-confidence reason is still level 3. The hierarchy ranks the *kind* of evidence, not how sure the agent sounds.
- **Not applied only to approvals.** A FAIL verdict is held to the same standard — a claim that something is broken should cite the failing output or the offending line, not just assert it.
- **Not a substitute for human review.** The hierarchy strengthens the adversarial gates; it does not replace the human checkpoints that still sit between the phases.

## Related

- [The pipeline](/concepts/pipeline/) — where the adversarial roles sit and why their verdicts gate each phase.
- [How jkz works](/get-started/how-jkz-works/) — the full role catalogue, including the Auditor, Judge, and Sentinel.
- [Ambiguity gate](/concepts/ambiguity-gate/) — the other discipline that protects the pipeline's autonomy: surfacing decisions a model should not make alone.
