# Living A Day Through Text — Coverage

> The record of the immersion batch, kept as written. The current state of
> every feature area, reconciled against the code, is `docs/COVERAGE-MATRIX.md`.

What the immersion batch delivered, what it delivered in part, and what it
did not, against the specification in the kit's CLAUDE-START-HERE.md. Every
line here is one of three things: **implemented** (built, wired to the
screen, tested), **partial** (built to a stated depth, with the gap named),
or **blocked** (not built, with the dependency that blocks it). Nothing is
marked complete because its landing page works.

Numbers are the code's own, pinned by tests where they are stated in prose.

## The connected scenario the spec asks for first

> calendar plan → travel/local venue → gym pass or membership payment →
> workout with choices → wellbeing and readiness changes → saved follow-up

**Implemented, end to end, in the engine and on screen.** Walked in a
browser (tools/_tour-scene.mjs) and held in tests
(tests/plans.test.ts, tests/scene-definitions.test.ts, tests/fitness.test.ts):

1. Calendar → a day → **Plan Something** → Train At A Gym at a chosen gym,
   time, length and reminder → `plan.create`. The plan sits on the calendar
   with its own item, reminder and window.
2. When it comes due it raises a decision — Play It Out / Just Do It / Skip
   It — whose actions the engine handles. Attending early is allowed inside
   an hour of the time.
3. Play It Out opens the gym scene above whatever screen you are on: the
   walk, drive, cab or transit there with its time and cost (`go.to`).
4. The front desk: check in on a pass you hold, or buy a day pass, a monthly
   or an annual membership (`gym.buy_pass`, sold once however many times the
   button is pressed; a membership is a bill that renews it).
5. The workout: strength, cardio, mobility or a class; a trainer for the
   hour; each block an exercise at easy, steady or hard with sets, minutes,
   energy, fitness, condition, a record that moves when it earns it, and a
   seeded injury roll (`gym.train_block`, `gym.take_class`,
   `gym.hire_trainer`). The engine keeps the workout in progress itself.
6. Cool down, stretch, shower, walk out (`gym.finish_workout`). Soreness
   lowers readiness; recovery is scheduled for the next morning and clears
   it; a trainer remembers your goal and what you like.
7. The plan is marked attended by the scene finishing — not by the click
   that opened it. Left alone past its window it is missed. All of it
   survives a save and a reload mid-scene, and the ledger sums to zero.

## Feature areas

