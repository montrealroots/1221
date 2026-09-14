/**
 * SLATE — the lot as a business, and whether it is one.
 *
 * Sugar Land has four stages on it and the family paid for them. This holds the
 * engine to the honest answer about what that bought, because the answer is bad
 * and a bad answer that nothing pins is an answer that drifts.
 *
 * The finding these exist to keep: a lot nobody has heard of, in a country with
 * no crew, does not fill. Five years of doing nothing gives about nine bookings
 * a year and under a fifth of the stage-weeks sold, against a break-even that
 * needs three fifths of them. The family covers the difference out of the sugar
 * money, every month, for as long as the save runs.
 *
 * That is not a number to tune until it looks better. It is what a speculative
 * build in a hard place does, and the research is full of lots it did it to.
 * What these tests hold is that it stays true for a player who does nothing —
 * so that anything which changes it has to be something the player did.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import {
  AROUND_THE_SHOOT, CREW_BASE, ENQUIRY_SHAPES, MONTHLY_OVERHEAD_CENTS, MOST_OF_THE_SPEND,
  OVERHEAD, PATIENCE, RATE_SHARE, type Enquiry,
} from '@/engine/content/lot';
import { REBATE } from '@/engine/content/incorporation';
import {
  ISK_A_EURO, breakEvenShare, crewInTheCountry, heldFor, paidInSoFar, quotedFor, rungFor,
  MS_WEEK, stagesOn, standingWith, tierFor, utilisation, whatTheFamilySays,
  whereTheLotStands, wholeHold,
  wouldBook,
} from '@/engine/world/lot';
import { capabilitiesOf } from '@/engine/world/company';

/** Five years of the world running, with nobody doing anything about it. */
function fiveYears(seed: string): { sim: Simulation; from: number } {
  const sim = quickSave({}, seed);
  const from = sim.now;
  sim.advanceTo(from + 5 * 365 * MS_DAY);
  return { sim, from };
}

const SEEDS = ['lot-a', 'lot-b', 'lot-c'];
const asYear = (cents: number): number => Math.round(cents / 100 / 1_000_000);

// ---------------------------------------------------------------------------

describe('what the family actually bought', () => {
  it('put four stages on the land and keeps them standing', () => {
    const { sim } = fiveYears('lot-standing');
    const stages = stagesOn(sim);
    expect(stages).toHaveLength(4);
    for (const stage of stages) {
      expect(stage.floorSqm).toBeGreaterThan(0);
      expect(stage.weekRateCents).toBeGreaterThan(0);
    }
  });

  it('charges for the place whether or not anybody is on it', () => {
    // Seven lines, posted separately, because one figure called overhead is a
    // figure nobody can argue with. These are what a lot costs to keep open.
    expect(OVERHEAD.length).toBeGreaterThan(5);
    expect(MONTHLY_OVERHEAD_CENTS).toBe(OVERHEAD.reduce((n, line) => n + line.monthlyCents, 0));
    const { sim } = fiveYears('lot-overhead');
    for (const line of OVERHEAD) {
      const posted = sim.universe.transactions.filter((t) => t.memo.includes(line.label)).length;
      expect(posted, `${line.label} was never charged`).toBeGreaterThan(50);
    }
  });

  it('needs three fifths of its stage-weeks sold to cover a month', () => {
    const { sim } = fiveYears('lot-breakeven');
    const need = breakEvenShare(sim)!;
    // Derived from the rate card against the overhead, not written down. It is
    // a hard number for a small lot and that is the point of it.
    expect(need).toBeGreaterThan(0.5);
    expect(need).toBeLessThan(0.75);
  });
});

