# Brief 12, Health: health.enroll's Work Branch (2026-10-17)

Read `common.md` first. Your area is `health`; your clone is `…/scratchpad/health12`, branch `health12`.

## The Owner's Resolution (Brief 12, Section 3, Quoted)

> Jobs remain removed. Do not restore employment to satisfy health.enroll's work-hours branch.
>
> I authorize retaining that branch as a tested internal safeguard where it is necessary for existing data, compatibility,
> or defensible engine behavior.
>
> - Do not advertise it as an available player action.
> - Ensure notices describe the player's actual applicable route.
> - Verify the reachable student, eligibility, enrollment, renewal, and hardship paths.
> - Test the retained internal branch separately and identify its purpose.
> - Distinguish "internally tested safeguard" from "verified playable journey."
> - If the branch serves no necessary purpose, document that finding before removing only that unreachable branch.
>
> Record this as an explicit scope resolution for health.enroll. Do not apply it to decision #4 or alter that decision's
> protected rows.

## Where It Stands

- **The audit row:** `health.enroll` in `docs/verification/audit/life.json`. It is partial at brief 11's second reader's
  check, `docs/verification/pipeline/inputs/final-checks/brief11-journeys.json`, which the latest entry in
  `inputs/checks.json` also holds. Read that check: its problems, its weak tests, its stale text.
- **The branch:** `monthEngagement` in `src/engine/systems/health.ts` returns `'work'` at 80 hours (`PUBLIC_COVER.workHours`)
  before it tests income at $580 (`workEarnings`). Wages are posted only by `school.ts`: work-study and the Summer Cabaret.
  A month partly at the School counts as the School first.
- **The second reader found:** no played life reaches 80 hours in a month off the School. Where a fixture reaches it,
  only the notice's words change, since 80 paid hours always pass the income test. The only test of the branch is the
  FIXTURE in `tests/remaining-health-billing.test.ts`.
- `docs/verification/completion-2026-10-16/journeys-result.json` and `journeys-checks.json` hold brief 11's journeys'
  claims, and their tests.

## How To Work It

1. **Decide whether the branch is necessary,** by the owner's three grounds, each answered with evidence:
   - **Existing data:** can any save, from before the scope reset or since, hold a month with 80 hours' wages off the
     School? Read the migrations and what a save keeps.
   - **Compatibility:** does anything else read `'work'` (notices, the screens, the tax side, a test)?
   - **Defensible engine behavior:** is it the statute's own prong, and is its outcome ever different from the income
     test's?

   Write the finding first, in `docs/verification/resolution-2026-10-17/health-criteria.md`, committed before any code
   changes. Then either keep it as a tested internal safeguard, named as one in its code comment, or remove only that
   branch, as the owner allows, with the finding cited in the commit.
2. **Notices say the player's route.** Every notice and screen that names the work rule (the renewal, its notice of
   noncompliance, the hardship, the application, Papers' cover panel) says what applies to this player: a student is
   kept by being at the School, and somebody off it by income, SNAP or a hardship. None advertises work hours as a player
   action. Fix any that does, and hold each in a test through the drawn screen.
3. **Verify the reachable paths, played through the commands across a save and a load:**
   - the student;
   - eligibility, enrollment and renewal;
   - hardship.

   Cite each existing test by its exact title, and write only what none holds.
4. **The internal branch, tested apart.** If kept, a `GUARD:` test names its purpose and holds its outcome and words.
   Label everything you cite so the row can say which is a verified playable journey and which an internally tested
   safeguard.
5. **The audit row** needs a second reader before its status moves. Write your check in the shape of
   `inputs/final-checks/*.json`, as `docs/verification/resolution-2026-10-17/health-checks.json`. Write the row's corrected
   words as `rowText` in your result, for the coordinator to fold.
6. **Your result:** `health.enroll` with disposition `scope resolution`. Give its status on the evidence, and its
   playable journeys and internal safeguards listed apart.
