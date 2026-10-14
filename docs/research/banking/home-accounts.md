# Home-Country Accounts Kept From New Haven

Read 2026-10-16. The record is `home-accounts.json` beside this file. Each field
there holds what the bank or the law publishes. Where nothing is published, the
field says "not published" and the bank's `assumptions` carries a sentence that
starts "SLATE assumes".

The question asked: a Yale student living in New Haven, on an F-1 or as a US
citizen or resident, lived in another country before. May they keep the account
they held at a bank there, beside a US account? Birthplace grants nothing here.
Eligibility comes from having lived and banked in that country.

## What Was Found

**Retention.** Of the 60 banks, 13 are `kept: true`, 46 are `conditional` and 1
is `false`.

- **The one refusal is Barclays.** Its "Living outside the UK" page says the
  holder must live in the UK and every address on the account must be British.
  The exceptions are Crown employees, an address belonging to someone who manages
  the account, and absences of six months or less. A Yale student fits none.
- **True by a published sentence:**
  - HSBC UK: "you're allowed to do so".
  - Westpac Australia: an overseas address is allowed with email and electronic
    statements.
  - CommBank: the account is restricted only if details aren't updated after 30
    days' notice.
  - The five New Zealand banks: they keep the account and switch to non-resident
    withholding tax.
- **True because the account is not foreign:** the five US banks, for a student
  living in New Haven. Their policies for a customer who later moves abroad are
  recorded too. Chase may close an account with a foreign address. Citi does not
  serve residents of Europe. Capital One 360 requires a US address.
- **Conditional because no bank publishes an emigration rule.** In most of the
  countries, none of the banks publishes one. The condition then comes from the
  bank's general terms and the national law:
  - Report the new address and tax residence.
  - File the CRS/FATCA self-certification.
  - Where the system has one, take a non-resident status: Spain's two-yearly
    non-residence certificate, Germany's Steuerausländer, Japan's 非居住者
    handling.
- **Published conditions with a price:**
  - Japan: MUFG Global Direct (JPY 300 a month) and SMBC Global Service (JPY 220
    a month, students named). Each must be applied for before departure, and
    neither can be added afterwards.
  - France, non-resident fees: BNP Paribas EUR 15 a month for a US resident;
    SG EUR 75 a quarter, exempt under 25; LCL EUR 40 a quarter unless income is
    paid in, exempt under 26.
  - Sabadell: EUR 30 every two years for the non-residence certificate.
  - Deutsche Bank: moves the student off "Das Junge Konto", which needs an EU
    address, onto AktivKonto at EUR 6.90 a month.
  - Japan Post Bank: asks emigrants to close "as far as possible" but allows a
    non-resident notification with an agent in Japan.

**Closure notice.** The figure is the bank's own clause where one was read, and
the statutory minimum where it wasn't:

| Where | Notice | Basis |
|---|---|---|
| EU, EEA (incl. Iceland) | 2 months | PSD2 art. 55 and its national transpositions |
| UK | 60 days | Accounts opened before 28 April 2026 |
| UK | 90 days | Since SI 2025/688, already in Santander UK's terms |
| Scotiabank | 30 days | Bank's own terms |
| BBVA México | 30 days | Bank's own terms |
| Westpac NZ | 30 days | Bank's own terms |
| Other NZ banks | 14 days | 2012 Code and Banking Ombudsman |

`null` means the bank's terms allow closure "without notice", or give "reasonable
notice" without a number. That covers RBC, TD, BMO, CIBC, the Australian banks,
Japan, Korea and three of the Mexican banks. Chase, Bank of America and Capital
One say "without notice" (0).

**US persons.** None of the 60 banks publishes a policy of refusing or closing
accounts because the holder is a US person. All collect FATCA/CRS
self-certification under their country's agreement with the US. The documented
de-risking is historical and system-wide, not a published bank rule:
GAO-19-180, and France's "Américains accidentels" episode. LCL is the only
foreign bank that names the W-9.

**Tax on interest at source for a non-resident.** The rate is 0% in CA, GB, IE
(with the non-resident declaration), FR, DE (once the bank has proof of the move)
and ES (non-resident account). The rate is not zero elsewhere:

