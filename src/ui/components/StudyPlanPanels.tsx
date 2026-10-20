/**
 * SLATE — a leave of absence, a year repeated, the Yale account past the sixth term, and work-study's weekly cap and
 * conversion, on the School screen (from 2026-10-10; `systems/leave.ts`, `systems/school.ts`). Each says where it
 * stands, what it asks, what it costs and when, why it's refused where it is, asks before anything it can't undo, and
 * keeps what happened.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Fine, Stat } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { HowItWorks } from '@/ui/guide/HowItWorks';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { spokenList } from '@/engine/core/text';
import { formatDate, instantFromZoned } from '@/engine/core/time';
import { EXTENDED_STUDY, LEAVE_RULES, MANDATORY_LEAVE, WORK_LIMITS, WORK_STUDY, YALE_DRAMA } from '@/engine/content/school';
import {
  LEAVE_REASONS, accountOwed, affiliateQuote, aidReviewRefusal, cancelRepeatWarning, clearedToReturn, enrolledTerms, extraRefusal, formerStage, leaveLengths, leaveRefusal, leaveStart, leaveTermsUsed, repeatCourses, repeatRefusal, termsInWords, withRepeat, yaleAccount,
  type Leave, type LeaveKind, type LeaveReason,
} from '@/engine/systems/leave';
import { countWords, termAccount, academicTerm, conversionRefusal, convertibleHours, unassignedKnown, hasNeed, schoolEnded, termLabel, termStart, weekCap, weekHours, yearKeyOf, hourlyIn } from '@/engine/systems/school';
import { inSaveMoney } from '@/engine/systems/banking';

const STATUS: Record<Leave['status'], string> = {
  pending: 'With The Chair And The Dean', granted: 'Granted, Not Yet Begun', refused: 'Refused', canceled: 'Called Off',
  on: 'On Leave', returned: 'Returned', dismissed: 'Ended In Dismissal', withdrawn: 'Ended In Withdrawal', rescinded: 'Overturned On Appeal',
};

/** A leave: asked for, waited on, begun, and the way back. */
export function LeavePanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school!;
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const [kind, setKind] = useState<LeaveKind>('medical');
  const [reason, setReason] = useState<LeaveReason>('illness');
  const [terms, setTerms] = useState<number>(LEAVE_RULES.terms);
  const [asking, setAsking] = useState<'' | 'request' | 'cancel' | 'affiliate'>('');
  const l = school.leave;
  const ended = schoolEnded(school.standing);
  if (ended && !(school.leaves ?? []).length) return null;
  const no = ended ? undefined : leaveRefusal(sim, person, kind, reason);
  const lengths = ended || school.termsBegun === 0 ? [] : leaveLengths(sim, school, kind);
  const w = school.welfare;
  const start = !ended && school.termsBegun > 0 ? leaveStart(sim, school, kind) : undefined;
  // The leave's own terms, the figure `school.buy_affiliate` charges (from 2026-10-12: until then `LEAVE_RULES.terms`).
  const affiliate = l ? affiliateQuote(sim, l) : undefined;
  const noticeNo = l?.status === 'on' && l.kind === 'medical' ? clearedToReturn(person, sim.now) : undefined;
  const shut = [...lengths.reduce((m, x) => (x.why ? m.set(x.why, [...(m.get(x.why) ?? []), x.terms]) : m), new Map<string, number[]>())];

  return (
    <div className="col gap-2">
      <div className="row-between"><div className="eyebrow">A Leave Of Absence</div><HowItWorks help="school.leave" /></div>
      {w && (
        <p className="small" style={{ margin: 0 }}>
          <strong>Yale Health’s assessment</strong>, {w.status === 'scheduled' ? `on ${formatDate(w.assessAt, sim.zone)}: be there, at Yale Health, or ask for a medical leave yourself first.` : w.status === 'assessed' ? `found: ${w.why} The dean decides by ${formatDate(w.decideAt ?? sim.now, sim.zone)}.` : w.why} <span className="xs dim">Started by {w.trigger}: how you’re managing, not a diagnosis.</span>
        </p>
      )}
      {l && (
        <div className="col gap-2">
          <div className="grid grid-3">
            <Stat label="Your Leave" value={STATUS[l.status]} note={`${l.kind === 'medical' ? 'Medical' : 'Personal'}, ${LEAVE_REASONS[l.reason].label}`} />
            <Stat label="From" value={termLabel(l.firstTerm)} note={l.startedAt ? `Began ${formatDate(l.startedAt, sim.zone)}` : l.status === 'pending' ? `Decided by ${formatDate(l.decideAt, sim.zone)}` : undefined} />
            <Stat label="Back For" value={termLabel(l.returnTerm)} note={`${formatDate(at9(l.returnTerm), sim.zone)}${termStart(l.returnTerm).estimate ? ' (estimated)' : ''}`} />
          </div>
          {l.status === 'on' && (
            <div className="col gap-2">
              <p className="small" style={{ margin: 0 }}>
                {l.withdrawnCourses?.length ? `Left unfinished, to take again: ${spokenList(l.withdrawnCourses)}. ` : ''}
                {l.aidReturned ? `${money(l.aidReturned)} of the term’s scholarship was returned on the rebate schedule, through your Yale account. ` : ''}
                {l.kind === 'medical' ? 'Yale Health covers you as Affiliate cover the School pays for. ' : l.affiliate ? `Affiliate cover bought on ${formatDate(l.affiliate.at, sim.zone)}, ${money(l.affiliate.cost)}. ` : `Yale Health’s student cover ${l.coverEnds! > sim.now ? `ends ${formatDate(l.coverEnds!, sim.zone)}` : `ended ${formatDate(l.coverEnds!, sim.zone)}`}${l.retro ? ', back to the insurance term’s start, with the fee refunded' : ''}. `}
                {l.f1Extended ? 'Your I-20 runs a year longer, as a reduced course load. ' : ''}
                {l.noticeAt ? `You gave notice of your return on ${formatDate(l.noticeAt, sim.zone)}.` : `Give notice of your return by ${formatDate(l.noticeBy!, sim.zone)}${l.kind === 'medical' ? ', with a Yale Health physician’s clearance' : ''}. Without it, the leave ends in dismissal.`}
              </p>
              {l.mandatory && <DeanLeave />}
              <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                {!l.noticeAt && <Gated feature="school.return_notice" className="btn btn-sm" disabled={Boolean(noticeNo)} title={noticeNo} onClick={() => { if (run('school.return_notice').ok) toast('Notice given: you’re expected back.', 'positive'); }}>Give Notice Of Return</Gated>}
                {noticeNo && !l.noticeAt && <span className="xs dim">{noticeNo}</span>}
                {l.kind === 'personal' && !l.affiliate && sim.now <= (l.affiliateBy ?? 0) && (asking !== 'affiliate'
                  ? <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking('affiliate')}>Buy Affiliate Cover…</button>
                  : <>
                      <span className="small">Yale Health for the leave’s {termsInWords(affiliate!.terms)}, {money(affiliate!.cost)}{affiliate!.credit ? `, with the ${money(affiliate!.credit)} student fee you paid credited` : ''}, paid in full now; care since your cover ended is billed as Yale Health pays it.</span>
                      <Gated feature="school.buy_affiliate" className="btn btn-sm" onClick={() => { if (run('school.buy_affiliate', { confirm: true }).ok) toast('Affiliate cover bought.', 'positive'); setAsking(''); }}>Buy It</Gated>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking('')}>Not Now</button>
                    </>)}
                {l.kind === 'personal' && !l.affiliate && <span className="xs dim">Affiliate cover can be bought until {formatDate(l.affiliateBy ?? sim.now, sim.zone)}.</span>}
              </div>
            </div>
          )}
          {/* A leave the dean imposed, granted from the next term, is the dean's: its appeal, not Call Off The Leave… (from
              2026-10-16: until then this drew Call Off for it, and the cancel was taken; the appeal was drawn only once the
              leave was on). */}
          {l.status === 'granted' && l.mandatory && <DeanLeave />}
          {(l.status === 'pending' || (l.status === 'granted' && !l.mandatory)) && (
            <div className="row gap-2">
              {asking !== 'cancel'
                ? <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking('cancel')}>Call Off The Leave…</button>
                : <>
                    <span className="small">You stay at the School as you are.</span>
                    <Gated feature="school.cancel_leave" className="btn btn-sm btn-danger" onClick={() => { if (run('school.cancel_leave', { confirm: true }).ok) toast('The leave is called off.', 'neutral'); setAsking(''); }}>Call It Off</Gated>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking('')}>Keep It</button>
                  </>}
            </div>
          )}
        </div>
      )}
      {/* Not on a leave, from 2026-10-17: the return asks for registration again (`school.reregister`). */}
      {school.mustRegister && !ended && l?.status !== 'on' && (
        <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="small">Register for {termLabel(Math.max(0, school.termsBegun - 1))}: until you do, you’re counted absent from classes and can’t work shifts.{school.hold !== undefined ? ' A financial hold stops it until your Yale account is paid.' : ''}</span>
          <Gated feature="school.reregister" className="btn btn-sm" disabled={school.hold !== undefined} onClick={() => { if (run('school.reregister').ok) toast('Registered.', 'positive'); }}>Register</Gated>
        </div>
      )}
      {!ended && (!l || l.status === 'refused' || l.status === 'canceled') && (
        <div className="col gap-2">
          <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field"><label htmlFor="leave-kind">Kind</label>
              <select id="leave-kind" value={kind} onChange={(e) => { const k = e.target.value as LeaveKind; setKind(k); setReason(k === 'medical' ? 'illness' : 'personal'); }}>
                <option value="medical">Medical</option><option value="personal">Personal</option>
              </select>
            </div>
            <div className="field"><label htmlFor="leave-terms">Length</label>
              <select id="leave-terms" value={terms} onChange={(e) => setTerms(Number(e.target.value))}>
                {lengths.map((x) => <option key={x.terms} value={x.terms} disabled={Boolean(x.why)}>{x.terms === 1 ? 'One Term' : x.terms === 2 ? 'Two Terms' : 'Three Terms'}{x.why ? ' (Not Possible)' : ''}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="leave-reason">Reason</label>
              <select id="leave-reason" value={reason} onChange={(e) => setReason(e.target.value as LeaveReason)}>
                {(Object.keys(LEAVE_REASONS) as LeaveReason[]).filter((r) => LEAVE_REASONS[r].kind === kind).map((r) => <option key={r} value={r}>{LEAVE_REASONS[r].label}</option>)}
              </select>
            </div>
            {asking !== 'request'
              ? <button type="button" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => setAsking('request')}>Ask For A Leave…</button>
              : <>
                  <Gated feature="school.request_leave" className="btn btn-sm" onClick={() => { const a = run<{ decideAt: number }>('school.request_leave', { kind, reason, terms }); if (a.ok) toast(`Asked: decided by ${formatDate(a.value!.decideAt, sim.zone)}.`, 'positive'); setAsking(''); }}>Ask</Gated>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking('')}>Not Now</button>
                </>}
          </div>
          {/* Lengths refused for one reason said with it once (from 2026-10-20, brief 17): until then each length said its own,
              so a student who'd had two terms of leave read the same sentence for two terms, for three, and again for Ask For
              A Leave…, three times on one panel. */}
          {shut.map(([why, ns]) => <p key={why} className="xs dim" style={{ margin: 0 }}>{lengthWords(ns)}: {why}</p>)}
          {/* Why Ask For A Leave… is refused, said once, under the form (from 2026-10-12: until then it was said beside the button as well, so the screen said it twice). Where it's a length's reason, said above, it isn't said again. */}
          {no ? <p className="xs dim" style={{ margin: 0 }}>{shut.some(([why]) => why === no) ? 'None of the three lengths is possible now.' : no}</p> : start && (
            <p className="small" style={{ margin: 0 }}>
              {asking === 'request' ? 'Asking puts it to the chair and the dean, who decide in five working days. ' : ''}
              If it’s granted, it runs from {start.now ? 'the day it’s granted' : `${termLabel(start.term)}`} to {termLabel(start.term + terms)}. {start.now ? 'This term’s courses are left unfinished and taken again when you’re back, its castings and any Cabaret show end, and the term’s scholarship goes back on the rebate schedule. ' : ''}While you’re on leave there’s no aid, and no classes, calls or shifts. {kind === 'medical' ? 'Yale Health goes on as Affiliate cover the School pays for, and you need a physician’s clearance to come back.' : `Yale Health’s student cover ends, and Affiliate cover is ${money(inSaveMoney(sim, LEAVE_RULES.affiliatePerTerm, 'USD'))} a term.`} Give notice of your return eight weeks before, or the leave ends in dismissal. You’d be back in year {Math.floor(academicTerm(school, start.term) / 2) + 1}, with the class of {school.classOf + Math.round(terms / 2)}: your class goes on without you, and stays yours.
            </p>
          )}
        </div>
      )}
      {(school.leaves ?? []).length > 0 && (
        <details className="small"><summary>Leaves Before</summary>
          <ul style={{ margin: 0 }}>{school.leaves!.map((x) => <li key={x.id}>{x.kind === 'medical' ? 'Medical' : 'Personal'} ({LEAVE_REASONS[x.reason].label}), asked {formatDate(x.requestedAt, sim.zone)}: {STATUS[x.status]}{x.why ? `. ${x.why}` : ''}{x.returnedAt ? `, back ${formatDate(x.returnedAt, sim.zone)}` : ''}.</li>)}</ul>
        </details>
      )}
      <Fine>A mandatory medical leave (p.159) is recommended by Yale Health and decided by the dean, on an individual assessment of risk and of the modifications the School can make; you can appeal in writing within {MANDATORY_LEAVE.appealDays} days, and the leave stands while it’s heard. What starts an assessment in the game is how you’re managing (stays in hospital, class days missed ill), never a diagnosis; where the Bulletin is silent, the rest of its process is the game’s own. The Bulletin’s leave (pp.157–160): one, two or three terms, personal after a term completed and current with requirements and normally not after the tenth day, medical on a Yale Health physician’s recommendation, no aid, Yale Health’s student cover ending the day it’s granted or back to the insurance term’s start before classes, Affiliate cover at $5,416 a term, notice eight weeks before return, and dismissal for not returning. The game’s own rules: a leave’s length must return you in the season you left, since most acting courses run fall to spring; five working days to decide; the physician’s view read from care, injury or illness in the last thirty days; the rebate schedule applied to the living scholarship. An F-1 student’s personal leave ends their status and needs travel the game doesn’t have, so it’s refused, with the reason. Used: {leaveTermsUsed(school)} of {LEAVE_RULES.maxTerms} terms. Source: {LEAVE_RULES.source}.</Fine>
    </div>
  );
}

