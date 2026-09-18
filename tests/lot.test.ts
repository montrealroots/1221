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
  AROUND_THE_SHOOT, A_SMALL_STAGE, A_SQUARE_METRE_CENTS, BUILD_COST_CENTS, CREW_BASE,
  ENQUIRY_SHAPES, LOT_FLOOR_SQM, OVERHEAD_FLOOR_CENTS, MOST_CALLS,
  MOST_OF_THE_SPEND, OVERHEAD, PATIENCE, RATE_SHARE, SELLING, SMALL_STAGE_COST_CENTS,
  THE_RATE_CARD, type Enquiry,
} from '@/engine/content/lot';
import { REBATE } from '@/engine/content/incorporation';
import {
  BUILD_MEMO, ISK_A_EURO, behindTheCompany, breakEvenShare, buildAStage, chargeTheMonth,
  crewInTheCountry, familyCovers, floorStanding, goingUp, heldFor,
  monthlyOverhead, paidInSoFar, pullOn,
  quotedFor, reachOf, rungFor, stillToCarry, theSmallStage, turnedAway,
  MS_WEEK, stagesOn, standingWith, tierFor, utilisation, whatTheFamilySays,
  whereTheBuildStands, whereTheLotStands, whyNotBuild, wholeHold,
  wouldBook, familyTakesItBack,
} from '@/engine/world/lot';
import { capabilitiesOf, cashAccountFor, parentCompany } from '@/engine/world/company';

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
    expect(OVERHEAD_FLOOR_CENTS).toBe(OVERHEAD.reduce((n, line) => n + line.monthlyCents, 0));
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

