/**
 * Startup and the saves (from 2026-10-21, the owner's brief 20: J4 and J6's "application startup", and the guide area's
 * own item, "the app opens a new life and an old save without error, the save slots keep what they say, and a save made
 * mid-day loads to the same moment"; `docs/verification/audit-2026-10-21/areas/guide/`).
 *
 * - The opening's stages read the slots and say what a slot from another version will do (`STAGES`, the storage
 *   stage's adapter given here, since a node test has no browser storage to resolve).
 * - A new life is made as `SlateApp`'s `start` makes it (the guide on, the clock paused, the meta refreshed, written to
 *   its slot), and the slot's card says what the save holds: the name, where the life is, the date, the town and what
 *   it's worth, each read again from the life itself.
 * - Continue opens it as `SaveSlots`' `load` does (`openSlot`, then `loadSave`) at the same moment, and the shell draws
 *   it; so does every older save in `tests/fixtures/`, each opened and drawn without an error, and played on a day.
 * - A save made at 2:37 in the afternoon of a class day opens at 2:37 with the same still to come, and played on through
 *   midnight to the next morning it comes out the same to the byte as the life never saved (`alike`, below).
 *
 * FIXTURE: the device's storage, a map in memory behind the real adapter (`LocalSaveAdapter`); the page's address and
 * its listeners, which the shell's help reads as it draws and a node test has none of.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createSave, loadPlacesFor, loadSave, openSlot, refreshMeta } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { SaveUniverse } from '@/engine/domain/model';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, formatDate, formatTime, instantFromZoned } from '@/engine/core/time';
import { PersistenceError, deserialise, serialise, type SaveAdapter, type Slot } from '@/engine/persistence/adapter';
import { LocalSaveAdapter, type SaveStore } from '@/engine/persistence/local';
import { netWorth } from '@/engine/systems/finance';
import { formatMoneyCompact, saveCurrency } from '@/engine/core/money';
import { carryOnTo } from '@/engine/world/clock';
import { STAGES } from '@/ui/startup/StartupSequence';
import { SaveSlots } from '@/ui/saves/SaveSlots';
import { GameShell } from '@/ui/shell/GameShell';
import { GameProvider, useGame, type GameContextValue } from '@/app/game-context';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);

/** FIXTURE: the device's storage, in memory. */
function memory(): SaveStore & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, getItem: async (k) => map.get(k) ?? null, setItem: async (k, v) => { map.set(k, v); }, removeItem: async (k) => { map.delete(k); } };
}

/** A new life as `SlateApp.start` makes one: the guide on unless "I Know SLATE", the clock paused, written to its slot. */
async function started(adapter: LocalSaveAdapter, slot: Slot, extra: Partial<NewSaveConfig> = {}): Promise<Simulation> {
  const config = { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra } as NewSaveConfig;
  const sim = createSave(slot, `b20-guide-startup-${slot}`, { ...config, tutorial: config.tutorial !== false, paused: true });
  await loadPlacesFor(sim.universe);
  refreshMeta(sim);
  await adapter.save(sim.universe);
  return sim;
}

/** Continue on a slot, as `SaveSlots`' `load` opens it and `SlateApp`'s `resume` loads it. */
async function continued(adapter: LocalSaveAdapter, slot: Slot): Promise<Simulation> {
  const opened = await openSlot(adapter, slot);
  if ('error' in opened) throw new Error(opened.error);
  await loadPlacesFor(opened.universe);
  return loadSave(opened.universe);
}

/**
 * A save as JSON, each side. Until 2026-10-22 this left out three empty records an opening through a slot filled in
 * (`migrate`'s step 92 in `engine/index.ts`: `engagement`, `development` and `work`, made for anybody with a craft who had
 * none yet), which the life never saved didn't hold: the guide area's finding, repaired by the coordinator for brief 20's
 * J4. A new life is made with them (`createSave`), so the whole save is compared.
 */
function alike(saved: Simulation, never: Simulation): [string, string] {
  return [serialise(saved.universe), serialise(never.universe)];
}

const words = (html: string) => html.replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
/** The shell over a save, as `SlateApp` holds it once a life is playing. */
const shell = (sim: Simulation) => words(renderToStaticMarkup(createElement(GameProvider, { sim, adapter: { save: async () => undefined } as never, onExit: () => undefined, children: createElement(GameShell) })));

const page = globalThis as Record<string, unknown>;
const was = { window: page.window, document: page.document };
beforeEach(() => {
  const listens = { addEventListener: () => undefined, removeEventListener: () => undefined };
  // FIXTURE: the page's address, history and listeners, which the shell reads as it draws.
  Object.assign(globalThis, {
    window: { ...listens, location: { hash: '' }, history: { replaceState: () => undefined, pushState: () => undefined, back: () => undefined }, setInterval: () => 0, clearInterval: () => undefined, setTimeout: () => 0 },
    document: { ...listens, visibilityState: 'visible', activeElement: null, getElementById: () => null },
  });
});
afterEach(() => {
  for (const key of ['window', 'document'] as const) { if (was[key] === undefined) delete page[key]; else page[key] = was[key]; }
});