/** Leave lengths as a line names them: One term, Two or three terms, One, two or three terms. */
const lengthWords = (ns: readonly number[]): string => {
  const words = ns.map((n) => ['no', 'one', 'two', 'three'][n] ?? String(n));
  const said = words.length > 1 ? `${words.slice(0, -1).join(', ')} or ${words.at(-1)}` : words[0]!;
  return `${said.replace(/^\w/, (c) => c.toUpperCase())} ${ns.length === 1 && ns[0] === 1 ? 'term' : 'terms'}`;
};

/** A term's first morning in New Haven. */
const at9 = (term: number) => instantFromZoned({ ...termStart(term).date, hour: 9 }, 'America/New_York');

/**
 * A leave the dean imposed (`MANDATORY_LEAVE`): why, and its appeal, on a leave under way or one granted from the next
 * term (a function of its own from 2026-10-16, when the second came to be drawn: until then it was drawn only on a leave
 * under way, though the dean's notice said it could be appealed from the decision).
 */
function DeanLeave() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const l = person.school!.leave!;
  const m = l.mandatory!;
  const open = !m.appeal && sim.now <= m.appealBy;
  return (
    <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
      <span className="small"><strong>Imposed by the dean</strong> on Yale Health’s recommendation{l.status === 'granted' ? `, from ${termLabel(l.firstTerm)}` : ''}: {m.why} {m.appeal ? (m.appeal.outcome ? `Your appeal was ${m.appeal.outcome === 'rescinded' ? 'granted' : 'turned down'}: ${m.appeal.why}` : `Your appeal is with the dean, decided by ${formatDate(m.appeal.decideAt, sim.zone)}.`) : open ? `You can appeal in writing to the dean until ${formatDate(m.appealBy, sim.zone)}. The leave stands while the appeal is heard, and it’s overturned if you’re cleared with enough of the term left to resume${l.status === 'granted' ? ', as all of it is before the leave begins' : ''}. It isn’t yours to call off.` : 'It isn’t yours to call off.'}</span>
      {open && <Gated feature="school.appeal_leave" className="btn btn-sm btn-ghost" onClick={() => { const r = run<{ decideAt: number }>('school.appeal_leave'); if (r.ok) toast(`Appealed: decided by ${formatDate(r.value!.decideAt, sim.zone)}.`, 'positive'); }}>Appeal To The Dean</Gated>}
    </div>
  );
}

