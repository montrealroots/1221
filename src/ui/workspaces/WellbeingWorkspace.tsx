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
import { plural } from '@/engine/core/text';
import { ageOf } from '@/engine/systems/lifespan';
import { SKILL_BY_ID } from '@/engine/domain/skills';
import { ATTRIBUTE_BY_ID } from '@/engine/domain/attributes';
import {
  artsOpenTo, describeTraining, friendCount, gradeOf, readyToGrade, trainingNow,
} from '@/engine/systems/theweek';
import {
  ARTS_NOTE, ART_BY_ID, CHILD_NOTE, CLASS_NOTE, GRADING_LABEL, GRADING_NOTE, SESSIONS_A_WEEK,
  WEEK_NOTE, WHEN_LABEL, type When, classesAt, doingsAt,
} from '@/engine/content/theweek';

/** The wellbeing keys as labels. `sleepDebt` is stored camel-cased and shown as two words. */
const WELLBEING_LABEL: Readonly<Record<string, string>> = {
  energy: 'Energy', stress: 'Stress', sleepDebt: 'Sleep Debt', morale: 'Morale', condition: 'Condition',
  fitness: 'Fitness', travelFatigue: 'Travel Fatigue', nourishment: 'Nourishment', hygiene: 'Hygiene',
};


/** What a thing builds, said in the name the sheet gives it. */
function nameOf(feed: { key: string; kind: 'skill' | 'attribute' }): string {
  const found = feed.kind === 'skill' ? SKILL_BY_ID[feed.key]?.name : ATTRIBUTE_BY_ID[feed.key]?.name;
  return found ?? titleCaseLabel(feed.key.replace(/_/g, ' '));
}

/**
 * The dojo, the classes and the hours around everything else.
 *
 * The arts are real and so are their grading systems. Everything about how far
 * a particular person gets is SLATE's own, and the notes at the foot of the
 * page say which is which.
 */
