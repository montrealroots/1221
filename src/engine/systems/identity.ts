/**
 * SLATE — the state ID card, and the REAL ID it can carry (docs/WORLD.md,
 * stage 1c), from 2026-09-30. Figures in `content/identity.ts`.
 *
 * Until the scope reset of 2026-10-09 it was proving who one is on a journey
 * too: the TSA's checkpoint and its ConfirmID fee, an airline's ID at
 * check-in, a hotel desk's. The journeys went, and those with them.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, dateKey, formatDate, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { ID_CARDS } from '../content/identity';
import { ID_CARD_REPLACEMENT, LICENSE_REPLACEMENT } from '../content/replacements';
import { payFromBank } from './spending';
import { addYears, citizenOf, documentsOf, inForce, licensingOf, numberFor, passportOf, type PersonDocument } from './documents';
import { businessDaysOn, f1Of, programEnd } from './permission';
import { hasSsn } from './taxid';
import { schoolEnded } from './school';

/**
 * A US state's card for somebody who isn't a citizen (from 2026-10-10; until then it was issued over the counter to anyone
 * living there): lawful presence shown and checked through SAVE, ten business days or more; an F-1 student's I-20 and
 * proof of enrollment in the state's school; a Social Security number, or the SSA's letter that they're ineligible,
 * which SLATE doesn't issue since every student here is eligible through work-study; and a term to the end of their
 * lawful presence, SLATE's assumption. This cited Connecticut DMV's non-driver photo ID page and CGS 14-36(c) for that
 * term until 2026-10-17, when the page's host no longer resolved and 14-36(c) was read as the youth instruction permit:
 * no page the state publishes gives the term of a non-verified card for somebody not a citizen (the limited-term REAL
 * ID, whose expiration "must align with the expiration date on the individual's legal status document(s)", is for DACA
 * holders only, and Regs. Conn. State Agencies § 14-137-64a(c) lets the commissioner revoke the card once its holder is
 * "no longer entitled to be present", with no term), so it stays SLATE's, the limited-term card's rule, and said to be
 * (`docs/research/world/research-ct-idcard.json`, brief 11's KS-ct-idcard), and from 2026-10-17 it's one value,
 * `toLawfulPresence`, its basis said there (brief 12). Once SAVE has approved it the card is mailed
 * as anyone's is: the DMV asks the applicant back "when the immigration results have been approved", and the card
 * "will arrive in the mail", within twenty business days (`ID_CARDS`, from 2026-10-17: until then it came on SAVE's
 * day). Once school is over the lawful presence is a US
 * permit in force, OPT, and the term runs to its end (from 2026-10-12: until then an F-1 holder was turned away once
 * school had ended, OPT in force or not, and the card's term, had it been let through, ran to the program's end,
 * already past). A graduate isn't a student, though: `ssnRefusal` takes an application for the number only through
 * work-study at school, so a graduate on OPT who didn't apply for one there is refused the card for it, and told so,
 * and one who did is told it's on its way until it comes (from 2026-10-12).
 *
 * SAVE’s days are federal workdays: USCIS gives its own response time in them (“Approximately 5 federal workdays”,
 * SAVE Verification Response Time, uscis.gov, read on 2026-10-13), and the DMV’s ten business days are SAVE’s
 * (`businessDaysOn` with `federal`, as OPT’s premium processing counts them). Until 2026-10-13 they were counted Monday
 * to Friday, and a card applied for on the evening of 29 September 2026 came on 13 October, Columbus Day counted, not
 * on the 14th (left by that day’s second round).
 */
