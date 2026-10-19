/** Batch 6's second-pass statuses: round-ups, rents, the home accounts and their research. */
const RU = 'src/engine/content/roundups.ts';
const HA = 'src/engine/content/homeaccounts.ts';
const RENDER = 'docs/verification/editorial-2026-10-19/money-data/render-panels.test.ts';
const ROUNDUPS = `The Round-Ups panel drawn at each of the 60 banks by ${RENDER} (rendered/roundups.txt, and under Your Accounts Over Time in rendered/accountlife.txt); tests/roundups.test.ts asserts the panel's words from the data`;
const R = (id, reason) => ({ id, status: 'Retained', reason });
const W = (id, evidence) => ({ id, status: 'Rewritten', evidence });

export default [
  R(`${RU}#ROUND_UPS *`, 'Each bank’s round-up as the bank names it (Keep the Change, Save the Change, Kleingeld Plus), said to the player in a sentence or two, with what happens when the account is short, what the bank leaves open and what the game leaves out, each said as the game’s, and the terms it was read from.'),
  R(`${RU}#OFF`, 'One sentence for every bank whose terms don’t say what turning round-ups off does: what the game does first, then that the bank doesn’t say, so the player knows which part is the game’s.'),
  W(`${RU}#DROPPED_UNSAID`, ROUNDUPS),
  W(`${RU}#ROUND_UPS .mx-santander`, ROUNDUPS),
  W(`${RU}#ROUND_UPS .kr-kakaobank`, ROUNDUPS),
  W('src/engine/content/rents.ts#PUBLISHED_RENTS', `The place look's "The rent is published: …" drawn for each of the 20 places with a published rent by ${RENDER} with RENDER=places (rendered/places.txt)`),
  R(`${HA}#ASSUMED_WORDS`, 'The two estimates a payment abroad carries, each saying what the bank doesn’t publish and the figure the game uses instead (the FSB’s 2.6%, three business days), in brackets after the figure they qualify.'),
  R(`${HA}#RETENTION_CONFIDENCE`, 'Three sentences that tell the player how sure the game is that a home bank keeps their account: in the bank’s own words, from its price with no rule, or the game’s assumption; the guide reads the first back.'),
  R(`${HA}#READ`, 'Each home bank’s sentence on keeping the account of a student who has moved to America, with the step it asks (an address, a form, a non-resident account) and the bank’s own words quoted where it hedges.'),
  R(`${HA}#NEW_HERE`, 'The sentence that names a home bank and where it opens accounts, with each country’s phrase written to sit in it (“the UK”, “Australia or moving there”), so it reads whole for every bank.'),
  R(`${HA}#ABROAD`, 'Each home bank’s refusals and conditions for a customer abroad, said plainly, with the bank’s own words quoted in its language where they are the rule (“Wohnsitz und Arbeitsplatz in Deutschland”).'),
  R(`${HA}#conditionOf`, 'The general condition for a home bank with no sentence of its own, naming the bank and the two things it asks of a customer abroad: an American address and a tax self-certification.'),
  R(`${HA}#NON_RESIDENT_TAX`, 'Each country’s tax on the interest of a customer abroad, with its rate, the law that sets it, and, where a treaty rate needs a form, that the game assumes none was filed.'),
  R('src/engine/content/home-accounts.json#*', 'The banks’ research quoted, copied from docs/research/banking/home-accounts.json by tools/build-home-accounts.mjs. homeaccounts.ts reads only each bank’s kept, closesWithNoticeDays and its sources’ title and address, into HomeTerms.source, which nothing reads; READ and ABROAD hold what the screens say, so no word of this file reaches a player.'),
];
