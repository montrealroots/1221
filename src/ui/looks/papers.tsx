/**
 * SLATE — one of your papers.
 *
 * The Papers screen lists every passport, visa, travel authorization,
 * license, permit and ID card a life has held, and until 2026-10-02 each was a
 * row of dead text. A document is a thing: a country or an authority issued
 * it, it carries a number, it was issued on a day and runs out on another, and
 * it lets you do something — cross a border, drive, work — or it doesn’t any
 * more. So it opens, and what it says is read from `systems/documents.ts` at
 * the moment you look: whether it is in force, how many of the countries SLATE
 * has entry rules for would let you in on it today, whether you may drive on
 * it where you stand.
 *
 * Its ways lead to the country that issued it, the country it is for, the
 * passport a visa is issued on (and back), and the days it was issued and runs
 * out.
 */

import { dateKey, formatDate } from '@/engine/core/time';
import { CITIES, COUNTRIES, REGIONS } from '@/engine/content/geography';
import { ENTRY } from '@/engine/content/entry';
import { LICENSES } from '@/engine/content/licenses';
import {
  documentsOf, inForce, mayDrive, mayEnter, passportOf, type PersonDocument,
} from '@/engine/systems/documents';
import { tsaAccepts } from '@/engine/systems/identity';
import { VISITS } from '@/engine/systems/papervisits';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, lookExists, type Way } from './registry';
import { nameable } from './words';
import { at } from './subject';

/** What each sort of document is, in the world’s words. */
const KIND_WORD: Record<PersonDocument['kind'], string> = {
  passport: 'Travel Document',
  authorization: 'Leave To Travel',
  visa: 'Leave To Enter',
  license: 'Leave To Drive',
  idp: 'A Translation Of Your License',
  permit: 'Leave To Work',
  idcard: 'Proof Of Who You Are',
};

/** What to call it where its own name won’t do as a name. */
const PLAIN_NAME: Record<PersonDocument['kind'], string> = {
  passport: 'Passport', authorization: 'Travel Authorization', visa: 'Visa', license: 'Driving License', idp: 'International Driving Permit', permit: 'Work Permit', idcard: 'ID Card',
};

/** The country an ISO code names, where the world has it. Britain is "uk" in the atlas and "GB" on a passport. */
const countryOfIso = (iso: string) => COUNTRIES.all().find((c) => c.iso2?.toUpperCase() === iso.toUpperCase());

/** Who issued it, as a place in the world: a country, or for a license the state or country whose authority it is. */
function issuerCountry(doc: PersonDocument) {
  const iso = doc.kind === 'license' || doc.kind === 'idp' || doc.kind === 'idcard' ? doc.issuer.split('-')[0]! : doc.issuer;
  return countryOfIso(iso === 'uk' ? 'gb' : iso);
}

/** The region a license names, for a state or province that issues its own. */
function issuerRegion(doc: PersonDocument) {
  if (!doc.issuer.includes('-')) return undefined;
  return REGIONS.get(doc.issuer) ?? REGIONS.get(doc.issuer.toUpperCase());
}

/** Each word given its capital, as a label is written, without touching a word that opens on a marked letter. */
const capitalised = (text: string): string => text.split(' ').map((w) => w.replace(/^[a-z]/, (c) => c.toUpperCase())).join(' ');

/** Whether a string reads as a name: no identifier shapes, and a plain capital or digit first. */
const passesAsName = nameable;

/** A document’s name, in Title Case, as the world spells it. */
function nameOf(doc: PersonDocument): string {
  const own = capitalised(doc.name.trim());
  if (passesAsName(own)) return own;
  // A name in the issuer’s language that opens on a marked letter, with the English printed beside it in brackets: the English.
  const english = /\(([^)]+)\)\s*$/.exec(own)?.[1];
  if (english && passesAsName(capitalised(english))) return capitalised(english);
  return PLAIN_NAME[doc.kind];
}

/** The last digits of its number, as a clerk reads them back to you. */
const lastOf = (number: string): string => number.replace(/\W/g, '').slice(-4);

interface ThePaper { doc: PersonDocument; person: Person }

