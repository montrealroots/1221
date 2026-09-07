/**
 * The emoji beside a comment box.
 *
 * SLATE's own interface is words, and a test holds that line. These apps are
 * not SLATE's interface: they are other people's, and a comment box on one of
 * them has a row of faces over it because that is what the app has. So this
 * lives inside the phone, where the guard is lifted, and nowhere else.
 *
 * The quick row is each app's own — the six YouTube offers, the eight
 * Instagram offers — and the drawer behind the smiley is the rest of what a
 * person actually reaches for. Tapping one puts it in the box, which is the
 * whole behavior: nothing here posts on its own.
 */

import { useState } from 'react';

/** What each app puts in the row over its comment box. */
export const QUICK: Readonly<Record<'video' | 'photo' | 'text', readonly string[]>> = {
  video: ['😂', '😮', '😍', '🔥', '👏', '🙏'],
  photo: ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'],
  text: ['😂', '🔥', '💯', '👀', '🙏', '😭'],
};

/** The rest of them, in the order a picker actually lists them. */
const DRAWER: readonly string[] = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍',
  '🥰', '😘', '😗', '😋', '😜', '🤪', '🤗', '🤔', '🤨', '😐', '😑', '🙄',
  '😏', '😴', '😪', '😷', '🤒', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁',
  '😢', '😭', '😤', '😠', '😡', '🤯', '😳', '🥺', '😱', '😨', '😰', '😥',
  '👍', '👎', '👏', '🙌', '🙏', '💪', '👀', '🔥', '💯', '✨', '⭐', '🎉',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💕', '😻', '🐐',
];

export function EmojiRow({
  app, onPick,
}: { app: 'video' | 'photo' | 'text'; onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ph-emoji">
      <div className="ph-emoji-row">
        {QUICK[app].map((emoji) => (
          <button key={emoji} type="button" onClick={() => onPick(emoji)} aria-label={`Add ${emoji}`}>
            {emoji}
          </button>
        ))}
        <button
          type="button"
          className="ph-emoji-more"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close The Emoji' : 'More Emoji'}
        >
          {open ? '×' : '☺'}
        </button>
      </div>
      {open && (
        <div className="ph-emoji-drawer">
          {DRAWER.map((emoji) => (
            <button key={emoji} type="button" onClick={() => onPick(emoji)} aria-label={`Add ${emoji}`}>
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
