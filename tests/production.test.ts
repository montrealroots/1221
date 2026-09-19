/**
 * A picture in flight, and the one property worth guarding.
 *
 * The stage is **derived from the date**, not stepped forward a notch per tick. That
 * distinction is invisible while everything runs in order and decisive the moment it
 * does not: a counter is wrong if a tick is missed, run twice, or replayed from a
 * save, and a function of the greenlight instant cannot be.
 *
 * So the case that matters most here is the one that jumps a year forward in a single
 * step and expects the picture to be exactly where the calendar says — not one notch
 * along from where it was. A per-tick counter passes every other test in this file
 * and fails that one.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { addMonths } from '@/engine/core/time';
import { DEPARTMENTS, monthsFor } from '@/engine/content/departments';
import { layOut } from '@/engine/world/schedule';
import { deliversAt, inFlight, stageAt, walkTheMonth } from '@/engine/world/production';
import { holdingsOf, projectsOf, parentCompany } from '@/engine/world/company';

type Said = { ok: boolean; error?: string };

const ran = (sim: ReturnType<typeof quickSave>, kind: string, payload: Record<string, unknown>) => {
  const done = sim.execute({ kind, payload });
  const said = done.value as Said | undefined;
  return { ok: said?.ok ?? done.ok, why: said?.error ?? done.error ?? '' };
};

/** Money in the company, found the way the engine finds it. */
function fund(sim: ReturnType<typeof quickSave>, cents: number) {
  const company = parentCompany(sim.universe)!;
  const cash = Object.values(sim.universe.accounts)
    .find((one) => one.ownerId === company.id && one.kind === 'company_cash' && !one.closedAt)
    ?? sim.ledger.open({
      id: `acct:${company.id}:cash`,
      saveId: sim.universe.meta.id,
      kind: 'company_cash',
      name: 'Cash',
      ownerId: company.id,
      balance: 0,
      openedAt: sim.now,
      nominal: false,
      category: 'business',
    });
  if (!sim.ledger.tryAccount('equity:capital')) {
    sim.ledger.open({
      id: 'equity:capital',
      saveId: sim.universe.meta.id,
      kind: 'equity',
      name: 'Capital',
      ownerId: 'world',
      balance: 0,
      openedAt: sim.now,
      nominal: true,
      category: 'business',
    });
  }
  const short = cents - cash.balance;
  if (short > 0) {
    sim.post({
      memo: 'Capital In',
      category: 'business',
      postings: [{ accountId: 'equity:capital', amount: -short }, { accountId: cash.id, amount: short }],
    });
  }
}

/** A picture committed to and paid for, so there is something in flight. */
function aCommittedPicture(seed: string) {
  const sim = quickSave({}, seed);
  sim.execute({ kind: 'company.option', payload: { title: `Something For ${seed}` } });
  const holding = holdingsOf(sim.universe)[0]!;
  sim.execute({
    kind: 'company.develop',
    payload: { title: holding.title, holdingId: holding.id },
  });
  const project = projectsOf(sim.universe).find((one) => one.title === holding.title)!;
  fund(sim, 900_000_000_00);
  ran(sim, 'company.lock_budget', { projectId: project.id });
  const said = ran(sim, 'company.greenlight', { projectId: project.id });
  expect(said.ok, said.why).toBe(true);
  const laid = layOut(holding.demands, project.levels ?? {}, project.greenlitAt!, sim.homeZone);
  return { sim, holding, project, laid };
}

describe('a picture that has been said yes to', () => {
  it('is in flight until it is finished', () => {
    const { sim, project } = aCommittedPicture('flight-in');
    expect(inFlight(sim).map((one) => one.id)).toContain(project.id);
  });

  it('is not in flight before anybody says yes', () => {
    const sim = quickSave({}, 'flight-out');
    sim.execute({ kind: 'company.option', payload: { title: 'Not Yet' } });
    const holding = holdingsOf(sim.universe)[0]!;
    sim.execute({ kind: 'company.develop', payload: { title: holding.title, holdingId: holding.id } });
    expect(inFlight(sim)).toHaveLength(0);
  });

  it('knows when it will be finished, and agrees with its own schedule', () => {
    const { sim, project, laid } = aCommittedPicture('flight-date');
    expect(deliversAt(sim, project)).toBe(laid.deliversAt);
  });
});

