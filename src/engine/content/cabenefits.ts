/**
 * SLATE — the rest of Canada's safety net for an actor, from 2026-09-30,
 * read from canada.ca, ontario.ca and gov.bc.ca into
 * `docs/research/world/research-canada-benefits2.json`. Built by hand from it;
 * the two tables are the research's rows as parsed from the governments'
 * own page and PDF.
 */

/**
 * EI special benefits for the self-employed, 2026: a premium of $1.63 per
 * $100 of self-employment earnings, $1,123.07 a year at most, once
 * registered, and for life once a benefit's been paid; after twelve months
 * registered, with $9,254 of net self-employment earnings the year before,
 * the sickness benefit, 55% of that year's weekly earnings to $729 a week,
 * 26 weeks at most, after one unpaid week.
 */
export const EI_SELF_EMPLOYED = { premium: 0.0163, premiumMax: 1_123.07, weeks: 26, rate: 0.55, maxWeekly: 729, waitWeeks: 1, registeredMonths: 12, minEarnings: 9_254 } as const;

/**
 * Ontario's Drug Benefit from 65: a $100 deductible a program year (August
 * to July) and up to $6.11 a prescription; under the Seniors Co-Payment
 * Program's $25,480 of net income for a single senior, no deductible and up
 * to $2. Under 65, Trillium: about 4% of the last year's net income a
 * program year, a quarter each quarter, and up to $2 a prescription after.
 */
export const ONTARIO_DRUGS = { deductible: 100, copay: 6.11, lowIncome: 25_480, lowCopay: 2, trilliumShare: 0.04, trilliumCopay: 2 } as const;

/**
 * BC's Fair PharmaCare, the regular table from 1 May 2026, by net income:
 * [from, to, deductible, family maximum], dollars. After the deductible
 * PharmaCare pays 70% of a prescription, and all of it past the maximum.
 */
export const FAIR_PHARMACARE = { share: 0.7, table: [
  [0, 1875, 0, 0],
  [1875.01, 3125, 0, 0],
  [3125.01, 4375, 0, 0],
  [4375.01, 6250, 0, 0],
  [6250.01, 8750, 0, 0],
  [8750.01, 11250, 0, 0],
  [11250.01, 13750, 0, 0],
  [13750.01, 15000, 0, 100],
  [15000.01, 16250, 0, 200],
  [16250.01, 18750, 0, 300],
  [18750.01, 21250, 0, 400],
  [21250.01, 23750, 0, 500],
  [23750.01, 26250, 0, 600],
  [26250.01, 28750, 0, 700],
  [28750.01, 30000, 0, 800],
  [30000.01, 31667, 650, 900],
  [31667.01, 35000, 800, 1150],
  [35000.01, 38333, 950, 1350],
  [38333.01, 41667, 1100, 1500],
  [41667.01, 45000, 1300, 1700],
  [45000.01, 48333, 1400, 1875],
  [48333.01, 51667, 1500, 2000],
  [51667.01, 55000, 1600, 2150],
  [55000.01, 58333, 1700, 2275],
  [58333.01, 61667, 1800, 2400],
  [61667.01, 65000, 1900, 2550],
  [65000.01, 70833, 2000, 2675],
  [70833.01, 79167, 2250, 3000],
  [79167.01, 87500, 2500, 3350],
  [87500.01, 95833, 2750, 3675],
  [95833.01, 108333, 3000, 4000],
  [108333.01, 125000, 3500, 4675],
  [125000.01, 141667, 4000, 5350],
  [141667.01, 158333, 4500, 6000],
  [158333.01, 183333, 5000, 6675],
  [183333.01, 216667, 6000, 8000],
  [216667.01, 250000, 7000, 9350],
  [250000.01, 283333, 8000, 10000],
  [283333.01, 316667, 9000, 10000],
  [316667.01, 999999999, 10000, 10000],
] as readonly (readonly [number, number, number, number])[] } as const;

/**
 * BC's Senior's Supplement for a single senior on the GIS, from 1 July
 * 2026: [income from, to, dollars a month], by yearly income as the GIS
 * counts it; nothing from $2,280.
 */
