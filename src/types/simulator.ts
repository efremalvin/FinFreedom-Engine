export type TabType = 'accumulation' | 'decumulation';

export type SWRMultiplierOption = 25 | 28.57 | 30.77; // 4%, 3.5%, 3.25%

export interface AccumulationParams {
  initialCapital?: number;      // Modal Awal (Rp), mulai dari 0
  monthlyInvestment: number;    // Investasi Rutin per Bulan (Rp)
  targetMonthlyExpense: number; // Target Pengeluaran Hidup Bulanan saat FIRE (Rp)
  annualReturn: number;         // Asumsi Imbal Hasil Investasi Tahunan (%)
  annualInflation: number;      // Asumsi Inflasi Tahunan (%)
  timeHorizonYears: number;     // Horison Waktu Simulasi (Tahun)
  swrMultiplier: SWRMultiplierOption; // Pengali SWR: 25x, 28.5x, 30.77x
}

export interface AccumulationDataPoint {
  year: number;
  label: string;
  totalPortfolio: number;       // Total Nilai Portofolio (Bunga Bergulung) - Nominal
  totalPrincipal: number;       // Total Modal Disetor (Pokok) - Nominal
  compoundGain: number;         // Keuntungan Bunga Majemuk
  realPortfolio: number;        // Nilai Portofolio Riil (Disesuaikan Inflasi)
  realPrincipal: number;        // Nilai Pokok Riil (Disesuaikan Inflasi)
  targetFIRE: number;           // Target Dana FIRE
  isReached: boolean;
  fireDelta: number;            // Selisih nominal (+ surplus, 0 pas, - defisit)
  fireDeltaPercent: number;     // Persentase selisih thdp target (+/0/-)
  fireStatus: 'surplus' | 'exact' | 'deficit'; // Ketetapan status target FIRE
}

export interface AccumulationResult {
  dataPoints: AccumulationDataPoint[];
  finalPortfolio: number;
  finalPrincipal: number;
  finalRealPortfolio: number;
  finalRealPrincipal: number;
  finalGain: number;
  realReturnRate: number;
  targetFIRE: number;
  yearReached: number | null;   // null jika belum tercapai dalam horison
  safeMonthlyPassiveIncome: number;
  gainPercentage: number;
  finalFireDelta: number;        // Selisih akhir thdp target (+ surplus, 0 pas, - defisit)
  finalFireDeltaPercent: number; // Persentase selisih akhir (+/0/-)
  finalFireStatus: 'surplus' | 'exact' | 'deficit'; // Ketetapan status FIRE akhir
  achievementPercentage: number; // Persentase ketercapaian target FIRE (cth: 120% atau 85%)
}

export interface DecumulationParams {
  initialRetirementBalance: number; // Saldo Awal Pensiun (Rp)
  firstYearExpense: number;         // Pengeluaran Hidup Tahun Pertama (Rp)
  annualPortfolioReturn: number;    // Imbal Hasil Tahunan Portofolio (%)
  annualInflationRate: number;      // Laju Inflasi Rata-rata (%/tahun)
  retirementYears: number;          // Lama Masa Pensiun (Tahun)
  useAutomaticFirstYearExpense: boolean; // Jika true, 4% dari saldo awal
}

export interface DecumulationDataPoint {
  year: number;
  label: string;
  balanceStandard: number;          // Sisa Saldo SWR 4.0%
  withdrawalStandard: number;       // Penarikan SWR 4.0% tahun ini
  balanceConservative: number;      // Sisa Saldo SWR 3.25%
  withdrawalConservative: number;   // Penarikan SWR 3.25% tahun ini
  isStandardDepleted: boolean;
  isConservativeDepleted: boolean;
}

export interface DecumulationResult {
  dataPoints: DecumulationDataPoint[];
  standardFailureYear: number | null;      // Tahun ke berapa SWR 4% habis (Rp 0)
  conservativeFailureYear: number | null;  // Tahun ke berapa SWR 3.25% habis (Rp 0)
  finalBalanceStandard: number;
  finalBalanceConservative: number;
  totalWithdrawalStandard: number;
  totalWithdrawalConservative: number;
  firstYearWithdrawalStandard: number;
  firstYearWithdrawalConservative: number;
  lastYearWithdrawalStandard: number;
  lastYearWithdrawalConservative: number;
}
