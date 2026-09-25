/**
 * SLATE — the banks of the thirteen countries SLATE pays and taxes a life in.
 *
 * From research on 2026-09-25, each figure from the bank's own price list,
 * product page or rate table where it could be read, and from the official
 * body otherwise: the central bank for its rate, the deposit guarantee for
 * its limit, the tax authority for what a bank takes off interest. Where a
 * figure couldn't be found it is left out rather than guessed: a bank with
 * no published savings rate pays none here, and the screen says there's no
 * rate on record.
 *
 * Money is in each currency's hundredths. A fee a bank charges by the
 * quarter or the year is its monthly share, and the source line says so.
 *
 * What wasn't modeled, and is said in the source line where it touches a
 * figure: fees per transaction or per passbook, a savings account's ceiling
 * (France's Livret A holds up to €22,950), the second year of an
 * introductory rate, and personal loans and fixed-term deposits, which no
 * screen offers yet.
 */

import type { CountryBanking, Product } from './banks';

const AS_OF = '2026-09-25';
const p = (name: string, source: string, extra: Partial<Product> = {}): Product => ({ name, source, asOf: AS_OF, ...extra });
const NOT_FOUND = 'no published rate found';

export const THIRTEEN: readonly CountryBanking[] = [
  // --- United States ----------------------------------------------------------
  {
    iso: 'US',
    guarantee: { scheme: 'FDIC', limit: 250_000_00, currency: 'USD', source: 'fdic.gov, per depositor, per bank, per ownership category' },
    policy: { called: 'federal funds target (upper bound)', rate: 0.04, since: '2026-09-16', source: 'federalreserve.gov, 3.75%–4.00%' },
    interestTax: { rate: 0, note: 'The bank withholds no tax; interest is reported on a 1099-INT and taxed on the return.', source: 'irs.gov backup withholding' },
    howMoneyMoves: 'Pay arrives by direct deposit over ACH; bills go by autopay or online bill pay, and people pay each other by Zelle.',
    banks: [
      {
        id: 'us-chase', name: 'Chase', iso: 'US', currency: 'USD', format: 'us', code: '021000021',
        current: p('Chase Total Checking', 'chase.com Total Checking: $15 a month, waived with $500 of electronic deposits or a $1,500 daily balance', { monthlyFee: 15_00, waiver: { depositsAtLeast: 500_00, balanceAtLeast: 1_500_00 } }),
        savings: p('Chase Savings', 'chase.com: $5 a month, waived with a $300 balance; 0.01% APY', { rate: 0.0001, monthlyFee: 5_00, waiver: { balanceAtLeast: 300_00 } }),
        overdraft: 'Chase charges $34 an item, at most three a day, and nothing when the account is overdrawn by $50 or less.',
      },
      {
        id: 'us-bank-of-america', name: 'Bank of America', iso: 'US', currency: 'USD', format: 'us', code: '026009593',
        current: p('Advantage Plus Banking', 'NerdWallet review of Bank of America: $12 a month, waived with a $250 direct deposit or a $1,500 daily balance', { monthlyFee: 12_00, waiver: { depositsAtLeast: 250_00, balanceAtLeast: 1_500_00 } }),
        savings: p('Advantage Savings', 'NerdWallet review of Bank of America: 0.01%', { rate: 0.0001 }),
        overdraft: 'Bank of America charges $10 an overdraft item.',
      },
      {
        id: 'us-wells-fargo', name: 'Wells Fargo', iso: 'US', currency: 'USD', format: 'us', code: '121000248',
        current: p('Everyday Checking', 'wellsfargo.com: $15 a month, waived with $500 of electronic deposits, a $1,500 daily balance, or ages 17 to 24', { monthlyFee: 15_00, waiver: { depositsAtLeast: 500_00, balanceAtLeast: 1_500_00, ageBelow: 25 } }),
        savings: p('Way2Save Savings', 'wellsfargo.com: 0.01% APY', { rate: 0.0001 }),
        overdraft: 'Wells Fargo charges $35 an item, at most three a day, and none for $10 or less; there are no returned-item fees.',
      },
      {
        id: 'us-citi', name: 'Citi', iso: 'US', currency: 'USD', format: 'us', code: '021000089',
        current: p('Citi Access Checking', 'citi.com: $5 a month, waived with $250 of direct deposits, or for owners 23 and under', { monthlyFee: 5_00, waiver: { depositsAtLeast: 250_00, ageBelow: 24 } }),
        savings: p('Citi Savings', `citi.com: $4.50 a month, waived with a $500 average balance (kept here as $500 all month); ${NOT_FOUND}`, { monthlyFee: 4_50, waiver: { balanceAtLeast: 500_00 } }),
        overdraft: 'Citi charges no overdraft or returned-item fees.',
      },
      {
        id: 'us-capital-one', name: 'Capital One', iso: 'US', currency: 'USD', format: 'us', code: '031176110',
        current: p('360 Checking', 'capitalone.com: no monthly fee'),
        savings: p('360 Performance Savings', '3.00% APY variable, as a rate aggregator had it on 2026-09-24', { rate: 0.03 }),
        overdraft: 'Capital One charges no overdraft fees.',
      },
    ],
  },
  // --- Canada -----------------------------------------------------------------
  {
    iso: 'CA',
    guarantee: { scheme: 'Canada Deposit Insurance Corporation (CDIC)', limit: 100_000_00, currency: 'CAD', source: 'cdic.ca, per depositor, per member, per category' },
    policy: { called: 'overnight rate target', rate: 0.0225, since: '2025-10-29', source: 'bankofcanada.ca' },
    interestTax: { rate: 0, note: 'The bank withholds no tax from a resident; interest is reported on a T5 slip.', source: 'canada.ca, line 12100' },
    howMoneyMoves: 'Pay arrives by direct deposit; bills go by online bill payment or pre-authorized debit, and people send each other Interac e-Transfers. Since 12 March 2026 a bank may charge at most $10 for a payment it returns unpaid.',
    banks: [
      {
        id: 'ca-rbc', returned: { fee: 10_00, gapDays: 2, ifShortAtLeast: 10_00, source: 'canada.ca: since 12 March 2026 at most $10 for a payment returned unpaid, one fee every two business days, none under $10' }, name: 'RBC Royal Bank', iso: 'CA', currency: 'CAD', format: 'ca', code: '003',
        current: p('RBC Signature No Limit Banking', 'rbcroyalbank.com: $16.95 a month; the $4,000 minimum-balance waiver is from secondary sources', { monthlyFee: 16_95, waiver: { balanceAtLeast: 4_000_00 } }),
        savings: p('RBC High Interest eSavings', 'rbcroyalbank.com: 0.550% regular rate', { rate: 0.0055 }),
        overdraft: 'RBC overdraft protection costs $5 a month on most accounts and about 22% a year.',
      },
      {
        id: 'ca-td', returned: { fee: 10_00, gapDays: 2, ifShortAtLeast: 10_00, source: 'canada.ca: since 12 March 2026 at most $10 for a payment returned unpaid, one fee every two business days, none under $10' }, name: 'TD Canada Trust', iso: 'CA', currency: 'CAD', format: 'ca', code: '004',
        current: p('TD Unlimited Chequing', 'td.com: $17.95 a month, waived with a $4,000 minimum daily balance', { monthlyFee: 17_95, waiver: { balanceAtLeast: 4_000_00 } }),
        savings: p('TD ePremium Savings', 'td.com: 0.45%, only on balances of $10,000 or more', { rate: 0.0045, rateFrom: 10_000_00 }),
        overdraft: 'TD overdraft protection is $5 a use or $5 a month, at 21% a year.',
      },
      {
        id: 'ca-scotiabank', returned: { fee: 10_00, gapDays: 2, ifShortAtLeast: 10_00, source: 'canada.ca: since 12 March 2026 at most $10 for a payment returned unpaid, one fee every two business days, none under $10' }, name: 'Scotiabank', iso: 'CA', currency: 'CAD', format: 'ca', code: '002',
        current: p('Preferred Package', 'scotiabank.com: $16.95 a month, waived with a $4,000 daily balance', { monthlyFee: 16_95, waiver: { balanceAtLeast: 4_000_00 } }),
        savings: p('MomentumPLUS Savings', 'scotiabank.com: 0.40% base rate, with premiums for money held 90 to 360 days not modeled', { rate: 0.004 }),
        overdraft: 'Scotiabank overdraft protection is $5 a month or $5 a use, at 21% a year.',
      },
      {
        id: 'ca-bmo', returned: { fee: 10_00, gapDays: 2, ifShortAtLeast: 10_00, source: 'canada.ca: since 12 March 2026 at most $10 for a payment returned unpaid, one fee every two business days, none under $10' }, name: 'BMO', iso: 'CA', currency: 'CAD', format: 'ca', code: '001',
        current: p('Performance Chequing Plan', 'finder.com/ca: $17.95 a month, waived with a $4,000 minimum balance', { monthlyFee: 17_95, waiver: { balanceAtLeast: 4_000_00 } }),
        savings: p('Savings Account', `${NOT_FOUND}; the product's name wasn't found either`),
        overdraft: 'BMO overdraft protection is $5 a use or $5 a month, at 21% a year.',
      },
      {
        id: 'ca-cibc', returned: { fee: 10_00, gapDays: 2, ifShortAtLeast: 10_00, source: 'canada.ca: since 12 March 2026 at most $10 for a payment returned unpaid, one fee every two business days, none under $10' }, name: 'CIBC', iso: 'CA', currency: 'CAD', format: 'ca', code: '010',
        current: p('CIBC Smart Account', 'cibc.com: $16.95 a month, rebated with a $4,000 daily balance; free under 25', { monthlyFee: 16_95, waiver: { balanceAtLeast: 4_000_00, ageBelow: 25 } }),
        savings: p('CIBC eAdvantage Savings', NOT_FOUND),
      },
    ],
  },
  // --- Mexico -----------------------------------------------------------------
  {
    iso: 'MX',
    guarantee: { scheme: 'IPAB', note: '400,000 UDIs per person per bank, about MXN 3.53 million at the UDI of 2026-09-25', source: 'gob.mx/ipab' },
    policy: { called: 'tasa objetivo', rate: 0.065, since: '2026-05-08', source: 'Banxico, via expansion.mx' },
    interestTax: { rate: 0, note: 'The bank withholds ISR at 0.90% a year on the capital earning interest (LIF 2026, art. 24); no savings rate was found, so nothing here earns interest to withhold from.', source: 'diputados.gob.mx LIF 2026' },
    howMoneyMoves: 'Pay arrives in a payroll account (cuenta de nómina) by SPEI; bills go by domiciliación, by SPEI to the payee’s CLABE, or in cash at a convenience store.',
    banks: [
      {
        id: 'mx-bbva', name: 'BBVA México', iso: 'MX', currency: 'MXN', format: 'mx', code: '012',
        current: p('Libretón Básico Cuenta Digital', 'bbva.mx: no fees on the digital account'),
        savings: p('Libretón', NOT_FOUND),
      },
      {
        id: 'mx-banorte', name: 'Banorte', iso: 'MX', currency: 'MXN', format: 'mx', code: '072',
        current: p('Cuenta Enlace Personal', 'banorte.com: a MXN 5,000 minimum average, waived with payroll; the fee itself was not found'),
        savings: p('Cuenta Enlace Personal', NOT_FOUND),
      },
      {
        id: 'mx-santander', quietMonth: { fee: 11_48, minTransactions: 2, unlessWages: true, source: 'santander.com.mx: MXN 9.90 plus 16% VAT in a month with fewer than two transactions and no payroll' }, name: 'Santander México', iso: 'MX', currency: 'MXN', format: 'mx', code: '014',
        current: p('Débito LikeU', 'santander.com.mx: no monthly fee but the quiet-month fee'),
        savings: p('Débito LikeU', NOT_FOUND),
      },
      {
        id: 'mx-banamex', name: 'Banamex', iso: 'MX', currency: 'MXN', format: 'mx', code: '002',
        current: p('Cuenta de Nómina Banamex', 'banamex.com: no fee while a salary is paid into it'),
        savings: p('Ahorro Fácil', NOT_FOUND),
      },
    ],
  },
  // --- United Kingdom ---------------------------------------------------------
  {
    iso: 'GB',
    guarantee: { scheme: 'Financial Services Compensation Scheme (FSCS)', limit: 120_000_00, currency: 'GBP', source: 'fscs.org.uk, per person per firm since 1 December 2025' },
    policy: { called: 'Bank Rate', rate: 0.0375, since: '2025-12-18', source: 'bankofengland.co.uk' },
    interestTax: { rate: 0, note: 'Banks have withheld no tax since April 2016; the Personal Savings Allowance covers £1,000 a year for a basic-rate taxpayer.', source: 'gov.uk' },
    howMoneyMoves: 'Pay arrives by BACS Direct Credit, usually monthly; bills go by Direct Debit, and one-off payments by Faster Payments.',
    banks: [
      {
        id: 'gb-barclays', name: 'Barclays', iso: 'GB', currency: 'GBP', format: 'gb', code: '20',
        current: p('Barclays Bank Account', 'barclays.co.uk: no monthly fee'),
        savings: p('Everyday Saver', 'barclays.co.uk: 1.00% AER from 11 March 2026', { rate: 0.01 }),
        overdraft: 'A Barclays arranged overdraft is 35.0% a year, with no interest on the first £15.',
      },
      {
        id: 'gb-lloyds', name: 'Lloyds Bank', iso: 'GB', currency: 'GBP', format: 'gb', code: '30',
        current: p('Classic Account', 'lloydsbank.com: no monthly fee'),
        savings: p('Easy Saver', 'lloydsbank.com: up to 1.00% AER variable', { rate: 0.01 }),
        overdraft: 'A Lloyds arranged overdraft is priced by risk, 19.9% to 49.9% EAR, 29.9% representative.',
      },
      {
        id: 'gb-natwest', name: 'NatWest', iso: 'GB', currency: 'GBP', format: 'gb', code: '60',
        current: p('Select Account', 'natwest.com: no monthly fee'),
        savings: p('Flexible Saver', 'natwest.com: 1.25% AER up to £10,000, 1.00% above (kept at 1.25%)', { rate: 0.0125 }),
        overdraft: 'A NatWest arranged overdraft is 39.49% EAR representative.',
      },
      {
        id: 'gb-hsbc', name: 'HSBC UK', iso: 'GB', currency: 'GBP', format: 'gb', code: '40',
        current: p('HSBC Bank Account', 'hsbc.co.uk: no monthly fee'),
        savings: p('Flexible Saver', 'hsbc.co.uk: 1.05% AER from 12 March 2026', { rate: 0.0105 }),
        overdraft: 'An HSBC UK arranged overdraft is 39.9% EAR above a £25 buffer.',
      },
      {
        id: 'gb-santander', name: 'Santander UK', iso: 'GB', currency: 'GBP', format: 'gb', code: '09',
        current: p('Everyday Current Account', 'santander.co.uk: no monthly fee'),
        savings: p('Easy Access Saver', 'santander.co.uk: 2.00% AER for 12 months, from 17 July 2026', { rate: 0.02 }),
        overdraft: 'A Santander UK arranged overdraft is 39.94% EAR representative.',
      },
      {
        id: 'gb-nationwide', name: 'Nationwide Building Society', iso: 'GB', currency: 'GBP', format: 'gb', code: '07',
        current: p('FlexAccount', 'nationwide.co.uk: no monthly fee'),
        savings: p('Flex Instant Saver', 'nationwide.co.uk: 2.30% AER', { rate: 0.023 }),
        overdraft: 'A Nationwide overdraft has its first £50 free, then 39.9% a year.',
      },
    ],
  },
  // --- Ireland ----------------------------------------------------------------
  {
    iso: 'IE',
    guarantee: { scheme: 'Deposit Guarantee Scheme', limit: 100_000_00, currency: 'EUR', source: 'centralbank.ie, per person per institution' },
    policy: { called: 'ECB deposit facility rate', rate: 0.025, since: '2026-09-16', source: 'ecb.europa.eu' },
    interestTax: { rate: 0.33, note: 'DIRT at 33%, taken by the bank and final.', source: 'revenue.ie' },
    howMoneyMoves: 'Pay arrives by SEPA credit transfer; bills go by SEPA Direct Debit.',
    banks: [
      {
        id: 'ie-aib', name: 'AIB', iso: 'IE', currency: 'EUR', format: 'ie', code: 'AIBK93',
        current: p('Personal Current Account', 'aib.ie: €6 a month from 1 July 2026; exemptions for students, graduates, over-66s and mortgage holders not modeled', { monthlyFee: 6_00 }),
        savings: p('Demand Deposit Account', 'aib.ie: 0.25% AER (rates dated May 2025)', { rate: 0.0025 }),
        overdraft: 'An AIB overdraft is 11.85% a year, with a €25.39 facility fee.',
      },
      {
        id: 'ie-bank-of-ireland', name: 'Bank of Ireland', iso: 'IE', currency: 'EUR', format: 'ie', code: 'BOFI90',
        current: p('Personal Current Account', 'bankofireland.com: €6 a month flat', { monthlyFee: 6_00 }),
        savings: p('Demand Deposit Account', 'bankofireland.com rate table, 14 September 2026: 0.10% AER', { rate: 0.001 }),
        overdraft: 'A Bank of Ireland overdraft is 13.25% a year, with a €30 yearly facility fee.',
      },
      {
        id: 'ie-ptsb', name: 'PTSB', iso: 'IE', currency: 'EUR', format: 'ie', code: 'IPBS99',
        current: p('Explore Account', 'ptsb.ie: €8 a month, no waivers since 2023', { monthlyFee: 8_00 }),
        savings: p('Demand Deposit Account', 'ptsb.ie: 0.01%', { rate: 0.0001 }),
        overdraft: 'A PTSB overdraft is 15% a year, with a €25 set-up fee and €25 a year.',
      },
    ],
  },
  // --- Iceland ----------------------------------------------------------------
  {
    iso: 'IS',
    guarantee: { scheme: 'Depositors’ and Investors’ Guarantee Fund (Tryggingarsjóður)', note: 'the equivalent of €100,000 in krónur, about 13.8 million kr', source: 'Act 98/1999, art. 9, althingi.is' },
    policy: { called: 'key interest rate (meginvextir)', rate: 0.08, since: '2026-08-19', source: 'sedlabanki.is' },
    interestTax: {
      rate: 0.22, refund: { allowance: 300_000_00, month: 6, day: 1, estimateDate: true },
      note: 'Capital income tax (fjármagnstekjuskattur) at 22%, taken by the bank; the tax on the first 300,000 kr of a year’s interest comes back at the next year’s assessment, paid here on 1 June (SLATE’s estimate of the day).',
      source: 'skatturinn.is',
    },
    howMoneyMoves: 'Pay arrives in the current account; bills arrive as claims (kröfur) in the online bank and are paid from there.',
    banks: [
      {
        id: 'is-landsbankinn', name: 'Landsbankinn', iso: 'IS', currency: 'ISK', format: 'is', code: '01',
        current: p('Einkareikningur', 'landsbankinn.is rate decision, 1 September 2026: the current account pays 0.50%; fees not found', { rate: 0.005 }),
        savings: p('Vaxtareikningur', 'landsbankinn.is rate decision, 1 September 2026: 5.79% on the lowest tier, up to 6.25%', { rate: 0.0579 }),
        overdraft: 'A Landsbankinn overdraft (yfirdráttur) is 15.75% a year, as of 1 September 2026.',
      },
      {
        id: 'is-arion', card: { yearly: 950_00, perPurchase: 19_00, freeUnder: 24, source: 'Arion price list, 23 September 2026: a debit card at 950 kr a year and 19 kr a purchase, free for 23 and under' }, name: 'Arion banki', iso: 'IS', currency: 'ISK', format: 'is', code: '03',
        current: p('Veltureikningur', 'arionbanki.is rate table, 24 September 2026: 0.05%; no monthly fee', { rate: 0.0005 }),
        savings: p('Vöxtur', 'arionbanki.is rate table, 24 September 2026: 5.55% on the lowest tier, up to 5.85%', { rate: 0.0555 }),
        overdraft: 'An Arion overdraft (yfirdráttur) is 15.75% a year.',
      },
      {
        id: 'is-islandsbanki', name: 'Íslandsbanki', iso: 'IS', currency: 'ISK', format: 'is', code: '05',
        current: p('Almennur reikningur', 'islandsbanki.is rate table, 3 September 2026: 0.25%; fees not found', { rate: 0.0025 }),
        savings: p('Vaxtaþrep', 'islandsbanki.is rate table, 3 September 2026: 6.13% on the lowest tier, up to 6.50%', { rate: 0.0613 }),
        overdraft: 'An Íslandsbanki overdraft (yfirdráttur) is 15.75% a year.',
      },
    ],
  },
  // --- France -----------------------------------------------------------------
  {
    iso: 'FR',
    guarantee: { scheme: 'Fonds de Garantie des Dépôts et de Résolution (FGDR)', limit: 100_000_00, currency: 'EUR', source: 'garantiedesdepots.fr' },
    policy: { called: 'ECB deposit facility rate', rate: 0.025, since: '2026-09-16', source: 'ecb.europa.eu' },
    interestTax: { rate: 0.314, note: 'On ordinary interest the bank takes 12.8% toward income tax and 18.6% social charges (from 2026). A Livret A pays tax-free.', source: 'service-public.gouv.fr F2329' },
    howMoneyMoves: 'Salary arrives by SEPA virement; bills go by SEPA prélèvement, and a few by check.',
    banks: [
      {
        id: 'fr-bnp-paribas', name: 'BNP Paribas', iso: 'FR', currency: 'EUR', format: 'fr', code: '30004',
        current: p('Compte de dépôt', 'BNP Paribas price list from 1 January 2026, via moneyvox.fr: account keeping €2.60 a month, free for 18 to 24', { monthlyFee: 2_60, waiver: { ageBelow: 25 } }),
        savings: p('Livret A', 'economie.gouv.fr: 1.7% from 1 August 2026, tax-free, paid once a year at the end of December', { rate: 0.017, taxFree: true, pays: [12] }),
        overdraft: 'An intervention charge of €8 an operation, at most €80 a month, the legal cap.',
      },
      {
        id: 'fr-societe-generale', name: 'SG', iso: 'FR', currency: 'EUR', format: 'fr', code: '30003',
        current: p('Compte bancaire', 'SG price list 2026: €7.65 a quarter (€2.55 a month here), waived under 25', { monthlyFee: 2_55, waiver: { ageBelow: 25 } }),
        savings: p('Livret A', 'economie.gouv.fr: 1.7% from 1 August 2026, tax-free, paid once a year', { rate: 0.017, taxFree: true, pays: [12] }),
        overdraft: 'An authorized overdraft is 8.73% to 23.48% a year; the intervention charge is €8, at most €80 a month.',
      },
      {
        id: 'fr-lcl', name: 'LCL', iso: 'FR', currency: 'EUR', format: 'fr', code: '30002',
        current: p('Compte de dépôt', 'LCL via moneyvox.fr: free where a salary is paid in, else €10 a quarter (€3.33 a month here)', { monthlyFee: 3_33, waiver: { depositsAtLeast: 1 } }),
        savings: p('Livret A', 'economie.gouv.fr: 1.7% from 1 August 2026, tax-free, paid once a year', { rate: 0.017, taxFree: true, pays: [12] }),
        overdraft: 'The intervention charge is €8, at most €80 a month.',
      },
      {
        id: 'fr-credit-agricole', name: 'Crédit Agricole Paris Île-de-France', iso: 'FR', currency: 'EUR', format: 'fr', code: '18206',
        current: p('Compte de dépôt', 'moneyvox.fr: €18 a year (€1.50 a month here), varying by regional bank', { monthlyFee: 1_50 }),
        savings: p('Livret A', 'economie.gouv.fr: 1.7% from 1 August 2026, tax-free, paid once a year', { rate: 0.017, taxFree: true, pays: [12] }),
      },
      {
        id: 'fr-la-banque-postale', name: 'La Banque Postale', iso: 'FR', currency: 'EUR', format: 'fr', code: '20041',
        current: p('CCP', 'moneyvox.fr: €25.20 a year (€2.10 a month here)', { monthlyFee: 2_10 }),
        savings: p('Livret A', 'economie.gouv.fr: 1.7% from 1 August 2026, tax-free, paid once a year', { rate: 0.017, taxFree: true, pays: [12] }),
        overdraft: 'An authorized overdraft is 16% a year, an unauthorized one 17%.',
      },
    ],
  },
  // --- Germany ----------------------------------------------------------------
  {
    iso: 'DE',
    guarantee: { scheme: 'statutory deposit guarantee (EdB for private banks; Sparkassen and Volksbanken by their own schemes)', limit: 100_000_00, currency: 'EUR', source: 'bafin.de' },
    policy: { called: 'ECB deposit facility rate', rate: 0.025, since: '2026-09-16', source: 'ecb.europa.eu' },
    interestTax: { rate: 0.26375, allowance: 1_000_00, note: 'Abgeltungsteuer at 25% plus the 5.5% Solidaritätszuschlag, taken by the bank on interest above the €1,000 Sparer-Pauschbetrag a year; church tax not modeled.', source: 'gesetze-im-internet.de, §32d and §20(9) EStG' },
    howMoneyMoves: 'Pay arrives by SEPA-Überweisung; rent goes by standing order (Dauerauftrag), and utilities and insurance by SEPA-Lastschrift.',
    banks: [
      {
        id: 'de-deutsche-bank', name: 'Deutsche Bank', iso: 'DE', currency: 'EUR', format: 'de', code: '10070000',
        current: p('AktivKonto', 'deutsche-bank.de fee information, 23 September 2026: €6.90 a month', { monthlyFee: 6_90 }),
        savings: p('Flexgeld', 'deutsche-bank.de: 0.50%', { rate: 0.005 }),
        overdraft: 'The Dispo is 11.60% a year, and 13.05% on an overdraft beyond it.',
      },
      {
        id: 'de-commerzbank', name: 'Commerzbank', iso: 'DE', currency: 'EUR', format: 'de', code: '10040000',
        current: p('GiroKonto', 'commerzbank.de, 1 December 2025: €4.90 a month, free only with €50,000 held at the bank (kept here as €50,000 in the account)', { monthlyFee: 4_90, waiver: { balanceAtLeast: 50_000_00 } }),
        savings: p('Tagesgeld', NOT_FOUND),
        overdraft: 'The Dispo is 11.90% a year, and 14.40% beyond it.',
      },
      {
        id: 'de-postbank', name: 'Postbank', iso: 'DE', currency: 'EUR', format: 'de', code: '10010010',
        current: p('Giro plus', 'postbank.de, 15 July 2026: €6.90 a month, €5.90 in a month with €1,000 paid in', { monthlyFee: 6_90, waiver: { depositsAtLeast: 1_000_00, reducedTo: 5_90 } }),
        savings: p('Tagesgeld', NOT_FOUND),
        overdraft: 'The Dispo is 11.04% a year, and 12.85% beyond it.',
      },
      {
        id: 'de-ing', name: 'ING Deutschland', iso: 'DE', currency: 'EUR', format: 'de', code: '50010517',
        current: p('Girokonto', 'ing.de conditions, 25 September 2026: free with €1,000 paid in a month or under 28, else €4.90', { monthlyFee: 4_90, waiver: { depositsAtLeast: 1_000_00, ageBelow: 28 } }),
        savings: p('Extra-Konto', 'ing.de: 3.20% for a new customer’s first four months, then 0.75%', { rate: 0.0075, intro: [{ months: 4, rate: 0.032 }] }),
        overdraft: 'The Dispo is 9.14% a year.',
      },
      {
        id: 'de-berliner-sparkasse', name: 'Berliner Sparkasse', iso: 'DE', currency: 'EUR', format: 'de', code: '10050000',
        current: p('Giro Digital', 'berliner-sparkasse.de, 1 February 2026: €4.95 a month', { monthlyFee: 4_95 }),
        savings: p('Tagesgeld', 'berliner-sparkasse.de: 0.50%', { rate: 0.005 }),
        overdraft: 'The Dispo is 13.11% a year.',
      },
    ],
  },
  // --- Spain ------------------------------------------------------------------
  {
    iso: 'ES',
    guarantee: { scheme: 'Fondo de Garantía de Depósitos (FGD)', limit: 100_000_00, currency: 'EUR', source: 'BOE-A-2011-16173' },
    policy: { called: 'ECB deposit facility rate', rate: 0.025, since: '2026-09-16', source: 'ecb.europa.eu' },
    interestTax: { rate: 0.19, note: 'A 19% retención on interest, taken by the bank.', source: 'Ley 35/2006, art. 101.4, boe.es' },
    howMoneyMoves: 'The nómina arrives by SEPA transfer into the salary account; bills are recibos domiciliados, and people pay each other by Bizum. An overdraft may not cost more than 8.125% a year in 2026, two and a half times the legal rate.',
    banks: [
      {
        id: 'es-santander', name: 'Banco Santander', iso: 'ES', currency: 'EUR', format: 'es', code: '0049',
        current: p('Cuenta Santander', 'bancosantander.es: €20 a month, free with a nómina of €600 (and bills or card use, not modeled) or under 29', { monthlyFee: 20_00, waiver: { depositsAtLeast: 600_00, ageBelow: 29 } }),
        savings: p('Cuenta Santander', NOT_FOUND),
      },
      {
        id: 'es-bbva', name: 'BBVA', iso: 'ES', currency: 'EUR', format: 'es', code: '0182',
        current: p('Cuenta Online Sin Comisiones', 'bbva.es via comparison sites: no fee, no conditions'),
        savings: p('Cuenta Online Sin Comisiones', NOT_FOUND),
      },
      {
        id: 'es-caixabank', name: 'CaixaBank', iso: 'ES', currency: 'EUR', format: 'es', code: '2100',
        current: p('Programa Día a Día', 'caixabank.es: €60 a quarter (€20 a month here) unless a nómina over €600, €20,000 held, or under 29', { monthlyFee: 20_00, waiver: { depositsAtLeast: 600_01, balanceAtLeast: 20_000_00, ageBelow: 29 } }),
        savings: p('Programa Día a Día', 'caixabank.es: 0%'),
      },
      {
        id: 'es-sabadell', name: 'Banco Sabadell', iso: 'ES', currency: 'EUR', format: 'es', code: '0081',
        current: p('Cuenta Online Sabadell', 'comparison sites: no fee on the digital account'),
        savings: p('Cuenta Online Sabadell', NOT_FOUND),
      },
      {
        id: 'es-bankinter', name: 'Bankinter', iso: 'ES', currency: 'EUR', format: 'es', code: '0128',
        current: p('Cuenta Nómina', 'bankinter.com: 5% TAE in the first year and 2% in the second, on up to €10,000 (no rate after that was found); €22.50 a half-year (€3.75 a month here) without a nómina of €800', { intro: [{ months: 12, rate: 0.05 }, { months: 12, rate: 0.02 }], rateUpTo: 10_000_00, monthlyFee: 3_75, waiver: { depositsAtLeast: 800_00 } }),
        savings: p('Cuenta Nómina', NOT_FOUND),
      },
    ],
  },
  // --- Japan ------------------------------------------------------------------
  {
    iso: 'JP',
    guarantee: { scheme: 'Deposit Insurance Corporation of Japan (DICJ)', limit: 10_000_000_00, currency: 'JPY', source: 'dic.go.jp, principal and interest per depositor per bank' },
    policy: { called: 'uncollateralized overnight call rate target', rate: 0.0125, since: '2026-09-18', source: 'boj.or.jp' },
    interestTax: { rate: 0.20315, note: '20.315% taken at source and final: 15.315% national, reconstruction surtax included, and 5% local.', source: 'nta.go.jp No.1310' },
    howMoneyMoves: 'Pay arrives by salary transfer (kyūyo furikomi) into an ordinary deposit account; bills go by account transfer (kōza furikae) or with a slip at a convenience store.',
    banks: [
      {
        id: 'jp-mufg', dormant: { yearly: 1_320_00, afterYears: 2, source: 'bk.mufg.jp: ¥1,320 a year on an account unused for two years' }, name: 'MUFG Bank', iso: 'JP', currency: 'JPY', format: 'jp', code: '0005',
        current: p('普通預金 (Ordinary Deposit)', 'bk.mufg.jp: 0.40% since 3 August 2026, 0.50% from 2 November 2026, paid in February and August; SLATE’s accounts use the paperless passbook, which carries no fee', { rate: 0.004, changes: [{ from: '2026-11-02', rate: 0.005 }], pays: [2, 8] }),
        savings: p('普通預金 (Ordinary Deposit)', 'bk.mufg.jp: as the everyday account', { rate: 0.004, changes: [{ from: '2026-11-02', rate: 0.005 }], pays: [2, 8] }),
        overdraft: 'The general account (sōgō kōza) lends against time deposits at their rate plus 0.50%.',
      },
      {
        id: 'jp-smbc', name: 'SMBC', iso: 'JP', currency: 'JPY', format: 'jp', code: '0009',
        current: p('普通預金 (Ordinary Deposit)', 'smbc.co.jp: 0.40%, 0.50% from 2 November 2026', { rate: 0.004, changes: [{ from: '2026-11-02', rate: 0.005 }], pays: [2, 8] }),
        savings: p('普通預金 (Ordinary Deposit)', 'smbc.co.jp: as the everyday account', { rate: 0.004, changes: [{ from: '2026-11-02', rate: 0.005 }], pays: [2, 8] }),
      },
      {
        id: 'jp-mizuho', name: 'Mizuho Bank', iso: 'JP', currency: 'JPY', format: 'jp', code: '0001',
        current: p('普通預金 (Ordinary Deposit)', 'mizuhobank.co.jp: 0.40%, 0.50% from 2 November 2026', { rate: 0.004, changes: [{ from: '2026-11-02', rate: 0.005 }], pays: [2, 8] }),
        savings: p('普通預金 (Ordinary Deposit)', 'mizuhobank.co.jp: as the everyday account', { rate: 0.004, changes: [{ from: '2026-11-02', rate: 0.005 }], pays: [2, 8] }),
      },
      {
        id: 'jp-resona', dormant: { yearly: 1_320_00, afterYears: 2, belowBalance: 10_000_00, source: 'resona-gr.co.jp: ¥1,320 a year on an account unused for two years holding under ¥10,000' }, name: 'Resona Bank', iso: 'JP', currency: 'JPY', format: 'jp', code: '0010',
        current: p('普通預金 (Ordinary Deposit)', 'resona-gr.co.jp: 0.40% from 3 August 2026', { rate: 0.004, pays: [2, 8] }),
        savings: p('普通預金 (Ordinary Deposit)', 'resona-gr.co.jp: as the everyday account', { rate: 0.004, pays: [2, 8] }),
      },
      {
        id: 'jp-japan-post-bank', name: 'Japan Post Bank', iso: 'JP', currency: 'JPY', format: 'jp', code: '9900',
        current: p('通常貯金 (Ordinary Savings)', 'jp-bank.japanpost.jp: 0.400%, 0.500% from 9 November 2026', { rate: 0.004, changes: [{ from: '2026-11-09', rate: 0.005 }], pays: [2, 8] }),
        savings: p('通常貯金 (Ordinary Savings)', 'jp-bank.japanpost.jp: as the everyday account', { rate: 0.004, changes: [{ from: '2026-11-09', rate: 0.005 }], pays: [2, 8] }),
      },
    ],
  },
  // --- South Korea ------------------------------------------------------------
  {
    iso: 'KR',
    guarantee: { scheme: 'Korea Deposit Insurance Corporation (KDIC)', limit: 100_000_000_00, currency: 'KRW', source: 'fsc.go.kr, per depositor per institution from 1 September 2025' },
    policy: { called: 'Base Rate', rate: 0.03, since: '2026-08-27', source: 'bok.or.kr' },
    interestTax: { rate: 0.154, note: '15.4% taken at source: 14% national and 1.4% local income tax.', source: 'kbthink.com' },
    howMoneyMoves: 'Salary arrives in a designated salary account, which unlocks its fee waivers; bills go by auto-transfer (jadong iche), card, or KakaoPay and Toss.',
    banks: [
      {
        id: 'kr-kb-kookmin', name: 'KB Kookmin Bank', iso: 'KR', currency: 'KRW', format: 'kr', code: '004', groups: [6, 2, 6],
        current: p('KB국민ONE통장 (everyday account)', 'obank.kbstar.com: 0.10%, no maintenance fee', { rate: 0.001 }),
        savings: p('KB국민ONE통장 (everyday account)', 'obank.kbstar.com: 0.10%', { rate: 0.001 }),
      },
      {
        id: 'kr-shinhan', name: 'Shinhan Bank', iso: 'KR', currency: 'KRW', format: 'kr', code: '088', groups: [3, 3, 6],
        current: p('쏠편한 입출금통장 (everyday account)', 'm.shinhan.com: 0.1%, no maintenance fee', { rate: 0.001 }),
        savings: p('쏠편한 입출금통장 (everyday account)', 'm.shinhan.com: 0.1%', { rate: 0.001 }),
      },
      {
        id: 'kr-hana', name: 'Hana Bank', iso: 'KR', currency: 'KRW', format: 'kr', code: '081', groups: [3, 6, 5],
        current: p('달달 하나 통장 (everyday account)', 'm.hanabank.com: 0.10% base; up to 1.90% on ₩2 million with salary, not modeled', { rate: 0.001 }),
        savings: p('달달 하나 통장 (everyday account)', 'm.hanabank.com: 0.10% base', { rate: 0.001 }),
      },
      {
        id: 'kr-nh', name: 'NH NongHyup Bank', iso: 'KR', currency: 'KRW', format: 'kr', code: '011', groups: [3, 4, 4, 2],
        current: p('NH올원e통장 (everyday account)', 'etoday.co.kr: 0.1% base', { rate: 0.001 }),
        savings: p('NH올원e통장 (everyday account)', 'etoday.co.kr: 0.1% base', { rate: 0.001 }),
      },
      {
        id: 'kr-kakaobank', name: 'KakaoBank', iso: 'KR', currency: 'KRW', format: 'kr', code: '090', groups: [4, 2, 7],
        current: p('입출금통장 (everyday account)', 'kakaobank.com: 0.10%', { rate: 0.001 }),
        savings: p('세이프박스 (savings box)', 'kakaobank.com: 1.80% from 10 September 2026', { rate: 0.018 }),
      },
    ],
  },
  // --- Australia --------------------------------------------------------------
  {
    iso: 'AU',
    guarantee: { scheme: 'Financial Claims Scheme', limit: 250_000_00, currency: 'AUD', source: 'apra.gov.au, per account holder per bank' },
    policy: { called: 'cash rate target', rate: 0.0435, since: '2026-05-06', source: 'rba.gov.au' },
    interestTax: { rate: 0, note: 'The bank withholds no tax once a tax file number is given; without one the bank takes 47%.', source: 'savings.com.au (the ATO page could not be read)' },
    howMoneyMoves: 'Pay arrives by direct credit, often to a PayID; bills go by BPAY, direct debit or card.',
    banks: [
      {
        id: 'au-commbank', name: 'Commonwealth Bank', iso: 'AU', currency: 'AUD', format: 'au', code: '06',
        current: p('Everyday Account Smart Access', 'commbank.com.au: $4 a month, waived with $2,000 deposited in the month or under 30', { monthlyFee: 4_00, waiver: { depositsAtLeast: 2_000_00, ageBelow: 30 } }),
        savings: p('NetBank Saver', 'commbank.com.au, 24 September 2026: 5.20% for the first five months, then 2.10% standard', { rate: 0.021, intro: [{ months: 5, rate: 0.052 }] }),
        overdraft: 'CommBank charges a $15 overdrawn fee if the account is still negative at midnight, and 14.90% a year.',
      },
      {
        id: 'au-westpac', name: 'Westpac', iso: 'AU', currency: 'AUD', format: 'au', code: '03',
        current: p('Westpac Choice', 'westpac.com.au: $5 a month, waived with $2,000 deposited in the month', { monthlyFee: 5_00, waiver: { depositsAtLeast: 2_000_00 } }),
        savings: p('Westpac Life', 'westpac.com.au: 0.10% base, and a 4.90% bonus in a month the balance grows', { rate: 0.001, bonus: { rate: 0.049, when: 'grows' } }),
        overdraft: 'Westpac charges a $15 overdrawn fee, and 15.01% a year.',
      },
      {
        id: 'au-nab', name: 'NAB', iso: 'AU', currency: 'AUD', format: 'au', code: '08',
        current: p('NAB Classic Banking', 'nab.com.au: no monthly fee'),
        savings: p('NAB Reward Saver', 'nab.com.au, from 21 September 2026: 0.01% base, and a 4.99% bonus in a month with no withdrawals', { rate: 0.0001, bonus: { rate: 0.0499, when: 'no_withdrawals' } }),
      },
      {
        id: 'au-anz', name: 'ANZ', iso: 'AU', currency: 'AUD', format: 'au', code: '01',
        current: p('ANZ Plus Everyday', 'anz.com.au: no monthly fee'),
        savings: p('ANZ Plus Growth Saver', 'anz.com.au: 0.10% base, and a 5.00% bonus in a month the balance grows by $100', { rate: 0.001, bonus: { rate: 0.05, when: 'grows', growBy: 100_00 } }),
      },
    ],
  },
  // --- New Zealand ------------------------------------------------------------
  {
    iso: 'NZ',
    guarantee: { scheme: 'Depositor Compensation Scheme', limit: 100_000_00, currency: 'NZD', source: 'rbnz.govt.nz, per depositor per institution since 1 July 2025' },
    policy: { called: 'Official Cash Rate', rate: 0.0275, since: '2026-09-02', source: 'rbnz.govt.nz' },
    interestTax: {
      brackets: [
        { upTo: 15_600_00, rate: 0.105 }, { upTo: 53_500_00, rate: 0.175 }, { upTo: 78_100_00, rate: 0.30 },
        { upTo: 180_000_00, rate: 0.33 }, { rate: 0.39 },
      ],
      note: 'Resident withholding tax at the rate that matches the saver’s income: 10.5%, 17.5%, 30%, 33% or 39%.',
      source: 'ird.govt.nz, resident withholding tax',
    },
    howMoneyMoves: 'Pay arrives by direct credit, weekly or fortnightly; bills go by internet-banking bill payment, automatic payment or direct debit.',
    banks: [
      {
        id: 'nz-anz', name: 'ANZ', iso: 'NZ', currency: 'NZD', format: 'nz', code: '01',
        current: p('ANZ Go', 'anz.co.nz fees, 1 September 2026: no monthly fee'),
        savings: p('Serious Saver', 'anz.co.nz: 0.05% base, and a 2.00% bonus in a month with no withdrawals', { rate: 0.0005, bonus: { rate: 0.02, when: 'no_withdrawals' } }),
        overdraft: 'An ANZ arranged overdraft is 18.90% a year with a $3 monthly fee; unarranged, 19.90% and $3.',
      },
      {
        id: 'nz-asb', name: 'ASB', iso: 'NZ', currency: 'NZD', format: 'nz', code: '12',
        current: p('ASB Streamline', 'asb.co.nz: no monthly fee'),
        savings: p('Savings Plus', 'interest.co.nz: 2.05%', { rate: 0.0205 }),
      },
      {
        id: 'nz-bnz', name: 'BNZ', iso: 'NZ', currency: 'NZD', format: 'nz', code: '02',
        current: p('YouMoney', 'bnz.co.nz: no monthly fee'),
        savings: p('Rapid Save', 'bnz.co.nz: 2.00%', { rate: 0.02 }),
        overdraft: 'BNZ charges $5 a month when unarranged and more than $20 overdrawn.',
      },
      {
        id: 'nz-westpac', name: 'Westpac NZ', iso: 'NZ', currency: 'NZD', format: 'nz', code: '03',
        current: p('Westpac Everyday', 'westpac.co.nz: no monthly fee'),
        savings: p('Bonus Saver', 'interest.co.nz: 1.75%', { rate: 0.0175 }),
      },
      {
        id: 'nz-kiwibank', name: 'Kiwibank', iso: 'NZ', currency: 'NZD', format: 'nz', code: '38',
        current: p('Free Up', 'kiwibank.co.nz: no monthly fee'),
        savings: p('Online Call', 'interest.co.nz: 1.90%', { rate: 0.019 }),
      },
    ],
  },
];
