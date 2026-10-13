/**
 * SLATE — the Player Profile (from the connected attributes of 2026-10-09, finished 2026-10-10): who this actor is,
 * what they can do, what they love and have done about it, how they are today, the school so far, and what's changed.
 *
 * Every section reads where the engine keeps the thing: the character sheet as it was made, the abilities from their
 * one place each, the techniques from the craft, the genres from the engagement record, the day from wellbeing and
 * the evaluation's own condition, the school from its record, the history from the development ledger, the recent
 * work and the journey's lasting counts. Nothing is drawn for the screen. What it suggests is worked out by the
 * engine's own comparisons (the last work's limits, the next part's play, and from 2026-10-12 the weakness the work for
 * life keeps coming back to, `systems/artistry.ts`), and changes with them. Identity is shown as
 * given and decides nothing: it is kept apart from every ability. An Interests section stood between the techniques
 * and the genres until 2026-10-10, when the owner removed the interests.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine, Empty } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { LookRegion, Open, at } from '@/ui/looks';
import { targetLabel, targetSubject, sourceWords, masteredOf, readersOf } from '@/ui/looks/actor';
import { formatDate, ageOn } from '@/engine/core/time';
import { ARTISTRY, identityOf } from '@/engine/systems/artistry';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import { ABILITY_DEFS, MASTERED, TECHNIQUES, TECHNIQUE_LABEL, type AbilityId } from '@/engine/content/abilities';
import { EXERCISE_BY_ID, EXERCISE_DESIGN, FOCUS, TIER, exerciseFor, PRACTICE, type PracticeFocus } from '@/engine/content/practice';
import { experienceOf, FEATURE_LABEL, practicedDaysAgo, recommendations } from '@/engine/systems/experience';
import { matchedTier } from '@/engine/systems/practice';
import { levelOf } from '@/engine/systems/attributes';
import { FILM_GENRES, GENRE_BY_ID } from '@/engine/content/film-genres';
import { ETHNICITIES } from '@/engine/content/ethnicity';
import { PERSONALITY_TRAIT_BY_ID } from '@/engine/content/personality-traits';
import type { Personality } from '@/engine/domain/model';
import { theCountry } from '@/engine/systems/documents';
import { CARRIES_A_BALANCE, cardOf } from '@/engine/systems/credit';

// Where `openCredit` starts a card’s autopay on the minimum, over `CARRIES_A_BALANCE`, is read from `systems/credit.ts`
// itself from 2026-10-13: until then it was kept here as a 65 of its own, since credit.ts didn’t export it.

/**
 * What Risk Tolerance did in this life, decided on the figure as `openCredit` decides it (from 2026-10-13). Until then
 * the line printed the rule beside every figure, “over 65, the card’s autopay starts on the minimum”, so a life at 65
 * read “over 65” while its autopay started on the whole statement. Every disposition is a whole number
 * (`cleanPersonality`, at creation and on every load), so the figure shown is the one decided on. Every life with a
 * Profile began at the drama school (`newLifeConfig`, since 2026-09-26), none of them with a charge card, which is paid in
 * full whatever this is: its bank is in New Haven, and no American bank’s card is one (`content/cards.ts`). Until
 * 2026-10-14 every one began from a wealthy family, with a card; since then a family is chosen, and the Nothing family's
 * life begins with no card, so the line says it set none rather than name an autopay that never started.
 */
function riskWords(person: Person, sim: Simulation): string {
  const side = person.personality.riskTolerance > CARRIES_A_BALANCE ? `over ${CARRIES_A_BALANCE}` : `${CARRIES_A_BALANCE} or under`;
  if (!cardOf(sim, person)) return `${side}, which sets where a card’s autopay starts; you hold no card, so it set none`;
  return person.personality.riskTolerance > CARRIES_A_BALANCE
    ? `over ${CARRIES_A_BALANCE}, so the card’s autopay started on the minimum`
    : `${CARRIES_A_BALANCE} or under, so the card’s autopay started on the whole statement`;
}

