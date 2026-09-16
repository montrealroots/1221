# The audition room, measured


Finished: six measurement agents, three proposals, three judges scoring them.
This file was written while it was still paused and said the judges never ran;
they ran. Everything below is what the agents returned, kept verbatim, plus
the arithmetic done alongside them.

## What was taken, and what was not

Taken, because it is measured, was verified by an adversary who applied and
ran it, and changes nothing about how the game feels:

- **The pin** (`62ab848`) — landed first and alone, on all three judges'
  advice. The room's central outcome was held by nothing: `AS_GOOD_AS_IT_GETS`
  could move 0.82 to 0.34 and 1,204 tests still passed.
- **Leave It deleted, the misheard no wired, two false sentences corrected**
  (`df42a67`).

Not taken, and these are the owner's:

- **The house** — a want the note points toward, which breaks the opening
  button outright (343/343 distinct best openings). Real build. One judge
  measured its headline gain 29% lower than claimed, though the structure
  held.
- **Any constant change.** The proposal carrying them stated a blast-radius
  claim with the word "measured" beside it that did not survive being applied.
  If the rate is to come down, `AS_GOOD_AS_IT_GETS` alone is the defensible
  knob — it is provably a pure scalar, best/A constant to six digits at every
  value tested.

## The finding that outgrew the room

All three judges arrived at it separately. **Every currency that could price
the room is dead.** `remembersYou` is pinned at 1.000 in 87.3% of real
readings and identical at reliability 0 and 100 in 83.5%. Readiness is a daily
fixed point. The diary commits in whole weeks, so it cannot tell a ninety
minute slot from a free afternoon. Money is never scarce: 0 of 3,900 career
weeks fall below the €120 fee. Four plausible prices, four dead.

That is why the way-in decision in all three proposals rests on a two point
`dates` side effect nobody designed — settling two days later re-checks
`freeAcross`. It is not an audition finding. It is a wellbeing and standing
finding, discovered in the audition room.


## What I measured myself


Exact enumeration over the full want distribution, not sampling.

| readiness | sure | none | touch | good | far | best |
|---|---|---|---|---|---|---|
| 100 | 1.000 | 0.6259 | 0.7175 | 0.7764 | 0.7872 | far |
| 95 (rested) | 0.9825 | 0.6259 | ~0.714 | ~0.772 | ~0.783 | far |
| 49.2 (normal) | 0.822 | 0.6259 | 0.6810 | 0.7074 | 0.6953 | good |
| 15 (working) | 0.7025 | 0.6259 | 0.6591 | 0.6660 | 0.6402 | good |

- Dead center `(0,0,0)` is the strictly best opening at every readiness and
  every answer, across all 343 openings. The opening has one right answer.
- At the state the player actually decides in — their own opening plus the note
  they can see, 1,764 states — `far` is among the best in **99.4%** at readiness
  95 and **51.7%** at readiness 49. The four-button trade exists only when tired.
- Readiness is two values: **95.0** on a day the player slept, **46.9–49.2**
  otherwise, stepping at the day rollover. Never above 49.2 at a day boundary.
- `life.sleep` has a clean optimum at 8 hours (4h 73.3, 8h 95.0, 14h 92.2). My
  first reading of this was wrong — I sampled after the rollover, which flattens
  everything — and the hours slider is fine.
- The tape and the room-with-the-note-ignored have identical odds, 0.6259, at
  every readiness. `decideAudition` reads `sawYou` on one line only, to pick the
  wording of the no. It never enters `keen`.


## The six measurement agents


### The naive play is 0.7063 (not 0.68) and it is also the OPTIMAL play, and AS_GOOD_AS_IT_GETS is the only constant that can single-handedly produce "most readings end in no" — P(cast) is exactly linear in it (best = 0.861323 × A, crosses 0.50 at A = 0.5805); CLOSE_ENOUGH needs to fall to 0.12 to do it, and TOO_FAR, the 1.4 exponent, MISREAD_THE_ROOM and the HOW_FAR steps cannot reach 0.50 at any value whatsoever.

*Confidence: analytic*


**Numbers**

## 0. Reimplementation verified before any sweep
40,000 random (reading, want, howFar, sure, roll, off) states through `howFarOff`, `theNote`,
`afterTheNote`, `decideAudition` — real vs mine: **0 mismatches**.
`whatTheyWant` over 300,000 draws: -3:0.0835 -2:0.1663 -1:0.1665 0:0.1670 1:0.1672 2:0.1661 3:0.0834.
Exact: P(±3)=1/12, P(-2..2)=1/6. **The auditor is right — the draw is not flat.**
E[|w|] per shade = 1.5 exactly ⇒ E[off] dead centre = **1.5000**, not 1.7.

## 1. The true baseline
| | P(cast) |
|---|---|
| naive (dead centre, room, 'good') — **exact enumeration** | **0.70626** |
| naive — **real engine**, 6 seeds × 500 driven auditions (2113/3000) | **0.7043** (SE 0.0083) |
| BEST strategy over all 343 readings × {tape,room} × per-note policy | **0.70628** |
| tape, dead centre | 0.62594 |
| room 'none' / room 'touch' / room 'good' / room 'far' | 0.6259 / 0.6804 / **0.7063** / 0.6938 |

Your 68% is low by ~2.5 points. **The naive play IS the best play** — the optimal per-note
policy buys 2.5e-5 over pressing 'good' every time. Engine: room/'none' returned bit-identical
per-seed counts to the tape (1894/3000 both), as it must.
Value of three days and EUR 1.20 in the room = **+0.0804**.

## 2. Sensitivity, one at a time (naive / best)
**AS_GOOD_AS_IT_GETS** — exactly linear, best(A)/A = 0.861323 at every A tested:
| A | 0.30 | 0.45 | 0.60 | 0.70 | **0.82** | 0.95 |
|---|---|---|---|---|---|---|
| naive | .2584 | .3876 | .5168 | .6029 | **.7063** | .8182 |
| best | .2584 | .3876 | .5168 | .6029 | **.7063** | .8183 |

crosses 0.50 at **A = 0.5805**

**CLOSE_ENOUGH**:
| CE | 0.4 | 0.6 | 0.8 | 1.0 | **1.2** | 1.6 |
|---|---|---|---|---|---|---|
| naive | .5598 | .6038 | .6425 | .6816 | **.7063** | .7500 |
| best | .5598 | .6054 | .6450 | .6844 | **.7063** | .7514 |

crosses 0.50 at **CE = 0.1223**; the floor at CE = 0 is 0.4761

**TOO_FAR**:
| TF | 2.0 | 2.6 | 3.0 | **3.4** | 4.0 |
|---|---|---|---|---|---|
| naive | .6091 | .6615 | .6866 | **.7063** | .7277 |
| best | .6255 | .6655 | .6874 | **.7063** | .7277 |

floor as TF→CE⁺ = **0.5170. Never reaches 0.50.**

**exponent (1.4)**:
| exp | 0.8 | 1.0 | **1.4** | 2.0 | 3.0 | 10 | 10⁴ |
|---|---|---|---|---|---|---|---|
| naive | .7417 | .7285 | **.7063** | .6804 | .6494 | .5645 | — |
| best | .7417 | .7285 | **.7063** | .6825 | .6568 | .5870 | .5170 |

asymptote **0.5170. Never reaches 0.50.**

