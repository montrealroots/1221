/**
 * SLATE — the gym, the trainer and the routines, opened where they are named.
 *
 * The Routines screen named every gym, every trainer and every routine as
 * plain text beside the buttons that act on them. Three kinds live here. A
 * `gym` is one in `content/gyms.ts`, yours or any other: its address, its
 * memberships at the town’s tax (`taxed`, `joiningCost`), whether it is open
 * now by its own hours (`shutAt`), and for a member what leaving would do by
 * its own terms (`leavingTerms`, from 2026-10-05; until then its cost alone). A `trainer` is one in `systems/trainers.ts`, at its session
 * price (`sessionPrice`). A `routine` is one of yours, its steps in the order
 * they run (`stepLabel`).
 *
 * Each figure is the engine’s; none is worked out here. Membership and
 * sessions are paid from the account the day comes out of, so that is where
 * the way to money goes.
 */

import { formatMoney, saveCurrency } from '@/engine/core/money';
import { dateKey, formatDate } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { GYMS, gymById, type Gym } from '@/engine/content/gyms';
import { joiningCost, leavingTerms, taxed } from '@/engine/systems/gyms';
import { shutAt } from '@/engine/systems/errands';
import { SUPERVISED, TRAINERS, sessionPrice, type Trainer } from '@/engine/systems/trainers';
import { stepLabel, type Routine } from '@/engine/systems/routines';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { spokenList } from './words';

const playerIn = (sim: Simulation): Person | undefined => sim.universe.people[sim.universe.playerId];
const townName = (id: string): string => CITIES.get(id)?.name ?? 'a town SLATE doesn’t know';

function placeWay(id: string, detail: string): Way[] {
  return CITIES.get(id) ? [{ to: at('place', id), label: townName(id), detail }] : [];
}

/** The account the day comes out of, where it is open. */
function spendingWay(sim: Simulation, person: Person, detail: string): Way[] {
  const account = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
  return account && !account.closedAt ? [{ to: at('account', account.id), label: account.name, detail }] : [];
}

// ---------------------------------------------------------------------------
// A gym
// ---------------------------------------------------------------------------

defineLook<Gym>('gym', {
  gone: 'There’s no gym by that name any more.',
  resolve: (_sim, id) => gymById(id),
  seeds: () => GYMS.map((g) => g.id),
  look: (g, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const money = (c: number) => formatMoney(c, cur, { cents: false });
    const person = playerIn(sim);
    const member = person?.gym?.gymId === g.id ? person.gym : undefined;
    const tier = member ? g.tiers.find((t) => t.name === member.tier) : undefined;
    const cheapest = [...g.tiers].sort((a, b) => a.monthly - b.monthly)[0];
    const shut = g.week ? shutAt(g.week, g.name, g.cityId, sim.now) : undefined;
    const leaving = member && person ? leavingTerms(sim, person) : undefined;
    const leavingSaid = !leaving ? ''
      : leaving.back > 0 ? `Leaving now gives back the ${money(leaving.back)} joining paid.`
      : leaving.endsAt > sim.now ? `Leaving takes notice: it would end ${formatDate(leaving.endsAt, CITIES.require(g.cityId).timeZone)}${leaving.pay ? `, and cost ${money(leaving.pay)}` : ''}.`
      : leaving.pay > 0 ? `Leaving now would cost ${money(leaving.pay)}.`
      : 'You can leave it whenever you like, for nothing.';
    const trainers = TRAINERS.filter((t) => t.cityId === g.cityId);
    const others = GYMS.filter((x) => x.cityId === g.cityId && x.id !== g.id);

    const ways: Way[] = [...placeWay(g.cityId, 'Its town, and what living there costs')];
    if (member && person) {
      ways.push(...spendingWay(sim, person, 'Where the month is taken from, on the day you joined each month'));
      ways.push({ to: at('day', dateKey(member.since, sim.homeZone)), label: formatDate(member.since, sim.homeZone), detail: 'When you joined' });
      if (member.termEnds !== undefined && member.termEnds > sim.now) ways.push({ to: at('day', dateKey(member.termEnds, sim.homeZone)), label: formatDate(member.termEnds, sim.homeZone), detail: 'When its minimum term ends; after it, leaving costs nothing' });
    }
    for (const t of trainers) ways.push({ to: at('trainer', t.id), label: t.name, detail: `A personal trainer in the same town, ${money(sessionPrice(sim, t))} a session` });
    for (const o of others) ways.push({ to: at('gym', o.id), label: o.name, detail: `Another gym in the same town, from ${money(taxed(sim, o, Math.min(...o.tiers.map((t) => t.monthly))))} a month` });

    const summary = member && tier
      ? `You’re a member on ${tier.name}, at ${money(taxed(sim, g, tier.monthly))} a month with the tax, and ${shut ? 'it’s shut right now' : 'it’s open right now'}.`
      : cheapest
        ? `Its cheapest membership is ${cheapest.name}, at ${money(taxed(sim, g, cheapest.monthly))} a month with the tax, and ${shut ? 'it’s shut right now' : 'it’s open right now'}.`
        : `It sells no membership SLATE knows of.`;

    return {
      name: g.name,
      kind: member ? 'Your Gym' : 'A Gym',
      summary,
      body: (
        <>
          <p className="small">
            It’s at {g.address}, in {townName(g.cityId)}{g.pool ? ', with a pool' : ''}.{' '}
            {shut ? `${shut} ` : ''}
            {g.tiers.length > 1 ? `It sells ${spokenList(g.tiers.map((t) => t.name))}.` : ''}{' '}
            {leavingSaid}{member && tier?.leave ? ` Its own terms: “${tier.leave.said}.”` : ''}
          </p>
          {(tier ?? cheapest) && (() => {
            const t = (tier ?? cheapest)!;
            return (
              <div className="grid grid-3">
                <Stat label="A Month" value={<span className="mono">{money(taxed(sim, g, t.monthly))}</span>} note={`${t.name}, with the tax`} />
                <Stat label="To Join" value={t.joining === null ? 'Not Published' : <span className="mono">{money(joiningCost(sim, g, t))}</span>} note="The fee, the first month and any year’s fee" />
                <Stat label="Term" value={t.termMonths ? `${t.termMonths} Months` : 'None'} note="The least you sign up for" />
              </div>
            );
          })()}
        </>
      ),
      ways,
      provenance: g.read === 'page' ? 'The prices are the gym’s own, read from its page.' : 'The prices are the gym’s own, as a search summary of its page gives them.',
    };
  },
});

