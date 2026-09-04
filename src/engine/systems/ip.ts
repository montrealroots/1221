/**
 * SLATE — Licensing real IP from the studio that owns it.
 *
 * Every franchise in a studio's catalogue is the studio's to keep. A producer
 * can ask to license one for a sequel, a remake, a spin-off or a series, and
 * the studio answers the way studios do: a franchise that is live stays in
 * house, a crown jewel is never handed out, a title resting in the library is
 * what gets remade, and the answer depends on who is asking.
 *
 * The terms are the studio's, not the interface's. The fee and the standing
 * offer live in the save, an acceptance is charged once against the offer on
 * record, and asking twice, or accepting twice, changes nothing.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Franchise, Id, Project, ProjectFormat, Rights } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, zonedParts } from '../core/time';
import { formatMoney, formatMoneyCompact, type Money } from '../core/money';
import { buildFactors } from '../core/audit';
import { STUDIOS, type Studio } from '../content/studios';
import { franchisesIn, normaliseTitle, studioCatalog, titleTaken, type FranchiseSummary } from '../content/filmography';
import { formatPlural, titleCaseLabel } from '../core/text';
import { advancePhase } from './film';
import { standingWith } from './studio-state';

export type LicenceKind = 'sequel' | 'remake' | 'spin_off' | 'series';
export const LICENCE_KINDS: readonly LicenceKind[] = ['sequel', 'remake', 'spin_off', 'series'];
export const LICENCE_KIND_LABEL: Readonly<Record<LicenceKind, string>> = { sequel: 'Sequel', remake: 'Remake', spin_off: 'Spin-Off', series: 'Series' };
const LICENCE_FORMATS: readonly ProjectFormat[] = ['feature', 'series', 'limited_series'];

/** The reference a request, its answer and its offer all share. */
export function licenceRef(studioId: string, franchiseQid: string): string {
  return `${studioId}|${franchiseQid}`;
}

interface Terms {
  studioId: string;
  franchiseQid: string;
  franchiseName: string;
  kind: LicenceKind;
  format: ProjectFormat;
  title?: string;
  holderId: Id;
  holderKind: 'person' | 'company';
  fee: Money;
}

/** The franchise as the world knows it on the day: titles dated later have not happened yet. */
export function franchiseOnRecord(sim: Simulation, studioId: string, franchiseQid: string): FranchiseSummary | undefined {
  const catalogue = studioCatalog(studioId);
  if (!catalogue) return undefined;
  const year = zonedParts(sim.now, sim.homeZone).year;
  return franchisesIn(catalogue.filter((t) => !t.year || t.year <= year)).find((f) => f.qid === franchiseQid);
}

function standingOf(sim: Simulation, holderId: Id, holderKind: 'person' | 'company') {
  const player = sim.player;
  const company = holderKind === 'company' ? sim.universe.companies[holderId] : undefined;
  const released = Object.values(sim.universe.projects).filter((p) => p.createdById === player.id && (p.phase === 'released' || p.phase === 'library'));
  const hits = released.filter((p) => (p.criticScore ?? 0) >= 60 || (p.totalCost > 0 && p.totalRevenue > p.totalCost * 1.5)).length;
  const reputation = company ? Math.max(player.reputation.professionalReputation, company.reputation) : player.reputation.professionalReputation;
  return { reputation, released: released.length, hits };
}

/** The studio's fee for the licence: SLATE's calibration from what the franchise has grossed. */
export function licenceFee(franchise: FranchiseSummary, kind: LicenceKind, dormantYears: number): Money {
  const base = franchise.gross > 0 ? clamp(franchise.gross * 0.006, 250_000, 30_000_000) : 250_000;
  const kindMultiplier: Record<LicenceKind, number> = { sequel: 1.6, spin_off: 1.25, series: 1.0, remake: 0.75 };
  const rest = dormantYears >= 10 ? 0.7 : dormantYears >= 5 ? 0.85 : 1;
  return Math.round(base * kindMultiplier[kind] * rest / 10_000) * 10_000 * 100;
}

/**
 * How the studio weighs the ask. Everything but its own plans is knowable, so
 * the interface can show the producer the same reading the studio makes.
 */
