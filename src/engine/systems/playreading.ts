/**
 * SLATE — reading real plays, and researching them (from 2026-10-08; the
 * plays and their facts in `content/contemporary.ts`).
 *
 * **What's to be had.** A copy is borrowed from the Haas Arts Library at
 * school, once orientation's tour has shown it you. After school, a town's
 * library card lent one (`reading.library_card`) until the cards went in the
 * scope reset of 2026-10-09; this said until 2026-10-10 that they still did.
 *
 * **Reading one** (`plays.read`) takes two hours, an hour for a short play or
 * a monologue (SLATE's estimate of a close first read), and works the
 * actor's general text craft (`script`), as a step of coursework that trains
 * it does. A play read again is three-quarters the time and half the
 * training, and nothing to the craft inside a month of the last read: too
 * soon to see it fresh. Learning a particular part is another thing, and
 * isn't this: the parts of a play under copyright aren't in SLATE.
 *
 * **What a read leaves** is a note on what was read, from the play's own facts:
 * its form, its cast as published and whether there's a part in it for you by
 * the cast's women and men and its youngest age, its setting. From 2026-10-09
 * a read grows imagination as well as the text craft, each kept on the
 * development history (`ordinary`). Read again, the
 * note says when the last read was and turns to what wasn't noticed before;
 * read through everything on record, it says so.
 *
 * **Researching it** (`plays.research`, once a play, after a read, ninety
 * minutes at the library) finds its first production, its first edition and
 * who licenses it (the last from 2026-10-08), and trains the craft once more.
 *
 * Every number here is SLATE's estimate.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, ageOn, formatDate, type Instant } from '../core/time';
import { CONTEMPORARY_PLAYS, type ContemporaryPlay } from '../content/contemporary';
import { exerts } from './body';
import { focusAt, ordinary, schoolEnded } from './school';
import { startRefusal } from './life';

export const PLAYREADING = {
  minutes: { full: 120, short: 60, research: 90 },
  /** A read again, as a share of the first's time. */
  again: 0.75,
  /** The craft a session trains (`grow`'s weight): a coursework step that trains is 0.25. */
  weight: { read: 0.25, again: 0.125, research: 0.25 },
  /** Days before a read again trains anything. */
  freshDays: 30,
  /** Sitting reading, in METs. */
  met: 1.5,
  notesKept: 6,
} as const;

export interface PlayStudy { reads: number; lastAt: Instant; noticed: string[]; researchedAt?: Instant; notes: { at: Instant; what: string }[] }

export const playById = (id: string): ContemporaryPlay | undefined => CONTEMPORARY_PLAYS.find((p) => p.id === id);
export const studiesOf = (person: Person): Record<string, PlayStudy> => (person.plays ??= {});
const short = (p: ContemporaryPlay) => /short play|monologue/.test(p.form ?? '');

/** Where a copy is to be had now, or why not. */
export function copyAt(person: Person): { library: string } | { no: string } {
  const school = person.school;
  if (school && !schoolEnded(school.standing)) {
    const cw = (school as { coursework?: { orientation: { done: { tour?: number }; behind?: boolean } } }).coursework;
    // “A copy is at the Haas Arts Library, in New Haven.” went on 2026-10-13, reached by no play: a life is enrolled only
    // where it begins in New Haven (`populateWorld`, `engine/index.ts`), and nothing has moved a person since the scope
    // reset of 2026-10-09.
    if (cw && !cw.orientation.done.tour && !cw.orientation.behind) return { no: 'You don’t know where the library is yet. The building tour in Orientation shows you.' };
    return { library: 'The Haas Arts Library' };
  }
  // After the school a town's library card lent one (`systems/reading.ts`), until the cards went in the scope reset of 2026-10-09.
  return { no: 'A copy is borrowed from the Haas Arts Library, which lends to students.' };
}

/** Whether there's a part in it for this person by the published cast: yes, no or not on record. */
export function partFor(person: Person, p: ContemporaryPlay, at: Instant, zone: string): 'yes' | 'no' | 'unknown' {
  const c = p.cast;
  if (!c || c.f === undefined) return 'unknown';
  if (c.minAge && ageOn(person.birthInstant, at, zone) < c.minAge - 10) return 'no';
  return (person.performerTitle === 'actress' ? c.f : c.m!) > 0 ? 'yes' : 'no';
}

/** What a read notices, aspect by aspect, from the facts there are. */
function aspects(person: Person, p: ContemporaryPlay, at: Instant, zone: string): { id: string; words: string }[] {
  const out: { id: string; words: string }[] = [];
  if (p.form) out.push({ id: 'form', words: `It reads as ${/^[aeiou]/.test(p.form) ? 'an' : 'a'} ${p.form}.` });
  if (p.cast) {
    const fit = partFor(person, p, at, zone);
    const counted = p.cast.f !== undefined ? `${p.cast.f} ${p.cast.f === 1 ? 'woman' : 'women'} and ${p.cast.m} ${p.cast.m === 1 ? 'man' : 'men'}` : p.cast.text;
    out.push({ id: 'cast', words: `The cast as published: ${counted}${p.cast.minAge ? `, every part at least ${p.cast.minAge}` : ''}. ${fit === 'yes' ? 'There’s a part in it for you.' : fit === 'no' ? 'Nothing in it is written for you now.' : ''}`.trim() });
  }
  if (p.setting) out.push({ id: 'setting', words: `It’s set: ${p.setting}.` });
  return out;
}

