/**
 * SLATE — the Career screen's Opportunities tab (from 2026-10-21, the owner's brief 19, J1 to J5 and A3;
 * `systems/projobs.ts`): the roles posted to the actor, the ones an agent brought, the auditions to come, the offers, the
 * booked work and what was settled, each read from the record as it's drawn.
 *
 * Every control runs a command through `run`, behind its guide chapter (`<Gated>`), with the command's own refusal said
 * under it before it's pressed (`WhyNot`). Every project, company and casting office is fictional but a part drawn from
 * a real production, and the tab says so at its head; until 2026-10-23 (brief 25's Module 2) every one was, and the
 * head said so of all of them. The figures that are the game's estimates say so under Sources And Estimates.
 */

import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine, WhyNot, SectionHead } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney } from '@/engine/core/money';
import { spokenList } from '@/engine/core/text';
import { formatDate, formatTime, formatWeekdayDate } from '@/engine/core/time';
import { PROJECTS, projectById, type ProjectTemplate } from '@/engine/content/careerwork';
import { agentById } from '@/engine/content/agents';
import { BAND_LABEL } from '@/engine/systems/coursework';
import { BRIEF, type BriefStep } from '@/engine/systems/briefs';
import { FORMATS } from '@/engine/content/workflows';
import { STEP_WORDS, stepOf, workflowOf } from '@/engine/systems/workflow';
import { activeAgreement, type Engagement, type Opportunity } from '@/engine/systems/pro';
import {
  DEFERRED_WHY, FIELD_WORDS, ILL_DAY, MISSES, OUTSIDE_WORK, ROUND_WORDS, acceptRefusal, holdAskRefusal, holding, askMoreRefusal, acceptWarning, againWords, agrees, castingAs, chanceWords, conditionsFor, counted, datesOf, decidesAt, drawnWords, kindPhrase, reachWords,
  demandsWords, eligibilityProblems, fitOf, fitWords, inSessionAny, materialProblems, moveRefusal, payTermsOf, payWords, prepMinutes,
  prepareRefusal, projectGenresOf, projectOf, requestFor, requestRefusal, roundToCome, submitRefusal, writtenFor, writtenForWords, intimacyWords,
} from '@/engine/systems/projobs';
import { requirementWords } from '@/engine/systems/engagement';
import { productionById, productionWords } from '@/engine/content/catalog';
import { projectKey } from '@/engine/systems/reference';
import { openReference } from '@/ui/career/ReferencePane';
import { PlayingChooser } from '@/ui/components/PlayingChooser';
import { promoFor } from '@/engine/systems/workflow';
// Offers and auditions, the actor's side (from 2026-10-25, brief 27's cluster of that name): `systems/offers.ts`.
import {
  TERM_ITEMS, approachPreview, askAnswerWords, askLabel, chooseRefusal, conditionStanding, conditionWords, noteRefusal, noteWaiting, recastWords, recordRefusal, rememberedWords,
  requirementsOf, rescheduleRefusal, rescheduleWords, roundWords, sceneOfPart, sendRefusal, takeWords, termsChangedWords, withdrawRefusal, withdrawWarning, type TermItem,
} from '@/engine/systems/offers';

const NY = 'America/New_York';
const STEPS: readonly BriefStep[] = ['read', 'lines', 'rehearse'];
const pct = (x: number) => `${Math.round(x * 100)}%`;
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/** The work's days in a phrase: "from November 16, 2026 to November 18, 2026". */
function spanWords(days: readonly { from: number }[]): string {
  if (!days.length) return '';
  const first = formatDate(days[0]!.from, NY);
  const last = formatDate(days[days.length - 1]!.from, NY);
  return days.length === 1 ? `on ${first}` : `from ${first} to ${last}`;
}

/**
 * The work's days in a phrase: a run's weeks, a multicamera week, a booth's sessions, an action shoot's fight rehearsals
 * before its shoot days, or a shoot's days (the workflows' from 2026-10-24, brief 25's Module 5; until then a run's or
 * "shoot days").
 */
function daysWords(t: ProjectTemplate, n: number): string {
  const s = t.schedule;
  if (s.kind === 'run') return `${counted(s.rehearsalWeeks, 'week')} of rehearsal and ${counted(s.performanceWeeks, 'week')} of performances`;
  if (s.kind === 'week') return `${counted(s.weeks, 'week')} of a table read, rehearsal, camera blocking and a tape night`;
  if (s.kind === 'sessions') return counted(s.sessions, STEP_WORDS[stepOf(t, 0)].replace(/^an? /, ''));
  if (s.kind === 'shoot' && s.rehearsalDays) return `${counted(s.rehearsalDays, 'day')} of fight rehearsal and ${counted(s.days, 'shoot day')}`;
  return counted(n, 'shoot day');
}