| Area | Status | What exists | What does not |
| --- | --- | --- | --- |
| **Scene runtime** | Implemented | Sessions with step revisions; per-operation idempotency keys; one foreground scene; save/reload mid-scene; leave keeps what was done; interruption on leaving the city or the place, with resume; skip = the same commands with defaults; bounded transcripts (80 lines, 40 closed sessions); a global panel above every screen. | Cross-tab concurrency is the persistence boundary's: the server refuses a save whose clock or playtime is behind the stored one (base44/shared/guard.js). An in-memory revision does not solve two live tabs and is not claimed to. |
| **Free text** | Implemented, offline | Typed text resolves to a choice on screen (exact, alias, ordinal, or word overlap), to leave/skip/help, to two or three candidates when ambiguous, or to unsupported — and says so. Never to success on its own. | No language model. No network. A sentence that is not one of the choices is refused, by design. |
| **NPC memory** | Implemented, narrow | Structured facts on a person: promise, meeting, topic, boundary, preference, goal, event; deduplicated, weighted, expiring, bounded (60). Trainers write and read them. | Only trainers use it so far. Independent NPC goals and availability beyond the existing world tiers are not built. |
| **Wellbeing** | Implemented | Every activity can be played out (prepare → review quote and clash → act → reflect) or just done, by the same rules. Cooking keeps its recipe flow. Readiness now includes soreness. | Cooking has no scene of its own. |
| **Gyms** | Implemented | 22 exercises, 6 classes on a timetable, 4 tiers with hours, facilities and prices; day pass / monthly / annual; renewal by bill, lapse after two misses, cancellation; check-in needs presence, opening hours and a pass; trainers (two per gym, made on check-in, never in a view). | Equipment choice within an exercise, guest passes, freezes, and multi-site chains as one membership are not modelled. |
| **Real gyms** | Partial, stated | **25 real gyms across 13 cities** (Los Angeles, New York, Chicago, Atlanta, Miami, San Francisco, London, Sydney, Melbourne, Toronto, Vancouver, Paris, Berlin), each stating only public-record fact about the chain or the gym, and saying that the branch, hours and prices are SLATE's calibration. Everywhere else the gyms are SLATE's own and say so. | The spec's target is "every relevant real gym worldwide". This is 13 cities and is described as 13 cities — in the help panel the number is read from the data. A verified worldwide venue catalogue needs a licensed data feed; none is wired. |
| **Calendar** | Implemented | Opening any entry shows what it is and its state, with the owning system's actions: a plan can be played, done, moved, skipped or cancelled; an appointment moved (`health.reschedule`, new — moves the appointment and its calendar item together) or cancelled; a bill paid; a flight opened where it lives; an observance only looked at. Plan Something on any day. Planned / attended / skipped / missed / cancelled are distinct. A due plan whose scene is already under way does not ask again and is not missed. | Invitations and RSVPs between people are not built (the existing `rel.ask_out` still handles dates). Travel preparation prompts are not built. |
| **Meals out** | Implemented | Choose a place near you (or arrive at one), get there, read the menu, order up to three things (`place.order`). | Reservations, company at the table inside the scene, and bar scenes are not built. |
| **Runs** | Implemented | Route (a park or beach near you, or the streets), pace, weather; a walk to the park first. | Pace changes duration only; the underlying activity's per-hour effects are unchanged. |
| **Health** | Partial | Appointments can be moved from the calendar with a conflict check. | The consultation scene (check-in, consult, tests, treatment, prescription, follow-up) is not built; attendance still resolves as before. |
| **Relationships / Raya** | Blocked | — | Not started. The spec's in-game dating app (onboarding, profiles, discovery, matches, conversations, privacy, membership) is a separate implementation. Nothing here claims parity with the real Raya. |
| **Banking** | Blocked | — | Not started. Cards, statements, premium products, international accounts and FX are not built; the existing finance system (accounts, transfers, bills, loans, credit) is what there is. |
| **Property / Vehicles / Shopping catalogues** | Blocked | — | The spec's 100 real records per market need licensed listing, dealer and product feeds with provenance and as-of dates. None is wired. The existing procedural listings are labelled as SLATE's and are not relabelled as real. |
| **Insurance** | Blocked | — | Real carriers and products are not imported. The existing simulated lines remain. |
| **Social platforms** | Partly | YouTube, Instagram, X and TikTok are each built as the app on the phone. YouTube: feed, chips, the Shorts player with its rail and Subscribe, search, watch page with comments, subscriptions, your own channel with a camera screen, uploads, thumbnails, scheduling, analytics, monetization and brand deals. Instagram: stories including close friends ones, a square feed with carousels of up to ten, reels, explore, the message inbox, Activity, going live, saved folders, your own grid, and Settings And Activity where mute, block, hidden words, private account and screen time all do what they say. X: For You and Following, reply, repost, like, views and bookmarks, threads, communities you join, lists you make, spaces you host, the drawer, notifications with All and Mentions, the Explore rail, Premium and the advertising share. TikTok: the full bleed player, Discover, the Inbox, your own grid, the create sheet, Live, and a payout on the views that stayed. The four platforms carry their real names (YouTube, TikTok, Instagram, X); their ids are unchanged, because an id is a persistence key. | Nothing here is a claim of feature parity with the real products: the shape is modelled, the numbers are SLATE's calibration, the brand marks are SLATE's own drawings rather than the real logotypes, and the channels and accounts in the apps are SLATE's own inventions rather than real creators. |
| **Making something yourself** | Yes | The kit is real, buyable and hireable, and the day is a day: thirty five real rental houses across nine cities and SLATE's own everywhere else, each keeping only the lines it keeps, with a derived shelf, a three day week, a deposit against replacement value, a damage waiver or your own equipment cover, delivery or a morning spent collecting, extensions, late fees by the day and a write-off after three weeks. A shoot day carries a location you get permission for, crew you ask as a favor, the weather on that day at that place, and setups you got rather than setups you meant to get. Then the picture: days go into it one day to one picture, the material sets a ceiling nothing beats, the bench is hours out of your life and says when it has had enough, a runtime and a quality are written once, and it goes in front of people — a room in this city priced by how good it is, or one of twenty eight real festivals that answers in six weeks to four months and usually says no. | Every rate, deposit, waiver, room and entry fee is SLATE's calibration rather than anybody's price list, and a festival's month and terms move every year. A finished picture does not reach the industry half: no distributor, no box office, no trade coverage. Film kit is not yet a thing that lives in the house. |
| **Going out** | Partly | The cinema is built: 61 real chains listed only in the countries they trade in, 40 real classification systems and 196 certificates across 45 countries deciding who is allowed in, a program derived from the city and the week on the real release rhythm, a named seat in a named room at a price that is the city's, the format's and the hour's, a matinee cheaper everywhere, sold out showings, an age bar that refuses by name, doors that open forty five minutes before and shut half an hour after, a refund that stops two hours out, and a verdict that is what the picture was against what you like. | There is no listings feed, so every title on every screen is SLATE's own and the page says so. Fashion weeks, concerts, matches, galleries and venues on the real calendar are not built. |
| **Travel** | Blocked | — | Journey stages (documents, seating, baggage, check-in, delays, connections) are not built beyond the existing plan/book/charter/hotel commands. |
| **History** | Untouched | Left as it was, per instruction. New systems write to it through `sim.remember`. | — |

