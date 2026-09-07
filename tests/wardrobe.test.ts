/**
 * Getting dressed.
 *
 * Slot by slot from what you own, in the condition it is in. The mirror is
 * specific and never stops you. The room you are going to has an expectation,
 * the weather has a vote, clothes wear out and get dirty, and the world writes
 * down what you wore so it can notice you wearing it again.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import type { Id, OwnedAsset } from '@/engine/domain/model';
import { CATALOG, shoppableItems } from '@/engine/content/catalog';
import { COLOUR_BY_ID, DRESS_CODE_BY_ID, codeFor, colourOf, defaultColour, guessMaterial, materialOf } from '@/engine/content/wardrobe';
import { createAsset } from '@/engine/systems/commerce';
import {
  LOOKS_TIRED, NEEDS_WASHING, appraise, available, ensureWardrobe, formalityOf, garmentsOf, inSlot,
  recentRepeat, verdictLabel, warmthOf, wardrobeView, wearing,
} from '@/engine/systems/wardrobe';

function aLife(seed = 'dress'): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, 200_000_00, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  return sim;
}

/** Puts a real catalog garment in the wardrobe, in the color named. */
function own(sim: Simulation, catalogId: string, colour: string): OwnedAsset {
  const item = CATALOG.require(catalogId);
  const asset = createAsset(sim, {
    ownerId: sim.player.id, catalogItem: item, purchasePrice: item.basePrice,
    acquiredVia: 'purchase', colour,
  });
  return asset;
}

function put(sim: Simulation, assetId: Id): void {
  const res = sim.execute({ kind: 'wear.put_on', payload: { assetId } });
  expect(res.ok, res.error).toBe(true);
}

beforeAll(async () => { await loadAllSections(); });

describe('the wardrobe', () => {
  it('gives every garment a color, a cloth and a state of cleanliness', () => {
    const sim = aLife();
    const jeans = own(sim, 'c_levis_501', 'indigo');
    expect(jeans.wardrobe?.colour).toBe('indigo');
    expect(jeans.wardrobe?.material).toBe('denim');
    expect(jeans.wardrobe?.cleanliness).toBe(100);
    expect(jeans.wardrobe?.timesWorn).toBe(0);
  });

  it('reads the cloth from what the thing is called', () => {
    expect(guessMaterial('Loro Piana Baby Cashmere Crew Neck', 'top', 'top')).toBe('cashmere');
    expect(guessMaterial("Levi's 501 Original Fit Jeans", 'bottom', 'bottom')).toBe('denim');
    // A Bedale is waxed cotton, not wool: hardy, and it shrugs off rain.
    expect(guessMaterial('Barbour Bedale Wax Jacket', 'outerwear', 'outerwear')).toBe('canvas');
    expect(guessMaterial('The North Face 1996 Retro Nuptse Jacket', 'outerwear', 'outerwear')).toBe('down');
    expect(guessMaterial('Rolex Submariner Date 126610LN', 'watch', 'diver')).toBe('metal');
    // A swimsuit is not a worsted suit, whatever the word inside it says.
    expect(guessMaterial('Eres Les Essentiels Swimsuit', 'outfit', 'sport')).toBe('nylon');
  });

  it('gives a thing a color it would really come in, and the same one every time', () => {
    // Before this, everything was written out as black, which is a placeholder
    // rather than a choice. The color has to be stable across loads or a
    // wardrobe would reshuffle itself under a player who reopened the save.
    const once = defaultColour('c_suitsupply_havana', 'Suitsupply Havana Suit', 'outfit');
    expect(defaultColour('c_suitsupply_havana', 'Suitsupply Havana Suit', 'outfit')).toBe(once);
    expect(COLOUR_BY_ID[once]).toBeDefined();
    // A suit does not come in fuchsia; a belt does not come in mustard.
    expect(['navy', 'charcoal', 'black', 'grey', 'burgundy', 'forest']).toContain(once);
    expect(['black', 'brown', 'chocolate', 'tan']).toContain(defaultColour('c_belt', 'Anderson\'s Woven Belt', 'belt'));
    // And when the name states a color, that is the color, longest match first.
    expect(defaultColour('x', 'Drake\'s Navy Wool Tie', 'top')).toBe('navy');
    expect(defaultColour('x', 'Sunspel Light Gray Sweatshirt', 'top')).toBe('light_grey');
    expect(defaultColour('x', 'Ralph Lauren Royal Blue Oxford', 'top')).toBe('royal_blue');
  });

  it('fills in an older save’s clothes without emptying the wardrobe', () => {
    const sim = aLife();
    const shirt = own(sim, 'c_sunspel_tee', 'white');
    // An older save had none of the new fields.
    delete shirt.wardrobe!.material;
    delete shirt.wardrobe!.cleanliness;
    delete shirt.wardrobe!.timesWorn;
    const before = { name: shirt.name, price: shirt.purchasePrice, condition: shirt.condition };
    ensureWardrobe(sim);
    expect(shirt.wardrobe!.material).toBeTruthy();
    expect(shirt.wardrobe!.cleanliness).toBe(100);
    expect(shirt.wardrobe!.timesWorn).toBe(0);
    // And nothing about the garment itself moved.
    expect(shirt.name).toBe(before.name);
    expect(shirt.purchasePrice).toBe(before.price);
    expect(shirt.condition).toBe(before.condition);
  });

  it('lists what you own by slot, and only what you own', () => {
    const sim = aLife();
    own(sim, 'c_sunspel_tee', 'white');
    own(sim, 'c_levis_501', 'indigo');
    const rows = wardrobeView(sim, sim.player.id);
    const tops = rows.find((r) => r.slot === 'top');
    expect(tops?.options.some((a) => a.name.includes('Sunspel'))).toBe(true);
    expect(inSlot(sim, sim.player.id, 'bottom').length).toBeGreaterThan(0);
    expect(garmentsOf(sim, sim.player.id).every((a) => a.ownerId === sim.player.id)).toBe(true);
  });
});