/** What the role is, in the lines a casting notice gives. */
function RoleFacts({ t, o }: { t: ProjectTemplate; o: Pick<Opportunity, 'projectId' | 'postedAt'> & Partial<Pick<Opportunity, 'offer' | 'rewrite'>> }) {
  const person = useWorld((s) => s.player);
  const days = datesOf(o);
  // The playing ages as casting changed them, where it did (from 2026-10-25, `requirementsOf`): the part's own until then.
  const ages = requirementsOf(o, t).ages;
  return (
    <dl className="col gap-2 small" style={{ margin: 0 }}>
      {/* Its page in Productions And People (from 2026-10-25, brief 27's K8), where its company, series and history link on. */}
      <div><dt className="strong">The Project</dt><dd style={{ margin: 0 }}>{`${t.project}, ${kindPhrase(t)}, by ${t.company}, cast by ${t.casting}. ${t.contract}. `}<button type="button" className="link" onClick={() => openReference(projectKey(t))}>Open Its Page</button></dd></div>
      {/* A part drawn from a real production says so before anything else about it (from 2026-10-23, brief 25's Module 2, C8). */}
      {t.drawn && <div><dt className="strong">The Game’s Own Part</dt><dd style={{ margin: 0 }}>{drawnWords(t)}</dd></div>}
      {t.drawn && productionById(t.drawn.production) && (
        <div><dt className="strong">{`${t.project}, As Its Pages Had It`}</dt><dd style={{ margin: 0 }}>{productionWords(productionById(t.drawn.production)!).join(' ')}</dd></div>
      )}
      <div><dt className="strong">The Part</dt><dd style={{ margin: 0 }}>{`${t.role.part}: ${t.role.about}`}</dd></div>
      {/* How the work is done, and an intimate scene said before the audition (from 2026-10-24, brief 25's Module 5; N13 §43.A). */}
      <div><dt className="strong">How The Work Is Done</dt><dd style={{ margin: 0 }}>{`${FORMATS[t.format].label}. ${FORMATS[t.format].words}`}</dd></div>
      {t.intimacy && <div><dt className="strong">An Intimate Scene</dt><dd style={{ margin: 0 }}>{intimacyWords(t)}</dd></div>}
      {/* What the part asks of the genres, in words (`requirementWords`, from 2026-10-22, the owner's brief 22): until then
          its project's tags, a broad genre beside its own kind ("Domestic Drama, Drama"), the order deciding nothing said. */}
      <div><dt className="strong">What It Asks</dt><dd style={{ margin: 0 }}>{`${requirementWords(projectGenresOf(t)) ?? 'No genre the game names'}. ${writtenForWords(t)} Playing ages ${ages[0]} to ${ages[1]}${o.rewrite?.ages ? ', as casting changed them' : ''}. ${demandsWords(person, t)}`}</dd></div>
      <div><dt className="strong">When And Where</dt><dd style={{ margin: 0 }}>{`${cap(daysWords(t, days.length))} ${spanWords(days)}, at ${t.place.venue} in ${t.place.city}. ${reachWords(person, t, days)}`}</dd></div>
      <div><dt className="strong">Pay</dt><dd style={{ margin: 0 }}>{payWords(payTermsOf(o), o.offer?.amount)}</dd></div>
      <div><dt className="strong">The Audition</dt><dd style={{ margin: 0 }}>{`${t.stages.audition === 'in-person' ? 'In person' : 'A self-tape'}${t.stages.callback ? ', then a callback for those casting wants to see again' : ''}.`}</dd></div>
    </dl>
  );
}

/** One open role: its notice, what stands in the way, the School's rule where it falls in term, and Submit Yourself. */
function OpenRole({ o }: { o: Opportunity }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const t = projectOf(o);
  const no = submitRefusal(sim, person, o);
  const problems = [...eligibilityProblems(person, o, sim.now), ...materialProblems(person, t, sim.now).filter((p) => !p.stops && p.problem !== 'missing').map((p) => p.words)];
  const label = 'Submit Yourself';
  return (
    <article className="card card-tight col gap-3">
      <h3 style={{ margin: 0 }}>{`${t.role.part}, ${t.project}`}</h3>
      {/* A part posted before says so, with what came of it the last time (from 2026-10-21, brief 20's D4). */}
      {o.again && <p className="small" style={{ margin: 0 }}>{againWords(o)}</p>}
      {/* A part recast says so (from 2026-10-25, `RECAST`). */}
      {o.recast && <p className="small" style={{ margin: 0 }}>{recastWords(o)}</p>}
      <RoleFacts t={t} o={o} />
      <p className="small" style={{ margin: 0 }}>{`Submissions close ${formatWeekdayDate(o.submitBy, NY)} at ${formatTime(o.submitBy, NY)}.`}</p>
      {problems.length > 0 && <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
      <SchoolRule o={o} />
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <Gated feature="pro.submit" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run('pro.submit', { opportunityId: o.id }); if (r.ok) toast(`Submitted for ${t.role.part}.`, 'positive'); }}>{label}</Gated>
      </div>
      <WhyNot reasons={[[label, no]]} />
    </article>
  );
}

