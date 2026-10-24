/**
 * Indiana with Marion County, the District, Oklahoma, New York City's boroughs, Philadelphia, Columbus, Portland and
 * Denver (remaining-gaps pass, 2026-10-11; research-state-tax-in-dc-ok.json, research-local-income-taxes.json). Every
 * expected amount is worked by hand from the published rates in the comment beside it, not read back from the tables.
 * FIXTURES: wages put on a life by hand (`recordWages`), and say so.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { recordWages } from '@/engine/systems/earnings';
import { figuresFor, returnsOf } from '@/engine/systems/taxreturn';
import { paycheckWithholding } from '@/engine/systems/withholding';
import { statePartsOn, statePlanRefusal } from '@/engine/systems/statetax';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 9) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, wealth: 'wealthy' }, seed);
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
const empty = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] }); };
const near = (a: number, b: number, by = 1) => expect(Math.abs(a - b), `${a} against ${b}`).toBeLessThanOrEqual(by);

/** FIXTURE: a year's wages of $40,000 in a city, nothing withheld, and its figures. */
function year(city: string, gross = 40_000_00, where?: string) {
  const sim = life(city, `places-${city}-${where ?? ''}`);
  recordWages(sim.player, at(2026, 5, 1), NY, { gross, ...(where ? { where } : {}) });
  return { sim, f: figuresFor(sim.player, 2026) };
}

describe('the tax where each life lives', () => {
  it('Indiana: 2.95% for 2026 on $40,000 less the $1,000 exemption, $1,150.50; Marion County 2.02% on the same, $787.80; both owed to Indiana’s DOR', () => {
    const { f } = year('us-in-indianapolis');
    expect(f.states).toEqual([{ state: 'us-in', tax: 115050, credit: 0 }]);
    expect(f.local).toBe(78780);
    expect(f.owedTo!.states).toEqual({ 'us-in': 193830 });
  });

  it('the District: 4% to $10,000 and 6% to $40,000 on $25,000 after the $15,000 deduction, $1,300; nothing on a nonresident’s wages', () => {
    expect(year('us-dc-washington').f.owedTo!.states).toEqual({ 'us-dc': 130000 });
    // Living in New York City, working in the District: the District can't tax it.
    const commute = year('us-ny-manhattan', 40_000_00, 'us-dc-washington').f;
    expect(commute.owedTo!.states['us-dc']).toBeUndefined();
  });

  it('Oklahoma: 2026’s 0%, 2.5%, 3.5% and 4.5% on $32,650 after $7,350, $1,254.50', () => {
    // 0 to $3,750; 2.5% of $1,150 = $28.75; 3.5% of $2,300 = $80.50; 4.5% of $25,450 = $1,145.25.
    expect(year('us-ok-oklahomacity').f.owedTo!.states).toEqual({ 'us-ok': 125450 });
  });

  it('New York City’s tax in Brooklyn as in Manhattan: on $32,000, $369.36 + $489.06 + $267.33 = $1,125.75', () => {
    expect(year('us-ny-brooklyn').f.local).toBe(112575);
    expect(year('us-ny-manhattan').f.local).toBe(112575);
    // Hudson is outside the city.
    expect(year('us-ny-hudson').f.local).toBe(0);
  });

  it('Philadelphia’s Wage Tax is the city’s own, apart from Pennsylvania’s: 2026’s mean of 3.74% and 3.735%, $1,495', () => {
    const { f } = year('us-pa-philadelphia');
    expect(f.owedTo!.states).toEqual({ 'us-pa': 122800, 'us-pa-philadelphia': 149500 });
  });

  it('Columbus’s 2.5%, $1,000, its own; a Columbus resident working in Indianapolis owes Marion County’s 2.02% and no Indiana tax, and Columbus credits it', () => {
    expect(year('us-oh-columbus').f.owedTo!.states['us-oh-columbus']).toBe(100000);
    const { f } = year('us-oh-columbus', 40_000_00, 'us-in-indianapolis');
    // Indiana's reciprocity: no state tax for an Ohio resident; Marion County's on the wages, $808; Columbus's $1,000 less
    // its credit to 2.5% for the work city's tax, $808: $192.
    expect(f.owedTo!.states['us-in']).toBe(80800);
    expect(f.owedTo!.states['us-oh-columbus']).toBe(19200);
  });

  it('Portland’s regional taxes start over $125,000: none on $40,000; on $200,000 in 2026, 1.5% from $125,000 and 1% more from $128,000, $1,845', () => {
    expect(year('us-or-portland').f.owedTo!.states['us-or-portland']).toBeUndefined();
    // 1.5% of $75,000 = $1,125; 1% of $72,000 = $720.
    expect(year('us-or-portland', 200_000_00).f.owedTo!.states['us-or-portland']).toBe(184500);
  });

  it('Denver’s occupational privilege tax: $5.75 a month its Denver pay reaches $500, withheld, shown, not owed', () => {
    const sim = life('us-co-denver', 'places-denver');
    for (let m = 1; m <= 12; m += 1) recordWages(sim.player, at(2026, m, 15), NY, { gross: m <= 3 ? 400_00 : 1_000_00 });
    const f = figuresFor(sim.player, 2026);
    // Nine months of $1,000; three of $400 under the threshold.
    expect(f.denverOpt).toBe(9 * 575);
    expect(f.owedTo!.states['us-co-denver']).toBeUndefined();
  });
});

