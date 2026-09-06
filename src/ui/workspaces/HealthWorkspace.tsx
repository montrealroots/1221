import { titleCaseLabel } from '@/engine/core/text';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Empty } from '@/ui/components/primitives';
import { ensureProviders, activePolicy, upcomingAppointments } from '@/engine/systems/services';
import { attendable, fillable, prescriptionsOf, visitCost } from '@/engine/systems/care';
import { activeScene } from '@/engine/systems/scenes';
import { formatMoney } from '@/engine/core/money';
import { formatDate, formatTime } from '@/engine/core/time';

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
    </>
  );
}