/** The School's rule for a role whose days fall in term: what the dean looks at, the request's state, and Ask The School. */
function SchoolRule({ o }: { o: Opportunity }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school;
  if (!school || !inSessionAny(person, datesOf(o)) || ['graduated', 'dismissed', 'withdrawn', 'withheld'].includes(school.standing)) return null;
  const req = requestFor(person, o);
  const no = requestRefusal(sim, person, o);
  const label = 'Ask The School';
  const conditions = conditionsFor(sim, person, o, req?.at ?? sim.now);
  return (
    <div className="col gap-2">
      <SectionHead title="In Term At The School" help="career.outside-work" heading />
      <p className="small" style={{ margin: 0 }}>
        {req ? (req.status === 'pending' ? `You asked the School on ${formatDate(req.at, NY)}. The dean decides on ${formatDate(decidesAt(req), NY)}.` : `The dean ${req.status === 'approved' ? 'approved' : 'refused'} your request on ${formatDate(req.decidedAt ?? req.at, NY)}.`)
          : 'Its days fall in term, and the School approves outside work in term only rarely. The dean looks at each of these:'}
      </p>
      <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{conditions.map((c) => <li key={c.id}>{c.words}</li>)}</ul>
      {!req && (
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="pro.request_outside_work" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ decides: number }>('pro.request_outside_work', { opportunityId: o.id }); if (r.ok) toast(`Asked. The dean decides on ${formatDate(r.value!.decides, NY)}.`, 'positive'); }}>{label}</Gated>
        </div>
      )}
      {!req && <WhyNot reasons={[[label, no]]} />}
    </div>
  );
}

/** A role on its way: the round to come, the sides' preparation, Tape It, Ask For Another Time, and its record. */
function InProgress({ o }: { o: Opportunity }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const t = projectOf(o);
  const r = roundToCome(o);
  const agent = o.agentId ? agentById(o.agentId) : undefined;
  // Tape It records a take and sends it, so the day's takes and those kept count against it too (from 2026-10-25,
  // `recordRefusal`): until then it read the self-tape's own rules alone and showed enabled where the command refused.
  const tapeNo = recordRefusal(sim, person, o);
  const moveNo = moveRefusal(sim, person, o);
  // A chemistry read or a screen test asks the production to move it (from 2026-10-25, `RESCHEDULE`): Ask To Reschedule.
  const later = r?.form === 'in-person' && (r.round === 'chemistry' || r.round === 'test');
  const rescheduleNo = rescheduleRefusal(sim, person, o);
  // Its verb agrees with who answers (`agrees`): until 2026-10-22 it read "The producers answers soon." of a self-tape the
  // producers asked for, which the submission's own notice had already said right.
  const next = !r ? `Submitted. ${castingAs(t)} ${agrees(t, 'answers', 'answer')} soon.`
    : r.form === 'self-tape' ? `${r.round === 'callback' ? 'A callback self-tape' : 'A self-tape'}, due ${formatWeekdayDate(r.at, NY)} at ${formatTime(r.at, NY)}.`
      : `${r.round === 'callback' ? 'A callback' : r.round === 'audition' ? 'An audition' : `A ${ROUND_WORDS[r.round].noun}`} in person at ${t.place.venue} in ${t.place.city}, ${formatWeekdayDate(r.at, NY)} at ${formatTime(r.at, NY)}.`;
  return (
    <article className="card card-tight col gap-3">
      <h3 style={{ margin: 0 }}>{`${t.role.part}, ${t.project}`}</h3>
      <p className="small" style={{ margin: 0 }}>{next}</p>
      {agent && <p className="xs dim" style={{ margin: 0 }}>{`Through ${agent.name}.`}</p>}
      {/* What casting changed about the part during casting, in its words (from 2026-10-25, `REWRITE`). */}
      {o.rewrite && <p className="small" style={{ margin: 0 }}>{o.rewrite.words}</p>}
      {/* A conditional offer accepted, its round still to come (from 2026-10-25, `CONDITIONAL`). */}
      {conditionStanding(o) && <p className="small" style={{ margin: 0 }}>{conditionStanding(o)}</p>}
      {rememberedWords(person, t, sim.now) && <p className="xs dim" style={{ margin: 0 }}>{rememberedWords(person, t, sim.now)}</p>}
      {r && <Prepare target={{ opportunityId: o.id }} prep={o.prep} what="the sides" />}
      {r && <HowToPlay o={o} />}
      <Direction o={o} />
      {r?.form === 'self-tape' && <Takes o={o} />}
      {r && (
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          {r.form === 'self-tape'
            ? <Gated feature="pro.tape_audition" className="btn btn-sm" disabled={!!tapeNo} title={tapeNo} onClick={() => { const x = run<{ band: keyof typeof BAND_LABEL }>('pro.tape_audition', { opportunityId: o.id }); if (x.ok) toast(`Taped: ${BAND_LABEL[x.value!.band]}.`, 'positive'); }}>Tape It</Gated>
            : later
              ? <Gated feature="pro.ask_reschedule" className="btn btn-sm" disabled={!!rescheduleNo} title={rescheduleNo} onClick={() => { const x = run<{ answerAt: number }>('pro.ask_reschedule', { opportunityId: o.id }); if (x.ok) toast(`Asked. The production answers on ${formatWeekdayDate(x.value!.answerAt, NY)}.`, 'positive'); }}>Ask To Reschedule</Gated>
              : <Gated feature="pro.move_audition" className="btn btn-sm" disabled={!!moveNo} title={moveNo} onClick={() => { const x = run<{ at: number }>('pro.move_audition', { opportunityId: o.id }); if (x.ok) toast(`Moved to ${formatWeekdayDate(x.value!.at, NY)} at ${formatTime(x.value!.at, NY)}.`, 'positive'); }}>Ask For Another Time</Gated>}
        </div>
      )}
      {r && later && rescheduleWords(sim, person, o) && <p className="xs dim" style={{ margin: 0 }}>{rescheduleWords(sim, person, o)}</p>}
      {r && <WhyNot reasons={[[r.form === 'self-tape' ? 'Tape It' : later ? 'Ask To Reschedule' : 'Ask For Another Time', r.form === 'self-tape' ? tapeNo : later ? rescheduleNo : moveNo]]} />}
      <Withdraw o={o} />
      <Hold o={o} />
      <SchoolRule o={o} />
      <History o={o} />
    </article>
  );
}

