/**
 * SLATE — the papers a person holds, on the Papers screen
 * (`systems/documents.ts`): the passport, applying for one or renewing it at
 * the office's fee and time; what a country asks of their citizenship for a
 * week's visit, and what they're missing, as a rule to read; the visas and
 * travel authorizations they hold; the state ID card; and permission to work, a
 * student's status and OPT. Every figure is the engine's own, and each rule
 * names its source.
 *
 * Crossing a border, and applying for a visa or a travel authorization, went in
 * the scope reset of 2026-10-09. Until 2026-10-12 this header still had them
 * going abroad and applying for travel authorizations, Your Passport said a
 * passport was "Needed to cross a border", Going Abroad answered "You may
 * go.", and Residence Abroad said a naturalized life travels on the passport
 * it was born to; from 2026-10-12 the note names what asks for a passport, a
 * new bank (`photoIdOf`) and the Social Security office (`ssnRefusal`), the
 * answer says the country would let them in, and the birth citizenship's
 * passport is the one in force in their name (`passportOf`).
 *
 * Its Driving tab (the license, earning one, the boating and flying
 * certificates), the O-1 and a production's Canadian permit went with the
 * cars, the journeys and the career in the scope reset of 2026-10-09.
 */

import { ID_CARD_REPLACEMENT } from '@/engine/content/replacements';
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { MS_DAY, dateKey, formatDate } from '@/engine/core/time';
import { LookRegion, Open, at } from '@/ui/looks';
import { COUNTRIES } from '@/engine/content/geography';
import { ENTRY, ENTRY_AS_OF } from '@/engine/content/entry';
import { inSaveMoney } from '@/engine/systems/banking';
import {
  authorizationFor, isoOfCountry, documentsOf, isoOfCity, mayEnter,
  LOSABLE, citizenOf, passportOf, passportOffice, passportRefusal, passportRuleFor, type PersonDocument, policeReportRefusal } from '@/engine/systems/documents';
import { VISAS } from '@/engine/content/visas';
import { idCardHere, idCardRefusal, idReplaceFee, idReplaceRefusal, licenseReplaceFee, licenseReplaceRefusal } from '@/engine/systems/identity';
import { f1Of, optRefusal, programEnd, usStatusEnds } from '@/engine/systems/permission';
import { hasSsn, ssnRefusal } from '@/engine/systems/taxid';
import { WORK_RULES } from '@/engine/content/workrules';
import { MEXICO_RENEWAL, residenceIn, routeRefusal, settleRefusal } from '@/engine/systems/residence';
import { naturalizeRefusal } from '@/engine/systems/citizenship';

const KIND_WORD: Record<PersonDocument['kind'], string> = { passport: 'Passport', authorization: 'Travel Authorization', visa: 'Visa', license: 'Driving License', idp: 'International Driving Permit', permit: 'Permission To Work', idcard: 'State ID Card' };
const STATUS_WORD: Record<PersonDocument['status'], string> = { pending: 'Being Decided', valid: 'In Force', lost: 'Reported Lost', cancelled: 'Canceled' };
const countryName = (iso: string) => COUNTRIES.get(iso.toLowerCase())?.name ?? iso;
/** The atlas's id for a country by its ISO code: Britain is "uk" there and "GB" on a document. */
const countryIdOf = (iso: string) => COUNTRIES.all().find((c) => c.iso2?.toUpperCase() === iso.toUpperCase())?.id ?? iso.toLowerCase();

