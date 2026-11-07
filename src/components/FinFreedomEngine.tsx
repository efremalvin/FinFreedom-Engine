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
  DecumulationParams,
} from '@/types/simulator';

// Initial Defaults for Modul A
const defaultAccumulationParams: AccumulationParams = {
  initialCapital: 50_000_000,
  monthlyInvestment: 5_000_000,
  targetMonthlyExpense: 10_000_000,
  annualReturn: 10.0,
  annualInflation: 4.0,
  timeHorizonYears: 20,
  swrMultiplier: 25,
};

// Initial Defaults for Modul B
const defaultDecumulationParams: DecumulationParams = {
  initialRetirementBalance: 3_000_000_000,
  firstYearExpense: 120_000_000,
  annualPortfolioReturn: 8.0,
  annualInflationRate: 4.5,
  retirementYears: 30,
  useAutomaticFirstYearExpense: true,
};

export const FinFreedomEngine: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('accumulation');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [showTableModal, setShowTableModal] = useState<boolean>(false);

  // Modul A State
  const [accumParams, setAccumParams] =
    useState<AccumulationParams>(defaultAccumulationParams);

  // Modul B State
  const [decumParams, setDecumParams] =
    useState<DecumulationParams>(defaultDecumulationParams);

  // Client hydration check
  useEffect(() => {
    setMounted(true);
    // Sync html dark class
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
  }, []);

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
      <div className="w-full min-h-[600px] flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-sm font-medium">Memuat Simulator Finansial...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
              <Sparkles className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                FinFreedom Engine
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ID Edition
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Arsitektur Finansial FIRE & Pengujian Ketahanan Portofolio Pensiun Indonesia
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-all"
            title="Ganti Tema Tampilan"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Module Tab Switcher */}
      <nav aria-label="Simulasi Finansial Tab" className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800/90 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-2 w-full sm:w-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('accumulation')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${
              activeTab === 'accumulation'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>1. Akumulasi Dana FIRE</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-md ${
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
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${
              activeTab === 'decumulation'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>2. Uji Ketahanan SWR</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-md ${
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

      {/* Main Simulation Viewport (2-Column Grid on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================================= */}
        {/* TAB 1: MODUL A - AKUMULASI DANA MENUJU FINANCIAL FREEDOM */}
        {/* ========================================================================= */}
        {activeTab === 'accumulation' && (
          <>
            {/* Left Column: Control Panel */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-5">
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
                        Sesuaikan modal, tabungan bulanan, dan profil imbal hasil
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAccumParams(defaultAccumulationParams)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    title="Reset ke Nilai Standar"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 1. Modal Awal */}
                <NumericSliderInput
                  label="Modal Awal (Pokok Pertama)"
                  value={accumParams.initialCapital}
                  onChange={(val) =>
                    setAccumParams((prev) => ({ ...prev, initialCapital: val }))
                  }
                  min={0}
                  max={1_000_000_000}
                  step={5_000_000}
                  prefix="Rp"
                  isCurrency={true}
                  tooltip="Total dana investasi yang telah Anda miliki saat ini."
                  quickPresets={[
                    { label: '0', value: 0 },
                    { label: '50 Jt', value: 50_000_000 },
                    { label: '100 Jt', value: 100_000_000 },
                    { label: '250 Jt', value: 250_000_000 },
                  ]}
                  accentColor="emerald"
                />

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
                    { label: '3% Rendah', value: 3.0 },
                    { label: '4% Target BI', value: 4.0 },
                    { label: '5.5% Tinggi', value: 5.5 },
                  ]}
                  accentColor="emerald"
                />

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
                <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Percent className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Imbal Hasil Riil Bersih (Net of Inflation):</span>
                  </div>
                  <span
                    className={`font-bold ${
                      accumulationResult.realReturnRate > 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {accumulationResult.realReturnRate.toFixed(1)}% / tahun
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Stat Cards & Recharts Graph */}
            <div className="lg:col-span-7 space-y-5">
              {/* Stat Cards (4 Cards Grid) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Card 1: Target Dana FIRE */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                  <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Target Dana FIRE
                  </div>
                  <div className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
                    {formatCompactIDR(accumulationResult.targetFIRE)}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {formatIDR(accumulationResult.targetFIRE)}
                  </div>
                  <div className="pt-1 text-[10px] text-emerald-400/90 font-medium">
                    {accumParams.swrMultiplier}x biaya hidup thn
                  </div>
                </div>

                {/* Card 2: Proyeksi Portofolio Akhir */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                  <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Nilai Akhir Portofolio
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-400 tracking-tight">
                    {formatCompactIDR(accumulationResult.finalPortfolio)}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {formatIDR(accumulationResult.finalPortfolio)}
                  </div>
                  <div className="pt-1 text-[10px] text-zinc-400">
                    Thn ke-{accumParams.timeHorizonYears}
                  </div>
                </div>

                {/* Card 3: Waktu Tercapai */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                  <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Estimasi Capai FIRE
                  </div>
                  <div className="text-base sm:text-lg font-bold tracking-tight">
                    {accumulationResult.yearReached !== null ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        Tahun ke-{accumulationResult.yearReached}
                      </span>
                    ) : (
                      <span className="text-amber-400 text-sm">
                        &gt; {accumParams.timeHorizonYears} Thn
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {accumulationResult.yearReached !== null ? (
                      <span className="text-emerald-500 font-medium">
                        Goal Tercapai! 🎯
                      </span>
                    ) : (
                      <span>Butuh top-up / horizon lebih lama</span>
                    )}
                  </div>
                  <div className="pt-1 text-[10px] text-zinc-500">
                    {accumulationResult.yearReached !== null
                      ? `Dalam ${accumulationResult.yearReached * 12} bulan`
                      : `Defisit Rp ${formatCompactIDR(
                          accumulationResult.targetFIRE -
                            accumulationResult.finalPortfolio
                        )}`}
                  </div>
                </div>

                {/* Card 4: Passive Income Bulanan */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                  <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Passive Income Aman
                  </div>
                  <div className="text-base sm:text-lg font-bold text-teal-300 tracking-tight">
                    {formatCompactIDR(
                      accumulationResult.safeMonthlyPassiveIncome
                    )}
                    <span className="text-xs font-normal text-zinc-400">/bln</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {formatIDR(accumulationResult.safeMonthlyPassiveIncome)}
                  </div>
                  <div className="pt-1 text-[10px] text-zinc-400">
                    Dihasilkan portofolio akhir
                  </div>
                </div>
              </div>

              {/* Composition Breakdown Bar */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    Komposisi Portofolio di Tahun ke-{accumParams.timeHorizonYears}
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
                    title={`Modal Disetor: ${formatIDR(
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

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <span>
                      Modal Disetor:{' '}
                      <strong className="text-zinc-200">
                        {formatCompactIDR(accumulationResult.finalPrincipal)}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>
                      Keuntungan Investasi (Bunga Bergulung):{' '}
                      <strong className="text-emerald-400">
                        {formatCompactIDR(accumulationResult.finalGain)}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Recharts AreaChart */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      Visualisasi Pertumbuhan Portofolio Majemuk
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Kurva akumulasi nilai portofolio vs target dana Financial Freedom
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                      Garis Putus-putus: Target FIRE (
                      {formatCompactIDR(accumulationResult.targetFIRE)})
                    </span>
                  </div>
                </div>

                <div className="w-full h-[360px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={accumulationResult.dataPoints}
                      margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        {/* Gradient for Total Portfolio */}
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
                            stopOpacity={0.45}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.02}
                          />
                        </linearGradient>

                        {/* Gradient for Principal */}
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
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="#64748b"
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
                      />

                      <YAxis
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#3f3f46' }}
                        tickFormatter={(val) => formatCompactIDR(val)}
                        width={70}
                      />

                      <Tooltip content={<CustomAccumulationTooltip />} />

                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{
                          paddingBottom: '12px',
                          fontSize: '12px',
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

                      {/* Area 1: Total Portfolio */}
                      <Area
                        type="monotone"
                        dataKey="totalPortfolio"
                        name="Total Portofolio (Bunga Bergulung)"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#portfolioGradient)"
                        activeDot={{
                          r: 6,
                          stroke: '#10b981',
                          strokeWidth: 2,
                          fill: '#ffffff',
                        }}
                      />

                      {/* Area 2: Principal (Modal Disetor) */}
                      <Area
                        type="monotone"
                        dataKey="totalPrincipal"
                        name="Total Modal Disetor (Pokok)"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#principalGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Milestone Callout */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-3 text-xs">
                  <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-zinc-200">
                      {accumulationResult.yearReached !== null
                        ? `Analisis: Target Financial Freedom Tercapai di Tahun ke-${accumulationResult.yearReached}`
                        : `Analisis: Belum Menyentuh Target dalam ${accumParams.timeHorizonYears} Tahun`}
                    </p>
                    <p className="text-zinc-400 leading-relaxed text-[11px]">
                      {accumulationResult.yearReached !== null ? (
                        <>
                          Dengan modal awal{' '}
                          <strong className="text-zinc-200">
                            {formatCompactIDR(accumParams.initialCapital)}
                          </strong>{' '}
                          dan konsistensi investasi rutin bulanan{' '}
                          <strong className="text-zinc-200">
                            {formatCompactIDR(accumParams.monthlyInvestment)}
                          </strong>{' '}
                          pada imbal hasil bersih{' '}
                          <strong className="text-emerald-400">
                            {accumParams.annualReturn}%
                          </strong>
                          , portofolio Anda akan menghasilkan pasif income aman{' '}
                          <strong className="text-emerald-400">
                            {formatIDR(
                              accumulationResult.safeMonthlyPassiveIncome
                            )}
                            /bulan
                          </strong>
                          , melampaui target gaya hidup Rp{' '}
                          {formatNumberWithDots(accumParams.targetMonthlyExpense)}
                          /bulan.
                        </>
                      ) : (
                        <>
                          Portofolio Anda mencapai{' '}
                          <strong className="text-zinc-200">
                            {formatCompactIDR(accumulationResult.finalPortfolio)}
                          </strong>
                          , namun masih berjarak{' '}
                          <strong className="text-amber-400">
                            {formatCompactIDR(
                              accumulationResult.targetFIRE -
                                accumulationResult.finalPortfolio
                            )}
                          </strong>{' '}
                          dari target aman FIRE. Coba tingkatkan investasi bulanan
                          atau perpanjang horison waktu investasi beberapa tahun.
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
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-5">
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
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
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
                  <div className="flex items-center justify-between text-xs">
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
                    <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs flex justify-between items-center">
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
                    { label: '3.5% Rendah', value: 3.5 },
                    { label: '4.5% Historis ID', value: 4.5 },
                    { label: '6.0% Konservatif', value: 6.0 },
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
              </div>
            </div>

            {/* Right Column: Decumulation Stats & Graphs */}
            <div className="lg:col-span-7 space-y-5">
              {/* Failure Alert Banner if standard 4% runs out */}
              {decumulationResult.standardFailureYear !== null ? (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-200">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-sm text-rose-400 flex items-center gap-2">
                      ⚠️ Portfolio Failure Terdeteksi pada SWR 4.0%
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
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
                    <div className="font-bold text-sm text-emerald-400">
                      Kedua Skenario Sukses Melewati {decumParams.retirementYears} Tahun!
                    </div>
                    <p className="text-zinc-300 text-[11px]">
                      Imbal hasil portofolio Anda ({decumParams.annualPortfolioReturn}%) cukup kuat mengatasi penarikan dan tekanan inflasi ({decumParams.annualInflationRate}%).
                    </p>
                  </div>
                </div>
              )}

              {/* Stat Cards Grid (4 Cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Card 1: Saldo Akhir SWR 4.0% */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1 relative overflow-hidden group hover:border-zinc-700 transition-all">
                  <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center justify-between">
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
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                  <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                    <span>SWR 3.25% (Adaptasi ID)</span>
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
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1 relative overflow-hidden group hover:border-zinc-700 transition-all">
                  <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
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
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1 relative overflow-hidden group hover:border-zinc-700 transition-all">
                  <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
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
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-3">
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
                      />

                      <YAxis
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#3f3f46' }}
                        tickFormatter={(val) => formatCompactIDR(val)}
                        width={70}
                      />

                      <Tooltip content={<CustomDecumulationTooltip />} />

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
          <div className="mt-4 pt-4 border-t border-zinc-800 overflow-x-auto">
            {activeTab === 'accumulation' ? (
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="text-[10px] uppercase bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3">Tahun</th>
                    <th className="py-2.5 px-3">Modal Pokok Disetor</th>
                    <th className="py-2.5 px-3">Bunga Bergulung (Gain)</th>
                    <th className="py-2.5 px-3">Total Portofolio (Nominal)</th>
                    <th className="py-2.5 px-3">Nilai Riil (Daya Beli)</th>
                    <th className="py-2.5 px-3">Status FIRE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                  {accumulationResult.dataPoints.map((row) => (
                    <tr
                      key={row.year}
                      className={`hover:bg-zinc-800/40 transition-colors ${
                        row.isReached ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-sans font-semibold text-zinc-200">
                        {row.label}
                      </td>
                      <td className="py-2 px-3">{formatIDR(row.totalPrincipal)}</td>
                      <td className="py-2 px-3 text-emerald-400 font-medium">
                        +{formatIDR(row.compoundGain)}
                      </td>
                      <td className="py-2 px-3 font-bold text-zinc-100">
                        {formatIDR(row.totalPortfolio)}
                      </td>
                      <td className="py-2 px-3 text-zinc-400">
                        {formatIDR(row.realPortfolio)}
                      </td>
                      <td className="py-2 px-3 font-sans">
                        {row.isReached ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✓ Bebas Finansial
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500">
                            Akumulasi
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="text-[10px] uppercase bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3">Tahun Pensiun</th>
                    <th className="py-2.5 px-3">Penarikan 4.0%</th>
                    <th className="py-2.5 px-3">Sisa Saldo SWR 4.0%</th>
                    <th className="py-2.5 px-3">Penarikan 3.25%</th>
                    <th className="py-2.5 px-3">Sisa Saldo SWR 3.25%</th>
                    <th className="py-2.5 px-3">Status Komparasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                  {decumulationResult.dataPoints.map((row) => (
                    <tr
                      key={row.year}
                      className={`hover:bg-zinc-800/40 transition-colors ${
                        row.isStandardDepleted && !row.isConservativeDepleted
                          ? 'bg-rose-500/5'
                          : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-sans font-semibold text-zinc-200">
                        {row.label}
                      </td>
                      <td className="py-2 px-3 text-zinc-400">
                        {formatIDR(row.withdrawalStandard)}
                      </td>
                      <td
                        className={`py-2 px-3 font-bold ${
                          row.isStandardDepleted
                            ? 'text-rose-400'
                            : 'text-zinc-100'
                        }`}
                      >
                        {formatIDR(row.balanceStandard)}
                      </td>
                      <td className="py-2 px-3 text-emerald-400/80">
                        {formatIDR(row.withdrawalConservative)}
                      </td>
                      <td
                        className={`py-2 px-3 font-bold ${
                          row.isConservativeDepleted
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {formatIDR(row.balanceConservative)}
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
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950/95 border border-zinc-700/90 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[240px]">
        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
          <span className="font-bold text-zinc-200">{label}</span>
          {data.isReached && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
              Goal Reached
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Total Portofolio:
            </span>
            <span className="font-bold text-emerald-400">
              {formatIDR(data.totalPortfolio)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Modal Pokok Disetor:
            </span>
            <span className="font-semibold text-zinc-300">
              {formatIDR(data.totalPrincipal)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Bunga Bergulung (Gain):</span>
            <span className="font-semibold text-teal-300">
              +{formatIDR(data.compoundGain)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/80">
            <span>Daya Beli Riil (Inflasi):</span>
            <span>{formatIDR(data.realPortfolio)}</span>
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
      <div className="bg-zinc-950/95 border border-zinc-700/90 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[260px]">
        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
          <span className="font-bold text-zinc-200">{label} Pensiun</span>
        </div>

        <div className="space-y-2">
          {/* SWR 4% */}
          <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60 space-y-1">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                SWR 4.0% (Standar AS)
              </span>
              <span
                className={
                  data.isStandardDepleted ? 'text-rose-400' : 'text-zinc-200'
                }
              >
                {formatIDR(data.balanceStandard)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Penarikan thn ini:</span>
              <span>{formatIDR(data.withdrawalStandard)}</span>
            </div>
          </div>

          {/* SWR 3.25% */}
          <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40 space-y-1">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                SWR 3.25% (Adaptasi ID)
              </span>
              <span
                className={
                  data.isConservativeDepleted
                    ? 'text-rose-400'
                    : 'text-emerald-300'
                }
              >
                {formatIDR(data.balanceConservative)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Penarikan thn ini:</span>
              <span>{formatIDR(data.withdrawalConservative)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
