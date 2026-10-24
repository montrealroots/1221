/**
 * SLATE — the Career screen's Work tab (from 2026-10-21, the owner's brief 19, D7 and D8): the engagements, live and
 * finished, with their calls on the calendar, what permission to work read for their dates, each payment promised and
 * received with the commission on its own line, what's still owed on contracts whose agreement has ended, and the unions'
 * memberships and bills (`systems/propay.ts`).
 *
 * Every figure is read from the record and the ledger as it's drawn: a payment's received figures are the ones posted;
 * a commission still to come is worked out by the rule that will take it (`commissionOn`), and said as expected. The one
 * control, Join SAG-AFTRA, runs its command through `run`, behind its guide chapter (`<Gated>`), with its refusal said
 * under it before it's pressed (`WhyNot`).
 */

import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine, SectionHead, WhyNot } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate, formatDateTime } from '@/engine/core/time';
import { plural } from '@/engine/core/text';
import type { Simulation } from '@/engine/core/simulation';
import type { Person } from '@/engine/domain/model';
import { UNIONS } from '@/engine/content/careerwork';
import { finished, type Engagement, type ProPayment, type UnionBill } from '@/engine/systems/pro';
import { inSaveMoney } from '@/engine/systems/banking';
import { DEFERRED_WHY, counted, drawnWords } from '@/engine/systems/projobs';
import { SCHEDULE_WORDS, US_RULES, countryIn, legWords, routeFor, routeSourceWords, tripOf, tripRead, visaFor, visaRefusal } from '@/engine/systems/worktrip';
import { gapWords, jurisdictionOf } from '@/engine/content/jurisdictions';
import { CITIES } from '@/engine/content/geography';
import {
  commissionOn, eligibilityRead, joinSagRefusal, owedAfterEnding, placeKnown, projectOf, sagJoinUsd, sagMembershipFrom, weekOf, weekWords, PAY_KIND, RELEASE_KIND, SAG_ELIGIBLE_KIND, DUES_KIND,
} from '@/engine/systems/propay';

const STATUS: Readonly<Record<Engagement['status'], string>> = { booked: 'Booked', preparing: 'Preparing', working: 'Working', finished: 'Finished', canceled: 'Called Off' };
const PAY_KINDS = new Set([PAY_KIND, RELEASE_KIND, SAG_ELIGIBLE_KIND, DUES_KIND]);

/** An engagement's calls still on the calendar: whatever the work put there for it, its pay days apart. */
function callsOf(sim: Simulation, e: Engagement) {
  return sim.universe.scheduled
    .filter((i) => i.status === 'pending' && !PAY_KINDS.has(i.kind) && (i.refId === e.id || i.payload.engagementId === e.id))
    .sort((a, b) => a.at - b.at);
}

/** The days of an engagement, in a line: its first and last, and how many. */
function datesWords(e: Engagement, zone: string): string {
  if (!e.days.length) return 'No dates yet.';
  const first = e.days[0]!.from;
  const last = e.days[e.days.length - 1]!.to;
  // A count under ten in words, as the Opportunities tab says the same days ("Four shoot days"): until 2026-10-21, "4 days".
  return `${formatDate(first, zone)} to ${formatDate(last, zone)}, ${counted(e.days.length, 'day')} of work.`;
}

/**
 * A payment as a row of the Work tab's pay table (from 2026-10-23, the owner's brief 23): its week, what's promised,
 * when it's due, where it stands, and its commission. Until then each was a paragraph, the same sentence for every week of
 * a run (nine times "The week of …: $1,114.00 promised by Harrow Point Repertory Theater, due …"), and the commission's
 * reason under each; what's the same for every week is said once under the table now (`EngagementPay`).
 */
