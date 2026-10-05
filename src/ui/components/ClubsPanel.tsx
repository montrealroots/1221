/**
 * Clubs (`systems/clubs.ts`): the town's clubs and lessons compared on one
 * basis, a session's price, cheapest first; joined, each meeting ahead
 * answered, set out for by the way chosen, and kept by preference (from
 * 2026-10-03; until then a club was a Join button and every meeting went
 * on its own).
 */
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Modal, Panel } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatDate, formatTime, instantFromZoned } from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { CITIES } from '@/engine/content/geography';
import { contactsOf } from '@/engine/systems/people';
import type { Club, ClubKind } from '@/engine/content/clubs';
import {
  SET_OUT_HOURS, SOCIAL_MINUTES, attendOf, canceledFor, clubById, clubsIn, goRefusal, joinClubRefusal, joinFee, legTo, meetingFor, openToAnyone,
  meetingsAhead, membershipsOf, perSession, type Membership,
} from '@/engine/systems/clubs';
import { transitFare, type TripMode } from '@/engine/systems/trips';
import { vehiclesOf, modelById, forOutings } from '@/engine/systems/vehicles';

const WEEKDAY = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'] as const;
const KIND_LABEL: Record<ClubKind, string> = { parkrun: 'Parkrun', running: 'Running Club', league: 'League', lesson: 'Lessons' };
const WAY_LABEL: Record<TripMode, string> = { foot: 'On Foot', transit: 'By Transit', car: 'By Car' };
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

/** A club's hour as the town's clock reads it, and its summer hour where it has one. */
function hoursOf(c: Club): { usual: string; summer?: string } {
  const zone = CITIES.require(c.cityId).timeZone;
  const at = (h: number, m: number) => formatTime(instantFromZoned({ year: 2026, month: 1, day: 15, hour: h, minute: m }, zone), zone);
  return { usual: at(c.hour, c.minute), ...(c.summer ? { summer: `${at(c.summer.hour, c.summer.minute)} from ${MONTH[c.summer.from - 1]} to ${MONTH[c.summer.to - 1]}` } : {}) };
}

/** The ways there that this town and this life offer. */
function useWays(): { modes: TripMode[]; cars: { id: string; label: string }[] } {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const cars = vehiclesOf(person)
    .filter((v) => v.soldAt === undefined && (v.at ?? v.cityId) === person.currentLocationId && !forOutings(modelById(v.modelId)!))
    .map((v) => { const m = modelById(v.modelId)!; return { id: v.id, label: `${m.make} ${m.model}` }; });
  const modes: TripMode[] = ['foot', ...(transitFare(sim, person.currentLocationId) !== undefined ? ['transit' as const] : []), ...(cars.length ? ['car' as const] : [])];
  return { modes, cars };
}

