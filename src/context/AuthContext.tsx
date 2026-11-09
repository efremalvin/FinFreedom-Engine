'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, GDriveSyncStatus, AuthContextType } from '@/types/auth';
import { SavedScenario, AccumulationParams, DecumulationParams, TabType } from '@/types/simulator';
import {
  getLocalScenarios,
  saveLocalScenarios,
  syncWithGoogleDrive,
  DEFAULT_DEMO_SCENARIOS,
} from '@/services/gdriveStorage';

const USER_SESSION_KEY = 'finfreedom_user_session';
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '377514636299-db8b7pju2ibccuj71cj9bd34dskc8cb2.apps.googleusercontent.com';

interface ExtendedAuthContextType extends AuthContextType {
  saveScenarioWithData: (
    name: string,
    description: string,
    activeTab: TabType,
    accumParams: AccumulationParams,
    decumParams: DecumulationParams
  ) => Promise<SavedScenario>;
}

const AuthContext = createContext<ExtendedAuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<GDriveSyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // Fetch user profile and sync with Google Drive
  const fetchGoogleUserInfo = useCallback(
    async (token: string, currentScenarios?: SavedScenario[]) => {
      try {
        setSyncStatus('syncing');
        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userRes.ok) {
          const info = await userRes.json();
          const profile: UserProfile = {
            id: info.sub,
            name: info.name,
            email: info.email,
            avatarUrl: info.picture,
            isDemoUser: false,
          };
          setUser(profile);

          // Sync with Google Drive
          const activeScenarios = currentScenarios || scenarios;
          const syncResult = await syncWithGoogleDrive(token, activeScenarios);
          if (syncResult.success) {
            setScenarios(syncResult.syncedScenarios);
            setSyncStatus('synced');
            setLastSyncedAt(new Date());
          }
        } else {
          setSyncStatus('error');
        }
      } catch (err) {
        console.error('Error fetching userinfo from Google:', err);
        setSyncStatus('error');
      }
    },
    [scenarios]
  );

  // Initialize scenarios from local storage on mount & check for OAuth redirect token
  useEffect(() => {
    const local = getLocalScenarios();
    setScenarios(local);

    // 1. Check if returning from Google OAuth Redirect flow (#access_token=...)
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
      try {
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : window.location.hash;
        const params = new URLSearchParams(hash);
        const token = params.get('access_token');
        if (token) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          setAccessToken(token);
          fetchGoogleUserInfo(token, local);
          return;
        }
      } catch (err) {
        console.error('Failed to parse OAuth redirect hash:', err);
      }
    }

    // 2. Restore cached session if any
    try {
      const cached = localStorage.getItem(USER_SESSION_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.user) {
          setUser(parsed.user);
          if (parsed.accessToken) {
            setAccessToken(parsed.accessToken);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [fetchGoogleUserInfo]);

  // Save session changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify({ user, accessToken }));
    } else {
      localStorage.removeItem(USER_SESSION_KEY);
    }
  }, [user, accessToken]);

  // Synchronize with Google Drive
  const triggerSync = useCallback(async () => {
    if (!accessToken || !user || user.isDemoUser) {
      setSyncStatus('idle');
      return;
    }

    setSyncStatus('syncing');
    const result = await syncWithGoogleDrive(accessToken, scenarios);
    if (result.success) {
      setScenarios(result.syncedScenarios);
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } else {
      setSyncStatus('error');
    }
  }, [accessToken, user, scenarios]);

  // Login Demo Mode (Works instantly without requiring Google Cloud Console credentials)
  const loginDemo = useCallback(() => {
    const demoUser: UserProfile = {
      id: 'demo-user-123',
      name: 'Budi Santoso',
      email: 'budi.santoso@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      isDemoUser: true,
    };
    setUser(demoUser);
    setAccessToken('demo-token');
    setSyncStatus('synced');
    setLastSyncedAt(new Date());
    if (scenarios.length === 0) {
      setScenarios(DEFAULT_DEMO_SCENARIOS);
      saveLocalScenarios(DEFAULT_DEMO_SCENARIOS);
    }
  }, [scenarios]);

  // Login with Google OAuth (Full-Page Redirect Flow)
  // Completely immune to popup blockers across all browsers (Chrome, Safari, Brave, mobile)
  const loginWithGoogle = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      alert('NEXT_PUBLIC_GOOGLE_CLIENT_ID belum diatur di .env. Mengaktifkan Mode Demo Login untuk uji coba.');
      loginDemo();
      return;
    }

    if (typeof window === 'undefined') return;

    const origin = window.location.origin;
    const scopes = [
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid',
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      GOOGLE_CLIENT_ID
    )}&redirect_uri=${encodeURIComponent(origin)}&response_type=token&scope=${encodeURIComponent(
      scopes
    )}&prompt=select_account`;

    // Direct navigation: no popup blocker can block this!
    window.location.href = authUrl;
  }, [loginDemo]);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setSyncStatus('idle');
    setLastSyncedAt(null);
    setActiveScenarioId(null);
  }, []);

  const saveScenarioWithData = useCallback(
    async (
      name: string,
      description: string,
      activeTab: TabType,
      accumParams: AccumulationParams,
      decumParams: DecumulationParams
    ): Promise<SavedScenario> => {
      const newScenario: SavedScenario = {
        id: `scen-${Date.now()}`,
        name: name.trim() || `Skenario ${new Date().toLocaleDateString('id-ID')}`,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activeTab,
        accumParams,
        decumParams,
      };

      const updated = [newScenario, ...scenarios.filter((s) => s.id !== newScenario.id)];
      setScenarios(updated);
      saveLocalScenarios(updated);
      setActiveScenarioId(newScenario.id);

      if (accessToken && user && !user.isDemoUser) {
        setSyncStatus('syncing');
        const res = await syncWithGoogleDrive(accessToken, updated);
        if (res.success) {
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
        }
      } else {
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
      }

      return newScenario;
    },
    [scenarios, accessToken, user]
  );

  const saveCurrentScenario = useCallback(
    async (name: string, description?: string): Promise<SavedScenario> => {
      // Fallback signature for AuthContextType interface
      const defaultScen: SavedScenario = {
        id: `scen-${Date.now()}`,
        name: name || 'Skenario Baru',
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activeTab: 'accumulation',
        accumParams: scenarios[0]?.accumParams || ({} as any),
        decumParams: scenarios[0]?.decumParams || ({} as any),
      };
      return defaultScen;
    },
    [scenarios]
  );

  const loadScenario = useCallback((scenario: SavedScenario) => {
    setActiveScenarioId(scenario.id);
  }, []);

  const deleteScenario = useCallback(
    async (scenarioId: string) => {
      const updated = scenarios.filter((s) => s.id !== scenarioId);
      setScenarios(updated);
      saveLocalScenarios(updated);
      if (activeScenarioId === scenarioId) {
        setActiveScenarioId(null);
      }

      if (accessToken && user && !user.isDemoUser) {
        setSyncStatus('syncing');
        const res = await syncWithGoogleDrive(accessToken, updated);
        if (res.success) {
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
        }
      }
    },
    [scenarios, activeScenarioId, accessToken, user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isDemo: !!user?.isDemoUser,
        syncStatus,
        lastSyncedAt,
        scenarios,
        activeScenarioId,
        loginWithGoogle,
        loginDemo,
        logout,
        saveCurrentScenario,
        saveScenarioWithData,
        loadScenario,
        deleteScenario,
        triggerSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