describe('putting things on', () => {
  it('puts one thing per slot, and takes off whatever was there', () => {
    const sim = aLife();
    const tee = own(sim, 'c_sunspel_tee', 'white');
    const shirt = own(sim, 'c_brooks_ocbd', 'pale_blue');
    put(sim, tee.id);
    expect(wearing(sim, sim.player.id).map((a) => a.id)).toEqual([tee.id]);
    const res = sim.execute<{ displaced?: string }>({ kind: 'wear.put_on', payload: { assetId: shirt.id } });
    expect(res.value!.displaced).toBe(tee.name);
    expect(wearing(sim, sim.player.id).map((a) => a.id)).toEqual([shirt.id]);
  });

  it('takes a thing off again', () => {
    const sim = aLife();
    const shoes = own(sim, 'f_church_consul', 'black');
    put(sim, shoes.id);
    sim.execute({ kind: 'wear.take_off', payload: { assetId: shoes.id } });
    expect(wearing(sim, sim.player.id)).toHaveLength(0);
  });

  it('refuses something you do not own and something that is not clothing', () => {
    const sim = aLife();
    expect(sim.execute({ kind: 'wear.put_on', payload: { assetId: 'nonsense' } }).ok).toBe(false);
    const laptop = own(sim, 'e_mbp16', 'silver');
    const res = sim.execute({ kind: 'wear.put_on', payload: { assetId: laptop.id } });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/not something you wear/);
  });
});

