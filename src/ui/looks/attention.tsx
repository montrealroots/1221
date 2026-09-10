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
 * raised it, say when it stops asking, and — for a notice — offer the thing it
 * is about, which is a pointer five record types declare and no caller has
 * ever filled in. `subjectForRef` resolves nothing today and is used anyway.
 * The day something populates `refType`, a notification opens onto its subject
 * and not one line of this changes.
 *
 * A decision’s actions are commands. They stay on Home, where pressing one
 * runs it through `game.run()`. This explains a decision; it never takes one,
 * and nothing below writes anything at all.
 */

import { titleCaseLabel } from '@/engine/core/text';
import { formatDate, formatRelative, MS_DAY } from '@/engine/core/time';
import { openDecisions, unreadNotifications } from '@/engine/world/world';
import type { DecisionItem, Notification as Notice } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, lookExists, resolveLook, type Way } from './registry';
import { at, subjectForRef, type Subject } from './subject';
import { spokenList } from './words';

/** Untouched for this long and the world stops nagging. `expireDecisions`. */
const QUIET_AFTER_DAYS = 90;

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

const sentenceStart = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

/** Who raised it, in the world’s words rather than the category’s. */
const RAISED_BY: Readonly<Record<string, string>> = {
  system: 'the machinery that keeps the days running',
  schedule: 'the calendar',
  life: 'your own body',
  money: 'the money',
  career: 'the work',
  health: 'your health',
  property: 'the roof over your head',
  travel: 'the traveling',
  relationship: 'somebody who knows you',
  legal: 'the paperwork',
};

const raisedBy = (category: string): string =>
  RAISED_BY[category] ?? `the ${category.replace(/[_/]+/g, ' ').trim() || 'quiet'} side of things`;

/** The category as a label, for the one figure grid. */
const categoryLabel = (category: string): string =>
  titleCaseLabel(category.replace(/[_/]+/g, ' ').trim()) || 'Not On File';

/**
 * A title as a name: no underscore, no slash, no run of four digits, and Title
 * Case where it reads as a label rather than as a sentence.
 *
 * A title is caller-supplied prose and can carry any of the three. Said aloud
 * there is an "and" in a slash, and a long run of digits is read as the number
 * it is — the same reading `place` gives a census tract, for the same reason:
 * four digits in a row is an identifier, not a name.
 */
function nameOf(title: string, fallback: string): string {
  const plain = title
    .replace(/\s*\/\s*/g, ' and ')
    .replace(/_+/g, ' ')
    .replace(/\d{4,}/g, (run) => Number(run).toLocaleString('en-US'))
    .replace(/\s+/g, ' ')
    .trim();
  return plain ? titleCaseLabel(plain) : fallback;
}

/** What a figure out of a hundred means for where a thing sits. */
function weightOf(urgency: number): string {
  if (urgency >= 85) return 'high enough that nothing but an overdue thing sits above it';
  if (urgency >= 65) return 'above the ordinary run of things';
  if (urgency >= 40) return 'ordinary weight, and it will keep for a day';
  return 'low, and nothing bad happens while it sits there';
}

/**
 * A way onto the thing a record points at, labeled with that thing’s own name.
 *
 * Nothing yet: `refType` is pass-through of a value no caller supplies. It
 * returns undefined rather than painting a way onto nothing, which is also
 * what keeps the crawl honest the day the pointer starts arriving with a kind
 * the registry has never heard of.
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

function stageOf(decision: DecisionItem): Stage {
  if (decision.dismissedAt !== undefined) return 'let go';
  if (decision.resolvedAt !== undefined) {
    return decision.dueAt !== undefined && decision.dueAt <= decision.resolvedAt ? 'ran out' : 'answered';
  }
  return 'open';
}

const closedAtOf = (decision: DecisionItem): number | undefined =>
  decision.dismissedAt ?? decision.resolvedAt;

/** One sentence, second person, true at this instant. */
function decisionSentence(decision: DecisionItem, stage: Stage, sim: Simulation): string {
  const urgency = Math.round(decision.urgency);
  const quietAt = decision.createdAt + QUIET_AFTER_DAYS * MS_DAY;
  switch (stage) {
    case 'open':
      if (decision.dueAt !== undefined && decision.dueAt < sim.now) {
        return `It went past its date ${formatRelative(decision.dueAt, sim.now)}, it’s carrying ${urgency} out of a hundred, and being overdue is what holds it at the top of everything waiting on you.`;
      }
      if (decision.dueAt !== undefined) {
        return `It’s asking you at ${urgency} out of a hundred and it wants an answer ${formatRelative(decision.dueAt, sim.now)}.`;
      }
      return `It’s asking you at ${urgency} out of a hundred with no date on it, and left alone it goes quiet ${formatRelative(quietAt, sim.now)}.`;
    case 'answered':
      return `You dealt with this one ${formatRelative(decision.resolvedAt ?? sim.now, sim.now)}, so it isn’t on the list any more.`;
    case 'ran out':
      return 'Its date had already gone by the time it closed, so it isn’t asking you for anything now.';
    case 'let go':
      return 'It isn’t waiting on you any more — either you waved it away or it sat ninety days without being touched.';
  }
}

