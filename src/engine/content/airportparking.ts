/**
 * SLATE — leaving one's own car at the airport (the master plan's §47, from
 * 2026-10-02; `docs/research/world/research-airport-parking.json`, each
 * airport's own tariff read that day, three secondhand as marked).
 *
 * The cheapest long-stay car park whose drive-up tariff was read, by airport:
 * JFK's Long-Term Lot 9, $55 the first 24 hours and $27.50 each 12 after
 * (the Port Authority's schedule of charges, from 28 May 2026); Newark's
 * Economy Lot P6, $35 the first 24 hours and $17.50 each 12 after (its
 * schedule of charges from 2024, read through a search's copy); LaGuardia's
 * Terminal A garage, its $75 a day most; LAX's Budget Parking, the old Lot E,
 * $20 a day (LAX's own page as the Internet Archive kept it in January
 * 2026, the live one refusing to be read); Bradley's Lot 4, $7 a day or $42
 * a week, and Tweed-New Haven's Lot C, $25 a day before tax; Heathrow's Long
 * Stay, £46.80 the first day and £37.40 each after, and Gatwick's, £38 and
 * £32; Dublin's Holiday Blue, €20 a day; Toronto Pearson's Value Park
 * Garage, C$32 a day or C$160 a week before HST (Pearson's pages as a search
 * index kept them); Vancouver's Value Long Term, C$29.50 a day or C$159.75 a
 * week with its parking tax; Mexico City's, MX$391 a day at most. A part of
 * a day is a day, or a part of JFK's or Newark's 12 hours twelve hours: SLATE's reading
 * of a tariff charged by the day.
 */

export interface AirportParking { iata: string; lot: string; currency: string; first: number; firstHours: number; then: number; thenHours: number; weekly?: number; confirmed: boolean }

export const AIRPORT_PARKING: readonly AirportParking[] = [
  { iata: 'JFK', lot: 'Long-Term Lot 9', currency: 'USD', first: 55, firstHours: 24, then: 27.5, thenHours: 12, confirmed: true },
  { iata: 'EWR', lot: 'Economy Parking Lot P6', currency: 'USD', first: 35, firstHours: 24, then: 17.5, thenHours: 12, confirmed: false },
  { iata: 'LGA', lot: 'Terminal A Garage', currency: 'USD', first: 75, firstHours: 24, then: 75, thenHours: 24, confirmed: true },
  { iata: 'LAX', lot: 'Budget Parking', currency: 'USD', first: 20, firstHours: 24, then: 20, thenHours: 24, confirmed: false },
  { iata: 'BDL', lot: 'Lot 4', currency: 'USD', first: 7, firstHours: 24, then: 7, thenHours: 24, weekly: 42, confirmed: true },
  { iata: 'HVN', lot: 'Lot C', currency: 'USD', first: 25, firstHours: 24, then: 25, thenHours: 24, confirmed: true },
  { iata: 'LHR', lot: 'Long Stay', currency: 'GBP', first: 46.8, firstHours: 24, then: 37.4, thenHours: 24, confirmed: true },
  { iata: 'LGW', lot: 'Long Stay', currency: 'GBP', first: 38, firstHours: 24, then: 32, thenHours: 24, confirmed: true },
  { iata: 'DUB', lot: 'Holiday Blue', currency: 'EUR', first: 20, firstHours: 24, then: 20, thenHours: 24, confirmed: true },
  { iata: 'YYZ', lot: 'Value Park Garage', currency: 'CAD', first: 32, firstHours: 24, then: 32, thenHours: 24, weekly: 160, confirmed: false },
  { iata: 'YVR', lot: 'Value Long Term', currency: 'CAD', first: 29.5, firstHours: 24, then: 29.5, thenHours: 24, weekly: 159.75, confirmed: true },
  { iata: 'MEX', lot: 'Estacionamiento', currency: 'MXN', first: 391, firstHours: 24, then: 391, thenHours: 24, confirmed: true },
];

/** What a stay of so many hours costs at a car park, in its money: the first period, each period after or part of one, and a week's rate where it's less. */
export function parkingUnits(p: AirportParking, hours: number): number {
  const h = Math.max(1, hours);
  const byPeriods = (span: number) => p.first + Math.max(0, Math.ceil((span - p.firstHours) / p.thenHours)) * p.then;
  if (p.weekly === undefined) return byPeriods(h);
  const weeks = Math.floor(h / (7 * 24));
  const rest = h - weeks * 7 * 24;
  return weeks * p.weekly + (rest > 0 ? Math.min(byPeriods(rest), p.weekly) : 0);
}
