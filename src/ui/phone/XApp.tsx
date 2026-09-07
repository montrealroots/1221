/**
 * SLATE — X, on the phone.
 *
 * Laid out the way the app is actually laid out, page by page. Your picture
 * top left, the mark in the middle, the settings gear where the app puts one.
 * For You and Following under it, a timeline of posts each with a reply, a
 * repost, a like, a view count, a bookmark and a share. Along the bottom, five
 * icons with no labels: Home, Search, the assistant, Notifications and Chat,
 * with the blue button floating above them.
 *
 * Behind your picture is the drawer: who you are, how many follow you, then
 * Profile, Premium, Bookmarks, Communities, Lists, Spaces, Creator Studio,
 * and under the rule the assistant, Settings and privacy, and Help. Search is
 * the rail of Explore, Trending, News, Sports and Entertainment. Notifications
 * is All and Mentions. Your own page is the banner, the join date, the two
 * counts, Share and Edit, the four tabs, and who to follow.
 *
 * Nothing here is decoration. Replying costs the two minutes it costs. A post
 * is capped at the two hundred and eighty characters the app caps it at and
 * can only be edited inside the hour. Premium is a real subscription that is
 * taken every month and lapses if it cannot be, and it is what turns on the
 * share of the advertising sold against your impressions, which is paid on the
 * month like it is. The assistant answers out of this save and nothing else.
 *
 * The mark is drawn in CSS. SLATE ships no third party artwork.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { formatMoney } from '@/engine/core/money';
import type { SocialItem, SocialProfile } from '@/engine/domain/model';
import {
  TEXT_LIMIT, TEXT_PLATFORM, X_PREMIUM_MONTHLY, catalogOf, followingFeed, homeFeed,
  isBlocked, isFollowing, isMuted, itemById, messagesWith, myProfile, profileById, profilesOf,
  recentItems, repliesTo, roomsOf, screenTime, searchSocial, settingsOf, socialAnalytics,
  threadsOf, trends,
} from '@/engine/systems/socialapps';
import { SOCIAL_TOPIC_LABEL, type SocialTopic } from '@/engine/content/socialworld';
import {
  AskGlyph, BackGlyph, BellGlyph, BookmarkGlyph, BubbleGlyph, ComposeGlyph, GearGlyph,
  HeartGlyph, HelpGlyph, HomeGlyph, ListGlyph, PeopleGlyph, PlusGlyph, ReelsGlyph, RepostGlyph,
  RocketGlyph, SearchGlyph, SendGlyph, ShieldGlyph, SpacesGlyph, TickGlyph, TimelineGlyph,
  ViewsGlyph, YouGlyph,
} from './Icons';
import { Avatar, ago, tally, tint, views } from './YouTubeExtras';
import { EmojiRow } from './EmojiRow';
import { ImagePicker } from './ImagePicker';
import type { PhoneTheme } from './Phone';
import './social.css';

type Tab = 'home' | 'explore' | 'ask' | 'notices' | 'chat';
type Screen =
  | 'app' | 'compose' | 'premium' | 'settings' | 'profile' | 'bookmarks'
  | 'communities' | 'lists' | 'spaces' | 'studio' | 'thread';

export function XApp({ theme }: { theme: PhoneTheme }) {
  void theme;
  const [tab, setTab] = useState<Tab>('home');
  const [screen, setScreen] = useState<Screen>('app');
  const [lane, setLane] = useState<'foryou' | 'following'>('foryou');
  const [drawer, setDrawer] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [whoId, setWhoId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [quoting, setQuoting] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const now = useWorld((s) => s.now);
  const mine = useWorld((s) => myProfile(s, TEXT_PLATFORM));
  const open = useWorld((s) => (openId ? itemById(s, openId) : undefined));
  const who = useWorld((s) => (whoId ? profileById(s, whoId) : undefined));
  const unread = useWorld((s) => threadsOf(s).reduce((sum, t) => sum + t.unread, 0));

  const say = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((current) => (current === text ? null : current)), 4200);
  };

  const go = (next: Screen) => { setDrawer(false); setScreen(next); };
  const message = (id: string) => { setWhoId(null); setThreadId(id); setScreen('thread'); };
  const rowProps = { now, onOpen: setOpenId, onWho: setWhoId, onQuote: setQuoting, say };

  return (
    <div className="ph-app-screen">
      {drawer && (
        <Drawer
          mine={mine}
          onClose={() => setDrawer(false)}
          onGo={go}
          onProfile={() => {
            setDrawer(false);
            if (mine) setWhoId(mine.id);
            else setScreen('profile');
          }}
          say={say}
        />
      )}

      {who ? (
        <ProfilePage profile={who} now={now} onBack={() => setWhoId(null)} onOpen={setOpenId} onQuote={setQuoting} onMessage={message} onPremium={() => go('premium')} onWhoCard={setWhoId} say={say} />
      ) : open ? (
        <PostPage item={open} now={now} onBack={() => setOpenId(null)} onWho={(id) => { setOpenId(null); setWhoId(id); }} onQuote={setQuoting} say={say} />
      ) : quoting ? (
        <Composer quoteId={quoting} onClose={() => setQuoting(null)} say={say} hasProfile={Boolean(mine)} />
      ) : screen === 'compose' ? (
        <Composer onClose={() => setScreen('app')} say={say} hasProfile={Boolean(mine)} />
      ) : screen === 'thread' && threadId ? (
        <ThreadPage profileId={threadId} now={now} onBack={() => { setThreadId(null); setScreen('app'); }} say={say} />
      ) : screen === 'premium' ? (
        <PremiumPage onBack={() => setScreen('app')} say={say} />
      ) : screen === 'settings' ? (
        <SettingsPage onBack={() => setScreen('app')} onPremium={() => setScreen('premium')} say={say} />
      ) : screen === 'bookmarks' ? (
        <BookmarksPage onBack={() => setScreen('app')} {...rowProps} />
      ) : screen === 'communities' || screen === 'lists' || screen === 'spaces' ? (
        <RoomsPage kind={screen} onBack={() => setScreen('app')} {...rowProps} />
      ) : screen === 'profile' ? (
        <>
          <div className="ph-so-top">
            <button type="button" className="ph-iconbtn" onClick={() => setScreen('app')} aria-label="Back"><BackGlyph /></button>
            <b style={{ fontSize: 15 }}>Profile</b>
            <span style={{ width: 22 }} />
          </div>
          <MakeAccount
            say={say}
            onDone={(profileId) => { setScreen('app'); setWhoId(profileId); }}
          />
        </>
      ) : screen === 'studio' ? (
        <StudioPage onBack={() => setScreen('app')} onPremium={() => setScreen('premium')} />
      ) : (
        <>
          {tab === 'home' && (
            <>
              <div className="ph-x-top">
                <button type="button" className="ph-iconbtn" aria-label="Your Menu" onClick={() => setDrawer(true)}>
                  <Avatar name={mine?.name ?? 'You'} size={30} image={mine?.avatarImage} />
                </button>
                <span className="ph-mid"><span className="ph-so-word ph-x">X</span></span>
                <span className="ph-right">
                  <button type="button" className="ph-iconbtn" aria-label="Settings" onClick={() => setScreen('settings')}>
                    <GearGlyph size={20} />
                  </button>
                </span>
              </div>
              <div className="ph-x-tabs">
                <button type="button" className={lane === 'foryou' ? 'ph-on' : ''} onClick={() => setLane('foryou')}>For You</button>
                <button type="button" className={lane === 'following' ? 'ph-on' : ''} onClick={() => setLane('following')}>Following</button>
              </div>
              <div className="ph-body">
                <HomeLane lane={lane} {...rowProps} />
              </div>
              <button type="button" className="ph-fab" aria-label="New Post" onClick={() => setScreen('compose')}>
                <PlusGlyph size={22} />
              </button>
            </>
          )}

          {tab === 'explore' && <ExplorePage mine={mine} onDrawer={() => setDrawer(true)} onSettings={() => setScreen('settings')} {...rowProps} />}

          {tab === 'ask' && <AskPage mine={mine} onDrawer={() => setDrawer(true)} say={say} />}

          {tab === 'notices' && (
            <NoticesPage mine={mine} now={now} onDrawer={() => setDrawer(true)} onOpen={setOpenId} onSettings={() => setScreen('settings')} />
          )}

          {tab === 'chat' && (
            <ChatPage mine={mine} now={now} onDrawer={() => setDrawer(true)} onOpen={message} />
          )}

          <div className="ph-x-bar">
            <button type="button" className={tab === 'home' ? '' : 'ph-off'} onClick={() => setTab('home')} aria-label="Home">
              <HomeGlyph filled={tab === 'home'} size={23} />
            </button>
            <button type="button" className={tab === 'explore' ? '' : 'ph-off'} onClick={() => setTab('explore')} aria-label="Search">
              <SearchGlyph size={23} />
            </button>
            <button type="button" className={tab === 'ask' ? '' : 'ph-off'} onClick={() => setTab('ask')} aria-label="Assistant">
              <AskGlyph size={23} />
            </button>
            <button type="button" className={tab === 'notices' ? '' : 'ph-off'} onClick={() => setTab('notices')} aria-label="Notifications">
              <BellGlyph size={23} />
            </button>
            <button type="button" className={tab === 'chat' ? '' : 'ph-off'} onClick={() => setTab('chat')} aria-label="Chat">
              <BubbleGlyph size={23} />
              {unread > 0 && <span className="ph-blue-dot" aria-hidden="true" />}
            </button>
          </div>
        </>
      )}

      {toast && <div className="ph-toast">{toast}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The drawer
// ---------------------------------------------------------------------------

function Drawer({
  mine, onClose, onGo, onProfile, say,
}: {
  mine: SocialProfile | undefined; onClose: () => void;
  onGo: (screen: Screen) => void; onProfile: () => void; say: (text: string) => void;
}) {
  return (
    <div className="ph-drawer">
      <div className="ph-drawer-panel">
        <div className="ph-drawer-head">
          <Avatar name={mine?.name ?? 'You'} size={46} image={mine?.avatarImage} />
          <b>{mine?.name ?? 'No Account Yet'}</b>
          <small>@{mine?.handle ?? 'yourname'}</small>
          <div className="ph-drawer-counts">
            <b>{views(mine?.following ?? 0)}</b> Following{'   '}
            <b>{views(mine?.followers ?? 0)}</b> Followers
          </div>
        </div>
        <button type="button" className="ph-drawer-link" onClick={onProfile}><YouGlyph size={22} />Profile</button>
        <button type="button" className="ph-drawer-link" onClick={() => onGo('premium')}><TickGlyph size={18} />Premium</button>
        <button type="button" className="ph-drawer-link" onClick={() => onGo('bookmarks')}><BookmarkGlyph size={22} />Bookmarks</button>
        <button type="button" className="ph-drawer-link" onClick={() => onGo('communities')}><PeopleGlyph size={22} />Communities</button>
        <button type="button" className="ph-drawer-link" onClick={() => onGo('lists')}><ListGlyph size={22} />Lists</button>
        <button type="button" className="ph-drawer-link" onClick={() => onGo('spaces')}><SpacesGlyph size={22} />Spaces</button>
        <button type="button" className="ph-drawer-link" onClick={() => onGo('studio')}><RocketGlyph size={22} />Creator Studio</button>
        <hr />
        <button type="button" className="ph-drawer-link" style={{ fontSize: 15 }} onClick={() => { onClose(); say('The assistant is the third icon along the bottom.'); }}>
          <AskGlyph size={20} />Open The Assistant
        </button>
        <button type="button" className="ph-drawer-link" style={{ fontSize: 15 }} onClick={() => onGo('settings')}>
          <GearGlyph size={20} />Settings And Privacy
        </button>
        <button type="button" className="ph-drawer-link" style={{ fontSize: 15 }} onClick={() => { onClose(); say('Everything on this phone is SLATE’s own. Nothing leaves the game.'); }}>
          <HelpGlyph size={20} />Help Center
        </button>
      </div>
      <button type="button" className="ph-drawer-shade" onClick={onClose} aria-label="Close The Menu" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

interface RowProps {
  now: number;
  onOpen: (id: string) => void;
  onWho: (id: string) => void;
  onQuote: (id: string) => void;
  say: (text: string) => void;
}

function HomeLane({ lane, ...rest }: RowProps & { lane: 'foryou' | 'following' }) {
  const items = useWorld((s) => (lane === 'following'
    ? followingFeed(s, TEXT_PLATFORM, 25)
    : homeFeed(s, TEXT_PLATFORM, 25)));
  if (items.length === 0) {
    return <p className="ph-empty"><b>Quiet In Here</b>Follow a few accounts and this fills up.</p>;
  }
  return <>{items.map((item) => <Tweet key={item.id} item={item} {...rest} />)}</>;
}

function Tweet({ item, now, onOpen, onWho, onQuote, say }: RowProps & { item: SocialItem }) {
  const { run } = useGame();
  const profile = useWorld((s) => profileById(s, item.profileId));
  const quoted = useWorld((s) => (item.parentId && item.kind === 'quote' ? itemById(s, item.parentId) : undefined));
  const quotedWho = useWorld((s) => (quoted ? profileById(s, quoted.profileId) : undefined));
  const hideCounts = useWorld((s) => settingsOf(s).hideCounts);
  const [menu, setMenu] = useState(false);
  const [draft, setDraft] = useState(item.text);
  if (!profile) return null;

  const act = (kind: string, message?: string) => {
    const result = run(kind, { itemId: item.id }, { silent: true });
    if (!result.ok) say(result.error ?? 'That did not work.');
    else if (message) say(message);
  };
  const count = (n: number) => (hideCounts ? '' : views(n));

  return (
    <article className="ph-tweet">
      <button type="button" className="ph-iconbtn" onClick={() => onWho(profile.id)} aria-label={profile.name}>
        <Avatar name={profile.name} size={38} image={profile.avatarImage} />
      </button>
      <div className="ph-tweet-body">
        <div className="ph-tweet-head">
          <b>{profile.name}</b>
          {profile.verified && <span className="ph-tick" aria-label="Verified"><TickGlyph /></span>}
          <span>@{profile.handle}</span>
          <span>· {ago(now, item.at)}</span>
        </div>
        <button
          type="button"
          onClick={() => onOpen(item.id)}
          style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit', font: 'inherit', cursor: 'pointer', width: '100%' }}
        >
          <p className="ph-tweet-text">{item.text}</p>
        </button>

        {quoted && quotedWho && (
          <div className="ph-tweet-quote">
            <div className="ph-tweet-head">
              <b>{quotedWho.name}</b>
              <span>@{quotedWho.handle}</span>
            </div>
            <p className="ph-tweet-text">{quoted.text}</p>
          </div>
        )}

        <div className="ph-tweet-actions">
          <button type="button" onClick={() => onOpen(item.id)} aria-label="Reply">
            <BubbleGlyph size={16} />{count(item.comments)}
          </button>
          <button
            type="button"
            className={item.reposted ? 'ph-reposted' : ''}
            onClick={() => act('feed.repost', item.reposted ? 'Repost undone.' : 'Reposted.')}
            aria-label={item.reposted ? 'Undo Repost' : 'Repost'}
          >
            <RepostGlyph size={16} />{count(item.reposts)}
          </button>
          <button
            type="button"
            className={item.liked ? 'ph-liked' : ''}
            onClick={() => act('feed.like')}
            aria-label={item.liked ? 'Unlike' : 'Like'}
          >
            <HeartGlyph size={16} filled={item.liked} />{count(item.likes)}
          </button>
          <button type="button" onClick={() => onOpen(item.id)} aria-label="Views">
            <ViewsGlyph size={16} />{count(item.likes * 26 + 40)}
          </button>
          <button
            type="button"
            className={item.saved ? 'ph-liked' : ''}
            onClick={() => act('feed.bookmark', item.saved ? 'Bookmark removed.' : 'Bookmarked.')}
            aria-label={item.saved ? 'Remove Bookmark' : 'Bookmark'}
          >
            <BookmarkGlyph size={16} filled={item.saved} />
          </button>
          <button type="button" onClick={() => onQuote(item.id)} aria-label="Quote">
            <SendGlyph size={16} />
          </button>
          {item.byPlayer && (
            <button type="button" onClick={() => setMenu((v) => !v)} aria-label={menu ? 'Close' : 'Edit Or Delete'}>
              <ComposeGlyph size={15} />
            </button>
          )}
        </div>

        {menu && item.byPlayer && (
          <div className="ph-panel" style={{ margin: '8px 0 0' }}>
            <EmojiRow app="text" onPick={(emoji) => setDraft((current) => current + emoji)} />
            <textarea
              className="ph-input"
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="What This Post Says"
            />
            <p className="ph-card-meta">
              {draft.length > TEXT_LIMIT
                ? `${draft.length - TEXT_LIMIT} over the limit.`
                : 'An edit only works inside the hour, which is the app’s own rule.'}
            </p>
            <div className="ph-actions">
              <button
                type="button"
                className="ph-btn-solid"
                disabled={draft.length > TEXT_LIMIT}
                onClick={() => {
                  const result = run('feed.edit', { itemId: item.id, text: draft }, { silent: true });
                  if (result.ok) { say('Saved.'); setMenu(false); } else say(result.error ?? 'That did not work.');
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="ph-btn-outline"
                onClick={() => {
                  const result = run('feed.delete', { itemId: item.id }, { silent: true });
                  say(result.ok ? 'Deleted.' : result.error ?? 'That did not work.');
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// One post and its replies
// ---------------------------------------------------------------------------

function PostPage({
  item, now, onBack, onWho, onQuote, say,
}: {
  item: SocialItem; now: number; onBack: () => void;
  onWho: (id: string) => void; onQuote: (id: string) => void; say: (text: string) => void;
}) {
  const { run } = useGame();
  const replies = useWorld((s) => repliesTo(s, item.id));
  const [text, setText] = useState('');

  const send = () => {
    const result = run('feed.reply', { itemId: item.id, text }, { silent: true });
    if (result.ok) { setText(''); say('Posted. Two minutes gone.'); } else say(result.error ?? 'That did not work.');
  };

  return (
    <>
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
        <b style={{ fontSize: 15 }}>Post</b>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-body">
        <Tweet item={item} now={now} onOpen={() => undefined} onWho={onWho} onQuote={onQuote} say={say} />
        <EmojiRow app="text" onPick={(emoji) => setText((current) => current + emoji)} />
        <div style={{ padding: 12, display: 'flex', gap: 8, borderBottom: '1px solid var(--ph-line)' }}>
          <input
            className="ph-input"
            value={text}
            placeholder="Post your reply"
            maxLength={500}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="button" className="ph-btn-solid" disabled={text.trim().length === 0} onClick={send}>Reply</button>
        </div>
        {replies.length === 0 && <p className="ph-empty">Nobody has replied yet.</p>}
        {replies.map((reply) => (
          <Tweet key={reply.id} item={reply} now={now} onOpen={() => undefined} onWho={onWho} onQuote={onQuote} say={say} />
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Explore
// ---------------------------------------------------------------------------

const EXPLORE_LANES = ['explore', 'trending', 'news', 'sport', 'film'] as const;
const LANE_LABEL: Readonly<Record<string, string>> = {
  explore: 'Explore', trending: 'Trending', news: 'News', sport: 'Sports', film: 'Entertainment',
};

function ExplorePage({
  mine, onDrawer, onSettings, now, onOpen, onWho, onQuote, say,
}: RowProps & { mine: SocialProfile | undefined; onDrawer: () => void; onSettings: () => void }) {
  const [query, setQuery] = useState('');
  const [lane, setLane] = useState<(typeof EXPLORE_LANES)[number]>('explore');
  const list = useWorld((s) => trends(s, 12));
  const found = useWorld((s) => searchSocial(s, TEXT_PLATFORM, query));
  const items = useWorld((s) => {
    const all = recentItems(s, TEXT_PLATFORM, 3).sort((a, b) => b.likes - a.likes);
    if (lane === 'explore' || lane === 'trending') return all.slice(0, 25);
    return all.filter((i) => i.topic === lane).slice(0, 25);
  });

  return (
    <>
      <div className="ph-x-top" style={{ gridTemplateColumns: '40px 1fr 40px' }}>
        <button type="button" className="ph-iconbtn" aria-label="Your Menu" onClick={onDrawer}>
          <Avatar name={mine?.name ?? 'You'} size={30} image={mine?.avatarImage} />
        </button>
        <input
          className="ph-input"
          style={{ margin: '0 10px', borderRadius: 999 }}
          value={query}
          placeholder="Search"
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="ph-right">
          <button type="button" className="ph-iconbtn" aria-label="Settings" onClick={onSettings}><GearGlyph size={20} /></button>
        </span>
      </div>

      {query.trim().length < 2 && (
        <div className="ph-x-rail">
          {EXPLORE_LANES.map((option) => (
            <button
              key={option}
              type="button"
              className={lane === option ? 'ph-on' : ''}
              onClick={() => setLane(option)}
            >
              {LANE_LABEL[option]}
            </button>
          ))}
        </div>
      )}

      <div className="ph-body">
        {query.trim().length >= 2 ? (
          <>
            {found.profiles.map((profile) => (
              <button key={profile.id} type="button" className="ph-channel-row" onClick={() => onWho(profile.id)}>
                <Avatar name={profile.name} size={40} image={profile.avatarImage} />
                <span>
                  <b>{profile.name}</b>
                  <small>@{profile.handle} · {views(profile.followers)} followers</small>
                </span>
              </button>
            ))}
            {found.items.length > 0 && <div className="ph-section-head">Posts</div>}
            {found.items.map((item) => (
              <Tweet key={item.id} item={item} now={now} onOpen={onOpen} onWho={onWho} onQuote={onQuote} say={say} />
            ))}
            {found.profiles.length === 0 && found.items.length === 0 && <p className="ph-empty">Nothing for that.</p>}
          </>
        ) : lane === 'trending' ? (
          <>
            <div className="ph-section-head">Trending Now</div>
            {list.map((trend, index) => (
              <button key={trend.topic} type="button" className="ph-trend" onClick={() => setQuery(trend.label)}>
                <small>{index + 1} · Trending</small>
                <b>{trend.label}</b>
                <small>{views(trend.posts)} posts</small>
              </button>
            ))}
          </>
        ) : (
          <>
            <div className="ph-section-head">{LANE_LABEL[lane]}</div>
            {items.length === 0 && <p className="ph-empty">Nothing on that today.</p>}
            {items.map((item) => (
              <Tweet key={item.id} item={item} now={now} onOpen={onOpen} onWho={onWho} onQuote={onQuote} say={say} />
            ))}
          </>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

function NoticesPage({
  mine, now, onDrawer, onOpen, onSettings,
}: {
  mine: SocialProfile | undefined; now: number;
  onDrawer: () => void; onOpen: (id: string) => void; onSettings: () => void;
}) {
  const [lane, setLane] = useState<'all' | 'mentions'>('all');
  const items = useWorld((s) => (mine ? catalogOf(s, mine) : []));
  const replies = useWorld((s) => Object.values(s.universe.socialItems)
    .filter((i) => i.kind === 'reply' && i.byPlayer && i.platform === TEXT_PLATFORM)
    .sort((a, b) => b.at - a.at));
  const settings = useWorld((s) => settingsOf(s));

  return (
    <>
      <div className="ph-x-top">
        <button type="button" className="ph-iconbtn" aria-label="Your Menu" onClick={onDrawer}>
          <Avatar name={mine?.name ?? 'You'} size={30} image={mine?.avatarImage} />
        </button>
        <span className="ph-mid"><b style={{ fontSize: 17 }}>Notifications</b></span>
        <span className="ph-right">
          <button type="button" className="ph-iconbtn" aria-label="Settings" onClick={onSettings}><GearGlyph size={20} /></button>
        </span>
      </div>
      <div className="ph-x-tabs">
        <button type="button" className={lane === 'all' ? 'ph-on' : ''} onClick={() => setLane('all')}>All</button>
        <button type="button" className={lane === 'mentions' ? 'ph-on' : ''} onClick={() => setLane('mentions')}>Mentions</button>
      </div>
      <div className="ph-body">
        {!settings.notificationsOn && (
          <div className="ph-panel">
            <b style={{ fontSize: 14 }}>Notifications Paused</b>
            <p className="ph-card-meta">
              Nothing from either app interrupts your day while this is off. It still happens here.
            </p>
          </div>
        )}
        {!mine && <p className="ph-empty"><b>Nothing Yet</b>Make an account and this fills up.</p>}
        {mine && lane === 'all' && items.length === 0 && (
          <p className="ph-empty"><b>Nothing Yet</b>Post something and see what comes back.</p>
        )}
        {mine && lane === 'all' && items.map((item) => (
          <button key={item.id} type="button" className="ph-note-row" onClick={() => onOpen(item.id)}>
            <span style={{ color: 'var(--ph-red)' }}><HeartGlyph size={20} filled /></span>
            <span className="ph-note-body">
              <b>{tally(item.likes, 'like')} and {tally(item.reposts, 'repost')} · {ago(now, item.at)}</b>
              <p>{item.text}</p>
            </span>
          </button>
        ))}
        {mine && lane === 'mentions' && replies.length === 0 && (
          <p className="ph-empty"><b>No Mentions</b>Reply to somebody and it shows up here.</p>
        )}
        {mine && lane === 'mentions' && replies.map((reply) => (
          <button key={reply.id} type="button" className="ph-note-row" onClick={() => onOpen(reply.parentId ?? reply.id)}>
            <span style={{ color: 'var(--ph-blue)' }}><BubbleGlyph size={20} /></span>
            <span className="ph-note-body">
              <b>You replied · {ago(now, reply.at)}</b>
              <p>{reply.text}</p>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

function ChatPage({
  mine, now, onDrawer, onOpen,
}: {
  mine: SocialProfile | undefined; now: number;
  onDrawer: () => void; onOpen: (profileId: string) => void;
}) {
  const threads = useWorld((s) => threadsOf(s).filter((t) => t.profile.platform === TEXT_PLATFORM));
  const [query, setQuery] = useState('');
  const found = useWorld((s) => searchSocial(s, TEXT_PLATFORM, query));

  return (
    <>
      <div className="ph-x-top">
        <button type="button" className="ph-iconbtn" aria-label="Your Menu" onClick={onDrawer}>
          <Avatar name={mine?.name ?? 'You'} size={30} image={mine?.avatarImage} />
        </button>
        <span className="ph-mid"><b style={{ fontSize: 17 }}>Chat</b></span>
        <span className="ph-right"><ComposeGlyph size={20} /></span>
      </div>
      <div className="ph-body">
        <div style={{ padding: 10 }}>
          <input className="ph-input" value={query} placeholder="Search for somebody" onChange={(e) => setQuery(e.target.value)} />
        </div>
        {query.trim().length >= 2 ? (
          found.profiles.length === 0
            ? <p className="ph-empty">Nothing for that.</p>
            : found.profiles.map((profile) => (
              <button key={profile.id} type="button" className="ph-dm-row" onClick={() => onOpen(profile.id)}>
                <Avatar name={profile.name} size={44} image={profile.avatarImage} />
                <span className="ph-dm-text">
                  <b>{profile.name}</b>
                  <small>@{profile.handle} · {views(profile.followers)} followers</small>
                </span>
              </button>
            ))
        ) : threads.length === 0 ? (
          <p className="ph-empty">
            <b>Nothing In Here</b>
            Search for somebody above and write to them. Whether they answer is up to them.
          </p>
        ) : threads.map((thread) => (
          <button key={thread.profile.id} type="button" className="ph-dm-row" onClick={() => onOpen(thread.profile.id)}>
            <Avatar name={thread.profile.name} size={44} image={thread.profile.avatarImage} />
            <span className="ph-dm-text">
              <b>{thread.profile.name}</b>
              <small>{thread.last.byPlayer ? 'Sent · ' : ''}{thread.last.text.slice(0, 40)} · {ago(now, thread.last.at)}</small>
            </span>
            {thread.unread > 0 && <span className="ph-unread" aria-label="Unread" />}
          </button>
        ))}
      </div>
    </>
  );
}

function ThreadPage({
  profileId, now, onBack, say,
}: { profileId: string; now: number; onBack: () => void; say: (text: string) => void }) {
  const { run } = useGame();
  const profile = useWorld((s) => profileById(s, profileId));
  const messages = useWorld((s) => messagesWith(s, profileId));
  const [text, setText] = useState('');
  const [read, setRead] = useState(false);

  if (!read) { setRead(true); run('feed.read_messages', { profileId }, { silent: true }); }

  const send = () => {
    const result = run('feed.message', { profileId, text }, { silent: true });
    if (result.ok) { setText(''); say('Sent.'); } else say(result.error ?? 'That did not work.');
  };

  return (
    <>
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={profile?.name ?? '?'} size={28} image={profile?.avatarImage} />
          <b style={{ fontSize: 14 }}>@{profile?.handle ?? ''}</b>
        </span>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-body">
        {messages.length === 0 && <p className="ph-empty"><b>Nothing Yet</b>Say something.</p>}
        <div className="ph-thread">
          {messages.map((item) => (
            <span key={item.id} className={`ph-bubble${item.byPlayer ? ' ph-mine' : ''}`}>
              {item.text}
              <small style={{ display: 'block', opacity: 0.6, fontSize: 10, marginTop: 3 }}>{ago(now, item.at)}</small>
            </span>
          ))}
        </div>
      </div>
      <EmojiRow app="text" onPick={(emoji) => setText((current) => current + emoji)} />
      <div style={{ padding: 10, display: 'flex', gap: 8, borderTop: '1px solid var(--ph-line)' }}>
        <input className="ph-input" value={text} placeholder="Start a message" onChange={(e) => setText(e.target.value)} />
        <button type="button" className="ph-btn-solid" disabled={text.trim().length === 0} onClick={send}>Send</button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// A profile
// ---------------------------------------------------------------------------

function ProfilePage({
  profile, now, onBack, onOpen, onQuote, onMessage, onPremium, onWhoCard, say,
}: {
  profile: SocialProfile; now: number; onBack: () => void;
  onOpen: (id: string) => void; onQuote: (id: string) => void;
  onMessage: (id: string) => void; onPremium: () => void;
  onWhoCard: (id: string) => void; say: (text: string) => void;
}) {
  const { run } = useGame();
  const items = useWorld((s) => catalogOf(s, profile));
  const replies = useWorld((s) => Object.values(s.universe.socialItems)
    .filter((i) => i.profileId === profile.id && i.kind === 'reply')
    .sort((a, b) => b.at - a.at));
  const reposted = useWorld((s) => Object.values(s.universe.socialItems)
    .filter((i) => i.reposted)
    .map((i) => itemById(s, i.id))
    .filter((i): i is SocialItem => Boolean(i) && i!.platform === TEXT_PLATFORM));
  const following = useWorld((s) => isFollowing(s, s.player.id, profile.id));
  const own = useWorld((s) => profile.ownerId === s.player.id);
  const muted = useWorld((s) => isMuted(s, profile.id));
  const blocked = useWorld((s) => isBlocked(s, profile.id));
  // Who to follow comes off what the player has already chosen. With nothing
  // chosen yet it is simply the biggest accounts, which is what a new account
  // is shown.
  const suggestions = useWorld((s) => {
    const liked = new Set<string>();
    for (const follow of Object.values(s.universe.socialFollows)) {
      const followed = profileById(s, follow.profileId);
      if (followed) liked.add(followed.topic);
    }
    const pool = profilesOf(s, TEXT_PLATFORM)
      .filter((p) => !p.ownerId && !isFollowing(s, s.player.id, p.id) && !isBlocked(s, p.id));
    const near = liked.size > 0 ? pool.filter((p) => liked.has(p.topic)) : [];
    return (near.length >= 3 ? near : pool).sort((a, b) => b.followers - a.followers).slice(0, 6);
  });
  const [shelf, setShelf] = useState<'posts' | 'replies' | 'reposts' | 'videos'>('posts');
  const [editing, setEditing] = useState(false);

  const follow = () => {
    const result = run(following ? 'feed.unfollow' : 'feed.follow', { profileId: profile.id }, { silent: true });
    if (result.ok) say(following ? `You no longer follow @${profile.handle}.` : `Following @${profile.handle}.`);
    else say(result.error ?? 'That did not work.');
  };

  const rowProps = { now, onOpen, onWho: () => undefined, onQuote, say };
  const shown = shelf === 'posts' ? items : shelf === 'replies' ? replies : shelf === 'reposts' ? reposted : [];

  return (
    <>
      <div className="ph-so-top" style={{ position: 'absolute', zIndex: 3, background: 'none', width: '100%' }}>
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back" style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', borderRadius: '50%', padding: 6 }}>
          <BackGlyph />
        </button>
      </div>
      <div className="ph-body">
        <div className="ph-x-banner" style={{ background: `linear-gradient(120deg, ${tint(profile.handle)}, ${tint(profile.name)})` }} />
        <div className="ph-x-ident">
          <Avatar name={profile.name} size={72} image={profile.avatarImage} />
          <div className="ph-line">
            <b>{profile.name}</b>
            {profile.verified
              ? <span className="ph-tick" aria-label="Verified"><TickGlyph /></span>
              : own && <button type="button" className="ph-btn-outline" onClick={onPremium}>Get Verified</button>}
          </div>
          <small>@{profile.handle}</small>
          <p style={{ margin: '8px 0 0', fontSize: 13.5 }}>{profile.bio || 'No bio yet.'}</p>
          <small style={{ marginTop: 8 }}>
            Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
          </small>
          <div className="ph-drawer-counts">
            <b>{views(profile.following)}</b> Following{'   '}
            <b>{views(profile.followers)}</b> Followers
          </div>
        </div>

        <div className="ph-x-buttons">
          {own ? (
            <>
              <button type="button" onClick={() => say(`Your page is at @${profile.handle}.`)}>Share Profile</button>
              <button type="button" onClick={() => setEditing((v) => !v)}>Edit Profile</button>
              <button type="button" onClick={onPremium}>Premium</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => onMessage(profile.id)}>Message</button>
              <button
                type="button"
                style={following ? undefined : { background: 'var(--ph-blue)', color: '#fff', borderColor: 'transparent' }}
                onClick={follow}
              >
                {following ? 'Following' : 'Follow'}
              </button>
              <button
                type="button"
                aria-label={muted ? 'Unmute' : 'Mute'}
                onClick={() => {
                  const result = run('feed.mute', { profileId: profile.id }, { silent: true });
                  if (result.ok) say(muted ? `@${profile.handle} is back on your timeline.` : `@${profile.handle} is off your timeline.`);
                }}
              >
                {muted ? 'Unmute' : 'Mute'}
              </button>
              <button
                type="button"
                aria-label={blocked ? 'Unblock' : 'Block'}
                onClick={() => {
                  const result = run('feed.block', { profileId: profile.id }, { silent: true });
                  if (result.ok) say(blocked ? `@${profile.handle} is unblocked.` : `@${profile.handle} is blocked.`);
                  else say(result.error ?? 'That did not work.');
                }}
              >
                {blocked ? 'Unblock' : 'Block'}
              </button>
            </>
          )}
        </div>

        {editing && own && <EditProfile profile={profile} onDone={() => setEditing(false)} say={say} />}

        <div className="ph-x-rail">
          <button type="button" className={shelf === 'posts' ? 'ph-on' : ''} onClick={() => setShelf('posts')}>Posts</button>
          <button type="button" className={shelf === 'replies' ? 'ph-on' : ''} onClick={() => setShelf('replies')}>Replies</button>
          <button type="button" className={shelf === 'reposts' ? 'ph-on' : ''} onClick={() => setShelf('reposts')}>Reposts</button>
          <button type="button" className={shelf === 'videos' ? 'ph-on' : ''} onClick={() => setShelf('videos')}>Videos</button>
        </div>

        {own && shelf === 'posts' && suggestions.length > 0 && (
          <>
            <div className="ph-section-head">Who To Follow</div>
            <div className="ph-follow-cards">
              {suggestions.map((suggestion) => (
                <button key={suggestion.id} type="button" className="ph-follow-card" onClick={() => onWhoCard(suggestion.id)} aria-label={suggestion.name}>
                  <span className="ph-strip" style={{ display: 'block', background: `linear-gradient(120deg, ${tint(suggestion.handle)}, ${tint(suggestion.name)})` }} />
                  <span className="ph-inner">
                    <Avatar name={suggestion.name} size={34} image={suggestion.avatarImage} />
                    <b>{suggestion.name}</b>
                    <small>@{suggestion.handle}</small>
                    <p>{suggestion.bio}</p>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {shelf === 'videos' && <p className="ph-empty">This account posts text, not video.</p>}
        {shelf !== 'videos' && shown.length === 0 && <p className="ph-empty">Nothing here yet.</p>}
        {shelf !== 'videos' && shown.map((item) => <Tweet key={item.id} item={item} {...rowProps} />)}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Bookmarks, communities, lists, spaces, studio
// ---------------------------------------------------------------------------

function BookmarksPage({ onBack, ...rest }: RowProps & { onBack: () => void }) {
  const saved = useWorld((s) => Object.values(s.universe.socialItems)
    .filter((i) => i.saved)
    .map((i) => itemById(s, i.id))
    .filter((i): i is SocialItem => Boolean(i) && i!.platform === TEXT_PLATFORM));
  return (
    <>
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
        <b style={{ fontSize: 15 }}>Bookmarks</b>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-body">
        {saved.length === 0
          ? <p className="ph-empty"><b>Nothing Saved</b>The bookmark under a post keeps it here.</p>
          : saved.map((item) => <Tweet key={item.id} item={item} {...rest} />)}
      </div>
    </>
  );
}

/**
 * Communities, Lists and Spaces, which are three different things and so are
 * built as three different things.
 *
 * A community belongs to the app, one to a subject, and you are either in it
 * or you are not. A list is yours: you name it, you put accounts in it, and it
 * gives you a timeline of only those. A space is an hour you host out loud,
 * and when the hour is up it is over with a record of how many came, which is
 * the only honest way to hold a live room inside a save.
 */
