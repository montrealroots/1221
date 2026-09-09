/**
 * SLATE — the phone.
 *
 * A handset, on the desk, with apps on it. It is the newest iPhone the game
 * knows about, and it is the one the player owns where they own one, because
 * the phone in your pocket should be the phone you bought in the shop.
 *
 * The clock on it is the world clock. It is not a decoration and it does not
 * tick on its own: it says exactly what the simulation says, so an hour spent
 * inside an app is an hour gone on the phone as well as in the day.
 *
 * The marks on the app icons are drawn here in CSS rather than shipped as
 * artwork, and no third party image file is included anywhere in SLATE.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { formatDate, formatTime } from '@/engine/core/time';
import { CATALOG } from '@/engine/content/catalog';
import { YouTubeApp } from './YouTubeApp';
import { InstagramApp } from './InstagramApp';
import { XApp } from './XApp';
import { TikTokApp } from './TikTokApp';
import {
  CallGlyph, CameraGlyph, ClockGlyph, GearGlyph, MapsGlyph, MessagesGlyph,
  NotesGlyph, PhotosGlyph, WeatherGlyph,
} from './Icons';
import './phone.css';

export type PhoneTheme = 'light' | 'dark';
type AppId = 'home' | 'youtube' | 'instagram' | 'x' | 'tiktok' | 'settings';

const THEME_KEY = 'slate.phone.theme';

function storedTheme(): PhoneTheme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* a private window has no storage, and that is fine. */ }
  return 'dark';
}

/**
 * The handset itself.
 *
 * The one you bought, if you have bought one. Otherwise the newest iPhone the
 * catalog carries, because that is what the ask was. SLATE names the newest
 * handsets it knows of; if Apple has shipped a newer one since, the game does
 * not know about it and does not invent a model number for it.
 */
export function handsetName(owned: string[]): string {
  const phones = CATALOG.all().filter((item) => item.subcategory === 'phone');
  const mine = phones
    .filter((item) => owned.includes(item.id))
    .sort((a, b) => b.basePrice - a.basePrice)[0];
  if (mine) return mine.name;
  const newest = phones
    .filter((item) => item.brand === 'Apple')
    .sort((a, b) => {
      const generation = (name: string) => Number(name.match(/iPhone (\d+)/)?.[1] ?? 0);
      return generation(b.name) - generation(a.name) || b.basePrice - a.basePrice;
    })[0];
  return newest?.name ?? phones[0]?.name ?? 'A Phone';
}

