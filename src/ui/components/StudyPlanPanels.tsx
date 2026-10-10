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
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate, instantFromZoned } from '@/engine/core/time';
import { EXTENDED_STUDY, LEAVE_RULES, WORK_LIMITS, WORK_STUDY, YALE_DRAMA } from '@/engine/content/school';
import {
  LEAVE_REASONS, accountOwed, clearedToReturn, enrolledTerms, leaveRefusal, leaveStart, leaveTermsUsed, repeatCourses, repeatRefusal, yaleAccount,
  type Leave, type LeaveKind, type LeaveReason,
} from '@/engine/systems/leave';
import { termAccount, academicTerm, conversionRefusal, convertibleHours, hasNeed, schoolEnded, termLabel, termStart, weekCap, weekHours, yearKeyOf, hourlyIn } from '@/engine/systems/school';
import { inSaveMoney } from '@/engine/systems/banking';

const STATUS: Record<Leave['status'], string> = {
  pending: 'With The Chair And The Dean', granted: 'Granted, Not Yet Begun', refused: 'Refused', canceled: 'Called Off',
  on: 'On Leave', returned: 'Returned', dismissed: 'Ended In Dismissal', withdrawn: 'Ended In Withdrawal',
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
  const [asking, setAsking] = useState<'' | 'request' | 'cancel' | 'affiliate'>('');
  const l = school.leave;
  const ended = schoolEnded(school.standing);
  if (ended && !(school.leaves ?? []).length) return null;
  const no = ended ? undefined : leaveRefusal(sim, person, kind, reason);
  const start = !ended && school.termsBegun > 0 ? leaveStart(sim, school, kind) : undefined;
  const affiliateCost = LEAVE_RULES.terms * inSaveMoney(sim, LEAVE_RULES.affiliatePerTerm, 'USD') - (l?.feeCredit ?? 0);
  const noticeNo = l?.status === 'on' && l.kind === 'medical' ? clearedToReturn(person, sim.now) : undefined;

  return (
    <div className="col gap-2">
      <div className="eyebrow">A Leave Of Absence</div>
      {l && (
        <div className="col gap-2">
          <div className="grid grid-3">
            <Stat label="Your Leave" value={STATUS[l.status]} note={`${l.kind === 'medical' ? 'Medical' : 'Personal'}, ${LEAVE_REASONS[l.reason].label}`} />
            <Stat label="From" value={termLabel(l.firstTerm)} note={l.startedAt ? `Began ${formatDate(l.startedAt, sim.zone)}` : l.status === 'pending' ? `Decided by ${formatDate(l.decideAt, sim.zone)}` : undefined} />
            <Stat label="Back For" value={termLabel(l.returnTerm)} note={`${formatDate(at9(l.returnTerm), sim.zone)}${termStart(l.returnTerm).estimate ? ', SLATE’s estimate' : ''}`} />
          </div>
          {l.status === 'on' && (
            <div className="col gap-2">
              <p className="small" style={{ margin: 0 }}>
                {l.withdrawnCourses?.length ? `Left unfinished, to take again: ${l.withdrawnCourses.join(', ')}. ` : ''}
                {l.aidReturned ? `${money(l.aidReturned)} of the term’s scholarship went back on the rebate schedule, on your Yale account. ` : ''}
                {l.kind === 'medical' ? 'Yale Health covers you as Affiliate cover the School pays for. ' : l.affiliate ? `Affiliate cover bought on ${formatDate(l.affiliate.at, sim.zone)}, ${money(l.affiliate.cost)}. ` : `Yale Health’s student cover ${l.coverEnds! > sim.now ? `ends ${formatDate(l.coverEnds!, sim.zone)}` : `ended ${formatDate(l.coverEnds!, sim.zone)}`}${l.retro ? ', back to the insurance term’s start, with the fee refunded' : ''}. `}
                {l.f1Extended ? 'Your I-20 runs a year longer, as a reduced course load. ' : ''}
                {l.noticeAt ? `You gave notice of your return on ${formatDate(l.noticeAt, sim.zone)}.` : `Give notice of your return by ${formatDate(l.noticeBy!, sim.zone)}${l.kind === 'medical' ? ', with a Yale Health physician’s clearance' : ''}; without it the leave ends in dismissal.`}
              </p>
              <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                {!l.noticeAt && <Gated feature="school.return_notice" className="btn btn-sm" disabled={Boolean(noticeNo)} title={noticeNo} onClick={() => { if (run('school.return_notice').ok) toast('Notice given: you’re expected back.', 'positive'); }}>Give Notice Of Return</Gated>}
                {noticeNo && !l.noticeAt && <span className="xs dim">{noticeNo}</span>}
                {l.kind === 'personal' && !l.affiliate && sim.now <= (l.affiliateBy ?? 0) && (asking !== 'affiliate'
                  ? <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking('affiliate')}>Buy Affiliate Cover…</button>
                  : <>
                      <span className="small">Yale Health for the leave’s two terms, {money(affiliateCost)}{l.feeCredit ? `, with the ${money(l.feeCredit)} student fee you paid credited` : ''}, paid in full now; care since your cover ended is billed as Yale Health pays it.</span>
                      <Gated feature="school.buy_affiliate" className="btn btn-sm" onClick={() => { if (run('school.buy_affiliate', { confirm: true }).ok) toast('Affiliate cover bought.', 'positive'); setAsking(''); }}>Buy It</Gated>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking('')}>Not Now</button>
                    </>)}
                {l.kind === 'personal' && !l.affiliate && <span className="xs dim">Affiliate cover can be bought until {formatDate(l.affiliateBy ?? sim.now, sim.zone)}.</span>}
              </div>
            </div>
          )}
          {(l.status === 'pending' || l.status === 'granted') && (
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
      {school.mustRegister && !ended && (
        <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="small">Register for {termLabel(Math.max(0, school.termsBegun - 1))}: until you do, classes don’t count you and shifts can’t be worked.{school.hold !== undefined ? ' A financial hold stops it until your Yale account is paid.' : ''}</span>
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
            <div className="field"><label htmlFor="leave-reason">Reason</label>
              <select id="leave-reason" value={reason} onChange={(e) => setReason(e.target.value as LeaveReason)}>
                {(Object.keys(LEAVE_REASONS) as LeaveReason[]).filter((r) => LEAVE_REASONS[r].kind === kind).map((r) => <option key={r} value={r}>{LEAVE_REASONS[r].label}</option>)}
              </select>
            </div>
            {asking !== 'request'
              ? <button type="button" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => setAsking('request')}>Ask For A Leave…</button>
              : <>
                  <Gated feature="school.request_leave" className="btn btn-sm" onClick={() => { const a = run<{ decideAt: number }>('school.request_leave', { kind, reason }); if (a.ok) toast(`Asked: decided by ${formatDate(a.value!.decideAt, sim.zone)}.`, 'positive'); setAsking(''); }}>Ask</Gated>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking('')}>Not Now</button>
                </>}
          </div>
          {no ? <p className="xs dim" style={{ margin: 0 }}>{no}</p> : start && (
            <p className="small" style={{ margin: 0 }}>
              {asking === 'request' ? 'Asking puts it to the chair and the dean, who decide in five working days. ' : ''}
              Granted, it would run from {start.now ? 'the day it’s granted' : `${termLabel(start.term)}`} to {termLabel(start.term + LEAVE_RULES.terms)}, a year: {start.now ? 'this term’s courses are left unfinished and taken again on return, its castings and any Cabaret show end, and the term’s scholarship goes back on the rebate schedule; ' : ''}no aid, classes, calls or shifts while on leave; {kind === 'medical' ? 'Yale Health goes on as Affiliate cover the School pays for, and you need a physician’s clearance to come back' : `Yale Health’s student cover ends, and Affiliate cover is ${money(inSaveMoney(sim, LEAVE_RULES.affiliatePerTerm, 'USD'))} a term`}; notice of return eight weeks before, or dismissal. You’d be back in year {Math.floor(academicTerm(school, start.term) / 2) + 1}, the class of {school.classOf + 1}.
            </p>
          )}
        </div>
      )}
      {(school.leaves ?? []).length > 0 && (
        <details className="small"><summary>Leaves Before</summary>
          <ul style={{ margin: 0 }}>{school.leaves!.map((x) => <li key={x.id}>{x.kind === 'medical' ? 'Medical' : 'Personal'} ({LEAVE_REASONS[x.reason].label}), asked {formatDate(x.requestedAt, sim.zone)}: {STATUS[x.status]}{x.why ? `. ${x.why}` : ''}{x.returnedAt ? `, back ${formatDate(x.returnedAt, sim.zone)}` : ''}.</li>)}</ul>
        </details>
      )}
      <Fine>The Bulletin’s leave (pp.157–160): one, two or three terms, personal after a term completed and current with requirements and normally not after the tenth day, medical on a Yale Health physician’s recommendation, no aid, Yale Health’s student cover ending the day it’s granted or back to the insurance term’s start before classes, Affiliate cover at $5,416 a term, notice eight weeks before return, and dismissal for not returning. SLATE’s: a leave is a year, since the acting courses run in sequence; five working days to decide; the physician’s view read from care, injury or illness in the last thirty days; the rebate schedule applied to the living scholarship. An F-1 student’s personal leave ends their status and needs travel SLATE doesn’t have, so it’s refused, with why. Used: {leaveTermsUsed(school)} of {LEAVE_RULES.maxTerms} terms. Source: {LEAVE_RULES.source}.</Fine>
    </div>
  );
}

