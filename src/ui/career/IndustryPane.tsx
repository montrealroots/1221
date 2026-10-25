/**
 * SLATE — the Career screen's Charts And Awards tab (from 2026-10-24, the owner's brief 25, Parts 10 to 12;
 * `docs/verification/career-world-2026-10-23/criteria.md`, Module 6, X1 to X16).
 *
 * Four panels, each read from the record as it's drawn. Your Recognition: each television credit's Emmy eligibility by
 * the 78th's rules, Enter Yourself where it's open (`pro.award_enter`), what came of each entry, and Watch The Ceremony
 * once the award is presented (`pro.watch_ceremony`), which shows the settled result and changes nothing; each film's
 * place at Sundance, which only its production can submit. Your Films In Cinemas: the game's own box office, a
 * simulation, never a published figure or the actor's pay. Published Charts: the reference snapshots, each in its own
 * unit, territory and week, with its movement where the week before is held, and how old it is. Awards And Festivals:
 * every institution the brief names, with what this build read of it. From 2026-10-24 (the owner's brief 27, Part 5) a
 * fifth, Unions And Festivals Around The World: the performers' unions FIA lists and the festivals FIAPF accredits, where
 * the actor lives first and then by country (`content/industry.ts`). From 2026-10-25 (brief 27's K7) Your Recognition also
 * holds each film's and television credit's place at the Actor Awards, Submit Yourself where it's open (`pro.actor_submit`),
 * and, for every nomination, the ceremony: going or watching from home (`pro.ceremony_rsvp`), preparing remarks
 * (`pro.ceremony_prepare`), and going up to accept a win (`pro.ceremony_accept`).
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine, WhyNot } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine/core/simulation';
import { CHARTS, type ChartEntry, type ChartId } from '@/engine/content/charts';
import { INSTITUTIONS, type Coverage } from '@/engine/content/awards';
import { ACCREDITED_FESTIVALS, PERFORMER_UNIONS, festivalsIn, unionsIn } from '@/engine/content/industry';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import { spokenList } from '@/engine/core/text';
import { countryWords } from '@/engine/systems/worktrip';
import {
  REFERENCE, currentOf, figureWords, latestOf, longDate, movementOf, movementWords, peakOf, titleAcross, totalsOf, weekEnd, weekWords, weeksBy, weeksSoFar,
} from '@/engine/systems/charts';
import { routeWords } from '@/engine/systems/market';
import {
  VISIBILITY, ceremonyLines, eligibleWords, emmyCheck, entryFee, entryRefusal, festivalCheck, festivalCheckWords, festivalWords,
  internationalWhy, projectOfCredit, recapWords, visibilityOf, watchRefusal,
} from '@/engine/systems/awards';
import type { ProCredit } from '@/engine/systems/pro';
import { actorCheck, actorEligibleWords, actorFee, actorRecapWords, actorSubmitRefusal } from '@/engine/systems/actorawards';
import { CEREMONY, acceptRefusal, prepareRemarksRefusal, rsvpBy, rsvpRefusal, showTitle, type Nomination } from '@/engine/systems/ceremony';
import { bookedClash } from '@/engine/systems/projobs';
import { projectById } from '@/engine/content/careerwork';
import { seasonWindow, seriesById } from '@/engine/content/series';
import { audienceWords, decisionsTo, decisionWords, seasonAudience, seasonMade, seasonName, simulatedSeason } from '@/engine/systems/series';

export function IndustryPane() {
  return (
    <div className="col gap-5">
      <RecognitionPanel />
      <BoxOfficePanel />
      <SeriesPanel />
      <ChartsPanel />
      <InventoryPanel />
      <WorldPanel />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Your Recognition
// ---------------------------------------------------------------------------------------------------------------------

function RecognitionPanel() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const credits = person.pro?.credits ?? [];
  const tv = credits.filter((c) => c.medium === 'television');
  const film = credits.filter((c) => c.medium === 'film');
  const lift = visibilityOf(person, sim.now);
  return (
    <Panel title="Your Recognition" help="career.awards">
      <div className="col gap-4">
        {lift > 0 && (
          <p className="small" style={{ margin: 0 }}>
            {`What your work has been recognized for makes casting likelier to choose you: a chance ${Math.round(lift * 100)}% better than it would be, fading over three years from each nomination, win or selection. It pays nothing and promises nothing.`}
          </p>
        )}
        <div className="col gap-3">
          <h3 className="eyebrow" style={{ margin: 0 }}>The Emmy Awards</h3>
          {tv.length
            ? tv.map((c) => <EmmyCredit key={c.id} sim={sim} person={person} c={c} />)
            : <p className="small" style={{ margin: 0 }}>None of your work is on television yet. A part in a series or a television movie can be entered once it’s due on the air.</p>}
        </div>
        <div className="col gap-3">
          <h3 className="eyebrow" style={{ margin: 0 }}>The Actor Awards</h3>
          {tv.length + film.length
            ? [...film, ...tv].map((c) => <ActorCredit key={c.id} sim={sim} person={person} c={c} />)
            : <p className="small" style={{ margin: 0 }}>None of your work is on screen yet. A part in a film or a television program made under SAG-AFTRA can be submitted once it’s due out.</p>}
        </div>
        <div className="col gap-3">
          <h3 className="eyebrow" style={{ margin: 0 }}>The Sundance Film Festival</h3>
          {film.length
            ? film.map((c) => <FestivalCredit key={c.id} sim={sim} person={person} c={c} />)
            : <p className="small" style={{ margin: 0 }}>None of your work is a film yet. A short or an independent feature can go to Sundance once it’s finished, if its production submits it.</p>}
        </div>
        <Fine>
          {`The Emmy Awards’ eligibility, entries, fees and nominations follow the 78th Emmy Awards’ rules, the Actor Awards’ follow the 33rd’s, and Sundance’s follow its 2027 festival’s; a later year carries them forward. The other entrants, the votes and the festival’s choices are the game’s, and no other nominee is named. Recognition lasts on your Portfolio; what it does for casting fades, at most ${Math.round(VISIBILITY.most * 100)}% better.`}
        </Fine>
      </div>
    </Panel>
  );
}

function EmmyCredit({ sim, person, c }: { sim: Simulation; person: Person; c: ProCredit }) {
  const { run, toast } = useGame();
  const check = emmyCheck(sim, person, c);
  const entries = (person.pro?.awards ?? []).filter((a) => a.creditId === c.id);
  const t = projectOfCredit(person, c);
  const open = check.eligible && !entries.some((a) => a.year === check.year);
  const cur = saveCurrency(sim.universe);
  const fee = formatMoney(entryFee(sim), cur);
  const no = open ? entryRefusal(sim, person, c.id) : undefined;
  const label = `Enter Yourself (${fee})`;
  return (
    <div className="col gap-2">
      <p className="small strong" style={{ margin: 0 }}>{`${c.role}, ${c.project}`}</p>
      <p className="small" style={{ margin: 0 }}>{check.eligible ? eligibleWords(person, check) : check.why}</p>
      {entries.map((a) => {
        const watchNo = ['nominated', 'won', 'lost'].includes(a.state) ? watchRefusal(sim, person, a.id) : 'not nominated';
        return (
          <div key={a.id} className="col gap-2">
            <p className="small" style={{ margin: 0 }}>{recapWords(person, a)}</p>
            {a.watchedAt !== undefined && (
              <ol className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{ceremonyLines(person, a).map((line, i) => <li key={i}>{line}</li>)}</ol>
            )}
            <CeremonyControls sim={sim} person={person} n={a} />
            {['nominated', 'won', 'lost'].includes(a.state) && a.watchedAt === undefined && (
              <>
                <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                  <Gated feature="pro.watch_ceremony" className="btn btn-sm" disabled={!!watchNo} title={watchNo} onClick={() => { const r = run<{ lines: string[] }>('pro.watch_ceremony', { entryId: a.id }); if (r.ok) toast(r.value!.lines.at(-1)!, 'positive'); }}>Watch The Ceremony</Gated>
                </div>
                <WhyNot reasons={[['Watch The Ceremony', watchNo]]} />
              </>
            )}
          </div>
        );
      })}
      {open && (
        <>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <Gated feature="pro.award_enter" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ entryId: string; fee: number }>('pro.award_enter', { creditId: c.id }); if (r.ok) toast(`You’re entered, and ${formatMoney(r.value!.fee, cur)} is paid from your bank.`, 'positive'); }}>{label}</Gated>
          </div>
          <WhyNot reasons={[[label, no]]} />
          <p className="xs dim" style={{ margin: 0 }}>The production may enter you itself at the deadline if you don’t, and it may not.</p>
        </>
      )}
      {t && <p className="xs dim" style={{ margin: 0 }}>{internationalWhy(t)}</p>}
    </div>
  );
}

/** A credit's place at the Actor Awards: its eligibility, Submit Yourself where it's open, and what came of each submission. */
function ActorCredit({ sim, person, c }: { sim: Simulation; person: Person; c: ProCredit }) {
  const { run, toast } = useGame();
  const check = actorCheck(sim, person, c);
  const entries = (person.pro?.guild ?? []).filter((g) => g.creditId === c.id);
  const open = check.eligible && !entries.some((g) => g.year === check.year && g.state !== 'not-submitted');
  const cur = saveCurrency(sim.universe);
  const no = open ? actorSubmitRefusal(sim, person, c.id) : undefined;
  const label = `Submit Yourself (${formatMoney(actorFee(sim), cur)})`;
  return (
    <div className="col gap-2">
      <p className="small strong" style={{ margin: 0 }}>{`${c.role}, ${c.project}`}</p>
      <p className="small" style={{ margin: 0 }}>{check.eligible ? actorEligibleWords(person, check, sim.now) : check.why}</p>
      {entries.map((g) => {
        const watchNo = ['nominated', 'won', 'lost'].includes(g.state) ? watchRefusal(sim, person, g.id) : 'not nominated';
        return (
          <div key={g.id} className="col gap-2">
            <p className="small" style={{ margin: 0 }}>{actorRecapWords(person, g)}</p>
            {g.watchedAt !== undefined && (
              <ol className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{ceremonyLines(person, g).map((line, i) => <li key={i}>{line}</li>)}</ol>
            )}
            <CeremonyControls sim={sim} person={person} n={g} />
            {['nominated', 'won', 'lost'].includes(g.state) && g.watchedAt === undefined && (
              <>
                <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                  <Gated feature="pro.watch_ceremony" className="btn btn-sm" disabled={!!watchNo} title={watchNo} onClick={() => { const r = run<{ lines: string[] }>('pro.watch_ceremony', { entryId: g.id }); if (r.ok) toast(r.value!.lines.at(-1)!, 'positive'); }}>Watch The Show</Gated>
                </div>
                <WhyNot reasons={[['Watch The Show', watchNo]]} />
              </>
            )}
          </div>
        );
      })}
      {open && (
        <>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <Gated feature="pro.actor_submit" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ entryId: string; fee: number }>('pro.actor_submit', { creditId: c.id }); if (r.ok) toast(`You’re submitted, and ${formatMoney(r.value!.fee, cur)} is paid from your bank.`, 'positive'); }}>{label}</Gated>
          </div>
          <WhyNot reasons={[[label, no]]} />
          <p className="xs dim" style={{ margin: 0 }}>Your production may submit you itself when the window closes if you don’t, and it may not.</p>
        </>
      )}
    </div>
  );
}

