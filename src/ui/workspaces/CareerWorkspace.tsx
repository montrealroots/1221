/**
 * SLATE — the actor's working life (`systems/career.ts`, `content/career.ts`),
 * in five tabs: who represents them, the auditions, the work, the unions and
 * the pay, and where they live. Every figure here is one the career system
 * reads or writes: the showing the agencies saw, the offers standing, the
 * week's submissions, each part's chance at the actor's craft, the days
 * booked and paid, the year's wages and what came off them, and the dues.
 */

import { useState } from 'react';
import { plural } from '@/engine/core/text';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Stat, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate, formatDateTime, instantFromZoned, zonedParts } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { residenceRefusal } from '@/engine/systems/documents';
import { AGENCIES, AGENCY_SOURCE, AGENT_COMMISSION, CAREER_CITIES, EQUITY, ROLES, SAG_AFTRA, SHOWCASE_2029 } from '@/engine/content/career';
import { SKILLS, YALE_DRAMA } from '@/engine/content/school';
import { GENRE_BY_ID } from '@/engine/content/interests';
import {
  AGENCY_TERM, ESTIMATE, LEAVING, WORKSHOP_KIND, acceptRefusal, agencyById, publicistRefusal, publicityFor, bookingChance, careerOf, managerById, mayLeave, onSite, rateOf, roleById, staleHeadshots, submissionsAWeek, workCityOf, t1287Quote, workDays, type Booking, type CareerRecord, type CastingSite, workCity, homeTownOf } from '@/engine/systems/career';
import { exchange } from '@/engine/content/currency';
import { SOCIAL_SECURITY, claimFactor, socialSecurityOf, socialSecurityRefusal } from '@/engine/systems/socialsecurity';
import { STATE_PENSION, qualifyingYears, statePensionAge, statePensionRefusal, weeklyPension } from '@/engine/systems/statepension';
import { BIENESTAR, IRISH_PENSION, bienestarRefusal, irishContributions, irishPensionRefusal, irishWeekly } from '@/engine/systems/homepensions';
import { isoOfCountry } from '@/engine/systems/documents';
import { costsAt, HOUSING } from '@/engine/systems/household';
import { bondWord, focusOf, summerOf } from '@/engine/systems/school';
import { SAG_PENSION, earlyRefusal, pensionAge, pensionOf } from '@/engine/systems/pension';
import { COMMERCIAL_AGENCIES, COMMERCIAL_LEAVING, commercialAgencyById, commercialEarnings, commercialRefusal, mayLeaveCommercial } from '@/engine/systems/commercial';
import { earningsOf } from '@/engine/systems/earnings';
import { MANAGEMENT, MANAGERS, OVERTIME, RESIDUALS, WORK_COSTS } from '@/engine/content/career';
import { inSaveMoney } from '@/engine/systems/banking';
import { AttributesPanel } from '@/ui/components/AttributesPanel';

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

/**
 * The trades, and the class after Yale (`systems/rivals.ts`): what Deadline
 * and Playbill have printed, and where each classmate's career has got to.
 */
function TradesPane() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const news = person.career?.news ?? [];
  const mates = person.school?.classmates.filter((m) => m.career) ?? [];
  if (!news.length && !mates.length) return null;
  return (
    <div className="col gap-5" style={{ marginTop: 'var(--s5)' }}>
      {news.length > 0 && (
        <Panel title="Trade News" subtitle="What the trades have printed about you and your class">
          <div className="col gap-2">
            {news.slice(0, 12).map((n) => (
              <div key={`${n.at}-${n.headline}`} className="row-between small">
                <span><strong>{n.source}:</strong> {n.headline}</span>
                <span className="xs dim">{formatDate(n.at, sim.zone)}</span>
              </div>
            ))}
          </div>
          <Fine>A line about you in the trades adds a little to your recognition. The outlets are the real ones; what they print about you and your class, and which work makes them, is SLATE’s.</Fine>
        </Panel>
      )}
      {mates.length > 0 && (
        <Panel title="Your Class" subtitle={`Yale’s class of ${person.school!.classOf}, after the degree`}>
          <table className="table">
            <thead><tr><th scope="col">Classmate</th><th scope="col">Agency</th><th scope="col" className="num">Parts Booked</th><th scope="col">Latest</th><th scope="col">To You</th></tr></thead>
            <tbody>
              {mates.map((m) => {
                const last = m.career!.credits.at(-1);
                return <tr key={m.name}><td>{m.name}</td><td>{m.career!.agencyId ? agencyById(m.career!.agencyId)!.name : 'None'}</td><td className="num mono">{m.career!.credits.length}</td><td>{last ? `${roleById(last.roleId).label}, ${last.year}` : ''}</td><td>{bondWord(m.bond) ?? ''}</td></tr>;
              })}
            </tbody>
          </table>
          <p className="xs dim" style={{ margin: 'var(--s3) 0 0' }}>They work as you do: an agency’s reach and their craft against each part’s bar. Now and then one is in the room for your audition, and one who reads better is likelier to get it.</p>
        </Panel>
      )}
    </div>
  );
}