/**
 * A hold on the actor's dates (from 2026-10-25, the owner's brief 27, loop 20; `HOLD`): its days and terms, the ask
 * that the production decide first against another offer on them, and its answer to come.
 */
function Hold({ o }: { o: Opportunity }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  if (!holding(o)) return null;
  const t = projectOf(o);
  const days = datesOf(o);
  const no = holdAskRefusal(sim, person, o);
  const asked = o.hold!.asked;
  return (
    <div className="col gap-2">
      <p className="small" style={{ margin: 0 }}>{`${castingAs(t)} ${agrees(t, 'holds', 'hold')} your dates for it, ${spanWords(days)}, until the part is cast. It isn’t a booking and pays nothing.`}</p>
      {asked && !asked.answer && <p className="small" style={{ margin: 0 }}>{`You asked ${t.casting} to decide first. The answer comes on ${formatWeekdayDate(asked.answerAt, NY)} at ${formatTime(asked.answerAt, NY)}.`}</p>}
      {o.status !== 'offered' && (
        <>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <Gated feature="pro.ask_hold" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const x = run<{ answerAt: number }>('pro.ask_hold', { opportunityId: o.id }); if (x.ok) toast(`Asked. The answer comes on ${formatWeekdayDate(x.value!.answerAt, NY)}.`, 'positive'); }}>Ask Them To Decide</Gated>
          </div>
          <WhyNot reasons={[['Ask Them To Decide', no]]} />
        </>
      )}
    </div>
  );
}

/**
 * How the sides are played (from 2026-10-25, the owner's brief 27, Part 9's "Selecting an approach"; `systems/offers.ts`):
 * the School's chooser, read against the part's own register, each side's result shown fully prepared.
 */
function HowToPlay({ o }: { o: Opportunity }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const no = chooseRefusal(o);
  if (no) return <WhyNot reasons={[['Play It This Way', no]]} />;
  return (
    <PlayingChooser scene={sceneOfPart(projectOf(o))} current={o.playing} feature="pro.choose_approach" help="career.sides"
      preview={(c) => approachPreview(sim, person, o, c)}
      onChoose={(c) => { const r = run<{ prep: number }>('pro.choose_approach', { opportunityId: o.id, ...c }); if (r.ok) toast(`Chosen. You’ve rehearsed this way of playing it to ${pct(r.value!.prep)} so far.`, 'positive'); }} />
  );
}

/** Casting's direction in the room, waiting on the answer (from 2026-10-25, Part 9's "Responding to direction"). */
function Direction({ o }: { o: Opportunity }) {
  const { run, toast } = useGame();
  const r = noteWaiting(o);
  if (!r) return null;
  const no = noteRefusal(o);
  const words = o.history.filter((h) => h.key === `${r.round}:note`).at(-1)?.words;
  return (
    <div className="col gap-2">
      <SectionHead title="Casting’s Direction" help="career.sides" heading />
      {words && <p className="small" style={{ margin: 0 }}>{words}</p>}
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <Gated feature="pro.answer_note" className="btn btn-sm btn-primary" disabled={!!no} title={no} onClick={() => { const x = run('pro.answer_note', { opportunityId: o.id, follow: true }); if (x.ok) toast('You’ll play the rest of it the way casting asked.', 'positive'); }}>Follow The Direction</Gated>
        <Gated feature="pro.answer_note" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const x = run('pro.answer_note', { opportunityId: o.id, follow: false }); if (x.ok) toast('You’ll keep your choice.', 'neutral'); }}>Keep Your Choice</Gated>
      </div>
      <WhyNot reasons={[['Follow The Direction', no]]} />
    </div>
  );
}

