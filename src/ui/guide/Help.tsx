/**
 * SLATE — the guide's reference on screen (from 2026-10-12; `content/guide/`).
 *
 * The chapters are the onboarding (`Guide.tsx`). This is the rest: an entry for every feature, opened from How This
 * Works beside it, from ? (the contents, by what the player is trying to do) or / (search) anywhere, or from an
 * address (`#/workspace/school?help=school.partners`), so an entry can be linked to. Inside, every entry links to the
 * entries it's connected to, a trail of breadcrumbs goes back along the way it came, and Back goes back one.
 *
 * What it doesn't do is as much the point. It runs no command and writes nothing to the save. The live clock holds
 * while it's open (`hold`), so reading moves no time. It opens over the screen, which stays mounted with its tab and
 * whatever was typed in it, and closing it gives focus back to the control that opened it. Show Me Where is the one
 * thing in it that moves the player: it goes to the entry's screen and tab, and Back To Help returns to the trail.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Modal, dialogOpen } from '@/ui/components/primitives';
import { GOALS, GUIDE_BY_ID, connectionsTo, entriesOf, entryFor, search, type ConnectionKind, type Fact, type GuideEntry } from '@/engine/content/guide';
import { CHAPTERS } from '@/engine/content/tutorial';
import { chapterFor, chaptersRead, guided, isOpen } from '@/engine/world/tutorial';
import { HelpContext, type HelpApi } from './help-context';
import { useGuide } from './Guide';

type Page = { kind: 'contents' } | { kind: 'search'; q: string } | { kind: 'entry'; id: string };

const pageLabel = (p: Page): string => (p.kind === 'contents' ? 'Contents' : p.kind === 'search' ? (p.q ? `Search: ${p.q}` : 'Search') : GUIDE_BY_ID[p.id]?.title ?? p.id);

/** Each kind of connection, as a heading, in the order a player meets them. */
export const CONNECTION_HEADING: Readonly<Record<ConnectionKind, string>> = {
  prerequisite: 'Needs First',
  immediate: 'Changes At Once',
  scheduled: 'Changes Later, On The Clock',
  evaluation: 'Read When Work Is Judged',
  history: 'Kept In The Record',
  optional: 'Worth Doing With It',
};
const KIND_ORDER: readonly ConnectionKind[] = ['prerequisite', 'immediate', 'scheduled', 'evaluation', 'history', 'optional'];

/** The address's help entry, if it names one. */
function helpInAddress(): string | undefined {
  const q = window.location.hash.split('?')[1];
  const id = q ? new URLSearchParams(q).get('help') : null;
  return id && entryFor(id) ? entryFor(id)!.id : undefined;
}

function writeAddress(route: string, entry?: string): void {
  try { window.history.replaceState(window.history.state, '', `#${route}${entry ? `?help=${encodeURIComponent(entry)}` : ''}`); } catch { /* no address to keep */ }
}

