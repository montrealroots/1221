# Every function of a bank account and a card, against SLATE

The real functions of a personal current account, a savings account and a
credit card, from 33 banks' and regulators' own documents
(`probe/functions/INVENTORY.md`, compiled 2026-09-26), each held against
what SLATE does. The owner asked on 2026-09-26 for every function of a card
and a bank account.

- **Has it**: SLATE does it now.
- **Module n**: built in that module, in the order below.
- **Waits**: needs something SLATE doesn't have yet, named.
- **Outside the game**: a thing with no counterpart in play (a PIN, a phone call).

When a module lands, its rows change to **Has it** in the same commit.

| | Functions |
|---|---|
| Has it | 168 |
| To build | 7 |
| Waits | 101 |
| Outside the game | 30 |
| **All** | **306** |

## The modules, in order

| Module | What | Functions |
|---|---|---|
| 1 | Statements and records | Done, 2026-09-26 |
| 2 | Payments: direct debits, standing orders, checks and how each thing is paid | Done, 2026-09-26 |
| 3 | Cash | Done, 2026-09-26 |
| 4 | The card’s life: applying, limits, closing, default | Done, 2026-09-26 |
| 5 | How a card charges interest | Done, 2026-09-26 |
| 6 | Security: locking, loss, theft and fraud | Done, 2026-09-26 |
| 7 | Savings and an account’s life | Done, 2026-09-26 |
| 8 | Each card’s own offers (research first) | Done, 2026-09-26 |
| 9 | Pending payments and holds | 7 to build |

## A. Personal current / checking account

### A.1 Opening and closing

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| A1 | Open an account with identity checks | Has it | Accounts are opened at the start of a life and on a switch; identity is never in doubt in a game of one. |
| A2 | Sole ownership | Has it | Every account is the character’s alone. |
| A3 | Joint ownership | Waits | Waits on other people with money of their own. |
| A4 | Survivorship on a joint account | Waits | Waits on other people with money of their own. |
| A5 | Payable-on-death / in-trust-for beneficiary | Waits | Waits on heirs: a life ending ends the game. |
| A6 | Custodial or youth account | Waits | Waits on children. |
| A7 | Power of attorney / agent | Waits | Waits on other people. |
| A8 | Authorized (convenience) signer | Waits | Waits on other people. |
| A9 | Trusted contact person | Waits | Waits on other people. |
| A10 | Supported decision-making supporter | Waits | Waits on other people. |
| A11 | Fiduciary titling | Waits | Waits on other people. |
| A12 | 14-day right of withdrawal | Has it | Cancel a new savings account, term deposit or card in the country’s cooling-off period, Britain’s fixed deposits excepted. |
| A13 | Right to a basic payment account | Has it | Everyone gets the bank’s everyday account. |
| A14 | Change account product | Waits | Waits on research on each bank’s other account products. |
| A15 | Switch the account to another bank | Has it | Switch Bank. |
| A16 | Holder closes the account | Has it | Closing savings; the current account closes by switching. |
| A17 | Bank closes the account | Has it | An account overdrawn for sixty days is closed. |
| A18 | Automatic closure at zero or negative balance | Waits | Waits on banks say they may close an empty, unused account, not when. |
| A19 | Inactive status | Has it | Inactive after the bank’s months untouched. |
| A20 | Dormant status | Has it | Dormant after the bank’s months: blocked until reactivated. |
| A21 | Escheatment / unclaimed assets | Has it | Unclaimed after the country’s years, to its state or scheme, and claimed back. |
| A22 | Death or incapacity of an owner | Outside the game | Outside the game: a life ending ends the game; the end screen shows what was left. |
| A23 | Disputes between owners / adverse claims | Waits | Waits on other owners. |
| A24 | No assignment of the account | Has it | Nothing lets an account be signed over. |
| A25 | Replacement account number | Has it | A new account number where the bank moves a compromised account itself. |
| A26 | Arbitration opt-out | Outside the game | Outside the game: arbitration is a legal process outside play. |
| A27 | Residency and eligibility | Waits | Waits on moving abroad. |

