import { titleCaseLabel } from '@/engine/core/text';
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Empty, Tabs, MoneyText } from '@/ui/components/primitives';
import { MAX_CRUISE_HOURS, availableParts, craftOf, hourlyCostOf, profileOf, roadworthy, serviceEstimate, upkeepFor, vehicleKind } from '@/engine/systems/vehicles';
import { activeScene } from '@/engine/systems/scenes';
import { carName, dealershipsIn, fullName, listingKind, lotOf, lotSells, openDeals, roundsLeft } from '@/engine/systems/dealership';
import { KIND_PROFILE, KINDS, REAL_MAKE_NOTE, VEHICLE_MODELS, FACTORY_OPTIONS, PARTS, bodyStyleLabel, trimOf, type PartCategory, type VehicleKind } from '@/engine/content/vehicles';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import type { Vehicle, VehicleListing } from '@/engine/domain/model';

/** How many hours a day on the water is, from the garage card. */
const DAY_ON_THE_WATER = Math.min(6, MAX_CRUISE_HOURS);

function usageLabel(vehicle: Pick<Vehicle, 'kind' | 'catalogId' | 'mileage'>): string {
  const profile = profileOf(vehicle);
  return `${vehicle.mileage.toLocaleString('en-US')} ${profile.unit}`;
}

type Tab = 'garage' | 'market' | 'modify' | 'service';

