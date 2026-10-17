# Brief 11: Criterion Clarifications, 2026-10-17

Each is written and committed before the test it touches changes (`prompts/common.md`): the criterion, the approved
behavior it maps to, quoted from the brief or decision that approved it, the clarification, and the earlier result kept.
A clarification here makes a criterion read what the approved design asks; none is made because the new reading passes.

## Acting (ST6-R)

### A1. ST6-R (g)'s first item is read against (b′), with (b) kept as written

**Rows:** `ST6-R.g`, `ST6-R.bPrime` (the baseline's Decision Required, "whether (b′) replaces (b)").

**The criterion** (`../decisions-2026-10-16/criteria.md`, ST6-R):

- (b) "Restraint's own craft pays. On at least 90% of all materials where both sides fit, the restrained specialist's
  lift over the even actor (the same side for each) is larger playing restrained than playing expansive. This is what
  fails when restraint is useless: if choosing it drew on nothing, the lift would be the same either way."
- (g) "Run in a copy against each of these, it fails: restraint's draws removed (b); …"

**The approved behavior it maps to:**

- Brief 10, ST6, the owner's: "A revised test must still catch a system where restraint is effectively useless."
- Brief 11, section 8: "Ensure tests detect when restraint's own relevant abilities cease to matter." and "Do not declare
  all of ST6 resolved because one replacement subclause passes."

**Why (b) as written contradicts it, measured.** With restraint's draws removed in a copy
(`APPROACH_EFFECT.restrained.inputs` set to nothing, the mutation `st6-no-draws`), (b) still holds on 96 of 96: expansive's
draws read this specialist's weakest abilities (presence, the voice, the body at 40.56), so its lift playing expansive is
lower whatever restraint draws. The rationale (b) gives for itself, "if choosing it drew on nothing, the lift would be the
same either way", doesn't hold on this engine, and (g) can't be met through (b).

**The clarification.** (b) stays as written, measured and reported (96 of 96, met). (g)'s first item is read against
**(b′)**, the comparison (b)'s own rationale describes: on at least 90% of the materials where both sides fit ((b)'s
floor), the restrained specialist's lift over the even actor, both playing restrained, is more than 0.05 larger with
restraint's draws than with them taken out. It's read because it's the one of the two that fails when restraint draws on
nothing, measured; that it passes on the engine isn't the reason.

