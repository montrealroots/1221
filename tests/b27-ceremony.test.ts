/**
 * Brief 27, K7 (2026-10-25): the ceremony, loop 46: "Nomination or invitation → attendance decision → schedule and
 * preparation → ceremony occurs on the appropriate date → category is announced → player wins or loses → acceptance
 * interaction if the player wins → award history updates → justified professional consequences unfold" (`CEREMONY`). Held
 * here: the invitation, asked as a question due a week before the show, on an Emmy nomination as on an Actor Awards one;
 * going booking the trip and the show's call, refused where it would clash; remarks prepared an hour at a time; the night
 * played by the clock, the trip there and home; a win in the room going up to accept, the speech judged from the remarks'
 * preparation and the actor's composure and presence, a Strong one or better making the actor more visible, and the
 * falsifiability twin with the remarks unprepared; the moment let pass; a loss in the room adding nothing to a loss at home;
 * watching from home; and a flight missed, the show without the actor.
 *
 * PLAYER JOURNEYS: the Desk Clerk (tests/fakes/b27-awards.ts) submitted for the 34th Actor Awards through the command and
 * nominated, then each answer through the command and the clock played to the show. Each save is one whose own draws give
 * its case (`b27-aa-3`: winning; `b27-aa-8`: losing, and nominated for an Emmy by its production), found by reading the
 * draws, never forced. TEST SETUP, said where it's done: the fracture that lays the actor up across the flight out, set by
 * hand as the clock's own draw would leave one.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { healthOf } from '@/engine/systems/health';
import { VISIBILITY, visibilityOf } from '@/engine/systems/awards';
import { tripsOf } from '@/engine/systems/worktrip';
import { CEREMONY, CEREMONY_KIND, SPEECH_KIND, ceremonyLines, invitation, rsvpBy, rsvpRefusal } from '@/engine/systems/ceremony';
import { answerStop, stopChoices } from '@/engine/world/clock';
import type { GuildEntry } from '@/engine/systems/actorawards';
import { notices, played, tend } from './fakes/career-world';
import { SHOW, clerk, submitted, toNominations } from './fakes/b27-awards';

type Sim = ReturnType<typeof clerk>['sim'];
const MIN = 60_000;

/** The Desk Clerk nominated at the 34th Actor Awards, in a save whose draws give the case. */
function nominated(seed: string): { sim: Sim; g: GuildEntry } {
  const { sim, c } = clerk(seed);
  const g = submitted(sim, c);
  toNominations(sim);
  expect(g.state).toBe('nominated');
  return { sim, g };
}

/** Played as the top bar plays it, the moment to go up answered with its choice, Go Up And Accept. */
function playedAccepting(sim: Sim, until: number): void {
  const choice = stopChoices(SPEECH_KIND)[0]!;
  while (sim.now < until) {
    tend(sim);
    const wanted = Math.min(until, sim.now + 6 * MS_HOUR);
    let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    for (let n = 0; r.interruptedBy && n < 50; n += 1) { tend(sim); r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, r.interruptedBy.kind === SPEECH_KIND ? choice : 'go').result!; }
  }
}

const going = (sim: Sim, g: GuildEntry) => sim.must({ kind: 'pro.ceremony_rsvp', payload: { entryId: g.id, attend: true } });
const prepared = (sim: Sim, g: GuildEntry, times: number) => { for (let n = 0; n < times; n += 1) sim.must({ kind: 'pro.ceremony_prepare', payload: { entryId: g.id } }); };

