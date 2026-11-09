import { SavedScenario } from './simulator';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isDemoUser?: boolean;
}

export type GDriveSyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isDemo: boolean;
  syncStatus: GDriveSyncStatus;
  lastSyncedAt: Date | null;
  scenarios: SavedScenario[];
  activeScenarioId: string | null;
  loginWithGoogle: () => Promise<void>;
  loginDemo: () => void;
  logout: () => void;
  saveCurrentScenario: (name: string, description?: string) => Promise<SavedScenario>;
  loadScenario: (scenario: SavedScenario) => void;
  deleteScenario: (scenarioId: string) => Promise<void>;
  triggerSync: () => Promise<void>;
}
