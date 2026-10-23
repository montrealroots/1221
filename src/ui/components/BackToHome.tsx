/**
 * The way back to Home from the screens Home opens and the menu doesn't, Calendar and Updates (`homeOnly`, from
 * 2026-10-23, the owner's brief 24: "Give both screens a clear route back to Home"): a button at the head of the page,
 * at every size, whatever trail led there. Until then each was on the menu, and the trail was the only way back but the
 * menu's Home.
 */

import { useGame } from '@/app/game-context';

export function BackToHome() {
  const { navigate } = useGame();
  return (
    <button type="button" className="btn btn-ghost btn-sm back-home" onClick={() => navigate('/home', 'Home')}>
      Back To Home
    </button>
  );
}
