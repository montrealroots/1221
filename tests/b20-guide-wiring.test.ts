/**
 * Every control that issues a command, held to the command it issues (from 2026-10-21, the owner's brief 20, D1: "UI
 * controls connected to the wrong action" and "features accessible only through test-injected state"; the guide area's
 * audit, `docs/verification/audit-2026-10-21/areas/guide/`).
 *
 * The list is read from the code by `tools/wiring.mjs`: each call of the game's `run` in `src/ui` and `src/app`, the
 * control it sits under (its label as the JSX draws it), the kind it issues and the payload it sends, and beside them a
 * decision's answers and a stop's own choices, which the engine names. `wiring.json` beside the guide area's report is
 * that list read against each command's handler, line by line, each with its reading (`verdict`, `handler`, `note`).
 *
 * Held here:
 * - the list the code makes now is the list that was read: a control added, moved to another command, given another
 *   payload or relabeled fails until it's read and written into the list (`node tools/wiring.mjs --write`, then its
 *   reading filled in);
 * - every line read says Right: a line found wrong is mended in the code, not kept in the list;
 * - every kind issued is a command the engine registers, a stop's choice is one of the stops' own (`stopCommands`), and
 *   the handler each line names is where that kind is registered;
 * - every key a control sends is one its command's handler takes (its declared payload or what it reads): a control
 *   sending `cardId` to a command that reads `accountId` would fail here;
 * - a control's lock in the guide (`<Gated feature>`) is its own command, or a screen's control the same chapter opens;
 * - every command the engine registers is issued by some control, so none is reached only by a test's hand.
 *
 * Whether each label says what its command does is held by reading (`wiring.json`'s `verdict` and `note`), and, for
 * Home's and the top bar's, by pressing them on the drawn screens (`tests/b20-guide-screens.test.ts`).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { quickSave } from '@/engine';
import { CHAPTER_FOR } from '@/engine/content/tutorial';
import { PLAN_KIND } from '@/engine/world/plans';
import { PARTNER_KIND } from '@/engine/systems/coursework';
import { MEETING_KIND } from '@/engine/systems/proagent';
import { SPEECH_KIND } from '@/engine/systems/ceremony';
import { NOTE_KIND } from '@/engine/systems/offers';
import { stopChoices as engineStops, stopCommands } from '@/engine/world/clock';
import { WIRING, controls, decisionAnswers, handlerReads, sentKeys, stopChoices } from '../tools/wiring.mjs';

interface Line { file: string; label: string; kind: string; payload: string; control?: string; feature?: string; stop?: string; handler?: string; verdict?: string; note?: string }
interface Wiring { controls: Line[]; decisionAnswers: Line[]; stopChoices: Line[] }

const read = JSON.parse(readFileSync(WIRING, 'utf8')) as Wiring;
const now: Wiring = { controls: controls(), decisionAnswers: decisionAnswers(), stopChoices: stopChoices() };
const commands = quickSave({}, 'b20-guide-wiring').commandKinds();
/** The line without its reading: what the code says. */
const bare = ({ verdict: _v, handler: _h, note: _n, ...rest }: Line) => rest;
const DYNAMIC = '{choice.command}';

