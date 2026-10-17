/**
 * SLATE — the pieces of work in progress the workbook works on (from 2026-10-12; `systems/workbook.ts`).
 *
 * Three kinds, each by its key:
 * - `brief:<id>`, a practice brief: its forecast is the take's, its objective the breakdown, its partner the reader;
 * - `assignment:<id>`, a scene for class while it's open: its forecast the showing's, its objective the table work's
 *   own step where the course has one (Scan The Verse, Speak The Text Aloud), and the scene together beside it, its
 *   partner's figure the preparation it reads (the partner is rehearsed with by asking them, `school.ask_partner`).
 *   Until 2026-10-12 every scene had an objective, which on a scene whose table work is the answers alone moved a
 *   figure the forecast doesn't read; and its partner's figure was your rehearsals together, with Run It With Your
 *   Partner offered for it, which took its minutes and moved nothing;
 * - `part:<which>`, a part in a production while its run is to come: its forecast a night's, as the curtain would find
 *   it now, and the company together beside it.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatTime, zonedParts } from '../core/time';
import { BRIEF_BY_ID } from '../content/briefs';
import { BRIEF, briefMaterial, briefPiece, forecast, recordOf, takeTogether, type BriefRecord } from './briefs';
import { assignmentById, forecastWork, partnerPrepOf, scenePiece, togetherOf } from './coursework';
import { templateById } from '../content/coursework';
import { holderFor, processOf, runPending, type Which } from './production';
import { companyRead, nightEvaluation, nightTogether, playPiece, type NightHolder } from './school';
import type { PartSize } from '../content/plays';
import { materialOf } from './material';
import { inHospital } from './health';
import { occupiedAt } from './life';
import type { WorkPiece } from './workbook';
import type { Workbook } from './piece';
import type { Axis, AxisValue } from '../content/material';

const today = (sim: Simulation): string => {
  const p = zonedParts(sim.now, sim.homeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
};

/** Away from the work: in hospital, asleep or somewhere else already. */
function away(sim: Simulation, person: Person): string | undefined {
  if (inHospital(person, sim.now)) return 'Not from a hospital bed.';
  if (person.awakeSince !== undefined && person.awakeSince > sim.now) return 'You’re asleep.';
  const busy = occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  return undefined;
}

function briefWork(sim: Simulation, person: Person, id: string): WorkPiece | undefined {
  const b = BRIEF_BY_ID[id];
  if (!b) return undefined;
  const rec = (): BriefRecord | undefined => person.briefs?.[id];
  return {
    key: `brief:${id}`, title: b.title,
    book: () => (recordOf(person, id).book ??= { tries: [] }),
    peek: () => rec()?.book,
    material: briefMaterial(b),
    ...(rec()?.callback ? { direction: { [rec()!.callback!.axis]: rec()!.callback!.side } as Partial<Record<Axis, AxisValue>> } : {}),
    ...(rec()?.playing ? { playing: rec()!.playing! } : {}),
    spec: () => briefPiece(b, rec() ?? {}),
    forecast: () => forecast(sim, person, b),
    work: () => [...(rec()?.work ?? [])],
    setWork: (w) => { recordOf(person, id).work = w; },
    objective: { part: 'interpretation', label: 'The Breakdown And Your Reading', get: () => rec()?.prep.interpretation ?? 0, set: (v) => { recordOf(person, id).prep.interpretation = Math.round(v * 1000) / 1000; } },
    // The take with its reader, and a classmate reading with you to run it with.
    together: (e) => { const r = rec(); return r ? takeTogether(sim, person, b, r, e)?.overall : undefined; },
    ...(rec()?.reader && person.school?.classmates[rec()!.reader!.mate] ? { partner: { name: person.school.classmates[rec()!.reader!.mate]!.name, get: () => rec()?.reader?.prep ?? 0, set: (v: number) => { const r = recordOf(person, id).reader; if (r) r.prep = Math.round(v * 1000) / 1000; } } } : {}),
    refusal: () => {
      if (!rec()?.reading) return 'Choose a reading first. Working it through means working on the scene played one way.';
      if ((rec()?.prep.memorization ?? 0) < BRIEF.rehearseNeeds) return 'Learn some of the lines first: there’s nothing to rehearse without them.';
      return away(sim, person);
    },
  };
}

