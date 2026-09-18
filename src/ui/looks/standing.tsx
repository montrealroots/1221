/**
 * SLATE — where you stand, and the six figures that say so.
 *
 * Home prints three bars — Public Fame, Professional Reputation and Industry
 * Demand — and every one of them is a dead end. They are three of the six
 * numbers on `Reputation`; the other three, audience appeal, reliability and
 * controversy, are real state that has never been rendered anywhere. This is
 * exposure, not invention.
 *
 * Seven again. `prestige` was taken out of this file for being written by most
 * of the people in a save and read by nothing that decides anything — the
 * player’s own held nought for a whole career while this file’s own copy called
 * it "an economy of its own", and a dial that lies is worse than no dial. It came
 * back with two readers written alongside its writers: `remembersYou`, so an
 * office that has never met you has heard of the work, and the sale, because a
 * picture people will talk about is worth more to a buyer.
 *
 * ## THE REST OF THIS HEADER USED TO SAY NOTHING MOVES, AND THAT IS NOW FALSE
 *
 * It read: "All six are written once, by `seedReputation`, and nothing in the
 * engine writes to a person’s `reputation` again — one assignment, at bootstrap,
 * and no second write anywhere in `src/engine`." True when it was written, and
 * comprehensively untrue since. Every one of the seven moves now:
 *
 *   - **fame, appeal, standing and demand** drift down daily through
 *     `forgetsYou`, anchored on `reputationDriftedAt` so an idle save does not
 *     decay faster than a played one, and up off work done
 *   - **reliability** moves every working week through `whatTheWeekTook`, three
 *     off against one back, and heals toward `RELIABILITY_RESTS_AT` while resting
 *   - **controversy** is raised by a week that goes badly and fades slower than it
 *     arrives
 *   - **prestige** is moved by the year’s judgement and fades about four points a
 *     year
 *
 * Measured over twenty-five played years with the house kept up: standing reaches
 * 53 and 61 on two seeds, reliability 72 and 73, fame 23 and 48. So these looks
 * say what each figure counts and what has actually moved it, which is what they
 * were always for — the difference is that there is now something to say.
 */

import { performerNoun } from '@/engine/core/performer';
import type { Person, Reputation } from '@/engine/domain/model';
import { Stat } from '@/ui/components/primitives';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { isAre, outOf, spokenList } from './words';

type FigureKey = keyof Reputation;

interface Figure {
  key: FigureKey;
  /** The world’s word for it, Title Case. */
  name: string;
  /** The same thing said inside a sentence. */
  short: string;
  /** What is behind the name, for the line on a way in. */
  behind: string;
  /** The same thing again, short enough to sit under a figure. */
  note: string;
  /** What the figure counts, if it ever moved. */
  means: string;
  /** Where this particular number came from, and what has touched it since. */
  since: string;
  /** One footnote line at the foot of the figure. */
  provenance: string;
  /** Whether any screen in the game has ever printed it. */
  shown: boolean;
}

/** Where a figure worked out from the career came from, said once. */
const FROM_A_CAREER =
  'It was worked out on your first morning from a single number — how far along the acting career already was — '
  + 'and nothing ever asked you that, so it stood at five in a hundred and this is what five came to. '
  + 'It hasn’t moved since, and it can’t yet: there’s no work, no notice and nobody keeping score.';

