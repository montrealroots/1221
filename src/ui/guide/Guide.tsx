/**
 * SLATE — the guide on screen.
 *
 * A new life starts with everything shut but the guide, which opens on the
 * first chapter by itself. Each chapter says what one part of the game does,
 * and "I’ve Read It" opens it: the buttons wake, the panels on Home fill in,
 * and the underlined words start opening. Then the guide says what opened
 * and offers the next chapter, or the chance to try what just opened first.
 *
 * A locked control still shows, so the life ahead is visible; pressed, it
 * opens the guide at the chapter that opens it. The engine refuses the
 * command behind it as well (`world/tutorial.ts`), so the lock isn’t only
 * paint.
 *
 * Words only, as the rail is: a locked thing says Locked, not a padlock.
 *
 * From 2026-10-12 every chapter can be opened and read at any time, and only the next one can be marked read, so a
 * player can see what a later part of the game does before getting there; until then the later chapters were shut in
 * the contents. The clock holds while the guide is open. The counts count only the chapters there are now: a save
 * from before the chapters were cut to these seventeen still holds the old ones' ids.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Modal } from '@/ui/components/primitives';
import { CHAPTERS, CHAPTER_BY_ID } from '@/engine/content/tutorial';
import { READ_KIND, chapterFor, chaptersRead, guided, isOpen, lockedBecause, nextChapter } from '@/engine/world/tutorial';

interface GuideApi {
  /** Opens the guide, at a chapter or at the next one. */
  show: (chapterId?: string) => void;
}

const GuideContext = createContext<GuideApi>({ show: () => {} });

export function useGuide(): GuideApi {
  return useContext(GuideContext);
}

/** Whether a part of the game is open, and what to say while it isn’t. */
export function useFeature(feature: string): { open: boolean; reason?: string; ask: () => void } {
  const guide = useGuide();
  const open = useWorld((s) => isOpen(s, feature), [feature]);
  const reason = useWorld((s) => lockedBecause(s, feature), [feature]);
  const ask = useCallback(() => guide.show(chapterFor(feature)?.id), [guide, feature]);
  return { open, reason, ask };
}

/**
 * The guide itself, and everything under it that can ask for it. Opens on
 * its own when a guided life hasn’t read a chapter yet.
 */
export function GuideProvider({ children }: { children: ReactNode }) {
  const [showing, setShowing] = useState<string | null>(null);
  const fresh = useWorld((s) => guided(s) && chaptersRead(s).length === 0);

  useEffect(() => {
    if (fresh) setShowing(CHAPTERS[0]!.id);
    // Only on arriving: closing it isn't undone by the next render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const api = useMemo<GuideApi>(() => ({
    show: (chapterId) => setShowing(chapterId ?? ''),
  }), []);

  return (
    <GuideContext.Provider value={api}>
      {children}
      {showing !== null && <GuideDialog start={showing} onClose={() => setShowing(null)} />}
    </GuideContext.Provider>
  );
}

/**
 * A button for a part of the game the guide opens. Open, it is the button.
 * Locked, it shows as locked and opens the guide at its chapter.
 */
export function Gated({
  feature, className = 'btn btn-sm', onClick, children, title, ...rest
}: { feature: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, reason, ask } = useFeature(feature);
  if (open) {
    return <button type="button" className={className} onClick={onClick} title={title} {...rest}>{children}</button>;
  }
  return (
    <button
      type="button"
      {...rest}
      disabled={false}
      className={`${className} is-locked`}
      title={reason}
      onClick={ask}
    >
      {children}
      <span className="lock-word">Locked</span>
    </button>
  );
}

/**
 * A panel on Home before its chapter is read: its name, and the chapter
 * that opens it.
 */
export function LockedPanel({ feature, title }: { feature: string; title: string }) {
  const { open, ask } = useFeature(feature);
  const chapter = chapterFor(feature);
  if (open || !chapter) return null;
  return (
    <section className="card card-tight panel-locked" aria-label={`${title}, Locked`}>
      <div className="panel-head">
        <div><h2>{title}</h2></div>
        <span className="lock-word">Locked</span>
      </div>
      <p className="small muted" style={{ margin: '0 0 var(--s3)' }}>
        Opens with “{chapter.title}” in the guide: {chapter.lead.charAt(0).toLowerCase() + chapter.lead.slice(1)}
      </p>
      <button type="button" className="btn btn-sm" onClick={ask}>Read About It</button>
    </section>
  );
}

/**
 * Where the guide is, under the bar, until every chapter is read: the next
 * chapter and the way into it.
 */
export function GuideStrip() {
  const guide = useGuide();
  const next = useWorld((s) => (guided(s) ? nextChapter(s) : undefined));
  const done = useWorld((s) => readNow(s).length);
  if (!next) return null;
  return (
    <div className="guide-strip" role="status">
      <span className="small">
        <span className="eyebrow">Guide · {done + 1} Of {CHAPTERS.length}</span>{' '}
        <strong>{next.title}</strong>
        <span className="muted hide-sm"> · {next.lead}</span>
      </span>
      <button type="button" className="btn btn-sm btn-primary" onClick={() => guide.show(next.id)}>Read</button>
    </div>
  );
}

