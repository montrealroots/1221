/**
 * SLATE — Property: search, agents, transactions, construction and interiors.
 *
 * Buying a home is not "click Buy, subtract money". It is showings, offers,
 * counteroffers, an inspection that finds things, an appraisal that can come in
 * low, financing that has to actually be approved, closing costs, and a
 * transfer of ownership that then creates taxes, insurance and utilities.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type {
  ConstructionPhase, ConstructionPhaseId, Furnishing, Id, Property, PropertyKind,
  PropertyListing, PropertyOffer, RealEstateAgent, Room, Structure, Zone,
} from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, formatDate, MS_DAY } from '../core/time';
import { applyRate, formatMoney, type Money } from '../core/money';
import { CITIES, NEIGHBOURHOODS } from '../content/geography';
import { isWaterfront } from '../content/places';
import { costOfLiving, propertyTaxRate } from '../content/tax';
import { CATALOG, retailPrice } from '../content/catalog';
import { generateAddress, generatePersonName } from '../content/names';
import { buildFactors } from '../core/audit';
import { createAsset } from './commerce';
import { createBill } from './finance';
import { amortisedPayment, offeredApr } from './finance';
import { requireAge } from './lifespan';

// ---------------------------------------------------------------------------
// Property shapes
// ---------------------------------------------------------------------------

interface KindProfile {
  bedrooms: [number, number];
  sqft: [number, number];
  lotMultiplier: [number, number];
  priceMultiplier: [number, number];
  features: string[];
  rentable: boolean;
}

export const PROPERTY_PROFILES: Readonly<Record<PropertyKind, KindProfile>> = {
  apartment: { bedrooms: [0, 3], sqft: [420, 1400], lotMultiplier: [0, 0], priceMultiplier: [0.55, 0.95], features: ['Elevator', 'Doorman', 'Shared Laundry', 'Balcony'], rentable: true },
  condo: { bedrooms: [1, 4], sqft: [700, 2200], lotMultiplier: [0, 0], priceMultiplier: [0.75, 1.25], features: ['Concierge', 'Gym', 'Pool', 'Parking Space'], rentable: true },
  townhouse: { bedrooms: [2, 5], sqft: [1200, 2800], lotMultiplier: [1.1, 1.6], priceMultiplier: [0.9, 1.5], features: ['Private Entrance', 'Roof Terrace', 'Garage'], rentable: true },
  house: { bedrooms: [2, 6], sqft: [1300, 3600], lotMultiplier: [2, 5], priceMultiplier: [0.95, 2.0], features: ['Garden', 'Garage', 'Fireplace', 'Study', 'Private Dock'], rentable: true },
  villa: { bedrooms: [3, 7], sqft: [2800, 6500], lotMultiplier: [3, 9], priceMultiplier: [2.2, 4.5], features: ['Pool', 'Courtyard', 'Guest Suite', 'Wine Cellar', 'Private Dock'], rentable: false },
  mansion: { bedrooms: [5, 12], sqft: [7000, 22000], lotMultiplier: [6, 40], priceMultiplier: [5, 18], features: ['Pool', 'Screening Room', 'Gym', 'Staff Quarters', 'Tennis Court', 'Wine Cellar', 'Gated', 'Private Dock'], rentable: false },
  estate: { bedrooms: [6, 16], sqft: [12000, 45000], lotMultiplier: [40, 400], priceMultiplier: [9, 40], features: ['Gatehouse', 'Stables', 'Screening Room', 'Guest Houses', 'Helipad', 'Vineyard', 'Private Dock'], rentable: false },
  penthouse: { bedrooms: [2, 6], sqft: [2400, 9000], lotMultiplier: [0, 0], priceMultiplier: [3.5, 12], features: ['Private Elevator', 'Terrace', 'Skyline View', 'Concierge'], rentable: false },
  ranch: { bedrooms: [3, 8], sqft: [2600, 9000], lotMultiplier: [200, 3000], priceMultiplier: [1.6, 6], features: ['Barn', 'Paddocks', 'Well', 'Workshop'], rentable: false },
  farm: { bedrooms: [2, 6], sqft: [1600, 4500], lotMultiplier: [300, 4000], priceMultiplier: [1.1, 4], features: ['Barn', 'Orchard', 'Irrigation', 'Equipment Shed'], rentable: false },
  cabin: { bedrooms: [1, 4], sqft: [600, 2200], lotMultiplier: [5, 60], priceMultiplier: [0.5, 1.6], features: ['Wood Stove', 'Deck', 'Lake Access', 'Off Grid'], rentable: true },
  land: { bedrooms: [0, 0], sqft: [0, 0], lotMultiplier: [10, 2000], priceMultiplier: [0.15, 1.4], features: ['Utilities At Street', 'Graded', 'View Lot', 'Zoned Residential'], rentable: false },
  private_island: { bedrooms: [0, 10], sqft: [0, 18000], lotMultiplier: [400, 8000], priceMultiplier: [14, 90], features: ['Private Dock', 'Airstrip', 'Desalination', 'Staff Compound'], rentable: false },
  office: { bedrooms: [0, 0], sqft: [900, 60000], lotMultiplier: [0, 4], priceMultiplier: [0.9, 6], features: ['Open Plan', 'Conference Rooms', 'Parking', 'Loading Dock'], rentable: true },
  studio_lot: { bedrooms: [0, 0], sqft: [40000, 900000], lotMultiplier: [20, 400], priceMultiplier: [12, 120], features: ['Sound Stages', 'Backlot', 'Mill', 'Post Facilities', 'Commissary'], rentable: false },
  sound_stage: { bedrooms: [0, 0], sqft: [8000, 40000], lotMultiplier: [2, 20], priceMultiplier: [3, 22], features: ['Soundproofed', 'Grid', 'Power Drop', 'Loading Dock'], rentable: true },
  retail: { bedrooms: [0, 0], sqft: [700, 9000], lotMultiplier: [0, 3], priceMultiplier: [0.8, 4], features: ['Street Frontage', 'Storage', 'Back Office'], rentable: true },
};

export const ROOM_KINDS = [
  'living', 'kitchen', 'dining', 'bedroom', 'bathroom', 'office', 'den',
  'laundry', 'garage', 'theater', 'gym', 'nursery', 'pantry', 'hallway', 'foyer',
] as const;

export interface DesignTheme {
  id: string;
  name: string;
  description: string;
  /** Multiplier on furnishing quality contribution when the theme is coherent. */
  coherenceBonus: number;
  palette: string[];
  materials: string[];
}

/** A seller comes back with a number at most this many times. */
export const MAX_SELLER_COUNTERS = 2;
/** Days a countered offer stays open for your answer. */
export const COUNTER_DAYS = 2;

export const DESIGN_THEMES: readonly DesignTheme[] = [
  { id: 'warm_minimal', name: 'Warm Minimal', description: 'Few things, all of them good. Plaster, oak and linen.', coherenceBonus: 1.18, palette: ['Bone', 'Oat', 'Clay', 'Charcoal'], materials: ['Lime Plaster', 'White Oak', 'Linen', 'Travertine'] },
  { id: 'mid_century', name: 'Mid-Century', description: 'Walnut, low profiles, and a lot of confident angles.', coherenceBonus: 1.15, palette: ['Walnut', 'Mustard', 'Teal', 'Cream'], materials: ['Walnut', 'Brass', 'Wool Boucle', 'Terrazzo'] },
  { id: 'industrial', name: 'Industrial', description: 'Concrete, steel and honest structure left visible.', coherenceBonus: 1.10, palette: ['Concrete', 'Black', 'Rust', 'Ash'], materials: ['Polished Concrete', 'Blackened Steel', 'Reclaimed Timber'] },
  { id: 'classic', name: 'Classic', description: 'Mouldings, symmetry and furniture that outlives you.', coherenceBonus: 1.22, palette: ['Ivory', 'Navy', 'Oxblood', 'Gilt'], materials: ['Mahogany', 'Marble', 'Silk', 'Brass'] },
  { id: 'coastal', name: 'Coastal', description: 'Light, air, and finishes that survive salt.', coherenceBonus: 1.12, palette: ['White', 'Sea Glass', 'Sand', 'Driftwood'], materials: ['Bleached Oak', 'Rattan', 'Cotton', 'Limestone'] },
  { id: 'maximalist', name: 'Maximalist', description: 'Pattern, color and nothing left plain.', coherenceBonus: 1.08, palette: ['Emerald', 'Fuchsia', 'Gold', 'Cobalt'], materials: ['Velvet', 'Lacquer', 'Malachite', 'Brass'] },
];

// ---------------------------------------------------------------------------
// Construction dependency graph
// ---------------------------------------------------------------------------

interface PhaseSpec {
  phase: ConstructionPhaseId;
  name: string;
  dependsOn: ConstructionPhaseId[];
  /** Fraction of total budget. */
  budgetShare: number;
  /** Days for a typical single-family build. */
  days: number;
  /** Chance per phase of an inspection or delay event. */
  riskRate: number;
}