describe('the ceremony', () => {
  it('invites a nominee with a question due a week before the show, and going books the trip and the show’s call; one that clashes is refused', () => {
    const { sim, g } = nominated('b27-aa-3');
    const d = Object.values(sim.universe.decisions).find((x) => x.refType === 'pro.ceremony' && x.refId === g.id)!;
    expect([d.title, d.dueAt, d.actions?.map((a) => a.label)]).toEqual(['Will You Go To The 34th Actor Awards?', rsvpBy(g), ['Go To The Ceremony', 'Watch From Home']]);
    expect(rsvpBy(g)).toBe(SHOW - CEREMONY.rsvpDays * MS_DAY);
    expect(notices(sim).some((n) => n.includes('As a nominee you’re invited to the 34th Actor Awards in Los Angeles on Monday, February 28, 2028, at 8:00 PM.'))).toBe(true);
    // A booking on the trip's days refuses it, said with the booking.
    expect(rsvpRefusal(sim, sim.player, g.id, true, { clash: () => ({ label: 'Harbor Line: Shoot Day 1', from: SHOW - MS_DAY }) })).toBe('You’re booked for Harbor Line: Shoot Day 1 on February 27, 2028, and going would take you away from February 26, 2028 to February 29, 2028.');
    going(sim, g);
    expect(g.attend).toEqual(expect.objectContaining({ rsvp: 'attending', prepared: 0 }));
    const trip = tripsOf(sim.player).find((t) => t.purpose?.entryId === g.id)!;
    expect([trip.cityId, trip.stay.payer, trip.legs.at(0)!.departs < SHOW - MS_DAY, trip.legs.at(-1)!.arrives > SHOW]).toEqual(['us-ca-losangeles', 'nobody', true, true]);
    expect(sim.universe.scheduled.some((i) => i.kind === CEREMONY_KIND && i.at === SHOW && i.requiresPlayer && i.status === 'pending')).toBe(true);
    expect(d.resolvedAt).toBeDefined();
    // Remarks, an hour at a time, each going further the less is left.
    const t0 = sim.now;
    prepared(sim, g, 3);
    expect(g.attend!.prepared).toBeCloseTo(1 - (1 - CEREMONY.prepare.gain) ** 3, 2);
    expect(sim.now - t0).toBe(3 * CEREMONY.prepare.minutes * MIN);
  }, 300_000);

  it('PLAYER JOURNEY: played to the show, a win in the room goes up to accept; prepared remarks give a speech that makes the actor more visible; the falsifiability twin unprepared doesn’t', () => {
    const run = (times: number) => {
      const { sim, g } = nominated('b27-aa-3');
      going(sim, g);
      prepared(sim, g, times);
      playedAccepting(sim, SHOW + 5 * MIN);
      expect(notices(sim).some((n) => n.startsWith('You’ve Arrived In Los Angeles | You’ve arrived in Los Angeles for the 34th Actor Awards'))).toBe(true);
      expect([g.state, g.attend!.outcome, g.attend!.accepted]).toEqual(['won', 'there', 'speech']);
      expect(() => sim.must({ kind: 'pro.ceremony_accept', payload: { entryId: g.id } })).toThrow('It’s accepted, and your speech is given.');
      expect(notices(sim).some((n) => n.startsWith('You Won At The 34th Actor Awards | '))).toBe(true);
      const lift = visibilityOf(sim.player, sim.now) - visibilityOf(sim.player, SHOW - MIN);
      played(sim, SHOW + 3 * MS_DAY);
      return { sim, g, band: g.attend!.speech!.band, lift };
    };
    const ready = run(3);
    expect(['strong', 'exceptional']).toContain(ready.band);
    expect(ready.lift).toBeCloseTo(VISIBILITY.won + VISIBILITY.speech, 2);
    expect(ceremonyLines(ready.sim.player, ready.g).at(-1)).toMatch(/quote|quoted/);
    expect(notices(ready.sim).some((n) => n.startsWith('You’re Home From Los Angeles | You’re back in New Haven after the 34th Actor Awards'))).toBe(true);
    const cold = run(0);
    expect(['working', 'unready']).toContain(cold.band);
    expect(cold.lift).toBeCloseTo(VISIBILITY.won, 2);
  }, 600_000);

  it('PLAYER JOURNEY: two nominations at one show: one answer, one trip and one evening, both in the room; the falsifiability twin watching from home watches both', () => {
    const second = (sim: Sim, g: GuildEntry): GuildEntry => {
      // TEST SETUP: a second nomination at the same show, written as the committees' nominations write one (a long career
      // reached four at one Creative Arts Emmys, tools/long-career.ts).
      const g2: GuildEntry = { ...structuredClone(g), id: sim.nextId('pro'), category: g.category === 'tv-drama' ? 'tv-comedy' : 'tv-drama' };
      sim.player.pro!.guild!.push(g2);
      return g2;
    };
    const { sim, g } = nominated('b27-aa-8');
    const g2 = second(sim, g);
    going(sim, g);
    expect(g2.attend).toEqual(expect.objectContaining({ rsvp: 'attending', tripId: g.attend!.tripId }));
    expect(tripsOf(sim.player).filter((t) => t.purpose && t.status !== 'canceled').length).toBe(1);
    expect(sim.universe.scheduled.filter((i) => i.kind === CEREMONY_KIND && i.status === 'pending').length).toBe(1);
    // A third announced after the answer is given the same answer, and no question.
    const g3 = second(sim, g);
    expect(invitation(sim, sim.player, g3)).toBe('You’re going to the 34th Actor Awards already, so you’ll be in the room for this one too.');
    expect([g3.attend!.rsvp, g3.attend!.tripId]).toEqual(['attending', g.attend!.tripId]);
    expect(Object.values(sim.universe.decisions).some((d) => d.refType === 'pro.ceremony' && d.refId === g3.id)).toBe(false);
    // Remarks for the evening, for whichever award brings the actor up.
    prepared(sim, g, 1);
    expect(g2.attend!.prepared).toBe(g.attend!.prepared);
    played(sim, SHOW + MS_HOUR);
    expect([g.attend!.outcome, g2.attend!.outcome, g3.attend!.outcome]).toEqual(['there', 'there', 'there']);
    expect(notices(sim).filter((n) => n.startsWith('The 34th Actor Awards | You were in the room for')).length).toBe([g, g2, g3].filter((x) => x.state !== 'won').length);
    // The twin: watching from home for one is watching from home for both.
    const twin = nominated('b27-aa-8');
    const t2 = second(twin.sim, twin.g);
    twin.sim.must({ kind: 'pro.ceremony_rsvp', payload: { entryId: t2.id, attend: false } });
    expect([twin.g.attend!.rsvp, t2.attend!.rsvp]).toEqual(['declined', 'declined']);
    expect(twin.sim.universe.scheduled.some((i) => i.kind === CEREMONY_KIND && i.status === 'pending')).toBe(false);
  }, 600_000);

  it('PLAYER JOURNEY: a winner who doesn’t go up within half an hour says thank you and sits down, and no speech is judged', () => {
    const { sim, g } = nominated('b27-aa-3');
    going(sim, g);
    prepared(sim, g, 3);
    played(sim, SHOW + MS_HOUR);
    expect([g.attend!.outcome, g.attend!.accepted, g.attend!.speech]).toEqual(['there', 'unanswered', undefined]);
    expect(ceremonyLines(sim.player, g).at(-1)).toBe('You went up, said thank you, and sat down.');
    expect(() => sim.must({ kind: 'pro.ceremony_accept', payload: { entryId: g.id } })).toThrow('The moment has passed: you said thank you and sat down.');
  }, 300_000);

  it('PLAYER JOURNEY: a loss in the room adds nothing a loss at home doesn’t; watched from home, the show is read on the tab; an Emmy nomination is invited too', () => {
    const run = (attend: boolean) => {
      const { sim, g } = nominated('b27-aa-8');
      sim.must({ kind: 'pro.ceremony_rsvp', payload: { entryId: g.id, attend } });
      played(sim, SHOW + MS_HOUR);
      expect(g.state).toBe('lost');
      return { sim, g, v: visibilityOf(sim.player, sim.now) };
    };
    const there = run(true);
    expect(there.g.attend!.outcome).toBe('there');
    expect(notices(there.sim).some((n) => n.startsWith('The 34th Actor Awards | You were in the room for Outstanding Performance by a Female Actor in a Drama Series. It went to another nominee'))).toBe(true);
    const home = run(false);
    expect([home.g.attend!.rsvp, home.g.attend!.outcome]).toEqual(['declined', undefined]);
    expect(tripsOf(home.sim.player).some((t) => t.purpose)).toBe(false);
    expect(home.v).toBe(there.v);
    expect(notices(home.sim).some((n) => n.startsWith('The Actor Awards Tonight | '))).toBe(true);
    const lines = home.sim.must<{ lines: string[] }>({ kind: 'pro.watch_ceremony', payload: { entryId: home.g.id } }).lines;
    expect(lines.at(-1)).toBe('It goes to another nominee. You didn’t win, and your nomination stands.');
    // Its production entered the Desk Clerk for the Emmys, which nominated it, and invited it to the Creative Arts Emmys.
    const emmy = home.sim.player.pro!.awards!.find((a) => a.state === 'nominated' || a.state === 'won' || a.state === 'lost')!;
    expect(emmy).toBeDefined();
    expect(notices(home.sim).some((n) => n.startsWith('You’re Nominated For An Emmy | ') && n.includes('As a nominee you’re invited to the 79th Creative Arts Emmys in Los Angeles'))).toBe(true);
  }, 600_000);

  it('PLAYER JOURNEY: laid up across the flight out, the trip is off and the show goes on without the actor, the win accepted without them', () => {
    const { sim, g } = nominated('b27-aa-3');
    going(sim, g);
    const trip = tripsOf(sim.player).find((t) => t.purpose?.entryId === g.id)!;
    const out = trip.legs[0]!;
    played(sim, out.departs - 2 * MS_HOUR);
    // TEST SETUP: laid up by a fracture from an hour before the car to the airport for six hours, as the clock's own draw
    // would leave one: well again by the show, so only the trip keeps the actor from it.
    healthOf(sim.player).injury = { kind: 'fracture', at: out.departs - MS_HOUR, until: out.departs + 6 * MS_HOUR, offWorkUntil: out.departs + 6 * MS_HOUR } as never;
    played(sim, SHOW + MS_HOUR);
    expect(trip.status).toBe('canceled');
    expect(notices(sim).some((n) => n.startsWith('You Missed Your Flight To Los Angeles | ') && n.includes('you won’t be at the 34th Actor Awards'))).toBe(true);
    expect([g.state, g.attend!.outcome, g.attend!.speech]).toEqual(['won', 'absent', undefined]);
    expect(notices(sim).some((n) => n.startsWith('You Weren’t At The 34th Actor Awards | ') && n.includes('since the trip never got you there') && n.includes('it was accepted without you'))).toBe(true);
  }, 300_000);
});
