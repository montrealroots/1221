/**
 * SLATE — the Career screen's Representation tab (from 2026-10-21, the owner's brief 19, G1 to G8): the agent's panel,
 * how to reach him, the materials an approach sends, the meeting, Why It Went This Way, the agreement and the history
 * (`systems/proagent.ts`).
 *
 * The notice where he first appears, that he and his agency are invented and how his office takes submissions, stands
 * above everything until it's read, then stays one press away (Read The Notice Again). Until 2026-10-21 he was a real
 * agent, and the panel's head carried a line that his words and decisions were invented too. Every line is read
 * from the record as it's drawn; every control runs a command through `run`, behind its guide chapter (`<Gated>`), with
 * the command's own refusal said under it before it's pressed (`WhyNot`). Nothing here gives his contact details,
 * which the game doesn't hold.
 *
 * From 2026-10-25 (the owner's brief 27, Part 6 and loop 8; `systems/representation.ts`): Asking For Different Terms, the
 * one ask while an agreement is offered, each ask with its chance and its refusal, and the terms as they stand and as
 * first offered; an agent's own department and its rule on submissions (Halberd Talent's voice-over department); the
 * materials a voice department's approach sends, a voice demo for the reel; and the festival among the ways in.
 */

import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine, WhyNot } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { useKept } from '@/ui/kept';
import { formatDate, formatDateTime } from '@/engine/core/time';
import { AGREEMENT } from '@/engine/content/careerwork';
import { AGENTS, FIELD_LABEL, agencyOf, departmentOf, policyOf, type Agent, type AgentRoute } from '@/engine/content/agents';
import { AGENCY_RECORDS, fieldWords } from '@/engine/content/agencies';
import { spokenList } from '@/engine/core/text';
import { materialsCheck } from '@/engine/systems/pro';
import { BAND_LABEL } from '@/engine/systems/coursework';
import { countWords } from '@/engine/systems/school';
import {
  COOLDOWN_WORDS, GATE, LEVEL_LABEL, REAL_CHANCE_WORDS, REFERRAL_BAND, STAGE_LABEL, TEN, TIME_WORDS, agreementInForce, answerRefusal, checkRefusal, endRefusal, factorLabel, himTitle, historyOf, interestOf, meetingOf, moveRefusal,
  nextStep, noticeRefusal, offeredAgreement, officeTitle, referralRefusal, referrersOf, relationOf, sendRefusal, signRefusal, stillOwed, supplyRefusal,
  type EndHow, type Level,
} from '@/engine/systems/proagent';
import { ASKS, ASK_LABEL, askChance, askRefusal, askWords, chanceTenths, dealOf, purposeOf, realTermsWords, sampleName, scopeWords, termWords, territoryWords } from '@/engine/systems/representation';

const LEVEL_TONE: Readonly<Record<Level, string>> = { short: 'chip chip-negative', near: 'chip chip-warning', at: 'chip chip-info', beyond: 'chip chip-positive' };

// The stages an approach is under way at, which the chooser opens on before the first agent.
const UNDER_WAY = new Set(['sent', 'waiting', 'requested', 'meeting', 'deciding', 'offered', 'represented']);

/**
 * The tab: the agents, one shown at a time, and the agencies as their own pages had them (from 2026-10-24, brief 25's
 * Module 3). Until then it drew every agent's panels one after another, which with one agent was the whole tab. It
 * opens on the agent who represents you, or one an approach is under way with, or the first; the choice is kept while
 * you're elsewhere, never in the save.
 */
