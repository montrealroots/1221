/**
 * SLATE — TikTok, on the phone.
 *
 * The app is the video. Everything else — the account, the caption, the sound,
 * the counts — sits on top of it, which is the one thing that makes this app
 * feel unlike the other three. Following and For You along the top, the rail of
 * counts down the right with the record spinning under it, the account, the
 * Follow button and the hook along the bottom, and five along the black bar:
 * Home, Discover, the create plate, Inbox and Profile.
 *
 * Nothing here is decoration. Scrolling costs the minutes. Liking, saving and
 * following change what the feed gives you tomorrow. Posting takes the hour it
 * takes to cut something and the hook you write decides whether anybody stays.
 * Once ten thousand people follow you the app pays, and it pays the way it
 * really does: on the views that stayed past a minute, not on the ones that
 * scrolled by, plus whatever was sent while you were live.
 *
 * The mark is drawn in CSS. SLATE ships no third party artwork.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { formatMoney } from '@/engine/core/money';
import { plural } from '@/engine/core/text';
import type { SocialItem, SocialProfile } from '@/engine/domain/model';
import {
  CLIP_FLOOR, CLIP_PLATFORM, catalogOf, collectionsOf, exploreFeed, followersOf, followingFeed,
  homeFeed, isFollowing, itemById, myProfile, profileById, repliesTo, screenTime, searchSocial,
  settingsOf, socialAnalytics, trends,
} from '@/engine/systems/socialapps';
import {
  AccessGlyph, AccountGlyph, AddPersonGlyph, ArrowShareGlyph, BackGlyph, BarsGlyph, BellGlyph,
  BlockRingGlyph, BookmarkGlyph, BubbleGlyph, CallGlyph, CartGlyph, ChartGlyph,
  ChevronRightGlyph, ClockGlyph, CloseGlyph, ContentGlyph, DeviceGlyph, DownloadGlyph, DownGlyph,
  FlaskGlyph, GearGlyph, HeartGlyph, HistoryGlyph, HomeGlyph, InfoGlyph,
  InsightGlyph, LanguageGlyph, LiveGlyph, LockGlyph, MenuGlyph, MusicGlyph, NoteGlyph, PeopleGlyph,
  PlayTriangleGlyph, PlusGlyph, RepostGlyph, RingHelpGlyph, RocketGlyph, SearchGlyph,
  ShieldGlyph, SparkleGlyph, SupervisionGlyph, TickGlyph, TimerGlyph, TvGlyph, YouGlyph,
} from './Icons';
import { Avatar, ago, tally, views } from './YouTubeExtras';
import { EmojiRow } from './EmojiRow';
import { ImagePicker } from './ImagePicker';
import type { PhoneTheme } from './Phone';
import './social.css';

type Tab = 'home' | 'friends' | 'inbox' | 'profile';
type Screen = 'app' | 'create' | 'live' | 'settings' | 'saved' | 'followers' | 'search' | 'studio';

/** A clip nobody has brought a cover to still has to look like something. */
function look(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 33 + id.charCodeAt(i)) % 100_000;
  const one = hash % 360;
  const two = (one + 50 + (hash % 80)) % 360;
  return `linear-gradient(${150 + (hash % 50)}deg, hsl(${one} 52% 38%), hsl(${two} 46% 18%))`;
}

