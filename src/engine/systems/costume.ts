/**
 * SLATE — the costume house, the tailor, and your own machine.
 *
 * Three ways to end up wearing something that did not exist before.
 *
 * A **costume house** cuts it. You say what the garment is, what it is cut
 * from and how it is finished; the cutter quotes; you leave a deposit; you
 * come back for fittings, and the fittings are the point. Skipping them is
 * allowed and it shows in the fit, because a workroom that never sees you
 * again is guessing.
 *
 * A **tailor** alters something you already own. Cheaper, faster, and bounded
 * by what the original garment will allow.
 *
 * **You** make it yourself. That needs a machine you own, enough cloth for
 * the pattern, and the hours. How it comes out depends on your hands, and the
 * game says so before you start rather than after.
 *
 * Money rules, the same as everywhere else in SLATE:
 *
 * - A deposit is taken once. Approving an already-ordered costume is a no-op
 *   that returns the same numbers, so a retried click cannot pay twice.
 * - Collection charges the balance once and creates exactly one garment.
 * - Canceling before the cloth is cut refunds the deposit; after it does not,
 *   and the cutter says why rather than the game hiding it.
 * - Making it yourself consumes the cloth once and produces one garment.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import { clamp } from '../core/rng';
import { MS_DAY, MS_MINUTE, addDays } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { plural } from '../core/text';
import type { Costume, Id, OwnedAsset, Person } from '../domain/model';
import { placeById, type Place } from '../content/places';
import { costOfLiving } from '../content/tax';
import { defaultColour } from '../content/wardrobe';
import {
  CLOTHS, COSTUME_NOTE, FINISHES, GARMENT_KINDS, SELF_MADE_NOTE,
  clothOf, finishOf, garmentKindOf,
} from '../content/costume';
import { makeBackgroundPerson, peopleOf } from './people';
import { factsOf, rememberFact, tallyFact, tallyOf } from './memory';

// ---------------------------------------------------------------------------
// Constants. Every one of these is SLATE's own calibration.
// ---------------------------------------------------------------------------

/** What a costume house charges for an hour at the table. */
export const CUTTER_RATE = 78_00;

/** What a yard of ordinary cloth stands in for. Every cloth is a factor of it. */
export const CLOTH_PER_YARD = 24_00;

/** The share of the quote taken up front. A workroom does not cut on a promise. */
export const DEPOSIT_SHARE = 0.35;

/** Once the cloth is cut, the deposit has been spent. */
export const REFUNDABLE_DAYS = 4;

/** Minutes a fitting takes. */
export const FITTING_MINUTES = 45;

/** Minutes spent describing what you want. */
export const CONSULT_MINUTES = 35;

/** What a made garment fetches second hand. It was cut for one body. */
export const BESPOKE_RESALE = 0.22;

/** How much a missed fitting costs the finished fit, per fitting. */
export const MISSED_FITTING_PENALTY = 9;

/** A tailor's alteration, per hour. */
export const ALTERATION_RATE = 52_00;

const CAME_IN = 'Came into the workroom';
const COMMISSIONED = 'Had something cut';
const VISIT_STEP = 22;
const COMMISSION_STEP = 36;

// ---------------------------------------------------------------------------
// The room and the person in it
// ---------------------------------------------------------------------------

export function isCostumier(place: Place | undefined): boolean {
  return place?.kind === 'costumier';
}

/** How dear this workroom is, 1 to 5, from its price band. */
export function tierOf(place: Place): number {
  return clamp(Math.round(place.quality / 24), 2, 5);
}

/**
 * The cutter.
 *
 * The same one every time, so a workroom is a person and not a counter. Made
 * once and then remembered, exactly like the jeweler's bench.
 */
export function cutterAt(sim: Simulation, place: Place): Person {
  const archetype = `cutter:${place.id}`;
  const existing = peopleOf(sim, archetype)[0];
  if (existing) return existing;
  const rng = sim.rng('costumier', place.id);
  const tier = tierOf(place);
  return makeBackgroundPerson(sim, {
    rng,
    archetype,
    industryRole: 'crew',
    cityId: place.cityId,
    background: `Cutting at ${place.name}.`,
    interests: [rng.pick(['tailoring', 'textiles', 'theater', 'period drama', 'millinery', 'dyeing']), 'costume'],
    skills: {
      costume_design: clamp(tier * 13 + rng.int(20, 40), 30, 100),
      wardrobe: clamp(tier * 12 + rng.int(18, 40), 25, 100),
    },
    age: [30, 68],
    personality: {
      conscientiousness: rng.int(66, 98),
      extraversion: rng.int(30, 74),
      agreeableness: rng.int(45, 92),
    },
    lifestyle: tier >= 4 ? 'comfortable' : 'modest',
  });
}

