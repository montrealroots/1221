# Brief 21's Genre Proof, The Table

Written by `genre-proof.ts` from the scenarios `tests/b21-genre-proof.test.ts` asserts. The same actor on the same day,
with the same preparation and the same draw, read with only the genres they know changed. Seeds: `b21-proof-1`, `b21-proof-2`, `b21-proof-3`, `b21-proof-4`, `b21-proof-5`, `b21-proof-6`.
Records: every relevant genre at 0 (low), 45 (medium) and 90 (the most that counts); the first
requirement at 100 and the rest at 0 (one mastered); all at 100; and only an unrelated genre (`western`) at 100.

Each cell is the whole (the overall, 0 to 100) over the six seeds, low to high; the genre part and the choices'
preparation are the first seed's, with the choices' quality in brackets. "Adds" is what the most that counts adds to the
whole over knowing none: the smallest, the median and the largest over the seeds.

| Path | Material | Shape | Low | Medium | Max | One mastered | All mastered | Unrelated | Part at low, max | Prepared at low, max | Adds: least, median, most |
|---|---|---|---|---|---|---|---|---|---|---|---|
| school casting | Riders To The Sea | single | 49.8–53.5 | 52–56.1 | 53.9–57.3 | 53.9–57.3 | 53.9–57.3 | 49.8–53.5 | (the fit) |  | 3.8, 4.1, 4.5 |
| school casting | Blood Wedding | even two | 52.7–55.3 | 55–57.9 | 56.9–59 | 55.3–58.1 | 56.9–59 | 52.7–55.3 | (the fit) |  | 3.7, 4.1, 4.5 |
| school casting | The Wild Duck | dominated | 53.2–55.8 | 55.4–58.3 | 57.1–59.1 | 54.4–57.2 | 57.1–59.1 | 53.2–55.8 | (the fit) |  | 3.3, 3.7, 3.9 |
| school casting | Macbeth | three | 50.9–54.1 | 53.1–56.6 | 54.7–57.4 | 53.4–56.9 | 54.7–57.4 | 50.9–54.1 | (the fit) |  | 3.3, 3.6, 3.9 |
| school casting | A Midsummer Night’s Dream | overlapping | 50.5–53.9 | 52.8–56.4 | 54.9–57.7 | 54.4–57.5 | 54.9–57.7 | 50.5–53.9 | (the fit) |  | 3.8, 4.2, 4.4 |
| school night | Riders To The Sea | single | 43–47.6 | 45–49.8 | 46.4–50.6 | 46.4–50.6 | 46.4–50.6 | 43–47.6 | 0, 0.9 | 0.75 (39), 1 (51.9) | 2.2, 2.8, 3.4 |
| school night | Blood Wedding | even two | 43–47.3 | 44.8–48 | 45.7–48.7 | 45–48.1 | 45.7–48.7 | 43–47.3 | 0, 0.9 | 0.75 (40), 1 (53.3) | 1.4, 1.8, 2.7 |
| school night | The Wild Duck | dominated | 45.5–47.5 | 46.9–48.7 | 47.3–49.2 | 46.5–48.3 | 47.3–49.2 | 45.5–47.5 | 0, 0.9 | 0.75 (40.6), 1 (54.1) | 1.5, 1.8, 2.2 |
| school night | Macbeth | three | 42.6–46.7 | 43.6–47.6 | 44.2–48.1 | 43.7–47.7 | 44.2–48.1 | 42.6–46.7 | 0, 0.9 | 0.75 (41.8), 1 (55.8) | 1.2, 1.5, 1.7 |
| school night | A Midsummer Night’s Dream | overlapping | 42.5–45.4 | 43.9–46.1 | 44.5–46.7 | 44.3–46.5 | 44.5–46.7 | 42.5–45.4 | 0, 0.9 | 0.75 (40.5), 1 (54) | 1.3, 1.7, 2.4 |
| audition in person | Static On Route 9 | overlapping | 46.3–50.3 | 48.4–51.8 | 49.3–52.9 | 49.3–52.9 | 49.3–52.9 | 46.3–50.3 | 0, 0.9 | 0.75 (42.9), 1 (57.2) | 2.1, 2.8, 3.7 |
| audition in person | The Calloway Files | overlapping | 47.5–53.3 | 49.1–54.5 | 50.3–55.7 | 50.3–55.7 | 50.3–55.7 | 47.5–53.3 | 0, 0.9 | 0.75 (44.3), 1 (59.1) | 2.3, 2.7, 3.7 |
| audition in person | Last Bus To Eastview | single | 48.7–52.5 | 50.3–54.6 | 51.4–55.7 | 51.4–55.7 | 51.4–55.7 | 48.7–52.5 | 0, 0.9 | 0.75 (41.4), 1 (55.2) | 2.1, 2.9, 3.6 |
| audition in person | A House On Calder Street | overlapping | 46.5–50.3 | 48.5–52.1 | 49.5–53.2 | 49.5–53.2 | 49.5–53.2 | 46.5–50.3 | 0, 0.9 | 0.75 (39.4), 1 (52.5) | 2.1, 2.7, 3.2 |
| audition in person | Static On Route 9, listed horror and comedy | even two | 46.3–50.3 | 48.4–51.8 | 49.3–52.9 | 48.5–51.9 | 49.3–52.9 | 46.3–50.3 | 0, 0.9 | 0.75 (42.9), 1 (57.2) | 2.1, 2.8, 3.7 |
| audition in person | Static On Route 9, listed horror, comedy and romance | three | 46.3–50.3 | 48.4–51.8 | 49.3–52.9 | 48.5–51.9 | 49.3–52.9 | 46.3–50.3 | 0, 0.9 | 0.75 (42.9), 1 (57.2) | 2.1, 2.8, 3.7 |
| self-tape | Static On Route 9 | overlapping | 48.2–51.8 | 50.8–54.7 | 52.1–55.8 | 52.1–55.8 | 52.1–55.8 | 48.2–51.8 | 0, 0.9 | 0.75 (43.3), 1 (57.8) | 3.5, 3.8, 4.2 |
| self-tape | The Calloway Files | overlapping | 49–53.8 | 51.8–56.4 | 53.2–57.5 | 53.2–57.5 | 53.2–57.5 | 49–53.8 | 0, 0.9 | 0.75 (44.9), 1 (59.9) | 3, 4, 4.4 |
| self-tape | Last Bus To Eastview | single | 50.4–54.5 | 53.1–55.9 | 54.1–57 | 54.1–57 | 54.1–57 | 50.4–54.5 | 0, 0.9 | 0.75 (42.8), 1 (57.1) | 2.5, 3.5, 4.4 |
| self-tape | A House On Calder Street | overlapping | 47.9–51.3 | 50.5–54 | 52.2–55.6 | 52.2–55.6 | 52.2–55.6 | 47.9–51.3 | 0, 0.9 | 0.75 (40.6), 1 (54.1) | 2.8, 3.9, 4.3 |
| self-tape | Static On Route 9, listed horror and comedy | even two | 48.2–51.8 | 50.8–54.7 | 52.1–55.8 | 51.1–54.9 | 52.1–55.8 | 48.2–51.8 | 0, 0.9 | 0.75 (43.3), 1 (57.8) | 3.5, 3.8, 4.2 |
| self-tape | Static On Route 9, listed horror, comedy and romance | three | 48.2–51.8 | 50.8–54.7 | 52.1–55.8 | 51.1–54.9 | 52.1–55.8 | 48.2–51.8 | 0, 0.9 | 0.75 (43.3), 1 (57.8) | 3.5, 3.8, 4.2 |
| callback | Static On Route 9 | overlapping | 42.1–48.8 | 43.9–50.8 | 44.8–51.8 | 44.8–51.8 | 44.8–51.8 | 42.1–48.8 | 0, 0.9 | 0.75 (35.9), 1 (47.8) | 2, 2.8, 3.9 |
| callback | The Calloway Files | overlapping | 44.9–47.8 | 46.7–49 | 47.7–50.1 | 47.7–50.1 | 47.7–50.1 | 44.9–47.8 | 0, 0.9 | 0.75 (39.1), 1 (52.1) | 2.1, 2.3, 3.9 |
| callback | Last Bus To Eastview | single | 45.3–48.4 | 47.9–50.8 | 49.2–51.9 | 49.2–51.9 | 49.2–51.9 | 45.3–48.4 | 0, 0.9 | 0.75 (38.9), 1 (51.9) | 2.3, 3.4, 4.1 |
| callback | A House On Calder Street | overlapping | 44.2–49.3 | 46.2–51 | 47.1–52 | 47.1–52 | 47.1–52 | 44.2–49.3 | 0, 0.9 | 0.75 (37.3), 1 (49.7) | 2.2, 2.8, 2.9 |
| callback | Static On Route 9, listed horror and comedy | even two | 42.1–48.8 | 43.9–50.8 | 44.8–51.8 | 44–50.9 | 44.8–51.8 | 42.1–48.8 | 0, 0.9 | 0.75 (35.9), 1 (47.8) | 2, 2.8, 3.9 |
| callback | Static On Route 9, listed horror, comedy and romance | three | 42.1–48.8 | 43.9–50.8 | 44.8–51.8 | 44–50.9 | 44.8–51.8 | 42.1–48.8 | 0, 0.9 | 0.75 (35.9), 1 (47.8) | 2, 2.8, 3.9 |
| work day | Static On Route 9 | overlapping | 45–49.9 | 47.6–52.7 | 48.6–54.3 | 48.6–54.3 | 48.6–54.3 | 45–49.9 | 0, 0.9 | 0.75 (42.9), 1 (57.2) | 3.6, 4, 4.4 |
| work day | The Calloway Files | overlapping | 45.7–52.4 | 48.4–55.4 | 50.3–56.8 | 50.3–56.8 | 50.3–56.8 | 45.7–52.4 | 0, 0.9 | 0.75 (44.3), 1 (59.1) | 3.6, 4.5, 4.7 |
| work day | Last Bus To Eastview | single | 47.3–52.6 | 50.3–54.8 | 51.6–56.8 | 51.6–56.8 | 51.6–56.8 | 47.3–52.6 | 0, 0.9 | 0.75 (41.4), 1 (55.2) | 3.4, 4.5, 5.5 |
| work day | A House On Calder Street | overlapping | 48.2–52.5 | 50.8–53.4 | 52.2–54.4 | 52.2–54.4 | 52.2–54.4 | 48.2–52.5 | 0, 0.9 | 0.75 (38.8), 1 (51.7) | 1.9, 3.5, 4.9 |
| work day | Static On Route 9, listed horror and comedy | even two | 45–49.9 | 47.6–52.7 | 48.6–54.3 | 47.7–53 | 48.6–54.3 | 45–49.9 | 0, 0.9 | 0.75 (42.9), 1 (57.2) | 3.6, 4, 4.4 |
| work day | Static On Route 9, listed horror, comedy and romance | three | 45–49.9 | 47.6–52.7 | 48.6–54.3 | 47.7–53 | 48.6–54.3 | 45–49.9 | 0, 0.9 | 0.75 (42.9), 1 (57.2) | 3.6, 4, 4.4 |

## Casting's Reading And A Rehearsal Day

| Project | Genre half, low / medium / max | Fit, low / max (first seed) | Chance of a Strong final round, low / max (first seed) | A rehearsal day's lines from none, low / max |
|---|---|---|---|---|
| Static On Route 9 | 0 / 0.5 / 1 | 0.291 / 0.791 | 0.218 / 0.332 | 0.12 / 0.138 |
| The Calloway Files | 0 / 0.5 / 1 | 0.288 / 0.788 | 0.163 / 0.249 | 0.12 / 0.138 |
| Last Bus To Eastview | 0 / 0.5 / 1 | 0.307 / 0.807 | 0.266 / 0.403 | 0.12 / 0.138 |
| A House On Calder Street | 0 / 0.5 / 1 | 0.302 / 0.802 | 0.177 / 0.268 | 0.12 / 0.138 |
| Static On Route 9, listed horror and comedy | 0 / 0.5 / 1 | 0.291 / 0.791 | 0.218 / 0.332 | 0.12 / 0.138 |
| Static On Route 9, listed horror, comedy and romance | 0 / 0.5 / 1 | 0.291 / 0.791 | 0.218 / 0.332 | 0.12 / 0.138 |
