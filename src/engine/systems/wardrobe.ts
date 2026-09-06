/**
 * SLATE — getting dressed.
 *
 * Not a style score. An act: you stand at the wardrobe, you put things on one
 * slot at a time from what you actually own in the condition it is actually
 * in, and a mirror tells you what it thinks before you leave rather than
 * after. The room you are going to has an expectation, the weather has a
 * vote, and the world remembers what you wore, so wearing it again next week
 * is a thing somebody can notice.
 *
 * Nothing here refuses to let you leave. Every note is an opinion.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import { clamp } from '../core/rng';
import { MS_DAY, MS_MINUTE, daysBetween, seasonOf } from '../core/time';
import { formatMoney } from '../core/money';
import { plural } from '../core/text';
import type { Id, OwnedAsset, Outfit, Person, WornRecord } from '../domain/model';
import { CATALOG } from '../content/catalog';
import {
  COLOUR_BY_ID, COVERED_BY_OUTFIT, ESSENTIAL_SLOTS, SLOTS, SLOT_LABEL, codeFor, colourOf, defaultColour,
  guessMaterial, materialOf,
  type DressCode, type Slot,
} from '../content/wardrobe';
import { CITIES } from '../content/geography';

/** Condition lost each time a thing is worn, before the cloth's own hardiness. */
const WEAR_PER_OUTING = 1.4;

/** Cleanliness lost each time a thing is worn. */
const SOIL_PER_OUTING = 12;

/** Below this it is visibly not clean. */
export const NEEDS_WASHING = 55;

/** Below this it is visibly worn out. */
export const LOOKS_TIRED = 45;

/** Days before the same outfit stops looking like a coincidence. */
export const REPEAT_WINDOW_DAYS = 21;

/** Minutes it takes to get dressed properly. */
export const DRESSING_MINUTES = 12;

export function wornRecords(sim: Simulation): Record<Id, WornRecord> {
  return (sim.universe.wornRecords ??= {});
}

// ---------------------------------------------------------------------------
// The wardrobe itself
// ---------------------------------------------------------------------------

/**
 * Fills in what an older save's clothes never had: what they are made of, how
 * clean they are and how often they have been out. Read from the thing itself
 * rather than guessed anew each time, and only ever written once.
 */
export function ensureWardrobe(sim: Simulation): void {
  for (const asset of Object.values(sim.universe.assets)) {
    const w = asset.wardrobe;
    if (!w || asset.soldAt) continue;
    const item = asset.catalogId ? CATALOG.get(asset.catalogId) : undefined;
    if (w.material === undefined) {
      w.material = guessMaterial(asset.name, w.slot, item?.subcategory ?? '');
    }
    // Before colour meant anything, every garment was written out as the
    // literal 'Black'. That is a placeholder, not a choice somebody made, so
    // it is replaced once with a colour the thing would actually come in.
    // Anything already carrying a real colour id is left exactly as it is.
    if (w.colour === undefined || COLOUR_BY_ID[w.colour] === undefined) {
      w.colour = defaultColour(asset.catalogId ?? asset.id, asset.name, w.slot);
    }
    w.cleanliness ??= 100;
    w.timesWorn ??= 0;
  }
}

/** Everything of yours with a wardrobe slot, that you have not sold. */
export function garmentsOf(sim: Simulation, personId: Id): OwnedAsset[] {
  return Object.values(sim.universe.assets)
    .filter((a) => a.ownerId === personId && !a.soldAt && a.wardrobe);
}

/** Whether a thing is in the wardrobe rather than at the cleaner's. */
export function available(sim: Simulation, asset: OwnedAsset): boolean {
  const away = asset.wardrobe?.awayUntil;
  return away === undefined || away <= sim.now;
}

/** Your clothes for one slot, best first. */
export function inSlot(sim: Simulation, personId: Id, slot: Slot): OwnedAsset[] {
  return garmentsOf(sim, personId)
    .filter((a) => a.wardrobe!.slot === slot)
    .sort((a, b) => Number(available(sim, b)) - Number(available(sim, a))
      || (b.wardrobe!.cleanliness ?? 100) - (a.wardrobe!.cleanliness ?? 100)
      || b.condition - a.condition);
}

