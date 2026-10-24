/**
 * What the guide's chapters say, held to what the game does (from 2026-10-19, brief 15's tutorial area). Each case is a
 * sentence the second editorial pass found saying something the game doesn't do: the game’s behavior measured, then
 * the chapter's sentence read against it, so a rewrite that brings the old claim back fails here.
 *
 * - How You Are said condition came "after illness, injury and rest", though an injury takes stress and morale and
 *   leaves condition where it was (`mayHurt`, `systems/injury.ts`), as `docs/GLOSSARY.md`'s condition row has said
 *   since 2026-10-17.
 * - Cover, Benefits And Returns said "To see a doctor, choose a practice under Your Doctor on Health Cover, then press
 *   Book An Appointment", though the button books only a visit owed (one missed or called off): with none owed,
 *   `health.book` refuses, and Health Cover doesn't show it. The game books a visit itself when an illness or a
 *   condition's review calls for one (`systems/health.ts`), as How This Works' doctor entry says.
 *
 * From 2026-10-20 (brief 17, section 9, the tutorial area):
 * - What's Coming said you were at a commitment if you were "awake and out of hospital, and, for anything but your own
 *   care, in its town and not laid up by an injury", which kept someone laid up from a plan of their own and from
 *   orientation, though neither asks it (`world/plans.ts`; the orientation's check in `systems/coursework.ts`). A class
 *   asks it (`present`), your own care doesn't (`presentForCare`).
 * - Drama School said nothing of how a note is put right: a later piece shown with its part at `LEARNING.enough`, in any
 *   course, since the notes are kept by part and not by course (`noteKey`, `resolveNote`).
 * - You As An Actor said practice past four hours a day "stops counting", where the fifth hour is refused
 *   (`practiceRefusal`), and the Practice An Hour button grayed out with the reason under it.
 * - Your Bank and A Credit Card said a US card's introductory rate ends, and its penalty rate comes, with "a payment
 *   sixty days late", where the game's own late notice calls that moment thirty days late: both come at the second due
 *   date missed in a row (`credit.missed >= 2`, `systems/credit.ts`), the money editor's finding.
 * - The Player Profile's entry put the advice's record "with “From your record:”", its preparation "on the first line",
 *   and listed as The First Line what brief 16 moved behind Why This Recommendation (`AdviceCard`, `adviceSummary`), the
 *   profile editor's finding.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CHAPTER_BY_ID } from '@/engine/content/tutorial';
import { injuryOf, laidUp, mayHurt } from '@/engine/systems/injury';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY } from '@/engine/core/time';
import { healthOf, present, presentForCare } from '@/engine/systems/health';
import { courseworkOf } from '@/engine/systems/coursework';
import { LEARNING, noteKey, recordNote, resolveNote, type NoteRecord } from '@/engine/systems/learning';
import { EXERCISES, PRACTICE } from '@/engine/content/practice';
import { practiceRefusal } from '@/engine/systems/practice';
import { DUE_KIND, cardOf } from '@/engine/systems/credit';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { exerciseFor } from '@/engine/content/practice';
import { adviceSummary } from '@/engine/systems/next-steps';
import type { Recommendation } from '@/engine/systems/experience';
import { AdviceCard } from '@/ui/components/AdviceCard';

/** A chapter's sentences, its body and its details, the asides in brackets left out. */
function sentences(id: string): string[] {
  const c = CHAPTER_BY_ID[id]!;
  return [...c.body, ...(c.more ?? [])].join(' ').replace(/\s*\([^)]*\)/g, '').split(/(?<=[.!?])\s+/);
}

describe('How You Are on what wears condition down', () => {
  /** A new life hurt on a run: what the injury did to condition, stress and morale. */
  function hurt() {
    const sim = quickSave({}, 'guide-facts-injury');
    const w = sim.player.wellbeing;
    const before = { condition: w.condition, stress: w.stress, morale: w.morale };
    const injury = mayHurt(sim, sim.player, 'run', 1, sim.now);
    expect(injury).toBeDefined();
    expect(injuryOf(sim.player, sim.now)).toBeDefined();
    return { before, after: { condition: w.condition, stress: w.stress, morale: w.morale } };
  }

  it('an injury moves stress and morale and leaves condition as it was', () => {
    const { before, after } = hurt();
    expect(after.condition).toBe(before.condition);
    expect(after.stress).toBeGreaterThan(before.stress);
    expect(after.morale).toBeLessThan(before.morale);
  });

  it('names no injury among what wears condition down', () => {
    const { before, after } = hurt();
    const said = sentences('body').filter((s) => /\bCondition is\b|\bwears? (it|condition) down\b|\bcondition (falls|drops)\b/i.test(s));
    expect(said.length).toBeGreaterThan(0);
    // Only while an injury leaves condition where it was: change that, and the chapter may say it.
    if (after.condition === before.condition) for (const s of said) expect(s).not.toMatch(/\binjur/i);
  });
});

