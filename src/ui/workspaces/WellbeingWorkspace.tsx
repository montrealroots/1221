import { titleCaseLabel } from '@/engine/core/text';
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Meter, Empty } from '@/ui/components/primitives';
import { ACTIVITIES, readiness, wellbeingSummary } from '@/engine/systems/life';
import { activeScene } from '@/engine/systems/scenes';
import { RECIPES, CATALOG } from '@/engine/content/catalog';
import { EQUIPMENT_LABEL, FITTED_KITCHEN, type EquipmentKind } from '@/engine/content/kitchen';
import { kitchenOf, othersAtHome } from '@/engine/systems/life';
import { formatMoney } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';

/** The wellbeing keys as labels. `sleepDebt` is stored camel-cased and shown as two words. */
const WELLBEING_LABEL: Readonly<Record<string, string>> = {
  energy: 'Energy', stress: 'Stress', sleepDebt: 'Sleep Debt', morale: 'Morale', condition: 'Condition',
  fitness: 'Fitness', travelFatigue: 'Travel Fatigue', nourishment: 'Nourishment', hygiene: 'Hygiene',
};

export function WellbeingWorkspace() {
  const { sim, run, navigate } = useGame();
  const player = useWorld((s) => s.player);
  const pantry = useWorld((s) => Object.values(s.universe.pantry));
  const scene = useWorld(activeScene);
  const [minutes, setMinutes] = useState<Record<string, number>>({});

  const w = player.wellbeing;
  const ready = readiness(player);

  const kitchen = useWorld((s) => kitchenOf(s, s.player.id));
  const atHome = useWorld((s) => othersAtHome(s, s.player.id));

  const haveFood = (recipeId: string) => {
    const recipe = RECIPES.get(recipeId);
    if (!recipe) return false;
    return recipe.ingredients.every((ing) => {
      const have = pantry.filter((p) => p.catalogId === ing.catalogId && p.expiresAt > sim.now)
        .reduce((s, p) => s + p.quantity, 0);
      return have >= ing.quantity;
    });
  };

  /** The kit a dish needs that is not in this kitchen, in words. */
  const missingKit = (recipeId: string) => {
    const recipe = RECIPES.get(recipeId);
    if (!recipe) return [] as string[];
    return recipe.equipment
      .filter((kind) => !kitchen.has(kind as EquipmentKind))
      .map((kind) => EQUIPMENT_LABEL[kind as EquipmentKind] ?? kind);
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
                <span className="muted">Sleep Debt</span>
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

        <Panel
          title="Cook Something"
          subtitle={atHome.length > 0
            ? `Uses what is in your kitchen. ${atHome.length} other ${atHome.length === 1 ? 'person is' : 'people are'} home to feed.`
            : 'Uses what is actually in your kitchen.'}
          flush
        >
          {pantry.length === 0 ? (
            <Empty title="Empty Kitchen" body="Buy groceries before you can cook. Shopping has a grocery section." />
          ) : (
            <div className="list">
              {RECIPES.all().map((recipe) => {
                const food = haveFood(recipe.id);
                const kit = missingKit(recipe.id);
                const possible = food && kit.length === 0;
                const needed = recipe.equipment.filter((k) => !(FITTED_KITCHEN as readonly string[]).includes(k));
                return (
                  <div key={recipe.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{recipe.name}</div>
                      <div className="xs dim">
                        {recipe.meal} · {recipe.prepMinutes} min · serves {recipe.servings}
                        {needed.length > 0
                          ? ` · needs ${needed.map((k) => EQUIPMENT_LABEL[k as EquipmentKind] ?? k).join(', ')}`
                          : ''}
                      </div>
                      <div className="xs dim">
                        {recipe.ingredients.map((i) => CATALOG.get(i.catalogId)?.name ?? i.catalogId).join(', ')}
                      </div>
                      {kit.length > 0 ? (
                        <div className="xs dim">You do not own {kit.join(', ')}. Appliances are in Shopping.</div>
                      ) : null}
                    </div>
                    <button
                      className="btn btn-sm"
                      disabled={!possible}
                      onClick={() => run('life.cook', { recipeId: recipe.id })}
                    >
                      {possible ? 'Cook' : kit.length > 0 ? 'No Equipment' : 'Missing Items'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="How You Spend The Day" subtitle="Play a thing out and decide as you go, or just do it. Both take real time and change real state." flush>
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
                        {WELLBEING_LABEL[key] ?? titleCaseLabel(key)} {value > 0 ? '+' : ''}{value}/h
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
                {activity.id === 'gym' ? (
                  <button className="btn btn-sm btn-primary" onClick={() => navigate('/workspace/city', 'The City')}>
                    Find A Gym
                  </button>
                ) : activity.id === 'cook' ? (
                  <span className="xs dim">Pick a recipe above</span>
                ) : (
                  <div className="row gap-1">
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={Boolean(scene)}
                      title={scene ? 'Finish or leave the scene you are in first.' : undefined}
                      onClick={() => run('scene.start', { definitionId: 'wellbeing.activity', input: { activityId: activity.id, minutes: duration } })}
                    >
                      Play It Out
                    </button>
                    <button
                      className="btn btn-sm"
                      disabled={Boolean(scene)}
                      title={scene ? 'Finish or leave the scene you are in first.' : 'The same thing, straight through.'}
                      onClick={() => run('scene.quick', { definitionId: 'wellbeing.activity', input: { activityId: activity.id, minutes: duration } }, { idempotencyKey: `quick:${activity.id}:${sim.now}` })}
                    >
                      Just Do It
                    </button>
                  </div>
                )}
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