function TheWeekPanels(): JSX.Element {
  const { sim, run, toast } = useGame();
  const now = useWorld((s) => s.now);
  void now;
  const [when, setWhen] = useState<When>('evening');
  const age = ageOf(sim);
  const training = trainingNow(sim);
  const arts = artsOpenTo(sim).filter((one) => !training.some((two) => two.artId === one.id));
  const classes = classesAt(age);
  const doings = doingsAt(age, when);
  const friends = friendCount(sim);

  return (
    <>
      <Panel
        title="The Dojo"
        subtitle={training.length > 0
          ? `${plural(training.length, 'art')}, and ${plural(SESSIONS_A_WEEK, 'session')} a week is the limit.`
          : 'Nothing yet. Two at once is already more than most people manage.'}
        flush
      >
        <div className="list">
          {training.map((record) => {
            const art = ART_BY_ID[record.artId];
            if (!art) return null;
            const { held } = gradeOf(record);
            const ready = readyToGrade(sim, record);
            return (
              <div key={record.id} className="list-item">
                <div className="grow">
                  <div className="row-title">
                    {art.name}{held ? ` — ${held.label}` : ''}
                  </div>
                  <div className="xs dim">{describeTraining(record)}</div>
                  <div className="xs dim">{GRADING_LABEL[art.grading]} · {ready.why}</div>
                </div>
                <div className="row gap-2">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      const res = run<{ note: string }>('week.train', { artId: art.id });
                      if (res.ok) toast(res.value!.note, 'positive');
                    }}
                  >
                    Train
                  </button>
                  <button
                    className="btn btn-sm"
                    disabled={!ready.ready}
                    onClick={() => {
                      const res = run<{ note: string; passed: boolean }>('week.grade', { artId: art.id });
                      if (res.ok) toast(res.value!.note, res.value!.passed ? 'positive' : 'neutral');
                    }}
                  >
                    {ready.next ? `Grade For ${ready.next.label}` : 'No Grade To Take'}
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      const res = run<{ note: string }>('week.stop_training', { artId: art.id });
                      if (res.ok) toast(res.value!.note, 'neutral');
                    }}
                  >
                    Stop Going
                  </button>
                </div>
              </div>
            );
          })}
          {arts.map((art) => (
            <div key={art.id} className="list-item">
              <div className="grow">
                <div className="row-title">{art.name}</div>
                <div className="xs dim">
                  {art.origin} · {GRADING_LABEL[art.grading]} · {formatMoney(art.fee)} A Session
                </div>
                <div className="xs dim">{art.about}</div>
              </div>
              <button
                className="btn btn-sm"
                disabled={training.length >= 2}
                onClick={() => {
                  const res = run<{ note: string }>('week.start_training', { artId: art.id });
                  if (res.ok) toast(res.value!.note, 'positive');
                }}
              >
                {training.length >= 2 ? 'Two Is Enough' : 'Walk In'}
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Classes"
        subtitle={`${plural(classes.length, 'class', 'classes')} open to somebody ${age}.`}
        flush
      >
        <div className="list">
          {classes.map((lesson) => (
            <div key={lesson.id} className="list-item">
              <div className="grow">
                <div className="row-title">{lesson.label}</div>
                <div className="xs dim">
                  {plural(lesson.hours, 'hour')}
                  {lesson.fee > 0 ? ` · ${formatMoney(lesson.fee)}` : ' · Free'}
                  {' · '}
                  {lesson.feeds.map(nameOf).join(', ')}
                </div>
                <div className="xs dim">{lesson.about}</div>
              </div>
              <button
                className="btn btn-sm"
                onClick={() => {
                  const res = run<{ note: string }>('week.take_class', { classId: lesson.id });
                  if (res.ok) toast(res.value!.note, 'positive');
                }}
              >
                Go
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="The Rest Of The Week"
        subtitle={friends > 0
          ? `${plural(friends, 'friend')}, and some of this needs one.`
          : 'Nobody to do the social ones with yet.'}
        flush
      >
        <div className="row gap-2 wrap" style={{ padding: '0.5rem 0.75rem' }}>
          {(['lunch', 'gym_class', 'after_school', 'evening', 'weekend'] as const).map((one) => (
            <button
              key={one}
              className={`btn btn-sm${when === one ? ' btn-primary' : ''}`}
              onClick={() => setWhen(one)}
            >
              {WHEN_LABEL[one]}
            </button>
          ))}
        </div>
        <div className="list">
          {doings.map((doing) => (
            <div key={doing.id} className="list-item">
              <div className="grow">
                <div className="row-title">{doing.label}</div>
                <div className="xs dim">
                  {plural(doing.hours, 'hour')}
                  {doing.cost > 0 ? ` · ${formatMoney(doing.cost)}` : ' · Free'}
                  {doing.needsAFriend ? ' · Needs Somebody' : ''}
                  {' · '}
                  {doing.feeds.map(nameOf).join(', ')}
                </div>
                <div className="xs dim">{doing.about}</div>
              </div>
              <button
                className="btn btn-sm"
                disabled={doing.needsAFriend && friends === 0}
                onClick={() => {
                  const res = run<{ note: string }>('week.spend', { doingId: doing.id });
                  if (res.ok) toast(res.value!.note, 'positive');
                }}
              >
                {doing.needsAFriend && friends === 0 ? 'Nobody To Ask' : 'Do It'}
              </button>
            </div>
          ))}
          {doings.length === 0 && (
            <div className="list-item list-static">
              <div className="xs dim">Nothing here for somebody your age.</div>
            </div>
          )}
        </div>
      </Panel>

      <Panel title="What Is Real Here" subtitle="And what is SLATE’s own.">
        <div className="col gap-2">
          <p className="xs dim" style={{ margin: 0 }}>{ARTS_NOTE}</p>
          <p className="xs dim" style={{ margin: 0 }}>{GRADING_NOTE}</p>
          <p className="xs dim" style={{ margin: 0 }}>{CLASS_NOTE}</p>
          {age < 18 && <p className="xs dim" style={{ margin: 0 }}>{CHILD_NOTE}</p>}
          <p className="xs dim" style={{ margin: 0 }}>{WEEK_NOTE}</p>
        </div>
      </Panel>
    </>
  );
}

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
                      title={scene ? 'Finish or leave the scene you’re in first.' : undefined}
                      onClick={() => run('scene.start', { definitionId: 'wellbeing.activity', input: { activityId: activity.id, minutes: duration } })}
                    >
                      Play It Out
                    </button>
                    <button
                      className="btn btn-sm"
                      disabled={Boolean(scene)}
                      title={scene ? 'Finish or leave the scene you’re in first.' : 'The same thing, straight through.'}
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

      <TheWeekPanels />
    </>
  );
}
