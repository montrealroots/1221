import { CalendarWorkspace } from './CalendarWorkspace';
import { BusinessWorkspace } from './BusinessWorkspace';
import { AuditionsWorkspace } from './AuditionsWorkspace';

const WORKSPACES: Record<string, () => JSX.Element> = {
  '/workspace/calendar': CalendarWorkspace,
  '/workspace/business': BusinessWorkspace,
  '/workspace/auditions': AuditionsWorkspace,
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
