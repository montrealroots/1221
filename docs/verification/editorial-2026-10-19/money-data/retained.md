# What Was Kept, And Why

A sample of the text this area read and kept, across its files, each with its words and the reason it stays. A source
holds many fields; where a source was rewritten in part, the fields kept inside it are here too.

## `content/security.ts`

- **Bank of America, `suspectWords`:** "The bank watches account activity and sends automatic fraud alerts through the
  mobile app, text, email or phone. It says it will never ask for personal or financial information by text." Two
  plain sentences in the player's order: what the bank does, then the one warning that protects them. Nothing to add.
- **Citi, `suspectWords`:** "If Citi notices suspicious activity it contacts you by text, email, phone or mail to
  confirm the activity. Its fraud texts come from short code 95686." It already speaks to the player, and the short
  code is the one fact they'd look for when a text arrives.
- **Bank of Ireland, `suspectWords`:** "If the bank suspects fraud on a debit or credit card, it may text asking you to
  confirm the transaction by replying YES or NO. Its pages don't say whether the payment is held until you reply." It
  says what the bank does, the reply it wants in the bank's own capitals, and what the bank doesn't say.
- **CommBank, `lostCardWords`:** "Reporting a card lost or stolen in the app or NetBank cancels it and orders a
  replacement with a new card number. You can lock a misplaced card temporarily instead, and digital wallet payments
  keep working while it's locked." It gives the two choices a player has, lost or misplaced, and what each does.
- **Lloyds, `replaceWords`:** "The Lloyds service-charges page lists no card replacement fee, and the credit card fees
  page lists none among its common fees. Neither page says outright that replacement is free." Exact about what was
  read and what wasn't said, beside the game's "The game charges nothing for it.", which it explains.
- **Japan, `refundWords`:** "The Depositor Protection Act sets no refund deadline." After "The law on a payment you
  report as not yours:" it's the whole answer, said once.
- **The source lines** (72 of 73): each is a citation, the documents and pages read with their dates and the day they
  were read, at the foot of Your Cards behind Sources And Estimates. A player checks a figure against them, so their
  titles, numbers and addresses stay as the bank publishes them.

## `content/accountlife.ts`

- **ASB, `dormancyWords`:** "Under the Unclaimed Money Act, if 5 or more years pass since you last transacted and ASB
  has had no other contact with you, ASB tries to reach you. Without new activity by the deadline the accounts are
  closed and the money transferred to Inland Revenue." Already second person, in the order things happen, naming the
  law and where the money goes.
- **The US's `to`, `claimBack` and `source`:** never shown, because `unclaimedLaw` puts words about any state in
  their place (`systems/accountlife.ts`); the research is where the three years came from, and stays as the record.
- **Germany's `to` and `claimBack`:** never shown, since Germany has no `years` and `idleAccounts` moves nothing there;
  the research's account of why stays as written.

## `content/pending.ts`

- **Chase, `pendingWords`:** "When Chase approves a debit card purchase it holds that much of your available balance,
  generally for three business days. The merchant can take several days longer to collect, so the purchase may post
  after the hold has already dropped off." It explains the one thing a player sees on Statements, a pending line that
  vanishes and comes back, in the order it happens.
- **Capital One, `postingOrder`:** after "Overnight:", it gives the bank's real order, group by group, in plain words,
  including the ties' direction; the precision is the point, since it decides which payment an overdraft hits.
- **ANZ New Zealand, `pendingWords`:** "A hold that you don't end up spending won't be processed and drops off after a
  day or two. A card verification hold won't be processed either and disappears from your account in five days." Two
  short sentences that answer the question a player has about a hold they don't recognize.

## The banks' own research: `banks-thirteen.ts`, `banks-lending.ts`, `banks-world*.ts`

- **Chase's product names, Chase Total Checking and Chase Savings,** and their source lines ("chase.com: $5 a month,
  waived with a $300 balance; 0.01% APY"): the product is named as Chase sells it, and the line cites the page and
  says in a few words what it gives, at the foot of the account.
- **Citi's `overdraft`, "Citi charges no overdraft or returned-item fees."**: on Borrowing, where there are no terms to
  show, the one fact a player needs.
- **`NOT_FOUND`, "no published rate found":** the Accounts tab reads it back (`/no published rate/i` in
  BankWorkspace.tsx) and says its own sentence to the player; it's a key.
- **Spain's tacit overdraft cap**, "Ley 16/2011 de contratos de crédito al consumo, art. 20.4: a tacit overdraft may not
  cost more than two and a half times the legal rate of interest (3.25% in 2026), counting its commission": the law,
  its limit and how it's counted, cited at the foot of Borrowing.
- **The world's bank names** ("Banka Kombëtare Tregtare (BKT)", "Banque pour l'Industrie et le Commerce – Comores
  (BIC-Comores)"): as their customers know them, with the short form they go by.
- **The IBAN structures** ("3!n11!n"): the IBAN Registry's notation, which builds the account number the player sees;
  the strings themselves are never printed.

## `content/roundups.ts`, `homeaccounts.ts`, `home-accounts.json`

- **Bank of America, `words`:** "Each Bank of America debit card purchase is rounded up to the next whole dollar, and
  the difference moves to your savings in one transfer at the end of each business day." The feature in one sentence,
  in the order the player sees it work: the purchase, the dollar, the transfer, when.
- **Wells Fargo, `words`:** "Not a round-up: a flat $1 for each one-time debit card purchase, …" It corrects the
  player's expectation before it explains, which is what the panel's heading, Round-Ups, would otherwise mislead.
- **`OFF`:** "In the game, turning it off, or switching your primary account to another bank, drops what was counted
  and hasn't moved. The bank doesn't say what happens." The game's rule first, then the bank's silence, so the player
  knows which part is the game's.
- **Lloyds' `READ`:** "Lloyds keeps it once you've told it your American address, though its terms say it “may not be
  able to keep your account open” for a customer who moves abroad." The step, the risk, and the bank's own words for
  the risk.
- **Japan's `NON_RESIDENT_TAX` note:** "Japan withholds 15.315% from a customer abroad; the treaty's exemption needs a
  notice through the bank, and the game assumes none was given." The rate, why a lower one doesn't apply, and that the
  game made that assumption.
- **`home-accounts.json`:** the research quoted, which no screen reads (batches.md, batch 6); rebuilt from its source
  by `tools/build-home-accounts.mjs`, so an edit here would be lost and would change nothing a player sees.