### A.2 Money in

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| A28 | Cash deposit at a teller | Has it | Pay cash in at the bank. |
| A29 | Cash or check deposit at an ATM | Has it | Pay cash in at an ATM. |
| A30 | Check deposit at a branch | Waits | Waits on someone paying the character by check. |
| A31 | Mobile check deposit | Waits | Waits on someone paying the character by check. |
| A32 | Night depository and mail deposits | Waits | Waits on someone paying the character by check. |
| A33 | Deposit at the Post Office | Has it | Pay cash in at the Post Office (UK). |
| A34 | Endorse a check | Waits | Waits on checks paid to the character. |
| A35 | Direct deposit | Waits | Waits on income: the owner’s next route. |
| A36 | Early direct deposit | Waits | Waits on income. |
| A37 | Incoming wire | Waits | Waits on someone paying the character. |
| A38 | Incoming instant or electronic payment | Waits | Waits on someone paying the character. |
| A39 | Incoming international payment with conversion | Waits | Waits on someone paying from abroad. |
| A40 | Foreign check: collect or negotiate | Waits | Waits on checks from abroad. |
| A41 | Transfer in from an own external account | Waits | Waits on accounts at a second bank at once. |
| A42 | Receive person-to-person payments | Waits | Waits on other people. |
| A43 | Funds availability schedule | Waits | Waits on deposits from outside. |
| A44 | New-account hold rules | Waits | Waits on deposits from outside. |
| A45 | Bank refuses or reverses a deposit | Waits | Waits on deposits from outside. |
| A46 | Charge-back of a returned deposited item | Waits | Waits on deposits from outside. |
| A47 | Reversal of a mistaken credit | Waits | Waits on deposits from outside. |
| A48 | Deposit adjustment | Has it | A cash deposit is counted and credited as counted. |
| A49 | Maximum balance | Waits | Waits on research on which accounts cap the balance. |

### A.3 Money out and payments

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| A50 | Debit card purchase | Has it | The day’s food is paid by debit card. |
| A51 | Cash back at checkout | Waits | Waits on shops: cash back is the shop’s to give. |
| A52 | ATM withdrawal | Has it | Take cash out at an ATM, with the bank’s own and other banks’ ATM fees. |
| A53 | Other ATM services | Has it | Balance and transfers, in the bank’s screen. |
| A54 | Teller withdrawal | Has it | Take cash out at the counter. |
| A55 | Cash at another bank's teller | Waits | Waits on research: only Chase’s 3% or $5 was found. |
| A56 | Write a check | Has it | Pay the rent by check where rent is paid that way (the United States). |
| A57 | Bank's check-paying rules | Has it | The bank’s rules for paying a check. |
| A58 | Order checks / counter checks | Has it | Order checks. |
| A59 | Buy a cashier's check or money order | Waits | Waits on a payee who asks for guaranteed funds: no research found landlords ask for a cashier’s check. |
| A60 | Stop payment on a check | Has it | Stop a check. |
| A61 | Stop a lost cashier's check | Waits | Waits on a lost cashier’s check. |
| A62 | One-time payment by account number | Has it | Pay the rent by a one-off bank payment. |
| A63 | Recurring debit / direct debit mandate | Has it | Rent and bills as direct debits, listed. |
| A64 | Stop a preauthorized ACH debit | Has it | Stop a direct debit (US). |
| A65 | Cancel a direct debit or standing order | Has it | Cancel a direct debit or standing order. |
| A66 | Limit SEPA direct debits | Has it | Refuse or cap direct debits (EU). |
| A67 | Standing order | Has it | Standing orders: set one up, to savings or the landlord. |
| A68 | Recurring card payment (continuous payment authority) | Has it | Put the bills on the card as a recurring card payment. |
| A69 | Online bill pay | Has it | Pay a bill now. |
| A70 | Scheduled / future-dated payment | Has it | Schedule a payment for a date. |
| A71 | Transfer between own accounts | Has it | Move Money. |
| A72 | External transfer out | Waits | Waits on payees beyond the landlord. |
| A73 | Person-to-person payment | Waits | Waits on other people. |
| A74 | Instant domestic payment | Has it | Paying the landlord goes the same day where the country pays instantly. |
| A75 | Domestic wire | Waits | Waits on payees who take wires. |
| A76 | International wire | Waits | Waits on payees abroad. |
| A77 | Recall or cancel an international payment | Waits | Waits on payees abroad. |
| A78 | Confirmation of Payee | Has it | Confirmation of Payee on paying the landlord (UK). |
| A79 | Number-over-name rule | Outside the game | Outside the game: a mistyped account number has no counterpart in play. |
| A80 | Redirect after a payee switches bank | Waits | Waits on payees who switch banks. |
| A81 | Pay through a third-party provider | Outside the game | Outside the game: third-party apps. |
| A82 | Foreign-currency card use | Waits | Waits on travel. |
| A83 | Pay abroad in home currency (dynamic currency conversion) | Waits | Waits on travel. |
| A84 | Buy foreign currency at a branch | Waits | Waits on travel. |
| A85 | Card-on-file updating | Has it | A replaced card’s number reaches its bills where the bank passes it on; otherwise they’re declined until the holder does. |
| A86 | Bank refuses a payment instruction | Has it | Every refused instruction says why. |

