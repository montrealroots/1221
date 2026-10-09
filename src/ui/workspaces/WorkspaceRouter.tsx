import { CalendarWorkspace } from './CalendarWorkspace';
import { BankWorkspace } from './BankWorkspace';
import { SchoolWorkspace } from './SchoolWorkspace';
import { PapersWorkspace } from './PapersWorkspace';
import { ProfileWorkspace } from './ProfileWorkspace';

// The career's, the homes', travel's, the cars' and the land's screens went in the scope reset of 2026-10-09.
const WORKSPACES: Record<string, () => JSX.Element> = {
  '/workspace/calendar': CalendarWorkspace,
  '/workspace/bank': BankWorkspace,
  '/workspace/school': SchoolWorkspace,
  '/workspace/papers': PapersWorkspace,
  '/workspace/profile': ProfileWorkspace,
};

export function WorkspaceRouter({ route }: { route: string }) {
  const Workspace = WORKSPACES[route];
  if (!Workspace) {
    return (
      <div className="empty">
        <h3>Not Built Yet</h3>
        <p className="small">That workspace doesn’t exist.</p>
      </div>
    );
  }
  return <Workspace />;
}
