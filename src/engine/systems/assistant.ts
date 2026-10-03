/**
 * SLATE — the built-in assistant's side of the engine (Stage 14 of
 * `docs/BACKLOG.md`, from 2026-10-02; how Claude is connected, and what it
 * costs, in `docs/AI-INTEGRATION.md`).
 *
 * The assistant never acts on the world. It reads a summary of the life as
 * it stands (`assistantState`), and answers with proposals: a command and its
 * payload, each with a sentence on why. A proposal is tried and put back
 * (`Simulation.preview`) before the player sees it, so it shows what it would
 * cost and whether the world would refuse it, by the same rules as a button
 * press. Only the commands listed here can be proposed, and the player takes
 * each one or leaves it. It can't make money, ownership, a qualification or
 * finished work, because nothing here can: every proposal is an ordinary
 * command the engine already validates.
 *
 * Ordinary play never needs it. Off, the game says so and nothing else
 * changes.
 */

import type { Simulation } from '../core/simulation';
import { saveCurrency } from '../core/money';
import { formatDate } from '../core/time';
import { CITIES } from '../content/geography';
import { netWorth } from './finance';
import { levelOf, rangeKm } from './fueltank';

/** What the assistant may propose, and the payload each takes, as the engine reads it. */
export const ASSISTANT_COMMANDS: Readonly<Record<string, { does: string; payload: string }>> = {
  'life.look_after': { does: 'Spend time looking after yourself: eat, wash, bathe, exercise, swim, unwind, laundry, tidy, wash up, mow and the rest', payload: '{ action: "eat" | "order" | "wash" | "bathe" | "exercise" | "swim" | "court" | "ride" | "outside" | "unwind" | "laundry" | "tidy" | "washup" | "mow" }' },
  'life.sleep': { does: 'Sleep for some hours, from now or a later time', payload: '{ hours: number, startAt?: epoch ms }' },
  'calendar.schedule': { does: 'Put a plan of your own on the calendar', payload: '{ title: string, at: epoch ms, durationMinutes?: number, locationId?: city id }' },
  'clothes.buy': { does: 'Buy a clothing product in a store or online', payload: '{ productId: string, how: "store" | "online", size?: string, color?: string, quantity?: number }' },
  'clothes.dress': { does: 'Put on garments you own and have to hand', payload: '{ itemIds: string[] }' },
  'clothes.basket_add': { does: 'Put a clothing product in the basket, to check out with the rest from its retailer', payload: '{ productId: string, how: "store" | "online", size?: string, color?: string, quantity?: number }' },
  'clothes.checkout': { does: 'Check out the basket at one retailer: one payment, one delivery', payload: '{ retailerId: string, how: "store" | "online" }' },
  'clothes.change': { does: 'Change into garments you own and have to hand, now', payload: '{ itemIds: string[] }' },
  'clothes.save_outfit': { does: 'Save garments you own as an outfit', payload: '{ name: string, itemIds: string[] }' },
  'clothes.wear_outfit': { does: 'Put on a saved outfit', payload: '{ outfitId: string }' },
  'clothes.sell': { does: 'Sell clean garments you own', payload: '{ itemIds: string[] }' },
  'food.cook': { does: 'Cook a recipe from what is in your kitchen, for so many servings', payload: '{ recipeId: string, servings?: number }' },
  'food.eat_ready': { does: 'Eat something ready in your kitchen', payload: '{ itemId?: string }' },
  'travel.book': { does: 'Book a journey to another town, with somewhere to stay', payload: '{ toCity: city id, day: epoch ms, slot?: number, nights?: number, returnDay?: epoch ms, hotelId?: string, room?: string, bags?: number }' },
  'vehicle.buy': { does: 'Buy a vehicle where you live', payload: '{ modelId: string, age?: years, financed?: boolean, months?: number, coverage?: "full" | "liability" }' },
  'vehicle.refuel': { does: 'Fill a vehicle at a station in its town, or charge an electric one, publicly or at home', payload: '{ vehicleId: string, home?: boolean }' },
  'vehicle.wrap': { does: 'Wrap a car you own, or its roof, hood or accent panels, at a wrap shop', payload: '{ vehicleId: string, shopId: string, color: string, finish: string, part?: "full" | "roof" | "hood" | "accents" }' },
  'vehicle.unwrap': { does: 'Have a wrap taken off at a shop that posts its price', payload: '{ vehicleId: string, shopId: string }' },
  'vehicle.stereo': { does: 'Fit a stereo to a car you own', payload: '{ vehicleId: string }' },
  'home.renovate': { does: 'Start a project on a home you own', payload: '{ homeId: string, projectId: string }' },
  'home.move': { does: 'Rent a room or a one-bedroom where you live', payload: '{ kind: "shared" | "own" }' },
  'home.gardener': { does: 'Hire or let go of a gardener for a home you own', payload: '{ homeId: string, on: boolean }' },
  'gym.join': { does: 'Join a gym in your town', payload: '{ gymId: string, tier: string }' },
  'gym.trainer': { does: 'Book a personal trainer, or stop', payload: '{ trainerId?: string, perWeek?: number }' },
  'social.invite': { does: 'Invite a person you know to a meal or home', payload: '{ contactId: string, at: epoch ms, what: "meal" | "visit", restaurantId?: string }' },
  'build.start': { does: 'Start building a house on land you own', payload: '{ parcelId: string, designId: string, live?: boolean, financed?: boolean }' },
};