### A.4 Statements and records

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| A87 | Periodic statement | Has it | A monthly statement for each account. |
| A88 | Quarterly closing with deemed approval | Has it | Germany’s quarterly closing: interest and fees netted each quarter. |
| A89 | Paperless statements and e-mailbox | Outside the game | Outside the game: everything is paperless in play. |
| A90 | Combined statement | Has it | Every account on one page. |
| A91 | Check images, safekeeping and return | Waits | Waits on checks. |
| A92 | Copies on request | Has it | Any past statement, again. |
| A93 | Transaction history | Has it | Every transaction, with its running balance. |
| A94 | Account printers | Outside the game | Outside the game: a branch printer. |
| A95 | Pending vs posted transactions | Module 9 | Card purchases pending before they post. |
| A96 | Available balance vs ledger balance | Module 9 | Available balance beside the ledger balance. |
| A97 | Posting order | Module 9 | The US nightly posting order. |
| A98 | Value date | Module 9 | A value date on each entry (EU). |
| A99 | Receipts | Outside the game | Outside the game: receipts are the statement in play. |
| A100 | Tax reporting | Has it | The year’s interest and tax, as the bank reports it. |

### A.5 Interest, fees and charges

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| A101 | Monthly service fee and waivers | Has it | Monthly fees and their waivers. |
| A102 | Relationship pricing | Has it | Waivers for a balance across the bank’s accounts. |
| A103 | Interest on checking | Has it | Interest on a current account where it pays. |
| A104 | Overdraft coverage at the bank's discretion | Has it | Overdraft paid at the bank’s discretion. |
| A105 | Overdraft fee | Has it | Overdraft fees by the item. |
| A106 | Overdraft grace / cure window | Has it | Cure by the next business day. |
| A107 | Returned item / NSF handling | Has it | Returned items. |
| A108 | Overdraft protection transfer | Has it | Overdraft protection: choose which accounts back the current account, and in what order. |
| A109 | Arranged overdraft (credit line on the account) | Has it | Arranged overdraft (lent against wages, so waiting on income to be reached). |
| A110 | Unarranged / tolerated overdraft | Has it | Unarranged overdraft. |
| A111 | Order deposits repay overdraft | Has it | Money in clears what’s overdrawn first. |
| A112 | Overdraft collection and charge-off | Has it | Charge-off and collections. |
| A113 | Overdraft opt-in for ATM and one-time debit | Has it | Debit card overdraft opt-in. |
| A114 | ATM fees | Has it | ATM fees, the bank’s and the ATM owner’s. |
| A115 | Rush card replacement fee | Has it | A rush replacement, for the bank’s fee, where it has one. |
| A116 | Legal processing fee | Waits | Waits on garnishment. |
| A117 | Custody fee on large balances | Waits | Waits on research: no bank on record charges one in 2026. |
| A118 | Fees charged regardless of balance | Has it | Fees can overdraw the account. |
| A119 | Right of set-off | Has it | A charged-off debt is set off against the bank’s other accounts. |

