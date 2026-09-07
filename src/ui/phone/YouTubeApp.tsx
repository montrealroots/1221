/**
 * SLATE — YouTube, on the phone.
 *
 * The contract asked for the app rather than a panel of numbers, so this is
 * laid out the way the app is laid out: a top bar with the mark, a row of
 * chips, a feed of thumbnail cards, a bottom bar with Home, Shorts, upload,
 * Subscriptions and You. A video opens on a watch page with the player, the
 * title and view count, the action pills, the channel row with a subscribe
 * button, the description, the comments and what is up next.
 *
 * Nothing here is decoration. Pressing play runs `video.watch`, which takes the
 * minutes out of the day and does to you what an hour of that subject does.
 * Subscribing changes what the feed shows tomorrow. Uploading takes an evening,
 * makes a video that people either click or do not depending on the thumbnail
 * you chose, and turns up in your own analytics with the rest.
 *
 * The mark is drawn in CSS. SLATE ships no third party artwork.
 */

import { useEffect, useMemo, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { MS_DAY } from '@/engine/core/time';
import { TOPICS, TOPIC_LABEL, type Topic } from '@/engine/content/channels';
import { THUMBNAILS, THUMBNAIL_BY_ID } from '@/engine/content/videos';
import {
  BINGE_MINUTES, catalogOf, channelAnalytics, commentsOn, homeFeed, isSubscribed,
  minutesWatchedSince, myChannel, searchVideos, subscriptionFeed, subscriptionsOf,
  videoById, videosOf, watchedIds,
} from '@/engine/systems/video';
import { PLATFORM_BY_ID, accountSummary, sponsorshipRate } from '@/engine/systems/media';
import { formatMoney } from '@/engine/core/money';
import { VIDEO_PLATFORM } from '@/engine/systems/video';
import type { BrandDeal, VideoChannel, VideoItem } from '@/engine/domain/model';
import type { PhoneTheme } from './Phone';
import {
  BackGlyph, BellGlyph, CastGlyph, CommentGlyph, DislikeGlyph, DownGlyph,
  HomeGlyph, LikeGlyph, MoreGlyph, PlusGlyph, SearchGlyph, ShareGlyph,
  ShortsGlyph, SubsGlyph, YouGlyph,
} from './Icons';
import {
  ChannelPage, LibraryPage, PremiumPanel, QuickSave, SaveSheet, StudioPage, TipSheet,
} from './YouTubeExtras';
import { hasPremium } from '@/engine/systems/creator';
import {
  QUALITIES, SPEEDS, applyFilters, chaptersOf, hasCaptions, minutesAtSpeed, noticesOf,
  preferences, unseenNotices,
} from '@/engine/systems/videoapp';
import { ImagePicker } from './ImagePicker';

type Tab = 'home' | 'shorts' | 'subs' | 'you';

/** Shorts are the ones you would actually swipe past. */
const SHORT_MINUTES = 12;

// ---------------------------------------------------------------------------
// Small formatters, the ones the app itself uses
// ---------------------------------------------------------------------------

function views(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1).replace('.0', '')}B`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return String(count);
}

function ago(now: number, then: number): string {
  const days = Math.floor((now - then) / MS_DAY);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 31) { const w = Math.floor(days / 7); return `${w} week${w === 1 ? '' : 's'} ago`; }
  if (days < 365) { const m = Math.floor(days / 30); return `${m} month${m === 1 ? '' : 's'} ago`; }
  const y = Math.floor(days / 365);
  return `${y} year${y === 1 ? '' : 's'} ago`;
}

function duration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}:${String(mins).padStart(2, '0')}:00` : `${mins}:00`;
}

