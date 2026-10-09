/**
 * SLATE — the working life, opened where it is named.
 *
 * The Career screen printed every part, job, agency and award as a dead word:
 * a role’s label in four tables, a booking’s town and dates in a line, an
 * agency’s name in a heading and a table. Five kinds live here, and every
 * figure in them is one the career system already keeps.
 *
 * A `part` is a role in `content/career.ts`: what its contract pays a unit on
 * today’s date (`rateOf`), and your chance in the room now (`bookingChance`).
 * A `job` is a booking of yours: its rate (`unitRate`), the days worked, and
 * what it has paid, read from the year’s wage record by the booking it was
 * recorded against (`earnings.ts`, `employers`), not worked out again here.
 * An `agency` and a `manager` are the firms in the content, yours or not. An
 * `award` is an entry: its category, the field and slots the content
 * publishes, and the chances `awardChances` gives.
 *
 * Every read here is of the save as it stands: `career`, `contacts`,
 * `earnings` and `awards` are read where they are and never created, because
 * looking at a thing writes nothing (rule 14). `careerOf` and `entriesOf`
 * create the record they ask for, which is why neither is called.
 */

import { formatMoney, saveCurrency, type Money } from '@/engine/core/money';
import { dateKey, formatDate, instantFromZoned } from '@/engine/core/time';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import { AGENCIES, AGENT_COMMISSION, MANAGEMENT, MANAGERS, ROLES, type Agency, type Manager, type Role } from '@/engine/content/career';
import { AWARD_DATES, EMMY_FIELDS, OTHER_FIELDS } from '@/engine/content/awards';
import { bookingChance, expectedGross, roleById, unitRate, workCityOf, workDays, rateOf, WORK_KIND, type Booking } from '@/engine/systems/career';
import { awardChances, categoryName, type AwardEntry } from '@/engine/systems/awards';
import { focusOf } from '@/engine/systems/school';
import { projectById } from '@/engine/systems/industry';
import { companyById } from '@/engine/content/industry';
import { representationReview } from '@/engine/systems/representation';
import type { Contact } from '@/engine/systems/people';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { spokenList } from './words';

/** Who a part’s contract is with, as the Career screen names it. */
const UNION_NAMES: Readonly<Record<Role['union'], string>> = {
  sag: 'SAG-AFTRA', equity: 'Actors’ Equity', 'equity-uk': 'Equity (UK)', 'irish-equity': 'Irish Equity',
  anda: 'ANDA', actra: 'ACTRA', caea: 'Canadian Actors’ Equity',
};

const MEDIUM: Readonly<Record<Role['medium'], string>> = { screen: 'Screen Work', stage: 'Stage Work', voice: 'Voice Work' };

const playerIn = (sim: Simulation): Person | undefined => sim.universe.people[sim.universe.playerId];
const townName = (id: string): string => CITIES.get(id)?.name ?? 'a town SLATE doesn’t know';
const pct = (x: number): string => `${Math.round(x * 1000) / 10}%`;
const dayOf = (sim: Simulation, instant: number): string => dateKey(instant, sim.homeZone);
const findRole = (id: string): Role | undefined => ROLES.find((r) => r.id === id);
/** A country’s name inside a sentence: "the United States", "Mexico". */
const countryWords = (id: string): string => {
  const name = COUNTRIES.get(id)?.name;
  if (!name) return 'its own country';
  return /^(United|Netherlands|Philippines|Czech|Dominican|Central African|Bahamas|Gambia)/.test(name) ? `the ${name}` : name;
};

/** What one unit of a part is called: a day, a week, an episode or a session. */
function unitOf(role: Role): string {
  if (role.series) return 'episode';
  if (role.medium === 'voice') return 'session';
  return role.medium === 'stage' ? 'week' : 'day';
}

