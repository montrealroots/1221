/**
 * SLATE — the Career screen's Representation tab (from 2026-10-21, the owner's brief 19, G1 to G8): the agent's panel,
 * how to reach him, the materials an approach sends, the meeting, Why It Went This Way, the agreement and the history
 * (`systems/proagent.ts`).
 *
 * He's a real person, so the panel carries the agent's `fictional` line at its head, and the notice where he first
 * appears stands above everything until it's read, then stays one press away (Read The Notice Again). Every line is read
 * from the record as it's drawn; every control runs a command through `run`, behind its guide chapter (`<Gated>`), with
 * the command's own refusal said under it before it's pressed (`WhyNot`). Nothing here gives his contact details,
 * which the game doesn't hold.
 */

import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine, WhyNot } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { useKept } from '@/ui/kept';
import { formatDate, formatDateTime } from '@/engine/core/time';
import { AGENTS, FIELD_LABEL, agencyOf, type Agent } from '@/engine/content/agents';
import { spokenList } from '@/engine/core/text';
import { materialsCheck } from '@/engine/systems/pro';
import { BAND_LABEL } from '@/engine/systems/coursework';
import { countWords } from '@/engine/systems/school';
import {
  LEVEL_LABEL, STAGE_LABEL, agreementInForce, answerRefusal, checkRefusal, endRefusal, historyOf, interestOf, meetingOf, moveRefusal,
  nextStep, noticeRefusal, offeredAgreement, referralRefusal, referrersOf, relationOf, sendRefusal, stillOwed, supplyRefusal,
  type EndHow, type Level,
} from '@/engine/systems/proagent';

const LEVEL_TONE: Readonly<Record<Level, string>> = { short: 'chip chip-negative', near: 'chip chip-warning', at: 'chip chip-info', beyond: 'chip chip-positive' };

export function RepresentationPane() {
  return (
    <div className="col gap-5">
      {AGENTS.map((agent) => <AgentPanels key={agent.id} agent={agent} />)}
    </div>
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
          <HistoryPanel agent={agent} />
        </>
      )}
    </>
  );
}

/** Who he is, as published, the fictional line and the notice, and where you stand with him. */
function AgentPanel({ agent }: { agent: Agent }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const agency = agencyOf(agent);
  const rel = relationOf(person, agent.id);
  const read = rel?.noticeShownAt !== undefined;
  const no = noticeRefusal(sim, person, agent);
  return (
    <Panel title={agent.name} subtitle={`${agent.role}, ${agency.name}, ${agency.office.city}`} help="career.agent">
      <div className="col gap-3">
        <p className="xs dim" style={{ margin: 0 }}>{agent.fictional}</p>
        {read ? (
          <details className="small">
            <summary>Read The Notice Again</summary>
            <p style={{ margin: 'var(--s2) 0 0' }}>{agent.notice}</p>
          </details>
        ) : (
          <div className="callout callout-accent small col gap-2" role="note">
            <p style={{ margin: 0 }}>{agent.notice}</p>
            <div><Gated feature="pro.agent_notice" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run('pro.agent_notice', { agentId: agent.id }); if (r.ok) toast('The notice stays on his panel, under Read The Notice Again.', 'positive'); }}>I’ve Read This</Gated></div>
          </div>
        )}
        <dl className="col gap-2 small" style={{ margin: 0 }}>
          <div><dt className="strong">Department</dt><dd style={{ margin: 0 }}>{`${agency.department.called}, also called ${agency.department.alsoCalled}: ${spokenList(agency.department.fields.map((f) => FIELD_LABEL[f]))}`}</dd></div>
          <div><dt className="strong">Submissions</dt><dd style={{ margin: 0 }}>{`${agency.name}’s page for ${agency.office.city} ${agency.department.called.toLowerCase()} submissions says: “${agency.policy.quote}”`}</dd></div>
          <div><dt className="strong">Where You Stand With Him</dt><dd style={{ margin: 0 }}>{STAGE_LABEL[rel?.stage ?? 'none']}</dd></div>
          <div><dt className="strong">What’s Next</dt><dd style={{ margin: 0 }}>{nextStep(sim, person, agent)}</dd></div>
        </dl>
        <Fine>His name, the agency, its New York office, his department and the fields it covers are from the agency’s own pages and the trade press, read on October 20, 2026, and so is the agency’s policy on submissions. Everything he says and decides here is invented, and the game holds no contact details for him or the agency.</Fine>
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
    <Panel title="How To Reach Him" help="career.agent">
      <div className="col gap-3">
        <p className="small" style={{ margin: 0 }}>His office takes your materials two ways in the game: through the School’s follow-up after the showcase, or a referral from someone you’ve worked with on a finished job.</p>
        {via && <p className="small" style={{ margin: 0 }}>{via.route === 'showcase' ? `The School’s follow-up introduced you on ${formatDate(via.at, sim.zone)}.` : `${capital(via.by ?? 'A referral')} referred you on ${formatDate(via.at, sim.zone)}.`}</p>}
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
                    <div><Gated feature="pro.ask_referral" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ by: string }>('pro.ask_referral', { agentId: agent.id, engagementId: j.engagementId }); if (r.ok) toast(`${capital(r.value!.by)} referred you to his office.`, 'positive'); }}>{label}</Gated></div>
                    <WhyNot reasons={[[label, no]]} />
                  </li>
                );
              })}
            </ul>
          ) : <p className="small" style={{ margin: 0 }}>None yet. A professional job you finish, its work judged Strong or better, can bring a referral from the people who cast it.</p>}
        </div>
        <Fine>The bar for a referral, work judged Strong or better, is assumed in the game.</Fine>
      </div>
    </Panel>
  );
}