export const CONSTRUCTION_PHASES: readonly PhaseSpec[] = [
  { phase: 'concept', name: 'Concept And Program', dependsOn: [], budgetShare: 0.005, days: 14, riskRate: 0.05 },
  { phase: 'architect', name: 'Appoint Architect', dependsOn: ['concept'], budgetShare: 0.02, days: 21, riskRate: 0.08 },
  { phase: 'design', name: 'Schematic Design', dependsOn: ['architect'], budgetShare: 0.045, days: 45, riskRate: 0.18 },
  { phase: 'plans', name: 'Construction Documents', dependsOn: ['design'], budgetShare: 0.035, days: 40, riskRate: 0.14 },
  { phase: 'zoning', name: 'Zoning Review', dependsOn: ['plans'], budgetShare: 0.01, days: 35, riskRate: 0.28 },
  { phase: 'permits', name: 'Building Permits', dependsOn: ['zoning'], budgetShare: 0.018, days: 50, riskRate: 0.32 },
  { phase: 'bids', name: 'Contractor Bids', dependsOn: ['permits'], budgetShare: 0.004, days: 25, riskRate: 0.12 },
  { phase: 'contracts', name: 'Award Contracts', dependsOn: ['bids'], budgetShare: 0.004, days: 14, riskRate: 0.08 },
  { phase: 'site_work', name: 'Site Work And Excavation', dependsOn: ['contracts'], budgetShare: 0.05, days: 25, riskRate: 0.30 },
  { phase: 'foundation', name: 'Foundation', dependsOn: ['site_work'], budgetShare: 0.09, days: 30, riskRate: 0.22 },
  { phase: 'framing', name: 'Framing', dependsOn: ['foundation'], budgetShare: 0.13, days: 45, riskRate: 0.18 },
  { phase: 'mechanical', name: 'Mechanical Systems', dependsOn: ['framing'], budgetShare: 0.06, days: 25, riskRate: 0.14 },
  { phase: 'electrical', name: 'Electrical Rough-in', dependsOn: ['framing'], budgetShare: 0.05, days: 22, riskRate: 0.14 },
  { phase: 'plumbing', name: 'Plumbing Rough-in', dependsOn: ['framing'], budgetShare: 0.05, days: 22, riskRate: 0.16 },
  { phase: 'envelope', name: 'Roof, Windows And Cladding', dependsOn: ['framing'], budgetShare: 0.10, days: 35, riskRate: 0.20 },
  { phase: 'insulation', name: 'Insulation And Rough Inspection', dependsOn: ['mechanical', 'electrical', 'plumbing', 'envelope'], budgetShare: 0.025, days: 14, riskRate: 0.26 },
  { phase: 'drywall', name: 'Drywall And Plaster', dependsOn: ['insulation'], budgetShare: 0.045, days: 25, riskRate: 0.10 },
  { phase: 'flooring', name: 'Flooring', dependsOn: ['drywall'], budgetShare: 0.045, days: 20, riskRate: 0.10 },
  { phase: 'cabinetry', name: 'Cabinetry And Millwork', dependsOn: ['drywall'], budgetShare: 0.065, days: 30, riskRate: 0.16 },
  { phase: 'fixtures', name: 'Fixtures And Appliances', dependsOn: ['cabinetry', 'flooring'], budgetShare: 0.055, days: 18, riskRate: 0.14 },
  { phase: 'interior_finish', name: 'Paint And Interior Finish', dependsOn: ['fixtures'], budgetShare: 0.04, days: 22, riskRate: 0.10 },
  { phase: 'landscaping', name: 'Landscaping And Hardscape', dependsOn: ['envelope'], budgetShare: 0.05, days: 30, riskRate: 0.18 },
  { phase: 'final_inspection', name: 'Final Inspection', dependsOn: ['interior_finish', 'landscaping'], budgetShare: 0.005, days: 10, riskRate: 0.34 },
  { phase: 'punch_list', name: 'Punch List', dependsOn: ['final_inspection'], budgetShare: 0.015, days: 18, riskRate: 0.20 },
  { phase: 'handover', name: 'Handover And Occupancy', dependsOn: ['punch_list'], budgetShare: 0.005, days: 5, riskRate: 0.05 },
];

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerProperty(sim: Simulation): void {
  sim.onSchedule('prop.refresh_listings', () => {
    refreshListings(sim);
    sim.schedule({ at: addDays(sim.now, 10, sim.homeZone), kind: 'prop.refresh_listings', label: 'New Property Listings', category: 'property', priority: 65 });
  });
  sim.onSchedule('prop.offer_response', (item) => respondToOffer(sim, item.payload.offerId as Id));
  sim.onSchedule('prop.inspection', (item) => runInspection(sim, item.payload.offerId as Id));
  // Closing day is the purchase system's to ask about: sit at the table,
  // sign remotely, or ask for a few more days. Nothing closes by the clock.
  sim.onSchedule('prop.closing', (item) => {
    sim.emit('prop.closing_due', { offerId: item.payload.offerId, itemId: item.id });
  });
  // A showing coming round is the viewing system's to ask about: play it,
  // look around, or skip it. Nothing is marked seen by the clock alone.
  sim.onSchedule('prop.showing', (item) => {
    sim.emit('prop.showing_due', { listingId: item.payload.listingId, itemId: item.id });
  });
  sim.onSchedule('build.phase_tick', (item) => advanceConstruction(sim, item.payload.projectId as Id));
  sim.onSchedule('prop.market_tick', () => {
    driftMarket(sim);
    sim.schedule({ at: addDays(sim.now, 30, sim.homeZone), kind: 'prop.market_tick', label: 'Property Market', category: 'system', priority: 92 });
  });

  // --- Commands ------------------------------------------------------------

  sim.onCommand<{ listingId: Id; at: number }, { scheduledItemId: Id }>(
    'prop.book_showing',
    (p, { sim: s }) => {
      const listing = s.universe.propertyListings[p.listingId];
      if (!listing || listing.status !== 'active') throw new CommandError('That listing is no longer available.');
      const property = s.universe.properties[listing.propertyId];
      const item = s.schedule({
        at: p.at,
        kind: 'prop.showing',
        label: `Showing — ${property?.addressLine ?? 'property'}`,
        category: 'property',
        payload: { listingId: listing.id },
        priority: 50,
        refType: 'listing', refId: listing.id,
        requiresPlayer: true,
        locationId: property?.locationId,
        durationMinutes: 60,
      });
      return { scheduledItemId: item.id };
    },
  );

  sim.onCommand<{ listingId: Id; amount: Money; financingKind: PropertyOffer['financingKind']; downPayment?: Money; contingencies?: PropertyOffer['contingencies']; agentId?: Id }, { offerId: Id }>(
    'prop.make_offer',
    (p, { sim: s }) => {
      // Buying a house is signing for yourself.
      requireAge(s, 'majority');
      const listing = s.universe.propertyListings[p.listingId];
      if (!listing || listing.status !== 'active') throw new CommandError('That listing is no longer available.');
      const property = s.universe.properties[listing.propertyId];
      if (!property) throw new CommandError('That property no longer exists.');
      const player = s.player;

      const downPayment = p.downPayment ?? (p.financingKind === 'cash' ? p.amount : Math.round(p.amount * 0.2));
      const refusal = offerRefusal(s, p.amount, p.financingKind, downPayment);
      if (refusal) throw new CommandError(refusal);
      const accountId = player.primaryAccountId;

      const earnest = Math.round(p.amount * 0.01);
      if (accountId) {
        s.expense(accountId, earnest, 'Earnest money deposit', 'housing', { refType: 'listing', refId: listing.id });
      }

      const offer: PropertyOffer = {
        id: s.nextId('offer'),
        saveId: s.universe.meta.id,
        listingId: listing.id,
        propertyId: property.id,
        buyerId: player.id,
        amount: p.amount,
        earnestMoney: earnest,
        financingKind: p.financingKind,
        downPayment,
        contingencies: p.contingencies ?? ['inspection', 'financing', 'appraisal'],
        status: 'submitted',
        submittedAt: s.now,
        respondBy: addDays(s.now, 3, s.homeZone),
        agentId: p.agentId ?? listing.agentId,
        history: [{ at: s.now, note: `Offer submitted at ${formatMoney(p.amount)} against an asking price of ${formatMoney(listing.askingPrice)}.` }],
      };
      s.universe.propertyOffers[offer.id] = offer;

      s.schedule({
        at: offer.respondBy,
        kind: 'prop.offer_response',
        label: `Seller Response — ${property.addressLine}`,
        category: 'property',
        payload: { offerId: offer.id },
        priority: 40,
        refType: 'offer', refId: offer.id,
      });
      s.emit('prop.offer_submitted', { offerId: offer.id, propertyId: property.id, amount: p.amount });
      return { offerId: offer.id };
    },
  );

  sim.onCommand<{ offerId: Id; accept: boolean; counterAmount?: Money }, { status: string }>(
    'prop.respond_to_counter',
    (p, { sim: s }) => {
      const offer = s.universe.propertyOffers[p.offerId];
      if (!offer || offer.status !== 'countered') throw new CommandError('There is no counteroffer to respond to.');
      if (!p.accept) {
        if (p.counterAmount === undefined) {
          offer.status = 'withdrawn';
          offer.history.push({ at: s.now, note: 'You walked away.' });
          refundEarnest(s, offer);
          const listing = s.universe.propertyListings[offer.listingId];
          if (listing && listing.status === 'pending') listing.status = 'active';
          s.emit('prop.counter_answered', { offerId: offer.id, accept: false, walked: true });
          return { status: offer.status };
        }
        if (!Number.isFinite(p.counterAmount) || p.counterAmount <= 0) throw new CommandError('Counter with a number.');
        const refusal = offerRefusal(s, p.counterAmount, offer.financingKind, offer.financingKind === 'cash' ? p.counterAmount : Math.round(p.counterAmount * 0.2));
        if (refusal) throw new CommandError(refusal);
        offer.amount = p.counterAmount;
        offer.downPayment = offer.financingKind === 'cash' ? p.counterAmount : Math.round(p.counterAmount * 0.2);
        offer.status = 'submitted';
        offer.respondBy = addDays(s.now, 2, s.homeZone);
        offer.history.push({ at: s.now, note: `You countered at ${formatMoney(p.counterAmount)}.` });
        s.schedule({
          at: offer.respondBy, kind: 'prop.offer_response',
          label: 'Seller Response', category: 'property',
          payload: { offerId: offer.id }, priority: 40,
          refType: 'offer', refId: offer.id,
        });
        s.emit('prop.counter_answered', { offerId: offer.id, accept: false, counterAmount: p.counterAmount });
        return { status: offer.status };
      }

      offer.amount = offer.counterAmount ?? offer.amount;
      offer.downPayment = offer.financingKind === 'cash' ? offer.amount : Math.round(offer.amount * 0.2);
      offer.history.push({ at: s.now, note: `You accepted the counter at ${formatMoney(offer.amount)}.` });
      s.emit('prop.counter_answered', { offerId: offer.id, accept: true });
      acceptOffer(s, offer);
      return { status: offer.status };
    },
  );

  sim.onCommand<{ offerId: Id; proceed: boolean; renegotiate?: Money }, { status: string; reduced?: boolean }>(
    'prop.inspection_decision',
    (p, { sim: s }) => {
      const offer = s.universe.propertyOffers[p.offerId];
      if (!offer) throw new CommandError('No such offer.');
      if (!offer.inspectionFindings) throw new CommandError('The inspection has not happened yet.');
      if (offer.status !== 'accepted') throw new CommandError('That purchase is no longer open.');
      if (offer.inspectionDecidedAt) throw new CommandError('The inspection contingency has already been answered.');
      offer.inspectionDecidedAt = s.now;

      if (!p.proceed) {
        offer.status = 'withdrawn';
        offer.history.push({ at: s.now, note: 'You withdrew after the inspection.' });
        refundEarnest(s, offer);
        s.timeline.cancelFor('offer', offer.id, s.now);
        const listing = s.universe.propertyListings[offer.listingId];
        if (listing) listing.status = 'active';
        s.emit('prop.inspection_decided', { offerId: offer.id, proceed: false });
        return { status: offer.status };
      }

      let reduced: boolean | undefined;
      if (p.renegotiate !== undefined) {
        const rng = s.rng('reneg', offer.id);
        const listing = s.universe.propertyListings[offer.listingId];
        const reduction = offer.amount - p.renegotiate;
        const findings = offer.inspectionFindings.reduce((sum, f) => sum + f.estimate, 0);
        const reasonable = reduction <= findings * 1.2;
        const accepted = reasonable && rng.chance(clamp(0.35 + (listing?.sellerMotivation ?? 50) / 160, 0.2, 0.9));
        if (!Number.isFinite(p.renegotiate) || p.renegotiate <= 0 || p.renegotiate >= offer.amount) throw new CommandError('Ask for a number under the price.');
        reduced = accepted;
        if (accepted) {
          offer.amount = p.renegotiate;
          offer.downPayment = offer.financingKind === 'cash' ? offer.amount : Math.round(offer.amount * 0.2);
          offer.history.push({ at: s.now, note: `Seller accepted a reduction to ${formatMoney(p.renegotiate)} for the inspection findings.` });
        } else {
          offer.history.push({ at: s.now, note: `Seller refused a reduction to ${formatMoney(p.renegotiate)}. The original price stands.` });
        }
      }
      s.emit('prop.inspection_decided', { offerId: offer.id, proceed: true, renegotiate: p.renegotiate, reduced });
      return { status: offer.status, reduced };
    },
  );

  sim.onCommand<{ propertyId: Id; months: number; accountId?: Id }, { propertyId: Id; monthlyRent: Money }>(
    'prop.rent',
    (p, { sim: s }) => {
      // A lease is a contract, and a contract needs somebody who can sign one.
      requireAge(s, 'lease');
      const property = s.universe.properties[p.propertyId];
      if (!property) throw new CommandError('No such property.');
      if (!property.monthlyRent) throw new CommandError('That property is not available to rent.');
      const player = s.player;
      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');

      const deposit = property.monthlyRent * 2;
      const upfront = deposit + property.monthlyRent;
      if (s.ledger.availableFunds(accountId) < upfront) {
        throw new CommandError(`Moving in needs ${formatMoney(upfront)} up front: first month plus a two-month deposit.`);
      }
      s.expense(accountId, upfront, `Move-in — ${property.addressLine}`, 'housing', { refType: 'property', refId: property.id });

      property.ownerKind = 'none';
      property.tenure = 'rented';
      property.leaseEndsAt = addDays(s.now, p.months * 30, s.homeZone);
      property.isPrimaryResidence = true;

      moveIn(s, player.id, property.id);
      createBill(s, {
        payerId: player.id,
        name: `Rent — ${property.addressLine}`,
        category: 'housing',
        amount: property.monthlyRent,
        frequency: 'monthly',
        firstDueAt: addDays(s.now, 30, s.homeZone),
        autopayAccountId: accountId,
        refType: 'property', refId: property.id,
        endsAt: property.leaseEndsAt,
      });

      s.emit('prop.rented', { propertyId: property.id, personId: player.id, monthlyRent: property.monthlyRent, months: p.months });
      s.remember({
        category: 'property',
        title: `Moved Into ${property.addressLine}`,
        detail: `${formatMoney(property.monthlyRent)} a month, ${p.months}-month lease.`,
        refs: [{ type: 'property', id: property.id }],
        significance: 50, public: false, amount: property.monthlyRent,
      });
      return { propertyId: property.id, monthlyRent: property.monthlyRent };
    },
  );

  // --- Construction --------------------------------------------------------

  sim.onCommand<{ propertyId: Id; name: string; budget: Money; structures: { kind: Structure['kind']; sqft: number; floors: number }[]; accountId?: Id }, { projectId: Id; targetCompletionAt: number }>(
    'build.start',
    (p, { sim: s }) => {
      const property = s.universe.properties[p.propertyId];
      if (!property) throw new CommandError('No such parcel.');
      if (property.ownerId !== s.player.id) throw new CommandError('You have to own the land before you can build on it.');
      if (p.structures.length === 0) throw new CommandError('A build needs at least one structure.');

      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to fund the build from.');
      const deposit = Math.round(p.budget * 0.08);
      if (s.ledger.availableFunds(accountId) < deposit) {
        throw new CommandError(`Starting a build needs about ${formatMoney(deposit)} for design and permitting up front.`);
      }

      const totalDays = CONSTRUCTION_PHASES.reduce((sum, ph) => sum + ph.days, 0);
      const project = {
        id: s.nextId('build'),
        saveId: s.universe.meta.id,
        ownerId: s.player.id,
        propertyId: property.id,
        name: p.name,
        status: 'planning' as const,
        budget: p.budget,
        contingency: Math.round(p.budget * 0.12),
        spent: 0,
        startedAt: s.now,
        targetCompletionAt: addDays(s.now, totalDays, s.homeZone),
        actualCompletionAt: undefined,
        phaseIds: [] as Id[],
        changeOrderIds: [] as Id[],
        plannedStructures: p.structures,
        architectName: `${generatePersonName(s.rng('architect', property.id)).first} ${generatePersonName(s.rng('architect2', property.id)).last} Architects`,
        generalContractor: `${generatePersonName(s.rng('gc', property.id)).last} Construction`,
      };
      s.universe.constructionProjects[project.id] = project;

      for (const spec of CONSTRUCTION_PHASES) {
        const phase: ConstructionPhase = {
          id: s.nextId('build'),
          saveId: s.universe.meta.id,
          projectId: project.id,
          phase: spec.phase,
          name: spec.name,
          dependsOn: spec.dependsOn,
          status: spec.dependsOn.length === 0 ? 'ready' : 'blocked',
          budgeted: Math.round(p.budget * spec.budgetShare),
          spent: 0,
          plannedDays: spec.days,
          actualDays: 0,
          notes: [],
        };
        s.universe.constructionPhases[phase.id] = phase;
        project.phaseIds.push(phase.id);
      }

      property.tenure = 'under_construction';
      s.expense(accountId, deposit, `${p.name} — design deposit`, 'construction', { refType: 'build', refId: project.id });
      project.spent += deposit;

      s.schedule({
        at: addDays(s.now, 7, s.homeZone),
        kind: 'build.phase_tick',
        label: `${p.name} — Construction Progress`,
        category: 'property',
        payload: { projectId: project.id },
        priority: 60,
        refType: 'build', refId: project.id,
      });

      s.remember({
        category: 'property',
        title: `Broke Ground On ${p.name}`,
        detail: `${p.structures.length} structure${p.structures.length === 1 ? '' : 's'}, budget ${formatMoney(p.budget)}, targeting ${formatDate(project.targetCompletionAt, s.homeZone)}.`,
        refs: [{ type: 'build', id: project.id }, { type: 'property', id: property.id }],
        significance: 70, public: false, amount: p.budget,
      });
      s.emit('build.started', { projectId: project.id, propertyId: property.id, budget: p.budget });
      return { projectId: project.id, targetCompletionAt: project.targetCompletionAt };
    },
  );

  sim.onCommand<{ changeOrderId: Id; approve: boolean }, { approved: boolean }>(
    'build.decide_change_order',
    (p, { sim: s }) => {
      const order = s.universe.changeOrders[p.changeOrderId];
      if (!order || order.status !== 'proposed') throw new CommandError('That change order is not open.');
      const project = s.universe.constructionProjects[order.projectId];
      if (!project) throw new CommandError('No such build.');

      order.status = p.approve ? 'approved' : 'rejected';
      order.decidedAt = s.now;
      s.resolveDecision('change_order', order.id);

      if (p.approve) {
        project.budget += order.costDelta;
        project.targetCompletionAt = addDays(project.targetCompletionAt, order.daysDelta, s.homeZone);
        const phase = Object.values(s.universe.constructionPhases).find((ph) => ph.projectId === project.id && ph.phase === order.phase);
        phase?.notes.push({ at: s.now, note: `Change order approved: ${order.description}`, deltaDays: order.daysDelta, deltaCost: order.costDelta });
      } else if (order.initiatedBy === 'inspector') {
        // Refusing an inspector is not an option; the phase simply cannot pass.
        const phase = Object.values(s.universe.constructionPhases).find((ph) => ph.projectId === project.id && ph.phase === order.phase);
        if (phase) {
          phase.status = 'failed_inspection';
          phase.notes.push({ at: s.now, note: 'Required remediation refused. This phase cannot pass inspection until it is done.' });
        }
      }
      s.emit('build.change_order_decided', { changeOrderId: order.id, approved: p.approve });
      return { approved: p.approve };
    },
  );

  // --- Interiors -----------------------------------------------------------

  sim.onCommand<{ structureId: Id; kind: string; name: string; floor: number; sqft: number }, { roomId: Id }>(
    'prop.add_room',
    (p, { sim: s }) => {
      const structure = s.universe.structures[p.structureId];
      if (!structure) throw new CommandError('No such structure.');
      const room: Room = {
        id: s.nextId('room'),
        saveId: s.universe.meta.id,
        structureId: structure.id,
        floor: p.floor,
        kind: p.kind,
        name: p.name,
        sqft: p.sqft,
        finishes: {},
        zoneIds: [],
        quality: 30,
      };
      s.universe.rooms[room.id] = room;
      structure.roomIds.push(room.id);
      return { roomId: room.id };
    },
  );

  sim.onCommand<FinishRoomSpec, { cost: Money; quality: number }>(
    'prop.finish_room',
    (p, { sim: s }) => finishRoom(s, p),
  );

  sim.onCommand<{ roomId: Id; name: string; purpose: string }, { zoneId: Id }>(
    'prop.add_zone',
    (p, { sim: s }) => {
      const room = s.universe.rooms[p.roomId];
      if (!room) throw new CommandError('No such room.');
      const zone: Zone = {
        id: s.nextId('room'),
        saveId: s.universe.meta.id,
        roomId: room.id,
        name: p.name,
        purpose: p.purpose,
        furnishingIds: [],
      };
      s.universe.zones[zone.id] = zone;
      room.zoneIds.push(zone.id);
      return { zoneId: zone.id };
    },
  );

  sim.onCommand<BuyFurnishingSpec, { furnishingIds: Id[]; cost: Money }>(
    'prop.buy_furnishing',
    (p, { sim: s }) => buyFurnishing(s, p),
  );

  sim.onCommand<{ propertyId: Id; askingPrice: Money; agentId?: Id }, { listingId: Id }>(
    'prop.list_for_sale',
    (p, { sim: s }) => {
      const property = s.universe.properties[p.propertyId];
      if (!property || property.ownerId !== s.player.id) throw new CommandError('You do not own that property.');
      const listing: PropertyListing = {
        id: s.nextId('listing'),
        saveId: s.universe.meta.id,
        propertyId: property.id,
        askingPrice: p.askingPrice,
        status: 'active',
        agentId: p.agentId,
        listedAt: s.now,
        daysOnMarket: 0,
        sellerMotivation: 40,
        viewedByPlayer: true,
      };
      s.universe.propertyListings[listing.id] = listing;
      property.listedForSale = { price: p.askingPrice, since: s.now, agentId: p.agentId };
      s.emit('prop.listed', { listingId: listing.id, propertyId: property.id, askingPrice: p.askingPrice });
      return { listingId: listing.id };
    },
  );
}