/** A self-tape's takes (from 2026-10-25, loop 13): each recorded and shown, and the one picked sent. */
function Takes({ o }: { o: Opportunity }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const r = roundToCome(o);
  const recordNo = recordRefusal(sim, person, o);
  const takes = r?.takes ?? [];
  return (
    <div className="col gap-2">
      <SectionHead title="Your Takes" help="career.sides" heading />
      {takes.length ? (
        <ul className="small col gap-1" style={{ margin: 0, paddingLeft: '1.1rem' }}>
          {takes.map((x, i) => {
            const no = sendRefusal(sim, o, i);
            return (
              <li key={x.key} className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                <span>{takeWords(x, i)}</span>
                <Gated feature="pro.send_take" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const y = run<{ band: keyof typeof BAND_LABEL }>('pro.send_take', { opportunityId: o.id, take: i }); if (y.ok) toast(`Sent take ${i + 1}: ${BAND_LABEL[y.value!.band]}.`, 'positive'); }}>Send This Take</Gated>
              </li>
            );
          })}
        </ul>
      ) : <p className="small" style={{ margin: 0 }}>No takes yet. Record A Take keeps each one to choose from; Tape It records one and sends it straight away.</p>}
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <Gated feature="pro.record_take" className="btn btn-sm" disabled={!!recordNo} title={recordNo} onClick={() => { const y = run<{ take: number; band: keyof typeof BAND_LABEL }>('pro.record_take', { opportunityId: o.id }); if (y.ok) toast(`Take ${y.value!.take + 1}: ${BAND_LABEL[y.value!.band]}.`, 'positive'); }}>Record A Take</Gated>
      </div>
      <WhyNot reasons={[['Record A Take', recordNo]]} />
    </div>
  );
}

/** Withdrawing from a part in progress, what it does said before it's pressed (from 2026-10-25, loop 14). */
function Withdraw({ o }: { o: Opportunity }) {
  const { sim, run, toast } = useGame();
  const no = withdrawRefusal(o);
  if (no && !noteWaiting(o)) return null;
  return (
    <div className="col gap-2">
      <SectionHead title="Withdrawing" help="career.withdrawing" heading />
      {!no && <p className="xs dim" style={{ margin: 0 }}>{withdrawWarning(sim, o)}</p>}
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <Gated feature="pro.withdraw" className="btn btn-sm btn-ghost" disabled={!!no} title={no} onClick={() => { const x = run<{ notice: boolean }>('pro.withdraw', { opportunityId: o.id }); if (x.ok) toast(x.value!.notice ? 'Withdrawn, with notice.' : 'Withdrawn, at short notice.', 'neutral'); }}>Withdraw From The Part</Gated>
      </div>
      <WhyNot reasons={[['Withdraw From The Part', no]]} />
    </div>
  );
}

/** The three steps of preparation on the sides or the part, each with its time and its refusal. */
function Prepare({ target, prep, what }: { target: { opportunityId: string } | { engagementId: string }; prep: { interpretation: number; memorization: number; rehearsal: number } | undefined; what: string }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const opp = 'opportunityId' in target ? person.pro?.opportunities.find((x) => x.id === target.opportunityId) : undefined;
  const eng = 'engagementId' in target ? person.pro?.engagements.find((x) => x.id === target.engagementId) : undefined;
  const x = opp ? { opportunity: opp } : eng ? { engagement: eng } : undefined;
  const p = prep ?? { interpretation: 0, memorization: 0, rehearsal: 0 };
  // A booked part prepares as its work does (from 2026-10-24, brief 25's Module 5): only the steps it reads, and its own.
  const flow = eng ? workflowOf(projectById(eng.projectId)!) : undefined;
  const steps = STEPS.filter((step) => !flow || flow.prep.steps.includes(step));
  const special = flow?.prep.special;
  const reasons = steps.map((step) => {
    const s = BRIEF.steps[step];
    return [`${s.label} (${counted(x ? prepMinutes(x, step) : s.minutes, 'Minute')})`, prepareRefusal(sim, person, x, step)] as const;
  });
  const own = special ? [`${special.label}${special.minutes ? ` (${counted(special.minutes, 'Minute')})` : ''}`, prepareRefusal(sim, person, x, 'special')] as const : undefined;
  const parts = [...(steps.includes('read') ? [`the breakdown ${pct(p.interpretation)}`] : []), ...(steps.includes('lines') ? [`the lines ${pct(p.memorization)}`] : []), ...(steps.includes('rehearse') ? [`rehearsal on your feet ${pct(p.rehearsal)}`] : []), ...(special ? [`${special.label.toLowerCase()} ${pct(eng?.prep?.special ?? 0)}`] : [])];
  return (
    <div className="col gap-2">
      <p className="small" style={{ margin: 0 }}>{`Preparing ${what}: ${parts.join(', ')}.`}</p>
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        {steps.map((step, i) => (
          <Gated key={step} feature="pro.prepare" className="btn btn-sm" disabled={!!reasons[i]![1]} title={reasons[i]![1]} onClick={() => { const r = run<{ minutes: number }>('pro.prepare', { ...target, step }); if (r.ok) toast(`${BRIEF.steps[step].label}: done.`, 'positive'); }}>{reasons[i]![0]}</Gated>
        ))}
        {own && special && <Gated feature="pro.prepare" className="btn btn-sm" disabled={!!own[1]} title={own[1]} onClick={() => { const r = run<{ minutes: number }>('pro.prepare', { ...target, step: 'special' }); if (r.ok) toast(`${special.label}: done.`, 'positive'); }}>{own[0]}</Gated>}
      </div>
      <WhyNot reasons={own ? [...reasons, own] : reasons} />
    </div>
  );
}