defineLook<DecisionItem>('decision', {
  gone: 'That one’s settled, and settled long enough ago that nothing keeps it now.',
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
    const overdue = decision.dueAt !== undefined && decision.dueAt < sim.now;
    const quietAt = decision.createdAt + QUIET_AFTER_DAYS * MS_DAY;
    const closedAt = closedAtOf(decision);
    const forgottenAt = (closedAt ?? sim.now) + FORGOTTEN_AFTER_DAYS * MS_DAY;

    const ways: Way[] = [];
    const about = subjectForRef(decision);
    const aboutWay = about && wayTo(sim, about, 'The thing this is actually about, opened where it stands');
    if (aboutWay) ways.push(aboutWay);

    const standing = stage === 'open'
      ? (overdue
        ? 'Overdue puts it first, ahead of anything asking harder, and it stays there until it’s dealt with.'
        : waiting.length === 1
          ? 'It’s the only thing waiting on you.'
          : `It’s ${ordinal(place)} of the ${countWord(waiting.length)} things waiting on you${place > PANEL_ROWS ? `, which is below the ${countWord(PANEL_ROWS)} rows Home has room for, so it sits off the panel until something above it clears` : ''}.`)
      : `It closed ${formatRelative(closedAt ?? sim.now, sim.now)} and nothing on Home lists it now.`;

    const ending = stage === 'open'
      ? `Left alone it goes quiet on its own: ninety days from the day it was raised, on ${formatDate(quietAt, sim.zone)}, the world takes it off the list unanswered.${decision.dueAt !== undefined ? ` The date on it comes first — once ${formatDate(decision.dueAt, sim.zone)} passes it closes itself, answered or not.` : ''} The world only looks in every ${countWord(TICK_DAYS)} days, so either one lands at the next look rather than on the stroke, and six months after it closes there’s no record of it at all.`
      : `The save forgets it entirely six months after it closed, on ${formatDate(forgottenAt, sim.zone)}.`;

    // Home renders the actions, a way through where there is a route, and
    // Dismiss on every row it prints — but only for the rows it prints.
    const labels = decision.actions.map((action) => titleCaseLabel(action.label));
    const onPanel = stage === 'open' && place > 0 && place <= PANEL_ROWS;
    const offered = stage !== 'open'
      ? 'Nothing’s offered against it now, because Home doesn’t list it at all.'
      : !onPanel
        ? 'Nothing can be pressed against it while it sits below the panel, so it waits its turn.'
        : `Home puts ${spokenList([...labels, 'Dismiss'])} against it${decision.route ? ', and a way through to the screen where it lives' : ''}, and pressing one of those is doing it — which is why they’re there and this is only the reading of it.`;

    return {
      name: nameOf(decision.title, 'Something Waiting'),
      kind: stage === 'open' ? 'Waiting On You' : 'No Longer Waiting',
      parent: at('person', sim.universe.playerId),
      summary: decisionSentence(decision, stage, sim),
      body: (
        <>
          {decision.detail && <p className="small muted">{decision.detail}</p>}
          <p className="small muted">
            {`${sentenceStart(raisedBy(decision.category))} put it in front of you ${formatRelative(decision.createdAt, sim.now)}, at ${urgency} out of a hundred — ${weightOf(urgency)}. `}
            {'If the same thing comes up again the figure only ever goes up: the higher of the two stands, and nothing brings it back down. '}
            {standing}
          </p>
          <p className="small muted">{ending}</p>
          <p className="small muted">{offered}</p>
          <div className="grid grid-3">
            <Stat label="Urgency" value={urgency} note="Out of a hundred, and the panel never prints it" />
            <Stat label="Raised By" value={categoryLabel(decision.category)} note={raisedBy(decision.category)} />
            <Stat
              label="Raised"
              value={formatDate(decision.createdAt, sim.zone)}
              note={stage === 'open' ? `Quiet by ${formatDate(quietAt, sim.zone)}` : `Closed ${formatDate(closedAt ?? sim.now, sim.zone)}`}
            />
            <Stat
              label="Due"
              value={decision.dueAt !== undefined ? formatDate(decision.dueAt, sim.zone) : 'No date'}
              note={decision.dueAt !== undefined ? formatRelative(decision.dueAt, sim.now) : 'Nothing forces it'}
              tone={overdue ? 'negative' : undefined}
            />
            <Stat
              label="Where It Sits"
              value={stage === 'open' ? `${place} of ${waiting.length}` : 'Off the list'}
              note={stage === 'open' ? 'Overdue first, then the figure' : sentenceStart(stage)}
            />
            <Stat
              label="Ways Out"
              value={decision.actions.length > 0 ? decision.actions.length : 'Dismiss only'}
              note={decision.actions.length > 0 ? 'Offered on Home, taken on Home' : 'Nothing to answer, only to wave away'}
            />
          </div>
        </>
      ),
      ways,
      provenance: 'Urgency is SLATE’s own reading of how much a thing matters, nought to a hundred. Ninety days untouched closes it; six months after that the save drops it.',
    };
  },
});

