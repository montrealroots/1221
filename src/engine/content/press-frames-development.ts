/**
 * SLATE — the development desk.
 *
 * Everything that happens to a picture before a camera turns: it is set up, it
 * is greenlit, somebody attaches, somebody is cast, the rights change hands,
 * or it dies on the shelf.
 *
 * A frame declares what it needs and is never chosen without it, so no piece
 * ever names a director the story does not have.
 */

import { formatMoney, formatMoneyCompact } from '../core/money';
import type { Frame, StoryKind } from './press-story';
import {
  CAREER_STEADY, CAREER_TURN, CAREER_UP, CONFIRMED, HOW_LONG, MARKET_MOOD, MOOD_SENTENCE, RISK,
  SIZE_BIG, SIZE_MID, SIZE_SMALL, SOON, SOURCED, STRATEGY, UNCONFIRMED, WHEN,
  article, list, one,
} from './press-phrases';

/** The size band a budget falls in, in the words a piece would use. */
export function sizeBank(budget: number | undefined): readonly string[] {
  if (budget === undefined) return SIZE_MID;
  if (budget >= 80_000_000_00) return SIZE_BIG;
  if (budget >= 12_000_000_00) return SIZE_MID;
  return SIZE_SMALL;
}

/** The company a piece would name, whichever kind of company it is. */
export function house(f: { studio?: string; network?: string; distributor?: string }): string {
  return f.studio ?? f.network ?? f.distributor ?? 'an independent financier';
}

export const DEV_HEADLINES: Partial<Record<StoryKind, Frame[]>> = {
  setup: [
    { needs: ['title', 'studio'], write: (f) => `${f.studio} Takes On ${f.title}` },
    { needs: ['title', 'studio'], write: (f) => `${f.title} Lands At ${f.studio}` },
    { needs: ['title'], write: (f) => `${f.title} Is Set Up` },
    { needs: ['title', 'director'], write: (f) => `${f.director} Sets Up ${f.title}` },
    { needs: ['title', 'studio'], write: (f) => `${f.studio} Buys Into ${f.title}` },
    { needs: ['title', 'genres'], write: (f) => `A ${f.genres?.[0] ?? 'Drama'} Picture Called ${f.title} Finds A Home` },
    { needs: ['title', 'studio', 'budget'], write: (f) => `${f.studio} Puts ${formatMoneyCompact(f.budget!)} Behind ${f.title}` },
  ],
  greenlight: [
    { needs: ['title'], write: (f) => `${f.title} Is A Go` },
    { needs: ['title', 'studio'], write: (f) => `${f.studio} Greenlights ${f.title}` },
    { needs: ['title', 'budget'], write: (f) => `${f.title} Greenlit At ${formatMoneyCompact(f.budget!)}` },
    { needs: ['title'], write: (f) => `The Money Is In On ${f.title}` },
    { needs: ['title', 'director'], write: (f) => `${f.director} Gets To Make ${f.title}` },
    { needs: ['title', 'studio'], write: (f) => `${f.studio} Pulls The Trigger On ${f.title}` },
    { needs: ['title'], write: (f) => `${f.title} Moves Into Prep` },
  ],
  attachment: [
    { needs: ['person', 'title'], write: (f) => `${f.person} Attaches To ${f.title}` },
    { needs: ['person', 'title', 'personRole'], write: (f) => `${f.person} Will ${f.personRole === 'director' ? 'Direct' : f.personRole === 'composer' ? 'Score' : f.personRole === 'cinematographer' ? 'Shoot' : 'Produce'} ${f.title}` },
    { needs: ['person', 'title'], write: (f) => `${f.title} Gets ${f.person}` },
    { needs: ['person', 'title'], write: (f) => `${f.person} Boards ${f.title}` },
    { needs: ['person', 'studio'], write: (f) => `${f.person} In Business With ${f.studio}` },
    { needs: ['person', 'title', 'priorWork'], write: (f) => `${f.priorWork} Director ${f.person} Takes On ${f.title}` },
  ],
  casting: [
    { needs: ['person', 'title'], write: (f) => `${f.person} Joins ${f.title}` },
    { needs: ['person', 'title'], write: (f) => `${f.person} Cast In ${f.title}` },
    { needs: ['person', 'title'], write: (f) => `${f.title} Casts ${f.person}` },
    { needs: ['person', 'title'], write: (f) => `${f.person} Takes The Lead In ${f.title}` },
    { needs: ['person', 'director'], write: (f) => `${f.person} Signs On For ${f.director}` },
    { needs: ['person', 'title', 'money'], write: (f) => `${f.person} Closes On ${f.title}` },
    { needs: ['person', 'cast', 'title'], write: (f) => `${f.person} Joins ${list(f.cast ?? [], 2)} On ${f.title}` },
  ],
  shelved: [
    { needs: ['title'], write: (f) => `${f.title} Is Off` },
    { needs: ['title', 'studio'], write: (f) => `${f.studio} Shelves ${f.title}` },
    { needs: ['title'], write: (f) => `${f.title} Falls Apart` },
    { needs: ['title'], write: (f) => `${f.title} Loses Its Window` },
    { needs: ['title', 'studio'], write: (f) => `${f.studio} Walks Away From ${f.title}` },
    { needs: ['title'], write: (f) => `The Plug Is Pulled On ${f.title}` },
  ],
  rights: [
    { needs: ['title'], write: (f) => `The Rights To ${f.title} Change Hands` },
    { needs: ['title', 'studio'], write: (f) => `${f.studio} Options ${f.title}` },
    { needs: ['title', 'money'], write: (f) => `${f.title} Sells For ${formatMoneyCompact(f.money!)}` },
    { needs: ['title'], write: (f) => `${f.title} Is Bought In The Room` },
    { needs: ['title', 'studio'], write: (f) => `${f.studio} Wins The Auction For ${f.title}` },
  ],
};