// ---------------------------------------------------------------------------
// Rooms: finishing and furnishing, one rule for the command and for a scene
// ---------------------------------------------------------------------------

export interface FinishRoomSpec { roomId: Id; themeId?: string; walls?: string; floor?: string; ceiling?: string; lighting?: string; accountId?: Id }
export interface BuyFurnishingSpec { catalogId: string; roomId?: Id; zoneId?: Id; propertyId: Id; retailerId?: string; accountId?: Id; quantity?: number }

/** What finishing a room the way the spec says would cost, before anything is paid. */
export function finishCost(sim: Simulation, spec: FinishRoomSpec): Money {
  const room = sim.universe.rooms[spec.roomId];
  if (!room) return 0;
  const structure = sim.universe.structures[room.structureId];
  const property = structure ? sim.universe.properties[structure.propertyId] : undefined;
  if (!property) return 0;
  const changes = [spec.walls, spec.floor, spec.ceiling, spec.lighting].filter(Boolean).length;
  return Math.round(room.sqft * 34_00 * costOfLiving(property.locationId) * (changes / 4 || 0.25));
}

export function finishRoom(sim: Simulation, p: FinishRoomSpec): { cost: Money; quality: number } {
  const room = sim.universe.rooms[p.roomId];
  if (!room) throw new CommandError('No such room.');
  const structure = sim.universe.structures[room.structureId];
  const property = structure ? sim.universe.properties[structure.propertyId] : undefined;
  if (!property) throw new CommandError('That room is not attached to a property.');

  const accountId = p.accountId ?? sim.player.primaryAccountId;
  if (!accountId) throw new CommandError('No account to pay from.');

  const cost = finishCost(sim, p);
  if (sim.ledger.availableFunds(accountId) < cost) {
    throw new CommandError(`Finishing ${room.name} costs about ${formatMoney(cost)}.`);
  }
  sim.expense(accountId, cost, `Finishes — ${room.name}`, 'home', { refType: 'room', refId: room.id });

  if (p.themeId) room.themeId = p.themeId;
  if (p.walls) room.finishes.walls = p.walls;
  if (p.floor) room.finishes.floor = p.floor;
  if (p.ceiling) room.finishes.ceiling = p.ceiling;
  if (p.lighting) room.finishes.lighting = p.lighting;

  recomputeRoomQuality(sim, room.id);
  sim.emit('prop.room_finished', { roomId: room.id, cost, quality: room.quality });
  return { cost, quality: room.quality };
}