describe('and it does not fill', () => {
  it('takes a handful of jobs a year, doing nothing about it', () => {
    for (const seed of SEEDS) {
      const { sim } = fiveYears(seed);
      // Jobs and not rows. A job is a prep, a shoot and a strike, and counting
      // the rows would say the lot is three times busier than it is.
      const jobs = Object.values(sim.universe.bookings)
        .filter((one) => one.kind === 'shooting').length / 5;
      expect(jobs, `${seed} took ${jobs} jobs a year`).toBeGreaterThan(2);
      expect(jobs, `${seed} took ${jobs} jobs a year`).toBeLessThan(7);
    }
  });

  it('sells under a fifth of its stage-weeks, against the three fifths it needs', () => {
    for (const seed of SEEDS) {
      const { sim, from } = fiveYears(seed);
      const five = utilisation(sim, from, sim.now);
      const got = five.share ?? 0;
      const need = breakEvenShare(sim)!;
      expect(got, `${seed} ran at ${Math.round(got * 100)}/100`).toBeLessThan(0.3);
      expect(got, `${seed} ran at ${Math.round(got * 100)}/100`).toBeGreaterThan(0.05);
      // The gap is the whole finding. Half of what it needs would be a business
      // in trouble; a third of what it needs is a different kind of thing.
      expect(got).toBeLessThan(need / 2);
    }
  });

  it('loses money every year, and the family covers it out of the sugar', () => {
    for (const seed of SEEDS) {
      const { sim, from } = fiveYears(seed);
      const five = utilisation(sim, from, sim.now);
      const earnedAYear = five.earnsCents / 5;
      const costAYear = MONTHLY_OVERHEAD_CENTS * 12;
      expect(earnedAYear, `${seed} earned ${asYear(earnedAYear)}m a year`).toBeLessThan(costAYear / 2);
      // And somebody is writing the check. Without this the company's cash
      // just goes negative and stays there with nothing saying who is funding it.
      expect(paidInSoFar(sim), seed).toBeGreaterThan(20_000_000_00);
    }
  });

  it('says so plainly rather than describing itself as quiet', () => {
    const { sim } = fiveYears('lot-says');
    const said = whereTheLotStands(sim);
    expect(said).toContain('4 stages');
    expect(said).toMatch(/62% full to cover a month/);
  });

  it('reads how full it was in money, because the break-even beside it is money', () => {
    const { sim, from } = fiveYears('lot-weighted');
    const five = utilisation(sim, from, sim.now);
    // The two big rooms are two thirds of the rate card between them, so a
    // month in the cheap ones is half the stage-weeks and a third of the money.
    // Comparing weeks against a break-even worked out from the rate card made a
    // busy cheap month read as most of the way to covering itself.
    expect(five.earnsShare).toBeDefined();
    expect(five.ifFullCents).toBeGreaterThan(five.earnsCents);
    expect(five.earnsShare!).toBeLessThan(five.share!);
    expect(five.earnsCents / five.ifFullCents).toBeCloseTo(five.earnsShare!, 6);
    // And the number the screen prints is the money one. Find a month where
    // the two disagree — a month in the cheap rooms — and read it off.
    const busy = quickSave({}, 'lot-weighted');
    const at = busy.now;
    let month = utilisation(busy, busy.now, busy.now);
    for (let i = 0; i < 120; i += 1) {
      busy.advanceTo(at + i * 30 * MS_DAY);
      month = utilisation(busy, busy.now - 30 * MS_DAY, busy.now);
      if (month.taken > 0 && Math.round((month.share ?? 0) * 100) !== Math.round((month.earnsShare ?? 0) * 100)) break;
    }
    expect(month.taken, 'never found a month where the two readings differ').toBeGreaterThan(0);
    const printed = Number(/took (\d+)%/.exec(whereTheLotStands(busy))?.[1]);
    expect(printed).toBe(Math.round((month.earnsShare ?? 0) * 100));
    expect(printed).not.toBe(Math.round((month.share ?? 0) * 100));
  });

  it('keeps the books straight while doing all of it', () => {
    const { sim } = fiveYears('lot-books');
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  });
});

