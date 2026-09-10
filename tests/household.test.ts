/**
 * Opening the people in the house.
 *
 * Who Lives Here listed names and every name opened onto nine dials and
 * stopped, which made a mother a stress reading. These are the floors that go
 * under her: what she is to you, where the two of you stand, every rung of the
 * scale that says so, what moves it, and which of the three things on the land
 * she is the one who runs — which opens onto that thing itself.
 *
 * The rule the whole file is written against is that a look only reads. So
 * most of what is tested here is that the words match the world: that a mother
 * is never billed as an actress, that a twin is never called a sibling, and
 * that the arithmetic printed on What Moves It is the arithmetic the engine
 * actually applies.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import type { Id, Person } from '@/engine/domain/model';
import { MS_DAY } from '@/engine/core/time';
import {
  MISSED_COOLS, TOGETHER_WARMS, bondFor, standingSaid, standingWord,
} from '@/engine/world/standing';
import { resolveLook, seedsFor } from '@/ui/looks/registry';
import type { Looked } from '@/ui/looks/registry';
import '@/ui/looks/all';

const family = {
  mother: { firstName: 'Halla', ageAtBirth: 29, role: 'the company' as const },
  father: { firstName: 'Jón', ageAtBirth: 31, role: 'the lot' as const },
  twin: { firstName: 'Katla', gender: 'female' as const, identical: true, role: 'the house' as const },
};

const world = (seed = 'household-look'): Simulation => quickSave({ family }, seed);

const idOf = (sim: Simulation, first: string): Id =>
  Object.values(sim.universe.people).find((one) => one.firstName === first)!.id;

/** A look, or a failure that names what would not open. */
function open(sim: Simulation, kind: string, id: string): Looked {
  const found = resolveLook(sim, { kind, id });
  expect(found, `${kind}:${id} would not open`).toBeDefined();
  expect(found, `${kind}:${id} is gone`).not.toHaveProperty('gone');
  return found as Looked;
}

/** Everything a look says, as one string, for asking what is on the page. */
function wordsIn(look: Looked): string {
  const parts = [look.name, look.kind, look.summary, look.provenance ?? ''];
  for (const way of look.ways ?? []) parts.push(way.label, way.detail);
  return parts.join(' ');
}

describe('a person in the house', () => {
  it('is called what they are to you, not what the business would call them', () => {
    const sim = world();
    for (const [first, word] of [['Halla', 'Mother'], ['Jón', 'Father'], ['Katla', 'Twin Sister']] as const) {
      const look = open(sim, 'person', idOf(sim, first));
      expect(look.kind, `${first} is billed`).toBe(word);
    }
  });

  it('is never billed as a performer anywhere on their own page', () => {
    const sim = world();
    for (const first of ['Halla', 'Jón', 'Katla']) {
      const said = wordsIn(open(sim, 'person', idOf(sim, first)));
      expect(said, `${first} reads as a performer`).not.toMatch(/\bactor|\bactress/i);
    }
  });

  it('still calls you yourself', () => {
    const sim = world();
    expect(open(sim, 'person', sim.universe.playerId).kind).toBe('Yourself');
  });

  it('opens onto what they are, where you stand, and what they run', () => {
    const sim = world();
    const ways = (open(sim, 'person', idOf(sim, 'Halla')).ways ?? []).map((way) => way.to.kind);
    for (const kind of ['relation', 'bond', 'estaterole']) {
      expect(ways, `a person does not open onto ${kind}`).toContain(kind);
    }
  });

  it('opens none of that onto yourself, because you are not your own relation', () => {
    const sim = world();
    const ways = (open(sim, 'person', sim.universe.playerId).ways ?? []).map((way) => way.to.kind);
    for (const kind of ['relation', 'bond', 'estaterole']) {
      expect(ways, `you open onto your own ${kind}`).not.toContain(kind);
    }
  });
});