export function HelpProvider({ children }: { children: ReactNode }) {
  const { route, hold, navigate } = useGame();
  const [trail, setTrail] = useState<Page[] | null>(() => {
    const id = helpInAddress();
    return id ? [{ kind: 'contents' }, { kind: 'entry', id }] : null;
  });
  // The trail left by Show Me Where, for Back To Help.
  const [left, setLeft] = useState<Page[] | null>(null);
  const routeRef = useRef(route);
  routeRef.current = route;

  const open = useCallback<HelpApi['open']>((id) => {
    const entry = id ? entryFor(id) : undefined;
    setLeft(null);
    setTrail((t) => {
      const base = t ?? [{ kind: 'contents' } as Page];
      if (!entry) return t ? t : base;
      const top = base[base.length - 1];
      return top?.kind === 'entry' && top.id === entry.id ? base : [...base, { kind: 'entry', id: entry.id }];
    });
  }, []);
  const find = useCallback<HelpApi['find']>((words = '') => {
    setLeft(null);
    setTrail((t) => [...(t ?? [{ kind: 'contents' } as Page]), { kind: 'search', q: words }]);
  }, []);
  const api = useMemo<HelpApi>(() => ({ open, find }), [open, find]);

  const showing = trail !== null;
  // The clock holds while the reference is open.
  useEffect(() => { hold('help', showing); return () => hold('help', false); }, [hold, showing]);
  // The address names the entry on top, so it can be copied or reloaded; closed, it's the screen's own again.
  const top = trail?.[trail.length - 1];
  useEffect(() => { writeAddress(routeRef.current, top?.kind === 'entry' ? top.id : undefined); }, [top]);

  // ? for the contents, / to search, anywhere but a text box, and not behind another dialog.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey || dialogOpen()) return;
      if (event.key === '?') { event.preventDefault(); open(); }
      else if (event.key === '/') { event.preventDefault(); find(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, find]);

  const close = useCallback(() => setTrail(null), []);
  const goWhere = useCallback((e: GuideEntry) => {
    setLeft(trail);
    setTrail(null);
    navigate(`${e.where.route}${e.where.tab ? `?tab=${e.where.tab}` : ''}`);
  }, [navigate, trail]);

  return (
    <HelpContext.Provider value={api}>
      {children}
      {trail && <HelpDialog trail={trail} setTrail={setTrail} onClose={close} onWhere={goWhere} />}
      {!trail && left && (
        <div className="help-return" role="status">
          <button type="button" className="btn btn-sm btn-primary" onClick={() => { setTrail(left); setLeft(null); }}>Back To Help</button>
          <button type="button" className="btn btn-sm btn-ghost" aria-label="Dismiss Back To Help" onClick={() => setLeft(null)}>✕</button>
        </div>
      )}
    </HelpContext.Provider>
  );
}

function HelpDialog({ trail, setTrail, onClose, onWhere }: {
  trail: Page[]; setTrail: (t: Page[]) => void; onClose: () => void; onWhere: (e: GuideEntry) => void;
}) {
  const page = trail[trail.length - 1]!;
  const push = (p: Page) => setTrail([...trail, p]);
  const back = () => { if (trail.length > 1) setTrail(trail.slice(0, -1)); };
  const [q, setQ] = useState(page.kind === 'search' ? page.q : '');
  useEffect(() => { if (page.kind === 'search') setQ(page.q); }, [page]);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => { body.current?.scrollTo?.({ top: 0 }); }, [page]);

  const submit = (words: string) => {
    if (page.kind === 'search') setTrail([...trail.slice(0, -1), { kind: 'search', q: words }]);
    else push({ kind: 'search', q: words });
  };

  const footer = (
    <>
      <span className="xs dim grow" data-clock-held="">The clock waits while you read.</span>
      {trail.length > 1 && <button type="button" className="btn" onClick={back}>Back</button>}
      <button type="button" className="btn btn-primary" onClick={onClose}>Close</button>
    </>
  );

  return (
    <Modal title="How This Works" onClose={onClose} wide footer={footer}>
      <div className="help" ref={body}>
        <nav className="breadcrumbs help-trail" aria-label="Help Trail">
          {trail.map((p, i) => (
            <span key={`${i}-${pageLabel(p)}`} className="row gap-2">
              {i > 0 && <span aria-hidden="true">›</span>}
              {i === trail.length - 1
                ? <span className="muted" aria-current="page">{pageLabel(p)}</span>
                : <button type="button" onClick={() => setTrail(trail.slice(0, i + 1))}>{pageLabel(p)}</button>}
            </span>
          ))}
        </nav>
        <form className="help-search" role="search" onSubmit={(e) => { e.preventDefault(); submit(q); }}>
          <label className="xs dim" htmlFor="help-q">Search The Guide</label>
          <div className="row gap-2">
            <input
              id="help-q"
              className="input grow"
              type="search"
              value={q}
              placeholder="A feature, a word, or a question"
              data-autofocus={page.kind === 'search' ? true : undefined}
              onChange={(e) => { setQ(e.target.value); if (page.kind === 'search') setTrail([...trail.slice(0, -1), { kind: 'search', q: e.target.value }]); }}
            />
            <button type="submit" className="btn btn-sm">Search</button>
          </div>
        </form>
        {page.kind === 'contents' && <Contents onOpen={(id) => push({ kind: 'entry', id })} />}
        {page.kind === 'search' && <Results q={page.q} onOpen={(id) => push({ kind: 'entry', id })} />}
        {page.kind === 'entry' && GUIDE_BY_ID[page.id] && <Entry e={GUIDE_BY_ID[page.id]!} onOpen={(id) => push({ kind: 'entry', id })} onWhere={onWhere} />}
      </div>
    </Modal>
  );
}

