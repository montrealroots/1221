/**
 * Until 2026-10-12 the tutorial's Money chapter said Money showed your card and your credit record, and that the record
 * showed as a number in the United States and Canada and as a word elsewhere. Home's affairs became a line each in 986ac341
 * (2026-10-09), and Home's card-and-record panel (`CardSummary`) went with it: the Money line shows the current
 * account, the net worth and what of it's owed, the card is on the bank's Cards tab, and the record's own figure shows
 * only when a life is made (`ui/creation/CharacterCreation.tsx`), as the guide's entry on the record
 * (`content/guide/money.ts`) already said. The chapter was held here against Home's own source, both ways: put the card
 * or the record back on Home and the chapter had to say so again. With the owner's brief 23 (2026-10-23) the Money line
 * went from Home, and what it said came to the head of Money (`WorthWords`, `ui/components/Glance.tsx`): the chapter's
 * “At its top” is held against that head now, the same both ways.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CHAPTER_BY_ID } from '@/engine/content/tutorial';

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

/** The chapter's sentences without their asides in brackets: the net worth's says what's owed on the card. */
function sentences(body: readonly string[]): string[] {
  return body.join(' ').replace(/\s*\([^)]*\)/g, '').split(/(?<=[.!?])\s+/);
}

describe('the tutorial’s Money chapter on what the head of Money shows', () => {
  const chapter = CHAPTER_BY_ID['money']!;
  // The head of Money: the bank's sum, up to the end of its page head, and the net worth under it (`WorthWords`). What
  // shows the card (what it owes of its limit, its terms) and the record's figure, read from there. Until 2026-10-23
  // this read Home, whose Money line it was.
  const bank = source('ui/workspaces/BankWorkspace.tsx');
  const from = bank.indexOf('<LookRegion className="page-head">');
  const worth = /export function WorthWords\(\)[\s\S]*?\n}\n/.exec(source('ui/components/Glance.tsx'));
  const head = bank.slice(from, bank.indexOf('</LookRegion>', from)) + (worth?.[0] ?? '');
  const headShowsCard = /\bcardOf\(|\bcardTerms\(|\.creditLimit\b/.test(head);
  const headShowsRecord = /\bscoreWord\(|\bscoreIsANumberIn\(|\bcredit\.score\b|\bcreditScore\b/.test(head);
  const saidOfHead = sentences(chapter.body).filter((s) => /\bAt its top\b/.test(s));

  it('says the card is on it only when the head of Money shows the card', () => {
    expect(from).toBeGreaterThan(-1);
    expect(head).toMatch(/<WorthWords \/>/);
    expect(worth).not.toBeNull();
    expect(saidOfHead.length).toBeGreaterThan(0);
    expect(saidOfHead.some((s) => /\bcard\b/.test(s))).toBe(headShowsCard);
  });

  it('says the record is on it only when the head of Money shows the record', () => {
    expect(saidOfHead.some((s) => /\brecord\b/.test(s))).toBe(headShowsRecord);
  });

  it('says where the record shows as a number or a word: when a life is made, unless the head of Money shows it', () => {
    expect(source('ui/creation/CharacterCreation.tsx')).toMatch(/\bscoreWord\(/);
    const figure = sentences(chapter.body).filter((s) => /\ba number in\b/.test(s));
    expect(figure.length).toBeGreaterThan(0);
    if (!headShowsRecord) for (const s of figure) expect(s).toMatch(/\ba life is made\b/);
  });
});