### A.6 Protections and disputes

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| A120 | Electronic transfer error claim | Has it | Report a payment as not yours. |
| A121 | Unauthorized card or electronic transfer liability | Has it | US liability: $50, $500 or everything by how fast it’s reported. |
| A122 | Unauthorized payment refund (PSD2 rule) | Has it | The European rules’ refund by the next working day, and their €50. |
| A123 | Refund when the amount was unexpected | Waits | Waits on merchants. |
| A124 | Direct debit refund guarantee | Has it | The Direct Debit Guarantee’s refund (UK) and SEPA’s eight weeks. |
| A125 | Debit card chargeback | Waits | Waits on merchants. |
| A126 | Check fraud claims | Waits | Waits on checks. |
| A127 | Other statement errors | Waits | Waits on a bank that makes errors: SLATE’s never do, so a report would find nothing. |
| A128 | Substitute check refund | Waits | Waits on checks. |
| A129 | Bank liability for failed or late payments | Waits | Waits on payments the bank fails to make. |
| A130 | Trace and recall a mistaken payment | Waits | Waits on payees beyond the landlord. |
| A131 | Scam reimbursement | Waits | Waits on scams. |
| A132 | Deposit insurance | Waits | Waits on a bank that can fail. |
| A133 | Complaint and ombudsman | Waits | Waits on complaints outside play. |
| A134 | Dispute a consumer-report entry | Waits | Waits on errors on the record. |
| A135 | Garnishment and levy handling | Waits | Waits on courts. |
| A136 | Garnishment-protected account (P-Konto) | Waits | Waits on courts. |
| A137 | Bank secrecy and information sharing | Outside the game | Outside the game: privacy law. |

### A.7 Limits, holds and security

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| A138 | Daily card limits | Has it | Daily ATM and purchase limits. |
| A139 | Contactless and payment limits | Outside the game | Outside the game: contactless taps. |
| A140 | Authorization hold | Module 9 | Authorization holds. |
| A141 | Hold on existing funds when cashing a check | Waits | Waits on checks. |
| A142 | Card lock / freeze | Has it | Lock and unlock the debit card. |
| A143 | Report a lost or stolen card | Has it | Report the card lost, stolen or damaged; a new one follows. |
| A144 | Automatic card reissue | Has it | The card is reissued before it expires. |
| A145 | PIN set and change | Outside the game | Outside the game: PINs. |
| A146 | Strong authentication and trusted devices | Outside the game | Outside the game: two-factor sign-in. |
| A147 | Account alerts | Has it | Alerts: low balance, a large payment, a statement ready. |
| A148 | Bank freezes or blocks for fraud, scam or compliance | Has it | The bank stops a share of fraud, at its country’s rate. |
| A149 | Card suspended for risk | Has it | The card suspended while the account is in collections. |
| A150 | Credential responsibility | Outside the game | Outside the game: credentials. |
| A151 | Third-party access control | Outside the game | Outside the game: third-party apps. |
| A152 | Parental controls on a child's account | Waits | Waits on children. |
| A153 | Gambling and prohibited-use blocks | Waits | Waits on gambling. |

### A.8 Notices and communications

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| A154 | Change-of-terms notice | Waits | Waits on rates and fees that move after the research date. |
| A155 | Interest rate change notice | Waits | Waits on rates that move. |
| A156 | Deposit hold notice | Waits | Waits on deposits from outside. |
| A157 | Varying-amount notice for recurring debits | Waits | Waits on bills that vary. |
| A158 | Stop-payment confirmation | Has it | Confirmation of a stopped check. |
| A159 | Currency-conversion cost message | Waits | Waits on travel. |
| A160 | Fee information document and annual statement of fees | Has it | The year’s fees and interest in one summary (EU). |
| A161 | Branch closure or account-number change notice | Outside the game | Outside the game: branches. |
| A162 | Notice of a refused instruction | Has it | Every refused instruction says why. |
| A163 | Service calls, texts and recording | Outside the game | Outside the game: phone calls. |
| A164 | Keep contact details current / undeliverable mail | Outside the game | Outside the game: contact details. |
| A165 | Accessible formats | Outside the game | Outside the game: formats. |

## B. Personal savings account

