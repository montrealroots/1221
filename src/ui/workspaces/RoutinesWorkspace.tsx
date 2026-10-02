/**
 * Routines (`systems/routines.ts`, from 2026-10-01): a list of everyday
 * steps put together, named and saved, and run in order, each the command
 * a screen would run, stopping at the first that can't be done.
 */
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine } from '@/ui/components/primitives';
import { Gated, useFeature } from '@/ui/guide/Guide';
import { LOOKING_AFTER, type LookAfter } from '@/engine/systems/life';
import { RECIPES } from '@/engine/content/groceries';
import { MAX_STEPS, routineRefusal, runRoutine, stepLabel, type RoutineStep } from '@/engine/systems/routines';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { gymById } from '@/engine/content/gyms';
import { gymsIn, joinRefusal, joiningCost, leavingCost, taxed } from '@/engine/systems/gyms';
import { arrange } from '@/engine/systems/catalog';
import { groceryCatalog } from '@/engine/systems/kitchen';
import { salonsIn, toiletryCatalog } from '@/engine/systems/hygiene';
import { modelById, vehiclesOf } from '@/engine/systems/vehicles';
import { contactsOf } from '@/engine/systems/people';
import { leg, runErrands, tripRefusal, type Stop, driverIn } from '@/engine/systems/trips';
import { sessionPrice, trainersIn } from '@/engine/systems/trainers';
import { METER, STATIONS } from '@/engine/content/errandtrips';
import { groupLabelOf } from '@/ui/shell/destinations';
import { LookRegion, Open, at } from '@/ui/looks';

export function RoutinesWorkspace() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const routines = useWorld((s) => s.player.routines ?? []);
  const outfits = useWorld((s) => s.player.outfits ?? []);
  const save = useFeature('routine.save');
  const drop = useFeature('routine.delete');
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [name, setName] = useState('');
  const [choice, setChoice] = useState('look:wash');
  // The steps there are to choose from: looking after yourself, eating, cooking, dressing.
  const options: { key: string; label: string; step: RoutineStep }[] = [
    ...(Object.keys(LOOKING_AFTER) as LookAfter[]).map((a) => ({ key: `look:${a}`, label: LOOKING_AFTER[a].label, step: { kind: 'life.look_after', payload: { action: a } } })),
    { key: 'ready', label: 'Eat Something Ready', step: { kind: 'food.eat_ready', payload: {} } },
    ...RECIPES.map((r) => ({ key: `cook:${r.id}`, label: `Cook ${r.name}`, step: { kind: 'food.cook', payload: { recipeId: r.id } } })),
    ...outfits.map((o) => ({ key: `wear:${o.id}`, label: `Wear ${o.name}`, step: { kind: 'clothes.wear_outfit', payload: { outfitId: o.id } } })),
  ];
  const picked = options.find((o) => o.key === choice) ?? options[0]!;
  const no = routineRefusal(name, steps);
  const go = (routineId: string, routineName: string) => {
    const result = runRoutine(sim, routineId, (kind, payload) => run(kind, payload, { silent: true }));
    if (result.stopped) toast(`${routineName} stopped at ${result.stopped.label}: ${result.stopped.error}`, 'negative');
    else toast(`${routineName}, done.`, 'positive');
  };
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">{groupLabelOf('/workspace/routines')}</div>
        <h1>Routines</h1>
        <p className="muted">The things you do in order, saved and done again: each step as you’d do it, stopping where one can’t be done.</p>
      </div>
      <div className="col gap-5">
        <Panel title="Your Routines">
          {routines.length === 0 ? <p className="small muted" style={{ margin: 0 }}>You haven’t put a routine together yet.</p> : (
            <LookRegion className="table-scroll">
              <table>
                <thead><tr><th scope="col">Routine</th><th scope="col">Steps</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {routines.map((r) => (
                    <tr key={r.id}>
                      <td><Open subject={at('routine', r.id)}>{r.name}</Open></td>
                      <td className="small">{r.steps.map((s) => stepLabel(person, s)).join(' · ')}</td>
                      <td>
                        <div className="row gap-1" style={{ justifyContent: 'flex-end' }}>
                          <button type="button" className="btn btn-sm" onClick={() => go(r.id, r.name)}>Run It</button>
                          <button type="button" className="btn btn-sm btn-ghost" disabled={!drop.open} title={drop.reason} onClick={() => run('routine.delete', { routineId: r.id })}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </LookRegion>
          )}
        </Panel>
        <Panel title="Put One Together" subtitle={`Up to ${MAX_STEPS} steps`}>
          <div className="col gap-3">
            <div className="field-row field-row-tight">
              <div className="field">
                <label htmlFor="routine-step">Step</label>
                <select id="routine-step" value={picked.key} onChange={(e) => setChoice(e.target.value)}>
                  {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="routine-name">Name</label>
                <input id="routine-name" value={name} placeholder="Weekday Morning" onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div className="row gap-1">
              <button type="button" className="btn btn-sm btn-ghost" disabled={steps.length >= MAX_STEPS} onClick={() => setSteps([...steps, picked.step])}>Add The Step</button>
              <button type="button" className="btn btn-sm btn-ghost" disabled={steps.length === 0} onClick={() => setSteps(steps.slice(0, -1))}>Take The Last Off</button>
              <button type="button" className="btn btn-sm" disabled={!save.open || Boolean(no)} title={no ?? save.reason} onClick={() => { if (run('routine.save', { name, steps }).ok) { toast(`${name.trim()}, saved.`, 'positive'); setSteps([]); setName(''); } }}>Save It</button>
            </div>
            <div className="small">{steps.length ? steps.map((s, i) => `${i + 1}. ${stepLabel(person, s)}`).join('   ') : 'No steps yet.'}</div>
          </div>
        </Panel>
        <ErrandsPanel />
        <GymPanel />
          <TrainerPanel />
        <Fine>A routine runs each step as you would, with its own time and checks: a shower when you aren’t clean, a meal when you’re hungry and can pay, a recipe when the kitchen has what it takes. It stops at the first that can’t be done and says why; what was done before it stays done.</Fine>
      </div>
    </>
  );
}

/** A gym of your own (`systems/gyms.ts`): the town's gyms and their memberships, cheapest first, and leaving one. */
/** A personal trainer by the session (`systems/trainers.ts`). */
function TrainerPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const book = useFeature('gym.trainer');
  const [perWeek, setPerWeek] = useState(2);
  const cur = saveCurrency(sim.universe);
  const trainers = trainersIn(person.currentLocationId);
  if (!trainers.length) return null;
  const booked = person.training ? trainers.find((t) => t.id === person.training!.trainerId) : undefined;
  return (
    <Panel title="A Personal Trainer" look={booked ? at('trainer', booked.id) : undefined} subtitle={booked ? `${booked.name}, ${person.training!.perWeek} A Week` : 'Supervised, a workout builds 37% more (Gavanda, 2025); by the session, cheapest first'}>
      <div className="field-row">
        <select aria-label="Sessions A Week" value={perWeek} onChange={(e) => setPerWeek(Number(e.target.value))} style={{ width: 'auto' }}>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{`${n} A Week`}</option>)}
        </select>
        {trainers.map((t) => <Gated key={t.id} feature="gym.trainer" className="btn btn-sm btn-ghost" disabled={booked?.id === t.id && person.training!.perWeek === perWeek} title={book.reason} onClick={() => { if (run('gym.trainer', { trainerId: t.id, perWeek }).ok) toast(`${t.name}, ${perWeek} a week.`, 'positive'); }}>{`${t.name}, ${formatMoney(sessionPrice(sim, t), cur, { cents: false })} A Session`}</Gated>)}
        {booked && <Gated feature="gym.trainer" className="btn btn-sm btn-ghost" onClick={() => { if (run('gym.trainer', {}).ok) toast('No trainer now.', 'neutral'); }}>Stop The Sessions</Gated>}
      </div>
    </Panel>
  );
}

function GymPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const join = useFeature('gym.join');
  const leave = useFeature('gym.leave');
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const mine = person.gym ? gymById(person.gym.gymId) : undefined;
  const offers = gymsIn(person.currentLocationId).flatMap((g) => g.tiers.map((t) => ({ g, t, month: taxed(sim, g, t.monthly) }))).sort((a, b) => a.month - b.month);
  return (
    <Panel title="Your Gym" look={mine ? at('gym', mine.id) : undefined} subtitle={mine ? `${mine.name}, ${person.gym!.tier}` : 'The gyms where you are, by the month, cheapest first'}>
      {mine ? (
        <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="small">{mine.address}{mine.pool ? ', with a pool' : ''}</span>
          <button type="button" className="btn btn-sm btn-ghost" disabled={!leave.open} title={leave.reason} onClick={() => { const a = run<{ paid: number }>('gym.leave', {}); if (a.ok) toast(a.value!.paid ? `You left, paying the rest of the term, ${money(a.value!.paid)}.` : 'You left the gym.', 'neutral'); }}>{leavingCost(sim, person) ? `Leave The Gym, ${money(leavingCost(sim, person))}` : 'Leave The Gym'}</button>
        </div>
      ) : offers.length === 0 ? <p className="small muted" style={{ margin: 0 }}>SLATE keeps no gyms where you are.</p> : (
        <LookRegion className="table-scroll">
          <table>
            <thead><tr><th scope="col">Gym</th><th scope="col">Membership</th><th scope="col" className="num">A Month</th><th scope="col" className="num">To Join</th><th scope="col">Term</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {offers.map(({ g, t, month }) => {
                const no = joinRefusal(sim, person, g.id, t.name);
                return (
                  <tr key={`${g.id}-${t.name}`}>
                    <td><Open subject={at('gym', g.id)}>{g.name}</Open>{g.pool ? <div className="xs dim">A Pool</div> : null}</td>
                    <td>{t.name}{t.annual === null ? <div className="xs dim">Annual Fee Not Published</div> : t.annual ? <div className="xs dim">{`And ${money(taxed(sim, g, t.annual))} A Year`}</div> : null}</td>
                    <td className="num mono">{money(month)}</td>
                    <td className="num mono">{t.joining === null ? 'Not Published' : money(joiningCost(sim, g, t))}</td>
                    <td className="small">{t.termMonths ? `${t.termMonths} Months` : 'None'}</td>
                    <td><button type="button" className="btn btn-sm btn-ghost" disabled={!join.open || Boolean(no)} title={no ?? join.reason} onClick={() => { const a = run<{ paid: number }>('gym.join', { gymId: g.id, tier: t.name }); if (a.ok) toast(`You joined ${g.name}, for ${money(a.value!.paid)}.`, 'positive'); }}>Join</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </LookRegion>
      )}
    </Panel>
  );
}

/** A trip out on errands (`systems/trips.ts`): stops in the town you're in, by car or on foot, with somebody along if you like. */
function ErrandsPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  // A trip runs all three: the legs, the meters and a fuel stop.
  const go = useFeature('errand.go');
  const park = useFeature('errand.park');
  const fuel = useFeature('errand.fuel');
  const here = person.currentLocationId;
  const cars = vehiclesOf(person).filter((v) => v.soldAt === undefined && (v.at ?? v.cityId) === here);
  const friends = contactsOf(person).filter((c) => c.cityId === here && !c.rival);
  const [by, setBy] = useState<'car' | 'foot'>('foot');
  const [vehicleId, setVehicleId] = useState('');
  const [passengers, setPassengers] = useState<string[]>([]);
  const [driven, setDriven] = useState(false);
  const driver = driverIn(here);
  const [stops, setStops] = useState<(Stop & { label: string })[]>([]);
  const [choice, setChoice] = useState('');
  const car = cars.find((v) => v.id === vehicleId) ?? cars[0];
  // What a stop can be, cheapest first within each kind.
  const options: (Stop & { key: string; label: string })[] = [
    ...arrange(groceryCatalog(sim, here)).slice(0, 40).map((e) => ({ key: `g:${e.id}`, label: `Buy ${e.label}`, kind: 'food.buy_groceries', payload: { productId: e.id, quantity: 1 }, leg: 'shopping' as const })),
    ...arrange(toiletryCatalog(sim, here)).slice(0, 40).map((e) => ({ key: `t:${e.id}`, label: `Buy ${e.label}`, kind: 'hygiene.buy', payload: { productId: e.id, quantity: 1 }, leg: 'shopping' as const })),
    ...salonsIn(here).flatMap((salon) => salon.services.filter((x) => x.price !== null).map((x) => ({ key: `s:${salon.id}:${x.service}`, label: `${x.label} At ${salon.name}`, kind: 'hygiene.groom', payload: { salonId: salon.id, service: x.service }, leg: 'errand' as const }))),
    { key: 'dry', label: 'Drop Off The Dry Cleaning', kind: 'clothes.dry_clean', payload: {}, leg: 'errand' },
    { key: 'collect', label: 'Collect The Dry Cleaning', kind: 'clothes.collect', payload: {}, leg: 'errand' },
    ...(by === 'car' ? (STATIONS[here] ?? []).map((st, i) => ({ key: `f:${i}`, label: `Fuel At ${st}`, kind: 'errand.fuel', payload: { station: i }, leg: 'errand' as const })) : []),
  ];
  const picked = options.find((o) => o.key === choice) ?? options[0];
  const withDriver = by === 'car' && driven && Boolean(driver);
  const no = tripRefusal(sim, person, by, car?.id, passengers, withDriver) ?? (stops.length === 0 ? 'Add a stop.' : undefined);
  const each = leg(here, by, 'shopping');
  return (
    <Panel title="Run Errands" subtitle={`A leg is about ${each.km.toFixed(1)} km, ${Math.round(each.minutes)} minutes${by === 'car' ? (METER[here] ? `; parking at ${METER[here]!.zone}` : '; no meter rate published here') : ' on foot'}`}>
      <div className="col gap-3">
        <div className="field-row">
          <div className="field">
            <label htmlFor="errand-by">How</label>
            <select id="errand-by" value={by} onChange={(e) => setBy(e.target.value === 'car' ? 'car' : 'foot')}>
              <option value="foot">On Foot</option>
              {cars.length > 0 && <option value="car">By Car</option>}
            </select>
          </div>
          {by === 'car' && cars.length > 1 && (
            <div className="field">
              <label htmlFor="errand-car">Car</label>
              <select id="errand-car" value={car?.id ?? ''} onChange={(e) => setVehicleId(e.target.value)}>
                {cars.map((v) => <option key={v.id} value={v.id}>{`${modelById(v.modelId)!.make} ${modelById(v.modelId)!.model}`}</option>)}
              </select>
            </div>
          )}
          {by === 'car' && driver && (
            <div className="field">
              <label htmlFor="errand-driver">Who Drives</label>
              <select id="errand-driver" value={driven ? 'driver' : 'you'} onChange={(e) => setDriven(e.target.value === 'driver')} title={`${driver.name}: ${driver.perHour !== undefined ? `${formatMoney(Math.round(driver.perHour * 100), driver.currency)} an hour, ${driver.minHours} at least` : `${formatMoney(Math.round((driver.pickup ?? 0) * 100), driver.currency)} to come out and ${formatMoney(Math.round((driver.perKm ?? 0) * 100), driver.currency)} a kilometer`}${driver.tax ? ', and tax' : ''}.`}>
                <option value="you">You</option>
                <option value="driver">{`A Driver From ${driver.name}`}</option>
              </select>
            </div>
          )}
          {friends.length > 0 && (
            <div className="field">
              <span className="small">With</span>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                {friends.map((c) => (
                  <label key={c.id} className="small row gap-1" style={{ alignItems: 'center' }}>
                    <input type="checkbox" checked={passengers.includes(c.id)} onChange={() => setPassengers((a) => (a.includes(c.id) ? a.filter((x) => x !== c.id) : [...a, c.id]))} />{c.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="errand-stop">A Stop</label>
            <select id="errand-stop" value={picked?.key ?? ''} onChange={(e) => setChoice(e.target.value)}>
              {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn-sm btn-ghost" disabled={!picked || stops.length >= 8} onClick={() => picked && setStops([...stops, { kind: picked.kind, payload: picked.payload, leg: picked.leg, label: picked.label }])}>Add The Stop</button>
          <button type="button" className="btn btn-sm" disabled={!go.open || !park.open || !fuel.open || Boolean(no) || Boolean(person.trip)} title={no ?? go.reason ?? park.reason ?? fuel.reason} onClick={() => {
            const r = runErrands(sim, { by, ...(by === 'car' && car ? { vehicleId: car.id } : {}), ...(passengers.length ? { passengerIds: passengers } : {}), ...(withDriver ? { driven: true } : {}), stops }, (kind, payload) => run(kind, payload, { silent: true }));
            if (r.stopped) toast(`Home again after ${r.done} of ${stops.length}: ${stops[r.stopped.step]!.label} couldn’t be done. ${r.stopped.error}`, 'negative');
            else toast(`Home again, all ${stops.length} done.`, 'positive');
            setStops([]);
          }}>Set Out</button>
        </div>
        <div className="small">{stops.length ? stops.map((x, i) => `${i + 1}. ${x.label}`).join('   ') : 'No stops yet.'}</div>
        {/* A stop at a time, the plan changed as you go (from 2026-10-02): each leg and stop the same commands a whole trip runs. */}
        <div className="row gap-1" style={{ flexWrap: 'wrap', alignItems: 'baseline' }}>
          {person.trip && <span className="small">{`Out ${person.trip.by === 'car' ? 'in the car' : 'on foot'}, ${person.trip.km.toFixed(1)} km so far`}</span>}
          <button type="button" className="btn btn-sm btn-ghost" disabled={!go.open || !picked || (!person.trip && Boolean(tripRefusal(sim, person, by, car?.id, passengers, withDriver)))} title={go.reason} onClick={() => {
            if (!picked) return;
            const start = person.trip ? {} : { by, ...(by === 'car' && car ? { vehicleId: car.id } : {}), ...(passengers.length ? { passengerIds: passengers } : {}), ...(withDriver ? { driven: true } : {}) };
            if (!run('errand.go', { to: picked.leg, ...start }).ok) return;
            const before = sim.now;
            const done = run(picked.kind, picked.payload);
            if (sim.player.trip?.by === 'car' && picked.kind !== 'errand.fuel') run('errand.park', { minutes: (sim.now - before) / 60_000 }, { silent: true });
            if (done.ok) toast(`${picked.label}: done.`, 'positive');
          }}>{person.trip ? 'Go To This Stop Next' : 'Go Now, A Stop At A Time'}</button>
          {person.trip && <button type="button" className="btn btn-sm" disabled={!go.open} title={go.reason} onClick={() => { if (run('errand.go', { to: 'home' }).ok) toast('Home again.', 'positive'); }}>Go Home</button>}
        </div>
      </div>
    </Panel>
  );
}