describe('and somebody is paying for that', () => {
  /** Runs the world on, a year at a time, and hands back where it got to. */
  const yearsOn = (seed: string, years: number): Simulation => {
    const sim = quickSave({}, seed);
    const from = sim.now;
    for (let y = 1; y <= years; y += 1) sim.advanceTo(from + y * 365 * MS_DAY);
    return sim;
  };

  it('starts with nobody having mentioned it', () => {
    const sim = quickSave({}, 'lot-quiet');
    const standing = standingWith(sim);
    expect(standing.share).toBe(0);
    expect(standing.rung.id).toBe(PATIENCE[0]!.id);
    expect(standing.conditional).toBe(false);
  });

  it('climbs the rungs as the money goes in, and says so without nagging', () => {
    const sim = yearsOn('lot-rungs', 20);
    const standing = standingWith(sim);
    // Twenty years of a six-million-a-year drain against a hundred and
    // fifty-four million year is most of a year's profit.
    expect(standing.share).toBeGreaterThan(0.5);
    expect(standing.conditional).toBe(true);

    const said = sim.universe.notifications
      .filter((one) => PATIENCE.some((rung) => one.title.includes(rung.label)))
      .map((one) => one.title);
    // Every rung above the first gets said, and the last word is the line.
    expect(new Set(said).size).toBe(PATIENCE.length - 1);
    expect(said[said.length - 1]).toContain(PATIENCE[PATIENCE.length - 1]!.label);
    // A rung can be reached twice, because the family comes down off one when
    // America reopens and the same money reads against a bigger year. What it
    // never does is nag: three rungs across twenty years, said a handful of
    // times between them, and the coming down is not announced at all.
    expect(said.length).toBeLessThan(10);
  });

  it('makes the line come to meet you in a year America was shut', () => {
    // The same money, read against a smaller year. This is the only place the
    // quota is ever felt on this side of the family, and until now the figure
    // that said so was computed correctly and read by nothing.
    const carried = 0.42;
    expect(rungFor(carried, 0).id).toBe('asked');
    expect(rungFor(carried, 2).id, 'two shut years and the family had not moved').toBe('conditional');
    // And it lets up again when America reopens, which is what makes it a
    // lever rather than a ratchet.
    expect(rungFor(carried, 0).id).not.toBe(rungFor(carried, 2).id);
    // The bite is bounded, so no run of shut years makes the first euro fatal.
    expect(rungFor(0.01, 20).id).toBe(PATIENCE[0]!.id);
  });

  it('stops writing a blank check, and the condition is that it is a business', () => {
    const sim = yearsOn('lot-condition', 20);
    expect(standingWith(sim).conditional).toBe(true);
    const lot = sim.universe.properties
      ? Object.values(sim.universe.properties).find((one) => one.kind === 'studio_lot')
      : undefined;
    expect(lot).toBeDefined();

    // Past the line, a month the lot earned nothing is a month it funds itself,
    // and the company's cash goes under — which the greenlight door already
    // reads, so the consequence lands in machinery that was already there.
    // Off the ledger and not off the notification, because the notification is
    // the engine talking about itself. What has to be true is that in a month
    // the lot took nothing, no money arrived.
    let heldBack = 0;
    for (let i = 0; i < 48; i += 1) {
      const before = paidInSoFar(sim);
      const month = utilisation(sim, sim.now, sim.now + 30 * MS_DAY);
      sim.advanceTo(sim.now + 30 * MS_DAY);
      if (standingWith(sim).conditional && month.earnsCents <= 0 && paidInSoFar(sim) === before) {
        heldBack += 1;
      }
    }
    expect(heldBack, 'the family wrote a blank check every month regardless').toBeGreaterThan(0);
    const told = sim.universe.notifications.filter((one) => one.title.includes('Funds Itself'));
    expect(told.length).toBeGreaterThan(0);
    expect(told[0]!.body).toContain('money behind it');
  });

  it('leaves a way back, because a dead end is not a decision', () => {
    const sim = yearsOn('lot-back', 20);
    // Enquiries keep arriving whether or not anybody is paying, so a lot that
    // lets a stage earns its way back to being covered. The proof is that the
    // door is not permanently shut after twenty years of this.
    const shutOnMoney = (): boolean => {
      const door = capabilitiesOf(sim).find((one) => one.id === 'greenlight');
      return door !== undefined && door.blockers.some((b) => b.fixKind === 'money');
    };
    let everOpen = false;
    for (let i = 0; i < 24; i += 1) {
      sim.advanceTo(sim.now + 30 * MS_DAY);
      if (!shutOnMoney()) everOpen = true;
    }
    expect(everOpen, 'the money door never opened again').toBe(true);
  });

  it('says where the family stands in a sentence, with the sugar in it', () => {
    const sim = yearsOn('lot-said', 12);
    const said = whatTheFamilySays(sim);
    expect(said).toMatch(/\d+\/100 of a year of the group/);
    expect(said.length).toBeGreaterThan(80);
  });

  it('keeps the books straight through every bit of that', () => {
    const sim = yearsOn('lot-sound', 20);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  });
});

