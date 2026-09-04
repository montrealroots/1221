/**
 * SLATE — the paragraph that puts a story in its place.
 *
 * Every piece of trade writing has one: the bit after the facts that says why
 * this is happening now, what it is like, and what the shape of the business
 * around it is. It belongs to the desk rather than to the story, which is why
 * these are shared — a casting story and a greenlight story reach for the same
 * kind of context, and the frames underneath them do too.
 *
 * The close belongs to the outlet rather than the desk. The same set of facts
 * ends differently in a wire report and in an essay, and that difference is
 * most of what makes an outlet recognisable.
 */

import { formatMoneyCompact } from '../core/money';
import type { Desk, Frame } from './press-story';
import type { Register } from './press';
import { house } from './press-frames-development';
import {
  CAVEAT, HOW_LONG, MARKET_MOOD, MOOD_SENTENCE, RISK, SOON, SOURCED, STRATEGY, count, list, one, percent, signOff,
} from './press-phrases';

export const CONTEXTS: Readonly<Record<Desk, Frame[]>> = {
  development: [
    { write: (f, _v, r) => `${house(f)} has been ${one(r, STRATEGY)}, and this fits that pattern more than it breaks it.` },
    { write: (_f, _v, r) => `Development at this end of the business runs ${one(r, HOW_LONG).replace(/^for |^since /, '')} as a rule, and most of what enters it never leaves.` },
    { needs: ['budget'], write: (f, _v, r) => `At ${formatMoneyCompact(f.budget!)} it sits ${one(r, ['above', 'below', 'exactly at', 'a little under'])} what the company has been approving this year, ${one(r, MARKET_MOOD)}.` },
    { write: (_f, _v, r) => `${one(r, MOOD_SENTENCE)} Anything that gets this far has already survived more than most.` },
    { needs: ['genres'], write: (f, _v, r) => `${(f.genres ?? []).join(' and ')} has been ${one(r, ['a hard sell all year', 'the one category still finding buyers', 'quietly out of fashion', 'the thing everybody says they want and nobody buys'])}, which makes the decision more interesting than it looks.` },
    { write: (_f, _v, r) => `Nothing about the timing is accidental. ${one(r, CAVEAT)}` },
    { needs: ['director'], write: (f, _v, r) => `${f.director} has been trying to get something like this made ${one(r, HOW_LONG)}.` },
    { needs: ['studio'], write: (f, _v, r) => `${f.studio} has ${one(r, ['four', 'six', 'nine', 'a dozen'])} pictures in development at this stage, and history says ${one(r, ['two', 'three', 'one'])} of them get made.` },
  ],
  production: [
    { needs: ['city'], write: (f, _v, r) => `${f.city} has been busy, and crew availability is the constraint everybody is working around ${one(r, ['this year', 'this quarter', 'right now', 'at the moment'])}.` },
    { needs: ['budget'], write: (f, _v, r) => `${formatMoneyCompact(f.budget!)} buys a certain number of days and no more. ${one(r, RISK).replace(/^./, (c) => c.toUpperCase())}.` },
    { write: (_f, _v, r) => `A shoot is the only part of this business with a fixed cost per day, which is why it is the part everybody watches. ${one(r, CAVEAT)}` },
    { needs: ['shootDays'], write: (f, _v, r) => `${count(f.shootDays!, 'day')} is ${f.shootDays! < 32 ? 'lean' : f.shootDays! > 60 ? 'generous' : 'ordinary'} for a picture at this level, ${one(r, MARKET_MOOD)}.` },
    { write: (_f, _v, r) => `What happens on a set rarely reaches the trades until it is over, and what reaches them is ${one(r, ['what somebody wanted reported', 'the version with a source behind it', 'never the whole of it', 'a fraction of it'])}.` },
    { needs: ['director'], write: (f) => `${f.director} has final cut or does not, and nobody outside the deal knows which.` },
  ],
  marketing: [
    { needs: ['dateLabel'], write: (f, _v, r) => `${f.dateLabel} is ${one(r, ['a crowded weekend', 'a quiet weekend', 'the weekend everybody wanted', 'a corridor rather than a weekend'])}, and what else lands around it will decide as much as the film does.` },
    { write: (_f, _v, r) => `Campaigns are built eight months out and rebuilt three times before anybody sees one. ${one(r, CAVEAT)}` },
    { needs: ['budget'], write: (f) => `Marketing on a picture of ${formatMoneyCompact(f.budget!)} runs to roughly half the negative cost again, and none of it is recoverable.` },
    { write: (_f, _v, r) => `${one(r, MOOD_SENTENCE)} Getting anybody to notice a film at all is the expensive part.` },
    { needs: ['genres'], write: (f, _v, r) => `Selling ${(f.genres ?? []).join(' and ')} to a wide audience is ${one(r, ['a solved problem', 'harder than it was', 'a matter of the right two minutes', 'mostly about the trailer'])}.` },
    { needs: ['studio'], write: (f) => `${f.studio} has the release corridor to itself for a fortnight either side, which is worth more than most marketing spend.` },
  ],
  release: [
    { write: (_f, _v, r) => `${one(r, MOOD_SENTENCE)} A number like that has to be read against the ones around it rather than on its own.` },
    { needs: ['budget'], write: (f) => `On the arithmetic the business actually uses, a picture needs somewhere near two and a half times its negative cost to be in profit; here that is roughly ${formatMoneyCompact(f.budget! * 2.5)}.` },
    { needs: ['criticScore', 'audienceScore'], write: (f, _v, r) => `Critics at ${Math.round(f.criticScore!)} and audiences at ${Math.round(f.audienceScore!)} is ${Math.abs(f.criticScore! - f.audienceScore!) > 20 ? 'a gap wide enough to explain the whole run' : 'close enough that neither is telling you anything the other is not'}. ${one(r, CAVEAT)}` },
    { needs: ['theatres'], write: (f) => `${count(f.theatres!, 'theatre')} is a full wide release, and there is nowhere left to expand into.` },
    { write: (_f, _v, r) => `Second weekends decide films; first weekends decide careers. ${one(r, ['Both are being read here.', 'Only one of those is settled.', 'The industry keeps confusing the two.', 'This is the week that matters.'])}` },
    { needs: ['dropPercent'], write: (f) => `A ${percent(f.dropPercent!)} fall is ${f.dropPercent! < 40 ? 'the mark of a picture people are recommending' : f.dropPercent! < 58 ? 'ordinary' : 'the shape of a film nobody is talking about'}.` },
    { needs: ['distributor'], write: (f) => `${f.distributor} handles it, and a distributor's share comes off the top before anybody else sees anything.` },
  ],
  television: [
    { write: (_f, _v, r) => `Renewals now depend on completion rates nobody publishes, which is why every one of these decisions looks arbitrary from outside. ${one(r, CAVEAT)}` },
    { needs: ['network'], write: (f, _v, r) => `${f.network} has been ${one(r, ['ordering fewer shows and paying more for them', 'cutting the slate', 'buying finished shows rather than making them', 'commissioning against a smaller budget than last year'])}.` },
    { needs: ['viewers'], write: (_f, _v, r) => `Numbers at that level are ${one(r, ['comfortable', 'marginal', 'better than the average of the schedule', 'not what they were'])}, ${one(r, MARKET_MOOD)}.` },
    { needs: ['seasons'], write: (f) => `${count(f.seasons!, 'season')} is past the point where a show is expensive and short of the point where it is worth a library deal.` },
    { write: (_f, _v, r) => `A series lives on the cost per episode against what the platform thinks it keeps people for, and only one of those two numbers is ever public. ${one(r, SOURCED).replace(/^./, (c) => c.toUpperCase())}, this one was close.` },
    { needs: ['episodes'], write: (f) => `${count(f.episodes!, 'episode')} is enough to be a library asset, which is where the money in television actually is.` },
  ],
  awards: [
    { needs: ['award'], write: (f, _v, r) => `The ${f.award} votes ${one(r, ['by peer branch', 'as a whole membership', 'through a jury', 'on a preferential ballot'])}, which shapes what wins as much as what is nominated does.` },
    { write: (_f, _v, r) => `Campaigns cost more than most of the films they run for, and the spending is not disclosed anywhere. ${one(r, CAVEAT)}` },
    { needs: ['criticScore'], write: (f) => `Reviews had it at ${Math.round(f.criticScore!)}. The relationship between that number and what gets nominated is weaker than anybody admits.` },
    { needs: ['studio'], write: (f, _v, r) => `${f.studio} has run ${one(r, ['one', 'two', 'three', 'four'])} campaigns this season and this is the one they put the money behind.` },
    { write: (_f, _v, r) => `What an award is worth commercially is ${one(r, ['a re-release and a few points of awareness', 'less every year', 'entirely dependent on the category', 'hard to separate from what the film was doing anyway'])}.` },
    { needs: ['runningTotal'], write: (f) => `It has ${formatMoneyCompact(f.runningTotal!)} in the bank, and recognition of this kind reliably adds to that.` },
  ],
  business: [
    { write: (_f, _v, r) => `${one(r, MOOD_SENTENCE)} Deals of this shape are being signed at a lower rate than two years ago.` },
    { needs: ['money'], write: (f, _v, r) => `${formatMoneyCompact(f.money!)} is ${one(r, ['a market rate', 'above the market', 'below what this would have cost two years ago', 'the number everybody else will now be measured against'])}.` },
    { needs: ['studio'], write: (f, _v, r) => `${f.studio} has been ${one(r, STRATEGY)}, and the balance sheet explains more of this than the strategy does.` },
    { write: (_f, _v, r) => `Libraries, not slates, are what these companies are actually valued on. ${one(r, CAVEAT)}` },
    { write: (_f, _v, r) => `The people who make the films find out about decisions like this ${one(r, ['from the trades', 'at the same time as everybody else', 'a day late', 'in a memo that says less than this piece does'])}.` },
    { needs: ['year'], write: (f) => `${f.year} has been the year of exactly this, at every company in the business.` },
  ],
};