function paymentRow(sim: Simulation, person: Person, e: Engagement, p: ProPayment): { week: string; promised: string; due: string; stands: string; commission: string; why?: string } {
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const zone = sim.zone;
  const week = formatDate(weekOf(p, zone).from, zone);
  const promised = formatMoney(p.promised, p.currency);
  // One sentence for deferred pay wherever it's said (`DEFERRED_WHY`, from 2026-10-21).
  if (p.deferred) return { week, promised: 'Deferred', due: 'Never', stands: `SAG-AFTRA’s Student Film Agreement defers the pay: ${DEFERRED_WHY}, so nothing is paid for it.`, commission: 'None' };
  const r = p.received;
  if (r) {
    return {
      week, promised, due: formatDate(p.due, zone),
      stands: `Received ${formatDate(r.at, zone)}${r.via === 'trust' && p.inTrust ? `, passed on from ${p.inTrust.agency}’s client trust account` : ', paid straight to you'}. Gross ${money(r.gross)}, withheld for tax ${money(r.withheld)}${r.dues ? `, working dues ${money(r.dues)}` : ''}, to you ${money(r.net)}.`,
      commission: r.commission ? `${money(r.commission)}, taken before it reached you` : 'None',
    };
  }
  if (p.inTrust) {
    return {
      week, promised, due: formatDate(p.due, zone),
      stands: `Paid into ${p.inTrust.agency}’s client trust account on ${formatDate(p.inTrust.at, zone)}, and passed on to you by ${formatDate(p.inTrust.releaseAt, zone)}. Gross ${money(p.inTrust.gross)}, withheld for tax ${money(p.inTrust.withheld)}${p.inTrust.dues ? `, working dues ${money(p.inTrust.dues)}` : ''}, held for you ${money(p.inTrust.held)}.`,
      commission: `${money(p.inTrust.commission)}, taken when it’s passed on`,
    };
  }
  const gross = inSaveMoney(sim, p.promised, p.currency);
  const c = commissionOn(sim, person, e, p, gross, Math.max(p.due, sim.now));
  return { week, promised, due: formatDate(p.due, zone), stands: 'Promised. It comes into your accounts on the day it’s due.', commission: c.amount ? `${money(c.amount)} expected` : 'None expected', why: c.words };
}

/** An engagement's pay: a table, a row a week, what's the same for every row said once under it. */
function EngagementPay({ person, e }: { person: Person; e: Engagement }) {
  const { sim } = useGame();
  const rows = e.pay.map((p) => ({ key: p.key, ...paymentRow(sim, person, e, p) }));
  const whys = [...new Set(rows.map((r) => r.why).filter(Boolean))];
  const from = projectOf(e)?.company ?? 'the production';
  const trip = tripOf(person, e);
  if (!rows.length) return <p className="small" style={{ margin: 0 }}>No pay was promised for this work.</p>;
  return (
    <div className="col gap-2">
      {/* Deferred pay is paid by nobody: until this was caught on 2026-10-23 (brief 23's tests) a student film's read
          “Paid by …, a payment for each week.” over a row that said nothing is paid. */}
      <p className="xs dim" style={{ margin: 0 }}>{e.pay.every((p) => p.deferred) ? `Deferred by ${from}: nothing is paid for this work.` : `Paid by ${from}, a payment for each week.`}</p>
      <div className="table-scroll">
        <table className="pay-table">
          <thead><tr><th>Week Of</th><th className="num">Promised</th><th>Due</th><th>Where It Stands</th><th>Commission</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="nowrap">{r.week}</td>
                <td className="num">{r.promised}</td>
                <td className="nowrap">{r.due}</td>
                <td>{r.stands}</td>
                <td>{whys.length > 1 && r.why ? `${r.commission}. ${r.why}` : r.commission}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {whys.length === 1 && <p className="xs dim" style={{ margin: 0 }}>{`Commission: ${whys[0]}`}</p>}
      {/* Work abroad (from 2026-10-23, the owner's brief 25): the country's own tax isn't worked out, said where the pay is. */}
      {trip && trip.country !== US_RULES && <p className="xs dim" style={{ margin: 0 }}>{`Your tax return counts this pay as earned in ${countryIn(trip.country)}. Tax in ${countryIn(trip.country)} on it isn’t part of the game yet.`}</p>}
    </div>
  );
}