/** The price of one catalog item delivered to a property, before anything is paid. */
export function furnishingPrice(sim: Simulation, catalogId: string, propertyId: Id, retailerId = 'formhouse'): Money {
  const property = sim.universe.properties[propertyId];
  if (!property || !CATALOG.get(catalogId)) return 0;
  return retailPrice(catalogId, retailerId, costOfLiving(property.locationId));
}

export function buyFurnishing(sim: Simulation, p: BuyFurnishingSpec): { furnishingIds: Id[]; cost: Money } {
  const catalogItem = CATALOG.get(p.catalogId);
  if (!catalogItem) throw new CommandError('No such item.');
  const property = sim.universe.properties[p.propertyId];
  if (!property) throw new CommandError('No such property.');

  const accountId = p.accountId ?? sim.player.primaryAccountId;
  if (!accountId) throw new CommandError('No account to pay from.');

  const quantity = clamp(p.quantity ?? 1, 1, 20);
  const unit = retailPrice(catalogItem.id, p.retailerId ?? 'formhouse', costOfLiving(property.locationId));
  const cost = unit * quantity;
  if (sim.ledger.availableFunds(accountId) < cost) {
    throw new CommandError(`${catalogItem.name} costs ${formatMoney(unit)} each, ${formatMoney(cost)} in total.`);
  }
  sim.expense(accountId, cost, `${catalogItem.name}${quantity > 1 ? ` x${quantity}` : ''}`, 'home', { refType: 'property', refId: property.id });

  const ids: Id[] = [];
  for (let i = 0; i < quantity; i++) {
    const furnishing: Furnishing = {
      id: sim.nextId('furn'),
      saveId: sim.universe.meta.id,
      zoneId: p.zoneId,
      roomId: p.roomId,
      propertyId: property.id,
      catalogId: catalogItem.id,
      name: catalogItem.name,
      category: catalogItem.category,
      purchasePrice: unit,
      currentValue: unit,
      condition: 100,
      purchasedAt: sim.now,
      qualityContribution: catalogItem.qualityContribution ?? Math.round(catalogItem.quality / 8),
    };
    sim.universe.furnishings[furnishing.id] = furnishing;
    // A sofa is a thing you own, not only a number on the room. This is the
    // object itself: it has a room, a condition, and something to do with it.
    const asset = createAsset(sim, {
      ownerId: sim.player.id, catalogItem, purchasePrice: unit, acquiredVia: 'purchase',
    });
    asset.roomId = p.roomId;
    asset.locationPropertyId = property.id;
    furnishing.assetId = asset.id;
    ids.push(furnishing.id);
    if (p.zoneId) sim.universe.zones[p.zoneId]?.furnishingIds.push(furnishing.id);
  }

  if (p.roomId) recomputeRoomQuality(sim, p.roomId);
  sim.emit('prop.furnishing_added', { propertyId: property.id, catalogId: catalogItem.id, quantity, cost });
  return { furnishingIds: ids, cost };
}

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

export function estimateMonthlyIncome(sim: Simulation, personId: Id): Money {
  const from = sim.now - 180 * MS_DAY;
  const owned = new Set(sim.ledger.accountsOf(personId).map((a) => a.id));
  let total = 0;
  for (const txn of sim.universe.transactions) {
    if (txn.at < from) continue;
    const delta = txn.postings.reduce((s, p) => (owned.has(p.accountId) ? s + p.amount : s), 0);
    if (delta > 0 && ['salary', 'contract', 'royalty', 'creator', 'sponsorship'].includes(txn.category)) total += delta;
  }
  return Math.round(total / 6);
}

/**
 * Why an offer could not be made, or nothing: a deposit larger than the
 * offer, too little liquid for the deposit and closing, a payment a lender
 * will not carry. The command applies it; the viewing shows it.
 */
export function offerRefusal(sim: Simulation, amount: Money, financingKind: PropertyOffer['financingKind'], downPayment?: Money): string | undefined {
  const player = sim.player;
  const down = downPayment ?? (financingKind === 'cash' ? amount : Math.round(amount * 0.2));
  if (down > amount) return 'The deposit cannot exceed the offer.';
  // You must be able to actually complete. Lenders check; so do we.
  const liquid = player.primaryAccountId
    ? sim.ledger.accountsOf(player.id).filter((a) => a.kind === 'checking' || a.kind === 'savings' || a.kind === 'cash').reduce((sum, a) => sum + a.balance, 0)
    : 0;
  const closingEstimate = Math.round(amount * 0.028);
  if (liquid < down + closingEstimate) {
    return `You need about ${formatMoney(down + closingEstimate)} liquid for the deposit and closing costs. You have ${formatMoney(liquid)}.`;
  }
  if (financingKind !== 'cash') {
    const borrow = amount - down;
    const apr = offeredApr(player.creditScore, 'mortgage');
    const payment = amortisedPayment(borrow, apr, 360);
    const monthlyIncome = estimateMonthlyIncome(sim, player.id);
    if (monthlyIncome > 0 && payment > monthlyIncome * 0.45) {
      return `A lender will not approve this. The payment would be ${formatMoney(payment)} a month against income of about ${formatMoney(monthlyIncome)}.`;
    }
  }
  return undefined;
}