/**
 * A nomination's ceremony (brief 27's K7, `systems/ceremony.ts`): going or watching from home before the answer's due,
 * preparing remarks while going, and going up to accept a win in the room.
 */
function CeremonyControls({ sim, person, n }: { sim: Simulation; person: Person; n: Nomination }) {
  const { run, toast } = useGame();
  const hooks = { clash: (p: Person, days: readonly { from: number; to: number }[]) => bookedClash(p, days) };
  const show = showTitle(n);
  const answerable = n.state === 'nominated' && sim.now < rsvpBy(n);
  const going = n.attend?.rsvp === 'attending';
  const goNo = answerable ? rsvpRefusal(sim, person, n.id, true, hooks) : undefined;
  const homeNo = answerable ? rsvpRefusal(sim, person, n.id, false, hooks) : undefined;
  const prepNo = going && sim.now < n.ceremonyAt ? prepareRemarksRefusal(sim, person, n.id) : 'not going';
  const acceptNo = n.state === 'won' && n.attend?.outcome === 'there' && !n.attend.accepted ? acceptRefusal(sim, person, n.id) : 'not in the room';
  const prepLabel = `Prepare Your Remarks (${CEREMONY.prepare.minutes} Minutes)`;
  const lines: string[] = [];
  if (n.state === 'nominated' && !n.attend) lines.push(answerable ? `You’re invited to ${show}. Say by ${formatDate(rsvpBy(n), sim.zone)}, whether you’ll go; the trip isn’t charged to you.` : `You didn’t say you’d go to ${show}, so it’s yours to watch from home.`);
  if (going && sim.now < n.ceremonyAt) lines.push(`You’re going to ${show} on ${formatDate(n.ceremonyAt, sim.zone)}. Your remarks are ${Math.round((n.attend!.prepared ?? 0) * 100)}% prepared.`);
  if (n.attend?.rsvp === 'declined' && n.state === 'nominated') lines.push(`You’ll watch ${show} from home.`);
  return (
    <>
      {lines.map((l, i) => <p key={i} className="small" style={{ margin: 0 }}>{l}</p>)}
      {answerable && (
        <>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            {!going && <Gated feature="pro.ceremony_rsvp" className="btn btn-sm" disabled={!!goNo} title={goNo} onClick={() => { const r = run('pro.ceremony_rsvp', { entryId: n.id, attend: true }); if (r.ok) toast(`You’re going to ${show}.`, 'positive'); }}>Go To The Ceremony</Gated>}
            {n.attend?.rsvp !== 'declined' && <Gated feature="pro.ceremony_rsvp" className="btn btn-sm" disabled={!!homeNo} title={homeNo} onClick={() => { const r = run('pro.ceremony_rsvp', { entryId: n.id, attend: false }); if (r.ok) toast(`You’ll watch ${show} from home.`, 'positive'); }}>Watch From Home</Gated>}
          </div>
          <WhyNot reasons={[['Go To The Ceremony', going ? undefined : goNo], ['Watch From Home', n.attend?.rsvp === 'declined' ? undefined : homeNo]]} />
        </>
      )}
      {going && sim.now < n.ceremonyAt && (
        <>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <Gated feature="pro.ceremony_prepare" className="btn btn-sm" disabled={!!prepNo} title={prepNo} onClick={() => { const r = run<{ prepared: number }>('pro.ceremony_prepare', { entryId: n.id }); if (r.ok) toast(`Your remarks are ${Math.round(r.value!.prepared * 100)}% prepared.`, 'positive'); }}>{prepLabel}</Gated>
          </div>
          <WhyNot reasons={[[prepLabel, prepNo]]} />
        </>
      )}
      {!acceptNo && (
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="pro.ceremony_accept" className="btn btn-sm" onClick={() => { const r = run<{ words: string }>('pro.ceremony_accept', { entryId: n.id }); if (r.ok) toast(r.value!.words, 'positive'); }}>Go Up And Accept</Gated>
        </div>
      )}
    </>
  );
}