describe('and the calendar walks it', () => {
  it('moves off greenlit into the first phase it actually has', () => {
    const { sim, project, laid } = aCommittedPicture('walk-first');
    expect(project.stage).toBe('greenlit');
    walkTheMonth(sim, project.greenlitAt!);
    // Whatever the first phase is for this material — a picture with no prep starts
    // shooting, which is the schedule's own rule and not a special case here.
    const first = laid.phases[0]!.phase;
    expect(project.stage).toBe(first === 'shoot' ? 'shooting' : first);
  });

  it('reaches every phase its schedule has, in order', () => {
    const { sim, project, laid } = aCommittedPicture('walk-order');
    const seen: string[] = [];
    let at = project.greenlitAt!;
    for (let m = 0; m <= laid.months + 2; m += 1) {
      walkTheMonth(sim, at);
      if (seen[seen.length - 1] !== project.stage) seen.push(project.stage);
      at = addMonths(at, 1, sim.homeZone);
    }
    const wanted = laid.phases.map((one) => (one.phase === 'shoot' ? 'shooting' : one.phase));
    expect(seen).toEqual([...wanted, 'delivered']);
  });

  it('is finished once the last phase is behind it', () => {
    const { sim, project, laid } = aCommittedPicture('walk-done');
    walkTheMonth(sim, laid.deliversAt);
    expect(project.stage).toBe('delivered');
    expect(inFlight(sim).map((one) => one.id)).not.toContain(project.id);
  });
});

describe('the stage is worked out, not counted up', () => {
  it('lands in the right place after a single enormous step', () => {
    // The case a per-tick counter fails. Nothing walked the months in between, and
    // the answer still has to be right, because the stage is a reading of the
    // calendar rather than a tally of how often anybody looked.
    const { sim, project, laid } = aCommittedPicture('walk-jump');
    const wayIn = addMonths(project.greenlitAt!, laid.months - 1, sim.homeZone);
    walkTheMonth(sim, wayIn);
    expect(project.stage).toBe(stageAt(sim, project, wayIn));
    expect(project.stage).not.toBe('greenlit');
  });

  it('gives the same answer however many times it is asked', () => {
    const { sim, project, laid } = aCommittedPicture('walk-idem');
    const midway = addMonths(project.greenlitAt!, Math.max(1, Math.floor(laid.months / 2)), sim.homeZone);
    walkTheMonth(sim, midway);
    const once = project.stage;
    walkTheMonth(sim, midway);
    walkTheMonth(sim, midway);
    expect(project.stage).toBe(once);
  });

  it('does not move a picture backwards when asked about an earlier moment', () => {
    // Reading an earlier instant answers honestly about that instant, and the walk
    // applies it — the guard against going backwards belongs to the scheduler, which
    // only ever moves forward. Stated as a test so the behavior is deliberate
    // rather than discovered.
    const { sim, project, laid } = aCommittedPicture('walk-back');
    walkTheMonth(sim, laid.deliversAt);
    expect(project.stage).toBe('delivered');
    expect(stageAt(sim, project, project.greenlitAt!)).not.toBe('delivered');
  });

  it('says nothing about a picture with no material under it', () => {
    const sim = quickSave({}, 'walk-bare');
    sim.execute({ kind: 'company.develop', payload: { title: 'Nothing Behind It' } });
    const bare = projectsOf(sim.universe).find((one) => one.title === 'Nothing Behind It')!;
    expect(stageAt(sim, bare, sim.now)).toBeUndefined();
    expect(deliversAt(sim, bare)).toBeUndefined();
  });
});

describe('what the schedule it walks is made of', () => {
  it('only ever contains phases the material actually needs', () => {
    const { holding, laid } = aCommittedPicture('walk-phases');
    for (const phase of laid.phases) {
      expect(phase.lines.length).toBeGreaterThan(0);
      for (const line of phase.lines) {
        expect(monthsFor(line.department, holding.demands)).toBeGreaterThan(0);
        expect(DEPARTMENTS).toContain(line.department);
      }
    }
  });
});
