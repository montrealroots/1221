import { titleCaseLabel } from '@/engine/core/text';
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Empty, Tabs, Modal, MoneyText } from '@/ui/components/primitives';
import { availableParts, serviceEstimate } from '@/engine/systems/vehicles';
import { VEHICLE_MODELS, FACTORY_OPTIONS, PARTS, trimOf, type PartCategory } from '@/engine/content/vehicles';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import type { VehicleListing } from '@/engine/domain/model';

type Tab = 'garage' | 'market' | 'modify' | 'service';

export function VehiclesWorkspace() {
  const { sim, run } = useGame();
  const [tab, setTab] = useState<Tab>('garage');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const owned = useWorld((s) => Object.values(s.universe.vehicles).filter((v) => v.ownerId === s.player.id && !v.soldAt));
  const listings = useWorld((s) => Object.values(s.universe.vehicleListings).filter((l) => l.status === 'active'));
  const selected = owned.find((v) => v.id === selectedId) ?? owned[0];

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Vehicles</div>
        <h1>{owned.length > 0 ? `${owned.length} Vehicle${owned.length === 1 ? '' : 's'}` : 'No Vehicle'}</h1>
        <p className="muted">
          Every car keeps the configuration it left the factory with alongside the one it has now.
          Parts are checked against your exact car before anyone picks up a wrench.
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

      {tab === 'garage' && (
        owned.length === 0 ? (
          <Empty title="Nothing In The Garage" body="Browse what is for sale. You can pay cash, finance or lease." />
        ) : (
          <div className="grid grid-2">
            {owned.map((vehicle) => (
              <Panel
                key={vehicle.id}
                title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                subtitle={`${trimOf(vehicle.catalogId, vehicle.trim)?.name ?? vehicle.trim} · ${vehicle.vin}`}
                actions={<button className="btn btn-sm btn-danger" onClick={() => run('veh.sell', { vehicleId: vehicle.id })}>Sell</button>}
              >
                <div className="grid grid-2" style={{ marginBottom: 'var(--s4)' }}>
                  <Stat label="Value" value={<MoneyText amount={vehicle.currentValue} compact />} note={`Paid ${formatMoneyCompact(vehicle.purchasePrice)}`} />
                  <Stat label="Mileage" value={vehicle.mileage.toLocaleString('en-US')} />
                  <Stat label="Power" value={`${vehicle.horsepower} hp`} note={`0–60 in ${vehicle.zeroToSixty.toFixed(1)}s`} />
                  <Stat label="Acquisition" value={titleCaseLabel(vehicle.acquisition)} />
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

                <div className="row gap-2" style={{ marginTop: 'var(--s3)' }}>
                  <button className="btn btn-sm" onClick={() => { setSelectedId(vehicle.id); setTab('modify'); }}>Modify</button>
                  <button className="btn btn-sm" onClick={() => { setSelectedId(vehicle.id); setTab('service'); }}>Service</button>
                  <button className="btn btn-sm" onClick={() => run('veh.drive', { vehicleId: vehicle.id, miles: 250 })}>Drive 250 miles</button>
                </div>
              </Panel>
            ))}
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
  const { run } = useGame();
  const [buying, setBuying] = useState<string | null>(null);

  return (
    <>
      <Panel title="For Sale" subtitle={`${listings.length} vehicles near you`} flush>
        <div className="list">
          {listings.map((listing) => {
            const [modelId, trimId] = String(listing.catalogId).split(':');
            const model = VEHICLE_MODELS.get(modelId ?? '');
            const trim = trimOf(modelId ?? '', trimId ?? '');
            return (
              <div key={listing.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{listing.year} {model?.make} {model?.name}</div>
                  <div className="xs dim">
                    {trim?.name} · {titleCaseLabel(listing.condition)} · {listing.mileage.toLocaleString('en-US')} miles · {listing.dealerName}
                  </div>
                  <div className="xs dim">
                    {listing.configuration.paint} · {listing.configuration.wheels} · {listing.configuration.interior}
                    {listing.configuration.options.length > 0 &&
                      ` · ${listing.configuration.options.map((o) => FACTORY_OPTIONS.get(o)?.name).filter(Boolean).join(', ')}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono">{formatMoneyCompact(listing.price)}</div>
                  <div className="xs dim">{trim ? `${trim.horsepower} hp` : ''}</div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => setBuying(listing.id)}>Buy</button>
              </div>
            );
          })}
        </div>
      </Panel>

      {buying && (
        <Modal title="Buy This Vehicle" onClose={() => setBuying(null)}>
          <p className="muted small">
            Cash avoids interest. Financing needs your income to support the payment. A lease is cheaper
            monthly and you own nothing at the end.
          </p>
          <div className="col gap-2">
            {(['cash', 'financed', 'leased'] as const).map((method) => (
              <button
                key={method}
                className="btn btn-block"
                onClick={() => {
                  const result = run('veh.purchase', { listingId: buying, acquisition: method, negotiate: true });
                  if (result.ok) setBuying(null);
                }}
              >
                {method === 'cash' ? 'Pay cash (and negotiate)' : method === 'financed' ? 'Finance over 60 months' : 'Lease for 36 months'}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

function ModifyTab({ vehicleId }: { vehicleId: string }) {
  const { sim, run } = useGame();
  const vehicle = sim.universe.vehicles[vehicleId];
  const [category, setCategory] = useState<PartCategory | 'all'>('all');
  const options = useWorld((s) => availableParts(s, vehicleId, category === 'all' ? undefined : category));

  if (!vehicle) return <Empty title="No Vehicle" body="Nothing selected." />;

  const categories = [...new Set(PARTS.all().map((p) => p.category))].sort();

  return (
    <>
      <Panel title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} subtitle="Fitment is checked against make, model, year, trim, powertrain, body and what is already on the car.">
        <div className="row wrap gap-2">
          <button className="chip" aria-pressed={category === 'all'} onClick={() => setCategory('all')}
            style={category === 'all' ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)' } : undefined}>
            all
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
          <Empty title="Nothing Fits" body="No parts in that category are made for this car." />
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
                    {part.effects.zeroToSixty ? <span className="chip chip-positive">{part.effects.zeroToSixty.toFixed(2)}s 0–60</span> : null}
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
                  {verdict.fits ? 'Book' : 'Will not fit'}
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
      <Panel title="Book Service" subtitle={`Next scheduled service due at ${vehicle.nextServiceDueMileage.toLocaleString('en-US')} miles. Currently ${vehicle.mileage.toLocaleString('en-US')}.`} flush>
        <div className="list">
          {kinds.map((kind) => (
            <div key={kind} className="list-item list-static">
              <div className="grow">
                <div className="small strong" style={{ textTransform: 'capitalize' }}>{titleCaseLabel(kind.replace(/_/g, ' '))}</div>
                <div className="xs dim">
                  {kind === 'scheduled' && 'Routine maintenance. Skipping it costs more later.'}
                  {kind === 'repair' && 'Fixing what is wrong. Price rises as mechanical health falls.'}
                  {kind === 'inspection' && 'Required in some jurisdictions before registration renews.'}
                  {kind === 'tires' && 'New rubber. Affects grip and how it drives.'}
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
                  <div className="xs dim">{record.shopName} · {record.mileage.toLocaleString('en-US')} miles</div>
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
