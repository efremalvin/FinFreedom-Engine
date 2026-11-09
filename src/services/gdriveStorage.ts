import { SavedScenario } from '@/types/simulator';

const LOCAL_STORAGE_KEY = 'finfreedom_scenarios_v1';
const GDRIVE_FILENAME = 'finfreedom_scenarios.json';

// Built-in sample scenarios for initial exploration or demo mode
export const DEFAULT_DEMO_SCENARIOS: SavedScenario[] = [
  {
    id: 'demo-fire-aggressive',
    name: 'Target FIRE 40 Tahun (Agresif Saham & DRIP)',
    description: 'Investasi rutin Rp 5 Jt/bln, imbal hasil 11% + DRIP Dividen 3.5%',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activeTab: 'accumulation',
    accumParams: {
      initialCapital: 50_000_000,
      monthlyInvestment: 5_000_000,
      targetMonthlyExpense: 15_000_000,
      annualReturn: 11.0,
      annualInflation: 3.5,
      timeHorizonYears: 15,
      swrMultiplier: 28.57, // 3.5%
      dividendYield: 3.5,
      reinvestDividends: true,
    },
    decumParams: {
      initialRetirementBalance: 5_000_000_000,
      firstYearExpense: 180_000_000,
      annualPortfolioReturn: 8.0,
      annualInflationRate: 4.0,
      retirementYears: 30,
      useAutomaticFirstYearExpense: true,
      dividendYield: 4.0,
    },
  },
  {
    id: 'demo-fire-dividend-cashflow',
    name: 'Pensiun Tenang Dividen IHSG (Yield 5.0%)',
    description: 'Strategi pemburu dividen tinggi IDX High Dividend 20 untuk passive cashflow',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activeTab: 'accumulation',
    accumParams: {
      initialCapital: 100_000_000,
      monthlyInvestment: 8_000_000,
      targetMonthlyExpense: 20_000_000,
      annualReturn: 9.0,
      annualInflation: 3.0,
      timeHorizonYears: 12,
      swrMultiplier: 25,
      dividendYield: 5.0,
      reinvestDividends: true,
    },
    decumParams: {
      initialRetirementBalance: 6_000_000_000,
      firstYearExpense: 240_000_000,
      annualPortfolioReturn: 7.5,
      annualInflationRate: 3.5,
      retirementYears: 35,
      useAutomaticFirstYearExpense: true,
      dividendYield: 5.0,
    },
  },
];

/**
 * Get scenarios stored in LocalStorage (Local-First)
 */
export function getLocalScenarios(): SavedScenario[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_DEMO_SCENARIOS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DEMO_SCENARIOS;
  } catch {
    return DEFAULT_DEMO_SCENARIOS;
  }
}

/**
 * Save scenarios into LocalStorage
 */
export function saveLocalScenarios(scenarios: SavedScenario[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scenarios));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

/**
 * Sync scenarios with Google Drive AppDataFolder
 * Endpoint: https://www.googleapis.com/drive/v3/files?spaces=appDataFolder
 */
export async function syncWithGoogleDrive(
  accessToken: string,
  localScenarios: SavedScenario[]
): Promise<{ success: boolean; syncedScenarios: SavedScenario[]; error?: string }> {
  try {
    // 1. Search if finfreedom_scenarios.json already exists in appDataFolder
    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${GDRIVE_FILENAME}'&fields=files(id,name,modifiedTime)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!listRes.ok) {
      const errText = await listRes.text();
      return { success: false, syncedScenarios: localScenarios, error: errText };
    }

    const listData = await listRes.json();
    const existingFile = listData.files && listData.files[0];

    let mergedScenarios = [...localScenarios];

    if (existingFile && existingFile.id) {
      // 2. Download remote content
      const downloadRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (downloadRes.ok) {
        try {
          const remoteScenarios: SavedScenario[] = await downloadRes.json();
          if (Array.isArray(remoteScenarios)) {
            // Merge remote and local by id, keeping the newer updatedAt
            const map = new Map<string, SavedScenario>();
            for (const item of remoteScenarios) {
              map.set(item.id, item);
            }
            for (const item of localScenarios) {
              const existing = map.get(item.id);
              if (!existing || new Date(item.updatedAt) >= new Date(existing.updatedAt)) {
                map.set(item.id, item);
              }
            }
            mergedScenarios = Array.from(map.values());
          }
        } catch {
          // If remote file parsing failed, proceed with local
        }
      }

      // 3. Update existing file in appDataFolder
      const uploadRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mergedScenarios, null, 2),
        }
      );

      if (!uploadRes.ok) {
        return { success: false, syncedScenarios: mergedScenarios, error: 'Update failed' };
      }
    } else {
      // 4. Create new file in appDataFolder with multipart upload
      const metadata = {
        name: GDRIVE_FILENAME,
        parents: ['appDataFolder'],
        mimeType: 'application/json',
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(mergedScenarios, null, 2) +
        closeDelim;

      const createRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!createRes.ok) {
        return { success: false, syncedScenarios: mergedScenarios, error: 'Create file failed' };
      }
    }

    // Update local storage with merged scenarios
    saveLocalScenarios(mergedScenarios);

    return {
      success: true,
      syncedScenarios: mergedScenarios,
    };
  } catch (err: any) {
    return {
      success: false,
      syncedScenarios: localScenarios,
      error: err?.message || 'Sync error',
    };
  }
}
