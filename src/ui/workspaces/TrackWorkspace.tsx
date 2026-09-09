import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Meter, Stat } from '@/ui/components/primitives';
import { formatDate } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';
import { plural } from '@/engine/core/text';
import { ageOf } from '@/engine/systems/lifespan';
import { schoolingOf } from '@/engine/systems/school';
import { studiesOf } from '@/engine/systems/university';
import {
  SESSIONS, abilityFor, bestFor, chasing, classOf, describeMark, describeRunner, describeSeason,
  eventsOpenTo, formNow, formatSeconds, formatWind, isInjured, mayTurnPro, nextMeet, offerFor,
  ordinal, predict, qualifiedFor, runningOf, seasonOf, seasonsOf, schoolHasTrack,
} from '@/engine/systems/athletics';
import {
  ATHLETICS_NOTE, CATEGORY_LABEL, CONTRACT_NOTE, EVENT_BY_ID, LEVELS, LEVEL_BY_ID, MEETS_NOTE,
  PRIME_NOTE, PRIZE_NOTE, PRO_NOTE, RECORDS_NOTE, ROUND_LABEL, SELECTION_NOTE, STANDARDS_NOTE,
  TIER_LABEL, TRACK_FROM_AGE, WIND_NOTE, ladderFor, levelOf, standardFor, timeForLevel,
} from '@/engine/content/athletics';
import { countryOfCity } from '@/engine/content/geography';

/**
 * The track.
 *
 * The one sport in the game, and the whole of it: the events, the work, the
 * season, every round of every meet and the marks that come out of them. The
 * events, the meets, the records and the standards are real. Everybody else
 * in the lane is SLATE's own, and so is every time run here.
 */
