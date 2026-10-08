/**
 * The career and school journey (the owner's audit of 2026-10-06): the Career
 * and School screens' own commands, each step reading what the one before
 * left.
 *
 * - **A working actor in New York**: a reel refused for want of footage and a
 *   submission for want of headshots; headshots the bank can't cover refused
 *   with nothing taken, then paid at the session and the taxed prints; the
 *   agencies written to once, a casting site paid once however often it's
 *   asked, a kit bought once, a week's five submissions and no sixth, a scene
 *   class billed each month and growing the scene work. The answers come four
 *   weeks on; a commercial agent passes and won't meet again for six months;
 *   an agency signed, a manager taken on. An audition coached for, its hour
 *   and fee, and attended; another missed in Los Angeles and counted by the
 *   agency. A guest part countered (take it or leave it, the offer stands) and
 *   a film countered (12.45% more) and passed; the guest part taken, SAG-AFTRA
 *   eligibility begun, clothes refused unwashed and lent washed; saved and
 *   loaded three days in; the eight days worked and paid on two Thursdays,
 *   each check the agency's tenth of scale, the manager's tenth beside it and
 *   the wardrobe allowance. Then built on: an Emmy entry at the Academy's
 *   $225, once; a reel; a publicist's retainer two months and let go; a
 *   casting director workshop and an improv course, each growing its skill.
 *   The agency not left in a first contract's first 151 days, then left; a
 *   co-star part with SAG-AFTRA's joining fee, refused with the bank empty
 *   and nothing charged, then taken, paid with no agent's share and the
 *   manager's fifteen in a hundred; a play joined with Equity's fee, three
 *   rehearsals worked and the fourth missed out of town, replaced, the
 *   reputation docked and the days worked paid once; November's dues to both
 *   unions; and the manager left a year on.
 * - **A first-year at the drama school**: held to the school while classes
 *   run; an elective shift worked and paid with Friday's wages, a second
 *   missed out of town and unpaid; a sick day refused while well and taken
 *   while ill; the Cabaret joined once, saved and loaded in its run, played to
 *   its closing and credited.
 * - **A pension at its age**: the SAG-AFTRA pension started early at sixty,
 *   15% less, paid each month across a save and load, and Social Security
 *   from sixty-two at 70%.
 * - **Los Angeles and Toronto**: a move the bank can't pay for refused and
 *   paid for after; a T1287 filed for a Toronto job, once; the job flown to,
 *   worked and paid with Canada's tax at the T1287's rate; the agency's
 *   renewal offered in the contract's last third and taken.
 * - **A defect**, kept as a skipped case: a sick day called in at home is
 *   counted attended.
 *
 * Every case ends with every law of the world holding.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { serialise, deserialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { productionOf } from '@/engine/systems/companies';
import { overdraftHeadroom } from '@/engine/systems/lending';
import { ABROAD } from '@/engine/content/safetynet';
import { AGENT_COMMISSION, EQUITY, MANAGEMENT, SAG_AFTRA, WORK_COSTS } from '@/engine/content/career';
import { CAREER_WEEK_KIND, COUNTER, PAY_KIND, WORK_KIND, IMPROV_KIND, beginCareer, careerOf, unitRate, withSalesTax, workshopPrice, type Booking } from '@/engine/systems/career';
import { attributesOf } from '@/engine/systems/attributes';
import { emmyEntry, entriesOf } from '@/engine/systems/awards';
import { CABARET_KIND, ESTIMATE as SCHOOL, bindCeiling, cabaretSeason, ceilingFrom, evenCraft } from '@/engine/systems/school';
import { WORK_STUDY, YALE_CABARET, YALE_DRAMA } from '@/engine/content/school';
import { recordWages } from '@/engine/systems/earnings';
import { pensionOf } from '@/engine/systems/pension';
import { socialSecurityOf } from '@/engine/systems/socialsecurity';
import { garmentsOf, wearable } from '@/engine/systems/wardrobe';
import { documentsOf, passportOf } from '@/engine/systems/documents';

const NY = 'us-ny-newyork';
const ZONE = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, ZONE);
const walk = (sim: Simulation, to: number) => { while (sim.now < to) sim.advanceTo(Math.min(to, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const banked = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && (a.kind === 'checking' || a.kind === 'savings')).reduce((s, a) => s + a.balance, 0);
/** What was charged to the ledger's expense lines under memos matching, each transaction's on its own. */
const charged = (sim: Simulation, re: RegExp): number[] => Object.values(sim.universe.transactions).filter((t) => re.test(t.memo)).map((t) => t.postings.filter((p) => sim.universe.accounts[p.accountId]?.kind === 'expense' && p.amount > 0).reduce((a, p) => a + p.amount, 0));
const pending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === kind).sort((a, b) => a.at - b.at);
/** What a transaction posted to a nominal line of a kind and name. */
const posted = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }, kind: 'income' | 'expense', name: string) => t.postings.filter((p) => p.accountId === sim.nominalAccount(kind, name).id).reduce((a, p) => a + p.amount, 0);

