/**
 * SLATE — UPDATES (from 2026-10-23, the owner's brief 23: "Keep all existing history accessible through a clearly named
 * inbox or updates view").
 *
 * Every notice the save keeps, read and unread, newest first. Until then Home's What Needs You drew the unread under the
 * questions, six at a time or every one at once, each with its whole text, and a notice once read was on no list at all;
 * a graduate's 500 unread were a page of paragraphs between the questions and How You Are.
 *
 * A notice says what happened. Reading one answers nothing: a question stays in What Needs You until it's answered, dealt
 * with on its own screen, dismissed or closed by its date, as it always did, and marking a notice read changes nothing
 * but that it's read (`world.mark_read`). Nothing here deletes a notice; the save keeps the latest 500, as it always did.
 *
 * Notices with the same title about the same thing (the same `refType` and `refId`, or none) are one row with their
 * count, newest first, each still there to open.
 */

import { useState } from 'react';
import { titleCaseLabel } from '@/engine/core/text';
import { formatDate, formatRelative } from '@/engine/core/time';
import type { Notification } from '@/engine/domain/model';
import { useGame, useWorld } from '@/app/game-context';
import { Empty } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { HowItWorks } from '@/ui/guide/HowItWorks';
import { LookRegion, Open, at } from '@/ui/looks';

/** What a notice is about, in the few words a filter can carry, by the category its sender gave it. */
const ABOUT: Readonly<Record<string, string>> = {
  school: 'School', scholarship: 'School',
  career: 'Work', salary: 'Work',
  bank: 'Money', bank_fee: 'Money', transfer: 'Money', interest: 'Money', fees: 'Money', cash: 'Money', money: 'Money',
  opening: 'Money', rent: 'Money', reimbursement: 'Money', business: 'Money',
  tax: 'Papers', taxes: 'Papers', papers: 'Papers', benefits: 'Papers', benefit: 'Papers', pension: 'Papers', legal: 'Papers',
  health: 'Health',
  personal: 'Your Life', life: 'Your Life', home: 'Your Life', property: 'Your Life', relationship: 'Your Life',
  travel: 'Your Life', schedule: 'Your Life',
  system: 'The Game',
};
const ORDER = ['School', 'Work', 'Money', 'Papers', 'Health', 'Your Life', 'The Game', 'Other'];
export const aboutLabel = (category: string): string => ABOUT[category] ?? 'Other';

/** How many rows are drawn before Show More. */
const PAGE = 40;

export interface NoticeGroup { key: string; notes: Notification[] }

/**
 * The notices as rows: newest first, a run with the same title about the same thing one row, its newest first. Exported
 * for the tests.
 */
export function groupNotices(notes: readonly Notification[]): NoticeGroup[] {
  const byKey = new Map<string, NoticeGroup>();
  const groups: NoticeGroup[] = [];
  for (const note of [...notes].sort((a, b) => b.at - a.at)) {
    const key = `${note.title}\u0000${note.refType ?? ''}\u0000${note.refId ?? ''}`;
    let group = byKey.get(key);
    if (!group) { group = { key, notes: [] }; byKey.set(key, group); groups.push(group); }
    group.notes.push(note);
  }
  return groups;
}

