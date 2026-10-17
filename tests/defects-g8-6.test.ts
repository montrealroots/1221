/**
 * Five Papers defects found by the triage of 2026-10-12, each held here against the engine and the screen that shows it
 * (from 2026-10-12): SNAP's At Most showed next fiscal year's maximum all year; a specialist booked again after it was
 * called off was told "booked specialist, booked"; the care that missed for being out of town compared the town with
 * itself; an uninsured hospital bill over the charity's limit read Charity Taken Off though it took nothing off; and the
 * charity's, the appeal's and the medical debt's figures on Papers were typed in, not read from their rules.
 *
 * The screens are rendered to markup (react-dom/server) over real saves, as tests/defects-g8-5.test.ts renders them:
 * `useGame` stands in for the provider, `run` is the save's own `execute` and `toast` keeps what it's told. A Gated
 * button keeps its props too, so a test can press it as the player would. PLAYER JOURNEYS play through commands;
 * FIXTURES set a state by hand to reach one rule, and say so.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned } from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { newLifeConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { CHARITY, MEDICAL_DEBT, POVERTY_LINE, byYear } from '@/engine/content/safetynet';
import { CITIES } from '@/engine/content/geography';
import { DENIALS, aidRefusal, billCare, careFor, coverOn, healthMonth, healthOf, incomeRatio, type MedicalBill } from '@/engine/systems/health';
import { earningsOf } from '@/engine/systems/earnings';
import { inSaveMoney } from '@/engine/systems/banking';
import { overdraftRoom } from '@/engine/systems/lending';
import { SNAP, snapYearOn } from '@/engine/systems/assistance';
import { SPECIALIST, appointmentsOf, mayRefer } from '@/engine/systems/appointments';
import { THERAPISTS } from '@/engine/systems/therapy';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tabs: {} as Record<string, string>,
  toasts: [] as string[],
  buttons: [] as { feature: string; title?: string; onClick?: (e: never) => void; children?: unknown }[],
}));

// The screens' kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

// A Gated button drawn as it is, its props kept so a test can press it.
vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  return {
    ...real,
    Gated: (props: Parameters<typeof real.Gated>[0]) => {
      h.buttons.push({ feature: props.feature, title: props.title, onClick: props.onClick as never, children: props.children });
      return real.Gated(props);
    },
  };
});

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** A life in New Haven with no school, as tests/safetynet.test.ts makes one: it starts on 5 January 2026, or the day given. */
const newHaven = (seed: string, wealth: StartingWealth = 'comfortable', start?: { startYear: number; startMonth: number; startDay: number }) =>
  quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth, ...start }, seed);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** Played by somebody who looks after themselves, as tests/leave.test.ts plays one. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
/** FIXTURE: every account they could pay from emptied, and the current account overdrawn to its limit, as months of no income leave them. */
const broke = (sim: Simulation) => {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal) continue;
    if (a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings' || a.kind === 'cash')) a.balance = 0;
  }
  const current = sim.universe.accounts[sim.player.primaryAccountId!]!;
  current.balance = -overdraftRoom(sim, sim.player, current);
};
/** FIXTURE: the last twelve months' income set to so many times the year's poverty line, as one month's pay. */
const earning = (sim: Simulation, times: number) => {
  const months = earningsOf(sim.player).months;
  for (const k of Object.keys(months)) delete months[k];
  months['2025-12'] = inSaveMoney(sim, Math.round(byYear(POVERTY_LINE, 2026) * times), 'USD');
};
/** A rule's figure changed for the length of one check, and put back: change an input, and the words must follow. */
function swapped<T extends object>(rule: T, change: Partial<T>, check: () => void): void {
  const kept = { ...rule };
  Object.assign(rule, change);
  try { check(); } finally { Object.assign(rule, kept); }
}

