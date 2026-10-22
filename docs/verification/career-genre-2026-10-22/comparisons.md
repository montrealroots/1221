# Brief 22’s Controlled Comparisons

Written by `comparisons.ts` from the scenarios `tests/b22-comparisons.test.ts` asserts. The same actor on the same day,
with the same preparation and the same draw, read with only what they know of genres changed, on every path that reads
a work's genres. The work asks one genre, crime (TEST SETUP: set by hand at the level each path reads). Seeds, fixed in
`criteria.md` before any outcome was read and never replaced: `b22-proof-1`, `b22-proof-2`, `b22-proof-3`, `b22-proof-4`, `b22-proof-5`, `b22-proof-6`, `b22-proof-7`, `b22-proof-8`. Records: none (nothing known); unrelated (western 90); broad (drama 90); kind (police_procedural 90); exact (crime 90).

**The criterion (criteria.md, T4), written before the measurement**, on the median over the seeds of each path’s gain
over knowing nothing: (K1) nothing = unrelated < broad < kind < exact; (K2) the kind’s gain at most 0.85 of the exact
genre’s, the broad genre’s at most 0.65.

**Kept: 0.65 (a kind toward its broad genre) and 0.4 (a broad genre toward its kind).** Brief 21’s
0.75 and 0.5 failed K2 on three paths and were lowered by 0.05 at a time until both held on every path.

## The Steps

| Coefficients | Path | Gain: broad | kind | exact | Kind ÷ exact | Broad ÷ exact | K1 | K2 |
|---|---|---|---|---|---|---|---|---|
| 0.75 and 0.5 | school casting | 2.4 | 3.6 | 4.4 | 0.818 | 0.545 | holds | holds |
| 0.75 and 0.5 | school night | 1.7 | 2.25 | 2.55 | 0.882 | 0.667 | holds | fails |
| 0.75 and 0.5 | taped brief | 2.5 | 2.9 | 3.25 | 0.892 | 0.769 | holds | fails |
| 0.75 and 0.5 | audition in person | 1.6 | 2.1 | 2.55 | 0.824 | 0.627 | holds | holds |
| 0.75 and 0.5 | self-tape | 2.4 | 3.35 | 3.85 | 0.87 | 0.623 | holds | fails |
| 0.75 and 0.5 | callback | 1.15 | 1.6 | 2.1 | 0.762 | 0.548 | holds | holds |
| 0.75 and 0.5 | work day | 2.6 | 3.65 | 4.3 | 0.849 | 0.605 | holds | holds |
| 0.75 and 0.5 | casting’s fit | 0.25 | 0.375 | 0.5 | 0.75 | 0.5 | holds | holds |
| 0.75 and 0.5 | rehearsal day’s lines | 0.009 | 0.014 | 0.018 | 0.778 | 0.5 | holds | holds |
| 0.7 and 0.45 | school casting | 2.15 | 3.35 | 4.4 | 0.761 | 0.489 | holds | holds |
| 0.7 and 0.45 | school night | 1.55 | 2.15 | 2.55 | 0.843 | 0.608 | holds | holds |
| 0.7 and 0.45 | taped brief | 2.3 | 2.8 | 3.25 | 0.862 | 0.708 | holds | fails |
| 0.7 and 0.45 | audition in person | 1.5 | 2 | 2.55 | 0.784 | 0.588 | holds | holds |
| 0.7 and 0.45 | self-tape | 2.15 | 3.2 | 3.85 | 0.831 | 0.558 | holds | holds |
| 0.7 and 0.45 | callback | 1.1 | 1.55 | 2.1 | 0.738 | 0.524 | holds | holds |
| 0.7 and 0.45 | work day | 2.4 | 3.45 | 4.3 | 0.802 | 0.558 | holds | holds |
| 0.7 and 0.45 | casting’s fit | 0.225 | 0.35 | 0.5 | 0.7 | 0.45 | holds | holds |
| 0.7 and 0.45 | rehearsal day’s lines | 0.008 | 0.013 | 0.018 | 0.722 | 0.444 | holds | holds |
| 0.65 and 0.4 | school casting | 1.9 | 3.1 | 4.4 | 0.705 | 0.432 | holds | holds |
| 0.65 and 0.4 | school night | 1.45 | 2.05 | 2.55 | 0.804 | 0.569 | holds | holds |
| 0.65 and 0.4 | taped brief | 2.1 | 2.7 | 3.25 | 0.831 | 0.646 | holds | holds |
| 0.65 and 0.4 | audition in person | 1.35 | 1.9 | 2.55 | 0.745 | 0.529 | holds | holds |
| 0.65 and 0.4 | self-tape | 2 | 3.05 | 3.85 | 0.792 | 0.519 | holds | holds |
| 0.65 and 0.4 | callback | 1 | 1.45 | 2.1 | 0.69 | 0.476 | holds | holds |
| 0.65 and 0.4 | work day | 2.2 | 3.3 | 4.3 | 0.767 | 0.512 | holds | holds |
| 0.65 and 0.4 | casting’s fit | 0.2 | 0.325 | 0.5 | 0.65 | 0.4 | holds | holds |
| 0.65 and 0.4 | rehearsal day’s lines | 0.007 | 0.012 | 0.018 | 0.667 | 0.389 | holds | holds |

## At 0.65 And 0.4, Every Seed

Reading: what the genres come to, 0 to 1. Part: the genre part of the piece’s preparation (on casting’s fit, the fit’s
genre half). Prepared and quality: the interpretation choices’ preparation and quality, where the path judges them. Whole:
the piece’s overall (on casting’s fit, the fit; on a rehearsal day, the lines learned).