/** How long a booking runs, said the way the Jobs list says it. */
function spanOf(b: Booking, role: Role): string {
  if (role.series) return `${role.series.episodes} episodes over ${role.series.weeks} weeks`;
  if (role.medium === 'voice') return `${b.units} ${b.units === 1 ? 'session' : 'sessions'}`;
  if (role.arc) return `${b.units} episodes, a week each`;
  return role.medium === 'screen' ? `${b.units} ${b.units === 1 ? 'day' : 'days'}` : `${b.rehearsalWeeks} weeks of rehearsal and ${b.units} of performances`;
}

/** What a booking has paid, gross, across every year’s wage record. Read, never computed again. */
export function paidOn(person: Person, bookingId: string): Money {
  return Object.values(person.earnings?.years ?? {}).reduce((sum, y) => sum + (y.employers?.[bookingId] ?? 0), 0);
}

/**
 * The job a castmate was met on.
 *
 * A contact met at work carries the part’s label and the town (`metAtWork`),
 * and is made the day the job’s last call is worked. The booking is the
 * finished one of that part in that town whose last call is nearest the day
 * you met; two of the same part in the same town are told apart by when.
 */
export function jobWhereMet(person: Person, c: Contact): Booking | undefined {
  if (c.met.how !== 'work' || !c.met.what) return undefined;
  const candidates = (person.career?.bookings ?? []).filter((b) => b.status === 'worked'
    && findRole(b.roleId)?.label === c.met.what && workCityOf(b) === c.cityId);
  let best: Booking | undefined;
  let gap = Number.POSITIVE_INFINITY;
  for (const b of candidates) {
    const days = workDays(b);
    const last = days[days.length - 1]?.at ?? b.starts;
    const d = Math.abs(last - c.met.at);
    if (d < gap) { gap = d; best = b; }
  }
  return best;
}

/** The people a job left you knowing. */
const castmatesOf = (person: Person, b: Booking): Contact[] =>
  (person.contacts ?? []).filter((c) => jobWhereMet(person, c)?.id === b.id);

/** The way into a place, where SLATE knows it. */
function placeWay(id: string, detail: string, label = townName(id)): Way[] {
  return CITIES.get(id) ? [{ to: at('place', id), label, detail }] : [];
}

// ---------------------------------------------------------------------------
// A part
// ---------------------------------------------------------------------------

defineLook<Role>('part', {
  gone: 'Nobody casts that part any more.',
  resolve: (_sim, id) => findRole(id),
  seeds: () => ROLES.map((r) => r.id),
  look: (role, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const person = playerIn(sim);
    const unit = unitOf(role);
    const pays = rateOf(role, sim.now, role.cities[0]!, cur);
    const chance = person?.craft ? bookingChance(person.craft, role, focusOf(person), 'room', true, false, person.attrs?.presence) : undefined;
    const mine = (person?.career?.bookings ?? []).filter((b) => b.roleId === role.id && b.status !== 'passed' && b.status !== 'lapsed');
    const towns = role.cities.map(townName);

    const ways: Way[] = [
      ...role.cities.flatMap((id) => placeWay(id, `Where it’s cast, and what living there costs`)),
      ...mine.map((b) => ({
        to: at('job', b.id),
        label: `In ${townName(workCityOf(b))}, From ${formatDate(b.starts, sim.homeZone)}`,
        detail: `Yours: ${spanOf(b, role)}, and what it has paid`,
      })),
    ];

    return {
      name: role.label,
      kind: MEDIUM[role.medium],
      summary: chance === undefined
        ? `It pays ${formatMoney(pays, cur)} a ${unit} under ${UNION_NAMES[role.union]} today, and you have no craft yet to read for it.`
        : `It pays ${formatMoney(pays, cur)} a ${unit} under ${UNION_NAMES[role.union]} today, and in the room you’d book it about ${pct(chance)} of the time.`,
      body: (
        <>
          <p className="small">
            It’s cast in {spokenList(towns)}, {role.selfSubmit ? 'and you can put yourself up for it as well as be sent by an agency' : 'and only an agency sends you for it'}.{' '}
            {role.series
              ? `A season is ${role.series.episodes} episodes, guaranteed, made over ${role.series.weeks} weeks.`
              : role.medium === 'stage'
                ? `A run is ${role.units[0]} to ${role.units[1]} weeks of performances${role.rehearsalWeeks ? `, after ${role.rehearsalWeeks[0]} to ${role.rehearsalWeeks[1]} of rehearsal` : ''}.`
                : role.units[0] === role.units[1] ? `A booking is ${role.units[0]} ${role.units[0] === 1 ? unit : `${unit}s`}.` : `A booking is ${role.units[0]} to ${role.units[1]} ${unit}s.`}{' '}
            {mine.length === 0 ? 'You’ve never had it.' : `You’ve had it ${mine.length === 1 ? 'once' : `${mine.length} times`}.`}
          </p>
          <div className="grid grid-3">
            <Stat label="Pays" value={<span className="mono">{formatMoney(pays, cur)}</span>} note={`A ${unit}, the contract’s minimum today`} />
            <Stat label="The Bar" value={String(role.bar)} note="The craft casting looks for" />
            <Stat label="Your Chance" value={chance === undefined ? 'None Yet' : pct(chance)} note="In the room, rested, with a kit" />
          </div>
        </>
      ),
      ways,
      provenance: 'The pay is the contract’s published minimum on today’s date. The chance is SLATE’s estimate, about one in twenty at the bar.',
    };
  },
});