/** Where it stands now, in a word a person uses. */
function standingOf(doc: PersonDocument, now: number): 'pending' | 'valid' | 'lost' | 'cancelled' | 'expired' {
  if (doc.status === 'valid' && doc.expiresAt !== undefined && doc.expiresAt <= now) return 'expired';
  return doc.status;
}

/** What it lets you do, read from the rules today. */
function whatItDoes(sim: Simulation, { doc, person }: ThePaper): string {
  const now = sim.now;
  const live = inForce(doc, now);
  const where = (iso?: string) => (iso ? countryOfIso(iso)?.name ?? iso : 'the country it names');
  switch (doc.kind) {
    case 'passport': {
      if (!live) return 'Out of force, it takes you across no border now.';
      const carried = passportOf(person, now)?.id === doc.id;
      const rules = Object.keys(ENTRY);
      const open = carried ? rules.filter((iso) => mayEnter(person, iso, now).ok).length : 0;
      return carried
        ? `It’s the passport you travel on. Of the ${rules.length} countries SLATE has entry rules for, ${open} would let you in on it today for a week’s visit.`
        : 'In force, but another passport is the one you travel on.';
    }
    case 'visa':
    case 'authorization': {
      if (!live) return `${where(doc.destination).replace(/^./, (c) => c.toUpperCase())} won’t let you in on it now.`;
      const answer = doc.destination ? mayEnter(person, doc.destination, now) : undefined;
      return answer?.ok
        ? `It lets you into ${where(doc.destination)}, and nothing else is missing for a week’s visit there. ${answer.stay ?? ''}`.trim()
        : `It’s in force for ${where(doc.destination)}, but the visit still asks more: ${answer?.missing[0] ?? 'the rule wasn’t found'}`;
    }
    case 'license': {
      if (!live) return 'Nowhere lets you drive on it now.';
      const here = CITIES.get(person.currentLocationId)?.name ?? 'where you are';
      const may = mayDrive(person, person.currentLocationId, now, now, doc.vehicleClass ?? 'car');
      return may.ok ? `In ${here}, you may drive on it.` : `In ${here}, you may not drive on it. ${may.why ?? ''}`.trim();
    }
    case 'idp':
      return live ? 'It goes beside your license abroad, where a country asks to read it in its own terms.' : 'Out of force, it goes beside your license nowhere.';
    case 'permit':
      return live ? `It lets you work in ${where(doc.destination ?? doc.issuer)}${doc.bookingId ? ', for the one job it was issued for' : ''}.` : 'Nowhere lets you work on it now.';
    case 'idcard':
      return live
        ? tsaAccepts(person, now)?.id === doc.id ? 'It proves who you are, and it’s what an American airport’s checkpoint will read.' : 'It proves who you are, anywhere a card is asked for.'
        : 'Out of force, it proves nothing to anybody.';
  }
}

