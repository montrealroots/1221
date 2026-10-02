/**
 * SLATE — getting about in a wheelchair (the master plan's §51.4, from
 * 2026-10-02; `docs/research/world/research-access-availability.json`).
 *
 * **The need.** A life can use a wheelchair, said on Papers. A hotel whose
 * own pages say it can't take a wheelchair (Travelodge King's Cross, its
 * steps at the door) isn't bookable then; one that doesn't say is, and the
 * screen says it wasn't read (`namedStayRefusal`).
 *
 * **A disability parking permit**, applied for where you live, at the
 * place's fee: London's Blue Badge, up to £10; Vancouver's C$31; free in
 * Los Angeles and Toronto; Dublin's €35 and Mexico City's MX$486, each read
 * secondhand. New York's and New Haven's fees aren't published, so they're
 * issued without a charge and the screen says the fee wasn't found. With
 * one, a meter is free where the place lets permit holders park free: New
 * York, Los Angeles, Toronto, Dublin and Mexico City (the last secondhand).
 * Not in Westminster, whose zone is SLATE's London meter, one of the four
 * central boroughs that don't take the Blue Badge; nor in New Haven, where
 * the law waives the meter's time limit, not its payment; nor in
 * Vancouver, where holders are reported to pay.
 *
 * Not kept yet: stations without step-free access, paratransit, accessible
 * taxis, and homes, the rarest of them, 0.15% of America's in its 2011
 * survey.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { inSaveMoney } from './banking';
import { spend } from './household';

/** A permit's fee where you live, in its money, null where not published; and whether a meter is free with it. */
export const PERMITS: Readonly<Record<string, { name: string; fee: number | null; currency: string; freeMeters: boolean }>> = {
  'us-ny-newyork': { name: 'A Parking Permit For People With Disabilities', fee: null, currency: 'USD', freeMeters: true },
  'us-ca-losangeles': { name: 'A Disabled Person Placard', fee: 0, currency: 'USD', freeMeters: true },
  'us-ct-newhaven': { name: 'A Disability Placard', fee: null, currency: 'USD', freeMeters: false },
  'ca-on-toronto': { name: 'An Accessible Parking Permit', fee: 0, currency: 'CAD', freeMeters: true },
  'ca-bc-vancouver': { name: 'A Disability Parking Permit', fee: 31, currency: 'CAD', freeMeters: false },
  'uk-eng-london': { name: 'A Blue Badge', fee: 10, currency: 'GBP', freeMeters: false },
  'ie-lei-dublin': { name: 'A Disabled Parking Permit', fee: 35, currency: 'EUR', freeMeters: true },
  'mx-cmx-mexicocity': { name: 'Disability Plates', fee: 486, currency: 'MXN', freeMeters: true },
};

export const usesWheelchair = (person: Person): boolean => person.mobility === 'wheelchair';

/** Whether the meter is free for them in a town: a permit of that town where it lets holders park free. */
export const meterFree = (person: Person, cityId: string): boolean => person.parkingPermit?.cityId === cityId && PERMITS[cityId]?.freeMeters === true;

export function permitRefusal(person: Person): string | undefined {
  if (!usesWheelchair(person)) return 'A permit is for a wheelchair user.';
  const city = person.home?.cityId;
  if (!city || !PERMITS[city]) return 'SLATE doesn’t have the permit where you live.';
  if (person.parkingPermit?.cityId === city) return 'You have one.';
  return undefined;
}

export function registerAccess(sim: Simulation): void {
  sim.onCommand<{ wheelchair: boolean }, { wheelchair: boolean }>('health.mobility', (p, { sim: s }) => {
    const person = s.player;
    if (p?.wheelchair) person.mobility = 'wheelchair';
    else { delete person.mobility; delete person.parkingPermit; }
    return { wheelchair: usesWheelchair(person) };
  });

  sim.onCommand<Record<string, never>, { paid: Money }>('health.parking_permit', (_p, { sim: s }) => {
    const person = s.player;
    const no = permitRefusal(person);
    if (no) throw new CommandError(no);
    const city = person.home!.cityId;
    const permit = PERMITS[city]!;
    const paid = permit.fee ? inSaveMoney(s, Math.round(permit.fee * 100), permit.currency) : 0;
    if (paid > 0 && !spend(s, person, paid, `${permit.name}, ${CITIES.require(city).name}`, 'vehicle')) throw new CommandError('The payment didn’t go through.');
    person.parkingPermit = { cityId: city, at: s.now };
    return { paid };
  });
}
