/**
 * Batch 2: `content/accountlife.ts`, the words Your Accounts Over Time shows (`ui/bank/BankAccountLife.tsx`): each
 * bank's `penaltyWords` ("The bank’s terms: …" after what breaking a term deposit costs), `maturityWords` ("The bank’s
 * terms at the end: …"), `dormancyWords` ("The bank’s terms: …" beside an inactive or dormant account) and `source`
 * ("Source: the bank’s terms, …."); each country's `to` and `claimBack` (in "… went to <to> after years unused.
 * <claimBack>", the question before it and the notice after it, `systems/accountlife.ts`) and `source` ("The country’s
 * rules: …."). The US's `to`, `claimBack` and `source` aren't shown: `unclaimedLaw` replaces them. Germany's `to` and
 * `claimBack` aren't shown either: with no `years`, nothing moves. Applied with `apply-gen.mjs`; each before is in
 * `b2-accountlife-changes.json`. The sources' trailing day becomes "read …" at the end of this file.
 */
import { readDaysFor } from './read-days.mjs';

const JP_DORMANT = 'After 10 years with no deposits or withdrawals, under the Dormant Deposits Act (休眠預金等活用法, in force since January 2018), the balance may go to the Deposit Insurance Corporation (預金保険機構) as a dormant deposit (休眠預金), after a public notice, and you can still claim it back at the bank’s counter. That last rule is the law for every Japanese bank, as Japan Post Bank’s page states it.';
const MX_DORMANT = 'After 3 years with no deposits or withdrawals, the bank moves the balance to its cuenta global, a general holding account, after writing to your registered address 90 days before. The money is still yours there: it’s charged no fees and earns interest each month, and fees the bank charges don’t count as using the account. After 3 more years there with no claim or movement, 6 years in all, a balance of up to 300 days of the Mexico City minimum wage goes to the Beneficencia Pública (Ley de Instituciones de Crédito, art. 61).';
const IE_DORMANT = 'Under the Dormant Accounts Act 2001, 15 years with no activity makes an account dormant. You can bring it back with a transaction until the next March 31; after that the money goes to the Dormant Accounts Fund, run by the NTMA, and you can still claim it back with interest.';
const DE_DORMANT = 'No German law makes an unused account inactive: it keeps running. After 30 years with no movement, banks take the balance off their books, but your claim to it can be revived.';
const ES_DORMANT = 'In Spain, an account with no activity from you for 20 years is legally abandoned, and the balance becomes the State’s (Ley 33/2003, art. 18, as the Banco de España’s Portal del Cliente Bancario explains it). The bank must write to you by certified mail at least 3 months before the 20 years are up, unless the letter would cost more than the balance.';
const KR_DORMANT = 'An everyday account (입출금) with under ₩100,000 in it becomes a suspended account (거래중지계좌) after 1 to 3 years without transactions: 12 months for under ₩10,000, 24 for under ₩50,000 and 36 for under ₩100,000. Deposits and withdrawals are then blocked until you release it at a branch with proof of what it’s for, or close it. After 5 years without a transaction, or 5 years past maturity for a term deposit, it becomes a dormant deposit (휴면예금): the account’s contract ends and the balance may go to the Korea Inclusive Finance Agency (서민금융진흥원), where you can claim it back.';

