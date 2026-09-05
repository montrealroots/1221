import { TutorialCard } from '@/ui/shell/Tutorial';
import { CalendarWorkspace } from './CalendarWorkspace';
import { BankWorkspace } from './BankWorkspace';
import { WorkWorkspace } from './WorkWorkspace';
import { WellbeingWorkspace } from './WellbeingWorkspace';
import { CharacterWorkspace } from './CharacterWorkspace';
import { SettingsWorkspace } from './SettingsWorkspace';
import { HistoryWorkspace } from './HistoryWorkspace';
import { RelationshipsWorkspace } from './RelationshipsWorkspace';
import { PropertyWorkspace } from './PropertyWorkspace';
import { VehiclesWorkspace } from './VehiclesWorkspace';
import { ShoppingWorkspace } from './ShoppingWorkspace';
import { TravelWorkspace } from './TravelWorkspace';
import { HealthWorkspace } from './HealthWorkspace';
import { InsuranceWorkspace } from './InsuranceWorkspace';
import { EducationWorkspace } from './EducationWorkspace';
import { SocialWorkspace } from './SocialWorkspace';
import { CityWorkspace } from './CityWorkspace';

const WORKSPACES: Record<string, () => JSX.Element> = {
  '/workspace/calendar': CalendarWorkspace,
  '/workspace/bank': BankWorkspace,
  '/workspace/jobs': WorkWorkspace,
  '/workspace/wellbeing': WellbeingWorkspace,
  '/workspace/character': CharacterWorkspace,
  '/workspace/settings': SettingsWorkspace,
  '/workspace/history': HistoryWorkspace,
  '/workspace/relationships': RelationshipsWorkspace,
  '/workspace/property': PropertyWorkspace,
  '/workspace/vehicles': VehiclesWorkspace,
  '/workspace/shopping': ShoppingWorkspace,
  '/workspace/travel': TravelWorkspace,
  '/workspace/city': CityWorkspace,
  '/workspace/health': HealthWorkspace,
  '/workspace/insurance': InsuranceWorkspace,
  '/workspace/education': EducationWorkspace,
  '/workspace/social': SocialWorkspace,
};

export function WorkspaceRouter({ route }: { route: string }) {
  const Workspace = WORKSPACES[route];
  if (!Workspace) {
    return (
      <div className="empty">
        <h3>Nothing Here Yet</h3>
        <p className="small">That workspace does not exist. Use Go Anywhere to find what you were after.</p>
      </div>
    );
  }
  return (
    <>
      <Workspace />
      <TutorialCard />
    </>
  );
}