**HOW_FAR steps** (best re-picks the button, so it barely moves):
| steps | naive | best |
|---|---|---|
| 0/1/2/3 (ships) | .7063 | .7063 |
| 0/1/**1**/**2** ('far'=2, 'good'=1) | .6804 | **.7063** |
| 0/1/2/**2** ('far'=2) | .7063 | .7063 |
| 0/0/0/0 (weakest possible) | .6259 | .6259 |

floor **0.6259. Never reaches 0.50.**

**MISREAD_THE_ROOM** (measured steady-state readiness 49 ⇒ sure = 0.8221):
| M | 0 | **0.35** | 0.6 | 1.0 | 5.0 |
|---|---|---|---|---|---|
| naive | .7764 | **.7063** | .6562 | .5760 | — |
| best | .7882 | **.7063** | .6566 | .6259 | .6259 |

floor = the tape value **0.6259** (best abandons the room and plays 'none'). **Never reaches 0.50.**

## 3. Jointly (best strategy)
| change | naive | best | tape | room premium | wrong-for-it |
|---|---|---|---|---|---|
| shipped | .7063 | .7063 | .6259 | .0804 | 0.08% |
| CE=0.6 + exp=3 | .4889 | **.4933** | .3111 | **.1821** | 0.0% |
| A=0.75 + CE=0.6 + TF=2.4 | .4725 | .4766 | .3120 | .1646 | 3.2% |
| A=0.70 + CE=0.6 + exp=3 | .4173 | .4211 | .2656 | .1555 | 0.0% |
| CE=0.6 + TF=2.0 + exp=3 | .3666 | .3711 | .1562 | .2149 | 11.6% |

## 4. Collateral damage, by candidate
| change | best | room premium | buttons (none/touch/good/far) | favourite among-best | P(wrong-for-it) |
|---|---|---|---|---|---|
| shipped | .7063 | .0804 | .626/.680/.706/.694 | 80.5% | 0.08% |
| **A=0.58** | **.4996** | .0569 | .443/.481/.500/.491 | **80.5% (unchanged)** | 0.08% |
| CE=0 | .4761 | .1043 | .372/.432/.476/.450 | 79.5% | 0.08% |
| TF=1.6 | .5860 | .2550 | .331/.452/.560/.563 | 88.0% | **50.0%** |
| exp=10 | .5870 | .2435 | .344/.461/.564/.563 | 80.5% | 0.08% |
| M=1.0 | .6259 | **.0000** | .626/.611/.576/.520 | 74.5% | 0.08% |

**A is a pure level knob: it scales every outcome by the same factor and moves nothing about the
shape** — same button order, same 80.5% favourite share, same reachability, premium scales with it.

## 5. Where the note actually lands
| play | P(off ≤ CLOSE_ENOUGH) | P(off > TOO_FAR) | max reachable off |
|---|---|---|---|
| tape / 'none' | 27.8% | 0.00% | 3.000 |
| 'touch' | 43.2% | 0.00% | 3.333 |
| **'good'** | **60.0%** | 0.08% | 3.667 |
| 'far' ("the whole way") | 57.6% | 0.58% | 4.000 |


**Method**

READ-ONLY throughout; probes in /tmp/probe/, run with `cd /home/user/1221 && npx vite-node <probe>`.

1. `/tmp/probe/verify.mjs` — reimplemented `howFarOff`, `theNote`, `afterTheNote`, `decideAudition` line-for-line from `/home/user/1221/src/engine/world/audition.ts` (lines 302-441) and diffed against the real imported functions on 40,000 random states (0 mismatches), plus a 300,000-draw empirical of `whatTheyWant`.

2. `/tmp/probe/ready.mjs` — booted `quickSave({}, seed)` for 3 seeds and read `heardItRight(sim)` at days 0/30/365/1095. Day 0 = 0.9361, then pinned at **0.8220985748** from day 30 onward on every seed. Inverting `1 - MISREAD_THE_ROOM*(1-ready)` gives ready = 0.49171. That is the `sure` used in every sweep.

3. `/tmp/probe/engine.mjs` — END-TO-END REAL ENGINE. Booted a save, advanced 40 days, injected 500 auditions with `wants` drawn by a real `sim.rng('audition','probewants',id)` stream and non-overlapping shoot dates (so `freeAcross` is always true and no cast blocks a later one), called the real `goUpFor` with `{warmth:0,size:0,pace:0}`, advanced 4 days so the real `AUDITION_KIND` handler fires and issues the real note, then called the real `takeTheNote`. 6 seeds × 500 = 3,000 real auditions per strategy.

4. `/tmp/probe/sweep.mjs`, `/tmp/probe/shape.mjs`, `/tmp/probe/final.mjs` — EXACT enumeration, not sampling: all 343 wants at their exact probabilities (1/12 for ±3, 1/6 otherwise), both branches of the misread draw weighted by `sure`, P(cast|off) taken as `keen` itself. "Best strategy" = maximum over all 343 readings × {tape, room} × a howFar policy chosen per note-key (shade, toward). Crossings found by 80-step bisection on the best-strategy curve.

5. `/tmp/probe/shape.mjs` also re-enumerated HOW_FAR's own claim exactly as its comment describes it: all 343×343 (reading, want) pairs, minus the 343 that give no note = **117,306 states**, matching the comment's own figure to the digit.


**Surprises**

**1. "Most readings end in no" is false, and it is not close.** 70.6% end in YES for the naive play, and the naive play is the optimal play. CLOSE_ENOUGH's comment states the opposite of what CLOSE_ENOUGH does.

**2. The second decision has one right answer, permanently.** HOW_FAR's 80% claim is TRUE and reproduces exactly — 117,306 note-giving states, favorite 'far' among the best in 80.5%. But that enumeration is over states the player cannot see (it conditions on the want). From where the player actually stands — knowing only their reading and the note — the four buttons have fixed expected values 0.6259 / 0.6804 / **0.7063** / 0.6938 and **'good' is uniquely best for every note**. The file says "which one is best moves with readiness". Measured, it does — but the flip to 'far' needs sure ≥ 0.92 (readiness ≥ 78) and the flip to 'touch' needs sure ≤ 0.65 (readiness = 0). Booted-save readiness pins at 49 from day 30 to year 3 on every seed. In practice 'good' is the answer forever.

**3. "One note taken the whole way pulls an average guess inside it" is measurably backwards.** 'far' lands inside CLOSE_ENOUGH **57.6%** of the time; 'good' lands inside **60.0%**. The whole way is not the best way in, and 'far' is strictly dominated by 'good' at every readiness the game reaches.

**4. TOO_FAR is very nearly a dead word by THE ONE RULE.** It fires in **0.08%** of naive auditions. Max off from a dead-center reading is 3.000 < 3.4, so a tape can NEVER be 'wrong-for-it' — the threshold is only reachable at all when a MISHEARD note swings a shade the wrong way. And it cannot produce "most readings end in no" at any legal value: its floor as TF→CLOSE_ENOUGH⁺ is 0.5170.

**5. TOO_FAR's comment is wrong on both halves.** E[off] for a safe reading is **1.5000 exactly**, not "about 1.7", and the want is not "drawn flat across the range" — `Math.round((next()*2-1)*FURTHEST)` gives P(±3)=1/12 and P(-2..2)=1/6 each, confirmed both analytically and on 300,000 real draws. Your auditor is right on both counts.

**6. MISREAD_THE_ROOM cannot make the room harder, only worthless.** Raising it past ~0.9 makes 'none' the best answer, at which point the room premium is exactly **0.0000** — three days and EUR 1.20 for a tape. Its floor is the tape value 0.6259, so it can never produce the target either.

**7. HOW_FAR steps {0,1,1,2} change nothing at the top.** naive drops to .6804 but best stays at **.7063** — the optimum just re-labels itself 'far'. The steps are a renaming, not a lever.

**8. If the goal is BOTH "most readings end in no" AND "the room is worth three days", A is the wrong knob.** A=0.58 hits 0.4996 but shrinks the room premium with it (0.0804 → 0.0569). **CLOSE_ENOUGH=0.6 + exponent=3 reaches 0.4933 while raising the room premium to 0.1821 — 2.3× the shipped value — with no inflation of 'wrong-for-it'.** That is the change that makes going in worth three days, which is the sentence CLOSE_ENOUGH's comment is trying to be.


### The opening reading is a solved button (dead centre wins monotonically, always), the way in is a solved button (tape is bit-identical to room+'Leave It', so the room weakly dominates), and the note answer is a near-button — 'As Far As It Goes' is best in 343/343 openings above readiness 76.3 — so the only real decision in the room is a single far/good flip that opens below readiness 76.311, and even that changes the best answer for only 11 of 343 openings.

*Confidence: analytic*


**Numbers**

EXACT ENUMERATION: 343 openings x 343 wants (exact pmf) x 2 ways x 4 answers, expectation over the roll taken by bisecting the real `decideAudition`. Assumes free=true.

=== 0. THE TWO INPUTS, MEASURED ===
Want pmf per shade, swept through the real `whatTheyWant`:
  w=-3 0.083333 (1/12) | -2..+2 0.166667 each (1/6) | +3 0.083333 (1/12)
  E[w]=0.000000  E[|w|]=1.500000  => E[off] for a dead-centre reading = 1.500000 EXACTLY
  Real seeded RNG, 1,500,000 shade-draws: -3 0.08299, -2 0.16616, -1 0.16684, 0 0.16685,
  +1 0.16719, +2 0.16665, +3 0.08332;  E[|w|]=1.49858.  P(all three equal)=0.02420 (analytic 0.02431)

P(cast | off), bisected out of `decideAudition` (19 attainable off values, all k/3):
  0.0000 0.820000 | 0.3333 0.820000 | 0.6667 0.820000 | 1.0000 0.820000 | 1.3333 0.751278
  1.6667 0.587296 | 2.0000 0.435513 | 2.3333 0.297620 | 2.6667 0.176134 | 3.0000 0.075389
  3.3333 0.006136 | 3.6667 and above 0.000000
  sawYou (tape vs room) does not enter the curve — verified identical at every off.

=== 1. P(cast) FOR EVERY (OPENING, WAY, ANSWER) ===
2744 cells collapse to 1372 distinct values: tape ignores the answer, AND
tape === room/'none' for all 343 openings, max |diff| = 0.00e+0.

By L1 distance of the opening from dead centre (mean over the openings at that L1):
  readiness 100                              readiness 49.17 (a played save)
  L1  n   tape/none  touch     good     far  | touch     good     far
   0   1  0.625851  0.717490 0.776374 0.787229| 0.680391 0.706258 0.693821
   1   6  0.603730  0.696954 0.760584 0.782729| 0.659827 0.690214 0.693578
   2  18  0.568264  0.663998 0.734646 0.769685| 0.626816 0.666917 0.685969
   3  38  0.517077  0.616071 0.695646 0.744837| 0.580776 0.633493 0.667855
   4  60  0.464015  0.564981 0.652003 0.713591| 0.532650 0.595743 0.642851
   5  72  0.410917  0.511429 0.603300 0.675004| 0.482234 0.552659 0.609757
   6  68  0.354237  0.451775 0.546067 0.625891| 0.426314 0.501217 0.565975
   7  48  0.301613  0.394305 0.488425 0.573506| 0.372544 0.448793 0.518457
   8  24  0.249235  0.334437 0.425221 0.512383| 0.316263 0.390860 0.462454
   9   8  0.191067  0.265813 0.350049 0.436234| 0.252515 0.321766 0.392617
  Strictly monotone decreasing in L1 at every answer and every readiness.

BEST opening: (0,0,0) — rank 1 for tape/none, touch and good at EVERY readiness;
  rank 1 for 'far' at readiness 100, falling to rank 3 (r70), 7 (r40), 21 (r10).
WORST opening: the 8 corners (+-3,+-3,+-3), L1=9.  Worst cell (-3,3,-3) tape = 0.191067.
BEST ANSWER per opening, counted over the 343 openings:
  readiness 100: far 343, good 0, touch 0, none 0
  readiness  70: far 342, good 1
  readiness  40: far 338, good 5
  readiness  10: far 336, good 7

=== 2. IS THERE A DOMINANT STRATEGY? ===
Formally NO: of the 1715 distinct strategies, 0 are weakly best in all 343 want-states,
at readiness 100, 70, 40 and 10 alike. (Full intersection check.)
But the want is never visible, so that is an oracle test. On what the player can act on:
  - THE WAY IN IS A BUTTON. room >= tape at every opening and answer, with equality only
    at 'none'. Going in is never worse in P(cast), only 2 extra days and EUR 1.20.
  - THE OPENING IS A BUTTON. Monotone in L1; dead centre is uniquely optimal in 4 of the
    5 (way,answer) columns at every readiness, and in all 5 above readiness 76.3.
  - THE ANSWER IS A NEAR-BUTTON. On the 1764 states a player can distinguish
    (opening x note), at readiness 100 'far' is among the best in 1754 (99.4%) and uniquely
    best in 1166. One answer is weakly best in every note it can draw for 338/343 openings,
    covering 95.4% of play. At readiness 70/40/10 that mass is still 91.6% / 87.6% / 87.6%.
NEAREST THING TO A DOMINANT STRATEGY:
  (0,0,0) x room x 'far'  = 0.787229   at readiness 100
  (0,0,0) x room x 'good' = 0.734992 (r70) / 0.706258 (r49.17) / 0.652227 (r10)

=== 3. BEST vs WORST vs NAIVE ===
  readiness 100: best 0.787229, worst 0.191067 -> 4.120x, +0.596162 absolute
  readiness  70: best 0.734992, worst 0.191067 -> 3.847x, +0.543924
  readiness  40: best 0.693609, worst 0.191067 -> 3.630x, +0.502542
  readiness  10: best 0.652227, worst 0.191067 -> 3.414x, +0.461160
NAIVE = (0,0,0) room 'good':
  readiness 100: best beats naive by 0.010856 (+1.40%)
  readiness <= 76.311: THE NAIVE STRATEGY IS THE OPTIMAL STRATEGY. Gap 0.000000.
Best strategy vs best tape (0,0,0 tape = 0.625851 at all readiness):
  +0.161378 (r100), +0.127823 (r81.73 = boot), +0.109140 (r70), +0.080407 (r49.17),
  +0.067758 (r40), +0.026375 (r10).
  At readiness 10, 'far' is WORSE than the free tape: 0.621839 vs 0.625851 (-0.004012).

=== 4. DOES THE OPENING MATTER ONCE A NOTE IS TAKEN? YES — IT KEEPS 81% OF ITS WEIGHT ===
Spread of P(cast) across the 343 openings, readiness 100:
  answer      min       max       spread     sd
  none/tape  0.191067  0.625851  0.434784  0.098630
  touch      0.265813  0.717490  0.451677  0.101888   (WIDER than doing nothing)
  good       0.350049  0.776374  0.426325  0.096056
  far        0.436234  0.787229  0.350996  0.081098
Taking the note all the way removes only 0.083788 of the 0.434784 range = 19.3%.
At readiness 70: far spread 0.322835 (25.7% removed). At r40: 0.296677 (31.8%).
At r10: 0.270519 (37.8%). The note launders a bad opening only at the margin.

=== 5. READINESS MOVES THE BEST ANSWER — AT DEAD CENTRE, AND ALMOST NOWHERE ELSE ===
Dead centre, P(cast) by readiness (none is readiness-invariant at 0.625851):
  ready sure    touch     good      far       best
   100 1.0000  0.717490 0.776374 0.787229   far
    90 0.9650  0.710191 0.762580 0.768853   far
    80 0.9300  0.702893 0.748786 0.750476   far
    75 0.9125  0.699243 0.741889 0.741288   good
    70 0.8950  0.695594 0.734992 0.732099   good
    50 0.8250  0.680997 0.707403 0.695346   good
    40 0.7900  0.673698 0.693609 0.676969   good
    10 0.6850  0.651803 0.652227 0.621839   good
     5 0.6675  0.648153 0.645330 0.612651   touch
     0 0.6500  0.644504 0.638433 0.603463   touch
EXACT CROSSOVERS (bisected), dead centre:
  far -> good  at readiness 76.311 (sure 0.9171)
  far -> touch at readiness 37.047 (sure 0.7797)
  good -> touch at readiness  9.347 (sure 0.6827)
  'touch' never beats 'none': one always wins.
  At opening (1,0,0) the far->good crossover moves down to readiness 28.696.
BUT: best answer at readiness 100 over 343 openings = {far: 343}.
     best answer at readiness   0 over 343 openings = {far: 332, touch: 7, good: 4}.
     Only 11 of 343 openings ever change their best answer between readiness 100 and 0 —
     and they are the ones near dead centre, i.e. exactly where an optimal player sits.

=== 6. WHAT THE NOTE IS ACTUALLY ASKING FOR (why 'far' wins) ===
True size of the note in steps, by opening:
  (0,0,0): no note 0.46% | 1 step 12.0% | 2 steps 45.4% | 3 steps 42.1%
  (1,0,0): no note 0.46% | 1 12.0% | 2 39.6% | 3 39.6% | 4 8.3%
  (3,3,3): no note 0.06% | 1 1.5% | 2 5.7% | 3 12.6% | 4 22.3% | 5 34.8% | 6 23.0%
  uniform over all 343 openings: 1 6.3% | 2 17.1% | 3 24.8% | 4 25.6% | 5 19.0% | 6 7.0%
For a centred reading the note wants 2 or 3 steps 87.5% of the time and the biggest
button can only reach 3 — so 'far' cannot overshoot on 42% of notes and undershoots on none.

=== 7. MONTE CARLO CROSS-CHECK (real seeded RNG, real functions, 500,000 trials each) ===
  opening  way  answer ready    MC        95% CI     analytic
  0,0,0    room good   100.0  0.77677  +-0.00115  0.77637  OK
  0,0,0    room far    100.0  0.78820  +-0.00113  0.78723  OK
  0,0,0    room touch  100.0  0.71777  +-0.00125  0.71749  OK
  0,0,0    room none   100.0  0.62636  +-0.00134  0.62585  OK
  0,0,0    tape none   100.0  0.62616  +-0.00134  0.62585  OK
  0,0,0    room good    49.2  0.70654  +-0.00126  0.70626  OK
  0,0,0    room far     49.2  0.69480  +-0.00128  0.69382  OK
  0,0,0    room good    70.0  0.73439  +-0.00122  0.73499  OK
  3,3,3    room far    100.0  0.43681  +-0.00137  0.43623  OK
  -3,3,-3  room none   100.0  0.19034  +-0.00109  0.19107  OK
  -3,3,3   room good   100.0  0.34910  +-0.00132  0.35005  OK
  Worst deviation across 16 cases: 1.07x the 95% CI half-width (1 marginal of 16, as expected).
  'heard' and 'said' streams independent: 200k joint draws gave 49776/50132/49681/50411.

Readiness in a real save (quickSave, seed 'strategy-probe'): 81.73 at boot (sure 0.9361),
49.17 after one year (sure 0.8221). Both sit BELOW the far->good crossover of 76.311 within
the first year, so 'A Good Deal' is the right answer for essentially all of a played save.


**Method**

Read /home/user/1221/src/engine/world/audition.ts and src/engine/content/audition.ts for the exact mechanism, then wrote seven probes under /tmp, all run with `cd /home/user/1221 && npx vite-node <probe>`:

/tmp/probe-strategy.mjs — derives the want pmf by sweeping 1.2M evenly spaced next() values through the REAL `whatTheyWant`; derives P(cast|off) by bisecting the REAL `decideAudition` on the roll at each of the 19 attainable off values; then enumerates 343 openings x 343 wants x 2 ways x 4 answers calling the real `theNote`, `afterTheNote` and `howFarOff`, weighting each want by its exact probability. Nothing about the mechanism is reimplemented — only the want weights and the enumeration loop are mine.

/tmp/probe-dominance.mjs and /tmp/probe-dom2.mjs — the same lattice, adding (a) a full dominance intersection: for each of the 343 want-states, compute all 1715 distinct strategy values, keep only strategies within 1e-12 of that state's maximum, intersect across all states; (b) the decision-state partition (opening x note, 1764 states) with the posterior over wants conditioned on the note, since that is the only thing the player can condition on; (c) the oracle-state partition (opening x want that yields a note, 117,306 states) to reproduce the figure the HOW_FAR comment quotes.

/tmp/probe-emp2.mjs — boots `quickSave({}, 'strategy-probe')`, reads `readiness` from src/engine/systems/life.ts at boot and after `sim.advanceTo(+365d)`, draws 500k wants from a single real `sim.rng` stream (three successive next() calls, as `whatTheyWant` really receives them), and runs 500,000 trials per case end to end through the real functions with real seeded rolls for both the 'heard' and 'said' draws, comparing each against the analytic figure.

/tmp/probe-structure.mjs — the distribution of the note's true magnitude in steps, P(cast) grouped by the opening's L1 distance from dead centre, and the per-note-size decomposition of dead-centre P(cast).

/tmp/probe-cross.mjs — bisects readiness to find the exact points where the best answer flips, and counts how many of the 343 openings change their best answer between readiness 100 and 0.

/tmp/probe-deadzone.mjs — enumerates every value `howFarOff` can return (19 values, all k/3) to locate CLOSE_ENOUGH and TOO_FAR against the attainable grid.

First Monte Carlo attempt was wrong and was discarded: I called `sim.rng(stream, ...keys)` inside the `next` callback, which builds a fresh stream per call, so all three shades drew the same number (P(no note) came out 0.1673 = 1/6 instead of 0.0046). Fixed by hoisting the stream; the corrected run then matched the analytic everywhere.

Everything assumes free=true (the player is available for the dates). `decideAudition` short-circuits to 'dates' otherwise, which is orthogonal to the strategy question but is the likely source of the gap against your played-save figures.


**Surprises**

1. YOUR 1.7 FIGURE IS WRONG AND THE AUDITOR IS RIGHT. TOO_FAR's comment says "a reading played dead center against a want DRAWN FLAT ACROSS THE RANGE is about 1.7 out". The draw is not flat — `Math.round((next()*2-1)*3)` gives the two extremes half-width bins, so P(+-3)=1/12 and P(-2..+2)=1/6 — and E[off] for a dead-centre reading is 1.500000 exactly, not 1.7. Confirmed twice: by sweeping 1.2M values through the real `whatTheyWant` (1.500000) and by 1.5M draws off the real seeded RNG (1.49858). The sentence is wrong on both clauses.

2. "MOST READINGS END IN NO" IS FALSE FOR EVERY COMPETENT STRATEGY, AND YOUR 68% UNDERSTATES IT. CLOSE_ENOUGH's comment opens on it. Measured: dead center + room + 'good' = 0.776374 at readiness 100 and 0.706258 at the readiness a played save actually sits at (49.17). Even the single worst strategy in the entire game — a corner reading, taped — casts 19.1% of the time, and the mean over ALL 343 openings answering 'far' at full readiness is 0.655783. There is no opening at all, including the corners, at which a player who goes in and commits ends in no more often than yes at readiness 100 (the worst is 0.436234). The research's own first sentence about the pass is not in the arithmetic.

3. THE ROOM IS NOT THREE DAYS OF INFORMATION — IT IS THREE DAYS OF NOTHING UNLESS YOU ANSWER. tape and room/'none' are bit-identical for all 343 openings, max |diff| = 0.00e+0. Paying EUR 1.20, three days, and an afternoon that `requiresPlayer` blocks, and then choosing "Leave It", returns exactly the free one-day tape's number. That makes 'none' a strictly dominated button in the room: it can never beat 'touch' at any readiness from 0 to 100 (verified — the crossover does not exist), so one of the four answers is there purely as prose.

4. CLOSE_ENOUGH = 1.2 NAMES A BOUNDARY NOTHING CAN LAND ON. `howFarOff` returns a mean of three integers, so only 19 values exist, all k/3. The largest that clears 1.2 is 1.0000 and the next is 1.3333 — so "what a reading has to be within to be the one they take" is really "total shade error <= 3", and any value in [1.0, 1.3333) selects the same readings. Same shape at the other end: TOO_FAR = 3.4 sits in the gap between 3.3333 (kept, P(cast)=0.006136) and 3.6667 (rejected), so anything in [3.3333, 3.6667) rejects the same set. Both constants still change outcomes through the falloff slope `(off-CE)/(TF-CE)`, so neither is dead — but as thresholds, which is what both comments describe them as, both are loose by a full grid step.

5. THE HOW_FAR COMMENT'S 80% IS TRUE BUT MEASURED ON A LATTICE THE PLAYER NEVER STANDS ON. I reproduce it exactly: on the 117,306 (opening x want) states — and 117,649 - 343 = 117,306, so that is precisely the set they counted — 'far' is among the best in 80.5% at readiness 70 and 40. But those states condition on the want, which is the hidden truth the player is guessing at, and they weight all 343 openings equally including corners no rational player plays. On the 1764 states a player can actually distinguish (opening x note), 'far' is among the best in 99.4% at readiness 100 and uniquely best in 1166 of them. Weighted by how often a player actually reaches them, one answer is best 95.4% of the time. The comment's honest 80% becomes 95-99% the moment you ask the question from the player's chair.

6. "THREE DIFFERENT STEPS ARE UNIQUELY BEST" IS TRUE ONLY AT READINESS THE GAME BARELY REACHES. At readiness 100 the best answer is 'far' for all 343 openings — zero variety. You need to fall to readiness 0 before the spread appears, and even then it is {far: 332, touch: 7, good: 4}. Only 11 of 343 openings change their best answer across the whole readiness range. The claim that "which one is best moves with readiness" is true but it moves for 3% of the strategy space.

7. THE ONE GENUINE DECISION IN THE FILE IS REAL, AND IT IS NARROW. far -> good flips at readiness 76.311 (sure = 0.9171) at dead centre. A save boots at readiness 81.73 and sits at 49.17 after a year, so the player crosses that boundary in their first months and then never goes back — meaning 'A Good Deal' is the right answer for essentially the whole of a played career, and 'As Far As It Goes' is correct only in the opening weeks. Below readiness 10, 'far' is worse than doing nothing at all (0.621839 vs the tape's 0.625851), which is the one place the file's stated trade — "three steps of right or three steps of wrong" — actually bites.

8. YOUR 51% FOR 'NEVER ANSWERING' LOOKS TOO LOW TO BE THE SAME EFFECT AS YOUR 68%. 'none' is readiness-invariant by construction (steps=0, so the misheard direction cannot matter) and sits at 0.625851 with free dates. Your 68% for 'good' is 2.5 points under its free-dates ceiling of 0.706258, but your 51% is 11.6 points under 0.625851. A single dates-unavailability rate cannot produce both gaps — 19% unavailability would drag 'good' to 0.57, not 0.68. Either the two runs saw very different availability, or the sample is small enough that one of the figures is noise. Worth re-running with the audition count reported.


### Of 16 checkable claims the room makes about itself, 5 are false and 3 are overstated — the load-bearing one, "Most readings end in no," is contradicted by every configuration I ran (cast rate 51%–61% in play, 62.59% analytically for the worst case a safe reading can produce), and the note's own "about 80%" figure is only true at the readiness the game actually produces, not at the rested ceiling its neighbouring comment promises.

*Confidence: analytic*


**Numbers**

CONCURRENCY WARNING FIRST: src/engine/content/audition.ts and tests/audition.test.ts were being edited by another process while I measured (mtimes 21:55 and 21:57 against a 21:58 clock; `git status` shows both dirty). One probe run at 21:57 returned corrupt values (howFarOff returning sums) and did not reproduce. Every figure below was re-run afterwards against a fixed checksum (world/audition.ts cbaa4ebbc0bbd89831f91bf18456c584, content/audition.ts 11b1e06c49d5ebdca02b1a5d7f041f04) and was stable across the run. The 1.7/flat claim was amended in the working tree while I was measuring it — my independent figure agrees with the amendment.

=== 1. "Most readings end in no" — content/audition.ts:251 — FALSE ===
Measured in play, 6 seeds x 12 years, going up for everything the dates allow, reading AS_WRITTEN:

  way / answer          readings  CAST    NO     mean final off
  tape (no note)             409  61.1%  38.9%   1.5012
  room, never answered       478  51.0%  49.0%   1.5063
  room, Leave It (0)         436  57.8%  42.2%   1.4992
  room, A Touch (1)          433  59.6%  40.4%   1.2933
  room, A Good Deal (2)      431  60.1%  39.9%   1.1578
  room, As Far As It Goes(3) 426  59.6%  40.4%   1.2606

Not one configuration puts "no" in the majority. The 49.0% worst case is the room-with-an-unanswered-note path, and 13.0% of that is `dates` (unavailable), not a judgement on the reading.
Exact, over the real want draw, free for the dates, dead-centre reading, no note at all: CAST 62.59%, went-another-way 37.41%, wrong-for-it 0.00%.
Cause, read off decideAudition itself by bisecting the roll:
  off 0.000-1.200 -> 82.00%   off 1.500 -> 66.78%   off 2.000 -> 43.55%
  off 2.333 -> 29.78%   off 3.000 -> 7.54%   off 3.400+ -> 0.00%
P(cast) is still above 25% at off = 2.459, out of a maximum possible 6. CLOSE_ENOUGH is tight; the slope outside it is not, and the slope is what decides.

=== 2. "a reading played dead center ... is about 1.7 out" — content/audition.ts:228 (was) — FALSE, now fixed in the working tree ===
E[off | AS_WRITTEN] = 1.500000 exactly (closed form over all 343 wants), 1.500667 over 2,000,000 live draws.
1.714286 is what a genuinely flat 1/7 draw would give. The comment cited the flat figure.

=== 3. "a want drawn flat across the range" — content/audition.ts:228 (was) — FALSE, now fixed ===
whatTheyWant = Math.round((next()*2-1)*FURTHEST). 9,000,000 live draws vs closed form:
  -3  8.333% (exact 1/12 = 8.3333%)   flat would be 14.286%
  -2 16.639% (1/6)   -1 16.667% (1/6)   0 16.667% (1/6)   +1 16.689% (1/6)   +2 16.677% (1/6)
  +3  8.328% (1/12)
The two ends come up half as often as the middle five.

=== 4. "One note taken the whole way pulls an average guess inside it" — content/audition.ts:253 — OVERSTATED (true only for a rested player playing safe) ===
E[off] after one note from AS_WRITTEN, exact:
  sure=1.0000 (rested):  none 1.5000  touch 1.1682  good 0.9167  far 0.9676   -> far is INSIDE 1.2
  sure=0.8042 (measured): none 1.5000  touch 1.2981  good 1.1608  far 1.2667  -> far is OUTSIDE 1.2, good is inside
In play, mean final off with 'far' = 1.2606; with 'good' = 1.1578. At the readiness the game actually produces, the whole way does NOT pull the average inside; A Good Deal does.
Averaged over all 343 readings a player might guess (uniform), sure=1: none 2.1667, touch 1.8343, good 1.5423, far 1.3540 — "an average guess" taken the whole way lands at 1.354, outside 1.2.

=== 5. "which is what makes going in worth three days" — content/audition.ts:253 — OVERSTATED ===
Measured, 6 seeds x 12 years: tape = 250 parts from 409 readings, free, 1 day each. Room + A Good Deal = 259 parts from 431 readings, EUR 120 each, 3 days each. Going in buys +9 parts over 72 seed-years (+3.6%) for EUR 51,720 and 862 extra committed days. Cast RATE is 1.0 points LOWER in the room than on tape (60.1% vs 61.1%), because the two extra days cost availability (`dates` 7.4% in the room vs 2.4% on tape) and because 18.3% of notes are heard backwards.

=== 6. "the favorite is among the best in about 80%" — content/audition.ts:206 — TRUE at the real readiness, UNDERSTATED at the ceiling ===
Enumerated over all 117,306 note-giving states, scored by expected cast chance:
  sure=1.0000  none 13.5%  touch 23.2%  good 36.0%  far 95.9%   favorite = far @ 95.9%
  sure=0.9500  none 13.5%  touch 17.8%  good 22.9%  far 80.5%   favorite = far @ 80.5%
  sure=0.8215  (same)                                  far 80.5%
  sure=0.6500  none 21.0%  touch 15.9%  good 15.1%  far 76.0%   favorite = far @ 76.0%
'far' is uniquely best in 64.0% of states at EVERY readiness level tested.
Measured mean heardItRight in play = 0.8042 (mean readiness 44.05), so 80.5% is the live figure — the comment is right about the game as played. But the same file's MISREAD_THE_ROOM comment (line 512) promises "at the ceiling it is nothing at all, so a rested performer simply hears the room", and at that ceiling the figure is 95.9%, not 80%. The two comments describe different rooms.
UNBITTEN's stated range "79–96%" brackets 95.9% and 80.5% but its floor is wrong: at maximum fatigue the figure is 76.0%.

=== 7. "three different steps are uniquely best across the situations a player can read" — content/audition.ts:206 — TRUE at sure=1, FALSE at the readiness the game produces ===
Collapsed to the twelve situations a player can actually read (played value on the noted shade x direction):
  sure=1.0000 : -1|-1 good, -1|1 far, -2|-1 none, -2|1 far, -3|1 far, 0|-1 far, 0|1 far, 1|-1 far, 1|1 good, 2|-1 far, 2|1 none, 3|-1 far  -> 3 steps (none/good/far)
  sure=0.8042 : -1|-1 touch, -1|1 far, -2|-1 none, -2|1 far, -3|1 far, 0|-1 good, 0|1 good, 1|-1 far, 1|1 touch, 2|-1 far, 2|1 none, 3|-1 far  -> 4 steps
  sure=0.6500 : -> 3 steps (none/touch/far)
Over the full 1,764 distinct readable situations (whole reading + note shade + direction): sure=1 -> far 1166, good 10, tie 588 (TWO steps uniquely best). sure=0.8042 -> far 912, good 282, touch 276, none 98, tie 196 (FOUR).
"which one is best moves with readiness" — TRUE, confirmed: 8 of the 12 situations change their answer between sure=1 and sure=0.65.

=== 8. "117,306 of them give a note, and All The Way was among the best in 117,306 of them. Leave It was never once uniquely best" — content/audition.ts:189 — TRUE, reproduced exactly ===
343*343 = 117,649 pairs, 343 give no note (played == want), 117,306 give one. I reproduced the UNBITTEN table to the unit by re-implementing the old design (share-of-gap {0,0.5,1,1.7}, note on the CLOSEST shade, move rounded to an integer, scored by expected cast chance):
  share 0: 16,514 | share 0.5: 47,738 | share 1: 117,306 | share 1.7: 39,242 ; uniquely best: 0, 0, 55,264, 0
  doc claims: 16,514 | 47,738 | 117,306 | 39,242 ; Leave It never uniquely best.  IDENTICAL.
(The same enumeration with the CURRENT farthest-shade note gives 14,258 / 33,914 / 117,306 / 75,458 — so the doc's table is of the old note rule too, which is correct and worth saying out loud.)

=== 9. UNBITTEN "Absolute steps, note on the farthest shade | 95.9%" — TRUE, reproduced to the decimal (95.9% at sure=1) ===

=== 10. "57% of notes asked for a move of one step, and 83% for one or two" (old closest-shade rule) — world/audition.ts:316 — TRUE ===
Uniform over all 117,649 pairs, note on the closest shade: 1 step 57.11%, 2 26.40%, 3 10.93%, 4 3.97%, 5 1.25%, 6 0.33%. One step = 57.1%, one-or-two = 83.5%.

=== 11. "On the farthest shade the distances spread across the whole range — one step to six, with no value above a quarter of them" — world/audition.ts:322 — TRUE, and tight ===
1 step 5.55%, 2 14.94%, 3 22.39%, 4 24.60%, 5 20.73%, 6 11.79%. Range is exactly 1..6; the largest single value is 24.60%, under a quarter by 0.40 points.

=== 12. "Most notes want about this" (A Good Deal = 2 steps) — content/audition.ts:215 — FALSE as written, TRUE only for a player who plays safe ===
Steps the note asks for, exact over the real want draw:
  from AS_WRITTEN (dead centre):  1 step 12.04%, 2 45.37%, 3 42.13%   -> 2 is the mode, but a plurality not a majority
  from (1,1,1):                   1 12.04%, 2 29.69%, 3 34.84%, 4 22.97%   -> mode is 3
  from a bold (+3,-3,0):          1 3.01%, 2 11.34%, 3 19.56%, 4 22.22%, 5 27.78%, 6 15.97%   -> mode is 5
  uniform over every reading a player could play: mode is 4 steps (24.60%); 2 steps is 14.94%, the second-rarest value.
In play (dead-centre reading, 1,416 notes): 1 step 13.6%, 2 46.9%, 3 39.5%.

=== 13. "Safe is not wrong and it is not enough" — content/audition.ts:229 — TRUE ===
E[off | AS_WRITTEN] = 1.5000, which is above CLOSE_ENOUGH (1.2) and below TOO_FAR (3.4). P(off <= 1.2) from a dead-centre reading = 27.78%.
But a second, unstated fact: from a dead-centre reading the maximum possible off is 3.0, so `wrong-for-it` CANNOT fire on safe play — P = 0.0000%. Measured in play: 0 wrong-for-it on the tape and unanswered paths, 3 of 431 (0.7%) once a note is answered. Over all 343x343 pairs, 11.15% exceed TOO_FAR. TOO_FAR is a door only a bold reading can walk into.

=== 14. "as good as it gets and still not certain" / "The likeliest anybody is ever to say yes" = 0.82 — world/audition.ts:418, 755 — TRUE ===
Sweeping off across [0,6] and bisecting the roll against decideAudition itself: max P(cast) = 0.820000, reached flat across off in [0, 1.2].

=== 15. MISREAD_THE_ROOM = "the most of your read of a room that a bad day can take" / "at the ceiling it is nothing at all" — content/audition.ts:498, 512 — ARITHMETICALLY TRUE, NEVER REACHED IN PLAY ===
heardItRight = 1 - 0.35*(1-ready). At readiness 100 -> 1.0000; at 0 -> 0.6500.
Measured mean readiness at the moment of the note, 6 seeds x 12 years: 44.05. Mean heardItRight: 0.8042. Notes heard backwards: 78/427 = 18.3% (and 17.5%–19.3% across every variant run). The ceiling case the comment describes does not occur; the player is a permanently 20%-deaf performer.
Falsifiability test passes: the bold-reading run at mean readiness 47.16 gave 17.5% misheard vs 19.3% at 45.91 — the input moves the outcome.

=== 16. "Distance ... runs from nought to twice FURTHEST" — content/audition.ts:224 — TRUE ===
Over all 343x343 pairs: min 0, max 6 = 2*FURTHEST.

=== 17. howFarOff's "Nought is what they asked for and nobody ever gets it" — world/audition.ts — OVERSTATED ===
P(off == 0) for a dead-centre reading = 0.4630% (exactly 1/216). One reading in 216, not never.

=== 18. UNBITTEN:317 "Readiness is read in exactly one place: heardItRight in the audition room" — FALSE (stale) ===
readiness( has two engine readers now: src/engine/world/audition.ts:353 (heardItRight) and src/engine/world/audition.ts:693 (whatTheWeekTook), plus two UI readers.

=== 19. UNBITTEN:356 "`Audition.took` is written and read by nothing" — TRUE, and there is a second one it does not name ===
`audition.took` written at src/engine/world/audition.ts:592, zero readers anywhere in src/ or tests/.
`audition.heard` written at src/engine/world/audition.ts:599, zero readers anywhere. Same fault, same function, unrecorded.


**Method**

Read src/engine/content/audition.ts, src/engine/world/audition.ts, docs/DEPTH.md, docs/UNBITTEN.md and extracted every sentence making a checkable claim. Then three kinds of probe, all in /tmp/pr/, run with `cd /home/user/1221 && npx vite-node /tmp/pr/<file>.mjs`, all importing the real exported functions by absolute path (no reimplementation of howFarOff, theNote, afterTheNote, whatTheyWant or decideAudition).

(1) EXACT ENUMERATION (/tmp/pr/probe-claims-1.mjs, -2, -3, -4, -5, -6). All 7^3 = 343 readings x 343 wants = 117,649 pairs. Wants weighted by their exact draw probability, derived from Math.round((u*2-1)*3) with u uniform on [0,1): P(+-3) = 1/12, P(-2..+2) = 1/6 each. Cast chance taken as the real decideAudition branch: off > 3.4 -> 0, off <= 1.2 -> 0.82, else 0.82*(1-(off-1.2)/2.2)^1.4. "Among the best" = within 1e-12 of the maximum. Fatigue modelled exactly as afterTheNote does it: expected value = sure * outcome(heard right) + (1-sure) * outcome(direction inverted), evaluated at sure in {1, 0.95, 0.9, 0.8215, 0.8042, 0.75, 0.65}.

(2) LIVE DRAWS. 3,000,000 whatTheyWant calls (9,000,000 shade draws) through the real makeRng, and 2,000,000 howFarOff draws against AS_WRITTEN, to confirm the closed forms empirically.

(3) PLAYED SAVES (/tmp/pr/probe-play.mjs). quickSave({}, 'claims-<seed>') x 6 seeds, advanced 7 days at a time for 12 years. Every week: goUpFor every audition in goingNow that freeAcross allows, with a fixed reading; then takeTheNote on every audition sitting in state 'noted' with a fixed answer. Twelve configurations: way in {tape, room} x answer in {skip, none, touch, good, far} x reading in {AS_WRITTEN, (3,-3,2)}. Collected why-counts, final howFarOff, readiness and heardItRight at the moment of the note, and the audition.heard flag. 72 seed-years per configuration, 390-478 decided readings each.

(4) P(cast) read off decideAudition directly (/tmp/pr/probe-keen.mjs) by 50-step bisection on the roll at fixed off values, so the curve in the numbers is the shipped function's own output rather than my transcription of it.

(5) grep for read sites of audition.took, audition.heard and readiness( across src/ and tests/.

Checksums of both audition files were taken before and after the play matrix and were unchanged. Nothing in /home/user/1221 was written.


**Surprises**

1. THE FILE IS MOVING UNDER YOU. src/engine/content/audition.ts and tests/audition.test.ts were dirty and being written while I measured (mtimes 21:55:11 and 21:57:45 against a 21:58:55 clock). One probe run mid-write returned howFarOff as a SUM rather than a mean and produced a completely different why-distribution; it did not reproduce on re-run. Everything reported is post-checksum. Another agent has already replaced the 1.7/flat sentences with "1.5" and a correct description of the 1/12-1/6 shape, plus two new tests pinning it — my figures were arrived at independently and agree exactly.

2. YOUR 68% AND 51% BOTH CHECK OUT, AND THE 51% IS THE WRONG BASELINE. Room + A Good Deal gives 60.1% over 6 seeds x 12 years (you had 68% over 3 seeds x 10 years — same direction, and the analytic value at the measured readiness is 69.92% before `dates` losses, so your figure is the free-for-the-dates one and mine is the all-in one). But "never answering the note" is not the tape: since notes now settle on the first day of the shoot, the unanswered path costs three days AND eats availability, so it reads 51.0%. The honest no-information baseline is the TAPE, which casts 61.1%. That makes the room's advantage even smaller than the 51-vs-68 gap suggests — it is +9 parts in 72 seed-years, and the cast RATE is a point lower in the room than on tape.

3. `wrong-for-it` IS UNREACHABLE BY SAFE PLAY. Max off from a dead-centre reading is 3.0; TOO_FAR is 3.4. The pass reason the file spends a whole comment fitting cannot fire on the reading the file expects most players to send. It fires at 23.9% only on a bold reading answered As Far As It Goes. The TOO_FAR comment's "playing it safe lands between the two thresholds" is true in expectation and structurally impossible to violate in the other direction.

4. "MOST NOTES WANT ABOUT THIS" IS A CLAIM ABOUT THE PLAYER, NOT THE ROOM. A Good Deal is the mode (45.4%) if you play dead centre, and the second-rarest answer (14.9%) averaged over every reading you could play, where the mode is 4 steps — a distance no button can reach. The button's own label is only correct for the timid.

5. THE 80% AND THE "CEILING" COMMENT CONTRADICT EACH OTHER. content/audition.ts:206 says the favorite is among the best in about 80%; content/audition.ts:512 says a rested performer simply hears the room. Both are true and they cannot both be the design: at sure=1 the figure is 95.9% and only TWO steps are ever uniquely best (far in 1,166 of 1,764 readable situations, good in 10). The decision only exists because the player is permanently tired — measured mean readiness 44.05, heardItRight 0.8042, 18.3% of notes heard backwards. If anything ever fixes readiness, 'As Far As It Goes' becomes the button again.

6. UNBITTEN's 117,306 TABLE IS EXACTLY RIGHT AND MEASURED UNDER THE OLD NOTE RULE. I could only reproduce 16,514 / 47,738 / 39,242 with the note on the CLOSEST shade and the move rounded to an integer. Under the shipped farthest-shade rule the same enumeration gives 14,258 / 33,914 / 75,458. The table is honest; nothing on the page says which note rule it was taken under, and the shipped one is not it.

7. A SECOND DEAD WORD NOBODY HAS NAMED. UNBITTEN lists `Audition.took` as written-and-never-read. `audition.heard` (world/audition.ts:599) is the same fault in the same function, three lines later, and appears on no list. And UNBITTEN:317's "readiness is read in exactly one place" is now stale — whatTheWeekTook reads it too.


### The tape is dominated in every state of the world: `sawYou` never touches the odds (0 outcome flips in 80,601 cells), the room's `Leave It` button reproduces the tape's distance exactly in 343/343 wants, and answering the note instead is worth +5.76 points of P(cast) — so the room's action set strictly contains the tape's, and the tape buys only €120 and 155 fewer clock-stops per 25 years.

*Confidence: analytic*


**Numbers**

## 1. The crux: `sawYou` is a label, not a probability

`src/engine/world/audition.ts:415-426` — `sawYou` appears on exactly one line, *after* the cast decision is already made:

```ts
export function decideAudition(reckoning: Reckoning, roll: number): WhyId {
  if (!reckoning.free) return 'dates';
  if (reckoning.off > TOO_FAR) return 'wrong-for-it';
  const keen = reckoning.off <= CLOSE_ENOUGH
    ? AS_GOOD_AS_IT_GETS
    : AS_GOOD_AS_IT_GETS
      * (1 - (reckoning.off - CLOSE_ENOUGH) / (TOO_FAR - CLOSE_ENOUGH)) ** 1.4;
  if (roll < keen) return 'cast';
  return reckoning.sawYou ? 'went-another-way' : 'not-in-the-room';   // <-- the only read
}
```

Falsifiability probe, 80,601 `(off ∈ [0,4] × 0.01, roll ∈ [0,1] × 1/200)` cells, flipping `sawYou`:

| effect | cells changed |
|---|---|
| **CAST outcome flips** | **0** |
| label flips | 33,637 (41.7%) |

Downstream, `readFor` (audition.ts:91-94) filters on `state !== 'open' && why !== 'never-answered'` — `went-another-way` and `not-in-the-room` are **identical** to `remembersYou`, `believedOf`, `ignoredBy` and the whole ratchet. The only other reader of the label anywhere in `src/` is `sayWhy`, which prints it.

## 2. What the "3 days" actually does

`way.days` reaches exactly one expression, `goUpFor` (audition.ts:551):
```ts
const at = sim.now + Math.round(way.days * MS_DAY);
```
It sets *when the event fires*. It reserves nothing. `world/diary.ts:46-76` `whatHasThem` reads only `universe.projects[].cast` and auditions with `why === 'cast'` — **it never touches `sim.timeline`**, so `requiresPlayer`/`durationMinutes` can never make the player un-free. And `goUpFor`'s only date gate is `freeAcross(sim, audition.from, audition.to)` — the **shoot** window, identical for both ways.

Direct probe (`/tmp/probe-tape-6.mjs`): four solid 24h `requiresPlayer` blocks laid over the audition window —

| check | result |
|---|---|
| `timeline.conflicts(now+3d, 90)` | **1 item** ("Blocked All Day") |
| `freeAcross(shoot)` before / after | true / **true** |
| `goUpFor('room')` | **`{"ok":true,...}`** — state `waiting` |

`requiresPlayer + IN_THE_ROOM(90)` reaches three places, none of which is an outcome: UI clash chips (`calendar.ts:112-120` → `day.tsx`, `CalendarWorkspace.tsx`), `suggestedSleep`/`hoursUntilNextCommitment` (read only by `TimeControls.tsx`), and `advanceTo(stopOnPlayerRequired)`.

## 3. Diary contention, measured on a real played save

**Count of auditions a room-going player had to turn down that a taping player would not: 0.**

3 seeds × 25 years × 5 arms, going up for everything:

| arm | attempts | refused | refused for **shoot dates** | refused for **anything else** |
|---|---|---|---|---|
| tape/no answer | 763 | 325 | 325 | **0** |
| room/no answer | 678 | 166 | 166 | **0** |
| room/touch | 763 | 290 | 290 | **0** |
| room/good | 772 | 302 | 302 | **0** |
| room/far | 750 | 261 | 261 | **0** |

The 90-min slot did overlap another `requiresPlayer` item 21 times per 75 career-years — it changed nothing. And the world never generates the contention anyway: **most open asks standing at once over 25 years at daily cadence = 2, 2, 4** (days with 2+ open: 72 / 34 / 85 out of 9,125). Reserving a whole day would collide on 20/470 readings — **the same 20 whether the reserve is 1 day or 3**, so wiring the days up would still produce zero tape-vs-room differential.

## 4. Is €120 ever a real cost?

The room costs `costsCents: 120_00` = **12,000 cents = €120.00** (not €1.20). `goUpFor` posts it with **no affordability check at all**:

| probe | result |
|---|---|
| `goUpFor('room')` with balance forced to **0** | `{"ok":true,"at":1799911800000}`, balance left at **−€120** |
| weeks in 3,900 career-weeks with balance < €120 | **0** |
| weeks negative | **0** |
| balance at a reading (470 real readings) | min **€1,120** · median **€1,065,811** · max **€2,250,046** |
| mean fee of a part offered | **€19,378** |
| readings where €120 > 1% of balance | 17 / 470 |
| readings where €120 > 5% of balance | **5 / 470** (reading #1 = 9.68%, #2 = 6.56%, #3 onward = 0.20%) |

Payback per reading, on the same 470 real readings: room/touch +€850, **room/good +€1,180 (9.8× the fee)**, room/far +€736.

## 5. P(cast): tape vs room

**(a) Exact enumeration over all 343 wants**, dead-center reading, free dates. `sure` = `heardItRight`:

| arm | sure=1.00 | sure=0.825 | sure=0.65 (MISREAD floor) |
|---|---|---|---|
| **tape** (= `Leave It` = note never answered) | **0.6259** | **0.6259** | **0.6259** |
| room / touch (1 step) | 0.7175 | 0.6810 | 0.6445 |
| room / good (2 steps) | 0.7764 | 0.7074 | 0.6384 |
| room / far (3 steps) | 0.7872 | 0.6953 | 0.6035 |

**(b) Paired on 470 real readings** from a played career (mean readiness 30.0, mean `sure` 0.7549, min 0.6868):

| arm | E[P(cast)] | vs tape |
|---|---|---|
| tape | 0.6132 | — |
| room / touch | 0.6559 | +4.27 pts (+7.0%) |
| **room / good** | **0.6708** | **+5.76 pts (+9.4%)** |
| room / far | 0.6510 | +3.78 pts (+6.2%) |
| room / clairvoyant best | 0.7065 | +9.33 pts |
| room / adversarial worst | 0.5793 | −3.39 pts |

**The dominance proof.** `afterTheNote(r, note, 'none', sure, roll)` returns `r` for every roll — verified identical distance in **343/343** wants. The room's outcome set therefore *contains* the tape's outcome exactly. **The tape is weakly dominated at every state and strictly dominated by three of the four buttons at every readiness.** The only way to do worse than the tape from inside the room is to pick per-state adversarially, which the player cannot do — they have no state information beyond the note. The tape is never right.

**(c) End-to-end raw career rate**, daily cadence (note answered the day it arrives), 3 seeds × 25 years:

| arm | settled | cast | cast/settled | lost to `dates` | mean days settle→shoot |
|---|---|---|---|---|---|
| tape | 427 | 267 | 0.6253 | 0.5% | 26.1 |
| room / touch | 443 | 291 | **0.6569** | 2.9% | 24.2 |
| room / good | 446 | 286 | 0.6413 | 3.1% | 24.2 |
| room / far | 448 | 286 | 0.6384 | 2.7% | 24.2 |
| **room / no answer** | 528 | 286 | **0.5417** | **14.8%** | **−0.7** |

The 2 extra days do cost something, and it is *not* diary contention: `settle` re-checks `freeAcross` at settlement time, so settling later means more chance of already being cast elsewhere. That eats ~2.5 points of the room's 5.76, leaving +1.3 to +3.2 raw points. (At n≈445 the SE on a rate is ~2.3 pts, so touch/good/far are not separable end-to-end; the conditional figures in (a)/(b) are exact and are the load-bearing ones.)

## 6. What would have to be true for the tape to be a real choice — cheapest first

1. **Make the room cost readiness.** `heardItRight` already reads `readiness`; nothing takes readiness for the 90 minutes, and `whatTheWeekTook` is the working template. Measured lever: at `sure=0.65`, `far` falls to 0.6035, **below** the tape's 0.6259. Cheapest by far — but on its own it is not enough, because `touch` still scores 0.6445 and `Leave It` still ties exactly.
2. **Make the fee a share of the fee, not a flat €120.** Today it is 0.62% of the mean part (€19,378) and 0.011% of the median balance. At 10% of the fee (mean €1,938) the payback at `good` falls from **9.8× to 0.61×** and the tape wins on money for every part under about **€20,500** — which is 58% of the parts offered. One number in `WAYS`.
3. **Give `sawYou` a coefficient.** It is already threaded through `Reckoning` into `decideAudition` and read by nothing but a ternary. Any multiplier turns the crux line from prose into a mechanism — but note it makes the tape *worse*; the useful direction is the inverse (see 5).
4. **Make the days real in the diary.** `whatHasThem` would have to read `sim.timeline`, or `goUpFor` call `timeline.conflicts` and refuse. Measured cost as the world stands: **zero** — max 2-4 open asks in 25 years, and 1-day and 3-day reserves collide on the identical 20/470. It only becomes a lever once `whatIsGoing` puts out more than one ask at a time, or the player's own `world/plans.ts` items fill the week.
5. **Let a tape reach a room the player cannot stand in.** `freeAcross` already refuses 325/763 tape attempts on shoot dates, and `shootingHere` already knows which bookings are foreign calls. A tape that can be sent where the body cannot go makes the tape the *only* way in for some asks — the strongest version, because it makes the choice about which asks you can answer at all rather than about the odds on one.
6. **Let `remembersYou` tell the two apart.** `readFor` counts a tape and a room identically, so `COLD + readFor*REMEMBERED + fame*KNOWN_OF` is blind to the way in. A tape worth a fraction of a room in roster memory would make taping a decision about next year rather than this part — which is the file's own stated premise ("the ratchet is being remembered, not being cast").
7. **Let `reliability` read the way in.** `A_WORKING_WEEK` moves reliability off readiness; nothing moves it off an audition. A room walked into with nothing left is exactly the "late once, short with the second AD" that `whatTheWeekTook` already describes — and `RELIED_ON` already feeds back into `remembersYou`.


**Method**

All probes are read-only, written to /tmp, run with `cd /home/user/1221 && npx vite-node /tmp/probe-tape-N.mjs` on branch claude/slate-cleanup-e4apmx at 19245c6.

- **/tmp/probe-tape-1.mjs** — want-draw distribution two ways: (a) a 1,000,000-point uniform grid pushed through the literal expression `Math.round((u*2-1)*FURTHEST)`; (b) 900,000 shade draws through `whatTheyWant` itself with `Math.random`. Then the exact off-distribution of a dead-centre reading over all 343 wants with rational weights.
- **/tmp/probe-tape-2.mjs** — exact enumeration of P(cast) per arm over all 343 wants. P(cast) is *measured through the real `decideAudition`*, not re-derived: bisect on `roll` for 80 iterations to find the measure of rolls returning `'cast'`. Both `afterTheNote` branches are walked (roll=0 → heard right, roll=1−1e−12 → heard wrong) and weighted by `sure`. Also sweeps all 343 blind readings for the tape's best/worst.
- **/tmp/probe-tape-3.mjs** — 5 arms × 3 seeds (`t1`,`t2`,`t3`) × 25 years on `quickSave({}, seed)`, weekly `advanceTo`, going up for every open part with a dead-centre reading. Counts asks, attempts, refusals split by cause, `sim.timeline.conflicts(at, IN_THE_ROOM)` at booking time, notes given/unanswered, fees, balance min/max, readiness and `heardItRight`.
- **/tmp/probe-tape-4.mjs** — the paired measurement. One canonical career per seed (policy room/good); at each go-up it records the real `wants`, the real `heardItRight`, the real fee and balance, then scores *every* arm on that same state. Removes the arm divergence that confounds §3. Also forces an account balance to 0 and calls `goUpFor('room')`.
- **/tmp/probe-tape-5.mjs** — the falsifiability grid (80,601 `(off, roll)` cells through `decideAudition` with `sawYou` flipped); `Leave It` vs tape distance over all 343 wants; among-best/uniquely-best counts per button.
- **/tmp/probe-tape-6.mjs** — the diary experiment: four 24h `requiresPlayer`/`durationMinutes` blocks scheduled over the audition window (kind `WORKING_KIND` so a handler exists), then `freeAcross`, `timeline.conflicts` and `goUpFor('room')` compared.
- **/tmp/probe-tape-7.mjs** — clock halts: walks 25 years with `advanceTo(target, {stopOnPlayerRequired:true})` in a loop, attributing each halt to `AUDITION_KIND` or `WORKING_KIND`.
- **/tmp/probe-tape-8.mjs** — euro payback per reading and the hypothetical 1-day vs 3-day reserve collision count.
- **/tmp/probe-tape-9.mjs** — all 117,649 (reading, want) pairs, 117,306 of which give a note, scoring every button at sure=1 and sure=0.7549, to check HOW_FAR's own 80% claim.
- **/tmp/probe-tape-10.mjs** — simultaneous open asks at daily cadence on a playing career.
- **/tmp/probe-tape-14.mjs / -15.mjs** — settlement-lag and end-to-end raw career rates at weekly and daily cadence, splitting `dates` losses out of the no count.