/** Every document they hold or have held, newest first. */
function DocumentList({ kinds }: { kinds: readonly PersonDocument['kind'][] }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  // Reporting a document lost cancels it for good, and what was issued on it: asked twice (from 2026-10-10).
  const [confirming, setConfirming] = useState<{ id: string; stolen: boolean } | undefined>(undefined);
  const docs = documentsOf(person).filter((d) => kinds.includes(d.kind)).sort((a, b) => (b.issuedAt ?? b.appliedAt ?? 0) - (a.issuedAt ?? a.appliedAt ?? 0));
  if (!docs.length) return <p className="small muted" style={{ margin: 0 }}>None held.</p>;
  return (
    <LookRegion className="table-scroll">
      <table>
        <thead><tr><th scope="col">Document</th><th scope="col">Number</th><th scope="col">Issued</th><th scope="col">Runs Out</th><th scope="col">Standing</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
        <tbody>
          {docs.map((d) => {
            const expired = d.status === 'valid' && d.expiresAt !== undefined && d.expiresAt <= sim.now;
            return (
              <tr key={d.id}>
                <td><Open subject={at('document', d.id)}>{d.name}</Open>{d.destination ? <>, <Open subject={at('country', countryIdOf(d.destination))}>{countryName(d.destination)}</Open></> : ''}</td>
                <td className="mono"><Open subject={at('document', d.id)}>{d.number}</Open></td>
                <td>{d.issuedAt ? <Open subject={at('day', dateKey(d.issuedAt, sim.homeZone))}>{formatDate(d.issuedAt, sim.zone)}</Open> : '—'}</td>
                <td>{d.expiresAt ? <Open subject={at('day', dateKey(d.expiresAt, sim.homeZone))}>{formatDate(d.expiresAt, sim.zone)}</Open> : d.readyAt ? <>Ready <Open subject={at('day', dateKey(d.readyAt, sim.homeZone))}>{formatDate(d.readyAt, sim.zone)}</Open></> : '—'}</td>
                <td><Open subject={at('document', d.id)}>{expired ? 'Run Out' : STATUS_WORD[d.status]}</Open></td>
                <td>
                  {/* What replaces a document run out, said on its row (from 2026-10-16: until then its action cell was empty,
                      and a New Yorker whose license ran out mid-program met it first as a new bank's refusal; found playing
                      seed je-5, brief 09's journeys). Nothing renews a license since the cars went (`licenseReplaceRefusal`). */}
                  {expired && d.kind === 'license' && <span className="xs dim">Nothing in SLATE renews a license since the cars went: a passport or an ID card in force is your photo ID, under Your Passport and Your ID.</span>}
                  {expired && d.kind === 'passport' && <span className="xs dim">Apply for a new one under Your Passport, above.</span>}
                  {expired && d.kind === 'idcard' && <span className="xs dim">Apply for a new one under Your ID, above.</span>}
                  {d.status === 'valid' && !expired && LOSABLE.has(d.kind) && (
                    confirming?.id === d.id ? (
                      <span className="col gap-1"><span className="xs">Reported {confirming.stolen ? 'stolen' : 'lost'}, it’s canceled for good, even if it turns up{d.kind === 'passport' ? ', with any visa or authorization issued on it (the F-1 status holds)' : ''}.</span>
                        <span className="row gap-1"><Gated feature="documents.report_lost" className="btn btn-sm btn-danger" onClick={() => { if (run('documents.report_lost', { documentId: d.id, ...(confirming.stolen ? { stolen: true } : {}) }).ok) toast(`${KIND_WORD[d.kind]} reported ${confirming.stolen ? 'stolen' : 'lost'} and canceled.`, 'positive'); setConfirming(undefined); }}>Cancel It</Gated><button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirming(undefined)}>Keep It</button></span></span>
                    ) : (
                    <><button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirming({ id: d.id, stolen: false })}>Report Lost…</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirming({ id: d.id, stolen: true })}>Report Stolen…</button></>
                    )
                  )}
                  {d.status === 'lost' && d.policeReport === undefined && (() => { const no = policeReportRefusal(sim.player, d); return <>{no && <span className="xs dim">{no} </span>}<Gated feature="documents.police_report" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? 'Online, free, and at once'} onClick={() => { if (run('documents.police_report', { documentId: d.id }).ok) toast('A police report filed.', 'positive'); }}>File A Police Report</Gated></>; })()}
                  {d.kind === 'license' && d.status === 'lost' && (() => { const no = licenseReplaceRefusal(sim.player, d.id, sim.now); return <>{no && <span className="xs dim">{no} </span>}<Gated feature="documents.replace_license" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { const a = run<{ readyAt: number; fee: number }>('documents.replace_license', { documentId: d.id }); if (a.ok) toast(`Replaced${a.value!.fee ? `, for ${formatMoney(a.value!.fee, saveCurrency(sim.universe))}` : ', free with the police report'}; the card comes ${formatDate(a.value!.readyAt, sim.zone)}.`, 'positive'); }}>{no ? 'Replace It' : `Replace It, ${formatMoney(licenseReplaceFee(sim, d), saveCurrency(sim.universe))}`}</Gated></>; })()}
                  {d.kind === 'idcard' && d.status === 'lost' && (() => { const no = idReplaceRefusal(sim.player, d.id, sim.now); const rule = ID_CARD_REPLACEMENT[d.issuer]; return <>{no && <span className="xs dim">{no} </span>}<Gated feature="documents.replace_idcard" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? (rule && !rule.daysRead ? 'Its time to come isn’t published: the license’s, there.' : undefined)} onClick={() => { const a = run<{ readyAt: number }>('documents.replace_idcard', { documentId: d.id }); if (a.ok) toast(`Replaced; the card comes ${formatDate(a.value!.readyAt, sim.zone)}.`, 'positive'); }}>{rule && !no ? `Replace It, ${formatMoney(idReplaceFee(sim, sim.player, d.issuer), saveCurrency(sim.universe), { cents: false })}` : 'Replace It'}</Gated></>; })()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </LookRegion>
  );
}