export interface Standing {
  visits: number;
  commissions: number;
  /** Somebody the room knows by name. */
  regular: boolean;
}

export function standingAt(sim: Simulation, place: Place): Standing {
  const facts = factsOf(sim, cutterAt(sim, place).id, { aboutId: sim.player.id });
  const visits = tallyOf(facts, CAME_IN, VISIT_STEP);
  const commissions = tallyOf(facts, COMMISSIONED, COMMISSION_STEP);
  return { visits, commissions, regular: visits + commissions * 2 >= 4 };
}

// ---------------------------------------------------------------------------
// The quote
// ---------------------------------------------------------------------------

export interface Spec {
  kind: string;
  cloth: string;
  finish: string;
  label?: string;
}

export interface Quote {
  clothCost: Money;
  labour: Money;
  total: Money;
  weeks: number;
  fittings: number;
  /** What the workroom will not do, said plainly rather than by refusing. */
  cautions: string[];
}

/**
 * What the cutter says when you finish describing it.
 *
 * Cloth by the yard against how dear the cloth is, labor by the hour against
 * how hard the cloth is to work and how much finishing you asked for, the
 * whole thing scaled by how dear this room is and how dear this city is.
 */
export function quoteFor(place: Place | undefined, spec: Spec): Quote {
  const kind = garmentKindOf(spec.kind);
  const cloth = clothOf(spec.cloth);
  const finish = finishOf(spec.finish);
  const tier = place ? tierOf(place) : 2;
  const col = place ? costOfLiving(place.cityId) : 1;

  // A workroom cuts with allowance, so it buys more cloth than the pattern.
  const yards = kind.yards * 1.15;
  const clothCost = Math.round(yards * CLOTH_PER_YARD * clothFactor(cloth.id) * col);

  const hours = kind.hours * cloth.effort + finish.hours;
  const labour = Math.round(hours * CUTTER_RATE * (0.7 + tier * 0.13) * col);

  const weeks = Math.max(1, Math.round((kind.difficulty + finish.hours / 12) * (tier >= 4 ? 1.5 : 1)));

  return {
    clothCost, labour, total: clothCost + labour, weeks,
    fittings: kind.fittings,
    cautions: cautionsFor(spec),
  };
}

/** How dear a yard of this cloth is against plain cotton. SLATE's own figures. */
function clothFactor(id: string): number {
  switch (id) {
    case 'cotton_shirting': case 'cotton_twill': case 'canvas': return 0.7;
    case 'jersey': case 'ponte': return 0.8;
    case 'linen': case 'denim': return 1.0;
    case 'wool_flannel': case 'tweed': return 1.5;
    case 'wool_suiting': return 1.8;
    case 'wool_melton': return 2.0;
    case 'silk_dupioni': case 'taffeta': return 1.6;
    case 'silk_charmeuse': case 'satin': return 2.0;
    case 'silk_chiffon': return 1.7;
    case 'faux_fur': return 1.9;
    case 'silk_velvet': return 2.6;
    case 'lace': return 3.2;
    case 'sequin': return 2.4;
    case 'cashmere': return 4.5;
    case 'leather': return 5.0;
    default: return 1.0;
  }
}

/**
 * What a real cutter would say out loud before taking your money.
 *
 * None of these refuse the order. They are the things somebody who does this
 * for a living would think it dishonest not to mention.
 */
export function cautionsFor(spec: Spec): string[] {
  const kind = garmentKindOf(spec.kind);
  const cloth = clothOf(spec.cloth);
  const finish = finishOf(spec.finish);
  const out: string[] = [];

  if (cloth.caution) out.push(cloth.caution);
  if (kind.difficulty >= 5 && cloth.effort >= 1.7) {
    out.push(`A ${kind.name.toLowerCase()} in ${cloth.name.toLowerCase()} is the hard version of a hard thing. It will take longer than the estimate says.`);
  }
  if (finish.id === 'full_canvas' && kind.slot !== 'top' && kind.slot !== 'outerwear') {
    out.push('A floating canvas belongs in a coat front. On this garment it is money spent where nobody will feel it.');
  }
  if (finish.id === 'boned' && kind.id !== 'corset' && kind.id !== 'evening_gown' && kind.id !== 'period_gown') {
    out.push('Boning holds a shape the body is not making. On this garment it will read as armor.');
  }
  if (finish.id === 'beaded' && cloth.durability < 55) {
    out.push(`Beading is heavy and ${cloth.name.toLowerCase()} is not. The weight will drag the seams over time.`);
  }
  if (kind.id === 'jeans' && cloth.id !== 'denim' && cloth.id !== 'cotton_twill' && cloth.id !== 'canvas') {
    out.push('Jeans cut from anything but denim or a heavy twill are trousers with jean seams. That may be what you want.');
  }
  if (cloth.id === 'leather' && kind.fittings > 0) {
    out.push('Leather is fitted in a calico toile first, because the leather itself only gets cut once.');
  }
  if (kind.yards >= 8) {
    out.push(`This takes about ${plural(Math.ceil(kind.yards), 'yard')} of cloth. Most of the price is on the table before anybody sews.`);
  }
  if (spec.label && spec.label.length > 28) {
    out.push('That is a long label for the inside of a neck. It can be woven small, or it can be legible.');
  }
  return out;
}

