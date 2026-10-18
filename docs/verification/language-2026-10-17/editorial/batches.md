# The Editorial Review: Batches

Brief 14, section 9's editorial review, 2026-10-17 into 2026-10-18. The eight areas read their own words and the
integration's passes what crosses them; this read the finished game as a player meets it, screen after screen, and the
notices a played life is given, against `docs/STYLE.md` ("Talking to the player") and `docs/GLOSSARY.md`, and fixed
what fell short. Worked in the clone `scratchpad/l14-editorial`, on `l14-editorial`, from `c74a02e1`. What was read, and
how, is in `README.md`; each batch below is a part of the game, as the areas' records are. Its before-and-after pairs
are in `examples.json`, in this file's batch order.

## Batch 1: A Refusal For Money That Isn't There, In One Shape (Money, Papers, Health, School)

The item the coordinator's list left open (`../coordinator.md`, Open): a refusal for money that isn't there had three
shapes, four with the school's. Papers said “Your bank can’t cover $…, so nothing was charged.” (or paid, or changed).
Health said “It costs …, more than your bank can cover.”, “The year costs …, more than your bank can cover.” and, for
Fill A Longer Supply, “It costs more than your bank can cover.” with no amount at all. Money said “… only has $… in
it.”, with the cents dropped, of the account the player chose. The school's protective equipment said “It costs $150.00,
and your bank can’t cover it. You haven’t been charged.”, and a medical bill “… holds … of the …: move money into it
first, on your bank’s Move Money.”

**The decision.** One shape: what can't pay, the amount, and, once the player has pressed something, what didn't
happen; then the next step where there's one. Papers' was already it, so its fifteen refusals were kept as they were.
Two variants, each because its context needs it, and said in `docs/STYLE.md` (Errors and unavailable actions) and the
glossary's row:
- **The player chose the account and the amount** (Move Money, an opening deposit, a term deposit, a medical debt
  paid from an account, cash out of a machine): the figure that helps is what the account has, not the amount they
  typed back at them. “Chase Total Checking has only $40.50, so nothing was moved.” With nothing in it, “… has nothing
  in it, so nothing was moved.”, never “has only $0.00”.
- **A reason shown before anything is pressed** (a state plan's down payment, cash out of a machine, the Yale
  account): it names the amount and not what didn't happen, since nothing was tried. “Your bank can’t cover the $500.00
  down payment.” These are the same functions the commands throw, so the words are the same pressed or not, and they
  never claim a charge was stopped.
- **“You can’t afford it.”** (`spendRefusal`, a meal or the day's groceries) was kept: it's shown beside an item whose
  price is in the same line, before it's pressed; adding the price repeats it, and “so nothing was bought” would say
  something was tried. Its constant is compared by identity in the groceries notice, which is unaffected.

**The sources (24, in 11 files):**
- `systems/health.ts`: `health.extra_supply` (now names the whole order's price, “Your bank can’t cover $125.37 for
  every condition’s fill, so nothing was filled or charged.”, from an `asked` total `fillMedicine` keeps as it prices
  each fill, which changes no fill and no charge), `health.prepay`, `health.dental` (the year, and the first month),
  `health.pay_bill` (“… has only $50.00 of the $100.00, so nothing was paid. Move money into it first, on your bank’s
  Move Money.”).
- `systems/school.ts` `school.buy_ppe`; `systems/leave.ts` `bankShortWords` (the Yale account and Affiliate cover:
  “… can cover only $45,217.00 of it now. Pay that or less, or move money into your current account first.”, and “…
  can’t cover any of it.”).
- `systems/banking.ts` `bank.transfer`, `systems/bankmoves.ts` `bank.open_current`, `systems/lending.ts`
  `bank.open_term` and `bank.repay_loan` (which now names the repayment account and the payoff to the cent, “Citi Access
  Checking can’t cover the $3,016.83 it takes to pay it off, so nothing was paid.”, where it said “$3,017” and “the
  repayment account”), `systems/cash.ts` `withdrawalQuote`, the new `shortWords`, and `cash.deposit`.
- `systems/statetax.ts`: “$… down” became “the $… down payment”, in the reason and the command.
- The guide's quotes of them: `guide/money.ts` (four entries), `guide/papers.ts` (two), `guide/school.ts` (three).

**Meaning-sensitive changes, and how each was checked:**
- **The cents.** Money's refusals dropped them (`{ cents: false }`), so an account holding $40.75 refused a $40.80 move
  saying it “only has $41”. Each now shows the ledger's figure to the cent, as `docs/STYLE.md` asks where cents matter.
- **A withdrawal refused for its fees** said only “… only has $101.00 in it.” of $100.00 asked. It now says what the
  cash and its fees come to: “… has only $20.01, and $20.00 in cash with its fees comes to $26.22.” The fees are the
  quote's own (`fee` and the machine owner's charge); the test reads them from the quote that went through.