export function PassportPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const rule = passportRuleFor(person);
  const passport = passportOf(person, sim.now);
  // What the office asks of them where they are, from abroad or a US renewal by mail, as the command charges it
  // (`passportOffice`, from 2026-10-16: until then the office's terms at home, whatever the screen's fine print said).
  const office = passportOffice(person, sim.now);
  const [dest, setDest] = useState('');
  const destinations = Object.keys(ENTRY).filter((iso) => iso !== isoOfCity(person.currentLocationId)).sort((a, b) => countryName(a).localeCompare(countryName(b)));
  const chosen = dest || destinations[0] || '';
  const answer = chosen ? mayEnter(person, chosen, sim.now) : undefined;
  const visa = chosen ? VISAS[`${chosen}<${isoOfCountry(person.citizenshipId)}`] : undefined;
  const apply = (expedite: boolean) => {
    const a = run<{ readyAt: number; fee: number }>('documents.apply_passport', { expedite });
    if (a.ok) toast(`Applied, for ${money(a.value!.fee)}. It comes by ${formatDate(a.value!.readyAt, sim.zone)}.`, 'positive');
  };
  return (
    <div className="col gap-5">
      <Panel title="Your Passport" subtitle={rule ? rule.issuer : undefined} look={passport ? at('document', passport.id) : undefined} help="documents.passport-id">
        <div className="col gap-3">
          <div className="grid grid-3">
            <Stat label="Passport" look={passport ? at('document', passport.id) : undefined} value={passport ? 'In Force' : 'None In Force'} note={passport ? `${passport.number}, runs out ${formatDate(passport.expiresAt!, sim.zone)}` : 'Asked by a new bank and the Social Security office'} />
            <Stat label="A New One" value={rule && office ? money(inSaveMoney(sim, Math.round(office.fee * 100), office.currency)) : '—'} note={rule && office ? `${office.daysEstimated ? 'About ' : 'Up to '}${office.days} days; good for ${office.years} years${office.abroad ? '; from abroad' : office.renewal ? '; renewed by mail' : ''}` : 'SLATE doesn’t have your country’s office'} />
            <Stat label="Faster" value={office?.expedite ? money(inSaveMoney(sim, Math.round((office.fee + office.expedite.extra) * 100), office.currency)) : 'Not Offered'} note={office?.expedite ? `${office.expedite.days === 0 ? 'The same day' : `${office.expedite.days} days`}${office.expedite.renewalOnly ? ', renewals only' : ''}` : `${rule?.issuer ?? 'The office'} sells no faster service${office?.abroad ? ' to an applicant abroad' : ''}`} />
          </div>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <Gated feature="documents.apply_passport" className="btn btn-sm" disabled={Boolean(passportRefusal(person))} title={passportRefusal(person)} onClick={() => apply(false)}>{passport ? 'Renew It' : 'Apply For One'}</Gated>
            {office?.expedite && (
              <Gated feature="documents.apply_passport" className="btn btn-sm btn-ghost" disabled={Boolean(passportRefusal(person, true))} title={passportRefusal(person, true)} onClick={() => apply(true)}>{passport ? 'Renew It Faster' : 'Apply Faster'}</Gated>
            )}
          </div>
          <p className="small" style={{ margin: 0 }}>A new passport replaces the one before it, which is canceled, and a travel authorization issued on the old one ends with it.</p>
          <DocumentList kinds={['passport', 'visa', 'authorization']} />
          {rule && office && <Fine>{office.basis} {office.daysEstimated ? 'The office publishes no processing time for it; SLATE’s estimate. ' : ''}{office.abroad ? '' : `From abroad: ${rule.abroad} `}Sources: {rule.sources.map((s) => s.url).join('; ')}.{[...office.assumed, ...rule.uncertain].length ? ` Not confirmed: ${[...office.assumed, ...rule.uncertain].join(' ')}` : ''}</Fine>}
        </div>
      </Panel>

      <IdPanel />

      <Panel title="Going Abroad" subtitle="What a country asks of your citizenship, for a short visit: the rule, to read">
        <div className="col gap-3">
          <div className="field-row">
            <div className="field">
              <label htmlFor="papers-destination">Country</label>
              <select id="papers-destination" value={chosen} onChange={(e) => setDest(e.target.value)}>
                {destinations.map((iso) => <option key={iso} value={iso}>{countryName(iso)}</option>)}
              </select>
            </div>
          </div>
          {answer && (
            answer.ok
              ? <p className="small" style={{ margin: 0 }}>It would let you in for a week’s visit. {answer.stay ?? ''}{authorizationFor(person, chosen, sim.now) ? ' Your authorization is in force.' : ''}</p>
              : <ul className="small" style={{ margin: 0 }}>{answer.missing.map((m) => <li key={m}>{m}</li>)}</ul>
          )}
          {visa && <Fine>{visa.name}: {visa.basis} Source: {visa.source}.</Fine>}
          <Fine>There’s no travel in SLATE since 2026-10-09, so a visa or an authorization isn’t applied for here: what each country asks is kept as what it is.</Fine>
          {answer?.rule && <Fine>{answer.rule.note} Source: {answer.rule.source}. Researched {ENTRY_AS_OF}; permission to live or work there is a different permission.</Fine>}
        </div>
      </Panel>
    </div>
  );
}

