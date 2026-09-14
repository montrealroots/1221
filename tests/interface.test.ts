/**
 * The interface is text.
 *
 * No emoji on a tab, a tile, a breadcrumb or a search result, and no glyph
 * standing in for a word: a symbol that is a picture on one platform and a
 * box on another is not a label, and a screen reader has nothing to say
 * about it. The one picture the game keeps is its own mark, the clapper,
 * and only where it is the brand and never inside an accessible name.
 *
 * Two things are outside that rule, both on purpose.
 *
 * The weather keeps its picture, because the weather is the one place where a
 * picture reads faster than a word and where every phone, every forecast and
 * every newspaper uses one. It is always beside the word rather than instead
 * of it, and always hidden from a screen reader, which has the word.
 *
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALL_DESTINATIONS, DESTINATIONS } from '@/ui/shell/destinations';
import { WEATHER_EMOJI } from '@/engine/systems/weather';
import { quickSave } from '@/engine';
import { capabilitiesOf } from '@/engine/world/company';
import { wouldBe } from '@/engine/world/making';

// Anything Unicode says may be drawn as a picture, plus the selectors and
// joiners that make one. A tick or a cross in the Dingbats block that has no
// emoji form is a glyph, not an emoji, and passes.
const EMOJI = /\p{Extended_Pictographic}|\u{FE0F}|\u{200D}|[\u{1F1E6}-\u{1F1FF}]/u;
const BRAND = '🎬';
const BRAND_FILES = new Set([
  'src/app/SlateApp.tsx', 'src/ui/startup/StartupSequence.tsx', 'src/ui/saves/SaveSlots.tsx',
  'src/ui/creation/CharacterCreation.tsx', 'src/ui/shell/GameShell.tsx',
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    // Forward slashes, always. BRAND_FILES is written with them, and `join`
    // hands back backslashes on Windows, which made the brand mark look like a
    // stray emoji in the files allowed to carry it.
    const path = `${dir}/${name}`;
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx|css)$/.test(name)) out.push(path);
  }
  return out;
}

const SOURCES = [...walk('src/ui'), ...walk('src/app'), ...walk('src/engine/systems'), ...walk('src/styles')];

describe('navigation', () => {
  it('names every destination in plain words', () => {
    for (const dest of ALL_DESTINATIONS) {
      expect(dest.label, dest.route).toMatch(/^[A-Z][A-Za-z]*( [A-Z][A-Za-z]*)*$/);
      expect(dest.detail, dest.route).not.toMatch(EMOJI);
      expect('icon' in dest, `${dest.route} carries an icon`).toBe(false);
    }
    for (const group of DESTINATIONS) expect(group.label).toMatch(/^[A-Z][A-Za-z]*( [A-Z][A-Za-z]*)*$/);
  });

  it('labels every tab with words, not pictures', () => {
    const labels: { file: string; label: string }[] = [];
    for (const file of SOURCES) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(/id: '[a-z_-]+', label: '([^']+)'/g)) labels.push({ file, label: match[1]! });
    }
    // A floor so the scan cannot silently match nothing and pass. It used to
    // be twenty. The housing options were the last thing matching the old
    // pattern and they went with the page, taking the scan to zero; it now
    // matches the startup stages, which are written the same way.
    expect(labels.length).toBeGreaterThan(0);
    for (const { file, label } of labels) {
      expect(label, `${file}: ${label}`).not.toMatch(EMOJI);
      expect(label, `${file}: ${label}`).toMatch(/^[A-Za-z0-9?'’&, ]+$/);
      // Title Case: every word capitalised, as the rest of the game is.
      for (const word of label.split(' ')) expect(word, `${file}: "${label}"`).toMatch(/^[A-Z0-9]/);
    }
  });
});

describe('the whole interface', () => {
  it('has no emoji anywhere but the brand mark, and that only where it is the brand', () => {
    const weather = Object.values(WEATHER_EMOJI);
    for (const file of SOURCES) {
      const text = readFileSync(file, 'utf8');
      let stripped = BRAND_FILES.has(file) ? text.split(BRAND).join('') : text;
      // The weather's own pictures are allowed wherever the weather is shown.
      for (const picture of weather) stripped = stripped.split(picture).join('');
      const hit = stripped.match(EMOJI);
      expect(hit, `${file} carries ${hit?.[0] ?? ''}`).toBeNull();
    }
  });

  it('keeps the weather picture beside the word and out of the accessible name', () => {
    const weather = Object.values(WEATHER_EMOJI);
    for (const file of SOURCES) {
      // The table the pictures are declared in is the one place they stand alone.
      if (file.endsWith('weather.ts')) continue;
      const text = readFileSync(file, 'utf8');
      for (const line of text.split('\n')) {
        if (!weather.some((picture) => line.includes(picture))) continue;
        expect(line, `${file}: ${line.trim()}`).toMatch(/aria-hidden="true"/);
      }
    }
  });

  it('keeps the brand mark out of every accessible name', () => {
    for (const file of BRAND_FILES) {
      const text = readFileSync(file, 'utf8');
      for (const line of text.split('\n')) {
        if (!line.includes(BRAND)) continue;
        expect(line, `${file}: ${line.trim()}`).toMatch(/aria-hidden="true"|aria-label="SLATE"/);
      }
    }
  });
});

/**
 * A thing does not need a handle to be looked at.
 *
 * The depth engine's first rule is that the name is the control: you press
 * "Stress", or "Reykjavík", or "Everyday Checking", and it opens. A button
 * labelled Open or Details or More is the opposite of that — it is a handle
 * bolted onto a thing that should have been pressable itself, and two of them
 * shipped on Home before the engine existed.
 *
 * A verb that says where it goes is not a handle. "Open Calendar" names a
 * screen and "Go There" names a route; "Open" names nothing.
 */
