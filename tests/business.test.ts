/**
 * The family business.
 *
 * Nine subjects — forming a company, registering for tax, banking, signing
 * with a guild, buying cover, holding rights, papering agreements, employing
 * people and developing material — are one system here, joined by a single
 * idea: a company is a list of things it may and may not do, and everything
 * else exists because of a door it opens.
 *
 * So most of this file is about the doors. That the shut ones name exactly
 * what shuts them, that the order they open in is the real order, and that the
 * refusals along the way say the true reason rather than a generic one.
 *
 * The decision underneath all of it: the parent is Icelandic and the American
 * arm is earned. Global Rule One is why — a SAG-AFTRA member cannot work for a
 * producer who has not signed, anywhere on earth, so an Icelandic company that
 * wants one American actor has to become in part an American company.
 */

import { describe, expect, it } from 'vitest';
import {
  breakEvenShare, paidInAsShareOfAYear, paidInSoFar, stagesOn, theLot, utilisation,
  whereTheLotStands, wouldBook,
} from '@/engine/world/lot';
import {
  BUILD_COST_CENTS, ENQUIRY_SHAPES, ICELAND_STAGE_FLOOR_SQM,
  OVERHEAD_FLOOR_CENTS, THE_RATE_CARD,
} from '@/engine/content/lot';
import { GROUP, GROUP_PROFIT_CENTS, ORGANIC_SHARE_OF_WORLD, QUOTA, profitAfterQuota } from '@/engine/content/sugar';
import { quotaYears, decideQuota } from '@/engine/world/sugar';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { ESTATE_CITY_ID } from '@/engine/content/estate';
import {
  computeAnnualTax, propertyTaxRate, resolveIncomeTaxLayers, salesTaxRate,
} from '@/engine/content/tax';
import {
  CORPORATION_TAX, GUILD_BY_ID, REBATE, REGISTRY_BY_ID, VAT_ON_A_PURCHASE, VAT_RATE,
} from '@/engine/content/incorporation';
import { OVERHEAD, SMALL_STAGE_COST_CENTS } from '@/engine/content/lot';
import { buildAStage } from '@/engine/world/lot';
import { VAT_MEMO, boughtWithVat, reclaimable, whereTheVatStands } from '@/engine/world/vat';
import {
  GREENLIGHT_FLOOR, americanArm, capabilitiesOf, companiesOf, companyCash, holdingsOf,
  parentCompany, policiesOf, postsOf, projectsOf, registrationsOf, signaturesOf, theSugarGroup,
  whereItStands,
} from '@/engine/world/company';

interface Done { ok: boolean; id?: string; error?: string }

const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

const world = (seed = 'business'): Simulation => quickSave({}, seed);

const doorFor = (sim: Simulation, id: string) => capabilitiesOf(sim).find((one) => one.id === id)!;
const openDoors = (sim: Simulation): number => capabilitiesOf(sim).filter((one) => one.can).length;
const personCalled = (sim: Simulation, first: string): string =>
  Object.values(sim.universe.people).find((one) => one.firstName === first)!.id;

describe('the company the family already has', () => {
  it('is an Icelandic private limited company, not an American one', () => {
    const company = parentCompany(world().universe)!;
    expect(company.form).toBe('ehf');
    expect(company.jurisdiction).toBe('is');
    expect(company.legalName.endsWith('ehf.')).toBe(true);
    expect(company.locationId).toBe(ESTATE_CITY_ID);
  });

  it('was formed before the stages went up, because it built them', () => {
    const sim = world();
    const company = parentCompany(sim.universe)!;
    const house = Object.values(sim.universe.properties)[0]!;
    expect(new Date(company.foundedAt).getUTCFullYear()).toBe(house.yearBuilt);
    expect(company.foundedAt).toBeLessThan(sim.now);
  });

  it('is owned by the parents, who built it, and adds up to a hundred', () => {
    const sim = world();
    const company = parentCompany(sim.universe)!;
    const owners = company.ownerships.map((one) => sim.universe.people[one.holderId]!.firstName);
    expect(owners.sort()).toEqual(['Halla', 'Jón']);
    expect(company.ownerships.reduce((sum, one) => sum + one.percent, 0)).toBe(100);
  });

  it('is on the two registers it must have been on to build anything', () => {
    const on = registrationsOf(world().universe).map((one) => one.registry).sort();
    expect(on).toEqual(['is_companies', 'is_vat']);
  });

  it('has its own money, which is not the player’s money', () => {
    const sim = world();
    const company = parentCompany(sim.universe)!;
    const player = sim.universe.people[sim.universe.playerId]!;
    expect(companyCash(sim.universe)).toBeGreaterThan(0);

    const mine = Object.values(sim.universe.accounts).filter((one) => one.ownerId === player.id);
    const theirs = Object.values(sim.universe.accounts).filter((one) => one.ownerId === company.id);
    expect(mine.length).toBeGreaterThan(0);
    expect(theirs.length).toBeGreaterThan(0);
    for (const account of theirs) expect(account.ownerId).not.toBe(player.id);
  });

  it('is staffed by whoever the Your People step said runs what', () => {
    const sim = quickSave({
      family: {
        mother: { firstName: 'Halla', ageAtBirth: 29, role: 'the lot' },
        father: { firstName: 'Jón', ageAtBirth: 31, role: 'the company' },
      },
    }, 'business-staffing');
    const posts = postsOf(sim.universe);
    const who = (role: string) => sim.universe.people[posts.find((one) => one.role === role)!.personId!]!.firstName;
    // The step is not decoration: whoever runs the company is its principal.
    expect(who('principal')).toBe('Jón');
    expect(who('facility')).toBe('Halla');
  });

  it('has no American arm, no guild, no cover, no rights and no slate', () => {
    const sim = world();
    expect(americanArm(sim.universe)).toBeUndefined();
    expect(signaturesOf(sim.universe)).toEqual([]);
    expect(policiesOf(sim.universe)).toEqual([]);
    expect(holdingsOf(sim.universe)).toEqual([]);
    expect(projectsOf(sim.universe)).toEqual([]);
  });

  it('boots a save the validator is happy with', () => {
    const report = validateUniverse(world().universe);
    if (!report.ok) console.error(report.errors);
    expect(report.errors).toEqual([]);
  });
});

