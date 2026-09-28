import { CalendarWorkspace } from './CalendarWorkspace';
import { BankWorkspace } from './BankWorkspace';
import { SchoolWorkspace } from './SchoolWorkspace';
import { CareerWorkspace } from './CareerWorkspace';
import { PapersWorkspace } from './PapersWorkspace';

const WORKSPACES: Record<string, () => JSX.Element> = {
  '/workspace/calendar': CalendarWorkspace,
  '/workspace/bank': BankWorkspace,
  '/workspace/school': SchoolWorkspace,
  '/workspace/career': CareerWorkspace,
  '/workspace/papers': PapersWorkspace,
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
