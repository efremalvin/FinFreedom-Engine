'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SavedScenario, AccumulationParams, DecumulationParams, TabType } from '@/types/simulator';
import {
  Cloud,
  CheckCircle2,
  CloudOff,
  LogOut,
  Bookmark,
  Plus,
  Trash2,
  ChevronDown,
  Sparkles,
  Check,
  FolderOpen,
  User,
  Shield,
} from 'lucide-react';

interface UserAuthMenuProps {
  currentAccumParams: AccumulationParams;
  currentDecumParams: DecumulationParams;
  currentActiveTab: TabType;
  onApplyScenario: (scenario: SavedScenario) => void;
}

export const UserAuthMenu: React.FC<UserAuthMenuProps> = ({
  currentAccumParams,
  currentDecumParams,
  currentActiveTab,
  onApplyScenario,
}) => {
  const {
    user,
    isAuthenticated,
    isDemo,
    syncStatus,
    scenarios,
    activeScenarioId,
    loginWithGoogle,
    loginDemo,
    logout,
    saveScenarioWithData,
    deleteScenario,
  } = useAuth() as any;

  const [isOpen, setIsOpen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDesc, setNewScenarioDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScenarioName.trim()) return;
    setIsSaving(true);
    try {
      await saveScenarioWithData(
        newScenarioName,
        newScenarioDesc,
        currentActiveTab,
        currentAccumParams,
        currentDecumParams
      );
      setNewScenarioName('');
      setNewScenarioDesc('');
      setShowSaveModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      {!isAuthenticated ? (
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Guest Badge */}
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Mode Tamu (Bebas Akses)
          </span>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={loginWithGoogle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 text-xs font-medium text-zinc-200 transition-all shadow-xs hover:text-white"
          >
            {/* Google G Logo SVG */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk Google</span>
          </button>

          {/* Quick Demo Mode Button */}
          <button
            type="button"
            onClick={loginDemo}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium transition-colors"
            title="Uji coba fitur simpan skenario simulasi tanpa konfigurasi Google Cloud"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo Mode</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {/* User Profile Pill */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all text-xs text-zinc-200"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-6 h-6 rounded-full object-cover border border-emerald-500/50"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <div className="font-semibold text-zinc-200 text-xs leading-none">
                {user.name.split(' ')[0]}
              </div>
              <div className="text-[9px] text-zinc-400 flex items-center gap-1 mt-0.5">
                {isDemo ? (
                  <span className="text-amber-400">Demo User</span>
                ) : syncStatus === 'synced' ? (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <Cloud className="w-2.5 h-2.5" /> GDrive OK
                  </span>
                ) : syncStatus === 'syncing' ? (
                  <span className="text-sky-400 animate-pulse">Syncing...</span>
                ) : (
                  <span>Lokal</span>
                )}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Quick Save Scenario Button */}
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simpan Skenario</span>
          </button>
        </div>
      )}

      {/* User Dropdown Drawer */}
      {isOpen && isAuthenticated && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl backdrop-blur-xl z-50 p-4 space-y-4">
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-3">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    {user?.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    <span>{user?.name}</span>
                    {isDemo && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                        DEMO
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400">{user?.email}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Cloud Sync Status Card */}
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-zinc-200 text-[11px]">
                    {isDemo ? 'Google Drive Demo Mock Storage' : 'Google Drive AppDataFolder'}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    File: <code className="text-zinc-300">finfreedom_scenarios.json</code>
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                ✓ Aktif
              </span>
            </div>

            {/* Scenarios Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Skenario Simulasi ({scenarios.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveModal(true);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan Baru</span>
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {scenarios.length === 0 ? (
                  <div className="p-3 text-center text-xs text-zinc-500 rounded-lg bg-zinc-900/30 border border-zinc-800/40">
                    Belum ada skenario tersimpan.
                  </div>
                ) : (
                  scenarios.map((scen: SavedScenario) => {
                    const isSelected = activeScenarioId === scen.id;
                    return (
                      <div
                        key={scen.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
                          isSelected
                            ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20'
                            : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/80'
                        }`}
                      >
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            onApplyScenario(scen);
                            setIsOpen(false);
                          }}
                        >
                          <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                            <span>{scen.name}</span>
                            {isSelected && (
                              <span className="text-[9px] text-emerald-400 font-bold">● Aktif</span>
                            )}
                          </div>
                          {scen.description && (
                            <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                              {scen.description}
                            </div>
                          )}
                          <div className="text-[9px] text-zinc-500 mt-0.5">
                            Modul: {scen.activeTab === 'accumulation' ? 'Akumulasi' : 'Dekumulasi'} •{' '}
                            {new Date(scen.updatedAt).toLocaleDateString('id-ID')}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onApplyScenario(scen);
                              setIsOpen(false);
                            }}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-emerald-600/30 hover:text-emerald-300 text-[10px] font-medium text-zinc-300 transition-colors"
                          >
                            Muat
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteScenario(scen.id)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Hapus skenario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Save Scenario Modal Dialog */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                <Bookmark className="w-4 h-4 text-emerald-400" />
                <span>Simpan Skenario Simulasi</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveScenario} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nama Skenario
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Pensiun Dini FIRE 40 Tahun"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-emerald-500 text-xs text-zinc-100 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Portofolio 70% Saham Dividen IDX, 30% Obligasi FR"
                  value={newScenarioDesc}
                  onChange={(e) => setNewScenarioDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-emerald-500 text-xs text-zinc-100 outline-hidden resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tersimpan Otomatis ke Google Drive</span>
                </div>
                <p>
                  Parameter simulasi saat ini akan disimpan dan disinkronkan ke folder aman Google Drive pribadi Anda.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newScenarioName.trim()}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