function RoomsPage({
  kind, onBack, ...rest
}: RowProps & { kind: 'communities' | 'lists' | 'spaces'; onBack: () => void }) {
  if (kind === 'communities') return <CommunitiesPage onBack={onBack} {...rest} />;
  if (kind === 'lists') return <ListsPage onBack={onBack} {...rest} />;
  return <SpacesPage onBack={onBack} {...rest} />;
}

/** The accounts of a room, and on your own lists the way to take one out. */
function RoomPeople({
  profileIds, onWho, onRemove,
}: { profileIds: string[]; onWho: (id: string) => void; onRemove?: (id: string) => void }) {
  const people = useWorld((s) => profileIds
    .map((id) => profileById(s, id))
    .filter((profile): profile is SocialProfile => Boolean(profile)));

  if (people.length === 0) {
    return <p className="ph-empty"><b>Nobody In Here Yet</b>Add accounts and their posts arrive under Timeline.</p>;
  }
  return (
    <>
      {people.map((profile) => (
        <div key={profile.id} className="ph-dm-row">
          <button type="button" className="ph-iconbtn" onClick={() => onWho(profile.id)} aria-label={profile.name}>
            <Avatar name={profile.name} size={40} image={profile.avatarImage} />
          </button>
          <span className="ph-dm-text">
            <b>{profile.name}</b>
            <small>@{profile.handle} · {views(profile.followers)} followers</small>
          </span>
          {onRemove && (
            <button type="button" className="ph-btn-outline" onClick={() => onRemove(profile.id)}>Remove</button>
          )}
        </div>
      ))}
    </>
  );
}

