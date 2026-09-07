/**
 * SLATE — Instagram, on the phone.
 *
 * Laid out the way the app is actually laid out, page by page. A plus on the
 * top left, the wordmark in the middle with the chevron that switches For You
 * and Following, and the heart on the right. A tray of stories under it, the
 * first of them yours with a plus on the ring. A feed of square pictures whose
 * header stacks the handle over the place, with the count pill on a carousel
 * and the dots under it, and a heart, a bubble, a plane and a bookmark below.
 * Along the bottom, the floating bar: Home, Reels, Messages, Search, Profile.
 *
 * Reels is full bleed with the rail of counts down the right and the account,
 * the Follow button and the caption along the bottom. Search is the chips and
 * the grid of tiles with a view count on each. Messages is the inbox, with
 * your note above it and the requests kept apart from the rest. Your own
 * profile is the stats row, Edit and Share, the four tabs, and the cards that
 * tell you what is still missing from it.
 *
 * Nothing here is decoration. A double tap runs `feed.like` and the count
 * moves. Following somebody changes what is on the feed tomorrow. Posting takes
 * the time out of the day it would take to make the thing, the photograph you
 * bring is framed and re-encoded to fit a save, messaging somebody takes the
 * couple of minutes it takes and they answer later or not at all, and once
 * enough people follow you the money turns on: subscriptions, gifts and the
 * brands, paid on the month, which is how the app actually pays.
 *
 * The mark is drawn in CSS. SLATE ships no third party artwork.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';
import { plural } from '@/engine/core/text';
import type { SocialItem, SocialProfile } from '@/engine/domain/model';
import {
  GIFT_STEPS, PHOTO_PLATFORM, PHOTO_SUB_MONTHLY, PHOTO_VERIFIED_MONTHLY, catalogOf, exploreFeed,
  followingFeed, homeFeed, isBlocked, isFollowing, isMuted, itemById, messagesWith, myProfile,
  noteOf, photoSubscribers, profileById, repliesTo, screenTime, screenTimeWeek, searchSocial,
  settingsOf, socialAnalytics, storiesFor, threadsOf,
} from '@/engine/systems/socialapps';
import { SOCIAL_TOPICS, SOCIAL_TOPIC_LABEL, type SocialTopic } from '@/engine/content/socialworld';
import {
  AccountGlyph, BackGlyph, BellGlyph, BlockGlyph, BookmarkGlyph, BubbleGlyph, CameraGlyph, ClockGlyph, ComposeGlyph,
  DownGlyph, EyeGlyph, GearGlyph, GridGlyph, HeartGlyph, HomeGlyph, LockGlyph, MenuGlyph,
  PlusGlyph, ReelsGlyph, RepostGlyph, SearchGlyph, SendGlyph, SlidersGlyph, TaggedGlyph, TickGlyph,
} from './Icons';
import { Avatar, ago, views } from './YouTubeExtras';
import { ImagePicker } from './ImagePicker';
import { EmojiRow } from './EmojiRow';
import type { PhoneTheme } from './Phone';
import './social.css';

type Tab = 'home' | 'reels' | 'messages' | 'search' | 'profile';
type Screen = 'app' | 'create' | 'dashboard' | 'thread' | 'settings' | 'switcher';

const KIND_LABEL: Readonly<Record<string, string>> = {
  photo: 'Photo', carousel: 'Carousel', reel: 'Reel', story: 'Story',
};

/**
 * What a post looks like before anybody has brought a photograph to it.
 *
 * SLATE ships no photographs, so a picture nobody uploaded is drawn instead of
 * faked. Its two colors come from the post's own id, so every card on the feed
 * is a different picture and the same card is the same picture every time.
 */
function look(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 33 + id.charCodeAt(i)) % 100_000;
  const one = hash % 360;
  const two = (one + 40 + (hash % 90)) % 360;
  return `linear-gradient(${140 + (hash % 60)}deg, hsl(${one} 44% 74%), hsl(${two} 38% 48%))`;
}

/** How many pictures are in a carousel, which the pill and the dots both need. */
function frames(item: SocialItem): number {
  if (item.kind !== 'carousel') return 1;
  return Math.max(2, Math.min(10, item.images?.length ?? 2 + (item.id.length % 4)));
}

