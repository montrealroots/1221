/**
 * SLATE — a driver hired to drive your own car (Stage 11 of
 * `docs/BACKLOG.md`, from 2026-10-01), from
 * `docs/research/world/research-hired-services.json`, read 2026-10-01: a
 * service a town where one publishes its price for driving the customer's
 * own car.
 *
 * - **New York and Los Angeles:** Dryver (formerly BeMyDD), $55 an hour
 *   for somebody not a member, two hours at least (members pay $39, and
 *   SLATE sells no membership).
 * - **London:** Car and Driver Hire London's driver alone, £50 an hour,
 *   eight hours at least. Let Me Drive, which drives people home, quotes
 *   only by phone.
 * - **Toronto:** Keys to Us's personal driver in your own car, C$60 an hour,
 *   three hours at least, with Ontario's 13% HST.
 * - **Vancouver:** SoberDrivers.ca, C$30 to come out and C$2.50 a kilometer,
 *   with the 5% GST (a search's summary).
 *
 * New Haven, Dublin and Mexico City have none with a published price.
 */

export interface DriverService {
  id: string;
  cityId: string;
  name: string;
  currency: string;
  perHour?: number;
  minHours?: number;
  pickup?: number;
  perKm?: number;
  /** The tax added on top. */
  tax: number;
  source: string;
}

export const DRIVERS: readonly DriverService[] = [
  { id: 'dryver-ny', cityId: 'us-ny-newyork', name: 'Dryver', currency: 'USD', perHour: 55, minHours: 2, tax: 0, source: 'https://www.dryver.com/designated-driver.html' },
  { id: 'dryver-la', cityId: 'us-ca-losangeles', name: 'Dryver', currency: 'USD', perHour: 55, minHours: 2, tax: 0, source: 'https://www.dryver.com/designated-driver.html' },
  { id: 'car-and-driver-hire-london', cityId: 'uk-eng-london', name: 'Car and Driver Hire London', currency: 'GBP', perHour: 50, minHours: 8, tax: 0, source: 'https://www.caranddriverhirelondon.com/prices.php' },
  { id: 'keys-to-us', cityId: 'ca-on-toronto', name: 'Keys to Us', currency: 'CAD', perHour: 60, minHours: 3, tax: 0.13, source: 'http://www.keystous.ca/' },
  { id: 'soberdrivers', cityId: 'ca-bc-vancouver', name: 'SoberDrivers.ca', currency: 'CAD', pickup: 30, perKm: 2.5, tax: 0.05, source: 'https://soberdrivers.ca/' },
];
