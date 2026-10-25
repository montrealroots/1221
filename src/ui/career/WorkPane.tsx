/**
 * SLATE — the Career screen's Work tab (from 2026-10-21, the owner's brief 19, D7 and D8): the engagements, live and
 * finished, with their calls on the calendar, what permission to work read for their dates, each payment promised and
 * received with the commission on its own line, what's still owed on contracts whose agreement has ended, and the unions'
 * memberships and bills (`systems/propay.ts`).
 *
 * Every figure is read from the record and the ledger as it's drawn: a payment's received figures are the ones posted;
 * a commission still to come is worked out by the rule that will take it (`commissionOn`), and said as expected. Join
 * SAG-AFTRA runs its command through `run`, behind its guide chapter (`<Gated>`), with its refusal said under it before
 * it's pressed (`WhyNot`).
 *
 * From 2026-10-24 (brief 25's Module 4, `systems/contracts.ts`): each engagement's contract and its clauses, where each
 * payment stands (estimated, earned, due, overdue, disputed, held or settled), the producer's pension and health
 * contribution beside the pay and never in it, a per diem apart from wages, residuals in their four records, and a
 * recurring part's episodes, its option and its series' seasons. Ask About It is the one control they add. Until then the
 * fold was The Agreement, the company and the venue, and every payment not yet paid read "Promised".
 *
 * From 2026-10-24 (brief 25's Module 5, `systems/workflow.ts`): How The Work Is Done, each engagement's workflow, its
 * own preparation, the voice where the work reads it, the choices the work asks with a button for each option
 * (`pro.work_choice`), a recall to loop, and each day's report as it was worked.
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
import { finished, type Contract, type ContractClause, type Engagement, type ProPayment, type Residual, type UnionBill } from '@/engine/systems/pro';
import { askRefusal, notOwed, payState, calculationWords } from '@/engine/systems/contracts';
import { EPISODE_CALL_KIND, OPTION_KIND, decisionsTo, decisionWords, ordinal } from '@/engine/systems/series';
import { seriesById } from '@/engine/content/series';
import { FORMATS } from '@/engine/content/workflows';
import { choiceRefusal, choicesOf, formatOf, reportWords, strainOf, workflowOf } from '@/engine/systems/workflow';
import { projectById } from '@/engine/content/careerwork';
import { inSaveMoney } from '@/engine/systems/banking';
import { DEFERRED_WHY, counted, drawnWords } from '@/engine/systems/projobs';
import { SCHEDULE_WORDS, US_RULES, countryIn, legWords, routeFor, routeSourceWords, tripOf, tripRead, visaFor, visaRefusal } from '@/engine/systems/worktrip';
import { gapWords, jurisdictionOf } from '@/engine/content/jurisdictions';
import { CITIES } from '@/engine/content/geography';
import {
  commissionOn, eligibilityRead, joinSagRefusal, owedAfterEnding, placeKnown, projectOf, sagJoinUsd, sagMembershipFrom, weekOf, weekWords, PAY_KIND, RELEASE_KIND, SAG_ELIGIBLE_KIND, DUES_KIND,
} from '@/engine/systems/propay';

const STATUS: Readonly<Record<Engagement['status'], string>> = { booked: 'Booked', preparing: 'Preparing', working: 'Working', finished: 'Finished', canceled: 'Called Off' };
// A recurring part's further episodes and its option are the production's word, not calls: its contract shows them.
const PAY_KINDS = new Set([PAY_KIND, RELEASE_KIND, SAG_ELIGIBLE_KIND, DUES_KIND, EPISODE_CALL_KIND, OPTION_KIND]);

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
function paymentRow(sim: Simulation, person: Person, e: Engagement, p: ProPayment): { week: string; promised: string; due: string; state: string; stands: string; commission: string; why?: string; overdue?: boolean } {
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const zone = sim.zone;
  const week = formatDate(weekOf(p, zone).from, zone);
  const promised = formatMoney(p.promised, p.currency);
  // One sentence for deferred pay wherever it's said (`DEFERRED_WHY`, from 2026-10-21).
  if (p.deferred) return { week, promised: 'Deferred', due: 'Never', state: 'Deferred', stands: `SAG-AFTRA’s Student Film Agreement defers the pay: ${DEFERRED_WHY}, so nothing is paid for it.`, commission: 'None' };
  // The producer's contribution, beside the pay (from 2026-10-24): what it paid the plans, and that none of it was yours.
  const plans = p.contribution ? ` The producer also paid ${money(p.contribution.amount)}, ${pct(p.contribution.rate)} of your pay, to SAG-AFTRA’s pension and health plans, on top of your pay.` : '';
  const r = p.received;
  if (r) {
    return {
      week, promised, due: formatDate(p.due, zone), state: 'Settled',
      stands: `Received ${formatDate(r.at, zone)}${r.via === 'trust' && p.inTrust ? `, passed on from ${p.inTrust.agency}’s client trust account` : ', paid straight to you'}. Gross ${money(r.gross)}, withheld for tax ${money(r.withheld)}${r.dues ? `, working dues ${money(r.dues)}` : ''}, to you ${money(r.net)}.${plans}`,
      commission: r.commission ? `${money(r.commission)}, taken before it reached you` : 'None',
    };
  }
  if (p.inTrust) {
    return {
      week, promised, due: formatDate(p.due, zone), state: 'Held For You',
      stands: `Paid into ${p.inTrust.agency}’s client trust account on ${formatDate(p.inTrust.at, zone)}, and passed on to you by ${formatDate(p.inTrust.releaseAt, zone)}. Gross ${money(p.inTrust.gross)}, withheld for tax ${money(p.inTrust.withheld)}${p.inTrust.dues ? `, working dues ${money(p.inTrust.dues)}` : ''}, held for you ${money(p.inTrust.held)}.${plans}`,
      commission: `${money(p.inTrust.commission)}, taken when it’s passed on`,
    };
  }
  const gross = inSaveMoney(sim, p.promised, p.currency);
  const c = commissionOn(sim, person, e, p, gross, Math.max(p.due, sim.now));
  const ot = p.overtime ? ` It includes ${formatMoney(p.overtime, p.currency)} of overtime.` : '';
  const company = projectOf(e)?.company ?? 'The production';
  const state = payState(p, sim.now, zone);
  // What follows the State column's word, without saying it again (from 2026-10-24): until then it opened on the state,
  // so an estimated row said “Estimated” in both columns.
  const stands = state === 'estimated' ? `Its days are still to come.${ot}`
    : state === 'earned' ? `It comes into your accounts on ${formatDate(p.due, zone)}.${ot}`
      : state === 'due' ? `Today, at noon.${ot}`
        : state === 'disputed' ? `It’s overdue. You asked ${company} about it on ${formatDate(p.asked!.at, zone)}, and it said it would pay by ${formatDate(p.asked!.answer, zone)}.`
          : `${company} hasn’t paid it, and its payday was ${formatDate(p.due, zone)}.`;
  return { week, promised, due: formatDate(p.due, zone), state: STATE_WORDS[state], stands, commission: c.amount ? `${money(c.amount)} expected` : 'None expected', why: c.words, overdue: state === 'overdue' };
}

const STATE_WORDS: Readonly<Record<ReturnType<typeof payState>, string>> = {
  estimated: 'Estimated', earned: 'Earned', due: 'Due', overdue: 'Overdue', disputed: 'Disputed', held: 'Held For You', settled: 'Settled', deferred: 'Deferred',
};
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;

/** An engagement's pay: a table, a row a week, what's the same for every row said once under it. */
function EngagementPay({ person, e }: { person: Person; e: Engagement }) {
  const { sim, run, toast } = useGame();
  const rows = e.pay.map((p) => ({ key: p.key, ...paymentRow(sim, person, e, p) }));
  const whys = [...new Set(rows.map((r) => r.why).filter(Boolean))];
  const from = projectOf(e)?.company ?? 'the production';
  const trip = tripOf(person, e);
  const dropped = notOwed(e);
  if (!rows.length) return <p className="small" style={{ margin: 0 }}>{dropped.length ? 'The work was called off before any day of it was worked, so nothing is owed for it.' : 'No pay was promised for this work.'}</p>;
  return (
    <div className="col gap-2">
      {/* Deferred pay is paid by nobody: until this was caught on 2026-10-23 (brief 23's tests) a student film's read
          “Paid by …, a payment for each week.” over a row that said nothing is paid. */}
      <p className="xs dim" style={{ margin: 0 }}>{e.pay.every((p) => p.deferred) ? `Deferred by ${from}: nothing is paid for this work.` : `Paid by ${from}, a payment for each week.`}</p>
      <div className="table-scroll">
        <table className="pay-table">
          <thead><tr><th>Week Of</th><th className="num">Promised</th><th>Due</th><th>State</th><th>Where It Stands</th><th>Commission</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const pay = e.pay.find((p) => p.key === r.key);
              const no = askRefusal(sim, e, pay);
              return (
                <tr key={r.key}>
                  <td className="nowrap">{r.week}</td>
                  <td className="num">{r.promised}</td>
                  <td className="nowrap">{r.due}</td>
                  <td className="nowrap">{r.state}</td>
                  <td>
                    {r.stands}
                    {r.overdue && (
                      <div className="row gap-2" style={{ marginTop: 'var(--s1)' }}>
                        <Gated feature="pro.ask_pay" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const x = run<{ answer: number }>('pro.ask_pay', { engagementId: e.id, key: r.key }); if (x.ok) toast(`You asked. The answer: paid by ${formatDate(x.value!.answer, sim.zone)}.`, 'positive'); }}>Ask About It</Gated>
                      </div>
                    )}
                  </td>
                  <td>{whys.length > 1 && r.why ? `${r.commission}. ${r.why}` : r.commission}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {whys.length === 1 && <p className="xs dim" style={{ margin: 0 }}>{`Commission: ${whys[0]}`}</p>}
      {/* What the contract promised and the work no longer owes, and a per diem beside the wages (from 2026-10-24). */}
      {dropped.length > 0 && <p className="xs dim" style={{ margin: 0 }}>{`${dropped.length === 1 ? 'One payment' : `${counted(dropped.length, 'payment')}`} the contract promised ${dropped.length === 1 ? 'isn’t' : 'aren’t'} owed: the work was called off before ${dropped.length === 1 ? 'its days' : 'their days'}.`}</p>}
      {(e.allowances ?? []).map((a) => <p key={a.key} className="small" style={{ margin: 0 }}>{`Per diem, ${formatDate(a.at, sim.zone)}: ${formatMoney(a.amount, saveCurrency(sim.universe))} for ${counted(a.days, 'day')} away, paid apart from your wages, with nothing withheld and no commission.`}</p>)}
      {/* Work abroad (from 2026-10-23, the owner's brief 25): the country's own tax isn't worked out, said where the pay is. */}
      {trip && trip.country !== US_RULES && <p className="xs dim" style={{ margin: 0 }}>{`Your tax return counts this pay as earned in ${countryIn(trip.country)}. Tax in ${countryIn(trip.country)} on it isn’t part of the game yet.`}</p>}
    </div>
  );
}