/** An actor in New York with the business begun, and a craft and how far it can grow as the school's admission leaves them (`enroll`): without the ceiling kept on the person, a save loaded reads the craft as one from before ceilings, and it stops growing. */
function actor(seed: string): Simulation {
  const sim = quickSave({ startLocationId: NY, homeRegionId: NY, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(80);
  sim.player.craftCeiling = ceilingFrom(sim.player.craft);
  bindCeiling(sim.player.craft, sim.player.craftCeiling);
  beginCareer(sim, sim.player);
  return sim;
}

/** Everything in the bank, and the overdraft, given to the family, posted, so the ledger's law holds. What was given, to give back. */
function giveAway(sim: Simulation): { accountId: string; amount: number }[] {
  const given: { accountId: string; amount: number }[] = [];
  const out = (accountId: string, amount: number) => {
    given.push({ accountId, amount });
    sim.post({ memo: 'Given to the family', category: 'transfer', postings: [{ accountId, amount: -amount }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount }] });
  };
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal || (a.kind !== 'checking' && a.kind !== 'savings') || a.balance <= 0) continue;
    out(a.id, a.balance);
  }
  const room = overdraftHeadroom(sim, sim.player);
  if (room > 0) out(sim.player.primaryAccountId!, room);
  return given;
}
function giveBack(sim: Simulation, given: { accountId: string; amount: number }[]): void {
  for (const g of given) sim.post({ memo: 'A gift from the family', category: 'income', postings: [{ accountId: g.accountId, amount: g.amount }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -g.amount }] });
}