Verification note: an earlier run (/tmp/probe-tape-11.mjs) produced cast counts (37/551) irreconcilable with every other probe. I rebuilt the measurement from a minimal reproducer (/tmp/probe-tape-12.mjs, /tmp/probe-tape-13.mjs) that exactly reproduces probe-3's per-seed `why` histograms, and re-ran it as probe-14/15. The probe-11 figures are discarded and none are reported here.


**Surprises**

**1. "MOST READINGS END IN NO" is false in every arm.** `CLOSE_ENOUGH`'s comment (content/audition.ts) asserts it as "the research's own first sentence about the pass." Measured P(cast) for a dead-center reading, free dates: **0.6259 in the *worst* arm** (tape / Leave It / note never answered, and it is `sure`-independent) and **0.7872 at best**. End-to-end on a played career at daily cadence: 0.6253 (tape) to 0.6569 (room/touch). Most readings end in **yes**, at every readiness, in every arm. The tightness the comment claims to be buying is not there.

**2. `TOO_FAR`'s "about 1.7 out" is wrong, and so is "DRAWN FLAT ACROSS THE RANGE."** Measured E[off] for a dead-center reading = **1.500000 exactly** (E|W| = 2·(1/6 + 2/6 + 3/12) = 1.5). The draw is not flat: `Math.round((next()*2-1)*FURTHEST)` maps u∈[0,1) onto seven values with **P(±3) = 1/12** and **P(each of −2..2) = 1/6**, because the two end buckets are half-width under JS `Math.round`. Confirmed on a 1e6-point grid (0.083333 / 0.166667) and through `whatTheyWant` itself over 900,000 draws (0.0836 / 0.1661). The independent auditor is right on both counts. The fitted threshold is fitted to a number the code does not produce.

