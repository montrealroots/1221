/**
 * SLATE — the end of a life.
 *
 * What a save shows once the player's life has ended (`systems/mortality.ts`):
 * who they were, the dates, where, and what the years came to, read out of
 * the save and the ledger rather than kept anywhere. The clock doesn't run
 * again. The way on is back to the slots, where the life stays until it is
 * deleted and another begins.
 */

import { useGame } from '@/app/game-context';
import { formatDate } from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { netWorth } from '@/engine/systems/finance';
import { CITIES } from '@/engine/content/geography';
import { PERFORMER_NOUN } from '@/engine/core/performer';
import { homeOf } from '@/engine/systems/earnings';

export function LifeEnded() {
  const { sim, exitToMenu } = useGame();
  const player = sim.player;
  const cur = saveCurrency(sim.universe);
  const endedAt = sim.universe.meta.endedAt ?? sim.now;
  const age = sim.universe.meta.endedAge;
  const town = CITIES.get(homeOf(player))?.name ?? 'where they lived';
  const worth = netWorth(sim, player.id);
  // What the work paid, from the record the returns read (`systems/earnings.ts`): acting's wages, residuals
  // among them, and work-study's, before tax and commission. Until 2026-09-27 it summed what the bank
  // was paid under a "tips" category that no longer existed, per diem and stipends among the wages.
  const earned = Object.values(player.earnings?.years ?? {}).reduce((sum, y) => sum + y.acting + y.workStudy, 0);
  const years = Math.max(0, (endedAt - sim.universe.meta.createdAt) / (365.2425 * 86_400_000));
  const money = (cents: number) => formatMoney(cents, cur, { cents: false });

  return (
    <div className="startup">
      <div className="startup-inner" style={{ width: 'min(720px, 92vw)', textAlign: 'center' }}>
        <div className="eyebrow">A Life, Ended</div>
        <h1 style={{ margin: 'var(--s2) 0' }}>{player.displayName}</h1>
        <p className="muted">
          {formatDate(player.birthInstant, sim.homeZone)} – {formatDate(endedAt, sim.zone)}
          {age !== undefined ? ` · Aged ${age}` : ''} · {PERFORMER_NOUN[player.performerTitle]} · {town}
        </p>
        <div className="grid grid-3" style={{ margin: 'var(--s5) 0', textAlign: 'left' }}>
          <div className="stat">
            <span className="stat-label">Years In The World</span>
            <span className="stat-value">{years < 1 ? `${Math.round(years * 12)} Months` : `${years.toFixed(1)} Years`}</span>
            <span className="stat-note">From the first morning to the last, in the world’s time</span>
          </div>
          <div className="stat">
            <span className="stat-label">Earned</span>
            <span className="stat-value mono">{money(earned)}</span>
            <span className="stat-note">Wages, before tax and commission</span>
          </div>
          <div className="stat">
            <span className="stat-label">Left Behind</span>
            <span className="stat-value mono">{money(worth.total)}</span>
            <span className="stat-note">What they were worth</span>
          </div>
        </div>
        <p className="small muted">
          The clock has stopped for this life. It stays in its slot until you delete it, and another can begin in any slot that's free.
        </p>
        <button className="btn btn-primary" style={{ marginTop: 'var(--s4)' }} onClick={exitToMenu}>
          Back To The Slots
        </button>
      </div>
    </div>
  );
}