/** The last paragraph, which is where an outlet sounds most like itself. */
export const CLOSES: Readonly<Record<Register, Frame[]>> = {
  scoop: [
    { write: (_f, v, r) => signOff(r, v) },
    { write: (_f, _v, r) => `The rest of it firms up ${one(r, SOON)}.` },
    { needs: ['title'], write: (f, _v, r) => `${f.title} is the one to watch ${one(r, SOON)}.` },
    { write: (_f, _v, r) => `${one(r, SOURCED).replace(/^according to /, 'Per ').replace(/^./, (c) => c.toUpperCase())}, the announcement lands within the week.` },
    { needs: ['studio'], write: (f) => `${f.studio} would not comment. They rarely do at this stage.` },
    { write: () => 'We will have the rest of it shortly.' },
  ],
  business: [
    { write: (_f, v, r) => signOff(r, v) },
    { kinds: ['greenlight', 'opening', 'collapse', 'shelved', 'earnings', 'library', 'trouble'], needs: ['money'], write: (f) => `The exposure is ${formatMoneyCompact(f.money!)} and the recovery, if there is one, is a year out.` },
    { write: (_f, _v, r) => `${one(r, RISK).replace(/^./, (c) => c.toUpperCase())}, and that is the part the market will price.` },
    { needs: ['studio'], write: (f) => `${f.studio} reports next quarter. This will be in it.` },
    { write: () => 'None of this changes the guidance, which is the only number the street was watching.' },
    { kinds: ['greenlight', 'shelved', 'date_change', 'trouble', 'collapse'], needs: ['budget'], write: (f) => `Against ${formatMoneyCompact(f.budget!)} of committed capital, the decision is smaller than it sounds.` },
  ],
  balanced: [
    { write: (_f, v, r) => signOff(r, v) },
    { write: (_f, _v, r) => `Both readings are available and ${one(r, ['both have people arguing them', 'the truth is probably in between', 'a year will settle it', 'nobody involved is neutral'])}.` },
    { needs: ['studio'], write: (f) => `${f.studio} declined to expand on the statement.` },
    { write: () => 'What it means will be clearer in twelve months than it is today.' },
    { needs: ['title'], write: (f) => `${f.title} is the test of it either way.` },
    { write: (_f, _v, r) => `${one(r, CAVEAT)}` },
  ],
  critical: [
    { write: (_f, v, r) => signOff(r, v) },
    { write: () => 'None of which is the same as the film being good, which is a separate question and a more interesting one.' },
    { needs: ['director'], write: (f) => `${f.director} has made better and worse. The interesting part is which of those this turns out to be.` },
    { write: (_f, _v, r) => `The commerce here is ${one(r, ['legible', 'obvious', 'the easy part', 'not in doubt'])}. The work is not, yet.` },
    { needs: ['title'], write: (f) => `${f.title} will be judged on what is on the screen, eventually, by people who do not care about any of this.` },
    { write: () => 'It would be a pity if the number were the only thing anybody remembered about it.' },
  ],
  enthusiast: [
    { write: (_f, v, r) => signOff(r, v) },
    { needs: ['title'], write: (f) => `Whatever else, ${f.title} has our attention.` },
    { write: (_f, _v, r) => `There is a version of this that is ${one(r, ['enormous', 'wonderful', 'the best thing on the slate', 'exactly what everybody has been asking for'])}, and it is not a stretch to see it.` },
    { needs: ['dateLabel'], write: (f) => `${f.dateLabel} cannot come soon enough.` },
    { write: () => 'On this evidence, it is worth being excited about.' },
    { needs: ['cast'], write: () => 'That cast alone is a reason to turn up.' },
  ],
  essay: [
    { write: (_f, v, r) => signOff(r, v) },
    { write: (_f, _v, r) => `What that says about where the business has got to is ${one(r, ['a longer argument than this', 'the question underneath all of it', 'worth more attention than it will get', 'not encouraging'])}.` },
    { needs: ['genres'], write: () => 'Films like this used to be the middle of the business. They are the edge of it now, and that is the story.' },
    { write: () => 'The interesting question was never whether it works, but what a slate made entirely of these would look like.' },
    { needs: ['title'], write: (f) => `${f.title} is the kind of picture that will be read differently in ten years, which is the most any of them can hope for.` },
    { write: () => 'The answer, as usual, is somewhere in what does not get made.' },
  ],
  wire: [
    { write: (_f, v, r) => signOff(r, v) },
    { write: () => 'Terms were not disclosed.' },
    { needs: ['studio'], write: (f) => `${f.studio} did not respond to a request for comment.` },
    { write: () => 'The figures are as reported and have not been independently verified.' },
    { needs: ['city'], write: (f) => `Reporting from ${f.city}.` },
    { write: () => 'No further details were given.' },
  ],
  aggregate: [
    { write: (_f, v, r) => signOff(r, v) },
    { write: () => 'Figures are provisional and revise on Monday.' },
    { needs: ['reviewCount'], write: (f) => `Based on ${count(f.reviewCount!, 'review')} counted so far.` },
    { write: () => 'The percentage and the average measure different things and are not comparable.' },
    { needs: ['theatres'], write: (f) => `Across ${count(f.theatres!, 'theatre')}.` },
    { write: () => 'Totals include previews.' },
  ],
};