**The earlier result, kept** (`../decisions-2026-10-16/integrated/after/st6.json` and `mutations.json`; again on this
clone's commit in `acting/`):

| | On the engine | Restraint's draws removed |
|---|---|---|
| (b) as written | 96 of 96 | 96 of 96: survives |
| (b′) | 96 of 96, the draws' part 0.329 at least | 0 of 96: killed |

**What this doesn't settle.** ST6-R (a), (c) and (e), and (g)'s second and third items, are a decision, put with its
evidence in `acting-result.json`. (b′) passing doesn't resolve ST6.

**The test.** `tests/decisions-judge.test.ts`, "restraint's own craft pays: …", already held (b′) on every material, more
strictly (the draws' part over 0.3); its title and assertions are unchanged.

### A2. How (g) reads "it fails": against a clause that holds without the mutation

**Row:** `ST6-R.g`.

**The criterion:** (g) "Run in a copy against each of these, it fails: restraint's draws removed (b); restrained
suitability forced to its least on every material (a or c); the grain removed (c or d)."

**The approved behavior it maps to:** brief 10, ST6, "A revised test must still catch a system where restraint is
effectively useless"; criteria.md's own "It catches what it should".

**The clarification.** A mutation is caught where a clause, or a named part of one, that holds on the engine fails with
the mutation in place. A clause that fails on the engine can't tell the mutated engine from the real one, so its
failing under a mutation catches nothing. This is a stricter reading than brief 10's record, never a looser one, and it
changes no test.

**The earlier result, kept.** Brief 10's `mutations.json` recorded `st6-least` and `st6-no-grain` as killed, beside the
note that (a) and (c) fail unmutated. Read this way, measured again on this clone's commit (`acting/mutations-st6.json`):
restrained suitability forced to its least turns (c) from failing to met; the grain removed turns (a) from failing to met.
Neither is caught by the clauses (g) names.

## Advice (L1, F2-A10)

### L1: Repeated Feedback Changes Or Is Acted On

**As written** (`../attributes-genres-2026-10-16/acceptance-criteria.md`): "Repeated feedback changes or is acted on. A
note given for weeks unchanged is noise. The top recommendation each week of a 120-day played term
(`tools/brief-journeys.ts`, beginner and specialist, seed `bj-0`): the longest run of one target. At most 4 weeks running
without its input rising 5 points."

**The approved behavior it maps to.**

- Brief 10, section 2, the owner's approval of F2-A and what the recommendation must do: "Uses the real progression curve,
  costs, and available actions", "Produces useful improvement compared with reasonable alternatives over an equivalent
  training budget" and "Updates when the player's state changes." Its criterion F2-A10 (b)
  (`../decisions-2026-10-16/criteria.md`, section 2) holds the advice to the input whose training brings most, and (h)
  reads the advice again after the player follows it for twenty sessions through the commands.
- Brief 11, section 8: "For repeated advice: Test a player who follows the recommendation and a player who ignores it.
  Advice should respond to actual progress and changing priorities. Correct advice may retain the same target when its
  cause remains unresolved. The player should receive state-aware explanations, progress, and useful next actions rather
  than an identical recurring message. Do not rotate to inferior advice merely for variety."

**Where the words contradict it.** On a journey whose student doesn't act on the advice, the input whose training brings
most stays the same for as long as its cause stands. L1's "at most 4 weeks running" then can be met only by naming, after
four weeks, an input whose training brings less: rotation to inferior advice, which brief 11 forbids, and which F2-A10 (b)
fails. And its "rising 5 points" can't be met by a player who does follow it near mastery: there the engine's practice
grows at its floor's constant rate (`DEVELOPMENT.floor`, `abilityGain` in `systems/attributes.ts`), about 2.4 to 2.6
points for twenty sessions (measured on the tuning cases adv-t-3, adv-t-11, adv-t-15 and adv-t-19, 2026-10-17), so a
player who trains it every day for four weeks raises it by less than 5.

**The clarification.** L1 is read on two players, each played through the commands and across a save and a load:

1. **The player who follows it** (twenty sessions of the advised exercise, one a day, as F2-A10 (h) plays them, inside
   L1's 4 weeks): afterwards the first-named input has changed, or it has risen by what those sessions brought, and the
   advice says so: what it was, what it is, and what moved since it was first given.
2. **The player who ignores it** (keeps working, never trains it): the first-named input may stay while it still brings
   the most (its cause unresolved; no rotation to an input whose training brings less), and what the advice says changes
   each week with the player's state: how long it has been first, what has moved since it was first given (the input's
   level, its forecast, how many pieces it held back since), and a next action the player can take now (the exercise,
   where it's practiced, what an hour costs and brings, or why it can't be done now). Two weeks' messages are never the
   same where the player's state has changed between them.

On the 120-day journeys (whose student trains the advised input only as the school's hours allow), a run longer than 4
weeks without its input rising 5 points is read against the same rule: met where the week's stated state (the level, the
forecast, the pieces held back, the sessions since) changed every week of the run. `tools/brief-journeys.ts` writes, beside
the run as written (`recommendations.longestSameTarget`), the longest run of weeks with the same message
(`recommendations.longestSameMessage`) and the same stated state (`recommendations.longestSameState`).

**The earlier result, kept.** Brief 09 (`c9cba9c8`): specialist 4, beginner 3 weeks. Brief 10's tested commit
(`567d27dd`): specialist 8 (focus, days 56 to 105, 51 to 55), beginner 6 (focus, days 56 to 91, 55 to 56): not met as
written (`../decisions-2026-10-16/l1/README.md`). Those figures stay in the record as L1 as written.

### F2-A10 (f): Mastery And Preparation

**As written** (`../decisions-2026-10-16/criteria.md`, section 2): "(f) Mastery and preparation. Near mastery, a predicted
gain falls as the input's level rises (diminishing returns), on every case; where a take's preparation, not an ability,
held it back, the advice's figures read the take as prepared."

**The approved behavior it maps to.**

- Brief 10, section 2: "Accounts for current mastery, preparation needs, and diminishing returns"; "Uses the real
  progression curve, costs, and available actions"; "over an equivalent training budget". F2-A10 (e): the forecast "reads
  the engine's growth, costs and diminishing returns, not its own."
- Brief 11, section 8: "Separate preparation improvements from ability-training benefits. Compare like-for-like training
  budgets. Explain small increases in predicted benefit when another relevant factor improves. Preserve diminishing
  returns where the actual progression model provides them; do not impose a contradictory rule merely to satisfy a
  slogan."
- The progression model (`abilityGain`): deliberate practice grows by `DEVELOPMENT.sessionGain` × the tier × the focus ×
  max(`DEVELOPMENT.floor`, 1 − level / 100). It falls as the level rises up to three quarters of full, and from there to
  full it's constant.

**Where the words contradict it.** "Near mastery" is past three quarters of full: every near-mastery case draws its inputs
from 80 to 97. There the model's growth is constant, so twenty sessions bring the same level whatever the level (played on
adv-t-1's imagination, 2026-10-17: 2.3997 points at 76, 80, 85 and 90, against 5.50, 4.59, 3.67 and 2.75 at 40, 50, 60 and
70). A forecast that fell there "on every case" would have to impose a falling rule the model doesn't have.

**The clarification.**

1. **Preparation, apart from training.** "A take's preparation" is the take's own: its breakdown, its lines, its rehearsal
   and the way of playing rehearsed in. Knowing the genre isn't prepared for one take: it carries from piece to piece and
   is short again at the next genre, so it's read as it's known today (brief 10's implemented reading, which its
   recommendation asked the owner to accept). Where a take's own preparation held it back most, training's forecast reads
   the take as prepared, and what completing that preparation would bring is said apart, named as preparation, in the
   forecast (`Forecast.preparation`) and on the screen.
2. **Like for like.** Every input's training is forecast on the same hours (`ADVICE.sessions`, twenty, one a day at the
   matched tier), and compared on them; preparation's figure is never added to training's.
