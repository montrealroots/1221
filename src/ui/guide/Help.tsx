/**
 * SLATE — the guide's reference on screen (from 2026-10-12; `content/guide/`).
 *
 * The chapters are the onboarding (`Guide.tsx`). This is the rest: an entry for every feature, opened from How This
 * Works beside it, from ? (the contents, by what the player is trying to do) or / (search) anywhere, or from an
 * address (`#/workspace/school?help=coursework.partners`), so an entry can be linked to. Until 2026-10-13 that example
 * named `school.partners`, which is no entry and covers no feature, so its link opened nothing. Inside, every entry
 * links to the entries it's connected to, a trail of breadcrumbs goes back along the way it came, and Back goes back one.
 *
 * What it doesn't do is as much the point. It runs no command and writes nothing to the save. The live clock holds
 * while it's open (`hold`), so reading moves no time. It opens over the screen, which stays mounted with its tab and
 * whatever was typed in it, and closing it gives focus back to the control that opened it. Until 2026-10-13 that wasn’t
 * so for the top bar’s Advance and Look After Yourself menus: the first press in the help, or Escape, closed the menu
 * under it, and the How This Works it was opened from went with it, so focus fell to the page (`useDropdown`,
 * `ui/shell/TimeControls.tsx`). Show Me Where is the one thing in it that moves the player: it goes to the entry's
 * screen and tab, and Back To Help returns to the trail. `tests/help-mechanics.test.ts` presses each of them.
 *
 * From 2026-10-17 (the owner's brief 14): an entry reads in the order of the brief's eight questions, what it's for,
 * where to find it, what to press, what you need first, what happens, how it connects, what to do next and what if you
 * can't, with what decides it and the worked example last. Until then its sections ran Steps, What It Needs, Time And
 * Money, What The Game Reads, then what changed, with Connected Systems near the end and nothing on what to do next.
 * Show Me Where leaves a way back to the screen and tab the player was on as well as to the help, and the contents open
 * with the entries for the screen the help was opened on, each marked Locked where its chapter isn't read.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Modal, dialogOpen } from '@/ui/components/primitives';
import { GOALS, GUIDE_BY_ID, SEARCH_EXAMPLES, connectionsTo, entriesOf, entryFor, search, type ConnectionKind, type Fact, type GuideEntry } from '@/engine/content/guide';
import { CHAPTERS } from '@/engine/content/tutorial';
import { chapterFor, chaptersRead, guided, isOpen } from '@/engine/world/tutorial';
import { kept } from '@/ui/kept';
import { ALL_DESTINATIONS } from '@/ui/shell/destinations';
import { SECTIONS, tabKey } from '@/ui/shell/sections';
import { HelpContext, type HelpApi } from './help-context';
import { useGuide } from './Guide';

type Page = { kind: 'contents' } | { kind: 'search'; q: string } | { kind: 'entry'; id: string };

const pageLabel = (p: Page): string => (p.kind === 'contents' ? 'Contents' : p.kind === 'search' ? (p.q ? `Search: ${p.q}` : 'Search') : GUIDE_BY_ID[p.id]?.title ?? p.id);

/** Each kind of connection, as a heading under How It Connects, in the order a player meets them. */
export const CONNECTION_HEADING: Readonly<Record<ConnectionKind, string>> = {
  prerequisite: 'Comes First',
  immediate: 'Changes Straight Away',
  scheduled: 'Changes Later',
  evaluation: 'Counts Toward',
  history: 'Kept In Your Record',
  optional: 'Worth Doing With It',
};
const KIND_ORDER: readonly ConnectionKind[] = ['prerequisite', 'immediate', 'scheduled', 'evaluation', 'history', 'optional'];

/** The screen the address names, as `writeAddress` reads it: Home when it names none. */
function screenInAddress(): string {
  const hash = typeof window === 'undefined' ? '' : window.location?.hash ?? '';
  return hash.startsWith('#/') ? hash.slice(1).split('?')[0]! : '/home';
}

/** A screen's name, as the rail and Home name it. */
const SCREEN_NAME: Readonly<Record<string, string>> = Object.fromEntries([['/home', 'Home'], ...ALL_DESTINATIONS.map((d) => [d.route, d.label])]);
const screenName = (route: string): string => SCREEN_NAME[route] ?? 'The Last Screen';

/** Where the player stood when Show Me Where moved them: the screen, and the tab it had showing. */
interface Place { route: string; tab?: string }

/** The address's help entry, if it names one. */
function helpInAddress(): string | undefined {
  const q = window.location.hash.split('?')[1];
  const id = q ? new URLSearchParams(q).get('help') : null;
  return id && entryFor(id) ? entryFor(id)!.id : undefined;
}