/** What a room's accounts have been saying, newest first. */
function RoomTimeline({ profileIds, ...rest }: RowProps & { profileIds: string[] }) {
  const items = useWorld((s) => {
    const wanted = new Set(profileIds);
    return recentItems(s, TEXT_PLATFORM, 4)
      .filter((item) => wanted.has(item.profileId))
      .sort((a, b) => b.at - a.at)
      .slice(0, 40);
  });
  if (items.length === 0) {
    return <p className="ph-empty"><b>Nothing Said Yet</b>Nobody in here has posted lately.</p>;
  }
  return <>{items.map((item) => <Tweet key={item.id} item={item} {...rest} />)}</>;
}

function CommunitiesPage({ onBack, ...rest }: RowProps & { onBack: () => void }) {
  const { run } = useGame();
  const rooms = useWorld((s) => roomsOf(s, 'community'));
  const [openId, setOpenId] = useState<string | null>(null);
  const [pane, setPane] = useState<'timeline' | 'people'>('timeline');
  const open = rooms.find((room) => room.id === openId);

  const join = (roomId: string, name: string, joined: boolean) => {
    const result = run('feed.join_room', { roomId }, { silent: true });
    if (result.ok) rest.say(joined ? `Left ${name}.` : `Joined ${name}.`);
    else rest.say(result.error ?? 'That did not work.');
  };

  return (
    <>
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={() => (open ? setOpenId(null) : onBack())} aria-label="Back"><BackGlyph /></button>
        <b style={{ fontSize: 15 }}>{open ? open.name : 'Communities'}</b>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-body">
        {open ? (
          <>
            <div className="ph-panel">
              <p style={{ margin: 0, fontSize: 13 }}>
                {views(open.members)} members, {open.profileIds.length} of them accounts you can read.
              </p>
              <div className="ph-actions" style={{ padding: '10px 0 0' }}>
                <button
                  type="button"
                  className={open.joined ? 'ph-btn-outline' : 'ph-btn-solid'}
                  onClick={() => join(open.id, open.name, Boolean(open.joined))}
                >
                  {open.joined ? 'Leave' : 'Join'}
                </button>
              </div>
            </div>
            <div className="ph-x-tabs">
              <button type="button" className={pane === 'timeline' ? 'ph-on' : ''} onClick={() => setPane('timeline')}>Timeline</button>
              <button type="button" className={pane === 'people' ? 'ph-on' : ''} onClick={() => setPane('people')}>People</button>
            </div>
            {pane === 'timeline'
              ? <RoomTimeline profileIds={open.profileIds} {...rest} />
              : <RoomPeople profileIds={open.profileIds} onWho={rest.onWho} />}
          </>
        ) : (
          <>
            <p className="ph-card-meta" style={{ padding: '10px 14px 0' }}>
              One to a subject, made out of who is actually on the app. Joining one puts its
              timeline a tap away.
            </p>
            {rooms.map((room) => (
              <div key={room.id} className="ph-dm-row">
                <button type="button" className="ph-dm-text" style={{ border: 0, background: 'none', color: 'inherit', font: 'inherit', textAlign: 'left', padding: 0 }} onClick={() => { setOpenId(room.id); setPane('timeline'); }}>
                  <b>{room.name}</b>
                  <small>{views(room.members)} members · {room.profileIds.length} accounts</small>
                </button>
                <button
                  type="button"
                  className={room.joined ? 'ph-btn-outline' : 'ph-btn-solid'}
                  onClick={() => join(room.id, room.name, Boolean(room.joined))}
                >
                  {room.joined ? 'Joined' : 'Join'}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

function ListsPage({ onBack, ...rest }: RowProps & { onBack: () => void }) {
  const { run } = useGame();
  const lists = useWorld((s) => roomsOf(s, 'list').filter((room) => room.mine));
  const [openId, setOpenId] = useState<string | null>(null);
  const [pane, setPane] = useState<'timeline' | 'people' | 'add'>('timeline');
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const found = useWorld((s) => (query.trim().length >= 2 ? searchSocial(s, TEXT_PLATFORM, query).profiles : []));
  const open = lists.find((room) => room.id === openId);

  const make = () => {
    const result = run<{ roomId: string }>('feed.create_list', { name }, { silent: true });
    if (!result.ok) { rest.say(result.error ?? 'That did not work.'); return; }
    rest.say(`${name.trim()} made. Add accounts to it.`);
    setOpenId(result.value?.roomId ?? null);
    setPane('add');
    setName('');
    setNaming(false);
  };

  const edit = (roomId: string, profileId: string, remove?: boolean) => {
    const result = run('feed.edit_list', { roomId, profileId, remove }, { silent: true });
    if (!result.ok) rest.say(result.error ?? 'That did not work.');
    else rest.say(remove ? 'Taken off the list.' : 'Added to the list.');
  };

  const drop = (room: { id: string; name: string }) => {
    const result = run('feed.delete_list', { roomId: room.id }, { silent: true });
    if (!result.ok) { rest.say(result.error ?? 'That did not work.'); return; }
    rest.say(`${room.name} deleted.`);
    setOpenId(null);
  };

  return (
    <>
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={() => (open ? setOpenId(null) : onBack())} aria-label="Back"><BackGlyph /></button>
        <b style={{ fontSize: 15 }}>{open ? open.name : 'Lists'}</b>
        {open
          ? <span style={{ width: 22 }} />
          : (
            <button type="button" className="ph-iconbtn" onClick={() => setNaming((was) => !was)} aria-label="New List">
              <PlusGlyph size={20} />
            </button>
          )}
      </div>
      <div className="ph-body">
        {open ? (
          <>
            <div className="ph-x-tabs ph-three">
              <button type="button" className={pane === 'timeline' ? 'ph-on' : ''} onClick={() => setPane('timeline')}>Timeline</button>
              <button type="button" className={pane === 'people' ? 'ph-on' : ''} onClick={() => setPane('people')}>On The List</button>
              <button type="button" className={pane === 'add' ? 'ph-on' : ''} onClick={() => setPane('add')}>Add</button>
            </div>
            {pane === 'timeline' && <RoomTimeline profileIds={open.profileIds} {...rest} />}
            {pane === 'people' && (
              <>
                <RoomPeople
                  profileIds={open.profileIds}
                  onWho={rest.onWho}
                  onRemove={(profileId) => edit(open.id, profileId, true)}
                />
                <div className="ph-actions" style={{ padding: '12px' }}>
                  <button type="button" className="ph-btn-outline" onClick={() => drop(open)}>Delete This List</button>
                </div>
              </>
            )}
            {pane === 'add' && (
              <>
                <div style={{ padding: '10px 12px 0' }}>
                  <label className="ph-label" htmlFor="ph-list-find">Find An Account</label>
                  <input
                    id="ph-list-find"
                    className="ph-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Name or handle"
                  />
                </div>
                {found.length === 0
                  ? <p className="ph-empty"><b>Search The App</b>Type a name and add whoever you want on the list.</p>
                  : found.map((profile) => {
                    const on = open.profileIds.includes(profile.id);
                    return (
                      <div key={profile.id} className="ph-dm-row">
                        <button type="button" className="ph-iconbtn" onClick={() => rest.onWho(profile.id)} aria-label={profile.name}>
                          <Avatar name={profile.name} size={40} image={profile.avatarImage} />
                        </button>
                        <span className="ph-dm-text">
                          <b>{profile.name}</b>
                          <small>@{profile.handle} · {views(profile.followers)} followers</small>
                        </span>
                        <button
                          type="button"
                          className={on ? 'ph-btn-outline' : 'ph-btn-solid'}
                          onClick={() => edit(open.id, profile.id, on)}
                        >
                          {on ? 'Remove' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
              </>
            )}
          </>
        ) : (
          <>
            {naming && (
              <div className="ph-panel">
                <label className="ph-label" htmlFor="ph-list-name">List Name</label>
                <input
                  id="ph-list-name"
                  className="ph-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Who you want to read"
                />
                <div className="ph-actions" style={{ padding: '10px 0 0' }}>
                  <button type="button" className="ph-btn-solid" disabled={name.trim().length < 2} onClick={make}>Make The List</button>
                  <button type="button" className="ph-btn-outline" onClick={() => { setNaming(false); setName(''); }}>Cancel</button>
                </div>
              </div>
            )}
            {lists.length === 0 && !naming
              ? <p className="ph-empty"><b>No Lists Yet</b>A list is a timeline of only the accounts you put on it.</p>
              : lists.map((room) => (
                <button key={room.id} type="button" className="ph-dm-row" onClick={() => { setOpenId(room.id); setPane('timeline'); }}>
                  <span className="ph-dm-text">
                    <b>{room.name}</b>
                    <small>{tally(room.profileIds.length, 'account')} on it</small>
                  </span>
                </button>
              ))}
          </>
        )}
      </div>
    </>
  );
}

function SpacesPage({ onBack, ...rest }: RowProps & { onBack: () => void }) {
  const { run } = useGame();
  const mine = useWorld((s) => myProfile(s, TEXT_PLATFORM));
  const held = useWorld((s) => roomsOf(s, 'space').sort((a, b) => (b.startedAt ?? b.createdAt) - (a.startedAt ?? a.createdAt)));
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState(60);

  const start = () => {
    const result = run<{ peak: number }>('feed.start_space', { name, minutes }, { silent: true });
    if (!result.ok) { rest.say(result.error ?? 'That did not work.'); return; }
    rest.say(`Space over. ${tally(result.value?.peak ?? 0, 'person', 'people')} at the top of it.`);
    setName('');
  };

  return (
    <>
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
        <b style={{ fontSize: 15 }}>Spaces</b>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-body">
        {!mine ? (
          <p className="ph-empty"><b>No Account Here</b>Make one before you host a room.</p>
        ) : (
          <div className="ph-panel">
            <div className="ph-label">Host A Space</div>
            <label className="ph-label" htmlFor="ph-space-name">What It Is About</label>
            <input
              id="ph-space-name"
              className="ph-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Late night questions"
            />
            <div className="ph-label">How Long</div>
            <div className="ph-chips">
              {[30, 60, 90, 120].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`ph-chip${minutes === option ? ' ph-on' : ''}`}
                  onClick={() => setMinutes(option)}
                >
                  {option} Minutes
                </button>
              ))}
            </div>
            <p className="ph-card-meta">
              You are on air for the whole of it, and those are hours out of the day like
              any others.
            </p>
            <div className="ph-actions" style={{ padding: '4px 0 0' }}>
              <button type="button" className="ph-btn-solid" disabled={name.trim().length < 3} onClick={start}>Start The Space</button>
            </div>
          </div>
        )}
        <div className="ph-label" style={{ padding: '0 14px' }}>Spaces You Have Held</div>
        {held.length === 0
          ? <p className="ph-empty"><b>None Yet</b>A space you host is kept here once it is over.</p>
          : held.map((room) => (
            <div key={room.id} className="ph-panel">
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>{room.name}</p>
              <p className="ph-card-meta">
                {tally(room.peak ?? room.members, 'listener')} at the top of it
                {room.startedAt && room.endedAt
                  ? `, over ${Math.round((room.endedAt - room.startedAt) / 60_000)} minutes`
                  : ''}
                , {ago(rest.now, room.startedAt ?? room.createdAt)}.
              </p>
            </div>
          ))}
      </div>
    </>
  );
}

function StudioPage({ onBack, onPremium }: { onBack: () => void; onPremium: () => void }) {
  const mine = useWorld((s) => myProfile(s, TEXT_PLATFORM));
  const stats = useWorld((s) => (mine ? socialAnalytics(s, mine.id) : undefined));
  const minutes = useWorld((s) => screenTime(s, TEXT_PLATFORM));
  const items = useWorld((s) => (mine ? catalogOf(s, mine) : []));
  const best = [...items].sort((a, b) => b.likes - a.likes)[0];

  return (
    <>
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
        <b style={{ fontSize: 15 }}>Creator Studio</b>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-body">
        {!mine || !stats ? <p className="ph-empty">You have no account here yet.</p> : (
          <>
            <div className="ph-panel">
              <div className="ph-label">Impressions</div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{views(stats.impressions)}</p>
              <p className="ph-card-meta">
                Across {stats.posts} posts. {views(stats.likes)} likes, {views(stats.comments)} replies,
                {' '}{views(stats.reposts)} reposts.
              </p>
            </div>
            {best && (
              <div className="ph-panel">
                <div className="ph-label">Your Best Post</div>
                <p style={{ margin: 0, fontSize: 13.5 }}>{best.text}</p>
                <p className="ph-card-meta">{views(best.likes)} likes.</p>
              </div>
            )}
            <div className="ph-panel">
              <div className="ph-label">Your Time Here</div>
              <p className="ph-card-meta">{minutes} minutes today, out of your day.</p>
            </div>
            <div className="ph-actions" style={{ padding: '0 12px' }}>
              <button type="button" className="ph-btn-solid" onClick={onPremium}>Payouts And Premium</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// The assistant
// ---------------------------------------------------------------------------

/**
 * The assistant tab.
 *
 * It answers out of this save and nothing else: who you follow, what is being
 * talked about, what your posts did, how long you have been on the app. It is
 * not a language model and it does not pretend to be one, so it says plainly
 * when a question is outside what it can see.
 */
function AskPage({
  mine, onDrawer, say,
}: { mine: SocialProfile | undefined; onDrawer: () => void; say: (text: string) => void }) {
  const [question, setQuestion] = useState('');
  const [log, setLog] = useState<{ mine: boolean; text: string }[]>([]);
  const list = useWorld((s) => trends(s, 5));
  const stats = useWorld((s) => (mine ? socialAnalytics(s, mine.id) : undefined));
  const following = useWorld((s) => Object.values(s.universe.socialFollows).length);
  const minutes = useWorld((s) => screenTime(s, TEXT_PLATFORM));

  const answer = (text: string): string => {
    const q = text.toLowerCase();
    if (/trend|happening|talking/.test(q)) {
      return `Right now: ${list.map((t) => t.label).join(', ')}. That is counted off what has been posted in the last two days.`;
    }
    if (/follow/.test(q)) return `You follow ${following} accounts across both apps.`;
    if (/time|long|minutes|hours/.test(q)) return `${minutes} minutes on this app today.`;
    if (/impression|reach|views/.test(q)) {
      return stats ? `${views(stats.impressions)} impressions across ${stats.posts} posts.` : 'You have no account here yet.';
    }
    if (/money|pay|earn|premium/.test(q)) {
      return stats?.monetized
        ? 'The advertising share is being counted on your impressions and paid on the month.'
        : `Premium is ${formatMoney(X_PREMIUM_MONTHLY)} a month, and the share needs five hundred followers behind it.`;
    }
    if (/best|top post/.test(q)) {
      return stats?.best ? `Your best is at ${views(stats.best.likes)} likes: "${stats.best.text.slice(0, 90)}"` : 'You have not posted anything yet.';
    }
    return 'I can only see what is in this save: what is trending, who you follow, what your posts did, and how long you have been in here. Ask me one of those.';
  };

  const ask = (text: string) => {
    const asked = text.trim();
    if (!asked) return;
    setLog((current) => [...current, { mine: true, text: asked }, { mine: false, text: answer(asked) }]);
    setQuestion('');
  };

  return (
    <>
      <div className="ph-x-top">
        <button type="button" className="ph-iconbtn" aria-label="Your Menu" onClick={onDrawer}>
          <Avatar name={mine?.name ?? 'You'} size={30} image={mine?.avatarImage} />
        </button>
        <span className="ph-mid" />
        <span className="ph-right">
          <button type="button" className="ph-iconbtn" aria-label="Clear" onClick={() => { setLog([]); say('Cleared.'); }}>
            <TimelineGlyph size={20} />
          </button>
        </span>
      </div>
      <div className="ph-grok">
        <div className="ph-grok-log">
          {log.length === 0 ? (
            <span className="ph-grok-mark" aria-hidden="true"><AskGlyph size={72} /></span>
          ) : (
            log.map((line, index) => (
              <span key={index} className={`ph-bubble${line.mine ? ' ph-mine' : ''}`}>{line.text}</span>
            ))
          )}
        </div>
        <div className="ph-grok-tiles">
          <button type="button" onClick={() => ask('What is trending?')}>What Is Trending</button>
          <button type="button" onClick={() => ask('How did my posts do?')}>How My Posts Did</button>
          <button type="button" onClick={() => ask('How long have I been on here?')}>My Time Here</button>
          <button type="button" onClick={() => ask('How does the money work?')}>How The Money Works</button>
        </div>
        <div className="ph-grok-ask">
          <input
            value={question}
            placeholder="Ask anything about this save"
            aria-label="Ask The Assistant"
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') ask(question); }}
          />
          <button type="button" className="ph-btn-solid" onClick={() => ask(question)}>Ask</button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Writing one
// ---------------------------------------------------------------------------

function Composer({
  quoteId, onClose, say, hasProfile,
}: { quoteId?: string; onClose: () => void; say: (text: string) => void; hasProfile: boolean }) {
  const { run } = useGame();
  const [text, setText] = useState('');
  const [rest, setRest] = useState<string[]>([]);
  const quoted = useWorld((s) => (quoteId ? itemById(s, quoteId) : undefined));
  const quotedWho = useWorld((s) => (quoted ? profileById(s, quoted.profileId) : undefined));
  const parts = [text, ...rest];
  const over = parts.some((part) => part.length > TEXT_LIMIT);

  const post = () => {
    const result = quoteId
      ? run('feed.quote', { itemId: quoteId, text }, { silent: true })
      : rest.length > 0
        ? run('feed.thread', { parts }, { silent: true })
        : run('feed.post', { platform: TEXT_PLATFORM, kind: 'text', text }, { silent: true });
    if (result.ok) { say(rest.length > 0 ? `Thread posted, ${parts.length} of them.` : 'Posted.'); onClose(); }
    else say(result.error ?? 'That did not work.');
  };

  if (!hasProfile) {
    return (
      <div className="ph-sheet">
        <div className="ph-sheet-top">
          <button type="button" className="ph-iconbtn" onClick={onClose} aria-label="Close"><BackGlyph /></button>
          <b>New Post</b>
        </div>
        <div className="ph-body"><MakeAccount say={say} onDone={() => onClose()} /></div>
      </div>
    );
  }

  return (
    <div className="ph-sheet">
      <div className="ph-sheet-top">
        <button type="button" className="ph-iconbtn" onClick={onClose} aria-label="Close"><BackGlyph /></button>
        <b>{quoteId ? 'Quote' : rest.length > 0 ? `Thread Of ${parts.length}` : 'New Post'}</b>
        <button type="button" className="ph-btn-solid ph-right" disabled={over || text.trim().length === 0} onClick={post}>
          Post
        </button>
      </div>
      <div className="ph-compose">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={quoteId ? 'Add a comment' : 'What is happening?'}
          aria-label="What You Are Posting"
        />
        {rest.map((part, index) => (
          <div key={index} style={{ padding: '0 14px 8px' }}>
            <div className="ph-label">Post {index + 2}</div>
            <textarea
              className="ph-input"
              rows={3}
              value={part}
              aria-label={`Post ${index + 2} Of The Thread`}
              onChange={(e) => setRest((all) => all.map((one, at) => (at === index ? e.target.value : one)))}
            />
            <div className="ph-actions">
              <span className={`ph-count${part.length > TEXT_LIMIT ? ' ph-over' : ''}`}>{TEXT_LIMIT - part.length}</span>
              <button type="button" className="ph-btn-outline" onClick={() => setRest((all) => all.filter((_, at) => at !== index))}>
                Remove
              </button>
            </div>
          </div>
        ))}

        {!quoteId && rest.length < 24 && (
          <div className="ph-actions" style={{ padding: '0 14px 8px' }}>
            <button type="button" className="ph-btn-outline" onClick={() => setRest((all) => [...all, ''])}>
              {rest.length === 0 ? 'Make It A Thread' : 'Add Another Post'}
            </button>
          </div>
        )}

        {quoted && quotedWho && (
          <div className="ph-tweet-quote" style={{ margin: '0 14px 10px' }}>
            <div className="ph-tweet-head"><b>{quotedWho.name}</b><span>@{quotedWho.handle}</span></div>
            <p className="ph-tweet-text">{quoted.text}</p>
          </div>
        )}
        <EmojiRow app="text" onPick={(emoji) => setText((current) => current + emoji)} />
        <div className="ph-compose-foot">
          <span className="ph-card-meta" style={{ margin: 0 }}>Writing one takes a few minutes of the day.</span>
          <span className={`ph-count${over ? ' ph-over' : ''}`}>{TEXT_LIMIT - text.length}</span>
        </div>
      </div>
    </div>
  );
}

function EditProfile({
  profile, onDone, say,
}: { profile: SocialProfile; onDone: () => void; say: (text: string) => void }) {
  const { run } = useGame();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [image, setImage] = useState<string | undefined>(profile.avatarImage);
  return (
    <div className="ph-panel">
      <div className="ph-label">Picture</div>
      <ImagePicker frame="avatar" image={image} label="Your Profile Picture" onChange={setImage} />
      <div className="ph-label">Name</div>
      <input className="ph-input" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="ph-label">Bio</div>
      <input className="ph-input" value={bio} maxLength={160} onChange={(e) => setBio(e.target.value)} />
      <div className="ph-actions">
        <button
          type="button"
          className="ph-btn-solid"
          onClick={() => {
            const result = run('feed.edit_profile', { profileId: profile.id, name, bio, image }, { silent: true });
            if (result.ok) { say('Profile saved.'); onDone(); } else say(result.error ?? 'That did not work.');
          }}
        >
          Save
        </button>
        <button type="button" className="ph-btn-outline" onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}

function MakeAccount({
  say, onDone,
}: { say: (text: string) => void; onDone?: (profileId: string) => void }) {
  const { run } = useGame();
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  return (
    <div className="ph-body">
      <div className="ph-panel">
        <b style={{ fontSize: 16 }}>Make Your Account</b>
        <p className="ph-card-meta">
          An account on the text app. Premium is what turns the share of the advertising on,
          and it is only worth taking once people are actually reading you.
        </p>
        <div className="ph-label">Handle</div>
        <input className="ph-input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourname" />
        <div className="ph-label">Name</div>
        <input className="ph-input" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="ph-label">Bio</div>
        <input className="ph-input" value={bio} maxLength={160} onChange={(e) => setBio(e.target.value)} />
        <div className="ph-actions">
          <button
            type="button"
            className="ph-btn-solid"
            onClick={() => {
              const result = run<{ profileId: string }>('feed.create_profile', { platform: TEXT_PLATFORM, handle, name, bio }, { silent: true });
              if (result.ok) { say('That is your account.'); onDone?.(result.value!.profileId); }
              else say(result.error ?? 'That did not work.');
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Premium, and what it pays
// ---------------------------------------------------------------------------

function PremiumPage({ onBack, say }: { onBack: () => void; say: (text: string) => void }) {
  const { run } = useGame();
  const mine = useWorld((s) => myProfile(s, TEXT_PLATFORM));
  const stats = useWorld((s) => (mine ? socialAnalytics(s, mine.id) : undefined));
  const payouts = useWorld((s) => Object.values(s.universe.creatorPayouts)
    .filter((p) => p.accountId === mine?.accountId)
    .sort((a, b) => b.month - a.month)
    .slice(0, 6));

  return (
    <>
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
        <b style={{ fontSize: 15 }}>Premium</b>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-body">
        {!mine ? <p className="ph-empty">You have no account here yet.</p> : (
          <>
            <div className="ph-panel">
              <b style={{ fontSize: 16 }}>{mine.verified ? 'You Are On Premium' : 'Premium'}</b>
              <p className="ph-card-meta">
                {formatMoney(X_PREMIUM_MONTHLY)} a month, taken every month. It puts the check beside your
                name and turns on the share of the advertising sold against your impressions. It lapses
                on its own if the money is not there.
              </p>
              <div className="ph-actions">
                {mine.verified ? (
                  <button
                    type="button"
                    className="ph-btn-outline"
                    onClick={() => {
                      const result = run('feed.leave_premium', {}, { silent: true });
                      say(result.ok ? 'Premium canceled. Nothing more will be taken.' : result.error ?? 'That did not work.');
                    }}
                  >
                    Cancel Premium
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ph-btn-solid"
                    onClick={() => {
                      const result = run('feed.join_premium', {}, { silent: true });
                      say(result.ok ? 'Premium is on.' : result.error ?? 'That did not work.');
                    }}
                  >
                    Subscribe
                  </button>
                )}
              </div>
            </div>

            {stats && (
              <div className="ph-panel">
                <div className="ph-label">Impressions</div>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{views(stats.impressions)}</p>
                <p className="ph-card-meta">
                  {stats.monetized
                    ? 'The share is being counted on these and paid on the month.'
                    : 'Premium and five hundred followers is what the share needs.'}
                </p>
                {stats.best && (
                  <p className="ph-card-meta">
                    Best of yours: {SOCIAL_TOPIC_LABEL[stats.best.topic as SocialTopic]} ·
                    {' '}{views(stats.best.likes)} likes.
                  </p>
                )}
              </div>
            )}

            <div className="ph-section-head">Paid Out</div>
            {payouts.length === 0 && <p className="ph-empty">No month has been paid yet.</p>}
            {payouts.map((payout) => (
              <div key={payout.id} className="ph-set-row" style={{ cursor: 'default' }}>
                {new Date(payout.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                <span className="ph-set-value">{formatMoney(payout.total)}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

function SetRow({
  icon, title, body, value, onClick,
}: { icon: React.ReactNode; title: string; body: string; value?: string; onClick?: () => void }) {
  return (
    <button type="button" className="ph-x-set" onClick={onClick} disabled={!onClick}>
      <span style={{ color: 'var(--ph-muted)', paddingTop: 2 }}>{icon}</span>
      <span className="ph-x-set-body">
        <b>{title}{value ? ` · ${value}` : ''}</b>
        <p>{body}</p>
      </span>
    </button>
  );
}

function SettingsPage({
  onBack, onPremium, say,
}: { onBack: () => void; onPremium: () => void; say: (text: string) => void }) {
  const { run } = useGame();
  const mine = useWorld((s) => myProfile(s, TEXT_PLATFORM));
  const settings = useWorld((s) => settingsOf(s));
  const minutes = useWorld((s) => screenTime(s, TEXT_PLATFORM));
  const items = useWorld((s) => Object.values(s.universe.socialItems).length);
  const [query, setQuery] = useState('');

  const set = (patch: Record<string, unknown>) => {
    const result = run('feed.settings', patch, { silent: true });
    if (!result.ok) say(result.error ?? 'That did not work.');
  };

  const rows = [
    {
      key: 'account',
      icon: <YouGlyph size={20} />,
      title: 'Your Account',
      body: `The account this phone is signed in to${mine ? `, which is @${mine.handle}` : '. You have not made one yet'}.`,
      onClick: () => say(mine ? `Joined ${new Date(mine.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}.` : 'Make one from the Profile tab.'),
    },
    {
      key: 'privacy',
      icon: <ShieldGlyph size={20} />,
      title: 'Privacy And Safety',
      body: 'Who can see what you post, and who cannot reach you at all.',
      value: `${settings.blockedProfileIds.length} blocked`,
      onClick: () => say(`${settings.blockedProfileIds.length} blocked, ${settings.mutedProfileIds.length} muted. Block and mute are on each account's page.`),
    },
    {
      key: 'premium',
      icon: <TickGlyph size={17} />,
      title: 'Premium',
      body: 'The subscription, the badge, and the share of the advertising against your impressions.',
      value: mine?.verified ? 'On' : 'Off',
      onClick: onPremium,
    },
    {
      key: 'timeline',
      icon: <TimelineGlyph size={20} />,
      title: 'Timeline',
      body: 'Whether the counts under a post are shown to you at all.',
      value: settings.hideCounts ? 'Counts Hidden' : 'Counts Shown',
      onClick: () => set({ hideCounts: !settings.hideCounts }),
    },
    {
      key: 'notifications',
      icon: <BellGlyph size={20} />,
      title: 'Notifications',
      body: 'Whether anything from either app is allowed to interrupt your day.',
      value: settings.notificationsOn ? 'On' : 'Paused',
      onClick: () => set({ notificationsOn: !settings.notificationsOn }),
    },
    {
      key: 'storage',
      icon: <ReelsGlyph size={20} />,
      title: 'Storage',
      body: 'What this app is keeping inside your save.',
      value: `${items} kept`,
      onClick: () => say(`${items} posts, replies and marks of your own are stored. Everybody else's is worked out when you look at it, which is why the save stays small.`),
    },
    {
      key: 'time',
      icon: <ViewsGlyph size={20} />,
      title: 'Your Time Here',
      body: 'The minutes this app has actually taken out of today.',
      value: `${minutes} Min`,
    },
    {
      key: 'about',
      icon: <HelpGlyph size={20} />,
      title: 'Additional Resources',
      body: 'The accounts here are SLATE’s own. Nobody real is named, and nothing you write leaves the game.',
    },
  ].filter((row) => {
    const needle = query.trim().toLowerCase();
    return needle.length < 2 || `${row.title} ${row.body}`.toLowerCase().includes(needle);
  });

  return (
    <>
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
        <span style={{ textAlign: 'center' }}>
          <b style={{ fontSize: 15, display: 'block' }}>Settings</b>
          <small style={{ color: 'var(--ph-muted)', fontSize: 11.5 }}>@{mine?.handle ?? 'yourname'}</small>
        </span>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-body">
        <div style={{ padding: 10 }}>
          <input className="ph-input" style={{ borderRadius: 999 }} value={query} placeholder="Search settings" onChange={(e) => setQuery(e.target.value)} />
        </div>
        {rows.length === 0 && <p className="ph-empty">Nothing matching that.</p>}
        {rows.map((row) => (
          <SetRow key={row.key} icon={row.icon} title={row.title} body={row.body} value={row.value} onClick={row.onClick} />
        ))}
        <p className="ph-card-meta" style={{ padding: 12 }}>
          {minutes} minutes today is {Math.round((minutes / (24 * 60)) * 100)} percent of a day.
        </p>
      </div>
    </>
  );
}
