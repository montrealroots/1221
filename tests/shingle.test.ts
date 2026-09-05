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
  HIGHER_IS_WORSE, conflictingFounderTraits, startingPositionFor, traitHasCost,
} from '@/engine/content/founder';
import { REMITS, SHINGLE_BY_ID, SHINGLE_SHAPES } from '@/engine/content/shingle';
import { AFTERMATH, MONOPOLY, OPENING_BRIEF, STRIKE_IS_FICTION } from '@/engine/content/strike';
import { capacityOf, companyView, founderScore, playerCompany } from '@/engine/systems/shingle';
import { FOUNDING_CAPITAL, FOUNDING_SHINGLE } from '@/engine/world/bootstrap';

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

  it('decides money and standing, and never ability', () => {
    // The founder is maxed at all of it whatever they used to do, so a
    // background can only change what is in the bank and who takes the call.
    for (const background of FOUNDER_BACKGROUNDS) {
      const start = startingPositionFor(background.id);
      expect(start.capital, background.id).toBeGreaterThan(0);
      expect(start.standing, background.id).toBeGreaterThanOrEqual(0);
      expect(start.standing, background.id).toBeLessThanOrEqual(1);
      expect(background.gives.length).toBeGreaterThan(20);
      expect(background.costs.length).toBeGreaterThan(20);
    }
    // And they are genuinely different starting positions.
    const capitals = FOUNDER_BACKGROUNDS.map((b) => b.capital);
    expect(Math.max(...capitals) / Math.min(...capitals)).toBeGreaterThan(10);
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

  it('reads the player at the ceiling on every axis', () => {
    const sim = aGame('founder-maxed');
    for (const attribute of FOUNDER_ATTRIBUTES) {
      expect(founderScore(sim, attribute.id), attribute.id).toBe(100);
    }
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
    const sim = aGame('co-capital');
    const company = playerCompany(sim)!;
    const shape = SHINGLE_BY_ID[company.shingle]!;
    const companyCash = sim.universe.accounts[company.cashAccountId]?.balance ?? 0;
    expect(companyCash).toBeGreaterThan(0);
    expect(company.overhead).toBe(shape.overhead);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('opens as an independent on day one, whatever the character has of their own', () => {
    // There is no choice of shape any more and no fallback to a smaller one:
    // the founding stake is sized to this shingle, so a character with forty
    // dollars to their name still opens the same company as anybody else.
    for (const wealth of ['nothing', 'inherited'] as const) {
      const sim = quickSave({ wealth }, `co-open-${wealth}`);
      const company = playerCompany(sim);
      expect(company, wealth).toBeDefined();
      expect(company!.shingle, wealth).toBe(FOUNDING_SHINGLE);
      expect(company!.foundedAt, wealth).toBe(sim.universe.meta.createdAt);
      // Wholly owned by the character who was just created.
      expect(company!.founderId).toBe(sim.player.id);
      expect(company!.ownerships).toEqual([{ holderId: sim.player.id, holderKind: 'person', percent: 1 }]);
      // And the ten million is in the company, not in their pocket.
      expect(sim.universe.accounts[company!.cashAccountId]?.balance, wealth).toBe(FOUNDING_CAPITAL);
      expect(sim.ledger.audit()).toEqual([]);
    }
  });

  it('leaves the character exactly the money their wealth level gave them', () => {
    // The stake passes through their account and goes straight into the
    // business. A founder can be running a ten million dollar company and
    // still be unable to pay their own rent, which is the point.
    const sim = quickSave({ wealth: 'scraping' }, 'co-personal');
    const personal = sim.universe.accounts[sim.player.primaryAccountId!]?.balance ?? 0;
    expect(personal).toBeLessThan(10_000_00);
    expect(personal).toBeGreaterThan(0);
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
    // Every save now opens as an independent, so growing means the studio and
    // shrinking means anything under it.
    const sim = aGame('co-grow');
    const reputation = playerCompany(sim)!.reputation;
    const grew = sim.execute({ kind: 'co.change_shape', payload: { shingle: 'studio' } });
    expect(grew.ok, grew.error).toBe(true);
    expect(playerCompany(sim)!.shingle).toBe('studio');
    expect(playerCompany(sim)!.reputation).toBe(reputation);

    const shrank = sim.execute({ kind: 'co.change_shape', payload: { shingle: 'boutique' } });
    expect(shrank.ok).toBe(true);
    // Everybody can see you did it.
    expect(playerCompany(sim)!.reputation).toBeLessThan(reputation);
  });

  it('refuses a shape the company cannot afford, and leaves it as it was', () => {
    const sim = aGame('co-cannot-grow');
    const company = playerCompany(sim)!;
    // Spend the account down to under what the step up costs.
    sim.expense(company.cashAccountId, (sim.universe.accounts[company.cashAccountId]?.balance ?? 0) - 100_00, 'Test spend', 'business');
    const before = company.shingle;
    const refused = sim.execute({ kind: 'co.change_shape', payload: { shingle: 'studio' } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/costs/i);
    expect(playerCompany(sim)!.shingle).toBe(before);
  });

  it('carries capacity from the shape, and a maxed founder gets the most of it', () => {
    const small = aGame('co-cap-small');
    small.must({ kind: 'co.change_shape', payload: { shingle: 'boutique' } });
    const big = aGame('co-cap-big');
    big.must({ kind: 'co.change_shape', payload: { shingle: 'studio' } });
    expect(capacityOf(big, playerCompany(big)!))
      .toBeGreaterThan(capacityOf(small, playerCompany(small)!));
    // Delegation is at the ceiling, so the shape's own number is the floor.
    for (const sim of [small, big]) {
      const company = playerCompany(sim)!;
      expect(capacityOf(sim, company)).toBeGreaterThanOrEqual(SHINGLE_BY_ID[company.shingle]!.capacity);
    }
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

  it('hands the disclaimer over with the brief, and the brief is told in beats', () => {
    const sim = aGame('strike-brief');
    const read = sim.execute<{ brief: readonly string[]; line: string; disclaimer: string }>({
      kind: 'co.read_brief', payload: {},
    });
    expect(read.ok).toBe(true);
    expect(read.value!.disclaimer).toBe(STRIKE_IS_FICTION);
    expect(sim.universe.industry.briefed).toBe(true);

    // Four beats, each carrying one fact the game actually models.
    expect(read.value!.brief).toEqual(OPENING_BRIEF);
    expect(OPENING_BRIEF.length).toBe(4);
    for (const beat of OPENING_BRIEF) expect(beat.length).toBeGreaterThan(80);
    const all = OPENING_BRIEF.join(' ');
    expect(all, 'the length of the stoppage is the first thing said').toMatch(/Nineteen months/);
    expect(all, 'the empty drawer is the whole opening problem').toMatch(/no pile to option/i);
    expect(all).toMatch(/opening day/);
    // The old copy said Monday, which is not a day this game has a meaning for.
    expect(all).not.toMatch(/Monday/);
    expect(read.value!.line).toMatch(/opening day/);
    expect(read.value!.line).not.toMatch(/Monday/);
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