export function generateProperty(
  sim: Simulation, cityId: string, kind: PropertyKind, seedKey: string,
): Property {
  const rng = sim.rng('property', cityId, kind, seedKey);
  const city = CITIES.require(cityId);
  const profile = PROPERTY_PROFILES[kind];
  const hoods = NEIGHBOURHOODS.childrenOf(cityId);
  const hood = hoods.length > 0 ? rng.pick(hoods) : undefined;

  const bedrooms = rng.int(profile.bedrooms[0], profile.bedrooms[1]);
  const sqft = rng.int(profile.sqft[0], profile.sqft[1]);
  const lotSqft = Math.round(sqft * rng.float(profile.lotMultiplier[0], profile.lotMultiplier[1])) || rng.int(1500, 9000);
  const priceMultiplier = rng.float(profile.priceMultiplier[0], profile.priceMultiplier[1]);
  const hoodMultiplier = hood?.priceMultiplier ?? 1;
  const marketValue = Math.round(city.medianHomePriceCents * priceMultiplier * hoodMultiplier);

  // A dock only where there is water; a garage counted so the cars know.
  const pool = isWaterfront(city) ? profile.features : profile.features.filter((f) => f !== 'Private Dock');
  const featureCount = rng.int(1, Math.min(5, pool.length));
  const features = rng.shuffle(pool).slice(0, featureCount);

  const property: Property = {
    id: sim.nextId('prop'),
    saveId: sim.universe.meta.id,
    ownerKind: 'none',
    kind,
    name: `${kind === 'land' ? 'Vacant lot' : kind.replace(/_/g, ' ')} in ${hood?.name ?? city.name}`,
    addressLine: generateAddress(rng),
    locationId: cityId,
    neighbourhoodId: hood?.id,
    tenure: 'owned',
    bedrooms,
    bathrooms: Math.max(1, Math.round(bedrooms * rng.float(0.6, 1.2))),
    interiorSqft: sqft,
    lotSqft,
    yearBuilt: rng.int(1925, 2024),
    features,
    marketValue,
    monthlyRent: profile.rentable ? Math.round(city.medianRentCents * priceMultiplier * hoodMultiplier * rng.float(0.85, 1.2)) : undefined,
    condition: rng.int(52, 98),
    annualPropertyTaxRate: propertyTaxRate(cityId, sim.now),
    structureIds: [],
    isPrimaryResidence: false,
    createdAt: sim.now,
  };
  sim.universe.properties[property.id] = property;
  return property;
}

export function refreshListings(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;
  const cityId = player.currentLocationId;

  // Expire stale listings for properties nobody bought.
  for (const listing of Object.values(sim.universe.propertyListings)) {
    if (listing.status !== 'active') continue;
    listing.daysOnMarket = Math.round((sim.now - listing.listedAt) / MS_DAY);
    listing.sellerMotivation = clamp(30 + listing.daysOnMarket * 0.55, 20, 95);
    if (listing.daysOnMarket > 150) {
      listing.status = 'expired';
      const property = sim.universe.properties[listing.propertyId];
      if (property && !property.ownerId) delete sim.universe.properties[property.id];
      delete sim.universe.propertyListings[listing.id];
    }
  }

  const rng = sim.rng('listings', cityId, Math.floor(sim.now / (10 * MS_DAY)));
  const kinds: PropertyKind[] = ['apartment', 'condo', 'townhouse', 'house', 'house', 'villa', 'mansion', 'penthouse', 'cabin', 'land'];
  const count = rng.int(7, 13);

  for (let i = 0; i < count; i++) {
    const kind = rng.pick(kinds);
    const property = generateProperty(sim, cityId, kind, `${sim.now}-${i}`);
    const listing: PropertyListing = {
      id: sim.nextId('listing'),
      saveId: sim.universe.meta.id,
      propertyId: property.id,
      askingPrice: Math.round(property.marketValue * rng.float(0.97, 1.09)),
      status: 'active',
      agentId: pickAgent(sim, cityId, kind)?.id,
      listedAt: sim.now - rng.int(0, 30) * MS_DAY,
      daysOnMarket: 0,
      sellerMotivation: rng.int(25, 70),
      viewedByPlayer: false,
    };
    sim.universe.propertyListings[listing.id] = listing;
  }
  sim.emit('prop.listings_refreshed', { cityId, count });
}

export function ensureAgents(sim: Simulation, cityId: string): RealEstateAgent[] {
  const existing = Object.values(sim.universe.realEstateAgents).filter((a) => a.markets.includes(cityId));
  if (existing.length >= 4) return existing;

  const rng = sim.rng('agents', cityId);
  const brokerages = ['Wexford & Vale', 'Harbourstone Realty', 'Ellison Property Group', 'Marlowe Estates', 'Crestline Residential'];
  const created: RealEstateAgent[] = [];

  for (let i = existing.length; i < 5; i++) {
    const name = generatePersonName(rng);
    const personId = sim.nextId('person');
    sim.universe.people[personId] = makeMinimalNpc(sim, personId, name.first, name.last, cityId, 'real_estate_agent');

    const experience = rng.int(15, 96);
    const agent: RealEstateAgent = {
      id: sim.nextId('person'),
      saveId: sim.universe.meta.id,
      personId,
      brokerage: rng.pick(brokerages),
      specialties: rng.shuffle(['house', 'condo', 'apartment', 'mansion', 'townhouse', 'land', 'estate'] as PropertyKind[]).slice(0, rng.int(2, 4)),
      markets: [cityId],
      experience,
      negotiation: clamp(experience + rng.int(-20, 20), 10, 98),
      reputation: clamp(experience + rng.int(-25, 15), 10, 98),
      commissionRate: Number((0.02 + rng.float(0, 0.01)).toFixed(4)),
      workload: rng.int(2, 14),
      closedDeals: Math.round(experience * rng.float(0.5, 2.2)),
    };
    sim.universe.realEstateAgents[agent.id] = agent;
    created.push(agent);
  }
  return [...existing, ...created];
}

function pickAgent(sim: Simulation, cityId: string, kind: PropertyKind): RealEstateAgent | undefined {
  const agents = ensureAgents(sim, cityId);
  const suited = agents.filter((a) => a.specialties.includes(kind));
  return (suited.length > 0 ? suited : agents)[0];
}

function makeMinimalNpc(sim: Simulation, id: Id, first: string, last: string, cityId: string, role: string) {
  return {
    id, saveId: sim.universe.meta.id, isPlayer: false,
    firstName: first, lastName: last, displayName: `${first} ${last}`,
    pronouns: 'they/them',
    birthInstant: sim.now - 38 * 365 * MS_DAY,
    homeRegionId: cityId, citizenshipId: 'us', currentLocationId: cityId,
    personality: { openness: 50, conscientiousness: 65, extraversion: 70, agreeableness: 60, emotionalStability: 60, ambition: 60, riskTolerance: 45 },
    interests: [], goals: [], lifestyle: 'comfortable' as const, background: '',
    attributes: {}, traits: [], skills: {},
    wellbeing: { energy: 70, stress: 30, sleepDebt: 0, morale: 60, condition: 80, fitness: 50, travelFatigue: 0, nourishment: 70, hygiene: 80 },
    reputation: { publicFame: 0, audienceAppeal: 50, professionalReputation: 50, reliability: 60, prestige: 0, industryDemand: 0, controversy: 0 },
    careerTrack: 'civilian' as const, representation: {}, quote: 0,
    creditIds: [], nominationIds: [], creditScore: 700,
    tier: 'background' as const, industryRole: role, greenlightAuthority: 0,
    createdAt: sim.now,
  };
}

