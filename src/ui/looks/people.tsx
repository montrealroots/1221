/**
 * SLATE — the people a life knows, opened where they are named.
 *
 * The People screen printed every name as text in a table row you pressed to
 * pick somebody for the invitation below it, and printed children and parents
 * as lines. Three kinds live here. A `contact` is somebody in
 * `systems/people.ts`: how you met, the hours together that make them what
 * they are to you (`levelOf`, at Hall’s fifty, ninety and two hundred), where
 * they live, when you last saw them and what happened between you. A `child`
 * is one of yours (`systems/children.ts`), and a `parent` one of the two who
 * raised you (`systems/parents.ts`), by role, since neither carries a name.
 *
 * A parent’s death is drawn when the life begins and held in the save, and so
 * is the year their care would begin. Neither is said here before it happens:
 * a look reads the world as it stands, and the future is not part of it.
 *
 * Nothing here calls `contactsOf` or `childrenOf`, which create the list they
 * read; looking writes nothing into the save (rule 14).
 */

import { formatMoney, saveCurrency } from '@/engine/core/money';
import { dateKey, formatDate, MS_DAY } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { HALL } from '@/engine/content/people';
import { levelOf, type Contact } from '@/engine/systems/people';
import { raisingMonth, type Child } from '@/engine/systems/children';
import { careHours, careMonthly, needsCare, type Parent } from '@/engine/systems/parents';
import { roleById } from '@/engine/systems/career';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { spokenList } from './words';
import { jobWhereMet } from './career';

const YEAR_MS = 365.2425 * MS_DAY;
const playerIn = (sim: Simulation): Person | undefined => sim.universe.people[sim.universe.playerId];
const townName = (id: string): string => CITIES.get(id)?.name ?? 'a town SLATE doesn’t know';
const zoneOf = (sim: Simulation, id: string): string => CITIES.get(id)?.timeZone ?? sim.homeZone;
const ageAt = (born: number, at: number): number => Math.floor((at - born) / YEAR_MS);
const dayOf = (sim: Simulation, instant: number): string => dateKey(instant, sim.homeZone);

function placeWay(id: string, detail: string): Way[] {
  return CITIES.get(id) ? [{ to: at('place', id), label: townName(id), detail }] : [];
}

/** What somebody is to you, as the People screen says it. */
function standing(c: Contact, person: Person): string {
  if (person.marriage?.contactId === c.id) return person.marriage.divorcing ? 'Your Spouse, Divorcing' : 'Your Spouse';
  if (c.livesWith !== undefined) return 'Your Partner, Living With You';
  if (c.dating?.couple !== undefined) return 'Your Partner';
  if (c.dating) return 'Seeing Each Other';
  return levelOf(c);
}

/** The hours to the next rung, or nothing at the top. */
function nextRung(c: Contact): { name: string; hours: number } | undefined {
  if (c.rival) return undefined;
  if (c.hours < HALL.casual) return { name: 'a casual friend', hours: HALL.casual - c.hours };
  if (c.hours < HALL.friend) return { name: 'a friend', hours: HALL.friend - c.hours };
  if (c.hours < HALL.close) return { name: 'a close friend', hours: HALL.close - c.hours };
  return undefined;
}

function metWords(c: Contact): string {
  if (c.met.how === 'school') return 'at school';
  if (c.met.how === 'online') return `on ${c.met.what ?? 'an app'}`;
  if (c.met.how === 'club') return `at ${c.met.what ?? 'a club'}`;
  return c.met.what ? `at work, on ${c.met.what}` : 'at work';
}

// ---------------------------------------------------------------------------
// Somebody you know
// ---------------------------------------------------------------------------

interface Known { person: Person; contact: Contact }

