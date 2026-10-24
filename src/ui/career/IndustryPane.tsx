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
 * the actor lives first and then by country (`content/industry.ts`).
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
  REFERENCE, currentOf, figureWords, latestOf, longDate, movementOf, movementWords, peakOf, titleAcross, weekEnd, weekWords, weeksBy, weeksSoFar,
} from '@/engine/systems/charts';
import {
  VISIBILITY, ceremonyLines, eligibleWords, emmyCheck, entryFee, entryRefusal, festivalCheck, festivalCheckWords, festivalWords,
  internationalWhy, projectOfCredit, recapWords, visibilityOf, watchRefusal,
} from '@/engine/systems/awards';
import type { ProCredit } from '@/engine/systems/pro';

export function IndustryPane() {
  return (
    <div className="col gap-5">
      <RecognitionPanel />
      <BoxOfficePanel />
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
          <h3 className="eyebrow" style={{ margin: 0 }}>The Sundance Film Festival</h3>
          {film.length
            ? film.map((c) => <FestivalCredit key={c.id} sim={sim} person={person} c={c} />)
            : <p className="small" style={{ margin: 0 }}>None of your work is a film yet. A short or an independent feature can go to Sundance once it’s finished, if its production submits it.</p>}
        </div>
        <Fine>
          {`The Emmy Awards’ eligibility, entries, fees and nominations follow the 78th Emmy Awards’ rules, and Sundance’s follow its 2027 festival’s; a later year carries them forward. The other entrants, the votes and the festival’s choices are the game’s, and no other nominee is named. Recognition lasts on your Portfolio; what it does for casting fades, at most ${Math.round(VISIBILITY.most * 100)}% better.`}
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
          return (
            <div key={c.id} className="col gap-2">
              <p className="small strong" style={{ margin: 0 }}>{c.project}</p>
              <p className="small" style={{ margin: 0 }}>
                {`Opened ${formatDate(c.run!.opening, sim.zone)}. ${peak !== undefined ? `Its best week was No. ${peak} in the game’s own chart.` : 'It hasn’t made the game’s own Top 10.'}`}
              </p>
              <table className="pay-table">
                <thead><tr><th>Week Of</th><th className="num">Gross</th><th>Place</th></tr></thead>
                <tbody>
                  {weeks.map((w) => (
                    <tr key={w.from}>
                      <td>{formatDate(w.from, sim.zone)}</td>
                      <td className="num">{formatMoney(w.gross * 100, 'USD', { cents: false })}</td>
                      <td>{w.rank === 'outside' ? 'Outside The Top 10' : `No. ${w.rank}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }) : <p className="small" style={{ margin: 0 }}>None of your films is in cinemas. When one opens, its weeks show here as the clock reaches them.</p>}
        <Fine>The game’s own box office: a simulation for films the game invents, never a published figure. A film’s gross is the production’s, not your pay, and a good week pays you nothing. How well your part went doesn’t move it.</Fine>
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
