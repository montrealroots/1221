/**
 * Industry — the real studios, who runs them, and everything they have made.
 *
 * Two layers of truth, and the screen says which is which: the catalogue and
 * the leadership are the public record up to the day the save began; what a
 * studio does inside the save is simulation. A number the record does not
 * have is shown as missing, never estimated.
 */
import { useEffect, useMemo, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Empty, Tabs, Modal } from '@/ui/components/primitives';
import { STUDIOS, STUDIO_TIER_LABEL, STUDIO_TIER_ORDER, type Studio } from '@/engine/content/studios';
import {
  CREDIT_ROLE_LABEL, CREDIT_ROLE_ORDER, TITLE_KIND_LABEL, creditsFor, decadeOf, franchisesIn, isCreditsLoaded, isImdbLoaded, isStudioCatalogLoaded,
  loadStudioCatalog, loadStudioCredits, studioCatalog, type CatalogTitle,
} from '@/engine/content/filmography';
import { COUNTRIES } from '@/engine/content/geography';
import { formatMoneyCompact } from '@/engine/core/money';
import { formatDate, zonedParts } from '@/engine/core/time';
import { titleCaseLabel } from '@/engine/core/text';
import type { Project } from '@/engine/domain/model';

type Tab = 'studios' | 'networks' | 'people';
type Kind = 'all' | 'film' | 'tv';
type Sort = 'year' | 'gross' | 'tomatometer' | 'imdb' | 'title';

const isTv = (t: CatalogTitle) => t.kind === 'series' || t.kind === 'limited_series';

function money(amount: number | undefined, unit: string | undefined): string {
  if (amount === undefined) return '';
  if (!unit || unit === 'United States dollar') return formatMoneyCompact(Math.round(amount * 100));
  return `${Math.round(amount).toLocaleString('en-US')} ${unit}`;
}

function runtime(minutes: number | undefined): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function IndustryWorkspace() {
  const [tab, setTab] = useState<Tab>('studios');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const studios = STUDIOS.all();
  const selected = selectedId ? STUDIOS.get(selectedId) : undefined;

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Industry</div>
        <h1>{studios.length} Studios</h1>
        <p className="muted">
          The real companies, their real leadership and everything they have made. Up to the day your save began
          it is the record; after that it is your universe, and the screen says which is which.
        </p>
      </div>

      <Tabs active={tab} onChange={(id) => { setTab(id); setSelectedId(null); }} tabs={[
        { id: 'studios', label: 'Studios', badge: studios.length },
        { id: 'networks', label: 'Networks' },
        { id: 'people', label: 'People' },
      ]} />

      {tab === 'studios' && !selected && <StudioList onSelect={setSelectedId} />}
      {tab === 'studios' && selected && <StudioDetail studio={selected} onBack={() => setSelectedId(null)} />}
      {tab === 'networks' && <Empty title="The Networks Come Next" body="Streaming and linear networks are the next step of the industry build. Until then, two placeholder outlets stand in for television buyers." />}
      {tab === 'people' && <Empty title="The People Come After The Networks" body="Presidents, executives, showrunners, directors, producers, actors, cinematographers and composers each get their own step." />}
    </>
  );
}

function StudioList({ onSelect }: { onSelect: (id: string) => void }) {
  const groups = STUDIO_TIER_ORDER.map((tier) => ({ tier, studios: STUDIOS.all().filter((s) => s.type === tier) })).filter((g) => g.studios.length > 0);
  return (
    <>
      {groups.map(({ tier, studios }) => (
        <Panel key={tier} title={STUDIO_TIER_LABEL[tier]} subtitle={`${studios.length} ${studios.length === 1 ? 'company' : 'companies'}`} flush>
          <div className="list">
            {studios.map((studio) => {
              const country = COUNTRIES.get(studio.countryId);
              const head = studio.leadership[0];
              const stats = studio.stats;
              return (
                <button key={studio.id} className="list-item" onClick={() => onSelect(studio.id)} style={{ textAlign: 'left' }}>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="small strong truncate">{studio.name}</div>
                    <div className="xs dim truncate">
                      {studio.parent ? `${studio.parent.name} · ` : ''}{studio.city}{country ? `, ${country.name}` : ''}{studio.founded ? ` · Since ${studio.founded}` : ''}
                    </div>
                    <div className="xs dim truncate">
                      {head ? `${head.name}, ${head.title}` : 'Leadership Not On Record'}
                      {stats && stats.titles > 0 ? ` · ${stats.films.toLocaleString('en-US')} Films, ${stats.series.toLocaleString('en-US')} Series On Record` : ''}
                    </div>
                  </div>
                  {studio.status && <span className="chip chip-warning">In Flux</span>}
                  <span className="chip">{studio.wants.slice(0, 3).map(titleCaseLabel).join(' · ')}</span>
                </button>
              );
            })}
          </div>
        </Panel>
      ))}
      <p className="xs dim" style={{ marginTop: 'var(--s3)' }}>
        Genres shown are measured from each studio's own catalogue since 2011 where the record allows, and SLATE's estimate where it does not.
      </p>
    </>
  );
}