// ---------------------------------------------------------------------------
// A job
// ---------------------------------------------------------------------------

interface TheJob { person: Person; booking: Booking; role: Role }

const JOB_KIND: Readonly<Record<Booking['status'], string>> = {
  offered: 'An Offer Standing', accepted: 'A Job Taken', worked: 'Work Done', passed: 'An Offer Passed',
  lapsed: 'An Offer Lapsed', fired: 'A Job Lost', released: 'A Job Let Go',
};

defineLook<TheJob>('job', {
  gone: 'That job isn’t on your record any more.',
  resolve: (sim, id) => {
    const person = playerIn(sim);
    const booking = person?.career?.bookings.find((b) => b.id === id);
    const role = booking && findRole(booking.roleId);
    return person && booking && role ? { person, booking, role } : undefined;
  },
  seeds: (sim) => (playerIn(sim)?.career?.bookings ?? []).map((b) => b.id),
  look: ({ person, booking: b, role }, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const money = (c: Money) => formatMoney(c, cur);
    const town = workCityOf(b);
    const zone = CITIES.get(town)?.timeZone ?? sim.homeZone;
    const days = workDays(b);
    const first = days[0]?.at ?? b.starts;
    const last = days[days.length - 1]?.at ?? b.starts;
    const rate = unitRate(b, sim.now, cur);
    const unit = unitOf(role);
    const paid = paidOn(person, b.id);
    const whole = expectedGross(b, sim.now, cur);
    const owedExtras = (b.travelOwed ?? 0) + (b.perDiemOwed ?? 0) + (b.fittingOwed ?? 0) + (b.wardrobeOwed ?? 0);
    const overtime = (b.overtimeDays ?? []).reduce((sum, o) => sum + (o ?? 0), 0);
    const account = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
    const lands = account && !account.closedAt ? account : undefined;
    const mates = castmatesOf(person, b);
    const entries = (person.career?.awards ?? []).filter((e) => e.bookingId === b.id);
    const nextCall = b.status === 'accepted'
      ? sim.universe.scheduled.filter((i) => i.kind === WORK_KIND && i.status === 'pending' && i.payload.bookingId === b.id).sort((x, y) => x.at - y.at)[0]
      : undefined;

    const summary = (() => {
      switch (b.status) {
        case 'offered':
          return `It’s offered at ${money(rate)} a ${unit}, ${spanOf(b, role)} in ${townName(town)} from ${formatDate(first, zone)}, and it wants an answer by ${formatDate(b.dueAt, zone)}.`;
        case 'accepted':
          return b.worked > 0
            ? `You’ve worked ${b.worked} of ${days.length} days on it in ${townName(town)}, and it has paid you ${money(paid)} so far, before anything came off it.`
            : `It starts on ${formatDate(first, zone)} in ${townName(town)}: ${days.length} days of work at ${money(rate)} a ${unit}.`;
        case 'worked':
          return `You finished it in ${townName(town)} on ${formatDate(last, zone)}, and it paid you ${money(paid)} before anything came off it.`;
        case 'passed':
          return `You passed on it, and another actor has it now.`;
        case 'lapsed':
          return `It wasn’t answered in time, and another actor has it now.`;
        default:
          return `It ended early, after ${b.worked} of ${days.length} days, having paid you ${money(paid)}.`;
      }
    })();

    const ways: Way[] = [
      { to: at('part', role.id), label: role.label, detail: `The part itself: what its contract pays today, and your chance at it now` },
      ...placeWay(town, b.location ? 'Where it shoots, on location' : 'Where it’s made, and what being there costs'),
      { to: at('day', dayOf(sim, first)), label: formatDate(first, sim.homeZone), detail: b.status === 'offered' || (b.status === 'accepted' && first > sim.now) ? 'Its first call, and the rest of that day' : 'When it began, and the rest of that day' },
    ];
    if (days.length > 1) ways.push({ to: at('day', dayOf(sim, last)), label: formatDate(last, sim.homeZone), detail: last > sim.now ? 'Its last call, and the rest of that day' : 'When it ended, and the rest of that day' });
    if (nextCall) ways.push({ to: at('entry', nextCall.id), label: 'The Next Call', detail: `${formatDate(nextCall.at, zone)}, on your calendar, and what else is near it` });
    if (lands && (paid > 0 || b.status === 'accepted')) {
      ways.push({ to: at('account', lands.id), label: lands.name, detail: 'Where its pay lands, after the commission, the dues and the tax come off' });
    }
    for (const c of mates) ways.push({ to: at('contact', c.id), label: c.name, detail: `A castmate from it, who lives in ${townName(c.cityId)}` });
    for (const e of entries) ways.push({ to: at('award', `${e.bookingId}/${e.body}`), label: categoryName(person, e), detail: `Entered for ${e.year}, and what came of it` });
    // The project it’s a part in, and its company (from 2026-10-08, `systems/industry.ts`): its dates, its cast, its fate.
    const project = projectById(sim, b.projectId);
    if (project) ways.push({ to: at('project', project.id), label: project.title, detail: 'The project: its parts and who plays them, its dates and its history' });
    if (project?.companyId) ways.push({ to: at('company', project.companyId), label: companyById(project.companyId)?.short ?? project.companyId, detail: 'Its company, and how its work is seen' });

    return {
      name: role.label,
      kind: JOB_KIND[b.status],
      parent: at('part', role.id),
      summary,
      body: (
        <>
          <p className="small">
            It’s {/^[AEIOU]/.test(UNION_NAMES[role.union]) ? 'an' : 'a'} {UNION_NAMES[role.union]} contract, {spanOf(b, role)}, at {money(rate)} a {unit}
            {b.season ? `, its season ${b.season}` : ''}, about {money(whole)} in all at that rate.{' '}
            {b.owed > 0 ? `${b.owed === 1 ? 'One day' : `${b.owed} days`} worked ${b.owed === 1 ? 'isn’t' : 'aren’t'} paid yet, and come with the next check. ` : ''}
            {overtime > 0 ? `${money(overtime)} of it was overtime and meal penalties. ` : ''}
            {owedExtras > 0 ? `${money(owedExtras)} of travel, meals, fitting and wardrobe is owed beside the wages. ` : ''}
            {b.t1287Rate !== undefined ? `Canada withholds ${(b.t1287Rate * 100).toFixed(1)}% of it, by your T1287.` : ''}
          </p>
          <p className="small">
            {mates.length === 0
              ? b.status === 'worked' ? 'Nobody from it stayed in touch.' : 'Once it’s done, you’ll know one castmate from it.'
              : `${spokenList(mates.map((c) => c.name))} ${mates.length === 1 ? 'was' : 'were'} on it with you.`}
          </p>
          <div className="grid grid-3">
            <Stat label="Rate" value={<span className="mono">{money(rate)}</span>} note={`A ${unit}`} />
            <Stat label="Paid So Far" value={<span className="mono">{money(paid)}</span>} note="Gross, before the commission, dues and tax" />
            <Stat label="Days Worked" value={`${b.worked} of ${days.length}`} note={b.owed > 0 ? `${b.owed} not paid yet` : b.worked > 0 ? 'Every one paid' : 'None worked yet'} />
          </div>
        </>
      ),
      ways,
      provenance: 'What it has paid is the gross of each check, as the year’s wage record keeps it against this job.',
    };
  },
});