/** A screen as the player has it: its markup, and its text with the tags taken out. */
function drawn(sim: Simulation, screen: FunctionComponent, tabs: Record<string, string> = {}): { html: string; text: string } {
  h.sim = sim;
  h.tabs = tabs;
  h.buttons = [];
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, text: html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/\s+/g, ' ') };
}
const healthTab = { 'tab:/workspace/papers': 'health' };
const benefitsTab = { 'tab:/workspace/papers': 'benefits' };
const press = (feature: string, words?: string) => {
  const b = h.buttons.find((x) => x.feature === feature && (words === undefined || String(x.children as ReactNode) === words));
  expect(b, `a ${feature} button`).toBeDefined();
  h.toasts = [];
  b!.onClick!(undefined as never);
  return h.toasts;
};

describe('SNAP’s At Most is the maximum of the fiscal year in force, in the save’s money', () => {
  it('the fiscal year is the one in force on the day: $298 to 30 September 2026, $306 from 1 October', () => {
    expect(snapYearOn(at(2026, 9, 30, 12)).max).toBe(298);
    expect(snapYearOn(at(2026, 10, 1, 12)).max).toBe(306);
    expect(snapYearOn(at(2025, 1, 1)).max).toBe(SNAP.fy[0]!.max);
  });

  it('a student’s first weeks, from 24 August 2026, show the $298 SNAP pays then, not next year’s $306', () => {
    const sim = student('g86-snap-first-weeks');
    expect(sim.now).toBeLessThan(at(2026, 10, 1, 0));
    const cur = saveCurrency(sim.universe);
    const { text } = drawn(sim, PapersWorkspace, benefitsTab);
    expect(text).toContain(`At Most ${formatMoney(inSaveMoney(sim, 298_00, 'USD'), cur)} A month, less 30% of net income`);
    expect(text).not.toMatch(/\$306/);
  });

  it('a life that starts in October shows fiscal 2027’s $306', () => {
    const sim = newHaven('g86-snap-october', 'comfortable', { startYear: 2026, startMonth: 10, startDay: 5 });
    const { text } = drawn(sim, PapersWorkspace, benefitsTab);
    expect(text).toContain(`At Most ${formatMoney(inSaveMoney(sim, 306_00, 'USD'), saveCurrency(sim.universe))} A month`);
  });
});

describe('a specialist booked again after it was called off is told so in plain words', () => {
  it('PLAYER JOURNEY: referred, called off and booked again, each notice reads as a sentence', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'g86-specialist');
    const zone = CITIES.require(sim.player.currentLocationId).timeZone;
    // The referral, as a kept visit draws one (odds 1 stands in for the draw).
    const a = mayRefer(sim, sim.player, { id: 'v1', at: sim.now, what: 'A checkup' }, 1)!;
    expect(titled(sim, 'A Referral').at(-1)!.body).toBe(`Referred after a checkup: a specialist, booked for ${formatDate(a.at, zone)}, the wait where you live.`);
    sim.must({ kind: 'health.cancel_appointment', payload: { appointmentId: a.id } });
    expect(healthOf(sim.player).owedVisit).toBe(SPECIALIST);
    const again = sim.must<{ at: number }>({ kind: 'health.book', payload: {} });
    const body = titled(sim, 'A Referral').at(-1)!.body;
    expect(body).toBe(`A specialist, referred: booked for ${formatDate(again.at, zone)}, the wait where you live.`);
    expect(body).not.toMatch(/booked specialist/);
    expect(appointmentsOf(sim.player)).toHaveLength(1);
  });
});