describe('the mirror', () => {
  it('names the brown shoes under the black suit', () => {
    const sim = aLife();
    const suit = own(sim, 'c_tom_ford_oconnor', 'black');
    const shoes = own(sim, 'f_alden_990', 'brown');
    put(sim, suit.id);
    put(sim, shoes.id);
    const appraisal = appraise(sim, wearing(sim, sim.player.id), { occasion: 'formal' });
    const clash = appraisal.notes.find((n) => n.kind === 'clash');
    expect(clash, 'the mirror said nothing about brown under black').toBeDefined();
    expect(clash!.text).toMatch(/[Bb]rown/);
    expect(clash!.weight).toBeLessThan(0);
  });

  it('is happy when the belt and the shoes agree', () => {
    const sim = aLife();
    put(sim, own(sim, 'c_brooks_ocbd', 'white').id);
    put(sim, own(sim, 'c_incotex_chino', 'navy').id);
    put(sim, own(sim, 'f_church_consul', 'black').id);
    put(sim, own(sim, 'a_anderson_belt', 'black').id);
    const notes = appraise(sim, wearing(sim, sim.player.id), { occasion: 'business_casual' }).notes;
    expect(notes.some((n) => n.kind === 'good' && /[Bb]elt/.test(n.text))).toBe(true);
  });

  it('mentions mixed metals', () => {
    const sim = aLife();
    put(sim, own(sim, 'w_rolex_sub_date', 'steel').id);
    put(sim, own(sim, 'j_cartier_love', 'gold').id);
    const notes = appraise(sim, wearing(sim, sim.player.id), { occasion: 'dinner' }).notes;
    expect(notes.some((n) => /[Gg]old and silver/.test(n.text))).toBe(true);
  });

  it('says when you are under the code and when you are over it', () => {
    const sim = aLife();
    const tee = own(sim, 'c_uniqlo_supima', 'grey');
    const jeans = own(sim, 'c_levis_501', 'indigo');
    const trainers = own(sim, 'f_af1', 'white');
    put(sim, tee.id); put(sim, jeans.id); put(sim, trainers.id);
    const under = appraise(sim, wearing(sim, sim.player.id), { occasion: 'premiere' });
    expect(under.notes.some((n) => n.kind === 'formality' && n.weight < 0)).toBe(true);
    expect(under.verdict).toBeLessThan(50);

    const casual = appraise(sim, wearing(sim, sim.player.id), { occasion: 'cinema' });
    expect(casual.notes.some((n) => n.kind === 'good')).toBe(true);
    expect(casual.verdict).toBeGreaterThan(under.verdict);
  });

  it('objects to denim at a black tie thing by name', () => {
    const sim = aLife();
    put(sim, own(sim, 'c_levis_501', 'indigo').id);
    put(sim, own(sim, 'c_sunspel_tee', 'white').id);
    put(sim, own(sim, 'f_common_projects', 'white').id);
    const notes = appraise(sim, wearing(sim, sim.player.id), { occasion: 'gala' }).notes;
    expect(notes.some((n) => /Denim/.test(n.text))).toBe(true);
  });

  it('notices a slot with nothing in it', () => {
    const sim = aLife();
    put(sim, own(sim, 'c_sunspel_tee', 'white').id);
    const appraisal = appraise(sim, wearing(sim, sim.player.id), { occasion: 'casual' });
    expect(appraisal.missing).toContain('bottom');
    expect(appraisal.missing).toContain('shoes');
    expect(appraisal.notes.some((n) => n.kind === 'gap')).toBe(true);
  });

  it('treats a one piece as covering the top and the bottom', () => {
    const sim = aLife();
    put(sim, own(sim, 'c_valentino_gown', 'burgundy').id);
    put(sim, own(sim, 'f_manolo_hangisi', 'black').id);
    const appraisal = appraise(sim, wearing(sim, sim.player.id), { occasion: 'premiere' });
    expect(appraisal.missing).toEqual([]);
  });

  it('scores the formality of the big pieces above the small ones', () => {
    const sim = aLife();
    const gown = own(sim, 'c_valentino_gown', 'black');
    const watch = own(sim, 'w_casio_f91w', 'steel');
    expect(formalityOf([gown, watch])).toBeGreaterThan(70);
  });

  it('knows how warm a thing is from what it is made of', () => {
    const sim = aLife();
    const linen = own(sim, 'c_orlebar_brown', 'pale_blue');
    const parka = own(sim, 'c_canada_goose_expedition', 'black');
    expect(warmthOf([parka])).toBeGreaterThan(warmthOf([linen]));
  });

  it('gives a short label for a screen', () => {
    expect(verdictLabel(95)).toBe('Very Good Indeed');
    expect(verdictLabel(60)).toBe('Fine');
    expect(verdictLabel(20)).toBe('Have Another Look');
  });
});

