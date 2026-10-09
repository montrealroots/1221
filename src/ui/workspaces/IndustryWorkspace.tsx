/**
 * SLATE — The Industry: the entertainment database (from 2026-10-08).
 *
 * One place to look up the business: real films and series and the people in
 * them (Wikidata, CC0, as dated), the ten companies, and everything this save
 * has made of them: its projects, the performers cast in them, the class, and
 * you. Every page says which of those it is. A name opens its own page, by its
 * own address (`routeOf`), so the breadcrumbs and Back work, and a page
 * reached from a credit, a search or a list is the same page.
 *
 * What's done from here is done by the career's own commands: submitting for
 * a part, asking your agent to pitch you, researching a project before its
 * audition. Looking at a page changes nothing about you.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Empty, Fine, Panel, Stat } from '@/ui/components/primitives';
import { Gated, useFeature } from '@/ui/guide/Guide';
import { useKept, useKeptScroll } from '@/ui/kept';
import { formatDate } from '@/engine/core/time';
import { plural } from '@/engine/core/text';
import { COMPANIES, COMPANIES_SOURCE, companyById, type IndustryCompany } from '@/engine/content/industry';
import { CITIES } from '@/engine/content/geography';
import { agencyById, breakdownsOf, careerOf, roleById } from '@/engine/systems/career';
import { industryOf, performerById, pitchRefusal, projectById, type PartHolder, type Project } from '@/engine/systems/industry';
import { counts, entries, filmographies, formatWord, genreWord, routeOf, search, statusWord, suggest, titlesOf, type EntryKind, type Query, type RealTitle, type RealWorld } from '@/engine/world/database';

// ---------------------------------------------------------------------------
// The real-world records, loaded once when first wanted
// ---------------------------------------------------------------------------

type Loaded = { status: 'loading' } | { status: 'ready'; real: RealWorld } | { status: 'unavailable'; why: string };
let loading: Promise<RealWorld> | undefined;
let loaded: Loaded = { status: 'loading' };

function useReal(): Loaded {
  const [state, setState] = useState<Loaded>(loaded);
  useEffect(() => {
    if (loaded.status !== 'loading') return;
    loading ??= import('@/engine/content/realworld/titles.json').then((m) => m.default as unknown as RealWorld);
    let live = true;
    loading.then(
      (real) => { loaded = { status: 'ready', real }; if (live) setState(loaded); },
      (e) => { loaded = { status: 'unavailable', why: String((e as Error).message ?? e) }; loading = undefined; if (live) setState(loaded); },
    );
    return () => { live = false; };
  }, []);
  return state;
}
const realOf = (l: Loaded) => (l.status === 'ready' ? l.real : undefined);

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

const SOURCE_WORDS = { real: 'Real World', company: 'Company', save: 'In This Save' } as const;

function SourceChip({ source }: { source: keyof typeof SOURCE_WORDS }) {
  return <span className={`chip ${source === 'save' ? 'chip-accent' : source === 'real' ? 'chip-info' : ''}`}>{SOURCE_WORDS[source]}</span>;
}

/** A name that opens its page. */
function To({ kind, id, children }: { kind: EntryKind; id: string; children: ReactNode }) {
  const { navigate } = useGame();
  return <button type="button" className="link" onClick={() => navigate(routeOf(kind, id), typeof children === 'string' ? children : 'The Industry')}>{children}</button>;
}

function Holder({ holder }: { holder: PartHolder | undefined }) {
  const { sim } = useGame();
  if (!holder) return <span className="dim">Not Cast Yet</span>;
  if (holder.kind === 'player') return <To kind="you" id={sim.player.id}>You</To>;
  if (holder.kind === 'classmate') return <To kind="classmate" id={String(holder.i)}>{sim.player.school?.classmates[holder.i]?.name ?? 'A Classmate'}</To>;
  const p = performerById(sim, holder.id);
  return p ? <To kind="performer" id={p.id}>{p.name}</To> : <span className="dim">A Performer</span>;
}

/** Add to and take off the player's lists, by the public command. */
function ListButtons({ kind, id }: { kind: 'project' | 'title' | 'person' | 'company'; id: string }) {
  const { run } = useGame();
  const lists = useWorld((s) => industryOf(s).lists);
  return (
    <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
      {lists.map((l) => {
        const on = l.items.some((x) => x.kind === kind && x.id === id);
        return <Gated key={l.id} feature="industry.list" className="btn btn-sm" aria-pressed={on} onClick={() => run('industry.list', { list: l.id, kind, id, on: !on })}>{on ? `On ${l.name}` : `Add To ${l.name}`}</Gated>;
      })}
    </div>
  );
}

function RateIt({ ratingKey }: { ratingKey: string }) {
  const { run } = useGame();
  const mine = useWorld((s) => industryOf(s).ratings[ratingKey]?.score);
  // Until its chapter's read, the guide is asked first, as for every other control.
  if (!useFeature('industry.rate').open) return <Gated feature="industry.rate" className="btn btn-sm">Your Rating</Gated>;
  return (
    <label className="row gap-2 small">
      Your Rating
      <select value={mine ?? ''} onChange={(e) => { if (e.target.value) run('industry.rate', { key: ratingKey, score: Number(e.target.value) }); }} aria-label="Your Rating, Out Of 10">
        <option value="">Not Rated</option>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} / 10</option>)}
      </select>
    </label>
  );
}

/** Each page is remembered in Recently Viewed as it opens. */
function useViewed(kind: string, id: string) {
  const { run } = useGame();
  useEffect(() => { run('industry.view', { kind, id }, { silent: true }); }, [kind, id, run]);
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  const shown = rows.filter(([, v]) => v !== undefined && v !== null && v !== '');
  return (
    <dl className="facts">
      {shown.map(([k, v]) => <div key={k} className="facts-row"><dt className="xs dim">{k}</dt><dd className="small">{v}</dd></div>)}
    </dl>
  );
}

function RealNote({ real }: { real: RealWorld }) {
  return <Fine>{`Real-world records from ${real.source}, retrieved ${real.retrieved}. ${real.scope} Plots, reviews, images and biographies aren’t held: Wikidata’s structured facts are free to reuse, those aren’t. SLATE doesn’t use IMDb’s data, whose terms forbid it.`}</Fine>;
}

// ---------------------------------------------------------------------------
// The screen
// ---------------------------------------------------------------------------