export const NONCITIZEN_ID: { readonly saveBusinessDays: number; toLawfulPresence: boolean; readonly source: string } = {
  saveBusinessDays: 10,
  /**
   * SLATE's assumption, not the state's published policy (brief 12's KS-ct-idcard, 2026-10-17): the card runs to the end
   * of its holder's lawful presence, never past the seven years to a birthday anyone's runs. Tried again that day, no
   * source gives a term for the card the DMV doesn't verify: chapters 1 and 246 of the statutes have none, the DMV's
   * pages say "valid for 7 years" with no exception, and 2005's Substitute SB 189, which would have restricted it "to a
   * term limited to coincide with the period of such person's lawful presence", failed in committee
   * (`docs/research/world/research-ct-idcard.json`, its `brief12`). Its basis: the DMV's limited-term REAL ID, whose
   * expiration "must align with the expiration date on the individual's legal status document(s)", and § 14-137-64a(c),
   * which lets the commissioner revoke the card once its holder is "no longer entitled to be present". Off, the card
   * takes the seven years to a birthday, still after SAVE and the mail and still non-verified. Read when the card is
   * applied for and written on it (`expiresAt`): changed, a card already issued or on its way keeps its date, a fee paid
   * stands, and a new card takes the new term. Your ID on Papers says so (`noncitizenTermNote`).
   */
  toLawfulPresence: true,
  source: 'https://portal.ct.gov/dmv/licenses-permits-ids/get-a-drivers-license-ct; https://portal.ct.gov/dmv/licenses-permits-ids/get-real-id',
};

/**
 * What Your ID tells somebody not a citizen at a US state's counter about the card's term: that it's SLATE's assumption,
 * as `NONCITIZEN_ID.toLawfulPresence` stands; nothing for a citizen, whose term is the state's (from 2026-10-17: until
 * then the screen said nothing of it, and only the guide called it SLATE's reading).
 */
export function noncitizenTermNote(person: Person): string | undefined {
  const here = idCardHere(person);
  if (!here || !here.jurisdiction.startsWith('us-') || citizenOf(person, 'US')) return undefined;
  return NONCITIZEN_ID.toLawfulPresence
    ? 'You’re not a US citizen, so your card runs to the end of your lawful presence: your program’s end while you’re at school, or your OPT’s end while you’re on OPT. The state doesn’t publish a term for a card it doesn’t verify, so this term is assumed in the game.'
    : 'You’re not a US citizen, and your card runs its full term to a birthday, as anyone’s does. The state doesn’t publish a term for a card it doesn’t verify, so this term is assumed in the game.';
}

/**
 * When a card issued now runs out: its years from the day, or, where the state runs it to a birthday (Connecticut's,
 * `ID_CARDS`, from 2026-10-17), the holder's first birthday at least that many years on, by the calendar where they
 * live, so one applied for on a birthday runs to the same birthday seven years on; nothing where SLATE has no term.
 */
export function idCardExpires(card: (typeof ID_CARDS)[string], person: Person, at: Instant): Instant | undefined {
  if (!card.years) return undefined;
  const plain = addYears(at, card.years);
  if (!card.toBirthday) return plain;
  const zone = CITIES.get(person.currentLocationId)?.timeZone ?? 'UTC';
  let n = new Date(plain).getUTCFullYear() - new Date(person.birthInstant).getUTCFullYear() - 1;
  while (dateKey(addYears(person.birthInstant, n), zone) < dateKey(plain, zone)) n += 1;
  return addYears(person.birthInstant, n);
}

/** Whether they're at school still, which an F-1 student's I-20 and proof of enrollment show. */
const atSchool = (person: Person): boolean => person.school !== undefined && !schoolEnded(person.school.standing);

/** The US permit they hold in force at a moment that runs latest, OPT; nothing without one. */
function usPermitInForce(person: Person, at: Instant): PersonDocument | undefined {
  const held = documentsOf(person).filter((d) => d.kind === 'permit' && d.destination === 'US' && inForce(d, at));
  return held.reduce<PersonDocument | undefined>((best, d) => (!best || (d.expiresAt ?? Infinity) > (best.expiresAt ?? Infinity) ? d : best), undefined);
}

/**
 * When a non-citizen's lawful presence ends, for a US card's term; nothing for a citizen. An F-1 student's at school is
 * the program's end; anyone else's is their permit's (from 2026-10-12: until then it was the program's end for everyone,
 * already past for a graduate on OPT).
 */
