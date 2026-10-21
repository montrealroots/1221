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
import { Panel, Fine, WhyNot } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate, formatDateTime } from '@/engine/core/time';
import { plural } from '@/engine/core/text';
import type { Simulation } from '@/engine/core/simulation';
import type { Person } from '@/engine/domain/model';
import { UNIONS } from '@/engine/content/careerwork';
import { finished, type Engagement, type ProPayment, type UnionBill } from '@/engine/systems/pro';
import { inSaveMoney } from '@/engine/systems/banking';
import { DEFERRED_WHY, counted } from '@/engine/systems/projobs';
import {
  commissionOn, joinSagRefusal, owedAfterEnding, placeKnown, projectOf, sagJoinUsd, sagMembershipFrom, weekWords, PAY_KIND, RELEASE_KIND, SAG_ELIGIBLE_KIND, DUES_KIND,
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

/** A payment, said as the Work tab lists it: what's promised and when, where it stands, and its commission. */
function PaymentLine({ person, e, p }: { person: Person; e: Engagement; p: ProPayment }) {
  const { sim } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const zone = sim.zone;
  const project = projectOf(e);
  const from = project?.company ?? 'the production';
  const promised = `${weekWords(p, zone)[0]!.toUpperCase()}${weekWords(p, zone).slice(1)}: ${formatMoney(p.promised, p.currency)} promised by ${from}`;
  // One sentence for deferred pay wherever it's said (`DEFERRED_WHY`, from 2026-10-21): until then this said "$0.00
  // promised by" and "never paid" where the offer said it pays only if the film earns money later.
  if (p.deferred) return <li>{`${weekWords(p, zone)[0]!.toUpperCase()}${weekWords(p, zone).slice(1)}: deferred by ${from}. SAG-AFTRA’s Student Film Agreement defers the pay: ${DEFERRED_WHY}, so nothing is paid for it.`}</li>;
  const r = p.received;
  if (r) {
    return (
      <li>
        <div>{`${promised}. Received ${formatDate(r.at, zone)}${r.via === 'trust' && p.inTrust ? `, passed on from ${p.inTrust.agency}’s client trust account` : ', paid straight to you'}.`}</div>
        <div className="xs">{`Gross ${money(r.gross)}, withheld for tax ${money(r.withheld)}${r.dues ? `, working dues ${money(r.dues)}` : ''}, to you ${money(r.net)}.`}</div>
        <div className="xs">{r.commission ? `Commission: ${money(r.commission)}, taken before it reached you.` : 'Commission: none.'}</div>
      </li>
    );
  }
  const gross = inSaveMoney(sim, p.promised, p.currency);
  if (p.inTrust) {
    return (
      <li>
        <div>{`${promised}. Paid into ${p.inTrust.agency}’s client trust account on ${formatDate(p.inTrust.at, zone)}, and passed on to you by ${formatDate(p.inTrust.releaseAt, zone)}.`}</div>
        <div className="xs">{`Gross ${money(p.inTrust.gross)}, withheld for tax ${money(p.inTrust.withheld)}${p.inTrust.dues ? `, working dues ${money(p.inTrust.dues)}` : ''}, held for you ${money(p.inTrust.held)}.`}</div>
        <div className="xs">{`Commission: ${money(p.inTrust.commission)}, taken when it’s passed on.`}</div>
      </li>
    );
  }
  const c = commissionOn(sim, person, e, p, gross, Math.max(p.due, sim.now));
  return (
    <li>
      <div>{`${promised}, due ${formatDate(p.due, zone)}. It isn’t paid until then, so it isn’t in your accounts yet.`}</div>
      <div className="xs">{c.amount ? `Commission expected: ${money(c.amount)}. ${c.words}` : `Commission expected: none. ${c.words}`}</div>
    </li>
  );
}

/** One engagement: what and where, its dates and calls, what permission to work read, and its pay. */
function EngagementView({ person, e }: { person: Person; e: Engagement }) {
  const { sim } = useGame();
  const zone = sim.zone;
  const project = projectOf(e);
  const calls = callsOf(sim, e);
  return (
    <article className="col gap-2" aria-label={`${e.role}, ${project?.project ?? 'Your Work'}`}>
      <h3 className="eyebrow" style={{ margin: 0 }}>{`${e.role}, ${project?.project ?? 'Your Work'}`}</h3>
      <dl className="col gap-2 small" style={{ margin: 0 }}>
        <div><dt className="strong">Who</dt><dd style={{ margin: 0 }}>{project ? `${project.company}, ${project.contract}. Fictional, as every project in the game is.` : 'The production.'}</dd></div>
        {project && <div><dt className="strong">Where</dt><dd style={{ margin: 0 }}>{`${project.place.venue[0]!.toUpperCase()}${project.place.venue.slice(1)}, ${project.place.city}.`}</dd></div>}
        <div><dt className="strong">Status</dt><dd style={{ margin: 0 }}>{STATUS[e.status]}</dd></div>
        <div><dt className="strong">Dates</dt><dd style={{ margin: 0 }}>{datesWords(e, zone)}</dd></div>
        <div>
          <dt className="strong">On Your Calendar</dt>
          <dd style={{ margin: 0 }}>
            {calls.length
              ? <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>{calls.slice(0, 6).map((i) => <li key={i.id}>{`${i.label}, ${formatDateTime(i.at, zone)}`}</li>)}{calls.length > 6 && <li>{`And ${plural(calls.length - 6, 'more call')}, on the Calendar.`}</li>}</ul>
              : finished(e) ? 'Its calls are over.' : 'No calls on your calendar for it yet.'}
          </dd>
        </div>
        {e.eligibility && <div><dt className="strong">Permission To Work</dt><dd style={{ margin: 0 }}>{`Read ${formatDate(e.eligibility.at, zone)}: ${e.eligibility.words}`}</dd></div>}
      </dl>
      <div className="col gap-1">
        <h4 className="small strong" style={{ margin: 0 }}>Pay</h4>
        {e.pay.length
          ? <ul className="small col gap-2" style={{ margin: 0, paddingLeft: '1.1rem' }}>{e.pay.map((p) => <PaymentLine key={p.key} person={person} e={e} p={p} />)}</ul>
          : <p className="small" style={{ margin: 0 }}>No pay was promised for this work.</p>}
        {!placeKnown(e) && project && <p className="xs dim" style={{ margin: 0 }}>{`${project.place.city} isn’t among the game’s towns, so its pay counts on your tax return as earned where you live, and the tax where the work is done isn’t worked out.`}</p>}
      </div>
      {e.history.length > 0 && (
        <details className="small">
          <summary>What Happened</summary>
          <ul style={{ margin: 'var(--s2) 0 0', paddingLeft: '1.1rem' }}>{e.history.map((h) => <li key={h.id}>{`${formatDate(h.at, zone)}: ${h.words}`}</li>)}</ul>
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