describe('the opening', () => {
  it('reads the slots and says what a save from another version will do, without opening it', async () => {
    const store = memory();
    const adapter = new LocalSaveAdapter(store);
    await started(adapter, 1);
    const older = await started(adapter, 2);
    older.universe.meta.schemaVersion = SAVE_SCHEMA_VERSION - 1;
    await adapter.save(older.universe);
    const newer = await started(adapter, 3);
    newer.universe.meta.schemaVersion = SAVE_SCHEMA_VERSION + 1;
    await adapter.save(newer.universe);
    const context: { adapter?: LocalSaveAdapter; slots?: Awaited<ReturnType<LocalSaveAdapter['listSlots']>>; warnings: string[] } = { adapter, warnings: [] };
    for (const stage of STAGES.slice(1)) await stage.run(context as never);
    expect(context.slots!.map((s) => s.occupied)).toEqual([true, true, true]);
    expect(context.warnings).toEqual([
      'Slot 2 was saved by an older version of SLATE. When you open it, SLATE keeps a backup and then updates it.',
      'Slot 3 was saved by a newer version of SLATE, so this version won’t open it. That keeps the save safe.',
    ]);
    expect(await openSlot(adapter, 3)).toEqual({ error: 'Slot 3 was saved by a newer version of SLATE, so this version won’t open it. SLATE hasn’t changed anything in it.' });
  });
});

describe('a new life and its slot', () => {
  it('PLAYER JOURNEY: a new life is made with the guide and the clock paused; its slot’s card says its name, where it is, the date, the town and its worth, as the life has them', async () => {
    const adapter = new LocalSaveAdapter(memory());
    const sim = await started(adapter, 1);
    expect(sim.universe.tutorial).toEqual({ read: [] });
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    const [slot] = await adapter.listSlots();
    const meta = slot!.meta!;
    expect(meta.characterName).toBe(sim.player.displayName);
    expect(meta.careerLabel).toBe('Actress, Yale Drama Year 1');
    expect(meta.worldDateLabel).toBe(formatDate(sim.now, sim.homeZone));
    expect(meta.locationLabel).toBe('New Haven');
    expect(meta.netWorthLabel).toBe(formatMoneyCompact(netWorth(sim, sim.player.id).total, saveCurrency(sim.universe)));
    const card = words(renderToStaticMarkup(createElement(SaveSlots, { adapter, initialSlots: [slot!], onNew: () => undefined, onContinue: () => undefined })));
    for (const said of [meta.characterName, meta.careerLabel, `Date ${meta.worldDateLabel}`, 'Location New Haven', `Net Worth ${meta.netWorthLabel}`, 'Continue']) expect(card, said).toContain(said);
  });

  it('PLAYER JOURNEY: played into the afternoon and saved with Save & Exit, the slot’s card is brought up to date, and Continue opens it at the same moment and draws it', async () => {
    const adapter = new LocalSaveAdapter(memory());
    const sim = await started(adapter, 1, { tutorial: false });
    sim.advanceTo(at(2026, 8, 25, 14, 37));
    // Save & Exit: the provider's `saveNow`, the meta refreshed and the save written.
    refreshMeta(sim);
    await adapter.save(sim.universe);
    const [slot] = await adapter.listSlots();
    expect(slot!.meta!.worldDateLabel).toBe('August 25, 2026');
    const back = await continued(adapter, 1);
    expect(back.now).toBe(sim.now);
    const [opened, kept] = alike(back, sim);
    expect(opened).toBe(kept);
    const drawn = shell(back);
    expect(drawn).toContain(`${formatTime(back.now, back.zone)} · ${formatDate(back.now, back.zone)}`);
    expect(drawn).toContain('Good Afternoon, Ada');
  });

  it('PLAYER JOURNEY: a new guided life draws its shell with the guide strip at its first chapter', async () => {
    const adapter = new LocalSaveAdapter(memory());
    const sim = await started(adapter, 1);
    const drawn = shell(sim);
    expect(drawn).toContain('Guide · 1 Of 20 Your Life, Hour By Hour');
    expect(drawn).toContain('Play');
  });
});

describe('the older saves in tests/fixtures', () => {
  const fixtures = readdirSync('tests/fixtures').filter((f) => f.endsWith('.json.gz')).sort();

  it('are all here: seven, each a save of a played life', () => {
    expect(fixtures).toHaveLength(7);
  });

  for (const name of fixtures) {
    it(`PLAYER JOURNEY: ${name} opens through its slot without an error, at the moment it was saved, draws its shell, and plays on a day`, async () => {
      const universe = deserialise(gunzipSync(readFileSync(`tests/fixtures/${name}`)).toString('utf8')) as SaveUniverse;
      const store = memory();
      const adapter = new LocalSaveAdapter(store);
      universe.meta.slot = 1;
      await adapter.save(universe);
      const savedAt = universe.now;
      const sim = await continued(adapter, 1);
      expect(sim.now).toBe(savedAt);
      expect(sim.ledger.audit()).toEqual([]);
      expect(shell(sim)).toContain(formatDate(sim.now, sim.zone));
      sim.advanceTo(sim.now + MS_DAY);
      expect(sim.now).toBe(savedAt + MS_DAY);
      expect(sim.ledger.audit()).toEqual([]);
    });
  }
});

