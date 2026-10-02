import { CalendarWorkspace } from './CalendarWorkspace';
import { BankWorkspace } from './BankWorkspace';
import { SchoolWorkspace } from './SchoolWorkspace';
import { CareerWorkspace } from './CareerWorkspace';
import { PapersWorkspace } from './PapersWorkspace';
import { HomesWorkspace } from './HomesWorkspace';
import { TravelWorkspace } from './TravelWorkspace';
import { VehiclesWorkspace } from './VehiclesWorkspace';
import { LandWorkspace } from './LandWorkspace';
import { BelongingsWorkspace } from './BelongingsWorkspace';
import { ClothesWorkspace } from './ClothesWorkspace';
import { FoodWorkspace } from './FoodWorkspace';
import { RoutinesWorkspace } from './RoutinesWorkspace';
import { PeopleWorkspace } from './PeopleWorkspace';

const WORKSPACES: Record<string, () => JSX.Element> = {
  '/workspace/calendar': CalendarWorkspace,
  '/workspace/bank': BankWorkspace,
  '/workspace/school': SchoolWorkspace,
  '/workspace/career': CareerWorkspace,
  '/workspace/papers': PapersWorkspace,
  '/workspace/homes': HomesWorkspace,
  '/workspace/travel': TravelWorkspace,
  '/workspace/vehicles': VehiclesWorkspace,
  '/workspace/land': LandWorkspace,
  '/workspace/belongings': BelongingsWorkspace,
  '/workspace/clothes': ClothesWorkspace,
  '/workspace/food': FoodWorkspace,
  '/workspace/routines': RoutinesWorkspace,
  '/workspace/people': PeopleWorkspace,
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
