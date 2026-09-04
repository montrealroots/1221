/**
 * SLATE — the production and marketing desks.
 *
 * Cameras roll, something goes wrong, it wraps, it screens for an audience who
 * fill in cards, a trailer lands, a date moves. This is the part of the beat
 * that is closest to the work itself, and the part the trades cover with the
 * fewest numbers and the most sourcing.
 */

import { formatMoneyCompact } from '../core/money';
import type { Frame, StoryKind } from './press-story';
import { house, sizeBank } from './press-frames-development';
import {
  CAVEAT, CONFIRMED, HEDGE, MARKET_MOOD, MOOD_SENTENCE, READS_BAD, READS_GOOD, READS_MIXED, RISK,
  SOON, SOURCED, TONE_BAD, TONE_GOOD, TONE_MIXED, UNCONFIRMED, WHEN,
  count, list, one, percent,
} from './press-phrases';

/**
 * How a set of notices reads, as a noun phrase: 'a misfire', 'the strongest
 * thing on the slate'. Takes an article, so it only fits where the frame gives
 * it one.
 */
export function toneBank(score: number | undefined): readonly string[] {
  if (score === undefined) return TONE_MIXED;
  if (score >= 72) return TONE_GOOD;
  if (score >= 50) return TONE_MIXED;
  return TONE_BAD;
}

/**
 * The same judgement in predicate position: 'landed badly', 'came out warmly'.
 * Adjectival rather than a noun phrase, which is what the frames that follow a
 * verb actually need.
 */
export function readsBank(score: number | undefined): readonly string[] {
  if (score === undefined) return READS_MIXED;
  if (score >= 72) return READS_GOOD;
  if (score >= 50) return READS_MIXED;
  return READS_BAD;
}

export const PROD_HEADLINES: Partial<Record<StoryKind, Frame[]>> = {
  production_start: [
    { needs: ['title'], write: (f) => `${f.title} Starts Shooting` },
    { needs: ['title', 'city'], write: (f) => `Cameras Roll On ${f.title} In ${f.city}` },
    { needs: ['title'], write: (f) => `${f.title} Is Underway` },
    { needs: ['title', 'director'], write: (f) => `${f.director} Begins ${f.title}` },
    { needs: ['title', 'city'], write: (f) => `${f.city} Gets ${f.title}` },
    { needs: ['title', 'shootDays'], write: (f) => `${f.title} Begins A ${f.shootDays}-Day Shoot` },
  ],
  wrap: [
    { needs: ['title'], write: (f) => `${f.title} Wraps` },
    { needs: ['title', 'shootDays'], write: (f) => `${f.title} Wraps After ${f.shootDays} Days` },
    { needs: ['title'], write: (f) => `That Is A Wrap On ${f.title}` },
    { needs: ['title', 'director'], write: (f) => `${f.director} Finishes ${f.title}` },
    { needs: ['title'], write: (f) => `${f.title} Moves To Post` },
    { needs: ['title', 'city'], write: (f) => `${f.title} Wraps In ${f.city}` },
  ],
  trouble: [
    { needs: ['title'], write: (f) => `Trouble On ${f.title}` },
    { needs: ['title'], write: (f) => `${f.title} Goes Over` },
    { needs: ['title'], write: (f) => `${f.title} Has Lost Days` },
    { needs: ['title', 'money'], write: (f) => `${f.title} Runs ${formatMoneyCompact(f.money!)} Over` },
    { needs: ['title', 'director'], write: (f) => `${f.director} Under Pressure On ${f.title}` },
    { needs: ['title', 'city'], write: (f) => `${f.title} Shuts Down In ${f.city}` },
  ],
  test_screening: [
    { needs: ['title'], write: (f) => `${f.title} Tests` },
    { needs: ['title', 'criticScore'], write: (f) => `${f.title} Screens At ${Math.round(f.criticScore!)}` },
    { needs: ['title', 'city'], write: (f) => `${f.title} Goes In Front Of An Audience In ${f.city}` },
    { needs: ['title'], write: (f) => `The Cards Are In On ${f.title}` },
    { needs: ['title'], write: (f) => `${f.title} Screens For A Recruited Audience` },
  ],
  trailer: [
    { needs: ['title'], write: (f) => `The First Trailer For ${f.title}` },
    { needs: ['title'], write: (f) => `${f.title} Shows Itself` },
    { needs: ['title', 'dateLabel'], write: (f) => `${f.title} Sets Out Its Stall For ${f.dateLabel}` },
    { needs: ['title', 'studio'], write: (f) => `${f.studio} Cuts A Trailer For ${f.title}` },
    { needs: ['title', 'director'], write: (f) => `First Look At ${f.director}'s ${f.title}` },
  ],
  date_change: [
    { needs: ['title', 'dateLabel'], write: (f) => `${f.title} Moves To ${f.dateLabel}` },
    { needs: ['title'], write: (f) => `${f.title} Shifts` },
    { needs: ['title', 'dateLabel', 'previousDateLabel'], write: (f) => `${f.title} Leaves ${f.previousDateLabel} For ${f.dateLabel}` },
    { needs: ['title', 'studio'], write: (f) => `${f.studio} Redates ${f.title}` },
    { needs: ['title'], write: (f) => `${f.title} Gives Up Its Weekend` },
  ],
};