/** Each disposition, as creation names it, and what it does in play; Risk Tolerance’s, what it did in this life. */
const DISPOSITIONS: readonly [keyof Personality, string, string | ((person: Person, sim: Simulation) => string)][] = [
  ['emotionalStability', 'Emotional Stability', 'how fast stress comes and clears, and where composure starts'],
  ['conscientiousness', 'Conscientiousness', 'how well a night’s sleep restores you, and where discipline starts'],
  ['ambition', 'Ambition', 'how fast every stress comes'],
  ['riskTolerance', 'Risk Tolerance', riskWords],
  ['extraversion', 'Extraversion', 'how a house watching sits with you'],
  ['openness', 'Openness', 'how rehearsing new work does'],
  ['agreeableness', 'Agreeableness', 'how a rehearsal does'],
];
import { DIMENSION_LABEL, EVALUATION, TASK_PROFILES } from '@/engine/content/tasks';
import { DEMAND_LABEL, DEMAND_TECHNIQUE, GENRE_DEMANDS, applied, genreTags } from '@/engine/content/demands';
import { abilityFull, abilityOf, developmentOf } from '@/engine/systems/attributes';
import { classesGrow, conditionAt, reachOf, STANDING_LABEL, termStart, yearOfStudy } from '@/engine/systems/school';
import { practicedToday, practiceRefusal } from '@/engine/systems/practice';
import { studyRefusal } from '@/engine/systems/engagement';
import { BRIEF } from '@/engine/systems/briefs';
import { DEVELOPMENT } from '@/engine/content/abilities';
import { BAND_WORD } from '@/ui/looks/actor';
import { EVERYDAY_FITNESS, FITNESS, fitnessHeldUntil, lookAfterRefusal, readiness } from '@/engine/systems/life';
import { inTheBank } from '@/engine/systems/spending';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { coverOn } from '@/engine/systems/health';
import { genresOfPlay } from '@/engine/content/plays';
import { journeyOf, WORK_KEPT } from '@/engine/systems/evaluation';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine/core/simulation';
import { BriefPane, studiedWords } from '@/ui/components/BriefPane';
import { briefsOf } from '@/engine/content/briefs';

const one = (x: number) => x.toFixed(1);
const PAGE = 16;


/**
 * A genre to study, and why: the next part's play's kind least known, else a loved one least known. The why came
 * with it from 2026-10-10: until then a loved genre offered for want of a part was said to be what the next work asks.
 */
export function nextGenre(person: Person): { id: string; why: 'part' | 'loved' } | undefined {
  const fam = (id: string) => person.engagement?.byGenre[id]?.familiarity ?? 0;
  const casting = person.school?.casting as { play?: string } | undefined;
  const play = (genresOfPlay(casting?.play) ?? []).filter((g) => GENRE_BY_ID[g]);
  const loved = (person.genres ?? []).filter((g) => GENRE_BY_ID[g]);
  const forPart = [...play].sort((a, b) => fam(a) - fam(b))[0];
  if (forPart) return { id: forPart, why: 'part' };
  const fromLoved = [...loved].sort((a, b) => fam(a) - fam(b))[0];
  return fromLoved ? { id: fromLoved, why: 'loved' } : undefined;
}

/**
 * What today’s condition does to the dimensions an ability is read in: each named cause and the dimensions it reaches,
 * task by task, as the evaluation applies a condition (`judge`, each task’s dimension by its own conditions). Until
 * 2026-10-13 a cause named any dimension the ability is read in anywhere that some task’s same dimension listed it for,
 * so Emotional Depth read tired in connection, which only partnered work reads it in and lists no condition for, and
 * after a sprain Vocal Expression in consistency (read only in voice work, which an injury doesn’t reach) and Discipline
 * in execution (read only in written work, which only fatigue does).
 */
export function todayFor(sim: Simulation, person: Person, id: AbilityId): string[] {
  const c = conditionAt(sim, person, sim.now);
  const readers = readersOf(id);
  const dims = new Set(readers.flatMap((r) => r.dims));
  const reached = (cause: 'fatigue' | 'illness' | 'injury') => readers.flatMap((r) => r.dims.filter((d) => (TASK_PROFILES[r.task]?.dims[d]?.conditions ?? []).includes(cause)));
  const out: string[] = [];
  const say = (what: string, cause: 'fatigue' | 'illness' | 'injury') => { const d = [...new Set(reached(cause))]; if (d.length) out.push(`${what}: ${d.map((x) => DIMENSION_LABEL[x].toLowerCase()).join(', ')}`); };
  if (c.readiness < EVALUATION.sufficientReadiness) say(`Readiness ${Math.round(c.readiness)}, under ${EVALUATION.sufficientReadiness}`, 'fatigue');
  if (c.ill) say('The flu', 'illness');
  if (c.injured) say('An injury mending', 'injury');
  // A concussion reaches every dimension the ability is read in (from 2026-10-10).
  if (c.concussed && dims.size) out.push(`A concussion mending: ${[...dims].map((x) => DIMENSION_LABEL[x].toLowerCase()).join(', ')}`);
  return out;
}

export function ProfileWorkspace() {
  const person = useWorld((s) => s.player);
  // Locked, it's WorkspaceRouter's LockedScreen, with the way into its chapter (from 2026-10-12; until then an Empty
  // here with nothing to press).
  if (!person.craft) return <Empty title="Your Profile" body="This life began outside drama school, so it has no craft to read." />;
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
        <GenresPanel />
        <ConditionPanel />
        <JourneyPanel />
        <WorkSoFarPanel />
        <HistoryPanel />
      </div>
    </>
  );
}