const TABS = [
  { id: 'find', label: 'Find' }, { id: 'projects', label: 'This Save’s Projects' }, { id: 'companies', label: 'Companies' },
  { id: 'releases', label: 'Releases' }, { id: 'awards', label: 'Awards' }, { id: 'charts', label: 'Charts' }, { id: 'lists', label: 'Your Lists' },
] as const;
type Tab = (typeof TABS)[number]['id'];

export function IndustryWorkspace({ route }: { route: string }) {
  const [, , , kind, raw] = route.split('/');
  const id = raw ? decodeURIComponent(raw) : undefined;
  const real = useReal();
  if (kind && id) return <EntityPage kind={kind as EntryKind} id={id} loaded={real} />;
  return <IndustryHome loaded={real} />;
}

function IndustryHome({ loaded: l }: { loaded: Loaded }) {
  const [tab, setTab] = useKept<Tab>('industry.tab', 'find');
  useKeptScroll(`industry.${tab}`);
  const n = useWorld((s) => counts(s, realOf(l)), [l]);
  const panes: Record<Tab, JSX.Element> = { find: <FindPane loaded={l} />, projects: <ProjectsPane />, companies: <CompaniesPane loaded={l} />, releases: <ReleasesPane loaded={l} />, awards: <AwardsPane loaded={l} />, charts: <ChartsPane />, lists: <ListsPane loaded={l} /> };
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Work</div>
        <h1>The Industry</h1>
        <p className="muted">
          {l.status === 'ready' ? `${plural(n.realTitles ?? 0, 'real film or series', 'real films and series')} and ${plural(n.realPeople ?? 0, 'person', 'people')} from Wikidata, ` : l.status === 'loading' ? 'The real-world records are loading; ' : 'The real-world records couldn’t be loaded; '}
          {`the ${n.companies} companies, and this save’s ${n.projects} ${n.projects === 1 ? 'project' : 'projects'}, ${n.performers} ${n.performers === 1 ? 'performer' : 'performers'} and your class of ${n.classmates}.`}
        </p>
        <div className="chip-row"><SourceChip source="real" /><SourceChip source="company" /><SourceChip source="save" /><span className="xs dim">Every page says which it is. In This Save is this save’s fiction.</span></div>
      </div>
      <div className="tabs" role="tablist" aria-label="The Industry">
        {TABS.map((one, i) => (
          <button key={one.id} id={`industry-tab-${one.id}`} type="button" role="tab" className="tab" aria-selected={one.id === tab} aria-controls={`industry-pane-${one.id}`} tabIndex={one.id === tab ? 0 : -1}
            onClick={() => setTab(one.id)}
            onKeyDown={(e) => {
              const go = (k: number) => { const next = TABS[(k + TABS.length) % TABS.length]!; setTab(next.id); document.getElementById(`industry-tab-${next.id}`)?.focus(); };
              if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); } else if (e.key === 'Home') { e.preventDefault(); go(0); } else if (e.key === 'End') { e.preventDefault(); go(TABS.length - 1); }
            }}>{one.label}</button>
        ))}
      </div>
      <div role="tabpanel" id={`industry-pane-${tab}`} aria-labelledby={`industry-tab-${tab}`} tabIndex={0}>{panes[tab]}</div>

    </>
  );
}

// ---------------------------------------------------------------------------
// Find
// ---------------------------------------------------------------------------

const KIND_FILTERS: { id: string; label: string; kinds: EntryKind[] }[] = [
  { id: 'all', label: 'Everything', kinds: [] }, { id: 'titles', label: 'Films And Series', kinds: ['title', 'project'] }, { id: 'people', label: 'People', kinds: ['person', 'performer', 'classmate', 'you'] }, { id: 'companies', label: 'Companies', kinds: ['company'] },
];