/** The state's ID card: the Driving tab's until the cars went on 2026-10-09. Making a card REAL ID was here too, until the same day's connected world: nothing in SLATE flies. */
function IdPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const card = idCardHere(person);
  const idNo = idCardRefusal(person, sim.now);
  return (
    <Panel title="Your ID" subtitle={card ? card.card.name : 'Where SLATE issues one'} help="documents.passport-id">
      <LookRegion className="col gap-3">
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="documents.apply_idcard" className="btn btn-sm" disabled={Boolean(idNo)} title={idNo} onClick={() => {
            const a = run<{ expiresAt?: number; fee: number }>('documents.apply_idcard', {});
            if (a.ok) toast(`${card?.card.name ?? 'An ID card'}, for ${formatMoney(a.value!.fee, saveCurrency(sim.universe))}${a.value!.expiresAt ? `; good until ${formatDate(a.value!.expiresAt, sim.zone)}` : ''}.`, 'positive');
          }}>Get {card?.card.name ?? 'An ID Card'}</Gated>
        </div>
        <DocumentList kinds={['idcard', 'license', 'idp']} />
      </LookRegion>
    </Panel>
  );
}

/** Permission to work where they aren't a citizen: a student's status, and applying for OPT after the degree. */
export function WorkPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const usd = (n: number) => money(inSaveMoney(sim, Math.round(n * 100), 'USD'));
  const end = programEnd(person);
  const opt = WORK_RULES.opt;
  // An OPT in force ends on its 91st day without work, the thirteenth week `OPT_WEEK_KIND` counts past its 90, and the
  // status with it: there’s no work after the degree, so no played OPT reaches its twelve months and the sixty days
  // after them, which `usStatusEnds` gives it. Until 2026-10-13 Your US Status showed that date, fourteen months on,
  // while the OPT panel below said the status ended with the 90 days (found by that day’s third round).
  const optHeld = documentsOf(person).find((d) => d.kind === 'permit' && d.destination === 'US' && d.status === 'valid' && d.name.includes('OPT'));
  const idleEnds = optHeld?.issuedAt !== undefined ? optHeld.issuedAt + (Math.floor(opt.unemploymentDays / 7) + 1) * 7 * MS_DAY : undefined;
  const statusEnds = usStatusEnds(person);
  const status = statusEnds !== undefined && idleEnds !== undefined ? Math.min(statusEnds, idleEnds) : statusEnds;
  const optNo = optRefusal(sim, person);
  const apply = (kind: string, payload: Record<string, unknown>, what: string) => {
    const a = run<{ readyAt: number; fee: number }>(kind, payload);
    if (a.ok) toast(`${what}, for ${money(a.value!.fee)}. Decided by ${formatDate(a.value!.readyAt, sim.zone)}.`, 'positive');
  };
  return (
    <div className="col gap-5">
      <Panel title="Permission To Work" subtitle="Apart from permission to enter" help="documents.work">
        <div className="col gap-3">
          <div className="grid grid-3">
            <Stat label="Your Program Ends" value={end ? formatDate(end, sim.zone) : '—'} note={end ? 'OPT is filed from 90 days before to 60 after' : 'For a student on an F-1'} />
            <Stat label="Your US Status" value={person.usOutOfStatus !== undefined ? 'Out Of Status' : status !== undefined ? `Ends ${formatDate(status, sim.zone)}` : end ? 'Held' : '—'} note={person.usOutOfStatus !== undefined ? 'Since ' + formatDate(person.usOutOfStatus, sim.zone) + '; the Visa Waiver Program is closed to you' : status !== undefined ? (idleEnds !== undefined ? `When your OPT’s ${opt.unemploymentDays} days without work run out, with no grace after; stay past it and you’re out of status` : 'With its grace after permission ends; stay past it and you’re out of status') : end ? 'While you study, or while an application is decided' : 'For a student on an F-1'} />
          </div>
          <DocumentList kinds={['permit', 'visa']} />
        </div>
      </Panel>

      <TaxIdPanel />

      <Panel title="OPT" subtitle={`${opt.form}, after the degree`} help="documents.apply_opt">
        <div className="col gap-3">
          <p className="small" style={{ margin: 0 }}>Up to twelve months to work in your field, from the later of the program’s end and the approval, with no more than {opt.unemploymentDays} days without work in all. There’s no work to be had in SLATE after the degree since the career went, so an OPT approved ends after its {opt.unemploymentDays} days without work, and your US status ends with it: it keeps you here about {opt.unemploymentDays} days from its start. {usd(opt.fee)}; premium processing adds {usd(opt.premiumFee)} and decides it in {opt.premiumBusinessDays} business days.</p>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <Gated feature="documents.apply_opt" className="btn btn-sm" disabled={Boolean(optNo)} title={optNo} onClick={() => apply('documents.apply_opt', {}, 'Applied for OPT')}>Apply For OPT</Gated>
            <Gated feature="documents.apply_opt" className="btn btn-sm btn-ghost" disabled={Boolean(optNo)} title={optNo} onClick={() => apply('documents.apply_opt', { premium: true }, 'Applied for OPT, premium')}>Apply With Premium Processing</Gated>
          </div>
          <Fine>USCIS publishes no standard processing time; SLATE’s {opt.standardDays} days. Source: {opt.source}.</Fine>
        </div>
      </Panel>

      <ResidencePanel />

    </div>
  );
}