export interface Proposal { kind: string; payload: Record<string, unknown>; why: string }
export interface CheckedProposal extends Proposal { ok: boolean; refusal?: string; costs?: number; notices: string[] }

/** What the assistant is told about the life: enough to plan with, read fresh each time. */
export function assistantState(sim: Simulation) {
  const p = sim.player;
  const cur = saveCurrency(sim.universe);
  const worth = netWorth(sim, p.id);
  return {
    now: sim.now,
    today: formatDate(sim.now, sim.zone),
    currency: cur,
    where: { cityId: p.currentLocationId, town: CITIES.get(p.currentLocationId)?.name },
    home: p.home ? { kind: p.home.kind, cityId: p.home.cityId } : undefined,
    money: { inTheBank: worth.cash, netWorth: worth.total },
    wellbeing: { ...p.wellbeing },
    upcoming: sim.universe.scheduled.filter((s) => s.status === 'pending' && s.requiresPlayer).slice(0, 12).map((s) => ({ at: s.at, label: s.label })),
    garments: (p.items ?? []).filter((i) => i.garment).slice(0, 80).map((i) => ({ id: i.id, label: i.label, slot: i.garment!.slot, dirty: i.garment!.dirty === true, size: i.spec?.size, color: i.spec?.color })),
    outfits: (p.outfits ?? []).map((o) => ({ id: o.id, name: o.name })),
    vehicles: (p.vehicles ?? []).filter((v) => v.soldAt === undefined).map((v) => ({ id: v.id, modelId: v.modelId, cityId: v.cityId, full: Math.round(levelOf(v) * 100) / 100, rangeKm: rangeKm(v) })),
    homes: (p.homes ?? []).map((h) => ({ id: h.id, cityId: h.cityId, address: h.facts.address })),
    contacts: (p.contacts ?? []).slice(0, 40).map((c) => ({ id: c.id, name: c.name, cityId: c.cityId })),
    commands: ASSISTANT_COMMANDS,
  };
}

/** A proposal tried and put back: whether the world takes it, what it would cost, and what it would say. */
export function checkProposal(sim: Simulation, proposal: Proposal): CheckedProposal {
  if (!ASSISTANT_COMMANDS[proposal.kind]) return { ...proposal, ok: false, refusal: 'That isn’t something the assistant may propose.', notices: [] };
  if (typeof proposal.payload !== 'object' || proposal.payload === null || Array.isArray(proposal.payload)) return { ...proposal, ok: false, refusal: 'The proposal didn’t say what to do it with.', notices: [] };
  const cash = (s: Simulation) => netWorth(s, s.player.id).cash;
  const before = sim.peek(cash);
  const tried = sim.preview({ kind: proposal.kind, payload: proposal.payload }, cash);
  if (!tried.ok) return { ...proposal, ok: false, refusal: tried.error, notices: tried.notices };
  return { ...proposal, ok: true, costs: Math.max(0, before - (tried.read ?? before)), notices: tried.notices };
}