// ---------------------------------------------------------------------------
// An agency, and a manager
// ---------------------------------------------------------------------------

const REACH: Readonly<Record<Agency['tier'], string>> = { 1: 'one of the widest in the business', 2: 'wide', 3: 'growing' };

defineLook<Agency>('agency', {
  gone: 'There’s no agency by that name.',
  resolve: (_sim, id) => AGENCIES.find((a) => a.id === id),
  seeds: () => AGENCIES.map((a) => a.id),
  look: (agency, { sim }) => {
    const person = playerIn(sim);
    const career = person?.career;
    const yours = career?.agencyId === agency.id;
    const offer = (career?.offers ?? []).find((o) => o.agencyId === agency.id && o.until > sim.now);
    const commission = agency.commission ?? AGENT_COMMISSION.rate;
    const office = yours ? career?.agencyCity : offer?.cityId;
    const country = agency.countryId ?? 'us';
    // Your history with it (from 2026-10-08): the approaches made, and what it has done since you signed.
    const approaches = person ? (person.career?.approaches ?? []).filter((a) => a.agencyId === agency.id) : [];
    const review = yours && person ? representationReview(sim, person) : undefined;
    const ways: Way[] = [];
    if (office) ways.push(...placeWay(office, yours ? 'Its office that represents you' : 'Its office whose offer stands'));
    if (yours && career?.signedAt !== undefined) ways.push({ to: at('day', dayOf(sim, career.signedAt)), label: formatDate(career.signedAt, sim.homeZone), detail: 'When you signed with it' });
    if (yours && career?.termEnds !== undefined) ways.push({ to: at('day', dayOf(sim, career.termEnds)), label: formatDate(career.termEnds, sim.homeZone), detail: 'When the contract runs out' });
    if (offer) ways.push({ to: at('day', dayOf(sim, offer.until)), label: formatDate(offer.until, sim.homeZone), detail: 'Its offer’s last day' });
    const land = COUNTRIES.get(country);
    if (land) ways.push({ to: at('country', land.id), label: land.name, detail: 'Where its clients work, with its law and its money' });

    return {
      name: agency.name,
      kind: 'A Talent Agency',
      summary: yours
        ? `It represents you${office ? ` from its ${townName(office)} office` : ''}, and takes ${pct(commission)} of what it books you.`
        : offer
          ? `It has offered to represent you from its ${townName(offer.cityId)} office, until ${formatDate(offer.until, sim.homeZone)}.`
          : `It doesn’t represent you; it signs actors whose showing reaches ${agency.bar}.`,
      body: (
        <>
          <p className="small">
            Its reach is {REACH[agency.tier]}, and it sends a client to about {agency.auditionsPerWeek} auditions a week. It takes {pct(commission)} of what it books
            {country === 'us' ? ', and on SAG-AFTRA work at scale the producer pays that on top' : ''}. Its clients work in {countryWords(country)}.
          </p>
          {approaches.length > 0 && (
            <p className="small">
              Your approaches to it: {approaches.map((a) => `${formatDate(a.sentAt, sim.homeZone)}, ${a.history.at(-1)!.what.toLowerCase()}`).join('; ')}.
            </p>
          )}
          {review && (
            <p className="small">
              Since you signed it has sent you to {review.sent} {review.sent === 1 ? 'audition' : 'auditions'}, {review.sentBooked} booked, and {review.offers} {review.offers === 1 ? 'job' : 'jobs'} came through it. {review.mayLeave.ok ? 'You’re free to leave.' : 'The contract holds you for now.'}
            </p>
          )}
          <div className="grid grid-3">
            <Stat label="Showing It Needs" value={String(agency.bar)} note="At a showcase, or in the work" />
            <Stat label="Auditions A Week" value={`About ${agency.auditionsPerWeek}`} note="SLATE’s estimate of its reach" />
            <Stat label="Commission" value={pct(commission)} note="Of what it books" />
          </div>
        </>
      ),
      ways,
      provenance: 'A real agency. What showing it needs, and its reach, are SLATE’s estimate.',
    };
  },
});

