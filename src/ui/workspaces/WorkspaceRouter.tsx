import { CalendarWorkspace } from './CalendarWorkspace';
import { ProductionCompaniesWorkspace } from './ProductionCompaniesWorkspace';

const WORKSPACES: Record<string, () => JSX.Element> = {
  '/workspace/calendar': CalendarWorkspace,
  '/workspace/production-companies': ProductionCompaniesWorkspace,
};

export function WorkspaceRouter({ route }: { route: string }) {
  const Workspace = WORKSPACES[route];
  if (!Workspace) {
    return (
      <div className="empty">
        <h3>Nothing Here Yet</h3>
        <p className="small">That workspace doesn’t exist.</p>
      </div>
    );
  }
  return <Workspace />;
}