describe('affordances', () => {
  const HANDLES = ['Open', 'Show', 'Hide', 'Details', 'More', 'View', 'Expand'];

  it('labels no control with a bare handle', () => {
    const offenders: string[] = [];
    for (const file of SOURCES) {
      if (!file.endsWith('.tsx')) continue;
      const text = readFileSync(file, 'utf8');
      for (const [index, line] of text.split('\n').entries()) {
        // The whole of a button's text, on its own line between the tags.
        const alone = /^\s*(?:\{'\s*)?([A-Za-z]+)\s*(?:'\})?\s*$/.exec(line);
        const word = alone?.[1];
        if (!word || !HANDLES.includes(word)) continue;
        const before = text.split('\n').slice(Math.max(0, index - 4), index).join(' ');
        if (/<button|className="btn|className={`btn/.test(before)) {
          offenders.push(`${file}:${index + 1}  "${word}"`);
        }
      }
    }
    expect(offenders, 'controls whose whole label is a handle rather than a name').toEqual([]);
  });

  it('carries no information in a title attribute, on the screens depth reaches', () => {
    // Rule 13. A tooltip is not depth: it is invisible on a phone, invisible
    // to a keyboard and invisible to a screen reader, and it was how the
    // calendar row on Home used to say what it was.
    //
    // Held over Home and the look declarations, which is as far as the engine
    // has been taken. Thirteen more sit on the calendar, the shell and the
    // creation pickers; they are older than this rule and they move when
    // those screens do, not before. Widening the glob is what promotes them.
    //
    // A tooltip is an attribute on a DOM element. `title` on a component of
    // ours — <Panel title={…}> — is a prop that becomes a heading, and the
    // rule has nothing to say about it: the regex used to fail the moment a
    // panel's heading came from content rather than being typed out.
    const REACHED = /ui\/(screens\/Home|looks\/)/;
    const offenders: string[] = [];
    for (const file of SOURCES) {
      if (!file.endsWith('.tsx') || !REACHED.test(file)) continue;
      for (const [index, line] of readFileSync(file, 'utf8').split('\n').entries()) {
        const at = line.search(/\stitle={/);
        if (at < 0) continue;
        // The tag this attribute is on. Capitalized means a component.
        const tags = [...line.slice(0, at).matchAll(/<([A-Za-z][\w.]*)/g)];
        const tag = tags[tags.length - 1]?.[1];
        if (tag && /^[A-Z]/.test(tag)) continue;
        offenders.push(`${file}:${index + 1}`);
      }
    }
    expect(offenders, 'title attributes carrying what the screen should say').toEqual([]);
  });
});


/**
 * A screen that changes its mind has to be allowed to.
 *
 * `useWorld` memoizes on the world alone. A callback that also closes over
 * the screen's own state — the month the calendar is looking at, the subject
 * a name is about to open — goes on returning the old answer until the clock
 * happens to tick, and never at all while it is paused. The calendar shipped
 * that way: pressing forward moved the heading March, April, May, June with
 * the grid frozen on March underneath it.
 *
 * The fix is a second argument. This is the check that it is passed.
 */
describe('reading the world', () => {
  /** The text of one call's arguments, brackets balanced, strings respected. */
  function argumentsOf(text: string, open: number): string {
    let depth = 0;
    let quote = '';
    for (let i = open; i < text.length; i++) {
      const ch = text[i]!;
      if (quote) {
        if (ch === '\\') i++;
        else if (ch === quote) quote = '';
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') {
        depth--;
        if (depth === 0) return text.slice(open + 1, i);
      }
    }
    return '';
  }

  /** Whether the arguments carry a second one at the top level. */
  function hasSecondArgument(args: string): boolean {
    let depth = 0;
    let quote = '';
    for (let i = 0; i < args.length; i++) {
      const ch = args[i]!;
      if (quote) {
        if (ch === '\\') i++;
        else if (ch === quote) quote = '';
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') depth--;
      else if (ch === ',' && depth === 0) return true;
    }
    return false;
  }

  it('passes what a reader closes over besides the world', () => {
    const offenders: string[] = [];
    for (const file of SOURCES) {
      if (!file.endsWith('.tsx')) continue;
      const text = readFileSync(file, 'utf8');
      // Everything the component holds itself, and every prop it is given.
      const held = new Set<string>();
      for (const m of text.matchAll(/const \[\s*(\w+)\s*,\s*set\w+\s*\]\s*=\s*useState/g)) held.add(m[1]!);
      if (held.size === 0) continue;
      for (const m of text.matchAll(/\buseWorld\s*\(/g)) {
        const open = m.index! + m[0].length - 1;
        const args = argumentsOf(text, open);
        if (hasSecondArgument(args)) continue;
        for (const name of held) {
          if (new RegExp(`\\b${name}\\b`).test(args)) {
            const line = text.slice(0, m.index!).split('\n').length;
            offenders.push(`${file}:${line} reads "${name}" and passes no deps`);
          }
        }
      }
    }
    expect(offenders, 'world readers that will not notice the screen changed its mind').toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('every door a player is stopped at has a way through it', () => {
  const SCREEN = 'src/ui/workspaces/BusinessWorkspace.tsx';

  /**
   * The two kinds of blocker that deliberately have no button, and why.
   *
   * Material has one, but it sits at the top of the panel that holds the
   * rights rather than on the blocker, because taking an option is a thing a
   * company does whether or not a door is shut on it. Money has none because
   * there is no button that makes a company solvent — it is fixed by the
   * business working, which is the whole point of the axis it belongs to.
   */
  const NOT_A_BUTTON: Record<string, string> = {
    holding: 'Take An Option',
    money: 'no control, and correctly so',
  };

  it('offers a control for every blocker the capability doors can raise', () => {
    const screen = readFileSync(SCREEN, 'utf8');
    const sim = quickSave({}, 'doors-reachable');
    const raised = new Set<string>();
    for (const door of capabilitiesOf(sim)) {
      for (const blocker of door.blockers) if (blocker.fixKind) raised.add(blocker.fixKind);
    }
    expect(raised.size, 'a cold save raises no blockers at all').toBeGreaterThan(3);

    for (const kind of raised) {
      if (NOT_A_BUTTON[kind]) continue;
      // The switch in `Missing` is what turns a blocker into something a person
      // can press. A kind with no case there is a door a player can be stopped
      // at and never get past, which is what happened to the head of production
      // for eight commits: every other step of the sequence was reachable and
      // that one was not, so the greenlight door could not be opened by hand.
      expect(screen, `nothing in the interface fixes a '${kind}' blocker`)
        .toContain(`case '${kind}'`);
    }
  });

  it('can walk the whole sequence to a greenlight with the commands the screen runs', () => {
    // The same path the buttons take, in the order the doors present it. If
    // this passes and the screen has no control for one of them, the test
    // above is the one that catches it.
    const sim = quickSave({}, 'doors-walk');
    const ran = (kind: string, payload: Record<string, unknown>): boolean =>
      sim.execute<{ ok: boolean }>({ kind, payload }).value?.ok === true;
    const somebody = Object.values(sim.universe.people).find((one) => !one.isPlayer)!;

    expect(ran('company.fill_post', { role: 'production', personId: somebody.id })).toBe(true);
    expect(ran('company.option', { title: 'Something To Make', hold: 'option', months: 18 })).toBe(true);
    expect(ran('company.register', { registry: 'is_employer' })).toBe(true);
    for (const policy of ['general_liability', 'workers_comp', 'production_package']) {
      expect(ran('company.insure', { policy })).toBe(true);
    }
    const door = capabilitiesOf(sim).find((one) => one.id === 'greenlight')!;
    expect(door.can, `still shut: ${door.blockers.map((b) => b.need).join(', ')}`).toBe(true);
  });
});

describe('the production side is reachable by hand', () => {
  const SCREEN = 'src/ui/workspaces/BusinessWorkspace.tsx';

  it('runs every command a picture needs from a screen, not only from a test', () => {
    const screen = readFileSync(SCREEN, 'utf8');
    // Eight commits of engine work was driven only by the suite. A command with
    // no caller outside a test has never been given an argument nobody thought
    // of, which is how `company.greenlight` came to accept an airdate that laid
    // the whole schedule into weeks that had already happened.
    for (const kind of ['company.fill_post', 'company.develop', 'company.greenlight']) {
      expect(screen, `${kind} is still reachable only from a test`).toContain(`'${kind}'`);
    }
  });

  it('shows the schedule off the same function that lays it', () => {
    // Not a second calculation calibrated near the first. `wouldBe` runs every
    // check and lays every date and commits nothing; `greenlight` is that plus
    // the commit. Two mechanisms would drift, and the first time they did a
    // producer would be shown one set of dates and handed another.
    const screen = readFileSync(SCREEN, 'utf8');
    expect(screen).toContain('wouldBe(');
    expect(screen, 'the form lays its own dates').not.toContain('layOut(');
  });

  it('agrees with itself: what it would be is what it becomes', () => {
    const sim = quickSave({}, 'prospect');
    const somebody = Object.values(sim.universe.people).find((one) => !one.isPlayer)!;
    sim.execute({ kind: 'company.fill_post', payload: { role: 'production', personId: somebody.id } });
    sim.execute({ kind: 'company.option', payload: { title: 'Something To Make' } });
    sim.execute({ kind: 'company.register', payload: { registry: 'is_employer' } });
    for (const policy of ['general_liability', 'workers_comp', 'production_package']) {
      sim.execute({ kind: 'company.insure', payload: { policy } });
    }
    sim.execute({ kind: 'company.develop', payload: { title: 'Hvítserkur', medium: 'film' } });
    const id = Object.values(sim.universe.projects).find((one) => one.title === 'Hvítserkur')!.id;

    const spec = {
      projectId: id, planId: 'feature', budgetCents: 4_000_000_00, shootWeeks: 5,
      secondsEach: 100 * 60, hands: 2,
    };
    const shown = wouldBe(sim, spec);
    expect(shown.ok, 'the form would have shown a refusal').toBe(true);
    if (!shown.ok) return;

    expect(sim.execute<{ ok: boolean }>({ kind: 'company.greenlight', payload: spec }).value?.ok).toBe(true);
    const made = sim.universe.projects[id]!;
    // Every date the form put on screen is a date the picture actually has.
    expect(made.periods?.map((one) => [one.id, one.from, one.to]))
      .toEqual(shown.prospect.periods.map((one) => [one.id, one.from, one.to]));
    expect(made.deliverBy).toBe(shown.prospect.deliverBy);
    expect(made.stageId).toBe(shown.prospect.stageId);
    expect(made.owesSeconds).toBe(shown.prospect.secondsEach * shown.prospect.parts);
  });

  it('refuses in the form exactly as it refuses at the button', () => {
    const sim = quickSave({}, 'prospect-no');
    sim.execute({ kind: 'company.develop', payload: { title: 'No Doors', medium: 'film' } });
    const id = Object.values(sim.universe.projects).find((one) => one.title === 'No Doors')!.id;
    const spec = { projectId: id, planId: 'feature', budgetCents: 4_000_000_00, shootWeeks: 5 };
    const shown = wouldBe(sim, spec);
    const done = sim.execute<{ ok: boolean; error?: string }>({ kind: 'company.greenlight', payload: spec });
    expect(shown.ok).toBe(false);
    expect(done.value?.ok).toBe(false);
    if (shown.ok) return;
    expect(done.value?.error, 'the screen says one thing and the button another').toBe(shown.error);
  });
});
