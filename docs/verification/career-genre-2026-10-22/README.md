# Brief 22: Finish The Three Remaining Career And Genre Issues, 2026-10-22

The owner's brief 22 (`../briefs-2026-10-16/22-finish-the-three-remaining-career-and-genre-issues.txt`, kept verbatim)
authorized three things and asked that each be implemented and verified, not recommended:
1. work stopping when permission to work in the United States ends, wherever the work is;
2. each work's genres weighed as its own material states them, in place of the first-listed genre's half;
3. bounded transfer between a broad genre and its direct kinds, the conflicting benchmark superseded in the owner's
   words.

Its items were written before any fix (`criteria.md`), with the seeds the comparisons use. This is the receipt. A compact
record of the work as it went is `CHECKPOINT.md`.

**An automated proof isn't a person's play.** What follows says what was read, changed, measured and found. It doesn't
say there are no defects left.

## The Tested Commit

`16b50e07` on `claude/peaceful-hamilton-59zdbb`, from `46822660` (`main`, #53). Its `src` is `8aa87539`'s. Every final
run was made on it, each lane in a clean clone (`final-runs/runs/README.md`). Every later commit changes documents and
the runs' scripts only, nothing under `src`. The gate, in a clean clone, its exit read from its file: The Gate, below.

| Commit | What |
|---|---|
| `69996adb` | The brief kept verbatim |
| `cad48116` | The criteria before any fix; the sources, dated; b20-4's 48 days reproduced on the starting commit, and its save kept |
| `34b748ee` | A: OPT counted by the day; permission read at each work day; release; pay for days worked |
| `208e57c0` | A: OPT's weekly kind kept for the older saves that hold one |
| `d69ad309` | W and T: the material's genre weights, read by every consumer; transfer one step; the coefficients measured and set |
| `8aa87539` | The faults' two missing tests; Papers' status a day late, found on the built app and fixed; the walk |
| `16b50e07` | The two survivors killed on the rerun; the final runs' lanes |

## The Defects And Their Fixes

Each has a test the gate runs that fails without the fix.

| # | Defect | Fix | Test |
|---|---|---|---|
| 1 | Work went on after permission ended: b20-4 worked 47 days of The Winter Ledger (48 by the journey's own count) after its OPT ended. Nothing read permission after acceptance. | Each work day reads permission at its hour, whole; permission ending releases the work booked past it. | `tests/b22-authorization.test.ts` "A1" (fails on `69996adb`: `before/a1-on-base.txt`) |
| 2 | OPT counted by the week, a booked day counted as worked, the 91st day found up to six days late. | Counted by the day, once each, a day with work only inside an engagement begun and not ended. | "A4 to A9", "A12", "a booking isn't employment…" |
| 3 | Pay for days worked was never paid once work was called off: `payDue` skipped every engagement called off, while the replacement notice said those days were still paid. Older than brief 22; found by its release. | Paid on its payday. | "A7, during", "authorized work and after"; `tests/pro-work.test.ts` |
| 4 | Acceptance read each day's start alone, so a day that began with permission and ended without it could be taken. | Each day read whole. | "inside a day" (added for fault B22-A7) |
| 5 | An older save opened on the morning of a booked day, its weekly count days behind, would work that day before midnight's count ended its OPT. | The work day counts OPT's days before it reads permission. | "A12, an older save" (added for fault B22-A1b) |
| 6 | Papers said "Ends September 2, 2029" of a status that ended with 1 September, the day the notice and the guide gave. | Said as the last day in status. | `tests/evidence2-b06.test.ts`, `tests/evidence-g16-papers.test.ts`, `tests/propay-screen.test.ts`; the built app |
| 7 | The order a list of genres was written in decided what a work asked: the first listed took half. | Every work states its weights (`content/genre-weights.ts`), its level's set read whole; tags evenly where nothing is stated. | `tests/b22-genre-weights.test.ts` |
| 8 | Transfer ran through any depth: Nordic noir counted toward drama through crime. | One direct link only. | `tests/b22-transfer.test.ts` T1 |
| 9 | Studying a work's own genre added nothing until it passed what a related genre gave (the better of the two). | The own and the best related credit count together. | T3 |
| 10 | Brief 21's coefficients gave a related genre nearly all of the genre's own gain where the judgment saturates. | Measured against a criterion written first, and lowered to 0.65 and 0.40. | `tests/b22-comparisons.test.ts` |
| 11 | A class scene read its play's kinds, or none where the play had none (43 of 67 scenes); the showcase's notes read its filed genre alone. | A scene reads its own where stated, else its play's, else its filed genre; the showcase says what the scene asks. | W2, W6, "the Actor Showcase's faculty…" |
| 12 | The Profile's genre to study was the play's kind known least, whatever its share. | Where study would help most of what the part asks. | `tests/evidence-g31-ui.test.ts`, W6 |
| 13 | What It Asks listed a project's tags, a broad genre beside its own kind. | Said in words. | `tests/pro-opportunities-screen.test.ts`, W10 |

## Work Authorization

**The rule, from the record** (`authorization-sources.md`, every source read 2026-10-22; `authorization-trace.md`, each
stage before and after):
- **A day, not a week.** Each New York day of OPT from its first is counted once it's over (8 CFR 214.2(f)(10)(ii)(E);
  SEVP 1004-03 §4.9, §7.1.6, weekends included).
- **A booking isn't employment.** A day with work falls inside an engagement that has begun (a day of it worked) and
  hasn't ended (its last day, or the moment it was called off), its scheduled hours averaging 20 a week over its span
  (§7.1.5, §7.2.1). The days waiting for booked work to begin, and the days between jobs, are days without work.
- **Expiry isn't a breach.** OPT running out on its end date ends work there, with the status's 60 days of grace;
  more than 90 days without work ends permission and the status at the end of the 91st, with none (§7.4.2).
- **A stop on future work isn't a claim on past pay.** The employer can't go on employing (8 U.S.C. 1324a(a)(2)), so
  the work is released; the days worked are paid on their payday (DOL Fact Sheet #48); nothing else is claimed, since no
  agreement in the game gives a penalty.
- **No new immigration category, and no route back in play.** OPT isn't granted twice and the green card is refused.

**Worked examples**, each a test:
- **b20-4 (A1), from its own save of 1 September 2029:** 88 days without work counted to 29 August; 30 and 31 August
  and 1 September make 91; OPT ends at the end of 1 September; The Winter Ledger, booked to begin on 4 September, is
  released at that midnight; not one of its 50 days worked, paid, practised or credited.
- **The same life, from a save written by the old build on 4 September at 7 AM:** the 10 AM rehearsal counts the three
  days first, finds OPT ended with 1 September, and releases the run then.
- **A graduate on OPT from 1 October 2026:** a run booked to begin on 5 January is warned of at acceptance and released
  at the end of 30 December, the 91st day; a run beginning on 29 December, the 90th, is worked whole and keeps OPT going
  until after it ends, its last week paid on its payday.
- **A shoot day split by OPT's end date** (OPT's end falls at the hour it began, a year on): refused at acceptance;
  taken before the end moved, released at its start, nothing worked or paid.

**Before and after, b20-4** (J1): on the starting commit, 47 days of The Winter Ledger worked after OPT ended at 14:25
UTC on 6 September 2029, by the weekly count (`before/b20-4/`); on the tested commit, J1 below.

**Older saves:** a save from before brief 22 keeps its weekly count as it was, and the daily count goes on from the day
its weeks reached, nothing counted twice. The weekly kind it holds on its calendar now only settles the count. Every
fixture save opens. The schema version stays 94; no migration.

## Genre Weights

**The rule** (`content/genre-weights.ts`, `systems/engagement.ts` `resolveGenres`; the material reviewed in
`genre-weights.md`):
- **Levels, the most precise first:** a class scene's own; a part's or role's own; the play's or project's. The first
  level that states valid weights gives the whole set. A level with tags and none reads them evenly (the neutral
  fallback). A class scene's filed genre is read only where its play names none.
- **Invalid weights** (a genre the game doesn't have, a weight below 0 or not a number, none above 0) are skipped, the
  reason kept, and the level's tags or the next level read.
- **Bounded and order-free:** shares of the sum, sorted and summed by genre; a tag repeated is one; a broad genre beside
  its own kind folded into the kind.
- **Design choices, not facts:** every weight carries SLATE's reason, read from the material.

**Examples:** Blood Wedding, tragedy 3 and romantic drama 2 (brief 21's rule: half each); Macbeth's witches,
supernatural 7 and tragedy 3, beside the play's tragedy 3, historical drama 1, supernatural 1; Julius Caesar's Forum
scene, political drama 6, tragedy 3, historical drama 1, its orchard scene tragedy 3, political drama 1; The Winter's
Tale, tragicomedy 5, romance 3, fairy tale 2 (brief 21's: romance 0.5, the others 0.25). 13 of 31 plays read otherwise
than brief 21's rule read them; every project reads as before.

**Every consumer reads it:** School casting and nights, School calls' and professional rehearsal days' practice and
lines, class scenes' preparation, taped briefs, self-tapes, auditions, callbacks, work days, casting's fit, the
showcase's notes, the Profile's suggestion and What It Asks. Enjoyment still reads a work's tags as listed: loving a
genre makes a day of its kind better, and loving horror counts for a psychological horror. That's preference, not a
demand.

## Related Genres

**The rule** (`relatedness`, `relevantGenre`): a kind counts toward its direct broad genre at 0.65, a broad genre toward
its direct kind at 0.40, and nothing else counts: no chains, no siblings, no unrelated genre. A need is met by the genre's
own knowledge and the best related credit together, `1 − (1 − own) × (1 − related)`, so exact mastery is whole and
studying the genre itself always helps. Reading writes nothing: practice goes only to the genres the work asks.

**Example:** a crime work, an actor at 90 in one genre: crime itself 0.9; police procedural (a kind) 0.585; drama (its
broad genre) 0.36; western 0. Drama at 90 and domestic drama at 8 for a domestic drama: 1 − 0.92 × 0.64 = 0.411, more
than drama alone (0.36).

**The coefficients, measured** (`comparisons.md`, `tests/b22-comparisons.test.ts`): eight fixed seeds, nine paths, five
records each, the intermediate figures reported. The criterion, written before: nothing = unrelated < broad < kind <
exact (K1); a kind's gain at most 0.85 of the genre's own and a broad genre's at most 0.65 (K2). 0.75 and 0.5 held K1
and failed K2 on a taped brief (0.892 and 0.769), a School night (0.882, 0.667) and a self-tape (0.870); 0.70 and 0.45
failed on a taped brief; 0.65 and 0.40 hold everywhere.

**The criterion superseded** (`decision-history.md`): the Genre Audit's "leaks into none" (2026-10-16) stays in the record,
with brief 21's question and the owner's authorization; Genre Audit-R, in the owner's words, "No unrelated-genre
contribution; only documented, bounded transfer across approved direct relationships", is measured over every ordered
pair: an unrelated genre moves another's brief in 0 of 21,644; a direct one in 408 of 408, each less than the genre
itself, at most 85% of its gain.
