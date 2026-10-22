# Brief 22: The Decision History Of Related Genres

What the game was asked about knowing one genre toward another, in order, each in the words that asked it. Nothing here
was loosened to pass: the criterion was replaced in the owner's words, and the coefficients were measured against a
criterion written before they were read, then lowered where they failed.

## 1. The Old Criterion (2026-10-16)

The owner's genre acceptance brief of 2026-10-16 set the Genre Audit row of the completion matrix:

- **Goal:** "Every genre in the code (149): knowing it helps its own work and transfers to no other; what each reads
  and suits."
- **Threshold:** "helps its own in every genre; leaks into none."
- **How it was read:** `tools/genre-audit.ts` gave an actor one genre and read the brief of the next genre over in the
  catalog. Until brief 21 every reader took the best-known of a work's genres and none read a related genre, so it
  measured 0 on every tested commit from brief 09 (`c9cba9c8`) to brief 19 (`728b4972`).

It stays in the record as written, superseded and not deleted (`criteria.py`; this file; the Genre Audit row's history).

## 2. Brief 21's Measure And Its Question (2026-10-22)

The owner's brief 21 asked that a work's genres be weighed, that "unrelated genres give no bonus", and that overlapping
tags count once. Its measure (`systems/engagement.ts` as of `fd32e869`):

- credited a kind toward its broad genre at **0.75**;
- credited a broad genre toward its kind at **0.5**;
- read any depth, so Nordic noir counted toward drama through crime;
- took the better of the genre's own knowledge and the related credit.

On brief 21's tested commit the audit's next genre over moved in 9 pairs, each a genre and its own kind, none
unrelated. Brief 21 couldn't count "leaks into none" met, so it left the row **Decision Required**
(`genre-banking-2026-10-22/final-runs/judge-moved.json`):

> The Genre Audit's threshold (the owner's genre acceptance brief, 2026-10-16) says knowing a genre helps its own work
> and transfers to no other. Brief 21 asked that unrelated genres give nothing and that overlapping tags count once, and
> its measure credits a genre's own kind toward it at 0.75 and its broad genre at 0.5. Should a kind and its broad genre
> count toward each other, or should the audit's 'leaks into none' stand and both credits be 0?

Its recommendation: keep the credits, and read the threshold as no unrelated genre. genres.7-measured, which holds the
audit's 0 too, was left Implemented, Verification Incomplete, waiting on the same decision.

## 3. The Owner's Authorization (Brief 22, 2026-10-22)

From `docs/verification/briefs-2026-10-16/22-finish-the-three-remaining-career-and-genre-issues.txt`, word for word:

> This brief authorizes: […] 3. Allowing justified transfer between related genres and updating the conflicting
> benchmark.

> I approve partial transfer between a broad genre and its direct subgenres. Unrelated genres must contribute zero. Do
> not add automatic sibling-to-sibling transfer or chains of transfer without a separately justified design.

> Retain Brief 21’s 0.75 subgenre-to-parent and 0.50 parent-to-subgenre coefficients provisionally. Evaluate them with
> controlled comparisons before finalizing. They are tunable simulation choices, not real-world facts.

> Keep exact-genre mastery fully effective. Related knowledge must provide a bounded partial benefit and must not make
> specialist development pointless.

> Explicitly supersede the old “no transfer to any other genre” criterion with:
> “No unrelated-genre contribution; only documented, bounded transfer across approved direct relationships.”

> Preserve the old criterion and this authorization in the decision history. Do not merely lower a threshold to obtain
> a passing result.

## 4. What Brief 22 Changed In The Measure

- **Direct links only.** Brief 21's chains were removed: a genre two links away counts nothing, and so do two kinds of
  one broad genre. The 12 kinds whose broad genre is itself a kind were read by hand (`tests/b22-transfer.test.ts`, T1).
- **The genre's own always counts.** The own knowledge and the best related credit count together toward a need,
  `1 − (1 − own) × (1 − related)`. Brief 21 took the better of the two, under which a domestic drama's first study added
  nothing until it passed what drama gave it (T3).
- **Nothing stored.** A related genre helps meet a requirement and earns no familiarity or practice of its own (T2).

## 5. The Coefficients, Measured (T4)

Before any outcome was read, `criteria.md` fixed the seeds (`b22-proof-1` to `b22-proof-8`) and the criterion for
keeping 0.75 and 0.5, on the median over the seeds at every path that reads a work's genres:

- **(K1)** nothing known = an unrelated genre < the broad genre < a kind < the genre itself;
- **(K2)** a kind's gain at most 0.85 of the genre's own, and a broad genre's at most 0.65;
- where either failed, the coefficient was to be lowered until both held, and the reason kept.

The criterion bounds how much the related genre gives. It isn't a threshold set after the fact.

| Coefficients | K1 | K2 | Where K2 failed |
|---|---|---|---|
| 0.75 and 0.5 (brief 21's) | holds on all 9 paths | fails on 3 | a taped brief: kind 0.892, broad 0.769; a School night: kind 0.882, broad 0.667; a self-tape: kind 0.870 |
| 0.70 and 0.45 | holds | fails on 1 | a taped brief: kind 0.862, broad 0.708 |
| **0.65 and 0.40 (kept)** | holds | holds on all 9 | none; the closest, a taped brief: kind 0.831, broad 0.646 |

**Why 0.75 and 0.5 failed:** the judgment saturates near complete. Three-quarters of the reading came to nearly all
of the work's gain, so a specialist's own study bought little over a related genre's. Lowered by 0.05 at a time, the
first step that held everywhere was kept (`comparisons.md`, written by `comparisons.ts`; asserted by
`tests/b22-comparisons.test.ts`, which also sets 0.75 and 0.5 back by hand and shows them fail where they failed).

The coefficients are **SLATE's design choices**, tuned by this measurement. They are not facts about actors:
`content/engagement.ts`, the guide's Related Genres entry and the weights review say so.

## 6. The Criterion Now

**"No unrelated-genre contribution; only documented, bounded transfer across approved direct relationships."** (The
owner's words, brief 22.) `tools/genre-audit.ts` reports both halves, read over every ordered pair of the 149 genres:

- **unrelated:** a genre with no direct link to a work's moves it in **0 of 21,644** pairs;
- **related:** a genre one direct link away moves it in 408 of 408 pairs, each by less than the genre itself, at most
  85% of its gain (93% at 0.75 and 0.5);
- **the old test's count:** the next genre over still moves in 9 pairs, as brief 21 found, each a genre and its own kind.
  The audit reports it so the old criterion's figure stays readable.

The Genre Audit row, as written, is kept as the record and superseded. Its replacement, "Genre Audit-R", is verified
on this measurement. genres.7-measured is read against the replacement.
