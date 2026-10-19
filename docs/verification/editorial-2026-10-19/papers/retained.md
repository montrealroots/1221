# Papers: A Sample Of What Was Kept, And Why

Brief 15 asks that a kept source pass the same standard as a rewritten one, with a reason specific to it. These are
taken from the statuses in `docs/text/second-pass/papers.json`, each with the words a player meets.

1. **`src/engine/systems/permission.ts#registerPermission`**, the notice on the day the status ends: "Your permission to
   work in the United States has ended, and your status ends {date}. If you're still here after that, you'll be out of
   status. In the game, that means you can't work here, your US visa is canceled, and the Visa Waiver Program is closed
   to you from then on. You can still apply for OPT before then." *Kept because* it says what happened, then the
   consequence as the game's rule (not as certain law), then the one step still open, in that order.
2. **`src/engine/systems/residence.ts#routeRefusal`**, Your Status There: "Ireland has no route for a freelance actor,
   because an employment permit needs an employer's offer." *Kept because* each country gets its own true reason in
   one sentence, with no invented route.
3. **`src/engine/systems/identity.ts#idReplaceRefusal`**: "It ran out on June 14, 2028, and a replacement keeps the
   same date, so it can't be replaced. Apply for a new card instead, if you can." *Kept because* it names the obstacle
   and the step that works, and "if you can" is honest where another refusal may follow.
4. **`src/ui/papers/Documents.tsx#STATUS_WORD`**: Being Decided, In Force, Reported Lost, Canceled. *Kept because*
   they're the glossary's four, and Being Decided keeps applying apart from holding.
5. **`src/engine/systems/taxreturn.ts#COLLECTION [CP501]`**: "It's still unpaid, and interest and the late-payment
   penalty keep adding up. Pay it on Papers, under Tax Returns, or apply for a payment plan there." *Kept because* it
   says why it matters and exactly where to act, in two sentences.
6. **`src/engine/systems/taxreturn.ts#federalLienStep`**: "Letter 3172: the IRS filed a notice of federal tax lien for
   $… on your 2026 return, with the county recorder's office where you live. The letter gives you 30 days to ask for a
   Collection Due Process hearing, which the game doesn't offer. …" *Kept because* it names the letter by its number,
   keeps the right it gives, and says plainly that the game doesn't offer it rather than hiding it.
7. **`src/engine/systems/statetax.ts#missStatePlan`**: "Your bank couldn't pay the plan's $48.78. Connecticut DRS
   doesn't publish what happens after a missed payment, so in the game the plan ends. Collection resumes on what you owe
   it." *Kept because* the consequence is never made more certain than the rule: what's unpublished is said so first.
8. **`src/ui/workspaces/PapersWorkspace.tsx#filedWords`**: "Filed. Your bank couldn't pay all of it. What you still owe
   is under Who It's Owed To." *Kept because* in each variant the toast says what filing did with the money and where
   the rest now shows.
9. **`src/engine/content/statetax.ts#STATE_TAX [Notice Of Intent To Levy]`**, Connecticut's: "Connecticut DRS Intends
   To Levy", "… In 30 days it may take what you owe from your bank accounts by warrant. You can pay it on Papers, under
   Tax Returns." *Kept because* it's the formal step after the bill, said with its days, its means and "may".
10. **`src/engine/systems/statetax.ts#lienDisputeRefusal`**, shown on a Connecticut lien in place of the error button:
    "It was filed for tax you owed, so it wasn't filed in error. It's released once that's paid, not withdrawn."
    *Kept because* it separates release from withdrawal, the distinction the glossary keeps, and gives the way out.
11. **`src/ui/papers/Documents.tsx#ResidencePanel <documents.naturalize>`**: "Applied for citizenship" opening the toast
    "… and paid $…". *Kept because* it says the press applied, so the player doesn't read it as citizenship granted.
12. **`src/engine/content/tax.ts#*`**: "California Income Tax", "Texas (No State Income Tax)". *Kept because* they're
    the tax names the place page lists (the parenthesis stripped there), and the rules' research notes reach no screen.