defineLook<Manager>('manager', {
  gone: 'There’s no management firm by that name.',
  resolve: (_sim, id) => MANAGERS.find((m) => m.id === id),
  seeds: () => MANAGERS.map((m) => m.id),
  look: (manager, { sim }) => {
    const career = playerIn(sim)?.career;
    const yours = career?.managerId === manager.id;
    const offer = (career?.managerOffers ?? []).find((o) => o.managerId === manager.id && o.until > sim.now);
    const rate = career?.agencyId ? MANAGEMENT.withAgent : MANAGEMENT.alone;
    const ways: Way[] = [];
    if (yours && career?.managerSince !== undefined) ways.push({ to: at('day', dayOf(sim, career.managerSince)), label: formatDate(career.managerSince, sim.homeZone), detail: 'When it began managing you' });
    if (offer) ways.push({ to: at('day', dayOf(sim, offer.until)), label: formatDate(offer.until, sim.homeZone), detail: 'Its offer’s last day' });
    if (career?.agencyId && AGENCIES.some((a) => a.id === career.agencyId)) {
      const agency = AGENCIES.find((a) => a.id === career.agencyId)!;
      ways.push({ to: at('agency', agency.id), label: agency.name, detail: 'Your agency, which it works beside' });
    }
    return {
      name: manager.name,
      kind: 'A Management Firm',
      summary: yours
        ? `It manages you, and takes ${pct(rate)} of what you earn ${career?.agencyId ? 'beside your agent' : 'with no agent beside it'}.`
        : offer
          ? `It has offered to manage you, until ${formatDate(offer.until, sim.homeZone)}, for ${pct(rate)} of what you earn.`
          : `It doesn’t manage you; it signs actors whose showing reaches ${manager.bar}.`,
      body: (
        <p className="small">
          A manager takes {pct(MANAGEMENT.withAgent)} beside an agent and {pct(MANAGEMENT.alone)} without one, finds you about {MANAGEMENT.auditionsPerWeek} more audition a week, and while you’ve no agency sets up meetings that bring one about {pct(MANAGEMENT.findsAnAgency)} of months.
        </p>
      ),
      ways,
      provenance: 'A real firm. No law caps a manager’s commission; the rates are what the trade reckons.',
    };
  },
});

