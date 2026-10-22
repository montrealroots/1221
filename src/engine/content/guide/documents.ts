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
 * (`OPT_WEEK_KIND`). From 2026-10-21 (brief 19's D8) a week's days of professional work come off its seven
 * (`daysWorkedIn`): until then Permission To Work said the game had no work after the degree, so OPT ended after its 90
 * days without work. A residence card's renewal in its last 30 days was the second until 2026-10-16, when Mexico's
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
 *
 * Corrected on 2026-10-17 with Connecticut's own pages (brief 11's KS-ct-idcard, `content/identity.ts`): until then it
 * said the card was good for six years, SLATE's term for the state's "up to seven", and in force at once for a citizen,
 * a non-citizen's coming on SAVE's day; the DMV gives seven years to a birthday and mails the card within twenty business
 * days, after SAVE's check for somebody not a citizen.
 *
 * Later on 2026-10-17 (brief 12's KS-ct-idcard and KS-passport-fees): until then the ID card's line called a non-citizen's
 * term "SLATE's reading where the state publishes none", and the passport's line didn't say where a fee from abroad was
 * SLATE's. Each now says it's SLATE's assumption, read from the one value that sets it (`NONCITIZEN_ID.toLawfulPresence`,
 * `NZ_FROM_ABROAD`), and what a later correction does: a card keeps its date, a fee paid stands. Japan's fee from abroad
 * was read that day in its own law, US$62, and stopped being SLATE's.
 *
 * On 2026-10-19 (brief 15) the entry stopped saying what a later correction of an assumption would do, which is the
 * game's upkeep and no step of the player's; the ID card's Now line, which said Being Decided until the card came, said
 * On Its Way for a card past every check, as the row has shown since 2026-10-17 (`idCardOnItsWay`).
 */