/** A sentence describing the garment the way a workroom docket would. */
export function describeSpec(spec: { kind: string; cloth: string; finish: string }): string {
  const kind = garmentKindOf(spec.kind);
  const cloth = clothOf(spec.cloth);
  const finish = finishOf(spec.finish);
  const tail = finish.id === 'machine' ? '' : `, ${finish.name.toLowerCase()}`;
  return `${cloth.name} ${kind.name.toLowerCase()}${tail}`;
}

// ---------------------------------------------------------------------------
// How well it came out
// ---------------------------------------------------------------------------

/**
 * The finished quality of a house-made garment.
 *
 * The room's tier and the cloth set the ceiling, the finish adds to it, and
 * every fitting you did not attend takes some back. A workroom cannot fit a
 * body it has not seen.
 */
export function houseQuality(place: Place | undefined, costume: Costume): number {
  const cloth = clothOf(costume.cloth);
  const finish = finishOf(costume.finish);
  const tier = place ? tierOf(place) : 2;
  const base = 52 + tier * 7;
  const missed = Math.max(0, costume.fittingsWanted - costume.fittingsDone);
  return Math.round(clamp(
    base + finish.quality + (cloth.durability - 70) * 0.12 - missed * MISSED_FITTING_PENALTY,
    20, 98,
  ));
}

/**
 * The finished quality of one you made yourself.
 *
 * Your own costume design skill against how hard the thing is. A first
 * tailored coat looks like a first tailored coat, and the game says that
 * before you start rather than after.
 */
export function selfQuality(sim: Simulation, personId: Id, spec: Spec): number {
  const person = sim.universe.people[personId];
  const skill = person?.skills?.['costume_design'] ?? 5;
  const kind = garmentKindOf(spec.kind);
  const cloth = clothOf(spec.cloth);
  const finish = finishOf(spec.finish);
  // Difficulty eats skill. A tee forgives everything; a dinner suit forgives nothing.
  const demand = kind.difficulty * 12 + (cloth.effort - 1) * 22;
  return Math.round(clamp(30 + skill * 0.85 - demand + finish.quality * 0.5, 8, 94));
}

/** Bench hours for one you make yourself, which is slower than a professional. */
export function selfHours(sim: Simulation, personId: Id, spec: Spec): number {
  const person = sim.universe.people[personId];
  const skill = person?.skills?.['costume_design'] ?? 5;
  const kind = garmentKindOf(spec.kind);
  const cloth = clothOf(spec.cloth);
  const finish = finishOf(spec.finish);
  const slowness = clamp(2.4 - skill / 45, 1.0, 2.4);
  return Math.round((kind.hours * cloth.effort + finish.hours) * slowness);
}

/** What making it yourself needs on the table, and what is missing. */
export interface Readiness {
  ready: boolean;
  /** A machine you own that can sew this. */
  machineId?: Id;
  machineName?: string;
  /** Cloth you own, in yards, and how many the pattern wants. */
  yardsOwned: number;
  yardsNeeded: number;
  clothAssetIds: Id[];
  missing: string[];
}

/**
 * Can you actually make this right now.
 *
 * Reads what you own rather than a flag: a machine asset and enough cloth of
 * the kind you named. Says what is missing in the words a person would use.
 */
export function readinessFor(sim: Simulation, personId: Id, spec: Spec): Readiness {
  const kind = garmentKindOf(spec.kind);
  const cloth = clothOf(spec.cloth);
  const mine = Object.values(sim.universe.assets)
    .filter((a) => a.ownerId === personId && !a.soldAt);

  const machine = mine.find((a) => a.tags?.includes('machine'));
  const bolts = mine.filter((a) => a.tags?.includes('fabric') && (a.tags ?? []).includes(cloth.id));
  const yardsOwned = bolts.reduce((n, a) => n + (a.quantity ?? 1), 0);
  const yardsNeeded = Math.ceil(kind.yards * 1.15);

  const missing: string[] = [];
  if (!machine) missing.push('A sewing machine. You do not own one yet.');
  if (yardsOwned < yardsNeeded) {
    missing.push(`${plural(yardsNeeded, 'yard')} of ${cloth.name.toLowerCase()}. You have ${yardsOwned}.`);
  }
  return {
    ready: missing.length === 0,
    machineId: machine?.id,
    machineName: machine?.name,
    yardsOwned, yardsNeeded,
    clothAssetIds: bolts.map((a) => a.id),
    missing,
  };
}

