import { titleCaseLabel } from '@/engine/core/text';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Empty } from '@/ui/components/primitives';
import { ensureProviders, activePolicy, upcomingAppointments } from '@/engine/systems/services';
import { attendable, fillable, prescriptionsOf, visitCost } from '@/engine/systems/care';
import { activeScene } from '@/engine/systems/scenes';
import { formatMoney } from '@/engine/core/money';
import { formatDate, formatTime } from '@/engine/core/time';
import { plural } from '@/engine/core/text';
import { ageOf } from '@/engine/systems/lifespan';
import {
  chipIsTheLaw, countryHere, dentistsIn, describePet, describeTeeth, treatmentsOffered,
  vetServicesOffered, vetsIn,
} from '@/engine/systems/rooms';
import {
  CHIP_NOTE, DENTAL_SYSTEM_LABEL, DENTIST_NOTE, OUT_OF_HOURS_NOTE, RECALL_NOTE, TOOTH_NOTE,
  VET_NOTE, dentalIn, toothPrice,
} from '@/engine/content/rooms';


/**
 * The dentist and the vet.
 *
 * Who pays for dentistry is the real part and differs completely between
 * countries; the practice, the price and the chair are SLATE's own. The
 * veterinary groups are real companies and the microchipping law is the law.
 */