/** A year asked to be repeated, SLATE's faculty model. */
export function RepeatPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school!;
  const [asking, setAsking] = useState<'' | 'request' | 'cancel'>('');
  if (schoolEnded(school.standing) && !school.repeat) return null;
  const no = repeatRefusal(sim, person);
  const r = school.repeat;
  const t = Math.max(0, school.termsBegun - 1);
  const failed = repeatCourses(school, t);
  const extra = extraRefusal(sim, person);
  const ex = school.extraRequest;
  const show = r || ex || school.extra || school.repeatBy !== undefined || failed.length > 0;
  if (!show) return null;
  // The degree’s terms with the year again, as the decision counts them: those enrolled, the year’s two, and the
  // program’s terms still to come (`withRepeat`). Until 2026-10-13 this counted the year’s two alone, so a first or
  // second year’s repeat, which takes the degree to eight terms, said nothing of the two billed past six; found by that
  // day’s guide audit. The tuition is each billed term’s own, the degree’s last terms; until then it was the next term’s,
  // which for a first year’s repeat is two years of Yale’s growth before the terms billed.
  const enrolled = enrolledTerms(school).length;
  const total = withRepeat(school, academicTerm(school, t));
  const past = total - EXTENDED_STUDY.supportedTerms;
  const cur = saveCurrency(sim.universe);
  const billed = Array.from({ length: Math.max(0, past) }, (_, k) => termAccount(cur, false, t + total - enrolled - k).tuition).reduce((a, b) => a + b, 0);
  return (
    <div className="col gap-2">
      <div className="row-between"><div className="eyebrow">Finishing The Degree</div><HowItWorks help="school.repeat" /></div>
      {r && <p className="small" style={{ margin: 0 }}>Year {r.year}, asked {formatDate(r.requestedAt, sim.zone)}: {r.status === 'pending' ? `with the chair and the dean, decided by ${formatDate(r.decideAt, sim.zone)}` : r.status === 'granted' ? 'granted' : r.status === 'refused' ? `refused. ${r.why ?? ''}` : 'called off'}{r.courses.length ? `, for ${spokenList(r.courses)}` : ''}.</p>}
      {school.repeatBy !== undefined && <p className="small" style={{ margin: 0 }}>Your last year wasn’t passed. Ask by {formatDate(school.repeatBy, sim.zone)}, or the faculty won’t recommend the degree.</p>}
      {!no && (
        <div className="col gap-2">
          {asking === 'request' && <p className="small" style={{ margin: 0 }}>Asking puts it to the chair and the dean, decided in five working days. Granted, you take year {Math.floor(academicTerm(school, t) / 2) + 1}’s courses again from {termLabel(t + 1)}, and what you did the first time stays on your record; the degree reads the pass.{past > 0 ? ` The tuition scholarship supports six terms, and with the year again the degree takes ${countWords(total)} terms: ${countWords(past)} would be billed to your Yale account, about ${formatMoney(billed, cur)} in tuition alone.` : ''}{f1(person) ? ' Your I-20 would be extended a year.' : ''}</p>}
          <div className="row gap-2">
            {asking !== 'request'
              ? <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking('request')}>Ask To Repeat The Year…</button>
              : <>
                  <Gated feature="school.request_repeat" className="btn btn-sm" onClick={() => { const a = run<{ decideAt: number }>('school.request_repeat'); if (a.ok) toast(`Asked: decided by ${formatDate(a.value!.decideAt, sim.zone)}.`, 'positive'); setAsking(''); }}>Ask</Gated>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking('')}>Not Now</button>
                </>}
          </div>
        </div>
      )}
      {ex && <p className="small" style={{ margin: 0 }}>An additional term, {termLabel(ex.term)}, asked {formatDate(ex.requestedAt, sim.zone)} to retake {spokenList(ex.courses.map((c) => c.name))}: {ex.status === 'pending' ? `with the chair and the dean, decided by ${formatDate(ex.decideAt, sim.zone)}` : ex.status === 'granted' ? 'granted' : `refused. ${ex.why ?? ''}`}.</p>}
      {school.extra && <p className="small" style={{ margin: 0 }}>In {termLabel(school.extra.term)} you take only {spokenList(school.extra.courses.map((c) => c.name))}; passed, the degree is {termStart(school.extra.term).fall ? 'conferred at Yale’s December conferral' : 'conferred at Commencement in May'}.</p>}
      {!extra.why && !ex && (
        <div className="col gap-1">
          <p className="small" style={{ margin: 0 }}>Or an additional term, {termLabel(extra.term!)}, to retake {spokenList(extra.courses!.map((c) => c.name))} alone, with the class then in that year{termStart(extra.term!).fall ? ', the degree conferred in December' : ''}.</p>
          <div><Gated feature="school.request_extra_term" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ decideAt: number }>('school.request_extra_term'); if (a.ok) toast(`Asked: decided by ${formatDate(a.value!.decideAt, sim.zone)}.`, 'positive'); }}>Ask For An Additional Term</Gated></div>
        </div>
      )}
      {/* Asked first, with what calling it off leaves, as Call Off The Leave… asks (from 2026-10-12: until then the button sent the confirm on its first press, and the command's warning never showed). */}
      {r?.status === 'pending' && (
        <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          {asking !== 'cancel'
            ? <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking('cancel')}>Call Off The Request…</button>
            : <>
                <span className="small">{cancelRepeatWarning(sim, school)}</span>
                <Gated feature="school.cancel_repeat" className="btn btn-sm btn-danger" onClick={() => { if (run('school.cancel_repeat', { confirm: true }).ok) toast('Called off.', 'neutral'); setAsking(''); }}>Call It Off</Gated>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking('')}>Keep It</button>
              </>}
        </div>
      )}
      {no && failed.length > 0 && !r && <p className="xs dim" style={{ margin: 0 }}>{no}</p>}
      <Fine>No rule for repeating a failed acting course was found in the Bulletin, so this is the game’s own, under the Bulletin’s nine semesters for the degree, six terms of tuition support and its disqualification at two Fails in a term or seven in all (pp.148, 182, 194). A year is approved once, asked at its end or within thirty days of the last year’s term review; after the last year, what’s unpassed can be retaken in an additional term of its season instead. The faculty review a disqualification rather than apply it: the first time, academic warning and the year to repeat. Source: {EXTENDED_STUDY.source}.</Fine>
    </div>
  );
}