// ---------------------------------------------------------------------------
// An award entry
// ---------------------------------------------------------------------------

interface TheEntry { person: Person; entry: AwardEntry; booking: Booking | undefined }

const BODY_NAMES: Readonly<Record<AwardEntry['body'], string>> = {
  emmys: 'The Emmys', 'bafta-film': 'BAFTA Film', oscars: 'The Academy Awards', tonys: 'The Tonys', oliviers: 'The Oliviers', ariel: 'The Ariels',
};

defineLook<TheEntry>('award', {
  gone: 'That entry isn’t on your record.',
  resolve: (sim, id) => {
    const person = playerIn(sim);
    const cut = id.lastIndexOf('/');
    if (!person || cut < 0) return undefined;
    const bookingId = id.slice(0, cut);
    const body = id.slice(cut + 1);
    const entry = (person.career?.awards ?? []).find((e) => e.bookingId === bookingId && e.body === body);
    if (!entry) return undefined;
    return { person, entry, booking: person.career?.bookings.find((b) => b.id === bookingId) };
  },
  seeds: (sim) => (playerIn(sim)?.career?.awards ?? []).map((e) => `${e.bookingId}/${e.body}`),
  look: ({ person, entry, booking }, { sim }) => {
    const word = person.performerTitle === 'actress' ? 'actress' : 'actor';
    const field = entry.body === 'emmys' ? EMMY_FIELDS[entry.category]?.[word] : OTHER_FIELDS[entry.body][word];
    const chances = booking && person.craft ? awardChances(person, booking, entry.body, entry.category) : undefined;
    const dates = AWARD_DATES[entry.body];
    const noon = (y: number, [m, d]: [number, number]) => instantFromZoned({ year: y, month: m, day: d, hour: 12, minute: 0 }, sim.homeZone);
    const nominations = noon(entry.year, dates.nominations);
    const ceremony = noon(entry.year, dates.ceremony);
    const body = BODY_NAMES[entry.body];
    const result = entry.won ? 'won' : entry.won === false ? 'nominated, and didn’t win' : entry.nominated ? 'nominated, with the ceremony to come' : entry.nominated === false ? 'not nominated' : 'entered, with the nominations to come';

    const ways: Way[] = [];
    if (booking) ways.push({ to: at('job', booking.id), label: roleById(booking.roleId).label, detail: 'What was entered, and what it paid' });
    ways.push({ to: at('day', dayOf(sim, nominations)), label: formatDate(nominations, sim.homeZone), detail: nominations > sim.now ? 'When the nominations are announced' : 'When the nominations were announced' });
    ways.push({ to: at('day', dayOf(sim, ceremony)), label: formatDate(ceremony, sim.homeZone), detail: ceremony > sim.now ? 'When the ceremony is held' : 'When the ceremony was held' });

    return {
      name: categoryName(person, entry),
      kind: 'An Award Entry',
      parent: booking ? at('job', booking.id) : undefined,
      summary: `Your work is ${result}, at ${body.replace(/^The /, 'the ')} for ${entry.year}.`,
      body: (
        <>
          <p className="small">
            {entry.byThem ? 'You entered it yourself' : 'The production entered it'} on {formatDate(entry.entered, sim.homeZone)}.{' '}
            {field ? `${field.submissions.toLocaleString('en-US')} performances are put up in the category, for ${field.slots} nominations.` : ''}{' '}
            {chances ? `Standing where you stood above the part, a nomination was about ${pct(chances.nominated)} likely, and a nominee’s win about ${pct(chances.won)}.` : ''}
          </p>
          <div className="grid grid-3">
            <Stat label="The Field" value={field ? field.submissions.toLocaleString('en-US') : 'Unknown'} note="Performances put up" />
            <Stat label="Nominations" value={field ? String(field.slots) : 'Unknown'} note="Places in the category" />
            <Stat label="Your Chance" value={chances ? pct(chances.nominated) : 'None'} note="Of a nomination" />
          </div>
        </>
      ),
      ways,
      provenance: 'The fields are the bodies’ own counts or derived from them; the weighing by how far above the part you stood is SLATE’s estimate.',
    };
  },
});