// ---------------------------------------------------------------------------
// A personal trainer
// ---------------------------------------------------------------------------

defineLook<Trainer>('trainer', {
  gone: 'That trainer doesn’t take sessions any more.',
  resolve: (_sim, id) => TRAINERS.find((t) => t.id === id),
  seeds: () => TRAINERS.map((t) => t.id),
  look: (t, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const price = formatMoney(sessionPrice(sim, t), cur, { cents: false });
    const person = playerIn(sim);
    const plan = person?.training?.trainerId === t.id ? person.training : undefined;
    const gyms = GYMS.filter((g) => g.cityId === t.cityId);
    const ways: Way[] = [...placeWay(t.cityId, 'Where the sessions are')];
    if (plan && person) ways.push(...spendingWay(sim, person, 'Where each session is paid from, as it’s worked'));
    for (const g of gyms) ways.push({ to: at('gym', g.id), label: g.name, detail: 'A gym in the same town' });
    return {
      name: t.name,
      kind: plan ? 'Your Trainer' : 'A Personal Trainer',
      summary: plan
        ? `You have ${plan.perWeek} ${plan.perWeek === 1 ? 'session' : 'sessions'} a week booked at ${price} each, and ${Math.max(0, plan.perWeek - plan.used)} ${plan.perWeek - plan.used === 1 ? 'is' : 'are'} left this week.`
        : `A session in ${townName(t.cityId)} costs ${price}${t.tax ? ', with the tax' : ''}.`,
      body: (
        <p className="small">
          A workout with a session left that week is supervised, and builds {Math.round((SUPERVISED - 1) * 100)}% more than one alone. Each is paid as it’s worked, and only in {townName(t.cityId)}.
        </p>
      ),
      ways,
      provenance: 'The price is the studio’s own, or the market’s where no studio publishes one. The supervised gain is a 2025 trial’s.',
    };
  },
});

// ---------------------------------------------------------------------------
// A routine
// ---------------------------------------------------------------------------

interface Yours { person: Person; routine: Routine }

defineLook<Yours>('routine', {
  gone: 'That routine has been deleted.',
  resolve: (sim, id) => {
    const person = playerIn(sim);
    const routine = person?.routines?.find((r) => r.id === id);
    return person && routine ? { person, routine } : undefined;
  },
  seeds: (sim) => (playerIn(sim)?.routines ?? []).map((r) => r.id),
  look: ({ person, routine }) => {
    const steps = routine.steps.map((s) => stepLabel(person, s));
    return {
      name: routine.name,
      kind: 'A Routine',
      parent: at('person', person.id),
      summary: `It runs ${steps.length} ${steps.length === 1 ? 'step' : 'steps'} in order, starting with ${steps[0] ?? 'nothing'}.`,
      body: (
        <ol className="small" style={{ margin: 0, paddingLeft: '1.4em' }}>
          {steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      ),
      provenance: 'Each step runs as you’d do it by hand, and it stops at the first that can’t be done.',
    };
  },
});
