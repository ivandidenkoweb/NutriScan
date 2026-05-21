/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame } from 'lucide-react';
import { translations } from '../locales';

interface DailyStatsProps {
  targetKcal: number;
  targetProtein: number;
  targetFat: number;
  targetCarbs: number;
  consumedKcal: number;
  consumedProtein: number;
  consumedFat: number;
  consumedCarbs: number;
  lang: 'ua' | 'en';
  theme: 'light' | 'dark';
}

export default function DailyStats({
  targetKcal,
  targetProtein,
  targetFat,
  targetCarbs,
  consumedKcal,
  consumedProtein,
  consumedFat,
  consumedCarbs,
  lang,
  theme,
}: DailyStatsProps) {
  const isDark = theme === 'dark';
  const t = translations[lang];

  const kcalPercent = targetKcal > 0 ? Math.round((consumedKcal / targetKcal) * 100) : 0;
  const proteinPercent = targetProtein > 0 ? Math.round((consumedProtein / targetProtein) * 100) : 0;
  const fatPercent = targetFat > 0 ? Math.round((consumedFat / targetFat) * 100) : 0;
  const carbsPercent = targetCarbs > 0 ? Math.round((consumedCarbs / targetCarbs) * 100) : 0;

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, kcalPercent) / 100) * circumference;

  return (
    <div 
      id="daily-stats-card" 
      className={`rounded-[32px] border p-6 transition-all duration-300 ${
        isDark ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100' : 'bg-white border-[#E2E8E4] text-[#1A1C1B]'
      }`}
    >
      <h3 className={`text-sm font-bold uppercase tracking-wider mb-5 flex items-center justify-between ${
        isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'
      }`}>
        <span>{t.todaySummary}</span>
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${
          isDark ? 'bg-zinc-800 text-[#89FFA0]' : 'bg-[#DCEEE0] text-[#2D5A27]'
        }`}>
          {lang === 'ua' ? 'БЖУ / ККАЛ' : 'PFC / KCAL'}
        </span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Circle Progress */}
        <div className={`md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r pb-5 md:pb-0 md:pr-4 ${
          isDark ? 'border-zinc-800' : 'border-[#E2E8E4]'
        }`}>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                className={isDark ? "stroke-zinc-800" : "stroke-[#E2E8E4]"}
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                className={`${isDark ? 'stroke-[#89FFA0]' : 'stroke-[#2D5A27]'} transition-all duration-500 ease-out`}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center justify-center">
              <Flame className={`w-5.5 h-5.5 ${isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27]'}`} />
              <span className={`text-xl font-bold leading-none mt-1 ${isDark ? 'text-zinc-100' : 'text-[#1A1C1B]'}`}>{consumedKcal}</span>
              <span className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>
                {t.ofKcal.replace('{0}', String(targetKcal))}
              </span>
            </div>
          </div>
          <div className="text-center mt-3">
            <span className={`text-sm font-bold ${isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27]'}`}>{kcalPercent}% {t.completed}</span>
            <span className="block text-[11px] text-zinc-400 mt-0.5 font-medium">
              {consumedKcal >= targetKcal 
                ? t.goalReached 
                : t.remainingKcal.replace('{0}', String(Math.max(0, targetKcal - consumedKcal)))}
            </span>
          </div>
        </div>

        {/* Macros Progress Bar Lists */}
        <div className="md:col-span-8 space-y-4">
          {/* Proteins */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-[#1A1C1B]'}`}>
                <span className={`w-2.5 h-2.5 rounded-full inline-block ${isDark ? 'bg-[#89FFA0]' : 'bg-[#2D5A27]'}`}></span>
                {t.proteins}
              </span>
              <span className={`text-xs font-semibold font-mono ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>
                {consumedProtein.toFixed(1)}г <span className="opacity-40">/</span> {targetProtein}г ({proteinPercent}%)
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-[#E2E8E4]'}`}>
              <div
                style={{ width: `${Math.min(100, proteinPercent)}%` }}
                className={`h-full rounded-full transition-all duration-500 ease-out ${isDark ? 'bg-[#89FFA0]' : 'bg-[#2D5A27]'}`}
              ></div>
            </div>
          </div>

          {/* Fats */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-[#1A1C1B]'}`}>
                <span className={`w-2.5 h-2.5 rounded-full inline-block ${isDark ? 'bg-amber-400' : 'bg-[#4A5D4E]'}`}></span>
                {t.fats}
              </span>
              <span className={`text-xs font-semibold font-mono ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>
                {consumedFat.toFixed(1)}г <span className="opacity-40">/</span> {targetFat}г ({fatPercent}%)
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-[#E2E8E4]'}`}>
              <div
                style={{ width: `${Math.min(100, fatPercent)}%` }}
                className={`h-full rounded-full transition-all duration-500 ease-out ${isDark ? 'bg-amber-400' : 'bg-[#4A5D4E]'}`}
              ></div>
            </div>
          </div>

          {/* Carbs */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-[#1A1C1B]'}`}>
                <span className={`w-2.5 h-2.5 rounded-full inline-block ${isDark ? 'bg-[#A2C3A8]' : 'bg-[#718B76]'}`}></span>
                {t.carbs}
              </span>
              <span className={`text-xs font-semibold font-mono ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>
                {consumedCarbs.toFixed(1)}г <span className="opacity-40">/</span> {targetCarbs}г ({carbsPercent}%)
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-[#E2E8E4]'}`}>
              <div
                style={{ width: `${Math.min(100, carbsPercent)}%` }}
                className={`h-full rounded-full transition-all duration-500 ease-out ${isDark ? 'bg-[#A2C3A8]' : 'bg-[#718B76]'}`}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