/** The seven, in the order a person would ask about them. */
const FIGURES: readonly Figure[] = [
  {
    key: 'publicFame',
    name: 'Public Fame',
    short: 'public fame',
    behind: 'it says whether a stranger knows the name',
    note: 'Whether a stranger knows the name',
    means: 'It counts how many people know who you are. Not whether they like you and not whether they rate the work — only whether the name lands when somebody hears it.',
    since: FROM_A_CAREER,
    provenance: 'Nought to a hundred, set on the first morning from how far along the career was, and untouched by any day since.',
    shown: true,
  },
  {
    key: 'audienceAppeal',
    name: 'Audience Appeal',
    short: 'audience appeal',
    behind: 'it says whether the people who know you like you',
    note: 'Whether the people who know you like you',
    means: 'It counts whether the people who do know you warm to you. Fame and appeal come apart all the time, and a career can run on either one alone.',
    since: 'Your character didn’t set this one. It was written flat at fifty, the same fifty everybody starts on, and fifty is the world declining to hold an opinion. Nobody has since had cause to form one.',
    provenance: 'Nought to a hundred. Left level at the start, and no screen in the game has ever shown it to you.',
    shown: false,
  },
  {
    key: 'professionalReputation',
    name: 'Professional Reputation',
    short: 'professional reputation',
    behind: 'it says what the people who hire think of the work',
    note: 'What the people who hire make of the work',
    means: 'It’s what the business makes of the work itself — the people who cast and the people who pay, not the people who watch.',
    since: FROM_A_CAREER,
    provenance: 'Nought to a hundred, set on the first morning from how far along the career was, and untouched by any day since.',
    shown: true,
  },
  {
    key: 'reliability',
    name: 'Reliability',
    short: 'reliability',
    behind: 'it says whether a producer believes you’ll finish',
    note: 'Whether a producer believes you’ll finish',
    means: 'It’s whether whoever hires you believes you’ll finish what you signed for. It moves slower than the rest of these and it’s worth more than it sounds.',
    since: 'It’s the only figure here taken from you instead of from a career you haven’t had: a flat fifty-five, plus a fifth of how conscientious you are. The game hasn’t tested it since.',
    provenance: 'Nought to a hundred. Fifty-five to start with, plus a fifth of how conscientious you are, and nothing in the game has tested it since.',
    shown: false,
  },
  {
    key: 'industryDemand',
    name: 'Industry Demand',
    short: 'industry demand',
    behind: 'it says how many people want you this week',
    note: 'How many people want you this week',
    means: 'It counts how many people want to hire you right now — the only one of the seven about this week instead of a whole record.',
    since: FROM_A_CAREER,
    provenance: 'Nought to a hundred, set on the first morning from how far along the career was, and untouched by any day since.',
    shown: true,
  },
  {
    key: 'prestige',
    name: 'Standing With The Industry',
    short: 'standing with the industry',
    behind: 'it says whether the work is thought well of',
    note: 'Whether the work is thought well of',
    means: 'It’s what the people who give things out make of the work — not whether it sold and not whether anybody watched, but whether it was any good. A season names five things a year and gives one of them the award.',
    since: 'It starts at nothing for everybody, because nothing has been said about work nobody has done yet. Being named moves it, winning moves it more, and it fades if nothing follows.',
    provenance: 'Nought to a hundred. Moved by the year’s judgement, read by what an office thinks of you and by what a buyer pays, and fading about four points a year.',
    shown: false,
  },
  {
    key: 'controversy',
    name: 'Controversy',
    short: 'controversy',
    behind: 'it says how much of what’s said is the bad kind',
    note: 'How much of what’s said is the bad kind',
    means: 'It’s live bad attention — what’s being said about you that you’d rather wasn’t. It comes off on its own, slowly, and never all at once.',
    since: 'It started at nothing, the way everybody’s does, and nothing has been said about you since to put anything on it.',
    provenance: 'Nought to a hundred, starting at nothing and decaying slowly. No screen in the game has ever shown it to you.',
    shown: false,
  },
];

/** The three the game already prints, and the four it never has. */
const SHOWN = FIGURES.filter((f) => f.shown);
const UNSHOWN = FIGURES.filter((f) => !f.shown);