export const PROD_LEDES: Partial<Record<StoryKind, Frame[]>> = {
  production_start: [
    {
      needs: ['title', 'city'],
      write: (f, _v, r) => `${f.title} began principal photography in ${f.city} ${one(r, WHEN)}. ${house(f)} has it dated${f.dateLabel ? ` for ${f.dateLabel}` : ''}, ${one(r, HEDGE)}.`,
    },
    {
      needs: ['title', 'director', 'city'],
      write: (f, _v, r) => `${f.director} started shooting ${f.title} in ${f.city} ${one(r, WHEN)}. It is ${one(r, sizeBank(f.budget))}.`,
    },
    {
      needs: ['title', 'shootDays', 'city'],
      write: (f, _v, r) => `Cameras are turning on ${f.title}. The picture is boarded at ${count(f.shootDays!, 'day')} in and around ${f.city}, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'cast'],
      write: (f, _v, r) => `${f.title} is shooting, with ${list(f.cast ?? [], 3)} on the call sheet. ${one(r, CONFIRMED).replace(/^./, (c) => c.toUpperCase())} ${one(r, WHEN)}.`,
    },
    {
      needs: ['title', 'budget'],
      write: (f, _v, r) => `${f.title} is in production at ${formatMoneyCompact(f.budget!)}, ${one(r, MARKET_MOOD)}. ${one(r, RISK).replace(/^./, (c) => c.toUpperCase())}.`,
    },
  ],
  wrap: [
    {
      needs: ['title', 'shootDays'],
      write: (f, _v, r) => `${f.title} wrapped ${one(r, WHEN)} after ${count(f.shootDays!, 'shooting day')}. Post runs through ${one(r, SOON).replace(/^in |^before |^over |^within |^early |^once |^as /, '')}.`,
    },
    {
      needs: ['title', 'city'],
      write: (f, _v, r) => `Principal photography on ${f.title} finished in ${f.city} ${one(r, WHEN)}. The picture now goes into an edit that ${house(f)} wants finished ${one(r, SOON)}.`,
    },
    {
      needs: ['title', 'director'],
      write: (f, _v, r) => `${f.director} has wrapped ${f.title}. ${one(r, CONFIRMED).replace(/^./, (c) => c.toUpperCase())}, and the first cut is expected ${one(r, SOON)}.`,
    },
    {
      needs: ['title', 'budget', 'money'],
      write: (f, _v, r) => `${f.title} is finished shooting. It came in at ${formatMoneyCompact(f.money!)} against ${formatMoneyCompact(f.budget!)} approved, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'cast'],
      write: (f, _v, r) => `${f.title}, with ${list(f.cast ?? [], 3)}, has wrapped. The company is targeting ${f.dateLabel ?? 'a date next year'}, ${one(r, HEDGE)}.`,
    },
  ],
  trouble: [
    {
      needs: ['title', 'money'],
      write: (f, _v, r) => `${f.title} is running ${formatMoneyCompact(f.money!)} over, ${one(r, SOURCED)}. ${house(f)} has been in the numbers ${one(r, WHEN)}.`,
    },
    {
      needs: ['title', 'city'],
      write: (f, _v, r) => `Shooting on ${f.title} stopped in ${f.city} ${one(r, WHEN)}. Nobody at ${house(f)} would say for how long, ${one(r, UNCONFIRMED)}.`,
    },
    {
      needs: ['title', 'note'],
      write: (f, _v, r) => `${f.title} has a problem. ${f.note} ${one(r, SOURCED).replace(/^./, (c) => c.toUpperCase())}.`,
    },
    {
      needs: ['title', 'director'],
      write: (f, _v, r) => `${f.director}'s ${f.title} has lost days, ${one(r, SOURCED)}. A picture that loses days at this stage usually loses money at the next.`,
    },
    {
      needs: ['title', 'shootDays'],
      write: (f, _v, r) => `${f.title} was boarded at ${count(f.shootDays!, 'day')} and is not going to make it, ${one(r, SOURCED)}. ${one(r, CAVEAT)}`,
    },
  ],
  test_screening: [
    {
      needs: ['title', 'criticScore', 'city'],
      write: (f, _v, r) => `${f.title} screened for a recruited audience in ${f.city} ${one(r, WHEN)} and came out at ${Math.round(f.criticScore!)} on the cards. That reads ${one(r, readsBank(f.criticScore))} by the standard the company uses.`,
    },
    {
      needs: ['title', 'criticScore'],
      write: (f, _v, r) => `The first cards are in on ${f.title}: ${Math.round(f.criticScore!)} overall, ${one(r, SOURCED)}. ${house(f)} will screen again before locking.`,
    },
    {
      needs: ['title'],
      write: (f, _v, r) => `${f.title} has been in front of an audience. What came back read ${one(r, readsBank(f.criticScore))}, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'runtimeMinutes'],
      write: (f, _v, r) => `${f.title} tested at ${f.runtimeMinutes} minutes ${one(r, WHEN)}. Recruited audiences and long running times have never got on, and the edit is expected to move.`,
    },
    {
      needs: ['title', 'director', 'criticScore'],
      write: (f, _v, r) => `${f.director} screened ${f.title} ${one(r, WHEN)}. It scored ${Math.round(f.criticScore!)}, which reads ${one(r, readsBank(f.criticScore))}, ${one(r, UNCONFIRMED)}.`,
    },
  ],
  trailer: [
    {
      needs: ['title', 'dateLabel'],
      write: (f) => `${house(f)} has released the first trailer for ${f.title}, which opens ${f.dateLabel}. It is the first anybody outside the building has seen of it${f.director ? `, and the first sense of what ${f.director} has made` : ''}.`,
    },
    {
      needs: ['title', 'cast'],
      write: (f, _v, r) => `The trailer for ${f.title} is out. ${list(f.cast ?? [], 3)} are in it, and so is a great deal of the plot, which is ${one(r, ['the modern habit', 'the usual complaint', 'a choice somebody made deliberately', 'either generous or a mistake'])}.`,
    },
    {
      needs: ['title', 'genres'],
      write: (f, _v, r) => `First look at ${f.title}. On the evidence of two minutes it is ${(f.genres ?? []).join(' and ')} and it is not hiding it, which ${one(r, ['is a relief', 'will help', 'tells you who it is for', 'is the whole marketing plan'])}.`,
    },
    {
      needs: ['title', 'budget'],
      write: (f, _v, r) => `${house(f)} has cut a trailer for ${f.title}. At ${formatMoneyCompact(f.budget!)} the picture has to look like the money, and on this evidence it does, ${one(r, HEDGE)}.`,
    },
    {
      needs: ['title', 'director'],
      write: (f) => `A first trailer for ${f.director}'s ${f.title}, and the first time the marketing has had to say out loud what the film is.`,
    },
  ],
  date_change: [
    {
      needs: ['title', 'dateLabel', 'previousDateLabel'],
      write: (f, _v, r) => `${house(f)} has moved ${f.title} from ${f.previousDateLabel} to ${f.dateLabel}, ${one(r, CONFIRMED)}. Nobody moves a date up, and this one went ${one(r, ['back', 'later', 'into a quieter month', 'off the weekend it wanted'])}.`,
    },
    {
      needs: ['title', 'dateLabel'],
      write: (f, _v, r) => `${f.title} now opens ${f.dateLabel}. The move came ${one(r, WHEN)}, ${one(r, UNCONFIRMED)}.`,
    },
    {
      needs: ['title', 'daysOut'],
      write: (f, _v, r) => `${f.title} has moved with ${count(f.daysOut!, 'day')} to go, which is late enough that the campaign has to be rebuilt around it, ${one(r, SOURCED)}.`,
    },
    {
      needs: ['title', 'note'],
      write: (f, _v, r) => `${f.title} has been redated. ${f.note} ${one(r, CAVEAT)}`,
    },
    {
      needs: ['title', 'studio'],
      write: (f, _v, r) => `${f.studio} has given up the weekend it had for ${f.title}. ${one(r, MOOD_SENTENCE)} A company would rather move than lose.`,
    },
  ],
};