export function InstagramApp({ theme }: { theme: PhoneTheme }) {
  void theme;
  const [tab, setTab] = useState<Tab>('home');
  const [screen, setScreen] = useState<Screen>('app');
  const [lane, setLane] = useState<'foryou' | 'following'>('foryou');
  const [openId, setOpenId] = useState<string | null>(null);
  const [whoId, setWhoId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [storyAt, setStoryAt] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const now = useWorld((s) => s.now);
  const mine = useWorld((s) => myProfile(s, PHOTO_PLATFORM));
  const open = useWorld((s) => (openId ? itemById(s, openId) : undefined));
  const who = useWorld((s) => (whoId ? profileById(s, whoId) : undefined));
  const stories = useWorld((s) => storiesFor(s, s.player.id));
  const unread = useWorld((s) => threadsOf(s).reduce((sum, t) => sum + t.unread, 0));

  const say = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((current) => (current === text ? null : current)), 4200);
  };

  const openWho = (id: string) => { setOpenId(null); setWhoId(id); };
  const message = (id: string) => { setWhoId(null); setThreadId(id); setScreen('thread'); setTab('messages'); };

  return (
    <div className="ph-app-screen">
      {storyAt !== null && stories[storyAt] && (
        <StoryViewer stories={stories} at={storyAt} onMove={setStoryAt} onClose={() => setStoryAt(null)} say={say} />
      )}

      {screen === 'create' ? (
        <CreateSheet onClose={() => setScreen('app')} say={say} hasProfile={Boolean(mine)} />
      ) : screen === 'thread' && threadId ? (
        <ThreadPage
          profileId={threadId}
          now={now}
          onBack={() => { setThreadId(null); setScreen('app'); }}
          say={say}
        />
      ) : who ? (
        <ProfilePage
          profile={who}
          now={now}
          onBack={() => setWhoId(null)}
          onOpen={setOpenId}
          onMessage={message}
          say={say}
        />
      ) : open ? (
        <PostPage item={open} now={now} onBack={() => setOpenId(null)} onWho={openWho} say={say} />
      ) : screen === 'dashboard' ? (
        <DashboardPage onBack={() => setScreen('app')} />
      ) : screen === 'settings' ? (
        <SettingsPage
          onBack={() => setScreen('app')}
          onOpen={setOpenId}
          onWho={setWhoId}
          onSwitcher={() => setScreen('switcher')}
          onDashboard={() => setScreen('dashboard')}
          say={say}
        />
      ) : screen === 'switcher' ? (
        <AccountSwitcher onClose={() => setScreen('app')} say={say} />
      ) : (
        <>
          {tab === 'home' && (
            <>
              <div className="ph-ig-top">
                <button type="button" className="ph-iconbtn" aria-label="New Post" onClick={() => setScreen('create')}>
                  <PlusGlyph size={24} />
                </button>
                <span className="ph-mid">
                  <button
                    type="button"
                    className="ph-ig-title"
                    onClick={() => setLane((l) => (l === 'foryou' ? 'following' : 'foryou'))}
                    aria-label={lane === 'foryou' ? 'Switch To Following' : 'Switch To For You'}
                  >
                    <span className="ph-so-word ph-ig">Instagram</span>
                    <DownGlyph size={14} />
                  </button>
                </span>
                <span className="ph-right">
                  <span className="ph-so-badge-wrap">
                    <button type="button" className="ph-iconbtn" aria-label="Likes" onClick={() => say('Nobody new has liked anything since you last looked.')}>
                      <HeartGlyph size={23} />
                    </button>
                    <span className="ph-dot" aria-hidden="true" />
                  </span>
                </span>
              </div>
              {lane === 'following' && (
                <p className="ph-card-meta" style={{ padding: '4px 14px 0' }}>Following, in the order they posted.</p>
              )}
              <StoryTray stories={stories} mine={mine} onOpen={setStoryAt} onAdd={() => setScreen('create')} />
              <div className="ph-body">
                <HomeLane lane={lane} now={now} onOpen={setOpenId} onWho={setWhoId} say={say} />
              </div>
            </>
          )}

          {tab === 'reels' && <ReelsPage now={now} onWho={setWhoId} onCreate={() => setScreen('create')} say={say} />}

          {tab === 'messages' && (
            <MessagesPage now={now} mine={mine} onOpen={message} say={say} />
          )}

          {tab === 'search' && (
            <SearchPage onOpen={setOpenId} onWho={setWhoId} />
          )}

          {tab === 'profile' && (
            mine
              ? (
                <ProfilePage
                  profile={mine}
                  now={now}
                  onOpen={setOpenId}
                  onSettings={() => setScreen('settings')}
                  onDashboard={() => setScreen('dashboard')}
                  onMessage={message}
                  onCreate={() => setScreen('create')}
                  say={say}
                />
              )
              : <MakeAccount say={say} />
          )}

          <div className="ph-ig-bar">
            <button type="button" className={tab === 'home' ? 'ph-on' : ''} onClick={() => setTab('home')} aria-label="Home">
              <HomeGlyph filled={tab === 'home'} size={23} />
            </button>
            <button type="button" className={tab === 'reels' ? 'ph-on' : ''} onClick={() => setTab('reels')} aria-label="Reels">
              <ReelsGlyph filled={tab === 'reels'} size={23} />
            </button>
            <button type="button" className={tab === 'messages' ? 'ph-on' : ''} onClick={() => setTab('messages')} aria-label="Messages">
              <span className="ph-wrap">
                <SendGlyph size={22} />
                {unread > 0 && <span className="ph-badge" aria-hidden="true" />}
              </span>
            </button>
            <button type="button" className={tab === 'search' ? 'ph-on' : ''} onClick={() => setTab('search')} aria-label="Search">
              <SearchGlyph size={23} />
            </button>
            <button type="button" className={tab === 'profile' ? 'ph-on' : ''} onClick={() => setTab('profile')} aria-label="Profile">
              <Avatar name={mine?.name ?? 'You'} size={23} image={mine?.avatarImage} />
            </button>
          </div>
        </>
      )}

      {toast && <div className="ph-toast">{toast}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The feed
// ---------------------------------------------------------------------------

function HomeLane({
  lane, now, onOpen, onWho, say,
}: {
  lane: 'foryou' | 'following'; now: number;
  onOpen: (id: string) => void; onWho: (id: string) => void; say: (text: string) => void;
}) {
  const items = useWorld((s) => (lane === 'following'
    ? followingFeed(s, PHOTO_PLATFORM, 20)
    : homeFeed(s, PHOTO_PLATFORM, 20)));
  if (items.length === 0) {
    return (
      <p className="ph-empty">
        <b>Nothing Here Yet</b>
        Follow a few accounts and the feed fills up.
      </p>
    );
  }
  return (
    <>
      {items.map((item) => (
        <PostCard key={item.id} item={item} now={now} onOpen={onOpen} onWho={onWho} say={say} />
      ))}
    </>
  );
}

function PostCard({
  item, now, onOpen, onWho, say,
}: {
  item: SocialItem; now: number;
  onOpen: (id: string) => void; onWho: (id: string) => void; say: (text: string) => void;
}) {
  const { run } = useGame();
  const profile = useWorld((s) => profileById(s, item.profileId));
  const [expanded, setExpanded] = useState(false);
  const [frame, setFrame] = useState(0);
  const [menu, setMenu] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const [where, setWhere] = useState(item.place ?? '');
  if (!profile) return null;

  const count = frames(item);
  const like = () => {
    const result = run<{ liked: boolean }>('feed.like', { itemId: item.id }, { silent: true });
    if (!result.ok) say(result.error ?? 'That did not work.');
  };
  const save = () => {
    const result = run<{ saved: boolean }>('feed.bookmark', { itemId: item.id }, { silent: true });
    if (result.ok) say(result.value!.saved ? 'Saved.' : 'Taken out of your saved posts.');
  };

  const long = item.text.length > 110;
  const caption = expanded || !long ? item.text : `${item.text.slice(0, 110).trimEnd()}…`;

  return (
    <article className="ph-post">
      <div className="ph-post-head">
        <button type="button" className="ph-iconbtn" onClick={() => onWho(profile.id)} aria-label={profile.name}>
          <Avatar name={profile.name} size={34} image={profile.avatarImage} />
        </button>
        <span className="ph-post-who">
          <b>
            {profile.handle}
            {profile.verified && <span className="ph-tick" aria-label="Verified"><TickGlyph /></span>}
          </b>
          <span>{item.place ?? ago(now, item.at)}</span>
        </span>
        <button
          type="button"
          className="ph-iconbtn"
          aria-label="More"
          onClick={() => (item.byPlayer
            ? setMenu((v) => !v)
            : say(`${SOCIAL_TOPIC_LABEL[item.topic as SocialTopic]}. Nothing more to do with somebody else's post here.`))}
        >
          <MenuGlyph size={18} />
        </button>
      </div>

      {menu && item.byPlayer && (
        <div className="ph-panel">
          <div className="ph-label">Caption</div>
          <EmojiRow app="photo" onPick={(emoji) => setDraft((current) => current + emoji)} />
          <input className="ph-input" value={draft} maxLength={2200} onChange={(e) => setDraft(e.target.value)} />
          <div className="ph-label">Place</div>
          <input className="ph-input" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Optional" />
          <div className="ph-actions">
            <button
              type="button"
              className="ph-btn-solid"
              onClick={() => {
                const result = run('feed.edit', { itemId: item.id, text: draft, place: where }, { silent: true });
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

      <button
        type="button"
        className={`ph-post-frame${item.kind === 'reel' ? ' ph-tall' : ''}`}
        onDoubleClick={like}
        onClick={() => (count > 1 ? setFrame((f) => (f + 1) % count) : onOpen(item.id))}
        aria-label={count > 1 ? 'Next Picture' : `Open This ${KIND_LABEL[item.kind] ?? 'Post'}`}
        style={item.images?.[frame] ? undefined : { background: look(`${item.id}:${frame}`) }}
      >
        {item.images?.[frame] && <img src={item.images[frame]} alt="" />}
        {count > 1 && <span className="ph-count-pill">{frame + 1}/{count}</span>}
        {item.kind === 'reel' && <span className="ph-post-kind">Reel</span>}
      </button>

      {count > 1 && (
        <div className="ph-dots" aria-hidden="true">
          {Array.from({ length: count }, (_, i) => <i key={i} className={i === frame ? 'ph-on' : ''} />)}
        </div>
      )}

      <div className="ph-post-actions">
        <button type="button" className={`ph-iconbtn${item.liked ? ' ph-liked' : ''}`} onClick={like} aria-label={item.liked ? 'Unlike' : 'Like'}>
          <HeartGlyph size={23} filled={item.liked} />
        </button>
        <button type="button" className="ph-iconbtn" onClick={() => onOpen(item.id)} aria-label="Comment">
          <BubbleGlyph size={22} />
        </button>
        <button type="button" className="ph-iconbtn" onClick={() => onWho(profile.id)} aria-label="Send">
          <SendGlyph size={21} />
        </button>
        <button type="button" className={`ph-iconbtn ph-right${item.saved ? ' ph-liked' : ''}`} onClick={save} aria-label={item.saved ? 'Remove From Saved' : 'Save'}>
          <BookmarkGlyph size={21} filled={item.saved} />
        </button>
      </div>

      <div className="ph-post-likes">{views(item.likes)} likes</div>
      <div className="ph-post-caption">
        <b>{profile.handle}</b>
        {caption}
      </div>
      {long && !expanded && (
        <button type="button" className="ph-post-more" onClick={() => setExpanded(true)}>more</button>
      )}
      {item.comments > 0 && (
        <button type="button" className="ph-post-more" onClick={() => onOpen(item.id)}>
          View all {views(item.comments)} comments
        </button>
      )}
      <div className="ph-post-when">{ago(now, item.at)}</div>
    </article>
  );
}

function Tiles({ items, onOpen }: { items: SocialItem[]; onOpen: (id: string) => void }) {
  return (
    <div className="ph-tiles">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="ph-tile"
          onClick={() => onOpen(item.id)}
          aria-label={item.text.slice(0, 40)}
          style={item.images?.[0] ? undefined : { background: look(item.id) }}
        >
          {item.images?.[0] && <img src={item.images[0]} alt="" />}
          {item.kind !== 'photo' && <i>{KIND_LABEL[item.kind]}</i>}
          <span className="ph-views"><EyeGlyph size={11} />{views(item.likes * 9)}</span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

function StoryTray({
  stories, mine, onOpen, onAdd,
}: {
  stories: SocialItem[]; mine: SocialProfile | undefined;
  onOpen: (index: number) => void; onAdd: () => void;
}) {
  const profiles = useWorld((s) => s.universe.socialProfiles);
  const note = useWorld((s) => (mine ? noteOf(s, mine) : undefined));
  // Your own story is the first ring rather than a second one further along.
  const yours = mine ? stories.some((s) => s.profileId === mine.id) : false;
  return (
    <div className="ph-stories">
      <button type="button" className="ph-story" onClick={onAdd} aria-label="Your Story">
        {note && <span className="ph-note">{note}</span>}
        <span className={`ph-story-ring${yours ? '' : ' ph-seen'}`}>
          <span><Avatar name={mine?.name ?? 'You'} size={52} image={mine?.avatarImage} /></span>
        </span>
        <span className="ph-story-add" aria-hidden="true"><PlusGlyph size={13} /></span>
        <span className="ph-story-name">Your Story</span>
      </button>
      {stories.map((story, index) => {
        if (mine && story.profileId === mine.id) return null;
        const profile = profiles[story.profileId];
        return (
          <button key={story.id} type="button" className="ph-story" onClick={() => onOpen(index)}>
            <span className={`ph-story-ring${story.seen ? ' ph-seen' : ''}`}>
              <span><Avatar name={profile?.name ?? '?'} size={52} image={profile?.avatarImage} /></span>
            </span>
            <span className="ph-story-name">{profile?.handle ?? ''}</span>
          </button>
        );
      })}
    </div>
  );
}

function StoryViewer({
  stories, at, onMove, onClose, say,
}: {
  stories: SocialItem[]; at: number;
  onMove: (index: number) => void; onClose: () => void; say: (text: string) => void;
}) {
  const { run } = useGame();
  const story = stories[at]!;
  const profile = useWorld((s) => profileById(s, story.profileId));
  const now = useWorld((s) => s.now);
  const [read, setRead] = useState<string | null>(null);

  if (read !== story.id) {
    setRead(story.id);
    const result = run('feed.view_story', { itemId: story.id }, { silent: true });
    if (!result.ok) say(result.error ?? 'That story has gone.');
  }

  const step = (by: number) => {
    const next = at + by;
    if (next < 0 || next >= stories.length) onClose();
    else onMove(next);
  };

  const left = story.expiresAt ? Math.max(0, Math.round((story.expiresAt - now) / MS_HOUR)) : 0;

  return (
    <div className="ph-story-view">
      <div className="ph-story-progress">
        {stories.map((s, i) => <i key={s.id} className={i <= at ? 'ph-on' : ''} />)}
      </div>
      <div className="ph-post-head" style={{ color: '#fff' }}>
        <Avatar name={profile?.name ?? '?'} size={30} image={profile?.avatarImage} />
        <span className="ph-post-who"><b>{profile?.handle}</b><span style={{ color: 'rgba(255,255,255,0.7)' }}>{ago(now, story.at)}</span></span>
        <button type="button" className="ph-iconbtn" style={{ color: '#fff' }} onClick={onClose} aria-label="Close">
          <BackGlyph size={20} />
        </button>
      </div>
      <button
        type="button"
        className="ph-story-body"
        onClick={() => step(1)}
        style={{ border: 0, cursor: 'pointer', position: 'relative', background: story.images?.[0] ? undefined : look(story.id) }}
      >
        {story.images?.[0] ? <img src={story.images[0]} alt="" /> : <span>{story.text}</span>}
      </button>
      <div style={{ display: 'flex', gap: 10, padding: '10px 14px 18px' }}>
        <button type="button" className="ph-reel-follow" onClick={() => step(-1)}>Back</button>
        <span style={{ flex: 1, alignSelf: 'center', fontSize: 12, opacity: 0.75 }}>
          {left > 0 ? `${left} hours left` : 'Gone shortly'}
        </span>
        <button type="button" className="ph-reel-follow" onClick={() => step(1)}>Next</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// One post, and what was said under it
// ---------------------------------------------------------------------------

function PostPage({
  item, now, onBack, onWho, say,
}: {
  item: SocialItem; now: number; onBack: () => void;
  onWho: (id: string) => void; say: (text: string) => void;
}) {
  const { run } = useGame();
  const profile = useWorld((s) => profileById(s, item.profileId));
  const replies = useWorld((s) => repliesTo(s, item.id));
  const profiles = useWorld((s) => s.universe.socialProfiles);
  const [text, setText] = useState('');

  const send = () => {
    const result = run('feed.reply', { itemId: item.id, text }, { silent: true });
    if (result.ok) { setText(''); say('Posted.'); } else say(result.error ?? 'That did not work.');
  };

  return (
    <>
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
        <b style={{ fontSize: 15 }}>Post</b>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-body">
        <PostCard item={item} now={now} onOpen={() => undefined} onWho={onWho} say={say} />
        <div className="ph-section-head">Comments</div>
        {replies.length === 0 && <p className="ph-empty">Nobody has said anything yet.</p>}
        {replies.map((reply) => {
          const author = profiles[reply.profileId];
          return (
            <div key={reply.id} className="ph-comment">
              <Avatar name={author?.name ?? '?'} size={30} image={author?.avatarImage} />
              <div>
                <b>{author?.handle ?? 'someone'}</b>
                <p>{reply.text}</p>
                <small>{ago(now, reply.at)}{reply.likes > 0 ? ` · ${views(reply.likes)} likes` : ''}</small>
              </div>
            </div>
          );
        })}
        <EmojiRow app="photo" onPick={(emoji) => setText((current) => current + emoji)} />
        <div style={{ padding: 12, display: 'flex', gap: 8 }}>
          <input
            className="ph-input"
            value={text}
            placeholder={`Add a comment for ${profile?.handle ?? 'them'}`}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="button" className="ph-btn-solid" disabled={text.trim().length === 0} onClick={send}>Post</button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Reels
// ---------------------------------------------------------------------------

function ReelsPage({
  now, onWho, onCreate, say,
}: { now: number; onWho: (id: string) => void; onCreate: () => void; say: (text: string) => void }) {
  const { run } = useGame();
  const [lane, setLane] = useState<'reels' | 'friends'>('reels');
  const following = useWorld((s) => followingFeed(s, PHOTO_PLATFORM, 40).filter((i) => i.kind === 'reel'));
  const everything = useWorld((s) => [...homeFeed(s, PHOTO_PLATFORM, 40), ...exploreFeed(s, PHOTO_PLATFORM, 40)]
    .filter((i) => i.kind === 'reel'));
  const reels = lane === 'friends' ? following : everything;
  const [at, setAt] = useState(0);
  const reel = reels[Math.min(at, Math.max(0, reels.length - 1))];
  const profile = useWorld((s) => (reel ? profileById(s, reel.profileId) : undefined));
  const followed = useWorld((s) => (profile ? isFollowing(s, s.player.id, profile.id) : false));

  const next = () => {
    const result = run<{ note: string }>('feed.scroll', { platform: PHOTO_PLATFORM, minutes: 12 }, { silent: true });
    if (result.ok) say(`Twelve minutes of reels. ${result.value!.note}`);
    setAt((n) => (reels.length > 0 ? (n + 1) % reels.length : 0));
  };

  const act = (kind: string, message?: string) => {
    if (!reel) return;
    const result = run(kind, { itemId: reel.id }, { silent: true });
    if (!result.ok) say(result.error ?? 'That did not work.');
    else if (message) say(message);
  };

  return (
    <div className="ph-reel-stage">
      <div className="ph-reel-tabs">
        <button type="button" className="ph-iconbtn" style={{ position: 'absolute', left: 12, color: '#fff' }} aria-label="New Post" onClick={onCreate}>
          <PlusGlyph size={22} />
        </button>
        <button type="button" className={lane === 'reels' ? 'ph-on' : ''} onClick={() => setLane('reels')}>Reels</button>
        <button type="button" className={lane === 'friends' ? 'ph-on' : ''} onClick={() => setLane('friends')}>Friends</button>
      </div>

      {!reel || !profile ? (
        <p className="ph-empty" style={{ margin: 'auto' }}>
          <b>No Reels</b>
          {lane === 'friends' ? 'Follow a few accounts that make them.' : 'Nothing to play here.'}
        </p>
      ) : (
        <>
          <button
            type="button"
            className="ph-post-frame"
            onClick={next}
            style={{ border: 0, cursor: 'pointer', background: reel.images?.[0] ? undefined : look(reel.id) }}
            aria-label="Next Reel"
          >
            {reel.images?.[0] && <img src={reel.images[0]} alt="" />}
          </button>

          <div className="ph-reel-rail">
            <button type="button" onClick={() => act('feed.like')} aria-label={reel.liked ? 'Unlike' : 'Like'}>
              <HeartGlyph size={26} filled={reel.liked} />
              {views(reel.likes)}
            </button>
            <button type="button" onClick={() => say(`${views(reel.comments)} comments. Open it from the feed to read them.`)} aria-label="Comments">
              <BubbleGlyph size={25} />
              {reel.comments.toLocaleString('en-US')}
            </button>
            <button type="button" onClick={() => say('Reels are not reposted on this app.')} aria-label="Share">
              <RepostGlyph size={25} />
              {views(Math.round(reel.likes * 0.09))}
            </button>
            <button type="button" onClick={() => onWho(profile.id)} aria-label="Send">
              <SendGlyph size={24} />
              {views(Math.round(reel.likes * 0.5))}
            </button>
            <button type="button" onClick={() => act('feed.bookmark', reel.saved ? 'Bookmark removed.' : 'Saved.')} aria-label={reel.saved ? 'Remove From Saved' : 'Save'}>
              <BookmarkGlyph size={23} filled={reel.saved} />
            </button>
          </div>

          <div className="ph-reel-foot">
            <span className="ph-reel-who">
              <Avatar name={profile.name} size={28} image={profile.avatarImage} />
              <b>{profile.handle}</b>
              {!followed && (
                <button
                  type="button"
                  className="ph-reel-follow"
                  onClick={() => {
                    const result = run('feed.follow', { profileId: profile.id }, { silent: true });
                    say(result.ok ? `Following ${profile.handle}.` : result.error ?? 'That did not work.');
                  }}
                >
                  Follow
                </button>
              )}
            </span>
            <p>{reel.text.split('\n')[0]}</p>
            <p style={{ opacity: 0.75, fontSize: 11 }}>{ago(now, reel.at)} · Reel {Math.min(at, reels.length - 1) + 1} of {reels.length}</p>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// A profile
// ---------------------------------------------------------------------------

function ProfilePage({
  profile, now, onBack, onOpen, onDashboard, onSettings, onMessage, onCreate, say,
}: {
  profile: SocialProfile; now: number; onBack?: () => void;
  onOpen: (id: string) => void; onDashboard?: () => void; onSettings?: () => void;
  onMessage: (id: string) => void; onCreate?: () => void; say: (text: string) => void;
}) {
  const { run } = useGame();
  const items = useWorld((s) => catalogOf(s, profile));
  const following = useWorld((s) => isFollowing(s, s.player.id, profile.id));
  const close = useWorld((s) => Object.values(s.universe.socialFollows)
    .find((f) => f.personId === s.player.id && f.profileId === profile.id)?.close === true);
  const stats = useWorld((s) => socialAnalytics(s, profile.id));
  const own = useWorld((s) => profile.ownerId === s.player.id);
  const note = useWorld((s) => noteOf(s, profile));
  const muted = useWorld((s) => isMuted(s, profile.id));
  const blocked = useWorld((s) => isBlocked(s, profile.id));
  const [editing, setEditing] = useState(false);
  const [shelf, setShelf] = useState<'grid' | 'reels' | 'reposts' | 'tagged'>('grid');
  void now;

  const follow = () => {
    const result = run(following ? 'feed.unfollow' : 'feed.follow', { profileId: profile.id }, { silent: true });
    if (result.ok) say(following ? `You no longer follow ${profile.handle}.` : `Following ${profile.handle}.`);
    else say(result.error ?? 'That did not work.');
  };

  const shown = shelf === 'reels' ? items.filter((i) => i.kind === 'reel') : shelf === 'grid' ? items : [];
  const missing = own
    ? [
      !profile.avatarImage && { key: 'photo', title: 'Add A Profile Photo', body: 'Choose a photo to represent yourself.', action: 'Add Photo' },
      !profile.bio && { key: 'bio', title: 'Write Your Bio', body: 'Say what the account is for.', action: 'Add Bio' },
    ].filter(Boolean) as { key: string; title: string; body: string; action: string }[]
    : [];

  return (
    <>
      <div className="ph-ig-top">
        {onBack
          ? <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
          : <button type="button" className="ph-iconbtn" aria-label="New Post" onClick={() => onCreate?.()}><PlusGlyph size={24} /></button>}
        <span className="ph-mid">
          {own && <LockGlyph size={13} />}
          <b style={{ fontSize: 15 }}>{profile.handle}</b>
          <DownGlyph size={13} />
        </span>
        <span className="ph-right">
          <button
            type="button"
            className="ph-iconbtn"
            aria-label={own ? 'Settings And Activity' : 'More'}
            onClick={() => (own && onSettings ? onSettings() : say('Nothing more in here.'))}
          >
            <MenuGlyph size={20} />
          </button>
        </span>
      </div>

      <div className="ph-body">
        <div className="ph-prof-head">
          <span style={{ position: 'relative' }}>
            {note && <span className="ph-note" style={{ top: -18 }}>{note}</span>}
            <Avatar name={profile.name} size={78} image={profile.avatarImage} />
            {own && <span className="ph-story-add" style={{ right: -2, bottom: -2 }} aria-hidden="true"><CameraGlyph size={12} /></span>}
          </span>
          <div className="ph-prof-stats">
            <div><b>{views(profile.posts)}</b><span>posts</span></div>
            <div><b>{views(profile.followers)}</b><span>followers</span></div>
            <div><b>{views(profile.following)}</b><span>following</span></div>
          </div>
        </div>
        <div className="ph-prof-bio">
          <b>
            {profile.name}
            {profile.verified && <span className="ph-tick" style={{ marginLeft: 5 }} aria-label="Verified"><TickGlyph /></span>}
          </b>
          <p>{profile.bio || 'No bio yet.'}</p>
        </div>

        <div className="ph-prof-buttons">
          {own ? (
            <>
              <button type="button" onClick={() => setEditing((v) => !v)}>Edit Profile</button>
              <button type="button" onClick={() => say(`Your profile is at @${profile.handle}.`)}>Share Profile</button>
              {onDashboard && <button type="button" onClick={onDashboard} aria-label="Professional Dashboard">Dashboard</button>}
            </>
          ) : (
            <>
              <button type="button" className={following ? '' : 'ph-primary'} onClick={follow}>
                {following ? 'Following' : 'Follow'}
              </button>
              <button type="button" onClick={() => onMessage(profile.id)}>Message</button>
              {following && (
                <button
                  type="button"
                  aria-label={close ? 'Close Friend' : 'Add To Close Friends'}
                  onClick={() => {
                    const result = run('feed.close_friend', { profileId: profile.id, close: !close }, { silent: true });
                    if (result.ok) say(close ? 'Taken off your close friends.' : 'Added to your close friends.');
                  }}
                >
                  {close ? 'Close Friend' : 'Close Friends'}
                </button>
              )}
              <button type="button" onClick={() => {
                const result = run('feed.gift', { profileId: profile.id, amount: GIFT_STEPS[1] }, { silent: true });
                say(result.ok ? `Sent ${formatMoney(GIFT_STEPS[1]!)}.` : result.error ?? 'That did not work.');
              }}
              >
                Send {formatMoney(GIFT_STEPS[1]!)}
              </button>
              <button
                type="button"
                aria-label={muted ? 'Unmute' : 'Mute'}
                onClick={() => {
                  const result = run('feed.mute', { profileId: profile.id }, { silent: true });
                  if (result.ok) say(muted ? `${profile.handle} is back on your feed.` : `${profile.handle} is off your feed.`);
                }}
              >
                {muted ? 'Unmute' : 'Mute'}
              </button>
              <button
                type="button"
                aria-label={blocked ? 'Unblock' : 'Block'}
                onClick={() => {
                  const result = run('feed.block', { profileId: profile.id }, { silent: true });
                  if (result.ok) say(blocked ? `${profile.handle} is unblocked.` : `${profile.handle} is blocked, and you no longer follow them.`);
                  else say(result.error ?? 'That did not work.');
                }}
              >
                {blocked ? 'Unblock' : 'Block'}
              </button>
            </>
          )}
        </div>

        {editing && own && <EditProfile profile={profile} onDone={() => setEditing(false)} say={say} />}

        <div className="ph-prof-tabs">
          <button type="button" className={shelf === 'grid' ? 'ph-on' : ''} onClick={() => setShelf('grid')} aria-label="Posts">
            <GridGlyph size={20} filled={shelf === 'grid'} />
          </button>
          <button type="button" className={shelf === 'reels' ? 'ph-on' : ''} onClick={() => setShelf('reels')} aria-label="Reels">
            <ReelsGlyph size={20} filled={shelf === 'reels'} />
          </button>
          <button type="button" className={shelf === 'reposts' ? 'ph-on' : ''} onClick={() => setShelf('reposts')} aria-label="Reposts">
            <RepostGlyph size={20} />
          </button>
          <button type="button" className={shelf === 'tagged' ? 'ph-on' : ''} onClick={() => setShelf('tagged')} aria-label="Tagged">
            <TaggedGlyph size={20} filled={shelf === 'tagged'} />
          </button>
        </div>

        {own && missing.length > 0 && shelf === 'grid' && (
          <div className="ph-todo">
            <h4>Complete Your Profile</h4>
            <small>{2 - missing.length} of 2 complete</small>
            <div className="ph-todo-cards">
              {missing.map((task) => (
                <div key={task.key} className="ph-todo-card">
                  <b>{task.title}</b>
                  <span>{task.body}</span>
                  <button type="button" onClick={() => setEditing(true)}>{task.action}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {shelf === 'reposts' && <p className="ph-empty">This app does not repost.</p>}
        {shelf === 'tagged' && <p className="ph-empty">Nobody has tagged this account.</p>}
        {(shelf === 'grid' || shelf === 'reels') && (
          shown.length === 0
            ? <p className="ph-empty">Nothing posted yet.</p>
            : <Tiles items={shown} onOpen={onOpen} />
        )}

        {own && (
          <p className="ph-card-meta" style={{ padding: 12 }}>
            {views(stats.likes)} likes and {views(stats.comments)} comments across everything you have put up.
          </p>
        )}
      </div>
    </>
  );
}

function EditProfile({
  profile, onDone, say,
}: { profile: SocialProfile; onDone: () => void; say: (text: string) => void }) {
  const { run } = useGame();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [note, setNote] = useState(profile.note ?? '');
  const [image, setImage] = useState<string | undefined>(profile.avatarImage);

  const save = () => {
    const result = run('feed.edit_profile', { profileId: profile.id, name, bio, image }, { silent: true });
    if (!result.ok) { say(result.error ?? 'That did not work.'); return; }
    run('feed.set_note', { text: note }, { silent: true });
    say('Profile saved.');
    onDone();
  };

  return (
    <div className="ph-panel">
      <div className="ph-label">Picture</div>
      <ImagePicker frame="avatar" image={image} label="Your Profile Picture" onChange={setImage} />
      <div className="ph-label">Name</div>
      <input className="ph-input" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="ph-label">Bio</div>
      <input className="ph-input" value={bio} maxLength={160} onChange={(e) => setBio(e.target.value)} />
      <div className="ph-label">Note</div>
      <input className="ph-input" value={note} maxLength={60} placeholder="Up for a day" onChange={(e) => setNote(e.target.value)} />
      <div className="ph-actions">
        <button type="button" className="ph-btn-solid" onClick={save}>Save</button>
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
          A photo account of your own, in the same world as everybody else&rsquo;s. Once enough
          people follow you the app starts paying: subscriptions, gifts and the brands.
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
              const result = run<{ profileId: string }>('feed.create_profile', { platform: PHOTO_PLATFORM, handle, name, bio }, { silent: true });
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
// Posting
// ---------------------------------------------------------------------------

function CreateSheet({
  onClose, say, hasProfile,
}: { onClose: () => void; say: (text: string) => void; hasProfile: boolean }) {
  const { run } = useGame();
  const now = useWorld((s) => s.now);
  const [kind, setKind] = useState<'photo' | 'carousel' | 'reel' | 'story'>('photo');
  const [text, setText] = useState('');
  const [place, setPlace] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [later, setLater] = useState(false);
  const [days, setDays] = useState(1);

  const post = () => {
    if (kind === 'story') {
      const result = run('feed.story', { text, images: image ? [image] : [] }, { silent: true });
      say(result.ok ? 'Story up. It is gone in a day.' : result.error ?? 'That did not work.');
      if (result.ok) onClose();
      return;
    }
    const result = run<{ scheduled: boolean }>('feed.post', {
      platform: PHOTO_PLATFORM,
      kind,
      text,
      place: place || undefined,
      images: image ? [image] : [],
      publishAt: later ? now + days * MS_DAY : undefined,
    }, { silent: true });
    if (result.ok) {
      say(result.value!.scheduled ? 'Scheduled. It goes up on its own.' : 'Posted.');
      onClose();
    } else say(result.error ?? 'That did not work.');
  };

  if (!hasProfile) {
    return (
      <div className="ph-sheet">
        <div className="ph-sheet-top">
          <button type="button" className="ph-iconbtn" onClick={onClose} aria-label="Close"><BackGlyph /></button>
          <b>New Post</b>
        </div>
        <div className="ph-body"><MakeAccount say={say} onDone={onClose} /></div>
      </div>
    );
  }

  return (
    <div className="ph-sheet">
      <div className="ph-sheet-top">
        <button type="button" className="ph-iconbtn" onClick={onClose} aria-label="Close"><BackGlyph /></button>
        <b>New Post</b>
        <button type="button" className="ph-btn-solid ph-right" onClick={post}>Share</button>
      </div>
      <div className="ph-body">
        <div className="ph-chips">
          {(['photo', 'carousel', 'reel', 'story'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={`ph-chip${kind === option ? ' ph-on' : ''}`}
              onClick={() => setKind(option)}
            >
              {KIND_LABEL[option]}
            </button>
          ))}
        </div>
        <div className="ph-panel">
          <ImagePicker
            frame={kind === 'reel' || kind === 'story' ? 'short' : 'square'}
            image={image}
            label="Your Picture"
            onChange={setImage}
          />
          <div className="ph-label">{kind === 'story' ? 'Something Over It' : 'Caption'}</div>
          <EmojiRow app="photo" onPick={(emoji) => setText((current) => current + emoji)} />
          <input className="ph-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={2200} />
          {kind !== 'story' && (
            <>
              <div className="ph-label">Place</div>
              <input className="ph-input" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Optional" />
              <label className="ph-card-meta" style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 8 }}>
                <input type="checkbox" checked={later} onChange={(e) => setLater(e.target.checked)} />
                Put it up later
              </label>
              {later && (
                <>
                  <div className="ph-label">In How Many Days</div>
                  <input
                    className="ph-input"
                    type="number"
                    min={1}
                    max={30}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  />
                </>
              )}
            </>
          )}
          <p className="ph-card-meta">
            Making it takes the time it takes: a photograph is under half an hour, a carousel is
            most of one, a reel is an evening.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

function MessagesPage({
  now, mine, onOpen, say,
}: {
  now: number; mine: SocialProfile | undefined;
  onOpen: (profileId: string) => void; say: (text: string) => void;
}) {
  const threads = useWorld((s) => threadsOf(s));
  const note = useWorld((s) => (mine ? noteOf(s, mine) : undefined));
  const [showing, setShowing] = useState<'messages' | 'requests'>('messages');
  const [query, setQuery] = useState('');
  const found = useWorld((s) => searchSocial(s, PHOTO_PLATFORM, query));

  const list = threads.filter((t) => (showing === 'requests' ? t.waiting : !t.waiting));

  return (
    <>
      <div className="ph-ig-top">
        <span />
        <span className="ph-mid"><b style={{ fontSize: 15 }}>{mine?.handle ?? 'Messages'}</b><DownGlyph size={13} /></span>
        <span className="ph-right">
          <button type="button" className="ph-iconbtn" aria-label="New Message" onClick={() => say('Search for somebody below and open their account to write to them.')}>
            <ComposeGlyph size={21} />
          </button>
        </span>
      </div>
      <div className="ph-body">
        <div style={{ padding: 10 }}>
          <input className="ph-input" value={query} placeholder="Search" onChange={(e) => setQuery(e.target.value)} />
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
        ) : (
          <>
            <div style={{ padding: '4px 14px 8px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                {note && <span className="ph-note" style={{ top: -20 }}>{note}</span>}
                <Avatar name={mine?.name ?? 'You'} size={48} image={mine?.avatarImage} />
              </span>
              <span className="ph-card-meta" style={{ alignSelf: 'center' }}>
                {note ? 'Your note, up for a day.' : 'Your note. Set one from Edit Profile.'}
              </span>
            </div>

            <div className="ph-dm-head">
              <b>{showing === 'requests' ? 'Requests' : 'Messages'}</b>
              <span
                role="button"
                tabIndex={0}
                onClick={() => setShowing((v) => (v === 'messages' ? 'requests' : 'messages'))}
                onKeyDown={(e) => { if (e.key === 'Enter') setShowing((v) => (v === 'messages' ? 'requests' : 'messages')); }}
              >
                {showing === 'messages' ? 'Requests' : 'Messages'}
              </span>
            </div>

            {list.length === 0 && (
              <p className="ph-empty">
                <b>Nothing Here</b>
                {showing === 'requests'
                  ? 'Nothing you sent is still waiting on an answer.'
                  : 'Open somebody’s account and write to them.'}
              </p>
            )}
            {list.map((thread) => (
              <button key={thread.profile.id} type="button" className="ph-dm-row" onClick={() => onOpen(thread.profile.id)}>
                <Avatar name={thread.profile.name} size={44} image={thread.profile.avatarImage} />
                <span className="ph-dm-text">
                  <b>{thread.profile.name}</b>
                  <small>
                    {thread.last.byPlayer ? 'Sent · ' : ''}
                    {thread.last.text.slice(0, 40)} · {ago(now, thread.last.at)}
                  </small>
                </span>
                {thread.unread > 0 && <span className="ph-unread" aria-label="Unread" />}
              </button>
            ))}
          </>
        )}
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
          <b style={{ fontSize: 14 }}>{profile?.handle ?? ''}</b>
        </span>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-body">
        {messages.length === 0 && (
          <p className="ph-empty">
            <b>Nothing Yet</b>
            Say something. Whether they answer is up to them.
          </p>
        )}
        <div className="ph-thread">
          {messages.map((item) => (
            <span key={item.id} className={`ph-bubble${item.byPlayer ? ' ph-mine' : ''}`}>
              {item.text}
              <small style={{ display: 'block', opacity: 0.6, fontSize: 10, marginTop: 3 }}>{ago(now, item.at)}</small>
            </span>
          ))}
        </div>
      </div>
      <EmojiRow app="photo" onPick={(emoji) => setText((current) => current + emoji)} />
      <div style={{ padding: 10, display: 'flex', gap: 8, borderTop: '1px solid var(--ph-line)' }}>
        <input className="ph-input" value={text} placeholder="Message" onChange={(e) => setText(e.target.value)} />
        <button type="button" className="ph-btn-solid" disabled={text.trim().length === 0} onClick={send}>Send</button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function SearchPage({ onOpen, onWho }: { onOpen: (id: string) => void; onWho: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<'all' | SocialTopic>('all');
  const found = useWorld((s) => searchSocial(s, PHOTO_PLATFORM, query));
  const suggestions = useWorld((s) => exploreFeed(s, PHOTO_PLATFORM, 36));
  const shown = chip === 'all' ? suggestions : suggestions.filter((i) => i.topic === chip);

  return (
    <>
      <div className="ph-so-top">
        <input
          className="ph-input"
          style={{ flex: 1 }}
          value={query}
          placeholder="Search"
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="ph-iconbtn" style={{ marginLeft: 10 }} aria-label="Filters" onClick={() => setChip('all')}>
          <SlidersGlyph size={20} />
        </button>
      </div>
      <div className="ph-body">
        {query.trim().length < 2 ? (
          <>
            <div className="ph-chips">
              <button type="button" className={`ph-chip${chip === 'all' ? ' ph-on' : ''}`} onClick={() => setChip('all')}>
                For You
              </button>
              {SOCIAL_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className={`ph-chip${chip === topic ? ' ph-on' : ''}`}
                  onClick={() => setChip(topic)}
                >
                  {SOCIAL_TOPIC_LABEL[topic]}
                </button>
              ))}
            </div>
            {shown.length === 0
              ? <p className="ph-empty">Nothing on that yet.</p>
              : <Tiles items={shown} onOpen={onOpen} />}
          </>
        ) : (
          <>
            {found.profiles.map((profile) => (
              <button key={profile.id} type="button" className="ph-channel-row" onClick={() => onWho(profile.id)}>
                <Avatar name={profile.name} size={40} image={profile.avatarImage} />
                <span>
                  <b>{profile.handle}</b>
                  <small>{profile.name} · {views(profile.followers)} followers</small>
                </span>
              </button>
            ))}
            {found.items.length > 0 && <div className="ph-section-head">Posts</div>}
            <Tiles items={found.items} onOpen={onOpen} />
            {found.profiles.length === 0 && found.items.length === 0 && (
              <p className="ph-empty">Nothing for that.</p>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// The money side
// ---------------------------------------------------------------------------

function DashboardPage({ onBack }: { onBack: () => void }) {
  const mine = useWorld((s) => myProfile(s, PHOTO_PLATFORM));
  const stats = useWorld((s) => (mine ? socialAnalytics(s, mine.id) : undefined));
  const subs = useWorld((s) => photoSubscribers(s));
  const payouts = useWorld((s) => Object.values(s.universe.creatorPayouts)
    .filter((p) => p.accountId === mine?.accountId)
    .sort((a, b) => b.month - a.month)
    .slice(0, 6));

  return (
    <>
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
        <b style={{ fontSize: 15 }}>Professional Dashboard</b>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-body">
        {!mine || !stats ? <p className="ph-empty">You have no account here yet.</p> : (
          <>
            <div className="ph-panel">
              <div className="ph-label">Reach</div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{views(stats.impressions)}</p>
              <p className="ph-card-meta">
                {views(stats.likes)} likes, {views(stats.comments)} comments, {views(stats.growth)} new followers
                over the last month.
              </p>
            </div>
            <div className="ph-panel">
              <div className="ph-label">What The App Pays</div>
              <p className="ph-card-meta">
                {stats.monetized
                  ? `${plural(subs, 'person', 'people')} subscribe at ${formatMoney(PHOTO_SUB_MONTHLY)} a month. Gifts on reels are
                     paid with them, and brand work is paid on its own terms.`
                  : 'Nothing yet. A thousand followers turns subscriptions and gifts on.'}
              </p>
            </div>
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
// Settings and activity
// ---------------------------------------------------------------------------

/**
 * The settings page, with the app's own sections in the app's own order.
 *
 * Every row here does something or says plainly that it does not. A muted
 * account really is gone from the feed, a blocked one is gone from search as
 * well, a hidden word really does take a comment out of the room, a private
 * account really does grow more slowly, and Meta Verified really is money
 * taken every month. Nothing on this page is a switch attached to nothing.
 */
type Leaf =
  | 'root' | 'saved' | 'archive' | 'activity' | 'time' | 'notifications' | 'privacy'
  | 'close' | 'blocked' | 'muted' | 'hidden' | 'counts' | 'subscriptions' | 'about';

function Row({
  icon, label, value, onClick,
}: { icon: React.ReactNode; label: string; value?: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className="ph-set-row" onClick={onClick} disabled={!onClick}>
      <span style={{ display: 'inline-flex', width: 22, justifyContent: 'center' }}>{icon}</span>
      {label}
      <span className="ph-set-value">{value}</span>
    </button>
  );
}

function SettingsPage({
  onBack, onOpen, onWho, onSwitcher, onDashboard, say,
}: {
  onBack: () => void;
  onOpen: (id: string) => void;
  onWho: (id: string) => void;
  onSwitcher: () => void;
  onDashboard: () => void;
  say: (text: string) => void;
}) {
  const { run } = useGame();
  const [leaf, setLeaf] = useState<Leaf>('root');
  const settings = useWorld((s) => settingsOf(s));
  const mine = useWorld((s) => myProfile(s, PHOTO_PLATFORM));
  const now = useWorld((s) => s.now);
  const profiles = useWorld((s) => s.universe.socialProfiles);
  const closeFriends = useWorld((s) => Object.values(s.universe.socialFollows)
    .filter((f) => f.personId === s.player.id && f.close));
  const saved = useWorld((s) => Object.values(s.universe.socialItems)
    .filter((i) => i.saved)
    .map((i) => itemById(s, i.id))
    .filter((i): i is SocialItem => Boolean(i) && i!.platform === PHOTO_PLATFORM));
  const archive = useWorld((s) => (mine ? catalogOf(s, mine) : []));
  const liked = useWorld((s) => Object.values(s.universe.socialItems).filter((i) => i.liked).length);
  const commented = useWorld((s) => Object.values(s.universe.socialItems)
    .filter((i) => i.byPlayer && i.kind === 'reply').length);
  const week = useWorld((s) => screenTimeWeek(s, PHOTO_PLATFORM));
  const today = useWorld((s) => screenTime(s, PHOTO_PLATFORM));
  const [words, setWords] = useState(settings.hiddenWords.join(', '));

  const set = (patch: Record<string, unknown>) => {
    const result = run('feed.settings', patch, { silent: true });
    if (!result.ok) say(result.error ?? 'That did not work.');
  };

  const head = (title: string) => (
    <div className="ph-so-top">
      <button type="button" className="ph-iconbtn" onClick={() => (leaf === 'root' ? onBack() : setLeaf('root'))} aria-label="Back">
        <BackGlyph />
      </button>
      <b style={{ fontSize: 15 }}>{title}</b>
      <span style={{ width: 22 }} />
    </div>
  );

  if (leaf === 'saved') {
    return (
      <>
        {head('Saved')}
        <div className="ph-body">
          {saved.length === 0
            ? <p className="ph-empty"><b>Nothing Saved</b>The bookmark under a post keeps it here.</p>
            : <Tiles items={saved} onOpen={onOpen} />}
        </div>
      </>
    );
  }

  if (leaf === 'archive') {
    return (
      <>
        {head('Archive')}
        <div className="ph-body">
          {archive.length === 0
            ? <p className="ph-empty"><b>Nothing Archived</b>Everything you post is kept here as well.</p>
            : <Tiles items={archive} onOpen={onOpen} />}
        </div>
      </>
    );
  }

  if (leaf === 'activity') {
    return (
      <>
        {head('Your Activity')}
        <div className="ph-body">
          <div className="ph-panel">
            <div className="ph-label">What You Have Done Here</div>
            <p className="ph-card-meta">
              {liked} posts liked, {commented} comments left, {saved.length} saved,
              {' '}{archive.length} posted.
            </p>
          </div>
          <div className="ph-section-head">Time On The App</div>
          <div className="ph-panel">
            <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{today} min</p>
            <p className="ph-card-meta">Today. The seven days behind it are on the next page.</p>
          </div>
        </div>
      </>
    );
  }

  if (leaf === 'time') {
    const most = Math.max(1, ...week);
    return (
      <>
        {head('Time Management')}
        <div className="ph-body">
          <div className="ph-panel">
            <div className="ph-label">The Last Seven Days</div>
            <div className="ph-spark" style={{ marginTop: 8 }}>
              {week.map((minutes, index) => (
                <i key={index} style={{ height: `${Math.round((minutes / most) * 100)}%` }} />
              ))}
            </div>
            <p className="ph-card-meta">
              {week.reduce((sum, n) => sum + n, 0)} minutes over the week, {today} of them today.
              This is the real clock, not an estimate: it is the time the app actually took out of
              your days.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (leaf === 'privacy') {
    return (
      <>
        {head('Account Privacy')}
        <div className="ph-body">
          <div className="ph-set-group">
            <Row
              icon={<LockGlyph size={17} />}
              label="Private Account"
              value={settings.privateAccount ? 'On' : 'Off'}
              onClick={() => set({ privateAccount: !settings.privateAccount })}
            />
          </div>
          <p className="ph-card-meta" style={{ padding: 12 }}>
            A private account is seen by far fewer people, so it grows far more slowly. That is not
            a warning, it is what the setting does here.
          </p>
        </div>
      </>
    );
  }

  if (leaf === 'close' || leaf === 'blocked' || leaf === 'muted') {
    const list = leaf === 'close'
      ? closeFriends.map((f) => profiles[f.profileId]).filter(Boolean) as SocialProfile[]
      : (leaf === 'blocked' ? settings.blockedProfileIds : settings.mutedProfileIds)
        .map((id) => profiles[id]).filter(Boolean) as SocialProfile[];
    const title = leaf === 'close' ? 'Close Friends' : leaf === 'blocked' ? 'Blocked' : 'Muted Accounts';
    return (
      <>
        {head(title)}
        <div className="ph-body">
          {list.length === 0 && <p className="ph-empty">Nobody on this list.</p>}
          {list.map((profile) => (
            <button key={profile.id} type="button" className="ph-dm-row" onClick={() => onWho(profile.id)}>
              <Avatar name={profile.name} size={40} image={profile.avatarImage} />
              <span className="ph-dm-text">
                <b>{profile.handle}</b>
                <small>{profile.name}</small>
              </span>
            </button>
          ))}
        </div>
      </>
    );
  }

  if (leaf === 'hidden') {
    return (
      <>
        {head('Hidden Words')}
        <div className="ph-body">
          <div className="ph-panel">
            <div className="ph-label">Words And Phrases</div>
            <input
              className="ph-input"
              value={words}
              placeholder="Separated by commas"
              onChange={(e) => setWords(e.target.value)}
            />
            <div className="ph-actions">
              <button
                type="button"
                className="ph-btn-solid"
                onClick={() => {
                  set({ hiddenWords: words.split(',') });
                  say('Saved. Comments carrying those will not reach you.');
                }}
              >
                Save
              </button>
            </div>
            <p className="ph-card-meta">
              A comment carrying any of these never reaches you, on either app. It is applied where
              the comment is read, so it works on the ones already there as well as the new ones.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (leaf === 'counts') {
    return (
      <>
        {head('Like And Share Counts')}
        <div className="ph-body">
          <div className="ph-set-group">
            <Row
              icon={<HeartGlyph size={17} />}
              label="Hide Counts"
              value={settings.hideCounts ? 'On' : 'Off'}
              onClick={() => set({ hideCounts: !settings.hideCounts })}
            />
          </div>
          <p className="ph-card-meta" style={{ padding: 12 }}>
            Hides the numbers on everybody&rsquo;s posts, including your own. What they earn is
            unchanged; you just stop being shown it.
          </p>
        </div>
      </>
    );
  }

  if (leaf === 'notifications') {
    return (
      <>
        {head('Notifications')}
        <div className="ph-body">
          <div className="ph-set-group">
            <Row
              icon={<BellGlyph size={17} />}
              label="Pause All"
              value={settings.notificationsOn ? 'Off' : 'On'}
              onClick={() => set({ notificationsOn: !settings.notificationsOn })}
            />
          </div>
          <p className="ph-card-meta" style={{ padding: 12 }}>
            With these paused, nothing from either app interrupts your day. It still happens; you
            just find out when you open the app.
          </p>
        </div>
      </>
    );
  }

  if (leaf === 'subscriptions') {
    return (
      <>
        {head('Subscriptions')}
        <div className="ph-body">
          <div className="ph-set-group">
            <Row
              icon={<TickGlyph size={15} />}
              label="Meta Verified"
              value={mine?.verified ? 'Subscribed' : 'Not Subscribed'}
              onClick={() => {
                const result = run(mine?.verified ? 'feed.leave_verified' : 'feed.join_verified', {}, { silent: true });
                say(result.ok
                  ? (mine?.verified ? 'Canceled. Nothing more will be taken.' : 'Verified. The badge is on your name.')
                  : result.error ?? 'That did not work.');
              }}
            />
            <Row icon={<EyeGlyph size={17} />} label="Professional Dashboard" onClick={onDashboard} />
          </div>
          <p className="ph-card-meta" style={{ padding: 12 }}>
            Meta Verified is {formatMoney(PHOTO_VERIFIED_MONTHLY)} a month, taken every month, and it
            lapses on its own if the money is not there. It buys the badge, not the audience.
          </p>
        </div>
      </>
    );
  }

  if (leaf === 'about') {
    return (
      <>
        {head('About')}
        <div className="ph-body">
          <p className="ph-empty">
            <b>This Is SLATE&rsquo;s Own App</b>
            The accounts here are invented. Nobody real is named, no follower count belongs to
            anybody, and nothing you write on this phone leaves the game.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {head('Settings And Activity')}
      <div className="ph-body">
        <div className="ph-set-head">Your Account</div>
        <div className="ph-set-group">
          <Row icon={<AccountGlyph size={17} />} label="Accounts Center" value={mine?.handle ?? 'No Account'} onClick={onSwitcher} />
        </div>

        <div className="ph-set-head">How You Use Instagram</div>
        <div className="ph-set-group">
          <Row icon={<BookmarkGlyph size={17} />} label="Saved" value={saved.length || undefined} onClick={() => setLeaf('saved')} />
          <Row icon={<ClockGlyph size={17} />} label="Archive" value={archive.length || undefined} onClick={() => setLeaf('archive')} />
          <Row icon={<EyeGlyph size={17} />} label="Your Activity" onClick={() => setLeaf('activity')} />
          <Row icon={<BellGlyph size={17} />} label="Notifications" value={settings.notificationsOn ? 'On' : 'Paused'} onClick={() => setLeaf('notifications')} />
          <Row icon={<ClockGlyph size={17} />} label="Time Management" value={`${today} Min Today`} onClick={() => setLeaf('time')} />
        </div>

        <div className="ph-set-head">Who Can See Your Content</div>
        <div className="ph-set-group">
          <Row icon={<LockGlyph size={17} />} label="Account Privacy" value={settings.privateAccount ? 'Private' : 'Public'} onClick={() => setLeaf('privacy')} />
          <Row icon={<HeartGlyph size={17} />} label="Close Friends" value={closeFriends.length} onClick={() => setLeaf('close')} />
          <Row icon={<BlockGlyph size={17} />} label="Blocked" value={settings.blockedProfileIds.length} onClick={() => setLeaf('blocked')} />
        </div>

        <div className="ph-set-head">How Others Can Interact With You</div>
        <div className="ph-set-group">
          <Row icon={<SendGlyph size={17} />} label="Messages And Story Replies" value="Everyone" />
          <Row icon={<BubbleGlyph size={17} />} label="Comments" value="Everyone" />
          <Row icon={<MenuGlyph size={17} />} label="Muted Accounts" value={settings.mutedProfileIds.length} onClick={() => setLeaf('muted')} />
          <Row icon={<SlidersGlyph size={17} />} label="Hidden Words" value={settings.hiddenWords.length} onClick={() => setLeaf('hidden')} />
        </div>

        <div className="ph-set-head">What You See</div>
        <div className="ph-set-group">
          <Row icon={<HeartGlyph size={17} />} label="Like And Share Counts" value={settings.hideCounts ? 'Hidden' : 'Shown'} onClick={() => setLeaf('counts')} />
        </div>

        <div className="ph-set-head">Your Insights And Tools</div>
        <div className="ph-set-group">
          <Row icon={<EyeGlyph size={17} />} label="Account Type And Tools" value="Creator" onClick={onDashboard} />
        </div>

        <div className="ph-set-head">Subscriptions</div>
        <div className="ph-set-group">
          <Row icon={<TickGlyph size={15} />} label="Meta Verified" value={mine?.verified ? 'Subscribed' : 'Not Subscribed'} onClick={() => setLeaf('subscriptions')} />
        </div>

        <div className="ph-set-head">More Info And Support</div>
        <div className="ph-set-group">
          <Row icon={<GearGlyph size={17} />} label="About" onClick={() => setLeaf('about')} />
        </div>

        <div className="ph-set-head">Login</div>
        <div className="ph-set-group">
          <Row icon={<PlusGlyph size={17} />} label="Switch Account" onClick={onSwitcher} />
        </div>
        <p className="ph-card-meta" style={{ padding: 12 }}>
          Joined {mine ? new Date(mine.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'not yet'}.
          {' '}Last opened {ago(now, now)}.
        </p>
      </div>
    </>
  );
}

/**
 * The sheet the app puts up when you tap your own handle. One life, one
 * account, so it says so rather than pretending you could hold five.
 */
function AccountSwitcher({ onClose, say }: { onClose: () => void; say: (text: string) => void }) {
  const mine = useWorld((s) => myProfile(s, PHOTO_PLATFORM));
  const other = useWorld((s) => myProfile(s, 'chatter'));
  return (
    <div className="ph-sheet">
      <div className="ph-sheet-top">
        <button type="button" className="ph-iconbtn" onClick={onClose} aria-label="Close"><BackGlyph /></button>
        <b>Accounts Center</b>
      </div>
      <div className="ph-body">
        <div className="ph-set-group">
          {mine ? (
            <div className="ph-dm-row" style={{ cursor: 'default' }}>
              <Avatar name={mine.name} size={40} image={mine.avatarImage} />
              <span className="ph-dm-text"><b>{mine.handle}</b><small>Instagram</small></span>
              <span className="ph-tick" aria-label="Signed In"><TickGlyph /></span>
            </div>
          ) : <p className="ph-empty">No account on this app yet.</p>}
          {other && (
            <div className="ph-dm-row" style={{ cursor: 'default' }}>
              <Avatar name={other.name} size={40} image={other.avatarImage} />
              <span className="ph-dm-text"><b>{other.handle}</b><small>X</small></span>
            </div>
          )}
        </div>
        <p className="ph-card-meta" style={{ padding: 12 }}>
          One life, one set of accounts. SLATE does not keep a second identity for you, so there is
          nothing here to switch to.
        </p>
        <div className="ph-actions" style={{ padding: '0 12px' }}>
          <button type="button" className="ph-btn-outline" onClick={() => say('You stay signed in. This is your phone.')}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