describe('the doors', () => {
  it('starts with two of the nine open, and names the rest', () => {
    const sim = world();
    const doors = capabilitiesOf(sim);
    expect(doors).toHaveLength(9);
    expect(doors.filter((one) => one.can).map((one) => one.id)).toEqual(['trade', 'reclaim_vat']);
    for (const shut of doors.filter((one) => !one.can)) {
      expect(shut.blockers.length, `${shut.id} is shut and says nothing`).toBeGreaterThan(0);
      for (const blocker of shut.blockers) {
        expect(blocker.need, `${shut.id} blocker has no name`).toBeTruthy();
        expect(blocker.how, `${shut.id} blocker says nothing about the fix`).toBeTruthy();
      }
    }
  });

  it('says where it stands in one sentence, and the sentence follows the world', () => {
    const sim = world();
    expect(whereItStands(sim)).toContain('2 of the 9');
    run(sim, 'company.register', { registry: 'is_employer' });
    expect(whereItStands(sim)).toContain('3 of the 9');
  });

  it('is read from the world rather than stored, so a lapse changes the answer', () => {
    const sim = world();
    expect(doorFor(sim, 'reclaim_vat').can).toBe(true);
    const vat = registrationsOf(sim.universe).find((one) => one.registry === 'is_vat')!;
    vat.endedAt = sim.now;
    expect(doorFor(sim, 'reclaim_vat').can).toBe(false);
  });
});

describe('Global Rule One', () => {
  it('refuses an American guild until there is an American company', () => {
    const sim = world();
    expect(run(sim, 'company.sign', { guild: 'sag_aftra' }).error)
      .toBe('An American guild signs with an American company, and there isn’t one yet.');
  });

  it('refuses an American register for the same reason', () => {
    const sim = world();
    expect(run(sim, 'company.register', { registry: 'us_ein' }).error)
      .toContain('no American arm yet');
  });

  it('opens the door once the arm exists and the guild has signed', () => {
    const sim = world();
    expect(doorFor(sim, 'employ_americans').can).toBe(false);

    expect(run(sim, 'company.form_arm', {}).ok).toBe(true);
    expect(run(sim, 'company.register', { registry: 'us_ein' }).ok).toBe(true);
    expect(run(sim, 'company.sign', { guild: 'sag_aftra' }).ok).toBe(true);
    expect(doorFor(sim, 'employ_americans').can).toBe(true);
  });

  it('makes the arm American, owned by the Icelandic parent, and only one of it', () => {
    const sim = world();
    run(sim, 'company.form_arm', {});
    const arm = americanArm(sim.universe)!;
    const parent = parentCompany(sim.universe)!;

    expect(arm.jurisdiction).toBe('us');
    expect(arm.parentId).toBe(parent.id);
    expect(arm.ownerships).toEqual([{ holderId: parent.id, holderKind: 'company', percent: 100 }]);
    expect(run(sim, 'company.form_arm', {}).error).toBe('The American arm already exists.');
    expect(companiesOf(sim.universe)).toHaveLength(2);
  });

  it('signs the guild with the arm, not with the parent', () => {
    const sim = world();
    run(sim, 'company.form_arm', {});
    run(sim, 'company.sign', { guild: 'sag_aftra' });
    const signature = signaturesOf(sim.universe)[0]!;
    expect(signature.companyId).toBe(americanArm(sim.universe)!.id);
  });

  it('says the Icelandic unions are not a thing you sign', () => {
    const sim = world();
    expect(run(sim, 'company.sign', { guild: 'is_actors' }).error)
      .toContain('isn’t signed with');
    expect(GUILD_BY_ID.is_actors.signable).toBe(false);
    expect(GUILD_BY_ID.sag_aftra.signable).toBe(true);
  });
});

describe('chain of title', () => {
  it('stops errors and omissions cover, which stops delivery', () => {
    const sim = world();
    run(sim, 'company.option', { title: 'Ash', chainGap: 'The author’s estate never signed.' });

    expect(run(sim, 'company.insure', { policy: 'errors_omissions' }).error)
      .toContain('The author’s estate never signed.');
    const deliver = doorFor(sim, 'deliver');
    expect(deliver.can).toBe(false);
    expect(deliver.blockers.map((one) => one.need)).toContain('A Clean Chain Of Title');
  });

  it('refuses the cover outright when there is nothing to read', () => {
    expect(run(world(), 'company.insure', { policy: 'errors_omissions' }).error)
      .toContain('there’s nothing to read');
  });

  it('lets the cover be bound once the paper is clean', () => {
    const sim = world();
    run(sim, 'company.option', { title: 'The Long Winter' });
    expect(run(sim, 'company.insure', { policy: 'errors_omissions' }).ok).toBe(true);
    expect(doorFor(sim, 'deliver').can).toBe(true);
  });
});

