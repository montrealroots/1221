/**
 * SLATE — the Player Profile (from the connected attributes of 2026-10-09):
 * who this actor is, what they can do, what they love and have done about
 * it, how they are today, the school so far, and what’s changed.
 *
 * Every section reads where the engine keeps the thing: the character sheet
 * as it was made, the abilities from their one place each, the techniques
 * from the craft, interests and genres from the engagement record, the day
 * from wellbeing and the evaluation’s own condition, the school from its
 * record, the history from the development ledger and the finished work.
 * Nothing is drawn for the screen. What it suggests comes from the last
 * work’s limits and the hours already spent, and changes when they do.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine, Empty } from '@/ui/components/primitives';
import { Gated, useFeature } from '@/ui/guide/Guide';
import { LookRegion, Open, at } from '@/ui/looks';
import { targetLabel, targetSubject, sourceWords, masteredOf } from '@/ui/looks/actor';
import { formatDate, ageOn } from '@/engine/core/time';
import { CITIES, REGIONS, COUNTRIES } from '@/engine/content/geography';
import { ABILITY_DEFS, MASTERED, TECHNIQUES, TECHNIQUE_LABEL, type AbilityId } from '@/engine/content/abilities';
import { exerciseFor, PRACTICE } from '@/engine/content/practice';
import { INTEREST_DEFS, phaseOf } from '@/engine/content/engagement';
import { ALL_INTERESTS, FILM_GENRES, GENRE_BY_ID, INTEREST_BY_ID } from '@/engine/content/interests';
import { PERSONALITY_TRAIT_BY_ID } from '@/engine/content/personality-traits';
import { EVALUATION } from '@/engine/content/tasks';
import { abilityFull, abilityOf, developmentOf } from '@/engine/systems/attributes';
import { conditionAt, reachOf, STANDING_LABEL, yearOfStudy } from '@/engine/systems/school';
import { practicedToday, practiceRefusal } from '@/engine/systems/practice';
import { pursueRefusal, restOf, satiationNow, selfTapeRefusal, studyRefusal } from '@/engine/systems/engagement';
import { readiness } from '@/engine/systems/life';
import { inTheBank } from '@/engine/systems/spending';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { coverOn } from '@/engine/systems/health';
import { genresOfPlay } from '@/engine/content/plays';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine/core/simulation';

const one = (x: number) => x.toFixed(1);

/** What the latest work was held back by most, summed over the last five: the next thing to practice. */
export function nextPractice(person: Person): { what: string; kind: string; by: number; pieces: number } | undefined {
  const sums = new Map<string, { what: string; kind: string; by: number; pieces: number; seen?: unknown }>();
  for (const w of (person.work ?? []).slice(-5)) {
    for (const l of w.limits) {
      if (l.kind !== 'ability' && l.kind !== 'technique') continue;
      const k = sums.get(l.what) ?? { what: l.what, kind: l.kind, by: 0, pieces: 0 };
      k.by += l.by;
      if (k.seen !== w) { k.pieces += 1; k.seen = w; }
      sums.set(l.what, k);
    }
  }
  const best = [...sums.values()].sort((a, b) => b.by - a.by)[0];
  return best ? { what: best.what, kind: best.kind, by: best.by, pieces: best.pieces } : undefined;
}

/** An interest to spend an hour on now: loved and least satiated, else the restful one longest left. */
export function nextInterest(sim: Simulation, person: Person): string | undefined {
  const by = (ids: string[]) => ids.filter((id) => INTEREST_DEFS[id]?.recovery).sort((a, b) => satiationNow(person.engagement?.byInterest[a], sim.now) - satiationNow(person.engagement?.byInterest[b], sim.now) || (person.engagement?.byInterest[a]?.lastAt ?? 0) - (person.engagement?.byInterest[b]?.lastAt ?? 0))[0];
  return by(ALL_INTERESTS.filter((i) => restOf(person, i.id, sim.now).loved).map((i) => i.id)) ?? by(ALL_INTERESTS.map((i) => i.id));
}