export function Phone() {
  const { sim } = useGame();
  const [app, setApp] = useState<AppId>('home');
  const [theme, setTheme] = useState<PhoneTheme>(storedTheme);

  const now = useWorld((s) => s.now);
  const owned = useWorld((s) => Object.values(s.universe.assets)
    .filter((a) => a.ownerId === s.player.id && !a.soldAt && a.catalogId)
    .map((a) => a.catalogId!));
  const handset = handsetName(owned);

  const chooseTheme = (next: PhoneTheme) => {
    setTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* nothing to do. */ }
  };

  return (
    <div className="ph-stage">
      <div className="ph-device" aria-label={handset}>
        <span className="ph-btn-rail ph-left ph-action" aria-hidden="true" />
        <span className="ph-btn-rail ph-left ph-vol-up" aria-hidden="true" />
        <span className="ph-btn-rail ph-left ph-vol-down" aria-hidden="true" />
        <span className="ph-btn-rail ph-power" aria-hidden="true" />

        <div className={`ph-screen${theme === 'dark' ? ' ph-dark' : ''}`}>
          <StatusBar now={now} zone={sim.homeZone} onHome={app === 'home'} />

          {app === 'home' && (
            <HomeScreen
              now={now}
              zone={sim.homeZone}
              onOpen={setApp}
            />
          )}
          {app === 'youtube' && <YouTubeApp theme={theme} />}
          {app === 'instagram' && <InstagramApp theme={theme} />}
          {app === 'x' && <XApp theme={theme} />}
          {app === 'tiktok' && <TikTokApp theme={theme} />}
          {app === 'settings' && (
            <SettingsApp handset={handset} theme={theme} onTheme={chooseTheme} />
          )}

          <div className="ph-home-bar">
            <button
              type="button"
              aria-label={app === 'home' ? 'Home Screen' : 'Close The App'}
              onClick={() => setApp('home')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBar({ now, zone, onHome }: { now: number; zone: string; onHome: boolean }) {
  return (
    <div className="ph-status-bar" style={onHome ? { color: '#fff' } : undefined}>
      <div className="ph-island" aria-hidden="true" />
      <span>{formatTime(now, zone)}</span>
      <span className="ph-status-right">
        <span className="ph-bars" aria-label="Signal"><i /><i /><i /><i /></span>
        <span aria-hidden="true" style={{ fontSize: 12 }}>Wi-Fi</span>
        <span className="ph-battery" aria-label="Battery"><i style={{ right: '32%' }} /></span>
      </span>
    </div>
  );
}

function HomeScreen({ now, zone, onOpen }: { now: number; zone: string; onOpen: (app: AppId) => void }) {
  return (
    <div className="ph-home">
      <div className="ph-home-clock">
        <div className="ph-time">{formatTime(now, zone).replace(/\s?[AP]M$/i, '')}</div>
        <div className="ph-date">{formatDate(now, zone)}</div>
      </div>

      <div className="ph-grid">
        <AppIcon label="YouTube" onClick={() => onOpen('youtube')}>
          <span className="ph-icon ph-mark-yt"><span className="ph-play" /></span>
        </AppIcon>
        <AppIcon label="Instagram" onClick={() => onOpen('instagram')}>
          <span className="ph-icon ph-mark-ig"><span className="ph-ig-lens" /></span>
        </AppIcon>
        <AppIcon label="X" onClick={() => onOpen('x')}>
          <span className="ph-icon ph-mark-x"><span className="ph-x-glyph">X</span></span>
        </AppIcon>
        <AppIcon label="TikTok" onClick={() => onOpen('tiktok')}>
          <span className="ph-icon ph-mark-tt"><span className="ph-tt-note">&#9834;</span></span>
        </AppIcon>
        <AppIcon label="Settings" onClick={() => onOpen('settings')}>
          <span className="ph-icon ph-mark-settings"><GearGlyph /></span>
        </AppIcon>
        <AppIcon label="Clock" disabled>
          <span className="ph-icon ph-mark-clock"><ClockGlyph /></span>
        </AppIcon>
        <AppIcon label="Photos" disabled>
          <span className="ph-icon ph-mark-soon"><PhotosGlyph /></span>
        </AppIcon>
        <AppIcon label="Messages" disabled>
          <span className="ph-icon ph-mark-soon"><MessagesGlyph /></span>
        </AppIcon>
        <AppIcon label="Maps" disabled>
          <span className="ph-icon ph-mark-soon"><MapsGlyph /></span>
        </AppIcon>
        <AppIcon label="Notes" disabled>
          <span className="ph-icon ph-mark-soon"><NotesGlyph /></span>
        </AppIcon>
        <AppIcon label="Weather" disabled>
          <span className="ph-icon ph-mark-soon"><WeatherGlyph /></span>
        </AppIcon>
        <AppIcon label="Phone" disabled>
          <span className="ph-icon ph-mark-soon"><CallGlyph /></span>
        </AppIcon>
        <AppIcon label="Camera" disabled>
          <span className="ph-icon ph-mark-soon"><CameraGlyph /></span>
        </AppIcon>
      </div>

      <div className="ph-dock">
        <AppIcon label="YouTube" onClick={() => onOpen('youtube')}>
          <span className="ph-icon ph-mark-yt"><span className="ph-play" /></span>
        </AppIcon>
        <AppIcon label="Instagram" onClick={() => onOpen('instagram')}>
          <span className="ph-icon ph-mark-ig"><span className="ph-ig-lens" /></span>
        </AppIcon>
        <AppIcon label="X" onClick={() => onOpen('x')}>
          <span className="ph-icon ph-mark-x"><span className="ph-x-glyph">X</span></span>
        </AppIcon>
        <AppIcon label="TikTok" onClick={() => onOpen('tiktok')}>
          <span className="ph-icon ph-mark-tt"><span className="ph-tt-note">&#9834;</span></span>
        </AppIcon>
        <AppIcon label="Settings" onClick={() => onOpen('settings')}>
          <span className="ph-icon ph-mark-settings"><GearGlyph /></span>
        </AppIcon>
      </div>
    </div>
  );
}

function AppIcon({
  label, onClick, disabled, children,
}: { label: string; onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" className="ph-app" onClick={onClick} disabled={disabled} aria-label={label}>
      {children}
      <span className="ph-app-name">{label}</span>
    </button>
  );
}

/**
 * Settings, which on this phone is one screen: what the handset is, what the
 * clock is tied to, and whether the screen is light or dark.
 */
function SettingsApp({
  handset, theme, onTheme,
}: { handset: string; theme: PhoneTheme; onTheme: (theme: PhoneTheme) => void }) {
  return (
    <div className="ph-app-screen">
      <div className="ph-yt-top">
        <b style={{ fontSize: 20 }}>Settings</b>
      </div>
      <div className="ph-body">
        <div className="ph-set-head">Appearance</div>
        <div className="ph-set-group">
          <button type="button" className="ph-set-row" onClick={() => onTheme('light')}>
            Light
            <span className="ph-set-value">{theme === 'light' ? 'On' : ''}</span>
          </button>
          <button type="button" className="ph-set-row" onClick={() => onTheme('dark')}>
            Dark
            <span className="ph-set-value">{theme === 'dark' ? 'On' : ''}</span>
          </button>
        </div>

        <div className="ph-set-head">About</div>
        <div className="ph-set-group">
          <div className="ph-set-row" style={{ cursor: 'default' }}>
            Model
            <span className="ph-set-value">{handset}</span>
          </div>
          <div className="ph-set-row" style={{ cursor: 'default' }}>
            Date And Time
            <span className="ph-set-value">Set By The World</span>
          </div>
        </div>

        <p className="ph-empty" style={{ paddingTop: 18 }}>
          The clock on this phone is the game&rsquo;s clock. Time spent in an app is time
          spent in the day. The handset is the newest one SLATE knows of, or the one you
          bought, and its marks are drawn rather than copied.
        </p>
      </div>
    </div>
  );
}