export function Updates() {
  const { sim, run, navigate } = useGame();
  const notices = useWorld((s) => [...s.universe.notifications]);
  const [show, setShow] = useState<'unread' | 'all'>(() => (notices.some((n) => !n.read) ? 'unread' : 'all'));
  const [about, setAbout] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  const unread = notices.filter((n) => !n.read);
  const kinds = ORDER.filter((k) => notices.some((n) => aboutLabel(n.category) === k));
  const listed = notices.filter((n) => (show === 'all' || !n.read) && (!about || aboutLabel(n.category) === about));
  const groups = groupNotices(listed);
  const listedUnread = listed.filter((n) => !n.read);
  const toggle = (key: string) => setOpen((was) => { const next = new Set(was); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  const markRead = (notes: readonly Notification[]) => run('world.mark_read', { notificationIds: notes.filter((n) => !n.read).map((n) => n.id) });

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Day</div>
        <h1>Updates</h1>
        <p className="muted prose">
          Every notice you’ve had, newest first: what happened, what it’s about and when. Reading one answers nothing.
          The questions waiting on you stay under What Needs You on Home until they’re answered.
        </p>
      </div>

      <div className="card card-flush">
        <div className="updates-bar">
          <div className="segmented" role="group" aria-label="Show">
            <button type="button" className="btn btn-sm" aria-pressed={show === 'unread'} onClick={() => { setShow('unread'); setShown(PAGE); }}>
              Unread ({unread.length})
            </button>
            <button type="button" className="btn btn-sm" aria-pressed={show === 'all'} onClick={() => { setShow('all'); setShown(PAGE); }}>
              All ({notices.length})
            </button>
          </div>
          <label className="updates-about">
            <span className="label">About</span>
            <select value={about} onChange={(e) => { setAbout(e.target.value); setShown(PAGE); }}>
              <option value="">Everything</option>
              {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <div className="grow" />
          {listedUnread.length > 0 && (
            <Gated feature="world.mark_read" className="btn btn-sm" onClick={() => markRead(listedUnread)}>
              Mark {listedUnread.length} Read
            </Gated>
          )}
          <HowItWorks help="day.needs" />
        </div>

        {groups.length === 0 ? (
          <Empty
            title={show === 'unread' ? 'All Read' : 'No Notices Yet'}
            body={show === 'unread'
              ? `You’ve read every notice${about ? ` about ${about.toLowerCase()}` : ''}. All shows the ones you’ve read.`
              : 'What happens in your life is told to you here: a teacher’s note, a payment that came in, a letter.'}
          />
        ) : (
          <ul className="notice-list">
            {groups.slice(0, shown).map((group) => {
              const note = group.notes[0]!;
              const more = group.notes.length - 1;
              const unreadHere = group.notes.filter((n) => !n.read);
              const isOpen = open.has(group.key);
              return (
                <li key={group.key} className="notice" data-unread={unreadHere.length > 0}>
                  <LookRegion className="notice-main">
                    <div className="notice-title">
                      <span className="strong"><Open subject={at('notification', note.id)}>{titleCaseLabel(note.title)}</Open></span>
                      {more > 0 && <span className="chip">{group.notes.length} Notices</span>}
                      <span className={`chip ${unreadHere.length ? 'chip-accent' : ''}`}>{unreadHere.length ? 'Unread' : 'Read'}</span>
                    </div>
                    <div className="notice-meta">
                      {aboutLabel(note.category)} · {formatRelative(note.at, sim.now)} · {formatDate(note.at, sim.zone)}
                    </div>
                    <p className={`notice-body${isOpen ? '' : ' clamp-2'}`}>{note.body}</p>
                    {isOpen && more > 0 && (
                      <ul className="notice-earlier">
                        {group.notes.slice(1).map((n) => (
                          <li key={n.id}>
                            <div className="notice-meta">{formatDate(n.at, sim.zone)} · {n.read ? 'Read' : 'Unread'}</div>
                            <p className="notice-body">{n.body}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </LookRegion>
                  <div className="notice-actions">
                    <button type="button" className="btn btn-sm btn-ghost" aria-expanded={isOpen} onClick={() => toggle(group.key)}>
                      {isOpen ? 'Show Less' : more > 0 ? `Read All ${group.notes.length}` : 'Read It All'}
                    </button>
                    {note.route && (
                      <button type="button" className="btn btn-sm" onClick={() => navigate(note.route!, titleCaseLabel(note.title))}>Go There</button>
                    )}
                    {unreadHere.length > 0 && (
                      <Gated feature="world.mark_read" className="btn btn-sm" onClick={() => markRead(unreadHere)}>Mark Read</Gated>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {groups.length > shown && (
          <div className="row-between updates-foot">
            <span className="xs dim">{`${shown} of ${groups.length} shown.`}</span>
            <button type="button" className="btn btn-sm" onClick={() => setShown(shown + PAGE)}>{`Show ${Math.min(PAGE, groups.length - shown)} More`}</button>
          </div>
        )}
      </div>
    </>
  );
}
