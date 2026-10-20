/**
 * Batch 6: `content/rents.ts`, the measure and the period a place's look prints after "The rent is published:"
 * (`ui/looks/place.tsx`). The measures were the research's shorthand ("a 40th percentile with utilities", "warm",
 * "normalized to a 10 million won deposit") and the periods its codes ("FY2026", "Q3 2025"). Each says the same thing in
 * words; every figure, area and date is kept. Applied with `apply-text.mjs`.
 */
const F = 'src/engine/content/rents.ts';
const e = (key, old, now) => ({ file: F, key, old, new: now });
export default [
  e('reykjavik', '\'HMS mean market rent for a two-room flat; the area it covers isn’t stated\', \'Q3 2025\'', '\'HMS’s mean market rent for a two-room flat; it doesn’t say what area it covers\', \'the third quarter of 2025\''),
  e('mosfellsbr', '\'HMS capital-region market rent, 3,739 kr a square meter, for 55 square meters\'', '\'HMS’s market rent for the capital region, 3,739 kr a square meter, for 55 square meters\''),
  e('newyork', '\'HUD Fair Market Rent, a 40th percentile with utilities; the room is SpareRoom’s\', \'FY2026; room Q2 2026\'', '\'HUD’s Fair Market Rent, the 40th percentile rent, utilities included; the room’s rent is SpareRoom’s\', \'fiscal year 2026; the room, the second quarter of 2026\''),
  e('newhaven', '\'HUD Fair Market Rent for the New Haven–Meriden area, a 40th percentile with utilities\', \'FY2026\'', '\'HUD’s Fair Market Rent for the New Haven–Meriden area, the 40th percentile rent, utilities included\', \'fiscal year 2026\''),
  e('losangeles', '\'HUD Fair Market Rent, a 40th percentile with utilities; the room is SpareRoom’s\', \'FY2026; room Q4 2025\'', '\'HUD’s Fair Market Rent, the 40th percentile rent, utilities included; the room’s rent is SpareRoom’s\', \'fiscal year 2026; the room, the fourth quarter of 2025\''),
  e('london', '\'ONS mean rent across private tenancies; the room is SpareRoom’s\', \'August 2026; room Q1 2026\'', '\'the ONS’s mean rent across private tenancies; the room’s rent is SpareRoom’s\', \'August 2026; the room, the first quarter of 2026\''),
  e('toronto', '\'Statistics Canada mean asking rent for a one-bedroom\', \'Q2 2026\', STATCAN),\n  r(\'ca-bc-vancouver\'', '\'Statistics Canada’s mean asking rent for a one-bedroom\', \'the second quarter of 2026\', STATCAN),\n  r(\'ca-bc-vancouver\''),
  e('vancouver', '\'Statistics Canada mean asking rent for a one-bedroom\', \'Q2 2026\', STATCAN),\n  r(\'ca-qc-montreal\'', '\'Statistics Canada’s mean asking rent for a one-bedroom\', \'the second quarter of 2026\', STATCAN),\n  r(\'ca-qc-montreal\''),
  e('montreal', '1_480, \'CAD\', \'Statistics Canada mean asking rent for a one-bedroom\', \'Q2 2026\'', '1_480, \'CAD\', \'Statistics Canada’s mean asking rent for a one-bedroom\', \'the second quarter of 2026\''),
  e('sydney', '\'NSW median weekly rent on new bonds for a one-bedroom unit, 700 a week\'', '\'the NSW median rent on new bonds for a one-bedroom unit, A$700 a week\''),
  e('melbourne', '\'Victorian median on new lettings for a one-bedroom flat, 500 a week; the room is a listing summary\', \'September quarter 2025; room April 2026\'', '\'Victoria’s median rent on new lettings for a one-bedroom flat, A$500 a week; the room’s rent is from a summary of listings\', \'the September quarter of 2025; the room, April 2026\''),
  e('auckland', '\'a summary of Tenancy Services bond data for central Auckland, 463 a week\'', '\'a summary of Tenancy Services’ bond data for central Auckland, NZ$463 a week\''),
  e('berlin', '\'IBB median asking rent, warm, about 50 square meters; the room is the Moses Mendelssohn Institut’s\', \'2025; room September 2026\'', '\'the IBB’s median asking rent including heating (warm), for about 50 square meters; the room’s rent is the Moses Mendelssohn Institut’s\', \'2025; the room, September 2026\''),
  e('paris', '\'OLAP mean for recent movers into a two-room flat, charges excluded\'', '\'OLAP’s mean rent for recent movers into a two-room flat, without charges\''),
  e('madrid', '\'idealista asking rent, 23.3 euros a square meter for 50; the room from idealista and OCU\'', '\'idealista’s asking rent, €23.30 a square meter for 50 square meters; the room’s rent is from idealista and OCU\''),
  e('rome', '\'Agenzia Entrate registered new contracts, 13.5 euros a square meter for 50, likely under listing prices\'', '\'the Agenzia Entrate’s registered new contracts, €13.50 a square meter for 50 square meters, likely below listing prices\''),
  e('dublin', '\'RTB standardised average for a one-bedroom on new tenancies; the room is Daft.ie’s\', \'Q4 2025; room Q1 2026\'', '\'the RTB’s standardized average for a one-bedroom on new tenancies; the room’s rent is Daft.ie’s\', \'the fourth quarter of 2025; the room, the first quarter of 2026\''),
  e('tokyo', '\'At Home average asking rent for 30 to 50 square meters in the 23 wards\'', '\'At Home’s average asking rent for 30 to 50 square meters in the 23 wards\''),
  e('seoul', '\'monthly rent (wolse) on small units, normalized to a 10 million won deposit\', \'Q1 2026\'', '\'the monthly rent (wolse) on small units, taken at a ₩10 million deposit\', \'the first quarter of 2026\''),
  e('mexicocity', '\'Inmuebles24 asking rent, 334 pesos a square meter, for 45 to 50\'', '\'Inmuebles24’s asking rent, 334 pesos a square meter, for 45 to 50 square meters\''),
];
