/**
 * SLATE — The studios and networks as they stand inside one save.
 *
 * The registries say what a company is. This says what it has done since the
 * save began and how it regards the player: standing, results, mood, who is
 * in which seat now, and what the trades have said. Every system that needs
 * to read or move that state comes through here, and nothing here reaches
 * back into the systems, so it can be read from anywhere.
 */

import type { Simulation } from '../core/simulation';
import type { Id, IndustryNewsItem, LiveLeader, NetworkState, Project, StudioState, TalentDeal, TradeItem } from '../domain/model';
import type { Money } from '../core/money';
import { clamp } from '../core/rng';
import { STUDIOS, type Studio } from '../content/studios';
import { NETWORKS } from '../content/networks';

/** Where a stranger stands: known of, not known. */
export const BASELINE_STANDING = 30;
const NEWS_CAP = 60;
const STANDING_LOG_CAP = 40;
const TRADE_CAP = 160;

export type CompanyKind = 'studio' | 'network';

function stores(sim: Simulation) {
  const u = sim.universe;
  u.studios ??= {};
  u.networks ??= {};
  u.talentDeals ??= {};
  u.boxOffice ??= { weekends: [], yearToDate: {}, pending: [] };
  u.trade ??= [];
  return u;
}

export function studioState(sim: Simulation, id: string): StudioState {
  const u = stores(sim);
  return (u.studios[id] ??= {
    id, saveId: u.meta.id,
    standing: BASELINE_STANDING, standingLog: [],
    confidence: 55, strategy: 'steady', slateMultiplier: 1, riskDrift: 0, prestigeDrift: 0,
    yearGross: {}, yearResults: {},
    leadershipChanges: [], corporate: [], news: [],
  });
}

export function networkState(sim: Simulation, id: string): NetworkState {
  const u = stores(sim);
  return (u.networks[id] ??= {
    id, saveId: u.meta.id,
    standing: BASELINE_STANDING, standingLog: [],
    confidence: 55,
    leadershipChanges: [], corporate: [], news: [],
  });
}

/** Standing without creating state for a company the player has never touched. */
export function standingWith(sim: Simulation, kind: CompanyKind, id: string): number {
  const u = stores(sim);
  return (kind === 'studio' ? u.studios[id]?.standing : u.networks[id]?.standing) ?? BASELINE_STANDING;
}

/** Moves standing and remembers why. A move worth noticing is news at the company too. */
export function adjustStanding(sim: Simulation, kind: CompanyKind, id: string, delta: number, note: string): number {
  if (delta === 0) return standingWith(sim, kind, id);
  const state = kind === 'studio' ? studioState(sim, id) : networkState(sim, id);
  const before = state.standing;
  state.standing = clamp(Math.round((state.standing + delta) * 10) / 10, 0, 100);
  const moved = Math.round((state.standing - before) * 10) / 10;
  if (moved === 0) return state.standing;
  state.standingLog.push({ at: sim.now, delta: moved, note });
  if (state.standingLog.length > STANDING_LOG_CAP) state.standingLog.splice(0, state.standingLog.length - STANDING_LOG_CAP);
  if (Math.abs(moved) >= 3) recordNews(sim, kind, id, { kind: 'standing', title: moved > 0 ? 'They Think More Of You' : 'They Think Less Of You', detail: note });
  return state.standing;
}

export function recordNews(sim: Simulation, kind: CompanyKind, id: string, item: Omit<IndustryNewsItem, 'at'>): void {
  const state = kind === 'studio' ? studioState(sim, id) : networkState(sim, id);
  state.news.push({ at: sim.now, ...item });
  if (state.news.length > NEWS_CAP) state.news.splice(0, state.news.length - NEWS_CAP);
}

export function recordTrade(sim: Simulation, item: Omit<TradeItem, 'id' | 'at'>): TradeItem {
  const u = stores(sim);
  const trade: TradeItem = { id: sim.nextId('trade'), at: sim.now, ...item };
  u.trade.push(trade);
  if (u.trade.length > TRADE_CAP) u.trade.splice(0, u.trade.length - TRADE_CAP);
  return trade;
}