describe('what a production is actually weighing', () => {
  const at = (sim: Simulation): number => sim.now + 60 * MS_DAY;
  const shape = (id: string): Enquiry => ENQUIRY_SHAPES
    .find((one) => `${one.of.kind}-${one.of.local}` === id)!.of;

  it('holds the room for the build and the strike, not only the shoot', () => {
    // Two thirds of the rate table was read by nothing: every booking in the
    // engine was the shooting weeks, at the shooting rate, so a feature that
    // builds a set for weeks was invisible until the camera turned over.
    for (const one of ENQUIRY_SHAPES) {
      const held = heldFor(one.of);
      expect(held.shoot).toBe(one.of.weeks);
      expect(wholeHold(one.of)).toBeGreaterThan(one.of.weeks);
    }
    // And the spread by kind is the point. A feature builds and strikes; a
    // documentary on a stage arrives in the morning and is gone by the evening.
    const feature = AROUND_THE_SHOOT.feature;
    expect(feature.prep).toBeGreaterThan(AROUND_THE_SHOOT.documentary.prep * 3);
    // Prep and strike land between two fifths and three fifths of the hold,
    // which is what the research says a feature's stage time is made of.
    const bigOne = ENQUIRY_SHAPES.find((one) => one.of.kind === 'feature' && one.of.weeks > 10)!.of;
    const around = (wholeHold(bigOne) - bigOne.weeks) / wholeHold(bigOne);
    expect(around).toBeGreaterThan(0.35);
    expect(around).toBeLessThan(0.6);
  });

  it('writes the prep and the strike as their own rows, at their own rate', () => {
    const { sim } = fiveYears('hold-rows');
    const rows = Object.values(sim.universe.bookings);
    const prep = rows.filter((one) => one.kind === 'prep');
    const shooting = rows.filter((one) => one.kind === 'shooting');
    expect(prep.length, 'nothing was ever booked as prep').toBeGreaterThan(0);
    // One shoot, and a build and a strike around it.
    expect(prep.length).toBeGreaterThanOrEqual(shooting.length);
    // At the lower rate, because that is what the table has always said.
    for (const row of prep) {
      const stage = sim.universe.stages[row.stageId]!;
      expect(row.weekRateCents).toBe(Math.round(stage.weekRateCents * RATE_SHARE.prep));
    }
  });

  it('turns away a room that costs too much of what the job has to spend', () => {
    const sim = quickSave({}, 'too-dear');
    // The ordinary Icelandic commercial: a week on a stage, and the smallest
    // room here is a great deal more room than it needs. It is not the rebate
    // that turns this away and it is not the calendar — it is the price, which
    // this engine used to work out and then never look at.
    const answer = wouldBook(sim, shape('commercial-true'), at(sim));
    expect(answer.stageId).toBeUndefined();
    expect(answer.because).toMatch(/too much of what it has to spend/);
    expect(answer.weekRateCents, 'it never even quoted').toBeGreaterThan(0);
  });

  it('takes the same job when the money behind it is bigger', () => {
    const sim = quickSave({}, 'affordable');
    const dear = shape('commercial-true');
    expect(wouldBook(sim, dear, at(sim)).stageId).toBeUndefined();
    // Nothing about the room changed. The budget did.
    const funded = { ...dear, spendIsk: dear.spendIsk * 8 };
    expect(wouldBook(sim, funded, at(sim)).stageId).toBeDefined();
  });

  it('holds foreign money to a harder line than local money', () => {
    expect(MOST_OF_THE_SPEND.foreign).toBeLessThan(MOST_OF_THE_SPEND.local);
    const sim = quickSave({}, 'harder-line');
    const stage = stagesOn(sim).sort((a, b) => a.floorSqm - b.floorSqm)[0]!;
    const sized: Enquiry = {
      kind: 'limited series', from: 'somebody', needsSqm: stage.floorSqm - 10,
      needsHeightM: 6, needsTank: false, weeks: 8, spendIsk: 1, local: true,
    };
    // A budget worked backward from the quote so the room lands exactly between
    // the two lines, rather than a figure picked and hoped for.
    const quoted = quotedFor(stage, sized);
    const wanted = (MOST_OF_THE_SPEND.foreign + MOST_OF_THE_SPEND.local) / 2;
    const job: Enquiry = { ...sized, spendIsk: Math.round((quoted / wanted / 100) * ISK_A_EURO) };
    const spend = Math.round((job.spendIsk / ISK_A_EURO) * 100);
    expect(quoted / spend).toBeGreaterThan(MOST_OF_THE_SPEND.foreign);
    expect(quoted / spend).toBeLessThan(MOST_OF_THE_SPEND.local);
    expect(wouldBook(sim, job, at(sim)).stageId).toBeDefined();
    expect(wouldBook(sim, { ...job, local: false }, at(sim)).because)
      .toMatch(/too much of what it has to spend|doesn’t cover/);
  });
});

