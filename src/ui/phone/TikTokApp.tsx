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
  settingsOf, socialAnalytics,
} from '@/engine/systems/socialapps';
import { SOCIAL_TOPICS, SOCIAL_TOPIC_LABEL, type SocialTopic } from '@/engine/content/socialworld';
import {
  ArrowShareGlyph, BackGlyph, BookmarkGlyph, BubbleGlyph, GearGlyph, HeartGlyph,
  HomeGlyph, NoteGlyph, PlusGlyph, SearchGlyph, SendGlyph, TickGlyph, YouGlyph,
} from './Icons';
import { Avatar, ago, tally, views } from './YouTubeExtras';
import { EmojiRow } from './EmojiRow';
import { ImagePicker } from './ImagePicker';
import type { PhoneTheme } from './Phone';
import './social.css';

type Tab = 'home' | 'discover' | 'inbox' | 'profile';
type Screen = 'app' | 'create' | 'live' | 'settings' | 'saved' | 'followers';

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
  const [lane, setLane] = useState<'foryou' | 'following'>('foryou');
  const [openId, setOpenId] = useState<string | null>(null);
  const [whoId, setWhoId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const now = useWorld((s) => s.now);
  const mine = useWorld((s) => myProfile(s, CLIP_PLATFORM));
  const open = useWorld((s) => (openId ? itemById(s, openId) : undefined));
  const who = useWorld((s) => (whoId ? profileById(s, whoId) : undefined));

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
      ) : (
        <>
          {tab === 'home' && (
            <Player lane={lane} setLane={setLane} now={now} onWho={setWhoId} onOpen={setOpenId} say={say} />
          )}
          {tab === 'discover' && <DiscoverPage onOpen={setOpenId} onWho={setWhoId} />}
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
            <button type="button" className={tab === 'discover' ? 'ph-on' : ''} onClick={() => setTab('discover')}>
              <SearchGlyph size={22} />
              Discover
            </button>
            <button type="button" onClick={() => setScreen('create')} aria-label="Create">
              <span className="ph-tt-plate"><span><PlusGlyph size={17} /></span></span>
            </button>
            <button type="button" className={tab === 'inbox' ? 'ph-on' : ''} onClick={() => setTab('inbox')}>
              <BubbleGlyph size={22} />
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

function Player({
  lane, setLane, now, onWho, onOpen, say,
}: {
  lane: 'foryou' | 'following';
  setLane: (lane: 'foryou' | 'following') => void;
  now: number;
  onWho: (id: string) => void;
  onOpen: (id: string) => void;
  say: (text: string) => void;
}) {
  const { run } = useGame();
  const forYou = useWorld((s) => homeFeed(s, CLIP_PLATFORM, 40));
  const following = useWorld((s) => followingFeed(s, CLIP_PLATFORM, 40));
  const clips = lane === 'following' ? following : forYou;
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
        <span className="ph-side ph-left"><SendGlyph size={19} /></span>
        <button type="button" className={lane === 'following' ? 'ph-on' : ''} onClick={() => setLane('following')}>
          Following
        </button>
        <button type="button" className={lane === 'foryou' ? 'ph-on' : ''} onClick={() => setLane('foryou')}>
          For You
        </button>
        <span className="ph-side ph-right"><SearchGlyph size={19} /></span>
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
            className="ph-tt-stage"
            onClick={next}
            aria-label="Next Clip"
            style={{ background: clip.images?.[0] ? '#000' : look(clip.id) }}
          >
            {clip.images?.[0] && <img src={clip.images[0]} alt="" />}
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
// Discover
// ---------------------------------------------------------------------------

function DiscoverPage({ onOpen, onWho }: { onOpen: (id: string) => void; onWho: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<'all' | SocialTopic>('all');
  const found = useWorld((s) => searchSocial(s, CLIP_PLATFORM, query));
  const grid = useWorld((s) => exploreFeed(s, CLIP_PLATFORM, 36));
  const shown = chip === 'all' ? grid : grid.filter((item) => item.topic === chip);

  return (
    <>
      <div className="ph-so-top">
        <input
          className="ph-input"
          style={{ flex: 1, borderRadius: 999 }}
          value={query}
          placeholder="Search"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="ph-tt-page">
        {query.trim().length < 2 ? (
          <>
            <div className="ph-chips">
              <button type="button" className={`ph-chip${chip === 'all' ? ' ph-on' : ''}`} onClick={() => setChip('all')}>
                All
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
            <Grid items={shown} onOpen={onOpen} />
          </>
        ) : (
          <>
            {found.profiles.map((profile) => (
              <button key={profile.id} type="button" className="ph-dm-row" onClick={() => onWho(profile.id)}>
                <Avatar name={profile.name} size={40} image={profile.avatarImage} />
                <span className="ph-dm-text">
                  <b>@{profile.handle}</b>
                  <small>{profile.name} · {views(profile.followers)} followers</small>
                </span>
              </button>
            ))}
            {found.items.length > 0 && <div className="ph-section-head">Clips</div>}
            <Grid items={found.items} onOpen={onOpen} />
            {found.profiles.length === 0 && found.items.length === 0 && <p className="ph-empty">Nothing for that.</p>}
          </>
        )}
      </div>
    </>
  );
}

function Grid({ items, onOpen }: { items: SocialItem[]; onOpen: (id: string) => void }) {
  return (
    <div className="ph-tt-grid">
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

function InboxPage({
  now, mine, onOpen, onWho,
}: {
  now: number; mine: SocialProfile | undefined;
  onOpen: (id: string) => void; onWho: (id: string) => void;
}) {
  const items = useWorld((s) => (mine ? catalogOf(s, mine) : []));
  const followers = useWorld((s) => (mine ? followersOf(s, mine.id) : []));
  const profiles = useWorld((s) => s.universe.socialProfiles);

  if (!mine) return <p className="ph-empty"><b>Nothing Yet</b>Make an account and this fills up.</p>;

  return (
    <>
      <div className="ph-so-top">
        <span style={{ width: 22 }} />
        <b style={{ fontSize: 15 }}>Inbox</b>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-tt-page">
        <div className="ph-section-head">New Followers</div>
        {followers.length === 0 && <p className="ph-empty">Nobody yet.</p>}
        {followers.slice(0, 12).map((follow) => {
          const who = follow.byProfileId ? profiles[follow.byProfileId] : undefined;
          return (
            <button key={follow.id} type="button" className="ph-dm-row" onClick={() => who && onWho(who.id)}>
              <Avatar name={who?.name ?? '?'} size={40} image={who?.avatarImage} />
              <span className="ph-dm-text">
                <b>@{who?.handle ?? 'someone'}</b>
                <small>started following you · {ago(now, follow.since)}</small>
              </span>
            </button>
          );
        })}

        <div className="ph-section-head">What Your Clips Did</div>
        {items.length === 0 && <p className="ph-empty">Post something and see what comes back.</p>}
        {items.map((item) => (
          <button key={item.id} type="button" className="ph-dm-row" onClick={() => onOpen(item.id)}>
            <span className="ph-iconbtn" style={{ color: 'var(--ph-red)' }}><HeartGlyph size={20} filled /></span>
            <span className="ph-dm-text">
              <b>{tally(item.likes, 'like')}, {tally(item.comments, 'comment')}</b>
              <small>{item.text.slice(0, 50)} · {ago(now, item.at)}</small>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// A profile
// ---------------------------------------------------------------------------

function ProfilePage({
  profile, now, onBack, onOpen, onSettings, onFollowers, onSaved, onLive, say,
}: {
  profile: SocialProfile; now: number; onBack?: () => void;
  onOpen: (id: string) => void; onSettings: () => void; onFollowers: () => void;
  onSaved: () => void; onLive: () => void; say: (text: string) => void;
}) {
  const { run } = useGame();
  const items = useWorld((s) => catalogOf(s, profile));
  const following = useWorld((s) => isFollowing(s, s.player.id, profile.id));
  const own = useWorld((s) => profile.ownerId === s.player.id);
  const stats = useWorld((s) => socialAnalytics(s, profile.id));
  const [editing, setEditing] = useState(false);
  const likes = items.reduce((sum, item) => sum + item.likes, 0);
  void now;

  return (
    <>
      <div className="ph-so-top">
        {onBack
          ? <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
          : <span style={{ width: 22 }} />}
        <b style={{ fontSize: 15 }}>@{profile.handle}</b>
        {own
          ? <button type="button" className="ph-iconbtn" onClick={onSettings} aria-label="Settings"><GearGlyph size={19} /></button>
          : <span style={{ width: 22 }} />}
      </div>
      <div className="ph-tt-page">
        <div style={{ textAlign: 'center', padding: '14px 12px 4px' }}>
          <Avatar name={profile.name} size={86} image={profile.avatarImage} />
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8 }}>@{profile.handle}</div>
        </div>

        <div className="ph-prof-stats" style={{ padding: '8px 0 10px' }}>
          <div><b>{views(profile.following)}</b><span>Following</span></div>
          <button
            type="button"
            style={{ background: 'none', border: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}
            onClick={own ? onFollowers : undefined}
          >
            <b style={{ display: 'block', fontSize: 15 }}>{views(profile.followers)}</b>
            <span style={{ fontSize: 11.5, color: 'var(--ph-muted)' }}>Followers</span>
          </button>
          <div><b>{views(likes)}</b><span>Likes</span></div>
        </div>

        <div className="ph-prof-bio" style={{ textAlign: 'center' }}>
          <p>{profile.bio || 'No bio yet.'}</p>
        </div>

        <div className="ph-x-buttons">
          {own ? (
            <>
              <button type="button" onClick={() => setEditing((v) => !v)}>Edit Profile</button>
              <button type="button" onClick={onSaved}>Saved</button>
              <button type="button" onClick={onLive}>Go Live</button>
            </>
          ) : (
            <>
              <button
                type="button"
                style={following ? undefined : { background: '#fe2c55', color: '#fff', borderColor: 'transparent' }}
                onClick={() => {
                  const result = run(following ? 'feed.unfollow' : 'feed.follow', { profileId: profile.id }, { silent: true });
                  if (result.ok) say(following ? `You no longer follow @${profile.handle}.` : `Following @${profile.handle}.`);
                }}
              >
                {following ? 'Following' : 'Follow'}
              </button>
              <button type="button" onClick={() => say(`@${profile.handle} posts every ${profile.cadenceDays === 1 ? 'day' : `${profile.cadenceDays} days`}.`)}>
                About
              </button>
            </>
          )}
        </div>

        {editing && own && <EditProfile profile={profile} onDone={() => setEditing(false)} say={say} />}

        {own && (
          <p className="ph-card-meta" style={{ padding: '0 12px 10px' }}>
            {stats.monetized
              ? 'The app is paying on the views that stayed past a minute.'
              : `${views(Math.max(0, CLIP_FLOOR - profile.followers))} more followers and the app starts paying.`}
          </p>
        )}

        {items.length === 0
          ? <p className="ph-empty">Nothing posted yet.</p>
          : <Grid items={items} onOpen={onOpen} />}
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

  return (
    <div className="ph-sheet">
      <div className="ph-sheet-top">
        <button type="button" className="ph-iconbtn" onClick={onClose} aria-label="Close"><BackGlyph /></button>
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

function SettingsPage({ onBack, say }: { onBack: () => void; say: (text: string) => void }) {
  const { run } = useGame();
  const mine = useWorld((s) => myProfile(s, CLIP_PLATFORM));
  const settings = useWorld((s) => settingsOf(s));
  const minutes = useWorld((s) => screenTime(s, CLIP_PLATFORM));
  const stats = useWorld((s) => (mine ? socialAnalytics(s, mine.id) : undefined));
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
      <div className="ph-so-top">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Back"><BackGlyph /></button>
        <b style={{ fontSize: 15 }}>Settings And Privacy</b>
        <span style={{ width: 22 }} />
      </div>
      <div className="ph-tt-page">
        <div className="ph-set-head">Account</div>
        <div className="ph-set-group">
          <button type="button" className="ph-set-row" onClick={() => say(mine ? `Signed in as @${mine.handle}.` : 'No account yet.')}>
            Manage Account<span className="ph-set-value">{mine ? `@${mine.handle}` : 'None'}</span>
          </button>
          <button type="button" className="ph-set-row" onClick={() => set({ privateAccount: !settings.privateAccount })}>
            Private Account<span className="ph-set-value">{settings.privateAccount ? 'On' : 'Off'}</span>
          </button>
        </div>

        <div className="ph-set-head">Content And Activity</div>
        <div className="ph-set-group">
          <button type="button" className="ph-set-row" onClick={() => set({ notificationsOn: !settings.notificationsOn })}>
            Push Notifications<span className="ph-set-value">{settings.notificationsOn ? 'On' : 'Off'}</span>
          </button>
          <button type="button" className="ph-set-row" onClick={() => set({ hideCounts: !settings.hideCounts })}>
            Hide Like Counts<span className="ph-set-value">{settings.hideCounts ? 'On' : 'Off'}</span>
          </button>
          <div className="ph-set-row" style={{ cursor: 'default' }}>
            Screen Time<span className="ph-set-value">{minutes} Min Today</span>
          </div>
        </div>

        <div className="ph-set-head">Creator Tools</div>
        <div className="ph-set-group">
          <div className="ph-set-row" style={{ cursor: 'default' }}>
            Views<span className="ph-set-value">{stats ? views(stats.impressions) : '0'}</span>
          </div>
          <div className="ph-set-row" style={{ cursor: 'default' }}>
            Creator Rewards<span className="ph-set-value">{stats?.monetized ? 'On' : `Needs ${views(CLIP_FLOOR)} Followers`}</span>
          </div>
        </div>

        <div className="ph-section-head">Paid Out</div>
        {payouts.length === 0 && <p className="ph-empty">No month has been paid yet.</p>}
        {payouts.map((payout) => (
          <div key={payout.id} className="ph-set-row" style={{ cursor: 'default' }}>
            {new Date(payout.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
            <span className="ph-set-value">{formatMoney(payout.total)}</span>
          </div>
        ))}

        <p className="ph-card-meta" style={{ padding: 12 }}>
          The accounts here are SLATE&rsquo;s own. Nobody real is named, and no follower count
          belongs to anybody.
        </p>
      </div>
    </>
  );
}