/**
 * Work abroad (from 2026-10-23, the owner's brief 25, `systems/worktrip.ts`): the permission it needs and the visa's
 * state, with Apply For The Visa behind its guide chapter and its refusal said under it; the trip's legs, each in its
 * towns' own times, and the hotel; and where the flight times come from.
 */
function TripView({ person, e }: { person: Person; e: Engagement }) {
  const { sim, run, toast } = useGame();
  const zone = sim.zone;
  const trip = tripOf(person, e);
  const project = projectOf(e);
  if (!trip || !project) return null;
  const visa = visaFor(person, e.id);
  const no = visaRefusal(person, e, project, sim.now);
  const route = routeFor(person, trip.country);
  const read = tripRead(person, trip.country, e.days, e.id, sim.now);
  // A trip in the US (Module 2, C10) needs no visa, and its rules aren't a jurisdiction's gaps.
  const domestic = trip.country === US_RULES;
  const city = CITIES.get(trip.cityId)?.name ?? 'abroad';
  const needs = !domestic && !finished(e) && read.basis !== 'abroad-citizen' && !(read.authorized && !visa);
  return (
    <details className="section-fold" open={!finished(e)}>
      <summary>{`The Trip To ${city}`}</summary>
      <div className="col gap-2">
        <SectionHead title={domestic ? 'Flights And Hotel' : 'Permission, Flights And Hotel'} help="career.work-abroad" />
        {!finished(e) && <p className={`small ${read.authorized ? '' : 'callout callout-warning'}`} style={{ margin: 0 }}>{read.words}</p>}
        {visa && <p className="small" style={{ margin: 0 }}>{visa.status === 'pending' ? `Applied ${formatDate(visa.appliedAt ?? sim.now, zone)}. The department decides on ${formatDate(visa.readyAt ?? sim.now, zone)}.` : visa.status === 'valid' ? `Granted ${formatDate(visa.issuedAt ?? sim.now, zone)}, in force to ${formatDate(visa.expiresAt ?? sim.now, zone)}.` : `${visa.name}: ${visa.status}.`}</p>}
        {needs && !visa && (
          <>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              <Gated feature="pro.apply_work_visa" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ readyAt: number }>('pro.apply_work_visa', { engagementId: e.id }); if (r.ok) toast(`You’ve applied. The department decides on ${formatDate(r.value!.readyAt, zone)}.`, 'positive'); }}>Apply For The Visa</Gated>
            </div>
            <WhyNot reasons={[['Apply For The Visa', no]]} />
          </>
        )}
        <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>
          {trip.legs.map((l) => <li key={l.id}>{`${l.label}${l.status === 'missed' ? ' (missed)' : l.status === 'canceled' ? ' (called off)' : l.status === 'done' ? ' (done)' : ''}. ${legWords(l)}`}</li>)}
        </ul>
        <p className="small" style={{ margin: 0 }}>{`${trip.stay.place[0]!.toUpperCase()}${trip.stay.place.slice(1)}, ${formatDate(trip.stay.from, zone)} to ${formatDate(trip.stay.to, zone)}, paid by the production.`}</p>
        {!domestic && route && read.basis !== 'abroad-citizen' && (
          <details className="section-fold">
            <summary>{`What The ${route.short.replace(/\bvisa\b/, 'Visa')} Asks`}</summary>
            <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {route.conditions.map((c) => <li key={c.id}>{c.words}</li>)}
            </ul>
            <Fine>{routeSourceWords(route)}</Fine>
          </details>
        )}
        <Fine>{`${project.trip?.words ?? ''} ${SCHEDULE_WORDS}${domestic ? '' : ` ${gapWords(jurisdictionOf(trip.country))}`}`}</Fine>
      </div>
    </details>
  );
}

/** The pay in a line: each week's figure, how many weeks, and what's been paid. */
function payLine(e: Engagement): string {
  if (!e.pay.length) return 'No pay';
  if (e.pay.every((p) => p.deferred)) return 'Deferred pay';
  const first = e.pay[0]!;
  const same = e.pay.every((p) => p.promised === first.promised && p.currency === first.currency);
  const total = e.pay.reduce((t, p) => t + p.promised, 0);
  const paid = e.pay.filter((p) => p.received).length;
  const each = same ? `${formatMoney(first.promised, first.currency)} a week for ${counted(e.pay.length, 'week')}, ` : '';
  return `${each}${formatMoney(total, first.currency)} in all${paid ? `, ${paid} of ${e.pay.length} paid` : ''}`;
}

