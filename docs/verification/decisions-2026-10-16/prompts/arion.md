# Your Area: Arion's Debit-Card Year (Key `arion`)

Read `common.md` beside this file. Your section of the brief is 3, in full; your criteria are AR0 to AR8
(`../criteria.md`, section 3).

## Where You Work

The shared tree, `/home/user/1221`, branch `claude/peaceful-hamilton-59zdbb`: no git at all. You're the only area working
in it. You own the banking files (`systems/banking.ts`, `lending.ts`, `bankmoves.ts`, `routing.ts`, `abroad.ts`,
`homeaccount.ts`, `content/banks*.ts`) and the bank's UI; the guide's money entries where Arion's card is said.

## What's There

Brief 09's banking area (`docs/verification/remaining-09/banking-result.json`, `banking.5.arion-card`, Decision
Required): Arion's price list (07.05.2026) gives the debit card 950 kr a year from 24 and 0 kr under it; its terms
(18.7.1.15, 15 April 2026) say card fees follow the price list and come from the account; neither says whether the year
is paid ahead or behind, or what a close owes. The fee posts in krónur exactly since `ac7c7f36`. Berliner Sparkasse's card
is paid ahead with its unused days refunded on a close (`Bank.card.ahead`, `cardFeePaid`, `cardRefundDue`), under BGB §
675h(3), which carries Directive (EU) 2015/2366 Art. 55(4) into German law. althingi.is answered every request with a 403.

## The Work

1. **AR0, a focused search**, recorded with each source's address and date read: Arion's own documents (the price list,
   the debit-card terms, the account terms, any card FAQ), the law that binds it (Act 114/2021 on payment services, from
   another mirror if althingi.is still refuses; the Directive it carries into Icelandic law under the EEA Agreement, and
   the EEA Joint Committee's decision that incorporated it; the Central Bank of Iceland's or the Consumer Agency's
   guidance). Say exactly what's confirmed (the amount, the age, who pays, and what a close owes, if a rule settles that
   whatever the timing) and what isn't. Don't treat the Directive as Iceland's law without the incorporation and the
   Act's text, or the German rule as Iceland's.
2. **The rule.** If a source settles the timing, implement it. If not, the brief authorizes a configurable simulation
   assumption: choose a default and say why, label it unverified and simulated in the code, the result, the bank's screen
   and the guide, keep it apart from the confirmed terms, and make it one setting a later source can replace.
3. **AR1 to AR7, the lifecycle**, implemented and tested in `tests/decisions-arion.test.ts` through the commands and the
   clock on a Reykjavík-raised student keeping Arion: the first charge, the renewal a year on (once), a close (what's
   owed or refunded, said under Close It before the press), any refund the rule supports, an account that can't cover the
   fee, a second charge or refund attempted, a reload, 29 February and the year's turn; one jump against day by day.
   Krónur exact, balanced against Bank Fees. Figures worked by hand. Mutations in copies.
4. **AR8.** The result says the lifecycle is verified against the rule as specified, and keeps the real-world question
   open where it is.

Your result: `docs/verification/remaining-10/arion-checklist.json` and `arion-result.json`, with the research record
(confirmed, not confirmed, each source) and `rowText` for any audit row whose words change.