export function licenceOdds(sim: Simulation, studio: Studio, franchise: FranchiseSummary, kind: LicenceKind, format: ProjectFormat, holderId: Id, holderKind: 'person' | 'company', hidden = 0.5) {
  const year = zonedParts(sim.now, sim.homeZone).year;
  const last = franchise.lastYear ?? year - 20;
  const dormantYears = Math.max(0, year - last);
  const availability = dormantYears >= 10 ? 1 : dormantYears >= 5 ? 0.6 : dormantYears >= 2 ? 0.25 : 0.05;
  const gross = franchise.gross;
  const scale = gross >= 2_000_000_000 ? 0.05 : gross >= 500_000_000 ? 0.3 : gross >= 100_000_000 ? 0.7 : 1;
  const kindValue: Record<LicenceKind, number> = { remake: 1, series: 0.85, spin_off: 0.6, sequel: 0.45 };
  const genres = [...new Set(franchise.titles.flatMap((t) => t.slateGenres))];
  const makesFormat = (studio.formats as readonly string[]).includes(format);
  const formatFit = makesFormat ? 1 : 0.4;
  const genreFit = genres.length === 0 || genres.some((g) => studio.wants.includes(g)) ? 1 : 0.6;
  const standing = standingWith(sim, 'studio', studio.id);
  const standingOfAsker = standingOf(sim, holderId, holderKind);
  const name = titleCaseLabel(franchise.name);

  const { factors, score } = buildFactors([
    { label: 'Who Is Asking', detail: `The industry reads your standing at ${Math.round(standingOfAsker.reputation)} out of 100.`, weight: 0.20, value: standingOfAsker.reputation / 100 },
    { label: 'Track Record', detail: standingOfAsker.released === 0 ? 'Nothing released yet under your name.' : `${standingOfAsker.released} released, ${standingOfAsker.hits} that landed.`, weight: 0.10, value: clamp(standingOfAsker.hits / 3, 0, 1) },
    { label: 'Is It Resting', detail: dormantYears === 0 ? `The latest ${name} title is this year. It is live, and live franchises stay in house.` : `The latest ${name} title was ${last}, ${dormantYears} year${dormantYears === 1 ? '' : 's'} ago.${dormantYears >= 10 ? ' A library title is the kind that gets licensed.' : ''}`, weight: 0.22, value: availability },
    { label: 'How Big It Is', detail: gross > 0 ? `${formatMoneyCompact(gross * 100)} across ${franchise.titles.length} titles on record.${gross >= 2_000_000_000 ? ' A crown jewel is not for hire.' : ''}` : `No box office on record across ${franchise.titles.length} titles. A library title.`, weight: 0.16, value: scale },
    { label: 'What You Want To Make', detail: `A ${LICENCE_KIND_LABEL[kind].toLowerCase()}. A studio remakes a resting title long before it lets anyone else make the next chapter.`, weight: 0.10, value: kindValue[kind] },
    { label: 'Fit With The Studio', detail: `${studio.shortName} ${makesFormat ? 'makes' : 'does not make'} ${formatPlural(format)}${genres.length > 0 ? `, and ${genres.some((g) => studio.wants.includes(g)) ? 'wants' : 'is not chasing'} ${genres.slice(0, 2).map(titleCaseLabel).join(' and ')}` : ''}.`, weight: 0.08, value: formatFit * genreFit },
    { label: 'Your Standing With Them', detail: `${studio.shortName} reads you at ${Math.round(standing)} out of 100.`, weight: 0.10, value: standing / 100 },
    { label: 'Their Own Plans For It', detail: 'What the studio already has in development on it, which is not public.', weight: 0.14, value: hidden, knowable: false },
  ]);
  // Resting and size are gates as much as weights: nobody licenses a live
  // franchise or a crown jewel, however well the rest of the ask reads.
  const gate = Math.min(1, availability * 2) * Math.min(1, scale * 2);
  const probability = clamp((score * 1.15 + remap(studio.riskAppetite, 0, 100, -0.08, 0.06) - 0.22) * gate, 0.01, 0.85);
  // A studio that knows you shaves the fee, up to a quarter.
  const fee = Math.round(licenceFee(franchise, kind, dormantYears) * (1 - clamp((standing - 30) / 280, 0, 0.25)) / 10_000_00) * 10_000_00;
  return { factors, score, probability, dormantYears, fee };
}

