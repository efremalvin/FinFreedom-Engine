'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  ShieldAlert,
  Wallet,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  RotateCcw,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  Percent,
  Eye,
  EyeOff,
  Filter,
  LayoutGrid,
  Table,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

import { NumericSliderInput } from './ui/NumericSliderInput';
import {
  formatIDR,
  formatCompactIDR,
  formatPercent,
  formatNumberWithDots,
} from '@/utils/formatters';
import {
  calculateAccumulation,
  calculateDecumulation,
} from '@/utils/financialCalculations';
import {
  TabType,
  SWRMultiplierOption,
  AccumulationParams,
  AccumulationDataPoint,
  DecumulationParams,
  SavedScenario,
} from '@/types/simulator';
import { UserAuthMenu } from './ui/UserAuthMenu';
import { useAuth } from '@/context/AuthContext';

// Initial Defaults for Modul A
const defaultAccumulationParams: AccumulationParams = {
  initialCapital: 0, // Ditetapkan mulai dari 0 rupiah
  monthlyInvestment: 5_000_000,
  targetMonthlyExpense: 10_000_000,
  annualReturn: 10.0,
  annualInflation: 4.0,
  timeHorizonYears: 20,
  swrMultiplier: 25,
  dividendYield: 3.5,
  reinvestDividends: true,
};

// Initial Defaults for Modul B
const defaultDecumulationParams: DecumulationParams = {
  initialRetirementBalance: 3_000_000_000,
  firstYearExpense: 120_000_000,
  annualPortfolioReturn: 8.0,
  annualInflationRate: 4.5,
  retirementYears: 30,
  useAutomaticFirstYearExpense: true,
  dividendYield: 3.5,
};