export function VehiclesWorkspace() {
  const { sim, run, navigate } = useGame();
  const [tab, setTab] = useState<Tab>('garage');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const owned = useWorld((s) => Object.values(s.universe.vehicles)
    .filter((v) => v.ownerId === s.player.id && !v.soldAt)
    .sort((a, b) => KINDS.indexOf(vehicleKind(a)) - KINDS.indexOf(vehicleKind(b)) || b.currentValue - a.currentValue));
  const listings = useWorld((s) => Object.values(s.universe.vehicleListings).filter((l) => l.status === 'active'));
  const deals = useWorld((s) => openDeals(s));
  const scene = useWorld((s) => activeScene(s));
  const selected = owned.find((v) => v.id === selectedId) ?? owned[0];

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Vehicles</div>
        <h1>{owned.length > 0 ? `${owned.length} Vehicle${owned.length === 1 ? '' : 's'}` : 'No Vehicle'}</h1>
        <p className="muted">
          Cars, motorcycles, boats and aircraft. Each keeps the configuration it left the factory with alongside the one it has now,
          and parts are checked against exactly what you own before anyone picks up a wrench. {REAL_MAKE_NOTE}
        </p>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'garage', label: 'Garage', badge: owned.length },
          { id: 'market', label: 'For Sale', badge: listings.length },
          { id: 'modify', label: 'Modify' },
          { id: 'service', label: 'Service' },
        ]}
      />

      {tab === 'garage' && deals.length > 0 && (
        <Panel title="On The Table" subtitle="Conversations you have not finished. A deal holds for a week; an agreed price for as long as it says." flush>
          <div className="list">
            {deals.map((deal) => {
              const listing = sim.universe.vehicleListings[deal.listingId];
              const lot = dealershipsIn(sim).find((l) => l.id === deal.dealerPlaceId);
              const seller = sim.universe.people[deal.salespersonId];
              return (
                <div key={deal.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{listing ? carName(listing) : 'A car that has gone'}</div>
                    <div className="xs dim">
                      {deal.status === 'agreed' ? `Agreed at ${formatMoney(deal.agreedPrice ?? deal.currentAsk)}` : `Their number is ${formatMoney(deal.currentAsk)} · ${roundsLeft(deal)} round${roundsLeft(deal) === 1 ? '' : 's'} left`}
                      {lot ? ` · ${lot.name}` : ''}{seller ? ` · ${seller.displayName}` : ''} · until {formatDate(deal.expiresAt, sim.zone)}
                    </div>
                  </div>
                  <div className="row gap-1 wrap" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm btn-primary" disabled={Boolean(scene) || !lot} onClick={() => run('scene.start', { definitionId: 'vehicles.dealer', input: { placeId: deal.dealerPlaceId, dealId: deal.id } })}>
                      Back To The Dealer
                    </button>
                    <button className="btn btn-sm" onClick={() => run('deal.walk_away', { dealId: deal.id })}>Let It Go</button>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {tab === 'garage' && (
        owned.length === 0 ? (
          <Empty title="Nothing In The Garage" body="Browse what is for sale: cars, motorcycles, boats and aircraft. You can pay cash, finance or lease." />
        ) : (
          <div className="grid grid-2">
            {owned.map((vehicle) => {
              const kind = vehicleKind(vehicle);
              const profile = KIND_PROFILE[kind];
              const craft = craftOf(sim, vehicle);
              const upkeep = upkeepFor(sim, vehicle);
              const hourly = hourlyCostOf(sim, vehicle);
              return (
              <Panel
                key={vehicle.id}
                title={fullName(vehicle.year, vehicle.make, vehicle.model)}
                subtitle={`${profile.label} · ${trimOf(vehicle.catalogId, vehicle.trim)?.name ?? vehicle.trim} · ${vehicle.vin}${vehicle.deliveryDueAt ? ` · Arriving ${formatDate(vehicle.deliveryDueAt, sim.zone)}` : ''}`}
                actions={vehicle.deliveryDueAt
                  ? <span className="chip chip-accent">On Its Way</span>
                  : <button className="btn btn-sm btn-danger" onClick={() => run('veh.sell', { vehicleId: vehicle.id })}>Sell</button>}
              >
                <div className="grid grid-2" style={{ marginBottom: 'var(--s4)' }}>
                  <Stat label="Value" value={<MoneyText amount={vehicle.currentValue} compact />} note={`Paid ${formatMoneyCompact(vehicle.purchasePrice)}`} />
                  <Stat label={profile.unitLabel} value={vehicle.mileage.toLocaleString('en-US')} />
                  {kind === 'car' && <Stat label="Power" value={`${vehicle.horsepower} hp`} note={`0–60 in ${vehicle.zeroToSixty.toFixed(1)}s`} />}
                  {kind === 'motorcycle' && <Stat label="Power" value={`${vehicle.horsepower} hp`} note={`0–60 in ${vehicle.zeroToSixty.toFixed(1)}s${craft?.topSpeed ? ` · ${craft.topSpeed} mph` : ''}`} />}
                  {kind === 'boat' && <Stat label="Length" value={`${craft?.lengthFeet ?? '—'} ft`} note={`${vehicle.horsepower} hp${craft?.topSpeed ? ` · ${craft.topSpeed} knots` : ''}${craft?.berths ? ` · ${craft.berths} berths` : ''}`} />}
                  {kind === 'jet' && <Stat label="Range" value={`${(craft?.rangeKm ?? 0).toLocaleString('en-US')} km`} note={`${craft?.seats ?? '—'} seats · needs ${(craft?.runwayFeet ?? 0).toLocaleString('en-US')} ft`} />}
                  {upkeep > 0
                    ? <Stat label={kind === 'boat' ? 'Berth' : 'Hangar And Crew'} value={`${formatMoney(upkeep, { cents: false })} a month`} note={hourly > 0 ? `${formatMoney(hourly, { cents: false })} an hour under way` : undefined} />
                    : <Stat label="Acquisition" value={titleCaseLabel(vehicle.acquisition)} />}
                </div>
                <div className="col gap-3">
                  <Meter label="Condition" value={vehicle.condition} />
                  <Meter label="Mechanical Health" value={vehicle.mechanicalHealth} hint="Falls without service. Repairs get expensive when it is low." />
                </div>

                <hr className="divider" />
                <div className="xs dim">
                  Registration expires {formatDate(vehicle.registrationExpiresAt, sim.homeZone)}
                  {vehicle.warranty.voided
                    ? <span className="negative"> · warranty voided: {vehicle.warranty.voidReason}</span>
                    : vehicle.warranty.bumperToBumperUntil
                      ? ` · under warranty until ${formatDate(vehicle.warranty.bumperToBumperUntil, sim.homeZone)}`
                      : ' · out of warranty'}
                </div>

                {vehicle.currentConfiguration.modificationIds.length > 0 && (
                  <div className="row wrap gap-1" style={{ marginTop: 'var(--s3)' }}>
                    {vehicle.currentConfiguration.modificationIds.map((id) => {
                      const mod = sim.universe.vehicleModifications[id];
                      if (!mod || mod.removedAt) return null;
                      return (
                        <span key={id} className={`chip ${mod.streetLegal ? '' : 'chip-negative'}`}>
                          {mod.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="row gap-2 wrap" style={{ marginTop: 'var(--s3)' }}>
                  <button className="btn btn-sm" onClick={() => { setSelectedId(vehicle.id); setTab('modify'); }}>Modify</button>
                  <button className="btn btn-sm" onClick={() => { setSelectedId(vehicle.id); setTab('service'); }}>Service</button>
                  {kind === 'car' && <button className="btn btn-sm" disabled={Boolean(vehicle.deliveryDueAt)} title={vehicle.deliveryDueAt ? 'Not delivered yet.' : undefined} onClick={() => run('veh.drive', { vehicleId: vehicle.id, miles: 250 })}>Drive 250 Miles</button>}
                  {kind === 'motorcycle' && <button className="btn btn-sm" disabled={Boolean(vehicle.deliveryDueAt)} title={vehicle.deliveryDueAt ? 'Not delivered yet.' : undefined} onClick={() => run('veh.drive', { vehicleId: vehicle.id, miles: 150 })}>Ride 150 Miles</button>}
                  {kind === 'boat' && <button className="btn btn-sm" disabled={Boolean(vehicle.deliveryDueAt)} title={vehicle.deliveryDueAt ? 'Not delivered yet.' : `${DAY_ON_THE_WATER} hours out and back, about ${formatMoney(hourly * DAY_ON_THE_WATER, { cents: false })} in fuel.`} onClick={() => run('veh.cruise', { vehicleId: vehicle.id, hours: DAY_ON_THE_WATER })}>A Day On The Water</button>}
                  {kind === 'jet' && <button className="btn btn-sm" disabled={Boolean(vehicle.deliveryDueAt)} title={vehicle.deliveryDueAt ? 'Not delivered yet.' : 'Pick a destination on the Private tab of Travel.'} onClick={() => navigate('/workspace/travel', 'Travel')}>Fly It</button>}
                </div>
              </Panel>
              );
            })}
          </div>
        )
      )}

      {tab === 'market' && <MarketTab listings={listings} />}

      {tab === 'modify' && (
        selected ? <ModifyTab vehicleId={selected.id} /> : <Empty title="No Vehicle" body="Buy something first." />
      )}

      {tab === 'service' && (
        selected ? <ServiceTab vehicleId={selected.id} /> : <Empty title="No Vehicle" body="Buy something first." />
      )}
    </>
  );
}

function MarketTab({ listings }: { listings: VehicleListing[] }) {
  const { sim, run } = useGame();
  const scene = useWorld((s) => activeScene(s));
  const lots = useWorld((s) => dealershipsIn(s));
  const elsewhere = listings.filter((l) => !lots.some((lot) => lot.id === lotOf(l)));

  const row = (listing: VehicleListing, lotId?: string) => {
    const [modelId, trimId] = String(listing.catalogId).split(':');
    const model = VEHICLE_MODELS.get(modelId ?? '');
    const trim = trimOf(modelId ?? '', trimId ?? '');
    const kind = listingKind(listing);
    const craft = trim?.craft;
    const figures = kind === 'boat'
      ? `${craft?.lengthFeet ?? '—'} ft · ${craft?.topSpeed ?? '—'} knots`
      : kind === 'jet'
        ? `${craft?.seats ?? '—'} seats · ${(craft?.rangeKm ?? 0).toLocaleString('en-US')} km`
        : trim ? `${trim.horsepower} hp` : '';
    return (
      <div key={listing.id} className="list-item list-static">
        <div className="grow">
          <div className="small strong">{fullName(listing.year, model?.make ?? '', model?.name ?? '')}</div>
          <div className="xs dim">
            {trim?.name} · {titleCaseLabel(listing.condition)} · {model ? bodyStyleLabel(model.bodyStyle) : ''} · {usageLabel({ kind, catalogId: modelId ?? '', mileage: listing.mileage })}
          </div>
          <div className="xs dim">
            {listing.configuration.paint} · {listing.configuration.wheels} · {listing.configuration.interior}
            {listing.configuration.options.length > 0 &&
              ` · ${listing.configuration.options.map((o) => FACTORY_OPTIONS.get(o)?.name).filter(Boolean).join(', ')}`}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono">{formatMoneyCompact(listing.price)}</div>
          <div className="xs dim">{figures}</div>
        </div>
        {lotId ? (
          <div className="row gap-1 wrap" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'vehicles.dealer', input: { placeId: lotId, listingId: listing.id } })}>
              Go And See It
            </button>
            <button className="btn btn-sm" disabled={Boolean(scene)} title="The short version: one look, one offer, their counter, cash, collect." onClick={() => run('scene.quick', { definitionId: 'vehicles.dealer', input: { placeId: lotId, listingId: listing.id } })}>
              Just Buy It
            </button>
          </div>
        ) : <span className="xs dim">Not in this city</span>}
      </div>
    );
  };

  return (
    <>
      {lots.map((lot) => {
        const cars = listings.filter((l) => lotOf(l) === lot.id).sort((a, b) => a.price - b.price);
        const sells = KIND_PROFILE[lotSells(lot)];
        return (
          <Panel key={lot.id} title={lot.name} subtitle={`${lot.about} ${cars.length} ${cars.length === 1 ? sells.label.toLowerCase() : sells.plural.toLowerCase()} on the lot.`} flush>
            {cars.length === 0
              ? <Empty title="Nothing On The Lot" body="Stock comes in every couple of weeks." />
              : <div className="list">{cars.map((l) => row(l, lot.id))}</div>}
          </Panel>
        );
      })}
      {elsewhere.length > 0 && (
        <Panel title="Elsewhere" subtitle="Listed in another city. Go there to see them." flush>
          <div className="list">{elsewhere.map((l) => row(l))}</div>
        </Panel>
      )}
      <p className="xs dim">
        Prices on the windscreen are SLATE’s calibration against the city, not a quote from anybody; every one is a starting point. {sim.player.currentPlaceId ? '' : 'Going to see one takes you there.'}
      </p>
    </>
  );
}

function ModifyTab({ vehicleId }: { vehicleId: string }) {
  const { sim, run } = useGame();
  const vehicle = sim.universe.vehicles[vehicleId];
  const [category, setCategory] = useState<PartCategory | 'all'>('all');
  const options = useWorld((s) => availableParts(s, vehicleId, category === 'all' ? undefined : category));

  if (!vehicle) return <Empty title="No Vehicle" body="Nothing selected." />;

  const kind: VehicleKind = vehicleKind(vehicle);
  const categories = [...new Set(PARTS.all().filter((p) => (p.fitment.kinds ?? ['car']).includes(kind)).map((p) => p.category))].sort();

  return (
    <>
      <Panel title={fullName(vehicle.year, vehicle.make, vehicle.model)} subtitle={`Fitment is checked against make, model, year, trim, powertrain, body and what is already on it. What goes on a ${KIND_PROFILE[kind].label.toLowerCase()} is a ${KIND_PROFILE[kind].label.toLowerCase()}'s to have.`}>
        <div className="row wrap gap-2">
          <button className="chip" aria-pressed={category === 'all'} onClick={() => setCategory('all')}
            style={category === 'all' ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)' } : undefined}>
            All
          </button>
          {categories.map((c) => (
            <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}
              style={category === c ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)' } : undefined}>
              {titleCaseLabel(c.replace(/_/g, ' '))}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Parts" flush>
        {options.length === 0 ? (
          <Empty title="Nothing Fits" body="No parts in that category are made for this one." />
        ) : (
          <div className="list">
            {options.map(({ part, verdict }) => (
              <div key={part.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{part.name}</div>
                  <div className="xs dim">{part.brand} · {titleCaseLabel(part.category.replace(/_/g, ' '))} · {part.labourHours}h labour</div>
                  <div className="xs muted" style={{ marginTop: 2 }}>{part.description}</div>
                  {!verdict.fits && (
                    <div className="xs negative" style={{ marginTop: 2 }}>{verdict.reasons.join(' ')}</div>
                  )}
                  {verdict.fits && verdict.warnings.length > 0 && (
                    <div className="xs warning" style={{ marginTop: 2 }}>{verdict.warnings.join(' ')}</div>
                  )}
                  <div className="row wrap gap-1" style={{ marginTop: 4 }}>
                    {part.effects.horsepower ? <span className="chip chip-positive">+{part.effects.horsepower} hp</span> : null}
                    {part.effects.zeroToSixty && roadworthy(vehicle) ? <span className="chip chip-positive">{part.effects.zeroToSixty.toFixed(2)}s 0–60</span> : null}
                    {part.effects.topSpeed ? <span className="chip chip-positive">{part.effects.topSpeed > 0 ? '+' : ''}{part.effects.topSpeed} {kind === 'boat' ? 'knots' : 'mph'}</span> : null}
                    {part.effects.rangeKm ? <span className="chip chip-positive">+{part.effects.rangeKm.toLocaleString('en-US')} km range</span> : null}
                    {!part.streetLegal && <span className="chip chip-negative">Not Street Legal</span>}
                    {part.voidsWarranty && <span className="chip chip-warning">Voids Warranty</span>}
                    {part.insuranceRelevant && <span className="chip chip-info">Tell Your Insurer</span>}
                  </div>
                </div>
                <span className="mono small">{formatMoney(part.price, { cents: false })}</span>
                <button
                  className="btn btn-sm"
                  disabled={!verdict.fits}
                  onClick={() => run('veh.book_modification', { vehicleId, partIds: [part.id] })}
                >
                  {verdict.fits ? 'Book' : 'Will Not Fit'}
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

function ServiceTab({ vehicleId }: { vehicleId: string }) {
  const { sim, run } = useGame();
  const vehicle = sim.universe.vehicles[vehicleId];
  const records = useWorld((s) => Object.values(s.universe.serviceRecords)
    .filter((r) => r.vehicleId === vehicleId)
    .sort((a, b) => b.performedAt - a.performedAt));

  if (!vehicle) return <Empty title="No Vehicle" body="Nothing selected." />;

  const kinds = ['scheduled', 'repair', 'inspection', 'tires', 'detail', 'bodywork'] as const;

  return (
    <>
      <Panel title="Book Service" subtitle={`Next scheduled service due at ${vehicle.nextServiceDueMileage.toLocaleString('en-US')} ${profileOf(vehicle).unit}. Currently ${vehicle.mileage.toLocaleString('en-US')}.`} flush>
        <div className="list">
          {kinds.map((kind) => (
            <div key={kind} className="list-item list-static">
              <div className="grow">
                <div className="small strong" style={{ textTransform: 'capitalize' }}>{titleCaseLabel(kind.replace(/_/g, ' '))}</div>
                <div className="xs dim">
                  {kind === 'scheduled' && 'Routine maintenance. Skipping it costs more later.'}
                  {kind === 'repair' && 'Fixing what is wrong. Price rises as mechanical health falls.'}
                  {kind === 'inspection' && 'Required in some jurisdictions before registration renews.'}
                  {kind === 'tires' && (vehicleKind(vehicle) === 'boat' ? 'Propellers and running gear. Affects speed and how it handles.' : vehicleKind(vehicle) === 'jet' ? 'Tyres and brakes. Aircraft go through them.' : 'New rubber. Affects grip and how it drives.')}
                  {kind === 'detail' && 'Cosmetic. Lifts condition and resale.'}
                  {kind === 'bodywork' && 'Paint and panel. Expensive and worth it before selling.'}
                </div>
              </div>
              <span className="mono small">about {formatMoney(serviceEstimate(sim, vehicle, kind), { cents: false })}</span>
              <button className="btn btn-sm" onClick={() => run('veh.book_service', { vehicleId, kind })}>Book</button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Service History" flush>
        {records.length === 0 ? (
          <Empty title="No History" body="A documented service history is worth real money at resale." />
        ) : (
          <div className="list">
            {records.map((record) => (
              <div key={record.id} className="list-item list-static">
                <span className="xs dim nowrap" style={{ minWidth: 100 }}>{formatDate(record.performedAt, sim.homeZone)}</span>
                <div className="grow">
                  <div className="small">{record.description}</div>
                  <div className="xs dim">{record.shopName} · {record.mileage.toLocaleString('en-US')} {profileOf(vehicle).unit}</div>
                </div>
                <span className="mono small">
                  {record.coveredByWarranty ? <span className="positive">Warranty</span> : formatMoney(record.cost)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