- **Fill A Longer Supply's figure** is the sum of what each condition's fill was priced at as the loop met it, paid or
  not. The command still throws, and the rollback leaves nothing filled or charged (tests below). A test holds the
  figure to the fill's own price, `medicineShareOf × fillsCharged`, and a mutation that stops the sum fails it.
- **Paying in cash**: “You have $60.00 in cash.” answered both a typed nothing and more than the wallet holds. Split:
  “Enter how much cash to pay in.” and “You have only $60.00 in cash, so nothing was paid in.” The same requests are
  refused as before.

**Tests updated to the new words, as exactly as before:** `tests/evidence-g12-money.test.ts`,
`evidence-g14-money.test.ts`, `language-money.test.ts`, `home-account-abroad.test.ts`, `home-account-transfers.test.ts`,
`remaining-banking.test.ts`, `evidence-g10-money.test.ts`, `evidence-g11-money.test.ts`, `defects-r3b-1.test.ts`,
`bank-moves.test.ts`, `school-everyday.test.ts`, `evidence-g03-life.test.ts`, `evidence-g25-school.test.ts`,
`evidence-g26-school.test.ts`, `commands-kept.test.ts`, `defects-g8-5.test.ts` (with a new assertion that its $125.37 is
the fill's price). **New:** `tests/editorial-money-refusals.test.ts`, the variants no test reached: England's
prescription prepayment, a monthly dental plan's first month, a medical debt part covered, a withdrawal pushed over by
its fees and with nothing in the account, and the District's down payment from the reason and from the command.
Mutations: dropping the fees clause fails it; stopping the fill's sum fails `defects-g8-5`.

**Tool matchers:** `tools/acceptance-ui.mjs` (the transfer refusal: `has only|has nothing|holds|can’t|more than`);
`tools/playthroughs-ui.mjs` (the banking journey's refusal now names the account's figure to the cent, and the From
list gives whole dollars, so the two are compared within a dollar). The latter's lint errors (a wall-clock read, two
unused names) were there before and are outside the gate's `.ts,.tsx` lint.

**Checks** (`b1` below; each exit read from its file): `npx tsc -b --noEmit` 0; `npx eslint` on the 28 changed files 0;
`title-case` 0, `label-sweep` 0, `plural-check` 0, `voice-check --check` 0, `tics --check` 0, `spelling` 0, `typos` 0,
`text-inventory --check` 0, `doc-refs --check` 0, `deciders --check` 0, `guide-quotes --check` 0 (581 of 581). The
16 test files above and `editorial-money-refusals`: 261 of 261 and 4 of 4; the guide's and the neighbouring files
(`cash`, `guide-examples-money`, `-papers`, `-school`, `guide`, `help-mechanics`, `integration-home-lending`,
`language-crossarea`, `language-dynamic`, `leave`, `lending`, `liens-and-arrangements`, `tutorial`,
`coverage-gaps-life`, `whynot-papers`, `commands-kept`): 205 of 205 once `commands-kept`'s pattern was brought to the new
words.

**Statuses:** the 24 sources Rewritten And Verified, each `--by` its owning area (money 11, health 4, papers 4, school
5), with the test and title that holds its words.