/** An opportunity's record, newest last, behind a summary. */
function History({ o }: { o: Opportunity }) {
  const { sim } = useGame();
  return (
    <details className="small">
      <summary>{`What Happened (${o.history.length})`}</summary>
      <ul style={{ margin: 'var(--s2) 0 0', paddingLeft: '1.1rem' }}>{o.history.map((e) => <li key={e.id}>{`${formatDate(e.at, sim.zone)}: ${e.words}`}</li>)}</ul>
    </details>
  );
}

/**
 * An offer, its summary first (from 2026-10-23, the owner's brief 23): the part and the project, its dates, its pay, how
 * long it stands, what accepting would bring that matters before it's accepted (OPT, the School), and the two answers.
 * The role in full, the notice's own lines, opens below. Until then the notice's six paragraphs came first and the
 * answers last, under them.
 */
function OfferCard({ o }: { o: Opportunity }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const t = projectOf(o);
  const no = acceptRefusal(sim, person, o);
  const warning = acceptWarning(sim, person, o);
  const agent = o.agentId ? agentById(o.agentId) : undefined;
  const days = datesOf(o);
  // Asking through the agent (from 2026-10-24, brief 27, loop 18): once, a fifth over the offer. From 2026-10-25 the term
  // asked about is the player's: the pay, a recurring part's guaranteed episodes, or a promotional film's pay where its
  // contract leaves it to bargain (`systems/offers.ts`). Each shown only where the work has it.
  const items = TERM_ITEMS.filter((item) => item === 'pay' || (item === 'episodes' ? t.schedule.kind === 'episodes' : promoFor(t) && t.union === 'sag-aftra'));
  const asks = items.map((item) => [item, askLabel(o, item), askMoreRefusal(sim, person, o, item)] as const);
  const asked = o.offer?.asked;
  const answered = askAnswerWords(o);
  const changed = termsChangedWords(o);
  const pendingWords = (item: TermItem) => (item === 'pay' ? `Your agent asked for ${formatMoney(asked!.amount, 'USD')} a ${o.offer!.per}.` : item === 'episodes' ? `Your agent asked for ${counted(asked!.amount, 'guaranteed episode')}.` : `Your agent asked for the promotional film paid ${formatMoney(asked!.amount, 'USD')}.`);
  const acceptLabel = o.condition && !o.condition.accepted ? 'Accept On Its Condition' : 'Accept The Offer';
  return (
    <article className="engagement" aria-label={`${t.role.part}, ${t.project}`}>
      <div className="engagement-head">
        <h3>{`${t.role.part}, ${t.project}`}</h3>
        <span className="chip chip-accent">Offer</span>
      </div>
      <dl className="facts">
        <div><dt>Dates</dt><dd>{`${cap(spanWords(days))}, in ${t.place.city}.`}</dd></div>
        <div><dt>Pay</dt><dd>{payWords(payTermsOf(o), o.offer?.amount)}</dd></div>
        <div><dt>Deadline</dt><dd>{`The offer stands until ${formatWeekdayDate(o.offer!.until, NY)} at ${formatTime(o.offer!.until, NY)}.`}</dd></div>
      </dl>
      {agent && <p className="xs dim" style={{ margin: 0 }}>{`${agent.name} passed it on.`}</p>}
      {o.direct && <p className="small" style={{ margin: 0 }}>{`Offered without an audition. ${o.direct.words}`}</p>}
      {o.condition && <p className="small" style={{ margin: 0 }}>{conditionWords(o).trim()}</p>}
      {/* The latest version of the offer, what the answer was, in its own words (from 2026-10-25): until then a raise or a
          refusal of the pay was all it could say. */}
      {asked && <p className="small" style={{ margin: 0 }}>{answered ?? `${pendingWords(asked.item ?? 'pay')} The answer comes on ${formatWeekdayDate(asked.answerAt, NY)} at ${formatTime(asked.answerAt, NY)}.`}</p>}
      {changed && <p className="small" style={{ margin: 0 }}>{changed}</p>}
      {asks.length > 0 && !asked && <SectionHead title="Negotiating" help="career.negotiation" heading />}
      <Hold o={o} />
      {warning && <p className="callout callout-warning small" style={{ margin: 0 }}>{warning}</p>}
      <p className="xs dim" style={{ margin: 0 }}>{t.medium === 'stage' ? `Missing a day: the company’s understudy covers ${counted(MISSES.stage, 'performance')}, with a written warning; another and the company replaces you.` : ILL_DAY.sizes.includes(t.role.size) ? 'Missing a day: a shoot can’t wait, so sleeping through one costs you the part; laid up or in hospital, the production shoots around you once, and the day isn’t paid.' : 'Missing a day: a shoot can’t wait, so the production replaces you.'}</p>
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <Gated feature="pro.accept_offer" className="btn btn-sm btn-primary" disabled={!!no} title={no} onClick={() => { const r = run<{ conditional?: true }>('pro.accept_offer', { opportunityId: o.id }); if (r.ok) toast(r.value?.conditional ? `Accepted on its condition: ${t.role.part}.` : `Booked: ${t.role.part}.`, 'positive'); }}>{acceptLabel}</Gated>
        <Gated feature="pro.decline_offer" className="btn btn-sm" onClick={() => { const r = run('pro.decline_offer', { opportunityId: o.id }); if (r.ok) toast(`Declined: ${t.role.part}.`, 'neutral'); }}>Decline The Offer</Gated>
        {asks.map(([item, label, askNo]) => (
          <Gated key={item} feature="pro.ask_more" className="btn btn-sm" disabled={!!askNo} title={askNo} onClick={() => { const r = run<{ answerAt: number }>('pro.ask_more', { opportunityId: o.id, item }); if (r.ok) toast(`Asked. The answer comes on ${formatWeekdayDate(r.value!.answerAt, NY)}.`, 'positive'); }}>{label}</Gated>
        ))}
      </div>
      <WhyNot reasons={[[acceptLabel, no], ...asks.map(([, label, askNo]) => [label, askNo] as const)]} />
      <details className="section-fold">
        <summary>The Role In Full</summary>
        <RoleFacts t={t} o={o} />
      </details>
    </article>
  );
}