import { CHAPTER_FOR } from '../tutorial';
import { PASSPORTS } from '../passports';
import { NZ_FROM_ABROAD, PASSPORTS_ABROAD, US_RENEWAL } from '../passportsabroad';
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
const JP_ABROAD = PASSPORTS_ABROAD['JP']!;
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
    available: `From the guide’s chapter “${CHAPTER}”. File A Police Report opens with “${PAPERS_CHAPTER}”.`,
    short: 'Your passport and your state ID card prove who you are. A bank you don’t bank with yet asks to see one of them in force before it opens an account, and the Social Security office asks for your passport, as the DMV does if you’re not a US citizen.\n\nOn Passport And ID you apply for or renew each one, report a lost or stolen paper, and replace a license or an ID card. Applying isn’t holding: a paper counts only once it’s issued and arrives.',
    steps: [
      'Open Papers, then the Passport And ID tab. Your Passport shows the one in force, A New One with its fee and wait, and Faster where the office offers it.',
      'Press Apply For One, or Renew It if you hold one. Apply Faster or Renew It Faster pays for the quicker service.',
      'Under Your ID, press Get and the card’s name, such as Get Non-Driver Identification Card.',
      'If a passport, license, international driving permit or ID card in force is lost, press Report Lost… or Report Stolen… in its row, then Cancel It to confirm, or Keep It to back out.',
      'In the same row, press File A Police Report where the police take one online, and Replace It for a license or an ID card.',
      'Press a paper’s name, number or status to open it: who issued it, when it runs out, and what it lets you do today.',
    ],
    needs: [
      'A passport office for your citizenship that the game has, and no application already in.',
      'For the ID card: living where the game issues one (New York, Connecticut, California, Ontario, British Columbia, Mexico City or Ireland), with no license from there in force and no card held or on its way.',
      'If you’re not a US citizen, at a US state’s counter: being in status; being at school on an F-1, or, once school is over, holding a US permit in force such as OPT; a primary identity document in force (your passport, or OPT’s card instead); and a Social Security number, which the game issues only through work-study at school.',
      'To replace a card: report it lost first, and live where it was issued (though New York mails a license out of state).',
      'Enough in your bank for the fee.',
    ],
    costs: [
      { label: 'Time', value: 'None: applying, reporting and replacing don’t move the clock' },
      { label: 'A US Passport', value: `${dollars(US.fee)} the first time or after one is lost, ready in up to ${US.days} days, good for ${US.validityYears} years. Renewed by mail on Form ${US_RENEWAL.form}, it’s ${dollars(US_RENEWAL.fee)}, if your most recent passport was issued within ${US_RENEWAL.withinYears} years, at ${US_RENEWAL.issuedFromAge} or older, and never reported lost. ${dollars(US_FASTER.extra)} more gets it in ${US_FASTER.days} days`, estimate: US.daysEstimated },
      { label: 'Another Country’s Passport', value: `Applied for from New Haven, so from abroad: its office’s fee and time for an applicant outside the country, where the game has them, such as the UK’s ${inOwn(UK_ABROAD.fee, UK_ABROAD.currency)} online, Australia’s ${inOwn(AU_ABROAD.fee, AU_ABROAD.currency)} with its overseas surcharge, and Japan’s ${inOwn(JP_ABROAD.fee, JP_ABROAD.currency)} at a consulate in the US. Its faster service is offered only where it’s sold abroad, which the UK’s Fast Track isn’t. Where an office’s own figure couldn’t be read, the fine print says what the game assumes: New Zealand’s GST (${NZ_FROM_ABROAD.gstCharged ? 'charged' : 'not charged'}), and its urgent fee from overseas, taken as its standard fee`, estimate: true },
      { label: 'Connecticut’s ID Card', value: `${dollars(CT_ID.fee)}, good for ${CT_ID.years} years, to your first birthday at least ${CT_ID.years} years on. It’s mailed, and comes ${CT_ID.mailedBusinessDays} business days after you apply, not counting weekends and federal holidays. If you’re not a citizen, the DMV’s SAVE check comes first, ${NONCITIZEN_ID.saveBusinessDays} federal workdays, and ${NONCITIZEN_ID.toLawfulPresence ? `the card runs to your program’s end while you’re at school, or on OPT to the end printed on it, ${OPT.months} months from its start. That term is assumed, because the state publishes no term for a card it doesn’t verify. If OPT is canceled for its days without work, the card stays in force to that printed end` : 'the card runs its full term to a birthday, as anyone’s does. That term is assumed, because the state publishes no term for a card it doesn’t verify'}`, estimate: true },
      { label: 'Replacing An ID Card', value: `Connecticut ${dollars(CT_ID_AGAIN.fee)} in ${CT_ID_AGAIN.days} days; New York ${dollars(NY_ID_AGAIN.fee)} in ${NY_ID_AGAIN.days}; California ${dollars(CA_ID_AGAIN.fee)} in ${CA_ID_AGAIN.days}` },
      { label: 'Replacing A License', value: `Connecticut ${dollars(CT_LICENSE.fee)} in ${CT_LICENSE.days} days; New York ${dollars(NY_LICENSE.fee)} in ${NY_LICENSE.days}, free if it was stolen and the police have your report; California ${dollars(CA_LICENSE.fee)} in ${CA_LICENSE.days}` },
      { label: 'A Police Report', value: 'Free, and filed at once' },
    ],
    reads: [
      { label: 'Your Citizenship', value: 'Which passport office you apply to, and its fee, wait and term' },
      { label: 'Your Age', value: `A shorter passport where the office gives one to a young adult; a lower fee to replace an ID card in New York and California from ${NY_ID_AGAIN.seniorFrom ?? CA_ID_AGAIN.seniorFrom}` },
      { label: 'Where You Live', value: 'Which state’s ID card you can get, whether the police take a report online, and where a card is replaced' },
      { label: 'A Photo ID In Force', value: 'A bank you don’t bank with yet checks it before it opens an account or takes your switch' },
    ],
    now: [
      'The fee leaves your bank, and a passport you’ve applied for shows Being Decided with the day it should be ready. You don’t hold it yet.',
      `Connecticut’s ID card shows On Its Way until it comes by mail, ${CT_ID.mailedBusinessDays} business days later. If you’re not a citizen, it shows Being Decided first, during the DMV’s SAVE check. Until it comes, you can’t show it as a photo ID.`,
      'Reported lost or stolen, a paper is canceled for good, even if it turns up. A passport takes with it any visa or travel authorization issued on it, though an F-1 status continues.',
      'A police report is kept on the lost paper’s record.',
      'Replace It cancels the lost card and puts a new one, with a new number, on its way.',
    ],
    later: [
      'A passport is issued on its day for its term, and the one it replaces is canceled then, along with any travel authorization on it.',
      'A new or replacement card arrives on its day, and you can use it from then. Until it comes, you can’t show it as a photo ID.',
    ],
    interpret: [
      'Status in a row reads In Force, Being Decided, On Its Way (an ID card past every check, in the mail), Reported Lost, Canceled or Run Out.',
      // From 2026-10-16 (brief 09's journeys): until then a row run out said nothing past Run Out.
      'A license that has run out says beside it that you can’t renew a driving license in the game, and to use a passport or ID card in force as your photo ID. A passport or ID card that has run out says to apply for a new one in its panel. A new bank asks for one in force.',
      'A passport’s own page counts the countries that would let you in on it for a week’s visit. That’s for reference only: travel isn’t part of the game, so you never cross a border.',
      'A card’s own page says “It meets REAL ID.” on a US state ID card issued to a citizen, and “It’s marked Not For Federal Identification: it isn’t REAL ID.” on one issued to someone who isn’t, as Connecticut issues it. A license you began with says “It meets REAL ID.” if it was drawn as one: at its state’s published share of REAL ID licenses, or, for a state with none published, the average of the shares that are. There are no flights in the game, so no airport check reads it.',
      'Going Abroad lists what each country asks of a short-stay visitor with your citizenship, for reference. You can’t apply for visas or travel authorizations here.',
      'In New Haven a police report is kept on the record, and nothing else there reads it. New York’s free replacement of a stolen license is the rule that reads one.',
    ],
    next: [
      'If you’re not a US citizen and want a state ID card, get your Social Security number first: see Permission To Work.',
      'Keep at least one photo ID in force before you open an account at a new bank.',
    ],
    unavailable: [
      '“Your country’s passport office isn’t in the game.” or “You’ve already applied, and it’s being decided.”',
      'Apply Faster shows only where the office offers a faster service to you where you are. From abroad, where it offers none, the refusal says “… offers no faster service to applicants abroad.” Where that service “is for renewals only”, it waits until you’ve held a passport from that office.',
      'Get, if you’re not a US citizen and have no passport in force and no OPT card: “The DMV asks for a primary identity document in force: your passport, with your I-94 and I-20. Apply for a passport or renew it under Your Passport first.”',
      'Get: “You hold a driving license from here, and it already serves as your ID.”, “You already hold one in force.”, “One is already on its way.”, or, if you live where the game issues no card, the list of places it does.',
      'Get, if you’re not a US citizen, at a US state’s counter: “The DMV checks lawful presence through SAVE, and you’re out of status, so it won’t issue you a card.” Out of school on an F-1 with no OPT in force: “On an F-1, the DMV asks for your I-20 and proof that you’re enrolled, and you’re not at school.” With no Social Security number: “The DMV asks for your Social Security number, or the SSA’s letter that you can’t have one.”, followed by where you stand. At school: “You can get one through work-study: apply for it first, under Social Security Number on Papers.” Applied for: “Yours is on its way.” Out of school with none applied for: “In the game, the number goes only to an F-1 student at school, through work-study, and the letter is never issued.”, so the card is out of reach.',
      'Report Lost… and Report Stolen… show only on a passport, a license, an international driving permit or an ID card in force. A visa, a permit or a travel authorization is a status the government holds, and losing its paper doesn’t end it.',
      'File A Police Report: “Here lost property is reported in person at a police station, not online.” or “Here a theft is reported in person at a police station, not online.”',
      'Replace It, for an ID card: “It’s replaced only where it was issued, for someone living there.” If it has run out, or runs out before a new card would come: “It ran out on …” or “It runs out on …, before a new card would come”, then “, and a replacement keeps the same date, so it can’t be replaced. Apply for a new card instead, if you can.”',
      `Replace It, for a license from elsewhere: “Its issuer replaces it only for someone living there, and no way to send one out of state was found.”${NY_MAILS}`,
      'Replace It, for a license that has run out or runs out before a new card would come: “It ran out on …” or “It runs out on …, before a new card would come”, then that a replacement keeps the same date, and a license past its date has to be renewed instead, which the game doesn’t offer.',
      'Either way, where the game doesn’t have the issuer’s fee: “What its issuer charges to replace it isn’t in the game.”',
      'Any fee: “Your bank can’t cover …, so nothing was charged.”',
    ],
    mistakes: [
      'Reporting a paper lost by mistake: it can’t be undone, so the second press, Cancel It, is the one that counts. Keep It backs out.',
      'Replacing a stolen New York license before filing the police report: the free replacement reads the report, and once it’s replaced, the lost license’s row offers no report. File it first.',
      'Letting your only photo ID lapse before switching banks: the new bank refuses until one is in force. A license from home runs out and can’t be renewed in the game, so get the ID card where you live instead.',
      'Reporting your passport lost before getting the ID card when you’re not a citizen: the DMV asks for your passport as your identity document, so the card waits on a new passport from your office, which takes weeks from abroad.',
      'Asking Connecticut for an ID card on an F-1 before you have your Social Security number: the DMV asks for it, and the game issues the number only through work-study at school, so apply under Permission To Work while you’re registered. A graduate on OPT who never applied is turned away for good.',
    ],
    related: ['documents.work', 'documents.residence', 'bank.other-banks', 'papers.overview'],
    connections: [
      { to: 'bank.other-banks', kind: 'evaluation', why: 'A bank you don’t bank with yet checks your passport, license or ID card before it opens an account or takes your switch.' },
      { to: 'documents.work', kind: 'evaluation', why: 'The Social Security office asks for your passport in force before it takes an application.' },
      { to: 'documents.work', kind: 'prerequisite', why: 'On an F-1, Connecticut’s DMV asks for your Social Security number before it issues an ID card.' },
      { to: 'documents.work', kind: 'prerequisite', why: 'If you’re not a citizen, Connecticut’s DMV asks for your passport in force, or OPT’s card, before it issues an ID card.' },
      { to: 'bank.accounts', kind: 'immediate', why: 'Each fee leaves your accounts when you apply or replace.' },
    ],
    example: {
      setup: `A US citizen in New Haven loses a wallet holding a Connecticut Non-Driver Identification Card.`,
      steps: ['In the card’s row, press Report Stolen…, then Cancel It.', 'Press File A Police Report: New Haven’s police take one online.', `Press Replace It, ${dollars(CT_ID_AGAIN.fee)}.`],
      result: `The old card is canceled, with the report kept on it. ${dollars(CT_ID_AGAIN.fee)} leaves the bank, and the new card, with a new number, arrives ${CT_ID_AGAIN.days} days later. Until then, a passport or a license in force is your photo ID. Without one, a new bank would turn you away.`,
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
    available: `From the guide’s chapter “${CHAPTER}”. It’s for a student on an F-1: a US citizen already has a Social Security number, and OPT is only for F-1 students.`,
    short: `On an F-1, you make two applications here. The first, while you’re registered for your program, is a Social Security number, which you apply for in person at New Haven’s office: with it, the IRS decides a payment plan at once, some banks open your account online, Connecticut’s DMV can issue you an ID card, and a 1040-NR doesn’t wait on an ITIN.\n\nThe second, after your degree, is OPT, which lets you work in your field and keeps your US status going past its ${STARTING.graceDays}-day grace period. Each day of professional work you’re booked for counts as a day worked, and OPT ends once you’ve had more than ${OPT.unemploymentDays} days without work in total.`,
    steps: [
      'Open Papers, then the Permission To Work tab. The Permission To Work panel shows Your Program Ends and Your US Status.',
      `Once you’re registered at the School and have your passport in force, press Apply At The Social Security Office under Social Security Number. It takes ${SSN_VISIT} there.`,
      `From ${OPT.windowBeforeDays} days before your program ends to ${OPT.windowAfterDays} days after, press Apply For OPT under OPT, or Apply With Premium Processing for a decision within ${OPT.premiumBusinessDays} business days.`,
      'When your status is ending and you can still apply for OPT, What Needs You asks too, with Apply For OPT and Apply For OPT, Premium Processing.',
    ],
    needs: [
      'Being a student on an F-1.',
      `For the number: being registered for your program, since the School’s work-study is the on-campus work it needs; a passport in force; and ${SSN_VISIT} free, out of hospital.`,
      'For OPT: your degree completed or on its way, applying inside its window, and no OPT applied for before.',
      'OPT’s fee in your accounts.',
    ],
    costs: [
      { label: 'Time', value: `${SSN.visitMinutes} minutes at the Social Security office, and the clock moves on by that much. Applying for OPT doesn’t move the clock`, estimate: true },
      { label: 'A Social Security Number', value: 'Free' },
      { label: 'OPT', value: `${dollars(OPT.fee)} filed online; premium processing costs ${dollars(OPT.premiumFee)} more` },
      { label: 'How Long', value: `The card comes in ${SSN.days} days. OPT is decided in ${OPT.standardDays} days, or within ${OPT.premiumBusinessDays} business days with premium processing, not counting weekends and federal holidays`, estimate: true },
    ],
    // From 2026-10-17 How School Ended says what becomes of an application decided after school ends without the degree:
    // until then one was approved whatever came of the degree (found by brief 13's journeys).
    reads: [
      { label: 'Your Program’s End', value: 'May 31 of your class’s last year, or the day you left school without the degree' },
      { label: 'How School Ended', value: `The grace period after your program: ${STATUS_GRACE_DAYS.f1} days with the degree, ${STATUS_GRACE_DAYS.withdrawn} after a withdrawal or a degree withheld, and none after a dismissal. OPT follows a completed degree: if you applied while the degree was on its way and school ends without it, OPT is denied when it’s decided, and the fee isn’t refunded` },
      { label: 'Your Registration', value: 'The number needs on-campus work that has started or starts within 30 days. Once you’re registered, the School’s work-study counts' },
      { label: 'Days Without Work', value: `Counted on OPT a week at a time: each week’s seven, less the days of professional work you were booked for. After ${OPT.unemploymentDays}, OPT ends` },
    ],
    now: [
      `Applying for the number moves the clock ${SSN_VISIT} and puts the card on its way, with its date under Social Security Number.`,
      'Applying for OPT takes the fee and lists Employment Authorization, OPT, as Being Decided. You don’t hold it until it’s approved. The status item in What Needs You is answered.',
      'While OPT is being decided, your status holds, past its grace period if need be.',
    ],
    later: [
      'The card arrives on its day. A bank that opens accounts online for people with a number can now open one for you.',
      `If OPT is approved, it runs for ${OPT.months} months from the later of your program’s end and the approval.`,
      `On OPT, each week’s days without work count, and the days of an engagement count as days worked. After ${OPT.unemploymentDays} days without work in total, OPT ends, and your status with it, with no grace period.`,
      'When your permission has run out and only the grace period is left, What Needs You says Your US Status Is Ending, with its date.',
      'If you stay past it, you’re out of status. In the game, that cancels your F-1 visa, ends a marketplace plan at the end of the month, closes Covered Connecticut and the DMV’s ID card to you, and closes the Visa Waiver Program to you from then on.',
    ],
    interpret: [
      'Your US Status reads Held while you study or an application is being decided; Ends with its date once school is over and nothing is being decided (on OPT, the day its days without work run out, with no grace period after); or Out Of Status.',
      'An approved OPT reads Approved until its first day, the later of your program’s end and the approval, then In Force with its dates, and Canceled once its days without work have run out.',
      'The game keeps no actual Social Security number, only whether you hold one, so no number is shown.',
    ],
    next: [
      'Once the card comes, a new bank can open an account for you online, and Connecticut’s DMV can issue you an ID card: see Passport And ID.',
      'Near your program’s end, apply for OPT inside its window if you want your status to last past the grace period.',
    ],
    unavailable: [
      'The number’s button shows only while you have no number and none on its way. A US citizen’s panel reads Held, as a US citizen.',
      '“On an F-1, you can get a number only with on-campus work that has started or starts within 30 days. Register at the School first: once you’re registered, the School’s work-study counts.”, or once school is over, “On an F-1, you can get a number only with on-campus work, and yours ended with your program.”',
      '“The office asks for your passport, and you don’t have one in force.”, or another commitment in that hour.',
      `OPT: “You can apply from …”, a date ${OPT.windowBeforeDays} days before your program ends, or “The time to apply closed on …”, ${OPT.windowAfterDays} days after.`,
      '“OPT follows a completed degree, and you left without one.”',
      '“You’ve already applied for OPT.”, once, even after it ends; and for a US citizen, “OPT is for a student on an F-1, and you’re a US citizen.”',
    ],
    mistakes: [
      'Waiting for the card before working shifts: work-study pays without it, because the IRS lets an employer report the number as applied for.',
      'Leaving the number until after your degree: once school is over the office refuses it, and without it Connecticut’s DMV won’t issue you an ID card, even on OPT. One applied for in your program’s last weeks still comes.',
      `Counting on OPT’s ${OPT.months} months without booking work: it ends once its days without work pass ${OPT.unemploymentDays}, months before its end date. Each day of an engagement counts as a day worked, so work keeps it, and your status, going.`,
      `Paying for premium processing to keep your status: your status holds while either kind is being decided, so the ${dollars(OPT.premiumFee)} only buys an earlier answer. If that answer comes after your program’s end, OPT starts sooner, and with no work its days run out sooner too.`,
    ],
    related: ['documents.passport-id', 'documents.residence', 'taxes.return', 'taxes.plan', 'papers.benefits', 'papers.health-cover', 'school.shifts'],
    connections: [
      { to: 'school.orientation', kind: 'prerequisite', why: 'You need to be registered for your program to get the number: once you are, the School’s work-study counts as your on-campus work.' },
      { to: 'documents.passport-id', kind: 'prerequisite', why: 'The Social Security office asks for your passport in force.' },
      { to: 'taxes.return', kind: 'evaluation', why: `A 1040-NR filed without a number goes in with an ITIN application, which holds up its refund ${SSN.itinWeeks === 7 ? 'seven' : SSN.itinWeeks} weeks longer.` },
      { to: 'taxes.plan', kind: 'evaluation', why: `With a number, the IRS decides a plan within a minute. Without one, it’s by mail in ${PLAN.mailDays} days.` },
      { to: 'bank.other-banks', kind: 'evaluation', why: 'Without a number, a bank that opens accounts for international students opens yours only in a branch.' },
      { to: 'papers.benefits', kind: 'evaluation', why: 'Unemployment insurance pays a noncitizen only with permission to work in the US, such as OPT in force.' },
      { to: 'papers.health-cover', kind: 'scheduled', why: 'Your status ends on a set day. Once you’re out of status, a marketplace plan ends at the end of the month.' },
    ],
    example: {
      setup: `An F-1 student in the class that began in 2026, whose program ends ${day(PROGRAM_END)}, with no work lined up.`,
      steps: [`On ${day(OPT_APPLIED)}, press Apply For OPT.`, 'Graduate, and stay in New Haven.'],
      result: `${dollars(OPT.fee)} leaves the bank. OPT is decided on ${day(OPT_DECIDED)} and runs from ${day(OPT_START)}. With no work, it ends on ${day(OPT_ENDS)}, past its ${OPT.unemploymentDays} days, and your status ends with it. Without OPT, your status would have ended on ${day(STATUS_WITHOUT)}.`,
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
    short: 'Residence Abroad lists Canada, Ireland, Mexico, Britain and the United States, apart from your own country, with your status in each: what the country asks, and why the game grants none of it. Mexico’s temporary residence asks only for savings or income, but moving abroad isn’t part of the game, so none of Mexico’s papers are granted. What an older save holds is kept: a card to its end, and an application for citizenship to its decision.',
    steps: [
      'Open Papers, then Permission To Work, and find the Residence Abroad panel. Your Status There says what each country asks, or what you hold there. Mexico’s Apply, and Renew on a card held, are grayed out with the reason.',
      'If an older save holds Britain’s Global Talent visa or a green card, press Settle or Naturalize where they show.',
    ],
    needs: [
      `There’s nothing to apply for: each country’s row says why there’s no route. For reference, Mexico’s rule asks for savings of ${pesos(MX_SAVINGS)}, or an income of ${pesos(MX_INCOME)} a month over six months.`,
      'To settle or naturalize: residence held from an older save, without a break, for the years the country asks.',
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Mexico’s Fees', value: `${pesos(MX.temporary)} a year for the card and ${dollars(MX.consularVisaUsd)} for the consulate’s visa, ${pesos(MX.permanent)} for permanent residence and ${pesos(NATURALIZE.MX.fee)} to naturalize. These are shown with its rule, and nothing here charges them` },
    ],
    reads: [
      { label: 'Residence Held', value: 'Counted from its first grant, each grant reaching the next with no more than a day between' },
      { label: 'A Record Of Professional Work', value: 'What Britain’s Global Talent visa and a US green card are judged on. The game keeps your professional credits but doesn’t weigh them as distinction, so neither route opens' },
    ],
    now: [
      'Your Status There gives each country’s answer, and nothing leaves your bank.',
      'Settle (Britain) or Naturalize, where an older save’s papers allow it: the fee leaves your bank, and Your Status There shows what’s granted, or the day citizenship is decided.',
    ],
    later: [
      'A citizenship you’ve applied for is decided on its day. It joins the one you were born with, and its country leaves the list. You keep your birth country’s passport.',
      'A Mexican card an older save holds runs out at its end, and isn’t renewed.',
    ],
    interpret: [
      'Your Status There gives each country’s answer in its own words: Canada’s paused program, Ireland’s need for an employer’s offer, the professional record Britain and the US would judge, and Mexico’s rule with why the game grants none.',
      'Residence you hold shows its name, and its end date if it has one.',
      'Mexico’s temporary residence would let you live there, but not work, and a life in New Haven never uses it.',
    ],
    next: [],
    unavailable: [
      `Mexico’s row: “${MEXICO_RULE} ${MEXICO_UNREAD}”`,
      `A Mexican card held: “${MEXICO_RENEWAL}”`,
      'Settle and Naturalize show only once they’re allowed. Mexico’s, after their four and five years, say why the game grants none.',
      'For Canada, Ireland, Britain and the United States, Your Status There says why there’s no route.',
      'Any fee: “Your bank can’t cover …, so nothing was charged.”',
    ],
    mistakes: [
      'Saving toward Mexico’s savings test in the hope it opens something: it’s Mexico’s rule, shown for reference, and the game grants nothing on it.',
    ],
    related: ['documents.passport-id', 'documents.work', 'bank.accounts'],
    connections: [
      { to: 'bank.accounts', kind: 'immediate', why: 'Settling or naturalizing, where an older save’s papers allow it, takes its fee from your accounts at once.' },
      { to: 'documents.passport-id', kind: 'optional', why: 'A citizenship by naturalizing joins the one you were born with, and your passport stays your birth country’s.' },
      { to: 'documents.work', kind: 'optional', why: 'Residence abroad and permission to work in the US are separate: OPT is the US route for a student.' },
    ],
    example: {
      setup: `A student from a wealthy family with ${pesos(MX_SAVINGS)}, about ${usd(MX_SAVINGS_USD)}, in the bank, which meets Mexico’s savings test.`,
      steps: ['Open Residence Abroad and read Mexico’s row.'],
      result: `Mexico’s row gives its rule, savings of ${pesos(MX_SAVINGS)} or an income of ${pesos(MX_INCOME)} a month over six months, and says the game grants none of its papers, because moving abroad isn’t part of the game. Apply is grayed out with those words, nothing leaves the bank, and a student without the savings sees the same row.`,
    },
  },
];