function Contents({ onOpen }: { onOpen: (id: string) => void }) {
  const guide = useGuide();
  const isGuided = useWorld((s) => guided(s));
  const read = useWorld((s) => chaptersRead(s).filter((id) => CHAPTERS.some((c) => c.id === id)).length);
  return (
    <div className="col gap-4">
      <div className="callout small">
        <strong>The Guide’s Chapters.</strong>{' '}
        {isGuided ? `${read} of ${CHAPTERS.length} read: each opens a part of the game.` : 'Every part of the game is open on this life; the chapters are there to read in any order.'}{' '}
        <button type="button" className="btn btn-sm" onClick={() => guide.show()}>Open The Guide</button>
      </div>
      {GOALS.map((g) => {
        const entries = entriesOf(g.id);
        if (!entries.length) return null;
        return (
          <section key={g.id} aria-labelledby={`goal-${g.id}`}>
            <h3 id={`goal-${g.id}`} style={{ margin: '0 0 var(--s1)' }}>{g.title}</h3>
            <p className="xs dim" style={{ margin: '0 0 var(--s2)' }}>{g.lead}</p>
            <ul className="help-list">
              {entries.map((e) => (
                <li key={e.id}><button type="button" className="help-link" onClick={() => onOpen(e.id)}>{e.title}</button></li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Results({ q, onOpen }: { q: string; onOpen: (id: string) => void }) {
  const found = useMemo(() => search(q), [q]);
  if (!q.trim()) return <p className="small muted">Type a feature’s name, a word for it, or a question, such as “why is my rehearsal refused”.</p>;
  if (!found.length) return <p className="small muted">Nothing matches “{q}”. Try fewer words, or the contents.</p>;
  return (
    <ul className="help-results" aria-label={`${found.length} Found`}>
      {found.map((e) => (
        <li key={e.id}>
          <button type="button" className="help-link strong" onClick={() => onOpen(e.id)}>{e.title}</button>
          <p className="xs dim" style={{ margin: 0 }}>{e.short.length > 180 ? `${e.short.slice(0, 177)}…` : e.short}</p>
        </li>
      ))}
    </ul>
  );
}

function Facts({ facts }: { facts: readonly Fact[] }) {
  return (
    <dl className="help-facts small">
      {facts.map((f) => (
        <div key={f.label}><dt>{f.label}</dt><dd>{f.value}{f.estimate ? <span className="xs dim"> (an estimate)</span> : null}</dd></div>
      ))}
    </dl>
  );
}

function List({ items }: { items: readonly string[] }) {
  return <ul className="small help-items">{items.map((x) => <li key={x}>{x}</li>)}</ul>;
}

function Entry({ e, onOpen, onWhere }: { e: GuideEntry; onOpen: (id: string) => void; onWhere: (e: GuideEntry) => void }) {
  const guide = useGuide();
  const [all, setAll] = useState(false);
  // Locked for this life: the first of its features whose chapter isn't read.
  const locked = useWorld((s) => e.covers.find((f) => !isOpen(s, f)), [e]);
  const chapter = locked ? chapterFor(locked) : undefined;
  const leads = useMemo(() => connectionsTo(e.id), [e]);
  const sections: { title: string; show: boolean; body: ReactNode }[] = [
    { title: 'Steps', show: e.steps.length > 0, body: <ol className="small help-items">{e.steps.map((x) => <li key={x}>{x}</li>)}</ol> },
    { title: 'What It Needs', show: e.needs.length > 0, body: <List items={e.needs} /> },
    { title: 'Time And Money', show: e.costs.length > 0, body: <Facts facts={e.costs} /> },
    { title: 'What The Game Reads', show: e.reads.length > 0, body: <Facts facts={e.reads} /> },
    { title: 'What Changes At Once', show: e.now.length > 0, body: <List items={e.now} /> },
    { title: 'What Changes Later', show: e.later.length > 0, body: <List items={e.later} /> },
    { title: 'Reading The Result', show: e.interpret.length > 0, body: <List items={e.interpret} /> },
    { title: 'Why It Might Not Be Available', show: e.unavailable.length > 0, body: <List items={e.unavailable} /> },
    { title: 'Mistakes, And Putting Them Right', show: e.mistakes.length > 0, body: <List items={e.mistakes} /> },
    {
      title: 'Connected Systems', show: e.connections.length + leads.length > 0, body: (
        <div className="col gap-3">
          {KIND_ORDER.map((k) => {
            const cs = e.connections.filter((c) => c.kind === k);
            if (!cs.length) return null;
            return (
              <div key={k}>
                <div className="eyebrow">{CONNECTION_HEADING[k]}</div>
                <ul className="small help-items">
                  {cs.map((c) => (
                    <li key={c.to + c.why}>
                      <span className="dim">{e.title} → </span>
                      <button type="button" className="help-link" onClick={() => onOpen(c.to)}>{GUIDE_BY_ID[c.to]?.title ?? c.to}</button>: {c.why}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {leads.length > 0 && (
            <div>
              <div className="eyebrow">What Leads Here</div>
              <ul className="small help-items">
                {leads.map(({ from, connection }) => (
                  <li key={from.id + connection.why}>
                    <button type="button" className="help-link" onClick={() => onOpen(from.id)}>{from.title}</button>
                    <span className="dim"> → {e.title}</span>: {connection.why}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'A Worked Example', show: true, body: (
        <div className="small">
          <p style={{ margin: '0 0 var(--s2)' }}>{e.example.setup}</p>
          <ol className="help-items">{e.example.steps.map((x) => <li key={x}>{x}</li>)}</ol>
          <p style={{ margin: 'var(--s2) 0 0' }}><strong>What comes of it.</strong> {e.example.result}</p>
        </div>
      ),
    },
  ];
  return (
    <article className="help-entry" aria-labelledby={`entry-${e.id}`}>
      <div className="row-between" style={{ alignItems: 'baseline' }}>
        <h3 id={`entry-${e.id}`} style={{ margin: 0 }}>{e.title}</h3>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAll((x) => !x)} aria-pressed={all}>{all ? 'Fold It Up' : 'Show Everything'}</button>
      </div>
      <p className="xs dim" style={{ margin: 'var(--s1) 0 var(--s3)' }}>
        {e.where.label}. {e.available}
      </p>
      {chapter && (
        <div className="callout callout-warning small" style={{ marginBottom: 'var(--s3)' }}>
          Not open on this life yet: “{chapter.title}” in the guide opens it.{' '}
          <button type="button" className="btn btn-sm" onClick={() => guide.show(chapter.id)}>Read About It</button>
        </div>
      )}
      <p className="help-short">{e.short}</p>
      <div className="row gap-2" style={{ margin: 'var(--s2) 0 var(--s4)' }}>
        <button type="button" className="btn btn-sm" onClick={() => onWhere(e)}>Show Me Where</button>
      </div>
      {sections.filter((s) => s.show).map((s) => (
        <details key={`${s.title}-${all}`} className="help-section" open={all || undefined}>
          <summary>{s.title}</summary>
          <div className="help-section-body">{s.body}</div>
        </details>
      ))}
      {e.related.length > 0 && (
        <div className="help-related">
          <div className="eyebrow">Read With It</div>
          <ul className="help-list">
            {e.related.filter((r) => GUIDE_BY_ID[r]).map((r) => <li key={r}><button type="button" className="help-link" onClick={() => onOpen(r)}>{GUIDE_BY_ID[r]!.title}</button></li>)}
          </ul>
        </div>
      )}
    </article>
  );
}
