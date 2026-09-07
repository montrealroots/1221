/**
 * SLATE — the jeweler's, and having a piece made.
 *
 * Two rooms in one file. The first is the shop: a case rather than a rail,
 * pieces taken out one at a time and put on a cloth, a loupe if you ask for
 * one, and somebody who remembers whether you bought last time. That runs on
 * the same `shop.purchase` engine as everything else, because there is one
 * purchase engine in this game and there is not going to be a second.
 *
 * The second is the bench, and it is the reason this file exists. You say what
 * you want; the jeweler asks the five questions a real one asks — what piece,
 * what metal, what stone, how it is cut and graded, how it is held — and then
 * quotes. The quote is fixed at that moment. You leave a deposit, weeks pass,
 * and you come back for something that did not exist before and that nobody
 * else has.
 *
 * Money rules, which are the same as everywhere else in SLATE:
 *
 * - A deposit is taken once. Approving an already-ordered commission is a
 *   no-op that returns the same numbers, so a retried click cannot pay twice.
 * - Collection charges the balance once and creates exactly one asset.
 * - Canceling before the bench starts refunds the deposit in full; canceling
 *   after it does not, because the metal has been bought and the wax is cut.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import { clamp } from '../core/rng';
import { MS_DAY, MS_MINUTE, addDays } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { plural } from '../core/text';
import type { Commission, Id, OwnedAsset, Person } from '../domain/model';
import { placeById, type Place } from '../content/places';
import { RETAILERS, type Retailer } from '../content/catalog';
import { costOfLiving } from '../content/tax';
import {
  JEWELLERY_NOTE, clarityOf, colourGradeOf, cutOf, metalOf, pieceOf, settingOf, stoneOf,
} from '../content/jewellery';
import { makeBackgroundPerson, peopleOf } from './people';
import { factsOf, rememberFact, tallyFact, tallyOf } from './memory';

/** A piece worth this much is worth scheduling on a valuables policy. */
export const VALUABLES_FLOOR: Money = 15_000_00;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** What the bench charges for an hour of its own time, before the materials. */
export const BENCH_RATE = 95_00;

/** Hours of bench time per gram of metal moved. SLATE's own figure. */
export const HOURS_PER_GRAM = 0.22;

/** What a gram of sterling silver stands in for. Every other metal is a factor of it. */
export const SILVER_PER_GRAM = 1_10;

/** The share of the quote taken up front. A bench does not start on a promise. */
export const DEPOSIT_SHARE = 0.4;

/** Once the bench has started, the deposit has been spent on metal. */
export const REFUNDABLE_DAYS = 3;

/** Minutes spent at the counter looking at one piece properly. */
export const LOUPE_MINUTES = 6;

/** Minutes spent designing a piece with somebody. */
export const DESIGN_MINUTES = 40;

/** How much a bespoke piece is worth the day after you collect it. */
export const BESPOKE_RESALE = 0.42;

/** Visits before the counter knows your face. */
export const REGULAR_VISITS = 3;

const CAME_IN = 'Came into the shop';
const COMMISSIONED = 'Commissioned a piece';
const VISIT_STEP = 25;
const COMMISSION_STEP = 34;

// ---------------------------------------------------------------------------
// The shop
// ---------------------------------------------------------------------------

/** Whether this place has a jeweler's counter: a maison, a chain, or a bench. */
export function isJeweller(place: Place | undefined): boolean {
  if (!place) return false;
  if (place.kind === 'jeweller') return true;
  const retailer = place.retailerId ? RETAILERS.get(place.retailerId) : undefined;
  return retailer?.type === 'jeweller';
}

/** The chain behind the counter, where there is one. A bench has none. */
export function houseAt(place: Place): Retailer | undefined {
  return place.retailerId ? RETAILERS.get(place.retailerId) : undefined;
}

/**
 * How dear the room is, one to five.
 *
 * A maison is a five and the bench above the ironmonger is a two, and it
 * decides the bench rate, the stones they will get in, and how long the wait
 * for everything is.
 */
export function tierOf(place: Place): number {
  return houseAt(place)?.tier ?? clamp(Math.round(place.quality / 24), 2, 4);
}