function respondToOffer(sim: Simulation, offerId: Id): void {
  const offer = sim.universe.propertyOffers[offerId];
  if (!offer || offer.status !== 'submitted') return;
  const listing = sim.universe.propertyListings[offer.listingId];
  const property = sim.universe.properties[offer.propertyId];
  if (!listing || !property) return;

  const rng = sim.rng('offer_response', offer.id, offer.amount);
  const ratio = offer.amount / listing.askingPrice;
  const agent = offer.agentId ? sim.universe.realEstateAgents[offer.agentId] : undefined;
  const cashBonus = offer.financingKind === 'cash' ? 0.08 : 0;
  const contingencyPenalty = offer.contingencies.length * 0.025;

  const { factors, score } = buildFactors([
    { label: 'Offer Against Asking', detail: `You offered ${formatMoney(offer.amount)} against ${formatMoney(listing.askingPrice)}, which is ${Math.round(ratio * 100)}%.`, weight: 0.52, value: clamp((ratio - 0.82) / 0.25, 0, 1.2) },
    { label: 'How Motivated The Seller Is', detail: `The listing has been up for ${listing.daysOnMarket} days.`, weight: 0.20, value: listing.sellerMotivation / 100 },
    { label: 'Cash Versus Financing', detail: offer.financingKind === 'cash' ? 'A cash offer removes financing risk entirely.' : 'A financed offer can fall through at the lender.', weight: 0.12, value: cashBonus > 0 ? 1 : 0.4 },
    { label: 'Contingencies', detail: `${offer.contingencies.length} contingenc${offer.contingencies.length === 1 ? 'y' : 'ies'} attached.`, weight: -0.14, value: clamp(contingencyPenalty * 8, 0, 1) },
    { label: 'Your Agent', detail: agent ? `${agent.brokerage} negotiating on your behalf.` : 'You are representing yourself.', weight: 0.10, value: agent ? agent.negotiation / 100 : 0.35 },
    { label: 'Competing Offers', detail: 'What else the seller is looking at, which you do not see.', weight: -0.18, value: rng.float(0, 1), knowable: false },
  ]);

  const roll = rng.next();
  const acceptProbability = clamp(score * 1.05 - 0.18, 0.02, 0.95);

  if (roll < acceptProbability) {
    offer.history.push({ at: sim.now, note: 'Seller accepted.' });
    sim.audit({
      kind: 'prop.offer_decided', subjectType: 'offer', subjectId: offer.id,
      question: 'Why was my offer accepted or refused?',
      summary: `Accepted at ${formatMoney(offer.amount)}.`,
      factors, seed: `offer_response|${offer.id}|${offer.amount}`, roll, probability: acceptProbability, score,
      outcome: 'accepted',
    });
    acceptOffer(sim, offer);
    return;
  }

  // Counter or reject. A seller comes back with a number at most twice.
  if (ratio > 0.88 && (offer.counterRounds ?? 0) < MAX_SELLER_COUNTERS && rng.chance(0.72)) {
    const counter = Math.round(listing.askingPrice * rng.float(0.965, 1.0));
    offer.status = 'countered';
    offer.counterAmount = counter;
    offer.counterRounds = (offer.counterRounds ?? 0) + 1;
    offer.history.push({ at: sim.now, note: `Seller countered at ${formatMoney(counter)}.` });
    sim.audit({
      kind: 'prop.offer_decided', subjectType: 'offer', subjectId: offer.id,
      question: 'Why was my offer countered?',
      summary: `Countered at ${formatMoney(counter)}.`,
      factors, seed: `offer_response|${offer.id}|${offer.amount}`, roll, probability: acceptProbability, score,
      outcome: 'countered',
    });
    offer.respondBy = addDays(sim.now, COUNTER_DAYS, sim.homeZone);
    sim.emit('prop.offer_countered', { offerId: offer.id, counterAmount: counter, round: offer.counterRounds, respondBy: offer.respondBy });
    return;
  }

  offer.status = 'rejected';
  offer.history.push({ at: sim.now, note: 'Seller rejected the offer.' });
  refundEarnest(sim, offer);
  if (listing.status === 'pending') listing.status = 'active';
  sim.audit({
    kind: 'prop.offer_decided', subjectType: 'offer', subjectId: offer.id,
    question: 'Why was my offer refused?',
    summary: `Rejected. At ${Math.round(ratio * 100)}% of asking it was not close enough.`,
    factors, seed: `offer_response|${offer.id}|${offer.amount}`, roll, probability: acceptProbability, score,
    outcome: 'rejected',
  });
  sim.notify({ category: 'property', title: `Offer Rejected: ${property.addressLine}`, body: `They turned down ${formatMoney(offer.amount)}.`, importance: 50, route: '/workspace/property' });
  sim.emit('prop.offer_rejected', { offerId: offer.id });
}

function acceptOffer(sim: Simulation, offer: PropertyOffer): void {
  offer.status = 'accepted';
  const listing = sim.universe.propertyListings[offer.listingId];
  if (listing) listing.status = 'pending';
  const property = sim.universe.properties[offer.propertyId];

  const inspectionAt = addDays(sim.now, 5, sim.homeZone);
  const closingAt = addDays(sim.now, 32, sim.homeZone);
  offer.inspectionAt = inspectionAt;
  offer.closingAt = closingAt;

  if (offer.contingencies.includes('inspection')) {
    sim.schedule({
      at: inspectionAt, kind: 'prop.inspection',
      label: `Inspection — ${property?.addressLine ?? 'property'}`,
      category: 'property',
      payload: { offerId: offer.id }, priority: 40,
      refType: 'offer', refId: offer.id,
      requiresPlayer: true, locationId: property?.locationId, durationMinutes: 180,
    });
  }
  sim.schedule({
    at: closingAt, kind: 'prop.closing',
    label: `Closing — ${property?.addressLine ?? 'property'}`,
    category: 'property',
    payload: { offerId: offer.id }, priority: 20,
    refType: 'offer', refId: offer.id,
    requiresPlayer: true, locationId: property?.locationId, durationMinutes: 120,
  });

  sim.notify({
    category: 'property',
    title: `Offer Accepted: ${property?.addressLine}`,
    body: `Closing is set for ${formatDate(closingAt, sim.homeZone)}.`,
    importance: 78, route: '/workspace/property',
  });
  sim.emit('prop.offer_accepted', { offerId: offer.id, propertyId: offer.propertyId, amount: offer.amount, closingAt });
}

function runInspection(sim: Simulation, offerId: Id): void {
  const offer = sim.universe.propertyOffers[offerId];
  const property = offer ? sim.universe.properties[offer.propertyId] : undefined;
  if (!offer || !property || offer.status !== 'accepted') return;

  const rng = sim.rng('inspection', offer.id);
  const issueCount = clamp(Math.round(remap(property.condition, 100, 40, 0, 6) + rng.int(-1, 2)), 0, 8);
  const catalogue: { item: string; severity: 'minor' | 'moderate' | 'major'; base: number }[] = [
    { item: 'Roof nearing end of life', severity: 'major', base: 22_000 },
    { item: 'Electrical panel undersized', severity: 'moderate', base: 6_500 },
    { item: 'Water heater past service life', severity: 'minor', base: 2_400 },
    { item: 'Foundation settlement cracking', severity: 'major', base: 34_000 },
    { item: 'HVAC needs replacement', severity: 'moderate', base: 11_000 },
    { item: 'Plumbing supply lines corroded', severity: 'moderate', base: 8_800 },
    { item: 'Window seals failed', severity: 'minor', base: 3_600 },
    { item: 'Drainage grading toward the house', severity: 'moderate', base: 7_200 },
    { item: 'Termite damage in the sill plate', severity: 'major', base: 18_500 },
  ];

  const findings = rng.shuffle(catalogue).slice(0, issueCount).map((f) => ({
    item: f.item,
    severity: f.severity,
    estimate: Math.round(f.base * 100 * costOfLiving(property.locationId) * rng.float(0.8, 1.3)),
  }));
  offer.inspectionFindings = findings;

  const accountId = sim.player.primaryAccountId;
  const fee = Math.round(650_00 * costOfLiving(property.locationId));
  if (accountId && sim.ledger.availableFunds(accountId) >= fee) {
    sim.expense(accountId, fee, 'Home inspection', 'housing', { refType: 'offer', refId: offer.id });
  }

  const total = findings.reduce((s, f) => s + f.estimate, 0);
  offer.history.push({ at: sim.now, note: `Inspection found ${findings.length} item${findings.length === 1 ? '' : 's'} totalling about ${formatMoney(total)}.` });

  const significant = findings.some((f) => f.severity === 'major') || total > offer.amount * 0.03;
  sim.emit('prop.inspection_complete', { offerId: offer.id, findings, total, significant });
}

export type ClosingOutcome =
  | { closed: true; cashPaid: Money; monthlyPayment?: Money }
  | { closed: false; reason: 'not_open' | 'insufficient_funds' | 'financing_declined'; detail: string };

/** What closing needs at the table today, from the offer as it stands. */
export function closingCash(offer: PropertyOffer): { closingCosts: Money; cashNeeded: Money } {
  const closingCosts = offer.closingCosts ?? Math.round(offer.amount * 0.026);
  const gap = offer.appraisalGap ?? 0;
  const cashNeeded = offer.financingKind === 'cash'
    ? offer.amount - offer.earnestMoney + closingCosts
    : offer.downPayment + gap - offer.earnestMoney + closingCosts;
  return { closingCosts, cashNeeded };
}

/**
 * The closing itself: the money moves, the deed changes hands, the universe
 * reacts. The appraisal has already happened a week before (the purchase
 * system's business); what can still go wrong at the table is the cash and
 * the lender, and both are reported rather than thrown so a scene can say so.
 */