// ---------------------------------------------------------------------------
// The record
// ---------------------------------------------------------------------------

export function costumesOf(sim: Simulation, personId: Id): Costume[] {
  return Object.values(sim.universe.costumes ?? {})
    .filter((c) => c.forPersonId === personId)
    .sort((a, b) => b.quotedAt - a.quotedAt);
}

/** The ones still in progress. */
export function openCostumes(sim: Simulation, personId: Id): Costume[] {
  return costumesOf(sim, personId)
    .filter((c) => c.status === 'quoted' || c.status === 'ordered' || c.status === 'fitting' || c.status === 'ready');
}

function store(sim: Simulation): Record<Id, Costume> {
  return (sim.universe.costumes ??= {});
}

function requireCostume(sim: Simulation, id: Id): Costume {
  const found = store(sim)[id];
  if (!found) throw new CommandError('No such costume.');
  return found;
}

function placeOf(sim: Simulation, placeId: Id | undefined): Place | undefined {
  if (!placeId) return undefined;
  return placeById(sim.player.currentLocationId, placeId);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export function registerCostume(sim: Simulation): void {
  sim.onSchedule('costume.ready', (item) => {
    const costume = store(sim)[item.payload.costumeId as Id];
    if (!costume || (costume.status !== 'ordered' && costume.status !== 'fitting')) return;
    costume.status = 'ready';
    const place = placeOf(sim, costume.placeId);
    sim.notify({
      category: 'shopping',
      title: 'Your Costume Is Finished',
      body: `${describeSpec(costume)} is off the table at ${place?.name ?? 'the workroom'}. `
        + `${formatMoney(costume.quotedPrice - costume.deposit)} to settle on collection.`,
      importance: 58,
      route: '/workspace/shopping',
    });
  });

  sim.onSchedule('costume.fitting_due', (item) => {
    const costume = store(sim)[item.payload.costumeId as Id];
    if (!costume || (costume.status !== 'ordered' && costume.status !== 'fitting')) return;
    if (costume.fittingsDone >= costume.fittingsWanted) return;
    const place = placeOf(sim, costume.placeId);
    sim.notify({
      category: 'shopping',
      title: 'A Fitting Is Due',
      body: `${place?.name ?? 'The workroom'} wants you in for a fitting on ${describeSpec(costume)}. `
        + 'They can finish it without you. It will fit like it.',
      importance: 48,
      route: '/workspace/shopping',
    });
  });

  /**
   * Walk in and look at the rail.
   *
   * Buys nothing. It is how a workroom becomes a room you are known in.
   */
  sim.onCommand<{ placeId: Id }, { visits: number; regular: boolean; cutterId: Id }>(
    'costume.look',
    (p, { sim: s }) => {
      const place = placeById(s.player.currentLocationId, p.placeId);
      if (!place || !isCostumier(place)) throw new CommandError('That is not a costume house.');
      const cutter = cutterAt(s, place);
      s.advanceTo(s.now + CONSULT_MINUTES * MS_MINUTE);
      tallyFact(s, cutter.id, { kind: 'topic', sourceKind: 'costumier', aboutId: s.player.id, text: CAME_IN, step: VISIT_STEP });
      const standing = standingAt(s, place);
      return { visits: standing.visits, regular: standing.regular, cutterId: cutter.id };
    },
  );

  /**
   * Describe a garment and get a number for it.
   *
   * Quoting costs nothing and commits to nothing. The price is fixed here and
   * carried on the record, so the workroom cannot quietly revise it later.
   */
  sim.onCommand<Spec & { placeId: Id; forPersonId?: Id }, { costumeId: Id; quote: Quote; description: string }>(
    'costume.commission',
    (p, { sim: s }) => {
      const place = placeById(s.player.currentLocationId, p.placeId);
      if (!place || !isCostumier(place)) throw new CommandError('That is not a costume house.');
      const kind = garmentKindOf(p.kind);
      const spec: Spec = {
        kind: kind.id,
        cloth: clothOf(p.cloth).id,
        finish: finishOf(p.finish).id,
        label: p.label?.slice(0, 48),
      };
      const quote = quoteFor(place, spec);
      const costume: Costume = {
        id: s.nextId('costume'),
        saveId: s.universe.meta.id,
        placeId: place.id,
        makerId: cutterAt(s, place).id,
        forPersonId: p.forPersonId ?? s.player.id,
        maker: 'house',
        kind: spec.kind,
        cloth: spec.cloth,
        finish: spec.finish,
        label: spec.label,
        yards: Math.ceil(kind.yards * 1.15),
        quotedPrice: quote.total,
        deposit: Math.round(quote.total * DEPOSIT_SHARE),
        status: 'quoted',
        fittingsWanted: quote.fittings,
        fittingsDone: 0,
        fittingNotes: [],
        quotedAt: s.now,
      };
      store(s)[costume.id] = costume;
      return { costumeId: costume.id, quote, description: describeSpec(costume) };
    },
  );

  /**
   * Leave the deposit, and the cloth gets cut.
   *
   * Approving twice is a no-op that returns the same numbers rather than a
   * second charge: a retried request must never take a second deposit.
   */
  sim.onCommand<{ costumeId: Id; accountId?: Id }, { deposit: Money; balance: Money; readyAt: number; weeks: number; fittings: number }>(
    'costume.approve',
    (p, { sim: s }) => {
      const costume = requireCostume(s, p.costumeId);
      const answer = () => ({
        deposit: costume.deposit,
        balance: costume.quotedPrice - costume.deposit,
        readyAt: costume.readyAt ?? s.now,
        weeks: Math.max(1, Math.round(((costume.readyAt ?? s.now) - (costume.orderedAt ?? s.now)) / (7 * MS_DAY))),
        fittings: costume.fittingsWanted,
      });
      if (costume.status === 'ordered' || costume.status === 'fitting' || costume.status === 'ready') return answer();
      if (costume.status !== 'quoted') throw new CommandError('That costume is closed.');

      const place = placeOf(s, costume.placeId);
      const weeks = quoteFor(place, costume).weeks;
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay the deposit from.');

      s.expense(accountId, costume.deposit, `Deposit — ${describeSpec(costume)}`, 'shopping');
      costume.status = 'ordered';
      costume.orderedAt = s.now;
      costume.depositPaidAt = s.now;
      costume.readyAt = addDays(s.now, weeks * 7, s.homeZone);

      // Fittings land evenly between now and the finish date.
      for (let i = 1; i <= costume.fittingsWanted; i++) {
        s.schedule({
          at: addDays(s.now, Math.round((weeks * 7 * i) / (costume.fittingsWanted + 1)), s.homeZone),
          kind: 'costume.fitting_due',
          label: 'A Fitting Is Due',
          category: 'personal',
          payload: { costumeId: costume.id },
          priority: 35,
        });
      }
      s.schedule({
        at: costume.readyAt,
        kind: 'costume.ready',
        label: 'A Costume Is Finished',
        category: 'personal',
        payload: { costumeId: costume.id },
        priority: 40,
      });
      if (place) {
        tallyFact(s, cutterAt(s, place).id, { kind: 'topic', sourceKind: 'costumier', aboutId: s.player.id, text: COMMISSIONED, step: COMMISSION_STEP });
      }
      s.remember({
        category: 'life',
        title: 'Had Something Cut',
        detail: `${describeSpec(costume)}, at ${place?.name ?? 'a workroom'}. `
          + `Ready in ${plural(weeks, 'week')}, ${plural(costume.fittingsWanted, 'fitting')} before then.`,
        refs: [{ type: 'costume', id: costume.id }],
        significance: 52,
        public: false,
        amount: costume.quotedPrice,
      });
      return answer();
    },
  );

  /**
   * Stand on the box while somebody puts pins in you.
   *
   * Every fitting improves the finished fit. You can skip them, and the
   * garment will tell everyone you did.
   */
  sim.onCommand<{ costumeId: Id }, { done: number; wanted: number; note: string }>(
    'costume.fitting',
    (p, { sim: s }) => {
      const costume = requireCostume(s, p.costumeId);
      if (costume.status !== 'ordered' && costume.status !== 'fitting') {
        throw new CommandError('There is nothing on the table to fit.');
      }
      if (costume.fittingsDone >= costume.fittingsWanted) {
        return { done: costume.fittingsDone, wanted: costume.fittingsWanted, note: 'It has had every fitting it needs.' };
      }
      const place = placeOf(s, costume.placeId);
      s.advanceTo(s.now + FITTING_MINUTES * MS_MINUTE);
      costume.fittingsDone += 1;
      costume.status = 'fitting';
      const note = FITTING_NOTES[Math.min(costume.fittingsDone - 1, FITTING_NOTES.length - 1)]!;
      costume.fittingNotes.push(note);
      if (place) {
        tallyFact(s, cutterAt(s, place).id, { kind: 'topic', sourceKind: 'costumier', aboutId: s.player.id, text: CAME_IN, step: VISIT_STEP });
      }
      return { done: costume.fittingsDone, wanted: costume.fittingsWanted, note };
    },
  );

  /**
   * Collect it, settle the balance, and own something cut for one body.
   *
   * Collecting twice returns the garment that already exists rather than
   * making a second one and charging for it.
   */
  sim.onCommand<{ costumeId: Id; accountId?: Id }, { assetId: Id; paid: Money; quality: number; description: string }>(
    'costume.collect',
    (p, { sim: s }) => {
      const costume = requireCostume(s, p.costumeId);
      if (costume.status === 'collected' && costume.assetId) {
        return {
          assetId: costume.assetId, paid: 0,
          quality: costume.quality ?? 0, description: describeSpec(costume),
        };
      }
      if (costume.status !== 'ready') throw new CommandError('It is not finished yet.');

      const place = placeOf(s, costume.placeId);
      const balance = costume.quotedPrice - costume.deposit;
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to settle the balance from.');
      s.expense(accountId, balance, `Balance — ${describeSpec(costume)}`, 'shopping');

      costume.quality = houseQuality(place, costume);
      const asset = makeGarment(s, costume, place?.name ?? 'A Workroom');
      costume.status = 'collected';
      costume.collectedAt = s.now;
      costume.balancePaidAt = s.now;
      costume.assetId = asset.id;

      const missed = costume.fittingsWanted - costume.fittingsDone;
      s.remember({
        category: 'life',
        title: 'Collected A Costume',
        detail: `${describeSpec(costume)} from ${place?.name ?? 'the workroom'}.`
          + (missed > 0 ? ` ${plural(missed, 'fitting')} missed, and it shows.` : ' It fits.'),
        refs: [{ type: 'costume', id: costume.id }, { type: 'asset', id: asset.id }],
        significance: 58,
        public: false,
        amount: costume.quotedPrice,
      });
      return { assetId: asset.id, paid: balance, quality: costume.quality, description: describeSpec(costume) };
    },
  );

  /**
   * Change your mind.
   *
   * Before the cloth is cut the deposit comes back. After that it does not,
   * because the cloth is bought and cut to a pattern that fits one person.
   */
  sim.onCommand<{ costumeId: Id; accountId?: Id }, { refunded: Money; kept: Money }>(
    'costume.cancel',
    (p, { sim: s }) => {
      const costume = requireCostume(s, p.costumeId);
      if (costume.status === 'cancelled') return { refunded: 0, kept: 0 };
      if (costume.status === 'collected') throw new CommandError('You already have it.');

      let refunded = 0;
      if (costume.status === 'ordered' || costume.status === 'fitting' || costume.status === 'ready') {
        const started = s.now - (costume.orderedAt ?? s.now);
        if (started <= REFUNDABLE_DAYS * MS_DAY) {
          const accountId = p.accountId ?? s.player.primaryAccountId;
          if (accountId) {
            s.income(accountId, costume.deposit, `Deposit returned — ${describeSpec(costume)}`, 'other');
            refunded = costume.deposit;
          }
        }
      }
      costume.status = 'cancelled';
      costume.cancelledReason = refunded > 0
        ? 'Canceled before the cloth was cut. The deposit came back.'
        : 'Canceled once the cloth was cut. It was cut to your pattern, so the deposit did not come back.';
      return { refunded, kept: costume.deposit - refunded };
    },
  );

  /**
   * Make it yourself.
   *
   * Needs a machine you own and enough cloth of the kind you named. Consumes
   * the cloth once, spends the hours once, and produces exactly one garment.
   * Retrying with the same idempotency key cannot make two.
   */
  sim.onCommand<Spec & { forPersonId?: Id }, { assetId: Id; quality: number; hours: number; description: string }>(
    'costume.make',
    (p, { sim: s }) => {
      const forPersonId = p.forPersonId ?? s.player.id;
      const spec: Spec = {
        kind: garmentKindOf(p.kind).id,
        cloth: clothOf(p.cloth).id,
        finish: finishOf(p.finish).id,
        label: p.label?.slice(0, 48),
      };
      const ready = readinessFor(s, s.player.id, spec);
      if (!ready.ready) throw new CommandError(ready.missing.join(' '));

      const hours = selfHours(s, s.player.id, spec);
      const quality = selfQuality(s, s.player.id, spec);

      consumeCloth(s, ready.clothAssetIds, ready.yardsNeeded);
      s.advanceTo(s.now + hours * 60 * MS_MINUTE);

      const costume: Costume = {
        id: s.nextId('costume'),
        saveId: s.universe.meta.id,
        makerId: s.player.id,
        forPersonId,
        maker: 'self',
        kind: spec.kind,
        cloth: spec.cloth,
        finish: spec.finish,
        label: spec.label,
        yards: ready.yardsNeeded,
        quotedPrice: 0,
        deposit: 0,
        status: 'collected',
        fittingsWanted: 0,
        fittingsDone: 0,
        fittingNotes: [],
        quotedAt: s.now,
        orderedAt: s.now,
        readyAt: s.now,
        collectedAt: s.now,
        quality,
      };
      store(s)[costume.id] = costume;
      const asset = makeGarment(s, costume, 'Made By You');
      costume.assetId = asset.id;

      s.remember({
        category: 'life',
        title: 'Made Something',
        detail: `${describeSpec(costume)}, cut and sewn by you over ${plural(hours, 'hour')}. `
          + `It came out ${verdictFor(quality)}.`,
        refs: [{ type: 'costume', id: costume.id }, { type: 'asset', id: asset.id }],
        significance: 60,
        public: false,
      });
      return { assetId: asset.id, quality, hours, description: describeSpec(costume) };
    },
  );

  /**
   * Have a tailor alter something you already own.
   *
   * Bounded by the garment: taking in is easy, letting out depends on what
   * seam allowance the maker left, and the tailor says which before charging.
   */
  sim.onCommand<{ placeId: Id; assetId: Id; change: string; accountId?: Id }, { cost: Money; note: string; fit: number }>(
    'costume.alter',
    (p, { sim: s }) => {
      const place = placeById(s.player.currentLocationId, p.placeId);
      if (!place || !isCostumier(place)) throw new CommandError('That is not a costume house.');
      const asset = s.universe.assets[p.assetId];
      if (!asset || asset.ownerId !== s.player.id || asset.soldAt) throw new CommandError('You do not own that.');
      if (!asset.wardrobe) throw new CommandError('That is not something you wear.');

      const change = ALTERATIONS.find((a) => a.id === p.change) ?? ALTERATIONS[0]!;
      const cost = Math.round(change.hours * ALTERATION_RATE * (0.7 + tierOf(place) * 0.13) * costOfLiving(place.cityId));
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      s.expense(accountId, cost, `${change.name} — ${asset.name}`, 'shopping');
      s.advanceTo(s.now + FITTING_MINUTES * MS_MINUTE);

      const fit = clamp((asset.wardrobe.fit ?? 70) + change.fit, 20, 100);
      asset.wardrobe.fit = fit;
      asset.provenance = [...(asset.provenance ?? []), { at: s.now, note: `${change.name} at ${place.name}. ${change.note}` }];
      tallyFact(s, cutterAt(s, place).id, { kind: 'topic', sourceKind: 'costumier', aboutId: s.player.id, text: CAME_IN, step: VISIT_STEP });
      return { cost, note: change.note, fit };
    },
  );
}

// ---------------------------------------------------------------------------
// The pieces the commands lean on
// ---------------------------------------------------------------------------

const FITTING_NOTES: readonly string[] = [
  'First fitting, in calico. Nothing is sewn yet and everything is chalk.',
  'Second fitting, in cloth. The shoulders move where they should now.',
  'Third fitting. Hems pinned, and it is finished except for the finishing.',
];

interface Alteration { id: string; name: string; hours: number; fit: number; note: string; }

/** What a tailor will actually do to a finished garment. */
export const ALTERATIONS: readonly Alteration[] = [
  { id: 'take_in', name: 'Take In', hours: 1.5, fit: 14, note: 'Taken in at the side seams. This one is always possible.' },
  { id: 'let_out', name: 'Let Out', hours: 2, fit: 10, note: 'Let out as far as the seam allowance goes, which is as far as the maker left.' },
  { id: 'shorten', name: 'Shorten', hours: 1, fit: 8, note: 'Hemmed up and pressed. Original hem kept inside in case you change your mind.' },
  { id: 'lengthen', name: 'Lengthen', hours: 1.5, fit: 6, note: 'Dropped as far as the turn-up allows. The old crease may still show.' },
  { id: 'shoulders', name: 'Reset The Shoulders', hours: 4, fit: 18, note: 'Sleeves out, shoulders reset, sleeves back in. The expensive one, and the one that matters.' },
  { id: 'taper', name: 'Taper', hours: 2, fit: 12, note: 'Narrowed through the leg or the sleeve.' },
  { id: 'reline', name: 'Reline', hours: 5, fit: 6, note: 'Old lining out, new lining cut and bagged. Adds years.' },
  { id: 'zip', name: 'Replace The Zip', hours: 1, fit: 4, note: 'New zip, matched and set by hand.' },
];

function verdictFor(quality: number): string {
  if (quality >= 85) return 'better than you had any right to expect';
  if (quality >= 70) return 'genuinely good';
  if (quality >= 55) return 'wearable, and you can see the seams you rushed';
  if (quality >= 40) return 'honest but obviously homemade';
  return 'a first attempt, and it looks like one';
}

/**
 * Take the yards out of the stash.
 *
 * Cloth is owned by the yard, so this decrements quantities across the bolts
 * you have and retires any that reach zero. It runs once per made garment.
 */
function consumeCloth(sim: Simulation, assetIds: readonly Id[], yards: number): void {
  let left = yards;
  for (const id of assetIds) {
    if (left <= 0) break;
    const bolt = sim.universe.assets[id];
    if (!bolt) continue;
    const have = bolt.quantity ?? 1;
    const take = Math.min(have, left);
    left -= take;
    if (take >= have) {
      bolt.soldAt = sim.now;
      bolt.currentValue = 0;
    } else {
      bolt.quantity = have - take;
      bolt.currentValue = Math.round((bolt.currentValue ?? 0) * ((have - take) / have));
    }
  }
}

/**
 * The finished garment.
 *
 * A real thing in the wardrobe with a peg, a color, a cloth and a fit, and a
 * provenance line saying who made it and what SLATE's numbers are. A garment
 * cut for one body is worth very little to anybody else, and the resale
 * figure says so rather than pretending otherwise.
 */
function makeGarment(sim: Simulation, costume: Costume, placeName: string): OwnedAsset {
  const kind = garmentKindOf(costume.kind);
  const cloth = clothOf(costume.cloth);
  const finish = finishOf(costume.finish);
  const owner = sim.universe.people[costume.forPersonId];
  const quality = costume.quality ?? 60;
  const id = sim.nextId('asset');
  const name = costume.maker === 'self'
    ? `${cloth.name} ${kind.name}`
    : `${placeName} ${kind.name}`;
  const asset: OwnedAsset = {
    id,
    saveId: sim.universe.meta.id,
    ownerId: costume.forPersonId,
    ownerKind: 'person',
    name,
    brand: costume.maker === 'self' ? 'Made By You' : placeName,
    category: 'clothing',
    catalogId: undefined,
    purchasePrice: costume.quotedPrice,
    currentValue: Math.round(costume.quotedPrice * BESPOKE_RESALE),
    condition: 100,
    acquiredAt: sim.now,
    acquiredVia: 'purchase',
    tags: ['wear', 'bespoke', kind.slot, costume.maker === 'self' ? 'self made' : 'made to measure'],
    locationPropertyId: owner?.residenceId,
    provenance: [
      { at: sim.now, note: costume.maker === 'self'
        ? `Cut and sewn by you. ${describeSpec(costume)}.`
        : `Made at ${placeName}. ${describeSpec(costume)}.` },
      ...(costume.label ? [{ at: sim.now, note: `Labeled: "${costume.label}".` }] : []),
      { at: sim.now, note: finish.detail },
      { at: sim.now, note: costume.maker === 'self' ? SELF_MADE_NOTE : COSTUME_NOTE },
    ],
    wardrobe: {
      slot: kind.slot,
      formality: kind.formality,
      season: ['Spring', 'Summer', 'Autumn', 'Winter'],
      colour: defaultColour(id, `${cloth.name} ${kind.name}`, kind.slot),
      material: materialFor(cloth.id),
      cleanliness: 100,
      timesWorn: 0,
      fit: quality,
    },
  };
  sim.universe.assets[asset.id] = asset;
  rememberFact(sim, costume.forPersonId, {
    kind: 'topic',
    sourceKind: 'costumier',
    aboutId: costume.forPersonId,
    text: costume.maker === 'self'
      ? `Made ${describeSpec(costume)} themselves.`
      : `Had ${describeSpec(costume)} cut at ${placeName}.`,
    weight: 66,
  });
  return asset;
}

/** The wardrobe's word for what this cloth is. */
function materialFor(clothId: string): string {
  switch (clothId) {
    case 'cotton_shirting': case 'cotton_twill': case 'jersey': case 'ponte': return 'cotton';
    case 'canvas': return 'canvas';
    case 'denim': return 'denim';
    case 'linen': return 'linen';
    case 'wool_suiting': return 'worsted';
    case 'wool_flannel': case 'wool_melton': case 'tweed': return 'wool';
    case 'cashmere': return 'cashmere';
    case 'silk_charmeuse': case 'silk_dupioni': case 'silk_chiffon': case 'silk_velvet':
    case 'satin': case 'taffeta': return 'silk';
    case 'lace': return 'lace';
    case 'sequin': return 'sequin';
    case 'leather': return 'leather';
    case 'faux_fur': return 'faux fur';
    default: return 'cotton';
  }
}

/** Everything the workroom can make, for the UI and the scene. */
export const WORKROOM = { GARMENT_KINDS, CLOTHS, FINISHES, ALTERATIONS } as const;