/** A channel's circle. Its color comes from its name, so it is always the same one. */
function tint(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${hash} 46% 42%)`;
}

function initials(name: string): string {
  const words = name.replace(/^@/, '').replace(/^The /, '').split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?';
}

function Avatar({ name, size = 36, image }: { name: string; size?: number; image?: string }) {
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

// ---------------------------------------------------------------------------
// The app
// ---------------------------------------------------------------------------

export function YouTubeApp({ theme }: { theme: PhoneTheme }) {
  void theme;
  const { sim, run } = useGame();
  const [tab, setTab] = useState<Tab>('home');
  const [openId, setOpenId] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [screen, setScreen] = useState<'app' | 'library' | 'studio' | 'notices' | 'settings'>('app');
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<'all' | Topic>('all');
  const [toast, setToast] = useState<string | null>(null);

  const now = useWorld((s) => s.now);
  const open = useWorld((s) => (openId ? videoById(s, openId) : undefined));
  const channel = useWorld((s) => (channelId ? s.universe.videoChannels[channelId] : undefined));
  const unseen = useWorld((s) => unseenNotices(s, s.player.id));

  const say = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((current) => (current === text ? null : current)), 4200);
  };

  const watch = (video: VideoItem, minutes?: number, like?: boolean) => {
    const result = run<{ note: string; minutes: number }>('video.watch', { videoId: video.id, minutes, like });
    if (result.ok) say(`${result.value!.minutes} minutes. ${result.value!.note}`);
  };

  const row = (video: VideoItem) => <RowCard video={video} now={now} onOpen={setOpenId} />;

  return (
    <div className="ph-app-screen">
      {channel ? (
        <ChannelPage
          channel={channel}
          now={now}
          onBack={() => setChannelId(null)}
          say={say}
          renderRow={row}
        />
      ) : screen === 'library' ? (
        <LibraryPage onBack={() => setScreen('app')} say={say} renderRow={row} />
      ) : screen === 'studio' ? (
        <StudioPage onBack={() => setScreen('app')} say={say} />
      ) : screen === 'notices' ? (
        <NoticesPage now={now} onBack={() => setScreen('app')} onOpen={setOpenId} onChannel={setChannelId} />
      ) : screen === 'settings' ? (
        <PlaybackSettings onBack={() => setScreen('app')} />
      ) : open ? (
        <WatchPage
          video={open}
          now={now}
          onBack={() => setOpenId(null)}
          onOpen={setOpenId}
          onChannel={(id) => { setOpenId(null); setChannelId(id); }}
          onSettings={() => setScreen('settings')}
          onWatch={watch}
          say={say}
        />
      ) : searching ? (
        <SearchPage
          query={query}
          setQuery={setQuery}
          now={now}
          onClose={() => setSearching(false)}
          onOpen={(id) => { setSearching(false); setOpenId(id); }}
        />
      ) : uploading ? (
        <UploadPage onClose={() => setUploading(false)} say={say} />
      ) : (
        <>
          <div className="ph-yt-top">
            <span className="ph-yt-word">
              <span className="ph-play" aria-hidden="true" />
              <b>YouTube</b>
            </span>
            <span className="ph-yt-actions">
              <button type="button" className="ph-iconbtn" aria-label="Cast"><CastGlyph size={21} /></button>
              <button
                type="button"
                className="ph-iconbtn"
                aria-label={unseen > 0 ? `Notifications, ${unseen} new` : 'Notifications'}
                onClick={() => setScreen('notices')}
                style={{ position: 'relative' }}
              >
                <BellGlyph size={21} />
                {unseen > 0 && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute', top: -3, right: -5, minWidth: 15, height: 15,
                      borderRadius: 8, background: 'var(--ph-red)', color: '#fff',
                      fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', padding: '0 3px',
                    }}
                  >
                    {unseen > 9 ? '9+' : unseen}
                  </span>
                )}
              </button>
              <button type="button" className="ph-iconbtn" aria-label="Search" onClick={() => setSearching(true)}>
                <SearchGlyph size={21} />
              </button>
              <Avatar name={sim.player.displayName} size={28} />
            </span>
          </div>

          {tab === 'home' && (
            <>
              <ChipRow chip={chip} setChip={setChip} />
              <HomeTab chip={chip} now={now} onOpen={setOpenId} />
            </>
          )}
          {tab === 'shorts' && <ShortsTab now={now} onWatch={watch} onOpen={setOpenId} />}
          {tab === 'subs' && <SubscriptionsTab now={now} onOpen={setOpenId} />}
          {tab === 'you' && (
            <YouTab
              now={now}
              onOpen={setOpenId}
              onUpload={() => setUploading(true)}
              onLibrary={() => setScreen('library')}
              onStudio={() => setScreen('studio')}
              onChannel={setChannelId}
              say={say}
            />
          )}

          <nav className="ph-nav">
            <NavButton on={tab === 'home'} label="Home" onClick={() => setTab('home')}>
              <HomeGlyph size={20} filled={tab === 'home'} />
            </NavButton>
            <NavButton on={tab === 'shorts'} label="Shorts" onClick={() => setTab('shorts')}>
              <ShortsGlyph size={20} filled={tab === 'shorts'} />
            </NavButton>
            <button type="button" onClick={() => setUploading(true)} aria-label="Upload">
              <span className="ph-plus"><PlusGlyph size={17} /></span>
            </button>
            <NavButton on={tab === 'subs'} label="Subscriptions" onClick={() => setTab('subs')}>
              <SubsGlyph size={20} filled={tab === 'subs'} />
            </NavButton>
            <NavButton on={tab === 'you'} label="You" onClick={() => setTab('you')}>
              <YouGlyph size={20} filled={tab === 'you'} />
            </NavButton>
          </nav>
        </>
      )}

      {toast && <div className="ph-toast">{toast}</div>}
    </div>
  );
}

function NavButton({
  on, label, onClick, children,
}: { on: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={on ? 'ph-on' : undefined} onClick={onClick}>
      <span className="ph-glyph">{children}</span>
      {label}
    </button>
  );
}

function ChipRow({ chip, setChip }: { chip: 'all' | Topic; setChip: (chip: 'all' | Topic) => void }) {
  return (
    <div className="ph-chips">
      <button type="button" className={`ph-chip${chip === 'all' ? ' ph-on' : ''}`} onClick={() => setChip('all')}>All</button>
      {TOPICS.map((topic) => (
        <button
          key={topic}
          type="button"
          className={`ph-chip${chip === topic ? ' ph-on' : ''}`}
          onClick={() => setChip(topic)}
        >
          {TOPIC_LABEL[topic]}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

/**
 * The picture on the front.
 *
 * SLATE ships no artwork, so a thumbnail is drawn: the channel's own color,
 * its initials, and a small tag saying which of the seven kinds of thumbnail
 * this one is. That is honest about what it is and still reads, at a glance,
 * as the thing you would click.
 */
function Thumb({ video }: { video: VideoItem }) {
  const channel = useWorld((s) => s.universe.videoChannels[video.channelId]);
  const thumbnail = THUMBNAIL_BY_ID[video.thumbnail];
  const name = channel?.name ?? '?';
  const base = tint(name);
  return (
    <div
      className="ph-thumb"
      style={{ background: `linear-gradient(140deg, ${base}, ${tint(video.title)})` }}
    >
      {video.thumbnailImage ? (
        <img src={video.thumbnailImage} alt="" />
      ) : (
        <>
          <span className="ph-thumb-mark" aria-hidden="true">{initials(name)}</span>
          <span className="ph-thumb-style">{thumbnail?.label ?? 'A Frame From It'}</span>
        </>
      )}
      <span className="ph-dur">{duration(video.lengthMinutes)}</span>
    </div>
  );
}

function FeedCard({ video, now, onOpen }: { video: VideoItem; now: number; onOpen: (id: string) => void }) {
  const channel = useWorld((s) => s.universe.videoChannels[video.channelId]);
  return (
    <button type="button" className="ph-card" onClick={() => onOpen(video.id)}>
      <Thumb video={video} />
      <div className="ph-card-row">
        <Avatar name={channel?.name ?? '?'} image={channel?.avatarImage} />
        <span className="ph-card-text">
          <span className="ph-card-title">{video.title}</span>
          <span className="ph-card-meta">
            {channel?.name}{channel?.verified ? ' ✓' : ''} · {views(video.views)} views · {ago(now, video.publishedAt)}
          </span>
        </span>
        <span className="ph-card-more"><MoreGlyph size={17} /></span>
      </div>
    </button>
  );
}

function RowCard({ video, now, onOpen }: { video: VideoItem; now: number; onOpen: (id: string) => void }) {
  const channel = useWorld((s) => s.universe.videoChannels[video.channelId]);
  return (
    <button type="button" className="ph-row" onClick={() => onOpen(video.id)}>
      <span className="ph-row-thumb"><Thumb video={video} /></span>
      <span className="ph-row-text">
        <span className="ph-card-title">{video.title}</span>
        <span className="ph-card-meta">{channel?.name}</span>
        <span className="ph-card-meta">{views(video.views)} views · {ago(now, video.publishedAt)}</span>
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

function HomeTab({ chip, now, onOpen }: { chip: 'all' | Topic; now: number; onOpen: (id: string) => void }) {
  const feed = useWorld((s) => homeFeed(s, s.player.id, 40));
  const shown = useMemo(
    () => (chip === 'all' ? feed : feed.filter((v) => v.topic === chip)).slice(0, 24),
    [feed, chip],
  );

  if (shown.length === 0) {
    return (
      <div className="ph-body">
        <div className="ph-empty">
          <b>Nothing Here Yet</b>
          Try another subject, or watch something so the feed learns what you like.
        </div>
      </div>
    );
  }
  return (
    <div className="ph-body">
      {shown.map((video) => <FeedCard key={video.id} video={video} now={now} onOpen={onOpen} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shorts
// ---------------------------------------------------------------------------

function ShortsTab({
  now, onWatch, onOpen,
}: { now: number; onWatch: (video: VideoItem, minutes?: number, like?: boolean) => void; onOpen: (id: string) => void }) {
  const shorts = useWorld((s) => homeFeed(s, s.player.id, 120).filter((v) => v.lengthMinutes <= SHORT_MINUTES));
  const [index, setIndex] = useState(0);
  const video = shorts[Math.min(index, Math.max(0, shorts.length - 1))];
  const channel = useWorld((s) => (video ? s.universe.videoChannels[video.channelId] : undefined));

  if (!video) {
    return (
      <div className="ph-body">
        <div className="ph-empty"><b>No Shorts</b>Nothing short enough right now.</div>
      </div>
    );
  }

  return (
    <div className="ph-shorts">
      <div className="ph-short">
        {video.thumbnailImage && (
          <span className="ph-short-cover" aria-hidden="true"><img src={video.thumbnailImage} alt="" /></span>
        )}
        <div className="ph-short-title" style={{ position: 'relative' }}>{video.title}</div>
        <div className="ph-short-meta" style={{ position: 'relative' }}>
          {channel?.name} · {views(video.views)} views · {ago(now, video.publishedAt)}
        </div>
        <div className="ph-short-rail">
          <button type="button" onClick={() => onWatch(video)}>
            <span className="ph-glyph"><LikeGlyph size={22} /></span>{views(video.likes)}
          </button>
          <button type="button" onClick={() => onOpen(video.id)}>
            <span className="ph-glyph"><CommentGlyph size={22} /></span>{views(video.commentCount)}
          </button>
          <button type="button" onClick={() => onOpen(video.id)}>
            <span className="ph-glyph"><ShareGlyph size={22} /></span>Share
          </button>
          <button type="button" onClick={() => setIndex((i) => (i + 1) % shorts.length)}>
            <span className="ph-glyph"><DownGlyph size={22} /></span>Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

function SubscriptionsTab({ now, onOpen }: { now: number; onOpen: (id: string) => void }) {
  const subs = useWorld((s) => subscriptionsOf(s, s.player.id)
    .map((sub) => s.universe.videoChannels[sub.channelId])
    .filter((c): c is VideoChannel => c !== undefined));
  const feed = useWorld((s) => subscriptionFeed(s, s.player.id, 40));

  if (subs.length === 0) {
    return (
      <div className="ph-body">
        <div className="ph-empty">
          <b>No Subscriptions</b>
          Open a channel and subscribe to it. This tab is only ever what you chose.
        </div>
      </div>
    );
  }

  return (
    <div className="ph-body">
      <div className="ph-chips" style={{ paddingTop: 10 }}>
        {subs.map((channel) => (
          <span key={channel.id} style={{ textAlign: 'center', flex: 'none', width: 62 }}>
            <Avatar name={channel.name} size={46} />
            <span style={{ display: 'block', fontSize: 10, marginTop: 4 }}>{channel.name.split(' ')[0]}</span>
          </span>
        ))}
      </div>
      <div className="ph-sep" />
      {feed.map((video) => <RowCard key={video.id} video={video} now={now} onOpen={onOpen} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// You
// ---------------------------------------------------------------------------

function YouTab({
  now, onOpen, onUpload, onLibrary, onStudio, onChannel, say,
}: {
  now: number; onOpen: (id: string) => void; onUpload: () => void;
  onLibrary: () => void; onStudio: () => void; onChannel: (id: string) => void;
  say: (text: string) => void;
}) {
  const { sim, run } = useGame();
  const channel = useWorld(myChannel);
  const history = useWorld((s) => Object.values(s.universe.watchHistory)
    .filter((r) => r.personId === s.player.id)
    .sort((a, b) => b.at - a.at)
    .slice(0, 12)
    .map((r) => ({ record: r, video: videoById(s, r.videoId) })));
  const todayMinutes = useWorld((s) => minutesWatchedSince(s, s.player.id, s.now - MS_DAY));
  const mine = useWorld((s) => (channel ? videosOf(s, channel.id) : []));
  const stats = useWorld((s) => (channel ? channelAnalytics(s, channel.id) : undefined));
  const account = useWorld((s) => (channel?.accountId ? s.universe.socialAccounts[channel.accountId] : undefined));
  const summary = useWorld((s) => (account ? accountSummary(s, account.id) : undefined));
  const deals = useWorld((s) => Object.values(s.universe.brandDeals)
    .filter((d) => d.personId === s.player.id && ['offered', 'active'].includes(d.status))
    .sort((a, b) => b.offeredAt - a.offeredAt));
  const platform = PLATFORM_BY_ID[VIDEO_PLATFORM];

  return (
    <div className="ph-body">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
        <Avatar name={sim.player.displayName} size={54} image={channel?.avatarImage} />
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{sim.player.displayName}</div>
          <div className="ph-card-meta">
            {channel ? `@${channel.handle} · ${views(channel.subscribers)} subscribers` : 'No channel yet'}
          </div>
        </div>
      </div>

      {channel && <ChannelPictures channel={channel} say={say} />}

      <div className="ph-chips" style={{ padding: '0 12px 8px' }}>
        <button type="button" className="ph-chip" onClick={onLibrary}>Library</button>
        {channel && <button type="button" className="ph-chip" onClick={onStudio}>Studio</button>}
        {channel && <button type="button" className="ph-chip" onClick={() => onChannel(channel.id)}>Your Channel</button>}
      </div>

      <PremiumPanel say={say} />

      {!channel && (
        <div className="ph-panel">
          <h4>Start A Channel</h4>
          <p>It takes a name and nothing else. Everything after that is uploads.</p>
          <button
            type="button"
            className="ph-pill ph-on"
            style={{ marginTop: 10 }}
            onClick={() => {
              const result = run('video.create_channel', {});
              if (result.ok) say('Channel created. Nobody knows yet.');
            }}
          >
            Create A Channel
          </button>
        </div>
      )}

      {channel && stats && (
        <>
          <div className="ph-section-head">Your Channel</div>
          <div className="ph-panel">
            <h4>Last 28 Days</h4>
            <div className="ph-spark" aria-label="Views over the last twenty eight days">
              {stats.daily.map((value, index) => (
                <i
                  key={index}
                  style={{ height: `${Math.max(2, (value / Math.max(1, ...stats.daily)) * 100)}%` }}
                />
              ))}
            </div>
            <p style={{ marginTop: 8 }}>
              {views(stats.viewsLast28)} views · {stats.videos} video{stats.videos === 1 ? '' : 's'} ·
              {' '}{Math.round(stats.averageRetention * 100)}% average retention
            </p>
            <p style={{ marginTop: 4 }}>
              Median {views(stats.median)} views. One video does not describe a channel.
            </p>
          </div>
          {stats.best && stats.worst && stats.best.id !== stats.worst.id && (
            <div className="ph-panel">
              <h4>The One That Took Off, And The One That Did Not</h4>
              <p>{stats.best.title} — {views(stats.best.views)} views</p>
              <p>{stats.worst.title} — {views(stats.worst.views)} views</p>
            </div>
          )}
          <button type="button" className="ph-pill ph-on" style={{ margin: '4px 12px 10px' }} onClick={onUpload}>
            Upload Something
          </button>
          {account && (
            <div className="ph-panel">
              <h4>{account.monetisationEnabled ? 'Monetized' : 'Not Monetized Yet'}</h4>
              {account.monetisationEnabled ? (
                <>
                  <p>
                    {formatMoney(account.effectiveCpm)} per thousand monetized views.
                    {' '}{formatMoney(account.lifetimeEarnings)} earned so far, paid into your account.
                  </p>
                  <p style={{ marginTop: 4 }}>
                    A brand would pay about {formatMoney(sponsorshipRate(account))} for a spot in one video.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    {views(account.followers)} of {views(platform.monetisationThreshold)} subscribers.
                    Nothing pays until you are past that.
                  </p>
                  <div className="ph-bar" style={{ marginTop: 8 }}>
                    <i style={{ width: `${Math.min(100, (account.followers / platform.monetisationThreshold) * 100)}%` }} />
                  </div>
                </>
              )}
              {summary && (
                <p style={{ marginTop: 6 }}>
                  {views(summary.impressionsLast30)} impressions in the last thirty days, from
                  {' '}{summary.postsLast30} upload{summary.postsLast30 === 1 ? '' : 's'}.
                  {summary.pendingRevenue > 0 && ` ${formatMoney(summary.pendingRevenue)} still to be paid out.`}
                </p>
              )}
            </div>
          )}

          {deals.length > 0 && (
            <>
              <div className="ph-section-head">Sponsorships</div>
              {deals.map((deal) => <DealRow key={deal.id} deal={deal} say={say} />)}
            </>
          )}

          {mine.map((video) => <MyVideoRow key={video.id} video={video} now={now} onOpen={onOpen} />)}
          <div className="ph-sep" />
        </>
      )}

      <div className="ph-section-head">History</div>
      {todayMinutes > 0 && (
        <p className="ph-card-meta" style={{ padding: '0 12px 6px' }}>
          {Math.round(todayMinutes)} minutes today
          {todayMinutes >= BINGE_MINUTES ? ', which is a lot of an evening.' : '.'}
        </p>
      )}
      {history.length === 0 ? (
        <div className="ph-empty">Nothing watched yet.</div>
      ) : (
        history.map(({ record, video }) => (
          video ? <RowCard key={record.id} video={video} now={now} onOpen={onOpen} /> : null
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function SearchPage({
  query, setQuery, now, onClose, onOpen,
}: {
  query: string; setQuery: (q: string) => void; now: number;
  onClose: () => void; onOpen: (id: string) => void;
}) {
  const { run } = useGame();
  const [uploaded, setUploaded] = useState<'any' | 'today' | 'week' | 'month' | 'year'>('any');
  const [length, setLength] = useState<'any' | 'short' | 'medium' | 'long'>('any');
  const prefs = useWorld(preferences);
  const results = useWorld((s) => applyFilters(s, searchVideos(s, query, 120), {
    uploaded, duration: length, sort: prefs.searchSort,
  }).slice(0, 40));
  return (
    <>
      <div className="ph-yt-top">
        <button type="button" className="ph-iconbtn" aria-label="Back" onClick={onClose}><BackGlyph size={21} /></button>
        <input
          className="ph-input"
          style={{ margin: '0 8px', borderRadius: 20 }}
          placeholder="Search YouTube"
          value={query}
          aria-label="Search YouTube"
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="ph-chips">
        {(['any', 'today', 'week', 'month', 'year'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`ph-chip${uploaded === option ? ' ph-on' : ''}`}
            onClick={() => setUploaded(option)}
          >
            {option === 'any' ? 'Any Time' : option === 'today' ? 'Today' : `This ${option[0]!.toUpperCase()}${option.slice(1)}`}
          </button>
        ))}
      </div>
      <div className="ph-chips" style={{ paddingTop: 0 }}>
        {(['any', 'short', 'medium', 'long'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`ph-chip${length === option ? ' ph-on' : ''}`}
            onClick={() => setLength(option)}
          >
            {option === 'any' ? 'Any Length' : option === 'short' ? 'Under 4 Minutes' : option === 'medium' ? '4 To 20' : 'Over 20'}
          </button>
        ))}
        {(['relevance', 'date', 'views'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`ph-chip${prefs.searchSort === option ? ' ph-on' : ''}`}
            onClick={() => run('video.set_preferences', { searchSort: option })}
          >
            {option === 'relevance' ? 'Relevance' : option === 'date' ? 'Newest' : 'Most Viewed'}
          </button>
        ))}
      </div>
      <div className="ph-body">
        {query.trim().length < 2 ? (
          <div className="ph-empty">Type at least two letters.</div>
        ) : results.length === 0 ? (
          <div className="ph-empty"><b>No Results</b>Nothing matches that.</div>
        ) : (
          results.map((video) => <RowCard key={video.id} video={video} now={now} onOpen={onOpen} />)
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Watch
// ---------------------------------------------------------------------------

function WatchPage({
  video, now, onBack, onOpen, onChannel, onSettings, onWatch, say,
}: {
  video: VideoItem; now: number;
  onBack: () => void; onOpen: (id: string) => void; onChannel: (id: string) => void;
  onSettings: () => void;
  onWatch: (video: VideoItem, minutes?: number, like?: boolean) => void;
  say: (text: string) => void;
}) {
  const { run } = useGame();
  const [sheet, setSheet] = useState<'none' | 'save' | 'tip'>('none');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const paying = useWorld(hasPremium);
  const prefs = useWorld(preferences);
  const chapters = useWorld((s) => chaptersOf(s, video));
  const captioned = useWorld((s) => hasCaptions(s, video));
  const runtime = minutesAtSpeed(video.lengthMinutes, prefs);
  const channel = useWorld((s) => s.universe.videoChannels[video.channelId]);
  const subscribed = useWorld((s) => (channel ? isSubscribed(s, s.player.id, channel.id) : false));
  const seen = useWorld((s) => watchedIds(s, s.player.id).has(video.id));
  const comments = useWorld((s) => commentsOn(s, video.id));
  const upNext = useWorld((s) => homeFeed(s, s.player.id, 12).filter((v) => v.id !== video.id));
  const mine = channel?.ownerId !== undefined;
  const hidden = comments.filter((c) => c.harsh && !c.seen);
  const [reply, setReply] = useState('');
  const [showAll, setShowAll] = useState(false);

  const visible = comments.filter((c) => !c.harsh || c.seen);

  return (
    <>
      <div className="ph-player">
        <button type="button" className="ph-play-big" aria-label="Play" onClick={() => onWatch(video)} />
        <span className="ph-play-note">
          {seen ? 'Watched. Play it again if you like.' : `${duration(runtime)} of your day at ${prefs.speed}×`}
          {paying ? ' · no ads' : ' · an ad may run first'}
          {captioned ? (prefs.captions ? ' · captions on' : ' · captions available') : ' · no captions'}
        </span>
        <span className="ph-scrub"><i style={{ width: seen ? '100%' : '0%' }} /></span>
      </div>

      <div className="ph-body">
        <div className="ph-watch-title">{video.title}</div>
        <div className="ph-watch-meta">
          {views(video.views)} views · {ago(now, video.publishedAt)}
        </div>

        <div className="ph-actions">
          <button type="button" className="ph-pill" onClick={onSettings}>{prefs.speed}× · {prefs.quality}</button>
          <button
            type="button"
            className={`ph-pill${prefs.captions ? ' ph-on' : ''}`}
            disabled={!captioned}
            onClick={() => run('video.set_preferences', { captions: !prefs.captions })}
          >
            CC
          </button>
          {prefs.autoplay && (
            <button
              type="button"
              className="ph-pill"
              onClick={() => {
                const result = run<{ watched: number; minutes: number; stoppedBecause: string }>(
                  'video.autoplay', { videoId: video.id },
                );
                if (result.ok) {
                  say(`${result.value!.watched} videos, ${result.value!.minutes} minutes. ${result.value!.stoppedBecause}`);
                }
              }}
            >
              Autoplay
            </button>
          )}
          <button type="button" className="ph-pill" onClick={() => onWatch(video, video.lengthMinutes, true)}>
            <LikeGlyph size={16} /> {views(video.likes)}
          </button>
          <button type="button" className="ph-pill" onClick={() => say('Noted. It changes nothing about the video and everything about your feed.')}>
            <DislikeGlyph size={16} />
          </button>
          <button type="button" className="ph-pill" onClick={() => say('Nothing leaves the game. SLATE never sends anything anywhere.')}>
            <ShareGlyph size={16} /> Share
          </button>
          <QuickSave video={video} say={say} />
          <button type="button" className="ph-pill" onClick={() => setSheet(sheet === 'save' ? 'none' : 'save')}>
            Save To
          </button>
          {!mine && (
            <button type="button" className="ph-pill" onClick={() => setSheet(sheet === 'tip' ? 'none' : 'tip')}>
              Thanks
            </button>
          )}
          <button type="button" className="ph-pill" onClick={() => onWatch(video, Math.max(1, Math.round(video.lengthMinutes / 3)))}>
            Skim It
          </button>
          <button type="button" className="ph-pill" onClick={onBack}>
            <BackGlyph size={16} /> Back
          </button>
        </div>

        {sheet === 'save' && <SaveSheet video={video} onClose={() => setSheet('none')} say={say} />}
        {sheet === 'tip' && <TipSheet video={video} onClose={() => setSheet('none')} say={say} />}

        <div className="ph-channel-row">
          <button
            type="button"
            style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
            aria-label={`Open ${channel?.name ?? 'the channel'}`}
            onClick={() => channel && onChannel(channel.id)}
          >
            <Avatar name={channel?.name ?? '?'} size={38} />
          </button>
          <span>
            <span className="ph-name" style={{ display: 'block' }}>
              {channel?.name}{channel?.verified ? ' ✓' : ''}
            </span>
            <span className="ph-subs">{views(channel?.subscribers ?? 0)} subscribers</span>
          </span>
          {!mine && channel && (
            <button
              type="button"
              className={`ph-sub-btn${subscribed ? ' ph-subbed' : ''}`}
              onClick={() => {
                const result = run(subscribed ? 'video.unsubscribe' : 'video.subscribe', { channelId: channel.id });
                if (result.ok) say(subscribed ? `Unsubscribed from ${channel.name}.` : `Subscribed to ${channel.name}.`);
              }}
            >
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          )}
        </div>

        {chapters.length > 0 && (
          <div className="ph-panel">
            <h4>Chapters</h4>
            {chapters.map((chapter) => (
              <button
                key={chapter.title}
                type="button"
                className="ph-pill"
                style={{ margin: '4px 6px 0 0' }}
                onClick={() => onWatch(video, Math.max(1, runtime - Math.round(chapter.at / prefs.speed)))}
              >
                {duration(chapter.at)} {chapter.title}
              </button>
            ))}
          </div>
        )}

        {video.description && (
          <div className="ph-panel">
            <h4>{views(video.views)} views · {ago(now, video.publishedAt)}</h4>
            <p>{video.description}</p>
            {video.tags.length > 0 && (
              <p style={{ marginTop: 6 }}>{video.tags.map((t) => `#${t.replace(/\s+/g, '')}`).join(' ')}</p>
            )}
          </div>
        )}

        <div className="ph-section-head">Comments · {views(video.commentCount)}</div>

        {mine && hidden.length > 0 && (
          <div className="ph-panel">
            <h4>{hidden.length} Comments Are Hidden</h4>
            <p>They are the sort you would rather not have read. Nobody is making you.</p>
            <button
              type="button"
              className="ph-pill"
              style={{ marginTop: 10 }}
              onClick={() => {
                const result = run<{ read: number }>('video.read_harsh', { videoId: video.id });
                if (result.ok) say(`You read all ${result.value!.read} of them. That was your choice.`);
              }}
            >
              Read Them Anyway
            </button>
          </div>
        )}

        {(showAll ? visible : visible.slice(0, 4)).map((comment) => (
          <div key={comment.id} className="ph-comment">
            <Avatar name={comment.authorName} size={30} />
            <span className="ph-c-text">
              <span className="ph-c-who">
                {comment.pinned ? 'Pinned · ' : ''}{comment.authorName} · {ago(now, comment.at)}
                {comment.replyToId ? ' · reply' : ''}
              </span>
              <span className="ph-c-body">{comment.text}</span>
              <span className="ph-c-likes">
                <LikeGlyph size={13} /> {views(comment.likes)}
                {comment.hearted && ' · hearted by the channel'}
              </span>
              <span className="ph-actions" style={{ padding: '6px 0 0' }}>
                <button
                  type="button"
                  className="ph-pill"
                  onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyText(''); }}
                >
                  Reply
                </button>
                {mine && (
                  <>
                    <button
                      type="button"
                      className={`ph-pill${comment.pinned ? ' ph-on' : ''}`}
                      onClick={() => run('video.pin_comment', { commentId: comment.id })}
                    >
                      Pin
                    </button>
                    <button
                      type="button"
                      className={`ph-pill${comment.hearted ? ' ph-on' : ''}`}
                      onClick={() => run('video.heart_comment', { commentId: comment.id })}
                    >
                      Heart
                    </button>
                  </>
                )}
              </span>
              {replyTo === comment.id && (
                <span style={{ display: 'block', marginTop: 8 }}>
                  <input
                    className="ph-input"
                    value={replyText}
                    placeholder={`Reply to ${comment.authorName}`}
                    aria-label={`Reply to ${comment.authorName}`}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button
                    type="button"
                    className="ph-pill ph-on"
                    style={{ marginTop: 6 }}
                    onClick={() => {
                      const result = run('video.reply_comment', { commentId: comment.id, text: replyText });
                      if (result.ok) { setReplyTo(null); setReplyText(''); say('Replied.'); }
                    }}
                  >
                    Reply
                  </button>
                </span>
              )}
            </span>
          </div>
        ))}
        {visible.length > 4 && (
          <button type="button" className="ph-pill" style={{ margin: '0 12px 10px' }} onClick={() => setShowAll((s) => !s)}>
            {showAll ? 'Show Fewer' : `Show All ${visible.length}`}
          </button>
        )}

        <div style={{ padding: '0 12px 14px' }}>
          <label className="ph-label" htmlFor="ph-reply">Add A Comment</label>
          <input
            id="ph-reply"
            className="ph-input"
            value={reply}
            placeholder="Say something"
            onChange={(e) => setReply(e.target.value)}
          />
          <button
            type="button"
            className="ph-pill ph-on"
            style={{ marginTop: 8 }}
            onClick={() => {
              const result = run('video.comment', { videoId: video.id, text: reply });
              if (result.ok) { setReply(''); say('Posted. It is in the world now.'); }
            }}
          >
            Comment
          </button>
        </div>

        <div className="ph-sep" />
        <div className="ph-section-head">Up Next</div>
        {upNext.map((next) => <RowCard key={next.id} video={next} now={now} onOpen={onOpen} />)}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