/** The person behind the counter, or at the bench. The same one every time. */
export function jewellerAt(sim: Simulation, place: Place): Person {
  const archetype = `jeweler:${place.id}`;
  const existing = peopleOf(sim, archetype)[0];
  if (existing) return existing;
  const rng = sim.rng('jeweller', place.id);
  const tier = tierOf(place);
  const bench = place.kind === 'jeweller';
  return makeBackgroundPerson(sim, {
    rng,
    archetype,
    industryRole: 'retail',
    cityId: place.cityId,
    background: bench ? `At the bench at ${place.name}.` : `Behind the counter at ${place.name}.`,
    interests: [rng.pick(['antiques', 'drawing', 'metalwork', 'geology', 'auctions', 'restoration']), 'jewellery'],
    skills: {
      // A bench is a maker; a counter is a seller. Both know stones.
      goldsmithing: clamp(bench ? rng.int(62, 96) : tier * 12 + rng.int(0, 20), 10, 100),
      selling: clamp(bench ? rng.int(30, 70) : tier * 15 + rng.int(0, 22), 15, 100),
    },
    age: bench ? [32, 70] : [24, 60],
    personality: {
      conscientiousness: rng.int(62, 98),
      extraversion: bench ? rng.int(25, 70) : rng.int(50, 92),
      agreeableness: rng.int(40, 92),
    },
    lifestyle: tier >= 4 ? 'comfortable' : 'modest',
  });
}

export interface Standing {
  visits: number;
  commissions: number;
  regular: boolean;
}

/** What the counter remembers about you. */
export function standingAt(sim: Simulation, place: Place): Standing {
  const facts = factsOf(sim, jewellerAt(sim, place).id, { aboutId: sim.player.id });
  const visits = tallyOf(facts, CAME_IN, VISIT_STEP);
  return {
    visits,
    commissions: tallyOf(facts, COMMISSIONED, COMMISSION_STEP),
    regular: visits >= REGULAR_VISITS,
  };
}

// ---------------------------------------------------------------------------
// What a piece costs to make
// ---------------------------------------------------------------------------

export interface Spec {
  piece: string;
  metal: string;
  stone: string;
  carats: number;
  cut: string;
  colourGrade?: string;
  clarity?: string;
  setting: string;
  engraving?: string;
}

export interface Quote {
  metalCost: Money;
  stoneCost: Money;
  labour: Money;
  total: Money;
  weeks: number;
  /** What the room will not do, said plainly rather than by refusing. */
  cautions: string[];
}

/**
 * What the bench says when you finish describing it.
 *
 * Metal by weight, stone by carat against its grade, labor by the hour and
 * the difficulty of the setting, and the whole thing scaled by how dear this
 * room is and how dear this city is. Every figure is SLATE's own.
 */
export function quoteFor(place: Place, spec: Spec): Quote {
  const piece = pieceOf(spec.piece);
  const metal = metalOf(spec.metal);
  const stone = stoneOf(spec.stone);
  const cut = cutOf(spec.cut);
  const setting = settingOf(spec.setting);
  const tier = tierOf(place);
  const col = costOfLiving(place.cityId);

  // A pair is two of everything, and a rivière is a great many.
  const multiples = piece.id === 'stud_earrings' || piece.id === 'drop_earrings'
    || piece.id === 'hoop_earrings' || piece.id === 'cufflinks' ? 2 : 1;

  const metalCost = Math.round(piece.grams * metal.costFactor * SILVER_PER_GRAM * multiples * col);

  let stoneCost = 0;
  if (piece.takesStone && stone.id !== 'none' && spec.carats > 0) {
    const grade = stone.graded
      ? colourGradeOf(spec.colourGrade).factor * clarityOf(spec.clarity).factor
      : 1;
    // Big stones cost more than proportionally: rough that size is rarer.
    const size = Math.pow(spec.carats, 1.6);
    stoneCost = Math.round(stone.perCarat * size * grade * cut.yieldFactor * multiples);
  }

  const hours = piece.grams * HOURS_PER_GRAM * setting.labour * multiples;
  const labour = Math.round(hours * BENCH_RATE * (0.7 + tier * 0.12) * col);

  const weeks = Math.max(2, Math.round((piece.weeks + setting.weeks) * (tier >= 5 ? 1.6 : 1)));

  return {
    metalCost, stoneCost, labour,
    total: metalCost + stoneCost + labour,
    weeks,
    cautions: cautionsFor(spec),
  };
}