export function RepresentationPane() {
  const person = useWorld((s) => s.player);
  const busy = AGENTS.find((a) => relationOf(person, a.id)?.stage === 'represented') ?? AGENTS.find((a) => UNDER_WAY.has(relationOf(person, a.id)?.stage ?? ''));
  const [chosen, choose] = useKept<string>('representation:agent', (busy ?? AGENTS[0]!).id);
  const agent = AGENTS.find((a) => a.id === chosen) ?? AGENTS[0]!;
  return (
    <div className="col gap-5">
      <Panel title="Agents" help="career.agent">
        <div className="col gap-3">
          <ul className="col gap-3" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {AGENTS.map((a) => (
              <li key={a.id} className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="col gap-1">
                  <span className="small strong">{a.name}</span>
                  <span className="xs dim">{`${a.role}, ${agencyOf(a).name}, ${agencyOf(a).office.city}. ${a.real ? 'A real agent.' : 'Invented for the game.'} ${STAGE_LABEL[relationOf(person, a.id)?.stage ?? 'none']}.`}</span>
                </div>
                <button type="button" className="btn btn-sm" aria-pressed={a.id === agent.id} disabled={a.id === agent.id} onClick={() => choose(a.id)}>{a.id === agent.id ? 'Shown Below' : 'Show'}</button>
              </li>
            ))}
          </ul>
          <Fine>The real agents are the theatrical agents Stewart Talent’s New York office names on its own page, as the game read it. What they’d say or do with you is the game’s invention, and nothing reaches them.</Fine>
        </div>
      </Panel>
      <AgentPanels key={agent.id} agent={agent} />
      <AgenciesPanel />
    </div>
  );
}

/** The agencies, each as its own pages had it: what it does for actors, each office's way in, and what the game does with it. */
function AgenciesPanel() {
  return (
    <Panel title="Agencies" help="career.agent">
      <div className="col gap-3">
        {AGENCY_RECORDS.map((r) => (
          <details key={r.id} className="section-fold">
            <summary>{r.name}</summary>
            <dl className="facts small">
              <div><dt>About</dt><dd>{fieldWords(r.about)}</dd></div>
              {r.offices.map((o, i) => (
                <div key={o.city ?? i}><dt>{o.city ?? 'Its Offices'}</dt><dd>{`Way in: ${unstopped(fieldWords(o.route))}${o.agents.kind === 'unknown' ? '' : `. Agents named for acting: ${fieldWords(o.agents)}`}.`}</dd></div>
              ))}
              <div><dt>In The Game</dt><dd>{r.inGame}</dd></div>
            </dl>
          </details>
        ))}
        <Fine>Each agency is as its own pages had it when the game read them, on October 23 and 24, 2026, and what they don’t say isn’t known to the game. The game ranks no agency.</Fine>
      </div>
    </Panel>
  );
}

function AgentPanels({ agent }: { agent: Agent }) {
  const person = useWorld((s) => s.player);
  const read = relationOf(person, agent.id)?.noticeShownAt !== undefined;
  return (
    <>
      <AgentPanel agent={agent} />
      {read && (
        <>
          <ReachPanel agent={agent} />
          <MaterialsPanel agent={agent} />
          <MeetingPanel agent={agent} />
          <WhyPanel agent={agent} />
          <AgreementPanel agent={agent} />
          <TermsPanel agent={agent} />
          <HistoryPanel agent={agent} />
        </>
      )}
    </>
  );
}

/** Who he is, the notice, and where you stand with him. */
function AgentPanel({ agent }: { agent: Agent }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const agency = agencyOf(agent);
  // The agent's own department and its words for the rule on submissions (from 2026-10-25, the voice-over department's).
  const department = departmentOf(agent);
  const rel = relationOf(person, agent.id);
  const read = rel?.noticeShownAt !== undefined;
  const no = noticeRefusal(sim, person, agent);
  return (
    <Panel title={agent.name} subtitle={`${agent.role}, ${agency.name}, ${agency.office.city}`} help="career.agent">
      <div className="col gap-3">
        {read ? (
          <details className="small">
            <summary>Read The Notice Again</summary>
            <p style={{ margin: 'var(--s2) 0 0' }}>{agent.notice}</p>
          </details>
        ) : (
          <div className="callout callout-accent small col gap-2" role="note">
            <p style={{ margin: 0 }}>{agent.notice}</p>
            <div><Gated feature="pro.agent_notice" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run('pro.agent_notice', { agentId: agent.id }); if (r.ok) toast(`The notice stays on ${agent.words.his} panel, under Read The Notice Again.`, 'positive'); }}>I’ve Read This</Gated></div>
          </div>
        )}
        <dl className="col gap-2 small" style={{ margin: 0 }}>
          <div><dt className="strong">Department</dt><dd style={{ margin: 0 }}>{`${department.called}, also called ${department.alsoCalled}: ${spokenList(department.fields.map((f) => FIELD_LABEL[f]))}`}</dd></div>
          <div><dt className="strong">Submissions</dt><dd style={{ margin: 0 }}>{policyOf(agent).words}</dd></div>
          <div><dt className="strong">{`Where You Stand With ${himTitle(agent)}`}</dt><dd style={{ margin: 0 }}>{STAGE_LABEL[rel?.stage ?? 'none']}</dd></div>
          <div><dt className="strong">What’s Next</dt><dd style={{ margin: 0 }}>{nextStep(sim, person, agent)}</dd></div>
        </dl>
        <Fine>{agent.real ? `${agent.name}’s name and role, and the office’s way of taking submissions, are as Stewart Talent’s own page had them on ${formatDate(Date.parse(`${agent.real.read}T16:00:00Z`), sim.zone)}. The game knows nothing else about ${agent.name}, so it says nothing of a list, clients or preferences, and whatever happens between you here is its invention.` : `${agent.name} and ${agency.name} are invented for the game. How ${agent.words.office} takes submissions and reaches an actor is the game’s own rule, kept from how a real New York legit department publishes its own.`}</Fine>
      </div>
    </Panel>
  );
}