/** An engagement's calls on the calendar, a run of the same call in one line: its name, how many, from when to when. */
function callRuns(sim: Simulation, e: Engagement): string[] {
  const zone = sim.zone;
  const runs = new Map<string, { n: number; first: number; last: number }>();
  for (const i of callsOf(sim, e)) {
    const r = runs.get(i.label) ?? { n: 0, first: i.at, last: i.at };
    r.n += 1; r.last = i.at;
    runs.set(i.label, r);
  }
  return [...runs].map(([label, r]) => (r.n === 1 ? `${label}, ${formatDateTime(r.first, zone)}` : `${label}: ${plural(r.n, 'call')}, ${formatDate(r.first, zone)} to ${formatDate(r.last, zone)}`));
}

/**
 * One engagement, its summary first (from 2026-10-23, brief 23): the part and the project, where it stands, its dates,
 * the pay in a line and the next call. Then what holds now: a release says why, above everything else, and permission to
 * work as it reads today for the days still to come. The agreement, the calendar, the pay, what permission read when it
 * was accepted ("Eligibility When Accepted") and what happened open below. Until then it was one column of labeled facts,
 * the reading at acceptance among them as "Permission To Work", which after a release still said the work was permitted.
 */
function EngagementView({ person, e }: { person: Person; e: Engagement }) {
  const { sim } = useGame();
  const zone = sim.zone;
  const project = projectOf(e);
  const calls = callsOf(sim, e);
  const ahead = e.days.filter((d) => d.to > sim.now);
  // Work abroad reads the country's permission (from 2026-10-23, the owner's brief 25), shown with its trip below.
  const now = !finished(e) && ahead.length && !e.tripId ? eligibilityRead(person, ahead, sim.now) : undefined;
  const ended = e.status === 'canceled' ? [...e.history].reverse()[0] : undefined;
  // The trip's steps among the work's (from 2026-10-23, brief 25, W11): left, arrived, checked in and out, home, in time.
  const happened = [...e.history, ...(tripOf(person, e)?.history ?? [])].sort((a, b) => a.at - b.at);
  const runs = callRuns(sim, e);
  const name = `${e.role}, ${project?.project ?? 'Your Work'}`;
  return (
    <article className="engagement" aria-label={name}>
      <div className="engagement-head">
        <h3>{name}</h3>
        <span className={`chip ${e.status === 'canceled' ? 'chip-warning' : finished(e) ? '' : 'chip-accent'}`}>{STATUS[e.status]}</span>
      </div>
      <dl className="facts">
        <div><dt>Dates</dt><dd>{datesWords(e, zone)}</dd></div>
        <div><dt>Pay</dt><dd>{payLine(e)}</dd></div>
        <div><dt>Next Call</dt><dd>{calls[0] ? `${calls[0].label}, ${formatDateTime(calls[0].at, zone)}` : finished(e) ? 'Its calls are over.' : 'No calls on your calendar for it yet.'}</dd></div>
      </dl>
      {/* A part drawn from a real production says so on the engagement too (from 2026-10-23, brief 25's Module 2, C8). */}
      {project?.drawn && <p className="xs dim" style={{ margin: 0 }}>{drawnWords(project)}</p>}
      {ended && <p className="callout callout-warning small" style={{ margin: 0 }}>{`${formatDate(ended.at, zone)}: ${ended.words}`}</p>}
      {now && (
        <p className={`callout small ${now.authorized ? '' : 'callout-warning'}`} style={{ margin: 0 }}>
          <strong>Permission To Work Now. </strong>{now.words}
        </p>
      )}
      {e.tripId && <TripView person={person} e={e} />}
      <details className="section-fold">
        <summary>The Agreement</summary>
        <dl className="facts">
          <div><dt>Who</dt><dd>{project ? `${project.company}, ${project.contract}.${project.fictional ? ' Fictional, invented for the game.' : ''}` : 'The production.'}</dd></div>
          {project && <div><dt>Where</dt><dd>{`${project.place.venue[0]!.toUpperCase()}${project.place.venue.slice(1)}, ${project.place.city}.`}</dd></div>}
        </dl>
        {!placeKnown(e) && project && <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>{`${project.place.city} isn’t among the game’s towns, so its pay counts on your tax return as earned where you live, and the tax where the work is done isn’t worked out.`}</p>}
      </details>
      <details className="section-fold">
        <summary>{calls.length ? `On Your Calendar (${calls.length})` : 'On Your Calendar'}</summary>
        {runs.length
          ? <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{runs.map((r) => <li key={r}>{r}</li>)}</ul>
          : <p className="small" style={{ margin: 0 }}>{finished(e) ? 'Its calls are over.' : 'No calls on your calendar for it yet.'}</p>}
      </details>
      <details className="section-fold">
        <summary>{e.pay.length ? `Pay (${e.pay.length})` : 'Pay'}</summary>
        <EngagementPay person={person} e={e} />
      </details>
      {e.eligibility && (
        <details className="section-fold">
          <summary>Eligibility When Accepted</summary>
          <p className="small" style={{ margin: 0 }}>{`Read ${formatDate(e.eligibility.at, zone)}: ${e.eligibility.words}`}</p>
        </details>
      )}
      {happened.length > 0 && (
        <details className="section-fold">
          <summary>What Happened</summary>
          <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{happened.map((h) => <li key={h.id}>{`${formatDate(h.at, zone)}: ${h.words}`}</li>)}</ul>
        </details>
      )}
    </article>
  );
}

