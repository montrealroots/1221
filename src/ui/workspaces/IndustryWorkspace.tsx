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
import { DEAL_KIND_LABEL, NETWORKS, NETWORK_KIND_LABEL, NETWORK_KIND_ORDER, dealsForStudio, type Network } from '@/engine/content/networks';
import {
  CREDIT_ROLE_LABEL, CREDIT_ROLE_ORDER, TITLE_KIND_LABEL, creditsFor, decadeOf, franchisesIn, isCreditsLoaded, isImdbLoaded, isStudioCatalogLoaded, type FranchiseSummary,
  loadStudioCatalog, loadStudioCredits, studioCatalog, type CatalogTitle, isBroadcastSeriesLoaded, loadBroadcastSeries, seriesOn,
} from '@/engine/content/filmography';
import { COUNTRIES } from '@/engine/content/geography';
import { formatMoneyCompact } from '@/engine/core/money';
import { formatDate, zonedParts } from '@/engine/core/time';
import { formatLabel, titleCaseLabel } from '@/engine/core/text';
import type { Project, ProjectFormat } from '@/engine/domain/model';
import { LICENCE_KINDS, LICENCE_KIND_LABEL, licenceOdds, licenceStatus, type LicenceKind } from '@/engine/systems/ip';

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
  const networks = NETWORKS.all();
  const selectedStudio = tab === 'studios' && selectedId ? STUDIOS.get(selectedId) : undefined;
  const selectedNetwork = tab === 'networks' && selectedId ? NETWORKS.get(selectedId) : undefined;

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Industry</div>
        <h1>{studios.length} Studios, {networks.length} Networks</h1>
        <p className="muted">
          The real companies, their real leadership and everything they have made. Up to the day your save began
          it is the record; after that it is your universe, and the screen says which is which.
        </p>
      </div>

      <Tabs active={tab} onChange={(id) => { setTab(id); setSelectedId(null); }} tabs={[
        { id: 'studios', label: 'Studios', badge: studios.length },
        { id: 'networks', label: 'Networks', badge: networks.length },
        { id: 'people', label: 'People' },
      ]} />

      {tab === 'studios' && !selectedStudio && <StudioList onSelect={setSelectedId} />}
      {tab === 'studios' && selectedStudio && <StudioDetail studio={selectedStudio} onBack={() => setSelectedId(null)} />}
      {tab === 'networks' && !selectedNetwork && <NetworkList onSelect={setSelectedId} />}
      {tab === 'networks' && selectedNetwork && <NetworkDetail network={selectedNetwork} onBack={() => setSelectedId(null)} />}
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
                  <Logo id={studio.id} name={studio.shortName} />
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
  const [licensing, setLicensing] = useState<FranchiseSummary | null>(null);
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
  const licences = useWorld((s) => new Map(franchises.map((f) => [f.qid, licenceStatus(s, studio.id, f.qid)])));

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
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <Logo id={studio.id} name={studio.shortName} large />
          <h1 style={{ margin: 0 }}>{studio.name}</h1>
        </div>
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
            <Stat label="Films A Year" value={studio.slateSize} note={studio.measured.slate ? 'Since 2021, Measured' : 'Estimated'} />
            <Stat label="Budget Band" value={`${formatMoneyCompact(studio.budgetFloor)} To ${formatMoneyCompact(studio.budgetCeiling)}`} note={studio.measured.budgets ? `Measured From ${stats?.budgetSample ?? 0} Budgets` : 'Estimated'} />
            <Stat label="Median Gross" value={stats?.grossMedian ? formatMoneyCompact(stats.grossMedian * 100) : 'Not On Record'} note={stats?.grossSample ? `${stats.grossSample} Films Since 2011` : undefined} />
            <Stat label="Tomatometer, Mean" value={stats?.rtMean !== null && stats?.rtMean !== undefined ? `${stats.rtMean}%` : 'Not On Record'} note={stats?.rtSample ? `${stats.rtSample} Films Since 2011` : undefined} />
            {stats?.top && <Stat label="Biggest Film" value={stats.top.title} note={`${stats.top.year}, ${formatMoneyCompact(stats.top.gross * 100)}`} />}
            {stats?.topSeries && stats.topSeries.episodes > 0 && <Stat label="Longest Series" value={stats.topSeries.title} note={`${stats.topSeries.episodes} Episodes`} />}
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

      <StudioDeals studio={studio} />

      <Panel title="Franchises And IP" subtitle={loaded ? `${franchises.length} franchises with two or more titles on record, biggest first. Every one is ${studio.shortName}'s to license; ask, and they answer the way a studio does.` : 'Loading the catalogue.'} flush>
        {franchises.length === 0
          ? <Empty title="No Franchise On Record" body="Nothing in this catalogue is recorded as part of a franchise or series." />
          : (
            <div className="list">
              {franchises.slice(0, 40).map((f) => {
                const licence = licences.get(f.qid) ?? { state: 'none' as const };
                return (
                  <div key={f.qid} className="list-item list-static">
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="small strong truncate">{titleCaseLabel(f.name)}</div>
                      <div className="xs dim truncate">
                        {f.titles.length} Titles{f.firstYear ? ` · ${f.firstYear}${f.lastYear && f.lastYear !== f.firstYear ? ` To ${f.lastYear}` : ''}` : ''}
                        {' · '}{f.titles.slice(0, 4).map((t) => t.title).join(', ')}{f.titles.length > 4 ? ', …' : ''}
                      </div>
                    </div>
                    {f.gross > 0 && <span className="chip">{formatMoneyCompact(f.gross * 100)} Gross</span>}
                    {licence.state === 'licensed' && <span className="chip chip-positive" title="You hold a licence on it in this save">Licensed To You</span>}
                    {licence.state === 'offered' && <span className="chip chip-warning" title="Answer the offer from Home">Offer Standing</span>}
                    {licence.state === 'asked' && <span className="chip" title={licence.respondsAt ? `They answer by ${formatDate(licence.respondsAt, sim.homeZone)}` : undefined}>Asked</span>}
                    {licence.state === 'none' && <button className="btn btn-sm" onClick={() => setLicensing(f)}>Ask To License</button>}
                  </div>
                );
              })}
            </div>
          )}
      </Panel>
      {licensing && <LicenceDialog studio={studio} franchise={licensing} onClose={() => setLicensing(null)} />}

      <Panel title="In Your Universe" subtitle="What this studio has done since your save began. Simulation, not record." flush>
        {inUniverse.length === 0
          ? <Empty title="Nothing Yet" body={`${studio.shortName} has not set up, bought or released anything in your universe so far.`} />
          : (
            <div className="list">
              {inUniverse.slice(0, 30).map((p: Project) => (
                <div key={p.id} className="list-item list-static">
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="small strong truncate">{p.title}</div>
                    <div className="xs dim truncate">{formatLabel(p.format)} · {p.genres.map(titleCaseLabel).join(', ')}{p.budget > 0 ? ` · ${formatMoneyCompact(p.budget)}` : ''}{p.releaseDate ? ` · Released ${formatDate(p.releaseDate, sim.homeZone)}` : ''}</div>
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
        {!loaded ? <Empty title="Loading The Catalogue" body="Pulling every title on record for this studio." /> : filtered.length === 0 ? <Empty title="Nothing Matches" body="No title on record matches that." /> : (
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
                    <td className="xs truncate" style={{ maxWidth: 160 }}>{titleCaseLabel(t.franchise?.name ?? t.series?.name ?? '')}</td>
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
        <Stat label="Box Office" value={money(title.boxOffice, title.boxOfficeUnit) || 'Not On Record'} note={title.boxOffice ? 'Highest Figure On Record' : undefined} />
        <Stat label="Budget" value={money(title.budget, title.budgetUnit) || 'Not On Record'} />
        <Stat label="Tomatometer" value={title.tomatometer !== undefined ? `${title.tomatometer}%` : 'Not On Record'} note={title.tomatometerCount ? `${title.tomatometerCount} Reviews${title.criticsAverage ? `, Average ${title.criticsAverage}/10` : ''}` : undefined} />
        <Stat label="Audience Score" value={title.audienceScore !== undefined ? `${title.audienceScore}%` : 'Not On Record'} note="Rotten Tomatoes" />
        <Stat label="Metacritic" value={title.metacritic !== undefined ? `${title.metacritic}/100` : 'Not On Record'} note={title.metacriticCount ? `${title.metacriticCount} Critics` : undefined} />
        <Stat label="IMDb" value={title.imdb !== undefined ? `${title.imdb.toFixed(1)}/10` : 'Not On Record'} note={title.imdbVotes ? `${title.imdbVotes.toLocaleString('en-US')} Votes` : undefined} />
      </div>

      {(title.franchise || title.series || title.basedOn.length > 0 || follows.length > 0 || followedBy.length > 0) && (
        <div className="callout small" style={{ marginTop: 'var(--s3)' }}>
          {title.franchise && <div><span className="dim">Franchise: </span>{titleCaseLabel(title.franchise.name)}</div>}
          {title.series && <div><span className="dim">Part Of: </span>{titleCaseLabel(title.series.name)}</div>}
          {title.basedOn.length > 0 && <div><span className="dim">Based On: </span>{title.basedOn.map(titleCaseLabel).join(', ')}</div>}
          {follows.length > 0 && <div><span className="dim">Follows: </span>{follows.join(', ')}</div>}
          {followedBy.length > 0 && <div><span className="dim">Followed By: </span>{followedBy.join(', ')}</div>}
        </div>
      )}

      <div className="grid grid-2" style={{ marginTop: 'var(--s3)' }}>
        <div>
          <h3 className="small strong">Credits</h3>
          {!ready ? <p className="xs dim">Loading Credits</p> : crew.length === 0 ? <p className="xs dim">No Crew On Record</p> : (
            <div className="list">
              {crew.map((g) => (
                <div key={g.role} className="list-item list-static" style={{ padding: 'var(--s1) 0' }}>
                  <span className="xs dim" style={{ width: 130, flexShrink: 0 }}>{CREDIT_ROLE_LABEL[g.role] ?? titleCaseLabel(g.role.replace(/_/g, ' '))}</span>
                  <span className="small">{g.names.join(', ')}</span>
                </div>
              ))}
            </div>
          )}
          {subjects.length > 0 && <p className="xs dim" style={{ marginTop: 'var(--s2)' }}>About: {subjects.map(titleCaseLabel).join(', ')}</p>}
        </div>
        <div>
          <h3 className="small strong">Cast</h3>
          {!ready ? <p className="xs dim">Loading Cast</p> : cast.length === 0 ? <p className="xs dim">No Cast On Record</p> : (
            <div className="list">
              {cast.slice(0, 40).map((c) => (
                <div key={`${c.personQid}|${c.name}`} className="list-item list-static" style={{ padding: 'var(--s1) 0' }}>
                  <span className="small">{c.name}</span>
                  {c.character && <span className="xs dim"> As {c.character}</span>}
                </div>
              ))}
              {cast.length > 40 && <p className="xs dim">And {cast.length - 40} More On Record</p>}
            </div>
          )}
        </div>
      </div>

      {awards.length > 0 && (
        <div style={{ marginTop: 'var(--s3)' }}>
          <h3 className="small strong">Awards On Record</h3>
          <div className="row wrap gap-1">{awards.map((a) => <span key={a} className="chip chip-positive">{titleCaseLabel(a)}</span>)}</div>
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


/**
 * A real logo, from the record, in one fixed frame; a monogram when the record
 * has none. Nothing is drawn by hand to stand in for a real mark.
 */
function Logo({ id, name, large }: { id: string; name: string; large?: boolean }) {
  const [missing, setMissing] = useState(false);
  const width = large ? 160 : 72;
  const height = large ? 80 : 36;
  if (missing) {
    return (
      <div className="chip" style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 600 }} aria-label={`${name}, no logo on record`}>
        {name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')}
      </div>
    );
  }
  return (
    <img
      src={`${import.meta.env.BASE_URL}industry/logos/${id}.png`}
      alt={`${name} logo`}
      width={width}
      height={height}
      style={{ width, height, objectFit: 'contain', flexShrink: 0, background: 'rgba(255,255,255,0.92)', borderRadius: 6, padding: 4, boxSizing: 'border-box' }}
      onError={() => setMissing(true)}
    />
  );
}

function StudioDeals({ studio }: { studio: Studio }) {
  const deals = dealsForStudio(studio.id);
  return (
    <Panel title="Deals With The Networks" subtitle="Where its films go after cinemas, and who shares its parent." flush>
      {deals.length === 0
        ? <Empty title="No Deal On Record" body={`SLATE holds no published output or streaming deal for ${studio.shortName}.`} />
        : (
          <div className="list">
            {deals.map(({ network, deal }) => (
              <div key={`${network.id}|${deal.kind}`} className="list-item list-static">
                <Logo id={network.id} name={network.shortName} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="small strong truncate">{network.name}</div>
                  <div className="xs dim">{deal.note}</div>
                </div>
                {deal.source
                  ? <a className="chip chip-positive" href={deal.source} target="_blank" rel="noreferrer">{DEAL_KIND_LABEL[deal.kind]} · Verified</a>
                  : <span className="chip">{DEAL_KIND_LABEL[deal.kind]} · On Record</span>}
              </div>
            ))}
          </div>
        )}
    </Panel>
  );
}

function NetworkList({ onSelect }: { onSelect: (id: string) => void }) {
  const groups = NETWORK_KIND_ORDER.map((kind) => ({ kind, networks: NETWORKS.all().filter((n) => n.type === kind) })).filter((g) => g.networks.length > 0);
  return (
    <>
      {groups.map(({ kind, networks }) => (
        <Panel key={kind} title={NETWORK_KIND_LABEL[kind]} subtitle={`${networks.length} ${networks.length === 1 ? 'network' : 'networks'}`} flush>
          <div className="list">
            {networks.map((network) => {
              const country = COUNTRIES.get(network.countryId);
              const head = network.leadership[0];
              return (
                <button key={network.id} className="list-item" onClick={() => onSelect(network.id)} style={{ textAlign: 'left' }}>
                  <Logo id={network.id} name={network.shortName} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="small strong truncate">{network.name}</div>
                    <div className="xs dim truncate">{network.parent ? `${network.parent.name} · ` : ''}{network.city}{country ? `, ${country.name}` : ''}{network.founded ? ` · Since ${network.founded}` : ''}</div>
                    <div className="xs dim truncate">{head ? `${head.name}, ${head.title}` : 'Leadership Not On Record'}{network.reach ? ` · ${network.reach.value.toLocaleString('en-US')} ${titleCaseLabel(network.reach.unit)}` : ''}</div>
                  </div>
                  {network.status && <span className="chip chip-warning">In Flux</span>}
                  <span className="chip">{network.deals.length} {network.deals.length === 1 ? 'Deal' : 'Deals'}</span>
                </button>
              );
            })}
          </div>
        </Panel>
      ))}
    </>
  );
}

function NetworkDetail({ network, onBack }: { network: Network; onBack: () => void }) {
  const { sim, refresh } = useGame();
  const loaded = isBroadcastSeriesLoaded();
  useEffect(() => {
    if (loaded) return;
    let cancelled = false;
    loadBroadcastSeries().then(() => { if (!cancelled) refresh(); }).catch(() => {});
    return () => { cancelled = true; };
  }, [loaded, refresh]);
  const worldDay = (() => { const p = zonedParts(sim.now, sim.homeZone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; })();
  const series = useMemo(() => (loaded ? seriesOn(network.broadcasterNames) : []).filter((s) => !s.start || s.start <= worldDay), [loaded, network, worldDay]);
  const inUniverse = useWorld((s) => Object.values(s.universe.projects).filter((p) => p.networkId === network.id));
  const country = COUNTRIES.get(network.countryId);
  const [shown, setShown] = useState(60);

  return (
    <>
      <div className="row gap-2" style={{ marginBottom: 'var(--s3)' }}>
        <button className="btn btn-sm" onClick={onBack}>← All Networks</button>
      </div>
      <div className="page-head" style={{ marginBottom: 'var(--s4)' }}>
        <div className="eyebrow">{NETWORK_KIND_LABEL[network.type]}</div>
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <Logo id={network.id} name={network.shortName} large />
          <h1 style={{ margin: 0 }}>{network.name}</h1>
        </div>
        <p className="muted">{network.parent ? `${network.parent.name}. ` : ''}{network.ownership}. {network.city}{country ? `, ${country.name}` : ''}{network.founded ? `, since ${network.founded}` : ''}.</p>
        <p className="small">{network.description}</p>
        {network.status && <div className="callout callout-warning small">{network.status}</div>}
        {network.parent?.note && !network.status && <div className="callout callout-info small">{network.parent.note}</div>}
      </div>

      <div className="grid grid-2">
        <Panel title="Leadership" subtitle="Who runs it. Verified seats carry the source that confirmed them this year." flush>
          <div className="list">
            {network.leadership.map((leader) => (
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
        <Panel title="What It Commissions" subtitle="SLATE's calibration from the public record.">
          <div className="grid grid-2">
            <Stat label="Reach" value={network.reach ? network.reach.value.toLocaleString('en-US') : 'Not Published'} note={network.reach ? `${titleCaseLabel(network.reach.unit)} · ${network.reach.note}` : undefined} />
            <Stat label="New Series A Year" value={network.slateSize} note="Estimated" />
            <Stat label="Season Budget Band" value={`${formatMoneyCompact(network.budgetFloor)} To ${formatMoneyCompact(network.budgetCeiling)}`} note="Estimated" />
            <Stat label="Formats" value={network.formats.map(formatLabel).join(', ')} />
          </div>
          <div className="small" style={{ marginTop: 'var(--s3)' }}>
            <span className="dim">Wants: </span>{network.wants.map(titleCaseLabel).join(', ')}{network.avoids.length > 0 && <><span className="dim"> · Will not touch: </span>{network.avoids.map(titleCaseLabel).join(', ')}</>}
          </div>
          <div className="xs dim" style={{ marginTop: 'var(--s2)' }}>
            Access {network.accessDifficulty}, risk appetite {network.riskAppetite}, prestige bias {network.prestigeBias} out of 100: SLATE's calibration.
          </div>
        </Panel>
      </div>

      <Panel title="Deals With The Studios" subtitle="Whose films it carries after cinemas, whose series it runs, and who shares its parent." flush>
        {network.deals.length === 0
          ? <Empty title="No Deal On Record" body="SLATE holds no published output or licensing deal for this network." />
          : (
            <div className="list">
              {network.deals.map((deal) => {
                const studio = STUDIOS.get(deal.studioId);
                return (
                  <div key={`${deal.studioId}|${deal.kind}`} className="list-item list-static">
                    <Logo id={deal.studioId} name={studio?.shortName ?? deal.studioId} />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="small strong truncate">{studio?.name ?? deal.studioId}</div>
                      <div className="xs dim">{deal.note}</div>
                    </div>
                    {deal.source
                      ? <a className="chip chip-positive" href={deal.source} target="_blank" rel="noreferrer">{DEAL_KIND_LABEL[deal.kind]} · Verified</a>
                      : <span className="chip">{DEAL_KIND_LABEL[deal.kind]} · On Record</span>}
                  </div>
                );
              })}
            </div>
          )}
      </Panel>

      <Panel title="In Your Universe" subtitle="What it has commissioned since your save began. Simulation, not record." flush>
        {inUniverse.length === 0
          ? <Empty title="Nothing Yet" body={`${network.shortName} has not commissioned or carried anything in your universe so far.`} />
          : (
            <div className="list">
              {inUniverse.slice(0, 30).map((p) => (
                <div key={p.id} className="list-item list-static">
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="small strong truncate">{p.title}</div>
                    <div className="xs dim truncate">{formatLabel(p.format)} · {p.genres.map(titleCaseLabel).join(', ')}{p.budget > 0 ? ` · ${formatMoneyCompact(p.budget)}` : ''}</div>
                  </div>
                  <span className="chip">{titleCaseLabel(p.phase.replace(/_/g, ' '))}</span>
                </div>
              ))}
            </div>
          )}
      </Panel>

      <Panel title="Series On Record" subtitle={loaded ? `${series.length} series the record says aired here, newest first.` : 'Loading the record.'} flush>
        {!loaded ? <Empty title="Loading The Record" body="Pulling every series by broadcaster." /> : series.length === 0 ? <Empty title="No Series On Record" body="The record does not credit this network as the original broadcaster of a series in the catalogue." /> : (
          <div className="table-scroll">
            <table>
              <thead><tr>{['Year', 'Title', 'Kind', 'Genre', 'Seasons', 'Episodes', 'Run', 'RT', 'IMDb', 'Studio'].map((h) => <th key={h} className="nowrap">{h}</th>)}</tr></thead>
              <tbody>
                {series.slice(0, shown).map((s) => (
                  <tr key={s.qid}>
                    <td className="tabular">{s.year ?? ''}</td>
                    <td className="strong nowrap" style={{ minWidth: 200 }}>{s.title}</td>
                    <td className="xs nowrap">{TITLE_KIND_LABEL[s.kind]}</td>
                    <td className="xs nowrap">{s.slateGenres.slice(0, 2).map(titleCaseLabel).join(', ')}</td>
                    <td className="tabular">{s.seasons ?? ''}</td>
                    <td className="tabular">{s.episodes ?? ''}</td>
                    <td className="xs nowrap">{s.start ? `${s.start.slice(0, 4)}${s.end ? ` To ${s.end.slice(0, 4)}` : ' Onwards'}` : ''}</td>
                    <td className="tabular">{s.tomatometer !== undefined ? `${s.tomatometer}%` : ''}</td>
                    <td className="tabular">{s.imdb !== undefined ? s.imdb.toFixed(1) : ''}</td>
                    <td className="xs nowrap">{STUDIOS.get(s.studioId)?.shortName ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {series.length > shown && <div className="center" style={{ padding: 'var(--s3)' }}><button className="btn btn-sm" onClick={() => setShown(shown + 120)}>Show More ({(series.length - shown).toLocaleString('en-US')} Left)</button></div>}
          </div>
        )}
        <p className="xs dim" style={{ padding: 'var(--s2) var(--s4) var(--s3)' }}>Record from Wikidata (CC0), by the original broadcaster it names. Blank means the record has no number.</p>
      </Panel>
    </>
  );
}

/**
 * Asking a studio for one of its franchises. The reading beside the form is
 * the same one the studio makes, minus its own plans, which nobody outside
 * can see: a producer can tell a crown jewel from a library title too.
 */
function LicenceDialog({ studio, franchise, onClose }: { studio: Studio; franchise: FranchiseSummary; onClose: () => void }) {
  const { sim, run } = useGame();
  const name = titleCaseLabel(franchise.name);
  const [kind, setKind] = useState<LicenceKind>('remake');
  const [format, setFormat] = useState<ProjectFormat>('feature');
  const [title, setTitle] = useState('');
  const [holderId, setHolderId] = useState<string>(sim.player.id);
  const [error, setError] = useState<string | null>(null);
  const companies = useWorld((s) => Object.values(s.universe.companies).filter((c) => !c.dissolvedAt && c.ownerships.some((o) => o.holderId === s.player.id && o.percent >= 50)));
  const holderKind = holderId === sim.player.id ? 'person' : 'company';
  const reading = licenceOdds(sim, studio, franchise, kind, format, holderId, holderKind);
  const band = reading.probability >= 0.6 ? 'Likely' : reading.probability >= 0.3 ? 'Possible' : reading.probability >= 0.12 ? 'A Long Shot' : 'Almost Certainly Not';
  const suggested = kind === 'remake' ? name : kind === 'series' ? `${name}: The Series` : `${name}: ${LICENCE_KIND_LABEL[kind]}`;

  const submit = () => {
    const result = run('film.request_ip_licence', { studioId: studio.id, franchiseQid: franchise.qid, kind, format, title: title.trim() || undefined, holderId, holderKind });
    if (result.ok) onClose(); else setError(result.error ?? 'They did not take the meeting.');
  };

  return (
    <Modal
      title={`Ask ${studio.shortName} To License ${name}`}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Ask</button></>}
    >
      <p className="small muted">
        {franchise.titles.length} titles on record{franchise.firstYear ? `, ${franchise.firstYear}${franchise.lastYear && franchise.lastYear !== franchise.firstYear ? ` to ${franchise.lastYear}` : ''}` : ''}{franchise.gross > 0 ? `, ${formatMoneyCompact(franchise.gross * 100)} grossed` : ''}. The studio answers in two to six weeks. If it says yes, the fee is its own, it distributes, and it keeps merchandising.
      </p>
      <div className="field">
        <label htmlFor="licence-kind">What You Want To Make</label>
        <select id="licence-kind" value={kind} onChange={(e) => setKind(e.target.value as LicenceKind)}>
          {LICENCE_KINDS.map((k) => <option key={k} value={k}>{LICENCE_KIND_LABEL[k]}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="licence-format">Format</label>
        <select id="licence-format" value={format} onChange={(e) => setFormat(e.target.value as ProjectFormat)}>
          <option value="feature">Feature</option>
          <option value="series">Series</option>
          <option value="limited_series">Limited Series</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="licence-title">Title</label>
        <input id="licence-title" type="text" value={title} placeholder={suggested} onChange={(e) => setTitle(e.target.value)} />
        <div className="xs dim">A licensed title may reuse a name from {name} itself, and no other.</div>
      </div>
      {companies.length > 0 && (
        <div className="field">
          <label htmlFor="licence-holder">In Whose Name</label>
          <select id="licence-holder" value={holderId} onChange={(e) => setHolderId(e.target.value)}>
            <option value={sim.player.id}>{sim.player.firstName} {sim.player.lastName}</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      <div className="callout">
        <div className="row-between">
          <span className="strong small">How It Reads: {band}</span>
          <span className="small">Fee If They Say Yes: {formatMoneyCompact(reading.fee)}</span>
        </div>
        <ul className="small" style={{ margin: 'var(--s2) 0 0', paddingLeft: 'var(--s4)' }}>
          {reading.factors.filter((f) => f.knowable).map((f) => <li key={f.label}><span className="strong">{f.label}.</span> {f.detail}</li>)}
        </ul>
        <div className="xs dim" style={{ marginTop: 'var(--s2)' }}>What {studio.shortName} already has in development on it is not public.</div>
      </div>
      {error && <div className="callout callout-warning small">{error}</div>}
    </Modal>
  );
}