export function ClubsPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const [kind, setKind] = useState<ClubKind | 'all'>('all');
  const here = clubsIn(person.currentLocationId);
  const mine = membershipsOf(person);
  if (here.length === 0 && mine.length === 0) return null;
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  // Compared on one basis, a session's price, the free first; a club you're in shows whether in town or not.
  const shown = here.filter((c) => kind === 'all' || c.kind === kind).sort((a, b) => perSession(sim, a) - perSession(sim, b) || a.name.localeCompare(b.name));
  const kinds = [...new Set(here.map((c) => c.kind))];
  const zone = CITIES.get(person.currentLocationId)?.timeZone ?? sim.zone;
  return (
    <Panel title="Clubs" subtitle="Parkrun, running clubs, leagues and lessons, compared by what a session costs">
      {mine.map((m) => { const c = clubById(m.clubId); return c ? <Joined key={m.clubId} club={c} m={m} /> : null; })}
      {here.length > 0 && (
        <>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <label className="xs dim" htmlFor="club-kind">Show</label>
            <select id="club-kind" className="input input-sm" value={kind} onChange={(e) => setKind(e.target.value as ClubKind | 'all')}>
              <option value="all">Every Kind</option>
              {kinds.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </select>
          </div>
          {shown.length === 0 ? <div className="xs dim">None of that kind meets here.</div> : (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Club</th><th scope="col">Where</th><th scope="col">When</th><th scope="col" className="num">A Session</th><th scope="col">Terms</th><th scope="col"><span className="sr-only">Join</span></th></tr></thead>
                <tbody>
                  {shown.map((c) => {
                    const m = mine.find((x) => x.clubId === c.id);
                    const no = m ? 'You’re in it.' : joinClubRefusal(person, c.id);
                    const next = nextShown(sim, c);
                    const fee = joinFee(sim, c);
                    return (
                      <tr key={c.id}>
                        <td>{c.name}<div className="xs dim">{KIND_LABEL[c.kind]}{c.confirmed ? '' : ', read secondhand'}</div></td>
                        <td className="small">{c.place}{c.outdoor ? <div className="xs dim">Outdoors</div> : null}</td>
                        <td className="small">{`${WEEKDAY[c.weekday]} at ${hoursOf(c).usual}`}{c.summer ? <div className="xs dim">{hoursOf(c).summer}</div> : null}<div className="xs dim">{`${c.minutes} minutes; next ${formatDate(next.at, zone)}${next.off ? ', canceled' : ''}`}</div></td>
                        <td className="num small">{perSession(sim, c) === 0 ? 'Free' : <span className="mono">{money(perSession(sim, c))}</span>}</td>
                        <td className="small">{termsOf(c, money, fee)}</td>
                        <td><Gated feature="club.join" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('club.join', { clubId: c.id }).ok) toast(`Joined ${c.name}. Answer its meetings below, or set it to go on its own.`, 'positive'); }}>Join</Gated></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      <div className="xs dim">A session’s price is a season’s fee over its weeks, or a week’s. Leaving gives nothing back; no club’s refund terms were read. An outdoor club doesn’t meet in a thunderstorm.</div>
    </Panel>
  );
}

function nextShown(sim: ReturnType<typeof useGame>['sim'], c: Club): { at: number; off?: string } {
  const at = meetingsAhead(c, sim.now, 1)[0]!;
  const off = canceledFor(sim, c, at);
  return { at, ...(off ? { off } : {}) };
}

function termsOf(c: Club, money: (n: number) => string, fee: number): string {
  if (!c.fee) return 'Free, each week';
  if (c.fee.per === 'week') return `${money(Math.round(c.fee.amount * 100))} a week, paid at each${c.seasonWeeks ? `; ${c.seasonWeeks} weeks` : ''}`;
  return `${money(fee)} for ${c.seasonWeeks} weeks, paid on joining`;
}

/** One club you're in: its next meetings answered, setting out, the preferences, and what's happened. */
function Joined({ club, m }: { club: Club; m: Membership }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const { modes, cars } = useWays();
  const [way, setWay] = useState<TripMode>(m.by && modes.includes(m.by) ? m.by : 'foot');
  const [car, setCar] = useState<string>(m.vehicleId ?? cars[0]?.id ?? '');
  const [stay, setStay] = useState(false);
  // Somebody along (from 2026-10-05): the people you know in its town, a rival not asked.
  const [along, setAlong] = useState<string[]>([]);
  const friends = contactsOf(person).filter((c) => c.cityId === club.cityId && !c.rival);
  const zone = CITIES.require(club.cityId).timeZone;
  const cur = saveCurrency(sim.universe);
  const ahead = meetingsAhead(club, sim.now, 4, m.until);
  const now = meetingFor(club, sim.now);
  const goNo = goRefusal(sim, person, club.id, way, way === 'car' ? car : undefined, along);
  const leg = legTo(club, way);
  const fare = way === 'transit' ? transitFare(sim, club.cityId) : undefined;
  const set = (patch: Record<string, unknown>) => { if (run('club.set', { clubId: club.id, ...patch }).ok) toast('Saved.', 'positive'); };
  const answerOf = (at: number): string => {
    const answer = m.rsvp?.[String(at)];
    return answer === 'going' ? 'Going' : answer === 'not' ? 'Not Going' : attendOf(m) === 'always' ? 'Goes On Its Own' : 'Not Answered';
  };
  return (
    <div className="card col gap-3" style={{ padding: 12, marginBottom: 12 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <strong>{club.name}</strong>
        <span className="xs dim">{`Gone ${m.went}, missed ${m.missed ?? 0}${m.until !== undefined ? `; its season to ${formatDate(m.until, zone)}` : ''}`}</span>
      </div>
      <div className="small">{`${club.place}, ${WEEKDAY[club.weekday]} at ${hoursOf(club).usual}${club.summer ? `, ${hoursOf(club).summer}` : ''}; ${club.minutes} minutes.`}</div>

      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Its Next Meetings</th><th scope="col">Your Answer</th><th scope="col"><span className="sr-only">Answer It</span></th></tr></thead>
          <tbody>
            {ahead.map((at) => {
              const answer = m.rsvp?.[String(at)];
              const off = canceledFor(sim, club, at);
              return (
                <tr key={at}>
                  <td className="small">{`${formatDate(at, zone)}, ${formatTime(at, zone)}`}</td>
                  <td className="small">{off ? 'Canceled: A Thunderstorm' : answerOf(at)}</td>
                  <td>
                    {!off && (
                      <div className="row gap-2">
                        <Gated feature="club.rsvp" className="btn btn-sm btn-ghost" disabled={answer === 'going'} onClick={() => run('club.rsvp', { clubId: club.id, at, going: true })}>Going</Gated>
                        <Gated feature="club.rsvp" className="btn btn-sm btn-ghost" disabled={answer === 'not'} onClick={() => run('club.rsvp', { clubId: club.id, at, going: false })}>Not Going</Gated>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`club-way-${club.id}`}>Way There</label>
          <select id={`club-way-${club.id}`} value={way} onChange={(e) => setWay(e.target.value as TripMode)}>
            {modes.map((w) => <option key={w} value={w}>{WAY_LABEL[w]}</option>)}
          </select>
        </div>
        {way === 'car' && (
          <div className="field">
            <label htmlFor={`club-car-${club.id}`}>Car</label>
            <select id={`club-car-${club.id}`} value={car} onChange={(e) => setCar(e.target.value)}>
              {cars.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor={`club-attend-${club.id}`}>Its Meetings</label>
          <select id={`club-attend-${club.id}`} value={attendOf(m)} onChange={(e) => set({ attend: e.target.value, by: way, ...(way === 'car' ? { vehicleId: car } : {}) })}>
            <option value="ask">Ask Me Each Time</option>
            <option value="always">Go On Their Own</option>
          </select>
        </div>
      </div>
      {friends.length > 0 && (
        <div className="field">
          <span className="small">{openToAnyone(club) ? 'With (They Run It Too)' : 'With (Along For The Ride)'}</span>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            {friends.map((c) => (
              <label key={c.id} className="small row gap-1" style={{ alignItems: 'center' }}>
                <input type="checkbox" checked={along.includes(c.id)} onChange={() => setAlong((a) => (a.includes(c.id) ? a.filter((x) => x !== c.id) : [...a, c.id]))} />{c.name}
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="small row gap-1" style={{ alignItems: 'center' }}><input type="checkbox" checked={stay} onChange={(e) => setStay(e.target.checked)} />Stay After</label>
        <Gated feature="club.go" className="btn btn-sm btn-primary" disabled={Boolean(goNo)} title={goNo} onClick={() => {
          const r = run<{ minutes: number; met?: string }>('club.go', { clubId: club.id, by: way, ...(way === 'car' ? { vehicleId: car } : {}), ...(stay ? { stayAfter: true } : {}), ...(along.length ? { passengerIds: along } : {}) });
          if (r.ok) toast(`Back from ${club.name}${r.value?.met ? `; you met ${r.value.met}` : ''}.`, 'positive');
        }}>Set Out Now</Gated>
        {attendOf(m) === 'always' && m.by !== way && <Gated feature="club.set" className="btn btn-sm btn-ghost" onClick={() => set({ by: way, ...(way === 'car' ? { vehicleId: car } : {}) })}>Go {WAY_LABEL[way]}</Gated>}
        {club.seasonWeeks && m.until !== undefined && (
          <>
            <label className="small row gap-1" style={{ alignItems: 'center' }}><input type="checkbox" checked={m.renew === true} onChange={(e) => set({ renew: e.target.checked })} />Renew At The Season’s End</label>
            <Gated feature="club.renew" className="btn btn-sm btn-ghost" onClick={() => { const r = run<{ until: number }>('club.renew', { clubId: club.id }); if (r.ok) toast(`Renewed to ${formatDate(r.value!.until, zone)}.`, 'positive'); }}>Renew Now</Gated>
          </>
        )}
        <Gated feature="club.leave" className="btn btn-sm btn-ghost" onClick={() => { if (run('club.leave', { clubId: club.id }).ok) toast(`Left ${club.name}.`, 'positive'); }}>Leave</Gated>
      </div>
      <div className="xs dim">{`${Math.round(leg.minutes)} minutes each way ${WAY_LABEL[way].toLowerCase()}${fare !== undefined ? `, ${formatMoney(fare, cur)} a ride` : ''}${way === 'car' ? ', its fuel and the meter while it’s parked' : ''}. Setting out opens ${SET_OUT_HOURS} hours before ${formatDate(now, zone)} at ${formatTime(now, zone)}; it can be joined until halfway. Staying after is ${SOCIAL_MINUTES} minutes more, and someone else from it met.${attendOf(m) === 'always' ? ` Each meeting not answered no is gone to on its own, ${WAY_LABEL[m.by ?? 'foot'].toLowerCase()}, its fares, fuel and meter paid, and missed where the way there can’t be taken.` : ''}`}</div>

      {(m.log ?? []).length > 0 && (
        <ul className="list-plain xs dim">
          {(m.log ?? []).slice(0, 6).map((l) => <li key={l.at}>{`${formatDate(l.at, zone)}: ${l.what === 'went' ? 'Went' : l.what === 'missed' ? 'Missed' : l.what === 'declined' ? 'Not going' : 'Canceled'}${l.note ? `, ${l.note}` : ''}`}</li>)}
        </ul>
      )}
    </div>
  );
}

/** The clock stopped at the time to set out for a meeting: go, by the way chosen, or not this time. */
export function ClubSetOut({ clubId, meetingAt, onDone, onClose }: { clubId: string; meetingAt: number; onDone: () => void; onClose: () => void }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const { modes, cars } = useWays();
  const club = clubById(clubId);
  const m = membershipsOf(person).find((x) => x.clubId === clubId);
  const [way, setWay] = useState<TripMode>(m?.by && modes.includes(m.by) ? m.by : 'foot');
  const [car, setCar] = useState<string>(m?.vehicleId ?? cars[0]?.id ?? '');
  const [stay, setStay] = useState(false);
  if (!club || !m) return null;
  const zone = CITIES.require(club.cityId).timeZone;
  const no = goRefusal(sim, person, club.id, way, way === 'car' ? car : undefined);
  const leg = legTo(club, way);
  return (
    <Modal
      title={`Set Out For ${club.name}`}
      onClose={onClose}
      footer={(
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Stand Here</button>
          <Gated feature="club.rsvp" className="btn" onClick={() => { run('club.rsvp', { clubId, at: meetingAt, going: false }, { silent: true }); onDone(); }}>Not This Time</Gated>
          <Gated feature="club.go" className="btn btn-primary" disabled={Boolean(no)} title={no} onClick={() => {
            const r = run<{ minutes: number; met?: string }>('club.go', { clubId, by: way, ...(way === 'car' ? { vehicleId: car } : {}), ...(stay ? { stayAfter: true } : {}) });
            if (r.ok) { toast(`Back from ${club.name}${r.value?.met ? `; you met ${r.value.met}` : ''}.`, 'positive'); onDone(); }
          }}>Set Out</Gated>
        </>
      )}
    >
      <p className="small">{`${club.name} meets at ${club.place} at ${formatTime(meetingAt, zone)}, for ${club.minutes} minutes.`}</p>
      <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="xs dim" htmlFor="set-out-way">Way There</label>
        <select id="set-out-way" className="input input-sm" value={way} onChange={(e) => setWay(e.target.value as TripMode)}>
          {modes.map((w) => <option key={w} value={w}>{WAY_LABEL[w]}</option>)}
        </select>
        {way === 'car' && (
          <select aria-label="Which Car" className="input input-sm" value={car} onChange={(e) => setCar(e.target.value)}>
            {cars.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        )}
        <label className="xs"><input type="checkbox" checked={stay} onChange={(e) => setStay(e.target.checked)} /> Stay After</label>
      </div>
      <p className="xs dim">{no ?? `${Math.round(leg.minutes)} minutes each way; you’re back about ${formatTime(meetingAt + (club.minutes + leg.minutes + (stay ? SOCIAL_MINUTES : 0)) * 60_000, zone)}.`}</p>
    </Modal>
  );
}