function UploadPage({ onClose, say }: { onClose: () => void; say: (text: string) => void }) {
  const { run } = useGame();
  const channel = useWorld(myChannel);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [thumbnail, setThumbnail] = useState('frame');
  const [lengthMinutes, setLength] = useState(12);
  const [effortMinutes, setEffort] = useState(240);
  const [later, setLater] = useState(false);
  const [days, setDays] = useState(2);
  const [photo, setPhoto] = useState<string | undefined>();
  const now = useWorld((s) => s.now);
  const catalog = useWorld((s) => (channel ? catalogOf(s, channel) : []));

  if (!channel) {
    return (
      <>
        <div className="ph-yt-top">
          <button type="button" className="ph-iconbtn" aria-label="Back" onClick={onClose}>←</button>
          <b style={{ fontSize: 17 }}>Upload</b>
          <span />
        </div>
        <div className="ph-body">
          <div className="ph-empty"><b>No Channel Yet</b>Make one on the You tab first.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="ph-yt-top">
        <button type="button" className="ph-iconbtn" aria-label="Back" onClick={onClose}><BackGlyph size={21} /></button>
        <b style={{ fontSize: 17 }}>Upload</b>
        <span />
      </div>
      <div className="ph-body" style={{ padding: '0 12px 16px' }}>
        <label className="ph-label" htmlFor="ph-title">Title</label>
        <input id="ph-title" className="ph-input" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />

        <label className="ph-label" htmlFor="ph-desc">Description</label>
        <textarea id="ph-desc" className="ph-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />

        <label className="ph-label" htmlFor="ph-tags">Tags, Separated By Commas</label>
        <input id="ph-tags" className="ph-input" value={tags} onChange={(e) => setTags(e.target.value)} />

        <label className="ph-label">
          {lengthMinutes <= SHORT_MINUTES ? 'Cover, Which Is The Whole Screen On A Short' : 'Your Own Thumbnail'}
        </label>
        <ImagePicker
          frame={lengthMinutes <= SHORT_MINUTES ? 'short' : 'thumbnail'}
          image={photo}
          label={lengthMinutes <= SHORT_MINUTES ? 'Cover for this short' : 'Thumbnail for this video'}
          onChange={setPhoto}
        />
        <p className="ph-card-meta">
          Bring your own picture, or pick one of the seven below and the app draws it.
        </p>

        <label className="ph-label">Or A Drawn One</label>
        <div className="ph-chips" style={{ padding: '0 0 8px' }}>
          {THUMBNAILS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`ph-chip${thumbnail === option.id ? ' ph-on' : ''}`}
              onClick={() => setThumbnail(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="ph-card-meta">{THUMBNAIL_BY_ID[thumbnail]?.note}</p>

        <label className="ph-label" htmlFor="ph-len">Length: {lengthMinutes} Minutes</label>
        <input
          id="ph-len" className="ph-input" type="range" min={1} max={120} value={lengthMinutes}
          onChange={(e) => setLength(Number(e.target.value))}
        />

        <label className="ph-label" htmlFor="ph-effort">
          Time On It: {Math.round(effortMinutes / 60)} Hours
        </label>
        <input
          id="ph-effort" className="ph-input" type="range" min={30} max={1800} step={30} value={effortMinutes}
          onChange={(e) => setEffort(Number(e.target.value))}
        />
        <p className="ph-card-meta">
          The hours come out of your day the moment you press upload, whatever happens to it after.
        </p>

        <label className="ph-label">When</label>
        <div className="ph-chips" style={{ padding: '0 0 8px' }}>
          <button type="button" className={`ph-chip${later ? '' : ' ph-on'}`} onClick={() => setLater(false)}>Publish Now</button>
          <button type="button" className={`ph-chip${later ? ' ph-on' : ''}`} onClick={() => setLater(true)}>Schedule It</button>
        </div>
        {later && (
          <>
            <label className="ph-label" htmlFor="ph-days">In {days} Day{days === 1 ? '' : 's'}</label>
            <input
              id="ph-days" className="ph-input" type="range" min={1} max={30} value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </>
        )}

        <button
          type="button"
          className="ph-pill ph-on"
          style={{ marginTop: 14 }}
          onClick={() => {
            const result = run<{ quality: number; status: string; videoId: string }>('video.upload', {
              title,
              description,
              tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
              thumbnail,
              lengthMinutes,
              effortMinutes,
              publishAt: later ? now + days * MS_DAY : undefined,
            });
            if (result.ok) {
              if (photo) {
                run('video.set_thumbnail_image', { videoId: result.value!.videoId, image: photo });
              }
              say(result.value!.status === 'scheduled'
                ? 'Scheduled. It goes up on its own.'
                : 'It is up. Now you wait.');
              onClose();
            }
          }}
        >
          {later ? 'Schedule It' : 'Upload'}
        </button>

        {catalog.length > 0 && (
          <p className="ph-card-meta" style={{ marginTop: 12 }}>
            {catalog.length} video{catalog.length === 1 ? '' : 's'} on the channel already.
          </p>
        )}
      </div>
    </>
  );
}

/** One of your own videos, with what it actually earned on it. */
function MyVideoRow({ video, now, onOpen }: { video: VideoItem; now: number; onOpen: (id: string) => void }) {
  const revenue = useWorld((s) => (video.postId ? s.universe.socialPosts[video.postId]?.revenue ?? 0 : 0));
  return (
    <button type="button" className="ph-row" onClick={() => onOpen(video.id)}>
      <span className="ph-row-thumb"><Thumb video={video} /></span>
      <span className="ph-row-text">
        <span className="ph-card-title">{video.title}</span>
        <span className="ph-card-meta">{views(video.views)} views · {ago(now, video.publishedAt)}</span>
        <span className="ph-card-meta">
          {revenue > 0 ? `${formatMoney(revenue)} earned` : 'Nothing yet'}
          {video.status === 'scheduled' ? ' · scheduled' : ''}
        </span>
      </span>
    </button>
  );
}

/**
 * A brand deal, on the phone, where a creator would actually see one. The
 * terms are the terms: what they pay, what they want, and by when.
 */
function DealRow({ deal, say }: { deal: BrandDeal; say: (text: string) => void }) {
  const { sim, run } = useGame();
  const due = Math.max(0, Math.ceil((deal.deadlineAt - sim.now) / MS_DAY));
  const wants = deal.deliverables
    .map((d) => `${d.count} ${d.format.replace(/_/g, ' ')}${d.count === 1 ? '' : 's'}`)
    .join(', ');
  return (
    <div className="ph-panel">
      <h4>{deal.brandName} · {formatMoney(deal.compensation)}</h4>
      <p>{wants}, within {due} day{due === 1 ? '' : 's'}.</p>
      {deal.performanceBonusCpm ? (
        <p style={{ marginTop: 4 }}>{formatMoney(deal.performanceBonusCpm)} more per thousand views above the threshold.</p>
      ) : null}
      {deal.exclusivityCategory && (
        <p style={{ marginTop: 4 }}>No other {deal.exclusivityCategory} brand while it runs.</p>
      )}
      {deal.status === 'offered' ? (
        <div className="ph-actions" style={{ padding: '10px 0 0' }}>
          <button
            type="button"
            className="ph-pill ph-on"
            onClick={() => {
              const result = run('social.respond_to_deal', { dealId: deal.id, accept: true });
              if (result.ok) say(`Signed with ${deal.brandName}. The deliverables are yours now.`);
            }}
          >
            Take It
          </button>
          <button
            type="button"
            className="ph-pill"
            onClick={() => {
              const result = run('social.respond_to_deal', { dealId: deal.id, accept: false });
              if (result.ok) say('Turned down. They will remember either way.');
            }}
          >
            Turn It Down
          </button>
        </div>
      ) : (
        <p style={{ marginTop: 6 }}>
          Running. {deal.deliverables.reduce((sum, d) => sum + d.delivered, 0)} of
          {' '}{deal.deliverables.reduce((sum, d) => sum + d.count, 0)} delivered.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The bell, as an inbox
// ---------------------------------------------------------------------------

function NoticesPage({
  now, onBack, onOpen, onChannel,
}: {
  now: number; onBack: () => void;
  onOpen: (id: string) => void; onChannel: (id: string) => void;
}) {
  const { run } = useGame();
  const notices = useWorld((s) => noticesOf(s, s.player.id).slice(0, 40));
  useEffect(() => { run('video.read_notices', {}, { silent: true }); }, [run]);

  return (
    <>
      <div className="ph-yt-top">
        <button type="button" className="ph-iconbtn" aria-label="Back" onClick={onBack}><BackGlyph size={21} /></button>
        <b style={{ fontSize: 17, flex: 1, marginLeft: 10 }}>Notifications</b>
      </div>
      <div className="ph-body">
        {notices.length === 0 ? (
          <div className="ph-empty">
            <b>Nothing Here</b>
            Turn the bell on for a channel and its uploads land here.
          </div>
        ) : notices.map((notice) => (
          <button
            key={notice.id}
            type="button"
            className="ph-row"
            onClick={() => {
              if (notice.videoId) onOpen(notice.videoId);
              else if (notice.channelId) onChannel(notice.channelId);
            }}
          >
            <span className="ph-row-text" style={{ paddingLeft: 2 }}>
              <span className="ph-card-title">{notice.text}</span>
              <span className="ph-card-meta">{ago(now, notice.at)}{notice.seen ? '' : ' · new'}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Playback settings
// ---------------------------------------------------------------------------

function PlaybackSettings({ onBack }: { onBack: () => void }) {
  const { run } = useGame();
  const prefs = useWorld(preferences);
  return (
    <>
      <div className="ph-yt-top">
        <button type="button" className="ph-iconbtn" aria-label="Back" onClick={onBack}><BackGlyph size={21} /></button>
        <b style={{ fontSize: 17, flex: 1, marginLeft: 10 }}>Playback</b>
      </div>
      <div className="ph-body">
        <div className="ph-section-head">Speed</div>
        <div className="ph-chips">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              className={`ph-chip${prefs.speed === speed ? ' ph-on' : ''}`}
              onClick={() => run('video.set_preferences', { speed })}
            >
              {speed}×
            </button>
          ))}
        </div>
        <p className="ph-card-meta" style={{ padding: '0 12px 8px' }}>
          Faster takes less of your day and leaves you with less of the video. Past one and a half
          you are skimming.
        </p>

        <div className="ph-section-head">Quality</div>
        <div className="ph-chips">
          {QUALITIES.map((quality) => (
            <button
              key={quality}
              type="button"
              className={`ph-chip${prefs.quality === quality ? ' ph-on' : ''}`}
              onClick={() => run('video.set_preferences', { quality })}
            >
              {quality === 'auto' ? 'Auto' : quality}
            </button>
          ))}
        </div>

        <div className="ph-section-head">And The Rest</div>
        <div className="ph-set-group">
          <button
            type="button"
            className="ph-set-row"
            onClick={() => run('video.set_preferences', { autoplay: !prefs.autoplay })}
          >
            Autoplay
            <span className="ph-set-value">{prefs.autoplay ? 'On' : 'Off'}</span>
          </button>
          <button
            type="button"
            className="ph-set-row"
            onClick={() => run('video.set_preferences', { captions: !prefs.captions })}
          >
            Captions
            <span className="ph-set-value">{prefs.captions ? 'On' : 'Off'}</span>
          </button>
        </div>
        <p className="ph-card-meta" style={{ padding: '10px 12px' }}>
          Captions only work where the video has them, and most do. With them on you take more in.
        </p>
      </div>
    </>
  );
}

/** The two pictures a channel has, both of them the player's own photos. */
function ChannelPictures({ channel, say }: { channel: VideoChannel; say: (text: string) => void }) {
  const { run } = useGame();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <div className="ph-chips" style={{ padding: '0 12px 8px' }}>
        <button type="button" className="ph-chip" onClick={() => setOpen(true)}>Channel Pictures</button>
      </div>
    );
  }
  return (
    <div className="ph-panel">
      <h4>Channel Pictures</h4>
      <label className="ph-label">Banner</label>
      <ImagePicker
        frame="banner"
        image={channel.bannerImage}
        label="Channel banner"
        onChange={(image) => {
          const result = run('video.set_channel_image', { which: 'banner', image });
          if (result.ok) say(image ? 'Banner set.' : 'Banner removed.');
        }}
      />
      <label className="ph-label">Picture</label>
      <ImagePicker
        frame="avatar"
        image={channel.avatarImage}
        label="Channel picture"
        onChange={(image) => {
          const result = run('video.set_channel_image', { which: 'avatar', image });
          if (result.ok) say(image ? 'Picture set.' : 'Picture removed.');
        }}
      />
      <button type="button" className="ph-pill" style={{ marginTop: 8 }} onClick={() => setOpen(false)}>Done</button>
    </div>
  );
}
