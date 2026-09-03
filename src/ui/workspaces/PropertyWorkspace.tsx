import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Empty, Tabs, Modal, MoneyText } from '@/ui/components/primitives';
import { propertyQuality, DESIGN_THEMES, CONSTRUCTION_PHASES } from '@/engine/systems/property';
import { CITIES, NEIGHBOURHOODS } from '@/engine/content/geography';
import { CATALOG } from '@/engine/content/catalog';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import type { ConstructionPhase, ConstructionProject } from '@/engine/domain/model';
import { formatDate } from '@/engine/core/time';

type Tab = 'owned' | 'market' | 'offers' | 'build' | 'interiors';

export function PropertyWorkspace() {
  const { sim, run } = useGame();
  const [tab, setTab] = useState<Tab>('owned');

  const owned = useWorld((s) => Object.values(s.universe.properties)
    .filter((p) => p.ownerId === s.player.id && !p.soldAt || p.id === s.player.residenceId));
  const listings = useWorld((s) => Object.values(s.universe.propertyListings)
    .filter((l) => l.status === 'active')
    .map((l) => ({ listing: l, property: s.universe.properties[l.propertyId] }))
    .filter((entry) => entry.property));
  const offers = useWorld((s) => Object.values(s.universe.propertyOffers)
    .filter((o) => o.buyerId === s.player.id)
    .sort((a, b) => b.submittedAt - a.submittedAt));
  const builds = useWorld((s) => Object.values(s.universe.constructionProjects)
    .filter((b) => b.ownerId === s.player.id));

  const [offerFor, setOfferFor] = useState<string | null>(null);

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Property</div>
        <h1>{owned.length > 0 ? `${owned.length} propert${owned.length === 1 ? 'y' : 'ies'}` : 'No property yet'}</h1>
        <p className="muted">
          Rent, buy, build from raw land, and design the inside. Buying is showings, offers, counters,
          an inspection, an appraisal and a closing.
        </p>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'owned', label: 'Yours', badge: owned.length },
          { id: 'market', label: 'For Sale', badge: listings.length },
          { id: 'offers', label: 'Offers', badge: offers.filter((o) => ['submitted', 'countered', 'accepted'].includes(o.status)).length },
          { id: 'build', label: 'Build', badge: builds.length },
          { id: 'interiors', label: 'Interiors' },
        ]}
      />

      {tab === 'owned' && (
        owned.length === 0 ? (
          <Empty title="Nowhere Of Your Own" body="Rent something from the market, or buy land and build." />
        ) : (
          <div className="grid grid-2">
            {owned.map((property) => (
              <Panel
                key={property.id}
                title={property.addressLine}
                subtitle={`${property.kind.replace(/_/g, ' ')} · ${CITIES.get(property.locationId)?.name}${property.neighbourhoodId ? ` · ${NEIGHBOURHOODS.get(property.neighbourhoodId)?.name}` : ''}`}
                actions={
                  property.ownerId === sim.player.id ? (
                    <button
                      className="btn btn-sm"
                      onClick={() => run('prop.list_for_sale', { propertyId: property.id, askingPrice: property.marketValue })}
                    >
                      List for sale
                    </button>
                  ) : undefined
                }
              >
                <div className="grid grid-2" style={{ marginBottom: 'var(--s4)' }}>
                  <Stat label="Tenure" value={property.tenure} />
                  <Stat label="Value" value={<MoneyText amount={property.marketValue} compact />} />
                  <Stat label="Size" value={`${property.interiorSqft.toLocaleString('en-US')} sq ft`} note={`${property.bedrooms} bed · ${property.bathrooms} bath`} />
                  {property.monthlyRent && property.tenure === 'rented' && (
                    <Stat label="Rent" value={<span className="mono">{formatMoney(property.monthlyRent)}/mo</span>} />
                  )}
                </div>
                <div className="col gap-3">
                  <Meter label="Condition" value={property.condition} hint="Decays slowly without maintenance." />
                  <Meter label="Living Quality" value={propertyQuality(sim, property.id)} hint="Feeds how well you sleep and how you feel." />
                </div>
                {property.features.length > 0 && (
                  <div className="row wrap gap-1" style={{ marginTop: 'var(--s3)' }}>
                    {property.features.map((f) => <span key={f} className="chip">{f}</span>)}
                  </div>
                )}
              </Panel>
            ))}
          </div>
        )
      )}

      {tab === 'market' && (
        <Panel title="On The Market" subtitle={`${listings.length} listings where you are`} flush>
          {listings.length === 0 ? (
            <Empty title="Nothing Listed" body="New listings appear every ten days." />
          ) : (
            <div className="list">
              {listings.map(({ listing, property }) => property && (
                <div key={listing.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{property.addressLine}</div>
                    <div className="xs dim">
                      {property.kind.replace(/_/g, ' ')} · {property.bedrooms} bed · {property.interiorSqft.toLocaleString('en-US')} sq ft
                      {property.neighbourhoodId && ` · ${NEIGHBOURHOODS.get(property.neighbourhoodId)?.name}`}
                      {' · '}{listing.daysOnMarket} days on market
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono">{formatMoneyCompact(listing.askingPrice)}</div>
                    {property.monthlyRent && (
                      <div className="xs dim">or {formatMoney(property.monthlyRent)}/mo</div>
                    )}
                  </div>
                  <div className="row gap-1">
                    {property.monthlyRent && (
                      <button className="btn btn-sm" onClick={() => run('prop.rent', { propertyId: property.id, months: 12 })}>
                        Rent
                      </button>
                    )}
                    <button className="btn btn-sm btn-primary" onClick={() => setOfferFor(listing.id)}>Offer</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === 'offers' && (
        <Panel title="Your Offers" flush>
          {offers.length === 0 ? (
            <Empty title="No Offers Out" body="Find something on the market and make one." />
          ) : (
            <div className="list">
              {offers.map((offer) => {
                const property = sim.universe.properties[offer.propertyId];
                return (
                  <div key={offer.id} className="list-item list-static" style={{ display: 'block' }}>
                    <div className="row-between">
                      <div className="grow">
                        <div className="small strong">{property?.addressLine}</div>
                        <div className="xs dim">
                          Offered {formatMoney(offer.amount)} · {offer.financingKind} · {offer.contingencies.join(', ') || 'no contingencies'}
                        </div>
                      </div>
                      <span className={`chip ${offer.status === 'closed' ? 'chip-positive' : offer.status === 'rejected' ? 'chip-negative' : ''}`}>
                        {offer.status}
                      </span>
                    </div>

                    {offer.status === 'countered' && (
                      <div className="callout callout-warning" style={{ marginTop: 'var(--s2)' }}>
                        They came back at {formatMoney(offer.counterAmount ?? 0)}.
                        <div className="row gap-2" style={{ marginTop: 'var(--s2)' }}>
                          <button className="btn btn-sm btn-primary" onClick={() => run('prop.respond_to_counter', { offerId: offer.id, accept: true })}>Accept</button>
                          <button className="btn btn-sm" onClick={() => run('prop.respond_to_counter', { offerId: offer.id, accept: false })}>Walk away</button>
                        </div>
                      </div>
                    )}

                    {offer.inspectionFindings && offer.inspectionFindings.length > 0 && (
                      <div className="callout" style={{ marginTop: 'var(--s2)' }}>
                        <strong className="small">Inspection found:</strong>
                        <ul className="xs" style={{ margin: '4px 0 0', paddingLeft: 'var(--s4)' }}>
                          {offer.inspectionFindings.map((finding, i) => (
                            <li key={i}>
                              {finding.item} — {finding.severity}, about {formatMoney(finding.estimate, { cents: false })}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="xs dim" style={{ marginTop: 'var(--s2)' }}>
                      {offer.history.slice(-3).map((entry, i) => (
                        <div key={i}>{formatDate(entry.at, sim.homeZone)} — {entry.note}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === 'build' && <BuildTab builds={builds} />}

      {tab === 'interiors' && <InteriorsTab />}

      {offerFor && <OfferDialog listingId={offerFor} onClose={() => setOfferFor(null)} />}
    </>
  );
}

function OfferDialog({ listingId, onClose }: { listingId: string; onClose: () => void }) {
  const { sim, run } = useGame();
  const listing = sim.universe.propertyListings[listingId];
  const property = listing ? sim.universe.properties[listing.propertyId] : undefined;
  const [amount, setAmount] = useState(listing ? Math.round(listing.askingPrice / 100) : 0);
  const [financing, setFinancing] = useState<'cash' | 'conventional'>('conventional');
  const [contingencies, setContingencies] = useState<string[]>(['inspection', 'financing', 'appraisal']);

  if (!listing || !property) return null;

  const submit = () => {
    const result = run('prop.make_offer', {
      listingId,
      amount: amount * 100,
      financingKind: financing,
      contingencies,
    });
    if (result.ok) onClose();
  };

  const ratio = (amount * 100) / listing.askingPrice;

  return (
    <Modal
      title={`Offer on ${property.addressLine}`}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Submit Offer</button></>}
    >
      <div className="grid grid-2" style={{ marginBottom: 'var(--s4)' }}>
        <Stat label="Asking" value={<span className="mono">{formatMoney(listing.askingPrice, { cents: false })}</span>} />
        <Stat label="Days On Market" value={listing.daysOnMarket} note="Longer means more flexible" />
      </div>

      <div className="field">
        <label htmlFor="amount">Your offer</label>
        <input id="amount" type="number" step={1000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <p className={`xs ${ratio < 0.9 ? 'negative' : ratio > 1 ? 'positive' : 'dim'}`} style={{ marginTop: 4 }}>
          {Math.round(ratio * 100)}% of asking.
          {ratio < 0.88 && ' Low enough that they may simply reject it.'}
        </p>
      </div>

      <div className="field">
        <label htmlFor="financing">How you are paying</label>
        <select id="financing" value={financing} onChange={(e) => setFinancing(e.target.value as 'cash' | 'conventional')}>
          <option value="conventional">Financed — 20% down, subject to a lender</option>
          <option value="cash">Cash — no financing risk, and sellers know it</option>
        </select>
      </div>

      <div className="field">
        <label>Contingencies</label>
        {['inspection', 'financing', 'appraisal'].map((item) => (
          <label key={item} className="row gap-2" style={{ marginBottom: 4 }}>
            <input
              type="checkbox" style={{ width: 'auto' }}
              checked={contingencies.includes(item)}
              onChange={(e) => setContingencies((c) => e.target.checked ? [...c, item] : c.filter((x) => x !== item))}
            />
            <span className="small" style={{ color: 'var(--text)' }}>{item}</span>
          </label>
        ))}
        <p className="xs dim">Each one protects you and makes the offer slightly less attractive.</p>
      </div>
    </Modal>
  );
}

function BuildTab({ builds }: { builds: ConstructionProject[] }) {
  const { sim, run } = useGame();
  const [open, setOpen] = useState(false);
  const land = useWorld((s) => Object.values(s.universe.properties)
    .filter((p) => p.ownerId === s.player.id && p.kind === 'land' && p.tenure !== 'under_construction'));

  return (
    <>
      <Panel
        title="Construction"
        subtitle="Land, concept, architect, design, plans, zoning, permits, bids, contracts, then twenty phases of actual building."
        actions={<button className="btn btn-sm btn-primary" disabled={land.length === 0} onClick={() => setOpen(true)}>Start a build</button>}
        flush
      >
        {builds.length === 0 ? (
          <Empty
            title="Nothing Under Construction"
            body={land.length === 0
              ? 'You need to own a parcel of land first. Vacant lots appear in the market listings.'
              : 'You own land. Start a build on it.'}
          />
        ) : (
          <div className="list">
            {builds.map((project) => {
              const phases = project.phaseIds
                .map((id) => sim.universe.constructionPhases[id])
                .filter((p): p is ConstructionPhase => Boolean(p));
              const complete = phases.filter((p) => p.status === 'complete').length;
              return (
                <div key={project.id} className="list-item list-static" style={{ display: 'block' }}>
                  <div className="row-between" style={{ marginBottom: 'var(--s2)' }}>
                    <div>
                      <div className="small strong">{project.name}</div>
                      <div className="xs dim">
                        {project.architectName} · {project.generalContractor} · target {formatDate(project.targetCompletionAt, sim.homeZone)}
                      </div>
                    </div>
                    <span className="chip">{project.status}</span>
                  </div>

                  <div className="grid grid-4" style={{ marginBottom: 'var(--s3)' }}>
                    <Stat label="Budget" value={formatMoneyCompact(project.budget)} />
                    <Stat label="Spent" value={formatMoneyCompact(project.spent)} tone={project.spent > project.budget ? 'negative' : undefined} />
                    <Stat label="Phases" value={`${complete} / ${phases.length}`} />
                    <Stat label="Contingency" value={formatMoneyCompact(project.contingency)} />
                  </div>

                  <Meter label="Progress" value={(complete / Math.max(1, phases.length)) * 100} />

                  <details style={{ marginTop: 'var(--s3)' }}>
                    <summary className="small" style={{ cursor: 'pointer' }}>Phase Detail</summary>
                    <div className="table-scroll" style={{ marginTop: 'var(--s2)' }}>
                      <table>
                        <thead><tr><th>Phase</th><th>Status</th><th className="num">Days</th><th className="num">Spent</th></tr></thead>
                        <tbody>
                          {phases.map((phase) => (
                            <tr key={phase.id}>
                              <td className="small">{phase.name}</td>
                              <td className="xs">
                                <span className={`chip ${phase.status === 'complete' ? 'chip-positive' : phase.status === 'failed_inspection' ? 'chip-negative' : ''}`}>
                                  {phase.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="num xs mono">{phase.actualDays} / {phase.plannedDays}</td>
                              <td className="num xs mono">{formatMoneyCompact(phase.spent)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {open && (
        <Modal
          title="Start A Build"
          onClose={() => setOpen(false)}
          footer={<button className="btn" onClick={() => setOpen(false)}>Close</button>}
        >
          <p className="muted small">
            A build runs {CONSTRUCTION_PHASES.length} phases in dependency order. Insulation waits for
            mechanical, electrical, plumbing and envelope. Inspectors can fail you. Contractors raise
            change orders you have to decide on.
          </p>
          {land.map((parcel) => (
            <div key={parcel.id} className="card card-tight" style={{ marginBottom: 'var(--s3)' }}>
              <div className="row-between">
                <div>
                  <div className="small strong">{parcel.addressLine}</div>
                  <div className="xs dim">{parcel.lotSqft.toLocaleString('en-US')} sq ft lot</div>
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    run('build.start', {
                      propertyId: parcel.id,
                      name: `House on ${parcel.addressLine}`,
                      budget: 120_000_000,
                      structures: [
                        { kind: 'main_house', sqft: 3200, floors: 2 },
                        { kind: 'garage', sqft: 620, floors: 1 },
                      ],
                    });
                    setOpen(false);
                  }}
                >
                  Build here
                </button>
              </div>
            </div>
          ))}
        </Modal>
      )}
    </>
  );
}

function InteriorsTab() {
  const { run } = useGame();
  const rooms = useWorld((s) => Object.values(s.universe.rooms).map((room) => {
    const structure = s.universe.structures[room.structureId];
    const property = structure ? s.universe.properties[structure.propertyId] : undefined;
    return { room, property };
  }).filter((entry) => entry.property?.ownerId === s.player.id || entry.property?.id === s.player.residenceId));

  const furnishings = CATALOG.all().filter((item) => item.qualityContribution !== undefined);

  return (
    <>
      <Panel title="Rooms" subtitle="Property, structure, floor, room, zone. Every furnishing you buy becomes a real owned asset." flush>
        {rooms.length === 0 ? (
          <Empty title="No Rooms" body="Rooms exist once you own or rent somewhere with an interior." />
        ) : (
          <div className="list">
            {rooms.map(({ room, property }) => (
              <div key={room.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{room.name}</div>
                  <div className="xs dim">
                    {property?.addressLine} · {room.kind} · {room.sqft} sq ft
                    {room.themeId && ` · ${DESIGN_THEMES.find((t) => t.id === room.themeId)?.name}`}
                  </div>
                </div>
                <div style={{ width: 120 }}>
                  <Meter label="Quality" value={room.quality} />
                </div>
                <select
                  aria-label={`Theme for ${room.name}`}
                  value={room.themeId ?? ''}
                  style={{ width: 150 }}
                  onChange={(e) => run('prop.finish_room', { roomId: room.id, themeId: e.target.value, walls: 'Painted', floor: 'Oak' })}
                >
                  <option value="">Choose a theme…</option>
                  {DESIGN_THEMES.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Furnish" subtitle="Bought pieces raise the quality of the room they go in." flush>
        <div className="list">
          {furnishings.map((item) => (
            <div key={item.id} className="list-item list-static">
              <div className="grow">
                <div className="small strong">{item.name}</div>
                <div className="xs dim">{item.brand} · quality {item.quality} · adds {item.qualityContribution} to a room</div>
              </div>
              <span className="mono small">{formatMoney(item.basePrice, { cents: false })}</span>
              <select
                aria-label={`Place ${item.name}`}
                style={{ width: 170 }}
                defaultValue=""
                onChange={(e) => {
                  const roomId = e.target.value;
                  if (!roomId) return;
                  const entry = rooms.find((r) => r.room.id === roomId);
                  if (!entry?.property) return;
                  run('prop.buy_furnishing', { catalogId: item.id, roomId, propertyId: entry.property.id });
                  e.target.value = '';
                }}
              >
                <option value="">Buy and place in…</option>
                {rooms
                  .filter(({ room }) => !item.roomKinds || item.roomKinds.length === 0 || item.roomKinds.includes(room.kind))
                  .map(({ room }) => <option key={room.id} value={room.id}>{room.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
