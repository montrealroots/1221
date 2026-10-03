/**
 * SLATE — each list of things to buy or book as a catalog (`systems/catalog.ts`,
 * Stage 2 of `docs/BACKLOG.md`, from 2026-10-01), every price in the save's
 * money and each list's price said the same way for every entry in it. The
 * screens arrange these, cheapest first unless the player sorts otherwise.
 */

import { CAR_DETAILS } from '../content/carspecs';
import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import type { Money } from '../core/money';
import type { VehicleKind } from '../content/vehiclecatalog';
import type { CarModel } from '../content/vehiclecatalog';
import { APPLIANCE_LABEL, type ApplianceKind } from '../content/appliances';
import { PIECE_LABEL, type Piece } from '../content/furniture';
import { LAND_MARKETS } from '../content/land';
import type { Project } from '../content/homes';
import { STAY_CLASS_LABEL, type StayClass, type RatePlan } from '../content/staytypes';
import { RENTAL_CLASS_LABEL, type RentalClass } from '../content/rentals';
import type { CatalogEntry } from './catalog';
import { inSaveMoney } from './banking';
import { modelsFor, quote, type OwnedVehicle } from './vehicles';
import { askingPrice, listingsIn, projectsFor, type Listing as HomeListing, type OwnedHome } from './homes';
import { listingsFor, type Listing as LandListing } from './land';
import { pieceCost } from './furniture';
import { applianceCost } from './appliances';
import { MODS, MOD_LABEL, MOD_PRICE, type Mod } from './mods';
import { stayClassesIn, stayPrice } from './stays';
import { rentalClassesIn, rentalQuote } from './rentals';

const known = (price: Money | undefined, kind: CatalogEntry['priceKind'] = 'advertised'): Pick<CatalogEntry, 'price' | 'priceKind'> => (price === undefined ? { price: null, priceKind: 'unknown' } : { price, priceKind: kind });

/** The models of a kind sold where they live, each at its whole price taxed and registered, new or of an age. */
export function vehicleCatalog(sim: Simulation, person: Person, cityId: string, kind: VehicleKind, age = 0): CatalogEntry<CarModel>[] {
  return modelsFor(cityId, kind).map((m) => {
    const q = quote(m, cityId, sim.now, { age, person });
    return {
      id: m.id, label: `${m.make} ${m.model}`, value: m, basis: 'Total, Taxed And Registered',
      ...(typeof q === 'string' ? { price: null, priceKind: 'unknown' as const } : known(inSaveMoney(sim, q.total, q.currency), age > 0 ? 'estimate' : 'advertised')),
      // Its body and drivetrain where its maker's page states them (`content/carspecs.ts`, from 2026-10-03).
      facets: { make: m.make, fuel: m.fuel, ...(CAR_DETAILS[m.id]?.body ? { body: CAR_DETAILS[m.id]!.body! } : {}), ...(CAR_DETAILS[m.id]?.drivetrain ? { drivetrain: CAR_DETAILS[m.id]!.drivetrain! } : {}) },
      words: `${m.trim} ${m.fuel} ${Object.values(CAR_DETAILS[m.id] ?? {}).join(' ')}`,
    };
  });
}

/** A town's homes for sale, at their asking prices. */
export function homeCatalog(sim: Simulation, cityId: string): CatalogEntry<HomeListing>[] {
  return listingsIn(sim, cityId).map((l) => ({
    id: l.id, label: l.address, value: l, basis: 'Asking Price', price: askingPrice(sim, l, sim.now), priceKind: 'estimate' as const,
    facets: { type: l.type, beds: `${l.beds}` }, words: `${l.type} ${l.features.join(' ')}`,
  }));
}

/** Land for sale near them, at the asking prices. */
export function landCatalog(sim: Simulation, person: Person, cityId: string): CatalogEntry<LandListing>[] {
  return listingsFor(sim, person, cityId).map((l) => {
    const m = LAND_MARKETS[l.market]!;
    return { id: l.id, label: `${m.label}, ${Math.round(l.acres * 100) / 100} Acres`, value: l, basis: 'Asking Price', price: inSaveMoney(sim, l.asking, m.currency), priceKind: 'estimate' as const, facets: { kind: m.kind } };
  });
}

/** The pieces of furniture sold where they live, delivered and taxed. */
export function furnitureCatalog(sim: Simulation, cityId: string): CatalogEntry<Piece>[] {
  return (Object.keys(PIECE_LABEL) as Piece[]).map((piece) => ({ id: piece, label: PIECE_LABEL[piece], value: piece, basis: 'Delivered, Taxed', ...known(pieceCost(sim, cityId, piece)?.amount) }));
}

/** The appliances fitted where a home is, bought and installed. */
export function applianceCatalog(sim: Simulation, cityId: string): CatalogEntry<ApplianceKind>[] {
  return (Object.keys(APPLIANCE_LABEL) as ApplianceKind[]).map((kind) => ({ id: kind, label: APPLIANCE_LABEL[kind], value: kind, basis: 'Bought And Fitted', ...known(applianceCost(sim, cityId, kind)) }));
}

/** The works a home can have, at their cost before a permit. */
export function projectCatalog(sim: Simulation, person: Person, owned: OwnedHome): CatalogEntry<Project>[] {
  return projectsFor(sim, person, owned).map((p) => ({ id: p.project.id, label: p.project.label, value: p.project, basis: 'The Work, Before A Permit', price: p.cost, priceKind: 'estimate' as const }));
}

/** The modifications a car can have, fitted. */
export function modCatalog(sim: Simulation): CatalogEntry<Mod>[] {
  return MODS.map((mod) => ({ id: mod, label: MOD_LABEL[mod], value: mod, basis: 'Fitted', price: inSaveMoney(sim, Math.round(MOD_PRICE[mod] * 100), 'GBP'), priceKind: 'advertised' as const }));
}

/** The kinds of stay a town has, each for the whole stay, taxes in. */
export function stayCatalog(sim: Simulation, cityId: string, nights: number, plan: RatePlan, resident: boolean, inMotorhome: boolean, from: Instant): CatalogEntry<StayClass>[] {
  return stayClassesIn(cityId, inMotorhome).map((cls) => ({ id: cls, label: STAY_CLASS_LABEL[cls], value: cls, basis: 'The Whole Stay, Taxes In', ...known(stayPrice(sim, cityId, nights, 1, cls, plan, resident, from)?.price, 'estimate') }));
}

/** The classes of car a town's airport rents, each for the whole rental. */
export function rentalCatalog(sim: Simulation, person: Person, cityId: string, pickupAt: Instant, returnAt: Instant, waived: boolean): CatalogEntry<RentalClass>[] {
  return rentalClassesIn(cityId).map((cls) => {
    const q = rentalQuote(sim, person, cityId, pickupAt, returnAt, true, waived, cls);
    return { id: cls, label: RENTAL_CLASS_LABEL[cls], value: cls, basis: 'The Whole Rental', ...(typeof q === 'string' ? { price: null, priceKind: 'unknown' as const } : known(q.total)) };
  });
}

export type { OwnedVehicle };
