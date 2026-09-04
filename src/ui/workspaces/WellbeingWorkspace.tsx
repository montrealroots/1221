import { titleCaseLabel } from '@/engine/core/text';
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Meter, Empty } from '@/ui/components/primitives';
import { ACTIVITIES, readiness, wellbeingSummary } from '@/engine/systems/life';
import { RECIPES, CATALOG } from '@/engine/content/catalog';
import { formatMoney } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';

export function WellbeingWorkspace() {
  const { sim, run } = useGame();
  const player = useWorld((s) => s.player);
  const pantry = useWorld((s) => Object.values(s.universe.pantry));
  const [minutes, setMinutes] = useState<Record<string, number>>({});

  const w = player.wellbeing;
  const ready = readiness(player);

  const canCook = (recipeId: string) => {
    const recipe = RECIPES.get(recipeId);
    if (!recipe) return false;
    return recipe.ingredients.every((ing) => {
      const have = pantry.filter((p) => p.catalogId === ing.catalogId && p.expiresAt > sim.now)
        .reduce((s, p) => s + p.quantity, 0);
      return have >= ing.quantity;
    });
  };

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Wellbeing</div>
        <h1>{wellbeingSummary(player)}</h1>
        <p className="muted">
          A game state, not a medical model. It decides how well you perform at everything else.
        </p>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--s5)' }}>
        <Panel title="Right Now">
          <div className="col gap-4">
            <Meter label="Readiness" value={ready} hint="The single number auditions, shoot days and interviews read." />
            <Meter label="Energy" value={w.energy} />
            <Meter label="Stress" value={w.stress} invert />
            <Meter label="Nourishment" value={w.nourishment} />
            <Meter label="Condition" value={w.condition} />
            <Meter label="Fitness" value={w.fitness} />
            <Meter label="Travel Fatigue" value={w.travelFatigue} invert />
            <div>
              <div className="row-between xs" style={{ marginBottom: 3 }}>
                <span className="muted">Sleep debt</span>
                <span className="mono">{w.sleepDebt.toFixed(1)} hours</span>
              </div>
              <div className="meter meter-negative">
                <span style={{ width: `${Math.min(100, (w.sleepDebt / 30) * 100)}%` }} />
              </div>
              <div className="xs dim" style={{ marginTop: 2 }}>
                Debt makes every hour awake cost more and every performance worse.
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Cook Something" subtitle="Uses what is actually in your kitchen." flush>
          {pantry.length === 0 ? (
            <Empty title="Empty Kitchen" body="Buy groceries before you can cook. Shopping has a grocery section." />
          ) : (
            <div className="list">
              {RECIPES.all().map((recipe) => {
                const possible = canCook(recipe.id);
                return (
                  <div key={recipe.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{recipe.name}</div>
                      <div className="xs dim">
                        {recipe.meal} · {recipe.prepMinutes} min · serves {recipe.servings}
                      </div>
                      <div className="xs dim">
                        {recipe.ingredients.map((i) => CATALOG.get(i.catalogId)?.name ?? i.catalogId).join(', ')}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm"
                      disabled={!possible}
                      onClick={() => run('life.cook', { recipeId: recipe.id })}
                    >
                      {possible ? 'Cook' : 'Missing items'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="How You Spend The Day" subtitle="Everything here takes real world time and changes real state." flush>
        <div className="list">
          {ACTIVITIES.map((activity) => {
            const duration = minutes[activity.id] ?? activity.minutes;
            return (
              <div key={activity.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{activity.name}</div>
                  <div className="xs dim">{activity.description}</div>
                  <div className="xs dim" style={{ marginTop: 2 }}>
                    {Object.entries(activity.perHour).map(([key, value]) => (
                      <span key={key} className={value > 0 ? 'positive' : 'negative'} style={{ marginRight: 8 }}>
                        {key} {value > 0 ? '+' : ''}{value}/h
                      </span>
                    ))}
                    {activity.practises?.map((p) => (
                      <span key={p.key} className="chip" style={{ marginRight: 4 }}>{titleCaseLabel(p.key.replace(/_/g, ' '))}</span>
                    ))}
                  </div>
                </div>
                {activity.variableDuration && (
                  <input
                    type="number"
                    style={{ width: 76 }}
                    min={activity.variableDuration.min}
                    max={activity.variableDuration.max}
                    value={duration}
                    onChange={(e) => setMinutes((m) => ({ ...m, [activity.id]: Number(e.target.value) }))}
                    aria-label={`Minutes for ${activity.name}`}
                  />
                )}
                <div style={{ textAlign: 'right', minWidth: 70 }}>
                  <div className="xs dim">{duration} min</div>
                  {activity.cost ? <div className="xs mono">{formatMoney(activity.cost)}</div> : null}
                </div>
                <button
                  className="btn btn-sm"
                  onClick={() => run('life.do_activity', { activityId: activity.id, minutes: duration })}
                >
                  Do it
                </button>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Pantry" flush>
        {pantry.length === 0 ? (
          <Empty title="Nothing In" body="No food in the house." />
        ) : (
          <div className="list">
            {pantry.map((item) => (
              <div key={item.id} className="list-item list-static">
                <div className="grow">
                  <div className="small">{item.name}</div>
                  <div className="xs dim">{item.storage} · expires {formatDate(item.expiresAt, sim.homeZone)}</div>
                </div>
                <span className="mono small">{item.quantity.toFixed(2)} {item.unit}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