/**
 * What a real jeweler would say out loud before taking your money.
 *
 * None of these refuse the order. They are the things somebody who does this
 * for a living would think it dishonest not to mention.
 */
export function cautionsFor(spec: Spec): string[] {
  const piece = pieceOf(spec.piece);
  const metal = metalOf(spec.metal);
  const stone = stoneOf(spec.stone);
  const setting = settingOf(spec.setting);
  const out: string[] = [];

  if (piece.slot === 'ring' && !metal.resizable) {
    out.push(`${metal.name} cannot be sized. If your hand changes, the ring does not.`);
  }
  if (piece.id === 'eternity_band') {
    out.push('An eternity band has stones all the way round, so it cannot be sized later either.');
  }
  if (setting.id === 'tension') {
    out.push('A tension setting cannot be resized and cannot be repaired the ordinary way.');
  }
  if (stone.mohs > 0 && stone.mohs < 7 && piece.slot === 'ring') {
    out.push(`${stone.name} is soft at ${stone.mohs} on the Mohs scale. In a ring it will scuff, and that is not a fault.`);
  }
  if (stone.id === 'pearl' && piece.slot === 'ring') {
    out.push('A pearl in a ring is a decision. They dislike being knocked and they dislike perfume.');
  }
  if (stone.id === 'emerald') {
    out.push('Almost every emerald is oiled, which is normal and disclosed. It also means no ultrasonic cleaner, ever.');
  }
  if (setting.protection < 60 && stone.mohs > 0 && stone.mohs < 9) {
    out.push(`A ${setting.name.toLowerCase()} leaves the stone exposed, and this one is not diamond hard.`);
  }
  if (spec.carats >= 3 && stone.graded && clarityOf(spec.clarity).factor < 0.9) {
    out.push('At this size an SI inclusion is often findable without a loupe. Worth seeing the actual stone.');
  }
  if (metal.id === 'silver' && spec.carats >= 1) {
    out.push('Silver is soft for a stone this size. Most benches would want you in gold or platinum.');
  }
  if (spec.engraving && spec.engraving.length > 30) {
    out.push('That is a lot of words for the inside of a band. It can be done small, or it can be done legibly.');
  }
  return out;
}

/** A sentence describing the piece the way a valuation would. */
export function describeSpec(spec: Spec): string {
  const piece = pieceOf(spec.piece);
  const metal = metalOf(spec.metal);
  const stone = stoneOf(spec.stone);
  const setting = settingOf(spec.setting);
  const bits = [`${metal.name} ${piece.name.toLowerCase()}`];
  if (piece.takesStone && stone.id !== 'none' && spec.carats > 0) {
    const carat = `${spec.carats.toFixed(2)} carat`;
    const graded = stone.graded && spec.colourGrade && spec.clarity
      ? `, ${colourGradeOf(spec.colourGrade).name} ${clarityOf(spec.clarity).name}` : '';
    bits.push(`set with a ${carat} ${cutOf(spec.cut).name.toLowerCase()} ${stone.name.toLowerCase()}${graded}`);
    if (setting.id !== 'plain') bits.push(`in a ${setting.name.toLowerCase()} setting`);
  }
  return bits.join(', ');
}

/** Every piece being made for you, newest first. */
export function commissionsOf(sim: Simulation, personId: Id): Commission[] {
  return Object.values(sim.universe.commissions ?? {})
    .filter((c) => c.forPersonId === personId)
    .sort((a, b) => b.quotedAt - a.quotedAt);
}

/** The ones still in progress: quoted and not yet ordered, or on the bench. */
export function openCommissions(sim: Simulation, personId: Id): Commission[] {
  return commissionsOf(sim, personId).filter((c) => c.status === 'quoted' || c.status === 'ordered' || c.status === 'ready');
}