describe('the posts', () => {
  it('will not fill a post with nobody', () => {
    const sim = world();
    expect(run(sim, 'company.fill_post', { role: 'accountant' }).error)
      .toBe('The post of the production accountant needs somebody in it. An empty chair runs nothing.');
    expect(doorFor(sim, 'claim_rebate').can).toBe(false);
  });

  it('opens the reimbursement once somebody keeps the books', () => {
    const sim = world();
    const rebate = doorFor(sim, 'claim_rebate');
    expect(rebate.blockers.map((one) => one.need)).toEqual(['The Production Accountant']);

    expect(run(sim, 'company.fill_post', { role: 'accountant', personId: personCalled(sim, 'Halla') }).ok).toBe(true);
    expect(doorFor(sim, 'claim_rebate').can).toBe(true);
  });

  it('refuses somebody the save has never heard of', () => {
    expect(run(world(), 'company.fill_post', { role: 'accountant', personId: 'person_zzz' }).error)
      .toBe('You don’t know anybody by that name.');
  });

  it('refuses a post twice over', () => {
    const sim = world();
    const halla = personCalled(sim, 'Halla');
    run(sim, 'company.fill_post', { role: 'production', personId: halla });
    expect(run(sim, 'company.fill_post', { role: 'production', personId: halla }).error)
      .toBe('Somebody is already head of production.');
  });
});

describe('everything costs, and it comes out of the company', () => {
  it('takes the money from the company rather than the player', () => {
    const sim = world();
    const player = sim.universe.people[sim.universe.playerId]!;
    const mine = () => Object.values(sim.universe.accounts)
      .filter((one) => one.ownerId === player.id && !one.nominal)
      .reduce((sum, one) => sum + one.balance, 0);

    const beforeThem = companyCash(sim.universe);
    const beforeMe = mine();
    run(sim, 'company.form_arm', {});

    expect(companyCash(sim.universe)).toBeLessThan(beforeThem);
    expect(mine()).toBe(beforeMe);
  });

  it('refuses when the company hasn’t got it, and says so', () => {
    const sim = world();
    const account = Object.values(sim.universe.accounts)
      .find((one) => one.kind === 'company_cash')!;
    account.balance = 100;
    expect(run(sim, 'company.insure', { policy: 'property' }).error).toContain('hasn’t got it');
  });

  it('keeps the books balanced through all of it', () => {
    const sim = world();
    run(sim, 'company.register', { registry: 'is_employer' });
    run(sim, 'company.form_arm', {});
    run(sim, 'company.sign', { guild: 'sag_aftra' });
    run(sim, 'company.option', { title: 'The Long Winter' });
    run(sim, 'company.insure', { policy: 'general_liability' });
    expect(sim.ledger.audit()).toEqual([]);
  });
});

describe('the slate', () => {
  it('takes a project, and hangs it off the rights where there are any', () => {
    const sim = world();
    const took = run(sim, 'company.option', { title: 'The Long Winter', provenance: 'novel' });
    const made = run(sim, 'company.develop', { title: 'The Long Winter', holdingId: took.id });
    expect(made.ok).toBe(true);
    const project = projectsOf(sim.universe)[0]!;
    expect(project.holdingId).toBe(took.id);
    expect(project.stage).toBe('optioned');
  });

  it('takes one with no rights behind it, and says so by its stage', () => {
    const sim = world();
    run(sim, 'company.develop', { title: 'Something I Thought Of' });
    expect(projectsOf(sim.universe)[0]!.stage).toBe('idea');
  });

  it('refuses rights the company doesn’t hold, and a title twice', () => {
    const sim = world();
    expect(run(sim, 'company.develop', { title: 'X', holdingId: 'hold_zzz' }).error)
      .toBe('The company doesn’t hold those rights.');
    run(sim, 'company.develop', { title: 'X' });
    expect(run(sim, 'company.develop', { title: 'x' }).error).toBe('That one is already on the slate.');
  });

  it('refuses an option twice, and one with no title', () => {
    const sim = world();
    run(sim, 'company.option', { title: 'Ash' });
    expect(run(sim, 'company.option', { title: ' ash ' }).error).toBe('The company already holds that one.');
    expect(run(sim, 'company.option', { title: '  ' }).error).toBe('It needs a title.');
  });

  it('gives an option a clock and ownership none', () => {
    const sim = world();
    const optioned = run(sim, 'company.option', { title: 'Ash', months: 12 });
    const bought = run(sim, 'company.option', { title: 'Birch', hold: 'owned' });
    expect(sim.universe.holdings[optioned.id!]!.expiresAt).toBeGreaterThan(sim.now);
    expect(sim.universe.holdings[bought.id!]!.expiresAt).toBeUndefined();
  });
});

describe('the whole ladder', () => {
  it('goes from two doors to nine, in the order it has to', () => {
    const sim = world('ladder');
    const halla = personCalled(sim, 'Halla');
    const jon = personCalled(sim, 'Jón');
    expect(openDoors(sim)).toBe(2);

    run(sim, 'company.register', { registry: 'is_employer' });
    run(sim, 'company.form_arm', {});
    run(sim, 'company.register', { registry: 'us_ein' });
    run(sim, 'company.sign', { guild: 'sag_aftra' });
    run(sim, 'company.option', { title: 'The Long Winter', provenance: 'novel' });
    run(sim, 'company.fill_post', { role: 'accountant', personId: halla });
    run(sim, 'company.fill_post', { role: 'production', personId: jon });
    for (const policy of ['general_liability', 'workers_comp', 'production_package', 'errors_omissions']) {
      expect(run(sim, 'company.insure', { policy }).ok, policy).toBe(true);
    }

    expect(openDoors(sim)).toBe(9);
    expect(whereItStands(sim)).toContain('Everything is in place');
    expect(companyCash(sim.universe)).toBeGreaterThan(GREENLIGHT_FLOOR);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
  });

  it('survives a year of the clock with everything intact', () => {
    const sim = world('ladder-time');
    run(sim, 'company.form_arm', {});
    run(sim, 'company.option', { title: 'The Long Winter' });
    sim.advanceTo(sim.now + 365 * MS_DAY);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(companiesOf(sim.universe)).toHaveLength(2);
  });
});