/**
 * A Social Security number's status, and applying for one on an F-1 (`systems/taxid.ts`, from 2026-10-10). No number
 * is shown: SLATE keeps none.
 */
function TaxIdPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const citizen = citizenOf(person, 'US');
  if (!citizen && !f1Of(person)) return null;
  const no = ssnRefusal(sim, person);
  const ssn = person.ssn;
  const where = citizen ? 'Held, as a US citizen' : ssn?.status === 'issued' ? 'Held' : ssn?.status === 'applied' ? `Applied for; the card comes ${formatDate(ssn.arrivesAt!, sim.zone)}` : 'Not yet';
  return (
    <Panel title="Social Security Number" subtitle={where} help="documents.apply_ssn">
      <div className="col gap-2">
        {!citizen && (
          <p className="small" style={{ margin: 0 }}>
            On an F-1 you may work only at the School, up to 19 hours a week in term (Yale’s limit) and full time in the breaks, and only while the program lasts. A Social Security number comes with that work: in person at the office on Court Street, with your passport, I-20 and the letters from the international office and the School; the card in two to three weeks. Without one, a 1040-NR goes in with an ITIN application, which holds the return seven weeks, and a bank opens your account only in a branch.
          </p>
        )}
        {!citizen && !hasSsn(person) && ssn?.status !== 'applied' && (
          <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Gated feature="documents.apply_ssn" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => { const a = run<{ arrivesAt: number }>('documents.apply_ssn', {}); if (a.ok) toast(`Applied. The card comes ${formatDate(a.value!.arrivesAt, sim.zone)}.`, 'positive'); }}>Apply At The Social Security Office</Gated>
            {no && <span className="xs dim">{no}</span>}
          </div>
        )}
        <Fine>SSA POMS RM 10211.245 and the IRS on the ITIN, read 2026-10-10 (research-student-status.json). Whether Yale pays before the card comes isn’t published; SLATE pays, as the IRS lets an employer report the number as applied for.</Fine>
      </div>
    </Panel>
  );
}

