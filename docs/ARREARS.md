# The arrears, verified


What `docs/UNBITTEN.md` claimed, checked against the code that is actually in
the tree. Sixty agents: one per subsystem cluster reading and probing, then one
adversary per surviving claim whose only instruction was to refute it and who
was told to default to refuted where unsure. Every claim that survived is a
claim somebody tried hard to kill and could not.

**28 survived. 20 were refuted. 4 were already settled.**

The ledger was a list of scout leads, and a third of it was wrong. That is the
point of running it: `UNBITTEN.md` is not evidence, it is a list of things to
check, and until this document existed nothing had checked them.

Every entry below carries the evidence it survived on. Where a fix is a design
decision, the options are stated and not chosen — those are the owner's.


## Where this stands

Resumed after a pause, and further along. The tree is clean and everything is
pushed.

**Cleared — nothing below needs a decision from anybody any more.**

| what | where it landed |
|---|---|
| 366 dead lines in `domain/model.ts` | `bad08da` — the figure was wrong; 169 lines across eight names, checked by transitive closure |
| the overdraft model nothing writes | `bad08da` — and thirteen more `Account` fields the sweep found that the audit had not |
| `Part.dueAt` | `bad08da` |
| `Audition.took` | `83e8ca8` |
| the reimbursement's under-18 case | `83e8ca8` — and the four spellings of the rate rule collapsed to one |
| the house that rots while the screen blames you | `dd6c397` — the false sentences only |
| the want distribution described twice wrong | `848b17e` |
| 104 id namespaces nothing issues | `e2c8fd4` — the gate's dead-word floor, 160 down to 56 |
| 47 trait modifier knobs, named rather than deleted | `a3daa25` — the ledger's "contradiction" was a colon |
| 6 higher-is-worse guards on knobs no trait carries | `c8bdf57` — floor 56 down to 50 |
| the creation screen saying two axes are live when three are | `57f4044` |
| the room's central outcome, pinned to six decimals | `62ab848` |
| Leave It, the misheard no, and two false sentences | `df42a67` |

**Next, and each one needs a call before it can be built.**

Three entries filed under Deletions turned out to carry a choice, so they are
not deletions:

- `canWorkIn` — delete it, or build EEA free movement first. A Dane needs no
  arrangement to work in Iceland and `content/casting.ts` already says so, so
  the function as written is wrong rather than merely unread.
- `RATE_SHARE.hold` — delete it, or give it the reader the content is already
  asking for: a returning series holding a standing set through post.
- the four person fields and the whole skill sheet — this one is visible. It
  takes the Lifestyle select and the Where You Come From box off the creation
  screen.

One half of a Mechanical entry is also a call: the house decays to nought in
under twenty-three years and there is no repair. Whether the family holds it
up, whether the player can spend on it, or whether the decay goes entirely.

Then the eighteen under Decisions below, of which the heaviest are `quoteOf`
only ever going up, nothing in the company ever ending or recurring, the
Decision Center nothing writes to, and `w.fitness` as a one-way ratchet.

**Still counted by the gate, and all three are deliberate now rather than
unexamined:** 47 trait modifier knobs and 3 personality axes, both dormant on
purpose and both named in `tests/taste.test.ts` so nothing can quietly join or
leave the list. The guards are gone. `Account.closedAt` is the one thing
knowingly left: no writer, twenty-two readers filtering on it, so removing it
touches live code in twenty-two places and an account that can be closed may
well be wanted.

**The hazard this document should carry.** Three times in one run of work,
measuring a save nobody plays produced a confident wrong answer: the fifth
stage's value, this document's own reading of the personality axes, and the
creation screen's count of them. Almost every test in this project runs an
idle save, and an idle save sits at a fixed point where most levers do
nothing. Anything measured about a lever should be measured on a save that is
played, or at the mechanism where an idle world cannot hide it.


## Mechanical — one obviously right fix (2)

The code contradicts itself or its own comment. No judgement call in these.


### The house rots with no repair, and the screen tells the player it is their fault for a choice they do not have.

**Cluster** `wellbeing` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/systems/life.ts`, `/home/user/1221/src/ui/looks/estate.tsx`, `/home/user/1221/src/engine/content/estate.ts`, `/home/user/1221/src/ui/screens/Home.tsx`, `/home/user/1221/src/engine/domain/model.ts`


**Evidence**

Both halves true, and there is a third thing the ledger missed: the content file itself asserts the opposite of what the engine does.

NO WAY UP. The only writer of property.condition in the engine, life.ts:278-281:
  for (const property of Object.values(sim.universe.properties)) {
    if (property.soldAt) continue;
    property.condition = clamp(property.condition - 0.012, 0, 100);
  }
Monotone. `sim.commandKinds()` at runtime returns: calendar.cancel, calendar.schedule, calendar.skip, company.breakdown, company.cast, company.claim_rebate, company.deliver, company.develop, company.fill_post, company.form_arm, company.greenlight, company.insure, company.option, company.register, company.release, company.sell, company.session, company.sign, life.go_up, life.sleep, life.take_note, lot.build, lot.sell, world.dismiss_decision, world.mark_read, world.set_preferences, world.take_decision_action. No repair, maintain, renovate or spend-on-the-house command exists, and no UI affordance calls one.

PROBE (house starts at 100, content/estate.ts:134): year 1 = 95.620, year 5 = 78.100, year 10 = 56.200, year 20 = 12.400, year 40 = 0.000. 0.012/day = 4.38/year, so zero in 22.8 years — inside one career.

IT IS NOT COSMETIC. life.ts:190-192 `else quality += remap(property.condition, 0, 100, -0.12, 0.10);`. 100 -> 0 takes a night's base quality from 0.82 to 0.60, a 27% cut, and quality multiplies everything applySleep gives back.

THE BLAME, estate.tsx:274-278:
  "Condition is the one figure in this house that moves on its own. It sets how much a night here gives you back and IT SLIPS A LITTLE EACH DAY NOBODY TENDS TO IT — and at {kept}/100 it's ... ' costing you sleep you'd otherwise have had.'"
and the summary, estate.tsx:263: "it's down to {kept}, and the nights aren't putting back what they should."
Sitting eleven lines below that same paragraph, estate.tsx:289: `<Stat label="What It Costs You" value="Nothing" note="Nobody to answer to about it" />`. One screen says the house costs you nothing and that it is costing you sleep because nobody tends to it.

THE CONTRADICTION THE LEDGER MISSED. content/estate.ts:133 comments the condition field: "/** Full, because it is new and BECAUSE THE FAMILY KEEPS IT THAT WAY. */", and estate.tsx:269-270 repeats it to the player: "as high as it goes. The house is barely a year old and the family keeps it that way." The engine decays it to zero regardless. The code contradicts its own comment.

BONUS DEAD WORDS in the same loop: `Property.upkeepBillId` (model.ts:652) is declared and read by NOTHING in the whole tree — it is the field a repair system would have used. And `property.soldAt` (model.ts:417), guarded at life.ts:279, is written nowhere for properties; the only soldAt write in the engine is `project.soldAt = sim.now` at world/selling.ts:301. So that `continue` has no caller either.

OVERSTATEMENT CHECK: "rots" is strong for 0.012/day. A player who never reaches year 10 never notices the number. The decay is true but slow; the screen's dishonesty is the live half of this claim.


**Fix**

Three defensible answers.
(a) GIVE THE PLAYER THE CHOICE THE SCREEN IMPLIES. Add `life.maintain_home` (or `property.repair`) alongside the other life.* commands in src/engine/systems/life.ts: charge the player's account via `sim.expense`, take calendar time via `sim.schedule`, raise `property.condition` toward 100. Wire the orphaned `upkeepBillId` to a standing monthly charge that holds condition flat, so "tending to it" becomes a recurring priced decision — exactly the shape content/lot.ts:337-343 already uses for the lot's 'Set Aside For Repairs' overhead line. Then estate.tsx:275 becomes a true sentence.
(b) MAKE THE FAMILY DO IT, AND FIX THE SENTENCE (recommended). The premise is explicit — estate.tsx:206 "Held By The Family / Not bought, not leased and not yours to sell", and content/estate.ts:133 already claims the family keeps the house up. Honour it: put a floor in the life.ts:280 decay (e.g. `Math.max(85, condition - 0.012)` for family-held properties), so decay is real but bounded, and rewrite estate.tsx:263 and 274-278 to say the family keeps it and what it still costs you. This makes the code agree with its own comment, which is the cheapest honest fix.
(c) DELETE. Drop life.ts:280, drop the condition term from sleepQuality (life.ts:192), drop the meter from Home.tsx:498-502 and the Stat/paragraph from estate.tsx:263,274-289, drop `upkeepBillId`.
I recommend (b): the estate is framed as the family's, there is no housing economy in this build, and (a) adds a whole spend-and-schedule loop for one sleep multiplier. Under NO option should the current text survive — "nobody tends to it" must stop being said while nobody can.


**Risk**

`sleepQuality` (life.ts:187-203) is the sole engine reader, and it multiplies `effective = hours * quality` inside applySleep, so any change to condition changes energy, sleepDebt, stress, morale and condition for everyone in the house — and therefore `readiness`, and therefore the audition room and the whole casting chain. A long save today is quietly getting worse nights every year; putting a floor in will visibly raise late-career readiness. Two screens read it and both branch on >= 100 / >= 70 / else: src/ui/screens/Home.tsx:498-502 (`<Meter label="Condition" value={snapshot.home?.condition ?? HOUSE.condition} />`) and src/ui/looks/estate.tsx:234,261-268,274-278,281. A floor at 85 makes the third branch unreachable and the first true only on day one, so both copy blocks must be rewritten, not just the paragraph. If you add a repair command it posts to the ledger via `sim.expense`, and tests/business.test.ts:501 asserts on the memo string /Set Aside For Repairs/ — pick a memo that does not collide with the lot's overhead line. Note also that this claim interacts with claim 1: a condition-driven sleepQuality change lands on top of the double-applySleep bug, so fix the ordering first or you will be balancing against a number that is being applied twice.


**What the adversary added**

I split this into the one thing that must change and the one thing that is optional — they bundled both into a single DESIGN_DECISION, which is what inflated it.

MUST (mechanical, no alternatives worth debating). Stop printing false sentences in src/ui/looks/estate.tsx.
- :274-278 — delete "and it slips a little each day nobody tends to it". Replace with what is actually true: the condition falls on its own and there is nothing in this build you spend to stop it. If the intent is the family premise, say the family holds it back rather than that nobody tends it.
- :269-270 — the kept>=100 branch says "the family keeps it that way". Either make it true (see OPTIONAL) or drop the clause. Note tests/estate.test.ts:86-91 asserts this look's summary contains '100/100' and 'had time to go wrong'; keep both tokens or update that test in the same commit.
- :263 — "the nights aren't putting back what they should" is fine as a statement of fact; it is only the blame in :275 that has no referent.
- :289 — leave the "What It Costs You / Nothing" Stat alone. It is a money statement consistent with :238-243 and Home.tsx:495. Their objection to it does not survive reading the surrounding paragraph.
- content/estate.ts:133 — change the comment "because the family keeps it that way" to match whatever the engine actually does, or the same lie just moves into the source.

SHOULD, same commit, separate concern. The decay loop at life.ts:279 iterates every property and writes prop_00000p (Sugar Land Studios) as well, whose condition has no reader anywhere. Either scope the loop to the residence (`if (property.kind === 'studio_lot') continue`, or gate on isPrimaryResidence) or accept it and say so in a comment. Right now it is a per-day write to a dead field, which is THE ONE RULE.

OPTIONAL, and only if the owner wants it (this is the genuinely-design part, and it is NOT urgent — my probe shows zero outcome delta before year 6):
 (i) Floor it. `property.condition = clamp(property.condition - 0.012, FLOOR, 100)` with FLOOR around 85 for the residence. Cheapest. Makes the engine agree with content/estate.ts:133. Branch on `property.isPrimaryResidence` or `kind`, NOT on a "family-held" flag — no such flag exists, which is a hole in their fix (b).
 (ii) Delete it. Drop life.ts:280 entirely, drop the condition term from sleepQuality at life.ts:191-192, drop the Meter at Home.tsx:498-502 and the Condition Stat at estate.tsx:286. Defensible precisely because the probe shows it decides nothing for six years.
 (iii) Build a repair loop. A life.maintain_home command with sim.expense + sim.schedule, shaped like the lot's 'Set Aside For Repairs' overhead at content/lot.ts:357. This is a FEATURE, not a defect fix, and it is the most work for the least measured payoff.
I would do (i). It is three characters of engine change, it makes the code agree with its own comment, and it retires the false sentence without inventing a spend-and-schedule loop for a multiplier that is provably inert in the horizon anyone plays.

DO NOT do the upkeepBillId half of their fix (a). model.ts:652 is a Vehicle field for a boat berth or aircraft hangar, documented as legacy-migration-only. It is unrelated to houses. If you want it gone, delete it as its own one-line cleanup — do not wire it to property.condition.

RISK IF YOU CHANGE THE DECAY. sleepQuality (life.ts:187-202) feeds `quality` into applySleep (life.ts:205-236) at both call sites — the deliberate life.sleep command (life.ts:141) and the coasting path (life.ts:340, at * 0.95). applySleep's `effective = hours * quality` multiplies energy, sleepDebt, stress, body condition, morale and travelFatigue, so a floor raises the long-run wellbeing of every coasting save. Downstream readers to watch: tests/calibration.test.ts:70-72 (seed reproducibility — compares two seeds, so a uniform floor is safe, but it does read `one.condition.toFixed(3)`), tests/premise.test.ts:128 (actor/actress parity — safe, both sides move together), tests/smoke.test.ts:81 (`w.condition > 0`), tests/estate.test.ts:93-97 (200 days, asserts < 100 — an 85 floor passes at 97.6), and tests/taste.test.ts:94 which explicitly calls sleepQuality "the knob that pays out today: it reaches morale through...". That last one is the test most likely to notice a floor; read it before changing the coefficient. finance.ts:37 and money.tsx:107 read property.soldAt and marketValue, not condition, so net worth does not move.


### "The reimbursement's under-18 case" — REBATE.note says the higher rate applies unconditionally to work for audiences 18 and under; no picture declares an audience.

**Cluster** `seasons-misc` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/content/incorporation.ts`, `/home/user/1221/src/engine/world/rebate.ts`, `/home/user/1221/src/engine/world/company.ts`, `/home/user/1221/src/engine/domain/company.ts`, `/home/user/1221/src/ui/looks/business.tsx`, `/home/user/1221/src/ui/workspaces/BusinessWorkspace.tsx`


**Evidence**

Confirmed exactly as written.

THE SENTENCE, src/engine/content/incorporation.ts:208-209:
    note: 'Both rates are the published ones. The higher tier also applies with no conditions at all to '
      + 'work made for audiences of eighteen and under.',
It is printed to the player: src/ui/looks/business.tsx:950 puts it on the rebate look's `provenance` line, under a card that shows "Pays Back 25%".

NOTHING DECLARES AN AUDIENCE. Repo-wide grep for `audience` outside node_modules returns only `Person.reputation.audienceAppeal` and prose. `Project` (src/engine/domain/company.ts:358-500) has `medium`, `stage`, `planId`, `ladders`, `parts`, `owesSeconds` — no genre, no certificate, no audience. `company.develop` (src/engine/world/company.ts:747-774) takes `{ title, medium?, holdingId? }` and writes nothing else. There is no age rating anywhere in the delivery list or the maturity ladders.

WHAT THE RATE ACTUALLY TURNS ON, probe /tmp/probe/p8.mjs (feature plan, same save shape, varying budget):
  €300,000 / 2w  -> rate 0.25  short on: Icelandic Spend, Crew Taxed Here, Days They Are On It
  €800,000 / 3w  -> rate 0.25  short on: Icelandic Spend, Crew Taxed Here, Days They Are On It
  €2,000,000 / 6w-> rate 0.25  short on: Icelandic Spend, Crew Taxed Here, Days They Are On It
  €6,000,000 / 8w-> rate 0.35  short on: nothing
So the whole of the small-picture range sits at 25% and the note says those pictures could be at 35% unconditionally if they were for children. The gap is 0.10 of certified spend — on the €2m picture above, roughly €150k of real money the sentence promises and the engine cannot deliver. Falsifiability test: there is no input a player can change to make that sentence true.

The note is also the one clause of REBATE that has no implementation, which is notable because every other clause does: `share`/`higherShare` at src/engine/world/rebate.ts:189, `higherNeeds` through `shortOn` at :184, `endsOn` at :71 (the 'scheme-ended' refusal), `paidAfterMonths` at :298, `auditedBy` through `auditorsFee` at :200.


**Fix**

Three options; I'd take (b).

(a) Delete the second sentence of `REBATE.note` (src/engine/content/incorporation.ts:208-209). One line, no reader moves, and the screen stops promising money. Cheapest and fully honest, but it throws away a real lever the research supplies.

(b) Declare the audience and wire it — this is the one I'd recommend, because it is a genuine decision (make it for children, get the higher rate with no size test, at whatever it costs you at the sale) and the plumbing is four lines, not four files:
  1. Add `forUnder18?: boolean` (or better `audience?: 'general' | 'under18'`) to `Project` in src/engine/domain/company.ts, set by `company.develop` in src/engine/world/company.ts:747 (widen the payload type and the object literal at :761-772).
  2. Short-circuit `rateFor` in src/engine/world/rebate.ts:187-190: `if (project.audience === 'under18') return REBATE.higherShare;` before the `shortOnFor` call.
  3. Fix the two places that DUPLICATE `rateFor` inline instead of calling it — src/engine/world/rebate.ts:250-251 (`applyForRebate`) and :384-385 (`whereTheClaimStands`) both recompute `short.length === 0 ? REBATE.higherShare : REBATE.share`. Collapse both onto `rateFor` while you are there; that removes the drift risk the file's own header warns about ("one legislated test and not two implementations of it drifting apart").
  4. Teach the five-limb table at src/ui/workspaces/BusinessWorkspace.tsx:740-832 a "not applicable" state, since it currently prints "Miss any one of them and the claim goes in at 25%" — which would become false.
Note `tierFor` in src/engine/world/lot.ts:870-886 (the foreign-enquiry side) does NOT need this: an `Enquiry` is a stranger's production and the save never knows its audience.

(c) Make it a first-class content fact rather than a boolean — hang the audience off the Holding (the rights) rather than the Project, so a children's property carries it wherever it is made. More correct, more surface: `company.option` at src/engine/world/company.ts:669 and the holding look at src/ui/looks/business.tsx would both need it.


**Risk**

Whichever way: `REBATE.note` is read at exactly one place, src/ui/looks/business.tsx:950. `REBATE.higherShare` is read at src/engine/world/rebate.ts:189/251/385, src/engine/world/lot.ts:886, and src/ui/workspaces/BusinessWorkspace.tsx:814.
If you wire it: the rate is STAMPED at application time (`project.rebate = { appliedAt, shareAt }`, src/engine/world/rebate.ts:252) and `payTheClaim` at :323 pays `certified * claim.shareAt` without re-asking — so an audience declared after the application changes nothing, which is correct and worth keeping. `worthToday` (:196) reads `project.rebate?.shareAt ?? rateFor(...)` and would follow automatically.
There is a test that pins the count of limbs to three places (fields on `higherNeeds`, `LIMB_LABELS`, what `shortOn` can push) — see the comment at src/engine/content/rebate.ts:104-112. An unconditional bypass must not change that count, so put it in `rateFor`, not in `shortOn`.


**What the adversary added**

RECOMMENDED (MECHANICAL, one clause, no reader moves): amend the second sentence of `REBATE.note` at src/engine/content/incorporation.ts:208-209 so it follows the field's own provenance convention — state the published fact AND what SLATE does with it. E.g. "...to work made for audiences of eighteen and under, which SLATE does not model: no picture here declares an audience." That restores exactly the shape the note carried before 998cf87 and that geography.ts:506 still carries. Nothing reads `REBATE.note` except src/ui/looks/business.tsx:950 (rendered dim at src/ui/looks/Look.tsx:126), and no test asserts it, so the blast radius is one dim line of text.

BUNDLE WITH IT (same MECHANICAL class, same doc block, missed by the other auditor): fix the stale header at src/engine/content/incorporation.ts:169-172. "SLATE uses the lower figure and says so rather than printing a number it cannot stand behind" has been false since 998cf87 — `higherShare: 0.35` is live at src/engine/world/rebate.ts:189 and printed at src/ui/workspaces/BusinessWorkspace.tsx:852. Rewrite it to say both rates are implemented and the higher one is earned through `higherNeeds`.

UNBUNDLE AND DO ANYWAY (independent MECHANICAL cleanup, correct regardless of the audience question): src/engine/world/rebate.ts has THREE implementations of one rule — `rateFor` at :188-189, `applyForRebate` at :250-251, `whereTheClaimStands` at :384-385 — each spelling `short.length === 0 ? REBATE.higherShare : REBATE.share`. The file's own header warns against "two implementations of it drifting apart". Do NOT collapse them onto `rateFor` as the other auditor proposes: `applyForRebate` still needs `short` for its notification body at :258-262, and `whereTheClaimStands` needs it at :385-388, so calling `rateFor` would run `shortOnFor` twice in both. Add `export function rateOf(short: (keyof Limbs)[]): number` and have all three call it, with `rateFor` becoming `rateOf(shortOnFor(...))`.

DO NOT DO NOW (this is a FEATURE, not the fix): the other auditor's option (b), adding `audience?: 'general' | 'under18'` to `Project` and short-circuiting `rateFor`. It is a defensible want and my probe shows it would be a big lever — from €3m to €5m the ONLY short limb is `crew`, and the 25% band runs to ~€5.5m, so under-18 would be the only 35% path for every picture a first-decade player can finance. But it is new game design on top of a note that first has to stop lying, and it drags four more surfaces with it: the `company.develop` payload and object literal (src/engine/world/company.ts:761-772), the five-limb table's "Miss any one of them and the claim goes in at 25%" line (src/ui/workspaces/BusinessWorkspace.tsx:870, which would become false and needs a not-applicable state), the `shareAt`-is-stamped invariant asserted at tests/rebate.test.ts:460-465, and a decision about whether the audience hangs off the Project or the Holding. Raise it as a DEPTH.md item, not as a defect fix. Their note that `tierFor` (src/engine/world/lot.ts:870-886) does not need it is correct — an `Enquiry` is a stranger's production and carries no audience field.

RISK if the note is amended: none beyond the one dim provenance line. `REBATE.note` has exactly one reader. RISK if `rateOf` is introduced: the three call sites above plus tests/rebate.test.ts:309-326, :359-360, :460-465, :526, :545-546, which assert `rateFor` and `shortOnFor` directly and should be unaffected; `tierFor` in lot.ts shares only `shortOn` from content/rebate.ts and is untouched. Tree is green today (`npm run typecheck` passes clean).


## Deletions — the honest fix is removing the declaration (7)

A declared word with nothing that reads it is worse than no word at all.


### Audition.took is written and read by nothing. Grep for .took across src/.

**Cluster** `audition-life` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/world/audition.ts`, `/home/user/1221/src/engine/domain/model.ts`


**Evidence**

CONFIRMED, exactly as stated. Complete census of `.took` across src/:

WRITE (one, the only one): src/engine/world/audition.ts:472
    audition.took = taking.howFar;
  The very next line uses the PARAMETER, not the field:
    audition.played = afterTheNote(readingOf(audition.played), audition.wants, audition.note, taking.howFar);
  So deleting line 472 changes no outcome whatsoever.

DECLARATION: src/engine/domain/model.ts:1038 - /** How far the player took it, by content/audition.ts id. */  took?: string;

READ: none. Every other `.took` in the tree is a different field on a different type:
- src/engine/world/casting.ts:576-578, 593, 601-602, 609, 621-622, 819, 976, 1150 - OfferAnswer.took: boolean, the offer/haggle discriminant.
- src/engine/decided.ts:467 `if (answer.took)` - same OfferAnswer.
- src/engine/world/selling.ts:166, 181, 399 - Split.took: Record<TierId, Money>, the waterfall.
- src/ui/looks/business.tsx:771 split.took[tier.id] - selling's.
UI: src/ui/workspaces/AuditionsWorkspace.tsx never mentions `took`. Its "What Came Of It" table (lines 97-108) renders holder / size / whyById(one.why) / feeCents. The sibling field `way` IS read - audition.ts:679 wayById(audition.way ?? '') decides whether a note is given - which makes `took` the odd one out rather than part of a pattern.
Tests: no Audition `.took` anywhere in /home/user/1221/tests (the casting.test.ts hits are OfferAnswer). No hits in src/base44/ or src/server/.

PROBE. 25-year unplayed save: `rows with .took set: 0`. Stale-note probe, where the note WAS answered: `state over why cast took full` - populated with 'full', and nothing anywhere consumes it.

Falsifiability: edit `took` from 'full' to 'over' in a save by hand and nothing in the engine or the UI moves. A declared word with nothing that reads it - THE ONE RULE, verbatim.


**Fix**

Delete both sites:
1. src/engine/domain/model.ts:1037-1038 - remove the doc comment and `took?: string;` from interface Audition.
2. src/engine/world/audition.ts:472 - remove `audition.took = taking.howFar;`. The line below already uses taking.howFar directly, so takeTheNote behaves identically.

IF THE OWNER WANTS TO KEEP IT, keeping it requires making it load-bearing, not displaying it. A column in AuditionsWorkspace's "What Came Of It" table would be cosmetic and still fail the falsifiability test. The only version that earns the field is a real term: a holder remembers being over-taken. Concretely, give remembersYou (audition.ts:105-119) a fourth term counting readFor(sim, holder).filter((o) => o.took === 'over').length against it - over-taking is exactly what HOW_FAR (content/audition.ts:192-197) says "throws away whatever made them ask", and nothing currently punishes it beyond the single roll it already lost. That is a FEATURE and should be scoped as one. DELETE is the right answer for this pass.


**Risk**

Almost none.
- `took` is optional (took?: string), so removing it from the interface cannot break a load: old saves carrying the field typecheck fine as excess JSON. src/engine/index.ts:328 only does record('auditions', ...) - it registers the table, it does not enumerate fields.
- migrate() (index.ts:292) and validateUniverse() (index.ts:579) do not name `took`; `auditions` appears in index.ts exactly once, at line 328.
- No test asserts on it.
- The one hazard: a blind pattern delete would also hit OfferAnswer.took (world/casting.ts, decided.ts:467) and Split.took (world/selling.ts, ui/looks/business.tsx:771), both live and load-bearing. Delete by the two exact line references above, not by grep-and-sed.


**What the adversary added**

DELETE, but scope it as the PAIR, not as their two-line edit.

1. src/engine/world/audition.ts:570 — remove `audition.took = taking.howFar;`. Line 578 already uses `taking.howFar` directly, so takeTheNote is identical.
2. src/engine/world/audition.ts:576-577 — `heard` needs a decision in the same breath. `const roll = sim.rng('audition','heard',audition.id).next();` MUST STAY: roll is passed to afterTheNote at line 578 and is load-bearing (it decides whether the note was taken in the right direction — tests/audition.test.ts:663-679 "turns the move the wrong way when the room was misread"). Only the assignment `audition.heard = roll < sure;` is dead. Delete that assignment, not the roll.
3. src/engine/domain/model.ts:1031-1032 — remove the doc comment and `took?: string;`.
4. src/engine/domain/model.ts:1033-1042 — remove `heard?: boolean;` and its comment, or keep it and file it. Do not leave it unexamined; it was born write-only today.
5. docs/UNBITTEN.md:332 — strike the entry, and correct the ledger's framing while there: it says "read by nothing", which is true, but the ledger is silent on `heard`, which is the same defect one field away.

IF THE OWNER WANTS THE ROOM'S RECORD KEPT (this is the only defensible keep, and it is a DESIGN_DECISION the owner makes, not a display tweak): the sentence `heard`'s comment already writes — "a no you can open and find out you misheard is a different no from a no you played right" — is a real product claim and NOTHING renders it. The honest version is one change, not two: AuditionsWorkspace's "What Came Of It" table (lines 93-110) gains a row-expand that says what you were told, how far you went, and whether you took it in. That makes `heard` load-bearing on a screen. It does NOT rescue `took`, because `took` is recoverable from `played` and `note` and carries no information the row does not already hold — which is exactly why it is the one to delete and `heard` is the one to argue about.

DO NOT take their remembersYou suggestion as written: `o.took === 'over'` matches no id at HEAD. If over-taking is to be remembered, the term must recompute overshoot (|played[shade] - wants[shade]| after the move, past zero) — it cannot read `took`.

ALSO FIX, separately and first, because it is a live regression and this one is not cosmetic: tests/audition.test.ts:109 `howFar = 'full'` -> `'good'`, and line 469 `'full'` -> `'good'`. Right now the note is never taken in the flagship attribute-invariance test at 456-473 or the note test at 555-568, and the suite is green anyway.


### `canWorkIn` has no reader at all.

**Cluster** `quote-fees` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `src/engine/domain/citizenship.ts`, `src/engine/world/casting.ts`, `src/engine/content/casting.ts`, `src/engine/content/geography.ts`, `src/ui/creation/CharacterCreation.tsx`


**Evidence**

src/engine/domain/citizenship.ts:48 `export function canWorkIn(person: Citizen, cityId: string): boolean`. Grep across the tree returns three source hits: the definition at :48, one internal call at :56 inside `workRefusalFor`, and tests/citizenship.test.ts. Grep for `workRefusalFor` returns the definition at :55 and tests only — zero callers in src/. It is a dead PAIR, not a single dead function: `canWorkIn` -> `workRefusalFor` -> nothing. Of the module's five exports, `citizenshipLabel` is read by src/ui/creation/CharacterCreation.tsx:990 and `isCitizenOf` by src/engine/world/casting.ts:872 (`globalRuleOne`); the other two are read by tests only.

The file's own docstring at citizenship.ts:9-13 claims this is the fix for exactly this fault: "the creation step has always said citizenship 'affects where you can work without arrangement', and until now nothing read it. A label that promises a rule the game does not have is worse than no label, so here is the rule." The rule is written and never asked.

PROBE /tmp/probe/citizen.mjs — a EUR 20m feature greenlit and run to delivery, all 21 parts cast, every seated performer tested against the city the picture shoots in:
```
  CAST   Elin Sveinsdottir      holds uk | EUR 263415 | canWorkIn(Reykjavik) = false
        workRefusalFor says: "You aren't a citizen of Iceland, and you hold United Kingdom.
        Taking that work needs an arrangement nobody has made."
  CAST   Bryndis Arnadottir     holds se | EUR 263415 | canWorkIn(Reykjavik) = false
  CAST   Sveinn Olafsson        holds se | EUR 263415 | canWorkIn(Reykjavik) = false
  CAST   Gunnar Egilsson        holds uk | EUR 263415 | canWorkIn(Reykjavik) = false
  CAST   Gudrun Halldorsdottir  holds dk | EUR  26341 | canWorkIn(Reykjavik) = false
  CAST   Thora Palsdottir       holds se | EUR  26341 | canWorkIn(Reykjavik) = false
  -> 6 of 21 people cast on an Icelandic picture cannot legally work in Iceland
```
All six were engaged, paid, and had flights and per diem posted by `payToBringThem` (casting.ts:906-920) without the rule being consulted once. The function returns the right answer; nobody asks it.


**Fix**

Do NOT simply wire `canWorkIn` into `castSomebody` as written — it would be wrong and it contradicts the casting content. `canWorkIn` (citizenship.ts:44-52) says "Holding the passport is the whole test", which is false for the EEA: Iceland, Denmark and Sweden are all in it, so a Dane needs no arrangement. src/engine/content/casting.ts:165-167 says so in as many words — "a good number are Nordic and come without much fuss, and the English-speaking world is a long way away in every sense" — and the `reaches`/`travel` figures in WHERE_FROM are built on that. Three options:

(1) DELETE. Remove `canWorkIn` and `workRefusalFor` from src/engine/domain/citizenship.ts, drop tests/citizenship.test.ts:71-90, and strike the "affects where you can work without arrangement" promise from the creation step. Keep `citizenshipsOf`/`isCitizenOf`/`citizenshipLabel`, which have real readers.

(2) BUILD FREE MOVEMENT, THEN WIRE IT (recommended). Add a `bloc?: 'eea'` field to `Country` in src/engine/content/geography.ts:19-37 — it has no such field today, I checked — set it on is/dk/se/no/fi and not on uk/us; change `canWorkIn` to return true when the person holds any passport in the city's country's bloc; then call it from `castSomebody` immediately after the `globalRuleOne` check at casting.ts:794-795, returning `workRefusalFor(person, <shoot city>)`. Britain and America then need an arrangement and the Nordics do not, which is both legally right and exactly the shape content/casting.ts already describes, and it gives the American arm a second reason to exist beyond SAG-AFTRA.

(3) MAKE IT A COST, NOT A BAR. Same bloc data, but a non-EEA hire adds a permit fee and a lead time instead of a refusal. More game, more work.

Option 2 is the one that makes the module docstring true.


**Risk**

A bar in `castSomebody` removes 38% of the cast pile on the probe save (6 of 21 seats) unless WHERE_FROM is rebalanced — `weight` totals 100 across five origins with uk+us at 16, and barring them shifts every draw in `putItOut`. `theOfficeFills` does NOT call `castSomebody`; it pushes straight to `project.cast` at casting.ts:1161, so the office would still hire barred foreigners unless the check is added there too — the same asymmetry the comment at casting.ts:1138-1146 was written to close for `decideOffer`. `payToBringThem` (casting.ts:906) and its `notSpentHereCents` accumulator (:919) stop firing for barred origins, which changes `certifiable`/`awayOnTheCast` in world/rebate.ts:100 and therefore the reimbursement certificate. `globalRuleOne` (casting.ts:869-882) already bars Americans when the arm is unsigned, so option 2 double-bars Americans — decide which message wins. tests/citizenship.test.ts:71-90 pins passport-only semantics and needs rewriting under option 2.


**What the adversary added**

RECOMMENDED — DELETE, which is their option (1) minus the step that is already done.

1. Remove `canWorkIn` (src/engine/domain/citizenship.ts:44-52) and `workRefusalFor` (:54-63). Keep `citizenshipsOf`, `isCitizenOf`, `countryOfCity` and `citizenshipLabel` — the first two are read by `globalRuleOne` (src/engine/world/casting.ts:872) and CharacterCreation.tsx:991, and `countryOfCity` is a one-line gazetteer lookup the rewritten docstring can justify or drop with them.
2. Rewrite the module docstring at citizenship.ts:1-13. It currently justifies the module by a creation-step promise that no longer exists. The honest replacement: two passports are a fact the save has to be able to hold, they are shown on the creation review line, and the only rule anybody asks about a passport is Global Rule One, which lives in casting.ts and reads `isCitizenOf`.
3. Delete tests/citizenship.test.ts:64-92 (the whole `describe('where that lets them work')` block, 5 tests) and drop `canWorkIn`/`workRefusalFor` from the import at :26. Keep :40-62, :94-126 — they test facts that are still live. Rewrite the test-file header at :1-20, whose "the field, the picker and the display are all live" is now false: the picker is gone and tests/citizenship.test.ts:117-126 enforces that it stays gone.
4. Do NOT touch CharacterCreation.tsx. There is nothing there to strike.

WHY DELETE RATHER THAN BUILD. The player is always Icelandic, every unit is based on the family lot in Iceland, crew and family inherit the player's passport, Americans are already stopped by `globalRuleOne` at two call sites, and dk/se/no are EEA. The entire behavioural yield of building the feature is "Britons cannot be cast" — and that costs you the `uk` row of WHERE_FROM (casting.ts:187-190) and the `us` row (:191-194), whose `reaches` and `travel` figures become numbers nothing can ever spend. You would be manufacturing two dead declarations to retire one. The falsifiability test already passes for "where somebody is from": move `travel` on any WHERE_FROM row and `bringingThemCents` moves the company's cash and `project.notSpentHereCents`, which moves the rebate. What is dead is the legal-permission layer specifically, and the game has no place to stand where it would bite.

IF THE OWNER WANTS THE FEATURE ANYWAY, build option (3), not (2). Add `bloc?: 'eea'` to `Country` (src/engine/content/geography.ts:19-37 — confirmed: no such field today, and `COUNTRIES.get('is')` has keys id,name,aliases,type,iso2,currency,currencyName,jurisdictionCode,drivesOn,capital,continent,population,areaKm2,phone,languages,source,confidence,version), set it on is/dk/se/no/fi, then charge a permit fee and a lead time on a non-EEA hire inside `payToBringThem` rather than refusing at `castSomebody`. A cost keeps the uk and us rows reachable, keeps `castFrom(sim, id, 'uk')` working so tests/rebate.test.ts:213 and :250 stay green, and gives the permit somewhere to show up in the ledger — and since the permit is bought abroad it belongs in `notSpentHereCents` alongside the flights, which is a second real consequence for free. Option (2) as they wrote it is the one to avoid.


### RATE_SHARE.hold is dead. DEPTH.md records this one as fixed; only the prep third of it was. (part 2 of 2)

**Cluster** `money-time` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/content/lot.ts`, `/home/user/1221/src/engine/domain/model.ts`, `/home/user/1221/src/engine/world/lot.ts`, `/home/user/1221/src/engine/content/making.ts`, `/home/user/1221/src/engine/world/making.ts`, `/home/user/1221/docs/DEPTH.md`


**Evidence**

src/engine/content/lot.ts:410:
    export const RATE_SHARE = { shooting: 1, prep: 0.6, hold: 0.35 } as const;

Every RATE_SHARE reference in the repo: lot.ts:196 (rateFor, generic index), lot.ts:971 (`RATE_SHARE.prep`), tests/lot.test.ts:371 (`RATE_SHARE.prep`). Every rateFor call site in src/: making.ts:267 'shooting'; lot.ts:129 'shooting'; lot.ts:910 'shooting'; lot.ts:962 'shooting'; lot.ts:963 'prep'; lot.ts:971 'prep'. Nothing anywhere passes 'hold'.

Every place a Booking is written: lot.ts:991/992/994 ('prep','shooting','prep'), making.ts:253 ('shooting'), decided.ts:229 ('shooting', a throwaway probe row deleted four lines later). PROBE confirms: `kinds written across the whole engine so far: [ 'prep', 'shooting' ]`. rateFor(Askja,'hold') computes 3,150,000c and nothing asks.

So yes: 'hold' is a BookingKind nothing ever writes, and 0.35 is a price nothing ever quotes.

DEPTH.md:718-721 records it in the past tense, i.e. as fixed:
    "Two thirds of `RATE_SHARE` had the same problem — prep and hold rates,
     declared, commented, and never asked for, because all three call sites
     passed `'shooting'`."
The ledger's reading is exact: prep got a reader, hold did not.

IS THERE ANY SOURCE FOR A HOLD? No.
- Enquiry (content/lot.ts:631-655) carries kind / from / needsSqm / needsHeightM / needsTank / weeks / spendIsk / local. No dark days, no standing-set weeks.
- AROUND_THE_SHOOT (content/lot.ts:427-432) has prep and strike only, for all four kinds.
- Every `holds:` in content/making.ts is 'prep' (lines 261, 325, 425) or 'shooting' (272, 336, 435).
No enquiry shape and no plan period holds a standing set on a dark day. The third rate has no input to price.


**Fix**

Three options; the first is DELETE and the second is the one the content is already asking for.
(a) DELETE. Drop `hold` from RATE_SHARE (content/lot.ts:410) and from BookingKind (domain/model.ts:472), and cut the third clause of the RATE_SHARE docstring — "and pays a lower one again to hold a standing set on a dark day" (content/lot.ts:407-408). Zero outcome change. This is the honest minimum under THE ONE RULE.
(b) FEATURE — give it a real reader from content that already exists. content/making.ts:317-323 says the returning series' prep is "Standing sets go up on a stage the show will hold for the whole run", and its post period (`runsWith: 'shooting'`, per 1.6) finishes after wrap while those sets are still standing but nothing is shooting on them. Same for the unscripted season, whose post text says the cut "is still running months after everybody goes home" on an arena that is still rigged. Adding `holds: 'hold'` to SERIES.post and UNSCRIPTED.post gives the third rate its first reader at the price it is declared at, and makes the family's own show occupy a room a foreign unit wants — which content/making.ts:91-96 names as the whole reason the lot was worth building as a business.
(c) Give Enquiry dark weeks. Reject: nothing in the demand model would fill them, so it is a new number with no source — the fault this ledger exists to catch.
Recommend (b) if the owner wants the lot to bite (it changes outcomes and gives DEPTH.md's claim a true past tense); (a) otherwise. Do not leave it as is.


**Risk**

(b) is NOT a one-liner — three things move:
- making.ts:679-687 holdingWindow takes min/max over every period with a truthy `holds`, and making.ts:246-259 holdAStage then writes ONE booking of kind 'shooting' across that whole span at weekRateCents 0. Adding a hold to post would silently stretch that single 'shooting' row across months of post — which then counts in lot.ts:873 tierFor's `kind === 'shooting'` crew tally, shrinking the national crew pool foreign enquiries see and turning away bookings that should have been accepted. holdAStage must be split into per-period rows BEFORE (b) is safe.
- lot.ts:829-835 fitsOn / freeAcross would start refusing tenants across post. That is the intended effect, but it is a real revenue change: lot viability is pinned by tests/lot.test.ts's `fiveYears` fixture and by the break-even figure DEPTH.md quotes.
- making.ts:262-268 `foregone` charges rateFor(stage,'shooting') across the entire hold — and has ZERO callers anywhere in src/ or tests/ (only tests/calibration.test.ts:11 matches the word, in prose). It is itself a dead declaration, and (b) would make it wrong by a larger margin the day somebody wires it up. Worth its own ledger line.
(a) risks nothing: no UI reads booking.kind, and no test references RATE_SHARE.hold.


**What the adversary added**

Take option (a), DELETE, and take it completely — their version of (a) is one docstring short.

1. src/engine/content/lot.ts:434 — `export const RATE_SHARE = { shooting: 1, prep: 0.6, hold: 0.35 } as const;` drop the `hold` key.
2. src/engine/domain/model.ts:472 — `export type BookingKind = 'shooting' | 'prep' | 'hold';` drop `'hold'`. MUST happen in the same commit as (1): world/lot.ts:196 is `RATE_SHARE[kind]` with `kind: BookingKind`, so removing either one alone red-lines tsc.
3. src/engine/content/lot.ts:427-433 — cut the third clause of the RATE_SHARE docstring ("and pays a lower one again to hold a standing set on a dark day") and change "The three rates a stage is let at" to two.
4. src/engine/domain/model.ts:471 and 476-481 — THEY MISSED THIS ONE. Both the BookingKind one-liner ("shooting on a stage, getting ready, or holding it") and the Booking interface docstring ("holding a standing set on a dark day costs less again") assert the three-rate model. Leaving them is the same defect in a different file.

RISK, named:
- world/lot.ts:196 `rateFor` — the only generic index. Breaks if (1) and (2) are split.
- src/engine/content/making.ts:95 `holds?: BookingKind` — narrows harmlessly. Every `holds:` in that file is 'prep' (261, 325, 425) or 'shooting' (272, 336, 435). Confirmed by probe: series periods read [["prep","prep"],["shooting","shooting"],["post",null]].
- tests/lot.test.ts:375 reads `RATE_SHARE.prep` only. No test does an exhaustive switch on BookingKind. Nothing in tests/ passes 'hold' to anything.
- No save data at risk: `book` (lot.ts:972-996) and `holdAStage` (making.ts:244-259) are the only two writers of a Booking in src/ — decided.ts:229 is a throwaway probe row deleted four lines later — and 12 years of play writes zero 'hold' rows, so no migration is needed.
- world/lot.ts:874 (tierFor) and world/audition.ts:79 (shootingHere) filter `kind === 'shooting'`; occupancy at lot.ts:117-127 ignores kind entirely. None of the three can see the difference.

IF THE OWNER WANTS THE HOLD TO BE REAL INSTEAD, price it honestly — it is four changes, not two, and it is a FEATURE:
  (i) give `holdAStage` a `kind: BookingKind` parameter and pass `period.holds` through from making.ts:566;
  (ii) make `foregone` (making.ts:263) use `rateFor(stage, booking.kind)` instead of the hardcoded 'shooting', or the hold weeks are valued at the wrong rate — the defect option (b) would have shipped;
  (iii) then `holds: 'hold'` on SERIES.post / UNSCRIPTED.post actually reads the constant;
  (iv) budget for the knock-on: occupancy `taken`/`own` grow (lot.ts:113-114), which moves the screen text at lot.ts:572-574 and the break-even comparison at lot.ts:431/461, and tierFor at lot.ts:874 counts `kind === 'shooting'` WITHOUT excluding companyId — so lengthening an own-picture shooting window eats a foreign enquiry's rebate-tier crew supply. Probe measured the window going 9 -> 13 weeks on one series alone.
Do not do this unless the owner wants the lot to bite. Under THE ONE RULE the delete is the honest minimum, and it is the one I would ship.


### Four fields on every person, and the whole skill sheet — the scout's view is that deletion is the honest answer here rather than wiring, because the prodigy holds every skill at 100 and every other person at 5.

**Cluster** `person-fields` · **Severity** serious · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/domain/model.ts`, `/home/user/1221/src/engine/domain/skills.ts`, `/home/user/1221/src/engine/domain/attributes.ts`, `/home/user/1221/src/engine/world/bootstrap.ts`, `/home/user/1221/src/engine/world/family.ts`, `/home/user/1221/src/engine/world/casting.ts`, `/home/user/1221/src/engine/world/crew.ts`, `/home/user/1221/src/engine/index.ts`, `/home/user/1221/src/ui/creation/CharacterCreation.tsx`, `/home/user/1221/tests/family.test.ts`, `/home/user/1221/tests/premise.test.ts`, `/home/user/1221/tests/creation.test.ts`


**Evidence**

Confirmed, and understated by one field.

THE FOUR FIELDS. They are the four non-optional fields on `Person` (/home/user/1221/src/engine/domain/model.ts) that have a writer and no reader anywhere in src/ or tests/:
- `goals: string[]` (model.ts:147). Every occurrence in src is a write: bootstrap.ts:93 (the NewSaveConfig field), :167 (defaultConfig `['Make something that lasts']`), :398 (`goals: config.goals`), casting.ts:430 `goals: []`, crew.ts:234 `goals: []`, family.ts:189 `goals: []`. Zero readers. It is not even asked: `grep -n goals src/ui/creation/CharacterCreation.tsx` returns nothing, so no screen sets it either.
- `lifestyle: 'frugal'|'modest'|'comfortable'|'lavish'` (model.ts:148). A `<select>` at CharacterCreation.tsx:748-749 collects it, bootstrap.ts:399 copies it onto the player, family.ts:190 copies it to relatives, casting.ts:431 and crew.ts:235 hardcode 'modest'. Zero readers. The player is asked a question whose answer nothing opens.
- `background: string` (model.ts:149). A textarea at CharacterCreation.tsx:740-743, written at bootstrap.ts:400 and family.ts:191. Zero readers outside tests/creation.test.ts:112 and tests/family.test.ts:150-151, which only assert it round-trips.
- `creditScore: number` (model.ts:190). Written at bootstrap.ts:421 from WEALTH_PROFILE, copied at family.ts:203, hardcoded 600 at casting.ts:451 and crew.ts:253. The two apparent UI readers (CharacterCreation.tsx:940 and :1001) read `wealth.creditScore` off the WEALTH_PROFILE table, not off the person. Zero readers of `person.creditScore`. There is no credit, no lending and no interest rate that consults it.

A FIFTH the ledger misses: `goatTraits?: string[]` (model.ts:172). Exactly one write site in all of src — bootstrap.ts:416 — and exactly one reader in the whole repo, tests/premise.test.ts:299, which asserts the write happened. The creation screen's G.O.A.T. panel (CharacterCreation.tsx:782-794, :1067) reads GOAT_TRAITS from content/prodigy.ts, never the person's copy. It is optional rather than on every person, which is presumably why the scout's count stopped at four.

THE 100/5 CLAIM — VERIFIED BY PROBE. /tmp/probe-personfields.mjs and /tmp/probe-skills-long.mjs via `npx vite-node`:
    --- people: 3 ---
      1 person(s): base=100 of={} distinct=100
      2 person(s): base=5  of={} distinct=5
    people after 5 years: 3
      1x  prodigy=true  track=actor  distinct skill values=100  of-keys=0
      2x  prodigy=false track=actor  distinct skill values=5    of-keys=0
Exactly as claimed. `of` is empty on every sheet at boot and still empty after 1825 simulated days, so no skill ever moves for anybody. Source: emptySkillSheet(CEILING=100) at bootstrap.ts:289 for the player; emptySkillSheet() -> base 5 (skills.ts:113) at casting.ts:437, crew.ts:239, family.ts:196.

THE SHEET ITSELF IS UNREAD, not merely constant. /home/user/1221/src/engine/domain/skills.ts is 119 lines and 47 SKILLS. Grepping every caller across src/ and tests/: `SKILL_BY_ID` — zero. `SKILL_IDS` — zero. `skillsInDomain` — zero. `domainAverage` — zero. `level()` — one, tests/family.test.ts:123. `skillsOf` (attributes.ts:1411) and `effectiveSkills` (attributes.ts:1392) — zero callers outside their own declarations. The only production code that touches `person.skills` other than seeding is the save migration at index.ts:548-550, which folds the sheet into base+exceptions. So the skill sheet is declared, seeded, persisted, migrated, and read by nothing.

The One Rule test: change any input — there is no input. Nothing on any screen moves a skill, nothing in the engine reads one.


**Fix**

Delete, in one commit, and let tools/wired.mjs --bless take the new floor.
1. Remove `goals`, `lifestyle`, `background`, `creditScore` from `Person` (model.ts:147-149, :190) and from `NewSaveConfig` (bootstrap.ts:93-95). Drop the writes at bootstrap.ts:167, :398-400, :421; family.ts:189-191, :203; casting.ts:430-432, :451; crew.ts:234-236, :253. Remove the Lifestyle select (CharacterCreation.tsx:746-755) and the Where You Come From textarea (:739-745) from the Who You Are step. Keep `creditScore` inside WEALTH_PROFILE (bootstrap.ts:212-218) — the creation review reads it there and it is flavour on a screen, not a dial on a person.
2. Remove `goatTraits` from `Person` (model.ts:164-172) and the write at bootstrap.ts:416. content/prodigy.ts keeps GOAT_TRAITS; the creation screen already reads it from there, so the panel is untouched.
3. Delete src/engine/domain/skills.ts entirely and the `skills: SkillSheet` field on `Person` (model.ts:162). Drop the four `emptySkillSheet` call sites and their imports (bootstrap.ts:17/:288-289/:365/:410, casting.ts:56/:437, crew.ts:40/:239, family.ts:23/:196). Delete `skillsOf` and `effectiveSkills` from attributes.ts:1392-1420 — they have no callers either. Delete the `p.skills = fold(p.skills, 5)` half of the migration at index.ts:548-550, keeping the attributes half.
4. A save written by an older build will carry a stale `skills` object. The migration in index.ts already walks every person, so add one line there that deletes the key rather than folding it, so old saves shed the dead weight instead of persisting it forever.
The alternative — wiring the sheet — is the wrong answer for the reason the scout gives and for a second one: a 47-row sheet where one person is at 100 and everyone else is at 5 is dead by construction in the exact sense docs/UNBITTEN.md:20-23 defines, and no amount of reading it produces a decision.


**Risk**

Save-shape and test blast radius, all of it mechanical:
- tests/family.test.ts:123 asserts every relative's skill is `emptySkillSheet().base`; tests/premise.test.ts:94 asserts the player's; tests/cohesion.test.ts:348 touches `skills`; tests/premise.test.ts:299 asserts `goatTraits`; tests/creation.test.ts:111-112 asserts lifestyle and background round-trip; tests/family.test.ts:150-151 asserts background. All must be deleted with the fields, not adjusted.
- src/engine/persistence/base44.ts and tests/base44-contract.test.ts pin the persisted Person shape — check whether the adapter enumerates fields explicitly before assuming the delete is invisible there.
- SAVE_SCHEMA_VERSION in src/engine/index.ts must go up, or an old save deserialises into a Person with fields the type no longer declares.
- tools/wired.mjs check 5 walks `SaveUniverse` tables, not Person fields, so its numbers will not move; but docs/UNWIRED.json should still be re-blessed if anything else shifts, and docs/DEPTH.md / docs/UNBITTEN.md both narrate the skill sheet and will need the paragraph removed rather than left describing a deleted file.
- CharacterCreation's draft persistence (DRAFT_KEY, CharacterCreation.tsx:82) stores a serialised NewSaveConfig in localStorage; a half-filled draft from before the change will carry removed keys. `loadDraft` must tolerate extras, or a returning player's restored draft throws.


**What the adversary added**

I agree with DELETE and with serious. Their fix is right in outline and wrong in three specifics. Corrections, in the order they matter:

1. DROP THE `wired.mjs --bless` STEP — IT IS A NO-OP. I ran `node tools/wired.mjs`. Its six categories are Id namespaces (104), trait modifier keys (47), higher-is-worse guards (6), Reputation/Wellbeing dials (0), personality axes (3), save tables (0), totalling 160. `grep -n "skill\|goals\|lifestyle\|creditScore\|goatTraits" tools/wired.mjs` returns nothing. Person fields and the skill sheet are in none of its categories, so deleting all six moves the number by zero. There is nothing to bless. The ratchet that should move is the docs/UNBITTEN.md bullet at :351-353, which should be struck.

2. THE FIX BREAKS FIVE ASSERTIONS IN THREE TEST FILES AND NAMES NONE OF THEM. All three pass today (I ran `npx vitest run tests/creation.test.ts tests/family.test.ts tests/premise.test.ts` — 91 passed). The commit must delete these in the same change or it will not build:
   - tests/creation.test.ts:44 (the config literal carrying lifestyle/background), :111 `expect(p.lifestyle).toBe('lavish')`, :112 `expect(p.background).toBe('Raised on the lot.')`
   - tests/family.test.ts:23 (`import { SKILLS, emptySkillSheet, level }`) and :123 `for (const k of SKILLS) expect(level(person.skills, k.id)).toBe(emptySkillSheet().base)` — this is a compile-time break, not a soft one; also :147-151, the whole `it('writes each of them a background in sentences, like everybody else')` case
   - tests/premise.test.ts:28 (`import { SKILLS }`), :331 `expect(player.goatTraits?.sort()).toEqual(...)`, and :339-341, the whole `it('leaves the skill sheet as ordinary life, not five crafts')` case
   - tests/premise.test.ts:126 includes `skills:` in the actor/actress equality strip. Harmless — undefined on both sides — but tidy it out while there.

3. FIX THE LINE NUMBERS. Every one in their write-up is stale by ~8 lines because of today's commits. Actual, at HEAD 5671a3c: the player writes are bootstrap.ts:406 (goals), :407 (lifestyle), :408 (background), :424 (goatTraits), :429 (creditScore); WEALTH_PROFILE is :220-226 not :212-218; seedCapability is :296-298 not :288-289. model.ts:147-149, :162, :172, :190 are correct as given.

4. ONE EXTRA DELETION THEY DID NOT SPOT. `skillsOf` and `effectiveSkills` are worse than dead — `skillsOf` no longer typechecks against `Person` (TS2345). Delete both (attributes.ts:1392-1413). While there, check whether any TRAIT still declares `skillMods`; if nothing does, that key goes too, and unlike the rest THAT one is inside wired.mjs's "Trait modifier keys" category, so it is the only part of this change that would actually move the ratchet.

5. THEIR MIGRATION STEP 4 IS SOUND BUT NEEDS ONE CARE. index.ts:549-553 computes `wasFlat` from BOTH sheets: `typeof p.attributes?.base !== 'number' || typeof p.skills?.base !== 'number'`. Removing the skills half changes which old saves count as flat and therefore the `folded` tally and the step message "Folded N sheets down to a base and its exceptions." I checked — no test asserts that count or message (`grep -rn "Folded\|folded" tests/` finds only an unrelated comment at crew.test.ts:219), so the risk is low, but rewrite `wasFlat` to read attributes only rather than leaving the disjunction half-dangling.

THE ONE PLACE A REASONABLE OWNER COULD DISAGREE, which they flatten: `background` is not like the other five. It is generated prose — family.ts:191 writes `spec.background`, family.ts:126 comments that "Everybody else's background on the character sheet is prose," and family.test.ts:147-151 asserts it reads as real sentences. docs/drill-down-research.json:283 calls the character sheet "the largest body of unexposed simulation in the save," i.e. frames it as a missing screen rather than dead weight. So for this single field the honest options are render-it or delete-it, not only delete-it. I still land on delete, because prose on a screen changes the sentence and not the outcome, which is the exact thing the project's rule forbids — but if the owner wants a character-sheet screen, `background` is the one of the six worth keeping until that screen exists. The other five have no such defence: `goals` is not even asked (no occurrence in CharacterCreation.tsx), and `lifestyle` has no system to wire into.


### 366 lines of domain/model.ts are record shapes with no table, no importer and no writer.

**Cluster** `unreachable` · **Severity** serious · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/domain/model.ts`, `/home/user/1221/src/engine/index.ts`, `/home/user/1221/src/engine/core/audit.ts`


**Evidence**

Verified by script: parsed every `export interface|type|const` in domain/model.ts, computed each block's span including doc comment, counted internal cross-references, cross-checked against every `import ... from '.../domain/model'` in src, tests and tools.

THE COUNT IS ESSENTIALLY EXACT. Two contiguous dead regions:
  - lines 338-364 (27 lines): the `// Finance` section header, `BillFrequency` (342), `Bill` (344-364).
  - lines 500-839 (340 lines): unbroken, `Structure` through the end of `Running`.
Total 367 against a claimed 366. File is 1134 lines — 32% of the domain model.

Every name in those regions appears in ZERO import statements anywhere in the repo. The complete set of model.ts names anything imports is: Audition, Bond, Booking, BookingKind, DecisionItem, EstateRole, Household, Id, Notification, PREMISE_STATEMENT, Person, Personality, Premise, Property, QuotaYear, Reputation, SAVE_SCHEMA_VERSION, SaveMeta, SaveUniverse, SoundStage, Wellbeing, bondKey. Nothing else.

NO TABLE: `SaveUniverse` (model.ts:1039-1133) has no `bills`, `structures`, `rooms`, `zones`, `vehicles`, `costumes`, `orders`, `teeth`, `training`, `marks` or `running` field. NO IMPORTER: `validateUniverse` (index.ts:311-342) enumerates every persisted collection by name — decisions, bookings, stages, audits, history and twenty more — and names none of these. NO WRITER: zero assignments anywhere.

BIGGEST OFFENDERS, lines including doc comments:
  1. The vehicle cluster, 116 lines, model.ts:542-661. `Vehicle` alone is 75 (587-661) with `vin`, `mileage`, `mechanicalHealth`, `loanAccountId`, `leaseMileageCap`, `insurancePolicyId`; plus `VehicleKeeping` 15 (571-585), `KeepingKind` 11 (559-569), `VehicleConfiguration` 9 (542-550), `VehicleKind` 6 (552-557). `VehicleKeeping` carries a 6-line doc comment about marina berths and dry stacks, in a game set on one Icelandic estate.
  2. `Running` 46 (794-839) + `Mark` 14 (779-792) = 60 lines of track-and-field records under a `// Track` header, in an actor simulator. `Mark` is referenced only by `Running.bests`/`Running.seasonBests` — a dead type pointed at by a dead type.
  3. `Costume` 47 (663-709).
  4. The building cluster, 37 lines (500-536): `Structure` 12, `Room` 15, `Zone` 8. This one has a live tentacle — `Property.structureIds` (model.ts:377-419) is written as `structureIds: []` at index.ts:182 on every new save and never appended to, so every save file carries an empty array pointing at a table that does not exist.
  5. `Order` 25 (711-735), `Training` 24 (750-773), `Bill` + `BillFrequency` 23 (342-364), `Teeth` 12 (737-748).

UNDERSTATEMENT: the ledger counts only model.ts. `HistoryCategory` at core/audit.ts:61-63 still enumerates 'vehicle', 'education' and 'health' — categories for these dead shapes. And `Property.structureIds` is a live field in a live table whose only possible values reference a deleted world.

STALENESS CHECK: model.ts is dirty in the working tree, but `git diff` touches only `Audition` (~line 1023, adding `heard?: boolean`), below both dead regions. The line numbers above are stable.


**Fix**

Delete lines 338-364 and 500-839 of /home/user/1221/src/engine/domain/model.ts outright. Both regions are contiguous, neither contains a live declaration, and nothing imports any name in them — 367 lines, two cuts, no call-site churn. `npm run typecheck` is the whole verification and it cannot fail: the only internal references inside these regions are orphans pointing at orphans (Vehicle→VehicleConfiguration/VehicleKeeping/VehicleKind, VehicleKeeping→KeepingKind, Running→Mark, Bill→BillFrequency).

Then the two tentacles, which are the part that is not free:
  1. Remove `structureIds` from `Property` (model.ts:377-419) and the `structureIds: []` literal at index.ts:182. That changes a persisted record's shape, so bump `SAVE_SCHEMA_VERSION` (model.ts:905, now 78) and add a delete step in `validateUniverse`. Alternative: leave the field on stored data and just stop declaring it. I'd bump — the schema already migrates far messier things.
  2. Trim `HistoryCategory` (core/audit.ts:61-63) to categories anything can actually produce — but see the audit-trail finding; that union may be going away wholesale.

Do not wire any of these. There is no lot for cars, no room system, no track meet and no bill schedule; each would be a new subsystem, not a fix.


**Risk**

- Genuinely low. No production code imports any deleted name, so nothing moves at runtime.
- `Property.structureIds` is the one real edge: written once per save at index.ts:182 and present in every existing save file. Dropping the declaration without a migration leaves a stray key in stored JSON, which `validateUniverse` tolerates (index.ts:311-316 only ADDS missing collections) but which shows up in save-diff tooling.
- /home/user/1221/tools/inventory.mjs and docs/COVERAGE-MATRIX.md are generated from source; regenerate after the cut.
- base44/shared/guard.js validates the premise server-side and touches none of these shapes.
- Nothing in tests/ or tools/ references any deleted name (checked).


**What the adversary added**

THEIR FIX IS RIGHT ON THE MAIN BODY, BUT TENTACLE 1 IS INCOMPLETE — the one correction that matters.

`structureIds: []` is written at TWO sites, not one:
  - /home/user/1221/src/engine/index.ts:184   (they said 182 — off by two)
  - /home/user/1221/src/engine/world/lot.ts:236   (THEY MISSED THIS ENTIRELY)
lot.ts:236 sits in the studio-lot property literal (`marketValue: BUILD_COST_CENTS, condition: 100, annualPropertyTaxRate: 0, structureIds: [], isPrimaryResidence: false`). Follow their instructions literally — remove the field from `Property` plus the single literal they name — and typecheck FAILS on lot.ts:236 with an excess-property error. My probe confirms both sites are live: a booted save has two properties, `prop_00000e | house` and `prop_00000p | studio_lot`, and both carry `structureIds=[]`. Fix both call sites or neither.

FACTUAL ERRORS IN THEIR WRITE-UP (none change the verdict):
  - File is 1143 lines, not 1134. Their 32% happens to still be right.
  - Their STALENESS CHECK is backwards: model.ts is NOT dirty. `heard?: boolean` is real but sits at line 1042 and is already COMMITTED. The four dirty files are casting.ts, BusinessWorkspace.tsx, tests/casting.test.ts, tests/doors.ts. Their conclusion (line numbers stable) is right; their stated reason is not.
  - Region boundaries verified by hand: line 500 is `export interface Structure {`; lines 838-839 are `startedAt: Instant;` / `}` closing `Running`; line 841 is `export interface DecisionItem` (live). Both cuts are clean.

UNDERSTATED — three things they did not find:
  1. `HistoryCategory` is worse than they said. My probe collected every category actually produced after 400 sim days: `[]` — EMPTY. Not just 'vehicle'/'education'/'health' are unproducible; the entire 14-member union at core/audit.ts:61-63 is unproduced, because nothing writes to `history` at all. Their "that union may be going away wholesale" hedge is correct and should be firmed up.
  2. /home/user/1221/src/engine/core/ids.ts:32 still carries id prefixes for the same deleted world: `'running' | 'meet' | 'training' | 'season' | 'sroom' | 'school' | 'degree' | 'uniapp' | 'growing' | 'sitting'`. Harmless to the cut (bare string literals, not model references) but it belongs on the same sweep.
  3. The file incriminates itself twice. `Costume`'s doc comment opens: "A garment that does not exist yet." And model.ts:649-652 claims `upkeepBillId` was "Read once by the schema 39 migration and left alone after" — I grepped src for `upkeepBillId`, `crewBillId` and `schema 39`: the ONLY hits are those three lines in model.ts. No such migration exists anywhere. A dead field documented by a false claim about code that is not there.

RECOMMENDED SEQUENCE: (a) make the two cuts, run typecheck + vitest — proven green; (b) decide the `structureIds` question. They recommend bumping SAVE_SCHEMA_VERSION (model.ts:905, currently 78) and adding a delete step. Note that `validateUniverse` (index.ts:311-342) only ever CREATES missing collections, via its `record`/`list` helpers — it has no delete path today, so this is a genuinely new step, not a one-liner. Given `structureIds` is always `[]` on every save ever written, I would take their cheaper alternative instead: stop declaring the field, leave stored data alone, no schema bump.

RISK: essentially nil for the two cuts — nothing imports these names, no table exists, no writer exists, no string-keyed access exists, and 45 test files stay green. The only moving parts are the two `structureIds: []` literals above; repo-wide grep for `structureIds` returns exactly three occurrences, one declaration and those two writes. Docs under docs/research/ mention vehicles and costumes in prose and will read stale afterwards — a documentation chore, not a build risk.


### The ledger has an affordability primitive and an overdraft model, and the spend paths use them.

**Cluster** `balance` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/core/ledger.ts`, `/home/user/1221/src/engine/index.ts`, `/home/user/1221/tests/money.test.ts`, `/home/user/1221/tests/integrity.test.ts`


**Evidence**

NOT IN THE LEDGER. Four declared words in src/engine/core/ledger.ts that no production code reads:

- `Ledger.availableFunds(accountId)` (ledger.ts:171-182) — a complete, correct affordability primitive: it handles revolving credit, refuses a certificate's money before maturity, and adds the overdraft where cover is on. `grep -rn availableFunds src/` returns exactly one hit, its own definition. The only callers are tests/integrity.test.ts:28,44 and tests/money.test.ts:141. Thirteen money-out sites in src/engine/world/ ignore it.
- `Account.overdraftLimit` (ledger.ts:63), `Account.overdraftOptIn` (ledger.ts:65), `Account.inCoverSince` (ledger.ts:69) — `grep -rn 'overdraftLimit|overdraftOptIn|inCoverSince' src/` returns only ledger.ts:63, :65, :69 and :180. Nothing anywhere in src/ ever SETS them, so the `if (a.overdraftOptIn && a.overdraftLimit)` branch at ledger.ts:180 is unreachable in every save the game can produce. `inCoverSince` carries a docstring about charging a cover fee 'once an episode rather than once a day' — there is no fee anywhere in the tree.

This is the ONE RULE, exactly: the word for 'can this account stand it' is declared, documented, and read by nothing that decides anything.


**Fix**

Two halves.

DELETE: `Account.overdraftLimit`, `Account.overdraftOptIn` and `Account.inCoverSince` from the Account interface (ledger.ts:62-69), and the branch at ledger.ts:180 that reads them. Nothing writes them; the cover fee they exist for does not exist. If bank overdrafts are wanted later they are three lines to re-add.

WIRE, don't delete: `availableFunds`. Make it the thing the gate from finding 1 calls, so 'can this company stand it' has one implementation. If the owner decides the company's answer is `behindTheCompany()` (cash + patience) rather than the bank's answer, then `availableFunds` should be deleted too and `behindTheCompany` documented as the only affordability question in the game — but it should not stay as it is, a correct function two tests call and no player action does.


**Risk**

Deleting the three Account fields touches src/engine/persistence (the save shape) — check the migration path in src/engine/index.ts:292 `migrate`, since an existing save with those keys must not fail `validateUniverse` (index.ts:579). tests/money.test.ts:141 constructs an account with a creditLimit and asserts availableFunds — that survives. tests/integrity.test.ts:28,44 asserts availableFunds is unchanged across a reload — also survives. Nothing in src/ui reads any of the four.


**What the adversary added**

Three parts, in the order I would land them.

**A. DELETE the dead fields and the unreachable branch (mechanical, no judgement).** From the `Account` interface in src/engine/core/ledger.ts, remove all fourteen never-written optional fields — `originalPrincipal` (:49), `termMonthsRemaining` (:51), `monthlyPayment` (:52), `productId` (:61), `overdraftLimit` (:63), `overdraftOptIn` (:65), `withdrawalsThisMonth` (:67), `inCoverSince` (:69), `maturesAt` (:71), `interestEarned` (:73), `statementBalance` (:75), `statementAt` (:76), `paymentDueAt` (:77), `paidSinceStatement` (:79) — not just the three they named. Remove the branch at :180 and the certificate branch at :179 with them. Then remove the now-uncompilable dead UI branch at src/ui/looks/money.tsx:240-247 (the "Monthly Payment" stat), which is guarded on `a.monthlyPayment` and can never render. Keep `apr`, `category`, `creditLimit` — all three are genuinely written and read.

**B. DELETE `availableFunds` (ledger.ts:171-182), do not wire it.** I disagree with their recommendation. After (A) the function collapses to `kind is revolving ? max(0, limit + balance) : balance` — it is the credit-headroom formula wearing an affordability name. The affordability question the game actually asks is `behindTheCompany` (world/lot.ts:290, cash + `stillToCarry`), and the commit at HEAD established with measurements that the bank balance is the *wrong* answer for company spend paths. Delete `availableFunds`, and add one line to `behindTheCompany`'s docstring stating it is the only affordability question in the game, so the next auditor does not re-derive this.

  If the owner wants to keep a shared credit-headroom helper instead, the honest move is to rename it for what it is — `freeOnTheLine(accountId)` — and have src/ui/looks/money.tsx:168 and :227 call it, removing the two copy-pasted `Math.max(0, limit + a.balance)` expressions. That is defensible and I would not argue against it; what is not defensible is leaving a function named "available funds" that no spend path consults.

**C. Fix the two tests, do not delete their coverage silently.** tests/money.test.ts:127-142 ("reports available funds correctly for revolving credit") exists only to test this function; under option B it goes away, under the rename it moves to `freeOnTheLine`. tests/integrity.test.ts:28 and :44 use `availableFunds` purely as a balance readback on a checking account in the idempotency test — the meaning there is "the balance did not move", so change both to `sim.ledger.account(account).balance`. That is a one-word edit and the test gets *more* honest, since it currently asserts an affordability number where it means a balance.

**Do NOT do:** add a cash gate to `castSomebody` or any other company spend path. That breaks tests/casting.test.ts:1990 by construction.


### A season anchored on an airdate has no airdates.

**Cluster** `seasons-misc` · **Severity** minor · **Verdict** PARTLY_TRUE


**Files** `/home/user/1221/src/engine/domain/company.ts`, `/home/user/1221/src/engine/world/making.ts`, `/home/user/1221/src/engine/content/making.ts`, `/home/user/1221/src/ui/workspaces/BusinessWorkspace.tsx`, `/home/user/1221/src/engine/world/inventory.ts`


**Evidence**

Overstated at the season level, exactly right at the episode level.

WHICH PLANS USE WHICH ANCHOR — probe output from /tmp/probe/p1.mjs (`npx vite-node`):
  feature    | anchor= start    | cast= performers | basePeriod= shooting | deliveryWeeks= 6
  series     | anchor= start    | cast= performers | basePeriod= shooting | deliveryWeeks= 4
  unscripted | anchor= delivery | cast= undefined  | basePeriod= field    | deliveryWeeks= 2
Only UNSCRIPTED (src/engine/content/making.ts:403 `anchor: 'delivery'`) is delivery-anchored.

THE ANCHOR ITSELF IS FALSIFIABLE. `layOut` (src/engine/world/making.ts:164) does `const shift = plan.anchor === 'delivery' ? at - (work + plan.deliveryWeeks * MS_WEEK) : at;`. Probe /tmp/probe/p4.mjs moved the airdate and every period moved with it:
  airdate +52w = 2027-03-01  deliverBy=2027-03-01  field=2026-10-12  casting=2026-08-10
  airdate +78w = 2027-08-30  deliverBy=2027-08-30  field=2027-04-12  casting=2027-02-08
  airdate +104w = 2028-02-28 deliverBy=2028-02-28  field=2027-10-11  casting=2027-08-09
  near airdate (+10w) -> "A Format Season, Against An Airdate needs 29 weeks in front of that date and there are 10. Move it back 19 weeks."
The UI even names it: src/ui/workspaces/BusinessWorkspace.tsx:612 prints `plan?.anchor === 'delivery' ? 'The Transmission Date' : 'The First Day Of Prep'`, and :532 reads AIRDATE_WEEKS (52) vs LEAD_WEEKS (8). The season has one real, load-bearing airdate.

THE AIRDATE FIELD NOTHING WRITES is `Part.dueAt`, src/engine/domain/company.ts:344:
    /** When it transmits or is due, where the plan gives parts their own dates. */
    dueAt?: Instant;
Zero writers, zero readers. Repo-wide grep for `dueAt` outside node_modules/dist returns only `Decision.dueAt` (src/engine/domain/model.ts:858, written at src/engine/core/simulation.ts:650/664, read at src/engine/world/world.ts:100/132-136 and the attention/Home screens). The only place a Part is constructed is src/engine/world/making.ts:552-555, which writes `{ id, ordinal, seconds }` and nothing else; src/engine/world/maturity.ts:163 only ever attaches `maturity`.

PROBE /tmp/probe/p3.mjs, greenlighting the unscripted season:
  project.deliverBy = 2027-03-01
  ordinal 1..8  seconds 3600  dueAt = -   maturity undefined   (all eight)
Eight episodes of a broadcast season, all due on the same instant, none carrying a transmission date. No plan has any per-part date mechanism at all — `partsFinish: 'inOrder'` (src/engine/world/making.ts:587-600) staggers the per-part *ticks* across a period's span, but stores no date on the part.

How far off the ledger is: it says "no airdates" where the truth is "one airdate, which works; eight episode dates, which were declared and never written."


**Fix**

Delete `dueAt` from the `Part` interface at src/engine/domain/company.ts:344 (comment included). Nothing imports it, nothing persists it, typecheck will not move.

If the owner instead wants the thing the comment promises, that is a separate FEATURE and a real one: give `Plan` a transmission cadence (e.g. `transmits?: { fromDelivery: number; everyWeeks: number }` on the Plan interface in src/engine/content/making.ts), write `part.dueAt` in `greenlight` (src/engine/world/making.ts:552) alongside `seconds`, and give it a reader — the natural one is `willMakeIt` in src/engine/world/inventory.ts:199-211, which today measures the whole cut against one `window.to`. Per-episode dates would make a season that misses episode six's slot a different event from one that misses delivery, which is what the inventory module's own prose (src/engine/world/inventory.ts:150, :188) already claims is happening.

Do not do both halves half-way: either the field goes or it gets a reader.


**Risk**

Deleting: nothing. Verified no reader, no writer, no test, no persistence migration (src/engine/index.ts's save checks never touch it). The `Part` records are stored as plain objects inside `Project.parts`, so old saves carrying no `dueAt` are already the only shape that exists.

If instead you implement per-part dates: `finishesBy`, `pastTheWork`, `weeklyThrough` and `settleDelivery`'s late penalty (src/engine/world/making.ts:1279-1283) all key off `project.deliverBy`, and `willMakeIt` keys off the cutting period's `window.to`. Adding a second date axis means deciding which of those the LATE_PENALTY charges against.


**What the adversary added**

TAKE THEIR FIX. Delete src/engine/domain/company.ts:343-344 — the doc comment and `dueAt?: Instant;` — from `interface Part`, leaving `maturity` and `recut` untouched. Nothing imports it, nothing persists it, `Instant` stays used 27x in the file, typecheck and lint will not move, and `node tools/wired.mjs --check` is unaffected because that gate never reads company.ts.

Then correct the ledger rather than just striking it. docs/UNBITTEN.md:360 currently reads "**A season anchored on an airdate has no airdates.**" under "### Declared, and nothing reads it". That sentence is wrong twice over: the season has one airdate and it is load-bearing in cash (my probe: two weeks late costs €160,000 through `settleDelivery`). If the line survives at all it should read "`Part.dueAt` is declared on every episode and nothing writes or reads it", which is the true and much smaller claim.

DO NOT SPLIT THE DIFFERENCE. Their "either the field goes or it gets a reader" is the right frame, and the field going is the right half for this pass, because the reader half is a design with no owner yet: `willMakeIt` (src/engine/world/inventory.ts:193-205) measures the whole cut against one `window.to`, and giving it eight per-episode windows changes what "makes it" means for every unscripted season in every existing test, including tests/inventory.test.ts and tests/trouble.test.ts:298/338/381 which all measure lateness against the single `project.deliverBy`.

IF THE OWNER LATER WANTS THE FEATURE — and the research does ask for it, docs/research/KINDS.md:6101-6105 names the delivery buffer as "the real health metric of a broadcast season", buffer in days per episode — the shape is theirs and it is sound: a `transmits?: { fromDelivery: number; everyWeeks: number }` on `Plan` (src/engine/content/making.ts), written into `part.dueAt` in `greenlight` (src/engine/world/making.ts:552) beside `seconds`, and a second `project.delivery`-style scheduled item per part so a missed episode six is a different event from a missed season. That is a separate ticket with its own tests, not a reason to keep a dead line in the meantime.

RISK IF CHANGED — what actually moves: nothing. I checked each candidate. Persistence: src/engine/persistence/base44.ts has no Part field enumeration and `serialise`/`deserialise` in adapter.ts are structural, so old saves carrying no `dueAt` and new code lacking the field are identical. Tests: no test names `Part.dueAt`; tests/maturity.test.ts:210 reads only `ordinal`. UI: src/ui/looks/business.tsx:594-601 renders per-part rows from `rungOfPart`/`shareOfPart` and shows no date column, and BusinessWorkspace.tsx:978's Part table is the same. The gate: tools/wired.mjs reports 160 dead words from model.ts and id namespaces only; company.ts is out of its scope, so docs/UNWIRED.json needs no re-bless. The only thing lost is the comment, and the comment is the defect.


## Decisions — the owner chooses (19)

Several defensible answers. The options are laid out; none is taken here.


### The room's want is drawn from nothing, so the opening reading is a constant.

**Cluster** `audition-room` · **Severity** serious · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/world/audition.ts`, `/home/user/1221/src/engine/world/casting.ts`, `/home/user/1221/src/ui/workspaces/AuditionsWorkspace.tsx`, `/home/user/1221/src/engine/domain/model.ts`


**Evidence**

Both halves hold.

HALF ONE — the want reads no state. src/engine/world/audition.ts:185-192:

  export function whatTheyWant(next: () => number): Record<string, number> {
    const out: Record<string, number> = {};
    for (const shade of SHADES) out[shade.id] = Math.round((next() * 2 - 1) * FURTHEST);
    return out;
  }

Its only argument is a random source. Called once, at audition.ts:339, as `whatTheyWant(() => rng.next())`. It never sees the holder, the size, the shoot length, the country, the fee or the kind of production — none of which the Audition record lacks (audition.ts:341-350 carries holder, size, feeCents, from, to).

The twin function on the producer's side of the same engine DOES condition: src/engine/world/casting.ts:194-208, `whatItWants(sim, project, roleId, size)` centres each axis on `size.leans[axis.id]`. So this is not a house style; it is one of two symmetric functions built and the other not.

HALF TWO — the opening is therefore a constant. Probed every one of the 343 playable openings against the real want distribution (/tmp/probe-open.mjs). Empirical want marginal over 900k draws: -3 8.77%, -2 17.04%, -1 16.67%, 0 16.69%, 1 16.07%, 2 16.35%, 3 8.40% — symmetric about zero, identical for every part in the game. Ranked by E[cast] after taking the note All The Way:

  BEST   0,0,0   E[off raw] 1.5000  E[off after] 1.0602  E[cast] 0.7441
  next   0,-1,0 / 0,0,-1 / 0,0,1 / 0,1,0 / -1,0,0 (all)  E[cast] 0.7259
  WORST  -3,-3,-3 and every other corner              E[cast] 0.3368
  AS_WRITTEN {0,0,0} rank 1 of 343.

Same for a tape with no note ever given: {0,0,0} rank 1, E[cast] 0.6259 vs 0.6037 for the next best. So AS_WRITTEN is the UNIQUELY optimal opening, for both ways in, for every part, in every save — and src/ui/workspaces/AuditionsWorkspace.tsx:130 already initialises the sliders to exactly that. The default is the answer; every other position on the three sliders is strictly worse in expectation and nothing on the screen or in the save could ever tell you otherwise.

Live confirmation across three booted saves, 900 days each (/tmp/probe-live.mjs): 24 auditions, wants scattered with no relation to holder or length —
  an Icelandic agency, a commercial  weeks= 1 wants={warmth:3,size:-2,pace:1}
  an American studio, a feature      weeks=14 wants={warmth:2,size:2,pace:-2}
  RÚV, a limited series              weeks= 6 wants={warmth:-3,size:2,pace:0}
  RÚV, a limited series              weeks= 6 wants={warmth:1,size:2,pace:-1}
Two bookings from the same holder with the same length draw unrelated wants.

The ledger's wording is slightly loose in one place worth naming: the WANT is not a constant (it is a fresh draw per booking), and the opening is not FORCED. What is constant is the right answer. The falsifiability test is failed exactly: change the holder, the size, the length, the country or the fee — the optimal reading does not move. Three sliders, no readable input.

The code knows. src/engine/domain/model.ts:1012-1018 — "What the room wants, by shade id. Never shown and never derivable." AuditionsWorkspace.tsx:8-11 — "The page gives away nothing about what a room wants... which is not an omission — it is the whole of the first decision." It is asserted as a decision, and it is a decision with one answer known before the game starts.


**Fix**

Three options.

(A) RECOMMENDED — condition the want on the part, mirroring the function this engine already has. Give the audition's kind a lean over the three shades (a table in src/engine/content/audition.ts alongside SHADES, keyed off the size in content/casting.ts SIZES, or off a new `kind` on the Audition set in whatIsGoing from the booking) and change whatTheyWant to `whatTheyWant(next, leans)` centring each shade on the lean the way world/casting.ts:194-208 already does with `size.leans`. Then a commercial wants it quick and likeable and a limited series wants it held in, the sliders read the part instead of nothing, and the opening becomes a real decision that a player can get right or wrong. Cost: one table. The Audition already carries holder, size and length.

(B) Leave the want blind but LEAK something before the reading — add a `sides` string to the Audition drawn from the want in whatIsGoing ("the scene is a man losing an argument he started") and show it on the card in AuditionsWorkspace. Cheaper than (A), keeps the "nobody tells you anything" tone, and still turns the sliders into evidence-reading rather than a coin.

(C) DELETE — drop the three sliders, have goUpFor default played to AS_WRITTEN, and delete the `played` payload from GoingUp (audition.ts:400-404) and the slider block at AuditionsWorkspace.tsx:159-174. Admits that the first decision is not a decision. Honest but it removes the first of the three things content/audition.ts:26-34 says the whole file is for.

I'd ship (A), because the pattern is already in the repo, the data is already on the Audition, and it is the only option that makes the sliders load-bearing rather than either decorated or gone.


**Risk**

whatTheyWant has exactly two call sites: src/engine/world/audition.ts:339 and tests/audition.test.ts:676 (which calls it with a bare counter closure, so any signature change breaks that test).
The distribution change is the real risk. Centring the want on a lean lowers E[off] for a player who reads the part and raises it for one who ignores it, and `off` feeds decideAudition -> settle -> theyWantYou (audition.ts:582-614), which writes publicFame, industryDemand, professionalReputation and audienceAppeal. Those feed straight back into remembersYou (audition.ts:107-119) and believedOf (audition.ts:155-162), which gate whether an audition is created at all (whatIsGoing, audition.ts:335-336) and what size of part it is (sizeCasting, audition.ts:173-180) and therefore feeFor (audition.ts:135-140). The whole career curve moves.
TOO_FAR (content/audition.ts:213, 3.4) and CLOSE_ENOUGH (content/audition.ts:223, 1.2) were explicitly fitted against a flat want — content/audition.ts:206-211 — so both need re-fitting; the tests pinning them are tests/audition.test.ts:622-676 and the end-to-end cast-rate tests riding on playItOut (tests/audition.test.ts:107-121).
The page header comment at AuditionsWorkspace.tsx:8-11 and the model comment at domain/model.ts:1012-1018 both assert the want is underivable and must be rewritten, not left standing.
If the lean is keyed off `size`, note that in every save I booted every offered part was `size='day'` (believedOf starts at 0 by design after today's fix), so a size-keyed lean would be a single constant lean for the whole early game — key it off the production kind instead, or the variation will not exist where the player actually is.


**What the adversary added**

AGREE it needs fixing. DISAGREE with their recommendation — I probed their fix (A) and it does not do what they say.

I simulated (A) by centring each shade's want on a per-kind lean and re-running the same exhaustive optimal-policy enumeration:
  spread S=3 (lean + noise over the full range):
    lean 2,-1,2  -> best opening 1,-1,2 (lean itself rank 3)
    lean -1,-2,-1 -> best opening -1,-2,-1 (lean itself rank 1)
    lean 1,2,0   -> best opening 1,2,0 (lean itself rank 1)
  spread S=1.5 (tight):
    every kind saturates at E=0.82000 = AS_GOOD_AS_IT_GETS, with 16-18 openings tied.

So (A) at a wide spread just RELOCATES the constant: the best opening becomes the lean, one answer per kind, which a player memorises in a single save and then the sliders are a lookup table forever. That is an improvement on "one answer for the whole game" but it is not "a real decision that a player can get right or wrong". And (A) at a tight spread breaks it the other way — the note always rescues you, E[cast] pins at the 0.82 ceiling, many openings tie exactly, and the opening stops mattering at all. That directly contradicts the CLOSE_ENOUGH comment in content/audition.ts ("Most readings end in no, which is the research's own first sentence about the pass") and would inflate the whole ratchet through `theyWantYou` (publicFame, industryDemand, audienceAppeal, quotes) and the fee income. They name no spread, and the window between the two failures is narrow.

RECOMMEND (B) INSTEAD, which they under-rate. A `sides` string drawn from the ACTUAL per-booking want in `whatIsGoing` (src/engine/world/audition.ts:443-456, next to `wants: whatTheyWant(...)`) and shown on the card in `GoUpForm` moves the answer on EVERY audition, because the want is redrawn every booking — not once per kind. It needs no new content table, no change to `whatTheyWant`'s signature, and it is the only option of the three where the falsifiability test passes per-audition rather than per-category. Ship (B); ship (A) on top of it only if the owner also wants the kinds to feel different, and then pick the spread by re-running the enumeration rather than by eye.

(C) DELETE is honest and I would take it over shipping (A) alone, but it removes the first of the four decisions content/audition.ts:26-34 exists to hold, so it is a real loss.

RISK — what moves if you change this:
- `whatTheyWant(next)` is called with ONE argument at tests/audition.test.ts:739. Adding a second parameter must make it optional or that test fails to typecheck (`npm run typecheck` is tsc -b --noEmit).
- tests/audition.test.ts:148 and :201 build fixtures with `wants: AS_WRITTEN`; tests/audition.test.ts:712 pins `at(0)/100` to AS_GOOD_AS_IT_GETS. (B) touches none of them. (A) threatens :712 only indirectly, via cast-rate inflation.
- A `sides` field is a new key on the Audition interface at src/engine/domain/model.ts (~line 1012) — check whether the save has a version/shape test before adding it.
- Two comments become false under (B) and must be rewritten in the same commit: model.ts:1012-1018 ("Never shown and never derivable... A want the player could read off a screen would make the reading a lookup") and AuditionsWorkspace.tsx:8-11 ("The page gives away nothing about what a room wants... which is not an omission"). A leak is not a lookup, but the prose has to say so.
- One more reason not to key (A) off size: in all 24 live auditions across 6 saves the size came out 'day' every single time, because `believedOf` now starts at 0 (2d8ac44) and `sizeCasting` floors at the last SIZES row. A lean keyed off size would be keyed off a field that is constant for the first several years of a save.


### BONUS (not in the ledger, found while verifying claim 1): audition.took is a declared word with nothing that reads it.

**Cluster** `audition-room` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/domain/model.ts`, `/home/user/1221/src/engine/world/audition.ts`


**Evidence**

Declared at src/engine/domain/model.ts:1031-1032:

  /** How far the player took it, by `content/audition.ts` id. */
  took?: string;

Written at exactly one site, src/engine/world/audition.ts:472:

  audition.took = taking.howFar;

Grepped `took` across all of src/, tests/ and tools/ and filtered the unrelated homonyms (selling.ts `split.took`, casting.ts `answer.took`, estate.tsx local, plus a couple of dozen occurrences of the English past tense in prose comments). Zero readers of `audition.took`. It is not rendered in AuditionsWorkspace.tsx, not read by decided.ts, not in the base44 adapter, not asserted in tests/audition.test.ts. The player's second and last decision in the room is recorded and then never consulted by anything.

This is THE ONE RULE stated exactly. It is also the natural hook for fix (B) on claim 1 — the field the design already wanted and never wired.


**Fix**

Either delete it — remove `took?: string` from src/engine/domain/model.ts:1032 and the assignment at src/engine/world/audition.ts:472 — or give it a reader, which is fix option (B) on claim 1: have remembersYou (audition.ts:107-119) or believedOf (audition.ts:155-162) count readings where the player over-took or ignored the note differently from readings where they took it, so the sentence at content/audition.ts:185-190 ("over-taking loses the thing they liked enough to give you a second go") is true of something. Do not leave it written-and-unread. I'd wire it rather than delete it, because claim 1 needs a second consequence anyway and this is the field for it.


**Risk**

Deleting is a save-schema narrowing: check src/engine/index.ts migration chain and tests/persistence.test.ts + tests/base44-contract.test.ts for a shape assertion on the Audition record. Nothing else moves — the field has no readers, which is the finding.
Wiring it instead makes remembersYou/believedOf depend on the magnitude, which means the note answer starts gating whether the NEXT audition is offered at all (whatIsGoing, audition.ts:335-336) and at what size (sizeCasting) — a much larger blast radius, and tests/audition.test.ts:265 and the ratchet tests would need re-baselining.


**What the adversary added**

Treat took and heard as ONE finding: two record-only fields on the audition row, both written once, both read by nothing. Do not fix them separately.

Reject their option (B) outright. Wiring took into remembersYou (world/audition.ts:166) or believedOf (world/audition.ts:218) double-counts a decision that already reaches both functions through played -> howFarOff -> decideAudition -> cast -> publicFame (probe s7: none gives believed 0.7500 / remembers 0.8300; touch|good|far give 0.7885 / 0.8650), contradicts believedOf's stated invariant at world/audition.ts:221-223, and fails tests/audition.test.ts:206 expect(believedOf(sim,'One Office')).toBe(1), whose fixture rows carry took:undefined.

This is a DESIGN_DECISION with three defensible answers.

OPTION 1 — DELETE BOTH. Remove took?: string (model.ts:1032) and heard?: boolean (model.ts:1042) plus their assignments (world/audition.ts:570, 577); keep the local `const heard` at line 361 and the audition.heard roll's effect, which flows through afterTheNote's sure/roll arguments and must not change. Cost: because audition.played is overwritten in place at line 578, the pre-note reading is already gone, so deleting took makes what happened in the room permanently unreconstructable. Cheapest, and it forecloses the post-mortem screen.

OPTION 2 — GIVE THEM A READER IN THE UI, NOT THE MODEL (RECOMMENDED). Add a closed-audition line to TheNote's sibling rendering in src/ui/workspaces/AuditionsWorkspace.tsx — the file already imports HOW_FAR, SHADES, shadeById and whyById and already renders sayWhy-adjacent copy — so that an audition with state 'over' shows the room's record: the note's shade and direction, which HOW_FAR button was pressed (howFarById(audition.took).label), and whether it landed (audition.heard). That makes heard's own doc comment true as written ("a no you can open and find out you misheard is a different no from a no you played right") without touching a single number. It changes no outcome, breaks no test, and is the reader both fields were plainly written for. Recommended because the decision already has its mechanical consequence (probe: cast flips in 3 of 8 seeds); what is missing is not a second effect, it is the player ever being told what happened.

OPTION 3 — MAKE took A REAL SECOND CONSEQUENCE ELSEWHERE. If the owner wants over-taking to carry a distinct cost, put it somewhere that is not believedOf/remembersYou — e.g. a reliability or note-taking term consumed at settle() in world/audition.ts:583. This needs a new content constant in content/audition.ts and new tests, and it should only be chosen deliberately, because the existing HOW_FAR comment already claims the balance was measured and fitted ("the favorite is among the best in about 80%, three different steps are uniquely best") and a new term invalidates that measurement.

Whichever is chosen, update docs/UNBITTEN.md:332 — and note that heard is missing from that ledger entirely and should be added to it.


### BONUS (not in the ledger): the comment that fitted TOO_FAR and CLOSE_ENOUGH cites a number the code does not produce.

**Cluster** `audition-room` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/content/audition.ts`


**Evidence**

src/engine/content/audition.ts:208-211:

  * SLATE's own, and fitted rather than picked: a reading played dead center
  * against a want drawn flat across the range is about 1.7 out, so playing it
  * safe lands between the two thresholds below.

Measured (/tmp/probe-open.mjs, exact analytic weights for the whatTheyWant draw, cross-checked against 900k empirical draws): a reading played dead centre is E[off] = 1.5000, not 1.7. The rounded draw gives P(±3)=1/12 and P(-2..2)=1/6 each, so E|w| = 2*(3/12 + 2/6 + 1/6) = 1.5 exactly. The comment overstates the fitted baseline by about 13%.

The conclusion the comment draws survives — 1.5 does sit between CLOSE_ENOUGH (1.2) and TOO_FAR (3.4), so "safe is not wrong and it is not enough" is still true. Only the cited number is wrong, and it is the number the two thresholds were fitted against.


**Fix**

Change 'about 1.7 out' to '1.5 out' in the doc comment above TOO_FAR at src/engine/content/audition.ts:209. If the intent was for the safe reading to sit at 1.7 rather than 1.5, the thresholds themselves are the thing to move, not the prose — but the cheap honest fix is the number. Worth a one-line test pinning howFarOff(AS_WRITTEN, ·) expectation at 1.5 so the fitted baseline stops being a claim nothing checks.


**Risk**

Comment-only; nothing reads it. The reason it matters is that any re-fit of TOO_FAR or CLOSE_ENOUGH under the claim-1 or claim-2 fixes will start from this sentence, and it would start from the wrong number.


**What the adversary added**

The owner must pick which half of the sentence is the truth, because the prose names a distribution AND its correct mean, and the code implements neither.

OPTION A — prose follows code (what they proposed, but it needs two edits, not one). At src/engine/content/audition.ts:208-211 change "about 1.7 out" to "1.5 out" AND fix "drawn flat across the range", which is false: `whatTheyWant` gives ±3 half the weight of every other value. Something like "against a want drawn across the range, with the ends half as likely as the middle, is 1.5 out". Cheap, zero runtime risk, all 53 audition tests stay green. But it ratifies a `Math.round` artifact as the intended want distribution.

OPTION B — code follows prose. In `whatTheyWant` (src/engine/world/audition.ts:255-261) replace `Math.round((next() * 2 - 1) * FURTHEST)` with `-FURTHEST + Math.floor(next() * (2 * FURTHEST + 1))`. That is genuinely flat across the seven steps, and it makes the comment true as written: E[off] = 12/7 = 1.714, measured 1.71306. The ±3 want stops being a second-class outcome.

I RECOMMEND A, with the "flat" wording fixed too. Reason: the thresholds TOO_FAR = 3.4 and CLOSE_ENOUGH = 1.2 are described as "fitted", and they were fitted against whatever the draw actually did — the code is the older witness of intent here, and B silently re-tunes the room's difficulty while claiming to fix a comment. But A is only honest if the "flat" clause goes with the number; changing 1.7 to 1.5 alone leaves a second false claim in the same sentence, one that reads as a spec for the draw.

DO NOT add their proposed test as written. "Pin howFarOff(AS_WRITTEN, ·) expectation at 1.5" encodes the endpoint asymmetry as a requirement. If a test is wanted, pin the thing that is actually load-bearing and true under either option — that a dead-centre reading's expected distance falls strictly between CLOSE_ENOUGH and TOO_FAR — and separately assert the draw's per-value probabilities so the shape of the want is stated once, in a test, instead of twice in prose.


### A part is priced off the stage rate card - feeFor() derives an actor's fee from what the ROOM costs (booking.weekRateCents) rather than what a cast costs. Still true after today's changes? Does a part on a documentary in Stage 5 now pay absurdly little?

**Cluster** `audition-life` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/world/audition.ts`, `/home/user/1221/src/engine/world/casting.ts`, `/home/user/1221/src/engine/content/casting.ts`, `/home/user/1221/src/engine/world/lot.ts`, `/home/user/1221/src/engine/domain/model.ts`, `/home/user/1221/src/engine/content/lot.ts`


**Evidence**

UNFIXED, and today's Stage 5 measurably made it worse. The ledger's one line is accurate but understates it in two ways it does not mention.

THE CODE, src/engine/world/audition.ts:136-141:
    export function feeFor(booking: Booking, sizeId: string): Money {
      const size = sizeById(sizeId);
      if (!size) return 0;
      const weeks = Math.max(1, (booking.to - booking.from) / MS_WEEK);
      return Math.round(booking.weekRateCents * weeks * size.onScreen * 0.55);
    }
Its own docstring (audition.ts:133-135) states the defect and then commits it: "SLATE's own, and it has to be: the lot's rate card is what the stage costs, not what the cast costs, and no published ratio between the two exists." The next line invents the ratio (0.55). The comment contradicts the code it documents.

FALSIFIABILITY TEST (/tmp/probe-fee2.mjs). Icelandic documentary, 500m2, 2 weeks. Vary ONLY its budget:
  budget EUR      23,333  -> LEAD FEE EUR 13,219
  budget EUR     233,333  -> LEAD FEE EUR 13,219
  budget EUR   4,666,667  -> LEAD FEE EUR 13,219
  budget EUR  23,333,333  -> LEAD FEE EUR 13,219
A 100x budget change moves the fee by zero cents. Vary ONLY which room is free, same production:
  Askja   6000m2 EUR 90,000/wk -> EUR 54,450
  Lon     3200m2 EUR 82,000/wk -> EUR 49,610
  Stage 3 2000m2 EUR 43,000/wk -> EUR 26,015
  Stage 5  950m2 EUR 21,850/wk -> EUR 13,219
4.1x, decided by the landlord. The input that should set the fee is inert; the input that should not is the only term.

TODAY'S STAGE 5 HALVED EVERY SHORT JOB (/tmp/probe-fee-room.mjs, same save before and after standing up Stage 5). fitsOn (world/lot.ts:827-833) sorts a.floorSqm - b.floorSqm, so short jobs now route to the cheapest room:
  an Icelandic agency, commercial     Stage 3 EUR 13,008 -> Stage 5 EUR  6,610   0.51x
  an Icelandic producer, documentary  Stage 3 EUR 26,015 -> Stage 5 EUR 13,219   0.51x
  a European agency, commercial       Stage 3 EUR 13,008 -> Stage 5 EUR  6,610   0.51x
  a streamer, documentary             Stage 3 EUR 26,015 -> Stage 5 EUR 13,219   0.51x
  (every 5wk+ job unchanged - they still fit only the big rooms)
The room built to buy the player more work halves the pay on exactly the work it buys.

ANSWERING THE QUESTION DIRECTLY: not "absurdly little" in absolute terms. A EUR 400,000 streamer documentary paying its lead EUR 13,219 for two weeks is 3.3% of budget, EUR 6,610/week - defensible. The DAY PLAYER is the one that is actually wrong: EUR 721 for a two-week engagement, EUR 361/week, below Icelandic minimum wage. So the "absurd" framing is OVERSTATED as a level claim and UNDERSTATED as a structural one.

WHAT THE LEDGER MISSES (1): THE ENGINE ALREADY HAS THE HONEST MODEL on the family's own side.
  src/engine/world/casting.ts:141-143  castPot = project.budgetCents * CAST_SHARE   (CAST_SHARE = 0.18, content/casting.ts:553)
  src/engine/world/casting.ts:179      bandCents = (pot * one.size.weight) / weight
Two sibling systems price the same four SIZES two different ways: the family's pictures off the production's money, outside productions off the landlord's rate card.

WHAT THE LEDGER MISSES (2): feeFor USES THE WRONG SIZES FIELD. content/casting.ts:464 documents `weight` as "How the cast money divides, before any one quote moves it"; lines 456-462 document `onScreen` as "Share of the picture's screen time one of them is on. What weights the axes into a cast". rolesFor correctly divides money by weight; feeFor divides money by onScreen, which theyWantYou (audition.ts:598-601) separately uses as the fame-carry term. Money and fame are driven off one number.

WHY IT CANNOT BE FIXED IN PLACE: Enquiry.spendIsk exists on every enquiry shape (content/lot.ts, EUR 166k-16m across the ten shapes) and book() (world/lot.ts:965-992) throws it away. interface Booking (domain/model.ts:483-498) carries stageId, holder, companyId, kind, from, to, weekRateCents, invoicedAt and no budget of any kind. feeFor literally cannot see what the production is worth.


**Fix**

Three options; take (A).

(A) CARRY THE BUDGET AND MIRROR THE FAMILY SIDE. RECOMMENDED.
  1. Add `budgetCents?: Money` to interface Booking in src/engine/domain/model.ts:483-498.
  2. In book() (src/engine/world/lot.ts:965-992) set it on the 'shooting' row only, from the enquiry: Math.round((need.spendIsk / ISK_A_EURO) * 100). ISK_A_EURO is already in that file (lot.ts:951). Leave prep/strike rows without it.
  3. Rewrite feeFor (src/engine/world/audition.ts:136-141) to mirror castPot/rolesFor: Math.round((booking.budgetCents ?? 0) * CAST_SHARE * size.weight / TOTAL_WEIGHT), with TOTAL_WEIGHT the sum of SIZES[].weight (1.45) exported from content/casting.ts. Fall back to the current rate-card arithmetic when budgetCents is absent, so old saves and the company's own 0-rate bookings do not produce nonsense.
  WHY: it reuses two constants the engine already ships (CAST_SHARE, SIZES[].weight), makes feeFor and rolesFor one model instead of two, deletes the invented 0.55, and makes the falsifiability test pass - change the production's budget and the fee moves; change which room is free and it does not. It also removes the Stage 5 cliff entirely, because the room stops being a term.

(B) NORMALISE THE ROOM OUT. Keep the rate-card derivation but divide by stage.floorSqm and multiply by a fixed reference floor, so EUR/m2/week (roughly flat at 15-25 across the lot) drives the fee instead of the absolute room. Cheaper - no model.ts or persistence change - but it only removes the Stage 5 cliff, not the inversion. The landlord still prices the cast.

(C) ONE-LINE MINIMUM. Swap size.onScreen for size.weight at audition.ts:140. Fixes only the wrong-field bug (lead 1/1.45 = 0.69 vs 0.55; day 0.03/1.45 = 0.021 vs 0.03). Do this only if (A) is not being scheduled - it makes the file look correct while the defect stands.


**Risk**

Under (A) the fee roughly DOUBLES on the big jobs, and that is where the danger is.
- theyWantYou (audition.ts:585-607) pushes audition.feeCents onto me.quotes. quoteOf (world/casting.ts:302) returns the MAX of every past quote and askFor (casting.ts:330) is Math.max(role.bandCents, quoteOf(...)). So a higher outside fee becomes a permanent floor on what the FAMILY'S OWN pictures must pay the player. That runs straight into the ledger's existing unfixed bug "The company can pay the player money it does not have" (a lead's band paid EUR 877,000 out of a company holding EUR 117,000). Under (A) an American studio feature at EUR 12.6m budget pays a lead ~EUR 864,000 against today's EUR 381,150 - more than double - making that bug far easier to hit. Consider fixing payThePlayer's balance check in the same change.
- TEST THAT WILL BREAK: tests/audition.test.ts:515-522, 'pays more for a longer job on a bigger stage, off the lot's own rate'. It asserts feeFor(long,'lead') > feeFor(short,'lead') where shootingOnTheLot gives both bookings the SAME hardcoded weekRateCents: 3_000_000 and differs only in weeks (14 vs 1). Under (A) weeks stops being a term, both synthetic bookings have budgetCents undefined, and the assertion's meaning evaporates. The test's own name encodes the defect and must be rewritten, not patched.
- SURVIVES: tests/audition.test.ts:702 expect(out.money).toBe(before - room.costsCents + audition.feeCents) reads feeCents off the row.
- The Booking shape change touches persistence. Check migrate() (src/engine/index.ts:292), validateUniverse() (index.ts:579), and the base44 adapter (tests/base44-contract.test.ts pins the contract).
- Zero-rate bookings: makeOnTheLot (world/making.ts:248-258) writes weekRateCents: 0 with companyId set; shootingHere (audition.ts:76-80) excludes them via companyId === undefined, so they never reach feeFor today. Keep that exclusion - a company booking would have budgetCents undefined under (A) and the fallback would give 0.
- Display only: AuditionsWorkspace.tsx:74 formatMoney(one.feeCents) and sayWhy (audition.ts:620-622) print the fee; both follow the number.
- decided.ts:619 fabricates an audition with feeCents: 1_00 directly, bypassing feeFor - unaffected, but worth a look since it is a decision-harness fixture.


**What the adversary added**

DO NOT TAKE THEIR (A) AS WRITTEN. It is measurably worse than the status quo on the metric it names.

WHAT I'D ACTUALLY DO, in order:

1. MECHANICAL, do now, 5 minutes. Name the 0.55 at src/engine/world/audition.ts:202. It is a bare literal in a file whose sibling constants are all named and sourced (AS_GOOD_AS_IT_GETS=0.82 at :739 was extracted from a formula for precisely this reason — "a ceiling with nobody's name on it"). Export `OF_THE_ROOM = 0.55` from src/engine/content/audition.ts with a docstring saying what it is a share OF. Note while doing it that 0.55 is byte-identical to SIZES lead onScreen (content/casting.ts:503), so a lead's fee is currently 0.55 squared = 0.3025 of room-weeks; if that is a copy rather than a choice, this is the moment it surfaces. Risk: none — no test asserts an absolute fee.

2. DESIGN_DECISION, the real one. Three options, and I recommend (ii):
   (i) LEAVE IT. Defensible on the numbers: lead fees land at 1.71%-5.67% of production budget against an honest 4.39% band, and the rate card is a legitimate budget proxy because ENQUIRY_SHAPES correlates needsSqm with spendIsk across all ten rows. Cost: the Stage 5 cliff (Icelandic commercial 13,008 -> 6,610) stays, and the player is rewarded for not building a room.
   (ii) RECOMMENDED — CARRY THE BUDGET, BUT PRICE OFF A SHARE, NOT A FAKE DENOMINATOR. Add `budgetCents?: Money` to interface Booking (src/engine/domain/model.ts:483-498). Set it in book() (src/engine/world/lot.ts:967-996) on the 'shooting' row only: `Math.round((need.spendIsk / ISK_A_EURO) * 100)` — ISK_A_EURO is already at lot.ts:951. Then rewrite feeFor as `budgetCents * CAST_SHARE * size.onScreen * ONE_PART_OF_THE_CAST`, keeping the fallback to today's rate-card arithmetic when budgetCents is absent. Calibrate ONE_PART_OF_THE_CAST once, against layTheRoles' real denominator on a feature (4.10), so a lead lands near 4.4% of budget rather than (A)'s 12.4%. This passes the falsifiability test — budget moves the fee, the room does not — and deletes the Stage 5 cliff, without pretending feeFor can reconstruct a denominator that needs a runtime the Booking does not have. Be honest in the docstring that ONE_PART_OF_THE_CAST is SLATE's own; it is, and so is 1.45.
   (iii) THEIR (B), NORMALISE BY floorSqm. Cheapest, no model.ts or persistence change, removes only the Stage 5 cliff. Take this if (ii) is not being scheduled — it is a real improvement and costs nothing.
   Do NOT take their (C) one-liner. Swapping onScreen for weight at :202 contradicts feeFor's own docstring ("how much of the thing a part this size is") and leaves the provenance untouched while making the file look settled.

3. SEPARATE TICKET, higher priority than any of the above. takeTheirWeeks (src/engine/world/audition.ts:632-651) schedules one player-required week per week of the BOOKING, with no size term, so a day player is locked out for the full engagement and eats one A_WORKING_WEEK reliability roll per week. Give it a size term (day/guest are 'part'-scoped in SIZES — `across: 'part'` at content/casting.ts:522, :532 — and that field already says so). This is what produces the EUR 361/week figure the ledger calls absurd; fixing feeFor will not touch it.


### A quote that can only go up. `quoteOf` returns the maximum of every past fee, so taking a cheap job costs nothing — and the code's own comment claims the opposite mechanic.

**Cluster** `quote-fees` · **Severity** serious · **Verdict** STILL_TRUE


**Files** `src/engine/world/casting.ts`, `src/engine/content/casting.ts`, `src/engine/world/audition.ts`, `tests/casting.test.ts`


**Evidence**

src/engine/world/casting.ts:302-314 is a pure max with a time decay and no downward term:
```
let best = 0;
for (const quote of person.quotes ?? []) {
  const had = sizeById(quote.size);
  if (!had || had.weight < want.weight) continue;
  const years = Math.max(0, (now - quote.at) / MS_YEAR);
  const left = Math.max(0, 1 - years / QUOTE_LIFE);
  best = Math.max(best, Math.round(quote.cents * left));
}
```
PROBE /tmp/probe/quote.mjs, run with `npx vite-node`, calling the engine's own `writeTheQuote`:
```
A) after one lead fee of EUR 900,000 -> quoteOf lead = EUR 900,000
B) they then take a LEAD for EUR 10,000 (a 90% pay cut, same size)
   quoteOf lead = EUR 900,000   <- unchanged
C) five more leads at EUR 1 each
   quoteOf lead = EUR 900,000
```
Six consecutive lead engagements at a euro apiece move the number not at all.

The ledger points at the wrong comment and misses two better ones. `quoteOf`'s own docstring (casting.ts:297) says "The ratchet", which AGREES with up-only. The comments that claim the opposite are:
- casting.ts:833-835, sitting directly above the `writeTheQuote` call: "The number goes on their record whatever it was, which is the reason a producer thinks twice before buying somebody cheap: it is not this picture the cheap number costs them, it is the next three." Per probe B/C it costs them nothing, this picture or any of the next three.
- src/engine/content/casting.ts:558-560, the docstring on `HAGGLE.under`: "the reason a performer will not take less is not pride, it is that the number is read by everybody who hires them next." `decideOffer` (casting.ts:595-602) does enforce the refusal — PROBE: an offer at 79% of ask returns `{took:false,counterCents:...}`, at 50% `{took:false,passed:'price'}` — but the stated reason for it is false, because a number below the max is read by nobody ever.

Where the ledger OVERSTATES: the quote is not strictly non-decreasing. QUOTE_LIFE=4 (content/casting.ts) decays it. PROBE: a 2-year-old EUR 400,000 lead fee reads EUR 200,000; a 9-year-old one reads EUR 0. So it falls with the calendar — it just never falls because of anything anybody decides. The falsifiability test fails on the choice, not on the clock.

Secondary: `writeTheQuote` (casting.ts:317-320) and audition.ts:596 both push rows and nothing ever prunes them, so `person.quotes` grows without bound in the save and rows older than QUOTE_LIFE contribute 0 forever while still being iterated.


**Fix**

The mechanic to change is `quoteOf` in src/engine/world/casting.ts:302. Three defensible answers:

(1) LAST FEE WINS, DECAYED. Replace the max with the most recent qualifying quote, decayed — sort `person.quotes` by `at` and take the newest whose size weight qualifies. Sharpest and truest to the research; one cheap lead resets you to cheap. Risk: one bad year erases a career, which is not what business affairs does either.

(2) A RATCHET THAT SLIPS (recommended). Keep the decayed max as a ceiling but let a fee below it drag the number down by a fraction instead of being ignored: hold a running per-size figure updated in `writeTheQuote` as `next = fee >= current ? fee : Math.round(current - (current - fee) * QUOTE_SLIP)`, with `QUOTE_SLIP` named in content/casting.ts beside `HAGGLE`. This is the only option that makes `HAGGLE.under`'s stated reason (content/casting.ts:558-560) true: going under quote actually costs the performer, so refusing it is self-interest rather than pride. I'd start SLIP around 0.35, so three cheap jobs roughly halve you.

(3) DELETE THE CLAIM. Leave the max and rewrite casting.ts:833-835 and content/casting.ts:558-560 to say what the code does — a high-water mark that only time erodes. Cheapest and honest, but leaves `HAGGLE.under` a refusal with no consequence behind it.

Whichever is chosen, add a prune to `writeTheQuote` (casting.ts:317) dropping rows older than QUOTE_LIFE years, since they can never contribute again.


**Risk**

Everything that reads the quote moves. `askFor` (casting.ts:329-330) is `max(role.bandCents, quoteOf(...))`, and it feeds `offerOf` -> `decideOffer`'s `askCents`, which sets BOTH the 0.8 refusal floor and the `over` keenness term — so lowering quotes makes performers cheaper AND easier to close. `theOfficeFills` (casting.ts:1148-1156) offers `role.bandCents` down its own list, so lower quotes mean the office fills more parts for free and `howManyCast` moves. `feeReads` scores against `role.bandCents` not the quote, so that is safe. `payTheOverage` (casting.ts:889) and `payToBringThem` (casting.ts:906) are computed off the agreed fee, so company cash and `project.spentCents` move, and `awayOnTheCast` in world/rebate.ts:100 reads `seat.feeCents`, so the reimbursement certificate moves too. Three tests pin current behaviour: tests/casting.test.ts:593-599, :601-610 and :613-623; the first two need rewriting under options 1 or 2.


**What the adversary added**

ORDER MATTERS — do the two prerequisites first, or any option below is wrong.

PREREQUISITE A (MECHANICAL, do regardless of which option wins). Replace the hand-rolled push at src/engine/world/audition.ts:700-701 with a call to `writeTheQuote(me, audition.id, audition.size, audition.feeCents, sim.now)`. Today it is the one writer that bypasses the function, which defeats any logic added there. Risk: none — same row shape; tests/audition.test.ts:762 (`me.quotes?.some((q) => q.cents === audition.feeCents)`) keeps passing.

PREREQUISITE B (the real ONE RULE hole). Decide whether the player's quote is read by anything. Either (i) let the player into the company's own casting pool — `putItOut` (casting.ts:528) skips `isPlayer`, and `castSomebody` already has three explicit player branches waiting for them (casting.ts:805 diary clash, 837 careerTrack, 944 payThePlayer), so the plumbing exists and only the pool excludes them; or (ii) read `quoteOf(me, ...)` in the audition path, so what the player was last paid sets a floor on what a production will offer next — `feeFor` (audition.ts:198) currently prices a part purely off the booking's stage rate and never consults the performer. I recommend (ii): it is the one that makes the player's career a ratchet they can feel, and it does not require the player to be castable by their own company. Risk: (ii) changes audition fee distributions, so tests/audition.test.ts:757-765 ("pays it into your own account") and the fame test at 770+ should be re-run; (i) would put the player into `whoCameIn` and therefore into the BusinessWorkspace.tsx:1042 table, which is a UI change.

THEN the quote mechanic itself. Their three options are the right three, but I would rank them differently:

(1) LAST FEE WINS — no. `askFor` floors at `role.bandCents`, so the downside is already bounded, but this makes one bad year erase a career and it breaks the "ratchet with memory" test block wholesale.

(2) RATCHET THAT SLIPS — their recommendation, and I would NOT start here. Note what the gate does to it: `decideOffer` already refuses below `HAGGLE.under` = 0.8, so the deepest under-quote fee an NPC can ever sign is 80% of ask. With their SLIP = 0.35 that is a 0.35 x 20% = 7% move — near-inert for NPCs, while being drastic for the player, whose audition fees are ungated. If this option is chosen, SLIP must be tuned against the 20% gated band, not against the 90% cut their probe invented, and `QUOTE_SLIP` belongs in content/casting.ts beside `HAGGLE` as they say.

(3) DELETE THE CLAIM — my recommendation, paired with prerequisite B. Rewrite casting.ts:833-835 and content/casting.ts:558-560 to describe a high-water mark that only time erodes, which is what `quoteOf`'s own docstring (casting.ts:297, "The ratchet") and `QUOTE_LIFE`'s docstring (content/casting.ts:573-577, "A quote decays rather than expiring") already say correctly. Then `HAGGLE.under` is not a refusal with nothing behind it: it is the floor that stops a producer buying a star at a tenth of their worth, which my probe shows it genuinely enforces (10%/50%/79% of ask all refused). Its stated REASON is what is false, not the rule. Cheapest, honest, and it leaves the real work — prerequisite B — visible instead of buried under a new constant.

ALSO FIX, independent of the above and both MECHANICAL:
- casting.ts:297-298: delete or invert the clause "and a lead's does not stop a day player being cheap". The code counts any fee at this size OR LARGER, so a lead's fee DOES price a day part, and tests/casting.test.ts:608-609 asserts it deliberately.
- BusinessWorkspace.tsx:982: `feeReads(one.seat.feeCents, one.role.bandCents)` passes the band into a parameter named `quoteCents`, so the screen prints "under quote" when it means "under band". Pass `quoteOf(person, one.role.size, sim.now)`, falling back to the band when it is 0.

PRUNE: add it to `writeTheQuote` (casting.ts:317) dropping rows older than `QUOTE_LIFE` years, as they suggest — but only AFTER prerequisite A, or player rows are never pruned. Note the growth is bounded by engagements, not unbounded, so this is tidiness rather than a leak.

RISK SURFACE for any change to `quoteOf`: `askFor` (casting.ts:330) is its only engine reader, feeding `offerOf` (casting.ts:630) -> `decideOffer` -> both the player's `company.cast` path and `theOfficeFills` (casting.ts:1152), plus `bringingThemCents(person, ask)` for travel costs and `payTheOverage` for the budget line. Move the quote and you move what the office can afford to fill, how many parts go unfilled, and the flight bill. The UI reads it at BusinessWorkspace.tsx:1045 and 1074-1075. Tests that would move: tests/casting.test.ts:221-226 (uses `writeTheQuote` at bandCents*10 specifically to raise the ask), 586-599, 602-609, 611-621, 666, 1007.


### (sub-finding of claim 1, not in the ledger) `quoteOf`'s own docstring contradicts `quoteOf`'s own code about cross-size pricing.

**Cluster** `quote-fees` · **Severity** serious · **Verdict** STILL_TRUE


**Files** `src/engine/world/casting.ts`, `tests/casting.test.ts`


**Evidence**

src/engine/world/casting.ts:297-298: "Only fees at this size or larger count — a day player's check does not price a lead, and a lead's does not stop a day player being cheap". The two halves of that sentence contradict each other and the code implements the first half. Line 308 is `if (!had || had.weight < want.weight) continue;` and SIZES weights are lead=1, support=0.3, guest=0.12, day=0.03 (src/engine/content/casting.ts), so a lead's fee passes the filter when the wanted size is a day part.

PROBE output:
```
D) one DAY fee of EUR 1,000
   quoteOf day  = EUR 1,000
   quoteOf lead = EUR 0        (first clause: correct)
E) plus one LEAD fee of EUR 900,000
   quoteOf day  = EUR 900,000  (second clause: false)
```
And tests/casting.test.ts:607-609 pins the opposite of the docstring, in a comment of its own:
```
// And a lead's number prices everything under it.
person.quotes.push({ projectId: 'y', size: 'lead', cents: 900_000_00, at: sim.now });
expect(quoteOf(person, 'day', sim.now)).toBe(900_000_00);
```
So engine, test and docstring are three statements and only two agree. The consequence is real, not cosmetic: once anybody has played one lead they can never be engaged as a day player below that lead's decayed fee, because `askFor` is `max(bandCents, quoteOf)`. On the EUR 300,000 feature in my other probe, whose day band is EUR 395.12, an ex-lead's day ask is EUR 900,000 and every offer at the band comes back `passed:'price'`.


**Fix**

One of two one-line edits in src/engine/world/casting.ts. Either delete the false clause from the docstring at line 298 — change "and a lead's does not stop a day player being cheap" to "and a lead's prices everything under it", which is what line 308 and tests/casting.test.ts:607 already say — or, if the docstring is the intent, change line 308 to `if (!had || had.weight !== want.weight) continue;` so a quote prices only its own size. I recommend editing the comment, not the code: the code's behaviour is the defensible one (a star is not cheap in a one-day part) and it is the version the test pins.


**Risk**

Editing the comment: none. Editing the code instead changes `askFor` for every performer who has ever played anything larger than the part on offer, making ex-leads suddenly affordable as day players, and breaks tests/casting.test.ts:607-609. Do not do both.


**What the adversary added**

Treat it as the open ledger entry it is (docs/UNBITTEN.md:423-426), not as a comment typo. Three options, and the owner has to pick:

(a) Delete the clause at src/engine/world/casting.ts:298 — declare the ratchet monotone and cross-size. One line, zero behaviour change, tests stay green. But it contradicts docs/UNBITTEN.md:423-426 and docs/research/PIPELINE.md:2576/2992, so it should only be taken together with striking that ledger entry and writing down why the research is being refused. Taken silently it is the worst of the three, because it removes the last statement of intent from the code.

(b) `had.weight !== want.weight` at line 308 — quotes price only their own size. Breaks tests/casting.test.ts:607-609 (`expect(quoteOf(person,'day',sim.now)).toBe(900_000_00)`), and my probe says it moves 135 of 168 office seats: every ex-lead becomes available at every small-part band, so a company's second picture fills up with its own former stars at scale. Worse world than the one that is there.

(c) RECOMMENDED — pro-rate instead of copy, and add the downward half. In `quoteOf`, when a quote comes from a bigger size, scale it before it counts (`quote.cents * (want.onScreen / had.onScreen)`, or the weight ratio) so a EUR 900,000 lead quote prices a day part at a cameo number rather than at EUR 900,000; and let a recent fee at a given size pull that size's own ask down (a recency-weighted figure rather than a pure `Math.max`), which is the "bites in both directions" the research asks for and the real-world mechanic — a star does a cameo at scale, and quote protection is a side letter, not physics. Then rewrite the docstring to describe what it does, update tests/casting.test.ts:600-609 to pin the pro-rated number, and cross off docs/UNBITTEN.md:423-426.

RISK, whichever is chosen: `quoteOf` feeds `askFor` (casting.ts:329) -> `offerOf` (casting.ts:625-635) -> `decideOffer` price floor (casting.ts:595-603) -> `theOfficeFills` (casting.ts:1105-1160, the office's seats) and `castSomebody`; `bringingThemCents(person, ask)` (travel cost on the UI and in the budget); `feeReads` (src/engine/content/casting.ts:656-666, the "at quote"/"under quote" labels); the Quote and They Want columns in src/ui/workspaces/BusinessWorkspace.tsx:1045 and 1074-1076; and the player's own quotes written at src/engine/world/audition.ts:700-701. Tests that would move: tests/casting.test.ts:593-621 (the ratchet block), :666 and :1007 (fees computed as a multiple of `askFor`), and anything asserting how many parts the office fills, since 135/168 seats move under (b).


### The collective floor under an Icelandic fee is declared and nothing reads it.

**Cluster** `quote-fees` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `src/engine/content/incorporation.ts`, `src/engine/world/casting.ts`, `src/engine/world/company.ts`, `src/ui/looks/business.tsx`


**Evidence**

The phrase exists twice, both times as prose in a `binds:` string — src/engine/content/incorporation.ts:296 ('The collective floor, holiday pay, and the mandatory pension contribution.') and :305 ('The collective floor, working time, and contributions.') — with the claim at :294-295 that the collective agreements "set the floor whatever anybody signs." There is no number. Both Icelandic rows carry `depositCents: 0, signable: false` (incorporation.ts:297, :306).

`binds` has exactly two readers, both prose surfaces: src/ui/looks/business.tsx:329 (`<strong>What it binds you to. </strong>{facts.binds}`) and src/engine/world/company.ts:622 (a notification body). Grep for `is_actors|is_crew|kjarasamning` across src/ and tests/ returns only the content rows, the `GuildId` union at src/engine/domain/company.ts:179, and tests/business.test.ts:204-206 asserting `company.sign` refuses them.

The only floor in the engine is RELATIVE: src/engine/world/casting.ts:595 `const floor = Math.round(offer.askCents * HAGGLE.under);` — 0.8 of the performer's own ask. The cheaper the band, the cheaper the floor, without limit.

PROBE /tmp/probe/floor.mjs on a EUR 300,000 Icelandic feature, 4-week shoot:
```
bands by size: lead EUR 13,170.73  support EUR 3,951.22  guest EUR 1,580.49  day EUR 395.12
day role band EUR 395.12 | pile 4 | their quote for a day part: 0 | askFor: EUR 395.12
  offer EUR 316.10 -> {"took":true,"feeCents":31610}
  offer EUR 395.12 -> {"took":true,"feeCents":39512}
```
An Icelandic performer is legally engaged for EUR 316.10 against dates `datesFor` (casting.ts:265-275) puts at a week of prep plus a slice of the shoot, and `theOfficeFills` (casting.ts:1148-1161) engages the whole cast at `role.bandCents` unasked. `castSomebody`'s only fee validation is `if (!Number.isFinite(fee) || fee < 0)` at casting.ts:791-792, so zero is a legal offer refused only by `decideOffer`, never by the engine. Falsifiability test: change the budget and the fee changes; change anything about the collective agreement and only the sentence on the Family Business screen changes.


**Fix**

A missing feature, not a defect: the word is read (by a screen) but the rule was never built. Two options.

(1) BUILD THE FLOOR (recommended). Add `floorPerDayCents` to `GuildFacts` in src/engine/content/incorporation.ts, filled on `is_actors` and `is_crew` with a real kjarasamningur day rate. Add a `theCollectiveFloor(person, role, project)` helper in src/engine/world/casting.ts beside `globalRuleOne` (casting.ts:869) returning a refusal string, and call it from `castSomebody` right after the `globalRuleOne` check at casting.ts:794-795 — same shape, same place, so a floor breach reads to the player exactly like a Global Rule One breach. Fee-days come from `datesFor`. Make `askFor` (casting.ts:329) return `max(bandCents, quoteOf, floor)` so the office at casting.ts:1148 cannot undercut it either.

(2) DELETE THE CLAIM. Strike 'The collective floor' from both `binds` strings (incorporation.ts:296, :305) and from the `what` sentence at :294-295, leaving holiday pay and pension — equally unwired but at least not stated as a rule the engine has.

I'd take (1): the band arithmetic already makes cheap pictures cast out of the phone book, and a hard floor is exactly what turns a small budget into a decision rather than a smaller number.


**Risk**

A floor moves the whole low-budget end of casting. `askFor` feeds `decideOffer`'s `askCents`, so raising it raises the 0.8 refusal floor AND lowers the `over` ratio for a given fee — cheap pictures get harder to cast on both terms. `theOfficeFills` (casting.ts:1148-1156) offers exactly `role.bandCents`; where the floor exceeds the band it fills nothing and `howManyCast` drops. tests/casting.test.ts:640 asserts `howManyCast > roles.length * 0.7` on a EUR 20m picture (safe), but any low-budget casting test breaks. `payTheOverage` (casting.ts:889) charges fee-minus-band to company cash, so a floor above the band posts a new overage on every part and moves `project.spentCents`, which feeds `certifiable`/`awayOnTheCast` in world/rebate.ts:100 and therefore the reimbursement. The floor would also apply to the player, and `payThePlayer` (casting.ts:935) already moves real money out of a company nobody balance-checks.


**What the adversary added**

Three options, not two. I would take (3).

(1) BUILD IT — but not the way they specified. Add `floorPerDayCents` to `GuildFacts` (src/engine/content/incorporation.ts:255-274), and a `theCollectiveFloor(person, role, project)` beside `globalRuleOne` (src/engine/world/casting.ts:869) called from `castSomebody` right after the `globalRuleOne` check at :794-795. Two things must change from their version or it is wrong on the project's own content:
  - Fee-days must NOT come from `datesFor` — that is a 35-day availability hold, identical for a Lead and a Day Player, read by `freeToWork` (casting.ts:277-288). Price fee-days off `SIZES[].onScreen` (content/casting.ts:496-537) scaled by the shoot, or give `Size` an explicit `feeDays`. Otherwise a Day Player owes 35 days of scale.
  - The number must be labelled SLATE's own. There is no film kjarasamningur day rate (docs/research/LOT.md:3154); the nearest real figure is Efling's ~ISK 513,000/month (LOT.md:2757). business.tsx:341-343 already carries a `provenance` string doing exactly this for the guild deposit — extend it.
  Do NOT put the floor inside `askFor` (casting.ts:329) as they propose. `askFor` feeds `decideOffer`'s relative floor (casting.ts:595) and `offerOf` (casting.ts:622-634), so raising it raises the refusal threshold for everyone, and the office at casting.ts:1148 offers `role.bandCents` — measured, that takes a EUR 2m picture from 21/21 parts filled to 11/21 and a EUR 300k picture to 2/21. If the office must respect the floor, raise what it OFFERS (`role.bandCents` -> `max(bandCents, floor)` at casting.ts:1152 and :1161), not what the agent asks — and then decide what `payTheOverage` (casting.ts:897-908) does when the floor exceeds the pot, because on a EUR 300k picture that is EUR 78,741 of overage into an account holding nothing.

(2) DELETE THE CLAIM. Strike "The collective floor" from incorporation.ts:322 and :331, and the clause "and those set the floor whatever anybody signs" from :320-321. Leave holiday pay and pension. Also revisit the `is_crew` row entirely: crew.ts:28 says "What is not here, deliberately: what anybody is paid", so nothing an `is_crew` floor could bind exists at all.

(3) RECOMMENDED — do the one-line guard now, and the content later. The reachable defect is not the missing kjarasamningur, it is that `castSomebody`'s only fee validation is `if (!Number.isFinite(fee) || fee < 0)` (casting.ts:791-792), so EUR 0 is a legal engagement and `writeTheQuote` (casting.ts:833) then records a zero quote against that person for `QUOTE_LIFE` years. Add an absolute per-engagement minimum in `castSomebody` beside that check, refusing in the same shape as `globalRuleOne` so a breach reads like a Global Rule One breach, and apply the same floor to `theOfficeFills` where it seats at `role.bandCents` (casting.ts:1161). Then either delete the collective-floor prose (option 2) or wire it to that constant. This is the smallest change that makes the sentence stop being a lie, moves no test at the EUR 20m budget the suite uses, and does not require inventing a rate that the project's own research says does not exist.


### Nothing in the company ever ends. An option you forgot to exercise never lapses; cover you forgot to renew never lapses.

**Cluster** `company-ends` · **Severity** serious · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/world/company.ts`, `/home/user/1221/src/engine/domain/company.ts`, `/home/user/1221/src/engine/world/lot.ts`, `/home/user/1221/src/ui/looks/business.tsx`, `/home/user/1221/tests/business.test.ts`


**Evidence**

UNDERSTATED. The company module has no clock at all: `grep -c 'sim.schedule|sim.onSchedule' src/engine/world/company.ts` returns 0, and src/engine/index.ts:58 calls only `registerCompanyCommands(sim)` — five commands, no tick. Nine ending-fields are declared and none is ever written by the engine:
  - domain/company.ts:230 `Policy.lapsedAt` — read ONLY in the filter at world/company.ts:77; ZERO writers anywhere in src/.
  - domain/company.ts:163 `Registration.endedAt` and :197 `Signature.endedAt` — read only in the `!one.endedAt` filters at world/company.ts:71,74; written by nothing in src/ (only tests/business.test.ts:156 sets one by hand).
  - domain/company.ts:99 `Company.dissolvedAt` — read in five filters (world/company.ts:47,52,66; ui/looks/estate.tsx:95,99); written by nothing.
  - domain/company.ts:229 `Policy.renewsAt` — written world/company.ts:659, read only at ui/looks/business.tsx:370 to print a sentence.
  - domain/company.ts:161 `Registration.nextDueAt` — written world/company.ts:407,540; read only at ui/looks/business.tsx:274,278.
  - domain/company.ts:261 `Holding.expiresAt` — written world/company.ts:693; read only for UI strings (business.tsx:436-437, BusinessWorkspace.tsx:304) and two test assertions.
  - domain/company.ts:262,264 `optionFeeCents` / `purchasePriceCents` ("What exercising the option would cost") — written world/company.ts:693-694, read by NOTHING.

PROBE /tmp/probe-companyends.mjs (10y, 2026-03-02 -> 2036-03-02):
  holding      The Cold Room expiresAt= 2027-03-02 EXPIRED? true | still in holdingsOf: true
  policy       general_liability renewsAt= 2027-03-02 OVERDUE? true lapsedAt= undefined | still in policiesOf: true
  policy       production_package renewsAt= 2027-03-02 OVERDUE? true lapsedAt= undefined | still in policiesOf: true
  registration is_vat nextDueAt= 2026-05-02 OVERDUE? true endedAt= undefined | still on register: true
  capabilities: trade OPEN / reclaim_vat OPEN / own_material OPEN / insure_a_shoot OPEN

PROBE /tmp/probe-expiry2.mjs (1-month option + E&O bound, then 10y):
  option expired 3622 days ago; still holdingsOf? 1
  deliver door STILL  : true
  own_material STILL  : true
  develop off dead opt: {"ok":true,"id":"project_0005io"}
  project stage       : optioned
A brand-new project can be started in 2036 off an option that died in 2026, and the engine stamps it `optioned` — asserting the option is live.

The code contradicts its own comment. world/company.ts:174-179: "a capability is not a fact about the company — it is an answer about the company, and the moment a registration lapses the answer changes without anybody having to remember to change it." Nothing can lapse, so the answer never changes.

WHERE THE LEDGER IS OVERSTATED: "an option you forgot to exercise" names a mistake the player cannot make. There is no `company.exercise` command — the only company commands are register, form_arm, sign, insure, option, fill_post, develop (world/company.ts:518,553,594,629,667,712,746) — and `purchasePriceCents`, the field that says what exercising costs, has no reader.


**Fix**

Add a monthly tick to src/engine/world/company.ts, modeled on `registerLot` / `LOT_OVERHEAD_KIND` in src/engine/world/lot.ts:400-440, which is the one working monthly clock already in the build (its handler is at lot.ts:425 and its charge function `chargeTheMonth` at lot.ts:586). On each month: for every Holding with `hold === 'option'` and `expiresAt <= now`, act; for every Policy with `renewsAt <= now`, act; for every Registration with `nextDueAt <= now`, act.

Three defensible answers for what 'act' means:
(a) Silent lapse — set `lapsedAt` / `endedAt` / drop the holding, and shelve any Project whose `holdingId` points at the dead option. Cheapest, and it is literally what the ledger asks for.
(b) Warn at 60 days via `sim.notify`, then lapse. RECOMMENDED. It makes the capability wall move on its own, which is what `capabilitiesOf`'s own doc comment already promises and what makes the consequence a decision rather than an ambush. It also gives the Decision Center (already noted elsewhere in UNBITTEN as a room nothing writes to) its first real writer.
(c) Auto-renew on payment, lapse only when the company is broke. Most forgiving, loses the drama, and turns three separate fields into one balance check.
Separately, either add `company.exercise` (charge `purchasePriceCents`, flip `hold` to 'owned', clear `expiresAt`) or DELETE `purchasePriceCents` and `optionFeeCents` from domain/company.ts:262,264 — right now they are declarations with nothing that reads them, which is the ONE RULE violation in its purest form.


**Risk**

`capabilitiesOf` (world/company.ts:180) feeds `whereItStands`, the whole Business workspace, and the `greenlight` and `deliver` doors through `needPolicy`/`needRegistry`. Specifically: a lapse mid-picture would shut `greenlight` and `deliver` on a production already in flight, and world/making.ts and world/rebate.ts both assume a greenlit project keeps running. `claim_rebate` requires `is_vat` + `is_companies` (world/company.ts:246), so a lapsed VAT registration kills an in-flight rebate claim — world/rebate.ts:299 has a scheduled payment that would need an explicit decision about what happens to it. `globalRuleOne` (world/casting.ts:870-882) reads `signedWith`, so a lapsed SAG signature retroactively makes already-seated American cast illegal while `Seat.releasedAt` keeps the fee owed (domain/company.ts:632). tests/business.test.ts:338-339 assert `expiresAt` on a fresh option; the long-running suites (tests/lot.test.ts and tests/rebate.test.ts both advance multiple years) would start seeing lapses they were not written for.


**What the adversary added**

KIND: DESIGN_DECISION is right as the headline, but it bundles two sub-items of different kinds and they should be split, because one of them is not a decision at all.

(A) THE CLOCK — DESIGN_DECISION, serious. Add a monthly tick to src/engine/world/company.ts modeled on LOT_OVERHEAD_KIND (world/lot.ts:400-440, handler at :426, charge at chargeTheMonth :586). I agree with their recommendation (b) — warn via sim.notify at 60 days, then lapse — because capabilitiesOf's own doc comment at world/company.ts:174-179 already promises "the moment a registration lapses the answer changes without anybody having to remember to change it", and a warned lapse makes that a decision rather than an ambush.

BUT the tick must cover only TWO of their three cases:
  - Holding where hold === 'option' && expiresAt <= now: lapse. Drop it from holdingsOf (add an `expiresAt` guard to world/company.ts:79-80, or set a lapsedAt), and shelve any Project whose holdingId points at it (projectsOf already filters on shelvedAt, world/company.ts:88).
  - Policy where renewsAt <= now: either set lapsedAt or auto-debit the premium. Note POLICY_BY_ID premiums are annual and companyCash is ~EUR 180k at boot, so a silent auto-renew is affordable; a silent lapse is the dramatic one.
  - Registration where nextDueAt <= now: DO NOT LAPSE. This is their error. filesEveryMonths is documented at content/incorporation.ts:105 as a filing cadence ("How often it wants something filed"), not a term. Lapsing on it kills is_vat at month 2 and is_companies at month 12, which I measured: 3-year VSK reclaim falls from EUR 690,968 to EUR 19,742 and every one of the nine doors shuts. The right act for a registration is FILE (advance nextDueAt by filesEveryMonths, optionally charge a fee, and only lapse after N consecutive misses if the owner wants late-filing to bite at all). Iceland's VSK return is already implemented in world/vat.ts on its own clock, so the minimal honest change is to make vat.ts advance the is_vat registration's nextDueAt when it files — which also removes the duplicate declaration of the same fact (VAT_PERIOD_MONTHS = 2 at content/incorporation.ts:248 vs REGISTRY_BY_ID.is_vat.filesEveryMonths = 2).

(B) THE TWO MONEY FIELDS — not a design decision. optionFeeCents (domain/company.ts:262) and purchasePriceCents (:264) are written at world/company.ts:693-694 and the stored values are read by nothing; I proved by probe that EUR 99m in purchasePriceCents on an option changes no outcome. Either add a `company.exercise` command (charge holding.purchasePriceCents, flip hold to 'owned', clear expiresAt — and only then does "an option you forgot to exercise" become a mistake a player can make) or DELETE both fields. Deleting is the cheaper honest fix and needs no new UI; adding exercise is the one that makes the clock in (A) matter, so if (A) ships, exercise should ship with it, along with a months control in BusinessWorkspace.tsx:341, which today passes only { title }.

(C) Company.dissolvedAt (domain/company.ts:99) is read in five filters (world/company.ts:47,52,66; ui/looks/estate.tsx:95,99) and there is no command that could ever write it — no company.dissolve exists. Unless dissolution is planned, that is DELETE: five guards against a state the save cannot reach.

RISK — what moves if (A) lands:
  - making.ts:419 refuses a greenlight through a shut door and making.ts:1235 refuses the E&O certificate; rebate.ts:214 gates the reimbursement. A lapsed GL/workers_comp/production_package policy shuts insure_a_shoot and the greenlight; a dropped holding empties `material` at world/company.ts:184 and shuts own_material, greenlight and deliver. Any test that greenlights or delivers more than twelve months after binding cover will start failing — check tests/making.test.ts and tests/selling.test.ts for long advanceTo calls before landing this.
  - vat.ts:88 reclaimable() returns 0 without onRegister('is_vat'), so anything touching registrations is now worth EUR ~690k per three years (tests/business.test.ts:759,775).
  - tests/business.test.ts:346 asserts an optioned holding's expiresAt > sim.now immediately after optioning — safe. tests/business.test.ts:803 ('opens all nine') does not advance time — safe.
  - Ids come from one shared counter, so ADDING A SCHEDULED SYSTEM SHIFTS EVERY ID IN THE SAVE. Today's commit message says this in terms: casting keys its offer draw on person id, and adding vat.ts broke two tests that had been passing on luck (tests/casting.test.ts, the cutting-room test). Expect the same class of seed-dependent breakage from a new company tick, and do not treat it as a regression without checking.


### ADJACENT, NOT IN THE LEDGER — nothing in the company ever RECURS either: a filled post and a bound policy are charged once and never again.

**Cluster** `company-ends` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/world/company.ts`, `/home/user/1221/src/engine/domain/company.ts`, `/home/user/1221/src/engine/content/incorporation.ts`, `/home/user/1221/src/engine/world/lot.ts`


**Evidence**

Same root cause as claim 1 (world/company.ts has no clock), but a different set of dead words: the ledger says nothing ENDS; this says nothing REPEATS.

1. `Post.monthlyCents` — domain/company.ts:295 "/** What the post costs the company a month. */". Six rates in content/incorporation.ts:418-448 (production = cents(11_000), facility = cents(7_000), etc.). Written at world/company.ts:433 (boot) and :732 (fill_post). Readers: ui/looks/business.tsx:894 and ui/workspaces/BusinessWorkspace.tsx:271 — both PRINT it. Nothing charges it. The engine says so out loud at world/company.ts:740: "It costs the company $11,000 a month, every month, whether anything is shooting or not."
2. `Policy.premiumCents` — domain/company.ts:227 "/** What it costs a year. */". Charged exactly once at world/company.ts:647 and never again. `renewsAt` is set 12 months out at :659 and read only to print a sentence.

PROBE /tmp/probe-recurring.mjs (fill the production post, bind general liability, run five years):
  post monthlyCents   : 11000 per month
  bind GL premium     : 8000 /yr ("What it costs a year")
  five years on. company account 172000 -> 352800 delta 180800
  what the words say was owed over those 5y (60 months of post + 5 renewals): 700000
  postings on the company account in those five years: 530
  ["Sugar Land Studios: Set Aside For Repairs","...Property Tax","...Standing Crew","...Insurance",
   "...Selling It","...Keeping The Lights On","...Contracted Services","Paid In By Sugar Land", ...]
  posts carried: principal(filled), facility(filled), production(filled)
All 530 postings come from world/lot.ts. NOT ONE comes from world/company.ts. The company went UP 180,800 over five years in which it owed 700,000 by its own arithmetic. This is live from the first morning of every save: world/company.ts:428-436 fills `principal` and `facility` at boot.


**Fix**

The same monthly tick as finding 1, so do them together. In the new `company.overhead` handler in src/engine/world/company.ts, modeled on `registerLot`/`chargeTheMonth` (world/lot.ts:410-440, 586-597): for each Post with a `personId`, `sim.expense(purse(sim, post.companyId), post.monthlyCents, `${ROLE_BY_ID[post.role].label}`, 'company')`; for each Policy with `renewsAt <= now`, charge `premiumCents` and roll `renewsAt` forward 12 months (or set `lapsedAt` when `payFor` refuses). Itemise per post and per policy rather than posting one 'overhead' figure, for the reason lot.ts:579-585 already gives.


**Risk**

This is the one that moves the most money. At the content rates a fresh save carries principal (0) + facility (7,000) = 7,000/month from boot, rising to ~34,000/month once production, development, business_affairs and accountant are filled — against `OPENING_BALANCE` of 180,000 (world/company.ts:456) and a `GREENLIGHT_FLOOR` of 50,000 (world/company.ts:171). The greenlight door would shut within months on a fresh save unless the sugar group's `familyCovers` (world/lot.ts:596) is extended to the company account, or `OPENING_BALANCE` moves. `capabilitiesOf`'s `greenlight` blocker reads `companyCash`, so every test that fills a post and then greenlights is affected — tests/business.test.ts's door-count assertions, and the multi-year runs in tests/lot.test.ts and tests/rebate.test.ts. Note the existing UNBITTEN entry that `sim.expense` has no balance check: charging monthly overhead against an account that can go negative silently would compound that, so fix the balance check first or gate the charge behind `payFor`.


**What the adversary added**

Do it with finding 1's monthly tick, but resolve the design question first — do not merge their snippet.

THE QUESTION: the company account is already backstopped to zero every month by familyCovers (world/lot.ts:617). So a naive monthly post charge is absorbed by the parents and changes nothing the player feels (A/B probe: standing rung unchanged, whyNotBuild unchanged, cash -0.7%). Three defensible answers:

  (a) Charge and let the family absorb it, as the lot already does. Cheapest; makes the word live; hiring stays free in practice. Rejects the premise that a hire is a decision.
  (b) Charge, and make payroll a claim the family will NOT cover — familyCovers already refuses a month the lot earned nothing (lot.test.ts:259-287 pins exactly that). Extend the same condition: wages are the company's to find. When it cannot pay, the post empties (clear personId, keep the row) and the capability doors at company.ts:242/:261 shut, with a notification. This is the only option where filling a post stops being strictly dominant.
  (c) Accrue what is unpaid as a liability on the company and let it show as a figure the player can open, per the lot's own itemisation argument at lot.ts:579-585.

I'd recommend (b). It reuses machinery already built and tested (familyCovers' condition, needRole/capabilitiesOf), and it is the only one that makes the input change the outcome rather than the sentence.

THE MECHANICS, whichever is chosen — new `company.overhead` schedule handler in src/engine/world/company.ts, registered in registerCompanyCommands and rescheduled monthly, modeled on registerLot/LOT_OVERHEAD_KIND (lot.ts:400-440, 480-535):
  - Use the existing `payFor(sim, companyId, ...)` (company.ts:505), NOT raw sim.expense. I verified sim.expense has no balance guard: one call took an account to -99,981,999,900. And do not call `purse` — it is module-private (company.ts:492) and returns {id, balance}, so their literal `sim.expense(purse(...), ...)` throws `LedgerError: No such account: [object Object]`, which I reproduced.
  - Per Post with a personId and monthlyCents > 0: charge `${ROLE_BY_ID[post.role].label}`. Itemise per post, per lot.ts:579-585.
  - Per Policy with renewsAt <= now: charge premiumCents, roll renewsAt forward 12 months via addMonths(s.now, 12, s.homeZone). On refusal set `lapsedAt` — which also finally gives the dead `!one.lapsedAt` guard at company.ts:77 something to read.
  - While in there, also settle Registration.nextDueAt (company.ts:407, :540): either charge the filing and roll it by filesEveryMonths, or delete the field. Right now it is printed at business.tsx:274-278 and never moves.
  - `principal` is monthlyCents: 0 by design (incorporation.ts:444, and business.tsx:894 prints 'Nothing' / 'Whoever owns it does it'), so skip zero rather than posting an empty line.

ONE THING TO SETTLE BEFORE CHARGING `facility`: the lot's OVERHEAD already carries a 'Standing Crew' line at 154,000_00/mo described as "Sixteen people who are there whether anybody is shooting or not, five of them on the gate" (content/lot.ts). The `facility` post is "The Lot Manager — Keeps the stages standing, the bookings straight and the place safe to work in" at 7,000_00/mo. If the manager is one of the sixteen, charging both double-counts. The owner should rule on this explicitly; it is a one-line answer but it is not mechanical.


### The strike week is booked as prep. (part 1 of 2)

**Cluster** `money-time` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/world/lot.ts`, `/home/user/1221/src/engine/domain/model.ts`, `/home/user/1221/src/engine/content/lot.ts`, `/home/user/1221/tests/lot.test.ts`


**Evidence**

src/engine/world/lot.ts:987-995 — the code contradicts the comment directly above it:
    // Three rows and not one, because they are three different things at three
    // different prices, and a single row called shooting that covered the build
    // and the strike would be the lie the flat rate used to be.
    let at = from;
    if (held.prep > 0) { write('prep', at, held.prep, prepRate); at += held.prep * MS_WEEK; }
    const shooting = write('shooting', at, held.shoot, weekRateCents);
    at += held.shoot * MS_WEEK;
    if (held.strike > 0) write('prep', at, held.strike, prepRate);
Three rows, TWO kinds, TWO prices.

quotedFor does the same on the money side, lot.ts:960-964:
    return Math.round(held.shoot * rateFor(stage, 'shooting')
      + (held.prep + held.strike) * rateFor(stage, 'prep'));

PROBE /tmp/probe-mt2.mjs (Askja, a 10-week local feature):
  heldFor { prep: 6, shoot: 10, strike: 2 } wholeHold 18
    booking kind=prep     weeks=6  rate=5400000
    booking kind=shooting weeks=10 rate=9000000
    booking kind=prep     weeks=2  rate=5400000
  kinds written across the whole engine so far: [ 'prep', 'shooting' ]

The guard test is blind to it. tests/lot.test.ts:359-373 is titled "writes the prep and the strike as their own rows, at their own rate" and asserts only `prep.length >= shooting.length` and that every 'prep' row sits at RATE_SHARE.prep. It cannot distinguish a strike row from a prep row — which is exactly how the conflation survived a test written to catch it.

OVERSTATED BY ONE HALF: the ledger implies the price is wrong too. It is not. RATE_SHARE's own docstring (content/lot.ts:405-408) says "A production pre-lights AND STRIKES at a lower rate than it shoots at" — prep and strike sharing 0.6 is the declared design. Only the row's `kind` label is wrong. Also "the strike week" is singular; heldFor returns weeks (2 on this feature, per AROUND_THE_SHOOT.feature.strike = 0.2).


**Fix**

BookingKind has no 'strike' member (src/engine/domain/model.ts:472: `export type BookingKind = 'shooting' | 'prep' | 'hold';`), so the one-line fix needs the enum widened first.
1. domain/model.ts:472 — add 'strike'.
2. content/lot.ts:410 — RATE_SHARE gains `strike: 0.6`, so rateFor(stage, kind) still type-indexes it (lot.ts:196 is `RATE_SHARE[kind]`, which breaks otherwise).
3. world/lot.ts:994 — `write('strike', at, held.strike, rateFor(stage,'strike'))`.
4. world/lot.ts:963 in quotedFor — split the term so strike is charged at rateFor(stage,'strike'). Value is unchanged at 0.6; the point is that the quote and the rows agree on which rate is which.
5. tests/lot.test.ts:359 — assert exactly one 'strike' row per 'shooting' row, and that its weeks equal heldFor(need).strike. That is the assertion the current test's title already promises.


**Risk**

- src/engine/world/lot.ts:873, tierFor: `.filter((one) => one.kind === 'shooting' && ...)` counts units on the floor to work out the national crew pool. Unaffected — a strike row is neither counted today nor after.
- NO UI reads booking.kind at all. The only UI touch of bookings is BusinessWorkspace.tsx:933 (the shut date). Nothing on screen moves.
- Adding a BookingKind member without adding the RATE_SHARE key breaks tsc at lot.ts:196.
- Existing saves carry strike rows labelled 'prep'. Nothing reads bookings by kind except tierFor (which only looks for 'shooting'), so no migration is needed; validateUniverse (src/engine/index.ts) does not check kinds.
- making.ts:246-259 holdAStage writes the company's OWN picture as ONE row of kind 'shooting' across prep+shoot, which is the same mislabel in the other direction. Worth fixing in the same pass or the board will say the family preps at the shooting rate while a tenant preps at the prep rate.


**What the adversary added**

Three defensible answers. The owner picks; it is not one obviously-right edit.

OPTION A (cheapest, no new dead word) — make the comment true instead of the code.
  src/engine/world/lot.ts:987-989: rewrite to "Three rows and not one, because a build, a shoot and a strike are three different occupations of the room at two different prices." Leave `write('prep', ...)` alone. Zero behaviour change, zero risk, and it stops the comment lying. Honest but leaves the save unable to say which prep row is a strike.

OPTION B (RECOMMENDED) — widen the enum, AND give 'strike' a reader in the same change, so the word is not born dead.
  1. src/engine/domain/model.ts:472 — `export type BookingKind = 'shooting' | 'prep' | 'strike' | 'hold';`
  2. src/engine/content/lot.ts:434 — `RATE_SHARE = { shooting: 1, prep: 0.6, strike: 0.6, hold: 0.35 }`. Required, or `RATE_SHARE[kind]` at world/lot.ts:196 fails to typecheck. (They got this right.)
  3. src/engine/world/lot.ts:995 — `if (held.strike > 0) write('strike', at, held.strike, rateFor(stage, 'strike'));` Note `stage` may be undefined on that path (line 971 guards it) — use the same `prepRate`-style fallback or the call throws on a stage-less book().
  4. src/engine/world/lot.ts:962-963 in `quotedFor` — split the term: `held.prep * rateFor(stage,'prep') + held.strike * rateFor(stage,'strike')`. Value unchanged at 185400000 (probe-confirmed); the point is that quote and rows agree on which rate is which.
  5. THE READER, which they omitted and without which this fails THE ONE RULE: make `world/lot.ts` expose the strike as something a screen or a number can use. Concretely — `utilisation()` (lot.ts:109-139) should return strike weeks alongside `taken`/`own`, so the lot board can say "of 110 stage-weeks, 17 were strikes" and the player can see that turnaround, not shooting, is what fills the room. Alternatively make `fitsOn`/`freeAcross` allow a new booking to overlap a strike row's tail (a stage really can start a build while the last unit is loading out), which is a genuine mechanic and makes the label decide something.
  6. Also fix `holdAStage` (world/making.ts:246-258) to write per-period kinds from `period.holds` rather than a single `kind: 'shooting'` across the whole holdingWindow, or the family's own prep stays mislabelled while the tenants' is fixed.

OPTION C — delete the distinction: drop 'hold' from BookingKind and RATE_SHARE (nothing writes or reads it), keep two kinds, adopt Option A's comment. Smallest surface, most honest to what the engine actually does.

TEST, whichever option (their step 5 is unusable):
  tests/lot.test.ts:364-377 — replace `expect(prep.length).toBeGreaterThanOrEqual(shooting.length)` (already seed-luck: false on lot-b and lot-c) with a structural assertion that does not depend on counts: for every row of the lower-rate kind, assert it abuts a shooting row on the same stage — `shooting.some(s => s.stageId === row.stageId && (s.to === row.from || s.from === row.to))` — and under Option B additionally assert every 'strike' row abuts a shooting row's `to` and every 'prep' row its `from`. That is testable from `sim.universe.bookings` alone, holds on all four seeds, and survives the 56.4% of enquiries that write no strike row at all.


### Travel fatigue is a second fitness bug, and it takes openness down with it.

**Cluster** `wellbeing` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/systems/life.ts`, `/home/user/1221/src/engine/core/taste.ts`, `/home/user/1221/src/ui/looks/wellbeing.tsx`, `/home/user/1221/src/engine/content/personality-traits.ts`, `/home/user/1221/src/engine/domain/model.ts`, `/home/user/1221/src/ui/creation/CharacterCreation.tsx`


**Evidence**

True, and the ledger UNDERSTATES it: travelFatigue is worse off than fitness, and openness is not merely damaged, it is provably 100% dead.

NO PRODUCER. `travelFatigue: 0` in freshWellbeing (life.ts:42). The only two writes in the entire tree are decays: life.ts:77 `w.travelFatigue = clamp(w.travelFatigue - hours * 0.9 * (2 - personalityOf(person, 'travelFatigue')), 0, 100);` and life.ts:238 `w.travelFatigue = clamp(w.travelFatigue - effective * 6, 0, 100);`. Nothing anywhere adds to it.

PROBE, 3 simulated years, every person in the save: `people=3 travelFatigue max=0 min=0`. Readiness frozen at 49.17 across years 1, 2 and 3.

FITNESS, for the comparison the claim makes: starts at 50, falls 0.18/day at life.ts:290, no producer anywhere. 50/0.18 = 278 days, so it hits 0 inside year one: probe shows `fitness max=0.00 min=0.00` at year 1 for all three people. So yes, fitness IS pinned at 0 for the player. But fitness is the BETTER of the two — it still has one live reader, life.ts:291 `const target = Math.min(60 + w.fitness * 0.4, ceiling.condition);`, so its pinning changes the condition target from 80 to 60. travelFatigue has no such consolation.

THE DEAD TERM. life.ts:92 `const travelPart = remap(w.travelFatigue, 0, 100, 1.0, 0.80);` is frozen at exactly 1.0 forever. The term itself is well built — forcing the input to 100 moves readiness 81.73 -> 65.38, a 16.35-point swing. It is the input that has no source.

OPENNESS. taste.ts:117 `const open = lean(p.openness);` and taste.ts:125-126 `// Read as "how much travel bothers you", so openness lowers it.` / `case 'travelFatigue': value = 1 - open * 0.2; break;`. That switch is the ONLY read of `openness` outside creation and the random generators (casting.ts:425, crew.ts:229, family.ts:113, bootstrap.ts:135 all only assign it). So openness's one and only engine effect is scaling a decay applied to a number that is always zero.
PROBE: two saves identical but for `player.personality.openness = 0` vs `= 100`, advanced one year — identical on every dial, and readiness identical to four decimals (49.1710 vs 49.1710).
Worse, taste.ts:104-109 is a comment that explicitly audits which axes are dead and names "Extraversion, agreeableness and risk tolerance... read by nothing, and the creation screen says so". Openness is listed there as the live one ("Openness is how a new place lands") and it is not. The code contradicts its own audit.

DECLARED IN THE UI ANYWAY. wellbeing.tsx:39 'Travel Fatigue' / 'how much of the moving is still in you'; :170-171 "None. You've been in one place long enough to be in it."; :198 puts it in the drag list. CharacterCreation.tsx:88 offers Openness as a Conventional/Experimental slider.


**Fix**

Two honest answers; pick one.
(a) BUILD THE PRODUCER (recommended). The game already models where a performer is from and what it costs to bring them (world/casting.ts, world/audition.ts — task #47). Add travel fatigue at the point that flight is booked: when a person is brought to a shoot or an audition from another city, `w.travelFatigue = clamp(w.travelFatigue + f(distance, timeZoneDelta), 0, 100)`. One line at one call site turns FIVE declared words live at once: travelFatigue itself, readiness's travelPart, `personalityOf(person,'travelFatigue')`, the openness axis, and the four traits at content/personality-traits.ts:91,119,126,170 that carry travelFatigue systemMods and currently modify nothing.
(b) DELETE. Remove `travelFatigue` from Wellbeing (model.ts:58), freshWellbeing (life.ts:42), both decay lines (life.ts:77,238), readiness (life.ts:92), and both wellbeing.tsx entries (:39, :198 plus the :170 case). Remove `case 'travelFatigue'` from axisModifier (taste.ts:125-126). Strip the travelFatigue systemMod from the four traits. And change CharacterCreation to say openness is recorded and read by nothing, exactly as it already says for extraversion.
Recommend (a): the distance-and-origin machinery already exists, so it is the cheapest way to make a whole personality axis mean something. Take (b) only if travel is out of scope for this build. Either way, do not leave the dial on the wellbeing screen with no source.
FITNESS is a SEPARATE and different call: it has a live reader, so deleting it means also deciding what the condition target is instead of `60 + fitness * 0.4`. Do not fold the two decisions together.


**Risk**

`readiness` feeds the audition room and casting, so a travelFatigue that actually moves cuts readiness by up to 20% and will shift audition outcomes, `believedOf`, `sizeCasting`, fame and everything downstream — balance it against the A_WORKING_WEEK numbers that landed today, not against today's flat 49.17. tests/taste.test.ts:117 and :195 both enumerate 'travelFatigue' as a disposition key and break if the case is deleted. content/personality-traits.ts:91,119,126,170 carry travelFatigue systemMods; deleting the key turns four trait mods into silent dead words rather than fixing them. wellbeing.tsx:198 lists travelFatigue in `dragsOn` with `hurt: w.travelFatigue` filtered at `> 12`, so once the number moves a new dial starts appearing in the player's top-three drags and that screen's copy changes.


**What the adversary added**

KIND: I agree with DESIGN_DECISION — the owner genuinely must choose — but the two options are not the ones they framed, because there is no travel anywhere in this build.

SEVERITY: I downgrade serious → minor, on three grounds. (a) Nothing computes a wrong number; readiness is multiplied by exactly 1.0, which is the identity. (b) The player is not misled: CharacterCreation.tsx:611-616 already names openness among five axes that "change nothing yet", and the travel-fatigue dial's own copy ("None. You've been in one place long enough to be in it.") is true. (c) It never reaches the drag list (wellbeing.tsx:203, `hurt > 12` filter). The wrongness is confined to a doc comment and a test, and to one dial reading a constant on a screen the file header already labels as exposure.

THE ONE PIECE THAT IS NOT MINOR, AND IS MECHANICAL — DO IT TODAY EITHER WAY:
 - src/engine/core/taste.ts:104-109 asserts "Four of the seven axes reach wellbeing" and names "Openness is how a new place lands." That is false. Cut openness from the live list and move it down to the paragraph at :107-109 that already names extraversion, agreeableness and risk tolerance as recorded-and-read-by-nothing. This is the code contradicting its own audit, which is the sharpest kind of defect this project has.
 - src/tests/taste.test.ts:113-123, "names the knobs nothing reads yet", is what let this survive. It defines "read" as a regex for `personalityOf(person, '(\w+)')` hits in life.ts and asserts travelFatigue is in the read set. A grep hit is not a reader — the project's own falsifiability test is "change an input, does the outcome change". Rewrite that assertion to drive the sim: for each key, perturb it and assert some dial moves. Run it and watch travelFatigue (and, per my probe, fitness) fall out of the "read" set. Cost: this test currently passes (19/19 in tests/taste.test.ts); it will go red, correctly.

THE ACTUAL CHOICE ON THE DIAL:
 (A) DELETE — what I recommend for this build. Remove travelFatigue from model.ts:58, life.ts:42, life.ts:77, life.ts:92 (drop travelPart from the readiness product), life.ts:238, wellbeing.tsx:39/:170/:198, and the `case 'travelFatigue'` at taste.ts:125-126. Strip the travelFatigue systemMod from the four traits at personality-traits.ts:91,119,126,170 and from PERSONALITY_HIGHER_IS_WORSE at :364. DRILL-DOWN.md:89 and wellbeing.tsx:2 say "nine dials" and become eight. Recommended because the machinery their option (a) leans on does not exist: the player has never once left Mosfellsbær and no timeline item has ever carried a locationId.
 (B) BUILD TRAVEL — a task, not a fix, and it should go in COVERAGE-MATRIX.md as a missing feature rather than in UNBITTEN.md as a dead word. Order: (1) a command that writes player.currentLocationId; (2) give auditions and shoot weeks a real locationId (plans.ts:247 currently defaults every plan to the player's own city, which is why needsTravel is always false); (3) on arrival, `w.travelFatigue = clamp(w.travelFatigue + f(distanceKm(from,to), hours), 0, 100)` — geography.ts:539 already has great-circle distance. Only then do travelPart, personalityOf(person,'travelFatigue'), openness and the four trait mods come alive, and only then does calendar.ts:232 needsTravel and the Travel chip at TimeControls.tsx:303 mean anything.

FITNESS: do NOT treat it as the healthier case, as they advise. My probe says its reader is dormant, not live (0.0000 condition delta between fitness 0 and 100 at 30/120/365 days, because sleep holds condition at the age ceiling). The real fitness question is not "what replaces 60 + fitness*0.4" — it is why nothing in a year of this life ever knocks condition off its ceiling so that the term could matter. That is a third, separate entry.

RISK IF YOU TOUCH IT:
 - readiness() is read at audition.ts:331 (heardItRight, decides how surely the player takes the one note) and audition.ts:671 (whatTheWeekTook → reputation.reliability), plus Home.tsx:40 and wellbeing.tsx:210. Removing travelPart multiplies readiness by 1/1.0, so no number moves — but tests/audition.test.ts:249,257,368 assert rounded readiness values and should be re-run to confirm.
 - tests/taste.test.ts:117 (exact read-set array) and :195 (axisModifier middle == 1 for travelFatigue) both go red under option (A). Expected and correct.
 - tests/creation.test.ts:38,100,102 round-trip openness through the save; leave the field on Personality even if the axis stays dead, or that test and the save schema move too.
 - wellbeing.tsx's DIALS array is typed `as const` and DialKey derives from it; removing an entry narrows the type and will surface any stale key at typecheck (npm run typecheck), which is the cheap way to find the rest.


### (root cause, implied by the ageing claim) w.fitness is a one-way ratchet to zero, and its own doc comment says otherwise

**Cluster** `lifespan` · **Severity** serious · **Verdict** STILL_TRUE


**Evidence**

src/engine/domain/model.ts:55-56 declares:
  /** 0-100 fitness, moved by exercise and lifestyle. */
  fitness: number;
Nothing moves it by exercise or lifestyle. The complete set of writes to it in all of src/ is one line, src/engine/systems/life.ts:290:
  w.fitness = clamp(Math.min(w.fitness - 0.18, ceiling.fitness), 0, 100);
Starting value 50 (src/engine/systems/life.ts:42, freshWellbeing). 50 / 0.18 = 277.8, and the probe confirms `player fitness first hit 0 on day = 277`. It is 0.000 at every sample from year 10 to year 75.

The code also contradicts its own neighbouring comment. src/engine/systems/life.ts:283 says 'Fitness decays without use' — but there is no 'use' anywhere that reverses it, so 'without use' describes a branch that does not exist. And src/engine/content/lifespan.ts:241 documents the fitness column as 'Points off the fitness ceiling per year', a ceiling that by construction can never be reached from below.

The damage is not confined to the ceiling. Because fitness is pinned at 0 for 27,098 of 27,375 days, `const target = Math.min(60 + w.fitness * 0.4, ceiling.condition)` (life.ts:291) is the constant 60 for 99% of a life — the whole 0..40 range of that term is unreachable. And src/ui/looks/wellbeing.tsx:38 prints 'Fitness — what a physical day would cost' next to a dial that is 0 for everyone over 26.


**Fix**

Three defensible answers:
(a) Give fitness a writer. The decay at -0.18/day already implies a ~0.18/day maintenance cost, so the smallest honest version is a day-type term in dailyRollover (src/engine/systems/life.ts:289-293): a shoot day or a deliberately-spent day credits fitness back, an idle day does not. The hook already exists — `whatHasThem(sim, sim.now, sim.now + MS_DAY)` at life.ts:325 is exactly 'is today a day somebody owns'.
(b) Delete fitness. Remove `fitness` from Wellbeing (domain/model.ts:56), life.ts:42, 290-291, the AGING.fitness column, ceilingAt's fitness half, and the dial at wellbeing.tsx:38. The file drops a dial nobody can influence and a ceiling nobody can reach.
(c) Leave it, and fix only the comment at model.ts:55 to say 'declines with age; nothing raises it yet'.
I recommend (a). (b) throws away eight authored band values and a dial that is genuinely the right shape for a performer sim; (c) is honest but leaves the ONE RULE broken — a declared word (the whole fitness column) with nothing that reads it. (a) is the only option under which ceilingAt().fitness ever binds, which is what makes the fitness column stop being dead arithmetic.


**Risk**

If you take (a): the condition drift target at life.ts:291 becomes `60 + fitness*0.4`, which currently reads a constant 60. Raising fitness raises that target up to 100 and pulls condition up 2%/day toward it, which changes the wellbeing screen for every person in the save, not just the player — dailyRollover loops `Object.values(sim.universe.people)`. It also makes ceilingAt().fitness start binding, which turns on eight band values that have never executed a load-bearing comparison, so their calibration is untested. readiness() does not read fitness or condition (life.ts:85-97), so the Home meter and anything gating on readiness are unaffected in the current build — but that insulation disappears the moment condition is wired into readiness.


**What the adversary added**

Their option (a) as written is insufficient — a writer in `dailyRollover` alone leaves the falsifiability test still failing. Any real fix must give fitness a consumer that can actually move, which means touching `applySleep` at life.ts:236, not just life.ts:289-293.

Corrected options for the owner:

(a') MAKE IT A LEVER — two edits, not one. (1) Add the day-type credit they describe in `dailyRollover` (the `whatHasThem(sim, sim.now, sim.now + MS_DAY)` hook at life.ts:325 is the right one). (2) THE EDIT THEY MISSED: make fitness cap what rest can buy back, by changing life.ts:235 from `const ceiling = at === undefined ? 100 : ceilingAt(years).condition;` to fold in the fitness term, e.g. `Math.min(ceilingAt(years).condition, 60 + w.fitness * 0.4)`, and then delete the now-redundant no-op at life.ts:291-292. Without (2), (1) is decoration. Optionally also add a condition term to `readiness` (life.ts:85-98), which is the only way any of this reaches audition.ts:331/671 and therefore reaches a decision the player makes.

(b) DELETE — remove `fitness` from Wellbeing (model.ts:56), life.ts:42, 290-291, the `fitness` column of AGING (lifespan.ts:243, 252-259), the fitness half of `ceilingAt` (lifespan.ts:283-292), and the dial at wellbeing.tsx:38 and 167-168. Note this is cheaper than they claim: the eight authored band values they want to preserve are already dead arithmetic today, and `ceilingAt().condition` — the half that genuinely binds, via life.ts:236 — survives untouched.

(c) COMMENT-ONLY — fix model.ts:55, and also the comment at life.ts:283 ("without use" names a branch that does not exist). Leaves the ONE RULE broken.

I would recommend (a') if the owner wants a performer sim where staying in shape is a decision, and (b) otherwise. I would NOT recommend (a) as they wrote it: it adds a writer, the ledger gets ticked, and the dial still cannot change any outcome — which is the exact failure mode the ONE RULE exists to catch.


### (follow-on) The other 46 exports of content/lifespan.ts are dead (docs/UNBITTEN.md:217)

**Cluster** `lifespan` · **Severity** serious · **Verdict** STILL_TRUE


**Evidence**

Verified name by name. 46 of the 48 exports have zero references anywhere outside src/engine/content/lifespan.ts, including zero in tests/. That is roughly 480 of the file's 540 lines.

The dead surface is not uniform, and the fix differs by group:
- REFERENCE DATA, expensive to recreate, plausibly wanted later: LIFE_EXPECTANCY (lifespan.ts:54-91, per-country table), WORLD_EXPECTANCY (:92), expectancyIn (:99), expectancyIsPublished (:104), adultExpectancyIn (:136), PENSION_AGE (:153-169), WORLD_PENSION_AGE (:170), pensionAgeIn (:173), pensionAgeIsPublished (:178), GATES (:408), GATE_BY_ID (:419), DEFAULT_GATES (:424), COUNTRY_GATES (:434-483, ~50 lines), NO_DRINKING (:484), gateAgeIn (:487), gateIsCountrys (:492).
- PROSE WITH NO SURFACE: LIFESPAN_NOTE (:22), PENSION_NOTE (:30), ADULT_EXPECTANCY_NOTE (:125), AGE_GATE_NOTE (:391), BIRTHDAY_LINES (:344), MILESTONE_LINES (:353), PASSING_LINES (:367), and the seven `about` strings on LIFE_STAGES (:206-212).
- MISSING-FEATURE STUBS: LIFE_STAGES/STAGE_BY_ID/stageAt (:205-237) — a seven-stage life model with nothing that asks what stage you are in; MILESTONE_AGES (:341) and MOURNING_DAYS (:375) — a birthday/mourning event system that was never written; YOUTH_CURVE/FULLY_FORMED/youthFactorAt (:526-540) — a maturation curve read by nobody.
- SUPERSEDED: PARENT_AGE_GAP (:302) is dead because src/engine/world/family.ts:64-66 declares its own YOUNGEST_PARENT=15 / OLDEST_PARENT=60 instead. Likewise SIBLING_WEIGHTS (:308), SIBLING_AGE_GAP (:317), PARTNER_AGE_GAP (:305), PARENTS_STILL_TOGETHER (:320), MOVED_AWAY (:323), FAMILY_START (:331) — family.ts builds the household without any of them.


**Fix**

Do it in three passes, not one.
1. DELETE outright, today: the superseded family constants (PARENT_AGE_GAP, PARTNER_AGE_GAP, SIBLING_WEIGHTS, SIBLING_AGE_GAP, PARENTS_STILL_TOGETHER, MOVED_AWAY, FAMILY_START) — world/family.ts:60-66 already owns this and duplicates it, so these are actively misleading; and the four *_NOTE prose blocks that no screen renders. That is the clean ~80 lines.
2. MOVE, don't delete: LIFE_EXPECTANCY / PENSION_AGE / GATES / COUNTRY_GATES / NO_DRINKING and their six accessors are ~150 lines of real per-country reference data that is correct and costly to rebuild. There is already a src/engine/content/reference.ts — relocate them there so lifespan.ts stops claiming to be an ageing model when two-thirds of it is an almanac.
3. TICKET, don't delete: LIFE_STAGES/stageAt and MILESTONE_AGES/BIRTHDAY_LINES/MILESTONE_LINES are the cheapest live wiring available — stageAt(age) into the wellbeing screen header, and a MILESTONE_AGES check in dailyRollover emitting a birthday event, would light up ~40 of the dead lines with two small edits.
After 1-3, lifespan.ts is ~200 lines that are all about ageing, and the 2-of-48 ratio becomes something like 8-of-20.


**Risk**

Low for pass 1 — typecheck (`npm run typecheck`) catches any reference I missed, and I verified there are none, including in tests/. Pass 2 is import-path churn only; nothing imports these today so nothing breaks, but src/engine/content/reference.ts may have a naming collision worth checking first. Pass 3 changes visible behaviour: a birthday event fires in dailyRollover, which runs over every person in sim.universe.people, so a 3-person save emits 3/year and a large population would emit proportionally more — gate it on isPlayer or on a household filter, or the timeline fills with strangers' birthdays.


**What the adversary added**

Three passes, re-cut from theirs.

PASS 1 — MECHANICAL, today. Fix src/engine/content/lifespan.ts:51 and :432, which both promise "the checker" that does not exist. Either delete the two sentences, or write the checker into tools/geo-check.mjs — it already imports COUNTRIES from content/geography.ts, so asserting that every countryId in LIFE_EXPECTANCY / PENSION_AGE / COUNTRY_GATES / NO_DRINKING is a real country, and reporting coverage, is about 15 lines. I would write it: it costs nearly nothing and turns ~150 lines of almanac from "nothing reads it" into "verified against the gazetteer every gate run", which is a real reader and makes the comment true.

PASS 2 — DELETE, today, ~55 lines (not their 80). PARTNER_AGE_GAP (:305), PARENTS_STILL_TOGETHER (:320), MOVED_AWAY (:323) — world/family.ts genuinely owns the household now. Plus the four disclaimer blocks LIFESPAN_NOTE (:22), PENSION_NOTE (:30), ADULT_EXPECTANCY_NOTE (:125), AGE_GATE_NOTE (:391): no screen renders any of them, and each is a legal-ish caveat for a feature that does not exist, which is the worst kind of dead word. Do NOT delete PARENT_AGE_GAP, SIBLING_WEIGHTS, SIBLING_AGE_GAP or FAMILY_START in this pass as "superseded" — nothing supersedes them; they belong with the stubs in pass 3.

PASS 3 — the DESIGN_DECISION the owner must actually make, three options:
(a) SPLIT. New file src/engine/content/almanac.ts taking LIFE_EXPECTANCY, WORLD_EXPECTANCY, PENSION_AGE, WORLD_PENSION_AGE, GATES, GATE_BY_ID, DEFAULT_GATES, COUNTRY_GATES, NO_DRINKING and the six accessors (~150 lines). NOT content/reference.ts — that is a Registry class with no data in it. lifespan.ts then becomes ~90 lines that are all ageing and all live, and the 2-of-48 ratio becomes 5-of-8.
(b) WIRE THE ONE THAT CAN BE WIRED. gateAgeIn(citizenshipId, 'work') as a real refusal on the audition/offer path in world/audition.ts, so a fourteen-year-old from the UK can take work a fifteen-year-old from Japan cannot. That is the only sub-group with an obvious live hook today, and one edit lights up GATES, GATE_BY_ID, DEFAULT_GATES, COUNTRY_GATES, NO_DRINKING and gateIsCountrys.
(c) DELETE the almanac and the stubs outright. Cheapest, defensible, throws away correct per-country data.
I recommend (a) plus (b), because (b) is the only change here that makes the country the player chose produce a different outcome — which is the test this project holds itself to.

DO NOT do their pass 3 as written. stageAt(age) into the wellbeing screen header changes the sentence and not the outcome; by the project's own falsifiability test that is not a fix, it is 40 decorative lines. The MILESTONE_AGES-into-dailyRollover half is better (life.ts:273 is a real hook and would emit a real event), but it is a FEATURE ticket, not a cleanup, and it should be sized as one.

RISK, specifically. Nothing but src/engine/systems/life.ts:20 imports this module; no test, no tool, no UI component, no base44 entity. `npm run typecheck` is green today (tsc -b --noEmit, exit 0), so a deletion starts from a clean baseline, and tools/wired.mjs --check cannot regress because docs/UNWIRED.json tracks no content-module exports. The real risk is documentary and the gate will not catch it: docs/drill-down-research.json:1556 cites `lifespan.ts:269` and `lifespan.ts:251-267` by line number, and DEPTH.md:158 plus UNBITTEN.md:184, :217 and :312 all quote "540 lines" and two competing ratios (2 of 28 and 2 of 48 — the ledger contradicts itself). tools/doc-refs.mjs --check validates only file PATHS (its regex stops at the extension), so every one of those line refs will silently rot. Update them in the same commit. And fix DEPTH.md:156-159 first: it asserts the ageing bands are dead arithmetic, my probe shows them pinning condition for every person every day, and acting on that sentence would delete the one thing in the file that decides anything.


### whereTheCrewStands counts strangers as returning hands, and no screen reads it. Both halves of the One Rule at once.

**Cluster** `crew-office` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/world/crew.ts`, `/home/user/1221/tests/crew.test.ts`, `/home/user/1221/src/ui/looks/business.tsx`


**Evidence**

Both halves confirmed, and the arithmetic is wrong in BOTH directions — worse than the ledger says.

The code, /home/user/1221/src/engine/world/crew.ts:405-408:
    const back = (project.crew ?? []).filter((seat) => {
      const others = heldBefore(sim, project.companyId, seat.postId);
      return others.indexOf(seat.personId) > 0 || others.length > 1;
    }).length;

Root cause: heldBefore (crew.ts:265-274) walks EVERY project of the company including the current one, so the seat under test is always in `others`. Probe confirms: `heldBefore includes the CURRENT project: true`. Neither term of the OR asks the actual question ("did THIS person hold THIS post on a DIFFERENT, EARLIER picture of this company").

PROBE (/tmp/probe-crew.mjs — greenlights and delivers pictures on one company, compares the code's count against ground truth computed by walking other projects only):

  One:   seats=23  TRUTH returning=0   CODE counts=11
     says: "23 of 23 posts filled on One, 11 of them by people who have worked for the company before."
  Three: seats=23  TRUTH returning=12  CODE counts=11

"One" is the company's FIRST EVER picture. Nobody can possibly have worked for the company before. The sentence claims eleven returning hands.

Worse: the sentence about One is RETROACTIVE. In an earlier run where only One existed, the same call returned "24 of 24 posts filled on One." with CODE counts=0. Making a later picture changes what the sentence says about an earlier one. Falsifiability test inverted: change an input that has nothing to do with One, and One's sentence changes.

Term decomposition probe:
  One:   indexOf>0 only=0  length>1 only=0   both=11
  Three: indexOf>0 only=0  length>1 only=11  both=0
So `indexOf > 0` never fires alone and is pure noise; `others.length > 1` does all the work and means "this post has been held by more than one person across company history" — which is a fact about the POST, not about the person sitting in it. False positive: a stranger hired onto a post somebody else once held. False negative: Three's TRUTH=12 vs CODE=11 — a genuine returner on a post only ever held by that one person scores others.length===1 and indexOf===0, so both terms are false and a real returning hand is not counted.

Second half — nothing reads it. Repo-wide grep (excluding node_modules/dist/.git): the only hits are the declaration at crew.ts:399, two assertions in /home/user/1221/tests/crew.test.ts:441 and :448 (which assert only 'Nobody is on' and 'posts filled' — neither touches the returning clause), and the ledger line itself at docs/UNBITTEN.md:386. No .tsx file imports it. /home/user/1221/src/ui/looks/business.tsx:33 already imports crewOf, postsFor and standingReads from the same module and renders a crew table at :466-:554 — it just never prints the summary sentence.


**Fix**

Two edits, both in /home/user/1221/src/engine/world/crew.ts.

(1) Fix the arithmetic. Replace the `back` filter in whereTheCrewStands (crew.ts:405-408) with a test that asks the real question — do NOT touch heldBefore, which fillPost depends on:
    const back = (project.crew ?? []).filter((seat) => (
      Object.values(sim.universe.projects).some((other) =>
        other.id !== project.id
        && other.companyId === project.companyId
        && (other.crew ?? []).some((s) =>
          s.postId === seat.postId && s.personId === seat.personId && s.from < seat.from))
    )).length;
That is exactly the ground-truth predicate the probe used, and it returned 0 for the first picture and 12 for the third.

(2) Wire it, or delete it. business.tsx already imports from world/crew and already renders the crew table at :466; one <p className="small">{whereTheCrewStands(sim, project)}</p> above that table is the whole job, and the sentence is the one place the module's stated point ("They come back") is said out loud. If the owner does not want it on screen, delete whereTheCrewStands and the two assertions in tests/crew.test.ts — a corrected sentence nobody reads is still the One Rule's first half.

Also add a test that pins the first picture: on a company's first ever production, whereTheCrewStands must NOT contain 'worked for the company before'. Today that test fails.


**Risk**

Do not "fix" heldBefore itself. It is read by fillPost at crew.ts:300-301 to build the `known` pool that decideHire draws against; excluding the current project there would change who gets rehired on every picture and shift the 'crew/hire' and 'crew/make' RNG streams, which would move every crew name and standing in every existing save and reseed tests/crew.test.ts wholesale. The fix must be local to whereTheCrewStands.

If you wire it into business.tsx, tools/wired.mjs --check reads docs/UNWIRED.json as a baseline that may only go down, so this is a safe direction but will need a --bless.

tests/crew.test.ts:441 and :448 assert only 'Nobody is on' and 'posts filled' and stay green under the corrected arithmetic.


**What the adversary added**

Two parts. Part 1 is mechanical; part 2 is the decision.

PART 1 (one right answer, if the function survives) — /home/user/1221/src/engine/world/crew.ts:405-408, inside whereTheCrewStands. Replace the `back` filter with the real predicate. Do NOT touch heldBefore (crew.ts:265) — fillPost at crew.ts:300 and tests/crew.test.ts:315 depend on it walking every project including the current one.
    const back = (project.crew ?? []).filter((seat) => (
      Object.values(sim.universe.projects).some((other) =>
        other.id !== project.id
        && other.companyId === project.companyId
        && (other.crew ?? []).some((s) =>
          s.postId === seat.postId && s.personId === seat.personId && s.from < seat.from))
    )).length;
I ran exactly this predicate as ground truth: it gives 0 on the first ever picture, 13 on the second, 14 on the third, and — critically — One's sentence is byte-identical before and after Three exists, so the retroactivity is cured, not just the count. The `s.from < seat.from` ordering is safe because startFor(project, post, sim.now) never backdates a seat before its greenlight.

PART 2 (the owner must choose — this is why it is DESIGN_DECISION):
 Option A, replace the hand-written copy. Change /home/user/1221/src/ui/looks/business.tsx:530-533 to render {whereTheCrewStands(sim, project)} and add whereTheCrewStands to the import at business.tsx:33. This is a REPLACEMENT, not an insertion above the table: line 532 already says `${crew.length} of ${carries} posts filled.` and adding a second <p> prints the count twice. Cost: you lose the calendar-stagger sentence ("a unit production manager is here ten weeks before the camera turns over, a boom operator for one"), which is itself true and is the only place that fact is said. Someone has to decide it is worth trading.
 Option B, keep both facts. Leave business.tsx:532's first clause, and append only the returning clause when back > 0 — i.e. split the returning count out of whereTheCrewStands into a small `cameBackOn(sim, project): number` and have the UI compose. This is the option I recommend: both facts are real and tested, the module header's stated point ("They come back") finally reaches a screen, and nothing already on screen is lost.
 Option C, delete. Remove whereTheCrewStands (crew.ts:398-411) and the two tests at tests/crew.test.ts:441 and :448 and the import at :30. Defensible under THE ONE RULE, and cheap — the UI already covers the only clause it currently renders. Costs the returning fact its only voice.

Whichever is chosen, add the regression test they name: on a company's first ever production, whereTheCrewStands must NOT contain 'worked for the company before'. It fails today (my probe: One reports 19). Also worth pinning: two different pictures of the same company must not report the same back count when their crews differ — today they always do (19/19/19).


### The casting office is a display string, so roster memory has nine addressable offices, two of which are one.

**Cluster** `crew-office` · **Severity** minor · **Verdict** PARTLY_TRUE


**Files** `/home/user/1221/src/engine/world/lot.ts`, `/home/user/1221/src/engine/content/lot.ts`, `/home/user/1221/src/engine/world/audition.ts`, `/home/user/1221/src/engine/domain/model.ts`, `/home/user/1221/src/engine/world/diary.ts`


**Evidence**

The mechanism is exactly as claimed; the count is wrong in both directions.

TRUE — holder is a raw formatted display string, /home/user/1221/src/engine/world/lot.ts:969 inside `book`:
    const holder = `${need.from}, ${aOrAn(need.kind)}`;
That string is the entire identity of a casting office. /home/user/1221/src/engine/world/audition.ts keys every memory function on it by string equality: readFor (`one.holder === holder`), remembersYou, believedOf, and ignoredBy (added today). There is no id.

TRUE — two shapes collide. PROBE over /home/user/1221/src/engine/content/lot.ts ENQUIRY_SHAPES:
    shapes: 10   distinct holder strings: 9
    "an American studio, a feature"  <- 2 shape(s)
          COLLISION #7 w=4 14wk 5200sqm tank=false spend=1900000000
          COLLISION #9 w=2 11wk 3000sqm tank=true  spend=2400000000
Two structurally unrelated productions — a 5,200 m2 no-tank 14-week picture and a 3,000 m2 tank 11-week picture — are one office.

And both actually book. PROBE, 25-year saves, shooting bookings grouped by holder and by shoot length:
    crew-office-a:  6 x "an American studio, a feature | 11wk"  +  10 x "... | 14wk"
    crew-office-b: 10 x "an American studio, a feature | 11wk"  +  16 x "... | 14wk"
So the merge is live in every seed, and it merges the highest-paying category in the game.

It is load-bearing. WHAT_THEY_OFFER.seenEnough = 4 (/home/user/1221/src/engine/content/audition.ts:471), and believedOf = seen/4 + fame*0.55, which feeds sizeCasting (audition.ts) and decides what size of part the player is offered. Merging halves the number of rooms the player has to get into to reach the ceiling for American features. In one 25-year save the player was asked 4 times by "an American studio": 3 from shape #7 and 1 from shape #9. Merged, that is 4 readings at one office (believedOf ceiling). Split, it would be 0.75 and 0.25.

OVERSTATED — "nine addressable offices" is five. PROBE, 25 years, three seeds: distinct shooting holders = 5 in every seed. Four of the nine strings never book. Running wouldBook against each of the ten shapes on the default lot:
    #2 "an Icelandic producer, a documentary"   NO : too much of what it has to spend here
    #4 "a European agency, a commercial"        NO : 25% back doesn't cover what it costs...
    #5 "a Nordic broadcaster, a limited series" NO : EUR516,000 for 14 weeks is too much...
    #6 "a streamer, a documentary"              NO : 25% back doesn't cover what it costs...
Building the fifth stage (lot.build) recovers exactly one, which is what content/lot.ts:777 predicted ("a sixth holder"). PROBE, 25 years, with and without:
    WITHOUT: RUV / British / American / Icelandic agency / Icelandic production      (5)
    WITH   : ...plus 25 and 31 bookings of "an Icelandic producer, a documentary"   (6)
Three of the nine strings — the European agency commercial, the Nordic broadcaster series and the streamer documentary, 26 of the 101 total enquiry weight — are refused on the rebate-vs-CREW_PENALTY arithmetic or on price at every room size the game can build. They are declared content that nothing can ever reach: a One Rule finding sitting next to this one and not in the ledger.

UNDERSTATED — holder is a category label, not an office. Because one shape writes one string forever, all 120 separate "an Icelandic agency" commercials over 25 years are the same office to roster memory. The collision is not 2-into-1, it is 10-shapes-into-5-labels-into-roughly-400-bookings. Whether that is intent or defect is the owner's call (content/lot.ts:777 does speak of shapes as "holders"), but the American pair is unambiguously unintended: the same string for two rows the table wrote separately.


**Fix**

Three options, in ascending cost.

(A) Cheapest, fixes only the named collision: rename one of the two American shapes in /home/user/1221/src/engine/content/lot.ts:703 or :711 so the strings differ — e.g. #9 (the 3,000 m2 tank picture) becomes `from: 'an American studio with water'` or, better, give shape #7 `from: 'a Hollywood studio'`. One line, no engine change. Does not address the category-label question.

(B) RECOMMENDED: give Enquiry a stable `officeId` and make holder the display of it. Add `officeId: string` to the Enquiry interface (content/lot.ts:631-655), one per row, and let the two American rows either share it deliberately or not. In lot.ts `book` (:969-:977) write both `officeId` and `holder` onto the Booking; add `officeId` to Booking and Audition in /home/user/1221/src/engine/domain/model.ts:488 and :1001; rekey readFor / remembersYou / believedOf / ignoredBy in /home/user/1221/src/engine/world/audition.ts onto officeId and keep holder purely for display. This is the change that makes the One Rule question answerable at all: right now identity and prose are the same field, so you cannot change the sentence without wiping the player's memory.

(C) If the intent is that each SHAPE is one office, say so in the Enquiry doc comment and merge #7 and #9 into a single weighted row — but then the two rows are one row and the table should show that.

Separately and independently: the three unreachable shapes (#4, #5, #6) should either be repriced so they can book, or deleted. As written they are four dead rows in an authored table.


**Risk**

holder is read in far more places than roster memory. Renaming or re-keying it touches: /home/user/1221/src/engine/world/diary.ts:71, where whatHasThem returns `one.holder` verbatim as the refusal sentence the player is shown ("You're on RUV, a limited series across those dates"); /home/user/1221/src/ui/workspaces/AuditionsWorkspace.tsx:72, :100, :145, :218, which print it raw as the office name, modal title and quote attribution; /home/user/1221/src/ui/looks/estate.tsx:583, which prints it in the stage occupancy table; /home/user/1221/src/engine/world/lot.ts:1127 and :1150, where it is both the booking notification body and the bank memo on the letting income; and /home/user/1221/src/engine/decided.ts:614, which hard-codes the literal 'RUV, a limited series' as a decider sample.

Most dangerous: the string IS the save key. Any change to its shape silently resets every existing save's roster memory to cold, because readFor matches on equality and nothing migrates. If you go with (B), migrate old rows by deriving officeId from the existing holder string.

Be aware /home/user/1221/src/engine/world/audition.ts is being edited right now by a parallel agent (task #57). readFor gained a `one.why !== 'never-answered'` clause and new ignoredBy / shutWhatHasClosed functions between my first and second read of the file. Any holder re-keying has to land after that.


**What the adversary added**

Severity should be minor, not serious, and the fix should be sequenced smallest-first.

STEP 1 (do this regardless, MECHANICAL, one line of test): tests/cohesion.test.ts already has the guard that should have caught this — "keeps every name unique where a name is how you find the thing" at :50, which today covers ATTRIBUTES only. Add:
  expect(duplicates(ENQUIRY_SHAPES, (s) => `${s.of.from}, ${s.of.kind}`)).toEqual([]);
That converts "is this intended?" from an argument into a failing test the owner must answer.

STEP 2 — the owner's choice, three options:

(A) Rename one row. content/lot.ts:703-713: give shape #7 `from: 'a Hollywood studio'` (better than renaming #9, because #7 is the 5,200 m2 no-tank picture and "Hollywood" reads as the big one). One line, no engine change, no save migration, no typecheck fallout. Risk: tests/lot.test.ts:579 rebuilds its `abroad` set from the table so it follows; :762 does `holder.split(', ').pop()` so the new `from` must not contain a comma.

(B) officeId on Enquiry/Booking/Audition. This is what they recommend and it is the right long-term shape, but it is NOT the cheap fix they imply. Two things they omitted and I would require:
  - Key the readers as `one.officeId ?? one.holder` in readFor/ignoredBy (world/audition.ts:93, :109), NOT on officeId alone. src/engine/persistence/base44.ts:250 stores the whole universe as `payload` with no per-table migration, so a bare rekey makes every pre-change save load with officeId undefined and collapses every office in the game into one key — strictly worse than today.
  - Budget for ten literal construction sites that will fail tsc: src/engine/decided.ts:227, :618; tests/business.test.ts:519; tests/lot.test.ts:444; tests/audition.test.ts:56, :81, :199, :542, :931, :953. Make the field optional to keep them compiling.

(C) Declare that a shape IS an office, say so in the Enquiry doc comment (content/lot.ts:631-655), and merge #7 and #9 into one weighted row. Honest, but it deletes the 3,000 m2 tank picture from the game, which is the only American shape that uses Lón.

I'd recommend (A) now plus (B) later, and I'd do (A) first precisely because my measurement says the live cost of the bug is 0-1.5% of asks — it does not earn a domain-model change on its own. If (B) lands for other reasons (the "you cannot change the prose without wiping memory" argument is the real one and it is a maintainability argument, not a gameplay one), it should carry the `?? one.holder` fallback.

ALSO FIX, same fault, different file: tests/lot.test.ts:322-323 keys its shape lookup on `${kind}-${local}`, which matches three rows for 'feature-false' and silently returns #7. Give that helper whatever id STEP 2 introduces.

SEPARATELY — and I'd rank this ABOVE the collision: the fifth stage is sized for a customer that cannot exist. content/lot.ts:824-830 justifies A_SMALL_STAGE_SQM = 950 by the European agency's 900 m2 commercial, but that shape is foreign and wouldBook refuses it on back(0.25) - CREW_PENALTY(0.32) <= 0 at every buildable room size (probe-d). Either reprice/relocalise shapes #4, #5, #6 so they can book, or delete them and rewrite that comment. 26 of 101 enquiry weight is currently unreachable content. That is the code contradicting its own comment — MECHANICAL, cheap, and a cleaner One Rule finding than this one.

RISK IF YOU CHANGE HOLDER AT ALL: it is read for display in src/ui/workspaces/AuditionsWorkspace.tsx:72, :100, :145, :224 and src/ui/looks/estate.tsx:583; it is the diary entry text via world/diary.ts:71 (`whatHasThem` returns one.holder as `what`, and tests/audition.test.ts:438, :447 assert on it); it is the ledger memo in world/lot.ts:1150 (`${LOT_NAME}: ${booking.holder}`) and the notification body at :1127; and tests/audition.test.ts:520, :550, :754, :866 hardcode the literal 'an American studio, a feature'.


### project.hands cannot be changed after the greenlight, so the cutting room cannot be restaffed.

**Cluster** `crew-office` · **Severity** minor · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/world/making.ts`, `/home/user/1221/src/engine/world/inventory.ts`, `/home/user/1221/src/engine/domain/company.ts`, `/home/user/1221/src/ui/looks/business.tsx`, `/home/user/1221/src/ui/workspaces/BusinessWorkspace.tsx`, `/home/user/1221/tests/inventory.test.ts`


**Evidence**

Literally true, and the code contradicts its own comment in three places.

The only write site in the engine, /home/user/1221/src/engine/world/making.ts:558, inside greenlight():
    if (spec.hands !== undefined) project.hands = Math.max(1, Math.round(spec.hands));
Grep for `.hands =` across src: that is the sole assignment. There is no command. The full command surface is calendar.cancel/schedule/skip, company.breakdown/cast/deliver/develop/greenlight/insure/register/release/sell/session/sign, life.sleep, lot.build, lot.sell. Nothing touches hands.

PROBE (/tmp/probe-hands.mjs):
    command company.restaff: Unknown command 'company.restaff'.
    command company.hands:   Unknown command 'company.hands'.
    command company.staff:   Unknown command 'company.staff'.
    command project.hands:   Unknown command 'project.hands'.
    re-greenlight to change hands: {"ok":false,"error":"The Arena is already being made."}
(The refusal is wouldBe's `if (project.planId) return ...` at making.ts:~490.)

The UI confirms it: the only input is `gl-hands` at /home/user/1221/src/ui/workspaces/BusinessWorkspace.tsx:600, inside GreenlightForm, which is unreachable once the picture is greenlit.

And the engine already honours a mid-flight change — the lever works, only the door is missing. Same probe, unscripted season greenlit with hands:1, clock advanced 21 days into post, then project.hands written directly:
    left at one editor : {"hands":1,"cutSeconds":12600,"leftToCut":16200,"delivered":false}
    restaffed to six   : {"hands":6,"cutSeconds":28800,"leftToCut":0,"delivered":false}
Cut output more than doubles and the backlog goes to zero. Falsifiability test passes on the mechanism and fails on the interface.

The comments say it is a live lever. /home/user/1221/src/engine/world/making.ts:817-821, on aWeekOn: "how long the cutting room needs is not known at greenlight - it is whatever the room's rate and the room's hands turn out to make it, and HANDS CAN BE CHANGED IN ANY WEEK." /home/user/1221/src/engine/domain/company.ts:434-441, on the field itself: "The plan's figure is a default, not a rule... the number of editors is the decision that sits between a budget and a delivery date", and company.ts:446 "it depends on how many hands the room had in every week it ran, and that is a decision that can change week to week." /home/user/1221/src/ui/looks/business.tsx:670 tells the player: "Put one editor on this where the plan assumed two and it arrives half as fast."

Strongest evidence that the gap is real: /home/user/1221/tests/inventory.test.ts:304-315, the test named 'says so again when the room is put right', has to reach around the command layer to exercise it:
    sim.universe.projects[id]!.hands = 6;
The project's own test suite writes the save directly because there is no path a player could walk. There is also a notification, 'Back Inside Its Date', that only ever fires after a restaff the player cannot perform.


**Fix**

Add one command in /home/user/1221/src/engine/world/making.ts, registered next to 'company.greenlight' at :1412:
    sim.onCommand<{ projectId: Id; hands: number }, { ok: boolean; error?: string }>(
      'company.restaff', (payload, { sim: s }) => { ... });
Refuse when the project has no planId, no cuttingPeriod, is shelved, or is already delivered; clamp with the same Math.max(1, Math.round(...)) greenlight uses; write project.hands; notify. Then surface it where the problem is already shown: /home/user/1221/src/ui/looks/business.tsx:473 already computes `handsOn(project)` and prints it at :627, and the forecast two rows above it at :640-644 already says 'Needs N more weeks and the calendar leaves M' — put the control there, beside the number that tells the player they are short.

DESIGN QUESTION the owner must settle: what a restaff costs. crew.ts:28-30 says on purpose that pay lives in the engagement and the deal, not in the crew module, and editors are not currently on any payroll — so a free restaff is a strictly dominant button and every cutting room ends at six hands. Two defensible answers: (a) price it against the budget, so adding hands eats the same money the overrun draws from, which is the honest version of business.tsx's 'money buys hands'; (b) gate it on a lead time — a new editor starts in N weeks, so under-staffing still costs a season its date. I'd take (a) plus a short lead time; (b) alone lets the player fix every picture for free by watching the warning.

And once the command exists, rewrite tests/inventory.test.ts:309 to go through it instead of writing the save.


**Risk**

Everything downstream of handsOn already re-reads it weekly, so nothing needs to be re-armed — but that also means the blast radius is the whole back half of a production. Readers: handsOn (/home/user/1221/src/engine/world/inventory.ts:113-117) -> cutsAWeek -> runTheCut (making.ts:~880) for the week's finished seconds; weighTheCut, which raises the 'More Than It Can Cut' and 'Back Inside Its Date' notifications; finishesBy, which aWeekOn and weeklyThrough (making.ts:816-861) re-read every week to decide whether to schedule another heartbeat, so a restaff genuinely moves the delivery date rather than just the warning.

Two tests pin the current behaviour and will move: tests/inventory.test.ts:287-299 asserts exactly one warning on a one-editor season, and :304-315 asserts recovery. tests/trouble.test.ts:282 parameterises made/late on hands.

If you price the restaff against the budget, it will interact with tightnessOf / weighTheSchedule (making.ts), which already draw the shoot overrun from budget-vs-schedule — check you are not charging the same euro twice.


**What the adversary added**

TWO defensible answers; the owner picks. Do NOT ship their version.

OPTION A (cheap, honest, my recommendation for today): delete the promise. In /home/user/1221/src/engine/world/making.ts:857-861, the doc on `aWeekOn` reads "...it is whatever the room's rate and the room's hands turn out to make it, and hands can be changed in any week." Cut the last clause. The rest of that comment is true and load-bearing for a different reason — the weekly tick is scheduled one at a time because a cut can outrun its own post period, which is stated right after and is independently correct. Hands then stand as what they actually are: a greenlight decision, priced on the form beside the number since 5671a3c, with a real two-sided trade-off (feature: six rooms cost €4-5m and buy nothing; series/unscripted: they buy back a €2.4-4.3m late fine). Nothing else changes; no test moves.

OPTION B (the feature, done safely): add `company.restaff`, but it is NOT a one-function change, and this is where their proposal fails. `settlePeriod` (making.ts:818-826) charges `whatThePeriodCost(project, period, budget)` once, reading `handsOn(project)` at the settlement boundary. Writing `project.hands` mid-flight therefore retro-prices the whole period at the final number, which my probe shows is worth up to €5.56m to game. Option B requires BOTH:
  - a cost that accrues per week rather than at the boundary. The natural home is `aWeekOn`/the BANK_KIND tick (making.ts:864, consumed at :1411): accumulate `aRoomCosts(period, budget) * hands / weeksInPeriod` each tick into a new `project.roomsCents`, and have `settlePeriod` charge `base - rooms + roomsCents` instead of `periodAtThisStaffing(...)`. This is what company.ts:447 already claims the model does.
  - THEN the command, registered beside 'company.greenlight' at making.ts:1451. Refuse on no `planId`, no `cuttingPeriod(plan)`, shelved, delivered, or `sim.now` outside `windowOf(project,'post')`; clamp with the same `Math.max(1, Math.round(...))`; write `project.hands`; call `weighTheCut(sim, project)` so the recovery notice fires off the change. Surface it at /home/user/1221/src/ui/looks/business.tsx:626-645, beside the "N hands" row and the "Needs N more weeks and the calendar leaves M" forecast, reusing `aRoomCosts`/`periodAtThisStaffing` the way GreenlightForm does at BusinessWorkspace.tsx:624-645 so the price is visible before the click.
Their lead-time idea (their option b) is a nice-to-have and does not substitute for per-week accrual — a lead time delays the exploit, it does not remove it.

RISK / what moves if you take Option B:
  - tests/inventory.test.ts:327-344 ('says so again when the room is put right') — rewrite line 333 to go through the command. Its assertion `expect(warnings(sim)).toHaveLength(1)` and the 'Back Inside Its Date' check will still pass; that notification is already reachable without any restaff (20/48 untouched runs), so do not treat it as proof the command works.
  - tests/inventory.test.ts:395-500, the whole 'the rooms on a picture are paid for' block added by 5671a3c. Its safety property is "a picture run the way its plan expects costs exactly what it always did." Per-week accrual must preserve that exactly, including the `spentOn(plan.id, converts.hands) === spentOn(plan.id)` identity at :423 and the linearity checks at :437-438. Rounding per week instead of once will drift these by cents — expect to need a tolerance or an integer-remainder carry.
  - tests/casting.test.ts:351 asserts two worlds agree on `projects[a].hands === projects[b].hands`; a new command that mutates hands must not be reachable from the casting path.
  - `project.spentCents` feeds the rebate claim (`notSpentHereCents`, making.ts:1327) and break-even/`sellsFor` in src/ui/looks/business.tsx — changing when rooms are charged changes the certified-spend base the Icelandic rebate is computed against.
  - `settlePeriod`'s double-settle guard (`project.settled`) is why the €0 amounts in my dump are safe; any new accrual field needs the same idempotence or a picture pays for its rooms twice, which the comment at making.ts:770-778 says already happened once to the tune of 96% over.

Either way, correct docs/UNBITTEN.md:216-218, which still lists this among "the other three" critical findings.


### The Decision Center is a room nothing ever writes to. Two commands world.take_decision_action and world.dismiss_decision read a table the engine never fills. Every deadline in the build goes unannounced, and the most expensive of them is the reimbursement.

**Cluster** `unreachable` · **Severity** serious · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/core/simulation.ts`, `/home/user/1221/src/engine/world/world.ts`, `/home/user/1221/src/ui/screens/Home.tsx`, `/home/user/1221/src/ui/looks/attention.tsx`, `/home/user/1221/src/engine/world/rebate.ts`, `/home/user/1221/src/engine/world/making.ts`, `/home/user/1221/src/ui/workspaces/BusinessWorkspace.tsx`


**Evidence**

THE TABLE: `decisions: Record<Id, DecisionItem>` — model.ts:1116, seeded empty at bootstrap.ts:247, migrated as `record('decisions', 'the decision center')` at index.ts:334, re-stamped at index.ts:439.

THE ONLY WRITER: `Simulation.requireDecision` at core/simulation.ts:633-668 (plus `resolveDecision` at :671). Repo-wide grep for callers returns exactly two hits and one is the definition:
  src/engine/core/simulation.ts:633:  requireDecision(spec: {
  tests/looks.test.ts:113:  sim.requireDecision({
Zero engine callers. Zero UI callers.

THE COMMANDS: world/world.ts:33-56. Both begin `const decision = s.universe.decisions[p.decisionId]; if (!decision) throw new CommandError('No such decision.');`. The table they index is always `{}`.

THE UI: Home.tsx:152-224 — a full "What Needs You" panel with urgency stripes (`data-urgency` critical/high/normal), per-action buttons wired to `world.take_decision_action`, a "Go There" route button, Dismiss, and a "N more waiting" overflow line. Plus a 150-line drill-down look at looks/attention.tsx:177-300. All of it renders the Empty state forever.

PROBE (/tmp/probe-unreachable.mjs via npx vite-node), fresh save, no input:
  boot        decisions: 0  notifications: 0
  one year    decisions: 0  notifications: 20
  three years decisions: 0  notifications: 75

THE ROOM WORKS WHEN FED (/tmp/probe-unreachable2.mjs), after one hand-made requireDecision:
  openDecisions: 1
  take_decision_action: {"ok":true,"value":{"ok":true},"events":[]}
  openDecisions after: 0
So this is a missing write, not a broken room.

THE REBATE DEADLINE IS REAL, DATED AND SILENT. rebate.ts:209-217 `whyNot()`: `if (sim.now >= turnsOver) return 'too-late';` where `turnsOverOn(project)` (rebate.ts:64) is `baseWindowOf(project)?.from` — the first day of photography. rebate.ts:285 says it out loud: "the deadline was the first day of photography and it passed a long time ago."

PROBE (/tmp/probe-unreachable3.mjs) — €20m feature, doors opened with real commands:
  greenlight: {"ok":true,"id":"project_00001g"}
  turnsOverOn: 2026-06-15   now: 2026-03-02
  days until the door shuts: 105
  whyNot now: undefined
  decisions raised by greenlight: 0
  notifications at greenlight: ["Halla Is The Production Accountant","Rivera Pictures Is On Skatturinn","Hvitserkur Is Greenlit"]
  AFTER the door shuts:
    whyNot: too-late
    decisions: 0 | openDecisions: 0
    notifications since greenlight: ["...The Crew Comes On","Sugar Land Studios: A Month Of It","...Prep","...Somebody Comes On","Stage 3 Is Booked","...The Rest Of The Parts Are Filled","...Principal Photography"]
    any that mention the claim? false
    spentCents at +400d: 2018807804 | certifiable: 1660643904
    forgone at the low rate (25%): 4,151,609.76 EUR
105 days of runway, fifteen notifications about crew and prep, not one word about the claim, €4.15m gone — 20.8% of the negative. The ledger is UNDERSTATED on cost.

THE ONLY PLACE IT IS PRINTED is inside a modal you must already know to open: BusinessWorkspace.tsx:786-790, `<Stat label="Applications Close" ... note="The first day of photography, and it never reopens" />`. Nothing pushes you there.

OVERSTATEMENT CHECK: "Every deadline in the build goes unannounced" is too broad — delivery IS announced (making.ts:1391 "Is Due And Isn't Finished", :1402 "Isn't Delivered"). The rebate is the genuinely silent one. A second date exists but is worse than silent: a holding's `expiresAt` (set company.ts:693, printed business.tsx:436 and BusinessWorkspace.tsx:304) is never enforced, because `capabilitiesOf` reads `holdingsOf(u)` with no expiry filter (company.ts:184) — so an expired option still opens the greenlight door. Do NOT raise a decision for that one; give it teeth first or leave it.


**Fix**

~15 lines across two files, no new types, no new imports beyond two names.

1. world/making.ts already imports from './rebate' at line 63 (`import { armTheClaim } from './rebate';`) — widen to `{ armTheClaim, turnsOverOn, whyNot }`. Immediately after the `${project.title} Is Greenlit` notify (making.ts:663-673) add:

  const shuts = turnsOverOn(project);
  if (shuts !== undefined && whyNot(sim, project) === undefined) {
    sim.requireDecision({
      urgency: 78,
      category: 'business',
      title: `${project.title}: Apply For The Reimbursement`,
      detail: `The application closes on the first day of photography, ${formatDate(shuts, sim.homeZone)}, and it never reopens.`,
      route: '/workspace/business',
      actions: [{ label: 'Apply', commandKind: 'company.claim_rebate', payload: { projectId: project.id } }],
      dueAt: shuts,
      refType: 'project',
      refId: project.id,
    });
  }

`formatDate` is already imported at making.ts:38. `company.claim_rebate` is already registered (rebate.ts:366-371), so `world.take_decision_action` (world.ts:44-56) executes it and stamps `resolvedAt` with no further wiring.

2. world/rebate.ts — one line in `applyForRebate`, after `project.rebate = { appliedAt: sim.now, shareAt }` (rebate.ts:252), so the Business workspace's own Apply button also clears the item:
  sim.resolveDecision('project', project.id, 'business');

Expiry needs nothing: `expireDecisions` (world.ts:96-104) already closes anything past `dueAt` on the two-day world tick, and `stageOf` (attention.tsx:144-150) renders that as 'ran out' — exactly the right sentence for a missed claim.

One judgement call (the urgency figure: 78 lands in Home's 'high' stripe, below the 85 'critical' band — right for expensive-but-not-imminent) and one cosmetic: add `business: 'the office'` to RAISED_BY at attention.tsx:76-87, which has no 'business' key today and falls through to "the business side of things".


**Risk**

- `requireDecision` dedupes on category+refType+refId (simulation.ts:646-653). Category 'business' + refType 'project' claims that triple; any later business decision about the same project silently merges into this one. If more than one is ever wanted, give this its own category — `raisedBy`/`categoryLabel` (attention.tsx:89-94) already fall back gracefully for unknown categories.
- Home shows only `decisions.slice(0, 6)` (Home.tsx:171) sorted by urgency (`openDecisions`, world.ts:127-131). Seven greenlit pictures push other things off the visible list.
- `expireDecisions` auto-dismisses anything untouched for 90 days (world.ts:103) while the rebate runway measured 105 days in the probe — so an unanswered decision would go quiet ~15 days BEFORE its due date, while still actionable. Check QUIET_AFTER_DAYS (attention.tsx:45) against the runway, or raise the decision later than greenlight. This is the one thing that will bite.
- `prune` (world.ts:110-118) deletes closed decisions 180 days after close.
- `resolveDecision` matching on refType+refId alone would close any future project decision — pass the category as shown.
- tests/rebate.test.ts's `makeIt()` greenlights, so those tests now each create a decision; I found no test asserting `decisions` is empty, but check before landing. tests/looks.test.ts:113 is unaffected.
- `validateUniverse` re-stamps `Object.values(universe.decisions)` (index.ts:439); nothing there changes.


**What the adversary added**

THE OWNER MUST PICK ONE OF THREE. All are defensible; this is not a one-liner.

OPTION A — DELETE THE ROOM (smallest, most honest by THE ONE RULE). Remove `decisions` from domain/model.ts:1116, the bootstrap seed at world/bootstrap.ts:247, the migration `record('decisions', 'the decision center')` at index.ts:334 and the re-stamp at :439; delete `world.take_decision_action` and `world.dismiss_decision` (world/world.ts:33-57), `expireDecisions` and the decisions half of `prune` (world.ts:96-119), `openDecisions` (world.ts:127) and its use in `lifeSnapshot`, the "What Needs You" decision branch in Home.tsx:152-224 (keep the notifications half), the whole `defineLook<DecisionItem>('decision', ...)` at looks/attention.tsx:177-300, `requireDecision`/`resolveDecision` at simulation.ts:633-676, the fixture at tests/looks.test.ts:113 and the `it.todo` at smoke.test.ts:95. Cost: you lose the only machinery for a dated prompt, and every future deadline has to rebuild it. I do NOT recommend this — the room is correct, it is just unfed.

OPTION B — FEED IT, BUT FIX THE TRIGGER THEY GOT WRONG (my recommendation). Their placement at greenlight is the bug. Do it on the world tick instead, in `runWorldTick` (world/world.ts:86-94), beside `expireDecisions`, so it re-asks every two days and catches the player who opens the books mid-prep:

  // world/world.ts — new import { turnsOverOn, whyNot } from './rebate'
  function theClaimsStillOpen(sim: Simulation): void {
    for (const project of Object.values(sim.universe.projects)) {
      if (whyNot(sim, project) !== undefined) continue;      // covers already / no-dates / too-late / scheme-ended / no-books
      const shuts = turnsOverOn(project)!;
      sim.requireDecision({
        urgency: 78, category: 'business',
        title: `${project.title}: Apply For The Reimbursement`,
        detail: `The application closes on the first day of photography, ${formatDate(shuts, sim.homeZone)}, and it never reopens.`,
        route: '/workspace/business',
        actions: [{ label: 'Apply', commandKind: 'company.claim_rebate', payload: { projectId: project.id } }],
        dueAt: shuts, refType: 'project', refId: project.id,
      });
    }
  }

`requireDecision` already dedupes on category+refType+refId (simulation.ts:644-651), so the two-day repeat updates one item rather than piling up. Their second edit is still needed and is correct: one line in `applyForRebate` after rebate.ts:252, `sim.resolveDecision('project', project.id, 'business')`, so the workspace's own Apply button clears the item. Note their urgency of 78 is a real judgement call — it lands in Home's 'high' stripe (Home.tsx:172: >=85 critical, >=65 high). Given the probe measured EUR 5.95m against a EUR 6,000 filing fee, I would argue for >=85 and let it sit in 'critical'; that is the owner's call, not mine.

OPTION C — GIVE IT A SECOND ANSWER FIRST, THEN FEED IT. The reason B still smells is that the button is strictly dominant. If the Decision Center is meant to hold decisions rather than chores, put a real fork in it before you raise it: two actions, "Apply At 35%" versus "Wait For The Cast" — because `limbsOf(sim, project, 'plan')` reads `awayOnTheCast`, and a picture that intends to import leads will fall below the higher rate's spend limb once they are seated. Today that means applying early is free money, which is exactly why it is not a decision. Making the wait meaningful (e.g. the higher rate re-tested on the books at payment, or a filing window that reprices) is real design work and out of scope for a cleanup pass. If the owner does not want to do that work, take B and accept that this item is a deadline reminder, and say so in the code comment rather than calling it a decision.

WHATEVER IS PICKED, note what their fix incidentally revives: `looks/attention.tsx:130-135` documents `refType` as "pass-through of a value no caller supplies". The moment a decision carries `refType: 'project'`, `subjectForRef` starts resolving and `wayTo` starts painting a way onto the project look. That is a second dead declaration coming alive, which is good, but it is newly exercised code.


### The audit trail is a persisted, empty table, and the history table is a sleep diary.

**Cluster** `unreachable` · **Severity** serious · **Verdict** STILL_TRUE


**Files** `/home/user/1221/src/engine/core/audit.ts`, `/home/user/1221/src/engine/core/simulation.ts`, `/home/user/1221/src/engine/systems/life.ts`, `/home/user/1221/src/engine/world/world.ts`, `/home/user/1221/src/engine/index.ts`, `/home/user/1221/src/ui/looks/subject.ts`


**Evidence**

THE AUDIT TRAIL. `audits: AuditRecord[]` at model.ts:1114, seeded at bootstrap.ts:247, declared to the migrator as `list('audits', 'the audit trail')` at index.ts:339, re-stamped at index.ts:442, capped at `MAX_AUDITS = 4000` in core/audit.ts, counted in `simulationLoad` at world.ts:172 and budgeted at 620 bytes a record in `estimateSize` at world.ts:186. Everything a real table has except a writer.

`sim.audit()` — core/simulation.ts:594-602 — has ZERO callers. Grep across src and tests for `sim.audit|.explain(|recordAudit` returns only the definition. The read side is dead too: `Historian.auditFor`, `Historian.auditsFor`, `Historian.timeline`, `redactForPlayer` and `buildFactors` (all core/audit.ts) have zero callers outside their own file. `AuditFactor.knowable` and the 17-line doc comment at audit.ts:1-17 about knowledge gating describe a mechanism that has never run once.

THE HISTORY TABLE. `sim.remember()` (simulation.ts:604-611) has exactly ONE caller in the whole engine: systems/life.ts:153, inside `life.sleep`:
    s.remember({ category: 'life', title: hours >= 7 ? 'Slept well' : 'Short night', detail: `${hours.toFixed(1)} hours, waking at ${formatTime(s.now, s.zone)}.`, refs: [{ type: 'person', id: person.id }], significance: 3, public: false });
That is the only thing the world remembers. The file header (audit.ts:9-12) claims: "every milestone writes a history record, so that years later the player can look back at where they lived, what they drove, who they dated and what they made."

PROBE (/tmp/probe-unreachable.mjs), fresh save advanced three years, no input:
  three years: audits: 0 | history: 0 categories: {} | history titles: [] | notifications: 75
  load: {"people":3,"pendingEvents":4,"totalScheduled":621,"transactions":328,"history":0,"audits":0,"estimatedBytes":288200}
PROBE (/tmp/probe-unreachable2.mjs), after one `life.sleep`:
  history after one sleep: 1 [{"c":"life","t":"Slept well"}]
  audits after one sleep: 0
PROBE (/tmp/probe-unreachable3.mjs), a €20m picture greenlit, crewed, cast and shot over 400 days:
  audits: 0 | history: 0
A picture was made from nothing and the world remembered none of it.

THE LEDGER IS UNDERSTATED ON BOTH HALVES. "Persisted, empty table" undersells it: the audit trail's readers, its redaction rule and its factor-normaliser are all dead too — the whole of core/audit.ts's first stated job, roughly half the file. And "sleep diary" undersells it: history is EMPTY until the player manually issues `life.sleep`, and `Historian.timeline()` — the only function that could display it — is called by nothing. It is a write-only sleep diary.

ONE THING HAS MOVED SINCE THE LEDGER (adjacent, deserves its own line). looks/subject.ts:43-49 still asserts "there is not one literal `refType` written anywhere in the engine today — every one is pass-through of a caller-supplied value that no caller supplies." That is now false: the engine writes `refType: 'project'` 40 times, `refType: 'audition'` 9 times, `refType: 'property'` once. `subjectForRef` resolves them — but `lookKinds()` has no 'audition' and no 'property' kind (it has 'house' and 'estate', not 'property'), so nine notifications resolve to a subject whose look is undefined and `resolveLook` (registry.ts:137-140) returns undefined.


**Fix**

Two separate decisions; do not treat them as one.

THE AUDIT TRAIL — delete. Remove `Simulation.audit` (simulation.ts:594-602), `Historian.recordAudit`/`auditFor`/`auditsFor`, `MAX_AUDITS`, `AuditFactor`, `AuditRecord`, `redactForPlayer` and `buildFactors` from core/audit.ts; the `audits` field from `SaveUniverse` (model.ts:1114); `audits: []` from bootstrap.ts:247; `list('audits', ...)` from index.ts:339; `stamp(universe.audits)` from index.ts:442; the `audits:` line from `simulationLoad` (world.ts:172); and the `u.audits.length * 620` term from `estimateSize` (world.ts:186). Bump `SAVE_SCHEMA_VERSION` (model.ts:905). THE ONE RULE decides this: 90-odd lines of declared explainability that has never explained anything, when the game already has a better answer to "why did this happen" — the `defineLook` system, 47 registered kinds deep, which explains outcomes from live state rather than a recorded post-hoc factor list. Wiring `sim.audit()` would build a second, worse explanation system alongside a working one.

THE HISTORY TABLE — a real choice, and the owner should make it:
  (a) DELETE, symmetric with the audits cut: remove `sim.remember`, `HistoryRecord`, `Historian.recordHistory`/`timeline`, the `history` field and the one call at life.ts:153.
  (b) WIRE, ~8 lines. There are already 41 `sim.notify(...)` calls in the engine and the consequential ones carry refType/refId. The milestones the header promises are exactly the ones that already notify: `Is Greenlit` (making.ts:667), `Is Delivered` (making.ts:1301), `The Reimbursement Lands` (rebate.ts:340), and being cast (audition.ts). Put a `sim.remember(...)` beside four or five of those, then render it — `Historian.timeline({ limit })` already exists and is already correct; it needs a caller and a panel.
I recommend (b) for history and (a) for audits. History has a reader waiting (`timeline`), a natural home (Home.tsx:140-150 already renders a recent-`entry` list) and a premise that asks for it — SLATE is a life simulator and a life you cannot look back on is the thing it is most obviously missing. Audits have no such argument. Done in that order, the two cuts do not collide: `Historian` survives with one job instead of two.


**Risk**

- `APPEND_ONLY_LOGS = ['transactions', 'audits', 'history', 'notifications']` in core/simulation.ts (just below :700) is the transaction-rollback fast path — it truncates these four instead of cloning them, explicitly because they are the collections that grow without bound. Removing a name from that array is REQUIRED and getting it wrong means a failed command no longer rolls back cleanly. This is the single highest-risk touch in the cut.
- `SaveUniverse` shape change on both paths: `validateUniverse` (index.ts:311-342) and `SAVE_SCHEMA_VERSION` (model.ts:905, now 78) must move together, and persistence/{local,base44,adapter}.ts round-trip the universe.
- `estimateSize` (world.ts:179-188) feeds the developer-console save-size figure; dropping the audits term changes that number.
- tests/simulation.test.ts:399-406 pushes directly onto `universe.history` and asserts `universe.history.at(-1)?.title` — breaks under option (a), survives under (b).
- If you wire history (b): `remember` takes `refs: { type, id }[]`, a DIFFERENT shape from the `refType`/`refId` pair on decisions and notifications, and `subjectForRef` (subject.ts:51-54) only handles the pair. A linking timeline needs a second resolver, or normalise `refs` to the pair.
- If you wire history: it is the one collection with NO cap — `recordHistory` just pushes, and `prune` (world.ts:106-118) prunes the timeline and decisions but not history. Five milestones a picture over a forty-year save is fine; five a week is not. Add a cap or a significance floor at the same time.


**What the adversary added**

AUDITS — delete (I agree), but their list is missing two items, and both are hard breaks:
(a) src/engine/core/simulation.ts:699, `const APPEND_ONLY_LOGS = ['transactions', 'audits', 'history', 'notifications']`. `snapshotUniverse` (:706) and `restoreUniverse` (:742) iterate it and run on EVERY command (simulation.ts:447, :458). Drop `audits` from `SaveUniverse` and leave the tuple alone and `const list = u[key] as unknown[]; logLengths[key] = list.length` reads undefined. tsc catches the index type, but it is not in their list.
(b) src/engine/core/ids.ts:28, `| 'audit'` in the `IdNamespace` union. Its only `nextId('audit')` call site is inside the method being deleted (simulation.ts:597). Delete the method, leave the union member, and tools/wired.mjs check 1 goes 104 → 105; docs/UNWIRED.json baselines "Id namespaces" at 104 and `npm run gate` runs `node tools/wired.mjs --check`, which `process.exit(1)`s the moment any count rises (wired.mjs:204-221). Their fix as written red-lights the gate. Delete `| 'audit'` in the same commit; the count stays 104 of 124.
Everything else on their audit list is correct and I verified each site: model.ts:1124, bootstrap.ts:255, index.ts:341 and :444, world.ts:172 and :185, audit.ts:21-59/86/90/95-99/110-120/138-175, and SAVE_SCHEMA_VERSION. No test anywhere touches `universe.audits` — grep across tests/ returns nothing — so the audit cut breaks no test.

HISTORY — this is the owner's call, and I would frame it differently from them:
(a) DELETE. Costs three edits they did not name: src/engine/index.ts:376 (drop the relabel line), tests/simulation.test.ts:395-407 (the "leaves a sentence in a title field alone" test is BUILT on a HistoryRecord and needs a different carrier — `notifications` already has a Title-Case relabel at index.ts:377 and would do), tests/endurance.test.ts:115-116 and :195 (drop the invariant and the fingerprint term). Plus `'history'` from ids.ts:28 and APPEND_ONLY_LOGS, and the world.ts:171/184 terms.
(b) WIRE. I agree with them that this is the better answer and their four sites are the right ones — making.ts:667 `Is Greenlit`, making.ts:1301 `Is Delivered`, rebate.ts:340 `The Reimbursement Lands`, and being cast in audition.ts. Two things to add to their plan that they did not cost: the single existing writer (life.ts:153) will bury those milestones — one record per night against four a picture — so either raise the milestones' `significance` above 3 and have the reader call `timeline({ minSignificance: 10 })`, or stop writing the sleep record. And `HistoryCategory`'s other 13 members stay dead unless the four new writers spread across 'career', 'project' and 'finance', which they naturally do.
My recommendation matches theirs — (a) for audits, (b) for history — with the two gate items above folded into the audit commit.

A THIRD FIX THEY DID NOT PROPOSE, AND I WOULD DO IT FIRST: harden tools/wired.mjs check 5 so a write site inside an unreachable function does not count. Cheapest honest version: after finding the write site, require that the enclosing exported function name appears somewhere in `everywhereBut` its own declaring file. That flips `audits` from clean to dead today, which is the point — otherwise the next table lands the same way and UNWIRED.json keeps printing 0.

RISK, specifically:
- `snapshotUniverse`/`restoreUniverse` run on every `sim.execute`; a half-done audits removal breaks every command, not just a screen.
- `npm run gate` chains wired.mjs --check, deciders --check, inventory --check; wired is the one this trips.
- Bumping SAVE_SCHEMA_VERSION invalidates any blessed save under tools/seed-save.mjs and the base44 contract fixtures — check tests/persistence.test.ts and tests/base44-contract.test.ts pass after the bump (neither references `audits`, so I expect clean, but the version number itself is asserted in places).
- tests/endurance.test.ts:195's determinism fingerprint is the one place where touching `history` changes a passing assertion silently rather than loudly: removing the term weakens the test, it does not fail it.


### Three signable guilds, a registry, a policy and a company form can be reached only as a blocker chip.

**Cluster** `seasons-misc` · **Severity** serious · **Verdict** PARTLY_TRUE


**Files** `/home/user/1221/src/ui/workspaces/BusinessWorkspace.tsx`, `/home/user/1221/src/ui/looks/business.tsx`, `/home/user/1221/src/engine/world/company.ts`, `/home/user/1221/src/engine/content/incorporation.ts`, `/home/user/1221/src/engine/domain/company.ts`


**Evidence**

Correct on the mechanism and on three of the four counts; UNDERSTATED on policies — it is two, not one.

THE MECHANISM. The only UI that fires `company.register` / `company.sign` / `company.insure` / `company.form_arm` is the `Missing` component, src/ui/workspaces/BusinessWorkspace.tsx:165-220, which renders one button per `Blocker` inside a SHUT capability door. Repo-wide grep confirms those four command kinds have exactly one call site each, all inside that switch (:181, :184, :187, :191). The `register`, `guild` and `cover` drill-down looks (src/ui/looks/business.tsx:240-385) render full content pages for every guild, registry and policy — with `Deposit`, `A Year Of It`, `What It Costs` stats — and carry no action at all. So anything never named as a blocker cannot be bought.

WHICH THINGS ARE NEVER BLOCKERS. Probe /tmp/probe/p2.mjs walked the entire capability sequence from boot to all nine doors open, harvesting every blocker that ever appeared:
  ALL blockers ever seen: [ arm:us, guild:sag_aftra, holding:, policy:errors_omissions, policy:general_liability, policy:production_package, policy:workers_comp, registry:is_employer, registry:us_ein, role:accountant, role:production ]
  capabilities now: trade=true reclaim_vat=true employ_here=true employ_americans=true own_material=true insure_a_shoot=true claim_rebate=true deliver=true greenlight=true
  Guilds signable: [ sag_aftra, wga, dga, iatse ]
  Registries:      [ is_companies, is_vat, is_employer, us_state, us_ein ]
  Policies:        [ general_liability, workers_comp, errors_omissions, production_package, property, business_interruption ]
  Forms:           [ ehf, hf, llc, inc ]
Subtracting:
  GUILDS — 3 unreachable: `wga`, `dga`, `iatse` (src/engine/content/incorporation.ts:262-291). LEDGER CORRECT. Each carries a `binds`, an `agreement` and a real `depositCents` (€10k / €15k / €20k) and none can ever be signed. `is_actors` and `is_crew` are `signable: false` and `company.sign` refuses them by design (src/engine/world/company.ts:597-599) — correctly not counted.
  REGISTRIES — 1 unreachable: `us_state`, "The American Filing" (src/engine/content/incorporation.ts:136-143). LEDGER CORRECT — and worse than the ledger says: `company.form_arm` (src/engine/world/company.ts:553-591) creates the Delaware arm and writes NO registration, so after forming it the register look at src/ui/looks/business.tsx:257 prints "The company isn't on it. An American guild signs with an American company. This is that company." while that company is sitting in the save. Probe confirms: registrations after the full walk are [is_companies, is_vat, is_employer, us_ein] — no us_state.
  POLICIES — 2 unreachable: `property` AND `business_interruption` (src/engine/content/incorporation.ts:371-384). LEDGER UNDERSTATES BY ONE. Both are `standing: true`, both are written for a company that owns its own lot ("A burnt stage costs twice"), €60k and €18k a year, and neither is named by any capability. Boot binds zero policies (probe: `policies []`).
  FORMS — 1 unreachable: `inc`. LEDGER CORRECT. `ehf` is used at src/engine/world/company.ts:353, `hf` at :357 (the sugar group), `llc` is the hardcoded default at :558 (`payload.form ?? 'llc'`), and the only caller passes `{}` (src/ui/workspaces/BusinessWorkspace.tsx:184). Nothing can ever ask for `inc`.

So the honest count is: three signable guilds, a registry, TWO policies and a company form.


**Fix**

The blocker chip is the wrong affordance for all of it — it is a fix-what-is-broken control being used as the only shop. Three options:

(a) Put a button on the page that already describes the thing. The `guild`, `register` and `cover` looks in src/ui/looks/business.tsx:240-385 already render every fact and already compute whether it is held (`signed`, `on`, `bound`). Add a `ways`/action that runs the same command the chip runs. This is my recommendation: it is the smallest change, it makes the 40-odd lines of content per entry mean something, and it leaves the blocker chip as what it should be — a shortcut to a page that exists anyway. It fixes all seven in one pass.

(b) Give each one its own door. Widen `CapabilityId` in src/engine/world/company.ts:114 and add capabilities that the missing things block — e.g. `employ_american_writers` blocked by `wga`, `employ_american_directors` by `dga`, `crew_an_american_shoot` by `iatse`, `own_a_lot` by `property` + `business_interruption`. More honest (the doors are the design), but it is four new doors, each needing a reader that makes the door matter, or you have just moved the One Rule violation one level up.

(c) Delete what nothing will ever need. `inc` is genuinely spare (the arm exists to sign, not to take investment) and is the one entry I would cut rather than wire — src/engine/content/incorporation.ts:74-81 plus the `'inc'` member of `CompanyForm` at src/engine/domain/company.ts:52.

Separately and independently of all three, one MECHANICAL fix: `company.form_arm` should write the `us_state` registration it just performed. src/engine/world/company.ts:553-591 already has `numberFor('us_state', seed)` sitting in the file (src/engine/world/company.ts:315) generating a Delaware filing number that nothing ever calls. That is the register describing a filing the code does without recording it.


**Risk**

(a) is contained: the three looks already resolve the held/not-held state, so the only new thing is a `run` call and an error line. Watch that `company.insure` for `errors_omissions` has a pre-condition (src/engine/world/company.ts:635-645: the underwriter reads the chain of title), so the button must surface the refusal string rather than assume success.
(b) moves `capabilitiesOf`, which is read by `wouldBe` (src/engine/world/making.ts:445 — the greenlight door), `whyNot` (src/engine/world/rebate.ts:213 — the 'no-books' refusal), `whereItStands` (src/engine/world/company.ts:288, which prints "can do N of the M things"), and the door list in BusinessWorkspace. Adding doors changes that N-of-M sentence and can shut the greenlight if a new door is wired into it.
(c) `CompanyForm` is persisted on every `Company` row; removing a member is safe only because no save can contain it, which the probe confirms.
The `us_state` fix: `onRegister` is a global lookup with no company filter (src/engine/world/company.ts:91), so writing the registration makes `needRegistry(u,'us_state')` satisfiable everywhere at once — harmless today since nothing requires it, but it is the reason `us_ein` and `us_state` cannot be told apart by jurisdiction alone.


**What the adversary added**

THREE CORRECTIONS TO THEIR WRITE-UP.

A. THEIR RECOMMENDED FIX (a) DOES NOT "FIX ALL SEVEN IN ONE PASS". It fixes six. `us_state` cannot be registered by ANY route, including a direct engine command, because the American arm has no bank account. `company.register` sends an American registry to `americanArm(u)` (src/engine/world/company.ts:540), and `payFor` → `purse()` (:507-511) finds no `company_cash` account owned by the arm. `company.form_arm` (:568-605) writes a `Company` and nothing else — no account. Probe /tmp/probe-rc/p3.mjs:
  immediately after form_arm, us_state -> {"ok":false,"error":"The company has no account to pay from."}
  after 400 days, arm accounts: []
  after 400 days, us_state -> {"ok":false,"error":"The company has no account to pay from."}
  parent cash: 11036129
  us_ein (free) -> {"ok":true,"id":"reg_000003"}
`us_ein` only succeeds because it costs 0 and `payFor` short-circuits on `amount <= 0` (:520). So a "Register With Delaware Division of Corporations" button added to the register look would be a button that can never succeed, in a game whose stated promise is that a shut door names the one thing shutting it. Option (a) must be paired with the MECHANICAL form_arm fix, or it makes things worse for this one.

That MECHANICAL fix is better-founded than they argue: `FORMS.llc.formationCost` is `cents(1_200)` (src/engine/content/incorporation.ts:70-76) and `REGISTRIES.us_state.cost` is `cents(1_200)` (:136-143) — the same fee. `form_arm` already charges the Delaware filing fee, out of the PARENT's purse (`payFor(s, parent.id, facts.formationCost, ...)`, :576), which is why it works where `company.register('us_state')` cannot. So the honest fix is: form_arm writes the `Registration` for `us_state` against the arm, and `company.register` then refuses it with "Already on Delaware Division of Corporations." via the existing `onRegister` guard (:536). That is the ONLY route by which us_state can ever exist.

B. THEIR us_state EVIDENCE IS OVERSTATED. They write that the register look "prints 'The company isn't on it...' while that company is sitting in the save". No player ever sees that sentence, because the us_state page is itself unreachable. Probe /tmp/probe-rc/p2.mjs walked the same ladder and then compared every declared id against the only two inbound links in the UI — held records (BusinessWorkspace.tsx:1358/1376/1393, which render `Open` only for registrations/signatures/policies the company HAS) and the `door` look's blocker ways (src/ui/looks/business.tsx:186-197):
  REGISTERS: reachable page = [is_companies,is_vat,is_employer,us_ein]  ORPHAN = [us_state]
  GUILDS   : reachable page = [sag_aftra]                               ORPHAN = [wga,dga,iatse,is_actors,is_crew]
  COVERS   : reachable page = [general_liability,workers_comp,errors_omissions,production_package]  ORPHAN = [property,business_interruption]

C. AND THAT MAKES THE CLAIM UNDERSTATED OVERALL, not overstated. It is not that these things "can be reached only as a blocker chip" — they cannot be reached at all, not even to READ. Nine look-page ids have no inbound link from any screen. `is_actors` and `is_crew` are correctly excluded from the signable count, but their ~20 lines each about kjarasamningar and the Icelandic collective floor are equally unread by any player. The only thing that reaches these pages is `seeds()` (business.tsx:247/299/361) feeding tests/looks.test.ts:148-149 — a crawl that primes its queue from seeds, so its "reaches every declared kind from a seed" assertion (:347) checks kind coverage, never id reachability. The test proves the pages render; it cannot prove anyone can open them.

D. MINOR SLOPPINESS. "`numberFor('us_state', seed)` sitting in the file ... that nothing ever calls" — src/engine/world/company.ts:330 is `case 'us_state': return ...` inside `numberFor`'s switch, which `company.register` calls generically at :551. It is a dead branch, not a dead call. Same conclusion, wrong description.

MY RECOMMENDED FIX (differs from theirs in sequencing):
1. MECHANICAL, do first, independent of everything else: `company.form_arm` (src/engine/world/company.ts:568-605) writes the `us_state` `Registration` it has just paid for — same shape as the one in `company.register` (:547-556), `companyId: arm.id`, `number: numberFor('us_state', ...)`, `nextDueAt: addMonths(s.now, 12, s.homeZone)`. This retires the dead switch branch, makes the register page tell the truth, and is the only way us_state can ever exist.
2. DESIGN_DECISION, the owner picks: their (a) for the other six — add an action to the `guild`/`cover` looks in src/ui/looks/business.tsx:283-385 that runs `company.sign`/`company.insure`. But this requires widening `Looked` with an action affordance, which the type deliberately does not have ("A screen names a subject; it never writes a body... the edges are never buried inside it", registry.ts:9-14). That is a real architectural change to the look contract, not a small one — they undersell it. Their (b) — new capabilities in `CapabilityId` (company.ts:114) — keeps the look layer pure and is the design-true answer, but as they say it needs four new doors each with a reader, or the One Rule violation just moves up a level.
3. I would take (c) further than they do: `inc` is spare and so, arguably, are `property` and `business_interruption` — they describe a lot-fire risk the simulation does not model at all (no peril event exists in world/lot.ts or content/lot.ts). Wiring them buys a premium payment and nothing else. The falsifiability test says delete, not wire, unless a lot peril is actually coming.

RISK / WHAT MOVES:
- `tests/business.test.ts:296` — `expect(run(sim, 'company.insure', { policy: 'property' }).error).toContain('hasn’t got it')` is the ONLY test naming `property`. Deleting `property` from `PolicyKind` (src/engine/domain/company.ts:216) turns that error into "There's no such cover." and the test fails. They did not name this caller.
- Writing the us_state registration in form_arm shifts `numberFor`'s seed for every subsequently-created registration, because the seed is `s.now / 1000 + Object.keys(s.universe.registrations).length * 7919` (company.ts:551). us_ein's printed number changes. No test asserts a registration number (grep `\.number\b` over tests/ returns nothing), and `nextDueAt` is read only for display at src/ui/looks/business.tsx:274-278 — nothing charges or lapses on it — so the blast radius is cosmetic. `tests/business.test.ts:88` asserts the boot registry list only, before any arm exists, so it is untouched.
- Deleting `'inc'`: `FORM_BY_ID` is `Record<CompanyForm, FormFacts>` built from `FORMS`, so removing the member and the entry together keeps the record total and typecheck green. Nothing in the save writes form 'inc' (`grep "form: "` over src/engine/ gives only 'hf' at :372, 'ehf' at :395, and `payload.form ?? 'llc'` at :572), so no persisted save can carry it.
- Adding capabilities (option b) moves `openDoors()` — `tests/business.test.ts:349` asserts `expect(openDoors(sim)).toBe(2)` at boot and `toBe(9)` after the ladder, and `whereItStands` prints "Everything is in place". Both break on any new `CapabilityId`.


## Refuted (20)

Claims the ledger made that do not survive contact with the code.


### The note's magnitude has one right answer in every state, and the tests pin it — four buttons {0,0.5,1,1.7}, All The Way never beaten across 117,306 enumerated states, Leave It never among the best, 12.1% of states where all four are identical inside CLOSE_ENOUGH.

**Cluster** `audition-room`


REFUTED — the other auditor read the COMMITTED file (HEAD) while the fix sits uncommitted in the working tree. This is exactly the stale-ledger trap the brief warned about, and they fell into it twice: the ledger line they "independently reproduced" is the commit message of a857f5a ("Measure the one decision in the room, and find it has one answer"), whose own body says "No fix here, deliberately" and which touched only docs/UNBITTEN.md and incorporation.ts. The fix landed afterwards, as working-tree edits (`git status`: M src/engine/content/audition.ts, M src/engine/world/audition.ts, M src/engine/domain/model.ts, M src/ui/workspaces/AuditionsWorkspace.tsx, M tests/audition.test.ts, M docs/UNBITTEN.md). Task #57 "The room: kill the identity, and make readiness the downside" still reads `pending` on the task list, which is what misled them — the task is stale, the code is not.

EVERY LOAD-BEARING STRING THEY QUOTED IS GONE FROM THE LIVE FILE.

Their quote: `const asked = (wants[shade.id] ?? 0) - played[shade.id];` / `out[shade.id] = clamp(Math.round(played[shade.id] + asked * how.share), ...)` at audition.ts:520-524. Live code, src/engine/world/audition.ts:354-365 (not 520):

  export function afterTheNote(
    played: Reading, note: { shade: string; toward: number },
    howFarId: string, sure = 1, roll = 0,
  ): Reading {
    const how = howFarById(howFarId);
    const shade = shadeById(note.shade);
    if (!how || !shade) return played;
    const heard = roll < sure ? note.toward : -note.toward;
    const out = { ...played };
    out[shade.id] = clamp(played[shade.id] + heard * how.steps, -FURTHEST, FURTHEST);
    return out;
  }

`wants` is no longer a PARAMETER. Probe confirms `afterTheNote.length (arity) = 3`, was 4. The function is now structurally incapable of reading the hidden truth — which is a stronger fix than their own recommended (A), because (A) still derives `said` from the true gap and merely noises it.

The four buttons are not {0,0.5,1,1.7} shares. Probe output: `HOW_FAR now = none:Leave It=0 | touch:A Touch=1 | good:A Good Deal=2 | far:As Far As It Goes=3`, and `has .share? false  has .steps? true`. content/audition.ts:178 declares `/** How far the player moves, in shade steps. Absolute, not a share. */ steps: number;`. There is no button called "All The Way" or "Past It" any more; those labels exist only in `git show HEAD:src/engine/content/audition.ts`. Their citation of content/audition.ts:196 promising "It can be the thing that wins the room" now reads, in full, "...and if you have misread the room it's the thing that loses it."

I RE-ENUMERATED ALL 117,306 NOTED STATES AGAINST LIVE CODE (/tmp/probe-refute.mjs, npx vite-node; my keen model verified against the real decideAudition by bisection, max error 9.09e-13). Their four headline numbers all invert:

  sure=1.00 (sharp)  best incl ties: none 13.54% | touch 23.20% | good 36.01% | far 95.88%
                     UNIQUELY best : none 0% | touch 0% | good 3.14% | far 63.99%
                     strictly beats "far": none 1152 | touch 1152 | good 4832
  sure=0.65 (flat)   best incl ties: none 21.00% | touch 15.93% | good 15.06% | far 75.97%
                     UNIQUELY best : none 12.87% | touch 5.61% | good 2.08% | far 63.99%
                     strictly beats "far": none 20090 | touch 22258 | good 16900

"Never beaten across 117,306 states" — the biggest button is strictly beaten 6,832 times at perfect readiness and 59,248 times on a bad day. "Leave It never among the best" — it is UNIQUELY best in 15,102 states (12.87%). Both claims are dead.

Their "understatement #1" is also dead. From the {0,0,0} opening they built their case on (/tmp/probe-opening.mjs), P(all four buttons identical | a note) = 0.1579 at sure=1 and 0.0000 at any readiness below perfect — not their 0.2744. And the ranking INVERTS with readiness, which is the whole point:

  sure=1.000  E[cast] from {0,0,0}: none 0.5466 | touch 0.6536 | good 0.7345 | far 0.7732
  sure=0.650  E[cast] from {0,0,0}: none 0.5466 | touch 0.5736 | good 0.5839 | far 0.5717

On the floor, "As Far As It Goes" (0.5717) drops BELOW "A Good Deal" (0.5839). The best button is now a function of how rested you are, via heardItRight (audition.ts:~330) and MISREAD_THE_ROOM=0.35: below full readiness there is a real chance `heard = -note.toward` and three steps of commitment become three steps of wrong. That is a genuine trade, and it is the trade the old code did not have.

Their test citations are stale too. tests/audition.test.ts:602-604 does NOT assert "full lands exactly on the want" — that assertion (`expect(after[note.shade]).toBe(wants[note.shade])`) was DELETED. The replacing test is named "moves the number of steps the player chose, and never the hidden distance" and asserts the opposite: `expect(far[note.shade]).not.toBe(wants[note.shade])`. The suite now encodes non-dominance as correct behaviour. `npx vitest run tests/audition.test.ts` → 53 passed (53). `npm run typecheck` → clean. This is finished, shippable work, not a half-edit.

Their three proposed options are all now wrong: (A) would re-introduce a read of the true gap that has just been removed; (C) would delete a decision that measurably works. Only (B)'s target survives — see fixNotes.


### BONUS (not in the ledger): 'Halfway' is exactly right when the note points up by one and exactly wrong when it points down by one, because Math.round(-0.5) is -0.

**Cluster** `audition-room`


ALREADY_FIXED — the auditor read stale code. Every artifact they quote was deleted today in commit d64aa29 "Four buttons with one right answer, and a door that never shut" (2026-09-15 19:00:46, ledger task #57 "The room: kill the identity, and make readiness the downside").

1. THE LINE THEY CITE DOES NOT EXIST. They say "src/engine/world/audition.ts:524 rounds with Math.round". Line 524 at HEAD is a closing brace inside goUpFor. The code they actually describe is `git show d64aa29^:src/engine/world/audition.ts` line 266: `out[shade.id] = clamp(Math.round(played[shade.id] + asked * how.share), -FURTHEST, FURTHEST);`. That is the OLD file. `afterTheNote` at HEAD is at src/engine/world/audition.ts:354-364 and contains no Math.round at all:
    const heard = roll < sure ? note.toward : -note.toward;
    const out = { ...played };
    out[shade.id] = clamp(played[shade.id] + heard * how.steps, -FURTHEST, FURTHEST);
Integer steps times a sign. Nothing to round.

2. THE BUTTON THEY CITE DOES NOT EXIST. There is no 'Halfway' and no 'half'. HEAD's src/engine/content/audition.ts:170 is `export type HowFarId = 'none' | 'touch' | 'good' | 'far'` with absolute magnitudes (line 178: "/** How far the player moves, in shade steps. Absolute, not a share. */"). `share` was removed from the interface entirely. Their probe's `how.share` and ids none/half/full/over are verbatim from `git show d64aa29^:src/engine/content/audition.ts:193-196`. Their probe also calls the old 4-arg signature `afterTheNote(played, wants, note, id)`; HEAD's is `afterTheNote(played, note, howFarId, sure, roll)`.

3. THE TEST THEY CITE WAS DELETED. `git show d64aa29^:tests/audition.test.ts` lines 621-629 is `it('reads halfway as halfway, and leaving it as leaving it')` — their exact fixture (wants pace 3, played warmth 2). It is gone at HEAD. Lines 622-629 of the current file are the tail of an unrelated note-spread test. The replacements are tests/audition.test.ts:625-641, 643-655, 657-662, 664-677.

4. PROBE — the asymmetry is gone, measured not argued (/tmp/claude-0/.../scratchpad/probe-refute.mjs, `npx vite-node`):
  button ids now: none,touch,good,far
  steps         : 0,1,2,3
  is there a "half"/"Halfway" button? false
  does HowFar carry a `share`? false
  note points UP   by one: none w=0 off=0.000 | touch w=1 off=0.000 | good w=2 off=0.333 | far w=3 off=0.667
  note points DOWN by one: none w=0 off=0.000 | touch w=-1 off=0.000 | good w=-2 off=0.333 | far w=-3 off=0.667
  mirror pairs checked: 336  asymmetric: 0  silent no-ops: 36
  1-D states with a note: 42  among-best counts: { none: 0, touch: 12, good: 12, far: 24 }
Full mirror sweep over every (played, wants) on one shade x 4 buttons x heard/misheard: 336 pairs, ZERO asymmetric. The exact mirror symmetry their proposed fix was meant to produce already holds. (The 36 "silent no-ops" are all misheard moves at played=±FURTHEST clamping into the wall — symmetric, direction-independent, a clamp not a rounding accident. Not their claim.)

5. THEIR FIX WOULD REINTRODUCE THE BUG THE COMMIT KILLED. They propose `Math.sign(asked) * Math.round(Math.abs(asked) * how.share)`. It references `how.share`, which no longer exists, so it would not typecheck. Worse, it multiplies the player's choice by `asked` — the hidden gap — which is precisely the identity d64aa29 removed ("All The Way was among the best in 117,306 of 117,306 states"). It would fail tests/audition.test.ts:625-641, `it('moves the number of steps the player chose, and never the hidden distance')`, whose assertion is `expect(Math.abs(after[note.shade] - played[note.shade])).toBe(one.steps)`.

6. GREEN AT HEAD: `npx vitest run tests/audition.test.ts` -> 53 passed (53). No latent fragility.

Residual truth: `Math.round(-0.5) === -0` is still a fact about JS, and the repo already knows it — tests/audition.test.ts:673-674 carries the comment "`0` rather than `-one.steps`, because negating zero gives -0 and the matcher is Object.is." The remaining Math.round sites in the file (202, 258, 268, 529, 633, 673, 704-717) are on money, ms, reputation and RNG draws where a ±0.5 tie-break is below the resolution of anything downstream. The only trace of the claim left anywhere is docs/UNBITTEN.md:246 and :264, which discuss "Halfway" as history.


### An audition never expires. whatIsGoing writes closesAt; allegedly nothing reads it but the player going up. Probe a 25-year unplayed save and report the state/why distribution of every audition row. Check registerAudition for any sweep.

**Cluster** `audition-life`


REFUTED. The headline claim ("an audition never expires; NO SWEEP EXISTS; STILL_TRUE") is ALREADY_FIXED at HEAD. The auditor read the parent commit. One narrow sub-finding of theirs (their "PIECE 2") survives and I reproduced it — but it is not the claim they filed, and they misclassified it.

1) THEY READ STALE CODE — PROVABLY. Every line number they cite maps exactly to `d64aa29^`, not HEAD. `git show d64aa29^:src/engine/world/audition.ts` at their cited offsets returns verbatim: goingNow at 379, alreadyUpFor at 386, the goUpFor closesAt refusal at 415, takeTheNote at 463-475, `audition.state='over'` in settle at 484, `if (at < sim.now) continue` at 527-530, registerAudition at 640. At HEAD (836 lines) those same constructs sit at 477, 484, 513, 562, 588, 636, 745. HEAD commit d64aa29 is titled "Four buttons with one right answer, and a door that never shut" and its message states the problem in the ledger's own words: "`whatIsGoing` wrote a `closesAt` onto every ask... Nothing read the date. On a save nobody plays, 66 asks across 25 years were all still open and the oldest had shut twelve years earlier."

2) THE SWEEP EXISTS. `shutWhatHasClosed(sim)` at src/engine/world/audition.ts:127-148, called unconditionally at src/engine/world/audition.ts:432 as the first statement of `whatIsGoing`, which runWorldTick calls at src/engine/world/world.ts:93. Body: `if (audition.state !== 'open' || sim.now <= audition.closesAt) continue; audition.state = 'over'; audition.why = 'never-answered';`. Their assertion that `state='over'` "has exactly one write site in the engine" is false — there are two, and the second is the sweep.

3) MY PROBE, THEIR EXACT EXPERIMENT, OPPOSITE RESULT (25 unplayed years, four seeds, /tmp/claude-0/.../scratchpad/probe-refute.mjs):
  seed a   rows= 35  states={"over":35}  whys={"never-answered":35}  stranded=0  goingNow=0  alreadyUpFor=35  maxIgnoredBy=2  readForLeak=false
  seed b   rows= 35  states={"over":35}  whys={"never-answered":35}  stranded=0  goingNow=0  alreadyUpFor=35  maxIgnoredBy=2  readForLeak=false
  seed c   rows= 36  states={"over":36}  whys={"never-answered":36}  stranded=0  goingNow=0  alreadyUpFor=36  maxIgnoredBy=2  readForLeak=false
  seed slate-test-seed  rows= 32  states={"over":32}  whys={"never-answered":32}  stranded=0  maxIgnoredBy=1  readForLeak=false
They measured 73-83 rows, 100% stranded, `why` histogram `{"undefined":83}`. I measure 32-36 rows, 0% stranded, `why` 100% `never-answered`. The row-count drop (83 -> 35) is itself the ratchet working: `ignoredBy` suppresses further asks, exactly the "29-38 parts instead of 66" the commit claims.

4) THEIR THREE SUPPORTING ASSERTIONS ARE EACH FALSE AT HEAD:
  - "No WHY id exists for an unanswered call: WHYS is exactly cast/wrong-for-it/not-in-the-room/went-another-way/dates." False. src/engine/content/audition.ts:250 declares `| 'never-answered'` and :275 defines `{ id: 'never-answered', label: 'You Never Went Up For It', said: 'They asked, the date to be seen by went past, and they cast it without you.' }`.
  - Their PIECE 1 options A/B/C: option (B) is already shipped. `IGNORED = 0.22` (content/audition.ts), consumed by `remembersYou` at audition.ts:178 as `- ignoredBy(sim, holder) * IGNORED`, over a three-year window (`HELD_AGAINST_YOU_YEARS`, audition.ts:106-112) so a holder can come back.
  - Their "CRITICAL, AND THE LEDGER DOES NOT MENTION IT" readFor fix. Already in, and HEAD's comment names their exact hazard before they did. audition.ts:87-94: "An ask that closed unanswered is not a reading and must not read as one — it used to, back when nothing closed at all, and the day auditions started expiring it would have meant ignoring somebody made them think of you more." Code: `.filter((one) => one.holder === holder && one.state !== 'open' && one.why !== 'never-answered')`. My probe's `readForLeak=false` confirms it at runtime. (Note their proposed predicate `one.played !== undefined` is inferior: it would also drop a row the player went up for whose `played` was never written.)

5) TESTS: `npx vitest run tests/audition.test.ts` -> 53 passed. tests/audition.test.ts:895-918 is a dedicated `describe('an ask that is never answered')` asserting `stale` is length 0 over 25 years, plus a readFor-leak test and a come-back-window test.

WHAT SURVIVES (one item, theirs, reproduced): the stale-`noted` path. `shutWhatHasClosed` deliberately only touches `state === 'open'`, so a row that reached `'noted'` never expires, and `takeTheNote` (audition.ts:562-580) checks state and howFar but not closesAt — unlike `goUpFor` fifty lines above it at :513. Reproduced on 6 seeds: cast, full fee, zero work weeks. But they overstated the setup theatrically and understated the reach: 10 years is not needed. My delay-sweep (probe-min.mjs, seed a, same row) shows the bypass opens roughly two weeks after the shoot ends.


### The posts cost nothing and nobody has to say yes.

**Cluster** `quote-fees`


REFUTED on the half the severity rests on, and they missed a reader.

**1. They missed `src/engine/decided.ts:412-424`.** They wrote "`decideHire`'s entire output is dead too... produces one adjective on one screen." It is the registered decider `crew.hired` (`drawnIn: 'src/engine/world/crew.ts'`), reading `answer.returning` AND `answer.standing` at :420-421. `tests/deciders.test.ts` sweeps every declared input end-to-end and fails if the outcome never moves. I ran it verbose:
```
✓ crew.hired — ... > is actually changed by returning
✓ crew.hired — ... > is actually changed by budget
✓ crew.hired — ... > is actually changed by head
✓ crew.hired — ... > does not answer the same thing whatever it is given
```
`decideHire` is the one function in this area that has already PASSED the project's own falsifiability harness. They grepped `standingReads` and would have hit `decided.ts:33` and `:421`; they reported only `business.tsx:554`.

**2. The money half is wrong, and the asymmetry they built it on does not exist.** They lean on "no fee field, unlike `Seat` which carries `feeCents`." I grepped every `sim.expense` in the engine (13 call sites). A cast `Seat.feeCents` NEVER becomes a payroll expense either. The only cast money that leaves the account is `payTheOverage` (casting.ts:898-907), which posts `fee - role.bandCents` and returns early when that is ≤ 0, and `payToBringThem` (travel). The doctrine is stated at casting.ts:888-891: *"share of the negative, and the periods spend the negative — so what is posted here is the difference and only the difference."* Crew is not the exception — it is the rule, applied. Probe on their own scenario: `spentCents / budgetCents = 1.0254`. The budget is spent. The crew is paid out of it, exactly as cast is.

**3. There is no lever, so "cost nothing" prices a choice that does not exist.** Probe: `postsFor.length === 1` — its entire signature is `(budgetCents: Money)`. The player cannot carry an extra post. Posts per budget are deterministic: 0→4, €250k→11, €500k→15, €2m→23, €8m→24 (cap). You cannot add a camera operator without raising the budget, and raising the budget costs the budget.

**4. Post COUNT is not financially inert — it is worth €516,000.** They conceded `headcountOf` feeds the rebate then dismissed it. The dismissal is wrong: `headcountOf` (crew.ts:105-109) is `postsFor(budget).length + crowd`, so the named posts are a live term. Probe:
```
crew limb (>=50 people) first met at EUR 6,000,000
  EUR 5,990,000  posts 24 + crowd 24 = 48  meets50=false
  EUR 6,000,000  posts 24 + crowd 26 = 50  meets50=true
WHAT THE CREW LIMB IS WORTH on a EUR 6,000,000 picture:
  lower rate  1,290,000 EUR back
  higher rate 1,806,000 EUR back
  difference    516,000 EUR
```
24 of the 50 people gating a 0.25→0.35 rate flip (incorporation.ts:194-201) ARE the named posts. `tests/rebate.test.ts:322-328` is live and green with `'crew'` as the sole blocker.

**5. Both proposed fixes are inert or break named live tests.**
- Fix (b) "MAKE IT MARGINAL" cannot work as described. They say "carrying a camera operator then trades against carrying a second AD" — the player never chooses either. `sum(weeklyCents over postsFor(budget))` is a pure function of budget, subtracted from a period share that is also a pure function of budget. Identical output for every picture. It would add `weeklyCents` to 24 Posts with nothing able to vary it — a fresh violation of THE ONE RULE, in an audit that exists to remove them.
- Fix REFUSAL breaks, by name: `tests/crew.test.ts:96` and `:249` (both `expect(crew.length).toBe(postsFor(budget).length)` — full staffing at delivery); `tests/crew.test.ts:351,353,362-363,369` (five calls reading `.returning`/`.standing` off the bare result — type errors against a `{took:false}|{took:true,...}` union); and `src/engine/decided.ts:420-421`. All 139 tests in crew/rebate/deciders pass today.
- And they got the mechanism wrong. `registerCrew` (crew.ts:372-386) schedules one tick per start date and never retries; `fillPost` already returns `undefined` twice and the handler already swallows it silently (`if (came.length === 0) return;` suppresses the notification entirely). A refusal is not "a re-rolled name" — it is a permanently empty post with no message. And since `headcountOf` is budget-derived, the rebate does not move. Their own falsifiability test fails: change the input, only the sentence at business.tsx:530 ("N of 24 posts filled") changes.

**6. Severity is wrong: serious → minor.** "Serious" would be right if crew were free labor on top of the negative — a real economic hole. It is not. What actually survives: two comments that promise an "engagement and the deal" record that does not exist, and one write-only number.


### The tax engine is a screen. Real, correct, entirely unwired.

**Cluster** `company-ends`


REFUTED on the headline, and their lead evidence contains a decisive factual error. The residue is real but much smaller than "entirely unwired".

1) "Entirely unwired" is false, and I proved it by perturbation, not by reading. `content/tax.ts:263` sources Iceland's sales-tax row from the live constant: `{ jurisdictionCode: 'IS', rate: VAT_RATE, ... }`, with `import { VAT_RATE } from './incorporation'` at tax.ts:18. The comment at tax.ts:258-262 says why, verbatim: "taken from `VAT_RATE` rather than typed again, because the company side of this build already declares Iceland's rate and two copies of one number is how a screen comes to disagree with the page behind it." I forked the repo to scratchpad, changed only `VAT_RATE` 0.24 -> 0.10 (incorporation.ts:222), and re-ran a 10-year save:
   baseline: PRINTED salesTax = 0.24 | Reclaimed VSK n=60, cents=234,929,027
   perturbed: PRINTED salesTax = 0.10 | Reclaimed VSK n=60, cents=110,345,428
Change the input, and 124,583,599 cents of real money move together with the sentence. For the one jurisdiction the save actually runs in, `salesTaxRate()` PASSES the falsifiability test. Their "FALSIFIABILITY TEST FAILS EXACTLY" holds only for the income side, which they silently generalised to the whole engine.

2) Their probe output is wrong on the point they lead with. They wrote: "distinct memos: 17 ... The only tax-shaped memo in ten years is 'Sugar Land Studios: Property Tax'." I re-ran with their exact seed, quickSave({}, 'seed'): distinct memos: 17 — their count reproduces exactly — and `Reclaimed VSK` is present, 60 transactions, 234,929,027 cents. A VAT refund is a tax memo. It was in the list they counted and they missed it. src/engine/world/vat.ts:108-127 `fileTheReturn` posts it every two months via `registerVat`; tests/business.test.ts has a passing block "the tax on what the company buys > pays real money back on a real lag, and none at all without the registration".

3) Their "Complete reader set" is not complete. They wrote "computeAnnualTax -> world/place.ts:118 ONLY", "salesTaxRate -> world/place.ts:161 ONLY", "propertyTaxRate -> world/place.ts:162 ONLY". All three, plus `resolveIncomeTaxLayers`, are also read by tests/business.test.ts:403-431 — a test they cite elsewhere (for CORPORATION_TAX) and therefore had open. Also: tax.ts is 494 lines, not 445.

4) They read the code post-fix and reported the pre-fix headline. The ledger they are quoting, docs/UNBITTEN.md:324-329, does NOT say "entirely unwired". It says: "Real, correct, and read by one thing: the place card ... Iceland is at least IN the tables now — it was in none of them, so the home screen told a player living in Mosfellsbær that Iceland taxes a wage at 0% and charges no sales tax — but a correct table nobody is charged from is still a screen." The Iceland-rows fix has already landed, with a test whose name is "keeps the Icelandic tax figures as the published ones, **and spends them**" (tests/business.test.ts:392) and whose comment says the constant-equals-constant assertions "used to be the whole test". "Entirely unwired" is the claim's word, not the ledger's, and it is exactly the part that is no longer true.

5) Their (c) is misclassified. They call adding an `IS` row to `FILM_INCENTIVE_RULES` "a two-line MECHANICAL subset worth doing either way". It is neither two lines nor mechanical. `FILM_INCENTIVE_RULES` rows are flat credits with `transferable`/`perProjectCap`/`localHireUplift`; Iceland's endurgreiðsla is a conditional cash rebate whose rate is 25% or 35% depending on five limbs tested by `shortOn` (content/rebate.ts:120-130, world/rebate.ts:184-189). Writing `rate: REBATE.share` creates a second, flat copy of a conditional number and makes Home.tsx:358 print "25% film incentive here" to a player who may be earning 35% — which is precisely the "two copies of one number is how a screen comes to disagree" failure that tax.ts:258-262 was written to avoid. They also overstate the harm: Home.tsx:354-360 is `{place.filmIncentive ? (...) : ''}`. It prints nothing. It does not "tell an Icelandic player there is no film incentive" — silence is not an assertion, and the surrounding paragraph is explicitly atlas prose ("Drives on the right. Distances in kilometers").

WHAT SURVIVES, and I credit it: the four dead declarations check out, and the ledger genuinely does not name them. `grep -c "effectiveTo:" src/engine/content/tax.ts` returns 0 — not one of ~100 rule literals sets it, so the branch at tax.ts:348 can never fire, against a file header at tax.ts:5-7 promising "every rule carries an effective date range". `vehicleFees`/`VEHICLE_FEE_RULES` have zero readers and there is no vehicle in domain/model.ts. `exemptCategories` is populated on ~30 rules and `salesTaxRate` is only ever called with 'general' (place.ts:161, business.test.ts:403), so tax.ts:472 can never return 0; place.tsx:280-281 uses `salesRule`/`propertyRule` only as truthiness checks and never renders the categories. `Property.annualPropertyTaxRate` (model.ts:404) is written 0 at index.ts:183 (not :181 as they said) and lot.ts:235 and read nowhere. `costOfLiving` has no caller — though note it IS in the public engine barrel via index.ts:47 `export * from './world/bootstrap'`, so removing it is an API change, not a private one.

So: the claim is right that no fee, wage or company profit is taxed — that part I could not refute, and the ledger already states it accurately. The claim is wrong that the engine is "entirely unwired", wrong in its probe, wrong in its reader set, and it recommends a "mechanical" sub-fix that would make a screen less true.


### stillOwedCents stops accruing interest at week 260 and the screen still says interest is included.

**Cluster** `money-time`


REFUTED ON FRAMING, SEVERITY AND ARITHMETIC — not on the runtime behaviour, which I reproduced.

WHAT SURVIVES (I confirm it, live, not from reading). Real boot-and-play save, `agent` deal, €20m negative, probe /tmp/probe-refute-interest.mjs:
  wk  261 paid=[theatrical,home,pay,free,library] STILL_OWED=€5,145,518
  wk  300 ... STILL_OWED=€5,145,518
  wk  520 ... STILL_OWED=€5,145,518
  wk 1040 ... STILL_OWED=€5,145,518
  wk 2080 ... STILL_OWED=€5,145,518
  SENTENCE @wk2080: "…with €5.1M of what made it still outstanding."
Clock-aware it would be €8,286,909 at wk520 and €21,494,108 at wk1040. So the frozen balance is real and reachable. Their mechanism reading (interest applies only between receipts; 260 is just WINDOWS' last `opensAt`, not a bound) is correct.

THE REFUTATION — THEY MISSED THE PROJECT'S OWN DECLARATION. docs/DEPTH.md:232-242, under a heading literally called "Open Questions":

  "Two things are known to be imperfect and are left that way deliberately, so
   that a future session changes them as a decision rather than by accident.

   **An unrecouped picture stops accruing interest after its last receipt.**
   `splitIt` is a pure function of the receipt list and takes no notion of now, so
   once the final window has paid, what is still owed freezes even as years pass.
   That is defensible — the split describes what the receipts did, not what is
   owed today — but it understates a long-dead picture's debt. Fixing it means
   passing the current instant in and giving up the purity several tests rely on."

That is the whole of their finding, by the correct mechanism, written by the owner on 2026-09-14 (git blame: b6f4061). The UNBITTEN ledger entry they were auditing (docs/UNBITTEN.md:427-428) was added a day later, 2026-09-15, in deb3430 — a scout re-discovering an already-owned open question and describing it worse ("week 260"). The auditor cites content/selling.ts:219-227 as their "one exoneration" and never found DEPTH.md. They present a parked decision as a fresh serious defect requiring the owner to choose between three options; the owner already chose, wrote down why, and named the same fix they "recommend" ("passing the current instant in").

SECONDARY REFUTATIONS:

1. ARITHMETIC OVERSTATED ~1.6x. "It understates by €39.3m — 61% low." Their own numbers: 103.75 − 64.42 = 39.33; 39.33/103.75 = 37.9%. The frozen figure is 37.9% BELOW truth. 61% is how much higher the truth is than the frozen figure. Not the same sentence.

2. THE ERROR IS A CONSTANT, WHICH THEY IMPLY IT ISN'T. It is exactly (1+INTEREST_A_YEAR)^((weeksNow−260)/52), independent of picture, deal, budget and take. Sweep of 808 combinations (2 deals × 4 budgets × 101 decideTake rolls, /tmp/probe-refute-reach.mjs) returned "worst wk520 understatement x1.61" in every single row — 1.1^5 = 1.6105. One line states the defect better than their four probe results.

3. THEIR PROBE IS SYNTHETIC AND OVERSTATES REACH. Hand-built receipt list, €40m negative / €36m take. In a real save on the headline studio deal, decideTake returns take/neg = 6.38 and the picture recoups at the HOME window: STILL_OWED=€0 from week 3 to week 2080, row reads "The picture has paid for itself." The lie needs an unrecouped picture. Sweeping decideTake's roll: studio 12/101 (€0.5m neg), 33/101 (€20m), 45/101 (€100m); agent 18/101, 42/101, 57/101. Substantial, but a third-to-a-half, not the default.

4. "THE FREEZE ALSO BITES BETWEEN WINDOWS" OVERSTATES. Between windows the charge is pending, not lost — the next receipt accrues the whole gap retroactively (`(receipt.weeksOut − lastWeek)/52`). Their own tests/selling.test.ts:143-152 prove it. Only after the library window is the freeze permanent. Their "always a snapshot" reading turns a self-healing display into a permanent one.

5. THEIR FIX PLAN THREADS A CLOCK INTO A DEAD EXPORT. They say "Thread `now` through grossSoFar, tiersFor, whereTheMoneyStands and business.tsx:763." `tiersFor` (selling.ts:397) has NO caller anywhere in src/, tests/ or base44 — business.tsx:31 imports only `standingOf` and `whereTheMoneyStands`. `grossSoFar` (selling.ts:242) is read only by tests/selling.test.ts:305. Threading a clock through a function nothing calls is itself the ONE RULE violation the audit exists to find.

ONE CORRECTION IN THEIR FAVOUR, WHICH THEY ALSO DID NOT KNOW. DEPTH.md's stated cost of the fix — "giving up the purity several tests rely on" — is FALSE, and I proved it rather than argued it. I tarred the repo to /tmp/slate-fix, made `receiptsOf`/`standingOf` take an OPTIONAL `now`, appended `{ weeksOut: Math.max(0, (now − releasedAt)/MS_WEEK), cents: 0 }`, and passed `sim.now` from business.tsx:465 and 487 only (collect/payWindow untouched). `splitIt` stays pure. Result: `npx tsc -b --noEmit` rc=0, and `npx vitest run` → "Test Files 44 passed (44) / Tests 1171 passed | 1 todo". And money-neutrality is not an argument either: across every clock-aware variant my probe printed "toCo identical? true | took identical? true | gross identical? true". So their option (a) is correct AND cheaper than the design note that parked it assumed. That is the finding worth carrying forward — not the frozen number, which was already on the books.


### The denominator never moves: a cut that cannot run long. (docs/UNBITTEN.md:315)

**Cluster** `money-time`


REFUTED ON CLASSIFICATION, SEVERITY AND THE PROPOSED FIX — the bare mechanical fact is conceded.

CONCEDED (my probe reproduces it). /tmp/probe-refute-denom.mjs, unscripted season, greenlight to delivery:
  part.seconds values ever seen: 3600
  owesSeconds values ever seen: 28800
  FINAL owed 28800 cut 28800 cut>owed? false   owesSeconds === sum(parts)? true
part.seconds is written once (making.ts:553-558) and never again in src/; project.cut is clamped (making.ts:906). The denominator does not move. That much is true.

Now the three refutations.

1. THEIR PROPOSED FEATURE FIX BREAKS TWO NAMED TESTS, AND DEADLOCKS.
/tmp/probe-refute-newformula.mjs computes their formula (`leftToCut = sum(max(0, runsTo - seconds)) + recut`, runsTo seeded to seconds*2 at the assembly rung) at the exact instants the existing tests read:
  hands=1 at field.to: today left=24300 weeks=27.0 makesIt=false | PROPOSED left=3600 weeks=4.0 makesIt=TRUE
  hands=3 at field.to: today left=13500 weeks=5.0             | PROPOSED left=14400
  at greenlight (all): today left=28800                        | PROPOSED left=0
- tests/inventory.test.ts:218 `expect(willMakeIt(lean, one.sim.now)!.makesIt).toBe(false)` FAILS — flips to true.
- tests/inventory.test.ts:236 `expect(leftToCut(short)).toBeGreaterThan(leftToCut(staffedUp))` INVERTS — 3600 vs 14400. The lean room reads as having LESS left because it never got far enough to seed a runsTo. tests/inventory.test.ts:241 goes with it.
- At greenlight leftToCut becomes 0, so `willMakeIt` says every picture makes its date from day one until the first part hits assembly. That is the forecast the whole file exists to test.
- Bootstrap deadlock: they seed runsTo "when a part reaches the assembly rung" AND replace the coverage loop that is the only thing that puts a part on that rung (making.ts:909-915 against `converts: {…, upTo: 'assembly'}` at content/making.ts:450). Remove the coverage loop and nothing ever seeds runsTo. Probe: `season picture rungs ever observed: nothing,stringout,assembly,locked,broadcaster` — assembly is reached by that loop and nothing else.

2. MISCLASSIFIED, AND THE LEDGER'S OWN FILING IS WRONG. Line 361 sits under "### Declared, and nothing reads it". Both things they point at ARE read:
- `owesSeconds` is read at casting.ts:120 (`(project.owesSeconds ?? 0) / 3_600` prices every role on the picture) and maturity.ts:43.
- The assembly rung's sentence is RENDERED: src/ui/looks/business.tsx:577 `<td className="small">{rung?.what ?? dimension.what}</td>`, off `rungOf(project,'picture')` (maturity.ts:134-138 = the weakest part). My probe shows the season's weakest episode sits at `assembly` for many weeks, so a player really does read "Cut long — routinely twice the running time it has to become" next to a cut that equals its owed runtime. That is shipped false UI copy, not a dead word — a different and smaller sin than the section it is filed under.
Their "MECHANICAL, one line" is also a DESIGN_DECISION: the same standard condemns content/maturity.ts:136 `'Every scene is in order at its full length, and it plays badly.'` and :137 `'It's the length it's going to be, give or take a reel.'` Both assert a length the engine does not model. Editing only line 188 leaves the ladder internally inconsistent.

3. SEVERITY WRONG — THE FALSIFIABILITY TEST DOES NOT FAIL THE WAY THEY SAY. They dismiss `wading` as "an approximation with no second ledger behind it". /tmp/probe-refute-wading.mjs:
  feature/6w  maxRatio=14 minWading=1.000 cutsAWeek={960}
  feature/12w maxRatio=26 minWading=0.759 cutsAWeek={960…728}
  feature/20w maxRatio=45 minWading=0.574 cutsAWeek={960…551}
Change an input (shoot 20 weeks instead of 6) and the outcome changes: the same 6,000-second picture costs the cutting room ~74% more weeks. More material already means more work. What is missing is only that the LENGTH of the cut is not itself a quantity — a narrower gap than "the engine cannot do this".

4. WHAT THEY MISSED, WHICH IS THE SHARPER FINDING. On the unscripted season — the one form whose ladder carries the "cut long" rung — `wading` is pinned at exactly 1.000 at ratio 1,875:1, because content/inventory.ts:208 puts the `rig` band at 7,000 and the season never approaches it. So on that form material changes NOTHING. That is a one-number calibration defect in a content table, fixable today, and it delivers most of what their FEATURE was for.


### A directed night's sleep is added on top of the autopilot's, which inverts the contract its own comment states, and the guard written for it has no caller.

**Cluster** `wellbeing`


Their three code facts are correct and I reproduced their micro-probe to the decimal. What I refute is the verdict built on top: the kind, the severity, two of the three headline numbers, and step 1 of their fix.

WHAT SURVIVES (I could not break these):
1. `applyElapsedWellbeing`'s `opts.asleep` guard is dead. life.ts:56 `export function applyElapsedWellbeing(person: Person, hours: number, opts: { asleep?: boolean } = {}): void {` / :58 `if (opts.asleep) return;`. Repo-wide grep for "asleep" across src/ and tests/ returns exactly those two lines. Its one caller, life.ts:372, passes no opts. Undeniable ONE RULE violation.
2. The double night is real. Probe, seed 'refute-seed', quality 0.823, morale as the unbounded witness:
   applySleep direct, 8h:                    morale 62 -> 64.52, condition 88 -> 89.42
   life.sleep 22:30->06:30 (crosses midnight): morale 62 -> 66.54, condition 88 -> 90.09
   life.sleep 10:30->18:30 (no crossing):     morale 62 -> 64.52, condition 88 -> 89.42
   1.80x, exactly their figure.
3. `sleptHours = 0` charges 24 waking hours for a day the person slept eight of. I decomposed it: the 12:30-nap arm ends 12 days at nourishment 15.2 / hygiene 43.6 vs the 20:00 arm's 30.8 / 56.1. The gaps are 15.6 and 12.5 = 7.8h x NOURISHMENT_DRAIN_PER_HOUR 2.0 and 7.8h x the 1.6 hygiene rate. Exact.

REFUTATION 1 — "the same button at a different hour is worth 39 readiness points" is overstated ~6.5x, and their comparison is phase-shifted, not identical-state.
Their arms sleep for 2 days and then stop; the measuring instant lands on a day the nap arm did not sleep while the 20:00 arm woke that same morning. I reproduced their exact setup with a FIXED anchor (their day-offset arithmetic, and my first attempt at it, drifts because zonedParts is re-read off a clock that has already moved):
  Jan 7, any hour:  12:30 nap 42.9 | never sleeps 44.8 | 20:00 night 88.0
  Jan 8, any hour:  12:30 nap 45.4 | never sleeps 45.1 | 20:00 night 45.9
The 45-point spread lasts exactly one simulated day and collapses to 0.8 points. Under sustained play — sleeping EVERY day, sampled at 23:30 every day, identical instants, 12 days:
  nightly 20:00 (crosses):  86 88 89 91 92 93 95 95 95 95 95 95
  nightly 12:30 (no cross): 97 82 82 83 84 85 85 86 87 87 88 89
  nightly 06:00 (no cross): 82 87 82 83 84 84 85 86 86 87 88 89
  never sleeps:             82 44 45 45 45 46 46 46 46 47 47 47
The real hour-of-day gap is 6 readiness points (95 vs 89), not 39.

REFUTATION 2 — "pressing the button can leave you WORSE than never pressing it" is FALSE in sustained play; the contract at life.ts:308-316 holds.
Same table: a player who directs a night every day sits at 89-95; a player who never presses it sits at 47. The sleeper is 42-48 points BETTER at every identical instant after day 1. Their 42.9-vs-44.8 is not an inversion of the contract, it is a one-day penalty of 1.9 readiness points for STOPPING after having slept — lastSleptAt suppresses one autopilot night and then the next rollover (sinceSlept 27.5h >= 20h) re-arms it and the arm recovers. They generalised a self-correcting transient into "the game's one wellbeing button is a trap".

REFUTATION 3 — MECHANICAL is wrong, and I proved it by running their own step 1.
I simulated step 1 (stamp lastSleptAt at bedtime, before advanceTo) at runtime:
  TODAY          20:00 crosses: 86 88 89 91 92 93 95 95 95 95 95 95 | nourish 30.8 hyg 56.1
  WITH STEP 1    20:00 crosses: 71 76 80 83 84 85 85 86 87 87 88 89 | nourish 15.2 hyg 43.6
Step 1 alone does not restore the contract — it levels the directed sleeper DOWN to the nap arm's curve and strips 15.6 nourishment and 12.5 hygiene a day. They concede this and hang steps 2 and 4 off it, but step 2 adds a NEW PERSISTED FIELD to `Person` (src/engine/domain/model.ts:195 region, a save-schema surface with migrate() at index.ts:294), and it forces an undecided modelling question they never name: a 20:00->04:00 night spans two calendar days — does it charge 4h to each, 8h to the day it began, or 8h to the day it ended? Each answer gives different numbers. Step 4 is explicitly three options with a recommendation. A fix whose first step measurably makes things worse and whose second step changes the save schema and needs an owner to pick an apportionment rule is a DESIGN_DECISION.

REFUTATION 4 — severity, and they ranked their two mechanisms backwards.
The double applySleep they lead with is cosmetically dramatic and mechanically inert: in sustained play BOTH arms pin at energy 100, stress 0, sleepDebt 0, so COASTING_ENERGY_CEILING 74 and COASTING_STRESS_FLOOR 14 are irrelevant either way and the entire residual 6-point gap is nourishment and hygiene, i.e. the missing hour subtraction, not the stacked night. The player also cannot steer the phase: TimeControls.tsx:133 `run('life.sleep', { hours })` gives duration only, and a pure 8h-sleep loop from the save's own 07:30 start cycles bed 07:00 -> 15:00 -> 23:00 -> 07:00, crossing midnight on one press in three, readiness sawtoothing 82.2 / 79.5 / 79.5 / 84.4 / 81.6 / 81.6 / 86.6 and climbing throughout. Nothing here is unwinnable or unrecoverable. Serious, not critical.

Minor correction to their aside: `startAt` is not fully dead. life.ts:133-134 reads it and the CommandError it guards is asserted by two live tests (tests/simulation.test.ts:259, 279), one of which is the transaction-rollback invariant. Only its success path is unreachable from src/. Deleting it breaks those two tests.

Baseline: `npx vitest run` is green today, 44 files / 1175 passed / 1 todo. I made no edits; the one dirty file (src/engine/content/making.ts) was already modified before I started.


### content/lifespan.ts is 540 lines with two exports read, and a scout puts it at 2 of 48 rather than 2 of 28 (docs/UNBITTEN.md:293-296)

**Cluster** `lifespan`


Their headline number survives — I confirmed 540 lines and 48 exports independently, and the only import anywhere is src/engine/systems/life.ts:20 `import { ceilingAt, recoveryFactorAt } from '../content/lifespan';`. Nothing else in src/, src/ui/, tests/, tools/ or any other directory touches the module (repo-wide case-insensitive grep for "lifespan" hits exactly two source files, and a per-name grep of all 48 identifiers returns only ceilingAt=3 and recoveryFactorAt=2). So "2 of 48, not 2 of 28" is right, and I could not refute it.

Everything they built on top of it is wrong, on three counts.

(1) THEIR PROPOSED FIX EDITS THE WRONG LINES. They wrote: "delete the 'Verify the count before quoting it' instruction at docs/UNBITTEN.md:295-296". Those lines are not that sentence. `sed -n '294p;295p;296p' docs/UNBITTEN.md | cat -A` gives `$`, `---$`, `$` — a blank line, a horizontal rule, a blank line. That rule is the section separator between "Honest about what it did not fix" and "## From the audit of 2026-09-15". The sentence they mean is at docs/UNBITTEN.md:315, and the whole ledger entry is at 312-315, not 293-296. They inherited the stale line reference from the ledger header and never opened the file at it, even though they correctly quoted 184 and 217. Applying their fix verbatim deletes a section break and leaves the instruction standing.

(2) THE ARITHMETIC THEY CERTIFIED AS "THE PROOF" IS WRONG BY 3, AND DANGEROUSLY SO. They called docs/UNBITTEN.md:217 ("the other 46 exports of content/lifespan.ts are dead") "already correct and the arithmetic proof that 48 is the right denominator". It is not correct. 46 is imports-not-found, not readers-not-found, and THE ONE RULE is about readers. A transitive-closure script over the module shows the live set is {ceilingAt, recoveryFactorAt, agingAt, AGING, AgingBand} = 5, because ceilingAt (lifespan.ts:283) and recoveryFactorAt (lifespan.ts:269) both loop `agingAt(year)` (lifespan.ts:276), which reads `AGING` (lifespan.ts:251), typed `AgingBand` (lifespan.ts:239). The true dead count is 43, not 46. Separately, 27 names are referenced literally nowhere, not even inside their own file (GATE_BY_ID, STAGE_BY_ID, stageAt, gateAgeIn, pensionAgeIn, MOURNING_DAYS, PASSING_LINES, PARENT_AGE_GAP, FAMILY_START, youthFactorAt, ...). Anyone who acts on "46 dead" deletes AGING, agingAt and AgingBand and breaks src/engine/systems/life.ts:211, :235 and :289.

(3) A PROBE REFUTES THE SURROUNDING CLAIM THEY LEFT INTACT — AND THEY NEVER RAN ONE. The same ledger entry is headlined "**Age decides nothing.**" (docs/UNBITTEN.md:312), and it is the tail of docs/DEPTH.md:156-159 "The ageing model can never fire... the age ceiling clamp binds on 0 of 27,375 days. Eight authored bands, each with its own prose, are dead arithmetic", repeated at docs/UNBITTEN.md:181-185 as explicitly UNVERIFIED. I verified it. It is false. Two saves, same seed, differing only in birthYear, advanced 365 days:

  birthYear=2001 (age 25.6): condition 99.700  energy 25.239  stress  4.480
  birthYear=1986 (age 40.6): condition 97.400  energy 25.239  stress  4.480
  birthYear=1966 (age 60.6): condition 87.900  energy 25.239  stress  4.480
  birthYear=1946 (age 80.6): condition 66.100  energy  0.000  stress 25.460

Every final condition equals ceilingAt(age).condition to the digit — the clamp is not idle, condition rides it. A day-by-day binding count over 300 days: at age 25 condition sat exactly on its age ceiling on 286 of 300 days; at age 80, 300 of 300 (fitness bound 1 day, so the fitness half of DEPTH's claim is roughly right and the condition half is flatly wrong). Change one input — birth year — and the outcome moves, by 33.6 points of condition and 25 of energy. Age decides plenty. Fixing "28" to "48" while that sentence stands makes the docs more precisely wrong.

So: the count is STILL_TRUE; their verdict package — evidence, fix, kind and severity — is refuted.


### The ageing model cannot fire, because fitness is already at zero and the age ceiling clamp binds on 0 of 27,375 days. (docs/DEPTH.md:156-159, docs/UNBITTEN.md:181-183)

**Cluster** `lifespan`


I reproduced their headline numbers and then broke their analysis in three places. Their verdict label (PARTLY_TRUE) survives; their evidence, their proposed fix and their classification do not.

WHAT I REPRODUCED (so this part stands)
Mirror of the repo at /tmp/.../scratchpad/mirror with env short-circuits patched into `ceilingAt` and `recoveryFactorAt` (repo itself untouched — `git status --porcelain` empty). Default `quickSave({}, 'audit-seed')`, 75 x 365-day steps:
  BASELINE        y1 cond=99.700 ... y75 cond=0.000  energy=0.000 morale=0.000
  NO_FIT_CEILING  identical at y1/y5/y10/y25/y50/y75 — every field, byte for byte
  NO_COND_CEILING y1 cond=100.000, y75 cond=21.606
  NO_RECOVERY     y75 energy=25.239 morale=50.952 cond=17.572
Their 21.606 / 25.2 / 51.0 are exactly my numbers. Day-by-day instrumentation, default save, 3,650 days x 3 people = 10,950 person-days: fitness ceiling bound 0 times, moved 0.0000 points; condition sat exactly on its ceiling on 3,259 person-days, first on day 5 (person_00000g, age 56.5, ceiling 90.4). Arithmetic check: `ceilingAt(a).fitness` first drops under 49.82 at a=79, and the ceiling falls at most 2.3/yr = 0.00630/day against a 0.18/day decay (28.6x faster), so once fitness is under the ceiling it can never return. Their "arithmetic, not lucky" argument is sound.

REFUTATION 1 — their central split ("fitness dead, condition live") is wrong by THIS PROJECT'S OWN TEST.
They graded "live" as "a number moves". The falsifiability test is "does the OUTCOME change, or only the sentence?" I ran readiness alongside condition (probe-ready.mjs, 60 years, player):
  BASELINE          y1 ready=49.1710 cond=99.700 | y40 ready=23.3079 cond=21.606 | y60 ready=23.3079 cond=20.725
  NO_COND_CEILING   y1 ready=49.1710 cond=100.000 | y60 ready=23.3079 cond=21.606   <- readiness IDENTICAL at every sample
  NO_FIT_CEILING    no diff at all
  NO_RECOVERY       y40/y50 ready=42.7110, y60 ready=42.7110                        <- readiness moves +19.40
`wellbeing.condition` is read by NOTHING that decides anything. Writes: life.ts:42, 68, 71, 236, 292. Reads outside its own decay arithmetic: only the Condition dial (src/ui/looks/wellbeing.tsx:37 and :164-166) and a self-consistency fingerprint in tests/calibration.test.ts:70. `readiness()` (src/engine/systems/life.ts:85-97) does not include condition or fitness; the only engine consumers of readiness are src/engine/world/audition.ts:331 and :671. So the honest column-by-column finding is:
  AGING.fitness   (8 values) -> moves w.fitness only -> nothing reads it -> DEAD at outcome level
  AGING.condition (8 values) -> moves w.condition only -> nothing reads it -> ALSO DEAD at outcome level
  AGING.recovery  (8 values) -> moves energy+morale -> readiness -> the audition room -> LIVE, the only live third
Their proposed sentence "The condition and recovery columns are live" would write a NEW claim into the ledger that fails the project's own test. Sixteen authored numbers move only readouts, not eight.

REFUTATION 2 — their proposed fix deletes a verified-true, larger finding.
DEPTH.md:159 says "`src/engine/content/lifespan.ts` is 540 lines with 2 of its 28 exports wired." Their replacement paragraph drops that sentence. I measured it: the file is exactly 540 lines; it carries 48 `export` statements (6 of them types, so 42 value exports); exactly 2 — `ceilingAt` and `recoveryFactorAt` — are read anywhere outside the file (grep across src/, tests/, tools/, base44/). LIFE_EXPECTANCY, WORLD_EXPECTANCY, expectancyIn, adultExpectancyIn, PENSION_AGE, pensionAgeIn, LIFE_STAGES, STAGE_BY_ID, stageAt, AGING, agingAt, AgingBand, PARENT_AGE_GAP, SIBLING_WEIGHTS, MILESTONE_AGES, BIRTHDAY_LINES, MILESTONE_LINES, PASSING_LINES, MOURNING_DAYS, GATES, GATE_BY_ID, DEFAULT_GATES, COUNTRY_GATES, gateAgeIn, gateIsCountrys, YOUTH_CURVE, FULLY_FORMED, youthFactorAt — all zero external readers. The doc's "28" is itself wrong and UNDERSTATES: it is 2 of 42. Their edit would remove the single biggest ONE-RULE violation in the file from the ledger while correcting a smaller sentence.

REFUTATION 3 — two factual errors in their evidence.
(a) "ceilingAt returns {fitness, condition} and both are consumed at src/engine/systems/life.ts:290-292" — there is a THIRD consumer they missed: `applySleep`, src/engine/systems/life.ts:235-236, `const ceiling = at === undefined ? 100 : ceilingAt(years).condition;` then `w.condition = clamp(Math.min(w.condition + restful * 0.9 * ..., ceiling), 0, 100);`. Their call-site enumeration is incomplete.
(b) "total points ceilingAt moved fitness = 0.0000" and "born 1966 (age 59.7): bound on 0 of 7300" count the PLAYER only. The save also holds the parents. With `quickSave({birthYear: 1966})` the parents boot at 88.74 and 91.47 and the fitness ceiling fires on day 1 for both: person_00000f 50 -> 27.400, person_00000g 50 -> 20.500, 51.74 points moved, and the trajectories stay apart for ~150 days (d120: 5.980 vs 28.400). Same for 1940 (3 binds, 79.16 points) and 1947 (2 binds, 63.64 points). So "arithmetic zero for a save of any length" is false; "0 of 27,375 in the DEFAULT save" is true. And the A/B on that same old-NPC save shows cond/energy/morale byte-identical between BASELINE and NO_FIT_CEILING — which is the real point, and a sharper one than theirs: the fitness ceiling does not "never fire", it fires and moves a number nothing reads.
(c) Reachability they did not check: the Fitness dial is on a real screen. src/ui/looks/wellbeing.tsx:38 declares it, :167-168 writes its copy, and the file is registered by side-effect import at src/ui/looks/all.ts:13. So ceilingAt().fitness is player-visible — and still only changes the printed integer, not even the sentence, because 49.820 and 27.400 both fall under the 65 threshold at :167. That is the falsifiability test in one line.

REFUTATION 4 — misclassification. They filed MECHANICAL and then wrote "The code fix is the fitness ratchet, filed separately." A docs rewrite is not the fix for a defect filed as "the ageing model can never fire", and the code question has at least three defensible answers (delete the dead columns; give fitness a source so the ceiling binds; make condition feed readiness so the condition ceiling starts mattering). Those change what the game is. That is a DESIGN_DECISION.

WHAT SURVIVES OF THE LEDGER CLAIM: "the ageing model can never fire" is wrong — recoveryFactorAt fires continuously and swings readiness by 19.4 points. "The age ceiling clamp binds on 0 of 27,375 days" is right for the fitness clamp in the default save. "Eight authored bands are dead arithmetic" is right for two of three columns at the outcome level, not one of three. "540 lines with 2 exports wired" is exactly right and understated.


### (new, not in the ledger) Three more numbers inside the two exports that ARE read never execute

**Cluster** `lifespan`


Two of their three "dead numbers" are alive and I made them move. Item 3 survives but is misclassified and their recommended fix measurably does not do what they say. Item 4 is true but mis-scoped and badly understated.

ITEM 1 (AgingBand.fitness, all 8 values) — REFUTED. They probed only default-age saves. Character creation explicitly supports old starts: `src/ui/creation/CharacterCreation.tsx:444` sets the birth-year input to `min={1940}`, and `validate()` at `:1499` rejects only `if (age > 95)`. With the save opening 5 Jan 2026, that is a documented, supported start-age range of up to 95. From the 79th birthday `ceilingAt(age).fitness` drops below the fresh fitness of 50 (`freshWellbeing()`, life.ts:42) and the `Math.min` at life.ts:290 binds on the very first rollover and keeps binding. A/B probe, same seed, `AGING[*].fitness` zeroed vs baseline:
  born 2001 (age 24.6): Σ|Δfitness| over 120 days = 0.0000  (their result — reproduced)
  born 1947 (age 78.6): Σ|Δfitness| = 0.0000                 (still below threshold)
  born 1940 (age 85.6): day-1 fitness 34.300 vs 49.820; Σ|Δfitness| = 1862.4000
  born 1931 (age 94.6): day-1 fitness 18.000 vs 49.820; Σ|Δfitness| = 3784.2000
The gap does not close — it holds for all 120 days. And fitness is rendered: `src/ui/looks/wellbeing.tsx:38` (`{ key: 'fitness', name: 'Fitness', … }`) and `:167` ("A stunt day would cost you a week"), registered via `src/ui/looks/all.ts:13: import './wellbeing';`. So the falsifiability test passes: change the input, the number on the screen changes.

ITEM 2 (the `Math.max(18, …)` floor at lifespan.ts:292) — REFUTED, and it is not merely reachable, it is the deciding term. Probe:
  age 90: raw 22.80, floored 22.80 — floor idle
  age 92: raw 18.20, floored 18.20 — floor idle
  age 93: raw 15.90, floored 18.00 — FLOOR DECIDES
  age 94: raw 13.60, floored 18.00 — FLOOR DECIDES
  age 95: raw 11.30, floored 18.00 — FLOOR DECIDES
The born-1931 run confirms it end to end: the player's fitness on day 1 is exactly 18.000, i.e. the floor's value, not the raw 13.60. Ages 93–95 are inside the range `validate()` permits. Their "computed and then never wins a Math.min against a fitness of 0" is wrong — at that age the ceiling wins the Math.min immediately, before fitness has decayed at all.

ITEM 3 (AGING[7].recovery = 0.021) — CONFIRMED dead, but misclassified and their fix is ineffective. I set it to 0 and to 0.500 (25x) and ran 60 days at ages 85.6 and 94.6: recoveryFactorAt stayed 0.55 in all three runs and energy/condition/morale/sleepDebt/stress came back byte-identical (sleepDebt 5.611875158301383, stress 25.459597622887976 in every case). So the number is inert. But (a) they call it MECHANICAL while offering two options with opposite game meanings — by this project's own taxonomy that is a DESIGN_DECISION; (b) their recommended option is measurably cosmetic. Probe of where each floor binds: 0.55 → age 79 (47 flat years); 0.50 → age 82 (44 flat years); 0.40 → 87; 0.30 → 91. Lowering the floor to 0.50 buys the 80s band exactly two of its ten years (raw factor 0.529 at 80, 0.508 at 81, 0.487 at 82) and replaces "79 and 120 are identical" with "82 and 120 are identical". It does not deliver the promise they quote from the band's own prose; (c) they under-state the scope — the floor also eats the last year of AGING[6] (age 79 is a 70s-band year and is already at the floor), not just band 7.

ITEM 4 (15 `about` strings) — true but mis-scoped and understated by an order of magnitude. Their framing "inside the two exports that ARE read" is wrong for 7 of the 15: `LifeStage.about` lives in `LIFE_STAGES`, which is itself entirely dead — `LIFE_STAGES`, `STAGE_BY_ID` and `stageAt` have no caller anywhere. The real finding is the whole file. `src/engine/content/lifespan.ts` is 540 lines with 48 `export` statements, and the only import of it in all of src/ and tests/ is `src/engine/systems/life.ts:20: import { ceilingAt, recoveryFactorAt } from '../content/lifespan';`. Dead with nothing reading them: LIFESPAN_NOTE, PENSION_NOTE, ADULT_EXPECTANCY_NOTE, AGE_GATE_NOTE, LIFE_EXPECTANCY (~150 country figures), WORLD_EXPECTANCY, expectancyIn, expectancyIsPublished, adultExpectancyIn, PENSION_AGE (~120 countries), WORLD_PENSION_AGE, pensionAgeIn, pensionAgeIsPublished, LIFE_STAGES/STAGE_BY_ID/stageAt, AGING/agingAt (as exports), PARENT_AGE_GAP, PARTNER_AGE_GAP, SIBLING_WEIGHTS, SIBLING_AGE_GAP, PARENTS_STILL_TOGETHER, MOVED_AWAY, FAMILY_START, MILESTONE_AGES, BIRTHDAY_LINES, MILESTONE_LINES, PASSING_LINES, MOURNING_DAYS, GATES/GATE_BY_ID/DEFAULT_GATES/COUNTRY_GATES/NO_DRINKING/gateAgeIn/gateIsCountrys, YOUTH_CURVE/FULLY_FORMED/youthFactorAt. Counting 15 sentences when ~46 of 48 exports are unread is the audit missing the elephant, not catching it.

Net: the claim is overstated on items 1 and 2 (false), correctly aimed but mis-typed on item 3, and understated by roughly 46 exports on item 4.


### The creation screen, taste.ts and the engine give three different counts of which personality axes do anything.

**Cluster** `person-fields`


REFUTED on its central measurement. Their headline — "the real count is TWO, and the creation screen is the only source that is right" — is wrong. The measured count is THREE, and the creation screen is the *stalest* of the four sources, not the correct one.

THE BREAK: their probe only ever measured the autopilot, i.e. a player who never answers an ask and is therefore never cast in anything. In that world nothing can ever drive energy below 15, so of course ambition looks dead. But `life.go_up` (src/engine/world/audition.ts:812) and `life.take_note` (:819) are real player commands, and `settle` -> `theyWantYou` (:691) -> `takeTheirWeeks` puts the player on a shoot. The two things the ledger says landed TODAY — "being cast now takes real calendar days" (whatHasThem/theyAreFree) and "a working week now costs wellbeing" (A_WORKING_WEEK, life.ts:354 `hours = clamp(7.8 - w.stress*0.012 - A_WORKING_WEEK.shorterBy * hard, 5.4, 8.4)`) — are exactly what made ambition bite. They read today's code and measured yesterday's world.

PROBE 1 — /tmp/probe-play.mjs, `npx vite-node`, ZERO test-harness forcing. Six in-game years, the player simply issues `life.go_up` (tape, AS_WRITTEN) on every open ask and `life.take_note` on every note. All seven axes swung 5 vs 95, seed 'play':
    baseline {"went":31,"cast":18,"asks":40,"reliability":61,"fame":66,"prof":47,"demand":52,"stress":4.78,"debt":5.53,"morale":100,"condition":86.3,"travelFatigue":0,"readiness":49.1,"mem":"1,1,1,1"}
    openness             NOTHING MOVES
    conscientiousness    MOVES: went 12->27 | cast 9->17 | asks 14->36 | reliability 0->100 | fame 24->53 | prof 19->40 | demand 21->43 | condition 69.88->99.3 | mem 1,0.65,0.33->1,1,1,1
    extraversion         NOTHING MOVES
    agreeableness        NOTHING MOVES
    emotionalStability   MOVES: went 26->27 | cast 17->16 | asks 30->34 | reliability 0->97 | stress 92.62->2.04 | debt 60->5.52 | morale 0->100 | condition 0->90.02 | readiness 10.25->49.78
    ambition             MOVES: went 31->30 | cast 18->20 | asks 40->39 | reliability 61->59 | fame 66->68 | prof 47->51 | demand 52->54 | stress 4.78->87.29 | debt 5.53->60 | morale 100->0 | condition 86.54->0 | readiness 49.1->10.78 | mem 1,1,1,1->1,1,1,0.625
Ambition changes how many parts you win (18 vs 20), your fame, your industry demand, and whether an office still thinks of you.

PROBE 2 — /tmp/probe-gate.mjs, the gate itself, same pure-command play, 6 years:
    ambition=5  axisModifier(stressGain)=0.85  daysBelow15=294/2190  endStress=4.78  endDebt=5.53  reliability=51
    ambition=50 axisModifier(stressGain)=1.00  daysBelow15=336/2190  endStress=25.77 endDebt=13.02 reliability=59
    ambition=95 axisModifier(stressGain)=1.15  daysBelow15=381/2190  endStress=87.29 endDebt=60.00 reliability=59
The `if (w.energy < 15)` branch at life.ts:67 fires on one day in six of an ordinary played career. Their sentence "Autopilot pins energy at 25.23 forever" is true of the autopilot and false of the game.

PROBE 3 — /tmp/probe-career.mjs, three back-to-back 12-week jobs (the ledger's own "D1/D2" shape):
    ambition 5  -> reliability 77, remembersYou 1.0000, condition 55.3, morale 73.7
    ambition 50 -> reliability 69, remembersYou 1.0000
    ambition 95 -> reliability 0,  remembersYou 0.8150, condition 0, morale 0.04, stress 76.6, debt 59.8
Reliability 77 vs 0 off one slider. remembersYou is read at audition.ts:441 `if (rng.next() > remembersYou(sim, booking.holder)) continue;` — literally whether an office asks you at all. The chain is ambition -> stressGain -> stress on empty -> shorter autopilot nights -> sleep debt -> readiness -> reliability (whatTheWeekTook, audition.ts:668-677) -> remembersYou -> offers. A complete career loop, not a dangling knob.

WHAT OF THEIRS SURVIVES:
- openness is genuinely dead. I confirmed `travelFatigue` has exactly three writers and none raises it (life.ts:42 init 0, :77 subtract, :238 subtract), and measured travelFatigue = 0 even across a full three-job career. Their description is loose in one place — life.ts:77 is `(2 - personalityOf(...))`, an inversion, not "multiplies a decay" — but the direction and the deadness are right.
- extraversion, agreeableness, riskTolerance: dead. Confirmed.
- conscientiousness -> reliability -> remembersYou: confirmed, and STRONGER than they said. They found only the intermediate number moving. I found the outcome moving: /tmp/probe-relied2.mjs, autopilot, 1825 days — seed s3 gives 6 asks at conscientiousness 5 vs 7 at 25/50/95; seed s5 gives 5 asks from 3 offices vs 9 from 4. Their "below 25 only" (Math.min(0,...) against EXPECTED_OF_ANYBODY=60, content/audition.ts:435) is correct.
- All four count statements verified present: CharacterCreation.tsx:612, taste.ts:88-110, `node tools/wired.mjs` -> "3 Personality axes nothing consults (of 7): agreeableness, extraversion, riskTolerance", DEPTH.md:56 "| 7 personality axes | 4 | 4 |", UNBITTEN.md:36 and :109.

LINE-REF DRIFT (minor, but it shows they were not reading current HEAD carefully): they cite bootstrap.ts:298 for the reliability seed — it is at :306. They cite audition.ts:113-114 for the `Math.min(0,...)` wrap and the reliability read — it is at :174-175. Both files moved today.

SO THE OVERSTATEMENT/UNDERSTATEMENT INVERTS. They said the screen is right and taste.ts is wrong by two. In fact taste.ts is wrong by ONE (openness only — "Ambition costs... it shows up as stress" is a true sentence that passes the falsifiability test), and the creation screen is wrong in the worse direction: it tells the player at the exact moment they set the slider that Ambition "changes nothing yet" and "waits on shoots", when shoots exist and ambition is the single most career-destroying dial in the build.


### Nobody can see the booking board, which is the only pipeline the career has. The lever is money spent a year early and its effect is invisible until it arrives as one notification.

**Cluster** `unreachable`


PARTLY_TRUE, and refuted on three counts. Their structural facts hold — I re-ran them and they are right that no UI file reads `bookingsFor`/`universe.bookings`/`shootingHere` (grep of src/ui returns only `stagesOn`/`onStageAt` at estate.tsx:43), that no 'booking' or 'stage' look is registered (probe: `hasKind('booking')=false`, `hasKind('stage')=false`), that auditions are minted at exactly one site (audition.ts:458) off `shootingHere`, and that all 26 "Is Booked" notifications carry refType 0 / route 0. But the claim's second sentence is false and the severity and fix are both wrong.

(1) "its effect is invisible until it arrives as one notification" — FALSE, and this is their biggest error. The `lot` look renders FOUR readouts that move with `lot.sell`. estate.tsx:534 `Calls A Month` = `pull.calls.toFixed(1)`; estate.tsx:542 `{Math.round(pull.reach * 100)}/100 of the way to everybody who books a stage`; estate.tsx:557 `{one.count} Turned Away` with the reason; estate.tsx:518 `What Last Month Took` = `utilisation(...).earnsShare`. My probe, same seed, floor vs max spend at +36mo: calls/mo 1.25 vs 2.05; reach 0.00 vs 1.00; turnedAway [["price",7],["rebate",5]] vs [["rebate",14],["price",12],["booked",4]]; last-month earnsShare 0.161 vs 0.569. The engine comment at lot.ts:1110-1114 says outright that `turnedAway` exists so "the lever on selling can be read honestly... A player who cannot see that is being sold a trap" — and it IS rendered. The lever has a four-number dashboard. What is missing is the forward board, not the feedback.

(2) "a year early" — wrong number. `SELLING.remembers = 9` (content/lot.ts:548) and `reachOf` averages a 9-month window. Probe: reach is 0.000 at +3mo, 0.167 at +4mo, 0.500 at +6mo, 1.000 at +9mo. The readout starts moving in four months, not a year.

(3) "the only pipeline the career has" — overstated. `Play It` (BusinessWorkspace.tsx:1029) fires `company.cast` with `me.id`, seating the player in the family company's own picture at the band. That is a second route to being in a production and it is fully visible (the parts table, bands, axes, who holds each role). The booking board is the only *outside* pipeline.

(4) THEIR FIX DOES NOT DO WHAT THEY SAY. They claim Option A "makes the page's own sentence true." It cannot. `takeAnEnquiry` sets the shoot date at lot.ts:1106: `const from = sim.now + Math.round(30 + rng.next() * 90) * MS_DAY` — 30 to 120 days. LIVE weekly probe, 156 weeks, both spend levels: mean rows a `shootingHere` panel would show = 2.22 (floor) / 2.28 (max), max 5, and it renders NOTHING in 18/156 and 23/156 weeks (12-15%); furthest future shoot on the board mean +73d/+72d, max +155d/+153d. The sentence promises +365d. Their panel would sit under that sentence showing two rows four months out, one week in seven showing Empty — contradicting the prose more visibly than the current absence does. (Their own "shootingHere ahead: 2 / 4" numbers agree with mine; they just never compared them to the word "year".)

(5) THEY MISSED THE MECHANICAL DEFECT, which is cheaper and more falsifiable. By the falsifiability test the sentence at AuditionsWorkspace.tsx:43-44 is the thing that changes no outcome; by THE ONE RULE it is a promise with nothing behind it. It is also simply wrong about the engine by 2.4x-5x.

(6) THEY FOUND THE WEAKER DEAD REF. `subjectForRef` at subject.ts:45-48 states "there is not one literal `refType` written anywhere in the engine today — every one is pass-through of a caller-supplied value that no caller supplies. So this resolves nothing yet, on purpose" — and attention.tsx:17 repeats it. There are 51 literal refTypes in src/engine: 41 `'project'`, 9 `'audition'` (audition.ts:467, 523, 542, 598, 647, 686, 698, 769, 798), 1 `'property'`. `hasKind('audition')=false` and there is no 'property' kind either, so probe shows all 5 "Is Casting" notifications resolve to UNDEFINED. `wayTo` (attention.tsx:131-135) guards on `lookExists`, so nothing dead is painted — but the career's own notification is the one that claims an address and has none, while two comments swear no caller ever fills one in. That is code contradicting its own comment, ten times, and it is the thing that would actually give the career pipeline somewhere to go.

(7) SEVERITY IS WRONG. Over 3 simulated years the outside pipeline produces 3 auditions (floor) / 5 (max), all `never-answered` in an unattended run, and ZERO pairs of auditions whose shoot dates overlap — so the one decision a forward board would inform (hold the diary clear for something bigger) never arises in three years. The board is invisible, but what it would inform is currently near-empty. Minor, not serious.


### The company can pay the player money it does not have. sim.expense has no balance check and neither does payThePlayer, so the family's business goes negative silently.

**Cluster** `balance`


REFUTED on four counts, three of them measured. The bare mechanism survives; every correction they layered on top of it is wrong, including their recommended fix.

(1) THEY READ CODE ONE COMMIT STALE. Every casting.ts line number they cite matches commit 5671a3c exactly and none matches HEAD (f46cbe3, landed today 20:52). Verified with `git show 5671a3c:src/engine/world/casting.ts | grep -n`: their "payThePlayer at 943" is 943 pre-commit, 1020 at HEAD; "sim.transfer at 950" is 950 pre-commit, 1027 at HEAD; "the trio at 838-840" is 838-840 pre-commit, 854-856 at HEAD; "bookTheRoom at 1585-1591" is the casting round at 1583-1591 pre-commit, 1679 at HEAD. (Their "payFor at company.ts:505" is also wrong; it is 520-527.)

(2) "SILENTLY" IS DEAD AT HEAD, AND HAS THREE TESTS ON IT. casting.ts:857 now calls `sayIfItWentUnder` (defined casting.ts:946). My probe, their exact scenario at HEAD, seed 'a', €20m feature, `company.cast` on the player at fee 4,000,000,000:
  company 11700000 -> -7900495122 ; player 70000 -> 4000070000 ; audit []
  NOTIFICATION FIRED: "Hvitserkur Is Spending Money The Company Hasn't Got | €79,004,951 under. Sugar Land covers the difference at the end of the month, and every euro of it is counted against what the family will still put in — which is the same figure the next picture has to be greenlit against."
Their probe reports the identical cash deltas and the identical `audit []` and no notification, because it was not there when they ran it. tests/casting.test.ts has `describe('a deal that spends money the company has not got says so')` with three cases — says it and how far under; stays quiet when the company can pay; stays quiet for a deal that moves nothing on a company already under. All 109 casting tests pass.

(3) THEIR MAGNITUDE CORRECTION IS BACKWARDS. The ledger's -€761k was right; they inflated it 100x with an input no player can produce. The player's ONLY cast control is the "Play It" button at src/ui/workspaces/BusinessWorkspace.tsx:1027, which hardcodes `one.role.bandCents` — there is no fee input on it. The free-text fee box (BusinessWorkspace.tsx:1129-1143) lives inside the "Who Came In" table over `whoCameIn(sim, role)` = `role.seen`, and `bookTheRoom` at casting.ts:1662 refuses the player outright — `if (person.isPlayer || alreadyKnown(...)) return { ok: false, error: 'You know what ... is. Seeing them again is a day spent learning nothing.' }` — so the player can never enter `role.seen` and the typed fee can never be aimed at them. My probe of the reachable path (cast at band): company €117,000 -> -76104878 cents = **-€761,048.78**, player +€878,049, notification "€761,049 under". The ledger's figure to the cent. €4bn is an API call, not a game action.

(4) THE BIG ONE — THEIR RECOMMENDED FIX DOES NOT CLOSE THE EXPLOIT. Measured with their exact formula (`whatSayingYesCosts(role, me, fee) > behindTheCompany(sim)` -> refuse), at cast time behindTheCompany = €56,493,320 (cash €117,000 + stillToCarry €56,376,320). Binary-searched the largest fee their gate still allows, then actually executed it:
  LARGEST FEE THEIR PROPOSED GATE STILL ALLOWS: €28,685,684
  cast -> {"ok":true,"said":"Alex Rivera is in, at €28,685,684."}
  company €117,000 -> **-€56,376,319** ; player pocketed **€28,685,684**
Their gate turns a €40m self-payment out of a €117,000 company into a €28.7m self-payment out of a €117,000 company — it removes 28% of the exploit and is presented as closing it. The structural reason: `stillToCarry` (lot.ts:719-725) is `(line − share) × profitThisYear`, the family's multi-year FUTURE patience. Gating a same-day irreversible transfer into the player's personal account against a forward-looking funding ceiling 480x the cash in the account is a category error. Their own recommendation ("1 alone stops the exploit") is measurably false.

(5) THEIR FIX 3 BREAKS THREE LIVE TEST ASSERTIONS AND CONTRADICTS THEIR FIX 1. They call `Ledger.availableFunds` an unread primitive and offer deleting it. tests/integrity.test.ts:28, tests/integrity.test.ts:44 and tests/money.test.ts:141 read it; all 35 of those tests pass now. And the alternative branch ("or make step 1 call it") contradicts step 1: for a `company_cash` account `availableFunds` (ledger.ts:171-181) falls through to `return a.balance` — a plain cash check, which is precisely the check f46cbe3 attempted and reverted with measurement ("A cash test on casting would have made casting impossible at exactly the moment casting happens"). Step 1 gates on €56m of future patience; step 3 offers to gate on €117,000 of cash. They are not the same fix.

WHAT SURVIVES: `sim.expense` (simulation.ts:579) and `sim.transfer` (simulation.ts:503) have no balance check, `Ledger.post` (ledger.ts:146) validates only integer-and-sums-to-zero, and `payThePlayer` (casting.ts:1020) moves the player's whole fee via `sim.transfer` (casting.ts:1027) with no ceiling of ANY kind — the only validation on the fee is `Number.isFinite(fee) && fee >= 0`. Their point (6), that a negative company balance is the designed state, is correct and is now the codebase's explicit signed position: the `sayIfItWentUnder` docstring (casting.ts:930-945) and tests/doors.ts `theyCanAffordIt`, both written today, say "It goes under, which is allowed and is said out loud."


### stillToCarry is the family's declared remaining patience and it caps what the company may commit to — so the money the family actually puts in obeys it.

**Cluster** `balance`


REFUTED on the load-bearing argument, the classification, and the fix. The residual is real but much smaller than stated.

1) "stillToCarry ... constrains zero euros of actual money" is FALSE, and a probe kills it. /tmp/probe-refute-carry.mjs boots two identical worlds from seed 'a', greenlights the same €20m feature in both, and differs in exactly one input: arm A casts the player at €40m (the overspend from their own probe-balance6), arm B does not. One month later:
   A: balance 604878, paidIn 7970000000, stillToCarry 0, conditional true
   B: balance 2800000, paidIn 60000000, stillToCarry 5577632000, conditional false
   A(overspent): whyNotBuild -> cannot-carry, build -> {"ok":false,"error":"The family won't carry it on top of what it is already carrying. €17,272,729 against €6,049 ..."}
   B(did not):   whyNotBuild -> undefined,   build -> {"ok":true,"readyAt":1817451000000}
€17,272,729 of real expense (sim.expense(account, SMALL_STAGE_COST_CENTS, BUILD_MEMO) at lot.ts:329) is executed in one world and refused in the other, because of stillToCarry and nothing else. The falsifiability test PASSES: change the input, the outcome changes, not the sentence. The same ceiling is enforced in euros at the greenlight door (making.ts:475-486) and that is covered by a currently-passing test — tests/making.test.ts:817 'will not commit to more than there is behind the company' and :838 'lets a bet-the-company picture through' (55/55 pass on the original tree).

2) Their fix breaks two named tests. I copied the tree to a scratchpad, applied their patch verbatim (`const put = Math.min(Math.ceil(short / step) * step, stillToCarry(sim)); if (put <= 0) return 0;`) and ran tests/lot.test.ts:
   FAIL tests/lot.test.ts > and somebody is paying for that > stops writing a blank check, and the condition is that it is a business — AssertionError: expected 0 to be greater than 0 (line 284)
   FAIL tests/lot.test.ts > and somebody is paying for that > leaves a way back, because a dead end is not a decision — AssertionError: the money door never opened again: expected false to be true (line 303)
   Tests 2 failed | 41 passed. The original tree is 43/43.
The mechanism is structural, not incidental: `stillToCarry` returns 0 the moment `standing.conditional` is true (lot.ts:720-721), so `Math.min(short, stillToCarry)` is 0 for every conditional month — i.e. the family stops paying forever exactly where the code says the cheque continues under a condition. /tmp/probe-refute-carry2.mjs, seed 'lot-back', 24 months: "months the family paid 17, of which paid while stillToCarry===0: 17". All of it. Under their cap the account never returns above GREENLIGHT_FLOOR (company.ts:288, €50k), so the greenlight capability is shut permanently — the dead end the file explicitly forbids ("Recoverable on purpose... there is always a way back", lot.ts:626-628).

3) Misclassified. MECHANICAL requires "the code contradicts its own comment" with one obviously-right fix. The comments do not say what they claim. `stillToCarry` is documented as "What the family will still put in BEFORE the money comes with a condition" and "Zero once the money is conditional, WHICH IS NOT THE SAME AS BEING BROKE" (lot.ts:707-717) — a forward ceiling on commitments, explicitly not a cap on covering spend already incurred. `familyCovers` documents the post-line behaviour it actually has (lot.ts:620-629): past the last rung the cheque continues but conditional on the lot earning. And casting.ts:930-945 documents the uncapped path deliberately: "A cash test on casting would have made casting impossible at exactly the moment casting happens... the next greenlight is measured against what is left — so a deal closed today is a picture not made in two years." That is precisely what arm A demonstrates. There is a defensible reading, it is written down, and it is tested.

4) "The overshoot is invisible the moment it happens" is overstated. /tmp/probe-refute-carry3.mjs after the same overspend: share 0.622, printed by whatTheFamilySays as "62/100 of a year of the group's profit has gone in", against a last rung declared at 0.5 (content/lot.ts:623, bitten to 0.44 by one shut year at SHUT_YEAR_BITE=0.12). paidInSoFar is 7,970,000,000 on the ledger, audit clean. Three notifications name the cause: "The Big One Is Spending Money The Company Hasn't Got :: €79,004,951 under...", "Sugar Land: The Money Comes With A Condition", "Sugar Land Studios Funds Itself This Month". What is missing is a single figure saying "you are €23m past the line" — a reporting gap, not an unread word.

Residual truth (why this is PARTLY_TRUE, not NEVER_TRUE): familyCovers genuinely has no ceiling test inside a month, so the month that crosses the line crosses it in one uninterrupted payment, 41% past, and the crossing amount is never named as such. The real uncapped door is casting (whatSayingYesCosts, casting.ts:917-927) which tests no ceiling at all, not familyCovers. Severity is minor, not serious: the consequence lands the following tick on two doors in real euros.


### payTheOverage charges only the difference because 'the band is already inside the budget', and payThePlayer hands the player their fee — so a seat costs the company its fee once.

**Cluster** `balance`


Their arithmetic is real, but the claim as filed — MECHANICAL, serious, with that fix — does not survive. Three independent refutations, all measured.

(1) THEY READ STALE CODE — provable from their own line numbers. They cite payTheOverage at src/engine/world/casting.ts:898 and payThePlayer at 943-951. In HEAD those are at 975 and 1020. `git show f46cbe3^:src/engine/world/casting.ts` puts them at exactly 898 and 943 — the file as it stood before today's 20:52 commit f46cbe3 ("Casting: the player is not asked, and an overdraft says so", +95/-4 to casting.ts). In that pre-commit file `whatSayingYesCosts` does not exist (grep: no match). So they never saw the function shipped today at casting.ts:915-928, whose docstring enumerates the three terms they call a bug: "What moves on the day is the player's own fee, because they hold a real account and the company has to actually hand it over; whatever was agreed above the band ...; and the flights and the hotel for somebody who does not live here." Nor its UI wiring (src/ui/workspaces/BusinessWorkspace.tsx:1073), nor its test (tests/casting.test.ts:2057-2078: `expect(whatSayingYesCosts(role, me, role.bandCents), 'the player holds a real account').toBe(role.bandCents)`), nor the fourth restatement in tests/doors.ts:113. MECHANICAL is defined as "the code contradicts its own comment". Here the code agrees with four prose declarations written hours ago, and my probe on HEAD shows the engine matches the screen to the cent in all four cases (nonplayer-at-band 0/0, nonplayer-over-band 87,804,878/87,804,878, player-at-band 87,804,878/87,804,878, player-over-band 263,414,634/263,414,634 — MATCHES UI? true, true, true, true).

(2) THEIR FIX IS MEASURABLY WRONG, TWICE. Applied verbatim to a copy at /tmp/slate-fixtest (`if (person.isPlayer) return;` in payTheOverage + `project.spentCents += fee;` in payThePlayer). Full suite still passes (44 files, 1190 tests) — no test catches either problem — but:
  (a) The casting screen now lies. Re-ran my probe against the patched tree: player at 2x band, whatSayingYesCosts still returns 263,414,634 while the engine moves 175,609,756. MATCHES UI? false. They never mention whatSayingYesCosts, so they never propose changing it.
  (b) `project.spentCents += fee` steals from the Icelandic treasury. certifiable() at src/engine/world/rebate.ts:127 is `project.spentCents - (project.notSpentHereCents ?? 0)`, and the band is already inside spentCents via settlePeriod (src/engine/world/making.ts:827, `project.spentCents += owed` where owed = budget * period.spends, a term with no cast in it). Same seed, same €20m picture, cast the player at the band, delivered, claimed at 25%: REBATE PAID 419,169,854 unpatched vs 438,047,903 patched. Their fix hands the state's money back on €878k the company never spent on top of the budget — it converts an internal double-charge into free government money.
  (c) It does not fix the case they themselves call "the ledger's own scenario". At the band `over <= 0`, so payTheOverage was already a no-op; player-at-band cash out is 87,804,878 before the patch and 87,804,878 after. The band is still spent a second time inside the periods.

(3) SEVERITY IS INFLATED AND THE PATH HAS NO DOOR. Their −€79m came from a €40m fee on a €20m picture — 45.5x the band, typed by hand. The screen prefills `askFor`, which for a player with no quote is exactly the band (probe: askFor(player) = 87,804,878 = bandCents), where their mechanism never fires. Worse: `putItOut` explicitly excludes the player from `role.seen` (casting.ts:529 `if (!person || person.isPlayer) continue;`), the casting table only renders `whoCameIn` (BusinessWorkspace.tsx:1065 `came.map(...)`), and `company.cast` is dispatched from nowhere else (BusinessWorkspace.tsx:925 is the only call in src/ui). Probe: `PLAYER IS IN THE ROOM? false`. There is no button in the game that casts the player. The player's real acting work runs through src/engine/world/audition.ts, which pays them directly (audition.ts:542) and never touches project.cast, castSomebody or payThePlayer. Both their probe and mine reached this only by dispatching company.cast with the player's id by hand.


### buildAStage gates on behindTheCompany() first, so it cannot overdraw the account.

**Cluster** `balance`


Their reading of buildAStage's own gate is right, but the sentence they said was "the part worth saying" is factually false, and it is the sentence their severity downgrade and their "leave buildAStage as it is" recommendation rest on.

THE REFUTED SUB-CLAIM: "AND THE GATE IS SELF-LIMITING ... So a build cannot be stacked with a greenlight to exceed the ceiling."

It cannot be stacked in ONE order. They tested only that order. Reverse it and the ceiling evaporates.

PROBE 1 (scratchpad/probe-stack.mjs, doors opened with tests/doors.ts's own command path, seed 'stack'):
    SMALL_STAGE_COST_CENTS 1727272900  (€17,272,729)
    behindTheCompany BEFORE anything   €56,493,320
    GREENLIGHT {"ok":true,...}  budgetCents €56,492,320   stage greenlit
    cash AFTER greenlight              €117,000   (unchanged)
    behindTheCompany AFTER greenlight  €56,493,320  (UNCHANGED)
    whyNotBuild AFTER greenlight ->    undefined
    buildAStage AFTER greenlight ->    {"ok":true,"readyAt":1814772600000}
    TOTAL COMMITTED = €73,765,049 against a €56,493,320 ceiling — 31% over.

PROBE 2 (scratchpad/probe-stack2.mjs, seed 'stackC') — the pool is not a pool at all:
    ceiling €56,493,320
      picture 1 @ €50,000,000 -> GREENLIT
      picture 2 @ €50,000,000 -> GREENLIT
      picture 3 @ €50,000,000 -> GREENLIT
      picture 4 @ €50,000,000 -> GREENLIT
    total committed €200,000,000 ... behind now €56,493,320
    whyNotBuild after 4 greenlights -> undefined
    and the build -> {"ok":true}
€217m of commitments, and the refusal string buildAStage would have printed still quotes "€56,493,320 in the account and left in the family's patience."

WHY: greenlight (making.ts:542-570) writes project.budgetCents and schedules periods; it expenses nothing. stillToCarry (lot.ts:719-726) is derived from money the family has ALREADY paid in, not from money committed. So a greenlit budget moves neither term of behindTheCompany (lot.ts:290-294). buildAStage self-limits only because it is the one commitment in the game that moves cash on the day — it limits itself, in one direction, and nothing else.

THIS IS A DEFECT ON THE buildAStage SIDE, not only making.ts's. behindTheCompany's own docstring, lot.ts:286-288, says: "It is the ceiling on what this company can commit to at all, and the room and the picture spend out of it together." My probe falsifies both halves of that sentence. tests/lot.test.ts:676-679 repeats it verbatim as a comment with no test under it. BusinessWorkspace.tsx:1325-1327 prints the number on screen, inches from the Build It button — after greenlighting €200m the panel still reads "€56,493,320 behind the company." Apply the project's falsifiability test: change the input (greenlight the whole ceiling first), and the outcome does not change — only the sentence does. That is the ONE RULE failing on a declared word.

SEVERITY IS WRONG. They said minor. It is serious: the stated ceiling is non-binding for the single largest spend in the game, and the falsity is printed on a player-facing screen next to the button it is supposed to govern.

WHAT I COULD NOT REFUTE (checked, they are right):
- The overdraft is designed; familyCovers repairs it. Probe D: greenlight + build, +400 days -> cash €285,402, paidIn €82,000,000.
- Their fix (b) is safe TODAY. I tried to break it: lot.ts:292 reads cashFor(lot.ownerId) while making.ts:476 reads cashFor(project.companyId), which are different lookups. But company.develop (company.ts:764-789) hardcodes companyId: parent.id, there is no other project-creation site, and lot.ownerId is the parent. probe-eq.mjs with the American arm formed: project companyId company_00000i (SAME as lot owner); behindTheCompany €56,555,120; wouldBe's inline €56,555,120; EQUAL? true. So the swap is behaviour-identical. (Note a third figure they did not mention: companyCash (company.ts:105-109) sums BOTH film companies and is what GREENLIGHT_FLOOR reads — so there are three "cash" notions here, not two.)
- Build-then-greenlight is refused, as they say — probe A: cash after build €-17,155,729, door blocker ['Money In The Company'], "It needs money in the company first."

Code is current: lot.ts and making.ts are clean in git status, last touched 39a4544 / 5671a3c (both today, both before this path). tests/lot.test.ts + tests/making.test.ts: 98 passed.


### The overdraft is a company-only concern, because familyCovers exists to repair it.

**Cluster** `balance`


REFUTED on four independent grounds. The headline claim ("the overdraft is a company-only concern") survives intact; their PARTLY_TRUE downgrade is not earned.

1. THEIR PROBE MEASURES THE WRONG THING. /tmp/probe-balance6.mjs forces `sim.expense(account, 50_000_000, ...)`. No game action produces that. The only expense that ever touches the player's personal account is audition.ts:544, `way.costsCents`, whose maximum value is 12_000 cents (content/audition.ts:159). Their probe is 4,166x the largest real charge. What it actually proves is that `Ledger.post` (core/ledger.ts:141-166) is sign-agnostic — which is deliberate and documented: "the guard that makes money conservation a structural property". Commit f46cbe3 (today) states the company case outright: "a company mid-picture is supposed to be overdrawn". They proved a property of double-entry bookkeeping and reported it as a defect in `goUpFor`.

2. THE STATE IS NOT REACHABLE. I ran the most money-losing policy the game permits — pay for the room on EVERY audition, never answer a note, so readings settle as a no (worst case after 47eca82). 6 seeds x 25 years, 1,117 paid readings:
    w1: 25yr readings=174 cast=93 LOWEST BALANCE=100000 final=179630600
    w2: 25yr readings=184 cast=96 LOWEST BALANCE=88000  final=143686900
    w3: 25yr readings=199 cast=115 LOWEST BALANCE=76000 final=171488700
    w4: 25yr readings=192 cast=101 LOWEST BALANCE=112000 final=217694050
    w5: 25yr readings=183 cast=97 LOWEST BALANCE=100000 final=149636150
    w6: 25yr readings=185 cast=94 LOWEST BALANCE=100000 final=157247250
Lowest balance in 150 simulated years: 76000 cents (EUR 760). It never comes within EUR 760 of zero.
The binding number, 10 seeds: PAID READINGS BEFORE THE FIRST ACTING FEE = 1,3,1,1,1,2,2,1,1,3. Maximum 3, against the 11 their own arithmetic requires. Their "roughly eleven... reachable in a lean stretch" is off by ~4x on the one constraint that matters: the first casting pays EUR 20,790 (173x a reading) and arrives by day 122-502. Longest rejection streak observed anywhere was 9, and it occurred when the account was already six figures.

3. THEIR RECOMMENDED FIX (b) IS BACKWARDS. Commit 47eca82 — which landed AFTER they read the tree — measured the room over 6 seeds x 25 years: "more work, less money. +13 parts and EUR 487,428 LESS in the player's account". My independent probe, 6 seeds x 15 years, same seeds both ways:
    TOTAL: room=682515500 tape=704097200; forcing the tape is worth 21581700 cents to the player
Taping is worth EUR 215,817 MORE than the room. So "being broke forces the tape" hands a broke player the financially SUPERIOR option — poverty would make you richer. That is the opposite of their stated goal, "it makes being broke a thing that closes a door". Their premise that the room/tape choice is money-free is false: it is already money-dominant, in the direction their fix would reward.

4. THEY READ STALE CODE — the exact failure the brief warned about. Their refs (audition.ts:520-523) are the pre-47eca82 line numbers; `git show 47eca82^:src/engine/world/audition.ts | grep -n` returns exactly 520/521/522. HEAD is 542-547.

Also minor: they frame `costsCents` as "a number that only ever subtracts" as if that were a defect. Subtracting IS reading it. Change the way, the balance changes — it passes the falsifiability test today. And `finance.transfer` does not exist in src/; it appears only in tests/integrity.test.ts as a refused unknown command, so that is not a safety net either way.

WHAT IS LITERALLY TRUE AND INERT: yes, `familyCovers` (lot.ts:617, called once at lot.ts:595 from the LOT_OVERHEAD_KIND tick at lot.ts:431) only ever runs against company cash, and nothing repairs the personal account. Confirmed. But a repair for a state that no play reaches is not a defect — it is an unbuilt feature, and by THE ONE RULE, adding a guard nothing can trip would itself be a declared word with nothing that reads it.


### "The unscripted contributor cast board" is unreachable — no plan carries cast:'performers' for the unscripted season.

**Cluster** `seasons-misc`


Their bare fact survives — UNSCRIPTED declares no `cast`, so `castsPerformers` is false and `layTheRoles`/`armTheCasting` never run (confirmed by my own probe: roles undefined, scheduled kinds are [project.crew, project.period, project.part, project.banked, project.delivery], no project.cast). Everything they built on top of that fact is wrong, including the verdict word and the severity.

1) THE LEDGER DOES NOT MISDIAGNOSE, AND IMPLIES NO FORBIDDEN FIX. They never read the ledger's long-form entry. The one-liner they quoted, docs/UNBITTEN.md:386 "**The unscripted contributor cast board.**", is a back-pointer inside the summary list headed "### Correct, and nothing can reach it" (docs/UNBITTEN.md:365). The entry it points at is docs/UNBITTEN.md:142-149, under "## Unreachable: correct, and nothing can get there":
  "**`datesFor` on a plan with no shoot** ... It dates a part off the plan's base period, which is right for a format season. No greenlight can reach it: only a plan carrying `cast: 'performers'` lays any parts, and both plans that do have a period called `shooting`. The contract is asserted on the function directly, and the day a contributor cast board exists it is already right."
That is *their own diagnosis*, verbatim, written before them. The ledger is not proposing `cast: 'performers'` on UNSCRIPTED — it cites `cast: 'performers'` as the *reason* nothing reaches that branch, and names the contributor board as the future thing that would. Their entire "WHAT IS NOT A FIX" paragraph argues against a fix nobody proposed. And the ledger is not even filing this as a defect: it is an inventory line for correct-but-unreachable code. tests/crew.test.ts:100-123 says the same thing and is written to be right the day the board exists ("The day a contributor cast board exists, this is already right; a literal would have been found wrong by a player.").

2) THE DOWNSTREAM READERS ARE NOT STARVED. Their load-bearing argument for option (a) is: "`content/trouble.ts:184` ... and `world/trouble.ts`'s `backToTheRoom` are built for exactly this and today fire against nobody." That is false, and the repo already has a passing test saying so. `withdrawn-consent` is gated by `needs: { movedDuringTheWork: 'rights' }` (src/engine/content/trouble.ts:183), and `movedDuringTheWork` (src/engine/world/trouble.ts:66) reads the *periods*, not any contributor record — its own doc at :55-65 says "The predicate reads the periods and never the plan's name." Probe /tmp/claude-0/.../scratchpad/probe-c.mjs, 10 real unscripted greenlights advanced to finishesBy:
  seed c0: Withdrawn Consent notices 3 | seconds owed again 1800
  seed c1: 2 | 11700
  seed c3: 2 | 12600
  seed c4: 2 | 25200
  seed c6: 1 | 19800
  ... fired 10/10 seeds; cost the cutting room real seconds in 8/10.
  unscripted deck: [compliance-note, notes-round, coverage-debt, master-rejected, withdrawn-consent, chain-gap, lost-moment]
  feature   deck: [compliance-note, coverage-debt, master-rejected, chain-gap, lost-moment]
And tests/trouble.test.ts:433-446 already asserts this, with THE ONE RULE as its comment: "A row nothing can ever draw is a declared word with nothing reading it." 93/93 green in trouble/crew/plans.

3) THEIR FALSIFIABILITY TEST IS CIRCULAR. "Change anything about who you would pick and nothing moves, because there is nothing to pick" tests an input that was never declared. The inputs the cast board period *does* declare all move outcomes. Probe /tmp/claude-0/.../scratchpad/probe-b.mjs:
  shootWeeks 3 / 6 / 10 -> cast board 5.00 / 9.00 / 15.00 weeks
  per 1.5 -> 9.00 wk ; per 4 -> 24.00 wk
  spends 0.12 -> spentCents 90,000,000 ; spends 0.40 -> 174,000,000 (moved: true)
  compliance's `rights: 'cleared'` removed -> movedDuringTheWork(unscripted,'rights') flips true -> false, and withdrawn-consent leaves the deck.
The period is falsifiable on every input it declares. There is no unread declaration here: `cast?: 'performers'` is read at src/engine/world/casting.ts:743 and src/engine/world/making.ts:656; `per`, `spends`, `advances` and `unit` are all read. THE ONE RULE is not violated. The only thing "declared" that nothing reads is prose in a doc comment, and prose is not a declared word.

4) THE €360,000 IS BACKWARDS. Probe /tmp/claude-0/.../scratchpad/probe-d.mjs: every plan's `spends` sums to exactly 1.000 (feature 0.2/0.5/0.3, series 0.14/0.58/0.28, unscripted 0.12/0.18/0.42/0.24/0.04). The cast board's 0.12 is the season's above-the-line share, which is what the plan header at src/engine/content/making.ts:414-416 says it is: "above the line barely exists, because there is no script cost and the contributors are on stipends rather than salaries." The €360k IS the twelve contributors, modeled at the grain every other period uses. Their own option (a) proposes to pay the stipends "off the plan's `spends: 0.12`" — i.e. to redistribute money that is already leaving the account on schedule. Money going out "for twelve people who do not exist" is a rhetorical flourish over "the season's ATL line is 12%."

5) "360 CONTRIBUTORS SEEN, NONE OF THEM A RECORD" CONDEMNS THE WHOLE FIELD. `unit`'s own doc, src/engine/content/making.ts:148-157, defines it as a counting convention, not a promise of records: "What a week of this period produces, counted the way the people in it count it." FEATURE's `shooting` unit is `{one:'shooting day', aWeek:5}` — thirty shooting days, none of them a record either. The sole reader is display: src/ui/looks/business.tsx:507-513 multiplies span by `unit.aWeek` for a schedule row. By their standard every period in the file is defective.

6) NOTHING FALSE REACHES A SCREEN. They quote `whereTheCastStands` returning "The Island has no parts written yet." — but the player never sees it. src/ui/workspaces/BusinessWorkspace.tsx:410 gates the whole Parts modal on `(project.roles ?? []).length > 0`, so a format season shows no cast panel at all. There is no visible lie to fix.

7) THE ONE-MEMBER UNION IS NOT "THE ACTUAL DEFECT". `cast?: 'performers'` is the same forward-shaping the file does deliberately elsewhere and calls a virtue: `unit`'s doc (making.ts:154-157) says "An animated picture, when it comes, counts approved shots, and none of the machinery around this has to change to let it." Shaping a field so a second kind drops in without a rewrite is this file's documented convention, not a contradiction.

WHAT SURVIVES: the plan's header comment (making.ts:395-397) calls choosing twelve people "the plan's defining act ... it cannot be undone," and no player can make that choice. That is a real gap, correctly described by the repo's own ledger and its own test, in a section titled "Correct, and nothing can reach it." It is a feature the owner has not built yet, not a defect — and at minor severity, not serious: no dead declaration, no false sentence on screen, no starved reader, and the season's money and calendar are already modeled, already responsive, and already carry the consequence (withdrawn consent) the plan exists to make possible.

They got the kind right (FEATURE) and everything else wrong.


### Three more guards at points the arithmetic already settles — guards that can never fire because a prior clamp/round already forces the value.

**Cluster** `seasons-misc`


Their headline — "guards that can never fire", "all verified by running the actual functions" — is false for one of the six, and the classification is wrong for two.

REFUTATION 1 (hard, from the real suite): src/engine/world/lot.ts:932 `if (spend > 0 && asks > spend * most)` FIRES, 8 times per full test run, and the `spend > 0` conjunct is the ONLY thing stopping the refusal branch. I instrumented the unmodified function and ran `npx vitest run` on a copy (44 files, 1200 tests, all pass):
    3178  trouble100:asked
       8  lot932:spend<=0
       8  lot932:CONJUNCT_LOADBEARING   <- asks > spend*most was TRUE; only `spend > 0` stopped the return
All 8 come from tests/deciders.test.ts alone (isolated run: same 8/8).

What they missed: the ten ENQUIRY_SHAPES rows are not the only Enquiry the engine builds. src/engine/decided.ts:158, the `lot.booked` decider's `spend` read, OVERWRITES it:
  spend: (e, t) => ({ ...e, need: { ...e.need, spendIsk: Math.round(t * 3_000_000_000) } }),
and src/engine/core/deciders.ts:121 evaluates `const t = steps === 1 ? 0 : i / (steps - 1);` — t = 0 on the first step of every sample. So spendIsk = 0, spend = Math.round((0/150)*100) = 0. They audited the content table and stopped there.

Their fix silently inverts a registered decider. sweepOne(lot.booked,'spend') at t=0, current vs their patch applied:
  s0 commercial/local      Stage 3  ->  nowhere
  s1 limited series/local  Stage 3  ->  nowhere
  s2 documentary/local     Stage 3  ->  nowhere
  s3 feature/local         Stage 3  ->  nowhere
Four of six samples flip. And nothing catches it: I applied ALL SIX of their edits to a repo copy and got 44 files / 1200 passed. tests/deciders.test.ts only asserts `inert === false`, which stays false. A green suite plus an inverted answer is precisely the failure DEPTH.md's harness exists to catch.

REFUTATION 2: src/engine/world/trouble.ts:328 `if (above <= 0) return 0;` is a divide-by-zero shield, not a redundant clamp, and their stated fix ("delete the line and inline aboveTheRoom into Math.min(1, rungsLost / above)") makes the division live. Math.min(1, 1/0) = Math.min(1, Infinity) = 1, so the failure is MAXIMAL, not neutral. aboveTheRoom returns 0 on any plan/ladder mismatch — probe over all combos: feature x picture 2, feature x season 0, series x picture 2, series x season 0, unscripted x season 4, unscripted x picture 0. Probe of backToTheRoom, rungsLost=1, part of 3600 seconds:
  plan=unscripted ladders=picture   above=0  current owes 0     their fix owes 3600 (whole part)
  plan=feature    ladders=season    above=0  current owes 0     their fix owes 3600
  plan=unscripted ladders=undefined above=0  current owes 0     their fix owes 3600
  plan=feature    ladders=picture   above=2  current owes 1800  their fix owes 1800
That inverts the function's own comment at trouble.ts:317-322 ("Without the clamp ... a note would cost them nothing") into "a note costs them the whole episode". And the mismatch is designed for: src/engine/domain/company.ts:380-387 says `ladders` is stored on the project rather than read through the plan precisely so the two CAN diverge — "a plan's ladders could be revised and a picture already in flight should keep being measured against the ladder it was started on." greenlight (making.ts:551) is the only writer today, so it is dead today; the field exists to make it live tomorrow.

WHERE THEY ARE RIGHT (5 of 6 never fired across the instrumented suite, so do not waste a second pass):
 - casting.ts:471 — dead. total >= 62 always; bandCents bottoms at 0 (casting.ts:180 `weight > 0 ? ... : 0`, castPot = budget*CAST_SHARE), and reachOfBand(0) = 24.00 (probe: min 24.00, max 82.00). Only NaN/negative reach empties the set and nothing produces one.
 - trouble.ts:100 — dead. `asked` 3178 times, FILTERED 0 times.
 - making.ts:1031 — dead, never fired.
 - audition.ts:223 — dead, never fired; shoot span bottoms at 1 week.
 - making.ts:618 — never fired, but it is a crash shield, not a silent branch: weekly[0]!.from on an empty array throws TypeError.

ACCURACY: their line numbers drift. backUpTo is making.ts:1031 not :992; feeFor's floor is audition.ts:223 not :201; the reachesTo guard is casting.ts:471 not :470. Only lot.ts:932, trouble.ts:328/100 and making.ts:618 are right. For a claim whose entire weight is "I ran it", the refs should land.

NET: not three, not six — four genuinely dead lines (casting.ts:471, trouble.ts:100, making.ts:1031, audition.ts:223), one crash shield (making.ts:618), one live load-bearing conjunct (lot.ts:932), and one divide-by-zero shield whose removal is unsafe (trouble.ts:328). "Understated" is wrong; the count is inflated by two and one of the two is the opposite of dead.


## Already settled (4)

Fixed or never true, confirmed by probe.


### The guild signature is a gate with no money behind it. The content says what the agreement costs and nothing charges any of it.

**Cluster** `company-ends` · **Verdict** NEVER_TRUE


The headline is flatly wrong, and it was never true — not recently fixed. src/engine/world/company.ts:605-607:
    const parent = parentCompany(s.universe);
    const paid = payFor(s, parent ? parent.id : company.id, facts.depositCents, `${facts.body} deposit`);
    if (!paid.ok) return paid;
`payFor` (world/company.ts:502-511) refuses when the balance is short and otherwise calls `sim.expense`.

PROBE /tmp/probe-guild.mjs:
  cash after arm       178800
  SAG deposit content  25000
  sign sag             {"ok":true,"id":"sign_000011"}
  cash after signing   153800  delta = -25000
  ledger entries naming "deposit": 1
    {"memo":"SAG-AFTRA deposit","postings":[{"accountId":"account_00000k","amount":-2500000},{"accountId":"account_00000z","amount":2500000}]}
  drained cash         1
  sign sag while broke {"ok":false,"error":"That costs $25,000 and the company hasn't got it."}
  signatures now       0

`git log -L 593,625:src/engine/world/company.ts` shows the `payFor` line present in the file's FIRST commit (a56e240 "Make the family business a business"). Nobody fixed this today; the ledger entry was wrong when it was written.

The gate is real too: `globalRuleOne` (world/casting.ts:870-882) reads `signedWith(sim.universe, 'sag_aftra')` and refuses to cast; it is called at casting.ts:795 and casting.ts:1118 and asserted at tests/casting.test.ts:1682-1685.

WHAT IS ACTUALLY UNWIRED (the narrow, true version):
1. `GuildFacts.binds` — content/incorporation.ts:258 "Minimums, pension and health contributions on every salary, and residuals for as long as the picture is used"; :268 and :277 the same for WGA and DGA. Nothing charges a minimum, a contribution or a residual. `grep -i residual src/` returns four hits: three are this same prose, one is an attribute name at domain/attributes.ts:630. `askFor` (world/casting.ts:329) has no union floor and no uplift for a SAG performer over an Icelandic one, so signing changes WHO you may cast and never WHAT they cost.
2. `Signature.depositCents` (domain/company.ts:196) — written at world/company.ts:616 and read by NOTHING. The UI reads `facts.depositCents` from content (ui/looks/business.tsx:336-337), not the record. Its own doc says "Cash the guild HOLDS against what you will owe", but `payFor` books it as an expense and it is never returned or released on `endedAt`.

OVERSTATED BY: the entire headline. $25,000 leaves a real account, a broke company is refused by name, and three call sites read the door it opens.


### Age decides nothing. (docs/UNBITTEN.md:293)

**Cluster** `lifespan` · **Verdict** NEVER_TRUE


Both of the two live exports change outcomes, and I proved it by A/B, not by reading.

Method: copied the tree to a scratch dir, added env-gated short-circuits to ceilingAt and recoveryFactorAt only, and ran the same 75-year save (`quickSave({}, 'lifespan-probe')`, player born 2001, age 24.7 at boot) three times. Player wellbeing at year 75:

  BASELINE (both on)        fit 0.000  cond  0.000  energy  0.000  morale  0.000  stress 25.460
  ceilingAt -> {100,100}    fit 0.000  cond 21.606  energy  0.000  morale  0.000  stress 25.460
  recoveryFactorAt -> 1     fit 0.000  cond 17.545  energy 25.239  morale 50.952  stress  4.480

recoveryFactorAt is the larger of the two and it is not close: pinning it to 1 keeps energy at 25.2 instead of 0, morale at 51.0 instead of 0, and stress at 4.5 instead of 25.5, and it moves the year-40 divergence point (baseline energy/morale collapse to 0 between y30 and y40; with recovery pinned they never collapse). It descends cleanly with age: recoveryFactorAt(25)=0.994, (50)=0.902, (70)=0.694, (79)=0.55.

ceilingAt also bites: year-75 condition 0.000 vs 21.606 is a 21.6-point difference on a dial the game prints.

The honest narrower claim, which IS true: neither of the two dials ceilingAt writes reaches any consumer other than a screen. `grep -rn 'wellbeing\.condition|wellbeing\.fitness|w\.condition|w\.fitness' src/` returns only life.ts:68,71,236,290,291,292 (its own writes) — and readiness() at src/engine/systems/life.ts:85-97 reads energy, stress, sleepDebt, nourishment, morale, travelFatigue and hygiene, and does NOT read condition or fitness. The only reader outside the engine is the generic dial table at src/ui/looks/wellbeing.tsx:37-38. recoveryFactorAt is the one that reaches readiness, via applySleep's energy/morale/stress/debt writes (life.ts:211, 218-236) -> readiness() -> src/ui/screens/Home.tsx:266.


### 47 trait modifier keys across 445 traits, of which seven are consulted — followed by a list of names that appears to contradict the number seven.

**Cluster** `person-fields` · **Verdict** NEVER_TRUE


There is no contradiction in the ledger. The list is the DEAD keys, not the consulted ones, and it is fourteen names, not fifteen.

/home/user/1221/docs/UNBITTEN.md:125-131 reads: "**47 trait modifier keys** across 445 traits, of which seven are consulted: `ageCurveShift`, `audienceAppeal`, `audienceVariance`, `brandDealOdds`, `breakoutOdds`, `burnoutRisk`, `careerLongevity`, `castingPrestige`, `coStarPerformance`, `crewFriction`, `crisisRecovery`, `criticalScrutiny`, `dealTerms`, `earlyOpportunityRate` and thirty-three more. Each one is an effect a trait promises on screen and does not deliver."
Count them: fourteen names, then "thirty-three more". 14 + 33 = 47. Those fourteen are verbatim the first fourteen of wired.mjs's alphabetically sorted DEAD list — `node tools/wired.mjs` prints the identical prefix, because tools/wired.mjs:203 does `f.dead.slice(0, 14)` and :205 appends "and N more". The final sentence ("an effect a trait promises and does not deliver") confirms the list is the dead set. The defect is one colon in a sentence whose subject switches mid-clause.

THE REAL ANSWER. 54 keys declared, 7 read, 47 dead. Verified by re-running wired.mjs's own logic standalone (/tmp/.../keys.mjs):
    DECLARED total: 54
      src/engine/domain/attributes.ts            46 keys (on TraitDef.systemMods)
      src/engine/content/personality-traits.ts   11 keys (one overlap: injuryRisk, relationshipDecay, trainingGain)
    ASKED total: 7
      energyRecovery     <- src/engine/systems/life.ts:222
      recoveryRate       <- src/engine/systems/life.ts:73, :197
      sleepQuality       <- src/engine/systems/life.ts:198
      stressGain         <- src/engine/systems/life.ts:60
      stressPerShootDay  <- src/engine/systems/life.ts:60
      stressRecovery     <- src/engine/systems/life.ts:73
      travelFatigue      <- src/engine/systems/life.ts:77
    DEAD: 47
Every single read is in one file, src/engine/systems/life.ts. Nothing else in the engine asks for a modifier key by name. Five come through `personalityOf` -> `dispositionOf` -> `personalityModifier` (content/personality-traits.ts:368); two — `stressPerShootDay` and `recoveryRate` — come through `modifierFor` -> `systemModifier` (domain/attributes.ts:1353-1379) and read the ACTING trait sheet.

"445 traits" is exactly right. Probe /tmp/probe-personfields.mjs:
    TRAITS (acting traits): 296
    GENRE_MASTERIES: 149
    ALL_TRAITS: 445
    PERSONALITY_TRAITS: 35
So "445 traits" is `ALL_TRAITS` (attributes.ts:1276) and excludes the 35 personality traits, which is slightly off given 11 of the 54 keys are declared on those 35 — the honest denominator is 480, and only 73 of them carry a `systemMods` block at all (38 in attributes.ts, 35 in personality-traits.ts).

UNDERSTATED, and this is the finding worth keeping: SEVEN is the tool's number, and only THREE of those seven can change an outcome.
- `stressPerShootDay` and `recoveryRate` are dead by construction. `modifierFor` reads `person.traits`, and the player holds all 445 while nobody else holds any. Probe:
      1 person: stressPerShootDay=0.8 recoveryRate=1.62 traits=445
      2 people: stressPerShootDay=1   recoveryRate=1    traits=0
  Two constants, forever, in every save. They pass wired.mjs's test and fail the falsifiability test outright.
- `travelFatigue` multiplies the decay of a dial nothing ever raises (life.ts:42/:77/:238 are the only writers and two of them subtract). Probe: the value is 0 whatever the modifier.
- `stressGain` is gated behind `if (w.energy < 15)` at life.ts:67, which a five-year autopilot run never reaches (energy pinned at 25.23).
- That leaves `stressRecovery`, `sleepQuality`, `energyRecovery` as the only keys that move anything a player can see.

One more dead declaration found alongside: `systemCount` (attributes.ts:1382-1390), the additive reader written for `luckyBreakCharges`, has zero callers in src/ or tests/ — and `luckyBreakCharges` is itself on the dead 47.


### Two functions answer whether the player is free, and they disagree.

**Cluster** `crew-office` · **Verdict** ALREADY_FIXED


Fixed in commit edb241b, "Being cast is time you no longer have". There is now one implementation and everything delegates to it.

/home/user/1221/src/engine/world/diary.ts:46-81 is the single answer: whatHasThem walks cast seats (applying BEFORE_THE_FIRST_DAY = MS_WEEK) then auditions with why === 'cast' (applying the SAME lead-in), and theyAreFree is `whatHasThem(...) === undefined`.

/home/user/1221/src/engine/world/audition.ts:491-493 is now three lines:
    export function freeAcross(sim: Simulation, from: Instant, to: Instant): boolean {
      return theyAreFree(sim, from, to);
    }

/home/user/1221/src/engine/world/casting.ts:806 reads the same source:
    const has = whatHasThem(sim, when.from - BEFORE_THE_FIRST_DAY, when.to);

`git log -L 393,396:src/engine/world/audition.ts` shows exactly what the disagreement was. Before edb241b, audition.ts had its own copy which applied `shoot.from - MS_WEEK` to cast seats but `one.from` with NO lead-in to auditions:
    -    for (const one of Object.values(sim.universe.auditions)) {
    -      if (one.why !== 'cast') continue;
    -      if (one.from < to && from < one.to) return false;
That is the disagreement the ledger names, and diary.ts:63-72 now carries a comment saying so explicitly: "giving the lead-in to one of these two branches and not the other would be this file answering its own question twice".

I checked for a third answer. /home/user/1221/src/engine/world/casting.ts:278-288 `freeToWork` reads cast seats only and no auditions — but it is a different question (anybody's availability, not the player's) and the player never reaches it: putItOut skips `person.isPlayer` at casting.ts:528, and castSomebody guards the player through whatHasThem at :800-:810 before offerOf is ever called. No live disagreement.

Residual, worth fixing while you are here: audition.ts's freeAcross is now a pure alias that adds nothing, and there are THREE unrelated exported functions named freeAcross in the engine — crew.ts:277 (is this PERSON free, 4 args), making.ts:230 (which STAGES are free, returns SoundStage[]), audition.ts:491 (is the PLAYER free, returns boolean). /home/user/1221/src/ui/workspaces/AuditionsWorkspace.tsx:25 imports one of the three by bare name.
