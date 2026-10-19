import { CalendarWorkspace } from './CalendarWorkspace';
import { BankWorkspace } from './BankWorkspace';
import { SchoolWorkspace } from './SchoolWorkspace';
import { PapersWorkspace } from './PapersWorkspace';
import { ProfileWorkspace } from './ProfileWorkspace';
import { useGame, useWorld } from '@/app/game-context';
import { ALL_DESTINATIONS } from '@/ui/shell/destinations';
import { chapterFor, isOpen } from '@/engine/world/tutorial';
import { useGuide } from '@/ui/guide/Guide';

// The career's, the homes', travel's, the cars' and the land's screens went in the scope reset of 2026-10-09.
const WORKSPACES: Record<string, () => JSX.Element> = {
  '/workspace/calendar': CalendarWorkspace,
  '/workspace/bank': BankWorkspace,
  '/workspace/school': SchoolWorkspace,
  '/workspace/papers': PapersWorkspace,
  '/workspace/profile': ProfileWorkspace,
};

/**
 * A screen, once its chapter is read. From 2026-10-12 a screen whose chapter isn't read opens as Locked, with the
 * chapter and the way into it, however it was reached: until then only the Player Profile checked, and a link, the C
 * key, a notice's Go There or the Profile's own buttons opened School, Money or Papers before their chapters.
 */
export function WorkspaceRouter({ route }: { route: string }) {
  const Workspace = WORKSPACES[route];
  const feature = ALL_DESTINATIONS.find((d) => d.route === route)?.feature;
  const open = useWorld((s) => !feature || isOpen(s, feature), [feature]);
  if (!Workspace) return <NoSuchScreen />;
  if (!open) return <LockedScreen feature={feature!} />;
  return <Workspace />;
}

/** A screen not open yet: its name, the chapter that opens it, and the way to read it. */
export function LockedScreen({ feature }: { feature: string }) {
  const guide = useGuide();
  const chapter = chapterFor(feature);
  const label = ALL_DESTINATIONS.find((d) => d.feature === feature)?.label ?? 'This Screen';
  return (
    <div className="empty">
      <h3>{label}, Locked</h3>
      <p className="small">{chapter ? `Read “${chapter.title}” in the guide to open it. ${chapter.lead}` : 'It isn’t open yet.'}</p>
      {chapter && <button type="button" className="btn btn-primary" onClick={() => guide.show(chapter.id)}>Read About It</button>}
    </div>
  );
}

/** An address for a screen that isn't in the game (an old bookmark): said, with the way home. */
function NoSuchScreen() {
  const { navigate } = useGame();
  return (
    <div className="empty">
      <h3>No Such Screen</h3>
      <p className="small">That address isn’t a screen in this game.</p>
      <button type="button" className="btn btn-primary" onClick={() => navigate('/home', 'Home')}>Go Home</button>
    </div>
  );
}
