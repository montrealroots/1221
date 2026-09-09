import { titleCaseLabel } from '@/engine/core/text';
import { dockFeetOf, garageSpacesOf, hasDriveway } from '@/engine/systems/storage';
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Empty, Tabs, Modal, MoneyText } from '@/ui/components/primitives';
import { propertyQuality, DESIGN_THEMES, CONSTRUCTION_PHASES } from '@/engine/systems/property';
import { CITIES, NEIGHBOURHOODS } from '@/engine/content/geography';
import { CATALOG } from '@/engine/content/catalog';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import type { ConstructionPhase, ConstructionProject } from '@/engine/domain/model';
import { MS_HOUR, formatDate, tomorrowAt } from '@/engine/core/time';
import { activeScene } from '@/engine/systems/scenes';
import { POSTPONE_DAYS, canPostpone, closingNumbers, furnishable, roomsFor } from '@/engine/systems/purchase';
import { USE_ELSEWHERE, householdAssets, preferredRooms, usesFor, works } from '@/engine/systems/household';
import type { PropertyOffer } from '@/engine/domain/model';

type Tab = 'owned' | 'market' | 'offers' | 'build' | 'interiors' | 'things';

export function PropertyWorkspace() {
  const { sim, run } = useGame();
  const scene = useWorld(activeScene);
  const here = (offer: PropertyOffer) => sim.universe.properties[offer.propertyId]?.locationId === sim.player.currentLocationId;
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

  const things = useWorld((s) => householdAssets(s, s.player.id));

  const [offerFor, setOfferFor] = useState<string | null>(null);

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Property</div>
        <h1>{owned.length > 0 ? `${owned.length} Propert${owned.length === 1 ? 'y' : 'ies'}` : 'No Property Yet'}</h1>
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
          { id: 'things', label: 'Your Things', badge: things.length },
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
                subtitle={`${titleCaseLabel(property.kind.replace(/_/g, ' '))} · ${CITIES.get(property.locationId)?.name}${property.neighbourhoodId ? ` · ${NEIGHBOURHOODS.get(property.neighbourhoodId)?.name}` : ''}`}
                actions={
                  <div className="row wrap gap-1">
                    {property.ownerId === sim.player.id && sim.player.residenceId !== property.id && (
                      <>
                        <button className="btn btn-sm btn-primary" disabled={Boolean(scene) || !furnishable(sim, property.id).ok} title={furnishable(sim, property.id).reason} onClick={() => run('scene.start', { definitionId: 'property.movein', input: { propertyId: property.id }, refType: 'property', refId: property.id })}>Move In</button>
                        <button className="btn btn-sm" onClick={() => run('prop.move_in', { propertyId: property.id }, { idempotencyKey: `movein:${property.id}` })}>Just Move In</button>
                      </>
                    )}
                    {sim.player.residenceId === property.id && roomsFor(sim, property.id).length > 0 && (
                      <button className="btn btn-sm btn-primary" disabled={Boolean(scene) || !furnishable(sim, property.id).ok} title={furnishable(sim, property.id).reason} onClick={() => run('scene.start', { definitionId: 'property.movein', input: { propertyId: property.id }, refType: 'property', refId: property.id })}>Furnish It</button>
                    )}
                    {property.ownerId === sim.player.id && (
                      <button
                        className="btn btn-sm"
                        onClick={() => run('prop.list_for_sale', { propertyId: property.id, askingPrice: property.marketValue })}
                      >
                        List For Sale
                      </button>
                    )}
                  </div>
                }
              >
                <div className="grid grid-2" style={{ marginBottom: 'var(--s4)' }}>
                  <Stat label="Tenure" value={titleCaseLabel(property.tenure.replace(/_/g, ' '))} />
                  <Stat label="Value" value={<MoneyText amount={property.marketValue} compact />} />
                  <Stat label="Size" value={`${property.interiorSqft.toLocaleString('en-US')} sq ft`} note={`${property.bedrooms} bed · ${property.bathrooms} bath`} />
                  {property.monthlyRent && property.tenure === 'rented' && (
                    <Stat label="Rent" value={<span className="mono">{formatMoney(property.monthlyRent)}/mo</span>} />
                  )}
                  <Stat label="Garage" value={garageSpacesOf(sim, property) > 0 ? `${garageSpacesOf(sim, property)} Space${garageSpacesOf(sim, property) === 1 ? '' : 's'}` : 'None'} note={hasDriveway(property) ? 'And a driveway' : undefined} />
                  {dockFeetOf(property) > 0 && <Stat label="Dock" value={`Up To ${dockFeetOf(property)} Ft`} note="A private dock. A boat kept here costs nothing a month." />}
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
        <Panel
          title="On The Market"
          subtitle={`${listings.length} listings where you are`}
          flush
        >
          {listings.length === 0 ? (
            <Empty title="Nothing Listed" body="New listings appear every ten days." />
          ) : (
            <div className="list">
              {listings.map(({ listing, property }) => property && (
                <div key={listing.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{property.addressLine}</div>
                    <div className="xs dim">
                      {titleCaseLabel(property.kind.replace(/_/g, ' '))}
                      {property.lot
                        ? ` · ${property.lot.stages} stage${property.lot.stages === 1 ? '' : 's'} · ${property.interiorSqft.toLocaleString('en-US')} sq ft · overhead ${formatMoneyCompact(property.lot.monthlyOverhead)} a month`
                        : ` · ${property.bedrooms} bed · ${property.interiorSqft.toLocaleString('en-US')} sq ft`}
                      {property.neighbourhoodId && ` · ${NEIGHBOURHOODS.get(property.neighbourhoodId)?.name}`}
                      {' · '}{listing.daysOnMarket} days on market
                    </div>
                    {property.lot && <div className="xs muted" style={{ marginTop: 2 }}>{property.name}. A working plant: stages, tenants, a monthly close.</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono">{formatMoneyCompact(listing.askingPrice)}</div>
                    {property.monthlyRent && (
                      <div className="xs dim">or {formatMoney(property.monthlyRent)}/mo</div>
                    )}
                  </div>
                  <div className="row gap-1 wrap" style={{ justifyContent: 'flex-end' }}>
                    {property.monthlyRent && (
                      <button className="btn btn-sm" onClick={() => run('prop.rent', { propertyId: property.id, months: 12 })}>
                        Rent
                      </button>
                    )}
                    <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} title={listing.viewedByPlayer ? 'You have seen it. Go again if you like.' : undefined} onClick={() => run('scene.start', { definitionId: 'property.viewing', input: { listingId: listing.id }, refType: 'listing', refId: listing.id })}>
                      {listing.viewedByPlayer ? 'See It Again' : 'View It Now'}
                    </button>
                    <button className="btn btn-sm" onClick={() => run('prop.book_showing', { listingId: listing.id, at: tomorrowAt(sim.now, 11, sim.homeZone) })}>Book A Viewing</button>
                    <button className="btn btn-sm" onClick={() => setOfferFor(listing.id)}>Offer</button>
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
                        {titleCaseLabel(offer.status)}
                      </span>
                    </div>

                    {offer.status === 'countered' && (
                      <div className="callout callout-warning" style={{ marginTop: 'var(--s2)' }}>
                        They came back at {formatMoney(offer.counterAmount ?? 0)}. They will wait until {formatDate(offer.respondBy, sim.homeZone)}.
                        <div className="row wrap gap-2" style={{ marginTop: 'var(--s2)' }}>
                          <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'property.counter', input: { offerId: offer.id }, refType: 'offer', refId: offer.id })}>Take The Call</button>
                          <button className="btn btn-sm" onClick={() => run('prop.respond_to_counter', { offerId: offer.id, accept: true })}>Accept</button>
                          <button className="btn btn-sm" onClick={() => run('prop.respond_to_counter', { offerId: offer.id, accept: false })}>Walk Away</button>
                        </div>
                      </div>
                    )}

                    {offer.inspectionFindings && (
                      <div className="callout" style={{ marginTop: 'var(--s2)' }}>
                        <strong className="small">{offer.inspectionFindings.length === 0 ? 'A clean inspection.' : 'Inspection found:'}</strong>
                        {offer.inspectionFindings.length > 0 && (
                          <ul className="xs" style={{ margin: '4px 0 0', paddingLeft: 'var(--s4)' }}>
                            {offer.inspectionFindings.map((finding, i) => (
                              <li key={i}>
                                {finding.item} — {finding.severity}, about {formatMoney(finding.estimate, { cents: false })}
                              </li>
                            ))}
                          </ul>
                        )}
                        {offer.status === 'accepted' && !offer.inspectionDecidedAt && (
                          <div className="row wrap gap-2" style={{ marginTop: 'var(--s2)' }}>
                            <button className="btn btn-sm btn-primary" disabled={Boolean(scene) || !here(offer)} title={here(offer) ? undefined : 'You aren’t in the city the house is in.'} onClick={() => run('scene.start', { definitionId: 'property.inspection', input: { offerId: offer.id }, refType: 'offer', refId: offer.id })}>Walk It With The Inspector</button>
                            <button className="btn btn-sm" disabled={Boolean(scene)} onClick={() => run('scene.quick', { definitionId: 'property.inspection', input: { offerId: offer.id }, refType: 'offer', refId: offer.id })}>Read The Report</button>
                            <button className="btn btn-sm" onClick={() => run('prop.inspection_decision', { offerId: offer.id, proceed: true })}>Proceed Anyway</button>
                          </div>
                        )}
                      </div>
                    )}

                    {offer.status === 'accepted' && offer.closingAt && (
                      <div className={`callout ${sim.now >= offer.closingAt - 12 * MS_HOUR ? 'callout-warning' : ''}`} style={{ marginTop: 'var(--s2)' }}>
                        {sim.now >= offer.closingAt - 12 * MS_HOUR
                          ? `Closing day. ${formatMoney(closingNumbers(sim, offer).cashToClose)} to close${closingNumbers(sim, offer).shortfall > 0 ? `; you are ${formatMoney(closingNumbers(sim, offer).shortfall)} short` : ''}.`
                          : `Closing is set for ${formatDate(offer.closingAt, sim.homeZone)}.${offer.appraisalGap ? ` The appraisal came in short; you bring ${formatMoney(offer.appraisalGap)} more to the table.` : ''}`}
                        {sim.now >= offer.closingAt - 12 * MS_HOUR && (
                          <div className="row wrap gap-2" style={{ marginTop: 'var(--s2)' }}>
                            <button className="btn btn-sm btn-primary" disabled={Boolean(scene) || !here(offer)} title={here(offer) ? undefined : 'You aren’t in the city the house is in.'} onClick={() => run('scene.start', { definitionId: 'property.closing', input: { offerId: offer.id }, refType: 'offer', refId: offer.id })}>Sit At The Table</button>
                            <button className="btn btn-sm" onClick={() => run('prop.close', { offerId: offer.id }, { idempotencyKey: `close:${offer.id}` })}>Sign Remotely</button>
                            {canPostpone(offer) && <button className="btn btn-sm" onClick={() => run('prop.postpone_closing', { offerId: offer.id })}>Ask For {POSTPONE_DAYS} More Days</button>}
                          </div>
                        )}
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

      {tab === 'things' && <ThingsTab />}

      {offerFor && <OfferDialog listingId={offerFor} onClose={() => setOfferFor(null)} />}
    </>
  );
}

/** A lot you own, as a business: the plant, the rate, the tenants, the last close. */

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
        <label htmlFor="amount">Your Offer</label>
        <input id="amount" type="number" step={1000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <p className={`xs ${ratio < 0.9 ? 'negative' : ratio > 1 ? 'positive' : 'dim'}`} style={{ marginTop: 4 }}>
          {Math.round(ratio * 100)}% of asking.
          {ratio < 0.88 && ' Low enough that they may simply reject it.'}
        </p>
      </div>

      <div className="field">
        <label htmlFor="financing">How You Are Paying</label>
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
        actions={<button className="btn btn-sm btn-primary" disabled={land.length === 0} onClick={() => setOpen(true)}>Start A Build</button>}
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
                    <span className="chip">{titleCaseLabel(project.status)}</span>
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
                                  {titleCaseLabel(phase.status.replace(/_/g, ' '))}
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
                  Build Here
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
                    {property?.addressLine} · {titleCaseLabel(room.kind)} · {room.sqft} sq ft
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
                  <option value="">Choose A Theme…</option>
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
                <option value="">Buy And Place In…</option>
                {preferredRooms(rooms.map(({ room }) => room), item.roomKinds ?? []).map((room) => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

/**
 * Your things.
 *
 * Everything you own that lives in the house, in the room it lives in, with
 * the state it is actually in. A thing you can do something with has the doing
 * of it on the row. A thing that has stopped says so, and says what the repair
 * will cost before you agree to it. A thing you only own says that too, which
 * is the honest answer for a sheet set.
 */
function ThingsTab() {
  const { sim, run } = useGame();
  const things = useWorld((s) => householdAssets(s, s.player.id));
  const rooms = useWorld((s) => Object.fromEntries(Object.values(s.universe.rooms).map((r) => [r.id, r])));

  if (things.length === 0) {
    return <Empty title="Nothing Yet" body="Appliances, furniture, books and the rest appear here once you buy them." />;
  }

  const broken = things.filter((t) => !works(t));
  const groups = new Map<string, typeof things>();
  for (const thing of things) {
    const key = thing.roomId ? rooms[thing.roomId]?.name ?? 'Elsewhere' : 'Not Put Anywhere Yet';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(thing);
  }

  return (
    <>
      {broken.length > 0 && (
        <Panel title="Stopped Working" subtitle={`${broken.length} thing${broken.length === 1 ? '' : 's'} in the house needs a repair`} flush>
          <div className="list">
            {broken.map((thing) => (
              <div key={thing.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{thing.name}</div>
                  <div className="xs dim">
                    {thing.roomId ? `${rooms[thing.roomId]?.name} · ` : ''}
                    Condition {Math.round(thing.condition)}
                    {thing.repairDueAt ? ` · booked in, back ${formatDate(thing.repairDueAt, sim.homeZone)}` : ''}
                  </div>
                </div>
                {thing.repairDueAt === undefined && (
                  <button className="btn btn-sm btn-primary" onClick={() => run('home.repair', { assetId: thing.id })}>
                    Book The Repair
                  </button>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {[...groups.entries()].map(([room, kept]) => (
        <Panel key={room} title={room} subtitle={`${kept.length} thing${kept.length === 1 ? '' : 's'}`} flush>
          <div className="list">
            {kept.map((thing) => {
              const item = thing.catalogId ? CATALOG.get(thing.catalogId) : undefined;
              const uses = item ? usesFor(item.name, item.category) : [];
              const elsewhere = uses.find((u) => u.via);
              return (
                <div key={thing.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{thing.name}</div>
                    <div className="xs dim">
                      {item ? `${titleCaseLabel(item.category)} · ` : ''}
                      {works(thing) ? `Condition ${Math.round(thing.condition)}` : 'Stopped'}
                      {thing.lastUsedAt ? ` · last used ${formatDate(thing.lastUsedAt, sim.homeZone)}` : ''}
                    </div>
                  </div>
                  <div style={{ width: 110 }}>
                    <Meter label="Condition" value={thing.condition} />
                  </div>
                  {uses.length === 0 && <span className="xs dim">Owned</span>}
                  {elsewhere && <span className="xs dim">{USE_ELSEWHERE[elsewhere.via!]}</span>}
                  {!elsewhere && works(thing) && uses.map((use) => (
                    <button
                      key={use.id}
                      className="btn btn-sm"
                      onClick={() => run('home.use', { assetId: thing.id, useId: use.id })}
                    >
                      {use.label}
                    </button>
                  ))}
                  {!works(thing) && thing.repairDueAt === undefined && (
                    <button className="btn btn-sm btn-primary" onClick={() => run('home.repair', { assetId: thing.id })}>
                      Repair
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      ))}
    </>
  );
}