export function closeTransaction(sim: Simulation, offerId: Id): ClosingOutcome {
  const offer = sim.universe.propertyOffers[offerId];
  if (!offer || offer.status !== 'accepted') return { closed: false, reason: 'not_open', detail: 'That purchase is not open to close.' };
  const property = sim.universe.properties[offer.propertyId];
  const buyer = sim.universe.people[offer.buyerId];
  if (!property || !buyer) return { closed: false, reason: 'not_open', detail: 'That house is gone.' };

  const accountId = buyer.primaryAccountId;
  if (!accountId) return { closed: false, reason: 'insufficient_funds', detail: 'You have no account to pay from.' };

  const { closingCosts, cashNeeded } = closingCash(offer);
  offer.closingCosts = closingCosts;

  if (sim.ledger.availableFunds(accountId) < cashNeeded) {
    offer.status = 'withdrawn';
    refundEarnest(sim, offer);
    const listing = sim.universe.propertyListings[offer.listingId];
    if (listing) listing.status = 'active';
    sim.timeline.cancelFor('offer', offer.id, sim.now);
    const detail = `You needed ${formatMoney(cashNeeded)} at closing on ${property.addressLine} and had ${formatMoney(sim.ledger.availableFunds(accountId))}.`;
    offer.history.push({ at: sim.now, note: `Closing failed. ${detail}` });
    sim.notify({ category: 'property', title: 'Closing Failed', body: `${detail} Your deposit has been returned.`, importance: 88, route: '/workspace/property' });
    sim.emit('prop.closing_failed', { offerId: offer.id, reason: 'insufficient_funds' });
    return { closed: false, reason: 'insufficient_funds', detail };
  }

  // Mortgage first, so the cash requirement is the deposit rather than the price.
  let mortgageAccountId: Id | undefined;
  let monthlyPayment: Money | undefined;
  if (offer.financingKind !== 'cash') {
    const borrow = offer.amount - offer.downPayment - (offer.appraisalGap ?? 0);
    const result = sim.execute<{ accountId: Id; monthlyPayment: Money; apr: number }>({
      kind: 'finance.take_loan',
      payload: {
        borrowerId: buyer.id, principal: borrow, months: 360, product: 'mortgage',
        refType: 'property', refId: property.id,
        name: `Mortgage — ${property.addressLine}`,
      },
    });
    if (!result.ok) {
      offer.status = 'withdrawn';
      refundEarnest(sim, offer);
      const listing = sim.universe.propertyListings[offer.listingId];
      if (listing) listing.status = 'active';
      sim.timeline.cancelFor('offer', offer.id, sim.now);
      const detail = result.error ?? 'The lender declined.';
      offer.history.push({ at: sim.now, note: `Financing declined at closing. ${detail}` });
      sim.notify({ category: 'property', title: 'Financing Declined', body: `${detail} Your deposit has been returned.`, importance: 88, route: '/workspace/property' });
      sim.emit('prop.closing_failed', { offerId: offer.id, reason: 'financing_declined' });
      return { closed: false, reason: 'financing_declined', detail };
    }
    mortgageAccountId = result.value?.accountId;
    monthlyPayment = result.value?.monthlyPayment;
    // The loan funds the purchase directly; the buyer brings the deposit and any appraisal gap.
    sim.expense(accountId, offer.downPayment + (offer.appraisalGap ?? 0) - offer.earnestMoney, `Down payment — ${property.addressLine}`, 'housing', { refType: 'property', refId: property.id });
  } else {
    sim.expense(accountId, offer.amount - offer.earnestMoney, `Purchase — ${property.addressLine}`, 'housing', { refType: 'property', refId: property.id });
  }

  sim.expense(accountId, closingCosts, `Closing costs — ${property.addressLine}`, 'housing', { refType: 'property', refId: property.id });

  property.ownerId = buyer.id;
  property.ownerKind = 'person';
  property.tenure = 'owned';
  property.purchasePrice = offer.amount;
  property.purchasedAt = sim.now;
  property.mortgageAccountId = mortgageAccountId;
  property.marketValue = Math.max(property.marketValue, offer.amount);

  offer.status = 'closed';
  offer.closedAt = sim.now;
  offer.history.push({ at: sim.now, note: `Closed at ${formatMoney(offer.amount)}. Closing costs ${formatMoney(closingCosts)}.` });
  const listing = sim.universe.propertyListings[offer.listingId];
  if (listing) listing.status = 'sold';
  sim.timeline.cancelFor('offer', offer.id, sim.now);

  // This is the event that makes the rest of the universe react.
  sim.emit('property.purchased', {
    propertyId: property.id, buyerId: buyer.id, amount: offer.amount,
    financed: offer.financingKind !== 'cash', locationId: property.locationId,
  });

  sim.remember({
    category: 'property',
    title: `Bought ${property.addressLine}`,
    detail: `${property.kind.replace(/_/g, ' ')} in ${CITIES.require(property.locationId).name}. ${formatMoney(offer.amount)}${offer.financingKind === 'cash' ? ' in cash' : ` with ${formatMoney(offer.downPayment)} down`}.`,
    refs: [{ type: 'property', id: property.id }],
    significance: 82, public: false, amount: offer.amount,
  });
  return { closed: true, cashPaid: cashNeeded, monthlyPayment };
}

export function refundEarnest(sim: Simulation, offer: PropertyOffer): void {
  const buyer = sim.universe.people[offer.buyerId];
  const accountId = buyer?.primaryAccountId;
  if (!accountId || offer.earnestMoney <= 0) return;
  sim.income(accountId, offer.earnestMoney, 'Earnest money returned', 'housing', { refType: 'offer', refId: offer.id });
}

/** Moves a person in, sets the primary residence, and wires up utilities. */
export function moveIn(sim: Simulation, personId: Id, propertyId: Id): void {
  const person = sim.universe.people[personId];
  const property = sim.universe.properties[propertyId];
  if (!person || !property) return;

  const previous = person.residenceId;
  person.residenceId = property.id;
  person.currentLocationId = property.locationId;
  property.isPrimaryResidence = true;

  if (previous && previous !== property.id) {
    const old = sim.universe.properties[previous];
    if (old) old.isPrimaryResidence = false;
  }

  const household = person.householdId ? sim.universe.households[person.householdId] : undefined;
  if (household) {
    household.residenceId = property.id;
    household.historyNotes.push({ at: sim.now, note: `Moved to ${property.addressLine}.` });
  }

  sim.universe.currentZone = CITIES.require(property.locationId).timeZone;
  sim.emit('prop.moved_in', { personId, propertyId, locationId: property.locationId });
}

/**
 * Furniture bought before furnishings were owned things becomes owned.
 *
 * A save from before this had a sofa in the living room that the house system
 * could not see: it never wore, never broke, and there was nothing to do with
 * it. This gives each of those the object it should always have had, keeping
 * what it cost and the state it is in. Idempotent, and it adds rather than
 * replaces, so nothing already in the save is lost.
 */
export function ensureFurnishingAssets(sim: Simulation): void {
  for (const furnishing of Object.values(sim.universe.furnishings)) {
    if (furnishing.assetId && sim.universe.assets[furnishing.assetId]) continue;
    const property = sim.universe.properties[furnishing.propertyId];
    if (!property) continue;
    if (property.ownerId !== sim.player.id && property.id !== sim.player.residenceId) continue;
    const catalogItem = CATALOG.get(furnishing.catalogId);
    if (!catalogItem) continue;
    const asset = createAsset(sim, {
      ownerId: sim.player.id, catalogItem,
      purchasePrice: furnishing.purchasePrice, acquiredVia: 'purchase',
    });
    asset.acquiredAt = furnishing.purchasedAt;
    asset.condition = furnishing.condition;
    asset.currentValue = furnishing.currentValue;
    asset.roomId = furnishing.roomId;
    asset.locationPropertyId = property.id;
    furnishing.assetId = asset.id;
  }
}

export function recomputeRoomQuality(sim: Simulation, roomId: Id): number {
  const room = sim.universe.rooms[roomId];
  if (!room) return 0;

  const furnishings = Object.values(sim.universe.furnishings).filter((f) => f.roomId === roomId);
  const theme = room.themeId ? DESIGN_THEMES.find((t) => t.id === room.themeId) : undefined;
  const finishCount = Object.values(room.finishes).filter(Boolean).length;

  let quality = 20 + finishCount * 9;
  for (const f of furnishings) {
    quality += f.qualityContribution * (f.condition / 100) * (theme?.coherenceBonus ?? 1);
  }
  // A room stuffed with furniture is not better than a well-composed one.
  if (furnishings.length > 8) quality -= (furnishings.length - 8) * 2.5;

  room.quality = clamp(Math.round(quality), 0, 100);
  return room.quality;
}

/** Overall living quality of a property; feeds sleep, morale and lifestyle. */
export function propertyQuality(sim: Simulation, propertyId: Id): number {
  const property = sim.universe.properties[propertyId];
  if (!property) return 0;
  const rooms = Object.values(sim.universe.rooms).filter(
    (r) => sim.universe.structures[r.structureId]?.propertyId === propertyId,
  );
  const roomAverage = rooms.length > 0 ? rooms.reduce((s, r) => s + r.quality, 0) / rooms.length : 35;
  const hood = property.neighbourhoodId ? NEIGHBOURHOODS.get(property.neighbourhoodId) : undefined;
  return clamp(
    roomAverage * 0.5 + property.condition * 0.3 + (hood?.prestige ?? 50) * 0.2,
    0, 100,
  );
}

function advanceConstruction(sim: Simulation, projectId: Id): void {
  const project = sim.universe.constructionProjects[projectId];
  if (!project || project.status === 'complete' || project.status === 'abandoned') return;
  const phases = project.phaseIds.map((id) => sim.universe.constructionPhases[id]).filter(Boolean) as ConstructionPhase[];

  // Unblock anything whose dependencies are done.
  for (const phase of phases) {
    if (phase.status !== 'blocked') continue;
    const ready = phase.dependsOn.every((dep) => phases.find((p) => p.phase === dep)?.status === 'complete');
    if (ready) phase.status = 'ready';
  }

  const active = phases.filter((p) => p.status === 'ready' || p.status === 'in_progress' || p.status === 'failed_inspection');
  if (active.length === 0) {
    const allDone = phases.every((p) => p.status === 'complete');
    if (allDone) { completeBuild(sim, project.id); return; }
    project.status = 'stalled';
    sim.requireDecision({
      urgency: 70, category: 'property',
      title: `${project.name} Is Stalled`,
      detail: 'Every remaining phase is blocked. Something needs resolving before work can continue.',
      route: '/workspace/property',
      refType: 'build', refId: project.id,
    });
    return;
  }

  project.status = project.phaseIds.some((id) => ['site_work', 'foundation', 'framing'].includes(sim.universe.constructionPhases[id]?.phase ?? '') && sim.universe.constructionPhases[id]?.status === 'complete')
    ? 'building'
    : 'permitting';

  const accountId = sim.universe.people[project.ownerId]?.primaryAccountId;

  for (const phase of active.slice(0, 3)) {
    const spec = CONSTRUCTION_PHASES.find((s) => s.phase === phase.phase);
    if (!spec) continue;

    if (phase.status === 'ready') {
      phase.status = 'in_progress';
      phase.startedAt = sim.now;
      phase.contractorName = project.generalContractor;
    }
    if (phase.status === 'failed_inspection') {
      const pendingOrder = Object.values(sim.universe.changeOrders).find(
        (o) => o.projectId === project.id && o.phase === phase.phase && o.status === 'proposed',
      );
      if (pendingOrder) continue;
      phase.status = 'in_progress';
    }

    phase.actualDays += 7;

    // Spend against the phase as it progresses.
    const progress = clamp(phase.actualDays / Math.max(1, phase.plannedDays), 0, 1);
    const targetSpend = Math.round(phase.budgeted * progress);
    const due = targetSpend - phase.spent;
    if (due > 0 && accountId) {
      if (sim.ledger.availableFunds(accountId) >= due) {
        sim.expense(accountId, due, `${project.name} — ${phase.name}`, 'construction', { refType: 'build', refId: project.id });
        phase.spent += due;
        project.spent += due;
      } else {
        phase.notes.push({ at: sim.now, note: 'Work paused: the draw could not be funded.' });
        project.status = 'stalled';
        sim.requireDecision({
          urgency: 90, category: 'property',
          title: `${project.name} Cannot Be Funded`,
          detail: `The next draw of ${formatMoney(due)} could not be paid. Crews stop until it is.`,
          route: '/workspace/property',
          refType: 'build', refId: project.id,
        });
        continue;
      }
    }

    // Risk events: delays, inspections, change orders.
    const rng = sim.rng('build_risk', phase.id, phase.actualDays);
    if (rng.chance(spec.riskRate * 0.35)) {
      raiseConstructionEvent(sim, project.id, phase, rng.next());
    }

    if (phase.actualDays >= phase.plannedDays) {
      phase.status = 'complete';
      phase.completedAt = sim.now;
      phase.notes.push({ at: sim.now, note: `Complete in ${phase.actualDays} days against a plan of ${phase.plannedDays}.` });
      sim.emit('build.phase_complete', { projectId: project.id, phase: phase.phase });
    }
  }

  const allDone = phases.every((p) => p.status === 'complete');
  if (allDone) { completeBuild(sim, project.id); return; }

  sim.schedule({
    at: addDays(sim.now, 7, sim.homeZone),
    kind: 'build.phase_tick',
    label: `${project.name} — Construction Progress`,
    category: 'property',
    payload: { projectId: project.id },
    priority: 60,
    refType: 'build', refId: project.id,
  });
}

