/**
 * Brief 26's papers trace (2026-10-24), its section 4: a button pressed twice, a save reloaded while something is on its
 * way, and a thing called off, on the papers a New Haven life can reach. Each is charged once, arrives once, and says so
 * once; a second press is refused with the reason; what's called off leaves nothing on the calendar and can be booked
 * again. Read at each handler (systems/identity.ts, documents.ts, appointments.ts) and held here on a played life.
 *
 * PLAYER JOURNEY: a New Yorker at Yale in New Haven from Monday 24 August 2026 (`createSave` with `newLifeConfig`), as
 * tests/b20-papers-ids.test.ts makes one. TEST SETUP, said where it's done: the body kept fed and rested as the clock
 * moves (`tended`), and a visit owed set by hand so that Book An Appointment has something to book.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { documentsOf } from '@/engine/systems/documents';
import { ID_CARD_KIND } from '@/engine/systems/identity';
import { APPOINTMENT_KIND, appointmentsOf } from '@/engine/systems/appointments';
import { healthOf } from '@/engine/systems/health';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const charged = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.category === 'documents' && t.memo === memo);
const pending = (sim: Simulation, kind: string) => sim.timeline.pending().filter((i) => i.kind === kind && i.payload.personId === sim.player.id);

/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

describe('papers pressed twice, reloaded on the way, and called off', () => {
  it('Connecticut’s card: applied for once, refused the second time, charged once, arrives once across a reload; reported lost, its police report and its replacement each once', () => {
    const sim = life('b26-papers-ct-card');
    const person = sim.player;
    const first = sim.execute({ kind: 'documents.apply_idcard', payload: {} });
    expect(first.ok).toBe(true);
    const card = documentsOf(person).find((d) => d.kind === 'idcard' && d.issuer === 'us-ct')!;
    expect(card.status).toBe('pending');
    const again = sim.execute({ kind: 'documents.apply_idcard', payload: {} });
    expect(again.ok).toBe(false);
    expect((again as { ok: false; error: string }).error).toBe('One is already on its way.');
    expect(charged(sim, card.name)).toHaveLength(1);
    expect(documentsOf(person).filter((d) => d.kind === 'idcard' && d.issuer === 'us-ct')).toHaveLength(1);
    expect(pending(sim, ID_CARD_KIND)).toHaveLength(1);
    // Reloaded halfway to its day: still one on the calendar, and it comes once.
    tended(sim, sim.now + 10 * MS_DAY);
    const back = reload(sim);
    expect(pending(back, ID_CARD_KIND)).toHaveLength(1);
    tended(back, card.readyAt! + MS_HOUR);
    const came = documentsOf(back.player).find((d) => d.id === card.id)!;
    expect(came.status).toBe('valid');
    expect(titled(back, `${card.name} Arrived`)).toHaveLength(1);
    expect(pending(back, ID_CARD_KIND)).toHaveLength(0);
    // Lost, and reported to New Haven's police online, once.
    expect(back.execute({ kind: 'documents.report_lost', payload: { documentId: card.id } }).ok).toBe(true);
    expect(back.execute({ kind: 'documents.report_lost', payload: { documentId: card.id } }).ok).toBe(false);
    expect(back.execute({ kind: 'documents.police_report', payload: { documentId: card.id } }).ok).toBe(true);
    const reported = back.execute({ kind: 'documents.police_report', payload: { documentId: card.id } });
    expect(reported.ok).toBe(false);
    expect((reported as { ok: false; error: string }).error).toBe('You’ve already filed a police report for it.');
    // Replaced once: the lost card canceled, a new one on its way, the fee charged once, and a second press refused.
    const replaced = back.execute({ kind: 'documents.replace_idcard', payload: { documentId: card.id } });
    expect(replaced.ok).toBe(true);
    expect(documentsOf(back.player).find((d) => d.id === card.id)!.status).toBe('cancelled');
    const twice = back.execute({ kind: 'documents.replace_idcard', payload: { documentId: card.id } });
    expect(twice.ok).toBe(false);
    expect((twice as { ok: false; error: string }).error).toBe('It isn’t lost. Report it lost first.');
    expect(charged(back, `${card.name}, replaced`)).toHaveLength(1);
    expect(documentsOf(back.player).filter((d) => d.kind === 'idcard' && d.issuer === 'us-ct' && d.status === 'pending')).toHaveLength(1);
    expect(pending(back, ID_CARD_KIND)).toHaveLength(1);
  });

  it('a passport: applied for once, the second press refused, charged once, issued once across a reload', () => {
    const sim = life('b26-papers-passport');
    const person = sim.player;
    expect(sim.execute({ kind: 'documents.apply_passport', payload: {} }).ok).toBe(true);
    const doc = documentsOf(person).find((d) => d.kind === 'passport' && d.status === 'pending')!;
    const again = sim.execute({ kind: 'documents.apply_passport', payload: {} });
    expect(again.ok).toBe(false);
    expect((again as { ok: false; error: string }).error).toBe('You’ve already applied, and it’s being decided.');
    expect(charged(sim, doc.name)).toHaveLength(1);
    tended(sim, sim.now + 5 * MS_DAY);
    const back = reload(sim);
    tended(back, doc.readyAt! + MS_HOUR);
    expect(documentsOf(back.player).find((d) => d.id === doc.id)!.status).toBe('valid');
    expect(titled(back, `${doc.name} Issued`)).toHaveLength(1);
    expect(documentsOf(back.player).filter((d) => d.kind === 'passport' && d.status === 'valid')).toHaveLength(1);
  });

  it('a doctor’s appointment: booked once, a second booking refused, called off once with nothing left on the calendar, and bookable again', () => {
    const sim = life('b26-papers-appointment');
    const person = sim.player;
    expect(sim.execute({ kind: 'health.book', payload: {} }).ok).toBe(false);
    // TEST SETUP: a visit owed, as a missed or called-off appointment leaves one.
    healthOf(person).owedVisit = 'A check-up';
    expect(sim.execute({ kind: 'health.book', payload: {} }).ok).toBe(true);
    expect(appointmentsOf(person)).toHaveLength(1);
    expect(pending(sim, APPOINTMENT_KIND)).toHaveLength(1);
    expect(titled(sim, 'A Doctor’s Appointment')).toHaveLength(1);
    // Booked, the need is no longer owed, which is the first thing the command reads; nothing is booked twice.
    const twice = sim.execute({ kind: 'health.book', payload: {} });
    expect(twice.ok).toBe(false);
    expect((twice as { ok: false; error: string }).error).toBe('There’s nothing to see a doctor about.');
    expect(appointmentsOf(person)).toHaveLength(1);
    expect(pending(sim, APPOINTMENT_KIND)).toHaveLength(1);
    const a = appointmentsOf(person)[0]!;
    expect(sim.execute({ kind: 'health.cancel_appointment', payload: { appointmentId: a.id } }).ok).toBe(true);
    expect(appointmentsOf(person)).toHaveLength(0);
    expect(pending(sim, APPOINTMENT_KIND)).toHaveLength(0);
    const gone = sim.execute({ kind: 'health.cancel_appointment', payload: { appointmentId: a.id } });
    expect(gone.ok).toBe(false);
    expect((gone as { ok: false; error: string }).error).toBe('That appointment isn’t booked any more.');
    // Called off, the need is still owed, and books again; a reload keeps it so.
    const back = reload(sim);
    expect(healthOf(back.player).owedVisit).toBe('A check-up');
    expect(back.execute({ kind: 'health.book', payload: {} }).ok).toBe(true);
    expect(pending(back, APPOINTMENT_KIND)).toHaveLength(1);
    // Booked for the same day with the same words, the unread notice is brought up to now, not said twice (`notify`,
    // core/simulation.ts).
    expect(titled(back, 'A Doctor’s Appointment')).toHaveLength(1);
    expect(titled(back, 'A Doctor’s Appointment')[0]!.at).toBe(back.now);
  });
});