/** The routes the policy allows: the School's follow-up, and a referral from someone you've worked with. */
function ReachPanel({ agent }: { agent: Agent }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const rel = relationOf(person, agent.id);
  const jobs = referrersOf(sim, person, agent);
  const via = rel?.via;
  return (
    <Panel title={`How To Reach ${himTitle(agent)}`} help="career.agent">
      <div className="col gap-3">
        <p className="small" style={{ margin: 0 }}>{waysIn(agent)}</p>
        {via && <p className="small" style={{ margin: 0 }}>{via.route === 'showcase' ? `The School’s follow-up introduced you on ${formatDate(via.at, sim.zone)}.` : via.route === 'festival' ? `You met ${agent.words.office} at ${via.by ?? 'a festival'} on ${formatDate(via.at, sim.zone)}.` : `${capital(via.by ?? 'A referral')} referred you on ${formatDate(via.at, sim.zone)}.`}</p>}
        <div className="col gap-2">
          <h3 className="eyebrow" style={{ margin: 0 }}>People You’ve Worked With</h3>
          {jobs.length ? (
            <ul className="small col gap-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {jobs.map((j) => {
                const no = referralRefusal(sim, person, agent, j.engagementId);
                const label = 'Ask For A Referral';
                return (
                  <li key={j.engagementId} className="col gap-1">
                    <span>{`${capital(j.by)}, from your work as ${j.job}${j.band ? `, judged ${BAND_LABEL[j.band]}` : ', not judged'}`}</span>
                    <div><Gated feature="pro.ask_referral" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ by: string }>('pro.ask_referral', { agentId: agent.id, engagementId: j.engagementId }); if (r.ok) toast(`${capital(r.value!.by)} referred you to ${agent.words.office}.`, 'positive'); }}>{label}</Gated></div>
                    <WhyNot reasons={[[label, no]]} />
                  </li>
                );
              })}
            </ul>
          ) : <p className="small" style={{ margin: 0 }}>{`None yet. A professional job you finish, its work judged ${BAND_LABEL[REFERRAL_BAND]} or better, can bring a referral from the people who cast it.`}</p>}
        </div>
        <Fine>{`The bar for a referral, work judged ${BAND_LABEL[REFERRAL_BAND]} or better, is assumed in the game.`}</Fine>
      </div>
    </Panel>
  );
}