export const PROD_DETAILS: Partial<Record<StoryKind, Frame[]>> = {
  production_start: [
    { needs: ['shootDays', 'city'], write: (f) => `The schedule runs ${count(f.shootDays!, 'day')} in and around ${f.city}, with the exteriors front-loaded against the weather.` },
    { needs: ['cast', 'director'], write: (f) => `${list(f.cast ?? [], 3)} lead for ${f.director}.` },
    { needs: ['budget'], write: (f) => `The budget is ${formatMoneyCompact(f.budget!)} before any incentive, which is where a picture like this makes back its margin.` },
    { needs: ['dateLabel'], write: (f) => `The date is ${f.dateLabel}, and everything about the schedule is built backwards from it.` },
    { needs: ['genres', 'certificate'], write: (f) => `It is ${(f.genres ?? []).join(' and ')}, rated ${f.certificate}, and the certificate was decided before a frame was shot.` },
  ],
  wrap: [
    { needs: ['shootDays', 'city'], write: (f) => `${count(f.shootDays!, 'day')} in ${f.city}, finishing on schedule as far as anybody involved will say.` },
    { needs: ['money', 'budget'], write: (f) => `Final production cost is ${formatMoneyCompact(f.money!)} against ${formatMoneyCompact(f.budget!)} approved.` },
    { needs: ['director'], write: (f) => `${f.director} takes it into an edit now, which is where a picture of this kind is actually made.` },
    { needs: ['dateLabel'], write: (f) => `The release is set for ${f.dateLabel}, which gives post an ordinary amount of time rather than a generous one.` },
    { needs: ['cast'], write: (f) => `${list(f.cast ?? [], 3)} are done and free.` },
  ],
  trouble: [
    { needs: ['money', 'budget'], write: (f) => `That is ${formatMoneyCompact(f.money!)} on a picture approved at ${formatMoneyCompact(f.budget!)}, or ${percent((f.money! / f.budget!) * 100)} of the original number in overage.` },
    { needs: ['shootDays'], write: (f) => `The board was ${count(f.shootDays!, 'day')}. Days lost at this point come back as either money or pages, and usually both.` },
    { needs: ['director'], write: (f) => `${f.director} is under real pressure here, and a director who loses a schedule loses the next one too.` },
    { needs: ['note'], write: (f) => f.note! },
    { needs: ['dateLabel'], write: (f) => `The date is still ${f.dateLabel}. Whether it stays there is the question the studio is actually asking.` },
  ],
  test_screening: [
    { needs: ['criticScore', 'audienceScore'], write: (f) => `Overall came out at ${Math.round(f.criticScore!)}; definite recommend at ${Math.round(f.audienceScore!)}. The second number is the one distribution looks at.` },
    { needs: ['runtimeMinutes'], write: (f) => `The cut ran ${f.runtimeMinutes} minutes. Cards on a cut this long almost always ask for it to be shorter, and it almost always gets shorter.` },
    { needs: ['note'], write: (f) => f.note! },
    { needs: ['city'], write: (f) => `The screening was in ${f.city}, which is a market chosen to be ordinary rather than kind.` },
    { needs: ['director'], write: (f) => `${f.director} has final cut or does not, and which of those is true will decide what happens next.` },
  ],
  trailer: [
    { needs: ['cast'], write: (f) => `${list(f.cast ?? [], 3)} appear. Two of them are in it more than the trailer suggests, which is how these are cut.` },
    { needs: ['dateLabel'], write: (f) => `It opens ${f.dateLabel}.` },
    { needs: ['runtimeMinutes'], write: (f) => `The picture runs ${f.runtimeMinutes} minutes, which the trailer neither hides nor advertises.` },
    { needs: ['certificate'], write: (f) => `It is rated ${f.certificate}, and the trailer is cut for a wider audience than the film will actually have.` },
    { needs: ['logline'], write: (f) => `The premise, as the marketing has settled on it: ${f.logline}` },
  ],
  date_change: [
    { needs: ['previousDateLabel', 'dateLabel'], write: (f) => `It leaves ${f.previousDateLabel} and takes ${f.dateLabel}, which is a different competitive set entirely.` },
    { needs: ['daysOut'], write: (f) => `There are ${count(f.daysOut!, 'day')} between now and the new date, which is enough to rebuild a campaign and not enough to rebuild a film.` },
    { needs: ['budget'], write: (f) => `At ${formatMoneyCompact(f.budget!)} the picture needs a weekend rather than a corridor, and the new date gives it one.` },
    { needs: ['note'], write: (f) => f.note! },
    { needs: ['studio'], write: (f) => `${f.studio} has three other titles inside a month of the old date, and one of them was always going to move.` },
  ],
};
