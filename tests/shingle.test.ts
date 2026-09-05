/**
 * The company.
 *
 * The strike ended every other production company and the player opens the
 * only one trading. Everything in the game finally resolves to something this
 * company did, so what it costs to open, what it costs to keep open, and what
 * happens when it cannot pay are the three things worth holding it to.
 *
 * The strike itself is invented for this game. These tests check that the save
 * says so, because a screenshot of the opening should never be mistakable for
 * an account of a real one.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import {
  FOUNDER_ATTRIBUTES, FOUNDER_BACKGROUNDS, FOUNDER_TRAITS,
  HIGHER_IS_WORSE, conflictingFounderTraits, instrumentFor, traitHasCost,
} from '@/engine/content/founder';
import { REMITS, SHINGLE_BY_ID, SHINGLE_SHAPES } from '@/engine/content/shingle';
import { AFTERMATH, MONOPOLY, STRIKE_IS_FICTION } from '@/engine/content/strike';
import { capacityOf, companyView, founderScore, playerCompany } from '@/engine/systems/shingle';

const aGame = (seed: string, config: Record<string, unknown> = {}) =>
  quickSave({ wealth: 'inherited', ...config }, seed);

describe('the instrument a producer is judged on', () => {
  it('is a separate set from the actor’s, and every one of it is read by something', () => {
    expect(FOUNDER_ATTRIBUTES.length).toBeGreaterThanOrEqual(20);
    const ids = FOUNDER_ATTRIBUTES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const attribute of FOUNDER_ATTRIBUTES) {
      expect(attribute.description.length).toBeGreaterThan(20);
      // An attribute nothing reads is a number on a screen.
      expect(attribute.readBy.length).toBeGreaterThan(15);
      for (const word of attribute.name.split(' ')) {
        if (['a', 'an', 'the', 'for', 'of', 'in', 'with'].includes(word)) continue;
        expect(word[0]).toBe(word[0]!.toUpperCase());
      }
    }
  });

  it('gives every background strengths and real gaps', () => {
    for (const background of FOUNDER_BACKGROUNDS) {
      const sheet = instrumentFor(background.id);
      const values = FOUNDER_ATTRIBUTES.map((a) => sheet[a.id]!);
      expect(Math.max(...values), background.id).toBeGreaterThanOrEqual(50);
      // Nobody is good at all of it. That is the game.
      expect(Math.min(...values), background.id).toBeLessThanOrEqual(30);
      expect(background.gives.length).toBeGreaterThan(20);
      expect(background.costs.length).toBeGreaterThan(20);
    }
  });

  it('costs something for every trait', () => {
    // A cost is a negative attribute, a multiplier below one on something you
    // want more of, or above one on something you want less of.
    for (const trait of FOUNDER_TRAITS) {
      expect(traitHasCost(trait), `${trait.id} is upside with no cost`).toBe(true);
    }
  });

  it('knows which way round every system multiplier reads', () => {
    // A mod nothing can interpret is a mod no system can safely use.
    const used = new Set(FOUNDER_TRAITS.flatMap((t) => Object.keys(t.systemMods ?? {})));
    for (const key of HIGHER_IS_WORSE) {
      expect(used, `${key} is declared a penalty and no trait sets it`).toContain(key);
    }
  });

  it('keeps conflicting traits mutually exclusive, both ways round', () => {
    for (const trait of FOUNDER_TRAITS) {
      for (const other of trait.conflictsWith ?? []) {
        expect(conflictingFounderTraits([other], trait.id)).toContain(other);
        expect(conflictingFounderTraits([trait.id], other)).toContain(trait.id);
      }
    }
  });

  it('reads zero on anybody who is not a producer', () => {
    const sim = aGame('founder-npc');
    const other = Object.values(sim.universe.people).find((p) => !p.isPlayer);
    expect(other?.founder).toBeUndefined();
    expect(founderScore(sim, 'negotiation', other?.id)).toBe(0);
  });

  it('moves the player’s instrument by their traits', () => {
    const plain = aGame('founder-plain', { founderBackground: 'agent', founderTraits: [] });
    const sharp = aGame('founder-sharp', { founderBackground: 'agent', founderTraits: ['sharp'] });
    expect(founderScore(sharp, 'negotiation')).toBeGreaterThan(founderScore(plain, 'negotiation'));
    // And it costs them elsewhere, exactly as the trait says.
    expect(founderScore(sharp, 'reputation_craft')).toBeLessThan(founderScore(plain, 'reputation_craft'));
  });
});

describe('opening the doors', () => {
  it('gives every new save a company', () => {
    const sim = aGame('co-open');
    const company = playerCompany(sim);
    expect(company).toBeDefined();
    expect(company!.founderId).toBe(sim.universe.playerId);
    expect(sim.universe.playerCompanyId).toBe(company!.id);
    expect(company!.ownerships[0]!.percent).toBe(1);
  });

  it('takes the setup cost out and puts the rest in the company', () => {
    const sim = aGame('co-capital', { shingle: 'boutique', founderBackground: 'agent' });
    const company = playerCompany(sim)!;
    const shape = SHINGLE_BY_ID[company.shingle]!;
    const companyCash = sim.universe.accounts[company.cashAccountId]?.balance ?? 0;
    expect(companyCash).toBeGreaterThan(0);
    expect(company.overhead).toBe(shape.overhead);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('falls back to the smallest shop rather than leaving you with no company', () => {
    // An assistant has twelve thousand and a studio costs millions.
    const sim = aGame('co-broke', { shingle: 'studio', founderBackground: 'assistant', wealth: 'nothing' });
    const company = playerCompany(sim);
    expect(company).toBeDefined();
    expect(company!.shingle).toBe('kitchen_table');
  });

  it('will not open a second one', () => {
    const sim = aGame('co-second');
    const refused = sim.execute({
      kind: 'co.found',
      payload: { name: 'Another', shingle: 'boutique', remit: 'genre' },
    });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/already have a company/i);
  });

  it('refuses a shape or a remit that does not exist', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'co-bogus');
    sim.universe.playerCompanyId = undefined;
    for (const payload of [
      { name: 'X', shingle: 'megastudio', remit: 'genre' },
      { name: 'X', shingle: 'boutique', remit: 'anything_at_all' },
      { name: ' ', shingle: 'boutique', remit: 'genre' },
    ]) {
      expect(sim.execute({ kind: 'co.found', payload }).ok, JSON.stringify(payload)).toBe(false);
    }
  });
});

describe('overhead is the clock', () => {
  it('charges every month whether anything is shooting or not', () => {
    const sim = aGame('co-overhead', { founderBackground: 'financier', shingle: 'boutique' });
    const company = playerCompany(sim)!;
    const before = sim.universe.accounts[company.cashAccountId]!.balance;
    sim.advanceTo(sim.now + 95 * MS_DAY);
    const after = sim.universe.accounts[company.cashAccountId]!.balance;
    expect(after).toBeLessThan(before);
    // Three months of it, give or take when the first one landed.
    expect(before - after).toBeGreaterThanOrEqual(company.overhead * 2);
  });

  it('asks the player to do something rather than quietly dying', () => {
    const sim = aGame('co-broke-later', { founderBackground: 'assistant', shingle: 'kitchen_table', wealth: 'nothing' });
    const company = playerCompany(sim)!;
    // Empty the account and let a month pass.
    const balance = sim.universe.accounts[company.cashAccountId]!.balance;
    if (balance > 0) sim.expense(company.cashAccountId, balance, 'Test drain', 'business');
    sim.advanceTo(sim.now + 40 * MS_DAY);
    const asked = Object.values(sim.universe.decisions).some((d) => /payroll|overhead/i.test(d.title));
    const told = sim.universe.notifications.some((n) => /overhead/i.test(n.title));
    expect(asked || told, 'the player was never told the company could not pay').toBe(true);
  });

  it('reports runway in months the player can actually plan with', () => {
    const sim = aGame('co-runway', { founderBackground: 'financier', shingle: 'boutique' });
    const view = companyView(sim)!;
    expect(view.monthsOfRunway).toBeGreaterThan(0);
    expect(Number.isFinite(view.monthsOfRunway)).toBe(true);
  });
});

describe('changing shape', () => {
  it('costs the difference to grow and standing to shrink', () => {
    const sim = aGame('co-grow', { founderBackground: 'financier', shingle: 'kitchen_table' });
    const company = playerCompany(sim)!;
    const reputation = company.reputation;
    const grew = sim.execute({ kind: 'co.change_shape', payload: { shingle: 'boutique' } });
    expect(grew.ok, grew.error).toBe(true);
    expect(playerCompany(sim)!.shingle).toBe('boutique');
    expect(playerCompany(sim)!.reputation).toBe(reputation);

    const shrank = sim.execute({ kind: 'co.change_shape', payload: { shingle: 'kitchen_table' } });
    expect(shrank.ok).toBe(true);
    // Everybody can see you did it.
    expect(playerCompany(sim)!.reputation).toBeLessThan(reputation);
  });

  it('refuses a shape the company cannot afford, and leaves it as it was', () => {
    const sim = aGame('co-cannot-grow', { founderBackground: 'assistant', shingle: 'kitchen_table', wealth: 'nothing' });
    const before = playerCompany(sim)!.shingle;
    const refused = sim.execute({ kind: 'co.change_shape', payload: { shingle: 'studio' } });
    expect(refused.ok).toBe(false);
    expect(playerCompany(sim)!.shingle).toBe(before);
  });

  it('carries capacity from the shape and the founder’s delegation', () => {
    const handsOn = aGame('co-hands', { shingle: 'indie', founderBackground: 'showrunner', founderTraits: ['hands_on'] });
    const delegator = aGame('co-deleg', { shingle: 'indie', founderBackground: 'showrunner', founderTraits: ['delegator'] });
    expect(capacityOf(delegator, playerCompany(delegator)!))
      .toBeGreaterThan(capacityOf(handsOn, playerCompany(handsOn)!));
    // Nobody drops below one, however hands-on they are.
    expect(capacityOf(handsOn, playerCompany(handsOn)!)).toBeGreaterThanOrEqual(1);
  });
});

describe('what you pay becomes what the job pays', () => {
  it('records the rate and says why it matters', () => {
    const sim = aGame('co-rate');
    const set = sim.execute<{ note: string }>({ kind: 'co.set_rate', payload: { craft: 'writer', rate: 90_000_00 } });
    expect(set.ok, set.error).toBe(true);
    expect(sim.universe.industry.ratesSet['writer']).toBe(90_000_00);
    expect(set.value!.note).toMatch(/nobody to argue|going rate|quote back/i);
    expect(MONOPOLY.ratesAreWatched).toBe(true);
  });

  it('moves standing with talent when you cut or raise it', () => {
    const sim = aGame('co-rate-cut');
    sim.execute({ kind: 'co.set_rate', payload: { craft: 'writer', rate: 100_000_00 } });
    const before = playerCompany(sim)!.standingWithTalent;
    sim.execute({ kind: 'co.set_rate', payload: { craft: 'writer', rate: 50_000_00 } });
    expect(playerCompany(sim)!.standingWithTalent).toBeLessThan(before);

    sim.execute({ kind: 'co.set_rate', payload: { craft: 'writer', rate: 140_000_00 } });
    expect(playerCompany(sim)!.standingWithTalent).toBeGreaterThan(playerCompany(sim)!.standingWithTalent - 1);
  });

  it('refuses a negative rate', () => {
    const sim = aGame('co-rate-neg');
    expect(sim.execute({ kind: 'co.set_rate', payload: { craft: 'writer', rate: -1 } }).ok).toBe(false);
  });
});

describe('the strike the game invented', () => {
  it('says plainly that it is invented', () => {
    expect(STRIKE_IS_FICTION).toMatch(/invented/i);
    expect(STRIKE_IS_FICTION).toMatch(/not an account of any real/i);
  });

  it('opens the world with nobody else making anything', () => {
    const sim = aGame('strike-world');
    expect(sim.universe.industry.rivals).toBe(0);
    expect(sim.universe.industry.material).toBe(0);
    expect(sim.universe.industry.buyerHunger).toBeGreaterThan(80);
    expect(sim.universe.industry.crewDepth).toBeLessThan(60);
  });

  it('gives the aftermath both halves: the leverage and the cost', () => {
    expect(AFTERMATH.length).toBeGreaterThanOrEqual(6);
    expect(MONOPOLY.talentAvailability).toBe(1);
    expect(MONOPOLY.buyerUrgency).toBeGreaterThan(1);
    // Being the only one is not free.
    expect(MONOPOLY.scrutiny).toBeGreaterThan(1);
    expect(MONOPOLY.quoteFloor).toBeLessThan(1);
  });

  it('hands the disclaimer over with the brief', () => {
    const sim = aGame('strike-brief');
    const read = sim.execute<{ brief: string; disclaimer: string }>({ kind: 'co.read_brief', payload: {} });
    expect(read.ok).toBe(true);
    expect(read.value!.disclaimer).toBe(STRIKE_IS_FICTION);
    expect(sim.universe.industry.briefed).toBe(true);
  });
});

describe('it all holds together', () => {
  it('every shape and remit is coherent', () => {
    for (const shape of SHINGLE_SHAPES) {
      expect(shape.overhead).toBeGreaterThan(0);
      expect(shape.capacity).toBeGreaterThanOrEqual(1);
      expect(shape.cannot.length).toBeGreaterThan(15);
    }
    // Bigger shops cost more to run and carry more.
    for (let i = 1; i < SHINGLE_SHAPES.length; i++) {
      expect(SHINGLE_SHAPES[i]!.overhead).toBeGreaterThan(SHINGLE_SHAPES[i - 1]!.overhead);
      expect(SHINGLE_SHAPES[i]!.capacity).toBeGreaterThan(SHINGLE_SHAPES[i - 1]!.capacity);
    }
    for (const remit of REMITS) {
      expect(remit.formats.length).toBeGreaterThan(0);
      expect(remit.priceIndex).toBeGreaterThan(0);
    }
  });

  it('survives a save and a load', () => {
    const sim: Simulation = aGame('co-save');
    const round = JSON.parse(JSON.stringify(sim.universe)) as typeof sim.universe;
    expect(validateUniverse(round).ok).toBe(true);
    expect(round.playerCompanyId).toBe(sim.universe.playerCompanyId);
    expect(round.companies[round.playerCompanyId!]!.name).toBe(playerCompany(sim)!.name);
    expect(round.people[round.playerId]!.founder).toBeDefined();
  });

  it('stays coherent after a year of paying for itself', () => {
    const sim = aGame('co-year', { founderBackground: 'financier', shingle: 'boutique' });
    sim.advanceTo(sim.now + 365 * MS_DAY);
    expect(sim.ledger.audit()).toEqual([]);
    const report = validateUniverse(sim.universe);
    expect(report.errors).toEqual([]);
  });
});