| Path | Seed | Record | Reading | Part | Prepared | Quality | Whole |
|---|---|---|---|---|---|---|---|
| school casting | b22-proof-1 | none | 0 |  |  |  | 51.9 |
| school casting | b22-proof-1 | unrelated | 0 |  |  |  | 51.9 |
| school casting | b22-proof-1 | broad | 0.36 |  |  |  | 53.8 |
| school casting | b22-proof-1 | kind | 0.585 |  |  |  | 55 |
| school casting | b22-proof-1 | exact | 0.9 |  |  |  | 56.5 |
| school night | b22-proof-1 | none | 0 | 0 | 0.75 | 37.7 | 46.2 |
| school night | b22-proof-1 | unrelated | 0 | 0 | 0.75 | 37.7 | 46.2 |
| school night | b22-proof-1 | broad | 0.36 | 0.36 | 0.85 | 42.7 | 47.7 |
| school night | b22-proof-1 | kind | 0.585 | 0.585 | 0.913 | 45.8 | 48.6 |
| school night | b22-proof-1 | exact | 0.9 | 0.9 | 1 | 50.2 | 49.1 |
| taped brief | b22-proof-1 | none | 0 | 0 | 0.75 | 47.1 | 55.3 |
| taped brief | b22-proof-1 | unrelated | 0 | 0 | 0.75 | 47.1 | 55.3 |
| taped brief | b22-proof-1 | broad | 0.36 | 0.36 | 0.85 | 53.4 | 57.4 |
| taped brief | b22-proof-1 | kind | 0.585 | 0.585 | 0.913 | 57.3 | 58 |
| taped brief | b22-proof-1 | exact | 0.9 | 0.9 | 1 | 62.8 | 58.5 |
| audition in person | b22-proof-1 | none | 0 | 0 | 0.75 | 39.9 | 46.9 |
| audition in person | b22-proof-1 | unrelated | 0 | 0 | 0.75 | 39.9 | 46.9 |
| audition in person | b22-proof-1 | broad | 0.36 | 0.36 | 0.85 | 45.3 | 49.1 |
| audition in person | b22-proof-1 | kind | 0.585 | 0.585 | 0.913 | 48.6 | 49.7 |
| audition in person | b22-proof-1 | exact | 0.9 | 0.9 | 1 | 53.3 | 50.4 |
| self-tape | b22-proof-1 | none | 0 | 0 | 0.75 | 40.8 | 47.4 |
| self-tape | b22-proof-1 | unrelated | 0 | 0 | 0.75 | 40.8 | 47.4 |
| self-tape | b22-proof-1 | broad | 0.36 | 0.36 | 0.85 | 46.3 | 49.5 |
| self-tape | b22-proof-1 | kind | 0.585 | 0.585 | 0.913 | 49.7 | 50.5 |
| self-tape | b22-proof-1 | exact | 0.9 | 0.9 | 1 | 54.5 | 51.2 |
| callback | b22-proof-1 | none | 0 | 0 | 0.75 | 34.3 | 41.9 |
| callback | b22-proof-1 | unrelated | 0 | 0 | 0.75 | 34.3 | 41.9 |
| callback | b22-proof-1 | broad | 0.36 | 0.36 | 0.85 | 38.9 | 42.7 |
| callback | b22-proof-1 | kind | 0.585 | 0.585 | 0.913 | 41.7 | 43.1 |
| callback | b22-proof-1 | exact | 0.9 | 0.9 | 1 | 45.7 | 43.7 |
| work day | b22-proof-1 | none | 0 | 0 | 0.75 | 39.9 | 45.7 |
| work day | b22-proof-1 | unrelated | 0 | 0 | 0.75 | 39.9 | 45.7 |
| work day | b22-proof-1 | broad | 0.36 | 0.36 | 0.85 | 45.3 | 47.9 |
| work day | b22-proof-1 | kind | 0.585 | 0.585 | 0.913 | 48.6 | 49.2 |
| work day | b22-proof-1 | exact | 0.9 | 0.9 | 1 | 53.3 | 50 |
| casting’s fit | b22-proof-1 | none | 0 | 0 |  |  | 0.287 |
| casting’s fit | b22-proof-1 | unrelated | 0 | 0 |  |  | 0.287 |
| casting’s fit | b22-proof-1 | broad | 0.36 | 0.4 |  |  | 0.487 |
| casting’s fit | b22-proof-1 | kind | 0.585 | 0.65 |  |  | 0.612 |
| casting’s fit | b22-proof-1 | exact | 0.9 | 1 |  |  | 0.787 |
| rehearsal day’s lines | b22-proof-1 | none | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-1 | unrelated | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-1 | broad | 0.36 |  |  |  | 0.127 |
| rehearsal day’s lines | b22-proof-1 | kind | 0.585 |  |  |  | 0.132 |
| rehearsal day’s lines | b22-proof-1 | exact | 0.9 |  |  |  | 0.138 |
| school casting | b22-proof-2 | none | 0 |  |  |  | 50.3 |
| school casting | b22-proof-2 | unrelated | 0 |  |  |  | 50.3 |
| school casting | b22-proof-2 | broad | 0.36 |  |  |  | 52.2 |
| school casting | b22-proof-2 | kind | 0.585 |  |  |  | 53.4 |
| school casting | b22-proof-2 | exact | 0.9 |  |  |  | 54.7 |
| school night | b22-proof-2 | none | 0 | 0 | 0.75 | 38.5 | 44.9 |
| school night | b22-proof-2 | unrelated | 0 | 0 | 0.75 | 38.5 | 44.9 |
| school night | b22-proof-2 | broad | 0.36 | 0.36 | 0.85 | 43.6 | 46.4 |
| school night | b22-proof-2 | kind | 0.585 | 0.585 | 0.913 | 46.8 | 47.1 |
| school night | b22-proof-2 | exact | 0.9 | 0.9 | 1 | 51.3 | 47.6 |
| taped brief | b22-proof-2 | none | 0 | 0 | 0.75 | 47.5 | 55.5 |
| taped brief | b22-proof-2 | unrelated | 0 | 0 | 0.75 | 47.5 | 55.5 |
| taped brief | b22-proof-2 | broad | 0.36 | 0.36 | 0.85 | 53.9 | 57.6 |
| taped brief | b22-proof-2 | kind | 0.585 | 0.585 | 0.913 | 57.8 | 58.2 |
| taped brief | b22-proof-2 | exact | 0.9 | 0.9 | 1 | 63.4 | 58.7 |
| audition in person | b22-proof-2 | none | 0 | 0 | 0.75 | 43.6 | 49.7 |
| audition in person | b22-proof-2 | unrelated | 0 | 0 | 0.75 | 43.6 | 49.7 |
| audition in person | b22-proof-2 | broad | 0.36 | 0.36 | 0.85 | 49.4 | 50.6 |
| audition in person | b22-proof-2 | kind | 0.585 | 0.585 | 0.913 | 53.1 | 51.1 |
| audition in person | b22-proof-2 | exact | 0.9 | 0.9 | 1 | 58.2 | 51.9 |
| self-tape | b22-proof-2 | none | 0 | 0 | 0.75 | 44.4 | 51.1 |
| self-tape | b22-proof-2 | unrelated | 0 | 0 | 0.75 | 44.4 | 51.1 |
| self-tape | b22-proof-2 | broad | 0.36 | 0.36 | 0.85 | 50.3 | 53.1 |
| self-tape | b22-proof-2 | kind | 0.585 | 0.585 | 0.913 | 54 | 53.6 |
| self-tape | b22-proof-2 | exact | 0.9 | 0.9 | 1 | 59.2 | 54.3 |
| callback | b22-proof-2 | none | 0 | 0 | 0.75 | 35.2 | 43.9 |
| callback | b22-proof-2 | unrelated | 0 | 0 | 0.75 | 35.2 | 43.9 |
| callback | b22-proof-2 | broad | 0.36 | 0.36 | 0.85 | 39.9 | 44.6 |
| callback | b22-proof-2 | kind | 0.585 | 0.585 | 0.913 | 42.9 | 45 |
| callback | b22-proof-2 | exact | 0.9 | 0.9 | 1 | 47 | 45.6 |
| work day | b22-proof-2 | none | 0 | 0 | 0.75 | 43.6 | 50.5 |
| work day | b22-proof-2 | unrelated | 0 | 0 | 0.75 | 43.6 | 50.5 |
| work day | b22-proof-2 | broad | 0.36 | 0.36 | 0.85 | 49.4 | 52.8 |
| work day | b22-proof-2 | kind | 0.585 | 0.585 | 0.913 | 53.1 | 53.4 |
| work day | b22-proof-2 | exact | 0.9 | 0.9 | 1 | 58.2 | 54.2 |
| casting’s fit | b22-proof-2 | none | 0 | 0 |  |  | 0.302 |
| casting’s fit | b22-proof-2 | unrelated | 0 | 0 |  |  | 0.302 |
| casting’s fit | b22-proof-2 | broad | 0.36 | 0.4 |  |  | 0.502 |
| casting’s fit | b22-proof-2 | kind | 0.585 | 0.65 |  |  | 0.627 |
| casting’s fit | b22-proof-2 | exact | 0.9 | 1 |  |  | 0.802 |
| rehearsal day’s lines | b22-proof-2 | none | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-2 | unrelated | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-2 | broad | 0.36 |  |  |  | 0.127 |
| rehearsal day’s lines | b22-proof-2 | kind | 0.585 |  |  |  | 0.132 |
| rehearsal day’s lines | b22-proof-2 | exact | 0.9 |  |  |  | 0.138 |
| school casting | b22-proof-3 | none | 0 |  |  |  | 48.6 |
| school casting | b22-proof-3 | unrelated | 0 |  |  |  | 48.6 |
| school casting | b22-proof-3 | broad | 0.36 |  |  |  | 50.5 |
| school casting | b22-proof-3 | kind | 0.585 |  |  |  | 51.4 |
| school casting | b22-proof-3 | exact | 0.9 |  |  |  | 51.9 |
| school night | b22-proof-3 | none | 0 | 0 | 0.75 | 37 | 43.6 |
| school night | b22-proof-3 | unrelated | 0 | 0 | 0.75 | 37 | 43.6 |
| school night | b22-proof-3 | broad | 0.36 | 0.36 | 0.85 | 42 | 45 |
| school night | b22-proof-3 | kind | 0.585 | 0.585 | 0.913 | 45.1 | 45.5 |
| school night | b22-proof-3 | exact | 0.9 | 0.9 | 1 | 49.4 | 46 |
| taped brief | b22-proof-3 | none | 0 | 0 | 0.75 | 45.6 | 52.4 |
| taped brief | b22-proof-3 | unrelated | 0 | 0 | 0.75 | 45.6 | 52.4 |
| taped brief | b22-proof-3 | broad | 0.36 | 0.36 | 0.85 | 51.7 | 54.5 |
| taped brief | b22-proof-3 | kind | 0.585 | 0.585 | 0.913 | 55.5 | 55.4 |
| taped brief | b22-proof-3 | exact | 0.9 | 0.9 | 1 | 60.8 | 55.9 |
| audition in person | b22-proof-3 | none | 0 | 0 | 0.75 | 34.8 | 44.5 |
| audition in person | b22-proof-3 | unrelated | 0 | 0 | 0.75 | 34.8 | 44.5 |
| audition in person | b22-proof-3 | broad | 0.36 | 0.36 | 0.85 | 39.4 | 46.3 |
| audition in person | b22-proof-3 | kind | 0.585 | 0.585 | 0.913 | 42.3 | 47.4 |
| audition in person | b22-proof-3 | exact | 0.9 | 0.9 | 1 | 46.4 | 48 |
| self-tape | b22-proof-3 | none | 0 | 0 | 0.75 | 36.1 | 45.5 |
| self-tape | b22-proof-3 | unrelated | 0 | 0 | 0.75 | 36.1 | 45.5 |
| self-tape | b22-proof-3 | broad | 0.36 | 0.36 | 0.85 | 40.9 | 47.3 |
| self-tape | b22-proof-3 | kind | 0.585 | 0.585 | 0.913 | 43.9 | 48.5 |
| self-tape | b22-proof-3 | exact | 0.9 | 0.9 | 1 | 48.1 | 49.4 |
| callback | b22-proof-3 | none | 0 | 0 | 0.75 | 32.4 | 41 |
| callback | b22-proof-3 | unrelated | 0 | 0 | 0.75 | 32.4 | 41 |
| callback | b22-proof-3 | broad | 0.36 | 0.36 | 0.85 | 36.8 | 42.7 |
| callback | b22-proof-3 | kind | 0.585 | 0.585 | 0.913 | 39.5 | 43.8 |
| callback | b22-proof-3 | exact | 0.9 | 0.9 | 1 | 43.2 | 44.9 |
| work day | b22-proof-3 | none | 0 | 0 | 0.75 | 34.8 | 43.7 |
| work day | b22-proof-3 | unrelated | 0 | 0 | 0.75 | 34.8 | 43.7 |
| work day | b22-proof-3 | broad | 0.36 | 0.36 | 0.85 | 39.4 | 45.6 |
| work day | b22-proof-3 | kind | 0.585 | 0.585 | 0.913 | 42.3 | 46.8 |
| work day | b22-proof-3 | exact | 0.9 | 0.9 | 1 | 46.4 | 48.5 |
| casting’s fit | b22-proof-3 | none | 0 | 0 |  |  | 0.283 |
| casting’s fit | b22-proof-3 | unrelated | 0 | 0 |  |  | 0.283 |
| casting’s fit | b22-proof-3 | broad | 0.36 | 0.4 |  |  | 0.483 |
| casting’s fit | b22-proof-3 | kind | 0.585 | 0.65 |  |  | 0.608 |
| casting’s fit | b22-proof-3 | exact | 0.9 | 1 |  |  | 0.783 |
| rehearsal day’s lines | b22-proof-3 | none | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-3 | unrelated | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-3 | broad | 0.36 |  |  |  | 0.127 |
| rehearsal day’s lines | b22-proof-3 | kind | 0.585 |  |  |  | 0.132 |
| rehearsal day’s lines | b22-proof-3 | exact | 0.9 |  |  |  | 0.138 |
| school casting | b22-proof-4 | none | 0 |  |  |  | 50.2 |
| school casting | b22-proof-4 | unrelated | 0 |  |  |  | 50.2 |
| school casting | b22-proof-4 | broad | 0.36 |  |  |  | 52.1 |
| school casting | b22-proof-4 | kind | 0.585 |  |  |  | 53.3 |
| school casting | b22-proof-4 | exact | 0.9 |  |  |  | 54.3 |
| school night | b22-proof-4 | none | 0 | 0 | 0.75 | 36.7 | 44.4 |
| school night | b22-proof-4 | unrelated | 0 | 0 | 0.75 | 36.7 | 44.4 |
| school night | b22-proof-4 | broad | 0.36 | 0.36 | 0.85 | 41.6 | 46.2 |
| school night | b22-proof-4 | kind | 0.585 | 0.585 | 0.913 | 44.7 | 47 |
| school night | b22-proof-4 | exact | 0.9 | 0.9 | 1 | 49 | 47.5 |
| taped brief | b22-proof-4 | none | 0 | 0 | 0.75 | 47.1 | 54.2 |
| taped brief | b22-proof-4 | unrelated | 0 | 0 | 0.75 | 47.1 | 54.2 |
| taped brief | b22-proof-4 | broad | 0.36 | 0.36 | 0.85 | 53.4 | 56.4 |
| taped brief | b22-proof-4 | kind | 0.585 | 0.585 | 0.913 | 57.3 | 57 |
| taped brief | b22-proof-4 | exact | 0.9 | 0.9 | 1 | 62.8 | 57.6 |
| audition in person | b22-proof-4 | none | 0 | 0 | 0.75 | 40 | 47.7 |
| audition in person | b22-proof-4 | unrelated | 0 | 0 | 0.75 | 40 | 47.7 |
| audition in person | b22-proof-4 | broad | 0.36 | 0.36 | 0.85 | 45.3 | 49.8 |
| audition in person | b22-proof-4 | kind | 0.585 | 0.585 | 0.913 | 48.6 | 50.8 |
| audition in person | b22-proof-4 | exact | 0.9 | 0.9 | 1 | 53.3 | 51.5 |
| self-tape | b22-proof-4 | none | 0 | 0 | 0.75 | 40.9 | 48.8 |
| self-tape | b22-proof-4 | unrelated | 0 | 0 | 0.75 | 40.9 | 48.8 |
| self-tape | b22-proof-4 | broad | 0.36 | 0.36 | 0.85 | 46.3 | 50.9 |
| self-tape | b22-proof-4 | kind | 0.585 | 0.585 | 0.913 | 49.7 | 52.2 |
| self-tape | b22-proof-4 | exact | 0.9 | 0.9 | 1 | 54.5 | 52.9 |
| callback | b22-proof-4 | none | 0 | 0 | 0.75 | 39.3 | 45.3 |
| callback | b22-proof-4 | unrelated | 0 | 0 | 0.75 | 39.3 | 45.3 |
| callback | b22-proof-4 | broad | 0.36 | 0.36 | 0.85 | 44.5 | 46.5 |
| callback | b22-proof-4 | kind | 0.585 | 0.585 | 0.913 | 47.8 | 47 |
| callback | b22-proof-4 | exact | 0.9 | 0.9 | 1 | 52.4 | 47.7 |
| work day | b22-proof-4 | none | 0 | 0 | 0.75 | 40 | 46.5 |
| work day | b22-proof-4 | unrelated | 0 | 0 | 0.75 | 40 | 46.5 |
| work day | b22-proof-4 | broad | 0.36 | 0.36 | 0.85 | 45.3 | 48.7 |
| work day | b22-proof-4 | kind | 0.585 | 0.585 | 0.913 | 48.6 | 50 |
| work day | b22-proof-4 | exact | 0.9 | 0.9 | 1 | 53.3 | 50.8 |
| casting’s fit | b22-proof-4 | none | 0 | 0 |  |  | 0.285 |
| casting’s fit | b22-proof-4 | unrelated | 0 | 0 |  |  | 0.285 |
| casting’s fit | b22-proof-4 | broad | 0.36 | 0.4 |  |  | 0.485 |
| casting’s fit | b22-proof-4 | kind | 0.585 | 0.65 |  |  | 0.61 |
| casting’s fit | b22-proof-4 | exact | 0.9 | 1 |  |  | 0.785 |
| rehearsal day’s lines | b22-proof-4 | none | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-4 | unrelated | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-4 | broad | 0.36 |  |  |  | 0.127 |
| rehearsal day’s lines | b22-proof-4 | kind | 0.585 |  |  |  | 0.132 |
| rehearsal day’s lines | b22-proof-4 | exact | 0.9 |  |  |  | 0.138 |
| school casting | b22-proof-5 | none | 0 |  |  |  | 50.6 |
| school casting | b22-proof-5 | unrelated | 0 |  |  |  | 50.6 |
| school casting | b22-proof-5 | broad | 0.36 |  |  |  | 52.6 |
| school casting | b22-proof-5 | kind | 0.585 |  |  |  | 53.8 |
| school casting | b22-proof-5 | exact | 0.9 |  |  |  | 54.3 |
| school night | b22-proof-5 | none | 0 | 0 | 0.75 | 37.8 | 45.8 |
| school night | b22-proof-5 | unrelated | 0 | 0 | 0.75 | 37.8 | 45.8 |
| school night | b22-proof-5 | broad | 0.36 | 0.36 | 0.85 | 42.9 | 47.3 |
| school night | b22-proof-5 | kind | 0.585 | 0.585 | 0.913 | 46 | 48 |
| school night | b22-proof-5 | exact | 0.9 | 0.9 | 1 | 50.4 | 48.7 |
| taped brief | b22-proof-5 | none | 0 | 0 | 0.75 | 44.7 | 53 |
| taped brief | b22-proof-5 | unrelated | 0 | 0 | 0.75 | 44.7 | 53 |
| taped brief | b22-proof-5 | broad | 0.36 | 0.36 | 0.85 | 50.6 | 55 |
| taped brief | b22-proof-5 | kind | 0.585 | 0.585 | 0.913 | 54.4 | 56.2 |
| taped brief | b22-proof-5 | exact | 0.9 | 0.9 | 1 | 59.6 | 56.8 |
| audition in person | b22-proof-5 | none | 0 | 0 | 0.75 | 38.3 | 45.6 |
| audition in person | b22-proof-5 | unrelated | 0 | 0 | 0.75 | 38.3 | 45.6 |
| audition in person | b22-proof-5 | broad | 0.36 | 0.36 | 0.85 | 43.5 | 46.8 |
| audition in person | b22-proof-5 | kind | 0.585 | 0.585 | 0.913 | 46.6 | 47.3 |
| audition in person | b22-proof-5 | exact | 0.9 | 0.9 | 1 | 51.1 | 47.9 |
| self-tape | b22-proof-5 | none | 0 | 0 | 0.75 | 37.5 | 45.8 |
| self-tape | b22-proof-5 | unrelated | 0 | 0 | 0.75 | 37.5 | 45.8 |
| self-tape | b22-proof-5 | broad | 0.36 | 0.36 | 0.85 | 42.5 | 47.8 |
| self-tape | b22-proof-5 | kind | 0.585 | 0.585 | 0.913 | 45.7 | 49 |
| self-tape | b22-proof-5 | exact | 0.9 | 0.9 | 1 | 50 | 50 |
| callback | b22-proof-5 | none | 0 | 0 | 0.75 | 32.4 | 39.7 |
| callback | b22-proof-5 | unrelated | 0 | 0 | 0.75 | 32.4 | 39.7 |
| callback | b22-proof-5 | broad | 0.36 | 0.36 | 0.85 | 36.8 | 40.8 |
| callback | b22-proof-5 | kind | 0.585 | 0.585 | 0.913 | 39.5 | 41.2 |
| callback | b22-proof-5 | exact | 0.9 | 0.9 | 1 | 43.2 | 41.7 |
| work day | b22-proof-5 | none | 0 | 0 | 0.75 | 38.3 | 44.6 |
| work day | b22-proof-5 | unrelated | 0 | 0 | 0.75 | 38.3 | 44.6 |
| work day | b22-proof-5 | broad | 0.36 | 0.36 | 0.85 | 43.5 | 46.8 |
| work day | b22-proof-5 | kind | 0.585 | 0.585 | 0.913 | 46.6 | 48.1 |
| work day | b22-proof-5 | exact | 0.9 | 0.9 | 1 | 51.1 | 49 |
| casting’s fit | b22-proof-5 | none | 0 | 0 |  |  | 0.257 |
| casting’s fit | b22-proof-5 | unrelated | 0 | 0 |  |  | 0.257 |
| casting’s fit | b22-proof-5 | broad | 0.36 | 0.4 |  |  | 0.457 |
| casting’s fit | b22-proof-5 | kind | 0.585 | 0.65 |  |  | 0.582 |
| casting’s fit | b22-proof-5 | exact | 0.9 | 1 |  |  | 0.757 |
| rehearsal day’s lines | b22-proof-5 | none | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-5 | unrelated | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-5 | broad | 0.36 |  |  |  | 0.127 |
| rehearsal day’s lines | b22-proof-5 | kind | 0.585 |  |  |  | 0.132 |
| rehearsal day’s lines | b22-proof-5 | exact | 0.9 |  |  |  | 0.138 |
| school casting | b22-proof-6 | none | 0 |  |  |  | 53.1 |
| school casting | b22-proof-6 | unrelated | 0 |  |  |  | 53.1 |
| school casting | b22-proof-6 | broad | 0.36 |  |  |  | 55.1 |
| school casting | b22-proof-6 | kind | 0.585 |  |  |  | 56.4 |
| school casting | b22-proof-6 | exact | 0.9 |  |  |  | 58.1 |
| school night | b22-proof-6 | none | 0 | 0 | 0.75 | 41 | 49 |
| school night | b22-proof-6 | unrelated | 0 | 0 | 0.75 | 41 | 49 |
| school night | b22-proof-6 | broad | 0.36 | 0.36 | 0.85 | 46.5 | 50.2 |
| school night | b22-proof-6 | kind | 0.585 | 0.585 | 0.913 | 49.9 | 50.5 |
| school night | b22-proof-6 | exact | 0.9 | 0.9 | 1 | 54.7 | 51 |
| taped brief | b22-proof-6 | none | 0 | 0 | 0.75 | 48.2 | 56.1 |
| taped brief | b22-proof-6 | unrelated | 0 | 0 | 0.75 | 48.2 | 56.1 |
| taped brief | b22-proof-6 | broad | 0.36 | 0.36 | 0.85 | 54.6 | 58.2 |
| taped brief | b22-proof-6 | kind | 0.585 | 0.585 | 0.913 | 58.6 | 58.7 |
| taped brief | b22-proof-6 | exact | 0.9 | 0.9 | 1 | 64.3 | 59.2 |
| audition in person | b22-proof-6 | none | 0 | 0 | 0.75 | 41.8 | 51.1 |
| audition in person | b22-proof-6 | unrelated | 0 | 0 | 0.75 | 41.8 | 51.1 |
| audition in person | b22-proof-6 | broad | 0.36 | 0.36 | 0.85 | 47.3 | 52.6 |
| audition in person | b22-proof-6 | kind | 0.585 | 0.585 | 0.913 | 50.8 | 53.2 |
| audition in person | b22-proof-6 | exact | 0.9 | 0.9 | 1 | 55.7 | 53.9 |
| self-tape | b22-proof-6 | none | 0 | 0 | 0.75 | 43.1 | 51.7 |
| self-tape | b22-proof-6 | unrelated | 0 | 0 | 0.75 | 43.1 | 51.7 |
| self-tape | b22-proof-6 | broad | 0.36 | 0.36 | 0.85 | 48.9 | 53.9 |
| self-tape | b22-proof-6 | kind | 0.585 | 0.585 | 0.913 | 52.5 | 54.9 |
| self-tape | b22-proof-6 | exact | 0.9 | 0.9 | 1 | 57.5 | 55.6 |
| callback | b22-proof-6 | none | 0 | 0 | 0.75 | 41.4 | 47.6 |
| callback | b22-proof-6 | unrelated | 0 | 0 | 0.75 | 41.4 | 47.6 |
| callback | b22-proof-6 | broad | 0.36 | 0.36 | 0.85 | 47 | 48.7 |
| callback | b22-proof-6 | kind | 0.585 | 0.585 | 0.913 | 50.4 | 49.2 |
| callback | b22-proof-6 | exact | 0.9 | 0.9 | 1 | 55.3 | 49.9 |
| work day | b22-proof-6 | none | 0 | 0 | 0.75 | 41.8 | 50.1 |
| work day | b22-proof-6 | unrelated | 0 | 0 | 0.75 | 41.8 | 50.1 |
| work day | b22-proof-6 | broad | 0.36 | 0.36 | 0.85 | 47.3 | 52.4 |
| work day | b22-proof-6 | kind | 0.585 | 0.585 | 0.913 | 50.8 | 53.8 |
| work day | b22-proof-6 | exact | 0.9 | 0.9 | 1 | 55.7 | 54.7 |
| casting’s fit | b22-proof-6 | none | 0 | 0 |  |  | 0.304 |
| casting’s fit | b22-proof-6 | unrelated | 0 | 0 |  |  | 0.304 |
| casting’s fit | b22-proof-6 | broad | 0.36 | 0.4 |  |  | 0.504 |
| casting’s fit | b22-proof-6 | kind | 0.585 | 0.65 |  |  | 0.629 |
| casting’s fit | b22-proof-6 | exact | 0.9 | 1 |  |  | 0.804 |
| rehearsal day’s lines | b22-proof-6 | none | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-6 | unrelated | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-6 | broad | 0.36 |  |  |  | 0.127 |
| rehearsal day’s lines | b22-proof-6 | kind | 0.585 |  |  |  | 0.132 |
| rehearsal day’s lines | b22-proof-6 | exact | 0.9 |  |  |  | 0.138 |
| school casting | b22-proof-7 | none | 0 |  |  |  | 51.7 |
| school casting | b22-proof-7 | unrelated | 0 |  |  |  | 51.7 |
| school casting | b22-proof-7 | broad | 0.36 |  |  |  | 53.7 |
| school casting | b22-proof-7 | kind | 0.585 |  |  |  | 54.9 |
| school casting | b22-proof-7 | exact | 0.9 |  |  |  | 56.1 |
| school night | b22-proof-7 | none | 0 | 0 | 0.75 | 40.4 | 46.7 |
| school night | b22-proof-7 | unrelated | 0 | 0 | 0.75 | 40.4 | 46.7 |
| school night | b22-proof-7 | broad | 0.36 | 0.36 | 0.85 | 45.8 | 47.7 |
| school night | b22-proof-7 | kind | 0.585 | 0.585 | 0.913 | 49.2 | 48 |
| school night | b22-proof-7 | exact | 0.9 | 0.9 | 1 | 53.9 | 48.5 |
| taped brief | b22-proof-7 | none | 0 | 0 | 0.75 | 48.8 | 56.7 |
| taped brief | b22-proof-7 | unrelated | 0 | 0 | 0.75 | 48.8 | 56.7 |
| taped brief | b22-proof-7 | broad | 0.36 | 0.36 | 0.85 | 55.4 | 58.9 |
| taped brief | b22-proof-7 | kind | 0.585 | 0.585 | 0.913 | 59.4 | 59.4 |
| taped brief | b22-proof-7 | exact | 0.9 | 0.9 | 1 | 65.1 | 60 |
| audition in person | b22-proof-7 | none | 0 | 0 | 0.75 | 43.5 | 49.2 |
| audition in person | b22-proof-7 | unrelated | 0 | 0 | 0.75 | 43.5 | 49.2 |
| audition in person | b22-proof-7 | broad | 0.36 | 0.36 | 0.85 | 49.2 | 50.1 |
| audition in person | b22-proof-7 | kind | 0.585 | 0.585 | 0.913 | 52.9 | 50.6 |
| audition in person | b22-proof-7 | exact | 0.9 | 0.9 | 1 | 57.9 | 51.3 |
| self-tape | b22-proof-7 | none | 0 | 0 | 0.75 | 44.4 | 51.6 |
| self-tape | b22-proof-7 | unrelated | 0 | 0 | 0.75 | 44.4 | 51.6 |
| self-tape | b22-proof-7 | broad | 0.36 | 0.36 | 0.85 | 50.4 | 52.9 |
| self-tape | b22-proof-7 | kind | 0.585 | 0.585 | 0.913 | 54.1 | 53.4 |
| self-tape | b22-proof-7 | exact | 0.9 | 0.9 | 1 | 59.2 | 54.1 |
| callback | b22-proof-7 | none | 0 | 0 | 0.75 | 41.8 | 43.8 |
| callback | b22-proof-7 | unrelated | 0 | 0 | 0.75 | 41.8 | 43.8 |
| callback | b22-proof-7 | broad | 0.36 | 0.36 | 0.85 | 47.4 | 44.6 |
| callback | b22-proof-7 | kind | 0.585 | 0.585 | 0.913 | 50.9 | 45.2 |
| callback | b22-proof-7 | exact | 0.9 | 0.9 | 1 | 55.7 | 45.9 |
| work day | b22-proof-7 | none | 0 | 0 | 0.75 | 43.5 | 50.5 |
| work day | b22-proof-7 | unrelated | 0 | 0 | 0.75 | 43.5 | 50.5 |
| work day | b22-proof-7 | broad | 0.36 | 0.36 | 0.85 | 49.2 | 52.2 |
| work day | b22-proof-7 | kind | 0.585 | 0.585 | 0.913 | 52.9 | 52.8 |
| work day | b22-proof-7 | exact | 0.9 | 0.9 | 1 | 57.9 | 53.6 |
| casting’s fit | b22-proof-7 | none | 0 | 0 |  |  | 0.304 |
| casting’s fit | b22-proof-7 | unrelated | 0 | 0 |  |  | 0.304 |
| casting’s fit | b22-proof-7 | broad | 0.36 | 0.4 |  |  | 0.504 |
| casting’s fit | b22-proof-7 | kind | 0.585 | 0.65 |  |  | 0.629 |
| casting’s fit | b22-proof-7 | exact | 0.9 | 1 |  |  | 0.804 |
| rehearsal day’s lines | b22-proof-7 | none | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-7 | unrelated | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-7 | broad | 0.36 |  |  |  | 0.127 |
| rehearsal day’s lines | b22-proof-7 | kind | 0.585 |  |  |  | 0.132 |
| rehearsal day’s lines | b22-proof-7 | exact | 0.9 |  |  |  | 0.138 |
| school casting | b22-proof-8 | none | 0 |  |  |  | 51.5 |
| school casting | b22-proof-8 | unrelated | 0 |  |  |  | 51.5 |
| school casting | b22-proof-8 | broad | 0.36 |  |  |  | 53.4 |
| school casting | b22-proof-8 | kind | 0.585 |  |  |  | 54.6 |
| school casting | b22-proof-8 | exact | 0.9 |  |  |  | 55.9 |
| school night | b22-proof-8 | none | 0 | 0 | 0.75 | 38 | 45.3 |
| school night | b22-proof-8 | unrelated | 0 | 0 | 0.75 | 38 | 45.3 |
| school night | b22-proof-8 | broad | 0.36 | 0.36 | 0.85 | 43.1 | 46.6 |
| school night | b22-proof-8 | kind | 0.585 | 0.585 | 0.913 | 46.3 | 46.9 |
| school night | b22-proof-8 | exact | 0.9 | 0.9 | 1 | 50.7 | 47.4 |
| taped brief | b22-proof-8 | none | 0 | 0 | 0.75 | 49.3 | 57.1 |
| taped brief | b22-proof-8 | unrelated | 0 | 0 | 0.75 | 49.3 | 57.1 |
| taped brief | b22-proof-8 | broad | 0.36 | 0.36 | 0.85 | 55.8 | 59.1 |
| taped brief | b22-proof-8 | kind | 0.585 | 0.585 | 0.913 | 59.9 | 59.6 |
| taped brief | b22-proof-8 | exact | 0.9 | 0.9 | 1 | 65.7 | 60.1 |
| audition in person | b22-proof-8 | none | 0 | 0 | 0.75 | 43.5 | 51.7 |
| audition in person | b22-proof-8 | unrelated | 0 | 0 | 0.75 | 43.5 | 51.7 |
| audition in person | b22-proof-8 | broad | 0.36 | 0.36 | 0.85 | 49.4 | 52.5 |
| audition in person | b22-proof-8 | kind | 0.585 | 0.585 | 0.913 | 53 | 53.1 |
| audition in person | b22-proof-8 | exact | 0.9 | 0.9 | 1 | 58.1 | 53.8 |
| self-tape | b22-proof-8 | none | 0 | 0 | 0.75 | 45.4 | 53.2 |
| self-tape | b22-proof-8 | unrelated | 0 | 0 | 0.75 | 45.4 | 53.2 |
| self-tape | b22-proof-8 | broad | 0.36 | 0.36 | 0.85 | 51.5 | 54.9 |
| self-tape | b22-proof-8 | kind | 0.585 | 0.585 | 0.913 | 55.2 | 55.4 |
| self-tape | b22-proof-8 | exact | 0.9 | 0.9 | 1 | 60.5 | 56.1 |
| callback | b22-proof-8 | none | 0 | 0 | 0.75 | 42.2 | 49.8 |
| callback | b22-proof-8 | unrelated | 0 | 0 | 0.75 | 42.2 | 49.8 |
| callback | b22-proof-8 | broad | 0.36 | 0.36 | 0.85 | 47.8 | 50.7 |
| callback | b22-proof-8 | kind | 0.585 | 0.585 | 0.913 | 51.3 | 51.2 |
| callback | b22-proof-8 | exact | 0.9 | 0.9 | 1 | 56.3 | 51.9 |
| work day | b22-proof-8 | none | 0 | 0 | 0.75 | 43.5 | 51.7 |
| work day | b22-proof-8 | unrelated | 0 | 0 | 0.75 | 43.5 | 51.7 |
| work day | b22-proof-8 | broad | 0.36 | 0.36 | 0.85 | 49.4 | 54 |
| work day | b22-proof-8 | kind | 0.585 | 0.585 | 0.913 | 53 | 54.6 |
| work day | b22-proof-8 | exact | 0.9 | 0.9 | 1 | 58.1 | 55.4 |
| casting’s fit | b22-proof-8 | none | 0 | 0 |  |  | 0.32 |
| casting’s fit | b22-proof-8 | unrelated | 0 | 0 |  |  | 0.32 |
| casting’s fit | b22-proof-8 | broad | 0.36 | 0.4 |  |  | 0.52 |
| casting’s fit | b22-proof-8 | kind | 0.585 | 0.65 |  |  | 0.645 |
| casting’s fit | b22-proof-8 | exact | 0.9 | 1 |  |  | 0.82 |
| rehearsal day’s lines | b22-proof-8 | none | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-8 | unrelated | 0 |  |  |  | 0.12 |
| rehearsal day’s lines | b22-proof-8 | broad | 0.36 |  |  |  | 0.127 |
| rehearsal day’s lines | b22-proof-8 | kind | 0.585 |  |  |  | 0.132 |
| rehearsal day’s lines | b22-proof-8 | exact | 0.9 |  |  |  | 0.138 |

## The Verdict

| Path | Median gain: unrelated | broad | kind | exact | K1 | K2 |
|---|---|---|---|---|---|---|
| school casting | 0 | 1.9 | 3.1 | 4.4 | holds | holds |
| school night | 0 | 1.45 | 2.05 | 2.55 | holds | holds |
| taped brief | 0 | 2.1 | 2.7 | 3.25 | holds | holds |
| audition in person | 0 | 1.35 | 1.9 | 2.55 | holds | holds |
| self-tape | 0 | 2 | 3.05 | 3.85 | holds | holds |
| callback | 0 | 1 | 1.45 | 2.1 | holds | holds |
| work day | 0 | 2.2 | 3.3 | 4.3 | holds | holds |
| casting’s fit | 0 | 0.2 | 0.325 | 0.5 | holds | holds |
| rehearsal day’s lines | 0 | 0.007 | 0.012 | 0.018 | holds | holds |
