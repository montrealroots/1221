/**
 * SLATE — the television, awards and business desks.
 *
 * A series is renewed or it is not, a picture is nominated or it wins, a deal
 * is signed, a seat changes hands, a library is sold and a union goes out.
 * This is the half of the beat that is about companies rather than films, and
 * the registers pull furthest apart here: the same renewal is a scoop, a
 * subscriber number and an argument about what television is for.
 */

import { formatMoney, formatMoneyCompact } from '../core/money';
import type { Frame, StoryKind } from './press-story';
import { house } from './press-frames-development';
import {
  CAVEAT, CONFIRMED, HOW_LONG, MARKET_MOOD, MOOD_SENTENCE, RISK, SOON, SOURCED, STRATEGY,
  UNCONFIRMED, WHEN, count, list, one, percent,
} from './press-phrases';

export const BIZ_HEADLINES: Partial<Record<StoryKind, Frame[]>> = {
  renewal: [
    { needs: ['title'], write: (f) => `${f.title} Is Renewed` },
    { needs: ['title', 'seasons'], write: (f) => `${f.title} Gets A ${ordinal(f.seasons! + 1)} Season` },
    { needs: ['title', 'network'], write: (f) => `${f.network} Renews ${f.title}` },
    { needs: ['title', 'episodes'], write: (f) => `${f.title} Comes Back For ${count(f.episodes!, 'Episode')}` },
    { needs: ['title'], write: (f) => `${f.title} Will Be Back` },
  ],
  cancellation: [
    { needs: ['title'], write: (f) => `${f.title} Is Cancelled` },
    { needs: ['title', 'network'], write: (f) => `${f.network} Cancels ${f.title}` },
    { needs: ['title', 'seasons'], write: (f) => `${f.title} Ends After ${count(f.seasons!, 'Season')}` },
    { needs: ['title'], write: (f) => `No More ${f.title}` },
    { needs: ['title', 'network'], write: (f) => `${f.title} Will Not Return To ${f.network}` },
  ],
  ratings: [
    { needs: ['title', 'viewers'], write: (f) => `${f.title} Draws ${compactCount(f.viewers!)}` },
    { needs: ['title'], write: (f) => `Where ${f.title} Is Landing` },
    { needs: ['title', 'rank'], write: (f) => `${f.title} Sits ${f.rank === 1 ? 'First' : `${ordinal(f.rank!)}`} On The Chart` },
    { needs: ['title', 'network'], write: (f) => `${f.network} Has Its Week With ${f.title}` },
    { needs: ['title', 'viewers', 'episodes'], write: (f) => `${f.title} Holds Across ${count(f.episodes!, 'Episode')}` },
  ],
  nomination: [
    { needs: ['title', 'award'], write: (f) => `${f.title} Is Nominated At The ${f.award}` },
    { needs: ['title', 'nominations', 'award'], write: (f) => `${f.title} Takes ${count(f.nominations!, 'Nomination')}` },
    { needs: ['person', 'award', 'category'], write: (f) => `${f.person} Nominated For ${f.category}` },
    { needs: ['award', 'title'], write: (f) => `The ${f.award} Nominations: ${f.title} Leads` },
    { needs: ['title', 'award'], write: (f) => `${f.award} Recognises ${f.title}` },
  ],
  win: [
    { needs: ['title', 'award', 'category'], write: (f) => `${f.title} Wins ${f.category}` },
    { needs: ['person', 'award', 'category'], write: (f) => `${f.person} Takes ${f.category}` },
    { needs: ['title', 'award'], write: (f) => `${f.title} Wins At The ${f.award}` },
    { needs: ['title', 'nominations'], write: (f) => `${f.title} Sweeps With ${count(f.nominations!, 'Win')}` },
    { needs: ['award', 'title'], write: (f) => `The ${f.award} Goes To ${f.title}` },
  ],
  deal: [
    { needs: ['person', 'studio'], write: (f) => `${f.person} Signs With ${f.studio}` },
    { needs: ['person', 'money'], write: (f) => `${f.person} Closes A ${formatMoneyCompact(f.money!)} Deal` },
    { needs: ['person'], write: (f) => `${f.person} Is In Business` },
    { needs: ['person', 'network'], write: (f) => `${f.network} Locks Up ${f.person}` },
    { needs: ['person', 'studio'], write: (f) => `${f.studio} Gets First Look At ${f.person}` },
  ],
  executive: [
    { needs: ['executive', 'studio'], write: (f) => `${f.executive} Out At ${f.studio}` },
    { needs: ['executive', 'successor'], write: (f) => `${f.successor} Replaces ${f.executive}` },
    { needs: ['executive', 'executiveTitle'], write: (f) => `${f.executive} Leaves As ${f.executiveTitle}` },
    { needs: ['successor', 'studio'], write: (f) => `${f.studio} Names ${f.successor}` },
    { needs: ['studio'], write: (f) => `A Seat Changes At ${f.studio}` },
  ],
  library: [
    { needs: ['studio', 'money'], write: (f) => `${f.studio} Sells Its Library For ${formatMoneyCompact(f.money!)}` },
    { needs: ['studio'], write: (f) => `${f.studio} Puts Its Catalogue On The Market` },
    { needs: ['title', 'money'], write: (f) => `${f.title} Licenses For ${formatMoneyCompact(f.money!)}` },
    { needs: ['studio', 'network'], write: (f) => `${f.network} Takes The ${f.studio} Catalogue` },
    { needs: ['money'], write: (f) => `A ${formatMoneyCompact(f.money!)} Library Deal` },
  ],
  labour: [
    { needs: ['note'], write: () => 'The Business Stops' },
    { needs: ['note'], write: () => 'Talks Break Down' },
    { needs: ['note'], write: () => 'What A Shutdown Costs' },
    { needs: ['city'], write: (f) => `${f.city} Goes Quiet` },
    { needs: ['note'], write: () => 'Both Sides Return To The Table' },
  ],
  earnings: [
    { needs: ['studio', 'money'], write: (f) => `${f.studio} Posts ${formatMoneyCompact(f.money!)}` },
    { needs: ['studio'], write: (f) => `Inside The ${f.studio} Numbers` },
    { needs: ['studio', 'rank'], write: (f) => `${f.studio} Holds ${ordinal(f.rank!)} On Share` },
    { needs: ['studio', 'year'], write: (f) => `${f.studio}'s ${f.year}` },
    { needs: ['studio', 'money'], write: (f) => `${f.studio} And The ${formatMoneyCompact(f.money!)} Question` },
  ],
};

