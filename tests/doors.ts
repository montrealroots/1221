/**
 * Opening the doors, the way a player has to.
 *
 * The Family Business screen lists the nine things a production company has to
 * be able to do and says which are shut. `company.greenlight` refuses through a
 * shut one, so any test that wants a picture made has to open the greenlight
 * door first — hold material, put somebody in the head of production post, bind
 * the production package, and have money behind it.
 *
 * This does that with the game's own commands rather than by writing the
 * records, so the setup is a path a player could walk and the test fails if
 * that path ever stops working.
 */

import { expect } from 'vitest';
import type { Simulation } from '@/engine';
import { capabilitiesOf } from '@/engine/world/company';

interface Done { ok: boolean; id?: string; error?: string }

const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

/**
 * Opens the greenlight door, and says so if it could not.
 *
 * Everything here is a real command. A silent failure would leave the door shut
 * and every test after it failing on the greenlight instead of on the thing it
 * was written to check, so each step is asserted.
 */
export function openTheDoors(sim: Simulation, title = 'Something To Make'): void {
  // Idempotent: a test that makes two pictures calls this twice, and the post
  // is already filled the second time.
  if (capabilitiesOf(sim).find((one) => one.id === 'greenlight')?.can) return;

  // Somebody to run production. The family is who there is.
  const somebody = Object.values(sim.universe.people).find((one) => !one.isPlayer)
    ?? Object.values(sim.universe.people)[0]!;
  expect(run(sim, 'company.fill_post', { role: 'production', personId: somebody.id }).ok,
    'could not fill the head of production post').toBe(true);

  // Something to make.
  expect(run(sim, 'company.option', { title, hold: 'option', months: 18 }).ok,
    'could not option any material').toBe(true);

  // A payroll, because a crew is on one from the first week of prep.
  expect(run(sim, 'company.register', { registry: 'is_employer' }).ok,
    'could not register as an employer').toBe(true);

  // And cover. Nobody lets a foot of film be shot uninsured, and a location and
  // a hire company each ask for a different one of these.
  // Errors and omissions is not a greenlight blocker — a picture can start
  // without it — but the certificate is on the delivery list and cannot be
  // filed for cover the company never bought, so a test that delivers needs it.
  for (const policy of ['general_liability', 'workers_comp', 'production_package', 'errors_omissions']) {
    expect(run(sim, 'company.insure', { policy }).ok, `could not bind ${policy}`).toBe(true);
  }

  const door = capabilitiesOf(sim).find((one) => one.id === 'greenlight')!;
  expect(door.can, `the greenlight door is still shut: ${door.blockers.map((b) => b.need).join(', ')}`)
    .toBe(true);
}
