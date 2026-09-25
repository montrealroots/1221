/**
 * SLATE — your work.
 *
 * The job the way a worker knows it: the real employer and what it pays an
 * hour, and where that figure comes from; the last payslip line by line,
 * gross to net, with what went into the pension; the leave and sick time the
 * hours have built; what the law where they work adds to a shift and a job;
 * and the other employers there, each with its pay, to apply to
 * (`systems/work.ts`, `content/employers.ts`, `content/payroll.ts`,
 * `content/labor.ts`).
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { EMPLOYERS } from '@/engine/content/employers';
import { JOBS, jobFor, payCycleFor, payCycleWords } from '@/engine/content/jobs';
import type { LaborLaw } from '@/engine/content/labor';
import { minimumWageAt } from '@/engine/content/wages';
import { inSaveMoney } from '@/engine/systems/banking';
import { countryAt, employerById, lawOf, monthsWith, rateAt, type JobState } from '@/engine/systems/work';

const pct = (share: number) => `${Math.round(share * 1000) / 10}%`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function WorkWorkspace() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (cents: number) => formatMoney(cents, cur);
  const job = useWorld((s) => s.player.job);
  const cityId = useWorld((s) => s.player.job?.cityId ?? s.player.currentLocationId);
  const { iso, currency: local } = countryAt(cityId);
  const lines = EMPLOYERS[iso] ?? {};
  const [line, setLine] = useState<string>(job?.jobId ?? 'school');
  const employer = job ? employerById(job.cityId, job.employerId) : undefined;
  const rate = job ? rateAt(job.cityId, job.jobId, cur, sim.now, job.employerId) : undefined;
  const floor = minimumWageAt(cityId, sim.now, cur);
  const law = job ? lawOf(job) : undefined;
  const slip = job?.lastSlip;
  const apply = (employerId: string, name: string) => {
    const answer = run<{ startsAt: number }>('work.apply', { employerId });
    if (answer.ok && answer.value) toast(`${name} will take you on from ${formatDate(answer.value.startsAt, sim.zone)}.`, 'positive');
  };
  const takeLeave = () => {
    const answer = run<{ at: number; hours: number }>('work.take_leave', {});
    if (answer.ok && answer.value) toast(`${answer.value.hours} hours of paid leave on ${formatDate(answer.value.at, sim.zone)}.`, 'positive');
  };
  const localPay = (hundredths: number) => money(inSaveMoney(sim, hundredths, local));

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Work</div>
        <h1>{job ? employer?.name ?? jobFor(job.jobId).title : 'No Day Job'}</h1>
        <p className="muted">
          {job && employer ? `${employer.role}, ${jobFor(job.jobId).title.toLowerCase()}, since ${formatDate(job.since, sim.zone)}.` : ''}
          {job && !employer ? `${jobFor(job.jobId).title}: no employer in that line is on record here.` : ''}
          {!job ? 'You’re not working. The employers where you live are below.' : ''}
          {job?.lookingUntil !== undefined ? ` You start on ${formatDate(job.lookingUntil, sim.zone)}.` : ''}
          {job?.switchTo ? ` You move to ${employerById(job.cityId, job.switchTo.employerId)?.name ?? 'a new employer'} on ${formatDate(job.switchTo.at, sim.zone)}, when your notice here runs out.` : ''}
          {job?.leavingAt !== undefined && !job.switchTo ? ` You’ve given notice; your last day is ${formatDate(job.leavingAt, sim.zone)}.` : ''}
          {` Paid ${payCycleWords(payCycleFor(iso))}.`}
        </p>
      </div>

      {job && rate && (
        <div className="grid grid-2" style={{ marginBottom: 'var(--s5)' }}>
          <Panel title="Your Rate" subtitle={`${money(rate.hourly)} an hour`}>
            <p className="small" style={{ margin: 0 }}>
              {rate.basis === 'employer' && `${employer?.name} publishes it.`}
              {rate.basis === 'typical' && `${employer?.name ?? 'The employer'} publishes no rate, so it’s what the work typically pays here, from the statistics office${rate.note ? ` (${rate.note})` : ''}.`}
              {rate.basis === 'estimate' && 'SLATE has no employer’s rate or statistic for this work here, so it’s the legal floor times what the work usually pays over it: SLATE’s estimate.'}
              {` The legal floor here is ${money(floor.hourly)}${floor.kind === 'estimate' ? ', SLATE’s estimate' : ''}.`}
            </p>
            {employer?.payNote && <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>{employer.payNote}</p>}
            {rate.source && <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>Source: {rate.source}</p>}
          </Panel>

          <Panel title="Last Payslip" subtitle={slip ? formatDate(slip.at, sim.zone) : 'No payday yet'}>
            {!slip ? <p className="small">Your first payday puts a payslip here.</p> : (
              <div className="col gap-1">
                {(slip.grossLines ?? [{ name: 'Hours Worked', amount: slip.gross }]).map((one) => (
                  <div key={one.name} className="row" style={{ justifyContent: 'space-between' }}><span className="small">{one.name}</span><span className="small mono">{money(one.amount)}</span></div>
                ))}
                <div className="row" style={{ justifyContent: 'space-between' }}><strong className="small">Gross</strong><strong className="small mono">{money(slip.gross)}</strong></div>
                {slip.lines.map((one) => (
                  <div key={one.name} className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="small">{one.name}{one.kind === 'pension' && !/pension|afore|fund|kiwisaver|super/i.test(one.name) ? ', to your pension' : ''}</span>
                    <span className="small mono">−{money(one.amount)}</span>
                  </div>
                ))}
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <strong className="small">Paid In</strong>
                  <strong className="small mono">{money(slip.gross - slip.lines.reduce((sum, one) => sum + one.amount, 0))}</strong>
                </div>
                {slip.employerPension > 0 && <p className="xs dim" style={{ margin: 0 }}>{slip.employerPensionName ?? 'Your employer'} added {money(slip.employerPension)} to it.</p>}
                {slip.estimate && <p className="xs dim" style={{ margin: 0 }}>SLATE doesn’t have this country’s payroll rules, so the deductions are its approximation.</p>}
              </div>
            )}
          </Panel>

          <Panel title="Leave And Sick Days">
            <div className="col gap-3">
              <p className="small" style={{ margin: 0 }}>{leaveWords(law, job.leaveHours ?? 0, monthsWith(job, sim.now))}</p>
              {law?.leave && law.leave.accrual > 0 && (
                <div>
                  <Gated feature="work.take_leave" className="btn btn-sm" onClick={takeLeave}>Take The Next Shift As Paid Leave</Gated>
                </div>
              )}
              <p className="small" style={{ margin: 0 }}>{sickWords(law, job, sim.now)}</p>
            </div>
          </Panel>

          <Panel title="The Law Where You Work">
            {!law ? <p className="small">SLATE has no employment law for this country, so a shift pays its hours and nothing more.</p> : (
              <div className="col gap-2">
                {lawWords(law, job.jobId).map((one) => <p key={one.text} className="small" style={{ margin: 0 }}>{one.text} <span className="xs dim">({one.source})</span></p>)}
              </div>
            )}
          </Panel>
        </div>
      )}

      {Object.keys(lines).length === 0 ? (
        <Empty title="No Employers On Record" body="SLATE has no employers on record for this country yet, so the work you know is paid its estimate." />
      ) : (
        <Panel title="Employers Here" subtitle="Hired in about three weeks, SLATE’s estimate, or when your notice runs out.">
          <div className="field" style={{ marginBottom: 'var(--s3)' }}>
            <label htmlFor="work-line">Line Of Work</label>
            <select id="work-line" value={line} onChange={(e) => setLine(e.target.value)}>
              {Object.keys(lines).map((id) => <option key={id} value={id}>{JOBS[id]?.title ?? id}</option>)}
            </select>
          </div>
          <div className="col gap-3">
            {lines[line]?.typical && (
              <p className="xs dim" style={{ margin: 0 }}>
                {lines[line]!.occupation ?? 'The work'} typically pays {localPay(lines[line]!.typical!.hourly)} an hour here ({lines[line]!.typical!.period}). Source: {lines[line]!.typical!.source}
              </p>
            )}
            {(lines[line]?.employers ?? []).map((one) => (
              <div key={one.id} className="row gap-3" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="grow">
                  <strong className="small">{one.name}</strong>
                  <span className="small">, {one.role}{one.where && !/national/i.test(one.where) ? `, ${one.where}` : ''}</span>
                  <div className="xs">
                    {one.hourlyFrom !== undefined
                      ? `From ${localPay(one.hourlyFrom)} an hour${one.hourlyTo !== undefined ? ` to ${localPay(one.hourlyTo)}` : ''}.`
                      : 'Publishes no rate.'}
                    {one.confidence === 'L' ? ' The research wasn’t sure of it.' : ''}
                  </div>
                  <div className="xs dim">Source: {one.source}</div>
                </div>
                {job?.employerId === one.id && job.lookingUntil === undefined
                  ? <span className="small muted">Your Employer</span>
                  : <Gated feature="work.apply" className="btn btn-sm" onClick={() => apply(one.id, one.name)}>Apply</Gated>}
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}

/** The leave the hours have built, the way the law where they work gives it. */
function leaveWords(law: LaborLaw | undefined, hours: number, months: number): string {
  const leave = law?.leave;
  if (!leave) return 'The law where you work gives no paid annual leave.';
  if (leave.asPay) return `Vacation pay comes as ${pct(leave.asPay)} of your pay on each paycheck, rather than as days to book.`;
  const usable = months >= (leave.usableAfterMonths ?? 0);
  return `You’ve built up ${hours.toFixed(1)} hours of paid leave, ${pct(leave.accrual)} of every hour you work${leave.loading ? `, paid with ${pct(leave.loading)} on top` : ''}.`
    + (usable ? '' : ` It can be taken after ${leave.usableAfterMonths} months with the employer.`)
    + (leave.paidOut ? ' What you don’t take is paid out when you leave.' : ' What you don’t take isn’t paid out when you leave.');
}