describe('a save made mid-day', () => {
  it('PLAYER JOURNEY: saved at 2:37 PM in a class day, the class stood at and worked as the clock moved past it, it opens at 2:37 PM with the same still to come, and played on through midnight to the next morning it is the same to the byte as the life never saved', async () => {
    const adapter = new LocalSaveAdapter(memory());
    const sim = await started(adapter, 1, { tutorial: false });
    // To Monday's classes, each stop gone to on the way, and Stand Here at nine; then the clock moved on to 2:37 PM, as
    // Stand Here and an hour's Advance at a time would, the class worked as the clock moves past it.
    let r = sim.advanceTo(at(2026, 8, 31, 8), { stopOnPlayerRequired: true });
    while (r.interruptedBy) r = sim.advanceTo(carryOnTo({ item: r.interruptedBy, wanted: at(2026, 8, 31, 8), sentFrom: r.sentFrom }, 'go')!, { stopOnPlayerRequired: true, resumes: r.sentFrom });
    r = sim.advanceTo(at(2026, 8, 31, 12), { stopOnPlayerRequired: true });
    expect(r.interruptedBy?.label).toBe('Classes');
    const standing = r.interruptedBy!;
    sim.advanceTo(at(2026, 8, 31, 14, 37));
    expect(sim.universe.scheduled.find((i) => i.id === standing.id)?.status).toBe('done');
    refreshMeta(sim);
    await adapter.save(sim.universe);
    const back = await continued(adapter, 1);
    expect(back.now).toBe(at(2026, 8, 31, 14, 37));
    const pending = (s: Simulation) => s.universe.scheduled.filter((i) => i.status === 'pending' && i.at < at(2026, 8, 31, 23)).map((i) => [i.kind, i.at]);
    expect(pending(back)).toEqual(pending(sim));
    // On through the evening and the night's turn of the day to the next morning, as the clock runs with nobody at it.
    for (const s of [sim, back]) s.advanceTo(at(2026, 9, 1, 7));
    const [opened, kept] = alike(back, sim);
    expect(opened).toBe(kept);
    expect(back.now).toBe(at(2026, 9, 1, 7));
  });
});

describe('Save & Exit', () => {
  /**
   * The real provider in a real React root, its adapter given, `onExit` written down: Save & Exit is the provider's
   * `exitToMenu`, which the top bar's button calls. FIXTURE: the element React mounts into, and the page's timers,
   * which the beforeEach's window gives as no-ops (autosave never fires here).
   */
  async function onPage(sim: Simulation, adapter: SaveAdapter) {
    let live: GameContextValue | undefined;
    const exits: number[] = [];
    const Child = () => { live = useGame(); return null; };
    const element = { nodeType: 1, tagName: 'DIV', namespaceURI: 'http://www.w3.org/1999/xhtml', textContent: '', addEventListener: () => undefined, removeEventListener: () => undefined, ownerDocument: { addEventListener: () => undefined, removeEventListener: () => undefined } };
    const page = globalThis as Record<string, unknown>;
    page.IS_REACT_ACT_ENVIRONMENT = true;
    (page.window as Record<string, unknown>).HTMLIFrameElement = class {};
    const root = createRoot(element as never);
    act(() => root.render(createElement(GameProvider, { sim, adapter, onExit: () => { exits.push(sim.now); }, children: createElement(Child) })));
    return { live: () => live!, exits, unmount: () => act(() => root.unmount()) };
  }

  it('PLAYER JOURNEY: Save & Exit writes the save and goes to the slots; where the save can’t be written, it stays in the game and says why, nothing lost', async () => {
    const sim = createSave(1, 'b20-guide-exit', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    sim.advanceTo(at(2026, 8, 25, 14, 37));
    const written: SaveUniverse[] = [];
    const good = { save: async (u: SaveUniverse) => { written.push(u); } } as unknown as SaveAdapter;
    const ok = await onPage(sim, good);
    await act(async () => { ok.live().exitToMenu(); });
    expect(written).toHaveLength(1);
    expect(ok.exits).toEqual([sim.now]);
    ok.unmount();

    const full = { save: async () => { throw new PersistenceError('There isn’t enough storage space on this device to save, so nothing in the slot changed.', true); } } as unknown as SaveAdapter;
    const failing = await onPage(sim, full);
    await act(async () => { failing.live().exitToMenu(); });
    // The game stays open, the save's failure said in its words, and Save Failed: Try Again offered (`SaveIndicator`).
    expect(failing.exits).toEqual([]);
    expect(failing.live().saveError).toBe('There isn’t enough storage space on this device to save, so nothing in the slot changed.');
    failing.unmount();
  });
});
