/**
 * A doctor's visit and a condition's review, measured on 2026-10-12 for
 * `docs/UNBITTEN.md` (triage key papers-doctor-visit-unbitten). These tests
 * reproduce an entry for the ledger. They don't guard a fix: no code changed,
 * because the consequence a skipped visit should have rests on a rule seen
 * only through a search summary (Conn. Gen. Stat. §20-614, ch. 400j, which
 * found no expiry for a medicine that isn't controlled;
 * `research-alterations-refills.json` lists it as not found), and choosing one
 * would be balance, not research. The seed 'g23-owed-4' was taken because its
 * forty weeks draw four visits; the first seed tried drew none.
 *
 * What was measured: a kept visit takes nothing from the body (`careFor` gives
 * 'visit' no toll); in Connecticut it renews nothing a fill reads, since
 * `RX.validYears` holds only British Columbia; and a review moves only
 * `reviewedAt`, which schedules the next review. While a visit is owed, the
 * health week drops every visit it draws and books no review, so one
 * appointment called off and never booked again ends the doctor for good, and
 * nothing in the body or the medicine notices.
 *
 * When any of these fails because a consequence was wired (Connecticut's
 * validity rule in `RX.validYears['us-ct']`, say), the ledger entry is settled:
 * turn the test round to assert the consequence, and move the entry to a
 * settled section in the same change.
 */
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { APPOINTMENT_KIND, appointmentsOf, book } from '@/engine/systems/appointments';
import { HEALTH_WEEK_KIND, careFor, fillMedicine, healthOf, illnessWeek, keptUp, renewPrescriptions, reviewWhat, reviewed, rxValidUntil } from '@/engine/systems/health';
import { describe, expect, it } from 'vitest';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const YEARS_AGO = (sim: Simulation, years: number) => sim.now - years * 365.25 * MS_DAY;
const VISIT = 'A doctor’s visit';
const WEEKS = 40;

/** A student in New Haven with high blood pressure, treated, its review a month overdue. */
function overdue(seed: string): Simulation {
  const sim = life('us-ct-newhaven', seed);
  healthOf(sim.player).chronic = { hypertension: { treated: true, reviewedAt: sim.now - 13 * 30.44 * MS_DAY } };
  return sim;
}

/** Runs so many of the player's health weeks, each one past its own instant; the instants run. */
function healthWeeks(sim: Simulation, n: number): number[] {
  const ran: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const next = sim.universe.scheduled.find((x) => x.kind === HEALTH_WEEK_KIND && x.status === 'pending' && x.payload.personId === sim.player.id);
    if (!next) throw new Error('no health week scheduled');
    ran.push(next.at);
    sim.advanceTo(next.at + 60 * 60_000);
  }
  // And past any appointment still pending, so a booked one is kept or missed.
  for (const a of appointmentsOf(sim.player)) if (a.at > sim.now) sim.advanceTo(a.at + 2 * 60 * 60_000);
  return ran;
}

const visitsLogged = (sim: Simulation) => (healthOf(sim.player).careLog ?? []).filter((c) => c.care === 'visit');