/** What an approach sends, checked; the send; and what his office asked for, where it asked. */
function MaterialsPanel({ agent }: { agent: Agent }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const rel = relationOf(person, agent.id);
  // A voice department's approach is checked as voice casting checks it, with a voice demo for the reel (from 2026-10-25).
  const problems = materialsCheck(person, purposeOf(agent), sim.now);
  const checkNo = checkRefusal(sim, person, agent);
  const sendNo = sendRefusal(sim, person, agent);
  const supplyNo = supplyRefusal(sim, person, agent);
  const asked = rel?.stage === 'requested' && rel.request;
  return (
    <Panel title={`Your Materials For ${himTitle(agent)}`} help="career.agent">
      <div className="col gap-3">
        {problems.length
          ? <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{problems.map((p) => <li key={`${p.kind}:${p.problem}`}>{p.words}</li>)}</ul>
          : <p className="small" style={{ margin: 0 }}>{`Your headshots, résumé and ${sampleName(agent)} are all current.`}</p>}
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="pro.agent_check" className="btn btn-sm" disabled={!!checkNo} title={checkNo} onClick={() => { const r = run('pro.agent_check', { agentId: agent.id }); if (r.ok) toast('Your materials have what an approach needs.', 'positive'); }}>Check Your Materials</Gated>
          <Gated feature="pro.send_materials" className="btn btn-sm" disabled={!!sendNo} title={sendNo} onClick={() => { const r = run('pro.send_materials', { agentId: agent.id }); if (r.ok) toast(`Your materials went to ${agent.words.office}.`, 'positive'); }}>Send Your Materials</Gated>
        </div>
        <WhyNot reasons={[['Check Your Materials', checkNo], ['Send Your Materials', sendNo]]} />
        {asked && (
          <div className="col gap-2">
            <h3 className="eyebrow" style={{ margin: 0 }}>{`What ${officeTitle(agent)} Asked For`}</h3>
            <p className="small" style={{ margin: 0 }}>{nextStep(sim, person, agent)}</p>
            <div><Gated feature="pro.supply_material" className="btn btn-sm" disabled={!!supplyNo} title={supplyNo} onClick={() => { const r = run('pro.supply_material', { agentId: agent.id }); if (r.ok) toast(`What ${agent.words.office} asked for went to it.`, 'positive'); }}>{`Send What ${officeTitle(agent)} Asked For`}</Gated></div>
            <WhyNot reasons={[[`Send What ${officeTitle(agent)} Asked For`, supplyNo]]} />
          </div>
        )}
        <Fine>{`How long ${agent.words.office} takes to answer (usually ${TIME_WORDS.reply}), and that no answer in ${TIME_WORDS.silence} counts as no, are assumed in the game. So is the wait before it looks again, ${COOLDOWN_WORDS.pass} after a pass and ${COOLDOWN_WORDS.silence} after no answer or a declined offer, and that it then looks only at something new.`}</Fine>
      </div>
    </Panel>
  );
}

/** The meeting set with his office: when, where, and Ask To Move, once. */
function MeetingPanel({ agent }: { agent: Agent }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const found = meetingOf(sim, person, agent);
  if (!found || found.meeting.status !== 'set') return null;
  const m = found.meeting;
  const no = moveRefusal(sim, person, m.id);
  return (
    <Panel title="The Meeting" help="career.agent-answers">
      <div className="col gap-3">
        <dl className="col gap-2 small" style={{ margin: 0 }}>
          <div><dt className="strong">When</dt><dd style={{ margin: 0 }}>{formatDateTime(m.at, sim.zone)}</dd></div>
          <div><dt className="strong">Where</dt><dd style={{ margin: 0 }}>{m.where === 'office' ? `At ${agencyOf(agent).name}’s ${agencyOf(agent).office.city} office` : 'By video'}</dd></div>
          <div><dt className="strong">Moved</dt><dd style={{ margin: 0 }}>{m.moved ? 'Once already, so it can’t be moved again' : 'Not yet: it can be moved once'}</dd></div>
        </dl>
        <div><Gated feature="pro.ask_to_move" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ at: number }>('pro.ask_to_move', { meetingId: m.id }); if (r.ok) toast(`${capital(agent.words.office)} moved the meeting to ${formatDateTime(r.value!.at, sim.zone)}.`, 'positive'); }}>Ask To Move</Gated></div>
        <WhyNot reasons={[['Ask To Move', no]]} />
        <Fine>{`Missing it closes your approach, since a meeting comes before an offer in the game. That a meeting can be moved once, ${TIME_WORDS.move} on, is assumed, and so is the trip’s time.`}</Fine>
      </div>
    </Panel>
  );
}