describe('withholding, by each authority’s own method, reconciled on the return', () => {
  it('Indiana’s WH-4 and the county’s: twelve paychecks withheld come within a dollar of the year’s tax', () => {
    const sim = life('us-in-indianapolis', 'wh-in');
    for (let m = 1; m <= 12; m += 1) {
      const by = paycheckWithholding('us-in-indianapolis', 'us-in-indianapolis', 3_333_33, 12, at(2026, m, 15));
      // (3,333.33 − 83.33) × (2.95% + 2.02%) = $161.53 a month.
      near(by['us-in']!, 16153);
      recordWages(sim.player, at(2026, m, 15), NY, { gross: 3_333_33, withheld: by['us-in']!, withheldBy: by });
    }
    const f = figuresFor(sim.player, 2026);
    near(f.owedTo!.states['us-in'] ?? 0, 0, 100);
  });

  it('PLAYER JOURNEY: Indiana withheld too much, filed, and its refund paid by Indiana’s DOR alone', () => {
    const sim = life('us-in-indianapolis', 'refund-in');
    // TEST SETUP: the bank emptied, so no interest joins the wages in Indiana's base.
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] });
    // $40,000 with $3,000 withheld for Indiana, against its $1,150.50 and Marion County’s $787.80: $1,061.70 back.
    recordWages(sim.player, at(2026, 6, 15), NY, { gross: 40_000_00, withheld: 3_000_00, withheldBy: { 'us-in': 3_000_00 } });
    while (sim.now < at(2027, 2, 1)) sim.advanceTo(Math.min(at(2027, 2, 1), sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true });
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    const sd = () => returnsOf(sim.player)['2026']!.stateDue!['us-in']!;
    expect(sd().refund).toBe(3_000_00 - 115050 - 78780);
    sim.advanceTo(sim.now + 90 * MS_DAY);
    expect(sd().refundedAt).toBeDefined();
    const paid = sim.universe.transactions.filter((t) => /Indiana/.test(t.memo) && /refund/i.test(t.memo));
    expect(paid.map((t) => t.postings.find((p) => p.accountId === sim.player.primaryAccountId)?.amount)).toEqual([3_000_00 - 115050 - 78780]);
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);

  it('the District’s D-4 and Oklahoma’s OW-2 tables, a month of $40,000 a year', () => {
    // DC: $40,000 − $4,150 = $35,850 → $400 + 6% of $25,850 = $1,951 a year, $162.58 a month.
    near(paycheckWithholding('us-dc-washington', 'us-dc-washington', 3_333_33, 12, at(2026, 3, 15))['us-dc']!, 16258);
    // OK: $40,000 − $1,000 = $39,000 → $109.25 + 4.5% of $25,450 = $1,254.50 a year, $104.54 a month.
    near(paycheckWithholding('us-ok-oklahomacity', 'us-ok-oklahomacity', 3_333_33, 12, at(2026, 3, 15))['us-ok']!, 10454);
  });

  it('Philadelphia’s rate on the day: 3.74% in June 2026, 3.735% in July; 3.43% for a nonresident working there', () => {
    expect(paycheckWithholding('us-pa-philadelphia', 'us-pa-philadelphia', 1_000_00, 12, at(2026, 6, 15))['us-pa-philadelphia']).toBe(3740);
    near(paycheckWithholding('us-pa-philadelphia', 'us-pa-philadelphia', 1_000_00, 12, at(2026, 7, 15))['us-pa-philadelphia']!, 3735);
    expect(paycheckWithholding('us-ny-manhattan', 'us-pa-philadelphia', 1_000_00, 12, at(2026, 6, 15))['us-pa-philadelphia']).toBe(3430);
  });
});