### B.1 Opening and closing

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| B1 | Open a savings account | Has it | Open A Savings Account. |
| B2 | Choose the savings type | Waits | Waits on research on each bank’s other savings products (notice accounts, ISAs, money market). |
| B3 | Cash ISA | Waits | Waits on personal income tax, which went with the job engine. |
| B4 | Passbook issue | Outside the game | Outside the game: a paper passbook. |
| B5 | Open a CD / fixed-term deposit | Has it | Term deposits. |
| B6 | CD ladder | Has it | Several term deposits at once. |
| B7 | CD maturity, grace period and renewal | Has it | A term deposit’s end: renewed, into savings, or paid out, as its holder chooses among the bank’s ways with its notice, with any grace days. |

### B.2 Money in

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| B8 | Scheduled transfers from checking | Has it | A standing order into savings. |
| B9 | Round-up saving | Has it | Round-ups into savings where the bank offers them. |
| B10 | Self-service deposit to savings | Has it | Cash into savings. |
| B11 | No top-ups on a CD mid-term | Has it | A term deposit takes nothing more. |

### B.3 Money out and payments

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| B12 | Withdrawal count rules | Has it | Free savings withdrawals a month where the bank sets them. |
| B13 | No checks, debit card, Zelle or bill pay | Has it | Savings pays nobody directly; it backs the current account only if linked. |
| B14 | Seven-day notice reservation | Outside the game | Outside the game: a reserved right no bank uses. |
| B15 | Notice account withdrawal | Waits | Waits on notice accounts (research). |
| B16 | CD early withdrawal penalty | Has it | Break a term deposit early, for the bank’s penalty, or refused where it doesn’t allow it. |
| B17 | Penalty waivers | Outside the game | Outside the game: a life ending ends the game. |
| B18 | Withdraw CD interest penalty-free | Has it | Take a term deposit’s interest during the term where the bank allows it. |
| B19 | Savings as overdraft backup | Has it | Savings as the current account’s backup, by choice. |
| B20 | Outgoing wire from savings | Waits | Waits on payees who take wires. |
| B21 | Self-service withdrawal cap | Has it | Germany’s €2,000 a month from savings by card. |

### B.4 Statements and records

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| B22 | Savings statement | Has it | Savings statements. |
| B23 | Passbook update | Outside the game | Outside the game: a paper passbook. |
| B24 | Restricted-access account statements | Has it | Statements for savings with no day-to-day payments. |

### B.5 Interest, fees and charges

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| B25 | Variable savings rate | Has it | The bank’s variable rate, with its announced changes. |
| B26 | Fixed, tracker and managed rates | Waits | Waits on rates that move. |
| B27 | Daily interest accrual | Has it | Daily accrual. |
| B28 | Compounding and crediting | Has it | Monthly crediting. |
| B29 | Relationship and tiered rates | Has it | Tiered rates. |
| B30 | Promotional / bonus rates | Has it | Bonus and introductory rates. |
| B31 | APY disclosure | Has it | The APY beside the rate. |
| B32 | Savings monthly fee and waivers | Has it | Savings fees and waivers. |
| B33 | Excess-withdrawal fee | Has it | The fee for each savings withdrawal past the free ones. |
| B34 | Tax on interest | Has it | Tax on interest, by country, with allowances. |
| B35 | Interest stops | Has it | Interest stops on a dormant account where the bank says so. |

### B.6 Protections and disputes

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| B36 | Close without penalty on a bad rate change | Waits | Waits on rates that move. |

### B.7 Limits, holds and security

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| B37 | Password and blocking note on savings | Outside the game | Outside the game: passwords. |
| B38 | Lost passbook | Outside the game | Outside the game: a paper passbook. |
| B39 | Savings ATM card limits | Waits | Waits on research: no bank’s savings card limits were found. |

### B.8 Notices and communications

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| B40 | Restricted-access rate-change notice | Waits | Waits on rates that move. |
| B41 | CD maturity notice | Has it | The bank writes before a term deposit ends, in time for its notice. |
| B42 | Advance notice of adverse changes | Waits | Waits on rates that move. |

## C. Personal credit card