const f1 = (person: { documents?: { kind: string; destination?: string; name: string }[] }) => (person.documents ?? []).some((d) => d.kind === 'visa' && d.destination === 'US' && d.name.startsWith('F-1'));

/** The Yale account: what's billed and paid on it, a hold, paying it, and the aid office's review of a term past six. */
export function YaleAccountPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school!;
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const [amount, setAmount] = useState('');
  const acc = yaleAccount(sim, person, false);
  // The aid review is offered exactly when it can be asked, with an account open or not (`aidReviewRefusal`, from
  // 2026-10-12: until then nothing here drew without an account, a review, an additional term or a granted repeat, so in
  // the sixth term, when no account is usually open, Ask For An Aid Review never showed though the command took it).
  const reviewNo = aidReviewRefusal(sim, person);
  const ar = school.aidReview;
  if (!acc && !ar && reviewNo) return null;
  const owed = accountOwed(sim, person);
  const lines = acc ? sim.universe.transactions.filter((t) => t.postings.some((p) => p.accountId === acc.id)).slice(-12).reverse() : [];
  const value = Math.round(Number(amount) * 100);
  return (
    <div className="col gap-2">
      {acc && <div className="grid grid-3">
        <Stat label="Owed On Your Yale Account" value={money(Math.max(0, owed))} tone={owed > 0 ? 'warning' : undefined} />
        <Stat label="Financial Hold" value={school.hold !== undefined ? `Since ${formatDate(school.hold, sim.zone)}` : 'None'} note={school.hold !== undefined ? 'No registration and no diploma while it stands' : undefined} tone={school.hold !== undefined ? 'negative' : undefined} />
        <Stat label="Terms Enrolled" value={`${enrolledTerms(school).length}`} note={`Six have tuition support; the degree within ${EXTENDED_STUDY.maxSemesters}`} />
      </div>}
      {owed > 0 && (
        <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field"><label htmlFor="yale-pay">Pay (Blank Pays It All)</label><input id="yale-pay" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={(owed / 100).toFixed(2)} /></div>
          <Gated feature="school.pay_balance" className="btn btn-sm" onClick={() => { const a = run<{ owed: number }>('school.pay_balance', amount ? { amount: value } : {}); if (a.ok) { toast(a.value!.owed > 0 ? `Paid. ${money(a.value!.owed)} still owed.` : 'Paid in full.', 'positive'); setAmount(''); } }}>Pay From Your Bank</Gated>
        </div>
      )}
      {acc && <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Date</th><th scope="col">What</th><th scope="col" className="num">Charged</th><th scope="col" className="num">Paid Or Credited</th></tr></thead>
          <tbody>
            {lines.map((t) => {
              const p = t.postings.find((q) => q.accountId === acc.id)!;
              return <tr key={t.id}><td>{formatDate(t.at, sim.zone)}</td><td className="small">{t.memo}</td><td className="num mono">{p.amount < 0 ? money(-p.amount) : ''}</td><td className="num mono">{p.amount > 0 ? money(p.amount) : ''}</td></tr>;
            })}
          </tbody>
        </table>
      </div>}
      {(ar || !reviewNo) && (
        <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="small">{ar ? (ar.status === 'pending' ? `The aid office is reviewing your support past six terms, by ${formatDate(ar.decideAt, sim.zone)}.` : ar.why) : 'Support past six terms: the aid office can review it.'}</span>
          {!reviewNo && <Gated feature="school.request_aid_review" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ decideAt: number }>('school.request_aid_review'); if (a.ok) toast(`Asked: decided by ${formatDate(a.value!.decideAt, sim.zone)}.`, 'positive'); }}>Ask For An Aid Review</Gated>}
        </div>
      )}
      <Fine>Tuition support ordinarily covers six terms (p.182); a term past it is billed tuition and the Yale Health fee, due in thirty days (estimated). Unpaid, the Bulletin’s late fee, {money(inSaveMoney(sim, EXTENDED_STUDY.lateFee, 'USD'))} a month to {money(inSaveMoney(sim, EXTENDED_STUDY.lateFeeTermCap, 'USD'))} a term, and a hold on registration and the diploma (p.184). A scholarship returned on a leave is charged here too. The balance is the sum of the account’s postings.</Fine>
    </div>
  );
}