/**
 * Where they may make a home abroad, and what it takes (`systems/residence.ts`). Until 2026-10-16 Mexico's row read
 * “Open to you: $674.93. No life in SLATE moves to Mexico, so nothing but these papers reads it” beside Apply, and a
 * card held had Renew; from then the row says Mexico's rule and why SLATE grants none, and a card held why it isn't
 * renewed, and Apply and Renew are drawn grayed with those words, the refusal the command gives.
 */
function ResidencePanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const places = (['CA', 'IE', 'MX', 'GB', 'US'] as const).filter((iso) => iso !== isoOfCountry(person.citizenshipId) && !(person.naturalized ?? []).some((n) => n.iso === iso));
  const act = (kind: string, iso: string, what: string) => { const a = run<{ paid: number }>(kind, { country: iso }); if (a.ok) toast(`${what}, for ${formatMoney(a.value!.paid, cur)}.`, 'positive'); };
  return (
    <Panel title="Residence Abroad" subtitle="The right to make a home in another country" help="documents.residence">
      <LookRegion className="table-scroll">
        <table>
          <thead><tr><th scope="col">Country</th><th scope="col">Where You Stand</th><th scope="col" /></tr></thead>
          <tbody>
            {places.map((iso) => {
              const held = residenceIn(person, iso, sim.now);
              const no = routeRefusal(sim, person, iso);
              const settle = held ? settleRefusal(sim, person, iso) : undefined;
              const naturalize = naturalizeRefusal(sim, person, iso);
              const name = COUNTRIES.get(iso === 'GB' ? 'uk' : iso.toLowerCase())?.name ?? iso;
              return (
                <tr key={iso}>
                  <td><Open subject={at('country', iso === 'GB' ? 'uk' : iso.toLowerCase())}>{name}</Open></td>
                  <td className="small">{held ? `${held.name}${held.expiresAt ? `, to ${formatDate(held.expiresAt, sim.zone)}` : ''}${held.route === 'mx-temporary' ? `. ${MEXICO_RENEWAL}` : ''}` : no}{person.naturalizing?.iso === iso ? `; citizenship decided by ${formatDate(person.naturalizing.readyAt, sim.zone)}` : ''}</td>
                  <td>
                    <div className="row gap-1" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {!held && iso === 'MX' && <Gated feature="documents.residence" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => act('documents.residence', iso, 'Applied')}>Apply</Gated>}
                      {held?.route === 'mx-temporary' && <Gated feature="documents.renew_residence" className="btn btn-sm btn-ghost" disabled title={MEXICO_RENEWAL} onClick={() => act('documents.renew_residence', iso, 'Renewed')}>Renew</Gated>}
                      {!naturalize && <Gated feature="documents.naturalize" className="btn btn-sm btn-ghost" onClick={() => act('documents.naturalize', iso, 'Applied for citizenship')}>Naturalize</Gated>}
                      {held && !settle && <Gated feature="documents.settle" className="btn btn-sm btn-ghost" onClick={() => act('documents.settle', iso, 'Settled')}>Settle</Gated>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </LookRegion>
      <Fine>Britain’s Global Talent visa and a green card by extraordinary ability were read on a career’s record until the career went on 2026-10-09; there’s none to read now. Mexico’s temporary residence would let you live there, not work. Naturalizing keeps the citizenship you were born with, and its passport stays the one in force in your name.</Fine>
    </Panel>
  );
}
