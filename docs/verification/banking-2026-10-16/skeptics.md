# A Bank Account Kept At Home: The Skeptics' Review

On 2026-10-16, in the work plan's dating, an independent read-only reviewer tried to refute modules 1 to 7 and the
open-defect fixes (`open-defects.md`), and to find what they missed. It played lives at banks the tests don't use, in
probes kept outside the repository. It refuted nine claims and failed to refute two. Each finding was reproduced here
before anything changed. This record gives each finding's disposition.

## The Findings, And What Was Done

**B1, high: most offered banks closed the account on their own.** The current account at home opened at nothing, and the
bank's own fees went on it whatever it held: a monthly fee, Germany's quarterly fees, Santander México's fee for a quiet
month, and a fee for a customer abroad at any bank but the two Japanese ones. In an idle life it went below zero from
its first month's end. Sixty days later the set-off closed it, though creation had said the bank keeps it. That happened
at 21 of the 54 banks offered (TD Canada Trust's C$17.95 a month, reproduced here). `d1f8e23` had made it worse: until
then the set-off left the current account open.

Decided: the current account opens holding what its fees come to until the class graduates in May three years on
(`feesToGraduation`, `systems/homeaccount.ts`). That's its monthly fee and a quiet month's fee each month, its fee for a
customer abroad on its schedule, and its card's yearly fee, each as charged with no waiver, in whole units. It comes from
the savings kept there, or from the American checking where they were moved, and the four parts still add to the family's
money to the cent (`splitOf`). Creation shows it as its own line and says it in What Follows. A real student keeping an
account at home keeps its costs in it. With this, a life that never touches the account keeps it through graduation, and
the player who moves its money out meets its fees as anyone would.

Three more things the census found, fixed the same way:

- A dormant account's fee at a Japanese bank takes no more than the account holds. A Japanese ordinary deposit has no
  overdraft, the same fact SMBC's rule rests on. Resona's ¥1,320 had taken an empty account to ‑¥1,320, and the
  set-off closed it.
- The quiet month's fee and the dormant account's fee are posted in the bank's own figure. Worked back from the dollars,
  thirty-four of Santander México's fees drifted 68 centavos.
- The ledger keeps an account's two figures in agreement in sign (`Ledger.nativesOf`). See B3.

The census, run twice, plays every offered bank idle to 1 June 2029, with the savings kept at home and with them moved.
Before: 21 banks below zero and closed. After: none below zero, none closed, none with its two figures disagreeing.
`tests/home-account-idle.test.ts` plays three of them, one for each kind of fee: TD Canada Trust (C$611, 70 cents left),
Santander México (MXN 391, 68 centavos left) and Resona.

**B2, high: a French bank abroad offered and lent a loan for the overrun.** It was granted in dollars, with no `held`, and a
short payment went on the American credit record. Every other credit at a bank abroad is refused. So the offer isn't made
by a bank abroad (`frenchOverrun`), and `bank.take_overrun_loan` refuses one in the bank's words, for an offer kept in an
older save.

**B3, medium: the two figures disagreed.** A fee given its own figure that took the last pence left the dollars at 2¢, and
the next day bought 2¢ of food from an account at £0.00. Fixed in the ledger, where every posting passes: after a posting,
an account kept in another currency must agree in sign between its two figures. Where it wouldn't, the save's figure
becomes what its own is worth, a cent at least either way. The difference goes between that posting and the
transaction's nominal side (the fee's expense, the purchase's), so the transaction still balances. A transfer between two
of the holder's own accounts has no nominal side, and is left as it is. The other half of B3, a card's fee taking an
account below zero after a purchase emptied it, is a fee into an unarranged overdraft, as a British bank charges one. It
was left as it was.

**B4, medium: Barclays never tried its closing again.** Overdrawn on its closing day, it said it didn't close, and never
tried again. Paid off, the account stayed open for good, and once the done closing was pruned, a reload announced its
passed date. Now it tries again each day until it's paid, and says so once, even after the first notice is read. Left
unpaid, the overdraft is charged off as before, but no longer marked on the American credit record. A bank abroad
doesn't report to those bureaus, as `chex` already assumed for a bank outside America. The notice no longer says
"onto your record" for it.

**B5, medium: half-yen.** Every conversion from cents into yen, won or króna landed on ¥1.50-sized steps, so the accounts
held fractions no such bank has, and their lines on screen didn't add up. A figure worked from dollars into a currency
with no minor unit is now whole units (`exchangeHeld`, used by the ledger and for a payment arriving from abroad). As a
result, August's interest on the wealthy citizen's SMBC savings is ¥4,025, not ¥4,024.50.

**B6, low: ¥2 lost closing savings.** Closing a home savings account into the current account at the same bank now
carries the bank's own figure on both sides (`closeSavings`).

**B7, low: savings named that weren't there.** The SMBC and MUFG panel said the fee comes "from your savings" where none
were kept. It names them only where there are some.

**B8, low: two identical names, and dollars at the cash machine.** (a) A Japanese bank's two accounts are both
普通預金 (Ordinary Deposit), so a notice naming both reads oddly. Left as it was: it's the product's real name at
the bank, a set-off no longer reaches a Japanese home account in an idle life, and renaming the Japanese products would
change every Japanese life. Recorded here. (b) A home card's refusal at a cash machine said "holds $X". It now gives the
account's own money with the dollars beside.

**B9, low: the module 6–7 record's figures.** Its tax figures were from before the SMBC fix. It now says which of its
figures rested on defects and what the tests assert instead, with its history kept.

**B10 and B11: not refuted.** The tax and its legal claims (the 1040-NR's exclusion, Form 1116's limit, Connecticut, the
FBAR and Form 8938) were checked against the code across all 54 banks and held. The two readings that are SLATE's own say
so. A straight run and one reloaded midway matched at six banks to February 2027.

## The Tests It Called Weak

- Deutsche Bank's test asserted the ‑€13.80 overdraft as right. It now asserts €221.20, the €235 it opens with less
  the quarter's fees.
- "Audit and breaches empty" couldn't see the two figures disagreeing. The ledger now keeps them in sign, and the census
  checks each account directly.
- The set-off test asserted the French loan offer. It now asserts no offer, and the command's refusal.
- The creation and card-fee tests' figures restate the engine's own sums. The new tests' figures are worked by hand in
  their headers: the floats, the quiet months, the yen, the 8938 lines.

## How It Was Proved

`tests/home-account-idle.test.ts` (new, 4 tests), and changes to `home-account-abroad`, `-setoff`, `-creation`, `-tax` and
`-transfers`. Every test file named `home-account-*` passes, 66 tests. The figures are worked by hand in each header. TD's
C$17.95 × 34 = C$610.30 is C$611, with 70 cents left on 1 June 2029. Deutsche Bank's €6.90 × 34 = €234.60 is €235, which
is 25,543¢. MUFG's ¥10,200, SMBC's ¥7,480, and SMBC's savings of ¥1,052,270 earning 53¢ in August. The wealthy citizen's
Form 8938 figures are each account converted to the cent and added: 41,301,997 + 4,987 = 41,306,984¢, which is $413,070,
and 41,301,997 + 4,253 = 41,306,250¢, which is $413,063.

Mutations, each applied and restored from its own copy, compared with `cmp`:

| Mutation | Result |
|---|---|
| No float from the savings | Killed: 10 tests |
| No float from the checking where the savings moved | Killed: 2 |
| The quiet month's fee left out of the float | Killed: Santander México |
| No cap on a Japanese dormant fee | Killed: Resona |
| No agreement in sign | Killed: the ledger's test and Santander México |
| The quiet month's fee worked from the dollars | Killed: Santander México |
| The overrun loan offered abroad | Killed: BNP Paribas |
| The overrun loan taken abroad | Killed: the older save's offer (the first attempt didn't apply: its line wasn't unique) |
| No daily retry | Killed: Barclays paid off |
| The retry saying so each day | Survived at first, since an unread notice is folded into an identical one. Killed once the test reads the first. |
| The charge-off on the American record | Killed: Barclays unpaid |
| "Onto your record" for a bank abroad | Killed: Barclays unpaid |
| Half-yen | Killed: SMBC's postings |
| Closing savings worked from the dollars | Killed: SMBC |
| Savings named where there are none | Killed: SMBC with none kept |
| The cash machine in dollars | Killed: HSBC UK |