export function TikTokApp({ theme }: { theme: PhoneTheme }) {
  void theme;
  const [tab, setTab] = useState<Tab>('home');
  const [screen, setScreen] = useState<Screen>('app');
  const [lane, setLane] = useState<Lane>('foryou');
  const [openId, setOpenId] = useState<string | null>(null);
  const [whoId, setWhoId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const now = useWorld((s) => s.now);
  const mine = useWorld((s) => myProfile(s, CLIP_PLATFORM));
  const open = useWorld((s) => (openId ? itemById(s, openId) : undefined));
  const who = useWorld((s) => (whoId ? profileById(s, whoId) : undefined));
  const unread = useWorld((s) => (mine ? catalogOf(s, mine).length : 0));

  const say = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((current) => (current === text ? null : current)), 4200);
  };

  return (
    <div className="ph-app-screen">
      {who ? (
        <ProfilePage
          profile={who}
          now={now}
          onBack={() => setWhoId(null)}
          onOpen={setOpenId}
          onSettings={() => setScreen('settings')}
          onFollowers={() => setScreen('followers')}
          onSaved={() => setScreen('saved')}
          onLive={() => setScreen('live')}
          say={say}
        />
      ) : open ? (
        <ClipPage item={open} now={now} onBack={() => setOpenId(null)} onWho={setWhoId} say={say} />
      ) : screen === 'create' ? (
        <CreateSheet onClose={() => setScreen('app')} say={say} hasProfile={Boolean(mine)} />
      ) : screen === 'live' ? (
        <LiveSheet onClose={() => setScreen('app')} say={say} />
      ) : screen === 'settings' ? (
        <SettingsPage onBack={() => setScreen('app')} say={say} />
      ) : screen === 'saved' ? (
        <SavedPage onBack={() => setScreen('app')} onOpen={setOpenId} />
      ) : screen === 'followers' ? (
        <FollowersPage onBack={() => setScreen('app')} onWho={setWhoId} />
      ) : screen === 'search' ? (
        <SearchPage onBack={() => setScreen('app')} onOpen={setOpenId} onWho={setWhoId} />
      ) : screen === 'studio' ? (
        <StudioPage onBack={() => setScreen('app')} onLive={() => setScreen('live')} say={say} />
      ) : (
        <>
          {tab === 'home' && (
            <Player
              lane={lane}
              setLane={setLane}
              now={now}
              onWho={setWhoId}
              onOpen={setOpenId}
              onSearch={() => setScreen('search')}
              onLive={() => setScreen('live')}
              say={say}
            />
          )}
          {tab === 'friends' && <FriendsPage onWho={setWhoId} say={say} />}
          {tab === 'inbox' && <InboxPage now={now} mine={mine} onOpen={setOpenId} onWho={setWhoId} />}
          {tab === 'profile' && (
            mine
              ? (
                <ProfilePage
                  profile={mine}
                  now={now}
                  onOpen={setOpenId}
                  onSettings={() => setScreen('settings')}
                  onFollowers={() => setScreen('followers')}
                  onSaved={() => setScreen('saved')}
                  onLive={() => setScreen('live')}
                  onStudio={() => setScreen('studio')}
                  say={say}
                />
              )
              : <MakeAccount say={say} />
          )}

          <div className="ph-tt-bar">
            <button type="button" className={tab === 'home' ? 'ph-on' : ''} onClick={() => setTab('home')}>
              <HomeGlyph size={22} filled={tab === 'home'} />
              Home
            </button>
            <button type="button" className={tab === 'friends' ? 'ph-on' : ''} onClick={() => setTab('friends')}>
              <PeopleGlyph size={22} />
              Friends
            </button>
            <button type="button" onClick={() => setScreen('create')} aria-label="Create">
              <span className="ph-tt-plate"><span><PlusGlyph size={17} /></span></span>
            </button>
            <button type="button" className={tab === 'inbox' ? 'ph-on' : ''} onClick={() => setTab('inbox')}>
              <span className="ph-wrap">
                <BubbleGlyph size={22} />
                {unread > 0 && <span className="ph-tt-dot" aria-hidden="true" />}
              </span>
              Inbox
            </button>
            <button type="button" className={tab === 'profile' ? 'ph-on' : ''} onClick={() => setTab('profile')}>
              <YouGlyph size={22} filled={tab === 'profile'} />
              Profile
            </button>
          </div>
        </>
      )}

      {toast && <div className="ph-toast">{toast}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The feed, which is the whole screen
// ---------------------------------------------------------------------------

/** The lanes along the top of the feed, in the order the app puts them. */
const LANES = ['explore', 'following', 'foryou'] as const;
type Lane = (typeof LANES)[number];
const LANE_NAME: Record<Lane, string> = {
  explore: 'Explore',
  following: 'Following',
  foryou: 'For You',
};

function Player({
  lane, setLane, now, onWho, onOpen, onSearch, onLive, say,
}: {
  lane: Lane;
  setLane: (lane: Lane) => void;
  now: number;
  onWho: (id: string) => void;
  onOpen: (id: string) => void;
  onSearch: () => void;
  onLive: () => void;
  say: (text: string) => void;
}) {
  const { run } = useGame();
  const forYou = useWorld((s) => homeFeed(s, CLIP_PLATFORM, 40));
  const following = useWorld((s) => followingFeed(s, CLIP_PLATFORM, 40));
  const explore = useWorld((s) => exploreFeed(s, CLIP_PLATFORM, 40));
  const top = useWorld((s) => searchSocial(s, CLIP_PLATFORM, '').items[0]);
  const clips = lane === 'following' ? following : lane === 'explore' ? explore : forYou;
  /** The video fits the frame, or fills it. The app calls the second full screen. */
  const [filled, setFilled] = useState(false);
  const [at, setAt] = useState(0);
  const clip = clips[Math.min(at, Math.max(0, clips.length - 1))];
  const profile = useWorld((s) => (clip ? profileById(s, clip.profileId) : undefined));
  const followed = useWorld((s) => (profile ? isFollowing(s, s.player.id, profile.id) : false));
  const hidden = useWorld((s) => settingsOf(s).hideCounts);

  const next = () => {
    const result = run<{ note: string }>('feed.scroll', { platform: CLIP_PLATFORM, minutes: 9 }, { silent: true });
    if (result.ok) say(`Nine minutes of it. ${result.value!.note}`);
    setAt((n) => (clips.length > 0 ? (n + 1) % clips.length : 0));
  };
  const act = (kind: string, message?: string) => {
    if (!clip) return;
    const result = run(kind, { itemId: clip.id }, { silent: true });
    if (!result.ok) say(result.error ?? 'That did not work.');
    else if (message) say(message);
  };
  const count = (n: number) => (hidden ? '' : views(n));

  return (
    <div className="ph-tt">
      <div className="ph-tt-top">
        <button type="button" className="ph-tt-live" onClick={onLive} aria-label="Go Live">
          <LiveGlyph size={17} />
        </button>
        {LANES.map((one) => (
          <button
            key={one}
            type="button"
            className={lane === one ? 'ph-on' : ''}
            onClick={() => setLane(one)}
          >
            {LANE_NAME[one]}
          </button>
        ))}
        <button type="button" className="ph-side ph-right" onClick={onSearch} aria-label="Search">
          <SearchGlyph size={21} />
        </button>
      </div>

      {!clip || !profile ? (
        <p className="ph-empty" style={{ margin: 'auto', color: '#fff' }}>
          <b>Nothing To Play</b>
          {lane === 'following' ? 'Follow a few accounts and this fills up.' : 'Nothing here yet.'}
        </p>
      ) : (
        <>
          <button
            type="button"
            className={`ph-tt-stage${filled ? '' : ' ph-fit'}`}
            onClick={next}
            aria-label="Next Clip"
            style={{ background: clip.images?.[0] ? '#000' : look(clip.id) }}
          >
            {clip.images?.[0] && <img src={clip.images[0]} alt="" />}
          </button>
          <button
            type="button"
            className="ph-tt-fill"
            onClick={() => setFilled((v) => !v)}
          >
            <DeviceGlyph size={15} />
            {filled ? 'Fit To Screen' : 'Full Screen'}
          </button>

          <div className="ph-tt-rail">
            <button type="button" onClick={() => onWho(profile.id)} aria-label={profile.name}>
              <span className="ph-tt-avatar">
                <Avatar name={profile.name} size={44} image={profile.avatarImage} />
                {!followed && <span className="ph-tt-plus" aria-hidden="true"><PlusGlyph size={11} /></span>}
              </span>
            </button>
            <button type="button" onClick={() => act('feed.like')} aria-label={clip.liked ? 'Unlike' : 'Like'}>
              <HeartGlyph size={30} filled={clip.liked} />
              {count(clip.likes)}
            </button>
            <button type="button" onClick={() => onOpen(clip.id)} aria-label="Comments">
              <BubbleGlyph size={28} />
              {count(clip.comments)}
            </button>
            <button
              type="button"
              onClick={() => act('feed.bookmark', clip.saved ? 'Taken out of your saved.' : 'Saved.')}
              aria-label={clip.saved ? 'Remove From Saved' : 'Save'}
            >
              <BookmarkGlyph size={27} filled={clip.saved} />
              {count(Math.round(clip.likes * 0.08))}
            </button>
            <button
              type="button"
              onClick={() => act('feed.repost', clip.reposted ? 'Taken off your page.' : 'Reposted to your page.')}
              aria-label={clip.reposted ? 'Undo Repost' : 'Repost'}
            >
              <ArrowShareGlyph size={28} />
              {count(clip.reposts)}
            </button>
            <span className="ph-tt-disc" aria-hidden="true"><NoteGlyph size={16} /></span>
          </div>

          <div className="ph-tt-foot">
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <b>@{profile.handle}</b>
              {profile.verified && <span className="ph-tick" style={{ marginLeft: 5 }} aria-label="Verified"><TickGlyph /></span>}
              <button
                type="button"
                className={`ph-tt-follow${followed ? ' ph-on' : ''}`}
                onClick={() => {
                  const result = run(followed ? 'feed.unfollow' : 'feed.follow', { profileId: profile.id }, { silent: true });
                  if (result.ok) say(followed ? `You no longer follow @${profile.handle}.` : `Following @${profile.handle}.`);
                }}
              >
                {followed ? 'Following' : 'Follow'}
              </button>
            </span>
            <p>{clip.text}</p>
            <span className="ph-tt-sound">
              <NoteGlyph size={13} />
              {clip.sound ?? 'original sound'} · {ago(now, clip.at)}
            </span>
          </div>

          <button type="button" className="ph-tt-searchbar" onClick={onSearch}>
            <SearchGlyph size={16} />
            <span>Search{top ? ` · ${(top.text.split('\n')[0] ?? '').slice(0, 34)}` : ''}</span>
            <ChevronRightGlyph size={15} />
          </button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// One clip, and what was said under it
// ---------------------------------------------------------------------------

function ClipPage({
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
        <b style={{ fontSize: 15 }}>{tally(item.comments, 'comment')}</b>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-body">
        <button type="button" className="ph-dm-row" onClick={() => profile && onWho(profile.id)}>
          <Avatar name={profile?.name ?? '?'} size={40} image={profile?.avatarImage} />
          <span className="ph-dm-text">
            <b>@{profile?.handle}</b>
            <small>{item.sound ?? 'original sound'} · {ago(now, item.at)}</small>
          </span>
        </button>
        <p className="ph-post-caption" style={{ paddingBottom: 8 }}>{item.text}</p>
        <div className="ph-sep" />
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
          <input className="ph-input" value={text} placeholder="Add comment..." onChange={(e) => setText(e.target.value)} />
          <button type="button" className="ph-btn-solid" disabled={text.trim().length === 0} onClick={send}>Post</button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// The studio
// ---------------------------------------------------------------------------

/** The three medal tints, written out rather than built, so a checker can see them. */
const MEDALS = [' ph-m1', ' ph-m2', ' ph-m3'];

/** The card behind each activity, in the order the carousel steps through them. */
const ACTIVITY_TINTS = ['ph-a0', 'ph-a1', 'ph-a2'];

/** One of the round tools along the studio's shelf. */
const TOOLS = [
  { key: 'rewards', label: 'Creator Rewards', glyph: SparkleGlyph },
  { key: 'shop', label: 'Shop For Seller', glyph: CartGlyph },
  { key: 'market', label: 'Creator Marketplace', glyph: RocketGlyph },
  { key: 'subs', label: 'Subscription', glyph: TickGlyph },
  { key: 'gifts', label: 'Gifting', glyph: HeartGlyph },
] as const;

/**
 * The creator studio: what your clips did, what is moving, and what pays.
 *
 * The trends here are counted off this save's own posts. They are not real
 * world headlines and nothing is fetched from anywhere, which is why they read
 * like the world you are living in rather than the one outside the window.
 */
function StudioPage({
  onBack, onLive, say,
}: { onBack: () => void; onLive: () => void; say: (text: string) => void }) {
  const mine = useWorld((s) => myProfile(s, CLIP_PLATFORM));
  const stats = useWorld((s) => (mine ? socialAnalytics(s, mine.id) : undefined));
  const week = useWorld((s) => (mine
    ? catalogOf(s, mine).filter((one) => one.at > s.now - 7 * 24 * 60 * 60 * 1000)
    : []));
  const hot = useWorld((s) => trends(s, 11));
  const [chip, setChip] = useState<'topics' | 'posts' | 'creators' | 'searches'>('topics');
  const [card, setCard] = useState(0);

  const weekLikes = week.reduce((sum, one) => sum + one.likes, 0);
  const change = (now: number, was: number) => (was === 0 ? (now > 0 ? 100 : 0) : Math.round(((now - was) / was) * 100));

  return (
    <>
      <div className="ph-tt-studiotop">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph size={20} /></button>
        <b>Creator Studio</b>
        <button
          type="button"
          className="ph-iconbtn"
          aria-label="Studio Settings"
          onClick={() => say('What the studio shows is counted off your own posts in this save. There is nothing to configure.')}
        >
          <GearGlyph size={20} />
        </button>
      </div>

      <div className="ph-tt-page ph-tt-studio">
        <div className="ph-tt-card">
          <div className="ph-tt-card-head">
            <b>Analytics</b>
            <ChevronRightGlyph size={16} />
          </div>
          <div className="ph-tt-figures">
            <span>
              <i>Post Views</i>
              <b>{views(stats?.impressions ?? 0)}</b>
              <small>{change(week.length, 0)}% 7d</small>
            </span>
            <span>
              <i>Net Followers</i>
              <b>{views(mine?.followers ?? 0)}</b>
              <small>{change(mine?.followers ?? 0, mine?.followers ?? 0)}% 7d</small>
            </span>
            <span>
              <i>Likes</i>
              <b>{views(stats?.likes ?? 0)}</b>
              <small>{change(weekLikes, (stats?.likes ?? 0) - weekLikes)}% 7d</small>
            </span>
          </div>
        </div>

        <div className="ph-tt-card">
          <div className="ph-tt-card-head">
            <b>Inspiration</b>
            <ChevronRightGlyph size={16} />
          </div>
          <div className="ph-tt-chips">
            {(['topics', 'posts', 'creators', 'searches'] as const).map((one) => (
              <button
                key={one}
                type="button"
                className={chip === one ? 'ph-on' : ''}
                onClick={() => setChip(one)}
              >
                {one === 'topics' ? 'Topics' : one === 'posts' ? 'Posts' : one === 'creators' ? 'Creators' : 'Searches'}
              </button>
            ))}
          </div>
          <ol className="ph-tt-ranks">
            {hot.map((one, index) => (
              <li key={one.topic}>
                <span className={`ph-tt-rank${MEDALS[index] ?? ''}`}>{index + 1}</span>
                <span className="ph-tt-rank-name">{one.label}</span>
                <span className="ph-tt-rank-heat"><SparkleGlyph size={13} />{views(one.posts)}</span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="ph-tt-wide"
            onClick={() => say('This is what has actually been posted in your world over the last two days. It is not a real world headline and nothing was fetched.')}
          >
            Get More Inspiration
          </button>
        </div>

        <div className="ph-tt-card">
          <div className="ph-tt-card-head">
            <b>Monetization</b>
            <ChevronRightGlyph size={16} />
          </div>
          <div className="ph-tt-promos">
            <div className="ph-tt-promo ph-sand">
              <SparkleGlyph size={22} />
              <b>Video Gifts</b>
              <p>What people send while you are live is paid out on the month.</p>
              <button type="button" onClick={onLive}>Go Live</button>
            </div>
            <div className="ph-tt-promo ph-rose">
              <MusicGlyph size={22} />
              <b>Work With Sounds</b>
              <p>A clip cut to a sound that is moving reaches further than one that is not.</p>
              <button type="button" onClick={() => say('Pick a sound in the camera. What is moving is on the Inspiration list above.')}>Learn More</button>
            </div>
          </div>
          <div className="ph-tt-tools">
            {TOOLS.map((one) => {
              const Glyph = one.glyph;
              return (
                <button
                  key={one.key}
                  type="button"
                  onClick={() => say(`${one.label} opens once you pass ${plural(CLIP_FLOOR, 'follower')}. You have ${views(mine?.followers ?? 0)}.`)}
                >
                  <span className="ph-tt-tool-ring"><Glyph size={20} /></span>
                  {one.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="ph-tt-wide"
            onClick={() => say(`The app pays on views that stayed past a minute once you pass ${plural(CLIP_FLOOR, 'follower')}, plus whatever was sent while you were live.`)}
          >
            More Ways To Get Paid
          </button>
        </div>

        <div className="ph-tt-card">
          <div className="ph-tt-card-head"><b>More Tools</b></div>
          <div className="ph-tt-grid2">
            <button type="button" onClick={() => say(mine ? 'Nothing you have posted has been taken down, and nothing is held against the account.' : 'Make an account first.')}>
              <AccountGlyph size={19} />Account Check
            </button>
            <button type="button" onClick={() => say('The channel is tied to the account that carries the money, and nothing else is linked.')}>
              <ShieldGlyph size={19} />Linked Accounts
            </button>
            <button type="button" onClick={() => say('SLATE does not sell reach. A clip goes as far as it goes.')}>
              <SparkleGlyph size={19} />Promote
            </button>
            <button type="button" onClick={() => say(`You have ${views(mine?.followers ?? 0)} following you. The floor for the fund is ${plural(CLIP_FLOOR, 'follower')}.`)}>
              <TickGlyph size={17} />Benefits
            </button>
          </div>
        </div>

        <div className="ph-tt-card">
          <div className="ph-tt-card-head">
            <b>Activities</b>
            <ChevronRightGlyph size={16} />
          </div>
          <button
            type="button"
            className={`ph-tt-activity ${ACTIVITY_TINTS[card % 3]}`}
            onClick={() => setCard((n) => n + 1)}
            aria-label="Next Activity"
          >
            <b>{['Post Where You Actually Went', 'Cut To A Sound That Is Moving', 'Answer The Ones Who Turned Up'][card % 3]}</b>
          </button>
          <div className="ph-tt-dots" aria-hidden="true">
            {[0, 1, 2].map((one) => <i key={one} className={one === card % 3 ? 'ph-on' : ''} />)}
          </div>
          <p className="ph-tt-activity-note">
            {[
              'A clip shot somewhere you have really been does better than one that was not.',
              'The sounds on the Inspiration list are the ones carrying reach this week.',
              'Replying to the first hundred comments is worth more than the next clip.',
            ][card % 3]}
          </p>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Friends
// ---------------------------------------------------------------------------

/**
 * The people you know, and whether you follow them here.
 *
 * The app fills this from a phone's contacts. SLATE has no contacts to read and
 * would not read them if it did, so this is the people who are actually in your
 * life in this world: family, the ones you work with, the ones you know. That is
 * the honest equivalent, and it is the only list the game could truthfully show.
 */
function FriendsPage({ onWho, say }: { onWho: (id: string) => void; say: (text: string) => void }) {
  const { run } = useGame();
  const [dropped, setDropped] = useState<string[]>([]);
  const posted = useWorld((s) => followingFeed(s, CLIP_PLATFORM, 12).length);
  const suggestions = useWorld((s) => Object.values(s.universe.socialProfiles)
    .filter((one) => one.platform === CLIP_PLATFORM
      && !one.ownerId
      && !isFollowing(s, s.player.id, one.id))
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 12));
  const shown = suggestions.filter((one) => !dropped.includes(one.id));

  return (
    <div className="ph-tt-friends">
      <div className="ph-tt-friends-top">
        <span className="ph-tt-friends-add" aria-hidden="true"><PlusGlyph size={13} /></span>
        <span className="ph-tt-friends-pill">
          {posted > 0 ? `${tally(posted, 'new post')} from people you follow` : 'Your friends haven’t posted anything yet'}
        </span>
        <SearchGlyph size={21} />
      </div>
      <div className="ph-tt-page ph-tt-friends-body">
        <h2>Follow your friends to watch their videos</h2>

        <div className="ph-tt-friend">
          <span className="ph-tt-contacts" aria-hidden="true"><CallGlyph size={26} /></span>
          <span className="ph-tt-friend-text">
            <b>Contacts</b>
            <small>Nothing on your machine is read</small>
          </span>
          <button
            type="button"
            className="ph-tt-find"
            onClick={() => say('SLATE never opens your real contacts. The people here are the ones in your life inside this world.')}
          >
            Find
          </button>
        </div>

        {shown.length === 0 && <p className="ph-empty">Nobody left to follow here.</p>}
        {shown.map((one) => (
          <div key={one.id} className="ph-tt-friend">
            <button type="button" className="ph-iconbtn" onClick={() => onWho(one.id)} aria-label={one.name}>
              <Avatar name={one.name} size={54} image={one.avatarImage} />
            </button>
            <span className="ph-tt-friend-text">
              <b>{one.name}</b>
              <small>{views(one.followers)} followers</small>
            </span>
            <span className="ph-tt-friend-buttons">
              <button type="button" className="ph-tt-remove" onClick={() => setDropped((all) => [...all, one.id])}>
                Remove
              </button>
              <button
                type="button"
                className="ph-tt-follow-btn"
                onClick={() => {
                  const result = run('feed.follow', { profileId: one.id }, { silent: true });
                  say(result.ok ? `Following @${one.handle}.` : result.error ?? 'That did not work.');
                }}
              >
                Follow
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * The search page, with what you have looked for and what is moving.
 *
 * What is trending is counted off what has actually been posted in this save
 * over the last couple of days. Nothing here is a real world headline and
 * nothing is fetched.
 */
function SearchPage({
  onBack, onOpen, onWho,
}: { onBack: () => void; onOpen: (id: string) => void; onWho: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [asked, setAsked] = useState<string[]>([]);
  const [all, setAll] = useState(false);
  const [seed, setSeed] = useState(0);
  const found = useWorld((s) => searchSocial(s, CLIP_PLATFORM, query));
  const hot = useWorld((s) => trends(s, 14));
  const sounds = useWorld((s) => Object.values(s.universe.socialItems)
    .filter((i) => i.platform === CLIP_PLATFORM && i.sound)
    .map((i) => i.sound!)
    .filter((one, at, list) => list.indexOf(one) === at)
    .slice(0, 3));

  const ask = (text: string) => {
    const term = text.trim();
    if (term.length === 0) return;
    setQuery(term);
    setAsked((old) => [term, ...old.filter((one) => one !== term)].slice(0, 8));
  };

  const recent = [...asked.map((one) => ({ text: one, sound: false })),
    ...sounds.map((one) => ({ text: one, sound: true }))];
  const maybe = hot.slice(seed % 4, (seed % 4) + 4);

  return (
    <>
      <div className="ph-tt-searchtop">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph size={20} /></button>
        <span className="ph-tt-field">
          <SearchGlyph size={17} />
          <input
            value={query}
            placeholder="Search"
            aria-label="Search"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') ask(query); }}
          />
          <MusicGlyph size={17} />
        </span>
        <button type="button" className="ph-tt-search-go" onClick={() => ask(query)}>Search</button>
      </div>

      <div className="ph-tt-page">
        {query.trim().length >= 2 ? (
          <>
            {found.profiles.map((one) => (
              <button key={one.id} type="button" className="ph-dm-row" onClick={() => onWho(one.id)}>
                <Avatar name={one.name} size={40} image={one.avatarImage} />
                <span className="ph-dm-text">
                  <b>@{one.handle}</b>
                  <small>{one.name} · {views(one.followers)} followers</small>
                </span>
              </button>
            ))}
            {found.items.length > 0 && <div className="ph-section-head">Clips</div>}
            <Grid items={found.items} onOpen={onOpen} />
            {found.profiles.length === 0 && found.items.length === 0 && <p className="ph-empty">Nothing for that.</p>}
          </>
        ) : (
          <>
            {(all ? recent : recent.slice(0, 5)).map((one) => (
              <div key={one.text} className="ph-tt-recent">
                <span className="ph-tt-recent-mark" aria-hidden="true">
                  {one.sound ? <MusicGlyph size={17} /> : <ClockGlyph size={17} />}
                </span>
                <button type="button" className="ph-tt-recent-go" onClick={() => ask(one.text)}>{one.text}</button>
                <button
                  type="button"
                  className="ph-tt-recent-x"
                  aria-label={`Forget ${one.text}`}
                  onClick={() => setAsked((old) => old.filter((x) => x !== one.text))}
                >
                  <CloseGlyph size={15} />
                </button>
              </div>
            ))}
            {recent.length === 0 && <p className="ph-tt-nothing">You have not searched for anything yet.</p>}
            {recent.length > 5 && (
              <button type="button" className="ph-tt-more" onClick={() => setAll((v) => !v)}>
                {all ? 'See Less' : 'See More'}<DownGlyph size={13} />
              </button>
            )}

            <div className="ph-tt-sechead">
              <b>You May Like</b>
              <button type="button" onClick={() => setSeed((n) => n + 1)}>
                <HistoryGlyph size={15} />Refresh
              </button>
            </div>
            {maybe.map((one, index) => (
              <button
                key={one.topic}
                type="button"
                className={`ph-tt-guess${index < 2 ? ' ph-hot' : ''}`}
                onClick={() => ask(one.label)}
              >
                <i aria-hidden="true" />{one.label}
              </button>
            ))}

            <div className="ph-tt-sechead"><b>Trending Searches</b></div>
            {hot.slice(0, 6).map((one, index) => (
              <button
                key={one.topic}
                type="button"
                className={`ph-tt-trend${index === 0 ? ' ph-lit' : ''}`}
                onClick={() => ask(one.label)}
              >
                <i aria-hidden="true" />
                {one.label}
                {index === 0 && <SparkleGlyph size={14} />}
                <small>{views(one.posts)} posts</small>
              </button>
            ))}
          </>
        )}
      </div>
    </>
  );
}

function Grid({
  items, onOpen, draft,
}: { items: SocialItem[]; onOpen: (id: string) => void; draft?: boolean }) {
  return (
    <div className="ph-tt-grid">
      {draft && items.length > 0 && (
        <span className="ph-tt-cell ph-tt-draft" aria-hidden="true" style={{ background: look(`${items[0]!.id}:draft`) }}>
          <b>Drafts: {items.length}</b>
        </span>
      )}
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="ph-tt-cell"
          onClick={() => onOpen(item.id)}
          aria-label={item.text.slice(0, 40)}
          style={{ background: item.images?.[0] ? '#000' : look(item.id) }}
        >
          {item.images?.[0] && <img src={item.images[0]} alt="" />}
          <i>{views(item.likes)}</i>
          <span>{item.text.split('\n')[0]}</span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inbox
// ---------------------------------------------------------------------------

/** The four colored rows the inbox opens with, each one a real count. */
interface Bucket {
  key: string; label: string; body: string; tint: string;
  glyph: React.ReactNode; count: number; dot: boolean;
}

function InboxPage({
  now, mine, onOpen, onWho,
}: {
  now: number; mine: SocialProfile | undefined;
  onOpen: (id: string) => void; onWho: (id: string) => void;
}) {
  const items = useWorld((s) => (mine ? catalogOf(s, mine) : []));
  const followers = useWorld((s) => (mine ? followersOf(s, mine.id) : []));
  const profiles = useWorld((s) => s.universe.socialProfiles);
  const settings = useWorld((s) => settingsOf(s));
  const saved = useWorld((s) => Object.values(s.universe.socialItems).filter((one) => one.saved).length);
  const [open, setOpenBucket] = useState<string | null>(null);

  if (!mine) return <p className="ph-empty"><b>Nothing Yet</b>Make an account and this fills up.</p>;

  const newest = followers[0];
  const newestWho = newest?.byProfileId ? profiles[newest.byProfileId] : undefined;
  const loudest = items[0];

  const buckets: Bucket[] = [
    {
      key: 'followers',
      label: 'New Followers',
      body: newestWho ? `${newestWho.name} started following you.` : 'Nobody new yet.',
      tint: 'ph-blue-tile',
      glyph: <PeopleGlyph size={22} />,
      count: followers.length,
      dot: followers.length > 0,
    },
    {
      key: 'activity',
      label: 'Activity',
      body: loudest
        ? `${tally(loudest.likes, 'like')} and ${tally(loudest.comments, 'comment')} on your last clip.`
        : 'Post something and see what comes back.',
      tint: 'ph-pink-tile',
      glyph: <HeartGlyph size={22} filled />,
      count: items.reduce((sum, one) => sum + one.comments, 0),
      dot: items.length > 0,
    },
    {
      key: 'saved',
      label: 'Saved',
      body: saved > 0 ? `${tally(saved, 'clip')} kept to come back to.` : 'The bookmark under a clip keeps it here.',
      tint: 'ph-orange-tile',
      glyph: <BookmarkGlyph size={22} filled />,
      count: saved,
      dot: false,
    },
    {
      key: 'system',
      label: 'System Notifications',
      body: settings.notificationsOn
        ? 'Nothing from the app is being held back from you.'
        : 'Notifications are off. It all still happens, and it is all still here.',
      tint: 'ph-navy-tile',
      glyph: <InfoGlyph size={22} />,
      count: 0,
      dot: !settings.notificationsOn,
    },
  ];

  return (
    <>
      <div className="ph-tt-inboxtop">
        <span className="ph-iconbtn" aria-hidden="true"><AddPersonGlyph size={22} /></span>
        <span className="ph-tt-inbox-title">
          <b>Inbox</b>
          <i className={settings.notificationsOn ? 'ph-on' : ''} aria-hidden="true" />
          <DownGlyph size={12} />
        </span>
        <span className="ph-iconbtn" aria-hidden="true"><SearchGlyph size={21} /></span>
      </div>

      <div className="ph-tt-page ph-tt-inbox">
        <div className="ph-tt-stories">
          <span className="ph-tt-story">
            <span className="ph-tt-story-ring ph-make">
              <Avatar name={mine.name} size={62} image={mine.avatarImage} />
              <i className="ph-tt-story-plus" aria-hidden="true"><PlusGlyph size={12} /></i>
            </span>
            <small>Create</small>
          </span>
          <span className="ph-tt-story">
            <span className="ph-tt-story-ring ph-locked"><LockGlyph size={22} /></span>
            <small>On This Day</small>
          </span>
          {followers.slice(0, 6).map((follow) => {
            const who = follow.byProfileId ? profiles[follow.byProfileId] : undefined;
            if (!who) return null;
            return (
              <button key={follow.id} type="button" className="ph-tt-story" onClick={() => onWho(who.id)}>
                <span className="ph-tt-story-ring"><Avatar name={who.name} size={62} image={who.avatarImage} /></span>
                <small>{who.handle}</small>
              </button>
            );
          })}
        </div>

        {buckets.map((one) => (
          <button
            key={one.key}
            type="button"
            className="ph-tt-bucket"
            onClick={() => setOpenBucket((was) => (was === one.key ? null : one.key))}
          >
            <span className={`ph-tt-tile ${one.tint}`}>{one.glyph}</span>
            <span className="ph-tt-bucket-text">
              <b>{one.label}</b>
              <small>{one.body}</small>
            </span>
            {one.count > 0 && <span className="ph-tt-badge">{one.count > 99 ? '99+' : one.count}</span>}
            {one.count === 0 && one.dot && <span className="ph-tt-reddot" aria-hidden="true" />}
          </button>
        ))}

        {open === 'followers' && followers.slice(0, 12).map((follow) => {
          const who = follow.byProfileId ? profiles[follow.byProfileId] : undefined;
          return (
            <button key={follow.id} type="button" className="ph-dm-row" onClick={() => who && onWho(who.id)}>
              <Avatar name={who?.name ?? '?'} size={44} image={who?.avatarImage} />
              <span className="ph-dm-text">
                <b>@{who?.handle ?? 'someone'}</b>
                <small>Started following you · {ago(now, follow.since)}</small>
              </span>
            </button>
          );
        })}

        {open === 'activity' && items.map((item) => (
          <button key={item.id} type="button" className="ph-dm-row" onClick={() => onOpen(item.id)}>
            <span className="ph-iconbtn" style={{ color: 'var(--ph-red)' }}><HeartGlyph size={22} filled /></span>
            <span className="ph-dm-text">
              <b>{tally(item.likes, 'like')}, {tally(item.comments, 'comment')}</b>
              <small>{item.text.slice(0, 46)} · {ago(now, item.at)}</small>
            </span>
            <span className="ph-tt-thumb" aria-hidden="true" style={{ background: look(item.id) }} />
          </button>
        ))}

        {open === 'saved' && <p className="ph-empty">Saved clips are on your own page, behind the bookmark tab.</p>}
        {open === 'system' && (
          <p className="ph-empty">
            <b>Nothing From The App</b>
            SLATE does not write to you. Everything in here came from somebody in this world.
          </p>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// A profile
// ---------------------------------------------------------------------------

/** The five shelves along a profile, in the app's own order. */
const SHELVES = [
  { key: 'posts', label: 'Posts', glyph: BarsGlyph },
  { key: 'private', label: 'Private', glyph: LockGlyph },
  { key: 'reposts', label: 'Reposts', glyph: RepostGlyph },
  { key: 'saved', label: 'Saved', glyph: BookmarkGlyph },
  { key: 'liked', label: 'Liked', glyph: HeartGlyph },
] as const;

function ProfilePage({
  profile, now, onBack, onOpen, onSettings, onFollowers, onSaved, onLive, onStudio, say,
}: {
  profile: SocialProfile; now: number; onBack?: () => void;
  onOpen: (id: string) => void; onSettings: () => void; onFollowers: () => void;
  onSaved: () => void; onLive: () => void; onStudio?: () => void; say: (text: string) => void;
}) {
  const { run } = useGame();
  const items = useWorld((s) => catalogOf(s, profile));
  const following = useWorld((s) => isFollowing(s, s.player.id, profile.id));
  const own = useWorld((s) => profile.ownerId === s.player.id);
  const stats = useWorld((s) => socialAnalytics(s, profile.id));
  const settings = useWorld((s) => settingsOf(s));
  const saved = useWorld((s) => Object.values(s.universe.socialItems)
    .filter((one) => one.saved && one.platform === CLIP_PLATFORM)
    .map((one) => itemById(s, one.id))
    .filter((one): one is SocialItem => Boolean(one)));
  const liked = useWorld((s) => Object.values(s.universe.socialItems)
    .filter((one) => one.liked && one.platform === CLIP_PLATFORM)
    .map((one) => itemById(s, one.id))
    .filter((one): one is SocialItem => Boolean(one)));
  const [editing, setEditing] = useState(false);
  const [shelf, setShelf] = useState<(typeof SHELVES)[number]['key']>('posts');
  const likes = items.reduce((sum, item) => sum + item.likes, 0);
  void now;

  const shown = shelf === 'posts' ? items : shelf === 'saved' ? saved : shelf === 'liked' ? liked : [];

  return (
    <>
      <div className="ph-tt-proftop">
        {onBack
          ? <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph size={20} /></button>
          : <span className="ph-tt-proftile" aria-hidden="true"><NoteGlyph size={15} /></span>}
        <span className="ph-tt-profname">
          {own && settings.privateAccount && <LockGlyph size={14} />}
          <b>{profile.handle}</b>
          <DownGlyph size={14} />
          {own && items.length > 0 && <i className="ph-tt-namedot" aria-hidden="true" />}
        </span>
        <span className="ph-tt-profright">
          {own && onStudio && (
            <button type="button" className="ph-iconbtn" onClick={onStudio} aria-label="Creator Studio">
              <InsightGlyph size={20} />
            </button>
          )}
          {own
            ? <button type="button" className="ph-iconbtn" onClick={onSettings} aria-label="Settings And Privacy"><MenuGlyph size={20} /></button>
            : <button type="button" className="ph-iconbtn" onClick={() => say('Nothing more in here.')} aria-label="More"><MenuGlyph size={20} /></button>}
        </span>
      </div>

      {own && settings.privateAccount && (
        <div className="ph-tt-private"><LockGlyph size={15} />Private Account</div>
      )}

      <div className="ph-tt-page ph-tt-profile">
        <div className="ph-tt-face">
          {own && profile.note && <span className="ph-tt-thought">{profile.note}</span>}
          <span className="ph-tt-face-mark">
            <Avatar name={profile.name} size={96} image={profile.avatarImage} />
            {own && <i className="ph-tt-face-plus" aria-hidden="true"><PlusGlyph size={14} /></i>}
          </span>
        </div>
        <div className="ph-tt-handle">@{profile.handle}</div>

        <div className="ph-tt-counts">
          <span><b>{views(profile.following)}</b><small>Following</small></span>
          <button type="button" onClick={own ? onFollowers : undefined}>
            <b>{views(profile.followers)}</b><small>Followers</small>
          </button>
          <span><b>{views(likes)}</b><small>Likes</small></span>
        </div>

        <div className="ph-tt-profbuttons">
          {own ? (
            <>
              <button type="button" onClick={() => setEditing((v) => !v)}>Edit Profile</button>
              <button
                type="button"
                onClick={() => say(`Your page is @${profile.handle}. Anybody in this world can find it; nothing about it leaves the game.`)}
              >
                Share Profile
              </button>
              <button type="button" className="ph-square" aria-label="Find People" onClick={onLive}>
                <AddPersonGlyph size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={following ? '' : 'ph-primary'}
                onClick={() => {
                  const result = run(following ? 'feed.unfollow' : 'feed.follow', { profileId: profile.id }, { silent: true });
                  if (result.ok) say(following ? `You no longer follow @${profile.handle}.` : `Following @${profile.handle}.`);
                }}
              >
                {following ? 'Following' : 'Follow'}
              </button>
              <button
                type="button"
                onClick={() => say(`@${profile.handle} posts every ${profile.cadenceDays === 1 ? 'day' : `${profile.cadenceDays} days`}.`)}
              >
                About
              </button>
            </>
          )}
        </div>

        {own && (
          <div className="ph-tt-profchips">
            {!profile.bio && (
              <button type="button" className="ph-tt-chip" onClick={() => setEditing(true)}>+ Add Bio</button>
            )}
            <button type="button" className="ph-tt-orders" onClick={onSaved}>
              <BookmarkGlyph size={15} filled />Your Saved
            </button>
          </div>
        )}
        {profile.bio && <p className="ph-tt-bio">{profile.bio}</p>}

        {editing && own && <EditProfile profile={profile} onDone={() => setEditing(false)} say={say} />}

        {own && (
          <p className="ph-tt-floor">
            {stats.monetized
              ? 'The app is paying on the views that stayed past a minute.'
              : `${views(Math.max(0, CLIP_FLOOR - profile.followers))} more followers and the app starts paying.`}
          </p>
        )}

        <div className="ph-tt-shelves">
          {SHELVES.map((one) => {
            const Glyph = one.glyph;
            if (!own && one.key !== 'posts' && one.key !== 'reposts') return null;
            return (
              <button
                key={one.key}
                type="button"
                className={shelf === one.key ? 'ph-on' : ''}
                onClick={() => setShelf(one.key)}
                aria-label={one.label}
              >
                <Glyph size={19} filled={shelf === one.key} />
              </button>
            );
          })}
        </div>

        {shelf === 'private' && <p className="ph-empty">Nothing here is hidden from anybody.</p>}
        {shelf === 'reposts' && <p className="ph-empty">Reposts show on the page you reposted them to.</p>}
        {(shelf === 'posts' || shelf === 'saved' || shelf === 'liked') && (
          shown.length === 0
            ? <p className="ph-empty">{shelf === 'posts' ? 'Nothing posted yet.' : 'Nothing here yet.'}</p>
            : <Grid items={shown} onOpen={onOpen} draft={own && shelf === 'posts'} />
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
  const [image, setImage] = useState<string | undefined>(profile.avatarImage);
  return (
    <div className="ph-panel">
      <div className="ph-label">Picture</div>
      <ImagePicker frame="avatar" image={image} label="Your Profile Picture" onChange={setImage} />
      <div className="ph-label">Name</div>
      <input className="ph-input" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="ph-label">Bio</div>
      <input className="ph-input" value={bio} maxLength={80} onChange={(e) => setBio(e.target.value)} />
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

function MakeAccount({ say }: { say: (text: string) => void }) {
  const { run } = useGame();
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  return (
    <div className="ph-tt-page">
      <div className="ph-panel">
        <b style={{ fontSize: 16 }}>Make Your Account</b>
        <p className="ph-card-meta">
          An account on the short video app. It pays once ten thousand people follow you, and it
          pays on the views that stayed past a minute rather than the ones that scrolled by.
        </p>
        <div className="ph-label">Handle</div>
        <input className="ph-input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourname" />
        <div className="ph-label">Name</div>
        <input className="ph-input" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="ph-label">Bio</div>
        <input className="ph-input" value={bio} maxLength={80} onChange={(e) => setBio(e.target.value)} />
        <div className="ph-actions">
          <button
            type="button"
            className="ph-btn-solid"
            onClick={() => {
              const result = run('feed.create_profile', { platform: CLIP_PLATFORM, handle, name, bio }, { silent: true });
              say(result.ok ? 'That is your account.' : result.error ?? 'That did not work.');
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
// Making one
// ---------------------------------------------------------------------------

/** The strip along the bottom of the camera, in the app's own order. */
const MODES = [
  { key: '10m', label: '10m', seconds: 600 },
  { key: '60s', label: '60s', seconds: 60 },
  { key: '15s', label: '15s', seconds: 15 },
  { key: 'photo', label: 'Photo', seconds: 0 },
  { key: 'text', label: 'Text', seconds: 0 },
] as const;

function CreateSheet({
  onClose, say, hasProfile,
}: { onClose: () => void; say: (text: string) => void; hasProfile: boolean }) {
  const { run } = useGame();
  const now = useWorld((s) => s.now);
  const [text, setText] = useState('');
  const [cover, setCover] = useState<string | undefined>();
  const [seconds, setSeconds] = useState(30);
  const [effort, setEffort] = useState(70);
  const [later, setLater] = useState(false);
  const [days, setDays] = useState(1);
  /** The camera comes first, the way the app opens. The shutter opens the editor. */
  const [inCamera, setInCamera] = useState(true);
  const [mode, setMode] = useState<(typeof MODES)[number]['key']>('60s');
  const [beauty, setBeauty] = useState(true);
  const sounds = useWorld((s) => Object.values(s.universe.socialItems)
    .filter((i) => i.platform === CLIP_PLATFORM && i.sound)
    .map((i) => i.sound!)
    .filter((one, at, list) => list.indexOf(one) === at));
  const [sound, setSound] = useState<string | undefined>();

  if (!hasProfile) {
    return (
      <div className="ph-sheet">
        <div className="ph-sheet-top">
          <button type="button" className="ph-iconbtn" onClick={onClose} aria-label="Close"><BackGlyph /></button>
          <b>New Clip</b>
        </div>
        <div className="ph-body"><MakeAccount say={say} /></div>
      </div>
    );
  }

  if (inCamera) {
    return (
      <div className="ph-tt-cam">
        <div className="ph-tt-cam-top">
          <button type="button" className="ph-tt-cam-x" onClick={onClose} aria-label="Close"><CloseGlyph size={19} /></button>
          <button
            type="button"
            className="ph-tt-addsound"
            onClick={() => {
              if (sounds.length === 0) { say('Nothing has a sound on it yet.'); return; }
              const at = sound ? (sounds.indexOf(sound) + 1) % sounds.length : 0;
              setSound(sounds[at]);
              say(`Sound: ${sounds[at]}.`);
            }}
          >
            <MusicGlyph size={15} />{sound ?? 'Add Sound'}
          </button>
          <span style={{ width: 34 }} />
        </div>

        <div className="ph-tt-cam-rail">
          <button type="button" onClick={() => say('The handset has one camera in this game, so there is nothing to flip to.')} aria-label="Flip">
            <RepostGlyph size={22} />
          </button>
          <button type="button" onClick={() => say('There is no lamp on this handset.')} aria-label="Flash">
            <SparkleGlyph size={22} />
          </button>
          <button type="button" onClick={() => say('A clip takes the minutes it takes to cut, which you set in the editor.')} aria-label="Timer">
            <TimerGlyph size={22} />
          </button>
          <button
            type="button"
            className={beauty ? 'ph-ticked' : ''}
            onClick={() => { setBeauty((v) => !v); say(beauty ? 'Filters off.' : 'Filters on. It does not change what a clip does.'); }}
            aria-label="Effects"
          >
            <SparkleGlyph size={22} />
            {beauty && <i aria-hidden="true"><TickGlyph size={9} /></i>}
          </button>
          <button type="button" onClick={() => setInCamera(false)} aria-label="More">
            <MenuGlyph size={22} />
          </button>
        </div>

        <div className="ph-tt-cam-foot">
          <div className="ph-tt-modes">
            {MODES.map((one) => (
              <button
                key={one.key}
                type="button"
                className={mode === one.key ? 'ph-on' : ''}
                onClick={() => {
                  setMode(one.key);
                  if (one.seconds) { setSeconds(one.seconds); setEffort(Math.max(20, Math.round(one.seconds * 2.2))); }
                }}
              >
                {one.label}
              </button>
            ))}
          </div>
          <div className="ph-tt-shutterrow">
            <span className="ph-tt-roll" aria-hidden="true" style={{ background: look('roll') }} />
            <button
              type="button"
              className="ph-tt-shutter"
              onClick={() => setInCamera(false)}
              aria-label={`Shoot A ${MODES.find((one) => one.key === mode)?.label ?? 'Clip'}`}
            />
            <span className="ph-tt-roll ph-two" aria-hidden="true" style={{ background: look('roll2') }} />
          </div>
          <div className="ph-tt-camtabs">
            <button type="button" className="ph-on">Post</button>
            <button type="button" onClick={() => setInCamera(false)}>Editor</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ph-sheet">
      <div className="ph-sheet-top">
        <button type="button" className="ph-iconbtn" onClick={() => setInCamera(true)} aria-label="Back To The Camera"><BackGlyph /></button>
        <b>New Clip</b>
        <button
          type="button"
          className="ph-btn-solid ph-right"
          disabled={text.trim().length === 0}
          onClick={() => {
            const result = run<{ scheduled: boolean }>('feed.post', {
              platform: CLIP_PLATFORM,
              kind: 'clip',
              text,
              images: cover ? [cover] : [],
              effortMinutes: effort,
              sound,
              publishAt: later ? now + days * 86_400_000 : undefined,
            }, { silent: true });
            if (result.ok) {
              say(result.value!.scheduled ? 'Scheduled. It goes up on its own.' : 'Posted. Now you wait.');
              onClose();
            } else say(result.error ?? 'That did not work.');
          }}
        >
          Post
        </button>
      </div>
      <div className="ph-body">
        <div className="ph-panel">
          <ImagePicker frame="short" image={cover} label="Your Cover" onChange={setCover} />

          <div className="ph-label">Duration</div>
          <div className="ph-chips">
            {[15, 30, 60, 180].map((option) => (
              <button
                key={option}
                type="button"
                className={`ph-chip${seconds === option ? ' ph-on' : ''}`}
                onClick={() => { setSeconds(option); setEffort(Math.max(20, Math.round(option * 2.2))); }}
              >
                {option < 60 ? `${option}s` : `${option / 60} min`}
              </button>
            ))}
          </div>

          <div className="ph-label">The Hook</div>
          <EmojiRow app="photo" onPick={(emoji) => setText((current) => current + emoji)} />
          <input
            className="ph-input"
            value={text}
            maxLength={2200}
            placeholder="The first second is the only one you get"
            onChange={(e) => setText(e.target.value)}
          />

          <div className="ph-label">How Long It Took To Cut, In Minutes</div>
          <input
            className="ph-input"
            type="number"
            min={5}
            max={480}
            value={effort}
            onChange={(e) => setEffort(Number(e.target.value))}
          />

          <label className="ph-card-meta" style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 8 }}>
            <input type="checkbox" checked={later} onChange={(e) => setLater(e.target.checked)} />
            Put it up later
          </label>
          {later && (
            <>
              <div className="ph-label">In How Many Days</div>
              <input className="ph-input" type="number" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} />
            </>
          )}

          <p className="ph-card-meta">
            A clip that runs {seconds < 60 ? plural(seconds, 'second') : plural(seconds / 60, 'minute')} still
            takes the hours you put into it. The app rewards posting often, and it shows.
          </p>
        </div>
      </div>
    </div>
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
            Live takes the hours out of the day, brings in whatever slice of your followers is
            about, and collects whatever they chose to send while you were on.
          </p>
          <div className="ph-actions">
            <button
              type="button"
              className="ph-btn-solid"
              onClick={() => {
                const result = run<{ peak: number; gifts: number }>('feed.go_live', {
                  platform: CLIP_PLATFORM, title, minutes,
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

// ---------------------------------------------------------------------------
// Saved, followers and settings
// ---------------------------------------------------------------------------

function SavedPage({ onBack, onOpen }: { onBack: () => void; onOpen: (id: string) => void }) {
  const folders = useWorld((s) => collectionsOf(s).map((folder) => ({
    name: folder.name,
    items: folder.items.filter((item) => item.platform === CLIP_PLATFORM),
  })).filter((folder) => folder.items.length > 0));
  return (
    <>
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
        <b style={{ fontSize: 15 }}>Saved</b>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-tt-page">
        {folders.length === 0 && <p className="ph-empty"><b>Nothing Saved</b>The bookmark on a clip keeps it here.</p>}
        {folders.map((folder) => (
          <div key={folder.name}>
            <div className="ph-section-head">{folder.name}</div>
            <Grid items={folder.items} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </>
  );
}

function FollowersPage({ onBack, onWho }: { onBack: () => void; onWho: (id: string) => void }) {
  const mine = useWorld((s) => myProfile(s, CLIP_PLATFORM));
  const followers = useWorld((s) => (mine ? followersOf(s, mine.id) : []));
  const profiles = useWorld((s) => s.universe.socialProfiles);
  return (
    <>
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
        <b style={{ fontSize: 15 }}>Followers</b>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-tt-page">
        {mine && (
          <p className="ph-card-meta" style={{ padding: 12 }}>
            {views(mine.followers)} in all. These are the ones the app can name.
          </p>
        )}
        {followers.length === 0 && <p className="ph-empty">Nobody yet.</p>}
        {followers.map((follow) => {
          const who = follow.byProfileId ? profiles[follow.byProfileId] : undefined;
          return (
            <button key={follow.id} type="button" className="ph-dm-row" onClick={() => who && onWho(who.id)}>
              <Avatar name={who?.name ?? '?'} size={40} image={who?.avatarImage} />
              <span className="ph-dm-text">
                <b>@{who?.handle ?? 'someone'}</b>
                <small>{who?.name}</small>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/** One row of the settings list: a gray glyph, a label, sometimes a value. */
function TtRow({
  icon, label, value, onClick,
}: { icon: React.ReactNode; label: string; value?: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className="ph-tt-set-row" onClick={onClick} disabled={!onClick}>
      <span className="ph-tt-set-icon">{icon}</span>
      <span className="ph-tt-set-label">{label}</span>
      {value !== undefined && <span className="ph-tt-set-value">{value}</span>}
      <span className="ph-tt-set-go" aria-hidden="true"><ChevronRightGlyph size={15} /></span>
    </button>
  );
}

/**
 * Settings and privacy, in the app's own sections and its own order.
 *
 * Every row either changes something or says plainly what it cannot change.
 * Where the real app talks to a server — cache, offline copies, a report that
 * goes somewhere — this says there is nothing on the other end, because there
 * is not.
 */
function SettingsPage({ onBack, say }: { onBack: () => void; say: (text: string) => void }) {
  const { run } = useGame();
  const mine = useWorld((s) => myProfile(s, CLIP_PLATFORM));
  const settings = useWorld((s) => settingsOf(s));
  const minutes = useWorld((s) => screenTime(s, CLIP_PLATFORM));
  const stats = useWorld((s) => (mine ? socialAnalytics(s, mine.id) : undefined));
  const kept = useWorld((s) => Object.values(s.universe.socialItems)
    .filter((one) => one.platform === CLIP_PLATFORM).length);
  const saved = useWorld((s) => Object.values(s.universe.socialItems).filter((one) => one.saved).length);
  const payouts = useWorld((s) => Object.values(s.universe.creatorPayouts)
    .filter((payout) => payout.accountId === mine?.accountId)
    .sort((a, b) => b.month - a.month)
    .slice(0, 6));

  const set = (patch: Record<string, unknown>) => {
    const result = run('feed.settings', patch, { silent: true });
    if (!result.ok) say(result.error ?? 'That did not work.');
  };

  return (
    <>
      <div className="ph-tt-settop">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph size={20} /></button>
        <b>Settings And Privacy</b>
        <span style={{ width: 34 }} />
      </div>
      <div className="ph-tt-page ph-tt-settings">
        <h2>Settings And Privacy</h2>

        <div className="ph-tt-cap">Account</div>
        <div className="ph-tt-set-group">
          <TtRow icon={<AccountGlyph size={20} />} label="Account" value={mine ? `@${mine.handle}` : 'None'} onClick={() => say(mine ? `Signed in as @${mine.handle}. SLATE keeps one life, so there is one account.` : 'Make one from the Profile tab.')} />
          <TtRow icon={<LockGlyph size={20} />} label="Privacy" value={settings.privateAccount ? 'Private' : 'Public'} onClick={() => set({ privateAccount: !settings.privateAccount })} />
          <TtRow icon={<ShieldGlyph size={20} />} label="Security And Permissions" onClick={() => say('Nothing on this phone reaches your machine. The camera and the picture roll are the game’s own.')} />
          <TtRow icon={<CartGlyph size={20} />} label="Your Orders" value="None" onClick={() => say('Shopping in SLATE happens in shops, not in here.')} />
          <TtRow icon={<ArrowShareGlyph size={20} />} label="Share Profile" onClick={() => say(mine ? `Your page is @${mine.handle}. Anybody in this world can find it; nothing about it leaves the game.` : 'Make an account first.')} />
        </div>

        <div className="ph-tt-cap">Content And Display</div>
        <div className="ph-tt-set-group">
          <TtRow icon={<BellGlyph size={20} />} label="Notifications" value={settings.notificationsOn ? 'On' : 'Off'} onClick={() => set({ notificationsOn: !settings.notificationsOn })} />
          <TtRow icon={<LiveGlyph size={20} />} label="Live" value={stats?.monetized ? 'Open' : `Needs ${plural(CLIP_FLOOR, 'Follower')}`} onClick={() => say(`Going live opens once you pass ${plural(CLIP_FLOOR, 'follower')}. You have ${views(mine?.followers ?? 0)}.`)} />
          <TtRow icon={<MusicGlyph size={20} />} label="Music" onClick={() => say('The sounds here are SLATE’s own. No recording by anybody real is used or named.')} />
          <TtRow icon={<HistoryGlyph size={20} />} label="Activity Center" value={`${kept} Kept`} onClick={() => say(`${kept} clips, replies and marks are stored in this save. Everybody else’s is worked out when you look at it.`)} />
          <TtRow icon={<ContentGlyph size={20} />} label="Content Preferences" onClick={() => say('The feed is built from what you have watched and who you follow. Nothing else feeds it.')} />
          <TtRow icon={<PeopleGlyph size={20} />} label="Audience Controls" value={settings.privateAccount ? 'Followers Only' : 'Everyone'} onClick={() => set({ privateAccount: !settings.privateAccount })} />
          <TtRow icon={<ChartGlyph size={20} />} label="Ads" value="None" onClick={() => say('SLATE sells nothing and shows you nothing it was paid to show you.')} />
          <TtRow icon={<PlayTriangleGlyph size={20} />} label="Playback" value={settings.hideCounts ? 'Counts Hidden' : 'Counts Shown'} onClick={() => set({ hideCounts: !settings.hideCounts })} />
          <TtRow icon={<LanguageGlyph size={20} />} label="Language" value="English" onClick={() => say('The app is in English. SLATE does not translate itself yet.')} />
          <TtRow icon={<TvGlyph size={20} />} label="Display" value="Set By The Phone" onClick={() => say('Light or dark is in the phone’s own Settings app, which is where it belongs.')} />
          <TtRow icon={<TimerGlyph size={20} />} label="Screen Time" value={`${minutes} Min Today`} onClick={() => say(`${minutes} minutes on this app today, which is ${Math.round((minutes / (24 * 60)) * 100)} percent of a day.`)} />
          <TtRow icon={<SupervisionGlyph size={20} />} label="Family Pairing" onClick={() => say('Nobody else is signed in on this handset.')} />
          <TtRow icon={<AccessGlyph size={20} />} label="Accessibility" onClick={() => say('Every control here has a name a screen reader can read, and nothing is carried by color alone.')} />
        </div>

        <div className="ph-tt-cap">Cache And Cellular</div>
        <div className="ph-tt-set-group">
          <TtRow icon={<DownloadGlyph size={20} />} label="Offline Videos" value={`${saved} Saved`} onClick={() => say('Clips are drawn rather than fetched, so nothing is downloaded. What you save is a bookmark.')} />
          <TtRow icon={<BlockRingGlyph size={20} />} label="Free Up Space" value="Nothing Cached" onClick={() => say('There is no cache. The save holds what is yours and works out the rest when you look at it.')} />
          <TtRow icon={<BarsGlyph size={20} />} label="Data Saver" value="Not Needed" onClick={() => say('Nothing on this phone goes over a connection.')} />
        </div>

        <div className="ph-tt-cap">Support And About</div>
        <div className="ph-tt-set-group">
          <TtRow icon={<FlaskGlyph size={20} />} label="Report A Problem" onClick={() => say('Nothing is sent anywhere. This is a game on your machine.')} />
          <TtRow icon={<RingHelpGlyph size={20} />} label="Support" onClick={() => say('Everything on this phone is SLATE’s own. The accounts are invented and nobody real is named.')} />
          <TtRow icon={<InfoGlyph size={20} />} label="Terms And Policies" onClick={() => say('There is no service to agree to. This app runs inside SLATE and talks to nothing.')} />
        </div>

        <div className="ph-tt-cap">Login</div>
        <div className="ph-tt-set-group">
          <TtRow icon={<RepostGlyph size={20} />} label="Switch Account" value={mine ? `@${mine.handle}` : 'None'} onClick={() => say('SLATE keeps one life, so there is one account and nothing to switch to.')} />
          <TtRow icon={<MenuGlyph size={20} />} label="Log Out" onClick={() => say('The account is part of your save. Closing the app is the same as putting the phone down.')} />
        </div>

        {payouts.length > 0 && (
          <>
            <div className="ph-tt-cap">Paid Out</div>
            <div className="ph-tt-set-group">
              {payouts.map((payout) => (
                <TtRow
                  key={payout.id}
                  icon={<InsightGlyph size={20} />}
                  label={new Date(payout.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                  value={formatMoney(payout.total)}
                />
              ))}
            </div>
          </>
        )}

        <p className="ph-tt-version">
          SLATE&rsquo;s own short video app. The accounts here are invented, nobody real is named,
          and no follower count belongs to anybody.
        </p>
      </div>
    </>
  );
}
