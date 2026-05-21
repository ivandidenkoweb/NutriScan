/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FoodItem } from '../types';
import { Trash2, ChevronDown, ChevronUp, Scale, Pencil } from 'lucide-react';
import { translations } from '../locales';

interface FoodDiaryListProps {
  items: FoodItem[];
  onDeleteItem: (id: string) => void;
  onUpdateItem: (id: string, updatedItem: FoodItem) => void;
  selectedDate: string;
  lang: 'ua' | 'en';
  theme: 'light' | 'dark';
}

export default function FoodDiaryList({ 
  items, 
  onDeleteItem, 
  onUpdateItem, 
  selectedDate, 
  lang, 
  theme 
}: FoodDiaryListProps) {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Edit form states
  const [editName, setEditName] = useState('');
  const [editWeight, setEditWeight] = useState(0);
  const [editVolume, setEditVolume] = useState(0);
  const [editProteins, setEditProteins] = useState(0);
  const [editFats, setEditFats] = useState(0);
  const [editCarbohydrates, setEditCarbohydrates] = useState(0);
  const [editKcal, setEditKcal] = useState(0);
  const [editExplanation, setEditExplanation] = useState('');

  // Baseline item snapshot for scaling recalculations
  const [baseItem, setBaseItem] = useState<{
    weightGrams: number;
    volumeMl: number;
    proteins: number;
    fats: number;
    carbohydrates: number;
    kcal: number;
  } | null>(null);

  const handleEditWeightChange = (newWeight: number) => {
    setEditWeight(newWeight);
    if (baseItem && baseItem.weightGrams > 0) {
      const ratio = newWeight / baseItem.weightGrams;
      setEditProteins(parseFloat((baseItem.proteins * ratio).toFixed(1)));
      setEditFats(parseFloat((baseItem.fats * ratio).toFixed(1)));
      setEditCarbohydrates(parseFloat((baseItem.carbohydrates * ratio).toFixed(1)));
      setEditKcal(Math.round(baseItem.kcal * ratio));
    }
  };

  const handleEditVolumeChange = (newVolume: number) => {
    setEditVolume(newVolume);
    if (baseItem && baseItem.volumeMl > 0) {
      const ratio = newVolume / baseItem.volumeMl;
      setEditProteins(parseFloat((baseItem.proteins * ratio).toFixed(1)));
      setEditFats(parseFloat((baseItem.fats * ratio).toFixed(1)));
      setEditCarbohydrates(parseFloat((baseItem.carbohydrates * ratio).toFixed(1)));
      setEditKcal(Math.round(baseItem.kcal * ratio));
    }
  };

  const handleEditProteinChange = (newProteins: number) => {
    setEditProteins(newProteins);
    setEditKcal(Math.round(newProteins * 4 + editFats * 9 + editCarbohydrates * 4));
  };

  const handleEditFatChange = (newFats: number) => {
    setEditFats(newFats);
    setEditKcal(Math.round(editProteins * 4 + newFats * 9 + editCarbohydrates * 4));
  };

  const handleEditCarbChange = (newCarbs: number) => {
    setEditCarbohydrates(newCarbs);
    setEditKcal(Math.round(editProteins * 4 + editFats * 9 + newCarbs * 4));
  };

  const isDark = theme === 'dark';
  const t = translations[lang];

  const toggleAccordion = (id: string) => {
    if (editingId === id) {
      // If editing, don't allow accordion collapse until cancel/save
      return;
    }
    if (openAccordion === id) {
      setOpenAccordion(null);
    } else {
      setOpenAccordion(id);
    }
  };

  const startEditing = (item: FoodItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditWeight(item.weightGrams);
    setEditVolume(item.volumeMl);
    setEditProteins(item.proteins);
    setEditFats(item.fats);
    setEditCarbohydrates(item.carbohydrates);
    setEditKcal(item.kcal);
    setEditExplanation(item.explanation || '');
    setBaseItem({
      weightGrams: item.weightGrams,
      volumeMl: item.volumeMl,
      proteins: item.proteins,
      fats: item.fats,
      carbohydrates: item.carbohydrates,
      kcal: item.kcal,
    });
    if (openAccordion !== item.id) {
      setOpenAccordion(item.id);
    }
  };

  // Convert "YYYY-MM-DD" to user-friendly text
  const formatDateFriendly = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
    } catch (e) {}
    return dateStr;
  };

  const getMealCountText = (count: number) => {
    if (lang === 'en') {
      return `${count} ${count === 1 ? t.mealCountSuffix1 : t.mealCountSuffixMany}`;
    }
    // Ukrainian grammar pluralization rules
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) {
      return `${count} ${t.mealCountSuffix1}`;
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return `${count} ${t.mealCountSuffixFew}`;
    }
    return `${count} ${t.mealCountSuffixMany}`;
  };

  return (
    <div 
      id="food-diary-container" 
      className={`rounded-[32px] p-6 flex flex-col h-full border transition-all duration-300 ${
        isDark 
          ? 'bg-[#1A1C1B] border-zinc-800 text-white' 
          : 'bg-white border-[#E2E8E4] text-[#1A1C1B]'
      }`}
    >
      <h3 className={`font-bold mb-5 flex justify-between items-center text-sm uppercase tracking-wider ${
        isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'
      }`}>
        <span>{t.historyOf.replace('{0}', formatDateFriendly(selectedDate))}</span>
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
          isDark ? 'bg-zinc-800 text-[#89FFA0]' : 'bg-[#2D5A27] text-white'
        }`}>
          {getMealCountText(items.length)}
        </span>
      </h3>

      {items.length === 0 ? (
        <div className={`flex-1 flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed rounded-2xl ${
          isDark 
            ? 'border-zinc-800 bg-zinc-900/40 text-zinc-500' 
            : 'border-[#E2E8E4] bg-[#F8FAF9]/80 text-gray-400'
        }`}>
          <Scale className={`w-7 h-7 mb-3 ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`} />
          <p className={`text-sm font-semibold ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{t.emptyDiaryTitle}</p>
          <p className={`text-xs max-w-[220px] mx-auto mt-1 leading-relaxed ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
            {t.emptyDiaryDesc}
          </p>
        </div>
      ) : (
        <div id="diary-meals-list" className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin">
          {items.map((item) => {
            const isOpen = openAccordion === item.id;
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className={`border-b pb-3.5 last:border-0 last:pb-0 ${
                  isDark ? 'border-zinc-800' : 'border-[#E2E8E4]'
                }`}
              >
                {/* Header row */}
                <div
                  onClick={() => toggleAccordion(item.id)}
                  className="flex items-center gap-3.5 cursor-pointer select-none group"
                >
                  {/* Circle number index or image thumb */}
                  {item.imageUrl ? (
                    <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 border ${
                      isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-[#E2E8E4]'
                    }`}>
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                      isDark ? 'bg-zinc-800 text-[#89FFA0]' : 'bg-[#2D5A27] text-white'
                    }`}>
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Descriptions */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate transition-colors ${
                      isDark 
                        ? 'text-white group-hover:text-[#89FFA0]' 
                        : 'text-[#1A1C1B] group-hover:text-[#2D5A27]'
                    }`}>
                      {item.name}
                    </p>
                    <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${
                      isDark ? 'text-zinc-500' : 'text-gray-400'
                    }`}>
                      {item.kcal} {lang === 'ua' ? 'ккал' : 'kcal'} • {item.weightGrams}г {item.volumeMl > 0 ? `• ${item.volumeMl}мл` : ''}
                    </p>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => startEditing(item)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isEditing
                          ? isDark ? 'text-[#89FFA0] bg-[#89FFA0]/10' : 'text-[#2D5A27] bg-[#DCEEE0]/80'
                          : isDark
                            ? 'text-zinc-500 hover:text-[#89FFA0] hover:bg-zinc-800'
                            : 'text-gray-400 hover:text-[#2D5A27] hover:bg-gray-100'
                      }`}
                      title={t.editMeal}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isDark 
                          ? 'text-zinc-500 hover:text-red-400 hover:bg-zinc-800' 
                          : 'text-gray-400 hover:text-red-650 hover:bg-gray-100'
                      }`}
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAccordion(item.id)}
                      disabled={isEditing}
                      className={`p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-30 ${
                        isDark 
                          ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' 
                          : 'text-gray-400 hover:text-zinc-805 hover:bg-gray-100'
                      }`}
                    >
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded layout items */}
                {isOpen && (
                  <div className="mt-3 pl-14 space-y-3 animate-fadeIn text-xs">
                    {isEditing ? (
                      <div className="space-y-3 mt-1 mr-1" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Name Input */}
                        <div>
                          <label className={`block text-[10px] uppercase font-bold mb-1 ${
                            isDark ? 'text-zinc-400' : 'text-zinc-500'
                          }`}>
                            {t.mealNameLabel}
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className={`w-full p-2 text-xs rounded-xl border focus:ring-1 focus:outline-none transition-all ${
                              isDark 
                                ? 'bg-zinc-950 border-zinc-c000 focus:ring-[#89FFA0] text-white border-zinc-800' 
                                : 'bg-white border-[#E2E8E4] focus:ring-[#2D5A27] text-[#1A1C1B]'
                            }`}
                          />
                        </div>

                        {/* Weight & Volume Inputs */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={`block text-[10px] uppercase font-bold mb-1 ${
                              isDark ? 'text-zinc-400' : 'text-zinc-500'
                            }`}>
                              {t.weightG}
                            </label>
                            <input
                              type="number"
                              value={editWeight || ''}
                              onChange={(e) => handleEditWeightChange(Math.max(0, parseFloat(e.target.value) || 0))}
                              className={`w-full p-2 text-xs font-mono rounded-xl border focus:ring-1 focus:outline-none transition-all ${
                                isDark 
                                  ? 'bg-zinc-950 border-zinc-800 focus:ring-[#89FFA0] text-white' 
                                  : 'bg-white border-[#E2E8E4] focus:ring-[#2D5A27] text-[#1A1C1B]'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block text-[10px] uppercase font-bold mb-1 ${
                              isDark ? 'text-zinc-400' : 'text-zinc-500'
                            }`}>
                              {t.volumeMl}
                            </label>
                            <input
                              type="number"
                              value={editVolume || ''}
                              onChange={(e) => handleEditVolumeChange(Math.max(0, parseFloat(e.target.value) || 0))}
                              className={`w-full p-2 text-xs font-mono rounded-xl border focus:ring-1 focus:outline-none transition-all ${
                                isDark 
                                  ? 'bg-zinc-950 border-zinc-800 focus:ring-[#89FFA0] text-white' 
                                  : 'bg-white border-[#E2E8E4] focus:ring-[#2D5A27] text-[#1A1C1B]'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Macros (Proteins, Fats, Carbs) */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className={`block text-[9px] uppercase font-bold mb-1 text-center ${
                              isDark ? 'text-zinc-550' : 'text-zinc-400'
                            }`}>
                              {t.proteins} ({lang === 'ua' ? 'г' : 'g'})
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={editProteins || ''}
                              onChange={(e) => handleEditProteinChange(Math.max(0, parseFloat(e.target.value) || 0))}
                              className={`w-full p-2 text-xs font-mono text-center rounded-xl border focus:ring-1 focus:outline-none transition-all ${
                                isDark 
                                  ? 'bg-zinc-950 border-zinc-800 focus:ring-[#89FFA0] text-[#89FFA0]' 
                                  : 'bg-white border-[#E2E8E4] focus:ring-[#2D5A27] text-[#2D5A27]'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block text-[9px] uppercase font-bold mb-1 text-center ${
                              isDark ? 'text-zinc-550' : 'text-zinc-400'
                            }`}>
                              {t.fats} ({lang === 'ua' ? 'г' : 'g'})
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={editFats || ''}
                              onChange={(e) => handleEditFatChange(Math.max(0, parseFloat(e.target.value) || 0))}
                              className={`w-full p-2 text-xs font-mono text-center rounded-xl border focus:ring-1 focus:outline-none transition-all ${
                                isDark 
                                  ? 'bg-zinc-950 border-zinc-800 focus:ring-[#89FFA0] text-[#34D399]' 
                                  : 'bg-white border-[#E2E8E4] focus:ring-[#2D5A27] text-[#059669]'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block text-[9px] uppercase font-bold mb-1 text-center ${
                              isDark ? 'text-zinc-550' : 'text-zinc-400'
                            }`}>
                              {t.carbs} ({lang === 'ua' ? 'г' : 'g'})
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={editCarbohydrates || ''}
                              onChange={(e) => handleEditCarbChange(Math.max(0, parseFloat(e.target.value) || 0))}
                              className={`w-full p-2 text-xs font-mono text-center rounded-xl border focus:ring-1 focus:outline-none transition-all ${
                                isDark 
                                  ? 'bg-zinc-950 border-zinc-800 focus:ring-[#89FFA0] text-[#A2C3A8]' 
                                  : 'bg-white border-[#E2E8E4] focus:ring-[#2D5A27] text-[#527857]'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Energy Value & Conclusion */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-4">
                            <label className={`block text-[10px] uppercase font-bold mb-1 ${
                              isDark ? 'text-zinc-400' : 'text-zinc-500'
                            }`}>
                              {t.energyVal}
                            </label>
                            <input
                              type="number"
                              value={editKcal || ''}
                              onChange={(e) => setEditKcal(Math.max(0, Math.round(parseFloat(e.target.value) || 0)))}
                              className={`w-full p-2 text-xs font-mono rounded-xl border focus:ring-1 focus:outline-none transition-all ${
                                isDark 
                                  ? 'bg-zinc-950 border-zinc-800 focus:ring-[#89FFA0] text-white' 
                                  : 'bg-white border-[#E2E8E4] focus:ring-[#2D5A27] text-[#1A1C1B]'
                              }`}
                            />
                          </div>
                          <div className="sm:col-span-8">
                            <label className={`block text-[10px] uppercase font-bold mb-1 ${
                              isDark ? 'text-zinc-400' : 'text-zinc-500'
                            }`}>
                              {lang === 'ua' ? 'Висновок ШІ' : 'AI Analysis / Notes'}
                            </label>
                            <input
                              type="text"
                              value={editExplanation}
                              onChange={(e) => setEditExplanation(e.target.value)}
                              className={`w-full p-2 text-xs rounded-xl border focus:ring-1 focus:outline-none transition-all ${
                                isDark 
                                  ? 'bg-zinc-950 border-zinc-800 focus:ring-[#89FFA0] text-white' 
                                  : 'bg-white border-[#E2E8E4] focus:ring-[#2D5A27] text-[#1A1C1B]'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              isDark 
                                ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-350' 
                                : 'bg-gray-100 border-[#E2E8E4] hover:bg-gray-200 text-[#4A5D4E]'
                            }`}
                          >
                            {t.cancel}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated: FoodItem = {
                                ...item,
                                name: editName.trim() || item.name,
                                weightGrams: editWeight,
                                volumeMl: editVolume,
                                proteins: editProteins,
                                fats: editFats,
                                carbohydrates: editCarbohydrates,
                                kcal: editKcal,
                                explanation: editExplanation,
                              };
                              onUpdateItem(item.id, updated);
                              setEditingId(null);
                            }}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-white shadow-xs ${
                              isDark
                                ? 'bg-[#2D5A27] hover:bg-[#1E3E1B] border border-zinc-850'
                                : 'bg-[#2D5A27] hover:bg-[#1E3E1B]'
                            }`}
                          >
                            {t.saveBtn}
                          </button>
                        </div>

                      </div>
                    ) : (
                      <>
                        {/* Nutrient labels grid */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className={`rounded-xl p-2 border text-center ${
                            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-[#F3F7F4] border-[#E2E8E4]/60'
                          }`}>
                            <span className={`block text-[8px] uppercase font-bold text-center ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>{t.proteins}</span>
                            <span className={`font-semibold font-mono ${isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27]'}`}>{item.proteins.toFixed(1)} г</span>
                          </div>
                          <div className={`rounded-xl p-2 border text-center ${
                            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-[#F3F7F4] border-[#E2E8E4]/60'
                          }`}>
                            <span className={`block text-[8px] uppercase font-bold text-center ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>{t.fats}</span>
                            <span className={`font-semibold font-mono ${isDark ? 'text-[#34D399]' : 'text-[#059669]'}`}>{item.fats.toFixed(1)} г</span>
                          </div>
                          <div className={`rounded-xl p-2 border text-center ${
                            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-[#F3F7F4] border-[#E2E8E4]/60'
                          }`}>
                            <span className={`block text-[8px] uppercase font-bold text-center ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>{t.carbs}</span>
                            <span className={`font-semibold font-mono ${isDark ? 'text-[#A2C3A8]' : 'text-[#527857]'}`}>{item.carbohydrates.toFixed(1)} г</span>
                          </div>
                        </div>

                        {/* Ingredients detail */}
                        {item.ingredients && item.ingredients.length > 0 && (
                          <div>
                            <span className={`block text-[9px] font-bold uppercase mb-1 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>{t.mealComponents}</span>
                            <div className={`flex flex-wrap gap-1.5 p-2 rounded-xl max-h-[100px] overflow-y-auto border ${
                              isDark ? 'bg-zinc-950/50 border-zinc-900' : 'bg-[#F8FAF9] border-[#E2E8E4]'
                            }`}>
                              {item.ingredients.map((ing, idx) => (
                                <span 
                                  key={idx} 
                                  className={`text-[10px] py-0.5 px-2 rounded-md font-mono ${
                                    isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-[#E2E8E4]/60 text-zinc-700'
                                  }`}
                                >
                                  {ing.name} ({ing.weight}г)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Diet reasons */}
                        {item.explanation && (
                          <div className={`p-2.5 rounded-xl text-[11px] border leading-normal ${
                            isDark 
                              ? 'bg-[#2D5A27]/10 border-[#2D5A27]/20 text-emerald-100' 
                              : 'bg-[#DCEEE0]/30 border-[#DCEEE0]/80 text-[#2D5A27]'
                          }`}>
                            <p className="italic">
                              <strong className={`block not-italic text-[10px] uppercase mb-0.5 ${isDark ? 'text-[#89FFA0]' : 'text-[#2e6227]'}`}>
                                {t.nutritionistAlert}
                              </strong>
                              <span className={isDark ? 'text-zinc-300' : 'text-zinc-700 font-medium'}>
                                {item.explanation}
                              </span>
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
