/**
 * The entry rules' notes in the player's words (from 2026-10-19, the owner's brief 15).
 *
 * Papers' Going Abroad shows a citizen's entry rule as fine print (`ui/papers/Documents.tsx`): the note, then its
 * source. `tools/build-entry.mjs` takes each note from the research (`docs/research/world/research-entry.json`), which
 * keeps the researcher's shorthand: semicolon lists, agencies by their initials, "see uncertain" (a list no screen
 * shows), British spellings. Each note here is the same rule said as sentences, every figure, date, program and
 * document kept, with an agency named in full where its initials stood. The research keeps its own words.
 *
 * Keyed by the note as `build-entry.mjs` leaves it, after its contractions and spellings, so that regenerating the
 * file and running this gives the same words as today.
 *
 *   node tools/entry-notes.mjs            lists the notes in src/engine/content/entry.ts this would change; exits 1 if any
 *   node tools/entry-notes.mjs --write    rewrites them in place
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'src/engine/content/entry.ts';
const SCHENGEN = 'Under Regulation (EU) 2018/1806, Annex II: up to 90 days in any 180-day period across the whole Schengen area. Since October 12, 2025, visitors register their fingerprints and a photo in the Entry/Exit System (EES) at the external border, fully running from April 10, 2026. ETIAS will be required once it launches. It wasn’t live on September 29, 2026.';

/** The research's note, as the generator leaves it, and the player's. */
export const PLAIN = {
  'Canadian citizens are visa-exempt and don’t use ESTA; admitted by CBP, usually for up to 6 months (CBP discretion, no fixed window).':
    'Canadian citizens need no visa and don’t use ESTA. US Customs and Border Protection usually admits them for up to 6 months, at the officer’s discretion.',
  'Mexico isn’t in the Visa Waiver Program. B-1/B-2 admission period set by CBP at entry, commonly up to 6 months.':
    'Mexico isn’t in the Visa Waiver Program. US Customs and Border Protection sets how long a B-1/B-2 visitor may stay at entry, commonly up to 6 months.',
  'Brazil isn’t in the Visa Waiver Program. Admission period set by CBP at entry, commonly up to 6 months.':
    'Brazil isn’t in the Visa Waiver Program. US Customs and Border Protection sets how long a visitor may stay at entry, commonly up to 6 months.',
  'Visa Waiver Program: 90 days per admission, not extendable; no fixed rolling window, but CBP scrutinises frequent or long cumulative stays. Requires an e-passport.':
    'Under the Visa Waiver Program: up to 90 days each visit, with no extension. There’s no fixed limit over a year, but border officers look closely at frequent or long stays. You need an e-passport.',
  'Common Travel Area: Irish citizens need no ETA or visa and may live and work in the UK.':
    'Under the Common Travel Area, Irish citizens need no ETA or visa, and may live and work in the UK.',
  'Visitor (up to 6 months per visit); ETA required for travel on or after January 8, 2025 (Appendix ETA National List section (c)); enforced with carrier checks from February 25, 2026.':
    'A visitor may stay up to 6 months each visit. An ETA has been required for travel since January 8, 2025 (Appendix ETA National List, section (c)), and airlines and other carriers have checked for one since February 25, 2026.',
  'Visitor (up to 6 months per visit); European nationals have needed an ETA for travel on or after April 2, 2025 (Appendix ETA National List section (d)); applications opened March 5, 2025.':
    'A visitor may stay up to 6 months each visit. European nationals have needed an ETA for travel since April 2, 2025 (Appendix ETA National List, section (d)). Applications opened on March 5, 2025.',
  'US citizens need neither visa nor eTA; carry a valid US passport. Visitors normally admitted for up to 6 months (officer discretion).':
    'US citizens need neither a visa nor an eTA, only a valid US passport. Visitors are normally admitted for up to 6 months, at the officer’s discretion.',
  'Since February 29, 2024 Mexican citizens need a visitor visa, unless flying on a Mexican passport and holding a valid US nonimmigrant visa or having held a Canadian visa in the past 10 years, in which case an eTA suffices (air only; land and sea arrivals always need a visa).':
    'Since February 29, 2024, Mexican citizens need a visitor visa. An eTA is enough instead for someone flying in on a Mexican passport who holds a valid US nonimmigrant visa, or has held a Canadian visa in the past 10 years. Arriving by land or sea always needs a visa.',
  'Brazil is visa-required, but Brazilians flying in who hold a valid US nonimmigrant visa or held a Canadian visa in the past 10 years may use an eTA instead (air only).':
    'Brazilians need a visa, but those flying in who hold a valid US nonimmigrant visa, or have held a Canadian visa in the past 10 years, can use an eTA instead. That’s by air only.',
  'ETA required when flying to or transiting a Canadian airport (not needed by land or sea). Visitors normally admitted for up to 6 months (officer discretion).':
    'An eTA is required to fly to or through a Canadian airport, but not to arrive by land or sea. Visitors are normally admitted for up to 6 months, at the officer’s discretion.',
  'Common Travel Area: British citizens need no visa or permission and may live and work in Ireland.':
    'Under the Common Travel Area, British citizens need no visa or permission, and may live and work in Ireland.',
  'EU/EEA free movement (Ireland is outside Schengen, so passport or ID checks still apply at the border).':
    'Free movement within the EU and EEA. Ireland is outside the Schengen area, so there are still passport or ID checks at the border.',
  'Permission to land for up to 90 days granted by an immigration officer at the border. Ireland isn’t in Schengen, so this is separate from the Schengen 90/180 count. No electronic travel authorisation scheme is in force.':
    'An immigration officer at the border grants permission to land for up to 90 days. Ireland isn’t in the Schengen area, so this doesn’t count toward Schengen’s 90 days in 180. There’s no electronic travel authorization scheme in force.',
  'Under Regulation (EU) 2018/1806 Annex II: 90 days in any 180-day period across the whole Schengen area. Biometric EES registration at the external border since October 12, 2025 (fully operational April 10, 2026). ETIAS will be required once it launches (not live on September 29, 2026).':
    SCHENGEN,
  'Under Regulation (EU) 2018/1806 Annex II: 90 days in any 180-day period across the whole Schengen area. Biometric EES registration at the external border since October 12, 2025 (fully operational April 10, 2026). ETIAS will be required once it launches (not live on September 29, 2026). UK nationals have been third-country nationals since January 1, 2021.':
    `${SCHENGEN} UK nationals have been treated as non-EU nationals since January 1, 2021.`,
  'EU/EEA free movement (Ireland is in the EU but outside Schengen; ID or passport checks at the Schengen external border).':
    'Free movement within the EU and EEA. Ireland is in the EU but outside the Schengen area, so there are ID or passport checks at the Schengen border.',
  'EU/EEA free movement.':
    'Free movement within the EU and EEA.',
  'Visa exemption for short-term stay up to 90 days. No pre-travel authorisation in force (JESTA planned, see uncertain).':
    'No visa is needed for a short stay of up to 90 days. There’s no travel authorization to apply for yet: Japan plans one, JESTA, but when it starts wasn’t confirmed.',
  'Visa exemption up to 90 days; per MOFA\'s footnote, nationals of this country may apply at a regional immigration office to extend to up to 6 months in total (see uncertain).':
    'No visa is needed for up to 90 days. A footnote from Japan’s foreign ministry says citizens of this country can apply at a regional immigration office to extend the stay to 6 months in all, though this wasn’t confirmed.',
  'Visa waiver for Brazilian holders of ICAO-compliant e-passports since September 30, 2023, originally for 3 years (to September 29, 2026); extended by an exchange of notes in July 2026 to September 29, 2029. Holders of non-chip passports need a visa.':
    'Since September 30, 2023, Brazilians with an e-passport to the international (ICAO) standard need no visa. The waiver first ran for 3 years, to September 29, 2026, and an exchange of notes in July 2026 extended it to September 29, 2029. A passport without a chip still needs a visa.',
  '90 days. Temporarily exempt from K-ETA until December 31, 2026 (one of 22 countries and regions in the exemption); K-ETA is required again from January 1, 2027 unless extended. Voluntary K-ETA application still possible (fee charged).':
    'Up to 90 days. This country is one of 22 countries and regions that don’t need a K-ETA until December 31, 2026, and a K-ETA is required again from January 1, 2027, unless that’s extended. You can still apply for one, for a fee.',
  'Up to 6 months under the Korea-Canada arrangement. Temporarily exempt from K-ETA until December 31, 2026.':
    'Up to 6 months, under an arrangement between Korea and Canada. A K-ETA isn’t needed until December 31, 2026.',
  '90 days but not among the 22 temporarily exempt countries, so K-ETA is required before boarding.':
    'Up to 90 days. This country isn’t among the 22 exempt for now, so a K-ETA is required before boarding.',
  'Enters as a visitor without permission to work, up to 180 days maximum. The INM officer sets the actual number of days at entry (recorded on the FMM or digital FMM). No pre-travel authorisation.':
    'A visitor, without permission to work, for up to 180 days. The immigration officer (INM) sets the actual number of days at entry and records it on the visitor’s form, the FMM, on paper or digital. There’s no travel authorization to apply for in advance.',
  'Mexico reinstated the visa requirement for Brazilians on August 18, 2022. Exempt if holding a valid US, Canada, UK, Japan or Schengen visa, or permanent residence in those countries or the Pacific Alliance (then entry as a visa-exempt visitor).':
    'Mexico has required Brazilians to have a visa again since August 18, 2022. A Brazilian with a valid US, Canadian, UK, Japanese or Schengen visa, or permanent residence in one of those or a Pacific Alliance country, enters without one as a visitor.',
  'Trans-Tasman arrangement: NZ citizens get a Special Category Visa (subclass 444) on arrival and may live and work indefinitely.':
    'Under the Trans-Tasman arrangement, New Zealand citizens get a Special Category Visa (subclass 444) on arrival, and may live and work in Australia indefinitely.',
  'Every non-citizen needs a visa; the ETA is an electronically linked visa. Multiple entries over 12 months, up to 3 months each visit.':
    'Everyone who isn’t a citizen needs a visa, and the ETA is a visa linked electronically to the passport. It allows entries over 12 months, up to 3 months each visit.',
  'Eligible for both: eVisitor (free, via ImmiAccount) or ETA (AUD 20 via the app). Multiple entries over 12 months, up to 3 months each visit.':
    'Citizens can use either an eVisitor (free, through ImmiAccount) or an ETA (AUD 20, through the app). Either allows entries over 12 months, up to 3 months each visit.',
  'Latvia is eVisitor-eligible (free) but not ETA-eligible. Multiple entries over 12 months, up to 3 months each.':
    'Latvian citizens can use an eVisitor (free), but not an ETA. It allows entries over 12 months, up to 3 months each visit.',
  'Not ETA or eVisitor eligible; must apply for a Visitor visa (subclass 600, Tourist stream), fee charged. Stay period is set in the grant (commonly up to 3, 6 or 12 months).':
    'Citizens can’t use an ETA or an eVisitor, so they apply for a Visitor visa (subclass 600, Tourist stream), for a fee. The visa sets how long they can stay, commonly up to 3, 6 or 12 months.',
  'Visitor: up to 90 days, extendable by the Federal Police up to 180 days per 12-month period. For EU Schengen members the Brazil-EU short-stay agreement is 90 days in any 180-day period.':
    'A visitor can stay up to 90 days, and the Federal Police can extend that to 180 days in any 12 months. For citizens of Schengen countries in the EU, the Brazil-EU short-stay agreement allows 90 days in any 180.',
  'Reciprocal visa waiver since September 30, 2023 for holders of ICAO e-passports; extended in July 2026 to September 29, 2029.':
    'Since September 30, 2023, Brazil and Japan have each waived visas for the other’s citizens with an e-passport to the international (ICAO) standard. In July 2026 the waiver was extended to September 29, 2029.',
  'Visa requirement reinstated on reciprocity grounds from April 10, 2025; apply online for an e-Visa (USD 80.90). Up to 90 days per entry, extendable to 180 per 12 months. Validity: 10 years for US citizens, 5 years for Canadian and Australian citizens (see uncertain).':
    'Brazil has required a visa again since April 10, 2025, in return for these countries requiring one of Brazilians. Apply online for an e-Visa (USD 80.90). It allows up to 90 days each entry, which can be extended to 180 in any 12 months. It’s valid for 10 years for US citizens and 5 years for Canadian and Australian citizens, though the validity wasn’t confirmed.',
  'Trans-Tasman Travel Arrangement: Australian citizens get a resident visa on arrival; no NZeTA or IVL needed.':
    'Under the Trans-Tasman Travel Arrangement, Australian citizens get a resident visa on arrival, and need no NZeTA or visitor levy (IVL).',
  'Visa waiver: UK citizens may stay up to 6 months; NZeTA plus IVL required before travel.':
    'UK citizens need no visa and may stay up to 6 months, but need an NZeTA and must pay the visitor levy (IVL) before they travel.',
  'Visa waiver country: stay up to 3 months per visit; NZeTA plus IVL (NZD 100) required before travel.':
    'No visa is needed for up to 3 months each visit, but you need an NZeTA and must pay the visitor levy (IVL, NZD 100) before you travel.',
};

/** Each note in the file the map changes, as the file writes it: a JSON string after `"note": `. */
export function plainNotes(text) {
  let changed = 0;
  const out = text.replace(/"note": ("(?:[^"\\]|\\.)*")/g, (whole, quoted) => {
    const note = JSON.parse(quoted);
    const plain = PLAIN[note];
    if (plain === undefined || plain === note) return whole;
    changed += 1;
    return `"note": ${JSON.stringify(plain)}`;
  });
  return { text: out, changed };
}

const MAIN = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (MAIN) {
  const { text, changed } = plainNotes(readFileSync(FILE, 'utf8'));
  if (process.argv.includes('--write')) {
    writeFileSync(FILE, text);
    console.log(`rewrote ${changed} notes in ${FILE}`);
  } else {
    console.log(`${changed} notes in ${FILE} are still the research's words`);
    process.exit(changed > 0 ? 1 : 0);
  }
}