/**
 * Work abroad (from 2026-10-23, the owner's brief 25, `systems/worktrip.ts`): the permission it needs and the visa's
 * state, with Apply For The Visa (Apply For The ETA for the UK's concession, from 2026-10-24) behind its guide chapter and its refusal said under it; the trip's legs, each in its
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
  const route = routeFor(person, trip.country, e.days);
  const read = tripRead(person, trip.country, e.days, e.id, sim.now);
  // The UK's concession asks for an ETA rather than a visa (from 2026-10-24, brief 27), decided by the Home Office.
  const asks = route?.authorization ? 'ETA' : 'Visa';
  const decider = route?.authorization ? 'The Home Office' : 'The department';
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
        {visa && <p className="small" style={{ margin: 0 }}>{visa.status === 'pending' ? `Applied ${formatDate(visa.appliedAt ?? sim.now, zone)}. ${decider} decides on ${formatDate(visa.readyAt ?? sim.now, zone)}.` : visa.status === 'valid' ? `Granted ${formatDate(visa.issuedAt ?? sim.now, zone)}, in force to ${formatDate(visa.expiresAt ?? sim.now, zone)}.` : `${visa.name}: ${visa.status}.`}</p>}
        {needs && !visa && (
          <>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              <Gated feature="pro.apply_work_visa" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ readyAt: number }>('pro.apply_work_visa', { engagementId: e.id }); if (r.ok) toast(`You’ve applied. ${decider} decides on ${formatDate(r.value!.readyAt, zone)}.`, 'positive'); }}>{`Apply For The ${asks}`}</Gated>
            </div>
            <WhyNot reasons={[[`Apply For The ${asks}`, no]]} />
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

const usd = (c: number) => formatMoney(c, 'USD');
const BASIS: Readonly<Record<Contract['basis'], string>> = { day: 'by the day', week: 'by the week', episode: 'by the episode, each paid by its shoot days', deferred: 'deferred' };

/** A contract's own facts (from 2026-10-24, brief 25's Module 4, D1): when made, the part, the format, the dates, the pay and its estimate. */
function ContractFacts({ c, zone }: { c: Contract; zone: string }) {
  const series = c.series ? seriesById(c.series.id) : undefined;
  return (
    <>
      <div><dt>Made</dt><dd>{`${formatDate(c.madeAt, zone)}${c.version > 1 ? `, its version ${c.version}: an option on the last season’s contract, taken up` : ''}.`}</dd></div>
      <div><dt>Part</dt><dd>{`${c.billing[0]!.toUpperCase()}${c.billing.slice(1)}, under the ${c.classification} terms.`}</dd></div>
      <div><dt>Format</dt><dd>{`${c.format[0]!.toUpperCase()}${c.format.slice(1)}${series && c.series ? `, its ${ordinal(c.series.season)} season` : ''}.`}</dd></div>
      <div><dt>Service</dt><dd>{`${formatDate(c.service.from, zone)} to ${formatDate(c.service.to, zone)}.`}</dd></div>
      <div><dt>Pay</dt><dd>{c.rate !== undefined ? `${usd(c.rate)} a ${c.per}, ${BASIS[c.basis]}.` : 'Deferred.'}</dd></div>
      {c.basis !== 'deferred' && <div><dt>Estimated Gross</dt><dd>{`${usd(c.estimate)}, before withholding, commission and dues: an estimate of what you’ll earn, not money in your accounts.`}</dd></div>}
    </>
  );
}

