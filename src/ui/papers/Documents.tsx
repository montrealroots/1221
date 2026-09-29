/**
 * SLATE — the papers a person holds, on the Papers screen
 * (`systems/documents.ts`): the passport, applying for one or renewing it at
 * the office's fee and time; going abroad, what a country asks of their
 * citizenship and what they're missing, and the travel authorizations they
 * hold or can apply for; and driving, the license and where it lets them
 * drive. Every figure is the engine's own, and each rule names its source.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import { ENTRY, ENTRY_AS_OF } from '@/engine/content/entry';
import { LICENSES } from '@/engine/content/licenses';
import { passRate } from '@/engine/content/licensepaths';
import { inSaveMoney } from '@/engine/systems/banking';
import {
  authorizationFor, authorizationRefusal, documentsOf, isoOfCity, licenseOf, licensingOf, mayDrive, mayEnter,
  passportOf, passportRefusal, passportRuleFor, passportTerms, type PersonDocument,
} from '@/engine/systems/documents';
import { applies, attemptFee, exchangeRefusal, exchangeable, idpRefusal, pathHere, renewRefusal, renewable, stepRefusal } from '@/engine/systems/licensing';
import { caPermitRefusal, o1Evidence, o1Refusal, optRefusal, programEnd, workRefusal } from '@/engine/systems/permission';
import { careerOf, roleById, workCityOf } from '@/engine/systems/career';
import { WORK_RULES } from '@/engine/content/workrules';

const KIND_WORD: Record<PersonDocument['kind'], string> = { passport: 'Passport', authorization: 'Travel Authorization', visa: 'Visa', license: 'Driving License', idp: 'International Driving Permit', permit: 'Permission To Work' };
const STATUS_WORD: Record<PersonDocument['status'], string> = { pending: 'Being Decided', valid: 'In Force', lost: 'Reported Lost', cancelled: 'Canceled' };
const countryName = (iso: string) => COUNTRIES.get(iso.toLowerCase())?.name ?? iso;

/** Every document they hold or have held, newest first. */
function DocumentList({ kinds }: { kinds: readonly PersonDocument['kind'][] }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const docs = documentsOf(person).filter((d) => kinds.includes(d.kind)).sort((a, b) => (b.issuedAt ?? b.appliedAt ?? 0) - (a.issuedAt ?? a.appliedAt ?? 0));
  if (!docs.length) return <p className="small muted" style={{ margin: 0 }}>None held.</p>;
  return (
    <div className="table-scroll">
      <table>
        <thead><tr><th scope="col">Document</th><th scope="col">Number</th><th scope="col">Issued</th><th scope="col">Runs Out</th><th scope="col">Standing</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
        <tbody>
          {docs.map((d) => {
            const expired = d.status === 'valid' && d.expiresAt !== undefined && d.expiresAt <= sim.now;
            return (
              <tr key={d.id}>
                <td>{d.name}{d.destination ? `, ${countryName(d.destination)}` : ''}</td>
                <td className="mono">{d.number}</td>
                <td>{d.issuedAt ? formatDate(d.issuedAt, sim.zone) : '—'}</td>
                <td>{d.expiresAt ? formatDate(d.expiresAt, sim.zone) : d.readyAt ? `Ready ${formatDate(d.readyAt, sim.zone)}` : '—'}</td>
                <td>{expired ? 'Run Out' : STATUS_WORD[d.status]}</td>
                <td>
                  {d.status === 'valid' && !expired && (
                    <Gated feature="documents.report_lost" className="btn btn-sm btn-ghost" onClick={() => { if (run('documents.report_lost', { documentId: d.id }).ok) toast(`${KIND_WORD[d.kind]} reported lost and canceled.`, 'positive'); }}>Report Lost</Gated>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PassportPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const rule = passportRuleFor(person);
  const passport = passportOf(person, sim.now);
  const age = (sim.now - person.birthInstant) / (365.25 * 86_400_000);
  const terms = rule ? passportTerms(rule, age) : undefined;
  const [dest, setDest] = useState('');
  const destinations = Object.keys(ENTRY).filter((iso) => iso !== isoOfCity(person.currentLocationId)).sort((a, b) => countryName(a).localeCompare(countryName(b)));
  const chosen = dest || destinations[0] || '';
  const answer = chosen ? mayEnter(person, chosen, sim.now) : undefined;
  const authNo = chosen ? authorizationRefusal(person, chosen, sim.now) : 'Choose a country.';
  const apply = (expedite: boolean) => {
    const a = run<{ readyAt: number; fee: number }>('documents.apply_passport', { expedite });
    if (a.ok) toast(`Applied, for ${money(a.value!.fee)}. It comes by ${formatDate(a.value!.readyAt, sim.zone)}.`, 'positive');
  };
  return (
    <div className="col gap-5">
      <Panel title="Your Passport" subtitle={rule ? rule.issuer : undefined}>
        <div className="col gap-3">
          <div className="grid grid-3">
            <Stat label="Passport" value={passport ? 'In Force' : 'None In Force'} note={passport ? `${passport.number}, runs out ${formatDate(passport.expiresAt!, sim.zone)}` : 'Needed to cross a border'} />
            <Stat label="A New One" value={rule && terms ? money(inSaveMoney(sim, Math.round(terms.fee * 100), rule.currency)) : '—'} note={rule ? `${rule.daysEstimated ? 'About ' : 'Up to '}${rule.days} days; good for ${terms!.years} years` : 'SLATE doesn’t have your country’s office'} />
            <Stat label="Faster" value={rule?.expedite ? money(inSaveMoney(sim, Math.round((terms!.fee + rule.expedite.extra) * 100), rule.currency)) : 'Not Offered'} note={rule?.expedite ? `${rule.expedite.days === 0 ? 'The same day' : `${rule.expedite.days} days`}${rule.expedite.renewalOnly ? ', renewals only' : ''}` : `${rule?.issuer ?? 'The office'} sells no faster service`} />
          </div>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <Gated feature="documents.apply_passport" className="btn btn-sm" disabled={Boolean(passportRefusal(person))} title={passportRefusal(person)} onClick={() => apply(false)}>{passport ? 'Renew It' : 'Apply For One'}</Gated>
            {rule?.expedite && (
              <Gated feature="documents.apply_passport" className="btn btn-sm btn-ghost" disabled={Boolean(passportRefusal(person, true))} title={passportRefusal(person, true)} onClick={() => apply(true)}>{passport ? 'Renew It Faster' : 'Apply Faster'}</Gated>
            )}
          </div>
          <p className="small" style={{ margin: 0 }}>A new passport replaces the one before it, which is canceled, and a travel authorization issued on the old one ends with it.</p>
          <DocumentList kinds={['passport', 'visa', 'authorization']} />
          {rule && <Fine>{rule.feeBasis} {rule.daysEstimated ? 'The office publishes no processing time; SLATE’s estimate. ' : ''}From abroad: {rule.abroad} Sources: {rule.sources.map((s) => s.url).join('; ')}.{rule.uncertain.length ? ` Not confirmed: ${rule.uncertain.join(' ')}` : ''}</Fine>}
        </div>
      </Panel>

      <Panel title="Going Abroad" subtitle="What a country asks of your citizenship, for a short visit">
        <div className="col gap-3">
          <div className="field-row">
            <div className="field">
              <label htmlFor="papers-destination">Country</label>
              <select id="papers-destination" value={chosen} onChange={(e) => setDest(e.target.value)}>
                {destinations.map((iso) => <option key={iso} value={iso}>{countryName(iso)}</option>)}
              </select>
            </div>
            <Gated feature="documents.apply_authorization" className="btn btn-sm" disabled={Boolean(authNo)} title={authNo} onClick={() => {
              const a = run<{ readyAt: number; fee: number }>('documents.apply_authorization', { destination: chosen });
              if (a.ok) toast(`Applied, for ${money(a.value!.fee)}. Decided by ${formatDate(a.value!.readyAt, sim.zone)}.`, 'positive');
            }}>Apply For The Authorization</Gated>
          </div>
          {answer && (
            answer.ok
              ? <p className="small" style={{ margin: 0 }}>You may go. {answer.stay ?? ''}{authorizationFor(person, chosen, sim.now) ? ' Your authorization is in force.' : ''}</p>
              : <ul className="small" style={{ margin: 0 }}>{answer.missing.map((m) => <li key={m}>{m}</li>)}</ul>
          )}
          {answer?.rule && <Fine>{answer.rule.note} Source: {answer.rule.source}. Researched {ENTRY_AS_OF}; permission to live or work there is a different permission.</Fine>}
        </div>
      </Panel>
    </div>
  );
}

/** The road to a license where they live: each step, where they stand on it, and booking the next. */
function LicensePath() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const here = pathHere(person);
  if (!here) return null;
  const { jurisdiction, path } = here;
  const r = person.licensing?.jurisdiction === jurisdiction ? person.licensing : undefined;
  const steps = path.steps.filter((st) => applies(st, person, sim.now));
  const fresh = r ?? { jurisdiction, done: {}, attempts: {}, failedAt: {}, used: {} };
  const book = (id: string, name: string) => {
    const a = run<{ at: number[]; fee: number; message?: string }>('documents.license_step', { step: id });
    if (!a.ok) return;
    toast(a.value!.message ?? `${name} booked for ${formatDate(a.value!.at[0]!, sim.zone)}${a.value!.at.length > 1 ? `, ${a.value!.at.length} sessions` : ''}, ${formatMoney(a.value!.fee, saveCurrency(sim.universe))}.`, 'positive');
  };
  return (
    <Panel title="Earning A License Here" subtitle={LICENSES[jurisdiction]!.authority}>
      <div className="col gap-3">
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Step</th><th scope="col">Fee</th><th scope="col">Pass Rate</th><th scope="col">Standing</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
            <tbody>
              {steps.map((st) => {
                const no = stepRefusal(sim, person, st.id);
                const done = r?.done[st.id];
                const booked = r?.booked?.step === st.id;
                const owed = r?.unpaid === st.id;
                const standing = owed ? 'Passed; License Fee Owed' : booked ? 'Booked' : no === 'Done.' && done !== undefined ? `Done ${formatDate(done, sim.zone)}` : no ? no : 'Open';
                const fee = owed ? st.issueFee ?? 0 : attemptFee(st, fresh);
                const rate = st.pass ? passRate(st.pass) : undefined;
                return (
                  <tr key={st.id}>
                    <td>{st.name}{st.sessions && st.sessions > 1 ? `, ${st.sessions} Sessions` : ''}</td>
                    <td className="mono">{fee > 0 ? formatMoney(Math.round(fee * 100), path.currency) : st.issueFee && !owed ? '' : 'None'}{st.issueFee && !owed ? `${fee > 0 ? ' + ' : ''}${formatMoney(Math.round(st.issueFee * 100), path.currency)} On Passing` : ''}</td>
                    <td>{rate ? `${Math.round(rate.rate * 100)}%${rate.published ? '' : ', Estimated'}` : '—'}</td>
                    <td className="small">{standing}</td>
                    <td>{!no && <Gated feature="documents.license_step" className="btn btn-sm" onClick={() => book(st.id, st.name)}>{owed ? 'Pay For The License' : st.kind === 'test' ? (r?.attempts[st.id] ? 'Book A Retake' : 'Book The Test') : st.kind === 'course' ? 'Book It' : 'Book A Visit'}</Gated>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {exchangeable(person, sim.now) && (
          <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="small">{exchangeable(person, sim.now)!.exchange.note}</span>
            <Gated feature="documents.exchange_license" className="btn btn-sm" disabled={Boolean(exchangeRefusal(person, sim.now))} title={exchangeRefusal(person, sim.now)} onClick={() => {
              const a = run<{ expiresAt: number; fee: number }>('documents.exchange_license', {});
              if (a.ok) toast(`Exchanged, for ${formatMoney(a.value!.fee, saveCurrency(sim.universe))}; good until ${formatDate(a.value!.expiresAt, sim.zone)}.`, 'positive');
            }}>Exchange It</Gated>
          </div>
        )}
        <p className="small" style={{ margin: 0 }}>Each step is booked on a business day here, and kept on the calendar like any call; miss a test and its fee is gone. {path.note}</p>
        <Fine>
          {steps.map((st) => `${st.name}: ${st.note}${st.feeBasis ? ` ${st.feeBasis}` : ''}${st.pass ? ` ${passRate(st.pass).basis}` : ''}`).join(' ')} How far ahead a step is booked is SLATE’s estimate. Fees are the authority’s own unless said otherwise; sources: {[...new Set([...LICENSES[jurisdiction]!.sources.map((x) => x.url), ...steps.flatMap((st) => (st.source ? [st.source] : []))])].join('; ')}.
        </Fine>
      </div>
    </Panel>
  );
}

export function DrivingPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const here = licensingOf(person.currentLocationId);
  const rule = here ? LICENSES[here] : undefined;
  const license = licenseOf(person, sim.now);
  const may = mayDrive(person, person.currentLocationId, sim.now);
  const held = documentsOf(person).filter((d) => d.kind === 'license' || d.kind === 'idp');
  const toRenew = renewable(person, sim.now);
  const renewNo = renewRefusal(person, sim.now);
  const idpNo = idpRefusal(person, sim.now);
  const idp = license ? LICENSES[license.issuer]?.idp : undefined;
  return (
    <div className="col gap-5">
      <Panel title="Driving" subtitle={rule ? rule.authority : 'Where SLATE has the rules'}>
        <div className="col gap-3">
          <div className="grid grid-3">
            <Stat label="Your License" value={license ? license.name : 'None'} note={license ? `${license.number}, runs out ${formatDate(license.expiresAt!, sim.zone)}` : 'Not a passport, and not permission to work'} />
            <Stat label="Here" value={may.ok ? 'You May Drive' : 'You May Not'} note={may.ok ? 'On the license you hold' : may.why ?? ''} />
            <Stat label="A License Here" value={rule ? `${rule.minAge.full} And Over` : '—'} note={rule ? `Good for ${rule.validityYears ?? '—'} years` : 'SLATE doesn’t have this place’s rules yet'} />
          </div>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <Gated feature="documents.renew_license" className="btn btn-sm" disabled={Boolean(renewNo)} title={renewNo} onClick={() => {
              const a = run<{ expiresAt: number; fee: number }>('documents.renew_license', {});
              if (a.ok) toast(`Renewed, for ${formatMoney(a.value!.fee, saveCurrency(sim.universe))}; good until ${formatDate(a.value!.expiresAt, sim.zone)}.`, 'positive');
            }}>{toRenew ? 'Renew It' : 'Renew'}</Gated>
            <Gated feature="documents.apply_idp" className="btn btn-sm btn-ghost" disabled={Boolean(idpNo)} title={idpNo} onClick={() => {
              const a = run<{ expiresAt: number; fee: number }>('documents.apply_idp', {});
              if (a.ok) toast(`An International Driving Permit, for ${formatMoney(a.value!.fee, saveCurrency(sim.universe))}; good until ${formatDate(a.value!.expiresAt, sim.zone)}.`, 'positive');
            }}>International Driving Permit</Gated>
          </div>
          {!held.length ? <p className="small muted" style={{ margin: 0 }}>You hold no license or permit.</p> : <DocumentList kinds={['license', 'idp']} />}
          {rule && (
            <>
              <p className="small" style={{ margin: 0 }}>A visitor’s license: {rule.foreign.visitor ?? 'not confirmed'}</p>
              <Fine>{idp ? `The permit: ${idp.issuer}${idp.validity ? `, ${idp.validity}` : ', a year as SLATE has it'}. ` : ''}Sources: {rule.sources.map((x) => x.url).join('; ')}.{rule.uncertain.length ? ` Not confirmed: ${rule.uncertain.join(' ')}` : ''}</Fine>
            </>
          )}
        </div>
      </Panel>
      <LicensePath />
    </div>
  );
}

/** Permission to work where they aren't a citizen: what they hold, applying for OPT or an O-1, and a Canadian permit for a production. */
export function WorkPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const usd = (n: number) => money(inSaveMoney(sim, Math.round(n * 100), 'USD'));
  const here = workRefusal(person, person.currentLocationId, sim.now, sim.now);
  const end = programEnd(person);
  const optNo = optRefusal(sim, person);
  const o1No = o1Refusal(sim, person);
  const evidence = o1Evidence(sim, person);
  const canada = careerOf(person).bookings.filter((b) => (b.status === 'offered' || b.status === 'accepted') && b.location && b.location.startsWith('ca-'));
  const opt = WORK_RULES.opt;
  const o1 = WORK_RULES.o1;
  const apply = (kind: string, payload: Record<string, unknown>, what: string) => {
    const a = run<{ readyAt: number; fee: number }>(kind, payload);
    if (a.ok) toast(`${what}, for ${money(a.value!.fee)}. Decided by ${formatDate(a.value!.readyAt, sim.zone)}.`, 'positive');
  };
  return (
    <div className="col gap-5">
      <Panel title="Permission To Work" subtitle="Apart from permission to enter">
        <div className="col gap-3">
          <div className="grid grid-3">
            <Stat label="Here" value={here ? 'Not Permitted' : 'You May Work'} note={here ?? 'As a citizen, or on what you hold'} />
            <Stat label="Your Program Ends" value={end ? formatDate(end, sim.zone) : '—'} note={end ? 'OPT is filed from 90 days before to 60 after' : 'For a student on an F-1'} />
            <Stat label="O-1 Evidence" value={`${evidence.filter((e) => e.met).length} Of ${evidence.length}`} note={`USCIS asks ${o1.criteriaNeeded} kinds`} />
          </div>
          <DocumentList kinds={['permit', 'visa']} />
        </div>
      </Panel>

      <Panel title="OPT" subtitle={`${opt.form}, after the degree`}>
        <div className="col gap-3">
          <p className="small" style={{ margin: 0 }}>Twelve months to work in your field, from the later of the program’s end and the approval, with no more than {opt.unemploymentDays} days between jobs in all. {usd(opt.fee)}; premium processing adds {usd(opt.premiumFee)} and decides it in {opt.premiumBusinessDays} business days.</p>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <Gated feature="documents.apply_opt" className="btn btn-sm" disabled={Boolean(optNo)} title={optNo} onClick={() => apply('documents.apply_opt', {}, 'Applied for OPT')}>Apply For OPT</Gated>
            <Gated feature="documents.apply_opt" className="btn btn-sm btn-ghost" disabled={Boolean(optNo)} title={optNo} onClick={() => apply('documents.apply_opt', { premium: true }, 'Applied for OPT, premium')}>Apply With Premium Processing</Gated>
          </div>
          <Fine>USCIS publishes no standard processing time; SLATE’s {opt.standardDays} days. Source: {opt.source}.</Fine>
        </div>
      </Panel>

      <Panel title="O-1B" subtitle="Extraordinary achievement, petitioned by your agency">
        <div className="col gap-3">
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Evidence</th><th scope="col">Shown</th></tr></thead>
              <tbody>{evidence.map((e) => <tr key={e.key}><td>{e.label}</td><td>{e.met ? 'Yes' : 'Not Yet'}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="small" style={{ margin: 0 }}>{usd(o1.fee)} for the petition, {usd(o1.asylumFee)} beside it and {usd(o1.opinionFee)} for SAG-AFTRA’s opinion; premium processing adds {usd(o1.premiumFee)}. Approved, it runs {o1.years} years, and extends a year at a time. Denied, the fees aren’t returned.</p>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <Gated feature="documents.petition_o1" className="btn btn-sm" disabled={Boolean(o1No)} title={o1No} onClick={() => apply('documents.petition_o1', {}, 'The petition is in')}>Petition For An O-1</Gated>
            <Gated feature="documents.petition_o1" className="btn btn-sm btn-ghost" disabled={Boolean(o1No)} title={o1No} onClick={() => apply('documents.petition_o1', { premium: true }, 'The petition is in, premium')}>Petition With Premium Processing</Gated>
          </div>
          <Fine>SLATE reads five of the regulation’s six kinds of evidence from the career, the experts’ letters from your reputation; a record of commercial success isn’t kept per actor. The opinion’s fee is as reported, and the standard processing time SLATE’s {o1.standardDays} days. Source: {o1.source}.</Fine>
        </div>
      </Panel>

      {canada.length > 0 && (
        <Panel title="Working In Canada" subtitle="A work permit for the production (C14)">
          <div className="col gap-3">
            {canada.map((b) => {
              const no = caPermitRefusal(person, b);
              return (
                <div key={b.id} className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="small">{roleById(b.roleId).label}, in {CITIES.get(workCityOf(b))?.name ?? 'Canada'}, from {formatDate(b.starts, sim.zone)}{no ? `: ${no}` : ''}</span>
                  <Gated feature="documents.apply_work_permit" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => apply('documents.apply_work_permit', { bookingId: b.id }, 'Applied for the work permit')}>Apply For A Work Permit</Gated>
                </div>
              );
            })}
            <Fine>CAD {WORK_RULES.caC14.fee} and CAD {WORK_RULES.caC14.biometricsFee} for biometrics; IRCC’s time varies by country, SLATE’s {WORK_RULES.caC14.standardDays} days. Source: {WORK_RULES.caC14.source}.</Fine>
          </div>
        </Panel>
      )}
    </div>
  );
}