describe('collection by the new authorities', () => {
  it('PLAYER JOURNEY: Indiana’s proposed assessment, demand, and tax warrant with its 10% fee and its lien; paid, released', () => {
    const sim = life('us-in-indianapolis', 'coll-in');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 40_000_00 });
    play(sim, at(2027, 2, 1, 12));
    empty(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    const sd = () => returnsOf(sim.player)['2026']!.stateDue!['us-in']!;
    // The wages' $1,938.30, and what the bank's interest adds to Indiana's base.
    expect(sd().owed).toBe(returnsOf(sim.player)['2026']!.figures.owedTo!.states['us-in']);
    expect(sd().owed! - 193830).toBeLessThan(500);
    // Notices at 30, 60 and 20 days: the warrant 110 days after the due date, 15 April 2027, the return filed before it
    // (from 2026-10-15, `stateNextNotice`; until then 110 days after filing, played to 25 May).
    play(sim, at(2027, 8, 10));
    expect(sd().collection).toBe(3);
    expect(sd().lien).toMatchObject({ name: 'Tax Warrant', status: 'filed', trigger: 'collection', recordedAt: 'the circuit court clerk' });
    const notes = sim.universe.notifications.filter((n) => n.title === 'Indiana Issued A Tax Warrant');
    expect(notes).toHaveLength(1);
    // 10% of the tax, to the cent.
    expect(notes[0]!.body).toContain(`The tax warrant’s collection fee, 10% of the tax, $${(Math.round(sd().balance * 0.1) / 100).toFixed(2)}, is added`);
    // Paid in full from a family gift: released 30 days on (SLATE's days, said).
    sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount: 5_000_00 }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -5_000_00 }] });
    sim.must({ kind: 'tax.pay_state', payload: { state: 'us-in', year: 2026 } });
    expect(sd().lien!.status).toBe('paid');
    sim.advanceTo(sim.now + 31 * MS_DAY);
    expect(sd().lien!.status).toBe('released');
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.payload.state === 'us-in' && /tax\./.test(i.kind))).toBe(false);
    expect(sim.ledger.audit()).toEqual([]);
  }, 180_000);

  it('Indiana’s interest by year: 7% through 2026, 6% in 2027 (Departmental Notice #3)', () => {
    const sim = life('us-in-indianapolis', 'int-in');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 40_000_00 });
    const r = { year: 2025, due: at(2026, 4, 15), filedAt: at(2026, 4, 15), figures: figuresFor(sim.player, 2026) } as never as Parameters<typeof statePartsOn>[0] & { due: number };
    const sd = { state: 'us-in', balance: 100_000, filedAt: at(2026, 4, 15), owed: 100_000, parts: { tax: 100_000, penalty: 0, interest: 0 }, accruedAt: at(2026, 4, 15), payLateRate: 0.1 };
    const due = at(2026, 4, 15);
    const end = at(2027, 4, 15);
    const jan = Date.parse('2027-01-01T05:00:00Z');
    const expected = 100_000 * (0.07 * (jan - due) / MS_DAY + 0.06 * (end - jan) / MS_DAY) / 365;
    near(statePartsOn(sd as never, due, end).interest, expected);
    void r;
  });

  it('plans: Indiana’s tiers, the District’s 10% down, Oklahoma’s two to twelve months', () => {
    const sim = life('us-in-indianapolis', 'plans-new');
    const r = (year: number) => { const x = { year, due: sim.now - DAY, filedAt: sim.now, figures: { income: 50_000_00, balance: 0 } } as never as { stateDue: Record<string, unknown> }; (sim.player.returns ??= {})[String(year)] = x as never; return x; };
    const DAY = MS_DAY;
    empty(sim);
    r(2001).stateDue = { 'us-in': { state: 'us-in', balance: 3_000_00, filedAt: sim.now, owed: 3_000_00, parts: { tax: 3_000_00, penalty: 0, interest: 0 }, accruedAt: sim.now } };
    // $3,000 a day past due, with Indiana's 10% late-payment penalty: $3,300, in the tier to $5,000.
    expect(statePlanRefusal(sim, sim.player, 'us-in', 30)).toContain('1 to 24 months for $3,300.00');
    expect(statePlanRefusal(sim, sim.player, 'us-in', 24)).toBeUndefined();
    r(2002).stateDue = { 'us-dc': { state: 'us-dc', balance: 2_000_00, filedAt: sim.now, owed: 2_000_00, parts: { tax: 2_000_00, penalty: 0, interest: 0 }, accruedAt: sim.now } };
    // $2,000 a day past due with the District's 5% for a month begun: $2,100, 10% of it down.
    expect(statePlanRefusal(sim, sim.player, 'us-dc', 12, { down: 0 })).toContain('asks for 10% down, $210.00');
    // The bank was emptied: the $200 down is more than it holds.
    expect(statePlanRefusal(sim, sim.player, 'us-dc', 12, { down: 210_00 })).toMatch(/bank can’t cover/);
    r(2003).stateDue = { 'us-ok': { state: 'us-ok', balance: 90_00, filedAt: sim.now, owed: 90_00, parts: { tax: 90_00, penalty: 0, interest: 0 }, accruedAt: sim.now } };
    expect(statePlanRefusal(sim, sim.player, 'us-ok', 6)).toMatch(/more than \$100/);
  });
});