function raiseConstructionEvent(sim: Simulation, projectId: Id, phase: ConstructionPhase, roll: number): void {
  const project = sim.universe.constructionProjects[projectId];
  if (!project) return;

  const templates: { description: string; costFactor: number; days: number; by: 'contractor' | 'inspector' }[] = [
    { description: 'Unforeseen ground conditions require additional excavation and fill.', costFactor: 0.14, days: 12, by: 'contractor' },
    { description: 'Inspector requires additional shear bracing to meet code.', costFactor: 0.08, days: 9, by: 'inspector' },
    { description: 'Specified material is on a twelve-week lead time; substitution or delay.', costFactor: 0.05, days: 21, by: 'contractor' },
    { description: 'Rough inspection failed on mechanical clearances.', costFactor: 0.06, days: 11, by: 'inspector' },
    { description: 'Subcontractor left the job; replacement crew at a higher rate.', costFactor: 0.11, days: 16, by: 'contractor' },
    { description: 'Weather stopped exterior work for two weeks.', costFactor: 0.02, days: 14, by: 'contractor' },
  ];
  const template = templates[Math.floor(roll * templates.length)] ?? templates[0];
  if (!template) return;

  const order = {
    id: sim.nextId('build'),
    saveId: sim.universe.meta.id,
    projectId: project.id,
    phase: phase.phase,
    description: template.description,
    costDelta: Math.round(phase.budgeted * template.costFactor),
    daysDelta: template.days,
    status: 'proposed' as const,
    proposedAt: sim.now,
    initiatedBy: template.by,
  };
  sim.universe.changeOrders[order.id] = order;
  project.changeOrderIds.push(order.id);
  phase.plannedDays += template.days;
  phase.notes.push({ at: sim.now, note: template.description, deltaDays: template.days, deltaCost: order.costDelta });
  if (template.by === 'inspector') phase.status = 'failed_inspection';

  sim.requireDecision({
    urgency: template.by === 'inspector' ? 80 : 66,
    category: 'property',
    title: `Change Order On ${project.name}`,
    detail: `${template.description} ${formatMoney(order.costDelta)} and ${template.days} days. ${template.by === 'inspector' ? 'This is required to pass inspection.' : 'You can refuse, but the work stops here.'}`,
    route: '/workspace/property',
    actions: [
      { label: 'Approve', commandKind: 'build.decide_change_order', payload: { changeOrderId: order.id, approve: true } },
      { label: 'Reject', commandKind: 'build.decide_change_order', payload: { changeOrderId: order.id, approve: false } },
    ],
    refType: 'change_order', refId: order.id,
  });
  sim.emit('build.change_order_raised', { projectId: project.id, changeOrderId: order.id, phase: phase.phase });
}

function completeBuild(sim: Simulation, projectId: Id): void {
  const project = sim.universe.constructionProjects[projectId];
  if (!project || project.status === 'complete') return;
  const property = sim.universe.properties[project.propertyId];
  if (!property) return;

  project.status = 'complete';
  project.actualCompletionAt = sim.now;
  property.tenure = 'owned';
  property.condition = 100;
  property.yearBuilt = new Date(sim.now).getUTCFullYear();

  let totalSqft = 0;
  for (const spec of project.plannedStructures) {
    const structure: Structure = {
      id: sim.nextId('prop'),
      saveId: sim.universe.meta.id,
      propertyId: property.id,
      kind: spec.kind,
      name: spec.kind.replace(/_/g, ' '),
      floors: spec.floors,
      sqft: spec.sqft,
      condition: 100,
      roomIds: [],
      builtAt: sim.now,
    };
    sim.universe.structures[structure.id] = structure;
    property.structureIds.push(structure.id);
    totalSqft += spec.sqft;

    if (spec.kind === 'main_house') {
      const layout: { kind: string; name: string; share: number }[] = [
        { kind: 'foyer', name: 'Entry', share: 0.05 },
        { kind: 'living', name: 'Living Room', share: 0.18 },
        { kind: 'kitchen', name: 'Kitchen', share: 0.13 },
        { kind: 'dining', name: 'Dining Room', share: 0.10 },
        { kind: 'bedroom', name: 'Primary Bedroom', share: 0.16 },
        { kind: 'bathroom', name: 'Primary Bathroom', share: 0.07 },
        { kind: 'office', name: 'Office', share: 0.09 },
        { kind: 'laundry', name: 'Laundry', share: 0.04 },
      ];
      for (const entry of layout) {
        const room: Room = {
          id: sim.nextId('room'),
          saveId: sim.universe.meta.id,
          structureId: structure.id,
          floor: 1,
          kind: entry.kind,
          name: entry.name,
          sqft: Math.round(spec.sqft * entry.share),
          finishes: { walls: 'Painted', floor: 'Engineered oak', ceiling: 'Flat', lighting: 'Recessed' },
          zoneIds: [],
          quality: 55,
        };
        sim.universe.rooms[room.id] = room;
        structure.roomIds.push(room.id);
      }
    }
  }

  property.interiorSqft = totalSqft;
  property.marketValue = Math.round(Math.max(property.marketValue, project.spent * 1.08));

  const overBudget = project.spent - (project.budget - project.contingency);
  sim.remember({
    category: 'property',
    title: `${project.name} Is Finished`,
    detail: `${totalSqft.toLocaleString('en-US')} square feet. Spent ${formatMoney(project.spent)}${overBudget > 0 ? `, ${formatMoney(overBudget)} over the original budget` : ', inside budget'}. Completed ${formatDate(sim.now, sim.homeZone)}.`,
    refs: [{ type: 'build', id: project.id }, { type: 'property', id: property.id }],
    significance: 88, public: false, amount: project.spent,
  });
  sim.notify({
    category: 'property', title: `${project.name} Is Complete`,
    body: 'The certificate of occupancy is issued. You can move in.',
    importance: 82, route: '/workspace/property',
  });
  sim.emit('build.completed', { projectId: project.id, propertyId: property.id, spent: project.spent, sqft: totalSqft });
}

/** Property values move slowly with the local market. */
function driftMarket(sim: Simulation): void {
  for (const property of Object.values(sim.universe.properties)) {
    if (property.soldAt) continue;
    const rng = sim.rng('market', property.id, Math.floor(sim.now / (30 * MS_DAY)));
    const monthly = rng.normal(0.0032, 0.010);
    property.marketValue = Math.max(1000_00, Math.round(property.marketValue * (1 + monthly)));
  }
}

/** Annual property tax and insurance react to owning a home. */
export function registerPropertyReactors(sim: Simulation): void {
  sim.onEvent('property.purchased', 'tax.property', (event, { sim: s }) => {
    const { propertyId, buyerId } = event.payload as { propertyId: Id; buyerId: Id };
    const property = s.universe.properties[propertyId];
    if (!property) return;
    const annual = applyRate(property.marketValue, property.annualPropertyTaxRate);
    createBill(s, {
      payerId: buyerId,
      name: `Property tax — ${property.addressLine}`,
      category: 'housing',
      amount: Math.round(annual / 2),
      frequency: 'quarterly',
      firstDueAt: addDays(s.now, 90, s.homeZone),
      autopayAccountId: s.universe.people[buyerId]?.primaryAccountId,
      refType: 'property', refId: property.id,
    });
  }, 30);

  sim.onEvent('property.purchased', 'utilities.connect', (event, { sim: s }) => {
    const { propertyId, buyerId, locationId } = event.payload as { propertyId: Id; buyerId: Id; locationId: string };
    const property = s.universe.properties[propertyId];
    if (!property) return;
    const col = costOfLiving(locationId);
    const scale = clamp(property.interiorSqft / 2000, 0.5, 6);
    for (const [name, base] of [['Electricity', 145_00], ['Water And Refuse', 88_00], ['Gas', 62_00]] as [string, number][]) {
      createBill(s, {
        payerId: buyerId,
        name: `${name} — ${property.addressLine}`,
        category: 'utilities',
        amount: Math.round(base * col * scale),
        frequency: 'monthly',
        firstDueAt: addDays(s.now, 30, s.homeZone),
        autopayAccountId: s.universe.people[buyerId]?.primaryAccountId,
        refType: 'property', refId: property.id,
      });
    }
  }, 40);

  sim.onEvent('property.purchased', 'household.move', (event, { sim: s }) => {
    const { propertyId, buyerId } = event.payload as { propertyId: Id; buyerId: Id };
    const person = s.universe.people[buyerId];
    if (!person || person.residenceId) return;
    moveIn(s, buyerId, propertyId);
  }, 50);
}