/** A term's first morning in New Haven. */
const at9 = (term: number) => instantFromZoned({ ...termStart(term).date, hour: 9 }, 'America/New_York');

/** A year asked to be repeated, SLATE's faculty model. */
export function RepeatPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school!;
  const [asking, setAsking] = useState(false);
  if (schoolEnded(school.standing) && !school.repeat) return null;
  const no = repeatRefusal(sim, person);
  const r = school.repeat;
  const t = Math.max(0, school.termsBegun - 1);
  const failed = repeatCourses(school, t);
  const show = r || school.repeatBy !== undefined || failed.length > 0;
  if (!show) return null;
  const past = enrolledTerms(school).length + 2 - EXTENDED_STUDY.supportedTerms;
  return (
    <div className="col gap-2">
      <div className="eyebrow">Repeating A Year</div>
      {r && <p className="small" style={{ margin: 0 }}>Year {r.year}, asked {formatDate(r.requestedAt, sim.zone)}: {r.status === 'pending' ? `with the chair and the dean, decided by ${formatDate(r.decideAt, sim.zone)}` : r.status === 'granted' ? 'granted' : r.status === 'refused' ? `refused. ${r.why ?? ''}` : 'called off'}{r.courses.length ? `, for ${r.courses.join(', ')}` : ''}.</p>}
      {school.repeatBy !== undefined && <p className="small" style={{ margin: 0 }}>Your last year wasn’t passed. Ask by {formatDate(school.repeatBy, sim.zone)}, or the degree is withheld.</p>}
      {!no && (
        <div className="col gap-2">
          {asking && <p className="small" style={{ margin: 0 }}>Asking puts it to the chair and the dean, decided in five working days. Granted, you take year {Math.floor(academicTerm(school, t) / 2) + 1}’s courses again from {termLabel(t + 1)}, and what you did the first time stays on your record; the degree reads the pass.{past > 0 ? ` The tuition scholarship supports six terms: ${past} of the year’s would be billed to your Yale account, about ${formatMoney(past * termAccount(saveCurrency(sim.universe), false, t + 1).tuition, saveCurrency(sim.universe))} in tuition alone.` : ''}{f1(person) ? ' Your I-20 would be extended a year.' : ''}</p>}
          <div className="row gap-2">
            {!asking
              ? <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking(true)}>Ask To Repeat The Year…</button>
              : <>
                  <Gated feature="school.request_repeat" className="btn btn-sm" onClick={() => { const a = run<{ decideAt: number }>('school.request_repeat'); if (a.ok) toast(`Asked: decided by ${formatDate(a.value!.decideAt, sim.zone)}.`, 'positive'); setAsking(false); }}>Ask</Gated>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking(false)}>Not Now</button>
                </>}
          </div>
        </div>
      )}
      {r?.status === 'pending' && <div><Gated feature="school.cancel_repeat" className="btn btn-sm btn-ghost" onClick={() => { if (run('school.cancel_repeat', { confirm: true }).ok) toast('Called off.', 'neutral'); }}>Call Off The Request</Gated></div>}
      {no && failed.length > 0 && !r && <p className="xs dim" style={{ margin: 0 }}>{no}</p>}
      <Fine>No rule for repeating a failed acting course was found in the Bulletin; this is SLATE’s faculty model, under the Bulletin’s nine semesters for the degree, six terms of tuition support and its disqualification at two Fails in a term or seven in all (pp.148, 182, 194). One repeat, asked at the year’s end or within thirty days of the last year’s evaluation. Source: {EXTENDED_STUDY.source}.</Fine>
    </div>
  );
}