describe('care for their own health no longer asks what town they’re in', () => {
  const SRC = fileURLToPath(new URL('../src/', import.meta.url));
  const source = (...path: string[]) => readFileSync(join(SRC, ...path), 'utf8');

  it('presentForCare takes the person and the moment, and the doctor’s practice is looked up for the person as they are', () => {
    const health = source('engine', 'systems', 'health.ts');
    expect(health).toMatch(/export function presentForCare\(person: Person, when: Instant\): boolean/);
    const appointments = source('engine', 'systems', 'appointments.ts');
    expect(appointments).not.toMatch(/currentLocationId: homeCity/);
    expect(appointments).toMatch(/presentForCare\(person, item\.at\)/);
    expect(source('engine', 'systems', 'therapy.ts')).toMatch(/presentForCare\(person, item\.at\)/);
  });

  it('nothing in the game moves a person once a life is made, which is why a town check could never fail', () => {
    const files: string[] = [];
    const walk = (dir: string) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(f)) files.push(p); } };
    walk(SRC);
    const moves = files.filter((f) => /\.currentLocationId\s*=(?!=)/.test(readFileSync(f, 'utf8')));
    expect(moves).toEqual([]);
  });

  it('FIXTURE: a session is held though the person reads as elsewhere, a state nothing in the game reaches', () => {
    const sim = newHaven('g86-therapy-town', 'wealthy');
    const practice = THERAPISTS.find((t) => t.cityId === 'us-ct-newhaven' && !t.yale)!;
    (healthOf(sim.player).chronic ??= {}).depression = { treated: true };
    const { first } = sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: practice.name } });
    // FIXTURE: the person's place changed by hand; until 2026-10-12 this missed the session, every week.
    sim.player.currentLocationId = 'us-ny-newyork';
    tended(sim, first + 2 * MS_HOUR);
    expect(sim.player.therapy?.done).toBe(1);
    expect(sim.universe.scheduled.some((i) => i.kind === 'health.therapy_session' && i.status === 'missed')).toBe(false);
  });
});

describe('an uninsured hospital bill says what the charity did with it', () => {
  /** An uninsured New Haven life's emergency, billed as the week's draw bills one (FIXTURE: careFor called for it). */
  const emergency = (seed: string, times: number) => {
    const sim = newHaven(seed, 'wealthy');
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    earning(sim, times);
    const bill = careFor(sim, sim.player, { care: 'emergency', what: 'A broken wrist' }, sim.now)!;
    expect(bill).toBeDefined();
    return { sim, bill };
  };

  it('over the charity’s limit, it took nothing off: Over The Limit, not Charity Taken Off', () => {
    const { sim, bill } = emergency('g86-charity-over', CHARITY.connecticut.discountTo + 1.5);
    expect(incomeRatio(sim.player, sim.now, saveCurrency(sim.universe))).toBeGreaterThan(CHARITY.connecticut.discountTo);
    expect(bill.aid).toBe('refused');
    const { text } = drawn(sim, PapersWorkspace, healthTab);
    expect(text).toContain('Over The Limit');
    expect(text).not.toContain('Charity Taken Off');
    expect(aidRefusal(bill, sim.now)).toBe('It’s been put to the hospital’s charity.');
    expect(sim.execute({ kind: 'health.apply_aid', payload: { billId: bill.id } }).error).toBe('It’s been put to the hospital’s charity.');
  });

  it('within it, something came off: Charity Taken Off, and the application is refused for that', () => {
    const { sim, bill } = emergency('g86-charity-under', (CHARITY.connecticut.freeTo + CHARITY.connecticut.discountTo) / 2);
    expect(bill.aid).toBe('screened');
    const { text } = drawn(sim, PapersWorkspace, healthTab);
    expect(text).toContain('Charity Taken Off');
    expect(aidRefusal(bill, sim.now)).toBe('The hospital’s charity is off it already.');
  });
});