/** A union bill as a line: what, how much, and paid, owed or when it's due. */
function billWords(b: UnionBill, zone: string, cur: string): string {
  const amount = formatMoney(b.amount, cur);
  if (b.settled?.how === 'paid') return `${b.what}: ${amount}, paid ${formatDate(b.settled.at, zone)}.`;
  if (b.settled?.how === 'owed') return `${b.what}: ${amount}, owed under Bills Owed since ${formatDate(b.settled.at, zone)}.`;
  return `${b.what}: ${amount}, due ${formatDate(b.due, zone)}.`;
}

/** The unions: Equity's membership and bills; SAG-AFTRA's eligibility, its thirty days and joining. */
function UnionsPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const zone = sim.zone;
  const bills = [...(person.pro?.unionBills ?? [])].sort((a, b) => a.due - b.due);
  const equity = bills.filter((b) => b.union === 'equity');
  const sag = bills.filter((b) => b.union === 'sag-aftra');
  const from = sagMembershipFrom(person);
  const fee = formatMoney(inSaveMoney(sim, sagJoinUsd(), 'USD'), cur);
  const no = joinSagRefusal(sim, person);
  const label = `Join SAG-AFTRA (${fee})`;
  const sagWords = person.pro?.sag?.memberSince !== undefined
    ? `You’re a member of SAG-AFTRA, since ${formatDate(person.pro.sag.memberSince, zone)}.`
    : from !== undefined
      ? `You’ve been able to join SAG-AFTRA since ${formatDate(person.pro!.sag!.eligibleSince!, zone)}. SAG-AFTRA work from ${formatDate(from, zone)} needs you to be a member.`
      // Where you stand, and the line under Join SAG-AFTRA says what it takes: until 2026-10-21 this said it too, and the
      // two read the same sentence one after the other (brief 19's app walk).
      : 'You aren’t eligible to join SAG-AFTRA yet.';
  return (
    <Panel title="Your Unions" help="career.unions">
      <div className="col gap-3">
        <div className="col gap-2">
          <h3 className="eyebrow" style={{ margin: 0 }}>Actors’ Equity</h3>
          <p className="small" style={{ margin: 0 }}>{person.pro?.equity
            ? `You joined ${UNIONS.equity.name}${person.pro.equity.how === 'degree' ? ' with the degree' : ''} on ${formatDate(person.pro.equity.since, zone)}.`
            : 'The degree makes you a member, as the School’s Bulletin says, and its initiation fee is billed then.'}</p>
          {equity.length > 0 && <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{equity.map((b) => <li key={b.key}>{billWords(b, zone, cur)}</li>)}</ul>}
        </div>
        <div className="col gap-2">
          <h3 className="eyebrow" style={{ margin: 0 }}>SAG-AFTRA</h3>
          <p className="small" style={{ margin: 0 }}>{sagWords}</p>
          {sag.length > 0 && <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{sag.map((b) => <li key={b.key}>{billWords(b, zone, cur)}</li>)}</ul>}
          {person.pro?.sag?.memberSince === undefined && (
            <>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                <Gated feature="pro.join_sag" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ fee: number }>('pro.join_sag'); if (r.ok) toast(`You’ve joined SAG-AFTRA: ${formatMoney(r.value!.fee, cur)}.`, 'positive'); }}>{label}</Gated>
              </div>
              <WhyNot reasons={[[label, no]]} />
            </>
          )}
        </div>
        <Fine>{`Equity’s fees are from its own page: an initiation fee of ${formatMoney(UNIONS.equity.initiation, 'USD')} within three years, ${formatMoney(UNIONS.equity.down, 'USD')} down, basic dues of ${formatMoney(UNIONS.equity.yearlyDues, 'USD')} a year billed each May and November, and working dues of 2.5% of Equity pay. Splitting the rest of the initiation fee into two parts a year apart, the billing day and taking working dues from the pay are estimated. SAG-AFTRA’s figures were read only from a search engine’s copy of its pages, so they’re approximate. A union contract can require membership from the 30th day after a first job under it began (29 U.S.C. 158(a)(3)).`}</Fine>
      </div>
    </Panel>
  );
}

