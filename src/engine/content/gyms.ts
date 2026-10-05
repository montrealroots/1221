/**
 * SLATE — gyms by town (Stage 11 of `docs/BACKLOG.md`, recreation, from
 * 2026-10-01), from `docs/research/world/research-gyms.json`, each read on
 * 2026-10-01 from its own page or, where the page refused, from a search's
 * summary of it (`read`). A gym whose adult price wasn't found isn't here.
 *
 * Prices are monthly, in the town's money; a Canadian chain's every two
 * weeks is turned into a month's, 26 over 12. A joining or annual fee that
 * wasn't published is null and isn't charged, said so on the screen, never
 * taken as nothing paid. A minimum term is in months, 0 for none.
 *
 * **Tax** on a membership, as each place taxes it: New York City's own
 * 4.5% city tax and no state tax (Tax Bulletin TB-ST-329); Connecticut's
 * 6.35%; none in California; Ontario's 13% HST; British Columbia's 5% GST
 * and no provincial tax. Britain's, Ireland's and Mexico's prices include
 * their VAT or IVA.
 *
 * Hours are local. A day a listing gives none of is closed; Friday keeps
 * its own where it differs.
 */

import type { Week } from './storehours';

/**
 * A membership's own terms for leaving, where its gym published them (from
 * 2026-10-05, the cancellation notes of `research-gyms.json`, read on
 * 2026-10-01 as each gym's `read` says): notice before it ends, in days,
 * business days, or to the end of a calendar month; a buy-out that ends a
 * term at once in place of its months; a fee to leave at all; and days from
 * joining in which leaving gives back what joining paid. `said` is the gym's
 * own words, as read. Where none were published, leaving is SLATE's reading
 * (`leavingCost` in `systems/gyms.ts`).
 */
export interface LeaveTerms {
  notice?: { days: number; business?: true } | 'calendar-month';
  buyOut?: number;
  fee?: number;
  refundDays?: number;
  said: string;
}

export interface GymTier { name: string; monthly: number; joining: number | null; annual: number | null; termMonths: number; minAge?: number; maxAge?: number; leave?: LeaveTerms }
export interface Gym { id: string; name: string; cityId: string; address: string; currency: string; week?: Week; pool: boolean; tiers: readonly GymTier[]; read: 'page' | 'search-summary'; source: string }

const ALL_DAY: Week = { weekdays: { open: 0, close: 24 }, saturday: { open: 0, close: 24 }, sunday: { open: 0, close: 24 } };
const w = (weekdays: [number, number], saturday: [number, number], sunday: [number, number], friday?: [number, number]): Week => ({
  weekdays: { open: weekdays[0], close: weekdays[1] }, saturday: { open: saturday[0], close: saturday[1] }, sunday: { open: sunday[0], close: sunday[1] },
  ...(friday ? { friday: { open: friday[0], close: friday[1] } } : {}),
});
const biweekly = (price: number) => Math.round((price * 26 / 12) * 100) / 100;

/** The tax added to a membership's price, by town; none where it's included or not taxed. */
export const GYM_TAX: Readonly<Record<string, number>> = { 'us-ny-newyork': 0.045, 'us-ct-newhaven': 0.0635, 'ca-on-toronto': 0.13, 'ca-bc-vancouver': 0.05 };