function presenceEnds(person: Person, at: Instant): Instant | undefined {
  if (citizenOf(person, 'US')) return undefined;
  const f1 = f1Of(person);
  if (f1 && atSchool(person)) return programEnd(person) ?? f1.expiresAt;
  return usPermitInForce(person, at)?.expiresAt ?? programEnd(person) ?? f1?.expiresAt;
}

const usd = (sim: Simulation, dollars: number): Money => { const c = Math.round(dollars * 100); const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, 'USD', cur) ?? c; };
const inMoney = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

// What the TSA takes at its checkpoint (`tsaAccepts`: a passport in force, or an American REAL ID license or ID card)
// was read by an ID card's look alone until 2026-10-10, which said the airport would read it while nothing flies; the
// sentence and the rule went together.

/** The state's ID card where they live. */
export function idCardHere(person: Person): { jurisdiction: string; card: (typeof ID_CARDS)[string] } | undefined {
  const j = licensingOf(person.currentLocationId);
  const card = j ? ID_CARDS[j] : undefined;
  return j && card ? { jurisdiction: j, card } : undefined;
}

/**
 * Whether an ID card applied for waits on nothing but its making and the mail (from 2026-10-17, brief 14's document
 * journey): a card no check stands before (a citizen's or a permanent resident's, `realId`, and one outside the US),
 * or a non-citizen's once SAVE's days since the application have run. Until then its row and its look said "Being
 * Decided" while the toast and the refusal said it was on its way, and for a citizen nothing was being decided. A
 * non-citizen's replacement copies the lost card, so it reads as checked for SAVE's days although no check is made on
 * one: the words it had before, for those days only.
 */
export function idCardOnItsWay(doc: PersonDocument, at: Instant): boolean {
  if (doc.kind !== 'idcard' || doc.status !== 'pending' || doc.appliedAt === undefined || doc.readyAt === undefined) return false;
  return doc.realId !== false || at >= businessDaysOn(doc.appliedAt, NONCITIZEN_ID.saveBusinessDays, true);
}

