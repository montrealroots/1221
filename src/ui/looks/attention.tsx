/**
 * SLATE — the things asking for you.
 *
 * Home’s "What Needs You" panel is the one place the game admits something is
 * waiting on the player, and it says the least it possibly could about it. A
 * decision carries an urgency between nought and a hundred that decides the
 * whole order of the list, and the panel spends that figure on a colored
 * stripe marked `aria-hidden` — so the number reaches nobody at all, not the
 * player who sees a bar and not the screen reader that is told to skip it.
 * The notifications underneath are rendered `list-static`, deliberately inert:
 * a wall of sentences about things that happened, with no way back to any of
 * them.
 *
 * Both kinds here do the same job. Say the figure the bar hides, say what
 * raised it, say when it stops asking, and offer the thing it is about, which
 * is a pointer five record shapes declare. Nothing in the engine fills it in
 * any more — everything that did went with the film side — so the pointer is
 * whatever an older save carries or a caller supplies, and `subjectForRef`
 * resolves it only when a look has been declared for its kind.
 *
 * A decision’s actions are commands. They stay on Home, where pressing one
 * runs it through `game.run()`. This explains a decision; it never takes one,
 * and nothing below writes anything at all.
 */

import { titleCaseLabel } from '@/engine/core/text';
import { formatDate, formatRelative, formatRelativeWords, MS_DAY } from '@/engine/core/time';
import { openDecisions, unreadNotifications } from '@/engine/world/world';
import type { DecisionItem, Notification as Notice } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, lookExists, resolveLook, type Way } from './registry';
import { at, subjectForRef, type Subject } from './subject';
import { outOf, spokenList } from './words';

// Untouched for ninety days, an undated row went quiet (`QUIET_AFTER_DAYS`), and the look said so, until 2026-10-14,
// when the owner had the rule go: no raiser left a row undated, and every row has a date now (`expireDecisions`).

/** And this long after it closes there is nothing left of it. `prune`. */
const FORGOTTEN_AFTER_DAYS = 180;

/** How many the panel has room for before the rest wait their turn. */
const PANEL_ROWS = 6;

/** The world tick that expires a decision runs on this stride, not on the hour. */
const TICK_DAYS = 2;

/** What the save keeps of the notification list before the oldest fall off. */
const NOTICES_KEPT = 500;

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

const ORDINALS = [
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth',
  'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth',
];