/** Where a producer stands with a studio over one franchise, for the interface. */
export function licenceStatus(sim: Simulation, studioId: string, franchiseQid: string): { state: 'none' | 'asked' | 'offered' | 'licensed'; franchiseId?: Id; respondsAt?: number; fee?: Money } {
  const ref = licenceRef(studioId, franchiseQid);
  const held = Object.values(sim.universe.franchises).find((f) => f.studioId === studioId && f.catalogueQid === franchiseQid);
  if (held) return { state: 'licensed', franchiseId: held.id };
  const offer = Object.values(sim.universe.decisions).find((d) => d.refType === 'ip' && d.refId === ref && !d.resolvedAt && !d.dismissedAt);
  if (offer) return { state: 'offered', fee: (offer.actions[0]?.payload as { fee?: Money } | undefined)?.fee };
  const asked = sim.universe.scheduled.find((s) => s.kind === 'ip.decision' && s.status === 'pending' && s.payload.studioId === studioId && s.payload.franchiseQid === franchiseQid);
  if (asked) return { state: 'asked', respondsAt: asked.at };
  return { state: 'none' };
}

function holderAccount(sim: Simulation, holderId: Id, holderKind: 'person' | 'company'): Id | undefined {
  return holderKind === 'company' ? sim.universe.companies[holderId]?.cashAccountId : sim.universe.people[holderId]?.primaryAccountId;
}

