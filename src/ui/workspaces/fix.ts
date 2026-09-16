/**
 * What a shut door's blocker turns into on screen.
 *
 * This table lives in its own file because it has two readers: the `Missing`
 * row in `BusinessWorkspace`, which draws the chip, and the suite, which
 * presses it. While the table was a switch inside the component the only thing
 * the suite could check was that the source text contained a `case`, so a
 * payload could be wrong in the panel and every test stayed green.
 *
 * Four of the six run a command where they stand. Two open a form first,
 * because they need something the blocker cannot supply: a post needs a person
 * and an option needs a title.
 *
 * A `money` blocker has no chip on purpose. Money reaches the company five
 * ways — the lot letting a stage, the sugar group covering an overdraft, the
 * VAT reclaim, the reimbursement, and a distributor paying on delivery — and
 * not one of them is a button on this page.
 */

import type { GuildId, PolicyKind, RegistryId, RoleId } from '@/engine/domain/company';
import type { Blocker } from '@/engine/world/company';
import {
  GUILD_BY_ID, POLICY_BY_ID, REGISTRY_BY_ID,
} from '@/engine/content/incorporation';

export type Fix =
  | { label: string; kind: string; payload: Record<string, unknown> }
  | { label: string; asks: 'who'; role: RoleId }
  | { label: string; asks: 'what' };

/** The control for one blocker, or nothing where a button is the wrong answer. */
export function fixFor(blocker: Blocker): Fix | undefined {
  const id = blocker.fixId ?? '';
  switch (blocker.fixKind) {
    case 'registry': {
      const facts = REGISTRY_BY_ID[id as RegistryId];
      return facts
        ? { label: `Register With ${facts.body}`, kind: 'company.register', payload: { registry: id } }
        : undefined;
    }
    case 'arm':
      return { label: 'Form The American Arm', kind: 'company.form_arm', payload: {} };
    case 'guild': {
      const facts = GUILD_BY_ID[id as GuildId];
      return facts && facts.signable
        ? { label: `Sign With ${facts.body}`, kind: 'company.sign', payload: { guild: id } }
        : undefined;
    }
    case 'policy': {
      const facts = POLICY_BY_ID[id as PolicyKind];
      return facts
        ? { label: `Bind ${facts.label}`, kind: 'company.insure', payload: { policy: id } }
        : undefined;
    }
    case 'role':
      return { label: 'Fill The Post', asks: 'who', role: id as RoleId };
    // The label says Close The Gap and the form takes a fresh option, which
    // closes nothing. No reachable input has ever produced a gap: the only UI
    // path to `company.option` sends a title and nothing else, and nothing
    // anywhere sets `chainComplete` back to true.
    case 'holding':
      return { label: id ? 'Close The Gap' : 'Take An Option', asks: 'what' };
    default:
      return undefined;
  }
}