/** The studio's calibration with what the save has done to it: mood, strategy and new bosses move the numbers. */
export function effectiveStudio(sim: Simulation, studio: Studio): { slateSize: number; riskAppetite: number; prestigeBias: number; closing: boolean; strategy: StudioState['strategy']; confidence: number } {
  const state = sim.universe.studios?.[studio.id];
  if (!state) return { slateSize: studio.slateSize, riskAppetite: studio.riskAppetite, prestigeBias: studio.prestigeBias, closing: Boolean(studio.status?.toLowerCase().includes('closing')), strategy: 'steady', confidence: 55 };
  return {
    slateSize: Math.max(0, Math.round(studio.slateSize * state.slateMultiplier)),
    riskAppetite: clamp(studio.riskAppetite + state.riskDrift, 0, 100),
    prestigeBias: clamp(studio.prestigeBias + state.prestigeDrift, 0, 100),
    closing: Boolean(state.closing) || Boolean(studio.status?.toLowerCase().includes('closing')),
    strategy: state.strategy,
    confidence: state.confidence,
  };
}

/** The seats as they stand now: the registry's roster until the save changes one. */
export function liveLeadership(sim: Simulation, kind: CompanyKind, id: string): LiveLeader[] {
  const state = kind === 'studio' ? sim.universe.studios?.[id] : sim.universe.networks?.[id];
  if (state?.leadership) return state.leadership;
  const company = kind === 'studio' ? STUDIOS.get(id) : NETWORKS.get(id);
  return (company?.leadership ?? []).map((l) => ({ name: l.name, title: l.title }));
}

/** A deal the player holds, by kind and counterparty if asked. */
export function activeDeal(sim: Simulation, filter: { kind?: TalentDeal['kind']; counterpartyId?: string; holderId?: Id } = {}): TalentDeal | undefined {
  const u = stores(sim);
  return Object.values(u.talentDeals).find((d) => d.status === 'active'
    && (!filter.kind || d.kind === filter.kind)
    && (!filter.counterpartyId || d.counterpartyId === filter.counterpartyId)
    && (!filter.holderId || d.holderId === filter.holderId));
}

/** Whether a project is the player's own, by hand or through a company they control. */
export function isPlayersProject(sim: Simulation, project: Project): boolean {
  const playerId = sim.universe.playerId;
  if (project.createdById === playerId) return true;
  if (!project.ownerCompanyId) return false;
  const company = sim.universe.companies[project.ownerCompanyId];
  return Boolean(company?.ownerships.some((o) => o.holderId === playerId && o.percent > 0));
}

/** The markets a year's chart has counted anything in, the United States first. */
export function marketsCounted(sim: Simulation, year: number): string[] {
  const u = stores(sim);
  const markets = Object.keys(u.boxOffice.yearToDate[String(year)] ?? {});
  return ['us', ...markets.filter((m) => m !== 'us').sort()].filter((m, i, all) => all.indexOf(m) === i && (m === 'us' || markets.includes(m)));
}

/** Market share for a calendar year in one market of the save, biggest first. */
export function marketShare(sim: Simulation, year: number, market = 'us'): { studioId: string; name: string; gross: Money; share: number }[] {
  const u = stores(sim);
  const table = u.boxOffice.yearToDate[String(year)]?.[market] ?? {};
  const total = Object.values(table).reduce((a, b) => a + b, 0);
  return Object.entries(table)
    .map(([studioId, gross]) => ({ studioId, name: studioId === 'other' ? 'Everyone Else' : STUDIOS.get(studioId)?.name ?? studioId, gross, share: total > 0 ? gross / total : 0 }))
    .sort((a, b) => b.gross - a.gross);
}

/** Where a studio ranks in its home market's year, or undefined when it released nothing there. */
export function marketRank(sim: Simulation, studioId: string, year: number, market = STUDIOS.get(studioId)?.countryId ?? 'us'): { rank: number; gross: Money; share: number; market: string } | undefined {
  const table = marketShare(sim, year, market).filter((r) => r.studioId !== 'other');
  const index = table.findIndex((r) => r.studioId === studioId);
  if (index < 0) return undefined;
  const row = table[index]!;
  return { rank: index + 1, gross: row.gross, share: row.share, market };
}