### C.1 Opening and closing

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| C1 | Apply, with an ability-to-pay check | Has it | Apply for a card, with the bank checking the record and what you can repay. |
| C2 | Applicants under 21 | Has it | Under 21 in the US: income of your own or a co-signer. |
| C3 | No unsolicited cards | Has it | A card is only ever issued on request. |
| C4 | Credit limit set at opening | Has it | The limit set at opening from the record. |
| C5 | Activate the card / use before it arrives | Has it | A new card arrives in days, and works once it does. |
| C6 | 14-day withdrawal right | Has it | Cancel a new card in the cooling-off period, anything spent still to repay. |
| C7 | Authorized users / additional cardholders | Waits | Waits on other people. |
| C8 | Joint card applicants | Waits | Waits on other people. |
| C9 | Arbitration opt-out | Outside the game | Outside the game: arbitration. |
| C10 | Holder closes the account | Has it | Close the card; what’s owed is still paid down. |
| C11 | Issuer closes or suspends | Has it | The bank closes or suspends the card. |
| C12 | Default and acceleration | Has it | Default: missed payments close the card and the balance falls due. |
| C13 | Pro-rata annual fee refund | Waits | Waits on a benefit the bank cuts, or a bank closing a card without fault: a pro-rata refund follows only those. |
| C14 | Product change / upgrade | Waits | Waits on research on each bank’s other cards. |
| C15 | Sale of the debt | Has it | A defaulted card’s debt sold to collections. |
| C16 | Card ownership and return | Outside the game | Outside the game: a plastic card. |

### C.2 Money in (payments to the card)

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| C17 | Make a payment | Has it | Pay the card. |
| C18 | Same-day crediting and cutoff | Has it | Payments credited the same day. |
| C19 | Autopay from a current account | Has it | Autopay. |
| C20 | Available-credit restoration | Module 9 | Freed credit available after the payment clears. |
| C21 | Payment allocation | Has it | Payments go to the dearest balance first (US, UK): with the cash balance a cash advance makes. |
| C22 | "Paid in full" conditional payments | Outside the game | Outside the game: paper checks marked paid in full. |
| C23 | Credit balance refund | Has it | Overpay, and have the credit balance refunded. |
| C24 | Merchant refunds and credits | Waits | Waits on merchants. |
| C25 | Change the payment due date | Has it | Change the payment due date. |
| C26 | Take payment from other accounts | Has it | A UK bank takes a missed card payment from your other accounts with it. |

### C.3 Money out and transactions

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| C27 | Purchases | Has it | Pay the day’s spending by card, by choice. |
| C28 | Recurring and scheduled charges | Has it | Bills on the card. |
| C29 | Cash advance | Has it | Cash advance: its fee, its rate and no grace period. |
| C30 | Cash-like transactions | Waits | Waits on gambling and crypto. |
| C31 | Balance transfer | Has it | A balance transfer from a card at another bank, onto the new bank’s card after switching. |
| C32 | Money transfer / cash to bank account | Has it | A money transfer into the current account, where the card offers one. |
| C33 | Convenience checks | Waits | Waits on checks. |
| C34 | Instalment / pay-over-time plan | Has it | A plan paying a purchase off in equal months for a fee, where the card charges one. |
| C35 | Foreign-currency transactions | Waits | Waits on travel. |
| C36 | Authorization and hold | Module 9 | Authorization and holds. |
| C37 | Transaction declines | Has it | Declined past the limit. |
| C38 | Over-limit transactions | Has it | Over the limit only for someone who opted in (US). |
| C39 | Rewards and extra features | Has it | Rewards at the card’s base rate, redeemed onto the card. |

### C.4 Statements and records

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| C40 | Monthly billing statement | Has it | The card’s monthly statement. |
| C41 | Statement lead time | Has it | The days from statement to due date. |
| C42 | Minimum payment | Has it | The minimum payment. |
| C43 | Balance subject to interest | Has it | Interest on the average daily balance. |
| C44 | Next-month interest estimate | Has it | Next month’s interest, estimated on the statement (UK). |
| C45 | Annual rate summary | Waits | Waits on rates that move. |
| C46 | Copy of terms on request | Has it | The terms are on the bank’s screen. |