export function readRefusal(sim: Simulation, person: Person, playId: string, minutes: number = PLAYREADING.minutes.short): string | undefined {
  if (!playById(playId)) return 'There’s no such play.';
  const copy = copyAt(person);
  if ('no' in copy) return copy.no;
  return startRefusal(sim, person, minutes);
}

export function researchRefusal(sim: Simulation, person: Person, playId: string): string | undefined {
  const no = readRefusal(sim, person, playId, PLAYREADING.minutes.research);
  if (no) return no;
  const s = studiesOf(person)[playId];
  if (!s) return 'Read the play first. You need questions before you can research it.';
  if (s.researchedAt) return 'You’ve already researched its first production, and there’s nothing more on record to find.';
  return undefined;
}

function note(s: PlayStudy, at: Instant, what: string): void {
  s.notes.unshift({ at, what });
  if (s.notes.length > PLAYREADING.notesKept) s.notes.length = PLAYREADING.notesKept;
}

export function registerPlayReading(sim: Simulation): void {
  sim.onCommand<{ playId: string }, { minutes: number; note: string }>('plays.read', (q, { sim: s }) => {
    const person = s.player;
    const id = String(q?.playId);
    const p = playById(id);
    const all = studiesOf(person);
    const before = all[id];
    const minutes = p ? Math.round((short(p) ? PLAYREADING.minutes.short : PLAYREADING.minutes.full) * (before ? PLAYREADING.again : 1)) : 0;
    const no = readRefusal(s, person, id, minutes);
    if (no || !p) throw new CommandError(no ?? 'There’s no such play.');
    const focus = focusAt(s, person, s.now);
    s.advanceTo(s.now + minutes * 60_000);
    exerts(person, PLAYREADING.met, minutes / 60);
    const study = before ?? { reads: 0, lastAt: s.now, noticed: [], notes: [] };
    const fresh = !before || s.now - before.lastAt >= PLAYREADING.freshDays * MS_DAY;
    // The text craft, and imagination with it (from 2026-10-09, `content/abilities.ts`), recorded on the development history.
    if (person.craft && fresh) {
      ordinary(s, person, 'script', focus, before ? PLAYREADING.weight.again : PLAYREADING.weight.read, `read:${id}`);
      ordinary(s, person, 'imagination', focus, before ? PLAYREADING.weight.again : PLAYREADING.weight.read, `read:${id}`);
    }
    const seen = aspects(person, p, s.now, s.zone);
    let words: string;
    if (!before) {
      words = [`${p.title}, by ${p.by}, read through.`, ...seen.map((x) => x.words)].join(' ');
      study.noticed = seen.map((x) => x.id);
    } else {
      const when = `You read it again. Your last read was ${formatDate(before.lastAt, s.zone)}.`;
      // What's turned to this time: an aspect not noticed before, else the one noticed longest ago.
      const next = seen.find((x) => !before.noticed.includes(x.id)) ?? seen.find((x) => x.id === before.noticed[0]);
      if (next && fresh) study.noticed = [...before.noticed.filter((x) => x !== next.id), next.id];
      words = !fresh ? `${when} It’s too soon after that one to see it fresh.` : next ? `${when} This time: ${next.words}` : `${when} There’s nothing on record about it to turn to: what’s left is the page itself.`;
    }
    study.reads += 1;
    study.lastAt = s.now;
    note(study, s.now, words);
    all[id] = study;
    return { minutes, note: words };
  });

  sim.onCommand<{ playId: string }, { minutes: number; note: string }>('plays.research', (q, { sim: s }) => {
    const person = s.player;
    const id = String(q?.playId);
    const no = researchRefusal(s, person, id);
    if (no) throw new CommandError(no);
    const p = playById(id)!;
    const study = studiesOf(person)[id]!;
    const minutes = PLAYREADING.minutes.research;
    const focus = focusAt(s, person, s.now);
    s.advanceTo(s.now + minutes * 60_000);
    exerts(person, PLAYREADING.met, minutes / 60);
    if (person.craft) ordinary(s, person, 'script', focus, PLAYREADING.weight.research, `research:${id}`);
    const L = p.licensor;
    const rights = L?.withheld ? ' Its performing rights aren’t released.' : L?.agent ? ` Its rights are by application to the author’s agent, ${L.agent}.` : L?.us || L?.uk ? ` Licensed for performance${L.us ? ` in the US by ${L.us}` : ''}${L.us && L.uk ? ',' : ''}${L.uk ? ` in the UK by ${L.uk}` : ''}.` : ' Who licenses it isn’t on record.';
    const words = `First staged ${p.premiere.date ? `on ${p.premiere.date}` : `in ${p.premiere.year}`} at ${p.premiere.venue}.${p.published ? ` First published ${p.published.year}, by ${p.published.by}${p.published.acting ? ', an acting edition' : ''}.` : ' Its first edition isn’t on record.'}${rights}`;
    study.researchedAt = s.now;
    note(study, s.now, words);
    return { minutes, note: words };
  });
}