/** Why It Went This Way: the last decision's factors as they were, and where they stand now. */
function WhyPanel({ agent }: { agent: Agent }) {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const rel = relationOf(person, agent.id);
  // Kept while the player is elsewhere, as a screen keeps its tab (`ui/kept.ts`): where they were looking, never the save.
  const [open, setOpen] = useKept<boolean>(`reasons:${agent.id}`, false);
  const now = interestOf(sim, person, agent, sim.now);
  const why = rel?.why;
  // A block a factor, its name and level on one line and the reason under it: a three-column table clipped its reasons
  // inside the panel at 390 on the built app (the walk of 2026-10-21), and this reads at any width.
  const rows = (factors: readonly { id: string; label: string; level: string; words: string }[]) => (
    <ul className="col gap-3" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {factors.map((f) => (
        <li key={f.id} className="col gap-1">
          <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'baseline' }}>
            <h4 className="small strong" style={{ margin: 0 }}>{f.label}</h4>
            <span className={LEVEL_TONE[f.level as Level]}>{LEVEL_LABEL[f.level as Level]}</span>
          </div>
          <p className="small" style={{ margin: 0 }}>{f.words}</p>
        </li>
      ))}
    </ul>
  );
  return (
    <Panel title="Why It Went This Way" help="career.reasons">
      <div className="col gap-3">
        <p className="small" style={{ margin: 0 }}>{why ? `${capital(agent.words.office)}’s last decision was on ${formatDate(why.at, sim.zone)}. The game’s reasons for it are ${countWords(now.factors.length)} separate factors, each against a bar the game sets.` : `${capital(agent.words.office)} hasn’t decided anything yet. The game’s reasons for a decision are ${countWords(now.factors.length)} separate factors, each against a bar the game sets.`}</p>
        <div><Gated feature="ui.career-reasons" className="btn btn-sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? 'Hide The Reasons' : 'Show The Reasons'}</Gated></div>
        {open && (
          <div className="col gap-4">
            {why && (
              <div className="col gap-2">
                <h3 className="eyebrow" style={{ margin: 0 }}>At The Last Decision</h3>
                {rows(why.factors)}
                <p className="small" style={{ margin: 0 }}>{`${ofAll(why.atOrBeyond, why.factors.length)} were at the bar or beyond, and an approach needs ${countWords(why.needed)}.${why.chance !== undefined ? ` Against the year’s other actors, the game gave ${why.step === 'decision' ? 'an offer' : 'it'} about a ${Math.round(why.chance * 100)}% chance.` : ''}`}</p>
              </div>
            )}
            <div className="col gap-2">
              <h3 className="eyebrow" style={{ margin: 0 }}>As Things Stand Now</h3>
              {rows(now.factors)}
              <p className="small" style={{ margin: 0 }}>{`${ofAll(now.atOrBeyond, now.factors.length)} are at the bar or beyond, and an approach needs ${countWords(now.needed)}.${now.gate ? ` Against the year’s other actors, the game would give it about a ${Math.round(now.chance * 100)}% chance.` : ''}`}</p>
            </div>
          </div>
        )}
        <Fine>{`The bar, the ${countWords(GATE)} factors an approach needs and the chances are all the game’s own, none of them ${agent.words.his}. Better work raises the chance, and the game never makes it certain. ${agent.roster ? `${factorLabel(agent, 'roster').replace(' (Assumed)', '')} is drawn for each year and assumed.` : REAL_CHANCE_WORDS}`}</Fine>
      </div>
    </Panel>
  );
}

