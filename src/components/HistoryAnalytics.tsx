/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FoodItem, UserProfile } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  Flame, 
  Apple, 
  Droplet, 
  Activity,  
  Info, 
  Calendar,
  CheckCircle2,
  CalendarDays,
  Award
} from 'lucide-react';

interface HistoryAnalyticsProps {
  diaryItems: FoodItem[];
  profile: UserProfile;
  lang: 'ua' | 'en';
  theme: 'light' | 'dark';
}

type PeriodType = 'daily' | 'weekly' | 'monthly';
type MetricType = 'kcal' | 'proteins' | 'fats' | 'carbohydrates';

export default function HistoryAnalytics({ diaryItems, profile, lang, theme }: HistoryAnalyticsProps) {
  const isDark = theme === 'dark';

  // Toggle states
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [metric, setMetric] = useState<MetricType>('kcal');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Translations
  const t = {
    title: lang === 'ua' ? 'Історія та аналітика споживання' : 'Consumption History & Analytics',
    subtitle: lang === 'ua' ? 'Моніторинг вашого прогресу, КБЖУ балансу та звичок харчування' : 'Track your nutrition milestones, calorie budgets, and habits',
    dailyLabel: lang === 'ua' ? 'Останні 7 днів' : 'Last 7 Days',
    weeklyLabel: lang === 'ua' ? 'Останні 4 тижні' : 'Last 4 Weeks',
    monthlyLabel: lang === 'ua' ? 'Останні 6 місяців' : 'Last 6 Months',
    metricCalories: lang === 'ua' ? 'Калорії' : 'Calories',
    metricProteins: lang === 'ua' ? 'Білки' : 'Proteins',
    metricFats: lang === 'ua' ? 'Жири' : 'Fats',
    metricCarbs: lang === 'ua' ? 'Вуглеводи' : 'Carbs',
    averageLabel: lang === 'ua' ? 'Середнє споживання' : 'Average Intake',
    targetLabel: lang === 'ua' ? 'Ваша ціль' : 'Your Goal',
    adherenceTitle: lang === 'ua' ? 'Дотримання норми' : 'Goal Compliance',
    adherenceExcellent: lang === 'ua' ? 'Чудово' : 'Excellent',
    adherenceGood: lang === 'ua' ? 'Добре' : 'Good',
    adherenceNeedAdj: lang === 'ua' ? 'Потребує коригування' : 'Needs Adjustment',
    emptyHistory: lang === 'ua' ? 'Немає записаних страв за цей період.' : 'No logged meals for this period.',
    periodSummaryTitle: lang === 'ua' ? 'Підсумок за період' : 'Period Summary Check',
    compositionTitle: lang === 'ua' ? 'Співвідношення макронутрієнтів' : 'Macronutrient Balance Ratio',
    actualRatio: lang === 'ua' ? 'Фактичне' : 'Actual',
    targetRatio: lang === 'ua' ? 'Цільове' : 'Target',
    weeksAgo: lang === 'ua' ? 'тиж. тому' : 'w. ago',
    weekOf: lang === 'ua' ? 'Тиждень ' : 'Week of ',
    monthOf: lang === 'ua' ? 'Місяць ' : 'Month of ',
    currentDayLabel: lang === 'ua' ? 'Сьогодні' : 'Today',
    complianceRate: lang === 'ua' ? 'Частка успішних днів' : 'Success Days Rate',
    kcalUnit: lang === 'ua' ? 'ккал' : 'kcal',
    gUnit: lang === 'ua' ? 'г' : 'g',
  };

  // 1. Core target mapping helper
  const targetValue = useMemo(() => {
    switch (metric) {
      case 'kcal': return profile.targetKcal || 2300;
      case 'proteins': return profile.targetProtein || 120;
      case 'fats': return profile.targetFat || 70;
      case 'carbohydrates': return profile.targetCarbs || 270;
    }
  }, [metric, profile]);

  // Helper date formatters
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 2. Data aggregation logic based on the active period
  const aggregatedData = useMemo(() => {
    const now = new Date();

    if (period === 'daily') {
      // 7 Daily columns leading up to today
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = getLocalDateString(d);
        
        // Find all food items logged on this date
        const dayMeals = diaryItems.filter(item => item.date === dateStr);
        const kcal = dayMeals.reduce((sum, item) => sum + item.kcal, 0);
        const proteins = dayMeals.reduce((sum, item) => sum + item.proteins, 0);
        const fats = dayMeals.reduce((sum, item) => sum + item.fats, 0);
        const carbohydrates = dayMeals.reduce((sum, item) => sum + item.carbohydrates, 0);

        // Generate clean display label (e.g. "Пн" or "Mo" or date numbers)
        const dayNamesUa = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayLabel = i === 0 
          ? t.currentDayLabel 
          : (lang === 'ua' ? dayNamesUa[d.getDay()] : dayNamesEn[d.getDay()]);

        result.push({
          key: dateStr,
          label: `${dayLabel} (${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')})`,
          kcal: Math.round(kcal),
          proteins: Math.round(proteins),
          fats: Math.round(fats),
          carbohydrates: Math.round(carbohydrates),
          itemCount: dayMeals.length
        });
      }
      return result;

    } else if (period === 'weekly') {
      // 4 Rolling 7-day week periods leading up to today
      const result = [];
      for (let w = 3; w >= 0; w--) {
        const weekMeals: FoodItem[] = [];
        
        // Boundaries of this 7-day window
        const startOffset = w * 7 + 6;
        const endOffset = w * 7;
        
        const startDate = new Date();
        startDate.setDate(now.getDate() - startOffset);
        const endDate = new Date();
        endDate.setDate(now.getDate() - endOffset);

        // Filter items within this date range
        // Since dates are YYYY-MM-DD strings, doing alpha comparison or date ranges is safe
        const startStr = getLocalDateString(startDate);
        const endStr = getLocalDateString(endDate);

        diaryItems.forEach(item => {
          if (item.date >= startStr && item.date <= endStr) {
            weekMeals.push(item);
          }
        });

        const totalKcal = weekMeals.reduce((sum, item) => sum + item.kcal, 0);
        const totalP = weekMeals.reduce((sum, item) => sum + item.proteins, 0);
        const totalF = weekMeals.reduce((sum, item) => sum + item.fats, 0);
        const totalC = weekMeals.reduce((sum, item) => sum + item.carbohydrates, 0);

        // Display weekly daily averages so user can directly compare averages with daily budget limit
        const numDays = 7;
        result.push({
          key: `week-${w}`,
          label: w === 0 
            ? (lang === 'ua' ? 'Поточний тиждень' : 'This Week') 
            : `${w} ${t.weeksAgo}`,
          kcal: Math.round(totalKcal / numDays),
          proteins: Math.round(totalP / numDays),
          fats: Math.round(totalF / numDays),
          carbohydrates: Math.round(totalC / numDays),
          itemCount: weekMeals.length
        });
      }
      return result;

    } else {
      // 6 calendar months leading to today
      const result = [];
      for (let m = 5; m >= 0; m--) {
        const targetMonth = new Date();
        targetMonth.setMonth(now.getMonth() - m);
        
        const year = targetMonth.getFullYear();
        const monthNum = targetMonth.getMonth() + 1;
        const monthPrefix = `${year}-${String(monthNum).padStart(2, '0')}`;

        // Find meals matching calendar month prefix index
        const monthMeals = diaryItems.filter(item => item.date.startsWith(monthPrefix));

        const totalKcal = monthMeals.reduce((sum, item) => sum + item.kcal, 0);
        const totalP = monthMeals.reduce((sum, item) => sum + item.proteins, 0);
        const totalF = monthMeals.reduce((sum, item) => sum + item.fats, 0);
        const totalC = monthMeals.reduce((sum, item) => sum + item.carbohydrates, 0);

        // Approximate active calendar days of the month completed, defaults to 30 days divisor for standard scaling
        const divisor = 30;

        const monthNamesUa = ['Січ', 'Лют', 'Бер', 'Квіт', 'Трав', 'Черв', 'Лип', 'Серп', 'Верес', 'Жовт', 'Лист', 'Груд'];
        const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mLabel = lang === 'ua' ? monthNamesUa[targetMonth.getMonth()] : monthNamesEn[targetMonth.getMonth()];

        result.push({
          key: monthPrefix,
          label: `${mLabel} ${year}`,
          kcal: Math.round(totalKcal / divisor),
          proteins: Math.round(totalP / divisor),
          fats: Math.round(totalF / divisor),
          carbohydrates: Math.round(totalC / divisor),
          itemCount: monthMeals.length
        });
      }
      return result;
    }
  }, [period, diaryItems, lang]);

  // Aggregate stats across active timeline
  const summaryMetrics = useMemo(() => {
    const now = new Date();
    let periodMeals: FoodItem[] = [];

    if (period === 'daily') {
      const d6 = new Date();
      d6.setDate(now.getDate() - 6);
      const startStr = getLocalDateString(d6);
      const endStr = getLocalDateString(now);
      periodMeals = diaryItems.filter(item => item.date >= startStr && item.date <= endStr);
    } else if (period === 'weekly') {
      const d27 = new Date();
      d27.setDate(now.getDate() - 27);
      const startStr = getLocalDateString(d27);
      const endStr = getLocalDateString(now);
      periodMeals = diaryItems.filter(item => item.date >= startStr && item.date <= endStr);
    } else {
      // monthly
      const monthPrefixes: string[] = [];
      for (let m = 5; m >= 0; m--) {
        const targetMonth = new Date();
        targetMonth.setMonth(now.getMonth() - m);
        const year = targetMonth.getFullYear();
        const monthNum = targetMonth.getMonth() + 1;
        const monthPrefix = `${year}-${String(monthNum).padStart(2, '0')}`;
        monthPrefixes.push(monthPrefix);
      }
      periodMeals = diaryItems.filter(item => monthPrefixes.some(pref => item.date.startsWith(pref)));
    }

    // Days where there was consumption (any food logged on that date is counted)
    const uniqueConsumptionDates = new Set(periodMeals.map(m => m.date));
    const activeDaysCount = uniqueConsumptionDates.size;

    if (activeDaysCount === 0) {
      return { meanKcal: 0, meanP: 0, meanF: 0, meanC: 0, complianceRate: 0 };
    }

    const totalKcal = periodMeals.reduce((sum, d) => sum + d.kcal, 0);
    const totalP = periodMeals.reduce((sum, d) => sum + d.proteins, 0);
    const totalF = periodMeals.reduce((sum, d) => sum + d.fats, 0);
    const totalC = periodMeals.reduce((sum, d) => sum + d.carbohydrates, 0);

    return {
      meanKcal: Math.round(totalKcal / activeDaysCount),
      meanP: Math.round(totalP / activeDaysCount),
      meanF: Math.round(totalF / activeDaysCount),
      meanC: Math.round(totalC / activeDaysCount),
      complianceRate: 0
    };
  }, [period, diaryItems, targetValue, metric]);

  // Macro division calculations in percentages for chart
  const macroBreakdown = useMemo(() => {
    const totalMacros = summaryMetrics.meanP + summaryMetrics.meanF + summaryMetrics.meanC;
    if (totalMacros === 0) return { pPct: 30, fPct: 30, cPct: 40 };
    return {
      pPct: Math.round((summaryMetrics.meanP / totalMacros) * 100),
      fPct: Math.round((summaryMetrics.meanF / totalMacros) * 100),
      cPct: Math.round((summaryMetrics.meanC / totalMacros) * 100)
    };
  }, [summaryMetrics]);

  // Target ratios based on current macro guidelines
  const targetMacroPercentages = useMemo(() => {
    const totalTarget = profile.targetProtein + profile.targetFat + profile.targetCarbs;
    if (totalTarget === 0) return { pPct: 30, fPct: 30, cPct: 40 };
    return {
      pPct: Math.round((profile.targetProtein / totalTarget) * 100),
      fPct: Math.round((profile.targetFat / totalTarget) * 100),
      cPct: Math.round((profile.targetCarbs / totalTarget) * 100)
    };
  }, [profile]);

  // SVG dimensions & charting scalars
  const chartHeight = 160;
  const chartWidth = 460;
  const paddingLeft = 32;
  const paddingRight = 10;
  const paddingTop = 25;
  const paddingBottom = 25;

  const chartMaxVal = useMemo(() => {
    // Determine the maximum value in dataset to scale properly
    let vals = aggregatedData.map(d => {
      if (metric === 'kcal') return d.kcal;
      if (metric === 'proteins') return d.proteins;
      if (metric === 'fats') return d.fats;
      return d.carbohydrates;
    });
    const maxDataVal = Math.max(...vals, 10);
    // Ensure the target horizontal line fits inside the visual matrix
    return Math.max(maxDataVal, targetValue) * 1.25;
  }, [aggregatedData, metric, targetValue]);

  // Calculate coordinates for SVG items (area coordinates and bars)
  const columnsCount = aggregatedData.length;
  const colGapWidth = (chartWidth - paddingLeft - paddingRight) / columnsCount;

  const points = useMemo(() => {
    return aggregatedData.map((d, index) => {
      let val = d.kcal;
      if (metric === 'proteins') val = d.proteins;
      else if (metric === 'fats') val = d.fats;
      else if (metric === 'carbohydrates') val = d.carbohydrates;

      const x = paddingLeft + (index * colGapWidth) + (colGapWidth / 2);
      // Coordinate inversion (y: 0 is at top, so subtotal from maximum height)
      const graphAvailableHeight = chartHeight - paddingTop - paddingBottom;
      const pctValue = val / chartMaxVal;
      const y = paddingTop + graphAvailableHeight * (1 - pctValue);
      return { x, y, value: val, label: d.label, itemCount: d.itemCount };
    });
  }, [aggregatedData, metric, chartMaxVal, colGapWidth]);

  // Determine current active display value for chosen metric
  const getDisplayValueFormatted = (val: number) => {
    if (metric === 'kcal') {
      return `${val} ${t.kcalUnit}`;
    }
    return `${val}${t.gUnit}`;
  };

  const activeAverageValue = useMemo(() => {
    if (metric === 'kcal') return summaryMetrics.meanKcal;
    if (metric === 'proteins') return summaryMetrics.meanP;
    if (metric === 'fats') return summaryMetrics.meanF;
    return summaryMetrics.meanC;
  }, [metric, summaryMetrics]);

  return (
    <div 
      id="consumption-history-analytics"
      className={`rounded-2xl border p-5 sm:p-7 shadow-sm w-full transition-colors duration-300 ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-[#E2E8E4]'
      }`}
    >
      {/* Sleek Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/40">
        <div>
          <h3 className={`text-sm font-extrabold uppercase tracking-widest flex items-center gap-2 ${
            isDark ? 'text-zinc-300' : 'text-[#4A5D4E]'
          }`}>
            <TrendingUp className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27]'}`} />
            {lang === 'ua' ? 'Показники та тенденції' : 'Metrics & Trends'}
          </h3>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-450'}`}>
            {lang === 'ua' ? 'Оберіть показник нижче для детального аналізу' : 'Select a metric below for detailed analysis'}
          </p>
        </div>

        {/* Period Switcher Tabs */}
        <div className={`flex p-1 rounded-xl border self-start sm:self-auto ${
          isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-[#F8FAF9] border-[#E2E8E4]'
        }`}>
          {[
            { key: 'daily' as PeriodType, label: t.dailyLabel },
            { key: 'weekly' as PeriodType, label: t.weeklyLabel },
            { key: 'monthly' as PeriodType, label: t.monthlyLabel }
          ].map((pItem) => {
            const isActive = period === pItem.key;
            return (
              <button
                key={pItem.key}
                onClick={() => { setPeriod(pItem.key); setHoveredIndex(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? isDark ? 'bg-[#89FFA0]/20 text-[#89FFA0]' : 'bg-[#DCEEE0] text-[#2D5A27]'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-[#89FFA0] dark:text-zinc-400'
                }`}
              >
                {pItem.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Metric Dashboard cards (Interactive metrics toggle) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { 
            key: 'kcal' as MetricType, 
            title: t.metricCalories, 
            icon: Flame, 
            avgVal: `${summaryMetrics.meanKcal} ${t.kcalUnit}`,
            targetVal: `${profile.targetKcal || 2009} ${t.kcalUnit}`,
            activeStyles: isDark 
              ? 'border-orange-500 bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20' 
              : 'border-orange-400 bg-orange-500/[0.03] text-orange-700 ring-1 ring-orange-200/50',
            iconStyles: 'bg-orange-500/10 text-orange-505',
          },
          { 
            key: 'proteins' as MetricType, 
            title: t.metricProteins, 
            icon: Apple, 
            avgVal: `${summaryMetrics.meanP}${t.gUnit}`,
            targetVal: `${profile.targetProtein || 120}${t.gUnit}`,
            activeStyles: isDark 
              ? 'border-rose-500 bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20' 
              : 'border-rose-400 bg-rose-500/[0.03] text-rose-700 ring-1 ring-rose-200/50',
            iconStyles: 'bg-rose-500/10 text-rose-505',
          },
          { 
            key: 'fats' as MetricType, 
            title: t.metricFats, 
            icon: Droplet, 
            avgVal: `${summaryMetrics.meanF}${t.gUnit}`,
            targetVal: `${profile.targetFat || 70}${t.gUnit}`,
            activeStyles: isDark 
              ? 'border-amber-500 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20' 
              : 'border-amber-400 bg-amber-500/[0.03] text-amber-700 ring-1 ring-amber-200/50',
            iconStyles: 'bg-amber-500/10 text-amber-505',
          },
          { 
            key: 'carbohydrates' as MetricType, 
            title: t.metricCarbs, 
            icon: Activity, 
            avgVal: `${summaryMetrics.meanC}${t.gUnit}`,
            targetVal: `${profile.targetCarbs || 270}${t.gUnit}`,
            activeStyles: isDark 
              ? 'border-[#89FFA0] bg-[#89FFA0]/10 text-[#89FFA0] ring-1 ring-[#89FFA0]/20' 
              : 'border-emerald-500 bg-emerald-500/[0.03] text-emerald-800 ring-1 ring-emerald-200/50',
            iconStyles: 'bg-emerald-500/10 text-emerald-600 dark:text-[#89FFA0]',
          }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = metric === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { setMetric(item.key); setHoveredIndex(null); }}
              className={`group flex flex-col justify-between p-4 border rounded-2xl text-left transition-all duration-300 relative cursor-pointer active:scale-95 outline-none ${
                isActive 
                  ? item.activeStyles 
                  : isDark 
                    ? 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-950/60' 
                    : 'bg-[#F8FAF9] border-[#E2E8E4]/80 text-[#4A5D4E] hover:bg-[#F0F4F1] hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{item.title}</span>
                <span className={`p-1.5 rounded-lg ${item.iconStyles} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <span className={`text-xl font-extrabold block font-sans transition-colors duration-200 ${
                  isActive ? '' : isDark ? 'text-zinc-200' : 'text-[#1A1C1B]'
                }`}>
                  {item.avgVal}
                </span>
                <span className="text-[9px] block opacity-60 font-semibold mt-1">
                  {lang === 'ua' ? 'Середня ціль:' : 'Def. Goal:'} {item.targetVal}
                </span>
              </div>
              {isActive && (
                <span className="absolute bottom-2.5 right-2.5 flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    item.key === 'kcal' ? 'bg-orange-400' : 
                    item.key === 'proteins' ? 'bg-[#ff5c5c]' : 
                    item.key === 'fats' ? 'bg-amber-450' : 'bg-emerald-450'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    item.key === 'kcal' ? 'bg-orange-500' : 
                    item.key === 'proteins' ? 'bg-rose-500' : 
                    item.key === 'fats' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Primary SVG Chart Matrix */}
      <div className={`relative border rounded-2xl p-4 sm:p-5 overflow-hidden transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-850/80' : 'bg-white border-[#E2E8E4]'
      }`}>
        
        {/* SVG Wrapper with Responsive Viewbox Aspect Ratio Scaling */}
        <div className="relative w-full overflow-x-auto">
          <svg 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            className="w-full h-auto select-none min-w-[360px]"
          >
            <defs>
              <linearGradient id="kcal-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="proteins-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="fats-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="carbs-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Grid Line Accents */}
            {[0, 0.25, 0.5, 0.75, 1].map((pRatio, idx) => {
              const graphAvailableHeight = chartHeight - paddingTop - paddingBottom;
              const y = paddingTop + graphAvailableHeight * pRatio;
              const lineVal = Math.round(chartMaxVal * (1 - pRatio));
              return (
                <g key={idx}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={chartWidth - paddingRight} 
                    y2={y} 
                    stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} 
                    strokeWidth="1"
                  />
                  <text 
                    x={paddingLeft - 6} 
                    y={y + 3} 
                    textAnchor="end" 
                    className="fill-zinc-400 dark:fill-zinc-600 text-[8px] font-semibold font-mono"
                  >
                    {metric === 'kcal' ? lineVal : `${lineVal}g`}
                  </text>
                </g>
              );
            })}

            {/* horizontal target budget goal trace */}
            {(() => {
              const graphAvailableHeight = chartHeight - paddingTop - paddingBottom;
              const y = paddingTop + graphAvailableHeight * (1 - (targetValue / chartMaxVal));
              return (
                <g>
                   <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={chartWidth - paddingRight} 
                    y2={y} 
                    stroke={isDark ? '#e11d48' : '#dc2626'} 
                    strokeWidth="1.25" 
                    strokeDasharray="4,4"
                  />
                  <text 
                    x={chartWidth - paddingRight - 4} 
                    y={y - 4} 
                    textAnchor="end" 
                    className="fill-rose-500 font-bold text-[8px] uppercase tracking-wider"
                  >
                    {t.targetLabel} ({targetValue}{metric === 'kcal' ? '' : 'g'})
                  </text>
                </g>
              );
            })()}

            {/* area polygon overlay behind the graph */}
            {points.length > 0 && (
              <path 
                d={`
                  M ${points[0].x} ${chartHeight - paddingBottom} 
                  ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} 
                  L ${points[points.length - 1].x} ${chartHeight - paddingBottom} 
                  Z
                `}
                fill={
                  metric === 'kcal' ? 'url(#kcal-gradient)' :
                  metric === 'proteins' ? 'url(#proteins-gradient)' :
                  metric === 'fats' ? 'url(#fats-gradient)' :
                  'url(#carbs-gradient)'
                }
              />
            )}

            {/* area line graph path */}
            {points.length > 0 && (
              <path 
                d={points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                fill="none"
                stroke={
                  metric === 'kcal' ? '#f97316' : 
                  metric === 'proteins' ? '#ef4444' : 
                  metric === 'fats' ? '#f59e0b' : 
                  (isDark ? '#89FFA0' : '#10b981')
                }
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* graph bar columns & selection circles */}
            {points.map((p, idx) => {
              const rectWidth = Math.max(12, colGapWidth * 0.4);
              const barHeight = (chartHeight - paddingBottom) - p.y;
              const isHovered = hoveredIndex === idx;

              return (
                <g key={idx}>
                  {/* transparent overlay column triggers for better cursor hover accuracy */}
                  <rect 
                    x={p.x - colGapWidth / 2} 
                    y={paddingTop} 
                    width={colGapWidth} 
                    height={chartHeight - paddingTop - paddingBottom} 
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {/* interactive indicator bar column */}
                  {barHeight > 0 && (
                    <rect 
                      x={p.x - rectWidth / 2}
                      y={p.y} 
                      width={rectWidth} 
                      height={barHeight} 
                      rx={3}
                      fill={
                        metric === 'kcal' ? (isHovered ? '#ff8533' : '#f97316') :
                        metric === 'proteins' ? (isHovered ? '#ff5c5c' : '#ef4444') :
                        metric === 'fats' ? (isHovered ? '#ffb024' : '#f59e0b') :
                        (isHovered ? (isDark ? '#bcffc8' : '#12d192') : (isDark ? '#89FFA0' : '#10b981'))
                      }
                      opacity={isHovered ? 0.35 : 0.15}
                      className="transition-all duration-150 pointer-events-none"
                    />
                  )}

                  {/* highlighted anchor circle */}
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={isHovered ? 6 : 4} 
                    fill={isDark ? '#18181b' : '#ffffff'} 
                    stroke={
                      metric === 'kcal' ? '#f97316' : 
                      metric === 'proteins' ? '#ef4444' : 
                      metric === 'fats' ? '#f59e0b' : 
                      (isDark ? '#89FFA0' : '#10b981')
                    }
                    strokeWidth={isHovered ? 3.5 : 2.5}
                    className="transition-all duration-150 pointer-events-none"
                  />

                  {/* x-axis text markings */}
                  <text 
                    x={p.x} 
                    y={chartHeight - 6} 
                    textAnchor="middle" 
                    className="fill-zinc-500 font-bold text-[7px] truncate pointer-events-none font-sans"
                  >
                    {aggregatedData[idx].label.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Floating Custom Tooltip Portal */}
        <div className="absolute top-2.5 right-2.5 transition-all duration-300 pointer-events-none min-h-[50px]">
          {hoveredIndex !== null ? (
            <div className={`p-3 rounded-xl border text-xs leading-normal animate-fadeIn shadow-lg backdrop-blur-md ${
              isDark ? 'bg-zinc-950/90 border-zinc-800 text-white' : 'bg-white/95 border-[#E2E8E4] text-[#1A1C1B]'
            }`}>
              <p className="font-extrabold text-xs mb-1 uppercase tracking-wider text-zinc-500">
                {aggregatedData[hoveredIndex].label}
              </p>
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">{t.metricCalories}</span>
                  <span className="font-bold text-sm block font-sans">{getDisplayValueFormatted(points[hoveredIndex].value)}</span>
                </div>
                <div className="h-4 w-[1px] bg-zinc-850"></div>
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">{lang === 'ua' ? 'Страв' : 'Meals'}</span>
                  <span className="font-medium text-xs text-zinc-650 block">
                    {aggregatedData[hoveredIndex].itemCount}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-2.5 rounded-xl border text-[10px] flex items-center gap-1.5 opacity-60 ${
              isDark ? 'bg-zinc-900/40 border-zinc-900 text-zinc-400' : 'bg-[#F8FAF9] border-[#E2E8E4] text-[#4A5D4E]'
            }`}>
              <Info className="w-3.5 h-3.5" />
              <span>{lang === 'ua' ? 'Наведіть на графік' : 'Hover over bar points'}</span>
            </div>
          )}
        </div>

      </div>

      {/* Metrics Summary & Macronutrient Balanced Card */}
      <div className={`grid grid-cols-1 md:grid-cols-12 gap-5 mt-6 p-5 sm:p-6 rounded-2xl border transition-colors ${
        isDark ? 'bg-zinc-950/50 border-zinc-850/80' : 'bg-[#F3F7F4]/40 border-[#E2E8E4]/85'
      }`}>
        
        {/* Metric Summary Box - Left Side */}
        <div className="md:col-span-6 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center justify-between">
            <span>{t.periodSummaryTitle}</span>
            <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-500 font-medium font-sans">{t.averageLabel} ({t.metricCalories})</span>
              <span className="font-extrabold text-sm text-orange-500">{summaryMetrics.meanKcal} {t.kcalUnit}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-dashed border-zinc-150 dark:border-zinc-800/40">
              <span className="text-zinc-500 font-medium font-sans">{t.metricProteins}</span>
              <span className="font-extrabold">{summaryMetrics.meanP}{t.gUnit}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-dashed border-zinc-150 dark:border-zinc-800/40">
              <span className="text-zinc-500 font-medium font-sans">{t.metricFats}</span>
              <span className="font-extrabold">{summaryMetrics.meanF}{t.gUnit}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-dashed border-zinc-150 dark:border-zinc-800/40">
              <span className="text-zinc-500 font-medium font-sans">{t.metricCarbs}</span>
              <span className="font-extrabold">{summaryMetrics.meanC}{t.gUnit}</span>
            </div>
          </div>
        </div>

        {/* Actual macro ratio balance bar indicators - Right Side */}
        <div className="md:col-span-6 flex flex-col justify-between pt-4 md:pt-0 md:pl-5 border-t md:border-t-0 md:border-l border-dashed border-zinc-200 dark:border-zinc-800">
          <div>
            <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">
              {t.compositionTitle} ({t.actualRatio} vs {t.targetRatio})
            </h5>
            
            {/* Visual macro-bar distribution stacked diagram */}
            <div className="h-4.5 flex rounded-lg overflow-hidden mb-3 text-[9px] font-bold text-white leading-tight">
              <div style={{ width: `${macroBreakdown.pPct}%` }} className="bg-red-500 flex items-center justify-center overflow-hidden whitespace-nowrap min-w-4" title={`Protein: ${macroBreakdown.pPct}%`}>
                P: {macroBreakdown.pPct}%
              </div>
              <div style={{ width: `${macroBreakdown.fPct}%` }} className="bg-amber-500 flex items-center justify-center overflow-hidden whitespace-nowrap min-w-4" title={`Fat: ${macroBreakdown.fPct}%`}>
                F: {macroBreakdown.fPct}%
              </div>
              <div style={{ width: `${macroBreakdown.cPct}%` }} className="bg-emerald-500 flex items-center justify-center overflow-hidden whitespace-nowrap min-w-4" title={`Carb: ${macroBreakdown.cPct}%`}>
                C: {macroBreakdown.cPct}%
              </div>
            </div>
          </div>

          <div className="text-[9px] text-[#4A5D4E] dark:text-zinc-500 space-y-1">
            <div className="flex justify-between">
              <span className="font-medium">{t.targetRatio}:</span>
              <span className="font-mono font-bold">P: {targetMacroPercentages.pPct}% / F: {targetMacroPercentages.fPct}% / C: {targetMacroPercentages.cPct}%</span>
            </div>
            <p className="text-[8px] opacity-70 leading-normal text-right">
              {lang === 'ua' ? 'Калорійність базується на середніх показниках за вибраний період.' : 'Ratios based on average macro distribution.'}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