export const BIZ_LEDES: Partial<Record<StoryKind, Frame[]>> = {
  renewal: [
    {
      needs: ['title', 'network', 'seasons'],
      write: (f, _v, r) => `${f.network} has renewed ${f.title} for ${ordinal(f.seasons! + 1)} season, ${one(r, CONFIRMED)}. The show has been on the bubble ${one(r, HOW_LONG)}.`,
    },
    {
      needs: ['title', 'episodes'],
      write: (f, _v, r) => `${f.title} is coming back for ${count(f.episodes!, 'episode')}. ${house(f)} made the call ${one(r, WHEN)}, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'viewers'],
      write: (f, _v, r) => `${f.title} has a renewal on the strength of ${compactCount(f.viewers!)}, which in the current market is ${one(r, ['enough', 'more than enough', 'better than anything else on the schedule', 'the only reason it survived'])}.`,
    },
    {
      needs: ['title', 'network', 'note'],
      write: (f, _v, r) => `${f.network} will make more ${f.title}. ${f.note} ${one(r, CAVEAT)}`,
    },
    {
      needs: ['title', 'person'],
      write: (f, _v, r) => `${f.title} is renewed, and ${f.person} returns with it, ${one(r, SOURCED)}. Deals for the rest of the cast are still being closed, ${one(r, UNCONFIRMED)}.`,
    },
  ],
  cancellation: [
    {
      needs: ['title', 'network', 'seasons'],
      write: (f, _v, r) => `${f.network} has cancelled ${f.title} after ${count(f.seasons!, 'season')}. ${one(r, CONFIRMED).replace(/^./, (c) => c.toUpperCase())} ${one(r, WHEN)}.`,
    },
    {
      needs: ['title', 'viewers'],
      write: (f, _v, r) => `${f.title} is over. It finished at ${compactCount(f.viewers!)}, which is not a number that survives ${one(r, MARKET_MOOD)}.`,
    },
    {
      needs: ['title', 'network'],
      write: (f, _v, r) => `There will be no more ${f.title}. ${f.network} told the production ${one(r, WHEN)}, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'episodes', 'seasons'],
      write: (f, _v, r) => `${f.title} ends at ${count(f.seasons!, 'season')} and ${count(f.episodes!, 'episode')}. The producers are taking it out to other buyers, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'note'],
      write: (f, _v, r) => `${f.title} has been cancelled. ${f.note} ${one(r, CAVEAT)}`,
    },
  ],
  ratings: [
    {
      needs: ['title', 'viewers', 'rank'],
      write: (f, _v, r) => `${f.title} drew ${compactCount(f.viewers!)} to sit ${ordinal(f.rank!)} ${one(r, WHEN)}. ${one(r, ['The chart is tighter than it looks.', 'Nothing else on that night came close.', 'The number is up week on week.', 'It is holding where it opened.'])}`,
    },
    {
      needs: ['title', 'viewers', 'network'],
      write: (f, _v, r) => `${f.network} had ${compactCount(f.viewers!)} for ${f.title}, ${one(r, SOURCED)}. On the current schedule that is ${one(r, ['the best they have', 'their strongest hour', 'enough to build a night around', 'a result they will take'])}.`,
    },
    {
      needs: ['title', 'episodes', 'viewers'],
      write: (f, _v, r) => `Across ${count(f.episodes!, 'episode')}, ${f.title} is averaging ${compactCount(f.viewers!)}. ${one(r, CAVEAT)}`,
    },
    {
      needs: ['title', 'rank'],
      write: (f, _v, r) => `${f.title} is ${ordinal(f.rank!)} on the chart this week, which for a show in its position is ${one(r, ['a surprise', 'about right', 'better than the network expected', 'the whole argument for renewing it'])}.`,
    },
  ],
  nomination: [
    {
      needs: ['title', 'award', 'nominations'],
      write: (f, _v, r) => `${f.title} took ${count(f.nominations!, 'nomination')} at the ${f.award}, ${one(r, WHEN)}. ${one(r, ['It leads the field.', 'That is more than anybody expected.', 'It is in every major category.', 'The campaign has done its work.'])}`,
    },
    {
      needs: ['person', 'award', 'category'],
      write: (f, _v, r) => `${f.person} is nominated for ${f.category} at the ${f.award}. It is ${one(r, ['a first', 'their second', 'the recognition the work has been waiting for', 'overdue by any reading'])}, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'award', 'criticScore'],
      write: (f, _v, r) => `${f.title}, which reviewed at ${Math.round(f.criticScore!)}, is nominated at the ${f.award}. ${f.criticScore! >= 75 ? 'Nobody is surprised.' : 'Not everybody saw that coming.'} ${one(r, CAVEAT)}`,
    },
    {
      needs: ['title', 'award', 'studio'],
      write: (f, _v, r) => `${f.studio} has ${f.title} in at the ${f.award}. ${one(r, STRATEGY).replace(/^./, (c) => c.toUpperCase())}, and the campaign spend now roughly doubles.`,
    },
  ],
  win: [
    {
      needs: ['title', 'award', 'category'],
      write: (f, _v, r) => `${f.title} won ${f.category} at the ${f.award} ${one(r, WHEN)}. ${one(r, ['It was the favourite.', 'It was not the favourite.', 'The room had it as a coin toss.', 'That settles the season.'])}`,
    },
    {
      needs: ['person', 'award', 'category'],
      write: (f, _v, r) => `${f.person} has won ${f.category} at the ${f.award}. ${one(r, ['A first.', 'Their second.', 'It has been a long campaign.', 'The speech was short.'])} ${one(r, CAVEAT)}`,
    },
    {
      needs: ['title', 'award', 'nominations'],
      write: (f, _v, r) => `${f.title} finished the ${f.award} with ${count(f.nominations!, 'win')}. ${one(r, ['A sweep in everything but name.', 'It did not lose a category it was expected to take.', 'Nothing else got near it.', 'The night belonged to one picture.'])}`,
    },
    {
      needs: ['title', 'award', 'studio'],
      write: (f, _v, r) => `${f.studio} has a ${f.award} winner in ${f.title}, ${one(r, WHEN)}. What that is worth commercially is ${one(r, ['considerable', 'less than it used to be', 'measurable in a re-release', 'entirely dependent on the category'])}.`,
    },
  ],
  deal: [
    {
      needs: ['person', 'studio', 'money'],
      write: (f, _v, r) => `${f.person} has signed with ${f.studio} in a deal ${one(r, SOURCED)} to be worth around ${formatMoneyCompact(f.money!)}. It runs ${one(r, ['two years', 'three years', 'four years', 'through the end of the decade'])}.`,
    },
    {
      needs: ['person', 'studio'],
      write: (f, _v, r) => `${f.studio} is in business with ${f.person}. The deal is a ${one(r, ['first-look', 'overall', 'exclusive first-look', 'non-exclusive first-look'])}, ${one(r, CONFIRMED)}.`,
    },
    {
      needs: ['person', 'network', 'money'],
      write: (f, _v, r) => `${f.network} has locked up ${f.person} at ${formatMoney(f.money!, { cents: false })}, ${one(r, SOURCED)}. ${one(r, RISK).replace(/^./, (c) => c.toUpperCase())}.`,
    },
    {
      needs: ['person', 'priorWork'],
      write: (f, _v, r) => `${f.person}, who made ${f.priorWork}, has a new home. ${house(f)} closed ${one(r, WHEN)}, ${one(r, UNCONFIRMED)}.`,
    },
  ],
  executive: [
    {
      needs: ['executive', 'studio', 'executiveTitle'],
      write: (f, _v, r) => `${f.executive} is leaving ${f.studio}, where they were ${f.executiveTitle}. ${one(r, CONFIRMED).replace(/^./, (c) => c.toUpperCase())} ${one(r, WHEN)}${f.successor ? `, with ${f.successor} stepping in` : ''}.`,
    },
    {
      needs: ['successor', 'studio'],
      write: (f, _v, r) => `${f.studio} has named ${f.successor} to the job. It is ${one(r, ['an internal promotion', 'a hire from outside', 'the safe choice', 'a genuine surprise'])}, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['executive', 'studio'],
      write: (f, _v, r) => `A seat has changed at ${f.studio}. ${f.executive} is out ${one(r, WHEN)}, and what that means for the slate is the question everybody in town is asking, ${one(r, UNCONFIRMED)}.`,
    },
    {
      needs: ['executive', 'note'],
      write: (f, _v, r) => `${f.executive} is going. ${f.note} ${one(r, CAVEAT)}`,
    },
  ],
  library: [
    {
      needs: ['studio', 'money'],
      write: (f, _v, r) => `${f.studio} has sold its catalogue for ${formatMoney(f.money!, { cents: false })}, ${one(r, SOURCED)}. Libraries have been the only reliably valuable thing in this business ${one(r, HOW_LONG)}.`,
    },
    {
      needs: ['title', 'money', 'network'],
      write: (f, _v, r) => `${f.network} has taken ${f.title} for ${formatMoneyCompact(f.money!)} on an exclusive window, ${one(r, SOURCED)}. ${one(r, CAVEAT)}`,
    },
    {
      needs: ['studio', 'network'],
      write: (f, _v, r) => `${f.network} is taking the ${f.studio} catalogue, ${one(r, CONFIRMED)}. The terms are not being disclosed and the window is understood to run ${one(r, ['five years', 'seven years', 'a decade', 'in perpetuity'])}.`,
    },
    {
      needs: ['money'],
      write: (f, _v, r) => `A library has changed hands for ${formatMoney(f.money!, { cents: false })} ${one(r, WHEN)}. ${one(r, MOOD_SENTENCE)} Back catalogue is what everybody is actually buying.`,
    },
  ],
  labour: [
    {
      needs: ['note'],
      write: (f, _v, r) => `${f.note} Talks broke down ${one(r, WHEN)}, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['note', 'city'],
      write: (f, _v, r) => `${f.note} Production in and around ${f.city} has stopped, and nobody involved will say for how long, ${one(r, UNCONFIRMED)}.`,
    },
    {
      needs: ['note', 'money'],
      write: (f, _v, r) => `${f.note} The cost to the local economy is being put at ${formatMoneyCompact(f.money!)} a week, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['note'],
      write: (f, _v, r) => `Both sides are back at the table. ${f.note} A deal is expected ${one(r, SOON)}, ${one(r, UNCONFIRMED)}.`,
    },
  ],
  earnings: [
    {
      needs: ['studio', 'money', 'year'],
      write: (f, _v, r) => `${f.studio} finished ${f.year} on ${formatMoney(f.money!, { cents: false })}. ${one(r, MOOD_SENTENCE)} By that standard it is ${one(r, ['a result', 'not a result', 'better than the year before', 'worse than it looks'])}.`,
    },
    {
      needs: ['studio', 'rank', 'money'],
      write: (f, _v, r) => `${f.studio} holds ${ordinal(f.rank!)} on market share with ${formatMoneyCompact(f.money!)}. ${one(r, STRATEGY).replace(/^./, (c) => c.toUpperCase())}, and the mix behind that number matters more than the number.`,
    },
    {
      needs: ['studio', 'money'],
      write: (f, _v, r) => `${f.studio} has reported ${formatMoneyCompact(f.money!)}. ${one(r, RISK).replace(/^./, (c) => c.toUpperCase())}, and the slate for next year does not obviously fix it.`,
    },
    {
      needs: ['studio', 'note'],
      write: (f, _v, r) => `${f.studio}'s numbers are out. ${f.note} ${one(r, CAVEAT)}`,
    },
  ],
};