export function idCardRefusal(person: Person, at: Instant): string | undefined {
  const here = idCardHere(person);
  if (!here) return 'In the game, ID cards are issued only in New York, Connecticut, California, Ontario, British Columbia, Mexico City and Ireland.';
  const card = here.card;
  if (card.citizens && !citizenOf(person, card.citizens)) return `The ${card.name} is issued only to citizens.`;
  if (card.age && (at - person.birthInstant) / (365.25 * MS_DAY) < card.age) return `The ${card.name} is issued from age ${card.age}.`;
  if (card.passportBook && !documentsOf(person).some((d) => d.kind === 'passport' && d.issuer === 'IE' && inForce(d, at))) return 'The passport card is issued only to someone holding an Irish passport book in force.';
  if (!card.citizens && documentsOf(person).some((d) => d.kind === 'license' && d.issuer === here.jurisdiction && inForce(d, at))) return 'You hold a driving license from here, and it already serves as your ID.';
  // Not a citizen, at a US state's counter: status, enrollment and a number first.
  if (here.jurisdiction.startsWith('us-') && !citizenOf(person, 'US')) {
    if (person.usOutOfStatus !== undefined) return 'The DMV checks lawful presence through SAVE, and you’re out of status, so it won’t issue you a card.';
    // An F-1 student at school shows enrollment; anyone else a US permit in force, OPT (from 2026-10-12: until then an
    // F-1 holder out of school was refused here, OPT or not, and the permit was read only for somebody with no F-1).
    const f1 = f1Of(person);
    if (!(f1 && atSchool(person)) && !usPermitInForce(person, at)) {
      return f1 ? 'On an F-1, the DMV asks for your I-20 and proof that you’re enrolled, and you’re not at school.' : 'The DMV asks for proof of lawful presence in the US, which you don’t have.';
    }
    // A primary identity document in force: for somebody born abroad, a foreign passport with its supporting documents
    // (an F-1 student's I-20 and I-94), or an Employment Authorization Document, OPT's; documents “valid/unexpired”
    // (Connecticut DMV, DI-3 Rev. 6-2026, “REAL ID Document Identity Verification Checklist”, read 2026-10-16). From
    // 2026-10-16: until then none was asked, and a student who had reported her passport lost was issued a card with no
    // identity document at all (tests/remaining-papers.test.ts).
    if (!passportOf(person, at) && !usPermitInForce(person, at)) return 'The DMV asks for a primary identity document in force: your passport, with your I-94 and I-20. Apply for a passport or renew it under Your Passport first.';
    // Only an F-1 student at school can apply for the number, through work-study (`ssnRefusal`), and SLATE issues no
    // letter; one applied for there still comes once the program has ended. From 2026-10-12: until then everyone
    // without a number was told to apply for it on Papers, which a graduate on OPT, let through above that day, can't,
    // and one who had applied already needn't. Later that day a graduate whose number was on its way, applied for in
    // the program's last weeks, was still told SLATE issues it only to a student at school, which Papers and the card
    // that came contradicted, until the number applied for was read first.
    if (!hasSsn(person)) {
      const asked = 'The DMV asks for your Social Security number, or the SSA’s letter that you can’t have one.';
      if (person.ssn?.status === 'applied') return `${asked} Yours is on its way.`;
      if (!(f1 && atSchool(person))) return `${asked} In the game, the number goes only to an F-1 student at school, through work-study, and the letter is never issued.`;
      return `${asked} You can get one through work-study: apply for it first, under Social Security Number on Papers.`;
    }
  }
  if (documentsOf(person).some((d) => d.kind === 'idcard' && d.issuer === here.jurisdiction && inForce(d, at))) return 'You already hold one in force.';
  // One on its way, applied for or replacing a lost one (from 2026-10-06; until then a second was issued and charged for,
  // and they held two when the first came).
  if (documentsOf(person).some((d) => d.kind === 'idcard' && d.issuer === here.jurisdiction && d.status === 'pending')) return 'One is already on its way.';
  return undefined;
}

// Making a Connecticut license REAL ID before it renewed, for its $30 duplicate fee (`documents.real_id`), went in the
// connected world of 2026-10-09: REAL ID is what the TSA and a federal building ask, and nothing in SLATE flies or goes
// into one since the scope reset. A license that is REAL ID still says so on its record (`realId`). Until 2026-10-12
// its refusal's doc comment (`realIdRefusal`) stayed here in the present tense, over nothing, and its fee stayed in
// `REAL_ID`, read by nothing.

/**
 * Why a lost license can't be replaced, or nothing (from 2026-10-09; `LICENSE_REPLACEMENT`, each issuer's page): it
 * must be reported lost, and is replaced by its issuer for somebody living there, as an ID card is, or by mail from
 * elsewhere where the issuer sends one out of state (`byMail`, from 2026-10-10: until then a New Yorker studying in
 * New Haven couldn't replace their license at all). It's an identity document here; nothing in SLATE is driven.
 *
 * A replacement keeps the license’s expiration date (New York’s Replace A License page: “your expiration date and ID
 * number will not change”, read on 2026-10-13), so one past its date, or past it before the new card would come, isn’t
 * replaced: it’s renewed, as New York says of its ID card (“You cannot replace your ID if it expired.”), SLATE’s reading
 * for a license, and nothing in SLATE renews one since the cars went on 2026-10-09. Until 2026-10-13 a license reported
 * lost while in force and replaced after it ran out, or so near it that the card came after, was charged for and came
 * with its past date, said to be “in force from today” (left by that day’s second round).
 */