describe('leaving in it', () => {
  it('wears the clothes, moves the clock and writes the day down', () => {
    const sim = aLife('leaving');
    const shirt = own(sim, 'c_sunspel_tee', 'white');
    const jeans = own(sim, 'c_levis_501', 'indigo');
    const shoes = own(sim, 'f_common_projects', 'white');
    for (const a of [shirt, jeans, shoes]) put(sim, a.id);
    const before = sim.now;
    const res = sim.execute<{ verdict: number; recordId: string }>({ kind: 'wear.leave_in_it', payload: { occasion: 'dinner' } });
    expect(res.ok, res.error).toBe(true);
    expect(sim.now).toBeGreaterThan(before);
    for (const a of [shirt, jeans, shoes]) {
      expect(a.condition).toBeLessThan(100);
      expect(a.wardrobe!.cleanliness).toBeLessThan(100);
      expect(a.wardrobe!.timesWorn).toBe(1);
      expect(a.wardrobe!.lastWornAt).toBe(sim.now);
    }
    const record = sim.universe.wornRecords![res.value!.recordId]!;
    expect(record.assetIds).toHaveLength(3);
    expect(record.occasion).toBe('dinner');
  });

  it('refuses to leave in nothing you chose', () => {
    const sim = aLife();
    const res = sim.execute({ kind: 'wear.leave_in_it', payload: {} });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/not wearing anything/);
  });

  it('notices the same set again inside three weeks, and minds more if there were cameras', () => {
    const sim = aLife('repeat');
    const pieces = [own(sim, 'c_brooks_ocbd', 'white'), own(sim, 'c_incotex_chino', 'navy'), own(sim, 'f_church_consul', 'black')];
    for (const a of pieces) put(sim, a.id);
    sim.execute({ kind: 'wear.leave_in_it', payload: { occasion: 'dinner', photographed: true } });

    sim.advanceTo(sim.now + 5 * MS_DAY);
    for (const a of pieces) put(sim, a.id);
    const again = recentRepeat(sim, sim.player.id, wearing(sim, sim.player.id));
    expect(again, 'the world forgot what you wore last week').toBeDefined();
    expect(again!.days).toBe(5);
    expect(again!.photographed).toBe(true);
    const notes = appraise(sim, wearing(sim, sim.player.id), { occasion: 'dinner' }).notes;
    const repeat = notes.find((n) => n.kind === 'repeat');
    expect(repeat!.weight).toBeLessThanOrEqual(-15);
  });

  it('stops minding after three weeks', () => {
    const sim = aLife('forget');
    const pieces = [own(sim, 'c_sunspel_tee', 'white'), own(sim, 'c_levis_501', 'indigo'), own(sim, 'f_af1', 'white')];
    for (const a of pieces) put(sim, a.id);
    sim.execute({ kind: 'wear.leave_in_it', payload: { occasion: 'casual' } });
    sim.advanceTo(sim.now + 40 * MS_DAY);
    for (const a of pieces) put(sim, a.id);
    expect(recentRepeat(sim, sim.player.id, wearing(sim, sim.player.id))).toBeUndefined();
  });
});

