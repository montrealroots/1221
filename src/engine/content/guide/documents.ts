/**
 * SLATE — the guide's reference: passport, ID and permission to work (from 2026-10-12; `content/guide/types.ts`).
 *
 * Every figure is the rule's own, imported: the passport office's (`content/passports.ts`), the state's ID card and its
 * replacement and a license's (`content/identity.ts`, `content/replacements.ts`), OPT's (`content/workrules.ts`), the
 * Social Security number's (`systems/taxid.ts`), the status's grace (`systems/permission.ts`, `systems/documents.ts`),
 * and Mexico's residence and naturalizing (`systems/residence.ts`, `systems/citizenship.ts`). The OPT example's dates are
 * worked from them for the class that began in 2026, whose program ends May 31, 2029.
 *
 * One figure is written as text because its rule doesn't export it: OPT's days without work counted a week at a time
 * (`OPT_WEEK_KIND`). A residence card's renewal in its last 30 days was the second until 2026-10-16, when Mexico's
 * papers stopped being sold and the renewal's refusal came to say it (`MEXICO_RENEWAL`).
 *
 * Residence Abroad's entry told, until 2026-10-16 (brief 09's journeys), how to buy Mexico's temporary residence on the
 * savings test, about $674.93, renew it, settle and naturalize, and that nothing but this tab read it; from then it
 * says Mexico's rule is said and none of it is granted, and its worked example reads the row of a student whose
 * savings meet the test, with nothing leaving the bank.
 *
 * Verified claim by claim against the code on 2026-10-12, and corrected where it listed refusals the screen never shows
 * (a button the code hides when it's refused shows no reason), read the replacement's lower fee from 62 as the card's,
 * took "all your accounts" for what Mexico's test reads (the current account and its bank's savings), and had a
 * renewal pressed "eleven months on", which can fall a day or so before the card's last 30 and be refused.
 *
 * Corrected again later on 2026-10-12, when the DMV began taking OPT in force as a graduate's lawful presence and running
 * the card to OPT's end (`idCardRefusal`, `presenceEnds` in `systems/identity.ts`): until then this said the DMV turned an
 * F-1 holder away once school was over, OPT or not, ran a noncitizen's card to the program's end, and listed the DMV's
 * asks without saying the Social Security number comes only through work-study at school. It also said REAL ID was
 * "recorded on a card", where a card's page says it, and gave a license's replacement from elsewhere no words of its own.
 * After that it said a noncitizen's card ran to the end of their lawful presence, where on OPT it runs to OPT's printed
 * end, which outlasts the OPT its days without work cancel, and the status with it, by months, and nothing cancels the
 * card then (`presenceEnds`, `systems/permission.ts`); and that a license began as REAL ID at its state's published
 * share, where a state with none published draws at the mean of those that are (`realIdShare`).
 *
 * On 2026-10-13 “The Social Security office is in New Haven, at 150 Court Street.” went from the engine (`ssnRefusal`),
 * reached by no play, since every student is in New Haven and nothing moves one; until then the entry listed it, and
 * said the number needed you in New Haven.
 *
 * Corrected on 2026-10-16 with the papers' lifecycles (the owner's brief of that day, section 8): until then it said a
 * passport cost its office's fee at home and offered its faster service wherever you applied, though every life applies
 * from New Haven and a citizen of anywhere but the United States from abroad (`passportOffice`, `PASSPORTS_ABROAD`);
 * that a US renewal cost the first passport's fee, where Form DS-82 by mail is $130 (`US_RENEWAL`); that the DMV asked
 * someone not a citizen for no identity document, where it asks a passport in force or OPT's card (`idCardRefusal`);
 * and that every US state ID card SLATE issues met REAL ID, where Connecticut issues a non-citizen's Not For Federal
 * Identification.
 */

import { CHAPTER_FOR } from '../tutorial';
import { PASSPORTS } from '../passports';
import { PASSPORTS_ABROAD, US_RENEWAL } from '../passportsabroad';
import { ID_CARDS } from '../identity';
import { ID_CARD_REPLACEMENT, LICENSE_REPLACEMENT } from '../replacements';
import { WORK_RULES } from '../workrules';
import { exchange } from '../currency';
import { formatMoney } from '../../core/money';
import { MS_DAY, formatDate } from '../../core/time';
import { STARTING } from '../../systems/documents';
import { NONCITIZEN_ID } from '../../systems/identity';
import { STATUS_GRACE_DAYS } from '../../systems/permission';
import { SSN } from '../../systems/taxid';
import { PLAN } from '../../systems/taxreturn';
import { MEXICAN_RESIDENCE, MEXICO_RENEWAL, MEXICO_RULE, MEXICO_UNREAD } from '../../systems/residence';
import { NATURALIZE } from '../../systems/citizenship';
import type { GuideEntry } from './types';

