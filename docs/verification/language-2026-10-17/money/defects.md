# Brief 14, The Money Area: Defects Found Apart From The Writing

Each: what, where, how it was found, and what was done. A wrong number or condition in a sentence counts.

## d1. A returned payment's fee said the wrong condition (fixed, text)

`src/ui/workspaces/BankWorkspace.tsx`, Other Charges: "A payment the bank returns unpaid costs C$10.00, none on a
payment under C$10.00". The engine waives the fee when the account is short by less than the figure
(`systems/lending.ts`, `if (rule.ifShortAtLeast !== undefined && short < …) return;`), not when the payment is under
it. Found reading the code behind the sentence. Now: "or nothing when the account is less than C$10.00 short".
`tests/language-money.test.ts` (RBC).

## d2. The "… Closed" notice said "on its way" of money moved at once, and of an empty account (fixed, assembly)

`src/engine/systems/bankmoves.ts`, the closing of a current account held open while card payments post (Citi): the
body was "What it held is on its way to …" whenever an account was named to take it, though `closeNow` moves money at
the same bank at once and moves nothing from an empty account, and "It held nothing." only when no account was named.
Found reading the code behind the sentence. Now it reads `closeNow`'s arrival and the balance: "on its way to … and
arrives …", "now in …", or "It held nothing.". `tests/language-money.test.ts` (the on-its-way variant).

## d3. Closing an overdrawn savings account said a negative sum moves (fixed, text; found by the before-walk)

`src/ui/workspaces/BankWorkspace.tsx`, `closingWords`, on the missed-plan save: "Its -$3, moves to Chase Total
Checking." The account held -$3.30 after its $5.00 monthly fee; the screen's whole-dollar formatter dropped the cents,
and closing takes the $3.30 from the current account (`closeSavings`). Now "It’s overdrawn by $3.30. Closing it takes
$3.30 from Chase Total Checking to clear it.", to the cent. `tests/language-money.test.ts` presses Close It and finds
checking $3.30 lower.

## d4. A control named "Balance-$3" (fixed, markup)

`src/ui/workspaces/BankWorkspace.tsx`, the balance tile, found by the before-walk: its button's text ran its label and
figure together ("Balance$3,025", "Balance-$3"). A space now sits between the spans; the tile's layout is a flex
column, so nothing on screen moves. `tests/language-money.test.ts` asserts the markup.

## Noted, not fixed

- **A German account's closing fees aren't in "Closing it moves its …".** `closingWords` (Accounts) says the balance
  with the month's interest; `closeSavings` also settles `closingFeesDue`, which is non-zero only for an account that
  closes quarterly with a monthly fee. No German savings account in the game has a monthly fee today, so no figure is
  wrong now; a savings product given one would make it so. For the coordinator: the line could read `closingFeesDue`.