/** The agreement: every term in full before it's accepted, then its standing, its ends and what it leaves owed. */
function AgreementPanel({ agent }: { agent: Agent }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const offered = offeredAgreement(person, agent);
  const inForce = agreementInForce(person, agent, sim.now);
  const ended = [...(person.pro?.agreements ?? [])].filter((a) => a.agentId === agent.id && a.status === 'ended').sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0];
  const shown = offered ?? inForce;
  const answerNo = answerRefusal(sim, person, agent);
  // Accepting reads one agent at a time too (from 2026-10-24); declining never waits on another agreement.
  const signNo = signRefusal(sim, person, agent);
  const ends: readonly [EndHow, string][] = [['agreement', 'End It By Agreement'], ['no-offer', `End It: No Offer In ${AGREEMENT.noOfferDays} Days`], ['too-little-work', `End It: Under ${capital(TEN)} Days’ Work`]];
  if (!shown && !ended) return null;
  return (
    <Panel title="The Agreement" help="career.agreement">
      <div className="col gap-3">
        {offered && <p className="small" style={{ margin: 0 }}>{`${capital(agent.words.he)} offered it on ${formatDate(offered.offeredAt, sim.zone)}, and the offer stands until ${formatDate(offered.standsUntil, sim.zone)}. Read every term before you answer.`}</p>}
        {inForce && <p className="small" style={{ margin: 0 }}>{`You signed it on ${formatDate(inForce.signedAt!, sim.zone)}. It runs until ${formatDate(inForce.endsAt!, sim.zone)}.`}</p>}
        {!shown && ended && <p className="small" style={{ margin: 0 }}>{`It ended on ${formatDate(ended.endedAt!, sim.zone)}. ${stillOwed(person, ended)}`}</p>}
        {shown && (
          <dl className="col gap-2 small" style={{ margin: 0 }}>
            {shown.terms.map((t) => (
              <div key={t.id}>
                <dt className="strong">{`${t.heading} (${t.basis === 'verified' ? 'A Published Rule' : 'The Game’s Own Term'})`}</dt>
                <dd style={{ margin: 0 }}>{t.words}</dd>
              </div>
            ))}
          </dl>
        )}
        {offered && (
          <>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              <Gated feature="pro.accept_agreement" className="btn btn-sm" disabled={!!signNo} title={signNo} onClick={() => { const r = run('pro.accept_agreement', { agentId: agent.id }); if (r.ok) toast(`${agent.name} represents you from today.`, 'positive'); }}>Accept The Agreement</Gated>
              <Gated feature="pro.decline_agreement" className="btn btn-sm" disabled={!!answerNo} title={answerNo} onClick={() => { const r = run('pro.decline_agreement', { agentId: agent.id }); if (r.ok) toast('You declined the agreement.', 'neutral'); }}>Decline The Agreement</Gated>
            </div>
            <WhyNot reasons={[['Accept The Agreement', signNo], ['Decline The Agreement', answerNo]]} />
          </>
        )}
        {inForce && (
          <>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {ends.map(([how, label]) => {
                const no = endRefusal(sim, person, agent, how);
                return <Gated key={how} feature="pro.end_agreement" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run('pro.end_agreement', { agentId: agent.id, how }); if (r.ok) toast('Your agreement has ended.', 'neutral'); }}>{label}</Gated>;
              })}
            </div>
            <WhyNot reasons={ends.map(([how, label]) => [label, endRefusal(sim, person, agent, how)] as const)} />
          </>
        )}
        <Fine>Each term marked A Published Rule follows the unions’ and New York’s published rules, with their sources in the game’s research. {`A term marked The Game’s Own Term is the game’s, and nothing here is ${agent.words.his} own agreement, which isn’t published.`}</Fine>
      </div>
    </Panel>
  );
}

/**
 * Asking For Different Terms (from 2026-10-25, brief 27): the terms as they stand and as first offered, the one ask while
 * the agreement is offered, each with the game's chance and its refusal, and the office's answer once it comes.
 */