export function registerIpLicensing(sim: Simulation): void {
  sim.onSchedule('ip.decision', (item) => decideLicence(sim, item.payload as unknown as Omit<Terms, 'fee'>));
  sim.onSchedule('ip.offer_lapse', (item) => lapseOffer(sim, item.payload.ref as string));

  sim.onCommand<{ studioId: string; franchiseQid: string; kind: LicenceKind; format: ProjectFormat; title?: string; holderId?: Id; holderKind?: 'person' | 'company' }, { respondsAt: number; probability: number; fee: Money }>(
    'film.request_ip_licence',
    (p, { sim: s }) => {
      const studio = STUDIOS.get(p.studioId);
      if (!studio) throw new CommandError('No such studio.');
      if (!LICENCE_KINDS.includes(p.kind)) throw new CommandError('Say what you want to make: a sequel, a remake, a spin-off or a series.');
      if (!LICENCE_FORMATS.includes(p.format)) throw new CommandError('A licence covers a feature, a series or a limited series.');
      if (!studioCatalog(p.studioId)) throw new CommandError(`${studio.shortName}'s catalogue has not loaded yet. Open the studio in Industry first.`);
      const franchise = franchiseOnRecord(s, p.studioId, p.franchiseQid);
      if (!franchise) throw new CommandError(`${studio.shortName} has no such franchise on record.`);

      const holderId = p.holderId ?? s.player.id;
      const holderKind = p.holderKind ?? (s.universe.companies[holderId] ? 'company' : 'person');
      if (holderKind === 'company') {
        const company = s.universe.companies[holderId];
        const stake = company?.ownerships.find((o) => o.holderId === s.player.id)?.percent ?? 0;
        if (!company || company.dissolvedAt) throw new CommandError('No such company.');
        if (stake < 50) throw new CommandError(`You do not control ${company.name}. Licensing in its name takes a majority.`);
      } else if (holderId !== s.player.id) {
        throw new CommandError('You can only ask in your own name or for a company you control.');
      }

      const name = titleCaseLabel(franchise.name);
      const status = licenceStatus(s, p.studioId, p.franchiseQid);
      if (status.state === 'asked') throw new CommandError(`You have already asked ${studio.shortName} about ${name}. They answer in their own time.`);
      if (status.state === 'offered') throw new CommandError(`${studio.shortName} has already made you an offer on ${name}. Answer that first.`);
      if (status.state === 'licensed') throw new CommandError(`You already hold a licence on ${name}.`);

      const title = p.title?.trim();
      if (title) {
        const inFranchise = franchise.titles.some((t) => normaliseTitle(t.title) === normaliseTitle(title));
        const elsewhere = Object.values(s.universe.projects).some((other) => normaliseTitle(other.title) === normaliseTitle(title));
        if ((titleTaken(title) && !inFranchise) || elsewhere) {
          throw new CommandError(`"${title}" is already a film or series outside ${name}. A licensed title can only reuse a name from the franchise itself.`);
        }
      }

      const odds = licenceOdds(s, studio, franchise, p.kind, p.format, holderId, holderKind);
      const respondsAt = addDays(s.now, s.rng('ip_delay', p.studioId, p.franchiseQid, holderId).int(14, 45), s.homeZone);
      s.schedule({
        at: respondsAt,
        kind: 'ip.decision',
        label: `${studio.shortName} On ${name}`,
        category: 'career',
        payload: { studioId: p.studioId, franchiseQid: p.franchiseQid, franchiseName: franchise.name, kind: p.kind, format: p.format, title, holderId, holderKind },
        priority: 40,
        refType: 'ip', refId: licenceRef(p.studioId, p.franchiseQid),
      });

      // The meeting takes the afternoon and some nerve.
      s.advanceTo(s.now + 3 * 60 * 60 * 1000);
      s.player.wellbeing.stress = clamp(s.player.wellbeing.stress + 5, 0, 100);
      s.remember({
        category: 'project',
        title: `Asked ${studio.shortName} to license ${name}`,
        detail: `A ${LICENCE_KIND_LABEL[p.kind].toLowerCase()}${title ? `, "${title}"` : ''}. They will answer by ${new Date(respondsAt).toISOString().slice(0, 10)}.`,
        refs: [],
        significance: 35, public: false,
      });
      s.emit('ip.licence_requested', { studioId: p.studioId, franchiseQid: p.franchiseQid, kind: p.kind, holderId, respondsAt });
      return { respondsAt, probability: odds.probability, fee: odds.fee };
    },
  );

  sim.onCommand<{ offerRef: string }, { rightsId: Id; franchiseId: Id; projectId: Id; fee: Money }>(
    'film.accept_ip_licence',
    (p, { sim: s }) => {
      // The offer on record is the authority: its terms, not the caller's.
      const offer = Object.values(s.universe.decisions).find((d) => d.refType === 'ip' && d.refId === p.offerRef && !d.resolvedAt && !d.dismissedAt);
      if (!offer) throw new CommandError('There is no offer standing. Either it lapsed, or it has already been taken.');
      const terms = offer.actions.find((a) => a.commandKind === 'film.accept_ip_licence')?.payload as unknown as Terms | undefined;
      if (!terms) throw new CommandError('The offer carries no terms.');
      if (offer.dueAt && s.now > offer.dueAt) {
        s.resolveDecision('ip', p.offerRef);
        throw new CommandError('The offer has lapsed. Ask again if you still want it.');
      }
      const studio = STUDIOS.get(terms.studioId);
      if (!studio) throw new CommandError('No such studio.');
      if (Object.values(s.universe.franchises).some((f) => f.studioId === terms.studioId && f.catalogueQid === terms.franchiseQid)) {
        s.resolveDecision('ip', p.offerRef);
        throw new CommandError(`You already hold a licence on ${titleCaseLabel(terms.franchiseName)}.`);
      }

      const accountId = holderAccount(s, terms.holderId, terms.holderKind);
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < terms.fee) {
        throw new CommandError(`The licence costs ${formatMoney(terms.fee)} and you cannot cover it. The offer stands until it lapses.`);
      }
      const name = titleCaseLabel(terms.franchiseName);
      s.resolveDecision('ip', p.offerRef);
      s.expense(accountId, terms.fee, `Licence — ${name}`, 'development', { refType: 'ip', refId: p.offerRef });

      const rights: Rights = {
        id: s.nextId('rights'),
        saveId: s.universe.meta.id,
        title: terms.title || name,
        sourceKind: terms.kind === 'remake' ? 'remake' : terms.kind === 'series' ? 'adaptation' : terms.kind === 'spin_off' ? 'spin_off' : 'sequel',
        holderId: terms.holderId,
        holderKind: terms.holderKind,
        acquiredFrom: studio.name,
        acquisitionKind: 'license',
        cost: terms.fee,
        acquiredAt: s.now,
        extensionsUsed: 0,
        extensionsAllowed: 0,
        scope: {
          media: terms.format === 'feature' ? ['theatrical', 'streaming', 'home', 'television'] : ['television', 'streaming', 'home'],
          territories: ['worldwide'],
          // One picture, or one show. Anything after it is the studio's to grant again.
          sequelRights: false,
          remakeRights: false,
          merchandisingRights: false,
        },
        chainOfTitle: [{ at: s.now, note: `Licensed from ${studio.name} for ${formatMoney(terms.fee)}: one ${LICENCE_KIND_LABEL[terms.kind].toLowerCase()} in ${name}. ${studio.shortName} distributes and keeps merchandising.` }],
        status: 'active',
        licensorStudioId: terms.studioId,
        franchiseName: terms.franchiseName,
      };
      s.universe.rights[rights.id] = rights;
      if (terms.holderKind === 'company') s.universe.companies[terms.holderId]?.rightsIds.push(rights.id);

      // The franchise arrives with the appetite and the fatigue the record gives it.
      const onRecord = franchiseOnRecord(s, terms.studioId, terms.franchiseQid);
      const year = zonedParts(s.now, s.homeZone).year;
      const dormant = Math.max(0, year - (onRecord?.lastYear ?? year - 20));
      const rated = (onRecord?.titles ?? []).map((t) => t.imdb).filter((v): v is number => typeof v === 'number');
      const imdbMean = rated.length > 0 ? rated.reduce((a, b) => a + b, 0) / rated.length : 6;
      const franchise: Franchise = {
        id: s.nextId('franchise'),
        saveId: s.universe.meta.id,
        name: name,
        ownerCompanyId: terms.holderKind === 'company' ? terms.holderId : undefined,
        projectIds: [],
        strength: clamp(Math.round(remap(imdbMean, 5, 8, 35, 80) + Math.min(15, Math.log10(Math.max(1, onRecord?.gross ?? 0)) * 1.5)), 10, 95),
        fatigue: clamp(Math.round(dormant >= 10 ? 5 : dormant >= 5 ? 20 : dormant >= 2 ? 40 : 60), 0, 100),
        totalRevenue: 0,
        merchandiseRevenue: 0,
        startedAt: s.now,
        studioId: terms.studioId,
        catalogueQid: terms.franchiseQid,
        catalogueName: terms.franchiseName,
        licence: { kind: terms.kind, rightsId: rights.id, fee: terms.fee },
      };
      s.universe.franchises[franchise.id] = franchise;

      const genres = [...new Set((onRecord?.titles ?? []).flatMap((t) => t.slateGenres))].slice(0, 3);
      const made = s.execute<{ projectId: Id }>({
        kind: 'film.create_project',
        payload: {
          title: terms.title || `${name}${terms.kind === 'remake' ? '' : terms.kind === 'series' ? ': The Series' : ': ' + LICENCE_KIND_LABEL[terms.kind]}`,
          format: terms.format,
          genres: genres.length > 0 ? genres : ['drama'],
          logline: `A ${LICENCE_KIND_LABEL[terms.kind].toLowerCase()} in ${name}, licensed from ${studio.name}.`,
          companyId: terms.holderKind === 'company' ? terms.holderId : undefined,
          franchiseId: franchise.id,
        },
      });
      if (!made.ok || !made.value) throw new CommandError(made.error ?? 'The project could not be set up.');
      const project: Project = s.universe.projects[made.value.projectId]!;
      project.rightsId = rights.id;
      project.studioId = terms.studioId;
      project.distributorName = studio.name;
      franchise.projectIds.push(project.id);
      advancePhase(s, project, 'rights');

      s.remember({
        category: 'project',
        title: `Licensed ${name} from ${studio.shortName}`,
        detail: `${formatMoney(terms.fee)} for one ${LICENCE_KIND_LABEL[terms.kind].toLowerCase()}, "${project.title}". ${studio.shortName} distributes.`,
        refs: [{ type: 'project', id: project.id }, { type: 'franchise', id: franchise.id }],
        significance: 70, public: true,
      });
      s.emit('ip.licensed', { studioId: terms.studioId, franchiseQid: terms.franchiseQid, franchiseId: franchise.id, rightsId: rights.id, projectId: project.id, fee: terms.fee });
      return { rightsId: rights.id, franchiseId: franchise.id, projectId: project.id, fee: terms.fee };
    },
  );

  sim.onCommand<{ offerRef: string }, { declined: boolean }>(
    'film.decline_ip_licence',
    (p, { sim: s }) => {
      const offer = Object.values(s.universe.decisions).find((d) => d.refType === 'ip' && d.refId === p.offerRef && !d.resolvedAt && !d.dismissedAt);
      if (!offer) throw new CommandError('There is no offer standing.');
      s.resolveDecision('ip', p.offerRef);
      s.emit('ip.licence_declined', { ref: p.offerRef });
      return { declined: true };
    },
  );
}