defineLook<ThePaper>('document', {
  gone: 'You don’t hold that paper any more. Whatever it was, it’s out of your hands.',
  resolve: (sim, id) => {
    const person = sim.universe.people[sim.universe.playerId];
    if (!person) return undefined;
    const doc = documentsOf(person).find((d) => d.id === id);
    return doc ? { doc, person } : undefined;
  },
  seeds: (sim) => {
    const person = sim.universe.people[sim.universe.playerId];
    return person ? documentsOf(person).map((d) => d.id) : [];
  },
  look: (paper, { sim }) => {
    const { doc, person } = paper;
    const zone = sim.zone;
    const state = standingOf(doc, sim.now);
    const country = issuerCountry(doc);
    const region = issuerRegion(doc);
    const issuer = doc.kind === 'license' && LICENSES[doc.issuer] ? LICENSES[doc.issuer]!.authority : region?.name ?? country?.name ?? doc.issuer.toUpperCase();
    const last = lastOf(doc.number);

    // The interview or biometrics it waits on, from 2026-10-06 (`systems/papervisits.ts`).
    const visit = doc.visit && doc.visit.keptAt === undefined ? `It waits on the ${VISITS[doc.visit.rule].what.toLowerCase()} in ${CITIES.get(doc.visit.cityId)?.name ?? 'town'} on ${formatDate(doc.visit.at, zone)}: be there, or ${VISITS[doc.visit.rule].again && !doc.visit.missed ? 'it’s booked once more and then' : 'the application'} ends. ` : '';
    const summary = state === 'pending'
      ? `${visit}It’s being decided, and it should be ready ${doc.readyAt ? `by ${formatDate(doc.readyAt, zone)}` : 'soon'}.`
      : state === 'lost' ? `You reported it lost, so the number ending ${last} is canceled.`
        : state === 'cancelled' ? `Canceled, the number ending ${last} is no use to you now.`
          : state === 'expired' ? `Run out on ${formatDate(doc.expiresAt!, zone)}, it no longer counts for anything.`
            : doc.expiresAt ? `It’s in force until ${formatDate(doc.expiresAt, zone)}, and its number ends ${last}.` : `It’s in force with no end date, and its number ends ${last}.`;

    const ways: Way[] = [];
    if (country && lookExists(sim, at('country', country.id))) {
      ways.push({ to: at('country', country.id), label: country.name, detail: doc.kind === 'license' ? 'The country whose roads it was issued for' : 'The country that issued it, and whose citizen it says you are' });
    }
    if (region && lookExists(sim, at('region', region.id))) {
      ways.push({ to: at('region', region.id), label: region.name, detail: 'The state or province whose authority issued it' });
    }
    const dest = doc.destination ? countryOfIso(doc.destination) : undefined;
    if (dest && dest.id !== country?.id && lookExists(sim, at('country', dest.id))) {
      ways.push({ to: at('country', dest.id), label: dest.name, detail: 'The country it lets you into, and what that country is like' });
    }
    const on = doc.passportId ? documentsOf(person).find((d) => d.id === doc.passportId) : undefined;
    if (on) ways.push({ to: at('document', on.id), label: nameOf(on), detail: `The passport it was issued on, ending ${lastOf(on.number)}` });
    for (const child of documentsOf(person).filter((d) => d.passportId === doc.id)) {
      ways.push({ to: at('document', child.id), label: nameOf(child), detail: `Issued on this passport${child.destination ? `, for ${countryOfIso(child.destination)?.name ?? child.destination}` : ''}` });
    }
    if (doc.issuedAt !== undefined) {
      ways.push({ to: at('day', dateKey(doc.issuedAt, sim.homeZone)), label: `Issued ${formatDate(doc.issuedAt, zone)}`, detail: 'The day it was issued, as the calendar has it' });
    }
    if (doc.expiresAt !== undefined) {
      ways.push({ to: at('day', dateKey(doc.expiresAt, sim.homeZone)), label: `${doc.expiresAt > sim.now ? 'Runs Out' : 'Ran Out'} ${formatDate(doc.expiresAt, zone)}`, detail: 'The day it stops counting, and what else is on that day' });
    }
    ways.push({ to: at('person', person.id), label: 'You', detail: 'The person it names, and the rest of your life' });

    return {
      name: nameOf(doc),
      kind: KIND_WORD[doc.kind],
      parent: at('person', person.id),
      summary,
      body: (
        <>
          <p className="small">
            {issuer} issued it{doc.issuedAt ? ` on ${formatDate(doc.issuedAt, zone)}` : ''}.{' '}
            {state === 'valid' ? whatItDoes(sim, paper) : state === 'pending' ? 'Until it comes, it lets you do nothing.' : ''}
            {doc.realId ? ' It meets REAL ID.' : ''}
          </p>
          <div className="grid grid-3">
            <Stat label="Number Ends" value={<span className="mono">{last}</span>} note="How the office knows it" />
            <Stat label="Issued" value={doc.issuedAt ? formatDate(doc.issuedAt, zone) : 'Not Yet'} note={doc.appliedAt ? `Applied for ${formatDate(doc.appliedAt, zone)}` : 'As it was handed over'} />
            <Stat
              label={state === 'expired' ? 'Ran Out' : 'Runs Out'}
              value={doc.expiresAt ? formatDate(doc.expiresAt, zone) : 'No End Date'}
              tone={state === 'valid' ? undefined : 'warning'}
              note={state === 'valid' ? 'In force until then' : state === 'pending' ? 'Being decided' : 'No longer in force'}
            />
          </div>
        </>
      ),
      ways,
      provenance: 'What it lets you do is read from the entry and driving rules SLATE holds for each country, as they stand today.',
    };
  },
});