/** Work-study's weekly cap and hours converted to grant aid. */
export function WorkLimitsBlock() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school!;
  const cur = saveCurrency(sim.universe);
  const term = Math.max(0, school.termsBegun - 1);
  const key = yearKeyOf(term);
  const cap = weekCap(sim.now);
  const hours = weekHours(sim, person, sim.now);
  // Counted as the request counts them: never-assigned hours from May, once the spring’s shifts are done (from 2026-10-13).
  const convertible = convertibleHours(person, key, unassignedKnown(sim.now));
  const no = conversionRefusal(sim, person);
  return (
    <div className="col gap-2">
      <div className="grid grid-3">
        <Stat label="This Week’s Hours" value={`${hours} of ${cap}`} note={cap === WORK_LIMITS.weekHours ? 'In term: all Yale jobs together' : 'Out of term'} tone={hours >= cap ? 'warning' : undefined} />
        <Stat label="Hours Excused This Year" value={`${school.excusedHours?.[key] ?? 0}`} note="Assigned hours missed ill or hurt" />
        <Stat label="Convertible To Grant Aid" value={hasNeed(person) ? `${convertible} hours` : 'Not On Aid'} note={hasNeed(person) ? `${formatMoney(Math.round(convertible * hourlyIn(cur)), cur)} at the rate; ${school.convertedHours?.[key] ?? 0} converted` : undefined} />
      </div>
      <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Gated feature="school.request_conversion" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { const a = run<{ at: number; hours: number }>('school.request_conversion'); if (a.ok) toast(`Asked: processed ${formatDate(a.value!.at, sim.zone)}.`, 'positive'); }}>Ask For Conversion To Grant Aid</Gated>
        <HowItWorks help="school.request_conversion" />
        {no && <span className="xs dim">{no}</span>}
      </div>
      <Fine>Yale’s cap: no more than {WORK_LIMITS.weekHours} hours a week across all its jobs in an academic term, {WORK_LIMITS.recessWeekHours} in recess, summer or on leave; a booking past it is turned down, and a shift that would pass it is worked to the cap. How Yale bounds the week wasn’t found, so the game counts Monday to Sunday. A student on aid short of the {WORK_STUDY.assignedHours} assigned hours through illness, injury or the School’s calls, or never assigned them, can ask for up to {WORK_LIMITS.convertibleHours} hours converted to grant-in-aid, processed in January and May (Bulletin p.189); it’s a scholarship for living costs, taxable. Hours missed absent, late or before the I-9 can’t be. Each shift carries its work’s own risk of injury, BLS’s rates: the crew’s in the shops higher than front of house. In {YALE_DRAMA.name}’s year {Math.floor(academicTerm(school, term) / 2) + 1}. Source: {WORK_LIMITS.source}.</Fine>
    </div>
  );
}