const SMALL = ['nought', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'] as const;

/** A figure the way a person says it: words under ten, numerals above. */
function spokenFigure(value: number): string {
  const n = Math.round(value);
  return n >= 0 && n < SMALL.length ? SMALL[n]! : String(n);
}

const opening = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

const valueOf = (rep: Reputation, key: FigureKey): number => Math.round(rep[key]);

const figureOf = (key: string): Figure | undefined => FIGURES.find((f) => f.key === key);

const playerIn = (people: Record<string, Person | undefined>, id: string): Person | undefined => people[id];

// ---------------------------------------------------------------------------
// Standing — the seven gathered
// ---------------------------------------------------------------------------

interface Standing { person: Person; reputation: Reputation }

defineLook<Standing>('reputation', {
  gone: 'There’s nobody here to have a standing.',
  resolve: (sim, id) => {
    const person = playerIn(sim.universe.people, id || sim.universe.playerId);
    return person ? { person, reputation: person.reputation } : undefined;
  },
  seeds: (sim) => [sim.universe.playerId],
  look: ({ person, reputation }) => ({
    name: 'Standing',
    kind: 'Where You Stand',
    parent: at('person', person.id),
    summary: standingSummary(reputation),
    body: standingBody(person, reputation),
    ways: FIGURES.map((figure): Way => ({
      to: at('standing', figure.key),
      label: figure.name,
      detail: `${outOf(valueOf(reputation, figure.key))}, and ${figure.behind}`,
    })),
    provenance: 'Seven figures, all written on your first morning, none of them moved since. SLATE doesn’t keep score of you yet.',
  }),
});

/** Where the seven come to, in one sentence, right now. */
function standingSummary(rep: Reputation): string {
  if (rep.controversy >= 25) {
    return `Controversy is at ${valueOf(rep, 'controversy')}, and what’s being said about you is louder today than anything you’ve done.`;
  }
  const front = SHOWN.map((f) => valueOf(rep, f.key));
  if (Math.max(...front) < 5) {
    return `You’re a stranger to the business — ${spokenList([
      'nobody knows the name',
      'nobody has seen the work',
      'nobody is asking for you',
    ])}.`;
  }
  const ranked = FIGURES
    .filter((f) => f.key !== 'controversy')
    .slice()
    .sort((a, b) => valueOf(rep, b.key) - valueOf(rep, a.key));
  const lead = ranked[0]!;
  const rest = ranked.slice(1, 3).map((f) => `${f.short} at ${valueOf(rep, f.key)}`);
  return `${lead.name} at ${valueOf(rep, lead.key)} is the strongest thing you have, and ${spokenList(rest)} ${isAre(rest.length)} what comes after it.`;
}

/** What the seven are, and which of them you have never been shown. */
function standingBody(person: Person, rep: Reputation) {
  const noun = performerNoun(person).toLowerCase();
  const moved = FIGURES.filter((f) => valueOf(rep, f.key) > 0);
  return (
    <>
      <p className="small">
        You’re an {noun} with nothing behind you yet, so all seven of these are numbers you were handed
        rather than numbers you’ve earned. {moved.length === 0
          ? 'Every one of them sits at nothing.'
          : `Only ${spokenList(moved.map((f) => f.short))} ${isAre(moved.length)} above nothing at all.`}
      </p>
      <p className="small">
        Four of the seven — {spokenList(UNSHOWN.map((f) => f.short))} — have never been printed on any screen
        in this game, and they’re as real as the three that have.
      </p>
      <div className="grid grid-4">
        {UNSHOWN.map((figure) => (
          <Stat
            key={figure.key}
            label={figure.name}
            value={<span className="mono">{valueOf(rep, figure.key)}</span>}
            note={figure.note}
            look={at('standing', figure.key)}
          />
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// One of the seven
// ---------------------------------------------------------------------------

interface Figured { person: Person; figure: Figure; value: number }

defineLook<Figured>('standing', {
  gone: 'That isn’t something the business keeps a figure on any more.',
  resolve: (sim, id) => {
    const person = playerIn(sim.universe.people, sim.universe.playerId);
    const figure = figureOf(id);
    if (!person || !figure) return undefined;
    return { person, figure, value: valueOf(person.reputation, figure.key) };
  },
  seeds: () => FIGURES.map((f) => f.key),
  look: ({ person, figure, value }) => ({
    name: figure.name,
    kind: 'One Of Seven',
    parent: at('reputation', person.id),
    summary: sentenceFor(figure.key, value),
    body: (
      <>
        <p className="small">{figure.means}</p>
        <p className="small">{figure.since}</p>
      </>
    ),
    provenance: figure.provenance,
  }),
});

/** What this figure, at this number, actually means today. */
function sentenceFor(key: FigureKey, value: number): string {
  const n = Math.round(value);
  const said = opening(spokenFigure(n));
  switch (key) {
    case 'publicFame':
      return n < 3 ? `${said}. Nobody who hasn’t met you has heard the name.`
        : n < 25 ? `${said}. A few people would place you, and none of them quickly.`
          : n < 60 ? `${said}. Enough people know the face that a room changes a little when you walk into it.`
            : `${said}. You’re recognized nearly everywhere, and it costs you about what it buys you.`;
    case 'audienceAppeal':
      return n < 35 ? `${said}. The people who know the work mostly don’t warm to it.`
        : n < 55 ? `${said}. Level — nobody has seen enough of you to decide how they feel.`
          : n < 75 ? `${said}. The people who know you like you, and they say so out loud.`
            : `${said}. People are fond of you. That’s the hardest of these to buy and the easiest to spend.`;
    case 'professionalReputation':
      return n < 5 ? `${said}. There’s no body of work for anybody in the business to have an opinion about.`
        : n < 30 ? `${said}. A handful of people who’ve worked with you’d vouch for you.`
          : n < 65 ? `${said}. Casting knows the name, and knows it’s safe.`
            : `${said}. The work speaks before you do.`;
    case 'reliability':
      return n < 40 ? `${said}. A producer would want a minder on you.`
        : n < 70 ? `${said}. You’ve given nobody reason to doubt you’d finish, and nobody reason to be sure of it either.`
          : `${said}. Whoever hires you can stop wondering whether you’ll turn up.`;
    case 'industryDemand':
      return n < 5 ? `${said}. Nobody is trying to hire you this morning.`
        : n < 35 ? `${said}. The phone rings, but not often.`
          : n < 70 ? `${said}. There’s more being offered than you can take.`
            : `${said}. Everybody wants you, and the only question left is which one to say yes to.`;
    case 'prestige':
      return n < 3 ? `${said}. None of the work has been named for anything.`
        : n < 25 ? `${said}. One or two people have noticed, and it hasn’t traveled.`
          : n < 60 ? `${said}. The work is thought well of by people who have never met you.`
            : `${said}. You’re one of the people the business points at when it wants to say it’s any good.`;
    case 'controversy':
      return n < 3 ? `${said}. There’s nothing hanging over you and nothing anybody could run.`
        : n < 30 ? `${said}. Something’s being said quietly, and it hasn’t reached anybody who matters.`
          : `${said}. It’s the first thing said about you, and it’ll be a long time going quiet.`;
    default:
      return `${said}.`;
  }
}
