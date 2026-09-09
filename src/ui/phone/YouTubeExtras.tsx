/**
 * The rest of the app: the channel page, the library, the studio and the
 * things a creator actually does with a channel once they have one.
 *
 * Kept beside the feed rather than inside it because these are different
 * screens with different jobs, and one file that held all of them would be a
 * file nobody could read. Everything here runs the same commands the engine
 * exposes; none of it is decoration.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { MS_DAY } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';
import { TOPIC_LABEL, type Topic } from '@/engine/content/channels';
import {
  MEMBER_TIERS, PREMIUM_MONTHLY, TIP_STEPS, buildPayout, channelPage, hasPremium,
  membershipsOf, payoutsOf, playlistsOf, specialList, streamsOf, videosIn,
} from '@/engine/systems/creator';
import { channelAnalytics, isSubscribed, myChannel, subscriptionsOf } from '@/engine/systems/video';
import type { CommunityPost, VideoChannel, VideoItem, VideoPlaylist } from '@/engine/domain/model';
import { BackGlyph, DownloadGlyph, SaveGlyph } from './Icons';

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

export function views(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1).replace('.0', '')}B`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return String(count);
}

export function ago(now: number, then: number): string {
  const days = Math.floor((now - then) / MS_DAY);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 31) { const w = Math.floor(days / 7); return `${w} week${w === 1 ? '' : 's'} ago`; }
  if (days < 365) { const m = Math.floor(days / 30); return `${m} month${m === 1 ? '' : 's'} ago`; }
  const y = Math.floor(days / 365);
  return `${y} year${y === 1 ? '' : 's'} ago`;
}

/**
 * A count with its noun, agreeing with itself. `views` alone gives 1 likes,
 * which every one of these apps gets right and a game should too.
 */
export function tally(count: number, one: string, many = `${one}s`): string {
  return `${views(count)} ${count === 1 ? one : many}`;
}

