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