// ---------------------------------------------------------------------------
// A notification — something you were told
// ---------------------------------------------------------------------------

defineLook<Notice>('notification', {
  gone: 'That one’s gone — the save keeps the last five hundred, and it fell off the end.',
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
    const aboutWay = about && wayTo(sim, about, 'What the notice is about, opened where it stands');
    if (aboutWay) ways.push(aboutWay);
    const alsoWaiting = note.refType
      ? openDecisions(sim).find((d) => d.refType === note.refType && d.refId === note.refId)
      : undefined;
    if (alsoWaiting) {
      ways.push({
        to: at('decision', alsoWaiting.id),
        label: nameOf(alsoWaiting.title, 'What It Wants'),
        detail: `The same thing, still waiting on you at ${Math.round(alsoWaiting.urgency)} out of a hundred`,
      });
    }

    return {
      name: nameOf(note.title, 'A Notice With No Title'),
      kind: 'Something You Were Told',
      parent: at('person', sim.universe.playerId),
      summary: note.read
        ? `You’ve read this one — it came in ${formatRelative(note.at, sim.now)}, and it’s a record now rather than anything asking.`
        : unread.length === 1
          ? `It came in ${formatRelative(note.at, sim.now)} and it’s the only thing you haven’t read.`
          : `It came in ${formatRelative(note.at, sim.now)} and it’s ${ordinal(place)} of the ${countWord(unread.length)} you haven’t read.`,
      body: (
        <>
          {note.body && <p className="small muted">{note.body}</p>}
          <p className="small muted">
            {`${sentenceStart(raisedBy(note.category))} sent it, at ${importance} out of a hundred, and that figure is the whole of what decides the order the unread come in — heaviest first, and the newest of two that weigh the same. `}
            {note.read
              ? 'Nothing about it is asking for anything; it stays until the list runs past five hundred and the oldest fall off the end.'
              : 'Reading it here doesn’t mark it read — the one control that does sits on Home and clears the whole list at once, because that changes the save and this doesn’t.'}
            {note.route ? ' Home offers a way through to where it happened.' : ''}
          </p>
          <div className="grid grid-3">
            <Stat label="Weight" value={importance} note="Out of a hundred, and it sets the order" />
            <Stat label="Arrived" value={formatDate(note.at, sim.zone)} note={formatRelative(note.at, sim.now)} />
            <Stat label="Sent By" value={categoryLabel(note.category)} note={raisedBy(note.category)} />
            <Stat
              label="Standing"
              value={note.read ? 'Read' : 'Unread'}
              note={note.read ? 'Nothing counts it any more' : `${place} of ${unread.length} unread`}
            />
            <Stat
              label="What It’s About"
              value={aboutWay ? aboutWay.label : 'Not said'}
              note={aboutWay ? 'The way below opens it' : 'It never says which thing'}
            />
            <Stat label="Kept" value={`${NOTICES_KEPT} deep`} note="The oldest drop off the end" />
          </div>
        </>
      ),
      ways,
      provenance: aboutWay
        ? 'A notice can name the thing it’s about, and the thing this one names is still in the world.'
        : 'A notice can name the thing it’s about. Nothing in the world names one yet, so this one ends here — the day something does, it opens onto it.',
    };
  },
});