function StudioDetail({ studio, onBack }: { studio: Studio; onBack: () => void }) {
  const { sim, refresh } = useGame();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<Kind>('all');
  const [sort, setSort] = useState<Sort>('year');
  const [shown, setShown] = useState(80);
  const [open, setOpen] = useState<CatalogTitle | null>(null);
  const loaded = isStudioCatalogLoaded(studio.id);

  useEffect(() => {
    if (loaded) return;
    let cancelled = false;
    loadStudioCatalog(studio.id).then(() => { if (!cancelled) refresh(); }).catch(() => {});
    return () => { cancelled = true; };
  }, [studio.id, loaded, refresh]);

  const worldYear = zonedParts(sim.now, sim.homeZone).year;
  const worldDay = `${worldYear}-${String(zonedParts(sim.now, sim.homeZone).month).padStart(2, '0')}-${String(zonedParts(sim.now, sim.homeZone).day).padStart(2, '0')}`;

  // Only what the world has seen: a title dated after today in the save has
  // not happened yet as far as anyone in it knows.
  const catalogue = useMemo(() => (loaded ? (studioCatalog(studio.id) ?? []) : []).filter((t) => !t.date || t.date <= worldDay), [studio.id, worldDay, loaded]);
  const franchises = useMemo(() => franchisesIn(catalogue), [catalogue]);
  const inUniverse = useWorld((s) => Object.values(s.universe.projects).filter((p) => p.studioId === studio.id || (p.distributorName === studio.name && !p.studioId)));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = catalogue.filter((t) => (kind === 'all' || (kind === 'tv') === isTv(t)) && (!q || t.title.toLowerCase().includes(q) || t.directors.some((d) => d.toLowerCase().includes(q)) || (t.franchise?.name.toLowerCase().includes(q) ?? false)));
    const by = (a: number | undefined) => a ?? -1;
    rows.sort((a, b) => sort === 'year' ? (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title)
      : sort === 'gross' ? by(b.boxOfficeUnit === 'United States dollar' ? b.boxOffice : undefined) - by(a.boxOfficeUnit === 'United States dollar' ? a.boxOffice : undefined)
      : sort === 'tomatometer' ? by(b.tomatometer) - by(a.tomatometer) || by(b.tomatometerCount) - by(a.tomatometerCount)
      : sort === 'imdb' ? by(b.imdb) - by(a.imdb) || by(b.imdbVotes) - by(a.imdbVotes)
      : a.title.localeCompare(b.title));
    return rows;
  }, [catalogue, query, kind, sort]);

  const country = COUNTRIES.get(studio.countryId);
  const stats = studio.stats;
  const films = catalogue.filter((t) => !isTv(t)).length;
  const series = catalogue.length - films;

  return (
    <>
      <div className="row gap-2" style={{ marginBottom: 'var(--s3)' }}>
        <button className="btn btn-sm" onClick={onBack}>← All Studios</button>
      </div>
      <div className="page-head" style={{ marginBottom: 'var(--s4)' }}>
        <div className="eyebrow">{STUDIO_TIER_LABEL[studio.type]}</div>
        <h1>{studio.name}</h1>
        <p className="muted">
          {studio.parent ? `${studio.parent.name}. ` : ''}{studio.ownership}. {studio.city}{country ? `, ${country.name}` : ''}{studio.founded ? `, since ${studio.founded}` : ''}.
        </p>
        <p className="small">{studio.description}</p>
        {studio.status && <div className="callout callout-warning small">{studio.status}</div>}
        {studio.parent?.note && !studio.status && <div className="callout callout-info small">{studio.parent.note}</div>}
        {studio.catalogueNote && <div className="callout small">{studio.catalogueNote}</div>}
      </div>

      <div className="grid grid-2">
        <Panel title="Leadership" subtitle="Who runs it. Verified seats carry the source that confirmed them this year." flush>
          <div className="list">
            {studio.leadership.map((leader) => (
              <div key={`${leader.name}|${leader.title}`} className="list-item list-static">
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="small strong truncate">{leader.name}</div>
                  <div className="xs dim">{leader.title}</div>
                  {leader.note && <div className="xs dim">{leader.note}</div>}
                </div>
                {leader.source
                  ? <a className="chip chip-positive" href={leader.source} target="_blank" rel="noreferrer" title={leader.source}>Verified</a>
                  : <span className="chip" title="From the record, not confirmed this year">On Record</span>}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="What They Make" subtitle={stats && stats.titles > 0 ? `Measured from ${stats.titles.toLocaleString('en-US')} titles on record.` : 'The record is thin; these are SLATE\'s estimates.'}>
          <div className="grid grid-2">
            <Stat label="Films On Record" value={stats ? stats.films.toLocaleString('en-US') : '0'} />
            <Stat label="Series On Record" value={stats ? stats.series.toLocaleString('en-US') : '0'} />
            <Stat label="Films A Year" value={studio.slateSize} note={studio.measured.slate ? 'Since 2021, measured' : 'Estimated'} />
            <Stat label="Budget Band" value={`${formatMoneyCompact(studio.budgetFloor)} To ${formatMoneyCompact(studio.budgetCeiling)}`} note={studio.measured.budgets ? `Measured from ${stats?.budgetSample ?? 0} budgets` : 'Estimated'} />
            <Stat label="Median Gross" value={stats?.grossMedian ? formatMoneyCompact(stats.grossMedian * 100) : 'Not On Record'} note={stats?.grossSample ? `${stats.grossSample} films since 2011` : undefined} />
            <Stat label="Tomatometer, Mean" value={stats?.rtMean !== null && stats?.rtMean !== undefined ? `${stats.rtMean}%` : 'Not On Record'} note={stats?.rtSample ? `${stats.rtSample} films since 2011` : undefined} />
            {stats?.top && <Stat label="Biggest Film" value={stats.top.title} note={`${stats.top.year}, ${formatMoneyCompact(stats.top.gross * 100)}`} />}
            {stats?.topSeries && stats.topSeries.episodes > 0 && <Stat label="Longest Series" value={stats.topSeries.title} note={`${stats.topSeries.episodes} episodes`} />}
          </div>
          <div className="small" style={{ marginTop: 'var(--s3)' }}>
            <span className="dim">Wants: </span>{studio.wants.map(titleCaseLabel).join(', ')}{studio.avoids.length > 0 && <><span className="dim"> · Will not touch: </span>{studio.avoids.map(titleCaseLabel).join(', ')}</>}
          </div>
          <div className="xs dim" style={{ marginTop: 'var(--s2)' }}>
            Access {studio.accessDifficulty}, risk appetite {studio.riskAppetite}, prestige bias {studio.prestigeBias} out of 100, and {studio.distributes ? `${Math.round(studio.distributionReach * 100)}% reach in its home market` : 'no distribution of its own'}: SLATE's calibration.
          </div>
        </Panel>
      </div>

      <Panel title="Labels" subtitle="The production and distribution names whose titles count as this studio's." tight>
        <div className="row wrap gap-1">
          {studio.labels.map((label) => <span key={label.qid} className={`chip ${label.kind === 'tv' ? 'chip-info' : ''}`}>{label.name}{label.kind === 'tv' ? ' · TV' : ''}</span>)}
        </div>
      </Panel>

      <Panel title="Franchises And IP" subtitle={loaded ? `${franchises.length} franchises with two or more titles on record, biggest first.` : 'Loading the catalogue.'} flush>
        {franchises.length === 0
          ? <Empty title="No Franchise On Record" body="Nothing in this catalogue is recorded as part of a franchise or series." />
          : (
            <div className="list">
              {franchises.slice(0, 40).map((f) => (
                <div key={f.name} className="list-item list-static">
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="small strong truncate">{f.name}</div>
                    <div className="xs dim truncate">
                      {f.titles.length} Titles{f.firstYear ? ` · ${f.firstYear}${f.lastYear && f.lastYear !== f.firstYear ? ` To ${f.lastYear}` : ''}` : ''}
                      {' · '}{f.titles.slice(0, 4).map((t) => t.title).join(', ')}{f.titles.length > 4 ? ', …' : ''}
                    </div>
                  </div>
                  {f.gross > 0 && <span className="chip">{formatMoneyCompact(f.gross * 100)} Gross</span>}
                </div>
              ))}
            </div>
          )}
      </Panel>

      <Panel title="In Your Universe" subtitle="What this studio has done since your save began. Simulation, not record." flush>
        {inUniverse.length === 0
          ? <Empty title="Nothing Yet" body={`${studio.shortName} has not set up, bought or released anything in your universe so far.`} />
          : (
            <div className="list">
              {inUniverse.slice(0, 30).map((p: Project) => (
                <div key={p.id} className="list-item list-static">
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="small strong truncate">{p.title}</div>
                    <div className="xs dim truncate">{TITLE_KIND_LABEL[p.format as keyof typeof TITLE_KIND_LABEL] ?? titleCaseLabel(p.format.replace(/_/g, ' '))} · {p.genres.map(titleCaseLabel).join(', ')}{p.budget > 0 ? ` · ${formatMoneyCompact(p.budget)}` : ''}{p.releaseDate ? ` · Released ${formatDate(p.releaseDate, sim.homeZone)}` : ''}</div>
                  </div>
                  <span className="chip">{titleCaseLabel(p.phase.replace(/_/g, ' '))}</span>
                </div>
              ))}
            </div>
          )}
      </Panel>

      <Panel
        title="Catalogue"
        subtitle={loaded ? `${films.toLocaleString('en-US')} films and ${series.toLocaleString('en-US')} series the world has seen by ${formatDate(sim.now, sim.homeZone)}.` : 'Loading the catalogue.'}
        flush
        actions={(
          <>
            <input className="search-input" type="search" placeholder="Title, director or franchise" value={query} onChange={(e) => { setQuery(e.target.value); setShown(80); }} aria-label="Search the catalogue" style={{ width: 220 }} />
            <select className="btn btn-sm" style={{ width: 110 }} value={kind} onChange={(e) => { setKind(e.target.value as Kind); setShown(80); }} aria-label="Kind">
              <option value="all">All</option>
              <option value="film">Films</option>
              <option value="tv">Series</option>
            </select>
            <select className="btn btn-sm" style={{ width: 140 }} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
              <option value="year">Newest</option>
              <option value="gross">Box Office</option>
              <option value="tomatometer">Tomatometer</option>
              <option value="imdb">IMDb</option>
              <option value="title">Title</option>
            </select>
          </>
        )}
      >
        {!loaded ? <Empty title="Loading" body="Pulling the catalogue." /> : filtered.length === 0 ? <Empty title="Nothing Matches" body="No title on record matches that." /> : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>{['Year', 'Title', 'Kind', 'Genre', 'Runtime', 'Rated', 'Box Office', 'Budget', 'RT', 'MC', 'IMDb', 'Franchise'].map((h) => <th key={h} className="nowrap">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.slice(0, shown).map((t) => (
                  <tr key={t.qid} onClick={() => setOpen(t)} style={{ cursor: 'pointer' }}>
                    <td className="tabular">{t.year ?? ''}</td>
                    <td className="strong nowrap" style={{ minWidth: 200 }}>{t.title}</td>
                    <td className="xs nowrap">{TITLE_KIND_LABEL[t.kind]}</td>
                    <td className="xs nowrap">{t.slateGenres.slice(0, 2).map(titleCaseLabel).join(', ')}</td>
                    <td className="xs tabular nowrap">{isTv(t) ? (t.episodes ? `${t.episodes} Ep` : '') : runtime(t.runtime)}</td>
                    <td className="xs">{t.rating ?? ''}</td>
                    <td className="tabular nowrap">{money(t.boxOffice, t.boxOfficeUnit)}</td>
                    <td className="tabular nowrap">{money(t.budget, t.budgetUnit)}</td>
                    <td className="tabular">{t.tomatometer !== undefined ? `${t.tomatometer}%` : ''}</td>
                    <td className="tabular">{t.metacritic ?? ''}</td>
                    <td className="tabular">{t.imdb !== undefined ? t.imdb.toFixed(1) : ''}</td>
                    <td className="xs truncate" style={{ maxWidth: 160 }}>{t.franchise?.name ?? t.series?.name ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > shown && (
              <div className="center" style={{ padding: 'var(--s3)' }}>
                <button className="btn btn-sm" onClick={() => setShown(shown + 120)}>Show More ({(filtered.length - shown).toLocaleString('en-US')} Left)</button>
              </div>
            )}
          </div>
        )}
        <p className="xs dim" style={{ padding: 'var(--s2) var(--s4) var(--s3)' }}>
          Record from Wikidata (CC0). Box office is the highest figure on record, worldwide where it is recorded. Blank means the record has no number.{isImdbLoaded() ? ' IMDb ratings from IMDb\'s published dataset.' : ''}
        </p>
      </Panel>

      {open && <TitleDialog title={open} studioId={studio.id} onClose={() => setOpen(null)} />}
    </>
  );
}

function TitleDialog({ title, studioId, onClose }: { title: CatalogTitle; studioId: string; onClose: () => void }) {
  const { refresh } = useGame();
  const decade = decadeOf(title.year);
  const ready = isCreditsLoaded(studioId, decade);

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    loadStudioCredits(studioId, decade).then(() => { if (!cancelled) refresh(); }).catch(() => {});
    return () => { cancelled = true; };
  }, [studioId, decade, ready, refresh]);

  const credits = creditsFor(title.qid) ?? [];
  const crew = CREDIT_ROLE_ORDER.map((role) => ({ role, names: credits.filter((c) => c.role === role).map((c) => c.name) })).filter((g) => g.names.length > 0);
  const cast = credits.filter((c) => c.role === 'cast');
  const awards = credits.filter((c) => c.role === 'award').map((c) => c.name);
  const follows = credits.filter((c) => c.role === 'follows').map((c) => c.name);
  const followedBy = credits.filter((c) => c.role === 'followed_by').map((c) => c.name);
  const subjects = credits.filter((c) => c.role === 'subject').map((c) => c.name);
  const tv = isTv(title);

  return (
    <Modal title={`${title.title}${title.year ? ` (${title.year})` : ''}`} onClose={onClose} wide>
      <p className="small muted" style={{ marginTop: 0 }}>
        {TITLE_KIND_LABEL[title.kind]}{title.originalTitle ? ` · ${title.originalTitle}` : ''}{title.date ? ` · ${title.date}` : ''}{tv && title.start ? ` · ${title.start}${title.end ? ` To ${title.end}` : ' Onwards'}` : ''}
        {!tv && title.runtime ? ` · ${runtime(title.runtime)}` : ''}{tv && title.seasons ? ` · ${title.seasons} Season${title.seasons === 1 ? '' : 's'}` : ''}{tv && title.episodes ? `, ${title.episodes} Episodes` : ''}
        {title.rating ? ` · Rated ${title.rating}` : ''}
      </p>
      <div className="row wrap gap-1" style={{ marginBottom: 'var(--s3)' }}>
        {title.genres.map((g) => <span key={g} className="chip">{titleCaseLabel(g)}</span>)}
        {title.countries.map((c) => <span key={c} className="chip chip-info">{c}</span>)}
        {title.languages.map((l) => <span key={l} className="chip chip-info">{l}</span>)}
      </div>

      <div className="grid grid-3">
        <Stat label="Box Office" value={money(title.boxOffice, title.boxOfficeUnit) || 'Not On Record'} note={title.boxOffice ? 'Highest figure on record' : undefined} />
        <Stat label="Budget" value={money(title.budget, title.budgetUnit) || 'Not On Record'} />
        <Stat label="Tomatometer" value={title.tomatometer !== undefined ? `${title.tomatometer}%` : 'Not On Record'} note={title.tomatometerCount ? `${title.tomatometerCount} reviews${title.criticsAverage ? `, average ${title.criticsAverage}/10` : ''}` : undefined} />
        <Stat label="Audience Score" value={title.audienceScore !== undefined ? `${title.audienceScore}%` : 'Not On Record'} note="Rotten Tomatoes" />
        <Stat label="Metacritic" value={title.metacritic !== undefined ? `${title.metacritic}/100` : 'Not On Record'} note={title.metacriticCount ? `${title.metacriticCount} critics` : undefined} />
        <Stat label="IMDb" value={title.imdb !== undefined ? `${title.imdb.toFixed(1)}/10` : 'Not On Record'} note={title.imdbVotes ? `${title.imdbVotes.toLocaleString('en-US')} votes` : undefined} />
      </div>

      {(title.franchise || title.series || title.basedOn.length > 0 || follows.length > 0 || followedBy.length > 0) && (
        <div className="callout small" style={{ marginTop: 'var(--s3)' }}>
          {title.franchise && <div><span className="dim">Franchise: </span>{title.franchise.name}</div>}
          {title.series && <div><span className="dim">Part Of: </span>{title.series.name}</div>}
          {title.basedOn.length > 0 && <div><span className="dim">Based On: </span>{title.basedOn.join(', ')}</div>}
          {follows.length > 0 && <div><span className="dim">Follows: </span>{follows.join(', ')}</div>}
          {followedBy.length > 0 && <div><span className="dim">Followed By: </span>{followedBy.join(', ')}</div>}
        </div>
      )}

      <div className="grid grid-2" style={{ marginTop: 'var(--s3)' }}>
        <div>
          <h3 className="small strong">Credits</h3>
          {!ready ? <p className="xs dim">Loading credits.</p> : crew.length === 0 ? <p className="xs dim">No crew on record.</p> : (
            <div className="list">
              {crew.map((g) => (
                <div key={g.role} className="list-item list-static" style={{ padding: 'var(--s1) 0' }}>
                  <span className="xs dim" style={{ width: 130, flexShrink: 0 }}>{CREDIT_ROLE_LABEL[g.role] ?? titleCaseLabel(g.role.replace(/_/g, ' '))}</span>
                  <span className="small">{g.names.join(', ')}</span>
                </div>
              ))}
            </div>
          )}
          {subjects.length > 0 && <p className="xs dim" style={{ marginTop: 'var(--s2)' }}>About: {subjects.join(', ')}</p>}
        </div>
        <div>
          <h3 className="small strong">Cast</h3>
          {!ready ? <p className="xs dim">Loading cast.</p> : cast.length === 0 ? <p className="xs dim">No cast on record.</p> : (
            <div className="list">
              {cast.slice(0, 40).map((c) => (
                <div key={`${c.personQid}|${c.name}`} className="list-item list-static" style={{ padding: 'var(--s1) 0' }}>
                  <span className="small">{c.name}</span>
                  {c.character && <span className="xs dim"> as {c.character}</span>}
                </div>
              ))}
              {cast.length > 40 && <p className="xs dim">And {cast.length - 40} more on record.</p>}
            </div>
          )}
        </div>
      </div>

      {awards.length > 0 && (
        <div style={{ marginTop: 'var(--s3)' }}>
          <h3 className="small strong">Awards On Record</h3>
          <div className="row wrap gap-1">{awards.map((a) => <span key={a} className="chip chip-positive">{a}</span>)}</div>
        </div>
      )}

      <div className="small" style={{ marginTop: 'var(--s3)' }}>
        {title.companies.length > 0 && <div><span className="dim">Production: </span>{title.companies.join(', ')}</div>}
        {title.distributors.length > 0 && <div><span className="dim">Distribution: </span>{title.distributors.join(', ')}</div>}
        {title.broadcasters.length > 0 && <div><span className="dim">Broadcaster: </span>{title.broadcasters.join(', ')}</div>}
      </div>

      <div className="row wrap gap-2" style={{ marginTop: 'var(--s3)' }}>
        {title.imdbId && <a className="btn btn-sm" href={`https://www.imdb.com/title/${title.imdbId}/`} target="_blank" rel="noreferrer">IMDb</a>}
        {title.rottenTomatoesId && <a className="btn btn-sm" href={`https://www.rottentomatoes.com/${title.rottenTomatoesId}`} target="_blank" rel="noreferrer">Rotten Tomatoes</a>}
        {title.metacriticId && <a className="btn btn-sm" href={`https://www.metacritic.com/${title.metacriticId}`} target="_blank" rel="noreferrer">Metacritic</a>}
        <a className="btn btn-sm" href={`https://www.wikidata.org/wiki/${title.qid}`} target="_blank" rel="noreferrer">Wikidata</a>
      </div>
      <p className="xs dim" style={{ marginTop: 'var(--s3)', marginBottom: 0 }}>
        Record from Wikidata (CC0){title.imdb !== undefined && isImdbLoaded() ? ', IMDb rating from IMDb\'s published dataset' : ''}. A blank or "Not On Record" means the record has no number, not that SLATE guessed one.
      </p>
    </Modal>
  );
}