function decideLicence(sim: Simulation, ask: Omit<Terms, 'fee'>): void {
  const studio = STUDIOS.get(ask.studioId);
  if (!studio) return;
  const ref = licenceRef(ask.studioId, ask.franchiseQid);
  const name = titleCaseLabel(ask.franchiseName);
  const franchise = franchiseOnRecord(sim, ask.studioId, ask.franchiseQid);
  if (!franchise) {
    sim.notify({ category: 'career', title: `${studio.shortName} passed`, body: `On ${name}. The catalogue was not to hand when they answered; ask again with the studio open.`, importance: 40, route: '/workspace/industry' });
    return;
  }
  const rng = sim.rng('ip', ask.studioId, ask.franchiseQid, ask.holderId);
  const odds = licenceOdds(sim, studio, franchise, ask.kind, ask.format, ask.holderId, ask.holderKind, rng.float(0, 1));
  const roll = rng.next();
  const granted = roll < odds.probability;

  sim.audit({
    kind: 'ip.licence_decided', subjectType: 'franchise', subjectId: ref,
    question: `Why did ${studio.shortName} license ${name}, or keep it?`,
    summary: granted ? `${studio.shortName} will license ${name} for a ${LICENCE_KIND_LABEL[ask.kind].toLowerCase()} at ${formatMoney(odds.fee)}.` : `${studio.shortName} kept ${name}.`,
    factors: odds.factors, seed: `ip|${ref}|${ask.holderId}`, roll, probability: odds.probability, score: odds.score,
    outcome: granted ? 'licensed' : 'kept',
  });

  if (!granted) {
    const weakest = [...odds.factors].filter((f) => f.knowable).sort((a, b) => a.contribution - b.contribution)[0];
    sim.notify({
      category: 'career', title: `${studio.shortName} kept ${name}`,
      body: `They passed on your ${LICENCE_KIND_LABEL[ask.kind].toLowerCase()}. ${weakest ? weakest.detail : 'They gave no reason.'}`,
      importance: 45, route: '/workspace/industry', refType: 'ip', refId: ref,
    });
    sim.emit('ip.licence_refused', { studioId: ask.studioId, franchiseQid: ask.franchiseQid, holderId: ask.holderId });
    return;
  }

  const dueAt = addDays(sim.now, 21, sim.homeZone);
  const terms: Terms = { ...ask, fee: odds.fee };
  sim.requireDecision({
    urgency: 78, category: 'career',
    title: `${studio.shortName} will license ${name}`,
    detail: `One ${LICENCE_KIND_LABEL[ask.kind].toLowerCase()} for ${formatMoney(odds.fee)}. ${studio.shortName} distributes worldwide and keeps merchandising; you produce, and you keep your credit and your backend. The offer stands for three weeks.`,
    route: '/workspace/industry',
    actions: [
      { label: 'Take The Licence', commandKind: 'film.accept_ip_licence', payload: { offerRef: ref, ...terms } },
      { label: 'Walk Away', commandKind: 'film.decline_ip_licence', payload: { offerRef: ref } },
    ],
    dueAt,
    refType: 'ip', refId: ref,
  });
  sim.schedule({
    at: dueAt, kind: 'ip.offer_lapse', label: `${studio.shortName} Offer Lapses — ${name}`, category: 'career',
    payload: { ref }, priority: 60, refType: 'ip', refId: ref,
  });
  sim.emit('ip.licence_offered', { studioId: ask.studioId, franchiseQid: ask.franchiseQid, holderId: ask.holderId, fee: odds.fee, dueAt });
}

function lapseOffer(sim: Simulation, ref: string): void {
  const offer = Object.values(sim.universe.decisions).find((d) => d.refType === 'ip' && d.refId === ref && !d.resolvedAt && !d.dismissedAt);
  if (!offer) return;
  sim.resolveDecision('ip', ref);
  sim.notify({ category: 'career', title: 'A Licence Offer Lapsed', body: `${offer.title.replace(' will license ', ' withdrew its offer on ')}. Ask again if you still want it.`, importance: 40, route: '/workspace/industry', refType: 'ip', refId: ref });
  sim.emit('ip.licence_lapsed', { ref });
}