/** Sick pay, the way the law where they work gives it. */
function sickWords(law: LaborLaw | undefined, job: JobState, at: number): string {
  const sick = law?.sick;
  if (!sick) return 'The law where you work pays nothing for a day called in sick.';
  const from = sick.fromDay > 1 ? `from day ${sick.fromDay} of a spell` : 'from the first day';
  const who = sick.paidBy === 'state' ? 'The state’s sickness insurance' : 'Your employer';
  const not = sick.afterMonths !== undefined && monthsWith(job, at) < sick.afterMonths ? ` Not until you’ve been with the employer ${sick.afterMonths} months.` : '';
  const pot = sick.accrual !== undefined ? ` You’ve built up ${(job.sickHours ?? 0).toFixed(1)} hours.`
    : sick.daysAYear !== undefined ? ` ${sick.daysAYear} days a year; ${job.sickDays?.year === new Date(at).getUTCFullYear() ? job.sickDays.days : 0} used this year.` : '';
  return `${who} pays ${pct(sick.rate)} of a day called in sick, ${from}.${pot}${not} A day called in still counts against you at work.`;
}

/** Every rule the law where they work adds, in a line each, with its source. */
function lawWords(law: LaborLaw, jobId: string): { text: string; source: string }[] {
  const out: { text: string; source: string }[] = [];
  const covers = (lines?: readonly string[]) => !lines || lines.includes(jobId);
  if (law.saturday && covers(law.saturday.lines)) out.push({ text: `A Saturday shift pays ${pct(law.saturday.extra)} more.`, source: law.saturday.source });
  if (law.sunday && covers(law.sunday.lines)) out.push({ text: `A Sunday shift pays ${pct(law.sunday.extra)} more.`, source: law.sunday.source });
  if (law.holiday && covers(law.holiday.lines)) out.push({ text: `A public holiday worked pays ${pct(law.holiday.extra)} more${law.holiday.only ? ', on the days the law names' : ''}.`, source: law.holiday.source });
  if (law.evening && covers(law.evening.lines)) out.push({ text: `Hours from ${law.evening.from}:00 to ${law.evening.to % 24}:00 pay ${pct(law.evening.extra)} more.`, source: law.evening.source });
  if (law.night && covers(law.night.lines)) out.push({ text: `Night hours from ${law.night.from % 24}:00 to ${law.night.to % 24}:00 pay ${pct(law.night.extra)} more.`, source: law.night.source });
  if (law.overtime) {
    const past = [law.overtime.week !== undefined ? `${law.overtime.week} hours a week` : '', law.overtime.day !== undefined ? `${law.overtime.day} a day` : ''].filter(Boolean).join(' or ');
    out.push({ text: `Hours past ${past} pay ${pct(law.overtime.extra)} more${law.overtime.tierAfter !== undefined ? `, and ${pct(law.overtime.tierExtra ?? 0)} past ${law.overtime.tierAfter} hours of it` : ''}.`, source: law.overtime.source });
  }
  for (const extra of law.extras ?? []) {
    const when = extra.kind === 'month' ? extra.months.map((m) => MONTHS[m - 1]).join(' and ') : `${extra.day} ${MONTHS[extra.month - 1]}`;
    const what = extra.kind === 'fixed' ? `${extra.amount.toLocaleString('en-US')} for full time, by your share of it` : extra.kind === 'days' ? `${extra.days} days’ pay, for the part of the year worked` : 'a month’s pay';
    out.push({ text: `${extra.name}: ${what}, in ${when}.`, source: extra.source });
  }
  if (law.weeklyRestDay) out.push({ text: `A week of ${law.weeklyRestDay.minHours} hours or more, with every shift worked, pays a rest day too.`, source: law.weeklyRestDay.source });
  if (law.severance) out.push({ text: `Leaving after ${law.severance.afterMonths} months pays ${law.severance.daysAYear} days’ pay for each year worked.`, source: law.severance.source });
  if (law.quitNotice) {
    const days = law.quitNotice.steps[law.quitNotice.steps.length - 1]?.[1] ?? 0;
    out.push({ text: days > 0 ? `Quitting takes notice: up to ${days} days, by how long you’ve worked there.` : 'You can quit without notice.', source: law.quitNotice.source });
  }
  return out;
}
