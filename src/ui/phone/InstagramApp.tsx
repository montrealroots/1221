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

import { Children, isValidElement, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';
import { plural } from '@/engine/core/text';
import type { SocialItem, SocialProfile } from '@/engine/domain/model';
import {
  GIFT_STEPS, PHOTO_PLATFORM, PHOTO_SUB_MONTHLY, PHOTO_VERIFIED_MONTHLY, catalogOf, exploreFeed,
  followingFeed, homeFeed, isBlocked, isFollowing, isMuted, itemById, messagesWith, myProfile,
  collectionsOf, followersOf, noteOf, photoSubscribers, profileById, repliesTo, screenTime, screenTimeWeek,
  searchSocial, settingsOf, socialAnalytics, storiesFor, threadsOf,
} from '@/engine/systems/socialapps';
import { SOCIAL_TOPICS, SOCIAL_TOPIC_LABEL, type SocialTopic } from '@/engine/content/socialworld';
import { ageOf } from '@/engine/systems/lifespan';
import {
  AccessGlyph, AccountGlyph, AddPersonGlyph, BackGlyph, BarsGlyph, BellGlyph, BellOffGlyph,
  BlockGlyph, BlockRingGlyph, BookmarkGlyph, BubbleGlyph, CameraGlyph, CartGlyph, ChevronRightGlyph,
  ClockGlyph, ComposeGlyph, ContentGlyph, CrosspostGlyph, DeviceGlyph, DownGlyph, DownloadGlyph,
  EyeGlyph, FaceGlyph, GearGlyph, GemGlyph, GridGlyph, HeartGlyph, HeartOffGlyph, HideStoryGlyph,
  HistoryGlyph, HomeGlyph, InsightGlyph, LanguageGlyph, LettersGlyph, LimitGlyph, LockGlyph,
  MenuGlyph, NotesPageGlyph, PeopleGlyph, PlusGlyph, PrivacyGlyph, ReelsGlyph, RepostGlyph,
  RingHelpGlyph, ScreensGlyph, SearchGlyph, SendGlyph, SlidersGlyph, StarRingGlyph,
  SupervisionGlyph, TaggedGlyph, TickGlyph, TimelineGlyph,
} from './Icons';
import { Avatar, ago, tally, views } from './YouTubeExtras';
import { ImagePicker } from './ImagePicker';
import { EmojiRow } from './EmojiRow';
import type { PhoneTheme } from './Phone';
import './social.css';

type Tab = 'home' | 'reels' | 'messages' | 'search' | 'profile';
type Screen = 'app' | 'create' | 'dashboard' | 'thread' | 'settings' | 'switcher' | 'activity' | 'live';

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
  // Yours has the pictures you brought. The world's is derived like the rest
  // of it, from its own id, so the same post always has the same count.
  if (item.byPlayer) return Math.max(1, item.images?.length ?? 1);
  return 2 + (item.id.length % 4);
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
      ) : screen === 'activity' ? (
        <ActivityPage now={now} mine={mine} onBack={() => setScreen('app')} onOpen={setOpenId} onWho={setWhoId} />
      ) : screen === 'live' ? (
        <LiveSheet onClose={() => setScreen('app')} say={say} />
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
                    <button type="button" className="ph-iconbtn" aria-label="Activity" onClick={() => setScreen('activity')}>
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
              <div className="ph-body ph-ig-pad">
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
                  onLive={() => setScreen('live')}
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
  const file = () => {
    const name = window.prompt('File this in which collection?')?.trim();
    if (!name) return;
    const result = run('feed.bookmark', { itemId: item.id, collection: name }, { silent: true });
    say(result.ok ? `Filed under ${name}.` : result.error ?? 'That did not work.');
  };

  const long = item.text.length > 110;
  const caption = expanded || !long ? item.text : `${item.text.slice(0, 110).trimEnd()}…`;

  return (
    <article className="ph-post">
      <div className="ph-post-head">
        <button type="button" className="ph-iconbtn ph-post-face" onClick={() => onWho(profile.id)} aria-label={profile.name}>
          <span className="ph-story-ring"><span><Avatar name={profile.name} size={34} image={profile.avatarImage} /></span></span>
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
        <button
          type="button"
          className={`ph-iconbtn ph-right${item.saved ? ' ph-liked' : ''}`}
          onClick={save}
          onDoubleClick={file}
          aria-label={item.saved ? 'Remove From Saved' : 'Save'}
          title="Double tap to file it in a collection"
        >
          <BookmarkGlyph size={21} filled={item.saved} />
        </button>
      </div>

      <div className="ph-post-likes">{tally(item.likes, 'like')}</div>
      <div className="ph-post-caption">
        <b>{profile.handle}</b>
        {caption}
      </div>
      {long && !expanded && (
        <button type="button" className="ph-post-more" onClick={() => setExpanded(true)}>more</button>
      )}
      {item.comments > 0 && (
        <button type="button" className="ph-post-more" onClick={() => onOpen(item.id)}>
          View all {tally(item.comments, 'comment')}
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
  // Your own story is the first ring rather than a second one further along,
  // and a close friends one is ringed the way the app rings it.
  const own = mine ? stories.find((s) => s.profileId === mine.id) : undefined;
  const yours = Boolean(own);
  return (
    <div className="ph-stories">
      <button type="button" className="ph-story" onClick={onAdd} aria-label="Your Story">
        {note && <span className="ph-note">{note}</span>}
        <span className={`ph-story-ring${yours ? '' : ' ph-seen'}${own?.closeOnly ? ' ph-close' : ''}`}>
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
            <span className={`ph-story-ring${story.seen ? ' ph-seen' : ''}${story.closeOnly ? ' ph-close' : ''}`}>
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
  /** Accounts you already follow who follow this one too, which is what the app says here. */
  const alsoFollow = useWorld((s) => (profile
    ? Object.values(s.universe.socialProfiles)
      .filter((one) => one.platform === PHOTO_PLATFORM
        && one.id !== profile.id
        && isFollowing(s, s.player.id, one.id))
      .slice(0, 3)
    : []));

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
        <button
          type="button"
          className="ph-iconbtn ph-reel-filters"
          aria-label="What You Are Being Shown"
          onClick={() => say(lane === 'friends'
            ? 'Friends is only the accounts you follow, newest first.'
            : 'Reels is what you have watched and who you follow, and nothing else.')}
        >
          <SlidersGlyph size={22} />
        </button>
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
              <BookmarkGlyph size={26} filled={reel.saved} />
            </button>
            <button
              type="button"
              aria-label="More"
              onClick={() => say(`${SOCIAL_TOPIC_LABEL[reel.topic as SocialTopic]}. Nothing more to do with somebody else’s reel here.`)}
            >
              <MenuGlyph size={22} />
            </button>
            <span
              className="ph-reel-thumb"
              aria-hidden="true"
              style={reel.images?.[0] ? undefined : { background: look(`${reel.id}:thumb`) }}
            >
              {reel.images?.[0] && <img src={reel.images[0]} alt="" />}
            </span>
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
            {alsoFollow.length > 0 && (
              <span className="ph-reel-mutual">
                <span className="ph-reel-faces" aria-hidden="true">
                  {alsoFollow.slice(0, 2).map((one) => (
                    <Avatar key={one.id} name={one.name} size={18} image={one.avatarImage} />
                  ))}
                </span>
                Followed by <b>{alsoFollow[0]!.handle}</b>
                {alsoFollow.length > 1 && <> and <b>{tally(alsoFollow.length - 1, 'other')}</b></>}
              </span>
            )}
            <p className="ph-reel-when">{ago(now, reel.at)} · Reel {Math.min(at, reels.length - 1) + 1} of {reels.length}</p>
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
  profile, now, onBack, onOpen, onDashboard, onSettings, onMessage, onCreate, onLive, say,
}: {
  profile: SocialProfile; now: number; onBack?: () => void;
  onOpen: (id: string) => void; onDashboard?: () => void; onSettings?: () => void;
  onMessage: (id: string) => void; onCreate?: () => void; onLive?: () => void;
  say: (text: string) => void;
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

      <div className="ph-body ph-ig-pad">
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
              <button
                type="button"
                onClick={() => say(`Your page is @${profile.handle}. Anybody in this world can find it; nothing about it leaves the game.`)}
              >
                Share Profile
              </button>
              <button
                type="button"
                className="ph-prof-square"
                aria-label="Find People"
                onClick={() => say('The accounts here are the people in your life and the ones this world made. Search finds them.')}
              >
                <AddPersonGlyph size={19} />
              </button>
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

        {own && !profile.bio && (
          <div className="ph-prof-chiprow">
            <button type="button" className="ph-prof-chip" onClick={() => setEditing(true)}>+ Add Bio</button>
          </div>
        )}
        {own && onLive && (
          <div className="ph-prof-chiprow">
            <button type="button" className="ph-prof-chip" onClick={() => onLive()}>Go Live</button>
            {onDashboard && (
              <button type="button" className="ph-prof-chip" onClick={onDashboard}>Professional Dashboard</button>
            )}
          </div>
        )}

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
            <small><b>{2 - missing.length} of 2</b> complete</small>
            <div className="ph-todo-cards">
              {missing.map((task) => (
                <div key={task.key} className="ph-todo-card">
                  <span className="ph-todo-mark" aria-hidden="true"><AccountGlyph size={34} /></span>
                  <b>{task.title}</b>
                  <span className="ph-todo-body">{task.body}</span>
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
  const [images, setImages] = useState<(string | undefined)[]>([undefined]);
  const [closeOnly, setCloseOnly] = useState(false);
  const [later, setLater] = useState(false);
  const [days, setDays] = useState(1);
  const picked = images.filter((image): image is string => Boolean(image));

  const post = () => {
    if (kind === 'story') {
      const result = run('feed.story', { text, images: picked, close: closeOnly }, { silent: true });
      say(result.ok
        ? closeOnly ? 'Story up, close friends only. It is gone in a day.' : 'Story up. It is gone in a day.'
        : result.error ?? 'That did not work.');
      if (result.ok) onClose();
      return;
    }
    const result = run<{ scheduled: boolean }>('feed.post', {
      platform: PHOTO_PLATFORM,
      kind,
      text,
      place: place || undefined,
      images: picked,
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
          {images.map((image, index) => (
            <div key={index}>
              {kind === 'carousel' && (
                <div className="ph-label">Picture {index + 1} Of {images.length}</div>
              )}
              <ImagePicker
                frame={kind === 'reel' || kind === 'story' ? 'short' : 'square'}
                image={image}
                label={kind === 'carousel' ? `Picture ${index + 1}` : 'Your Picture'}
                onChange={(next) => setImages((all) => all.map((one, at) => (at === index ? next : one)))}
              />
              {kind === 'carousel' && images.length > 1 && (
                <button
                  type="button"
                  className="ph-btn-outline"
                  onClick={() => setImages((all) => all.filter((_, at) => at !== index))}
                >
                  Remove Picture {index + 1}
                </button>
              )}
            </div>
          ))}
          {kind === 'carousel' && images.length < 10 && (
            <div className="ph-actions">
              <button type="button" className="ph-btn-outline" onClick={() => setImages((all) => [...all, undefined])}>
                Add Another Picture
              </button>
            </div>
          )}
          {kind === 'story' && (
            <label className="ph-card-meta" style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 8 }}>
              <input type="checkbox" checked={closeOnly} onChange={(e) => setCloseOnly(e.target.checked)} />
              Close friends only
            </label>
          )}
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
            {kind === 'carousel' && ` ${picked.length} of the ten a carousel holds.`}
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
  const settings = useWorld((st) => settingsOf(st));
  const [showing, setShowing] = useState<'messages' | 'requests'>('messages');
  const [query, setQuery] = useState('');
  const found = useWorld((s) => searchSocial(s, PHOTO_PLATFORM, query));

  const list = threads.filter((t) => (showing === 'requests' ? t.waiting : !t.waiting));

  return (
    <>
      <div className="ph-ig-top">
        <span />
        <span className="ph-mid ph-ig-handle">
          <b>{mine?.handle ?? 'Messages'}</b><DownGlyph size={15} />
        </span>
        <span className="ph-right">
          <button type="button" className="ph-iconbtn" aria-label="New Message" onClick={() => say('Search for somebody below and open their account to write to them.')}>
            <ComposeGlyph size={23} />
          </button>
        </span>
      </div>
      <div className="ph-body ph-ig-pad">
        <div className="ph-ig-find">
          <SearchGlyph size={17} />
          <input value={query} placeholder="Search" aria-label="Search" onChange={(e) => setQuery(e.target.value)} />
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
            <div className="ph-ig-notes">
              <span className="ph-ig-note-one">
                <span className="ph-ig-note-mark">
                  <span className="ph-note">{note ?? 'Note…'}</span>
                  <Avatar name={mine?.name ?? 'You'} size={64} image={mine?.avatarImage} />
                </span>
                <i>Your Note</i>
              </span>
            </div>

            <div className="ph-dm-head">
              <b>{showing === 'requests' ? 'Requests' : 'Messages'}</b>
              {showing === 'messages' && !settings.notificationsOn && (
                <span className="ph-dm-quiet" aria-label="Notifications Off"><BellOffGlyph size={17} /></span>
              )}
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
      <div className="ph-ig-searchtop">
        <span className="ph-ig-find">
          <SearchGlyph size={17} />
          <input value={query} placeholder="Search" aria-label="Search" onChange={(e) => setQuery(e.target.value)} />
        </span>
        <button type="button" className="ph-iconbtn" aria-label="Clear Filters" onClick={() => setChip('all')}>
          <SlidersGlyph size={22} />
        </button>
      </div>
      <div className="ph-body ph-ig-pad">
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
              <div key={payout.id} className="ph-ig-row" style={{ cursor: 'default' }}>
                {new Date(payout.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                <span className="ph-ig-val">{formatMoney(payout.total)}</span>
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
    <button type="button" className="ph-ig-row" onClick={onClick} disabled={!onClick}>
      <span className="ph-ig-row-icon">{icon}</span>
      <span className="ph-ig-row-label">{label}</span>
      <span className="ph-ig-val">{value}</span>
      <span className="ph-ig-row-go" aria-hidden="true"><ChevronRightGlyph size={15} /></span>
    </button>
  );
}

/**
 * One captioned section of the settings list.
 *
 * The search field filters by what a row says rather than by a key, so typing
 * "block" finds Blocked whichever section it happens to live in, and a section
 * with nothing left in it takes its caption away with it.
 */
function Group({ cap, find, children }: { cap: string; find: string; children: React.ReactNode }) {
  const needle = find.trim().toLowerCase();
  const rows = Children.toArray(children).filter((child) => {
    if (needle.length < 2) return true;
    if (!isValidElement<{ label?: string }>(child)) return false;
    return `${cap} ${child.props.label ?? ''}`.toLowerCase().includes(needle);
  });
  if (rows.length === 0) return null;
  return (
    <>
      <div className="ph-ig-cap">{cap}</div>
      <div className="ph-ig-group">{rows}</div>
    </>
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
  const folders = useWorld((s) => collectionsOf(s)
    .map((folder) => ({ name: folder.name, items: folder.items.filter((i) => i.platform === PHOTO_PLATFORM) }))
    .filter((folder) => folder.items.length > 0));
  const week = useWorld((s) => screenTimeWeek(s, PHOTO_PLATFORM));
  const today = useWorld((s) => screenTime(s, PHOTO_PLATFORM));
  const [words, setWords] = useState(settings.hiddenWords.join(', '));
  const [find, setFind] = useState('');
  const supervised = useWorld((st) => ageOf(st, st.player) < 18);

  const set = (patch: Record<string, unknown>) => {
    const result = run('feed.settings', patch, { silent: true });
    if (!result.ok) say(result.error ?? 'That did not work.');
  };

  const head = (title: string) => (
    <div className="ph-ig-settop">
      <button type="button" className="ph-ig-back" onClick={() => (leaf === 'root' ? onBack() : setLeaf('root'))} aria-label="Back">
        <BackGlyph size={20} />
      </button>
      <b>{title}</b>
      <span style={{ width: 34 }} />
    </div>
  );

  if (leaf === 'saved') {
    return (
      <>
        {head('Saved')}
        <div className="ph-body">
          {folders.length === 0
            ? <p className="ph-empty"><b>Nothing Saved</b>The bookmark under a post keeps it here.</p>
            : folders.map((folder) => (
              <div key={folder.name}>
                <div className="ph-section-head">{folder.name}</div>
                <Tiles items={folder.items} onOpen={onOpen} />
              </div>
            ))}
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
          <div className="ph-ig-group">
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
          <div className="ph-ig-group">
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
          <div className="ph-ig-group">
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
          <div className="ph-ig-group">
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
      <div className="ph-body ph-ig-pad">
        <div className="ph-ig-find">
          <SearchGlyph size={17} />
          <input value={find} placeholder="Search" aria-label="Search Settings" onChange={(e) => setFind(e.target.value)} />
        </div>

        <Group cap="Your Account" find={find}>
          <Row icon={<AccountGlyph size={24} />} label="Accounts Center" value={mine?.handle ?? 'No Account'} onClick={onSwitcher} />
        </Group>

        <Group cap="How You Use Instagram" find={find}>
          <Row icon={<BookmarkGlyph size={24} />} label="Saved" value={saved.length || undefined} onClick={() => setLeaf('saved')} />
          <Row icon={<BookmarkGlyph size={24} />} label="Collections" value={folders.length} onClick={() => setLeaf('saved')} />
          <Row icon={<HistoryGlyph size={24} />} label="Archive" value={archive.length || undefined} onClick={() => setLeaf('archive')} />
          <Row icon={<TimelineGlyph size={24} />} label="Your Activity" onClick={() => setLeaf('activity')} />
          <Row icon={<BellGlyph size={24} />} label="Notifications" value={settings.notificationsOn ? 'On' : 'Paused'} onClick={() => setLeaf('notifications')} />
          <Row icon={<ClockGlyph size={24} />} label="Time Management" value={`${today} Min Today`} onClick={() => setLeaf('time')} />
        </Group>

        <Group cap="Who Can See Your Content" find={find}>
          <Row icon={<LockGlyph size={24} />} label="Account Privacy" value={settings.privateAccount ? 'Private' : 'Public'} onClick={() => setLeaf('privacy')} />
          <Row icon={<StarRingGlyph size={24} />} label="Close Friends" value={closeFriends.length} onClick={() => setLeaf('close')} />
          <Row icon={<CrosspostGlyph size={24} />} label="Crossposting" value="Off" onClick={() => say('The other apps on this phone each keep their own posts. Nothing you write here is copied into them.')} />
          <Row icon={<BlockRingGlyph size={24} />} label="Blocked" value={settings.blockedProfileIds.length} onClick={() => setLeaf('blocked')} />
          <Row icon={<HideStoryGlyph size={24} />} label="Hide Story And Live" value={settings.privateAccount ? 'Followers Only' : 'Everyone'} onClick={() => setLeaf('privacy')} />
          <Row icon={<PeopleGlyph size={24} />} label="Activity In Friends Feed" value={settings.hideCounts ? 'Hidden' : 'Shown'} onClick={() => setLeaf('counts')} />
        </Group>

        <Group cap="How Others Can Interact With You" find={find}>
          <Row icon={<SendGlyph size={24} />} label="Messages And Story Replies" value="Everyone" onClick={() => say('Anybody can write to you. What they get back is up to you, and whether they write again is up to them.')} />
          <Row icon={<TaggedGlyph size={24} />} label="Tags And Mentions" value="Everyone" onClick={() => say('Anybody can name you in a post. It shows in Tagged on your page.')} />
          <Row icon={<BubbleGlyph size={24} />} label="Comments" value="Everyone" onClick={() => say('Comments are open. Hidden Words is what keeps particular ones out.')} />
          <Row icon={<RepostGlyph size={24} />} label="Sharing" value="Allowed" onClick={() => say('Your posts can be shared on. Nothing leaves the game when they are.')} />
          <Row icon={<BlockGlyph size={24} />} label="Restricted" value={settings.mutedProfileIds.length} onClick={() => setLeaf('muted')} />
          <Row icon={<LimitGlyph size={24} />} label="Limit Interactions" value="Off" onClick={() => say('Nothing is being held back from you right now.')} />
          <Row icon={<LettersGlyph size={24} />} label="Hidden Words" value={settings.hiddenWords.length} onClick={() => setLeaf('hidden')} />
          <Row icon={<AddPersonGlyph size={24} />} label="Follow And Invite Friends" onClick={() => say('The people here are the ones in your life and the ones this world made. There is nobody outside it to invite.')} />
        </Group>

        <Group cap="What You See" find={find}>
          <Row icon={<StarRingGlyph size={24} />} label="Favorites" value={closeFriends.length} onClick={() => setLeaf('close')} />
          <Row icon={<BellOffGlyph size={24} />} label="Muted Accounts" value={settings.mutedProfileIds.length} onClick={() => setLeaf('muted')} />
          <Row icon={<ContentGlyph size={24} />} label="Content Preferences" onClick={() => say('The feed is built from what you have watched and who you follow. Nothing else feeds it.')} />
          <Row icon={<HeartOffGlyph size={24} />} label="Like And Share Counts" value={settings.hideCounts ? 'Hidden' : 'Shown'} onClick={() => setLeaf('counts')} />
        </Group>

        <Group cap="Your App And Media" find={find}>
          <Row icon={<DeviceGlyph size={24} />} label="Device Permissions" value="Camera And Photos" onClick={() => say('The camera and the picture roll on this handset. Both are the game’s own, and neither touches your machine.')} />
          <Row icon={<DownloadGlyph size={24} />} label="Archiving And Downloading" value={`${archive.length} Kept`} onClick={() => setLeaf('archive')} />
          <Row icon={<AccessGlyph size={24} />} label="Accessibility" onClick={() => say('Every control here has a name a screen reader can read, and nothing is carried by color alone.')} />
          <Row icon={<LanguageGlyph size={24} />} label="Language And Translations" value="English" onClick={() => say('The app is in English. SLATE does not translate itself yet.')} />
          <Row icon={<BarsGlyph size={24} />} label="Media Quality" value="Best Available" onClick={() => say('Pictures are drawn rather than fetched, so there is no quality to trade against a connection.')} />
          <Row icon={<ScreensGlyph size={24} />} label="App Website Permissions" value="None" onClick={() => say('Nothing on this phone opens a browser. There is nowhere for it to go.')} />
          <Row icon={<FaceGlyph size={24} />} label="Face And Hand Movements" value="Off" onClick={() => say('Nothing is read from a camera. The handset’s camera is a screen in the game.')} />
        </Group>

        <Group cap="Family Center" find={find}>
          <Row icon={<SupervisionGlyph size={24} />} label="Supervision For Teen Accounts" value={supervised ? 'On' : 'Off'} onClick={() => say(supervised ? 'You are under eighteen, so this account is supervised at home. What that changes is in the Family room, not here.' : 'Nobody is being supervised on this handset.')} />
        </Group>

        <Group cap="Your Insights And Tools" find={find}>
          <Row icon={<InsightGlyph size={24} />} label="Account Type And Tools" value="Creator" onClick={onDashboard} />
        </Group>

        <Group cap="Subscriptions" find={find}>
          <Row icon={<GemGlyph size={24} />} label="Verified" value={mine?.verified ? 'Subscribed' : 'Not Subscribed'} onClick={() => setLeaf('subscriptions')} />
          <Row icon={<RepostGlyph size={24} />} label="All Subscriptions" value={mine?.verified ? '1 Active' : 'None'} onClick={() => setLeaf('subscriptions')} />
        </Group>

        <Group cap="Your Orders And Fundraisers" find={find}>
          <Row icon={<HeartGlyph size={24} />} label="Fundraisers" value="None" onClick={() => say('Nothing is being raised through this account.')} />
          <Row icon={<TimelineGlyph size={24} />} label="Orders And Payments" onClick={() => say('What the app takes from you is the subscription, and it is on your bank statement like anything else.')} />
          <Row icon={<CartGlyph size={24} />} label="Cart" value="Empty" onClick={() => say('Shopping in SLATE happens in shops, not in here.')} />
        </Group>

        <Group cap="More Info And Support" find={find}>
          <Row icon={<RingHelpGlyph size={24} />} label="Help" onClick={() => say('Everything on this phone is SLATE’s own. The accounts are invented and nobody real is named.')} />
          <Row icon={<PrivacyGlyph size={24} />} label="Privacy Center" onClick={() => say('Your save stays on your machine. Nothing about you is collected, sent or sold, because there is nobody on the other end.')} />
          <Row icon={<AccountGlyph size={24} />} label="Account Status" value="In Good Standing" onClick={() => say('Nothing you have posted has been taken down, and nothing is being held against the account.')} />
          <Row icon={<NotesPageGlyph size={24} />} label="Community Notes" value="None" onClick={() => say('Nothing you have posted has had a note added to it.')} />
          <Row icon={<GearGlyph size={24} />} label="About" onClick={() => setLeaf('about')} />
        </Group>

        <Group cap="Login" find={find}>
          <Row icon={<PlusGlyph size={24} />} label="Switch Account" onClick={onSwitcher} />
        </Group>

        <p className="ph-ig-foot">
          Joined {mine ? new Date(mine.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'not yet'}.
          {' '}This is SLATE’s own photo app. It talks to nothing outside the game.
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
        <div className="ph-ig-group">
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

// ---------------------------------------------------------------------------
// Activity, and going live
// ---------------------------------------------------------------------------

/**
 * The heart at the top of the app.
 *
 * What came back: who followed you, what your posts did, and what was said
 * under them. All of it out of the save rather than a placeholder line saying
 * nothing has happened.
 */
function ActivityPage({
  now, mine, onBack, onOpen, onWho,
}: {
  now: number; mine: SocialProfile | undefined; onBack: () => void;
  onOpen: (id: string) => void; onWho: (id: string) => void;
}) {
  const items = useWorld((s) => (mine ? catalogOf(s, mine) : []));
  const followers = useWorld((s) => (mine ? followersOf(s, mine.id) : []));
  const replies = useWorld((s) => Object.values(s.universe.socialItems)
    .filter((i) => i.kind === 'reply' && i.platform === PHOTO_PLATFORM && !i.byPlayer)
    .sort((a, b) => b.at - a.at)
    .slice(0, 20));
  const profiles = useWorld((s) => s.universe.socialProfiles);

  return (
    <>
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
        <b style={{ fontSize: 15 }}>Activity</b>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-body">
        {!mine && <p className="ph-empty"><b>Nothing Yet</b>Make an account and this fills up.</p>}

        {followers.length > 0 && <div className="ph-section-head">New Followers</div>}
        {followers.slice(0, 12).map((follow) => {
          const who = follow.byProfileId ? profiles[follow.byProfileId] : undefined;
          return (
            <button key={follow.id} type="button" className="ph-dm-row" onClick={() => who && onWho(who.id)}>
              <Avatar name={who?.name ?? '?'} size={40} image={who?.avatarImage} />
              <span className="ph-dm-text">
                <b>{who?.handle ?? 'someone'}</b>
                <small>started following you · {ago(now, follow.since)}</small>
              </span>
            </button>
          );
        })}

        {items.length > 0 && <div className="ph-section-head">Your Posts</div>}
        {items.map((item) => (
          <button key={item.id} type="button" className="ph-dm-row" onClick={() => onOpen(item.id)}>
            <span className="ph-iconbtn" style={{ color: 'var(--ph-red)' }}><HeartGlyph size={20} filled /></span>
            <span className="ph-dm-text">
              <b>{tally(item.likes, 'like')}, {tally(item.comments, 'comment')}</b>
              <small>{item.text.slice(0, 50)} · {ago(now, item.at)}</small>
            </span>
          </button>
        ))}

        {replies.length > 0 && <div className="ph-section-head">Comments</div>}
        {replies.map((reply) => {
          const who = profiles[reply.profileId];
          return (
            <button key={reply.id} type="button" className="ph-dm-row" onClick={() => reply.parentId && onOpen(reply.parentId)}>
              <Avatar name={who?.name ?? '?'} size={40} image={who?.avatarImage} />
              <span className="ph-dm-text">
                <b>{who?.handle ?? 'someone'}</b>
                <small>{reply.text} · {ago(now, reply.at)}</small>
              </span>
            </button>
          );
        })}

        {mine && items.length === 0 && followers.length === 0 && (
          <p className="ph-empty"><b>Quiet</b>Post something and see what comes back.</p>
        )}
      </div>
    </>
  );
}

function LiveSheet({ onClose, say }: { onClose: () => void; say: (text: string) => void }) {
  const { run } = useGame();
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState(45);
  return (
    <div className="ph-sheet">
      <div className="ph-sheet-top">
        <button type="button" className="ph-iconbtn" onClick={onClose} aria-label="Close"><BackGlyph /></button>
        <b>Go Live</b>
      </div>
      <div className="ph-body">
        <div className="ph-panel">
          <div className="ph-label">What You Are Calling It</div>
          <input className="ph-input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          <div className="ph-label">How Long, In Minutes</div>
          <input className="ph-input" type="number" min={10} max={300} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
          <p className="ph-card-meta">
            Live takes the hours out of the day, brings in whatever slice of the people who follow
            you is about, and collects whatever they chose to send while you were on. It leaves a
            record of having happened and nothing on the grid.
          </p>
          <div className="ph-actions">
            <button
              type="button"
              className="ph-btn-solid"
              onClick={() => {
                const result = run<{ peak: number; gifts: number }>('feed.go_live', {
                  platform: PHOTO_PLATFORM, title, minutes,
                }, { silent: true });
                if (result.ok) {
                  say(`${views(result.value!.peak)} watching at the peak. ${formatMoney(result.value!.gifts)} in.`);
                  onClose();
                } else say(result.error ?? 'That did not work.');
              }}
            >
              Go Live
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