describe('a doctor’s visit, kept or not (measured 2026-10-12, for docs/UNBITTEN.md)', () => {
  it('kept, takes nothing from the body, and in Connecticut renews nothing a fill reads', () => {
    const sim = life('us-ct-newhaven', 'g23-visit-kept');
    const h = healthOf(sim.player);
    h.chronic = { hypertension: { treated: true, prescribedAt: YEARS_AGO(sim, 10), reviewedAt: YEARS_AGO(sim, 2) } };
    const state = h.chronic.hypertension!;
    const body = structuredClone(sim.player.wellbeing);
    careFor(sim, sim.player, { care: 'visit', what: reviewWhat('hypertension') }, sim.now);
    renewPrescriptions(sim.player, sim.now);
    reviewed(sim.player, reviewWhat('hypertension'), sim.now);
    // The body is as it was: a visit has no toll.
    expect(sim.player.wellbeing).toEqual(body);
    // What the visit moved are two dates, and in Connecticut neither is read by a fill.
    expect(state.prescribedAt).toBe(sim.now);
    expect(state.reviewedAt).toBe(sim.now);
    expect(rxValidUntil(sim.player, state)).toBeUndefined();

    // Without it, a ten-year-old prescription is filled in New Haven all the same.
    const unseen = life('us-ct-newhaven', 'g23-visit-unseen');
    const u = healthOf(unseen.player);
    u.chronic = { hypertension: { treated: true, prescribedAt: YEARS_AGO(unseen, 10) } };
    fillMedicine(unseen, unseen.player, unseen.now);
    expect(u.chronic.hypertension!.supplyUntil).toBe(unseen.now + 30 * MS_DAY);
    expect(appointmentsOf(unseen.player).length || u.owedVisit).toBeFalsy();

    // The input that does change the outcome: in British Columbia the same prescription isn't filled until a doctor renews it.
    const bc = life('ca-bc-vancouver', 'g23-visit-bc');
    const b = healthOf(bc.player);
    b.chronic = { hypertension: { treated: true, prescribedAt: YEARS_AGO(bc, 10) } };
    fillMedicine(bc, bc.player, bc.now);
    expect(b.chronic.hypertension!.supplyUntil).toBeUndefined();
    expect(appointmentsOf(bc.player).length || b.owedVisit).toBeTruthy();
  });

  it('called off and never booked again, swallows every later visit and review, and the body and the medicine don’t notice', () => {
    // The control: the same student, nothing owed. The overdue review is booked and kept.
    const control = overdue('g23-owed-4');
    healthWeeks(control, WEEKS);
    const kept = visitsLogged(control);
    expect(kept.some((c) => c.what.startsWith(reviewWhat('hypertension')))).toBe(true);
    expect(kept.some((c) => c.what.startsWith(VISIT))).toBe(true);
    expect(healthOf(control.player).chronic!.hypertension!.reviewedAt).toBeGreaterThan(control.now - WEEKS * 7 * MS_DAY);

    // The case: one appointment booked and called off (Papers' Call It Off), and never booked again.
    const sim = overdue('g23-owed-4');
    const reviewedAt = healthOf(sim.player).chronic!.hypertension!.reviewedAt;
    const a = book(sim, sim.player, VISIT)!;
    expect(a).toBeDefined();
    sim.must({ kind: 'health.cancel_appointment', payload: { appointmentId: a.id } });
    expect(healthOf(sim.player).owedVisit).toBe(VISIT);
    const weeks = healthWeeks(sim, WEEKS);

    // Visits were drawn in those weeks (the draw is keyed on the week, so drawing again shows it), and every one was dropped.
    const drawn = weeks.filter((at) => illnessWeek(sim, sim.player, at).some((e) => e.care === 'visit' && !e.flu));
    expect(drawn.length).toBeGreaterThan(0);
    expect(visitsLogged(sim)).toEqual([]);
    expect(healthOf(sim.player).bills.filter((bill) => bill.what.startsWith(VISIT) || bill.what.startsWith(reviewWhat('hypertension')))).toEqual([]);
    expect(sim.universe.scheduled.some((x) => x.kind === APPOINTMENT_KIND && x.status === 'pending')).toBe(false);
    // The review, a month overdue at the start, is never booked; the owed visit is still the one called off.
    expect(healthOf(sim.player).chronic!.hypertension!.reviewedAt).toBe(reviewedAt);
    expect(healthOf(sim.player).owedVisit).toBe(VISIT);

    // At no cost: at the same instant, the medicine is still filled, and the body is where the control's is.
    const end = Math.max(sim.now, control.now) + MS_DAY;
    sim.advanceTo(end);
    control.advanceTo(end);
    expect(keptUp(healthOf(sim.player).chronic!.hypertension, sim.now)).toBe(true);
    expect(keptUp(healthOf(control.player).chronic!.hypertension, control.now)).toBe(true);
    expect(sim.player.wellbeing).toEqual(control.player.wellbeing);
  });
});
