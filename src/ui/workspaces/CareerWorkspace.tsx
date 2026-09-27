/**
 * SLATE — the actor's working life (`systems/career.ts`, `content/career.ts`),
 * in five tabs: who represents them, the auditions, the work, the unions and
 * the pay, and where they live. Every figure here is one the career system
 * reads or writes: the showing the agencies saw, the offers standing, the
 * week's submissions, each part's chance at the actor's craft, the days
 * booked and paid, the year's wages and what came off them, and the dues.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Stat } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate, formatDateTime, instantFromZoned, zonedParts } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { AGENCIES, AGENCY_SOURCE, AGENT_COMMISSION, CAREER_CITIES, EQUITY, ROLES, SAG_AFTRA, SHOWCASE_2029 } from '@/engine/content/career';
import { YALE_DRAMA } from '@/engine/content/school';
import {
  ESTIMATE, LEAVING, agencyById, bookingChance, careerOf, managerById, mayLeave, onSite, rateOf, roleById, staleHeadshots, submissionsAWeek, workCityOf, workDays, type Booking, type CareerRecord, type CastingSite,
} from '@/engine/systems/career';
import { costsAt, HOUSING, type Housing } from '@/engine/systems/household';
import { focusOf } from '@/engine/systems/school';
import { earningsOf } from '@/engine/systems/earnings';
import { MANAGEMENT, MANAGERS, OVERTIME, RESIDUALS, WORK_COSTS } from '@/engine/content/career';

type CareerTab = 'agency' | 'auditions' | 'work' | 'unions' | 'home';

const CAREER_TABS: readonly { id: CareerTab; label: string }[] = [
  { id: 'agency', label: 'Representation' },
  { id: 'auditions', label: 'Auditions' },
  { id: 'work', label: 'Work' },
  { id: 'unions', label: 'Unions And Pay' },
  { id: 'home', label: 'Where You Live' },
];

const cityName = (id: string) => CITIES.require(id).name;
const zoneOf = (id: string) => CITIES.require(id).timeZone;
const pct = (x: number) => `${Math.round(x * 100)}%`;

export function CareerWorkspace() {
  const person = useWorld((s) => s.player);
  const [tab, setTab] = useState<CareerTab>('agency');
  if (!person.career) return <Empty title="No Career Yet" body="It begins at the showcase, in the last spring at school." />;
  const career = person.career;
  const agency = career.agencyId ? agencyById(career.agencyId) : undefined;
  const panes: Record<CareerTab, JSX.Element> = {
    agency: <AgencyPane />, auditions: <AuditionsPane />, work: <WorkPane />, unions: <UnionsPane />, home: <HomePane />,
  };
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Career</div>
        <h1>{agency ? `With ${agency.name}` : 'Unrepresented'}</h1>
        <p className="muted">
          {agency && career.agencyCity ? `Represented from its ${cityName(career.agencyCity)} office. ` : ''}
          {career.credits.length ? `${career.credits.length} ${career.credits.length === 1 ? 'credit' : 'credits'}.` : 'No professional credits yet.'}
        </p>
      </div>
      <div className="tabs" role="tablist" aria-label="Your Career">
        {CAREER_TABS.map((one, i) => (
          <button
            key={one.id} id={`career-tab-${one.id}`} type="button" role="tab" className="tab"
            aria-selected={one.id === tab} aria-controls={`career-pane-${one.id}`} tabIndex={one.id === tab ? 0 : -1}
            onClick={() => setTab(one.id)}
            onKeyDown={(e) => {
              const go = (n: number) => { const next = CAREER_TABS[(n + CAREER_TABS.length) % CAREER_TABS.length]!; setTab(next.id); document.getElementById(`career-tab-${next.id}`)?.focus(); };
              if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
              else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
              else if (e.key === 'Home') { e.preventDefault(); go(0); }
              else if (e.key === 'End') { e.preventDefault(); go(CAREER_TABS.length - 1); }
            }}
          >
            {one.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`career-pane-${tab}`} aria-labelledby={`career-tab-${tab}`} tabIndex={0}>
        {panes[tab]}
      </div>
    </>
  );
}

/** The agency, the offers standing, leaving, the showcases, submitting yourself, and the agencies' bars. */
function AgencyPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const career = person.career!;
  const agency = career.agencyId ? agencyById(career.agencyId) : undefined;
  const may = mayLeave(sim, person);
  const offers = career.offers.filter((o) => o.until > sim.now);
  const ended = career.ended ? agencyById(career.ended.agencyId) : undefined;

  return (
    <div className="col gap-5">
      <Panel
        title={agency ? agency.name : 'No Agency'}
        subtitle={agency && career.agencyCity ? `${cityName(career.agencyCity)} office, signed ${formatDate(career.signedAt!, zoneOf(career.agencyCity))}` : undefined}
        actions={agency ? <Gated feature="career.leave" onClick={() => { const a = run<{ left: string }>('career.leave'); if (a.ok) toast(`You left ${a.value!.left}.`, 'positive'); }}>Leave The Agency</Gated> : undefined}
      >
        <div className="col gap-3">
          {agency ? (
            <>
              <div className="grid grid-3">
                <Stat label="Commission" value={pct(AGENT_COMMISSION.rate)} note={`${pct(AGENT_COMMISSION.equityRehearsalRate)} of an Equity rehearsal week at the minimum`} />
                <Stat label="Auditions A Week" value={`About ${agency.auditionsPerWeek}`} note="SLATE’s estimate of its reach" />
                <Stat label="Missed Auditions" value={`${career.missed} of ${ESTIMATE.dropAfterMissed}`} note="Before it lets you go" tone={career.missed > 0 ? 'warning' : undefined} />
              </div>
              <p className="small" style={{ margin: 0 }}>
                On SAG-AFTRA work at scale the producer pays scale plus 10%, and the 10% is the agency’s. You may leave on SAG-AFTRA’s terms: with no offer in the first {LEAVING.firstDays} days, or with fewer than {LEAVING.fewerThanDays} days’ work in the last {LEAVING.windowDays}. {may.why}
              </p>
            </>
          ) : (
            <p className="small" style={{ margin: 0 }}>
              {ended ? `${career.ended!.left ? `You left ${ended.name}` : `${ended.name} let you go`} on ${formatDate(career.ended!.at, sim.zone)}: ${career.ended!.reason} ` : ''}
              Without an agency, work comes from submitting yourself, and a job worked can bring an agency’s call.
            </p>
          )}
          <p className="xs dim" style={{ margin: 0 }}>Source: {AGENT_COMMISSION.source}; {LEAVING.source}.</p>
        </div>
      </Panel>

      {offers.length > 0 && (
        <Panel title="Offers Of Representation" subtitle="Each stands a month">
          <div className="col gap-2">
            {offers.map((o) => (
              <div key={`${o.agencyId}-${o.cityId}`} className="row-between small">
                <span>{agencyById(o.agencyId)!.name}, {cityName(o.cityId)}, until {formatDate(o.until, zoneOf(o.cityId))}</span>
                <Gated feature="career.sign" onClick={() => { if (run('career.sign', { agencyId: o.agencyId, cityId: o.cityId }).ok) toast(`Signed with ${agencyById(o.agencyId)!.name}.`, 'positive'); }}>Sign</Gated>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <ManagerPanel />

      <Panel
        title="Submitting Yourself"
        subtitle={`${career.submitted} of ${submissionsAWeek(career, sim.now)} this week`}
        actions={<Gated feature="career.self_submit" onClick={() => { if (run('career.self_submit').ok) toast('Submitted. Any audition comes on Monday.', 'positive'); }}>Submit Yourself</Gated>}
      >
        <p className="small" style={{ margin: 0 }}>
          On the casting sites every actor uses, for the low budget films that take submissions. About {pct(ESTIMATE.selfSubmitCallback)} bring an audition with a paid site’s headshot and reel, and half that free, with the week’s on Monday (SLATE’s estimate).
          {career.since === undefined ? ' Submissions start when school ends.' : ''}
        </p>
      </Panel>

      <WorkCostsPanel />

      <Panel title="The Showcase" subtitle={career.showcases.length ? undefined : `New York ${formatDate(instantFromZoned({ ...SHOWCASE_2029.newYork, hour: 17 }, zoneOf(CAREER_CITIES[0])), zoneOf(CAREER_CITIES[0]))}, Los Angeles a week later`}>
        <div className="col gap-3">
          {career.showcases.length > 0 && (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">City</th><th scope="col">Date</th><th scope="col" className="num">How You Read</th></tr></thead>
                <tbody>
                  {career.showcases.map((one) => (
                    <tr key={one.cityId}><td>{cityName(one.cityId)}</td><td>{formatDate(one.at, zoneOf(one.cityId))}</td><td className="num mono">{one.score.toFixed(1)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Agency</th><th scope="col">Reach</th><th scope="col" className="num">Showing It Needs</th></tr></thead>
              <tbody>
                {AGENCIES.map((a) => (
                  <tr key={a.id}><td>{a.name}</td><td>{a.tier === 1 ? 'Widest' : a.tier === 2 ? 'Wide' : 'Growing'}</td><td className="num mono">{a.bar}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="xs dim" style={{ margin: 0 }}>
            Scenes for agents, managers and casting directors in New York and then Los Angeles, as Yale holds them; the class of {person.school?.classOf ?? SHOWCASE_2029.newYork.year}’s dates are SLATE’s estimate by 2025’s and 2026’s. A showing reads your acting as much as everything else together, and up to a fifth less tired. The agencies are the ones Yale names; what each needs to see, and its reach, are SLATE’s estimate. Source: {SHOWCASE_2029.source}; {AGENCY_SOURCE}.
          </p>
        </div>
      </Panel>
    </div>
  );
}

/** The auditions ahead and behind, offers to answer, and each part's chance at the actor's craft now. */
function AuditionsPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const career = person.career!;
  const cur = saveCurrency(sim.universe);
  const ahead = career.auditions.filter((a) => a.status === 'ahead').sort((a, b) => a.at - b.at);
  const behind = career.auditions.filter((a) => a.status !== 'ahead').slice(-15).reverse();
  const offered = career.bookings.filter((b) => b.status === 'offered');
  const focus = focusOf(person);
  const result = { done: 'Not Booked', missed: 'Missed', booked: 'Booked', ahead: '' } as const;

  return (
    <div className="col gap-5">
      {offered.length > 0 && (
        <Panel title="Offers To Answer">
          <div className="col gap-3">
            {offered.map((b) => (
              <div key={b.id} className="row-between small">
                <span>{roleById(b.roleId).label}: {spanOf(b)} from {formatDate(b.starts, zoneOf(b.cityId))}, answer by {formatDateTime(b.dueAt, zoneOf(b.cityId))}</span>
                <span className="row gap-2">
                  <Gated feature="career.accept" onClick={() => { if (run('career.accept', { bookingId: b.id }).ok) toast('Taken. The days are on your calendar.', 'positive'); }}>Take It</Gated>
                  <Gated feature="career.pass" onClick={() => { run('career.pass', { bookingId: b.id }); }}>Pass</Gated>
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Auditions Ahead" subtitle={career.agencyId ? 'Sent by your agency each Monday' : undefined}>
        {ahead.length ? (
          <div className="col gap-2">
            {ahead.map((a) => (
              <div key={a.id} className="row-between small">
                <span>{roleById(a.roleId).label}{a.self ? ', submitted yourself' : ''}{a.coached ? ', coached' : ''}</span>
                <span className="row gap-2">
                  <span className="mono">{a.mode === 'tape' ? 'Self-Tape' : `In The Room, ${cityName(a.cityId)}`}, {formatDateTime(a.at, zoneOf(a.cityId))}</span>
                  {!a.coached && <Gated feature="career.coach" onClick={() => { if (run('career.coach', { auditionId: a.id }).ok) toast('An hour with a coach on it.', 'positive'); }}>Book A Coach</Gated>}
                </span>
              </div>
            ))}
          </div>
        ) : <p className="small muted" style={{ margin: 0 }}>None this week.</p>}
      </Panel>

      {behind.length > 0 && (
        <Panel title="Lately">
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Part</th><th scope="col">From</th><th scope="col">When</th><th scope="col">How</th><th scope="col">Result</th></tr></thead>
              <tbody>
                {behind.map((a) => (
                  <tr key={a.id}><td>{roleById(a.roleId).label}</td><td>{a.self ? 'Submitted Yourself' : 'Your Agency'}</td><td>{formatDate(a.at, zoneOf(a.cityId))}</td><td>{a.mode === 'tape' ? 'Self-Tape' : 'In The Room'}</td><td>{result[a.status]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Panel title="The Parts" subtitle="What each pays, and your chance in the room today">
        <div className="col gap-3">
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Part</th><th scope="col">Contract</th><th scope="col" className="num">Pays</th><th scope="col">Per</th><th scope="col" className="num">Your Chance</th></tr></thead>
              <tbody>
                {ROLES.map((r) => (
                  <tr key={r.id}>
                    <td>{r.label}</td>
                    <td>{r.union === 'sag' ? 'SAG-AFTRA' : 'Equity'}</td>
                    <td className="num mono">{formatMoney(rateOf(r, sim.now, r.cities[0]!, cur), cur)}</td>
                    <td>{r.series ? 'Episode' : r.medium === 'voice' ? 'Session' : r.medium === 'stage' ? 'Week' : 'Day'}</td>
                    <td className="num mono">{pct(bookingChance(person.craft!, r, focus, 'room'))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="xs dim" style={{ margin: 0 }}>
            The pay is each contract’s minimum on today’s date: SAG-AFTRA’s 2026–2030 television and theatrical rates, its low budget agreements, Equity’s LORT rates and its Broadway minimum; after a contract’s last published step it holds. A guest star’s pay is the major role’s five- or eight-day price, by the day; a series regular’s is by the episode, 13 guaranteed. A shooting day runs {OVERTIME.dayHours[0]} to {OVERTIME.dayHours[1]} hours, and the hours past the contract’s are paid at its overtime rates. Your chance is SLATE’s estimate: about one in twenty at the part’s bar, as the trade reckons for a newer actor, more above it, less tired or on tape.
          </p>
        </div>
      </Panel>
    </div>
  );
}

const spanOf = (b: Booking) => {
  const role = roleById(b.roleId);
  if (role.series) return `${role.series.episodes} episodes over ${role.series.weeks} weeks`;
  if (role.medium === 'voice') return `${b.units} ${b.units === 1 ? 'session' : 'sessions'}`;
  if (role.arc) return `${b.units} episodes, a week each`;
  return role.medium === 'screen' ? `${b.units} ${b.units === 1 ? 'day' : 'days'}` : `${b.rehearsalWeeks} weeks of rehearsal and ${b.units} of performances`;
};

/** The jobs taken and ahead, and the credits. */
function WorkPane() {
  const person = useWorld((s) => s.player);
  const career = person.career!;
  const jobs = career.bookings.filter((b) => b.status === 'accepted');
  return (
    <div className="col gap-5">
      <Panel title="Jobs" subtitle={career.option ? `Under option to your series until ${formatDate(career.option.decidedAt, 'America/New_York')}` : jobs.length ? undefined : 'Nothing taken now'}>
        {jobs.length ? (
          <div className="col gap-2">
            {jobs.map((b) => (
              <div key={b.id} className="row-between small">
                <span>{roleById(b.roleId).label}{b.season ? `, Season ${b.season}` : ''}, {cityName(workCityOf(b))}{b.location ? ' (On Location)' : ''}: {spanOf(b)}</span>
                <span className="mono">{b.worked} of {workDays(b).length} days worked</span>
              </div>
            ))}
          </div>
        ) : <p className="small muted" style={{ margin: 0 }}>A job you take puts its days on your calendar. You must be in its city, awake, for every one: a day missed ends the job, and an agency that booked it lets you go.</p>}
      </Panel>
      <ResidualsPanel />
      <Panel title="Credits">
        {career.credits.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Year</th><th scope="col">Part</th><th scope="col">City</th></tr></thead>
              <tbody>
                {[...career.credits].reverse().map((c, i) => <tr key={i}><td className="mono">{c.year}</td><td>{roleById(c.roleId).label}</td><td>{cityName(c.cityId)}</td></tr>)}
              </tbody>
            </table>
          </div>
        ) : <p className="small muted" style={{ margin: 0 }}>None yet.</p>}
      </Panel>
    </div>
  );
}

/** The unions, the dues, and the year's wages and what came off them. */
function UnionsPane() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const career: CareerRecord = careerOf(person);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const ledger = earningsOf(person).years;
  const years = Object.keys(ledger).filter((y) => ledger[y]!.acting > 0).sort().reverse();
  const sag = career.unions.sag;
  const equity = career.unions.equity;
  const sagWord = !sag ? 'Not Yet Eligible' : sag.joinedAt !== undefined ? 'Member' : 'Eligible';
  return (
    <div className="col gap-5">
      <div className="grid grid-2">
        <Panel title="SAG-AFTRA">
          <div className="col gap-3">
            <Stat label="Status" value={sagWord} note={sag?.joinedAt !== undefined ? `Since ${formatDate(sag.joinedAt, sim.zone)}` : sag ? `Since ${formatDate(sag.eligibleAt, sim.zone)}` : undefined} />
            <p className="small" style={{ margin: 0 }}>
              Your first SAG-AFTRA job makes you eligible. Taking another {SAG_AFTRA.taftHartleyDays} days on means joining first: the {money(SAG_AFTRA.initiation)} initiation fee and half a year’s dues. Dues are {money(SAG_AFTRA.basicDues)} a year, billed each May and November, and each May {(SAG_AFTRA.workDues * 100).toFixed(3)}% of the last year’s SAG-AFTRA earnings.
            </p>
            <p className="xs dim" style={{ margin: 0 }}>Source: {SAG_AFTRA.source}.</p>
          </div>
        </Panel>
        <Panel title="Actors’ Equity">
          <div className="col gap-3">
            <Stat label="Status" value={equity ? 'Member' : 'Not A Member'} note={equity ? `${money(equity.initiationPaid)} of the ${money(EQUITY.initiation)} fee paid` : undefined} />
            <p className="small" style={{ margin: 0 }}>
              Your first Equity contract makes you a member: {money(EQUITY.initiationNow)} of the {money(EQUITY.initiation)} initiation fee down and the rest over two years. Dues are {money(EQUITY.basicDues)} a year, each May and November, and {EQUITY.workingDues * 100}% of every Equity check.
            </p>
            <p className="xs dim" style={{ margin: 0 }}>Source: {EQUITY.source}.</p>
          </div>
        </Panel>
      </div>
      <Panel title="Wages By Year">
        {years.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Year</th><th scope="col" className="num">Gross</th><th scope="col" className="num">Of It Residuals</th><th scope="col" className="num">Under SAG-AFTRA</th><th scope="col" className="num">Commission</th><th scope="col" className="num">Tax Withheld</th></tr></thead>
              <tbody>
                {years.map((y) => <tr key={y}><td className="mono">{y}</td><td className="num mono">{money(ledger[y]!.acting)}</td><td className="num mono">{money(ledger[y]!.residuals)}</td><td className="num mono">{money(ledger[y]!.sag)}</td><td className="num mono">{money(ledger[y]!.commission)}</td><td className="num mono">{money(ledger[y]!.withheld)}</td></tr>)}
              </tbody>
            </table>
          </div>
        ) : <p className="small muted" style={{ margin: 0 }}>Nothing earned acting yet.</p>}
        <p className="xs dim" style={{ margin: 'var(--s3) 0 0' }}>
          Tax is withheld the way a payroll does it, on the year’s wages so far at the job’s town, with the agency’s commission and Equity’s working dues off each check before it reaches your bank.
        </p>
      </Panel>
    </div>
  );
}

/** Moving to where the work is. */
function HomePane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const cities = [...CAREER_CITIES, YALE_DRAMA.cityId];
  return (
    <Panel title="Where You Live" subtitle={`${cityName(person.currentLocationId)}, ${person.home ? (person.home.kind === 'sofa' ? 'on a friend’s sofa' : HOUSING[person.home.kind as Housing].label.toLowerCase()) : 'without a home'}`}>
      <div className="col gap-3">
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">City</th><th scope="col" className="num">A Room</th><th scope="col" className="num">A Place Of Your Own</th><th scope="col">Move</th></tr></thead>
            <tbody>
              {cities.map((id) => (
                <tr key={id}>
                  <td>{cityName(id)}</td>
                  <td className="num mono">{formatMoney(costsAt(id, 'shared', cur, sim.now).rent, cur)}</td>
                  <td className="num mono">{formatMoney(costsAt(id, 'own', cur, sim.now).rent, cur)}</td>
                  <td>
                    <span className="row gap-2">
                      {(['shared', 'own'] as const).map((kind) => (
                        <Gated key={kind} feature="career.relocate" onClick={() => { if (run('career.relocate', { cityId: id, kind }).ok) toast(`Moved to ${cityName(id)}.`, 'positive'); }}>
                          {kind === 'shared' ? 'A Room' : 'Your Own'}
                        </Gated>
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small" style={{ margin: 0 }}>
          An audition in the room, and every day of a job, is in the city it’s in, and you must be there. A self-tape you make wherever you are. Moving costs a deposit and the rest of the month’s rent, and the old deposit comes back, less anything owed.
        </p>
      </div>
    </Panel>
  );
}

/** A manager: who, what they take, leaving after the first year, and the offers standing. */
/** What the work costs: the casting sites, headshots, a kit for tapes, a class. */
function WorkCostsPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const career = careerOf(person);
  const cur = saveCurrency(sim.universe);
  if (career.since === undefined) return null;
  const stale = staleHeadshots(career, sim.now);
  return (
    <Panel title="What The Work Costs" subtitle={`${formatMoney(yearCosts(person, sim.now), cur)} this year, deducted where the return allows`}>
      <div className="col gap-3">
        {(Object.keys(WORK_COSTS.sites) as CastingSite[]).map((site) => {
          const held = career.sites?.[site];
          const on = onSite(career, site, sim.now);
          return (
            <div key={site} className="row-between small">
              <span>{WORK_COSTS.sites[site].label}, {formatMoney(WORK_COSTS.sites[site].price, cur)} a year: {on ? `to ${formatDate(held!.until, sim.zone)}${held!.renews ? ', renewing' : ''}` : 'Not Joined'}</span>
              {on && held!.renews
                ? <Gated feature="career.subscribe" onClick={() => { if (run('career.subscribe', { site, on: false }).ok) toast('It runs to its date and stops.', 'positive'); }}>Stop Renewing</Gated>
                : <Gated feature="career.subscribe" onClick={() => { if (run('career.subscribe', { site, on: true }).ok) toast('Joined for the year.', 'positive'); }}>{on ? 'Renew' : 'Join'}</Gated>}
            </div>
          );
        })}
        <div className="row-between small">
          <span>Headshots, {formatMoney(WORK_COSTS.headshots, cur)} with prints: from {formatDate(career.headshotsAt ?? career.since, sim.zone)}{stale ? ', out of date' : ''}</span>
          <Gated feature="career.headshots" onClick={() => { if (run('career.headshots').ok) toast('New headshots.', 'positive'); }}>New Headshots</Gated>
        </div>
        <div className="row-between small">
          <span>A self-tape kit, {formatMoney(WORK_COSTS.kit, cur)}: {career.kit ? 'Yours' : 'None'}</span>
          {!career.kit && <Gated feature="career.buy_kit" onClick={() => { if (run('career.buy_kit').ok) toast('Tapes read better now.', 'positive'); }}>Buy A Kit</Gated>}
        </div>
        <div className="row-between small">
          <span>A scene-study class, {formatMoney(WORK_COSTS.classMonthly, cur)} a month: {career.scene ? 'Enrolled' : 'None'}</span>
          {career.scene
            ? <Gated feature="career.class" onClick={() => { if (run('career.class', { on: false }).ok) toast('Out of the class.', 'positive'); }}>Leave The Class</Gated>
            : <Gated feature="career.class" onClick={() => { if (run('career.class', { on: true }).ok) toast('In class from this week.', 'positive'); }}>Join A Class</Gated>}
        </div>
        <p className="xs dim" style={{ margin: 0 }}>
          Prices are 2025–26’s. A free submission sends a name and a résumé, and is seen about half as often; Backstage’s own listings take {WORK_COSTS.backstageSubmissions} more submissions a week. Headshots more than two years old cost about a fifth of your auditions; a tape without a kit reads about a fifth worse; a week in class grows your acting as a class at school does; a coach, {formatMoney(WORK_COSTS.coach, cur)} an hour, makes an audition book about a quarter more often. What each does is SLATE’s estimate. New York and California let an actor deduct it all above 2% of income. Source: {WORK_COSTS.source}.
        </p>
      </div>
    </Panel>
  );
}

const yearCosts = (person: Parameters<typeof earningsOf>[0], at: number) => earningsOf(person).years[zonedParts(at, 'America/New_York').year]?.jobCosts ?? 0;

function ManagerPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const career = careerOf(person);
  const manager = career.managerId ? managerById(career.managerId) : undefined;
  const offers = career.managerOffers.filter((o) => o.until > sim.now);
  const pctOf = (x: number) => `${Math.round(x * 100)}%`;
  return (
    <Panel
      title={manager ? manager.name : 'No Manager'}
      subtitle={manager && career.managerSince !== undefined ? `Managing you since ${formatDate(career.managerSince, sim.zone)}` : 'A manager is beside an agency, not instead of one'}
      actions={manager ? <Gated feature="career.leave_manager" onClick={() => { const a = run<{ left: string }>('career.leave_manager'); if (a.ok) toast(`You left ${a.value!.left}.`, 'positive'); }}>Leave Your Manager</Gated> : undefined}
    >
      <div className="col gap-3">
        {offers.map((o) => (
          <div key={o.managerId} className="row-between small">
            <span>{managerById(o.managerId)!.name}, until {formatDate(o.until, sim.zone)}</span>
            <Gated feature="career.sign_manager" onClick={() => { if (run('career.sign_manager', { managerId: o.managerId }).ok) toast(`Signed with ${managerById(o.managerId)!.name}.`, 'positive'); }}>Sign</Gated>
          </div>
        ))}
        <p className="small" style={{ margin: 0 }}>
          A manager takes {pctOf(MANAGEMENT.withAgent)} of what you earn beside an agent and {pctOf(MANAGEMENT.alone)} without one, gets you about {MANAGEMENT.auditionsPerWeek} more audition a week, and, while you’ve no agency, sets up meetings that bring one about {pctOf(MANAGEMENT.findsAnAgency)} of months. A first contract runs a year.
        </p>
        <p className="xs dim" style={{ margin: 0 }}>
          The firms are ones signing actors in 2026: {MANAGERS.map((m) => m.name).join(', ')}. Nothing caps a manager’s commission; the rates are what the trade reckons, and the rest is SLATE’s estimate. Source: {MANAGEMENT.source}.
        </p>
      </div>
    </Panel>
  );
}

/** What each job has paid since, and how it's seen. */
function ResidualsPanel() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const career = careerOf(person);
  const cur = saveCurrency(sim.universe);
  const seen = { network: 'On A Network', svod: 'Streaming', film: 'A Film’s Television And Streaming', commercial: 'A Commercial’s Cycles' } as const;
  const size = { small: 'A Small Service', middle: 'A Middling Service', large: 'A Big Service' } as const;
  return (
    <Panel title="Residuals" subtitle={career.residuals.length ? undefined : 'Television and film work pays after it’s made'}>
      <div className="col gap-3">
        {career.residuals.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Part</th><th scope="col">Where</th><th scope="col">Since</th><th scope="col" className="num">Payments</th><th scope="col" className="num">Paid</th></tr></thead>
              <tbody>
                {[...career.residuals].reverse().map((r) => (
                  <tr key={r.id}>
                    <td>{roleById(r.roleId).label}</td>
                    <td>{seen[r.kind]}{r.size ? `, ${size[r.size]}` : ''}{r.rerun ? ', Rerun' : ''}{r.syndicated ? ', Syndicated' : ''}{r.hit ? ', A Hit' : ''}</td>
                    <td>{formatDate(r.airsAt, sim.zone)}</td>
                    <td className="num mono">{r.payments}</td>
                    <td className="num mono">{formatMoney(r.paid, cur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="xs dim" style={{ margin: 0 }}>
          A network’s prime-time rerun pays what you were paid, to its ceiling, within 30 days; syndication a share of the part’s minimum by the run; streaming, after its first 90 days, a share each year by the service’s size, and a hit a bonus; a film’s cast shares {(RESIDUALS.filmPool * 100).toFixed(1)}% of its television and streaming money. The formulas are the agreements’. Where a job is seen, how it does, and what a film earns are SLATE’s estimate. Source: {RESIDUALS.source}.
        </p>
      </div>
    </Panel>
  );
}