**3. `wrong-for-it` is unreachable for a tape.** Max off for a dead-center reading is 3.0 < `TOO_FAR` 3.4, so **P(off > TOO_FAR) = 0.0000** for the tape at every readiness. The only way to be told you were wrong for the part is to answer a note and be inverted: 0.00% at sure=1, 0.57% at `far`/sure=0.825, 1.13% at `far`/sure=0.65. The one no the game frames as a real mistake belongs exclusively to the room — so the tape cannot even lose in the interesting way.

**4. The room costs €120.00, not €1.20.** `WAYS[1].costsCents = 120_00` = 12,000 cents, and `src/engine/core/money.ts` is explicit that money is integer cents. The brief (and, I suspect, whatever screen prints it) is out by 100×. It does not change the conclusion — €120 against a €19,378 mean fee and a €1.07M median balance is still noise — but the figure in circulation is wrong.

**5. `HOW_FAR`'s 80% claim holds exactly.** Over all **117,306** reachable (reading, want) states that give a note, at sure = 0.7549 (the mean `heardItRight` measured on a played career), the favorite (`far`) is among the best in **80.5%**. At sure = 1 it is 95.9%. The comment's "about 80%" is a real, reproducible figure at real readiness — this is the one self-description in the file that survives measurement intact.

**6. Not answering the note is far worse than taping, and not for the reason the prose gives.** room/no-answer settles at mean **−0.7 days** relative to the first day of the shoot (it settles *on* it, via `shutWhatHasClosed`), against the tape's 26.1 days early. Because `settle` re-checks `freeAcross`, that pushes `dates` losses from **0.5% to 14.8%** and the career cast rate from 0.6253 to **0.5417**. The distance played is identical to the tape's — the entire 8.4-point gap is the settlement date. This is also where the parent's "never answering the note: CAST 51%" comes from: it is not a statement about the note, it is a statement about when the clock catches you.

**7. The 2 extra days do have one real cost, and it is not the diary.** Same mechanism as (6), smaller: room-with-an-answer settles 24.2 days out vs the tape's 26.1, raising `dates` losses from 0.5% to ~3%. That eats roughly 2.5 of the room's 5.76 conditional points. So `way.days` is not entirely dead — but it bites through `settle`'s availability re-check, not through anything anyone would call a calendar clash, and nothing in the code or comments says so.

**8. The room's only unambiguous cost to the player is UI friction.** 25 years: the tape arm halts `advanceTo(stopOnPlayerRequired)` **407** times, the room arm **560** — 155 extra forced stops, every one an audition-room slot. That, plus €120, is the entire price of the information.


### whatTheyWant is not flat — Math.round on [-3,3) gives the ends half weight (P(±3)=1/12, P(-2..2)=1/6 each), which makes E[off] for a dead-centre reading exactly 1.5000, caps a dead-centre reading's off at 3.0 so TOO_FAR=3.4 is literally unreachable, and is the sole reason 'A Good Deal' (2 steps) is the posterior mode of the note at all — under a genuinely flat want the mode flips to 3 steps.

*Confidence: analytic*


**Numbers**

## 1. The want draw — analytic, then 1,800,000 real draws

`Math.round((next()*2-1)*FURTHEST)` maps u∈[0,1) to y=6u-3 ∈ [-3,3). JS rounds half-up, so round(y)=k on [k-0.5,k+0.5), and both ends are clipped to half-width by the support.

| k | analytic | empirical (1,800,000 draws) | ×216 | flat would be |
|---|---|---|---|---|
| -3 | 1/12 = 0.083333 | 0.083464 | 18.03 | 0.142857 |
| -2 | 1/6 = 0.166667 | 0.166793 | 36.03 | 0.142857 |
| -1 | 1/6 | 0.166913 | 36.05 | 0.142857 |
| 0 | 1/6 | 0.166446 | 35.95 | 0.142857 |
| +1 | 1/6 | 0.166218 | 35.90 | 0.142857 |
| +2 | 1/6 | 0.166765 | 36.02 | 0.142857 |
| +3 | 1/12 | 0.083401 | 18.01 | 0.142857 |

chi-square vs analytic = 4.098 (6 df, p≈.66 — fits). chi-square vs flat = 124,588. NOT FLAT, at overwhelming significance.
E|W| measured 1.500843, analytic 1.500000. Flat would give 12/7 = 1.714286 — which is exactly where the old "about 1.7" came from.

Derived per-shade error from dead centre: |W| ∈ {0,1,2,3} with p = {1/6, 1/3, 1/3, 1/6}. E=1.5, sd=0.957427.

## 2. off for a dead-centre reading — exact, full pmf (denominator 5832)

| off | p | ×5832 | cum |
|---|---|---|---|
| 0.0000 | 0.004630 | 27 | 0.004630 |
| 0.3333 | 0.027778 | 162 | 0.032407 |
| 0.6667 | 0.083333 | 486 | 0.115741 |
| 1.0000 | 0.162037 | 945 | 0.277778 |
| 1.3333 | 0.222222 | 1296 | 0.500000 |
| 1.6667 | 0.222222 | 1296 | 0.722222 |
| 2.0000 | 0.162037 | 945 | 0.884259 |
| 2.3333 | 0.083333 | 486 | 0.967593 |
| 2.6667 | 0.027778 | 162 | 0.995370 |
| 3.0000 | 0.004630 | 27 | 1.000000 |

E[off]=1.500000 sd=0.552771 (= 0.957427/√3). p10=0.6667 p25=1.0000 **p50=1.3333** p75=2.0000 p90=2.3333. Support [0, 3].
P(off ≤ CLOSE_ENOUGH 1.2) = 27.778% (= 60/216). **P(off > TOO_FAR 3.4) = 0.000%, exactly.**
P(cast | dead centre, no note answered, free) = 0.625851.

**Best fixed reading: (0,0,0), uniquely.** It is best by both E[off] (1.500000) and P(cast) (0.625851); 1 of 343 at the minimum, no ties. Worst: (3,3,3), E[off]=3.000000, P(cast)=0.191067. Most-wrong-for-it-prone: (−3,3,3), P(off>3.4)=32.060%.

## 3. What one note is worth

Information: H(one shade)=2.7516 bits, H(whole want)=8.2549 bits. The note is deterministic given the want, so I(want;note) = H(note) = **2.5331 bits — 30.69% of the want's entropy.**

From a dead centre opening (sure=1, fully rested):

| answer | E[off] | p50 | P(off≤1.2) | P(cast) exact | P(cast) MC 2,000,000 |
|---|---|---|---|---|---|
| none (0) | 1.500000 | 1.3333 | 27.778% | 0.625851 | 0.62541 |
| touch (1) | 1.168210 | 1.0000 | 50.000% | 0.717490 | 0.71732 |
| good (2) | **0.916667** | 1.0000 | 72.222% | 0.776374 | 0.77678 |
| far (3) | 0.967593 | 1.0000 | 69.907% | **0.787229** | 0.78717 |
| ORACLE (knows the magnitude) | 0.736111 | 0.6667 | 84.722% | 0.803484 | — |

E[off] before the note 1.500000 → 0.916667 best fixed answer → 0.736111 oracle floor. One note buys 38.9% of the distance to zero; a perfect answer would buy 50.9%. P(cast) 0.6259 → 0.7872 → 0.8035 (ceiling is AS_GOOD_AS_IT_GETS 0.82).

Under fatigue (sure = 1 − 0.35·(1−readiness/100)), P(cast):

| readiness | sure | none | touch | good | far | best |
|---|---|---|---|---|---|---|
| 100 | 1.0000 | 0.6259 | 0.7175 | 0.7764 | **0.7872** | far |
| 80 | 0.9300 | 0.6259 | 0.7029 | 0.7488 | **0.7505** | far |
| 60 | 0.8600 | 0.6259 | 0.6883 | **0.7212** | 0.7137 | good |
| 49 | 0.8215 | 0.6259 | 0.6803 | **0.7060** | 0.6935 | good |
| 20 | 0.7200 | 0.6259 | 0.6591 | **0.6660** | 0.6402 | good |
| 0 | 0.6500 | 0.6259 | **0.6445** | 0.6384 | 0.6035 | touch |

far overtakes good at sure=0.91709, i.e. **readiness 76.31/100**. good overtakes touch at sure=0.68271, readiness 9.35/100. `none` is never best anywhere.

## 4. Posterior magnitude given a note (the "Most notes want about this" claim)

The noted magnitude is max of three iid |W|. P(a note at all) = 215/216 = 0.995370.

| true magnitude | P given a note (ACTUAL) | P given a note (FLAT) |
|---|---|---|
| 1 | 0.120930 | 0.076023 |
| 2 | **0.455814 (mode)** | 0.286550 |
| 3 | 0.423256 | **0.637427 (mode)** |

E[magnitude | note] = 2.302326 (actual), 2.561404 (flat).
E|magnitude − steps|: none 2.302326, touch 1.302326, **good 0.544186**, far 0.697674.

So 2 IS the posterior mode — by 0.0326, 45.58% vs 42.33%. It is not "most".

## 5. A genuinely flat want (−3..3 each 1/7) — side by side

| quantity | ACTUAL | FLAT | moves |
|---|---|---|---|
| E[off] dead centre | 1.500000 | 1.714286 | +14.3% |
| sd of off | 0.552771 | 0.594762 | +7.6% |
| p50 of off | 1.3333 | 1.6667 | +1 step of 1/3 |
| P(off≤1.2) dead centre | 27.778% | 18.367% | −34% relative |
| P(off>3.4) dead centre | 0% | 0% | unchanged |
| P(cast) no note | 0.625851 | 0.547385 | −7.8 pts |
| P(cast) note+good | 0.776374 | 0.734724 | −4.2 pts |
| P(cast) note+far | 0.787229 | 0.773294 | −1.4 pts |
| posterior mode of magnitude | **2** | **3** | FLIPS |
| best answer at readiness 49 | good | far | FLIPS |
| best answer at readiness 100 | far | far | same |
| I(want;note) | 2.5331 bits | 2.5198 bits | −0.5% |
| best fixed reading | (0,0,0) | (0,0,0) | same |

Material, and in one specific place: the flat want makes HOW_FAR's 'good' row false. Under flat, 'far' is both the posterior mode (63.7%) and the P(cast)-best answer at every readiness above ~20, which collapses the decision the HOW_FAR comment says it fixed.

## 6. The 3-shade mean and the reachable range

Over all 343 readings × the full want space: off ∈ [0, 6], mean 2.166667, P(off≤1.2)=13.774%, P(off>3.4)=7.953%.

- A total miss on ONE shade (|err|=6, other two exact) gives off = 6/3 = **2.0000 — not wrong-for-it.**
- off > 3.4 needs Σ|err| > 10.2 out of a possible 18, so **at least two shades must be maxed**. One shade can never do it.
- 7 of 343 readings can never be wrong-for-it against any want: (0,0,0), (±1,0,0), (0,±1,0), (0,0,±1). The other 336 can.
- From dead centre, TOO_FAR sits above the entire support. To exclude anything at all it would have to fall to ≤ 3.0; to bite 10% of dead-centre readings it would have to fall to ≤ 2.3333.
- The only way a dead-centre reading becomes wrong-for-it is by answering the note in the inverted direction: P(wrong-for-it) at readiness 49 is 0% (none), 0% (touch), 0.083% (good), 0.578% (far). Exactly 0 at readiness 100.

## Bonus: the tie-break biases which shade gets the note

`theNote` breaks ties to the first shade declared. From dead centre that is not neutral:

| note | P |
|---|---|
| warmth ± | 0.481482 |
| size ± | 0.305556 |
| pace ± | 0.208334 |
| none | 0.004630 |

Warmth draws 48.1% of all notes and pace 20.8% — a 2.3× spread produced entirely by declaration order in SHADES.


**Method**

All exact figures are a closed-form enumeration over the complete 343-point want space (7³) with exact rational weights (1/12 for ±3, 1/6 otherwise, denominators 1728 and 5832), calling the real engine functions — `whatTheyWant`, `howFarOff`, `theNote`, `afterTheNote`, `decideAudition`, `AS_GOOD_AS_IT_GETS`, `SHADES`, `HOW_FAR`, `CLOSE_ENOUGH`, `TOO_FAR`, `MISREAD_THE_ROOM`, `FURTHEST` — via absolute imports from /home/user/1221/src/engine/. Six probes in /tmp/probe/probe-want-{1..6}.mjs, run with `cd /home/user/1221 && npx vite-node /tmp/probe/probe-want-N.mjs`.

The `keen` reimplementation used for P(cast) was verified against the real `decideAudition` by bisection at off=2.0: roll = keen−1e−9 returns 'cast', roll = keen+1e−9 returns 'went-another-way'.

Empirical confirmations, all through the real `makeRng` (mulberry32) rather than Math.random:
- The want shape: 600,000 wants × 3 shades = 1,800,000 draws across 60 seeds (probe 1). Chi-square against the analytic pmf 4.098 on 6 df; against flat 124,588.
- The answer table: 2,000,000 simulated rooms per (readiness × howFar) cell, drawing the want with `whatTheyWant`, taking the note with `theNote`, answering with `afterTheNote` using the real `sure`/`roll` inversion, and deciding with the real `decideAudition` (probe 4). Every cell matches the exact enumeration to 4 decimal places.

The fatigue sweep folds both branches of `heardItRight` analytically: the reading after the note is evaluated at weight `sure` for the note's direction and `1−sure` for the inverted direction, `sure = 1 − MISREAD_THE_ROOM·(1 − readiness/100)`, matching `afterTheNote(..., sure, roll)`'s `roll < sure` test exactly. Crossover readiness values found by 60-step bisection on `sure`.

The flat comparison substitutes weight 12/7 for every value and re-runs the identical code path — nothing else changes.

The "best two-stage play" figure buckets wants by the observable (note shade, direction), takes the best `howFar` per bucket, and sums — an upper bound on any policy a player could actually follow, since (shade, direction) is all they are told.


**Surprises**

**The comment quoted in the brief no longer exists.** `src/engine/content/audition.ts` was already corrected today in commit 848b17e ("The room's want was described in prose, twice wrong"). TOO_FAR's comment now reads "a reading played dead center is 1.5 out" and describes the 1/6–1/12 shape explicitly, and `tests/audition.test.ts:596` ("draws the two ends half as often as everything between them") pins P(±3)=1/12 and P(−2..2)=1/6 over 120,000 draws, with a second test pinning the 1.5 mean. So the independent auditor's finding has already landed and is now tested. I re-derived it independently and it is right: 1.5000 exactly, not 1.7; 1.714286 is what a flat draw would give.

**TOO_FAR = 3.4 is dead code for the only reading anyone should play.** A dead-center reading's off has support [0, 3.0]. The `wrong-for-it` branch cannot fire. More generally a total miss on one shade is only off = 2.0; you need two of three shades maxed to reach 3.4. So TOO_FAR's own comment — "playing it safe lands between the two thresholds" — is true of the *mean* but hides that the entire distribution is below the upper one. The threshold only ever bites a player who deliberately plays an extreme reading (336 of 343 readings can reach it, but 'safe' is in the 7 that cannot), or one who answers a note with `far` on a bad day (0.578% at readiness 49). That is the falsifiability test failing for TOO_FAR against the reading a rational player picks.

**"MOST READINGS END IN NO" is false, and the want distribution is why.** CLOSE_ENOUGH's comment says so as the research's first sentence. Measured: dead center + go in + answer 'good' is 0.7764 cast at full readiness, 0.7060 at readiness 49; even a tape with no note at all is 0.6259. That corroborates the brief's 68%/51% field numbers once you allow for the dates gate. The cause is squarely in my lens: the mean-of-three collapses the per-shade sd 0.957 to 0.553, so off piles up at 1.33–1.67, and CLOSE_ENOUGH=1.2 already catches 27.8% of blind readings before anybody says anything.

**CLOSE_ENOUGH's other claim is true but under-sold.** "One note taken the whole way pulls an average guess inside it" — at full readiness *every* non-zero answer pulls the mean inside 1.2 (touch 1.168, good 0.917, far 0.968), not just the whole way. At readiness 49 only `good` still does (1.140); touch (1.287) and far (1.240) both fall back outside.

**'A Good Deal' is the posterior mode only by accident of the rounding.** HOW_FAR's 'good' row says "Most notes want about this". 2 steps is the mode at 45.58% — which is not "most" — and it is the mode *because* ±3 was given half weight. Make the want genuinely flat and P(magnitude=3 | note) becomes 63.74% and the mode is `far`. The comment in TOO_FAR calls the non-flat shape "an artifact of the rounding kept on purpose"; my measurement says it is load-bearing for a claim in a different constant's comment, which nothing currently connects.