export function tint(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${hash} 46% 42%)`;
}

export function initials(name: string): string {
  const words = name.replace(/^@/, '').replace(/^The /, '').split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?';
}

export function Avatar({ name, size = 36, image }: { name: string; size?: number; image?: string }) {
  return (
    <span
      className="ph-avatar"
      style={{ background: tint(name), width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {image ? <img src={image} alt="" /> : initials(name)}
    </span>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="ph-yt-top">
      <button type="button" className="ph-iconbtn" aria-label="Back" onClick={onBack}><BackGlyph size={21} /></button>
      <b style={{ fontSize: 17, flex: 1, marginLeft: 10 }}>{title}</b>
    </div>
  );
}

// ---------------------------------------------------------------------------
// A channel's own page
// ---------------------------------------------------------------------------

type ChannelTab = 'videos' | 'shorts' | 'community' | 'live' | 'about';

export function ChannelPage({
  channel, now, onBack, say, renderRow,
}: {
  channel: VideoChannel; now: number;
  onBack: () => void;
  say: (text: string) => void;
  renderRow: (video: VideoItem) => React.ReactNode;
}) {
  const { run } = useGame();
  const [tab, setTab] = useState<ChannelTab>('videos');
  const page = useWorld((s) => channelPage(s, channel));
  const subscribed = useWorld((s) => isSubscribed(s, s.player.id, channel.id));
  const subscription = useWorld((s) => subscriptionsOf(s, s.player.id).find((sub) => sub.channelId === channel.id));
  const member = useWorld((s) => membershipsOf(s, s.player.id).find((m) => m.channelId === channel.id));
  const bell = subscription?.bell ?? (subscription?.notify ? 'all' : 'none');

  return (
    <>
      <Header title={channel.name} onBack={onBack} />
      <div className="ph-body">
        <div className="ph-banner">
          {channel.bannerImage
            ? <img src={channel.bannerImage} alt="" />
            : <span style={{ display: 'block', width: '100%', height: '100%', background: `linear-gradient(120deg, ${tint(channel.name)}, ${tint(channel.handle)})` }} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px 6px' }}>
          <Avatar name={channel.name} size={62} image={channel.avatarImage} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{channel.name}{channel.verified ? ' ✓' : ''}</div>
            <div className="ph-card-meta">
              @{channel.handle} · {views(channel.subscribers)} subscribers · {channel.uploads} videos
            </div>
          </div>
        </div>
        <p className="ph-card-meta" style={{ padding: '0 14px 10px' }}>{channel.about}</p>

        <div className="ph-chips" style={{ padding: '0 12px 10px' }}>
          <button
            type="button"
            className={`ph-sub-btn${subscribed ? ' ph-subbed' : ''}`}
            style={{ marginLeft: 0 }}
            onClick={() => {
              const result = run(subscribed ? 'video.unsubscribe' : 'video.subscribe', { channelId: channel.id });
              if (result.ok) say(subscribed ? `Unsubscribed from ${channel.name}.` : `Subscribed to ${channel.name}.`);
            }}
          >
            {subscribed ? 'Subscribed' : 'Subscribe'}
          </button>
          {channel.membershipMonthly !== undefined && (
            member ? (
              <button
                type="button"
                className="ph-chip"
                onClick={() => {
                  const result = run('video.leave_channel', { channelId: channel.id });
                  if (result.ok) say('Membership ended.');
                }}
              >
                Member · Cancel
              </button>
            ) : (
              <button
                type="button"
                className="ph-chip ph-on"
                onClick={() => {
                  const result = run<{ monthly: number }>('video.join_channel', { channelId: channel.id, tier: 'supporter' });
                  if (result.ok) say(`You’re a member of ${channel.name}. ${formatMoney(result.value!.monthly)} a month.`);
                }}
              >
                Join
              </button>
            )
          )}
        </div>

        {subscribed && (
          <div className="ph-chips" style={{ padding: '0 12px 8px' }}>
            {(['all', 'personalized', 'none'] as const).map((level) => (
              <button
                key={level}
                type="button"
                className={`ph-chip${bell === level ? ' ph-on' : ''}`}
                onClick={() => run('video.set_bell', { channelId: channel.id, bell: level })}
              >
                {level === 'all' ? 'All Notifications' : level === 'personalized' ? 'Personalized' : 'None'}
              </button>
            ))}
          </div>
        )}

        <div className="ph-chips" style={{ borderBottom: '1px solid var(--ph-line)', paddingBottom: 10 }}>
          {(['videos', 'shorts', 'community', 'live', 'about'] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={`ph-chip${tab === id ? ' ph-on' : ''}`}
              onClick={() => setTab(id)}
            >
              {id === 'videos' ? 'Videos' : id === 'shorts' ? 'Shorts' : id === 'community' ? 'Community' : id === 'live' ? 'Live' : 'About'}
            </button>
          ))}
        </div>

        {tab === 'videos' && (page.videos.length === 0
          ? <div className="ph-empty">No long videos on this channel.</div>
          : page.videos.map((video) => <span key={video.id}>{renderRow(video)}</span>))}

        {tab === 'shorts' && (page.shorts.length === 0
          ? <div className="ph-empty">No shorts on this channel.</div>
          : page.shorts.map((video) => <span key={video.id}>{renderRow(video)}</span>))}

        {tab === 'community' && (page.community.length === 0
          ? <div className="ph-empty">This channel hasn’t posted anything.</div>
          : page.community.map((post) => <CommunityCard key={post.id} post={post} now={now} />))}

        {tab === 'live' && (page.streams.length === 0
          ? <div className="ph-empty">No streams yet.</div>
          : page.streams.map((stream) => (
            <div key={stream.id} className="ph-panel">
              <h4>{stream.title}</h4>
              <p>
                {ago(now, stream.startedAt)} · {stream.minutes} minutes · peak {views(stream.peakViewers)} watching
              </p>
              <p style={{ marginTop: 4 }}>{views(stream.chatMessages)} messages in the chat.</p>
            </div>
          )))}

        {tab === 'about' && (
          <div className="ph-panel">
            <h4>About</h4>
            <p>{channel.about}</p>
            <p style={{ marginTop: 6 }}>
              {TOPIC_LABEL[channel.topic as Topic] ?? channel.topic} · joined {ago(now, channel.createdAt)} ·
              {' '}{views(channel.totalViews)} views
            </p>
            <p style={{ marginTop: 6 }}>
              Uploads about every {channel.cadenceDays} day{channel.cadenceDays === 1 ? '' : 's'}.
              {channel.membershipMonthly !== undefined
                && ` Memberships from ${formatMoney(channel.membershipMonthly)} a month, ${views(channel.members ?? 0)} members.`}
            </p>
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>
    </>
  );
}

function CommunityCard({ post, now }: { post: CommunityPost; now: number }) {
  const { run } = useGame();
  const total = (post.options ?? []).reduce((sum, o) => sum + o.votes, 0) || 1;
  return (
    <div className="ph-panel">
      <p style={{ color: 'var(--ph-text)' }}>{post.text}</p>
      {post.options && (
        <div style={{ marginTop: 10 }}>
          {post.options.map((option, index) => (
            <div key={option.label} style={{ marginBottom: 8 }}>
              <button
                type="button"
                className={`ph-chip${post.votedFor === index ? ' ph-on' : ''}`}
                style={{ width: '100%', textAlign: 'left' }}
                disabled={post.votedFor !== undefined}
                onClick={() => run('video.vote_poll', { postId: post.id, option: index })}
              >
                {option.label}
              </button>
              {post.votedFor !== undefined && (
                <>
                  <div className="ph-bar" style={{ marginTop: 4 }}>
                    <i style={{ width: `${Math.round((option.votes / total) * 100)}%` }} />
                  </div>
                  <span className="ph-card-meta">{Math.round((option.votes / total) * 100)}%</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <p style={{ marginTop: 6 }}>{ago(now, post.at)} · {views(post.likes)} likes · {views(post.commentCount)} comments</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The library
// ---------------------------------------------------------------------------

export function LibraryPage({
  onBack, say, renderRow,
}: {
  onBack: () => void;
  say: (text: string) => void;
  renderRow: (video: VideoItem) => React.ReactNode;
}) {
  const { run } = useGame();
  const lists = useWorld((s) => playlistsOf(s, s.player.id));
  const [openId, setOpenId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const open = lists.find((l) => l.id === openId);
  const contents = useWorld((s) => (open ? videosIn(s, open) : []));

  if (open) {
    return (
      <>
        <Header title={open.title} onBack={() => setOpenId(null)} />
        <div className="ph-body">
          <p className="ph-card-meta" style={{ padding: '8px 12px' }}>
            {contents.length} video{contents.length === 1 ? '' : 's'} · {open.visibility}
          </p>
          {contents.length === 0
            ? <div className="ph-empty">Nothing saved here yet.</div>
            : contents.map((video) => (
              <span key={video.id}>
                {renderRow(video)}
                <button
                  type="button"
                  className="ph-pill"
                  style={{ margin: '0 12px 10px' }}
                  onClick={() => run('video.remove_from_playlist', { playlistId: open.id, videoId: video.id })}
                >
                  Remove
                </button>
              </span>
            ))}
          {open.kind === 'playlist' && (
            <button
              type="button"
              className="ph-pill"
              style={{ margin: '10px 12px' }}
              onClick={() => {
                const result = run('video.delete_playlist', { playlistId: open.id });
                if (result.ok) { setOpenId(null); say(`Deleted ${open.title}.`); }
              }}
            >
              Delete This Playlist
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Library" onBack={onBack} />
      <div className="ph-body">
        {lists.map((list) => (
          <button key={list.id} type="button" className="ph-row" onClick={() => setOpenId(list.id)}>
            <span className="ph-row-thumb">
              <span
                className="ph-thumb"
                style={{ background: `linear-gradient(140deg, ${tint(list.title)}, ${tint(list.kind)})` }}
              >
                <span className="ph-thumb-mark" aria-hidden="true">{list.videoIds.length}</span>
              </span>
            </span>
            <span className="ph-row-text">
              <span className="ph-card-title">{list.title}</span>
              <span className="ph-card-meta">
                {list.kind === 'playlist' ? 'Playlist' : list.kind === 'liked' ? 'Everything you liked' : 'Saved for later'}
                {' · '}{list.videoIds.length} video{list.videoIds.length === 1 ? '' : 's'}
              </span>
            </span>
          </button>
        ))}
        <div style={{ padding: '12px' }}>
          <label className="ph-label" htmlFor="ph-newlist">New Playlist</label>
          <input
            id="ph-newlist"
            className="ph-input"
            value={newTitle}
            placeholder="Name it"
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button
            type="button"
            className="ph-pill ph-on"
            style={{ marginTop: 8 }}
            onClick={() => {
              const result = run('video.create_playlist', { title: newTitle });
              if (result.ok) { setNewTitle(''); say('Playlist made.'); }
            }}
          >
            Create
          </button>
        </div>
      </div>
    </>
  );
}

/** The sheet that comes up when you save a video somewhere. */
export function SaveSheet({
  video, onClose, say,
}: { video: VideoItem; onClose: () => void; say: (text: string) => void }) {
  const { run } = useGame();
  const lists = useWorld((s) => playlistsOf(s, s.player.id));
  return (
    <div className="ph-panel">
      <h4>Save To</h4>
      {lists.map((list) => (
        <button
          key={list.id}
          type="button"
          className="ph-pill"
          style={{ margin: '6px 6px 0 0' }}
          onClick={() => {
            const result = run('video.save_to_playlist', { playlistId: list.id, videoId: video.id });
            if (result.ok) { say(`Saved to ${list.title}.`); onClose(); }
          }}
        >
          {list.title}
        </button>
      ))}
      <button type="button" className="ph-pill" style={{ margin: '6px 0 0' }} onClick={onClose}>Close</button>
    </div>
  );
}

/** The tip sheet under a video, at the amounts people actually give. */
export function TipSheet({
  video, onClose, say,
}: { video: VideoItem; onClose: () => void; say: (text: string) => void }) {
  const { run } = useGame();
  return (
    <div className="ph-panel">
      <h4>Say Thanks</h4>
      <p>The channel keeps most of it. The platform keeps the rest.</p>
      <div className="ph-actions" style={{ padding: '10px 0 0' }}>
        {TIP_STEPS.map((amount) => (
          <button
            key={amount}
            type="button"
            className="ph-pill"
            onClick={() => {
              const result = run('video.tip', { videoId: video.id, amount });
              if (result.ok) { say(`${formatMoney(amount)} sent.`); onClose(); }
            }}
          >
            {formatMoney(amount)}
          </button>
        ))}
        <button type="button" className="ph-pill" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The studio
// ---------------------------------------------------------------------------

export function StudioPage({ onBack, say }: { onBack: () => void; say: (text: string) => void }) {
  const { run } = useGame();
  const channel = useWorld(myChannel);
  const stats = useWorld((s) => (channel ? channelAnalytics(s, channel.id) : undefined));
  const account = useWorld((s) => (channel?.accountId ? s.universe.socialAccounts[channel.accountId] : undefined));
  const payouts = useWorld((s) => (channel?.accountId ? payoutsOf(s, channel.accountId) : []));
  const estimate = useWorld((s) => (channel?.accountId ? buildPayout(s, channel.accountId, s.now - 30 * MS_DAY) : undefined));
  const streams = useWorld((s) => (channel ? streamsOf(s, channel.id) : []));
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState(90);
  const [post, setPost] = useState('');
  const [pollA, setPollA] = useState('');
  const [pollB, setPollB] = useState('');

  if (!channel || !stats) {
    return (
      <>
        <Header title="Studio" onBack={onBack} />
        <div className="ph-body"><div className="ph-empty"><b>No Channel</b>Make one on the You tab first.</div></div>
      </>
    );
  }

  const peak = Math.max(1, ...stats.daily);
  return (
    <>
      <Header title="Studio" onBack={onBack} />
      <div className="ph-body">
        <div className="ph-panel">
          <h4>Last 28 Days</h4>
          <div className="ph-spark" aria-label="Views over the last twenty eight days">
            {stats.daily.map((value, index) => (
              <i key={index} style={{ height: `${Math.max(2, (value / peak) * 100)}%` }} />
            ))}
          </div>
          <p style={{ marginTop: 8 }}>
            {views(stats.viewsLast28)} views · {Math.round(stats.averageRetention * 100)}% average retention ·
            {' '}median {views(stats.median)}
          </p>
        </div>

        {estimate && (
          <div className="ph-panel">
            <h4>Estimated Revenue This Month</h4>
            <p style={{ fontSize: 20, color: 'var(--ph-text)', fontWeight: 600, margin: '4px 0 8px' }}>
              {formatMoney(estimate.total)}
            </p>
            <RevenueLine label="Advertising" amount={estimate.ads} total={estimate.total} />
            <RevenueLine label="Premium Watch Time" amount={estimate.premium} total={estimate.total} />
            <RevenueLine label="Memberships" amount={estimate.memberships} total={estimate.total} />
            <RevenueLine label="Tips" amount={estimate.tips} total={estimate.total} />
            <RevenueLine label="Sponsorship" amount={estimate.sponsorship} total={estimate.total} />
            <p style={{ marginTop: 8 }}>
              {estimate.monetizedViews.toLocaleString('en-US')} monetized views.
              {account?.monetisationEnabled
                ? ` About ${formatMoney(estimate.monetizedViews > 0 ? Math.round((estimate.ads / estimate.monetizedViews) * 1000) : 0)} per thousand after the platform's share.`
                : ' Nothing pays until the channel is past the threshold.'}
            </p>
          </div>
        )}

        {payouts.length > 0 && (
          <>
            <div className="ph-section-head">Paid Out</div>
            {payouts.slice(0, 6).map((payout) => (
              <div key={payout.id} className="ph-panel">
                <h4>{new Date(payout.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h4>
                <p>{formatMoney(payout.total)} in total, {payout.paidAt ? 'paid' : 'pending'}.</p>
                <p style={{ marginTop: 4 }}>
                  Ads {formatMoney(payout.ads)} · Premium {formatMoney(payout.premium)} ·
                  {' '}Memberships {formatMoney(payout.memberships)} · Tips {formatMoney(payout.tips)}
                </p>
              </div>
            ))}
          </>
        )}

        <div className="ph-section-head">Go Live</div>
        <div className="ph-panel">
          <label className="ph-label" htmlFor="ph-live">Title</label>
          <input id="ph-live" className="ph-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          <label className="ph-label" htmlFor="ph-livemin">{minutes} Minutes</label>
          <input
            id="ph-livemin" className="ph-input" type="range" min={10} max={300} step={10}
            value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}
          />
          <button
            type="button"
            className="ph-pill ph-on"
            style={{ marginTop: 10 }}
            onClick={() => {
              const result = run<{ peak: number; tips: number }>('video.go_live', { title, minutes });
              if (result.ok) {
                setTitle('');
                say(`${views(result.value!.peak)} watching at the peak, ${formatMoney(result.value!.tips)} in tips.`);
              }
            }}
          >
            Start The Stream
          </button>
          {streams.length > 0 && (
            <p style={{ marginTop: 8 }}>
              Last one: {streams[0]!.title}, peak {views(streams[0]!.peakViewers)}.
            </p>
          )}
        </div>

        <div className="ph-section-head">Community Post</div>
        <div className="ph-panel">
          <label className="ph-label" htmlFor="ph-cpost">Say Something</label>
          <textarea id="ph-cpost" className="ph-input" rows={2} value={post} onChange={(e) => setPost(e.target.value)} />
          <label className="ph-label">Or Make It A Poll</label>
          <input className="ph-input" placeholder="First option" value={pollA} onChange={(e) => setPollA(e.target.value)} />
          <input
            className="ph-input"
            style={{ marginTop: 6 }}
            placeholder="Second option"
            value={pollB}
            onChange={(e) => setPollB(e.target.value)}
          />
          <button
            type="button"
            className="ph-pill ph-on"
            style={{ marginTop: 10 }}
            onClick={() => {
              const options = [pollA, pollB].filter((o) => o.trim().length > 0);
              const result = run('video.community_post', { text: post, options });
              if (result.ok) {
                setPost(''); setPollA(''); setPollB('');
                say(options.length >= 2 ? 'Poll posted.' : 'Posted to the community tab.');
              }
            }}
          >
            Post It
          </button>
        </div>
        <div style={{ height: 16 }} />
      </div>
    </>
  );
}