/** A genre to study: the next part’s play’s kind least known, else a loved one least known. */
export function nextGenre(person: Person): string | undefined {
  const fam = (id: string) => person.engagement?.byGenre[id]?.familiarity ?? 0;
  const casting = person.school?.casting as { play?: string } | undefined;
  const play = (genresOfPlay(casting?.play) ?? []).filter((g) => GENRE_BY_ID[g]);
  const loved = (person.genres ?? []).filter((g) => GENRE_BY_ID[g]);
  return [...play].sort((a, b) => fam(a) - fam(b))[0] ?? [...loved].sort((a, b) => fam(a) - fam(b))[0];
}

export function ProfileWorkspace() {
  const { open } = useFeature('ui.profile');
  const person = useWorld((s) => s.player);
  if (!open) return <Empty title="Your Profile" body="It opens with its chapter in the guide." />;
  if (!person.craft) return <Empty title="Your Profile" body="This life has no craft to read." />;
  return (
    <>
      <LookRegion className="page-head">
        <div className="eyebrow">Player Profile</div>
        <h1>{person.displayName}</h1>
      </LookRegion>
      <div className="col gap-5">
        <IdentityPanel />
        <AbilitiesPanel />
        <TechniquesPanel />
        <InterestsPanel />
        <GenresPanel />
        <ConditionPanel />
        <JourneyPanel />
        <HistoryPanel />
      </div>
    </>
  );
}

function IdentityPanel() {
  const { sim, navigate } = useGame();
  const person = useWorld((s) => s.player);
  // Home is a town where one's known, else a region (`homeRegionId` holds either).
  const home = CITIES.get(person.homeRegionId)?.name ?? REGIONS.get(person.homeRegionId)?.name;
  const country = COUNTRIES.get(person.citizenshipId);
  const cur = saveCurrency(sim.universe);
  const cover = coverOn(person, sim.now);
  const money = `Money, ${formatMoney(inTheBank(sim, person), cur)}`;
  return (
    <Panel title="Identity And Background" subtitle="As the character was made">
      <div className="col gap-3">
        <div className="grid grid-3">
          <Stat label="Age" value={String(ageOn(person.birthInstant, sim.now, sim.zone))} note={`Born ${formatDate(person.birthInstant, sim.zone)}`} />
          <Stat label="From" value={home ?? 'Not On The Map'} note={country ? `A citizen of ${country.name}` : undefined} />
          <Stat label="Pronouns" value={person.pronouns} note={person.performerTitle === 'actress' ? 'Billed as an actress' : 'Billed as an actor'} />
        </div>
        {person.personalityTraits.length > 0 && (
          <p className="small" style={{ margin: 0 }}>Chosen at the start: {person.personalityTraits.map((t) => PERSONALITY_TRAIT_BY_ID[t]?.name ?? t).join(', ')}.</p>
        )}
        <div className="row gap-2 wrap">
          <button type="button" className="btn btn-sm" onClick={() => navigate('/workspace/bank', 'Money')}>{money}</button>
          <button type="button" className="btn btn-sm" onClick={() => navigate('/workspace/papers', 'Papers')}>{cover ? 'Papers, Covered' : 'Papers, No Health Cover'}</button>
        </div>
        <Fine>Who somebody is decides nothing about how good they are: no ability here is drawn from a name, a portrait, an ethnicity or a gender.</Fine>
      </div>
    </Panel>
  );
}

function PracticeButton({ id }: { id: AbilityId | (typeof TECHNIQUES)[number] }) {
  const { sim, run } = useGame();
  const person = useWorld((s) => s.player);
  const e = exerciseFor(id);
  if (!e) return <span className="xs dim">{id === 'stamina' ? 'A workout, from Look After Yourself' : id === 'discipline' ? 'Practice kept up, day after day' : 'A house grows it'}</span>;
  const no = practiceRefusal(sim, person, e);
  return (
    <Gated feature="practice.exercise" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? e.how} onClick={() => run('practice.exercise', { exercise: e.id })}>
      {e.label}
    </Gated>
  );
}

