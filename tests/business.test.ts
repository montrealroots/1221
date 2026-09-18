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
  PAID_IN, breakEvenShare, familyCovers, familyCoversToday, paidInAsShareOfAYear, paidInSoFar,
  stagesOn, standingWith, theLot, utilisation,
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
  CORPORATION_TAX, GUILD_BY_ID, POLICY_BY_ID, REBATE, REGISTRY_BY_ID, ROLES, VAT_ON_A_PURCHASE,
  VAT_RATE,
  WILL_TAKE_A_POST,
} from '@/engine/content/incorporation';
import { OVERHEAD, SMALL_STAGE_COST_CENTS } from '@/engine/content/lot';
import { buildAStage, chargeThePosts } from '@/engine/world/lot';
import {
  aDayOfSugar, payTheBoard, payTheCorporationTax, payTheGroupPosts, profitThisYear,
  sugarAccount, sugarCoversThePictures,
  EMPLOYER_TAX_MEMO, GOODS_MEMO, PAYROLL_MEMO, SALES_MEMO, aPayday,
} from '@/engine/world/sugar';
import {
  A_PARENT_A_MONTH_CENTS, BOARD_SEATS, COST_OF_GOODS_A_DAY_CENTS,
  EMPLOYER_TAX_A_DAY_CENTS, EMPLOYER_TAX_A_MONTH_CENTS, GROUP_OPENING_BALANCE,
  GROUP_REGISTRIES, GROUP_ROLES, WAGES_A_MONTH_CENTS, A_MONTH_OF_DAYS, PAYROLL_A_MONTH_CENTS,
  PAYROLL_A_DAY_CENTS,
  GROUP_POSTS_A_MONTH_CENTS, KEPT_IN_HAND_CENTS, PROFIT_A_DAY_CENTS, REVENUE_A_DAY_CENTS,
  TRYGGINGAGJALD,
} from '@/engine/content/sugar';
import { VAT_MEMO, boughtWithVat, reclaimable, whereTheVatStands } from '@/engine/world/vat';
import { openTheBooks, openTheDoors, theyCanAffordIt } from './doors';
import { PRODUCER_FEE } from '@/engine/content/making';
import { onTheScreen, finishesBy } from '@/engine/world/making';
import { CAST_SHARE } from '@/engine/content/casting';
import { A_WHOLE_CAST } from '@/engine/content/audition';
import type { Money } from '@/engine/core/money';
import {
  MISSED_COOLS, RESTING_APART, RESTING_UNDER_ONE_ROOF, TOGETHER_WARMS, bondFor, standingWord,
} from '@/engine/world/standing';
import {
  GREENLIGHT_FLOOR, americanArm, capabilitiesOf, cashAccountFor, companiesOf, companyCash, holdingsOf,
  carries, filled, parentCompany, policiesOf, postFacts, postsOf, projectsOf, registrationsOf,
  whyNotStepAside,
  runTheClock,
  seatHeldBy, whyNotTakeIt,
  signaturesOf, theSugarGroup,
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
    // The production company's own two, not every registration in the save. The
    // sugar group carries three of its own — it has traded since 1946 and pays
    // three thousand one hundred people — and an unscoped read here would count
    // a different company's standing as this one's.
    const sim = world();
    const on = registrationsOf(sim.universe, parentCompany(sim.universe)!.id)
      .map((one) => one.registry).sort();
    expect(on).toEqual(['is_companies', 'is_vat']);
    // And the employer registration in particular is NOT one of them, because
    // it is a door the player has to open. The group having it must not count.
    expect(on).not.toContain('is_employer');
    expect(doorFor(sim, 'employ_here').can, 'the group’s standing opened this company’s door')
      .toBe(false);
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
    // This company's VAT number. The group has one too, and is founded first, so
    // an unscoped find ends the cane business's registration and asks whether the
    // film company can still reclaim — which it can, correctly, and the test
    // would have been passing for the wrong reason ever since.
    const ours = parentCompany(sim.universe)!.id;
    const vat = registrationsOf(sim.universe, ours).find((one) => one.registry === 'is_vat')!;
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

  it('files the Delaware registration the form it just filed already is', () => {
    // `us_state` was on the registry table and unreachable by every route. The
    // arm is opened with no account of its own and `company.register` charges
    // the registrant, so the player's answer was 'The company has no account to
    // pay from' — for a filing the parent had paid for on the line above. The
    // Delaware branch of `numberFor` had never run in any save.
    const sim = world();
    const before = registrationsOf(sim.universe).length;
    run(sim, 'company.form_arm', {});
    const arm = americanArm(sim.universe)!;
    const filed = registrationsOf(sim.universe).filter((one) => one.registry === 'us_state');
    expect(registrationsOf(sim.universe)).toHaveLength(before + 1);
    expect(filed).toHaveLength(1);
    expect(filed[0]!.companyId).toBe(arm.id);
    expect(filed[0]!.number).toMatch(/^\d+$/);
    // And the refusal a player now gets is the truthful one, through the guard
    // that was always there and could never be reached.
    expect(run(sim, 'company.register', { registry: 'us_state' }).error)
      .toBe('Already on Delaware Division of Corporations.');
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
    const account = cashAccountFor(sim.universe, parentCompany(sim.universe)!.id)!;
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
    const cash = cashAccountFor(sim.universe, parentCompany(sim.universe)!.id)!;
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
    const cash = cashAccountFor(sim.universe, parentCompany(sim.universe)!.id)!;
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

  it('never offers a fix that would be refused if it were pressed', () => {
    // Found by walking the built page rather than reading it. Delivering needs
    // errors and omissions cover; the cover needs a chain of title for an
    // underwriter to read. With no material the page named the cover, offered
    // a Bind button, and the button could only ever be refused — which is the
    // one way to walk this panel and get stuck, and it stopped a run at five
    // of nine.
    const sim = quickSave({}, 'offered');
    const deliver = () => capabilitiesOf(sim).find((one) => one.id === 'deliver')!;
    const named = () => deliver().blockers.map((one) => one.need);

    // With nothing held, the thing in the way is the material, not the cover.
    expect(named()).toContain('Anything At All');
    expect(named()).not.toContain('Errors And Omissions');
    const early = sim.execute({ kind: 'company.insure', payload: { policy: 'errors_omissions' } });
    expect((early.value as { ok: boolean }).ok, 'the cover the page did not offer is refused')
      .toBe(false);

    // Take the option and the page moves on to the cover, which now binds.
    sim.execute({ kind: 'company.option', payload: { title: 'The Cane Field' } });
    expect(named()).toEqual(['Errors And Omissions']);
    const now = sim.execute({ kind: 'company.insure', payload: { policy: 'errors_omissions' } });
    expect((now.value as { ok: boolean }).ok, 'the cover the page offered is bound').toBe(true);
    expect(deliver().can).toBe(true);
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

describe('somebody in a post is somebody on a payroll', () => {
  /**
   * `ROLES` has carried a `monthlyCents` on every row since it was written —
   * nine thousand for a head of development, eleven for a head of production,
   * ten for business affairs — and nothing read one. Filling a post set
   * `filledAt` and `personId` and charged nobody, so a company staffed itself
   * completely on its first morning for nothing and the capability doors that
   * open behind a filled post opened free.
   */

  it('charges the month for a post somebody is in', () => {
    const sim = quickSave({}, 'posts-cost');
    const company = parentCompany(sim.universe)!;
    const account = Object.values(sim.universe.accounts)
      .find((one) => one.ownerId === company.id && one.kind === 'company_cash')!;
    const somebody = Object.values(sim.universe.people).find((one) => !one.isPlayer)!;

    // A save opens with two posts already filled — the principal, and the
    // facility manager who runs the lot — so this measures the difference one
    // more makes rather than assuming an empty company. The facility manager
    // was staffed from the first morning and cost nothing until now, which is
    // the clearest single case of what this fixes.
    const already = chargeThePosts(sim, account.id);
    expect(already, 'the facility manager is on from day one').toBeGreaterThan(0);

    const before = account.balance;
    sim.execute({ kind: 'company.fill_post', payload: { role: 'production', personId: somebody.id } });
    const owed = chargeThePosts(sim, account.id);

    const facts = ROLES.find((one) => one.id === 'production')!;
    // Plus the employer's contribution on it, which is what a post actually
    // costs the company: a wage of eleven thousand is 6.35 percent more than
    // that out the door, and Tryggingagjald is not withheld from the wage.
    expect(owed - already, 'one more post costs what the content says it costs')
      .toBe(Math.round(facts.monthlyCents * (1 + TRYGGINGAGJALD)));
    expect(account.balance).toBe(before - owed);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('leaves the principal free, because the principal is the family', () => {
    // The principal is filled at boot and its row says nought, so it
    // contributes nothing to the month. A family member drawing a salary from
    // the family company to run the family company is money moving between two
    // pockets with a line of bookkeeping on top.
    expect(ROLES.find((one) => one.id === 'principal')!.monthlyCents).toBe(0);

    const sim = quickSave({}, 'posts-principal');
    const company = parentCompany(sim.universe)!;
    const account = Object.values(sim.universe.accounts)
      .find((one) => one.ownerId === company.id && one.kind === 'company_cash')!;
    const facility = ROLES.find((one) => one.id === 'facility')!.monthlyCents;
    // Two posts are filled at boot and only one of them is paid anything — and
    // the contribution is charged on what is paid, so a principal on nought adds
    // nothing to it either.
    expect(chargeThePosts(sim, account.id))
      .toBe(Math.round(facility * (1 + TRYGGINGAGJALD)));
  });
});

describe('the sugar is a business that trades, not a number in a file', () => {
  /**
   * `GROUP_PROFIT_CENTS` said the group cleared about a hundred and fifty-four
   * million a year and nothing stood behind it: the group owned no account,
   * sold nothing, paid nobody, and the figure existed only to size how much of
   * the lot's losses the family would tolerate. `familyCovers` then posted
   * money into the pictures company from a nominal, rounded to the nearest
   * hundred thousand, because the thing doing the paying had no account to
   * debit. The willingness was real and the money was not.
   */

  it('sells, pays its people and keeps what is left, every day', () => {
    const sim = quickSave({}, 'sugar-trades');
    const account = sugarAccount(sim)!;
    expect(account, 'the group should have an account of its own').toBeTruthy();

    const before = sim.universe.accounts[account]!.balance;
    const kept = aDayOfSugar(sim);
    const after = sim.universe.accounts[account]!.balance;

    expect(kept, 'a day should clear what the margin says it clears').toBeGreaterThan(0);
    // The day sells at the full cost base and only the cane leaves the account, so
    // the balance rises by the margin plus a day of wages nobody has been paid
    // yet. That is what a payday is: the wages are earned every day and paid on
    // the last one, so the money for them sits in the group until then.
    expect(after - before).toBe(kept + PAYROLL_A_DAY_CENTS + EMPLOYER_TAX_A_DAY_CENTS);
    // Two lines, and wages are not one of them today.
    const memos = sim.universe.transactions.slice(-2).map((one) => one.memo);
    expect(memos).toContain(`${GROUP.name}: Sugar Sold`);
    expect(memos).toContain(GOODS_MEMO);
    expect(memos, 'the wages went out on a day that is not payday').not.toContain(PAYROLL_MEMO);
    expect(sim.ledger.audit()).toEqual([]);

    // And what it sold is the whole cost base plus whatever margin the quota
    // left, to the cent. This is the check that naming two new costs — the
    // employer's contribution and the seven seats — invented no money: the cost
    // base is a day of turnover less a day of margin, whatever America did, and
    // only the margin moves. The save opens on a shut year, so `kept` here is
    // below a full day's profit and the sum still closes.
    const sold = sim.universe.transactions.slice(-2)
      .find((one) => one.memo === SALES_MEMO)!;
    const took = sold.postings.filter((one) => one.amount > 0)
      .reduce((sum, one) => sum + one.amount, 0);
    expect(took).toBe(REVENUE_A_DAY_CENTS - PROFIT_A_DAY_CENTS + kept);
    expect(kept, 'the save opens on a shut year, so the margin is thinner')
      .toBeLessThan(PROFIT_A_DAY_CENTS);
  });

  it('pays the seven seats every month, and the year comes to one payroll', () => {
    // `GROUP_ROLES.monthlyCents` is read here or it is a salary on a screen that
    // nothing debits — the exact shape this cleanup exists to remove. The five
    // salaried seats come out of the same payroll the three thousand one hundred
    // are in rather than on top of it, so the year has to close: twelve months of
    // named seats plus three hundred and sixty-five days of workforce wages is
    // the one payroll figure the workforce was sized from.
    const sim = quickSave({}, 'sugar-seats');
    const group = theSugarGroup(sim)!;
    const seats = postsOf(sim.universe, group.id);
    expect(seats, 'the group should carry its own posts').toHaveLength(7);

    const account = sugarAccount(sim)!;
    const before = sim.universe.accounts[account]!.balance;
    const paid = payTheGroupPosts(sim);
    expect(paid, 'the five salaried seats are charged').toBe(GROUP_POSTS_A_MONTH_CENTS);
    expect(sim.universe.accounts[account]!.balance).toBe(before - paid);
    // The two board seats are filled and cost nothing: a director's fee is not a
    // wage, and the parents draw it through `payTheBoard` instead.
    expect(GROUP_POSTS_A_MONTH_CENTS).toBe(83_000_00);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('has a payday, which is not the same as a wage smeared across the calendar', () => {
    // The owner asked for money in every day and a payment to the parents and to
    // everybody worldwide on a cycle. The first version paid all three thousand one
    // hundred of them a slice every twenty-four hours, which kept the group's
    // balance flat and was not a payroll — it was the cost of one spread so thin
    // that nothing ever had to be held in hand for it.
    const sim = quickSave({}, 'sugar-payday');
    const account = sugarAccount(sim)!;

    // A month of trading and nothing has gone out to anybody. The money is there.
    for (let day = 0; day < 30; day += 1) aDayOfSugar(sim);
    const wages = () => sim.universe.transactions.filter((one) => one.memo === PAYROLL_MEMO);
    expect(wages(), 'a wage went out on a day that is not payday').toHaveLength(0);
    const held = sim.universe.accounts[account]!.balance;
    expect(held, 'a month of selling should leave a month of wages in hand')
      .toBeGreaterThan(WAGES_A_MONTH_CENTS);

    // And then payday, which is four lines because four different things happen.
    const went = aPayday(sim);
    expect(wages(), 'nobody was paid on payday').toHaveLength(1);
    expect(went).toBe(
      WAGES_A_MONTH_CENTS + EMPLOYER_TAX_A_MONTH_CENTS
      + GROUP_POSTS_A_MONTH_CENTS + A_PARENT_A_MONTH_CENTS * 2,
    );
    expect(sim.universe.accounts[account]!.balance).toBe(held - went);
    // The parents are paid on the same day as everybody else.
    const player = sim.universe.people[sim.universe.playerId]!;
    for (const one of (player.relations ?? []).filter((r) => r.kind === 'mother' || r.kind === 'father')) {
      const purse = sim.universe.people[one.toId]!.primaryAccountId;
      expect(sim.universe.accounts[purse!]!.balance).toBe(A_PARENT_A_MONTH_CENTS);
    }
    expect(sim.ledger.audit()).toEqual([]);

    // And the wages and the money held back are the same figure, because a company
    // that pays everybody on the last day of the month has to be holding a month's
    // wages on the last day of the month. A fortnight was the wrong pairing.
    expect(KEPT_IN_HAND_CENTS).toBe(Math.round(PAYROLL_A_DAY_CENTS * A_MONTH_OF_DAYS));
    expect(WAGES_A_MONTH_CENTS + GROUP_POSTS_A_MONTH_CENTS).toBe(PAYROLL_A_MONTH_CENTS);
  });

  it('goes on trading through a shut year, because America is one market', () => {
    // The first version scaled the day's SALES by the quota, so a shut year
    // sold nothing while still paying the wages and buying the cane — one
    // point two million a day out, which took the group's own account to minus
    // thirty-two million. The quota moves the profit, not whether it trades.
    const sim = quickSave({}, 'sugar-shut');
    const account = sugarAccount(sim)!;
    sim.universe.quotaYears.push({
      fiscalYear: 2030, tonnes: 0, decidedAt: sim.now, because: 'Shut, for this test.',
    });
    const kept = aDayOfSugar(sim);
    expect(kept, 'a shut year is thinner, not fatal').toBeGreaterThan(0);
    expect(sim.universe.accounts[account]!.balance).toBeGreaterThan(0);
  });

  it('pays both parents into accounts of their own', () => {
    const sim = quickSave({}, 'sugar-board');
    const player = sim.universe.people[sim.universe.playerId]!;
    const parents = (player.relations ?? [])
      .filter((one) => one.kind === 'mother' || one.kind === 'father')
      .map((one) => one.toId);
    expect(parents).toHaveLength(2);

    // The family generator wrote people and gave nobody a purse.
    for (const id of parents) expect(sim.universe.people[id]!.primaryAccountId).toBeUndefined();

    aDayOfSugar(sim);
    const paid = payTheBoard(sim);
    expect(paid).toBe(A_PARENT_A_MONTH_CENTS * 2);
    for (const id of parents) {
      const purse = sim.universe.people[id]!.primaryAccountId;
      expect(purse, 'a parent should have somewhere for it to land').toBeTruthy();
      expect(sim.universe.accounts[purse!]!.balance).toBe(A_PARENT_A_MONTH_CENTS);
    }
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('covers the pictures out of its own balance, not out of nowhere', () => {
    const sim = quickSave({}, 'sugar-covers');
    const company = parentCompany(sim.universe)!;
    const pictures = Object.values(sim.universe.accounts)
      .find((one) => one.ownerId === company.id && one.kind === 'company_cash')!;
    // Trade for a while so there is something to send.
    for (let day = 0; day < 60; day += 1) aDayOfSugar(sim);
    const sugar = sugarAccount(sim)!;
    const held = sim.universe.accounts[sugar]!.balance;

    sim.expense(pictures.id, pictures.balance + 4_321_987_65, 'Test: overspend', 'business');
    expect(pictures.balance).toBe(-4_321_987_65);

    const sent = sugarCoversThePictures(sim, pictures.id);
    expect(sent, 'the sugar should cover it').toBe(4_321_987_65);
    expect(pictures.balance, 'and cover it exactly, on the daily clock').toBe(0);
    // The money left the group rather than appearing from a nominal.
    expect(sim.universe.accounts[sugar]!.balance).toBe(held - sent);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('wires a round hundred thousand on the monthly clock, and only there', () => {
    // The two clocks want different answers and the difference is load-bearing.
    // Cover to the cent on both and the company sits at nought forever, under
    // GREENLIGHT_FLOOR, so nothing is ever greenlit. Wire a round hundred
    // thousand on both and a picture that empties the company is flush again by
    // morning, so the greenlight door can never shut on money at all.
    const sim = quickSave({}, 'sugar-round');
    const company = parentCompany(sim.universe)!;
    const pictures = Object.values(sim.universe.accounts)
      .find((one) => one.ownerId === company.id && one.kind === 'company_cash')!;
    for (let day = 0; day < 60; day += 1) aDayOfSugar(sim);
    const sugar = sugarAccount(sim)!;
    const held = sim.universe.accounts[sugar]!.balance;

    sim.expense(pictures.id, pictures.balance + 4_321_987_65, 'Test: overspend', 'business');
    const sent = sugarCoversThePictures(sim, pictures.id, 100_000_00);
    expect(sent, 'rounded up to the next hundred thousand').toBe(4_400_000_00);
    expect(pictures.balance, 'and the leftover is the company’s working cash')
      .toBe(4_400_000_00 - 4_321_987_65);
    // The money left the group rather than appearing from a nominal.
    expect(sim.universe.accounts[sugar]!.balance).toBe(held - sent);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('will not send the wages, so the group cannot be emptied', () => {
    const sim = quickSave({}, 'sugar-floor');
    const company = parentCompany(sim.universe)!;
    const pictures = Object.values(sim.universe.accounts)
      .find((one) => one.ownerId === company.id && one.kind === 'company_cash')!;
    const sugar = sugarAccount(sim)!;
    // The group opens holding exactly the fortnight of payroll it refuses to go
    // under, so the save begins at the floor and the first day of trading is what
    // puts it above the line. That is the right shape for a business: the money
    // to fund a film comes from having sold something, not from the boot.
    expect(sim.universe.accounts[sugar]!.balance).toBe(GROUP_OPENING_BALANCE);
    expect(GROUP_OPENING_BALANCE).toBe(KEPT_IN_HAND_CENTS);
    expect(sugarCoversThePictures(sim, pictures.id), 'nothing is spare at the floor').toBe(0);

    // A bad enough year takes it under, and then the wages come first.
    sim.expense(sugar, 1_000_000_00, 'Test: a year that went badly', 'business');
    expect(sim.universe.accounts[sugar]!.balance).toBeLessThan(KEPT_IN_HAND_CENTS);
    sim.expense(pictures.id, pictures.balance + 1_000_000_00, 'Test: overspend', 'business');
    expect(pictures.balance).toBeLessThan(0);
    expect(sugarCoversThePictures(sim, pictures.id)).toBe(0);
  });
});

describe('everything else it takes to run a company, which the group did not have', () => {
  /**
   * The group had a name, a legal form and a cap table, and that was all of it.
   * The production company was put on its registers, given its own account and
   * given its posts at boot; the company that actually employed three thousand
   * one hundred people had no standing to employ anybody, no account until
   * something asked for one, and nobody named as running it.
   */

  it('is on the three registers a 1946 employer is obviously on', () => {
    const sim = world('group-registers');
    const group = theSugarGroup(sim)!;
    const on = registrationsOf(sim.universe, group.id);
    expect(on.map((one) => one.registry).sort()).toEqual([...GROUP_REGISTRIES].sort());
    // Dated from the founding. A company trading since 1946 did not register
    // last Tuesday, and every one of them carries a real number.
    for (const one of on) {
      expect(one.since).toBe(group.foundedAt);
      expect(one.number.length).toBeGreaterThan(0);
      expect(one.nextDueAt, 'a registration with nothing due is one nobody files')
        .toBeGreaterThan(sim.now);
    }
    expect(new Date(group.foundedAt).getUTCFullYear()).toBe(GROUP.since);
  });

  it('has an account of its own from the first morning, not on demand', () => {
    const sim = world('group-account');
    const group = theSugarGroup(sim)!;
    const account = cashAccountFor(sim.universe, group.id);
    expect(account, 'the group should bank somewhere').toBeTruthy();
    expect(account!.balance).toBe(GROUP_OPENING_BALANCE);
    expect(account!.ownerId).toBe(group.id);
    // And it is not the film company's account. Two companies, two accounts, and
    // the group is founded first — so anything reaching for "the company
    // account" by kind alone finds the cane business.
    const pictures = cashAccountFor(sim.universe, parentCompany(sim.universe)!.id);
    expect(pictures!.id).not.toBe(account!.id);
    expect(companyCash(sim.universe), 'the group is not part of the film side’s cash')
      .toBe(pictures!.balance);
  });

  it('is run by five people with names, and the same seed gives the same five', () => {
    const sim = world('group-staff');
    const group = theSugarGroup(sim)!;
    const seats = postsOf(sim.universe, group.id);
    expect(seats).toHaveLength(GROUP_ROLES.length);

    const salaried = seats.filter((one) => !BOARD_SEATS
      .includes(one.role as typeof BOARD_SEATS[number]));
    expect(salaried).toHaveLength(5);
    for (const post of salaried) {
      const who = sim.universe.people[post.personId!];
      expect(who, `${post.role} is an empty chair at a company trading since 1946`).toBeTruthy();
      expect(who!.displayName.length).toBeGreaterThan(0);
      expect(who!.careerTrack).toBe('executive');
      // Senior. Nobody mills two point two million tonnes a year at twenty-six.
      const age = (sim.now - who!.birthInstant) / (365.2425 * 24 * 60 * 60 * 1000);
      expect(age).toBeGreaterThanOrEqual(41);
      expect(age).toBeLessThan(64);
      // And nothing invented about them beyond that: no fame, no attribute
      // sheet with anything in it. Nothing reads a head of milling's technique.
      expect(who!.reputation.publicFame).toBe(0);
    }

    // The two board seats are the parents', not hired.
    const board = seats.filter((one) => BOARD_SEATS
      .includes(one.role as typeof BOARD_SEATS[number]));
    const owners = group.ownerships.map((one) => one.holderId).sort();
    expect(board.map((one) => one.personId!).sort()).toEqual(owners);

    // Deterministic, and keyed per seat: the same seed is the same board.
    const names = (s: Simulation) => postsOf(s.universe, theSugarGroup(s)!.id)
      .map((one) => `${one.role}:${s.universe.people[one.personId!]?.displayName ?? ''}`).sort();
    expect(names(world('group-staff'))).toEqual(names(sim));
    // And a different seed is a different company's management.
    expect(names(world('group-staff-other'))).not.toEqual(names(sim));
  });

  it('pays corporation tax on the year, which nothing in this game had ever paid', () => {
    // `CORPORATION_TAX` has been 0.20 for as long as there has been a company
    // here, and the only thing that read it was a test asserting it still
    // equals 0.20. `docs/UNBITTEN.md` put it plainly: corporation tax is not
    // inert, it does not exist. This is the only company with a profit to tax.
    const sim = world('group-tax');
    const account = sugarAccount(sim)!;
    const before = sim.universe.accounts[account]!.balance;
    const owed = payTheCorporationTax(sim);

    expect(owed, 'a hundred and fifty-four million of untaxed profit').toBeGreaterThan(0);
    expect(owed).toBe(Math.round(profitThisYear(sim) * CORPORATION_TAX));
    expect(sim.universe.accounts[account]!.balance).toBe(before - owed);
    expect(sim.ledger.audit()).toEqual([]);

    // It is charged on the year the group actually had, so a shut year is taxed
    // less. That is the check that it reads the world rather than a constant.
    const shut = world('group-tax-shut');
    shut.universe.quotaYears.push({
      fiscalYear: 2031, tonnes: 0, decidedAt: shut.now, because: 'Shut, for this test.',
    });
    const open = world('group-tax-open');
    open.universe.quotaYears.push({
      fiscalYear: 2031, tonnes: QUOTA.ordinaryTonnes, decidedAt: open.now, because: 'Open, for this test.',
    });
    expect(payTheCorporationTax(shut)).toBeLessThan(payTheCorporationTax(open));
  });

  it('pays the employer’s own contribution, which no company here ever had', () => {
    // Tryggingagjald: 6.35%, real, named in a comment in `content/tax.ts` that
    // was right about where it does not belong — a wage somebody takes home —
    // and silent about where it does.
    expect(TRYGGINGAGJALD).toBe(0.0635);

    const sim = world('group-employer-tax');
    const account = sugarAccount(sim)!;
    // On payday, with the wages, because that is when an employer's contribution
    // is remitted. It is earned every day and paid with the payroll.
    for (let day = 0; day < 30; day += 1) aDayOfSugar(sim);
    aPayday(sim);
    const line = sim.universe.transactions.find((one) => one.memo === EMPLOYER_TAX_MEMO);
    expect(line, 'three thousand one hundred people and no contribution on them').toBeTruthy();
    expect(line!.postings.filter((one) => one.amount > 0)
      .reduce((sum, one) => sum + one.amount, 0))
      .toBe(Math.round(PAYROLL_A_MONTH_CENTS * TRYGGINGAGJALD));

    // Derived from the payroll and taken out of the cost of goods, so naming it
    // invents nothing: the lines a day still come to what the day sold.
    expect(COST_OF_GOODS_A_DAY_CENTS)
      .toBe(REVENUE_A_DAY_CENTS - PROFIT_A_DAY_CENTS - PAYROLL_A_DAY_CENTS - EMPLOYER_TAX_A_DAY_CENTS);
    expect(sim.universe.accounts[account]!.balance).toBeGreaterThan(0);
  });

  it('keeps the family’s refusal, and gives it teeth that are not an overdraft', () => {
    // The condition is real and it bites: past the last rung, a month the lot
    // let nothing is a month the company funds itself. What it withholds is the
    // money to do something with, not the money to settle what is owed.
    //
    // The first version refused on both clocks, and measured over twenty-five
    // years the company then sat at minus EUR 708,143 for a fortnight at a time
    // while the group held EUR 172,091,226 spare. A cane business with a hundred
    // and seventy million in the bank does not let the film company it owns
    // bounce a bill to make a point; it declines to fund another picture.
    const sim = world('refusal-teeth');
    const company = parentCompany(sim.universe)!;
    const account = cashAccountFor(sim.universe, company.id)!;
    for (let day = 0; day < 120; day += 1) aDayOfSugar(sim);

    // Put the family past the last rung, with the lot having earned nothing.
    const sugar = sugarAccount(sim)!;
    sim.transfer(sugar, account.id, Math.round(GROUP_PROFIT_CENTS * 0.9), PAID_IN, 'business');
    expect(standingWith(sim).conditional, 'the last rung should be reachable').toBe(true);

    // Spend it under, then let the day run.
    sim.expense(account.id, account.balance + 2_000_000_00, 'Test: a month that earned nothing', 'business');
    expect(account.balance).toBeLessThan(0);
    const put = familyCoversToday(sim, account.id);

    expect(put, 'the day settles what is owed whatever the family thinks').toBeGreaterThan(0);
    expect(account.balance, 'and settles it exactly, with nothing to spend').toBe(0);
    // Which is the teeth: at nought the company is under the greenlight floor,
    // so it cannot say yes to anything until the lot lets a stage again.
    expect(account.balance).toBeLessThan(GREENLIGHT_FLOOR);
    expect(capabilitiesOf(sim).find((one) => one.id === 'greenlight')!.can).toBe(false);

    // And the month refuses, which is where the refusal lives now.
    sim.expense(account.id, 1_000_000_00, 'Test: another month of it', 'business');
    expect(familyCovers(sim, account.id, 0)).toBe(0);
    // A month it earned something is funded again, so there is always a way back.
    expect(familyCovers(sim, account.id, 5_000_00)).toBeGreaterThan(0);
  });
});

describe('the roster, on both companies', () => {
  /**
   * Both companies carry every key position they have as a real row. The group's
   * are filled, because it has traded since 1946 and nobody in this game hires
   * its managing director. The production company's four vacancies are the
   * player's to fill, and filling the head of production is how the greenlight
   * door opens — so the roster is complete and the decision is untouched.
   */

  it('carries all six of the production company’s posts, four of them vacant', () => {
    const sim = world('roster-film');
    const company = parentCompany(sim.universe)!;
    const posts = postsOf(sim.universe, company.id);
    expect(posts.map((one) => one.role).sort())
      .toEqual([...ROLES].map((one) => one.id).sort());

    // The four the creation step does not answer for are empty, and every one of
    // them says what its absence costs rather than simply not being there. A
    // vacancy nobody can see is not a decision — it is a shut door you find out
    // about later.
    const empty = posts.filter((one) => one.personId === undefined).map((one) => one.role).sort();
    expect(empty).toEqual(['accountant', 'business_affairs', 'development', 'production']);
    for (const role of empty) expect(postFacts(role)!.without.length).toBeGreaterThan(10);

    // And the two the step does answer for are filled by the people it named.
    const who = (role: string) => sim.universe
      .people[posts.find((one) => one.role === role)!.personId!]?.estateRole;
    expect(who('principal')).toBe('the company');
    expect(who('facility')).toBe('the lot');
  });

  it('does not open the greenlight door by having the chair exist', () => {
    // `personRunning` read `role === 'principal' ? 'the company' : 'the lot'`,
    // which was right while exactly two posts existed and became a trapdoor the
    // moment four more did: every one of them resolved to the lot manager, so the
    // head of production was filled before anybody decided anything and the
    // greenlight door opened at boot. An empty chair runs nothing.
    const sim = world('roster-doors');
    expect(filled(sim.universe, 'production'), 'somebody was made head of production at boot')
      .toBeUndefined();
    const greenlight = capabilitiesOf(sim).find((one) => one.id === 'greenlight')!;
    expect(greenlight.can).toBe(false);
    expect(greenlight.blockers.map((one) => one.need)).toContain('Head Of Production');

    // Filling it reuses the row rather than making a second one.
    const before = postsOf(sim.universe, parentCompany(sim.universe)!.id).length;
    const somebody = Object.values(sim.universe.people).find((one) => !one.isPlayer)!;
    expect(run(sim, 'company.fill_post', { role: 'production', personId: somebody.id }).ok).toBe(true);
    expect(postsOf(sim.universe, parentCompany(sim.universe)!.id)).toHaveLength(before);
    expect(filled(sim.universe, 'production')).toBeTruthy();
  });

  it('keeps the two rosters apart, so neither reads as the other’s', () => {
    const sim = world('roster-apart');
    const film = parentCompany(sim.universe)!;
    const group = theSugarGroup(sim)!;
    const ours = postsOf(sim.universe, film.id).map((one) => one.role);
    const theirs = postsOf(sim.universe, group.id).map((one) => one.role);
    // No role is on both lists. A head of development is not a job at a cane
    // mill and a head of milling is not a job at a film company.
    for (const role of ours) expect(theirs).not.toContain(role);
    // And every post on either list resolves to facts, whichever table holds it.
    for (const role of [...ours, ...theirs]) expect(postFacts(role)).toBeTruthy();
  });
});

describe('nobody has to say yes', () => {
  /**
   * `company.fill_post` could not fail for any reason that was about the person.
   * It checked the role existed, that the seat was empty and that the name was
   * somebody the save had, and then it put them in the chair. Six posts, three
   * relatives, and every one of them agreed to anything — including to four jobs
   * at once, because nothing ever emptied the seat they already held.
   */

  const offer = (sim: Simulation, role: string, personId: string): Done =>
    run(sim, 'company.fill_post', { role, personId });

  it('says yes on the first morning, because the family is close then', () => {
    const sim = world('consent-yes');
    const mother = personCalled(sim, 'Halla');
    expect(bondFor(sim.universe, sim.universe.playerId, mother)!.closeness)
      .toBeGreaterThan(WILL_TAKE_A_POST);
    expect(whyNotTakeIt(sim, mother, 'production')).toBeUndefined();
    expect(offer(sim, 'production', mother).ok).toBe(true);
  });

  it('says no once you have stopped keeping up with them', () => {
    // The refusal reads `closeness`, which is not a fact about the save but a
    // record of what the player did: keeping a plan warms it six, missing one
    // cools it ten, and it drifts toward 60 under one roof or 25 apart.
    const sim = world('consent-drifted');
    const mother = personCalled(sim, 'Halla');
    const bond = bondFor(sim.universe, sim.universe.playerId, mother)!;

    const why = () => whyNotTakeIt(sim, mother, 'production');
    expect(why(), 'close at boot, so there is nothing to refuse').toBeUndefined();

    bond.closeness = WILL_TAKE_A_POST - 1;
    expect(why()).toBeTruthy();
    expect(why()).toContain('says no');
    // And it names the standing rather than a number, in the world's own words.
    expect(why()).toContain(standingWord(bond.closeness).toLowerCase());
    expect(offer(sim, 'production', mother).ok).toBe(false);
    expect(filled(sim.universe, 'production')).toBeUndefined();

    // Recoverable, on purpose: warm it back and ask again. Four kept plans.
    bond.closeness = WILL_TAKE_A_POST - 1 + TOGETHER_WARMS * 4;
    expect(why()).toBeUndefined();
    expect(offer(sim, 'production', mother).ok).toBe(true);
  });

  it('is reachable by playing, not only by writing to the bond', () => {
    // The line has to be crossable by a player or it is a threshold no save can
    // hold. Missing plans cools ten a time, so four missed plans takes the
    // opening 72 under forty on its own — and a parent who no longer lives under
    // the same roof rests at 25 and is under it inside a month whatever happens.
    const sim = world('consent-reachable');
    const mother = personCalled(sim, 'Halla');
    const bond = bondFor(sim.universe, sim.universe.playerId, mother)!;
    const opened = bond.closeness;
    expect(opened - MISSED_COOLS * 4, 'four missed plans should not reach the line')
      .toBeLessThan(WILL_TAKE_A_POST);
    expect(RESTING_APART, 'somebody who moves out should drift under it')
      .toBeLessThan(WILL_TAKE_A_POST);
    // And the resting level for somebody still in the house is above it, so a
    // player who simply lets time pass does not lose the family.
    expect(RESTING_UNDER_ONE_ROOF).toBeGreaterThan(WILL_TAKE_A_POST);
  });

  it('says no to somebody who has no reason to know you', () => {
    // The sugar group's five executives are in `universe.people` and every one of
    // them could be made head of production. They have never met the player.
    const sim = world('consent-stranger');
    const group = theSugarGroup(sim)!;
    const executive = postsOf(sim.universe, group.id)
      .filter((one) => !BOARD_SEATS.includes(one.role as typeof BOARD_SEATS[number]))
      .map((one) => one.personId!)[0]!;
    expect(bondFor(sim.universe, sim.universe.playerId, executive)).toBeUndefined();
    expect(whyNotTakeIt(sim, executive, 'production')).toContain('don’t really know');
    expect(offer(sim, 'production', executive).ok).toBe(false);
  });

  it('will not let one person hold two seats, which is what it used to do', () => {
    // `post.personId = person.id` never emptied the seat they were already in, so
    // one relative could hold all six posts and every door behind them opened.
    const sim = world('consent-two-seats');
    const mother = personCalled(sim, 'Halla');
    expect(seatHeldBy(sim, mother)!.role, 'the mother runs the company at boot')
      .toBe('principal');

    // A bigger job is worth leaving the one she has, and leaving it empties it.
    expect(offer(sim, 'production', mother).ok).toBe(true);
    expect(seatHeldBy(sim, mother)!.role).toBe('production');
    expect(filled(sim.universe, 'principal'), 'she is in two chairs at once')
      .toBeUndefined();
    // One seat each, always.
    const held = postsOf(sim.universe, parentCompany(sim.universe)!.id)
      .filter((one) => one.personId).map((one) => one.personId!);
    expect(new Set(held).size).toBe(held.length);
  });

  it('will not leave a bigger job for a smaller one, and says which', () => {
    const sim = world('consent-bigger');
    const mother = personCalled(sim, 'Halla');
    expect(offer(sim, 'production', mother).ok).toBe(true);

    // The accountant is worth less than the head of production, so she stays.
    const production = ROLES.find((one) => one.id === 'production')!;
    const accountant = ROLES.find((one) => one.id === 'accountant')!;
    expect(accountant.monthlyCents).toBeLessThan(production.monthlyCents);

    const why = whyNotTakeIt(sim, mother, 'accountant');
    expect(why).toBeTruthy();
    expect(why).toContain('the bigger job of the two');
    expect(why).toContain(production.said);
    expect(offer(sim, 'accountant', mother).ok).toBe(false);
    expect(seatHeldBy(sim, mother)!.role, 'she was moved anyway').toBe('production');
  });

  it('never asks the player or the principal, because neither needs asking', () => {
    const sim = world('consent-unasked');
    // You do not ask yourself to do a job.
    expect(whyNotTakeIt(sim, sim.universe.playerId, 'production')).toBeUndefined();
    // And the principal is whoever the company answers to. Even a relative the
    // player has entirely stopped seeing still owns what they own.
    const father = personCalled(sim, 'Jón');
    bondFor(sim.universe, sim.universe.playerId, father)!.closeness = 0;
    expect(whyNotTakeIt(sim, father, 'principal')).toBeUndefined();
    expect(whyNotTakeIt(sim, father, 'accountant')).toBeTruthy();
  });
});

describe('things in the company end now', () => {
  /**
   * "Nothing in the company ever ends" was the one substantial entry on
   * `docs/UNBITTEN.md` nobody had managed to build, and it failed specification
   * twice — both times by trying to build a general lapsing engine whose
   * scaffolding moved the numbers it was meant to measure.
   *
   * This is the smaller cut. Two things end, both already carried the date they
   * end on, and both of the filters that hide them already existed with no
   * writer: `Holding.expiresAt` against `holdingsOf`, and `Policy.renewsAt` and
   * `Policy.lapsedAt` against `policiesOf` — the latter described by its own
   * docstring as the purest example in the file of a guard no reachable input
   * could trip.
   */

  const MONTH = 31 * MS_DAY;

  it('runs an option out when nobody says yes inside the term', () => {
    const sim = world('ends-option');
    expect(run(sim, 'company.option', { title: 'Hvítserkur', hold: 'option', months: 18 }).ok)
      .toBe(true);
    const holding = holdingsOf(sim.universe)[0]!;
    expect(holding.expiresAt, 'an option with no term is not an option').toBeDefined();
    expect(doorFor(sim, 'own_material').can).toBe(true);

    // A year in it is still there, and the company has been told it is coming.
    sim.advanceTo(sim.now + 12 * MONTH);
    expect(holdingsOf(sim.universe)).toHaveLength(1);
    expect(sim.universe.holdings[holding.id]!.lapsedAt).toBeUndefined();

    // Nineteen months in it is gone, and the door it opened is shut.
    sim.advanceTo(sim.now + 8 * MONTH);
    expect(sim.universe.holdings[holding.id]!.lapsedAt, 'the term ran out and nothing happened')
      .toBeDefined();
    expect(holdingsOf(sim.universe)).toHaveLength(0);
    expect(doorFor(sim, 'own_material').can).toBe(false);
    // The record stays in the save. A thing the company used to hold is history.
    expect(sim.universe.holdings[holding.id]).toBeDefined();
  });

  it('warns before it goes, so it is a mistake rather than a surprise', () => {
    const sim = world('ends-warned');
    run(sim, 'company.option', { title: 'Dettifoss', hold: 'option', months: 18 });
    const said = () => sim.universe.notifications
      .filter((one) => one.title.includes('Dettifoss')).map((one) => one.title);

    sim.advanceTo(sim.now + 12 * MONTH);
    expect(said(), 'a year out is too early to be told').toEqual([]);
    sim.advanceTo(sim.now + 5 * MONTH);
    expect(said().some((one) => one.includes('Is Running Out')), 'no warning before the term ran out')
      .toBe(true);
    sim.advanceTo(sim.now + 3 * MONTH);
    expect(said().some((one) => one.includes('Has Run Out'))).toBe(true);
  });

  it('is beaten by the greenlight, because that is when the rights are bought', () => {
    // Which is also what makes the clock safe to run: a picture in production
    // cannot lose its material, because saying yes to it secured the rights.
    const sim = world('ends-exercised');
    openTheDoors(sim, 'Askja');
    const holding = holdingsOf(sim.universe).find((one) => one.title === 'Askja')!;
    expect(holding.hold).toBe('option');
    expect(holding.expiresAt).toBeDefined();

    run(sim, 'company.develop', { title: 'Askja', medium: 'film' });
    const project = projectsOf(sim.universe).find((one) => one.title === 'Askja')!;
    // The project knows which rights it is being made off, which it did not: only
    // an explicit `holdingId` counted and nothing passes one, so a company that
    // optioned a title and then developed the same title produced a project with
    // no link to the option it was obviously for.
    expect(project.holdingId).toBe(holding.id);
    expect(project.stage).toBe('optioned');

    run(sim, 'company.greenlight', {
      projectId: project.id, planId: 'feature', budgetCents: 2_000_000_00, shootWeeks: 6,
    });
    expect(sim.universe.holdings[holding.id]!.hold, 'the greenlight did not exercise it')
      .toBe('owned');
    expect(sim.universe.holdings[holding.id]!.expiresAt).toBeUndefined();

    // And three years later it is still the company's.
    sim.advanceTo(sim.now + 36 * MONTH);
    expect(sim.universe.holdings[holding.id]!.lapsedAt).toBeUndefined();
    expect(holdingsOf(sim.universe).map((one) => one.title)).toContain('Askja');
  });

  it('charges the premium again every year, which it never did', () => {
    // "The premium is charged once, on the day the cover is bound, and never
    // again. A year of cover is what the quote describes, not what the engine
    // bills." It bills it now.
    const sim = world('ends-renewal');
    expect(run(sim, 'company.insure', { policy: 'general_liability' }).ok).toBe(true);
    const policy = policiesOf(sim.universe)[0]!;
    const label = POLICY_BY_ID[policy.kind].label;
    const renewals = () => sim.universe.transactions
      .filter((one) => one.memo === `${label}: Renewal`).length;
    // Funded, because the claim here is that a year of cover is billed rather
    // than that the company happens to have the premium on the day. Whether it
    // can pay is the next test, and it is a different question.
    theyCanAffordIt(sim);

    expect(renewals(), 'nothing is due in the first year').toBe(0);
    sim.advanceTo(sim.now + 13 * MONTH);
    expect(renewals(), 'a year went by and the insurer never billed').toBe(1);
    expect(policiesOf(sim.universe), 'it was paid, so the cover stands').toHaveLength(1);
    expect(policy.renewsAt, 'the next term was never written').toBeGreaterThan(sim.now);
    expect(policy.graceUntil, 'it was paid, so nothing is owed').toBeUndefined();
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('lapses cover the company cannot pay for, after a month of grace', () => {
    // Reachable, and this is the part that matters: `lapsedAt` had no writer at
    // all. The company is settled to the cent every day by the family, so the
    // path to losing cover is the family refusing — which happens past the last
    // rung in a month the lot let nothing.
    const sim = world('ends-lapse');
    run(sim, 'company.insure', { policy: 'general_liability' });
    const policy = policiesOf(sim.universe)[0]!;
    const account = cashAccountFor(sim.universe, parentCompany(sim.universe)!.id)!;

    // Due today, and the company has nothing.
    policy.renewsAt = sim.now;
    sim.expense(account.id, account.balance, 'Test: spent to the last króna', 'business');
    expect(account.balance).toBe(0);

    // A month of grace, named out loud, and the cover still stands.
    expect(runTheClock(sim)).toMatchObject({ owed: 1, uncovered: 0 });
    expect(policy.graceUntil, 'no grace at all is not an insurer').toBeDefined();
    expect(policy.lapsedAt).toBeUndefined();
    expect(carries(sim.universe, 'general_liability')).toBeTruthy();
    expect(sim.universe.notifications.some((one) => one.title.includes('Is Due For Renewal')))
      .toBe(true);

    // Paid inside the month and it is renewed, grace cleared.
    const rich = world('ends-lapse-paid');
    run(rich, 'company.insure', { policy: 'general_liability' });
    const theirs = policiesOf(rich.universe)[0]!;
    theirs.renewsAt = rich.now;
    expect(runTheClock(rich)).toMatchObject({ renewed: 1, owed: 0, uncovered: 0 });
    expect(theirs.graceUntil).toBeUndefined();

    // Still nothing when the grace runs out and it goes, and the doors shut.
    //
    // The grace date is moved back rather than the clock forward, because
    // advancing the save runs the scheduled sweep and the family's daily cover in
    // between — which is the behavior the played-career measurement is for, and
    // here it would decide the outcome instead of the thing being tested.
    policy.graceUntil = sim.now - MS_DAY;
    expect(runTheClock(sim)).toMatchObject({ uncovered: 1 });
    expect(policy.lapsedAt, 'a guard no reachable input can trip').toBeDefined();
    expect(carries(sim.universe, 'general_liability')).toBeUndefined();
    expect(policiesOf(sim.universe)).toHaveLength(0);
    expect(doorFor(sim, 'insure_a_shoot').can).toBe(false);
    expect(sim.universe.notifications.some((one) => one.title.includes('Has Lapsed'))).toBe(true);
  });

  it('leaves ownership alone, because ownership has no term', () => {
    const sim = world('ends-owned');
    run(sim, 'company.option', { title: 'Skógafoss', hold: 'owned' });
    const holding = holdingsOf(sim.universe)[0]!;
    expect(holding.hold).toBe('owned');
    expect(holding.expiresAt, 'ownership carries no term').toBeUndefined();
    sim.advanceTo(sim.now + 120 * MONTH);
    expect(sim.universe.holdings[holding.id]!.lapsedAt).toBeUndefined();
    expect(holdingsOf(sim.universe)).toHaveLength(1);
  });
});

describe('somebody gets paid for making the pictures', () => {
  /**
   * The measurement that put this here is the most damning one in the audit
   * trail. Over twenty-five played years a company that greenlights thirty-six
   * pictures and delivers thirty-three ends holding EUR 238,755,876, and the
   * player who ran every one of them ends with EUR 700 — the balance the save
   * opened with. They hold nought percent of the company, because the parents
   * built it and the parents hold it, and EUR 1,540 reached their accounts in a
   * quarter of a century.
   *
   * `docs/UNBITTEN.md` had it the other way round: the company must stop
   * out-earning the career, and the slate's 1.44–1.63x return is the engine of a
   * hundred-to-one, left for the owner as a decision about the game. It is not a
   * calibration and moving the multiple would not have touched it. The company was
   * not out-earning the career; it was earning money the career could never reach.
   * There was no mechanism at all — no dividend, no ownership, no fee.
   */

  /** Runs the picture out to the end of its work, re-reading the end as it moves. */
  const runItOut = (sim: Simulation, id: string): void => {
    for (let i = 0; i < 12; i += 1) {
      const done = finishesBy(sim.universe.projects[id]!);
      if (done === undefined || sim.now > done) break;
      sim.advanceTo(done + MS_DAY);
    }
  };

  const feesIn = (sim: Simulation, personId: string): Money => sim.universe.transactions
    .filter((one) => one.memo.includes('The Producer’s Fee'))
    .reduce((sum, one) => sum + one.postings
      .filter((p) => p.amount > 0 && sim.universe.accounts[p.accountId]?.ownerId === personId)
      .reduce((m, p) => m + p.amount, 0), 0);

  it('pays whoever the company answers to, across the schedule', () => {
    const sim = world('fee-paid');
    // The chair first, and then the doors. Taking a seat leaves the one you were
    // in, so opening the doors first puts the player in the head of production —
    // and moving them to the principal's chair then empties it and shuts the
    // greenlight door, which is the scarcity working rather than a bug.
    expect(run(sim, 'company.fill_post', { role: 'principal', personId: sim.universe.playerId }).ok)
      .toBe(true);
    openTheDoors(sim, 'Hvítserkur');

    run(sim, 'company.develop', { title: 'Hvítserkur', medium: 'film' });
    const id = projectsOf(sim.universe).find((one) => one.title === 'Hvítserkur')!.id;
    const budget = 20_000_000_00;
    expect(run(sim, 'company.greenlight', {
      projectId: id, planId: 'feature', budgetCents: budget, shootWeeks: 6,
    }).ok).toBe(true);

    // Nothing at the greenlight. The first version took the whole fee the moment
    // the picture was committed to, and a company that greenlights twenty million
    // on a hundred and seventeen thousand in the bank — which is the shape of this
    // game, the family funds the budget as the periods run — went to minus
    // EUR 483,000 and could never greenlight anything again.
    expect(feesIn(sim, sim.universe.playerId)).toBe(0);

    runItOut(sim, id);
    const paid = feesIn(sim, sim.universe.playerId);
    expect(paid, 'nobody was paid for making it').toBeGreaterThan(0);
    expect(paid, 'the whole fee, paid exactly once across the periods')
      .toBe(Math.round(budget * PRODUCER_FEE));
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('comes out of the budget rather than on top of it', () => {
    // A producer's fee is a line in a budget. So the picture is made for
    // ninety-seven percent of what it was greenlit at, the company pays exactly
    // what it was greenlit at, and the trade is real: three percent of what was
    // going on the screen goes to the person instead.
    const sim = world('fee-inside');
    run(sim, 'company.fill_post', { role: 'principal', personId: sim.universe.playerId });
    openTheDoors(sim, 'Askja');
    run(sim, 'company.develop', { title: 'Askja', medium: 'film' });
    const id = projectsOf(sim.universe).find((one) => one.title === 'Askja')!.id;
    const budget = 20_000_000_00;
    run(sim, 'company.greenlight', {
      projectId: id, planId: 'feature', budgetCents: budget, shootWeeks: 6,
    });
    expect(onTheScreen(sim.universe.projects[id]!))
      .toBe(Math.round(budget * (1 - PRODUCER_FEE)));

    runItOut(sim, id);
    // What the picture cost counts the fee, because the fee is part of what it
    // cost. So a picture still spends what it was greenlit at.
    const project = sim.universe.projects[id]!;
    expect(project.spentCents).toBeGreaterThanOrEqual(budget);
    expect(feesIn(sim, sim.universe.playerId) + Math.round(budget * (1 - PRODUCER_FEE)))
      .toBeLessThanOrEqual(project.spentCents);
  });

  it('pays nobody when the chair is empty, and says so', () => {
    // Which is reachable and not a corner: six posts and three relatives, so
    // filling the head of production can be what empties the principal's chair.
    const sim = world('fee-nobody');
    openTheDoors(sim, 'Dettifoss');
    openTheBooks(sim);
    for (const post of postsOf(sim.universe, parentCompany(sim.universe)!.id)) {
      if (post.role === 'principal') { delete post.personId; delete post.filledAt; }
    }
    expect(filled(sim.universe, 'principal')).toBeUndefined();

    run(sim, 'company.develop', { title: 'Dettifoss', medium: 'film' });
    const id = projectsOf(sim.universe).find((one) => one.title === 'Dettifoss')!.id;
    run(sim, 'company.greenlight', {
      projectId: id, planId: 'feature', budgetCents: 20_000_000_00, shootWeeks: 6,
    });
    runItOut(sim, id);

    expect(sim.universe.transactions.filter((one) => one.memo.includes('The Producer’s Fee')))
      .toHaveLength(0);
    expect(sim.universe.notifications
      .some((one) => one.title.includes('Nobody Is Being Paid For Making Dettifoss')),
    'the money stayed in the company and nothing said why').toBe(true);
  });

  it('is the size of a good part rather than the size of the slate', () => {
    // The answer to whether producing makes acting pointless, as a comparison
    // rather than an opinion. Three percent of a twenty-million feature is
    // EUR 600,000 against a lead fee on the same picture of about EUR 878,000 —
    // so producing pays about what a good part pays, and the slate's return stays
    // with the family that financed it.
    const fee = Math.round(20_000_000_00 * PRODUCER_FEE);
    expect(fee).toBe(600_000_00);
    const leadBand = Math.round(20_000_000_00 * CAST_SHARE / A_WHOLE_CAST);
    expect(fee).toBeLessThan(leadBand);
    expect(fee).toBeGreaterThan(leadBand / 2);
  });

  it('needs the chair, and the chair has somebody in it', () => {
    // The fee was unreachable for the player before this: it goes to the
    // principal, a parent holds the principal from the first morning, and
    // "Somebody is already the principal" meant the answer was never.
    const sim = world('fee-chair');
    const me = sim.universe.playerId;
    const mother = personCalled(sim, 'Halla');
    expect(filled(sim.universe, 'principal')!.personId).toBe(mother);

    // Close enough and she stands down.
    expect(whyNotStepAside(sim, mother, 'principal')).toBeUndefined();
    expect(run(sim, 'company.fill_post', { role: 'principal', personId: me }).ok).toBe(true);
    expect(filled(sim.universe, 'principal')!.personId).toBe(me);

    // Drifted, and she does not. Asking for the family company is a favor.
    const other = world('fee-chair-cold');
    const cold = personCalled(other, 'Halla');
    bondFor(other.universe, other.universe.playerId, cold)!.closeness = WILL_TAKE_A_POST - 1;
    expect(whyNotStepAside(other, cold, 'principal')).toContain('won’t stand down');
    expect(run(other, 'company.fill_post', { role: 'principal', personId: other.universe.playerId }).ok)
      .toBe(false);
    expect(filled(other.universe, 'principal')!.personId).toBe(cold);
  });
});