describe('what they are to you', () => {
  it('says twin, and never says sibling', () => {
    const sim = world();
    const look = open(sim, 'relation', idOf(sim, 'Katla'));
    expect(look.name).toBe('Your Twin Sister');
    expect(look.summary).toMatch(/born the same morning/);
    expect(wordsIn(look).toLowerCase()).not.toContain('sibling who happens');
  });

  it('walks on to everybody else they are related to', () => {
    const sim = world();
    const ways = open(sim, 'relation', idOf(sim, 'Halla')).ways ?? [];
    // Her two children, from her side of it.
    expect(ways.map((way) => way.label).sort()).toEqual(['Alex Rivera', 'Katla Rivera']);
    for (const way of ways) expect(way.to.kind).toBe('person');
  });

  it('opens for nobody the player is not related to', () => {
    const sim = world();
    const stranger = { ...Object.values(sim.universe.people)[0]!, id: 'person_zzz', relations: undefined };
    sim.universe.people['person_zzz'] = stranger as Person;
    expect(resolveLook(sim, { kind: 'relation', id: 'person_zzz' })).toHaveProperty('gone');
  });
});

describe('where you stand', () => {
  it('leads with the sentence the engine uses for that closeness', () => {
    const sim = world();
    const halla = idOf(sim, 'Halla');
    const bond = bondFor(sim.universe, sim.universe.playerId, halla)!;
    const look = open(sim, 'bond', halla);
    expect(look.name).toBe('You And Halla');
    expect(look.summary).toContain(
      standingWord(Math.round(bond.closeness)) === 'Close' ? 'You’re close' : '',
    );
  });

  it('moves when the world moves it, without anybody redrawing anything', () => {
    const sim = world();
    const halla = idOf(sim, 'Halla');
    const before = open(sim, 'bond', halla).summary;
    bondFor(sim.universe, sim.universe.playerId, halla)!.closeness = 15;
    expect(open(sim, 'bond', halla).summary).not.toBe(before);
    expect(open(sim, 'bond', halla).summary).toBe(
      'Something went wrong here, and neither of you has fixed it.',
    );
  });

  it('opens onto the scale, what moves it, and the last day you saw them', () => {
    const sim = world();
    const ways = (open(sim, 'bond', idOf(sim, 'Halla')).ways ?? []).map((way) => way.to.kind);
    expect(ways).toEqual(['scale', 'whatmoves', 'day']);
  });

  it('drops the last day when there has never been one', () => {
    const sim = world();
    const halla = idOf(sim, 'Halla');
    delete bondFor(sim.universe, sim.universe.playerId, halla)!.lastTogetherAt;
    const ways = (open(sim, 'bond', halla).ways ?? []).map((way) => way.to.kind);
    expect(ways).toEqual(['scale', 'whatmoves']);
  });

  it('never prints the number as the thing itself', () => {
    const sim = world();
    // The figure is a Stat, not the sentence. Nobody says a number out loud.
    expect(open(sim, 'bond', idOf(sim, 'Halla')).summary).not.toMatch(/\d/);
  });
});

describe('the scale it sits on', () => {
  it('lays out all seven rungs, warmest first', () => {
    const sim = world();
    const look = open(sim, 'scale', idOf(sim, 'Halla'));
    expect(look.waysAs).toBe('strip');
    expect((look.ways ?? []).map((way) => way.label))
      .toEqual(['Inseparable', 'Close', 'Warm', 'Cordial', 'Distant', 'Cold', 'Estranged']);
  });

  it('says which rung the two of you are on', () => {
    const sim = world();
    const halla = idOf(sim, 'Halla');
    bondFor(sim.universe, sim.universe.playerId, halla)!.closeness = 5;
    expect(open(sim, 'scale', halla).summary).toContain('estranged');
  });

  it('gives a rung the people who are on it right now', () => {
    const sim = world();
    for (const bond of Object.values(sim.universe.bonds)) bond.closeness = 90;
    const look = open(sim, 'band', `${idOf(sim, 'Halla')}/Inseparable`);
    expect((look.ways ?? []).map((way) => way.label).sort())
      .toEqual(['Halla Rivera', 'Jón Rivera', 'Katla Rivera']);
    for (const way of look.ways ?? []) expect(way.to.kind).toBe('bond');
  });

  it('says plainly when a rung has nobody on it', () => {
    const sim = world();
    for (const bond of Object.values(sim.universe.bonds)) bond.closeness = 90;
    const look = open(sim, 'band', `${idOf(sim, 'Halla')}/Estranged`);
    expect(look.ways ?? []).toEqual([]);
  });

  it('refuses a rung that is not on the ladder', () => {
    const sim = world();
    expect(resolveLook(sim, { kind: 'band', id: `${idOf(sim, 'Halla')}/Chummy` }))
      .toHaveProperty('gone');
  });
});

