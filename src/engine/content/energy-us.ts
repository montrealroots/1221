/**
 * SLATE — what an American household spends on energy a year, by state.
 *
 * The EIA's Residential Energy Consumption Survey 2020, Table CE3.6.ST
 * (June 2023): average dollars per household a year, all fuels (electricity,
 * natural gas, propane and fuel oil), at 2020's prices. A state's figure
 * carries both its climate and its prices: Alaska's $3,018 and Connecticut's
 * $2,808 against Florida's $1,654 and California's $1,656. The nation's is
 * $1,884. The EIA notes that differences between states may not be
 * statistically significant.
 */

export const US_ENERGY_AVERAGE = 1_884;

export const US_ENERGY_BY_STATE: Readonly<Record<string, number>> = {
  'us-al': 2_082, 'us-ak': 3_018, 'us-az': 1_994, 'us-ar': 1_926, 'us-ca': 1_656, 'us-co': 1_342, 'us-ct': 2_808,
  'us-de': 1_910, 'us-dc': 1_197, 'us-fl': 1_654, 'us-ga': 2_180, 'us-hi': 2_058, 'us-id': 1_520, 'us-il': 1_720,
  'us-in': 2_111, 'us-ia': 1_854, 'us-ks': 1_984, 'us-ky': 1_848, 'us-la': 1_704, 'us-me': 2_304, 'us-md': 1_924,
  'us-ma': 2_453, 'us-mi': 2_192, 'us-mn': 1_833, 'us-ms': 1_887, 'us-mo': 1_909, 'us-mt': 1_511, 'us-ne': 1_586,
  'us-nv': 1_690, 'us-nh': 2_530, 'us-nj': 2_034, 'us-nm': 1_492, 'us-ny': 2_319, 'us-nc': 1_731, 'us-nd': 1_648,
  'us-oh': 1_847, 'us-ok': 1_803, 'us-or': 1_642, 'us-pa': 2_015, 'us-ri': 2_617, 'us-sc': 1_918, 'us-sd': 1_709,
  'us-tn': 1_759, 'us-tx': 1_800, 'us-ut': 1_647, 'us-vt': 2_407, 'us-va': 2_023, 'us-wa': 1_461, 'us-wv': 1_976,
  'us-wi': 1_779, 'us-wy': 1_802,
};

export const US_ENERGY_SOURCE = 'https://www.eia.gov/consumption/residential/data/2020/state/xls/ce3.6.st.xlsx (RECS 2020, Table CE3.6.ST, June 2023)';