function TheOtherPractices(): JSX.Element | null {
  const { sim, run, toast } = useGame();
  const now = useWorld((s) => s.now);
  void now;
  const countryId = countryHere(sim);
  const regime = dentalIn(countryId);
  const practices = dentistsIn(sim);
  const surgeries = vetsIn(sim);
  const offered = treatmentsOffered(sim);
  const age = ageOf(sim);
  const pet = describePet(sim);
  const petServices = vetServicesOffered(sim);
  const law = chipIsTheLaw(sim);
  const at = sim.player.currentPlaceId;

  return (
    <>
      <Panel
        title="Your Teeth"
        subtitle={`${DENTAL_SYSTEM_LABEL[regime.system]} where you are. ${describeTeeth(sim)}`}
        flush
      >
        <div className="list">
          {practices.map((place) => (
            <div key={place.id} className="list-item list-static">
              <div className="grow">
                <div className="row-title">{place.name}</div>
                <div className="xs dim">{place.about}</div>
                {at !== place.id && <div className="xs dim">You are not there.</div>}
              </div>
            </div>
          ))}
          {offered.map((treatment) => {
            const place = practices.find((one) => one.id === at) ?? practices[0];
            const price = toothPrice(treatment, countryId, age);
            return (
              <div key={treatment.id} className="list-item">
                <div className="grow">
                  <div className="row-title">{treatment.label}</div>
                  <div className="xs dim">
                    {price === 0 ? 'Nothing To Pay' : formatMoney(price)}
                    {treatment.band > 0 && regime.system === 'banded' ? ` · Band ${treatment.band}` : ''}
                    {' · '}{plural(treatment.minutes, 'minute')}
                  </div>
                  <div className="xs dim">{treatment.about}</div>
                </div>
                <button
                  className="btn btn-sm"
                  disabled={!place || at !== place.id}
                  onClick={() => {
                    const res = run<{ note: string }>('room.dentist', { placeId: place!.id, treatmentId: treatment.id });
                    if (res.ok) toast(res.value!.note, 'positive');
                  }}
                >
                  {place && at === place.id ? 'Have It Done' : 'Go There First'}
                </button>
              </div>
            );
          })}
        </div>
        <div className="col gap-2" style={{ padding: '0.75rem' }}>
          <p className="xs dim" style={{ margin: 0 }}>{regime.about}</p>
          <p className="xs dim" style={{ margin: 0 }}>{DENTIST_NOTE}</p>
          <p className="xs dim" style={{ margin: 0 }}>{RECALL_NOTE}</p>
          <p className="xs dim" style={{ margin: 0 }}>{TOOTH_NOTE}</p>
        </div>
      </Panel>

      {pet && (
        <Panel title="The Vet" subtitle={pet} flush>
          <div className="list">
            {surgeries.map((place) => (
              <div key={place.id} className="list-item list-static">
                <div className="grow">
                  <div className="row-title">{place.name}</div>
                  <div className="xs dim">{place.about}</div>
                  {at !== place.id && <div className="xs dim">You are not there.</div>}
                </div>
              </div>
            ))}
            {petServices.map((service) => {
              const place = surgeries.find((one) => one.id === at) ?? surgeries[0];
              return (
                <div key={service.id} className="list-item">
                  <div className="grow">
                    <div className="row-title">{service.label}</div>
                    <div className="xs dim">
                      {formatMoney(service.price)} · {plural(service.minutes, 'minute')}
                      {service.id === 'chip' && law !== undefined ? ` · Required By Law Since ${law}` : ''}
                    </div>
                    <div className="xs dim">{service.about}</div>
                  </div>
                  <button
                    className="btn btn-sm"
                    disabled={!place || at !== place.id}
                    onClick={() => {
                      const res = run<{ note: string }>('room.vet', { placeId: place!.id, serviceId: service.id });
                      if (res.ok) toast(res.value!.note, 'positive');
                    }}
                  >
                    {place && at === place.id ? 'Take Them In' : 'Go There First'}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="col gap-2" style={{ padding: '0.75rem' }}>
            <p className="xs dim" style={{ margin: 0 }}>{VET_NOTE}</p>
            <p className="xs dim" style={{ margin: 0 }}>{CHIP_NOTE}</p>
            <p className="xs dim" style={{ margin: 0 }}>{OUT_OF_HOURS_NOTE}</p>
          </div>
        </Panel>
      )}
    </>
  );
}

export function HealthWorkspace() {
  const { sim, run } = useGame();
  const player = useWorld((s) => s.player);
  const providers = useWorld((s) => ensureProviders(s, s.player.currentLocationId));
  const upcoming = useWorld(upcomingAppointments.bind(null, sim, sim.universe.playerId) as never) as ReturnType<typeof upcomingAppointments>;
  const past = useWorld((s) => Object.values(s.universe.appointments)
    .filter((a) => a.personId === s.player.id && a.status !== 'scheduled')
    .sort((a, b) => b.at - a.at));
  const health = useWorld((s) => activePolicy(s, s.player.id, 'health'));
  const scene = useWorld(activeScene);
  const prescriptions = useWorld((s) => prescriptionsOf(s, s.player.id).filter((rx) => rx.status === 'written' || rx.status === 'filled'));

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Health</div>
        <h1>Care and recovery.</h1>
        <p className="muted">
          A simulated healthcare system, not medical advice. Providers, appointments, what they cost
          and what insurance covers. When an appointment comes round it asks: play it, just go, or skip it.
        </p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 'var(--s5)' }}>
        <Panel title="Condition" tight>
          <div className="col gap-3">
            <Meter label="Condition" value={player.wellbeing.condition} />
            <Meter label="Fitness" value={player.wellbeing.fitness} />
            <Meter label="Stress" value={player.wellbeing.stress} invert />
          </div>
        </Panel>
        <Panel title="Cover" tight>
          {health ? (
            <div className="col gap-2">
              <Stat label={health.carrier} value={<span className="mono">{formatMoney(health.monthlyPremium)}/mo</span>} />
              <div className="xs dim">
                {formatMoney(health.deductible)} deductible, then {Math.round(health.coinsurance * 100)}% covered.
              </div>
            </div>
          ) : (
            <p className="small muted">
              You have no health cover. Every visit is paid in full, and an emergency is ruinous.
            </p>
          )}
        </Panel>
        <Panel title="Upcoming" tight>
          {upcoming.length === 0 ? (
            <p className="small muted">Nothing booked.</p>
          ) : (
            <div className="col gap-2">
              {upcoming.slice(0, 3).map((appointment) => {
                const can = attendable(sim, appointment);
                const cost = visitCost(sim, appointment);
                return (
                  <div key={appointment.id}>
                    <div className="small strong">{titleCaseLabel(appointment.kind)}</div>
                    <div className="xs dim">
                      {formatDate(appointment.at, sim.homeZone)} at {formatTime(appointment.at, sim.homeZone)} · {formatMoney(cost.outOfPocket)} out of pocket{cost.network === 'out' ? ' · card not accepted' : ''}
                    </div>
                    {can.ok && (
                      <div className="row wrap gap-1" style={{ marginTop: 4 }}>
                        <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'health.visit', input: { appointmentId: appointment.id }, refType: 'appointment', refId: appointment.id })}>Play It Out</button>
                        <button className="btn btn-sm" onClick={() => run('health.attend', { appointmentId: appointment.id }, { idempotencyKey: `attend:${appointment.id}` })}>Just Go</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Providers Where You Are" flush>
        <div className="list">
          {providers.map((provider) => (
            <div key={provider.id} className="list-item list-static">
              <div className="grow">
                <div className="small strong">{provider.name}</div>
                <div className="xs dim">
                  {titleCaseLabel(provider.specialty.replace(/_/g, ' '))} · rated {provider.rating.toFixed(1)} · next opening in {provider.leadTimeDays} days
                </div>
              </div>
              <span className="mono small">{formatMoney(provider.baseVisitCost, { cents: false })}</span>
              <button className="btn btn-sm" onClick={() => run('health.book', { providerId: provider.id })}>
                Book
              </button>
            </div>
          ))}
        </div>
      </Panel>

      {prescriptions.length > 0 && (
        <Panel title="Prescriptions" subtitle="Written by a provider, collected at a pharmacy, taken as it says on the box. SLATE's own names; not medical advice." flush>
          <div className="list">
            {prescriptions.map((rx) => {
              const can = fillable(sim, rx);
              const total = rx.days * rx.dosesPerDay;
              return (
                <div key={rx.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{rx.medication}</div>
                    <div className="xs dim">
                      {rx.status === 'written'
                        ? `Written ${formatDate(rx.writtenAt, sim.homeZone)} · ${rx.days} day${rx.days === 1 ? '' : 's'}, ${rx.dosesPerDay} a day · ${formatMoney(rx.outOfPocket)} at the counter`
                        : `${rx.dosesTaken} of ${total} doses taken${rx.nextDoseAt ? ` · next ${formatTime(rx.nextDoseAt, sim.homeZone)}` : ''}`}
                    </div>
                  </div>
                  {rx.status === 'written' && (
                    <button className="btn btn-sm btn-primary" disabled={!can.ok} title={can.reason} onClick={() => run('health.fill_prescription', { prescriptionId: rx.id }, { idempotencyKey: `fill:${rx.id}` })}>Collect It</button>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel title="Appointment History" flush>
        {past.length === 0 ? (
          <Empty title="Nothing Yet" body="Preventative care is cheaper than the alternative." />
        ) : (
          <div className="list">
            {past.map((appointment) => (
              <div key={appointment.id} className="list-item list-static">
                <span className="xs dim nowrap" style={{ minWidth: 100 }}>{formatDate(appointment.at, sim.homeZone)}</span>
                <div className="grow">
                  <div className="small">{titleCaseLabel(appointment.kind)}</div>
                  <div className="xs dim">{appointment.outcome ?? appointment.status}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono small">{formatMoney(appointment.outOfPocket)}</div>
                  {appointment.insuranceCovered > 0 && (
                    <div className="xs positive">{formatMoney(appointment.insuranceCovered)} covered</div>
                  )}
                </div>
                <span className={`chip ${appointment.status === 'missed' ? 'chip-negative' : ''}`}>{titleCaseLabel(appointment.status)}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <TheOtherPractices />
    </>
  );
}
