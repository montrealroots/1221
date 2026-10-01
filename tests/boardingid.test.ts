/**
 * The ID an airline asks outside America, and the cards that answer it
 * (`systems/identity.ts`, from 2026-09-30): within Canada a government photo
 * ID, within Mexico a passport, a license or the INE, within Britain a
 * passport or a photo driving license, between Ireland and Britain a passport
 * or an Irish passport card; without it, not boarded.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { documentsOf, type PersonDocument } from '@/engine/systems/documents';
import { boardingIdRefusal, idCardRefusal } from '@/engine/systems/identity';
import { journeysOf } from '@/engine/systems/journey';

const YEAR = 365.25 * MS_DAY;
const at = Date.UTC(2026, 9, 1);
const flight = (fromCity: string, toCity: string) => ({ fromCity, toCity, legs: [{ mode: 'flight' as const }] }) as never;
const doc = (kind: PersonDocument['kind'], issuer: string): PersonDocument => ({ id: `${kind}-${issuer}`, kind, issuer, name: kind, number: 'X1', status: 'valid', issuedAt: at - YEAR, expiresAt: at + 5 * YEAR });
function bare(town: string, seed: string, docs: PersonDocument[] = []): Simulation {
  const sim = quickSave({ startLocationId: town, homeRegionId: town, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.documents = docs;
  return sim;
}

describe('an airline’s ID outside America', () => {
  it('asks a government photo ID within Canada, and takes a provincial photo card', () => {
    const sim = bare('ca-on-toronto', 'bid-ca');
    expect(boardingIdRefusal(sim.player, flight('ca-on-toronto', 'ca-bc-vancouver'), at)).toMatch(/within Canada/);
    sim.player.documents = [doc('idcard', 'ca-on')];
    expect(boardingIdRefusal(sim.player, flight('ca-on-toronto', 'ca-bc-vancouver'), at)).toBeUndefined();
    sim.player.documents = [doc('passport', 'CA')];
    expect(boardingIdRefusal(sim.player, flight('ca-on-toronto', 'ca-bc-vancouver'), at)).toBeUndefined();
  });

  it('takes a license or the INE within Mexico, a photo license within Britain, and only a passport or passport card between Ireland and Britain', () => {
    const mx = bare('mx-cmx-mexicocity', 'bid-mx');
    expect(boardingIdRefusal(mx.player, flight('mx-cmx-mexicocity', 'mx-14-guadalajara'), at)).toMatch(/within Mexico/);
    mx.player.documents = [doc('idcard', 'mx-cmx')];
    expect(boardingIdRefusal(mx.player, flight('mx-cmx-mexicocity', 'mx-14-guadalajara'), at)).toBeUndefined();
    const gb = bare('uk-eng-london', 'bid-gb');
    expect(boardingIdRefusal(gb.player, flight('uk-eng-london', 'uk-sct-edinburgh'), at)).toMatch(/within Britain/);
    gb.player.documents = [doc('license', 'gb')];
    expect(boardingIdRefusal(gb.player, flight('uk-eng-london', 'uk-sct-edinburgh'), at)).toBeUndefined();
    // Between Ireland and Britain a driving license won't do.
    expect(boardingIdRefusal(gb.player, flight('uk-eng-london', 'ie-lei-dublin'), at)).toMatch(/Irish passport card/);
    gb.player.documents = [doc('idcard', 'ie')];
    expect(boardingIdRefusal(gb.player, flight('ie-lei-dublin', 'uk-eng-london'), at)).toBeUndefined();
    // A train needs none.
    expect(boardingIdRefusal(bare('ca-on-toronto', 'bid-rail').player, { fromCity: 'ca-on-toronto', toCity: 'ca-on-toronto', legs: [{ mode: 'rail' }] } as never, at)).toBeUndefined();
  });

  it('refuses a Canadian with no ID at check-in, and the fare is gone', () => {
    const sim = bare('ca-on-toronto', 'bid-journey');
    const p = zonedParts(sim.now + 3 * MS_DAY, sim.zone);
    const day = instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone);
    const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'ca-bc-vancouver', day, slot: 2, nights: 2 } });
    expect(r.ok, r.error).toBe(true);
    const j = journeysOf(sim.player).find((x) => x.id === r.value!.journeyId)!;
    sim.advanceTo(j.arriveAt + MS_DAY);
    expect(j.status).toBe('missed');
    expect(j.why).toMatch(/government photo ID/);
  });
});

describe('the cards', () => {
  it('issues Ontario’s Photo Card for CA$35, the INE free to a Mexican adult, and Ireland’s passport card only on an Irish passport', () => {
    const on = bare('ca-on-toronto', 'card-on');
    const r = on.execute<{ fee: number; expiresAt?: number }>({ kind: 'documents.apply_idcard', payload: {} });
    expect(r.ok, r.error).toBe(true);
    const cur = saveCurrency(on.universe);
    expect(r.value!.fee).toBe(cur === 'CAD' ? 35_00 : exchange(35_00, 'CAD', cur));
    expect(r.value!.expiresAt).toBeUndefined();
    const mx = bare('mx-cmx-mexicocity', 'card-mx');
    expect(mx.execute<{ fee: number }>({ kind: 'documents.apply_idcard', payload: {} }).value!.fee).toBe(0);
    const foreigner = quickSave({ startLocationId: 'mx-cmx-mexicocity', homeRegionId: 'us-ny-newyork' }, 'card-mx-us');
    expect(idCardRefusal(foreigner.player, foreigner.now)).toMatch(/for a citizen/);
    const ie = bare('ie-lei-dublin', 'card-ie');
    expect(idCardRefusal(ie.player, ie.now)).toMatch(/Irish passport book/);
    ie.player.documents = [{ ...doc('passport', 'IE'), expiresAt: ie.now + 2 * YEAR }];
    const card = ie.execute<{ expiresAt?: number }>({ kind: 'documents.apply_idcard', payload: {} });
    expect(card.ok, card.error).toBe(true);
    // Five years, or to the book's expiry.
    expect(card.value!.expiresAt).toBe(ie.now + 2 * YEAR);
    expect(documentsOf(ie.player).some((d) => d.kind === 'idcard' && d.issuer === 'ie')).toBe(true);
  });
});
