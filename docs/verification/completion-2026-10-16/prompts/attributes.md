# Brief 11, Attributes: Criteria Judged By Reading, And Health, Stamina And Energy (2026-10-16)

Read `common.md` first. Your area is `attributes`; your clone is `…/scratchpad/attributes11`, branch `attributes11`.

## The Rows

| Row | What it lacks at the baseline |
|---|---|
| `A4` What the game says an ability does, it does | Judged by reading the code (`docs/verification/attributes-genres-2026-10-16/phase-2b.md` §9); no assertion would fail if it stopped holding |
| `A5` Every ability can be developed by an action the player chooses, and says what moved | the same |
| `T1` Training says its value before and after | the same |
| `O3` Grades and bands read the personal result; casting the expected; preparation and condition named as limits | the same |
| `F1` Every note names what the evaluation found | the same |
| `F3` Feedback says the condition and the preparation apart from ability | the same |
| `A1` (Brief 10 Area: judge) | Stamina's figure held by a measurement only (`tools/ag-baseline.ts`, `tools/ag-criteria.mjs`) |
| `stamina.A1` | The same requirement for stamina: met by measurement, no gate test holds it |

Each criterion's exact words are in `docs/verification/attributes-genres-2026-10-16/acceptance-criteria.md`. For A4 to F3:
for each of the twelve abilities (and each kind of work the criterion names), a test through the commands and the drawn
screens that fails if the criterion stops holding: what the screen says the ability does, set against what changes when
it changes (A4); the action that develops it, and the notice that says what moved (A5); the value said before and after
training (T1); a grade read from the personal result, a casting from the expected one, preparation and condition named
as limits (O3); each note naming what the evaluation found (F1); condition and preparation said apart from ability (F3).
Extend `tests/attributes-phase-2b.test.ts` or the tests it sits beside before adding a file. Where a criterion covers all
twelve abilities, the test covers all twelve, not a sample.

For A1 and stamina.A1: a gate test of each ability's largest effect, at a cost the gate can carry (A1's threshold: each of
the twelve has a kind of work where +10 moves the mean result by 0.5 or more). Read how `tools/ag-baseline.ts` measures it
and hold the same quantity on a small fixed set of materials, its figures worked from the rule. Leave the full measurement
(its command and output file) for the coordinator to run on the tested commit.

## Brief 11, Section 7: Health, Stamina And Energy Kept Apart

Health is illness, injury, treatment and recovery; stamina is sustained exertion capacity; energy (fatigue, readiness) is
how ready the student is now. Through played journeys, check what the existing scope already requires:

- An established illness or injury affects participation, readiness, exertion or recovery where the scope says it should,
  and the player is told so.
- The same impairment isn't counted twice through two systems (for one, a flu lowering readiness and also, separately,
  the same night's result through stamina).
- Rest restores energy. It doesn't cure an illness, and it doesn't build long-term fitness at once.

Record what you checked, with the tests that show it. A defect against an existing requirement is fixed and recorded as
`added`. Don't add a new health connection the scope doesn't ask for.