function AbilitiesPanel() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const next = nextPractice(person);
  return (
    <Panel title="Attributes And Craft" subtitle={`Twelve abilities, 0 to 100; today’s practice ${practicedToday(sim, person)} of ${PRACTICE.dailyHours} hours`}>
      <div className="col gap-3">
        {next && <p className="small" style={{ margin: 0 }}>Your latest work was held back most by <Open subject={targetSubject(next.what as AbilityId)}>{targetLabel(next.what as AbilityId)}</Open>: {one(next.by / next.pieces)} points a piece, across its dimensions, in {next.pieces} of the last five.</p>}
        <LookRegion className="table-scroll">
          <table>
            <thead><tr><th scope="col">Ability</th><th scope="col" className="num">Now</th><th scope="col" className="num">Full</th><th scope="col" className="num">Classes Reach</th><th scope="col">Practice</th></tr></thead>
            <tbody>
              {ABILITY_DEFS.map((d) => (
                <tr key={d.id}>
                  <td className="nowrap"><Open subject={at('ability', d.id)}>{d.label}</Open></td>
                  <td className="num mono">{one(abilityOf(sim, person, d.id))}</td>
                  <td className="num mono">{one(abilityFull(sim, person, d.id))}</td>
                  <td className="num mono">{one(Math.min(abilityFull(sim, person, d.id), reachOf(person, d.id)))}</td>
                  <td className="nowrap"><PracticeButton id={d.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </LookRegion>
        <Fine>Classes and the work grow an ability toward its reach; deliberate practice goes past it to full. The same exercise again the same day gives half; past {PRACTICE.dailyHours} hours a day, practice stops counting (Ericsson et al., 1993).</Fine>
      </div>
    </Panel>
  );
}

function TechniquesPanel() {
  const person = useWorld((s) => s.player);
  const craft = person.craft!;
  return (
    <Panel title="Techniques" subtitle={`Seventeen learned methods; mastered at ${MASTERED}`}>
      <LookRegion className="table-scroll">
        <table>
          <thead><tr><th scope="col">Technique</th><th scope="col" className="num">Now</th><th scope="col" className="num">Classes Reach</th><th scope="col">Mastered</th><th scope="col">Practice</th></tr></thead>
          <tbody>
            {TECHNIQUES.map((t) => (
              <tr key={t}>
                <td className="nowrap"><Open subject={at('skill', t)}>{TECHNIQUE_LABEL[t]}</Open></td>
                <td className="num mono">{one(craft[t])}</td>
                <td className="num mono">{one(reachOf(person, t))}</td>
                <td>{masteredOf(craft[t]) ? 'Yes' : `${one(MASTERED - craft[t])} To Go`}</td>
                <td className="nowrap"><PracticeButton id={t} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </LookRegion>
    </Panel>
  );
}

function InterestsPanel() {
  const { sim, run } = useGame();
  const person = useWorld((s) => s.player);
  const suggested = nextInterest(sim, person);
  const [pick, setPick] = useState<string>(suggested ?? ALL_INTERESTS[0]!.id);
  const engaged = Object.entries(person.engagement?.byInterest ?? {}).sort((a, b) => (b[1].lastAt ?? 0) - (a[1].lastAt ?? 0));
  const no = pursueRefusal(sim, person, pick);
  return (
    <Panel title="Interests" subtitle={`${person.interests.length} loved; ${engaged.length} pursued`}>
      <div className="col gap-3">
        <p className="small" style={{ margin: 0 }}>You love: {person.interests.length ? person.interests.map((id, i) => <span key={id}>{i ? ', ' : ''}<Open subject={at('interest', id)}>{INTEREST_BY_ID[id]?.label ?? id}</Open></span>) : 'nothing chosen'}.{suggested ? <> An hour of <Open subject={at('interest', suggested)}>{INTEREST_BY_ID[suggested]!.label}</Open> would rest you most now.</> : null}</p>
        <div className="row gap-2 wrap">
          <label className="small" htmlFor="interest-pick">Interest</label>
          <select id="interest-pick" value={pick} onChange={(e) => setPick(e.target.value)}>
            {ALL_INTERESTS.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
          <Gated feature="interest.pursue" className="btn btn-sm" disabled={Boolean(no)} title={no ?? INTEREST_DEFS[pick]?.activity} onClick={() => run('interest.pursue', { interest: pick })}>Spend An Hour On It</Gated>
        </div>
        {engaged.length > 0 && (
          <LookRegion className="table-scroll">
            <table>
              <thead><tr><th scope="col">Interest</th><th scope="col" className="num">Familiarity</th><th scope="col">Phase</th><th scope="col" className="num">Sessions</th><th scope="col" className="num">Satiated</th><th scope="col">Last</th></tr></thead>
              <tbody>
                {engaged.slice(0, 12).map(([id, s]) => (
                  <tr key={id}>
                    <td className="nowrap"><Open subject={at('interest', id)}>{INTEREST_BY_ID[id]?.label ?? id}</Open></td>
                    <td className="num mono">{one(s.familiarity)}</td>
                    <td>{phaseOf(s.familiarity)}</td>
                    <td className="num mono">{s.sessions}</td>
                    <td className="num mono">{Math.round(satiationNow(s, sim.now) * 100)}%</td>
                    <td>{s.lastAt ? formatDate(s.lastAt, sim.zone) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </LookRegion>
        )}
      </div>
    </Panel>
  );
}

function GenresPanel() {
  const { sim, run } = useGame();
  const person = useWorld((s) => s.player);
  const suggested = nextGenre(person);
  const [pick, setPick] = useState<string>(suggested ?? FILM_GENRES[0]!.id);
  const engaged = Object.entries(person.engagement?.byGenre ?? {}).sort((a, b) => (b[1].lastAt ?? 0) - (a[1].lastAt ?? 0));
  const study = studyRefusal(sim, person, pick);
  const tape = selfTapeRefusal(sim, person, pick);
  return (
    <Panel title="Genres" subtitle={`${(person.genres ?? []).length} loved; ${engaged.length} studied or practiced`}>
      <div className="col gap-3">
        <p className="small" style={{ margin: 0 }}>You love: {(person.genres ?? []).length ? (person.genres ?? []).map((id, i) => <span key={id}>{i ? ', ' : ''}<Open subject={at('genre', id)}>{GENRE_BY_ID[id]?.label ?? id}</Open></span>) : 'none chosen'}.{suggested ? <> <Open subject={at('genre', suggested)}>{GENRE_BY_ID[suggested]!.label}</Open> is the one your work asks for next, least known.</> : null}</p>
        <div className="row gap-2 wrap">
          <label className="small" htmlFor="genre-pick">Genre</label>
          <select id="genre-pick" value={pick} onChange={(e) => setPick(e.target.value)}>
            {FILM_GENRES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
          <Gated feature="genre.study" className="btn btn-sm" disabled={Boolean(study)} title={study ?? 'An hour and a half with a work of the kind'} onClick={() => run('genre.study', { genre: pick })}>Study It</Gated>
          <Gated feature="practice.self_tape" className="btn btn-sm" disabled={Boolean(tape)} title={tape ?? 'Tape a scene in it, judged as finished work'} onClick={() => run('practice.self_tape', { genre: pick })}>Tape A Scene In It</Gated>
        </div>
        {engaged.length > 0 && (
          <LookRegion className="table-scroll">
            <table>
              <thead><tr><th scope="col">Genre</th><th scope="col" className="num">Familiarity</th><th scope="col" className="num">Practice</th><th scope="col">Last</th></tr></thead>
              <tbody>
                {engaged.slice(0, 12).map(([id, g]) => (
                  <tr key={id}>
                    <td className="nowrap"><Open subject={at('genre', id)}>{GENRE_BY_ID[id]?.label ?? id}</Open></td>
                    <td className="num mono">{one(g.familiarity)}</td>
                    <td className="num mono">{one(g.practice)}</td>
                    <td>{g.lastAt ? formatDate(g.lastAt, sim.zone) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </LookRegion>
        )}
        <Fine>Loving a genre makes a day of work in it better. Knowing it and having worked in it make its work quicker to prepare; neither caps it.</Fine>
      </div>
    </Panel>
  );
}

function ConditionPanel() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const c = conditionAt(sim, person, sim.now);
  const w = person.wellbeing;
  const sufficient = c.readiness >= EVALUATION.sufficientReadiness;
  return (
    <Panel title="Current Condition" subtitle="What today’s work meets">
      <div className="col gap-3">
        <div className="grid grid-3">
          <Stat label="Readiness" value={String(Math.round(readiness(person)))} note={`${Math.round(c.readiness)} at this hour’s fit`} />
          <Stat label="For Work" value={sufficient && !c.ill && !c.injured ? 'Sufficient' : 'Held Back'} tone={sufficient && !c.ill && !c.injured ? undefined : 'warning'} note={!sufficient ? `Under ${EVALUATION.sufficientReadiness}: fatigue holds back the work that reads it` : c.ill ? 'The flu holds back the voice' : c.injured ? 'An injury holds back the body' : 'Nothing today holds the work back'} />
          <Stat label="Energy, Stress" value={`${Math.round(w.energy)}, ${Math.round(w.stress)}`} note={`Sleep owed ${Math.round(w.sleepDebt)} hours`} />
        </div>
        <Fine>Tired, an actor’s attention and memory go before their reasoning does (Lim &amp; Dinges, 2010), so fatigue reaches the work’s execution, consistency and responsiveness and leaves its interpretation be.</Fine>
      </div>
    </Panel>
  );
}

function JourneyPanel() {
  const { sim, navigate } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school;
  const work = (person.work ?? []).slice(-8).reverse();
  return (
    <Panel title="School Journey" subtitle={school ? `${school.standing === 'graduated' ? 'Graduated' : `Year ${yearOfStudy(person)} of three`}, ${STANDING_LABEL[school.standing].toLowerCase()}` : 'No school'}>
      <div className="col gap-3">
        {school && <p className="small" style={{ margin: 0 }}>{(school.credits ?? []).length ? `On stage: ${(school.credits ?? []).map((c) => `${c.role} in ${c.production}`).join('; ')}.` : 'No production yet.'} <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/workspace/school', 'Your School')}>Your School</button></p>}
        {work.length ? (
          <LookRegion className="table-scroll">
            <table>
              <thead><tr><th scope="col">Work</th><th scope="col">What</th><th scope="col" className="num">Whole</th><th scope="col">Band</th><th scope="col">When</th></tr></thead>
              <tbody>
                {work.map((w) => (
                  <tr key={w.inputs.key}>
                    <td className="nowrap"><Open subject={at('work', w.inputs.key)}>{w.what}</Open></td>
                    <td>{w.taskLabel}</td>
                    <td className="num mono">{one(w.overall)}</td>
                    <td>{w.band ?? ''}</td>
                    <td>{formatDate(w.at, sim.zone)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </LookRegion>
        ) : <p className="small muted" style={{ margin: 0 }}>No finished work judged yet: a showing, a night or a self-tape is.</p>}
      </div>
    </Panel>
  );
}

function HistoryPanel() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const history = developmentOf(person).history.slice(-15).reverse();
  return (
    <Panel title="Development History" subtitle="The latest changes, newest first">
      {history.length ? (
        <LookRegion>
          <ul className="small" style={{ margin: 0 }}>
            {history.map((h, i) => (
              <li key={i}>{formatDate(h.at, sim.zone)}: <Open subject={targetSubject(h.id as AbilityId)}>{targetLabel(h.id as AbilityId)}</Open> +{h.delta.toFixed(3)}, {sourceWords(h.source)}</li>
            ))}
          </ul>
        </LookRegion>
      ) : <p className="small muted" style={{ margin: 0 }}>Nothing yet: the history begins with the first class, step or hour of practice.</p>}
    </Panel>
  );
}