**The posterior mode and the best button are not the same button.** At full readiness `good` minimises E[off] (0.9167 vs far's 0.9676) but `far` maximises P(cast) (0.7872 vs 0.7764) — the convexity of `keen` below CLOSE_ENOUGH pays for the extra variance. They cross at readiness 76.31. So the HOW_FAR comment's "which one is best moves with readiness" is confirmed with a number: the favorite changes at 76.31 and again at 9.35.

**SHADES declaration order is a balance lever nobody named.** `theNote`'s ties-to-first rule gives warmth 48.1% of all notes, size 30.6%, pace 20.8%. The comment defends the tie-break as determinism, which it is, but a player who knows the order knows pace is the shade the room is least likely to talk about — a 2.3× asymmetry produced by nothing but the array order in a content file.


### There is no published per-audition booking rate for a directly-requested screen actor; the best-evidenced band for that narrow population is 15-30% (the producer-session round, 1 of 3-5 people), against which SLATE's room books 78.72% for optimal play and 62.59% for a tape — and the entire want/reading/distance model only moves that number 3.28 points off AS_GOOD_AS_IT_GETS.

*Confidence: small-sample*


**Numbers**

## A. REAL-WORLD FIGURES FOUND (each with population and how bad it is)

| figure | source | date | population | what it actually is |
|---|---|---|---|---|
| 1 booking per 15-25 auditions (4.0-6.7%) | Acting Magazine, "What is a Booking Ratio?"; Backstage, "Booking Ratios" | 2018 / 2012 | "repped actors, as agents judge them" | **trade-press assertion. No n, no method, no dataset.** Recycled verbatim across a dozen coaching blogs. Do not cite as a statistic. |
| 1 in 20 (5%) | Backstage, "Booking Ratios" | 2012 | "young or less experienced actors" | same. assertion. |
| "average booking rate 1-3%" | castmenow / boostmystar coaching blogs | 2024-25 | unstated | **no denominator at all.** This is the worst of the lot and the most repeated. Reject. |
| Leah Rose: **commercial 3/73 = 4.1%**, **theatrical 4/24 = 16.7%**; 11 and 2 callbacks respectively | Career ACTivate, "A Year's Worth of Audition Stats From 2 Actors" | 2020 data, pub. 2021 | one LA union working actor, self-logged | **primary data with a real denominator.** n=1 actor. Her theatrical 16.7% is the closest published analogue to SLATE's situation. |
| Edward Hong: **theatrical 1/158 = 0.6%**, commercial 1.5/43 = 3.5%; 201 auditions total | same | 2020 | one LA union working actor, self-logged | primary, n=1. Note the 27x spread against Rose on the same metric in the same city in the same year. |
| ~4,000 submissions (3,500 via Breakdown) → ~500 selected → 200+ prereads → 35 callbacks for 6 roles, 3 roles cast straight out of prereads | Bonnie Gillespie (casting director), "Casting by the Numbers" | 9 May 2005 | one SAG Limited Exhibition short | **a casting director's own log.** Per-audition at preread = 6/200 = **3.0%**. Callback round = 3/35 = **8.6%**. n=1 project, 20 years old, pre-self-tape. |
| "three to five actors for every series regular role" at producers; "the studio chooses you and one or two others to test for the network" | Backstage, "What to Expect When Testing for a TV Pilot" | ~2015, process unchanged in later coverage | series-regular candidates who got that far | process description, not a measured rate — **but it supplies a denominator**: producer session = 1 of 3-5 = **20-33%**; network test = 1 of 2-3 = **33-50%**. |
| 92% of roles required a self-recorded upload; 15% virtual/Zoom; **<4% in person**; 91% supplied own equipment; 82% asked to tape on a weekend; 60% asked to read excessive pages | SAG-AFTRA member survey, **n=9,300 (~5% of membership)** | conducted 2022, reported Deadline 12 Dec 2022, Variety Feb 2023 | self-selecting SAG-AFTRA respondents | **the single best-documented audition statistic that exists.** It has an n. It says nothing whatever about booking rates. |
| ~**12.7%** of ~160-170k members earn enough ($26,470/yr, 2023) to qualify for the health plan; "86% don't meet the threshold" | SAG-AFTRA / Fran Drescher, 2023 strike coverage (NPR, OPB, Deadline) | 2023 | all dues-paying members | earnings, not auditions. The strongest published support for "most readings end in no" — but it is about the **year**, not the reading. |
| booking rate ≥3% = "successful"; top earners ≥6%, with ≥20% shortlist rate and ≥85% listen rate. Defined as hires ÷ auditions submitted | Voices.com platform benchmarks | ~2024 | voice-over talent on one marketplace, self-initiated submissions | **genuine platform data**, but published as a benchmark page with no n and no distribution. VO marketplace ≠ screen. |
| $602 per unbooked audition (half the $1,204 TV/theatrical scale day rate) as of 1 Jul 2023; one Netflix claim paid **$541** for a two-word self-tape (SAG-AFTRA Claims Dept, 14 Jun 2024) | Auditions Are Work | 2023-24 | SAG-AFTRA TV/theatrical | rate is real and contractual. **The $541 is one claim payment, not a rate.** |
| "$250M/yr in unpaid reader labor", "~$0.5bn/yr in audition pay given away in the 2023 contract" | Auditions Are Work | 2024 | — | **the group's own estimate, method unstated. Advocacy arithmetic. Do not launder.** |

## B. THE TWO NUMBERS THAT DO NOT EXIST

1. **No measured before/after study of self-tape's effect on booking rates.** I searched for one specifically and found nothing peer-reviewed or industry-published. The universal trade claim — that per-audition rates *fell* because casting can now see far more people for the same jobs — is argued arithmetically, never measured: the stock formulation is "if you booked four from 50 you now book four from 100." That is an assumption restated as a finding. The nearest academic work, Kirstin Smith, "'Taping into the void': acting labor, self-tapes, and resistance in the digital economy", *Studies in Theater and Performance*, 2025 (doi 10.1080/14682761.2025.2500130), is interview- and survey-based on UK actors but reads as qualitative/theoretical from the abstract; **the full text 403'd on me and I did not verify any figure in it.** Cite nothing from it.
2. **No published booking rate for the directly-requested actor.** Nobody separates "asked in by name" from "submitted through the pile" in any dataset I could reach.

## C. THE DEFENSIBLE NUMBER FOR SLATE'S POPULATION

SLATE's ask already encodes the first three filters the real funnel applies (submission → selected → preread), because an ask only happens if `remembersYou` clears a draw. So SLATE's audition sits at the **producer-session** stage, not the submission stage. Read off the only denominators anyone publishes for that stage:

- producer session, 1 of 3-5 → **20-33%**
- studio/network test, 1 of 2-3 → 33-50% (ceiling, not typical — a production that knows you still knows other people)
- Gillespie's callback round, 3 of 35 → 8.6% (floor; her 35 covered six roles at once)
- Rose's theatrical year, 4 of 24 → 16.7% (n=1, but the right population)

**Defensible band: 15-30% per audition, center ~20-25%.** One in four. Anything above ~50% is an offer wearing an audition's clothes.

## D. WHAT SLATE ACTUALLY DOES (exact, enumerated over all 343 wants — not sampled)

`/tmp/probe-research4.mjs`, blind dead-centre opening, free for the dates, `sure`=1:

| play | P(cast) |
|---|---|
| TAPE (no note) | **62.59%** |
| ROOM, "Leave It" (0 steps) | 62.59% |
| ROOM, "A Touch" (1) | 71.75% |
| ROOM, "A Good Deal" (2) | 77.64% |
| ROOM, "As Far As It Goes" (3) | **78.72%** |
| ceiling if `off` were always 0 | 82.00% |

**best play ÷ ceiling = 0.9600.** The whole want-draw, the reading, the note, the answer and the distance curve together move the cast rate **3.28 percentage points** off `AS_GOOD_AS_IT_GETS`.

Exhaustive over all 343 openings x 5 plays (1,715 strategies), `/tmp/probe-research2.mjs`:
- best: `{0,0,0}` + All The Way = **78.72%**; worst: `{±3,∓3,∓3}` + Leave It = **19.11%**
- mean **50.85%**, median **51.23%**; **45.0%** of strategies fall below 50%
- mean gain from GOING IN (best answer) vs TAPE, over 343 openings: **+25.45 pts** (max +27.81)

Distribution of final `off`, dead centre + All The Way (`/tmp/probe-research3.mjs`):
`off≤0: 1.85% | ≤0.333: 10.19% | ≤0.667: 35.19% | ≤1.0: 69.91% | ≤1.333: 93.06% | ≤1.667: 99.54% | ≤2.0: 100.00%`
- **P(off ≤ CLOSE_ENOUGH=1.2) = 69.91%** after All The Way, **72.22%** after A Good Deal, 50.00% after A Touch, 27.78% after Leave It.
- **P(off > TOO_FAR=3.4) = 0.00%** from a dead-centre opening under every answer at `sure`=1. Max reachable `off` from `AS_WRITTEN` is 3.0. At `sure`=0.65 (readiness floor) it is 1.14% for All The Way, 0.17% for A Good Deal, 0% otherwise.

Want distribution, 2,000,001 draws (`/tmp/probe-research.mjs`): -3: 0.08332 | -2: 0.16636 | -1: 0.16685 | 0: 0.16642 | +1: 0.16655 | +2: 0.16681 | +3: 0.08369. Confirms P(±3)=1/12, P(each of -2..2)=1/6. **Not flat.**
E[off] dead centre: measured **1.49974** over 2M draws; exact **1.5000** (E|W| = 2×(3/12 + 2/6 + 1/6) = 1.5). The 1.7 figure is wrong and the auditor is right.

## E. WHAT IT WOULD TAKE TO LAND IN THE DEFENSIBLE BAND (measured)

With the shape unchanged, **best-play rate = AS_GOOD_AS_IT_GETS × 0.9600**, so:
| target best-play rate | required AS_GOOD_AS_IT_GETS |
|---|---|
| 15% | 0.156 |
| 20% | 0.208 |
| **25%** | **0.260** |
| 30% | 0.312 |

But dropping the peak alone leaves the room inert. Bringing the thresholds in is what makes the reading decide anything (best play / tape, dead centre):
- shipped, `CLOSE_ENOUGH=1.2 TOO_FAR=3.4 peak=0.82` → 78.72% / 62.59% (16.1 pt spread)
- `0.5 / 3.4 / 0.82` → 63.60% / 46.18%
- `0.34 / 2.0 / 0.82` → 43.29% / 21.23% (22.1 pt spread)
- **`0.34 / 2.0 / 0.45` → 23.76% / 11.65%** — inside the defensible band, and the room is worth **2.04x** a tape instead of 1.26x
- `0.0 / 1.5 / 0.5` → 13.61% / 5.29%

Sources: [Acting Magazine, What is a Booking Ratio?](https://actingmagazine.com/2018/10/what-is-a-booking-ratio/) · [Backstage, Booking Ratios](https://www.backstage.com/magazine/article/booking-ratios-56748/) · [Career ACTivate, 2020 Audition Stats](https://careeractivate.com/2020-audition-stats/) · [Bonnie Gillespie, Casting by the Numbers](https://bonniegillespie.com/casting-by-the-numbers/) · [Backstage, What to Expect When Testing for a TV Pilot](https://www.backstage.com/magazine/article/expect-testing-tv-pilot-56810/) · [Deadline, SAG-AFTRA Self-Taping Guidelines](https://deadline.com/2022/12/sag-aftra-new-self-taping-audition-guidelines-low-budget-1235204707/) · [Variety, Inside the Self-Tape Audition Controversy](https://variety.com/2023/film/features/self-tape-controversy-cost-sag-actors-1235617672/) · [SAG-AFTRA, Self-Tape Protections](https://www.sagaftra.org/sag-aftra-continues-make-auditioning-safer-through-added-self-tape-protections-and-regulations) · [NPR, Hollywood union health insurance](https://www.npr.org/sections/health-shots/2023/08/30/1196652142/hollywood-union-health-insurance-sag-aftra-wga) · [Voices.com, Statistics of successful talent](https://www.voices.com/help/knowledge/faq/successful-talent-statistics) · [Auditions Are Work](https://www.auditionsarework.org/) · [Smith, 'Taping into the void'](https://www.tandfonline.com/doi/full/10.1080/14682761.2025.2500130) · [CBC, Self-tapes are Hollywood's new normal](https://www.cbc.ca/news/entertainment/self-tape-acting-1.7126250)


**Method**

WEB: WebSearch/WebFetch across SAG-AFTRA, Backstage, Variety, Deadline, NPR/OPB, Actors' Equity, Casting Networks, Voices.com, Bonnie Gillespie, Career ACTivate, Auditions Are Work, and Taylor & Francis. Two sources refused me and I have marked what I could not verify: tandfonline (403, so no figure from the Smith 2025 paper is cited) and Variety/Deadline behind a tollbit paywall (402/307, so their survey figures are taken from search-result extracts, not the article text). auditionsarework.org/data 404s.

LOCAL (read-only, three probe scripts in /tmp, run with `cd /home/user/1221 && npx vite-node <script>`):
- /tmp/probe-research.mjs — 2,000,001 draws of whatTheyWant through a mulberry32 PRNG for the want pmf; 2,000,000 draws for E[off]; 400,000-trial Monte Carlo of whatTheyWant -> theNote -> afterTheNote -> howFarOff -> decideAudition for each of tape and the four HOW_FAR answers at sure=1 and sure=0.65; plus an exhaustive 343-opening x 4-answer sweep for the best blind opening.
- /tmp/probe-research2.mjs — EXACT, no sampling: enumerates all 7^3 = 343 wants weighted by the true pmf (1/12 at ±3, 1/6 at -2..2) against all 343 openings x 5 plays = 1,715 strategies, computing P(cast) and P(wrong-for-it) in closed form from the shipped keen curve.
- /tmp/probe-research3.mjs — exact CDF of final `off` per answer, and a sweep of CLOSE_ENOUGH / TOO_FAR / AS_GOOD_AS_IT_GETS to solve for thresholds that hit a target rate.
- /tmp/probe-research4.mjs — exact P(cast) at shipped thresholds for all five plays, and best-play ÷ ceiling.
All local probes import the real modules at /home/user/1221/src/engine/world/audition.ts and /home/user/1221/src/engine/content/audition.ts. Nothing in /home/user/1221 was written or modified.
Note on the parent's 68%/51%: my figures are the pure per-audition rates with free=true and sure=1, so they sit above a played save, where `dates` failures and readiness below the ceiling pull the realised rate down. The direction and the gap both check out.


**Surprises**

**1. The 1.7 comment in the brief is already fixed in the file.** /home/user/1221/src/engine/content/audition.ts TOO_FAR now reads "a reading played dead center is 1.5 out" and spells out the 1/12-and-1/6 shape, including "this comment said it was [flat] for as long as it existed — along with a figure of 1.7." The auditor's correction has landed. My 2M-draw measurement (1.49974) and the closed form (1.5) confirm the new text.

**2. CLOSE_ENOUGH's comment has NOT been fixed and is falsified by measurement.** It still says "Deliberately tight. Most readings end in no." Measured: CLOSE_ENOUGH=1.2 contains **69.91%** of optimal play and **72.22%** of A Good Deal. It is not tight; it swallows the majority of outcomes. The same comment claims "one note taken the whole way pulls an average guess inside it, which is what makes going in worth three days" — that half is true (27.78% -> 69.91%) but it is worth only **+16.1 points of cast rate**, because the tape already books 62.59%.

**3. TOO_FAR is unreachable from the safe opening.** Max `off` from AS_WRITTEN is 3.0 against a threshold of 3.4, so P(wrong-for-it) = **0.00%** for every answer at sure=1. The 'wrong-for-it' branch and its written line ("They loved it. It isn't what the part is.") can never fire on a player who plays it safe, which is the play the arithmetic already rewards most. It only fires at 1.14% when a tired player takes a note All The Way, or from openings at ±3.

**4. The room is 96% of a weighted coin.** best play ÷ ceiling = 0.9600 exactly. Change every input to the reading model and the cast rate moves 3.28 points. This is the falsifiability test failing: the sentence about what the room wanted changes, the outcome barely does. `AS_GOOD_AS_IT_GETS` is not "as good as it gets and still not certain" — it is very nearly the answer.

**5. A Good Deal lands inside CLOSE_ENOUGH more often than All The Way (72.22% vs 69.91%) and still books less (77.64% vs 78.72%).** The tail between 1.2 and 3.4 is doing the deciding, not the threshold the comment is about.

**6. "Auditions Are Work" is not SAG-AFTRA.** The site states outright that it is "a grassroots organizing group of SAG-AFTRA members and does not represent the official stance of SAG-AFTRA." Anything sourced to it should not be attributed to the union. Its $250M and $0.5bn figures are its own estimates with no stated method.

**7. The $541 figure circulating in trade coverage is one claim payment, not a rate.** The contractual rate is $602 per unbooked audition as of 1 Jul 2023. $541 was what one member was paid for a specific two-word self-tape for Netflix.

**8. Casting Networks' "718K auditions booked last year" means auditions *scheduled*, not jobs booked.** It is marketing copy with no denominator and it reads exactly like a booking statistic. This is the clearest example in the whole search of a number that would be laundered by one careless citation.

**9. The spread between two working union actors in the same city in the same year is 27x** (Hong 0.6% theatrical, Rose 16.7% theatrical, 2020). Any single "booking rate" for screen actors is hiding a distribution this wide. That is the honest reason no institution publishes one.


## The proposals that landed


Neither judged. Neither acted on. Recorded as what they are: two of three.


### Two sentences the room could not keep, and one word nothing reads


**Diagnosis** The room's mechanism measures healthy and two of its sentences do not. Everything the note is supposed to do, it does: over the 1,764 (opening x note) states a player can actually read, four different answers are uniquely best at the readiness a played save sits at (none 98, touch 294, good 282, far 894, ties 196), where at full readiness only two ever are (good 10, far 1166) — so fatigue is what creates the decision, exactly as HOW_FAR's docstring claims, and that docstring's "about 80%" reproduces to the decimal (80.5% at the measured sure=0.8039 on the 117,306 note-giving states it names). The far->good crossover sits at readiness 76.311 and a played save sits at 43.7-44.3, so the blind default is A Good Deal and the per-note deviations are real. The room beats the tape by +10.0 points in a real career (0.6541 vs 0.5541, 4 seeds x 12 years). None of that needs touching. What is false is CLOSE_ENOUGH's comment, on both of its clauses: "most readings end in no" — no arm ends in no more often than yes, the best play casts 0.6541 and even the worst (room, note never answered) casts 0.5103; and "one note taken the whole way pulls an average guess inside it" — an average guess taken As Far As It Goes lands at 1.3540 rested and 1.5581 tired against a CLOSE_ENOUGH of 1.2, outside at both, and As Far As It Goes is not even the best answer at played readiness. HOW_FAR's 'good' row says "Most notes want about this" and 2 steps is 45.4% from dead center (a plurality) and 17.1% averaged over every reading a player could play, where the mode is 4 — a distance no button reaches. And Audition.heard is declared with a nine-line docstring, written once, and read by nothing in src/ or tests/: the One Rule, verbatim, in the room the game is named after. The cast rate itself is a design question, not a defect — it is high against the real-world band, but nothing in 1,203 tests pins it, which is precisely why a comment could assert the opposite of it for as long as it existed. So: patch the prose, delete the dead word, and pin the rate in a test so it cannot drift again. If the owner wants the sentence to be true rather than deleted, AS_GOOD_AS_IT_GETS is the only constant that can do it without falsifying anything else, and I have costed it.


**Changes**


- `src/engine/content/audition.ts` — Lines 251-254, the body of CLOSE_ENOUGH's docstring. Delete the two false clauses — "Deliberately tight. Most readings end in no, which is the research's own first sentence about the pass, and a room that said yes to anything close would be a room nobody had to think about." and "One note taken the whole way pulls an average guess inside it, which is what makes going in worth three days." — and replace with what the number measurably does: it is the flat top of `keen`, worth AS_GOOD_AS_IT_GETS and no more, and the point the falloff to TOO_FAR starts from; it catches 27.78% of blind dead-centre readings before anybody speaks, and one note answered A Good Deal takes that to 59.91% at played readiness; that is what going in buys, and it buys yes more often than no. Say outright that this comment claimed the opposite for as long as it existed, and that whether the room SHOULD say yes this often is a question for AS_GOOD_AS_IT_GETS, not for this constant. Add the grid caveat: `howFarOff` is a mean of three integers so attainable values are thirds, and as a pure threshold anything in [1.0, 1.3333) selects the same readings — it is not dead, because it also sets the falloff slope. The constant on line 256 does not move.

  - why: Both clauses fail the falsifiability test. The prose is the thing that is wrong, so the prose is what changes.

  - predicted: Zero behaviour change. The figures the new prose states are the ones I measured: P(off <= 1.2) is 0.277778 for a blind dead-centre reading and 0.599090 after A Good Deal at sure=0.8215; played career 4 seeds x 12 years, tape casts 164/296 = 0.5541 and room/A Good Deal casts 191/292 = 0.6541. The grid claim: the largest attainable off clearing 1.2 is 1.0000, the next is 1.3333. The slope claim, measured by running the real code with CLOSE_ENOUGH = 1.0: best play at played readiness falls 0.7060 -> 0.6814, a 2.5-point swing.

- `src/engine/content/audition.ts` — Line 215, the HOW_FAR 'good' row's `what` string. Replace "A real change, and not the whole of what you have. Most notes want about this." with "A real change, and not the whole of what you have. The single likeliest thing a safe reading is asked for, and rarer the bolder you played." The `steps: 2` does not move.

  - why: "Most" is false. 2 steps is a plurality only for a player who plays dead centre, and it is the second-rarest magnitude averaged over every reading a player could actually play. The replacement is true on both halves and says the thing that makes the button a decision rather than a default.

  - predicted: Zero behaviour change. Note magnitude, measured exactly over all 343 wants: from (0,0,0) — 1 step 12.0%, 2 steps 45.4%, 3 steps 42.1%. From (1,1,1) the mode is 3 (34.8%). From a bold (3,-3,0) the mode is 5 (27.8%). Uniform over all 343 openings — 1:6.3% 2:17.1% 3:24.8% 4:25.6% 5:19.0% 6:7.0%, so the mode is 4 and the note asks for more than the largest button can give in 51.5% of states.

- `src/engine/domain/model.ts` — Delete lines 862-871: the ten-line block that is the `heard` docstring plus `heard?: boolean;` on the Audition interface.

  - why: THE ONE RULE. It is declared, it is written, and nothing in src/ or tests/ reads it. Its own docstring justifies keeping it on the record for "a no you can open and find out you misheard" — there is no such screen. Commit bad08da swept 23 fields with exactly this fault and missed this one.

  - predicted: `npx tsc --noEmit` exits 0. tests/audition.test.ts 57/57 pass. Measured on a repo copy with the change applied: the played career is byte-identical to the unmodified tree — tape 164/296, room/A Good Deal 191/292, room/As Far 183/294 — so no seeded outcome moves.

- `src/engine/world/audition.ts` — Delete line 598, `audition.heard = roll < sure;`. KEEP line 597, `const roll = sim.rng('audition', 'heard', audition.id).next();` — it feeds `afterTheNote` on the next line and removing it would move every seeded outcome in the game.

  - why: The write half of the same dead word. Removing the assignment without touching the draw is what makes this a zero-behaviour change.

  - predicted: The RNG stream is consumed identically, so seeded outcomes are unchanged: verified byte-identical played career (191/292 for room/A Good Deal) against the unmodified tree, plus 57/57 audition tests and tsc exit 0.

- `docs/UNBITTEN.md` — Lines 356-357. The entry reads "**`Audition.took`** is written and read by nothing, in the save record of the system the game is named after." `Audition.took` no longer exists — commit bad08da removed it. Replace the field name with `Audition.heard`, or strike the entry if the change above lands in the same commit. While there, line 317's "Readiness is read in exactly one place: `heardItRight` in the audition room" is stale: `readiness(` also has a reader at src/engine/world/audition.ts:692 in `whatTheWeekTook`.

  - why: A findings doc that names a field which no longer exists, and misses the one that does, is the same fault it is reporting.

  - predicted: Zero behaviour change. Verified by grep: `took` appears in model.ts's Audition block only inside prose (line 863, "took in what was actually said"); `audition.heard` has exactly 1 write (world/audition.ts:598) and 0 reads across src/ and tests/.

- `tests/audition.test.ts` — Add one test in the existing `what the room wants, and how far off safe is` describe block, alongside the want-shape test that was added for the same reason. 120,000 rounds on `makeRng`: draw a want with `whatTheyWant`, play `AS_WRITTEN`, take the note with `theNote` and answer it `'good'` via `afterTheNote(played, note, 'good', sure, rng.next())` at sure = 0.8215, then `decideAudition({off: howFarOff(...), sawYou: true, free: true}, rng.next())`. Assert the cast share is greater than 0.5 and `toBeCloseTo(0.70, 1)`. Comment it with why it exists: CLOSE_ENOUGH's comment asserted the opposite of this for as long as it existed and nothing checked it.

  - why: The project's own remedy, already used three lines above for the want shape: "A distribution described in prose is a distribution nothing checks." I measured that the full suite passes with AS_GOOD_AS_IT_GETS moved from 0.82 to 0.65 — a 19-point swing in the game's central outcome that 1,203 tests do not notice. That gap is the reason this drifted.

  - predicted: The assertion I measured: 120,000 rounds at sure=0.8215 gives cast 0.7049 (exact enumeration over all 343 wants: 0.706024). The same harness gives tape 0.6271, none 0.6277, touch 0.6800, far 0.6908; and at sure=1, tape 0.6271, touch 0.7174, good 0.7770, far 0.7860. Runs in about a second, like the neighbouring want-shape test.

- `src/engine/world/audition.ts` — OPTIONAL, AND ONLY IF THE OWNER WANTS THE SENTENCE TRUE RATHER THAN DELETED. Line 761, `export const AS_GOOD_AS_IT_GETS = 0.82` -> `0.65` (career denominator) or `-> 0.58` (conditional denominator). Nothing else moves. If this lands, the CLOSE_ENOUGH prose patch above should keep "most readings end in no" and name which denominator it means, and AS_GOOD_AS_IT_GETS's own comment gains a line saying it was cut to hit a target rate and that it is a pure level knob.

  - why: It is the ONLY constant that reaches the target, and the only one that reaches it without falsifying anything else in the file. Measured: P(cast) is exactly linear in it — best/A = 0.96000 at sure=1 and 0.86097 at sure=0.8215 at every value I tested (0.82, 0.70, 0.68, 0.65, 0.60, 0.58, 0.50). The best opening, the best answer, the 76.311 crossover, P(wrong-for-it)=0.0058 and the note-magnitude distribution are all unchanged by it. No shape knob can get there: CLOSE_ENOUGH driven all the way to 0.0 still leaves best play at 0.4759 and kills the far/good decision entirely (good becomes uniquely best at every readiness); TOO_FAR at 2.0 leaves it at 0.6136 and inflates wrong-for-it from 0.6% to 12.9%; the 1.4 exponent at 3.0 leaves it at 0.6491.

  - predicted: Played career, same harness, 4 seeds x 12 years, room/A Good Deal: A=0.82 -> 0.6541, A=0.70 -> 0.5263, A=0.68 -> 0.5017, A=0.65 -> 0.4673, A=0.58 -> 0.4177. Tape over the same: 0.5541 / 0.4554 / 0.4387 / 0.4244 / 0.3600. Exact, free dates, played readiness: A=0.65 gives best 0.5596 and A=0.58 gives 0.4994. So 0.65 makes the sentence true of a career but not of a free-dates reading; 0.58 makes it true of both. Cost, measured: the room's premium shrinks with it — +10.0 points at 0.82, +4.3 at 0.65, +5.8 at 0.58.



**Yes rate after** Under the recommended prose-only change, UNCHANGED — which is the point. Best strategy and naive strategy are the same strategy at the readiness a played save actually sits at. Exact, over all 343 wants with their true weights, dead-center opening, free for the dates, P(cast) measured by bisecting the real `decideAudition`: at sure=1 (readiness 100) tape 0.625851, Leave It 0.625851, A Touch 0.717490, A Good Deal 0.776374, As Far As It Goes 0.787229 — best is far. At sure=0.8215 (readiness 49) tape 0.625851, Leave It 0.625851, A Touch 0.680267, A Good Deal 0.706024, As Far 0.693508 — best is good, and that is also the naive play, so best minus naive is 0.000000. At sure=0.65 (readiness 0) A Touch wins at 0.644504. In a real played career, 4 seeds x 12 years at daily cadence with a dead-center reading: tape 164/296 = 0.5541, room/Leave It 0.5568, room/A Touch 0.6117, room/A Good Deal 191/292 = 0.6541, room/As Far 183/294 = 0.6224, room/note-never-answered 0.5103. Mean readiness at the moment of the note 43.7-44.3, mean `heardItRight` 0.803-0.805, 17.6% of notes heard backwards. Under the optional Option B at AS_GOOD_AS_IT_GETS = 0.65: best and naive are still the same play, exact free-dates 0.5596, played career 0.4673 against a tape's 0.4244. At 0.58: exact 0.4994, played 0.4177 against a tape's 0.3600.


**Tape after** Never, under either option, and the change does not pretend otherwise. Measured: `afterTheNote` with `steps: 0` returns the reading unchanged, so room/Leave It and the tape are the same distribution — P(cast) 0.625851268706392 for both, identical to fifteen decimal places at every readiness. The room's outcome set therefore contains the tape's exactly, and going in is never worse in P(cast). In a played career the room answered A Good Deal beats the tape by +10.0 points (0.6541 vs 0.5541). The two extra days do cost something real and it is not the diary — settlement happens later, so `freeAcross` catches more of them: `dates` losses were 11 per 292 settled readings in the room against 1 per 296 on tape. It is nowhere near enough. Nor is the money: I measured the part's fee over 1,673 real readings at mean EUR 11,372 and median EUR 2,838, so the room's EUR 120 is 1.055% of the mean part, and the +10.0-point premium is worth EUR 1,137 in expectation against the mean part and EUR 284 against the median. A tape becomes the right choice only when `WAYS[1].costsCents` rises from 120_00 to somewhere in the EUR 284 - 1,137 band (28_400 to 113_700), which is a 2.4x to 9.5x increase and a decision I am deliberately not taking — see the argument against. Below that, the honest reading is that the way in is a button and the note is the decision.


**What breaks** Recommended prose-only change: NOTHING, measured rather than assumed. I applied the `Audition.heard` deletion (both the interface block at model.ts:862-871 and the write at world/audition.ts:598) to a full copy of the repo and ran it: `npx tsc --noEmit` exits 0, tests/audition.test.ts is 57/57, and the played career comes back byte-identical to the unmodified tree (tape 164/296, room/A Good Deal 191/292, room/As Far 183/294) because line 597's `.next()` draw is untouched. The only caller of `audition.heard` anywhere in src/ or tests/ is the write itself — grep across .ts and .tsx confirms one write, zero reads; AuditionsWorkspace.tsx reads `heardItRight`, which is a different thing and is not touched. Saves written before the change carry an extra `heard` key that nothing reads; it is an optional property on a plain object, so old saves still load. No test asserts comment text, so the two prose patches break nothing by construction. The new test is additive. Optional Option B (AS_GOOD_AS_IT_GETS 0.82 -> 0.65): also NOTHING in the suite — I ran the full thing against a repo copy with the constant changed and got 44 files, 1,203 tests, 1 todo, all passing, including tests/audition.test.ts:761's `expect(at(0)/100).toBeCloseTo(AS_GOOD_AS_IT_GETS, 1)`, which reads the constant and so follows it, and the two slow career tests at the end of the audition file. That is itself the finding: a 19-point swing in the game's central outcome is invisible to 1,203 tests, which is why the new pinning test is part of the proposal. What Option B does move is every seeded career in the game — cast counts, fees earned, and through them fame, audienceAppeal and the `remembersYou` ratchet. Measured at the top of that chain: the tape's career rate falls 0.5541 -> 0.4244 and the room's 0.6541 -> 0.4673. Any screenshot, doc figure or saved game quoting a cast rate goes stale.


**Prose patches** FALSE NOW, must change. (1) src/engine/content/audition.ts:251-252, CLOSE_ENOUGH: "Deliberately tight. Most readings end in no, which is the research's own first sentence about the pass". Measured false in every arm — best play casts 0.6541 in a played career and 0.706024 exactly with free dates; even the worst arm, the room with the note never answered, casts 0.5103; the tape casts 0.5541. And 1.2 is not tight: it contains 27.78% of blind dead-center readings and 59.91% after one note answered A Good Deal. Should say what the number does — the flat top of `keen`, worth AS_GOOD_AS_IT_GETS and no more, and where the falloff to TOO_FAR begins — and say that the room says yes more often than no, with the rate pinned in a test rather than asserted here. (2) src/engine/content/audition.ts:253-254, same comment: "One note taken the whole way pulls an average guess inside it, which is what makes going in worth three days." Measured false: an average guess (uniform over all 343 openings) taken As Far As It Goes lands at E[off] 1.3540 rested and 1.5581 at played readiness, both outside 1.2. Worse, As Far As It Goes is not the best answer at played readiness — A Good Deal is (0.706024 vs 0.693508). The conclusion survives and the mechanism does not: going in IS worth it, by +10.0 points of career cast rate, so the sentence should cite that instead. (3) src/engine/content/audition.ts:215, HOW_FAR 'good': "Most notes want about this." Measured false — 2 steps is 45.4% from dead center, which is a plurality not a majority, and 17.1% averaged over every reading a player could play, where the mode is 4 steps. Should say it is the single likeliest thing a SAFE reading is asked for, and rarer the bolder you played. (4) docs/UNBITTEN.md:356, "`Audition.took` is written and read by nothing" — the field no longer exists; the live instance of that fault is `Audition.heard`. (5) docs/UNBITTEN.md:317, "Readiness is read in exactly one place: `heardItRight` in the audition room" — stale; `whatTheWeekTook` at src/engine/world/audition.ts:692 reads it too. TRUE, LEAVE ALONE — and worth saying so, because these are the claims a reviewer would expect to be wrong and they are not. (a) HOW_FAR's docstring, content/audition.ts:206: "the favorite is among the best in about 80%" reproduces to the decimal — 80.5% at the measured sure=0.8039 on exactly the 117,306 note-giving states it names (95.9% rested, 76.0% at the fatigue floor). (b) Same docstring: "three different steps are uniquely best across the situations a player can read, and which one is best moves with readiness" — measured FOUR at played readiness over the 1,764 (opening x note) states a player can actually condition on (none 98, touch 294, good 282, far 894, ties 196), against only two at full readiness (good 10, far 1166). The comment understates its own decision. (c) Same docstring's claim that fatigue is what stops it being "always press the biggest": confirmed, the far->good crossover is at readiness 76.311 and a played save sits at 43.7-44.3. (d) world/audition.ts:757, AS_GOOD_AS_IT_GETS "The likeliest anybody is ever to say yes... Short of one on purpose" — measured max P(cast) is 0.820000 exactly, flat across off in [0, 1.2]. (e) TOO_FAR's comment, already corrected in commit 848b17e, is right: I re-derived E[off] for a dead-center reading independently as 1.500000 exactly by sweeping 1.2M grid points through the real `whatTheyWant`, and the want pmf as P(+-3)=0.083333, P(-2..2)=0.166667. ONE THING THE NEW PROSE SHOULD ADD that no comment currently says: as a threshold alone CLOSE_ENOUGH is loose by a full grid step, because `howFarOff` is a mean of three integers so attainable values are thirds — the largest clearing 1.2 is 1.0000 and the next is 1.3333, so anything in [1.0, 1.3333) selects the same readings. It is not a dead word, because it also sets the falloff slope: running the real code at 1.0 costs the best play 2.5 points (0.7060 -> 0.6814). Saying that in the comment is what stops somebody "tidying" it to 1.0 and silently moving the game.


**The strongest argument against it** The strongest case against me is that I fixed the sentences and left the button. Measured, `WAYS` declares two ways into the room and one of them is never right: room/Leave It is identical to the tape to fifteen decimal places, the room beats the tape by +10.0 points across a played career, and the EUR 120 it costs is 1.055% of the mean part I measured. That is the One Rule failing on a content constant, in the same file I am proposing to merely re-comment — a declared choice with one answer. A reviewer can fairly say the tape is a bigger falsifiability failure than either sentence I am patching, because a wrong comment misleads a reader while a dead button wastes a player's decision. My defense is threefold and I do not think it is airtight: it is a different question from the one asked (the brief is about the room and the note, and the note measures healthy); fixing it needs a number I would have to pick rather than measure, and the two defensible break-evens are EUR 284 against the median part and EUR 1,137 against the mean, a 4x spread I cannot resolve without knowing whether the owner is balancing for the typical reading or the average one; and the days are not literally free, since settling later cost 11 readings to `dates` against the tape's 1. But it is the next thing, and it is a bigger thing than what I am proposing. The second argument against is that prose-only enshrines a cast rate that may simply be wrong. A performer who goes in and commits books about two in three here. Nothing I measured says that is the right number for a life simulator, and the sentence I am proposing to delete is the only place in the codebase that ever argued for a different one — so deleting it removes the design's own dissent and makes 0.82 unquestioned by default rather than by decision. That is why Option B is written out as an implementable patch with measured figures rather than mentioned and dismissed: if the owner's answer is that the room should be harder, the prose patch should keep the sentence and cut the constant, not the other way round. The third, smallest argument: I am proposing to delete `Audition.heard` rather than give it a reader, and a one-line addition to `sayWhy` would make its nine-line docstring true instead of gone. I chose deletion because the brief's bias is against adding mechanism and because the docstring describes a screen that does not exist, but the owner may reasonably prefer the field to earn itself.


### The house: a room that wants the same thing twice, and a tape that never finds out


**Diagnosis** The opening reading is a button because `whatTheyWant` is called in exactly one place — `whatIsGoing`, world/audition.ts:477 — and nothing about the part, the holder, the fee or the size enters it. Every audition in the game draws its want i.i.d. from the same symmetric distribution, so the minimum-expected-error reading is the same reading for every part that will ever be cast. I measured it: across 58 sampled holders there is exactly ONE distinct best opening, (0,0,0), and it wins by a clear margin (0.776374 against the runner-up (-1,0,0) at 0.760584, sure=1; 0.706260 against 0.690216 at sure=0.8221). There is nothing on the record that distinguishes one room from another, so there is nothing to read and therefore nothing to decide. The way in is a button for a separate reason: `afterTheNote(r, note, 'none', …)` returns `r` unchanged — verified over 234,612 (reading, want, roll) cells with max |off difference| = 0 — so the room's action set strictly contains the tape's and the room weakly dominates by construction. The yes rate is a symptom. The disease is that both decisions are settled before the player opens the screen. My fix is to give the holder a standing taste, a HOUSE, drawn once per holder and never shown, so that the readings already stored on `Audition.played` and `Audition.note` become evidence about the next part these people cast — and a tape, which gives no note, becomes the way in that teaches you nothing. Both decisions then read only things the engine already has: `readFor`, `audition.way`, `audition.note`, `audition.played`, `heardItRight`. I tested four candidate costs for the room and killed all four with measurements; the shipped `days: 3` turns out to be the only live price, and the house is what makes it bite.


**Changes**


- `src/engine/content/audition.ts — new constant, place it beside MISREAD_THE_ROOM (line 515)` — Add `export const HOUSE_HOLDS = 0.7;` — the share of each shade a holder keeps across everything they cast. New word, no old value. Sweep measured: 0.00 / 0.50 / 0.70 / 0.85.

  - why: This is the single number that turns the opening reading from one button into a per-holder question. It is the only new constant in the proposal. HOUSE_HOLDS = 0 reproduces the shipped game bit-for-bit, which is what makes it falsifiable.

  - predicted: Distinct best openings across 58 sampled houses (exact enumeration over 343 wants at their house-conditioned weights, answering 'good', sure=0.7361): H=0.00 gives 1, mean gain over dead centre +0.0000. H=0.50 gives 52, +0.0852. H=0.70 gives 58, +0.1527. H=0.85 gives 58, +0.1932. At H=0.70 the best opening IS the house, exactly, for every house tested: house (2,-1,0) best (2,-1,0) 0.7888 against dead centre 0.7363 (+0.0525); house (-3,2,3) best (-3,2,3) 0.7597 against dead centre 0.4505 (+0.3092); house (3,3,3) best (3,3,3) 0.7493 against dead centre 0.3734 (+0.3759); house (0,0,0) best (0,0,0) 0.7965, dead centre unchanged and still right.

- `src/engine/world/audition.ts:277 — `whatTheyWant`` — Signature `whatTheyWant(next: () => number)` becomes `whatTheyWant(next: () => number, house?: Reading)`. Body changes from `out[shade.id] = Math.round((next() * 2 - 1) * FURTHEST);` to `const fresh = Math.round((next() * 2 - 1) * FURTHEST); out[shade.id] = house !== undefined && next() < HOUSE_HOLDS ? house[shade.id] : fresh;`. Import HOUSE_HOLDS from ../content/audition. `fresh` is drawn unconditionally so the draw count is fixed at two per shade.

  - why: A mixture, not a shift. Because the house is itself drawn from this same function with no house, the MARGINAL want is mathematically identical to today's — so every threshold fitted to it (CLOSE_ENOUGH, TOO_FAR, the 1.4 exponent, the 1.5 sentence above TOO_FAR) still means exactly what it meant, and the two tests that pin the shape pass verbatim because they call this with one argument. What changes is not what one room wants; it is whether two rooms belonging to the same people want the same thing.

  - predicted: Marginal want pmf, 900,000 real draws per setting. H=0.00: -3 0.0837, -2 0.1661, -1 0.1668, 0 0.1674, +1 0.1666, +2 0.1660, +3 0.0834, E|w| 1.4991. H=0.50: 0.0826 / 0.1663 / 0.1662 / 0.1672 / 0.1672 / 0.1672 / 0.0833, E|w| 1.4981. H=0.65: E|w| 1.5008. H=0.80: E|w| 1.4980. H=1.00: E|w| 1.5003. Unchanged at every setting, so E[off] for a blind dead-centre reading against a stranger stays 1.5000 and P(cast) for that reading stays 0.625851 (tape) / 0.706260 (room, 'good', sure=0.8222).

- `src/engine/world/audition.ts — new export, place after `readingOf` (line 286-295)` — Add `export function theHouse(sim: Simulation, holder: string): Reading { const rng = sim.rng('audition', 'house', holder); return readingOf(whatTheyWant(() => rng.next())); }`. Note the stream must be hoisted into a const before the callback — building it inside the callback returns a fresh stream per call and makes all three shades draw the same number.

  - why: One draw per holder, keyed to the holder string that `readFor`, `remembersYou` and `ignoredBy` already key on, so no row stores it and it is the same taste in year one and year twenty. It reads no attribute, so the grep test at tests/audition.test.ts:477 ('readOn(', 'rate(', '.attributes', 'overallRating', 'groupAverage') still passes.

  - predicted: Career cast rate, 3 seeds x 25 years daily, real engine, answering 'good'. Today (H=0): dead centre + always room 66.0%, dead centre + always tape 62.2%, memory + always room 63.5% — memory HURTS by 2.5 points. At H=0.70: dead centre + always room 60.4%, memory + always room 69.4%, memory + room-if-rested 68.7%. The sign of the memory policy flips from -2.5 to +9.0 points.

- `src/engine/world/audition.ts:477 — inside `whatIsGoing`` — `wants: whatTheyWant(() => rng.next()),` becomes `wants: whatTheyWant(() => rng.next(), theHouse(sim, booking.holder)),`

  - why: The only call site. This is the line that makes the holder's name mean something to the want for the first time.

  - predicted: Paired on real careers — 6 seeds x 25 years, 949 real readings, both ways scored against the SAME real wants, real played reading and real heardItRight at every go-up. MEMORY room minus DEAD-CENTRE room: at H=0.00 it is -0.0355 +-0.0070 (trusting your history is measurably harmful); at H=0.70 it is +0.0337 +-0.0069. The right opening reading flips sign, by 6.9 points, on one constant.

- `src/engine/world/audition.ts — new export, place after `remembersYou` (line 215)` — Add `export function whatTheyKeepAskingFor(sim: Simulation, holder: string): Reading | undefined`. Body: `const rooms = readFor(sim, holder).filter((one) => one.way === 'room' && one.note && one.played); if (rooms.length === 0) return undefined; const out = { ...AS_WRITTEN }; for (const shade of SHADES) { const total = rooms.reduce((sum, one) => sum + readingOf(one.played)[shade.id], 0); out[shade.id] = clamp(Math.round(total / rooms.length), -FURTHEST, FURTHEST); } return out;`

  - why: This is the estimator I measured, and it is the piece that satisfies THE ONE RULE. `Audition.note` and `Audition.way` currently have no reader outside the single audition they belong to; `audition.took` and `audition.heard` have none at all. This gives `note` and `way` their first cross-audition reader, and it is derived rather than stored — like `remembersYou` — so it cannot drift from the notes that earned it. The `way === 'room'` filter is the entire cost of taping: a tape leaves a row that this function ignores.

  - predicted: This exact estimator, run as the opening policy on real careers at H=0.70, produces the +0.0337 +-0.0069 above and the 69.4% career rate. A per-holder oracle that plays the house exactly reaches 0.7965 at sure=0.7361 against this estimator's 0.7023 measured mean, so the accessor recovers most but not all of the available signal.

- `src/ui/workspaces/AuditionsWorkspace.tsx:128-130 — `GoUpForm`` — `useState<Record<string, number>>(Object.fromEntries(SHADES.map((s) => [s.id, 0])))` becomes `useState<Record<string, number>>(() => whatTheyKeepAskingFor(sim, audition.holder) ?? Object.fromEntries(SHADES.map((s) => [s.id, 0])))`, plus one line of copy naming how many rooms it is built from and saying that a tape adds nothing to it.

  - why: Without this the mechanic exists but is unplayable: the house is never shown and a player who does not keep paper notes cannot act on it. The sliders opening on your own history is what makes the first decision legible — and seeding them is advice, not a lock, so the player can still override.

  - predicted: Nothing in the engine moves; this is the instrument, not the mechanism. The engine-side falsifiability is already carried by HOUSE_HOLDS. Measured value of what it shows: at H=0.70 the reading it proposes beats dead centre by +0.0337 +-0.0069 on real careers, and by +0.1527 in exact expectation across 58 houses.

- `src/engine/content/audition.ts:145-162 — `WAYS`. NO EDIT. Listed so the owner sees the dial that was already there.` — Leave `tape` at days 1 / costsCents 0 and `room` at days 3 / costsCents 120_00. I tested four ways to make the room cost something and killed all four; this one already works once the house exists.

  - why: The room's only live price is the two extra days, which bite through `settle`'s re-check of `freeAcross` and nothing else. The house is what makes that price decisive, because it makes the room's value decay with how well you already know the holder. If the owner wants the crossover earlier, `days: 3 -> 4` or `costsCents: 120_00 -> 600_00` are the two dials, and the euro table below says exactly where each lands.

  - predicted: Room premium over tape, paired on 949 real readings at H=0.70, by prior rooms with the same holder (k): k=0 +0.0851 +-0.0390 (worth EUR 1,218); k 1-2 +0.0785 +-0.0262 (EUR 2,376); k 3-5 +0.0633 +-0.0214 (EUR 2,054); k 6-11 +0.0404 +-0.0153 (EUR 742); k 12-24 +0.0392 +-0.0121 (EUR 551); k 25+ +0.0089 +-0.0078 (EUR 47). Monotone decay. At H=0.00 the same table is flat and always positive: 0.0558, 0.0817, 0.0899, 0.0724, 0.0745, 0.0478. The cost of the two extra days, measured from the why-histogram on 3 seeds x 25y at H=0.70: 'dates' takes 1.3% of tape readings and 3.3% of room readings, so 2.0 points. At k 25+ the room is worth 0.89 points against a 2.0-point cost and EUR 47 against a EUR 120 fee: both ledgers say tape, and k 25+ is 409 of 949 readings (43%) in a played career.

- `NOT PROPOSED — four costs I measured and killed. Recorded so nobody re-proposes them.` — (a) the room costs reliability when walked into below A_WORKING_WEEK.spentAt; (b) the room costs readiness/energy/sleepDebt; (c) goUpFor refuses the room when the diary has the player at the 90-minute slot; (d) goUpFor refuses a way that cannot finish before closesAt.

  - why: Each reads something the engine has and each looked right on paper. All four are dead in the shipped world, and the reasons are separate faults worth their own tasks.

  - predicted: (a) DEAD: careers at room-cost 0, 1 and 3 reliability are bit-identical — 193.7 asks, 148.3 readings, 103.0 cast, every time. Cause: `remembersYou` is IDENTICAL at reliability 0 and 100 in 389/466 real readings (83.5%) and is pinned at the clamp of 1.000 in 87.3%, because fame reaches 100 and COLD 0.35 + readFor*0.16 + 1.0*KNOWN_OF 0.5 blows past it. (On a cold holder with fame 0 the channel is strong — asks/career 32.7 at reliability 60 falling to 12.7 at 10 — so the fault is the clamp, not the constant.) (b) DEAD: a one-off hit is erased by the next daily rollover — energy -12 drops readiness 49.2 to 42.6 and it is back to 49.2 the next day; sleepDebt +3 gives 47.2 then 49.2; stress +12 gives 46.5, 48.9, 49.2. (c) DEAD: over 486 real readings the room's slot is already committed 23.3% of the time and the TAPE's slot 24.7% — the tape is blocked MORE, because `whatHasThem` commits whole weeks and +1d and +3d land inside equally. (d) DEAD: 0 of 469 readings have fewer than 3 days left on the door; the minimum is 9.7 days even at weekly cadence, because the ask window is three weeks wide.



**Yes rate after** Measured on real careers, 3 seeds x 25 years daily, answering 'good', at HOUSE_HOLDS = 0.70. BEST strategy — open from `whatTheyKeepAskingFor`, go in while you are still learning them, tape once you know them — 69.3% of settled readings end in cast (n=456). NAIVE — dead center, always go in, which is today's optimum — 67.3% (n=453). Intermediate: memory + always room 68.6%, dead center + always tape 62.0%. TODAY, for comparison, measured the same way at HOUSE_HOLDS = 0: dead center + always room 66.0%, dead center + always tape 62.2%, and memory + always room 63.5%. So the naive play moves +1.3 points and the best play moves +3.3 points, and for the first time they are different plays — today the gap between best and naive is exactly zero because dead center IS the optimum. Per-reading exact figures against a stranger are untouched: 0.625851 tape, 0.706260 room + 'good' at sure=0.8222, 0.776374 at sure=1. Honest consequence: this proposal makes the yes rate go UP, not down, and pushes further from CLOSE_ENOUGH's "most readings end in no". It does not touch that sentence and it is not meant to. If the owner wants the band the research agent defended, `keen` is `AS_GOOD_AS_IT_GETS x shape(off)` in both branches of `decideAudition`, so every figure above scales exactly linearly in it: 0.693 x (A / 0.82). That crosses 50% at A = 0.592 and reaches the 20-25% producer-session band at A = 0.237 to 0.296. I did not re-measure that sweep; `where-the-yes-comes-from` did, and the linearity is an identity of the shipped function.


**Tape after** The tape becomes the right choice once you have been in the room with these people enough times that the note has stopped telling you anything — measured, that is around 25 prior rooms, and it is 43% of the readings in a 25-year career (409 of 949). The ledger at that point: the room is worth +0.89 points of P(cast) (+-0.78, so not distinguishable from zero) and EUR 47, against the 2.0 points that the extra two days cost through `settle`'s re-check of `freeAcross` ('dates' takes 1.3% of tape readings and 3.3% of room readings) and the EUR 120 fee. Both ledgers cross in the same bucket, independently. Below that it is not close: at k=0 the room is worth +8.51 points and EUR 1,218; at k 1-2, +7.85 and EUR 2,376; at k 3-5, +6.33 and EUR 2,054. The genuinely hard band is k 6-24, where the room is worth +3.9 to +4.0 points against a 2.0-point cost — right, but by less than a factor of two, which is where a player should actually have to think. Readiness is the second axis and it is independent of the first: the room's premium against a stranger falls from +12.58 points at readiness 81.7 (a booted save) to +4.74 at readiness 24.6 (the median ask on a working career), so a tired player facing a stranger sits in roughly the same band as a rested player facing somebody they know. Today none of this exists: at HOUSE_HOLDS = 0 the same paired table is flat and always positive — 0.0558, 0.0817, 0.0899, 0.0724, 0.0745, 0.0478 — and `afterTheNote(r, note, 'none')` returns `r` over all 234,612 cells, so the room strictly contains the tape and the tape is never right.


**What breaks** SEEDED OUTCOMES MOVE, EVERYWHERE. `whatTheyWant` goes from one `next()` per shade to two, and `theHouse` opens a new `sim.rng('audition','house',holder)` stream. Every `wants` in every save moves. This is the same class of break as "ids are per-namespace now" which already landed today, and any test asserting a specific `why` on a specific seed must be re-pinned. SAFE, VERIFIED BY READING THE ASSERTIONS: tests/audition.test.ts:596 ('draws the two ends half as often as everything between them', 120,000 draws) and :620 ('puts safe between the two thresholds', mean 1.5) both call `whatTheyWant(() => rng.next())` with ONE argument, so `house` is undefined, the mixing branch never runs, and both pass verbatim — and I measured that they would still pass even with a house, because the marginal is unchanged at every HOUSE_HOLDS from 0 to 1. :788 also passes one argument. :149 and :202 build rows with `wants: AS_WRITTEN` by hand and are unaffected. The grep test at :477 forbids 'readOn(', 'rate(', '.attributes', 'overallRating', 'groupAverage' in world/audition.ts — `theHouse` and `whatTheyKeepAskingFor` touch none of them, and neither reads the sheet, so :453 ('every attribute at fifty') also survives. AT RISK AND MUST BE RE-RUN: :470 (`playItOut` with a fixed reading (1,-1,2) against a seeded want), :807 and :828 (`playItOut(sim, audition, audition.wants, 'room', 'none')` — these play the want exactly so they are structurally safe, but the surrounding `if (out.why !== 'cast') return` early-outs mean the test can silently stop asserting), :818 ('twelve goes at it should land one' — a count over seeded draws, the one most likely to flip), :530/:539/:551/:985/:1007 (remembersYou against COLD — unaffected, no want involved). CALLERS: `whatTheyWant` has exactly one production call site (world/audition.ts:477) and four test call sites; the optional parameter means none of them need editing. `readingOf(undefined)` still returns AS_WRITTEN, so :795 is untouched. NEW SURFACE NEEDING TESTS: HOUSE_HOLDS = 0 must reproduce the shipped want distribution AND the shipped per-holder independence; two auditions from the same holder must share a shade more often than two from different holders; `whatTheyKeepAskingFor` must return undefined for a stranger, must ignore rows where `way === 'tape'`, and must ignore `why === 'never-answered'` rows (it does, via `readFor`).


**Prose patches** world/audition.ts:531 (`goUpFor`) — "The reading is chosen here and it is chosen blind, which is the whole of the first decision. Nobody has said anything about what this part is for and nothing on any screen will" becomes FALSE. A screen will now say what these people have asked for before. Replace with: blind about THIS part, and not blind about these people — what is on the screen is your own history with them, and it is only as good as the number of rooms you have been in. world/audition.ts:440 (`decideAudition`) — "the tape's cost is paid earlier, in the note it never gave" is now understated and should name the second half: the note it never gave, and the note it never left on the record. content/audition.ts:30-32 (file header) — "Taping is information forgone" is currently false, because the information is forgone for eight minutes and then irrelevant; it becomes true and should say the forgone information is durable. content/audition.ts:251 (CLOSE_ENOUGH) — "Most readings end in no" is already falsified by six independent agents and by me (best career play 69.3%); this change makes it worse, not better, and the sentence must either go or be paid for in AS_GOOD_AS_IT_GETS. Its next clause, "One note taken the whole way pulls an average guess inside it, which is what makes going in worth three days", is now wrong twice: 'good' pulls it inside more often than 'far' does, and what makes going in worth three days is no longer the note's size but whether you have been in that room before. content/audition.ts:204-210 (HOW_FAR) — "the favorite is among the best in about 80%" was enumerated over 117,306 (reading, want) pairs weighted uniformly. With a house those pairs are no longer uniform: the readings a player actually plays concentrate on the house and the wants concentrate with them. The figure must be re-enumerated against the reachable lattice or the sentence must name the lattice it was taken on. content/audition.ts:228 (TOO_FAR) — "a reading played dead center is 1.5 out" SURVIVES and should say why: it is still 1.5 out across all holders, and it is 1.5 out against a holder you have never met, and it is not 1.5 out against a holder you have read for six times — which is the whole of the new decision stated as arithmetic. content/audition.ts:293-302 (REMEMBERED) — "what one reading is worth to the next call from the same people" is now only half of what a reading is worth; the other half is what it taught you, and it is worth naming. docs/UNBITTEN.md:356 — `Audition.took` is listed as written-and-never-read and `audition.heard` is the same fault three lines later in the same function, unlisted; `whatTheyKeepAskingFor` gives `note` and `way` readers but gives those two nothing, so both stay on the list.


**The strongest argument against it** The strongest argument against this is that it buys about a decade of decision and then hands the button back with a different label on it. At HOUSE_HOLDS = 0.70, measured paired on 949 real readings, a player at k 25+ scores 0.7064 with a MEMORY TAPE — higher than a dead-center ROOM scores at any k, and within 0.89 points of a memory room. Twenty-five years in, the player has ground the house out, the note is worth nothing, the way in is decided, and the opening reading is a lookup rather than a guess. The lot only produces a handful of holders, so 43% of a long career sits in that solved state. I have moved the button, not removed it — the honest claim is that the first ten years now contain a decision and the last fifteen contain a habit, which is arguably the right shape for a career game and arguably just a slower button. Three smaller objections. First, it makes the game easier: best career cast rate goes 66.0% to 69.3%, further from the "most readings end in no" the file keeps asserting, so if the owner cares about that sentence this change costs them ground and has to be paid for in AS_GOOD_AS_IT_GETS. Second, the mechanic is unplayable without the UI change — the house is never shown by design, and a player who does not keep their own notes cannot act on it at all, which makes `whatTheyKeepAskingFor` load-bearing rather than advisory and puts a real decision behind a React default value. Third, and most uncomfortable: I could not find ANY currency in this build that a one-off cost on the room can be denominated in. Reliability is clamped away (remembersYou pinned at 1.000 in 87.3% of readings), readiness is a daily fixed point (a 12-point energy hit is gone by tomorrow), the diary commits in whole weeks so it cannot tell 90 minutes apart, and money is never scarce. The tape-or-room decision in this proposal rests entirely on the 2.0 points that two extra days cost through `settle`, which is a side effect nobody designed and no comment mentions. That is a thin beam to hang a decision on, and the more robust version of this task is to fix the clamp in `remembersYou` and the fixed point in the wellbeing model FIRST, and only then decide what the room should cost.

## The three judges

### Judge 1

| proposal | truthfulness | premise | cost | decision |
|---|---|---|---|---|
| smallest-change — "Two sentences the roo | 10 | 9 | 10 | 3 |
| make-it-a-decision — "The house: a room  | 7 | 8 | 3 | 7 |
| fit-to-the-world — "Fit the room to the  | 9 | 7 | 2 | 5 |

**smallest-change — "Two sentences the room could not keep, an** — Everything I checked reproduced. I re-ran its exact-enumeration figures through the real functions (P(cast|off) bisected out of the real decideAudition, 343 wants at exact weights): P(off<=CLOSE_ENOUGH) blind dead-center = 0.277778 and after 'good' at sure=0.8215 = 0.599090, P(cast) = 0.706024 — all three to six decimals, exactly as predicted. I then applied its actual patch to a repo copy: deleted the ten-line `heard` block from model.ts and the write at world/audition.ts:598, keeping line 597's `.next()` draw. `npx tsc --noEmit` exits 0. Six arms x 6 seeds x 12 years came back byte-identical on every outcome column — ups, answered, settled, cast, rate, and the full why-histogram. Grep confirms 1 write, 1 declaration, 0 reads, and `Audition.took` is genuinely gone from the type (the remaining `took` hits are casting/selling). Its one soft spot is the career pair 0.5541/0.6541: on my harness the same arms give 0.6285/0.6743 on a judged denominator and 0.4930/0.5043 on an all-rows one, so its figures sit between my two denominators rather than matching either. Not a falsification, but it never says which denominator it used. Scored low only on decisionQuality, because it says outright that it fixes the sentences and leaves the button — and it is right that it does.

**make-it-a-decision — "The house: a room that wants the same ** — The headline mechanism is real and its numbers are exact. I transcribed the proposed `whatTheyWant` mixture verbatim and enumerated the house-conditioned want space: house (2,-1,0) -> best opening (2,-1,0) at 0.7888 against dead center 0.7363, gain +0.0525; (-3,2,3) -> 0.7597/0.4505/+0.3092; (3,3,3) -> 0.7493/0.3734/+0.3759; (0,0,0) -> 0.7965 with dead center still right. Every figure to four decimals. The marginal-invariance claim is both structurally true (the house is drawn from the same pmf, so H*P + (1-H)*P = P) and confirmed on 900k real draws at H=0, 0.5, 0.7, 1.0 with E|w| 1.4997-1.5009 throughout — so every threshold fitted to the want survives, as claimed. BUT its stated falsifiability guarantee is FALSE. "HOUSE_HOLDS = 0 reproduces the shipped game bit-for-bit, which is what makes it falsifiable" — I ran 200 seeds and got 4 identical, 196 different. The proposed body evaluates `next() < H` whenever a house is passed, so it burns two draws per shade even at H=0 and the fresh values come off stream positions 0,2,4 instead of 0,1,2. It also contradicts its own BREAKS section, which correctly says seeded outcomes move everywhere. The fix is one token — `house !== undefined && H > 0 && next() < H` — but as written the safety property the whole proposal leans on does not hold, and that is the claim I would most expect a reviewer to trust without checking. Costly besides: it moves every seeded want in every save, needs a UI change to be playable at all, and adds the only new constant in the set.

**fit-to-the-world — "Fit the room to the producer-session rat** — The best-verified of the three, and it earns that on the hardest claims. I patched all four constants into a repo copy and ran the unmodified suite: 44 files, 1 failed, 43 passed; 1208 tests, 3 failed, 1204 passed, 1 todo, against its predicted 1207/3/1203/1. The three failures are exactly the three it names, at exactly those lines, and tests/audition.test.ts:1116 reported `walked/3 = 0.19273080241587578` — all seventeen digits it quoted. That is not a figure anyone reconstructs from reading code. Analytically everything holds: keen ladder 0.3400/0.2437/0.1303/0.0170 exact, naive 0.2536 at sure=0.8221 exact, tape 0.1803 exact, full-readiness naive 0.2964 exact, P(off>2.05 | dead center) = 0.115741 exact, far/good crossover 55.96 against its claimed 56.0. (I verified my parameterised `keen` against the real `decideAudition` to 1.1e-16 over all 19 attainable off values first.) End-to-end on my own harness, 6 seeds x 12 years: room/good 21.7% vs its 22.9%, far 22.6% vs 23.2%, touch 18.6% vs 21.1%, wrong-for-it 7.8% vs 9.5% — in band, right direction, right magnitude. Two blemishes. Its shipped baseline (55.4% room/good, 51.4% tape) runs about 5 points above what I measure on the matching all-rows denominator (50.4% / 49.3%), roughly 2 SE. And its claim that the best opening is "still at {0,0,0}" does not hold in my enumeration: at sure=0.8221 under its constants the best fixed-answer cell is (-1,0,0) 'far' at 0.2540, edging dead center — which is precisely the artifact it says choosing linear over exponent 1.4 avoids. Scored down hard on cost: it cuts career income ~78%, invalidates every saved career and doc figure, and by its own admission leaves best-minus-naive at 0.54 points, so it does not fix the thing the brief is actually about.

**Recommendation**

Take smallest-change whole, and graft two things onto it. It is the only proposal where every figure I re-ran reproduced AND the patch itself is byte-identical on a real career, so it costs nothing to land and it removes a genuine One Rule violation (`audition.heard`: 1 write, 1 declaration, 0 readers, nine lines of docstring). Its pinning test is the part that matters most — I confirmed the underlying gap by running the full suite against AS_GOOD_AS_IT_GETS = 0.34 and watching 1204 tests pass, so a 48-point swing in the game's central outcome is invisible to everything except three assertions.

GRAFT FROM fit-to-the-world, two pieces, not the constants:
(1) Its sleep finding, written into MISREAD_THE_ROOM's comment. I reproduced it on three seeds: readiness is a hard fixed point at 49.2 (peak over a further 365 days is exactly 49.2), and `applySleep(me, 8, 1.0)` takes it to 95.0, sure 0.9826. The far->good crossover is at 76.311, dead center in that gap, and `applySleep` has a real player-chosen call site at life.ts:148 behind `life.sleep_started`, not only the autopilot at :356. So 'As Far As It Goes' is NOT dead — it is correct exactly when you slept before the room. Four of the five agents concluded the flip was unreachable; it is reachable, and no comment in the file says so. This is the one sentence the room could keep that nobody has written.
(2) Its test hardening at audition.test.ts:749 — derive the roll from AS_GOOD_AS_IT_GETS instead of hard-coding 0.5. That is correct at any value of the constant and stops the test silently assuming the ceiling is above a half.

DO NOT take fit-to-the-world's constant changes on this pass. Its own argument-against is right: 0.34 is a residual fitted backwards from a 25% target and then dressed in a research band whose only figure with a real n (the SAG-AFTRA survey, n=9,300) says nothing about booking rates. Worse, its Shape B alternative — the variant with the better-sourced number — kills the sleep flip outright, which is the only live decision in the file. If the owner does want the rate down later, the minimal version (AS_GOOD_AS_IT_GETS alone, a pure level knob) is the defensible one, and it should wait on a denominator decision (see below).

DO NOT take make-it-a-decision yet, but keep it. Its mechanism works and its numbers are exact; it needs the `H > 0 &&` fix before anyone can trust its H=0 escape hatch, and it should not land in the same week as a prose cleanup because it moves every seeded want in the game.

ONE THING TO SETTLE FIRST, which no proposal raises: the three of them quote 65.4%, 66.0% and 55.4% for the same shipped arm, and the spread is almost entirely a denominator choice nobody states. In my 6-seed x 12-year run, `never-answered` is 105 of ~500 audition rows — a fifth of all auditions are ones the player never went up for at all. Counting those as "no" gives 50.4% for room/good; excluding them and `dates` gives 67.4%, which matches the exact analytic 0.706024 once availability is allowed for. The tape's judged rate came out 0.6285 against an exact 0.625851, which is the check that the judged denominator is the honest one. Before anybody fits a constant to a target rate, decide which number "most readings end in no" is supposed to be about.

**What nobody proposed**

Make going into the room cost readiness at the moment of the note — the decision the file already contains and nobody wired.

The measurement nobody assembled from the pieces lying around: readiness is a hard fixed point at 49.2 under autopilot (I confirmed the peak over 365 further days is exactly 49.2 on three seeds), a deliberate `applySleep(8, 1.0)` takes it to 95.0, and the far->good crossover sits at 76.311 — dead centre in that gap. So the game ALREADY has a real, reachable, two-state decision: sleep before the room and 'As Far As It Goes' is correct (0.787 at sure=1); don't and 'A Good Deal' is correct (0.706 at sure=0.8221). It needs no new constant, no new content word, and no change to the want.

What is missing is the cost that makes it a choice rather than a freebie. Nothing currently spends readiness on an audition — the 90-minute IN_THE_ROOM slot is diary decoration. Make `goUpFor('room')` spend it, and three dead things come alive at once: the tape becomes the way in you take when you cannot afford to arrive rested, `way.days` and `requiresPlayer` stop being decoration, and MISREAD_THE_ROOM stops being a passive multiplier on a number the player cannot move and becomes the thing they are choosing about.

make-it-a-decision killed this idea (its item (b), "the room costs readiness/energy/sleepDebt") and killed it for the wrong reason: it tested a one-off hit against the DAILY ROLLOVER and found the fixed point erases it by tomorrow. True and irrelevant — the note is read the same afternoon, and `heardItRight` is sampled at `takeTheNote`, not the next morning. The right test is whether the hit survives from `goUpFor` to the note three days later, which nobody ran. fit-to-the-world found the sleep fact, correctly called it load-bearing, and then chose a recalibration that MOVES the crossover to 56.0 instead of wiring it. smallest-change patches prose around it.

Second thing nobody proposed: fix the denominator before fitting anything to it. `never-answered` is 105 of ~500 audition rows in a played career — a fifth of all auditions are ones the player never went up for. Every rate anyone in this set quotes silently includes or excludes them, which is the entire reason three agents reported 65.4%, 66.0% and 55.4% for the same arm and each believed the others were wrong.

**The figure this judge re-ran**

I re-ran at least one predicted figure from each, all through the real functions with probes in my scratchpad; the repo was never written to.

MOST DECISIVE — fit-to-the-world's test-breakage claim, which HELD exactly. I patched all four constants (AS_GOOD_AS_IT_GETS 0.82->0.34, TOO_FAR 3.4->2.05, CLOSE_ENOUGH 1.2->1.05, exponent deleted) into a copy and ran the unmodified suite: 44 files, 1 failed, 43 passed; 1208 tests, 3 failed, 1204 passed, 1 todo (predicted 1207/3/1203/1). The three failures are the three it named, at those lines, and tests/audition.test.ts:1116 printed `walked/3 = 0.19273080241587578` — the identical seventeen digits it quoted.

smallest-change — HELD. Exact enumeration gave P(off<=1.2) = 0.277778 blind and 0.599090 after 'good' at sure=0.8215, and P(cast) = 0.706024, all to six decimals as predicted. Then I applied its patch: tsc exit 0, and six arms x 6 seeds x 12 years byte-identical on ups/answered/settled/cast/rate/why-histogram.

make-it-a-decision — HELD on the mechanism, FAILED on the safety claim. House (2,-1,0) -> best opening (2,-1,0) 0.7888 vs dead centre 0.7363, gain +0.0525, and all three other houses exact to 4dp; marginal pmf invariant at H=0/0.5/0.7/1.0. But "HOUSE_HOLDS = 0 reproduces the shipped game bit-for-bit" is false: 200 seeds, 4 identical, 196 different, because the proposed body burns a second `next()` per shade even at H=0.

Two cross-checks that validate the harness: my parameterised `keen` matched the real `decideAudition` to 1.1e-16 over all 19 attainable off values, and the measured career judged-rate for a tape (0.6285) matched the exact analytic 0.625851.

CAVEAT: the working tree moved under me mid-measurement. HEAD went a3daa25 -> c8bdf57 and src/engine/systems/life.ts was rewritten at 01:50:21 while my career runs were in flight, which is what produced a 0.3-point drift in my readiness telemetry between two otherwise byte-identical runs. The audition constants themselves were unchanged throughout, and I re-ran the readiness and sleep probes against the final tree: still 49.2 and 95.0 on all three seeds.

### Judge 2

| proposal | truthfulness | premise | cost | decision |
|---|---|---|---|---|
| smallest-change — "Two sentences the roo | 9 | 8 | 10 | 2 |
| make-it-a-decision — "The house: a room  | 7 | 9 | 4 | 8 |
| fit-to-the-world — "Drop the ceiling, br | 9 | 6 | 6 | 4 |

**smallest-change — "Two sentences the room could not keep, an** — The most honest document of the three and the least consequential. Every figure I re-ran reproduced: tape 0.625851, dead-center/room/'good' 0.706024 at sure=0.8215, 'far' 0.787229 at sure=1. Its Option B linearity claim is exactly right — I measured best/A = 0.861012 at A = 0.82, 0.65, 0.58 and 0.34, constant to six digits. But that IS the indictment. I enumerated all 343 openings x 2 ways x 4 answers at A = 0.82, 0.65, 0.58 and 0.34 and the answer-variety table is byte-identical at every value (none 98 / touch 276 / good 282 / far 912 / tie 196 across the 1,764 readable states), dead center stays uniquely rank 1/343, and the value of knowing the note beyond simply pressing 'good' stays at +0.000007. Option B moves the yes rate 19 points and moves the decision by precisely zero. Its argument-against is correct that the tape is the bigger failure, and it does not fix it. The pinning test is the one durable thing here and it is worth taking on its own.

**make-it-a-decision — "The house: a room that wants the same ** — The only proposal that produces a decision, and I verified the mechanism rather than trusting it. Enumerating all 343 houses at their true draw weight with HOUSE_HOLDS = 0.7: 343/343 distinct best openings, and the best opening IS the house in 343/343. The opening stops being a button outright. The answer stops being 'far' by default — at the best opening the spread goes from (good 80, far 40, tie 0) with no house to (none 10, touch 51, far 37, tie 7). And the way in becomes a real trade: the room's premium over the tape at the oracle opening falls to 0.0150, BELOW the 0.0200 that P2 itself measured the two extra days cost through `settle`'s `freeAcross` re-check — so the tape genuinely becomes right once you know the house. Three buttons become three decisions. Marked down for one inflated figure (see checkedFigure) and for cost: every seeded want in every save moves, `whatTheyWant`'s signature changes, and the mechanic is unplayable without the React default-value change, which puts a load-bearing decision in the UI layer. Its four killed candidate costs — reliability clamped at 1.000 in 87.3% of readings, readiness a daily fixed point, the diary committing whole weeks, money never scarce — are the most valuable measurement in the entire set.

**fit-to-the-world — "Drop the ceiling, bring the door in, str** — Its arithmetic is dead on — I predicted-checked its own headline and got naive 0.2535 against its 0.2536 and best 0.258828 against its 0.2590 — and it is admirably explicit that 0.34 is a residual fitted backwards from a 25% target, not a published figure. But it fixes the rate, not the room. Dead center is still uniquely rank 1/343. The note answer improves from +0.000007 to +0.005323 of P(cast), which is 760x a near-zero base and still only 2% of the 25% it now books. Worse, the recommended variant makes answer variety go BACKWARDS against shipped: 'far' is uniquely best in 1,078 of 1,764 readable states at played readiness, against shipped's 912. Its own rejected Shape B (A=0.42, CE=0.7, TF=2.05, e=1.4) is the better variant on every decision metric I measured — good 482 / far 980, note value +0.004344 — and it discarded it for a reason that my enumeration contradicts: the good/far flip survives Shape B at dead center (far 0.2951 vs good 0.3052 rested, so good wins; but the flip is alive across openings). It chose the worse shape.

**Recommendation**

Take make-it-a-decision as the spine. It is the only one of the three that survives the dominance test: I enumerated all 343 houses at their true draw weight and at HOUSE_HOLDS = 0.7 there are 343 distinct best openings, the best opening is the house every single time, and the oracle room premium (0.0150) falls below the two extra days' measured cost (0.0200), so all three buttons become decisions. Nothing else in the set changes the strategy space at all.

Graft on from smallest-change, unconditionally and in the same commit, because they are free and orthogonal: the deletion of `Audition.heard` (one write at world/audition.ts:598, zero readers; keep line 597's `.next()` so no seed moves), the two false CLOSE_ENOUGH clauses, the HOW_FAR 'good' row's "Most notes want about this", and both stale UNBITTEN entries. Above all take its pinning test on the cast rate. I confirmed why it matters: A is a pure scalar — best/A = 0.861012 at every value I tested — so 1,203 tests cannot see a 19-point swing in the game's central outcome. That is how a comment came to assert the opposite of the code for as long as it existed.

Graft on from fit-to-the-world ONE line and no others: AS_GOOD_AS_IT_GETS, if the owner wants the rate in the 15-30% band. It is provably shape-neutral, so it can be tuned independently of everything above without touching a single decision. Do NOT take its CLOSE_ENOUGH, TOO_FAR or exponent changes, and here is the measured reason nobody has stated: tightening CE makes the note worth MORE, which re-kills the tape decision the house just created. I ran the combination — house 0.7 + Shape B gives a room premium of 0.0427 at the oracle opening, back above the 0.0200 the extra days cost, so the tape is never right again. P3's shape work and P2's mechanism actively fight each other. Take P2's shape and P3's level.

Sequencing caveat, and it is P2's own and I believe it: every way-in decision in all three proposals rests on a 2-point `dates` side effect that nobody designed and no comment mentions. Before shipping the house, unclamp `remembersYou` (pinned at 1.000 in 87.3% of readings) and give readiness memory past the daily rollover, so the room can be priced in something real instead of an accident of settlement timing.

**What nobody proposed**

Nobody proposed fixing the currencies first, and the measurements say that is the actual prerequisite. `afterTheNote(r, note, 'none', ...)` returns `r` unchanged, so the room's action set strictly contains the tape's and the room weakly dominates by construction — no constant in either file can change that. All three proposals accept it. P2 works around it by making the note worth less; P1 and P3 leave it standing. That means the way-in decision in every proposal hangs on a 2-point `dates` loss from settling two days later, which is a side effect of `settle` re-checking `freeAcross`, not a designed price.

P2's own killed-costs probe already found why no designed price exists: reliability is clamped (`remembersYou` pinned at 1.000 in 87.3% of real readings, and identical at reliability 0 and 100 in 83.5%), readiness is a daily fixed point (a 12-point energy hit is gone by tomorrow), the diary commits in whole weeks so it cannot tell a 90-minute slot from a free afternoon, and money is never scarce (0 of 3,900 career-weeks below the €120 fee). Four plausible prices, four dead. That is not an audition-room finding — it is a finding about the wellbeing model and the standing ratchet, discovered in the audition room and buried in an argument-against-itself section.

The option none of them wrote: unclamp `remembersYou`, give readiness memory across the rollover, ship the house, and leave all four constants exactly where they are. That fixes the opening (measured: 343/343 distinct best openings) and makes the way in pricable in something a player can feel, without asserting a single new number about how often rooms say yes.

**The figure this judge re-ran**

I re-ran make-it-a-decision's load-bearing prediction: "At H=0.70 the best opening IS the house, exactly, for every house tested... mean gain over dead center +0.1527" at sure=0.7361 answering 'good'. I enumerated all 343 houses at their exact draw weight (not a 58-holder sample) against all 343 openings, using the real `theNote`, `afterTheNote` and `howFarOff`. THE STRUCTURE HELD, completely: 343/343 distinct best openings, and the best opening equals the house in 343 of 343. THE MAGNITUDE DID NOT: I measure the mean gain at +0.1089, not +0.1527 — 4.4 points low, a 29% overstatement, most likely because their 58 sampled holders were drawn from real play rather than weighted by the true pmf. I also checked and confirmed the claim they were least sure of: the room premium at the oracle opening is 0.0150, which is below the 0.0200 they measured the two extra days cost, so the tape really does become the right choice once you know the house — and my exact figure supports that conclusion more strongly than their own noisy engine measurement (+0.0089 +- 0.0078) did.

### Judge 3

| proposal | truthfulness | premise | cost | decision |
|---|---|---|---|---|
| smallest-change — "Two sentences the roo | 9 | 8 | 10 | 4 |
| make-it-a-decision — "The house: a room  | 7 | 8 | 4 | 8 |
| fit-to-the-world — "Drop the ceiling, br | 4 | 5 | 2 | 3 |

**smallest-change — "Two sentences the room could not keep, an** — TAKE IT. Every blast-radius claim it makes, I applied and ran, and every one held. Applied the Audition.heard deletion to a copy (the 10-line block at /home/user/1221/src/engine/domain/model.ts plus the write at /home/user/1221/src/engine/world/audition.ts:598, keeping the rng draw at :597): `npx tsc --noEmit` exits 0, `npx vitest run tests/audition.test.ts` is 57/57. `grep -rn '\.heard\b' src/ tests/` returns exactly one hit and it is the write itself — 0 readers, claim verified. Its central figure reproduces on my own independent exact enumeration over all 343 wants with P(cast) bisected out of the real decideAudition: naive (dead center, room, 'good') = 0.706024 at sure=0.8215 and 0.776374 at sure=1, to six decimals. Its weakness is the one it names itself: it changes nothing about whether the player has a choice, and it declines to fix the tape while proving the tape is dominated.

**make-it-a-decision — "The house: a room that wants the same ** — RIGHT IDEA, NOT TODAY, AND ONE CLAIM IS FALSE. The mechanic genuinely works: I applied it (HOUSE_HOLDS, whatTheyWant(house), theHouse, the whatIsGoing call site), and the best opening equals the house in 5/5 houses tested, with gain over dead center from 0.0000 (house at center) to 0.3472 (house at a corner). The marginal want is genuinely unchanged — E|w| = 1.498710 over 900,000 real draws against the shipped 1.500000 — so every fitted threshold still means what it meant. tsc exits 0 and the FULL suite is 44 files, 1207 passed, 1 todo, ZERO failures. FALSIFIED: its falsifiability claim that 'HOUSE_HOLDS = 0 reproduces the shipped game bit-for-bit'. Same seed 'bitcheck', shipped gives wants {warmth:0,size:-1,pace:3}, H=0 gives {warmth:0,size:3,pace:-2}. Different world. The short-circuit in `house !== undefined && next() < HOUSE_HOLDS` means the second draw is always consumed once a house is passed, so H=0 reproduces the distribution, not the bits — and its stated rationale ('the draw count is fixed at two per shade') is backwards, it is one draw when house is undefined and two when it is defined. That asymmetry is the real reason the two shape-pinning tests survive. Cost is the problem: new constant, changed signature, new RNG stream, new exported accessor, and a UI default value that its own text admits is load-bearing rather than advisory. It passes the full suite only because nothing is pinned — that is the absence of a net, not safety.

**fit-to-the-world — "Drop the ceiling, bring the door in, str** — DO NOT TAKE AS PROPOSED — its headline blast-radius claim is false and it says 'measured' beside it. Applied all four constant changes: the full suite gives 3 failed / 1204 passed / 1 todo, matching its claim of three failing TESTS, and its walked/3 = 0.19273080241587578 reproduces to all 17 digits, which proves it really did run the suite. Then I applied its OWN three proposed fixes (off 2.4→1.5, roll 0.5→AS_GOOD_AS_IT_GETS/2, 0.2→0.10) and re-ran: STILL RED. `expected 0 to be greater than 4` at /home/user/1221/tests/audition.test.ts:759. The proposal states 'the sibling assertions at :758-761 all still pass unchanged — measured.' They do not. Vitest stops at the first failing assertion in a test, so :749 failed first and :759 never ran; the proposal counted failing tests and reported them as failing assertions. In a project whose standard is that a number is measured and not asserted, that is the exact failure mode. Cost is also the worst of the three by a wide margin: by its own figures 3.81 → 1.57 parts per career-year, fee income down 78%, end fame 100.0 → 50.3, every saved game and screenshot stale. And it does not create a decision — its own numbers put best at 0.2590 against naive 0.2536, a 0.54-point gap. Its argument-against-itself is the best writing in the three proposals and concedes that 0.34 is a residual fitted backwards from a 25% target wearing the research band's clothes.

**Recommendation**

TAKE smallest-change, essentially as written, and graft four things onto it.

WHY IT WINS ON MY AXIS: it is the only one of the three whose blast-radius claims survived being applied and run. Verified on a copy: tsc exit 0, audition suite 57/57, and the only two files that differ are model.ts and world/audition.ts. Zero seeded outcomes move, because it deletes the write at world/audition.ts:598 and keeps the draw at :597.

GRAFT ON, IN ORDER OF VALUE:

1. ITS OWN PINNING TEST IS THE MOST VALUABLE ITEM IN ALL THREE PROPOSALS — land it FIRST, before anything else. I measured why: proposal 2 changes the hidden want of every audition in every save in the game, and the full suite comes back 1207 passed / 0 failed. Nothing in 1,208 tests notices. Proposal 1's own claim that AS_GOOD_AS_IT_GETS can move 0.82 → 0.65 invisibly is the same hole from the other side. The room's central outcome is unpinned, which is precisely how a comment came to assert the opposite of it for as long as it existed. Pin it at 0.706 (dead centre, room, 'good', sure=0.8215) — my independent enumeration gives 0.706024.

2. WHAT NOBODY PROPOSED, AND IT IS CHEAPER THAN ANY OF THEM — delete 'Leave It' from HOW_FAR in /home/user/1221/src/engine/content/audition.ts. Measured: across all 343 openings at six readiness levels spanning the entire reachable range (sure ∈ [0.65, 1], since heardItRight = 1 − 0.35(1−ready)), 'Leave It' is the best answer in 0 of 2,058 cells. 'A Touch' beats it everywhere by a minimum margin of 0.018653. It is also bit-identical to not going in at all — 1,368 (want × roll) cells, max |off difference| = 0. That is THE ONE RULE verbatim on a content constant: a declared button no state of the world can ever want pressed. Deleting it costs one array entry and touches two test call sites (:807, :828), and it turns the note into a genuine three-way choice with no dominated option. Proposal 1 patches the prose directly beside it; proposal 2 invents a new mechanism; proposal 3 rescales the constants around it. None of them names it.

3. ALSO NOBODY'S — fix the test helper's dead default. /home/user/1221/tests/audition.test.ts:110 has `howFar = 'full'`, and 'full' is not a valid HowFarId; the suite's own line 873 asserts take_note REFUSES it. Line 470 — the flagship "decides exactly the same thing with every attribute in the save at fifty", commented "The whole file in one assertion" — passes 'full' explicitly, so take_note silently returns ok:false and the note is never answered. The one test that proves the room reads no attribute never exercises afterTheNote, heardItRight or MISREAD_THE_ROOM. I verified the fix: change :470 to 'good' and the test still passes while actually covering the note path. One word. (It is a coverage gap, not a live bug — readiness reads wellbeing, not attributes — but it is free to close.)

4. FROM PROPOSAL 2, TAKE THE PROSE AND LEAVE THE CODE. Its "NOT PROPOSED — four costs I measured and killed" section is the most useful negative result on the table: reliability is clamped away, readiness is a daily fixed point, the diary commits in whole weeks, and the door window is never under three days. That is exactly why proposal 1's "make the room cost something" option has nowhere to land, and it belongs in docs/UNBITTEN.md so nobody re-proposes those four.

ON AS_GOOD_AS_IT_GETS: proposal 1's Option B and proposal 3 agree it is the only true level knob, and that is structurally right — keen is A × shape(off) in both branches, so P(cast) is exactly linear in it. If the owner wants the room harder, cut A and nothing else. But do it as a separate, owner-decided commit AFTER the pinning test lands, never bundled — the pinning test is the only thing that will make the change visible. Do NOT take proposal 3's TOO_FAR/CLOSE_ENOUGH/exponent changes with it: narrowing the window to exactly 1.0 is what breaks :759, and it means one step of shade error takes you from the top of the ramp to a guaranteed no, which the proposal never mentions.

WHAT I WOULD NOT DO: bundle proposal 2. It is the only proposal that creates a real decision and it deserves its own task, but it needs tests before it needs a UI, and today the suite would not catch it if it were wrong.

**What nobody proposed**

DELETE 'Leave It'. All three proposals leave a button in HOW_FAR that no state of the world can ever want pressed, and the project has a rule against exactly that.

Measured over all 343 openings at six readiness levels spanning the whole reachable range of `sure` (heardItRight = 1 − MISREAD_THE_ROOM·(1−ready), so sure ∈ [0.65, 1] and nothing outside it exists):

  sure=1.0000  none=0  touch=0    good=0  far=343
  sure=0.9000  none=0  touch=0    good=1  far=342
  sure=0.8215  none=0  touch=0    good=1  far=342
  sure=0.7500  none=0  touch=0    good=7  far=336
  sure=0.7000  none=0  touch=0    good=7  far=336
  sure=0.6500  none=0  touch=7    good=4  far=332

'Leave It' is best in 0 of 2,058 cells. At dead centre it is flat at 0.625851 at every readiness (it must be — steps=0, so the misheard direction cannot matter) while 'A Touch' beats it by a minimum of 0.018653 even at the fatigue floor. And it is bit-identical to never going in: 1,368 (want × roll) cells through the real afterTheNote, max |off difference| = 0.00e+0.

So the room has four buttons and one of them returns the free tape's number after three days, EUR 120 and an afternoon the clock stops for. THE ONE RULE says a declared word with nothing that reads it is worse than no word at all; this is a declared word that everything reads and nothing can ever want. It is the cheapest genuine fix on the table — one array entry in /home/user/1221/src/engine/content/audition.ts, two test call sites at tests/audition.test.ts:807 and :828 — and it makes the note a real three-way choice with no dominated option, which is the thing proposal 2 spends a new constant, a changed signature, a new RNG stream, a new accessor and a UI rewrite trying to buy.

Note this is NOT the same as the tape. The tape is weakly dominated and everyone said so; fixing it needs a price nobody can currently denominate (proposal 2 measured four candidate currencies and killed all four). 'Leave It' is strictly dominated with no such problem — deleting it costs nothing and needs no new number. The three proposals between them patch the prose beside it, build a mechanism around it, and rescale the constants under it. None of them looks at it.

Second, smaller, also free: /home/user/1221/tests/audition.test.ts:110 defaults `howFar = 'full'`, which is not a valid button id — the suite's own :873 asserts take_note refuses it. Line 470, the flagship attribute-blindness test, passes it explicitly, so the note is never answered and the file's "whole file in one assertion" never touches afterTheNote, heardItRight or MISREAD_THE_ROOM. Verified fix: change :470 to 'good' and it still passes, now covering the note path.

**The figure this judge re-ran**

I re-ran proposal 3's claim that "the sibling assertions at tests/audition.test.ts:758-761 (monotone falloff, and at(0)/100 close to AS_GOOD_AS_IT_GETS) all still pass unchanged — measured." IT DID NOT HOLD.

I copied the repo, applied all four of proposal 3's constant changes (AS_GOOD_AS_IT_GETS 0.82→0.34, TOO_FAR 3.4→2.05, CLOSE_ENOUGH 1.2→1.05, and deleted the `** 1.4`), then lifted the exact `at()` helper out of tests/audition.test.ts:751-758 and ran it against the real patched decideAudition:

  at(CLOSE_ENOUGH)     = 34   (off 1.05)
  at(CLOSE_ENOUGH + 1) = 0    (off 2.05)
  at(TOO_FAR - 0.1)    = 4    (off 1.95)

  assertion at(CE) > at(CE+1)      PASS
  assertion at(CE+1) > at(TF-0.1)  FAIL   0 is not greater than 4
  assertion at(0)/100 ≈ A (1dp)    PASS

Then I confirmed it end to end rather than trusting my own arithmetic: I applied proposal 3's own three proposed test fixes to the same copy and re-ran `npx vitest run tests/audition.test.ts`. Result: 1 failed | 56 passed — "AssertionError: expected 0 to be greater than 4" at tests/audition.test.ts:759. Proposal 3's fix list is incomplete and its suite does not go green.

Why it got this wrong, and it is instructive: the full suite under its constants reports exactly 3 failing tests, which matches its claim. But vitest stops at the first failing assertion inside a test, so tests/audition.test.ts:749 fails first and :759 never executes. The proposal ran the suite honestly, saw three failures, and reported "3 assertions". It also reproduced walked/3 = 0.19273080241587578 to all 17 digits, so it certainly ran the thing — it just read failing tests as failing assertions.

Is the break the test being right or the test being stale? Both, and the right half matters more. The assertion's literal form is brittle: `at(CE+1) > at(TF-0.1)` only orders correctly when TOO_FAR − CLOSE_ENOUGH > 1.1, so it hardcodes an assumption about the window width. But the property it accidentally pins is real and load-bearing — proposal 3 narrows the falloff window from 2.2 to exactly 1.0, which means one extra step of shade error carries you from the top of the ramp to keen = 0, and off = TOO_FAR exactly now returns a guaranteed no still labelled 'went-another-way' rather than 'wrong-for-it'. That is a design consequence the proposal never mentions anywhere, and the stale-looking test is the only thing in the repo that caught it. Rewrite the assertion to be generically monotone; do not just move its magic numbers to make it pass.