describe('Cover, Benefits And Returns on Book An Appointment', () => {
  /** A new life with no visit owed, asking to book one. */
  function bookUnowed() {
    const sim = quickSave({}, 'guide-facts-book');
    expect(sim.player.health?.owedVisit).toBeUndefined();
    return sim.execute({ kind: 'health.book', payload: {} });
  }

  it('books only a visit owed: with none, it’s refused and nothing is booked', () => {
    const r = bookUnowed();
    expect(r.ok).toBe(false);
    expect(r.error).toBe('There’s nothing to see a doctor about.');
  });

  it('is said to book again a visit missed or called off, not any visit you want', () => {
    const refused = !bookUnowed().ok;
    const said = sentences('papers').filter((s) => /\bBook An Appointment\b/.test(s));
    expect(said.length).toBeGreaterThan(0);
    // Only while an unowed booking is refused: change that, and the chapter may offer it freely.
    if (refused) for (const s of said) expect(s).toMatch(/\b(miss(ed)?|again|owed|call(ed)? (it )?off)\b/i);
  });
});

/** A new life at Yale on its first morning, as a player begins one (7:30 AM, August 24, 2026). */
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

describe('What’s Coming on what an injury that lays you up keeps you from', () => {
  /** A first morning laid up with a broken bone, a plan of your own at eight, and the clock run past Registration at ten. */
  function laidUpMorning() {
    const sim = student('guide-facts-laid-up');
    // TEST SETUP: a broken bone this morning, which keeps you off work and out of class for six weeks.
    healthOf(sim.player).injury = { kind: 'fracture', at: sim.now, until: sim.now + 42 * MS_DAY, offWorkUntil: sim.now + 42 * MS_DAY };
    expect(laidUp(sim.player, sim.now)).toBe(true);
    const { id } = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Coffee', at: sim.now + 30 * 60_000, durationMinutes: 30 } });
    sim.advanceTo(sim.now + 5 * 60 * 60_000);
    return {
      plan: sim.timeline.get(id)!.status,
      registered: courseworkOf(sim, sim.player)!.orientation.done.register !== undefined,
      atClass: present(sim.player, sim.now),
      atCare: presentForCare(sim.player, sim.now),
    };
  }

  it('keeps you from a class, and not from a plan of your own, orientation or your own care', () => {
    const r = laidUpMorning();
    expect(r.plan).not.toBe('missed');
    expect(r.registered).toBe(true);
    expect(r.atClass).toBe(false);
    expect(r.atCare).toBe(true);
  });

  it('is said so: the injury keeps you from classes, and not from your doctor, orientation or a plan of your own', () => {
    const r = laidUpMorning();
    const said = sentences('calendar').filter((x) => /\binjur/i.test(x));
    expect(said.length).toBeGreaterThan(0);
    for (const x of said) expect(x).not.toMatch(/anything but your own care/);
    // Only while the game keeps it so: change one, and the sentence may say otherwise.
    if (!r.atClass) expect(said.some((x) => /keeps you from[^.]*\bclasses\b/.test(x))).toBe(true);
    if (r.plan !== 'missed' && r.registered && r.atCare) for (const x of said) expect(x).toMatch(/not from your doctor, your therapist, orientation or a plan of your own/);
  });
});

describe('Drama School on how a note is put right', () => {
  it('a note on a part, given in one course, is put right in another: the notes are kept by part', () => {
    const notes: NoteRecord[] = [];
    const focus = { kind: 'dim', dim: 'memorization' } as const;
    recordNote(notes, focus, '2026-09-10', 'a1', 'Acting I');
    expect(noteKey(focus)).not.toContain('Acting');
    expect(resolveNote(notes, noteKey(focus), '2026-09-24', 'a2', 'Voice I')).toBe(true);
    expect(notes[0]!.status).toBe('resolved');
  });

  it('is said with its figure: a later piece, in any course, shown with the part at LEARNING.enough or more', () => {
    const said = sentences('school').filter((x) => /\bnote\b/.test(x) && /\bopen\b|put (it )?right/.test(x));
    expect(said.length).toBeGreaterThan(0);
    expect(said.join(' ')).toContain(`in any course, is shown with the part it named at ${Math.round(LEARNING.enough * 100)}% or more`);
  });
});

