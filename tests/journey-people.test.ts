/**
 * The people journey (the owner's audit of 2026-10-06): three lives run
 * through the People screen, the clubs panel and the Homes screen by the
 * same commands the screens run, each step reading what the one before it
 * left.
 *
 * A drama school's graduate in New York, their class known at the degree
 * (`knowTheClass`, as a career's start knows it; a quick save knows nobody).
 * A meal out with a close friend is paid at the restaurant's price and
 * remembered; asked again two days on, the friend says another time, and a
 * second invitation over the same hour is refused. A drop-in dance class is
 * paid at the studio. Tinder Plus is paid for a month, brings its two
 * matches, and stopped, charges and brings nobody more; a match just met
 * would like to know them better first. A classmate asked out says yes, a
 * second can't be asked while they're seeing her, and a class and visits
 * make nine dates and a couple. Friends come to dinner, paid for three.
 * A shared room has no room for two; a flat of their own does, and with
 * her living there somebody's home while they're out, and the rent and the
 * bills are half a twin's who lives alone; split by what each earned, none
 * of either is theirs, who earned nothing last year. Saved and loaded. A
 * wedding refused while the bank is empty, then paid, the license and half
 * of it, and set once; married, a breakup is refused. Trying for a child,
 * she's expecting; the birth is billed by its share, the child raised a
 * month at a time at half the cost, and a passport applied for once. A
 * divorce: its fees, once; final six months on, she moves out, the rent
 * is theirs whole again, and the child, who stays, costs twice what it
 * did.
 *
 * A runner in New York is refused a kickball season with the bank empty,
 * then joins it and parkrun; a second join isn't a second fee. The game
 * answered, gone to by transit, and somebody met staying after; saved and
 * loaded; the next checked in on a run of errands. Renewed by hand for a
 * second fee and set to renew itself; then left: nothing more on the
 * calendar, no renewal at the season's end, and the friend made there not
 * seen again. Parkrun gone to on its own, then left, and gone to no more.
 *
 * A Los Angeles life of sixty, whose mother needs care at home: given
 * their evenings, then paid for at the month's price, then left to the
 * state, the charge stopping. A house bought, a spare room made a guest
 * room with a bed, and a classmate from New York asked to stay: asked
 * twice, refused; called off, nothing is spent on them; asked again,
 * saved and loaded, they arrive, eat at the host's cost each day and go
 * home, and once they're here it can't be called off. An adoption refused
 * with the bank empty, then paid, asked again refused, and the child home,
 * raised at the whole cost, nobody sharing it.
 *
 * Every law of the world holds at the end of each. Money comes into the
 * bank by a posting, never by setting a balance. One step the game gets
 * wrong is kept apart, skipped, as a defect: a guest room's bed is the
 * host's own, a second never sold.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { RESTAURANTS } from '@/engine/content/restaurants';
import { DROP_INS, DROP_IN_MINUTES } from '@/engine/content/dropins';
import { DINING_MINUTES } from '@/engine/content/dining';
import { HALL } from '@/engine/content/people';
import { contactsOf, knowTheClass, moveInRefusal, type Contact } from '@/engine/systems/people';
import { diningQuote } from '@/engine/systems/dining';
import { dropInPrice } from '@/engine/systems/life';
import { appPrice } from '@/engine/systems/dating';
import { billShare, marriageCost } from '@/engine/systems/marriage';
import { mealOf, rentOf } from '@/engine/systems/household';
import { someoneHome } from '@/engine/systems/away';
import { birthCost, childrenOf, raisingMonth } from '@/engine/systems/children';
import { cardRoom } from '@/engine/systems/credit';
import { CLUB_DUE_KIND, clubById, joinFee, membershipsOf, nextMeeting } from '@/engine/systems/clubs';
import { runErrands } from '@/engine/systems/trips';
import { CARE_VISIT_KIND, careMonthly, meetParents, needsCare } from '@/engine/systems/parents';
import { HOME, askingPrice, homesOf, listingsIn, livingIn, moveIntoOwned, ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import type { Fixtures } from '@/engine/content/homes';
import { roomList } from '@/engine/systems/rooms';
import { homeKeyOf, itemsOf } from '@/engine/systems/items';
import { foodOf } from '@/engine/systems/household';
import { SOCIAL } from '@/engine/content/people';

const NY = 'us-ny-newyork';
const NYZ = 'America/New_York';
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
/** Money in, as a gift posted against the opening balances, so the ledger still sums. */
const gift = (sim: Simulation, cents: number) => sim.post({ memo: 'A gift from the family', category: 'income', postings: [{ accountId: sim.player.primaryAccountId!, amount: cents }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -cents }] });
/** All their money out of the bank, as a posting, and how much it was; and the card filled to its limit, so nothing can pay. */
const emptyBank = (sim: Simulation): number => {
  let moved = 0;
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || (a.kind !== 'checking' && a.kind !== 'savings') || a.balance <= 0) continue;
    moved += a.balance;
    sim.post({ memo: 'Moved to a relative', category: 'transfer', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: a.balance }] });
  }
  const card = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'credit_card');
  if (card) { const room = cardRoom(sim.player, card); if (room > 0) sim.post({ memo: 'Spent on the card by the family', category: 'transfer', postings: [{ accountId: card.id, amount: -room }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: room }] }); }
  return moved;
};
const mark = (sim: Simulation) => sim.universe.transactions.length;
const posted = (sim: Simulation, re: RegExp, from = 0) => sim.universe.transactions.slice(from).filter((t) => re.test(t.memo));
/** What a transaction did to one account. */
const on = (t: { postings: { accountId: string; amount: number }[] }, id: string) => t.postings.filter((p) => p.accountId === id).reduce((a, p) => a + p.amount, 0);
/** What a run of transactions put on one of the ledger's expense lines. */
const spentOn = (sim: Simulation, line: string, ts: { postings: { accountId: string; amount: number }[] }[]) => ts.reduce((a, t) => a + on(t, sim.nominalAccount('expense', line).id), 0);
/** An hour some days on, in a town's own time. */
const hourOn = (sim: Simulation, days: number, hour: number, zone = NYZ) => { const p = zonedParts(sim.now + days * MS_DAY, zone); return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour, minute: 0 }, zone); };
/** The first of next month, in the evening, after the rent and the bills have gone. */
const nextFirst = (sim: Simulation, zone = NYZ) => { const p = zonedParts(sim.now, zone); return instantFromZoned({ year: p.month === 12 ? p.year + 1 : p.year, month: p.month === 12 ? 1 : p.month + 1, day: 1, hour: 21, minute: 0 }, zone); };
const pending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((s) => s.status === 'pending' && s.kind === kind);
const said = (c: Contact) => c.memory.map((m) => m.what);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('a graduate in New York', () => {
  it('sees friends, dates, moves in, marries, has a child, and divorces, the money and the memories following each step', () => {
    let sim = quickSave({ startLocationId: NY, homeRegionId: NY, livesWhereBorn: true, wealth: 'wealthy' }, 'jp-8');
    const me = sim.player.primaryAccountId!;
    // The class known at the degree, each as near as the three years made them.
    knowTheClass(sim, sim.player, [{ name: 'Maya Okafor', bond: 60 }, { name: 'Theo Reyes', bond: 30 }, { name: 'Grace Chen', bond: 10 }, { name: 'Ruth Adler', bond: 10, title: 'actress' }, { name: 'Iris Vance', bond: 10, title: 'actress' }]);
    const who = (name: string) => contactsOf(sim.player).find((c) => c.name === name)!;
    expect(who('Maya Okafor').hours).toBe(HALL.close);
    expect(who('Iris Vance')).toMatchObject({ hours: HALL.casual, single: true, interested: true, carries: true });

    // A meal out with Maya: said yes, on the calendar, and a second invitation over the same hour refused.
    const r = RESTAURANTS.find((x) => x.cityId === NY && x.tier === 'casual' && x.menu.some((m) => m.price !== null))!;
    const dish = r.menu.find((m) => m.price !== null)!.item;
    const meal = hourOn(sim, 2, 19);
    const invite = { contactId: who('Maya Okafor').id, at: meal, what: 'meal', restaurantId: r.id, item: dish };
    expect(sim.must<{ accepted: boolean }>({ kind: 'social.invite', payload: invite }).accepted).toBe(true);
    expect(said(who('Maya Okafor'))[0]).toBe(`Said yes to a meal at ${r.name}`);
    expect(sim.execute({ kind: 'social.invite', payload: invite }).error).toBe(`You have ${r.name} With Maya then.`);
    expect(pending(sim, 'social.meet')).toHaveLength(1);
    // Kept: their own meal paid at its price, the hours added, and remembered.
    let since = mark(sim);
    sim.advanceTo(meal + 60_000);
    const quote = diningQuote(sim, r, [dish], 'in')!.total;
    expect(spentOn(sim, 'Food', posted(sim, new RegExp(`^${escape(r.name)}$`), since))).toBe(quote);
    expect(who('Maya Okafor').hours).toBeCloseTo(HALL.close + DINING_MINUTES[r.tier] / 60, 9);
    expect(who('Maya Okafor').lastSeen).toBe(meal);
    expect(said(who('Maya Okafor'))[0]).toMatch(new RegExp(`^A meal at ${escape(r.name)}, `));
    // Asked again two days on, Maya says another time, and nothing goes on the calendar.
    const again = sim.must<{ accepted: boolean; reason?: string }>({ kind: 'social.invite', payload: { ...invite, at: hourOn(sim, 2, 19) } });
    expect(again.accepted).toBe(false);
    expect(again.reason).toMatch(/another time\.$/);
    expect(said(who('Maya Okafor'))[0]).toMatch(/^Said no to a meal at .*another time\.$/);
    expect(pending(sim, 'social.meet')).toEqual([]);

    // A drop-in dance class, paid at the studio's price, an hour of the day gone.
    const dance = DROP_INS.find((d) => d.id === 'bdc-open-class')!;
    sim.advanceTo(hourOn(sim, 1, 11));
    since = mark(sim);
    const t0 = sim.now;
    const lesson = sim.must<{ doneAt: number; paid: number }>({ kind: 'class.take', payload: { classId: dance.id } });
    expect(lesson.paid).toBe(dropInPrice(sim, dance));
    expect(lesson.doneAt).toBe(t0 + DROP_IN_MINUTES * 60_000);
    expect(spentOn(sim, 'Other', posted(sim, /^Broadway Dance Center, an open dance class$/, since))).toBe(lesson.paid);
    expect(sim.execute({ kind: 'class.take', payload: { classId: 'no-such-class' } }).error).toBe('There’s no such class.');

    // Tinder Plus for a month: paid now, two matches a month on and paid again; stopped, nothing more of either.
    const plus = appPrice(sim, sim.player, 'Tinder Plus')!;
    expect(plus).toBe(24_99);
    let c0 = checking(sim);
    expect(sim.must<{ paid: number }>({ kind: 'dating.app', payload: { label: 'Tinder Plus' } }).paid).toBe(plus);
    expect(checking(sim)).toBe(c0 - plus);
    since = mark(sim);
    const known = contactsOf(sim.player).length;
    sim.advanceBy(31 * MS_DAY);
    const matches = contactsOf(sim.player).slice(known).filter((c) => c.met.how === 'online');
    expect(matches).toHaveLength(2);
    expect(matches.every((c) => c.met.what === 'Tinder Plus' && c.cityId === NY && c.single && c.interested)).toBe(true);
    expect(posted(sim, /^Tinder Plus, the month$/, since).map((t) => on(t, me))).toEqual([-plus]);
    // A match just met would like to know them better first, and remembers being asked.
    const asked = sim.must<{ accepted: boolean; reason?: string }>({ kind: 'social.ask_out', payload: { contactId: matches[0]!.id } });
    expect(asked).toEqual({ accepted: false, reason: `${matches[0]!.name.split(' ')[0]} would like to know you better first.` });
    expect(said(matches[0]!)[0]).toMatch(/^Said no to going out: /);
    expect(sim.must<{ paid: number }>({ kind: 'dating.app', payload: {} }).paid).toBe(0);
    expect(sim.player.datingApp).toBeUndefined();
    since = mark(sim);
    const after = contactsOf(sim.player).length;
    sim.advanceBy(62 * MS_DAY);
    expect(posted(sim, /^Tinder Plus/, since)).toEqual([]);
    expect(contactsOf(sim.player)).toHaveLength(after);

    // Iris asked out says yes; while they're seeing each other, nobody else can be asked.
    const iris = who('Iris Vance');
    expect(sim.must<{ accepted: boolean }>({ kind: 'social.ask_out', payload: { contactId: iris.id } })).toEqual({ accepted: true });
    expect(iris.dating).toEqual({ since: sim.now, dates: 0 });
    expect(sim.execute({ kind: 'social.ask_out', payload: { contactId: who('Theo Reyes').id } }).error).toBe('You’re seeing Iris.');

    // The first date a class together, each paying their own; then visits, to the ninth, which makes a couple.
    const together = hourOn(sim, 1, 18);
    expect(sim.must<{ accepted: boolean }>({ kind: 'social.invite', payload: { contactId: iris.id, at: together, what: 'class', classId: dance.id } }).accepted).toBe(true);
    since = mark(sim);
    sim.advanceTo(together + 60_000);
    expect(spentOn(sim, 'Other', posted(sim, /^Broadway Dance Center, an open dance class$/, since))).toBe(dropInPrice(sim, dance));
    expect(said(iris)[0]).toBe('An Open Dance Class at Broadway Dance Center, together');
    expect(iris.dating!.dates).toBe(1);
    for (let tries = 0; tries < 30 && !iris.dating!.couple; tries += 1) {
      const when = hourOn(sim, 4, 19);
      if (sim.must<{ accepted: boolean }>({ kind: 'social.invite', payload: { contactId: iris.id, at: when, what: 'visit' } }).accepted) sim.advanceTo(when + 60_000);
      else sim.advanceBy(MS_DAY);
    }
    expect(iris.dating!.dates).toBe(9);
    expect(iris.dating!.couple).toBe(iris.lastSeen);
    expect(iris.income).toBeDefined();
    expect(sim.universe.notifications.some((n) => n.title === 'You And Iris Are A Couple')).toBe(true);

    // Maya and Theo to dinner: both say yes, and dinner is paid for three.
    const dinner = hourOn(sim, 4, 19);
    expect(sim.must<{ coming: string[] }>({ kind: 'social.host', payload: { contactIds: [who('Maya Okafor').id, who('Theo Reyes').id], at: dinner, what: 'dinner' } }).coming).toHaveLength(2);
    since = mark(sim);
    sim.advanceTo(dinner + 60_000);
    expect(spentOn(sim, 'Food', posted(sim, /^Dinner at home for 3$/, since))).toBe(mealOf(sim, sim.player) * 3);
    expect(said(who('Theo Reyes'))[0]).toMatch(/^Dinner at yours/);
    // Maya remembers the restaurant still, under the dinner.
    expect(said(who('Maya Okafor')).some((m) => m.startsWith(`A meal at ${r.name}`))).toBe(true);

    // Living together: not in a shared room, nor trying for a child before.
    expect(sim.execute({ kind: 'social.move_in', payload: { contactId: iris.id } }).error).toBe('A room in a shared flat has no room for two.');
    expect(sim.execute({ kind: 'social.try_for_child', payload: { trying: true } }).error).toBe('You try for a child with a partner you live with.');
    sim.must({ kind: 'home.move', payload: { kind: 'own' } });
    expect(moveInRefusal(sim.player, iris)).toBeUndefined();
    // An evening out with Maya on the calendar: alone, nobody's home while they're out.
    const out = hourOn(sim, 4, 19);
    expect(sim.must<{ accepted: boolean }>({ kind: 'social.invite', payload: { ...invite, at: out } }).accepted).toBe(true);
    expect(someoneHome(sim, sim.player, out + 10 * 60_000, out + 20 * 60_000)).toBe(false);
    // A twin of this life in which Iris doesn't move in, for the falsifiability test.
    const alone = reload(sim);
    expect(sim.must<{ since: number }>({ kind: 'social.move_in', payload: { contactId: iris.id } }).since).toBe(sim.now);
    expect(said(iris)[0]).toBe('Moved in with you');
    expect(sim.execute({ kind: 'social.move_in', payload: { contactId: iris.id } }).error).toBe('Iris lives with you already.');
    // With Iris living there, somebody is; in the twin, still nobody.
    expect(someoneHome(sim, sim.player, out + 10 * 60_000, out + 20 * 60_000)).toBe(true);
    expect(someoneHome(alone, alone.player, out + 10 * 60_000, out + 20 * 60_000)).toBe(false);

    // The first of the month: the landlord's check for half the rent, and half the twin's bills.
    expect(billShare(sim, sim.player)).toBe(0.5);
    expect(billShare(alone, alone.player)).toBe(1);
    const rentCheck = (s: Simulation) => (s.player.payments?.checks ?? []).filter((c) => c.memo === 'Rent').at(-1)?.amount;
    const billed = (s: Simulation, from: number) => spentOn(s, 'Bills', posted(s, /^Bills$/, from));
    const rent = rentOf(sim, sim.player);
    since = mark(sim);
    const twinSince = mark(alone);
    sim.advanceTo(nextFirst(sim));
    alone.advanceTo(sim.now);
    expect(rentCheck(alone)).toBe(rent);
    expect(rentCheck(sim)).toBe(Math.round(rent * 0.5));
    expect(billed(alone, twinSince)).toBeGreaterThan(0);
    expect(Math.abs(billed(sim, since) - billed(alone, twinSince) / 2)).toBeLessThanOrEqual(1);
    // Split by what each earned last year instead: they earned nothing in 2025 and Iris earns hers, so
    // their share is nothing, and the next month no check goes to the landlord and no bills are theirs.
    expect(iris.income).toMatchObject({ employed: true });
    sim.must({ kind: 'social.split', payload: { how: 'income' } });
    expect(billShare(sim, sim.player)).toBe(0);
    since = mark(sim);
    const split = nextFirst(sim);
    sim.advanceTo(split);
    expect((sim.player.payments?.checks ?? []).filter((c) => c.memo === 'Rent' && c.clearsAt > split - MS_DAY)).toEqual([]);
    expect(billed(sim, since)).toBe(0);
    // Even again.
    sim.must({ kind: 'social.split', payload: { how: 'even' } });
    expect(billShare(sim, sim.player)).toBe(0.5);

    // Saved and loaded: the couple, the home they share, and what everyone remembers.
    sim = reload(sim);
    const partner = () => contactsOf(sim.player).find((c) => c.name === 'Iris Vance')!;
    expect(partner().livesWith).toBeDefined();
    expect(partner().dating).toMatchObject({ dates: 9, couple: expect.any(Number) });
    expect(said(partner())).toContain('An Open Dance Class at Broadway Dance Center, together');
    expect(said(who('Maya Okafor')).some((m) => m.startsWith(`A meal at ${r.name}`))).toBe(true);
    expect(billShare(sim, sim.player)).toBe(0.5);
    expect(sim.player.home?.kind).toBe('own');

    // A wedding asked for with the bank emptied: refused, and nothing taken.
    const cost = marriageCost(sim, sim.player, true)!;
    expect(cost.fee).toBe(35_00);
    expect(cost.wedding).toBe(Math.round(34_200_00 * 0.5));
    const moved = emptyBank(sim);
    expect(sim.execute({ kind: 'social.marry', payload: { contactId: partner().id, wedding: true } }).error).toBe('The bank couldn’t pay for it.');
    expect(checking(sim)).toBe(0);
    expect(pending(sim, 'social.wedding')).toEqual([]);
    gift(sim, moved);
    // Paid: the license and their half of the wedding, the day after New York's one-day wait, and set once.
    c0 = checking(sim);
    const wedding = sim.must<{ at: number; paid: number }>({ kind: 'social.marry', payload: { contactId: partner().id, wedding: true } });
    expect(wedding.paid).toBe(cost.fee + cost.wedding);
    expect(checking(sim)).toBe(c0 - wedding.paid);
    expect(sim.execute({ kind: 'social.marry', payload: { contactId: partner().id, wedding: true } }).error).toBe('Your wedding is already set.');
    expect(checking(sim)).toBe(c0 - wedding.paid);
    sim.advanceTo(wedding.at + 7 * 3_600_000);
    expect(sim.player.marriage).toMatchObject({ contactId: partner().id, at: wedding.at });
    expect(said(partner())).toContain('Married you');
    expect(pending(sim, 'social.anniversary')).toHaveLength(1);
    // Married, only a divorce ends it.
    expect(sim.execute({ kind: 'social.break_up', payload: { contactId: partner().id } }).error).toBe('You’re married: only a divorce ends it.');

    // Trying for a child; asked twice, the family's month is on the calendar once.
    expect(sim.must<{ trying: boolean }>({ kind: 'social.try_for_child', payload: { trying: true } }).trying).toBe(true);
    sim.must({ kind: 'social.try_for_child', payload: { trying: true } });
    expect(pending(sim, 'child.month')).toHaveLength(1);
    for (let m = 0; m < 36 && !sim.player.pregnancy; m += 1) sim.advanceBy(31 * MS_DAY);
    const expecting = sim.player.pregnancy!;
    expect(expecting).toMatchObject({ carrier: 'them', contactId: partner().id });
    expect(sim.universe.notifications.some((n) => n.title === 'A Baby On The Way')).toBe(true);
    // Born on the day: the birth billed at their share, Iris's carried, and the child theirs and hers.
    const birth = birthCost(sim, sim.player, 'them', partner(), expecting.due);
    since = mark(sim);
    sim.advanceTo(expecting.due + 3_600_000);
    const child = childrenOf(sim.player)[0]!;
    expect(child).toMatchObject({ born: expecting.due, otherParentId: partner().id });
    expect(sim.player.pregnancy).toBeUndefined();
    expect(sim.player.trying).toBeUndefined();
    expect(spentOn(sim, 'Medical Care', posted(sim, /^The birth, your share/, since))).toBe(Math.round(birth.amount * 0.5));
    // A month on, raising the child, half of it theirs.
    since = mark(sim);
    sim.advanceBy(32 * MS_DAY);
    const raising = posted(sim, /^Raising the children, your share$/, since);
    expect(raising).toHaveLength(1);
    const half = -on(raising[0]!, me);
    expect(half).toBe(Math.round(Math.round(310_605 / 17 / 12 * 100) * 0.5));
    expect(half).toBe(raisingMonth(sim, sim.player, sim.now));

    // The child's passport: the State Department's child fee, ready in six weeks; applied for again, refused and not charged.
    c0 = checking(sim);
    const passport = sim.must<{ paid: number; readyAt: number }>({ kind: 'children.passport', payload: { childId: child.id } });
    expect(passport.paid).toBe(135_00);
    expect(passport.readyAt).toBe(sim.now + 42 * MS_DAY);
    expect(checking(sim)).toBe(c0 - 135_00);
    expect(sim.execute({ kind: 'children.passport', payload: { childId: child.id } }).error).toBe(`${child.name.split(' ')[0]} has a passport.`);
    expect(checking(sim)).toBe(c0 - 135_00);

    // A divorce: New York's court fees, once; final six months on.
    c0 = checking(sim);
    const divorce = sim.must<{ finalAt: number }>({ kind: 'social.divorce', payload: {} });
    expect(posted(sim, /^The divorce’s court fees$/).map((t) => on(t, me))).toEqual([-(210 + 95 + 30) * 100]);
    expect(divorce.finalAt).toBe(sim.now + 183 * MS_DAY);
    expect(sim.execute({ kind: 'social.divorce', payload: {} }).error).toBe('Your divorce is under way already.');
    expect(posted(sim, /^The divorce’s court fees$/)).toHaveLength(1);
    sim.advanceTo(divorce.finalAt + MS_DAY);
    expect(sim.player.marriage).toBeUndefined();
    expect(partner().livesWith).toBeUndefined();
    expect(partner().dating).toBeUndefined();
    expect(said(partner())[0]).toBe('Divorced');
    expect(sim.universe.notifications.some((n) => n.title === 'Divorced')).toBe(true);
    // She's gone: nobody's home while they're out, and the rent and the child are theirs whole.
    expect(billShare(sim, sim.player)).toBe(1);
    const evening = hourOn(sim, 4, 19);
    expect(sim.must<{ accepted: boolean }>({ kind: 'social.invite', payload: { ...invite, contactId: who('Maya Okafor').id, at: evening } }).accepted).toBe(true);
    expect(someoneHome(sim, sim.player, evening + 10 * 60_000, evening + 20 * 60_000)).toBe(false);
    since = mark(sim);
    const whole = nextFirst(sim);
    sim.advanceTo(whole);
    expect(rentCheck(sim)).toBe(rentOf(sim, sim.player));
    sim.advanceBy(32 * MS_DAY);
    const alone2 = posted(sim, /^Raising the children, your share$/, since).map((t) => -on(t, me));
    expect(alone2.length).toBeGreaterThanOrEqual(1);
    expect(alone2.every((x) => Math.abs(x - 2 * half) <= 1)).toBe(true);
    expect(childrenOf(sim.player)).toHaveLength(1);

    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});

describe('a runner in New York', () => {
  it('joins a kickball season and parkrun, goes, checks in, renews, and leaves, the dues and the meetings stopping', () => {
    let sim = quickSave({ startLocationId: NY, homeRegionId: NY, livesWhereBorn: true, wealth: 'wealthy' }, 'jp-club');
    const me = sim.player.primaryAccountId!;
    const volo = clubById('volo-ny-kickball')!;
    const parkrun = clubById('parkrun-brooklyn-bridge')!;
    const member = (id: string) => membershipsOf(sim.player).find((m) => m.clubId === id);
    const clubItems = (id: string) => sim.universe.scheduled.filter((s) => s.status === 'pending' && s.kind.startsWith('club.') && s.payload.clubId === id);
    const fee = joinFee(sim, volo);
    expect(fee).toBe(135_00);

    // With the bank emptied, the season's fee can't be paid: not joined, nothing on the calendar.
    const moved = emptyBank(sim);
    expect(sim.execute({ kind: 'club.join', payload: { clubId: volo.id, by: 'transit' } }).error).toBe('The bank can’t pay the season’s fee.');
    expect(membershipsOf(sim.player)).toEqual([]);
    expect(clubItems(volo.id)).toEqual([]);
    gift(sim, moved);

    // Joined, by transit, asking each time: the season paid once; a second join is refused and charges nothing.
    let c0 = checking(sim);
    const joined = sim.must<{ paid: number; first: number }>({ kind: 'club.join', payload: { clubId: volo.id, by: 'transit' } });
    expect(joined).toEqual({ paid: fee, first: nextMeeting(volo, sim.now) });
    expect(checking(sim)).toBe(c0 - fee);
    expect(posted(sim, /^Volo Kickball, a season$/).map((t) => on(t, me))).toEqual([-fee]);
    expect(sim.execute({ kind: 'club.join', payload: { clubId: volo.id, by: 'transit' } }).error).toBe('You’re in it.');
    expect(checking(sim)).toBe(c0 - fee);
    expect(member(volo.id)).toMatchObject({ attend: 'ask', by: 'transit', until: joined.first + 5 * 7 * MS_DAY });
    // Parkrun, free, gone to on its own on foot.
    expect(sim.must<{ paid: number }>({ kind: 'club.join', payload: { clubId: parkrun.id, attend: 'always', by: 'foot' } }).paid).toBe(0);

    // The first game answered going; a time it doesn't meet can't be answered.
    sim.must({ kind: 'club.rsvp', payload: { clubId: volo.id, at: joined.first, going: true } });
    expect(sim.execute({ kind: 'club.rsvp', payload: { clubId: volo.id, at: joined.first + 3_600_000, going: true } }).error).toBe('That isn’t one of its next meetings.');
    // Saved and loaded with the answer standing.
    sim = reload(sim);
    expect(member(volo.id)!.rsvp?.[String(joined.first)]).toBe('going');

    // The clock stops at the time to set out; gone by transit, staying after, and somebody met.
    const stop = sim.advanceTo(joined.first + MS_DAY, { stopOnPlayerRequired: true });
    expect(stop.interruptedBy?.kind).toBe(CLUB_DUE_KIND);
    let since = mark(sim);
    const went = sim.must<{ at: number; met?: string; minutes: number }>({ kind: 'club.go', payload: { clubId: volo.id, by: 'transit', stayAfter: true } });
    expect(went.at).toBe(joined.first);
    expect(went.minutes).toBe(volo.minutes);
    expect(posted(sim, /transit, a ride$/, since)).toHaveLength(2);
    const m = member(volo.id)!;
    expect(m.went).toBe(1);
    expect(m.met).toHaveLength(1);
    const teammate = contactsOf(sim.player).find((c) => c.id === m.contactId)!;
    expect(teammate.met).toMatchObject({ how: 'club', what: 'Volo Kickball' });
    expect(said(teammate)).toContain('At Volo Kickball');
    expect(contactsOf(sim.player).find((c) => c.id === m.met![0])!.name).toBe(went.met);
    // Gone, the same game can't be gone to again, and the next isn't for days.
    expect(sim.execute({ kind: 'club.go', payload: { clubId: volo.id, by: 'transit' } }).error).toMatch(/set out within 3 hours/);

    // The next game checked in at on a run of errands, as Set Out would; not before setting out.
    const second = nextMeeting(volo, sim.now);
    sim.advanceTo(second - 2 * 3_600_000);
    expect(sim.execute({ kind: 'club.check_in', payload: { clubId: volo.id } }).error).toBe('You check in when you’re there.');
    expect(runErrands(sim, { by: 'transit', stops: [{ kind: 'club.check_in', payload: { clubId: volo.id }, leg: 'errand' }] })).toEqual({ done: 1 });
    expect(m.went).toBe(2);
    expect(m.log?.[0]).toMatchObject({ at: second, what: 'went' });
    expect(sim.player.trip).toBeUndefined();

    // Set to renew itself, and renewed by hand now for a second season's fee.
    sim.must({ kind: 'club.set', payload: { clubId: volo.id, renew: true } });
    expect(m.renew).toBe(true);
    c0 = checking(sim);
    const until = m.until!;
    const renewed = sim.must<{ paid: number; until: number }>({ kind: 'club.renew', payload: { clubId: volo.id } });
    expect(renewed).toEqual({ paid: fee, until: until + 6 * 7 * MS_DAY });
    expect(checking(sim)).toBe(c0 - fee);
    expect(sim.execute({ kind: 'club.renew', payload: { clubId: parkrun.id } }).error).toBe('It doesn’t run by the season.');

    // Parkrun on its own meanwhile: Saturdays gone to without a press.
    expect(member(parkrun.id)!.went).toBeGreaterThanOrEqual(1);

    // Left: nothing of it on the calendar, refused a second time, and past the renewed season's end
    // no renewal is charged, no game is gone to, and the teammate isn't seen again.
    expect(sim.must<{ left: boolean }>({ kind: 'club.leave', payload: { clubId: volo.id } })).toEqual({ left: true });
    expect(member(volo.id)).toBeUndefined();
    expect(clubItems(volo.id)).toEqual([]);
    expect(sim.execute({ kind: 'club.leave', payload: { clubId: volo.id } }).error).toBe('You aren’t in it.');
    expect(sim.execute({ kind: 'club.go', payload: { clubId: volo.id, by: 'transit' } }).error).toBe('You aren’t in it.');
    const hours = teammate.hours;
    since = mark(sim);
    sim.advanceTo(renewed.until + 14 * MS_DAY);
    expect(posted(sim, /^Volo Kickball/, since)).toEqual([]);
    expect(teammate.hours).toBe(hours);
    expect(sim.universe.notifications.some((n) => n.title === 'Renewed' || n.title === 'A Season Over' || n.title === 'Not Renewed')).toBe(false);
    expect(clubItems(volo.id)).toEqual([]);

    // Parkrun left: gone to no more, and its runner not seen again.
    expect(member(parkrun.id)!.went).toBeGreaterThanOrEqual(6);
    const runner = contactsOf(sim.player).find((c) => c.id === member(parkrun.id)!.contactId)!;
    const ran = runner.hours;
    sim.must({ kind: 'club.leave', payload: { clubId: parkrun.id } });
    expect(clubItems(parkrun.id)).toEqual([]);
    sim.advanceBy(21 * MS_DAY);
    expect(member(parkrun.id)).toBeUndefined();
    expect(runner.hours).toBe(ran);
    expect(runner.lastSeen).toBeLessThan(sim.now - 14 * MS_DAY);

    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});

describe('a Los Angeles life of sixty', () => {
  it('sees to a mother’s care, buys a house, has a friend from New York to stay, and adopts', () => {
    const LA = 'us-ca-losangeles';
    const LAZ = 'America/Los_Angeles';
    let sim = quickSave({ startLocationId: LA, homeRegionId: LA, livesWhereBorn: true, wealth: 'wealthy', birthYear: 1966 }, 'jp-parents-b');
    const me = sim.player.primaryAccountId!;
    // The class known at the degree, in New York, where a drama school's class goes.
    knowTheClass(sim, sim.player, [{ name: 'Maya Okafor', bond: 30 }]);
    const maya = () => contactsOf(sim.player).find((c) => c.name === 'Maya Okafor')!;
    expect(maya()).toMatchObject({ cityId: NY, hours: HALL.friend });

    // Their mother needs care at home in Los Angeles; their father doesn't.
    const [mother, father] = meetParents(sim, sim.player, sim.now);
    expect(needsCare(mother!, sim.now)).toBe(true);
    expect(mother!.care?.kind).toBe('home');
    expect(needsCare(father!, sim.now)).toBe(false);
    expect(sim.execute({ kind: 'family.care', payload: { role: 'father', how: 'pay' } }).error).toBe('They don’t need care.');
    // Given themselves: an evening visit tomorrow, and each visit books the next.
    expect(sim.must<{ how: string }>({ kind: 'family.care', payload: { role: 'mother', how: 'give' } }).how).toBe('give');
    expect(pending(sim, CARE_VISIT_KIND)).toHaveLength(1);
    expect(pending(sim, CARE_VISIT_KIND)[0]!.requiresPlayer).toBe(true);
    sim.advanceBy(3 * MS_DAY);
    expect(pending(sim, CARE_VISIT_KIND)).toHaveLength(1);
    expect(pending(sim, CARE_VISIT_KIND)[0]!.at).toBeGreaterThan(sim.now);
    // Paid for instead: the evenings free again, and the month's care charged on the first.
    const monthly = careMonthly(sim, mother!);
    expect(monthly).toBeGreaterThan(0);
    expect(sim.must<{ monthly: number }>({ kind: 'family.care', payload: { role: 'mother', how: 'pay' } }).monthly).toBe(monthly);
    expect(pending(sim, CARE_VISIT_KIND)).toEqual([]);
    let since = mark(sim);
    sim.advanceTo(nextFirst(sim, LAZ));
    expect(posted(sim, /^Your mother’s care$/, since).map((t) => on(t, me))).toEqual([-monthly]);
    // Left to the state and her own means: the next month nothing.
    sim.must({ kind: 'family.care', payload: { role: 'mother', how: 'none' } });
    since = mark(sim);
    sim.advanceTo(nextFirst(sim, LAZ));
    expect(posted(sim, /^Your mother’s care$/, since)).toEqual([]);
    expect(sim.player.parents![0]!.how).toBeUndefined();

    // A house with spare bedrooms, bought outright, closed on thirty days on.
    const listing = listingsIn(sim, LA).find((l) => l.type === 'house' && l.beds >= 3)!;
    const price = askingPrice(sim, listing);
    gift(sim, price * 2);
    expect(sim.must<{ answer: string }>({ kind: 'home.offer', payload: { listingId: listing.id, price, down: 1, live: true, inspect: false } }).answer).toBe('accepted');
    sim.advanceBy((HOME.closingDays + 1) * MS_DAY);
    const house = homesOf(sim.player).find((h) => h.listingId === listing.id)!;
    expect(livingIn(sim.player)?.id).toBe(house.id);
    // A spare bedroom made a guest room, and a bed bought and put in it.
    const spare = roomList(sim, sim.player)[1]!;
    sim.must({ kind: 'home.room_use', payload: { roomId: spare.id, use: 'guest' } });
    expect(sim.execute({ kind: 'social.ask_to_stay', payload: { contactId: maya().id, from: hourOn(sim, 3, 14, LAZ), nights: 3 } }).error).toBe('You need a guest room with a bed in it.');
    sim.must({ kind: 'home.furnish', payload: { piece: 'bed' } });
    const bed = itemsOf(sim.player).find((i) => i.kind === 'furniture:bed' && i.at.kind === 'home' && i.at.home === homeKeyOf(sim.player.home))!;
    sim.must({ kind: 'items.move', payload: { itemId: bed.id, to: { kind: 'home', home: homeKeyOf(sim.player.home)!, room: spare.id } } });

    // Maya asked for three nights; asked again, refused; called off before she comes, and nothing spent on her.
    const first = hourOn(sim, 3, 14, LAZ);
    const asked = sim.must<{ from: number; until: number; roomId: string }>({ kind: 'social.ask_to_stay', payload: { contactId: maya().id, from: first, nights: 3 } });
    expect(asked).toEqual({ from: first, until: first + 3 * MS_DAY, roomId: spare.id });
    expect(said(maya())[0]).toBe('Said yes to staying 3 nights');
    expect(sim.execute({ kind: 'social.ask_to_stay', payload: { contactId: maya().id, from: first, nights: 3 } }).error).toMatch(/^Maya is coming to stay already, from /);
    expect(sim.must<{ cancelled: boolean }>({ kind: 'social.cancel_stay', payload: { contactId: maya().id } })).toEqual({ cancelled: true });
    expect(said(maya())[0]).toBe('You called off their stay');
    expect(maya().stay).toBeUndefined();
    expect(pending(sim, 'social.stay')).toEqual([]);
    expect(sim.execute({ kind: 'social.cancel_stay', payload: { contactId: maya().id } }).error).toBe('Nobody’s coming to stay.');
    since = mark(sim);
    sim.advanceTo(first + 5 * MS_DAY);
    expect(posted(sim, /^Food for Maya, staying$/, since)).toEqual([]);
    expect(maya().hours).toBe(HALL.friend);

    // Asked again, saved and loaded before she comes.
    const arrives = hourOn(sim, 3, 14, LAZ);
    sim.must({ kind: 'social.ask_to_stay', payload: { contactId: maya().id, from: arrives, nights: 3 } });
    sim = reload(sim);
    expect(maya().stay).toEqual({ from: arrives, nights: 3, roomId: spare.id });
    // She arrives: a visit's hours, and once she's here, it can't be called off.
    sim.advanceTo(arrives + 3_600_000);
    expect(said(maya())[0]).toBe('Arrived to stay');
    expect(maya().hours).toBe(HALL.friend + SOCIAL.visitMinutes / 60);
    expect(sim.execute({ kind: 'social.cancel_stay', payload: { contactId: maya().id } }).error).toBe('Maya is here already.');
    // Each day she eats at the host's cost, a day's groceries where they live, and then goes home.
    since = mark(sim);
    const day = foodOf(sim, sim.player);
    sim.advanceTo(arrives + 4 * MS_DAY);
    const meals = posted(sim, /^Food for Maya, staying$/, since);
    expect(meals).toHaveLength(3);
    expect(meals.every((t) => on(t, sim.nominalAccount('expense', 'Food').id) === day)).toBe(true);
    expect(maya().stay).toBeUndefined();
    expect(said(maya())[0]).toBe('Stayed 3 nights, and went home');
    expect(maya().hours).toBe(HALL.friend + 4 * SOCIAL.visitMinutes / 60);
    expect(maya().lastSeen).toBe(arrives + 3 * MS_DAY);

    // An adoption asked for with the bank emptied: refused, nothing taken, and nothing on the way.
    const moved = emptyBank(sim);
    expect(sim.execute({ kind: 'social.adopt', payload: { kind: 'adoption' } }).error).toMatch(/is more than the bank can cover\.$/);
    expect(sim.player.familyPath).toBeUndefined();
    expect(checking(sim)).toBe(0);
    gift(sim, moved);
    // Paid: California's private agency at its cost; asked again, refused.
    const c0 = checking(sim);
    const adopting = sim.must<{ arrives: number; paid: number }>({ kind: 'social.adopt', payload: { kind: 'adoption' } });
    expect(adopting.paid).toBe((20_000 + 45_000) / 2 * 100);
    expect(checking(sim)).toBe(c0 - adopting.paid);
    expect(sim.execute({ kind: 'social.adopt', payload: { kind: 'adoption' } }).error).toBe('A child is on the way already.');
    expect(checking(sim)).toBe(c0 - adopting.paid);
    // The child comes home, and a month on is raised at the whole cost, nobody to share it.
    sim.advanceTo(adopting.arrives + 3_600_000);
    expect(childrenOf(sim.player)).toHaveLength(1);
    expect(childrenOf(sim.player)[0]!.otherParentId).toBeUndefined();
    expect(sim.player.adopted).toHaveLength(1);
    expect(sim.universe.notifications.some((n) => n.title === 'Your Child Came Home')).toBe(true);
    since = mark(sim);
    sim.advanceBy(32 * MS_DAY);
    const raising = posted(sim, /^Raising the children, your share$/, since).map((t) => -on(t, me));
    expect(raising).toEqual([Math.round(310_605 / 17 / 12 * 100)]);
    expect(billShare(sim, sim.player)).toBe(1);

    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});

describe('a guest room and the host’s own bed', () => {
  // Found by this journey on 2026-10-06 and fixed: a home held one bed at most, so a guest room's bed had to be the
  // host's own (`furnishRefusal` now counts beds against bedrooms, and `ownBed` leaves a guest room's out).
  it('can be bought a second bed for the guest room', () => {
    const sim = quickSave({ startLocationId: NY, homeRegionId: NY, livesWhereBorn: true, wealth: 'wealthy' }, 'jp-bed');
    const facts = { type: 'house', address: 'Test Home', beds: 3, baths: 2, size: 1_800, built: 2000, features: ['yard'], parts: {}, hoaUsd: 0, fixtures: { bathtub: true, dishwasher: true, laundry: 'in-unit', cooling: 'central', outdoor: 'yard', gym: 'none' } as Fixtures, lot: 12_000 } as HomeFacts;
    moveIntoOwned(sim, sim.player, ownBuilt(sim, sim.player, { cityId: NY, facts, price: 900_000_00, closing: 0 }));
    sim.must({ kind: 'home.furnish', payload: { piece: 'bed' } });
    const spare = roomList(sim, sim.player)[1]!;
    sim.must({ kind: 'home.room_use', payload: { roomId: spare.id, use: 'guest' } });
    const bed = itemsOf(sim.player).find((i) => i.kind === 'furniture:bed')!;
    sim.must({ kind: 'items.move', payload: { itemId: bed.id, to: { kind: 'home', home: homeKeyOf(sim.player.home)!, room: spare.id } } });
    expect(sim.execute({ kind: 'home.furnish', payload: { piece: 'bed' } }).ok).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