function sceneWork(sim: Simulation, person: Person, id: string): WorkPiece | undefined {
  const a = assignmentById(sim, person, id);
  const material = a ? materialOf(a.sceneId) : undefined;
  if (!a || !material || (a.status !== 'open' && a.status !== 'revising')) return undefined;
  const mate = a.partner !== undefined ? person.school?.classmates[a.partner] : undefined;
  // The table work's own step, where the course has one: the forecast reads it as half the table work (`interpretationOf`).
  const step = templateById(a.template)?.activities.find((x) => x.dim === 'interpretation');
  return {
    key: `assignment:${id}`, title: material.title,
    book: () => (a.book ??= { tries: [] }),
    peek: () => a.book,
    material,
    ...(a.playing ? { playing: a.playing } : {}),
    spec: () => scenePiece(a) ?? { segments: [], work: [], part: 'rehearsal', perTurn: 0, perBlend: 0, most: 1, load: 0 },
    forecast: () => forecastWork(sim, person, a, today(sim)),
    together: (e) => togetherOf(sim, person, a, today(sim), e)?.overall,
    work: () => [...(a.work ?? [])],
    setWork: (w) => { a.work = w; },
    // Named for the step it moves, the half of the table work that isn't the answers (from 2026-10-12).
    ...(step ? { objective: { part: 'interpretation', label: step.label, get: () => a.prep.interpretation, set: (v: number) => { a.prep.interpretation = Math.round(v * 1000) / 1000; } } } : {}),
    // No `set`: their side moves with the rehearsals agreed with them.
    ...(mate ? { partner: { name: mate.name, get: () => partnerPrepOf(person, a, today(sim)) } } : {}),
    refusal: () => (a.prep.memorization < 0.3 ? 'Learn some of the lines first: there’s nothing to rehearse without them.' : away(sim, person)),
  };
}

function partWork(sim: Simulation, person: Person, which: string): WorkPiece | undefined {
  const w = which as Which;
  const holder = holderFor(sim, person, w) as (NightHolder & { size?: PartSize; cast?: { name: string }[] }) | undefined;
  const material = materialOf(holder?.play);
  if (!holder || !runPending(sim, person, w)) return undefined;
  const proc = processOf(holder);
  return {
    key: `part:${which}`, title: material?.title ?? (holder as { production?: string }).production ?? 'The Production',
    book: () => (proc.book ??= { tries: [] } as Workbook),
    peek: () => proc.book,
    ...(material ? { material } : {}),
    ...(proc.direction && Object.keys(proc.direction).length ? { direction: proc.direction } : {}),
    ...(proc.playing ? { playing: proc.playing } : {}),
    // The part's own workload, its size's share of the evening, as its forecast and its night read it (from 2026-10-16,
    // brief 10: until then the spec read no size, and a night's load was the same for every part).
    spec: () => playPiece(holder, holder.size ?? 'lead'),
    // An understudy plays the lead they cover, as the night itself is judged (`reckonNight`): the only holder with no
    // size. Until 2026-10-12 this forecast it as a supporting part, so a Rep understudy's A Night Now and the problems
    // worked on were read at the Rep's supporting difficulty, and the run-through and a night gone on at its lead's.
    forecast: () => nightEvaluation(sim, person, `forecast:${which}`, holder, sim.now, holder.size ?? 'lead', w === 'rep' ? 'rep' : 'school', true),
    ...(companyRead(sim, person, holder) ? { together: (e) => nightTogether(sim, person, holder, e)?.overall } : {}),
    work: () => [...(proc.work ?? [])],
    setWork: (x) => { proc.work = x; },
    refusal: () => (proc.lines < 0.3 ? 'Learn some of the part first: there’s nothing to rehearse without it.' : away(sim, person)),
    // The notes taken are the director's notes themselves, worked through `school.work_note`.
    ignore: ['notes'],
  };
}

/** A piece in progress by its key, or nothing where there isn't one open to work on. */
export function workPiece(sim: Simulation, person: Person, key: string): WorkPiece | undefined {
  const [kind, ...rest] = key.split(':');
  const id = rest.join(':');
  if (kind === 'brief') return briefWork(sim, person, id);
  if (kind === 'assignment') return sceneWork(sim, person, id);
  if (kind === 'part') return partWork(sim, person, id);
  return undefined;
}
