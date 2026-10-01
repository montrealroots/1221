/**
 * What they own and where each thing is (`systems/items.ts`, from 2026-10-01):
 * on them, at home and in which spot, in a vehicle, inside a bag, on its way
 * from an order, or with a service. A thing is moved only from where it's to
 * hand, to a place they can reach, into room enough.
 */
import { Fragment, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { useFeature } from '@/ui/guide/Guide';
import { formatDate } from '@/engine/core/time';
import { SPOT_LABEL, homeKeyOf, itemsOf, moveRefusal, reachable, usedL, whereWords, type Item, type Place, type Spot } from '@/engine/systems/items';
import { ordersOf } from '@/engine/systems/orders';
import { modelById, vehiclesOf } from '@/engine/systems/vehicles';

/** The places they can put a thing now: on them, a spot at home, a vehicle here, a bag to hand. */
function placesNow(sim: Parameters<typeof reachable>[0], person: Parameters<typeof reachable>[1], items: readonly Item[]): { key: string; label: string; place: Place }[] {
  const out: { key: string; label: string; place: Place }[] = [{ key: 'person', label: 'On You', place: { kind: 'person' } }];
  const home = homeKeyOf(person.home);
  if (home && reachable(sim, person, { kind: 'home', home })) {
    for (const spot of Object.keys(SPOT_LABEL) as Spot[]) out.push({ key: `home:${spot}`, label: `Home, ${SPOT_LABEL[spot]}`, place: { kind: 'home', home, spot } });
  }
  for (const v of vehiclesOf(person)) {
    const place: Place = { kind: 'vehicle', vehicleId: v.id };
    if (reachable(sim, person, place)) { const m = modelById(v.modelId); out.push({ key: `vehicle:${v.id}`, label: `The ${m?.make ?? ''} ${m?.model ?? 'Vehicle'}`.replace('  ', ' '), place }); }
  }
  for (const bag of items) if (bag.holdsL && reachable(sim, person, bag.at)) out.push({ key: `inside:${bag.id}`, label: `In The ${bag.label}`, place: { kind: 'inside', itemId: bag.id } });
  return out;
}

/** Words for a place, as a heading. */
const titled = (words: string) => words.replace(/(^|[\s,]+)(\w)/g, (_m, sep: string, c: string) => sep + c.toUpperCase());

export function BelongingsWorkspace() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const items = itemsOf(person);
  const move = useFeature('items.move');
  const [target, setTarget] = useState<Record<string, string>>({});
  const places = placesNow(sim, person, items);
  const toHandCount = items.filter((i) => reachable(sim, person, i.at)).length;
  const coming = ordersOf(person).filter((o) => o.status === 'placed');
  // Grouped by where each thing is, in the order a person thinks of them.
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const key = whereWords(person, item.at);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Day</div>
        <h1>Belongings</h1>
        <p className="muted">What you own, and where each thing is: only what’s to hand can be used or moved.</p>
      </div>
      <div className="col gap-5">
        <Panel title="Where Things Are">
          <div className="grid grid-3">
            <Stat label="Owned" value={String(items.length)} note="Each thing, or each set of the same" />
            <Stat label="To Hand" value={String(toHandCount)} note="Where you are now" />
            <Stat label="On Their Way" value={String(coming.length)} note={coming.length ? `The next arrives ${formatDate(Math.min(...coming.map((o) => o.arrivesAt)), sim.zone)}` : 'No orders outstanding'} />
          </div>
        </Panel>
        {items.length > 0 && (
          <Panel title="Each Thing">
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Thing</th><th scope="col" className="num">How Many</th><th scope="col" className="num">Condition</th><th scope="col">Room</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {[...groups.entries()].map(([where, list]) => (
                    <Fragment key={where}>
                      <tr><th scope="rowgroup" colSpan={5}>{titled(where)}</th></tr>
                      {list.map((item) => {
                        const here = reachable(sim, person, item.at);
                        // Only where the engine would take it: not where it is, nor anywhere it would refuse.
                        const options = places.filter((p) => JSON.stringify(p.place) !== JSON.stringify(item.at) && !moveRefusal(sim, person, item, p.place));
                        const chosen = options.some((o) => o.key === target[item.id]) ? target[item.id] : options[0]?.key;
                        const to = options.find((o) => o.key === chosen)?.place;
                        return (
                          <tr key={item.id}>
                            <td>{item.label}</td>
                            <td className="num mono">{item.quantity}</td>
                            <td className="num mono">{Math.round(item.condition * 100)}%</td>
                            <td className="small">{item.holdsL ? `${Math.round(usedL(person, item.id))} Of ${item.holdsL} L` : '—'}</td>
                            <td>
                              {here && options.length > 0 ? (
                                <div className="row gap-1" style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                                  <select aria-label={`Move the ${item.label} to`} value={chosen} disabled={!move.open} onChange={(e) => setTarget({ ...target, [item.id]: e.target.value })}>
                                    {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                                  </select>
                                  <button type="button" className="btn btn-sm btn-ghost" disabled={!move.open || !to} title={move.reason} onClick={() => { if (to && run('items.move', { itemId: item.id, to }).ok) toast(`The ${item.label}, moved.`, 'positive'); }}>Move It</button>
                                </div>
                              ) : <div className="xs dim" style={{ textAlign: 'right' }}>{here ? 'Stays Where It Is' : 'Not To Hand'}</div>}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
        {items.length === 0 && <Panel title="Your Belongings"><p className="small muted" style={{ margin: 0 }}>You own nothing here yet beyond your home and vehicles. What you buy appears here, where it’s put.</p></Panel>}
        <Fine>A thing at home is to hand only at home; one in a car, only where the car is; one in a bag, wherever the bag is. An order’s things are yours from when you pay, and to hand when they’re delivered. A move brings your belongings with it.</Fine>
      </div>
    </>
  );
}