describe('what the content claims about the real world', () => {
  it('names the real bodies rather than inventing them', () => {
    expect(REGISTRY_BY_ID.is_companies.body).toBe('Fyrirtækjaskrá');
    expect(REGISTRY_BY_ID.us_ein.body).toBe('Internal Revenue Service');
    expect(GUILD_BY_ID.sag_aftra.body).toBe('SAG-AFTRA');
  });

  it('keeps the Icelandic tax figures as the published ones, and spends them', () => {
    expect(CORPORATION_TAX).toBe(0.20);
    expect(VAT_RATE).toBe(0.24);

    // The two lines above used to be the whole test, and a test that a constant
    // still equals the number written beside it is a test that can only fail
    // when somebody edits it on purpose. Meanwhile the country these figures
    // describe was in no tax table at all, so the home screen told a player
    // living in Mosfellsbær that Iceland taxes a wage at nothing and charges no
    // sales tax — under a heading about a company paying 24% VSK.
    const at = Date.UTC(2026, 2, 2);
    expect(salesTaxRate(ESTATE_CITY_ID, at, 'general'), 'VSK, from the one declaration of it')
      .toBe(VAT_RATE);
    expect(resolveIncomeTaxLayers(ESTATE_CITY_ID, at).length).toBeGreaterThan(0);

    // And it lands where an Icelandic wage lands: a quarter and a bit gone at
    // the reference wage, well under the top marginal band.
    const owed = computeAnnualTax(60_000_00, ESTATE_CITY_ID, at);
    expect(owed.total).toBeGreaterThan(0);
    expect(owed.effectiveRate).toBeGreaterThan(0.2);
    expect(owed.effectiveRate).toBeLessThan(0.32);
    // Banded, and this has to be tested at the MARGIN rather than on the
    // effective rate. A flat rate with a fixed deduction also makes the
    // effective rate climb with income, because the deduction shrinks as a
    // share of it — so "twice the wage is a higher share" passes whether the
    // bands exist or not, and a mutation that flattened the table survived it.
    const marginal = (from: number, to: number): number =>
      (computeAnnualTax(to, ESTATE_CITY_ID, at).total
        - computeAnnualTax(from, ESTATE_CITY_ID, at).total) / (to - from);
    const low = marginal(30_000_00, 35_000_00);
    const high = marginal(200_000_00, 205_000_00);
    // Both carry the 4% pension on top of the band, because that is withheld
    // from the same wage and this figure is what leaves it.
    expect(low).toBeCloseTo(0.3175 + 0.04, 3);
    // The top band is the one an Icelander actually feels, and nothing else in
    // this table reaches it: on a flat rule these two are the same number.
    expect(high).toBeCloseTo(0.4682 + 0.04, 3);
    expect(high - low).toBeGreaterThan(0.14);
    // Fasteignaskattur at the residential band, not the table's foreign default.
    expect(propertyTaxRate(ESTATE_CITY_ID, at)).toBeLessThan(0.005);
  });

  it('says the reimbursement is applied for before you shoot, and is audited', () => {
    // The deadline itself is a rule and is tested where it bites, in
    // tests/rebate.test.ts. What this holds is the law it is written from.
    expect(REBATE.auditedBy).toContain('auditor');
    // And says plainly that the rate has moved rather than printing a guess.
    // Both rates are sourced now: 25% with no minimum spend and no cap, and a
    // 35% tier a production has to qualify for.
    expect(REBATE.share).toBe(0.25);
    expect(REBATE.higherShare).toBe(0.35);
    expect(REBATE.higherNeeds.crew).toBeGreaterThan(0);
    expect(REBATE.endsOn.year, 'the scheme has an end date and the game should carry it').toBe(2028);
  });
});

describe('the rate card, which is what the whole bet turns on', () => {
  it('lets every stage inside the published benchmark, and large rooms cheaper by the meter', () => {
    const sim = quickSave({}, 'rates');
    const by = stagesOn(sim)
      .map((stage) => ({ name: stage.name, per: stage.weekRateCents / 100 / stage.floorSqm }));
    for (const one of by) {
      // Lambert Smith Hampton's UK benchmark, carried to 2026 money, is about
      // €21-25 per square meter per week for a 20,000 sq ft room. Nothing here
      // may sit above it, because a lot nobody has heard of does not command
      // a premium over near-London.
      expect(one.per).toBeLessThanOrEqual(THE_RATE_CARD.benchmarkPerSqmWeek + 3);
      expect(one.per).toBeGreaterThan(8);
    }
    const askja = stagesOn(sim).find((one) => one.name === 'Askja')!;
    const small = stagesOn(sim).find((one) => one.floorSqm === 2_000)!;
    expect(askja.weekRateCents / askja.floorSqm).toBeLessThan(small.weekRateCents / small.floorSqm);
  });

  it('needs most of the lot full to cover a month, which is the honest answer', () => {
    const sim = quickSave({}, 'break-even');
    const need = breakEvenShare(sim)!;
    // A new lot in a country with no crew base needing three fifths of its
    // capacity to stand still is the bet. If this ever drops toward a third,
    // the rate card has been inflated again and the lot has stopped being a
    // risk the family took.
    expect(need).toBeGreaterThan(0.5);
    expect(need).toBeLessThan(0.75);
    expect(whereTheLotStands(sim)).toContain(`${Math.round(need * 100)}% full to cover a month`);
  });
});