export function licenseReplaceRefusal(person: Person, documentId: string, at: Instant): string | undefined {
  const doc = documentsOf(person).find((d) => d.id === documentId);
  if (!doc || doc.kind !== 'license') return 'That isn’t a license of yours.';
  if (doc.status !== 'lost') return 'It isn’t lost. Report it lost first.';
  const rule = LICENSE_REPLACEMENT[doc.issuer];
  if (!rule) return 'What its issuer charges to replace it isn’t in the game.';
  if (licensingOf(person.currentLocationId) !== doc.issuer && !rule.byMail) return 'Its issuer replaces it only for someone living there, and no way to send one out of state was found.';
  const past = pastItsDate(person, doc, at, rule.days);
  if (past) return `${past}, and a replacement keeps the same date. A license past its date has to be renewed instead, and driving licenses can’t be renewed in the game.`;
  return undefined;
}

/**
 * Where a card has run out, or runs out before a replacement taking so many days would come, those words; or nothing.
 * A replacement keeps the card’s date, so one coming after it would come run out.
 */
function pastItsDate(person: Person, doc: PersonDocument, at: Instant, days: number): string | undefined {
  if (doc.expiresAt === undefined || doc.expiresAt > at + days * MS_DAY) return undefined;
  const on = formatDate(doc.expiresAt, CITIES.get(person.currentLocationId)?.timeZone ?? 'UTC');
  return doc.expiresAt <= at ? `It ran out on ${on}` : `It runs out on ${on}, before a new card would come`;
}

/** A license's replacement fee: the issuer's, nothing in New York for one stolen with the police's report filed (MV-78B). */
export function licenseReplaceFee(sim: Simulation, doc: PersonDocument): Money {
  if (doc.issuer === 'us-ny' && doc.stolen && doc.policeReport !== undefined) return 0;
  const rule = LICENSE_REPLACEMENT[doc.issuer]!;
  return inMoney(sim, rule.fee, rule.currency);
}

export const ID_CARD_KIND = 'documents.idcard_arrives';

/**
 * Why a lost ID card can't be replaced, or nothing: it must be reported lost, and replaced by its issuer for someone
 * living there. A replacement keeps the card’s date, so one past it, or past it before the new card would come, isn’t
 * replaced (New York’s Replace A Non-Driver ID page: “You cannot replace your ID if it expired.”, read on 2026-10-13;
 * SLATE’s reading for every issuer). Until 2026-10-13 a card reported lost while in force and replaced after it ran out
 * was charged for and came with its past date, said to be “in force from today”, as a license did (found with the
 * license that day).
 */
export function idReplaceRefusal(person: Person, documentId: string, at: Instant): string | undefined {
  const doc = documentsOf(person).find((d) => d.id === documentId);
  if (!doc || doc.kind !== 'idcard') return 'That isn’t an ID card of yours.';
  if (doc.status !== 'lost') return 'It isn’t lost. Report it lost first.';
  const rule = ID_CARD_REPLACEMENT[doc.issuer];
  if (!rule) return 'What its issuer charges to replace it isn’t in the game.';
  if (idCardHere(person)?.jurisdiction !== doc.issuer) return 'It’s replaced only where it was issued, for someone living there.';
  const past = pastItsDate(person, doc, at, rule.days);
  if (past) return `${past}, and a replacement keeps the same date, so it can’t be replaced. Apply for a new card instead, if you can.`;
  return undefined;
}

/**
 * A new card's fee, in the save's money, as `documents.apply_idcard` charges it (from 2026-10-20, brief 17: Your ID says
 * it before Get is pressed, where until then only the toast after it did).
 */
export function idCardFee(sim: Simulation, card: (typeof ID_CARDS)[string]): Money {
  return card.currency ? inMoney(sim, card.fee, card.currency) : usd(sim, card.fee);
}

/** A replacement's fee for them, in the save's money: the reduced one from its age where there is one. */
export function idReplaceFee(sim: Simulation, person: Person, issuer: string): Money {
  const rule = ID_CARD_REPLACEMENT[issuer]!;
  const age = (sim.now - person.birthInstant) / (365.25 * MS_DAY);
  const fee = rule.seniorFee !== undefined && age >= (rule.seniorFrom ?? Infinity) ? rule.seniorFee : rule.fee;
  return inMoney(sim, fee, rule.currency);
}

