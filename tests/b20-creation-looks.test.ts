/**
 * Brief 20, the creation area: the six looks on the player's own figures (an ability, a technique, a trait, a genre,
 * the player and their readiness) are presentation, and their purpose is to say what's true. Each is opened on a life
 * played through its commands and its clock, and what it says is held to the engine's own figure for the same thing,
 * before and after something moves it: a look that stopped reading the figure it names, or read another, fails here.
 *
 * PLAYER JOURNEY: a new life as creation makes it, Ada Cole, born in New York, 170 cm and 66 kg, a Light Sleeper and
 * Frugal, loving drama, at Yale from 7:30 AM Monday 24 August 2026, begun with "I Know SLATE." chosen, on this file's
 * seed, b20-c-looks; a genre studied, an hour of practice and a night's sleep taken through their commands, and the
 * clock run between. TEST SETUP: the first morning's calendar cleared before the hours the test takes.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_HOUR } from '@/engine/core/time';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';
import { ABILITY_DEFS } from '@/engine/content/abilities';
import { SKILLS } from '@/engine/content/school';
import { PERSONALITY_TRAIT_BY_ID, KNOB_READS, type PersonalityKnob } from '@/engine/content/personality-traits';
import { abilityFull, abilityOf } from '@/engine/systems/attributes';
import { personalityOf } from '@/engine/systems/personality';
import { readiness } from '@/engine/systems/life';

const EDT = (year: number, month: number, day: number, hour: number, minute = 0): number => Date.UTC(year, month - 1, day, hour + 4, minute);
const life = () => createSave(1, 'b20-c-looks', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', heightCm: 170, weightKg: 66, personalityTraits: ['light_sleeper', 'frugal'], genres: ['drama'], tutorial: false, paused: true });
/** A look as the player opens it: its name, kind, summary and its body's words. */
function look(sim: Simulation, kind: string, id: string): { name: string; kind: string; summary: string; body: string } {
  const l = resolveLook(sim, at(kind as never, id)) as Looked;
  expect(l && !('gone' in l), `${kind}:${id}`).toBe(true);
  const body = l.body ? renderToStaticMarkup(createElement('div', null, l.body)).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ') : '';
  return { name: l.name, kind: l.kind, summary: l.summary, body };
}
const one = (x: number) => x.toFixed(1);
const clearCalendar = (sim: Simulation) => { for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now); };

describe('the looks on the player’s own figures say the figures', () => {
  it('PLAYER JOURNEY: an ability’s look says its level and its full, and says the new level after an hour of its exercise', () => {
    const sim = life();
    for (const d of ABILITY_DEFS) expect(look(sim, 'ability', d.id).summary, d.id).toContain(`You’re at ${one(abilityOf(sim, sim.player, d.id))} of ${one(abilityFull(sim, sim.player, d.id))}`);
    clearCalendar(sim);
    sim.advanceTo(EDT(2026, 8, 24, 12));
    const before = abilityOf(sim, sim.player, 'focus');
    const r = sim.execute({ kind: 'practice.exercise', payload: { exercise: 'concentration', focus: 'steady' } });
    expect(r.ok, r.error).toBe(true);
    expect(abilityOf(sim, sim.player, 'focus')).toBeGreaterThan(before);
    expect(look(sim, 'ability', 'focus').summary).toContain(`You’re at ${one(abilityOf(sim, sim.player, 'focus'))} of`);
  });

  it('PLAYER JOURNEY: a technique’s look says the level the craft keeps, for all of them', () => {
    const sim = life();
    for (const s of SKILLS) expect(look(sim, 'skill', s.id).summary, s.id).toContain(`You’re at ${sim.player.craft![s.id].toFixed(1)} in it`);
  });

  it('PLAYER JOURNEY: a trait’s look says each figure the trait declares, and all told the figure the engine reads; a trait not held says no all told', () => {
    const sim = life();
    const times = (x: number) => `${x >= 1 ? '+' : '−'}${Math.round(Math.abs(x - 1) * 100)}%`;
    for (const id of sim.player.personalityTraits) {
      const t = PERSONALITY_TRAIT_BY_ID[id]!;
      const l = look(sim, 'trait', id);
      expect(l.kind).toBe('Your Trait');
      for (const [knob, x] of Object.entries(t.systemMods!) as [PersonalityKnob, number][]) {
        expect(l.body, `${id} ${knob}`).toContain(`${KNOB_READS[knob]} ${times(x)} ${times(personalityOf(sim.player, knob))} all told`);
      }
    }
    const notHeld = look(sim, 'trait', 'spender');
    expect(notHeld.kind).toBe('A Trait');
    expect(notHeld.body).not.toContain('all told');
  });

  it('PLAYER JOURNEY: a genre’s look says whether it’s loved and the familiarity the record keeps, before and after it’s studied', () => {
    const sim = life();
    expect(look(sim, 'genre', 'drama').kind).toBe('A Genre You Love');
    expect(look(sim, 'genre', 'western').kind).toBe('A Genre');
    clearCalendar(sim);
    sim.advanceTo(EDT(2026, 8, 24, 12));
    const r = sim.execute<{ familiarity: number }>({ kind: 'genre.study', payload: { genre: 'drama' } });
    expect(r.ok, r.error).toBe(true);
    const kept = sim.player.engagement!.byGenre.drama!;
    expect(kept.familiarity).toBeGreaterThan(0);
    expect(look(sim, 'genre', 'drama').summary).toContain(`Familiarity ${one(kept.familiarity)}, work in it ${one(kept.practice)}`);
  });

  it('PLAYER JOURNEY: the player’s own look says the body as given, in the units of where they live, the traits, the papers and the films loved', () => {
    const sim = life();
    const me = look(sim, 'person', sim.player.id);
    expect(me.name).toBe('Ada Cole');
    // 170 cm is 67 inches, 5 ft 7 in; 66 kg is 146 lb; 66 / 1.7² is 22.8.
    expect(me.body).toContain('5 ft 7 in and 146 lb, with a body mass index of 22.8, in the healthy weight range');
    expect(me.body).toContain('Light Sleeper and Frugal.');
    expect(me.body).toContain('Pronouns she/her. A citizen of the United States.');
    expect(me.body).toContain('Drama.');
  });

  it('PLAYER JOURNEY: readiness’s look says the figure the work reads, and the new figure after a night’s sleep', () => {
    const sim = life();
    const said = () => Number(look(sim, 'readiness', sim.player.id).summary.match(/^(\d+)\./)![1]);
    expect(said()).toBe(Math.round(readiness(sim.player)));
    clearCalendar(sim);
    sim.advanceTo(EDT(2026, 8, 24, 22));
    const tired = readiness(sim.player);
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(true);
    sim.advanceBy(MS_HOUR);
    expect(readiness(sim.player)).not.toBe(tired);
    expect(said()).toBe(Math.round(readiness(sim.player)));
  });
});