function IdentityPanel() {
  const { sim, navigate } = useGame();
  const person = useWorld((s) => s.player);
  const home = CITIES.get(person.homeRegionId);
  const country = COUNTRIES.get(person.citizenshipId);
  const cur = saveCurrency(sim.universe);
  const cover = coverOn(person, sim.now);
  const money = `Money, ${formatMoney(inTheBank(sim, person), cur)}`;
  const full = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ');
  const said = [...(person.raceEthnicity ?? []).map((id) => ETHNICITIES.find((e) => e.id === id)?.label ?? id), ...(person.raceEthnicityOwn ? [person.raceEthnicityOwn] : [])];
  const school = person.school;
  return (
    <Panel title="Identity And Background" subtitle="As the character was made" help="ui.profile">
      <div className="row gap-4 wrap identity-row" style={{ alignItems: 'flex-start' }}>
        {person.portrait
          ? <img src={person.portrait} alt={`${person.displayName}’s portrait`} width={128} height={160} style={{ borderRadius: 8, objectFit: 'cover' }} />
          : <div className="small muted" style={{ width: 128 }}>No portrait chosen</div>}
        <div className="col gap-3 grow" style={{ minWidth: 0 }}>
          <div className="grid grid-3">
            <Stat label="Full Name" value={full} note={person.displayName !== full ? `Called ${person.displayName}` : 'Called by it'} />
            <Stat label="Pronouns" value={person.pronouns} note={person.performerTitle === 'actress' ? 'Billed as an actress' : 'Billed as an actor'} />
            <Stat label="Age" value={String(ageOn(person.birthInstant, sim.now, sim.zone))} note={`Born ${formatDate(person.birthInstant, sim.zone)}`} />
            <Stat label="From" value={home?.name ?? 'Not On The Map'} note={country ? `A citizen of ${theCountry(country.name)}` : undefined} />
            <Stat label="School" value={school ? (school.standing === 'graduated' ? 'Graduated' : school.standing === 'dismissed' || school.standing === 'withheld' || school.standing === 'withdrawn' ? 'Left' : `Year ${yearOfStudy(person)}`) : 'None'} note={school ? `Class of ${school.classOf}, ${STANDING_LABEL[school.standing].toLowerCase()}` : undefined} />
            <Stat label="Living In" value={CITIES.get(person.currentLocationId)?.name ?? '—'} />
          </div>
          {person.background && <p className="small" style={{ margin: 0 }}><strong>In their own words.</strong> {person.background}</p>}
          {said.length > 0 && <p className="small" style={{ margin: 0 }}><strong>Race and ethnicity, as given.</strong> {said.join(', ')}.</p>}
          {/* The traits in a region of their own, so each opens under them once "How You Are" is read (from 2026-10-12:
              until then the panel had no region and Open drew them as plain names, so none of them opened). */}
          {person.personalityTraits.length > 0 && <LookRegion><p className="small" style={{ margin: 0 }}><strong>Chosen at the start.</strong> {person.personalityTraits.map((t, i) => <span key={t}>{i ? ', ' : ''}<Open subject={at('trait', t)}>{PERSONALITY_TRAIT_BY_ID[t]?.name ?? t}</Open></span>)}.</p></LookRegion>}
          {/* The dispositions set at creation, and what each does (from 2026-10-10: until then the Profile didn't show them). */}
          <p className="small" style={{ margin: 0 }}><strong>Dispositions.</strong> {DISPOSITIONS.map(([k, label, does], i) => <span key={k}>{i ? '; ' : ''}{label} {Math.round(person.personality[k])}, {typeof does === 'string' ? does : does(person, sim)}</span>)}.</p>
          <div className="row gap-2 wrap">
            <button type="button" className="btn btn-sm" onClick={() => navigate('/workspace/bank', 'Money')}>{money}</button>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/workspace/papers', 'Papers')}>{cover ? 'Papers, Covered' : 'Papers, No Health Cover'}</button>
          </div>
          <Fine>Who somebody is decides nothing about how good they are: no ability here is drawn from a name, a portrait, a race or ethnicity, or a gender. What’s shown here was set when the character was made, and isn’t edited after.</Fine>
        </div>
      </div>
    </Panel>
  );
}

function PracticeButton({ id }: { id: AbilityId | (typeof TECHNIQUES)[number] }) {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const e = exerciseFor(id);
  if (id === 'stamina') {
    // A workout's own refusal now, and whether fitness is holding (`FITNESS.heldDays`) or falling.
    const no = lookAfterRefusal(sim, 'exercise');
    const held = fitnessHeldUntil(person);
    const falling = person.wellbeing.fitness > EVERYDAY_FITNESS;
    return (
      <span className="col xs dim">
        <span>Work Out, under Look After Yourself</span>
        {no && <span>{no}</span>}
        <span>{held !== undefined && held > sim.now ? `Held until ${formatDate(held, sim.zone)}` : falling ? `Falling ${FITNESS.perDay} a day` : 'At what an everyday life keeps'}</span>
      </span>
    );
  }
  if (!e) return <span className="xs dim">Practice kept up, day after day</span>;
  return <PracticeControl exercise={e.id} />;
}

