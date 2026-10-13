/**
 * Until 2026-10-12 the tutorial's Money chapter said Money showed your card and your credit record, and that the record
 * showed as a number in the United States and Canada and as a word elsewhere. Home's affairs became a line each in 986ac341
 * (2026-10-09), and Home's card-and-record panel (`CardSummary`) went with it: the Money line shows the current
 * account, the net worth and what of it's owed, the card is on the bank's Cards tab, and the record's own figure shows
 * only when a life is made (`ui/creation/CharacterCreation.tsx`), as the guide's entry on the record
 * (`content/guide/money.ts`) already said. The chapter is held here against Home's own source, both ways: put the card
 * or the record back on Home and the chapter has to say so again.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CHAPTER_BY_ID } from '@/engine/content/tutorial';

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

/** The chapter's sentences without their asides in brackets: the net worth's says what's owed on the card. */
function sentences(body: readonly string[]): string[] {
  return body.join(' ').replace(/\s*\([^)]*\)/g, '').split(/(?<=[.!?])\s+/);
}

describe('the tutorial’s Money chapter on what the Money line shows', () => {
  const chapter = CHAPTER_BY_ID['money']!;
  const home = source('ui/screens/Home.tsx');
  // What Home reads to show the card (what it owes of its limit, its terms) and the record's figure. `cardsOf` only
  // names a card that's behind, in what weighs, and isn't the card shown.
  const homeShowsCard = /\bcardOf\(|\bcardTerms\(|\.creditLimit\b/.test(home);
  const homeShowsRecord = /\bscoreWord\(|\bscoreIsANumberIn\(|\bcredit\.score\b|\bcreditScore\b/.test(home);
  const saidOfMoney = sentences(chapter.body).filter((s) => /\b(Money|Home)\b/.test(s) && /\bshows?\b/.test(s));

  it('says the card is on it only when Home shows the card', () => {
    expect(saidOfMoney.length).toBeGreaterThan(0);
    expect(saidOfMoney.some((s) => /\bcard\b/.test(s))).toBe(homeShowsCard);
  });

  it('says the record is on it only when Home shows the record', () => {
    expect(saidOfMoney.some((s) => /\brecord\b/.test(s))).toBe(homeShowsRecord);
  });

  it('says where the record shows as a number or a word: when a life is made, unless Home shows it', () => {
    expect(source('ui/creation/CharacterCreation.tsx')).toMatch(/\bscoreWord\(/);
    const figure = sentences(chapter.body).filter((s) => /\ba number in\b/.test(s));
    expect(figure.length).toBeGreaterThan(0);
    if (!homeShowsRecord) for (const s of figure) expect(s).toMatch(/\ba life is made\b/);
  });
});
