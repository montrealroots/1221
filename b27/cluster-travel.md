# Your cluster: work travel, its delays, and the money it costs and returns

The owner's brief 27 is at `docs/verification/briefs-2026-10-16/27-foundation-limits-and-connected-professional-career-universe.txt`
(Part 11 in full: "Travel time. … Production-paid versus player-paid arrangements. Accommodation. Expenses and
reimbursements. … Delays. Condition and rest. … Reshoots."; Part 10's "Expenses, travel, accommodation, and per diem";
the supplement's loop 22 "Delays or missing authorization: → affect arrival and work eligibility → notify production →
create appropriate options and consequences", loop 29 on reshoots, and loop 30's "Expenses: → incur an eligible expense →
submit or record it through the supported process → approve, question, or reject → reimburse under the applicable
arrangement → avoid counting reimbursement as earnings incorrectly."). The build's account: `docs/verification/career-universe-2026-10-24/README.md`,
section "K5: Production, Travel And Pay", whose "Not built, said so" paragraph is what you replace for delays, fares and
claims (a fitting belongs to the production-day cluster). The code: `src/engine/systems/worktrip.ts` (the trip, its legs,
`extendTrip`, `priorOfWay`, a missed flight), `src/engine/systems/propay.ts` (pay, the per diem paid once home as an
allowance and never as wages), `src/engine/systems/workflow.ts` (`afterWrap`, the reshoot and pickup; "a feature shot away
from home has none"), `src/engine/systems/projobs.ts` (the work day, a missed day's rules: shot around, replaced),
`src/engine/content/slate.ts` (who books and pays for work away), the money systems the game already has
(`systems/spending.ts`, `systems/payments.ts`, statements), `src/ui/career/WorkPane.tsx`.

**The facts you build from**, read on 2026-10-25, every quote checked:
`/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/research-g1/README.md` sections 5
(SAG-AFTRA: studio zones, mileage, travel time as work time, a travel day without work paid a day, the overnight per diem
$60 → $70 → $75 → +$5) and 6 (LORT: the $50 per diem and when it's owed, housing for an out-of-town actor), with
`facts.json` beside it. Cite the source id and section in comments. The per diem the game pays today: check its figure
against these (the 2023 agreement's $70, then $75 from the first Sunday two years after ratification; b25-N17 item 21) and
correct it if it's stale, saying what it was in the past tense. The game has no vehicle ownership and mustn't get one (the
owner's constraint): mileage for a performer's own car doesn't arise; say so rather than build a car.

Build:

1. **A delayed or canceled flight** (loop 22; Part 11 "Delays"). Each leg the production books can be delayed or canceled
   by a labeled draw (the rates the game's, ASSUMPTION, with the reasoning; key it by the leg). A delay shortens the rest
   before the first call (the trip lands at least 36 hours ahead today): the first day's condition reads the rest actually
   had. A cancellation rebooks the next way (the existing rebooking), and if it lands after the call the production is told
   (a notice the player sends, or that the game sends for them, said), and the day is handled by the existing missed-day
   rules (shot around where the part's size allows, replaced otherwise), with the difference that a delay the airline
   caused is not the actor's default: it mustn't count as a no-show anywhere a no-show is remembered (the offers cluster
   built that memory; read what landed). Falsifiability twin: the same trip delayed and on time.
2. **Expenses and claims** (loop 30). An expense the actor incurs that the arrangement makes the production's: a night or
   meals while stranded by a delay or cancellation on a trip the production booked, a fare to a location the production
   moved, and whatever else the facts support. The claim is submitted (a command), approved, questioned (asked for what's
   missing, answered by the player) or rejected with the reason (outside what the arrangement covers), and the
   reimbursement paid as a reimbursement, never as wages: not in gross earnings, not withheld on, not commissioned, shown
   as its own line on the statements (read how the per diem is kept apart and follow it). Falsifiability twin: an eligible
   and an ineligible expense.
3. **Getting to local work** (Part 11 "Travel time"). Today getting to a job near home costs nothing and takes no time
   anyone reads. Make it cost the fare or the ride the game prices for that city (a real published fare only if the
   register has one; otherwise the game's figure, ASSUMPTION, labeled), paid from the player's account, and take the travel
   time the game's routing gives (read `systems/routing.ts`); travel at the producer's request between a reporting place
   and a location is work time (b25-N13 §32), and a location outside the studio zone is the production's to get the actor
   to. What the actor pays within the zone is the actor's (no claim), and the words say so.
4. **A reshoot away** (loop 29). A feature shot away from home calls the actor back too, with the trip booked as the
   shoot's was (legs, the hotel, the per diem, the rest before the call), held against other bookings; missed, the
   existing consequences. Remove the sentence that says it has none, in the past tense where it was.
5. **Equity's per diem and housing for stage work** (README §6, b27-G1-20): find the stage engagements the career has
   (the regional theaters' towns in `MARKETS`, the stage play's terms) and apply Rule 30's housing for an actor from out of
   town (production accommodation, a work logistic the owner allows), the $50 per diem only where 55(L) owes it (tours
   returning after 6 PM, rehearsals away from the theatre's city), and nothing for a transfer of 16 weeks or more. If the
   game's stage work is under another agreement than LORT, say which and apply only what fits.

Every new command needs refusal words, a gated control (the Work tab, or Money for a claim) and a guide chapter that opens
it. No lifestyle travel: every trip here is work's.
