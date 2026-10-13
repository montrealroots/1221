/**
 * SLATE — where money comes in and goes out, as instructions (from 2026-10-10).
 *
 * Until then every incoming payment went to whichever account was primary on the day it arrived, and every standing
 * order and card autopay paid from it, so choosing a primary account rerouted everything at once, and a bank switch
 * was a pointer moved. Now each is an instruction of its own:
 *
 * - **The deposit instruction** (`depositTo`): where wages, a stipend, benefits, refunds and pensions are paid
 *   (`payeeAccount`). It's the payer's to act on, so a change takes effect from a later date (`DEPOSIT_LEAD`), and a
 *   payment made before then goes where it always did.
 * - **A standing order's account** (`StandingOrder.fromId`) and **a card's autopay account** (`CardState.autopayFrom`):
 *   each pays from the account it was set up on until the player moves it.
 * - **The primary account**: the debit card's purchases and the bills the player pays by hand come from it, and it's
 *   the default for a new instruction. Choosing another changes nothing already set up.
 *
 * A save from before keeps its behavior to the day: an instruction it never had is pinned to the primary account the
 * first time it's read, and holds from then on.
 */
import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { MS_DAY, type Instant } from '../core/time';
import { paymentsOf, type PaymentSettings } from './payments';

/**
 * How long a change of where wages and other payments are paid takes to reach them: SLATE's estimate of a payroll
 * cycle's lead time. Employers and agencies say a change takes effect "in one to two pay cycles" (see
 * docs/research/world/research-banking.json); one cycle of two weeks is taken, and a payment dated before it still
 * goes to the account it was going to.
 */
export const DEPOSIT_LEAD = { days: 14 } as const;

/**
 * Yale's own payroll, which pays work-study weekly: a change of direct deposit in Workday "takes approximately one pay
 * cycle" (Yale payroll, research-student-status.json A4), so seven days, from 2026-10-10. Every other payer keeps
 * `DEPOSIT_LEAD`, an estimate, not any institution's rule.
 */
export const PAYER_LEAD: Readonly<Record<string, number>> = { 'yale-payroll': 7 };
export type Payer = keyof typeof PAYER_LEAD;

/** A person's payment settings, kept on them where a save had none. */
function settingsOf(person: Person): PaymentSettings {
  person.payments ??= paymentsOf(person);
  return person.payments;
}

const open = (sim: Simulation, id: string | undefined): Account | undefined => {
  const a = id ? sim.universe.accounts[id] : undefined;
  return a && !a.closedAt ? a : undefined;
};

/**
 * Where incoming payments go today: the deposit instruction, a change to it applied once its day has come; for a payer
 * with a lead of its own (`PAYER_LEAD`), from that payer's day.
 */
export function depositAccount(sim: Simulation, person: Person, at: Instant = sim.now, payer?: string): Account | undefined {
  const pay = settingsOf(person);
  if (pay.depositChange && at >= pay.depositChange.at) {
    pay.depositTo = pay.depositChange.to;
    delete pay.depositChange;
  }
  pay.depositTo ??= open(sim, person.primaryAccountId)?.id;
  const early = payer ? pay.depositChange?.from?.[payer] : undefined;
  if (early !== undefined && at >= early) return open(sim, pay.depositChange!.to) ?? open(sim, pay.depositTo);
  return open(sim, pay.depositTo);
}

/** Asks the payers to pay into another account: from `DEPOSIT_LEAD` on. Returns when it takes effect. */
export function changeDeposits(sim: Simulation, person: Person, toId: string): Instant {
  const pay = settingsOf(person);
  depositAccount(sim, person);
  const at = sim.now + DEPOSIT_LEAD.days * MS_DAY;
  const from = Object.fromEntries(Object.entries(PAYER_LEAD).map(([payer, days]) => [payer, sim.now + days * MS_DAY]));
  if (pay.depositTo === toId) delete pay.depositChange;
  else pay.depositChange = { to: toId, at, from };
  return at;
}

/** The account a standing order pays from: the one it was set up on (pinned from the primary for an order from before). */
export function orderSource(sim: Simulation, person: Person, order: { fromId?: string }): Account | undefined {
  order.fromId ??= open(sim, person.primaryAccountId)?.id;
  return order.fromId ? sim.universe.accounts[order.fromId] : undefined;
}

/**
 * Everything an account was the instruction for, said so the player can move it before closing it (`closeRefusal`):
 * incoming payments, a change of them on its way, standing orders paying from it, card autopay from it, and one-off
 * payments set for a date. Until 2026-10-13 standing orders paying into it were named too; it’s read only for current
 * accounts, and an order goes only into savings (`bank.add_standing_order`), so none ever was.
 */
export function linkedTo(sim: Simulation, person: Person, accountId: string): string[] {
  const out: string[] = [];
  const pay = settingsOf(person);
  depositAccount(sim, person);
  if (pay.depositTo === accountId) out.push('Your wages and other payments are paid into it');
  if (pay.depositChange?.to === accountId) out.push('Your wages and other payments are being moved to it');
  for (const o of pay.standingOrders) {
    if (orderSource(sim, person, o)?.id === accountId) out.push(`A standing order pays from it on the ${o.day}`);
  }
  for (const [, state] of Object.entries(person.credit?.cards ?? {})) if (state.autopayFrom === accountId) out.push('A card’s autopay pays from it');
  if (person.credit?.autopayFrom === accountId) out.push('Your everyday card’s autopay pays from it');
  for (const loan of Object.values(sim.universe.accounts)) {
    if (loan.ownerId === person.id && !loan.closedAt && loan.kind === 'loan' && loan.repayFromId === accountId) out.push(`${loan.name}’s payments come from it`);
  }
  for (const i of sim.universe.scheduled) {
    if (i.status !== 'pending' || i.kind !== 'bank.scheduled_payment' || i.payload.personId !== person.id) continue;
    if (i.payload.fromId === accountId || i.payload.toId === accountId) out.push('A payment set for a date uses it');
  }
  return out;
}

/**
 * A bank closed the account on them (\`closeForOverdraft\`): what was paid into it is paid into the account they keep
 * elsewhere, as a payer re-sends a payment returned from a closed account (SLATE doesn't keep the return and the
 * re-sending apart). Standing orders and autopay from it aren't moved: they fail, and say so, until the player sets
 * them up again.
 */
export function redirectAway(sim: Simulation, person: Person, fromId: string, toId: string): void {
  const pay = settingsOf(person);
  depositAccount(sim, person);
  if (pay.depositTo === fromId) pay.depositTo = toId;
  if (pay.depositChange?.to === fromId) delete pay.depositChange;
}
