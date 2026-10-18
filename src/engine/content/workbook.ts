/**
 * SLATE — working a problem through, in rehearsal (from 2026-10-12; `systems/workbook.ts`).
 *
 * The owner's brief of 2026-10-12 asked for rehearsal to be a process with memory: identify a problem, choose an
 * adjustment, rehearse it, observe the evidence, keep it or revise it, then perform, with the discoveries, notes,
 * preparation and choices kept, and read by later rehearsals; no loop of the same button, and no random setbacks.
 *
 * So a piece of work in progress (a practice brief, a scene for class, a part in a production) keeps a workbook. A
 * problem is found in the work's own forecast, the expected result with no draw (`systems/piece.ts`): the weakest
 * segment, a turn not yet worked, stamina failing late, a partner's part, an ability holding a segment back. Each kind
 * of problem admits its own adjustments, each a different change to the work, below. Trying one spends its time and
 * shows the evidence: the problem's own figure in the forecast before and after. A change of how a segment is played
 * or paced is kept or revised (put back); work done is done, and kept. A kept change is a discovery: every later
 * forecast, rehearsal and performance of the piece reads it. One revised isn't offered for that problem again.
 *
 * The sizes are SLATE's estimates, like the preparation steps' they sit beside; the shape is the rehearsal room's
 * (a scene worked in units, an adjustment tried and kept or thrown out), not a measured one.
 */

export type AdjustmentId = 'work-beat' | 'run-into' | 'beat-way' | 'breathe' | 'objective' | 'with-partner';
export type ProblemKind = 'segment' | 'turn' | 'stamina' | 'limit' | 'partner' | 'objective' | 'prep';

export interface AdjustmentDef {
  id: AdjustmentId;
  label: string;
  /** What it is, in a sentence. */
  words: string;
  minutes: number;
  /** On your feet: it needs the energy and a body that isn't hurt. */
  feet: boolean;
  /** A change of how it's played (kept or revised), or work (done, and kept). */
  kind: 'choice' | 'work';
  /** The problems it answers. */
  answers: readonly ProblemKind[];
}

export const ADJUSTMENTS: Readonly<Record<AdjustmentId, AdjustmentDef>> = {
  'work-beat': { id: 'work-beat', label: 'Work It Slowly', words: 'Take this part on its own, slowly, until it’s secure: its own rehearsal rises.', minutes: 30, feet: true, kind: 'work', answers: ['segment', 'turn', 'limit'] },
  'run-into': { id: 'run-into', label: 'Run Into It From The One Before', words: 'Run the end of the part before into this one, again and again, until the change between them is there.', minutes: 40, feet: true, kind: 'work', answers: ['turn', 'segment'] },
  'beat-way': { id: 'beat-way', label: 'Play This Part Another Way', words: 'Pace, size or shape this part its own way, where the whole is left open: it shifts this part toward other abilities.', minutes: 30, feet: true, kind: 'choice', answers: ['segment', 'limit', 'stamina'] },
  breathe: { id: 'breathe', label: 'Find Places To Breathe', words: 'Find where the piece lets you rest and spend less early, so there’s more left at the end.', minutes: 45, feet: true, kind: 'choice', answers: ['stamina'] },
  objective: { id: 'objective', label: 'Name What You Want In Each Part', words: 'At the desk: what you want in each part, what’s in the way, and what changes it. Your reading rests on it.', minutes: 30, feet: false, kind: 'work', answers: ['objective', 'limit', 'segment'] },
  'with-partner': { id: 'with-partner', label: 'Run It With Your Partner', words: 'Run it with whoever plays opposite you: they learn your timing and you theirs.', minutes: 45, feet: true, kind: 'work', answers: ['partner'] },
};

export const WORKBOOK = {
  /** How far a segment's own work moves toward secure, of what's left: working it slowly, and the two sides of a run into it. */
  workGain: 0.5, intoBefore: 0.25, intoAfter: 0.4,
  /** How far a way of playing a segment is rehearsed in by trying it, of what's left. */
  wayGain: 0.6,
  /** What finding places to breathe leaves of the piece's load on stamina. */
  breathe: 0.7,
  /** What naming the objectives moves the part the reading stands on, of what's left. */
  objectiveGain: 0.3,
  /** What running it with a partner moves their preparation, of what's left. */
  partnerGain: 0.4,
  /** A segment this far under the piece's mean, or short of its rehearsal, is a problem worth naming. */
  segmentGap: 2,
  /** A problem's figure risen this far is evidence the adjustment worked. */
  evidence: 0.5,
  /** A way whose figure moved less than this either way moved nothing (from 2026-10-16): it isn't offered at that problem again. */
  unmoved: 0.05,
  /** What a limit must cost the piece, in points of the whole, to be a problem worth naming (`problemsOf`), and still there (`stillThere`). */
  named: 0.5,
  /** The most problems offered at once, and the tries kept. */
  offered: 8, triesKept: 24,
} as const;
