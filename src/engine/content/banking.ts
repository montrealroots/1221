/**
 * SLATE — what a bank does to money that is sitting still.
 *
 * There was a banking system here once and it was cut, correctly. It sold an
 * American high street: Northbank and Meridian, a Centurion and a Sapphire
 * Reserve, credit scores, certificates of deposit, overdraft item fees — eight
 * hundred lines of shop for a game that had, by the time it was cut, become a
 * story about one family on one estate in Iceland. Restoring that file would
 * have put a product catalog back into a build that has spent fifty commits
 * taking catalogs out.
 *
 * So this is banking as the thing the measurement actually found missing, which
 * is smaller and bites harder. Twenty-five played years, read off the ledger:
 *
 *   - the savings account had ONE posting in a quarter of a century, its
 *     opening balance, and earned nothing
 *   - the card carried EUR 840 from before the game started, declared 22.49%,
 *     and was charged nothing — at that rate and left alone it is about EUR
 *     130,000 after twenty-five years, and the save said EUR 840
 *   - there was no way to move money between two accounts the same person owns
 *   - both parents' accounts took 299 and 406 postings and every one was
 *     inbound: money went in and never once came out
 *
 * Every one of those is the same defect wearing a different hat. An account is
 * a number that only goes one way, so holding money costs nothing, owing money
 * costs nothing, and where the money sits is not a decision.
 *
 * ## What is real here and what is ours
 *
 * The institution names in the save are real Icelandic banks and are named as
 * themselves, because that is what a bank is called. **Every rate below is
 * SLATE's own** and none of it is quoted from any bank's published sheet — they
 * are calibrations picked to sit where Icelandic retail rates have sat, in a
 * country whose policy rate has spent the last decade between roughly 0.75% and
 * 9.25%. A game that printed a real bank's real rate would be repeating an offer
 * that moves every quarter and would be wrong by the time anybody read it.
 *
 * The one figure that is not ours is the tax, and it is not here: income tax
 * comes off `content/tax.ts`, which carries real brackets for real places and
 * says where each came from.
 */

import type { Money } from '../core/money';

/**
 * What a current account pays, and it is nought on purpose.
 *
 * A current account is for money that is moving. Paying it a rate would make
 * the decision this file exists for — move it or leave it — into no decision at
 * all, and it would also be false: a transaction account pays nothing like a
 * deposit account anywhere, which is the entire reason deposit accounts exist.
 *
 * It is declared rather than assumed so that the sentence above has somewhere to
 * live and so the day somebody wants a current account to pay something, there
 * is one number to change.
 */
export const CURRENT_ACCOUNT_A_YEAR = 0;

/**
 * What money left on deposit earns, a year.
 *
 * SLATE's own. Icelandic deposit rates have been high by European standards for
 * most of the period this game is set in, and a saver who leaves money alone for
 * a year has had something worth having. Three percent is deliberately at the
 * modest end of that: it should reward the decision without making the decision
 * obvious, and a player who moves everything into deposit should be a little
 * better off rather than transformed.
 *
 * The bite, at the career this build actually produces: a player ending on about
 * EUR 780,000 who swept to deposit as they went earns tens of thousands over a
 * career. That is a real number and not a life-changing one, which is the right
 * size for a decision that costs nothing but attention.
 */
export const DEPOSIT_A_YEAR = 0.03;

/**
 * A company's cash earns nothing here, and there is no constant for it because
 * the constant was written, measured and deleted.
 *
 * It is true of the world and it failed the only test that decides whether a
 * number belongs in this build. Three percent on the group's operating cash,
 * with a month of payroll left as a float, over twenty-five played years: EUR
 * 1.33bn of interest, taking the group from EUR 2.81bn to EUR 4.11bn — and not
 * one decision anywhere in the save comes out differently. The group never had
 * any risk of running out; the film company is carried either way. What the
 * figure did reach was `stillToCarry`, the family's remaining patience, which
 * the greenlight door reads — so a rate nobody chose raised the ceiling on what
 * the pictures may commit to by forty-seven percent.
 *
 * The hoard was the real finding and it was not a banking one. It has since been
 * answered where it belonged, in `content/sugar.ts`: the group retains a year of
 * the worldwide payroll and distributes the rest to the two people who own it, so
 * the balance is EUR 142m rather than EUR 2.81bn and the money lands on people
 * whose accounts something reads. Which is also why paying a rate on it would have
 * been the wrong answer twice over — it would have grown a pile that should not
 * have been there.
 */

/**
 * The card's rate, which the card already carried and nothing ever charged.
 *
 * This is the one number in the file that is not new. `engine/index.ts` has
 * opened every save's card at 22.49% since long before this file existed, the
 * money screen has printed it on the account page, and no posting anywhere ever
 * applied it. A rate declared, displayed, and never charged is the exact shape
 * this project's one rule is about — so the number stays and it is read here.
 */
export const CARD_A_YEAR = 0.2249;

/**
 * The least a card holder is expected to find each month, as a share of what is
 * owed, and the floor under it.
 *
 * Not enforced, and that is deliberate. There is no collections system here, no
 * default, no credit file to mark — building one would be a subsystem to answer
 * a question nobody has asked. What the minimum is for is the sentence on the
 * screen: it says what a person in this position would be paying, so a player
 * who ignores the card is ignoring something specific rather than something
 * vague.
 */
export const CARD_LEAST_A_MONTH = 0.03;
export const CARD_LEAST_FLOOR: Money = 2_500;

/** The memos every posting in this file is written under. */
export const INTEREST_EARNED_MEMO = 'Interest On Deposit';
export const INTEREST_CHARGED_MEMO = 'Interest On The Card';
export const TRANSFER_MEMO = 'Moved Between Accounts';
export const INCOME_TAX_MEMO = 'Income Tax';

/**
 * The month a personal return is settled, and the year it is settled for.
 *
 * Iceland assesses the previous year and the assessment lands in the spring, so
 * the money leaves in the year after the year it was earned — which matters, and
 * is not a detail: a career that ends on a good year has a bill arriving after
 * it, and a player who spent everything the year they earned it finds that out.
 *
 * The group's corporation tax uses the same shape and its own constant, in
 * `content/sugar.ts`, because a company's year and a person's are different
 * filings that happen to fall near each other.
 */
export const PERSONAL_RETURN_MONTH = 6;