function RevenueLine({ label, amount, total }: { label: string; amount: number; total: number }) {
  const share = total > 0 ? Math.round((amount / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
        <span>{label}</span>
        <span className="ph-card-meta">{formatMoney(amount)}</span>
      </div>
      <div className="ph-bar" style={{ marginTop: 3 }}><i style={{ width: `${share}%` }} /></div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Premium
// ---------------------------------------------------------------------------

export function PremiumPanel({ say }: { say: (text: string) => void }) {
  const { run } = useGame();
  const paying = useWorld(hasPremium);
  const memberships = useWorld((s) => membershipsOf(s, s.player.id));
  return (
    <>
      <div className="ph-panel">
        <h4>{paying ? 'Premium' : 'Get Premium'}</h4>
        <p>
          {paying
            ? 'No advertising, and a share of what you pay goes to the channels you actually watch.'
            : `${formatMoney(PREMIUM_MONTHLY)} a month. No advertising, and a share of it goes to the channels you watch.`}
        </p>
        <button
          type="button"
          className={`ph-pill${paying ? '' : ' ph-on'}`}
          style={{ marginTop: 10 }}
          onClick={() => {
            const result = run(paying ? 'video.leave_premium' : 'video.join_premium', {});
            if (result.ok) say(paying ? 'Premium canceled. The ads are back.' : 'Premium on. No more advertising.');
          }}
        >
          {paying ? 'Cancel Premium' : 'Try Premium'}
        </button>
      </div>
      {memberships.length > 0 && (
        <div className="ph-panel">
          <h4>Channels You Support</h4>
          {memberships.map((membership) => (
            <p key={membership.id}>
              {MEMBER_TIERS.find((t) => t.id === membership.tier)?.label ?? membership.tier} ·
              {' '}{formatMoney(membership.monthly)} a month
            </p>
          ))}
        </div>
      )}
    </>
  );
}

/** Watch Later and Liked, reachable in one press from the watch page. */
export function QuickSave({ video, say }: { video: VideoItem; say: (text: string) => void }) {
  const { run } = useGame();
  const later = useWorld((s) => specialList(s, s.player.id, 'watch_later'));
  const saved = later?.videoIds.includes(video.id) ?? false;
  return (
    <button
      type="button"
      className={`ph-pill${saved ? ' ph-on' : ''}`}
      onClick={() => {
        if (saved) { say('Already in Watch Later.'); return; }
        const result = run('video.save_to_playlist', { kind: 'watch_later', videoId: video.id });
        if (result.ok) say('Saved to Watch Later.');
      }}
    >
      {saved ? <DownloadGlyph size={16} /> : <SaveGlyph size={16} />} {saved ? 'Saved' : 'Watch Later'}
    </button>
  );
}

export type { VideoPlaylist };