export const DEV_LEDES: Partial<Record<StoryKind, Frame[]>> = {
  setup: [
    {
      needs: ['title', 'studio'],
      write: (f, v, r) => `${f.studio} has taken on ${f.title}, ${one(r, SOURCED)}. The picture has been looking for a home ${one(r, HOW_LONG)}${v.clip > 0.7 ? '.' : `, and lands at a company that has been ${one(r, STRATEGY)}.`}`,
    },
    {
      needs: ['title'],
      write: (f, _v, r) => `${f.title} has found its money. ${house(f)} closed ${one(r, WHEN)}, ${one(r, UNCONFIRMED)}.`,
    },
    {
      needs: ['title', 'genres'],
      write: (f, _v, r) => `${house(f)} is behind ${f.title}, ${article(f.genres?.[0] ?? 'drama')} ${f.genres?.[0] ?? 'drama'} picture that has been circling the market ${one(r, HOW_LONG)}. It is ${one(r, sizeBank(f.budget))}.`,
    },
    {
      needs: ['title', 'director'],
      write: (f, _v, r) => `${f.director} will make ${f.title} at ${house(f)}, ${one(r, CONFIRMED)}. It is the kind of project that only moves when somebody with a name says yes to it first.`,
    },
    {
      needs: ['title', 'logline'],
      write: (f, _v, r) => `${house(f)} has picked up ${f.title}. ${f.logline} The company closed ${one(r, WHEN)}, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'budget'],
      write: (f, _v, r) => `${house(f)} has set up ${f.title} at ${formatMoneyCompact(f.budget!)}, which puts it in the range of ${one(r, sizeBank(f.budget))}. The deal closed ${one(r, WHEN)}.`,
    },
  ],
  greenlight: [
    {
      needs: ['title', 'studio', 'budget'],
      write: (f, _v, r) => `${f.studio} has greenlit ${f.title} at ${formatMoneyCompact(f.budget!)}. It is ${one(r, sizeBank(f.budget))}, and it is going ${one(r, MARKET_MOOD)}.`,
    },
    {
      needs: ['title'],
      write: (f, _v, r) => `${f.title} is going. ${house(f)} committed ${one(r, WHEN)} after ${one(r, HOW_LONG).replace(/^for /, '')} in development, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'director'],
      write: (f, _v, r) => `${f.director} has a greenlight on ${f.title}. ${house(f)} signed off ${one(r, WHEN)}, and prep starts ${one(r, SOON)}.`,
    },
    {
      needs: ['title', 'budget'],
      write: (f, _v, r) => `The money is in on ${f.title}: ${formatMoney(f.budget!, { cents: false })} against a schedule that starts ${one(r, SOON)}. ${one(r, RISK).replace(/^./, (c) => c.toUpperCase())}.`,
    },
    {
      needs: ['title', 'cast'],
      write: (f, _v, r) => `${house(f)} has greenlit ${f.title} with ${list(f.cast ?? [], 2)} attached. The picture goes ${one(r, SOON)}, ${one(r, UNCONFIRMED)}.`,
    },
    {
      needs: ['title', 'genres'],
      write: (f, _v, r) => `A greenlight for ${f.title}, ${article(f.genres?.[0] ?? 'drama')} ${(f.genres ?? []).slice(0, 2).join(' and ')} that ${house(f)} has been circling ${one(r, HOW_LONG)}.`,
    },
  ],
  attachment: [
    {
      needs: ['person', 'title', 'personRole'],
      write: (f, _v, r) => `${f.person} has attached to ${f.title} as ${f.personRole}, ${one(r, SOURCED)}. The deal closed ${one(r, WHEN)}.`,
    },
    {
      needs: ['person', 'title', 'priorWork'],
      write: (f, _v, r) => `${f.person}, who made ${f.priorWork}, is on ${f.title}. It is ${one(r, [...CAREER_UP, ...CAREER_STEADY])}, and it gives the package something it did not have ${one(r, WHEN)}.`,
    },
    {
      needs: ['person', 'title'],
      write: (f, _v, r) => `${f.title} has ${f.person}. ${one(r, CONFIRMED).replace(/^./, (c) => c.toUpperCase())} ${one(r, WHEN)}, and the rest of the package is expected ${one(r, SOON)}.`,
    },
    {
      needs: ['person', 'title', 'money'],
      write: (f, _v, r) => `${f.person} is attached to ${f.title} in a deal worth ${formatMoneyCompact(f.money!)}, ${one(r, SOURCED)}. ${one(r, UNCONFIRMED).replace(/^though /, 'The studio ').replace(/^./, (c) => c.toUpperCase())}.`,
    },
    {
      needs: ['person', 'title', 'genres'],
      write: (f, _v, r) => `${f.person} will take on ${f.title}, ${article(f.genres?.[0] ?? 'drama')} ${f.genres?.[0] ?? 'drama'} picture at ${house(f)}. It is ${one(r, CAREER_TURN)}.`,
    },
    {
      needs: ['person', 'title'],
      write: (f, _v, r) => `The package on ${f.title} is coming together. ${f.person} closed ${one(r, WHEN)}, ${one(r, UNCONFIRMED)}.`,
    },
  ],
  casting: [
    {
      needs: ['person', 'title'],
      write: (f, _v, r) => `${f.person} has been cast in ${f.title}, ${one(r, SOURCED)}. The deal closed ${one(r, WHEN)}.`,
    },
    {
      needs: ['person', 'title', 'director'],
      write: (f, _v, r) => `${f.person} will star in ${f.title} for ${f.director}. It is ${one(r, [...CAREER_UP, ...CAREER_TURN])}, and the picture starts ${one(r, SOON)}.`,
    },
    {
      needs: ['person', 'title', 'money'],
      write: (f, _v, r) => `${f.person} is in on ${f.title} at ${formatMoneyCompact(f.money!)} against the back end, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['person', 'cast', 'title'],
      write: (f, _v, r) => `${f.person} joins ${list(f.cast ?? [], 3)} on ${f.title}. The rest of the cast is expected ${one(r, SOON)}, ${one(r, UNCONFIRMED)}.`,
    },
    {
      needs: ['person', 'title', 'priorWork'],
      write: (f, _v, r) => `${f.person}, last seen in ${f.priorWork}, has taken the lead in ${f.title}. It is ${one(r, [...CAREER_STEADY, ...CAREER_UP])}.`,
    },
    {
      needs: ['person', 'title', 'genres'],
      write: (f, _v, r) => `${f.title}, ${article(f.genres?.[0] ?? 'drama')} ${f.genres?.[0] ?? 'drama'} picture at ${house(f)}, has cast ${f.person}. ${one(r, CONFIRMED).replace(/^./, (c) => c.toUpperCase())} ${one(r, WHEN)}.`,
    },
  ],
  shelved: [
    {
      needs: ['title'],
      write: (f, _v, r) => `${f.title} is not happening. ${house(f)} has stopped work on it, ${one(r, SOURCED)}, after ${one(r, HOW_LONG).replace(/^for |^since /, '')} in development.`,
    },
    {
      needs: ['title', 'note'],
      write: (f, _v, r) => `${house(f)} has shelved ${f.title}. ${f.note} The decision came ${one(r, WHEN)}.`,
    },
    {
      needs: ['title', 'budget'],
      write: (f, _v, r) => `${f.title} is off. The picture had been budgeted at ${formatMoneyCompact(f.budget!)} and had spent against that before the plug came out, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'director'],
      write: (f, _v, r) => `${f.director}'s ${f.title} has collapsed. ${one(r, CONFIRMED).replace(/^./, (c) => c.toUpperCase())} ${one(r, WHEN)}, without a reason attached.`,
    },
    {
      needs: ['title', 'cast'],
      write: (f, _v, r) => `${f.title}, which had ${list(f.cast ?? [], 2)} attached, is dead at ${house(f)}. Everyone is free, ${one(r, SOURCED)}.`,
    },
  ],
  rights: [
    {
      needs: ['title', 'money'],
      write: (f, _v, r) => `${house(f)} has bought ${f.title} for ${formatMoneyCompact(f.money!)}, ${one(r, SOURCED)}. The deal closed ${one(r, WHEN)}.`,
    },
    {
      needs: ['title'],
      write: (f, _v, r) => `The rights to ${f.title} have gone to ${house(f)} ${one(r, WHEN)}, ${one(r, UNCONFIRMED)}.`,
    },
    {
      needs: ['title', 'studio'],
      write: (f, _v, r) => `${f.studio} has optioned ${f.title}. It is ${one(r, STRATEGY)}, and it went in a room rather than in a bidding war, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'money', 'studio'],
      write: (f, _v, r) => `${f.studio} won ${f.title} at ${formatMoney(f.money!, { cents: false })} against three other bidders, ${one(r, SOURCED)}. ${one(r, MOOD_SENTENCE)} That makes the number look larger than it is.`,
    },
  ],
};

export const DEV_DETAILS: Partial<Record<StoryKind, Frame[]>> = {
  setup: [
    { needs: ['budget'], write: (f, _v, r) => `The budget is understood to be around ${formatMoneyCompact(f.budget!)}, which puts it at the ${f.budget! > 50_000_000_00 ? 'upper' : 'lower'} end of what the company has been approving. ${one(r, RISK).replace(/^./, (c) => c.toUpperCase())}.` },
    { needs: ['director', 'cast'], write: (f) => `${f.director} directs, with ${list(f.cast ?? [], 3)} attached. Nothing else about the cast has been set.` },
    { needs: ['genres', 'certificate'], write: (f) => `It is being developed as ${article(f.genres?.[0] ?? 'drama')} ${(f.genres ?? []).join(' and ')} picture rated ${f.certificate}, which narrows the audience and the marketing at once.` },
    { needs: ['logline'], write: (f) => `The pitch, as it has been going around: ${f.logline}` },
    { needs: ['writer'], write: (f, _v, r) => `${f.writer} wrote it. The draft that sold is the one that has been out ${one(r, HOW_LONG).replace(/^for |^since /, 'for ')}.` },
  ],
  greenlight: [
    { needs: ['budget', 'shootDays'], write: (f) => `The picture is boarded at ${f.shootDays} days against ${formatMoneyCompact(f.budget!)}, which is ${f.shootDays! < 35 ? 'tight' : 'comfortable'} for a film of its size.` },
    { needs: ['director', 'budget'], write: (f, _v, r) => `${f.director} is directing at ${formatMoneyCompact(f.budget!)}, the largest number they have worked with. ${one(r, RISK).replace(/^./, (c) => c.toUpperCase())}.` },
    { needs: ['cast'], write: (f) => `${list(f.cast ?? [], 3)} lead. The remaining parts go out this month.` },
    { needs: ['dateLabel'], write: (f, _v, r) => `The studio has it dated for ${f.dateLabel}, ${one(r, HEDGE_LOCAL)}.` },
    { needs: ['genres'], write: (f, _v, r) => `It is ${article(f.genres?.[0] ?? 'drama')} ${(f.genres ?? []).slice(0, 2).join(' and ')} film, which is ${one(r, STRATEGY)}.` },
  ],
  attachment: [
    { needs: ['priorWork'], write: (f) => `Their last was ${f.priorWork}. This is a different proposition entirely, and that appears to be the point.` },
    { needs: ['money'], write: (f, _v, r) => `The fee is understood to be around ${formatMoneyCompact(f.money!)}, ${one(r, UNCONFIRMED).replace(/^though /, 'though ')}.` },
    { needs: ['director', 'personRole'], write: (f) => `They join ${f.director}, who has been on the picture since it was set up, and the two have not worked together before.` },
    { needs: ['budget'], write: (f) => `The picture is budgeted at ${formatMoneyCompact(f.budget!)}, a number that only makes sense with a name in front of it.` },
    { needs: ['title', 'genres'], write: (f) => `${f.title} is ${article(f.genres?.[0] ?? 'drama')} ${(f.genres ?? []).join(' and ')} picture, which is not the territory they are known for.` },
  ],
  casting: [
    { needs: ['money'], write: (f, _v, r) => `The quote is understood to be in the region of ${formatMoneyCompact(f.money!)}, ${one(r, UNCONFIRMED)}.` },
    { needs: ['shootDays'], write: (f) => `The part is ${f.shootDays} days of work, which for a lead on a picture this size is a full commitment rather than a supporting stint.` },
    { needs: ['cast'], write: (f) => `They join ${list(f.cast ?? [], 3)}, already attached.` },
    { needs: ['director', 'priorWork'], write: (f) => `${f.director} directs. Their last together, if there had been one, would have been ${f.priorWork} — there has not, and this is the first.` },
    { needs: ['genres', 'certificate'], write: (f) => `The picture is ${(f.genres ?? []).join(' and ')}, rated ${f.certificate}, and the part is written for somebody who can carry both halves of that.` },
  ],
  shelved: [
    { needs: ['budget'], write: (f) => `The film had been budgeted at ${formatMoneyCompact(f.budget!)}. What has been spent against that is what the company writes off.` },
    { needs: ['cast'], write: (f) => `${list(f.cast ?? [], 3)} were attached, and are now not. All of them are free from today.` },
    { needs: ['note'], write: (f) => f.note! },
    { needs: ['director'], write: (f) => `${f.director} had been developing it for long enough that this is a real loss of a year rather than an inconvenience.` },
    { needs: ['dateLabel'], write: (f) => `It had been dated for ${f.dateLabel}. That slot is now empty, and the calendar around it will move.` },
  ],
  rights: [
    { needs: ['money'], write: (f) => `The purchase price is ${formatMoney(f.money!, { cents: false })} against a first-dollar structure that improves if the film gets made.` },
    { needs: ['writer'], write: (f) => `${f.writer} wrote it, and is attached to the adaptation.` },
    { needs: ['note'], write: (f) => f.note! },
    { needs: ['genres'], write: (f) => `The material is ${(f.genres ?? []).join(' and ')}, which is a harder sell now than it was two years ago and a cheaper buy for the same reason.` },
  ],
};

/** A local hedge bank, so a date-carrying sentence can qualify itself. */
const HEDGE_LOCAL: readonly string[] = [
  'which is an intention rather than a commitment',
  'though the calendar around it is not settled',
  'and the studio has moved that date once already this year',
  'which nobody in the building would call fixed',
  'for now',
];
