/**
 * SLATE — public garages and car parks where an errand's car can be left
 * instead of at a meter (the master plan's §40c, from 2026-10-02;
 * `docs/research/world/research-garages-reservations-carsale.json`, each
 * operator's own page read that day).
 *
 * Each charges by its own unit of time up to its day's maximum, where it
 * posts one, at the posted price; Vancouver's EasyPark posts its prices with
 * the GST and the parking sales tax in. Kept are the ones whose tariff can
 * be charged for any stay: Los Angeles's city garages, New Haven's Temple
 * Street, Toronto's Impark at One Toronto Street, EasyPark's Hornby Street,
 * the City of London's Baynard House, and Park Rite's and APCOA's in
 * Dublin. Manhattan's garages publish only a "from" price, Q-Park none, and
 * Mexico City no named garage's, so none is kept there; the meter is.
 */

export interface Garage {
  id: string; cityId: string; name: string; operator: string;
  /** A unit of time, its price, and the most for a day, where posted. */
  unitMinutes: number; unitPrice: number; dailyMax: number | null;
  currency: string;
  /** For an electric car, where the price is by vehicle (the City of London's). */
  evUnitPrice?: number;
  basis: string;
  source: string;
}

export const GARAGES: readonly Garage[] = [
  { id: 'la-mall', cityId: 'us-ca-losangeles', name: 'The L.A. Mall Garage', operator: 'City of Los Angeles', unitMinutes: 20, unitPrice: 4, dailyMax: 25, currency: 'USD', basis: '$4.00 each 20 minutes, $25 a day', source: 'https://gsd.lacity.gov/parking-services/' },
  { id: 'la-pershing', cityId: 'us-ca-losangeles', name: 'Pershing Square Garage', operator: 'City of Los Angeles', unitMinutes: 15, unitPrice: 3, dailyMax: 20, currency: 'USD', basis: '$3.00 each 15 minutes, $20 a day', source: 'https://gsd.lacity.gov/parking-services/' },
  { id: 'nh-temple', cityId: 'us-ct-newhaven', name: 'Temple Street Garage', operator: 'New Haven Parking Authority', unitMinutes: 60, unitPrice: 4, dailyMax: 22, currency: 'USD', basis: '$4 an hour, $22 a day', source: 'https://www.parkingnewhaven.com/' },
  { id: 'to-impark-530', cityId: 'ca-on-toronto', name: 'Impark, One Toronto Street', operator: 'Impark', unitMinutes: 20, unitPrice: 4, dailyMax: 27, currency: 'CAD', basis: 'C$4.00 each 20 minutes, C$27 a day', source: 'https://www.impark.com/' },
  { id: 'van-easypark-1', cityId: 'ca-bc-vancouver', name: 'EasyPark Lot 1, Hornby Street', operator: 'EasyPark', unitMinutes: 60, unitPrice: 10.5, dailyMax: 28.5, currency: 'CAD', basis: 'C$10.50 an hour, C$28.50 a day, GST and parking sales tax in', source: 'https://www.easypark.ca/find-parking/locations-and-lots' },
  { id: 'ldn-baynard', cityId: 'uk-eng-london', name: 'Baynard House Car Park', operator: 'City of London Corporation', unitMinutes: 60, unitPrice: 5.8, evUnitPrice: 4.5, dailyMax: null, currency: 'GBP', basis: '£5.80 an hour, £4.50 for an electric car', source: 'https://www.cityoflondon.gov.uk/' },
  { id: 'dub-fleet', cityId: 'ie-lei-dublin', name: 'Park Rite, Fleet Street', operator: 'Park Rite', unitMinutes: 60, unitPrice: 4.2, dailyMax: null, currency: 'EUR', basis: '€4.20 an hour', source: 'https://www.parkrite.ie/' },
  { id: 'dub-irish-life', cityId: 'ie-lei-dublin', name: 'Park Rite, Irish Life Centre', operator: 'Park Rite', unitMinutes: 60, unitPrice: 4, dailyMax: 40, currency: 'EUR', basis: '€4 an hour, €40 a day', source: 'https://www.parkrite.ie/irish-life' },
  { id: 'dub-drury', cityId: 'ie-lei-dublin', name: 'APCOA, Drury Street', operator: 'APCOA', unitMinutes: 60, unitPrice: 4.5, dailyMax: null, currency: 'EUR', basis: '€4.50 an hour', source: 'https://www.apcoa.ie/' },
];