const f1 = (person: { documents?: { kind: string; destination?: string; name: string }[] }) => (person.documents ?? []).some((d) => d.kind === 'visa' && d.destination === 'US' && d.name.startsWith('F-1'));

/** The Yale account: what's billed and paid on it, a hold, and paying it. */
export function YaleAccountPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school!;
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const [amount, setAmount] = useState('');
  const acc = yaleAccount(sim, person, false);
  if (!acc) return null;
  const owed = accountOwed(sim, person);
  const lines = sim.universe.transactions.filter((t) => t.postings.some((p) => p.accountId === acc.id)).slice(-12).reverse();
  const value = Math.round(Number(amount) * 100);
  return (
    <div className="col gap-2">
      <div className="grid grid-3">
        <Stat label="Owed On Your Yale Account" value={money(Math.max(0, owed))} tone={owed > 0 ? 'warning' : undefined} />
        <Stat label="Financial Hold" value={school.hold !== undefined ? `Since ${formatDate(school.hold, sim.zone)}` : 'None'} note={school.hold !== undefined ? 'No registration and no diploma while it stands' : undefined} tone={school.hold !== undefined ? 'negative' : undefined} />
        <Stat label="Terms Enrolled" value={`${enrolledTerms(school).length}`} note={`Six have tuition support; the degree within ${EXTENDED_STUDY.maxSemesters}`} />
      </div>
      {owed > 0 && (
        <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field"><label htmlFor="yale-pay">Pay (Blank Pays It All)</label><input id="yale-pay" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={(owed / 100).toFixed(2)} /></div>
          <Gated feature="school.pay_balance" className="btn btn-sm" onClick={() => { const a = run<{ owed: number }>('school.pay_balance', amount ? { amount: value } : {}); if (a.ok) { toast(a.value!.owed > 0 ? `Paid. ${money(a.value!.owed)} still owed.` : 'Paid in full.', 'positive'); setAmount(''); } }}>Pay From Your Bank</Gated>
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Date</th><th scope="col">What</th><th scope="col" className="num">Charged</th><th scope="col" className="num">Paid Or Credited</th></tr></thead>
          <tbody>
            {lines.map((t) => {
              const p = t.postings.find((q) => q.accountId === acc.id)!;
              return <tr key={t.id}><td>{formatDate(t.at, sim.zone)}</td><td className="small">{t.memo}</td><td className="num mono">{p.amount < 0 ? money(-p.amount) : ''}</td><td className="num mono">{p.amount > 0 ? money(p.amount) : ''}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <Fine>Tuition support ordinarily covers six terms (p.182); a term past it is billed tuition and the Yale Health fee, due in thirty days, SLATE’s estimate. Unpaid, the Bulletin’s late fee, {money(inSaveMoney(sim, EXTENDED_STUDY.lateFee, 'USD'))} a month to {money(inSaveMoney(sim, EXTENDED_STUDY.lateFeeTermCap, 'USD'))} a term, and a hold on registration and the diploma (p.184). A scholarship returned on a leave is charged here too. The balance is the sum of the account’s postings.</Fine>
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
  const convertible = convertibleHours(person, key, !termStart(term).fall);
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
        {no && <span className="xs dim">{no}</span>}
      </div>
      <Fine>Yale’s cap: no more than {WORK_LIMITS.weekHours} hours a week across all its jobs in an academic term, {WORK_LIMITS.recessWeekHours} in recess, summer or on leave; a booking past it is refused, and a shift that would pass it is worked to the cap. How Yale bounds the week wasn’t found; SLATE’s is Monday to Sunday. A student on aid short of the {WORK_STUDY.assignedHours} assigned hours through illness, injury or the School’s calls, or never assigned them, can ask for up to {WORK_LIMITS.convertibleHours} hours converted to grant-in-aid, processed in January and May (Bulletin p.189); it’s a scholarship for living costs, taxable. Hours missed absent, late or before the I-9 can’t be. Each shift carries its work’s own risk of injury, BLS’s rates: the crew’s in the shops higher than front of house. In {YALE_DRAMA.name}’s year {Math.floor(academicTerm(school, term) / 2) + 1}. Source: {WORK_LIMITS.source}.</Fine>
    </div>
  );
}