describe('keeping it wearable', () => {
  it('gets dirty with wearing and says so at the mirror', () => {
    const sim = aLife('dirty');
    const shirt = own(sim, 'c_sunspel_tee', 'white');
    put(sim, shirt.id);
    for (let i = 0; i < 4; i++) {
      sim.execute({ kind: 'wear.leave_in_it', payload: { occasion: 'casual' } });
      put(sim, shirt.id);
    }
    expect(shirt.wardrobe!.cleanliness).toBeLessThan(NEEDS_WASHING);
    const notes = appraise(sim, [shirt], { occasion: 'casual' }).notes;
    expect(notes.some((n) => n.kind === 'condition' && /washing/.test(n.text))).toBe(true);
  });

  it('washes what can go in a machine at home, for nothing, when you own one', () => {
    const sim = aLife('wash');
    // A wash at home needs a machine at home. Buy the machine first.
    const washer = shoppableItems().find((i) => /washing machine/i.test(i.name))!;
    createAsset(sim, {
      ownerId: sim.player.id, catalogItem: washer,
      purchasePrice: washer.basePrice, acquiredVia: 'purchase',
    });
    const shirt = own(sim, 'c_uniqlo_supima', 'grey');
    shirt.wardrobe!.cleanliness = 20;
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const res = sim.execute<{ cleaned: number; cost: number }>({ kind: 'wear.clean', payload: { assetIds: [shirt.id] } });
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.cost).toBe(0);
    expect(shirt.wardrobe!.cleanliness).toBe(100);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before);
  });

  it('leaves the wash hanging overnight when there is a washer and no dryer', () => {
    const sim = aLife('airer');
    const washer = shoppableItems().find((i) => /washing machine/i.test(i.name))!;
    createAsset(sim, {
      ownerId: sim.player.id, catalogItem: washer,
      purchasePrice: washer.basePrice, acquiredVia: 'purchase',
    });
    const shirt = own(sim, 'c_uniqlo_supima', 'grey');
    shirt.wardrobe!.cleanliness = 20;
    const res = sim.execute<{ readyAt: number }>({ kind: 'wear.clean', payload: { assetIds: [shirt.id] } });
    expect(res.ok, res.error).toBe(true);
    expect(available(sim, shirt), 'a wet shirt was ready to wear').toBe(false);
    expect(shirt.wardrobe!.awayReason).toBe('drying');
    expect(res.value!.readyAt - sim.now, 'it dried in under six hours on an airer')
      .toBeGreaterThan(6 * 60 * 60 * 1000);
  });

  it('gets the wash back the same afternoon when there is a dryer too', () => {
    const sim = aLife('dryer');
    for (const match of [/washing machine/i, /heat pump dryer/i]) {
      const machine = shoppableItems().find((i) => i.category === 'appliance' && match.test(i.name))!;
      createAsset(sim, {
        ownerId: sim.player.id, catalogItem: machine,
        purchasePrice: machine.basePrice, acquiredVia: 'purchase',
      });
    }
    const shirt = own(sim, 'c_uniqlo_supima', 'grey');
    shirt.wardrobe!.cleanliness = 20;
    const res = sim.execute<{ readyAt: number }>({ kind: 'wear.clean', payload: { assetIds: [shirt.id] } });
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.readyAt - sim.now, 'the dryer took all night')
      .toBeLessThan(6 * 60 * 60 * 1000);
  });

  it('sends the washing out when there is no machine, and charges for it', () => {
    const sim = aLife('launderette');
    const shirt = own(sim, 'c_uniqlo_supima', 'grey');
    shirt.wardrobe!.cleanliness = 20;
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const res = sim.execute<{ cleaned: number; cost: number }>({ kind: 'wear.clean', payload: { assetIds: [shirt.id] } });
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.cost, 'the launderette was free').toBeGreaterThan(0);
    expect(shirt.wardrobe!.cleanliness).toBe(100);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBeLessThan(before);
  });

  it('sends the cloth that cannot go in a machine to the cleaner, and it is away for two days', () => {
    const sim = aLife('cleaner');
    const suit = own(sim, 'c_tom_ford_oconnor', 'charcoal');
    expect(materialOf(suit.wardrobe!.material).dryCleanOnly).toBe(true);
    suit.wardrobe!.cleanliness = 30;
    const machine = sim.execute({ kind: 'wear.clean', payload: { assetIds: [suit.id], professional: false } });
    expect(machine.ok).toBe(false);
    expect(machine.error).toMatch(/needs the cleaner/);

    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const res = sim.execute<{ cost: number; readyAt: number }>({ kind: 'wear.clean', payload: { assetIds: [suit.id] } });
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.cost).toBeGreaterThan(0);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBeLessThan(before);
    expect(suit.wardrobe!.awayUntil).toBe(res.value!.readyAt);
    // And it cannot be worn while it is there.
    const tryOn = sim.execute({ kind: 'wear.put_on', payload: { assetId: suit.id } });
    expect(tryOn.ok).toBe(false);
    expect(tryOn.error).toMatch(/cleaner/);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('wears out faster in a delicate cloth than a hardy one', () => {
    const sim = aLife('wear');
    const cashmere = own(sim, 'c_loro_crew', 'camel');
    const denim = own(sim, 'c_levis_501', 'indigo');
    put(sim, cashmere.id);
    put(sim, denim.id);
    put(sim, own(sim, 'f_common_projects', 'white').id);
    sim.execute({ kind: 'wear.leave_in_it', payload: { occasion: 'casual' } });
    expect(100 - cashmere.condition).toBeGreaterThan(100 - denim.condition);
  });

  it('says a worn out thing is worn out', () => {
    const sim = aLife();
    const coat = own(sim, 'c_barbour_bedale', 'olive');
    coat.condition = LOOKS_TIRED - 10;
    const notes = appraise(sim, [coat], { occasion: 'casual' }).notes;
    expect(notes.some((n) => n.kind === 'condition' && /had a life/.test(n.text))).toBe(true);
  });
});