export const GYMS: readonly Gym[] = [
  { id: 'planet-fitness-union-square', name: 'Planet Fitness Union Square', cityId: 'us-ny-newyork', address: '22 E 14th St, New York, NY 10003', currency: 'USD', week: w([5, 23], [7, 19], [7, 19], [5, 22]), pool: false, read: 'search-summary', source: 'https://www.planetfitness.com/gyms/manhattan-union-square-ny/offers',
    tiers: [{ name: 'Classic', monthly: 19, joining: 59, annual: 59, termMonths: 12 }, { name: 'PF Black Card', monthly: 37.99, joining: 1, annual: 0, termMonths: 0 }] },
  { id: 'mcburney-ymca', name: 'McBurney YMCA', cityId: 'us-ny-newyork', address: '125 West 14th Street, New York, NY 10011', currency: 'USD', week: w([6, 21], [8, 17], [8, 17]), pool: true, read: 'page', source: 'https://ymcanyc.org/locations/mcburney-ymca/membership',
    tiers: [{ name: 'Adult', monthly: 129, joining: 0, annual: 0, termMonths: 0, minAge: 18, maxAge: 64, leave: { said: 'No contracts, no annual fees' } }, { name: 'Senior', monthly: 104, joining: 0, annual: 0, termMonths: 0, minAge: 65, leave: { said: 'No contracts' } }] },
  { id: 'puregym-park-slope', name: 'PureGym Park Slope', cityId: 'us-ny-newyork', address: '227 4th Ave, Brooklyn, NY 11215', currency: 'USD', week: ALL_DAY, pool: false, read: 'page', source: 'https://www.puregym.com/us/gyms/ny/brooklyn-227-fourth-avenue',
    tiers: [{ name: 'Core', monthly: 24, joining: 40, annual: null, termMonths: 12, leave: { notice: { days: 7, business: true }, buyOut: 60, refundDays: 14, said: 'Cancelling a 12-month commitment early costs a $60 buy-out fee; to end at expiry give 7 business days’ notice; 14-day cooling-off cancellation with full refund' } }, { name: 'Premium, No Commitment', monthly: 34, joining: 20, annual: null, termMonths: 0, leave: { notice: { days: 7 }, said: 'Cancel any time; notice due at least 7 days before the next dues date' } }, { name: 'Premium Plus', monthly: 43, joining: 10, annual: null, termMonths: 12, leave: { notice: { days: 7, business: true }, buyOut: 60, said: '$60 early buy-out fee; 7 business days’ notice before expiry' } }] },
  { id: 'planet-fitness-new-haven', name: 'Planet Fitness New Haven', cityId: 'us-ct-newhaven', address: '160 Amity Rd, New Haven, CT 06515', currency: 'USD', week: w([5, 23], [7, 19], [7, 19], [5, 21]), pool: false, read: 'search-summary', source: 'https://www.planetfitness.com/gyms/new-haven-ct/offers',
    tiers: [{ name: 'Classic', monthly: 15, joining: 59, annual: 49, termMonths: 0 }, { name: 'PF Black Card', monthly: 24.99, joining: 1, annual: 49, termMonths: 0 }] },
  { id: 'city-climb-gym', name: 'City Climb Gym', cityId: 'us-ct-newhaven', address: '432 Science Park, New Haven, CT 06511', currency: 'USD', week: w([14, 22], [10, 20], [10, 20]), pool: false, read: 'page', source: 'http://www.cityclimbgym.com/pricing',
    tiers: [{ name: 'Adult', monthly: 62, joining: 25, annual: null, termMonths: 0 }] },
  { id: '24-hour-fitness-mid-wilshire', name: '24 Hour Fitness Mid Wilshire Sport', cityId: 'us-ca-losangeles', address: '3699 Wilshire Blvd, Suite 110, Los Angeles, CA 90010', currency: 'USD', week: w([5, 24], [5, 21], [5, 21], [5, 21]), pool: true, read: 'page', source: 'https://www.24hourfitness.com/gyms/los-angeles-ca/mid-wilshire-sport',
    tiers: [{ name: 'GetFit', monthly: 24.99, joining: 5.99, annual: 69.99, termMonths: 0 }, { name: 'KeepFit', monthly: 39.99, joining: 5.99, annual: 69.99, termMonths: 0 }] },
  { id: 'ketchum-downtown-ymca', name: 'Ketchum-Downtown YMCA', cityId: 'us-ca-losangeles', address: '401 S Hope Street, Los Angeles, CA 90071', currency: 'USD', week: w([5.5, 21], [8, 16], [9, 13], [5.5, 20]), pool: true, read: 'search-summary', source: 'https://www.ymcala.org/locations/ketchum-downtown-ymca/',
    tiers: [{ name: 'Adult', monthly: 57, joining: 10, annual: null, termMonths: 0, leave: { notice: { days: 15 }, refundDays: 30, said: 'All cancellations require 15 days advance written notice before your next draft date; a 30-day money-back policy for new members' } }] },
  { id: 'golds-gym-venice', name: 'Gold’s Gym Venice', cityId: 'us-ca-losangeles', address: '360 Hampton Drive, Venice (Los Angeles), CA 90291', currency: 'USD', week: w([5, 23], [5, 23], [5, 23]), pool: false, read: 'search-summary', source: 'https://www.goldsgym.com/locations/ca/venice/join/',
    tiers: [{ name: 'Monthly', monthly: 119.99, joining: 0, annual: null, termMonths: 0, leave: { said: 'Easy online cancellation request' } }] },
  { id: 'puregym-holborn', name: 'PureGym London Holborn', cityId: 'uk-eng-london', address: 'Lacon House, 84 Theobalds Road, London WC1X 8RW', currency: 'GBP', week: ALL_DAY, pool: false, read: 'page', source: 'https://www.puregym.com/gyms/london-holborn/',
    tiers: [{ name: 'Core', monthly: 41.99, joining: 24.99, annual: null, termMonths: 0, leave: { said: 'No contract, cancel any time' } }, { name: 'Plus', monthly: 52.99, joining: 24.99, annual: null, termMonths: 0, leave: { said: 'No contract, cancel any time' } }] },
  { id: 'the-gym-group-caledonian-road', name: 'The Gym Group Caledonian Road', cityId: 'uk-eng-london', address: '7 Sterling Way, London N7 9HJ', currency: 'GBP', week: ALL_DAY, pool: false, read: 'page', source: 'https://www.thegymgroup.com/find-a-gym/north-london-gyms/london-caledonian-road/',
    tiers: [{ name: 'Standard', monthly: 30.99, joining: 15, annual: null, termMonths: 0, leave: { said: 'No long-term commitment on month-to-month memberships' } }, { name: 'Ultimate', monthly: 38.99, joining: 15, annual: null, termMonths: 0, leave: { said: 'No long-term commitment on month-to-month memberships' } }] },
  { id: 'third-space-islington', name: 'Third Space Islington', cityId: 'uk-eng-london', address: '15 Esther Anne Place, London N1 1UL', currency: 'GBP', week: w([5.5, 22], [7, 21], [7, 21]), pool: true, read: 'page', source: 'https://www.thirdspace.london/clubs/islington/',
    tiers: [{ name: 'Club', monthly: 287, joining: 100, annual: null, termMonths: 0, leave: { notice: 'calendar-month', said: 'One full calendar month’s notice; request by the 1st of a month to end on the last day of that month' } }] },
  { id: 'virgin-active-strand', name: 'Virgin Active Strand', cityId: 'uk-eng-london', address: 'Shell-Mex House, 80 The Strand, London WC2R 0DT', currency: 'GBP', week: w([6.5, 21], [9, 18], [9, 18]), pool: true, read: 'page', source: 'https://www.virginactive.co.uk/clubs/strand/membership-rates',
    tiers: [{ name: 'Twelve Months', monthly: 160, joining: 25, annual: null, termMonths: 12 }, { name: 'Rolling Monthly', monthly: 218, joining: 50, annual: null, termMonths: 0 }] },
  { id: 'highbury-leisure-centre', name: 'Highbury Leisure Centre', cityId: 'uk-eng-london', address: 'Highbury Crescent, Islington, London N5 1RR', currency: 'GBP', week: w([6.5, 22], [8, 18], [8, 18]), pool: true, read: 'page', source: 'https://www.better.org.uk/leisure-centre/london/islington/highbury/memberships',
    tiers: [{ name: 'Better Health Islington', monthly: 64.2, joining: null, annual: null, termMonths: 0 }] },
  { id: 'bd-gyms-carlisle', name: 'BD Gyms Carlisle', cityId: 'ie-lei-dublin', address: '52-54 Kimmage Road West, Terenure, Kimmage, Dublin D12 X379', currency: 'EUR', week: w([6, 22], [8.5, 17.5], [8.5, 17.5]), pool: false, read: 'page', source: 'https://bdgyms.com/carlisle/',
    tiers: [{ name: 'Monthly', monthly: 36, joining: 0, annual: null, termMonths: 0, leave: { said: 'No contract, cancel anytime' } }] },
  { id: 'flyefit-jervis-street', name: 'FLYEfit Jervis Street', cityId: 'ie-lei-dublin', address: 'Jervis Shopping Centre, Jervis Lane Upper, North City, Dublin 1', currency: 'EUR', week: w([5.5, 23.5], [7.5, 19.5], [7.5, 19.5]), pool: false, read: 'page', source: 'https://www.flyefit.ie/gyms/jervis-street/',
    tiers: [{ name: 'Single Gym', monthly: 38, joining: 25, annual: null, termMonths: 0, leave: { said: 'No contract' } }, { name: 'All Gyms', monthly: 41, joining: 25, annual: null, termMonths: 0, leave: { said: 'No contract' } }] },
  { id: 'fit4less-overlea', name: 'Fit4Less Overlea Boulevard', cityId: 'ca-on-toronto', address: 'B24-45 Overlea Boulevard, Toronto, ON M4H 1C3', currency: 'CAD', week: ALL_DAY, pool: false, read: 'page', source: 'https://www.fit4less.ca/memberships',
    tiers: [{ name: '4Less Card', monthly: biweekly(7.99), joining: null, annual: 49.99, termMonths: 0, leave: { said: 'No commitment period' } }, { name: 'Black Card', monthly: biweekly(13.99), joining: null, annual: 49.99, termMonths: 0, leave: { said: 'No commitment period' } }] },
  { id: 'planet-fitness-college-park', name: 'Planet Fitness College Park', cityId: 'ca-on-toronto', address: '444 Yonge St Units G1 and G4, Toronto, ON M5B 2H4', currency: 'CAD', week: ALL_DAY, pool: false, read: 'search-summary', source: 'https://www.planetfitness.ca/gyms/toronto-college-park/offers',
    tiers: [{ name: 'Classic', monthly: 15, joining: 39, annual: 49, termMonths: 0, leave: { said: 'No commitment' } }, { name: 'PF Black Card', monthly: 29.99, joining: 1, annual: 49, termMonths: 0, leave: { said: '$1 down with no commitment' } }] },
  { id: 'central-ymca-toronto', name: 'Central YMCA', cityId: 'ca-on-toronto', address: '20 Grosvenor Street, Toronto, ON M4Y 2V5', currency: 'CAD', week: w([6, 22], [7, 22], [7, 22]), pool: true, read: 'page', source: 'https://www.ymcagta.org/find-a-y/central-ymca',
    tiers: [{ name: 'Young Adult', monthly: 49, joining: 0, annual: null, termMonths: 0, minAge: 22, maxAge: 29 }, { name: 'Adult', monthly: 63, joining: 0, annual: null, termMonths: 0, minAge: 30 }] },
  { id: 'fitness-world-kitsilano', name: 'Fitness World Kitsilano', cityId: 'ca-bc-vancouver', address: '2150 West Broadway, #200, Vancouver BC V6K 4L9', currency: 'CAD', week: w([6, 23], [7, 20], [7, 20]), pool: false, read: 'page', source: 'https://fitnessworld.ca/locations/kitsilano/',
    tiers: [{ name: 'Move', monthly: biweekly(12.99), joining: null, annual: 59.99, termMonths: 0, leave: { notice: { days: 30 }, said: 'Month-to-month: 30 days’ notice' } }, { name: 'Fit', monthly: biweekly(17.99), joining: null, annual: 59.99, termMonths: 0, leave: { notice: { days: 30 }, said: 'Month-to-month: 30 days’ notice' } }] },
  { id: 'ywca-health-fitness-vancouver', name: 'YWCA Health + Fitness Centre', cityId: 'ca-bc-vancouver', address: '535 Hornby Street, Vancouver, BC V6C 2E8', currency: 'CAD', week: w([5.75, 21.5], [8, 17.5], [8, 17.5]), pool: true, read: 'page', source: 'https://ywcabc.org/fitness/membership/plans-and-pricing',
    tiers: [{ name: 'All-Inclusive', monthly: 79, joining: 59, annual: null, termMonths: 0, leave: { notice: { days: 14 }, fee: 45, said: '$45 cancellation fee and two weeks’ notice' } }] },
  { id: 'smart-fit-reforma-26', name: 'Smart Fit Reforma 26', cityId: 'mx-cmx-mexicocity', address: 'Paseo de la Reforma 26 Nivel 1, Juárez, Ciudad de México, CDMX 06600', currency: 'MXN', week: w([6, 23], [8, 18], [8, 16]), pool: false, read: 'page', source: 'https://www.smartfit.com.mx/gimnasios/reforma-26',
    tiers: [{ name: 'Plan Black', monthly: 679, joining: 149, annual: 699, termMonths: 12 }, { name: 'Plan Smart', monthly: 699, joining: 149, annual: 699, termMonths: 0 }] },
  { id: 'anytime-fitness-miramontes', name: 'Anytime Fitness Miramontes', cityId: 'mx-cmx-mexicocity', address: 'Canal de Miramontes 2600, Coapa, Ciruelos, Coyoacán, 04830 Ciudad de México', currency: 'MXN', week: ALL_DAY, pool: false, read: 'page', source: 'https://payments.anytimefitness.com.mx/inscribeteEnLinea/mx-1176',
    tiers: [{ name: 'Six Months', monthly: 949, joining: 0, annual: null, termMonths: 6 }, { name: 'Twelve Months', monthly: 949, joining: 0, annual: null, termMonths: 12 }] },
];

export const gymById = (id: string): Gym | undefined => GYMS.find((g) => g.id === id);