describe('the wiring list', () => {
  it('is the list the code makes now, line for line: no control added, moved, re-pointed or relabeled since it was read', () => {
    for (const part of ['controls', 'decisionAnswers', 'stopChoices'] as const) {
      expect(read[part].map(bare), part).toEqual(now[part]);
    }
    // 193 controls on 2026-10-21, six decision answers and three stop choices.
    expect(now.controls.length).toBeGreaterThan(150);
  });

  it('has every line read against its handler, and every reading says Right', () => {
    const all = [...read.controls, ...read.decisionAnswers, ...read.stopChoices];
    expect(all.filter((x) => !x.handler || !x.verdict).map((x) => `${x.file} ${x.label}`)).toEqual([]);
    expect(all.filter((x) => x.verdict !== 'Right').map((x) => `${x.file} ${x.label}: ${x.verdict}`)).toEqual([]);
  });

  it('issues only commands the engine registers; a stop’s own choice resolves to the stops’ commands', () => {
    const kinds = [...now.controls, ...now.decisionAnswers, ...now.stopChoices].map((x) => x.kind);
    expect(kinds.filter((k) => k !== DYNAMIC && !commands.includes(k))).toEqual([]);
    // The one kind decided at run time is the stop dialog's choice: the stops' own, each registered.
    expect(now.controls.filter((x) => x.kind === DYNAMIC).map((x) => x.file)).toEqual(['src/ui/shell/TimeControls.tsx']);
    expect(stopCommands().every((k) => commands.includes(k))).toBe(true);
    // From 2026-10-25 (brief 27's K7) a winner's moment to go up at a ceremony has its own choice, Go Up And Accept; and
    // (brief 27's offers and auditions) casting's direction in the room its two, Follow The Direction and Keep Your Choice.
    expect(now.stopChoices.map((s) => [s.label, s.kind])).toEqual([...engineStops(SPEECH_KIND), ...engineStops(NOTE_KIND), ...engineStops(MEETING_KIND), ...engineStops(PLAN_KIND), ...engineStops(PARTNER_KIND)].map((c) => [c.label, c.command]));
    expect(new Set(now.stopChoices.map((s) => s.kind))).toEqual(new Set(stopCommands()));
  });

  it('names, for each line, the line where its command is registered', () => {
    // The engine's constants that hold a kind (`READ_KIND = 'tutorial.read'`), as a registration may name one.
    const named = new Map<string, string>();
    for (const f of readdirSync('src/engine', { recursive: true }).map((p) => join('src/engine', String(p))).filter((p) => p.endsWith('.ts'))) {
      for (const m of readFileSync(f, 'utf8').matchAll(/const ([A-Z][A-Z0-9_]*) = '([a-z0-9_]+\.[a-z0-9_]+)'/g)) named.set(m[1]!, m[2]!);
    }
    for (const x of [...read.controls, ...read.decisionAnswers, ...read.stopChoices]) {
      if (x.kind === DYNAMIC) continue;
      const m = /^([\w./-]+):(\d+)$/.exec(x.handler ?? '');
      expect(m, `${x.kind}: ${x.handler}`).not.toBeNull();
      const line = readFileSync(m![1]!, 'utf8').split('\n')[Number(m![2]) - 1] ?? '';
      const names = [...line.matchAll(/\b([A-Z][A-Z0-9_]+)\b/g)].map((n) => n[1]!);
      expect(line.includes(`'${x.kind}'`) || names.some((n) => named.get(n) === x.kind), `${x.kind} at ${x.handler}: ${line.trim()}`).toBe(true);
    }
  });

  it('sends only keys its command takes: no control sends a key its handler never reads', () => {
    const takes = handlerReads() as Map<string, string[] | null>;
    const wrong: string[] = [];
    const stopPayload = (s: string) => s.replace(/^\(item\) => \(/, '').replace(/\)$/, '');
    for (const x of [...now.controls, ...now.decisionAnswers, ...now.stopChoices.map((s) => ({ ...s, payload: stopPayload(s.payload) }))]) {
      if (x.kind === DYNAMIC) continue;
      const known = takes.get(x.kind);
      const sent = sentKeys(x.payload) as string[] | null;
      expect(known, `${x.kind} has a handler`).not.toBeUndefined();
      if (known === null || sent === null) continue;
      for (const key of sent) if (!known!.includes(key)) wrong.push(`${x.file} “${x.label}” sends ${key} to ${x.kind}, which takes ${known!.join(', ')}`);
    }
    expect(wrong).toEqual([]);
  });

  it('locks each control by its own command, or by a screen’s control the same chapter opens', () => {
    const off = now.controls.filter((x) => x.feature && x.feature !== x.kind && !(x.feature.startsWith('ui.') && CHAPTER_FOR[x.feature] && CHAPTER_FOR[x.feature] === CHAPTER_FOR[x.kind]));
    expect(off.map((x) => `${x.file} “${x.label}”: locked by ${x.feature}, issues ${x.kind}`)).toEqual([]);
  });

  it('issues every command the engine registers from some control: none is reached only by a test’s hand', () => {
    const issued = new Set([...now.controls.map((x) => x.kind), ...stopCommands()]);
    expect(commands.filter((k) => !issued.has(k))).toEqual([]);
  });
});
