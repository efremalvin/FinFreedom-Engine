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
    if (!isNaN(parsed)) {
      const clamped = Math.min(Math.max(parsed, min), max);
      onChange(clamped);
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

  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

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
    <div className="space-y-2">
      {/* Label and Tooltip Header */}
      <div className="flex items-center justify-between text-xs font-medium text-zinc-400 dark:text-zinc-400">
        <div className="flex items-center gap-1.5 group relative">
          <span className="text-zinc-300 font-medium">{label}</span>
          {tooltip && (
            <div className="relative cursor-help">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 bg-zinc-900 border border-zinc-700 rounded-md text-[11px] text-zinc-300 shadow-xl z-30 pointer-events-none">
                {tooltip}
              </div>
            </div>
          )}
        </div>

        {quickPresets && (
          <div className="flex items-center gap-1">
            {quickPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(preset.value)}
                className={`text-[10px] px-1.5 py-0.5 rounded transition-all ${
                  value === preset.value
                    ? 'bg-zinc-700 text-white font-semibold'
                    : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Numeric Input with Stepper Buttons */}
      <div
        className={`flex items-center bg-zinc-900/90 border border-zinc-800 rounded-lg px-2.5 py-1.5 focus-within:ring-2 transition-all ${accentClasses.border}`}
      >
        {prefix && (
          <span className="text-xs font-semibold text-zinc-500 select-none mr-1.5">
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
          className="w-full bg-transparent text-sm font-semibold text-zinc-100 focus:outline-none tabular-nums"
        />
        {suffix && (
          <span className="text-xs font-semibold text-zinc-500 select-none ml-1">
            {suffix}
          </span>
        )}

        <div className="flex items-center gap-1 ml-2 pl-2 border-l border-zinc-800">
          <button
            type="button"
            onClick={() => handleStep('down')}
            disabled={value <= min}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Kurangi"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => handleStep('up')}
            disabled={value >= max}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Tambah"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Synchronized Slider with Custom Track */}
      <div className="relative pt-1 pb-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer ${accentClasses.slider}`}
          style={{
            background: `linear-gradient(to right, rgb(16 185 129) 0%, rgb(16 185 129) ${percentage}%, rgb(39 39 42) ${percentage}%, rgb(39 39 42) 100%)`,
          }}
        />
        <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1 select-none">
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
    </div>
  );
};