describe('the lot as a business', () => {
  it('is owned by the company, not by anybody in the family', () => {
    const sim = quickSave({}, 'lot-owner');
    const lot = theLot(sim)!;
    expect(lot, 'no lot was built').toBeDefined();
    expect(lot.ownerKind).toBe('company');
    expect(sim.universe.companies[lot.ownerId!], 'the owner is not a company in the save').toBeDefined();
    expect(sim.universe.people[lot.ownerId!], 'the lot belongs to a person').toBeUndefined();
  });

  it('has more stage floor on it than the rest of Iceland put together', () => {
    const sim = quickSave({}, 'lot-floor');
    const floor = stagesOn(sim).reduce((n, s) => n + s.floorSqm, 0);
    expect(floor).toBeGreaterThan(ICELAND_STAGE_FLOOR_SQM);
  });

  it('costs money on a month when nobody is on it', () => {
    const sim = quickSave({}, 'lot-dark');
    const cash = Object.values(sim.universe.accounts).find((a) => a.kind === 'company_cash')!;
    const opening = sim.universe.transactions.length;
    sim.advanceTo(sim.now + 40 * MS_DAY);
    expect(
      sim.universe.transactions.length,
      'a month passed and the lot charged nobody for standing there',
    ).toBeGreaterThan(opening);
    // Every line is posted under its own name, so the bill can be opened.
    const memos = sim.universe.transactions.map((t) => t.memo);
    expect(memos.some((m) => /Set Aside For Repairs/.test(m))).toBe(true);
    expect(memos.some((m) => /Standing Crew/.test(m))).toBe(true);
    void cash;
  });

  it('works out how full it is from the bookings rather than remembering', () => {
    const sim = quickSave({}, 'lot-full');
    const empty = utilisation(sim, sim.now, sim.now + 30 * MS_DAY);
    expect(empty.taken).toBe(0);
    expect(empty.share).toBe(0);

    const stage = stagesOn(sim)[0]!;
    sim.universe.bookings.b1 = {
      id: 'b1', saveId: sim.universe.meta.id, stageId: stage.id, holder: 'a test',
      kind: 'shooting', from: sim.now, to: sim.now + 7 * MS_DAY, weekRateCents: stage.weekRateCents,
    };
    const one = utilisation(sim, sim.now, sim.now + 30 * MS_DAY);
    expect(one.taken).toBeCloseTo(1, 5);
    // Four stages over thirty days, one of them let for one week.
    expect(one.share!).toBeGreaterThan(0);
    expect(one.share!).toBeLessThan(0.1);
  });

  it('clips a booking to the window rather than counting it whole', () => {
    const sim = quickSave({}, 'lot-clip');
    const stage = stagesOn(sim)[0]!;
    sim.universe.bookings.b1 = {
      id: 'b1', saveId: sim.universe.meta.id, stageId: stage.id, holder: 'a long one',
      kind: 'shooting', from: sim.now - 60 * MS_DAY, to: sim.now + 60 * MS_DAY,
      weekRateCents: stage.weekRateCents,
    };
    // Ten days of a hundred-and-twenty-day booking fall in the window.
    const window = utilisation(sim, sim.now, sim.now + 10 * MS_DAY);
    expect(window.taken).toBeCloseTo(10 / 7, 5);
  });

  it('sends a production somewhere else when nothing here is the right size', () => {
    const sim = quickSave({}, 'lot-toobig');
    const answer = wouldBook(sim, {
      kind: 'feature', from: 'somebody enormous', needsSqm: 20_000, needsHeightM: 40,
      needsTank: false, weeks: 10, spendIsk: 5_000_000_000, local: false,
    }, sim.now + 30 * MS_DAY);
    expect(answer.stageId).toBeUndefined();
    expect(answer.because).toMatch(/right size/);
  });

  it('turns away a foreign production the rebate doesn’t carry, and takes the same one local', () => {
    const sim = quickSave({}, 'lot-budapest');
    // Spending enough that the room is a small share of it, so the only thing
    // left to turn it away is where its crew is coming from.
    const small = {
      kind: 'documentary' as const, from: 'a streamer', needsSqm: 600, needsHeightM: 8,
      needsTank: false, weeks: 2, spendIsk: 300_000_000,
    };
    // Too small for the higher rebate tier, so 25% back against a third more
    // to build and crew here. It goes somewhere with a crew already in it.
    const away = wouldBook(sim, { ...small, local: false }, sim.now + 30 * MS_DAY);
    expect(away.stageId, 'the refusal this whole model exists for never fires').toBeUndefined();
    expect(away.because).toMatch(/doesn’t cover/);
    // The identical job with an Icelandic crew has no such problem.
    const stays = wouldBook(sim, { ...small, local: true }, sim.now + 30 * MS_DAY);
    expect(stays.stageId).toBeDefined();
    expect(stays.because).toMatch(/already here/);
  });

  it('lets the big foreign ones in, because the higher tier is built for them', () => {
    const sim = quickSave({}, 'lot-tentpole');
    const answer = wouldBook(sim, {
      kind: 'feature', from: 'an American studio', needsSqm: 5_200, needsHeightM: 24,
      needsTank: false, weeks: 14, spendIsk: 1_900_000_000, local: false,
    }, sim.now + 30 * MS_DAY);
    expect(answer.stageId).toBeDefined();
    expect(answer.because).toMatch(/35% back/);
  });

  it('makes most enquiries domestic, the way the Icelandic register actually reads', () => {
    const all = ENQUIRY_SHAPES.reduce((n, one) => n + one.weight, 0);
    const home = ENQUIRY_SHAPES.filter((one) => one.of.local).reduce((n, one) => n + one.weight, 0);
    expect(home / all).toBeGreaterThan(0.6);
    // But the foreign ones are where the stage-weeks are.
    const weeksOf = (local: boolean): number => ENQUIRY_SHAPES
      .filter((one) => one.of.local === local)
      .reduce((n, one) => n + one.weight * one.of.weeks, 0);
    expect(weeksOf(false) / weeksOf(true)).toBeGreaterThan(0.5);
  });

  it('puts a production in the smallest room that holds it', () => {
    const sim = quickSave({}, 'lot-smallest');
    const answer = wouldBook(sim, {
      kind: 'commercial', from: 'an agency', needsSqm: 500, needsHeightM: 8,
      needsTank: false, weeks: 1, spendIsk: 400_000_000, local: true,
    }, sim.now + 30 * MS_DAY);
    const took = sim.universe.stages[answer.stageId!];
    expect(took, 'nothing was offered').toBeDefined();
    expect(took!.floorSqm, 'a commercial was put in the biggest room on the lot').toBe(2_000);
  });

  it('says who is paying for it, rather than letting the company go quietly broke', () => {
    const sim = quickSave({}, 'lot-funded');
    const cash = Object.values(sim.universe.accounts).find((a) => a.kind === 'company_cash')!;
    for (let month = 0; month < 24; month++) sim.advanceTo(sim.now + 30 * MS_DAY);
    expect(cash.balance, 'the company is running overdrawn with nothing explaining it').toBeGreaterThanOrEqual(0);
    expect(paidInSoFar(sim), 'nobody has put a króna in').toBeGreaterThan(0);
    expect(sim.ledger.audit()).toEqual([]);
  });
});