/**
 * The line under the headline.
 *
 * Its own bank rather than a sentence lifted out of the piece, because a
 * standfirst that repeats the lede is a page saying the same thing twice — the
 * first thing anybody notices and the fastest way to make generated writing
 * look generated.
 */
export const STANDFIRSTS: Readonly<Record<Desk, Frame[]>> = {
  development: [
    { kinds: ['setup', 'greenlight', 'rights', 'shelved'], needs: ['studio', 'title'], write: (f) => `${f.studio} moves on ${f.title} after a development run nobody expected to end this way.` },
    { needs: ['budget'], write: (f) => `The number is ${formatMoneyCompact(f.budget!)}, and the number is the whole decision.` },
    { needs: ['director'], write: (f) => `${f.director} has been trying to make something like this for years.` },
    { kinds: ['attachment', 'casting'], needs: ['person'], write: (f) => `${f.person} is the piece that makes the rest of it possible.` },
    { needs: ['genres'], write: (f) => `${(f.genres ?? []).join(' and ')}, at a moment when neither is an easy sell.` },
    { needs: ['title'], write: (f) => `What ${f.title} has to do next, and who has to say yes to it.` },
    { kinds: ['casting', 'greenlight', 'setup'], needs: ['cast'], write: (f) => `${list(f.cast ?? [], 2)} lead, and the rest of the room is still open.` },
  ],
  production: [
    { kinds: ['production_start', 'trouble', 'wrap'], needs: ['city', 'title'], write: (f) => `${f.title} is on the ground in ${f.city}, and the schedule is the story.` },
    { needs: ['shootDays'], write: (f) => `${count(f.shootDays!, 'day')} on the board, and no obvious slack in any of them.` },
    { needs: ['budget'], write: (f) => `${formatMoneyCompact(f.budget!)} buys a fixed number of days, and days are the only fixed cost in this business.` },
    { needs: ['director'], write: (f) => `${f.director} is making it. What that means in practice is now visible.` },
    { needs: ['title'], write: (f) => `Where ${f.title} actually stands, as against where the announcement said it did.` },
    { kinds: ['test_screening'], needs: ['criticScore'], write: (f) => `The cards came back at ${Math.round(f.criticScore!)}, and the edit moves from here.` },
  ],
  marketing: [
    { needs: ['dateLabel'], write: (f) => `${f.dateLabel} is the date, and everything now runs backwards from it.` },
    { kinds: ['trailer'], needs: ['title'], write: (f) => `The first real look at ${f.title}, and the first thing anybody can argue about.` },
    { kinds: ['date_change'], needs: ['previousDateLabel', 'dateLabel'], write: (f) => `Out of ${f.previousDateLabel} and into ${f.dateLabel}, which is a different film commercially.` },
    { kinds: ['date_change'], needs: ['studio'], write: (f) => `${f.studio} rearranges a calendar that was not working.` },
    { needs: ['budget'], write: (f) => `At ${formatMoneyCompact(f.budget!)}, it has to open. Everything else follows from that.` },
    { needs: ['cast'], write: (f) => `${list(f.cast ?? [], 2)} are the campaign, whatever else is in it.` },
  ],
  release: [
    { kinds: ['opening', 'record'], needs: ['opening', 'budget'], write: (f) => `${formatMoneyCompact(f.opening!)} against ${formatMoneyCompact(f.budget!)}, and what that leaves to make up.` },
    { kinds: ['reviews', 'opening', 'hold', 'collapse'], needs: ['criticScore', 'audienceScore'], write: (f) => `Critics ${Math.round(f.criticScore!)}, audience ${Math.round(f.audienceScore!)}, and the gap between them.` },
    { kinds: ['hold', 'record', 'collapse'], needs: ['runningTotal'], write: (f) => `${formatMoneyCompact(f.runningTotal!)} and counting, which is further than the first weekend suggested.` },
    { kinds: ['hold', 'collapse'], needs: ['dropPercent'], write: (f) => `A ${percent(f.dropPercent!)} move in week two, and what a curve like that is worth.` },
    { kinds: ['opening', 'hold', 'collapse'], needs: ['title'], write: (f) => `Where ${f.title} stands after the weekend that decides it.` },
    { kinds: ['festival_premiere'], needs: ['festival'], write: (f) => `Out of ${f.festival}, and into a market that has not made up its mind.` },
  ],
  television: [
    { kinds: ['renewal', 'cancellation'], needs: ['title', 'seasons'], write: (f) => `${count(f.seasons!, 'season')} in, and the decision that was never going to be easy.` },
    { needs: ['viewers'], write: (f) => `${compactCountLocal(f.viewers!)}, against a bar nobody publishes.` },
    { needs: ['network'], write: (f) => `What ${f.network} is actually buying, as against what it says it is.` },
    { needs: ['episodes'], write: (f) => `${count(f.episodes!, 'episode')}, and what that is worth as a library asset.` },
    { kinds: ['cancellation'], needs: ['title'], write: (f) => `The end of ${f.title}, and what it leaves behind on the schedule.` },
  ],
  awards: [
    { kinds: ['nomination'], needs: ['award', 'nominations'], write: (f) => `${count(f.nominations!, 'nomination')} at the ${f.award}, and the campaign that got them.` },
    { needs: ['person', 'category'], write: (f) => `${f.person}, ${f.category}, and a season that has gone exactly one way.` },
    { needs: ['title', 'award'], write: (f) => `${f.title} at the ${f.award}, and what recognition is worth commercially now.` },
    { needs: ['criticScore'], write: (f) => `It reviewed at ${Math.round(f.criticScore!)}. The ballot did not agree, and rarely does.` },
    { needs: ['award'], write: (f) => `How the ${f.award} actually votes, and why that shapes the result.` },
  ],
  business: [
    { needs: ['money'], write: (f) => `${formatMoneyCompact(f.money!)}, and what it buys that a slate does not.` },
    { needs: ['studio'], write: (f) => `Inside ${f.studio}, where the strategy and the balance sheet are pulling apart.` },
    { kinds: ['deal'], needs: ['person'], write: (f) => `${f.person} has a new home, and the market rate moves with them.` },
    { kinds: ['executive'], needs: ['executive', 'successor'], write: (f) => `${f.executive} out, ${f.successor} in, and a slate half-set between them.` },
    { needs: ['year'], write: (f) => `The ${f.year} that the whole business has been having, in one set of numbers.` },
    { needs: ['note'], write: (f) => f.note! },
  ],
};

/** A viewer count as a standfirst would print it. */
function compactCountLocal(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}m viewers`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k viewers`;
  return count(n, 'viewer');
}