function store(sim: Simulation): Record<Id, Commission> {
  return (sim.universe.commissions ??= {});
}

function requireCommission(sim: Simulation, id: Id): Commission {
  const found = store(sim)[id];
  if (!found) throw new CommandError('No such commission.');
  return found;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export function registerJewellery(sim: Simulation): void {
  sim.onSchedule('jewel.ready', (item) => {
    const commission = store(sim)[item.payload.commissionId as Id];
    if (!commission || commission.status !== 'ordered') return;
    commission.status = 'ready';
    const place = placeOf(sim, commission.placeId);
    sim.notify({
      category: 'shopping',
      title: 'Your Piece Is Ready',
      body: `${describeSpec(commission)} is finished and waiting at ${place?.name ?? 'the bench'}. `
        + `${formatMoney(commission.quotedPrice - commission.deposit)} to settle on collection.`,
      importance: 60,
      route: '/workspace/shopping',
    });
  });

  /**
   * Look at something properly.
   *
   * The counter takes it out, you turn it over, and both of you remember it.
   * This buys nothing; it is how a case differs from a list.
   */
  sim.onCommand<{ placeId: Id }, { visits: number; regular: boolean; jewellerId: Id }>(
    'jewel.look',
    (p, { sim: s }) => {
      const place = placeById(s.player.currentLocationId, p.placeId);
      if (!place || !isJeweller(place)) throw new CommandError('That is not a jeweler.');
      const jeweller = jewellerAt(s, place);
      s.advanceTo(s.now + LOUPE_MINUTES * MS_MINUTE);
      tallyFact(s, jeweller.id, { kind: 'topic', sourceKind: 'jeweller', aboutId: s.player.id, text: CAME_IN, step: VISIT_STEP });
      const standing = standingAt(s, place);
      return { visits: standing.visits, regular: standing.regular, jewellerId: jeweller.id };
    },
  );

  /**
   * Design a piece and get a number for it.
   *
   * Quoting costs nothing and commits to nothing. The price is fixed here and
   * carried on the record, so the bench cannot quietly revise it later.
   */
  sim.onCommand<Spec & { placeId: Id; forPersonId?: Id }, { commissionId: Id; quote: Quote; description: string }>(
    'jewel.commission',
    (p, { sim: s }) => {
      const place = placeById(s.player.currentLocationId, p.placeId);
      if (!place || !isJeweller(place)) throw new CommandError('That is not a jeweler.');
      const piece = pieceOf(p.piece);
      const carats = piece.takesStone ? clamp(Number(p.carats) || 0, 0, 30) : 0;
      const engraving = (p.engraving ?? '').trim().slice(0, 60) || undefined;

      const spec: Spec = {
        piece: piece.id,
        metal: metalOf(p.metal).id,
        stone: piece.takesStone ? stoneOf(p.stone).id : 'none',
        carats,
        cut: cutOf(p.cut).id,
        colourGrade: p.colourGrade ? colourGradeOf(p.colourGrade).id : undefined,
        clarity: p.clarity ? clarityOf(p.clarity).id : undefined,
        setting: settingOf(p.setting).id,
        engraving,
      };
      const quote = quoteFor(place, spec);
      s.advanceTo(s.now + DESIGN_MINUTES * MS_MINUTE);

      const commission: Commission = {
        id: s.nextId('commission'),
        saveId: s.universe.meta.id,
        placeId: place.id,
        jewellerId: jewellerAt(s, place).id,
        forPersonId: p.forPersonId ?? s.player.id,
        ...spec,
        quotedPrice: quote.total,
        deposit: Math.round(quote.total * DEPOSIT_SHARE),
        status: 'quoted',
        quotedAt: s.now,
      };
      store(s)[commission.id] = commission;
      return { commissionId: commission.id, quote, description: describeSpec(spec) };
    },
  );

  /**
   * Leave the deposit, and the bench starts.
   *
   * Approving twice is a no-op that returns the same numbers rather than a
   * second charge: a retried request must never take a second deposit.
   */
  sim.onCommand<{ commissionId: Id; accountId?: Id }, { deposit: Money; balance: Money; readyAt: number; weeks: number }>(
    'jewel.approve',
    (p, { sim: s }) => {
      const commission = requireCommission(s, p.commissionId);
      const answer = () => ({
        deposit: commission.deposit,
        balance: commission.quotedPrice - commission.deposit,
        readyAt: commission.readyAt ?? s.now,
        weeks: Math.max(1, Math.round(((commission.readyAt ?? s.now) - (commission.orderedAt ?? s.now)) / (7 * MS_DAY))),
      });
      if (commission.status === 'ordered' || commission.status === 'ready') return answer();
      if (commission.status !== 'quoted') throw new CommandError('That commission is closed.');

      const place = placeById(s.player.currentLocationId, commission.placeId);
      const weeks = quoteFor(place!, commission).weeks;
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay the deposit from.');

      s.expense(accountId, commission.deposit, `Deposit — ${describeSpec(commission)}`, 'shopping');
      commission.status = 'ordered';
      commission.orderedAt = s.now;
      commission.depositPaidAt = s.now;
      commission.readyAt = addDays(s.now, weeks * 7, s.homeZone);

      s.schedule({
        at: commission.readyAt,
        kind: 'jewel.ready',
        label: 'A Piece Is Finished',
        category: 'personal',
        payload: { commissionId: commission.id },
        priority: 40,
      });
      if (place) {
        tallyFact(s, jewellerAt(s, place).id, { kind: 'topic', sourceKind: 'jeweller', aboutId: s.player.id, text: COMMISSIONED, step: COMMISSION_STEP });
      }
      s.remember({
        category: 'life',
        title: 'Commissioned A Piece',
        detail: `${describeSpec(commission)}, at ${place?.name ?? 'a bench'}. Ready in ${plural(weeks, 'week')}.`,
        refs: [{ type: 'commission', id: commission.id }],
        significance: 55,
        public: false,
        amount: commission.quotedPrice,
      });
      return answer();
    },
  );

  /**
   * Collect it, settle the balance, and own something nobody else has.
   *
   * Collecting twice returns the piece that already exists rather than making
   * a second one and charging for it.
   */
  sim.onCommand<{ commissionId: Id; accountId?: Id }, { assetId: Id; paid: Money; description: string }>(
    'jewel.collect',
    (p, { sim: s }) => {
      const commission = requireCommission(s, p.commissionId);
      if (commission.status === 'collected' && commission.assetId) {
        return { assetId: commission.assetId, paid: 0, description: describeSpec(commission) };
      }
      if (commission.status !== 'ready') throw new CommandError('It is not finished yet.');

      const place = placeById(s.player.currentLocationId, commission.placeId);
      const balance = commission.quotedPrice - commission.deposit;
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to settle the balance from.');
      s.expense(accountId, balance, `Balance — ${describeSpec(commission)}`, 'shopping');

      const asset = makeBespoke(s, commission, place?.name ?? 'A Bench');
      commission.status = 'collected';
      commission.collectedAt = s.now;
      commission.balancePaidAt = s.now;
      commission.assetId = asset.id;
      s.remember({
        category: 'life',
        title: 'Collected A Piece',
        detail: `${describeSpec(commission)}${commission.engraving ? `, engraved "${commission.engraving}"` : ''}, from ${place?.name ?? 'the bench'}.`,
        refs: [{ type: 'commission', id: commission.id }, { type: 'asset', id: asset.id }],
        significance: 62,
        public: false,
        amount: commission.quotedPrice,
      });
      if (asset.currentValue >= VALUABLES_FLOOR) {
        s.requireDecision({
          urgency: 40, category: 'insurance', refType: 'asset', refId: asset.id,
          title: 'Add It To Your Valuables Cover',
          detail: `${describeSpec(commission)} is worth ${formatMoney(asset.currentValue)}. A scheduled valuables policy is how a piece like it is really insured; a house policy caps jewelry low.`,
          route: '/workspace/insurance',
          actions: [{ label: 'Get A Quote', commandKind: 'ins.quote', payload: { line: 'valuables', coveredRefs: [{ type: 'asset', id: asset.id }] } }],
        });
      }
      return { assetId: asset.id, paid: balance, description: describeSpec(commission) };
    },
  );

  /**
   * Change your mind.
   *
   * Before the bench has cut anything the deposit comes back. After that it
   * does not, because the metal is bought and the wax is carved, and the
   * jeweler says so rather than the game hiding it.
   */
  sim.onCommand<{ commissionId: Id; accountId?: Id }, { refunded: Money; kept: Money }>(
    'jewel.cancel',
    (p, { sim: s }) => {
      const commission = requireCommission(s, p.commissionId);
      if (commission.status === 'cancelled') return { refunded: 0, kept: 0 };
      if (commission.status === 'collected') throw new CommandError('You already have it.');

      let refunded = 0;
      if (commission.status === 'ordered' || commission.status === 'ready') {
        const started = s.now - (commission.orderedAt ?? s.now);
        if (started <= REFUNDABLE_DAYS * MS_DAY) {
          const accountId = p.accountId ?? s.player.primaryAccountId;
          if (accountId) {
            s.income(accountId, commission.deposit, `Deposit returned — ${describeSpec(commission)}`, 'other');
            refunded = commission.deposit;
          }
        }
      }
      commission.status = 'cancelled';
      commission.cancelledReason = refunded > 0
        ? 'Canceled before the bench had started. The deposit came back.'
        : 'Canceled once the metal had been bought. The deposit did not come back.';
      return { refunded, kept: commission.deposit - refunded };
    },
  );

  // -------------------------------------------------------------------------
  // What a jeweler does besides selling
  // -------------------------------------------------------------------------

  /** Sizing a ring. Some metals and some settings will not take it. */
  sim.onCommand<{ placeId: Id; assetId: Id; accountId?: Id }, { cost: Money; readyAt: number }>(
    'jewel.resize',
    (p, { sim: s }) => {
      const place = placeById(s.player.currentLocationId, p.placeId);
      if (!place || !isJeweller(place)) throw new CommandError('That is not a jeweler.');
      const asset = s.universe.assets[p.assetId];
      if (!asset || asset.ownerId !== s.player.id) throw new CommandError('That is not yours.');
      if (asset.wardrobe?.slot !== 'ring') throw new CommandError('Only a ring gets sized.');

      const metal = metalOf(asset.bespoke?.metal);
      if (asset.bespoke && !metal.resizable) {
        throw new CommandError(`${metal.name} cannot be sized. You were told that when you ordered it.`);
      }
      const cost = Math.round(BENCH_RATE * 1.2 * costOfLiving(place.cityId));
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (accountId) s.expense(accountId, cost, `Ring sizing — ${asset.name}`, 'shopping');
      const readyAt = addDays(s.now, 7, s.homeZone);
      awayUntil(asset, readyAt, 'At The Jeweler');
      return { cost, readyAt };
    },
  );

  /** A clasp, a claw, a restring. What actually breaks. */
  sim.onCommand<{ placeId: Id; assetId: Id; accountId?: Id }, { cost: Money; readyAt: number; note: string }>(
    'jewel.repair',
    (p, { sim: s }) => {
      const place = placeById(s.player.currentLocationId, p.placeId);
      if (!place || !isJeweller(place)) throw new CommandError('That is not a jeweler.');
      const asset = s.universe.assets[p.assetId];
      if (!asset || asset.ownerId !== s.player.id) throw new CommandError('That is not yours.');

      const wear = 100 - asset.condition;
      const cost = Math.round((BENCH_RATE * 0.6 + wear * 320) * costOfLiving(place.cityId));
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (accountId) s.expense(accountId, cost, `Repair — ${asset.name}`, 'shopping');
      const days = wear > 40 ? 21 : 10;
      const readyAt = addDays(s.now, days, s.homeZone);
      awayUntil(asset, readyAt, 'Being Repaired');
      // The repair is booked now and lands when it lands; the condition comes
      // back on collection rather than the moment the money leaves.
      s.schedule({
        at: readyAt,
        kind: 'jewel.repaired',
        label: 'A Repair Is Done',
        category: 'personal',
        payload: { assetId: asset.id, placeId: place.id },
        priority: 45,
      });
      return { cost, readyAt, note: `Back in ${plural(days, 'day')}.` };
    },
  );

  sim.onSchedule('jewel.repaired', (item) => {
    const asset = sim.universe.assets[item.payload.assetId as Id];
    if (!asset) return;
    asset.condition = clamp(asset.condition + 34, 0, 100);
    if (asset.wardrobe) {
      asset.wardrobe.awayUntil = undefined;
      asset.wardrobe.awayReason = undefined;
    }
    const place = placeOf(sim, item.payload.placeId as Id);
    sim.notify({
      category: 'shopping',
      title: 'Repair Finished',
      body: `${asset.name} is back from ${place?.name ?? 'the jeweller'}, and better than it went in.`,
      importance: 40,
      route: '/workspace/shopping',
    });
  });

  /** Cleaning and polishing, while you wait. Not for everything. */
  sim.onCommand<{ placeId: Id; assetId: Id; accountId?: Id }, { cost: Money; condition: number; refused?: string }>(
    'jewel.clean',
    (p, { sim: s }) => {
      const place = placeById(s.player.currentLocationId, p.placeId);
      if (!place || !isJeweller(place)) throw new CommandError('That is not a jeweler.');
      const asset = s.universe.assets[p.assetId];
      if (!asset || asset.ownerId !== s.player.id) throw new CommandError('That is not yours.');

      // A jeweler who ultrasonics an emerald or a pearl is not one you go back
      // to. They say no to the machine and clean it by hand instead.
      const stone = stoneOf(asset.bespoke?.stone);
      const delicate = stone.id === 'emerald' || stone.id === 'pearl' || stone.id === 'opal' || stone.id === 'turquoise';
      const cost = Math.round((delicate ? 55_00 : 30_00) * costOfLiving(place.cityId));
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (accountId) s.expense(accountId, cost, `Cleaning — ${asset.name}`, 'shopping');
      s.advanceTo(s.now + 30 * MS_MINUTE);
      asset.condition = clamp(asset.condition + (delicate ? 6 : 11), 0, 100);
      return {
        cost,
        condition: Math.round(asset.condition),
        refused: delicate ? `No ultrasonic on ${stone.name.toLowerCase()}. Warm water, a soft brush and patience.` : undefined,
      };
    },
  );

  /** A written valuation, which is what an insurer actually wants. */
  sim.onCommand<{ placeId: Id; assetId: Id; accountId?: Id }, { cost: Money; valuation: Money; note: string }>(
    'jewel.appraise',
    (p, { sim: s }) => {
      const place = placeById(s.player.currentLocationId, p.placeId);
      if (!place || !isJeweller(place)) throw new CommandError('That is not a jeweler.');
      const asset = s.universe.assets[p.assetId];
      if (!asset || asset.ownerId !== s.player.id) throw new CommandError('That is not yours.');

      const cost = Math.round(85_00 * costOfLiving(place.cityId));
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (accountId) s.expense(accountId, cost, `Valuation — ${asset.name}`, 'shopping');
      s.advanceTo(s.now + 45 * MS_MINUTE);

      // A replacement valuation is what it would cost to have it made again,
      // which is more than it would fetch. That gap is the whole reason the
      // document exists, and it is worth the game being straight about it.
      const valuation = Math.round(asset.purchasePrice * 1.1 * (asset.condition / 100) + asset.purchasePrice * 0.1);
      asset.provenance.push({
        at: s.now,
        note: `Valued for insurance at ${formatMoney(valuation)} by ${place.name}.`,
      });
      return {
        cost,
        valuation,
        note: 'That is a replacement figure for your insurer, not what it would fetch if you sold it.',
      };
    },
  );

  /** Words inside a band. Yours, and permanent. */
  sim.onCommand<{ placeId: Id; assetId: Id; text: string; accountId?: Id }, { cost: Money; text: string }>(
    'jewel.engrave',
    (p, { sim: s }) => {
      const place = placeById(s.player.currentLocationId, p.placeId);
      if (!place || !isJeweller(place)) throw new CommandError('That is not a jeweler.');
      const asset = s.universe.assets[p.assetId];
      if (!asset || asset.ownerId !== s.player.id) throw new CommandError('That is not yours.');
      const text = p.text.trim().slice(0, 60);
      if (text.length === 0) throw new CommandError('Nothing to cut.');

      const cost = Math.round((45_00 + text.length * 90) * costOfLiving(place.cityId));
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (accountId) s.expense(accountId, cost, `Engraving — ${asset.name}`, 'shopping');
      s.advanceTo(s.now + 40 * MS_MINUTE);
      if (asset.bespoke) asset.bespoke.engraving = text;
      asset.provenance.push({ at: s.now, note: `Engraved: "${text}".` });
      return { cost, text };
    },
  );
}

/**
 * The place, found from wherever the player happens to be.
 *
 * A commission is collected in the city it was ordered in, which is normally
 * where you are; a scheduled handler runs whether you are there or not, so it
 * looks in the city on the record as well.
 */
function placeOf(sim: Simulation, placeId: Id): Place | undefined {
  const cityId = placeId.split(':')[0] ?? sim.player.currentLocationId;
  return placeById(cityId, placeId) ?? placeById(sim.player.currentLocationId, placeId);
}

/** Marks a thing as away at the bench, the way the cleaner does. */
function awayUntil(asset: OwnedAsset, at: number, reason: string): void {
  if (!asset.wardrobe) return;
  asset.wardrobe.awayUntil = at;
  asset.wardrobe.awayReason = reason;
}

/**
 * The finished piece.
 *
 * Not from the catalog, because it is not in the catalog: it is a one off
 * with its whole specification recorded on it. It is worth less the moment you
 * walk out with it, which is true of bespoke and which the game does not
 * pretend otherwise about.
 */
function makeBespoke(sim: Simulation, commission: Commission, placeName: string): OwnedAsset {
  const piece = pieceOf(commission.piece);
  const metal = metalOf(commission.metal);
  const owner = sim.universe.people[commission.forPersonId];
  const asset: OwnedAsset = {
    id: sim.nextId('asset'),
    saveId: sim.universe.meta.id,
    ownerId: commission.forPersonId,
    ownerKind: 'person',
    name: `${placeName} ${piece.name}`,
    brand: placeName,
    category: 'jewelry',
    catalogId: undefined,
    purchasePrice: commission.quotedPrice,
    currentValue: Math.round(commission.quotedPrice * BESPOKE_RESALE),
    condition: 100,
    acquiredAt: sim.now,
    acquiredVia: 'purchase',
    tags: ['jewellery', 'bespoke', pieceOf(commission.piece).slot],
    locationPropertyId: owner?.residenceId,
    provenance: [
      { at: sim.now, note: `Made at ${placeName}. ${describeSpec(commission)}.` },
      ...(commission.engraving ? [{ at: sim.now, note: `Engraved: "${commission.engraving}".` }] : []),
      { at: sim.now, note: JEWELLERY_NOTE },
    ],
    bespoke: {
      commissionId: commission.id,
      placeName,
      piece: commission.piece,
      metal: commission.metal,
      stone: commission.stone,
      carats: commission.carats,
      cut: commission.cut,
      colourGrade: commission.colourGrade,
      clarity: commission.clarity,
      setting: commission.setting,
      engraving: commission.engraving,
      madeAt: sim.now,
    },
    wardrobe: {
      slot: piece.slot,
      formality: 66,
      season: ['Spring', 'Summer', 'Autumn', 'Winter'],
      colour: metal.colour,
      material: commission.stone === 'none' ? 'metal' : 'gemstone',
      cleanliness: 100,
      timesWorn: 0,
    },
  };
  sim.universe.assets[asset.id] = asset;
  rememberFact(sim, commission.forPersonId, {
    kind: 'topic',
    sourceKind: 'jeweller',
    aboutId: commission.forPersonId,
    text: `Had ${describeSpec(commission)} made at ${placeName}.`,
    weight: 70,
  });
  return asset;
}
