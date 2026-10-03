/**
 * Photo ID at a hotel's desk (`deskAccepts` in `systems/identity.ts`,
 * `travel.show_id` in `systems/journey.ts`, from 2026-10-02): the eleven
 * hotels whose own pages ask it of every stay give no room without one in
 * force, until one is shown.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { HOTELS } from '@/engine/content/hotels';
import { documentsOf } from '@/engine/systems/documents';
import { deskAccepts } from '@/engine/systems/identity';
import { journeysOf, planBy, showIdRefusal } from '@/engine/systems/journey';

describe('a hotel’s desk', () => {
  it('asks photo ID where its own page says so, eleven of the twenty-eight', () => {
    expect(HOTELS.filter((h) => h.photoId).map((h) => h.id).length).toBe(11);
    expect(HOTELS.find((h) => h.id === 'hollywood-roosevelt')!.photoId).toBe('any');
    expect(HOTELS.filter((h) => h.photoId === 'passport-ine').map((h) => h.cityId)).toEqual(['mx-cmx-mexicocity']);
    expect(HOTELS.find((h) => h.id === 'the-plaza-nyc')!.photoId).toBeNull();
  });

  it('takes a passport anywhere, a license only where any photo ID will do', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'desk-takes');
    const p = sim.player;
    const docs = documentsOf(p);
    const issued = sim.now - 86_400_000;
    docs.push({ id: 'pp', kind: 'passport', issuer: 'US', name: 'Passport', number: 'P1', status: 'lost', issuedAt: issued, expiresAt: issued + 3e11 });
    docs.push({ id: 'dl', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: issued, expiresAt: issued + 3e11 });
    const license = docs.find((d) => d.id === 'dl');
    expect(deskAccepts(p, sim.now, 'any')).toBe(license);
    expect(deskAccepts(p, sim.now, 'passport-ine')).toBeUndefined();
    docs.find((d) => d.id === 'pp')!.status = 'valid';
    expect(deskAccepts(p, sim.now, 'passport-ine')?.id).toBe('pp');
    docs.push({ id: 'nyid', kind: 'idcard', issuer: 'us-ny', name: 'State ID', number: 'S1', status: 'valid', issuedAt: issued, expiresAt: issued + 3e11 });
    docs.find((d) => d.id === 'pp')!.status = 'lost';
    // An American ID card isn't the INE.
    expect(deskAccepts(p, sim.now, 'passport-ine')).toBeUndefined();
    docs.push({ id: 'ine', kind: 'idcard', issuer: 'mx', name: 'INE', number: 'I1', status: 'valid', issuedAt: issued, expiresAt: issued + 3e11 });
    docs.find((d) => d.id === 'pp')!.status = 'lost';
    expect(deskAccepts(p, sim.now, 'passport-ine')?.id).toBe('ine');
  });

  it('gives no room without one, until it’s shown', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'desk-room');
    const p = sim.player;
    const day = sim.now + 10 * 86_400_000;
    let booked: string | undefined;
    for (let slot = 0; slot < 6 && !booked; slot += 1) {
      const legs = planBy(sim, undefined, 'us-ny-newyork', 'us-ca-losangeles', day, slot, 0);
      if (typeof legs === 'string') continue;
      const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot, nights: 2, hotelId: 'hollywood-roosevelt', room: HOTELS.find((x) => x.id === 'hollywood-roosevelt')!.rooms[0]!.name } });
      if (r.ok) booked = r.value!.journeyId;
    }
    expect(booked).toBeDefined();
    const j = journeysOf(p).find((x) => x.id === booked)!;
    // Every photo ID lost an hour into the flight.
    while (j.status !== 'arrived' && j.status !== 'missed' && sim.now < j.arriveAt + 86_400_000) {
      if (sim.now > j.legs[0]!.departAt + 60 * 60_000) for (const d of documentsOf(p)) if (d.kind === 'passport' || d.kind === 'license' || d.kind === 'idcard') d.status = 'lost';
      sim.advanceTo(sim.now + 30 * 60_000);
    }
    expect(j.status, j.why).toBe('arrived');
    expect(j.hotel!.idDue).toBe(true);
    expect(p.stay).toMatchObject({ kind: 'hotel', hotelId: 'hollywood-roosevelt', out: true });
    expect(p.stay!.readyAt).toBeUndefined();
    expect(j.hotel!.deposit).toBeUndefined();
    expect(showIdRefusal(sim, p, j.id)).toBe('You have no government photo ID in force.');
    // A license found again: shown, the room is given at its hour, and the deposit held.
    documentsOf(p).find((d) => d.kind === 'license')!.status = 'valid';
    const shown = sim.execute({ kind: 'travel.show_id', payload: { journeyId: j.id } });
    expect(shown.ok, shown.error).toBe(true);
    expect(j.hotel!.idDue).toBeUndefined();
    expect(p.stay!.out === undefined || p.stay!.readyAt !== undefined).toBe(true);
    expect(showIdRefusal(sim, p, j.id)).toBe('No desk is waiting on your ID.');
  });
});