/** "third", and past the words "21st" rather than the "21th" a bare suffix gives. */
function ordinal(n: number): string {
  const word = ORDINALS[n - 1];
  if (word) return word;
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

/** Numbers under ten are words in prose. The house rule, kept with the others. */
const SMALL = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'] as const;
const countWord = (n: number): string => SMALL[n] ?? String(n);

/** "3 weeks ago", and "just now" where `formatRelative` says "now". */
// In words, as a sentence says it (from 2026-10-17): until then “It came up 2d 3h ago”, the Calendar’s form.
const ago = (at: number, now: number): string => { const r = formatRelativeWords(at, now); return r === 'now' ? 'just now' : r; };

/**
 * What a question or a notice is about, by who raised it, in the player’s words (from 2026-10-17, brief 14). Until then
 * it was who "put it in front of you": "the machinery that keeps the days running", "the money", "the roof over your
 * head". The categories of systems that went (career, property, travel and the rest) stay for what an older save keeps.
 */
const ABOUT: Readonly<Record<string, string>> = {
  system: 'the game itself',
  schedule: 'your calendar',
  life: 'your day-to-day life',
  personal: 'your own affairs',
  money: 'your money',
  bank: 'your bank',
  school: 'your school',
  tax: 'your taxes',
  taxes: 'your taxes',
  papers: 'your papers',
  benefits: 'your benefits',
  health: 'your health',
  home: 'your home',
  career: 'your work',
  property: 'your home',
  travel: 'your travel',
  relationship: 'someone you know',
  legal: 'a legal matter',
  business: 'your business',
  reimbursement: 'a reimbursement',
};

const aboutOf = (category: string): string => ABOUT[category] ?? 'something in your life';

/** The category as a label, for the one figure grid. */
const categoryLabel = (category: string): string =>
  titleCaseLabel(category.replace(/[_/]+/g, ' ').trim()) || 'Not Recorded';

/**
 * A title as a name: no underscore, no slash, no long run of digits, and Title
 * Case where it reads as a label rather than as a sentence.
 *
 * A title is caller-supplied prose and can carry any of the three. Said aloud
 * there is an "and" in a slash, and a long run of digits is read as the number
 * it is — the same reading `place` gives a census tract, for the same reason:
 * a long run of digits is an identifier, not a name. A year is the exception,
 * and it’s the only four-digit run a title carries ("Welcome To The Class Of
 * 2029", "Your 2026 Tax Return"): until 2026-10-17 every run of four or more
 * was grouped, and those looks were named "Class Of 2,029" and "Your 2,026 Tax
 * Return" (found by brief 13's interface playthroughs).
 */
const YEAR = /^(1[89]|2\d)\d\d$/;
function nameOf(title: string, fallback: string): string {
  const plain = title
    .replace(/\s*\/\s*/g, ' and ')
    .replace(/_+/g, ' ')
    .replace(/\d{4,}/g, (run) => (YEAR.test(run) ? run : Number(run).toLocaleString('en-US')))
    .replace(/\s+/g, ' ')
    .trim();
  return plain ? titleCaseLabel(plain) : fallback;
}

/**
 * A figure on the hundred-point scale, as a word. Until 2026-10-17 each band said where a thing sat ("nothing but an
 * overdue thing sits above it", "it will keep for a day", "nothing bad happens while it sits there"), which the order
 * (`openDecisions`) and the dates didn’t bear out: another question of 90 sits above one of 86, and one of 45 can be due
 * tomorrow.
 */
function weightOf(urgency: number): string {
  if (urgency >= 85) return 'very high';
  if (urgency >= 65) return 'high';
  if (urgency >= 40) return 'ordinary';
  return 'low';
}

/**
 * A way onto the thing a record points at, labeled with that thing’s own name.
 *
 * The `lookExists` guard is not belt and braces. An older save carries pointers
 * of kinds the registry has never heard of — `'project'`, `'audition'` and
 * `'property'` — so the guard fires on real records, and what it buys is a row
 * with no way out rather than a link onto a page that does not exist.
 */
function wayTo(sim: Simulation, subject: Subject, detail: string): Way | undefined {
  if (!lookExists(sim, subject)) return undefined;
  const found = resolveLook(sim, subject);
  if (!found || 'gone' in found || !found.name) return undefined;
  return { to: subject, label: found.name, detail };
}

// ---------------------------------------------------------------------------
// A decision — something waiting on you
// ---------------------------------------------------------------------------

type Stage = 'open' | 'answered' | 'ran out' | 'let go';

/** A closed question’s state, as the figure grid says it. */
const STAGE_WORD: Readonly<Record<Stage, string>> = { open: 'Open', answered: 'Dealt with', 'ran out': 'Closed after its date', 'let go': 'Dismissed' };

function stageOf(decision: DecisionItem): Stage {
  if (decision.dismissedAt !== undefined) return 'let go';
  if (decision.resolvedAt !== undefined) {
    return decision.dueAt <= decision.resolvedAt ? 'ran out' : 'answered';
  }
  return 'open';
}

const closedAtOf = (decision: DecisionItem): number | undefined =>
  decision.dismissedAt ?? decision.resolvedAt;

/**
 * One sentence, second person, true at this instant. An overdue question is open only until the next world tick closes
 * it (`expireDecisions`), and the tick comes every two days. A question is dealt with by an answer on Home or by acting
 * on its own screen (the raisers' own `resolvedAt`); one closed after its date may have been either, or the tick.
 */
function decisionSentence(decision: DecisionItem, stage: Stage, sim: Simulation): string {
  switch (stage) {
    case 'open':
      if (decision.dueAt < sim.now) {
        return `Its date passed ${ago(decision.dueAt, sim.now)}. It stays at the top of What Needs You until it closes by itself, within ${countWord(TICK_DAYS)} days.`;
      }
      return `Answer it by ${formatDate(decision.dueAt, sim.zone)}. That’s ${formatRelativeWords(decision.dueAt, sim.now)}.`;
    case 'answered':
      return `It was dealt with ${ago(closedAtOf(decision) ?? sim.now, sim.now)}, so it’s no longer in What Needs You.`;
    case 'ran out':
      return 'It closed after its date had passed, so it isn’t asking you for anything now.';
    case 'let go':
      return `You dismissed it from Home ${ago(closedAtOf(decision) ?? sim.now, sim.now)}. Dismissing only takes it off the list: what it was about still stands, and its date is ${formatDate(decision.dueAt, sim.zone)}.`;
  }
}

defineLook<DecisionItem>('decision', {
  gone: `That question closed more than ${FORGOTTEN_AFTER_DAYS} days ago, so the save no longer keeps it.`,
  resolve: (sim, id) => sim.universe.decisions[id],
  seeds: (sim) => {
    const waiting = openDecisions(sim).map((d) => d.id);
    const rest = Object.keys(sim.universe.decisions).filter((id) => !waiting.includes(id));
    return [...waiting, ...rest].slice(0, 12);
  },
  look: (decision, { sim }) => {
    const stage = stageOf(decision);
    const urgency = Math.round(decision.urgency);
    const waiting = openDecisions(sim);
    const place = waiting.findIndex((d) => d.id === decision.id) + 1;
    const overdue = decision.dueAt < sim.now;
    const closedAt = closedAtOf(decision);
    const forgottenAt = (closedAt ?? sim.now) + FORGOTTEN_AFTER_DAYS * MS_DAY;

    const ways: Way[] = [];
    const about = subjectForRef(decision);
    const aboutWay = about && wayTo(sim, about, 'Open what this question is about');
    if (aboutWay) ways.push(aboutWay);

    // The order is `openDecisions`': overdue first, then the most urgent, then the soonest due.
    const standing = stage === 'open'
      ? (overdue
        ? 'Being overdue puts it first, ahead of anything more urgent.'
        : waiting.length === 1
          ? 'It’s the only question waiting on you.'
          : `It’s ${ordinal(place)} of the ${countWord(waiting.length)} questions waiting on you.`)
      : `It closed ${ago(closedAt ?? sim.now, sim.now)}, and Home no longer lists it.`;

    const ending = stage === 'open'
      ? `It closes when you answer it on Home or deal with it on its own screen. Otherwise it closes by itself after ${formatDate(decision.dueAt, sim.zone)}: the game checks every ${countWord(TICK_DAYS)} days, so that happens within ${countWord(TICK_DAYS)} days of its date. The save keeps it for ${FORGOTTEN_AFTER_DAYS} days after it closes.`
      : `The save keeps it until ${formatDate(forgottenAt, sim.zone)}, ${FORGOTTEN_AFTER_DAYS} days after it closed.`;

    // Home renders the actions, Go There where there is a route, and Dismiss on every row it prints, but only for the
    // rows it prints.
    const labels = decision.actions.map((action) => titleCaseLabel(action.label));
    const onPanel = stage === 'open' && place > 0 && place <= PANEL_ROWS;
    const offered = stage !== 'open'
      ? 'It’s no longer on Home, so there’s nothing to press.'
      : !onPanel
        ? `Home shows the first ${countWord(PANEL_ROWS)} questions, and this one is further down. Its buttons appear there once one of the questions above it closes.`
        : `On Home, its buttons are ${spokenList([...labels, ...(decision.route ? ['Go There'] : []), 'Dismiss'])}. Reading it here changes nothing.`;

    return {
      name: nameOf(decision.title, 'A Question For You'),
      kind: stage === 'open' ? 'Waiting On You' : 'No Longer Waiting',
      parent: at('person', sim.universe.playerId),
      summary: decisionSentence(decision, stage, sim),
      body: (
        <>
          {decision.detail && <p className="small muted">{decision.detail}</p>}
          <p className="small muted">
            {`It came up ${ago(decision.createdAt, sim.now)}, about ${aboutOf(decision.category)}. Its urgency is ${weightOf(urgency)}, at ${outOf(urgency)}. `}
            {'If it comes up again while it’s open, its urgency can only go up. '}
            {standing}
          </p>
          <p className="small muted">{ending}</p>
          <p className="small muted">{offered}</p>
          <div className="grid grid-3">
            <Stat label="Urgency" value={urgency} note="Out of 100. Home shows it only as a colored stripe" />
            <Stat label="About" value={categoryLabel(decision.category)} />
            <Stat
              label="Raised"
              value={formatDate(decision.createdAt, sim.zone)}
              // An undated row’s note was the day it would go quiet ("Quiet by"), until 2026-10-14, when every row
              // had a date and the rule went.
              note={stage !== 'open' ? `Closed ${formatDate(closedAt ?? sim.now, sim.zone)}` : 'It closes by itself after its date'}
            />
            <Stat
              label="Due"
              value={formatDate(decision.dueAt, sim.zone)}
              note={formatRelative(decision.dueAt, sim.now)}
              tone={overdue ? 'negative' : undefined}
            />
            <Stat
              label="Place On Home"
              value={stage === 'open' ? `${place} of ${waiting.length}` : 'Not listed'}
              note={stage === 'open' ? 'Overdue first, then the most urgent' : STAGE_WORD[stage]}
            />
            <Stat
              label="Answers"
              value={decision.actions.length > 0 ? decision.actions.length : 'None'}
              note={decision.actions.length > 0 ? 'On Home, beside Dismiss' : 'It can only be dismissed'}
            />
          </div>
        </>
      ),
      ways,
      // Until 2026-10-14 it said the save kept a row waved away early to its date, and an undated row’s ninety days.
      provenance: 'Urgency is estimated, from 0 to 100.',
    };
  },
});

// ---------------------------------------------------------------------------
// A notification — something you were told
// ---------------------------------------------------------------------------

defineLook<Notice>('notification', {
  gone: `That notice is gone. The save keeps the latest ${NOTICES_KEPT}, and this one was older.`,
  resolve: (sim, id) => sim.universe.notifications.find((n) => n.id === id),
  seeds: (sim) => {
    const unread = unreadNotifications(sim).slice(0, 6).map((n) => n.id);
    const read = sim.universe.notifications.filter((n) => n.read).slice(-6).map((n) => n.id);
    return [...unread, ...read];
  },
  look: (note, { sim }) => {
    const unread = unreadNotifications(sim);
    const place = unread.findIndex((n) => n.id === note.id) + 1;
    const importance = Math.round(note.importance);

    const ways: Way[] = [];
    const about = subjectForRef(note);
    const aboutWay = about && wayTo(sim, about, 'Open what this notice is about');
    if (aboutWay) ways.push(aboutWay);
    const alsoWaiting = note.refType
      ? openDecisions(sim).find((d) => d.refType === note.refType && d.refId === note.refId)
      : undefined;
    if (alsoWaiting) {
      ways.push({
        to: at('decision', alsoWaiting.id),
        label: nameOf(alsoWaiting.title, 'The Open Question'),
        detail: 'The question about the same thing, still waiting on you',
      });
    }

    // Mark Read on Home sends no ids, so it marks every unread notice read (`world.mark_read`).
    const marking = unread.length === 1
      ? 'On Home, Mark 1 Read marks it read.'
      : `On Home, Mark ${unread.length} Read marks all ${unread.length} unread notices read at once.`;

    return {
      name: nameOf(note.title, 'A Notice With No Title'),
      kind: 'Notice',
      parent: at('person', sim.universe.playerId),
      summary: note.read
        ? `You’ve read this notice. It came in ${ago(note.at, sim.now)}.`
        : unread.length === 1
          ? `It came in ${ago(note.at, sim.now)}, and it’s your only unread notice.`
          : `It came in ${ago(note.at, sim.now)}. It’s ${ordinal(place)} of your ${countWord(unread.length)} unread notices.`,
      body: (
        <>
          {note.body && <p className="small muted">{note.body}</p>}
          <p className="small muted">
            {`It’s about ${aboutOf(note.category)}, and its importance is ${outOf(importance)}. Unread notices are listed most important first, and the newer first when two are equal. `}
            {note.read
              ? `The save keeps it until there are more than ${NOTICES_KEPT} notices, when the oldest are dropped.`
              : `Opening it here doesn’t mark it read. ${marking}`}
            {note.route ? ' On Home, Go There opens the screen it’s about.' : ''}
          </p>
          <div className="grid grid-3">
            <Stat label="Importance" value={importance} note="Out of 100. It sets the order" />
            <Stat label="Arrived" value={formatDate(note.at, sim.zone)} note={formatRelative(note.at, sim.now)} />
            <Stat label="About" value={categoryLabel(note.category)} />
            <Stat
              label="Status"
              value={note.read ? 'Read' : 'Unread'}
              note={note.read ? 'No longer listed on Home' : `${place} of ${unread.length} unread`}
            />
            <Stat
              label="What It’s About"
              value={aboutWay ? aboutWay.label : 'Not named'}
              note={aboutWay ? 'Open it below' : 'This notice doesn’t name one'}
            />
            <Stat label="Kept" value={`Latest ${NOTICES_KEPT}`} note="Older ones are dropped" />
          </div>
        </>
      ),
      ways,
      // Until 2026-10-17 it said, under a notice that named nothing, that nothing in the world named one so far, and
      // that the day something did it would open onto it: the game’s history, not the player’s (brief 14).
      provenance: aboutWay ? 'The link below opens what this notice is about.' : undefined,
    };
  },
});