const NEW_HAVEN = 'America/New_York';
const PAPERS = '/workspace/papers';
/** A Papers section's id: a parameter typed by its literals would read to `tools/title-case.mjs` as a label. */
type Section = 'passport' | 'work';
const on = (section: Section, label: string) => ({ route: PAPERS, tab: section, label });

const usd = (cents: number): string => formatMoney(cents, 'USD', { cents: cents % 100 !== 0 });
const dollars = (units: number): string => usd(Math.round(units * 100));
const pesos = (units: number): string => `MXN ${units.toLocaleString('en-US', { minimumFractionDigits: units % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
const day = (at: number): string => formatDate(at, NEW_HAVEN);

const PAPERS_CHAPTER = CHAPTER_FOR['documents.police_report']!.title;
const CHAPTER = CHAPTER_FOR['documents.apply_passport']!.title;

const US = PASSPORTS['US']!;
const US_FASTER = US.expedite!;
const UK_ABROAD = PASSPORTS_ABROAD['GB']!;
const AU_ABROAD = PASSPORTS_ABROAD['AU']!;
/** A fee in an office's own money, as its screen gives it (`content/passportsabroad.ts`). */
const inOwn = (units: number, currency: string): string => formatMoney(Math.round(units * 100), currency, { cents: units % 1 !== 0 });
const CT_ID = ID_CARDS['us-ct']!;
const CT_ID_AGAIN = ID_CARD_REPLACEMENT['us-ct']!;
const NY_ID_AGAIN = ID_CARD_REPLACEMENT['us-ny']!;
const CA_ID_AGAIN = ID_CARD_REPLACEMENT['us-ca']!;
const CT_LICENSE = LICENSE_REPLACEMENT['us-ct']!;
const NY_LICENSE = LICENSE_REPLACEMENT['us-ny']!;
const CA_LICENSE = LICENSE_REPLACEMENT['us-ca']!;
const OPT = WORK_RULES.opt;
const MX = MEXICAN_RESIDENCE;
/** The Social Security office's visit, in words, from its rule (`SSN.visitMinutes`). */
const SSN_VISIT = SSN.visitMinutes === 60 ? 'an hour' : `${SSN.visitMinutes} minutes`;
/**
 * The issuers that mail a replacement license out of state, read from the table (`byMail`), and New York's sentence
 * by it: "Only" while New York's is the one. Until later on 2026-10-12 "Only New York's" was typed in.
 */
const MAILS_OUT = Object.keys(LICENSE_REPLACEMENT).filter((j) => LICENSE_REPLACEMENT[j]!.byMail);
const NY_MAILS = NY_LICENSE.byMail
  ? ` ${MAILS_OUT.length === 1 ? 'Only New York’s' : 'New York’s'} issuer mails one out of state, on its form ${NY_LICENSE.byMail.form}, so a New York license is replaced from New Haven.`
  : '';

// OPT for the class that began in 2026: applied for the day after its window opens, decided at the standard pace, and
// ended by its days without work, counted a week at a time; against the status's grace without it.
const PROGRAM_END = Date.UTC(2029, 4, 31, 12);
const OPT_APPLIED = PROGRAM_END - (OPT.windowBeforeDays - 1) * MS_DAY;
const OPT_DECIDED = OPT_APPLIED + OPT.standardDays * MS_DAY;
const OPT_START = Math.max(PROGRAM_END, OPT_DECIDED);
const OPT_ENDS = OPT_START + (Math.floor(OPT.unemploymentDays / 7) + 1) * 7 * MS_DAY;
const STATUS_WITHOUT = PROGRAM_END + STATUS_GRACE_DAYS.f1 * MS_DAY;

// Mexico's residence: its savings and income tests, and the savings in the save's dollars at SLATE's exchange rates.
// Its first year's fees in dollars (`MX_FIRST`) went from here with the sale, on 2026-10-16.
const MX_SAVINGS = Math.round(MX.savingsUma * MX.uma);
const MX_INCOME = Math.round(MX.incomeUma * MX.uma);
const MX_SAVINGS_USD = Math.round((exchange(MX_SAVINGS * 100, 'MXN', 'USD') ?? 0) / 100) * 100;

export const DOCUMENTS: readonly GuideEntry[] = [
  {
    id: 'documents.passport-id',
    title: 'Passport And ID',
    goal: 'papers',
    covers: ['documents.apply_passport', 'documents.apply_idcard', 'documents.replace_idcard', 'documents.report_lost', 'documents.replace_license', 'documents.police_report', 'look.document'],
    synonyms: ['passport', 'renew a passport', 'passport fee', 'state ID card', 'Non-Driver Identification Card', 'photo ID', 'lost passport', 'stolen wallet', 'report lost', 'report stolen', 'police report', 'replace a license', 'replace an ID card', 'REAL ID', 'going abroad'],
    questions: ['How do I renew my passport?', 'What happens if I lose my passport?', 'How do I get a state ID card?', 'Why does a bank want a photo ID?', 'Do I need a police report for a lost card?', 'Can I travel abroad?'],
    where: on('passport', 'Papers, Passport And ID, Your Passport And Your ID'),
    available: `From the guide’s chapter “${CHAPTER}”; File A Police Report opens with “${PAPERS_CHAPTER}”.`,
    short: 'Passport And ID holds the papers that prove who you are: your passport, from the country you’re a citizen of, and the state’s ID card where you live, beside any license you carry. A bank you don’t bank with yet asks for one of them in force before it opens an account, the Social Security office asks for your passport, and so does the DMV of anyone not a citizen. A paper lost or stolen is reported here, a license or an ID card is replaced here, and each paper opens when you press its name.',
    steps: [
      'Open Papers and its Passport And ID tab. Your Passport shows the one in force, A New One with its fee and days, and Faster where the office sells it.',
      'Press Apply For One, or Renew It when you hold one; Apply Faster or Renew It Faster pays for the quicker service.',
      'Under Your ID, press Get and the card’s name, such as Get Non-Driver Identification Card.',
      'For a lost passport, license, international driving permit or ID card in force, press Report Lost… or Report Stolen… in its row, then Cancel It to confirm, or Keep It to stop.',
      'In the same row, File A Police Report where the police take one online, and Replace It for a license or an ID card.',
      'Press a paper’s name, number or standing to open it: who issued it, when it runs out, and what it lets you do today.',
    ],
    needs: [
      'A passport office SLATE has for your citizenship, and no application already in.',
      'For the ID card: living where SLATE issues one (New York, Connecticut, California, Ontario, British Columbia, Mexico City or Ireland), with no license from there in force and no card held or on its way.',
      'Not a US citizen, at a US state’s counter: in status; at school on an F-1, or, once school is over, a US permit in force, such as OPT; a primary identity document in force, your passport, or OPT’s card in its place; and a Social Security number, which SLATE issues only through work-study at school.',
      'To replace a card: report it lost first, and live where it was issued, though New York mails a license out of state.',
      'The fee in your accounts.',
    ],
    costs: [
      { label: 'Time', value: 'None: applying, reporting and replacing move no clock' },
      { label: 'A US Passport', value: `${dollars(US.fee)} the first time or after one is lost, ready in up to ${US.days} days, good for ${US.validityYears} years; renewed by mail on Form ${US_RENEWAL.form}, ${dollars(US_RENEWAL.fee)}, where your most recent was issued within ${US_RENEWAL.withinYears} years, at ${US_RENEWAL.issuedFromAge} or older, and never reported lost; ${dollars(US_FASTER.extra)} more for ${US_FASTER.days} days`, estimate: US.daysEstimated },
      { label: 'Another Country’s Passport', value: `Applied for from New Haven, so from abroad: its office’s fee and time for an applicant outside the country, where SLATE has them, as the UK’s ${inOwn(UK_ABROAD.fee, UK_ABROAD.currency)} online and Australia’s ${inOwn(AU_ABROAD.fee, AU_ABROAD.currency)} with its overseas surcharge; its faster service only where it’s sold abroad, which the UK’s Fast Track isn’t`, estimate: true },
      { label: 'Connecticut’s ID Card', value: `${dollars(CT_ID.fee)}, good for ${CT_ID.years} years, SLATE’s term for the state’s “up to seven”; for anyone not a citizen, after ${NONCITIZEN_ID.saveBusinessDays} federal workdays for the DMV’s SAVE check, weekends and federal holidays not among them, to the program’s end at school, or on OPT to the end printed on it, ${OPT.months} months from its start. OPT canceled for its days without work leaves the card in force to that printed end`, estimate: true },
      { label: 'Replacing An ID Card', value: `Connecticut ${dollars(CT_ID_AGAIN.fee)} in ${CT_ID_AGAIN.days} days; New York ${dollars(NY_ID_AGAIN.fee)} in ${NY_ID_AGAIN.days}; California ${dollars(CA_ID_AGAIN.fee)} in ${CA_ID_AGAIN.days}` },
      { label: 'Replacing A License', value: `Connecticut ${dollars(CT_LICENSE.fee)} in ${CT_LICENSE.days} days; New York ${dollars(NY_LICENSE.fee)} in ${NY_LICENSE.days}, free when it was stolen and the police have your report; California ${dollars(CA_LICENSE.fee)} in ${CA_LICENSE.days}` },
      { label: 'A Police Report', value: 'Free, and filed at once' },
    ],
    reads: [
      { label: 'Your Citizenship', value: 'Which passport office you apply to, and its fee, days and term' },
      { label: 'Your Age', value: `A shorter passport where the office gives one to a young adult; a lower fee to replace an ID card in New York and California from ${NY_ID_AGAIN.seniorFrom ?? CA_ID_AGAIN.seniorFrom}` },
      { label: 'Where You Live', value: 'Which state’s ID card you can get, whether the police take a report online, and where a card is replaced' },
      { label: 'A Photo ID In Force', value: 'Read by a bank you don’t bank with yet, before it opens an account or takes your switch' },
    ],
    now: [
      'The fee leaves your bank, and a passport shows Being Decided with the day it’s ready.',
      'An ID card is in force at once, but in a US state one for someone not a citizen shows Being Decided until the DMV’s check is done.',
      'Reported lost or stolen, a paper is canceled for good, even if it turns up. A passport takes with it any visa or travel authorization issued on it, though the F-1 holds.',
      'A police report is kept on the lost paper’s record.',
      'Replace It cancels the lost card and puts a new one, with a new number, on its way.',
    ],
    later: [
      'A passport is issued on its day for its term, and the one it replaces is canceled then, with any travel authorization on it.',
      'A replacement card arrives on its day, in force from then. Until it comes, it can’t be shown as a photo ID.',
    ],
    interpret: [
      'Standing in a row reads In Force, Being Decided, Reported Lost, Canceled or Run Out.',
      // From 2026-10-16 (brief 09's journeys): until then a row run out said nothing past Run Out.
      'A license run out says beside it that nothing in SLATE renews a license since the cars went, and that a passport or an ID card in force is your photo ID; a passport or an ID card run out says to apply for a new one in its panel. A new bank asks for one in force.',
      'A passport’s own page counts the countries that would let you in on it for a week’s visit. That’s a reading: SLATE has no travel, so no border is crossed.',
      'A card’s own page says “It meets REAL ID.” on a US state ID card issued to a citizen, and “It’s marked Not For Federal Identification: it isn’t REAL ID.” on one issued to someone who isn’t, as Connecticut issues it; and “It meets REAL ID.” on a license you began with where it was drawn as one: at its state’s published share of REAL ID licenses, or, for a state with none published, the mean of the shares that are. With no flights in SLATE, no airport check reads it.',
      'Going Abroad lists what a country asks of your citizenship for a short visit, to read: visas and travel authorizations aren’t applied for here.',
      'In New Haven a police report is kept on the record and read by no other rule there; New York’s free replacement of a stolen license is the rule that reads one.',
    ],
    unavailable: [
      '“SLATE doesn’t have your country’s passport office yet.” or “An application is in already.”',
      'Apply Faster shows only where the office sells a faster service to you where you are: from abroad, where it sells none, the command says “… sells no faster service to an applicant abroad.”; where that service “is for renewals only”, it waits until you’ve held a passport from that office.',
      'Get, not a US citizen, with no passport in force and no OPT card: “The DMV asks for a primary identity document in force: your passport, with your I-94 and I-20. Apply for or renew it on Papers first.”',
      'Get: “You hold a license here. It serves as your ID.”, “You hold one in force.”, “One is on its way.”, or, living where SLATE issues no card, the list of places it does.',
      'Get, not a US citizen at a US state’s counter: “The DMV checks lawful presence through SAVE, and you stayed past your status.”; out of school on an F-1 with no OPT in force, “On an F-1, the DMV asks for your I-20 and proof you’re enrolled, and you’re not at school.”; or, with no Social Security number, “The DMV asks for your Social Security number, or the SSA’s letter that you can’t have one.”, then where you stand: at school, “You can, through work-study: apply for it on the Papers screen first.”; applied for, “Yours is on its way.”; out of school with none applied for, “SLATE issues the number only to an F-1 student at school, through work-study, and never the letter.”, so the card is out of reach.',
      'Report Lost… and Report Stolen… show only on a passport, a license, an international driving permit or an ID card in force. A visa, a permit or a travel authorization is a status the government holds, and losing its paper doesn’t end it.',
      'File A Police Report: “Lost property is reported at a station here.” or “A theft is reported at a station here.”, where the police take that kind of report only in person.',
      'Replace It, for an ID card: “It’s replaced where it was issued, for someone living there.”, or, run out or running out before a new card would come, “It ran out on …” or “It runs out on …, before a new card would come”, then “, and a replacement keeps its date, so it isn’t replaced.”',
      `Replace It, for a license from elsewhere: “Its issuer replaces it for somebody living there, and SLATE found no way it sends one out of state.”${NY_MAILS}`,
      'Replace It, for a license run out or running out before a new card would come: “It ran out on …” or “It runs out on …, before a new card would come”, then that a replacement keeps its date, and a license past its date is renewed, which SLATE has done for none since the cars went.',
      'Either way, where SLATE lacks the issuer’s fee: “SLATE doesn’t have what its issuer charges to replace it.”',
      'Any fee: “… is more than the bank can cover.”',
    ],
    mistakes: [
      'Reporting a paper lost by mistake: it can’t be undone, so the second press, Cancel It, is the one that counts. Keep It backs out.',
      'Replacing a stolen New York license before the police report: the free replacement reads the report, and once replaced, the lost license’s row offers no report. File it first.',
      'Letting your only photo ID lapse before switching banks: the new bank refuses until one is in force. A license from home runs out with no renewal in SLATE; the ID card where you live takes its place.',
      'Reporting your passport lost before getting the ID card, not a citizen: the DMV asks the passport as your identity document, so the card waits on a new one from your office, weeks from abroad.',
      'Asking Connecticut for an ID card on an F-1 before your Social Security number: the DMV asks for it, and SLATE issues the number only through work-study at school, so apply on Permission To Work while you’re registered. A graduate on OPT who never applied is turned away for good.',
    ],
    related: ['documents.work', 'documents.residence', 'bank.other-banks', 'papers.overview'],
    connections: [
      { to: 'bank.other-banks', kind: 'evaluation', why: 'A bank you don’t bank with yet reads your passport, license or ID card before it opens an account or takes your switch.' },
      { to: 'documents.work', kind: 'evaluation', why: 'The Social Security office asks for your passport in force before it takes an application.' },
      { to: 'documents.work', kind: 'prerequisite', why: 'On an F-1, Connecticut’s DMV asks your Social Security number before it issues an ID card.' },
      { to: 'documents.work', kind: 'prerequisite', why: 'Not a citizen, Connecticut’s DMV asks your passport in force, or OPT’s card, before it issues an ID card.' },
      { to: 'bank.accounts', kind: 'immediate', why: 'Each fee leaves your accounts when you apply or replace.' },
    ],
    example: {
      setup: `A US citizen in New Haven loses a wallet holding a Connecticut Non-Driver Identification Card.`,
      steps: ['In the card’s row, press Report Stolen…, then Cancel It.', 'Press File A Police Report: New Haven’s police take one online.', `Press Replace It, ${dollars(CT_ID_AGAIN.fee)}.`],
      result: `The old card is canceled, with the report kept on it. ${dollars(CT_ID_AGAIN.fee)} leaves the bank, and the new card, with a new number, arrives ${CT_ID_AGAIN.days} days later. Meanwhile a passport or a license in force is your photo ID; without one, a new bank would turn you away.`,
    },
  },
  {
    id: 'documents.work',
    title: 'Permission To Work',
    goal: 'papers',
    covers: ['documents.apply_opt', 'documents.apply_ssn'],
    synonyms: ['OPT', 'optional practical training', 'F-1 status', 'Social Security number', 'SSN', 'Social Security card', 'ITIN', 'work authorization', 'Form I-765', 'grace period', 'out of status', 'premium processing'],
    questions: ['How do I get a Social Security number?', 'Can I work after I graduate?', 'When can I apply for OPT?', 'What happens when my F-1 status ends?', 'Is premium processing worth it?'],
    where: on('work', 'Papers, Permission To Work, Social Security Number And OPT'),
    available: `From the guide’s chapter “${CHAPTER}”. It’s for a student on an F-1: a US citizen holds a Social Security number already, and OPT is the F-1’s.`,
    short: `For a student on an F-1, Permission To Work holds two applications of your own. A Social Security number, applied for in person at New Haven’s office, gets an IRS plan decided at once, opens some banks’ accounts online and Connecticut’s ID card, and spares a 1040-NR its ITIN wait. OPT, after the degree, keeps your US status past its ${STARTING.graceDays} days of grace; SLATE has no work after the degree, so it ends after ${OPT.unemploymentDays} days without work.`,
    steps: [
      'Open Papers and its Permission To Work tab. The Permission To Work panel shows Your Program Ends and Your US Status.',
      `Registered at school, with your passport in force, press Apply At The Social Security Office under Social Security Number. It takes ${SSN_VISIT} there.`,
      `From ${OPT.windowBeforeDays} days before the program ends to ${OPT.windowAfterDays} after, press Apply For OPT under OPT, or Apply With Premium Processing for a decision in ${OPT.premiumBusinessDays} business days.`,
      'When your status is ending and OPT can still be applied for, What Needs You asks too, with Apply For OPT and Apply For OPT, Premium Processing.',
    ],
    needs: [
      'A student on an F-1.',
      `For the number: registered for the program, since the School’s work-study is the on-campus work it needs; a passport in force; out of hospital, with ${SSN_VISIT} free.`,
      'For OPT: the degree completed or on its way, inside its window, and no OPT applied for before.',
      'OPT’s fee in your accounts.',
    ],
    costs: [
      { label: 'Time', value: `${SSN.visitMinutes} minutes at the Social Security office, which the clock moves through; OPT moves no clock`, estimate: true },
      { label: 'A Social Security Number', value: 'Free' },
      { label: 'OPT', value: `${dollars(OPT.fee)} filed online; premium processing ${dollars(OPT.premiumFee)} more` },
      { label: 'How Long', value: `The card in ${SSN.days} days; OPT decided in ${OPT.standardDays} days, or ${OPT.premiumBusinessDays} business days with premium processing, a weekend or a federal holiday not among them`, estimate: true },
    ],
    reads: [
      { label: 'Your Program’s End', value: 'May 31 of your class’s last year, or the day you left school without the degree' },
      { label: 'How School Ended', value: `The grace after the program: ${STATUS_GRACE_DAYS.f1} days with the degree, ${STATUS_GRACE_DAYS.withdrawn} after a withdrawal or a degree withheld, none after a dismissal. OPT follows a degree completed` },
      { label: 'Your Registration', value: 'The number needs on-campus work begun or starting within 30 days: registered, the School’s work-study is yours' },
      { label: 'Days Without Work', value: `Counted on OPT a week at a time; past ${OPT.unemploymentDays}, it ends` },
    ],
    now: [
      `Applying for the number moves the clock ${SSN_VISIT} and puts the card on its way, its date under Social Security Number.`,
      'Applying for OPT takes the fee and lists Employment Authorization, OPT, as Being Decided; the status question in What Needs You is answered.',
      'While OPT is being decided, your status holds, past its grace if need be.',
    ],
    later: [
      'The card arrives on its day. A bank that opens accounts online for someone with a number now can.',
      `OPT is approved on its day, for ${OPT.months} months from the later of the program’s end and the approval.`,
      `On OPT each week without work counts, and past ${OPT.unemploymentDays} days in all it ends, your status with it, with no grace after.`,
      'When permission has run out and only the grace is left, What Needs You says Your US Status Is Ending, with its date.',
      'Stay past it and you’re out of status: the F-1 is void, a marketplace plan ends with the month, Covered Connecticut and the DMV’s ID card are closed to you, and so is the Visa Waiver Program, for good.',
    ],
    interpret: [
      'Your US Status reads Held while you study or an application is decided, Ends with its date once school is over and nothing is being decided (on OPT, the day its days without work run out, with no grace after), or Out Of Status.',
      'An approved OPT reads In Force with its dates, and Canceled once its days without work ran out.',
      'SLATE keeps no Social Security number itself, only whether you hold one, so no number is shown.',
    ],
    unavailable: [
      'The number’s button shows only while you have no number and none on its way; a US citizen’s panel reads Held, as a US citizen.',
      '“On an F-1, the number needs on-campus work begun or starting within 30 days: register first, and the School’s work-study is yours.”, or once school is over, “On an F-1, the number needs on-campus work, which ends with the program.”',
      '“The office asks for your passport, in force.”, or another commitment in that hour.',
      `OPT: “It opens” on a date ${OPT.windowBeforeDays} days before the program ends, or “It closed” ${OPT.windowAfterDays} days after.`,
      '“OPT follows a degree completed, and you left without it.”',
      '“You’ve applied for OPT already.”, once, even after it ends; and for a US citizen, “OPT is for a student on an F-1; you’re a citizen.”',
    ],
    mistakes: [
      'Waiting for the card before working shifts: work-study pays without it, as the IRS lets an employer report the number as applied for.',
      'Leaving the number until after the degree: once school is over the office refuses it, and without it Connecticut’s DMV won’t issue you an ID card, even on OPT. One applied for in the program’s last weeks still comes.',
      `Counting on OPT’s ${OPT.months} months: with no work after the degree in SLATE, it ends after its days without work. What it buys here is those days in status, and with them the marketplace, and unemployment insurance where your wages qualify.`,
      `Paying for premium processing to keep your status: status holds while either kind is decided, so the ${dollars(OPT.premiumFee)} buys an earlier answer. Where that answer comes after the program’s end, it starts OPT sooner, and with no work its days run out sooner too.`,
    ],
    related: ['documents.passport-id', 'documents.residence', 'taxes.return', 'taxes.plan', 'papers.benefits', 'papers.health-cover', 'school.shifts'],
    connections: [
      { to: 'school.orientation', kind: 'prerequisite', why: 'The number needs registration for the program: once you’re registered, the School’s work-study is yours.' },
      { to: 'documents.passport-id', kind: 'prerequisite', why: 'The Social Security office asks for your passport in force.' },
      { to: 'taxes.return', kind: 'evaluation', why: `A 1040-NR filed without a number goes in with an ITIN application, holding its refund ${SSN.itinWeeks} weeks longer.` },
      { to: 'taxes.plan', kind: 'evaluation', why: `With a number the IRS decides a plan within the minute; without one, by mail in ${PLAN.mailDays} days.` },
      { to: 'bank.other-banks', kind: 'evaluation', why: 'Without a number, a bank that opens accounts for international students opens yours only in a branch.' },
      { to: 'papers.benefits', kind: 'evaluation', why: 'Unemployment insurance pays a noncitizen only with permission to work in the US, such as OPT in force.' },
      { to: 'papers.health-cover', kind: 'scheduled', why: 'Your status’s end is on the clock; out of status, a marketplace plan ends with the month.' },
    ],
    example: {
      setup: `An F-1 student of the class that began in 2026, whose program ends ${day(PROGRAM_END)}, with no work lined up.`,
      steps: [`On ${day(OPT_APPLIED)}, press Apply For OPT.`, 'Graduate, and stay in New Haven.'],
      result: `${dollars(OPT.fee)} leaves the bank. OPT is decided on ${day(OPT_DECIDED)} and runs from ${day(OPT_START)}; with no work, it ends on ${day(OPT_ENDS)}, past its ${OPT.unemploymentDays} days, and your status with it. Without it, your status would have ended on ${day(STATUS_WITHOUT)}.`,
    },
  },
  {
    id: 'documents.residence',
    title: 'Residence Abroad',
    goal: 'papers',
    covers: ['documents.residence', 'documents.settle', 'documents.renew_residence', 'documents.naturalize'],
    synonyms: ['residence permit', 'Mexican residence', 'Residente Temporal', 'Residente Permanente', 'naturalization', 'second citizenship', 'green card', 'Global Talent visa', 'settle abroad', 'live abroad'],
    questions: ['Can I live in another country?', 'How do I become a citizen of another country?', 'Why can’t I apply for a green card?', 'Why can’t I apply for Mexican residence?'],
    where: on('work', 'Papers, Permission To Work, Residence Abroad'),
    available: `From the guide’s chapter “${CHAPTER}”. A country you’re a citizen of, by birth or naturalized, leaves the list.`,
    short: 'Residence Abroad lists Canada, Ireland, Mexico, Britain and the United States, less your own country, with where you stand in each: what the country asks, and why SLATE grants none. Mexico’s temporary residence asks only savings or income, but living there went with moving on 2026-10-09, so nothing would read its card, and SLATE sells none of its papers. What an older save holds is kept: a card to its end, an application for citizenship to its decision.',
    steps: [
      'Open Papers, Permission To Work, and the Residence Abroad panel. Where You Stand says what each country asks, or what you hold there; Mexico’s Apply, and Renew on a card held, are grayed with why.',
      'Holding Britain’s Global Talent visa or a green card from an older save, press Settle or Naturalize where they show.',
    ],
    needs: [
      `There’s nothing to apply for: each country’s row says why there’s no route. Mexico’s rule, to read: savings of ${pesos(MX_SAVINGS)}, or an income of ${pesos(MX_INCOME)} a month over six months.`,
      'To settle or naturalize: residence held from an older save, without a break, for the years the country asks.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Mexico’s Fees', value: `${pesos(MX.temporary)} a year for the card and ${dollars(MX.consularVisaUsd)} for the consulate’s visa, ${pesos(MX.permanent)} for permanent residence and ${pesos(NATURALIZE.MX.fee)} to naturalize: said with its rule, and charged by nothing here` },
    ],
    reads: [
      { label: 'Residence Held', value: 'From its first grant, each one reaching the next with no more than a day between' },
      { label: 'A Career’s Record', value: 'What Britain’s Global Talent visa and a US green card were judged on; with the career gone, SLATE holds none' },
    ],
    now: [
      'Where You Stand gives each country’s answer, and nothing leaves your bank.',
      'Settle (Britain) or Naturalize, where an older save’s papers allow it: the fee leaves your bank, and Where You Stand gives what’s granted or the day citizenship is decided.',
    ],
    later: [
      'A citizenship applied for is decided on its day, beside the one you were born with, and its country leaves the list. You keep your birth country’s passport.',
      'A Mexican card an older save holds runs out at its end, and isn’t renewed.',
    ],
    interpret: [
      'Where You Stand gives each country’s answer in its own words: Canada’s paused program, Ireland’s need of an employer’s offer, the career’s record Britain and the US would read, and Mexico’s rule with why SLATE grants none.',
      'Residence held reads its name, and its end date where it has one.',
      'Mexico’s temporary residence would let you live there, not work, and a life in New Haven never draws on it.',
    ],
    unavailable: [
      `Mexico’s row: “${MEXICO_RULE} ${MEXICO_UNREAD}”`,
      `A Mexican card held: “${MEXICO_RENEWAL}”`,
      'Settle and Naturalize show only once they’re allowed; Mexico’s, past their four and five years, say why SLATE grants none.',
      'For Canada, Ireland, Britain and the United States, Where You Stand says why there’s no route.',
      'Any fee: “… is more than the bank can cover.”',
    ],
    mistakes: [
      'Saving toward Mexico’s savings test in the hope it opens something: it’s Mexico’s rule, said, and SLATE grants nothing on it.',
    ],
    related: ['documents.passport-id', 'documents.work', 'bank.accounts'],
    connections: [
      { to: 'bank.accounts', kind: 'immediate', why: 'Settling or naturalizing, where an older save’s papers allow it, takes its fee from your accounts at once.' },
      { to: 'documents.passport-id', kind: 'optional', why: 'A citizenship by naturalizing joins the one you were born with; the passport stays your birth country’s.' },
      { to: 'documents.work', kind: 'optional', why: 'Residence abroad and permission to work in the US are kept apart: OPT is the US’s route for a student.' },
    ],
    example: {
      setup: `A student from a wealthy family with ${pesos(MX_SAVINGS)}, about ${usd(MX_SAVINGS_USD)}, in the bank: Mexico’s savings test met.`,
      steps: ['Open Residence Abroad and read Mexico’s row.'],
      result: `Mexico’s row says its rule, savings of ${pesos(MX_SAVINGS)} or an income of ${pesos(MX_INCOME)} a month over six months, and that SLATE grants none, living there having gone with moving. Apply is grayed with those words, nothing leaves the bank, and a student short of the savings reads the same row.`,
    },
  },
];
