/**
 * The real networks.
 *
 * Parents, leadership, deals and reach are the record; the buyers a series
 * pitch goes to are these; the world's own series get a real network; a
 * film's streaming window follows its studio's published deal.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, migrate } from '@/engine';
import type { Id } from '@/engine/domain/model';
import { NETWORKS, NETWORK_KIND_ORDER, dealsForStudio, networkForBroadcaster, payOnePartner } from '@/engine/content/networks';
import { STUDIOS } from '@/engine/content/studios';
import { BUYERS, LEGACY_BUYER_NAMES } from '@/engine/content/industry';
import { COUNTRIES } from '@/engine/content/geography';
import { networkForBackgroundProject, seedIndependentProject } from '@/engine/systems/casting';
import { addDays } from '@/engine/core/time';

describe('the networks', () => {
  it('are real, each with a parent or owner, a home, leadership, a kind and deals that point at real studios', () => {
    const networks = NETWORKS.all();
    expect(networks.length).toBeGreaterThanOrEqual(70);
    const ids = new Set<string>();
    for (const n of networks) {
      expect(ids.has(n.id), `duplicate ${n.id}`).toBe(false);
      ids.add(n.id);
      expect(COUNTRIES.get(n.countryId), `${n.name} country`).toBeDefined();
      expect(NETWORK_KIND_ORDER).toContain(n.type);
      expect(n.leadership.length).toBeGreaterThan(0);
      for (const leader of n.leadership) {
        expect(leader.title.split(' ').every((w) => /^[A-Z0-9(]/.test(w) || ['And', 'Of', 'The', 'For'].includes(w)), leader.title).toBe(true);
        if (leader.source) expect(leader.source).toMatch(/^https?:\/\//);
      }
      for (const deal of n.deals) expect(STUDIOS.get(deal.studioId) ?? (deal.studioId === 'netflix' ? STUDIOS.get('netflix') : undefined), `${n.name} deal with ${deal.studioId}`).toBeDefined();
      expect(n.budgetFloor).toBeLessThan(n.budgetCeiling);
      expect(n.broadcasterNames.length).toBeGreaterThan(0);
      expect(STUDIOS.get(n.id), `${n.id} collides with a studio id`).toBeUndefined();
    }
    expect(NETWORKS.get('hbo-max')?.parent?.name).toMatch(/Warner Bros. Discovery/);
    expect(NETWORKS.get('peacock')?.leadership.some((l) => l.name === 'Matt Strauss')).toBe(true);
    expect(NETWORKS.get('bbc-one')?.leadership.some((l) => l.name === 'Matt Brittin')).toBe(true);
    expect(NETWORKS.get('usa-network')?.parent?.name).toMatch(/Versant/);
    expect(NETWORKS.get('showmax')?.status).toMatch(/wound down/);
  });

  it('know the published deals: where each studio\'s films go after cinemas', () => {
    expect(payOnePartner('sony')?.network.id).toBe('netflix-service');
    expect(payOnePartner('universal')?.network.id).toBe('peacock');
    expect(payOnePartner('a24')?.network.id).toBe('hbo-max');
    expect(payOnePartner('lionsgate')?.network.id).toBe('starz');
    expect(payOnePartner('neon')?.network.id).toBe('hulu');
    expect(payOnePartner('focus')?.network.id).toBe('peacock');
    expect(payOnePartner('searchlight')?.network.id).toBe('hulu');
    expect(payOnePartner('disney')?.network.id).toBe('disney-plus');
    expect(payOnePartner('warner')?.network.id).toBe('hbo-max');
    expect(payOnePartner('paramount')?.network.id).toBe('paramount-plus');
    expect(payOnePartner('amazon-mgm')?.network.id).toBe('prime-video');
    expect(payOnePartner('apple')?.network.id).toBe('apple-tv-plus');
    expect(payOnePartner('bleecker')).toBeUndefined();
    const sonyDeals = dealsForStudio('sony');
    expect(sonyDeals.some((d) => d.network.id === 'netflix-service' && d.deal.source)).toBe(true);
    expect(sonyDeals.some((d) => d.network.id === 'crunchyroll')).toBe(true);
  });

  it('match the broadcaster names the record uses', () => {
    expect(networkForBroadcaster('HBO')?.id).toBe('hbo');
    expect(networkForBroadcaster('American Broadcasting Company')?.id).toBe('abc');
    expect(networkForBroadcaster('tvN')?.id).toBe('tvn');
    expect(networkForBroadcaster('Disney+')?.id).toBe('disney-plus');
    expect(networkForBroadcaster('Nowhere Network')).toBeUndefined();
  });

  it('are the television buyers, and the placeholders are gone', () => {
    const buyers = BUYERS.all();
    expect(buyers.filter((b) => b.networkId).length).toBe(NETWORKS.all().length);
    expect(BUYERS.get('atlasnet')).toBeUndefined();
    expect(BUYERS.get('vertexcable')).toBeUndefined();
    expect(LEGACY_BUYER_NAMES.atlasnet).toBeDefined();
    expect(BUYERS.get('hbo')?.type).toBe('network');
    expect(BUYERS.get('netflix-service')?.type).toBe('streamer');
    expect(BUYERS.get('cbs')?.formats).not.toContain('feature');
  });
});

describe('the world', () => {
  it('gives its own series a real network that makes that kind of thing, at home', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'networks-seed');
    let series = 0;
    for (let i = 0; i < 40; i++) {
      const project = seedIndependentProject(sim, 300 + i);
      if (!project || (project.format !== 'series' && project.format !== 'limited_series')) continue;
      series++;
      expect(project.networkId, project.title).toBeDefined();
      const network = NETWORKS.get(project.networkId!)!;
      expect(project.distributorName).toBe(network.name);
      expect(network.formats).toContain(project.format);
    }
    expect(series).toBeGreaterThan(3);
    let korean = 0;
    for (let i = 0; i < 40; i++) {
      const n = networkForBackgroundProject(sim.rng('probe', i), { format: 'series', genres: ['romance'], productionCountryId: 'kr', budget: 8_000_000_00 } as never);
      if (n?.countryId === 'kr') korean++;
    }
    expect(korean).toBeGreaterThan(24);
  });

  it('sends a released film to its studio\'s pay-one partner and keeps a series where it was commissioned', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'networks-seed-2');
    const made = sim.execute<{ projectId: Id }>({ kind: 'film.create_project', payload: { title: 'The Hollow Circuit', format: 'feature', genres: ['thriller'], logline: 'A film.' } });
    const project = sim.universe.projects[made.value!.projectId]!;
    const rights = sim.execute({ kind: 'film.acquire_rights', payload: { projectId: project.id, title: project.title, sourceKind: 'original', acquisitionKind: 'purchase', cost: 0, holderId: sim.player.id, holderKind: 'person' } });
    expect(rights.ok, rights.error).toBe(true);
    Object.assign(project, { phase: 'post', finalQuality: 70, budget: 20_000_000_00, pictureLockedAt: sim.now, studioId: 'sony', distributorName: 'Sony Pictures' });
    const released = sim.execute<{ releaseId: Id }>({ kind: 'rel.set_distribution', payload: { projectId: project.id, strategy: 'wide_theatrical', openingDate: addDays(sim.now, 20, sim.homeZone) } });
    expect(released.ok, released.error).toBe(true);
    const release = sim.universe.releases[released.value!.releaseId]!;
    expect(release.streamingPartnerId).toBe('netflix-service');
    expect(release.streamingPartnerName).toBe('Netflix');

    const show = sim.execute<{ projectId: Id }>({ kind: 'film.create_project', payload: { title: 'Sentinel Row', format: 'series', genres: ['crime'], logline: 'A series.' } });
    const series = sim.universe.projects[show.value!.projectId]!;
    sim.execute({ kind: 'film.acquire_rights', payload: { projectId: series.id, title: series.title, sourceKind: 'original', acquisitionKind: 'purchase', cost: 0, holderId: sim.player.id, holderKind: 'person' } });
    Object.assign(series, { phase: 'post', finalQuality: 70, budget: 40_000_000_00, pictureLockedAt: sim.now, networkId: 'hbo', distributorName: 'HBO' });
    const aired = sim.execute<{ releaseId: Id }>({ kind: 'rel.set_distribution', payload: { projectId: series.id, strategy: 'streaming_exclusive', openingDate: addDays(sim.now, 20, sim.homeZone) } });
    expect(aired.ok, aired.error).toBe(true);
    expect(sim.universe.releases[aired.value!.releaseId]!.streamingPartnerId).toBe('hbo');
  });

  it('lapses a pitch still waiting on a placeholder network from an older save', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'networks-seed-3');
    const universe = sim.universe;
    universe.scheduled.push({ id: 'sched-atlas', at: sim.now + 1, kind: 'film.pitch_response', label: 'Atlas Network Response', category: 'career', payload: { projectId: 'p', buyerId: 'atlasnet', ask: 1 }, priority: 1 } as never);
    universe.meta.schemaVersion = 14;
    const result = migrate(universe);
    expect(result.migrated).toBe(true);
    expect(universe.scheduled.some((s) => s.id === 'sched-atlas')).toBe(false);
  });
});