describe('Papers reads the charity’s, the appeal’s and the medical debt’s figures from their rules', () => {
  /** FIXTURE: a marketplace plan held since the life began, and a Connecticut hospital's bill of its own, as safetynet.test.ts puts one. */
  const insuredWith = (seed: string, bill: Partial<MedicalBill>, times = 4) => {
    const sim = newHaven(seed, 'wealthy');
    healthOf(sim.player).marketplace = { from: sim.now - MS_DAY, state: 'ct' };
    earning(sim, times);
    const b: MedicalBill = { id: 'mx1', at: sim.now, what: 'A stay in hospital', amount: 1_000_00, dueAt: sim.now + 30 * MS_DAY, hospital: true, cityId: 'us-ct-newhaven', ...bill };
    healthOf(sim.player).bills.push(b);
    return { sim, bill: b };
  };

  it('the charity’s discount is its rule’s share, and a changed rule changes the word', () => {
    const { sim } = insuredWith('g86-discount-word', { aid: 'discount' });
    expect(drawn(sim, PapersWorkspace, healthTab).text).toContain(`${Math.round(CHARITY.connecticut.discount * 100)}% Off`);
    swapped(CHARITY.connecticut as { discount: number }, { discount: 0.5 }, () => {
      const { text } = drawn(sim, PapersWorkspace, healthTab);
      expect(text).toContain('50% Off');
      expect(text).not.toContain('67% Off');
    });
  });

  it('PLAYER JOURNEY: Apply For Assistance over the limit is told the rule’s limit, whatever it is', () => {
    const { sim, bill } = insuredWith('g86-aid-toast', {}, 7);
    drawn(sim, PapersWorkspace, healthTab);
    expect(press('health.apply_aid')).toEqual([`Your income is over the hospital policy’s limit of ${Math.round(CHARITY.connecticut.discountTo * 100)}% of the poverty line.`]);
    expect(bill.aid).toBe('refused');
    // The rule's limit raised to 650% and the bill put back: still over it at seven times the line, and told so.
    delete bill.aid;
    swapped(CHARITY.connecticut as { discountTo: number }, { discountTo: 6.5 }, () => {
      drawn(sim, PapersWorkspace, healthTab);
      expect(press('health.apply_aid')).toEqual(['Your income is over the hospital policy’s limit of 650% of the poverty line.']);
    });
  });

  it('PLAYER JOURNEY: Appeal It says the appeal rule’s days and share, and its toast the days', () => {
    const { sim, bill } = insuredWith('g86-appeal', { denied: { share: 200_00 } });
    drawn(sim, PapersWorkspace, healthTab);
    const appeal = h.buttons.find((b) => b.feature === 'health.appeal')!;
    expect(appeal.title).toBe(`It’s decided in ${DENIALS.decideDays} days, and insurers uphold ${Math.round(DENIALS.upheld * 100)}% of appeals.`);
    swapped(DENIALS as { decideDays: number; upheld: number }, { decideDays: 45, upheld: 0.4 }, () => {
      drawn(sim, PapersWorkspace, healthTab);
      expect(h.buttons.find((b) => b.feature === 'health.appeal')!.title).toBe('It’s decided in 45 days, and insurers uphold 40% of appeals.');
      expect(press('health.appeal')).toEqual(['Appealed: decided in 45 days.']);
    });
    expect(bill.denied!.appealedAt).toBe(sim.now);
  });

  it('PLAYER JOURNEY: a medical debt of exactly the reporting figure is reported, and the notice says “or more”', () => {
    const sim = student('g86-debt-notice');
    broke(sim);
    const cur = saveCurrency(sim.universe);
    const bill = billCare(sim, sim.player, 'A care bill', inSaveMoney(sim, MEDICAL_DEBT.reportAt, 'USD'), sim.now);
    sim.advanceTo(bill.dueAt + MS_DAY);
    expect(bill.inDebt).toBe(true);
    // FIXTURE: the debt a year old, as a year unpaid leaves it.
    healthOf(sim.player).debtSince = sim.now - 366 * MS_DAY;
    healthMonth(sim, sim.player, sim.now);
    const notice = titled(sim, 'A Medical Debt Is On Your Record');
    expect(notice).toHaveLength(1);
    expect(notice[0]!.body).toBe(`Unpaid a year and ${formatMoney(inSaveMoney(sim, MEDICAL_DEBT.reportAt, 'USD'), cur)} or more, it’s reported now.`);
    expect(notice[0]!.body).not.toMatch(/over \$500/);
  }, 120_000);
});