/** What an approach sends, checked; the send; and what his office asked for, where it asked. */
function MaterialsPanel({ agent }: { agent: Agent }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const rel = relationOf(person, agent.id);
  const problems = materialsCheck(person, 'representation', sim.now);
  const checkNo = checkRefusal(sim, person, agent);
  const sendNo = sendRefusal(sim, person, agent);
  const supplyNo = supplyRefusal(sim, person, agent);
  const asked = rel?.stage === 'requested' && rel.request;
  return (
    <Panel title="Your Materials For Him" help="career.agent">
      <div className="col gap-3">
        {problems.length
          ? <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{problems.map((p) => <li key={`${p.kind}:${p.problem}`}>{p.words}</li>)}</ul>
          : <p className="small" style={{ margin: 0 }}>Your headshots, résumé and reel are all current.</p>}
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="pro.agent_check" className="btn btn-sm" disabled={!!checkNo} title={checkNo} onClick={() => { const r = run('pro.agent_check', { agentId: agent.id }); if (r.ok) toast('Your materials have what an approach needs.', 'positive'); }}>Check Your Materials</Gated>
          <Gated feature="pro.send_materials" className="btn btn-sm" disabled={!!sendNo} title={sendNo} onClick={() => { const r = run('pro.send_materials', { agentId: agent.id }); if (r.ok) toast('Your materials went to his office.', 'positive'); }}>Send Your Materials</Gated>
        </div>
        <WhyNot reasons={[['Check Your Materials', checkNo], ['Send Your Materials', sendNo]]} />
        {asked && (
          <div className="col gap-2">
            <h3 className="eyebrow" style={{ margin: 0 }}>What His Office Asked For</h3>
            <p className="small" style={{ margin: 0 }}>{nextStep(sim, person, agent)}</p>
            <div><Gated feature="pro.supply_material" className="btn btn-sm" disabled={!!supplyNo} title={supplyNo} onClick={() => { const r = run('pro.supply_material', { agentId: agent.id }); if (r.ok) toast('What his office asked for went to it.', 'positive'); }}>Send What His Office Asked For</Gated></div>
            <WhyNot reasons={[['Send What His Office Asked For', supplyNo]]} />
          </div>
        )}
        <Fine>How long his office takes to answer (usually two weeks), and that no answer in six weeks counts as no, are assumed in the game. So is a year’s wait after a pass, and six months after no answer or a declined offer, before it looks again, and then only at something new.</Fine>
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
          <div><dt className="strong">Moved</dt><dd style={{ margin: 0 }}>{m.moved ? 'Once, as far as it can be' : 'Not yet: it can be moved once'}</dd></div>
        </dl>
        <div><Gated feature="pro.ask_to_move" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ at: number }>('pro.ask_to_move', { meetingId: m.id }); if (r.ok) toast(`His office moved the meeting to ${formatDateTime(r.value!.at, sim.zone)}.`, 'positive'); }}>Ask To Move</Gated></div>
        <WhyNot reasons={[['Ask To Move', no]]} />
        <Fine>Missing it closes your approach, since a meeting comes before an offer in the game. That a meeting can be moved once, a week on, is assumed, and so is the trip’s time.</Fine>
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
  const rows = (factors: readonly { id: string; label: string; level: string; words: string }[]) => (
    <table className="small" style={{ width: '100%' }}>
      <thead><tr><th scope="col">Factor</th><th scope="col">Against The Bar</th><th scope="col">Why</th></tr></thead>
      <tbody>
        {factors.map((f) => (
          <tr key={f.id}>
            <th scope="row" style={{ textAlign: 'left', fontWeight: 600 }}>{f.label}</th>
            <td className="nowrap"><span className={LEVEL_TONE[f.level as Level]}>{LEVEL_LABEL[f.level as Level]}</span></td>
            <td>{f.words}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <Panel title="Why It Went This Way" help="career.reasons">
      <div className="col gap-3">
        <p className="small" style={{ margin: 0 }}>{why ? `His office’s last decision was on ${formatDate(why.at, sim.zone)}. The game’s reasons for it are seven separate factors, each against a bar the game sets.` : 'His office hasn’t decided anything yet. The game’s reasons for a decision are seven separate factors, each against a bar the game sets.'}</p>
        <div><Gated feature="ui.career-reasons" className="btn btn-sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? 'Hide The Reasons' : 'Show The Reasons'}</Gated></div>
        {open && (
          <div className="col gap-4">
            {why && (
              <div className="col gap-2">
                <h3 className="eyebrow" style={{ margin: 0 }}>At The Last Decision</h3>
                {rows(why.factors)}
                <p className="small" style={{ margin: 0 }}>{`${capital(countWords(why.atOrBeyond))} of the seven were at the bar or beyond, and an approach needs ${countWords(why.needed)}.${why.chance !== undefined ? ` Against the year’s other actors, the game gave ${why.step === 'decision' ? 'an offer' : 'it'} about a ${Math.round(why.chance * 100)}% chance.` : ''}`}</p>
              </div>
            )}
            <div className="col gap-2">
              <h3 className="eyebrow" style={{ margin: 0 }}>As Things Stand Now</h3>
              {rows(now.factors)}
              <p className="small" style={{ margin: 0 }}>{`${capital(countWords(now.atOrBeyond))} of the seven are at the bar or beyond, and an approach needs ${countWords(now.needed)}.${now.gate ? ` Against the year’s other actors, the game would give it about a ${Math.round(now.chance * 100)}% chance.` : ''}`}</p>
            </div>
          </div>
        )}
        <Fine>The bar, the four factors an approach needs and the chances are all the game’s own, none of them his. Better work raises the chance, and the game never makes it certain. Room On His List is drawn for each year and assumed.</Fine>
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
  const ends: readonly [EndHow, string][] = [['agreement', 'End It By Agreement'], ['no-offer', 'End It: No Offer In 90 Days'], ['too-little-work', 'End It: Under Ten Days’ Work']];
  if (!shown && !ended) return null;
  return (
    <Panel title="The Agreement" help="career.agreement">
      <div className="col gap-3">
        {offered && <p className="small" style={{ margin: 0 }}>{`He offered it on ${formatDate(offered.offeredAt, sim.zone)}, and the offer stands until ${formatDate(offered.standsUntil, sim.zone)}. Read every term before you answer.`}</p>}
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
              <Gated feature="pro.accept_agreement" className="btn btn-sm" disabled={!!answerNo} title={answerNo} onClick={() => { const r = run('pro.accept_agreement', { agentId: agent.id }); if (r.ok) toast(`${agent.name} represents you from today.`, 'positive'); }}>Accept The Agreement</Gated>
              <Gated feature="pro.decline_agreement" className="btn btn-sm" disabled={!!answerNo} title={answerNo} onClick={() => { const r = run('pro.decline_agreement', { agentId: agent.id }); if (r.ok) toast('You declined the agreement.', 'neutral'); }}>Decline The Agreement</Gated>
            </div>
            <WhyNot reasons={[['Accept The Agreement', answerNo], ['Decline The Agreement', answerNo]]} />
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
        <Fine>Each term marked A Published Rule follows the unions’ and New York’s published rules, with their sources in the game’s research. A term marked The Game’s Own Term is the game’s, and nothing here is his own agreement, which isn’t published.</Fine>
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
    <Panel title="History With His Office" help="career.agent-answers">
      {events.length
        ? <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{events.map((e) => <li key={e.id}>{`${formatDate(e.at, sim.zone)}: ${e.words}`}</li>)}</ul>
        : <p className="small" style={{ margin: 0 }}>None yet.</p>}
    </Panel>
  );
}

const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
