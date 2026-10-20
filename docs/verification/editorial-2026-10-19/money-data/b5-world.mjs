/**
 * Batch 5: the world's banks. `content/banks-world-sheets.ts`: the notes the Accounts tab joins to a product's source
 * line (`banks.ts`, `fromSheet`), where "/month", ">=", "<", "p.a.", "incl." and "e.g." stood for words, and where the
 * research said what the game does with a quarterly or yearly fee in its own passive ("converted to monthly", "shown
 * as monthly", "shown here as 1,995/12"), now the game's ("the game charges a month's share"). `banks-world-fees.ts`:
 * two waivers' sources in the passive or a fragment. `banks-world.ts`: the source line of a bank with no researched
 * product, "no product sheet on record; the bank from …". Applied with `apply-text.mjs`.
 */
const S = 'src/engine/content/banks-world-sheets.ts';
const F = 'src/engine/content/banks-world-fees.ts';
const W = 'src/engine/content/banks-world.ts';
const note = (key, old, now) => ({ file: S, key, old: `"note": "${old}"`, new: `"note": "${now}"` });
const SHARE = 'the game charges a month’s share';

export default [
  note('AX.Ålandsbanken', 'Price list shows EUR 5.00/month for Primekonto and other personal accounts', 'Price list shows EUR 5.00 a month for Primekonto and other personal accounts'),
  note('DZ.BNA', 'DZD 500 per year account-keeping fee, converted to monthly', `DZD 500 a year account-keeping fee; ${SHARE}`),
  note('AR.Banco de la Nación', 'No maintenance charge on peso savings accounts (incl. salary accounts); USD account costs USD 10/month unless salary is paid there', 'No maintenance charge on peso savings accounts (including salary accounts); a USD account costs USD 10 a month unless a salary is paid into it'),
  note('AM.Ameriabank', 'Management free; AMD 1,000 per half-year only if turnover < AMD 150k and balance < AMD 50k, and not charged until June 30, 2027', 'Management free; AMD 1,000 a half-year only if turnover is under AMD 150,000 and the balance under AMD 50,000, and not charged until June 30, 2027'),
  note('BS.RBC', 'BSD 12/month; 6 free checks', 'BSD 12 a month; 6 free checks'),
  note('BH.NBB', 'Free if weighted average monthly balance >= BHD 300, else BHD 3.3 per month', 'Free if the weighted average monthly balance is BHD 300 or more, else BHD 3.3 a month'),
  note('BY.Belarusbank', 'No charge for opening or maintenance; the current account itself pays 0.1% p.a. on BYN balances (0.0001% USD/EUR).', 'No charge for opening or maintenance; the account itself pays 0.1% a year on BYN balances (0.0001% on USD and EUR).'),
  note('BE.BNP Paribas Fortis', 'Price raised from EUR 3 to EUR 3.50/month (Test Achats)', 'Price raised from EUR 3 to EUR 3.50 a month (Test Achats)'),
  note('BM.HSBC', '$12/month; no charge for Premier and Seniors.', '$12 a month; no charge for Premier and Seniors.'),
  note('BA.UniCredit', 'BAM 5.99/month; waived for students', 'BAM 5.99 a month; waived for students'),
  note('BG.UniCredit Bulbank', 'EUR 2.84/month, free with regular income into the account', 'EUR 2.84 a month, free with regular income into the account'),
  note('BF.Coris', 'XOF 1,500/month; XOF 500 for state employees (2022 conditions)', 'XOF 1,500 a month; XOF 500 for state employees (2022 conditions)'),
  note('KM.Exim', 'Minimum balance 10,000 KMF; remunerated up to 0.50% p.a. (non-chequebook current account: min 3,000 KMF, up to 0.75%). Monthly fee not published.', 'Minimum balance 10,000 KMF; pays up to 0.50% a year (an account without a chequebook: minimum 3,000 KMF, up to 0.75%). Monthly fee not published.'),
  note('DK.Danske', 'DKK 105 per quarter, shown as monthly.', `DKK 105 a quarter; ${SHARE}.`),
  note('EG.CIB', 'Converted from EGP 120 per quarter statement/administrative fee (as of September 1, 2026); minimum balance EGP 20,000, EGP 100 fee if below.', 'EGP 120 a quarter for statements and administration (as of September 1, 2026), which the game charges as a month’s share; minimum balance EGP 20,000, with an EGP 100 fee below it.'),
  note('GA.BGFIBank', 'XAF 12,000 incl. tax per month; figure from search summary, not the tariff.', 'XAF 12,000 a month including tax; the figure is from a search summary, not the tariff.'),
  note('GR.NBG', 'Account maintenance free of charge; Benefits Account variants cost EUR 0.80 or 2/month.', 'Account maintenance free of charge; Benefits Account variants cost EUR 0.80 or EUR 2 a month.'),
  note('GL.GrønlandsBANKEN', 'Customer fee (kundegebyr) DKK 25/month for private customers aged 27+, charged monthly in arrears; discounted with larger business volume. Account pays 0.000%.', 'Customer fee (kundegebyr) DKK 25 a month for private customers aged 27 and over, charged monthly in arrears; discounted with larger business volume. Account pays 0.000%.'),
  note('GP.BRED', 'Standard account-keeping fee EUR 30.48/year (BRED Guadeloupe, 2026 tariff), shown per month.', `Standard account-keeping fee EUR 30.48 a year (BRED Guadeloupe, 2026 tariff); ${SHARE}.`),
  note('ID.BRI', 'IDR 12,000/month admin fee; a savings-type account used as the everyday account.', 'IDR 12,000 a month admin fee; a savings-type account used as the everyday account.'),
  note('IL.Leumi', 'Regulated basic track: at most ILS 10/month including 10 self-service transactions and 1 teller transaction.', 'Regulated basic track: at most ILS 10 a month including 10 self-service transactions and 1 teller transaction.'),
  note('IT.Intesa', 'Base monthly fee (EUR 102/year) per the information sheet updated July 21, 2026; add-on services and promotions change the total.', 'Base monthly fee (EUR 102 a year) per the information sheet updated July 21, 2026; add-on services and promotions change the total.'),
  note('JO.Arab Bank', 'JD 1/month minimum-balance fee when the balance is below JD 100 (payroll accounts exempt).', 'JD 1 a month minimum-balance fee when the balance is below JD 100 (payroll accounts exempt).'),
  note('KZ.Kaspi', 'Annual service fee of KZT 1,995, shown here as 1,995/12. First year free; charged only if the card was used during the year. In February 2026 Kaspi denied reports of a rise to KZT 10,000.', 'Annual service fee of KZT 1,995, which the game charges as a twelfth each month. First year free; charged only if the card was used during the year. In February 2026 Kaspi denied reports of a rise to KZT 10,000.'),
  note('LV.Swedbank', 'EUR 2.00/month maintenance from June 1, 2026 for many customers; free for some (exemption conditions not verified).', 'EUR 2.00 a month maintenance from June 1, 2026 for many customers; free for some (the exemptions weren’t verified).'),
  note('LS.Standard Lesotho', 'M8.86/month account management fee (2026 pricing); optional Nala bundle M35.70/month.', 'M8.86 a month account management fee (2026 pricing); optional Nala bundle M35.70 a month.'),
  note('LI.LGT', 'CHF 25 per quarter for Liechtenstein residents (CHF 120/quarter for residents outside LI/CH), shown per month; third-party summary.', 'CHF 25 a quarter for Liechtenstein residents (CHF 120 a quarter for residents outside Liechtenstein and Switzerland), which the game charges as a month’s share; from a third-party summary.'),
  note('MQ.BRED', 'Account keeping fee EUR 2.54/month (EUR 30.48/yr), June 2026 tariff', 'Account-keeping fee EUR 2.54 a month (EUR 30.48 a year), June 2026 tariff'),
  note('YT.BRED', 'Account keeping fee EUR 2.54/month (EUR 30.48/yr), BRED Mayotte June 2026 tariff', 'Account-keeping fee EUR 2.54 a month (EUR 30.48 a year), BRED Mayotte June 2026 tariff'),
  note('MD.maib', 'MDL 15/month card-account fee from March 16, 2026; free under Smart Pricing with at least MDL 3,000 of card payments a month', 'MDL 15 a month card-account fee from March 16, 2026; free under Smart Pricing with at least MDL 3,000 of card payments a month'),
  note('MS.Bank of Montserrat', 'XCD 25/month stated as a minimum service fee; XCD 200 to open', 'XCD 25 a month stated as a minimum service fee; XCD 200 to open'),
  note('MA.Attijariwafa', 'MAD 5 TTC/month promotional rate, first 6 months free for new online customers', 'MAD 5 a month including tax (TTC), a promotional rate, with the first 6 months free for new online customers'),
  note('PK.HBL', 'Exempt from the Rs 50/month low-balance service charge (SOBC January to June 2026); other accounts such as HBL Freedom pay Rs 50/month if monthly average balance < Rs 40,000', 'Exempt from the Rs 50 a month low-balance service charge (SOBC January to June 2026); other accounts such as HBL Freedom pay Rs 50 a month if the monthly average balance is under Rs 40,000'),
  note('RE.BRED', 'Account-keeping fee of €30 a year for La Réunion, shown as a monthly equivalent.', `Account-keeping fee of €30 a year for La Réunion; ${SHARE}.`),
  note('SK.Slovenská sporiteľňa', 'Free through the Moja odmena program, e.g. €450 a month of mobile or card payments plus three standing orders or direct debits, or €15,000 of assets at the bank.', 'Free through the Moja odmena program, for example with €450 a month of mobile or card payments plus three standing orders or direct debits, or €15,000 of assets at the bank.'),
  note('TN.BIAT', 'TND 16 a quarter account-keeping fee, converted to monthly.', `TND 16 a quarter account-keeping fee; ${SHARE}.`),
  note('WF.BWF', 'XPF 6,300/year account-keeping fee (April 2026, IEOM; sole bank in the territory, unchanged three years running), converted to XPF 525/month', 'XPF 6,300 a year account-keeping fee (April 2026, IEOM; the only bank in the territory, unchanged three years running); the game charges XPF 525 a month'),
  { file: F, key: 'BF|Coris Bank International', old: 'XOF 500 for state employees; work in the game isn’t for the state, so the full fee', new: 'XOF 500 for state employees; work in the game isn’t for the state, so the game charges the full fee' },
  { file: F, key: 'GU|Bank of Guam', old: 'the game’s accounts are online, so e-Statements are taken as chosen', new: 'the game’s accounts are online, so the game takes e-Statements as chosen' },
  { file: W, key: 'worldBanking.current.source', old: 'current: { name: row.checking ? \'Checking Account\' : \'Current Account\', source: `no product sheet on record; the bank from ${row.source}`', new: 'current: { name: row.checking ? \'Checking Account\' : \'Current Account\', source: `no fees or rates were researched for this bank, so the game charges none and pays none; the bank was found at ${row.source}`' },
  { file: W, key: 'worldBanking.savings.source', old: 'savings: { name: \'Savings Account\', source: `no product sheet on record; the bank from ${row.source}`', new: 'savings: { name: \'Savings Account\', source: `no fees or rates were researched for this bank, so the game charges none and pays none; the bank was found at ${row.source}`' },
];
