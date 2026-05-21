/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Scale, Activity, Flame, Check } from 'lucide-react';
import { translations } from '../locales';

interface TdeeCalculatorProps {
  currentProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onCancel?: () => void;
  lang: 'ua' | 'en';
  theme: 'light' | 'dark';
}

export default function TdeeCalculator({ currentProfile, onSaveProfile, onCancel, lang, theme }: TdeeCalculatorProps) {
  const [weight, setWeight] = useState<number>(currentProfile.weightCc || 70);
  const [height, setHeight] = useState<number>(currentProfile.heightCc || 170);
  const [age, setAge] = useState<number>(currentProfile.ageCc || 25);
  const [gender, setGender] = useState<'male' | 'female'>(currentProfile.genderCc || 'female');
  const [activity, setActivity] = useState<UserProfile['activityLevelCc']>(currentProfile.activityLevelCc || 'moderate');
  const [goal, setGoal] = useState<UserProfile['goalCc']>(currentProfile.goalCc || 'maintain');

  const isDark = theme === 'dark';
  const t = translations[lang];

  const [result, setResult] = useState<{
    bmr: number;
    tdee: number;
    targetKcal: number;
    targetProtein: number;
    targetFat: number;
    targetCarbs: number;
  } | null>(null);

  const calculateDefaultTargets = () => {
    // Mifflin-St Jeor Equation
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity Multipliers
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = Math.round(bmr * multipliers[activity]);
    
    // Goal Adjustment
    let targetKcal = tdee;
    if (goal === 'lose') {
      targetKcal = Math.round(tdee * 0.85); // 15% deficit
    } else if (goal === 'gain') {
      targetKcal = Math.round(tdee * 1.10); // 10% surplus
    }

    // Protein calculation
    let proteinGrams = 0;
    if (goal === 'lose') {
      proteinGrams = Math.round(weight * 2.0);
    } else if (goal === 'gain') {
      proteinGrams = Math.round(weight * 1.8);
    } else {
      proteinGrams = Math.round(weight * 1.6);
    }
    proteinGrams = Math.max(50, Math.min(220, proteinGrams));

    // Fats (approx 25%)
    let fatGrams = Math.round((targetKcal * 0.25) / 9);
    fatGrams = Math.max(30, Math.min(120, fatGrams));

    // Carbs
    const proteinKcal = proteinGrams * 4;
    const fatKcal = fatGrams * 9;
    const remainingKcal = targetKcal - (proteinKcal + fatKcal);
    let carbGrams = Math.round(remainingKcal / 4);
    carbGrams = Math.max(50, carbGrams);

    const calculated = {
      bmr: Math.round(bmr),
      tdee,
      targetKcal,
      targetProtein: proteinGrams,
      targetFat: fatGrams,
      targetCarbs: carbGrams,
    };

    setResult(calculated);
    return calculated;
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    calculateDefaultTargets();
  };

  const handleSave = () => {
    const activeResult = result || calculateDefaultTargets();
    onSaveProfile({
      isCalculated: true,
      weightCc: weight,
      heightCc: height,
      ageCc: age,
      genderCc: gender,
      activityLevelCc: activity,
      goalCc: goal,
      targetKcal: activeResult.targetKcal,
      targetProtein: activeResult.targetProtein,
      targetFat: activeResult.targetFat,
      targetCarbs: activeResult.targetCarbs,
    });
  };

  return (
    <div 
      id="tdee-calculator" 
      className={`rounded-[32px] border p-6 max-w-2xl mx-auto transition-all duration-300 ${
        isDark ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100' : 'bg-white border-[#E2E8E4] text-[#1A1C1B]'
      }`}
    >
      <div className="flex items-center gap-3.5 mb-6">
        <div className={`p-3 rounded-2xl ${isDark ? 'bg-zinc-950 text-[#89FFA0]' : 'bg-[#F3F7F4] text-[#2D5A27]'}`}>
          <Scale id="calculator-icon" className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t.tdeeTitle}</h2>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.tdeeSubtitle}</p>
        </div>
      </div>

      <form onSubmit={handleCalculate} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gender selection */}
          <div className="space-y-1.5">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.gender}</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="gender-female-btn"
                onClick={() => setGender('female')}
                className={`h-11 px-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center justify-center ${
                  gender === 'female'
                    ? isDark ? 'border-[#89FFA0] bg-[#89FFA0]/10 text-[#89FFA0]' : 'border-[#2D5A27] bg-[#DCEEE0] text-[#2D5A27]'
                    : isDark ? 'border-zinc-850 text-zinc-400 bg-zinc-950/40 hover:border-zinc-700' : 'border-[#E2E8E4] hover:border-[#C7D1C9] text-gray-500 bg-white'
                }`}
              >
                {t.female}
              </button>
              <button
                type="button"
                id="gender-male-btn"
                onClick={() => setGender('male')}
                className={`h-11 px-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center justify-center ${
                  gender === 'male'
                    ? isDark ? 'border-[#89FFA0] bg-[#89FFA0]/10 text-[#89FFA0]' : 'border-[#2D5A27] bg-[#DCEEE0] text-[#2D5A27]'
                    : isDark ? 'border-zinc-850 text-zinc-400 bg-zinc-950/40 hover:border-zinc-700' : 'border-[#E2E8E4] hover:border-[#C7D1C9] text-gray-500 bg-white'
                }`}
              >
                {t.male}
              </button>
            </div>
          </div>

          {/* Age input */}
          <div className="space-y-1.5">
            <label htmlFor="age-input" className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.ageYears}</label>
            <input
              type="number"
              id="age-input"
              min="10"
              max="100"
              required
              value={age}
              onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 0))}
              className={`w-full h-11 px-3.5 rounded-xl border outline-none text-sm font-medium transition-all ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-800 text-white focus:border-[#89FFA0] focus:ring-1 focus:ring-[#89FFA0]/30' 
                  : 'bg-[#F8FAF9] border-[#E2E8E4] text-[#1A1C1B] focus:border-[#2D5A27] focus:ring-1 focus:ring-[#DCEEE0]'
              }`}
            />
          </div>

          {/* Height input */}
          <div className="space-y-1.5">
            <label htmlFor="height-input" className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.heightCm}</label>
            <input
              type="number"
              id="height-input"
              min="100"
              max="250"
              required
              value={height}
              onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value) || 0))}
              className={`w-full h-11 px-3.5 rounded-xl border outline-none text-sm font-medium transition-all ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-800 text-white focus:border-[#89FFA0] focus:ring-1 focus:ring-[#89FFA0]/30' 
                  : 'bg-[#F8FAF9] border-[#E2E8E4] text-[#1A1C1B] focus:border-[#2D5A27] focus:ring-1 focus:ring-[#DCEEE0]'
              }`}
            />
          </div>

          {/* Weight input */}
          <div className="space-y-1.5">
            <label htmlFor="weight-input" className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.weightCc}</label>
            <input
              type="number"
              id="weight-input"
              min="30"
              max="250"
              required
              value={weight}
              onChange={(e) => setWeight(Math.max(1, parseInt(e.target.value) || 0))}
              className={`w-full h-11 px-3.5 rounded-xl border outline-none text-sm font-medium transition-all ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-800 text-white focus:border-[#89FFA0] focus:ring-1 focus:ring-[#89FFA0]/30' 
                  : 'bg-[#F8FAF9] border-[#E2E8E4] text-[#1A1C1B] focus:border-[#2D5A27] focus:ring-1 focus:ring-[#DCEEE0]'
              }`}
            />
          </div>

          {/* Activity Selection */}
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="activity-select" className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.activityLevel}</label>
            <select
              id="activity-select"
              value={activity}
              onChange={(e) => setActivity(e.target.value as UserProfile['activityLevelCc'])}
              className={`w-full h-11 px-3.5 rounded-xl border outline-none text-sm font-medium transition-all ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-800 text-white focus:border-[#89FFA0] focus:ring-1 focus:ring-[#89FFA0]/30' 
                  : 'bg-[#F8FAF9] border-[#E2E8E4] text-[#1A1C1B] focus:border-[#2D5A27] focus:ring-1 focus:ring-[#DCEEE0]'
              }`}
            >
              <option value="sedentary" className={isDark ? "bg-zinc-950 text-white" : ""}>{t.sedentary}</option>
              <option value="light" className={isDark ? "bg-zinc-950 text-white" : ""}>{t.light}</option>
              <option value="moderate" className={isDark ? "bg-zinc-950 text-white" : ""}>{t.moderate}</option>
              <option value="active" className={isDark ? "bg-zinc-950 text-white" : ""}>{t.active}</option>
              <option value="very_active" className={isDark ? "bg-zinc-950 text-white" : ""}>{t.very_active}</option>
            </select>
          </div>

          {/* Diet Goal selection */}
          <div className="space-y-1.5 sm:col-span-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.primaryGoal}</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                id="goal-lose-btn"
                onClick={() => setGoal('lose')}
                className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                  goal === 'lose'
                    ? isDark ? 'border-[#89FFA0] bg-[#89FFA0]/10 text-[#89FFA0]' : 'border-[#2D5A27] bg-[#DCEEE0] text-[#2D5A27]'
                    : isDark ? 'border-zinc-850 text-zinc-400 bg-zinc-950/40 hover:border-zinc-700' : 'border-[#E2E8E4] hover:border-[#C7D1C9] text-gray-500 bg-white'
                }`}
              >
                <span className="text-sm font-bold">{lang === 'ua' ? 'Схуднути' : 'Lose Weight'}</span>
                <span className="text-[10px] opacity-80 mt-0.5">{t.loseDesc}</span>
              </button>
              <button
                type="button"
                id="goal-maintain-btn"
                onClick={() => setGoal('maintain')}
                className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                  goal === 'maintain'
                    ? isDark ? 'border-[#89FFA0] bg-[#89FFA0]/10 text-[#89FFA0]' : 'border-[#2D5A27] bg-[#DCEEE0] text-[#2D5A27]'
                    : isDark ? 'border-zinc-850 text-zinc-400 bg-zinc-950/40 hover:border-zinc-700' : 'border-[#E2E8E4] hover:border-[#C7D1C9] text-gray-500 bg-white'
                }`}
              >
                <span className="text-sm font-bold">{lang === 'ua' ? 'Утримувати вагу' : 'Maintain Weight'}</span>
                <span className="text-[10px] opacity-80 mt-0.5">{t.maintainDesc}</span>
              </button>
              <button
                type="button"
                id="goal-gain-btn"
                onClick={() => setGoal('gain')}
                className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                  goal === 'gain'
                    ? isDark ? 'border-[#89FFA0] bg-[#89FFA0]/10 text-[#89FFA0]' : 'border-[#2D5A27] bg-[#DCEEE0] text-[#2D5A27]'
                    : isDark ? 'border-zinc-850 text-zinc-400 bg-zinc-950/40 hover:border-zinc-700' : 'border-[#E2E8E4] hover:border-[#C7D1C9] text-gray-500 bg-white'
                }`}
              >
                <span className="text-sm font-bold">{lang === 'ua' ? 'Набрати масу' : 'Gain Weight'}</span>
                <span className="text-[10px] opacity-80 mt-0.5">{t.gainDesc}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            type="submit"
            id="calc-submit-btn"
            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm ${
              isDark ? 'bg-[#89FFA0] text-zinc-950 hover:bg-[#6be483]' : 'bg-[#2D5A27] text-white hover:bg-[#23471F]'
            }`}
          >
            <Activity className="w-4 h-4" />
            {t.calculate}
          </button>
          
          {onCancel && (
            <button
              type="button"
              id="calc-cancel-btn"
              onClick={onCancel}
              className={`py-2.5 px-4 rounded-xl font-semibold border transition-all cursor-pointer text-sm ${
                isDark 
                  ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-850' 
                  : 'border-[#E2E8E4] text-[#4A5D4E] hover:bg-[#F3F7F4]'
              }`}
            >
              {t.cancel}
            </button>
          )}
        </div>
      </form>

      {/* Results details */}
      {(result || currentProfile.isCalculated) && (
        <div id="calculator-results" className={`mt-6 pt-6 border-t animate-fadeIn ${isDark ? 'border-zinc-800' : 'border-[#E2E8E4]'}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-3.5 flex items-center gap-2 ${isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27]'}`}>
            <Flame className="w-4 h-4 fill-current" />
            {t.targetOverview}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className={`p-3 rounded-2xl border text-center ${isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-[#F3F7F4] border-[#E2E8E4]'}`}>
              <span className={`block text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDark ? 'text-zinc-500' : 'text-[#4A5D4E]'}`}>{lang === 'ua' ? 'Калорії' : 'Calories'}</span>
              <span className={`text-xl font-bold ${isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27]'}`}>{(result || currentProfile).targetKcal} <span className="text-[10px] font-normal text-zinc-500">{lang === 'ua' ? 'ккал' : 'kcal'}</span></span>
            </div>
            <div className={`p-3 rounded-2xl border text-center ${isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-[#F3F7F4] border-[#E2E8E4]'}`}>
              <span className={`block text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDark ? 'text-zinc-500' : 'text-[#4A5D4E]'}`}>{t.proteins}</span>
              <span className="text-xl font-bold">{(result || currentProfile).targetProtein} <span className="text-[10px] font-normal text-zinc-500">г</span></span>
            </div>
            <div className={`p-3 rounded-2xl border text-center ${isDark ? 'bg-zinc-950 border-zinc-855' : 'bg-[#F3F7F4] border-[#E2E8E4]'}`}>
              <span className={`block text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDark ? 'text-zinc-500' : 'text-[#4A5D4E]'}`}>{t.fats}</span>
              <span className="text-xl font-bold">{(result || currentProfile).targetFat} <span className="text-[10px] font-normal text-zinc-500">г</span></span>
            </div>
            <div className={`p-3 rounded-2xl border text-center ${isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-[#F3F7F4] border-[#E2E8E4]'}`}>
              <span className={`block text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDark ? 'text-zinc-500' : 'text-[#4A5D4E]'}`}>{t.carbs}</span>
              <span className="text-xl font-bold">{(result || currentProfile).targetCarbs} <span className="text-[10px] font-normal text-zinc-500">г</span></span>
            </div>
          </div>

          <button
            type="button"
            id="save-profile-btn"
            onClick={handleSave}
            className={`w-full py-2.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs text-sm ${
              isDark ? 'bg-white text-zinc-950 hover:bg-zinc-100' : 'bg-[#1A1C1B] text-white hover:bg-black'
            }`}
          >
            <Check className="w-4 h-4" />
            {t.saveTarget}
          </button>
        </div>
      )}
    </div>
  );
}