describe('where the money comes from', () => {
  it('holds two businesses that share owners and nothing else', () => {
    const sim = quickSave({}, 'sugar-two');
    const sugar = theSugarGroup(sim)!;
    const film = parentCompany(sim.universe)!;
    expect(sugar, 'no sugar group').toBeDefined();
    expect(sugar.trade).toBe('sugar');
    expect(film.trade).toBe('film');
    expect(sugar.id).not.toBe(film.id);
    // The sugar is older than the film by generations, which is the point.
    expect(sugar.foundedAt).toBeLessThan(film.foundedAt);
  });

  it('keeps the sugar out of every question about making pictures', () => {
    const sim = quickSave({}, 'sugar-apart');
    // companiesOf, parentCompany and americanArm all mean the film side.
    expect(companiesOf(sim.universe).every((c) => c.trade === 'film')).toBe(true);
    expect(parentCompany(sim.universe)!.form).toBe('ehf');
    // And the capability ladder never counts the sugar group's registrations.
    const doors = capabilitiesOf(sim);
    expect(doors.length).toBe(9);
  });

  it('is first in a trade small enough that being first is checkable', () => {
    // The group is invented and may be as big as the fiction likes. What has
    // to hold is the size of the thing it is first in.
    expect(ORGANIC_SHARE_OF_WORLD).toBeGreaterThan(0.2);
    expect(ORGANIC_SHARE_OF_WORLD).toBeLessThan(0.5);
    expect(GROUP.organicTonnesAYear).toBeLessThan(GROUP.tonnesAYear);
  });

  it('can afford the lot, which is the whole reason the group is this size', () => {
    // A single organic sugar company could not have built this. The world
    // organic trade is 450,000 tonnes; the biggest real producer turns over
    // about what the lot cost, once.
    expect(BUILD_COST_CENTS).toBeLessThan(GROUP_PROFIT_CENTS * 3);
    expect(OVERHEAD_FLOOR_CENTS * 12).toBeLessThan(GROUP_PROFIT_CENTS * 0.1);
  });

  it('puts the sugar’s name on the money it sends', () => {
    const sim = quickSave({}, 'sugar-cheque');
    for (let month = 0; month < 18; month++) sim.advanceTo(sim.now + 30 * MS_DAY);
    const paid = sim.universe.transactions.filter((t) => t.memo.includes(GROUP.name));
    expect(paid.length, 'the money arrived from nowhere in particular').toBeGreaterThan(0);
    expect(paidInSoFar(sim)).toBeGreaterThan(0);
    // And it means something set against what the business earns.
    expect(paidInAsShareOfAYear(sim)).toBeGreaterThan(0);
    expect(paidInAsShareOfAYear(sim)).toBeLessThan(1);
  });
});

