import { titleCaseLabel } from '@/engine/core/text';
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { activeScene } from '@/engine/systems/scenes';
import { Panel, Stat, Meter, Empty, Modal } from '@/ui/components/primitives';
import { PLATFORMS, PLATFORM_BY_ID, accountSummary, sponsorshipRate, computePostQuality } from '@/engine/systems/media';
import type { PostFormat } from '@/engine/domain/model';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate, formatTime } from '@/engine/core/time';

const REACTION_LABEL: Record<'hit' | 'fine' | 'flop', string> = { hit: 'A Hit', fine: 'Fine', flop: 'A Flop' };

export function SocialWorkspace() {
  const { sim, run } = useGame();
  const accounts = useWorld((s) => Object.values(s.universe.socialAccounts).filter((a) => a.ownerId === s.player.id));
  const deals = useWorld((s) => Object.values(s.universe.brandDeals).filter((d) => d.personId === s.player.id).sort((a, b) => b.offeredAt - a.offeredAt));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const scene = useWorld(activeScene);

  const selected = accounts.find((a) => a.id === selectedId) ?? accounts[0];
  const summary = useWorld((s) => (selected ? accountSummary(s, selected.id) : undefined));

  const missing = PLATFORMS.filter((p) => !accounts.some((a) => a.platform === p.id));

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Social</div>
        <h1>{accounts.reduce((s, a) => s + a.followers, 0).toLocaleString('en-US')} Followers</h1>
        <p className="muted">
          Four platforms with genuinely different mechanics. Reach depends on quality, audience,
          consistency, momentum and timing. Posting guarantees nothing.
        </p>
      </div>

      {missing.length > 0 && (
        <Panel title="Platforms You Are Not On" flush>
          <div className="list">
            {missing.map((platform) => (
              <div key={platform.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{platform.name}</div>
                  <div className="xs dim">{platform.tagline}</div>
                  <div className="xs muted" style={{ marginTop: 2 }}>{platform.bestFor}</div>
                </div>
                <button
                  className="btn btn-sm"
                  onClick={() => run('social.create_account', {
                    platform: platform.id,
                    handle: sim.player.displayName.toLowerCase().replace(/[^a-z0-9]/g, ''),
                  })}
                >
                  Create Account
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {accounts.length > 0 && (
        <>
          <div className="row wrap gap-2" style={{ margin: 'var(--s5) 0 var(--s4)' }}>
            {accounts.map((account) => (
              <button
                key={account.id} className="chip" aria-pressed={selected?.id === account.id}
                onClick={() => setSelectedId(account.id)}
                style={selected?.id === account.id ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)' } : undefined}
              >
                {PLATFORM_BY_ID[account.platform].name} · {account.followers.toLocaleString('en-US')}
              </button>
            ))}
          </div>

          {selected && summary && (
            <>
              <div className="grid grid-4" style={{ marginBottom: 'var(--s5)' }}>
                <Stat label="Followers" value={selected.followers.toLocaleString('en-US')} note={`@${selected.handle}`} />
                <Stat label="Last 30 Days" value={`${summary.followersGainedLast30 >= 0 ? '+' : ''}${summary.followersGainedLast30.toLocaleString('en-US')}`}
                  tone={summary.followersGainedLast30 >= 0 ? 'positive' : 'negative'} />
                <Stat label="Impressions" value={summary.impressionsLast30.toLocaleString('en-US')} note="last 30 days" />
                <Stat label="Lifetime Earnings" value={formatMoneyCompact(selected.lifetimeEarnings)}
                  note={selected.monetisationEnabled ? `${formatMoney(selected.effectiveCpm)} CPM` : 'not monetised'} />
              </div>

              <div className="grid grid-2" style={{ marginBottom: 'var(--s5)' }}>
                <Panel title="Momentum And Audience">
                  <Meter label="Momentum" value={selected.momentum} hint="How the algorithm currently reads your recent work." />
                  <div style={{ marginTop: 'var(--s4)' }}>
                    <div className="eyebrow" style={{ marginBottom: 'var(--s2)' }}>Audience segments</div>
                    {selected.segments.map((segment) => (
                      <div key={segment.key} className="row-between" style={{ padding: '3px 0' }}>
                        <span className="small">{titleCaseLabel(segment.key.replace(/_/g, ' '))}</span>
                        <span className="mono small">{segment.size.toLocaleString('en-US')}</span>
                      </div>
                    ))}
                  </div>
                  {!selected.monetisationEnabled && (
                    <div className="callout" style={{ marginTop: 'var(--s3)' }}>
                      Monetisation unlocks at {PLATFORM_BY_ID[selected.platform].monetisationThreshold.toLocaleString('en-US')} followers.
                    </div>
                  )}
                </Panel>

                <Panel title="What A Sponsored Post Is Worth">
                  <Stat label="Estimated Rate" value={formatMoneyCompact(sponsorshipRate(selected))} note="per post at your current reach" />
                  <p className="xs dim" style={{ marginTop: 'var(--s3)' }}>
                    {PLATFORM_BY_ID[selected.platform].bestFor}
                  </p>
                  <button className="btn btn-primary" style={{ marginTop: 'var(--s3)', marginRight: 'var(--s2)' }} disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'social.compose', input: { accountId: selected.id } })}>
                    Compose It
                  </button>
                  <button className="btn" style={{ marginTop: 'var(--s3)' }} onClick={() => setPosting(true)}>
                    Make A Post
                  </button>
                </Panel>
              </div>

              <Panel title="Posts" flush>
                {summary.posts.length === 0 ? (
                  <Empty title="Nothing Posted" body="An account with no content is not an audience." />
                ) : (
                  <div className="list">
                    {summary.posts.slice(0, 25).map((post) => (
                      <div key={post.id} className="list-item list-static">
                        <div className="grow">
                          <div className="small strong">
                            {post.title} {post.viral && <span className="chip chip-accent">Viral</span>}
                          </div>
                          <div className="xs dim">
                            {titleCaseLabel(post.format.replace(/_/g, ' '))} · quality {post.quality} ·{' '}
                            {formatDate(post.postedAt, sim.homeZone)} at {formatTime(post.postedAt, sim.homeZone)}
                          </div>
                          {post.reactions ? (
                            <div className="xs" style={{ marginTop: 4 }}>
                              <span className={`chip ${post.reactions.band === 'hit' ? 'chip-accent' : ''}`}>{REACTION_LABEL[post.reactions.band]}</span>{' '}
                              <span className="muted">{post.reactions.summary}</span>
                              {post.reactions.comments.length > 0 && (
                                <div className="dim" style={{ marginTop: 2 }}>{post.reactions.comments.map((c) => `“${c}”`).join(' · ')}</div>
                              )}
                            </div>
                          ) : post.status === 'published' ? (
                            <div className="xs muted" style={{ marginTop: 4 }}>The audience gets a day.</div>
                          ) : null}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="mono small">{post.metrics.impressions.toLocaleString('en-US')}</div>
                          <div className="xs dim">Impressions</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className={`mono small ${post.metrics.followersGained >= 0 ? 'positive' : 'negative'}`}>
                            {post.metrics.followersGained >= 0 ? '+' : ''}{post.metrics.followersGained}
                          </div>
                          <div className="xs dim">Followers</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </>
          )}
        </>
      )}

      <Panel title="Brand Deals" flush>
        {deals.length === 0 ? (
          <Empty title="No Offers Yet" body="Brands come to you once your audience is large enough and your momentum is good." />
        ) : (
          <div className="list">
            {deals.map((deal) => (
              <div key={deal.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{deal.brandName}</div>
                  <div className="xs dim">
                    {deal.deliverables.map((d) => `${d.delivered}/${d.count} ${titleCaseLabel(d.format.replace(/_/g, ' '))}`).join(', ')} ·
                    due {formatDate(deal.deadlineAt, sim.homeZone)}
                    {deal.exclusivityCategory && ` · exclusive in ${deal.exclusivityCategory}`}
                  </div>
                </div>
                <span className="mono small">{formatMoneyCompact(deal.compensation)}</span>
                <span className={`chip ${deal.status === 'completed' ? 'chip-positive' : deal.status === 'breached' ? 'chip-negative' : ''}`}>
                  {titleCaseLabel(deal.status)}
                </span>
                {deal.status === 'offered' && (
                  <>
                    <button className="btn btn-sm btn-primary" onClick={() => run('social.respond_to_deal', { dealId: deal.id, accept: true })}>Accept</button>
                    <button className="btn btn-sm" onClick={() => run('social.respond_to_deal', { dealId: deal.id, accept: false })}>Decline</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {posting && selected && <PostDialog accountId={selected.id} onClose={() => setPosting(false)} />}
    </>
  );
}

function PostDialog({ accountId, onClose }: { accountId: string; onClose: () => void }) {
  const { sim, run } = useGame();
  const account = sim.universe.socialAccounts[accountId];
  const platform = account ? PLATFORM_BY_ID[account.platform] : undefined;
  const [format, setFormat] = useState<PostFormat>(platform?.formats[0] ?? 'photo');
  const [title, setTitle] = useState('');
  const [effort, setEffort] = useState(60);
  const [topic, setTopic] = useState('general');

  if (!account || !platform) return null;

  const projected = computePostQuality(sim, sim.player, format, effort);
  const activeDeal = Object.values(sim.universe.brandDeals).find(
    (d) => d.personId === sim.player.id && d.status === 'active'
      && d.deliverables.some((line) => line.format === format && line.delivered < line.count),
  );

  const submit = () => {
    const result = run('social.create_post', {
      accountId, format, title: title || 'Untitled', effortMinutes: effort, topic,
      brandDealId: activeDeal?.id,
    });
    if (result.ok) onClose();
  };

  return (
    <Modal
      title={`Post to ${platform.name}`}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Publish</button></>}
    >
      <div className="field">
        <label htmlFor="format">Format</label>
        <select id="format" value={format} onChange={(e) => setFormat(e.target.value as PostFormat)}>
          {platform.formats.map((f) => <option key={f} value={f}>{titleCaseLabel(f.replace(/_/g, ' '))}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="title">What Is It</label>
        <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A short description" />
      </div>
      <div className="field">
        <div className="row-between">
          <label htmlFor="effort" style={{ marginBottom: 0 }}>Effort (Minutes)</label>
          <span className="mono">{effort}</span>
        </div>
        <input id="effort" type="range" min={5} max={480} step={5} value={effort} onChange={(e) => setEffort(Number(e.target.value))} />
      </div>
      <div className="field">
        <label htmlFor="topic">Topic</label>
        <select id="topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="general">General</option>
          <option value="behind_the_scenes">Behind The Scenes</option>
          <option value="craft">Craft And Process</option>
          <option value="personal">Personal</option>
          <option value="promotion">Promoting Something</option>
        </select>
      </div>

      <div className="grid grid-2">
        <Stat label="Projected Quality" value={projected} note="from your skills, effort and gear" />
        <Stat label="Time Cost" value={`${Math.round(effort / 60 * 10) / 10}h`} note="taken out of your day" />
      </div>

      {activeDeal && (
        <div className="callout callout-accent" style={{ marginTop: 'var(--s4)' }}>
          This counts toward your {activeDeal.brandName} deliverables.
        </div>
      )}

      <p className="xs dim" style={{ marginTop: 'var(--s4)' }}>
        {platform.name} rewards {platform.consistencyWeight > 0.7 ? 'consistency heavily' : 'individual hits'} and has a{' '}
        {platform.halfLifeDays}-day half-life. Discovery bias is {Math.round(platform.discoveryBias * 100)}%, so
        {platform.discoveryBias > 0.6 ? ' a post can find people who have never heard of you.' : ' your existing audience matters most.'}
      </p>
    </Modal>
  );
}