3. **Diminishing returns where the model gives them.** Below three quarters of full, the same twenty sessions bring less
   as the level rises, played through the commands, and the forecast falls with them. From three quarters of full to full
   the test holds what the model gives: the same twenty sessions bring the same level at every rung, played, and the
   forecast reads that constant rate. What the forecast's points do there is the judge's reading of the same level gain:
   a thousandth either way. Brief 10's ladder test near mastery, which falls at full precision on adv-t-19, is kept as it
   is.

**The earlier result, kept.** Brief 10 (`../remaining-10/advice-result.json`, and on the integrated code
`../decisions-2026-10-16/advice/final/`): the first-named input's ladder fell on 30 of 30 near-mastery held-out cases, by a
median 0.0010 points a third of the way to full; every candidate 277 of 287 (276 of 287 on the integrated code). The
preparation clause under three readings: a step of the take's own preparation, 0 of 0 held-out cases had one; the
criterion's words read as any preparation, the genre's included, 16 of 57; any take with a preparation limit, 13 of 83. On
the tuning cases the genre's shortfall read complete named the best input in 27 of 30, and every take read complete in 18
of 30.

### F2-A10 (h): It Updates

**As written** (`../decisions-2026-10-16/criteria.md`, section 2): "(h) It updates. After the player follows it (20
sessions of the advised exercise, through the commands), the advice is read again: the trained input's predicted gain
falls on every case, and the first-named changes wherever another input's gain now leads."

**The approved behavior it maps to.** Brief 10, section 2: "Updates when the player's state changes"; "Uses the real
progression curve". Brief 11, section 8: "Explain small increases in predicted benefit when another relevant factor
improves." The engine: a day of practice grows discipline (`PRACTICE.disciplineDay`), and discipline lifts every hour's
growth (`DEVELOPMENT.disciplineLift`, `gainAfter` in `systems/attributes.ts`); near mastery the input's own rate is
constant (above).

**Where the words contradict it.** Twenty sessions of the advised exercise are twenty days of practice, so discipline rises
with them, and the next twenty hours of the same input grow more. Near mastery that lift can outweigh the input's own fall,
and the forecast rises by a few ten-thousandths (adv-t-19, 2026-10-17: imagination 0.54652 to 0.54698 as discipline went
80 to 82.1; at discipline 80 it would be 0.54509). A forecast that held discipline where it was would say less than the
engine does.

**The clarification.** After the twenty sessions, the trained input's predicted gain at the discipline it had when it was
advised is below what it was then, on every case: the input's own part falls. Where its forecast at today's discipline is
higher, the rise is no more than what discipline's lift adds (its forecast at today's discipline less its forecast at the
discipline it had), and the advice says so: the forecast then and now, discipline then and now, and that discipline makes
each hour grow more. The first-named changes wherever another input's gain now leads, as written.

**The earlier result, kept.** Brief 10: fell on 141 of 150 held-out cases (111 of 120 fresh), the nine that didn't all
near mastery and within a thousandth (adv-h-91, 98, 100, 103, 106, 107, 108, 110 and 118); on the integrated code 113 of
120; the first-named changed wherever another led, 62 of 62 (51 of 51 on the integrated code).
