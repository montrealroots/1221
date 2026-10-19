/**
 * Batch 6: `content/roundups.ts`, the Round-Ups panel under Your Accounts Over Time (`ui/bank/RoundUps.tsx`): each
 * bank's `product`, `words`, `short` ("When the account is short: …"), `open` and `notHere` ("Not in the game: …") and
 * `source`. The money area wrote these on 2026-10-13 from research read that day, in the player's words, and most stay.
 * What changes: the shared sentence for a shortfall the bank doesn't explain, which said "nothing moves that day, all
 * or nothing" and "what was counted is dropped"; "current account" in the game's own words; and KakaoBank's sweep,
 * "the day before's closing balance under 1,000원", in the game's money form and order. Applied with `apply-text.mjs`.
 */
const R = 'src/engine/content/roundups.ts';
export default [
  { file: R, key: 'DROPPED_UNSAID',
    old: 'const DROPPED_UNSAID = \'In the game, nothing moves that day, all or nothing, and never into an overdraft, and what was counted is dropped: the bank doesn’t say whether it’s carried.\';',
    new: 'const DROPPED_UNSAID = \'In the game, none of that day’s round-ups move, never just some of them and never into an overdraft, and they’re dropped: the bank doesn’t say whether they’re carried.\';' },
  { file: R, key: 'mx-santander.open',
    old: '\'That credit card round-ups come from the current account is inferred, not stated.\'',
    new: '\'Santander doesn’t say that a credit card purchase’s round-up comes from your checking account; the game takes it from there.\'' },
  { file: R, key: 'mx-santander.notHere',
    old: '\'A meta is a goal kept inside the current account, not a savings product, and Santander’s pages disagree on whether it earns interest; the game moves it to your savings.\'',
    new: '\'A meta is a goal kept inside your checking account, not a savings product, and Santander’s pages disagree on whether it earns interest; the game moves it to your savings.\'' },
  { file: R, key: 'kr-kakaobank.words',
    old: 'words: \'Not a purchase round-up: on each weekday, Monday to Friday, holidays or not, the part of the day before’s closing balance under 1,000원 moves to your savings, the 저금통.\',',
    new: 'words: \'Not a purchase round-up: each weekday, Monday to Friday, holidays or not, the part of the previous day’s closing balance under ₩1,000 moves to your savings, the 저금통.\',' },
  { file: R, key: 'kr-kakaobank.short',
    old: 'short: \'Skipped when the balance is 1,000원 or less, never partial and never overdrawn.\',',
    new: 'short: \'It’s skipped when the balance is ₩1,000 or less, never moves just part, and never overdraws the account.\',' },
  { file: R, key: 'kr-kakaobank.open',
    old: '\'A sweep that would take the 저금통 past its 100,000원 cap: the game skips it.',
    new: '\'A sweep that would take the 저금통 past its ₩100,000 cap: the game skips it.' },
];