export const FinFreedomEngine: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('accumulation');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<'params' | 'results' | 'all'>('all');
  const [mobileTableView, setMobileTableView] = useState<'card' | 'table'>('card');
  const [useCompactNumbers, setUseCompactNumbers] = useState<boolean>(true);
  const [tableDisplayLimit, setTableDisplayLimit] = useState<number>(15);
  const [isMinimalMode, setIsMinimalMode] = useState<boolean>(false);
  const [showConfirmToast, setShowConfirmToast] = useState<boolean>(false);
  const { isAuthenticated, saveScenarioWithData } = useAuth() as any;

  const handleConfirmAndSave = async () => {
    try {
      if (saveScenarioWithData) {
        await saveScenarioWithData(
          `Pilihan ${activeTab === 'accumulation' ? 'Akumulasi' : 'Dekumulasi'}`,
          `Dikonfirmasi pada ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
          activeTab,
          accumParams,
          decumParams
        );
      }
    } catch {
      // fallback
    }

    setIsMinimalMode(true);
    setShowConfirmToast(true);
    setTimeout(() => {
      setShowConfirmToast(false);
    }, 4000);
  };

  // Modul A State
  const [accumParams, setAccumParams] =
    useState<AccumulationParams>(defaultAccumulationParams);

  // Modul A Chart Series Filter (4 graphs: 2 nominal + 2 adjusted for inflation)
  const [chartFilters, setChartFilters] = useState({
    nominalPortfolio: true,
    nominalPrincipal: true,
    realPortfolio: true,
    realPrincipal: true,
  });

  // Modul B State
  const [decumParams, setDecumParams] =
    useState<DecumulationParams>(defaultDecumulationParams);

  // Live Indonesia Inflation State (from /api/inflation)
  const [liveInflation, setLiveInflation] = useState<{ rate: number; source: string } | null>(null);
  const [isLoadingInflation, setIsLoadingInflation] = useState<boolean>(false);

  // Client hydration check & Fetch live Indonesia inflation
  useEffect(() => {
    setMounted(true);
    // Sync html dark class
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }

    setIsLoadingInflation(true);
    fetch('/api/inflation')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.currentRate === 'number') {
          setLiveInflation({ rate: data.currentRate, source: data.source });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingInflation(false));
  }, []);

  const applyLiveInflation = () => {
    if (liveInflation) {
      setAccumParams((prev) => ({ ...prev, annualInflation: liveInflation.rate }));
      setDecumParams((prev) => ({ ...prev, annualInflationRate: liveInflation.rate }));
    }
  };

  const handleApplyScenario = (scenario: SavedScenario) => {
    setActiveTab(scenario.activeTab);
    setAccumParams(scenario.accumParams);
    setDecumParams(scenario.decumParams);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  // Perform Calculations
  const accumulationResult = useMemo(() => {
    return calculateAccumulation(accumParams);
  }, [accumParams]);

  const decumulationResult = useMemo(() => {
    return calculateDecumulation(decumParams);
  }, [decumParams]);

  const totalTablePoints = activeTab === 'accumulation'
    ? accumulationResult.dataPoints.length
    : decumulationResult.dataPoints.length;

  const displayedAccumulationPoints = useMemo(() => {
    return accumulationResult.dataPoints.slice(0, tableDisplayLimit);
  }, [accumulationResult.dataPoints, tableDisplayLimit]);

  const displayedDecumulationPoints = useMemo(() => {
    return decumulationResult.dataPoints.slice(0, tableDisplayLimit);
  }, [decumulationResult.dataPoints, tableDisplayLimit]);

  // Keep Modul B first year expense synced if automatic is checked
  const handleDecumInitialBalanceChange = (newBalance: number) => {
    setDecumParams((prev) => ({
      ...prev,
      initialRetirementBalance: newBalance,
      firstYearExpense: prev.useAutomaticFirstYearExpense
        ? Math.round(newBalance * 0.04)
        : prev.firstYearExpense,
    }));
  };

  if (!mounted) {
    return (
      <div className="w-full min-h-[600px] flex flex-col items-center justify-center gap-3 bg-zinc-950 text-zinc-400">
        <div className="w-12 h-12 animate-pulse">
          <img src="/FinFreeLogo.png" alt="FinFreedom Engine" className="w-full h-full object-contain" />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span>Memuat Simulator Finansial...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-6 sm:py-6 lg:px-8 space-y-4 sm:space-y-6">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-zinc-800/80">
        <div className="min-w-0 flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-zinc-900/90 border border-emerald-500/30 p-1 flex items-center justify-center shadow-lg shadow-emerald-500/15 hover:border-emerald-500/50 transition-all">
            <img
              src="/FinFreeLogo.png"
              alt="FinFreedom Engine Logo"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-100 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span>FinFreedom Engine</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ID Edition
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1 sm:line-clamp-none">
              Arsitektur Finansial FIRE & Pengujian Ketahanan Portofolio Pensiun Indonesia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsMinimalMode(!isMinimalMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isMinimalMode
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title={isMinimalMode ? 'Buka panel slider' : 'Sederhanakan tampilan (sembunyikan slider)'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isMinimalMode ? 'Buka Slider' : 'Mode Minimalis'}</span>
          </button>

          <UserAuthMenu
            currentAccumParams={accumParams}
            currentDecumParams={decumParams}
            currentActiveTab={activeTab}
            onApplyScenario={handleApplyScenario}
          />

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-all"
            title="Ganti Tema Tampilan"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Floating Toast: Konfirmasi & Simpan Berhasil */}
      {showConfirmToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-zinc-900/95 border border-emerald-500/50 rounded-2xl shadow-2xl shadow-emerald-950/50 backdrop-blur-md text-emerald-200 text-xs sm:text-sm animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white">Pilihan Berhasil Disimpan!</div>
            <div className="text-[11px] text-emerald-300/80">Tampilan disederhanakan tanpa slider untuk visualisasi lebih bersih.</div>
          </div>
        </div>
      )}

      {/* Module Tab Switcher */}
      <nav aria-label="Simulasi Finansial Tab" className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800/90 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-2 w-full sm:w-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('accumulation')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${
              activeTab === 'accumulation'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">1. Akumulasi Dana FIRE</span>
            <span className="sm:hidden">1. Akumulasi</span>
            <span
              className={`hidden md:inline-block text-[10px] px-1.5 py-0.2 rounded-md ${
                activeTab === 'accumulation'
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              Wealth
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decumulation')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${
              activeTab === 'decumulation'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">2. Uji Ketahanan SWR</span>
            <span className="sm:hidden">2. Uji SWR</span>
            <span
              className={`hidden md:inline-block text-[10px] px-1.5 py-0.2 rounded-md ${
                activeTab === 'decumulation'
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              Stress-Test
            </span>
          </button>
        </div>

        {/* Quick info tag */}
        <div className="hidden lg:flex items-center gap-2 pr-3 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Compound & Decumulation Engine v2.4</span>
        </div>
      </nav>

      {/* Sticky Mobile Live Scoreboard & View Switcher */}
      <div className="lg:hidden sticky top-2 z-30 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/90 rounded-2xl p-2.5 shadow-2xl shadow-black/80 space-y-2">
        {activeTab === 'accumulation' ? (
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                <span>Porto ({accumParams.timeHorizonYears} Thn):</span>
                <span className="text-sky-400 font-semibold">
                  Riil {formatCompactIDR(accumulationResult.finalRealPortfolio)}
                </span>
              </div>
              <div className="text-sm font-extrabold text-emerald-400 tabular-nums truncate">
                {formatCompactIDR(accumulationResult.finalPortfolio)}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] text-zinc-400">
                Target FIRE: <strong className="text-zinc-200">{formatCompactIDR(accumulationResult.targetFIRE)}</strong>
              </div>
              <div
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border mt-0.5 tabular-nums ${
                  accumulationResult.finalFireStatus === 'surplus'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : accumulationResult.finalFireStatus === 'exact'
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                }`}
              >
                {accumulationResult.finalFireStatus === 'surplus'
                  ? `✓ +${formatCompactIDR(accumulationResult.finalFireDelta)}`
                  : accumulationResult.finalFireStatus === 'exact'
                  ? '✓ Pas 100%'
                  : `✗ -${formatCompactIDR(Math.abs(accumulationResult.finalFireDelta))}`}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <div className="text-[10px] text-zinc-400">
                Saldo Pensiun ({decumParams.retirementYears} Thn)
              </div>
              <div className="text-sm font-extrabold text-amber-400 tabular-nums truncate">
                {formatCompactIDR(decumParams.initialRetirementBalance)}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] text-zinc-400">
                SWR 3.25%: <strong className="text-emerald-400">{formatCompactIDR(decumulationResult.finalBalanceConservative)}</strong>
              </div>
              <div
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${
                  decumulationResult.standardFailureYear !== null
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {decumulationResult.standardFailureYear !== null
                  ? `⚠ 4% Habis Thn ${decumulationResult.standardFailureYear}`
                  : '✓ 4% & 3.25% Aman'}
              </div>
            </div>
          </div>
        )}

        {/* 3-Way Segmented Mobile View Control */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-900/90 border border-zinc-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => setMobileView('all')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
              mobileView === 'all'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Semua</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('params')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
              mobileView === 'params'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wallet className="w-3 h-3" />
            <span>Input</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('results')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
              mobileView === 'results'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>Grafik</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport (2-Column Grid on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* ========================================================================= */}
        {/* TAB 1: MODUL A - AKUMULASI DANA MENUJU FINANCIAL FREEDOM */}
        {/* ========================================================================= */}
        {activeTab === 'accumulation' && (
          <>
            {/* Left Column: Control Panel */}
            <div className={`lg:col-span-5 space-y-4 sm:space-y-5 ${mobileView === 'results' ? 'hidden lg:block' : 'block'}`}>
              {isMinimalMode ? (
                /* Card Ringkasan Minimalis (Tanpa Slider) */
                <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-zinc-100">Pilihan Terkonfirmasi</h2>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">Tersimpan</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">Mode ringkas tanpa deretan slider</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMinimalMode(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 border border-zinc-700 hover:border-zinc-600 transition"
                      title="Buka panel slider untuk mengubah nilai"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ubah Parameter</span>
                    </button>
                  </div>

                  {/* Key-Value Summary Grid */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-0.5">
                      <span className="text-[11px] text-zinc-400">Investasi Rutin</span>
                      <div className="text-sm font-bold text-emerald-400">{formatIDR(accumParams.monthlyInvestment)}</div>
                      <div className="text-[10px] text-zinc-400">per bulan (DCA)</div>
                    </div>
                    <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-0.5">
                      <span className="text-[11px] text-zinc-400">Target Biaya Hidup</span>
                      <div className="text-sm font-bold text-zinc-100">{formatIDR(accumParams.targetMonthlyExpense)}</div>
                      <div className="text-[10px] text-zinc-400">per bulan saat FIRE</div>
                    </div>
                    <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-0.5">
                      <span className="text-[11px] text-zinc-400">Return Portofolio</span>
                      <div className="text-sm font-bold text-zinc-100">{accumParams.annualReturn}% / thn</div>
                      <div className="text-[10px] text-emerald-400">
                        Dividen: {accumParams.dividendYield ?? 3.5}% ({accumParams.reinvestDividends !== false ? 'DRIP' : 'Tunai'})
                      </div>
                    </div>
                    <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-0.5">
                      <span className="text-[11px] text-zinc-400">Laju Inflasi</span>
                      <div className="text-sm font-bold text-zinc-100">{accumParams.annualInflation}% / thn</div>
                      <div className="text-[10px] text-zinc-400">Riil: {accumulationResult.realReturnRate.toFixed(1)}%/thn</div>
                    </div>
                    <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-0.5">
                      <span className="text-[11px] text-zinc-400">Horison Waktu</span>
                      <div className="text-sm font-bold text-zinc-100">{accumParams.timeHorizonYears} Tahun</div>
                      <div className="text-[10px] text-zinc-400">Masa akumulasi dana</div>
                    </div>
                    <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-0.5">
                      <span className="text-[11px] text-zinc-400">Aturan SWR</span>
                      <div className="text-sm font-bold text-zinc-100">{accumParams.swrMultiplier === 25 ? '4.0% (25x)' : '3.25% (30.8x)'}</div>
                      <div className="text-[10px] text-zinc-400">Target: {formatCompactIDR(accumulationResult.targetFIRE)}</div>
                    </div>
                  </div>

                  {/* Button to open sliders */}
                  <button
                    type="button"
                    onClick={() => setIsMinimalMode(false)}
                    className="w-full py-2.5 px-4 rounded-xl border border-zinc-700/80 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Buka Slider untuk Mengubah Parameter</span>
                  </button>

                  {/* Mobile Quick Action Bar to View Results */}
                  <div className="lg:hidden pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] text-zinc-400">Target FIRE: {formatCompactIDR(accumulationResult.targetFIRE)}</div>
                      <div className={`text-xs font-bold truncate ${
                        accumulationResult.finalFireStatus === 'surplus'
                          ? 'text-emerald-400'
                          : accumulationResult.finalFireStatus === 'exact'
                          ? 'text-sky-400'
                          : 'text-rose-400'
                      }`}>
                        Porto: {formatCompactIDR(accumulationResult.finalPortfolio)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileView('results')}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition shrink-0"
                    >
                      <span>Lihat Grafik</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3.5 sm:p-5 shadow-lg space-y-3.5 sm:space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-zinc-100">
                        Parameter Akumulasi Portofolio
                      </h2>
                      <p className="text-[11px] text-zinc-400">
                        Sesuaikan tabungan bulanan, target biaya, dan imbal hasil
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAccumParams(defaultAccumulationParams)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
                    title="Reset ke Nilai Standar"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 1. Modal Awal Tetap: Mulai dari Rp 0 */}
                <div className="p-2.5 sm:p-3 bg-zinc-950/70 rounded-xl border border-zinc-800 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-zinc-300 font-medium">Modal Awal Portofolio:</span>
                  </div>
                  <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 shrink-0">
                    Rp 0 (Mulai dari Nol)
                  </span>
                </div>

                {/* 2. Investasi Rutin Bulanan */}
                <NumericSliderInput
                  label="Investasi Rutin per Bulan (DCA)"
                  value={accumParams.monthlyInvestment}
                  onChange={(val) =>
                    setAccumParams((prev) => ({ ...prev, monthlyInvestment: val }))
                  }
                  min={0}
                  max={50_000_000}
                  step={500_000}
                  prefix="Rp"
                  isCurrency={true}
                  tooltip="Dana yang Anda sisihkan secara konsisten setiap bulan untuk diinvestasikan."
                  quickPresets={[
                    { label: '2 Jt', value: 2_000_000 },
                    { label: '5 Jt', value: 5_000_000 },
                    { label: '10 Jt', value: 10_000_000 },
                    { label: '20 Jt', value: 20_000_000 },
                  ]}
                  accentColor="emerald"
                />

                {/* 3. Target Pengeluaran Hidup Bulanan saat FIRE */}
                <NumericSliderInput
                  label="Target Pengeluaran Hidup Bulanan saat Bebas Finansial"
                  value={accumParams.targetMonthlyExpense}
                  onChange={(val) =>
                    setAccumParams((prev) => ({
                      ...prev,
                      targetMonthlyExpense: val,
                    }))
                  }
                  min={2_000_000}
                  max={50_000_000}
                  step={1_000_000}
                  prefix="Rp"
                  isCurrency={true}
                  tooltip="Estimasi biaya hidup bulanan yang ingin ditopang sepenuhnya dari hasil investasi pasif."
                  quickPresets={[
                    { label: '5 Jt (Frugal)', value: 5_000_000 },
                    { label: '10 Jt (Standar)', value: 10_000_000 },
                    { label: '20 Jt (Nyaman)', value: 20_000_000 },
                    { label: '30 Jt (Fat FIRE)', value: 30_000_000 },
                  ]}
                  accentColor="emerald"
                />

                {/* SWR Multiplier Toggle */}
                <div className="space-y-2 pt-1 border-t border-zinc-800/60">
                  <div className="flex items-center justify-between text-xs text-zinc-300">
                    <span className="font-medium">Standar Pengali Target FIRE</span>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      {accumParams.swrMultiplier === 25
                        ? 'SWR 4.0% (Trinity Rule)'
                        : accumParams.swrMultiplier === 28.57
                        ? 'SWR 3.5% (Moderat ID)'
                        : 'SWR 3.25% (Konservatif ID)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() =>
                        setAccumParams((prev) => ({ ...prev, swrMultiplier: 25 }))
                      }
                      className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all ${
                        accumParams.swrMultiplier === 25
                          ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      25x (4.0%)
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setAccumParams((prev) => ({ ...prev, swrMultiplier: 28.57 }))
                      }
                      className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all ${
                        accumParams.swrMultiplier === 28.57
                          ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      28.5x (3.5%)
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setAccumParams((prev) => ({ ...prev, swrMultiplier: 30.77 }))
                      }
                      className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all ${
                        accumParams.swrMultiplier === 30.77
                          ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      30.8x (3.25%)
                    </button>
                  </div>
                </div>

                {/* 4. Imbal Hasil Bersih Tahunan */}
                <NumericSliderInput
                  label="Asumsi Imbal Hasil Portofolio Bersih (%/tahun)"
                  value={accumParams.annualReturn}
                  onChange={(val) =>
                    setAccumParams((prev) => ({ ...prev, annualReturn: val }))
                  }
                  min={1}
                  max={25}
                  step={0.5}
                  suffix="%"
                  tooltip="Rata-rata return tahunan setelah dikurangi biaya pengelolaan & pajak (CAGR)."
                  quickPresets={[
                    { label: '6% Obligasi', value: 6.0 },
                    { label: '10% Campuran', value: 10.0 },
                    { label: '14% Saham/Index', value: 14.0 },
                  ]}
                  accentColor="emerald"
                />

                {/* 5. Asumsi Inflasi */}
                <div className="space-y-1">
                  {liveInflation && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={applyLiveInflation}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-[10px] font-medium transition-colors"
                        title={liveInflation.source}
                      >
                        <span>🇮🇩 Gunakan Inflasi BPS/BI Terkini ({liveInflation.rate}%)</span>
                      </button>
                    </div>
                  )}
                  <NumericSliderInput
                    label="Asumsi Inflasi Rata-rata (%/tahun)"
                    value={accumParams.annualInflation}
                    onChange={(val) =>
                      setAccumParams((prev) => ({ ...prev, annualInflation: val }))
                    }
                    min={1}
                    max={12}
                    step={0.5}
                    suffix="%"
                    tooltip="Ekspektasi laju inflasi jangka panjang di Indonesia (historis BPS berkisar 3-5%)."
                    quickPresets={[
                      ...(liveInflation ? [{ label: `🇮🇩 ${liveInflation.rate}% BPS`, value: liveInflation.rate }] : []),
                      { label: '3% Rendah', value: 3.0 },
                      { label: '4% Target BI', value: 4.0 },
                      { label: '5.5% Tinggi', value: 5.5 },
                    ]}
                    accentColor="emerald"
                  />
                </div>

                {/* 6. Estimasi Yield Dividen & Strategi DRIP */}
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Dividen Saham / Kupon (%/tahun)</span>
                    </div>
                    {/* DRIP Toggle Switch */}
                    <button
                      type="button"
                      onClick={() =>
                        setAccumParams((prev) => ({
                          ...prev,
                          reinvestDividends: !(prev.reinvestDividends ?? true),
                        }))
                      }
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all border ${
                        accumParams.reinvestDividends !== false
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-xs'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60'
                      }`}
                    >
                      <span>{accumParams.reinvestDividends !== false ? '✓ DRIP Aktif' : '○ Cash Payout'}</span>
                    </button>
                  </div>

                  <NumericSliderInput
                    label="Estimasi Yield Dividen Portofolio"
                    value={accumParams.dividendYield ?? 3.5}
                    onChange={(val) =>
                      setAccumParams((prev) => ({ ...prev, dividendYield: val }))
                    }
                    min={0}
                    max={12}
                    step={0.5}
                    suffix="%"
                    tooltip="Rata-rata dividen/kupon tahunan portofolio (IHSG ~2.5%, IDX High Dividend ~4-6%, Obligasi FR ~6-7%). Mode DRIP menginvestasikan kembali dividen untuk melipatgandakan bunga majemuk."
                    quickPresets={[
                      { label: '0% Non-Div', value: 0 },
                      { label: '3.5% IHSG', value: 3.5 },
                      { label: '5.5% High Yield', value: 5.5 },
                    ]}
                    accentColor="emerald"
                  />
                  <div className="text-[10px] text-zinc-400 leading-relaxed">
                    {accumParams.reinvestDividends !== false ? (
                      <span className="text-emerald-400">
                        ⚡ <strong>DRIP Aktif:</strong> Dividen otomatis dibelikan kembali, total imbal hasil efektif:{' '}
                        <strong>{(accumParams.annualReturn + (accumParams.dividendYield ?? 3.5)).toFixed(1)}%/tahun</strong>.
                      </span>
                    ) : (
                      <span className="text-zinc-400">
                        Dividen ditarik tunai sebagai passive income setiap tahun dan tidak menambah pokok investasi.
                      </span>
                    )}
                  </div>
                </div>

                {/* 6. Horison Waktu */}
                <NumericSliderInput
                  label="Horison Waktu Simulasi (Tahun)"
                  value={accumParams.timeHorizonYears}
                  onChange={(val) =>
                    setAccumParams((prev) => ({
                      ...prev,
                      timeHorizonYears: val,
                    }))
                  }
                  min={5}
                  max={40}
                  step={1}
                  suffix=" Tahun"
                  tooltip="Lama waktu Anda mengakumulasi dana sebelum memutuskan pensiun dini."
                  quickPresets={[
                    { label: '10 Thn', value: 10 },
                    { label: '15 Thn', value: 15 },
                    { label: '20 Thn', value: 20 },
                    { label: '25 Thn', value: 25 },
                  ]}
                  accentColor="emerald"
                />

                {/* Imbal Hasil Riil Display Pill */}
                <div className="p-2.5 sm:p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Percent className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Imbal Hasil Riil Bersih (Net of Inflation):</span>
                  </div>
                  <span
                    className={`font-bold shrink-0 ${
                      accumulationResult.realReturnRate > 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {accumulationResult.realReturnRate.toFixed(1)}% / tahun
                  </span>
                </div>

                {/* Tombol Konfirmasi & Simpan Pilihan */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={handleConfirmAndSave}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Konfirmasi & Simpan Pilihan</span>
                  </button>
                  <p className="text-[10px] text-center text-zinc-400 mt-1.5">
                    Menyimpan skenario & beralih ke tampilan ringkas tanpa deretan slider.
                  </p>
                </div>

                {/* Mobile Quick Action Bar to View Results */}
                <div className="lg:hidden pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] text-zinc-400">Target FIRE: {formatCompactIDR(accumulationResult.targetFIRE)}</div>
                    <div className={`text-xs font-bold truncate ${
                      accumulationResult.finalFireStatus === 'surplus'
                        ? 'text-emerald-400'
                        : accumulationResult.finalFireStatus === 'exact'
                        ? 'text-sky-400'
                        : 'text-rose-400'
                    }`}>
                      Porto: {formatCompactIDR(accumulationResult.finalPortfolio)} ({accumulationResult.finalFireStatus === 'surplus' ? `+${formatCompactIDR(accumulationResult.finalFireDelta)}` : accumulationResult.finalFireStatus === 'exact' ? 'Pas' : `-${formatCompactIDR(Math.abs(accumulationResult.finalFireDelta))}`})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileView('results')}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition shrink-0"
                  >
                    <span>Lihat Grafik</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              )}
            </div>

            {/* Right Column: Stat Cards & Recharts Graph */}
            <div className={`lg:col-span-7 space-y-4 sm:space-y-5 ${mobileView === 'params' ? 'hidden lg:block' : 'block'}`}>
              {/* Mobile Back Button to Params */}
              {mobileView === 'results' && (
                <div className="lg:hidden flex items-center justify-between pb-1">
                  <button
                    type="button"
                    onClick={() => setMobileView('params')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 border border-zinc-700/80 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Ubah Parameter Input</span>
                  </button>
                  <span className="text-[11px] text-zinc-400">
                    Horizon {accumParams.timeHorizonYears} Tahun
                  </span>
                </div>
              )}
              {/* Dual Hero Cards (Desktop & Mobile Refined Layout) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {/* Hero Card 1: Ketetapan Target FIRE & Pencapaian */}
                <div
                  className={`p-3.5 sm:p-5 rounded-2xl border transition-all relative overflow-hidden backdrop-blur-md ${
                    accumulationResult.finalFireStatus === 'surplus'
                      ? 'bg-gradient-to-br from-emerald-950/40 via-zinc-900/90 to-zinc-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/30'
                      : accumulationResult.finalFireStatus === 'exact'
                      ? 'bg-gradient-to-br from-sky-950/40 via-zinc-900/90 to-zinc-900/90 border-sky-500/40 shadow-lg shadow-sky-950/30'
                      : 'bg-gradient-to-br from-rose-950/40 via-zinc-900/90 to-zinc-900/90 border-rose-500/40 shadow-lg shadow-rose-950/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          accumulationResult.finalFireStatus === 'surplus'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : accumulationResult.finalFireStatus === 'exact'
                            ? 'bg-sky-500/20 text-sky-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {accumulationResult.finalFireStatus === 'surplus' ? (
                          <Award className="w-4 h-4" />
                        ) : accumulationResult.finalFireStatus === 'exact' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-zinc-200 block">
                          Ketetapan Target FIRE
                        </span>
                        <p className="text-[10px] text-zinc-400">
                          Target: {formatCompactIDR(accumulationResult.targetFIRE)} ({accumParams.swrMultiplier}x biaya thn)
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full border shrink-0 ${
                        accumulationResult.finalFireStatus === 'surplus'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : accumulationResult.finalFireStatus === 'exact'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {accumulationResult.finalFireStatus === 'surplus'
                        ? '✓ Tercapai (+)'
                        : accumulationResult.finalFireStatus === 'exact'
                        ? '✓ Pas 100%'
                        : '✗ Defisit (-)'}
                    </span>
                  </div>

                  <div className="my-2">
                    <div
                      className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
                        accumulationResult.finalFireStatus === 'surplus'
                          ? 'text-emerald-400'
                          : accumulationResult.finalFireStatus === 'exact'
                          ? 'text-sky-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {accumulationResult.finalFireStatus === 'surplus'
                        ? `+${formatCompactIDR(accumulationResult.finalFireDelta)}`
                        : accumulationResult.finalFireStatus === 'exact'
                        ? 'Pas 100%'
                        : `-${formatCompactIDR(Math.abs(accumulationResult.finalFireDelta))}`}
                    </div>
                    <div className="text-[11px] sm:text-xs text-zinc-300 font-medium mt-1 leading-snug">
                      {accumulationResult.finalFireStatus === 'surplus'
                        ? `Surplus +${formatIDR(accumulationResult.finalFireDelta)} (+${accumulationResult.finalFireDeltaPercent}% di atas target)`
                        : accumulationResult.finalFireStatus === 'exact'
                        ? `Tepat Rp ${formatNumberWithDots(accumulationResult.targetFIRE)} (Sempurna 100%)`
                        : `Kurang ${formatIDR(Math.abs(accumulationResult.finalFireDelta))} (${accumulationResult.finalFireDeltaPercent}% dari target)`}
                    </div>
                  </div>

                  {/* Progress Bar & Milestone */}
                  <div className="mt-3 pt-2 border-t border-zinc-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Kemajuan Target:</span>
                      <span className="font-bold text-zinc-200">{accumulationResult.achievementPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          accumulationResult.finalFireStatus === 'surplus'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : accumulationResult.finalFireStatus === 'exact'
                            ? 'bg-gradient-to-r from-sky-500 to-teal-400'
                            : 'bg-gradient-to-r from-rose-500 to-amber-400'
                        }`}
                        style={{ width: `${Math.min(accumulationResult.achievementPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-zinc-400 leading-snug">
                      {accumulationResult.yearReached !== null
                        ? `🎉 Bebas finansial tercapai di Tahun ke-${accumulationResult.yearReached}!`
                        : `Belum tercapai dalam ${accumParams.timeHorizonYears} tahun (tambah tabungan / waktu).`}
                    </div>
                  </div>
                </div>

                {/* Hero Card 2: Hasil Akhir Portofolio & Passive Income */}
                <div className="p-3.5 sm:p-5 rounded-2xl border border-zinc-800/90 bg-zinc-900/80 shadow-lg space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-zinc-200 block">
                          Hasil Akhir Portofolio
                        </span>
                        <p className="text-[10px] text-zinc-400">
                          Thn ke-{accumParams.timeHorizonYears} (Mulai Rp 0)
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                      Passive Income Aman
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                    <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                      <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        Nominal
                      </div>
                      <div className="text-lg sm:text-2xl font-bold text-emerald-400 tabular-nums mt-0.5">
                        {formatCompactIDR(accumulationResult.finalPortfolio)}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {formatIDR(accumulationResult.finalPortfolio)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                      <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                        Riil (-Inflasi)
                      </div>
                      <div className="text-lg sm:text-2xl font-bold text-sky-400 tabular-nums mt-0.5">
                        {formatCompactIDR(accumulationResult.finalRealPortfolio)}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {formatIDR(accumulationResult.finalRealPortfolio)}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-2">
                    <div className="text-xs text-zinc-300 font-medium">
                      Passive Income Bulanan (SWR):
                    </div>
                    <div className="text-sm sm:text-base font-bold text-teal-300 tabular-nums shrink-0">
                      {formatCompactIDR(accumulationResult.safeMonthlyPassiveIncome)}
                      <span className="text-xs font-normal text-zinc-400">/bln</span>
                    </div>
                  </div>

                  {/* Dividend Passive Cashflow Metric */}
                  <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Dividen Murni ({accumParams.dividendYield ?? 3.5}%):</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {accumParams.reinvestDividends !== false ? 'DRIP Reinvest' : 'Cash Payout'} • Tutup{' '}
                        <strong className="text-emerald-400">{accumulationResult.dividendCoveragePercent}%</strong> biaya
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-bold text-amber-300 tabular-nums">
                        {formatCompactIDR(accumulationResult.finalMonthlyDividend)}
                        <span className="text-xs font-normal text-zinc-400">/bln</span>
                      </div>
                      <div className="text-[9px] text-zinc-500">
                        ({formatCompactIDR(accumulationResult.finalAnnualDividend)}/thn)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Metrics Row (4 Cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5 sm:p-3 space-y-0.5">
                  <div className="text-[10px] font-medium text-zinc-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                    <span className="truncate">Pokok (Nominal)</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-zinc-200 tabular-nums">
                    {formatCompactIDR(accumulationResult.finalPrincipal)}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {formatIDR(accumulationResult.finalPrincipal)}
                  </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5 sm:p-3 space-y-0.5">
                  <div className="text-[10px] font-medium text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">Gain (+{accumulationResult.gainPercentage.toFixed(0)}%)</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-emerald-400 tabular-nums">
                    +{formatCompactIDR(accumulationResult.finalGain)}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    +{formatIDR(accumulationResult.finalGain)}
                  </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5 sm:p-3 space-y-0.5">
                  <div className="text-[10px] font-medium text-purple-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                    <span className="truncate">Pokok Riil (-Inf)</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-purple-300 tabular-nums">
                    {formatCompactIDR(accumulationResult.finalRealPrincipal)}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {formatIDR(accumulationResult.finalRealPrincipal)}
                  </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5 sm:p-3 space-y-0.5">
                  <div className="text-[10px] font-medium text-sky-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                    <span className="truncate">Porto Riil (-Inf)</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-sky-400 tabular-nums">
                    {formatCompactIDR(accumulationResult.finalRealPortfolio)}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {formatIDR(accumulationResult.finalRealPortfolio)}
                  </div>
                </div>
              </div>

              {/* Composition Breakdown Bar */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Komposisi Portofolio di Tahun ke-{accumParams.timeHorizonYears} (Mulai Rp 0)
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    Bunga Bergulung:{' '}
                    <strong className="text-emerald-400">
                      +{accumulationResult.gainPercentage.toFixed(0)}%
                    </strong>{' '}
                    di atas modal pokok
                  </span>
                </div>

                {/* Multi-segment bar */}
                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-slate-500 transition-all duration-500"
                    style={{
                      width: `${
                        accumulationResult.finalPortfolio > 0
                          ? (accumulationResult.finalPrincipal /
                              accumulationResult.finalPortfolio) *
                            100
                          : 50
                      }%`,
                    }}
                    title={`Modal Disetor (Nominal): ${formatIDR(
                      accumulationResult.finalPrincipal
                    )}`}
                  />
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${
                        accumulationResult.finalPortfolio > 0
                          ? (accumulationResult.finalGain /
                              accumulationResult.finalPortfolio) *
                            100
                          : 50
                      }%`,
                    }}
                    title={`Keuntungan Bunga Majemuk: ${formatIDR(
                      accumulationResult.finalGain
                    )}`}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <span>
                      Pokok Nominal:{' '}
                      <strong className="text-zinc-200">
                        {formatCompactIDR(accumulationResult.finalPrincipal)}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>
                      Gain Majemuk:{' '}
                      <strong className="text-emerald-400">
                        {formatCompactIDR(accumulationResult.finalGain)}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <span>
                      Pokok Riil (-Inf):{' '}
                      <strong className="text-purple-300">
                        {formatCompactIDR(accumulationResult.finalRealPrincipal)}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <span>
                      Porto Riil (-Inf):{' '}
                      <strong className="text-sky-300">
                        {formatCompactIDR(accumulationResult.finalRealPortfolio)}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Recharts AreaChart & Dynamic Filtering Controls */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 sm:p-5 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      Visualisasi Pertumbuhan Portofolio (4 Kurva)
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      2 Grafik Nominal + 2 Grafik Riil dikurangi Inflasi, lengkap dengan filter interaktif & ketetapan target FIRE
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                      Target FIRE: {formatCompactIDR(accumulationResult.targetFIRE)}
                    </span>
                  </div>
                </div>

                {/* Unified Filter Toolbar with Integrated Live Values */}
                <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-3 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                      <Filter className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Filter Tampilan Grafik (Klik Kurva untuk On/Off):</span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setChartFilters({
                          nominalPortfolio: true,
                          nominalPrincipal: true,
                          realPortfolio: true,
                          realPrincipal: true,
                        })
                      }
                      className="text-[10px] px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition self-start sm:self-auto"
                    >
                      Tampilkan Semua (4 Kurva)
                    </button>
                  </div>

                  {/* 4 Interactive Filter Cards with Live Values */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Chip 1: Porto Nominal */}
                    <button
                      type="button"
                      onClick={() =>
                        setChartFilters((prev) => ({
                          ...prev,
                          nominalPortfolio: !prev.nominalPortfolio,
                        }))
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        chartFilters.nominalPortfolio
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
                          : 'bg-zinc-900/40 border-zinc-800/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Porto Nominal
                        </span>
                        {chartFilters.nominalPortfolio ? (
                          <Eye className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-zinc-500" />
                        )}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-1 tabular-nums">
                        {formatCompactIDR(accumulationResult.finalPortfolio)}
                      </div>
                      <div className="text-[9px] text-zinc-500">
                        {chartFilters.nominalPortfolio ? '● Tampil di Grafik' : '○ Sembunyi'}
                      </div>
                    </button>

                    {/* Chip 2: Pokok Nominal */}
                    <button
                      type="button"
                      onClick={() =>
                        setChartFilters((prev) => ({
                          ...prev,
                          nominalPrincipal: !prev.nominalPrincipal,
                        }))
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        chartFilters.nominalPrincipal
                          ? 'bg-slate-900/50 border-slate-500/50 shadow-sm'
                          : 'bg-zinc-900/40 border-zinc-800/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Pokok Nominal
                        </span>
                        {chartFilters.nominalPrincipal ? (
                          <Eye className="w-3 h-3 text-slate-300" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-zinc-500" />
                        )}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-slate-300 mt-1 tabular-nums">
                        {formatCompactIDR(accumulationResult.finalPrincipal)}
                      </div>
                      <div className="text-[9px] text-zinc-500">
                        {chartFilters.nominalPrincipal ? '● Tampil di Grafik' : '○ Sembunyi'}
                      </div>
                    </button>

                    {/* Chip 3: Porto Riil (-Inf) */}
                    <button
                      type="button"
                      onClick={() =>
                        setChartFilters((prev) => ({
                          ...prev,
                          realPortfolio: !prev.realPortfolio,
                        }))
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        chartFilters.realPortfolio
                          ? 'bg-sky-950/30 border-sky-500/50 shadow-sm'
                          : 'bg-zinc-900/40 border-zinc-800/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-sky-400" />
                          Porto Riil (-Inf)
                        </span>
                        {chartFilters.realPortfolio ? (
                          <Eye className="w-3 h-3 text-sky-400" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-zinc-500" />
                        )}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-sky-400 mt-1 tabular-nums">
                        {formatCompactIDR(accumulationResult.finalRealPortfolio)}
                      </div>
                      <div className="text-[9px] text-zinc-500">
                        {chartFilters.realPortfolio ? '● Tampil di Grafik' : '○ Sembunyi'}
                      </div>
                    </button>

                    {/* Chip 4: Pokok Riil (-Inf) */}
                    <button
                      type="button"
                      onClick={() =>
                        setChartFilters((prev) => ({
                          ...prev,
                          realPrincipal: !prev.realPrincipal,
                        }))
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        chartFilters.realPrincipal
                          ? 'bg-purple-950/30 border-purple-500/50 shadow-sm'
                          : 'bg-zinc-900/40 border-zinc-800/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-purple-400" />
                          Pokok Riil (-Inf)
                        </span>
                        {chartFilters.realPrincipal ? (
                          <Eye className="w-3 h-3 text-purple-300" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-zinc-500" />
                        )}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-purple-300 mt-1 tabular-nums">
                        {formatCompactIDR(accumulationResult.finalRealPrincipal)}
                      </div>
                      <div className="text-[9px] text-zinc-500">
                        {chartFilters.realPrincipal ? '● Tampil di Grafik' : '○ Sembunyi'}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="w-full h-[320px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={accumulationResult.dataPoints}
                      margin={{ top: 15, right: 10, left: 0, bottom: 5 }}
                    >
                      <defs>
                        {/* Gradient 1: Total Portfolio Nominal */}
                        <linearGradient
                          id="portfolioGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.02}
                          />
                        </linearGradient>

                        {/* Gradient 2: Principal Nominal */}
                        <linearGradient
                          id="principalGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#64748b"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#64748b"
                            stopOpacity={0.02}
                          />
                        </linearGradient>

                        {/* Gradient 3: Real Portfolio (-Inflasi) */}
                        <linearGradient
                          id="realPortfolioGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#0ea5e9"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="#0ea5e9"
                            stopOpacity={0.02}
                          />
                        </linearGradient>

                        {/* Gradient 4: Real Principal (-Inflasi) */}
                        <linearGradient
                          id="realPrincipalGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#a855f7"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#a855f7"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#27272a"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="label"
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#3f3f46' }}
                        interval="preserveStartEnd"
                        minTickGap={16}
                      />

                      <YAxis
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#3f3f46' }}
                        tickFormatter={(val) => formatCompactIDR(val)}
                        width={56}
                      />

                      <Tooltip content={<CustomAccumulationTooltip />} cursor={{ stroke: '#52525b', strokeDasharray: '3 3' }} />

                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{
                          paddingBottom: '12px',
                          fontSize: '11px',
                        }}
                      />

                      {/* Reference line for FIRE target */}
                      <ReferenceLine
                        y={accumulationResult.targetFIRE}
                        stroke="#f59e0b"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label={{
                          value: `Target FIRE: ${formatCompactIDR(
                            accumulationResult.targetFIRE
                          )}`,
                          position: 'insideTopLeft',
                          fill: '#f59e0b',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      />

                      {/* Area 1: Total Portofolio (Nominal) */}
                      {chartFilters.nominalPortfolio && (
                        <Area
                          type="monotone"
                          dataKey="totalPortfolio"
                          name="Total Portofolio (Nominal)"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#portfolioGradient)"
                          isAnimationActive={false}
                          activeDot={{
                            r: 6,
                            stroke: '#10b981',
                            strokeWidth: 2,
                            fill: '#ffffff',
                          }}
                        />
                      )}

                      {/* Area 2: Principal (Modal Disetor Nominal) */}
                      {chartFilters.nominalPrincipal && (
                        <Area
                          type="monotone"
                          dataKey="totalPrincipal"
                          name="Modal Pokok Disetor (Nominal)"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#principalGradient)"
                          isAnimationActive={false}
                        />
                      )}

                      {/* Area 3: Total Portofolio Riil (-Inflasi) */}
                      {chartFilters.realPortfolio && (
                        <Area
                          type="monotone"
                          dataKey="realPortfolio"
                          name="Portofolio Riil (-Inflasi)"
                          stroke="#0ea5e9"
                          strokeDasharray="5 5"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#realPortfolioGradient)"
                          isAnimationActive={false}
                          activeDot={{
                            r: 5,
                            stroke: '#0ea5e9',
                            strokeWidth: 2,
                            fill: '#ffffff',
                          }}
                        />
                      )}

                      {/* Area 4: Modal Pokok Riil (-Inflasi) */}
                      {chartFilters.realPrincipal && (
                        <Area
                          type="monotone"
                          dataKey="realPrincipal"
                          name="Modal Pokok Riil (-Inflasi)"
                          stroke="#a855f7"
                          strokeDasharray="4 4"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#realPrincipalGradient)"
                          isAnimationActive={false}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Milestone Callout with FIRE Determination Status */}
                <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                  accumulationResult.finalFireStatus === 'surplus'
                    ? 'bg-emerald-950/20 border-emerald-800/60'
                    : accumulationResult.finalFireStatus === 'exact'
                    ? 'bg-sky-950/20 border-sky-800/60'
                    : 'bg-zinc-950 border-zinc-800/80'
                }`}>
                  <div className={`p-1 rounded-md mt-0.5 ${
                    accumulationResult.finalFireStatus === 'surplus'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : accumulationResult.finalFireStatus === 'exact'
                      ? 'bg-sky-500/10 text-sky-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {accumulationResult.finalFireStatus === 'surplus' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : accumulationResult.finalFireStatus === 'exact' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-zinc-200">
                      {accumulationResult.finalFireStatus === 'surplus'
                        ? `Analisis Ketetapan: Target Financial Freedom TERCAPAI DENGAN SURPLUS +${formatCompactIDR(accumulationResult.finalFireDelta)} (+${accumulationResult.finalFireDeltaPercent}%)`
                        : accumulationResult.finalFireStatus === 'exact'
                        ? 'Analisis Ketetapan: Target Financial Freedom TERCAPAI TEPAT PAS (100.0%)'
                        : `Analisis Ketetapan: Target Financial Freedom BELUM TERCAPAI (DEFISIT -${formatCompactIDR(Math.abs(accumulationResult.finalFireDelta))} / ${accumulationResult.finalFireDeltaPercent}%)`}
                    </p>
                    <p className="text-zinc-400 leading-relaxed text-[11px]">
                      {accumulationResult.yearReached !== null ? (
                        <>
                          Dimulai dari modal awal <strong className="text-zinc-200">Rp 0</strong> dan konsistensi investasi rutin bulanan{' '}
                          <strong className="text-zinc-200">{formatCompactIDR(accumParams.monthlyInvestment)}</strong> (imbal hasil {accumParams.annualReturn}%), target dana FIRE {formatCompactIDR(accumulationResult.targetFIRE)} pertama kali tersentuh pada <strong className="text-emerald-400">Tahun ke-{accumulationResult.yearReached}</strong>.
                          Di tahun ke-{accumParams.timeHorizonYears}, akumulasi portofolio Anda mencapai{' '}
                          <strong className="text-emerald-400">{formatIDR(accumulationResult.finalPortfolio)}</strong> dengan status{' '}
                          <strong className={accumulationResult.finalFireStatus === 'surplus' ? 'text-emerald-400' : 'text-sky-400'}>
                            {accumulationResult.finalFireStatus === 'surplus'
                              ? `SURPLUS +${formatIDR(accumulationResult.finalFireDelta)} (+${accumulationResult.finalFireDeltaPercent}% di atas target)`
                              : 'TEPAT PAS (100%)'}
                          </strong>
                          , menghasilkan passive income aman{' '}
                          <strong className="text-emerald-400">{formatIDR(accumulationResult.safeMonthlyPassiveIncome)}/bulan</strong>.
                        </>
                      ) : (
                        <>
                          Dimulai dari modal awal Rp 0, portofolio Anda pada akhir horison ({accumParams.timeHorizonYears} tahun) mencapai{' '}
                          <strong className="text-zinc-200">{formatCompactIDR(accumulationResult.finalPortfolio)}</strong> ({accumulationResult.achievementPercentage}% dari target), namun masih mengalami status{' '}
                          <strong className="text-rose-400">
                            DEFISIT -{formatIDR(Math.abs(accumulationResult.finalFireDelta))} ({Math.abs(accumulationResult.finalFireDeltaPercent)}% di bawah target aman FIRE)
                          </strong>. Coba tingkatkan investasi bulanan atau perpanjang horison beberapa tahun agar status menjadi pas atau surplus.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MODUL B - UJI KETAHANAN PORTOFOLIO PENSIUN (SWR STRESS-TEST ID) */}
        {/* ========================================================================= */}
        {activeTab === 'decumulation' && (
          <>
            {/* Left Column: Decumulation Controls */}
            <div className={`lg:col-span-5 space-y-4 sm:space-y-5 ${mobileView === 'results' ? 'hidden lg:block' : 'block'}`}>
              {isMinimalMode ? (
                /* Card Ringkasan Minimalis Modul B (Tanpa Slider) */
                <div className="bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-zinc-100">Pilihan SWR Terkonfirmasi</h2>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">Tersimpan</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">Mode ringkas tanpa deretan slider</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMinimalMode(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 border border-zinc-700 hover:border-zinc-600 transition"
                      title="Buka panel slider untuk mengubah nilai"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ubah Parameter</span>
                    </button>
                  </div>

                  {/* Key-Value Summary Grid */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-0.5">
                      <span className="text-[11px] text-zinc-400">Saldo Awal Pensiun</span>
                      <div className="text-sm font-bold text-amber-400">{formatIDR(decumParams.initialRetirementBalance)}</div>
                      <div className="text-[10px] text-zinc-400">Portofolio hari ke-1</div>
                    </div>
                    <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-0.5">
                      <span className="text-[11px] text-zinc-400">Pengeluaran Tahun 1</span>
                      <div className="text-sm font-bold text-zinc-100">{formatIDR(decumParams.firstYearExpense)}</div>
                      <div className="text-[10px] text-zinc-400">
                        {((decumParams.firstYearExpense / decumParams.initialRetirementBalance) * 100).toFixed(1)}% dari saldo awal
                      </div>
                    </div>
                    <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-0.5">
                      <span className="text-[11px] text-zinc-400">Return Portofolio</span>
                      <div className="text-sm font-bold text-zinc-100">{decumParams.annualPortfolioReturn}% / thn</div>
                      <div className="text-[10px] text-amber-400">Dividen: {decumParams.dividendYield ?? 3.5}%/thn</div>
                    </div>
                    <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-0.5">
                      <span className="text-[11px] text-zinc-400">Laju Inflasi</span>
                      <div className="text-sm font-bold text-zinc-100">{decumParams.annualInflationRate}% / thn</div>
                      <div className="text-[10px] text-zinc-400">Penyesuai biaya tahunan</div>
                    </div>
                    <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-0.5">
                      <span className="text-[11px] text-zinc-400">Lama Masa Pensiun</span>
                      <div className="text-sm font-bold text-zinc-100">{decumParams.retirementYears} Tahun</div>
                      <div className="text-[10px] text-zinc-400">Durasi uji ketahanan</div>
                    </div>
                    <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-0.5">
                      <span className="text-[11px] text-zinc-400">Hasil Uji SWR</span>
                      <div className={`text-sm font-bold ${decumulationResult.standardFailureYear === null ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {decumulationResult.standardFailureYear === null ? '4% & 3.25% Aman' : `4% Habis Thn-${decumulationResult.standardFailureYear}`}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {decumulationResult.conservativeFailureYear === null ? '3.25% Aman Penuh' : `3.25% Habis Thn-${decumulationResult.conservativeFailureYear}`}
                      </div>
                    </div>
                  </div>

                  {/* Button to open sliders */}
                  <button
                    type="button"
                    onClick={() => setIsMinimalMode(false)}
                    className="w-full py-2.5 px-4 rounded-xl border border-zinc-700/80 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Buka Slider untuk Mengubah Parameter</span>
                  </button>

                  {/* Mobile Quick Action Bar to View Results */}
                  <div className="lg:hidden pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-zinc-400">Saldo Pensiun: {formatCompactIDR(decumParams.initialRetirementBalance)}</div>
                      <div className="text-xs font-bold text-amber-400">
                        {decumulationResult.standardFailureYear !== null
                          ? `4% Gagal Thn ke-${decumulationResult.standardFailureYear}`
                          : 'Kedua Skenario Aman ✨'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileView('results')}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
                    >
                      <span>Lihat Grafik</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3.5 sm:p-5 shadow-lg space-y-3.5 sm:space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-zinc-100">
                        Parameter Uji Ketahanan SWR
                      </h2>
                      <p className="text-[11px] text-zinc-400">
                        Simulasi penarikan saldo pensiun vs inflasi Indonesia
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDecumParams(defaultDecumulationParams)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
                    title="Reset ke Nilai Standar"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 1. Saldo Awal Pensiun */}
                <NumericSliderInput
                  label="Saldo Awal Pensiun / Portofolio Terkumpul"
                  value={decumParams.initialRetirementBalance}
                  onChange={handleDecumInitialBalanceChange}
                  min={500_000_000}
                  max={20_000_000_000}
                  step={100_000_000}
                  prefix="Rp"
                  isCurrency={true}
                  tooltip="Total nominal dana pensiun yang terkumpul saat hari pertama pensiun dimulai."
                  quickPresets={[
                    { label: '1 M', value: 1_000_000_000 },
                    { label: '3 M', value: 3_000_000_000 },
                    { label: '5 M', value: 5_000_000_000 },
                    { label: '10 M', value: 10_000_000_000 },
                  ]}
                  accentColor="amber"
                />

                {/* 2. Pengeluaran Hidup Tahun Pertama */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                    <span className="text-zinc-300 font-medium">
                      Pengeluaran Hidup Tahun Pertama
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={decumParams.useAutomaticFirstYearExpense}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setDecumParams((prev) => ({
                            ...prev,
                            useAutomaticFirstYearExpense: checked,
                            firstYearExpense: checked
                              ? Math.round(prev.initialRetirementBalance * 0.04)
                              : prev.firstYearExpense,
                          }));
                        }}
                        className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-0"
                      />
                      <span>Auto 4% Saldo ({formatCompactIDR(decumParams.initialRetirementBalance * 0.04)})</span>
                    </label>
                  </div>

                  {!decumParams.useAutomaticFirstYearExpense ? (
                    <NumericSliderInput
                      label="Kustom Pengeluaran Tahun 1"
                      value={decumParams.firstYearExpense}
                      onChange={(val) =>
                        setDecumParams((prev) => ({
                          ...prev,
                          firstYearExpense: val,
                        }))
                      }
                      min={20_000_000}
                      max={800_000_000}
                      step={5_000_000}
                      prefix="Rp"
                      isCurrency={true}
                      tooltip="Total penarikan di tahun pertama. Tahun berikutnya otomatis naik mengikuti inflasi."
                      quickPresets={[
                        { label: '60 Jt (5 Jt/bln)', value: 60_000_000 },
                        { label: '120 Jt (10 Jt/bln)', value: 120_000_000 },
                        { label: '240 Jt (20 Jt/bln)', value: 240_000_000 },
                      ]}
                      accentColor="amber"
                    />
                  ) : (
                    <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <span className="text-zinc-400">
                        Penarikan Awal Tahun ke-1:
                      </span>
                      <span className="font-semibold text-amber-400">
                        {formatIDR(decumParams.initialRetirementBalance * 0.04)}{' '}
                        <span className="text-zinc-500 font-normal">
                          (Rp{' '}
                          {formatNumberWithDots(
                            Math.round(
                              (decumParams.initialRetirementBalance * 0.04) / 12
                            )
                          )}
                          /bln)
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Imbal Hasil Tahunan Portofolio Campuran */}
                <NumericSliderInput
                  label="Imbal Hasil Portofolio Pensiun (%/tahun)"
                  value={decumParams.annualPortfolioReturn}
                  onChange={(val) =>
                    setDecumParams((prev) => ({
                      ...prev,
                      annualPortfolioReturn: val,
                    }))
                  }
                  min={1}
                  max={20}
                  step={0.5}
                  suffix="%"
                  tooltip="Return rata-rata portofolio pensiun (biasanya lebih konservatif: SBN, Deposito, Reksadana Pendapatan Tetap + Saham Bluechip)."
                  quickPresets={[
                    { label: '6.5% Konservatif (SBN)', value: 6.5 },
                    { label: '8.0% Campuran ID', value: 8.0 },
                    { label: '10.0% Agresif', value: 10.0 },
                  ]}
                  accentColor="amber"
                />

                {/* 4. Laju Inflasi Rata-rata */}
                <div className="space-y-1">
                  {liveInflation && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={applyLiveInflation}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 text-[10px] font-medium transition-colors"
                        title={liveInflation.source}
                      >
                        <span>🇮🇩 Gunakan Inflasi BPS/BI Terkini ({liveInflation.rate}%)</span>
                      </button>
                    </div>
                  )}
                  <NumericSliderInput
                    label="Laju Inflasi Rata-rata (%/tahun)"
                    value={decumParams.annualInflationRate}
                    onChange={(val) =>
                      setDecumParams((prev) => ({
                        ...prev,
                        annualInflationRate: val,
                      }))
                    }
                    min={1}
                    max={12}
                    step={0.5}
                    suffix="%"
                    tooltip="Laju inflasi tahunan penyesuai biaya hidup penarikan dana."
                    quickPresets={[
                      ...(liveInflation ? [{ label: `🇮🇩 ${liveInflation.rate}% BPS`, value: liveInflation.rate }] : []),
                      { label: '3.5% Rendah', value: 3.5 },
                      { label: '4.5% Historis ID', value: 4.5 },
                      { label: '6.0% Konservatif', value: 6.0 },
                    ]}
                    accentColor="amber"
                  />
                </div>

                {/* 5. Yield Dividen Portofolio Pensiun */}
                <NumericSliderInput
                  label="Yield Dividen / Kupon Portofolio Pensiun (%/tahun)"
                  value={decumParams.dividendYield ?? 3.5}
                  onChange={(val) =>
                    setDecumParams((prev) => ({
                      ...prev,
                      dividendYield: val,
                    }))
                  }
                  min={0}
                  max={12}
                  step={0.5}
                  suffix="%"
                  tooltip="Persentase dividen saham atau kupon obligasi yang dihasilkan portofolio pensiun untuk menopang kebutuhan penarikan bulanan."
                  quickPresets={[
                    { label: '0% Non-Div', value: 0 },
                    { label: '3.5% Campuran', value: 3.5 },
                    { label: '6.0% High SBN/Div', value: 6.0 },
                  ]}
                  accentColor="amber"
                />

                {/* 5. Lama Masa Pensiun */}
                <NumericSliderInput
                  label="Lama Masa Pensiun (Tahun)"
                  value={decumParams.retirementYears}
                  onChange={(val) =>
                    setDecumParams((prev) => ({
                      ...prev,
                      retirementYears: val,
                    }))
                  }
                  min={10}
                  max={45}
                  step={1}
                  suffix=" Tahun"
                  tooltip="Ekspektasi lama waktu pensiun yang harus ditopang portofolio (misal: pensiun umur 55 ke 85 = 30 tahun)."
                  quickPresets={[
                    { label: '20 Thn', value: 20 },
                    { label: '25 Thn', value: 25 },
                    { label: '30 Thn (Trinity)', value: 30 },
                    { label: '35 Thn', value: 35 },
                  ]}
                  accentColor="amber"
                />

                {/* Comparison Concept Pill */}
                <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-[11px] space-y-1.5 text-zinc-400">
                  <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mengapa Komparasi 4.0% vs 3.25% Penting?</span>
                  </div>
                  <p className="leading-relaxed">
                    Aturan 4% (Bengen / Trinity Study 1998) dirancang berdasarkan pasar obligasi & saham AS dengan inflasi historis rendah (2-3%). Di Indonesia, inflasi riil kebutuhan pensiun lebih tinggi, sehingga para perencana keuangan independen Indonesia menyarankan rasio penarikan maksimal <strong>3.0% - 3.25%</strong>.
                  </p>
                </div>

                {/* Tombol Konfirmasi & Simpan Pilihan */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={handleConfirmAndSave}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Konfirmasi & Simpan Pilihan</span>
                  </button>
                  <p className="text-[10px] text-center text-zinc-400 mt-1.5">
                    Menyimpan skenario & beralih ke tampilan ringkas tanpa deretan slider.
                  </p>
                </div>

                {/* Mobile Quick Action Bar to View Results */}
                <div className="lg:hidden pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-zinc-400">Saldo Pensiun: {formatCompactIDR(decumParams.initialRetirementBalance)}</div>
                    <div className="text-xs font-bold text-amber-400">
                      {decumulationResult.standardFailureYear !== null
                        ? `4% Gagal Thn ke-${decumulationResult.standardFailureYear}`
                        : 'Kedua Skenario Aman ✨'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileView('results')}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
                  >
                    <span>Lihat Grafik</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              )}
            </div>

            {/* Right Column: Decumulation Stats & Graphs */}
            <div className={`lg:col-span-7 space-y-4 sm:space-y-5 ${mobileView === 'params' ? 'hidden lg:block' : 'block'}`}>
              {/* Mobile Back Button to Params */}
              {mobileView === 'results' && (
                <div className="lg:hidden flex items-center justify-between pb-1">
                  <button
                    type="button"
                    onClick={() => setMobileView('params')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 border border-zinc-700/80 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Ubah Parameter Input</span>
                  </button>
                  <span className="text-[11px] text-zinc-400">
                    Pensiun {decumParams.retirementYears} Tahun
                  </span>
                </div>
              )}
              {/* Failure Alert Banner if standard 4% runs out */}
              {decumulationResult.standardFailureYear !== null ? (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-200">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-rose-400 flex flex-wrap items-center gap-1.5">
                      <span>⚠️ Portfolio Failure Terdeteksi pada SWR 4.0%</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        Habis di Tahun ke-{decumulationResult.standardFailureYear}
                      </span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed text-[11px]">
                      Dengan laju inflasi {decumParams.annualInflationRate}% dan imbal hasil {decumParams.annualPortfolioReturn}%, skenario SWR 4.0% kehabisan seluruh dana pada{' '}
                      <strong>Tahun ke-{decumulationResult.standardFailureYear}</strong> (sisa masa pensiun {decumParams.retirementYears - decumulationResult.standardFailureYear} tahun tanpa dana pensiun!). Sementara adaptasi SWR 3.25% Indonesia{' '}
                      {decumulationResult.conservativeFailureYear === null
                        ? `berhasil bertahan utuh dengan sisa saldo ${formatCompactIDR(
                            decumulationResult.finalBalanceConservative
                          )}`
                        : `bertahan lebih lama hingga tahun ke-${decumulationResult.conservativeFailureYear}`}
                      .
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-200">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-xs sm:text-sm text-emerald-400">
                      Kedua Skenario Sukses Melewati {decumParams.retirementYears} Tahun!
                    </div>
                    <p className="text-zinc-300 text-[11px]">
                      Imbal hasil portofolio Anda ({decumParams.annualPortfolioReturn}%) cukup kuat mengatasi penarikan dan tekanan inflasi ({decumParams.annualInflationRate}%).
                    </p>
                  </div>
                </div>
              )}

              {/* Stat Cards Grid (4 Cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {/* Card 1: Saldo Akhir SWR 4.0% */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 space-y-1 relative overflow-hidden group hover:border-zinc-700 transition-all">
                  <div className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>SWR 4.0% (Standar)</span>
                  </div>
                  <div className="text-base sm:text-lg font-bold tracking-tight">
                    {decumulationResult.standardFailureYear !== null ? (
                      <span className="text-rose-400">Rp 0 (Habis)</span>
                    ) : (
                      <span className="text-zinc-100">
                        {formatCompactIDR(
                          decumulationResult.finalBalanceStandard
                        )}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {decumulationResult.standardFailureYear !== null ? (
                      <span className="text-rose-400 font-semibold">
                        Gagal Thn ke-{decumulationResult.standardFailureYear}
                      </span>
                    ) : (
                      <span className="text-emerald-400">Bertahan 30 Thn</span>
                    )}
                  </div>
                  <div className="pt-1 text-[10px] text-zinc-500">
                    Penarikan awal 4% saldo
                  </div>
                </div>

                {/* Card 2: Saldo Akhir SWR 3.25% */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 space-y-1 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                  <div className="text-[10px] sm:text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                    <span>SWR 3.25% (ID)</span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-400 tracking-tight">
                    {decumulationResult.conservativeFailureYear !== null ? (
                      <span className="text-rose-400">Rp 0 (Habis)</span>
                    ) : (
                      <span>
                        {formatCompactIDR(
                          decumulationResult.finalBalanceConservative
                        )}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {decumulationResult.conservativeFailureYear !== null ? (
                      <span className="text-rose-400 font-semibold">
                        Gagal Thn ke-{decumulationResult.conservativeFailureYear}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">
                        Aman & Kuat Utuh ✨
                      </span>
                    )}
                  </div>
                  <div className="pt-1 text-[10px] text-zinc-500">
                    Penarikan awal 3.25% saldo
                  </div>
                </div>

                {/* Card 3: Total Ditarik SWR 4% */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 space-y-1 relative overflow-hidden group hover:border-zinc-700 transition-all">
                  <div className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Total Ditarik (4.0%)
                  </div>
                  <div className="text-base sm:text-lg font-bold text-zinc-200 tracking-tight">
                    {formatCompactIDR(
                      decumulationResult.totalWithdrawalStandard
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Thn 1: {formatCompactIDR(decumulationResult.firstYearWithdrawalStandard)}/thn
                  </div>
                  <div className="pt-1 text-[10px] text-zinc-500">
                    Kumulatif selama hidup
                  </div>
                </div>

                {/* Card 4: Total Ditarik SWR 3.25% */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 space-y-1 relative overflow-hidden group hover:border-zinc-700 transition-all">
                  <div className="text-[10px] sm:text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
                    Total Ditarik (3.25%)
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-400 tracking-tight">
                    {formatCompactIDR(
                      decumulationResult.totalWithdrawalConservative
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Thn 1: {formatCompactIDR(decumulationResult.firstYearWithdrawalConservative)}/thn
                  </div>
                  <div className="pt-1 text-[10px] text-zinc-500">
                    Stabil & anti-bangkrut
                  </div>
                </div>
              </div>

              {/* Recharts LineChart */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 sm:p-5 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      Kurva Uji Ketahanan Saldo Portofolio (30 Tahun Pensiun)
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Perbandingan sisa saldo tahunan: SWR 4.0% vs SWR 3.25% Adaptasi Indonesia
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-medium">
                      Penyesuaian Inflasi: {decumParams.annualInflationRate}%/thn
                    </span>
                  </div>
                </div>

                <div className="w-full h-[360px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={decumulationResult.dataPoints}
                      margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="conservativeDecumGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.02}
                          />
                        </linearGradient>

                        <linearGradient
                          id="standardDecumGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f43f5e"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f43f5e"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#27272a"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="label"
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#3f3f46' }}
                        interval="preserveStartEnd"
                        minTickGap={16}
                      />

                      <YAxis
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#3f3f46' }}
                        tickFormatter={(val) => formatCompactIDR(val)}
                        width={56}
                      />

                      <Tooltip content={<CustomDecumulationTooltip />} cursor={{ stroke: '#52525b', strokeDasharray: '3 3' }} />

                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{
                          paddingBottom: '12px',
                          fontSize: '12px',
                        }}
                      />

                      {/* Depletion zero reference line */}
                      <ReferenceLine
                        y={0}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                        label={{
                          value: 'Batas Saldo Habis (Rp 0)',
                          position: 'insideBottomLeft',
                          fill: '#ef4444',
                          fontSize: 10,
                        }}
                      />

                      {/* Line 1: SWR 4.0% Standard */}
                      <Area
                        type="monotone"
                        dataKey="balanceStandard"
                        name="Sisa Saldo SWR 4.0% (Standar AS)"
                        stroke="#f43f5e"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#standardDecumGradient)"
                        isAnimationActive={false}
                        activeDot={{
                          r: 6,
                          stroke: '#f43f5e',
                          strokeWidth: 2,
                          fill: '#ffffff',
                        }}
                      />

                      {/* Line 2: SWR 3.25% Indonesian Adaptation */}
                      <Area
                        type="monotone"
                        dataKey="balanceConservative"
                        name="Sisa Saldo SWR 3.25% (Adaptasi Indo)"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#conservativeDecumGradient)"
                        isAnimationActive={false}
                        activeDot={{
                          r: 6,
                          stroke: '#10b981',
                          strokeWidth: 2,
                          fill: '#ffffff',
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Educational Insight Callout */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <Award className="w-4 h-4" />
                    <span>Rangkuman FinTech Advisor: Mengapa SWR 3.25% Unggul di Indonesia?</span>
                  </div>
                  <ul className="text-zinc-400 space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
                    <li>
                      <strong className="text-zinc-200">Volatilitas Inflasi Domestik:</strong> Inflasi di negara berkembang sering kali memiliki lonjakan mendadak akibat BBM/pangan yang melipatgandakan beban penarikan tahunan.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Sequence of Returns Risk (Risiko Urutan Imbal Hasil):</strong> Jika pasar saham anjlok di 3-5 tahun pertama masa pensiun bersamaan dengan penarikan 4%, portofolio tak pernah pulih secara matematis.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Rekomendasi Praktis:</strong> Gunakan SWR 3.0% - 3.25% sebagai *baseline*, dan terapkan strategi penarikan fleksibel (mengurangi pengeluaran liburan/tersier di tahun saat portofolio sedang terkoreksi).
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Expandable Annual Data Table Drawer/Section */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
        <button
          type="button"
          onClick={() => setShowTableModal(!showTableModal)}
          className="w-full flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Lihat Tabel Rincian Data Tahunan (Year-by-Year Breakdown)</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-500 text-[11px]">
            <span>{showTableModal ? 'Sembunyikan' : 'Buka Tabel Lengkap'}</span>
            {showTableModal ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {showTableModal && (
          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
            {/* Toolbar: View Switcher (Mobile), Counter, & Number Format Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-zinc-800/70">
              {/* Mobile View Mode Switcher (Kartu vs Tabel) */}
              <div className="flex sm:hidden items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setMobileTableView('card')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    mobileTableView === 'card'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kartu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTableView('table')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    mobileTableView === 'table'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
              </div>

              {/* Data Counter Info */}
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <span>
                  Menampilkan <strong className="text-zinc-200">{Math.min(tableDisplayLimit, totalTablePoints)}</strong> dari{' '}
                  <strong className="text-zinc-200">{totalTablePoints}</strong> tahun data
                </span>
              </div>

              {/* Number Format Toggle (Compact vs Full) */}
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 pl-1.5">Format:</span>
                <button
                  type="button"
                  onClick={() => setUseCompactNumbers(true)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    useCompactNumbers
                      ? 'bg-zinc-800 text-zinc-100 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Format ringkas (contoh: Rp 1,5 M)"
                >
                  Ringkas (Rp M)
                </button>
                <button
                  type="button"
                  onClick={() => setUseCompactNumbers(false)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    !useCompactNumbers
                      ? 'bg-zinc-800 text-zinc-100 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Format angka penuh (contoh: Rp 1.500.000.000)"
                >
                  Penuh (Rp 000)
                </button>
              </div>
            </div>

            {/* Mobile Card View (shown on mobile screens when mobileTableView === 'card') */}
            <div className={mobileTableView === 'card' ? 'block sm:hidden space-y-3' : 'hidden'}>
              {activeTab === 'accumulation' ? (
                displayedAccumulationPoints.map((row) => (
                  <div
                    key={row.year}
                    className={`p-3.5 rounded-xl border transition-all ${
                      row.isReached
                        ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-sm'
                        : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    {/* Card Header: Year + Status FIRE */}
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-zinc-800/60">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-100">{row.label}</span>
                        {row.isReached && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            🎯 FIRE
                          </span>
                        )}
                      </div>
                      <div>
                        {row.fireStatus === 'surplus' ? (
                          <div className="text-right">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block">
                              ✓ Surplus +{formatCompactIDR(row.fireDelta)}
                            </span>
                            <div className="text-[9px] text-emerald-400/80 mt-0.5">
                              +{row.fireDeltaPercent}% di atas target
                            </div>
                          </div>
                        ) : row.fireStatus === 'exact' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 inline-block">
                            ✓ Tepat Pas 100%
                          </span>
                        ) : (
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 inline-block">
                              - Defisit {formatCompactIDR(Math.abs(row.fireDelta))}
                            </span>
                            <div className="text-[9px] text-zinc-500 mt-0.5">
                              {row.fireDeltaPercent}% dari target
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hero Metric: Total Portofolio (Nominal) */}
                    <div className="bg-zinc-900/70 rounded-lg p-2.5 mb-2.5 border border-zinc-800/60 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
                          Total Portofolio (Nominal)
                        </div>
                        <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                          {useCompactNumbers ? formatCompactIDR(row.totalPortfolio) : formatIDR(row.totalPortfolio)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-zinc-400">Bunga Bergulung</div>
                        <div className="text-xs font-semibold font-mono text-teal-400 mt-0.5">
                          +{formatCompactIDR(row.compoundGain)}
                        </div>
                      </div>
                    </div>

                    {/* 2x2 Grid Detail */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-zinc-900/40 rounded-lg p-2 border border-zinc-800/40">
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>Pokok Disetor</span>
                        </div>
                        <div className="font-mono text-[11px] font-semibold text-zinc-200 mt-1">
                          {useCompactNumbers ? formatCompactIDR(row.totalPrincipal) : formatIDR(row.totalPrincipal)}
                        </div>
                      </div>

                      <div className="bg-zinc-900/40 rounded-lg p-2 border border-zinc-800/40">
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                          <span>Total Gain</span>
                        </div>
                        <div className="font-mono text-[11px] font-semibold text-teal-300 mt-1">
                          +{useCompactNumbers ? formatCompactIDR(row.compoundGain) : formatIDR(row.compoundGain)}
                        </div>
                      </div>

                      <div className="bg-zinc-900/40 rounded-lg p-2 border border-zinc-800/40">
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          <span>Portofolio Riil</span>
                        </div>
                        <div className="font-mono text-[11px] font-semibold text-sky-300 mt-1">
                          {useCompactNumbers ? formatCompactIDR(row.realPortfolio) : formatIDR(row.realPortfolio)}
                        </div>
                      </div>

                      <div className="bg-zinc-900/40 rounded-lg p-2 border border-zinc-800/40">
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          <span>Pokok Riil</span>
                        </div>
                        <div className="font-mono text-[11px] font-semibold text-purple-300 mt-1">
                          {useCompactNumbers ? formatCompactIDR(row.realPrincipal) : formatIDR(row.realPrincipal)}
                        </div>
                      </div>
                    </div>

                    {/* Dividend Pill inside accumulation card */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Dividen (Est. Bulanan):</span>
                      </div>
                      <div className="font-mono text-amber-300 font-semibold">
                        +{useCompactNumbers ? formatCompactIDR(row.monthlyDividend) : formatIDR(row.monthlyDividend)}
                        <span className="text-[9px] font-normal text-zinc-500">/bln</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                displayedDecumulationPoints.map((row) => (
                  <div
                    key={row.year}
                    className={`p-3.5 rounded-xl border transition-all ${
                      row.isStandardDepleted && !row.isConservativeDepleted
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : row.isStandardDepleted && row.isConservativeDepleted
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-zinc-800/60">
                      <span className="text-xs font-bold text-zinc-100">{row.label}</span>
                      <div>
                        {row.isStandardDepleted && !row.isConservativeDepleted ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            4% Habis • 3.25% Bertahan
                          </span>
                        ) : row.isStandardDepleted && row.isConservativeDepleted ? (
                          <span className="text-[10px] text-rose-500 font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                            Keduanya Habis
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 font-medium">
                            ✓ Keduanya Aman
                          </span>
                        )}
                      </div>
                    </div>

                    {/* SWR Comparison 2-Column Cards */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* SWR 4.0% */}
                      <div className={`p-2.5 rounded-lg border ${
                        row.isStandardDepleted ? 'bg-rose-950/25 border-rose-800/50' : 'bg-zinc-900/60 border-zinc-800/60'
                      }`}>
                        <div className="text-[10px] font-semibold text-zinc-300 pb-1 border-b border-zinc-800/40 flex items-center justify-between">
                          <span>SWR 4.0%</span>
                          {row.isStandardDepleted && <span className="text-[9px] text-rose-400 font-bold">HABIS</span>}
                        </div>
                        <div className="mt-1.5">
                          <div className="text-[9px] text-zinc-400">Penarikan</div>
                          <div className="font-mono text-[11px] text-zinc-300">
                            {useCompactNumbers ? formatCompactIDR(row.withdrawalStandard) : formatIDR(row.withdrawalStandard)}
                          </div>
                        </div>
                        <div className="mt-1.5">
                          <div className="text-[9px] text-zinc-400">Sisa Saldo</div>
                          <div className={`font-mono text-xs font-bold ${
                            row.isStandardDepleted ? 'text-rose-400' : 'text-zinc-100'
                          }`}>
                            {useCompactNumbers ? formatCompactIDR(row.balanceStandard) : formatIDR(row.balanceStandard)}
                          </div>
                        </div>
                      </div>

                      {/* SWR 3.25% */}
                      <div className={`p-2.5 rounded-lg border ${
                        row.isConservativeDepleted ? 'bg-rose-950/25 border-rose-800/50' : 'bg-emerald-950/15 border-emerald-900/40'
                      }`}>
                        <div className="text-[10px] font-semibold text-emerald-400 pb-1 border-b border-zinc-800/40 flex items-center justify-between">
                          <span>SWR 3.25%</span>
                          {row.isConservativeDepleted && <span className="text-[9px] text-rose-400 font-bold">HABIS</span>}
                        </div>
                        <div className="mt-1.5">
                          <div className="text-[9px] text-zinc-400">Penarikan</div>
                          <div className="font-mono text-[11px] text-emerald-300/90">
                            {useCompactNumbers ? formatCompactIDR(row.withdrawalConservative) : formatIDR(row.withdrawalConservative)}
                          </div>
                        </div>
                        <div className="mt-1.5">
                          <div className="text-[9px] text-zinc-400">Sisa Saldo</div>
                          <div className={`font-mono text-xs font-bold ${
                            row.isConservativeDepleted ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {useCompactNumbers ? formatCompactIDR(row.balanceConservative) : formatIDR(row.balanceConservative)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dividend Pill inside decumulation card */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Dividen Portofolio 3.25%:</span>
                      </div>
                      <div className="font-mono text-amber-300 font-semibold">
                        +{useCompactNumbers ? formatCompactIDR(row.annualDividendConservative) : formatIDR(row.annualDividendConservative)}
                        <span className="text-[9px] font-normal text-zinc-500">/thn</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Table View (shown on desktop or when mobileTableView === 'table' on mobile) */}
            <div className={mobileTableView === 'table' ? 'block' : 'hidden sm:block'}>
              {mobileTableView === 'table' && (
                <div className="flex sm:hidden items-center gap-1.5 text-[11px] text-zinc-400 mb-2">
                  <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Geser tabel ke samping untuk melihat seluruh kolom data ➔</span>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
                {activeTab === 'accumulation' ? (
                  <table className={`w-full text-left text-xs text-zinc-300 ${useCompactNumbers ? 'min-w-[620px]' : 'min-w-[780px]'}`}>
                    <thead className="text-[10px] uppercase bg-zinc-950 text-zinc-400 border-b border-zinc-800 sticky top-0 z-20">
                      <tr>
                        <th className="py-2.5 px-3 sticky left-0 bg-zinc-950 z-30 border-r border-zinc-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.7)]">
                          Tahun
                        </th>
                        <th className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            <span>Pokok (Nominal)</span>
                          </div>
                          <div className="text-[9px] font-normal normal-case text-zinc-500">
                            {chartFilters.nominalPrincipal ? '● Grafik On' : '○ Preview Aktif'}
                          </div>
                        </th>
                        <th className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Portofolio (Nominal)</span>
                          </div>
                          <div className="text-[9px] font-normal normal-case text-zinc-500">
                            {chartFilters.nominalPortfolio ? '● Grafik On' : '○ Preview Aktif'}
                          </div>
                        </th>
                        <th className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                            <span>Pokok Riil (-Inf)</span>
                          </div>
                          <div className="text-[9px] font-normal normal-case text-zinc-500">
                            {chartFilters.realPrincipal ? '● Grafik On' : '○ Preview Aktif'}
                          </div>
                        </th>
                        <th className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-sky-400" />
                            <span>Portofolio Riil (-Inf)</span>
                          </div>
                          <div className="text-[9px] font-normal normal-case text-zinc-500">
                            {chartFilters.realPortfolio ? '● Grafik On' : '○ Preview Aktif'}
                          </div>
                        </th>
                        <th className="py-2.5 px-3">Bunga Bergulung (Gain)</th>
                        <th className="py-2.5 px-3 text-amber-300">
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Dividen (Est. / Bln)</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3 bg-zinc-950 border-l border-zinc-800">
                          <div>Ketetapan Target FIRE</div>
                          <div className="text-[9px] font-normal normal-case text-zinc-500">
                            Target: {formatCompactIDR(accumulationResult.targetFIRE)}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                      {displayedAccumulationPoints.map((row) => (
                        <tr
                          key={row.year}
                          className={`hover:bg-zinc-800/40 transition-colors odd:bg-zinc-900/20 ${
                            row.isReached ? 'bg-emerald-500/5' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-sans font-semibold text-zinc-200 sticky left-0 bg-zinc-950 z-10 border-r border-zinc-800/80 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.7)]">
                            {row.label}
                          </td>
                          <td className="py-2 px-3 text-slate-300">
                            {useCompactNumbers ? formatCompactIDR(row.totalPrincipal) : formatIDR(row.totalPrincipal)}
                          </td>
                          <td className="py-2 px-3 font-bold text-emerald-400">
                            {useCompactNumbers ? formatCompactIDR(row.totalPortfolio) : formatIDR(row.totalPortfolio)}
                          </td>
                          <td className="py-2 px-3 text-purple-300">
                            {useCompactNumbers ? formatCompactIDR(row.realPrincipal) : formatIDR(row.realPrincipal)}
                          </td>
                          <td className="py-2 px-3 font-semibold text-sky-400">
                            {useCompactNumbers ? formatCompactIDR(row.realPortfolio) : formatIDR(row.realPortfolio)}
                          </td>
                          <td className="py-2 px-3 text-teal-400 font-medium">
                            +{useCompactNumbers ? formatCompactIDR(row.compoundGain) : formatIDR(row.compoundGain)}
                          </td>
                          <td className="py-2 px-3 text-amber-300 font-semibold">
                            +{useCompactNumbers ? formatCompactIDR(row.monthlyDividend) : formatIDR(row.monthlyDividend)}
                            <span className="text-[9px] text-zinc-500 font-normal">/bln</span>
                          </td>
                          <td className="py-2 px-3 font-sans border-l border-zinc-800/60">
                            {row.fireStatus === 'surplus' ? (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block w-fit">
                                  ✓ Surplus +{formatCompactIDR(row.fireDelta)}
                                </span>
                                <span className="text-[9px] text-emerald-400/80 mt-0.5">
                                  +{row.fireDeltaPercent}% di atas target
                                </span>
                              </div>
                            ) : row.fireStatus === 'exact' ? (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 inline-block w-fit">
                                  ✓ Pas 100% (Rp 0)
                                </span>
                                <span className="text-[9px] text-sky-400/80 mt-0.5">
                                  Tepat sesuai target
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 inline-block w-fit">
                                  - Defisit {formatCompactIDR(Math.abs(row.fireDelta))}
                                </span>
                                <span className="text-[9px] text-zinc-500 mt-0.5">
                                  {row.fireDeltaPercent}% dari target
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className={`w-full text-left text-xs text-zinc-300 ${useCompactNumbers ? 'min-w-[560px]' : 'min-w-[680px]'}`}>
                    <thead className="text-[10px] uppercase bg-zinc-950 text-zinc-400 border-b border-zinc-800 sticky top-0 z-20">
                      <tr>
                        <th className="py-2.5 px-3 sticky left-0 bg-zinc-950 z-30 border-r border-zinc-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.7)]">
                          Tahun Pensiun
                        </th>
                        <th className="py-2.5 px-3">Penarikan 4.0%</th>
                        <th className="py-2.5 px-3">Sisa Saldo SWR 4.0%</th>
                        <th className="py-2.5 px-3">Penarikan 3.25%</th>
                        <th className="py-2.5 px-3">Sisa Saldo SWR 3.25%</th>
                        <th className="py-2.5 px-3 text-amber-300">
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Dividen 3.25%</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3">Status Komparasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                      {displayedDecumulationPoints.map((row) => (
                        <tr
                          key={row.year}
                          className={`hover:bg-zinc-800/40 transition-colors odd:bg-zinc-900/20 ${
                            row.isStandardDepleted && !row.isConservativeDepleted
                              ? 'bg-rose-500/5'
                              : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-sans font-semibold text-zinc-200 sticky left-0 bg-zinc-950 z-10 border-r border-zinc-800/80 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.7)]">
                            {row.label}
                          </td>
                          <td className="py-2 px-3 text-zinc-400">
                            {useCompactNumbers ? formatCompactIDR(row.withdrawalStandard) : formatIDR(row.withdrawalStandard)}
                          </td>
                          <td
                            className={`py-2 px-3 font-bold ${
                              row.isStandardDepleted
                                ? 'text-rose-400'
                                : 'text-zinc-100'
                            }`}
                          >
                            {useCompactNumbers ? formatCompactIDR(row.balanceStandard) : formatIDR(row.balanceStandard)}
                          </td>
                          <td className="py-2 px-3 text-emerald-400/80">
                            {useCompactNumbers ? formatCompactIDR(row.withdrawalConservative) : formatIDR(row.withdrawalConservative)}
                          </td>
                          <td
                            className={`py-2 px-3 font-bold ${
                              row.isConservativeDepleted
                                ? 'text-rose-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {useCompactNumbers ? formatCompactIDR(row.balanceConservative) : formatIDR(row.balanceConservative)}
                          </td>
                          <td className="py-2 px-3 text-amber-300">
                            +{useCompactNumbers ? formatCompactIDR(row.annualDividendConservative) : formatIDR(row.annualDividendConservative)}
                            <span className="text-[9px] text-zinc-500 font-normal">/thn</span>
                          </td>
                          <td className="py-2 px-3 font-sans">
                            {row.isStandardDepleted && !row.isConservativeDepleted ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                4% Habis • 3.25% Bertahan
                              </span>
                            ) : row.isStandardDepleted && row.isConservativeDepleted ? (
                              <span className="text-[10px] text-rose-500 font-semibold">
                                Keduanya Habis
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400">
                                Keduanya Aman
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Pagination / Load More Controls */}
            {totalTablePoints > tableDisplayLimit ? (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setTableDisplayLimit((prev) => Math.min(prev + 10, totalTablePoints))}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                >
                  Tampilkan 10 Tahun Lagi (+10)
                </button>
                <button
                  type="button"
                  onClick={() => setTableDisplayLimit(totalTablePoints)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium transition-colors"
                >
                  Tampilkan Semua ({totalTablePoints} Tahun)
                </button>
              </div>
            ) : totalTablePoints > 15 ? (
              <div className="pt-2 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setTableDisplayLimit(15)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                >
                  Ciutkan ke 15 Tahun Pertama
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// Custom Tooltip Components for High-End Glassmorphism Recharts Tooltips
// =========================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomAccumulationTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as AccumulationDataPoint;
    return (
      <div className="bg-zinc-950/95 border border-zinc-700/90 p-2.5 sm:p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-[11px] sm:text-xs space-y-1.5 sm:space-y-2 min-w-[205px] sm:min-w-[270px] max-w-[85vw]">
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-zinc-800">
          <span className="font-bold text-zinc-200">{label}</span>
          {data.isReached && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
              Goal Reached
            </span>
          )}
        </div>

        <div className="space-y-1 sm:space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              Porto Nominal:
            </span>
            <span className="font-bold text-emerald-400 tabular-nums">
              {formatIDR(data.totalPortfolio)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              Pokok Nominal:
            </span>
            <span className="font-semibold text-zinc-300 tabular-nums">
              {formatIDR(data.totalPrincipal)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
              Porto Riil (-Inf):
            </span>
            <span className="font-semibold text-sky-400 tabular-nums">
              {formatIDR(data.realPortfolio)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              Pokok Riil (-Inf):
            </span>
            <span className="font-semibold text-purple-300 tabular-nums">
              {formatIDR(data.realPrincipal)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-400">Bunga Bergulung:</span>
            <span className="font-semibold text-teal-300 tabular-nums">
              +{formatIDR(data.compoundGain)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] pt-1.5 border-t border-zinc-800/80">
            <span className="text-zinc-400">Target FIRE:</span>
            <span
              className={`font-semibold tabular-nums ${
                data.fireStatus === 'surplus'
                  ? 'text-emerald-400'
                  : data.fireStatus === 'exact'
                  ? 'text-sky-400'
                  : 'text-rose-400'
              }`}
            >
              {data.fireStatus === 'surplus'
                ? `+${formatCompactIDR(data.fireDelta)} (+${data.fireDeltaPercent}%)`
                : data.fireStatus === 'exact'
                ? 'Pas 100% (Rp 0)'
                : `-${formatCompactIDR(Math.abs(data.fireDelta))} (${data.fireDeltaPercent}%)`}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomDecumulationTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950/95 border border-zinc-700/90 p-2.5 sm:p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-[11px] sm:text-xs space-y-2 min-w-[205px] sm:min-w-[260px] max-w-[85vw]">
        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
          <span className="font-bold text-zinc-200">{label} Pensiun</span>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          {/* SWR 4% */}
          <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60 space-y-1">
            <div className="flex items-center justify-between gap-2 font-semibold">
              <span className="text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                SWR 4.0%
              </span>
              <span
                className={
                  data.isStandardDepleted ? 'text-rose-400 tabular-nums' : 'text-zinc-200 tabular-nums'
                }
              >
                {formatIDR(data.balanceStandard)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] text-zinc-400">
              <span>Penarikan:</span>
              <span className="tabular-nums">{formatIDR(data.withdrawalStandard)}</span>
            </div>
          </div>

          {/* SWR 3.25% */}
          <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40 space-y-1">
            <div className="flex items-center justify-between gap-2 font-semibold">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                SWR 3.25% (ID)
              </span>
              <span
                className={
                  data.isConservativeDepleted
                    ? 'text-rose-400 tabular-nums'
                    : 'text-emerald-300 tabular-nums'
                }
              >
                {formatIDR(data.balanceConservative)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] text-zinc-400">
              <span>Penarikan:</span>
              <span className="tabular-nums">{formatIDR(data.withdrawalConservative)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