/**
 * A save from before 2026-10-16 holding a US state ID card issued to somebody not a citizen, marked REAL ID as SLATE
 * then marked them: corrected on opening to the non-verified card the state issues (`documents.apply_idcard`). Once:
 * a card already unmarked is left alone. A permanent resident would be eligible, and SLATE has none.
 */
export function nonCitizenCards(person: Person): void {
  if (citizenOf(person, 'US')) return;
  for (const d of documentsOf(person)) if (d.kind === 'idcard' && d.issuer.startsWith('us-') && d.realId === true) d.realId = false;
}

export function registerIdentity(sim: Simulation): void {
  sim.onCommand<{ documentId: string }, { readyAt: Instant; fee: Money }>('documents.replace_idcard', (p, { sim: s }) => {
    const person = s.player;
    const no = idReplaceRefusal(person, String(p?.documentId), s.now);
    if (no) throw new CommandError(no);
    const lost = documentsOf(person).find((d) => d.id === p.documentId)!;
    const rule = ID_CARD_REPLACEMENT[lost.issuer]!;
    const fee = idReplaceFee(s, person, lost.issuer);
    if (fee > 0 && !payFromBank(s, person, fee, `${lost.name}, replaced`, 'documents')) throw new CommandError(`Your bank can’t cover ${formatMoney(fee, saveCurrency(s.universe))}, so nothing was charged.`);
    lost.status = 'cancelled';
    const id = s.nextId('document');
    const readyAt = s.now + rule.days * MS_DAY;
    // A new card, not the lost one's report: its stolen mark and police report stay with the old (from 2026-10-10, as the license's do).
    documentsOf(person).push({ ...lost, id, number: numberFor('ID', id), status: 'pending', appliedAt: s.now, readyAt, stolen: undefined, policeReport: undefined } as PersonDocument);
    s.schedule({ at: readyAt, kind: ID_CARD_KIND, label: 'The ID Card Comes', category: 'personal', priority: 30, payload: { personId: person.id, documentId: id } });
    return { readyAt, fee };
  });
  sim.onSchedule(ID_CARD_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const doc = person ? documentsOf(person).find((d) => d.id === item.payload.documentId) : undefined;
    if (!doc || doc.status !== 'pending') return;
    // The post held while away kept it until the hold's end (`systems/away.ts`), until the time away went on 2026-10-09.
    doc.status = 'valid';
    doc.issuedAt = item.at;
    // Said, as a passport's arrival is (from 2026-10-10: until then it came in silence).
    if (person!.id === s.universe.playerId) s.notify({ category: 'papers', title: `${doc.name} Arrived`, body: 'It’s arrived, and you can use it from today.', importance: 40, route: '/workspace/papers' });
  });

  sim.onCommand<Record<string, never>, { expiresAt?: Instant; fee: Money; readyAt?: Instant }>('documents.apply_idcard', (_p, { sim: s }) => {
    const person = s.player;
    const no = idCardRefusal(person, s.now);
    if (no) throw new CommandError(no);
    const { jurisdiction, card } = idCardHere(person)!;
    const fee = idCardFee(s, card);
    if (fee > 0 && !payFromBank(s, person, fee, card.name, 'documents')) throw new CommandError(`Your bank can’t cover ${formatMoney(fee, saveCurrency(s.universe))}, so nothing was charged.`);
    const id = s.nextId('document');
    // Ireland's passport card runs five years or to the book's expiry; the Ontario, BC and INE cards' terms weren't read.
    const book = card.passportBook ? documentsOf(person).find((d) => d.kind === 'passport' && d.issuer === 'IE' && inForce(d, s.now)) : undefined;
    // A non-citizen's waits on SAVE (from 2026-10-10), and runs to the end of their lawful presence where SLATE's assumption
    // has it (`NONCITIZEN_ID.toLawfulPresence`, from 2026-10-17: until then always, with no one value to change it).
    const presence = jurisdiction.startsWith('us-') ? presenceEnds(person, s.now) : undefined;
    const limited = NONCITIZEN_ID.toLawfulPresence ? presence : undefined;
    const term = idCardExpires(card, person, s.now);
    const expiresAt = term !== undefined ? Math.min(term, book?.expiresAt ?? Infinity, limited ?? Infinity) : undefined;
    // SAVE's check first for somebody not a citizen, then the mail where the state mails the card (Connecticut's twenty
    // business days, `ID_CARDS`, from 2026-10-17: until then a citizen's was in force at the counter, and a
    // non-citizen's came on SAVE's day).
    const decided = presence !== undefined ? businessDaysOn(s.now, NONCITIZEN_ID.saveBusinessDays, true) : s.now;
    const readyAt = card.mailedBusinessDays ? businessDaysOn(decided, card.mailedBusinessDays, true) : decided;
    if (readyAt > s.now) {
      // Not REAL ID for somebody not a citizen: “Only U.S. Citizens and Permanent Residents are eligible for a verified
      // REAL ID driver’s license”, and anyone else is “issued a non-verified (Not for Federal Identification) driver’s
      // license or ID card” (Connecticut DMV, Non-US Citizen Requirements and DI-3 Rev. 6-2026, read 2026-10-16). Until
      // 2026-10-16 it was marked REAL ID, and its page said it met it (`nonCitizenCards` corrects one a save holds).
      documentsOf(person).push({ id, kind: 'idcard', issuer: jurisdiction, name: limited !== undefined ? `${card.name}, Limited Term` : card.name, number: numberFor('ID', id), status: 'pending', appliedAt: s.now, readyAt, ...(expiresAt ? { expiresAt } : {}), ...(jurisdiction.startsWith('us-') ? { realId: presence === undefined } : {}) } as PersonDocument);
      s.schedule({ at: readyAt, kind: ID_CARD_KIND, label: 'The ID Card Comes', category: 'personal', priority: 30, payload: { personId: person.id, documentId: id } });
      return { expiresAt, fee, readyAt };
    }
    documentsOf(person).push({ id, kind: 'idcard', issuer: jurisdiction, name: card.name, number: numberFor('ID', id), status: 'valid', issuedAt: s.now, ...(expiresAt ? { expiresAt } : {}), ...(jurisdiction.startsWith('us-') ? { realId: true } : {}) });
    return { expiresAt, fee };
  });

  sim.onCommand<{ documentId: string }, { readyAt: Instant; fee: Money }>('documents.replace_license', (p, { sim: s }) => {
    const person = s.player;
    const no = licenseReplaceRefusal(person, String(p?.documentId), s.now);
    if (no) throw new CommandError(no);
    const lost = documentsOf(person).find((d) => d.id === p.documentId)!;
    const rule = LICENSE_REPLACEMENT[lost.issuer]!;
    const fee = licenseReplaceFee(s, lost);
    if (fee > 0 && !payFromBank(s, person, fee, `${lost.name}, replaced`, 'documents')) throw new CommandError(`Your bank can’t cover ${formatMoney(fee, saveCurrency(s.universe))}, so nothing was charged.`);
    lost.status = 'cancelled';
    const id = s.nextId('document');
    const readyAt = s.now + rule.days * MS_DAY;
    // The same license, a new card: its term and its REAL ID kept, its number new.
    documentsOf(person).push({ ...lost, id, number: numberFor('D', id), status: 'pending', appliedAt: s.now, readyAt, stolen: undefined, policeReport: undefined } as PersonDocument);
    s.schedule({ at: readyAt, kind: ID_CARD_KIND, label: 'The License Comes', category: 'personal', priority: 30, payload: { personId: person.id, documentId: id } });
    return { readyAt, fee };
  });
}