/**
 * An exercise as practice on a challenge (from 2026-10-10): its challenge, its material at the tier chosen (the one
 * matching the level preselected), the focus for the hour with what each does, and what the hour found, said from the
 * numbers that moved it. Each refusal is said under what it refuses: the hour's under the button, and from 2026-10-12 a
 * focus's under the focus. Until then a focus refused was only grayed out in its list, with its reason nowhere.
 */
function PracticeControl({ exercise }: { exercise: string }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const e = EXERCISE_BY_ID[exercise]!;
  const design = EXERCISE_DESIGN[exercise];
  const level = levelOf(sim, person, e.trains as never);
  const [openUp, setOpenUp] = useState(false);
  const [tier, setTier] = useState<0 | 1 | 2>(matchedTier(level));
  const [focus, setFocus] = useState<PracticeFocus>('steady');
  const [found, setFound] = useState<string | undefined>();
  // A focus chosen here is one of `FOCUS`, which nothing refuses since 2026-10-13: until then a focus refused was grayed
  // out with its reason under it, for refusals no play reached (`focusRefusal`).
  const no = practiceRefusal(sim, person, e);
  const rec = experienceOf(person).exercises[exercise];
  if (!openUp) return <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpenUp(true)}>{e.label}…</button>;
  return (
    <span className="col gap-1" style={{ minWidth: 220 }}>
      <span className="xs"><strong>{e.label}.</strong> {design?.challenge}</span>
      <label className="xs">Tier <select value={tier} onChange={(x) => setTier(Number(x.target.value) as 0 | 1 | 2)}>{TIER.label.map((l, i) => <option key={l} value={i}>{l}{i === matchedTier(level) ? ' (Your Level)' : ''}</option>)}</select></label>
      {design && <span className="xs dim">{design.tiers[tier]}</span>}
      <label className="xs">Focus <select value={focus} onChange={(x) => setFocus(x.target.value as PracticeFocus)}>{(Object.keys(FOCUS) as PracticeFocus[]).map((f) => <option key={f} value={f}>{FOCUS[f].label}</option>)}</select></label>
      <span className="xs dim">{FOCUS[focus].words}</span>
      <Gated feature="practice.exercise" className="btn btn-sm" disabled={Boolean(no)} title={no ?? e.how} onClick={() => { const r = run<{ gained: number; feedback: string }>('practice.exercise', { exercise, tier, focus }); if (r.ok) { setFound(r.value!.feedback); toast(`${e.label}: +${r.value!.gained.toFixed(2)}.`, 'positive'); } }}>Practice An Hour</Gated>
      {no && <span className="xs dim">{no}</span>}
      {found && <span className="xs">{found}</span>}
      {rec && <span className="xs dim">{rec.sessions} session{rec.sessions === 1 ? '' : 's'}, last {rec.lastDay}.</span>}
      {design?.practises.length ? <span className="xs dim">Practice in {design.practises.map((f) => FEATURE_LABEL[f]?.toLowerCase()).join(' and ')}.</span> : null}
    </span>
  );
}

/**
 * What to work on next, from what cost recent work, dropping a weakness once it's addressed (`recommendations`), and
 * from 2026-10-12 the weakness the work so far keeps coming back to (`Identity.recurring`), said with the pieces it has
 * held back for life and what that rests on, and first within half a point of the top.
 */
function NextWork() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  // Days since an exercise was last practised, for the focus (`recommendations`, from 2026-10-12), as a brief's pane
  // reads them (`practicedDaysAgo`).
  const recs = recommendations((id) => levelOf(sim, person, id as never), (id) => (ABILITY_DEFS.some((d) => d.id === id) ? abilityFull(sim, person, id as AbilityId) : MASTERED), person.work ?? [], (id) => exerciseFor(id as never), matchedTier, 12, practicedDaysAgo(person, sim.now, sim.homeZone), identityOf(person).recurring);
  // Nothing judged yet isn't nothing held back (from 2026-10-12: until then a new student read that their recent work
  // wasn’t held back by anything).
  if (!(person.work ?? []).length) return <p className="small" style={{ margin: 0 }}>No work of yours has been judged yet: what to work on is read from what holds judged work back.</p>;
  if (!recs.length) return <p className="small" style={{ margin: 0 }}>Your recent work wasn’t held back by any ability or technique with room to grow: the work now is in new material and new ways of playing it.</p>;
  return (
    <div className="col gap-1">
      <div className="eyebrow">What To Work On Next</div>
      <ul className="small" style={{ margin: 0 }}>
        {recs.map((r) => <li key={r.target}><strong>{r.label}</strong>{r.exercise ? `, ${EXERCISE_BY_ID[r.exercise]?.label ?? r.exercise} at the ${TIER.label[r.tier ?? 0].toLowerCase()} tier` : ''}. {r.why}{r.recurring && <> <span className="xs dim">From your work for life: {r.recurring.evidence.join('; ')}; it last held a piece back on {formatDate(r.recurring.last, sim.zone)}.</span></>}</li>)}
      </ul>
    </div>
  );
}