/** The top bar’s way back into the guide, for any chapter, any time. */
export function GuideButton() {
  const guide = useGuide();
  const left = useWorld((s) => CHAPTERS.length - readNow(s).length);
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={() => guide.show()}>
      Guide{left > 0 ? ` (${left} Left)` : ''}
    </button>
  );
}

/** The chapters read that are chapters now. */
const readNow = (s: Parameters<typeof chaptersRead>[0]) => chaptersRead(s).filter((id) => CHAPTER_BY_ID[id]);

function GuideDialog({ start, onClose }: { start: string; onClose: () => void }) {
  const { run, hold } = useGame();
  useEffect(() => { hold('guide', true); return () => hold('guide', false); }, [hold]);
  const read = useWorld((s) => chaptersRead(s));
  const next = useWorld((s) => nextChapter(s));
  const isGuided = useWorld((s) => guided(s));
  // An empty start is the next chapter; any chapter asked for opens, to read.
  const [at, setAt] = useState(() => CHAPTER_BY_ID[start]?.id ?? next?.id ?? CHAPTERS[0]!.id);
  // The chapter asked for, when it had to wait for another.
  const [waiting] = useState(() => {
    const asked = CHAPTER_BY_ID[start];
    return asked && !read.includes(asked.id) && asked.id !== next?.id ? asked : undefined;
  });
  const [justOpened, setJustOpened] = useState<string | null>(null);

  const chapter = CHAPTER_BY_ID[at]!;
  const index = CHAPTERS.findIndex((c) => c.id === at);
  const isNext = next?.id === at && isGuided;
  const opened = justOpened ? CHAPTER_BY_ID[justOpened] : undefined;

  const markRead = () => {
    const answer = run<{ read: string; next?: string }>(READ_KIND, { chapterId: chapter.id });
    if (answer.ok) setJustOpened(chapter.id);
  };
  const goTo = (id: string) => { setJustOpened(null); setAt(id); };

  const footer = opened ? (
    <>
      <button className="btn" onClick={onClose}>Try It</button>
      {next
        ? <button className="btn btn-primary" onClick={() => goTo(next.id)}>Next: {next.title}</button>
        : <button className="btn btn-primary" onClick={onClose}>Start Playing</button>}
    </>
  ) : isNext ? (
    <>
      <button className="btn" onClick={onClose}>Later</button>
      <button className="btn btn-primary" onClick={markRead}>I’ve Read It</button>
    </>
  ) : (
    <>
      <button className="btn" onClick={onClose}>Close</button>
      {next && next.id !== at && (
        <button className="btn btn-primary" onClick={() => goTo(next.id)}>Next Unread: {next.title}</button>
      )}
    </>
  );

  return (
    <Modal title="Guide" onClose={onClose} wide footer={footer}>
      <div className="guide">
        <nav className="guide-toc" aria-label="Chapters">
          {CHAPTERS.map((c, i) => {
            const done = read.includes(c.id);
            const upNext = next?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                className="guide-toc-item"
                aria-current={c.id === at ? 'step' : undefined}
                aria-label={`${i + 1}. ${c.title}, ${done ? 'Read' : upNext ? 'Next' : 'Later'}`}
                onClick={() => goTo(c.id)}
              >
                <span className="guide-toc-num mono">{i + 1}</span>
                <span className="grow truncate">{c.title}</span>
                <span className="xs dim">{done ? 'Read' : upNext ? 'Next' : 'Later'}</span>
              </button>
            );
          })}
        </nav>

        <article className="guide-page">
          {opened ? (
            <>
              <div className="eyebrow">Opened</div>
              <h3 style={{ margin: 'var(--s1) 0 var(--s3)' }}>{opened.title}</h3>
              <ul className="small guide-opens">
                {opened.names.map((name) => <li key={name}>{name}</li>)}
              </ul>
              <p className="small muted">
                {next
                  ? `Try it now, or go straight on. “${next.title}” is next, whenever you open the guide.`
                  : 'That was the last chapter. Every part of the game is open, and the guide stays in the top bar whenever you want to read any of it again.'}
              </p>
            </>
          ) : (
            <>
              {waiting && at === waiting.id && next && (
                <div className="callout small" style={{ marginBottom: 'var(--s3)' }}>
                  This chapter opens what you pressed. Chapters are marked read in order, and “{next.title}” comes first.
                </div>
              )}
              {!isNext && isGuided && !read.includes(chapter.id) && !waiting && next && (
                <div className="callout small" style={{ marginBottom: 'var(--s3)' }}>
                  Read ahead as you like. Chapters are marked read in order, and “{next.title}” comes first.
                </div>
              )}
              <div className="eyebrow">Chapter {index + 1} Of {CHAPTERS.length}</div>
              <h3 style={{ margin: 'var(--s1) 0 var(--s1)' }}>{chapter.title}</h3>
              <p className="small muted" style={{ marginTop: 0 }}>{chapter.lead}</p>
              {chapter.body.map((paragraph) => <p key={paragraph} className="small">{paragraph}</p>)}
              <div className="guide-opens-box">
                <div className="eyebrow">{read.includes(chapter.id) ? 'What It Opened' : 'What Reading It Opens'}</div>
                <ul className="small guide-opens">
                  {chapter.names.map((name) => <li key={name}>{name}</li>)}
                </ul>
              </div>
            </>
          )}
        </article>
      </div>
    </Modal>
  );
}
