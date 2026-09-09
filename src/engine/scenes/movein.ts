/**
 * Moving in: the empty rooms, and what goes in them.
 *
 * The key turns; if you did not live here yet, you do now and the old
 * lease ends today. Pick how the place should feel, then go room by room:
 * leave it bare, make it comfortable, or do it properly. Each room is one
 * commit through the property system's furnishing rule, so a retry cannot
 * buy a sofa twice, and the price is on the line before you choose. The
 * living quality of the house is what changes, and it is what you sleep in.
 *
 * The short version moves in, picks Warm Minimal, and makes every room
 * comfortable that the money allows.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { formatMoney } from '../core/money';
import type { Room, SceneSession } from '../domain/model';
import { preview, speak } from '../dialogue/library';
import { DESIGN_THEMES, propertyQuality } from '../systems/property';
import { FURNISH_LEVELS, furnishPlan, furnishable, roomsFor, type FurnishLevel } from '../systems/purchase';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';

function str(session: SceneSession, key: string): string {
  const value = session.context[key];
  return value === null || value === undefined ? '' : String(value);
}

function doneRooms(session: SceneSession): string[] {
  return str(session, 'done').split(',').filter(Boolean);
}

function propertyOfSession(sim: Simulation, session: SceneSession) {
  const property = sim.universe.properties[str(session, 'propertyId')];
  if (!property) throw new CommandError('That home is gone.');
  return property;
}

function isFirst(sim: Simulation, propertyId: string): boolean {
  return !Object.values(sim.universe.furnishings).some((f) => f.propertyId === propertyId);
}

function line(sim: Simulation, beat: 'door' | 'room' | 'done', flag: string, salt: string, record: boolean): string {
  const ctx = { flags: [flag] };
  const query = { section: 'property', purpose: 'movein', beat };
  return (record ? speak(sim, query, ctx, salt) : preview(sim, query, ctx, salt)).text;
}

function available(sim: Simulation, room: Room): number {
  void room;
  const accountId = sim.player.primaryAccountId;
  return accountId ? sim.ledger.availableFunds(accountId) : 0;
}

export const MOVEIN_SCENE = defineScene({
  id: 'property.movein',
  version: 1,
  title: 'Moving In',
  placeBound: false,

  available(sim, input) {
    const can = furnishable(sim, String(input['propertyId']));
    return can.ok ? { ok: true } : { ok: false, reason: can.reason };
  },

  start(sim, input) {
    const property = sim.universe.properties[String(input['propertyId'])];
    const themed = property ? roomsFor(sim, property.id).find((r) => r.themeId)?.themeId : undefined;
    return {
      node: 'door',
      context: { propertyId: property?.id ?? '', themeId: themed ?? '', roomId: '', done: '', lastNote: '', spent: 0, before: property ? Math.round(propertyQuality(sim, property.id)) : 0 },
      participantIds: [],
      refType: 'property',
      refId: property?.id,
    };
  },

  view(sim, session) {
    const property = propertyOfSession(sim, session);
    const rooms = roomsFor(sim, property.id);
    const quality = Math.round(propertyQuality(sim, property.id));
    const resident = sim.player.residenceId === property.id;
    const first = isFirst(sim, property.id);
    const theme = DESIGN_THEMES.find((t) => t.id === str(session, 'themeId'));
    switch (session.node) {
      case 'door': {
        return {
          title: property.addressLine,
          eyebrow: `${rooms.length} rooms · living quality ${quality}`,
          text: line(sim, 'door', first ? 'first' : 'returning', `${property.id}:door`, false),
          choices: [
            resident
              ? { id: 'in', label: 'Go In', aliases: ['in', 'go in', 'enter'], tone: 'primary' as const }
              : { id: 'in', label: 'Move In', aliases: ['in', 'move in', 'enter'], tone: 'primary' as const, detail: 'Two hours. If you rent somewhere, that lease ends today.' },
          ],
          facts: [{ label: 'Living Quality', value: `${quality}` }, { label: 'You Have', value: formatMoney(available(sim, rooms[0]!)) }],
          canSkip: true,
        };
      }
      case 'theme': {
        const choices: SceneChoice[] = DESIGN_THEMES.map((t) => ({ id: `theme:${t.id}`, label: t.name, aliases: [t.id.replace(/_/g, ' ')], detail: t.description }));
        return {
          title: 'How Should It Feel?',
          eyebrow: property.addressLine,
          text: 'One idea for the whole house. The pieces you buy will read against it, and a room that agrees with itself is worth more than the sum of what is in it.',
          choices,
          canSkip: true,
        };
      }
      case 'rooms': {
        const done = doneRooms(session);
        const choices: SceneChoice[] = rooms.map((r) => ({
          id: `room:${r.id}`, label: r.name, aliases: [r.name.toLowerCase().replace(/^the /, ''), r.kind],
          detail: `${r.sqft.toLocaleString('en-US')} sq ft · quality ${r.quality}${done.includes(r.id) ? ' · done today' : ''}`,
        }));
        choices.push({ id: 'enough', label: 'That Is Enough For Today', aliases: ['enough', 'done', 'stop'], tone: done.length > 0 ? 'primary' : undefined });
        return {
          title: 'The Rooms',
          eyebrow: `${theme?.name ?? 'No theme'} · living quality ${quality} · ${formatMoney(available(sim, rooms[0]!))} to spend`,
          text: str(session, 'lastNote') || 'Every door is open. Start anywhere.',
          choices,
          canSkip: true,
        };
      }
      case 'room': {
        const room = rooms.find((r) => r.id === str(session, 'roomId'));
        if (!room) throw unknownStep();
        const funds = available(sim, room);
        const choices: SceneChoice[] = FURNISH_LEVELS.map((level) => {
          const plan = furnishPlan(sim, room, level.id, theme?.id);
          return {
            id: `level:${level.id}`, label: level.label, aliases: [level.id],
            detail: level.id === 'bare' ? level.detail : `${formatMoney(plan.cost)} · quality about ${plan.projectedQuality} · ${plan.items.map((i) => i.name).join(', ') || 'finishes only'}`,
            disabled: level.id === 'bare' ? undefined : plan.cost > funds ? `You have ${formatMoney(funds)}.` : plan.items.length === 0 && !plan.finish ? 'Nothing more to do here.' : undefined,
            tone: level.id === 'comfortable' ? 'primary' as const : undefined,
          };
        });
        choices.push({ id: 'back', label: 'Another Room', aliases: ['back', 'rooms'] });
        return {
          title: room.name,
          eyebrow: `${room.kind === 'outside' ? 'Outside' : `${room.sqft.toLocaleString('en-US')} sq ft`} · quality ${room.quality}${theme ? ` · ${theme.name}` : ''}`,
          text: 'What goes in here, and what it costs. Delivered and placed today.',
          choices,
          facts: [{ label: 'You Have', value: formatMoney(funds) }],
          canSkip: false,
        };
      }
      case 'done': {
        return {
          title: 'Home',
          eyebrow: property.addressLine,
          text: line(sim, 'done', first ? 'first' : 'returning', `${property.id}:done`, false),
          choices: [{ id: 'finish', label: 'Back To The Day', aliases: ['done', 'ok', 'finish'], tone: 'primary' }],
          facts: [
            { label: 'Living Quality', value: `${session.context['before']} to ${quality}` },
            { label: 'Spent Today', value: formatMoney(Number(session.context['spent'])) },
            { label: 'Rooms Done', value: `${doneRooms(session).length} of ${rooms.length}` },
          ],
          canSkip: false,
          canLeave: false,
        };
      }
      default:
        throw unknownStep();
    }
  },

  choose(sim, session, choiceId, ctx) {
    const property = propertyOfSession(sim, session);
    switch (session.node) {
      case 'door': {
        if (choiceId !== 'in') throw unknownStep();
        if (sim.player.residenceId !== property.id) {
          ctx.commit('movein', { kind: 'prop.move_in', payload: { propertyId: property.id } });
          ctx.say(`You move in. ${roomsFor(sim, property.id).length} rooms, most of them empty.`);
        }
        ctx.go(str(session, 'themeId') ? 'rooms' : 'theme');
        return;
      }
      case 'theme': {
        if (!choiceId.startsWith('theme:')) throw unknownStep();
        const theme = DESIGN_THEMES.find((t) => t.id === choiceId.slice(6));
        if (!theme) throw new CommandError('That isn’t a theme SLATE knows.');
        session.context['themeId'] = theme.id;
        session.context['lastNote'] = `${theme.name}. ${theme.description}`;
        ctx.go('rooms');
        return;
      }
      case 'rooms': {
        if (choiceId === 'enough') { ctx.go('done'); return; }
        if (!choiceId.startsWith('room:')) throw unknownStep();
        const room = roomsFor(sim, property.id).find((r) => r.id === choiceId.slice(5));
        if (!room) throw new CommandError('There’s no room like that.');
        session.context['roomId'] = room.id;
        ctx.go('room');
        return;
      }
      case 'room': {
        if (choiceId === 'back') { ctx.go('rooms'); return; }
        if (!choiceId.startsWith('level:')) throw unknownStep();
        const level = choiceId.slice(6) as FurnishLevel;
        if (!FURNISH_LEVELS.some((l) => l.id === level)) throw unknownStep();
        const room = roomsFor(sim, property.id).find((r) => r.id === str(session, 'roomId'));
        if (!room) throw unknownStep();
        const done = doneRooms(session);
        if (level === 'bare') {
          const note = line(sim, 'room', 'bare', `${room.id}:bare`, true);
          session.context['lastNote'] = `${room.name}: ${note}`;
          ctx.say(note);
          ctx.go('rooms');
          return;
        }
        const result = ctx.commit<{ cost: number; quality: number; bought: string[] }>(`furnish:${room.id}`, { kind: 'prop.furnish_room', payload: { roomId: room.id, level, themeId: str(session, 'themeId') || undefined } });
        if (!done.includes(room.id)) done.push(room.id);
        session.context['done'] = done.join(',');
        session.context['spent'] = Number(session.context['spent']) + result.cost;
        const note = line(sim, 'room', level, `${room.id}:${level}`, true);
        session.context['lastNote'] = `${room.name}, ${formatMoney(result.cost)}, quality ${result.quality}. ${note}`;
        ctx.say(`${room.name}: ${result.bought.join(', ') || 'finishes'} for ${formatMoney(result.cost)}. ${note}`);
        ctx.go('rooms');
        return;
      }
      case 'done': {
        if (choiceId !== 'finish') throw unknownStep();
        ctx.finish();
        return;
      }
      default:
        throw unknownStep();
    }
  },

  summarise(sim, session, ctx) {
    const property = propertyOfSession(sim, session);
    if (sim.player.residenceId !== property.id) {
      ctx.commit('movein', { kind: 'prop.move_in', payload: { propertyId: property.id } });
      ctx.say(`You move in. ${roomsFor(sim, property.id).length} rooms, most of them empty.`);
    }
    if (!str(session, 'themeId')) session.context['themeId'] = 'warm_minimal';
    const done = doneRooms(session);
    for (const room of roomsFor(sim, property.id)) {
      if (done.includes(room.id)) continue;
      const plan = furnishPlan(sim, room, 'comfortable', str(session, 'themeId'));
      const funds = available(sim, room);
      if (plan.cost > funds || (plan.items.length === 0 && !plan.finish)) continue;
      const result = ctx.commit<{ cost: number; quality: number; bought: string[] }>(`furnish:${room.id}`, { kind: 'prop.furnish_room', payload: { roomId: room.id, level: 'comfortable', themeId: str(session, 'themeId') } });
      done.push(room.id);
      session.context['spent'] = Number(session.context['spent']) + result.cost;
      ctx.say(`${room.name}: ${result.bought.join(', ') || 'finishes'} for ${formatMoney(result.cost)}.`);
    }
    session.context['done'] = done.join(',');
    ctx.say(`${done.length} of ${roomsFor(sim, property.id).length} rooms done. Living quality ${session.context['before']} to ${Math.round(propertyQuality(sim, property.id))}.`);
    ctx.finish();
  },
});