### C.5 Interest, fees and charges

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| C47 | Variable purchase APR | Waits | Waits on rates that move with Prime or Bank Rate. |
| C48 | Grace (interest-free) period | Has it | The grace period, lost and regained, with trailing interest. |
| C49 | No grace on cash and balance transfers | Has it | No grace on cash. |
| C50 | Daily compounding interest | Has it | Interest compounded daily. |
| C51 | Intro / promotional APR | Has it | The card’s introductory rates, ended by a US payment sixty days late. |
| C52 | Penalty APR | Has it | The penalty rate after a payment 60 days late (US), lifted after six on time. |
| C53 | Limits on rate increases | Has it | The limits on raising a card’s rate. |
| C54 | Annual fee | Has it | The yearly fee. |
| C55 | Balance transfer fee | Has it | The balance transfer fee. |
| C56 | Cash advance fee | Has it | The cash advance fee. |
| C57 | Foreign transaction fee | Waits | Waits on travel. |
| C58 | Late payment fee | Has it | The late fee never more than the minimum (US), at most four a year (UK). |
| C59 | Returned payment fee | Has it | A card payment that bounces: the returned payment fee. |
| C60 | Over-limit fee only with opt-in | Has it | Over-limit opt-in (US). |
| C61 | Returned convenience-check fee | Waits | Waits on checks. |
| C62 | Plan fees | Has it | A plan’s monthly fee. |
| C63 | US fee caps | Has it | The US fee caps. |
| C64 | No interest on default fees for 28 days | Has it | UK default fees free of interest for 28 days. |
| C65 | Military cost cap | Waits | Waits on military service. |
| C66 | Card replacement fee | Has it | The bank’s replacement card fee, and when it’s free. |

### C.6 Protections and disputes

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| C67 | Billing error dispute | Waits | Waits on merchants. |
| C68 | Claims against the issuer for a bad purchase | Waits | Waits on merchants. |
| C69 | Unauthorized use liability | Has it | US liability for a credit card, $50. |
| C70 | Section 75 joint liability | Waits | Waits on merchants. |
| C71 | Chargeback | Waits | Waits on merchants. |
| C72 | Unauthorized card use refund (PSD2) | Has it | The European rules’ refund for a credit card. |
| C73 | Refund when the amount was unexpected | Waits | Waits on merchants. |
| C74 | Failed or wrong transfer refund | Waits | Waits on transfers the bank gets wrong. |
| C75 | Persistent debt intervention | Has it | UK persistent debt: the bank steps in at 18 and 36 months. |
| C76 | Hardship and reduced-payment arrangements | Has it | Ask for a hardship arrangement. |
| C77 | Credit reporting | Has it | The record. |
| C78 | Complaint and ombudsman | Waits | Waits on complaints outside play. |

### C.7 Limits, holds and security

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| C79 | Credit limit increase | Has it | Ask for a higher limit; opt out of unasked raises (UK). |
| C80 | Credit limit decrease | Has it | Ask for a lower limit. |
| C81 | Temporary limit increase | Waits | Waits on research: a temporary limit is a bank’s own offer, and none was found. |
| C82 | Cash limit and daily cash caps | Has it | The cash limit. |
| C83 | Contactless limit | Outside the game | Outside the game: contactless taps. |
| C84 | Card controls / freeze | Has it | Lock the credit card; its bills still go through. |
| C85 | Report lost or stolen | Has it | Report the credit card lost or stolen. |
| C86 | Account restriction by the issuer | Has it | The bank restricts the card. |
| C87 | Remove an authorized user | Waits | Waits on other people. |
| C88 | Card replacement and exchange | Has it | A new credit card before it expires. |
| C89 | PIN and security duties | Outside the game | Outside the game: PINs. |

### C.8 Notices and communications

| # | Function | SLATE | How, or what it waits on |
|---|---|---|---|
| C90 | Change-in-terms notice | Has it | Notice before a penalty rate. |
| C91 | Right to reject a rate increase | Waits | Waits on rates that move. |
| C92 | Credit limit notices | Has it | Limit changes are told. |
| C93 | Minimum-payment warning | Has it | The minimum payment warning: how long paying the minimum takes, and what it costs. |
| C94 | Over-limit opt-in and revocation notices | Has it | Over-limit opt-in notices. |
| C95 | Arrears and default notices | Has it | Arrears and default notices. |
| C96 | Fraud and security contact | Has it | The bank asks about a payment it stopped. |
| C97 | Currency-conversion cost message | Waits | Waits on travel. |
| C98 | Contact consent and call recording | Outside the game | Outside the game: phone calls. |
| C99 | Keep details current / living abroad | Outside the game | Outside the game: contact details. |