/** The commercial agent, beside the theatrical one (`systems/commercial.ts`). */
function CommercialPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const career = person.career!;
  if (career.since === undefined) return null;
  const cur = saveCurrency(sim.universe);
  const rep = career.commercial;
  const agency = rep ? commercialAgencyById(rep.agencyId) : undefined;
  const may = mayLeaveCommercial(sim, person);
  return (
    <div style={{ marginTop: 'var(--s5)' }}>
      <Panel
        title={agency ? `${agency.name}, For Commercials` : 'No Commercial Agent'}
        subtitle={rep ? `${CITIES.require(rep.cityId).name} office, signed ${formatDate(rep.signedAt, sim.zone)}, the contract running to ${formatDate(rep.termEnds, sim.zone)}` : 'Commercials come from your theatrical agency until you sign one'}
        actions={agency ? <Gated feature="career.commercial_leave" onClick={() => { const a = run<{ left: string }>('career.commercial_leave'); if (a.ok) toast(`You left ${a.value!.left}.`, 'positive'); }}>Leave The Commercial Agent</Gated> : undefined}
      >
        <div className="col gap-3">
          {rep ? (
            <p className="small" style={{ margin: 0 }}>
              It sends your commercial auditions, on camera and voice-over, and takes 10% of what they book; your theatrical agency sends none now. From commercials in the last {COMMERCIAL_LEAVING.windowDays} days: {formatMoney(commercialEarnings(sim, person, COMMERCIAL_LEAVING.windowDays), cur)}. You may leave on the union’s commercials terms: in a first contract’s first {COMMERCIAL_LEAVING.initialDays} days only after {COMMERCIAL_LEAVING.firstDays} with no commercial offer, and after them with under the floor from commercials in {COMMERCIAL_LEAVING.windowDays}. {may.why}
            </p>
          ) : (
            <div className="col gap-2">
              {COMMERCIAL_AGENCIES.map((a) => {
                const no = commercialRefusal(sim, person, a.id);
                return (
                  <div key={a.id} className="row-between small">
                    <span>{a.name}: {a.cities.map((c) => CITIES.require(c).name).join(' and ')}{no ? `. ${no}` : ''}</span>
                    {!no && <Gated feature="career.commercial_meet" onClick={() => run('career.commercial_meet', { agencyId: a.id })}>Meet</Gated>}
                  </div>
                );
              })}
            </div>
          )}
          <Fine>Many actors have a theatrical agent and a commercial one. The agencies are real ones with commercial departments; what each needs to see (your presence, mostly, and your record), how many auditions each sends, and a first contract’s year renewed for three when it booked you a commercial are SLATE’s estimate. The rule on leaving is SAG-AFTRA’s for commercials contracts. Source: {COMMERCIAL_LEAVING.source}.</Fine>
        </div>
      </Panel>
    </div>
  );
}

/** Who a part's contract is with. Until 2026-09-29 every part not SAG-AFTRA's read Equity, a British one too. */
const UNION_NAMES = { sag: 'SAG-AFTRA', equity: 'Actors’ Equity', 'equity-uk': 'Equity (UK)', 'irish-equity': 'Irish Equity' } as const;