const edits = {
  ACCOUNT_LIFE: {
    'us-chase': {
      penaltyWords: 'Taking money out of a personal CD early costs interest on the amount you take out: 90 days’ worth for a term under 6 months, 180 days’ for 6 months to under 24, and 365 days’ for 24 months or more, never more than the interest earned in the current term. Within 7 days of opening, or of another early withdrawal, it’s at least 7 days’ interest. The penalty comes out of the principal.',
      maturityWords: 'An automatically renewable CD renews on its maturity date for the same term, at the standard CD rate or your relationship rate. A single-maturity CD doesn’t renew, and stops earning interest on its maturity date.',
      dormancyWords: 'A checking or savings account you haven’t used yourself for 24 months may become inactive; a CD counts as inactive from when it’s funded until it matures or you take money out early. After 30 months it may become dormant: no debit card purchases, transfers, deposits or withdrawals, no online or mobile banking, and the debit card is restricted. After a longer period set by state law, it may be closed and the money handed to the state as unclaimed property, with a letter first.',
    },
    'us-bank-of-america': {
      penaltyWords: 'The penalty is interest on the amount you take out, at the account’s rate: for a term under 90 days, all the interest earned on that amount or 7 days’ interest, whichever is more; 90 days up to 12 months, 90 days’ interest; 12 up to 60 months, 180 days’; 60 months or longer, 365 days’. Any cash bonus paid when it opened or renewed is added to the penalty. It comes out of the interest first, then the principal. The fee schedule adds 7 days’ interest for a withdrawal in a term’s first 6 days.',
      maturityWords: 'It renews automatically on its maturity date, with the principal and interest reinvested at the rate offered then, unless you say otherwise before the grace period ends. A CD that doesn’t renew stops earning interest at maturity.',
      dormancyWords: 'State law sets how long an account can sit unused before it counts as abandoned, usually the law of the state on your statements, and bank charges, interest and automatic deposits or withdrawals usually don’t count as using it. Before the money goes to the state, the bank may mark the account inactive, then charge its usual monthly and other fees, stop sending statements, stop paying interest and refuse to pay items. Once the money has gone to the state, you claim it back from the state.',
    },
    'us-wells-fargo': {
      penaltyWords: 'For a Fixed Rate CD, the penalty depends on the term: 1 month’s interest for under 90 days; 3 months’ for 90 to 365 days; 6 months’ for over 12 to 24 months; 12 months’ for over 24 months. A month’s interest is the rate times the principal you take out, divided by 12. It comes out of the interest earned first, then the principal. Under Regulation D, a withdrawal within 7 days of opening, or of an earlier penalized withdrawal, costs 7 days’ simple interest.',
      maturityWords: 'It renews automatically at maturity, usually for the same term at the standard rate on that day, unless you take the money out.',
      dormancyWords: 'An account usually goes dormant when you haven’t used it yourself (a deposit or withdrawal at a branch or ATM, or a check) for 12 months for checking, 34 months for savings, or 34 months after a CD first renews. Automatic transfers and direct deposits don’t count unless state law says they do. While it’s dormant, Wells Fargo may restrict ATM and debit card transfers between your Wells Fargo accounts, transfers by phone, online, mobile and text banking, Bill Pay and wires. A dormant account linked to Prime or Premier Checking may be unlinked and lose its benefits. If you don’t get in touch within the state’s unclaimed-property period, usually 3 or 5 years, the bank closes the account, sends the money to the state and stops your statements.',
    },
    'us-citi': {
      penaltyWords: 'The penalty is simple interest on the amount you take out: 90 days’ for a CD of 1 year or less, 180 days’ for a longer one. It may come partly or wholly out of the principal. It’s waived if the owner dies or is found legally incompetent. The 12-month No Penalty CD lets you take out the whole balance and interest with no penalty after its first 6 days, but not part of it.',
      maturityWords: 'It renews automatically at maturity for the same term, at the rate in effect that day, unless you change the term or Citi no longer offers it.',
      dormancyWords: 'How long an account can go unused follows the abandoned-property law of the state of your last known address, or South Dakota’s if that address is outside the US. Money in an account you haven’t used yourself may be sent to the state. A CD renewing by itself doesn’t count as using it, and the state’s period can start after its first maturity. Citi may also restrict an account it finds inactive.',
    },
    'us-capital-one': {
      penaltyWords: 'Breaking a 360 CD costs 3 months’ interest for a term of 12 months or less, and 6 months’ for a longer one, however far into the term you are. It’s waived if an owner dies or is found legally incompetent. You can’t take out part of the principal during the term: only the whole CD can be cashed early.',
      maturityWords: 'It renews automatically into a CD of the same term, or the nearest term on offer, at the rate offered on its maturity date.',
      dormancyWords: 'An account goes dormant after 24 months with no transactions. Paper statements may stop, but you can still see the account online. Once state law presumes it abandoned, it stops earning interest. After the state’s period, all your deposit accounts are closed and the money goes to the state, where you can claim it.',
    },
    'ca-rbc': {
      penaltyWords: 'A non-redeemable GIC can’t be cashed before it matures. A redeemable (one-year cashable) GIC can be cashed in whole or in part at any time: with no interest in its first 29 days, and after that at a reduced early-redemption rate, worked out daily.',
      maturityWords: 'It renews automatically, for the same term and type at RBC’s rate then for similar deposits, unless you tell RBC otherwise. A GIC in a registered plan renews for one year.',
      dormancyWords: 'An account becomes inactive after 12 months with no transactions. RBC writes to you after 2, 5 and 9 years. It charges an Inactive Account fee of C$20 for each year from the 2nd to the 8th and C$40 in the 9th, or the balance if that’s less. An inactive account that reaches C$0.00 is closed without notice. At 10 years the account is closed and the balance sent to the Bank of Canada.',
    },
    'ca-td': {
      penaltyWords: 'A non-redeemable GIC “cannot be redeemed before its maturity date”. A redeemable or cashable GIC can be cashed as its Confirmation says: the TD 1-Year Cashable GIC in whole or in part after 30 days, with no penalty; the TD 3-Year Premium Cashable GIC at any time, at reduced rates set in tiers.',
      maturityWords: 'It does what you chose: pays out by check or into an account, or renews automatically (a cashable GIC renews its principal and interest into a TD 1-Year Cashable GIC). No interest is paid after the maturity date.',
      dormancyWords: 'A checking or savings account unused for a year becomes dormant. TD writes after the 2nd, 5th and 9th years with ways to reactivate it. An account dormant for 10 years goes to the Bank of Canada, US dollar and other foreign-currency accounts too since November 2024. You can reactivate it through EasyLine or at a branch.',
    },
    'ca-scotiabank': {
      penaltyWords: 'A Non-Redeemable GIC can’t be cashed before maturity, except on the owner’s death, when all the interest earned so far is paid. A Cashable GIC can be cashed at any time, with at least C$500 taken out and at least C$500 left in, and earns no interest if it’s cashed within 30 days of issue. A Redeemable GIC cashed early earns a reduced early redemption rate, which Scotiabank gives on request, and no interest within 30 days.',
      maturityWords: 'A GIC with automatic renewal renews for the same term at the rate on the renewal date. Otherwise it follows the instructions you give up to maturity.',
      dormancyWords: 'An inactive-account fee comes with each yearly notice that the account is inactive: C$20.00 after 2, 3 and 4 years, C$30.00 after 5 to 8 years, and C$40.00 with the ninth-year notice that it’s going to the Bank of Canada. To reactivate it, you visit a branch with ID and proof of address.',
    },
    'ca-bmo': {
      penaltyWords: 'For a non-cashable BMO GIC: “The Investment is not redeemable before the Maturity Date.” A cashable GIC, such as the Variable Rate GIC, can be cashed in whole or in part at any time, with no interest within 30 days of issue. The Cashable RateRiser GIC can be cashed in full at any time.',
      maturityWords: 'In a registered account it reinvests automatically into a BMO GIC with the same term and interest option, at the rate then. Otherwise it follows the instructions you gave when you bought it, and reinvests only if you asked it to. You can change those instructions only in writing, within 21 days before maturity.',
      dormancyWords: 'An account with a C$0 balance that you haven’t used for at least a year is closed. After 2 years without you using it, it’s dormant. BMO writes after 2 and 5 years, and if you don’t answer within 60 days it charges a Dormant Account Fee: C$20 at 2 years, C$30 at 5. If the account can’t cover the fee, it’s closed without notice. After 9 years it’s closed with a final notice, and in year 10 the balance goes to the Bank of Canada, with a C$40 fee.',
    },
    'ca-cibc': {
      penaltyWords: 'A non-redeemable GIC gives you your money “only at maturity”. A redeemable GIC cashed 30 days or more after issue pays its full interest to that day, and none within the first 29 days; CIBC’s rate page also says redeemable GICs cash out “at specified early redemption rates”.',
      maturityWords: 'It renews automatically into the same product and term, unless you change that with an advisor before maturity.',
      dormancyWords: 'An account is dormant after 24 months with no transactions of yours, and its monthly statements become quarterly. There’s a yearly fee of C$20 while it’s 2 to 4 years dormant, C$30 at 5 to 8 years and C$40 at 9, or the balance if that’s less, and none where every holder is 18 or younger. After 10 years the Canadian-dollar balance goes to the Bank of Canada.',
    },
    'mx-bbva': {
      penaltyWords: 'A Pagaré (PRLV) can’t be withdrawn early: the money stays invested until the term ends (“Durante el plazo que esté invertido tu dinero, no lo podrás retirar, hasta que venza dicho plazo”). BBVA cites the Ley de Instituciones de Crédito as the reason.',
      maturityWords: 'At maturity you choose to take the money out, or to reinvest the principal alone or with its returns. You can also set it to renew automatically, with or without its returns, or not at all.',
      dormancyWords: MX_DORMANT,
    },
    'mx-santander': {
      penaltyWords: 'On a Pagaré or inversión a plazo, the capital and interest are yours at maturity. A Mexican bank’s pagaré that pays its return at maturity usually can’t be cashed early, as BBVA and Banamex say. A guide from outside the bank says Santander “podría aplicar una penalización o ajuste en los intereses” (could apply a penalty or adjust the interest) on an early withdrawal; that couldn’t be checked against Santander’s own terms.',
      maturityWords: 'It follows the instruction you chose when you opened it (instrucción al vencimiento): renew the capital and interest, renew the capital and pay the interest into your checking account, or pay out both. A guide from outside the bank says it renews automatically at the rate then, unless you say otherwise.',
      dormancyWords: MX_DORMANT,
    },
    'mx-banamex': {
      penaltyWords: 'A Pagaré Banamex can’t be withdrawn before maturity: “la regulación aplicable no permite la cancelación anticipada” (the rules that apply don’t allow it to be canceled early).',
      maturityWords: 'It does what you chose when you opened it: reinvest the principal and returns automatically for a new term, or pay you back the money and its returns.',
      dormancyWords: MX_DORMANT,
    },
    'mx-banorte': {
      penaltyWords: 'A Pagaré Digital pays its capital and interest at maturity, and offers no early withdrawal. Banorte’s Inversión Plus, a deposit you can withdraw from on set days, lets you take out up to all of it early for a commission: 0.3% on 7-, 14- and 28-day terms, 0.5% on 91 days, and 1% on 182 and 364 days.',
      maturityWords: 'It follows the instruction you chose when you opened it: renew, or pay into your cuenta eje, your main account. The rate is fixed for the term; for new deposits it’s reset each week from the Cetes rate.',
      dormancyWords: MX_DORMANT,
    },
    'gb-barclays': {
      penaltyWords: 'A Fixed Rate Savings Bond allows no withdrawals and can’t be closed early, unless the bond’s own information says otherwise, and then “there may be a fee”. The only exceptions are exceptional circumstances, such as illness, a relationship ending or money trouble, or death or bankruptcy.',
      maturityWords: 'Barclays writes at least three weeks before maturity, offering a new bond (the same or a shorter term, with interest paid as often) or an instant access savings account. If you do nothing, the offer is taken up and the money moves on the first working day after maturity. To take the money instead, tell Barclays before the maturity date, and it’s paid into your Barclays account the next working day.',
      dormancyWords: 'Barclays may close an account you don’t use after trying to contact you: within 90 days of first getting in touch, if you don’t reply. The money goes to a central holding account and keeps earning the same interest. After 15 years or more unused, it may go to Reclaim Fund Ltd, and you can still claim it back.',
    },
    'gb-lloyds': {
      penaltyWords: 'An Online Fixed Bond allows no withdrawals. You can close it early only at a branch with a counter, for a charge of 90 days’ gross interest on the 1-year bond or 180 days’ on the 2-year bond, and you may get back less than you put in.',
      maturityWords: 'At the end of its 1- or 2-year term the account becomes a Standard Saver, with easy access and a variable rate, unless you choose another option. Lloyds contacts you beforehand.',
      dormancyWords: 'Money in an account unused for 15 years or more may go to Reclaim Fund Ltd under the unclaimed assets scheme, and you keep the right to claim it back.',
    },
    'gb-natwest': {
      penaltyWords: 'A Fixed Term Savings Account allows no withdrawals during the term. Closing it early takes 35 days’ notice and costs the interest earned or 90 days’ interest, whichever is lower, and you never get back less than you put in.',
      maturityWords: 'It reinvests automatically for a new fixed term unless you opt out, with the opt-out form at least 5 days before maturity. If you opt out, it becomes a Primary Saver on the maturity date.',
      dormancyWords: 'An account unused for 5 years or more counts as dormant. NatWest writes to give you 9 months to use it, and after that, 5 years and 9 months in all, it’s closed. You can still claim the money back.',
    },
    'gb-hsbc': {
      penaltyWords: 'You can close a Fixed Rate Saver early, but only the whole account, not part of it, for a fee of the interest earned or 90 days’ interest, whichever is lower.',
      maturityWords: 'The account closes, and the money and interest are paid into the HSBC account they came from, unless you arranged to reinvest them.',
      dormancyWords: 'An account unused for usually 2 years is inactive. HSBC freezes an inactive account with money in it, closes one with nothing in it, and may close one with £10 or less and give the balance to charity, which you can still claim back. After 15 years or more, the money may go to Reclaim Fund Ltd.',
    },
    'gb-santander': {
      penaltyWords: 'You can’t take money out of a Fixed Rate Bond during its term, or cancel it once it’s open. In exceptional circumstances, such as an account holder’s death, Santander may let it close early.',
      maturityWords: 'Choose what to do up to a month before the term ends. If Santander doesn’t hear from you, the account moves to a Fixed Rate Reward Bond.',
      dormancyWords: 'After a year with no transactions for a banking account, or 3 years for a savings account, Santander may treat it as dormant: no transactions, statements, letters or cards until you reactivate it, though it keeps earning interest. After 15 years, the money may go to Reclaim Fund Ltd.',
    },
    'gb-nationwide': {
      penaltyWords: 'A Fixed Rate Online Bond can be canceled within 14 days of opening. After that there’s no access at all until maturity, not even by paying an interest penalty.',
      maturityWords: 'It moves into an instant access maturity account, at a lower variable rate, that you can take money from at any time. You can give instructions up to 30 days before maturity, and reinvest, move or take out the money without a penalty afterwards.',
      dormancyWords: 'After 15 years in a row with no contact or transactions, Nationwide closes the account and moves the money to Reclaim Fund Ltd, with a letter first at 14 years and 10 months. You can always claim it back, with the interest it would have earned.',
    },
    'ie-aib': {
      penaltyWords: 'A Personal Fixed Term Deposit can’t be closed before maturity. Percentage Access lets you take out up to 25% once in each fixed term, as long as at least €5,000 stays in. Within 14 days of opening you can end it free, but you earn no interest.',
      maturityWords: 'It reinvests automatically for the same or a similar term at the rate then, unless you say otherwise; you can change that in the app until 6 p.m. on the business day before maturity.',
      dormancyWords: IE_DORMANT,
    },
    'ie-bank-of-ireland': {
      penaltyWords: 'You can’t close an Advantage Fixed Term Deposit before the end of its term, but you can take out up to 25% during it.',
      maturityWords: 'If you give no instructions, the whole balance goes into the Variable Rate Call account (0.10% AER, variable). Bank of Ireland contacts you before the term ends.',
      dormancyWords: IE_DORMANT,
    },
    'ie-ptsb': {
      penaltyWords: 'You can take your money out free within 14 days of opening. After that, an early withdrawal closes the account and costs the greater of two charges: 1% a year on the amount withdrawn for the days left in the term, or the market rate difference a year on that amount for those days, and at least €20. On Interest First accounts, interest already paid for the rest of the term is taken back too.',
      maturityWords: 'A fixed deposit opened at a branch moves into an Instant Access Account (0.01%, variable) unless you say otherwise. One opened online renews for a similar term at the rate then.',
      dormancyWords: 'Three years in a row with no transactions makes an account inactive, and PTSB may check your identity and address before you can use it. After 15 years with no transaction of yours it’s dormant, and if you don’t reactivate it by the next March 31, the money goes to the NTMA, where you can still claim it back.',
    },
    'is-landsbankinn': {
      penaltyWords: 'A Fastvaxtareikningur, a fixed-rate account for 3, 6, 12 or 24 months, holds the deposit and interest for the term. You can close it early, for a withdrawal fee (úttektargjald) of 2% of the amount taken out.',
      maturityWords: 'At the end of the term the account closes, and the balance and interest, less capital income tax, are paid into the Landsbankinn account it was funded from.',
      dormancyWords: 'Landsbankinn may close an account unused for 2 years or more, after writing to you. Any balance moves to another of your accounts, or to an account at the bank if you have none.',
    },
    'is-arion': {
      penaltyWords: 'Vöxtur - fastir vextir, a single deposit for 3, 6, 9 or 12 months, holds the rate and the deposit for the whole term. Arion’s terms mention no early withdrawal.',
      dormancyWords: 'If an account hasn’t been used for 2 years or more, Arion may close it. The balance goes to another of your accounts or, if you have none, to an interest-free holding account at the bank.',
    },
    'is-islandsbanki': {
      penaltyWords: 'A Fastvaxtareikningur, a single deposit of at least 100,000 kr for 1, 3, 6 or 12 months, can’t be withdrawn, changed or ended during its term. It charges no fees.',
      maturityWords: 'When the term ends, the balance goes to the account you chose when you opened it, and the Fastvaxtareikningur closes.',
      dormancyWords: 'Íslandsbanki may close an empty account left unused over 4 year-ends, without notice. No rule was found for an account with money in it.',
    },
    'fr-bnp-paribas': {
      penaltyWords: 'You can leave a dépôt à terme early only with all of it, on 32 days’ notice. The interest is recalculated for the exact days it ran, at the opening rate for that length of time, less the penalty in your Conditions Particulières (Moneyvox reports the opening rate minus 0.5 point), and never below 0%. Closed within the first 30 days, it earns no interest at all. There are no exit fees.',
      maturityWords: 'It closes automatically at maturity, and the capital and interest are paid into the checking account (compte chèque) you named when you opened it.',
      dormancyWords: 'Under the Loi Eckert, a checking account is inactive after 12 months unused, and savings after 5 years. Fees on it are capped. After 10 years with no transactions, the money goes to the Caisse des Dépôts and the account closes.',
    },
    'fr-societe-generale': {
      penaltyWords: 'You can take back a CAT Taux Fixe 7 à 24 mois early with 32 calendar days’ notice, with nothing paid before then. You get all the capital back, and the interest due is cut by 90% if less than a third of the term has run, 60% between a third and two thirds, and 30% after two thirds. There are also fixed break fees, set in the lettre de blocage, of no more than the interest actually paid. Taking the money out closes the CAT.',
      maturityWords: 'A CAT Taux Fixe closes automatically at maturity, and pays the capital and interest in one go into your checking account.',
      dormancyWords: 'Under the Loi Eckert, 12 months with no transaction or contact from you makes a checking account inactive. There’s a fee for each 12 months it stays inactive, and after 10 years the money goes to the Caisse des Dépôts. Société Générale doesn’t charge the fee on savings accounts (livrets).',
    },
    'fr-lcl': {
      penaltyWords: 'From a Compte à Terme Optilion Stratégique Plus you can take out part or all of it early on 31 days’ notice, paid on day 32, and the agreed rate is cut on the amount taken out, by an amount LCL doesn’t publish. A Compte à Terme Fidélité pays no interest if you take it out in the first month. A Compte à Terme Libre, which rolls over each month, loses the month’s interest if you close it partway through.',
      maturityWords: 'Optilion doesn’t renew: at maturity the capital and all its interest go automatically to the checking account it’s linked to. A CAT Libre renews each month.',
      dormancyWords: 'Under the Loi Eckert, a checking account is inactive after 12 months. There’s a yearly fee, never more than what’s in the account, and after 10 years the money goes to the Caisse des Dépôts.',
    },
    'fr-credit-agricole': {
      penaltyWords: 'Each caisse régionale sets it, in the contract. Leaving early is usually possible. Sources outside the bank say the rate is cut by 0.50 to 1 point, and some contracts drop all the interest; no figure published by Crédit Agricole could be found.',
      dormancyWords: 'Under the Loi Eckert, an account with no transactions except the bank’s own is inactive. A yearly fee is taken from each inactive account, at most €30 and never more than what’s in it. After 10 years the money goes to the Caisse des Dépôts.',
    },
    'fr-la-banque-postale': {
      penaltyWords: 'You can take out part or all of a compte à terme taux fixe early at any time. Within the first month it earns no interest; after that, a reduced rate (taux minoré) for the exact days it ran, from the withdrawal rates set out in the offer.',
      maturityWords: 'The capital and interest are paid at maturity, or it renews automatically if you chose that when you opened it.',
      dormancyWords: 'Under the Loi Eckert, an account with no movement for more than 12 months is charged the “Tenue de compte sans mouvement ou inactif” fee, except a minor’s account. The fees on an inactive account are capped at €30, and after 10 years the money goes to the Caisse des Dépôts.',
    },
    'de-deutsche-bank': {
      penaltyWords: 'FestzinsSparen, a Spareinlage, allows no withdrawals while the rate is fixed. Only in an emergency (unemployment, illness, insolvency or death) may the bank agree to release it early, and then it charges Vorschusszinsen, a penalty interest, up to the end of the fixed-rate period and at least until the notice period would have run out, as its Bedingungen für Sparkonten and its notice “Zinssätze für Geldanlagen” set out.',
      maturityWords: 'It renews automatically for the same term at the rate then, at present for 1 year at most unless you ask otherwise. To be paid out, give at least 3 months’ notice before the end, with a transfer order.',
      dormancyWords: DE_DORMANT,
    },
    'de-commerzbank': {
      penaltyWords: 'A Festgeld gives you no access during the term, not even to part of it.',
      maturityWords: 'When you open it, you choose whether it renews automatically on the same terms or pays out. A payout goes to its linked account (Verrechnungskonto).',
      dormancyWords: DE_DORMANT,
    },
    'de-postbank': {
      penaltyWords: 'Zinssparen, Postbank’s fixed-rate deposit (a Spareinlage), can’t be reached early: you can take money out only at the end of the fixed-rate period, after at least 3 months’ notice. If the bank agrees, as an exception, to pay it back early, it takes off Vorschusszinsen, a penalty interest, as its notice “Zinssätze für Geldanlagen” sets out.',
      maturityWords: 'It keeps running for the same term at the rate then, until you give notice at least 3 months before the end, with a transfer order.',
      dormancyWords: DE_DORMANT,
    },
    'de-ing': {
      penaltyWords: 'You can’t reach the money in a Festgeld during its term, or end it early.',
      maturityWords: 'It renews automatically for the same term at the rate then, with its capital and interest, and ING tells you 14 days before the term ends. Choose Auszahlen in online banking to stop it renewing, and the capital and interest go to the linked account (your Girokonto or Extra-Konto) when the term ends.',
      dormancyWords: DE_DORMANT,
    },
    'de-berliner-sparkasse': {
      penaltyWords: 'The S-Festgeld product page offers no way out early. For savings deposits (Spareinlagen, a Sparkassenbuch), the bank may agree, as an exception, to pay back early, and charges Vorschusszinsen of a quarter of the account’s interest rate until the notice period would have run out, for at most 900 days.',
      maturityWords: 'S-Festgeld renews automatically for the same term at the rate then. To get the money instead, tell your adviser (Kundenbetreuer) at least 5 working days before the term ends.',
      dormancyWords: DE_DORMANT,
    },
    'es-santander': {
      penaltyWords: 'Ending a Depósito Santander (6 or 12 months, at least €15,000, for customers with other products at the bank) early carries a 1% penalty, by a press report from outside the bank, which doesn’t say how the 1% is applied. Under the Banco de España’s rule, any fee or penalty for ending early has to be in the contract and can’t be more than the gross interest earned to that day, so you never lose capital.',
      dormancyWords: ES_DORMANT,
    },
    'es-bbva': {
      penaltyWords: 'BBVA’s pre-contract terms for the Depósito Combinado 30F/70D let you end it early. In its first term, the amount you take out earns only 0.01% a year from opening, instead of the agreed rate. In a renewal, the penalty is 4.00% a year on that amount for the days left to maturity, never more than the interest earned. Kelisto, from outside the bank, reports that BBVA’s plain term deposit charges 2.75% a year on the amount for the rest of the term, never more than the interest earned.',
      maturityWords: 'It’s paid out at maturity and doesn’t renew by itself (“Renovación tácita ... NO”). The capital and interest go into the linked account.',
      dormancyWords: ES_DORMANT,
    },
    'es-caixabank': {
      penaltyWords: 'You can take out all or part of a Depósito Bonificado (1 year, at least €5,000) early at any time. Take it all out and no interest is paid, neither the minimum nor the conditional interest. Take out part, and the rest keeps earning to maturity. There’s no fee on top.',
      maturityWords: 'It’s paid out at maturity into the linked checking account, and it’s “No prorrogable”: it can’t be renewed.',
      dormancyWords: ES_DORMANT,
    },
    'es-sabadell': {
      penaltyWords: 'You can end all or part of a Depósito Online early with at least 35 days’ notice, during which you can’t reach the amount. The penalty is 1% a year on that amount from the day you end it to the agreed maturity, never more than the gross interest earned from the start. You can withdraw free within 14 days of opening.',
      maturityWords: 'It renews automatically for the same amount and term at the rate then, unless you ask before maturity for it not to, and then the capital and interest go into the linked account.',
      dormancyWords: ES_DORMANT,
    },
    'es-bankinter': {
      penaltyWords: 'You can end all or part of a deposit early. Bankinter’s penalty is a lower rate, as the contract sets, and it never touches your capital; interest already paid above the lower rate is taken back from what you’re repaid. On its current US dollar deposits, by a source outside the bank, the rate falls to 0.50% TIN if you end early. On an older product (2013, from Bankinter’s own blog), the amount ended early earned 1.25% in the first year, 1.75% in the second and 1.99% after.',
      maturityWords: 'It can renew automatically for the same term at the rate on the business day before maturity. To stop it renewing, or to set it to, tell Bankinter at least 3 business days before maturity.',
      dormancyWords: ES_DORMANT,
    },
    'jp-mufg': {
      penaltyWords: 'A スーパー定期 (自動継続型), MUFG’s automatically renewing time deposit, can’t be ended before maturity unless the bank agrees it’s unavoidable (やむを得ない). Ended early, it earns a lower rate by how long it ran: under 6 months, the ordinary savings rate on the day you end it; 6 months to a year, 70% of the 6-month rate shown when you deposited; 1 to 2 years, 70% of the 1-year rate; 2 to 3 years, 70% of the 2-year rate; and so on, to 70% of the 9-year rate for 9 to 10 years. Each band uses the rate for the time it actually ran, not the term you chose, and it’s never below the ordinary savings rate. Interest already paid above that is taken from the principal.',
      maturityWords: 'It renews automatically (自動継続) for the same term at the rate on the renewal date. To stop it, tell the bank by the maturity date, and it’s paid out at maturity into the account you named.',
      dormancyWords: `MUFG’s unused-account fee (未利用口座管理手数料): an ordinary savings account (普通預金) opened on or after July 1, 2021, with no deposit or withdrawal for 2 years, not counting interest or the fee, gets a notice. If it’s still unused about 3 months later, ¥1,320 a year is taken. If the balance is less than the fee, the whole balance is taken and the account closed. Accounts opened by June 30, 2021, and holders with other savings, investments or loans at the bank, are exempt. ${JP_DORMANT}`,
    },
    'jp-smbc': {
      penaltyWords: 'A スーパー定期 (自動継続), SMBC’s automatically renewing time deposit, can’t be ended before maturity unless the bank agrees it’s unavoidable. Ended early, it earns a lower rate, set by its term and how long it ran, as a share of the agreed rate. For a term of 1 month to under 3 years: under 6 months, the ordinary savings rate; 6 months to a year, 50%; 1 to 3 years, 70%. For a 3-year term: under 6 months, the ordinary rate; then 40% (6 months to a year), 50% (1 to 1½ years), 60% (1½ to 2), 70% (2 to 2½) and 90% (2½ to 3). Over 3 to 4 years: 10% (6 months to a year), 20% (1 to 1½), 30% (1½ to 2), 40% (2 to 3) and 70% (3 to 4). Over 4 to 5 years: 10% (6 months to a year), 20% (1 to 2), 30% (2 to 3), 50% (3 to 4) and 70% (4 to 5). Over 5 to 7 years: as for 5 years, then 80% (5 to 6) and 90% (6 to 7). It’s never below the ordinary savings rate, and interest already paid is settled against it.',
      maturityWords: 'It renews automatically for the same term at the bank’s rate on the renewal date. To stop it, tell the bank by the maturity date, and it’s paid into the account you named at maturity.',
      dormancyWords: `SMBC’s digital unused-account fee (デジタル未利用手数料, from April 1, 2024): an ordinary savings account (普通預金) with no deposit, transfer or withdrawal for 2 years or more gets a letter. If it’s still unused about 3 months later, ¥1,100 a year is taken, each later year without another notice. If the balance is less than the fee, the balance is taken and the account closed. You’re exempt if the account was opened by March 31, 2021, holds ¥10,000 or more, or is set up for digital banking (Web通帳 with a one-time password or SMBC Safety Pass); if you’re under 18 or 75 or over; or if you have other term or investment accounts at the branch, or a loan. ${JP_DORMANT}`,
    },
    'jp-mizuho': {
      penaltyWords: 'Ended before maturity, a みずほスーパー定期 earns an early rate set by its term and how long it ran, as a share of the agreed rate, and it can be 0%. For a term of 1 month to under 3 years: under 6 months, the ordinary savings rate; 6 months to a year, 50%; 1 to 3 years, 70%. For a 3-year term: 20% (6 months to 2 years), 40% (2 to 2½) and 60% (2½ to 3). Over 3 to 4 years: 20% (6 months to 2 years), 40% (2 to 2½) and 60% (2½ to 4). Over 4 to 5 years: 10% (6 months to 2 years), 20% (2 to 3), 40% (3 to 4) and 70% (4 to 5). Over 5 years: the ordinary savings rate for the first year; the rest of that table wasn’t read. You pay back any interest already paid above the early rate.',
      maturityWords: 'On fixed-term types, it renews automatically (自動継続) if you chose that when you deposited; otherwise it’s paid out. After maturity it earns the ordinary savings rate.',
      dormancyWords: `No unused-account fee was found for Mizuho. A passbook account whose passbook hasn’t been updated (記帳) for its deposit term plus a year, as of each January 31, is switched automatically to a みずほe-口座, with no paper passbook. A paper passbook on an account opened from January 18, 2021, costs ¥1,100 a book. ${JP_DORMANT}`,
    },
    'jp-resona': {
      penaltyWords: 'Ended before maturity, a りそなスーパー定期 earns an early rate set by its term and how long it ran, as a share of the agreed rate. For a term of 1 month to under 3 years: under 6 months, the ordinary savings rate; 6 months to a year, 50%; 1 to 3 years, 70%. For a 3-year term: 40% (6 months to a year), 50% (1 to 1½ years), 60% (1½ to 2), 70% (2 to 2½) and 90% (2½ to 3). Over 3 to 4 years: 10% (6 months to a year), 20% (1 to 1½), 30% (1½ to 2), 40% (2 to 3) and 60% (3 to 4). Over 4 to 5 years: 10% (6 months to a year), 20% (1 to 2), 30% (2 to 3), 50% (3 to 4) and 70% (4 to 5). Interest already paid above the early rate is taken from the principal.',
      maturityWords: 'On fixed-term types, it renews automatically for the same term, either with the interest added to the principal (元加継続) or with the interest paid out and the principal renewed (利払継続). After maturity it earns the ordinary savings rate.',
      dormancyWords: `Resona’s unused-account fee (未利用口座管理手数料): an ordinary savings account (普通預金) opened on or after April 1, 2004, with no deposit or withdrawal for 2 years or more and under ¥10,000 in it, among other conditions, gets a notice. Use or close the account within about 3 months to avoid the fee; otherwise it’s ¥1,320 a year. A passbook account opened from January 16, 2023, may pay a passbook fee of ¥550 a year. ${JP_DORMANT}`,
    },
    'jp-japan-post-bank': {
      penaltyWords: 'Take a 定期貯金 (time deposit) out before its term ends, and it earns the early-withdrawal rate (預入期間内払戻利率), never below the ordinary savings (通常貯金) rate when you deposited: under 6 months, that ordinary rate; 6 months to a year, 60% of the 6-month time deposit rate when you deposited; 1 to 2 years, 60% of the 1-year rate; 2 to 3 years, 60% of the 2-year rate; and so on, to 60% of the 9-year rate for 9 to 10 years. Each band uses the rate for the time it actually ran.',
      maturityWords: 'You choose when you deposit: renew the principal and interest for the same term (継続預入), renew the principal and move the interest to ordinary savings (再預入), or move it all to ordinary savings (通常貯金, 満期振替預入). A time deposit held as security (担保定期貯金) moves to ordinary savings unless you choose otherwise. Renewals are capped (a 1-year deposit, 9 times over 10 years), and a 10-year deposit can’t renew. After maturity it earns about the ordinary savings rate.',
      dormancyWords: 'After 10 years or more with no activity, and a notice on the bank’s website, the balance may go to the Deposit Insurance Corporation as a dormant deposit (休眠貯金). Cash machines and ゆうちょダイレクト stop working for it, but you can still take it out or use it again at a counter. Postal savings (定額, 定期 or 積立郵便貯金) deposited before October 1, 2007, are lost if not claimed 20 years and 2 months after maturity, under the old Postal Savings Act.',
    },
    'kr-kb-kookmin': {
      penaltyWords: 'Ended early, a KB Star 정기예금 earns a lower rate, not a penalty in days of interest: under 1 month, 0.1% a year; from 1 to 3 months, half the base rate times the months it ran over the months agreed, at least 0.3%; 3 to 6 months, 50% (at least 0.5%); 6 to 8 months, 60%; 8 to 10 months, 70%; 10 to 11 months, 80%; 11 months or more, 90%, each at least 0.5%. The base rate leaves out preferential rates.',
      maturityWords: 'When you open it, you pick one: close automatically, with the principal and interest paid to the linked account; renew the principal only, with the interest paid out; or renew both, at the rate posted on the renewal day, for up to 10 years in all. Left open after maturity, it earns the post-maturity rate (만기후이율): half the base rate within a month, 30% of it from 1 to 3 months, and 0.1% after 3 months.',
      dormancyWords: KR_DORMANT,
    },
    'kr-shinhan': {
      penaltyWords: 'Ended early, a 쏠편한 정기예금 earns a lower rate: under 1 month, 0.10% a year; from 1 month, a share of the base rate times the months it ran over the months agreed, at least 0.10%. The share, by how long it ran: 20% from 1 to 3 months, 30% from 3 to 6, 70% from 6 to 9, 80% from 9 to 11, and 90% from 11 months on.',
      maturityWords: 'You can have it renew automatically (자동재예치), the principal or the principal and interest, at the base rate posted on the renewal day, for up to 10 years in all, or close automatically into the linked account. You can also extend its maturity once, by up to 3 months, at the original rate. Otherwise, after maturity it earns the post-maturity rate (만기후이자율): half the posted rate for an ordinary time deposit (일반정기예금) of that term within a month, a quarter of it from 1 to 6 months, each at least 0.10%, and 0.10% after 6 months.',
      dormancyWords: KR_DORMANT,
    },
    'kr-hana': {
      penaltyWords: 'Ended early, a Hana 정기예금 earns a lower rate: 0.10% a year under 1 month, 0.15% from 1 to 3 months and 0.20% from 3 to 6 months. From 6 months, it’s a share of the base rate times the days it ran over the days agreed, at least 0.20%: 60% from 6 to 9 months, 70% from 9 to 11, and 90% from 11 months on. The rate is cut to 3 decimal places.',
      maturityWords: 'A 하나의 정기예금 can renew automatically at maturity (만기자동재예치) if you ask by the day before: the principal, or the principal and interest after tax, for the same term at the rate posted on the renewal day. Otherwise it stays in at the post-maturity rate: half the posted base rate for an ordinary monthly-interest time deposit (일반정기예금 월이자지급식) within a month, and a quarter of it after that.',
      dormancyWords: KR_DORMANT,
    },
    'kr-nh': {
      penaltyWords: 'Ended early, an NH올원e예금 earns the early rates of the 큰만족실세예금: 0.1% a year under 3 months, then a share of the base rate times the months it ran over the months agreed: 50% from 3 to 6 months, 60% from 6 to 9, 70% from 9 to 11, and 80% from 11 months on. It’s at least 0.1%, cut to 3 decimal places, and part-months don’t count.',
      maturityWords: 'It doesn’t renew (재예치 불가), but you can have it close automatically at maturity (자동 만기해지 서비스). Left open, it earns the post-maturity rate (만기후이자율): 50% of the 큰만족실세예금 base rate for its term within 3 months, 20% from 3 to 6 months, and 10% after 6 months.',
      dormancyWords: KR_DORMANT,
    },
    'kr-kakaobank': {
      penaltyWords: 'Ended early, a 카카오뱅크 정기예금 earns a share of its base rate at opening, times the days it ran over the days agreed: 10% under 1 month (at least 0.10%), 30% from 1 to 3 months (at least 0.30%), then 50% from 3 to 6 months, 70% from 6 to 9, 80% from 9 to 11 and 90% from 11 months on, each at least 0.50%.',
      maturityWords: 'You choose: close automatically; renew automatically, with the principal and interest after tax put back for the same term at the posted rate, up to 5 times (not for a 비과세종합저축 or an account under a legal hold); or close it yourself. Left open, it earns the post-maturity rate (만기후금리): half the base rate within a month, 30% of it from 1 to 3 months, and 0.20% after 3 months.',
      dormancyWords: KR_DORMANT,
    },
    'au-commbank': {
      penaltyWords: 'Breaking it early takes 31 days’ notice, and the agreed rate is then cut by how much of the term has run: by 90% if less than 20% has, 80% from 20% to under 40%, 60% from 40% to under 60%, 40% from 60% to under 80%, and 20% from 80% on. There’s also an A$30 prepayment administration fee. You never get back less than the principal, before the A$30 fee.',
      maturityWords: 'CommBank sends a Renewal Notice before maturity. If you give no instructions by then, the money goes to its at-call holding facility, at a lower variable rate with interest paid every 7 days; it isn’t renewed automatically. A 7-day term goes to the holding facility by itself.',
      dormancyWords: 'CommBank may close an account with under A$10 in it that hasn’t been used for at least 3 months. After 7 years with no deposit or withdrawal, and no request to keep it open, a balance over a set amount goes to the Commonwealth’s unclaimed money fund, where you can claim it back and it may earn interest; a smaller balance earns no interest. A debit card or Keycard may be canceled if it’s unused for 6 months. The monthly fee on Passbook Savings and Savings Investment accounts isn’t charged while the account is inactive.',
    },
    'au-westpac': {
      penaltyWords: 'Breaking it early takes 31 days’ notice, unless you’re in hardship. Closed within 7 days of the term starting, it earns no interest. Otherwise the account’s rate is cut by how much of the term has run: by 90% if less than 20% has, 80% from 20% to under 40%, 60% from 40% to under 60%, 40% from 60% to under 80%, and 20% from 80% on. There’s no cut on death or hardship. Interest already paid may be taken back.',
      maturityWords: 'It renews automatically on the same conditions as the last term, at the rate in the Maturity Advice, unless you give other instructions; a special rate may roll over to a lower one. From maturity you have a 6-business-day Variation Period to change it once, and the On Demand rate applies until it’s renewed or closed.',
      dormancyWords: 'An account is inactive after 6 months in a row with no deposits or withdrawals, if it’s also empty or overdrawn, and Westpac may then close it without notice. After 7 years with no deposit or withdrawal, Westpac may close the account and send the money to the government as unclaimed money, where the law requires, usually with notice. Bump Savings is exempt until its holder turns 18.',
    },
    'au-nab': {
      penaltyWords: 'Breaking it early takes 31 calendar days’ notice, which may be waived for hardship. The interest is cut by how much of the term is still to run: you keep 80% of the interest earned if less than 20% remains, 60% from 20% to under 40%, 40% from 40% to under 60%, 20% from 60% to under 80%, and 10% from 80% on. Interest already paid is counted and taken off the payout, but you never get back less than you put in.',
      maturityWords: 'If you give no instructions, NAB may reinvest it for the same term at the rate on the maturity day, though it doesn’t have to, and a deposit under A$5,000 may be paid back instead. You can change the term, the amount or how often interest is paid up to 7 calendar days after the new term starts.',
      dormancyWords: 'NAB may close an empty account without notice, and may cancel a debit card unused for at least two years. When an account with money in it closes, the money may have to go to the government as unclaimed money; the Commonwealth’s rule, as ASIC gives it, is 7 years without a deposit or withdrawal.',
    },
    'au-anz': {
      penaltyWords: 'An ANZ Advance Notice Term Deposit needs 31 days’ notice to break, or less in hardship. Any early withdrawal, except after an account holder’s death, costs an A$30 administration fee, and the interest on the amount taken out is cut by how much of the original term has run: by 90% if less than 20% has, 80% from 20% to under 40%, 60% from 40% to under 60%, 40% from 60% to under 80%, and 20% from 80% on.',
      maturityWords: 'With no instructions and A$5,000 or more in it, it reinvests automatically into a new ANZ term deposit with the same term and interest frequency; ANZ may stop doing so after 3 years without instructions. Under A$5,000, it may be paid out. You have 7 days after maturity to change your reinvestment instructions without it counting as an early withdrawal.',
      dormancyWords: 'If you haven’t used the account for 7 years and it holds more than A$0 but under A$500, ANZ may close it. If it holds over A$500 after 7 years unused, the law may require ANZ to send it to the government as unclaimed money, which you can claim back at any time.',
    },
    'nz-anz': {
      penaltyWords: 'You can withdraw early only with 31 days’ notice or in hardship, and outside the 7-day cooling-off period ANZ doesn’t have to agree. If it does, the rate on the amount taken out is cut by the early withdrawal rate reduction, now 1% a year, and the return can’t go below 0%: the amount withdrawn times the reduction rate, divided by 365, times the days it was invested. There’s no break fee.',
      maturityWords: 'It reinvests automatically for a similar term at the rate then, unless you say otherwise. Each reinvestment starts a new 7-calendar-day cooling-off period, in which you can cancel or change the term or amount; canceling gives up the interest for that period.',
      dormancyWords: 'ANZ can close an empty account that’s been inactive for at least a year. Under the Unclaimed Money Act 1971, if none of your accounts has had a transaction for 5 years, you’ve had no other contact and ANZ can’t reach you, a balance over NZ$100 goes to Inland Revenue, where you can claim it back, and NZ$100 or less goes to charity. For a term deposit, the 5 years count from the end of its first term.',
    },
    'nz-asb': {
      penaltyWords: 'ASB agrees to an early withdrawal only on 31 days’ notice, or in an approved “exceptional circumstance”, when the money is released the same day. In the first 5 calendar days you need neither. The amount taken out earns the rate that applied, when the deposit was opened or reinvested, for the term it actually ran, less 2% a year, with a minimum (0.05% a year in ASB’s example). Interest already paid above that comes out of the principal.',
      maturityWords: 'It’s reinvested or paid out as you’ve told ASB. A deposit of 30 days or longer has a 5-calendar-day grace period, counting the day it’s opened or reinvested, to change your instructions or close it; one under 30 days has 1 day.',
    },
    'nz-bnz': {
      penaltyWords: 'From 7 days after opening, an early withdrawal needs 31 days’ notice or approved financial hardship, and is then paid the next business day. The rate is cut by how much of the term is still to run: you get 80% of it if less than 20% remains, 60% from 20% to under 40%, 40% from 40% to under 60%, 20% from 60% to under 80%, and 10% from 80% on. The cut can leave no interest, and interest already paid can be taken back.',
      maturityWords: 'It does what you told BNZ at setup: pay into an account you named, reinvest for another term, or repay another way you agreed. You can change that as often as you like up to the business day before maturity. No grace period after maturity was found.',
      dormancyWords: 'If you haven’t touched an account for 5 years, haven’t dealt with BNZ in any other way and can’t be reached, BNZ closes it and pays the money to Inland Revenue (Unclaimed Money Act 1971). A balance of NZ$100 or less goes to charity. For a term deposit, the 5 years count from the end of its first term. BNZ warns you first, by letter, email, text or phone.',
    },
    'nz-westpac': {
      penaltyWords: 'After the 7-working-day cooling-off period, Westpac may agree to an early withdrawal only on 32 days’ notice or for hardship, and doesn’t have to agree even with notice. The amount taken out then earns the lower of the agreed rate less 2%, or the rate offered at opening for a term as long as the time it was actually invested, less 2%, and never below 0%. There’s no cut if you take out no more than 20%, once, from a term of a year or more, keep the minimum balance and make no other early withdrawal. Hardship is worked out differently. There are no fees.',
      maturityWords: 'When you open it, you choose to have it paid into a New Zealand bank account at maturity, or reinvested. You can give instructions within the 15 working days before the term ends. Reinvesting starts a new 7-working-day cooling-off period.',
      dormancyWords: 'Under the Unclaimed Money Act, Westpac pays the money to Inland Revenue if you haven’t touched the account for 5 years (for a term deposit, 5 years after its first term ended), haven’t dealt with Westpac in any other way and can’t be reached. It writes to warn you first if it has a valid address.',
    },
    'nz-kiwibank': {
      penaltyWords: 'To break it, you apply, and Kiwibank has to agree. In the first 30 days you get your principal back with no interest. After 30 days, an early termination charge cuts the rate on the amount taken out to the lower of the advertised rates, on the day it’s approved or on the opening day, for the term nearest the time it was actually invested, less 2 percentage points, and never below 0%. No notice period is stated.',
      maturityWords: 'It follows your instructions: reinvest the principal and interest automatically for the same term at the rate on the maturity day, or pay it all into an account you choose. After a reinvestment you have up to 5 business days to make changes.',
      dormancyWords: 'Kiwibank’s own page couldn’t be read. The Unclaimed Money Act 1971 applies to every New Zealand bank: as ANZ, BNZ, ASB and Westpac NZ describe it, after 5 years with no transactions and no contact the money goes to Inland Revenue, and a balance of NZ$100 or less may go to charity.',
    },
  },
  UNCLAIMED: {
    CA: {
      to: 'the Bank of Canada’s Unclaimed Properties Office',
      claimBack: 'That’s the rule for federally regulated banks. You can claim it back from the Bank of Canada, which holds a balance under C$1,000 for 30 years and one of C$1,000 or more for 100 years.',
    },
    MX: {
      to: 'the Beneficencia Pública',
      claimBack: 'After 3 years without movement it first went to the bank’s cuenta global, with 90 days’ written notice, where it could still be claimed with your contract and official ID. After 3 more years there, an amount up to 300 days of the minimum wage goes to the Beneficencia Pública, and can’t be claimed back.',
    },
    GB: {
      to: 'the Reclaim Fund',
      claimBack: 'Under the UK Dormant Assets Scheme, a bank chooses whether to send it. You can claim it back at any time, through the bank or building society you had it with.',
    },
    IE: {
      to: 'the Dormant Accounts Fund',
      claimBack: 'An account becomes dormant on September 30 after 15 years with no transaction, and its money moves after the following March 31. You can always claim it back, with interest, with a Dormant Account Claim Form sent to the bank.',
    },
    IS: {
      to: 'the bank',
      claimBack: 'Iceland has no state scheme for unclaimed money: your claim on a deposit lapses 20 years after its last deposit or withdrawal, and only if the bank has warned you in a way it can prove. You can claim it until then; after that, the claim is gone.',
    },
    FR: {
      to: 'the Caisse des Dépôts',
      claimBack: 'It goes there after 10 years without activity, or 3 years after the holder’s death, and you can find it on Ciclade. The Caisse des Dépôts holds it for 20 years (27 after a death), and you can claim it back through Ciclade until it passes to the State.',
    },
    ES: {
      to: 'the State',
      claimBack: 'Under article 18 of Ley 33/2003, money in an account where you’ve done nothing to show it’s yours for 20 years passes to the Administración General del Estado, and funds education and accessibility programs for people with disabilities. No way to claim it back was found: the law makes it the State’s.',
    },
    JP: {
      to: 'the Deposit Insurance Corporation of Japan (預金保険機構)',
      claimBack: 'That’s for deposits with no transactions for 10 years or more, since January 1, 2009. You can claim it back at your bank, with no time limit: “期限はありません。いつでも引き出すことができます” (there’s no deadline, and you can withdraw it at any time).',
    },
    KR: {
      to: 'the Korea Inclusive Finance Agency (서민금융진흥원)',
      claimBack: 'It goes there once your claim lapses, 5 years after the last transaction, such as the last interest payment. You can still claim it back, and no deadline is stated; online, up to ₩20 million an item, paid the same day.',
    },
    AU: {
      to: 'ASIC',
      claimBack: 'ASIC holds it as Commonwealth unclaimed money. That’s the rule for a bank account with no deposit or withdrawal for 7 years and A$500 or more in it. You can claim it back through Moneysmart, free.',
    },
    NZ: {
      to: 'Inland Revenue',
      claimBack: 'Inland Revenue holds it as unclaimed money: it goes there after 5 years with no contact, or less in a few cases. You can claim it back within 20 years; after that, no claim can be made.',
    },
  },
};

// Each source line's last part is the day it was read (every one, September 26, 2026, the day the research read the
// banks' and the laws' pages), and a bare day after a web address read as the page's own date. The glossary's form says
// which it is: "read September 26, 2026". The US's isn't shown (`unclaimedLaw` replaces it).
for (const [name, entries] of Object.entries(readDaysFor('src/engine/content/accountlife.ts', { ACCOUNT_LIFE: [], UNCLAIMED: ['US'] }))) {
  for (const [key, fields] of Object.entries(entries)) edits[name][key] = { ...edits[name][key], ...fields };
}

export default edits;