describe('a working actor in New York', () => {
  it('is represented, books, works, is paid less the commission, builds, and leaves', () => {
    let sim = actor('journey-career');

    // Not yet: a reel wants footage, and a submission wants headshots.
    expect(sim.execute({ kind: 'career.reel', payload: {} }).error).toBe('A reel is cut from footage, and you have none: a screen credit, a self-tape from class, or the school’s film monologue.');
    expect(sim.execute({ kind: 'career.query_agencies', payload: {} }).error).toBe('A submission is a headshot and a résumé: have headshots taken first.');

    // Headshots the bank can't cover: refused, and nothing taken.
    const headshots = WORK_COSTS.headshots - WORK_COSTS.prints + withSalesTax(sim.player, sim.now, WORK_COSTS.prints);
    const given = giveAway(sim);
    const short = sim.execute({ kind: 'career.headshots', payload: {} });
    expect(short.error).toContain('which the bank can’t cover');
    expect(charged(sim, /^Headshots and prints$/)).toEqual([]);
    expect(careerOf(sim.player).headshotsAt).toBeUndefined();
    giveBack(sim, given);

    let before = banked(sim);
    sim.must({ kind: 'career.headshots', payload: {} });
    expect(before - banked(sim)).toBe(headshots);
    expect(charged(sim, /^Headshots and prints$/)).toEqual([headshots]);

    // Written to the agencies: answered in four weeks, and not written to twice.
    const query = sim.must<{ answersBy: number }>({ kind: 'career.query_agencies', payload: {} });
    expect(query.answersBy - sim.now).toBe(28 * MS_DAY);
    expect(sim.execute({ kind: 'career.query_agencies', payload: {} }).error).toMatch(/six months on/);

    // A casting site, a year paid once: asked again it renews, and charges nothing more.
    before = banked(sim);
    sim.must({ kind: 'career.subscribe', payload: { site: 'actors-access', on: true } });
    sim.must({ kind: 'career.subscribe', payload: { site: 'actors-access', on: true } });
    expect(before - banked(sim)).toBe(WORK_COSTS.sites['actors-access'].price);
    // A kit, bought once.
    before = banked(sim);
    sim.must({ kind: 'career.buy_kit', payload: {} });
    expect(sim.execute({ kind: 'career.buy_kit', payload: {} }).error).toBe('You have a kit.');
    expect(before - banked(sim)).toBe(withSalesTax(sim.player, sim.now, WORK_COSTS.kit));

    // A week's five submissions, and no sixth.
    for (let n = 1; n <= 5; n += 1) expect(sim.must<{ submitted: number }>({ kind: 'career.self_submit', payload: {} }).submitted).toBe(n);
    expect(sim.execute({ kind: 'career.self_submit', payload: {} }).error).toBe('You’ve made this week’s 5 submissions.');

    // A scene-study class, a month at a time.
    before = banked(sim);
    sim.must({ kind: 'career.class', payload: { on: true } });
    expect(sim.execute({ kind: 'career.class', payload: { on: true } }).error).toBe('You’re in a class.');
    expect(before - banked(sim)).toBe(WORK_COSTS.classMonthly);
    const scene = sim.player.craft!.scene;

    walk(sim, query.answersBy + MS_HOUR);
    const career = careerOf(sim.player);
    // The class billed January and February, and grew the scene work while it ran.
    expect(charged(sim, /^Scene-study class, the month$/)).toEqual([WORK_COSTS.classMonthly, WORK_COSTS.classMonthly]);
    expect(sim.player.craft!.scene).toBeGreaterThan(scene);
    // The agencies answered the submission: the ones whose bar the actor clears.
    expect(career.offers.map((o) => o.agencyId)).toContain('caa');
    // A commercial agent met, who reads presence and a record, and with neither yet, passes.
    expect(sim.must<{ signed: boolean }>({ kind: 'career.commercial_meet', payload: { agencyId: 'abrams' } }).signed).toBe(false);
    expect(career.commercial).toBeUndefined();
    expect(sim.universe.notifications.some((n) => n.title === 'Abrams Artists Agency Passed')).toBe(true);

    // Signed with an agency that answered, and the class left: no month after.
    sim.must({ kind: 'career.sign', payload: { agencyId: 'caa', cityId: NY } });
    // The other offers close with the signing, so a second is refused.
    expect(career.agencyId).toBe('caa');
    expect(career.offers).toEqual([]);
    expect(sim.execute({ kind: 'career.sign', payload: { agencyId: 'wme', cityId: NY } }).error).toBe('That agency hasn’t an offer standing.');
    sim.must({ kind: 'career.class', payload: { on: false } });
    // A manager too.
    career.managerOffers.push({ managerId: '3arts', until: sim.now + 30 * MS_DAY });
    sim.must({ kind: 'career.sign_manager', payload: { managerId: '3arts' } });
    expect(sim.execute({ kind: 'career.leave_manager', payload: {} }).error).toMatch(/The contract runs a year from/);

    // The agency's first week: an audition coached for, an hour and its fee.
    walk(sim, pending(sim, CAREER_WEEK_KIND)[0]!.at + 60_000);
    const room = career.auditions.find((a) => a.status === 'ahead' && a.mode === 'room')!;
    const t0 = sim.now;
    before = banked(sim);
    sim.must({ kind: 'career.coach', payload: { auditionId: room.id } });
    expect(sim.now - t0).toBe(MS_HOUR);
    expect(charged(sim, /^A coach, for /)).toEqual([WORK_COSTS.coach]);
    expect(sim.execute({ kind: 'career.coach', payload: { auditionId: room.id } }).error).toBe('You’ve worked on it already.');
    expect(charged(sim, /^A coach, for /)).toHaveLength(1);
    // Attended by being awake and in the city when it comes: the audition's practice grows the cold read.
    const cold = sim.player.craft!.coldReading;
    walk(sim, room.at + 2 * MS_HOUR);
    expect(['done', 'booked']).toContain(room.status);
    expect(sim.player.craft!.coldReading).toBeGreaterThan(cold);

    // The next week's: one in the room missed in Los Angeles, too far to come back for, and the agency counts it.
    walk(sim, pending(sim, CAREER_WEEK_KIND)[0]!.at + 60_000);
    const away = career.auditions.find((a) => a.status === 'ahead' && a.mode === 'room')!;
    walk(sim, away.at - MS_HOUR);
    sim.player.currentLocationId = 'us-ca-losangeles';
    walk(sim, away.at + MS_HOUR);
    sim.player.currentLocationId = NY;
    expect(away.status).toBe('missed');
    expect(career.missed).toBe(1);
    expect(sim.universe.notifications.some((n) => n.title === 'You Missed An Audition')).toBe(true);
    expect(career.agencyId).toBe('caa');

    // The agency's booking: a guest star on an hour series, eight days from a Monday.
    const job: Booking = { id: 'gs', roleId: 'guest-hour', cityId: NY, starts: at(2026, 2, 23, 8), units: 8, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    const film: Booking = { id: 'lb', roleId: 'film-low', cityId: NY, starts: at(2026, 3, 16, 8), units: 5, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    career.bookings.push(job, film);
    // Asked for more: a guest star is offered at scale, take it or leave it, and the offer stands; once asked, not again.
    expect(sim.must<{ met: boolean }>({ kind: 'career.counter', payload: { bookingId: 'gs' } }).met).toBe(false);
    expect(job.rate).toBeUndefined();
    expect(sim.execute({ kind: 'career.counter', payload: { bookingId: 'gs' } }).error).toBe('You’ve asked once already.');
    // The film's is a negotiation, and this one came up the 12.45% a counter gets: the low-budget day's $810, to $910.85.
    expect(sim.must<{ met: boolean }>({ kind: 'career.counter', payload: { bookingId: 'lb' } }).met).toBe(true);
    expect(film.rate).toBe(Math.round(810_00 * (1 + COUNTER.raise)));
    expect(film.rate).toBe(910_85);
    // And passed on all the same.
    sim.must({ kind: 'career.pass', payload: { bookingId: 'lb' } });
    expect(film.status).toBe('passed');
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: 'lb' } }).error).toBe('That offer isn’t open.');

    sim.must({ kind: 'career.accept', payload: { bookingId: 'gs' } });
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: 'gs' } }).error).toBe('That offer isn’t open.');
    expect(job.status).toBe('accepted');
    expect(career.unions.sag?.eligibleAt).toBe(sim.now);
    expect(pending(sim, WORK_KIND).filter((i) => i.payload.bookingId === 'gs')).toHaveLength(8);
    // SAG-AFTRA pays on the Thursday after each week's Saturday.
    expect(pending(sim, PAY_KIND).filter((i) => i.payload.bookingId === 'gs').map((i) => i.at)).toEqual([at(2026, 3, 5, 17), at(2026, 3, 12, 17)]);
    // Clothes of their own lent to it: the allowance with the pay.
    const mine = garmentsOf(sim.player).filter((x) => x.garment.care !== 'dry-clean');
    const top = mine.find((x) => ['t-shirt', 'shirt'].includes(x.garment.kind))!;
    const bottom = mine.find((x) => ['jeans', 'trousers'].includes(x.garment.kind))!;
    const outfit = sim.must<{ outfitId: string }>({ kind: 'clothes.save_outfit', payload: { name: 'Casual', itemIds: [top.id, bottom.id] } }).outfitId;
    // Six weeks worn, they aren't fit to lend; washed, and back from the wash, they are.
    expect(sim.execute({ kind: 'career.furnish_wardrobe', payload: { bookingId: 'gs', outfitIds: [outfit] } }).error).toMatch(/isn’t clean and to hand/);
    sim.must({ kind: 'life.look_after', payload: { action: 'laundry', itemIds: [top.id, bottom.id] } });
    for (let h = 0; h < 30 && !(wearable(sim, sim.player, top) && wearable(sim, sim.player, bottom)); h += 1) sim.advanceTo(sim.now + MS_HOUR);
    expect(sim.must<{ allowance: number }>({ kind: 'career.furnish_wardrobe', payload: { bookingId: 'gs', outfitIds: [outfit] } }).allowance).toBe(2 * 12_00);
    // The part learned before the first day, two hours of it (`career.learn_part`, from 2026-10-08): kept through the save below, and the first day says so.
    const learnt = [1, 2].map(() => sim.must<{ lines: number }>({ kind: 'career.learn_part', payload: { bookingId: 'gs' } }).lines);
    expect(learnt[1]).toBeGreaterThan(learnt[0]!);

    // Three days in, saved and loaded: the job and its calls kept.
    walk(sim, at(2026, 2, 25, 18));
    expect(job.worked).toBe(3);
    sim = reload(sim);
    const kept = careerOf(sim.player);
    expect(kept.bookings.find((b) => b.id === 'gs')).toMatchObject({ status: 'accepted', worked: 3 });
    expect(productionOf(sim.player, 'gs')!.lines).toBeCloseTo(learnt[1]!, 9);
    expect(productionOf(sim.player, 'gs')!.history.some((h) => h.what.startsWith('You came in on book'))).toBe(true);
    expect(kept.agencyId).toBe('caa');
    expect(kept.managerId).toBe('3arts');
    expect(pending(sim, WORK_KIND).filter((i) => i.payload.bookingId === 'gs')).toHaveLength(5);
    expect(breaches(sim.universe)).toEqual([]);

    walk(sim, at(2026, 3, 13, 9));
    const c = careerOf(sim.player);
    const done = c.bookings.find((b) => b.id === 'gs')!;
    expect(done).toMatchObject({ status: 'worked', worked: 8, owed: 0 });
    // The credit names the production and the player's part (`systems/companies.ts`, from 2026-10-08).
    expect(c.credits).toContainEqual(expect.objectContaining({ roleId: 'guest-hour', year: 2026, cityId: NY, part: 'Your Part' }));
    expect(c.credits.find((x) => x.roleId === 'guest-hour')!.productionId).toMatch(/^prod-/);
    // Paid on the two Thursdays, each week's days: scale plus ten for the agent, the agency's tenth of scale,
    // the manager's tenth of the gross beside an agent, and the wardrobe's allowance with the first.
    const pays = Object.values(sim.universe.transactions).filter((t) => t.memo.startsWith('Guest Star, An Hour Series'));
    expect(pays.map((t) => t.memo)).toEqual(['Guest Star, An Hour Series: 5 days, with the wardrobe allowance', 'Guest Star, An Hour Series: 3 days']);
    for (const [t, days] of [[pays[0]!, 5], [pays[1]!, 3]] as const) {
      const scale = unitRate(done, t.at, 'USD') * days;
      const gross = -posted(sim, t, 'income', 'Acting');
      expect(posted(sim, t, 'expense', 'Agent Commission')).toBe(Math.round(scale * AGENT_COMMISSION.rate));
      expect(posted(sim, t, 'expense', 'Manager Commission')).toBe(Math.round(gross * MANAGEMENT.withAgent));
      // Scale plus ten, and the days' overtime and meals on top of it.
      expect(gross).toBeGreaterThanOrEqual(Math.round(scale * (1 + AGENT_COMMISSION.rate)));
    }
    expect(posted(sim, pays[0]!, 'income', 'Wardrobe Allowance')).toBe(-2 * 12_00);
    // A guest star's day is $11,352 over eight, $1,419: five days' tenth is $709.50, three days' $425.70.
    expect(pays.map((t) => posted(sim, t, 'expense', 'Agent Commission'))).toEqual([709_50, 425_70]);
    // And what reached the bank is the check less the commissions and the tax, with the allowance.
    for (const t of pays) {
      const net = t.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount;
      expect(net).toBe(-posted(sim, t, 'income', 'Acting') - posted(sim, t, 'income', 'Wardrobe Allowance') - posted(sim, t, 'expense', 'Agent Commission') - posted(sim, t, 'expense', 'Manager Commission') - posted(sim, t, 'expense', 'Tax Withheld'));
    }

    // Built on: the guest part entered for the Emmys at the Academy's fee, once.
    before = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'career.enter_award', payload: { bookingId: 'gs' } }).paid).toBe(emmyEntry(sim));
    expect(before - banked(sim)).toBe(225_00);
    expect(sim.execute({ kind: 'career.enter_award', payload: { bookingId: 'gs' } }).error).toBe('It’s entered.');
    expect(entriesOf(sim.player)).toHaveLength(1);
    // A reel cut from the footage there is now.
    before = banked(sim);
    sim.must({ kind: 'career.reel', payload: {} });
    expect(before - banked(sim)).toBe(WORK_COSTS.reel);
    // A publicist, with a credit to sell: the month's retainer, and the name a little better known.
    const known = attributesOf(sim, sim.player).recognition;
    before = banked(sim);
    sim.must({ kind: 'career.publicist', payload: { on: true } });
    expect(before - banked(sim)).toBe(WORK_COSTS.publicistMonthly);
    expect(attributesOf(sim, sim.player).recognition).toBeGreaterThan(known);
    expect(sim.execute({ kind: 'career.publicist', payload: { on: true } }).error).toBe('You have a publicist.');
    // A casting director workshop on Thursday evening, booked once.
    const workshop = workshopPrice(sim, NY);
    before = banked(sim);
    const evening = sim.must<{ at: number }>({ kind: 'career.workshop', payload: {} }).at;
    expect(sim.execute({ kind: 'career.workshop', payload: {} }).error).toBe('You have one booked.');
    expect(before - banked(sim)).toBe(workshop.price);
    // And an improv course, eight Tuesdays.
    before = banked(sim);
    const tuesday = sim.must<{ first: number }>({ kind: 'career.improv', payload: {} }).first;
    expect(sim.execute({ kind: 'career.improv', payload: {} }).error).toBe('You’re in a course.');
    expect(before - banked(sim)).toBe(WORK_COSTS.improv);
    expect(pending(sim, IMPROV_KIND)).toHaveLength(WORK_COSTS.improvWeeks);
    const craft0 = { ...sim.player.craft! };
    walk(sim, Math.max(evening, tuesday) + 4 * MS_HOUR);
    // The workshop's cold read grew the cold reading and left an office that knows them; the first improv class, the improv.
    expect(sim.player.craft!.coldReading).toBeGreaterThan(craft0.coldReading);
    expect(sim.player.craft!.improv).toBeGreaterThan(craft0.improv);
    expect(careerOf(sim.player).castingContacts).toEqual([expect.objectContaining({ cityId: NY, at: evening })]);
    expect(careerOf(sim.player).improv?.left).toBe(WORK_COSTS.improvWeeks - 1);

    // The month turns: the publicist's retainer again, then let go, and no month after.
    walk(sim, at(2026, 4, 7, 9));
    expect(charged(sim, /^A publicist, the month$/)).toEqual([WORK_COSTS.publicistMonthly, WORK_COSTS.publicistMonthly]);
    sim.must({ kind: 'career.publicist', payload: { on: false } });
    expect(sim.execute({ kind: 'career.publicist', payload: { on: false } }).error).toBe('You have no publicist.');

    // Leaving the agency: not in a first contract's first 151 days while offers come.
    expect(sim.execute({ kind: 'career.leave', payload: {} }).error).toBe('In a first contract’s first 151 days, you may leave only once 120 days in a row pass with no offer.');
    // The commercial agent who passed won't meet again within six months.
    expect(sim.execute({ kind: 'career.commercial_meet', payload: { agencyId: 'abrams' } }).error).toBe('Abrams Artists Agency met you in the last six months.');
    expect(sim.execute({ kind: 'career.commercial_leave', payload: {} }).error).toBe('You have no commercial agent.');

    // July: the Emmys' nominations drawn on the entry; and past the 151st day, under ten days' work in 91, the agency left.
    walk(sim, at(2026, 7, 9, 12));
    expect(charged(sim, /^A publicist, the month$/)).toHaveLength(2);
    expect(entriesOf(sim.player)[0]!.nominated).toBeDefined();
    // Not nominated this year: no lift, and no notice of one.
    expect(entriesOf(sim.player)[0]!.nominated).toBe(false);
    expect(sim.universe.notifications.some((n) => n.title === 'Nominated')).toBe(false);
    const left = sim.must<{ left: string }>({ kind: 'career.leave', payload: {} });
    expect(left.left).toBe('CAA');
    expect(careerOf(sim.player).agencyId).toBeUndefined();
    expect(careerOf(sim.player).ended).toMatchObject({ agencyId: 'caa', left: true });
    expect(sim.execute({ kind: 'career.leave', payload: {} }).error).toBe('You have no agency.');

    // A co-star part, booked through the manager, unrepresented: joining SAG-AFTRA comes due with it, thirty days past eligible.
    const costar: Booking = { id: 'cs', roleId: 'costar', cityId: NY, starts: at(2026, 7, 20, 8), units: 2, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(costar);
    const join = SAG_AFTRA.initiation + Math.round(SAG_AFTRA.basicDues / 2);
    // With the bank emptied, the job isn't taken and nothing is charged.
    const empty = giveAway(sim);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: 'cs' } }).error).toMatch(/joining, for \$3,244\.07, which the bank can’t cover/);
    expect(costar.status).toBe('offered');
    expect(charged(sim, /^SAG-AFTRA initiation/)).toEqual([]);
    expect(pending(sim, WORK_KIND).filter((i) => i.payload.bookingId === 'cs')).toEqual([]);
    giveBack(sim, empty);
    sim.must({ kind: 'career.accept', payload: { bookingId: 'cs' } });
    expect(charged(sim, /^SAG-AFTRA initiation/)).toEqual([join]);
    expect(careerOf(sim.player).unions.sag?.joinedAt).toBe(sim.now);
    walk(sim, at(2026, 7, 31, 9));
    const coPay = Object.values(sim.universe.transactions).filter((t) => t.memo.startsWith('Co-Star, A Television Series'));
    // Paid at scale with no agency: no agent's share, and the manager's fifteen in a hundred of it alone.
    expect(coPay).toHaveLength(1);
    expect(posted(sim, coPay[0]!, 'expense', 'Agent Commission')).toBe(0);
    expect(posted(sim, coPay[0]!, 'expense', 'Manager Commission')).toBe(Math.round(-posted(sim, coPay[0]!, 'income', 'Acting') * MANAGEMENT.alone));
    expect(-posted(sim, coPay[0]!, 'income', 'Acting')).toBeGreaterThanOrEqual(2 * 1_283_00);

    // A play: Actors' Equity joined on the contract, a week's rehearsal and a week of nights. Three rehearsals
    // worked, then in Los Angeles on the fourth's morning: replaced, the reputation docked, the calls ahead off,
    // and the days worked still paid.
    const play: Booking = { id: 'pl', roleId: 'lort-b', cityId: NY, starts: at(2026, 8, 3, 8), units: 1, rehearsalWeeks: 1, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(play);
    sim.must({ kind: 'career.accept', payload: { bookingId: 'pl' } });
    expect(charged(sim, /^Actors’ Equity initiation/)).toEqual([EQUITY.initiationNow + Math.round(EQUITY.basicDues / 2)]);
    expect(careerOf(sim.player).unions.equity?.joinedAt).toBe(sim.now);
    walk(sim, at(2026, 8, 6, 18));
    const stage = careerOf(sim.player).bookings.find((b) => b.id === 'pl')!;
    expect(stage.worked).toBe(3);
    const standing = attributesOf(sim, sim.player).reputation;
    sim.player.currentLocationId = 'us-ca-losangeles';
    walk(sim, at(2026, 8, 7, 12));
    sim.player.currentLocationId = NY;
    expect(stage.status).toBe('fired');
    expect(attributesOf(sim, sim.player).reputation).toBeCloseTo(standing - 8, 6);
    expect(pending(sim, WORK_KIND).filter((i) => i.payload.bookingId === 'pl')).toEqual([]);
    expect(sim.universe.notifications.some((n) => n.title === 'Replaced')).toBe(true);
    walk(sim, at(2026, 8, 10, 9));
    // Paid once, on the firing, for the three rehearsals: a week's scale over six for each, Equity's 2.5% working dues and the manager's fifteen.
    const playPay = Object.values(sim.universe.transactions).filter((t) => t.memo.startsWith('A Play, A LORT Theater (Category B)'));
    expect(playPay.map((t) => t.memo)).toEqual(['A Play, A LORT Theater (Category B): 3 days']);
    expect(-posted(sim, playPay[0]!, 'income', 'Acting')).toBe(Math.round((1_213_00 * 3) / 6));
    expect(posted(sim, playPay[0]!, 'expense', 'Union Dues')).toBe(Math.round(606_50 * EQUITY.workingDues));
    expect(posted(sim, playPay[0]!, 'expense', 'Manager Commission')).toBe(Math.round(606_50 * MANAGEMENT.alone));

    // November's dues: half a year's basic dues to each union, from the bank.
    walk(sim, at(2026, 11, 2, 9));
    expect(charged(sim, /^Union dues$/)).toEqual([Math.round(SAG_AFTRA.basicDues / 2) + Math.round(EQUITY.basicDues / 2)]);

    // A year from signing, the manager may be left.
    walk(sim, at(2027, 2, 3, 9));
    expect(sim.must<{ left: string }>({ kind: 'career.leave_manager', payload: {} }).left).toBe('3 Arts Entertainment');
    expect(careerOf(sim.player).managerId).toBeUndefined();
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});

