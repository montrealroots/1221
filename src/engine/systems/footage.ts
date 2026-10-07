/**
 * SLATE — footage of the actor's work, and the reel cut from it (from
 * 2026-10-08; `career.reel` in `systems/career.ts` cuts it).
 *
 * **What exists.** Read from the record, never kept beside it:
 * - each self-tape shown in class (On-Camera Acting Technique, DRAM 463, where
 *   "brief scenes ... are filmed, watched, discussed"; Taming The Cyclops,
 *   DRAM 473b), recorded on the actor's own phone: there while they own a
 *   phone (SLATE's reading: the file lives on it);
 * - the film monologue DRAM 473b shoots "with the help of a professional
 *   cinematographer", edited and "posted on the School website at the end of
 *   the final semester" (research-yale-school-2.json): there from the degree,
 *   as good as the course's last work showed;
 * - each screen credit, professionally shot: there once it's worked.
 * Footage that showed as unready isn't fit to show casting.
 *
 * **What the reel does.** Cut from the footage chosen, it's as good as what's
 * in it on average (`reelBand`), so adding weak footage to strong pulls it
 * down. It's read in one place: a paid submission's chance of being called
 * back (`REEL_CALLBACK`), on top of having a reel at all, which opens the
 * breakdowns that ask for one. It isn't read again at the audition, where the
 * actor's craft is: the work shown on it counted once, as skill, where it was
 * done. The factors are SLATE's estimate.
 */

import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import { phonesOf } from './phones';
import type { Band } from './coursework';

export interface Footage { id: string; kind: 'self-tape' | 'film-monologue' | 'screen'; label: string; band: Band; at?: Instant; available: boolean; why?: string }

const VALUE: Record<Band, number> = { unready: 0, working: 1, strong: 2, exceptional: 3 };
const BAND_AT: readonly Band[] = ['unready', 'working', 'strong', 'exceptional'];
export const REEL_CALLBACK: Record<Band, number> = { unready: 0.85, working: 1, strong: 1.1, exceptional: 1.2 };
/** A screen job's footage, professionally shot, reads as strong (SLATE's estimate). */
const SCREEN_BAND: Band = 'strong';

type Shown = { id: string; template: string; course: string; sceneId?: string; shown?: { band: Band; at: Instant }; revision?: { band?: Band } };

/** Everything filmed of the actor's work, with whether it can be used now and why not. */
export function footageOf(person: Person, screenCredits: readonly { id: string; label: string; at?: Instant }[] = []): Footage[] {
  const out: Footage[] = [];
  const assignments = ((person.school as { coursework?: { assignments: Shown[] } } | undefined)?.coursework?.assignments ?? []);
  const phone = phonesOf(person).length > 0;
  for (const a of assignments) {
    if (a.template !== 'self-tape' || !a.shown) continue;
    const course = a.course === 'DRAM 473b' ? 'Taming The Cyclops' : 'On-Camera Acting Technique';
    out.push({ id: `tape:${a.id}`, kind: 'self-tape', label: `A Self-Tape, ${course}`, band: a.revision?.band ?? a.shown.band, at: a.shown.at, available: phone, ...(phone ? {} : { why: 'It was recorded on your phone, and you have no phone now.' }) });
  }
  if (person.school?.filmed) {
    // As good as the course's last work showed; working where it set none (a save from before its coursework).
    const last = assignments.filter((a) => a.course === 'DRAM 473b' && a.shown).at(-1);
    out.push({ id: 'film-monologue', kind: 'film-monologue', label: 'Your Film Monologue, Shot At School', band: last?.revision?.band ?? last?.shown?.band ?? 'working', available: true });
  }
  for (const c of screenCredits) out.push({ id: `screen:${c.id}`, kind: 'screen', label: c.label, band: SCREEN_BAND, ...(c.at ? { at: c.at } : {}), available: true });
  return out;
}

/** Whether a piece of footage can go on a reel, or why not. */
export function footageRefusal(f: Footage | undefined): string | undefined {
  if (!f) return 'There’s no such footage.';
  if (f.band === 'unready') return 'It showed as unready: not something to show casting.';
  if (!f.available) return f.why ?? 'You can’t get at that footage.';
  return undefined;
}

/** A reel's band: the average of what's on it, rounded. */
export function reelBand(bands: readonly Band[]): Band {
  if (!bands.length) return 'working';
  const mean = bands.reduce((s, b) => s + VALUE[b], 0) / bands.length;
  return BAND_AT[Math.round(mean)]!;
}

/** The reel's effect on a paid submission's callback: its band's, or 1 for a reel cut before reels were read (and none for no reel). */
export function reelCallback(cut: { band?: Band } | undefined): number {
  return cut?.band ? REEL_CALLBACK[cut.band] : 1;
}