/** Booked work: the days, the part's preparation, the days as they went, and the pay promised. */
function BookedCard({ e }: { e: Engagement }) {
  const { sim } = useGame();
  const t = projectById(e.projectId)!;
  // A day shot without you for the weather isn't one to come (from 2026-10-25, brief 27's K5).
  const ahead = e.days.filter((d, i) => d.to > sim.now && !e.weather?.some((w) => w.day === i && !w.slipped));
  const worked = (e.log ?? []).filter((l) => l.status === 'worked');
  const missed = (e.log ?? []).filter((l) => l.status === 'missed');
  const promised = e.pay.reduce((n, p) => n + p.promised, 0);
  return (
    <article className="card card-tight col gap-3">
      <h3 style={{ margin: 0 }}>{`${t.role.part}, ${t.project}`}</h3>
      <p className="small" style={{ margin: 0 }}>{ahead.length ? `${cap(counted(ahead.length, 'day'))} to come, the next ${formatWeekdayDate(ahead[0]!.from, NY)} at ${formatTime(ahead[0]!.from, NY)}, in ${t.place.city}. Each stops the clock: press Go to be there.` : 'Every day is behind you.'}</p>
      <Prepare target={{ engagementId: e.id }} prep={e.prep} what="the part" />
      {(worked.length > 0 || missed.length > 0) && <p className="small" style={{ margin: 0 }}>{`${cap(counted(worked.length, 'day'))} worked${worked.some((l) => l.band) ? `, the best ${BAND_LABEL[(['exceptional', 'strong', 'working', 'unready'] as const).find((b) => worked.some((l) => l.band === b))!]}` : ''}${missed.length ? `, and ${counted(missed.length, 'day')} missed` : ''}.`}</p>}
      <p className="small" style={{ margin: 0 }}>{e.pay.some((p) => p.deferred) ? `The pay is deferred: ${DEFERRED_WHY}, so nothing is paid for it.` : `Promised: ${formatMoney(promised, 'USD')} ${e.pay.length === 1 ? 'for one week, due the Thursday after it' : `over ${counted(e.pay.length, 'week')}, each due the Thursday after it`}. It’s promised, not yet paid.`}</p>
    </article>
  );
}

/** A role settled: how it ended, and what went into casting's decision, part by part. */
function Settled({ o }: { o: Opportunity }) {
  const person = useWorld((s) => s.player);
  const t = projectOf(o);
  const decided = (o.rounds ?? []).filter((r) => r.casting);
  const fit = fitOf(person, t);
  return (
    <li className="col gap-1">
      {/* The outcome alone where it names the project already: until 2026-10-21 "Jess, Static On Route 9: You accepted
          Jess in Static On Route 9: four work days…" said the role twice and took two colons (brief 19's app walk). */}
      <span>{o.outcome?.includes(t.project) ? o.outcome : `${t.role.part}, ${t.project}: ${o.outcome ?? o.status}`}</span>
      {decided.length > 0 && (
        <details className="small">
          <summary>Why It Went This Way</summary>
          <ul style={{ margin: 'var(--s2) 0 0', paddingLeft: '1.1rem' }}>
            {decided.map((r) => (
              <li key={r.round}>{`The ${ROUND_WORDS[r.round].noun}: ${r.band ? BAND_LABEL[r.band] : 'not judged'}${r.held ? `. ${r.held.charAt(0).toUpperCase()}${r.held.slice(1)}` : ''}. The role’s fit: ${fitWords(r.casting!.fit)}. The field: ${FIELD_WORDS[t.kind]}. Casting’s chance from those, estimated: ${chanceWords(r.casting!.chance)}. ${r.casting!.yes ? 'It went your way.' : 'It went to another actor.'}${roundWords(r)}`}</li>
            ))}
            <li>{`Your fit for it now: you know its genre ${pct(fit.genre)} of the way, and your techniques are ${pct(fit.demands)} of the way to what the part asks at mastery.`}</li>
          </ul>
        </details>
      )}
    </li>
  );
}