defineLook<Known>('contact', {
  gone: 'You’ve lost touch with them.',
  resolve: (sim, id) => {
    const person = playerIn(sim);
    const contact = person?.contacts?.find((c) => c.id === id);
    return person && contact ? { person, contact } : undefined;
  },
  seeds: (sim) => (playerIn(sim)?.contacts ?? []).map((c) => c.id),
  look: ({ person, contact: c }, { sim }) => {
    const zone = zoneOf(sim, c.cityId);
    const first = c.name.split(' ')[0];
    const rung = nextRung(c);
    const job = jobWhereMet(person, c);
    const kids = (person.children ?? []).filter((k) => k.otherParentId === c.id);
    const married = person.marriage?.contactId === c.id ? person.marriage : undefined;

    const ways: Way[] = [...placeWay(c.cityId, `Where ${first} lives`)];
    if (job) ways.push({ to: at('job', job.id), label: roleById(job.roleId).label, detail: `The job you met ${first} on` });
    ways.push({ to: at('day', dayOf(sim, c.met.at)), label: formatDate(c.met.at, zone), detail: `The day you met` });
    if (c.lastSeen !== undefined) ways.push({ to: at('day', dayOf(sim, c.lastSeen)), label: formatDate(c.lastSeen, zone), detail: `The last time you saw ${first}` });
    if (married) ways.push({ to: at('day', dayOf(sim, married.at)), label: formatDate(married.at, sim.homeZone), detail: 'The day you married' });
    for (const k of kids) ways.push({ to: at('child', k.id), label: k.name, detail: `Your child together, ${ageAt(k.born, sim.now)}` });

    const income = c.income && c.dating?.couple !== undefined
      ? (c.income.employed ? `${first} earns ${formatMoney(Math.round(c.income.annual * 100), c.income.currency, { cents: false })} a year.` : `${first} isn’t working.`)
      : '';

    return {
      name: c.name,
      kind: standing(c, person),
      summary: `You’ve spent ${Math.round(c.hours)} hours together since you met ${metWords(c)}${c.lastSeen !== undefined ? `, and last saw ${first} on ${formatDate(c.lastSeen, zone)}` : ', and you haven’t seen each other since'}.`,
      body: (
        <>
          <p className="small">
            {first} lives in {townName(c.cityId)}, is {ageAt(c.born, sim.now)}, and {c.spends === 'upscale' ? 'will eat anywhere, the dearest places too' : c.spends === 'mid' ? 'eats out at an ordinary restaurant but no dearer' : 'eats at the casual places and no dearer'}.{' '}
            {c.rival ? `${first} would rather not see you.` : rung ? `About ${Math.ceil(rung.hours)} more hours together would make ${first} ${rung.name}.` : `${first} is as close as a friend comes.`}{' '}
            {c.dating ? `You’ve been seeing each other since ${formatDate(c.dating.since, zone)}, ${c.dating.dates} ${c.dating.dates === 1 ? 'date' : 'dates'} kept.` : ''}{' '}
            {c.livesWith !== undefined ? `You’ve lived together since ${formatDate(c.livesWith, sim.homeZone)}.` : ''} {income}
          </p>
          {c.memory.length > 0 && (
            <ul className="small" style={{ margin: 0, paddingLeft: '1.2em' }}>
              {c.memory.slice(0, 6).map((m, i) => <li key={i}>{formatDate(m.at, zone)}: {m.what}</li>)}
            </ul>
          )}
          <div className="grid grid-3">
            <Stat label="Hours Together" value={String(Math.round(c.hours))} note="What makes a friend" />
            <Stat label="Age" value={String(ageAt(c.born, sim.now))} note={`Born ${formatDate(c.born, zone)}`} />
            <Stat label="To The Next" value={rung ? `${Math.ceil(rung.hours)} Hours` : 'None'} note={rung ? `To ${rung.name}` : 'As near as it gets'} />
          </div>
        </>
      ),
      ways,
      provenance: 'The hours that make a casual friend, a friend and a close one are as Hall measured them.',
    };
  },
});

// ---------------------------------------------------------------------------
// A child of yours
// ---------------------------------------------------------------------------

interface Yours { person: Person; child: Child }