function FestivalCredit({ sim, person, c }: { sim: Simulation; person: Person; c: ProCredit }) {
  const entries = (person.pro?.festivals ?? []).filter((f) => f.creditId === c.id);
  return (
    <div className="col gap-2">
      <p className="small strong" style={{ margin: 0 }}>{`${c.role}, ${c.project}`}</p>
      {entries.length
        ? entries.map((f) => <p key={f.id} className="small" style={{ margin: 0 }}>{festivalWords(person, f)}</p>)
        : <p className="small" style={{ margin: 0 }}>{festivalCheckWords(festivalCheck(sim, person, c))}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Your Films In Cinemas: the game's own box office
// ---------------------------------------------------------------------------------------------------------------------

function BoxOfficePanel() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const films = (person.pro?.credits ?? []).filter((c) => c.run && weeksSoFar(c.run, sim.now).length);
  return (
    <Panel title="Your Films In Cinemas" help="career.awards">
      <div className="col gap-4">
        {films.length ? films.map((c) => {
          const weeks = weeksSoFar(c.run!, sim.now);
          const peak = peakOf(c.run, sim.now);
          // Its totals in their currency, its reception and its way out (from 2026-10-25, the owner's brief 27, Part 12).
          const totals = totalsOf(c.run!, sim.now);
          const usd = (n: number) => formatMoney(n * 100, 'USD', { cents: false });
          const route = routeWords(c);
          const intl = c.run!.currency !== undefined;
          return (
            <div key={c.id} className="col gap-2">
              <p className="small strong" style={{ margin: 0 }}>{c.project}</p>
              <p className="small" style={{ margin: 0 }}>
                {`Opened in the US on ${formatDate(c.run!.opening, sim.zone)}. ${peak !== undefined ? `Its best week was No. ${peak} in the game’s own chart.` : 'It hasn’t made the game’s own Top 10.'}${route ? ` ${route}` : ''}`}
              </p>
              {totals.worldwide !== undefined && <p className="small" style={{ margin: 0 }}>{`So far ${usd(totals.domestic)} in the US and ${usd(totals.international!)} abroad: ${usd(totals.worldwide)} worldwide, every figure in US dollars.`}</p>}
              {c.run!.response && <p className="small" style={{ margin: 0 }}>{`Critics scored it ${c.run!.response.critics} of 100 and audiences ${c.run!.response.audience} of 100, both simulated.`}</p>}
              <table className="pay-table">
                <thead><tr><th>Week Of</th><th className="num">In The US</th>{intl && <th className="num">Abroad</th>}<th>Place</th></tr></thead>
                <tbody>
                  {weeks.map((w) => (
                    <tr key={w.from}>
                      <td>{formatDate(w.from, sim.zone)}</td>
                      <td className="num">{usd(w.gross)}</td>
                      {intl && <td className="num">{w.international !== undefined ? usd(w.international) : 'Not Reported'}</td>}
                      <td>{w.rank === 'outside' ? 'Outside The Top 10' : `No. ${w.rank}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }) : <p className="small" style={{ margin: 0 }}>None of your films is in cinemas. When one opens, its weeks show here as the clock reaches them.</p>}
        <Fine>The game’s own box office: a simulation for films the game invents, never a published figure, the US weeks ranked in the game’s own chart and the takings abroad beside them, all in US dollars. A film’s gross is the production’s, not your pay, and a good week pays you nothing. The production’s own quality and your part in it move how a film opens and holds, a lead’s part more than a small one, and neither decides it alone.</Fine>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Your Series On Screen: each season's audience, the game's simulation (from 2026-10-25, brief 27's K6, `seasonAudience`)
// ---------------------------------------------------------------------------------------------------------------------

function SeriesPanel() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const ids = [...new Set((person.pro?.engagements ?? []).map((e) => projectById(e.projectId)?.series).filter((x): x is string => !!x))];
  const series = ids.map((id) => seriesById(id)).filter((x) => x !== undefined);
  return (
    <Panel title="Your Series On Screen" help="career.awards">
      <div className="col gap-4">
        {series.length ? series.map((s) => {
          // The seasons that have finished airing, the last three, each with what it averaged and the network's word after it.
          const done: number[] = [];
          // A real series' seasons from the first the game simulates (from 2026-10-25, brief 27, `simulatedSeason`).
          for (let y = s.firstSeason; seasonWindow(s, y).to <= sim.now; y += 1) if (seasonMade(sim, s, y) && simulatedSeason(s, y)) done.push(y);
          const said = decisionsTo(sim, s, new Date(sim.now).getUTCFullYear() + 1).filter((d) => d.at <= sim.now);
          return (
            <div key={s.id} className="col gap-2">
              <p className="small strong" style={{ margin: 0 }}>{s.title}</p>
              {done.length ? (
                <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {done.slice(-3).map((y) => {
                    const a = seasonAudience(sim, s, y)!;
                    const word = said.find((d) => d.year === y + 1);
                    return <li key={y}>{`${seasonName(sim, s, y).replace(/^the/, 'Its')}: ${audienceWords(a)}, critics ${a.critics} of 100.${word ? ` ${decisionWords(sim, s, word).replace(/ Its last season averaged .*$/, '')}` : ''}`}</li>;
                  })}
                </ul>
              ) : <p className="small" style={{ margin: 0 }}>No season of it has finished airing yet.</p>}
            </div>
          );
        }) : <p className="small" style={{ margin: 0 }}>You haven’t worked on a series yet. One you’ve worked on shows here, each season’s audience as it finishes.</p>}
        <Fine>Each season’s audience and reviews are the game’s simulation, never a published figure, for series it invents and for a real series’ seasons after the one its pages had on the air: a broadcast series counted in viewers an episode, a streaming one in hours viewed a week, never the one as the other. Your part in a season moves them a little. The network reads them, with the series’ age, when it says whether there’s another season.</Fine>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Published Charts: the reference snapshots
// ---------------------------------------------------------------------------------------------------------------------

const CHART_IDS = Object.keys(CHARTS) as ChartId[];

/** A row's own details, by its chart: theaters and the total for the box office, hours for Netflix, episodes for Nielsen. */
function extraWords(chart: ChartId, e: ChartEntry): string {
  const x = e.extra ?? {};
  const n = (v: unknown) => (typeof v === 'number' ? v.toLocaleString('en-US') : 'Not Reported');
  if (CHARTS[chart].unit === 'usd') return `${n(x.theaters)} theaters; ${typeof x.total === 'number' ? formatMoney(x.total * 100, 'USD', { cents: false }) : 'Not Reported'} in all; week ${n(x.weeks)} of its run`;
  if (CHARTS[chart].unit === 'views') return `${typeof x.hours === 'number' ? `${(x.hours / 1e6).toFixed(1).replace(/\.0$/, '')} million hours` : 'Hours Not Reported'}; ${n(x.weeksInTop10)} ${x.weeksInTop10 === 1 ? 'week' : 'weeks'} in the Top 10`;
  return `${n(x.episodes)} ${x.episodes === 1 ? 'title' : 'episodes'}; on ${typeof x.providers === 'string' ? x.providers.replace(/ \| /g, ' and ') : 'Not Reported'}`;
}

function ChartsPanel() {
  const { sim } = useGame();
  const [chart, setChart] = useState<ChartId>('bom-domestic-weekly');
  const held = weeksBy(REFERENCE, chart, sim.now);
  const [weekFrom, setWeekFrom] = useState<string | undefined>(undefined);
  const week = held.find((w) => w.from === weekFrom) ?? held.at(-1);
  const spec = CHARTS[chart];
  const latest = latestOf(REFERENCE, chart, sim.now);
  const snap = week && currentOf(week);
  const elsewhere = snap ? snap.entries.flatMap((e) => titleAcross(REFERENCE, e.titleId).filter((x) => x.chart !== chart && weekEnd(x.to) <= sim.now).map((x) => ({ title: e.name, ...x }))) : [];
  return (
    <Panel title="Published Charts" help="career.awards">
      <div className="col gap-3">
        <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field">
            <label htmlFor="chart-pick">Chart</label>
            <select id="chart-pick" value={chart} onChange={(e) => { setChart(e.target.value as ChartId); setWeekFrom(undefined); }}>
              {CHART_IDS.map((id) => <option key={id} value={id}>{CHARTS[id].name}</option>)}
            </select>
          </div>
          {held.length > 1 && (
            <div className="field">
              <label htmlFor="chart-week">Week</label>
              <select id="chart-week" value={week?.from} onChange={(e) => setWeekFrom(e.target.value)}>
                {held.map((w) => <option key={w.from} value={w.from}>{weekWords(w)}</option>)}
              </select>
            </div>
          )}
        </div>
        <p className="small" style={{ margin: 0 }}>{`${spec.provider}: ${spec.metric}, in ${spec.territory}.`}</p>
        {week && snap ? (
          <>
            <dl className="col gap-2 small" style={{ margin: 0 }}>
              <div><dt className="strong">Week</dt><dd style={{ margin: 0 }}>{weekWords(week)}</dd></div>
              <div><dt className="strong">Read</dt><dd style={{ margin: 0 }}>{`${snap.published ? `Published ${longDate(snap.published)}; ` : ''}first seen ${longDate(snap.firstSeen)} by ${snap.seenBy}, and imported ${longDate(snap.imported)}`}</dd></div>
              {latest && latest.week.from === week.from && (
                <div><dt className="strong">How Old</dt><dd style={{ margin: 0 }}>{latest.weeksOld === 0 ? 'The latest week the game holds. It ended less than a week ago.' : `The latest week the game holds. It ended ${latest.weeksOld === 1 ? 'a week' : `${latest.weeksOld} weeks`} ago, and the game doesn’t fetch newer ones.`}</dd></div>
              )}
              {week.revisions.length > 1 && (
                <div><dt className="strong">Revised</dt><dd style={{ margin: 0 }}>{week.revisions.slice(0, -1).map((r) => `first read ${longDate(r.firstSeen)} by ${r.seenBy}${r.partial ? `, ${r.entries.length} of its ranks` : ''}, with ${r.entries.map((e) => `${e.name} at ${figureWords(chart, e.value)}`).join(' and ')}`).join('; ')}. The figures below are the latest reading.</dd></div>
              )}
              <div><dt className="strong">Its Figures</dt><dd style={{ margin: 0 }}>{spec.figures}</dd></div>
            </dl>
            {/* In its own scrolling region, as every wide table is (from 2026-10-24, brief 27's upright walk: until then its
                Also column was 107 pixels wide on a 390-pixel screen, five lines a cell). */}
            <div className="table-scroll">
              <table className="pay-table">
                <thead><tr><th className="num">No.</th><th>Title</th><th className="num">Figure</th><th>Since The Week Before</th><th>Also</th></tr></thead>
                <tbody>
                  {snap.entries.map((e) => (
                    <tr key={e.rank}>
                      <td className="num">{e.rank}</td>
                      <td>{e.name}</td>
                      <td className="num">{figureWords(chart, e.value)}</td>
                      <td>{movementWords(movementOf(REFERENCE, week, e.titleId))}</td>
                      <td>{extraWords(chart, e)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {elsewhere.length > 0 && (
              <details className="small">
                <summary>In Other Charts</summary>
                <ul style={{ margin: 'var(--s2) 0 0', paddingLeft: '1.1rem' }}>
                  {elsewhere.map((x) => <li key={`${x.chart}:${x.from}:${x.entry.titleId}`}>{`${x.title}: No. ${x.entry.rank} in ${CHARTS[x.chart].name}, ${weekWords(x)}, ${figureWords(x.chart, x.entry.value)} in ${CHARTS[x.chart].territory}`}</li>)}
                </ul>
              </details>
            )}
          </>
        ) : <p className="small" style={{ margin: 0 }}>The game holds no week of this chart that has ended by today.</p>}
        <Fine>Each chart was read once from its provider’s public page and imported by the game, which never fetches it again or pays for it. Each keeps its own unit, territory and week, and nothing here adds one to another. A title outside a published Top 10 is said to be outside it, never given a place; a figure a provider didn’t publish is Not Reported.</Fine>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Awards And Festivals: the inventory
// ---------------------------------------------------------------------------------------------------------------------

const COVERAGE_WORDS: Readonly<Record<Coverage, string>> = {
  enforced: 'Rules read, and the game follows them',
  'read-in-part': 'Read in part; the game doesn’t decide it',
  refused: 'Its pages refused; the game doesn’t decide it',
  unreached: 'Not reached; the game doesn’t decide it',
};

function InventoryPanel() {
  return (
    <Panel title="Awards And Festivals" help="career.awards">
      <div className="col gap-3">
        {(['award', 'festival'] as const).map((kind) => (
          <details key={kind} className="small">
            <summary>{kind === 'award' ? 'The Awards' : 'The Festivals'}</summary>
            <ul style={{ margin: 'var(--s2) 0 0', paddingLeft: '1.1rem' }} className="col gap-2">
              {INSTITUTIONS.filter((i) => i.kind === kind).map((i) => (
                <li key={i.id}><span className="strong">{i.name}</span>{`, ${i.organizer}. ${COVERAGE_WORDS[i.coverage]}. ${i.known}`}</li>
              ))}
            </ul>
          </details>
        ))}
        <Fine>Each organization’s awards are its own competition: the Television Academy’s Emmy Awards, the National Academy’s and the International Academy’s each have their own rules, and so does each section of a festival.</Fine>
      </div>
    </Panel>
  );
}

/**
 * The organizations two federations' own lists name, by country: never ranked, and none of them said to have dealt with
 * the actor. Where the actor lives comes first, from their city's country.
 */
function WorldPanel() {
  const person = useWorld((s) => s.player);
  const homeId = CITIES.get(person.currentLocationId)?.countryId;
  const name = (id: string): string => COUNTRIES.get(id)?.name ?? id.toUpperCase();
  const countries = [...new Set([...PERFORMER_UNIONS, ...ACCREDITED_FESTIVALS].map((x) => x.country))].sort((a, b) => name(a).localeCompare(name(b)));
  const home = homeId ? { unions: unionsIn(homeId).map((u) => u.name), festivals: festivalsIn(homeId).map((f) => f.name) } : undefined;
  return (
    <Panel title="Unions And Festivals Around The World" help="career.awards">
      <div className="col gap-3">
        {home && homeId && (
          <p className="small" style={{ margin: 0 }}>
            {`Where you live, in ${countryWords(name(homeId))}, ${home.unions.length ? `FIA lists ${spokenList(home.unions)}` : 'FIA lists no performers’ union'}, and ${home.festivals.length ? `FIAPF accredits ${spokenList(home.festivals)}` : 'FIAPF accredits no festival'}.`}
          </p>
        )}
        <details className="small">
          <summary>{`By Country: ${countries.length} Countries`}</summary>
          <ul style={{ margin: 'var(--s2) 0 0', paddingLeft: '1.1rem' }} className="col gap-2">
            {countries.map((c) => {
              const unions = unionsIn(c).map((u) => u.name);
              const festivals = festivalsIn(c).map((f) => f.name);
              return (
                <li key={c}><span className="strong">{name(c)}</span>{`: ${[unions.length ? `the ${unions.length === 1 ? 'union' : 'unions'} ${spokenList(unions)}` : '', festivals.length ? `the ${festivals.length === 1 ? 'festival' : 'festivals'} ${spokenList(festivals)}` : ''].filter(Boolean).join('; ')}.`}</li>
              );
            })}
          </ul>
        </details>
        <Fine>{`A union is here because FIA, the International Federation of Actors, lists it as a member, and a festival because FIAPF, the International Federation of Film Producers Associations, accredits it, as each federation’s page had them on October 24, 2026: ${PERFORMER_UNIONS.length} unions and ${ACCREDITED_FESTIVALS.length} festivals. A country missing from a list may still have its own: the lists name only their members. Naming them here says nothing about you, and none of them has dealt with you.`}</Fine>
      </div>
    </Panel>
  );
}