/**
 * The actor the work so far shows (from 2026-10-12, `systems/artistry.ts`): strengths, what keeps holding the work back,
 * the material met and not, habits of playing and of reading, range, how direction is taken, reliability and playing
 * with others, each with what it rests on. Read from the record, never stored, and it adds nothing to any result.
 */
function WorkSoFarPanel() {
  const person = useWorld((s) => s.player);
  const id = identityOf(person);
  const lines = (title: string, xs: readonly { label: string; line: string; evidence: string[] }[]) => xs.length > 0 && (
    <div className="col gap-1">
      <div className="eyebrow">{title}</div>
      <ul className="small" style={{ margin: 0 }}>{xs.map((x) => <li key={x.label}>{x.line} <span className="xs dim">From: {x.evidence.join('; ')}.</span></li>)}</ul>
    </div>
  );
  const one = (x?: { label: string; line: string; evidence: string[] }) => (x ? [x] : []);
  return (
    <Panel title="Your Work So Far" subtitle={id.early ? `Early days: ${id.pieces} ${id.pieces === 1 ? 'piece' : 'pieces'} judged. Patterns are named from ${ARTISTRY.least}.` : `Read from ${id.pieces} pieces judged, the material met and the choices made`} help="craft.identity">
      <div className="col gap-3">
        {lines('What Your Work Shows Most', id.strengths)}
        {lines('What Keeps Holding It Back', id.weaknesses)}
        {lines('Material You Know', id.familiar)}
        {id.unfamiliar.length > 0 && <p className="small" style={{ margin: 0 }}><strong>Not met yet:</strong> {id.unfamiliar.join(', ')}. <span className="xs dim">A brief built on one is suggested beside a brief.</span></p>}
        {lines('How You Tend To Play It', id.habits)}
        {lines('Range', [id.versatility])}
        {lines('Taking Direction', one(id.direction))}
        {lines('Reliability', one(id.reliability))}
        {lines('Playing With Others', one(id.collaboration))}
        <Fine>Read from the work record and the record kept for life; nothing here is stored, and none of it adds to any result: a strength is your abilities’ and techniques’ already. A pattern is named only from {ARTISTRY.least} pieces, a habit from {ARTISTRY.habitAt} choices, so early work isn’t taken for who you are.</Fine>
      </div>
    </Panel>
  );
}