export function CareerWorkspace() {
  const person = useWorld((s) => s.player);
  const [tab, setTab] = useState<CareerTab>('agency');
  if (!person.career) return <Empty title="No Career Yet" body="It begins in the first summer at school, when you can put yourself up for work, and in earnest at the showcase in the last spring." />;
  const career = person.career;
  const agency = career.agencyId ? agencyById(career.agencyId) : undefined;
  const panes: Record<CareerTab, JSX.Element> = {
    agency: <><AgencyPane /><CommercialPane /><TradesPane /></>, auditions: <AuditionsPane />, work: <WorkPane />, unions: <UnionsPane />, home: <HomePane />,
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
        subtitle={agency && career.agencyCity ? `${cityName(career.agencyCity)} office, signed ${formatDate(career.signedAt!, zoneOf(career.agencyCity))}${career.termEnds !== undefined ? `, the contract running to ${formatDate(career.termEnds, zoneOf(career.agencyCity))}` : ''}` : undefined}
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
              {career.termEnds !== undefined && (
                <div className="row-between small">
                  <span>
                    {career.initialTerm === false ? `A renewal of ${plural(AGENCY_TERM.renewalYears, 'year')}` : `A first contract, of ${plural(AGENCY_TERM.firstYears, 'year')}`}, to {formatDate(career.termEnds, zoneOf(career.agencyCity ?? 'us-ny-newyork'))}.{' '}
                    {career.renewal?.state === 'offered' ? `${agency.name} offers to renew for ${plural(AGENCY_TERM.renewalYears, 'year')}.`
                      : career.renewal?.state === 'declined' ? 'You’re letting it run out.'
                      : career.renewal?.state === 'not-offered' ? `${agency.name} won’t renew: nothing was booked in it.`
                      : `In its last third, ${agency.name} offers to renew if it booked you work.`}
                  </span>
                  {career.renewal?.state === 'offered' && (
                    <div className="row gap-2">
                      <Gated feature="career.renew" onClick={() => { if (run('career.renew', { accept: true }).ok) toast(`Renewed with ${agency.name}.`, 'positive'); }}>Renew</Gated>
                      <Gated feature="career.renew" onClick={() => { if (run('career.renew', { accept: false }).ok) toast('It runs out at the end of the term.', 'positive'); }}>Let It Run Out</Gated>
                    </div>
                  )}
                </div>
              )}
              <p className="small" style={{ margin: 0 }}>
                On SAG-AFTRA work at scale the producer pays scale plus 10%, and the 10% is the agency’s. You may leave on SAG-AFTRA’s terms: in a first contract’s first {LEAVING.initialDays} days, once {LEAVING.firstDays} days in a row pass with no offer; after them, and in a renewal, with fewer than {LEAVING.fewerThanDays} days’ work in the last {LEAVING.windowDays}. {may.why}
              </p>
            </>
          ) : (
            <p className="small" style={{ margin: 0 }}>
              {ended ? `${career.ended!.left ? `You left ${ended.name}` : `${ended.name} let you go`} on ${formatDate(career.ended!.at, sim.zone)}: ${career.ended!.reason} ` : ''}
              Without an agency, work comes from submitting yourself, and a job worked can bring an agency’s call.
            </p>
          )}
          <Fine>Source: {AGENT_COMMISSION.source}; {LEAVING.source}; {AGENCY_TERM.source}. Renewing a client it booked work for is SLATE’s estimate.</Fine>
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

      <AttributesPanel />

      <ManagerPanel />

      <Panel
        title="Submitting Yourself"
        subtitle={`${career.submitted} of ${submissionsAWeek(career, sim.now, workCity(person))} this week`}
        actions={(career.since !== undefined || summerOf(person, sim.now)) && career.submitted < submissionsAWeek(career, sim.now, workCity(person))
          ? <Gated feature="career.self_submit" onClick={() => { if (run('career.self_submit').ok) toast('Submitted. Any audition comes on Monday.', 'positive'); }}>Submit Yourself</Gated>
          : undefined}
      >
        <p className="small" style={{ margin: 0 }}>
          On the casting sites every actor uses, for the low budget films, games and audiobooks that take submissions. About {pct(ESTIMATE.selfSubmitCallback)} bring an audition with a paid site’s headshot and reel, and half that free, with the week’s on Monday (SLATE’s estimate).
          {career.since === undefined ? ' At school, submissions are for the summers between years, for jobs that end before the fall term; for good when school ends.' : ''} Submitted from out of town, casting asks for a tape, and a job in another city means a room sublet there for its nights.
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
                {AGENCIES.filter((a) => (a.countryId ?? 'us') === 'us').map((a) => (
                  <tr key={a.id}><td>{a.name}</td><td>{a.tier === 1 ? 'Widest' : a.tier === 2 ? 'Wide' : 'Growing'}</td><td className="num mono">{a.bar}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <Fine>
            Scenes for agents, managers and casting directors in New York and then Los Angeles, as Yale holds them; the class of {person.school?.classOf ?? SHOWCASE_2029.newYork.year}’s dates are SLATE’s estimate by 2025’s and 2026’s. A showing reads your acting (scene study twice, character work and emotional access) as much as the rest of your craft together, with your presence a fifth of it; nerves and tiredness take it down, and an agency reads your reputation beside it. The agencies are the ones Yale names; what each needs to see, and its reach, are SLATE’s estimate. Source: {SHOWCASE_2029.source}; {AGENCY_SOURCE}.
          </Fine>
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
                <span>{roleById(b.roleId).label}{b.genre ? `, ${GENRE_BY_ID[b.genre]?.label ?? b.genre}${(person.genres ?? []).includes(b.genre) ? ', a genre you love' : ''}` : ''}: {spanOf(b)} from {formatDate(b.starts, zoneOf(b.cityId))}, answer by {formatDateTime(b.dueAt, zoneOf(b.cityId))}</span>
                <span className="row gap-2">
                  {acceptRefusal(sim, person, b)
                    ? <span className="xs dim">{acceptRefusal(sim, person, b)}</span>
                    : <Gated feature="career.accept" onClick={() => { if (run('career.accept', { bookingId: b.id }).ok) toast('Taken. The days are on your calendar.', 'positive'); }}>Take It</Gated>}
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
                <span>{roleById(a.roleId).label}{a.demands?.length ? `, asks for ${a.demands.map((d) => (SKILLS.find((k) => k.id === d)?.label ?? d).toLowerCase()).join(' and ')}` : ''}{a.self ? ', submitted yourself' : ''}{a.coached ? ', coached' : ''}</span>
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
                    <td>{UNION_NAMES[r.union]}</td>
                    <td className="num mono">{formatMoney(rateOf(r, sim.now, r.cities[0]!, cur), cur)}</td>
                    <td>{r.series ? 'Episode' : r.medium === 'voice' ? 'Session' : r.medium === 'stage' ? 'Week' : 'Day'}</td>
                    <td className="num mono">{pct(bookingChance(person.craft!, r, focus, 'room', true, false, person.attrs?.presence))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Fine>Source: {[...new Set(ROLES.map((r) => r.source))].join('; ')}.</Fine>
          <Fine>
            The pay is each contract’s minimum on today’s date: SAG-AFTRA’s 2026–2030 television and theatrical rates, its low budget agreements, Equity’s LORT rates and its Broadway minimum; after a contract’s last published step it holds. A guest star’s pay is the major role’s five- or eight-day price, by the day; a series regular’s is by the episode, 13 guaranteed. A shooting day runs {OVERTIME.dayHours[0]} to {OVERTIME.dayHours[1]} hours, and the hours past the contract’s are paid at its overtime rates. Your chance is SLATE’s estimate: about one in twenty at the part’s bar, as the trade reckons for a newer actor, more above it, less tired or on tape.
          </Fine>
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
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const career = person.career!;
  const cur = saveCurrency(sim.universe);
  const jobs = career.bookings.filter((b) => b.status === 'accepted');
  return (
    <div className="col gap-5">
      <Panel title="Jobs" subtitle={career.option ? `Under option to your series until ${formatDate(career.option.decidedAt, 'America/New_York')}` : jobs.length ? undefined : 'Nothing taken now'}>
        {jobs.length ? (
          <div className="col gap-2">
            {jobs.map((b) => (
              <div key={b.id} className="row-between small">
                <span>{roleById(b.roleId).label}{b.season ? `, Season ${b.season}` : ''}, {cityName(workCityOf(b))}{b.location ? ' (On Location)' : ''}: {spanOf(b)}</span>
                <span className="mono">
                  {b.worked} of {workDays(b).length} days worked
                  {(b.overtimeDays ?? []).some((o) => o) ? `, ${formatMoney((b.overtimeDays ?? []).reduce((sum, o) => sum + (o ?? 0), 0), cur)} in overtime and meal penalties` : ''}
                  {(b.travelOwed ?? 0) + (b.perDiemOwed ?? 0) > 0 ? `, ${formatMoney((b.travelOwed ?? 0) + (b.perDiemOwed ?? 0), cur)} of travel and per diem owed` : ''}
                  {b.t1287Rate !== undefined ? `, Canada withholding ${(b.t1287Rate * 100).toFixed(1)}% by your T1287` : ''}
                </span>
                {!('refused' in t1287Quote(sim, person, b)) && (
                  <Gated feature="career.t1287" className="btn btn-sm btn-ghost" onClick={() => { const r = run<{ rate: number }>('career.t1287', { bookingId: b.id }); if (r.ok) toast(`Filed: Canada withholds ${(r.value!.rate * 100).toFixed(1)}% instead of 23%.`, 'positive'); }}>File Form T1287</Gated>
                )}
              </div>
            ))}
          </div>
        ) : <p className="small muted" style={{ margin: 0 }}>A job you take puts its days on your calendar. You must be in its city, awake, for every one: a day missed ends the job, and an agency you have lets you go. A day in hospital is no walking off: on screen the part is recast, and on stage the understudy covers.</p>}
      </Panel>
      <ResidualsPanel />
      {(person.school?.credits?.length ?? 0) > 0 && (
        <Panel title="Training" subtitle={YALE_DRAMA.name}>
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Year</th><th scope="col">Production</th><th scope="col">Part</th></tr></thead>
              <tbody>
                {[...person.school!.credits!].reverse().map((c, i) => <tr key={i}><td className="mono">{c.year}</td><td>{c.production}</td><td>{c.kind === 'understudy' ? `${c.role} (Understudy, On ${c.wentOn} ${c.wentOn === 1 ? 'Time' : 'Times'})` : c.role}</td></tr>)}
              </tbody>
            </table>
          </div>
          {person.school?.filmed && <p className="small" style={{ margin: 'var(--s3) 0 0' }}>The degree’s filmed monologues, posted with the class’s, are footage to cut a reel from.</p>}
        </Panel>
      )}

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
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const career: CareerRecord = careerOf(person);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  // The unions' own figures are dollars, and charged in the save's money (`usd` in `systems/career.ts`).
  const dollars = (c: number) => formatMoney(inSaveMoney(sim, c, 'USD'), cur);
  const ledger = earningsOf(person).years;
  const years = Object.keys(ledger).filter((y) => ledger[y]!.acting > 0).sort().reverse();
  const sag = career.unions.sag;
  const equity = career.unions.equity;
  const sagWord = !sag ? 'Not Yet Eligible' : sag.joinedAt !== undefined ? 'Member' : 'Eligible';
  const pension = pensionOf(sim, person);
  return (
    <div className="col gap-5">
      {pension.years.length > 0 && (
        <Panel title="SAG-AFTRA Pension" subtitle={person.pensionStart ? `Begun ${formatDate(person.pensionStart.at, sim.zone)}${person.pensionStart.factor < 1 ? `, early, at ${Math.round(person.pensionStart.factor * 100)}% of the full pension` : ''}` : 'The SAG-Producers Pension Plan, payable from 65'} actions={earlyRefusal(sim, person) ? undefined : <Gated feature="pension.start" onClick={() => { const r = run<{ factor: number }>('pension.start'); if (r.ok) toast(`Your pension begins, at ${Math.round(r.value!.factor * 100)}% of the full pension.`, 'positive'); }}>Start Your Pension Early</Gated>}>
          <div className="col gap-3">
            <div className="grid grid-3">
              <Stat label="Pension Credits" value={String(pension.credits)} note={`A year of ${dollars(SAG_PENSION.creditEarnings)} in covered earnings is one`} />
              <Stat label="Vested" value={pension.vested ? 'Yes' : 'Not Yet'} note={`At ${SAG_PENSION.vestAt} credits, or ${SAG_PENSION.vestEarlyAt} without a long break`} />
              {/* Begun, what it pays now, early starts' cut included; before, what it would at 65. Until 2026-09-28 it said "at 65" for life. */}
              {person.pensionStart
                ? <Stat label="A Year Now" value={money(Math.round(pension.yearly * person.pensionStart.factor))} note={`Paid monthly since ${formatDate(person.pensionStart.at, sim.zone)}, before the federal tax withheld from it`} />
                : <Stat label="A Year At 65" value={money(pension.yearly)} note={`Paid monthly from ${formatDate(pensionAge(person), sim.zone)}${pension.vested ? '' : ', once vested'}`} />}
            </div>
            <p className="small" style={{ margin: 0 }}>{pension.years.map((y) => `${y.year}: ${money(y.earnings)}${y.credit ? ', a credit' : ''}`).join('; ')}.</p>
            <Fine>The minimum for a credit, a year adding 2% of its covered earnings, each production’s and each television episode’s ceiling, vesting, the age and the early start are the Plan’s. The law holds a pension to $290,000 a year and to the best three years in a row (IRC section 415(b)); SLATE holds that at 2026’s figure and doesn’t reduce it for a start before 62. Federal tax is withheld as the IRS default for a periodic payment has it. Source: {SAG_PENSION.source}; {SAG_PENSION.lawSource}.</Fine>
          </div>
        </Panel>
      )}
      {(socialSecurityOf(person, cur).credits > 0 || person.socialSecurity) && (() => {
        const ss = socialSecurityOf(person, cur);
        const no = socialSecurityRefusal(sim, person);
        const usd = (d: number) => money(cur === 'USD' ? d * 100 : exchange(d * 100, 'USD', cur) ?? d * 100);
        return (
          <Panel title="Social Security" subtitle="Your US earnings record" actions={no ? undefined : <Gated feature="pension.social_security" onClick={() => { const r = run<{ monthly: number; factor: number }>('pension.social_security'); if (r.ok) toast(`Claimed: ${money(r.value!.monthly)} a month, ${Math.round(r.value!.factor * 1000) / 10}% of the full benefit.`, 'positive'); }}>Claim Social Security</Gated>}>
            <div className="col gap-3">
              <div className="grid grid-3">
                <Stat label="Credits" value={String(ss.credits)} note="Forty qualify" />
                <Stat label="At 67, A Month" value={usd(ss.pia)} note={`62: ${usd(Math.floor(ss.pia * claimFactor(-60)))}; 70: ${usd(Math.floor(ss.pia * claimFactor(36)))}`} />
                <Stat label="Claimed" value={person.socialSecurity ? usd(person.socialSecurity.monthlyUsd) : 'Not Yet'} note={person.socialSecurity ? `A month since ${formatDate(person.socialSecurity.from, sim.zone)}` : no ?? 'You can claim it now'} />
              </div>
              <Fine>Your highest 35 years of US wages, each to its year’s taxable maximum and indexed by the national wage index to the year you turn 60, averaged a month, then 90%, 32% and 15% across SSA’s 2026 bend points. Claimed early it’s cut, delayed it rises 8% a year to 70. SLATE holds what SSA hasn’t published at the last it did. Source: {SOCIAL_SECURITY.source}.</Fine>
            </div>
          </Panel>
        );
      })()}
      {(qualifyingYears(person, cur).length > 0 || person.statePensionFrom !== undefined) && (
        <Panel title="State Pension" subtitle="The UK’s, on your National Insurance record" actions={statePensionRefusal(sim, person) ? undefined : <Gated feature="pension.state" onClick={() => { const r = run<{ weekly: number }>('pension.state'); if (r.ok) toast(`Claimed: ${money(r.value!.weekly)} a week, paid every four weeks.`, 'positive'); }}>Claim It</Gated>}>
          <div className="col gap-3">
            <div className="grid grid-3">
              <Stat label="Qualifying Years" value={String(qualifyingYears(person, cur).length)} note={`Ten for any, ${STATE_PENSION.yearsForFull} for the full rate`} />
              <Stat label="A Week" value={money(weeklyPension(person, sim.now, cur))} note={person.statePensionFrom !== undefined ? `Claimed ${formatDate(person.statePensionFrom, sim.zone)}` : `From ${formatDate(statePensionAge(person), sim.zone)}`} />
              <Stat label="Claimed" value={person.statePensionFrom !== undefined ? 'Yes' : 'Not Yet'} note={statePensionRefusal(sim, person) ?? 'You can claim it now'} />
            </div>
            <Fine>A tax year qualifies with UK earnings at the Lower Earnings Limit, £6,708 in 2026/27, or with the credits Universal Credit gives; each is a thirty-fifth of the full £241.30 a week (2026/27). State Pension age is 68 for anyone born after 5 April 1978, by the Pensions Act 2007. SLATE holds the limit and the rate at 2026/27’s. Source: {STATE_PENSION.source}.</Fine>
          </div>
        </Panel>
      )}
      {(irishContributions(person, cur) > 0 || person.irishPension) && (
        <Panel title="State Pension (Ireland)" subtitle="Ireland’s, on your PRSI contributions" actions={irishPensionRefusal(sim, person) ? undefined : <Gated feature="pension.ie_state" onClick={() => { const r = run<{ weekly: number }>('pension.ie_state'); if (r.ok) toast(`Claimed: ${money(r.value!.weekly)} a week.`, 'positive'); }}>Claim It</Gated>}>
          <div className="col gap-3">
            <div className="grid grid-3">
              <Stat label="Contributions" value={String(irishContributions(person, cur))} note={`${IRISH_PENSION.paidNeeded} for any, ${IRISH_PENSION.forFull.toLocaleString('en-US')} for the full rate`} />
              <Stat label="A Week At 66" value={formatMoney(inSaveMoney(sim, person.irishPension?.weeklyEur ?? irishWeekly(irishContributions(person, cur), IRISH_PENSION.age), 'EUR'), cur)} note={person.irishPension ? `Claimed ${formatDate(person.irishPension.from, sim.zone)}` : 'More claimed at 67, and at 68'} />
              <Stat label="Claimed" value={person.irishPension ? 'Yes' : 'Not Yet'} note={irishPensionRefusal(sim, person) ?? 'You can claim it now'} />
            </div>
            <Fine>A calendar year of Irish earnings at €5,000 or more counts as 52 contributions; the week is the full rate times your contributions over 2,080: €299.30 at 66, €313.40 claimed at 67, €328.90 at 68 (2026). SLATE holds the rates at 2026’s. Source: {IRISH_PENSION.source}.</Fine>
          </div>
        </Panel>
      )}
      {isoOfCountry(person.citizenshipId) === 'MX' && (
        <Panel title="Pensión Para El Bienestar" subtitle="Mexico’s, for every Mexican living there from 65" actions={bienestarRefusal(sim, person) ? undefined : <Gated feature="pension.bienestar" onClick={() => { const r = run<{ bimonthly: number }>('pension.bienestar'); if (r.ok) toast(`Claimed: ${money(r.value!.bimonthly)} every two months.`, 'positive'); }}>Claim It</Gated>}>
          <div className="col gap-3">
            <Stat label="Claimed" value={person.bienestarFrom !== undefined ? 'Yes' : 'Not Yet'} note={bienestarRefusal(sim, person) ?? 'You can claim it now'} />
            <Fine>MXN 6,400 every two months, not contributory, paid while you live in Mexico (2026 rules). Source: {BIENESTAR.source}.</Fine>
          </div>
        </Panel>
      )}
      {(career.unions.owed ?? 0) > 0 && (
        <Stat label="Owed To The Union" value={money(career.unions.owed!)} note="Dues and fees the bank couldn’t cover, taken from the next check" tone="warning" />
      )}
      <div className="grid grid-2">
        <Panel title="SAG-AFTRA">
          <div className="col gap-3">
            <Stat label="Status" value={sagWord} note={sag?.joinedAt !== undefined ? `Since ${formatDate(sag.joinedAt, sim.zone)}` : sag ? `Since ${formatDate(sag.eligibleAt, sim.zone)}` : undefined} />
            <p className="small" style={{ margin: 0 }}>
              Your first SAG-AFTRA job makes you eligible. Taking another {SAG_AFTRA.taftHartleyDays} days on means joining first: the {dollars(SAG_AFTRA.initiation)} initiation fee and half a year’s dues. Dues are {dollars(SAG_AFTRA.basicDues)} a year, billed each May and November, and each May {(SAG_AFTRA.workDues * 100).toFixed(3)}% of the last year’s SAG-AFTRA earnings.
            </p>
            <Fine>Source: {SAG_AFTRA.source}.</Fine>
          </div>
        </Panel>
        <Panel title="Actors’ Equity">
          <div className="col gap-3">
            <Stat label="Status" value={equity ? 'Member' : 'Not A Member'} note={equity ? `${dollars(equity.initiationPaid)} of the ${dollars(EQUITY.initiation)} fee paid` : undefined} />
            <p className="small" style={{ margin: 0 }}>
              Your first Equity contract makes you a member: {dollars(EQUITY.initiationNow)} of the {dollars(EQUITY.initiation)} initiation fee down and the rest over two years. Dues are {dollars(EQUITY.basicDues)} a year, each May and November, and {EQUITY.workingDues * 100}% of every Equity check.
            </p>
            <Fine>Source: {EQUITY.source}.</Fine>
          </div>
        </Panel>
      </div>
      <Panel title="Wages By Year">
        {years.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Year</th><th scope="col" className="num">Gross</th><th scope="col" className="num">Under SAG-AFTRA</th><th scope="col" className="num">Commission</th><th scope="col" className="num">Union Dues</th><th scope="col" className="num">Tax Withheld</th></tr></thead>
              <tbody>
                {years.map((y) => <tr key={y}><td className="mono">{y}</td><td className="num mono">{money(ledger[y]!.acting)}</td><td className="num mono">{money(ledger[y]!.sag)}</td><td className="num mono">{money(ledger[y]!.commission)}</td><td className="num mono">{money(ledger[y]!.dues)}</td><td className="num mono">{money(ledger[y]!.withheld)}</td></tr>)}
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
  const home = homeTownOf(person);
  // Only the places they may live: an American isn't offered London, nor a British graduate out of permission New York.
  const cities = [...CAREER_CITIES, YALE_DRAMA.cityId, ...(home ? [home] : [])].filter((id) => id === (person.home?.cityId ?? person.currentLocationId) || !residenceRefusal(person, id, sim.now));
  return (
    <Panel title="Where You Live" subtitle={`${cityName(person.currentLocationId)}, ${person.home ? (person.home.kind === 'sofa' ? 'on a friend’s sofa' : person.home.kind === 'owned' ? 'in a home you own' : HOUSING[person.home.kind].label.toLowerCase()) : 'without a home'}`}>
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
  // A student's summer too, when the sites make the summer's submissions count; until 2026-09-27 they were hidden until the degree.
  if (career.since === undefined && !summerOf(person, sim.now)) return null;
  const stale = staleHeadshots(career, sim.now);
  const dollars = (c: number) => formatMoney(inSaveMoney(sim, c, 'USD'), cur);
  return (
    <Panel title="What The Work Costs" subtitle={`${formatMoney(yearCosts(person, sim.now), cur)} this year, deducted where the return allows`}>
      <div className="col gap-3">
        {(Object.keys(WORK_COSTS.sites) as CastingSite[]).map((site) => {
          const held = career.sites?.[site];
          const on = onSite(career, site, sim.now);
          return (
            <div key={site} className="row-between small">
              <span>{WORK_COSTS.sites[site].label}, {formatMoney(inSaveMoney(sim, WORK_COSTS.sites[site].price, (WORK_COSTS.sites[site] as { currency?: string }).currency ?? 'USD'), cur)} a year: {on ? `to ${formatDate(held!.until, sim.zone)}${held!.renews ? ', renewing' : ''}` : 'Not Joined'}</span>
              {on && held!.renews
                ? <Gated feature="career.subscribe" onClick={() => { if (run('career.subscribe', { site, on: false }).ok) toast('It runs to its date and stops.', 'positive'); }}>Stop Renewing</Gated>
                : <Gated feature="career.subscribe" onClick={() => { if (run('career.subscribe', { site, on: true }).ok) toast('Joined for the year.', 'positive'); }}>{on ? 'Renew' : 'Join'}</Gated>}
            </div>
          );
        })}
        {career.since !== undefined && (
          <div className="row-between small">
            <span>Headshots, {dollars(WORK_COSTS.headshots)} with prints: from {formatDate(career.headshotsAt ?? career.since, sim.zone)}{stale ? ', out of date' : ''}</span>
            <Gated feature="career.headshots" onClick={() => { if (run('career.headshots').ok) toast('New headshots.', 'positive'); }}>New Headshots</Gated>
          </div>
        )}
        <div className="row-between small">
          <span>A reel, {dollars(WORK_COSTS.reel)} to edit: {career.reelAt ? `from ${formatDate(career.reelAt, sim.zone)}` : career.credits.some((c) => roleById(c.roleId).medium === 'screen') || person.school?.filmed ? 'None' : 'None, and no screen footage to cut one from'}</span>
          <Gated feature="career.reel" onClick={() => { if (run('career.reel').ok) toast('A reel, cut from your footage.', 'positive'); }}>{career.reelAt ? 'Recut The Reel' : 'Cut A Reel'}</Gated>
        </div>
        <div className="row-between small">
          <span>A self-tape kit, {dollars(WORK_COSTS.kit)} and the sales tax: {career.kit ? 'Yours' : 'None'}</span>
          {!career.kit && <Gated feature="career.buy_kit" onClick={() => { if (run('career.buy_kit').ok) toast('Tapes read better now.', 'positive'); }}>Buy A Kit</Gated>}
        </div>
        <div className="row-between small">
          <span>A scene-study class, {dollars(WORK_COSTS.classMonthly)} a month: {career.scene ? 'Enrolled' : career.since === undefined ? 'None: school is your class for now' : 'None'}</span>
          {career.scene
            ? <Gated feature="career.class" onClick={() => { if (run('career.class', { on: false }).ok) toast('Out of the class.', 'positive'); }}>Leave The Class</Gated>
            : career.since !== undefined && <Gated feature="career.class" onClick={() => { if (run('career.class', { on: true }).ok) toast('In class from this week.', 'positive'); }}>Join A Class</Gated>}
        </div>
        {/* Building the attributes on purpose (`systems/attributes.ts`). */}
        <div className="row-between small">
          <span>An improv course, {dollars(WORK_COSTS.improv)} for {WORK_COSTS.improvWeeks} Tuesday evenings: {career.improv ? `${career.improv.left} evenings left` : 'None'}. Builds improvisation and composure, and a little presence.</span>
          {!career.improv && <Gated feature="career.improv" onClick={() => { const a = run<{ first: number }>('career.improv'); if (a.ok && a.value) toast(`The first class is ${formatDate(a.value.first, sim.zone)}.`, 'positive'); }}>Take The Course</Gated>}
        </div>
        <div className="row-between small">
          <span>A casting director workshop, {dollars(WORK_COSTS.workshop)} an evening of cold reading for one office: {sim.universe.scheduled.some((i) => i.kind === WORKSHOP_KIND && i.status === 'pending') ? 'Booked' : 'None booked'}. Builds cold reading and reputation, the nerves of it composure.</span>
          {!sim.universe.scheduled.some((i) => i.kind === WORKSHOP_KIND && i.status === 'pending') && <Gated feature="career.workshop" onClick={() => { const a = run<{ at: number }>('career.workshop'); if (a.ok && a.value) toast(`Booked for ${formatDate(a.value.at, sim.zone)}.`, 'positive'); }}>Book A Workshop</Gated>}
        </div>
        <div className="row-between small">
          <span>A publicist, {dollars(WORK_COSTS.publicistMonthly)} a month: {career.publicist ? `on retainer, about ${publicityFor(sim, person, sim.now)} recognition a month from press, and the name fades half as fast` : publicistRefusal(person)?.replace(/\.$/, '') ?? `about ${publicityFor(sim, person, sim.now)} recognition a month from interviews and press, and the name fading half as fast`}.</span>
          {career.publicist
            ? <Gated feature="career.publicist" onClick={() => { if (run('career.publicist', { on: false }).ok) toast('No more retainer.', 'positive'); }}>Let The Publicist Go</Gated>
            : !publicistRefusal(person) && <Gated feature="career.publicist" onClick={() => { if (run('career.publicist', { on: true }).ok) toast('A publicist is working your name.', 'positive'); }}>Hire A Publicist</Gated>}
        </div>
        <Fine>
          Prices are 2025–26’s. A free submission sends a name and a résumé, and is seen about half as often; a paid one sends your headshot, and your reel where you have one, without which the {WORK_COSTS.wantReel * 100}% of breakdowns that ask for one are shut. Backstage’s own listings take {WORK_COSTS.backstageSubmissions} more submissions a week, and Casting Networks’ {WORK_COSTS.castingNetworksSubmissions['us-ca-losangeles']} more in Los Angeles and {WORK_COSTS.castingNetworksSubmissions.other} elsewhere. Headshots more than two years old cost about a fifth of your auditions; a tape without a kit reads about a fifth worse; a week in class grows your scene study as a class at school does; a coach, {dollars(WORK_COSTS.coach)} an hour, makes an audition book about a quarter more often and halves its nerves; a finished film premieres at Tribeca in June or, from a studio, in Los Angeles about nine months on, and being there adds more recognition. What each does is SLATE’s estimate. New York and California let an actor deduct it all above 2% of income. Source: {WORK_COSTS.source}.
        </Fine>
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
        <Fine>
          The firms are ones signing actors in 2026: {MANAGERS.map((m) => m.name).join(', ')}. Nothing caps a manager’s commission; the rates are what the trade reckons, and the rest is SLATE’s estimate. Source: {MANAGEMENT.source}.
        </Fine>
      </div>
    </Panel>
  );
}

/** What each job has paid since, and how it's seen. */
function ResidualsPanel() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const career = careerOf(person);
  const seen = { network: 'On A Network', svod: 'Streaming', film: 'A Film’s Television And Streaming', commercial: 'A Commercial’s Cycles' } as const;
  const size = { small: 'A Small Service', middle: 'A Middling Service', large: 'A Big Service' } as const;
  return (
    <Panel title="Residuals" subtitle={career.residuals.length ? undefined : 'Television and film work pays after it’s made'}>
      <div className="col gap-3">
        {career.residuals.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Part</th><th scope="col">Where</th><th scope="col">Since</th><th scope="col">Next Payment</th></tr></thead>
              <tbody>
                {[...career.residuals].reverse().map((r) => (
                  <tr key={r.id}>
                    <td>{roleById(r.roleId).label}</td>
                    <td>{seen[r.kind]}{r.size ? `, ${size[r.size]}` : ''}{r.rerun ? ', Rerun' : ''}{r.syndicated ? ', Syndicated' : ''}{r.hit ? ', A Hit' : ''}</td>
                    <td>{formatDate(r.airsAt, sim.zone)}</td>
                    <td>{(() => { const next = sim.universe.scheduled.filter((one) => one.status === 'pending' && one.payload.residualId === r.id).sort((a, b) => a.at - b.at)[0]; return next ? formatDate(next.at, sim.zone) : 'None to come'; })()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Fine>
          A network’s prime-time rerun pays what you were paid, to its ceiling, within 30 days; syndication a share of the part’s minimum by the run; streaming, after its first 90 days, a share each year by the service’s size, and a hit a bonus; a film’s cast shares {(RESIDUALS.filmPool * 100).toFixed(1)}% of its television and streaming money. The formulas are the agreements’. Where a job is seen, how it does, and what a film earns are SLATE’s estimate. Source: {RESIDUALS.source}.
        </Fine>
      </div>
    </Panel>
  );
}