/** What is on you right now. */
export function wearing(sim: Simulation, personId: Id): OwnedAsset[] {
  const person = sim.universe.people[personId];
  return (person?.wearing ?? [])
    .map((id) => sim.universe.assets[id])
    .filter((a): a is OwnedAsset => Boolean(a) && !a!.soldAt && Boolean(a!.wardrobe));
}

/** The slots an outfit still has nothing in, given what a one-piece covers. */
export function emptySlots(worn: OwnedAsset[]): Slot[] {
  const filled = new Set(worn.map((a) => a.wardrobe!.slot));
  const covered = filled.has('outfit') ? new Set(COVERED_BY_OUTFIT) : new Set<string>();
  return ESSENTIAL_SLOTS.filter((s) => !filled.has(s) && !covered.has(s));
}

// ---------------------------------------------------------------------------
// What the mirror says
// ---------------------------------------------------------------------------

export type NoteKind = 'clash' | 'formality' | 'weather' | 'condition' | 'repeat' | 'gap' | 'good';

export interface Note {
  kind: NoteKind;
  /** Negative is a problem, positive is a compliment. */
  weight: number;
  text: string;
}

export interface Appraisal {
  /** 0-100. What the mirror gives it. */
  verdict: number;
  formality: number;
  warmth: number;
  notes: Note[];
  code: DressCode;
  /** The slots that are still empty. */
  missing: Slot[];
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

/** The formality of what is on, weighted so the big pieces matter most. */
export function formalityOf(worn: OwnedAsset[]): number {
  const weightFor = (slot: string): number => (
    slot === 'outfit' ? 4 : slot === 'top' || slot === 'bottom' ? 3 : slot === 'shoes' ? 2 : 1
  );
  let total = 0;
  let weight = 0;
  for (const a of worn) {
    const w = weightFor(a.wardrobe!.slot);
    const cloth = materialOf(a.wardrobe!.material).formality;
    total += ((a.wardrobe!.formality * 2) + cloth) / 3 * w;
    weight += w;
  }
  return weight === 0 ? 0 : Math.round(total / weight);
}

/** How warm the whole thing is, 0 to 100. */
export function warmthOf(worn: OwnedAsset[]): number {
  const outer = worn.find((a) => a.wardrobe!.slot === 'outerwear');
  const body = worn.filter((a) => ['top', 'bottom', 'outfit'].includes(a.wardrobe!.slot));
  const base = mean(body.map((a) => materialOf(a.wardrobe!.material).warmth));
  return Math.round(clamp(base + (outer ? materialOf(outer.wardrobe!.material).warmth * 0.5 : 0), 0, 100));
}

/** The colour notes: the ones people actually remark on. */
function colourNotes(worn: OwnedAsset[]): Note[] {
  const notes: Note[] = [];
  const at = (slot: string) => worn.find((a) => a.wardrobe!.slot === slot);
  const colour = (a: OwnedAsset | undefined) => (a ? colourOf(a.wardrobe!.colour) : undefined);

  const shoes = colour(at('shoes'));
  const belt = colour(at('belt'));
  const bodyPieces = worn.filter((a) => ['top', 'bottom', 'outfit', 'outerwear'].includes(a.wardrobe!.slot));
  const bodyColours = bodyPieces.map((a) => colourOf(a.wardrobe!.colour));

  // Brown under black is the one everybody sees.
  const wearingBlack = bodyColours.some((c) => c.id === 'black');
  if (wearingBlack && shoes && shoes.family === 'earth') {
    notes.push({ kind: 'clash', weight: -14, text: `${shoes.name} shoes under black. It is a look, and it is not this one.` });
  }
  if (wearingBlack && bodyColours.some((c) => c.id === 'navy')) {
    notes.push({ kind: 'clash', weight: -8, text: 'Navy against black. In this light it reads as an accident rather than a choice.' });
  }
  if (shoes && belt && shoes.id !== belt.id && shoes.family !== belt.family) {
    notes.push({ kind: 'clash', weight: -7, text: `${belt.name} belt with ${shoes.name.toLowerCase()} shoes. Most people match them and most people are right.` });
  }
  if (shoes && belt && shoes.id === belt.id) {
    notes.push({ kind: 'good', weight: 4, text: 'Belt and shoes agree with each other, which is the smallest thing and the one people notice.' });
  }

  // Metals.
  const metals = worn
    .filter((a) => ['watch', 'jewellery'].includes(a.wardrobe!.slot))
    .map((a) => colourOf(a.wardrobe!.colour))
    .filter((c) => c.family === 'metal');
  const warmMetal = metals.some((m) => m.id === 'gold' || m.id === 'rose_gold');
  const coolMetal = metals.some((m) => m.id === 'silver' || m.id === 'steel' || m.id === 'platinum');
  if (warmMetal && coolMetal) {
    notes.push({ kind: 'clash', weight: -6, text: 'Gold and silver on the same wrist. Deliberate on some people; on most, an oversight.' });
  }

  // How loud the whole thing is.
  const loud = bodyColours.filter((c) => c.volume >= 60);
  if (loud.length >= 3) {
    notes.push({ kind: 'clash', weight: -12, text: `${loud.map((c) => c.name).join(', ')} all at once. Somebody is going to ask if you lost a bet.` });
  } else if (loud.length === 1 && bodyColours.length >= 2) {
    notes.push({ kind: 'good', weight: 6, text: `The ${loud[0]!.name.toLowerCase()} does all the talking and everything else lets it.` });
  }

  // All safe, all the time, is its own comment.
  if (bodyColours.length >= 2 && bodyColours.every((c) => c.family === 'neutral')) {
    notes.push({ kind: 'good', weight: 3, text: 'Entirely neutral. Nothing to criticise and nothing to remember.' });
  }
  return notes;
}

/**
 * What the mirror thinks, given where you are going and what it is doing
 * outside. Every note is specific; none of them stops you.
 */
export function appraise(
  sim: Simulation,
  worn: OwnedAsset[],
  options: { occasion?: string; personId?: Id } = {},
): Appraisal {
  const occasion = options.occasion ?? 'casual';
  const code = codeFor(occasion);
  const personId = options.personId ?? sim.player.id;
  const notes: Note[] = [];

  const missing = emptySlots(worn);
  for (const slot of missing) {
    notes.push({ kind: 'gap', weight: -20, text: `Nothing on the ${SLOT_LABEL[slot].toLowerCase()}. That is not a look, that is an oversight.` });
  }

  const formality = formalityOf(worn);
  if (worn.length > 0) {
    if (formality < code.floor - 12) {
      notes.push({ kind: 'formality', weight: -18, text: `This is ${code.name.toLowerCase()} and you are dressed well under it. You will be the one they remember for the wrong reason.` });
    } else if (formality < code.floor) {
      notes.push({ kind: 'formality', weight: -8, text: `A shade under what ${code.name.toLowerCase()} asks for. You would get away with it in a dark room.` });
    } else if (formality > code.ceiling + 10) {
      notes.push({ kind: 'formality', weight: -9, text: `Considerably dressier than the room. Which is a choice, and it will be read as one.` });
    } else {
      notes.push({ kind: 'good', weight: 8, text: `Pitched right for ${code.name.toLowerCase()}.` });
    }
  }

  for (const asset of worn) {
    const material = materialOf(asset.wardrobe!.material);
    if (code.avoidMaterials.includes(material.id)) {
      notes.push({ kind: 'formality', weight: -10, text: `${material.name} at a ${code.name.toLowerCase()} thing. Somebody will mention it.` });
    }
  }

  notes.push(...colourNotes(worn));

  // The weather gets a vote.
  const city = CITIES.get(sim.universe.people[personId]?.currentLocationId ?? '');
  const season = seasonOf(sim.now, city?.timeZone ?? sim.homeZone, city?.latitude ?? 34);
  const warmth = warmthOf(worn);
  const cold = season === 'Winter';
  const hot = season === 'Summer';
  if (cold && warmth < 40) {
    notes.push({ kind: 'weather', weight: -11, text: 'It is winter and none of this is warm. You will feel it before the end of the street.' });
  }
  if (hot && warmth > 72) {
    notes.push({ kind: 'weather', weight: -10, text: 'Far too much cloth for the heat. You will regret the coat within ten minutes.' });
  }
  for (const asset of worn) {
    if (!asset.wardrobe!.season.includes(season)) {
      notes.push({ kind: 'weather', weight: -4, text: `${asset.name} is not a ${season.toLowerCase()} thing, strictly speaking.` });
    }
  }

  // Condition and cleanliness.
  for (const asset of worn) {
    if ((asset.wardrobe!.cleanliness ?? 100) < NEEDS_WASHING) {
      notes.push({ kind: 'condition', weight: -13, text: `${asset.name} needs washing, and at this distance that is visible.` });
    }
    if (asset.condition < LOOKS_TIRED) {
      notes.push({ kind: 'condition', weight: -9, text: `${asset.name} has had a life. Fine at home; less fine out.` });
    }
  }

  // Have you already worn this, recently, in front of the same sort of people.
  const repeat = recentRepeat(sim, personId, worn);
  if (repeat) {
    notes.push({
      kind: 'repeat',
      weight: repeat.photographed ? -15 : -5,
      text: repeat.photographed
        ? `This exact set was photographed ${plural(repeat.days, 'day')} ago. Somebody keeps a file on that sort of thing.`
        : `You wore this ${plural(repeat.days, 'day')} ago. Nobody minds; you might.`,
    });
  }

  const base = 62;
  const verdict = clamp(Math.round(base + notes.reduce((sum, n) => sum + n.weight, 0)), 0, 100);
  return { verdict, formality, warmth, notes, code, missing };
}

/** The last time this same set went out, if it was recently. */
export function recentRepeat(sim: Simulation, personId: Id, worn: OwnedAsset[]): { days: number; photographed: boolean } | undefined {
  if (worn.length === 0) return undefined;
  const key = [...worn.map((a) => a.id)].sort().join('|');
  const found = Object.values(wornRecords(sim))
    .filter((r) => r.personId === personId && [...r.assetIds].sort().join('|') === key)
    .sort((a, b) => b.at - a.at)[0];
  if (!found) return undefined;
  const days = daysBetween(found.at, sim.now, sim.homeZone);
  return days <= REPEAT_WINDOW_DAYS ? { days, photographed: found.photographed } : undefined;
}

/** A short line for a screen: what the mirror thinks, in five words. */
export function verdictLabel(verdict: number): string {
  if (verdict >= 88) return 'Very Good Indeed';
  if (verdict >= 74) return 'Good';
  if (verdict >= 58) return 'Fine';
  if (verdict >= 40) return 'Not Your Best';
  return 'Have Another Look';
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function garment(sim: Simulation, assetId: Id): OwnedAsset {
  const asset = sim.universe.assets[assetId];
  if (!asset || asset.soldAt || asset.ownerId !== sim.player.id) throw new CommandError('You do not own that.');
  if (!asset.wardrobe) throw new CommandError(`${asset.name} is not something you wear.`);
  return asset;
}

function outfitOf(sim: Simulation, outfitId: Id): Outfit {
  const outfit = sim.universe.outfits[outfitId];
  if (!outfit || outfit.personId !== sim.player.id) throw new CommandError('That is not one of your outfits.');
  return outfit;
}

/** Puts one thing on, taking off whatever was in that slot. */
function putOn(sim: Simulation, person: Person, asset: OwnedAsset): Id | undefined {
  const slot = asset.wardrobe!.slot;
  const on = (person.wearing ??= []);
  const displaced = on
    .map((id) => sim.universe.assets[id])
    .find((a) => a?.wardrobe?.slot === slot && a.id !== asset.id);
  if (displaced) person.wearing = on.filter((id) => id !== displaced.id);
  if (!person.wearing.includes(asset.id)) person.wearing.push(asset.id);
  return displaced?.id;
}

export function registerWardrobe(sim: Simulation): void {
  wornRecords(sim);

  /** On it goes. Nothing is committed until you leave; this is the wardrobe. */
  sim.onCommand<{ assetId: Id }, { name: string; slot: string; displaced?: string }>(
    'wear.put_on',
    (p, { sim: s }) => {
      const asset = garment(s, p.assetId);
      if (!available(s, asset)) {
        throw new CommandError(`${asset.name} is ${asset.wardrobe!.awayReason ?? 'not here'} until then.`);
      }
      const displacedId = putOn(s, s.player, asset);
      const displaced = displacedId ? s.universe.assets[displacedId]?.name : undefined;
      return { name: asset.name, slot: asset.wardrobe!.slot, displaced };
    },
  );

  sim.onCommand<{ assetId: Id }, { name: string }>(
    'wear.take_off',
    (p, { sim: s }) => {
      const asset = garment(s, p.assetId);
      const person = s.player;
      person.wearing = (person.wearing ?? []).filter((id) => id !== asset.id);
      return { name: asset.name };
    },
  );

  /** A saved outfit, on in one go. */
  sim.onCommand<{ outfitId: Id }, { name: string; put: number; missing: string[] }>(
    'wear.outfit',
    (p, { sim: s }) => {
      const outfit = outfitOf(s, p.outfitId);
      const person = s.player;
      person.wearing = [];
      const missing: string[] = [];
      let put = 0;
      for (const id of outfit.assetIds) {
        const asset = s.universe.assets[id];
        if (!asset || asset.soldAt || !asset.wardrobe) { missing.push('Something You No Longer Own'); continue; }
        if (!available(s, asset)) { missing.push(asset.name); continue; }
        putOn(s, person, asset);
        put++;
      }
      return { name: outfit.name, put, missing };
    },
  );

  /**
   * Out of the door in it. This is the commit: the clock moves, the clothes
   * wear, and the day is written down so the world can notice a repeat.
   */
  sim.onCommand<
    { occasion?: string; photographed?: boolean },
    { verdict: number; label: string; formality: number; notes: Note[]; recordId: Id }
  >(
    'wear.leave_in_it',
    (p, { sim: s }) => {
      const person = s.player;
      const worn = wearing(s, person.id);
      if (worn.length === 0) throw new CommandError('You are not wearing anything you chose. Put something on first.');
      const occasion = p.occasion ?? 'casual';
      const appraisal = appraise(s, worn, { occasion, personId: person.id });

      // Getting dressed takes the time first; the wear is what the day does to
      // the clothes, so it is recorded against the moment you actually left.
      s.advanceTo(s.now + DRESSING_MINUTES * MS_MINUTE);

      for (const asset of worn) {
        const material = materialOf(asset.wardrobe!.material);
        const wear = WEAR_PER_OUTING * (1 + (100 - material.hardiness) / 100);
        asset.condition = clamp(asset.condition - wear, 0, 100);
        asset.wardrobe!.cleanliness = clamp((asset.wardrobe!.cleanliness ?? 100) - SOIL_PER_OUTING, 0, 100);
        asset.wardrobe!.timesWorn = (asset.wardrobe!.timesWorn ?? 0) + 1;
        asset.wardrobe!.lastWornAt = s.now;
      }

      const record: WornRecord = {
        id: s.nextId('worn'),
        saveId: s.universe.meta.id,
        personId: person.id,
        at: s.now,
        assetIds: worn.map((a) => a.id),
        occasion,
        verdict: appraisal.verdict,
        photographed: Boolean(p.photographed),
      };
      wornRecords(s)[record.id] = record;

      // A saved outfit that matches gets its count.
      const key = [...record.assetIds].sort().join('|');
      const matched = Object.values(s.universe.outfits)
        .find((o) => o.personId === person.id && [...o.assetIds].sort().join('|') === key);
      if (matched) {
        record.outfitId = matched.id;
        matched.timesWorn = (matched.timesWorn ?? 0) + 1;
        matched.lastWornAt = s.now;
      }

      s.emit('wear.dressed', { verdict: appraisal.verdict, occasion, items: worn.length });
      return {
        verdict: appraisal.verdict,
        label: verdictLabel(appraisal.verdict),
        formality: appraisal.formality,
        notes: appraisal.notes,
        recordId: record.id,
      };
    },
  );

  /** The machine at home, or somebody who does it properly. */
  sim.onCommand<{ assetIds?: Id[]; professional?: boolean; accountId?: Id }, { cleaned: number; cost: number; readyAt: number }>(
    'wear.clean',
    (p, { sim: s }) => {
      const person = s.player;
      const chosen = (p.assetIds ?? garmentsOf(s, person.id)
        .filter((a) => (a.wardrobe!.cleanliness ?? 100) < NEEDS_WASHING)
        .map((a) => a.id))
        .map((id) => garment(s, id));
      if (chosen.length === 0) throw new CommandError('Nothing needs cleaning.');

      const needsSpecialist = chosen.filter((a) => materialOf(a.wardrobe!.material).dryCleanOnly);
      const professional = p.professional ?? needsSpecialist.length > 0;
      if (!professional && needsSpecialist.length > 0) {
        throw new CommandError(`${needsSpecialist[0]!.name} cannot go in a machine. It needs the cleaner.`);
      }

      const cost = professional ? chosen.length * 14_00 : 0;
      if (cost > 0) {
        const accountId = p.accountId ?? person.primaryAccountId;
        if (!accountId) throw new CommandError('No account to pay with.');
        if (s.ledger.availableFunds(accountId) < cost) {
          throw new CommandError(`The cleaner wants ${formatMoney(cost)} and you cannot cover it.`);
        }
        s.expense(accountId, cost, 'Dry Cleaning', 'household');
      }

      const readyAt = s.now + (professional ? 2 * MS_DAY : 3 * 60 * MS_MINUTE);
      for (const asset of chosen) {
        asset.wardrobe!.cleanliness = 100;
        if (professional) {
          asset.wardrobe!.awayUntil = readyAt;
          asset.wardrobe!.awayReason = 'at the cleaner';
          person.wearing = (person.wearing ?? []).filter((id) => id !== asset.id);
        }
      }
      if (!professional) s.advanceTo(s.now + 45 * MS_MINUTE);
      s.emit('wear.cleaned', { count: chosen.length, professional, cost });
      return { cleaned: chosen.length, cost, readyAt };
    },
  );

  /** Name what you have on so you can put it on again in one go. */
  sim.onCommand<{ name: string }, { outfitId: Id; styleScore: number; formality: number }>(
    'wear.save_look',
    (p, { sim: s }) => {
      const worn = wearing(s, s.player.id);
      if (worn.length === 0) throw new CommandError('You are not wearing anything to save.');
      const name = p.name.trim();
      if (name.length < 2) throw new CommandError('Give it a name worth typing.');
      return s.must<{ outfitId: Id; styleScore: number; formality: number }>({
        kind: 'shop.save_outfit',
        payload: { name, assetIds: worn.map((a) => a.id) },
      });
    },
  );
}

/** Every slot, with what you own for it and what is on now. Used by the scene. */
export function wardrobeView(sim: Simulation, personId: Id): { slot: Slot; label: string; on?: OwnedAsset; options: OwnedAsset[] }[] {
  const on = new Map(wearing(sim, personId).map((a) => [a.wardrobe!.slot, a]));
  return SLOTS
    .map((slot) => ({ slot, label: SLOT_LABEL[slot], on: on.get(slot), options: inSlot(sim, personId, slot) }))
    .filter((row) => row.options.length > 0 || row.on !== undefined);
}