describe('what the lot measures itself against', () => {
  it('moves the bar when the player moves the spend, and says so on the screen', () => {
    const sim = quickSave({}, 'break-even-live');
    const floor = breakEvenShare(sim)!;
    const atFloor = monthlyOverhead(sim);
    expect(atFloor).toBe(OVERHEAD_FLOOR_CENTS);

    expect(sim.execute<{ ok: boolean }>(
      { kind: 'lot.sell', payload: { monthlyCents: SELLING.most } },
    ).value!.ok).toBe(true);

    // breakEvenShare divided the declared constant while chargeTheMonth charged
    // what the player chose, so the one lever on this business silently raised
    // its own target and every figure on every screen went on printing the old
    // one.
    expect(monthlyOverhead(sim)).toBeGreaterThan(atFloor);
    expect(breakEvenShare(sim)!).toBeGreaterThan(floor);
    expect(breakEvenShare(sim)!).toBeCloseTo(
      monthlyOverhead(sim) / (atFloor / floor), 6,
    );
  });

  it('charges exactly what it says a month costs', () => {
    const sim = quickSave({}, 'break-even-charge');
    sim.execute({ kind: 'lot.sell', payload: { monthlyCents: SELLING.most } });
    const account = cashAccountFor(sim.universe, parentCompany(sim.universe)!.id)!;
    const said = monthlyOverhead(sim);
    const spent = chargeTheMonth(sim, account.id);
    expect(spent).toBe(said);
    expect(sim.ledger.audit()).toEqual([]);
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
      expect(jobs, `${seed} took ${jobs} jobs a year`).toBeGreaterThan(5);
      expect(jobs, `${seed} took ${jobs} jobs a year`).toBeLessThan(11);
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
      const costAYear = OVERHEAD_FLOOR_CENTS * 12;
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
    // More than one rung gets said, and the last word is always the line. Not
    // every rung: the company reclaims the tax on what it buys now, so the
    // climb is slower and smoother, and a rung whose threshold falls between
    // two month-ends can be stepped over without anybody announcing it. The one
    // that changes the rules is the one that must never be missed.
    expect(new Set(said).size).toBeGreaterThanOrEqual(2);
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
    // Asked of the function and not of a seed, because a busy lot rarely has a
    // month it took nothing in — which is the mechanism working, and no way to
    // test the mechanism. Off the ledger either way: what has to be true is
    // that no money arrives, not that something was said about it.
    const account = Object.values(sim.universe.accounts)
      .find((one) => one.ownerId === lot!.ownerId && one.kind === 'company_cash')!;
    account.balance = -500_000_00;

    const before = paidInSoFar(sim);
    expect(familyCovers(sim, account.id, 0), 'a month it earned nothing still got a check').toBe(0);
    expect(paidInSoFar(sim)).toBe(before);
    expect(account.balance).toBeLessThan(0);

    // And the same month, with the lot having taken something.
    expect(familyCovers(sim, account.id, 1_000_00)).toBeGreaterThan(0);
    expect(paidInSoFar(sim)).toBeGreaterThan(before);
    expect(account.balance).toBeGreaterThanOrEqual(0);
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

  /**
   * The direction of the money, pinned, because it has been read backwards.
   *
   * A reading of the ledger once put the minimum company balance at
   * -EUR 638,961 and laid it at this function's door. The function only ever
   * pays money in: it cannot take an account under, and on an account that is
   * already square it does not move at all. What takes the company under is
   * `sim.expense`, which carries no balance check — seven overhead lines
   * charged one at a time by `chargeTheMonth` before this runs at the end of
   * the same handler.
   */
  it('only ever pays in, and leaves a square account alone', () => {
    const sim = yearsOn('lot-direction', 3);
    const lot = Object.values(sim.universe.properties ?? {}).find((one) => one.kind === 'studio_lot');
    const account = Object.values(sim.universe.accounts)
      .find((one) => one.ownerId === lot!.ownerId && one.kind === 'company_cash')!;

    // Square, and well short of a month of overhead: the family does nothing.
    account.balance = 1_00;
    const beforeSquare = paidInSoFar(sim);
    expect(familyCovers(sim, account.id, 0), 'covered an account that was not under').toBe(0);
    expect(account.balance, 'moved an account that was square').toBe(1_00);
    expect(paidInSoFar(sim)).toBe(beforeSquare);

    // Under, and the check goes one way. Three years in the family is still
    // on an unconditional rung, so a month that earned nothing is covered.
    account.balance = -250_000_00;
    expect(standingWith(sim).conditional, 'three years in and already conditional').toBe(false);
    const put = familyCovers(sim, account.id, 0);
    expect(put, 'the family took money out').toBeGreaterThan(0);
    expect(account.balance).toBeGreaterThanOrEqual(0);
    expect(account.balance, 'topped up past a round hundred thousand').toBeLessThan(100_000_00);
  });

  /**
   * And the dip nobody is ever in.
   *
   * `chargeTheMonth` posts every overhead line before it calls the family, so
   * a running balance replayed off the ledger passes through a trough a whole
   * month of overhead deep. The world is never in that state: the same handler
   * call puts it right, and what a screen or a door reads is the figure after.
   */
  it('ends the month tick above water, however deep the tick went', () => {
    const sim = yearsOn('lot-trough', 3);
    const lot = Object.values(sim.universe.properties ?? {}).find((one) => one.kind === 'studio_lot');
    const account = Object.values(sim.universe.accounts)
      .find((one) => one.ownerId === lot!.ownerId && one.kind === 'company_cash')!;

    // Enough to start the month square and nowhere near enough to finish it.
    account.balance = 50_000_00;
    const owed = monthlyOverhead(sim);
    expect(owed, 'a month of it should dwarf what is in there').toBeGreaterThan(account.balance);

    chargeTheMonth(sim, account.id, 0);
    expect(account.balance, 'the month ended under water').toBeGreaterThanOrEqual(0);
    // The trough the ledger passes through, said as arithmetic rather than as
    // a state: what was there, less what a month costs.
    expect(50_000_00 - owed).toBeLessThan(0);
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
    }
    // The long work holds longer than it shoots, and the short work does not,
    // which is the whole of what the table says and was for a long time not
    // what the code did. A floor under both ends forced a week of prep and a
    // week of strike onto every kind — it never fired on a feature, whose own
    // share already rounds well past one, and it fired on every commercial and
    // documentary there is, tripling what the short work was quoted and pricing
    // all of it off the lot.
    for (const one of ENQUIRY_SHAPES) {
      const longer = wholeHold(one.of) > one.of.weeks;
      const long = one.of.kind === 'feature' || one.of.kind === 'limited series';
      expect(longer, `${one.of.kind}, ${one.of.weeks} weeks`).toBe(long);
    }
    // Held to the table itself, either way: what a kind is given is what its
    // own share of its own weeks rounds to, and nothing is put under it.
    for (const one of ENQUIRY_SHAPES) {
      const around = AROUND_THE_SHOOT[one.of.kind];
      expect(heldFor(one.of).prep).toBe(Math.round(one.of.weeks * around.prep));
      expect(heldFor(one.of).strike).toBe(Math.round(one.of.weeks * around.strike));
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
    // This test used to be blind to the thing its own title promises. It
    // asserted that there were at least as many `prep` rows as `shooting` ones
    // and that every `prep` row sat at the prep rate — both of which were true
    // while the strike weeks were written into the save as `prep`, because the
    // rate is the same. A test that cannot tell a build from a load-out cannot
    // catch the two being filed under one word, and for a long time it did not.
    //
    // Structural instead, and it does not depend on counts: a build abuts the
    // start of a shoot on the same stage and a strike abuts the end of one.
    const { sim } = fiveYears('hold-rows');
    const rows = Object.values(sim.universe.bookings);
    const shooting = rows.filter((one) => one.kind === 'shooting');
    const prep = rows.filter((one) => one.kind === 'prep');
    const strike = rows.filter((one) => one.kind === 'strike');
    expect(prep.length, 'nothing was ever booked as prep').toBeGreaterThan(0);
    expect(strike.length, 'five years and nobody ever struck a set').toBeGreaterThan(0);

    for (const row of prep) {
      expect(
        shooting.some((one) => one.stageId === row.stageId && one.from === row.to),
        'a build that runs up to nothing shooting',
      ).toBe(true);
    }
    for (const row of strike) {
      expect(
        shooting.some((one) => one.stageId === row.stageId && one.to === row.from),
        'a load-out with no shoot in front of it',
      ).toBe(true);
    }
    // Both at the lower rate, because that is what the table has always said:
    // the crew and the hours are the same going up as coming down.
    for (const row of [...prep, ...strike]) {
      const stage = sim.universe.stages[row.stageId]!;
      const share = row.kind === 'prep' ? RATE_SHARE.prep : RATE_SHARE.strike;
      expect(row.weekRateCents).toBe(Math.round(stage.weekRateCents * share));
    }
  });

  it('counts the load-out as time the room was occupied and barely paid for', () => {
    // The reader the strike row was given, and the reason the word exists
    // rather than the rows simply being relabelled. Turnaround is a real
    // occupation of a stage that reads as an empty one: nobody else can have
    // the room, and it is charged at the build rate rather than the shooting
    // one, so a month two thirds full at half the money is usually a month with
    // a lot of load-out in it. Nothing could say so while a strike was a prep.
    const { sim } = fiveYears('hold-strike');
    const from = sim.now - 5 * 365 * MS_DAY;
    const all = utilisation(sim, from, sim.now);
    expect(all.strike, 'no load-out in five years of bookings').toBeGreaterThan(0);
    expect(all.strike, 'more load-out than there were weeks on stages').toBeLessThan(all.taken);

    // And it is the same weeks the rows themselves carry, rather than a second
    // count that could drift from them. Clipped to the window the way every
    // other figure on this record is, because a strike that runs past the end
    // of the month is not a month's worth of load-out.
    const weeks = Object.values(sim.universe.bookings)
      .filter((one) => one.kind === 'strike')
      .reduce((n, one) => {
        const start = Math.max(one.from, from);
        const end = Math.min(one.to, sim.now);
        return end > start ? n + (end - start) / MS_WEEK : n;
      }, 0);
    expect(all.strike).toBeCloseTo(weeks, 6);
  });

  it('turns away a room that costs too much of what the job has to spend', () => {
    const sim = quickSave({}, 'too-dear');
    // The ordinary Icelandic documentary: two weeks on a stage, five hundred
    // square meters of need, and the smallest room here is four times that and
    // has to be paid for whole. It is not the rebate that turns this away and
    // it is not the calendar — it is the price, which this engine used to work
    // out and then never look at.
    const answer = wouldBook(sim, shape('documentary-true'), at(sim));
    expect(answer.stageId).toBeUndefined();
    expect(answer.because).toMatch(/too much of what it has to spend/);
    expect(answer.weekRateCents, 'it never even quoted').toBeGreaterThan(0);
  });

  it('takes the same job when the money behind it is bigger', () => {
    const sim = quickSave({}, 'affordable');
    const dear = shape('documentary-true');
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

    // And the fourth limb, which is a separate question from the third: a unit
    // can be in the country for long enough to clear the working-days floor and
    // still not be here for the fifty days the crew condition asks for. The two
    // thresholds are thirty and fifty, so everything between them fails on one
    // and passes on the other.
    const short = { ...big, weeks: 5 };
    expect(wholeHold(short) * 5).toBeGreaterThanOrEqual(REBATE.higherNeeds.workingDays);
    expect(wholeHold(short) * 5).toBeLessThan(REBATE.higherNeeds.crewDays);
    expect(tierFor(sim, short, from)).toBe(REBATE.share);
  });
});

describe('how many people ring is something the lot earns', () => {
  const tenYears = (seed: string, sell?: number): Simulation => {
    const sim = quickSave({}, seed);
    if (sell !== undefined) {
      const done = sim.execute<{ ok: boolean }>({ kind: 'lot.sell', payload: { monthlyCents: sell } });
      expect(done.value?.ok, 'the lot would not take a selling budget').toBe(true);
    }
    const from = sim.now;
    for (let y = 1; y <= 10; y += 1) sim.advanceTo(from + y * 365 * MS_DAY);
    return sim;
  };

  it('starts at one a month, which is what a lot nobody has heard of gets', () => {
    const sim = quickSave({}, 'ring-cold');
    const pull = pullOn(sim);
    expect(pull.crew).toBe(1);
    expect(pull.record).toBe(0);
    expect(pull.reach).toBe(0);
    expect(pull.calls).toBeCloseTo(1, 6);
  });

  it('never quite reaches nobody, because the film commission exists', () => {
    // A production looking at Iceland finds the commission whether or not this
    // lot bought a stand at a market. Spending nothing is being on a list.
    const sim = quickSave({}, 'ring-floor');
    expect(reachOf(sim)).toBe(0);
    expect(pullOn(sim).calls).toBeGreaterThan(0);
  });

  it('is bounded, because the country only has so much work in it', () => {
    // Iceland draws on the order of a dozen foreign projects a year. A lever
    // a player could grind forever is the same fixed outcome facing the
    // other way.
    const sim = quickSave({}, 'ring-cap');
    for (let i = 0; i < 4_000; i += 1) {
      const one = Object.values(sim.universe.people)[0]!;
      sim.universe.people[`extra-${i}`] = { ...one, id: `extra-${i}`, careerTrack: 'crew' };
    }
    expect(crewInTheCountry(sim)).toBeGreaterThan(CREW_BASE * 4);
    expect(pullOn(sim).calls).toBeLessThanOrEqual(MOST_CALLS);
  });

  it('buys more calls when the lot is sold harder, and the money is real', () => {
    const quiet = tenYears('ring-quiet', SELLING.floor);
    const loud = tenYears('ring-loud', SELLING.most);
    expect(reachOf(loud)).toBeGreaterThan(reachOf(quiet));
    expect(pullOn(loud).calls).toBeGreaterThan(pullOn(quiet).calls * 1.3);

    const jobs = (sim: Simulation): number => Object.values(sim.universe.bookings)
      .filter((one) => one.kind === 'shooting').length;
    expect(jobs(loud)).toBeGreaterThan(jobs(quiet));
    // And it came out of the account, month after month, at the figure set.
    const posted = loud.universe.transactions.filter((one) => one.memo.includes('Selling It'));
    expect(posted.length).toBeGreaterThan(100);
  });

  it('cannot be bought the month before it is wanted, or dropped without cost', () => {
    // Read back off the ledger across three quarters rather than off the
    // figure somebody set, so the market takes as long to notice as it takes
    // to forget.
    const sim = quickSave({}, 'ring-lag');
    sim.execute({ kind: 'lot.sell', payload: { monthlyCents: SELLING.most } });
    const from = sim.now;
    sim.advanceTo(from + 60 * MS_DAY);
    const early = reachOf(sim);
    sim.advanceTo(from + SELLING.remembers * 32 * MS_DAY);
    expect(reachOf(sim), 'the whole of it arrived at once').toBeGreaterThan(early);
    const full = reachOf(sim);

    // Stop paying, and it is still there months later.
    sim.execute({ kind: 'lot.sell', payload: { monthlyCents: SELLING.floor } });
    sim.advanceTo(sim.now + 60 * MS_DAY);
    expect(reachOf(sim)).toBeGreaterThan(0);
    expect(reachOf(sim)).toBeLessThan(full);
  });

  it('refuses to be sold past the point anybody is listening', () => {
    const sim = quickSave({}, 'ring-most');
    const done = sim.execute<{ ok: boolean; error?: string }>({
      kind: 'lot.sell', payload: { monthlyCents: SELLING.most * 4 },
    });
    expect(done.value?.ok).toBe(false);
    expect(done.value?.error).toMatch(/nobody left to tell/);
  });

  it('says what the money bought, refusals and all', () => {
    const loud = tenYears('ring-away', SELLING.most);
    const quiet = tenYears('ring-away-quiet', SELLING.floor);
    const by = (sim: Simulation, why: string): number =>
      turnedAway(sim).find((one) => one.why === why)?.count ?? 0;
    expect(turnedAway(loud).length, 'nothing was ever turned away').toBeGreaterThan(0);
    expect(by(loud, 'rebate')).toBeGreaterThan(by(quiet, 'rebate'));
    for (const one of turnedAway(loud)) expect(one.said.length).toBeGreaterThan(20);

    // And it bought different calls, not only more of them. A desk in Los
    // Angeles is what the money reaches; a producer in Reykjavik knows the
    // stages are there whatever anybody spends. Read off who actually booked,
    // because a share that did not move would mean the money bought volume and
    // nothing else — which is a multiplier, not a demand model.
    const abroad = new Set(ENQUIRY_SHAPES.filter((one) => !one.of.local).map((one) => one.of.from));
    const share = (sim: Simulation): number => {
      const jobs = Object.values(sim.universe.bookings).filter((one) => one.kind === 'shooting');
      const foreign = jobs.filter((one) => [...abroad].some((who) => one.holder.startsWith(who)));
      return jobs.length > 0 ? foreign.length / jobs.length : 0;
    };
    expect(share(loud), 'the money bought more of exactly the same calls')
      .toBeGreaterThan(share(quiet) + 0.05);
  });

  it('keeps the books straight through all of that', () => {
    const sim = tenYears('ring-sound', SELLING.most);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  });
});

/**
 * The fifth room.
 *
 * The only decision on this lot that changes what the lot is rather than how
 * hard it is sold, and the first one that spends capital. What these hold is
 * that it is a bet and not an upgrade: the money goes before the room exists,
 * the room costs more to keep than four did, and it does not pay for itself.
 */
describe('building the fifth room', () => {
  const cash = (sim: Simulation): number => {
    const lot = Object.values(sim.universe.properties).find((p) => p.kind === 'studio_lot')!;
    return Object.values(sim.universe.accounts)
      .find((a) => a.ownerId === lot.ownerId && a.kind === 'company_cash')!.balance;
  };

  it('prices the room off the published benchmark rather than off what makes it book', () => {
    // The first figure here was chosen because it made the commercials book,
    // and at €11.58 a square meter it was the cheapest floor on a lot whose own
    // rate card says small rooms are the dearest. What it is now is arithmetic.
    expect(A_SMALL_STAGE.weekRateCents)
      .toBe(Math.round(A_SMALL_STAGE.floorSqm * THE_RATE_CARD.benchmarkPerSqmWeek * 100));
    const per = A_SMALL_STAGE.weekRateCents / 100 / A_SMALL_STAGE.floorSqm;
    // Dearer by the meter than the two-thousands, cheaper than Lón, which is
    // the order the rate card's own sentence puts them in.
    const sim = quickSave({}, 'priced');
    const twoK = stagesOn(sim).find((one) => one.floorSqm === 2_000)!;
    const askja = stagesOn(sim).find((one) => one.name === 'Askja')!;
    expect(per).toBeGreaterThan(twoK.weekRateCents / 100 / twoK.floorSqm);
    expect(per).toBeGreaterThan(askja.weekRateCents / 100 / askja.floorSqm);
    expect(per).toBeLessThanOrEqual(THE_RATE_CARD.benchmarkPerSqmWeek + 3);
  });

  it('costs what this lot cost by the meter, so the two figures cannot drift', () => {
    expect(A_SQUARE_METRE_CENTS).toBe(Math.round(BUILD_COST_CENTS / LOT_FLOOR_SQM));
    expect(SMALL_STAGE_COST_CENTS).toBe(Math.round(A_SQUARE_METRE_CENTS * A_SMALL_STAGE.floorSqm));
    // A real figure and not a token: a fifth room is an eighth of a year of
    // everything the family's sugar business clears.
    expect(SMALL_STAGE_COST_CENTS).toBeGreaterThan(10_000_000_00);
  });

  it('spends the money on the day and opens the room a year and a half later', () => {
    const sim = quickSave({}, 'building');
    const before = cash(sim);
    expect(whyNotBuild(sim)).toBeUndefined();
    const done = buildAStage(sim);
    expect(done.ok).toBe(true);
    // Gone before anything exists. That is the shape of the bet.
    expect(cash(sim)).toBe(before - SMALL_STAGE_COST_CENTS);
    expect(theSmallStage(sim)).toBeUndefined();
    expect(goingUp(sim)).toBeDefined();
    expect(whereTheBuildStands(sim)).toMatch(/opens in 78 weeks/);
    expect(sim.universe.transactions.some((t) => t.memo === BUILD_MEMO)).toBe(true);

    // A week short of the date, still nothing.
    sim.advanceTo(sim.now + (A_SMALL_STAGE.weeksToBuild - 1) * MS_WEEK);
    expect(theSmallStage(sim)).toBeUndefined();
    sim.advanceTo(sim.now + 2 * MS_WEEK);
    const room = theSmallStage(sim);
    expect(room).toBeDefined();
    expect(room!.floorSqm).toBe(A_SMALL_STAGE.floorSqm);
    expect(room!.weekRateCents).toBe(A_SMALL_STAGE.weekRateCents);
    expect(goingUp(sim)).toBeUndefined();
    expect(stagesOn(sim)).toHaveLength(5);
    // Last, because `stagesOn` sorts by when it went up, and every reader of
    // the lot finds it without a special case for it.
    expect(stagesOn(sim)[4]!.name).toBe(A_SMALL_STAGE.name);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('will not build the same room twice, nor while it is going up', () => {
    const sim = quickSave({}, 'twice');
    expect(buildAStage(sim).ok).toBe(true);
    expect(whyNotBuild(sim)).toBe('going-up');
    const again = buildAStage(sim);
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/already going up/);
    sim.advanceTo(sim.now + (A_SMALL_STAGE.weeksToBuild + 1) * MS_WEEK);
    expect(whyNotBuild(sim)).toBe('already');
    expect(buildAStage(sim).ok).toBe(false);
    expect(stagesOn(sim)).toHaveLength(5);
  });

  it('refuses a room the family will not carry, and the refusal moves with the family', () => {
    // Not the cash in the account. What is behind the company is the cash plus
    // what the family will still put in, which is the same figure the greenlight
    // asks about — so a room and a picture spend out of one pool.
    const sim = quickSave({}, 'carry');
    expect(behindTheCompany(sim)).toBeGreaterThan(SMALL_STAGE_COST_CENTS);
    expect(whyNotBuild(sim)).toBeUndefined();

    // Eleven years of covering an empty lot and the patience is gone.
    const late = quickSave({}, 'carry');
    late.advanceTo(late.now + 11 * 365 * MS_DAY);
    expect(stillToCarry(late)).toBeLessThan(SMALL_STAGE_COST_CENTS);
    expect(whyNotBuild(late)).toBe('cannot-carry');
    const said = buildAStage(late);
    expect(said.ok).toBe(false);
    expect(said.error).toMatch(/won’t carry it/);
    // And it says both figures, because a refusal nobody can check is a wall.
    expect(said.error).toMatch(/against/);
    expect(goingUp(late)).toBeUndefined();
    expect(late.universe.transactions.some((t) => t.memo === BUILD_MEMO)).toBe(false);
  });

  it('shuts the door and opens it again, because the family is a live figure', () => {
    // The one refusal that changes its answer, and it is not a ratchet. What is
    // behind the company is measured against a year of the group's profit, so a
    // year America stays shut brings every rung down and a year it reopens puts
    // them back — and a room the family would not carry in one spring is a room
    // it will carry in the next. A door that only ever shut would be a timer.
    // On a seed where it happens, and it is worth saying that it got rarer. The
    // company reclaims the tax on what it buys now, which takes a few points
    // off the drain and smooths the early dips out of the figure — so across
    // twenty years and ten seeds the door shuts and reopens in one of them
    // rather than several. What that is not is a ratchet: the refusal is still
    // a live reading of what a year of the group's profit is worth, and a
    // better year still puts the rungs back. One seed proving it is enough to
    // catch the day somebody makes the figure only ever fall.
    const sim = quickSave({}, 's3');
    const said: (string | undefined)[] = [];
    for (let year = 0; year <= 12; year += 1) {
      said.push(whyNotBuild(sim));
      sim.advanceTo(sim.now + 365 * MS_DAY);
    }
    expect(said.includes('cannot-carry'), said.join(',')).toBe(true);
    const shut = said.indexOf('cannot-carry');
    expect(said.slice(shut).includes(undefined), said.join(',')).toBe(true);
  });

  it('charges the family for the room, not the balance sheet', () => {
    const sim = quickSave({}, 'who-pays');
    const before = paidInSoFar(sim);
    buildAStage(sim);
    sim.advanceTo(sim.now + 40 * MS_DAY);
    // The money did not come from nowhere. It came from the people who have
    // been covering this lot since the first month, and it moves them up the
    // ladder that ends in the money coming with a condition on it.
    expect(paidInSoFar(sim) - before).toBeGreaterThanOrEqual(SMALL_STAGE_COST_CENTS);
    expect(standingWith(sim).share).toBeGreaterThan(0.1);
  });

  it('costs more to keep five rooms dark than four', () => {
    const sim = quickSave({}, 'darker');
    const four = monthlyOverhead(sim);
    expect(floorStanding(sim)).toBe(LOT_FLOOR_SQM);
    buildAStage(sim);
    sim.advanceTo(sim.now + (A_SMALL_STAGE.weeksToBuild + 1) * MS_WEEK);
    const five = monthlyOverhead(sim);
    expect(floorStanding(sim)).toBe(LOT_FLOOR_SQM + A_SMALL_STAGE.floorSqm);
    expect(five).toBeGreaterThan(four);
    // And only the lines that are a function of what stands there moved. A gate
    // is a gate however many rooms are behind it, and what the lot spends on
    // being known is a decision rather than a consequence.
    const grew = OVERHEAD.filter((one) => one.withTheFloor)
      .reduce((n, one) => n + one.monthlyCents, 0);
    expect(five - four).toBe(Math.round(grew * (A_SMALL_STAGE.floorSqm / LOT_FLOOR_SQM)));
    expect(OVERHEAD.find((one) => one.id === 'crew')!.withTheFloor).toBe(false);
    expect(OVERHEAD.find((one) => one.id === 'selling')!.withTheFloor).toBe(false);
  });

  it('houses the short work the lot could not house, and does not pay for itself', () => {
    const ten = (build: boolean): { kinds: Set<string>; took: number; out: number } => {
      const sim = quickSave({}, 'short-work');
      if (build) buildAStage(sim);
      const from = sim.now;
      sim.advanceTo(sim.now + 10 * 365 * MS_DAY);
      const kinds = new Set(Object.values(sim.universe.bookings)
        .filter((one) => one.kind === 'shooting')
        .map((one) => one.holder.split(', ').pop()!));
      const money = utilisation(sim, from, sim.now);
      return { kinds, took: money.earnsCents, out: build ? SMALL_STAGE_COST_CENTS : 0 };
    };
    const without = ten(false);
    const with5 = ten(true);
    // The documentaries are the thing only the room can deliver: two weeks at
    // five hundred meters cannot carry two thousand meters of stage at any
    // hold, so without the room that kind of production never happens here.
    expect(without.kinds.has('a documentary')).toBe(false);
    expect(with5.kinds.has('a documentary')).toBe(true);
    expect(with5.kinds.size).toBeGreaterThan(without.kinds.size);
    // And it does not pay for itself, which is the honest half. Ten years of
    // letting it does not come near what it cost to put up.
    expect(with5.took - without.took).toBeLessThan(SMALL_STAGE_COST_CENTS);
  });
});

describe('the family is a financier and not a benefactor', () => {
  /**
   * `familyCovers` put money in when the company went under and nothing ever
   * took it out, so `paidInSoFar` only ever rose and `stillToCarry` — the
   * patience left — only ever fell. The fifth one-way ratchet this build has
   * found, and the only one on the money.
   */

  it('takes its money back out of a surplus, and not out of committed work', () => {
    const sim = quickSave({}, 'family-back');
    const company = parentCompany(sim.universe)!;
    const account = Object.values(sim.universe.accounts)
      .find((one) => one.ownerId === company.id && one.kind === 'company_cash')!;

    // Put the company under, so the family covers it.
    sim.expense(account.id, account.balance + 400_000_00, 'Test: go under', 'business');
    chargeTheMonth(sim, account.id, 1);
    const owed = paidInSoFar(sim);
    expect(owed, 'the family should have covered the shortfall').toBeGreaterThan(0);

    // Now hand the company a real surplus and run the month again.
    sim.income(account.id, 5_000_000_00, 'Test: a good year', 'business');
    const before = account.balance;
    familyTakesItBack(sim, account.id);

    expect(paidInSoFar(sim), 'the family should be repaid out of the surplus').toBeLessThan(owed);
    expect(account.balance, 'and the money should actually leave').toBeLessThan(before);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('gives the patience back as it is repaid, so the trap has a way out', () => {
    const sim = quickSave({}, 'family-patience');
    const company = parentCompany(sim.universe)!;
    const account = Object.values(sim.universe.accounts)
      .find((one) => one.ownerId === company.id && one.kind === 'company_cash')!;

    sim.expense(account.id, account.balance + 400_000_00, 'Test: go under', 'business');
    chargeTheMonth(sim, account.id, 1);
    const tight = stillToCarry(sim);

    sim.income(account.id, 5_000_000_00, 'Test: a good year', 'business');
    familyTakesItBack(sim, account.id);

    expect(stillToCarry(sim), 'repaying should restore what the family will still put in')
      .toBeGreaterThanOrEqual(tight);
  });

  it('asks for nothing back while the money is spoken for', () => {
    // The float is what is owed on work in progress plus the greenlight floor,
    // both read from the build rather than picked, so a company mid-picture
    // keeps every penny that picture still costs.
    const sim = quickSave({}, 'family-committed');
    const company = parentCompany(sim.universe)!;
    const account = Object.values(sim.universe.accounts)
      .find((one) => one.ownerId === company.id && one.kind === 'company_cash')!;
    sim.expense(account.id, account.balance + 400_000_00, 'Test: go under', 'business');
    chargeTheMonth(sim, account.id, 1);
    const owed = paidInSoFar(sim);
    // No surplus: nothing goes back.
    expect(familyTakesItBack(sim, account.id)).toBe(0);
    expect(paidInSoFar(sim)).toBe(owed);
  });
});