/**
 * How the work is done (from 2026-10-24, brief 25's Module 5): its workflow and format in words, its own preparation and
 * how far it stands, the voice where the work reads it, a recall to loop, and each choice the work asks with its
 * options, the one in force said and the others a button each.
 */
function WorkflowView({ person, e }: { person: Person; e: Engagement }) {
  const { sim, run, toast } = useGame();
  const t = projectById(e.projectId)!;
  const flow = workflowOf(t);
  const fmt = formatOf(t);
  const voice = Object.values(flow.judged).some((j) => j?.strain) || Object.values(flow.builds ?? {}).some((b) => b?.strain);
  const strain = strainOf(person, sim.now);
  const live = e.status !== 'finished' && e.status !== 'canceled';
  return (
    <div className="col gap-2 small">
      <SectionHead title={flow.label} help="career.workflows" />
      <p style={{ margin: 0 }}>{`${FORMATS[t.format].label}. ${fmt.words} ${flow.words}`}</p>
      {flow.prep.special && <p style={{ margin: 0 }}>{`Its own preparation, ${flow.prep.special.label}: ${flow.prep.special.what} Done so far: ${Math.round((e.prep?.special ?? 0) * 100)}%.`}</p>}
      {voice && <p style={{ margin: 0 }}>{`Your voice’s strain now: ${Math.round(strain)} of 100. Voice work raises it, and rest eases it.`}</p>}
      {e.loop && <p style={{ margin: 0 }}>{e.loop.status === 'set' ? `Recalled to loop on ${formatDateTime(e.loop.at, sim.zone)}: four hours at a studio near you, paid half a day.` : e.loop.status === 'done' ? `Looped on ${formatDate(e.loop.at, sim.zone)}, paid half a day.` : `The looping session on ${formatDate(e.loop.at, sim.zone)} was missed, and another actor did it.`}</p>}
      {live && choicesOf(e, t).map(({ decision: d, chosen }) => {
        const now = d.options.find((o) => o.id === chosen)!;
        const others = d.options.filter((o) => o.id !== chosen);
        const reasons = others.map((o) => [o.label, choiceRefusal(e, t, d.id, o.id)] as const);
        return (
          <div key={d.id} className="col gap-1">
            <h4 style={{ margin: 0 }}>{d.label}</h4>
            <p style={{ margin: 0 }}>{`${now.label}, now: ${now.words}`}</p>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {others.map((o, i) => (
                <Gated key={o.id} feature="pro.work_choice" className="btn btn-sm" disabled={!!reasons[i]![1]} title={reasons[i]![1]} onClick={() => { const r = run('pro.work_choice', { engagementId: e.id, decision: d.id, option: o.id }); if (r.ok) toast(`${d.label}: ${o.label}.`, 'positive'); }}>{o.label}</Gated>
              ))}
            </div>
            <ul className="xs dim" style={{ margin: 0, paddingLeft: '1.1rem' }}>{others.map((o) => <li key={o.id}>{`${o.label}: ${o.words}`}</li>)}</ul>
            <WhyNot reasons={reasons} />
          </div>
        );
      })}
    </div>
  );
}