describe('You As An Actor on the day’s practice', () => {
  it('refuses the hour past the day’s limit, with the reason, and is said to gray it out, not to let it count for nothing', () => {
    const sim = student('guide-facts-practice');
    // TEST SETUP: the first week's commitments taken off, so the hours aren't refused for them.
    for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
    const e = EXERCISES.find((x) => !x.feet && !x.partnered)!;
    for (let n = 0; n < PRACTICE.dailyHours; n += 1) expect(sim.execute({ kind: 'practice.exercise', payload: { exercise: e.id } }).ok).toBe(true);
    const no = practiceRefusal(sim, sim.player, e);
    expect(no).toBe(`You’ve practiced ${PRACTICE.dailyHours} hours today, and more stops helping after that. Practice again tomorrow.`);
    const said = sentences('profile').filter((x) => /hours of practice in a day|a day stops counting/.test(x));
    expect(said.length).toBe(1);
    if (no) expect(said[0]).toMatch(/Practice An Hour is grayed out until tomorrow/);
  });
});

describe('Your Bank on what ends a US card’s introductory rate', () => {
  /**
   * A Chase card owing $500, nothing to pay it with, run past its next due date and the one after; then, from brief 21
   * (2026-10-22), on to the 61st day after the first missed and 45 days past that, a day at a time. Until then the
   * introductory rate ended at the second due date missed, and the chapter said so.
   */
  function twoMissed() {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', wealth: 'comfortable', bankId: 'us-chase' }, 'guide-facts-two-missed');
    const card = cardOf(sim, sim.player)!;
    const credit = sim.player.credit!;
    // TEST SETUP: a new card, its fifteen months ahead of it, so its introductory rate runs past the days read here.
    card.openedAt = sim.now;
    // TEST SETUP: $500 owed on the card, and every account of theirs emptied, so each due date's payment fails.
    const post = (accountId: string, amount: number) => sim.post({ memo: 'test', category: 'test', postings: [{ accountId, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
    post(card.id, -card.balance - 500_00);
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.id !== card.id && a.balance > 0) post(a.id, -a.balance);
    // A day at a time, the state kept at each due date that passes (`DUE_KIND`), until two have.
    const seen: { missed: number; introLost: boolean }[] = [];
    for (let d = 0; d < 120 && seen.length < 2; d += 1) {
      const due = sim.timeline.pending().find((i) => i.kind === DUE_KIND && i.payload.personId === sim.player.id && i.at <= sim.now + MS_DAY);
      sim.advanceTo(sim.now + MS_DAY);
      if (due) seen.push({ missed: credit.missed ?? 0, introLost: Boolean(credit.introLost) });
    }
    expect(seen).toHaveLength(2);
    // On to the 61st day after the first due date missed, and 45 days past it, kept broke.
    const first = credit.pastDue![0]!.at;
    const broke = () => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.id !== card.id && a.balance > 0) post(a.id, -a.balance); };
    const on = (days: number) => { while (sim.now < first + days * MS_DAY) { broke(); sim.advanceTo(Math.min(first + days * MS_DAY, sim.now + MS_DAY)); } return { missed: credit.missed ?? 0, introLost: Boolean(credit.introLost), ends: credit.introEndsAt }; };
    const day60 = on(60);
    const day61 = on(61);
    const before = on(61 + 44);
    const after = on(61 + 46);
    return [...seen.map((x) => ({ ...x, ends: undefined })), day60, day61, before, after];
  }

  it('ends it 45 days after a minimum more than 60 days late, not at the second payment missed in a row', () => {
    const [first, second, day60, day61, before, after] = twoMissed();
    expect(first).toEqual({ missed: 1, introLost: false, ends: undefined });
    expect(second).toEqual({ missed: 2, introLost: false, ends: undefined });
    expect(day60!.introLost).toBe(false);
    expect(day60!.ends).toBeUndefined();
    // The notice on the 61st day sets the day it ends, 45 days on; it still runs the day before.
    expect(day61!.ends).toBeDefined();
    expect(before!.introLost).toBe(false);
    expect(after!.introLost).toBe(true);
  });

  it('is said so: a minimum more than 60 days late, in the chapter and in the card’s entries, and never two payments missed', () => {
    const words = [...sentences('bank'), ...GUIDE_BY_ID['bank.card']!.later, ...GUIDE_BY_ID['bank.card-offers']!.reads.map((f) => f.value)].join(' ');
    expect(words).not.toMatch(/two payments missed in a row end|Two missed in a row also end/i);
    expect(sentences('bank').join(' ')).toContain('In the US a minimum payment more than 60 days late brings the bank’s notice, and 45 days later any introductory rate ends');
    expect(GUIDE_BY_ID['bank.card']!.later.join(' ')).toContain('On a US card, a minimum payment more than 60 days late, counted from its due date, brings the bank’s notice. 45 days later any penalty rate the card has applies');
    expect(GUIDE_BY_ID['bank.card-offers']!.reads.find((f) => f.label === 'The Introductory Rate')!.value).toContain('On a US card a minimum payment more than 60 days late ends it, 45 days after the bank’s notice');
  });
});

describe('The Player Profile’s entry on What To Work On Next', () => {
  /**
   * The card as the Profile draws it (`AdviceCard`), for recommendations made as `recommendations` makes them (TEST
   * SETUP, as in tests/advice-card.test.ts): a training one first, the weakness the work keeps coming back to, with how
   * long it has led, and a preparation after it.
   */
  function card() {
    const sim = student('guide-facts-advice');
    const first: Recommendation = {
      target: 'imagination', label: 'Imagination', exercise: exerciseFor('imagination')!.id, tier: 0, focus: 'steady', points: 0.6, why: '20 hours …',
      forecast: { points: 0.6, exact: 0.6, from: 41, to: 52, hours: 20, pieces: 3, of: 5 },
      recurring: { last: sim.now, evidence: ['An ability, 31.5 points in all'], pieces: 9, whole: 31.5 },
      standing: 'It has led the advice on what to train since today.',
    };
    const act = 'That’s preparation, not training: prepare that part further before you show or tape the next piece.';
    const now = 'Coming to your work short on rehearsal cost each piece about 1 point off the whole.';
    const advice = adviceSummary(sim, sim.player, [first, { target: 'prep:Rehearsal', label: 'Rehearsal', focus: 'preparation', points: 1, why: `${now} ${act}`, now, act }])!;
    const html = renderToStaticMarkup(createElement(AdviceCard, { advice }));
    const at = html.indexOf('<details');
    return { advice, face: html.slice(0, at), behind: html.slice(at) };
  }
  const read = (label: string) => GUIDE_BY_ID['craft.profile']!.reads.find((f) => f.label === label)?.value ?? '';

  it('shows what to work on, why, the next hour and the estimate, and keeps the record and the rest behind Why This Recommendation', () => {
    const { advice, face, behind } = card();
    for (const x of [advice.what, advice.why, advice.estimate!]) expect(face).toContain(x);
    expect(face).toContain('Practice An Hour');
    expect(face).toMatch(/An hour costs \d+ energy, and it would add about \+/);
    expect(behind.startsWith('<details')).toBe(true);
    expect(behind).toContain('<summary>Why This Recommendation</summary>');
    expect(advice.details.map((d) => d.heading)).toEqual(['How The Estimate Is Worked Out', 'How Long It’s Been First', 'From Your Record', 'Other Things Worth Your Time']);
    for (const d of advice.details) { expect(behind).toContain(d.heading); expect(face).not.toContain(d.heading); }
  });

  it('is said so: the record under From Your Record and the rest behind Why This Recommendation, with no first line', () => {
    const { face, behind } = card();
    expect(GUIDE_BY_ID['craft.profile']!.reads.map((f) => f.label)).not.toContain('The First Line');
    for (const f of GUIDE_BY_ID['craft.profile']!.reads) expect(f.value).not.toMatch(/From your record:|on the first line/);
    // Only while the card keeps them behind its button: change that, and the words may say otherwise.
    if (behind.includes('From Your Record') && !face.includes('From Your Record')) {
      expect(read('What Each Line Says')).toContain('under From Your Record, behind Why This Recommendation');
      expect(read('Preparation, Said Apart')).toContain('is said apart, behind Why This Recommendation');
      expect(read('What The Card Shows')).toMatch(/^What to work on, why now, .* and the estimate\. Why This Recommendation holds the rest: /);
    }
  });
});