function FindPane({ loaded: l }: { loaded: Loaded }) {
  const { navigate } = useGame();
  const [text, setText] = useKept('industry.find.text', '');
  const [kind, setKind] = useKept('industry.find.kind', 'all');
  const [source, setSource] = useKept<'' | 'real' | 'save' | 'company'>('industry.find.source', '');
  const [from, setFrom] = useKept('industry.find.from', '');
  const [to, setTo] = useKept('industry.find.to', '');
  const [genre, setGenre] = useKept('industry.find.genre', '');
  const [company, setCompany] = useKept('industry.find.company', '');
  const [sort, setSort] = useKept<NonNullable<Query['sort']>>('industry.find.sort', 'relevance');
  const [page, setPage] = useKept('industry.find.page', 1);
  const [focused, setFocused] = useState(false);
  const all = useWorld((s) => entries(s, realOf(l)), [l]);
  const q: Query = { text, kinds: KIND_FILTERS.find((k) => k.id === kind)!.kinds, ...(source ? { source } : {}), ...(from ? { from: Number(from) } : {}), ...(to ? { to: Number(to) } : {}), ...(genre ? { genre } : {}), ...(company ? { company } : {}), sort, page };
  const found = useMemo(() => search(all, q), [all, JSON.stringify(q)]); // eslint-disable-line react-hooks/exhaustive-deps
  const hints = focused ? suggest(all, text, 6) : [];
  const reset = (f: () => void) => { f(); setPage(1); };
  return (
    <Panel title="Find" subtitle="Titles, projects, people and companies, by name">
      <div className="col gap-3">
        <div className="find-box">
          <label htmlFor="industry-find" className="sr-only">Find By Name</label>
          <input id="industry-find" className="input" value={text} placeholder="A Title, A Person, A Company" autoComplete="off"
            role="combobox" aria-expanded={hints.length > 0} aria-controls="industry-hints"
            onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 150)}
            onChange={(e) => reset(() => setText(e.target.value))} />
          {hints.length > 0 && (
            <ul id="industry-hints" className="find-hints" role="listbox" aria-label="Suggestions">
              {hints.map((e) => <li key={`${e.kind}:${e.id}`} role="option" aria-selected={false}><button type="button" className="find-hint" onMouseDown={(ev) => ev.preventDefault()} onClick={() => navigate(routeOf(e.kind, e.id), e.name)}><span className="truncate">{e.name}</span><span className="xs dim truncate">{e.sub}</span></button></li>)}
            </ul>
          )}
        </div>
        <div className="filters">
          <label className="small">Show<select value={kind} onChange={(e) => reset(() => setKind(e.target.value))}>{KIND_FILTERS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select></label>
          <label className="small">From<select value={source} onChange={(e) => reset(() => setSource(e.target.value as typeof source))}><option value="">Everywhere</option><option value="real">Real World</option><option value="save">In This Save</option><option value="company">The Ten Companies</option></select></label>
          <label className="small">Company<select value={company} onChange={(e) => reset(() => setCompany(e.target.value))}><option value="">Any</option>{COMPANIES.map((c) => <option key={c.id} value={c.id}>{c.short}</option>)}</select></label>
          <label className="small">Genre<input className="input" value={genre} placeholder="Drama" onChange={(e) => reset(() => setGenre(e.target.value))} /></label>
          <label className="small">Years<span className="row gap-1"><input className="input" inputMode="numeric" aria-label="From The Year" value={from} placeholder="2015" onChange={(e) => reset(() => setFrom(e.target.value.replace(/\D/g, '').slice(0, 4)))} /><input className="input" inputMode="numeric" aria-label="To The Year" value={to} placeholder="2026" onChange={(e) => reset(() => setTo(e.target.value.replace(/\D/g, '').slice(0, 4)))} /></span></label>
          <label className="small">Sort<select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="relevance">Best Match</option><option value="name">By Name</option><option value="newest">Newest First</option><option value="oldest">Oldest First</option></select></label>
        </div>
        {l.status === 'loading' && <p className="small dim" role="status">Loading the real-world records; this save’s are here already.</p>}
        {l.status === 'unavailable' && <p className="small" role="status">The real-world records couldn’t be loaded ({l.why}). This save’s projects, people and the companies are all here; nothing real is shown in their place.</p>}
        {found.total === 0 ? (
          <Empty title="No Matches" body={text ? `No match for “${text}” with these filters.` : 'No match with these filters.'} />
        ) : (
          <>
            <p className="xs dim" role="status">{found.total} found{found.pages > 1 ? `, page ${found.page} of ${found.pages}` : ''}</p>
            <ul className="results">
              {found.rows.map((e) => (
                <li key={`${e.kind}:${e.id}`} className="result">
                  <To kind={e.kind} id={e.id}>{e.name}</To>
                  <span className="xs dim">{e.sub}</span>
                </li>
              ))}
            </ul>
            {found.pages > 1 && (
              <div className="row gap-2">
                <button type="button" className="btn btn-sm" disabled={found.page <= 1} onClick={() => setPage(found.page - 1)}>Previous Page</button>
                <span className="xs dim">Page {found.page} Of {found.pages}</span>
                <button type="button" className="btn btn-sm" disabled={found.page >= found.pages} onClick={() => setPage(found.page + 1)}>Next Page</button>
              </div>
            )}
          </>
        )}
        {l.status === 'ready' && <RealNote real={l.real} />}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// This save's projects, the companies, releases, awards, charts, lists
// ---------------------------------------------------------------------------

function ProjectRow({ p }: { p: Project }) {
  const { sim } = useGame();
  const mine = p.parts.some((x) => x.holder?.kind === 'player');
  return (
    <li className="result">
      <span className="row gap-2" style={{ flexWrap: 'wrap' }}><To kind="project" id={p.id}>{p.title}</To>{mine && <span className="chip chip-accent">Yours</span>}</span>
      <span className="xs dim">{formatWord(p.format)} · {p.producer} · {CITIES.get(p.cityId)?.name ?? p.cityId} · {statusWord(p, sim.now)}</span>
    </li>
  );
}

function ProjectsPane() {
  const projects = useWorld((s) => industryOf(s).projects);
  const [status, setStatus] = useKept('industry.projects.status', 'casting');
  const shown = projects.filter((p) => status === 'all' || (status === 'yours' ? p.parts.some((x) => x.holder?.kind === 'player') : p.status === status)).slice().sort((a, b) => b.announced - a.announced);
  const [page, setPage] = useKept('industry.projects.page', 1);
  const per = 25;
  const pages = Math.max(1, Math.ceil(shown.length / per));
  const at = Math.min(page, pages);
  return (
    <Panel title="This Save’s Projects" subtitle="Made up by the save: SLATE’s titles, its companies’ fictional work">
      <div className="col gap-3">
        <label className="small row gap-2">Showing<select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="casting">Casting</option><option value="development">In Development</option><option value="production">In Production</option><option value="post">In Post-Production</option><option value="released">Released</option><option value="cancelled">Canceled</option><option value="yours">Yours</option><option value="all">All</option>
        </select></label>
        {shown.length === 0 ? <Empty title="None Yet" body="The business announces work in the town you work in each month, and casts it as it goes; anything you audition for is here." /> : (
          <>
            <ul className="results">{shown.slice((at - 1) * per, at * per).map((p) => <ProjectRow key={p.id} p={p} />)}</ul>
            {pages > 1 && <div className="row gap-2"><button type="button" className="btn btn-sm" disabled={at <= 1} onClick={() => setPage(at - 1)}>Previous Page</button><span className="xs dim">Page {at} Of {pages}</span><button type="button" className="btn btn-sm" disabled={at >= pages} onClick={() => setPage(at + 1)}>Next Page</button></div>}
          </>
        )}
      </div>
    </Panel>
  );
}

function CompaniesPane({ loaded: l }: { loaded: Loaded }) {
  const projects = useWorld((s) => industryOf(s).projects);
  return (
    <Panel title="The Ten Companies" subtitle="Chosen for what they make, how far it reaches, what they order, and what they mean to an actor here: a selection, not a ranking">
      <div className="grid grid-2">
        {COMPANIES.map((c) => (
          <div key={c.id} className="card col gap-1">
            <To kind="company" id={c.id}>{c.short}</To>
            <span className="xs dim">{c.name}{c.parent ? `, part of ${c.parent}` : ''}</span>
            <span className="xs">{c.scale}</span>
            <span className="xs dim">{titlesOf(realOf(l), c.id).length} real titles here · {projects.filter((p) => p.companyId === c.id).length} projects in this save</span>
          </div>
        ))}
      </div>
      <Fine>{`From ${COMPANIES_SOURCE} The figures are each company’s or the trade’s, dated where they’re given.`}</Fine>
    </Panel>
  );
}

function ReleasesPane({ loaded: l }: { loaded: Loaded }) {
  const { sim } = useGame();
  const projects = useWorld((s) => industryOf(s).projects);
  const coming = projects.filter((p) => p.status !== 'released' && p.status !== 'cancelled' && p.releaseAt > sim.now).sort((a, b) => a.releaseAt - b.releaseAt).slice(0, 30);
  const out = projects.filter((p) => p.status === 'released').sort((a, b) => b.releaseAt - a.releaseAt).slice(0, 15);
  const real = realOf(l);
  const realLately = real ? real.titles.filter((t) => t.released).sort((a, b) => (b.released! < a.released! ? -1 : 1)).slice(0, 20) : [];
  return (
    <div className="grid grid-2">
      <Panel title="Coming Out In This Save" subtitle="By each project’s planned date; the career’s own date for work of yours">
        {coming.length === 0 ? <Empty title="No Dates Yet" body="Projects get release dates as they’re made." /> : <ul className="results">{coming.map((p) => <li key={p.id} className="result"><To kind="project" id={p.id}>{p.title}</To><span className="xs dim">{formatDate(p.releaseAt, sim.zone)} · {formatWord(p.format)} · {p.producer}</span></li>)}</ul>}
      </Panel>
      <Panel title="Out Lately In This Save">
        {out.length === 0 ? <Empty title="None Out Yet" body="Released projects are listed here with SLATE’s own reception." /> : <ul className="results">{out.map((p) => <li key={p.id} className="result"><To kind="project" id={p.id}>{p.title}</To><span className="xs dim">{formatDate(p.releaseAt, sim.zone)}{p.reception ? ` · Critics ${p.reception.critics}, Audiences ${p.reception.audience} (SLATE’s)` : ''}</span></li>)}</ul>}
      </Panel>
      <Panel title="Real World, Latest In SLATE’s Records" subtitle="By first release date, as Wikidata gives it">
        {!real ? <p className="small dim">{l.status === 'loading' ? 'Loading…' : 'The real-world records couldn’t be loaded.'}</p> : <ul className="results">{realLately.map((t) => <li key={t.id} className="result"><To kind="title" id={t.id}>{t.title}</To><span className="xs dim">{t.released} · {t.kind === 'series' ? 'Series' : 'Film'}</span></li>)}</ul>}
      </Panel>
    </div>
  );
}

function AwardsPane({ loaded: l }: { loaded: Loaded }) {
  const person = useWorld((s) => s.player);
  const real = realOf(l);
  const yours = careerOf(person).awards ?? [];
  const [award, setAward] = useKept('industry.awards.award', '');
  const tally = useMemo(() => {
    const m = new Map<string, RealTitle[]>();
    for (const t of real?.titles ?? []) for (const a of t.awards) m.set(a, [...(m.get(a) ?? []), t]);
    return [...m].sort((a, b) => b[1].length - a[1].length);
  }, [real]);
  const chosen = tally.find(([a]) => a === award);
  return (
    <div className="grid grid-2">
      <Panel title="Yours, In This Save" subtitle="Work entered for awards, and what came of it">
        {yours.length === 0 ? <Empty title="No Entries Yet" body="Work of yours can be entered for awards from Career." /> : <ul className="results">{yours.map((e) => <li key={`${e.bookingId}-${e.body}-${e.year}`} className="result"><span className="small">{e.category}, {e.year}</span><span className="xs dim">{e.won ? 'Won' : e.nominated ? 'Nominated' : e.nominated === false ? 'Not nominated' : 'Entered'}</span></li>)}</ul>}
      </Panel>
      <Panel title="Real World, By Award" subtitle="Awards Wikidata records for SLATE’s real titles">
        {!real ? <p className="small dim">{l.status === 'loading' ? 'Loading…' : 'The real-world records couldn’t be loaded.'}</p> : (
          <div className="col gap-2">
            <label className="small row gap-2">Award<select value={award} onChange={(e) => setAward(e.target.value)}><option value="">Choose One</option>{tally.map(([a, ts]) => <option key={a} value={a}>{a} ({ts.length})</option>)}</select></label>
            {chosen && <ul className="results">{chosen[1].map((t) => <li key={t.id} className="result"><To kind="title" id={t.id}>{t.title}</To><span className="xs dim">{t.year}</span></li>)}</ul>}
          </div>
        )}
      </Panel>
    </div>
  );
}

function ChartsPane() {
  const projects = useWorld((s) => industryOf(s).projects);
  const ratings = useWorld((s) => industryOf(s).ratings);
  const best = projects.filter((p) => p.reception).sort((a, b) => b.reception!.critics - a.reception!.critics).slice(0, 10);
  const busy = COMPANIES.map((c) => ({ c, n: projects.filter((p) => p.companyId === c.id).length })).sort((a, b) => b.n - a.n);
  const mine = Object.entries(ratings).sort((a, b) => b[1].score - a[1].score).slice(0, 10);
  return (
    <div className="grid grid-2">
      <Panel title="Best Received In This Save" subtitle="SLATE’s own critics’ scores, drawn at release: no real reviews">
        {best.length === 0 ? <Empty title="None Out Yet" body="Released projects are ranked here." /> : <ol className="results">{best.map((p) => <li key={p.id} className="result"><To kind="project" id={p.id}>{p.title}</To><span className="xs dim">Critics {p.reception!.critics} · Audiences {p.reception!.audience}</span></li>)}</ol>}
      </Panel>
      <Panel title="Busiest Companies In This Save" subtitle="Projects on the record">
        <ol className="results">{busy.map(({ c, n }) => <li key={c.id} className="result"><To kind="company" id={c.id}>{c.short}</To><span className="xs dim">{n} {n === 1 ? 'project' : 'projects'}</span></li>)}</ol>
      </Panel>
      <Panel title="Your Ratings" subtitle="Yours alone, out of 10">
        {mine.length === 0 ? <Empty title="None Yet" body="Rate a real title, or a project of this save’s once it’s out, from its page." /> : <ol className="results">{mine.map(([key, r]) => <li key={key} className="result"><span className="small">{key.startsWith('project:') ? <To kind="project" id={key.slice(8)}>{projects.find((p) => p.id === key.slice(8))?.title ?? 'A Project'}</To> : <To kind="title" id={key.slice(6)}>{key.slice(6)}</To>}</span><span className="xs dim">{r.score} / 10</span></li>)}</ol>}
      </Panel>
      <Panel title="Real World Charts" subtitle="Not kept">
        <p className="small" style={{ margin: 0 }}>Real rankings by popularity or by ratings, such as a top 250, come from a service’s own users and aren’t free to reuse, so SLATE keeps none. Its real titles are only ordered by how widely Wikidata documents them.</p>
      </Panel>
    </div>
  );
}

function nameOf(sim: ReturnType<typeof useGame>['sim'], real: RealWorld | undefined, kind: string, id: string): string {
  if (kind === 'project') return projectById(sim, id)?.title ?? 'A Project No Longer On Record';
  if (kind === 'company') return companyById(id)?.short ?? id;
  if (kind === 'title') return real?.titles.find((t) => t.id === id)?.title ?? (real ? 'A Title' : id);
  if (kind === 'person') return real?.people[id] ?? id;
  if (kind === 'performer') return performerById(sim, id)?.name ?? 'A Performer';
  if (kind === 'classmate') return sim.player.school?.classmates[Number(id)]?.name ?? 'A Classmate';
  return sim.player.displayName;
}

function ListsPane({ loaded: l }: { loaded: Loaded }) {
  const { sim, run, toast } = useGame();
  const lists = useWorld((s) => industryOf(s).lists);
  const seen = useWorld((s) => industryOf(s).viewed);
  const [name, setName] = useState('');
  const real = realOf(l);
  return (
    <div className="grid grid-2">
      {lists.map((list) => (
        <Panel key={list.id} title={list.name} subtitle={`${list.items.length} ${list.items.length === 1 ? 'thing' : 'things'}`}>
          {list.items.length === 0 ? <p className="small dim" style={{ margin: 0 }}>Empty: add to it from any page.</p> : (
            <ul className="results">
              {list.items.map((x) => (
                <li key={`${x.kind}:${x.id}`} className="result row-between">
                  <To kind={x.kind} id={x.id}>{nameOf(sim, real, x.kind, x.id)}</To>
                  <Gated feature="industry.list" className="btn btn-sm btn-ghost" onClick={() => run('industry.list', { list: list.id, kind: x.kind, id: x.id, on: false })}>Remove</Gated>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ))}
      <Panel title="A New List">
        <form className="row gap-2" onSubmit={(e) => { e.preventDefault(); if (run('industry.new_list', { name }).ok) { toast(`Made ${name.trim()}.`, 'positive'); setName(''); } }}>
          <label htmlFor="industry-new-list" className="sr-only">The List’s Name</label>
          <input id="industry-new-list" className="input" value={name} maxLength={40} placeholder="Directors To Watch" onChange={(e) => setName(e.target.value)} />
          <Gated feature="industry.new_list" className="btn btn-sm" type="submit">Make The List</Gated>
        </form>
      </Panel>
      <Panel title="Recently Viewed">
        {seen.length === 0 ? <p className="small dim" style={{ margin: 0 }}>Nothing yet.</p> : <ul className="results">{seen.slice(0, 15).map((v) => <li key={`${v.kind}:${v.id}`} className="result"><To kind={v.kind as EntryKind} id={v.id}>{nameOf(sim, real, v.kind, v.id)}</To><span className="xs dim">{formatDate(v.at, sim.zone)}</span></li>)}</ul>}
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The pages
// ---------------------------------------------------------------------------

function EntityPage({ kind, id, loaded: l }: { kind: EntryKind; id: string; loaded: Loaded }) {
  useKeptScroll(`industry.page.${kind}.${id}`);
  useViewed(kind, id);
  const real = realOf(l);
  const needsReal = kind === 'title' || kind === 'person';
  if (needsReal && !real) return l.status === 'loading' ? <p className="small dim" role="status">Loading the real-world records…</p> : <Empty title="Unavailable" body="The real-world records couldn’t be loaded, so this page can’t be shown. This save’s pages all can." />;
  if (kind === 'title') return <TitlePage real={real!} id={id} />;
  if (kind === 'person') return <PersonPage real={real!} id={id} />;
  if (kind === 'company') return <CompanyPage id={id} real={real} />;
  if (kind === 'project') return <ProjectPage id={id} />;
  if (kind === 'performer') return <PerformerPage id={id} />;
  if (kind === 'classmate') return <ClassmatePage i={Number(id)} />;
  if (kind === 'you') return <YouPage />;
  return <Empty title="Not Found" body="There’s nothing at that address." />;
}

function Head({ eyebrow, title, line, source }: { eyebrow: string; title: string; line?: ReactNode; source: keyof typeof SOURCE_WORDS }) {
  return (
    <div className="page-head">
      <div className="eyebrow row gap-2">{eyebrow}<SourceChip source={source} /></div>
      <h1>{title}</h1>
      {line && <p className="muted">{line}</p>}
    </div>
  );
}

function RealRefs({ refs }: { refs: { id: string; name: string }[] }) {
  return <>{refs.map((r, i) => <span key={r.id}>{i > 0 ? ', ' : ''}{r.name}</span>)}</>;
}

function TitlePage({ real, id }: { real: RealWorld; id: string }) {
  const t = real.titles.find((x) => x.id === id);
  if (!t) return <Empty title="Not In SLATE’s Records" body="SLATE keeps a selection of real titles, and that isn’t one of them." />;
  const inRecords = (r: { id: string; name: string }) => real.titles.some((x) => x.id === r.id) ? <To kind="title" id={r.id}>{r.name}</To> : <span>{r.name}</span>;
  return (
    <>
      <Head eyebrow="The Industry · Real World" title={t.title} source="real" line={[t.kind === 'series' ? 'Series' : 'Film', t.year, t.minutes ? `${t.minutes} minutes` : undefined, [...new Set(t.filmGenres.map(genreWord))].slice(0, 4).join(', ')].filter(Boolean).join(' · ')} />
      <div className="grid grid-2">
        <Panel title="The Facts">
          <Facts rows={[
            ['First Released', t.released], ['Countries', t.countries.join(', ')], ['Languages', t.languages.join(', ')],
            ['Seasons', t.seasons], ['Episodes', t.episodes], ['Filming Locations', t.locations.join(', ')],
            ['One Of The Ten', t.companies.length ? <>{t.companies.map((c, i) => <span key={c}>{i > 0 ? ', ' : ''}<To kind="company" id={c}>{companyById(c)?.short ?? c}</To></span>)}</> : undefined],
          ]} />
        </Panel>
        <Panel title="Companies">
          <Facts rows={[['Produced By', t.producers.length ? <RealRefs refs={t.producers} /> : undefined], ['Distributed By', t.distributors.length ? <RealRefs refs={t.distributors} /> : undefined], ['First Shown On', t.broadcasters.length ? <RealRefs refs={t.broadcasters} /> : undefined]]} />
        </Panel>
        <Panel title="Cast And Direction" subtitle={`As Wikidata lists them, ${t.cast.length} of the cast`}>
          <ul className="results">
            {t.directors.map((d) => <li key={`d-${d}`} className="result"><To kind="person" id={d}>{real.people[d] ?? d}</To><span className="xs dim">Director</span></li>)}
            {t.cast.map((c) => <li key={`c-${c.person}`} className="result"><To kind="person" id={c.person}>{real.people[c.person] ?? c.person}</To><span className="xs dim">{c.character ? `As ${c.character}` : 'In the cast'}</span></li>)}
          </ul>
        </Panel>
        <Panel title="Connections And Awards">
          <Facts rows={[
            ['Based On', t.basedOn.length ? <>{t.basedOn.map((r, i) => <span key={r.id}>{i > 0 ? ', ' : ''}{inRecords(r)}</span>)}</> : undefined],
            ['Follows', t.follows.length ? <>{t.follows.map((r, i) => <span key={r.id}>{i > 0 ? ', ' : ''}{inRecords(r)}</span>)}</> : undefined],
            ['Followed By', t.followedBy.length ? <>{t.followedBy.map((r, i) => <span key={r.id}>{i > 0 ? ', ' : ''}{inRecords(r)}</span>)}</> : undefined],
            ['Part Of', t.partOf.length ? <RealRefs refs={t.partOf} /> : undefined],
            ['Awards Won', t.awards.join('; ')], ['Nominated For', t.nominations.join('; ')],
          ]} />
          {!t.basedOn.length && !t.follows.length && !t.followedBy.length && !t.awards.length && !t.nominations.length && <p className="small dim" style={{ margin: 0 }}>Wikidata records none.</p>}
        </Panel>
        <Panel title="Yours">
          <div className="col gap-2"><ListButtons kind="title" id={t.id} /><RateIt ratingKey={`title:${t.id}`} /></div>
        </Panel>
      </div>
      <RealNote real={real} />
    </>
  );
}

function PersonPage({ real, id }: { real: RealWorld; id: string }) {
  const name = real.people[id];
  const work = useMemo(() => filmographies(real).get(id) ?? [], [real, id]);
  if (!name) return <Empty title="Not In SLATE’s Records" body="SLATE keeps the people credited in its real titles, and that isn’t one of them." />;
  const together = new Map<string, number>();
  for (const w of work) for (const c of [...w.title.cast.map((x) => x.person), ...w.title.directors]) if (c !== id) together.set(c, (together.get(c) ?? 0) + 1);
  const often = [...together].sort((a, b) => b[1] - a[1]).slice(0, 10);
  return (
    <>
      <Head eyebrow="The Industry · Real World" title={name} source="real" line={`${work.length} ${work.length === 1 ? 'credit' : 'credits'} in SLATE’s records`} />
      <div className="grid grid-2">
        <Panel title="Credits" subtitle="In SLATE’s real titles only: a person’s whole career is longer">
          <ul className="results">{work.map((w) => <li key={`${w.title.id}-${w.as}`} className="result"><To kind="title" id={w.title.id}>{w.title.title}</To><span className="xs dim">{w.title.year} · {w.as}</span></li>)}</ul>
        </Panel>
        <Panel title="Worked With Most" subtitle="On the titles here">
          {often.length === 0 ? <p className="small dim" style={{ margin: 0 }}>Nobody twice.</p> : <ul className="results">{often.map(([p, n]) => <li key={p} className="result"><To kind="person" id={p}>{real.people[p] ?? p}</To><span className="xs dim">{n} {n === 1 ? 'title' : 'titles'}</span></li>)}</ul>}
        </Panel>
        <Panel title="Yours"><ListButtons kind="person" id={id} /></Panel>
      </div>
      <Fine>Professional credits only, as Wikidata lists them. SLATE keeps no biographies, personal details, contacts or representation for real people.</Fine>
    </>
  );
}

function CompanyPage({ id, real }: { id: string; real?: RealWorld }) {
  const { sim } = useGame();
  const c: IndustryCompany | undefined = companyById(id);
  const projects = useWorld((s) => industryOf(s).projects.filter((p) => p.companyId === id));
  const worked = useWorld((s) => industryOf(s).worked[id]);
  if (!c) return <Empty title="Not Found" body="There’s no such company." />;
  const titles = titlesOf(real, id);
  return (
    <>
      <Head eyebrow="The Industry · Company" title={c.name} source="company" line={`${c.headquarters.city}, ${c.headquarters.country}${c.parent ? ` · part of ${c.parent}` : ''}${c.legal ? ` · ${c.legal}` : ''}`} />
      <div className="grid grid-2">
        <Panel title="Why It’s One Of The Ten"><p className="small" style={{ margin: 0 }}>{c.whyChosen}</p><p className="xs dim">{c.scale}</p></Panel>
        <Panel title="What It Does In SLATE" subtitle="The rules a project of theirs follows here">
          <Facts rows={[
            ['Makes Work In', <>{c.markets.map((m, i) => <span key={m.cityId}>{i > 0 ? '; ' : ''}{CITIES.get(m.cityId)?.name}, {m.basis === 'assumption' ? <em>SLATE’s assumption</em> : m.note}</span>)}</>],
            ['First Seen', c.release === 'theatrical' ? 'In cinemas, then on its own service' : c.release === 'streaming' ? `On ${c.streamer?.name}` : `On ${c.network}`],
            ['Its Streaming Service', c.streamer ? `${c.streamer.name}, ${c.streamer.subscribers}: SLATE reads it as ${c.streamer.size}` : undefined],
            ['Its Television Episodes', c.release === 'streaming' ? 'Seen on its service, at its size: what residuals pay and how many see the work' : c.release === 'broadcast' ? 'Seen on its channels' : c.streamer ? `On its network or on ${c.streamer.name}, at its size` : 'Wherever they sell, as for an independent'],
            ['Its Share Of A Town’s Work', `${c.weight} (SLATE’s estimate, against the others there)`],
            ['You', worked ? `${worked.jobs} ${worked.jobs === 1 ? 'job' : 'jobs'} for it, the last ${formatDate(worked.lastAt, sim.zone)}: its producers read you a little more warmly` : 'You haven’t worked for it'],
          ]} />
        </Panel>
        <Panel title="Divisions">
          <ul className="results">{c.divisions.map((d) => <li key={d.name} className="result"><span className="small">{d.name}</span><span className="xs dim">{d.role}{d.relationship ? ` · ${d.relationship}` : ''}</span></li>)}</ul>
          <p className="xs dim" style={{ margin: 0 }}>{c.functions.join(', ')}</p>
        </Panel>
        <Panel title="Studios And Offices">
          {c.sites.length === 0 ? <p className="small dim" style={{ margin: 0 }}>None found in the research.</p> : <ul className="results">{c.sites.map((f) => <li key={f.name + f.city} className="result"><span className="small">{f.name}</span><span className="xs dim">{f.city}, {f.country}{f.note ? ` · ${f.note}` : ''}</span></li>)}</ul>}
        </Panel>
        <Panel title="In This Save" subtitle="Its fictional projects here">
          {projects.length === 0 ? <p className="small dim" style={{ margin: 0 }}>None yet.</p> : <ul className="results">{projects.slice(-20).reverse().map((p) => <ProjectRow key={p.id} p={p} />)}</ul>}
        </Panel>
        <Panel title="Real Titles" subtitle="Credited to its studios, networks or streamers in Wikidata, 2015 to 2026">
          {!real ? <p className="small dim" style={{ margin: 0 }}>The real-world records aren’t loaded.</p> : titles.length === 0 ? <p className="small dim" style={{ margin: 0 }}>None in SLATE’s records.</p> : <ul className="results">{titles.slice(0, 40).map((t) => <li key={t.id} className="result"><To kind="title" id={t.id}>{t.title}</To><span className="xs dim">{t.year} · {t.kind === 'series' ? 'Series' : 'Film'}</span></li>)}</ul>}
        </Panel>
        <Panel title="Yours"><ListButtons kind="company" id={id} /></Panel>
      </div>
      <Fine>{`From ${COMPANIES_SOURCE} Research findings: ${c.findings.join(', ')}. None of this is the company’s own policy on hiring, and none of it says the company has to do with SLATE: its projects in a save are the save’s fiction.`}</Fine>
    </>
  );
}

function ProjectPage({ id }: { id: string }) {
  const { sim, run, toast } = useGame();
  const p = useWorld((s) => projectById(s, id));
  const career = useWorld((s) => s.player.career);
  if (!p) return <Empty title="No Longer On Record" body="Projects nobody touched leave the record a year after they’re out or called off." />;
  const company = companyById(p.companyId ?? '');
  const agency = career?.agencyId ? agencyById(career.agencyId) : undefined;
  const mine = career?.bookings.filter((b) => b.projectId === p.id) ?? [];
  const tried = career?.auditions.filter((a) => a.projectId === p.id) ?? [];
  const ahead = tried.find((a) => a.status === 'ahead');
  const breakdown = career ? breakdownsOf(sim, sim.player).find((b) => b.projectId === p.id) : undefined;
  return (
    <>
      <Head eyebrow="The Industry · In This Save" title={p.title} source="save" line={<>{formatWord(p.format)} · {company ? <To kind="company" id={company.id}>{company.short}</To> : p.producer} · {CITIES.get(p.cityId)?.name} · {statusWord(p, sim.now)}</>} />
      <div className="grid grid-2">
        <Panel title="Dates" subtitle="Planned, until the work’s booked: then the job’s own">
          <Facts rows={[['Announced', formatDate(p.announced, sim.zone)], ['Casting Until', formatDate(p.castingUntil, sim.zone)], [p.format === 'play' ? 'Rehearsals And Run' : 'Shoots', `${formatDate(p.shootFrom, sim.zone)} to ${formatDate(p.shootUntil, sim.zone)}`], [p.format === 'play' ? 'Opens' : 'Released', formatDate(p.releaseAt, sim.zone)]]} />
        </Panel>
        <Panel title="Parts" subtitle="Who plays what, as the trades would print it: never anybody’s pay">
          <ul className="results">
            {p.parts.map((part) => {
              const role = roleById(part.roleId);
              const pitch = career ? pitchRefusal(sim, sim.player, p.id, part.id, agency, career.pitches ?? [], tried.some((a) => a.partId === part.id && a.status !== 'missed')) : 'Your career hasn’t begun.';
              const open = breakdown?.partId === part.id;
              return (
                <li key={part.id} className="result">
                  <span className="row-between gap-2" style={{ flexWrap: 'wrap' }}><span className="small">{part.name}</span><Holder holder={part.holder} /></span>
                  <span className="xs dim">{role.label} · {part.via === 'open' ? 'Open to submissions' : part.via === 'agent' ? 'Through agents' : 'By offer only'}{part.was?.length ? ` · recast: the one before ${part.was.at(-1)!.why}` : ''}</span>
                  {part.status === 'open' && (p.status === 'casting' || p.status === 'development') && (
                    <span className="row gap-1" style={{ flexWrap: 'wrap' }}>
                      {open && <Gated feature="career.submit_for" onClick={() => { if (run('career.submit_for', { roleId: part.roleId }).ok) toast('Submitted. Casting answers with the week.', 'positive'); }}>Submit Yourself</Gated>}
                      {part.via !== 'offer' && <Gated feature="career.pitch" disabled={Boolean(pitch)} title={pitch} onClick={() => { if (run('career.pitch', { projectId: p.id, partId: part.id }).ok) toast('Your agent will pitch you; they answer with the week.', 'positive'); }}>Ask Your Agent To Pitch You</Gated>}
                      {part.via === 'offer' && <span className="xs dim">The producers go to actors they already want.</span>}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="You And It">
          <div className="col gap-2">
            {tried.length === 0 && mine.length === 0 && <p className="small dim" style={{ margin: 0 }}>You haven’t read for it.</p>}
            {tried.map((a) => <p key={a.id} className="small" style={{ margin: 0 }}>{a.status === 'ahead' ? 'Your audition' : a.status === 'booked' ? 'You booked it from your audition' : a.status === 'missed' ? 'You missed your audition' : 'You auditioned'}, {formatDate(a.at, sim.zone)}{a.researched ? '; researched beforehand' : ''}.</p>)}
            {mine.map((b) => <p key={b.id} className="small" style={{ margin: 0 }}>Your booking: {b.status}{b.season ? `, season ${b.season}` : ''}. <To kind="you" id={sim.player.id}>Your credits</To>.</p>)}
            {ahead && !ahead.researched && <Gated feature="career.research_project" onClick={() => { if (run('career.research_project', { projectId: p.id }).ok) toast('You looked into it: a little better prepared for the audition.', 'positive'); }}>Research It (45 Minutes)</Gated>}
            <ListButtons kind="project" id={p.id} />
            {p.status === 'released' && <RateIt ratingKey={`project:${p.id}`} />}
          </div>
        </Panel>
        {p.reception && <Panel title="Reception" subtitle="SLATE’s own, drawn at release: this save’s fiction"><div className="grid grid-2"><Stat label="Critics" value={`${p.reception.critics} / 100`} /><Stat label="Audiences" value={`${p.reception.audience} / 100`} /></div></Panel>}
        <Panel title="History">
          <ul className="results">{p.history.slice().reverse().map((h, i) => <li key={`${h.at}-${i}`} className="result"><span className="small">{h.what}</span><span className="xs dim">{formatDate(h.at, sim.zone)}</span></li>)}</ul>
        </Panel>
      </div>
      <Fine>This project is the save’s invention: its title, parts, dates and reception. {company ? `${company.short} is real; its part in this project is this save’s fiction, and nothing here is its policy.` : ''} How parts are cast and when it’s out are SLATE’s estimates.</Fine>
    </>
  );
}

function SharedWithYou({ held }: { held: (h: PartHolder | undefined) => boolean }) {
  const projects = useWorld((s) => industryOf(s).projects.filter((p) => p.parts.some((x) => held(x.holder)) && p.parts.some((x) => x.holder?.kind === 'player')));
  return (
    <Panel title="With You" subtitle="Projects you were both in">
      {projects.length === 0 ? <p className="small dim" style={{ margin: 0 }}>None yet.</p> : <ul className="results">{projects.map((p) => <ProjectRow key={p.id} p={p} />)}</ul>}
    </Panel>
  );
}

function PerformerPage({ id }: { id: string }) {
  const { sim } = useGame();
  const who = useWorld((s) => performerById(s, id));
  const projects = useWorld((s) => industryOf(s).projects);
  if (!who) return <Empty title="Not Found" body="There’s no such performer." />;
  const now = who.commitments.filter((c) => c.until >= sim.now).sort((a, b) => a.from - b.from);
  return (
    <>
      <Head eyebrow="The Industry · In This Save" title={who.name} source="save" line={`Actor · ${CITIES.get(who.cityId)?.name} · born ${who.born}`} />
      <div className="grid grid-2">
        <Panel title="Credits" subtitle="Released work">
          {who.credits.length === 0 ? <p className="small dim" style={{ margin: 0 }}>None released yet.</p> : <ul className="results">{who.credits.slice().reverse().map((c) => { const p = projects.find((x) => x.id === c.projectId); return <li key={`${c.projectId}-${c.partId}`} className="result">{p ? <To kind="project" id={p.id}>{p.title}</To> : <span className="small">A project no longer on record</span>}<span className="xs dim">{c.year}{p ? ` · ${p.parts.find((x) => x.id === c.partId)?.name ?? ''}` : ''}</span></li>; })}</ul>}
        </Panel>
        <Panel title="Booked" subtitle="Their commitments: they’re not free for anything else then">
          {now.length === 0 ? <p className="small dim" style={{ margin: 0 }}>Free.</p> : <ul className="results">{now.map((c) => { const p = projects.find((x) => x.id === c.projectId); return <li key={`${c.projectId}-${c.partId}`} className="result">{p ? <To kind="project" id={p.id}>{p.title}</To> : <span className="small">Other work</span>}<span className="xs dim">{formatDate(c.from, sim.zone)} to {formatDate(c.until, sim.zone)}</span></li>; })}</ul>}
        </Panel>
        <SharedWithYou held={(h) => h?.kind === 'performer' && h.id === id} />
      </div>
      <Fine>A performer the business cast in this save: a name, a town, an age and the work, nothing more. Their level of work and what they’re cast in are SLATE’s.</Fine>
    </>
  );
}

function ClassmatePage({ i }: { i: number }) {
  const m = useWorld((s) => s.player.school?.classmates[i]);
  const projects = useWorld((s) => industryOf(s).projects);
  if (!m) return <Empty title="Not Found" body="There’s no such classmate." />;
  const agency = m.career?.agencyId ? agencyById(m.career.agencyId) : undefined;
  return (
    <>
      <Head eyebrow="The Industry · In This Save" title={m.name} source="save" line={`Actor · your class${agency ? ` · with ${agency.name}` : ''}`} />
      <div className="grid grid-2">
        <Panel title="Credits" subtitle="Since the degree">
          {!(m.career?.credits.length) ? <p className="small dim" style={{ margin: 0 }}>None yet.</p> : <ul className="results">{m.career.credits.slice().reverse().map((c, k) => { const p = projects.find((x) => x.id === c.projectId); return <li key={k} className="result">{p ? <To kind="project" id={p.id}>{p.title}</To> : <span className="small">{roleById(c.roleId).label}</span>}<span className="xs dim">{c.year}</span></li>; })}</ul>}
        </Panel>
        <SharedWithYou held={(h) => h?.kind === 'classmate' && h.i === i} />
      </div>
      <Fine>How you get on, and time together, are on People.</Fine>
    </>
  );
}

function YouPage() {
  const { sim } = useGame();
  const career = useWorld((s) => s.player.career);
  const worked = useWorld((s) => industryOf(s).worked);
  const projects = useWorld((s) => industryOf(s).projects);
  return (
    <>
      <Head eyebrow="The Industry · In This Save" title={sim.player.displayName} source="save" line="You" />
      <div className="grid grid-2">
        <Panel title="Your Credits">
          {!(career?.credits.length) ? <p className="small dim" style={{ margin: 0 }}>None yet.</p> : <ul className="results">{career.credits.slice().reverse().map((c, k) => { const p = projects.find((x) => x.id === c.projectId); return <li key={k} className="result">{p ? <To kind="project" id={p.id}>{p.title}</To> : <span className="small">{roleById(c.roleId).label}</span>}<span className="xs dim">{c.year}{c.part ? ` · ${c.part}` : ''}</span></li>; })}</ul>}
        </Panel>
        <Panel title="Companies You’ve Worked For">
          {Object.keys(worked).length === 0 ? <p className="small dim" style={{ margin: 0 }}>None of the ten yet.</p> : <ul className="results">{Object.entries(worked).map(([cid, w]) => <li key={cid} className="result"><To kind="company" id={cid}>{companyById(cid)?.short ?? cid}</To><span className="xs dim">{w.jobs} {w.jobs === 1 ? 'job' : 'jobs'}</span></li>)}</ul>}
        </Panel>
      </div>
    </>
  );
}