## Commands added

`scene.start`, `scene.choose`, `scene.skip`, `scene.quick`, `scene.leave`,
`scene.resume` · `gym.buy_pass`, `gym.cancel_membership`, `gym.check_in`,
`gym.hire_trainer`, `gym.train_block`, `gym.take_class`,
`gym.finish_workout` · `plan.create`, `plan.reschedule`, `plan.cancel`,
`plan.skip`, `plan.attend` · `health.reschedule`.

Scheduled kinds added: `fitness.recovery`, `gym.membership_end`,
`plan.personal`, `plan.reminder`, `plan.lapse`. Every one has a handler and
is scheduled somewhere (tests/cohesion.test.ts).

## Schema

29 → 30. Adds `scenes`, `memberships`, `workouts`, `plans` to the universe
and optional `facts` and `training` to a person. Nothing already in a save
is touched. A save carrying the reference overlay's `immersion` field keeps
its sessions. The Base44 guard is at 30.

## Verification

- Typecheck, lint, cohesion: clean.
- Tests: 561 passing, 2 todo (53 new across scenes, scene definitions,
  fitness, plans, memory).
- Browser: the connected scenario walked end to end at 1280px with no page
  errors; the text caps sweep (tools/text-caps.mjs) walks into the gym
  scene from The City — arrival, the front desk, the plan, the exercise
  list, the effort, the list again after a block, and the cooldown, each
  step logged under the panel's own title — and opens both calendar
  modals, at 390px and 1280px.
- Ledger conservation asserted after every purchase, renewal, cancellation
  and refund path in the new tests.

## Not verified, and not claimed

- **Base44 cloud persistence** of a save containing scenes, memberships,
  workouts and plans: the serialisation path is covered by tests against
  the adapter's codec, but no live write to a Base44 deployment was
  exercised here. That needs deployment credentials that are not in this
  environment. Reported as unavailable, not as passing.
- **Two live tabs**: refused at the server by clock and playtime, not
  exercised in a browser here.
- **Real gym hours and prices**: SLATE's calibration, labelled as such
  everywhere they appear. Not verified against any chain.