/** A clause in a sentence (D1 to D8): what it gives, and where it stands. */
function clauseWords(x: ContractClause, zone: string): string {
  switch (x.kind) {
    case 'deferred': return `Deferred pay: ${DEFERRED_WHY}.`;
    // A day of one hour's overtime, a capture day's, from 2026-10-24 (brief 25's Module 5).
    case 'overtime': return x.hours === 2
      ? `Overtime: each shoot day is eleven hours with an hour for lunch, so its ninth and tenth hours of work are paid at time and one-half, ${usd(x.perDay)} a day, an hour being ${usd(x.hourly)}, an eighth of the day rate. SAG-AFTRA’s agreement sets it.`
      : `Overtime: each day is ten hours with an hour for lunch, so its ninth hour of work is paid at time and one-half, ${usd(x.perDay)} a day, an hour being ${usd(x.hourly)}, an eighth of the day rate. SAG-AFTRA’s agreement sets it.`;
    case 'residuals': return `Residuals: a network rerun of the episode in prime time pays you again, all your pay for the time you worked with overtime at straight time, up to ${usd(x.ceiling)} for ${x.program === 'hour' ? 'an hour' : 'a half-hour'}’s program. Your pay covers its first telecast.`;
    case 'contributions': return `Pension and health: the producer pays ${pct(x.rate)} of your pay on top of it to SAG-AFTRA’s pension and health plans. It isn’t taken from your pay, and it isn’t money of yours to spend.`;
    case 'trip': return `Travel: ${x.words}`;
    case 'per-diem': return `Per diem: ${usd(x.perDay)} a day for meals while you’re away, about ${usd(x.perDay * x.days)} for the trip’s ${counted(x.days, 'day')}, paid once you’re home and apart from your wages, with nothing withheld and no commission.`;
    case 'episodes': {
      const said = x.further.map((f) => `episode ${f.n} ${f.status === 'called' ? 'called' : f.status === 'not-called' ? 'not called, so not paid' : f.status === 'off' ? 'off with the work' : 'still to be decided'}`);
      return `Episodes: guaranteed ${counted(x.numbers.length, 'episode')} of the season’s ${counted(x.ordered, 'episode')} (${x.numbers.map((n) => `episode ${n}`).join(' and ')}), ${counted(x.daysEach, 'shoot day')} each, and expected in up to ${counted(x.expected, 'episode')}. A further episode is paid only if the production calls you for it: ${said.join(', ')}.`;
    }
    case 'option': {
      const head = `Option: the production can take you up for the series’ ${ordinal(x.season)} season at ${Math.round(x.raise * 100)}% more a day, by ${formatDate(x.by, zone)}.`;
      if (x.status === 'open') return `${head} Not yet decided.`;
      return `${head} ${x.settled?.why ?? (x.status === 'exercised' ? 'Taken up.' : 'Lapsed.')}`;
    }
    // A workflow's rule (from 2026-10-24, brief 25's Module 5): its own words.
    case 'rule': return x.words;
  }
  return '';
}