describe('a saved look', () => {
  it('saves what is on and puts the lot back on in one go', () => {
    const sim = aLife('look');
    const pieces = [own(sim, 'c_brooks_ocbd', 'white'), own(sim, 'c_rota_trouser', 'charcoal'), own(sim, 'f_crockett_jones_audley' in CATALOG.all().reduce((m, i) => ({ ...m, [i.id]: true }), {}) ? 'f_cj_audley' : 'f_church_consul', 'black')];
    for (const a of pieces) put(sim, a.id);
    const saved = sim.execute<{ outfitId: string }>({ kind: 'wear.save_look', payload: { name: 'The Meeting One' } });
    expect(saved.ok, saved.error).toBe(true);

    sim.player.wearing = [];
    const worn = sim.execute<{ put: number; missing: string[] }>({ kind: 'wear.outfit', payload: { outfitId: saved.value!.outfitId } });
    expect(worn.ok, worn.error).toBe(true);
    expect(worn.value!.put).toBe(3);
    expect(worn.value!.missing).toEqual([]);
    expect(wearing(sim, sim.player.id)).toHaveLength(3);
  });

  it('says which piece of a saved look is at the cleaner rather than failing', () => {
    const sim = aLife('look2');
    const suit = own(sim, 'c_tom_ford_oconnor', 'black');
    const shoes = own(sim, 'f_church_consul', 'black');
    put(sim, suit.id); put(sim, shoes.id);
    const saved = sim.execute<{ outfitId: string }>({ kind: 'wear.save_look', payload: { name: 'Black Tie' } });
    suit.wardrobe!.awayUntil = sim.now + 2 * MS_DAY;
    suit.wardrobe!.awayReason = 'at the cleaner';
    sim.player.wearing = [];
    const worn = sim.execute<{ put: number; missing: string[] }>({ kind: 'wear.outfit', payload: { outfitId: saved.value!.outfitId } });
    expect(worn.ok).toBe(true);
    expect(worn.value!.put).toBe(1);
    expect(worn.value!.missing).toContain(suit.name);
  });

  it('counts how often a saved look actually goes out', () => {
    const sim = aLife('count');
    const pieces = [own(sim, 'c_sunspel_tee', 'black'), own(sim, 'c_levis_501', 'indigo'), own(sim, 'f_af1', 'white')];
    for (const a of pieces) put(sim, a.id);
    const saved = sim.execute<{ outfitId: string }>({ kind: 'wear.save_look', payload: { name: 'Saturday' } });
    sim.execute({ kind: 'wear.leave_in_it', payload: { occasion: 'casual' } });
    expect(sim.universe.outfits[saved.value!.outfitId]!.timesWorn).toBe(1);
  });
});

describe('the dress code', () => {
  it('maps an occasion to what the room actually expects', () => {
    expect(codeFor('premiere').id).toBe('red_carpet');
    expect(codeFor('funeral').id).toBe('mourning');
    expect(codeFor('gym').id).toBe('athletic');
    expect(codeFor('something nobody wrote down').id).toBe('casual');
  });

  it('says what it means in one line, before you leave', () => {
    for (const code of Object.values(DRESS_CODE_BY_ID)) {
      expect(code.note.length, code.id).toBeGreaterThan(20);
      expect(code.floor).toBeLessThanOrEqual(code.ceiling);
    }
  });

  it('knows a color by its family', () => {
    expect(colourOf('brown').family).toBe('earth');
    expect(colourOf('navy').family).toBe('cool');
    expect(colourOf('gold').family).toBe('metal');
    expect(colourOf('nonsense').id).toBe('black');
  });
});