export function OpportunitiesPane() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const opps = person.pro?.opportunities ?? [];
  const open = opps.filter((o) => o.status === 'open' && o.via === 'open' && sim.now < o.submitBy);
  const through = opps.filter((o) => o.status === 'open' && o.via === 'agent');
  const going = opps.filter((o) => o.status === 'submitted' || o.status === 'audition' || o.status === 'callback');
  const offers = opps.filter((o) => o.status === 'offered');
  const booked = (person.pro?.engagements ?? []).filter((e) => e.status !== 'finished' && e.status !== 'canceled');
  const settled = opps.filter((o) => ['booked', 'passed', 'declined', 'lapsed', 'withdrawn', 'refused'].includes(o.status) && (o.rounds?.length || o.status !== 'lapsed')).slice(-8).reverse();
  const agreement = activeAgreement(person, sim.now);
  const agent = agreement ? agentById(agreement.agentId) : undefined;
  // The roles written for the player, so a project with a part for each is named once (from 2026-10-21).
  const agentOnly = PROJECTS.filter((t) => !t.access.open && writtenFor(t, person));
  return (
    <div className="col gap-5">
      <p className="small" style={{ margin: 0 }}>The projects, companies and casting offices here are invented for the game, except a few parts drawn from real productions, and those say so. No real production is casting. New roles go up each Monday morning.</p>
      {/* An offer waiting on an answer first, its deadline the nearest thing on the tab (from 2026-10-23, brief 23): until
          then it was fourth, under Open Calls, Through An Agent and In Progress, and below the fold at 1440 by 900. With
          none, the tab says so where it always did, after In Progress. */}
      {offers.length > 0 && (
        <Panel title="Offers" help="career.offers">
          <div className="col gap-4">{offers.map((o) => <OfferCard key={o.id} o={o} />)}</div>
        </Panel>
      )}
      <Panel title="Open Calls" help="career.opportunities">
        <div className="col gap-4">
          {open.length ? open.map((o) => <OpenRole key={o.id} o={o} />) : <p className="small" style={{ margin: 0 }}>No open role takes submissions now. New ones go up on Monday morning.</p>}
        </div>
      </Panel>
      <Panel title="Through An Agent" help="career.opportunities">
        <div className="col gap-3">
          {agent
            ? <p className="small" style={{ margin: 0 }}>{`${agent.name} represents you, and submits you for the roles casting offices release to agents, where they suit you and your materials are ready.`}</p>
            : <p className="small" style={{ margin: 0 }}>{`Some casting offices release their roles to agents only, so without an agent you can’t be seen for them: ${agentOnly.filter((t) => t.fictional).map((t) => `${t.casting} for ${t.project}`).join(', ')}, all invented for the game${agentOnly.some((t) => !t.fictional) ? `, and the game’s own parts in ${spokenList(agentOnly.filter((t) => !t.fictional).map((t) => t.project))}` : ''}.`}</p>}
          {through.map((o) => {
            const t = projectOf(o);
            return (
              <article key={o.id} className="card card-tight col gap-2">
                <h3 style={{ margin: 0 }}>{`${t.role.part}, ${t.project}`}</h3>
                {o.again && <p className="small" style={{ margin: 0 }}>{againWords(o)}</p>}
                {o.recast && <p className="small" style={{ margin: 0 }}>{recastWords(o)}</p>}
                <RoleFacts t={t} o={o} />
                <History o={o} />
              </article>
            );
          })}
        </div>
      </Panel>
      <Panel title="In Progress" help="career.auditions">
        <div className="col gap-4">
          {going.length ? going.map((o) => <InProgress key={o.id} o={o} />) : <p className="small" style={{ margin: 0 }}>No role is in progress. A role you submit for moves here, with its audition once casting answers.</p>}
        </div>
      </Panel>
      {offers.length === 0 && (
        <Panel title="Offers" help="career.offers">
          <p className="small" style={{ margin: 0 }}>No offer stands now.</p>
        </Panel>
      )}
      <Panel title="Booked Work" help="career.offers">
        <div className="col gap-4">
          {booked.length ? booked.map((e) => <BookedCard key={e.id} e={e} />) : <p className="small" style={{ margin: 0 }}>No work booked.</p>}
        </div>
      </Panel>
      {settled.length > 0 && (
        <Panel title="Settled" help="career.auditions">
          <ul className="small col gap-2" style={{ margin: 0, paddingLeft: '1.1rem' }}>{settled.map((o) => <Settled key={o.id} o={o} />)}</ul>
        </Panel>
      )}
      <Fine>{`Every project is fictional except a part drawn from a real production, which says so: the production is real, and the part, its dates and its place are the game’s. A casting office’s timings, the trip from where you live, casting’s chance for each audition and fit, and the field each kind of work draws are estimated. The pay is each union’s published minimum. Off-Broadway’s and a non-union short’s aren’t published, so the game estimates them. The School’s rule is its Bulletin’s; asking ${OUTSIDE_WORK.aheadDays} days ahead, ${OUTSIDE_WORK.mostDays} working days and ${counted(OUTSIDE_WORK.mostClassDays, 'class day')} at most, and the dean’s week are the game’s readings of it.`}</Fine>
    </div>
  );
}