/** The series' word on its seasons so far, for a contract in one: the network's decisions up to today. */
function seasonsWords(sim: Simulation, c: Contract): string[] {
  const s = c.series ? seriesById(c.series.id) : undefined;
  if (!s) return [];
  return decisionsTo(sim, s, new Date(sim.now).getUTCFullYear()).filter((d) => d.at <= sim.now).map((d) => decisionWords(sim, s, d));
}

/** Residuals' four records (D5): the entitlement, each telecast, each calculation, and each settlement. */
function ResidualView({ r, zone }: { r: Residual; zone: string }) {
  return (
    <div className="col gap-2 small">
      <p style={{ margin: 0 }}>{`From ${formatDate(r.at, zone)}, when the work was done: ${usd(r.base)} of pay for your time, overtime at straight time, against a rerun ceiling of ${usd(r.ceiling)}.`}</p>
      <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
        {r.exploitations.map((x) => {
          const calc = r.calculations.find((c) => c.key === x.key);
          const settle = r.settlements.find((y) => y.key === x.key);
          const what = x.kind === 'first-telecast' ? 'The first telecast' : 'A network rerun in prime time';
          const when = x.status === 'aired' ? `on ${formatDate(x.at, zone)}` : `scheduled for ${formatDate(x.at, zone)}`;
          const paid = settle ? (settle.paid ? ` Paid ${formatDate(settle.paid.at, zone)}: ${usd(settle.amount)}.` : ` Due by ${formatDate(settle.due, zone)}.`) : '';
          return <li key={x.key}>{`${what}, ${when}.${calc ? ` ${calculationWords(r, calc)}` : ''}${paid}`}</li>;
        })}
      </ul>
      <Fine>When an episode is on and whether it’s rerun are the game’s inventions. The rerun’s share, its ceiling and its thirty days to pay are SAG-AFTRA’s Television Agreement’s.</Fine>
    </div>
  );
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
  // A day shot without you for the weather isn't one to come (from 2026-10-25, brief 27's K5).
  const ahead = e.days.filter((d, i) => d.to > sim.now && !e.weather?.some((w) => w.day === i && !w.slipped));
  // Work abroad reads the country's permission (from 2026-10-23, the owner's brief 25), shown with its trip below.
  const now = !finished(e) && ahead.length && !e.tripId ? eligibilityRead(person, ahead, sim.now) : undefined;
  const ended = e.status === 'canceled' ? [...e.history].reverse()[0] : undefined;
  // The trip's steps among the work's (from 2026-10-23, brief 25, W11): left, arrived, checked in and out, home, in time.
  const happened = [...e.history, ...(tripOf(person, e)?.history ?? [])].sort((a, b) => a.at - b.at);
  const runs = callRuns(sim, e);
  const name = `${e.role}, ${project?.project ?? 'Your Work'}`;
  const residual = person.pro?.residuals?.find((r) => r.engagementId === e.id);
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
      {/* A day on location called off for the weather (from 2026-10-25, brief 27's K5, `WEATHER_DAY`): what it did to the days and the pay. */}
      {(e.weather ?? []).map((w) => <p key={`${w.day}:${w.was}`} className="callout small" style={{ margin: 0 }}><strong>Weather Day. </strong>{`${formatDate(w.was, zone)}, ${w.sky}: ${w.slipped ? `called off, and the days from it slipped a working day each.` : `called off, and shot without you, its scenes cut from your part.`}`}</p>)}
      {e.tripId && <TripView person={person} e={e} />}
      <details className="section-fold">
        <summary>The Contract</summary>
        <dl className="facts">
          <div><dt>Who</dt><dd>{project ? `${project.company}, ${project.contract}.${project.fictional ? ' Fictional, invented for the game.' : ''}` : 'The production.'}</dd></div>
          {project && <div><dt>Where</dt><dd>{`${project.place.venue[0]!.toUpperCase()}${project.place.venue.slice(1)}, ${project.place.city}.`}</dd></div>}
          {e.contract && <ContractFacts c={e.contract} zone={zone} />}
        </dl>
        {e.contract && <SectionHead title="Its Terms" help="career.contracts" />}
        {e.contract
          ? <ul className="small col gap-2" style={{ margin: 'var(--s2) 0 0', paddingLeft: '1.1rem' }}>{e.contract.clauses.map((x) => <li key={x.kind === 'rule' ? `rule:${x.id}` : x.kind}>{clauseWords(x, zone)}</li>)}</ul>
          : <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>This work was booked before the game kept contracts, so its terms are its pay below.</p>}
        {e.contract?.series && <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>{[seriesById(e.contract.series.id)?.words ?? '', ...seasonsWords(sim, e.contract)].join(' ')}</p>}
        {!placeKnown(e) && project && <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>{`${project.place.city} isn’t among the game’s towns, so its pay counts on your tax return as earned where you live, and the tax where the work is done isn’t worked out.`}</p>}
      </details>
      {project && project.format !== 'play' && (
        <details className="section-fold">
          <summary>How The Work Is Done</summary>
          <WorkflowView person={person} e={e} />
        </details>
      )}
      {(e.reports?.length ?? 0) > 0 && project && (
        <details className="section-fold">
          <summary>{`Each Day’s Report (${e.reports!.length})`}</summary>
          <ul className="small col gap-2" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {[...e.reports!].reverse().map((r) => <li key={`${r.day}:${r.at}`}>{`${formatDate(r.at, zone)}, ${e.days[r.day]?.label.replace(/^[^:]*: /, '') ?? 'a day'}: ${reportWords(e, project, r)}`}</li>)}
          </ul>
        </details>
      )}
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
      {residual && (
        <details className="section-fold">
          <summary>Residuals</summary>
          <ResidualView r={residual} zone={zone} />
        </details>
      )}
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
