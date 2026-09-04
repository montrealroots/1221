/**
 * SLATE — the release desk.
 *
 * A picture premieres, the notices land, it opens, it holds or it does not,
 * and once in a while it does something nothing has done before. This is the
 * part of the beat with real numbers in it, and the register decides how much
 * of a piece is number and how much is opinion.
 */

import { formatMoney, formatMoneyCompact } from '../core/money';
import type { Frame, StoryKind } from './press-story';
import { house } from './press-frames-development';
import { readsBank, toneBank } from './press-frames-production';
import {
  CAVEAT, MOOD_SENTENCE, SOURCED, TONE_BAD, TONE_GOOD, TONE_MIXED, WHEN,
  count, list, one, percent,
} from './press-phrases';

/** How a weekend reads against what it cost. */
function verdictOf(opening: number | undefined, budget: number | undefined): string {
  if (opening === undefined || budget === undefined || budget <= 0) return 'hard to read';
  const ratio = opening / budget;
  if (ratio >= 0.85) return 'an enormous start';
  if (ratio >= 0.5) return 'a strong start';
  if (ratio >= 0.3) return 'a workable start';
  if (ratio >= 0.15) return 'a soft start';
  return 'a disaster';
}

export const REL_HEADLINES: Partial<Record<StoryKind, Frame[]>> = {
  festival_premiere: [
    { needs: ['title', 'festival'], write: (f) => `${f.title} Premieres At ${f.festival}` },
    { needs: ['title', 'festival'], write: (f) => `${f.festival} Opens With ${f.title}` },
    { needs: ['title', 'festival'], write: (f) => `${f.title} Plays ${f.festival}` },
    { needs: ['title', 'director', 'festival'], write: (f) => `${f.director} Brings ${f.title} To ${f.festival}` },
    { needs: ['title', 'city'], write: (f) => `${f.title} Screens In ${f.city}` },
  ],
  reviews: [
    { needs: ['title', 'criticScore'], write: (f) => `${f.title} Reviewed: ${Math.round(f.criticScore!)} Out Of 100` },
    { needs: ['title'], write: (f) => `The Notices Are In On ${f.title}` },
    { needs: ['title', 'criticScore'], write: (f) => `Critics ${f.criticScore! >= 65 ? 'Are With' : f.criticScore! >= 45 ? 'Are Split On' : 'Are Not With'} ${f.title}` },
    { needs: ['title', 'reviewCount'], write: (f) => `${f.title} Lands With ${count(f.reviewCount!, 'Review')}` },
    { needs: ['title', 'director'], write: (f) => `What They Are Saying About ${f.director}'s ${f.title}` },
  ],
  opening: [
    { needs: ['title', 'opening'], write: (f) => `${f.title} Opens To ${formatMoneyCompact(f.opening!)}` },
    { needs: ['title', 'opening'], write: (f) => `${formatMoneyCompact(f.opening!)} For ${f.title}` },
    { needs: ['title'], write: (f) => `${f.title} Takes The Weekend` },
    { needs: ['title', 'opening', 'budget'], write: (f) => `${f.title} Opens ${f.opening! >= f.budget! * 0.5 ? 'Strong' : 'Soft'}` },
    { needs: ['title', 'theatres'], write: (f) => `${f.title} Opens In ${count(f.theatres!, 'Theatre')}` },
    { needs: ['title', 'studio', 'opening'], write: (f) => `${f.studio} Gets ${formatMoneyCompact(f.opening!)} From ${f.title}` },
  ],
  hold: [
    { needs: ['title', 'dropPercent'], write: (f) => `${f.title} Holds At ${percent(100 - f.dropPercent!)}` },
    { needs: ['title'], write: (f) => `${f.title} Is Holding` },
    { needs: ['title', 'runningTotal'], write: (f) => `${f.title} Passes ${formatMoneyCompact(f.runningTotal!)}` },
    { needs: ['title', 'weekendGross'], write: (f) => `${f.title} Adds ${formatMoneyCompact(f.weekendGross!)}` },
    { needs: ['title', 'multiple'], write: (f) => `${f.title} Is Running At A ${f.multiple!.toFixed(1)} Multiple` },
  ],
  collapse: [
    { needs: ['title', 'dropPercent'], write: (f) => `${f.title} Drops ${percent(f.dropPercent!)}` },
    { needs: ['title'], write: (f) => `${f.title} Falls Off` },
    { needs: ['title'], write: (f) => `The Bottom Goes Out Of ${f.title}` },
    { needs: ['title', 'studio'], write: (f) => `${f.studio} Will Not Recoup On ${f.title}` },
    { needs: ['title', 'runningTotal', 'budget'], write: (f) => `${f.title} Stalls At ${formatMoneyCompact(f.runningTotal!)}` },
  ],
  record: [
    { needs: ['title', 'note'], write: (f) => `${f.title} Sets A Record` },
    { needs: ['title', 'opening'], write: (f) => `${f.title} Posts The Biggest Opening On Record` },
    { needs: ['title', 'runningTotal'], write: (f) => `${f.title} Goes Past ${formatMoneyCompact(f.runningTotal!)}` },
    { needs: ['title'], write: (f) => `Nothing Has Done What ${f.title} Just Did` },
    { needs: ['title', 'studio'], write: (f) => `${f.studio} Has Its Biggest Ever In ${f.title}` },
  ],
};

