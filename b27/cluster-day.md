# Your cluster: the production day before and around the work

The owner's brief 27 is at `docs/verification/briefs-2026-10-16/27-foundation-limits-and-connected-professional-career-universe.txt`
(Part 10's "Rehearsals, fittings, recordings, pickups, ADR, and reshoots"; Part 11's "Fittings. … Call sheets. …
Waiting and revised calls."; the supplement's loop 21 "Include applicable … fittings, and rehearsal", and loop 23 "Call
sheet arrives or updates → player reviews scenes, location, time, preparation, and relevant requirements → … → handles
justified delays or changes → wraps"; "Do not equate more takes with bad acting automatically."). The build's account:
`docs/verification/career-universe-2026-10-24/README.md`, section "K5: Production, Travel And Pay". Its "Not built, said
so" paragraph said a fitting "pays nothing (Schedule A §16.A(2): none over $1,200 a day)" at the $1,283 day rate. That was
the 2014 agreement's threshold: the 2026 agreement raised it to $1,700 a day for contracts from July 1, 2026 (b25-N12 item
16.a, confirmed on its page image), so a scale day performer IS paid for a fitting on a day before work. Build it. The code:
`src/engine/systems/projobs.ts` (the booked part, its days, the work day, overtime, a missed day), `src/engine/systems/workflow.ts`
(each format's day, the takes, revised pages the night before), `src/engine/systems/propay.ts` (pay by the agreement),
`src/engine/content/careerwork.ts` (the agreements' terms), the calendar, `src/ui/career/WorkPane.tsx` (Next Call, the day).

**The facts you build from**, read on 2026-10-25, every quote checked:
`/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/research-g1/README.md` section 5
(fittings: same-day fitting is work time; a prior-day fitting one hour minimum per call then 15-minute units, none at
$1,700 a day or more for contracts from July 1, 2026; fitted and not used, a day's pay; weekly performers four free hours
on two days a week worked, then the contract rate with a one-hour minimum; a fitting before the start date doesn't start
consecutive employment), with `facts.json` beside it. The hourly rate behind "one hour minimum pay" isn't defined in
§16.A(2): the game's reading (for example an eighth of the day rate) is an ASSUMPTION, said where it's defined and in the
words the player reads. Cite source ids and sections in comments.

Build:

1. **Fittings** (Part 11, loop 21). A booked live-action part (film, television, a stage play's costume where it applies)
   gets a fitting call before its first day: scheduled by the production (when, and how often, the game's, ASSUMPTION),
   on the calendar, at the production's place in town, held against other bookings and classes, its travel time read.
   Paid by the agreement's rule for the part's terms (SAG-AFTRA day performer under the threshold: an hour's minimum then
   15-minute units; at or over it, unpaid; a weekly performer's free hours then the contract rate; other agreements as
   the game has read them, or unpaid and said so), the pay through the same path as the part's (withholding, dues,
   commission as they apply). A fitting on a work day is that day's work time (it lengthens the day, read by overtime).
   Missed: the wardrobe isn't ready and the first day pays for it in a way the game reads (the day's first hours fitted on
   set, its scenes' preparation or its overtime), and a fitting called and the part then called off pays what §16.A(3)
   says. Falsifiability twins: a part at scale paid for its fitting and one over $1,700 a day not; a fitting kept and one
   missed, the first day different.
2. **Waiting and revised calls** (Part 11; loop 23). The day's call can be revised the evening before (a later or earlier
   call, the scenes' order changed; the revised pages that exist are the model), said by a notice and on Next Call, read
   by the day itself (which scene comes first, so which preparation counts first; the call's hour, so the rest had). On
   the day the actor can be held waiting before their scene (time on the clock that is work time, read by overtime), and
   chooses how to spend it (run the lines, which the scene's judgment reads; rest, which condition reads), each with its
   effect. Extra takes for a technical reason (a camera or sound fault, labeled) don't read as the actor's fault anywhere
   (loop 23's "Do not equate more takes with bad acting"). Falsifiability twins: a revised call that moves the scene the
   actor prepared most to first or last; the wait spent on lines or rest.
3. **The call sheet** (Part 11 "Call sheets"; loop 23 "Call sheet arrives or updates"): the next day's call as one
   document the player reads, arriving the evening before and updated when revised: the call time, the place, the scenes
   in their order with what each asks, the fitting or wait where there is one, what changed since the last version. It
   reads the state the items above keep; it isn't a second copy of it.

Every new command needs refusal words, a gated control on the Work tab and a guide chapter that opens it (How Each Kind Of
Work Is Done, or a chapter of your own). Rewrite every comment and every player-facing sentence your change falsifies
(the guide's, the README's not-built words are the primary agent's) in the past tense where it's history.