/** The Work tab: engagements live and finished, what's owed after an agreement ended, and the unions. */
export function WorkPane() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const zone = sim.zone;
  const all = [...(person.pro?.engagements ?? [])].sort((a, b) => (a.days[0]?.from ?? 0) - (b.days[0]?.from ?? 0));
  const live = all.filter((e) => !finished(e));
  const done = all.filter((e) => finished(e)).reverse();
  const owed = owedAfterEnding(sim, person);
  return (
    <div className="col gap-5">
      <Panel title="Your Engagements" help="career.pay">
        <div className="col gap-4">
          {live.length
            ? live.map((e) => <EngagementView key={e.id} person={person} e={e} />)
            : <p className="small" style={{ margin: 0 }}>No work booked. Work you accept appears here with its dates, its calls, its pay and any commission.</p>}
          <Fine>Pay comes on the Thursday after each week’s work. That’s SAG-AFTRA’s rule, which the game uses for all professional work, so for other work it’s estimated. Represented, your pay goes to your agency’s client trust account and on to you within three business days, less commission: SAG-AFTRA’s rule for TV and film, which the game uses for stage work too. Tax is withheld from each payment as from a paycheck, and your tax return reads the town the work was done in.</Fine>
        </div>
      </Panel>
      {owed.length > 0 && (
        <Panel title="Still Owed After An Agreement Ended" help="career.commission">
          <ul className="small col gap-2" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {owed.map(({ e, p, commission }) => <li key={p.key}>{`${projectOf(e)?.project ?? 'Your work'}, ${weekWords(p, zone)}: ${formatMoney(p.promised, p.currency)} ${p.inTrust ? `held in trust until ${formatDate(p.inTrust.releaseAt, zone)}` : `due ${formatDate(p.due, zone)}`}, with ${formatMoney(p.inTrust?.commission ?? commission.amount, cur)} commission owed to ${commission.agency ?? 'your agency'}. ${commission.words}`}</li>)}
          </ul>
        </Panel>
      )}
      {done.length > 0 && (
        <Panel title="Finished Engagements" help="career.pay">
          <div className="col gap-4">{done.map((e) => <EngagementView key={e.id} person={person} e={e} />)}</div>
        </Panel>
      )}
      <UnionsPanel />
    </div>
  );
}