describe('the sugar quota', () => {
  it('remembers the year that actually happened rather than rolling for it', () => {
    const sim = quickSave({}, 'quota-real');
    const first = quotaYears(sim)[0]!;
    expect(first.fiscalYear).toBe(2026);
    expect(first.tonnes, 'the 2026 answer was nothing, and it is on the record').toBe(0);
    expect(first.because).toMatch(/specialty sugar quota/i);
  });

  it('is sticky, because policy is', () => {
    // An open year almost always stays open. This is the honest majority of
    // the answer and the reason a run of shut years means something.
    const open = Array.from({ length: 20 }, (_, i) => decideQuota(90_000, 0, i / 20));
    expect(open.filter((a) => a.tonnes > 0).length).toBeGreaterThan(14);
  });

  it('gets likelier to reopen the longer it has been shut', () => {
    const roll = 0.5;
    expect(decideQuota(0, 0, roll).tonnes, 'reopened immediately on a middling roll').toBe(0);
    expect(decideQuota(0, 5, roll).tonnes, 'five shut years and still no pressure').toBeGreaterThan(0);
  });

  it('costs the group real money while it is shut', () => {
    const shut = profitAfterQuota(GROUP_PROFIT_CENTS, 0);
    const open = profitAfterQuota(GROUP_PROFIT_CENTS, QUOTA.ordinaryTonnes);
    expect(shut).toBeLessThan(open);
    expect(open).toBe(GROUP_PROFIT_CENTS);
  });

  it('makes the lot a heavier sentence in a year America was shut', () => {
    const sim = quickSave({}, 'quota-weight');
    for (let month = 0; month < 24; month++) sim.advanceTo(sim.now + 30 * MS_DAY);
    const shutShare = paidInAsShareOfAYear(sim);
    // The same money, read against a full year rather than a shut one.
    const againstFull = paidInSoFar(sim) / GROUP_PROFIT_CENTS;
    expect(shutShare, 'the quota changed nothing anybody could feel').toBeGreaterThan(againstFull);
  });

  it('keeps deciding, year after year, without being asked', () => {
    const sim = quickSave({}, 'quota-runs');
    for (let y = 0; y < 6; y++) sim.advanceTo(sim.now + 365 * MS_DAY);
    const years = quotaYears(sim);
    expect(years.length, 'the quota stopped being decided').toBeGreaterThan(4);
    // Every year is its own answer with its own reason.
    expect(new Set(years.map((y) => y.fiscalYear)).size).toBe(years.length);
    for (const y of years) expect(y.because.length).toBeGreaterThan(10);
  });
});

/**
 * Reclaim The Tax, which for a long time was a door onto nothing.
 *
 * `capabilitiesOf` lists nine things a production company has to be able to do.
 * Three are read by the engine at the greenlight, the delivery and the
 * reimbursement; three more bite as greenlight blockers; hiring Americans is
 * enforced in the casting room. This one said "claim back the value added tax
 * on everything the company buys, which for a production is a fifth of the
 * spend" and not one króna was ever reclaimed.
 */
describe('the tax on what the company buys', () => {
  const threeYears = (seed: string, registered = true): Simulation => {
    const sim = quickSave({}, seed);
    if (!registered) {
      for (const [id, one] of Object.entries(sim.universe.registrations)) {
        if (one.registry === 'is_vat') delete sim.universe.registrations[id];
      }
    }
    sim.advanceTo(sim.now + 3 * 365 * MS_DAY);
    return sim;
  };
  const reclaimed = (sim: Simulation): number => sim.universe.transactions
    .filter((one) => one.memo === VAT_MEMO)
    .reduce((n, one) => n + one.postings.filter((p) => p.amount > 0).reduce((m, p) => m + p.amount, 0), 0);

  it('takes the tax out of a price already paid, rather than a fifth of everything', () => {
    // 24 over 124, not 24 over 100, because a quoted price includes the tax.
    expect(VAT_ON_A_PURCHASE).toBeCloseTo(VAT_RATE / (1 + VAT_RATE), 10);
    expect(VAT_ON_A_PURCHASE).toBeLessThan(VAT_RATE);
    // And it is where the page's "a fifth of the spend" comes from.
    expect(VAT_ON_A_PURCHASE).toBeGreaterThan(0.19);
    expect(VAT_ON_A_PURCHASE).toBeLessThan(0.20);
  });

  it('reclaims on what was bought and not on wages, cover, rates or a reserve', () => {
    // The reason this is a field on every line rather than one rate over the
    // ledger. A wage carries no VSK, insurance is an exempt supply,
    // fasteignaskattur is a tax, and money moved into the company's own sinking
    // fund is not a purchase until the day it buys a roof.
    const buys = OVERHEAD.filter((one) => one.carriesVat).map((one) => one.id);
    expect(buys).toEqual(['selling', 'utilities', 'services']);
    for (const id of ['crew', 'insurance', 'property_tax', 'sinking']) {
      expect(OVERHEAD.find((one) => one.id === id)!.carriesVat, id).toBe(false);
    }
  });

  it('pays real money back on a real lag, and none at all without the registration', () => {
    const on = threeYears('vat-on');
    const off = threeYears('vat-off', false);
    const got = reclaimed(on);
    expect(got, 'three years of a lot that buys power, services and its own selling')
      .toBeGreaterThan(100_000_00);
    // The whole of the door: the unregistered company pays exactly the same
    // prices and keeps none of it.
    expect(reclaimed(off)).toBe(0);
    expect(boughtWithVat(off, 0, off.now), 'it bought the same things').toBeGreaterThan(0);
    expect(reclaimable(off, 0, off.now)).toBe(0);
    expect(whereTheVatStands(off)).toMatch(/isn’t on the VAT register/);
    expect(validateUniverse(on.universe).errors).toEqual([]);
    expect(on.ledger.audit()).toEqual([]);
  });

  it('gives a fifth of a build back, which is the largest claim this company makes', () => {
    const plain = quickSave({}, 'vat-build');
    const built = quickSave({}, 'vat-build');
    buildAStage(built);
    for (const sim of [plain, built]) sim.advanceTo(sim.now + 3 * 365 * MS_DAY);
    const extra = reclaimed(built) - reclaimed(plain);
    const onTheBuild = Math.round(SMALL_STAGE_COST_CENTS * VAT_ON_A_PURCHASE);
    // The room costs what it costs and a registered company gets the tax in it
    // back, so the real price of the fifth stage is not the price on the panel.
    expect(extra).toBeGreaterThanOrEqual(onTheBuild);
    // A little more than the build's own tax, and the little more is not slop:
    // five rooms buy more power and more snow clearing than four, and that is
    // bought from somebody who charges VSK on it too.
    expect(extra - onTheBuild).toBeGreaterThan(0);
    expect(extra).toBeLessThan(onTheBuild * 1.05);
    expect(extra).toBeGreaterThan(3_000_000_00);
  });
});