export const BIZ_DETAILS: Partial<Record<StoryKind, Frame[]>> = {
  renewal: [
    { needs: ['episodes', 'seasons'], write: (f) => `${count(f.episodes!, 'episode')} for ${ordinal(f.seasons! + 1)} season, which is ${f.episodes! >= 13 ? 'a full order' : 'a short one'}.` },
    { needs: ['viewers'], write: (f) => `It is averaging ${compactCount(f.viewers!)}.` },
    { needs: ['money'], write: (f) => `The per-episode cost is understood to be around ${formatMoneyCompact(f.money!)}, and it went up with the renewal.` },
    { needs: ['person'], write: (f) => `${f.person} returns. The rest of the regulars are being renegotiated one at a time, which is how a cast gets expensive.` },
    { needs: ['note'], write: (f) => f.note! },
  ],
  cancellation: [
    { needs: ['seasons', 'episodes'], write: (f) => `${count(f.seasons!, 'season')}, ${count(f.episodes!, 'episode')}. That is enough for a syndication package, which is the only consolation on offer.` },
    { needs: ['viewers'], write: (f) => `It finished averaging ${compactCount(f.viewers!)}.` },
    { needs: ['money'], write: (f) => `At around ${formatMoneyCompact(f.money!)} an episode it was never cheap, and cheap is what survives at the moment.` },
    { needs: ['network'], write: (f) => `${f.network} has three holes in the schedule now and nothing obvious to fill them with.` },
    { needs: ['note'], write: (f) => f.note! },
  ],
  ratings: [
    { needs: ['viewers', 'rank'], write: (f) => `${compactCount(f.viewers!)}, ${ordinal(f.rank!)} for the week.` },
    { needs: ['episodes'], write: (f) => `That is across ${count(f.episodes!, 'episode')} so far.` },
    { needs: ['network'], write: (f) => `${f.network} counts these differently from everybody else, which is worth remembering before comparing them.` },
    { needs: ['note'], write: (f) => f.note! },
  ],
  nomination: [
    { needs: ['nominations', 'award'], write: (f) => `${count(f.nominations!, 'nomination')} at the ${f.award}, including the categories that carry the rest.` },
    { needs: ['category', 'person'], write: (f) => `${f.person} is in for ${f.category}.` },
    { needs: ['criticScore'], write: (f) => `It reviewed at ${Math.round(f.criticScore!)}, which is roughly where nominated pictures sit and nowhere near where winners usually do.` },
    { needs: ['studio'], write: (f) => `${f.studio} runs the campaign from here, and campaigns cost more than most of the films they are run for.` },
    { needs: ['runningTotal'], write: (f) => `It has ${formatMoneyCompact(f.runningTotal!)} in the bank, and a nomination is worth a re-release.` },
  ],
  win: [
    { needs: ['category', 'award'], write: (f) => `${f.category} at the ${f.award}.` },
    { needs: ['nominations'], write: (f) => `${count(f.nominations!, 'win')} on the night.` },
    { needs: ['runningTotal'], write: (f) => `The picture has ${formatMoneyCompact(f.runningTotal!)} and will add to it on the back of this.` },
    { needs: ['person', 'priorWork'], write: (f) => `${f.person} was nominated for ${f.priorWork} and did not win. This one they did.` },
    { needs: ['note'], write: (f) => f.note! },
  ],
  deal: [
    { needs: ['money'], write: (f) => `The number being discussed is ${formatMoney(f.money!, { cents: false })}, which nobody on either side will confirm.` },
    { needs: ['priorWork'], write: (f) => `Their last was ${f.priorWork}, and that is what they are being paid for.` },
    { needs: ['studio'], write: (f) => `${f.studio} has been signing this kind of deal all year, and the market rate has moved as a result.` },
    { needs: ['note'], write: (f) => f.note! },
  ],
  executive: [
    { needs: ['executiveTitle', 'executive'], write: (f) => `${f.executive} had been ${f.executiveTitle} and leaves with the slate half-set, which is the worst possible moment for everybody on it.` },
    { needs: ['successor'], write: (f) => `${f.successor} takes over. Whether the pictures in development survive the handover is the only question that matters to the people making them.` },
    { needs: ['studio'], write: (f) => `${f.studio} has changed this seat twice in five years.` },
    { needs: ['note'], write: (f) => f.note! },
  ],
  library: [
    { needs: ['money'], write: (f) => `${formatMoney(f.money!, { cents: false })}, which values the catalogue at a multiple the market has not seen for a while.` },
    { needs: ['studio', 'network'], write: (f) => `${f.studio} keeps the negatives; ${f.network} gets the window. That distinction is worth more than the headline number.` },
    { needs: ['title'], write: (f) => `${f.title} is the title the deal was really about.` },
    { needs: ['note'], write: (f) => f.note! },
  ],
  labour: [
    { needs: ['money'], write: (f) => `The estimate is ${formatMoneyCompact(f.money!)} a week out of the local economy, and that is before anything downstream.` },
    { needs: ['city'], write: (f) => `${f.city} carries a disproportionate share of the work, and a disproportionate share of the loss.` },
    { needs: ['note'], write: (f) => f.note! },
  ],
  earnings: [
    { needs: ['money', 'year'], write: (f) => `${formatMoney(f.money!, { cents: false })} for ${f.year}.` },
    { needs: ['rank'], write: (f) => `${ordinal(f.rank!)} on share, which is a position, not a strategy.` },
    { needs: ['title'], write: (f) => `${f.title} did most of the heavy lifting.` },
    { needs: ['note'], write: (f) => f.note! },
  ],
};

/** '1st', '2nd', '3rd', and the rest. */
export function ordinal(n: number): string {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

/** A viewer count the way a chart prints it. */
export function compactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}m viewers`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k viewers`;
  return count(n, 'viewer');
}

void percent;
void list;
