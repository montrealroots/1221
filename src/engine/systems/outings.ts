/**
 * SLATE — what a bicycle, an e-bike and an ATV of one's own are for
 * (docs/WORLD.md, stage 3i), from 2026-09-30: a ride and an afternoon on the
 * trail, looked after as a workout and a boat's outing are (`systems/life.ts`).
 * Figures in `content/rides.ts`.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { ATV_OUTING, CYCLING } from '../content/rides';
import { exerts } from './body';
import { mayHurt } from './injury';
import { LAND_MARKETS } from '../content/land';
import { fineWeatherRefusal } from './dwelling';
import { parcelsOf } from './land';
import { jurisdictionOf, kindOf, modelById, vehiclesOf, type OwnedVehicle } from './vehicles';

const kindHere = (person: Person, kinds: readonly string[], at: (v: OwnedVehicle) => boolean): OwnedVehicle | undefined =>
  vehiclesOf(person).find((v) => v.soldAt === undefined && !v.repossessed && kinds.includes(kindOf(modelById(v.modelId)!)) && at(v));

/** Their own bicycle or e-bike where they are, an e-bike before a bicycle. */
export function bikeHere(person: Person): OwnedVehicle | undefined {
  const here = (v: OwnedVehicle) => (v.at ?? v.cityId) === person.currentLocationId;
  return kindHere(person, ['ebike'], here) ?? kindHere(person, ['bicycle'], here);
}

export function rideRefusal(sim: Simulation, person: Person): string | undefined {
  if (!bikeHere(person)) return 'You have no bicycle or e-bike here.';
  return fineWeatherRefusal(sim, person, 'ride');
}

/** The chance an hour's ride injures: DfT's cyclist casualties a mile at the Compendium's leisure pace, an e-bike's at the Oslo study's share. */
export function rideInjuryChance(bike: OwnedVehicle): number {
  const perHour = CYCLING.casualtiesPerMile * CYCLING.mph;
  return kindOf(modelById(bike.modelId)!) === 'ebike' ? perHour * CYCLING.ebikeRisk : perHour;
}

/** A ride's hour on the body: its effort at the Compendium's METs, and a crash drawn at a cyclist's risk (the chance given, for a test). */
export function rideOut(sim: Simulation, person: Person, bike: OwnedVehicle, chance = rideInjuryChance(bike)): void {
  exerts(person, kindOf(modelById(bike.modelId)!) === 'ebike' ? CYCLING.met.ebike : CYCLING.met.bicycle, 1);
  mayHurt(sim, person, 'crash', chance, sim.now);
}

/** An afternoon on the ATV: its effort, and no injury drawn, none being published a rider or an hour. */
export function trailOut(person: Person): void {
  exerts(person, ATV_OUTING.met, ATV_OUTING.hours);
}

/**
 * Their own ATV and acreage they own, in the state or province where they
 * are: an ATV is ridden off the road, on land one may ride, and SLATE keeps
 * one's own. It's taken there on its trailer, which isn't kept.
 */
export function trailFor(person: Person): OwnedVehicle | undefined {
  const j = jurisdictionOf(person.currentLocationId);
  if (!j) return undefined;
  const land = parcelsOf(person).some((p) => p.soldAt === undefined && LAND_MARKETS[p.market]?.kind === 'acreage' && jurisdictionOf(LAND_MARKETS[p.market]!.cityId) === j);
  return land ? kindHere(person, ['atv'], (v) => v.jurisdiction === j) : undefined;
}

export function trailRefusal(sim: Simulation, person: Person): string | undefined {
  if (!kindHere(person, ['atv'], () => true)) return 'You have no ATV.';
  if (!trailFor(person)) return 'An ATV is ridden on land you own: acreage in this state or province, and your ATV kept here.';
  return fineWeatherRefusal(sim, person, 'ride');
}