describe('what moves it', () => {
  it('prints the numbers the engine actually applies', () => {
    const sim = world();
    const said = wordsIn(open(sim, 'whatmoves', idOf(sim, 'Halla')));
    const look = open(sim, 'whatmoves', idOf(sim, 'Halla'));
    expect(said + JSON.stringify(look.body)).toContain(String(TOGETHER_WARMS));
    expect(said + JSON.stringify(look.body)).toContain(String(MISSED_COOLS));
  });

  it('opens onto your own plans, which is the only thing that moves it', () => {
    const sim = world();
    const ways = (open(sim, 'whatmoves', idOf(sim, 'Halla')).ways ?? []).map((way) => way.to.kind);
    expect(ways).toContain('plans');
    expect(ways).toContain('household');
  });
});

describe('what they do on the land', () => {
  it('opens onto the thing itself', () => {
    const sim = world();
    for (const [first, kind] of [['Halla', 'company'], ['Jón', 'lot'], ['Katla', 'house']] as const) {
      const ways = (open(sim, 'estaterole', idOf(sim, first)).ways ?? []).map((way) => way.to.kind);
      expect(ways, `${first} does not open onto the ${kind}`).toEqual([kind]);
    }
  });

  it('sends somebody who runs none of it to the land instead', () => {
    const sim = world();
    sim.universe.people[idOf(sim, 'Halla')]!.estateRole = 'nothing in particular';
    const look = open(sim, 'estaterole', idOf(sim, 'Halla'));
    expect((look.ways ?? []).map((way) => way.to.kind)).toEqual(['estate']);
    expect(look.summary).toContain('leaves the running of it to everybody else');
  });

  it('never says a twin took it on before you could notice', () => {
    const sim = world();
    // A twin is exactly your age, so there is no before-you-noticed for them.
    expect(open(sim, 'estaterole', idOf(sim, 'Katla')).summary)
      .not.toContain('before you were old enough');
    expect(open(sim, 'estaterole', idOf(sim, 'Halla')).summary)
      .toContain('before you were old enough');
  });
});

describe('the list you get there from', () => {
  it('says what each person is to you before you open them', () => {
    const sim = world();
    const player = sim.universe.people[sim.universe.playerId]!;
    const ways = open(sim, 'household', player.householdId!).ways ?? [];
    const said = ways.map((way) => way.detail).join(' ');
    expect(said).toContain('Your mother');
    expect(said).toContain('Your twin sister');
    expect(said).toContain('You, and the nine dials');
  });
});

describe('every floor of it stays true as the world moves', () => {
  it('follows a missed plan all the way down', () => {
    const sim = world('household-missed');
    const katla = idOf(sim, 'Katla');
    const before = bondFor(sim.universe, sim.universe.playerId, katla)!.closeness;

    sim.execute({
      kind: 'calendar.schedule',
      payload: {
        title: 'Her Birthday', at: sim.now + 2 * MS_DAY,
        locationId: 'us-ca-losangeles', withIds: [katla],
      },
    });
    sim.advanceTo(sim.now + 3 * MS_DAY);

    const after = bondFor(sim.universe, sim.universe.playerId, katla)!.closeness;
    expect(after).toBeLessThan(before);

    // And every floor says so, without anybody telling it to. The number moved
    // in the engine; these pages read it back on the way down.
    expect(open(sim, 'bond', katla).summary).toBe(standingSaid(Math.round(after)));
    expect(open(sim, 'scale', katla).summary)
      .toContain(standingWord(Math.round(after)).toLowerCase());
    const rung = open(sim, 'band', `${katla}/${standingWord(Math.round(after))}`);
    expect((rung.ways ?? []).map((way) => way.label)).toContain('Katla Rivera');
  });
});

describe('the graph is walkable from a seed', () => {
  it('seeds every new kind from the people you actually have', () => {
    const sim = world();
    for (const kind of ['relation', 'bond', 'scale', 'whatmoves', 'estaterole']) {
      expect(seedsFor(kind, sim), `${kind} seeds nothing`).toHaveLength(3);
    }
    expect(seedsFor('band', sim)).toHaveLength(7);
  });

  it('seeds nothing at all for somebody with no people', () => {
    const sim = quickSave({}, 'household-alone');
    sim.universe.bonds = {};
    for (const kind of ['relation', 'bond', 'scale', 'whatmoves', 'estaterole', 'band']) {
      expect(seedsFor(kind, sim), `${kind} seeds a ghost`).toEqual([]);
    }
  });
});
