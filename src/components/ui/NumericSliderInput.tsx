'use client';

import React, { useState, useEffect } from 'react';
import { formatNumberWithDots, parseNumberFromFormatted } from '@/utils/formatters';
import { Plus, Minus, HelpCircle } from 'lucide-react';

interface NumericSliderInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  isCurrency?: boolean;
  tooltip?: string;
  quickPresets?: { label: string; value: number }[];
  accentColor?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'teal';
}

export const NumericSliderInput: React.FC<NumericSliderInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix = '',
  suffix = '',
  isCurrency = false,
  tooltip,
  quickPresets,
  accentColor = 'emerald',
}) => {
  const [inputValue, setInputValue] = useState<string>(
    isCurrency ? formatNumberWithDots(value) : value.toString()
  );
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Sync internal input display if external value changes while not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(isCurrency ? formatNumberWithDots(value) : value.toString());
    }
  }, [value, isFocused, isCurrency]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    const parsed = isCurrency ? parseNumberFromFormatted(raw) : parseFloat(raw);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = isCurrency ? parseNumberFromFormatted(inputValue) : parseFloat(inputValue);
    if (isNaN(parsed) || parsed < min) {
      onChange(min);
      setInputValue(isCurrency ? formatNumberWithDots(min) : min.toString());
    } else if (parsed > max) {
      onChange(max);
      setInputValue(isCurrency ? formatNumberWithDots(max) : max.toString());
    } else {
      onChange(parsed);
      setInputValue(isCurrency ? formatNumberWithDots(parsed) : parsed.toString());
    }
  };

  const handleStep = (direction: 'up' | 'down') => {
    const delta = direction === 'up' ? step : -step;
    const nextVal = Math.min(Math.max(value + delta, min), max);
    // Round to avoid float precision quirks
    const precision = step < 1 ? 2 : 0;
    const rounded = Number(nextVal.toFixed(precision));
    onChange(rounded);
  };

  const percentage = max > min ? Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100) : 0;

  const trackRgb = {
    emerald: '16 185 129',
    amber: '245 158 11',
    rose: '244 63 94',
    indigo: '99 102 241',
    teal: '20 184 166',
  }[accentColor] || '16 185 129';

  // Dynamic color classes based on accent
  const accentClasses = {
    emerald: {
      slider: 'accent-emerald-500',
      track: 'bg-emerald-500',
      border: 'focus-within:border-emerald-500 focus-within:ring-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    amber: {
      slider: 'accent-amber-500',
      track: 'bg-amber-500',
      border: 'focus-within:border-amber-500 focus-within:ring-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    rose: {
      slider: 'accent-rose-500',
      track: 'bg-rose-500',
      border: 'focus-within:border-rose-500 focus-within:ring-rose-500/20',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    indigo: {
      slider: 'accent-indigo-500',
      track: 'bg-indigo-500',
      border: 'focus-within:border-indigo-500 focus-within:ring-indigo-500/20',
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    teal: {
      slider: 'accent-teal-500',
      track: 'bg-teal-500',
      border: 'focus-within:border-teal-500 focus-within:ring-teal-500/20',
      badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    },
  }[accentColor];

  return (
    <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/70 space-y-2.5">
      {/* Label and Tooltip Header */}
      <div className="flex items-start justify-between gap-2 text-xs font-medium text-zinc-400">
        <div className="flex items-center gap-1.5 group relative">
          <span className="text-zinc-200 font-semibold leading-snug">{label}</span>
          {tooltip && (
            <div className="relative cursor-help shrink-0">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 transition-colors" />
              <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-52 p-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-[11px] text-zinc-200 shadow-2xl z-30 pointer-events-none leading-relaxed">
                {tooltip}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Numeric Input with Stepper Buttons */}
      <div
        className={`flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 sm:py-1.5 focus-within:ring-2 transition-all ${accentClasses.border}`}
      >
        {prefix && (
          <span className="text-xs sm:text-sm font-semibold text-zinc-400 select-none mr-1.5">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode={isCurrency ? 'numeric' : 'decimal'}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          className="w-full bg-transparent text-base font-bold text-zinc-100 focus:outline-none tabular-nums"
        />
        {suffix && (
          <span className="text-xs sm:text-sm font-semibold text-zinc-400 select-none ml-1 shrink-0">
            {suffix}
          </span>
        )}

        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => handleStep('down')}
            disabled={value <= min}
            className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-lg bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Kurangi"
          >
            <Minus className="w-4 h-4 sm:w-3 sm:h-3" />
          </button>
          <button
            type="button"
            onClick={() => handleStep('up')}
            disabled={value >= max}
            className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-lg bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Tambah"
          >
            <Plus className="w-4 h-4 sm:w-3 sm:h-3" />
          </button>
        </div>
      </div>

      {/* Synchronized Slider with Custom Track */}
      <div className="relative pt-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer ${accentClasses.slider}`}
          style={{
            background: `linear-gradient(to right, rgb(${trackRgb}) 0%, rgb(${trackRgb}) ${percentage}%, rgb(39 39 42) ${percentage}%, rgb(39 39 42) 100%)`,
          }}
        />
        <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1.5 select-none">
          <span>
            {prefix}
            {isCurrency ? formatNumberWithDots(min) : min}
            {suffix}
          </span>
          <span>
            {prefix}
            {isCurrency ? formatNumberWithDots(max) : max}
            {suffix}
          </span>
        </div>
      </div>

      {/* Quick Presets Pill Bar (Dedicated Row for Mobile & Desktop Comfort) */}
      {quickPresets && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {quickPresets.map((preset) => {
            const isSelected = value === preset.value;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(preset.value)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all active:scale-95 border ${
                  isSelected
                    ? accentClasses.badge + ' font-semibold shadow-sm'
                    : 'bg-zinc-900/90 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
