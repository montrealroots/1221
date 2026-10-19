# Brief 15, The Money Area: Defects Found Apart From The Writing

Each: what, where, how it was found, and what was done. A wrong number or condition in a sentence counts.

## m1. Two Move Money refusals named a limit rounded to whole units (fixed)

`src/engine/systems/banking.ts`, `bank.transfer`: "You can take €2,000 more out of Flexgeld this month without notice."
and "With the C$2.00 withdrawal fee, you can move at most C$99 out of RBC High Interest eSavings." Both wrote the limit
with `formatMoney(…, { cents: false })`, which rounds to the nearest whole unit. Germany's €2,000 allowance is converted
into the save's money and reduced by what's gone out, and the room is the balance less the fee, so neither is a whole
figure: with €1,999.50 left the refusal said €2,000, and with C$98.50 of room it said C$99, more than the same command
would let out. Found reading the refusals' figures while rewriting them. Now the figure is written to the cent, as the
house writes a refusal's figure. `tests/editorial-money.test.ts`, "m1", fails without the fix (it reads "€2,000" and
"C$99").

## m2. A charge-off is said to stay on the record "until it’s paid" (the panel: batch 3; the glossary: the coordinator)

`src/ui/bank/BankLending.tsx`, the In Collections panel: "It’s on your record until it’s paid." And `docs/GLOSSARY.md`,
Money, **charged off**, **collections**: "on your record until paid". The record keeps a charge-off's mark for its
country's years (`MARK_YEARS`, seven in the US; Mexico's by the debt's size), and `marksFallOff` alone removes it;
`bank.pay_collections` pays the debt down and doesn't touch the marks. What an unpaid collections debt does is block a
card application at any bank (`card.apply`) and an account at the bank owed (`openRefusal`). Found reading the
charge-off notice's "It’s on your record." against `markRecord`. The notice now says "for seven years, paid or not, and
no bank approves a card while the debt is unpaid" (`tests/editorial-money.test.ts`). The panel is fixed in batch 3. The
glossary row is for the coordinator: "on your record for its country's years, paid or not; while unpaid, no bank
approves a card".