function TermsPanel({ agent }: { agent: Agent }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const offered = offeredAgreement(person, agent);
  const shown = offered ?? agreementInForce(person, agent, sim.now);
  if (!shown) return null;
  const z = sim.zone;
  const d = dealOf(shown);
  const first = shown.deal?.versions[0] ?? d;
  const ask = shown.ask;
  const office = agent.words.office;
  const open = offered && !ask ? ASKS.map((a) => ({ a, no: askRefusal(sim, person, agent, a) })) : [];
  return (
    <Panel title="Asking For Different Terms" help="career.agreement-terms">
      <div className="col gap-3">
        <p className="small" style={{ margin: 0 }}>{`As it stands, it covers ${scopeWords(d)} ${territoryWords(d)}, for ${termWords(d.termDays)} from the day you sign it${d.version > 1 ? `, as ${office} agreed on ${formatDate(d.at, z)}` : ', as offered'}.`}</p>
        {d.version > 1 && <p className="small" style={{ margin: 0 }}>{`As first offered, it covered ${scopeWords(first)} ${territoryWords(first)}, for ${termWords(first.termDays)}.`}</p>}
        {ask && <p className="small" style={{ margin: 0 }}>{ask.answer ? `You asked for ${askWords(ask.what, first)} on ${formatDate(ask.at, z)}, and ${office} ${ask.answer === 'agreed' ? 'agreed' : 'kept the terms as offered'} on ${formatDate(ask.answeredAt!, z)}.` : `You asked for ${askWords(ask.what, d)} on ${formatDate(ask.at, z)}. ${capital(office)} answers on ${formatDateTime(ask.answerAt, z)}, and you can accept the agreement once it has.`}</p>}
        {offered && !ask && (
          <>
            <p className="small" style={{ margin: 0 }}>{`Before you answer the offer, you can ask ${office} once to change it:`}</p>
            <ul className="small col gap-1" style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {open.filter((x) => !x.no).map(({ a }) => <li key={a}>{`${ASK_LABEL[a]}: ${askWords(a, d)}. The game puts the chance ${office} agrees at ${chanceTenths(askChance(sim, person, agent, a))}.`}</li>)}
            </ul>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {open.map(({ a, no }) => <Gated key={a} feature="pro.ask_terms" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ answerAt: number }>('pro.ask_terms', { agentId: agent.id, ask: a }); if (r.ok) toast(`${capital(office)} answers on ${formatDateTime(r.value!.answerAt, z)}.`, 'positive'); }}>{ASK_LABEL[a]}</Gated>)}
            </div>
            <WhyNot reasons={open.map(({ a, no }) => [ASK_LABEL[a], no] as const)} />
          </>
        )}
        <Fine>{`Every term you can ask about is the game’s own, and so are the shorter term, the time ${office} takes to answer and the chance it agrees, which rises with how many of the factors under Why It Went This Way are at the bar or beyond. The commission is the unions’ and New York’s rule, and no ask changes it.${agent.real ? ` ${realTermsWords(agent)}` : ''}`}</Fine>
      </div>
    </Panel>
  );
}

/** Every step, newest first, with its date. */
function HistoryPanel({ agent }: { agent: Agent }) {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const events = historyOf(person, agent);
  return (
    <Panel title={`History With ${officeTitle(agent)}`} help="career.agent-answers">
      {events.length
        ? <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{events.map((e) => <li key={e.id}>{`${formatDate(e.at, sim.zone)}: ${e.words}`}</li>)}</ul>
        : <p className="small" style={{ margin: 0 }}>None yet.</p>}
    </Panel>
  );
}

const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
/** Each way in as How To Reach says it (from 2026-10-25, built from the agent's routes, an introduction at a festival among them). */
const WAY: Readonly<Record<AgentRoute, string>> = {
  showcase: 'through the School’s follow-up after the showcase',
  referral: 'a referral from someone you’ve worked with on a finished job',
  festival: 'an introduction at a festival where your film screens and you do its press',
};
function waysIn(agent: Agent): string {
  const ways = agent.routes.map((r) => WAY[r]);
  const office = capital(agent.words.office);
  if (ways.length === 1) return `${office} takes your materials one way in the game: ${ways[0]}. The game reads a referral as not unsolicited.`;
  const said = ways.length === 2 ? `${ways[0]}, or ${ways[1]}` : `${ways.slice(0, -1).join(', ')} or ${ways.at(-1)}`;
  return `${office} takes your materials ${countWords(ways.length)} ways in the game: ${said}.`;
}
/** A sentence without its full stop, to go on inside another. */
const unstopped = (s: string): string => s.replace(/\.$/, '');
/**
 * How many of the factors, as a sentence opens on it: "None of the seven", "Four of the seven", "All seven". Seven for
 * the game's own agent, six for a real one, whose list isn't a factor (from 2026-10-24; until then always seven).
 */
const ofAll = (n: number, of: number): string => (n >= of ? `All ${countWords(of)}` : n === 0 ? `None of the ${countWords(of)}` : `${capital(countWords(n))} of the ${countWords(of)}`);
