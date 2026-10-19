/**
 * Batch 6, the rents read on the place look: the look prints "<measure>, <period>; source: …", so a measure that ended
 * on the room's provenance put the one-bedroom's period after the room ("…; the room’s rent is SpareRoom’s, fiscal year
 * 2026; the room, …"). The room's provenance and its date move into the period, after the one-bedroom's, and
 * Reykjavík's caveat after its quarter. Applied with `apply-text.mjs` after `b6-rents.mjs`.
 */
const F = 'src/engine/content/rents.ts';
const e = (key, old, now) => ({ file: F, key: `${key} (order)`, old, new: now });
export default [
  e('reykjavik', '\'HMS’s mean market rent for a two-room flat; it doesn’t say what area it covers\', \'the third quarter of 2025\'', '\'HMS’s mean market rent for a two-room flat\', \'the third quarter of 2025, for an area HMS doesn’t name\''),
  e('newyork', '\'HUD’s Fair Market Rent, the 40th percentile rent, utilities included; the room’s rent is SpareRoom’s\', \'fiscal year 2026; the room, the second quarter of 2026\'', '\'HUD’s Fair Market Rent, the 40th percentile rent, utilities included\', \'fiscal year 2026; the room’s rent is SpareRoom’s, for the second quarter of 2026\''),
  e('losangeles', '\'HUD’s Fair Market Rent, the 40th percentile rent, utilities included; the room’s rent is SpareRoom’s\', \'fiscal year 2026; the room, the fourth quarter of 2025\'', '\'HUD’s Fair Market Rent, the 40th percentile rent, utilities included\', \'fiscal year 2026; the room’s rent is SpareRoom’s, for the fourth quarter of 2025\''),
  e('london', '\'the ONS’s mean rent across private tenancies; the room’s rent is SpareRoom’s\', \'August 2026; the room, the first quarter of 2026\'', '\'the ONS’s mean rent across private tenancies\', \'August 2026; the room’s rent is SpareRoom’s, for the first quarter of 2026\''),
  e('melbourne', '\'Victoria’s median rent on new lettings for a one-bedroom flat, A$500 a week; the room’s rent is from a summary of listings\', \'the September quarter of 2025; the room, April 2026\'', '\'Victoria’s median rent on new lettings for a one-bedroom flat, A$500 a week\', \'the September quarter of 2025; the room’s rent is from a summary of listings, April 2026\''),
  e('berlin', '\'the IBB’s median asking rent including heating (warm), for about 50 square meters; the room’s rent is the Moses Mendelssohn Institut’s\', \'2025; the room, September 2026\'', '\'the IBB’s median asking rent including heating (warm), for about 50 square meters\', \'2025; the room’s rent is the Moses Mendelssohn Institut’s, September 2026\''),
  e('madrid', '\'idealista’s asking rent, €23.30 a square meter for 50 square meters; the room’s rent is from idealista and OCU\', \'August 2026\'', '\'idealista’s asking rent, €23.30 a square meter for 50 square meters\', \'August 2026; the room’s rent is from idealista and OCU\''),
  e('dublin', '\'the RTB’s standardized average for a one-bedroom on new tenancies; the room’s rent is Daft.ie’s\', \'the fourth quarter of 2025; the room, the first quarter of 2026\'', '\'the RTB’s standardized average for a one-bedroom on new tenancies\', \'the fourth quarter of 2025; the room’s rent is Daft.ie’s, for the first quarter of 2026\''),
];