defineLook<Yours>('child', {
  gone: 'There’s no child of yours by that name.',
  resolve: (sim, id) => {
    const person = playerIn(sim);
    const child = person?.children?.find((k) => k.id === id);
    return person && child ? { person, child } : undefined;
  },
  seeds: (sim) => (playerIn(sim)?.children ?? []).map((k) => k.id),
  look: ({ person, child }, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const age = ageAt(child.born, sim.now);
    const other = child.otherParentId ? person.contacts?.find((c) => c.id === child.otherParentId) : undefined;
    const withYou = child.livesWith !== 'them';
    const home = person.home?.cityId ?? person.currentLocationId;
    const others = (person.children ?? []).filter((k) => k.id !== child.id);
    const raising = withYou ? raisingMonth(sim, person, sim.now) : 0;
    const ways: Way[] = [];
    if (other) ways.push({ to: at('contact', other.id), label: other.name, detail: `Their other parent, who lives in ${townName(other.cityId)}` });
    ways.push(...placeWay(withYou ? home : (other?.cityId ?? home), withYou ? 'The town they grow up in, with you' : 'The town they grow up in, with their other parent'));
    ways.push({ to: at('day', dayOf(sim, child.born)), label: formatDate(child.born, sim.homeZone), detail: 'The day they were born' });
    for (const k of others) ways.push({ to: at('child', k.id), label: k.name, detail: `Their brother or sister, ${ageAt(k.born, sim.now)}` });
    return {
      name: child.name,
      kind: 'Your Child',
      parent: at('person', person.id),
      summary: `${child.name.split(' ')[0]} is ${age} and lives ${withYou ? 'with you' : `with ${other ? other.name.split(' ')[0] : 'their other parent'}`}.`,
      body: (
        <p className="small">
          Born on {formatDate(child.born, sim.homeZone)}.{' '}
          {withYou && raising > 0
            ? `Raising the children who live with you comes to ${formatMoney(raising, cur, { cents: false })} a month, your share, at what it costs where you live.`
            : withYou ? 'SLATE keeps no figure for what raising a child costs where you live.'
            : 'Their raising is their other parent’s, and support between you is on the People screen.'}
          {others.length > 0 ? ` ${spokenList(others.map((k) => k.name.split(' ')[0] ?? k.name))} ${others.length === 1 ? 'is' : 'are'} theirs too.` : ''}
        </p>
      ),
      ways,
    };
  },
});

// ---------------------------------------------------------------------------
// A parent
// ---------------------------------------------------------------------------

interface Theirs { person: Person; parent: Parent }

defineLook<Theirs>('parent', {
  gone: 'There’s nobody by that name in your family.',
  resolve: (sim, id) => {
    const person = playerIn(sim);
    const parent = person?.parents?.find((p) => p.role === id);
    return person && parent ? { person, parent } : undefined;
  },
  seeds: (sim) => (playerIn(sim)?.parents ?? []).map((p) => p.role),
  look: ({ person, parent: p }, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const she = p.role === 'mother';
    const pro = she ? 'she' : 'he';
    const Pro = she ? 'She' : 'He';
    const them = she ? 'her' : 'him';
    const name = she ? 'Your Mother' : 'Your Father';
    const age = ageAt(p.born, p.died ? Math.min(sim.now, p.dies) : sim.now);
    const caring = needsCare(p, sim.now);
    const monthly = caring ? careMonthly(sim, p) : 0;
    const other = (person.parents ?? []).find((x) => x.role !== p.role);
    const ways: Way[] = [...placeWay(p.cityId, `Where ${pro} ${p.died ? 'lived' : 'lives'}, the town you were born in`)];
    if (p.died) ways.push({ to: at('day', dayOf(sim, p.dies)), label: formatDate(p.dies, sim.homeZone), detail: `The day ${pro} died` });
    if (other) ways.push({ to: at('parent', other.role), label: other.role === 'mother' ? 'Your Mother' : 'Your Father', detail: other.died ? 'Your other parent, who has died' : `Your other parent, ${ageAt(other.born, sim.now)}` });
    return {
      name,
      kind: 'Family',
      parent: at('person', person.id),
      summary: p.died
        ? `${Pro} died at ${age}, in ${townName(p.cityId)}.`
        : caring
          ? `${Pro}’s ${age}, lives in ${townName(p.cityId)}, and needs ${p.care!.kind === 'facility' ? 'a care home' : 'care at home'} now.`
          : `${Pro}’s ${age}, lives in ${townName(p.cityId)}, and looks after ${them}self.`,
      body: caring ? (
        <p className="small">
          {p.how === 'pay'
            ? `You pay for it, ${formatMoney(monthly, cur, { cents: false })} a month at what care costs there.`
            : p.how === 'give'
              ? `You care for ${them} yourself, about ${Math.round(careHours(person))} hours a week, which needs you in ${townName(p.cityId)}.`
              : `The state sees to it for now. Paying for it would cost ${formatMoney(monthly, cur, { cents: false })} a month there; caring yourself, about ${Math.round(careHours(person))} hours a week.`}
        </p>
      ) : undefined,
      ways,
      provenance: 'When a parent dies is drawn from the life table for their country, year by year.',
    };
  },
});
