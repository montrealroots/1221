# Your cluster: offers and auditions

The owner's brief 27 is at `docs/verification/briefs-2026-10-16/27-foundation-limits-and-connected-professional-career-universe.txt`
(read Part 9, Part 10's negotiation lines, and the supplement's loops 10, 13, 14 and 18). The build's own account of what
exists is `docs/verification/career-universe-2026-10-24/README.md`, section "K4: Auditions, Offers And Agreements". The
code is mostly `src/engine/systems/projobs.ts` (offers, rounds, `auditionContext`, `pro.tape_audition`, `NEGOTIATE`,
`missRound`, `directOfferFor`), `src/engine/systems/briefs.ts` (the School's self-tapes, which keep takes and approaches),
`src/engine/content/approaches.ts`, `src/ui/career/OpportunitiesPane.tsx`.

Build these five, each connected to what reads it:

1. **Negotiation of an offer's terms through representation** (loop 18: "player and representative identify negotiable
   items → propose changes → other party responds → terms may improve, remain unchanged, trade off, expire, or be
   withdrawn"; Part 10: "Allow appropriate review, negotiation through representation…"). Today the agent asks once for
   +20% pay and the answer is raised or kept. Let the player choose the item the agent asks about: the pay; the
   guaranteed episodes on a series part; the promotional-film pay the contract now leaves unpaid on work over $25,000
   ("bargained"); and allow the answers the loop names: raised, kept, a trade-off (for example more pay for fewer
   guaranteed episodes), or the offer withdrawn (a small, labeled ASSUMPTION chance, higher for a bigger ask). Each
   answer must change what `contractFor`, `promisedPay`/`schedulePay` and the promo pay read. Without an agent nobody
   negotiates (Part 10 says "through representation"); keep that, and say it. Do NOT touch per diem (another cluster
   owns per diem).
2. **A professional self-tape keeps takes** (loop 13: "→ records a take → reviews or retries within available time and
   rules → selects and submits the take"; Part 9: "Alternate takes"). Today `pro.tape_audition` judges and submits in one
   step. Make it record a take (its own draw, its time and energy), allow more takes within the due date and a per-day
   limit (ASSUMPTION), show each, and let the player select the take that is submitted. Casting reads the selected
   take's figure. Reuse the School's take-keeping in `briefs.ts` where it fits rather than duplicating it.
3. **Approach and direction in a professional audition** (Part 9: "Selecting an approach. … Reader or partner work.
   Responding to direction."; loop 14: "→ response to direction where applicable"). Today `auditionContext` reads only
   preparation and genre. Let the player choose an approach for a round (as the School's briefs do, `content/approaches.ts`),
   and at an in-person audition or callback let casting give a direction (from what the part asks, deterministic) that
   the player follows or holds to; the second read is judged with it, and casting's cut reads that read. The choice must
   be able to win or lose a part (falsifiability twin).
4. **Conditional offers, changed requirements, recasting** (loop 10: "- Conditional offers. … - Changed role
   requirements."; the brief's Area B: "Recasting where justified."). A conditional offer, firm only once its condition
   is met (for example work authorization confirmed, or a later round passed), falling away with a notice if it isn't;
   a part whose requirement changes during casting (an age range or a skill), re-checking whoever is still in the
   running; and a production recasting a part it had cast to another actor, which posts it again where the player can
   go for it. Each must change who can be booked.
5. **Withdrawal and rescheduling** (loop 14: "Support justified rescheduling and withdrawal."). A player command to
   withdraw from a part in progress with notice, and to ask to reschedule an in-person round (granted or not, labeled
   chance). A withdrawal with notice must differ from a no-show: casting offices remember a no-show without notice (it
   should weigh on that office's later callbacks or direct offers, `directOfferFor` and the cut), and a withdrawal with
   notice doesn't. Otherwise the command would be a choice nothing reads.

Every new command needs its refusal words before it's pressed, a control on the Opportunities tab, and a guide chapter
that opens it (`tests/tutorial.test.ts` checks every command is opened by a chapter).