/**
 * The address with its help entry set, or taken out: the screen and anything else in it are kept as they are.
 *
 * Until 2026-10-13 it wrote the screen the provider held instead, which on a page’s first commit is still Home: React
 * runs a child’s effects before its parent’s, so this one ran before `GameProvider` had read the address, and a reload
 * or a link to `#/workspace/school` was rewritten to `#/home` and opened Home, with any entry it named open over it
 * (found by the guide audit of that day). The address is the screen’s own by the time the trail changes after that:
 * `navigate` pushes it before this runs, so Show Me Where and Back To Help write the screen they arrive at.
 */
function writeAddress(entry?: string): void {
  const [path, query] = (window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : '/home').split('?') as [string, string | undefined];
  const params = new URLSearchParams(query ?? '');
  if (entry) params.set('help', entry);
  else params.delete('help');
  const rest = params.toString();
  try { window.history.replaceState(window.history.state, '', `#${path}${rest ? `?${rest}` : ''}`); } catch { /* no address to keep */ }
}

export function HelpProvider({ children }: { children: ReactNode }) {
  const { hold, navigate } = useGame();
  const [trail, setTrail] = useState<Page[] | null>(() => {
    const id = helpInAddress();
    return id ? [{ kind: 'contents' }, { kind: 'entry', id }] : null;
  });
  // The trail left by Show Me Where, for Back To Help, and the place it was pressed from, for the way back there.
  const [left, setLeft] = useState<Page[] | null>(null);
  const [from, setFrom] = useState<Place | null>(null);

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
  useEffect(() => { writeAddress(top?.kind === 'entry' ? top.id : undefined); }, [top]);

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
    const here = screenInAddress();
    const tab = kept<string>(tabKey(here));
    setLeft(trail);
    // Gone somewhere else, the way back is offered; to the place the player already stood, it isn't.
    setFrom(here === e.where.route && (!e.where.tab || e.where.tab === (tab ?? SECTIONS[here]?.[0]?.id)) ? null : { route: here, tab });
    setTrail(null);
    navigate(`${e.where.route}${e.where.tab ? `?tab=${e.where.tab}` : ''}`);
  }, [navigate, trail]);
  const goBack = useCallback((place: Place) => {
    setLeft(null);
    setFrom(null);
    navigate(`${place.route}${place.tab ? `?tab=${place.tab}` : ''}`, screenName(place.route));
  }, [navigate]);

  return (
    <HelpContext.Provider value={api}>
      {children}
      {trail && <HelpDialog trail={trail} setTrail={setTrail} onClose={close} onWhere={goWhere} />}
      {!trail && left && (
        <div className="help-return" role="status">
          <button type="button" className="btn btn-sm btn-primary" onClick={() => { setTrail(left); setLeft(null); setFrom(null); }}>Back To Help</button>
          {from && <button type="button" className="btn btn-sm" onClick={() => goBack(from)}>Back To {screenName(from.route)}</button>}
          <button type="button" className="btn btn-sm btn-ghost" aria-label="Dismiss Back To Help" onClick={() => { setLeft(null); setFrom(null); }}>✕</button>
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
          <label className="xs dim" htmlFor="help-q">Search How This Works</label>
          <div className="row gap-2">
            <input
              id="help-q"
              className="input grow"
              type="search"
              value={q}
              placeholder="A feature, a word or a question"
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

/** Whether every feature an entry covers is still shut on this life. */
const shutOn = (s: Parameters<typeof isOpen>[0], e: GuideEntry): boolean => e.covers.length > 0 && e.covers.every((f) => !isOpen(s, f));

/** An entry's place in a list: its title, and Locked while its chapter isn't read. */
function EntryLink({ e, onOpen, strong }: { e: GuideEntry; onOpen: (id: string) => void; strong?: boolean }) {
  const shut = useWorld((s) => shutOn(s, e), [e]);
  return (
    <>
      <button type="button" className={`help-link${strong ? ' strong' : ''}`} onClick={() => onOpen(e.id)}>{e.title}</button>
      {shut && <span className="xs dim"> Locked</span>}
    </>
  );
}

/**
 * The entries for the screen the help was opened over, and its showing tab: an entry with a tab shows on that tab
 * only, one without on any tab of its screen (from 2026-10-17). Until then ? opened the contents at Getting Started,
 * whichever screen it was pressed on.
 */
function onThisScreen(): { title: string; entries: GuideEntry[] } {
  const route = screenInAddress();
  const tab = kept<string>(tabKey(route)) ?? SECTIONS[route]?.[0]?.id;
  const tabName = SECTIONS[route]?.find((x) => x.id === tab)?.label;
  const entries = GOALS.flatMap((g) => entriesOf(g.id)).filter((e) => e.where.route === route && (!e.where.tab || e.where.tab === tab));
  return { title: tabName ? `${screenName(route)}, ${tabName}` : screenName(route), entries };
}

/** Until 2026-10-17 the hint's example was “why is my rehearsal refused”, which found nothing. */
const HINT = `Type a feature’s name, a word for it or a question, such as ${SEARCH_EXAMPLES.map((x) => `“${x}”`).join(' or ')}.`;

function Contents({ onOpen }: { onOpen: (id: string) => void }) {
  const guide = useGuide();
  // A guide finished is counted as no guide, whatever chapters came after it (from 2026-10-13, as the top bar’s Guide
  // button was that day): until then it read “15 of 17 read: each opens a part of the game.” on a guide finished
  // before two chapters were added, though they open nothing there and the guide offers no way to mark them read.
  const isGuided = useWorld((s) => guided(s) && !s.universe.tutorial?.finished);
  const read = useWorld((s) => chaptersRead(s).filter((id) => CHAPTERS.some((c) => c.id === id)).length);
  const onScreen = useMemo(onThisScreen, []);
  const said = !isGuided
    ? 'Everything is open on this life. The chapters are there to read in any order.'
    : read === 0
      ? `You haven’t read any of its ${CHAPTERS.length} chapters yet. Each one you read opens a part of the game.`
      : `You’ve read ${read} of its ${CHAPTERS.length} chapters. Each one you read opens a part of the game.`;
  return (
    <div className="col gap-4">
      <div className="callout small">
        <strong>The Guide.</strong>{' '}{said}{' '}
        <button type="button" className="btn btn-sm" onClick={() => guide.show()}>Open The Guide</button>
      </div>
      {onScreen.entries.length > 0 && (
        <section aria-labelledby="goal-here">
          <h3 id="goal-here" style={{ margin: '0 0 var(--s1)' }}>On This Screen</h3>
          <p className="xs dim" style={{ margin: '0 0 var(--s2)' }}>{onScreen.title}: what you can do here.</p>
          <ul className="help-list">
            {onScreen.entries.map((e) => <li key={e.id}><EntryLink e={e} onOpen={onOpen} /></li>)}
          </ul>
        </section>
      )}
      {GOALS.map((g) => {
        const entries = entriesOf(g.id);
        if (!entries.length) return null;
        return (
          <section key={g.id} aria-labelledby={`goal-${g.id}`}>
            <h3 id={`goal-${g.id}`} style={{ margin: '0 0 var(--s1)' }}>{g.title}</h3>
            <p className="xs dim" style={{ margin: '0 0 var(--s2)' }}>{g.lead}</p>
            <ul className="help-list">
              {entries.map((e) => <li key={e.id}><EntryLink e={e} onOpen={onOpen} /></li>)}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Results({ q, onOpen }: { q: string; onOpen: (id: string) => void }) {
  const found = useMemo(() => search(q), [q]);
  if (!q.trim()) return <p className="small muted">{HINT}</p>;
  if (!found.length) return <p className="small muted">Nothing matches “{q}”. Try fewer or different words, or go back to Contents.</p>;
  return (
    <ul className="help-results" aria-label={`${found.length} ${found.length === 1 ? 'Result' : 'Results'}`}>
      {found.map((e) => (
        <li key={e.id}>
          <EntryLink e={e} onOpen={onOpen} strong />
          <p className="xs dim" style={{ margin: 0 }}>{e.short.length > 180 ? `${e.short.slice(0, 177)}…` : e.short}</p>
        </li>
      ))}
    </ul>
  );
}

/** Figures, each with its name; one the game had to estimate says so. */
function Facts({ facts }: { facts: readonly Fact[] }) {
  return (
    <dl className="help-facts small">
      {facts.map((f) => (
        <div key={f.label}><dt>{f.label}</dt><dd>{f.value}{f.estimate ? <span className="xs dim"> (estimated)</span> : null}</dd></div>
      ))}
    </dl>
  );
}

function List({ items }: { items: readonly string[] }) {
  return <ul className="small help-items">{items.map((x) => <li key={x}>{x}</li>)}</ul>;
}

/** A part of a section under its own small heading, drawn only when it has something in it. */
function Part({ title, show = true, children }: { title?: string; show?: boolean; children: ReactNode }) {
  if (!show) return null;
  return <div>{title && <div className="eyebrow" style={{ marginBottom: 'var(--s1)' }}>{title}</div>}{children}</div>;
}

function Entry({ e, onOpen, onWhere }: { e: GuideEntry; onOpen: (id: string) => void; onWhere: (e: GuideEntry) => void }) {
  const guide = useGuide();
  const [all, setAll] = useState(false);
  // Locked for this life: the first of its features whose chapter isn't read.
  const locked = useWorld((s) => e.covers.find((f) => !isOpen(s, f)), [e]);
  const chapter = locked ? chapterFor(locked) : undefined;
  const leads = useMemo(() => connectionsTo(e.id), [e]);
  // The brief's eight questions, in its order, then the deeper parts. The first two, what it's for and where to find it,
  // are always showing; what to press opens with the entry; the rest open when pressed, or all with Show Everything.
  const sections: { title: string; show: boolean; open?: boolean; body: ReactNode }[] = [
    { title: 'What To Press', show: e.steps.length > 0, open: true, body: <ol className="small help-items">{e.steps.map((x) => <li key={x}>{x}</li>)}</ol> },
    {
      title: 'What You Need First', show: e.needs.length + e.costs.length > 0, body: (
        <div className="col gap-3">
          <Part show={e.needs.length > 0}><List items={e.needs} /></Part>
          <Part title="Time And Money" show={e.costs.length > 0}><Facts facts={e.costs} /></Part>
        </div>
      ),
    },
    {
      title: 'What Happens', show: e.now.length + e.later.length + e.interpret.length > 0, body: (
        <div className="col gap-3">
          <Part title="Straight Away" show={e.now.length > 0}><List items={e.now} /></Part>
          <Part title="Later On" show={e.later.length > 0}><List items={e.later} /></Part>
          <Part title="Reading The Result" show={e.interpret.length > 0}><List items={e.interpret} /></Part>
        </div>
      ),
    },
    {
      title: 'How It Connects', show: e.connections.length + leads.length > 0, body: (
        <div className="col gap-3">
          {KIND_ORDER.map((k) => {
            const cs = e.connections.filter((c) => c.kind === k);
            if (!cs.length) return null;
            return (
              <Part key={k} title={CONNECTION_HEADING[k]}>
                <ul className="small help-items">
                  {cs.map((c) => (
                    <li key={c.to + c.why}>
                      <button type="button" className="help-link" onClick={() => onOpen(c.to)}>{GUIDE_BY_ID[c.to]?.title ?? c.to}</button>: {c.why}
                    </li>
                  ))}
                </ul>
              </Part>
            );
          })}
          <Part title="What Leads Here" show={leads.length > 0}>
            <ul className="small help-items">
              {leads.map(({ from, connection }) => (
                <li key={from.id + connection.why}>
                  <button type="button" className="help-link" onClick={() => onOpen(from.id)}>{from.title}</button>: {connection.why}
                </li>
              ))}
            </ul>
          </Part>
        </div>
      ),
    },
    { title: 'What To Do Next', show: e.next.length > 0, body: <List items={e.next} /> },
    {
      title: 'If You Can’t', show: e.unavailable.length + e.mistakes.length > 0, body: (
        <div className="col gap-3">
          <Part show={e.unavailable.length > 0}><List items={e.unavailable} /></Part>
          <Part title="Mistakes, And Putting Them Right" show={e.mistakes.length > 0}><List items={e.mistakes} /></Part>
        </div>
      ),
    },
    { title: 'What Decides It', show: e.reads.length > 0, body: <Facts facts={e.reads} /> },
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
      {chapter && (
        <div className="callout callout-warning small" style={{ margin: 'var(--s2) 0 var(--s3)' }}>
          This isn’t open yet. Reading “{chapter.title}” in the guide opens it.{' '}
          <button type="button" className="btn btn-sm" onClick={() => guide.show(chapter.id)}>Read About It</button>
        </div>
      )}
      <p className="help-short" style={{ marginTop: 'var(--s2)' }}>{e.short}</p>
      <dl className="help-where xs">
        <div><dt>Where To Find It</dt><dd>{e.where.label}.</dd></div>
        <div><dt>When You Can Use It</dt><dd>{e.available}</dd></div>
      </dl>
      <div className="row gap-2" style={{ margin: 'var(--s2) 0 var(--s4)' }}>
        <button type="button" className="btn btn-sm" onClick={() => onWhere(e)}>Show Me Where</button>
      </div>
      {sections.filter((s) => s.show).map((s) => (
        <details key={`${s.title}-${all}`} className="help-section" open={all || s.open || undefined}>
          <summary>{s.title}</summary>
          <div className="help-section-body">{s.body}</div>
        </details>
      ))}
      {e.related.length > 0 && (
        <div className="help-related">
          <div className="eyebrow">Read With It</div>
          <ul className="help-list">
            {e.related.filter((r) => GUIDE_BY_ID[r]).map((r) => <li key={r}><EntryLink e={GUIDE_BY_ID[r]!} onOpen={onOpen} /></li>)}
          </ul>
        </div>
      )}
    </article>
  );
}