| Country | Withheld from a non-resident | Lower rate for a US resident |
|---|---|---|
| MX | 4.9% | n/a |
| IS | 12% | Exempt under the treaty, claimed by form |
| JP | 15.315% national | Exempt under the 2019 protocol if claimed; banks don't advertise it |
| KR | 22% | 12% under the treaty |
| AU | 10% final | n/a |
| NZ | 10% for treaty residents, or the 2% approved issuer levy | Levy by election only |

**US side.** These come from IRS and FinCEN pages:

- An F-1 student is an exempt individual for up to five calendar years, so a
  nonresident alien.
- Their foreign bank interest is foreign-source and not US-taxed. They still
  file Form 8843.
- FBAR (aggregate over $10,000) and Form 8938 (unmarried in the US: over $50,000
  at year end or $75,000 at any time) bind only US persons. A US citizen or
  green-card holder at Yale owes both, plus worldwide tax on the interest.

## What Is Uncertain

- **No published emigration rule.** The 46 conditionals rest on the absence of a
  published emigration rule, not on a published permission. ING Deutschland is
  the weakest of them: ING requires German residence to open an account, and
  only user reports describe it closing accounts after customers moved abroad.
  Lloyds and Santander UK say they "may not" keep the account, or that you
  "must be a UK resident" while they "can currently service" existing products.
  Ombudsman decisions record both closing accounts.
- **Sources that blocked fetching.** The sites of Lloyds, AIB, PTSB, BBVA Spain,
  Banorte, Santander México, Resona, Mizuho, ASB and Kiwibank blocked fetching.
  Their values rest on search snippets of the banks' own pages, and the source
  titles say so. BMO was read from an archive copy dated 2026-09-26.
- **Fee tables read from scrambled PDF columns.** These were matched to their
  rows by count, and each is flagged in its bank's assumptions: RBC, BMO, Citi,
  Commerzbank and Banamex, and the Crédit Agricole OCR.
- **Exchange-rate margins and transfer times** are almost never published as
  numbers. Exceptions are Bank of Ireland (a maximum of 2.5%), NatWest (a
  maximum of 3.25%), CaixaBank (+2.5%), Santander UK (3%, 2% or 1%) and SMBC
  (JPY 1 per USD).
- **Unconfirmed tax figures.** Korea's 22% rests on a snippet, and whether the
  12% treaty rate includes local tax is unsettled. Japan's 2027 defence surtax
  was not added.
- **Residence tests.** Korea's and Japan's 2-year non-residence tests mean a
  1-year exchange student stays resident at home, and a 4-year Yale student
  doesn't. Neither country publishes a student exception that was read.
- **Practical access.** Several banks tie login to a home SIM or app store:
  Korea, Barclays, Nationwide, Kiwibank and ANZ NZ. Iceland's e-ID needs
  in-person registration for non-Icelanders. BMO says its digital banking "may
  not be available" outside Canada.

## What SLATE Will Assume

- **Eligibility.** A student may hold a home account only in a country where
  their history records residence and an account there. Birthplace or
  citizenship alone grants nothing.
- **Retention follows the record:**
  - `false`: closed on leaving.
  - `true`: kept.
  - `conditional`: kept while the student has reported the move and filed the
    self-certification. Any published non-resident fee or status is charged.
    Neglect lets the bank restrict, then close the account after the recorded
    notice.
- **Fees and withholding.** Card, ATM and transfer fees come from the record.
  Where a field says "not published", the fee stays unmodelled until someone
  researches it; SLATE never invents a number. Withholding at source is the country's rate for a
  US resident, with treaty relief only where the record says the bank applies
  it.
- **US tax.** For a nonresident-alien F-1 student, no US tax on home interest,
  no FBAR and no Form 8938. For a US person, all three apply.
- **The ~230 other countries.** They use the nine `world.assumptions`:
  - Retention is conditional. The bank may keep, convert, restrict or close the
    account.
  - A holder who is a US person is reported under the 114 FATCA agreements.
    Some banks refuse or close such accounts (GAO-19-180), which SLATE models
    as a risk, not a rule.
  - EU/EEA closures carry 60 days' notice (PSD2 art. 55). There is no default
    outside the EU/EEA.
  - Withholding falls back to the domestic non-resident rate, capped by a treaty
    where one exists.
  - SWIFT sending fees aren't researched per country and aren't invented. The
    FSB's 2024 averages are kept as a calibration only.