export function TrackWorkspace() {
  const { sim, run, toast } = useGame();
  const now = useWorld((s) => s.now);
  void now;
  const running = runningOf(sim);
  const season = seasonOf(sim);
  const age = ageOf(sim);
  const countryId = countryOfCity(sim.player.currentLocationId) ?? sim.player.citizenshipId;
  const schooling = schoolingOf(sim);
  const studies = studiesOf(sim);
  const [session, setSession] = useState('speed');

  const surface = (season?.surface ?? 'outdoor') as 'indoor' | 'outdoor';
  const category = (running?.category ?? (sim.player.gender === 'female' ? 'womens' : 'mens')) as 'mens' | 'womens';
  const open = running ? eventsOpenTo(sim, running, surface) : [];

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Track</div>
        <h1>{running ? describeRunner(running) : 'Nobody has put you in a lane yet.'}</h1>
        <p className="muted">
          {CATEGORY_LABEL[category]}
          {running?.teamName ? ` · ${running.teamName}` : ''}
          {running ? ` · ${plural(running.sessions, 'session')} put in` : ''}
        </p>
      </div>

      <div className="grid grid-sheet">
        {!running && (
          <Panel title="The Trial" subtitle="Somebody has to put you in a lane first.">
            <div className="col gap-3">
              <p className="small" style={{ margin: 0 }}>
                {age < TRACK_FROM_AGE
                  ? `Nobody is put in a lane before ${TRACK_FROM_AGE}. You are ${age}.`
                  : studies
                    ? `${studies.universityName} holds trials. A university squad is a great deal harder to make than a school one.`
                    : schooling
                      ? schoolHasTrack(sim, schooling.placeId, countryId)
                        ? `${schooling.placeName} runs a track team, and there’s a trial.`
                        : `${schooling.placeName} doesn’t run a track team. Not every school does.`
                      : 'You aren’t at a school or a university. A club is the way in from here.'}
              </p>
              <div>
                <button
                  className="btn btn-primary"
                  disabled={age < TRACK_FROM_AGE}
                  onClick={() => {
                    const res = run<{ note: string; onTheTeam: boolean }>('track.join', {});
                    if (res.ok) toast(res.value!.note, res.value!.onTheTeam ? 'positive' : 'negative');
                  }}
                >
                  Go To The Trial
                </button>
              </div>
              <p className="xs dim" style={{ margin: 0 }}>{ATHLETICS_NOTE}</p>
            </div>
          </Panel>
        )}

        {running && (
          <>
            <Panel title="Where You Are" subtitle="Form goes off from the day you last worked on it.">
              <div className="col gap-3">
                <Meter label="Form" value={formNow(sim, running)} hint="Built by sessions, lost by weeks off." />
                {isInjured(sim, running) && (
                  <p className="small" style={{ margin: 0 }}>
                    <strong>{running.injury}</strong> Back on{' '}
                    {formatDate(running.injuredUntil ?? sim.now, sim.homeZone)}.
                  </p>
                )}
                <div className="row gap-3 wrap">
                  {running.eventIds.map((id) => {
                    const event = EVENT_BY_ID[id];
                    const on = predict(sim, sim.player, id, running);
                    return (
                      <Stat
                        key={id}
                        label={event?.label ?? id}
                        value={on === undefined ? '—' : formatSeconds(on)}
                        note={`On today's form. Ability ${abilityFor(sim, sim.player, id)}.`}
                      />
                    );
                  })}
                </div>
              </div>
            </Panel>

            <Panel title="The Events" subtitle="Three at a meet is as many as anybody runs." flush>
              <div className="list">
                {open.map((event) => {
                  const entered = running.eventIds.includes(event.id);
                  const best = bestFor(running, event.id, surface);
                  const standard = standardFor(event.id, category);
                  return (
                    <div key={event.id} className="list-item list-static">
                      <div className="grow">
                        <div className="small strong">{event.label}</div>
                        <div className="xs dim">
                          {best ? `Best ${describeMark(best)}. ${levelOf(best.seconds, event.id, category).label}.` : event.about}
                        </div>
                        <div className="xs dim">
                          {chasing(event.id, category, surface) ?? ''}
                          {standard ? ` The entry standard is ${formatSeconds(standard)}.` : ''}
                        </div>
                      </div>
                      <button
                        className={`btn btn-sm${entered ? ' btn-primary' : ''}`}
                        onClick={() => {
                          const next = entered
                            ? running.eventIds.filter((one) => one !== event.id)
                            : [...running.eventIds, event.id];
                          const res = run<{ note: string }>('track.enter', { eventIds: next });
                          if (res.ok) toast(res.value!.note, 'positive');
                        }}
                      >
                        {entered ? 'Entered' : 'Enter'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel title="The Work" subtitle="A season is made in the winter, where nobody sees it.">
              <div className="col gap-3">
                <label className="label" htmlFor="session-pick">The Session</label>
                <select
                  id="session-pick"
                  className="input"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                >
                  {SESSIONS.map((one) => <option key={one.id} value={one.id}>{one.label}</option>)}
                </select>
                <p className="xs dim" style={{ margin: 0 }}>
                  {SESSIONS.find((one) => one.id === session)?.about}
                </p>
                <div>
                  <button
                    className="btn btn-primary"
                    disabled={isInjured(sim, running)}
                    onClick={() => {
                      const res = run<{ note: string; injury?: string }>('track.train', { kind: session });
                      if (res.ok) toast(res.value!.note, res.value!.injury ? 'negative' : 'positive');
                    }}
                  >
                    Do The Session
                  </button>
                </div>
              </div>
            </Panel>
          </>
        )}

        {running && !season && (
          <Panel title="The Season" subtitle="There’s no season running.">
            <div className="col gap-3">
              <p className="small" style={{ margin: 0 }}>
                {ladderFor(
                  (running.stage ?? 'school') as 'school' | 'university' | 'professional',
                  surface,
                  countryId,
                )?.about ?? 'SLATE carries no season here.'}
              </p>
              <div>
                <button
                  className="btn"
                  onClick={() => {
                    const res = run<{ note: string; onTheTeam: boolean }>('track.join', {});
                    if (res.ok) toast(res.value!.note, res.value!.onTheTeam ? 'positive' : 'negative');
                  }}
                >
                  Go To The Trial
                </button>
              </div>
            </div>
          </Panel>
        )}

        {running && <ProPanel />}

        {season && <SeasonPanel />}

        {running && running.bests.length > 0 && (
          <Panel title="Personal Bests" subtitle="Every legal mark, and what each one is worth." flush>
            <div className="list">
              {running.bests.map((mark) => (
                <div key={`${mark.eventId}-${mark.surface}`} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">
                      {EVENT_BY_ID[mark.eventId]?.label ?? mark.eventId}
                      {mark.surface === 'indoor' ? ' · Indoor' : ''}
                    </div>
                    <div className="xs dim">
                      {mark.where} · {formatDate(mark.at, sim.homeZone)}
                    </div>
                  </div>
                  <span className="badge badge-quiet">{describeMark(mark)}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        <Panel title="What A Time Is Worth" subtitle="SLATE's own ladder, read against the world record." flush>
          <div className="list">
            {LEVELS.filter((one) => one.id !== 'first_day').map((level) => {
              const event = running?.eventIds[0] ?? (category === 'womens' ? '100m' : '100m');
              const at = timeForLevel(level.id, event, category);
              return (
                <div key={level.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{level.label}</div>
                    <div className="xs dim">{level.about}</div>
                  </div>
                  <span className="badge badge-quiet">{at === undefined ? '—' : formatSeconds(at)}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="What Is Real Here">
          <div className="col gap-2">
            <p className="xs dim" style={{ margin: 0 }}>{ATHLETICS_NOTE}</p>
            <p className="xs dim" style={{ margin: 0 }}>{RECORDS_NOTE}</p>
            <p className="xs dim" style={{ margin: 0 }}>{MEETS_NOTE}</p>
            <p className="xs dim" style={{ margin: 0 }}>{STANDARDS_NOTE}</p>
            <p className="xs dim" style={{ margin: 0 }}>{WIND_NOTE}</p>
            <p className="xs dim" style={{ margin: 0 }}>{PRIME_NOTE}</p>
          </div>
        </Panel>
      </div>
    </>
  );
}

/**
 * Turning professional, and what it is worth.
 *
 * The companies are real and they really sponsor runners. Every contract in
 * here is SLATE's own: no figure is anybody's real deal.
 */
function ProPanel(): JSX.Element | null {
  const { sim, run, toast } = useGame();
  const now = useWorld((s) => s.now);
  void now;
  const running = runningOf(sim);
  if (!running) return null;
  const may = mayTurnPro(sim, running);
  const offer = offerFor(sim, running);
  const level = LEVEL_BY_ID[classOf(running)];
  const contract = running.contract;

  return (
    <Panel
      title={running.professional ? 'Professional' : 'Turning Professional'}
      subtitle={running.professional
        ? `${running.teamName ?? 'A Group'}. ${level?.label ?? ''}`
        : 'A decision with a cost, and it’s yours.'}
    >
      <div className="col gap-3">
        {running.stage === 'retired' ? (
          <p className="small" style={{ margin: 0 }}>You’re retired. The times stand.</p>
        ) : !running.professional ? (
          <>
            <p className="small" style={{ margin: 0 }}>
              {may.yes
                ? `You are ${level?.label.toLowerCase() ?? 'unranked'}. ${offer
                  ? `${offer.brand} would put ${formatMoney(offer.aYear)} a year on the table.`
                  : 'Nobody is offering a contract on those times yet.'}`
                : may.why}
            </p>
            <div>
              <button
                className="btn btn-primary"
                disabled={!may.yes}
                onClick={() => {
                  const res = run<{ note: string }>('track.turn_pro', {});
                  if (res.ok) toast(res.value!.note, 'positive');
                }}
              >
                Turn Professional
              </button>
            </div>
            <p className="xs dim" style={{ margin: 0 }}>{PRO_NOTE}</p>
          </>
        ) : (
          <>
            {contract ? (
              <div className="row gap-3 wrap">
                <Stat label="Contract" value={contract.brand} note={`Until ${formatDate(contract.to, sim.homeZone)}`} />
                <Stat label="A Year" value={formatMoney(contract.aYear)} note="Paid on the anniversary." />
                <Stat label="A Global Medal" value={formatMoney(contract.medalBonus)} note="On top, if it happens." />
              </div>
            ) : (
              <>
                <p className="small" style={{ margin: 0 }}>
                  {offer
                    ? `${offer.brand} would put ${formatMoney(offer.aYear)} a year on the table for ${plural(offer.years, 'year')}.`
                    : 'Nobody is offering anything on those times.'}
                </p>
                <div>
                  <button
                    className="btn btn-primary"
                    disabled={!offer}
                    onClick={() => {
                      const res = run<{ note: string }>('track.sign', {});
                      if (res.ok) toast(res.value!.note, 'positive');
                    }}
                  >
                    Sign It
                  </button>
                </div>
              </>
            )}
            <div>
              <button
                className="btn btn-sm"
                onClick={() => {
                  const res = run<{ note: string }>('track.retire', {});
                  if (res.ok) toast(res.value!.note, 'negative');
                }}
              >
                Hang Them Up
              </button>
            </div>
            <p className="xs dim" style={{ margin: 0 }}>{CONTRACT_NOTE}</p>
            <p className="xs dim" style={{ margin: 0 }}>{PRIZE_NOTE}</p>
            <p className="xs dim" style={{ margin: 0 }}>{SELECTION_NOTE}</p>
          </>
        )}
      </div>
    </Panel>
  );
}

/** The season, meet by meet, with every round of every one of them. */
function SeasonPanel(): JSX.Element | null {
  const { sim, run, toast } = useGame();
  const now = useWorld((s) => s.now);
  void now;
  const season = seasonOf(sim);
  const running = runningOf(sim);
  const past = seasonsOf(sim).filter((one) => one.endedAt).slice(0, 4);
  if (!season || !running) return null;

  const next = nextMeet(season);
  const ready = next ? sim.now >= next.at - 6 * 60 * 60_000 : false;
  const qualified = next ? qualifiedFor(season, next) : { yes: true, why: '' };

  return (
    <>
      <Panel
        title="The Season"
        subtitle={`${season.teamName} · ${season.surface === 'indoor' ? 'Indoor' : 'Outdoor'} ${season.year}`}
      >
        <div className="col gap-3">
          <p className="small" style={{ margin: 0 }}>{describeSeason(sim, season)}</p>
          {next && !qualified.yes && (
            <p className="small" style={{ margin: 0 }}><strong>{qualified.why}</strong></p>
          )}
          <div className="row gap-2 wrap">
            <button
              className="btn btn-sm btn-primary"
              disabled={!next || !ready || isInjured(sim, running)}
              onClick={() => {
                const res = run<{ note: string; injury?: string }>('track.race', {});
                if (res.ok) toast(res.value!.note, res.value!.injury ? 'negative' : 'positive');
              }}
            >
              {!next ? 'Nothing Left' : isInjured(sim, running) ? 'You Are Hurt' : ready ? 'Race It' : 'Not Yet'}
            </button>
            <button
              className="btn btn-sm"
              disabled={!next}
              onClick={() => {
                const res = run<{ note: string }>('track.skip_meet', {});
                if (res.ok) toast(res.value!.note, 'negative');
              }}
            >
              Sit It Out
            </button>
            <button
              className="btn btn-sm"
              onClick={() => {
                const res = run<{ note: string }>('track.leave', {});
                if (res.ok) toast(res.value!.note, 'negative');
              }}
            >
              Leave The Squad
            </button>
          </div>

          <div className="list">
            {season.meets.map((meet, i) => (
              <div key={`${meet.at}-${i}`} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{meet.name}</div>
                  <div className="xs dim">
                    {TIER_LABEL[meet.tier as keyof typeof TIER_LABEL]} · {formatDate(meet.at, sim.homeZone)}
                    {meet.cityId || meet.town ? ` · ${meet.town}` : ''}
                  </div>
                  {meet.results.map((result, r) => (
                    <div key={r} className="xs dim">
                      {EVENT_BY_ID[result.eventId]?.label ?? result.eventId}
                      {' · '}{ROUND_LABEL[result.round as keyof typeof ROUND_LABEL]}
                      {' · '}{formatSeconds(result.seconds)}
                      {result.wind === undefined ? '' : ` (${formatWind(result.wind)})`}
                      {' · '}{ordinal(result.place)} of {result.of}
                      {result.personalBest ? ' · Personal Best' : ''}
                      {result.legal ? '' : ' · Wind Assisted'}
                    </div>
                  ))}
                </div>
                {meet.run ? (
                  <span className={`badge ${meet.place === 1 ? 'badge-positive' : 'badge-quiet'}`}>
                    {meet.locked ? 'Did Not Run' : meet.place ? ordinal(meet.place) : 'Run'}
                  </span>
                ) : (
                  <span className="badge badge-quiet">To Come</span>
                )}
              </div>
            ))}
          </div>
          <p className="xs dim" style={{ margin: 0 }}>{MEETS_NOTE}</p>
        </div>
      </Panel>

      {past.length > 0 && (
        <Panel title="Seasons Behind You" flush>
          <div className="list">
            {past.map((one) => (
              <div key={one.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{one.teamName}</div>
                  <div className="xs dim">{describeSeason(sim, one)}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