/**
 * Walking the nine doors.
 *
 * The page's promise is that a shut door names the single thing keeping it shut
 * and that thing is a door of its own. This holds the engine to the other half
 * of that: every blocker it names must be one a player can actually clear, and
 * clearing all of them must reach nine.
 */
describe('every door a company has to walk through', () => {
  it('opens all nine, from the two it starts with, by clearing what it is told', () => {
    const sim = quickSave({}, 'nine-doors');
    const did = (kind: string, payload: Record<string, unknown>): void => {
      const answer = sim.execute({ kind, payload }) as { value?: { ok: boolean; error?: string } };
      expect(answer.value?.ok, `${kind} ${JSON.stringify(payload)} — ${answer.value?.error}`).toBe(true);
    };
    const open = (): number => capabilitiesOf(sim).filter((one) => one.can).length;

    // A registered company with a VAT number and nothing else.
    expect(open()).toBe(2);

    did('company.register', { registry: 'is_employer' });
    did('company.form_arm', {});
    did('company.register', { registry: 'us_ein' });
    did('company.sign', { guild: 'sag_aftra' });
    did('company.option', { title: 'The Cane Field' });
    for (const policy of ['general_liability', 'workers_comp', 'production_package']) {
      did('company.insure', { policy });
    }
    // Errors and omissions is the one that cannot be bought first: an
    // underwriter reads the chain of title before writing it, so it needs the
    // option above to already exist. That ordering is the whole of why the
    // material blocker needed a control of its own.
    did('company.insure', { policy: 'errors_omissions' });
    const people = Object.values(sim.universe.people).filter((one) => !one.isPlayer);
    did('company.fill_post', { role: 'accountant', personId: people[0]!.id });
    did('company.fill_post', { role: 'production', personId: (people[1] ?? people[0])!.id });

    expect(open(), capabilitiesOf(sim).filter((one) => !one.can).map((one) => one.label).join(', '))
      .toBe(9);
    expect(whereItStands(sim)).toMatch(/Everything is in place/);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('names a fix for every blocker it can raise, and no blocker without one', () => {
    // The page can only be walked if every `fixKind` it produces is one the
    // screen has a control for. `holding` was produced by three doors and had
    // none, so a player pressing everything offered stopped at six of nine.
    // Two halves, and the first is the one a mutation walked straight through
    // when this only checked the second: every blocker must SAY what sort of
    // thing would clear it. A blocker with no `fixKind` renders as a sentence
    // with no button, which is the failure this test exists to catch, and
    // dropping the kind off one was invisible while the check was written as
    // "of the ones that have a kind, every kind is known".
    const HAS_A_CONTROL = new Set(['registry', 'guild', 'policy', 'arm', 'role', 'holding']);
    // And the one kind that has no button on purpose, because no button makes
    // money appear. It is cleared by the business working.
    const CLEARED_BY_PLAYING = new Set(['money']);
    const sim = quickSave({}, 'blockers');
    const kinds = new Set<string>();
    let raised = 0;
    for (const door of capabilitiesOf(sim)) for (const one of door.blockers) {
      raised += 1;
      expect(one.need.length, 'a blocker has to say what it is').toBeGreaterThan(0);
      expect(one.how.length, 'and how it is cleared').toBeGreaterThan(0);
      expect(one.fixKind, `"${one.need}" names no kind of fix, so no screen can offer one`)
        .toBeDefined();
      kinds.add(one.fixKind!);
    }
    expect(raised).toBeGreaterThan(8);
    expect(kinds.size).toBeGreaterThan(3);
    for (const kind of kinds) {
      expect(HAS_A_CONTROL.has(kind) || CLEARED_BY_PLAYING.has(kind), kind).toBe(true);
    }
  });

  it('costs what it costs, and the company can carry it from what it starts with', () => {
    const sim = quickSave({}, 'nine-cost');
    const before = companyCash(sim.universe);
    for (const [kind, payload] of [
      ['company.register', { registry: 'is_employer' }],
      ['company.form_arm', {}],
      ['company.register', { registry: 'us_ein' }],
      ['company.sign', { guild: 'sag_aftra' }],
      ['company.option', { title: 'The Cane Field' }],
      ['company.insure', { policy: 'general_liability' }],
      ['company.insure', { policy: 'workers_comp' }],
      ['company.insure', { policy: 'production_package' }],
    ] as [string, Record<string, unknown>][]) sim.execute({ kind, payload });
    const spent = before - companyCash(sim.universe);
    expect(spent, 'walking the doors is not free').toBeGreaterThan(0);
    expect(companyCash(sim.universe), 'and it does not bankrupt the company either')
      .toBeGreaterThan(0);
  });
});