function AbilitiesPanel() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const recent = developmentOf(person).history;
  const last = (id: string) => [...recent].reverse().find((h) => h.id === id);
  const staminaFull = abilityFull(sim, person, 'stamina');
  return (
    <Panel title="Attributes And Craft" subtitle={`Twelve abilities, 0 to 100; today’s practice ${practicedToday(sim, person)} of ${PRACTICE.dailyHours} hours`} help="practice.exercise">
      <div className="col gap-3">
        <NextWork />
        <LookRegion className="table-scroll">
          <table>
            <thead><tr><th scope="col">Ability</th><th scope="col" className="num">Now</th><th scope="col" className="num">Full</th><th scope="col" className="num">Classes Reach</th><th scope="col">Today</th><th scope="col">It Shapes</th><th scope="col">Last Change</th><th scope="col">Practice</th></tr></thead>
            <tbody>
              {ABILITY_DEFS.map((d) => {
                const now = abilityOf(sim, person, d.id);
                const full = abilityFull(sim, person, d.id);
                const today = todayFor(sim, person, d.id);
                const h = last(d.id);
                return (
                  <tr key={d.id}>
                    <td className="nowrap"><Open subject={at('ability', d.id)}>{d.label}</Open></td>
                    <td className="num mono">{one(now)}</td>
                    <td className="num mono">{one(full)}</td>
                    <td className="num mono" title={classesGrow(d.id) ? undefined : 'Classes don’t build it'}>{classesGrow(d.id) ? one(Math.min(full, reachOf(person, d.id))) : '—'}</td>
                    <td className="xs">{today.length ? today.join('; ') : 'Nothing holds it back'}</td>
                    <td className="xs">{[...new Set(readersOf(d.id).flatMap((r) => r.dims))].map((x) => DIMENSION_LABEL[x]).join(', ') || '—'}</td>
                    <td className="xs nowrap">{h ? `+${h.delta.toFixed(2)}, ${sourceWords(h.source)}` : 'None yet'}</td>
                    <td className="nowrap"><PracticeButton id={d.id} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </LookRegion>
        <p className="small" style={{ margin: 0 }}>
          <strong>Stamina is your fitness.</strong> It’s full at the most a body your age can be brought to, {one(staminaFull)} now, so at full fitness it counts as full, and work that reads it asks nothing more. A workout builds it, and holds it for {FITNESS.heldDays} days: two a week keep it (Hickson &amp; Rosenkoetter, 1981). Past that it falls {FITNESS.perDay} a day toward {EVERYDAY_FITNESS}, what an everyday life keeps (Mujika &amp; Padilla, 2000, on detraining); the rate is SLATE’s. A second workout the same day builds half. It’s the one ability that fades without use: the others keep what they’ve earned.
        </p>
        <Fine>Classes and the work grow an ability toward its reach; deliberate practice goes past it to full, and reaching full sets it exactly. The same exercise again the same day gives half; past {PRACTICE.dailyHours} hours a day, practice stops counting (Ericsson et al., 1993).</Fine>
      </div>
    </Panel>
  );
}

function TechniquesPanel() {
  const person = useWorld((s) => s.player);
  const craft = person.craft!;
  return (
    <Panel title="Techniques" subtitle={`Seventeen learned methods; mastered at ${MASTERED}`} help="practice.exercise">
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

/** A filter box, a choice of which to show, and the count: the full list of a kind, a page at a time. */
function ListControls({ id, text, setText, show, setShow, options, count }: { id: string; text: string; setText: (s: string) => void; show: string; setShow: (s: string) => void; options: readonly string[]; count: number }) {
  return (
    <div className="row gap-2 wrap">
      <label className="small" htmlFor={`${id}-find`}>Find</label>
      <input id={`${id}-find`} type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a name" />
      <label className="small" htmlFor={`${id}-show`}>Show</label>
      <select id={`${id}-show`} value={show} onChange={(e) => setShow(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="xs dim">{count} shown</span>
    </div>
  );
}

function GenresPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const suggested = nextGenre(person);
  const [text, setText] = useState('');
  const [show, setShow] = useState('All');
  const [limit, setLimit] = useState(PAGE);
  // The genre whose brief is open (from 2026-10-12): its scene, preparation, choice and takes.
  const [open, setOpen] = useState<string | undefined>(undefined);
  const [openBrief, setOpenBrief] = useState<string | undefined>(undefined);
  const list = FILM_GENRES.filter((g) => g.label.toLowerCase().includes(text.toLowerCase())).filter((g) => {
    if (show === 'Loved') return (person.genres ?? []).includes(g.id);
    if (show === 'Studied Or Practiced') return Boolean(person.engagement?.byGenre[g.id]);
    if (show === 'With Requirements') return genreTags(g.id).length > 0;
    return true;
  });
  return (
    <Panel title="Genres" subtitle={`${(person.genres ?? []).length} loved; ${Object.keys(person.engagement?.byGenre ?? {}).length} of ${FILM_GENRES.length} studied or practiced`} help="genre.study">
      <div className="col gap-3">
        {/* In a region of its own, so a genre named here opens under it once the chapter that opens a genre is read (from
            2026-10-12: until then it stood outside any region and Open drew the loved genres and the one suggested as
            plain names, so none of them opened, whatever was read). */}
        <LookRegion><p className="small" style={{ margin: 0 }}>You love: {(person.genres ?? []).length ? (person.genres ?? []).map((id, i) => <span key={id}>{i ? ', ' : ''}<Open subject={at('genre', id)}>{GENRE_BY_ID[id]?.label ?? id}</Open></span>) : 'none chosen'}.{suggested ? <> <Open subject={at('genre', suggested.id)}>{GENRE_BY_ID[suggested.id]!.label}</Open> {suggested.why === 'part' ? 'is the kind your next part’s play is, and the one of its kinds you know least.' : 'is the one you love and know least; no part asks for a kind yet.'}</> : null}</p></LookRegion>
        {open && (
          <div className="card col gap-2" style={{ padding: 'var(--space-3, 12px)' }}>
            <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="eyebrow">{GENRE_BY_ID[open]?.label}: Its Brief</div>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(undefined)}>Close The Brief</button>
            </div>
            <BriefPane key={`${open}:${openBrief ?? ''}`} genre={open} {...(openBrief ? { brief: openBrief } : {})} onOpen={(g, b) => { setOpen(g); setOpenBrief(b); }} practice={(id) => <PracticeButton id={id as AbilityId} />} />
          </div>
        )}
        <ListControls id="genres" text={text} setText={(s) => { setText(s); setLimit(PAGE); }} show={show} setShow={(s) => { setShow(s); setLimit(PAGE); }} options={['All', 'Loved', 'Studied Or Practiced', 'With Requirements']} count={Math.min(limit, list.length)} />
        <LookRegion className="table-scroll">
          <table>
            <thead><tr><th scope="col">Genre</th><th scope="col">It Asks For</th><th scope="col" className="num">Familiarity</th><th scope="col" className="num">Practice</th><th scope="col">Study, Or Its Brief</th></tr></thead>
            <tbody>
              {list.slice(0, limit).map((g) => {
                const e = person.engagement?.byGenre[g.id];
                const tags = genreTags(g.id);
                const d = GENRE_DEMANDS[g.id];
                const study = studyRefusal(sim, person, g.id);
                return (
                  <tr key={g.id}>
                    <td className="nowrap"><Open subject={at('genre', g.id)}>{g.label}</Open>{(person.genres ?? []).includes(g.id) ? ', Loved' : ''}</td>
                    <td className="xs">{tags.length ? tags.map((t) => `${DEMAND_LABEL[t]} (${TECHNIQUE_LABEL[DEMAND_TECHNIQUE[t]]} ${one(person.craft![DEMAND_TECHNIQUE[t]])} of ${MASTERED})`).join('; ') : d && !applied(g.id) && d.tags.length ? 'Not established: the research rests on one example' : 'Nothing past the camera’s own'}</td>
                    <td className="num mono">{one(e?.familiarity ?? 0)}</td>
                    <td className="num mono">{one(e?.practice ?? 0)}</td>
                    <td className="nowrap">
                      <Gated feature="genre.study" className="btn btn-sm" disabled={Boolean(study)} title={study ?? 'An hour and a half with a work of the kind'} onClick={() => { const r = run<{ familiarity: number; with: string }>('genre.study', { genre: g.id }); if (r.ok) toast(studiedWords(g.id, r.value!), 'positive'); }}>Study It</Gated>{' '}
                      <button type="button" className="btn btn-sm" title={`${briefsOf(g.id)[0]?.title ?? 'Its brief'}: read it, prepare it, choose how to play it, tape it`} onClick={() => { setOpen(g.id); setOpenBrief(undefined); }}>Open Its Brief</button>
                      {study && <div className="xs dim">{study}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </LookRegion>
        {list.length > limit && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setLimit(limit + PAGE)}>{`Show ${Math.min(PAGE, list.length - limit)} More`}</button>}
        <Fine>Every genre has a practice brief, an original scene written for SLATE: open it to read the scene, prepare it, choose a reading and how to play it, and tape it. What a genre asks for is a technique its brief stages, shown before you begin: mastered at {MASTERED}, it asks nothing more. A taped brief also asks you to know the genre: the better of what you’ve studied and what you’ve worked in it, complete at {Math.round(BRIEF.complete.genre * 100)}, and Study It builds it. Loving a genre makes a day of work in it better and caps nothing; material met before (its features, not its genre) makes a brief quicker to prepare.</Fine>
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
          <Stat label="For Work" value={sufficient && !c.ill && !c.injured && !c.concussed ? 'Sufficient' : 'Held Back'} tone={sufficient && !c.ill && !c.injured && !c.concussed ? undefined : 'warning'} note={!sufficient ? `Under ${EVALUATION.sufficientReadiness}: fatigue holds back the work that reads it` : c.concussed ? 'A concussion holds back all of it' : c.ill ? 'The flu holds back the voice and the body' : c.injured ? 'An injury holds back the body' : 'Nothing today holds the work back'} />
          <Stat label="Energy, Stress" value={`${Math.round(w.energy)}, ${Math.round(w.stress)}`} note={`Sleep owed ${Math.round(w.sleepDebt)} hours`} />
        </div>
        {/* Until 2026-10-13 this named execution, consistency and responsiveness alone, where `TASK_PROFILES` gives fatigue
            to believability and connection too, and Today on the same screen named them (found by that day’s evidence pass). */}
        <Fine>Tired, an actor’s attention and memory go before their reasoning does (Lim &amp; Dinges, 2010), so fatigue reaches the work’s believability, connection, execution, consistency and responsiveness, and leaves only its interpretation be. An injury holds back what it limits: a sprain, a strain or a break the body’s work, a concussion all of it, and a cut or a knock none. None of it lowers an ability: it’s today’s, and passes with rest.</Fine>
      </div>
    </Panel>
  );
}

function JourneyPanel() {
  const { sim, navigate } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school;
  const j = journeyOf(person);
  const [limit, setLimit] = useState(10);
  const work = [...(person.work ?? [])].reverse();
  const terms = Object.entries(j.byTerm);
  // A run closed, its last night played, is on stage already, before the next casting files its credit (from
  // 2026-10-13: until then it read as running until that casting, months on; found by that day's evidence pass).
  const filed = school?.credits ?? [];
  const closed = school ? [school.casting, school.rep]
    .filter((c): c is NonNullable<typeof c> => !!c && c.performed > 0 && (c as { closed?: number }).closed !== undefined)
    .filter((c) => !filed.some((f) => f.production === c.production && f.role === c.role))
    .map((c) => ({ production: c.production, role: c.role, year: termStart(c.term).date.year, yearAsKept: undefined })) : [];
  const credits = [...filed, ...closed];
  return (
    <Panel title="School Journey" subtitle={school ? `${school.standing === 'graduated' ? 'Graduated' : school.standing === 'dismissed' || school.standing === 'withheld' || school.standing === 'withdrawn' ? 'Left the school' : `Year ${yearOfStudy(person)} of three`}, ${STANDING_LABEL[school.standing].toLowerCase()}` : 'No school'} help="look.work">
      <div className="col gap-3">
        {school && <p className="small" style={{ margin: 0 }}>{credits.length ? `On stage: ${credits.map((c) => `${c.role} in ${c.production}, ${c.year}${c.yearAsKept ? ' (as first written down)' : ''}`).join('; ')}.` : school.casting?.performed ? `No production finished yet; ${school.casting.role} in ${school.casting.play ?? school.casting.production} is running.` : 'No production yet.'} <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/workspace/school', 'Your School')}>Your School</button></p>}
        {terms.length > 0 && (
          <LookRegion className="table-scroll">
            <table>
              <thead><tr><th scope="col">Half-Year</th>{Object.keys(j.totals).map((t) => <th key={t} scope="col" className="num">{TASK_PROFILES[t]?.label ?? t}</th>)}</tr></thead>
              <tbody>
                {terms.map(([term, by]) => (
                  <tr key={term}><td className="nowrap">{term}</td>{Object.keys(j.totals).map((t) => <td key={t} className="num mono">{by[t] ? `${by[t]!.n} at ${one(by[t]!.sum / by[t]!.n)}` : '—'}</td>)}</tr>
                ))}
                <tr className="strong"><td>All Of It</td>{Object.entries(j.totals).map(([t, x]) => <td key={t} className="num mono">{x ? `${x.n} at ${one(x.sum / x.n)}, best ${one(x.best)}` : '—'}</td>)}</tr>
              </tbody>
            </table>
          </LookRegion>
        )}
        {j.milestones.length > 0 && (
          <ul className="small" style={{ margin: 0 }}>
            {[...j.milestones].reverse().slice(0, 12).map((m, i) => <li key={i}>{formatDate(m.at, sim.zone)}: {m.kind === 'run' ? `${m.what}, the run averaged ${one(m.overall)}${m.detail ? ` (${m.detail})` : ''}` : m.kind === 'first-strong' ? `First strong work: ${m.what}, ${one(m.overall)}` : m.kind === 'first-exceptional' ? `First distinction-level work: ${m.what}, ${one(m.overall)}` : `First work at full mastery: ${m.what}, ${one(m.overall)}`}</li>)}
          </ul>
        )}
        {work.length ? (
          <LookRegion className="table-scroll">
            <table>
              <thead><tr><th scope="col">Work</th><th scope="col">What</th><th scope="col" className="num">Whole</th><th scope="col">Band</th><th scope="col">When</th></tr></thead>
              <tbody>
                {work.slice(0, limit).map((w) => (
                  <tr key={w.inputs.key}>
                    <td className="nowrap"><Open subject={at('work', w.inputs.key)}>{w.what}</Open></td>
                    <td>{w.taskLabel}</td>
                    <td className="num mono">{one(w.overall)}</td>
                    <td>{w.band ? BAND_WORD[w.band] ?? w.band : ''}</td>
                    <td>{formatDate(w.at, sim.zone)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </LookRegion>
        ) : <p className="small muted" style={{ margin: 0 }}>No finished work judged yet: a showing, a night or a self-tape is.</p>}
        {work.length > limit && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setLimit(limit + 20)}>Show Older Work</button>}
        <Fine>The latest {WORK_KEPT} pieces are kept in full, each with what it was judged from; every piece ever judged is counted above, by half-year and for good.{j.detailBefore ? ` This save kept no detail of work before ${formatDate(j.detailBefore, sim.zone)}: its counts begin there, and nothing is made up for the time before.` : ''}</Fine>
      </div>
    </Panel>
  );
}

function HistoryPanel() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const [limit, setLimit] = useState(15);
  const history = [...developmentOf(person).history].reverse();
  return (
    <Panel title="Development History" subtitle={`The latest ${DEVELOPMENT.historyKept} changes, newest first`}>
      {history.length ? (
        <LookRegion>
          <ul className="small" style={{ margin: 0 }}>
            {history.slice(0, limit).map((h, i) => (
              <li key={i}>{formatDate(h.at, sim.zone)}: <Open subject={targetSubject(h.id as AbilityId)}>{targetLabel(h.id as AbilityId)}</Open> +{h.delta.toFixed(3)}, {sourceWords(h.source)}</li>
            ))}
          </ul>
          {history.length > limit && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setLimit(limit + 30)}>Show Earlier Changes</button>}
        </LookRegion>
      ) : <p className="small muted" style={{ margin: 0 }}>Nothing yet: the history begins with the first class, step or hour of practice.</p>}
    </Panel>
  );
}