describe('the rebate is four tests and the country can fail one', () => {
  it('counts everybody in Iceland who does this, and the save adds to them', () => {
    const sim = quickSave({}, 'crew-count');
    expect(crewInTheCountry(sim)).toBeGreaterThanOrEqual(CREW_BASE);
  });

  it('takes the higher tier away when there is nobody left to crew it', () => {
    const sim = quickSave({}, 'crew-short');
    const big: Enquiry = {
      kind: 'feature', from: 'an American studio', needsSqm: 5_200, needsHeightM: 24,
      needsTank: false, weeks: 14, spendIsk: 1_900_000_000, local: false,
    };
    const from = sim.now + 60 * MS_DAY;
    expect(tierFor(sim, big, from), 'a tentpole could not reach the higher tier')
      .toBe(REBATE.higherShare);

    // Now fill the country. Every shooting booking across those weeks wants
    // fifty people of its own, and there are only so many in Iceland.
    const stage = stagesOn(sim)[0]!;
    for (let i = 0; i < Math.ceil(crewInTheCountry(sim) / REBATE.higherNeeds.crew); i += 1) {
      sim.universe.bookings[`b${i}`] = {
        id: `b${i}`, saveId: sim.universe.meta.id, stageId: stage.id, holder: 'somebody',
        kind: 'shooting', from, to: from + 20 * MS_WEEK, weekRateCents: 1,
      };
    }
    expect(tierFor(sim, big, from), 'the country ran out of crew and nobody noticed')
      .toBe(REBATE.share);
  });

  it('keeps the limbs cumulative, so failing one is failing the band', () => {
    const sim = quickSave({}, 'crew-limbs');
    const from = sim.now + 60 * MS_DAY;
    const big: Enquiry = {
      kind: 'feature', from: 'an American studio', needsSqm: 5_200, needsHeightM: 24,
      needsTank: false, weeks: 14, spendIsk: 1_900_000_000, local: false,
    };
    // Under the spend, and no amount of crew in the country promotes it.
    expect(tierFor(sim, { ...big, spendIsk: REBATE.higherNeeds.spendIsk - 1 }, from))
      .toBe(REBATE.share);
    // Under the days, likewise.
    expect(tierFor(sim, { ...big, weeks: 1 }, from)).toBe(REBATE.share);
  });
});