export const REL_LEDES: Partial<Record<StoryKind, Frame[]>> = {
  festival_premiere: [
    {
      needs: ['title', 'festival', 'director'],
      write: (f, _v, r) => `${f.director}'s ${f.title} had its premiere at ${f.festival} ${one(r, WHEN)}. What the room made of it is the first real reading anybody has had.`,
    },
    {
      needs: ['title', 'festival', 'criticScore'],
      write: (f, _v, r) => `${f.title} played ${f.festival} and came out of it ${one(r, readsBank(f.criticScore))}. The first notices put it at ${Math.round(f.criticScore!)}.`,
    },
    {
      needs: ['title', 'festival', 'cast'],
      write: (f, _v, r) => `${f.title}, with ${list(f.cast ?? [], 3)}, premiered at ${f.festival}. ${house(f)} is looking for a date, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'festival', 'genres'],
      write: (f, _v, r) => `${f.festival} has given ${f.title} its first audience. It is ${(f.genres ?? []).join(' and ')}, which at a festival is either an advantage or a problem and ${one(r, ['here it is the former', 'here it is the latter', 'the room seemed unsure which', 'nobody could quite decide'])}.`,
    },
    {
      needs: ['title', 'festival'],
      write: (f, _v, r) => `${f.title} screened at ${f.festival} ${one(r, WHEN)} to a reception that was ${one(r, readsBank(f.criticScore))} received.`,
    },
  ],
  reviews: [
    {
      needs: ['title', 'criticScore', 'reviewCount'],
      write: (f, _v, r) => `${f.title} is at ${Math.round(f.criticScore!)} across ${count(f.reviewCount!, 'review')}. The consensus, so far as there is one, is that it is ${one(r, toneBank(f.criticScore))}.`,
    },
    {
      needs: ['title', 'criticScore', 'audienceScore'],
      write: (f, _v, r) => `Critics have ${f.title} at ${Math.round(f.criticScore!)}; the audience has it at ${Math.round(f.audienceScore!)}. ${Math.abs(f.criticScore! - f.audienceScore!) > 18 ? 'That gap is the story.' : 'For once they agree.'} ${one(r, CAVEAT)}`,
    },
    {
      needs: ['title', 'director', 'criticScore'],
      write: (f, _v, r) => `The reviews for ${f.director}'s ${f.title} are in at ${Math.round(f.criticScore!)}, which makes it ${one(r, toneBank(f.criticScore))} by the standard of what they have made before.`,
    },
    {
      needs: ['title', 'criticScore'],
      write: (f, _v, r) => `${f.title} has landed ${one(r, readsBank(f.criticScore))}. The number, for those who want one, is ${Math.round(f.criticScore!)}.`,
    },
    {
      needs: ['title', 'cast', 'criticScore'],
      write: (f) => `The notices on ${f.title} single out ${list(f.cast ?? [], 2)} and are ${f.criticScore! >= 60 ? 'warmer' : 'colder'} about everything around them. It sits at ${Math.round(f.criticScore!)}.`,
    },
  ],
  opening: [
    {
      needs: ['title', 'opening', 'budget'],
      write: (f, _v, r) => `${f.title} opened to ${formatMoney(f.opening!, { cents: false })} against a ${formatMoneyCompact(f.budget!)} budget, which is ${verdictOf(f.opening, f.budget)}. ${one(r, MOOD_SENTENCE)} Against that, it reads better than the raw number suggests.`,
    },
    {
      needs: ['title', 'opening', 'theatres'],
      write: (f, _v, r) => `${formatMoney(f.opening!, { cents: false })} for ${f.title} from ${count(f.theatres!, 'theatre')}, a per-screen average of ${formatMoney(Math.round(f.opening! / Math.max(1, f.theatres!)), { cents: false })}. ${one(r, CAVEAT)}`,
    },
    {
      needs: ['title', 'opening', 'criticScore'],
      write: (f, _v, r) => `${f.title} took ${formatMoneyCompact(f.opening!)} on its first weekend. The reviews had it at ${Math.round(f.criticScore!)}, which ${f.criticScore! >= 60 ? 'did it no harm' : 'appears not to have mattered'}. ${one(r, ['Openings are marketing.', 'The second weekend is the one that tells you anything.', 'Nobody buys a ticket to a percentage.', 'What it does next is the story.'])}`,
    },
    {
      needs: ['title', 'opening', 'studio'],
      write: (f, _v, r) => `${f.studio} opened ${f.title} to ${formatMoneyCompact(f.opening!)} ${one(r, WHEN)}. It is ${verdictOf(f.opening, f.budget)} for a company that ${one(r, ['needed one', 'has had a difficult year', 'has been on a run', 'has three more like it this year'])}.`,
    },
    {
      needs: ['title', 'opening', 'cast'],
      write: (f) => `${f.title}, with ${list(f.cast ?? [], 2)}, opened to ${formatMoneyCompact(f.opening!)}. That is ${verdictOf(f.opening, f.budget)}, and it is the number every offer either of them gets next will be measured against.`,
    },
  ],
  hold: [
    {
      needs: ['title', 'dropPercent', 'weekendGross'],
      write: (f, _v, r) => `${f.title} fell only ${percent(f.dropPercent!)} in its second weekend, adding ${formatMoneyCompact(f.weekendGross!)}. A hold like that is word of mouth doing what marketing cannot, and it ${one(r, ['changes the whole run', 'moves the final number by a lot', 'is worth more than the opening was', 'is the difference between profit and not'])}.`,
    },
    {
      needs: ['title', 'runningTotal', 'budget'],
      write: (f, _v, r) => `${f.title} has ${formatMoney(f.runningTotal!, { cents: false })} against ${formatMoneyCompact(f.budget!)}. ${f.runningTotal! > f.budget! * 2 ? 'It is into profit.' : 'It is not there yet, but it is going the right way.'} ${one(r, CAVEAT)}`,
    },
    {
      needs: ['title', 'multiple'],
      write: (f, _v, r) => `${f.title} is running at a ${f.multiple!.toFixed(1)} multiple of its opening, which for ${(f.genres ?? ['a picture'])[0]} is ${f.multiple! >= 3 ? 'exceptional' : f.multiple! >= 2.4 ? 'good' : 'ordinary'}. ${one(r, SOURCED).replace(/^./, (c) => c.toUpperCase())}, the company expects it to play through the month.`,
    },
    {
      needs: ['title', 'weekendGross', 'rank'],
      write: (f, _v, r) => `${f.title} added ${formatMoneyCompact(f.weekendGross!)} to finish ${f.rank === 1 ? 'first' : f.rank === 2 ? 'second' : `${f.rank}th`} ${one(r, WHEN)}. It is holding on.`,
    },
    {
      needs: ['title', 'audienceScore'],
      write: (f, _v, r) => `${f.title} is holding, and the audience score of ${Math.round(f.audienceScore!)} is why. ${one(r, ['Nothing else explains a curve like this.', 'Reviews open a picture; audiences keep it open.', 'The critics were not the constituency here.', 'This is what a recommendation looks like in a chart.'])}`,
    },
  ],
  collapse: [
    {
      needs: ['title', 'dropPercent', 'weekendGross'],
      write: (f, _v, r) => `${f.title} dropped ${percent(f.dropPercent!)} to ${formatMoneyCompact(f.weekendGross!)}. A fall of that size in a second weekend means nobody is telling anybody to go, ${one(r, ['and nothing recovers from it', 'and the run is effectively over', 'and the rest is arithmetic', 'and the studio knows it'])}.`,
    },
    {
      needs: ['title', 'runningTotal', 'budget'],
      write: (f, _v, r) => `${f.title} has ${formatMoneyCompact(f.runningTotal!)} against a ${formatMoneyCompact(f.budget!)} budget and is falling. It will not recoup theatrically, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'audienceScore', 'criticScore'],
      write: (f, _v, r) => `The audience has ${f.title} at ${Math.round(f.audienceScore!)} and the critics at ${Math.round(f.criticScore!)}, and the chart is now agreeing with them. ${one(r, TONE_BAD).replace(/^./, (c) => c.toUpperCase())} is an expensive thing to be.`,
    },
    {
      needs: ['title', 'studio', 'budget'],
      write: (f, _v, r) => `${f.studio} is looking at a write-down on ${f.title}. The picture cost ${formatMoneyCompact(f.budget!)} and the run has stopped, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'theatres'],
      write: (f, _v, r) => `${f.title} is losing screens. It was in ${count(f.theatres!, 'theatre')} and will be in far fewer by ${one(r, ['Friday', 'next weekend', 'the end of the month', 'the third weekend'])}.`,
    },
  ],
  record: [
    {
      needs: ['title', 'note'],
      write: (f, _v, r) => `${f.title} has done something nothing else has. ${f.note} ${one(r, ['Records are made to be read carefully, and this one is real.', 'Every record needs its asterisks, and this one has few.', 'It is the kind of number that reframes a year.', 'Whether it stands is another matter.'])}`,
    },
    {
      needs: ['title', 'opening', 'studio'],
      write: (f, _v, r) => `${f.title} posted ${formatMoney(f.opening!, { cents: false })}, the largest opening ${f.studio} has ever had. ${one(r, MOOD_SENTENCE)} Which makes it a genuinely strange result.`,
    },
    {
      needs: ['title', 'runningTotal'],
      write: (f, _v, r) => `${f.title} has gone past ${formatMoney(f.runningTotal!, { cents: false })}. Nothing has been there before in this market, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'genres', 'opening'],
      write: (f, _v, r) => `${f.title} is now the biggest opening ${(f.genres ?? ['film'])[0]} on record at ${formatMoneyCompact(f.opening!)}. ${one(r, ['That category has moved twice in three years.', 'The genre has been waiting for one of these.', 'It will not stand long.', 'The previous holder had it for a decade.'])}`,
    },
    {
      needs: ['title', 'rank', 'year'],
      write: (f, _v, r) => `${f.title} finishes ${f.rank === 1 ? 'first' : `${f.rank}th`} for ${f.year}, which for a picture of its kind is ${one(r, [...TONE_GOOD, ...TONE_MIXED])}.`,
    },
  ],
};

export const REL_DETAILS: Partial<Record<StoryKind, Frame[]>> = {
  festival_premiere: [
    { needs: ['festival', 'city'], write: (f) => `${f.festival} runs in ${f.city}, and a premiere there is the most expensive free press in the business.` },
    { needs: ['criticScore', 'reviewCount'], write: (f) => `The first ${count(f.reviewCount!, 'review')} out of the festival put it at ${Math.round(f.criticScore!)}.` },
    { needs: ['cast'], write: (f) => `${list(f.cast ?? [], 3)} were on the carpet.` },
    { needs: ['runtimeMinutes'], write: (f) => `The cut that screened ran ${f.runtimeMinutes} minutes, and festival cuts are rarely the ones that open.` },
    { needs: ['distributor'], write: (f) => `${f.distributor} has it for release, which means the festival run is marketing rather than a sales trip.` },
  ],
  reviews: [
    { needs: ['criticScore', 'audienceScore'], write: (f) => `Critics ${Math.round(f.criticScore!)}, audience ${Math.round(f.audienceScore!)}. The two measure different things and are constantly reported as if they measured the same one.` },
    { needs: ['reviewCount'], write: (f) => `${count(f.reviewCount!, 'review')} counted so far, which is enough for the number to have stopped moving much.` },
    { needs: ['cast'], write: (f) => `${list(f.cast ?? [], 2)} come out of it best, which is usually the case when a picture is better performed than written.` },
    { needs: ['director'], write: (f) => `It is ${f.director}'s picture and the reviews read it as one, for better and for worse.` },
    { needs: ['runtimeMinutes'], write: (f) => `At ${f.runtimeMinutes} minutes, the length is the note that comes up most often.` },
  ],
  opening: [
    { needs: ['theatres', 'opening'], write: (f) => `${count(f.theatres!, 'theatre')}, a per-screen of ${formatMoney(Math.round(f.opening! / Math.max(1, f.theatres!)), { cents: false })}.` },
    { needs: ['budget', 'opening'], write: (f) => `The picture cost ${formatMoneyCompact(f.budget!)} before marketing. On the usual arithmetic it needs somewhere around ${formatMoneyCompact(f.budget! * 2.5)} worldwide to be in profit.` },
    { needs: ['criticScore'], write: (f) => `Reviews had it at ${Math.round(f.criticScore!)} going in.` },
    { needs: ['rank'], write: (f) => `It finished ${f.rank === 1 ? 'first' : f.rank === 2 ? 'second' : `${f.rank}th`} for the weekend.` },
    { needs: ['certificate', 'genres'], write: (f) => `Rated ${f.certificate} and sold as ${(f.genres ?? []).join(' and ')}, which is a narrower opening than a wider certificate would have given it.` },
  ],
  hold: [
    { needs: ['previousWeekend', 'weekendGross'], write: (f) => `${formatMoneyCompact(f.previousWeekend!)} to ${formatMoneyCompact(f.weekendGross!)}, which is the shape of a picture people are recommending.` },
    { needs: ['runningTotal', 'budget'], write: (f) => `Running total ${formatMoneyCompact(f.runningTotal!)} against ${formatMoneyCompact(f.budget!)}.` },
    { needs: ['audienceScore'], write: (f) => `The audience score is ${Math.round(f.audienceScore!)}, and a curve like this is what that number actually means.` },
    { needs: ['multiple'], write: (f) => `A ${f.multiple!.toFixed(1)} multiple, and still climbing.` },
    { needs: ['theatres'], write: (f) => `It held ${count(f.theatres!, 'theatre')}, which exhibitors only do for something that is selling.` },
  ],
  collapse: [
    { needs: ['previousWeekend', 'weekendGross'], write: (f) => `${formatMoneyCompact(f.previousWeekend!)} down to ${formatMoneyCompact(f.weekendGross!)}.` },
    { needs: ['budget', 'runningTotal'], write: (f) => `Against ${formatMoneyCompact(f.budget!)} of negative cost and roughly half that again in marketing, ${formatMoneyCompact(f.runningTotal!)} is not a number anybody recovers from.` },
    { needs: ['audienceScore'], write: (f) => `The audience score is ${Math.round(f.audienceScore!)}. Word of mouth is the mechanism and it is working in reverse.` },
    { needs: ['studio'], write: (f) => `${f.studio} has other things on the slate this year, which is the only good news in it.` },
    { needs: ['director'], write: (f) => `${f.director} will not be blamed for all of it and will be blamed for most of it, which is how this works.` },
  ],
  record: [
    { needs: ['note'], write: (f) => f.note! },
    { needs: ['opening', 'theatres'], write: (f) => `${formatMoney(f.opening!, { cents: false })} from ${count(f.theatres!, 'theatre')}.` },
    { needs: ['runningTotal', 'budget'], write: (f) => `${formatMoneyCompact(f.runningTotal!)} against ${formatMoneyCompact(f.budget!)}, which is the sort of ratio that gets a sequel approved in a week.` },
    { needs: ['year'], write: (f) => `It is the largest of ${f.year} by some distance, and the year is not finished.` },
    { needs: ['studio'], write: (f) => `For ${f.studio} it resets what the company thinks it is capable of, which is worth more internally than the money.` },
  ],
};
