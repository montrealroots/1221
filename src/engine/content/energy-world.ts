/**
 * SLATE — what a household spends on energy a year outside America, in US
 * dollars at the year's exchange, beside the EIA's American $1,884
 * (`content/energy-us.ts`), from each country's own household spending
 * survey, and how far household energy prices have moved since each to
 * 2025 (`tools/data/energy.mjs`, which writes this file and
 * `docs/research/world/derived-energy.json`; read 2026-10-02):
 * - ca-08: 2,128 CAD (2019), Statistics Canada, Survey of Household Spending 2019 (11-10-0222); CPI (18-10-0004).
 * - ca-02: 1,845 CAD (2019), Statistics Canada, Survey of Household Spending 2019 (11-10-0222); CPI (18-10-0004).
 * - uk: 1,278.41 GBP (2019), ONS, Family Spending FYE 2020 (workbook 1, A1, 4.4); CPI 04.5 (D7CH).
 * - ie: 1,765.8 EUR (2020), CSO, Household Budget Survey 2022-2023 (HBS01), at 2020 prices by Eurostat HICP CP045.
 * - mx: 6,092 MXN (2020), INEGI, ENIGH 2020, electricidad y combustibles, MX$1,523 a quarter (read by hand).
 * Keyed by province where Canada's differ, by country elsewhere.
 */

export const ENERGY_ABROAD_USD: Readonly<Record<string, number>> = {
  'ca-08': 1604,
  'ca-02': 1390,
  'uk': 1632,
  'ie': 2015,
  'mx': 283,
};

/** Household energy prices in 2025 against each survey's year: America's against RECS's 2020, and each place's. */
export const ENERGY_PRICES_SINCE: Readonly<Record<string, number>> = {
  us: 1.2802,
  'ca-08': 1.2039,
  'ca-02': 1.1741,
  'uk': 1.5672,
  'ie': 1.7117,
  'mx': 1,
};