export const BC_SENIORS_SUPPLEMENT: readonly (readonly [number, number, number])[] = [
  [0, 23.99, 99.3],
  [24, 47.99, 98.3],
  [48, 71.99, 97.3],
  [72, 95.99, 96.3],
  [96, 119.99, 95.3],
  [120, 143.99, 94.3],
  [144, 167.99, 93.3],
  [168, 191.99, 92.3],
  [192, 215.99, 91.3],
  [216, 239.99, 90.3],
  [240, 263.99, 89.3],
  [264, 287.99, 88.3],
  [288, 311.99, 87.3],
  [312, 335.99, 86.3],
  [336, 359.99, 85.3],
  [360, 383.99, 84.3],
  [384, 407.99, 83.3],
  [408, 431.99, 82.3],
  [432, 455.99, 81.3],
  [456, 479.99, 80.3],
  [480, 503.99, 79.3],
  [504, 527.99, 78.3],
  [528, 551.99, 77.3],
  [552, 575.99, 76.3],
  [576, 599.99, 75.3],
  [600, 623.99, 74.3],
  [624, 647.99, 73.3],
  [648, 671.99, 72.3],
  [672, 695.99, 71.3],
  [696, 719.99, 70.3],
  [720, 743.99, 69.3],
  [744, 767.99, 68.3],
  [768, 791.99, 67.3],
  [792, 815.99, 66.3],
  [816, 839.99, 65.3],
  [840, 863.99, 64.3],
  [864, 887.99, 63.3],
  [888, 911.99, 62.3],
  [912, 935.99, 61.3],
  [936, 959.99, 60.3],
  [960, 983.99, 59.3],
  [984, 1007.99, 58.3],
  [1008, 1031.99, 57.3],
  [1032, 1055.99, 56.3],
  [1056, 1079.99, 55.3],
  [1080, 1103.99, 54.3],
  [1104, 1127.99, 53.3],
  [1128, 1151.99, 52.3],
  [1152, 1175.99, 51.3],
  [1176, 1199.99, 50.3],
  [1200, 1223.99, 49.3],
  [1224, 1247.99, 48.3],
  [1248, 1271.99, 47.3],
  [1272, 1295.99, 46.3],
  [1296, 1319.99, 45.3],
  [1320, 1343.99, 44.3],
  [1344, 1367.99, 43.3],
  [1368, 1391.99, 42.3],
  [1392, 1415.99, 41.3],
  [1416, 1439.99, 40.3],
  [1440, 1463.99, 39.3],
  [1464, 1487.99, 38.3],
  [1488, 1511.99, 37.3],
  [1512, 1535.99, 36.3],
  [1536, 1559.99, 35.3],
  [1560, 1583.99, 34.3],
  [1584, 1607.99, 33.3],
  [1608, 1631.99, 32.3],
  [1632, 1655.99, 31.3],
  [1656, 1679.99, 30.3],
  [1680, 1703.99, 29.3],
  [1704, 1727.99, 28.3],
  [1728, 1751.99, 27.3],
  [1752, 1775.99, 26.3],
  [1776, 1799.99, 25.3],
  [1800, 1823.99, 24.3],
  [1824, 1847.99, 23.3],
  [1848, 1871.99, 22.3],
  [1872, 1895.99, 21.3],
  [1896, 1919.99, 20.3],
  [1920, 1943.99, 19.3],
  [1944, 1967.99, 18.3],
  [1968, 1991.99, 17.3],
  [1992, 2015.99, 16.3],
  [2016, 2039.99, 15.3],
  [2040, 2047.99, 14.3],
  [2048, 2063.99, 13.3],
  [2064, 2087.99, 12.3],
  [2088, 2095.99, 11.3],
  [2096, 2111.99, 10.3],
  [2112, 2135.99, 9.3],
  [2136, 2143.99, 8.3],
  [2144, 2159.99, 7.3],
  [2160, 2183.99, 6.3],
  [2184, 2191.99, 5.3],
  [2192, 2207.99, 4.3],
  [2208, 2231.99, 3.3],
  [2232, 2239.99, 2.3],
  [2240, 2255.99, 1.3],
  [2256, 2279.99, 1],
];

/**
 * The GIS top-up's own reduction: 25 cents a dollar of income over $2,048
 * for a single person (a canada.ca report of 2022; no 2026 page states it),
 * ending at $10,352, which the July to September 2026 table confirms.
 */
export const GIS_TOP_UP = { threshold: 2_048, rate: 0.25, endsAt: 10_352 } as const;