/** The class the student is in, and any class they began with and fell a year behind (`joinCohort`): every one kept. */
export function ClassesPanel() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school!;
  if (!(school.formerClasses ?? []).length) return null;
  return (
    <div className="col gap-2">
      <div className="eyebrow">Your Classes</div>
      {!schoolEnded(school.standing) && <p className="small" style={{ margin: 0 }}>You go on with the class of {school.classOf}: {school.classmates.map((m) => m.name).join(', ')}.</p>}
      {school.formerClasses!.map((c) => (
        <p key={c.classOf} className="small" style={{ margin: 0 }}>
          {c.leftBehind ? `The class of ${c.classOf}, who went on without you after you left the School on ${formatDate(c.left, sim.zone)}` : `Your first class, the class of ${c.classOf}, a year ahead of you since you rejoined on ${formatDate(c.left, sim.zone)}`}: {c.classmates.map((m) => `${m.name}${m.bond !== undefined && Math.abs(m.bond) >= 25 ? (m.bond > 0 ? ' (a friend)' : ' (a rival)') : ''}`).join(', ')}. What you shared stays on your record. {c.graduatedAt !== undefined ? `They had their degrees by ${formatDate(c.graduatedAt, sim.zone)}.` : (() => { const at = formerStage(c, schoolEnded(school.standing) ? c.playedTo + 1 : Math.max(0, school.termsBegun - 1)); return at === undefined ? 'They’re a year ahead.' : at >= YALE_DRAMA.terms ? 'They’ve finished their sixth term.' : `They’re in year ${Math.floor(at / 2) + 1}, its ${at % 2 === 0 ? 'fall' : 'spring'} term.`; })()}
        </p>
      ))}
      {school.formerClasses!.filter((c) => (c.productions ?? []).length).map((c) => (
        <details key={`p${c.classOf}`} className="small"><summary>What The Class Of {c.classOf} Played Without You</summary>
          <ul style={{ margin: 0 }}>{c.productions!.map((p) => { const lead = [...p.cast].sort((a, b) => (a.size === 'lead' ? 0 : 1) - (b.size === 'lead' ? 0 : 1) || b.quality - a.quality)[0]; return <li key={`${p.term}${p.name}`}>{p.play ?? p.name}{p.play ? `, ${p.name}` : ''}, {formatDate(Date.parse(`${p.from}T17:00:00Z`), sim.zone)}: {p.cast.length} of them{lead ? `; ${lead.name} as ${lead.part}, ${Math.round(lead.quality)}` : ''}.</li>; })}</ul>
        </details>
      ))}
      {(school.joinedHistory ?? []).length > 0 && (() => { const plays = school.joinedHistory!.filter((p) => !p.name.startsWith('Yale Cabaret')).map((p) => p.play ?? p.name); const shows = school.joinedHistory!.length - plays.length; const said = [...plays, ...(shows ? [shows === 1 ? 'a Cabaret show' : `${shows} Cabaret shows`] : [])]; return <p className="small" style={{ margin: 0 }}>Before you joined, the class of {school.classOf} played {said.join(' and ')}.</p>; })()}
      <Fine>A class you’ve left is played forward through every term it has, to its degree, whether or not you’re still at the School: its classes, as a class day grows a classmate, and its productions, cast by the chair’s rule and grown by their rehearsals and nights, its third year’s Rep company and a Cabaret show a term among them. How many of a class take a Cabaret show is estimated.</Fine>
    </div>
  );
}