describe('a first-year at the drama school', () => {
  it('is held to the school while classes run, works and is paid a shift, misses one, calls in sick, and plays the Cabaret', () => {
    let sim = createSave(1, 'journey-career-school', { ...newLifeConfig(), homeRegionId: NY, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    expect(sim.player.currentLocationId).toBe('us-ct-newhaven');
    expect(sim.player.school!.standing).toBe('good');

    // The business waits for the summer or the degree: no submissions, no class or course of their own, no move away.
    expect(sim.execute({ kind: 'career.self_submit', payload: {} }).error).toBe('While classes are in session, the school’s work comes first; submissions start in the summer, and for good when school ends.');
    expect(sim.execute({ kind: 'career.class', payload: { on: true } }).error).toBe('School is your class for now.');
    expect(sim.execute({ kind: 'career.improv', payload: {} }).error).toBe('School is your class for now; a course waits for the summer or the degree.');
    expect(sim.execute({ kind: 'career.workshop', payload: {} }).error).toBe('While classes are in session, the school’s work comes first.');
    expect(sim.execute({ kind: 'career.relocate', payload: { cityId: 'us-ca-losangeles', kind: 'shared' } }).error).toBe('Classes are in New Haven while the term is on; a move away waits for the summer or the degree.');
    // And the school's own seasons have theirs: the Cabaret with the term, the summer's company in the spring.
    expect(sim.execute({ kind: 'school.cabaret', payload: {} }).error).toBe('The Cabaret’s season begins with the term.');
    expect(sim.execute({ kind: 'school.summer_cabaret', payload: {} }).error).toBe('The company forms in the spring, for students with a year still to come.');
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).error).toBe('There are no classes today.');
    expect(sim.player.currentLocationId).toBe('us-ct-newhaven');

    // An elective evening front of house: four hours, worked, and paid with Friday's work-study wages.
    const school = sim.player.school!;
    const shift = sim.must<{ at: number; hours: number }>({ kind: 'school.take_shift', payload: {} });
    expect(shift).toEqual({ at: at(2026, 8, 25, 19), hours: 4 });
    expect(school.workStudy.electiveHours).toBe(4);
    // A second, the next free evening; out of New Haven for it, it's missed, unpaid, and its hours free to ask for again.
    const second = sim.must<{ at: number }>({ kind: 'school.take_shift', payload: {} }).at;
    expect(second).toBe(at(2026, 8, 26, 19));
    expect(school.workStudy.electiveHours).toBe(8);
    walk(sim, at(2026, 8, 26, 18));
    expect(school.workStudy.owedHours).toBe(4);
    sim.player.currentLocationId = NY;
    walk(sim, at(2026, 8, 26, 23, 30));
    sim.player.currentLocationId = 'us-ct-newhaven';
    expect(school.workStudy).toMatchObject({ electiveHours: 4, owedHours: 4 });
    expect(sim.universe.notifications.some((n) => n.title === 'You Missed A Work-Study Shift')).toBe(true);
    walk(sim, at(2026, 8, 28, 18));
    const wages = Object.values(sim.universe.transactions).filter((t) => t.memo.startsWith('Work-study wages'));
    expect(wages.map((t) => t.memo)).toEqual([`Work-study wages, 4 hours: ${YALE_DRAMA.name}`]);
    expect(wages[0]!.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBe(4 * WORK_STUDY.hourly);
    expect(school.workStudy.owedHours).toBe(0);

    // A class day: well enough to go isn't a sick day; unwell before nine, it is. What the day's classes then
    // make of it, with the student at home in New Haven, is the defect kept below (`it.skip`): they're attended.
    walk(sim, at(2026, 9, 1, 8));
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).error).toBe('You’re well enough to go: staying away would be an unexcused absence.');
    const tally = { ...school.tally };
    sim.player.wellbeing.condition = SCHOOL.sickBelow - 10;
    expect(sim.must<{ excused: boolean }>({ kind: 'school.call_in_sick', payload: {} }).excused).toBe(true);
    walk(sim, at(2026, 9, 1, 12));
    expect(school.tally.classDays).toBe(tally.classDays + 1);
    expect(sim.universe.notifications.filter((n) => n.title === 'You Missed Classes')).toEqual([]);
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).error).toBe('Today’s classes have been and gone; calling in sick now excuses nothing.');

    // The Cabaret, once the term has begun: a new piece this term, and not two.
    walk(sim, at(2026, 9, 7, 18));
    const week = sim.must<{ week: string }>({ kind: 'school.cabaret', payload: {} }).week;
    expect(sim.execute({ kind: 'school.cabaret', payload: {} }).error).toBe('You’re in a Cabaret show this term already.');
    const calls = pending(sim, CABARET_KIND);
    expect(calls.filter((c) => c.payload.call === 'performance')).toHaveLength(YALE_CABARET.shows.length);
    // Saved and loaded between its first rehearsal and its last night: the show and its calls kept.
    walk(sim, calls[0]!.at + 4 * MS_HOUR);
    sim = reload(sim);
    expect(sim.player.school!.cabaret).toMatchObject({ week, term: 0 });
    expect(pending(sim, CABARET_KIND)).toHaveLength(calls.length - 1);
    const memorized = sim.player.craft!.memorization;
    walk(sim, calls.at(-1)!.at + MS_HOUR);
    const cab = sim.player.school!.cabaret!;
    expect(cab.performed).toBe(YALE_CABARET.shows.length);
    expect(sim.player.craft!.memorization).toBeGreaterThan(memorized);
    // On the résumé with the nights it went on.
    expect(sim.player.school!.credits).toEqual([{ production: cabaretSeason(0), role: cab.role, kind: 'cabaret', year: 2026, wentOn: YALE_CABARET.shows.length }]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);

  it('keeps a student who called in sick at home, the day excused rather than attended', () => {
    // DEFECT: `school.call_in_sick` sets `school.sickDay` and answers `{ excused: true }`, but the day's
    // classes (`CLASSES_KIND` in systems/school.ts) read the sick day only after `present()` has failed:
    // a student who called in sick while awake in New Haven is counted attended, grows from the day's
    // courses and is tired by them, and the excused count doesn't move. Calling in sick changes the
    // outcome only for a student who'd have been absent anyway. Expected: attended unchanged, excused + 1.
    // Actual: attended + 1, excused unchanged.
    const sim = createSave(1, 'journey-career-sick', { ...newLifeConfig(), homeRegionId: NY, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    walk(sim, at(2026, 9, 1, 8));
    const tally = { ...sim.player.school!.tally };
    sim.player.wellbeing.condition = SCHOOL.sickBelow - 10;
    sim.must({ kind: 'school.call_in_sick', payload: {} });
    walk(sim, at(2026, 9, 1, 12));
    expect(sim.player.school!.tally).toMatchObject({ classDays: tally.classDays + 1, attended: tally.attended, excused: tally.excused + 1 });
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a pension at its age', () => {
  it('starts the SAG-AFTRA pension early at sixty and pays it each month, then Social Security from sixty-two', () => {
    let sim = quickSave({ startLocationId: NY, homeRegionId: NY, livesWhereBorn: true, wealth: 'wealthy' }, 'journey-career-pension');
    // Thirty years of covered work behind them, at $50,000 a year, each year a Pension Credit and four of Social Security's.
    for (let year = 1994; year < 2024; year += 1) recordWages(sim.player, instantFromZoned({ year, month: 6, day: 1, hour: 12 }, ZONE), ZONE, { gross: 50_000_00, sag: true, where: NY });
    // Sixty and two days.
    sim.player.birthInstant = sim.now - Math.round(60 * 365.2425 * MS_DAY) - 2 * MS_DAY;
    const plan = pensionOf(sim, sim.player);
    expect(plan).toMatchObject({ credits: 30, vested: true });

    // Social Security waits for sixty-two.
    expect(sim.execute({ kind: 'pension.social_security', payload: {} }).error).toBe('From 62; full at 67, and more if you wait to 70.');
    // The Plan from fifty-five, with ten credits: sixty months early, 15% less.
    const { factor } = sim.must<{ factor: number }>({ kind: 'pension.start', payload: {} });
    expect(factor).toBeCloseTo(0.85, 10);
    expect(sim.execute({ kind: 'pension.start', payload: {} }).error).toBe('Your pension has begun.');
    const month = Math.round((plan.yearly * factor) / 12);
    const paid = (s: Simulation) => Object.values(s.universe.transactions).filter((t) => t.memo === 'SAG-Producers Pension Plan, the month');
    walk(sim, sim.now + MS_HOUR);
    expect(paid(sim).map((t) => -posted(sim, t, 'income', 'Pension'))).toEqual([month]);
    // What reaches the bank is the month less the federal tax withheld on it.
    const first = paid(sim)[0]!;
    expect(first.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBe(month - posted(sim, first, 'expense', 'Tax Withheld'));

    // Saved and loaded: the next month comes all the same, at the same reduced amount.
    sim = reload(sim);
    walk(sim, sim.now + 31 * MS_DAY);
    expect(paid(sim).map((t) => -posted(sim, t, 'income', 'Pension'))).toEqual([month, month]);

    // Sixty-two: Social Security claimed five years early, at 70% of the full benefit, and paid the month after.
    walk(sim, sim.player.birthInstant + Math.round(62 * 365.2425 * MS_DAY) + 2 * MS_DAY);
    const ss = sim.must<{ monthly: number; factor: number }>({ kind: 'pension.social_security', payload: {} });
    expect(ss.factor).toBeCloseTo(0.7, 10);
    expect(ss.monthly).toBe(Math.floor(socialSecurityOf(sim.player, 'USD').pia * 0.7) * 100);
    expect(sim.execute({ kind: 'pension.social_security', payload: {} }).error).toBe('You’re drawing it.');
    walk(sim, sim.now + 32 * MS_DAY);
    const benefit = Object.values(sim.universe.transactions).filter((t) => t.memo === 'Social Security, the month');
    expect(benefit.map((t) => t.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount)).toEqual([ss.monthly]);
    // And the Plan's months ran on through the two years, one a month.
    expect(paid(sim).length).toBeGreaterThanOrEqual(25);
    expect(new Set(paid(sim).map((t) => -posted(sim, t, 'income', 'Pension')))).toEqual(new Set([month]));
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});
describe('an actor who moves to Los Angeles and works in Toronto', () => {
  it('moves once the bank can pay, files a T1287 for the Canadian job, is paid less Canada’s reduced tax, and renews with the agency', () => {
    let sim = actor('journey-career-abroad');
    // An actor sent abroad holds a passport.
    if (!passportOf(sim.player, sim.now)) documentsOf(sim.player).push({ id: 'pp', kind: 'passport', issuer: 'US', name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const LA = 'us-ca-losangeles';

    // A move the bank can't pay for is refused, and they're left where they were, nothing taken.
    const given = giveAway(sim);
    expect(sim.execute({ kind: 'career.relocate', payload: { cityId: LA, kind: 'shared' } }).ok).toBe(false);
    expect(sim.player.currentLocationId).toBe(NY);
    expect(sim.player.home?.cityId).toBe(NY);
    expect(charged(sim, /^Deposit and the rest of the month$/)).toEqual([]);
    giveBack(sim, given);
    // Paid for, they live in Los Angeles: the deposit and the month's rest there, the old deposit back.
    sim.must({ kind: 'career.relocate', payload: { cityId: LA, kind: 'shared' } });
    expect(sim.player.currentLocationId).toBe(LA);
    expect(sim.player.home?.cityId).toBe(LA);
    expect(Object.values(sim.universe.transactions).map((t) => t.memo)).toEqual(expect.arrayContaining(['Deposit back', 'Deposit and the rest of the month']));
    expect(sim.execute({ kind: 'career.relocate', payload: { cityId: LA, kind: 'shared' } }).error).toBe('You live there already.');

    // Signed from the agency's Los Angeles office.
    careerOf(sim.player).offers.push({ agencyId: 'gersh', cityId: LA, until: sim.now + 30 * MS_DAY });
    sim.must({ kind: 'career.sign', payload: { agencyId: 'gersh', cityId: LA } });

    // A guest part shooting in Toronto: a T1287 isn't filed for an offer, only for a job taken, and once.
    const job: Booking = { id: 'tor', roleId: 'guest-hour', cityId: LA, location: 'ca-on-toronto', starts: at(2026, 2, 2, 8), units: 8, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(job);
    expect(sim.execute({ kind: 'career.t1287', payload: { bookingId: 'tor' } }).error).toBe('Only for a job you’ve taken.');
    sim.must({ kind: 'career.accept', payload: { bookingId: 'tor' } });
    const rate = sim.must<{ rate: number }>({ kind: 'career.t1287', payload: { bookingId: 'tor' } }).rate;
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(ABROAD.canada.rate);
    expect(sim.execute({ kind: 'career.t1287', payload: { bookingId: 'tor' } }).error).toBe('You’ve filed one for it.');
    expect(sim.execute({ kind: 'career.t1287', payload: { bookingId: 'nothing' } }).error).toBe('There’s no such job.');

    // Flown out, worked, flown home, and paid: Canada's tax withheld at the T1287's rate rather than 23%, the agency's tenth, and the meal allowance.
    walk(sim, at(2026, 2, 25, 12));
    expect(job).toMatchObject({ status: 'worked', worked: 8 });
    expect(sim.player.currentLocationId).toBe(LA);
    const pay = Object.values(sim.universe.transactions).filter((t) => t.memo.startsWith('Guest Star, An Hour Series'));
    expect(pay.map((t) => t.memo)).toEqual(['Guest Star, An Hour Series: 8 days, with the meal allowance']);
    const gross = -posted(sim, pay[0]!, 'income', 'Acting');
    const foreign = posted(sim, pay[0]!, 'expense', 'Foreign Tax Withheld');
    expect(Math.abs(foreign - Math.round(gross * rate))).toBeLessThanOrEqual(1);
    expect(foreign).toBeLessThan(Math.round(gross * ABROAD.canada.rate) / 10);
    expect(posted(sim, pay[0]!, 'expense', 'Agent Commission')).toBe(709_50 + 425_70);
    expect(posted(sim, pay[0]!, 'income', 'Per Diem')).toBeLessThan(0);

    // Saved and loaded with the year's contract running.
    sim = reload(sim);
    const career = careerOf(sim.player);
    const ends = career.termEnds!;
    expect(career.agencyId).toBe('gersh');

    // The contract's last third: with work booked in it, the agency offers three years more, and it's taken, once.
    walk(sim, pending(sim, 'career.agency_term')[0]!.at + MS_HOUR);
    expect(career.renewal).toEqual({ state: 'offered' });
    expect(Object.values(sim.universe.decisions).some((x) => x.refType === 'agency-renewal' && !x.resolvedAt)).toBe(true);
    const renewed = sim.must<{ termEnds: number }>({ kind: 'career.renew', payload: { accept: true } }).termEnds;
    expect(zonedParts(renewed, 'America/Los_Angeles').year).toBe(zonedParts(ends, 'America/Los_Angeles').year + 3);
    expect(sim.execute({ kind: 'career.renew', payload: { accept: true } }).error).toBe('No renewal is on offer.');
    expect(Object.values(sim.universe.decisions).some((x) => x.refType === 'agency-renewal' && !x.resolvedAt)).toBe(false);
    // The first contract's end passes, and they're still with the agency.
    walk(sim, ends + MS_DAY);
    expect(careerOf(sim.player).agencyId).toBe('gersh');
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});
