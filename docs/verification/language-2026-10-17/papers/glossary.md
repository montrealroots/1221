# Papers And Taxes: The Player's Words

For `docs/GLOSSARY.md`'s Papers And Taxes section, in its columns. Written by the papers area of brief 14 from the
screens and the rules. Core terms (apply, issued, in hand, estimated, Source) are the coordinator's and aren't repeated.

| Say | What It Means | Instead Of |
|---|---|---|
| **tax return**, **your return**, **the return for 2026** | A year's income tax settled with the IRS and the state, prepared each February 1 (`registerTaxReturn`). | 2026’s, the year’s return worked out |
| **file**, **File It** | Send the return in. Filing takes any balance from your bank at once (`tax.file`). | |
| **You Owe**, **Your Refund** | The return's last line: tax still to pay, or tax coming back. | Comes Back To You |
| **refund** | Money the IRS or a state pays back, on its own schedule (`RETURN.refundDays`, `refundDays`). | back, comes back |
| **Who It’s Owed To** | The split of a year's balance between the IRS and each state (`owedToOf`). | |
| **the IRS**, **Connecticut DRS** and each agency's short name | Who collects. A state's short name is its own (`StateRules.short`). | the authority, in prose |
| **tax**, **penalties**, **interest** | The three parts of what's owed, in that order on screen (`Part`). | a part, for any of them |
| **a partial payment** | A payment less than all of it, split by the payee's order. | a part |
| **notice**, **bill**, **letter** | What an authority sends, named by its code and title (CP14, CP501, DRS Bill). | |
| **levy** | An authority taking what you owe from your bank accounts. | |
| **payment plan** | An arrangement to pay over time; the IRS's covers federal tax only, each state has its own (`tax.apply_plan`, `tax.apply_state_plan`). | installment agreement, except as a state's own name |
| **Apply For The Plan**, **Being decided**, **In force**, **A payment missed**, **Declined** | The plan's button and its statuses, the IRS's and a state's alike. | Ask For The Plan, With the IRS, Refused |
| **Catch Up**, **Catch Up By** | Paying a missed plan payment, and its deadline. | Caught Up By |
| **setup fee**, **revision fee** | The IRS plan's charges (`PLAN.fee`, `PLAN.reviseFee`). | the fee, alone |
| **lowest monthly payment** | What you owe spread over the IRS's longest term, the least a monthly plan takes (`leastMonthly`). | the least a month |
| **lien** and its statuses: **Notice Of Intent Sent**, **Filed**, **Paid: Release To Come**, **Released**, **Asked To Be Withdrawn**, **Withdrawn**, **Not Filed** | A public claim recorded for unpaid tax (`Lien`). | It secured |
| **release**, **withdrawal** | A lien ended once paid, and a lien treated as never filed. Not the same thing. | |
| **amended return** | A correction filed after the return (`tax.amend`). | refigures |
| **the IRS's own return** (Filed by the IRS) | A return the IRS files for you when you don't, which your own replaces (`SUBSTITUTE`). | substitute, in prose |
| **passport**, **ID card**, **driving license** | The papers that prove who you are. A paper counts only once it's issued and arrives. | travel document, in prose |
| **Status** (a document's), **In Force**, **Being Decided**, **Reported Lost**, **Canceled**, **Run Out** | A document's row on Papers. | Standing, for a document |
| **Your Status There** | Where you stand on residence in each country (Residence Abroad). | Where You Stand |
| **permission to work**, **OPT** | A noncitizen's right to work in the US; OPT is an F-1 graduate's (`documents.apply_opt`). | leave to work |
| **US status**, **out of status** | An F-1's lawful stay, and staying past its end. What follows is said as the game's rule. | void, for good |
| **grace period** | The days of status after permission ends (`STATUS_GRACE_DAYS`). | grace, alone |
| **Social Security number** | The number work-study needs; the game keeps whether you hold one, not the number. | |
| **health cover**, **This Month**, **The Marketplace**, **HUSKY D**, **Covered Connecticut** | What pays for care, by its program's own name (`coverLabel`). | Medicaid, for Connecticut's |
| **work rules** | Medicaid's monthly test from 2027 (`PUBLIC_COVER.workEarnings`). | engagement |
| **notice of noncompliance** | The letter that asks you to show the work rules met, with its days to answer. | |
| **Your Doctor**, **Your Pharmacy**, **The Practice Your Cover Uses**, **Any Pharmacy, At The Typical Price** | The practice and chain care is had at, and the choice before you pick one. | As Your Cover Has It, At The Median |
| **charity care** | A Connecticut hospital's discount on a bill, by income against the poverty line (`CHARITY`). | the charity |
| **claim**, **Claim filed** | An unemployment or benefit claim (`benefits.claim`). | Filed, alone |
| **base period**, **waiting week** | The quarters a claim's wages come from, and the first unpaid week. | |
| **claim it**, **You’ve already claimed it** | Starting a pension. | drawing it |
| **in the game** | What the game does where the world's rule isn't published or isn't modeled: “In the game, the plan ends.” | SLATE ends, SLATE’s reading, SLATE doesn’t model |
| **Assumed in the game:** | The label in a passport office's fine print for what the game takes where the office publishes nothing (`AbroadTerms.assumed`). | Not confirmed, SLATE’s assumption |
| **Your bank can’t cover $…, so nothing was charged** (or **paid**, or **changed**) | The one refusal for a fee or payment your accounts can't meet. | … is more than the bank can cover |
